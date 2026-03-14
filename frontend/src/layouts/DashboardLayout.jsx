import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, MessageSquare, BarChart3,
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown, Building2,
  Bot, BookOpen, ShieldCheck, UserCog, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react'

const navItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Faculty', path: '/admin', section: 'faculty' },
    { icon: GraduationCap, label: 'Students', path: '/admin', section: 'students' },
    { icon: Building2, label: 'Departments', path: '/admin', section: 'departments' },
    { icon: BarChart3, label: 'Analytics', path: '/admin', section: 'analytics' },
    { icon: ShieldCheck, label: 'Risk Predictions', path: '/admin', section: 'risk' },
  ],
  faculty: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/faculty' },
    { icon: GraduationCap, label: 'My Students', path: '/faculty', section: 'students' },
    { icon: BarChart3, label: 'Performance', path: '/faculty', section: 'performance' },
    { icon: BookOpen, label: 'Attendance', path: '/faculty', section: 'attendance' },
    { icon: ShieldCheck, label: 'Risk Alerts', path: '/faculty', section: 'risk' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
    { icon: BarChart3, label: 'Performance', path: '/student', section: 'performance' },
    { icon: Bot, label: 'AI Assistant', path: '/chat' },
    { icon: BookOpen, label: 'Resources', path: '/student', section: 'resources' },
  ],
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const items = navItems[user?.role] || []

  const handleNav = (item) => {
    navigate(item.path)
    setMobileOpen(false)
  }

  const getInitial = () => {
    return user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  }

  const roleLabel = {
    admin: 'Administrator',
    faculty: 'Faculty Member',
    student: 'Student',
  }

  return (
    <div className="min-h-screen bg-surface-950 bg-grid-pattern flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in" style={{ animationDuration: '0.2s' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-surface-900/70 backdrop-blur-2xl border-r border-surface-800/40
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center ${sidebarOpen ? 'px-5' : 'px-0 justify-center'} border-b border-surface-800/40 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900 status-dot-pulse" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in overflow-hidden">
                <h1 className="text-sm font-bold text-white tracking-tight whitespace-nowrap">EduSense AI</h1>
                <p className="text-[10px] text-surface-500 font-medium tracking-wider uppercase whitespace-nowrap">Academic Intelligence</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav section */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-surface-500 uppercase tracking-widest">
              Navigation
            </p>
          )}
          {items.map((item, i) => {
            const isActive = location.pathname === item.path && !item.section
            return (
              <button
                key={i}
                onClick={() => handleNav(item)}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-primary-500/12 text-primary-400 shadow-sm shadow-primary-500/5'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                  }
                  ${!sidebarOpen ? 'justify-center' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-surface-300'} ${isActive ? '' : 'group-hover:scale-105'}`} />
                {sidebarOpen && <span className="animate-fade-in whitespace-nowrap">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* AI promo card */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary-500/8 to-accent-500/8 border border-primary-500/10 card-shine">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-xs font-semibold text-primary-300">AI Insights</span>
              </div>
              <p className="text-[11px] text-surface-400 leading-relaxed">
                Get AI-powered analytics on student performance and predictions.
              </p>
            </div>
          </div>
        )}

        {/* User section */}
        <div className={`p-3 border-t border-surface-800/40 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-800/40 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg shadow-primary-500/15 group-hover:scale-105 transition-transform">
                {getInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">{user?.name || user?.email}</p>
                <p className="text-[10px] text-surface-500 capitalize">{roleLabel[user?.role] || user?.role}</p>
              </div>
              <button onClick={logout} className="text-surface-500 hover:text-danger-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-surface-800/50" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="text-surface-500 hover:text-danger-500 transition-colors cursor-pointer p-2 rounded-xl hover:bg-surface-800/50" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-800 border border-surface-700/60 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 hover:border-primary-500/30 transition-all duration-200 shadow-lg z-50 cursor-pointer hidden lg:flex"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-900/30 backdrop-blur-2xl border-b border-surface-800/40 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen(!mobileOpen)
                else setSidebarOpen(!sidebarOpen)
              }}
              className="text-surface-400 hover:text-surface-200 transition-colors cursor-pointer lg:hidden"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-surface-800/30 rounded-xl px-3.5 py-2.5 border border-surface-700/20 min-w-[300px] group focus-within:border-primary-500/30 focus-within:bg-surface-800/50 transition-all">
              <Search className="w-4 h-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
              <input
                type="text"
                placeholder="Search students, courses, analytics..."
                className="bg-transparent border-none outline-none text-sm text-surface-200 placeholder-surface-500 w-full"
              />
              <kbd className="hidden md:block text-[10px] text-surface-500 bg-surface-700/40 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative text-surface-400 hover:text-surface-200 transition-colors p-2.5 rounded-xl hover:bg-surface-800/30 cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-surface-950 status-dot-pulse" />
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-card p-0 overflow-hidden animate-fade-in-down shadow-2xl shadow-black/30 z-50">
                  <div className="p-4 border-b border-surface-800/40">
                    <h3 className="text-sm font-semibold text-surface-200">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      { text: '3 students flagged as high risk', type: 'warning', time: '5m ago' },
                      { text: 'New faculty account created', type: 'success', time: '1h ago' },
                      { text: 'Weekly report is ready', type: 'info', time: '3h ago' },
                    ].map((n, i) => (
                      <div key={i} className="p-3.5 hover:bg-surface-800/30 transition-colors border-b border-surface-800/20 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-green-400' : 'bg-primary-400'}`} />
                          <div className="flex-1">
                            <p className="text-sm text-surface-200">{n.text}</p>
                            <p className="text-[10px] text-surface-500 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-surface-800/40">
                    <button className="w-full text-center text-xs text-primary-400 hover:text-primary-300 font-medium cursor-pointer transition-colors">View all notifications</button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-8 bg-surface-800/50 mx-1" />
            <div className="flex items-center gap-2.5 cursor-pointer hover:bg-surface-800/30 rounded-xl px-3 py-2 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-primary-500/15 group-hover:scale-105 transition-transform">
                {getInitial()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-surface-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-surface-500 capitalize">{roleLabel[user?.role] || user?.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-surface-500 hidden md:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-mesh">
          {children}
        </main>
      </div>
    </div>
  )
}
