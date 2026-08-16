import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.views import UserProfileView
from django.contrib.auth import get_user_model

User = get_user_model()
user, _ = User.objects.get_or_create(email="test@example.com", username="testuser")

factory = RequestFactory()
file = SimpleUploadedFile("avatar.jpg", b"file_content", content_type="image/jpeg")
request = factory.patch('/api/auth/me/', {'avatar_url': file})
request.user = user

view = UserProfileView.as_view()
response = view(request)
print(response.status_code)
print(response.data)
