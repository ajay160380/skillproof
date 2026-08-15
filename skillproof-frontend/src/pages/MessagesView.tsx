import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: string;
}

interface Message {
  id: number;
  content: string;
  sender: User;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: number;
  created_at: string;
  last_message_at: string | null;
  other_participant: User;
  latest_message: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
  } | null;
  unread_count: number;
}

import { useSearchParams } from 'react-router-dom';

export function MessagesView() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversation') ? parseInt(searchParams.get('conversation')!) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Sync activeConversationId when URL changes
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && parseInt(convId) !== activeConversationId) {
      setActiveConversationId(parseInt(convId));
    }
  }, [searchParams]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations/');
      setConversations(res.data.results || res.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Messages for active conversation
  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}/messages/`);
      // Results come back ordered by -created_at from backend, reverse them for chat UI
      const fetchedMessages = (res.data.results || res.data).reverse();
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Polling logic
  useEffect(() => {
    fetchConversations();
    
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      }
    }, activeConversationId ? 3000 : 10000); // 3s if chat open, 10s if only list

    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Handle active conversation change
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      // Mark as read in local state
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, unread_count: 0 } : c
      ));
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    const content = inputValue.trim();
    setInputValue('');

    // Optimistic UI update
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      content,
      sender: user as any, // current user
      created_at: new Date().toISOString(),
      read_at: null
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      await api.post(`/messages/conversations/${activeConversationId}/send/`, { content });
      fetchMessages(activeConversationId);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (fullName: string, username: string) => {
    if (fullName) {
      const parts = fullName.trim().split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : fullName.substring(0, 2).toUpperCase();
    }
    return username ? username.substring(0, 2).toUpperCase() : '?';
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const getAvatarUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'}${url}`;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white border border-structure/10 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Conversations List Panel */}
      <div className={`w-full md:w-[320px] lg:w-[350px] bg-[#F8F9FA] border-r border-structure/10 flex flex-col flex-shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-ink">Chats</h2>
          <button className="w-8 h-8 rounded-full hover:bg-structure/10 flex items-center justify-center text-ink transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoading ? (
            <div className="p-6 text-center text-data">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <span className="text-4xl mb-4 opacity-50">✉️</span>
              <h3 className="font-bold text-ink mb-2">No chats yet</h3>
              <p className="text-sm text-data">Start following people to message them.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {conversations.map(conv => {
                const isActive = activeConversationId === conv.id;
                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${isActive ? 'bg-[#1877F2] shadow-md' : 'hover:bg-white hover:shadow-sm'}`}
                    >
                      <div className="relative flex-shrink-0">
                        {conv.other_participant?.avatar_url ? (
                          <img src={getAvatarUrl(conv.other_participant.avatar_url)} alt="Profile" className="w-11 h-11 rounded-full object-cover bg-white" />
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-structure/10 text-ink'}`}>
                            {getInitials(conv.other_participant?.full_name || '', conv.other_participant?.username || '')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`font-bold text-[14px] truncate ${isActive ? 'text-white' : 'text-ink'}`}>
                            {conv.other_participant?.full_name || conv.other_participant?.username}
                          </h3>
                          {conv.latest_message && (
                            <span className={`text-[10px] whitespace-nowrap ml-2 ${isActive ? 'text-white/80' : 'text-data/80'}`}>
                              {new Date(conv.latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[12px] truncate ${isActive ? 'text-white/90' : (conv.unread_count > 0 ? 'font-bold text-ink' : 'text-data/90')}`}>
                            {conv.latest_message ? conv.latest_message.content : 'No messages yet'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ml-2 flex-shrink-0 ${isActive ? 'bg-white text-[#1877F2]' : 'bg-[#EF4444] text-white shadow-sm'}`}>
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Message Thread Panel */}
      <div className={`flex-1 bg-[#FAFAFA] flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="text-5xl mb-4 opacity-30">💬</span>
            <h3 className="font-serif text-2xl font-bold text-ink mb-2">Your Messages</h3>
            <p className="text-data">Select a conversation to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-4 px-6 border-b border-structure/10 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-2 -ml-3 rounded-full hover:bg-structure/10 transition-colors"
                >
                  ←
                </button>
                {activeConversation?.other_participant?.avatar_url ? (
                  <img src={getAvatarUrl(activeConversation.other_participant.avatar_url)} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm bg-white" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-structure/20 flex items-center justify-center text-ink font-bold shadow-sm">
                    {getInitials(activeConversation?.other_participant?.full_name || '', activeConversation?.other_participant?.username || '')}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-ink">
                    {activeConversation?.other_participant?.full_name || activeConversation?.other_participant?.username}
                  </h3>
                  <p className="text-[11px] text-data uppercase tracking-widest font-mono">
                    {activeConversation?.other_participant?.role}
                  </p>
                </div>
              </div>
              
              {/* Optional header actions (like screenshot) */}
              <div className="hidden md:flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-structure/5 hover:bg-structure/10 flex items-center justify-center text-ink transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                <button className="w-9 h-9 rounded-full bg-structure/5 hover:bg-structure/10 flex items-center justify-center text-ink transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
                <button className="w-9 h-9 rounded-full bg-structure/5 hover:bg-structure/10 flex items-center justify-center text-ink transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <span className="text-4xl mb-4">👋</span>
                  <p className="font-bold">Say hello!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.sender.id === user?.id;
                  const showAvatar = !isMine && (index === messages.length - 1 || messages[index + 1]?.sender.id === user?.id);
                  
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                      {!isMine && (
                        <div className="w-8 flex-shrink-0 flex items-end">
                          {showAvatar && (
                            msg.sender.avatar_url ? (
                              <img src={getAvatarUrl(msg.sender.avatar_url)} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-white/50" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-structure/20 to-structure/30 flex items-center justify-center text-ink text-xs font-bold shadow-sm ring-2 ring-white/50">
                                {getInitials(msg.sender.full_name || '', msg.sender.username || '')}
                              </div>
                            )
                          )}
                        </div>
                      )}
                      <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-2'}`}>
                        <div 
                          className={`p-3 px-5 rounded-2xl shadow-sm backdrop-blur-sm border transition-all ${
                            isMine 
                              ? 'bg-gradient-to-br from-ink/95 to-ink border-ink/20 text-white rounded-br-sm' 
                              : 'bg-white/80 border-structure/20 text-ink rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{msg.content}</p>
                        </div>
                        <div className={`text-[10px] text-data/70 font-mono mt-1 ${isMine ? 'text-right' : 'text-left ml-1'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-6 bg-[#FAFAFA]">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 max-w-4xl mx-auto">
                <div className="flex-1 bg-white rounded-full border border-structure/20 flex items-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] transition-shadow focus-within:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] focus-within:border-ink/20">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none rounded-full pl-6 pr-4 py-3.5 text-[15px] text-ink focus:outline-none placeholder:text-data/60"
                  />
                  <button type="button" className="p-2 mr-1 text-data/60 hover:text-ink transition-colors rounded-full hover:bg-structure/5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  className="w-[50px] h-[50px] rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#1877F2]/90 disabled:opacity-50 disabled:hover:bg-[#1877F2] transition-colors shadow-md flex-shrink-0"
                >
                  <svg className="w-5 h-5 ml-0.5 mt-0.5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
