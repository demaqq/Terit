import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { POLineItem } from '../types/inventory';
import { fmt } from '../i18n/fmt';
import { backdrop } from '../lib/dismiss';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplierId?: string;
  preselectedItemId?: string;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplierId,
  preselectedItemId,
}) => {
  const { suppliers, items, createPurchaseOrder, t } = useInventory();

  const [supplierId, setSupplierId] = useState(preselectedSupplierId || suppliers[0]?.id || '');
  const [poNumber, setPoNumber] = useState('PO-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900));
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'ordered'>('ordered');
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSupplierId) {
      setSupplierId(preselectedSupplierId);
    }
  }, [preselectedSupplierId]);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setPoNumber('PO-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900));
      const targetItem = preselectedItemId ? items.find((i) => i.id === preselectedItemId) : items[0];
      if (targetItem) {
        setLineItems([
          {
            itemId: targetItem.id,
            name: targetItem.name,
            sku: targetItem.sku,
            quantity: Math.max(10, targetItem.minStockAlert * 2),
            unitCost: targetItem.costPrice,
            totalCost: Math.max(10, targetItem.minStockAlert * 2) * targetItem.costPrice,
          },
        ]);
      } else {
        setLineItems([]);
      }
    }
  }, [isOpen, preselectedItemId, items]);

  if (!isOpen) return null;

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleItemSelect = (index: number, itemId: string) => {
    const itm = items.find((i) => i.id === itemId);
    if (!itm) return;

    setLineItems((prev) => {
      const updated = [...prev];
      const qty = updated[index]?.quantity || 10;
      updated[index] = {
        itemId: itm.id,
        name: itm.name,
        sku: itm.sku,
        quantity: qty,
        unitCost: itm.costPrice,
        totalCost: qty * itm.costPrice,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setLineItems((prev) => {
      const updated = [...prev];
      const line = updated[index];
      if (line) {
        updated[index] = {
          ...line,
          quantity: safeQty,
          totalCost: safeQty * line.unitCost,
        };
      }
      return updated;
    });
  };

  const handleUnitCostChange = (index: number, cost: number) => {
    const safeCost = Math.max(0, cost);
    setLineItems((prev) => {
      const updated = [...prev];
      const line = updated[index];
      if (line) {
        updated[index] = {
          ...line,
          unitCost: safeCost,
          totalCost: line.quantity * safeCost,
        };
      }
      return updated;
    });
  };

  const addLine = () => {
    const availableItem = items.find((i) => !lineItems.some((l) => l.itemId === i.id)) || items[0];
    if (availableItem) {
      setLineItems((prev) => [
        ...prev,
        {
          itemId: availableItem.id,
          name: availableItem.name,
          sku: availableItem.sku,
          quantity: 20,
          unitCost: availableItem.costPrice,
          totalCost: 20 * availableItem.costPrice,
        },
      ]);
    }
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = lineItems.reduce((sum, line) => sum + line.totalCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!supplierId) {
      setFormError(t('create_po_error_supplier'));
      return;
    }

    if (lineItems.length === 0) {
      setFormError(t('create_po_error_items'));
      return;
    }

    await createPurchaseOrder({
      poNumber,
      supplierId,
      supplierName: selectedSupplier?.name || 'Selected Supplier',
      items: lineItems,
      totalAmount,
      status,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate,
      notes,
    });

    onClose();
  };

  return (
    <div {...backdrop(onClose)} className="fixed inset-0 z-50 flex p-2.5 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-3xl w-full p-4 sm:p-7 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2 pr-8">
          <ShoppingCart className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t('create_po_btn')}</span>
        </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('create_po_subtitle')}
          </p>

        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Top Row: PO Number, Supplier, Expected Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('create_po_ref_label')} *
                </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('vendor_supplier')} *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 text-xs truncate"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({(t('lead_time_days_short')).replace('{days}', String(s.leadTimeDays))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('create_po_expected_label')}
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {t('create_po_line_items_label').replace('{count}', String(lineItems.length))}
                </label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('create_po_add_line_btn')}</span>
              </button>
            </div>

            {/* Mobile Card Layout (< sm screens) */}
            <div className="sm:hidden space-y-2.5">
              {lineItems.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">
                      {t('create_po_line_label').replace('{index}', String(idx + 1))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                      title={t('create_po_remove_line_btn')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        {t('create_po_inventory_sku_label')}
                      </label>
                    <select
                      value={line.itemId}
                      onChange={(e) => handleItemSelect(idx, e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {t('create_po_option_stock')
                            .replace('{name}', i.name)
                            .replace('{sku}', i.sku)
                            .replace('{qty}', String(i.quantity))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        {t('create_po_order_units_label')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        {t('create_po_unit_cost_label')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitCost}
                        onChange={(e) => handleUnitCostChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 text-[11px]">{t('create_po_line_total_label')}</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {fmt(t('barcode_etb'), [line.totalCost.toFixed(2)])}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout (>= sm screens) */}
            <div className="hidden sm:block bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">{t('create_po_inventory_sku_label')}</th>
                      <th className="py-2.5 px-3 text-right font-semibold w-24">{t('create_po_order_units_label')}</th>
                      <th className="py-2.5 px-3 text-right font-semibold w-28">{t('create_po_unit_cost_label')}</th>
                      <th className="py-2.5 px-3 text-right font-semibold w-28">{t('create_po_line_total_header')}</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {lineItems.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleItemSelect(idx, e.target.value)}
                            className="w-full min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                          >
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {t('create_po_option_stock')
                                  .replace('{name}', i.name)
                                  .replace('{sku}', i.sku)
                                  .replace('{qty}', String(i.quantity))}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-right font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => handleUnitCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-right font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {fmt(t('barcode_etb'), [line.totalCost.toFixed(2)])}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title={t('create_po_remove_line_btn')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Total & Status Picker (Responsive row/column) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                {t('create_po_status_label')}
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('ordered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'ordered'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {t('create_po_status_ordered')}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'draft'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {t('create_po_status_draft')}
                </button>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-850 flex items-center justify-between sm:block">
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {t('create_po_estimated_total')}
                </span>
              <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                {fmt(t('barcode_etb'), [totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })])}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('create_po_notes_label')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('create_po_notes_placeholder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
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
              {t('create_po_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
