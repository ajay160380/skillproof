from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Authenticates a user via either email or username.
    SimpleJWT passes the identifier as the `email` keyword argument 
    because USERNAME_FIELD is 'email'.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        
        # In our setup, SimpleJWT receives {"email": "user_input", "password": "..."}
        # and calls authenticate(email="user_input", password="...")
        identifier = kwargs.get(UserModel.USERNAME_FIELD) or username
            
        if not identifier:
            return None
            
        try:
            # Check if it looks like an email
            if '@' in identifier:
                user = UserModel.objects.get(email__iexact=identifier)
            else:
                user = UserModel.objects.get(username__iexact=identifier)
        except UserModel.DoesNotExist:
            return None
            
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
