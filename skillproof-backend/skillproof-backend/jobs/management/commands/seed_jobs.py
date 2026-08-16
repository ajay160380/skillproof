from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import JobListing
from skills.models import SkillTest

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial Job Listing for testing'

    def handle(self, *args, **kwargs):
        recruiter = User.objects.filter(role='recruiter').first()
        if not recruiter:
            self.stdout.write(self.style.ERROR('No recruiter found. Please create one first.'))
            return

        tests = SkillTest.objects.all()[:2]
        if not tests:
            self.stdout.write(self.style.ERROR('No SkillTests found. Cannot create Job Listing.'))
            return

        job, created = JobListing.objects.get_or_create(
            recruiter=recruiter,
            company_name="TechCorp Inc.",
            role_title="Frontend Developer",
            description="We are looking for a strong frontend developer who has verified skills in both coding and communication. You will work on our core React application.",
            location="San Francisco, CA (Remote)",
            salary_range="$120k - $150k",
        )
        
        job.required_tests.set(tests)
        job.save()

        if created:
            self.stdout.write(self.style.SUCCESS('Successfully created Job Listing: Frontend Developer at TechCorp Inc.'))
        else:
            self.stdout.write(self.style.SUCCESS('Job Listing already exists.'))
