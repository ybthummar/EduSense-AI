import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Target, AlertTriangle, MessageSquare, Lightbulb } from 'lucide-react';
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
    name: item.subject || item.name || 'Subject',
    marks: item.marks || item.score || item.value || 0,
  }));

  const attendanceData = (dashboard?.attendance || []).map((item) => ({
    name: item.subject || item.name || 'Subject',
    value: item.percentage || item.value || 0,
  }));

  const latestSGPA = sgpaTrend.length > 0 ? sgpaTrend[sgpaTrend.length - 1].sgpa : 0;
  const avgAttendance = attendanceData.length > 0
    ? (attendanceData.reduce((sum, d) => sum + d.value, 0) / attendanceData.length).toFixed(1)
    : '0';

  const priorityVariant = { high: 'danger', medium: 'warning', low: 'info' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Student Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            {dashboard?.department || 'Department'} &middot; Year {dashboard?.year || '-'}
          </p>
        </div>
        <Button onClick={() => navigate('/chat')}>
          <MessageSquare className="h-4 w-4" /> AI Assistant
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Current SGPA" value={latestSGPA.toFixed(2)} icon={TrendingUp} color="primary" />
        <MetricCard title="Attendance" value={`${avgAttendance}%`} icon={BookOpen} color="accent" />
        <MetricCard title="Subjects" value={subjectPerf.length} icon={Target} color="purple" />
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
          description="Marks by subject"
          data={subjectPerf}
          dataKey="marks"
          color="#34d399"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PieChartCard
          title="Attendance Distribution"
          description="Subject-wise attendance"
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
    </div>
  );
}