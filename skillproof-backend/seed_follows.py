import os
import django

# Script to seed the database with sample followers (recruiters following a candidate)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from marketplace.models import RecruiterSavedCandidate

User = get_user_model()
candidate = User.objects.filter(role='candidate').first()
recruiters = User.objects.filter(role='recruiter')[:3]

if candidate:
    for r in recruiters:
        RecruiterSavedCandidate.objects.get_or_create(recruiter=r, candidate=candidate, defaults={'notes': 'Great profile!'})
    print(f"Added {recruiters.count()} followers for candidate {candidate.email}")
else:
    print("No candidate found to add followers to.")
