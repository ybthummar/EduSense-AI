import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-orange-300',
  secondary: 'surface-card border-slate-600/70 text-slate-100 hover:border-cyan-300/35 hover:text-cyan-200',
  ghost: 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
  danger: 'border border-red-400/25 bg-red-500/12 text-red-300 hover:bg-red-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
