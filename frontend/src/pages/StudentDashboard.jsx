import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Target, AlertTriangle, MessageSquare, Lightbulb, User, MapPin, Mail, GraduationCap, Briefcase, Code, FolderGit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import { LineChartCard } from '../components/charts';
import { BarChartCard } from '../components/charts';
import { PieChartCard } from '../components/charts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { studentAPI } from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

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
    name: item.subject_code || item.subject || item.name || 'Subject',
    fullName: item.subject || item.name || 'Subject',
    marks: item.marks || item.score || item.value || 0,
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

  const priorityVariant = { high: 'danger', medium: 'warning', low: 'info' };

  const statusBadge = (status) => {
    if (!status) return null;
    const variant = status === 'Completed' ? 'success' : status === 'Ongoing' ? 'warning' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="surface-card rounded-2xl p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white">
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
            <Badge variant="secondary">Year {dashboard?.year || '-'} • Sem {dashboard?.semester || '-'}</Badge>
            {dashboard?.enrollment_year && <Badge variant="accent">Batch {dashboard.enrollment_year}</Badge>}
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Current CGPA" value={metrics.cgpa?.toFixed(2) || latestSGPA.toFixed(2)} icon={TrendingUp} color="primary" />
        <MetricCard title="Attendance" value={`${avgAttendance}%`} icon={BookOpen} color="accent" />
        <MetricCard title="Avg Marks" value={metrics.average_marks?.toFixed(1) || '-'} icon={Target} color="purple" />
        <MetricCard
          title="Risk Level"
          value={metrics.risk_level || 'Low'}
          icon={AlertTriangle}
          color={
            metrics.risk_level === 'High' || metrics.risk_level === 'Critical'
              ? 'danger'
              : metrics.risk_level === 'Medium'
                ? 'warning'
                : 'success'
          }
        />
      </div>

      {/* Academic Progress Cards */}
      {(metrics.devops_status || metrics.project_status || metrics.internship) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.devops_status && (
            <Card hover className="p-4">
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
            <Card hover className="p-4">
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
            <Card hover className="p-4">
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
            <Card hover className="p-4">
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title="SGPA Trend"
          description="Semester-wise SGPA progression"
          data={sgpaTrend}
          lines={[{ dataKey: 'sgpa', name: 'SGPA', color: '#22d3ee' }]}
          height={280}
        />
        <BarChartCard
          title="Subject Performance"
          description="Current semester marks by subject"
          data={subjectPerf}
          dataKey="marks"
          color="#34d399"
          height={280}
        />
      </div>

      {/* Subject Details Table */}
      <Card hover>
        <CardHeader>
          <CardTitle>Subject-wise Marks</CardTitle>
          <CardDescription>Detailed breakdown of your current semester subjects</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left font-medium text-slate-300">Subject Code</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Subject Name</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Marks</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjectPerf.map((sub, i) => {
                const grade = sub.marks >= 90 ? 'A+' : sub.marks >= 80 ? 'A' : sub.marks >= 70 ? 'B+' : sub.marks >= 60 ? 'B' : sub.marks >= 50 ? 'C' : sub.marks >= 40 ? 'D' : 'F';
                const gradeColor = sub.marks >= 80 ? 'text-green-400' : sub.marks >= 60 ? 'text-cyan-400' : sub.marks >= 40 ? 'text-amber-400' : 'text-red-400';
                return (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-cyan-400">{sub.name}</td>
                    <td className="px-4 py-3 text-slate-200">{sub.fullName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{sub.marks}/100</td>
                    <td className={`px-4 py-3 text-right font-bold ${gradeColor}`}>{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PieChartCard
          title="Attendance Distribution"
          description="Semester-wise attendance"
          data={attendanceData}
          height={280}
        />

        <Card hover>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-300" />
                AI Study Recommendations
              </div>
            </CardTitle>
            <CardDescription>Personalized suggestions based on your performance</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No recommendations yet</p>
            ) : (
              recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="surface-card rounded-xl p-3">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h4 className="text-sm font-medium text-slate-100">{rec.title}</h4>
                    <Badge variant={priorityVariant[rec.priority?.toLowerCase()] || 'info'}>
                      {rec.priority || 'Normal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{rec.description}</p>
                  {rec.topic && (
                    <span className="mt-2 inline-block rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] text-cyan-200">
                      {rec.topic}
                    </span>
                  )}
                </div>
              ))
            )}
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