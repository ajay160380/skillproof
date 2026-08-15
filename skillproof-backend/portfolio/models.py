from django.db import models
from django.conf import settings

class PortfolioProject(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolio_projects')
    title = models.CharField(max_length=255)
    description = models.TextField()
    project_url = models.URLField(max_length=500, blank=True, null=True)
    repository_url = models.URLField(max_length=500, blank=True, null=True)
    technologies_used = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.user.email}"
