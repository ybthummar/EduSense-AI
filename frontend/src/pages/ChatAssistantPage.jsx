import { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, Database, Brain, ChevronDown,
  ExternalLink, FileText, Loader2, RotateCcw, Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiChatAPI, chatAPI } from '../services/api';
import { PromptInputBox } from '../components/ui/ai-prompt-box';

const RAG_SUGGESTIONS = [
  'Which department has the highest average marks?',
  'Show me at-risk students in Computer Engineering',
  'What is the attendance summary for AIML department?',
  'Which faculty has the best student pass rate?',
];

const LLM_SUGGESTIONS = [
  'Explain machine learning algorithms',
  'What is data structures and algorithms?',
  'How does a neural network work?',
  'Explain object oriented programming',
];

export default function ChatAssistantPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('rag');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setModeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendMessage = async (text) => {
    const question = (text || '').trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', content: question, mode };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      if (mode === 'rag' || mode === 'llm') {
        // Dual-mode AI chat
        const { data } = await aiChatAPI.query({ mode, message: question });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer || 'I could not generate a response.',
            mode: data.mode,
            sources: data.sources || [],
            retrieved_chunks: data.retrieved_chunks || [],
          },
        ]);
      } else {
        // Fallback to legacy study assistant
        const { data } = await chatAPI.sendMessage({
          message: question,
          user_id: user?.id || 'anonymous',
          student_id: user?.student_id || user?.id,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer || 'I could not generate a response.',
            mode: 'study',
            videos: data.videos || [],
            playlist: data.playlist || null,
            web_links: data.web_links || [],
            recommendation: data.recommendation || null,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', mode },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => setMessages([]);

  const suggestions = mode === 'rag' ? RAG_SUGGESTIONS : LLM_SUGGESTIONS;
  const modeLabel = mode === 'rag' ? 'RAG Assistant' : 'General LLM';
  const modeBadge = mode === 'rag'
    ? { text: 'Grounded in Internal Data', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' }
    : { text: 'Gemini General AI', color: 'border-violet-500/40 bg-violet-500/10 text-violet-300' };
  const placeholder = mode === 'rag'
    ? 'Ask about student performance, attendance, subject difficulty, faculty analytics…'
    : 'Ask anything…';

  return (
    <div className="surface-card flex h-[calc(100vh-11rem)] min-h-[620px] flex-col overflow-hidden rounded-3xl">
      {/* ── Header ──────────────────────────────── */}
      <div className="border-b border-slate-700/65 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/12 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">AI Chat Assistant</h2>
              <p className="text-xs text-slate-400">
                Choose a mode and start asking questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Badge */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${modeBadge.color}`}>
              {mode === 'rag' ? <Database className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
              {modeBadge.text}
            </span>

            {/* Mode Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setModeOpen(!modeOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50"
              >
                {mode === 'rag' ? <Database className="h-4 w-4 text-emerald-400" /> : <Brain className="h-4 w-4 text-violet-400" />}
                {modeLabel}
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${modeOpen ? 'rotate-180' : ''}`} />
              </button>

              {modeOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-600/70 bg-slate-800 shadow-xl">
                  <button
                    onClick={() => { setMode('rag'); setModeOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-t-xl px-4 py-3 text-left text-sm transition-colors hover:bg-slate-700/60 ${mode === 'rag' ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-200'}`}
                  >
                    <Database className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="font-medium">RAG Assistant</p>
                      <p className="text-[11px] text-slate-400">Answers from internal analytics data</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setMode('llm'); setModeOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-b-xl px-4 py-3 text-left text-sm transition-colors hover:bg-slate-700/60 ${mode === 'llm' ? 'bg-violet-500/10 text-violet-300' : 'text-slate-200'}`}
                  >
                    <Brain className="h-4 w-4 text-violet-400" />
                    <div>
                      <p className="font-medium">General LLM</p>
                      <p className="text-[11px] text-slate-400">Gemini AI for any question</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-lg bg-slate-700/50 p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ────────────────────────────── */}
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="animate-float-slow mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-300">
              {mode === 'rag' ? <Database className="h-8 w-8" /> : <Brain className="h-8 w-8" />}
            </div>
            <h3 className="text-xl font-semibold text-slate-100">
              {mode === 'rag' ? 'Ask about your analytics data' : 'Ask me anything'}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">{placeholder}</p>
            <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="surface-card surface-card-hover rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-6 py-1">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
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

      {/* ── Input ───────────────────────────────── */}
      <div className="border-t border-slate-700/65 p-4 sm:p-5 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl pt-2 pb-4">
          <PromptInputBox
            onSend={(message) => sendMessage(message)}
            isLoading={loading}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}


/* ── Message Bubble Component ──────────────────── */
function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[85%] order-first">
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bubble-user border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 text-slate-950">
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          {msg.mode && (
            <p className="mt-1 text-right text-[10px] text-slate-500">
              {msg.mode === 'rag' ? '🗄️ RAG Mode' : '🧠 LLM Mode'}
            </p>
          )}
        </div>
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-200">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-300">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Mode indicator */}
        {msg.mode && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            msg.mode === 'rag'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-violet-500/40 bg-violet-500/10 text-violet-300'
          }`}>
            {msg.mode === 'rag' ? <Database className="h-2.5 w-2.5" /> : <Brain className="h-2.5 w-2.5" />}
            {msg.mode === 'rag' ? 'Internal Data' : 'Gemini AI'}
          </span>
        )}

        {/* Answer */}
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bubble-assistant surface-card border-slate-600/60 text-slate-100">
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* RAG Sources */}
        {msg.sources?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Sources ({msg.sources.length})
            </p>
            <div className="grid gap-1.5">
              {msg.sources.map((src, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                >
                  <p className="text-xs font-medium text-slate-200">{src.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="rounded bg-slate-700/60 px-1.5 py-0.5">{src.entity_type}</span>
                    <span>{src.source_table}</span>
                    {src.relevance_score != null && (
                      <span className="text-emerald-400">score: {src.relevance_score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy study assistant extras */}
        {msg.recommendation && (
          <div className="rounded-xl border border-orange-300/25 bg-orange-500/10 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.09em] text-orange-200">Personalized Tip</p>
            <p className="text-xs text-slate-300">{msg.recommendation}</p>
          </div>
        )}

        {msg.web_links?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-400">Web Sources</p>
            <div className="grid gap-1.5">
              {msg.web_links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-2.5 hover:bg-cyan-500/10 transition-colors">
                  <p className="truncate text-sm text-slate-100 group-hover:text-cyan-200">{link.title}</p>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 group-hover:text-cyan-300" />
                </a>
              ))}
            </div>
          </div>
        )}

        {msg.videos?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Recommended Videos</p>
            <div className="grid gap-1.5">
              {msg.videos.slice(0, 3).map((v, i) => (
                <a key={i} href={v.url || v.link || '#'} target="_blank" rel="noopener noreferrer"
                  className="surface-card surface-card-hover group flex items-center gap-3 rounded-xl p-2.5">
                  <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-red-400/25 bg-red-500/10">
                    {v.thumbnail
                      ? <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                      : <Play className="h-4 w-4 text-red-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100 group-hover:text-cyan-200">{v.title || 'Video'}</p>
                    <p className="truncate text-xs text-slate-400">{v.channel || v.channelTitle || ''}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
