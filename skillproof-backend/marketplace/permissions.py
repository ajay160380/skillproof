from rest_framework.permissions import BasePermission

class IsRecruiter(BasePermission):
    """
    Allows access only to recruiter users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'recruiter')
