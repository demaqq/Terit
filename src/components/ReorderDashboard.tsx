import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShoppingCart,
  Plus,
  Filter,
  Search,
  Truck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  X,
  ClipboardCheck,
  Boxes,
  Receipt,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseOrder, ReorderRecommendation } from '../types/inventory';
import { fmt } from '../i18n/fmt';

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' },
  low: { label: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' },
};

interface ReorderDashboardProps {
  onNavigate?: (tab: string) => void;
  onOpenQuickAdjust?: (itemId?: string) => void;
  onViewPODetails?: (po: PurchaseOrder) => void;
}

interface WorkflowActionBanner {
  type: 'created' | 'ordered' | 'received';
  itemName: string;
  poNumber: string;
  poId?: string;
  qty: number;
}

export const ReorderDashboard: React.FC<ReorderDashboardProps> = ({
  onNavigate,
  onOpenQuickAdjust,
  onViewPODetails,
}) => {
  const {
    getReorderRecommendations,
    createPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,
    purchaseOrders,
    items,
    t,
  } = useInventory();

  const recommendations = useMemo(() => getReorderRecommendations(), [getReorderRecommendations]);

  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [lastAction, setLastAction] = useState<WorkflowActionBanner | null>(null);
  const [confirmReceivePoId, setConfirmReceivePoId] = useState<string | null>(null);
  const [busyPoId, setBusyPoId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return recommendations
      .filter((r) => {
        const matchesSearch =
          r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
        return matchesSearch && matchesUrgency;
      })
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.urgency] - order[b.urgency];
      });
  }, [recommendations, searchTerm, urgencyFilter]);

  const totalEstimatedCost = useMemo(() => filtered.reduce((sum, r) => sum + r.estimatedCost, 0), [filtered]);

  const urgencyCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of recommendations) {
      counts[r.urgency] = (counts[r.urgency] ?? 0) + 1;
    }
    return counts;
  }, [recommendations]);

  const handleCreatePOFromRecommendation = async (rec: ReorderRecommendation) => {
    // Prevent duplicate active PO creation for the same item
    const existingActivePO = purchaseOrders.find(
      (p) =>
        (p.status === 'draft' || p.status === 'ordered') &&
        p.items.some((l) => l.itemId === rec.itemId)
    );
    if (existingActivePO) {
      onViewPODetails?.(existingActivePO);
      return;
    }

    const sourceItem = items.find((i) => i.id === rec.itemId);
    const safeQty = Math.max(1, rec.recommendedOrderQuantity);
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const expected = new Date();
    expected.setDate(expected.getDate() + Math.max(1, rec.leadTimeDays || 5));

    setBusyPoId(rec.itemId);
    try {
      const created = await createPurchaseOrder({
        poNumber,
        supplierId: sourceItem?.supplierId || '',
        supplierName: sourceItem?.supplierName || t('vendor_unassigned'),
        items: [
          {
            itemId: rec.itemId,
            name: rec.itemName,
            sku: rec.sku,
            quantity: safeQty,
            unitCost: rec.estimatedCost / safeQty,
            totalCost: rec.estimatedCost,
          },
        ],
        totalAmount: rec.estimatedCost,
        status: 'draft',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: expected.toISOString().split('T')[0],
      });

      if (created) {
        setLastAction({
          type: 'created',
          itemName: rec.itemName,
          poNumber,
          qty: safeQty,
        });
      }
    } finally {
      setBusyPoId(null);
    }
  };

  const handleDispatchPO = async (po: PurchaseOrder, itemName: string) => {
    setBusyPoId(po.id);
    try {
      await updatePurchaseOrder(po.id, { status: 'ordered' });
      setLastAction({
        type: 'ordered',
        itemName,
        poNumber: po.poNumber,
        poId: po.id,
        qty: po.items.reduce((s, l) => s + l.quantity, 0),
      });
    } finally {
      setBusyPoId(null);
    }
  };

  const handleReceivePO = async (po: PurchaseOrder, itemName: string) => {
    setBusyPoId(po.id);
    try {
      await receivePurchaseOrder(po.id);
      setConfirmReceivePoId(null);
      setLastAction({
        type: 'received',
        itemName,
        poNumber: po.poNumber,
        poId: po.id,
        qty: po.items.reduce((s, l) => s + l.quantity, 0),
      });
    } finally {
      setBusyPoId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('reorder_title')}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
              {filtered.length} {t('reorder_recommendations_unit')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reorder_subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${urgencyCounts.critical > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
            {urgencyCounts.critical} {t('reorder_urgency_critical')}
          </span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('procurement')}
              className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('nav_pos')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Closed-Loop 4-Step Restock Workflow Strip */}
      <div className="terit-glass-sub rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" />
            {t('reorder_step_1')}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/70">
            <ShoppingCart className="w-3 h-3 text-slate-500" />
            {t('reorder_step_2')}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/70">
            <Truck className="w-3 h-3 text-slate-500" />
            {t('reorder_step_3')}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {t('reorder_step_4')}
          </span>
        </div>
      </div>

      {/* Post-Action Interactive "What's Next?" Banner */}
      {lastAction && (
        <div className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {lastAction.type === 'created'
                  ? t('reorder_next_created_title').replace('{po}', lastAction.poNumber).replace('{item}', lastAction.itemName)
                  : lastAction.type === 'ordered'
                  ? t('reorder_next_ordered_title').replace('{po}', lastAction.poNumber)
                  : t('reorder_next_received_title').replace('{po}', lastAction.poNumber).replace('{qty}', String(lastAction.qty))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {lastAction.type === 'created'
                  ? t('reorder_next_created_desc')
                  : lastAction.type === 'ordered'
                  ? t('reorder_next_ordered_desc')
                  : t('reorder_next_received_desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lastAction.type === 'created' && (() => {
              const targetPO = purchaseOrders.find(
                (p) => (lastAction.poId ? p.id === lastAction.poId : p.poNumber === lastAction.poNumber)
              );
              return targetPO && targetPO.status === 'draft' ? (
                <button
                  type="button"
                  onClick={() => void handleDispatchPO(targetPO, lastAction.itemName)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{t('po_send_to_vendor')}</span>
                </button>
              ) : null;
            })()}

            {lastAction.type === 'ordered' && (() => {
              const targetPO = purchaseOrders.find(
                (p) => (lastAction.poId ? p.id === lastAction.poId : p.poNumber === lastAction.poNumber)
              );
              return targetPO && targetPO.status === 'ordered' ? (
                <button
                  type="button"
                  onClick={() => void handleReceivePO(targetPO, lastAction.itemName)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('receive_goods_btn')}</span>
                </button>
              ) : null;
            })()}

            {lastAction.type !== 'received' && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('procurement')}
                className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('reorder_open_pos_btn')}</span>
              </button>
            )}

            {lastAction.type === 'received' && onNavigate && (
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
                  onClick={() => onNavigate('landed-cost')}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('po_next_landed_cost')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ledger')}
                  className="px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{t('po_next_view_ledger')}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setLastAction(null)}
              aria-label={t('close_btn')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('reorder_items_needing')}</p>
          <p className={`text-2xl font-bold tabular-nums ${urgencyCounts.critical > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {filtered.length}
          </p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('reorder_urgency_critical')}</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{urgencyCounts.critical}</p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">{t('reorder_estimated_cost')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(t('barcode_etb'), [totalEstimatedCost.toLocaleString()])}</p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('reorder_avg_lead_time')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {recommendations.length > 0 ? Math.round(recommendations.reduce((sum, r) => sum + r.leadTimeDays, 0) / recommendations.length) : 0}d
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="terit-glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative w-full sm:w-auto flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm cursor-pointer"
            >
              <option value="all">{t('all_statuses')}</option>
              <option value="critical">{t('reorder_urgency_critical')}</option>
              <option value="high">{t('reorder_urgency_high')}</option>
              <option value="medium">{t('reorder_urgency_medium')}</option>
              <option value="low">{t('reorder_urgency_low')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="terit-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_item')}</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_location')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_on_hand')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_velocity')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_lead_time')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_reorder_point')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_recommended_qty')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_estimated_cost')}</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('reorder_urgency')}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-500 dark:text-slate-400">{t('reorder_no_recommendations')}</p>
                </td>
              </tr>
            ) : (
              filtered.map((rec) => {
                const cfg = URGENCY_CONFIG[rec.urgency];
                const isBelowPoint = rec.quantityOnHand <= rec.reorderPoint;
                const matchingPO = purchaseOrders.find(
                  (p) =>
                    (p.status === 'draft' || p.status === 'ordered') &&
                    p.items.some((l) => l.itemId === rec.itemId)
                );
                const incomingQty = matchingPO
                  ? matchingPO.items
                      .filter((l) => l.itemId === rec.itemId)
                      .reduce((s, l) => s + l.quantity, 0)
                  : 0;

                return (
                  <tr key={rec.itemId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isBelowPoint ? 'border-l-2 border-l-red-500' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{rec.itemName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">{rec.sku}</div>
                      {matchingPO && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              matchingPO.status === 'draft'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {matchingPO.status === 'draft'
                              ? t('reorder_po_draft_badge').replace('{po}', matchingPO.poNumber)
                              : t('reorder_po_incoming_badge')
                                  .replace('{po}', matchingPO.poNumber)
                                  .replace('{qty}', String(incomingQty))}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{rec.locationName}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">{rec.quantityOnHand}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{rec.averageDailyVelocity}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{rec.leadTimeDays}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{rec.reorderPoint}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">{rec.recommendedOrderQuantity}</td>
                    <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-300 font-semibold tabular-nums">{fmt(t('barcode_etb'), [rec.estimatedCost.toLocaleString()])}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                        {t(`reorder_urgency_${rec.urgency}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!matchingPO && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={busyPoId === rec.itemId}
                            onClick={() => void handleCreatePOFromRecommendation(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{t('reorder_create_po')}</span>
                          </button>
                          {onOpenQuickAdjust && (
                            <button
                              type="button"
                              onClick={() => onOpenQuickAdjust(rec.itemId)}
                              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                              title={t('quick_adjust_btn')}
                            >
                              {t('quick_adjust_btn')}
                            </button>
                          )}
                        </div>
                      )}

                      {matchingPO && matchingPO.status === 'draft' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busyPoId === matchingPO.id}
                            onClick={() => void handleDispatchPO(matchingPO, rec.itemName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            <Truck className="w-3 h-3" />
                            <span>{t('reorder_send_draft_btn')}</span>
                          </button>
                          {onViewPODetails && (
                            <button
                              type="button"
                              onClick={() => onViewPODetails(matchingPO)}
                              className="px-2 py-1 rounded-lg terit-glass-sub text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              {t('reorder_view_po_btn')}
                            </button>
                          )}
                        </div>
                      )}

                      {matchingPO && matchingPO.status === 'ordered' && (
                        confirmReceivePoId === matchingPO.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busyPoId === matchingPO.id}
                              onClick={() => void handleReceivePO(matchingPO, rec.itemName)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              {t('po_details_confirm_yes')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmReceivePoId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer"
                            >
                              {t('cancel_btn')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmReceivePoId(matchingPO.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('receive_goods_btn')}</span>
                            </button>
                            {onViewPODetails && (
                              <button
                                type="button"
                                onClick={() => onViewPODetails(matchingPO)}
                                className="px-2 py-1 rounded-lg terit-glass-sub text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                {t('reorder_view_po_btn')}
                              </button>
                            )}
                          </div>
                        )
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

      {filtered.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {filtered.length} {t('reorder_below_point_warning')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

