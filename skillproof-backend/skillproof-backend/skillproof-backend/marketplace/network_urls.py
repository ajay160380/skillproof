from django.urls import path
from .views import SaveCandidateView, SavedCandidatesListView, UnfollowCandidateView, FollowersCountView, FollowersListView

urlpatterns = [
    path('follow/', SaveCandidateView.as_view(), name='network_follow'),
    path('unfollow/<int:candidate_id>/', UnfollowCandidateView.as_view(), name='network_unfollow'),
    path('my-follows/', SavedCandidatesListView.as_view(), name='network_my_follows'),
    path('followers-count/', FollowersCountView.as_view(), name='network_followers_count'),
    path('followers/', FollowersListView.as_view(), name='network_followers_list'),
]
