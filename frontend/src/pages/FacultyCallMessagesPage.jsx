import { useCallback, useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { callsAPI } from '../services/api';
import {
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Hash,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const sentimentConfig = {
  positive: { variant: 'success', icon: TrendingUp, label: 'Positive' },
  neutral: { variant: 'info', icon: MessageSquare, label: 'Neutral' },
  negative: { variant: 'danger', icon: AlertCircle, label: 'Negative' },
};

const difficultyConfig = {
  easy: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20' },
  medium: { color: 'text-amber-400 bg-amber-500/10 border-amber-400/20' },
  hard: { color: 'text-red-400 bg-red-500/10 border-red-400/20' },
};

function SentimentBadge({ sentiment }) {
  const config = sentimentConfig[sentiment] || sentimentConfig.neutral;
  return (
    <Badge variant={config.variant}>
      <config.icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function CallCard({ call, expanded, onToggle }) {
  const date = formatDate(call.created_at);
  const diffStyle = difficultyConfig[call.difficulty_level] || difficultyConfig.medium;

  return (
    <div className="border border-slate-700/60 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {call.user_message
                ? call.user_message.length > 80
                  ? call.user_message.slice(0, 80) + '...'
                  : call.user_message
                : 'No message'}
            </p>
            {date && <p className="text-xs text-slate-400 mt-0.5">{date}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <SentimentBadge sentiment={call.sentiment} />
          {call.difficulty_level && (
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${diffStyle.color}`}>
              {call.difficulty_level}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700/50 px-5 py-5 space-y-5">
          {/* User Message */}
          {call.user_message && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                <MessageSquare className="h-3.5 w-3.5" /> User Message
              </h4>
              <div className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 max-h-60 overflow-y-auto whitespace-pre-wrap">
                {call.user_message}
              </div>
            </div>
          )}

          {/* Summary */}
          {call.summary && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                <FileText className="h-3.5 w-3.5" /> Summary
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                {call.summary}
              </p>
            </div>
          )}

          {/* Sentiment + Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">
                <TrendingUp className="h-3.5 w-3.5" /> Sentiment
              </h4>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                <SentimentBadge sentiment={call.sentiment} />
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-400 mb-2">
                <Hash className="h-3.5 w-3.5" /> Keywords
              </h4>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                {call.keywords && call.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {call.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-lg bg-fuchsia-500/10 border border-fuchsia-400/20 px-2.5 py-1 text-xs font-medium text-fuchsia-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No keywords extracted.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacultyCallMessagesPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('all');

  const loadCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterSentiment !== 'all') params.sentiment = filterSentiment;
      const res = await callsAPI.getCallMessages(params);
      setCalls(res.data?.calls || []);
    } catch (err) {
      console.error('Failed to load call messages:', err);
      setError('Unable to load call messages. Please try again.');
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [filterSentiment]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // Client-side search
  const filteredCalls = calls.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.summary || '').toLowerCase().includes(q) ||
      (c.user_message || '').toLowerCase().includes(q) ||
      (c.keywords || []).some((k) => k.toLowerCase().includes(q))
    );
  });

  const totalCalls = calls.length;
  const positiveCalls = calls.filter((c) => c.sentiment === 'positive').length;
  const negativeCalls = calls.filter((c) => c.sentiment === 'negative').length;
  const neutralCalls = calls.filter((c) => c.sentiment === 'neutral').length;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Call Messages
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            View student call summaries, sentiment analysis and key topics.
          </p>
        </div>
        <button
          onClick={loadCalls}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Calls</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{totalCalls}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Positive</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{positiveCalls}</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Neutral</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{neutralCalls}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Negative</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{negativeCalls}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by summary, message, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>
        <select
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Call list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      ) : filteredCalls.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Phone}
            title="No call messages found"
            description={
              search || filterSentiment !== 'all'
                ? 'Try changing your filters or search query.'
                : 'Call records will appear here once available.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call, idx) => (
            <CallCard
              key={idx}
              call={call}
              expanded={expandedIdx === idx}
              onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
