import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Target, AlertTriangle, MessageSquare, ExternalLink, Lightbulb } from 'lucide-react';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-80 skeleton" />)}
        </div>
      </div>
    );
  }

  const metrics = dashboard?.latest_metrics || {};
  const sgpaTrend = (dashboard?.sgpa_trend || []).map((item, i) => ({
    name: item.semester || `Sem ${i + 1}`,
    sgpa: item.sgpa || item.value || 0,
  }));

  const subjectPerf = (dashboard?.subject_performance || []).map(item => ({
    name: item.subject || item.name || 'Subject',
    marks: item.marks || item.score || item.value || 0,
  }));

  const attendanceData = (dashboard?.attendance || []).map(item => ({
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Student Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">{dashboard?.department || 'Department'} &middot; Year {dashboard?.year || '—'}</p>
        </div>
        <Button onClick={() => navigate('/chat')}>
          <MessageSquare className="w-4 h-4" /> AI Assistant
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Current SGPA" value={latestSGPA.toFixed(2)} icon={TrendingUp} color="primary" />
        <MetricCard title="Attendance" value={`${avgAttendance}%`} icon={BookOpen} color="accent" />
        <MetricCard title="Subjects" value={subjectPerf.length} icon={Target} color="purple" />
        <MetricCard
          title="Risk Level"
          value={metrics.risk_level || 'Low'}
          icon={AlertTriangle}
          color={metrics.risk_level === 'High' || metrics.risk_level === 'Critical' ? 'danger' : metrics.risk_level === 'Medium' ? 'warning' : 'success'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard
          title="SGPA Trend"
          description="Semester-wise SGPA progression"
          data={sgpaTrend}
          lines={[{ dataKey: 'sgpa', name: 'SGPA', color: '#6366f1' }]}
          height={280}
        />
        <BarChartCard
          title="Subject Performance"
          description="Marks by subject"
          data={subjectPerf}
          dataKey="marks"
          color="#10b981"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard
          title="Attendance Distribution"
          description="Subject-wise attendance"
          data={attendanceData}
          height={280}
        />

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                AI Study Recommendations
              </div>
            </CardTitle>
            <CardDescription>Personalized suggestions based on your performance</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No recommendations yet</p>
            ) : (
              recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-zinc-200">{rec.title}</h4>
                    <Badge variant={priorityVariant[rec.priority?.toLowerCase()] || 'info'}>
                      {rec.priority || 'Normal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">{rec.description}</p>
                  {rec.topic && (
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md">
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
