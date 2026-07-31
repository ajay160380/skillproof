from rest_framework import serializers
from .models import Badge
from skills.serializers import SkillCategorySerializer

class BadgeSerializer(serializers.ModelSerializer):
    skill_category = SkillCategorySerializer(read_only=True)
    
    class Meta:
        model = Badge
        fields = '__all__'

class PublicBadgeSerializer(serializers.ModelSerializer):
    skill_category = SkillCategorySerializer(read_only=True)
    overall_score = serializers.IntegerField(source='score.overall_score', read_only=True, default=80)
    sub_scores = serializers.JSONField(source='score.sub_scores', read_only=True)
    ai_feedback_text = serializers.CharField(source='score.ai_feedback_text', read_only=True)
    cheating_flags = serializers.JSONField(source='score.cheating_flags', read_only=True)
    
    class Meta:
        model = Badge
        fields = ('id', 'skill_category', 'badge_level', 'overall_score', 'sub_scores', 'ai_feedback_text', 'cheating_flags', 'issued_at', 'certificate_pdf_url', 'verification_id')
