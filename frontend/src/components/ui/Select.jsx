import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ label, error, options = [], placeholder, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`glass-panel-soft w-full appearance-none rounded-xl border border-slate-600/70 px-3 py-2.5 text-sm text-slate-100 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35 ${error ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/30' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
