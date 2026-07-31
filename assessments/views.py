import random
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import TestAttempt, SkillScore
from .serializers import TestAttemptSerializer, StartAttemptSerializer, SubmitAttemptSerializer
from skills.models import SkillTest
from .tasks import process_test_attempt

class MyAttemptsListView(generics.ListAPIView):
    serializer_class = TestAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.filter(user=self.request.user).order_by('-started_at')

class AttemptDetailView(generics.RetrieveAPIView):
    serializer_class = TestAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.filter(user=self.request.user)

class StartAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartAttemptSerializer(data=request.data)
        if serializer.is_valid():
            test_id = serializer.validated_data['test_id']
            test = get_object_or_404(SkillTest, id=test_id, is_active=True)
            
            attempt = TestAttempt.objects.create(
                user=request.user,
                test=test,
                status='in_progress',
                started_at=timezone.now()
            )
            return Response({'attempt_id': attempt.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubmitAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        attempt = get_object_or_404(TestAttempt, pk=pk, user=request.user)
        
        if attempt.status != 'in_progress':
            return Response({"error": "Only in_progress attempts can be submitted."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle audio file upload for communication tests
        audio_file = request.FILES.get('audio_file')
        if audio_file:
            import os
            from django.conf import settings as django_settings
            recordings_dir = os.path.join(django_settings.MEDIA_ROOT, 'recordings')
            os.makedirs(recordings_dir, exist_ok=True)
            
            file_name = f'attempt_{attempt.id}_{audio_file.name}'
            file_path = os.path.join(recordings_dir, file_name)
            
            with open(file_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)
            
            attempt.recording_url = file_path
        
        # Handle other fields from JSON payload
        serializer = SubmitAttemptSerializer(data=request.data)
        if serializer.is_valid():
            attempt.recording_url = serializer.validated_data.get('recording_url', attempt.recording_url)
            attempt.code_submission = serializer.validated_data.get('code_submission', attempt.code_submission)
            attempt.keystroke_log = serializer.validated_data.get('keystroke_log', attempt.keystroke_log)
        
        attempt.status = 'processing'
        attempt.completed_at = timezone.now()
        attempt.save()

        # Dispatch Celery task
        process_test_attempt.delay(attempt.id)

        return Response({
            "message": "Attempt submitted successfully and is processing.", 
            "status": "processing",
            "attempt_id": attempt.id
        }, status=status.HTTP_200_OK)

class StatusCheckView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        attempt = get_object_or_404(TestAttempt, pk=pk, user=request.user)
        return Response({'status': attempt.status})
