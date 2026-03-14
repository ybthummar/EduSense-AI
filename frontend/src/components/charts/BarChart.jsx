import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card, { CardHeader, CardTitle, CardDescription } from '../ui/Card';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg border border-slate-600/75 px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function BarChartCard({ title, description, data, dataKey, xKey = 'name', color = '#22d3ee', height = 300, className = '' }) {
  return (
    <Card hover className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.66)' }} />
          <Bar dataKey={dataKey} fill={color} radius={[8, 8, 2, 2]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
