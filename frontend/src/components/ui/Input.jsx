import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <input
        ref={ref}
        className={`glass-panel-soft w-full rounded-xl border border-slate-600/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35 ${error ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/30' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
