
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
  GraduationCap,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', badge: null },
  { icon: Users, label: 'Students', id: 'students', badge: '2.6k' },
  { icon: BookOpen, label: 'Courses', id: 'courses', badge: '168' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics', badge: null },
  { icon: Layers, label: 'Content', id: 'content', badge: null },
  { icon: Zap, label: 'AI Insights', id: 'ai-insights', badge: 'New' },
];

const bottomItems = [
  { icon: HelpCircle, label: 'Help Center', id: 'help' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50
        flex flex-col
        bg-slate-900/80 backdrop-blur-xl
        border-r border-slate-800/60
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800/60 shrink-0">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/20">
          <GraduationCap size={20} className="text-white" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
              EduSense AI
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase whitespace-nowrap">
              Intelligence Platform
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Main Menu
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5
                text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'bg-brand-500/12 text-brand-400 shadow-sm shadow-brand-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full" />
              )}
              <Icon
                size={20}
                className={`shrink-0 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`}
              />
              {!collapsed && (
                <>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`
                        ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                        ${
                          item.badge === 'New'
                            ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-800/60 space-y-1">
        {/* AI feature promo */}
        {!collapsed && (
          <div className="mb-3 mx-1 p-3 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 border border-brand-500/15">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300">AI Assistant</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Get AI-powered insights on student performance and course optimization.
            </p>
          </div>
        )}

        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              title={collapsed ? item.label : undefined}
              className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
            >
              <Icon size={20} className="shrink-0 group-hover:text-slate-300 transition-colors" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}

        {/* User Profile */}
        <div className={`flex items-center gap-3 mt-2 p-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-emerald-500/20">
            AD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Admin User</p>
              <p className="text-[10px] text-slate-500 truncate">admin@edusense.ai</p>
            </div>
          )}
          {!collapsed && <LogOut size={16} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0" />}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 shadow-lg cursor-pointer z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
