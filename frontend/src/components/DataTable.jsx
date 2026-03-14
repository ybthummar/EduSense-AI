import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, searchable = true, pageSize = 8 }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        if (!search) return true;
        return columns.some((col) => {
          const value = row[col.accessor];
          return value != null && String(value).toLowerCase().includes(search.toLowerCase());
        });
      }),
    [columns, data, search]
  );

  const sorted =
    sortCol != null
      ? [...filtered].sort((a, b) => {
          const col = columns[sortCol];
          const av = a[col.accessor];
          const bv = b[col.accessor];
          const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
          return sortDir === 'asc' ? cmp : -cmp;
        })
      : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (index) => {
    if (!columns[index].accessor) return;
    if (sortCol === index) {
      setSortDir((value) => (value === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(index);
      setSortDir('asc');
    }
  };

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      {searchable && (
        <div className="border-b border-slate-700/65 p-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search..."
              className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{ width: col.width }}
                  onClick={() => handleSort(index)}
                  className={[
                    'border-b border-slate-700/65 bg-slate-900/55 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400',
                    col.accessor ? 'cursor-pointer select-none transition-colors hover:text-slate-200' : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {sortCol === index && (
                      <span className="text-[10px] text-cyan-300">{sortDir === 'asc' ? '^' : 'v'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate-500" />
                    <p>{search ? 'No matching results' : 'No data available'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={[
                    'border-b border-slate-800/65 last:border-b-0 transition-colors hover:bg-slate-800/45',
                    onRowClick ? 'cursor-pointer' : '',
                  ].join(' ')}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-slate-200">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-700/65 px-4 py-3">
          <p className="text-xs text-slate-400">
            {safePage * pageSize + 1}-{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/55 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={safePage === 0}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/55 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-xs font-medium text-slate-300">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/55 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/55 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}