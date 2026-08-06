from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer
from badges.serializers import BadgeSerializer
from .models import UserFollow, Post, PostLike, Comment

User = get_user_model()

class UserFollowSerializer(serializers.ModelSerializer):
    follower_detail = UserSerializer(source='follower', read_only=True)
    following_detail = UserSerializer(source='following', read_only=True)

    class Meta:
        model = UserFollow
        fields = ('id', 'follower', 'following', 'created_at', 'follower_detail', 'following_detail')
        read_only_fields = ('follower',)

class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'post', 'author', 'author_detail', 'content', 'created_at')
        read_only_fields = ('author', 'post')

class PostSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)
    linked_badge_detail = BadgeSerializer(source='linked_badge', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            'id', 'author', 'author_detail', 'content', 'image',
            'linked_badge', 'linked_badge_detail', 'created_at',
            'likes_count', 'comments_count', 'is_liked'
        )
        read_only_fields = ('author',)

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=request.user).exists()
        return False
