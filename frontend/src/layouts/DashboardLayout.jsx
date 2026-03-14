import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, MessageSquare, BarChart3,
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown, Building2,
  Bot, BookOpen, ShieldCheck, UserCog
} from 'lucide-react'

const navItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Faculty', path: '/admin', section: 'faculty' },
    { icon: GraduationCap, label: 'Students', path: '/admin', section: 'students' },
    { icon: Building2, label: 'Departments', path: '/admin', section: 'departments' },
    { icon: BarChart3, label: 'Analytics', path: '/admin', section: 'analytics' },
    { icon: ShieldCheck, label: 'Risk Predictions', path: '/admin', section: 'risk' },
    { icon: Settings, label: 'Settings', path: '/admin', section: 'settings' },
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

  const items = navItems[user?.role] || []

  const handleNav = (item) => {
    navigate(item.path)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-surface-900/80 backdrop-blur-xl border-r border-surface-800/50
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center ${sidebarOpen ? 'px-6' : 'px-4 justify-center'} border-b border-surface-800/50`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold gradient-text">EduSense AI</h1>
                <p className="text-[10px] text-surface-500 -mt-0.5">Academic Intelligence</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {items.map((item, i) => {
            const isActive = location.pathname === item.path && !item.section
            return (
              <button
                key={i}
                onClick={() => handleNav(item)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-primary-500/15 text-primary-400 shadow-sm shadow-primary-500/10'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                  }
                  ${!sidebarOpen ? 'justify-center' : ''}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className={`p-4 border-t border-surface-800/50 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
              </div>
              <button onClick={logout} className="text-surface-500 hover:text-danger-500 transition-colors cursor-pointer" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="text-surface-500 hover:text-danger-500 transition-colors cursor-pointer" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-900/40 backdrop-blur-xl border-b border-surface-800/50 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen(!mobileOpen)
                else setSidebarOpen(!sidebarOpen)
              }}
              className="text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-surface-800/40 rounded-xl px-3 py-2 border border-surface-700/30 min-w-[280px]">
              <Search className="w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm text-surface-200 placeholder-surface-500 w-full"
              />
              <kbd className="hidden md:block text-[10px] text-surface-500 bg-surface-700/50 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative text-surface-400 hover:text-surface-200 transition-colors p-2 rounded-xl hover:bg-surface-800/40 cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
            </button>
            <div className="w-px h-8 bg-surface-800" />
            <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-800/40 rounded-xl px-3 py-2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-surface-200">{user?.name || 'User'}</p>
                <p className="text-[10px] text-surface-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-500 hidden md:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
