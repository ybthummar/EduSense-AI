import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, Search, Filter, BarChart3, BookOpen, Briefcase, Code, FolderGit2, Award, Activity, Mail, Phone } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MetricCard from '../components/MetricCard';
import { BarChartCard, PieChartCard } from '../components/charts';
import { facultyAPI } from '../services/api';

export default function FacultyPerformancePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [sortBy, setSortBy] = useState('student_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await facultyAPI.getStudentsPerformance();
      console.log('Performance data:', res);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load performance data:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const openSubjectModal = (student) => {
    setSelectedStudent(student);
    setShowSubjectModal(true);
  };

  const closeSubjectModal = () => {
    setShowSubjectModal(false);
    setSelectedStudent(null);
  };

  const departments = [...new Set(students.map(s => s.department))].filter(Boolean).sort();

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || student.department === filterDept;
    const matchesRisk = filterRisk === '' || student.risk_level === filterRisk;
    return matchesSearch && matchesDept && matchesRisk;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal === undefined) aVal = '';
    if (bVal === undefined) bVal = '';
    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // Calculate aggregated stats
  const avgSGPA = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.previous_sem_sgpa || 0), 0) / students.length).toFixed(2)
    : '0.00';
  const avgCurrSGPA = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.current_sem_sgpa || 0), 0) / students.length).toFixed(2)
    : '0.00';
  const avgAttendance = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.attendance_percentage || 0), 0) / students.length).toFixed(1)
    : '0.0';
  const avgMarks = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.average_marks || 0), 0) / students.length).toFixed(1)
    : '0.0';
  const atRiskCount = students.filter(s => s.risk_level === 'High' || s.risk_level === 'Critical').length;
  const internshipCount = students.filter(s => s.internship?.toLowerCase() === 'yes').length;

  // Department-wise performance
  const deptPerformance = departments.map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    const avgSgpa = deptStudents.length > 0
      ? deptStudents.reduce((sum, s) => sum + (s.current_sem_sgpa || 0), 0) / deptStudents.length
      : 0;
    return { 
      name: dept.split(' ').map(w => w.substring(0, 2)).join(''), 
      fullName: dept, 
      sgpa: parseFloat(avgSgpa.toFixed(2)) 
    };
  });

  // Risk distribution
  const riskDistribution = [
    { name: 'Low', value: students.filter(s => s.risk_level === 'Low').length, fill: '#22c55e' },
    { name: 'Medium', value: students.filter(s => s.risk_level === 'Medium').length, fill: '#f59e0b' },
    { name: 'High', value: students.filter(s => s.risk_level === 'High').length, fill: '#ef4444' },
    { name: 'Critical', value: students.filter(s => s.risk_level === 'Critical').length, fill: '#dc2626' },
  ].filter(r => r.value > 0);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary" className="text-xs">-</Badge>;
    const variant = status === 'Completed' ? 'success' : status === 'Ongoing' ? 'warning' : 'secondary';
    return <Badge variant={variant} className="text-xs">{status}</Badge>;
  };

  const getRiskBadge = (risk) => {
    const variant = risk === 'Critical' || risk === 'High' ? 'danger' : risk === 'Medium' ? 'warning' : 'success';
    return <Badge variant={variant} className="text-xs">{risk || 'Low'}</Badge>;
  };

  const getSGPAColor = (sgpa) => {
    if (!sgpa) return 'text-slate-400';
    if (sgpa >= 8) return 'text-green-400';
    if (sgpa >= 6) return 'text-cyan-400';
    if (sgpa >= 4) return 'text-amber-400';
    return 'text-red-400';
  };

  const getAttendanceColor = (attendance) => {
    if (!attendance) return 'text-slate-400';
    if (attendance >= 85) return 'text-green-400';
    if (attendance >= 75) return 'text-cyan-400';
    if (attendance >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-80 rounded-xl" />)}
        </div>
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">📊 Student Performance Analysis</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time academic metrics from engineering_student_master_data.csv</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard title="Prev SGPA" value={avgSGPA} icon={TrendingUp} color="primary" />
        <MetricCard title="Current SGPA" value={avgCurrSGPA} icon={BarChart3} color="info" />
        <MetricCard title="Avg Marks" value={`${avgMarks}`} icon={Code} color="secondary" />
        <MetricCard title="Avg Attendance" value={`${avgAttendance}%`} icon={BookOpen} color="accent" />
        <MetricCard title="At-Risk" value={atRiskCount} icon={AlertTriangle} color="danger" />
        <MetricCard title="Internship" value={internshipCount} icon={Briefcase} color="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Dept-wise Current SGPA"
          description="Average current semester performance by department"
          data={deptPerformance}
          dataKey="sgpa"
          color="#22d3ee"
          height={280}
        />
        <PieChartCard
          title="Risk Distribution"
          description="Students by academic risk level"
          data={riskDistribution}
          height={280}
        />
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-slate-800/50 border border-slate-700/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
          <Badge variant="primary" className="text-xs whitespace-nowrap">
            {sortedStudents.length} / {students.length} Students
          </Badge>
        </div>
      </Card>

      {/* Performance Table */}
      <Card className="overflow-hidden border border-slate-700/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="border-b border-slate-700/70 bg-slate-800/70">
                <SortableHeader label="Student ID" column="student_id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Name" column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-slate-300 text-xs">Dept</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-slate-300 text-xs">Sem</th>
                <SortableHeader label="Prev SGPA" column="previous_sem_sgpa" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Curr SGPA" column="current_sem_sgpa" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Avg Marks" column="average_marks" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Attendance" column="attendance_percentage" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-1 md:px-3 py-2 md:py-3 text-center font-semibold text-slate-300"><Code className="h-3.5 w-3.5 mx-auto" title="DevOps" /></th>
                <th className="px-1 md:px-3 py-2 md:py-3 text-center font-semibold text-slate-300"><FolderGit2 className="h-3.5 w-3.5 mx-auto" title="Project" /></th>
                <th className="px-1 md:px-3 py-2 md:py-3 text-center font-semibold text-slate-300"><Briefcase className="h-3.5 w-3.5 mx-auto" title="Internship" /></th>
                <th className="px-1 md:px-3 py-2 md:py-3 text-center font-semibold text-slate-300"><Award className="h-3.5 w-3.5 mx-auto" title="Extracurricular" /></th>
                <th className="px-3 py-3 text-center font-semibold text-slate-300">Subjects</th>
                <SortableHeader label="Risk" column="risk_level" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    No students found matching your criteria
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => (
                  <tr
                    key={student.student_id}
                    className={`border-b border-slate-700/30 transition-colors hover:bg-slate-800/40 ${
                      student.risk_level === 'Critical' ? 'bg-red-950/20' : 
                      student.risk_level === 'High' ? 'bg-red-900/10' : ''
                    }`}
                    title={`${student.name} - ${student.email}`}
                  >
                    <td className="px-2 md:px-3 py-2 font-mono text-cyan-400 text-xs">{student.student_id}</td>
                    <td className="px-2 md:px-3 py-2 text-slate-100 font-medium truncate max-w-xs">{student.name || '-'}</td>
                    <td className="px-2 md:px-3 py-2 text-xs text-slate-300">{student.department_code || student.department?.substring(0, 3) || '-'}</td>
                    <td className="px-2 md:px-3 py-2 text-center text-slate-300 font-medium">{student.semester}</td>
                    <td className={`px-2 md:px-3 py-2 text-center font-semibold text-sm ${getSGPAColor(student.previous_sem_sgpa)}`}>
                      {student.previous_sem_sgpa?.toFixed(2) || '0.00'}
                    </td>
                    <td className={`px-2 md:px-3 py-2 text-center font-semibold text-sm ${getSGPAColor(student.current_sem_sgpa)}`}>
                      {student.current_sem_sgpa?.toFixed(2) || '0.00'}
                    </td>
                    <td className={`px-2 md:px-3 py-2 text-center font-semibold text-sm ${getSGPAColor(student.average_marks / 10)}`}>
                      {student.average_marks?.toFixed(1) || '-'}
                    </td>
                    <td className={`px-2 md:px-3 py-2 text-center font-semibold text-sm ${getAttendanceColor(student.attendance_percentage)}`}>
                      {student.attendance_percentage?.toFixed(0) || '-'}%
                    </td>
                    <td className="px-1 md:px-3 py-2 text-center">{getStatusBadge(student.devops_status)}</td>
                    <td className="px-1 md:px-3 py-2 text-center">{getStatusBadge(student.project_status)}</td>
                    <td className="px-1 md:px-3 py-2 text-center">
                      <Badge variant={student.internship?.toLowerCase() === 'yes' ? 'success' : 'secondary'} className="text-xs">
                        {student.internship === 'Yes' ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-1 md:px-3 py-2 text-center">
                      <Badge variant={
                        student.extracurricular_level === 'High' ? 'success' :
                        student.extracurricular_level === 'Medium' ? 'warning' : 'secondary'
                      } className="text-xs">
                        {student.extracurricular_level?.substring(0, 1) || '-'}
                      </Badge>
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openSubjectModal(student); }}
                        className="text-xs px-2 py-1"
                      >
                        View
                      </Button>
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center">{getRiskBadge(student.risk_level)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showSubjectModal && selectedStudent && (
        <Modal open onClose={closeSubjectModal} title={`Subject-wise marks: ${selectedStudent.name}`} size="xl">
          <div className="space-y-3">
            <p className="text-sm text-slate-300">This list is sourced from the current semester subject marks in enriched dataset.</p>
            <div className="grid gap-2">
              {selectedStudent.current_subjects?.length ? selectedStudent.current_subjects.map((sub, idx) => (
                <div key={`${sub.subject_code}-${idx}`} className="flex items-center justify-between bg-slate-900/70 rounded-lg p-2 border border-slate-700">
                  <span className="text-slate-200 font-medium">{sub.subject_code}</span>
                  <span className="text-cyan-300 font-semibold">{sub.marks != null ? `${sub.marks}` : 'N/A'}</span>
                </div>
              )) : (
                <div className="text-slate-400">No subject marks available.</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Data Source Info */}
      <Card className="p-4 bg-slate-800/50 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" />
          Data Source & Legend
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-medium text-slate-400 mb-2">📁 Source: engineering_student_master_data.csv + enriched dataset</p>
            <ul className="space-y-1 text-slate-300">
              <li>• Student profiles fetched from master data</li>
              <li>• Performance metrics from enriched academic dataset</li>
              <li>• Real-time SGPA calculation from course marks</li>
              <li>• Automatic risk assessment based on attendance & marks</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-400 mb-2">🎯 Color Indicators</p>
            <ul className="space-y-1 text-slate-300">
              <li>🟢 SGPA/Attendance ≥ Good → <span className="text-green-400">Green</span></li>
              <li>🔵 SGPA/Attendance ≥ Fair → <span className="text-cyan-400">Cyan</span></li>
              <li>🟡 SGPA/Attendance ≥ Below Par → <span className="text-amber-400">Amber</span></li>
              <li>🔴 SGPA/Attendance below threshold → <span className="text-red-400">Red</span></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SortableHeader({ label, column, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === column;
  return (
    <th
      className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-slate-300 cursor-pointer hover:text-cyan-400 transition-colors text-xs"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`text-xs transition-colors ${isActive ? 'text-cyan-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}>
          {isActive && (sortOrder === 'asc' ? '↑' : '↓')}
        </span>
      </div>
    </th>
  );
}
