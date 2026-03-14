import { useState, useRef, useEffect } from 'react';

export default function Dropdown({ trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute z-50 mt-2 min-w-[200px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 ${align === 'right' ? 'right-0' : 'left-0'} ${className}`} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, icon: Icon, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
