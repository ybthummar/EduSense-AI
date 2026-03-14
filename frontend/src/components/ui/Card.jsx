export default function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`surface-card rounded-2xl ${padding ? 'p-6' : ''} ${hover ? 'surface-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-base font-semibold text-slate-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`mt-1 text-xs text-slate-400 ${className}`}>{children}</p>;
}
