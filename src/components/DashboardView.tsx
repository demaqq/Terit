import React from 'react';
import {
  DollarSign,
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShoppingCart,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { IndustryToolsPanel } from './IndustryToolsPanel';
import { InventoryItem } from '../types/inventory';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAddItem: () => void;
  onOpenQuickAdjust: (itemId?: string) => void;
  onOpenCreatePO: (supplierId?: string, itemId?: string) => void;
  onOpenOnboarding: () => void;
  onOpenBarcode: (item: InventoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddItem,
  onOpenQuickAdjust,
  onOpenCreatePO,
  onOpenBarcode,
}) => {
  const {
    items,
    transactions,
    purchaseOrders,
    t,
  } = useInventory();

  // Metrics calculations
  const totalValuation = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const totalCost = items.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const lowStockItems = items.filter((i) => i.status === 'low_stock');
  const outOfStockItems = items.filter((i) => i.status === 'out_of_stock');
  const pendingPOs = purchaseOrders.filter((p) => p.status === 'ordered' || p.status === 'draft');
  const grossProfitMargin = totalValuation > 0 ? ((totalValuation - totalCost) / totalValuation) * 100 : 0;

  // Recent 6 transactions
  const recentMovements = transactions.slice(0, 6);

  // Category distribution
  const categoryMap = items.reduce((acc: Record<string, { count: number; value: number }>, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, value: 0 };
    }
    acc[item.category].count += 1;
    acc[item.category].value += item.quantity * item.unitPrice;
    return acc;
  }, {});

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].value - a[1].value);

  return (
    <div className="space-y-6">
      {/* Top Action Banner */}
      <div className="relative overflow-hidden terit-glass rounded-3xl p-6 sm:p-7 flex items-center justify-end gap-5 transition-all">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/20 dark:bg-amber-400/12 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-12 w-64 h-64 rounded-full bg-sky-400/15 dark:bg-sky-400/10 blur-3xl"
        />

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_item_btn')}</span>
          </button>
          <button
            onClick={() => onOpenQuickAdjust()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Layers className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>{t('quick_adjust_btn')}</span>
          </button>
          <button
            onClick={() => onOpenCreatePO()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>{t('new_po_btn')}</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t('nav_reports')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retail Valuation */}
        <div className="terit-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('retail_valuation')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums truncate">
            {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">ETB</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            <span className="tabular-nums">{t('cost_label')}: {totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono tabular-nums">
              {grossProfitMargin.toFixed(1)}% {t('margin_label')}
            </span>
          </div>
        </div>

        {/* Physical Units */}
        <div className="terit-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('physical_units')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {totalUnits.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('units_label')}</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {items.length} {t('active_skus')}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="terit-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('low_stock_breaches')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
            {lowStockItems.length}
          </div>
          <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>{t('requires_restock')}</span>
            {lowStockItems.length > 0 && (
              <button
                onClick={() => onNavigate('inventory')}
                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer whitespace-nowrap"
              >
                {t('view_action')} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Out of Stock & Pending POs */}
        <div className="terit-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('out_of_stock_kpi')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums">
              {outOfStockItems.length} <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('empty_stock')}</span>
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              / {pendingPOs.length} {t('pos_short')}
            </div>
          </div>
          <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {pendingPOs.length > 0 ? `${pendingPOs.length} ${t('orders_in_pipeline')}` : t('no_active_orders')}
          </div>
        </div>
      </div>

      {/* Customized Industry Operations & Custom Toolset */}
      <IndustryToolsPanel
        onOpenCreatePO={onOpenCreatePO}
        onOpenQuickAdjust={onOpenQuickAdjust}
        onOpenBarcode={onOpenBarcode}
      />

      {/* Main Grid: Left Urgent Stock / Right Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="terit-glass rounded-2xl p-5 sm:p-6 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('stock_urgency_title')}
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                  · {lowStockItems.length + outOfStockItems.length} {t('items_label')}
                </span>
              </div>
              <button
                onClick={() => onNavigate('procurement')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{t('nav_pos')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-600 dark:text-slate-400 text-xs">
                {t('all_items_safe')}
              </div>
            ) : (
              <div className="divide-y divide-slate-900/10 dark:divide-white/10">
                {[...outOfStockItems, ...lowStockItems].map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          · {item.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span>{item.location || t('main_warehouse_default')}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t('vendor_label')}: {item.supplierName || t('vendor_unassigned')}</span>
                        {item.expiryDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                              {t('exp_short')}: {item.expiryDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            item.quantity === 0 ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.quantity} / {t('min_short')} {item.minStockAlert}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          {item.quantity === 0 ? t('zero_stock_label') : t('low_stock_label')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenCreatePO(item.supplierId, item.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {t('restock_po')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Inventory Valuation Breakdown */}
          <div className="terit-glass rounded-2xl p-5 sm:p-6 transition-all">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {t('category_valuation_title')}
            </h3>
            <div className="space-y-3.5">
              {categories.map(([category, stats]) => {
                const pct = totalValuation > 0 ? (stats.value / totalValuation) * 100 : 0;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{category}</span>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-slate-600 dark:text-slate-400">{stats.count} {t('skus_short')}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">
                          {stats.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                        </span>
                        <span className="text-amber-700 dark:text-amber-400 w-10 text-right font-bold">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Live Audit Ledger */}
        <div className="space-y-6">
          <div className="terit-glass rounded-2xl p-5 sm:p-6 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('recent_transactions')}
              </h3>
              <button
                onClick={() => onNavigate('movements')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{t('full_log')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentMovements.length === 0 ? (
                <div className="py-6 text-center text-slate-600 dark:text-slate-400 text-xs">
                  {t('no_transactions_yet')}
                </div>
              ) : (
                recentMovements.map((tx) => {
                  const isInbound = tx.quantity > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl terit-glass-sub flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {tx.itemName}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5 font-mono truncate">
                          <span>{tx.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{tx.reason}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 tabular-nums">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-xs flex items-center justify-end gap-0.5 tabular-nums ${
                            isInbound ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isInbound ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isInbound ? `+${tx.quantity}` : tx.quantity}
                        </span>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                          {tx.previousQuantity ?? 0} &rarr; {tx.newQuantity ?? tx.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
