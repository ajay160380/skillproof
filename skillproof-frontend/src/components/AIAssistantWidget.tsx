import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

interface Message {
  id: string;
  text: string;
  is_user: boolean;
}

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      text: "Hi! I'm your SkillProof AI Assistant. How can I help you today?",
      is_user: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, is_user: true };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Create history to send
      const history = messages.filter(m => m.id !== 'init').map(m => ({ text: m.text, is_user: m.is_user }));
      
      const res = await api.post('/assistant/chat/', {
        message: text,
        history: history
      });

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: res.data.response, is_user: false };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const errMsg: Message = { id: (Date.now() + 1).toString(), text: "I'm sorry, I'm having trouble connecting right now.", is_user: false };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "How does scoring work?",
    "What should I do first?",
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="mb-4 w-80 sm:w-96 bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col"
              style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
            >
              {/* Header */}
              <div className="p-4 bg-ink text-white flex items-center justify-between shadow-md z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-verification to-emerald-400 p-0.5 shadow-inner">
                    <div className="w-full h-full bg-ink rounded-full flex items-center justify-center">
                      <span className="text-white font-serif font-bold text-sm">S</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm tracking-tight">AI Assistant</h3>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/70">SkillProof Guide</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.is_user 
                        ? 'bg-ink text-white rounded-br-none' 
                        : 'bg-white border border-structure/30 text-ink rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white border border-structure/30 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts (only show if few messages) */}
              {messages.length < 3 && !isTyping && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-[10px] font-mono uppercase tracking-widest text-ink/70 bg-white/50 border border-structure/30 hover:border-verification hover:text-verification hover:bg-verification/5 px-3 py-1.5 rounded-full transition-all duration-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 bg-white/80 border-t border-structure/20 backdrop-blur-md">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your skills..."
                    className="w-full bg-white border border-structure/30 rounded-full pl-4 pr-12 py-2.5 text-sm text-ink focus:outline-none focus:border-verification focus:ring-1 focus:ring-verification shadow-inner transition-all"
                    disabled={isTyping}
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-1 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center hover:bg-ink/90 disabled:opacity-50 disabled:hover:bg-ink transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4 ml-0.5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-ink to-ink/90 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center ring-1 ring-white/10"
        >
          {/* Subtle Pulse */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full border border-ink opacity-30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          )}
          
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.div key="open" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="relative">
                <span className="text-white text-2xl font-serif font-bold group-hover:scale-110 transition-transform block">S</span>
                <div className="absolute -top-1 -right-2 w-3 h-3 bg-verification rounded-full border-2 border-ink shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
};
