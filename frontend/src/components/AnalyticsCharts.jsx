import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { revenueData, engagementData, courseDistribution } from '../data/mockData';

function ChartCard({ title, subtitle, children, actions }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function PeriodTabs({ active, setActive }) {
  const tabs = ['7D', '30D', '90D', '1Y'];
  return (
    <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
            active === t
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 shadow-2xl shadow-black/40 min-w-[160px]">
      <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-slate-300 capitalize">{p.dataKey}</span>
          </div>
          <span className="text-xs font-semibold text-white">
            {typeof p.value === 'number' && p.dataKey === 'revenue'
              ? `$${p.value.toLocaleString()}`
              : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsCharts() {
  const [revenuePeriod, setRevenuePeriod] = useState('1Y');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Revenue Chart — spans 2 cols */}
      <div className="xl:col-span-2">
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue and student enrollment trends"
          actions={<PeriodTabs active={revenuePeriod} setActive={setRevenuePeriod} />}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b6cff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b6cff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="studentsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2033"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#565a78', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#565a78', fontSize: 12 }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b6cff"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#studentsGrad)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 rounded-full bg-brand-500" />
              <span className="text-xs text-slate-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 rounded-full bg-violet-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8b5cf6 0, #8b5cf6 4px, transparent 4px, transparent 8px)' }} />
              <span className="text-xs text-slate-400">Students</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Course Distribution */}
      <ChartCard
        title="Course Distribution"
        subtitle="Enrollment by department"
      >
        <div className="h-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {courseDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="space-y-2.5 mt-4">
          {courseDistribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-slate-200">{item.value}%</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Engagement Bar Chart */}
      <div className="xl:col-span-3">
        <ChartCard
          title="Weekly Engagement"
          subtitle="Active users, completions, and total sessions"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2033" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#565a78', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#565a78', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sessions" fill="#252840" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="active" fill="#3b6cff" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-750" />
              <span className="text-xs text-slate-400">Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-brand-500" />
              <span className="text-xs text-slate-400">Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-xs text-slate-400">Completed</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
