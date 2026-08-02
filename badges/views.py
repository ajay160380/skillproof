from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Badge, UserStats
from .serializers import BadgeSerializer, PublicBadgeSerializer, UserStatsSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response

User = get_user_model()

class LeaderboardListView(generics.ListAPIView):
    serializer_class = UserStatsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return UserStats.objects.all().order_by('-total_points')[:50]

class MyStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats, created = UserStats.objects.get_or_create(user=request.user)
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)

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

class VerifyBadgeView(generics.RetrieveAPIView):
    serializer_class = PublicBadgeSerializer
    permission_classes = [AllowAny]
    lookup_field = 'verification_id'
    
    def get_queryset(self):
        return Badge.objects.all()
