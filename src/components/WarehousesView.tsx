import React from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  ArrowRightLeft,
  Crown,
  MapPin,
  Lock,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface WarehousesViewProps {
  onOpenAddWarehouse: () => void;
  onOpenStockTransfer: (warehouseName?: string) => void;
  onOpenPricing: () => void;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({
  onOpenAddWarehouse,
  onOpenStockTransfer,
  onOpenPricing,
}) => {
  const { warehouses, items, tier, t } = useInventory();
  const isFreeTier = tier === 'free';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('warehouses_title')}
            </h1>
            {isFreeTier && (
              <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded whitespace-nowrap">
                {t('warehouses_single_hub_badge')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('warehouses_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Transfer stock */}
          <button
            onClick={() => {
              if (isFreeTier) {
                onOpenPricing();
              } else {
                onOpenStockTransfer();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFreeTier ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />}
            <span>{t('transfer_stock')}</span>
          </button>

          {/* Add warehouse */}
          <button
            onClick={() => {
              if (isFreeTier) {
                onOpenPricing();
              } else {
                onOpenAddWarehouse();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            {isFreeTier ? <Crown className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
            <span>{isFreeTier ? t('warehouses_unlock_multi') : t('add_warehouse_btn')}</span>
          </button>
        </div>
      </div>

      {/* Free Tier Notice Banner if on Free */}
      {isFreeTier && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('warehouses_pro_feature_title')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t('warehouses_pro_feature_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPricing}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition-colors self-start sm:self-center cursor-pointer"
          >
            {t('upgrade_to_pro_btn')}
          </button>
        </div>
      )}

      {/* Warehouse Cards Grid */}
      {warehouses.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-3">🏭</div>
          <div className="font-semibold">{t('warehouses_empty') || 'No warehouses yet.'}</div>
          <div className="text-xs mt-1">{t('warehouses_empty_desc') || 'Add your first warehouse to start tracking stock locations.'}</div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const whItems = items.filter((i) => i.location === wh.name);
          const totalUnits = whItems.reduce((acc, i) => acc + i.quantity, 0);
          const totalValuation = whItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
          const capacity = wh.capacity || 20000;
          const usagePct = Math.min(100, (totalUnits / capacity) * 100);

          return (
            <div
              key={wh.id}
              className="min-w-0 terit-glass rounded-2xl p-5 space-y-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <WarehouseIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{wh.name}</span>
                      {wh.isDefault && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                          {t('default_facility')}
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{t('warehouse_code')}: {wh.code}</div>
                  </div>
                </div>
              </div>

              {wh.address && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{wh.address}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t('warehouses_units_stored')}</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-base mt-0.5">
                    {totalUnits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t('warehouses_stock_valuation')}</div>
                  <div className="font-mono font-bold text-amber-700 dark:text-amber-400 text-base mt-0.5">
                    {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                  </div>
                </div>
              </div>

              {/* Capacity meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">{t('storage_capacity')}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    {totalUnits} / {capacity.toLocaleString()} ({usagePct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePct > 85 ? 'bg-rose-500' : usagePct > 65 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Transfer Trigger */}
              <button
                onClick={() => {
                  if (isFreeTier) {
                    onOpenPricing();
                  } else {
                    onOpenStockTransfer(wh.name);
                  }
                }}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                <span>{t('warehouses_transfer_from_site')}</span>
              </button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
