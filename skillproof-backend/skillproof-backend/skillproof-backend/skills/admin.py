from django.contrib import admin
from .models import SkillCategory, SkillTest

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(SkillTest)
class SkillTestAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'test_type', 'is_active')
    list_filter = ('category', 'difficulty', 'test_type', 'is_active')
    search_fields = ('title', 'category__name')
