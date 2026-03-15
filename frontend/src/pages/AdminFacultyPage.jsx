import { useState, useEffect, useMemo } from 'react';
import { Users, Search, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminFacultyPage() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedFaculty, setExpandedFaculty] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await facultyAPI.getSubjectMapping();
        setMappings(res.data || []);
      } catch {
        toast.error('Failed to load faculty data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group mappings by faculty
  const facultyList = useMemo(() => {
    const map = {};
    mappings.forEach((m) => {
      const fid = m.faculty_id;
      if (!map[fid]) {
        map[fid] = {
          faculty_id: fid,
          faculty_name: m.faculty_name,
          department: m.department,
          designation: m.designation,
          experience_years: m.experience_years,
          subjects: [],
        };
      }
      map[fid].subjects.push({
        subject_name: m.subject_name,
        semester: m.semester,
        credits: m.credits,
        avg_marks: m.avg_marks,
        pass_rate: m.pass_rate,
        student_count: m.student_count,
      });
    });
    return Object.values(map);
  }, [mappings]);

  const filtered = useMemo(() => {
    if (!search) return facultyList;
    const q = search.toLowerCase();
    return facultyList.filter(
      (f) =>
        f.faculty_name?.toLowerCase().includes(q) ||
        f.department?.toLowerCase().includes(q) ||
        f.subjects.some((s) => s.subject_name?.toLowerCase().includes(q))
    );
  }, [facultyList, search]);

  const toggle = (fid) => setExpandedFaculty((prev) => (prev === fid ? null : fid));

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Faculty Directory</h1>
          <p className="mt-1 text-sm text-slate-400">{facultyList.length} faculty • {mappings.length} subject assignments</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculty or subject..."
          className="w-full rounded-xl border border-slate-600/70 bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
        />
      </div>

      {/* Faculty list */}
      <div className="space-y-2">
        {filtered.map((f) => {
          const open = expandedFaculty === f.faculty_id;
          return (
            <div key={f.faculty_id} className="surface-card rounded-2xl overflow-hidden">
              <button
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
                onClick={() => toggle(f.faculty_id)}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100">{f.faculty_name}</p>
                  <p className="text-xs text-slate-400">
                    {f.department} • {f.designation} • {f.experience_years} yrs exp • {f.subjects.length} subject{f.subjects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {open ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-500" />
                )}
              </button>

              {open && (
                <div className="border-t border-slate-700/50 px-5 pb-4 pt-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {f.subjects.map((s, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-600/30 bg-slate-800/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                          <p className="text-sm font-medium text-slate-200 truncate">{s.subject_name}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>Sem {s.semester}</span>
                          <span>{s.credits} cr</span>
                          <span>Avg: <strong className="text-slate-200">{s.avg_marks?.toFixed(1)}</strong></span>
                          <span>Pass: <strong className="text-emerald-300">{s.pass_rate?.toFixed(0)}%</strong></span>
                          <span>Students: <strong className="text-slate-200">{s.student_count}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">No faculty found.</p>
        )}
      </div>
    </div>
  );
}
