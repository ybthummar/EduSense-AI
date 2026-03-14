export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-800/60">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-slate-200">{title}</h3>
      {description && <p className="max-w-sm text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
