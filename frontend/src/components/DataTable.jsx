import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const PAGE_SIZE = 6

export default function DataTable({ columns, data, onRowClick, searchable = true, pageSize = PAGE_SIZE }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = data.filter(row => {
    if (!search) return true
    return columns.some(col => {
      const val = row[col.accessor]
      return val != null && String(val).toLowerCase().includes(search.toLowerCase())
    })
  })

  const sorted = sortCol != null
    ? [...filtered].sort((a, b) => {
        const col = columns[sortCol]
        const av = a[col.accessor], bv = b[col.accessor]
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const handleSort = (i) => {
    if (columns[i].render && !columns[i].accessor) return
    if (sortCol === i) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(i)
      setSortDir('asc')
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-surface-800/30">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search..."
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: col.width }}
                  onClick={() => handleSort(i)}
                  className={col.accessor ? 'cursor-pointer select-none hover:text-surface-200 transition-colors' : ''}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {sortCol === i && (
                      <span className="text-primary-400 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-surface-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-surface-600" />
                    <p>{search ? 'No matching results' : 'No data available'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`${onRowClick ? 'cursor-pointer' : ''} animate-fade-in`}
                  style={{ animationDelay: `${rowIndex * 0.03}s` }}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
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
        <div className="p-4 border-t border-surface-800/30 flex items-center justify-between">
          <p className="text-xs text-surface-500">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={safePage === 0} className="p-1.5 rounded-lg hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="p-1.5 rounded-lg hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs text-surface-300 font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
