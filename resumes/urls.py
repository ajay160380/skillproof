from django.urls import path
from .views import ResumeUploadView, MyResumeView, SuggestedTestsView, ResumeViewFileView

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('my-resume/', MyResumeView.as_view(), name='my-resume'),
    path('view/', ResumeViewFileView.as_view(), name='resume-view-file'),
    path('suggested-tests/', SuggestedTestsView.as_view(), name='suggested-tests'),
]
