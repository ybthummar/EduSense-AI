import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, searchable = true, pageSize = 8 }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = data.filter(row => {
    if (!search) return true;
    return columns.some(col => {
      const val = row[col.accessor];
      return val != null && String(val).toLowerCase().includes(search.toLowerCase());
    });
  });

  const sorted = sortCol != null
    ? [...filtered].sort((a, b) => {
        const col = columns[sortCol];
        const av = a[col.accessor], bv = b[col.accessor];
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (i) => {
    if (columns[i].render && !columns[i].accessor) return;
    if (sortCol === i) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(i);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-colors"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: col.width }}
                  onClick={() => handleSort(i)}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-900/50 ${col.accessor ? 'cursor-pointer select-none hover:text-zinc-300 transition-colors' : ''}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {sortCol === i && (
                      <span className="text-indigo-400 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-zinc-600" />
                    <p>{search ? 'No matching results' : 'No data available'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-zinc-300">
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
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={safePage === 0} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs text-zinc-400 font-medium">{safePage + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
