from rest_framework import serializers
from .models import RecruiterSavedCandidate
from django.contrib.auth import get_user_model
from badges.serializers import PublicBadgeSerializer

User = get_user_model()

class CandidateSearchSerializer(serializers.ModelSerializer):
    public_badges = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'bio', 'public_badges')

    def get_public_badges(self, obj):
        from badges.models import Badge
        badges = Badge.objects.filter(user=obj).select_related('skill_category', 'score')
        
        if self.context.get('detail'):
            return PublicBadgeSerializer(badges.order_by('-issued_at'), many=True).data

        best_badges = {}
        level_map = {'bronze': 1, 'silver': 2, 'gold': 3, 'platinum': 4}
        
        for b in badges:
            cat_id = b.skill_category_id
            if cat_id not in best_badges:
                best_badges[cat_id] = b
            else:
                curr_best = best_badges[cat_id]
                # Compare tiers
                if level_map.get(b.badge_level, 0) > level_map.get(curr_best.badge_level, 0):
                    best_badges[cat_id] = b
                elif level_map.get(b.badge_level, 0) == level_map.get(curr_best.badge_level, 0):
                    # If same tier, keep the newest
                    if b.issued_at > curr_best.issued_at:
                        best_badges[cat_id] = b
                        
        final_badges = list(best_badges.values())
        final_badges.sort(key=lambda x: x.issued_at, reverse=True)
        return PublicBadgeSerializer(final_badges, many=True).data

class RecruiterSavedCandidateSerializer(serializers.ModelSerializer):
    candidate_detail = CandidateSearchSerializer(source='candidate', read_only=True)
    
    class Meta:
        model = RecruiterSavedCandidate
        fields = ('id', 'candidate', 'candidate_detail', 'saved_at', 'notes')
        read_only_fields = ('recruiter', 'saved_at')

class SaveCandidateSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)

class FollowerSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.CharField(source='recruiter.full_name', read_only=True)
    company_name = serializers.CharField(source='recruiter.company_name', read_only=True)
    avatar_url = serializers.CharField(source='recruiter.avatar_url', read_only=True)
    
    class Meta:
        model = RecruiterSavedCandidate
        fields = ('id', 'recruiter_name', 'company_name', 'avatar_url', 'saved_at')
