from rest_framework import serializers
from .models import SkillCategory, SkillTest

class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = '__all__'

class SkillTestSerializer(serializers.ModelSerializer):
    category = SkillCategorySerializer(read_only=True)
    
    class Meta:
        model = SkillTest
        fields = '__all__'
