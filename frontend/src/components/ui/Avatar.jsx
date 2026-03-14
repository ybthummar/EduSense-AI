const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-medium ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}
