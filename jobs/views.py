from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import JobListing, JobApplication
from .serializers import JobListingSerializer, JobApplicationSerializer, JobApplicantSerializer
from marketplace.permissions import IsRecruiter
from django.utils import timezone
from .services import update_job_applications

class JobCreateView(generics.CreateAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsRecruiter]

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

class JobListView(generics.ListAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['role_title', 'company_name']

    def get_queryset(self):
        return JobListing.objects.filter(is_active=True).order_by('-created_at')

class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return JobListing.objects.filter(is_active=True)

class JobApplyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        if request.user.role != 'candidate':
            return Response({"error": "Only candidates can apply to jobs"}, status=status.HTTP_403_FORBIDDEN)
            
        job = get_object_or_404(JobListing, pk=pk, is_active=True)
        app, created = JobApplication.objects.get_or_create(
            candidate=request.user,
            job_listing=job
        )
        
        # Manually trigger a progress update in case they already took tests
        update_job_applications(request.user.id)
        
        # Fetch it fresh after update
        app.refresh_from_db()
        return Response(JobApplicationSerializer(app).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

class JobProgressView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        if request.user.role != 'candidate':
            return Response({"error": "Only candidates have job progress"}, status=status.HTTP_403_FORBIDDEN)
            
        app = get_object_or_404(JobApplication, job_listing_id=pk, candidate=request.user)
        
        # We can also return a list of completed test IDs here to help the frontend
        from assessments.models import SkillScore
        scores = SkillScore.objects.filter(
            attempt__user=request.user,
            attempt__status='completed'
        ).values_list('attempt__test_id', flat=True)
        
        data = JobApplicationSerializer(app).data
        data['completed_test_ids'] = list(set(scores))
        
        return Response(data)

class RecruiterJobListView(generics.ListAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsRecruiter]
    
    def get_queryset(self):
        return JobListing.objects.filter(recruiter=self.request.user).order_by('-created_at')

class RecruiterJobApplicantsView(generics.ListAPIView):
    serializer_class = JobApplicantSerializer
    permission_classes = [IsRecruiter]
    
    def get_queryset(self):
        job_id = self.kwargs.get('pk')
        job = get_object_or_404(JobListing, pk=job_id, recruiter=self.request.user)
        from django.db.models import F
        return JobApplication.objects.filter(job_listing=job).order_by(F('overall_fit_score').desc(nulls_last=True), '-completed_at')

from .models import CompanyRequirement
from .serializers import CompanyRequirementSerializer

class CompanyRequirementView(APIView):
    permission_classes = [IsRecruiter]
    
    def get(self, request):
        req, _ = CompanyRequirement.objects.get_or_create(
            recruiter=request.user,
            defaults={'company_name': request.user.company_name or ''}
        )
        return Response(CompanyRequirementSerializer(req).data)
        
    def put(self, request):
        req, _ = CompanyRequirement.objects.get_or_create(
            recruiter=request.user,
            defaults={'company_name': request.user.company_name or ''}
        )
        serializer = CompanyRequirementSerializer(req, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class PublicCompanyRequirementView(generics.RetrieveAPIView):
    serializer_class = CompanyRequirementSerializer
    permission_classes = []
    
    def get_object(self):
        recruiter_id = self.kwargs.get('recruiter_id')
        return get_object_or_404(CompanyRequirement, recruiter_id=recruiter_id)
