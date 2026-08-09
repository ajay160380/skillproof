from django.urls import path
from .views import StartConversationView, ConversationListView, MessageListView, SendMessageView

urlpatterns = [
    path('start-conversation/', StartConversationView.as_view(), name='start-conversation'),
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='messages'),
    path('conversations/<int:conversation_id>/send/', SendMessageView.as_view(), name='send-message'),
]
