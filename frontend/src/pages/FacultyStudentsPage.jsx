import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, MapPin, ChevronDown, ChevronUp, Search, Filter, X, ExternalLink } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { facultyAPI } from '../services/api';

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await facultyAPI.getStudentsMaster();
      setStudents(res.data || []);
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
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || student.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const toggleExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
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
          <h1 className="text-2xl font-bold text-slate-100">Student Directory</h1>
          <p className="text-sm text-slate-400">View and manage all students in your department</p>
        </div>
        <Badge variant="primary" className="self-start">
          <Users className="h-3 w-3 mr-1" />
          {filteredStudents.length} Students
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
            />
          </div>
          <div className="flex gap-2">
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
            {(searchTerm || filterDept) && (
              <Button variant="ghost" onClick={() => { setSearchTerm(''); setFilterDept(''); }}>
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-medium text-slate-300">Student ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Year</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Department</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Code</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">First Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Last Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Phone</th>
                <th className="px-4 py-3 text-center font-medium text-slate-300">Call</th>
                <th className="px-4 py-3 text-center font-medium text-slate-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No students found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <React.Fragment key={student.student_id}>
                    <tr
                      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(student.student_id)}
                    >
                      <td className="px-4 py-3 font-mono text-cyan-400 font-medium">{student.student_id}</td>
                      <td className="px-4 py-3 text-slate-200">{student.current_year || '-'}</td>
                      <td className="px-4 py-3 text-slate-200 max-w-[150px] truncate" title={student.department}>
                        {student.department || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{student.department_code || '-'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-100 font-medium">{student.first_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-100">{student.last_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate" title={student.email}>
                        {student.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{student.phone_number || '-'}</td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {student.phone_number && (
                          <button
                            onClick={() => handleCall(student.phone_number)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30 transition-colors"
                            title={`Call ${student.phone_number}`}
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(student.student_id); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                        >
                          More {expandedStudent === student.student_id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === student.student_id && (
                      <tr className="bg-slate-800/80 border-b border-slate-700/50">
                        <td colSpan={10} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Personal Info</h4>
                              <DetailItem label="Gender" value={student.gender} />
                              <DetailItem label="Date of Birth" value={student.date_of_birth} />
                              <DetailItem label="City" value={student.city} icon={<MapPin className="h-4 w-4" />} />
                              <DetailItem label="State" value={student.state} />
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Academic Details</h4>
                              <DetailItem label="Enrollment Year" value={student.enrollment_year} />
                              <DetailItem label="Admission Type" value={student.admission_type} />
                              <DetailItem label="Semester" value={student.semester} />
                              <DetailItem label="Status" value={<Badge variant={student.status === 'Active' ? 'success' : 'secondary'}>{student.status}</Badge>} />
                            </div>
                            <div className="space-y-3 flex flex-col justify-center items-center bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                               <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white mb-2">
                                {(student.first_name || 'S').charAt(0).toUpperCase()}
                               </div>
                               <h3 className="text-lg font-bold text-slate-100">{student.first_name} {student.last_name}</h3>
                               <p className="text-cyan-400 font-mono text-sm mb-4">{student.student_id}</p>
                               {student.phone_number && (
                                <Button variant="success" className="w-full" onClick={() => handleCall(student.phone_number)}>
                                  <Phone className="h-4 w-4 mr-2" /> Call Student
                                </Button>
                               )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Student Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white">
                {(selectedStudent.first_name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
                <p className="text-cyan-400 font-mono">{selectedStudent.student_id}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="Email" value={selectedStudent.email} icon={<Mail className="h-4 w-4" />} />
              <DetailItem
                label="Phone"
                value={selectedStudent.phone_number}
                icon={<Phone className="h-4 w-4" />}
                action={
                  selectedStudent.phone_number && (
                    <button
                      onClick={() => handleCall(selectedStudent.phone_number)}
                      className="ml-2 rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30"
                    >
                      Call
                    </button>
                  )
                }
              />
              <DetailItem label="Gender" value={selectedStudent.gender} />
              <DetailItem label="Date of Birth" value={selectedStudent.date_of_birth} />
              <DetailItem label="City" value={selectedStudent.city} icon={<MapPin className="h-4 w-4" />} />
              <DetailItem label="State" value={selectedStudent.state} />
              <DetailItem label="Department" value={selectedStudent.department} />
              <DetailItem label="Department Code" value={selectedStudent.department_code} />
              <DetailItem label="Enrollment Year" value={selectedStudent.enrollment_year} />
              <DetailItem label="Current Year" value={selectedStudent.current_year} />
              <DetailItem label="Semester" value={selectedStudent.semester} />
              <DetailItem label="Admission Type" value={selectedStudent.admission_type} />
              <DetailItem
                label="Status"
                value={
                  <Badge variant={selectedStudent.status === 'Active' ? 'success' : 'secondary'}>
                    {selectedStudent.status}
                  </Badge>
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              {selectedStudent.phone_number && (
                <Button variant="success" onClick={() => handleCall(selectedStudent.phone_number)}>
                  <Phone className="h-4 w-4" /> Call Student
                </Button>
              )}
              <Button variant="ghost" onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon, action }) {
  return (
    <div className="surface-card rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-slate-100 font-medium">{value || '-'}</span>
        {action}
      </div>
    </div>
  );
}
