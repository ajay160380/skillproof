from django.db import models
from django.utils.text import slugify

class SkillCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    icon = models.CharField(max_length=50)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class SkillTest(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    TEST_TYPE_CHOICES = (
        ('coding', 'Coding'),
        ('communication', 'Communication'),
        ('screen_task', 'Screen Task'),
    )

    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name='tests')
    title = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration_minutes = models.IntegerField()
    instructions = models.TextField()
    test_type = models.CharField(max_length=20, choices=TEST_TYPE_CHOICES)
    problem_statement = models.TextField(blank=True, null=True)
    test_cases = models.JSONField(blank=True, null=True)
    interview_questions = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.category.name})"
