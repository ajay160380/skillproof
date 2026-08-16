import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@skillproof.com').exists():
    User.objects.create_superuser('admin@skillproof.com', 'admin@skillproof.com', 'Admin@1234')
    print("Superuser created successfully.")
else:
    print("Superuser already exists.")
