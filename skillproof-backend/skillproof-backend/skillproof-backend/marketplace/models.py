from django.db import models
from django.conf import settings

class RecruiterSavedCandidate(models.Model):
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_candidates')
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_by_recruiters')
    saved_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('recruiter', 'candidate')

    def __str__(self):
        return f"{self.recruiter.email} saved {self.candidate.email}"
