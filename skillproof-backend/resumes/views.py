from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Resume
from .serializers import ResumeSerializer, ResumeUploadSerializer
from .tasks import process_resume_skills
from skills.models import SkillTest
from skills.utils import match_skills_to_tests

class ResumeUploadView(generics.CreateAPIView):
    serializer_class = ResumeUploadSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resume = serializer.save(user=request.user)
        
        # Dispatch Celery task
        process_resume_skills.delay(resume.id)
        
        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)

class MyResumeView(generics.RetrieveAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return Resume.objects.filter(user=self.request.user).order_by('-uploaded_at').first()

    def get(self, request, *args, **kwargs):
        resume = self.get_object()
        if not resume:
            return Response({"detail": "No resume found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(resume)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        resume = self.get_object()
        if resume:
            resume.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SuggestedTestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
        if not resume or not resume.extracted_skills:
            return Response([])
            
        matched_tests = match_skills_to_tests(resume.extracted_skills)
        
        # We need a serializer for SkillTest, let's just return basic info
        tests_data = []
        for test in matched_tests:
            tests_data.append({
                'id': test.id,
                'title': test.title,
                'category': test.category.name,
                'category_slug': test.category.slug,
                'difficulty': test.difficulty,
                'duration_minutes': test.duration_minutes,
                'test_type': test.test_type
            })
            
        return Response(tests_data)
