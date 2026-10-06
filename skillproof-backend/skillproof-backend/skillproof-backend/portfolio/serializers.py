from rest_framework import serializers
from .models import PortfolioProject

class PortfolioProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioProject
        fields = [
            'id', 'user', 'title', 'description', 'project_url',
            'repository_url', 'technologies_used', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def create(self, validated_data):
        # We'll set the user in the view's perform_create method
        return super().create(validated_data)
