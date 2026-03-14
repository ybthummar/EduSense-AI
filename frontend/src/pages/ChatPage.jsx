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
    setMessages((prev) => [...prev, userMsg]);
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
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="surface-card flex h-[calc(100vh-11rem)] min-h-[620px] flex-col overflow-hidden rounded-3xl">
      <div className="border-b border-slate-700/65 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/12 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">AI Study Assistant</h2>
            <p className="text-xs text-slate-400">Ask questions and get explanations, videos, and guidance.</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="animate-float-slow mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-300">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">What would you like to learn today?</h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Start with one of these prompts or ask anything related to your coursework.
            </p>
            <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(question)}
                  className="surface-card surface-card-hover rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-6 py-1">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-300">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={[
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bubble-user border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 text-slate-950'
                        : 'bubble-assistant surface-card border-slate-600/60 text-slate-100',
                    ].join(' ')}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.recommendation && (
                    <div className="mt-2 rounded-xl border border-orange-300/25 bg-orange-500/10 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.09em] text-orange-200">Personalized Tip</p>
                      <p className="text-xs text-slate-300">{msg.recommendation}</p>
                    </div>
                  )}

                  {msg.videos?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Recommended Videos</p>
                      <div className="grid gap-2">
                        {msg.videos.slice(0, 3).map((video, videoIndex) => (
                          <a
                            key={videoIndex}
                            href={video.url || video.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="surface-card surface-card-hover group flex items-center gap-3 rounded-xl p-3"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-400/25 bg-red-500/10 text-red-300">
                              <Play className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-slate-100 transition-colors group-hover:text-cyan-200">
                                {video.title || 'Video'}
                              </p>
                              <p className="truncate text-xs text-slate-400">{video.channel || video.channelTitle || ''}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-500 transition-colors group-hover:text-slate-300" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.playlist && (msg.playlist.url || msg.playlist.link) && (
                    <div className="mt-2">
                      <a
                        href={msg.playlist.url || msg.playlist.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/18"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {msg.playlist.title || 'View Full Playlist'}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="surface-card rounded-2xl border-slate-600/60 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/65 p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything about your studies..."
              disabled={loading}
              className="glass-panel-soft w-full rounded-2xl border border-slate-600/75 py-3 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35 disabled:cursor-not-allowed disabled:opacity-65"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 p-2 text-slate-950 transition-all hover:from-cyan-400 hover:to-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}