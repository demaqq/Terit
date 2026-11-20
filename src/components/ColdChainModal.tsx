import React, { useState } from 'react';
import { X, Thermometer, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { backdrop } from '../lib/dismiss';

interface ColdChainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColdChainModal: React.FC<ColdChainModalProps> = ({ isOpen, onClose }) => {
  const { companyProfile, setCompanyProfile, businessType, t } = useInventory();
  const [temp, setTemp] = useState<string>(
    companyProfile?.coldChainTempC != null ? String(companyProfile.coldChainTempC) : ''
  );
  const [note, setNote] = useState<string>(companyProfile?.coldChainInspectorNote || '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(temp);
    if (!Number.isFinite(value)) {
      setError(t('coldchain_invalid'));
      return;
    }
    if (value < 2 || value > 8) {
      setError(t('coldchain_range'));
      return;
    }
    setError(null);
    setCompanyProfile({
      coldChainTempC: value,
      coldChainLastInspection: new Date().toISOString(),
      coldChainInspectorNote: note.trim() || undefined,
    } as Partial<typeof companyProfile>);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const last = companyProfile?.coldChainLastInspection
    ? new Date(companyProfile.coldChainLastInspection)
    : null;

  return (
    <div {...backdrop(onClose)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="terit-modal rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-sky-500" />
          {t('coldchain_title')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('coldchain_desc')}
        </p>

        {last && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="text-slate-500 dark:text-slate-400">{t('coldchain_last')}:</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white">
              {companyProfile?.coldChainTempC}°C · {last.toLocaleString()}
            </div>
            {companyProfile?.coldChainInspectorNote && (
              <div className="text-slate-600 dark:text-slate-300 mt-1">{companyProfile.coldChainInspectorNote}</div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('coldchain_temp')} *
            </label>
            <input
              type="number"
              step="0.1"
              min={2}
              max={8}
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="2.0 – 8.0"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('coldchain_note')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder={t('coldchain_note_ph')}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('coldchain_saved')}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-md shadow-sky-500/10 transition-colors cursor-pointer"
            >
              {t('coldchain_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
