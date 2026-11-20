import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  AlertCircle,
  Boxes,
  ClipboardCheck,
  Receipt,
  Truck,
} from 'lucide-react';
import { PurchaseOrder } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { fmt } from '../i18n/fmt';
import { backdrop } from '../lib/dismiss';

interface PODetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  onNavigate?: (tab: string) => void;
}

export const PODetailsModal: React.FC<PODetailsModalProps> = ({
  isOpen,
  onClose,
  po,
  onNavigate,
}) => {
  const { receivePurchaseOrder, updatePurchaseOrder, t } = useInventory();
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
  const [justReceived, setJustReceived] = useState(false);
  const [justDispatched, setJustDispatched] = useState(false);

  useEffect(() => {
    setIsConfirmingReceive(false);
    setJustReceived(false);
    setJustDispatched(false);
  }, [isOpen, po?.id]);

  if (!isOpen || !po) return null;

  const handleReceive = async () => {
    await receivePurchaseOrder(po.id);
    setIsConfirmingReceive(false);
    setJustDispatched(false);
    setJustReceived(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div {...backdrop(onClose)} className="fixed inset-0 z-50 flex p-2.5 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-2xl w-full p-4 sm:p-7 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PO Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 gap-3 pr-8 sm:pr-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {po.poNumber}
              </span>
              {po.status === 'draft' && (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {t('po_status_draft')}
                </span>
              )}
              {po.status === 'ordered' && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {t('po_status_ordered')}
                </span>
              )}
              {po.status === 'received' && (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {t('po_status_received')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('vendor_supplier')}: <strong className="text-slate-900 dark:text-white">{po.supplierName}</strong>
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('po_details_print_btn')}</span>
          </button>
        </div>

        {/* Order Dates */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs mb-4">
          <div>
            <span className="text-slate-500 text-[10px] sm:text-[11px] block font-medium">{t('po_details_order_date')}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{po.orderDate}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] sm:text-[11px] block font-medium">{t('po_details_expected_delivery')}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{po.expectedDate || t('unspecified')}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-500 text-[10px] sm:text-[11px] block font-medium">{t('po_details_receipt_date')}</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{po.receivedDate || t('pending_arrival')}</span>
          </div>
        </div>

        {/* Line Items Table with horizontal scrolling on mobile */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('po_details_line_items').replace('{count}', String(po.items.length))}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">{t('po_details_item_sku')}</th>
                    <th className="py-2.5 px-3 text-right font-semibold">{t('po_details_units')}</th>
                    <th className="py-2.5 px-3 text-right font-semibold">{t('po_details_unit_cost')}</th>
                    <th className="py-2.5 px-3 text-right font-semibold">{t('po_details_total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {po.items.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{line.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{line.sku}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {line.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {fmt(t('barcode_etb'), [line.unitCost.toFixed(2)])}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {fmt(t('barcode_etb'), [line.totalCost.toFixed(2)])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500 uppercase font-mono font-semibold">
            {t('po_details_grand_total')}
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
            {fmt(t('barcode_etb'), [po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })])}</span>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mb-4">
            <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">{t('po_details_notes')}</strong>
            {po.notes}
          </div>
        )}

        {/* Post-Dispatch Next Step Notice */}
        {justDispatched && po.status === 'ordered' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/12 border border-amber-500/35 text-xs flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                {t('po_details_dispatched_title')}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {t('po_details_dispatched_desc')}
              </p>
            </div>
          </div>
        )}

        {/* Post-Receive Closed-Loop "What's Next?" Confirmation Panel */}
        {justReceived && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-500/12 border border-emerald-500/35 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {t('po_details_received_next_title')}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  {t('po_next_banner_desc')}
                </p>
              </div>
            </div>
            {onNavigate && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('inventory');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>{t('po_next_view_inventory')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('ledger');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{t('po_next_view_ledger')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('landed-cost');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('po_next_landed_cost')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline Confirmation Prompt for Receiving Stock (Replaces window.confirm) */}
        {isConfirmingReceive && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('po_details_confirm_receive').replace('{poNumber}', po.poNumber)}</span>
            </div>
              <p className="text-[11px] leading-relaxed">
                {t('po_details_confirm_desc').replace('{count}', String(po.items.length))}
              </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReceive}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t('po_details_confirm_yes')}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingReceive(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                {t('po_details_confirm_cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          {po.status === 'draft' && (
            <button
              onClick={async () => {
                await updatePurchaseOrder(po.id, { status: 'ordered' });
                setJustDispatched(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              {t('po_details_dispatch_btn')}
            </button>
          )}

          {po.status === 'ordered' && !isConfirmingReceive && (
            <button
              onClick={() => setIsConfirmingReceive(true)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('po_details_receive_btn')}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            {justReceived ? t('close_btn') : (t('cancel_btn'))}
          </button>
        </div>
      </div>
    </div>
  );
};
