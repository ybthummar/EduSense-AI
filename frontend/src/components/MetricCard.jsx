import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MetricCard({ title, value, change, changeType = 'neutral', icon: Icon, color = 'primary', subtitle }) {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/10 text-primary-400',
    accent: 'from-accent-500/20 to-accent-600/10 text-accent-400',
    success: 'from-green-500/20 to-green-600/10 text-green-400',
    warning: 'from-amber-500/20 to-amber-600/10 text-amber-400',
    danger: 'from-red-500/20 to-red-600/10 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
  }

  const iconBg = {
    primary: 'bg-primary-500/15 text-primary-400',
    accent: 'bg-accent-500/15 text-accent-400',
    success: 'bg-green-500/15 text-green-400',
    warning: 'bg-amber-500/15 text-amber-400',
    danger: 'bg-red-500/15 text-red-400',
    purple: 'bg-purple-500/15 text-purple-400',
  }

  const changeIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  }

  const changeColor = {
    up: 'text-green-400 bg-green-500/10',
    down: 'text-red-400 bg-red-500/10',
    neutral: 'text-surface-400 bg-surface-700/30',
  }

  return (
    <div className="glass-card glass-card-hover p-5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${changeColor[changeType]}`}>
            {changeIcon[changeType]}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-surface-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-surface-100">{value}</p>
        {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
