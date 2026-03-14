import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ title, value, change, changeType = 'neutral', icon: Icon, color = 'primary', subtitle }) {
  const iconBg = {
    primary: 'bg-indigo-500/10 text-indigo-400',
    accent: 'bg-teal-500/10 text-teal-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  const changeColor = {
    up: 'text-emerald-400 bg-emerald-500/10',
    down: 'text-red-400 bg-red-500/10',
    neutral: 'text-zinc-400 bg-zinc-800',
  };

  const changeIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg[color]} transition-transform duration-200 group-hover:scale-105`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${changeColor[changeType]}`}>
            {changeIcon[changeType]}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-zinc-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-zinc-100 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-zinc-600 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}
