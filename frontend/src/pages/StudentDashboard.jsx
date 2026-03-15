import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Target, AlertTriangle, MessageSquare, Lightbulb, MapPin, Mail, GraduationCap, Briefcase, Code, FolderGit2, Brain, Activity, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import { BarChartCard, PieChartCard, AreaChartCard } from '../components/charts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { studentAPI, attendanceAPI } from '../services/api';

const EXPLAIN = {
  cgpa: 'Your Cumulative Grade Point Average (CGPA) is calculated across all semesters. Above 8.0 is excellent, 7.0–8.0 is good, and below 6.0 needs attention. Track your SGPA trend chart below to see progression.',
  attendance: 'Overall attendance percentage across all subjects. Most institutions require a minimum of 75%. Low attendance can affect exam eligibility and academic performance.',
  avgMarks: 'The average of your marks across all current semester subjects. This gives a quick snapshot of how you are performing this semester overall.',
  riskLevel: 'AI-calculated risk assessment based on your CGPA, attendance, marks trend, and stress factors. "Low" means on track, "Medium" needs improvement, "High" or "Critical" requires immediate action.',
  sgpaTrend: 'Shows your Semester Grade Point Average (SGPA) progression across semesters. An upward trend indicates improving performance. Dips may correlate with difficult semesters or personal challenges.',
  subjectPerf: 'Compares your marks across current semester subjects. Subjects below 60 marks are highlighted as weak and recommended for focused study. Hover on bars for exact scores.',
  attendanceDist: 'Breaks down your attendance by subject or semester. Helps identify which areas you are missing most classes in. Aim for 80%+ in every subject.',
  stress: 'AI-powered stress analysis evaluating four factors: Academic Pressure, Attendance Stress, Workload Stress, and Career Stress. Each is scored 0–100; above 70 indicates high stress.',
};

function InfoBtn({ id, activeId, onToggle }) {
  const isOpen = activeId === id;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(isOpen ? null : id); }}
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
        isOpen
          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
          : 'border-slate-600/50 bg-slate-800/50 text-slate-500 hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-500/10'
      }`}
      title="What does this mean?"
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  );
}

function ExplainPanel({ id, activeId, onClose }) {
  if (activeId !== id) return null;
  return (
    <div className="mt-3 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-cyan-500/15 p-1.5">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <p className="flex-1 text-sm leading-relaxed text-slate-300">{EXPLAIN[id]}</p>
        <button onClick={() => onClose(null)} className="mt-0.5 rounded-lg p-1 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectVideos, setSubjectVideos] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [stressData, setStressData] = useState(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [explainOpen, setExplainOpen] = useState(null);

  const studentId = user?.student_id || user?.id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, recRes] = await Promise.all([
        studentAPI.getDashboard(studentId),
        studentAPI.getRecommendations(studentId),
      ]);
      setDashboard(dashRes.data);
      setRecommendations(recRes.data || []);
      setStressLoading(true);
      try {
        const stressRes = await studentAPI.getStudentStress(studentId);
        setStressData(stressRes.data);
      } catch {
        setStressData(null);
      } finally {
        setStressLoading(false);
      }
      try {
        const attRes = await attendanceAPI.getStudent(studentId);
        setTodayAttendance(attRes.data);
      } catch {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectVideos = async (subject) => {
    if (!subject) return;
    setVideoLoading(true);
    setVideoError(null);
    setActiveSubject(subject);
    try {
      const res = await studentAPI.searchSubjectVideos(subject);
      setSubjectVideos(res.data?.videos || []);
    } catch (err) {
      console.error('Failed to load subject videos:', err);
      setVideoError('Unable to load study videos at this time.');
      setSubjectVideos([]);
    } finally {
      setVideoLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && dashboard) {
      const weakSubjects = (dashboard.subject_performance || []).filter((s) => parseFloat(s.marks) < 60);
      if (weakSubjects.length > 0) {
        fetchSubjectVideos(weakSubjects[0].subject || weakSubjects[0].subject_code);
      }
    }
  }, [loading, dashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-80" />)}
        </div>
      </div>
    );
  }

  const metrics = dashboard?.latest_metrics || {};
  const sgpaTrend = (dashboard?.sgpa_trend || []).map((item, i) => ({
    name: item.semester || `Sem ${i + 1}`,
    sgpa: item.sgpa || item.value || 0,
  }));

  const subjectPerf = (dashboard?.subject_performance || []).map((item) => ({
    subject_code: item.subject_code || item.subject || item.name || 'Subject',
    name: item.subject || item.name || 'Subject',
    marks: item.marks != null ? item.marks : (item.score || item.value || 0),
  }));

  const attendanceData = (dashboard?.attendance || []).map((item) => ({
    name: item.semester || item.subject || item.name || 'Subject',
    value: item.percentage || item.value || 0,
  }));

  const latestSGPA = sgpaTrend.length > 0 ? sgpaTrend[sgpaTrend.length - 1].sgpa : 0;
  const avgAttendance = metrics.attendance_percentage ||
    (attendanceData.length > 0
      ? (attendanceData.reduce((sum, d) => sum + d.value, 0) / attendanceData.length).toFixed(1)
      : '0');

  const facultySuggestions = recommendations.filter((rec) => rec.source === 'faculty');
  const systemSuggestions = recommendations.filter((rec) => rec.source !== 'faculty');

  const priorityVariant = { high: 'danger', medium: 'warning', low: 'info' };

  const statusBadge = (status) => {
    if (!status) return null;
    const variant = status === 'Completed' ? 'success' : status === 'Ongoing' ? 'warning' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const gradeInfo = (marks) => {
    if (marks >= 90) return { grade: 'A+', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', bar: 'bg-emerald-400' };
    if (marks >= 80) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', bar: 'bg-green-400' };
    if (marks >= 70) return { grade: 'B+', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30', bar: 'bg-cyan-400' };
    if (marks >= 60) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', bar: 'bg-blue-400' };
    if (marks >= 50) return { grade: 'C', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', bar: 'bg-amber-400' };
    if (marks >= 40) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', bar: 'bg-orange-400' };
    return { grade: 'F', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', bar: 'bg-red-400' };
  };

  return (
    <div className="space-y-8">
      {/* Student Profile Header */}
      <div className="surface-card rounded-2xl p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
              {(dashboard?.name || user?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{dashboard?.name || user?.name || 'Student'}</h1>
              <p className="text-sm text-cyan-400 font-medium">{dashboard?.student_id || studentId}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                {dashboard?.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{dashboard.email}</span>
                )}
                {(dashboard?.city || dashboard?.state) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[dashboard.city, dashboard.state].filter(Boolean).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{dashboard?.department_code || dashboard?.department || 'Dept'}</Badge>
            <Badge variant="secondary">Year {dashboard?.year || '-'} &bull; Sem {dashboard?.semester || '-'}</Badge>
            {dashboard?.enrollment_year && <Badge variant="accent">Batch {dashboard.enrollment_year}</Badge>}
          </div>
        </div>
      </div>

      {/* Main Metrics with Info Buttons */}
      <div className="space-y-0">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'cgpa', title: 'Current CGPA', value: metrics.cgpa?.toFixed(2) || latestSGPA.toFixed(2), icon: TrendingUp, color: 'primary' },
            { key: 'attendance', title: 'Attendance', value: `${avgAttendance}%`, icon: BookOpen, color: 'accent' },
            { key: 'avgMarks', title: 'Avg Marks', value: metrics.average_marks?.toFixed(1) || '-', icon: Target, color: 'purple' },
            { key: 'riskLevel', title: 'Risk Level', value: metrics.risk_level || 'Low', icon: AlertTriangle, color: metrics.risk_level === 'High' || metrics.risk_level === 'Critical' ? 'danger' : metrics.risk_level === 'Medium' ? 'warning' : 'success' },
          ].map((kpi) => (
            <div key={kpi.key} className="group relative">
              <MetricCard title={kpi.title} value={kpi.value} icon={kpi.icon} color={kpi.color} />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <InfoBtn id={kpi.key} activeId={explainOpen} onToggle={setExplainOpen} />
              </div>
            </div>
          ))}
        </div>
        {['cgpa', 'attendance', 'avgMarks', 'riskLevel'].includes(explainOpen) && (
          <ExplainPanel id={explainOpen} activeId={explainOpen} onClose={setExplainOpen} />
        )}
      </div>

      {/* Today's Live Attendance */}
      {todayAttendance && todayAttendance.records?.length > 0 && (
        <Card hover>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                Today's Attendance — {todayAttendance.date}
              </div>
            </CardTitle>
            <CardDescription>
              {todayAttendance.present} / {todayAttendance.total} subjects marked present
              ({todayAttendance.today_percentage}%)
            </CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {todayAttendance.records.map((rec, i) => (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-transform hover:scale-105 ${
                    rec.status === 'present'
                      ? 'border-green-600/40 bg-green-500/10 text-green-400'
                      : 'border-red-600/40 bg-red-500/10 text-red-400'
                  }`}
                >
                  {rec.subject_id || 'General'} — {rec.status === 'present' ? 'Present' : 'Absent'}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Academic Progress Cards */}
      {(metrics.devops_status || metrics.project_status || metrics.internship) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.devops_status && (
            <Card hover className="p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-500/20 p-2"><Code className="h-5 w-5 text-cyan-400" /></div>
                <div>
                  <p className="text-xs text-slate-400">DevOps Engineering</p>
                  {statusBadge(metrics.devops_status)}
                </div>
              </div>
            </Card>
          )}
          {metrics.project_status && (
            <Card hover className="p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2"><FolderGit2 className="h-5 w-5 text-purple-400" /></div>
                <div>
                  <p className="text-xs text-slate-400">Project Phase II</p>
                  {statusBadge(metrics.project_status)}
                </div>
              </div>
            </Card>
          )}
          {metrics.internship && (
            <Card hover className="p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/20 p-2"><Briefcase className="h-5 w-5 text-green-400" /></div>
                <div>
                  <p className="text-xs text-slate-400">Internship</p>
                  <Badge variant={metrics.internship === 'Yes' ? 'success' : 'secondary'}>{metrics.internship}</Badge>
                </div>
              </div>
            </Card>
          )}
          {metrics.extracurricular_level && (
            <Card hover className="p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2"><GraduationCap className="h-5 w-5 text-amber-400" /></div>
                <div>
                  <p className="text-xs text-slate-400">Extracurricular</p>
                  <Badge variant={metrics.extracurricular_level === 'High' ? 'success' : metrics.extracurricular_level === 'Medium' ? 'warning' : 'secondary'}>
                    {metrics.extracurricular_level}
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Stress Evaluation Section */}
      {stressLoading ? (
        <div className="skeleton h-48 rounded-2xl" />
      ) : stressData ? (
        <Card hover>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    Stress Evaluation
                  </div>
                </CardTitle>
                <CardDescription>AI-powered stress analysis based on your academic profile</CardDescription>
              </div>
              <InfoBtn id="stress" activeId={explainOpen} onToggle={setExplainOpen} />
            </div>
          </CardHeader>
          <ExplainPanel id="stress" activeId={explainOpen} onClose={setExplainOpen} />
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Stress Score</p>
                <p className={`text-4xl font-bold ${
                  (stressData.final_stress_score ?? 0) >= 70 ? 'text-red-400' :
                  (stressData.final_stress_score ?? 0) >= 40 ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {stressData.final_stress_score != null ? Math.round(stressData.final_stress_score) : 'N/A'}
                  <span className="text-base text-slate-500">/100</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Stress Level</p>
                <Badge variant={
                  stressData.stress_level?.includes('High') ? 'danger' :
                  stressData.stress_level?.includes('Moderate') ? 'warning' : 'success'
                } className="text-lg px-4 py-1">
                  {stressData.stress_level || 'N/A'}
                </Badge>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Alert</p>
                <Badge variant={stressData.alert_flag ? 'danger' : 'success'} className="text-lg px-4 py-1">
                  {stressData.alert_flag ? '⚠ Flagged' : '✓ Normal'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-cyan-400" /> Stress Factor Breakdown
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Academic Pressure', key: 'academic_pressure_score', textColor: 'text-cyan-400', bgColor: 'bg-cyan-400' },
                  { label: 'Attendance Stress', key: 'attendance_stress_score', textColor: 'text-orange-400', bgColor: 'bg-orange-400' },
                  { label: 'Workload Stress', key: 'workload_stress_score', textColor: 'text-purple-400', bgColor: 'bg-purple-400' },
                  { label: 'Career Stress', key: 'career_stress_score', textColor: 'text-amber-400', bgColor: 'bg-amber-400' },
                ].map(({ label, key, textColor, bgColor }) => {
                  const val = stressData[key];
                  return (
                    <div key={key} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-transform hover:scale-[1.03]">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
                      <div className="flex items-end gap-1">
                        <span className={`text-xl font-bold ${textColor}`}>
                          {val != null ? Math.round(val) : '-'}
                        </span>
                        <span className="text-xs text-slate-500 mb-0.5">/100</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-700">
                        <div
                          className={`h-full rounded-full ${bgColor} transition-all duration-700`}
                          style={{ width: `${Math.min(val ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(stressData.stress_reason || stressData.intervention) && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {stressData.stress_reason && (
                  <div className="rounded-xl border border-amber-700/40 bg-amber-500/5 p-3">
                    <p className="text-xs font-medium text-amber-400 mb-1">Primary Stress Reason</p>
                    <p className="text-sm text-slate-300">{stressData.stress_reason}</p>
                  </div>
                )}
                {stressData.intervention && (
                  <div className="rounded-xl border border-green-700/40 bg-green-500/5 p-3">
                    <p className="text-xs font-medium text-green-400 mb-1">Recommended Intervention</p>
                    <p className="text-sm text-slate-300">{stressData.intervention}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* Charts with Info Buttons */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative group/chart">
          <AreaChartCard
            title="SGPA Trend"
            description="Semester-wise SGPA progression"
            data={sgpaTrend}
            dataKey="sgpa"
            color="#22d3ee"
            height={280}
          />
          <div className="absolute top-5 right-5 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200">
            <InfoBtn id="sgpaTrend" activeId={explainOpen} onToggle={setExplainOpen} />
          </div>
          <ExplainPanel id="sgpaTrend" activeId={explainOpen} onClose={setExplainOpen} />
        </div>
        <div className="relative group/chart">
          <BarChartCard
            title="Subject Performance"
            description="Current semester marks by subject"
            data={subjectPerf}
            dataKey="marks"
            color="#34d399"
            height={280}
          />
          <div className="absolute top-5 right-5 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200">
            <InfoBtn id="subjectPerf" activeId={explainOpen} onToggle={setExplainOpen} />
          </div>
          <ExplainPanel id="subjectPerf" activeId={explainOpen} onClose={setExplainOpen} />
        </div>
      </div>

      {/* Subject Details Table — Enhanced with Progress Bars & Grade Pills */}
      <Card hover>
        <CardHeader>
          <CardTitle>Subject-wise Marks</CardTitle>
          <CardDescription>Detailed breakdown with visual progress — hover rows for details</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left font-medium text-slate-300">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Progress</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Marks</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjectPerf.map((sub, i) => {
                const gi = gradeInfo(sub.marks);
                return (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors group/row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-cyan-400 text-xs">{sub.subject_code}</span>
                      {sub.name !== sub.subject_code && (
                        <span className="ml-2 text-slate-300">{sub.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-slate-700/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${gi.bar} transition-all duration-700`}
                            style={{ width: `${Math.min(sub.marks, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{sub.marks}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{sub.marks}/100</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${gi.bg} ${gi.color}`}>
                        {gi.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Focus Subjects & Learning Videos */}
      <Card hover>
        <CardHeader>
          <CardTitle className="text-base">Focus Subjects & Learning Videos</CardTitle>
          <CardDescription>Highlighted subjects where you can improve, with YouTube video resources</CardDescription>
        </CardHeader>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(subjectPerf.filter((sub) => sub.marks < 60) || []).map((sub) => (
              <Button
                key={sub.subject_code || sub.subject}
                onClick={() => fetchSubjectVideos(sub.name || sub.subject_code)}
                variant={activeSubject === (sub.name || sub.subject_code) ? 'secondary' : 'outline'}
              >
                {sub.name} ({sub.marks}/100)
              </Button>
            ))}
            {(subjectPerf.filter((sub) => sub.marks < 60).length === 0) && (
              <p className="text-sm text-slate-400">No weak subjects detected; keep up the good work!</p>
            )}
          </div>

          {videoLoading && <p className="text-sm text-cyan-300">Loading videos for "{activeSubject}"...</p>}
          {videoError && <p className="text-sm text-red-300">{videoError}</p>}

          {subjectVideos.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {subjectVideos.map((video, idx) => (
                <a
                  key={idx}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="surface-card rounded-xl p-3 border border-slate-700 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  <div className="text-sm font-semibold text-slate-100">{video.title}</div>
                  <div className="text-xs text-slate-400">{video.channel}</div>
                  <div className="mt-2 text-xs text-cyan-300">Watch video &rarr;</div>
                </a>
              ))}
            </div>
          )}

          {!videoLoading && !videoError && subjectVideos.length === 0 && (
            <p className="text-sm text-slate-400">Select a subject to view curated video tutorials.</p>
          )}
        </div>
      </Card>

      {/* Attendance Pie + AI Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative group/chart">
          <PieChartCard
            title="Attendance Distribution"
            description="Semester-wise attendance"
            data={attendanceData}
            height={280}
          />
          <div className="absolute top-5 right-5 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200">
            <InfoBtn id="attendanceDist" activeId={explainOpen} onToggle={setExplainOpen} />
          </div>
          <ExplainPanel id="attendanceDist" activeId={explainOpen} onClose={setExplainOpen} />
        </div>

        <Card hover>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-300" />
                AI Study Recommendations
              </div>
            </CardTitle>
            <CardDescription>Personalized suggestions based on your performance and faculty guidance</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {facultySuggestions.length > 0 && (
              <div>
                <h4 className="text-sm text-cyan-300 mb-2">Faculty Suggestions</h4>
                <div className="space-y-2">
                  {facultySuggestions.slice(0, 5).map((rec, i) => (
                    <div key={`fac-${i}`} className="surface-card rounded-xl p-3 bg-slate-900/80 border border-cyan-700/50 hover:border-cyan-500/60 transition-colors">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h4 className="text-sm font-medium text-slate-100">{rec.title}</h4>
                        <Badge variant={priorityVariant[rec.priority?.toLowerCase()] || 'info'}>
                          {rec.priority || 'Normal'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{rec.description}</p>
                      {rec.topic && (<span className="mt-2 inline-block rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] text-cyan-200">{rec.topic}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm text-cyan-300 mb-2">System Recommendations</h4>
              {systemSuggestions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No system suggestions yet</p>
              ) : (
                <div className="space-y-2">
                  {systemSuggestions.slice(0, 5).map((rec, i) => (
                    <div key={`sys-${i}`} className="surface-card rounded-xl p-3 hover:bg-slate-800/50 transition-colors">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h4 className="text-sm font-medium text-slate-100">{rec.title}</h4>
                        <Badge variant={priorityVariant[rec.priority?.toLowerCase()] || 'info'}>
                          {rec.priority || 'Normal'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{rec.description}</p>
                      {rec.topic && (<span className="mt-2 inline-block rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] text-cyan-200">{rec.topic}</span>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* AI Assistant Button */}
      <div className="flex justify-center">
        <Button onClick={() => navigate('/chat')} className="px-8">
          <MessageSquare className="h-4 w-4" /> Chat with AI Study Assistant
        </Button>
      </div>
    </div>
  );
}