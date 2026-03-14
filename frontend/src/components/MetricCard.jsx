import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ title, value, change, changeType = 'neutral', icon: Icon, color = 'primary', subtitle }) {
  const iconBg = {
    primary: 'border-cyan-400/30 bg-cyan-500/12 text-cyan-300',
    accent: 'border-orange-400/30 bg-orange-500/12 text-orange-300',
    success: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300',
    warning: 'border-amber-400/30 bg-amber-500/12 text-amber-300',
    danger: 'border-red-400/30 bg-red-500/12 text-red-300',
    purple: 'border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-300',
  };

  const changeColor = {
    up: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300',
    down: 'border-red-400/30 bg-red-500/12 text-red-300',
    neutral: 'border-slate-600/70 bg-slate-700/45 text-slate-300',
  };

  const changeIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  };

  return (
    <div className="surface-card surface-card-hover group rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-xl border p-2.5 transition-transform duration-200 group-hover:scale-105 ${iconBg[color]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${changeColor[changeType]}`}>
            {changeIcon[changeType]}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
        {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
