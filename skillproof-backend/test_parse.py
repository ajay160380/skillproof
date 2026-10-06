import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from resumes.models import Resume
from resumes.tasks import process_resume_skills
import traceback

latest = Resume.objects.order_by('-uploaded_at').first()
if latest:
    print(f"Processing resume {latest.id}...")
    try:
        process_resume_skills(latest.id)
    except Exception as e:
        traceback.print_exc()
    latest.refresh_from_db()
    print("Status:", latest.parsing_status)
else:
    print("No resume found")
