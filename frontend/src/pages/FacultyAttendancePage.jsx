import { useState, useEffect } from 'react';
import { Calendar, Upload, Check, X, Users, Save, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FacultyAttendancePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await facultyAPI.getStudentsMaster();
      const studentList = res.data || [];
      setStudents(studentList);
      // Initialize attendance as present for all students
      const initialAttendance = {};
      studentList.forEach(s => {
        initialAttendance[s.student_id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(students.map(s => s.department))].filter(Boolean);

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      newAttendance[s.student_id] = 'present';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(s => {
      newAttendance[s.student_id] = 'absent';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      // Prepare attendance data
      const attendanceData = {
        date: selectedDate,
        records: Object.entries(attendance).map(([studentId, status]) => ({
          student_id: studentId,
          status: status,
        }))
      };

      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(`Attendance saved for ${selectedDate}`);
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = filteredStudents.filter(s => attendance[s.student_id] === 'present').length;
  const absentCount = filteredStudents.filter(s => attendance[s.student_id] === 'absent').length;

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
          <p className="text-sm text-slate-400">Mark and manage student attendance by date</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4" /> Upload Attendance
        </Button>
      </div>

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
                <th className="px-4 py-3 text-center font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-center font-medium text-slate-300">Mark Absent</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPresent = attendance[student.student_id] === 'present';
                  return (
                    <tr
                      key={student.student_id}
                      className={`border-b border-slate-700/50 transition-colors ${
                        isPresent ? 'hover:bg-slate-800/30' : 'bg-red-500/5 hover:bg-red-500/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-cyan-400">{student.student_id}</td>
                      <td className="px-4 py-3 text-slate-100 font-medium">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <Badge variant="secondary">{student.department_code}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300">Sem {student.semester || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={isPresent ? 'success' : 'danger'}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAttendance(student.student_id)}
                          className={`rounded-lg p-2 transition-colors ${
                            isPresent
                              ? 'bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                          title={isPresent ? 'Mark as Absent' : 'Mark as Present'}
                        >
                          {isPresent ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="flex justify-end p-4 border-t border-slate-700">
          <Button onClick={handleSaveAttendance} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Attendance
              </>
            )}
          </Button>
        </div>
      </Card>

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
