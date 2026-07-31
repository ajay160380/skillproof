from django.urls import path
from .views import MyBadgesListView, PublicUserBadgesListView

urlpatterns = [
    path('my-badges/', MyBadgesListView.as_view(), name='my_badges'),
    path('user/<int:user_id>/public/', PublicUserBadgesListView.as_view(), name='public_badges'),
]
