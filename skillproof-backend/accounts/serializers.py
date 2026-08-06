from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'full_name', 'role', 'avatar_url', 'cover_image', 'bio', 'headline', 'location', 'company_name', 'is_verified', 'created_at')
        read_only_fields = ('id', 'is_verified', 'created_at')

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True, min_length=3, max_length=150)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    full_name = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_username(self, value):
        import re
        if not re.match(r'^[\w]+$', value):
            raise serializers.ValidationError('Username can only contain letters, numbers, and underscores.')
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value
    
    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'full_name', 'role', 'company_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'candidate'),
            company_name=validated_data.get('company_name', '')
        )
        return user
