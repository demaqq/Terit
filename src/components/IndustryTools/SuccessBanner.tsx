import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessBannerProps {
  message: string | null;
  icon?: React.ReactNode;
  className?: string;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
  message,
  icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  className,
}) => {
  if (!message) return null;

  return (
    <div
      className={`p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 ${className || ''}`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
};
