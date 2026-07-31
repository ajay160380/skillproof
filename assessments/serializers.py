from rest_framework import serializers
from .models import TestAttempt, SkillScore
from skills.serializers import SkillTestSerializer

class SkillScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillScore
        fields = '__all__'

class TestAttemptSerializer(serializers.ModelSerializer):
    test = SkillTestSerializer(read_only=True)
    score = SkillScoreSerializer(read_only=True)

    class Meta:
        model = TestAttempt
        fields = '__all__'
        read_only_fields = ('user', 'status', 'started_at', 'completed_at')

class StartAttemptSerializer(serializers.Serializer):
    test_id = serializers.IntegerField()

class SubmitAttemptSerializer(serializers.Serializer):
    recording_url = serializers.CharField(required=False)
    code_submission = serializers.CharField(required=False)
    keystroke_log = serializers.JSONField(required=False)
