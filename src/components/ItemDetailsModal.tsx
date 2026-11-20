import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Clock,
  Layers,
  Calendar,
  Receipt,
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { ledgerDirection } from '../lib/ledger';
import { fmt } from '../i18n/fmt';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onOpenEdit: (item: InventoryItem) => void;
  onOpenQuickAdjust: (itemId: string) => void;
  onOpenBarcode: (item: InventoryItem) => void;
  onOpenETR?: (item: InventoryItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onOpenEdit,
  onOpenQuickAdjust,
  onOpenBarcode,
  onOpenETR,
}) => {
  const { transactions, deleteItem, t } = useInventory();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const itemHistory = transactions.filter((tx) => tx.itemId === item.id || tx.sku === item.sku);
  const totalValuation = item.quantity * item.unitPrice;
  const totalCost = item.quantity * item.costPrice;
  const unitMargin = item.unitPrice > 0 ? ((item.unitPrice - item.costPrice) / item.unitPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          aria-label={t('close_btn')}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 font-bold">
              {item.sku}
            </span>
            <span className="text-xs text-slate-500">{item.category}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{item.name}</h2>
          {(item.color || item.size || item.specs) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {item.color && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {t('item_color_label')}: {item.color}
                </span>
              )}
              {item.size && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {t('item_size_label')}: {item.size}
                </span>
              )}
              {item.specs && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  {item.specs}
                </span>
              )}
            </div>
          )}
          {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t('on_hand')}</span>
            <div className="text-lg font-bold font-mono mt-0.5">
              {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unitOfMeasure}</span>
            </div>
            <span
              className={`text-[10px] font-semibold ${
                item.status === 'in_stock'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : item.status === 'low_stock'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {t('min_alert')}: {item.minStockAlert}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t('unit_price')}</span>
            <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
              {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t('currency_etb')}</span>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{fmt(t('dashboard_etb'), [t('item_details_cost_label'), item.costPrice.toFixed(2)])}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t('item_details_gross_margin')}</span>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {unitMargin.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{fmt(t('item_details_etb'), [(item.unitPrice - item.costPrice).toFixed(2), t('per_unit')])}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t('valuation')}</span>
            <div className="text-lg font-bold font-mono mt-0.5">
              {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-xs font-normal">{t('currency_etb')}</span>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{fmt(t('dashboard_etb'), [t('cost_label'), totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })])}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">{t('location')}</span>
              <span className="font-semibold">{item.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">{t('item_details_supplier_label')}</span>
              <span className="font-semibold">{item.supplierName || t('not_assigned')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">{t('item_details_barcode_label')}</span>
              <span className="font-mono font-semibold">{item.barcode}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">{t('batch_lot')}</span>
              <span className="font-mono font-semibold">{item.batchNumber || t('not_available_short')}</span>
            </div>
          </div>

          {item.expiryDate && (
            <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="text-slate-500 text-[11px] block">{t('expiry_date')}</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{item.expiryDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => onOpenQuickAdjust(item.id)}
            className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('quick_adjust_btn')}</span>
          </button>

          {onOpenETR && (
            <button
              onClick={() => onOpenETR(item)}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title={t('etr_issue_btn')}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('etr_issue_short')}</span>
            </button>
          )}

          <button
            onClick={() => onOpenBarcode(item)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title={t('print_label')}
          >
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('print_label')}</span>
          </button>

          <button
            onClick={() => onOpenEdit(item)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('item_details_edit_btn')}</span>
          </button>

          {!isConfirmingDelete ? (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={t('delete_item')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-rose-700 dark:text-rose-300 font-semibold">
                {t('item_details_delete_title').replace('{itemName}', item.name)}
              </span>
              <button
                onClick={async () => {
                  await deleteItem(item.id);
                  onClose();
                }}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                {t('confirm_delete_btn')}
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
            </div>
          )}
        </div>

        {/* Movement History for this SKU */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('item_details_history_title').replace('{sku}', item.sku)}
          </h4>
          {itemHistory.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
              {t('item_details_no_history')}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {itemHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{tx.reason}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    {(() => {
                      const dir = ledgerDirection(tx);
                      const q = Math.abs(tx.quantity);
                      const cls =
                        dir === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : dir === 'out'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400';
                      const place =
                        dir === 'transfer'
                          ? `${tx.sourceLocationName || ''} → ${tx.destinationLocationName || ''}`
                          : dir === 'in'
                            ? tx.destinationLocationName
                            : tx.sourceLocationName;
                      return (
                        <>
                          <span className={`${cls} font-bold`}>{dir === 'in' ? `+${q}` : dir === 'out' ? `−${q}` : `⇄ ${q}`}</span>
                          {place && <div className="text-[10px] text-slate-500">{place}</div>}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
