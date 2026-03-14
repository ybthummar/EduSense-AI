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
        <div className={`glass-panel absolute z-50 mt-2 min-w-[200px] rounded-xl border border-slate-600/75 py-1 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'} ${className}`} onClick={() => setOpen(false)}>
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
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${danger ? 'text-red-300 hover:bg-red-500/10' : 'text-slate-300 hover:bg-slate-800/65 hover:text-slate-100'}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
