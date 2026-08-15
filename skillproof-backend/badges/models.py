import uuid
from django.db import models
from django.conf import settings
from skills.models import SkillCategory
from assessments.models import SkillScore

class Badge(models.Model):
    LEVEL_CHOICES = (
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
    skill_category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name='badges')
    score = models.ForeignKey(SkillScore, on_delete=models.CASCADE)
    badge_level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_pdf_url = models.URLField(max_length=500, null=True, blank=True)
    verification_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return f"{self.user.email} - {self.skill_category.name} ({self.badge_level})"

class UserStats(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gamification_stats')
    total_points = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    highest_streak = models.IntegerField(default=0)
    global_rank = models.IntegerField(null=True, blank=True)
    last_activity_date = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - Points: {self.total_points}"
