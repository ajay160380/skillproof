from django.urls import path
from .views import ResumeUploadView, MyResumeView, SuggestedTestsView

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('my-resume/', MyResumeView.as_view(), name='my-resume'),
    path('suggested-tests/', SuggestedTestsView.as_view(), name='suggested-tests'),
]
