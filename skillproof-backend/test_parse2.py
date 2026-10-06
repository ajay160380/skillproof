import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from resumes.models import Resume

latest = Resume.objects.order_by('-uploaded_at').first()
if latest:
    print(f"URL: {latest.file.url if hasattr(latest.file, 'url') else 'No URL'}")
