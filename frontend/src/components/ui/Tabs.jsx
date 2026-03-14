import { useState } from 'react';

export default function Tabs({ tabs, defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  const handleClick = (key) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className="glass-panel-soft flex items-center gap-1 rounded-xl border border-slate-600/70 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${active === tab.key ? 'border border-cyan-400/30 bg-cyan-500/12 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
