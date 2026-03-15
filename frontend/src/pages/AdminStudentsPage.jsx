import { useState, useEffect, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import DataTable from '../components/DataTable';
import Badge from '../components/ui/Badge';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await facultyAPI.getStudentsMaster({ limit: 500 });
        setStudents(res.data || []);
      } catch {
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!students.length) return null;
    const total = students.length;
    const avgGPA = (students.reduce((s, st) => s + (st.gpa || 0), 0) / total).toFixed(2);
    const avgAtt = (students.reduce((s, st) => s + (st.attendance || 0), 0) / total).toFixed(1);
    const atRisk = students.filter((s) => s.risk === 'High' || s.risk === 'Critical').length;
    return { total, avgGPA, avgAtt, atRisk };
  }, [students]);

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      render: (v, row) => (
        <div>
          <p className="font-medium text-slate-100">{v || 'N/A'}</p>
          <p className="text-[11px] text-slate-500">{row.id} • {row.department_code}</p>
        </div>
      ),
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Sem', accessor: 'semester' },
    {
      header: 'GPA',
      accessor: 'gpa',
      render: (v) => <span className="font-mono text-cyan-300">{v ? Number(v).toFixed(2) : '–'}</span>,
    },
    {
      header: 'Attendance',
      accessor: 'attendance',
      render: (v) => (
        <span className={`font-mono ${v >= 75 ? 'text-emerald-300' : 'text-red-300'}`}>
          {v ? `${Number(v).toFixed(1)}%` : '–'}
        </span>
      ),
    },
    {
      header: 'Avg Marks',
      accessor: 'average_marks',
      render: (v) => <span className="font-mono">{v ? Number(v).toFixed(1) : '–'}</span>,
    },
    {
      header: 'Risk',
      accessor: 'risk',
      render: (v) => {
        const map = { Critical: 'danger', High: 'warning', Medium: 'info', Low: 'success' };
        return <Badge variant={map[v] || 'info'}>{v || 'N/A'}</Badge>;
      },
    },
    { header: 'Status', accessor: 'status' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <div className="h-[500px] skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Student Directory</h1>
        <p className="mt-1 text-sm text-slate-400">{stats?.total || 0} students enrolled</p>
      </div>

      {/* Quick stats strip */}
      {stats && (
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-cyan-300' },
            { label: 'Avg GPA', value: stats.avgGPA, color: 'text-emerald-300' },
            { label: 'Avg Attendance', value: `${stats.avgAtt}%`, color: 'text-purple-300' },
            { label: 'At Risk', value: stats.atRisk, color: 'text-red-300' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-600/40 bg-slate-800/30 px-4 py-2">
              <span className="text-xs text-slate-400">{s.label}</span>
              <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <DataTable columns={columns} data={students} pageSize={15} />
    </div>
  );
}
