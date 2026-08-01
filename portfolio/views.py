from rest_framework import viewsets, permissions
from .models import PortfolioProject
from .serializers import PortfolioProjectSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance must have an attribute named `user`.
        return obj.user == request.user

class PortfolioProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing portfolio projects.
    """
    serializer_class = PortfolioProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        Optionally restricts the returned projects to a given user,
        by filtering against a `user_id` query parameter in the URL.
        """
        queryset = PortfolioProject.objects.all()
        user_id = self.request.query_params.get('user_id')
        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
