import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../components/Toast';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWarehouse?: string;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  isOpen,
  onClose,
  defaultWarehouse,
}) => {
  const { items, locations, warehouses, transferStock, getItemQuantityAtLocation, t } = useInventory();
  const { toast } = useToast();

  const transferSites = useMemo(
    () => (locations.length > 0 ? locations : warehouses),
    [locations, warehouses]
  );

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [targetLocationId, setTargetLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const firstItem = items[0];
    setSelectedItemId(firstItem?.id || '');

    const matchedDefault =
      transferSites.find((s) => s.id === defaultWarehouse || s.name === defaultWarehouse) ||
      transferSites.find((s) => s.id === firstItem?.locationId || s.name === firstItem?.location) ||
      transferSites[0];

    const fallbackTarget =
      transferSites.find((s) => s.id !== matchedDefault?.id) || matchedDefault;

    setSourceLocationId(matchedDefault?.id || '');
    setTargetLocationId(fallbackTarget?.id || '');
    setQuantity(1);
  }, [isOpen, defaultWarehouse, items, transferSites]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);
  const sourceSite = transferSites.find((s) => s.id === sourceLocationId);
  const ledgerSourceQty = currentItem && sourceLocationId
    ? getItemQuantityAtLocation(currentItem.id, sourceLocationId)
    : 0;
  const isItemPrimarySite =
    currentItem &&
    sourceSite &&
    (currentItem.locationId === sourceSite.id || currentItem.location === sourceSite.name);
  const availableQty =
    ledgerSourceQty > 0
      ? ledgerSourceQty
      : isItemPrimarySite
      ? currentItem?.quantity ?? 0
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLocationId || !targetLocationId || sourceLocationId === targetLocationId) {
      toast(t('transfer_source_target_diff'), 'error');
      return;
    }

    if (!currentItem || availableQty < quantity || quantity <= 0) {
      toast(t('transfer_insufficient_stock').replace('{available}', String(availableQty)), 'error');
      return;
    }

    const ok = await transferStock(selectedItemId, sourceLocationId, targetLocationId, quantity);
    if (ok) {
      onClose();
    }
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

        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-amber-500" />
          <span>{t('transfer_stock')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('transfer_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Item Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('transfer_item_label')}
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const found = items.find((i) => i.id === e.target.value);
                if (found) {
                  const matched = transferSites.find(
                    (s) => s.id === found.locationId || s.name === found.location
                  );
                  if (matched) setSourceLocationId(matched.id);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {t('create_po_option_stock').replace('{name}', i.name).replace('{sku}', i.sku).replace('{qty}', String(i.quantity))}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl terit-glass-sub">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[11px] mb-1">{t('source_location')}</label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                {transferSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[11px] mb-1">{t('target_location')}</label>
              <select
                value={targetLocationId}
                onChange={(e) => setTargetLocationId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                {transferSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfer Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">{t('transfer_quantity')}</label>
              <span className="text-[11px] text-slate-500 font-mono">
                {t('transfer_available').replace('{qty}', String(availableQty))}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={Math.max(1, availableQty)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white text-base focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              {t('transfer_cancel_btn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
            >
              {t('transfer_execute_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
