from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Prefetch, Avg, Count, Max
from skills.models import SkillCategory

from .models import RecruiterSavedCandidate
from .serializers import CandidateSearchSerializer, RecruiterSavedCandidateSerializer, SaveCandidateSerializer
from .permissions import IsRecruiter
from badges.models import Badge

User = get_user_model()

class CandidateSearchView(generics.ListAPIView):
    serializer_class = CandidateSearchSerializer
    permission_classes = [IsRecruiter]
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email']

    def get_queryset(self):
        # Base query: only 'candidate' role users
        queryset = User.objects.filter(role='candidate').prefetch_related(
            Prefetch('badges', queryset=Badge.objects.select_related('skill_category', 'score'))
        )
        
        skill_slugs = self.request.query_params.get('skill')
        min_score = self.request.query_params.get('min_score')
        badge_levels = self.request.query_params.get('badge_level')
        min_date = self.request.query_params.get('min_date')
        max_date = self.request.query_params.get('max_date')
        sort_by = self.request.query_params.get('sort_by')

        # We can filter users based on their badges
        if skill_slugs:
            slugs = [s.strip() for s in skill_slugs.split(',') if s.strip()]
            queryset = queryset.filter(badges__skill_category__slug__in=slugs)
        if min_score:
            queryset = queryset.filter(badges__score__overall_score__gte=int(min_score))
        if badge_levels:
            levels = [l.strip() for l in badge_levels.split(',') if l.strip()]
            queryset = queryset.filter(badges__badge_level__in=levels)
        if min_date:
            queryset = queryset.filter(badges__issued_at__gte=min_date)
        if max_date:
            queryset = queryset.filter(badges__issued_at__lte=max_date)

        queryset = queryset.distinct()

        if sort_by == 'highest_score':
            queryset = queryset.annotate(max_score=Max('badges__score__overall_score')).order_by('-max_score')
        elif sort_by == 'recently_verified':
            queryset = queryset.annotate(latest_badge=Max('badges__issued_at')).order_by('-latest_badge')
        elif sort_by == 'alphabetical':
            queryset = queryset.order_by('email')
            
        return queryset

class SavedCandidatesListView(generics.ListAPIView):
    serializer_class = RecruiterSavedCandidateSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return RecruiterSavedCandidate.objects.filter(recruiter=self.request.user).order_by('-saved_at')

class SaveCandidateView(APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        serializer = SaveCandidateSerializer(data=request.data)
        if serializer.is_valid():
            candidate_id = serializer.validated_data['candidate_id']
            notes = serializer.validated_data.get('notes', '')
            
            candidate = get_object_or_404(User, id=candidate_id, role='candidate')
            
            saved_candidate, created = RecruiterSavedCandidate.objects.get_or_create(
                recruiter=request.user,
                candidate=candidate,
                defaults={'notes': notes}
            )
            
            if not created:
                saved_candidate.notes = notes
                saved_candidate.save()
                
            return Response(
                RecruiterSavedCandidateSerializer(saved_candidate).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RemoveSavedCandidateView(generics.DestroyAPIView):
    permission_classes = [IsRecruiter]
    
    def get_queryset(self):
        return RecruiterSavedCandidate.objects.filter(recruiter=self.request.user)

class UnfollowCandidateView(generics.DestroyAPIView):
    permission_classes = [IsRecruiter]
    
    def get_object(self):
        candidate_id = self.kwargs.get('candidate_id')
        return get_object_or_404(RecruiterSavedCandidate, recruiter=self.request.user, candidate_id=candidate_id)

class FollowersCountView(APIView):
    # Candidate permission? Wait, the prompt says "for a candidate, returns how many recruiters follow them"
    # IsRecruiter only allows recruiters. We need a permission that allows candidates.
    from rest_framework.permissions import IsAuthenticated
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'candidate':
            return Response({"error": "Only candidates can view their followers count"}, status=403)
        count = RecruiterSavedCandidate.objects.filter(candidate=request.user).count()
        return Response({'followers_count': count})

class DashboardStatsView(APIView):
    permission_classes = [IsRecruiter]

    def get(self, request):
        total_candidates = User.objects.filter(role='candidate', badges__isnull=False).distinct().count()
        candidates_saved = RecruiterSavedCandidate.objects.filter(recruiter=request.user).count()
        avg_score = Badge.objects.aggregate(avg=Avg('score__overall_score'))['avg']
        
        trending_skills = SkillCategory.objects.annotate(
            badge_count=Count('badges')
        ).order_by('-badge_count')[:5]
        
        return Response({
            'total_verified_candidates': total_candidates,
            'candidates_saved': candidates_saved,
            'average_verified_score': round(avg_score, 1) if avg_score else 0,
            'trending_skills': [{'name': s.name, 'slug': s.slug, 'count': s.badge_count} for s in trending_skills]
        })

class CandidateDetailView(generics.RetrieveAPIView):
    serializer_class = CandidateSearchSerializer
    permission_classes = [IsRecruiter]
    
    def get_queryset(self):
        return User.objects.filter(role='candidate').prefetch_related(
            Prefetch('badges', queryset=Badge.objects.select_related('skill_category', 'score').order_by('-issued_at'))
        )
        
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['detail'] = True
        return context

from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from .serializers import FollowerSerializer

class FollowersListPagination(PageNumberPagination):
    page_size = 20

class FollowersListView(generics.ListAPIView):
    serializer_class = FollowerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = FollowersListPagination
    
    def get_queryset(self):
        if self.request.user.role != 'candidate':
            return RecruiterSavedCandidate.objects.none()
        return RecruiterSavedCandidate.objects.filter(
            candidate=self.request.user
        ).select_related('recruiter').order_by('-saved_at')
