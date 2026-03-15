import { useState, useEffect, useMemo } from 'react';
import {
  Users, TrendingUp, AlertTriangle, BookOpen, GraduationCap, Brain, Activity,
  Target, Award, Lightbulb, ChevronDown, Filter, RefreshCw,
  BarChart3, Layers, Shield, Briefcase, Zap, ArrowUpRight,
  Flame, Eye, X, Sparkles, Check, Trophy, ArrowDownRight,
  UserCheck, Building2, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { facultyAPI, studentAPI, quizAPI } from '../services/api';
import InsightExplainer, { CATEGORY_META, SEVERITY_STYLE } from '../components/faculty/InsightExplainer';
import toast from 'react-hot-toast';

// ── colour constants ────────────────────────────────────────────────────
const RISK_COLORS = { Low: '#34d399', Medium: '#fbbf24', High: '#fb923c', Critical: '#f87171' };
const CHART_CYAN = '#22d3ee';
const CHART_PURPLE = '#a78bfa';
const CAREER_COLORS = ['#34d399', '#fbbf24', '#22d3ee'];

// ── reusable glass tooltip ──────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg border border-slate-600/75 px-3 py-2 shadow-xl text-xs">
      {label && <p className="mb-1 text-slate-400">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} className="font-semibold" style={{ color: e.color || CHART_CYAN }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}
        </p>
      ))}
    </div>
  );
};

// ── Section wrapper ─────────────────────────────────────────────────────
function Section({ title, icon: Icon, explainerType, children, className = '' }) {
  return (
    <div className={`surface-card rounded-2xl p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        </div>
        {explainerType && <InsightExplainer type={explainerType} />}
      </div>
      {children}
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, color, explainerType, subtitle, onClick }) {
  const bg = {
    cyan: 'border-cyan-400/30 bg-cyan-500/12 text-cyan-300',
    green: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300',
    orange: 'border-orange-400/30 bg-orange-500/12 text-orange-300',
    red: 'border-red-400/30 bg-red-500/12 text-red-300',
    purple: 'border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-300',
    amber: 'border-amber-400/30 bg-amber-500/12 text-amber-300',
  };
  return (
    <div
      className={`surface-card surface-card-hover group rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`rounded-xl border p-2.5 transition-transform duration-200 group-hover:scale-105 ${bg[color] || bg.cyan}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {explainerType && <InsightExplainer type={explainerType} />}
      </div>
      <p className="mb-1 text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ── Drill-down side panel ───────────────────────────────────────────────
function DrillPanel({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-slate-700/60 bg-slate-900 p-6 shadow-2xl animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stress (preserved feature)
  const [stressData, setStressData] = useState([]);
  const [quizResults, setQuizResults] = useState([]);

  // Filters
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Drill-down
  const [drillPanel, setDrillPanel] = useState(null);
  const [selectedTimelineStudent, setSelectedTimelineStudent] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;
      const [analyticsRes, stressRes, quizRes] = await Promise.all([
        facultyAPI.getDashboardAnalytics(params),
        studentAPI.getStressAnalysis().catch(() => ({ data: [] })),
        quizAPI.getResults().catch(() => ({ data: [] })),
      ]);
      setData(analyticsRes.data);
      setStressData(stressRes.data || []);
      setQuizResults(quizRes.data || []);
    } catch (err) {
      console.error('Dashboard load failed:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [department, semester]);

  // ── Derived data ──────────────────────────────────────────────────────
  const kpis = data?.kpis || {};
  const heatmapData = data?.heatmap || [];
  const riskDist = data?.risk_distribution || [];
  const riskStudents = data?.risk_students || [];
  const scatterData = data?.scatter || [];
  const subjectDiff = data?.subject_difficulty || [];
  const timelineRaw = data?.timeline || [];
  const teaching = data?.teaching_effectiveness || [];
  const weakTopics = data?.weak_topics || [];
  const careerData = data?.career_readiness || {};
  const insights = data?.insights || [];
  const recommendations = data?.recommendations || [];
  const gradeDistribution = data?.grade_distribution || [];
  const topPerformers = data?.top_performers || [];
  const bottomPerformers = data?.bottom_performers || [];
  const genderAnalytics = data?.gender_analytics || [];
  const departmentComparison = data?.department_comparison || [];
  const filterOpts = data?.filter_options || {};

  // Heatmap → horizontal bar data: one bar per subject, sorted by marks, grouped by semester
  const heatmapBars = useMemo(() => {
    if (!heatmapData.length) return { bars: [], semesters: [] };
    const sems = [...new Set(heatmapData.map(h => h.semester_id))].sort();
    const bars = heatmapData
      .filter(h => h.avg_marks != null)
      .map(h => ({
        name: h.subject_name || h.subject_id,
        semester: h.semester_id,
        marks: Math.round(h.avg_marks * 10) / 10,
        passRate: h.pass_rate,
        count: h.count,
        fill: h.avg_marks >= 70 ? '#34d399' : h.avg_marks >= 50 ? '#fbbf24' : '#f87171',
      }))
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 25);
    return { bars, semesters: sems };
  }, [heatmapData]);

  // Timeline: group by student (multi-semester SGPA)
  const timelineStudents = useMemo(() => {
    const map = {};
    timelineRaw.forEach(t => {
      if (!map[t.student_id]) map[t.student_id] = { name: t.name || t.student_id, points: [] };
      map[t.student_id].points.push({ semester: `Sem ${t.semester_number || '?'}`, sgpa: t.sgpa ?? t.avg_marks });
    });
    return map;
  }, [timelineRaw]);
  const timelineStudentIds = Object.keys(timelineStudents);

  // Career pie
  const careerPie = [
    { name: 'Career Ready', value: careerData.ready || 0 },
    { name: 'High Potential', value: careerData.high_potential || 0 },
    { name: 'Needs Improvement', value: careerData.needs_improvement || 0 },
  ].filter(d => d.value > 0);

  // Stress metrics
  const stressMetrics = useMemo(() => {
    if (!stressData.length) return null;
    const avg = (stressData.reduce((s, d) => s + (d.stress_score || d.final_stress_score || 0), 0) / stressData.length).toFixed(1);
    const high = stressData.filter(d => d.stress_level === 'High' || d.stress_level?.includes('High')).length;
    const moderate = stressData.filter(d => d.stress_level === 'Moderate' || d.stress_level?.includes('Moderate')).length;
    const low = stressData.filter(d => d.stress_level === 'Low' || d.stress_level?.includes('Low')).length;
    return { avg, high, moderate, low };
  }, [stressData]);

  // Quiz summary for dashboard section
  const quizSummary = useMemo(() => {
    if (!quizResults.length) return null;
    const byQuiz = {};
    quizResults.forEach(r => {
      const key = r.quiz_title || r.quiz_id;
      if (!byQuiz[key]) byQuiz[key] = { title: key, subject: r.subject || '-', scores: [], attempts: 0 };
      byQuiz[key].scores.push(r.score || 0);
      byQuiz[key].attempts++;
    });
    const rows = Object.values(byQuiz).map(q => ({
      ...q,
      avg: (q.scores.reduce((a, b) => a + b, 0) / q.scores.length).toFixed(1),
      max: Math.max(...q.scores),
      min: Math.min(...q.scores),
    }));
    const overallAvg = (quizResults.reduce((s, r) => s + (r.score || 0), 0) / quizResults.length).toFixed(1);
    return { rows, overallAvg, totalAttempts: quizResults.length };
  }, [quizResults]);

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4 animate-rise-in">
          <div className="h-12 w-12 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading insight dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════ GLOBAL FILTER BAR ═══════ */}
      <div className="surface-card flex flex-wrap items-center gap-4 rounded-2xl px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Filter className="h-4 w-4 text-cyan-400" /> Filters
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
        >
          <option value="">All Departments</option>
          {(filterOpts.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
        >
          <option value="">All Semesters</option>
          {(filterOpts.semesters || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(department || semester) && (
          <button onClick={() => { setDepartment(''); setSemester(''); }} className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-400 hover:border-red-400/40 hover:text-red-300">Clear</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
          <span className="text-xs text-slate-500">{kpis.total_students || 0} students in scope</span>
        </div>
      </div>

      {/* ═══════ 1. KPI CARDS ═══════ */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Avg Marks" value={kpis.avg_marks || 0} icon={TrendingUp} color="cyan" explainerType="avg_marks" subtitle="out of 100" />
        <KpiCard title="Pass Rate" value={`${kpis.pass_rate || 0}%`} icon={Award} color="green" explainerType="pass_rate" subtitle="subjects passed" />
        <KpiCard title="Avg Attendance" value={`${kpis.avg_attendance || 0}%`} icon={Users} color="purple" explainerType="avg_attendance" subtitle="across all subjects" />
        <KpiCard
          title="At Risk"
          value={kpis.at_risk_count || 0}
          icon={AlertTriangle}
          color="red"
          explainerType="at_risk"
          subtitle="High + Critical"
          onClick={() => setDrillPanel({ type: 'risk', title: 'At-Risk Students', data: riskStudents.filter(s => s.risk_level === 'High' || s.risk_level === 'Critical') })}
        />
        <KpiCard title="Difficulty" value={kpis.difficulty_score || 0} icon={Layers} color="orange" explainerType="difficulty_score" subtitle="avg score /10" />
        <KpiCard title="Improvement" value={`${kpis.improvement_rate || 0}%`} icon={ArrowUpRight} color="amber" explainerType="improvement_rate" subtitle="students ≥50 avg" />
      </div>

      {/* ═══════ 3. RISK DISTRIBUTION ═══════ */}
      <Section title="Risk Distribution" icon={Shield} explainerType="risk_distribution">
          {riskDist.some(r => r.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={riskDist.filter(r => r.value > 0)} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}
                    onClick={(entry) => {
                      const level = entry?.name || entry?.payload?.name;
                      if (level) setDrillPanel({ type: 'risk', title: `${level} Risk Students`, data: riskStudents.filter(s => s.risk_level === level) });
                    }}
                    className="cursor-pointer"
                  >
                    {riskDist.filter(r => r.value > 0).map(r => <Cell key={r.name} fill={RISK_COLORS[r.name] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {riskDist.map(r => (
                  <button key={r.name} onClick={() => setDrillPanel({ type: 'risk', title: `${r.name} Risk Students`, data: riskStudents.filter(s => s.risk_level === r.name) })} className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-slate-700/50 transition-colors">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[r.name] }} />
                    <span className="text-slate-300">{r.name}: <strong>{r.value}</strong></span>
                  </button>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-500">No risk data available.</p>}
      </Section>

      {/* ═══════ 4. SCATTER PLOT ═══════ */}
      <Section title="Attendance vs Performance" icon={Activity} explainerType="scatter">
        {scatterData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" dataKey="attendance" name="Attendance %" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} label={{ value: 'Attendance %', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }} />
              <YAxis type="number" dataKey="marks" name="Avg Marks" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} label={{ value: 'Avg Marks', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }} />
              <ZAxis range={[40, 40]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="glass-panel rounded-lg border border-slate-600/75 px-3 py-2 shadow-xl text-xs">
                    <p className="font-semibold text-slate-100">{d.name}</p>
                    <p className="text-slate-400">{d.student_id} • {d.department}</p>
                    <p className="text-cyan-300">Attendance: {d.attendance?.toFixed(1)}%</p>
                    <p className="text-emerald-300">Marks: {d.marks?.toFixed(1)}</p>
                    <p style={{ color: RISK_COLORS[d.risk_level] }}>Risk: {d.risk_level}</p>
                  </div>
                );
              }} />
              {['Low', 'Medium', 'High', 'Critical'].map(level => {
                const pts = scatterData.filter(s => s.risk_level === level);
                if (!pts.length) return null;
                return <Scatter key={level} name={level} data={pts} fill={RISK_COLORS[level]} onClick={(entry) => entry && setDrillPanel({ type: 'student', title: entry.name, data: entry })} className="cursor-pointer" />;
              })}
              <Legend content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                  {payload?.map((e, i) => (
                    <span key={i} className="flex items-center gap-1 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} /> {e.value}
                    </span>
                  ))}
                </div>
              )} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">No data available for scatter plot.</p>}
      </Section>

      {/* ═══════ GRADE DISTRIBUTION + TOP/BOTTOM PERFORMERS ═══════ */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Section title="Grade Distribution" icon={BarChart3} explainerType="grade_distribution" className="lg:col-span-3">
          {gradeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gradeDistribution} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} allowDecimals={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass-panel rounded-lg border border-slate-600/75 px-3 py-2 shadow-xl text-xs">
                      <p className="font-semibold text-slate-100">Marks: {d.range}</p>
                      <p style={{ color: d.color }}>Students: {d.count}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="count" name="Students" radius={[6, 6, 2, 2]} maxBarSize={40}>
                  {gradeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No grade data available.</p>}
        </Section>

        <Section title="Top & Bottom Performers" icon={Trophy} explainerType="top_bottom" className="lg:col-span-2">
          {topPerformers.length > 0 ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" /> Top 5
                </p>
                <div className="space-y-1">
                  {topPerformers.map((s, i) => (
                    <button key={i} className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-slate-700/30 transition-colors text-left"
                      onClick={() => setDrillPanel({ type: 'student', title: s.name, data: s })}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300">{i + 1}</span>
                        <span className="text-xs text-slate-200 truncate">{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-300">{s.avg_marks?.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-700/50 pt-2">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-400">
                  <ArrowDownRight className="h-3 w-3" /> Bottom 5
                </p>
                <div className="space-y-1">
                  {bottomPerformers.map((s, i) => (
                    <button key={i} className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-slate-700/30 transition-colors text-left"
                      onClick={() => setDrillPanel({ type: 'student', title: s.name, data: s })}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-[10px] font-bold text-red-300">{i + 1}</span>
                        <span className="text-xs text-slate-200 truncate">{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-red-300">{s.avg_marks?.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">No performer data available.</p>}
        </Section>
      </div>

      {/* ═══════ 5. SUBJECT DIFFICULTY + 6. TIMELINE ═══════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Subject Difficulty Analyzer" icon={Layers} explainerType="subject_difficulty">
          {subjectDiff.length > 0 ? (
            <>
              <div className="mb-4 rounded-xl border border-orange-400/20 bg-orange-500/5 px-4 py-3">
                <p className="text-xs font-semibold text-orange-300">
                  <Flame className="mr-1 inline h-3.5 w-3.5" />
                  {subjectDiff[0].subject_name || subjectDiff[0].subject_id} has the highest difficulty score ({subjectDiff[0].difficulty_score})
                </p>
              </div>
              <div className="max-h-[320px] overflow-y-auto space-y-1.5">
                {subjectDiff.slice(0, 12).map((s, i) => {
                  const pct = Math.max(0, Math.min(100, s.difficulty_score * 10));
                  const barColor = pct >= 55 ? 'bg-red-500/70' : pct >= 35 ? 'bg-amber-500/60' : 'bg-emerald-500/50';
                  return (
                    <button key={i} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-slate-700/30 transition-colors" onClick={() => setDrillPanel({ type: 'subject', title: s.subject_name || s.subject_id, data: s })}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-200 truncate max-w-[60%]">{s.subject_name || s.subject_id}</span>
                        <span className="text-[11px] text-slate-400">Marks: {s.avg_marks?.toFixed(0)} • Pass: {s.pass_rate?.toFixed(0)}% • Diff: {s.difficulty_score}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : <p className="text-sm text-slate-500">No subject data available.</p>}
        </Section>

        <Section title="Student Progress Timeline" icon={Activity} explainerType="timeline">
          {timelineStudentIds.length > 0 ? (
            <>
              <select value={selectedTimelineStudent} onChange={(e) => setSelectedTimelineStudent(e.target.value)} className="mb-3 w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none">
                <option value="">Select a student…</option>
                {timelineStudentIds.map(id => <option key={id} value={id}>{timelineStudents[id].name} ({id})</option>)}
              </select>
              {selectedTimelineStudent && timelineStudents[selectedTimelineStudent] ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timelineStudents[selectedTimelineStudent].points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="semester" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Line type="monotone" dataKey="sgpa" name="SGPA" stroke={CHART_CYAN} strokeWidth={2.5} dot={{ r: 4, fill: CHART_CYAN }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">Select a student to view their semester-wise performance trend.</div>
              )}
            </>
          ) : <p className="text-sm text-slate-500">No timeline data available.</p>}
        </Section>
      </div>

      {/* ═══════ 7. TEACHING EFFECTIVENESS ═══════ */}
      <Section title="Teaching Effectiveness" icon={Award} explainerType="teaching_effectiveness">
          {teaching.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {teaching.slice(0, 10).map((t, i) => {
                const score = t.effectiveness_score || 0;
                const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-cyan-500' : 'bg-amber-500';
                return (
                  <div key={i} className="rounded-xl px-4 py-3 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{t.faculty_name || t.faculty_id}</p>
                        <p className="text-[11px] text-slate-500">{t.department} • {t.designation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-100">{score}</p>
                        <p className="text-[10px] text-slate-500">/ 100</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <div className="mt-1.5 flex gap-3 text-[10px] text-slate-500">
                      <span>Pass: {t.pass_rate?.toFixed(0)}%</span>
                      <span>Marks: {t.avg_marks?.toFixed(0)}</span>
                      <span>Students: {t.student_count}</span>
                      <span>Subjects: {t.subjects_taught}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-500">No teaching effectiveness data available.</p>}
      </Section>

      {/* ═══════ 8. WEAK TOPIC DETECTION ═══════ */}
      <Section title="Weak Topic Detection" icon={Target} explainerType="weak_topics">
        {weakTopics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weakTopics.slice(0, 12).map((t, i) => (
              <div key={i} className={`rounded-xl border px-3 py-2.5 ${t.needs_attention ? 'border-red-400/20 bg-red-500/5' : 'border-slate-600/30 bg-slate-800/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200">{t.topic}</span>
                  {t.needs_attention && <AlertTriangle className="h-3 w-3 text-red-400" />}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{t.subject}</p>
                <div className="mt-1.5 flex gap-3 text-[10px]">
                  <span className={t.difficulty_score >= 5.5 ? 'text-red-400' : 'text-slate-400'}>Diff: {t.difficulty_score}</span>
                  <span className="text-slate-400">Est. Marks: {t.estimated_marks}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No weak topic data available.</p>}
      </Section>

      {/* ═══════ GENDER ANALYTICS + DEPARTMENT COMPARISON ═══════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Gender Performance Analysis" icon={UserCheck} explainerType="gender_analytics">
          {genderAnalytics.length > 0 ? (
            <>
              <div className="mb-3 flex flex-wrap gap-3">
                {genderAnalytics.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i === 0 ? '#22d3ee' : '#a78bfa' }} />
                    <span className="text-xs text-slate-300">{g.gender}: <strong>{g.student_count}</strong> students</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={genderAnalytics} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="gender" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="avg_marks" name="Avg Marks" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="pass_rate" name="Pass Rate %" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="avg_attendance" name="Attendance %" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Legend content={({ payload }) => (
                    <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px]">
                      {payload?.map((e, i) => (
                        <span key={i} className="flex items-center gap-1 text-slate-400">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} /> {e.value}
                        </span>
                      ))}
                    </div>
                  )} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : <p className="text-sm text-slate-500">No gender data available.</p>}
        </Section>

        <Section title="Department Comparison" icon={Building2} explainerType="department_comparison">
          {departmentComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, departmentComparison.length * 50 + 40)}>
              <BarChart data={departmentComparison} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass-panel rounded-lg border border-slate-600/75 px-3 py-2 shadow-xl text-xs">
                      <p className="font-semibold text-slate-100">{d.department}</p>
                      <p className="text-cyan-300">Avg Marks: {d.avg_marks?.toFixed(1)}</p>
                      <p className="text-emerald-300">Pass Rate: {d.pass_rate?.toFixed(1)}%</p>
                      <p className="text-purple-300">Attendance: {d.avg_attendance?.toFixed(1)}%</p>
                      <p className="text-red-300">Fail Rate: {d.fail_rate?.toFixed(1)}%</p>
                      <p className="text-slate-400">Students: {d.student_count}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="avg_marks" name="Avg Marks" fill="#22d3ee" radius={[0, 4, 4, 0]} maxBarSize={16} />
                <Bar dataKey="pass_rate" name="Pass Rate" fill="#34d399" radius={[0, 4, 4, 0]} maxBarSize={16} />
                <Legend content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px]">
                    {payload?.map((e, i) => (
                      <span key={i} className="flex items-center gap-1 text-slate-400">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} /> {e.value}
                      </span>
                    ))}
                  </div>
                )} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No department data available.</p>}
        </Section>
      </div>

      {/* ═══════ STRESS EVALUATION (preserved) ═══════ */}
      {stressMetrics && (
        <Section title="Stress Evaluation Engine" icon={Brain}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-cyan-300">{stressMetrics.avg}</p>
              <p className="text-[11px] text-slate-400">Avg Score</p>
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-red-300">{stressMetrics.high}</p>
              <p className="text-[11px] text-slate-400">High Stress</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-amber-300">{stressMetrics.moderate}</p>
              <p className="text-[11px] text-slate-400">Moderate</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-300">{stressMetrics.low}</p>
              <p className="text-[11px] text-slate-400">Low Stress</p>
            </div>
          </div>
          {stressData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Academic', value: +(stressData.reduce((s, d) => s + (d.academic_pressure_score || 0), 0) / stressData.length).toFixed(1) },
                { name: 'Attendance', value: +(stressData.reduce((s, d) => s + (d.attendance_stress_score || 0), 0) / stressData.length).toFixed(1) },
                { name: 'Workload', value: +(stressData.reduce((s, d) => s + (d.workload_stress_score || 0), 0) / stressData.length).toFixed(1) },
                { name: 'Career', value: +(stressData.reduce((s, d) => s + (d.career_stress_score || 0), 0) / stressData.length).toFixed(1) },
              ]} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="value" name="Avg Score" fill={CHART_PURPLE} radius={[6, 6, 2, 2]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      )}

      {/* ═══════ 10. AI INSIGHTS + 11. RECOMMENDATIONS ═══════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="AI Insight Engine" icon={Sparkles} explainerType="insights">
          {insights.length > 0 ? (
            <div className="space-y-3">
              {/* Severity summary bar */}
              <div className="flex flex-wrap gap-2 mb-1">
                {['critical', 'high', 'medium', 'low'].map(sev => {
                  const count = insights.filter(i => i.severity === sev).length;
                  if (!count) return null;
                  const styles = { critical: 'bg-red-500/15 text-red-300 border-red-400/30', high: 'bg-orange-500/15 text-orange-300 border-orange-400/30', medium: 'bg-amber-500/15 text-amber-300 border-amber-400/30', low: 'bg-slate-600/15 text-slate-300 border-slate-500/30' };
                  return (
                    <span key={sev} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[sev]}`}>
                      {count} {sev}
                    </span>
                  );
                })}
                {/* Category badges */}
                {[...new Set(insights.map(i => i.category).filter(Boolean))].map(cat => {
                  const meta = CATEGORY_META[cat];
                  if (!meta) return null;
                  const CatIcon = meta.icon;
                  return (
                    <span key={cat} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${meta.border} ${meta.bg} ${meta.color}`}>
                      <CatIcon className="h-2.5 w-2.5" />{meta.label}
                    </span>
                  );
                })}
              </div>
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
                {insights.map((ins, i) => {
                  const theme = {
                    warning: { border: 'border-amber-400/25', bg: 'bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400' },
                    alert: { border: 'border-red-400/25', bg: 'bg-red-500/5', icon: Flame, iconColor: 'text-red-400' },
                    info: { border: 'border-cyan-400/25', bg: 'bg-cyan-500/5', icon: Eye, iconColor: 'text-cyan-400' },
                    success: { border: 'border-emerald-400/25', bg: 'bg-emerald-500/5', icon: Check, iconColor: 'text-emerald-400' },
                  }[ins.type] || { border: 'border-slate-600/30', bg: 'bg-slate-800/30', icon: Lightbulb, iconColor: 'text-slate-400' };
                  return <InsightItem key={ins.id || i} ins={ins} theme={theme} Icon={theme.icon} />;
                })}
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">No insights generated for the current scope.</p>}
        </Section>

        <Section title="Intervention Recommendations" icon={Zap} explainerType="recommendations">
          {recommendations.length > 0 ? (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
              {recommendations.map((rec, i) => <RecommendationItem key={rec.source_insight_id || i} rec={rec} />)}
            </div>
          ) : <p className="text-sm text-slate-500">No recommendations for the current scope.</p>}
        </Section>
      </div>

      {/* ═══════ QUIZ SCORES ═══════ */}
      {quizSummary && (
        <Section title="Quiz Scores Overview" icon={Trophy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-5">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3">
              <p className="text-xs text-slate-400">Total Attempts</p>
              <p className="text-xl font-bold text-cyan-300">{quizSummary.totalAttempts}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs text-slate-400">Avg Score</p>
              <p className="text-xl font-bold text-emerald-300">{quizSummary.overallAvg}%</p>
            </div>
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 px-4 py-3">
              <p className="text-xs text-slate-400">Quizzes Tracked</p>
              <p className="text-xl font-bold text-purple-300">{quizSummary.rows.length}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Quiz</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Subject</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Attempts</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Avg</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">High</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Low</th>
                </tr>
              </thead>
              <tbody>
                {quizSummary.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 text-slate-200 font-medium">{row.title}</td>
                    <td className="px-3 py-2.5 text-slate-400">{row.subject}</td>
                    <td className="px-3 py-2.5 text-right text-slate-300">{row.attempts}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`font-bold ${parseFloat(row.avg) >= 70 ? 'text-green-400' : parseFloat(row.avg) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {row.avg}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-green-400 font-semibold">{row.max}%</td>
                    <td className="px-3 py-2.5 text-right text-red-400 font-semibold">{row.min}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════ DRILL-DOWN PANEL ═══════ */}
      {drillPanel && (
        <DrillPanel title={drillPanel.title} onClose={() => setDrillPanel(null)}>
          {drillPanel.type === 'risk' && <StudentListPanel students={drillPanel.data} />}
          {drillPanel.type === 'career' && <CareerStudentList students={drillPanel.data} />}
          {drillPanel.type === 'student' && <StudentDetail student={drillPanel.data} />}
          {drillPanel.type === 'subject' && <SubjectDetail subject={drillPanel.data} />}
        </DrillPanel>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════

function InsightItem({ ins, theme, Icon }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[ins.category] || {};
  const CatIcon = cat.icon || Lightbulb;
  const sevStyle = SEVERITY_STYLE[ins.severity] || SEVERITY_STYLE.medium;
  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} px-4 py-3`}>
      <button className="w-full text-left flex items-start gap-2.5" onClick={() => setExpanded(!expanded)}>
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${theme.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-slate-200">{ins.title}</p>
            {ins.severity && (
              <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sevStyle}`}>
                {ins.severity}
              </span>
            )}
            {cat.label && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${cat.border} ${cat.bg} ${cat.color}`}>
                <CatIcon className="h-2.5 w-2.5" />{cat.label}
              </span>
            )}
          </div>
          {ins.summary && <p className="text-[11px] text-slate-400 mt-0.5">{ins.summary}</p>}
          {expanded && (
            <div className="mt-2 space-y-2 text-xs text-slate-400 leading-relaxed">
              {ins.detail && <p>{ins.detail}</p>}
              {ins.recommended_action && (
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 mb-0.5">
                    <Target className="inline h-3 w-3 mr-1" />Recommended Action
                  </p>
                  <p className="text-slate-300">{ins.recommended_action}</p>
                </div>
              )}
              {ins.affected_entities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Affected</p>
                  <div className="flex flex-wrap gap-1">
                    {ins.affected_entities.slice(0, 6).map((e, i) => (
                      <span key={i} className="rounded-md border border-slate-600/40 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {e.name || e.id}
                      </span>
                    ))}
                    {ins.affected_entities.length > 6 && (
                      <span className="text-[10px] text-slate-500">+{ins.affected_entities.length - 6} more</span>
                    )}
                  </div>
                </div>
              )}
              {ins.supporting_metrics && Object.keys(ins.supporting_metrics).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ins.supporting_metrics).filter(([, v]) => typeof v !== 'object').slice(0, 5).map(([k, v]) => (
                    <span key={k} className="rounded-md bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-400">
                      {k.replace(/_/g, ' ')}: <strong className="text-slate-200">{typeof v === 'number' ? v.toFixed?.(1) ?? v : v}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}

function RecommendationItem({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const prioColors = {
    Critical: 'border-red-400/30 bg-red-500/10 text-red-300',
    High: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
    Medium: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    Low: 'border-slate-500/30 bg-slate-600/10 text-slate-300',
  };
  const prioColor = prioColors[rec.priority] || prioColors.Medium;
  return (
    <div className="rounded-xl border border-slate-600/30 bg-slate-800/20 px-4 py-3">
      <button className="w-full text-left flex items-start gap-2.5" onClick={() => setExpanded(!expanded)}>
        <Zap className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-400" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-slate-200">{rec.action}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${prioColor}`}>{rec.priority}</span>
            {rec.category && (
              <span className="rounded-full border border-slate-600/40 bg-slate-700/30 px-1.5 py-0.5 text-[9px] text-slate-400">{rec.category}</span>
            )}
          </div>
          {expanded && (
            <div className="mt-1.5 space-y-1.5 text-xs text-slate-400">
              <p><strong className="text-slate-300">Why:</strong> {rec.reason}</p>
              <p><strong className="text-emerald-400">Impact:</strong> {rec.impact}</p>
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}

function StudentListPanel({ students }) {
  if (!students?.length) return <p className="text-sm text-slate-500">No students in this category.</p>;
  return (
    <div className="space-y-2">
      {students.map((s, i) => (
        <div key={i} className="rounded-xl border border-slate-600/30 bg-slate-800/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">{s.name || s.student_id}</p>
              <p className="text-[11px] text-slate-500">{s.student_id} • {s.department}</p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${RISK_COLORS[s.risk_level]}20`, color: RISK_COLORS[s.risk_level] }}>{s.risk_level}</span>
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-slate-400">
            <span>Marks: <strong className="text-slate-300">{s.avg_marks?.toFixed(1)}</strong></span>
            <span>Attendance: <strong className="text-slate-300">{s.attendance?.toFixed(1)}%</strong></span>
            <span>Risk Score: <strong className="text-slate-300">{s.risk_score}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CareerStudentList({ students }) {
  if (!students?.length) return <p className="text-sm text-slate-500">No students in this category.</p>;
  return (
    <div className="space-y-2">
      {students.map((s, i) => (
        <div key={i} className="rounded-xl border border-slate-600/30 bg-slate-800/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">{s.name || s.student_id}</p>
              <p className="text-[11px] text-slate-500">{s.student_id} • {s.department}</p>
            </div>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">{s.readiness_score}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
            <span>CGPA: <strong className="text-slate-300">{s.cgpa_proxy}</strong></span>
            <span>Internships: <strong className="text-slate-300">{s.internships}</strong></span>
            <span>Certs: <strong className="text-slate-300">{s.certifications}</strong></span>
            <span>Category: <strong className="text-slate-300">{s.category}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentDetail({ student }) {
  if (!student) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
        <p className="text-lg font-semibold text-slate-100">{student.name}</p>
        <p className="text-sm text-slate-400">{student.student_id} • {student.department}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-600/30 bg-slate-800/30 p-3 text-center">
          <p className="text-xl font-bold text-cyan-300">{student.attendance?.toFixed(1)}%</p>
          <p className="text-xs text-slate-400">Attendance</p>
        </div>
        <div className="rounded-xl border border-slate-600/30 bg-slate-800/30 p-3 text-center">
          <p className="text-xl font-bold text-emerald-300">{student.marks?.toFixed(1)}</p>
          <p className="text-xs text-slate-400">Avg Marks</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-600/30 bg-slate-800/30 p-3">
        <p className="text-sm text-slate-200">Risk Level: <strong style={{ color: RISK_COLORS[student.risk_level] }}>{student.risk_level}</strong></p>
      </div>
    </div>
  );
}

function SubjectDetail({ subject }) {
  if (!subject) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-orange-400/20 bg-orange-500/5 p-4">
        <p className="text-lg font-semibold text-slate-100">{subject.subject_name || subject.subject_id}</p>
        <p className="text-sm text-slate-400">Subject Analysis</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Avg Marks', value: subject.avg_marks?.toFixed(1), color: 'text-cyan-300' },
          { label: 'Pass Rate', value: `${subject.pass_rate?.toFixed(1)}%`, color: 'text-emerald-300' },
          { label: 'Fail Rate', value: `${subject.fail_rate?.toFixed(1)}%`, color: 'text-red-300' },
          { label: 'Difficulty', value: subject.difficulty_score, color: 'text-orange-300' },
          { label: 'Students', value: subject.student_count, color: 'text-slate-200' },
          { label: 'Attendance', value: `${subject.avg_attendance?.toFixed(1)}%`, color: 'text-purple-300' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl border border-slate-600/30 bg-slate-800/30 p-3 text-center">
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
