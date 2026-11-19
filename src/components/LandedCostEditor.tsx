import React, { useState, useMemo } from 'react';
import {
  Truck,
  Tag,
  Save,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { POLineItem } from '../types/inventory';

type CostType = 'shipping' | 'customs_duty' | 'handling' | 'insurance' | 'other';

interface AllocationEntry {
  costType: CostType;
  description: string;
  amount: number;
  currency: string;
  allocatedTo: string[];
  shares: Record<string, number>;
}

export const LandedCostEditor: React.FC = () => {
  const { purchaseOrders, updatePurchaseOrder, t } = useInventory();
  // Preselect the first order that can still take costs (not received/cancelled).
  const [selectedPoId, setSelectedPoId] = useState<string | null>(
    () => purchaseOrders.find((p) => p.status === 'ordered' || p.status === 'draft')?.id ?? purchaseOrders[0]?.id ?? null
  );
  const [allocations, setAllocations] = useState<Record<string, AllocationEntry[]>>({});
  const [distributionMode, setDistributionMode] = useState<'even' | 'value' | 'qty'>('even');
  const [costType, setCostType] = useState<CostType>('shipping');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedPo = useMemo(
    () => purchaseOrders.find((p) => p.id === selectedPoId) ?? null,
    [purchaseOrders, selectedPoId]
  );

  const poAllocations = useMemo(
    () => allocations[selectedPoId ?? ''] ?? [],
    [allocations, selectedPoId]
  );

  const poLineItems = useMemo(() => selectedPo?.items ?? [], [selectedPo]);

  const grandTotalBase = useMemo(
    () => poLineItems.reduce((sum, line) => sum + line.totalCost, 0),
    [poLineItems]
  );

  const totalLandedAllocated = useMemo(
    () => poAllocations.reduce((sum, a) => sum + a.amount, 0),
    [poAllocations]
  );

  const grandTotal = grandTotalBase + totalLandedAllocated;

  const lineLandedCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of poLineItems) {
      map[line.itemId] = 0;
    }
    for (const alloc of poAllocations) {
      if (alloc.shares) {
        for (const [itemId, share] of Object.entries(alloc.shares)) {
          map[itemId] = (map[itemId] ?? 0) + share;
        }
      } else if (alloc.allocatedTo.length > 0) {
        const perItem = alloc.amount / alloc.allocatedTo.length;
        for (const itemId of alloc.allocatedTo) {
          map[itemId] = (map[itemId] ?? 0) + perItem;
        }
      }
    }
    return map;
  }, [poLineItems, poAllocations]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAllocate = async () => {
    if (!selectedPo) return;
    if (poAllocations.length === 0) {
      showMessage(t('landed_cost_add_first_error'), 'error');
      return;
    }
    const updatedLines: POLineItem[] = poLineItems.map((line) => {
      const landed = lineLandedCostMap[line.itemId] ?? 0;
      const safeQty = Math.max(1, line.quantity);
      return {
        ...line,
        landedCostAllocated: landed,
        landedUnitCost: line.unitCost + landed / safeQty,
      };
    });
    const ok = await updatePurchaseOrder(selectedPo.id, {
      items: updatedLines,
      totalLandedCost: totalLandedAllocated,
      grandTotal: grandTotalBase + totalLandedAllocated,
    });
    if (ok) {
      showMessage(t('landed_cost_allocated_success'), 'success');
    }
  };

  const addAllocation = (
    nextCostType: CostType,
    nextDescription: string,
    nextAmount: number,
    currency: string,
    allocatedTo: string[],
    shares: Record<string, number>
  ) => {
    if (!selectedPoId) return;
    setAllocations((prev) => ({
      ...prev,
      [selectedPoId]: [
        ...(prev[selectedPoId] ?? []),
        {
          costType: nextCostType,
          description: nextDescription,
          amount: nextAmount,
          currency,
          allocatedTo,
          shares,
        },
      ],
    }));
  };

  const removeAllocation = (index: number) => {
    if (!selectedPoId) return;
    setAllocations((prev) => {
      const list = [...(prev[selectedPoId] ?? [])];
      list.splice(index, 1);
      return { ...prev, [selectedPoId]: list };
    });
  };

  const handleAddCostLine = () => {
    if (!selectedPo || poLineItems.length === 0) return;
    const parsedAmount = Number(amountInput);
    if (!parsedAmount || parsedAmount <= 0) {
      showMessage(t('landed_cost_invalid_amount_error'), 'error');
      return;
    }

    const cleanDesc = description.trim() || t(`landed_cost_${costType}`);
    const eligibleLineIds = poLineItems.map((l) => l.itemId);
    const shares: Record<string, number> = {};

    if (distributionMode === 'value') {
      const totalValue = poLineItems.reduce((sum, l) => sum + l.totalCost, 0);
      if (totalValue > 0) {
        for (const line of poLineItems) {
          shares[line.itemId] = (line.totalCost / totalValue) * parsedAmount;
        }
      } else {
        const even = parsedAmount / poLineItems.length;
        for (const line of poLineItems) shares[line.itemId] = even;
      }
    } else if (distributionMode === 'qty') {
      const totalQty = poLineItems.reduce((sum, l) => sum + l.quantity, 0);
      if (totalQty > 0) {
        for (const line of poLineItems) {
          shares[line.itemId] = (line.quantity / totalQty) * parsedAmount;
        }
      } else {
        const even = parsedAmount / poLineItems.length;
        for (const line of poLineItems) shares[line.itemId] = even;
      }
    } else {
      const even = parsedAmount / poLineItems.length;
      for (const line of poLineItems) {
        shares[line.itemId] = even;
      }
    }

    addAllocation(costType, cleanDesc, parsedAmount, 'ETB', eligibleLineIds, shares);
    setDescription('');
    setAmountInput('');
    showMessage(t('landed_cost_line_added_success'), 'success');
  };

  const formatETB = (val: number) =>
    `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('landed_cost_title')}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {purchaseOrders.length} {t('nav_pos')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('landed_cost_subtitle')}
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg border flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* PO Selection */}
      <div className="terit-glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-md">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Tag className="w-4 h-4" />
            </div>
            <select
              value={selectedPoId ?? ''}
              onChange={(e) => setSelectedPoId(e.target.value || null)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm cursor-pointer"
            >
              <option value="">{t('landed_cost_po')}</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  #{po.poNumber} · {po.supplierName} · {formatETB(po.totalAmount)}
                </option>
              ))}
            </select>
          </div>
          {purchaseOrders.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('landed_cost_no_po')}</span>
          )}
        </div>
      </div>

      {!selectedPo ? (
        <div className="text-center py-16">
          <Truck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            {purchaseOrders.length === 0 ? t('landed_cost_no_po') : t('landed_cost_select_po')}
          </p>
        </div>
      ) : (
        <>
          {/* PO Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('po_number')}</p>
              <p className="font-bold text-slate-900 dark:text-white truncate">#{selectedPo.poNumber}</p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('supplier_name')}</p>
              <p className="font-bold text-slate-900 dark:text-white truncate">{selectedPo.supplierName}</p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('landed_cost_base_total')}</p>
              <p className="font-bold text-green-600 dark:text-green-400 tabular-nums">{formatETB(grandTotalBase)}</p>
            </div>
            <div className="min-w-0 terit-glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('landed_cost_grand_total')}</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg tabular-nums">{formatETB(grandTotal)}</p>
            </div>
          </div>

          {/* Add Cost Allocation */}
          <div className="terit-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">
                {t('landed_cost_allocate')}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {t('landed_cost_cost_type')}
                </label>
                <select
                  value={costType}
                  onChange={(e) => setCostType(e.target.value as CostType)}
                  className="w-full pl-3 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="shipping">{t('landed_cost_shipping')}</option>
                  <option value="customs_duty">{t('landed_cost_customs_duty')}</option>
                  <option value="handling">{t('landed_cost_handling')}</option>
                  <option value="insurance">{t('landed_cost_insurance')}</option>
                  <option value="other">{t('landed_cost_other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {t('landed_cost_description')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('landed_cost_desc_placeholder')}
                  className="w-full pl-3 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {t('landed_cost_amount')} (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-500 dark:text-slate-400">{t('landed_cost_allocated')}:</label>
              <div className="flex flex-wrap gap-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDistributionMode('even')}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    distributionMode === 'even'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-r border-amber-200 dark:border-amber-700'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('landed_cost_distribute_evenly')}
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMode('value')}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    distributionMode === 'value'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-r border-amber-200 dark:border-amber-700'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('landed_cost_distribute_by_value')}
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMode('qty')}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    distributionMode === 'qty'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('landed_cost_distribute_by_qty')}
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleAddCostLine}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('landed_cost_add_charge_btn')}</span>
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="terit-glass rounded-2xl p-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">
                {t('landed_cost_line_item')}
              </h3>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {t('landed_cost_total_landed')}: {formatETB(totalLandedAllocated)}
              </span>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[600px] text-sm divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_line_item')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_quantity')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_unit_cost')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_allocated')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_landed_unit')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('create_po_line_total_header')}</th>
                  </tr>
                </thead>
                <tbody>
                  {poLineItems.map((line) => {
                    const landed = lineLandedCostMap[line.itemId] ?? 0;
                    const landedUnit = line.unitCost + landed / Math.max(1, line.quantity);
                    const lineTotal = line.totalCost + landed;
                    return (
                      <tr key={line.itemId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{line.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">{line.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{line.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{formatETB(line.unitCost)}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{landed > 0 ? formatETB(landed) : '–'}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{formatETB(landedUnit)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white tabular-nums">{formatETB(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Allocations */}
          {poAllocations.length > 0 && (
            <div className="terit-glass rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">
                  {t('landed_cost_current_allocations')}
                </h3>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[540px] text-sm divide-y divide-slate-200 dark:divide-slate-800">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_cost_type')}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_description')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_amount')}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('landed_cost_allocated')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poAllocations.map((alloc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t(`landed_cost_${alloc.costType}`)}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white">{alloc.description}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatETB(alloc.amount)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                          {t('landed_cost_line_items_count').replace('{count}', String(alloc.allocatedTo.length))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeAllocation(idx)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                          >
                            {t('remove_btn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAllocate}
              disabled={poAllocations.length === 0}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-200 disabled:text-amber-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t('landed_cost_allocate')}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
