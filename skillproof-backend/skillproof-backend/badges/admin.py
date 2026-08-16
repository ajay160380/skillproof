from django.contrib import admin
from .models import Badge

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill_category', 'badge_level', 'issued_at')
    list_filter = ('badge_level', 'skill_category')
    search_fields = ('user__email', 'skill_category__name')
