import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../components/Toast';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItemId?: string;
}

const REASON_KEY_MAP: Record<string, string> = {
  'Stock Inbound Receipt': 'reason_stock_inbound',
  'Sales Order Dispatch': 'reason_sales_dispatch',
  'Physical Inventory Audit Reconciliation': 'reason_audit_reconciliation',
  'Damaged / Scrap / Waste': 'reason_damaged_scrap',
  'Customer Return Restock': 'reason_customer_return',
  'Internal Assembly Consumption': 'reason_assembly_consumption',
};

export const QuickAdjustModal: React.FC<QuickAdjustModalProps> = ({
  isOpen,
  onClose,
  targetItemId,
}) => {
  const { items, quickAdjustStock, businessType, t } = useInventory();
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState(targetItemId || items[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('Stock Inbound Receipt');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedItemId(targetItemId || items[0]?.id || '');
    setAdjustType('in');
    setAmount(1);
    setReason('Stock Inbound Receipt');
    setReferenceNumber('');
  }, [isOpen, targetItemId, items]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);
  const currentQty = currentItem?.quantity ?? 0;

  const calculatedNewQty =
    adjustType === 'in'
      ? currentQty + Number(amount)
      : adjustType === 'out'
      ? Math.max(0, currentQty - Number(amount))
      : Number(amount);

  const delta =
    adjustType === 'in'
      ? Number(amount)
      : adjustType === 'out'
      ? -Number(amount)
      : Number(amount) - currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !currentItem) return;

    if (businessType === 'pharmacy' && adjustType === 'out' && currentItem.isQuarantined) {
      toast(t('pharmacy_quarantined_blocked') || 'This batch is quarantined — dispensing blocked.', 'error');
      return;
    }

    const localizedReason = REASON_KEY_MAP[reason] ? t(REASON_KEY_MAP[reason]) : reason;
    await quickAdjustStock(selectedItemId, delta, localizedReason, referenceNumber.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-md w-full p-5 sm:p-7 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          aria-label={t('close_btn')}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1">{t('quick_adjust_title')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('quick_adjust_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Item Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('quick_adjust_item_label')}
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.sku}) — {t('quick_adjust_current_stock')}: {i.quantity} {i.unitOfMeasure}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {currentItem && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{t('quick_adjust_current_stock')}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {currentQty} {currentItem.unitOfMeasure} ({currentItem.location})
              </span>
            </div>
          )}

          {/* Pharmacy FEFO / Quarantine guardrail (tailored business model) */}
          {businessType === 'pharmacy' && currentItem && (currentItem.isQuarantined || currentItem.expiryDate) && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              currentItem.isQuarantined
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                {currentItem.isQuarantined && (
                  <div className="font-bold">{t('pharmacy_quarantined_batch') || 'Quarantined batch — dispensing blocked.'}</div>
                )}
                {currentItem.expiryDate && (
                  <div>
                    {(t('pharmacy_expiry') || 'Expiry')}: {currentItem.expiryDate}
                    {currentItem.batchNumber ? ` · ${(t('pharmacy_batch') || 'Batch')}: ${currentItem.batchNumber}` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direction Segmented Control */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustType('in');
                setReason('Stock Inbound Receipt');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adjustType === 'in'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('direction_stock_in')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdjustType('out');
                setReason('Sales Order Dispatch');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adjustType === 'out'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('direction_stock_out')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdjustType('set');
                setReason('Physical Inventory Audit Reconciliation');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adjustType === 'set'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('direction_audit_count')}</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {adjustType === 'set' ? t('quick_adjust_amount_label_set') : t('quick_adjust_amount_label_adjust')}
            </label>
            <input
              type="number"
              min={adjustType === 'set' ? '0' : '1'}
              required
              value={amount}
              onChange={(e) => setAmount(Math.max(adjustType === 'set' ? 0 : 1, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white text-base focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reason picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('quick_adjust_reason_label')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Stock Inbound Receipt">{t('reason_stock_inbound')}</option>
              <option value="Sales Order Dispatch">{t('reason_sales_dispatch')}</option>
              <option value="Physical Inventory Audit Reconciliation">{t('reason_audit_reconciliation')}</option>
              <option value="Damaged / Scrap / Waste">{t('reason_damaged_scrap')}</option>
              <option value="Customer Return Restock">{t('reason_customer_return')}</option>
              <option value="Internal Assembly Consumption">{t('reason_assembly_consumption')}</option>
            </select>
          </div>

          {/* Reference # */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('quick_adjust_reference_label')}</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={t('quick_adjust_reference_placeholder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Result preview */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{t('quick_adjust_projected')}:</span>
            <div className="font-mono text-right">
              <span className="text-slate-400 line-through mr-2">{currentQty}</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold text-sm">{calculatedNewQty} {t('quick_adjust_units')}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
            >
              {t('quick_adjust_commit_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
