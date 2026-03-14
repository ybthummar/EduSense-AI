import { useState } from 'react'
import {
  GraduationCap, BarChart3, BookOpen, ShieldAlert, UserPlus, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Eye, Edit, Plus
} from 'lucide-react'
import MetricCard from '../components/MetricCard'
import DataTable from '../components/DataTable'
import { BarChartComponent, LineChartComponent, PieChartComponent, AreaChartComponent } from '../components/Charts'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const myStudents = [
  { id: 'STU001', name: 'Alice Johnson', semester: 6, gpa: 8.5, attendance: 92, risk: 'Low', marks: { DSA: 85, DBMS: 78, OS: 90, CN: 82, SE: 88 } },
  { id: 'STU002', name: 'Bob Williams', semester: 6, gpa: 6.8, attendance: 75, risk: 'High', marks: { DSA: 55, DBMS: 62, OS: 70, CN: 58, SE: 65 } },
  { id: 'STU003', name: 'Carol Davis', semester: 6, gpa: 7.9, attendance: 88, risk: 'Low', marks: { DSA: 72, DBMS: 80, OS: 85, CN: 76, SE: 82 } },
  { id: 'STU004', name: 'David Kim', semester: 6, gpa: 5.2, attendance: 60, risk: 'Critical', marks: { DSA: 40, DBMS: 45, OS: 55, CN: 38, SE: 50 } },
  { id: 'STU005', name: 'Emma Brown', semester: 6, gpa: 9.1, attendance: 96, risk: 'Low', marks: { DSA: 95, DBMS: 92, OS: 88, CN: 91, SE: 94 } },
  { id: 'STU006', name: 'Frank Miller', semester: 6, gpa: 6.5, attendance: 70, risk: 'Medium', marks: { DSA: 60, DBMS: 58, OS: 68, CN: 55, SE: 62 } },
  { id: 'STU007', name: 'Grace Lee', semester: 6, gpa: 7.4, attendance: 82, risk: 'Medium', marks: { DSA: 68, DBMS: 72, OS: 78, CN: 70, SE: 75 } },
  { id: 'STU008', name: 'Henry Taylor', semester: 6, gpa: 8.0, attendance: 90, risk: 'Low', marks: { DSA: 82, DBMS: 85, OS: 80, CN: 78, SE: 85 } },
]

const classPerformance = [
  { subject: 'DSA', avg: 69.6, highest: 95, lowest: 40 },
  { subject: 'DBMS', avg: 71.5, highest: 92, lowest: 45 },
  { subject: 'OS', avg: 76.8, highest: 90, lowest: 55 },
  { subject: 'CN', avg: 68.5, highest: 91, lowest: 38 },
  { subject: 'SE', avg: 75.1, highest: 94, lowest: 50 },
]

const attendanceTrend = [
  { week: 'W1', attendance: 88 },
  { week: 'W2', attendance: 85 },
  { week: 'W3', attendance: 90 },
  { week: 'W4', attendance: 82 },
  { week: 'W5', attendance: 87 },
  { week: 'W6', attendance: 84 },
  { week: 'W7', attendance: 89 },
  { week: 'W8', attendance: 86 },
]

const riskData = [
  { name: 'Low Risk', value: 4 },
  { name: 'Medium Risk', value: 2 },
  { name: 'High Risk', value: 1 },
  { name: 'Critical', value: 1 },
]

const gradeDistribution = [
  { grade: 'A+', count: 1 },
  { grade: 'A', count: 2 },
  { grade: 'B+', count: 1 },
  { grade: 'B', count: 1 },
  { grade: 'C+', count: 1 },
  { grade: 'C', count: 1 },
  { grade: 'D', count: 1 },
]

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newStudent, setNewStudent] = useState({ name: '', email: '', semester: '1' })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'students', label: 'My Students', icon: GraduationCap },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'risk', label: 'Risk Alerts', icon: ShieldAlert },
  ]

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email) return toast.error('Name and email are required')
    const studentId = `STU${String(myStudents.length + 1).padStart(3, '0')}`
    toast.success(`Student ${newStudent.name} added with ID: ${studentId}`)
    setShowAddStudent(false)
    setNewStudent({ name: '', email: '', semester: '1' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Faculty Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">
            {user?.department || 'Computer Science'} Department · {myStudents.length} students
          </p>
        </div>
        <button onClick={() => setShowAddStudent(true)} className="btn-primary text-sm cursor-pointer">
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900/50 p-1 rounded-xl border border-surface-800/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-primary-500/15 text-primary-400' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Students" value={myStudents.length} icon={GraduationCap} color="primary" />
            <MetricCard title="Avg Attendance" value="82.9%" change="+2.1%" changeType="up" icon={Clock} color="accent" />
            <MetricCard title="Class Avg GPA" value="7.43" change="+0.3" changeType="up" icon={TrendingUp} color="success" />
            <MetricCard title="At-Risk Students" value="3" icon={AlertTriangle} color="warning" subtitle="Needs attention" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartComponent data={classPerformance} dataKeys={['avg', 'highest', 'lowest']} xKey="subject" title="Subject Performance Analysis" colors={['#6366f1', '#22c55e', '#ef4444']} />
            <PieChartComponent data={riskData} title="Student Risk Distribution" />
          </div>

          <AreaChartComponent data={attendanceTrend} dataKey="attendance" xKey="week" title="Weekly Attendance Trend" color="#14b8a6" />
        </div>
      )}

      {/* Students */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          <DataTable
            columns={[
              { header: 'ID', accessor: 'id' },
              { header: 'Name', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'Semester', accessor: 'semester' },
              { header: 'GPA', accessor: 'gpa', render: (val) => <span className={`font-semibold ${val >= 8 ? 'text-green-400' : val >= 6 ? 'text-amber-400' : 'text-red-400'}`}>{val}</span> },
              { header: 'Attendance', accessor: 'attendance', render: (val) => (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${val >= 85 ? 'bg-green-500' : val >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-xs">{val}%</span>
                </div>
              )},
              { header: 'Risk', accessor: 'risk', render: (val) => (
                <span className={`badge ${val === 'Low' ? 'badge-success' : val === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{val}</span>
              )},
              { header: 'Actions', accessor: 'id', render: (_, row) => (
                <button onClick={() => setSelectedStudent(row)} className="p-1.5 rounded-lg hover:bg-surface-800/60 text-surface-400 hover:text-primary-400 transition-colors cursor-pointer">
                  <Eye className="w-4 h-4" />
                </button>
              )}
            ]}
            data={myStudents}
          />
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fade-in">
          <BarChartComponent data={classPerformance} dataKeys={['avg', 'highest', 'lowest']} xKey="subject" title="Subject-wise Performance" colors={['#6366f1', '#22c55e', '#ef4444']} />
          <BarChartComponent data={gradeDistribution} dataKeys={['count']} xKey="grade" title="Grade Distribution" colors={['#8b5cf6']} />

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Learning Gap Analysis</h3>
            <div className="space-y-3">
              {classPerformance.map((subject, i) => {
                const gap = 100 - subject.avg
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-surface-300 w-16">{subject.subject}</span>
                    <div className="flex-1 h-3 bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500" style={{ width: `${subject.avg}%` }} />
                    </div>
                    <span className="text-xs text-surface-400 w-20 text-right">Gap: {gap.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Above 85%" value={myStudents.filter(s => s.attendance >= 85).length} icon={CheckCircle} color="success" />
            <MetricCard title="70-85%" value={myStudents.filter(s => s.attendance >= 70 && s.attendance < 85).length} icon={Clock} color="warning" />
            <MetricCard title="Below 70%" value={myStudents.filter(s => s.attendance < 70).length} icon={AlertTriangle} color="danger" />
          </div>

          <AreaChartComponent data={attendanceTrend} dataKey="attendance" xKey="week" title="Attendance Trend" color="#14b8a6" />

          <DataTable
            columns={[
              { header: 'Student', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'Attendance', accessor: 'attendance', render: (val) => (
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${val >= 85 ? 'bg-green-500' : val >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-sm font-medium">{val}%</span>
                </div>
              )},
              { header: 'Status', accessor: 'attendance', render: (val) => (
                <span className={`badge ${val >= 85 ? 'badge-success' : val >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                  {val >= 85 ? 'Good' : val >= 70 ? 'Warning' : 'Critical'}
                </span>
              )},
            ]}
            data={myStudents.sort((a, b) => a.attendance - b.attendance)}
          />
        </div>
      )}

      {/* Risk Alerts */}
      {activeTab === 'risk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartComponent data={riskData} title="Risk Distribution" />
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-200 mb-4">Risk Factor Analysis</h3>
              <div className="space-y-4">
                {[
                  { factor: 'Low Attendance (<70%)', count: 2, severity: 'high' },
                  { factor: 'GPA Below 6.0', count: 1, severity: 'critical' },
                  { factor: 'Declining Performance', count: 2, severity: 'medium' },
                  { factor: 'Assignment Submissions', count: 3, severity: 'low' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.severity === 'critical' ? 'bg-red-500' : item.severity === 'high' ? 'bg-orange-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm text-surface-200">{item.factor}</span>
                    </div>
                    <span className="badge badge-info">{item.count} students</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Student', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'GPA', accessor: 'gpa', render: (val) => <span className={`font-semibold ${val < 6 ? 'text-red-400' : 'text-amber-400'}`}>{val}</span> },
              { header: 'Attendance', accessor: 'attendance', render: (val) => `${val}%` },
              { header: 'Risk Level', accessor: 'risk', render: (val) => (
                <span className={`badge ${val === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{val}</span>
              )},
              { header: 'Action', accessor: 'id', render: () => (
                <button className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">Intervene</button>
              )}
            ]}
            data={myStudents.filter(s => s.risk !== 'Low')}
          />
        </div>
      )}

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={`Student: ${selectedStudent?.name || ''}`} maxWidth="max-w-xl">
        {selectedStudent && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-surface-800/40 rounded-xl">
                <p className="text-xs text-surface-500">GPA</p>
                <p className={`text-xl font-bold ${selectedStudent.gpa >= 8 ? 'text-green-400' : selectedStudent.gpa >= 6 ? 'text-amber-400' : 'text-red-400'}`}>{selectedStudent.gpa}</p>
              </div>
              <div className="text-center p-3 bg-surface-800/40 rounded-xl">
                <p className="text-xs text-surface-500">Attendance</p>
                <p className="text-xl font-bold text-surface-100">{selectedStudent.attendance}%</p>
              </div>
              <div className="text-center p-3 bg-surface-800/40 rounded-xl">
                <p className="text-xs text-surface-500">Risk</p>
                <span className={`badge ${selectedStudent.risk === 'Low' ? 'badge-success' : selectedStudent.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{selectedStudent.risk}</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-surface-300 mb-3">Subject-wise Marks</h4>
              <div className="space-y-2">
                {Object.entries(selectedStudent.marks).map(([subject, mark]) => (
                  <div key={subject} className="flex items-center gap-3">
                    <span className="text-sm text-surface-400 w-12">{subject}</span>
                    <div className="flex-1 h-2.5 bg-surface-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${mark >= 80 ? 'bg-green-500' : mark >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${mark}%` }} />
                    </div>
                    <span className="text-sm font-medium text-surface-200 w-8 text-right">{mark}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} title="Add Student" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
            <input value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="input-field" placeholder="Student Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} className="input-field" placeholder="student@university.edu" type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Semester</label>
            <select value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: e.target.value})} className="input-field">
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddStudent(false)} className="btn-secondary text-sm cursor-pointer">Cancel</button>
            <button onClick={handleAddStudent} className="btn-primary text-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
