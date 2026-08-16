from django.utils import timezone
from .models import JobApplication
from badges.models import Badge
from assessments.models import TestAttempt, SkillScore

def update_job_applications(user_id):
    """
    Updates all active JobApplications for a user.
    If all required tests are completed, computes overall_fit_score.
    """
    applications = JobApplication.objects.filter(
        candidate_id=user_id,
        status__in=['not_started', 'in_progress']
    ).select_related('job_listing')

    if not applications.exists():
        return

    # Find highest score for each test taken by user
    user_scores = SkillScore.objects.filter(
        attempt__user_id=user_id,
        attempt__status='completed'
    ).order_by('attempt__test_id', '-overall_score').distinct('attempt__test_id')
    
    best_score_by_test = {score.attempt.test_id: score.overall_score for score in user_scores}

    for app in applications:
        required_test_ids = list(app.job_listing.required_tests.values_list('id', flat=True))
        if not required_test_ids:
            continue
            
        completed_count = 0
        total_score = 0
        
        for t_id in required_test_ids:
            if t_id in best_score_by_test:
                completed_count += 1
                total_score += best_score_by_test[t_id]
                
        if completed_count > 0 and app.status == 'not_started':
            app.status = 'in_progress'
            app.started_at = timezone.now()
            app.save(update_fields=['status', 'started_at'])
            
        if completed_count == len(required_test_ids):
            app.status = 'completed'
            app.completed_at = timezone.now()
            app.overall_fit_score = int(total_score / len(required_test_ids))
            app.save(update_fields=['status', 'completed_at', 'overall_fit_score'])
