import { useState, useEffect, useMemo } from 'react';
import { Users, GraduationCap, AlertTriangle, Plus, TrendingUp, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { PieChartCard, BarChartCard, AreaChartCard } from '../components/charts';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { adminAPI, facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFaculty, setShowCreateFaculty] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', department: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, studentsRes] = await Promise.all([
          adminAPI.getDashboard(),
          facultyAPI.getStudentsMaster({ limit: 500 }),
        ]);
        setMetrics(dashRes.data);
        setStudents(studentsRes.data || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminAPI.createFaculty(facultyForm);
      toast.success(`Faculty created! Password: ${res.data.generated_password}`);
      setShowCreateFaculty(false);
      setFacultyForm({ name: '', email: '', department: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create faculty');
    } finally {
      setCreating(false);
    }
  };

  // ── Derived analytics ─────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!students.length) return null;
    const total = students.length;

    // KPIs
    const avgGPA = +(students.reduce((s, st) => s + (st.gpa || 0), 0) / total).toFixed(2);
    const avgAtt = +(students.reduce((s, st) => s + (st.attendance || 0), 0) / total).toFixed(1);
    const atRisk = students.filter((s) => s.risk === 'High' || s.risk === 'Critical').length;

    // Gender distribution (unique to admin)
    const genderMap = {};
    students.forEach((s) => {
      const g = s.gender || 'Unknown';
      genderMap[g] = (genderMap[g] || 0) + 1;
    });
    const genderPie = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

    // Admission type breakdown (unique to admin)
    const admMap = {};
    students.forEach((s) => {
      const a = s.admission_type || 'Unknown';
      admMap[a] = (admMap[a] || 0) + 1;
    });
    const admissionPie = Object.entries(admMap).map(([name, value]) => ({ name, value }));

    // Department-wise avg GPA bar (unique - not individual student/faculty level)
    const deptGPA = {};
    const deptCount = {};
    students.forEach((s) => {
      const d = s.department_code || s.department || 'Unknown';
      deptGPA[d] = (deptGPA[d] || 0) + (s.gpa || 0);
      deptCount[d] = (deptCount[d] || 0) + 1;
    });
    const deptGPABar = Object.entries(deptGPA)
      .map(([name, sum]) => ({ name, gpa: +(sum / deptCount[name]).toFixed(2) }))
      .sort((a, b) => b.gpa - a.gpa);

    // Enrollment by year (unique to admin)
    const yearMap = {};
    students.forEach((s) => {
      const y = s.enrollment_year || 'Unknown';
      yearMap[y] = (yearMap[y] || 0) + 1;
    });
    const enrollmentByYear = Object.entries(yearMap)
      .map(([name, count]) => ({ name: String(name), count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Semester-wise distribution
    const semMap = {};
    students.forEach((s) => {
      const sem = `Sem ${s.semester || '?'}`;
      semMap[sem] = (semMap[sem] || 0) + 1;
    });
    const semesterDist = Object.entries(semMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { total, avgGPA, avgAtt, atRisk, genderPie, admissionPie, deptGPABar, enrollmentByYear, semesterDist };
  }, [students]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 skeleton rounded-2xl" />)}
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
          <p className="mt-1 text-sm text-slate-400">Institution-wide overview</p>
        </div>
        <Button onClick={() => setShowCreateFaculty(true)}>
          <Plus className="w-4 h-4" /> Add Faculty
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Total Students" value={derived?.total || 0} icon={GraduationCap} color="primary" />
        <MetricCard title="Total Faculty" value={metrics?.total_faculty || 0} icon={Users} color="accent" />
        <MetricCard title="Avg GPA" value={derived?.avgGPA || '–'} icon={TrendingUp} color="success" subtitle="across all students" />
        <MetricCard
          title="At Risk"
          value={derived?.atRisk || 0}
          icon={AlertTriangle}
          color="danger"
          change={derived ? `${((derived.atRisk / Math.max(derived.total, 1)) * 100).toFixed(0)}%` : undefined}
          changeType="down"
        />
      </div>

      {/* Row 1: Gender + Admission type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PieChartCard title="Gender Distribution" description="Student gender breakdown" data={derived?.genderPie || []} height={260} />
        <PieChartCard title="Admission Type" description="Regular vs lateral vs management" data={derived?.admissionPie || []} height={260} />
      </div>

      {/* Row 2: Dept GPA + Enrollment trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarChartCard title="Department-wise Avg GPA" description="Academic performance by department" data={derived?.deptGPABar || []} dataKey="gpa" color="#34d399" height={280} />
        <AreaChartCard title="Enrollment by Year" description="Intake trend over admission years" data={derived?.enrollmentByYear || []} dataKey="count" color="#22d3ee" height={280} />
      </div>

      {/* Row 3: Semester distribution */}
      <BarChartCard title="Students by Semester" description="Current semester distribution" data={derived?.semesterDist || []} dataKey="count" color="#a78bfa" height={260} />

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
