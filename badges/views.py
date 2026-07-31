from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Badge
from .serializers import BadgeSerializer, PublicBadgeSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MyBadgesListView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Badge.objects.filter(user=self.request.user).order_by('-issued_at')

class PublicUserBadgesListView(generics.ListAPIView):
    serializer_class = PublicBadgeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        return Badge.objects.filter(user_id=user_id).order_by('-issued_at')
