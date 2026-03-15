import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.id;

  const [todayData, setTodayData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadToday = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await attendanceAPI.getStudent(studentId);
      setTodayData(res.data);
    } catch {
      setTodayData(null);
    }
  }, [studentId]);

  const loadHistory = useCallback(async () => {
    if (!studentId) return;
    setHistoryLoading(true);
    try {
      const res = await attendanceAPI.getHistory({ student_id: studentId });
      setHistory(res.data?.records || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    Promise.all([loadToday(), loadHistory()]).finally(() => setLoading(false));
  }, [loadToday, loadHistory]);

  const filteredHistory = history.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.subject_id || '').toLowerCase().includes(q) ||
      (r.date || '').includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  });

  // Group by date
  const grouped = {};
  filteredHistory.forEach((r) => {
    const d = r.date || 'Unknown';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(r);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Stats
  const totalRecords = history.length;
  const presentCount = history.filter((r) => r.status === 'present').length;
  const absentCount = history.filter((r) => r.status === 'absent').length;
  const overallPct = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            My Attendance
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Verify your daily attendance and track your record.
          </p>
        </div>
        <button
          onClick={() => { loadToday(); loadHistory(); }}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Overall %</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{overallPct}%</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Present</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Absent</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{absentCount}</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Classes</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{totalRecords}</p>
        </div>
      </div>

      {/* Today's Attendance */}
      <Card>
        <div className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100 mb-4">
            <Calendar className="h-5 w-5 text-cyan-400" />
            Today's Attendance
          </h2>
          {todayData && todayData.records?.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                {todayData.present_count} / {todayData.total_classes} subjects marked present
                {todayData.today_percentage != null && ` (${todayData.today_percentage}%)`}
              </p>
              <div className="flex flex-wrap gap-3">
                {todayData.records.map((rec, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${
                      rec.status === 'present'
                        ? 'border-green-600/40 bg-green-500/10 text-green-400'
                        : 'border-red-600/40 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {rec.status === 'present' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {rec.subject_id || 'General'} — {rec.status === 'present' ? 'Present' : 'Absent'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attendance marked for today yet.</p>
          )}
        </div>
      </Card>

      {/* History */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Attendance History
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by subject or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-500">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-600" />
              <p>No attendance history found.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => (
              <Card key={dateKey}>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-300 mb-3">
                    {formatDate(dateKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {grouped[dateKey].map((rec, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          rec.status === 'present'
                            ? 'border-green-600/30 bg-green-500/10 text-green-400'
                            : 'border-red-600/30 bg-red-500/10 text-red-400'
                        }`}
                      >
                        {rec.status === 'present' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {rec.subject_id || 'General'}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
