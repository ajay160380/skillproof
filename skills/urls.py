from django.urls import path
from .views import SkillCategoryListView, SkillTestListView, SkillTestDetailView

urlpatterns = [
    path('categories/', SkillCategoryListView.as_view(), name='category-list'),
    path('tests/', SkillTestListView.as_view(), name='test-list'),
    path('tests/<int:pk>/', SkillTestDetailView.as_view(), name='test-detail'),
]
