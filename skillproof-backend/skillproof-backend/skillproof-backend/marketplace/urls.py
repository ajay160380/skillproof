from django.urls import path
from .views import CandidateSearchView, SaveCandidateView, SavedCandidatesListView, RemoveSavedCandidateView, DashboardStatsView, CandidateDetailView

urlpatterns = [
    path('candidates/', CandidateSearchView.as_view(), name='search_candidates'),
    path('candidates/<int:pk>/', CandidateDetailView.as_view(), name='candidate_detail'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('save-candidate/', SaveCandidateView.as_view(), name='save_candidate'),
    path('saved/', SavedCandidatesListView.as_view(), name='saved_candidates'),
    path('saved/<int:pk>/', RemoveSavedCandidateView.as_view(), name='remove_saved_candidate'),
]
