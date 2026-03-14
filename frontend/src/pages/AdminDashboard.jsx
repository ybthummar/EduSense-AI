import { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, AlertTriangle, Plus, Activity, BarChart3 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { BarChartCard } from '../components/charts';
import { PieChartCard } from '../components/charts';
import { AreaChartCard } from '../components/charts';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { adminAPI, datasetAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFaculty, setShowCreateFaculty] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', department: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, studentsRes] = await Promise.all([
        adminAPI.getDashboard(),
        datasetAPI.getData('student_master', { limit: 200 }),
      ]);
      setMetrics(dashRes.data);
      setStudents(studentsRes.data.rows || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminAPI.createFaculty(facultyForm);
      toast.success(`Faculty created! Password: ${res.data.generated_password}`);
      setShowCreateFaculty(false);
      setFacultyForm({ name: '', email: '', department: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create faculty');
    } finally {
      setCreating(false);
    }
  };

  // Derive chart data from students
  const departmentCounts = students.reduce((acc, s) => {
    const dept = s.Department || s.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const deptChartData = Object.entries(departmentCounts).map(([name, value]) => ({ name, value }));

  const riskCounts = students.reduce((acc, s) => {
    const risk = s.Academic_Risk_Score || s.risk_score || 0;
    if (risk >= 75) acc.Critical++;
    else if (risk >= 60) acc.High++;
    else if (risk >= 40) acc.Medium++;
    else acc.Low++;
    return acc;
  }, { Critical: 0, High: 0, Medium: 0, Low: 0 });

  const riskChartData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

  const semesterData = students.reduce((acc, s) => {
    const sem = `Sem ${s.Semester || s.semester || '?'}`;
    acc[sem] = (acc[sem] || 0) + 1;
    return acc;
  }, {});
  const semChartData = Object.entries(semesterData).map(([name, count]) => ({ name, count }));

  const atRiskCount = students.filter(s => (s.Academic_Risk_Score || s.risk_score || 0) >= 60).length;
  const avgGPA = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.CGPA || s.gpa || 0), 0) / students.length).toFixed(2)
    : '0.00';
  const avgAttendance = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.Attendance_Percentage || s.attendance || 0), 0) / students.length).toFixed(1) + '%'
    : '0%';

  const studentColumns = [
    { header: 'Name', accessor: 'Name', render: (v) => <span className="font-medium text-slate-100">{v || 'N/A'}</span> },
    { header: 'Department', accessor: 'Department' },
    { header: 'Semester', accessor: 'Semester' },
    { header: 'CGPA', accessor: 'CGPA', render: (v) => <span className="font-mono">{v ? Number(v).toFixed(2) : 'N/A'}</span> },
    { header: 'Attendance', accessor: 'Attendance_Percentage', render: (v) => <span className="font-mono">{v ? `${Number(v).toFixed(1)}%` : 'N/A'}</span> },
    {
      header: 'Risk',
      accessor: 'Academic_Risk_Score',
      render: (v) => {
        const score = Number(v) || 0;
        if (score >= 75) return <Badge variant="danger">Critical</Badge>;
        if (score >= 60) return <Badge variant="warning">High</Badge>;
        if (score >= 40) return <Badge variant="info">Medium</Badge>;
        return <Badge variant="success">Low</Badge>;
      },
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">System overview and management</p>
        </div>
        <Button onClick={() => setShowCreateFaculty(true)}>
          <Plus className="w-4 h-4" /> Add Faculty
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Students" value={metrics?.total_students || students.length} icon={GraduationCap} color="primary" />
        <MetricCard title="Total Faculty" value={metrics?.total_faculty || 0} icon={Users} color="accent" />
        <MetricCard title="Departments" value={metrics?.departments?.length || Object.keys(departmentCounts).length} icon={Building2} color="purple" />
        <MetricCard title="At Risk Students" value={atRiskCount} icon={AlertTriangle} color="danger" changeType={atRiskCount > 10 ? 'down' : 'up'} change={`${((atRiskCount / Math.max(students.length, 1)) * 100).toFixed(0)}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard title="Students by Department" description="Distribution across departments" data={deptChartData} height={280} />
        <BarChartCard title="Risk Distribution" description="Student risk level breakdown" data={riskChartData} dataKey="value" color="#fb923c" height={280} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChartCard title="Students by Semester" description="Enrollment per semester" data={semChartData} dataKey="count" color="#22d3ee" height={280} />
        <div className="surface-card surface-card-hover rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/12 text-cyan-300">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Quick Stats</h3>
              <p className="text-xs text-slate-400">Key performance indicators</p>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Average CGPA', value: avgGPA, color: 'text-cyan-300' },
              { label: 'Average Attendance', value: avgAttendance, color: 'text-emerald-300' },
              { label: 'Total Departments', value: Object.keys(departmentCounts).length, color: 'text-orange-300' },
              { label: 'At-Risk Rate', value: `${((atRiskCount / Math.max(students.length, 1)) * 100).toFixed(1)}%`, color: 'text-red-300' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-slate-800/40">
                <span className="text-sm text-slate-300">{stat.label}</span>
                <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">All Students</h2>
        </div>
        <DataTable columns={studentColumns} data={students} pageSize={10} />
      </div>

      {/* Create Faculty Modal */}
      <Modal open={showCreateFaculty} onClose={() => setShowCreateFaculty(false)} title="Add New Faculty">
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <Input label="Full Name" value={facultyForm.name} onChange={e => setFacultyForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. John Doe" required />
          <Input label="Email" type="email" value={facultyForm.email} onChange={e => setFacultyForm(p => ({ ...p, email: e.target.value }))} placeholder="john@university.edu" required />
          <Input label="Department" value={facultyForm.department} onChange={e => setFacultyForm(p => ({ ...p, department: e.target.value }))} placeholder="Computer Science" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateFaculty(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Faculty</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
