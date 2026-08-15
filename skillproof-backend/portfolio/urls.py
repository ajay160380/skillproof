from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioProjectViewSet

router = DefaultRouter()
router.register(r'projects', PortfolioProjectViewSet, basename='portfolio-project')

urlpatterns = [
    path('', include(router.urls)),
]
