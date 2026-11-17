import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  Send,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertPreview {
  info?: string;
  deliveryStatus?: string;
  subject?: string;
  previewSummary?: string;
  body?: string;
  characterCount?: number;
  parts?: number;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose }) => {
  const { items, companyProfile, t } = useInventory();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [alertLowStock, setAlertLowStock] = useState(true);
  const [alertOutOfStock, setAlertOutOfStock] = useState(true);
  const [emailResult, setEmailResult] = useState<AlertPreview | null>(null);
  const [smsResult, setSmsResult] = useState<AlertPreview | null>(null);

  if (!isOpen) return null;

  const previewItems = items.filter((item) =>
    (alertLowStock && item.quantity > 0 && item.quantity <= item.minStockAlert) ||
    (alertOutOfStock && item.quantity === 0)
  );
  const lowStockItems = items.filter((i) => i.quantity > 0 && i.quantity <= i.minStockAlert);
  const outOfStockItems = items.filter((i) => i.quantity <= 0);

  const handlePreviewEmail = () => {
    const selectedItems = previewItems.slice(0, 3);
    const businessName = companyProfile.companyName || t('alerts_your_business') || 'Your business';
    setEmailResult({
      info: t('alerts_preview_info') || 'Preview generated locally. No email/SMS was sent.',
      deliveryStatus: 'not_sent',
      subject: `[${t('alerts_email_subject_prefix') || 'TERIT ALERT'}] ${selectedItems.length} ${t('alerts_inventory_items') || 'inventory item(s)'} · ${businessName}`,
      previewSummary: selectedItems.length
        ? selectedItems.map((item) => `${item.name} (${item.sku}): ${item.quantity} ${t('alerts_on_hand') || 'on hand'} (${t('alerts_min') || 'min'}: ${item.minStockAlert})`).join(', ')
        : (t('alerts_no_matching_items') || 'No matching inventory items.'),
    });
  };

  const handlePreviewSms = () => {
    const selectedItems = previewItems.slice(0, 2);
    const firstItem = selectedItems[0];
    const remainingCount = Math.max(0, selectedItems.length - 1);
    const businessName = companyProfile.companyName || t('alerts_your_business') || 'Your business';
    const body = firstItem
      ? `[${businessName} ${t('alerts_sms_subject') || 'Stock Alert'}] ${firstItem.name} ${t('alerts_is_at') || 'is at'} ${firstItem.quantity} ${t('alerts_units') || 'units'} (${t('alerts_minimum') || 'minimum'}: ${firstItem.minStockAlert}).${remainingCount > 0 ? ` +${remainingCount} ${t('alerts_more_items') || 'more item(s)'}` : ''}`
      : `[${businessName} ${t('alerts_sms_subject') || 'Stock Alert'}] ${t('alerts_no_matching_items') || 'No matching inventory items.'}`;

    setSmsResult({
      info: t('alerts_preview_info') || 'Preview generated locally. No SMS was sent.',
      deliveryStatus: 'not_sent',
      body,
      characterCount: body.length,
      parts: Math.ceil(body.length / 160),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          aria-label={t('alerts_close_aria') || 'Close alert delivery setup'}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold">{t('alerts_title')}</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('alerts_subtitle')}
        </p>

        <div className="space-y-5 text-xs">
          {/* Preview status */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <strong className="text-amber-800 dark:text-amber-300">{t('alerts_preview_only') || 'Preview only · delivery unavailable'}</strong>
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  {lowStockItems.length} {t('alerts_low_stock_count')} · {outOfStockItems.length} {t('alerts_out_of_stock_count')}
                </div>
              </div>
            </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                {t('alerts_not_sent') || 'NOT SENT'}
              </span>
          </div>

          {/* Alert Channels Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Channel 1: Email Alerts */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span>{t('alerts_email_preview') || 'Email preview'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <button
                type="button"
                onClick={handlePreviewEmail}
                disabled={!emailEnabled}
                className="w-full py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                  <span>{t('alerts_generate_email')}</span>
              </button>

              {/* Email dispatch result feedback */}
              {emailResult && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] space-y-1">
                  <div className="font-bold text-blue-700 dark:text-blue-300">
                    <span>{t('alerts_preview_info')}</span>
                  </div>
                  {emailResult.subject && <div className="font-semibold">{emailResult.subject}</div>}
                  {emailResult.previewSummary && <div className="text-slate-600 dark:text-slate-400">{emailResult.previewSummary}</div>}
                  {emailResult.deliveryStatus && <div className="font-mono text-[10px] text-slate-500">{t('alerts_status')}: {emailResult.deliveryStatus}</div>}
                </div>
              )}
            </div>

            {/* Channel 2: SMS Text Alerts */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>{t('alerts_sms_preview')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <button
                type="button"
                onClick={handlePreviewSms}
                disabled={!smsEnabled}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('alerts_generate_sms')}</span>
              </button>

              {/* SMS dispatch result feedback */}
              {smsResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                    <span>{t('alerts_preview_info')}</span>
                  </div>
                  {smsResult.body && <div className="text-slate-600 dark:text-slate-400">{smsResult.body}</div>}
                  {smsResult.characterCount !== undefined && <div className="font-mono text-[10px] text-slate-500">{smsResult.characterCount} {t('alerts_characters')} · {smsResult.parts} {t('alerts_sms_parts')}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Trigger Conditions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('alerts_filters_title')}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertLowStock}
                  onChange={(e) => setAlertLowStock(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-800 dark:text-slate-200">
                  {t('alerts_filter_low_stock')} (&le; {t('alerts_min_stock_short') || 'Min Stock'})
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOutOfStock}
                  onChange={(e) => setAlertOutOfStock(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-800 dark:text-slate-200">
                  {t('alerts_filter_out_of_stock')} ({t('alerts_zero_units') || '0 Units Remaining'})
                </span>
              </label>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors cursor-pointer"
            >
              {t('alerts_close_btn')}
            </button>
        </div>
      </div>
    </div>
  );
};
