export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl ${padding ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-sm font-medium text-zinc-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-xs text-zinc-500 mt-1 ${className}`}>{children}</p>;
}
