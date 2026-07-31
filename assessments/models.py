from django.db import models
from django.conf import settings
from skills.models import SkillTest

class TestAttempt(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts')
    test = models.ForeignKey(SkillTest, on_delete=models.CASCADE, related_name='attempts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(max_length=500, null=True, blank=True)
    code_submission = models.TextField(null=True, blank=True)
    keystroke_log = models.JSONField(null=True, blank=True)
    raw_transcript = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.test.title} ({self.status})"

class SkillScore(models.Model):
    attempt = models.OneToOneField(TestAttempt, on_delete=models.CASCADE, related_name='score')
    overall_score = models.IntegerField()
    sub_scores = models.JSONField()
    ai_feedback_text = models.TextField()
    cheating_flags = models.JSONField(null=True, blank=True)
    scoring_method = models.CharField(max_length=20, default='ai')
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Score for {self.attempt} - {self.overall_score}"
