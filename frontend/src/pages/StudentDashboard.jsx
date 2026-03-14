import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, TrendingUp, BookOpen, Bot, GraduationCap,
  Target, Award, Calendar, Play, ExternalLink, Sparkles, Clock
} from 'lucide-react'
import MetricCard from '../components/MetricCard'
import { AreaChartComponent, BarChartComponent, LineChartComponent } from '../components/Charts'
import { useAuth } from '../context/AuthContext'

const sgpaTrend = [
  { semester: 'Sem 1', sgpa: 7.2 },
  { semester: 'Sem 2', sgpa: 7.5 },
  { semester: 'Sem 3', sgpa: 7.8 },
  { semester: 'Sem 4', sgpa: 8.1 },
  { semester: 'Sem 5', sgpa: 7.9 },
  { semester: 'Sem 6', sgpa: 8.4 },
]

const subjectMarks = [
  { subject: 'DSA', marks: 85, total: 100 },
  { subject: 'DBMS', marks: 78, total: 100 },
  { subject: 'OS', marks: 90, total: 100 },
  { subject: 'CN', marks: 82, total: 100 },
  { subject: 'SE', marks: 88, total: 100 },
]

const attendanceData = [
  { month: 'Jan', attendance: 90 },
  { month: 'Feb', attendance: 88 },
  { month: 'Mar', attendance: 92 },
  { month: 'Apr', attendance: 85 },
  { month: 'May', attendance: 91 },
  { month: 'Jun', attendance: 87 },
]

const aiRecommendations = [
  {
    title: 'Strengthen Computer Networks',
    description: 'Your CN score is below 85%. Focus on network protocols and OSI model.',
    priority: 'high',
    icon: Target,
  },
  {
    title: 'Practice DBMS normalization',
    description: 'Review 3NF and BCNF concepts. Your quiz accuracy was 72%.',
    priority: 'medium',
    icon: BookOpen,
  },
  {
    title: 'Keep up with OS!',
    description: 'You\'re excelling in Operating Systems. Try advanced scheduling problems.',
    priority: 'success',
    icon: Award,
  },
  {
    title: 'Improve attendance consistency',
    description: 'Attendance dipped in April. Maintain above 85% for best results.',
    priority: 'medium',
    icon: Calendar,
  },
]

const recommendedVideos = [
  {
    title: 'Data Structures and Algorithms - Full Course',
    channel: 'freeCodeCamp',
    thumbnail: '🎥',
    duration: '5:22:12',
    url: 'https://youtube.com/watch?v=example1',
  },
  {
    title: 'DBMS Complete Tutorial - Normalization Explained',
    channel: 'Gate Smashers',
    thumbnail: '📚',
    duration: '45:30',
    url: 'https://youtube.com/watch?v=example2',
  },
  {
    title: 'Operating System Concepts - Process Scheduling',
    channel: 'Neso Academy',
    thumbnail: '🖥️',
    duration: '38:15',
    url: 'https://youtube.com/watch?v=example3',
  },
  {
    title: 'Computer Networks - TCP/IP Protocol Suite',
    channel: 'Knowledge Gate',
    thumbnail: '🌐',
    duration: '52:40',
    url: 'https://youtube.com/watch?v=example4',
  },
  {
    title: 'Software Engineering - Agile Development',
    channel: 'CS Dojo',
    thumbnail: '⚙️',
    duration: '28:50',
    url: 'https://youtube.com/watch?v=example5',
  },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ]

  const currentCGPA = sgpaTrend[sgpaTrend.length - 1].sgpa
  const avgAttendance = Math.round(attendanceData.reduce((a, b) => a + b.attendance, 0) / attendanceData.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">
            Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Semester 6 · Computer Science
          </p>
        </div>
        <button onClick={() => navigate('/chat')} className="btn-primary text-sm cursor-pointer">
          <Bot className="w-4 h-4" /> AI Study Assistant
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
            <MetricCard title="Current SGPA" value={currentCGPA} change="+0.5" changeType="up" icon={GraduationCap} color="primary" />
            <MetricCard title="Avg Attendance" value={`${avgAttendance}%`} change="+2%" changeType="up" icon={Clock} color="accent" />
            <MetricCard title="Subjects" value="5" icon={BookOpen} color="purple" subtitle="Semester 6" />
            <MetricCard title="Risk Level" value="Low" icon={Target} color="success" subtitle="Keep it up!" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaChartComponent data={sgpaTrend} dataKey="sgpa" xKey="semester" title="SGPA Trend" color="#6366f1" />
            <BarChartComponent data={subjectMarks} dataKeys={['marks']} xKey="subject" title="Subject Marks" colors={['#8b5cf6']} />
          </div>

          {/* AI Recommendations */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h3 className="text-sm font-semibold text-surface-200">AI Study Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:border-primary-500/30 ${
                  rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20' :
                  rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-green-500/5 border-green-500/20'
                }`}>
                  <div className={`p-2 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                    rec.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-green-500/15 text-green-400'
                  }`}>
                    <rec.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-surface-100">{rec.title}</h4>
                    <p className="text-xs text-surface-400 mt-1">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Videos */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-surface-200">Recommended YouTube Videos</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {recommendedVideos.map((video, i) => (
                <a
                  key={i}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 bg-surface-800/30 rounded-xl border border-surface-700/30 hover:border-primary-500/30 hover:bg-surface-800/50 transition-all duration-200"
                >
                  <div className="text-3xl mb-3">{video.thumbnail}</div>
                  <h4 className="text-sm font-medium text-surface-200 group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">{video.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">{video.channel}</span>
                    <span className="text-xs text-surface-500">{video.duration}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fade-in">
          <LineChartComponent data={sgpaTrend} dataKeys={['sgpa']} xKey="semester" title="SGPA Progress Over Semesters" colors={['#6366f1']} />

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Detailed Subject Performance</h3>
            <div className="space-y-4">
              {subjectMarks.map((subject, i) => {
                const percentage = (subject.marks / subject.total) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-surface-200">{subject.subject}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${percentage >= 85 ? 'text-green-400' : percentage >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                          {subject.marks}/{subject.total}
                        </span>
                        <span className={`badge text-[10px] ${percentage >= 85 ? 'badge-success' : percentage >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                          {percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${percentage >= 85 ? 'bg-gradient-to-r from-green-500 to-green-400' : percentage >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <AreaChartComponent data={attendanceData} dataKey="attendance" xKey="month" title="Monthly Attendance" color="#14b8a6" />
        </div>
      )}

      {/* Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-primary-400" />
              <h3 className="text-sm font-semibold text-surface-200">AI Learning Assistant</h3>
            </div>
            <p className="text-surface-400 text-sm mb-4">
              Ask any academic question and get instant, detailed explanations with video recommendations.
            </p>
            <button onClick={() => navigate('/chat')} className="btn-primary text-sm cursor-pointer">
              <Bot className="w-4 h-4" /> Open AI Assistant
            </button>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold text-surface-200">Curated Video Playlists</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Data Structures & Algorithms Complete Course', videos: 42, hours: 18 },
                { title: 'Database Management Systems', videos: 28, hours: 12 },
                { title: 'Operating Systems Fundamentals', videos: 35, hours: 15 },
                { title: 'Computer Networks Deep Dive', videos: 30, hours: 14 },
              ].map((playlist, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-surface-800/30 rounded-xl border border-surface-700/30 hover:border-primary-500/30 transition-all cursor-pointer">
                  <div className="p-2.5 bg-red-500/15 rounded-xl">
                    <Play className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-surface-200">{playlist.title}</h4>
                    <p className="text-xs text-surface-500">{playlist.videos} videos · {playlist.hours}h</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-accent-400" />
              <h3 className="text-sm font-semibold text-surface-200">Study Materials</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['DSA Notes.pdf', 'DBMS Cheat Sheet.pdf', 'OS Concepts.pdf', 'CN Protocols Guide.pdf', 'SE Design Patterns.pdf', 'Previous Year Papers.zip'].map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-800/30 rounded-lg border border-surface-700/20 hover:border-surface-600/40 transition-all cursor-pointer">
                  <div className="p-1.5 bg-primary-500/15 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-sm text-surface-300">{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
