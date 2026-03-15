import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  BarChart3,
  BookOpen,
  Trophy,
  Bell,
  Search,
  Menu,
  Command,
  Star,
  Zap,
  Briefcase,
  Bot,
  Phone,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const navByRole = {
  admin: [
    { to: '/admin/students', icon: GraduationCap, label: 'Students', end: true },
    { to: '/admin/faculty', icon: Users, label: 'Faculty' },
  ],
  faculty: [
    { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/faculty/students', icon: GraduationCap, label: 'My Students' },
    { to: '/faculty/performance', icon: BarChart3, label: 'Performance' },
    { to: '/faculty/attendance', icon: BookOpen, label: 'Attendance' },
    { to: '/faculty/quizzes', icon: Trophy, label: 'Schedule Quizzes' },
    { to: '/faculty/resources', icon: BookOpen, label: 'Share Resources' },
    { to: '/faculty/suggestions', icon: MessageSquare, label: 'Suggestion Box' },
    { to: '/faculty/calls', icon: Phone, label: 'Call Messages' },
    { to: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
  ],
  student: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/attendance', icon: BookOpen, label: 'My Attendance' },
    { to: '/student/quizzes', icon: Trophy, label: 'Quizzes' },
    { to: '/student/resources', icon: BookOpen, label: 'Resources' },
    { to: '/student/reviews', icon: Star, label: 'Student Reviews' },
    { to: '/student/suggestions', icon: MessageSquare, label: 'Suggestion Box' },
    { to: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
    { to: '/student/weekly-report', icon: Brain, label: 'Weekly AI Analyst' },
  ],
};

const rolePillStyles = {
  admin: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/25',
  faculty: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/25',
  student: 'bg-orange-500/10 text-orange-300 border-orange-400/25',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const role = user?.role || 'student';
  const items = navByRole[role] || navByRole.student;
  const studentId = user?.student_id || user?.id;

  const loadNotifications = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await notificationsAPI.get(studentId);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count || 0);
    } catch {
      // silently fail
    }
  }, [studentId]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    if (!studentId) return;
    try {
      await notificationsAPI.markAllRead(studentId);
      loadNotifications();
    } catch {
      // silently fail
    }
  };

  const activeItem = useMemo(
    () =>
      items.find((item) => {
        if (item.end) return location.pathname === item.to;
        return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
      }) || items[0],
    [items, location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-700/60 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="animate-glow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-orange-400 text-slate-950 shadow-lg shadow-cyan-500/25">
            <Brain className="h-5 w-5" />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-100">EduSense AI</p>
              <p className="text-xs text-slate-400">Academic Insight Workspace</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <Fragment key={item.to}>
            {item.divider && <div className="my-3 border-t border-slate-700/40" />}
            <NavLink
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  item.highlight
                    ? isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-orange-500/10 border border-cyan-400/40 text-cyan-200 shadow-lg shadow-cyan-900/30'
                      : 'bg-gradient-to-r from-cyan-500/5 to-orange-500/5 border border-cyan-400/15 text-cyan-300 hover:from-cyan-500/12 hover:to-orange-500/8 hover:border-cyan-400/30'
                    : isActive
                      ? 'surface-card border-cyan-400/40 text-slate-100 shadow-lg shadow-cyan-900/30'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100',
                  collapsed && !isMobile ? 'justify-center' : '',
                ].join(' ')
              }
            >
              <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${item.highlight ? 'text-cyan-400' : ''}`} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </NavLink>
          </Fragment>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-700/60 px-3 pb-4 pt-4">
        {(!collapsed || isMobile) && (
          <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-200">{user?.name || 'User'}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={[
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200',
            'hover:bg-red-500/10 hover:text-red-300',
            collapsed && !isMobile ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:p-4">
      <div className="app-shell flex min-h-screen overflow-hidden lg:min-h-[calc(100vh-2rem)] lg:rounded-3xl">
        <aside
          className={[
            'glass-panel relative hidden border-r border-slate-700/60 lg:flex',
            collapsed ? 'w-[86px]' : 'w-[280px]',
          ].join(' ')}
        >
          <SidebarContent />
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="absolute bottom-20 -right-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600/70 bg-slate-900 text-slate-300 shadow-lg transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="glass-panel absolute inset-y-0 left-0 w-[280px] border-r border-slate-700/70">
              <SidebarContent isMobile />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass-panel-soft sticky top-0 z-30 border-b border-slate-700/60 px-4 py-3.5 sm:px-5 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="hidden sm:block">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Workspace</p>
                  <h2 className="mt-0.5 truncate text-base font-semibold text-slate-100">{activeItem?.label || 'Dashboard'}</h2>
                </div>

                <div className="hidden min-w-[220px] flex-1 md:block">
                  <button className="glass-panel-soft flex w-full items-center gap-2 rounded-xl border border-slate-700/70 px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:border-cyan-400/35 hover:text-slate-200">
                    <Search className="h-4 w-4" />
                    <span className="flex-1 truncate">Search students, classes, and insights...</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-600/80 bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                      <Command className="h-3 w-3" /> K
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className={["hidden rounded-full border px-2.5 py-1 text-xs font-medium capitalize md:inline-flex", rolePillStyles[role] || rolePillStyles.student].join(' ')}>
                  {role}
                </span>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative rounded-xl border border-slate-700/70 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700/70 bg-slate-900 shadow-2xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-100">Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications</p>
                        ) : (
                          notifications.slice(0, 15).map((n) => (
                            <div
                              key={n.id}
                              className={`border-b border-slate-800/50 px-4 py-3 transition-colors ${
                                n.is_read ? 'opacity-60' : 'bg-slate-800/30'
                              }`}
                            >
                              <p className="text-sm font-medium text-slate-200">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              {n.created_at && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="glass-panel-soft flex items-center gap-2 rounded-xl border border-slate-700/70 px-2.5 py-1.5">
                  <Avatar name={user?.name || 'User'} size="sm" />
                  <div className="hidden leading-tight md:block">
                    <p className="text-sm font-medium text-slate-100">{user?.name || 'User'}</p>
                    <p className="text-xs capitalize text-slate-400">{role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-5 lg:p-7">
              <div className="animate-rise-in">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}