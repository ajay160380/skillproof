from django.urls import path
from .views import MyBadgesListView, PublicUserBadgesListView, LeaderboardListView, MyStatsView, VerifyBadgeView

urlpatterns = [
    path('my-badges/', MyBadgesListView.as_view(), name='my_badges'),
    path('my-stats/', MyStatsView.as_view(), name='my_stats'),
    path('leaderboard/', LeaderboardListView.as_view(), name='leaderboard'),
    path('user/<int:user_id>/public/', PublicUserBadgesListView.as_view(), name='public_badges'),
    path('verify/<uuid:verification_id>/', VerifyBadgeView.as_view(), name='verify_badge'),
]
