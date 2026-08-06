from rest_framework import generics, views, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import UserFollow, Post, PostLike, Comment
from .serializers import UserFollowSerializer, PostSerializer, CommentSerializer
from accounts.serializers import UserSerializer

User = get_user_model()

class SearchCandidatesView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        if q:
            return User.objects.filter(
                Q(full_name__icontains=q) | Q(username__icontains=q),
                role='candidate'
            ).exclude(id=self.request.user.id)[:20]
        else:
            # Suggested candidates (e.g. recent candidates)
            return User.objects.filter(role='candidate').exclude(id=self.request.user.id).order_by('-created_at')[:10]

class FollowUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if int(user_id) == request.user.id:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            following_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        follow, created = UserFollow.objects.get_or_create(
            follower=request.user,
            following=following_user
        )
        
        return Response({'success': True, 'created': created}, status=status.HTTP_201_CREATED)

class UnfollowUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id, *args, **kwargs):
        try:
            follow = UserFollow.objects.get(follower=request.user, following_id=user_id)
            follow.delete()
            return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)
        except UserFollow.DoesNotExist:
            return Response({'error': 'Not following this user'}, status=status.HTTP_404_NOT_FOUND)

class MyFollowingView(generics.ListAPIView):
    serializer_class = UserFollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserFollow.objects.filter(follower=self.request.user).select_related('following')

class MyFollowersView(generics.ListAPIView):
    serializer_class = UserFollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserFollow.objects.filter(following=self.request.user).select_related('follower')


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        author_id = self.request.query_params.get('author')
        
        if author_id:
            return Post.objects.filter(author_id=author_id).select_related('author', 'linked_badge').distinct().order_by('-created_at')

        following_ids = UserFollow.objects.filter(follower=user).values_list('following_id', flat=True)
        if following_ids.exists():
            return Post.objects.filter(
                Q(author_id__in=following_ids) | Q(author=user)
            ).select_related('author', 'linked_badge').distinct().order_by('-created_at')
        else:
            return Post.objects.all().select_related('author', 'linked_badge').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        post = self.get_object()
        if request.method == 'POST':
            like, created = PostLike.objects.get_or_create(post=post, user=request.user)
            return Response({'success': True, 'liked': True})
        elif request.method == 'DELETE':
            PostLike.objects.filter(post=post, user=request.user).delete()
            return Response({'success': True, 'liked': False}, status=status.HTTP_204_NO_CONTENT)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['post_pk']).select_related('author')

    def perform_create(self, serializer):
        post = Post.objects.get(id=self.kwargs['post_pk'])
        serializer.save(author=self.request.user, post=post)
