import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  Truck,
  X,
  Boxes,
  ClipboardCheck,
  Receipt,
  Ban,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseOrder } from '../types/inventory';
import { fmt } from '../i18n/fmt';

interface PurchaseOrdersViewProps {
  onOpenCreatePO: () => void;
  onViewPODetails: (po: PurchaseOrder) => void;
  onNavigate?: (tab: string) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  onOpenCreatePO,
  onViewPODetails,
  onNavigate,
}) => {
  const { purchaseOrders, receivePurchaseOrder, updatePurchaseOrder, t } = useInventory();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [poToReceive, setPoToReceive] = useState<PurchaseOrder | null>(null);
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);
  const [lastReceivedPO, setLastReceivedPO] = useState<{ poNumber: string; totalUnits: number } | null>(null);

  const filteredPOs = purchaseOrders.filter((po) => {
    return filterStatus === 'all' || po.status === filterStatus;
  });

  const totalOrderedValue = purchaseOrders
    .filter((p) => p.status === 'ordered')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const handleMarkOrdered = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await updatePurchaseOrder(id, { status: 'ordered' });
  };

  const handleConfirmReceive = async () => {
    if (!poToReceive) return;
    const poNumber = poToReceive.poNumber;
    const totalUnits = poToReceive.items.reduce((s, l) => s + l.quantity, 0);
    await receivePurchaseOrder(poToReceive.id);
    setPoToReceive(null);
    setLastReceivedPO({ poNumber, totalUnits });
  };

  const handleConfirmCancel = async () => {
    if (!poToCancel) return;
    await updatePurchaseOrder(poToCancel.id, { status: 'cancelled' });
    setPoToCancel(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('nav_pos')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('pos_subtitle')}
          </p>
        </div>

        <button
          onClick={onOpenCreatePO}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('new_po_btn')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('po_kpi_ordered_title')}</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-0.5">
              {purchaseOrders.filter((p) => p.status === 'ordered').length} {t('po_orders_unit')}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
              {fmt(t('purchase_orders_etb'), [totalOrderedValue.toLocaleString(undefined, { minimumFractionDigits: 2 }), t('po_committed_suffix')])}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('po_kpi_received_title')}</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
              {purchaseOrders.filter((p) => p.status === 'received').length} {t('po_orders_unit')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('po_kpi_received_sub')}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('po_kpi_draft_title')}</span>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums mt-0.5">
              {purchaseOrders.filter((p) => p.status === 'draft').length} {t('po_drafts_unit')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('po_kpi_draft_sub')}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Post-Receive Closed-Loop Next Steps Banner */}
      {lastReceivedPO && (
        <div className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {t('po_next_banner_title')
                  .replace('{qty}', String(lastReceivedPO.totalUnits))
                  .replace('{po}', lastReceivedPO.poNumber)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {t('po_next_banner_desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('inventory')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>{t('po_next_view_inventory')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ledger')}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{t('po_next_view_ledger')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('landed-cost')}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('po_next_landed_cost')}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setLastReceivedPO(null)}
              aria-label={t('close_btn')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 terit-glass-sub rounded-xl w-full sm:w-fit text-xs">
        {[
          { id: 'all', label: t('po_all_orders') },
          { id: 'draft', label: t('po_status_draft') },
          { id: 'ordered', label: t('po_status_ordered') },
          { id: 'received', label: t('po_status_received') },
          { id: 'cancelled', label: t('po_status_cancelled') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      <div className="terit-glass rounded-2xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 font-bold">{t('po_number')}</th>
                <th className="py-3 px-3 font-bold">{t('supplier_name')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('status')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('po_items_count')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('total_po_amount')}</th>
                <th className="py-3 px-3 font-bold">{t('order_date')}</th>
                <th className="py-3 px-3 font-bold">{t('expected_date')}</th>
                <th className="py-3 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {t('po_no_match')}
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  return (
                    <tr
                      key={po.id}
                      onClick={() => onViewPODetails(po)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                        {po.poNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                        {po.supplierName}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {po.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <Clock className="w-3 h-3" /> {t('po_status_draft')}
                          </span>
                        )}
                        {po.status === 'ordered' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                            <Truck className="w-3 h-3" /> {t('po_status_ordered')}
                          </span>
                        )}
                        {po.status === 'received' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> {t('po_status_received')}
                          </span>
                        )}
                        {po.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                            <Ban className="w-3 h-3" /> {t('po_status_cancelled')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {po.items.length} ({po.items.reduce((s, i) => s + i.quantity, 0)} {t('units_label')})
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {fmt(t('barcode_etb'), [po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })])}</td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {po.orderDate}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {po.expectedDate || '—'}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {po.status === 'draft' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handleMarkOrdered(po.id, e)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {t('po_send_to_vendor')}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPoToCancel(po);
                              }}
                              title={t('po_cancel_btn')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {po.status === 'ordered' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPoToReceive(po);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('receive_goods_btn')}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPoToCancel(po);
                              }}
                              title={t('po_cancel_btn')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {po.status === 'received' && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t('po_status_received')} {po.receivedDate}
                          </span>
                        )}
                        {po.status === 'cancelled' && (
                          <span className="text-[11px] text-rose-500 font-semibold">
                            {t('po_status_cancelled')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive PO Confirmation Modal */}
      {poToReceive && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-sm w-full p-6 space-y-4 m-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setPoToReceive(null)}
                aria-label={t('close_btn')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('receive_goods_btn')} ({poToReceive.poNumber})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('po_details_confirm_receive_text')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPoToReceive(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                onClick={handleConfirmReceive}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                {t('po_details_yes_add_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel PO Confirmation Modal */}
      {poToCancel && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-sm w-full p-6 space-y-4 m-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <button
                onClick={() => setPoToCancel(null)}
                aria-label={t('close_btn')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('po_cancel_confirm_title').replace('{po}', poToCancel.poNumber)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('po_cancel_confirm_desc')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPoToCancel(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {t('po_cancel_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
