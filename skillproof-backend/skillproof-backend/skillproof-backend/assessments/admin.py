from django.contrib import admin
from .models import TestAttempt, SkillScore

class SkillScoreInline(admin.StackedInline):
    model = SkillScore
    extra = 0

@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'test', 'status', 'started_at', 'completed_at')
    list_filter = ('status', 'test__category')
    search_fields = ('user__email', 'test__title')
    inlines = [SkillScoreInline]

@admin.register(SkillScore)
class SkillScoreAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'overall_score', 'generated_at')
    list_filter = ('overall_score',)
