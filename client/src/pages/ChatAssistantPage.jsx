import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, Plus, Sparkles } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from '../utils/uuid';

const suggestedPrompts = [
  'What should I do for a fever?',
  'How can I manage stress naturally?',
  'What are symptoms of dehydration?',
  'When should I see a doctor for chest pain?',
  'What foods boost immune system?',
  'How to lower blood pressure naturally?',
];

export default function ChatAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({ message: msg, sessionId });
      setSessionId(data.data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date()
      }]);
    } catch (err) {
      toast.error('Failed to get response. Try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(uuidv4());
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatContent = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/^- (.+)/gm, '<li class="ml-4 text-slate-300">• $1</li>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">MedGuide AI Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-slate-400 text-xs">Online • Powered by Gemini AI</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pb-4">
        {/* Welcome state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 gap-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-500/30 border border-violet-500/30 flex items-center justify-center">
              <Bot className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">How can I help you?</h2>
              <p className="text-slate-400 text-sm max-w-sm">I'm your AI health assistant. Ask me about symptoms, medicines, health tips, or emergency guidance.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-xl">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-sm text-slate-400 hover:text-slate-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-primary-600/30 border border-primary-500/30'
                  : 'bg-violet-600/30 border border-violet-500/30'
              }`}>
                {msg.role === 'user'
                  ? <span className="text-primary-300 text-xs font-bold">{user?.name?.charAt(0)}</span>
                  : <Bot className="w-4 h-4 text-violet-400" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600/30 border border-primary-500/30 text-slate-100 rounded-tr-sm'
                    : 'glass border-white/[0.08] text-slate-300 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                      className="prose-sm"
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-slate-700 text-xs px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <div className="glass border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-slate-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 mt-2">
        <div className="glass border-white/[0.10] p-2 rounded-2xl flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about symptoms, medicines, health tips..."
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-none py-2 px-3 max-h-32 leading-relaxed"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-slate-700 text-xs text-center mt-2">
          AI responses are for informational purposes only. Always consult a doctor.
        </p>
      </div>
    </div>
  );
}
