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

from badges.models import UserStats, Badge
from .models import DirectInvite
from .serializers import DirectInviteSerializer
from django.db.models import Prefetch

class TalentMatchView(APIView):
    permission_classes = [IsRecruiter]

    def get(self, request):
        skill_id = request.query_params.get('skill_id')
        min_score = request.query_params.get('min_score', 0)
        
        candidates_query = UserStats.objects.exclude(user__role='recruiter')
        
        if skill_id:
            # Filter users who have a badge in this skill category with >= min_score
            candidates_query = candidates_query.filter(
                user__badges__skill_category_id=skill_id,
                user__badges__score__overall_score__gte=min_score
            ).distinct()
            
        candidates_query = candidates_query.order_by('-total_points')[:50]
        
        results = []
        for stat in candidates_query:
            # get their top badges
            badges = Badge.objects.filter(user=stat.user).order_by('-score__overall_score')[:3]
            badges_data = [{
                'skill_name': b.skill_category.name,
                'badge_level': b.badge_level,
                'score': b.score.overall_score if hasattr(b, 'score') and b.score else 0
            } for b in badges]
            
            results.append({
                'user_id': stat.user.id,
                'name': stat.user.full_name,
                'email': stat.user.email,
                'total_points': stat.total_points,
                'global_rank': stat.global_rank,
                'top_skills': badges_data
            })
            
        return Response(results)

class SendInviteView(APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        candidate_id = request.data.get('candidate_id')
        job_listing_id = request.data.get('job_listing_id')
        message = request.data.get('message', '')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        candidate = get_object_or_404(User, id=candidate_id, role='candidate')
        job_listing = None
        if job_listing_id:
            job_listing = get_object_or_404(JobListing, id=job_listing_id, recruiter=request.user)
            
        invite, created = DirectInvite.objects.get_or_create(
            recruiter=request.user,
            candidate=candidate,
            job_listing=job_listing,
            defaults={'message': message}
        )
        
        return Response(DirectInviteSerializer(invite).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class MyInvitesView(generics.ListAPIView):
    serializer_class = DirectInviteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter':
            return DirectInvite.objects.filter(recruiter=user).order_by('-created_at')
        return DirectInvite.objects.filter(candidate=user).order_by('-created_at')

from .models import Interview
from .serializers import InterviewSerializer
from rest_framework.permissions import AllowAny

class ProposeInterviewView(APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        candidate_id = request.data.get('candidate_id')
        job_listing_id = request.data.get('job_listing_id')
        proposed_time = request.data.get('proposed_time')
        message = request.data.get('message', '')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        candidate = get_object_or_404(User, id=candidate_id, role='candidate')
        job_listing = None
        if job_listing_id:
            job_listing = get_object_or_404(JobListing, id=job_listing_id, recruiter=request.user)
            
        interview = Interview.objects.create(
            recruiter=request.user,
            candidate=candidate,
            job_listing=job_listing,
            proposed_time=proposed_time,
            message=message,
            status='proposed'
        )
        
        return Response(InterviewSerializer(interview).data, status=status.HTTP_201_CREATED)

class MyInterviewsView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter':
            return Interview.objects.filter(recruiter=user).order_by('proposed_time')
        return Interview.objects.filter(candidate=user).order_by('proposed_time')

class RespondInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, candidate=request.user)
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'declined']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        interview.status = new_status
        interview.save()
        
        return Response(InterviewSerializer(interview).data, status=status.HTTP_200_OK)
