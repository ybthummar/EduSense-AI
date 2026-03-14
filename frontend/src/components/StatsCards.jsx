import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BookOpen,
  Target,
  ArrowUpRight,
} from 'lucide-react';

const cards = [
  {
    title: 'Total Revenue',
    value: '$84,200',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    description: 'vs last month',
    gradient: 'from-brand-500/15 to-brand-600/5',
    iconBg: 'bg-brand-500/12',
    iconColor: 'text-brand-400',
    borderColor: 'border-brand-500/10',
  },
  {
    title: 'Active Students',
    value: '2,680',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    description: 'vs last month',
    gradient: 'from-emerald-500/15 to-emerald-600/5',
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/10',
  },
  {
    title: 'Active Courses',
    value: '168',
    change: '+23.4%',
    trend: 'up',
    icon: BookOpen,
    description: 'vs last month',
    gradient: 'from-violet-500/15 to-violet-600/5',
    iconBg: 'bg-violet-500/12',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/10',
  },
  {
    title: 'Completion Rate',
    value: '72.4%',
    change: '-2.1%',
    trend: 'down',
    icon: Target,
    description: 'vs last month',
    gradient: 'from-amber-500/15 to-amber-600/5',
    iconBg: 'bg-amber-500/12',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/10',
  },
];

// Tiny sparkline component
function MiniSparkline({ trend }) {
  const points = trend === 'up'
    ? '0,20 5,18 10,15 15,17 20,12 25,14 30,8 35,10 40,5 45,3 50,1'
    : '0,3 5,5 10,2 15,8 20,6 25,10 30,12 35,9 40,15 45,17 50,20';
  const color = trend === 'up' ? '#34d399' : '#fb7185';

  return (
    <svg viewBox="0 0 50 22" className="w-16 h-6">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            id={`stat-card-${idx}`}
            className={`
              group relative overflow-hidden rounded-2xl
              bg-gradient-to-br ${card.gradient}
              border ${card.borderColor}
              p-5 cursor-pointer
              hover:scale-[1.02] hover:shadow-lg
              transition-all duration-300 ease-out
            `}
            style={{ animationDelay: `${idx * 80}ms`, animation: 'fadeInUp 500ms ease-out backwards' }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-2xl group-hover:from-white/[0.06] transition-all" />

            <div className="flex items-start justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg} backdrop-blur-sm`}>
                <Icon size={20} className={card.iconColor} />
              </div>
              <MiniSparkline trend={card.trend} />
            </div>

            <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">{card.title}</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${
                  card.trend === 'up'
                    ? 'bg-emerald-500/12 text-emerald-400'
                    : 'bg-rose-500/12 text-rose-400'
                }`}
              >
                {card.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {card.change}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{card.description}</p>

            {/* Hover link */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={16} className="text-slate-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
