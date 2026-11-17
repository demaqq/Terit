import React from 'react';
import { X, Smartphone, Cloud, Globe, ShieldCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSyncModal: React.FC<MobileSyncModalProps> = ({ isOpen, onClose }) => {
  const { t } = useInventory();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={t('mobile_sync_close_aria') || 'Close mobile access guide'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold">{t('mobile_sync_title') || 'Mobile access & data sync'}</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
          {t('mobile_sync_subtitle') || 'Terit is a responsive web app. Open it in your phone browser; a separate Android app is not currently available.'}
        </p>

        <div className="space-y-4 text-xs">
          <section className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Globe className="w-4 h-4 text-blue-500" />
              {t('mobile_sync_use_title') || 'Use Terit from a phone'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('mobile_sync_use_desc') || 'Open the Terit website in Safari or Chrome. Use your browser\'s “Add to Home Screen” option for a home-screen shortcut.'}
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Cloud className="w-4 h-4 text-amber-500" />
              {t('mobile_sync_data_title') || 'Data across devices'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('mobile_sync_data_desc') || 'Guest data stays in this browser\'s local storage. Sign in to sync inventory and ledger records across your connected devices.'}
            </p>
          </section>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {t('mobile_sync_note') || 'No phone-auth flow, native Android sync service, or payment webhook is provided by this guide.'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            {t('close_btn') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
