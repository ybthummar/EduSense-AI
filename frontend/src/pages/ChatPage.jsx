import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Loader2, Sparkles, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';

const suggestedQuestions = [
  'Explain machine learning algorithms',
  'What is data structures and algorithms?',
  'How does neural network work?',
  'Explain object oriented programming',
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({
        message: question,
        user_id: user?.id || 'anonymous',
        student_id: user?.student_id || user?.id,
      });

      const assistantMsg = {
        role: 'assistant',
        content: data.answer || 'I could not generate a response.',
        videos: data.videos || [],
        playlist: data.playlist || null,
        recommendation: data.recommendation || null,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] max-h-[calc(100vh-80px)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-2 sm:px-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">AI Study Assistant</h2>
            <p className="text-sm text-zinc-500 max-w-md mb-8">
              Ask questions about any academic topic. I'll provide explanations, video recommendations, and personalized study tips.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white bubble-user'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 bubble-assistant'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Recommendation */}
                  {msg.recommendation && (
                    <div className="mt-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <p className="text-xs text-amber-400 font-medium mb-1">Personalized Tip</p>
                      <p className="text-xs text-zinc-400">{msg.recommendation}</p>
                    </div>
                  )}

                  {/* Videos */}
                  {msg.videos?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recommended Videos</p>
                      <div className="grid gap-2">
                        {msg.videos.slice(0, 3).map((video, vi) => (
                          <a
                            key={vi}
                            href={video.url || video.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                              <Play className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-200 truncate group-hover:text-zinc-100">{video.title || 'Video'}</p>
                              <p className="text-xs text-zinc-500 truncate">{video.channel || video.channelTitle || ''}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Playlist */}
                  {msg.playlist && (msg.playlist.url || msg.playlist.link) && (
                    <div className="mt-2">
                      <a
                        href={msg.playlist.url || msg.playlist.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-400 hover:bg-indigo-600/20 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        {msg.playlist.title || 'View Full Playlist'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your studies..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
