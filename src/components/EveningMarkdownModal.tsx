import React, { useState } from 'react';
import { X, Tag, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';

interface EveningMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem?: InventoryItem | null;
}

export const EveningMarkdownModal: React.FC<EveningMarkdownModalProps> = ({ isOpen, onClose, targetItem }) => {
  const { items, updateItem, businessType, t } = useInventory();
  const [selectedId, setSelectedId] = useState<string>(targetItem?.id || '');
  const [pct, setPct] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const item = items.find((i) => i.id === selectedId) || targetItem || null;
  const original = item?.originalUnitPrice ?? item?.unitPrice ?? 0;
  const current = item?.unitPrice ?? 0;
  const hasMarkdown = (item?.discountPct ?? 0) > 0;
  const newPrice = Math.round(original * (1 - pct / 100) * 100) / 100;
  const liquidity = Math.round((original - newPrice) * (item?.quantity ?? 0) * 100) / 100;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) { setError(t('markdown_select_item') || 'Select an item.'); return; }
    if (!Number.isFinite(pct) || pct <= 0 || pct > 90) {
      setError(t('markdown_pct_range') || 'Discount must be between 1 and 90%.');
      return;
    }
    setError(null);
    const base = item.originalUnitPrice ?? item.unitPrice;
    const discounted = Math.round(base * (1 - pct / 100) * 100) / 100;
    const ok = await updateItem(item.id, {
      originalUnitPrice: base,
      discountPct: pct,
      unitPrice: discounted,
    });
    if (ok) {
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 900);
    }
  };

  const handleRevert = async () => {
    if (!item || !hasMarkdown) return;
    const base = item.originalUnitPrice ?? item.unitPrice;
    await updateItem(item.id, {
      unitPrice: base,
      discountPct: 0,
      originalUnitPrice: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="terit-modal rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-slate-100 transition-colors">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-500" />
          {t('markdown_title') || 'Evening Markdown'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('markdown_desc') || 'Apply a reversible discount to a SKU and preview ETB liquidity.'}
        </p>

        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('markdown_item') || 'Item'} *</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">{t('markdown_select') || 'Select an item…'}</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.sku}) — {i.unitPrice} ETB</option>
              ))}
            </select>
          </div>

          {item && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">{t('markdown_current_price') || 'Current price'}:</span><span className="font-mono font-bold">{current} ETB</span></div>
              {hasMarkdown && <div className="flex justify-between"><span className="text-slate-500">{t('markdown_original_price') || 'Original price'}:</span><span className="font-mono">{original} ETB ({item.discountPct}%)</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">{t('markdown_qty') || 'Qty on hand'}:</span><span className="font-mono">{item.quantity}</span></div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('markdown_pct') || 'Discount %'}</label>
            <input
              type="number"
              min={1}
              max={90}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {item && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
              <div className="flex justify-between"><span>{t('markdown_new_price') || 'New price'}:</span><span className="font-mono font-bold">{newPrice} ETB</span></div>
              <div className="flex justify-between"><span>{t('markdown_liquidity') || 'ETB liquidity'}:</span><span className="font-mono font-bold text-amber-700 dark:text-amber-400">{liquidity} ETB</span></div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('markdown_applied') || 'Markdown applied.'}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2">
            {hasMarkdown && (
              <button type="button" onClick={handleRevert} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> {t('markdown_revert') || 'Revert'}
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors">
                {t('cancel_btn') || 'Close'}
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10 transition-colors cursor-pointer">
                {t('markdown_apply') || 'Apply Markdown'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
