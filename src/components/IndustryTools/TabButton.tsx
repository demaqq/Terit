import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  const activeClass =
    'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20';
  const inactiveClass =
    'terit-glass-sub text-slate-800 dark:text-slate-200 hover:bg-white/95 dark:hover:bg-slate-800/80';

  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
        active ? activeClass : inactiveClass
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
