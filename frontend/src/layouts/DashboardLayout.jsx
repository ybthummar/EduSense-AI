import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, Building2, MessageSquare,
  LogOut, ChevronLeft, ChevronRight, Brain, BarChart3,
  BookOpen, Trophy, Bell, Search, Menu,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const navByRole = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/faculty', icon: Users, label: 'Faculty' },
    { to: '/admin/students', icon: GraduationCap, label: 'Students' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
  ],
  faculty: [
    { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/faculty/students', icon: GraduationCap, label: 'My Students' },
    { to: '/faculty/performance', icon: BarChart3, label: 'Performance' },
    { to: '/faculty/attendance', icon: BookOpen, label: 'Attendance' },
    { to: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
  ],
  student: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/performance', icon: BarChart3, label: 'Performance' },
    { to: '/student/quizzes', icon: Trophy, label: 'Quizzes' },
    { to: '/student/resources', icon: BookOpen, label: 'Resources' },
    { to: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'student';
  const items = navByRole[role] || navByRole.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">EduSense AI</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#09090b]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col relative border-r border-zinc-800 bg-[#09090b] transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-[#09090b] border-r border-zinc-800 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 text-sm cursor-pointer hover:border-zinc-700 transition-colors">
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-500 ml-4">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-zinc-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[11px] text-zinc-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
