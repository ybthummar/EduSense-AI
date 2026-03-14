const variants = {
  default: 'border-slate-600/80 bg-slate-800/60 text-slate-200',
  success: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-300',
  warning: 'border-orange-400/25 bg-orange-500/12 text-orange-300',
  danger: 'border-red-400/25 bg-red-500/12 text-red-300',
  info: 'border-cyan-400/25 bg-cyan-500/12 text-cyan-300',
  purple: 'border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-300',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
