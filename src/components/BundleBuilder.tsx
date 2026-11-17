import React, { useState, useMemo } from 'react';
import {
  Package,
  PackageCheck,
  PackageMinus,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { BundleComponent } from '../types/inventory';

export const BundleBuilder: React.FC = () => {
  const {
    items,
    locations,
    assembleBundle,
    disassembleBundle,
    getItemQuantityAtLocation,
    t,
  } = useInventory();

  const defaultLoc = locations.find((l) => l.isDefault);
  const locId = defaultLoc?.id || 'loc-default';

  const bundleItems = useMemo(
    () => items.filter((i) => i.isBundle && i.bundleComponents && i.bundleComponents.length > 0),
    [items]
  );

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [assemblyQty, setAssemblyQty] = useState<string>('1');
  const [operation, setOperation] = useState<'assemble' | 'disassemble'>('assemble');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedBundle = useMemo(
    () => bundleItems.find((i) => i.id === selectedBundleId) ?? null,
    [bundleItems, selectedBundleId]
  );

  const bundleQtyOnHand = useMemo(() => {
    if (!selectedBundle) return 0;
    return getItemQuantityAtLocation(selectedBundle.id, locId);
  }, [selectedBundle, getItemQuantityAtLocation, locId]);

  const validateAssembly = () => {
    if (!selectedBundle) return { ok: false, msg: '' };
    const qty = Number(assemblyQty) || 0;
    if (qty <= 0) return { ok: false, msg: t('bundle_qty_positive_error') };
    for (const comp of selectedBundle.bundleComponents ?? []) {
      const needed = comp.quantity * qty;
      const avail = getItemQuantityAtLocation(comp.itemId, locId);
      if (avail < needed) {
        return { ok: false, msg: `${t('bundle_insufficient_component')}: ${comp.itemName} (${needed} / ${avail})` };
      }
    }
    return { ok: true, msg: '' };
  };

  const validateDisassembly = () => {
    if (!selectedBundle) return { ok: false, msg: '' };
    const qty = Number(assemblyQty) || 0;
    if (qty <= 0) return { ok: false, msg: t('bundle_qty_positive_error') };
    if (bundleQtyOnHand < qty) {
      return { ok: false, msg: `${t('bundle_insufficient_stock')}: ${selectedBundle.name} (${qty} / ${bundleQtyOnHand})` };
    }
    return { ok: true, msg: '' };
  };

  const handleAssemble = async () => {
    if (!selectedBundle) return;
    const validation = validateAssembly();
    if (!validation.ok) {
      setMessage({ text: validation.msg, type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    const qty = Number(assemblyQty);
    const ok = await assembleBundle(selectedBundle.id, locId, qty);
    if (ok) {
      setMessage({ text: t('bundle_success'), type: 'success' });
      setAssemblyQty('1');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDisassemble = async () => {
    if (!selectedBundle) return;
    const validation = validateDisassembly();
    if (!validation.ok) {
      setMessage({ text: validation.msg, type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    const qty = Number(assemblyQty);
    const ok = await disassembleBundle(selectedBundle.id, locId, qty);
    if (ok) {
      setMessage({ text: t('bundle_success'), type: 'success' });
      setAssemblyQty('1');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const canAssemble = () => {
    if (!selectedBundle) return false;
    const qty = Number(assemblyQty) || 0;
    return qty > 0 && (selectedBundle.bundleComponents ?? []).every((c) => getItemQuantityAtLocation(c.itemId, locId) >= c.quantity * qty);
  };

  const canDisassemble = () => {
    if (!selectedBundle) return false;
    const qty = Number(assemblyQty) || 0;
    return qty > 0 && bundleQtyOnHand >= qty;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('bundle_builder_title')}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {bundleItems.length} {t('bundle_products_unit')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('bundle_builder_subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOperation('assemble')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${operation === 'assemble' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800' : 'terit-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white/95 dark:hover:bg-slate-800/80'}`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{t('bundle_assemble_btn')}</span>
          </button>
          <button
            onClick={() => setOperation('disassemble')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${operation === 'disassemble' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800' : 'terit-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white/95 dark:hover:bg-slate-800/80'}`}
          >
            <PackageMinus className="w-3.5 h-3.5" />
            <span>{t('bundle_disassemble_btn')}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg border flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Bundle Selection */}
      <div className="terit-glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative w-full sm:w-96 min-w-0">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Layers className="w-4 h-4" />
            </div>
            <select
              value={selectedBundleId ?? ''}
              onChange={(e) => {
                setSelectedBundleId(e.target.value || null);
                setAssemblyQty('1');
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm cursor-pointer"
            >
              <option value="">{t('bundle_select')}</option>
              {bundleItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </div>
          {bundleItems.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-0 sm:ml-3">{t('bundle_no_bundles')}</span>
          )}
        </div>
      </div>

      {!selectedBundle ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('bundle_no_bundles')}</p>
        </div>
      ) : (
        <>
          {/* Bundle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('product_name')}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{selectedBundle.name}</p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('sku_short')}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono truncate">{selectedBundle.sku}</p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('on_hand')}</p>
              <p className={`text-lg font-bold tabular-nums ${bundleQtyOnHand === 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {bundleQtyOnHand}
              </p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('bundle_components')}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{selectedBundle.bundleComponents?.length ?? 0}</p>
            </div>
          </div>

          {/* Components List */}
          <div className="terit-glass rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('bundle_components')}</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('bundle_component_item')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('bundle_component_qty')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('bundle_component_available')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('bundle_component_needed')}</span>
              </div>
            </div>
            <div className="space-y-2">
              {(selectedBundle.bundleComponents ?? []).map((comp: BundleComponent) => {
                const available = getItemQuantityAtLocation(comp.itemId, locId);
                const qty = Number(assemblyQty) || 0;
                const needed = comp.quantity * qty;
                const isSufficient = available >= needed;
                return (
                  <div key={comp.itemId} className="flex items-center gap-3 px-3 py-2.5 terit-glass-sub rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white text-sm truncate">{comp.itemName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{comp.sku}</div>
                    </div>
                    <div className="text-right w-16 sm:w-24 shrink-0 text-sm tabular-nums">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{available}</span>
                    </div>
                    <div className={`text-right w-16 sm:w-24 shrink-0 text-sm tabular-nums ${isSufficient ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                      {needed}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity Input & Action */}
          <div className="terit-glass rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="relative w-full sm:w-48">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('bundle_quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={assemblyQty}
                  onChange={(e) => setAssemblyQty(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={operation === 'assemble' ? handleAssemble : handleDisassemble}
                  disabled={operation === 'assemble' ? !canAssemble() : !canDisassemble()}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-200 disabled:text-green-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{operation === 'assemble' ? t('bundle_assemble_btn') : t('bundle_disassemble_btn')}</span>
                </button>
              </div>
            </div>
            {((operation === 'assemble' && !canAssemble()) || (operation === 'disassemble' && !canDisassemble())) && selectedBundle && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {operation === 'assemble' ? validateAssembly().msg : validateDisassembly().msg}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
