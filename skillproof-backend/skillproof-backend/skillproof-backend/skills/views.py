from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import SkillCategory, SkillTest
from .serializers import SkillCategorySerializer, SkillTestSerializer

class SkillCategoryListView(generics.ListAPIView):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # usually we want all categories at once

class SkillTestListView(generics.ListAPIView):
    serializer_class = SkillTestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = SkillTest.objects.filter(is_active=True)
        category_slug = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        return queryset

class SkillTestDetailView(generics.RetrieveAPIView):
    queryset = SkillTest.objects.filter(is_active=True)
    serializer_class = SkillTestSerializer
    permission_classes = [AllowAny]
