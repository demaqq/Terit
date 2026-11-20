import React, { useState } from 'react';
import { X, Ship, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';
import { fmt } from '../i18n/fmt';

interface LandedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandedCostModal: React.FC<LandedCostModalProps> = ({ isOpen, onClose }) => {
  const { items, updateItem, businessType, t } = useInventory();
  const [selectedId, setSelectedId] = useState<string>('');
  const [freight, setFreight] = useState<number>(0);
  const [customs, setCustoms] = useState<number>(0);
  const [marginPct, setMarginPct] = useState<number>(25);
  const [qty, setQty] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const item = items.find((i) => i.id === selectedId) || null;
  const baseCost = item?.costPrice ?? 0;
  const totalOverhead = (Number(freight) || 0) + (Number(customs) || 0);
  const landedUnitCost = qty > 0 ? Math.round((baseCost * qty + totalOverhead) / qty * 100) / 100 : baseCost;
  const suggestedPrice = Math.round(landedUnitCost * (1 + (Number(marginPct) || 0) / 100) * 100) / 100;

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) { setError(t('landed_select_item')); return; }
    if (!Number.isFinite(freight) || !Number.isFinite(customs) || !Number.isFinite(marginPct) || freight < 0 || customs < 0 || marginPct < 0) {
      setError(t('landed_invalid'));
      return;
    }
    setError(null);
    const ok = await updateItem(item.id, { costPrice: landedUnitCost, unitPrice: suggestedPrice });
    if (ok) {
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="terit-modal rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-slate-100 transition-colors">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Ship className="w-5 h-5 text-indigo-500" />
          {t('landed_title')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('landed_desc')}
        </p>

        <form onSubmit={handleCommit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('landed_item')} *</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">{t('landed_select')}</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{fmt(t('landed_cost_cost_etb'), [i.name, i.sku, i.costPrice])}</option>
              ))}
            </select>
          </div>

          {item && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">{t('landed_base_cost')}:</span><span className="font-mono font-bold">{fmt(t('barcode_etb'), [baseCost])}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t('landed_qty')}:</span><span className="font-mono">{item.quantity}</span></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('landed_freight')}</label>
              <input type="number" min={0} value={freight} onChange={(e) => setFreight(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('landed_customs')}</label>
              <input type="number" min={0} value={customs} onChange={(e) => setCustoms(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('landed_qty_import')}</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('landed_margin')}</label>
            <input type="number" min={0} max={200} value={marginPct} onChange={(e) => setMarginPct(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>

          {item && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-1">
              <div className="flex justify-between"><span>{t('landed_unit_cost')}:</span><span className="font-mono font-bold">{fmt(t('barcode_etb'), [landedUnitCost])}</span></div>
              <div className="flex justify-between"><span>{t('landed_suggested_price')}:</span><span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{fmt(t('barcode_etb'), [suggestedPrice])}</span></div>
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
              <span>{t('landed_committed')}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors">
              {t('cancel_btn')}
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-md shadow-indigo-500/10 transition-colors cursor-pointer flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> {t('landed_commit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
