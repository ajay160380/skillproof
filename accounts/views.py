from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        if email and User.objects.filter(email=email).exists():
            return Response({"error": "Account already exists. Please log in."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class CheckUsernameView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, *args, **kwargs):
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        import re
        if not re.match(r'^[\w]+$', username):
            return Response({"available": False, "error": "Letters, numbers, and underscores only"}, status=status.HTTP_200_OK)
            
        exists = User.objects.filter(username__iexact=username).exists()
        return Response({"available": not exists}, status=status.HTTP_200_OK)
