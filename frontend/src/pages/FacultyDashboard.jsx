import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, BookOpen, Plus, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { BarChartCard } from '../components/charts';
import { PieChartCard } from '../components/charts';
import { LineChartCard } from '../components/charts';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ student_id: '', name: '', email: '', department: '', semester: '' });
  const [adding, setAdding] = useState(false);

  const facultyId = user?.faculty_id || user?.id || 'FAC_001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studRes, analyticsRes] = await Promise.all([
        facultyAPI.getStudents(facultyId),
        facultyAPI.getAnalytics(facultyId),
      ]);
      setStudents(studRes.data || []);
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      console.error('Failed to load faculty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await facultyAPI.addStudent({ ...studentForm, faculty_id: facultyId, semester: Number(studentForm.semester) });
      toast.success('Student added successfully');
      setShowAddStudent(false);
      setStudentForm({ student_id: '', name: '', email: '', department: '', semester: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  // Derive charts from student data
  const riskDistribution = students.reduce((acc, s) => {
    const risk = s.risk || 'Low';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {});
  const riskData = Object.entries(riskDistribution).map(([name, value]) => ({ name, value }));

  const semesterGpa = students.reduce((acc, s) => {
    const sem = `Sem ${s.semester || '?'}`;
    if (!acc[sem]) acc[sem] = { total: 0, count: 0 };
    acc[sem].total += (s.gpa || 0);
    acc[sem].count++;
    return acc;
  }, {});
  const gpaData = Object.entries(semesterGpa).map(([name, { total, count }]) => ({ name, gpa: Number((total / count).toFixed(2)) }));

  const attendanceDistribution = [
    { name: '90-100%', value: students.filter(s => (s.attendance || 0) >= 90).length },
    { name: '75-89%', value: students.filter(s => (s.attendance || 0) >= 75 && (s.attendance || 0) < 90).length },
    { name: '60-74%', value: students.filter(s => (s.attendance || 0) >= 60 && (s.attendance || 0) < 75).length },
    { name: '<60%', value: students.filter(s => (s.attendance || 0) < 60).length },
  ].filter(d => d.value > 0);

  const columns = [
    { header: 'Name', accessor: 'name', render: (v) => <span className="font-medium text-slate-100">{v}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'GPA', accessor: 'gpa', render: (v) => <span className="font-mono">{v ? Number(v).toFixed(2) : 'N/A'}</span> },
    { header: 'Attendance', accessor: 'attendance', render: (v) => <span className="font-mono">{v ? `${Number(v).toFixed(1)}%` : 'N/A'}</span> },
    {
      header: 'Risk',
      accessor: 'risk',
      render: (v) => {
        const r = (v || 'Low').toLowerCase();
        if (r === 'critical' || r === 'high') return <Badge variant="danger">{v}</Badge>;
        if (r === 'medium') return <Badge variant="warning">{v}</Badge>;
        return <Badge variant="success">{v}</Badge>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton" />)}
        </div>
        <div className="h-96 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Faculty Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Track and manage your students</p>
        </div>
        <Button onClick={() => setShowAddStudent(true)}>
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Students" value={analytics?.total_students || students.length} icon={Users} color="primary" />
        <MetricCard title="Avg GPA" value={analytics?.class_avg_gpa?.toFixed(2) || '0.00'} icon={TrendingUp} color="success" />
        <MetricCard title="Avg Attendance" value={analytics?.avg_attendance ? `${analytics.avg_attendance.toFixed(1)}%` : '0%'} icon={BookOpen} color="accent" />
        <MetricCard title="At Risk" value={analytics?.at_risk_count || 0} icon={AlertTriangle} color="danger" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BarChartCard title="GPA by Semester" description="Average GPA per semester" data={gpaData} dataKey="gpa" color="#34d399" height={260} />
        <PieChartCard title="Risk Distribution" description="Student risk levels" data={riskData} height={260} />
        <PieChartCard title="Attendance Distribution" description="Attendance ranges" data={attendanceDistribution} height={260} colors={['#34d399', '#22d3ee', '#fb923c', '#f87171']} />
      </div>

      {/* Students Table */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">My Students</h2>
        </div>
        <DataTable
          columns={columns}
          data={students}
          pageSize={10}
          onRowClick={(row) => setSelectedStudent(row)}
        />
      </div>

      {/* Student Detail Modal */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" size="lg">
        {selectedStudent && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Name', value: selectedStudent.name },
              { label: 'Department', value: selectedStudent.department },
              { label: 'GPA', value: selectedStudent.gpa?.toFixed(2) || 'N/A' },
              { label: 'Attendance', value: selectedStudent.attendance ? `${selectedStudent.attendance.toFixed(1)}%` : 'N/A' },
              { label: 'Semester', value: selectedStudent.semester },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.09em] text-slate-500">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-100">{item.value}</p>
              </div>
            ))}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5">
              <p className="mb-1 text-[11px] uppercase tracking-[0.09em] text-slate-500">Risk Level</p>
              <Badge variant={selectedStudent.risk?.toLowerCase() === 'high' || selectedStudent.risk?.toLowerCase() === 'critical' ? 'danger' : selectedStudent.risk?.toLowerCase() === 'medium' ? 'warning' : 'success'}>
                {selectedStudent.risk || 'Low'}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal open={showAddStudent} onClose={() => setShowAddStudent(false)} title="Add New Student">
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input label="Student ID" value={studentForm.student_id} onChange={e => setStudentForm(p => ({ ...p, student_id: e.target.value }))} placeholder="STU_001" required />
          <Input label="Full Name" value={studentForm.name} onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" required />
          <Input label="Email" type="email" value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@university.edu" required />
          <Input label="Department" value={studentForm.department} onChange={e => setStudentForm(p => ({ ...p, department: e.target.value }))} placeholder="Computer Science" required />
          <Input label="Semester" type="number" min="1" max="8" value={studentForm.semester} onChange={e => setStudentForm(p => ({ ...p, semester: e.target.value }))} placeholder="1" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddStudent(false)}>Cancel</Button>
            <Button type="submit" loading={adding}>Add Student</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
