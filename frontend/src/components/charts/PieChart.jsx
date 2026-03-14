import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card, { CardHeader, CardTitle, CardDescription } from '../ui/Card';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-zinc-100">{payload[0].name}</p>
      <p className="text-xs text-zinc-400">{payload[0].value} ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)</p>
    </div>
  );
};

const renderLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
    {payload.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
        {entry.value}
      </div>
    ))}
  </div>
);

export default function PieChartCard({ title, description, data, dataKey = 'value', nameKey = 'name', height = 300, colors = COLORS, className = '' }) {
  const total = data.reduce((sum, d) => sum + d[dataKey], 0);
  const dataWithTotal = data.map(d => ({ ...d, total }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={dataWithTotal} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={2} strokeWidth={0}>
            {dataWithTotal.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
