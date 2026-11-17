import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  valueColor?: 'emerald' | 'slate' | 'amber' | 'blue' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  valueColor = 'slate',
}) => {
  const colorMap = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    slate: 'text-slate-900 dark:text-white',
    amber: 'text-amber-700 dark:text-amber-400',
    blue: 'text-blue-700 dark:text-blue-400',
    rose: 'text-rose-700 dark:text-rose-400',
  };

  return (
    <div className="p-4 rounded-2xl terit-glass-sub transition-colors">
      {icon && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {title}
          </span>
          {icon}
        </div>
      )}
      {!icon && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </span>
      )}
      <div className={`text-2xl font-bold font-mono tabular-nums ${colorMap[valueColor]} mt-1`}>
        {value}
      </div>
      {subtitle && <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
};
