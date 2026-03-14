import { useState } from 'react';

export default function Tabs({ tabs, defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  const handleClick = (key) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${active === tab.key ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
