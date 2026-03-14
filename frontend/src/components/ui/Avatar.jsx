const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  if (src) {
    return <img src={src} alt={name} className={`rounded-full border border-slate-600/80 object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/12 font-semibold text-cyan-200 ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}
