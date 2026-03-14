import { useState } from 'react'
import {
  Users, GraduationCap, Building2, BarChart3, ShieldAlert, TrendingUp,
  UserPlus, BookOpen, AlertTriangle, Activity, Eye, Trash2, Plus, Download
} from 'lucide-react'
import MetricCard from '../components/MetricCard'
import DataTable from '../components/DataTable'
import { AreaChartComponent, BarChartComponent, PieChartComponent, LineChartComponent } from '../components/Charts'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

// Sample Data
const departmentData = [
  { name: 'Computer Science', students: 245, faculty: 12, avgGPA: 8.2 },
  { name: 'Mechanical', students: 198, faculty: 9, avgGPA: 7.8 },
  { name: 'Electrical', students: 176, faculty: 8, avgGPA: 7.5 },
  { name: 'Civil', students: 152, faculty: 7, avgGPA: 7.9 },
  { name: 'Electronics', students: 134, faculty: 6, avgGPA: 7.6 },
]

const enrollmentTrend = [
  { month: 'Jan', students: 680, new: 45 },
  { month: 'Feb', students: 710, new: 30 },
  { month: 'Mar', students: 735, new: 25 },
  { month: 'Apr', students: 760, new: 25 },
  { month: 'May', students: 790, new: 30 },
  { month: 'Jun', students: 825, new: 35 },
  { month: 'Jul', students: 850, new: 25 },
  { month: 'Aug', students: 905, new: 55 },
]

const riskDistribution = [
  { name: 'Low Risk', value: 520 },
  { name: 'Medium Risk', value: 230 },
  { name: 'High Risk', value: 115 },
  { name: 'Critical', value: 40 },
]

const facultyPerformance = [
  { name: 'Dr. Smith', passRate: 92, avgGPA: 8.4, students: 35 },
  { name: 'Prof. Johnson', passRate: 88, avgGPA: 7.9, students: 42 },
  { name: 'Dr. Williams', passRate: 95, avgGPA: 8.7, students: 28 },
  { name: 'Prof. Brown', passRate: 85, avgGPA: 7.6, students: 38 },
  { name: 'Dr. Davis', passRate: 90, avgGPA: 8.1, students: 31 },
]

const platformUsage = [
  { day: 'Mon', logins: 340, queries: 120, chats: 85 },
  { day: 'Tue', logins: 380, queries: 145, chats: 92 },
  { day: 'Wed', logins: 420, queries: 160, chats: 110 },
  { day: 'Thu', logins: 395, queries: 138, chats: 98 },
  { day: 'Fri', logins: 360, queries: 125, chats: 88 },
  { day: 'Sat', logins: 180, queries: 65, chats: 42 },
  { day: 'Sun', logins: 150, queries: 48, chats: 35 },
]

const allStudents = [
  { id: 'STU001', name: 'Alice Johnson', department: 'Computer Science', semester: 6, gpa: 8.5, attendance: 92, risk: 'Low' },
  { id: 'STU002', name: 'Bob Smith', department: 'Mechanical', semester: 4, gpa: 6.8, attendance: 75, risk: 'High' },
  { id: 'STU003', name: 'Carol Davis', department: 'Electrical', semester: 5, gpa: 7.9, attendance: 88, risk: 'Low' },
  { id: 'STU004', name: 'David Wilson', department: 'Civil', semester: 3, gpa: 5.2, attendance: 60, risk: 'Critical' },
  { id: 'STU005', name: 'Emma Brown', department: 'Computer Science', semester: 7, gpa: 9.1, attendance: 96, risk: 'Low' },
  { id: 'STU006', name: 'Frank Miller', department: 'Electronics', semester: 4, gpa: 6.5, attendance: 70, risk: 'Medium' },
  { id: 'STU007', name: 'Grace Lee', department: 'Computer Science', semester: 5, gpa: 7.4, attendance: 82, risk: 'Medium' },
  { id: 'STU008', name: 'Henry Taylor', department: 'Mechanical', semester: 6, gpa: 8.0, attendance: 90, risk: 'Low' },
]

const allFaculty = [
  { id: 'FAC001', name: 'Dr. Sarah Smith', department: 'Computer Science', email: 'sarah@edusense.com', students: 35, status: 'Active' },
  { id: 'FAC002', name: 'Prof. James Johnson', department: 'Mechanical', email: 'james@edusense.com', students: 42, status: 'Active' },
  { id: 'FAC003', name: 'Dr. Emily Williams', department: 'Electrical', email: 'emily@edusense.com', students: 28, status: 'Active' },
  { id: 'FAC004', name: 'Prof. Michael Brown', department: 'Civil', email: 'michael@edusense.com', students: 38, status: 'Active' },
  { id: 'FAC005', name: 'Dr. Lisa Davis', department: 'Electronics', email: 'lisa@edusense.com', students: 31, status: 'Active' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateFaculty, setShowCreateFaculty] = useState(false)
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', department: 'Computer Science', password: '' })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
  ]

  const handleCreateFaculty = () => {
    if (!newFaculty.name || !newFaculty.email) return toast.error('Name and email required')
    const generatedId = `FAC${String(allFaculty.length + 1).padStart(3, '0')}`
    const generatedPwd = `KX${Math.random().toString(36).slice(2, 10)}`
    toast.success(`Faculty created!\nID: ${generatedId}\nPassword: ${generatedPwd}`, { duration: 8000 })
    setShowCreateFaculty(false)
    setNewFaculty({ name: '', email: '', department: 'Computer Science', password: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Admin Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateFaculty(true)} className="btn-primary text-sm cursor-pointer">
            <UserPlus className="w-4 h-4" /> Add Faculty
          </button>
          <button className="btn-secondary text-sm cursor-pointer">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900/50 p-1 rounded-xl border border-surface-800/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary-500/15 text-primary-400'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Students" value="905" change="+12.5%" changeType="up" icon={GraduationCap} color="primary" />
            <MetricCard title="Total Faculty" value="42" change="+3" changeType="up" icon={Users} color="accent" />
            <MetricCard title="Departments" value="5" icon={Building2} color="purple" subtitle="All active" />
            <MetricCard title="At-Risk Students" value="155" change="-8%" changeType="down" icon={AlertTriangle} color="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaChartComponent data={enrollmentTrend} dataKey="students" xKey="month" title="Enrollment Trend" color="#6366f1" />
            <PieChartComponent data={riskDistribution} title="Risk Distribution" />
          </div>

          <LineChartComponent data={platformUsage} dataKeys={['logins', 'queries', 'chats']} xKey="day" title="Platform Usage (Weekly)" colors={['#6366f1', '#14b8a6', '#f59e0b']} />
        </div>
      )}

      {/* Faculty Tab */}
      {activeTab === 'faculty' && (
        <div className="space-y-6 animate-fade-in">
          <DataTable
            columns={[
              { header: 'ID', accessor: 'id' },
              { header: 'Name', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'Department', accessor: 'department', render: (val) => <span className="badge badge-info">{val}</span> },
              { header: 'Email', accessor: 'email' },
              { header: 'Students', accessor: 'students' },
              { header: 'Status', accessor: 'status', render: (val) => <span className={`badge ${val === 'Active' ? 'badge-success' : 'badge-danger'}`}>{val}</span> },
              {
                header: 'Actions',
                accessor: 'id',
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-surface-800/60 text-surface-400 hover:text-primary-400 transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-800/60 text-surface-400 hover:text-danger-500 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            ]}
            data={allFaculty}
          />

          <BarChartComponent
            data={facultyPerformance}
            dataKeys={['passRate', 'avgGPA']}
            xKey="name"
            title="Faculty Performance Comparison"
            colors={['#6366f1', '#14b8a6']}
          />
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          <DataTable
            columns={[
              { header: 'ID', accessor: 'id' },
              { header: 'Name', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'Department', accessor: 'department', render: (val) => <span className="badge badge-info">{val}</span> },
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
            ]}
            data={allStudents}
          />
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentData.map((dept, i) => (
              <div key={i} className="glass-card glass-card-hover p-5 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-primary-500/15">
                    <Building2 className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="badge badge-info">{dept.faculty} faculty</span>
                </div>
                <h3 className="text-lg font-semibold text-surface-100 mb-1">{dept.name}</h3>
                <div className="flex items-center gap-4 text-sm text-surface-400">
                  <span>{dept.students} students</span>
                  <span>Avg GPA: <b className="text-surface-200">{dept.avgGPA}</b></span>
                </div>
                <div className="mt-3 w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${(dept.students / 250) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <BarChartComponent
            data={departmentData}
            dataKeys={['students']}
            xKey="name"
            title="Students per Department"
            colors={['#6366f1']}
          />
        </div>
      )}

      {/* Risk Analysis Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Low Risk" value="520" icon={Activity} color="success" subtitle="57.5% of students" />
            <MetricCard title="Medium Risk" value="230" icon={AlertTriangle} color="warning" subtitle="25.4% of students" />
            <MetricCard title="High Risk" value="115" icon={ShieldAlert} color="danger" subtitle="12.7% of students" />
            <MetricCard title="Critical" value="40" icon={ShieldAlert} color="danger" change="-5" changeType="down" subtitle="4.4% of students" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartComponent data={riskDistribution} title="Overall Risk Distribution" />
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-200 mb-4">Dropout Prediction Factors</h3>
              <div className="space-y-4">
                {[
                  { factor: 'Low Attendance', impact: 85, color: 'bg-red-500' },
                  { factor: 'Poor GPA Trend', impact: 72, color: 'bg-amber-500' },
                  { factor: 'Missing Assignments', impact: 65, color: 'bg-orange-500' },
                  { factor: 'Low Engagement', impact: 58, color: 'bg-yellow-500' },
                  { factor: 'Social Isolation', impact: 42, color: 'bg-blue-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-surface-300">{item.factor}</span>
                      <span className="text-surface-400">{item.impact}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.impact}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Student', accessor: 'name', render: (val) => <span className="font-medium text-surface-100">{val}</span> },
              { header: 'ID', accessor: 'id' },
              { header: 'Department', accessor: 'department' },
              { header: 'GPA', accessor: 'gpa', render: (val) => <span className={`font-semibold ${val >= 7 ? 'text-green-400' : val >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{val}</span> },
              { header: 'Attendance', accessor: 'attendance', render: (val) => `${val}%` },
              { header: 'Risk Level', accessor: 'risk', render: (val) => (
                <span className={`badge ${val === 'Low' ? 'badge-success' : val === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{val}</span>
              )},
            ]}
            data={allStudents.filter(s => s.risk !== 'Low')}
          />
        </div>
      )}

      {/* Create Faculty Modal */}
      <Modal isOpen={showCreateFaculty} onClose={() => setShowCreateFaculty(false)} title="Create Faculty Account" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
            <input value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} className="input-field" placeholder="Dr. John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} className="input-field" placeholder="john@edusense.com" type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Department</label>
            <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} className="input-field">
              <option>Computer Science</option>
              <option>Mechanical</option>
              <option>Electrical</option>
              <option>Civil</option>
              <option>Electronics</option>
            </select>
          </div>
          <div className="p-3 bg-surface-800/40 rounded-lg border border-surface-700/30 mt-2">
            <p className="text-xs text-surface-500">
              <strong className="text-surface-400">Note:</strong> Faculty ID and password will be auto-generated and displayed after creation.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateFaculty(false)} className="btn-secondary text-sm cursor-pointer">Cancel</button>
            <button onClick={handleCreateFaculty} className="btn-primary text-sm cursor-pointer">
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
