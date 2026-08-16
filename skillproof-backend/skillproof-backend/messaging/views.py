from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from network.models import UserFollow

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class StartConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        if not recipient_id:
            return Response({'error': 'recipient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id == recipient.id:
            return Response({'error': 'Cannot message yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Check follow relationship
        has_follow = UserFollow.objects.filter(
            Q(follower=request.user, following=recipient) |
            Q(follower=recipient, following=request.user)
        ).exists()

        if not has_follow:
            return Response(
                {'error': 'You must be following each other or one must follow the other to message.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if conversation already exists
        # A conversation exactly with these two users
        convo = Conversation.objects.filter(participants=request.user).filter(participants=recipient).first()
        
        if not convo:
            convo = Conversation.objects.create()
            convo.participants.add(request.user, recipient)
            convo.save()

        serializer = ConversationSerializer(convo, context={'request': request})
        return Response(serializer.data)

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversations = request.user.conversations.all()
        
        paginator = StandardResultsSetPagination()
        paginated_conversations = paginator.paginate_queryset(conversations, request)
        
        serializer = ConversationSerializer(paginated_conversations, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = request.user.conversations.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        # Mark unread messages as read
        unread_messages = conversation.messages.exclude(sender=request.user).filter(read_at__isnull=True)
        unread_messages.update(read_at=timezone.now())

        messages = conversation.messages.all().order_by('-created_at')
        
        paginator = StandardResultsSetPagination()
        paginated_messages = paginator.paginate_queryset(messages, request)
        
        serializer = MessageSerializer(paginated_messages, many=True)
        return paginator.get_paginated_response(serializer.data)

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = request.user.conversations.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content')
        if not content or not str(content).strip():
            return Response({'error': 'Content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content.strip()
        )
        
        # Update conversation's last_message_at
        conversation.last_message_at = timezone.now()
        conversation.save()

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
