from django.contrib import admin
from .models import RecruiterSavedCandidate

@admin.register(RecruiterSavedCandidate)
class RecruiterSavedCandidateAdmin(admin.ModelAdmin):
    list_display = ('recruiter', 'candidate', 'saved_at')
    search_fields = ('recruiter__email', 'candidate__email')
