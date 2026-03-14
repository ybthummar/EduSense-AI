import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, Search, Filter, BarChart3, BookOpen, Briefcase, Code, FolderGit2, Award, Activity } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
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

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const res = await facultyAPI.getStudentsPerformance();
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(students.map(s => s.department))].filter(Boolean);

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || student.department === filterDept;
    const matchesRisk = filterRisk === '' || student.risk_level === filterRisk;
    return matchesSearch && matchesDept && matchesRisk;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // Calculate aggregated stats
  const avgSGPA = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.previous_sem_sgpa || 0), 0) / students.length).toFixed(2)
    : '0';
  const avgAttendance = students.length > 0
    ? (students.reduce((sum, s) => sum + (s.attendance_percentage || 0), 0) / students.length).toFixed(1)
    : '0';
  const atRiskCount = students.filter(s => s.risk_level === 'High' || s.risk_level === 'Critical').length;
  const internshipCount = students.filter(s => s.internship === 'Yes').length;

  // Department-wise performance data for chart
  const deptPerformance = departments.map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    const avgSgpa = deptStudents.length > 0
      ? deptStudents.reduce((sum, s) => sum + (s.previous_sem_sgpa || 0), 0) / deptStudents.length
      : 0;
    return { name: dept.split(' ').map(w => w[0]).join(''), fullName: dept, sgpa: parseFloat(avgSgpa.toFixed(2)) };
  });

  // Risk distribution for pie chart
  const riskDistribution = [
    { name: 'Low', value: students.filter(s => s.risk_level === 'Low').length, fill: '#22c55e' },
    { name: 'Medium', value: students.filter(s => s.risk_level === 'Medium').length, fill: '#f59e0b' },
    { name: 'High', value: students.filter(s => s.risk_level === 'High').length, fill: '#ef4444' },
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
    if (!status) return <Badge variant="secondary">-</Badge>;
    const variant = status === 'Completed' ? 'success' : status === 'Ongoing' ? 'warning' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getRiskBadge = (risk) => {
    const variant = risk === 'High' || risk === 'Critical' ? 'danger' : risk === 'Medium' ? 'warning' : 'success';
    return <Badge variant={variant}>{risk || 'Low'}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Student Performance Analysis</h1>
        <p className="text-sm text-slate-400">Comprehensive academic performance metrics from enriched dataset</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Average SGPA" value={avgSGPA} icon={TrendingUp} color="primary" />
        <MetricCard title="Avg Attendance" value={`${avgAttendance}%`} icon={BookOpen} color="accent" />
        <MetricCard title="At-Risk Students" value={atRiskCount} icon={AlertTriangle} color="danger" />
        <MetricCard title="With Internship" value={internshipCount} icon={Briefcase} color="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Department-wise SGPA"
          description="Average SGPA by department"
          data={deptPerformance}
          dataKey="sgpa"
          color="#22d3ee"
          height={250}
        />
        <PieChartCard
          title="Risk Distribution"
          description="Students by academic risk level"
          data={riskDistribution}
          height={250}
        />
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
          <Badge variant="primary">
            <Users className="h-3 w-3 mr-1" />
            {sortedStudents.length} Students
          </Badge>
        </div>
      </Card>

      {/* Performance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <SortableHeader label="Student ID" column="student_id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Name" column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-3 py-3 text-left font-medium text-slate-300">Dept</th>
                <SortableHeader label="Prev SGPA" column="previous_sem_sgpa" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Curr SGPA" column="current_sem_sgpa" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Attendance" column="attendance_percentage" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-3 py-3 text-center font-medium text-slate-300">
                  <div className="flex items-center justify-center gap-1"><Code className="h-3 w-3" /> DevOps</div>
                </th>
                <th className="px-3 py-3 text-center font-medium text-slate-300">
                  <div className="flex items-center justify-center gap-1"><FolderGit2 className="h-3 w-3" /> Project</div>
                </th>
                <th className="px-3 py-3 text-center font-medium text-slate-300">
                  <div className="flex items-center justify-center gap-1"><Briefcase className="h-3 w-3" /> Internship</div>
                </th>
                <th className="px-3 py-3 text-center font-medium text-slate-300">
                  <div className="flex items-center justify-center gap-1"><Award className="h-3 w-3" /> Extra</div>
                </th>
                <SortableHeader label="Risk" column="risk_level" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No students found matching your criteria
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => (
                  <tr
                    key={student.student_id}
                    className={`border-b border-slate-700/50 transition-colors hover:bg-slate-800/30 ${
                      student.risk_level === 'High' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-mono text-cyan-400 text-xs">{student.student_id}</td>
                    <td className="px-3 py-3 text-slate-100 font-medium">{student.name || '-'}</td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">{student.department_code || '-'}</Badge>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${
                        (student.previous_sem_sgpa || 0) >= 8 ? 'text-green-400' :
                        (student.previous_sem_sgpa || 0) >= 6 ? 'text-cyan-400' :
                        (student.previous_sem_sgpa || 0) >= 4 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {student.previous_sem_sgpa?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${
                        (student.current_sem_sgpa || 0) >= 8 ? 'text-green-400' :
                        (student.current_sem_sgpa || 0) >= 6 ? 'text-cyan-400' :
                        (student.current_sem_sgpa || 0) >= 4 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {student.current_sem_sgpa?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${
                        (student.attendance_percentage || 0) >= 85 ? 'text-green-400' :
                        (student.attendance_percentage || 0) >= 75 ? 'text-cyan-400' :
                        (student.attendance_percentage || 0) >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {student.attendance_percentage?.toFixed(0) || '-'}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">{getStatusBadge(student.devops_status)}</td>
                    <td className="px-3 py-3 text-center">{getStatusBadge(student.project_status)}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={student.internship === 'Yes' ? 'success' : 'secondary'}>
                        {student.internship || 'No'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={
                        student.extracurricular_level === 'High' ? 'success' :
                        student.extracurricular_level === 'Medium' ? 'warning' : 'secondary'
                      }>
                        {student.extracurricular_level || '-'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center">{getRiskBadge(student.risk_level)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="success">Completed</Badge>
            <span className="text-slate-400">Task finished</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Ongoing</Badge>
            <span className="text-slate-400">In progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Not Started</Badge>
            <span className="text-slate-400">Not yet begun</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="danger">High Risk</Badge>
            <span className="text-slate-400">Needs attention</span>
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
      className="px-3 py-3 text-left font-medium text-slate-300 cursor-pointer hover:text-cyan-400 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );
}
