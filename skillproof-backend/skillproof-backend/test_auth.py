import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
User = get_user_model()

# Create a test user with a custom username
try:
    user = User.objects.create_user(username='test_ninja', email='ninja@test.com', password='password123')
    print("User created successfully.")
except Exception as e:
    print(f"User creation failed or already exists: {e}")

# Authenticate with email
user1 = authenticate(email='ninja@test.com', password='password123')
print(f"Auth with email: {'Success' if user1 else 'Failed'}")

# Authenticate with username
user2 = authenticate(email='test_ninja', password='password123')
print(f"Auth with username: {'Success' if user2 else 'Failed'}")
