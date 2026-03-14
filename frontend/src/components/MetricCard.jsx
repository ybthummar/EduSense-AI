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
    primary: 'bg-primary-500/12 text-primary-400 ring-1 ring-primary-500/10',
    accent: 'bg-accent-500/12 text-accent-400 ring-1 ring-accent-500/10',
    success: 'bg-green-500/12 text-green-400 ring-1 ring-green-500/10',
    warning: 'bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/10',
    danger: 'bg-red-500/12 text-red-400 ring-1 ring-red-500/10',
    purple: 'bg-purple-500/12 text-purple-400 ring-1 ring-purple-500/10',
  }

  const borderAccent = {
    primary: 'hover:border-primary-500/20',
    accent: 'hover:border-accent-500/20',
    success: 'hover:border-green-500/20',
    warning: 'hover:border-amber-500/20',
    danger: 'hover:border-red-500/20',
    purple: 'hover:border-purple-500/20',
  }

  const glowColor = {
    primary: 'group-hover:shadow-primary-500/8',
    accent: 'group-hover:shadow-accent-500/8',
    success: 'group-hover:shadow-green-500/8',
    warning: 'group-hover:shadow-amber-500/8',
    danger: 'group-hover:shadow-red-500/8',
    purple: 'group-hover:shadow-purple-500/8',
  }

  const changeIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  }

  const changeColor = {
    up: 'text-green-400 bg-green-500/8 ring-1 ring-green-500/10',
    down: 'text-red-400 bg-red-500/8 ring-1 ring-red-500/10',
    neutral: 'text-surface-400 bg-surface-700/20',
  }

  return (
    <div className={`group glass-card glass-card-hover card-shine p-5 transition-all duration-300 ${glowColor[color]} ${borderAccent[color]} group-hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg[color]} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${changeColor[changeType]} animate-fade-in`}>
            {changeIcon[changeType]}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[13px] text-surface-400 mb-1 font-medium">{title}</p>
        <p className="text-2xl font-bold text-surface-100 tracking-tight animate-count text-glow">{value}</p>
        {subtitle && <p className="text-xs text-surface-500 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  )
}
