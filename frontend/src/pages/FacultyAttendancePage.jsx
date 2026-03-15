import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Upload, Check, X, Users, ChevronLeft, ChevronRight,
  Search, Download, CheckCircle2, BarChart3, Clock, AlertTriangle,
  TrendingUp, UserX, Eye
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { facultyAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'mark', label: 'Mark Attendance', icon: Check },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'history', label: 'History', icon: Clock },
];

export default function FacultyAttendancePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mark');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Analytics state
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDept, setSummaryDept] = useState('');

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStudent, setHistoryStudent] = useState('');
  const [historySubject, setHistorySubject] = useState('');
  const [showStudentDetail, setShowStudentDetail] = useState(null);

  // FACCE001's subjects
  const subjects = [
    { id: 'CE205', name: 'CE205 - Data Structures' },
    { id: 'CE403', name: 'CE403 - Operating Systems' },
    { id: 'CE601', name: 'CE601 - Compiler Design' },
  ];

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') loadSummary();
    if (activeTab === 'history') loadHistory();
  }, [activeTab, summaryDept]);

  const loadStudents = async () => {
    try {
      const res = await facultyAPI.getStudentsMaster();
      const studentList = res.data || [];
      setStudents(studentList);
      // Initialize attendance as present for all students
      const initialAttendance = {};
      studentList.forEach(s => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const params = {};
      if (summaryDept) params.department = summaryDept;
      const res = await attendanceAPI.getSummary(params);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historyStudent) params.student_id = historyStudent;
      if (historySubject) params.subject_id = historySubject;
      const res = await attendanceAPI.getHistory(params);
      setHistoryData(res.data?.records || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const departments = [...new Set(students.map(s => s.department))].filter(Boolean);

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' ||
      student.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || student.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(s => {
      newAttendance[s.id] = 'present';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(s => {
      newAttendance[s.id] = 'absent';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const handleDone = async () => {
    setSaving(true);
    try {
      // Send each student's individual status as marked by faculty
      const attendanceData = {
        faculty_id: 'FACCE001',
        subject_id: selectedSubject || null,
        date: selectedDate,
        records: filteredStudents.map(s => ({
          student_id: s.id,
          status: attendance[s.id] || 'present',
        }))
      };

      const res = await attendanceAPI.mark(attendanceData);
      const { saved, pipeline_log } = res.data;
      setSubmitted(true);
      toast.success(`Done! ${saved} students' attendance saved for ${selectedDate}`);
      if (pipeline_log) {
        toast(`Pipeline updated → Gold layer refreshed`, { icon: '✅', duration: 4000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const resetAttendance = () => {
    const initialAttendance = {};
    students.forEach(s => {
      initialAttendance[s.id] = 'present';
    });
    setAttendance(initialAttendance);
    setSubmitted(false);
  };

  const presentCount = filteredStudents.filter(s => attendance[s.id] === 'present').length;
  const absentCount = filteredStudents.filter(s => attendance[s.id] === 'absent').length;

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Attendance Management</h1>
          <p className="text-sm text-slate-400">Mark, track, and analyze student attendance</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4" /> Upload CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-800/60 p-1 border border-slate-700/50">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex-1 justify-center ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Mark Attendance ──────────────────────────────────────── */}
      {activeTab === 'mark' && (
      <>
      {/* Date Selector & Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="rounded-lg bg-slate-700/50 p-2 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2 text-slate-100 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => changeDate(1)}
              className="rounded-lg bg-slate-700/50 p-2 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          </div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{presentCount}</p>
              <p className="text-xs text-slate-400">Present</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/20 p-2">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{absentCount}</p>
              <p className="text-xs text-slate-400">Absent</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search, Filter & Quick Actions */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search students..."
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={markAllPresent}>
              <Check className="h-3 w-3" /> All Present
            </Button>
            <Button variant="danger" size="sm" onClick={markAllAbsent}>
              <X className="h-3 w-3" /> All Absent
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-medium text-slate-300">Student ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Department</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Semester</th>
                <th className="px-4 py-3 text-center font-medium text-slate-300">Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPresent = attendance[student.id] === 'present';
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-slate-700/50 transition-colors ${
                        isPresent ? 'hover:bg-slate-800/30' : 'bg-red-500/5 hover:bg-red-500/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-cyan-400">{student.id}</td>
                      <td className="px-4 py-3 text-slate-100 font-medium">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <Badge variant="secondary">{student.department_code}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300">Sem {student.semester || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex rounded-lg border border-slate-600/50 overflow-hidden">
                          <button
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                            disabled={submitted}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isPresent
                                ? 'bg-green-500/30 text-green-300 border-r border-green-500/40'
                                : 'bg-slate-800/50 text-slate-500 border-r border-slate-600/50 hover:bg-green-500/10 hover:text-green-400'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 inline mr-1" />Present
                          </button>
                          <button
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                            disabled={submitted}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                              !isPresent
                                ? 'bg-red-500/30 text-red-300'
                                : 'bg-slate-800/50 text-slate-500 hover:bg-red-500/10 hover:text-red-400'
                            }`}
                          >
                            <X className="h-3.5 w-3.5 inline mr-1" />Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Done Button */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            {filteredStudents.length} students • {presentCount} present • {absentCount} absent
          </div>
          <div className="flex gap-3">
            {submitted && (
              <Button variant="ghost" onClick={resetAttendance}>
                Mark New Attendance
              </Button>
            )}
            <Button
              onClick={handleDone}
              disabled={saving || submitted}
              className={submitted ? 'bg-green-600/30 text-green-300' : ''}
            >
              {saving ? (
                <>Submitting...</>
              ) : submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Done — Submitted
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Done
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      </>
      )}

      {/* ── TAB: Analytics ────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          summaryData={summaryData}
          summaryLoading={summaryLoading}
          departments={departments}
          summaryDept={summaryDept}
          setSummaryDept={setSummaryDept}
          onRefresh={loadSummary}
          onViewStudent={setShowStudentDetail}
        />
      )}

      {/* ── TAB: History ──────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <HistoryTab
          historyData={historyData}
          historyLoading={historyLoading}
          historyStudent={historyStudent}
          setHistoryStudent={setHistoryStudent}
          historySubject={historySubject}
          setHistorySubject={setHistorySubject}
          onSearch={loadHistory}
        />
      )}

      {/* Student Detail Modal */}
      {showStudentDetail && (
        <StudentDetailModal
          student={showStudentDetail}
          onClose={() => setShowStudentDetail(null)}
        />
      )}

      {/* Upload Attendance Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Attendance"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Upload a CSV file with attendance data. The file should have columns: Student_ID, Status (Present/Absent)
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-slate-100 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-cyan-400/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="attendance-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target.result;
                    const rows = text.split('\n');
                    const newAttendance = { ...attendance };
                    let count = 0;
                    
                    for (let i = 1; i < rows.length; i++) {
                      const cols = rows[i].split(',');
                      if (cols.length >= 2) {
                        const sid = cols[0].trim();
                        const st = cols[1].trim().toLowerCase();
                        if (sid && (st === 'present' || st === 'absent')) {
                          newAttendance[sid] = st;
                          count++;
                        }
                      }
                    }
                    
                    if(count > 0) {
                      setAttendance(newAttendance);
                      setShowUploadModal(false);
                      toast.success(`Uploaded and parsed attendance for ${count} students`);
                    } else {
                      toast.error('Could not find any valid records in the CSV.');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <label htmlFor="attendance-file" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-slate-500 mb-3" />
              <p className="text-slate-300 font-medium">Click to upload CSV file</p>
              <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={() => {
              // Download template
              const template = "Student_ID,Status\n23AIML001,Present\n23CE001,Absent";
              const blob = new Blob([template], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'attendance_template.csv';
              a.click();
            }}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success('Attendance uploaded successfully');
                setShowUploadModal(false);
              }}>
                Upload
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  Analytics Tab
// ═══════════════════════════════════════════════════════════════════════════════

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

function AnalyticsTab({ summaryData, summaryLoading, departments, summaryDept, setSummaryDept, onRefresh, onViewStudent }) {
  if (summaryLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!summaryData || summaryData.total_students === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
        <p className="text-slate-400">No attendance analytics data available</p>
        <p className="text-sm text-slate-500 mt-1">Run the ETL pipeline or mark attendance to generate data</p>
      </Card>
    );
  }

  const { total_students, avg_attendance, below_75_count, below_60_count, students: stuList } = summaryData;

  const safe = stuList.filter(s => s.risk === 'safe').length;
  const low = stuList.filter(s => s.risk === 'low').length;
  const critical = stuList.filter(s => s.risk === 'critical').length;
  const pieData = [
    { name: 'Safe (≥75%)', value: safe },
    { name: 'Low (60-75%)', value: low },
    { name: 'Critical (<60%)', value: critical },
  ].filter(d => d.value > 0);

  const deptMap = {};
  stuList.forEach(s => {
    const dept = s.department || 'Unknown';
    if (!deptMap[dept]) deptMap[dept] = { dept, total: 0, sum: 0 };
    deptMap[dept].total++;
    deptMap[dept].sum += (s.avg_attendance || 0);
  });
  const deptBarData = Object.values(deptMap).map(d => ({
    department: d.dept.length > 20 ? d.dept.substring(0, 18) + '…' : d.dept,
    avg_attendance: d.total > 0 ? Math.round(d.sum / d.total * 10) / 10 : 0,
  })).sort((a, b) => b.avg_attendance - a.avg_attendance);

  const atRisk = [...stuList]
    .filter(s => s.avg_attendance < 75)
    .sort((a, b) => a.avg_attendance - b.avg_attendance)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select
          value={summaryDept}
          onChange={(e) => setSummaryDept(e.target.value)}
          className="rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <TrendingUp className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2.5">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total_students}</p>
              <p className="text-xs text-slate-400">Total Students</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{avg_attendance}%</p>
              <p className="text-xs text-slate-400">Avg Attendance</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{below_75_count}</p>
              <p className="text-xs text-slate-400">Below 75%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/20 p-2.5">
              <UserX className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{below_60_count}</p>
              <p className="text-xs text-slate-400">Critical (&lt;60%)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Attendance Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Department-wise Avg Attendance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fill: '#94a3b8', fontSize: 10 }} width={130} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: '#e2e8f0' }}
                  formatter={(v) => [`${v}%`, 'Avg Attendance']}
                />
                <Bar dataKey="avg_attendance" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* At-Risk Students Table */}
      {atRisk.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              At-Risk Students (Below 75% Attendance)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Student ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Department</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Attendance %</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Classes</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Risk</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map(s => (
                  <tr key={s.student_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-cyan-400">{s.student_id}</td>
                    <td className="px-4 py-3 text-slate-100">
                      {s.first_name || ''} {s.last_name || ''}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {s.department_code || s.department || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        s.avg_attendance < 60 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {s.avg_attendance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {s.classes_attended}/{s.total_classes}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.risk === 'critical' ? 'danger' : 'warning'}>
                        {s.risk === 'critical' ? 'Critical' : 'Low'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewStudent(s)}
                        className="rounded-lg bg-slate-700/50 p-1.5 hover:bg-cyan-500/20 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  History Tab
// ═══════════════════════════════════════════════════════════════════════════════

function HistoryTab({ historyData, historyLoading, historyStudent, setHistoryStudent, historySubject, setHistorySubject, onSearch }) {
  const dateGroups = useMemo(() => {
    const groups = {};
    historyData.forEach(r => {
      if (!groups[r.date]) groups[r.date] = { date: r.date, present: 0, absent: 0, total: 0 };
      groups[r.date].total++;
      if (r.status === 'present') groups[r.date].present++;
      else groups[r.date].absent++;
    });
    return Object.values(groups)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(d => ({ ...d, rate: d.total > 0 ? Math.round(d.present / d.total * 100) : 0 }));
  }, [historyData]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Student ID</label>
            <input
              type="text"
              placeholder="e.g. 25CE001"
              value={historyStudent}
              onChange={(e) => setHistoryStudent(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Subject Code</label>
            <input
              type="text"
              placeholder="e.g. CE205"
              value={historySubject}
              onChange={(e) => setHistorySubject(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <Button onClick={onSearch} disabled={historyLoading}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </Card>

      {historyLoading ? (
        <div className="skeleton h-64 w-full rounded-xl" />
      ) : historyData.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No history records found</p>
          <p className="text-sm text-slate-500 mt-1">Enter a student ID or subject code and search</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-slate-400">Total Records</p>
              <p className="text-2xl font-bold text-white">{historyData.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400">Present</p>
              <p className="text-2xl font-bold text-green-400">
                {historyData.filter(r => r.status === 'present').length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400">Absent</p>
              <p className="text-2xl font-bold text-red-400">
                {historyData.filter(r => r.status === 'absent').length}
              </p>
            </Card>
          </div>

          {dateGroups.length > 1 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Daily Attendance Rate</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...dateGroups].reverse().slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: '#e2e8f0' }}
                      formatter={(v) => [`${v}%`, 'Attendance Rate']}
                    />
                    <Bar dataKey="rate" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card>
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">
                Attendance Records ({historyData.length})
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left font-medium text-slate-300">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">Subject</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">Faculty</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.slice(0, 200).map((r, i) => (
                    <tr key={i} className={`border-b border-slate-700/50 ${
                      r.status === 'absent' ? 'bg-red-500/5' : ''
                    }`}>
                      <td className="px-4 py-2.5 text-slate-300 text-xs">{r.date}</td>
                      <td className="px-4 py-2.5 font-mono text-cyan-400 text-xs">{r.student_id}</td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs">{r.subject_id}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{r.faculty_id}</td>
                      <td className="px-4 py-2.5 text-center">
                        {r.status === 'present' ? (
                          <Badge variant="success">Present</Badge>
                        ) : (
                          <Badge variant="danger">Absent</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  Student Detail Modal
// ═══════════════════════════════════════════════════════════════════════════════

function StudentDetailModal({ student, onClose }) {
  return (
    <Modal isOpen={true} onClose={onClose} title={`${student.first_name || ''} ${student.last_name || ''}`} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Student ID</p>
            <p className="font-mono text-cyan-400">{student.student_id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Department</p>
            <p className="text-slate-200">{student.department || student.department_code || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Attendance</p>
            <p className={`text-xl font-bold ${
              student.avg_attendance < 60 ? 'text-red-400' :
              student.avg_attendance < 75 ? 'text-amber-400' : 'text-green-400'
            }`}>
              {student.avg_attendance}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Classes</p>
            <p className="text-slate-200">{student.classes_attended} / {student.total_classes}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Subjects Tracked</p>
            <p className="text-slate-200">{student.subjects_tracked}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Risk Level</p>
            <Badge variant={student.risk === 'critical' ? 'danger' : student.risk === 'low' ? 'warning' : 'success'}>
              {student.risk === 'critical' ? 'Critical' : student.risk === 'low' ? 'Low' : 'Safe'}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Attendance Progress</p>
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                student.avg_attendance < 60 ? 'bg-red-500' :
                student.avg_attendance < 75 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(student.avg_attendance, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
