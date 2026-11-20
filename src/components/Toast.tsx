import React, { createContext, useContext, useCallback, useState, useMemo, ReactNode, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { translateStatic } from '../i18n/translations';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TYPE_CONFIG: Record<ToastType, { bg: string; text: string; border: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  },
  info: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Info className="w-4 h-4 text-amber-500 shrink-0" />,
  },
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = String(++toastId);
      const item: ToastItem = { id, message, type, duration };
      setToasts((prev) => [...prev, item]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toast, remove, toasts }),
    [toast, remove, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const Toast: React.FC = () => {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const cfg = TYPE_CONFIG[t.type];
        return (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border shadow-lg border-l-4 ${cfg.bg} ${cfg.border} ${cfg.text} text-xs animate-in fade-in slide-in-from-right-2 duration-200`}
          >
            <div className="mt-0.5 shrink-0">{cfg.icon}</div>
            <div className="leading-relaxed whitespace-pre-line break-words min-w-[220px] max-w-[380px]">
              {t.message}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(t.id);
              }}
              className="ml-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label={translateStatic('toast_dismiss')}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
