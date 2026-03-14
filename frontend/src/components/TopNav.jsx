import { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Command,
  CalendarDays,
  X,
} from 'lucide-react';
import { notifications } from '../data/mockData';

export default function TopNav() {
  const [notifOpen, setNotifOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-slate-950/60 backdrop-blur-xl border-b border-slate-800/40">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">Dashboard</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={12} />
            <span>{today}</span>
          </div>
        </div>
      </div>

      {/* Center — Search */}
      <div className="hidden md:flex items-center max-w-md w-full mx-8">
        <div className="relative w-full group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            id="global-search"
            type="text"
            placeholder="Search students, courses, analytics..."
            className="w-full h-9 pl-9 pr-20 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-800 rounded-md border border-slate-700">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          id="create-new-btn"
          className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-[380px] rounded-2xl bg-slate-900 border border-slate-800/80 shadow-2xl shadow-black/40 z-50 overflow-hidden animate-[fadeInUp_200ms_ease-out]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                      {notifications.length} new
                    </span>
                    <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors border-b border-slate-800/30 last:border-0 cursor-pointer"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'warning'
                            ? 'bg-amber-400'
                            : n.type === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-brand-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 whitespace-nowrap mt-0.5">{n.time}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-800/60">
                  <button className="w-full text-center text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar in top nav */}
        <button
          id="profile-menu-btn"
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20">
            AD
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
