from rest_framework import serializers
from .models import JobListing, JobApplication, CompanyRequirement
from skills.models import SkillTest
from skills.serializers import SkillTestSerializer

class JobListingSerializer(serializers.ModelSerializer):
    required_tests = SkillTestSerializer(many=True, read_only=True)
    required_test_ids = serializers.PrimaryKeyRelatedField(
        queryset=SkillTest.objects.all(), 
        source='required_tests', 
        many=True, 
        write_only=True
    )

    recruiter_id = serializers.IntegerField(source='recruiter.id', read_only=True)

    class Meta:
        model = JobListing
        fields = ['id', 'recruiter_id', 'company_name', 'role_title', 'description', 'required_tests', 'required_test_ids', 'is_active', 'created_at', 'application_deadline']
        read_only_fields = ['id', 'created_at']

class JobApplicationSerializer(serializers.ModelSerializer):
    job_listing = JobListingSerializer(read_only=True)
    job_listing_id = serializers.PrimaryKeyRelatedField(
        queryset=JobListing.objects.filter(is_active=True),
        source='job_listing',
        write_only=True
    )

    class Meta:
        model = JobApplication
        fields = ['id', 'job_listing', 'job_listing_id', 'status', 'overall_fit_score', 'started_at', 'completed_at']
        read_only_fields = ['id', 'status', 'overall_fit_score', 'started_at', 'completed_at']

class JobApplicantSerializer(serializers.ModelSerializer):
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = ['id', 'candidate_id', 'candidate_email', 'status', 'overall_fit_score', 'completed_at']

from skills.models import SkillCategory
from skills.serializers import SkillCategorySerializer

class CompanyRequirementSerializer(serializers.ModelSerializer):
    required_skills = SkillCategorySerializer(many=True, read_only=True)
    required_skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=SkillCategory.objects.all(),
        source='required_skills',
        many=True,
        write_only=True
    )
    recruiter_name = serializers.CharField(source='recruiter.full_name', read_only=True)

    class Meta:
        model = CompanyRequirement
        fields = ['id', 'recruiter_name', 'company_name', 'company_description', 'required_skills', 'required_skill_ids', 'preferred_min_score', 'updated_at']
        read_only_fields = ['id', 'updated_at']

