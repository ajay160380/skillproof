from django.urls import path
from .views import (
    JobCreateView, JobListView, JobDetailView, JobApplyView,
    JobProgressView, RecruiterJobListView, RecruiterJobApplicantsView,
    CompanyRequirementView, PublicCompanyRequirementView
)

urlpatterns = [
    path('', JobListView.as_view(), name='job-list'),
    path('create/', JobCreateView.as_view(), name='job-create'),
    path('my-listings/', RecruiterJobListView.as_view(), name='recruiter-jobs'),
    path('my-listings/<int:pk>/applicants/', RecruiterJobApplicantsView.as_view(), name='recruiter-job-applicants'),
    path('company-requirements/', CompanyRequirementView.as_view(), name='company-requirements'),
    path('company-requirements/<int:recruiter_id>/', PublicCompanyRequirementView.as_view(), name='public-company-requirements'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/apply/', JobApplyView.as_view(), name='job-apply'),
    path('<int:pk>/my-progress/', JobProgressView.as_view(), name='job-progress'),
]
