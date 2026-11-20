import React, { useState, useEffect, useMemo } from 'react';
import {
  Thermometer,
  ShieldAlert,
  Clock,
  Tag,
  Layers,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Warehouse,
  ShoppingBag,
  Store,
  Building,
  FileText,
  Printer,
  Calculator,
  Scale,
  Grid,
  TrendingDown,
  ShieldCheck,
  Zap,
  Building2,
  HardHat,
  Copy,
  Check,
  ArrowRightLeft,
  PackageCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';
import { useToast } from '../components/Toast';
import { TabButton } from './IndustryTools/TabButton';
import { StatCard } from './IndustryTools/StatCard';
import { SuccessBanner } from './IndustryTools/SuccessBanner';
import { fmt } from '../i18n/fmt';

interface IndustryToolsPanelProps {
  onOpenCreatePO: (supplierId?: string, itemId?: string) => void;
  onOpenQuickAdjust: (itemId?: string) => void;
  onOpenBarcode: (item: InventoryItem) => void;
}

export const IndustryToolsPanel: React.FC<IndustryToolsPanelProps> = ({
  onOpenCreatePO,
  onOpenQuickAdjust,
  onOpenBarcode,
}) => {
  const {
    items,
    warehouses,
    locations,
    purchaseOrders,
    receivePurchaseOrder,
    transferStock,
    businessType,
    companyProfile,
    quickAdjustStock,
    updateItem,
    t,
  } = useInventory();
  const { toast } = useToast();

  // Pharmacy State (quarantine persisted per browser)
  const [activePharmaTab, setActivePharmaTab] = useState<'expiry' | 'coldchain' | 'dosage'>('expiry');
  const [expiryDaysFilter, setExpiryDaysFilter] = useState<number>(90);
  const [quarantinedBatches, setQuarantinedBatches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('terit_pharma_quarantine');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tempLogSuccess, setTempLogSuccess] = useState<string | null>(() => {
    try {
      return localStorage.getItem('terit_pharma_coldchain_last') || null;
    } catch {
      return null;
    }
  });
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [dosageTablets, setDosageTablets] = useState<number>(30);
  const [dosagePerDay, setDosagePerDay] = useState<number>(3);
  const [dispenseNotice, setDispenseNotice] = useState<string | null>(null);

  // Supermarket State
  const [activeSupermarketTab, setActiveSupermarketTab] = useState<'freshness' | 'aisles' | 'shelftags'>('freshness');
  const [selectedShelfTagItem, setSelectedShelfTagItem] = useState<InventoryItem | null>(null);

  // Minimarket State
  const [activeMinimarketTab, setActiveMinimarketTab] = useState<'restock' | 'express'>('restock');
  const [expressCheckoutQty, setExpressCheckoutQty] = useState<number>(1);
  const [expressNotice, setExpressNotice] = useState<string | null>(null);

  // Store / Warehouse State
  const [activeStoreTab, setActiveStoreTab] = useState<'capacity' | 'dock' | 'moq'>('capacity');
  const [selectedMoqItemId, setSelectedMoqItemId] = useState<string>('');
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);

  // Shop / Boutique State
  const [activeShopTab, setActiveShopTab] = useState<'sizes' | 'markdown'>('sizes');
  const [clearanceDiscount, setClearanceDiscount] = useState<number>(25);

  // Building Materials State
  const [activeBuildingTab, setActiveBuildingTab] = useState<'rebar' | 'dispatch' | 'moisture'>('rebar');
  const [rebarDiameter, setRebarDiameter] = useState<number>(12);
  const [rebarMode, setRebarMode] = useState<'pieces' | 'tonnage'>('pieces');
  const [rebarInputVal, setRebarInputVal] = useState<number>(85);
  const [rebarRatePerBar, setRebarRatePerBar] = useState<number>(980);
  const [rebarDeductSuccess, setRebarDeductSuccess] = useState<string | null>(null);

  // Building Dispatch Note State
  const [dispatchTruck, setDispatchTruck] = useState<'sino' | 'isuzu' | 'pickup'>('isuzu');
  const [dispatchSite, setDispatchSite] = useState<string>('');
  const [dispatchClient, setDispatchClient] = useState<string>('');
  const [dispatchDriver, setDispatchDriver] = useState<string>('');
  const [dispatchPlate, setDispatchPlate] = useState<string>('');
  const [dispatchCementQty, setDispatchCementQty] = useState<number>(150);
  const [dispatchBlockQty, setDispatchBlockQty] = useState<number>(400);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [showDispatchPass, setShowDispatchPass] = useState<boolean>(false);
  const [copiedPass, setCopiedPass] = useState<boolean>(false);

  // Moisture sentinel state
  const [cementBagDays, setCementBagDays] = useState<number>(24);
  const [palletHeightBags, setPalletHeightBags] = useState<number>(8);
  const [moistureCoverChecked, setMoistureCoverChecked] = useState<boolean>(true);

  // General Commercial ("other") State
  const [activeOtherTab, setActiveOtherTab] = useState<'transfer' | 'landed'>('transfer');
  const [transferItemId, setTransferItemId] = useState<string>('');
  const [transferDestLocId, setTransferDestLocId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  const [landedFactoryETB, setLandedFactoryETB] = useState<number>(520);
  const [landedFreightETB, setLandedFreightETB] = useState<number>(3600);
  const [landedCustomsETB, setLandedCustomsETB] = useState<number>(2400);
  const [landedQty, setLandedQty] = useState<number>(40);
  const [landedMarginPct, setLandedMarginPct] = useState<number>(28);

  // Sync default item selectors whenever inventory changes
  useEffect(() => {
    if (items.length === 0) return;
    if (!selectedMedId || !items.some((i) => i.id === selectedMedId)) {
      setSelectedMedId(items[0].id);
    }
    if (!selectedMoqItemId || !items.some((i) => i.id === selectedMoqItemId)) {
      setSelectedMoqItemId(items[0].id);
    }
    if (!transferItemId || !items.some((i) => i.id === transferItemId)) {
      setTransferItemId(items[0].id);
    }
    if (!selectedShelfTagItem || !items.some((i) => i.id === selectedShelfTagItem.id)) {
      setSelectedShelfTagItem(items[0]);
    }
  }, [items, businessType]);

  useEffect(() => {
    const destCandidates = locations.length > 0 ? locations : warehouses;
    if (destCandidates.length > 0 && (!transferDestLocId || !destCandidates.some((l) => l.id === transferDestLocId))) {
      setTransferDestLocId(destCandidates[destCandidates.length - 1].id);
    }
  }, [locations, warehouses]);

  // Persist pharma quarantine batches
  useEffect(() => {
    try {
      localStorage.setItem('terit_pharma_quarantine', JSON.stringify(quarantinedBatches));
    } catch {
      // ignore storage quota
    }
  }, [quarantinedBatches]);

  // Rebar math calculations
  const weightPer12mBar = Number(((2 * rebarDiameter * rebarDiameter) / 27).toFixed(2));
  const barsPerTon = Number((1000 / weightPer12mBar).toFixed(1));
  const totalRebarBars =
    rebarMode === 'pieces'
      ? Math.max(1, rebarInputVal)
      : Math.max(1, Math.round((Math.max(0.01, rebarInputVal) * 1000) / weightPer12mBar));
  const totalRebarWeightKg = Number((totalRebarBars * weightPer12mBar).toFixed(1));
  const totalRebarTons = Number((totalRebarWeightKg / 1000).toFixed(3));
  const totalRebarQuintals = Number((totalRebarWeightKg / 100).toFixed(1));
  const estimatedRebarCost = totalRebarBars * rebarRatePerBar;
  const scrapLossKg = Number((totalRebarWeightKg * 0.04).toFixed(1));
  const tyingWireKg = Number((totalRebarTons * 12).toFixed(1));

  // Dispatch Payload Math
  const truckPayloadLimits = {
    sino: 35000,
    isuzu: 11000,
    pickup: 3000,
  };
  const totalPayloadWeightKg = dispatchCementQty * 50 + dispatchBlockQty * 18;
  const maxAllowedKg = truckPayloadLimits[dispatchTruck];
  const isPayloadOverweight = totalPayloadWeightKg > maxAllowedKg;
  const recommendedBreakageBlocks = Math.round(dispatchBlockQty * 0.03);

  // Dispatch deduction handler
  const handleDispatchDeduct = async () => {
    const cementItem = items.find(
      (i) => i.name.toLowerCase().includes('cement') || i.category.toLowerCase().includes('cement')
    );
    const blockItem = items.find(
      (i) => i.name.toLowerCase().includes('block') || i.category.toLowerCase().includes('block')
    );

    const siteLabel = dispatchSite.trim() || t('site_delivery_default');
    const plateSuffix = dispatchPlate.trim() ? ` (${dispatchPlate.trim()})` : '';

    if (cementItem && dispatchCementQty > 0) {
      await quickAdjustStock(
        cementItem.id,
        -dispatchCementQty,
        `Site Dispatch: ${siteLabel}${plateSuffix}`,
        `PASS-${Math.floor(1000 + Math.random() * 9000)}`
      );
    }

    if (blockItem && dispatchBlockQty > 0) {
      await quickAdjustStock(
        blockItem.id,
        -dispatchBlockQty,
        `Site Dispatch: ${siteLabel}${plateSuffix}`,
        `PASS-${Math.floor(1000 + Math.random() * 9000)}`
      );
    }

    setDispatchSuccess(
      `${t('dispatch_deduct_success_prefix')} ${siteLabel}.`
    );
    setTimeout(() => setDispatchSuccess(null), 4500);
  };

  // Rebar stock deduction
  const handleDeductRebar = async () => {
    const rebarItem = items.find(
      (i) =>
        i.name.toLowerCase().includes('rebar') ||
        i.name.toLowerCase().includes('steel') ||
        i.sku.includes('STEEL')
    );
    if (rebarItem) {
      await quickAdjustStock(
        rebarItem.id,
        -totalRebarBars,
        `Rebar cutting list deduction (${rebarDiameter}mm x ${totalRebarBars} bars)`,
        `REBAR-${Math.floor(1000 + Math.random() * 9000)}`
      );
      setRebarDeductSuccess(
        `Deducted ${totalRebarBars} bars (${totalRebarWeightKg} kg) of ${rebarDiameter}mm rebar from yard stock!`
      );
      setTimeout(() => setRebarDeductSuccess(null), 4000);
    } else {
      onOpenQuickAdjust();
    }
  };

  // Pharmacy calculations
  const itemsWithExpiry = items.filter((i) => Boolean(i.expiryDate));
  const filteredExpiryItems = itemsWithExpiry.filter((i) => {
    if (!i.expiryDate) return false;
    const expiry = new Date(i.expiryDate).getTime();
    const now = Date.now();
    const daysLeft = (expiry - now) / (1000 * 3600 * 24);
    return daysLeft <= expiryDaysFilter;
  });

  const coldChainItems = items.filter((i) => {
    const text = `${i.name} ${i.category} ${i.description || ''} ${i.location || ''}`.toLowerCase();
    return (
      text.includes('insulin') ||
      text.includes('vaccine') ||
      text.includes('cold') ||
      text.includes('fridge') ||
      text.includes('2-8') ||
      text.includes('2–8')
    );
  });

  const selectedMed = items.find((i) => i.id === selectedMedId) || items[0];
  const stripsRequested = Math.max(1, Math.ceil(dosageTablets / 10));
  const boxesRequested = Math.max(1, Math.ceil(dosageTablets / 100));
  const estimatedRxTotalETB = selectedMed
    ? selectedMed.unitOfMeasure.toLowerCase().includes('box')
      ? Math.round((dosageTablets / 100) * selectedMed.unitPrice)
      : Math.round(stripsRequested * selectedMed.unitPrice)
    : 0;

  const handleToggleQuarantine = (batch: string) => {
    const nextQuarantined = !quarantinedBatches.includes(batch);
    if (nextQuarantined) {
      setQuarantinedBatches((prev) => [...prev, batch]);
    } else {
      setQuarantinedBatches((prev) => prev.filter((b) => b !== batch));
    }
    // Persist on the item itself so the dispensing guard in QuickAdjustModal
    // (which checks item.isQuarantined) actually blocks stock-out of this batch.
    for (const item of items) {
      if (item.batchNumber === batch) {
        void updateItem(item.id, { isQuarantined: nextQuarantined }).catch(() => {});
      }
    }
  };

  const handleLogColdChain = () => {
    const msg = `Logged at ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} · All fridges verified within WHO 2°C–8°C compliance.`;
    setTempLogSuccess(msg);
    try {
      localStorage.setItem('terit_pharma_coldchain_last', msg);
    } catch {
      // ignore
    }
  };

  const handleDispenseMedication = async () => {
    if (!selectedMed) return;
    const deductUnits = selectedMed.unitOfMeasure.toLowerCase().includes('box') ? boxesRequested : stripsRequested;
    if (selectedMed.quantity < deductUnits) {
      toast(
        `Insufficient stock for ${selectedMed.name}: need ${deductUnits} ${selectedMed.unitOfMeasure}, have ${selectedMed.quantity}.`,
        'error'
      );
      return;
    }
    const ok = await quickAdjustStock(
      selectedMed.id,
      -deductUnits,
      `Rx Dispensed: ${dosageTablets} tabs (${Math.floor(dosageTablets / dosagePerDay)}d supply)`,
      `RX-${Math.floor(1000 + Math.random() * 9000)}`
    );
    if (ok) {
      setDispenseNotice(
        `Dispensed ${deductUnits} ${selectedMed.unitOfMeasure} of ${selectedMed.name} (${estimatedRxTotalETB.toLocaleString()} ETB).`
      );
      setTimeout(() => setDispenseNotice(null), 4000);
    }
  };

  // Supermarket Department Aggregation (real live categories)
  const supermarketDepartments = useMemo(() => {
    const map: Record<
      string,
      { name: string; location: string; count: number; totalUnits: number; valueETB: number; needsRestock: boolean; firstItem?: InventoryItem }
    > = {};
    items.forEach((item) => {
      const key = item.category || 'General Grocery';
      if (!map[key]) {
        map[key] = {
          name: key,
          location: item.location || 'Main Floor',
          count: 0,
          totalUnits: 0,
          valueETB: 0,
          needsRestock: false,
          firstItem: item,
        };
      }
      map[key].count += 1;
      map[key].totalUnits += item.quantity;
      map[key].valueETB += item.quantity * item.unitPrice;
      if (item.quantity <= item.minStockAlert) {
        map[key].needsRestock = true;
        map[key].firstItem = item;
      }
    });
    return Object.values(map);
  }, [items]);

  // Minimarket Express Sale
  const handleExpressSale = async (item: InventoryItem) => {
    if (item.quantity < expressCheckoutQty) {
      toast(fmt(t('stock_insufficient_only'), [item.quantity, item.unitOfMeasure]), 'error');
      return;
    }
    const saleTotal = item.unitPrice * expressCheckoutQty;
    const success = await quickAdjustStock(
      item.id,
      -expressCheckoutQty,
      `Express counter sale (${expressCheckoutQty}x · ${saleTotal.toLocaleString()} ETB)`,
      'RECEIPT-' + Math.floor(1000 + Math.random() * 9000)
    );
    if (success) {
      setExpressNotice(
        `Sold ${expressCheckoutQty}x ${item.name} — ${saleTotal.toLocaleString()} ETB. Stock updated!`
      );
      setTimeout(() => setExpressNotice(null), 3500);
    }
  };

  const handleQuickRestock = async (item: InventoryItem, delta: number) => {
    await quickAdjustStock(
      item.id,
      delta,
      `Daily fast replenishment (+${delta})`,
      'RESTOCK-' + Math.floor(1000 + Math.random() * 9000)
    );
  };

  // Shop / Boutique live clearance math
  const clearanceCandidates = items.filter(
    (i) => i.quantity > 0 && (i.quantity >= i.minStockAlert * 2 || i.status === 'low_stock')
  );
  const clearanceLiquidity = clearanceCandidates.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice * (1 - clearanceDiscount / 100),
    0
  );
  const clearanceUnits = clearanceCandidates.reduce((sum, i) => sum + i.quantity, 0);

  // Store / Wholesale capacity & PO metrics
  const totalDepotUnits = items.reduce((s, i) => s + i.quantity, 0);
  const totalDepotCapacity = Math.max(
    1,
    warehouses.reduce((s, w) => s + (w.capacity || 2000), 0)
  );
  const depotUtilizationPct = Math.min(100, (totalDepotUnits / totalDepotCapacity) * 100);
  const totalDepotCostETB = items.reduce((s, i) => s + i.quantity * i.costPrice, 0);
  const inboundOrderedPOs = purchaseOrders.filter((p) => p.status === 'ordered');
  const selectedMoqItem = items.find((i) => i.id === selectedMoqItemId) || items[0];

  const handleDockReceivePO = async (poId: string) => {
    setReceivingPoId(poId);
    try {
      await receivePurchaseOrder(poId);
    } finally {
      setReceivingPoId(null);
    }
  };

  // General Commercial Transfer & Landed Cost
  const transferItem = items.find((i) => i.id === transferItemId) || items[0];
  const allLocations = locations.length > 0 ? locations : warehouses;
  const handleBranchTransfer = async () => {
    if (!transferItem || !transferDestLocId) return;
    const sourceLoc =
      allLocations.find((l) => l.name === transferItem.location || l.id === transferItem.locationId) ||
      allLocations[0];
    const destLoc = allLocations.find((l) => l.id === transferDestLocId);
    if (!sourceLoc || !destLoc) return;
    if (sourceLoc.id === destLoc.id) {
      toast(t('industry_tools_select_different_destination_branch_or'), 'error');
      return;
    }
    const ok = await transferStock(
      transferItem.id,
      sourceLoc.id,
      destLoc.id,
      Math.max(1, transferQty),
      `Inter-branch stock requisition (${sourceLoc.name} -> ${destLoc.name})`
    );
    if (ok) {
      setTransferNotice(
        `Transferred ${transferQty} ${transferItem.unitOfMeasure} of ${transferItem.name} from ${sourceLoc.name} to ${destLoc.name}.`
      );
      setTimeout(() => setTransferNotice(null), 4000);
    }
  };

  const safeLandedQty = Math.max(1, landedQty);
  const unitOverheadETB = (landedFreightETB + landedCustomsETB) / safeLandedQty;
  const trueLandedUnitETB = landedFactoryETB + unitOverheadETB;
  const suggestedRetailETB = trueLandedUnitETB / Math.max(0.05, 1 - landedMarginPct / 100);

  return (
    <div className="terit-glass rounded-3xl p-5 sm:p-6 transition-all space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/10 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            {businessType === 'pharmacy' && (
              <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />
              </svg>
            )}
            {businessType === 'supermarket' && <ShoppingCart className="w-5 h-5 text-emerald-500" />}
            {businessType === 'minimarket' && <Store className="w-5 h-5 text-amber-500" />}
            {businessType === 'store' && <Warehouse className="w-5 h-5 text-blue-500" />}
            {businessType === 'shop' && <ShoppingBag className="w-5 h-5 text-purple-500" />}
            {businessType === 'building' && <Building2 className="w-5 h-5 text-amber-500" />}
            {businessType === 'other' && <Building className="w-5 h-5 text-indigo-500" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {businessType === 'pharmacy' && t('biz_panel_pharma')}
                {businessType === 'supermarket' && t('biz_panel_supermarket')}
                {businessType === 'minimarket' && t('biz_panel_minimarket')}
                {businessType === 'store' && t('biz_panel_store')}
                {businessType === 'shop' && t('biz_panel_shop')}
                {businessType === 'building' && t('biz_panel_building')}
                {businessType === 'other' && t('biz_panel_other')}
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                {t('custom_toolset_badge')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t('industry_tools_desc')}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 self-start sm:self-center font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('industry_profile_active')}</span>
        </div>
      </div>

      {/* 1. PHARMACY SPECIFIC TOOLS */}
      {businessType === 'pharmacy' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activePharmaTab === 'expiry'}
              onClick={() => setActivePharmaTab('expiry')}
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
              label={`${t('tab_expiry_quarantine')} (${filteredExpiryItems.length})`}
            />
            <TabButton
              active={activePharmaTab === 'coldchain'}
              onClick={() => setActivePharmaTab('coldchain')}
              icon={<Thermometer className="w-3.5 h-3.5" />}
              label={`${t('tab_cold_chain')} (${coldChainItems.length})`}
            />
            <TabButton
              active={activePharmaTab === 'dosage'}
              onClick={() => setActivePharmaTab('dosage')}
              icon={<Calculator className="w-3.5 h-3.5" />}
              label={t('tab_dosage_calc')}
            />
          </div>

          {/* Expiry Sentinel Tab */}
          {activePharmaTab === 'expiry' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('industry_tools_filter_expiry_window')}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[30, 60, 90, 180].map((days) => (
                      <button
                        key={days}
                        onClick={() => setExpiryDaysFilter(days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          expiryDaysFilter === days
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                        }`}
                      >{fmt(t('industry_tools_days'), [days])}</button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {quarantinedBatches.length > 0 && (
                    <span className="text-rose-700 dark:text-rose-400 font-bold">
                      {fmt(t('industry_tools_batch_es_quarantined'), [quarantinedBatches.length])}</span>
                  )}
                </div>
              </div>

              {filteredExpiryItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 dark:text-slate-400">{fmt(t('industry_tools_no_medication_batches_expiring_within'), [expiryDaysFilter])}</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {filteredExpiryItems.map((item) => {
                    const expiry = new Date(item.expiryDate!).getTime();
                    const daysRemaining = Math.max(0, Math.round((expiry - Date.now()) / (1000 * 3600 * 24)));
                    const isQuarantined = item.batchNumber && quarantinedBatches.includes(item.batchNumber);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                          isQuarantined
                            ? 'bg-rose-500/10'
                            : daysRemaining <= 30
                            ? 'bg-rose-50 dark:bg-rose-950/20'
                            : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.sku}
                            </span>
                            {isQuarantined && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">{t('industry_tools_quarantined')}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                            <span>{fmt(t('industry_tools_batch'), [item.batchNumber || 'N/A'])}</span>
                            <span>·</span>
                            <span>{fmt(t('industry_tools_exp'), [item.expiryDate])}</span>
                            <span>·</span>
                            <span className={daysRemaining <= 30 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                              {fmt(t('industry_tools_days_left'), [daysRemaining])}</span>
                            <span>·</span>
                            <span>{fmt(t('industry_tools_qty'), [item.quantity, item.unitOfMeasure])}</span>
                            <span>·</span>
                            <span>{fmt(t('industry_tools_risk_value_etb'), [(item.quantity * item.costPrice).toLocaleString()])}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {item.batchNumber && (
                            <button
                              onClick={() => handleToggleQuarantine(item.batchNumber!)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isQuarantined
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300'
                                  : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {isQuarantined ? t('industry_tools_release_quarantine') : t('industry_tools_quarantine_batch')}
                            </button>
                          )}
                          <button
                            onClick={() => onOpenCreatePO(item.supplierId, item.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                          >{t('industry_tools_emergency_restock')}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cold Chain Tab */}
          {activePharmaTab === 'coldchain' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  title={t('industry_tools_vaccine_fridge')}
                  value="3.4°C"
                  subtitle="Standard: 2°C – 8°C (Optimal)"
                  valueColor="emerald"
                />
                <StatCard
                  title={t('industry_tools_insulin_refrigerator')}
                  value="4.2°C"
                  subtitle="Standard: 2°C – 8°C (Optimal)"
                  valueColor="emerald"
                />
                <StatCard
                  title={t('industry_tools_monitored_cold_chain_skus')}
                  value={`${coldChainItems.length} SKUs`}
                  subtitle={`${coldChainItems.reduce((s, i) => s + i.quantity, 0)} units in 2–8°C control`}
                />
              </div>

              {coldChainItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coldChainItems.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl terit-glass-sub flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                          {fmt(t('industry_tools_batch_exp'), [item.location, item.batchNumber || 'N/A', item.expiryDate || 'N/A'])}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity} {item.unitOfMeasure}
                        </div>
                        <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                          {fmt(t('barcode_etb'), [(item.quantity * item.unitPrice).toLocaleString()])}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tempLogSuccess && <SuccessBanner message={tempLogSuccess} />}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">{t('industry_tools_meets_ethiopian_efda_who_good')}</span>
                <button
                  onClick={handleLogColdChain}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Thermometer className="w-4 h-4" />
                  <span>{t('industry_tools_log_temperature_inspection')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Dosage & Dispensing Calculator Tab */}
          {activePharmaTab === 'dosage' && (
            <div className="p-4 rounded-2xl terit-glass-sub space-y-4">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>{t('industry_tools_patient_rx_dispensing_strip_converter')}</span>
              </h4>

              {dispenseNotice && <SuccessBanner message={dispenseNotice} />}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_medication_sku_from_dispensary')}</label>
                  <select
                    value={selectedMed?.id || ''}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} {item.unitOfMeasure})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_total_tablets_capsules_prescribed')}</label>
                  <input
                    type="number"
                    min="1"
                    value={dosageTablets}
                    onChange={(e) => setDosageTablets(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_daily_dosage_frequency_doses_day')}</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={dosagePerDay}
                    onChange={(e) => setDosagePerDay(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_patient_course_duration')}</div>
                  <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                    {fmt(t('industry_tools_days_2'), [Math.floor(dosageTablets / dosagePerDay)])}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{fmt(t('industry_tools_months'), [(dosageTablets / dosagePerDay / 30).toFixed(1)])}</div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_packaging_allocation')}</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {fmt(t('industry_tools_strips'), [stripsRequested])}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{fmt(t('industry_tools_or_hospital_box_es_100s'), [boxesRequested])}</div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_estimated_rx_retail_total')}</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {fmt(t('barcode_etb'), [estimatedRxTotalETB.toLocaleString()])}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{fmt(t('industry_tools_stock'), [selectedMed?.quantity ?? 0, selectedMed?.unitOfMeasure || 'units'])}
                  </div>
                </div>
              </div>

              {selectedMed && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDispenseMedication}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >{t('industry_tools_dispense_deduct_stock')}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. SUPERMARKET SPECIFIC TOOLS */}
      {businessType === 'supermarket' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeSupermarketTab === 'freshness'}
              onClick={() => setActiveSupermarketTab('freshness')}
              icon={<Clock className="w-3.5 h-3.5" />}
              label={t('tab_freshness')}
            />
            <TabButton
              active={activeSupermarketTab === 'aisles'}
              onClick={() => setActiveSupermarketTab('aisles')}
              icon={<Grid className="w-3.5 h-3.5" />}
              label={`Department Aisle Restock (${supermarketDepartments.length})`}
            />
            <TabButton
              active={activeSupermarketTab === 'shelftags'}
              onClick={() => setActiveSupermarketTab('shelftags')}
              icon={<Tag className="w-3.5 h-3.5" />}
              label={t('tab_shelf_tags')}
            />
          </div>

          {/* Freshness Watchlist */}
          {activeSupermarketTab === 'freshness' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('industry_tools_daily_produce_dairy_bakery_freshness')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl terit-glass-sub flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold shrink-0">
                          {fmt(t('barcode_etb'), [item.unitPrice.toLocaleString()])}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">{fmt(t('industry_tools_aisle'), [item.location || 'Main Floor'])}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">{t('industry_tools_current_stock')}{' '}<strong className="text-slate-900 dark:text-white">{item.quantity} {item.unitOfMeasure}</strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => onOpenQuickAdjust(item.id)}
                        className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-amber-700 font-semibold cursor-pointer"
                      >{t('industry_tools_adjust_stock')}</button>
                      <button
                        onClick={() => {
                          const discounted = (item.unitPrice * 0.75).toFixed(2);
                          toast(
                            `Evening Markdown: Promo sticker set for ${item.name} at 25% OFF (${discounted} ETB).`,
                            'success'
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30 cursor-pointer"
                      >{t('industry_tools_25_markdown_etb')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Aisles Tab (Live aggregated from inventory) */}
          {activeSupermarketTab === 'aisles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {supermarketDepartments.map((dept, i) => (
                <div key={i} className="p-4 rounded-2xl terit-glass-sub space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{dept.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                          dept.needsRestock
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {dept.needsRestock ? t('industry_tools_needs_restock') : t('industry_tools_stocked')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">{dept.location}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                      <span>{fmt(t('industry_tools_skus_units'), [dept.count, dept.totalUnits.toLocaleString()])}</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {fmt(t('barcode_etb'), [Math.round(dept.valueETB).toLocaleString()])}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenCreatePO(dept.firstItem?.supplierId, dept.firstItem?.id)}
                    className="w-full mt-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >{t('industry_tools_generate_dept_po')}</button>
                </div>
              ))}
            </div>
          )}

          {/* Shelf Tags Tab */}
          {activeSupermarketTab === 'shelftags' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-700 dark:text-slate-300">{t('industry_tools_select_an_item_to_generate')}</span>
                <span className="text-xs font-mono text-slate-500 whitespace-nowrap">{t('industry_tools_standard_25_shelf_talker')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-950/60">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedShelfTagItem(item)}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                        selectedShelfTagItem?.id === item.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{item.name}</div>
                        <div className="text-[10px] opacity-75 font-mono">{item.sku}</div>
                      </div>
                      <div className="font-mono font-bold shrink-0">{fmt(t('barcode_etb'), [item.unitPrice.toLocaleString()])}</div>
                    </div>
                  ))}
                </div>

                {selectedShelfTagItem ? (
                  <div className="p-5 rounded-2xl bg-white text-slate-950 border-2 border-dashed border-amber-500 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{companyProfile?.companyName || t('app_name')}</span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedShelfTagItem.location}</span>
                      </div>
                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {selectedShelfTagItem.name}
                      </h3>
                      <div className="text-[10px] text-slate-500 mt-0.5">{selectedShelfTagItem.category}</div>
                    </div>

                    <div className="my-4 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">{t('unit_price')}</div>
                        <div className="text-3xl font-black font-mono tracking-tight text-slate-950">
                          {selectedShelfTagItem.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-base font-bold">{t('currency_etb')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">{t('industry_tools_unit_measure')}</div>
                        <div className="text-xs font-mono font-bold uppercase">{fmt(t('industry_tools_per'), [selectedShelfTagItem.unitOfMeasure])}</div>
                      </div>
                    </div>

                    <div className="border-t pt-2 flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span>{fmt(t('industry_tools_sku'), [selectedShelfTagItem.sku])}</span>
                      <span>{selectedShelfTagItem.barcode}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenBarcode(selectedShelfTagItem)}
                        className="py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                      >{t('industry_tools_generate_qr_sticker')}</button>
                      <button
                        onClick={() => window.print()}
                        className="py-2 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t('industry_tools_print_tag')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex items-center justify-center">{t('industry_tools_select_any_item_from_the')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MINIMARKET SPECIFIC TOOLS */}
      {businessType === 'minimarket' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeMinimarketTab === 'restock'}
              onClick={() => setActiveMinimarketTab('restock')}
              icon={<Zap className="w-3.5 h-3.5" />}
              label={t('tab_fast_restock')}
            />
            <TabButton
              active={activeMinimarketTab === 'express'}
              onClick={() => setActiveMinimarketTab('express')}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              label={t('tab_express_counter')}
            />
          </div>

          {/* Morning Restock */}
          {activeMinimarketTab === 'restock' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">{t('industry_tools_tap_quick_replenish_buttons_for')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.slice(0, 6).map((item) => {
                  const marginPct =
                    item.unitPrice > 0 ? Math.round(((item.unitPrice - item.costPrice) / item.unitPrice) * 100) : 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl terit-glass-sub flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0 font-bold">
                            +{marginPct}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                            {item.quantity}{' '}
                            <span className="text-xs font-normal text-slate-500">{item.unitOfMeasure}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                            {fmt(t('barcode_etb'), [item.unitPrice.toLocaleString()])}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickRestock(item, 5)}
                          className="flex-1 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 font-mono font-bold text-xs transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickRestock(item, 10)}
                          className="flex-1 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 font-mono font-bold text-xs transition-colors cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickRestock(item, 25)}
                          className="flex-1 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 font-mono font-bold text-xs transition-colors cursor-pointer"
                        >
                          +25
                        </button>
                        {item.quantity <= item.minStockAlert && (
                          <button
                            onClick={() => onOpenCreatePO(item.supplierId, item.id)}
                            className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] cursor-pointer"
                          >
                            PO
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Express Checkout */}
          {activeMinimarketTab === 'express' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t('industry_tools_express_counter_register_tap_an')}</span>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <span className="text-slate-600 dark:text-slate-400">{t('industry_tools_qty_2')}</span>
                  {[1, 2, 5, 10].map((q) => (
                    <button
                      key={q}
                      onClick={() => setExpressCheckoutQty(q)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer ${
                        expressCheckoutQty === q
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {q}x
                    </button>
                  ))}
                </div>
              </div>

              {expressNotice && <SuccessBanner message={expressNotice} />}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleExpressSale(item)}
                    disabled={item.quantity <= 0}
                    className="p-3 rounded-2xl terit-glass-sub hover:border-amber-500 dark:hover:border-amber-500 text-left transition-all hover:scale-[1.02] shadow-xs disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono font-extrabold text-xs text-amber-700 dark:text-amber-400">
                        {fmt(t('barcode_etb'), [item.unitPrice.toLocaleString()])}</span>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                        {fmt(t('industry_tools_left'), [item.quantity])}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. WHOLESALE STORE / DEPOT */}
      {businessType === 'store' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeStoreTab === 'capacity'}
              onClick={() => setActiveStoreTab('capacity')}
              icon={<Warehouse className="w-3.5 h-3.5" />}
              label={t('tab_depot_capacity')}
            />
            <TabButton
              active={activeStoreTab === 'dock'}
              onClick={() => setActiveStoreTab('dock')}
              icon={<Truck className="w-3.5 h-3.5" />}
              label={`${t('tab_dock_receiving')} (${inboundOrderedPOs.length})`}
            />
            <TabButton
              active={activeStoreTab === 'moq'}
              onClick={() => setActiveStoreTab('moq')}
              icon={<Scale className="w-3.5 h-3.5" />}
              label={t('industry_tools_moq_bulk_tier_pricing_etb')}
            />
          </div>

          {/* Live Capacity Tab */}
          {activeStoreTab === 'capacity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title={t('industry_tools_live_depot_stock_load')}
                  value={`${totalDepotUnits.toLocaleString()} / ${totalDepotCapacity.toLocaleString()}`}
                  subtitle={`${depotUtilizationPct.toFixed(1)}% capacity occupied across ${warehouses.length} hubs`}
                  valueColor="amber"
                />
                <StatCard
                  title={t('industry_tools_wholesale_capital_tied_in_stock')}
                  value={`${Math.round(totalDepotCostETB).toLocaleString()} ETB`}
                  subtitle="Cost basis across all depots"
                  valueColor="blue"
                />
                <StatCard
                  title={t('industry_tools_pending_inbound_freight_pos')}
                  value={`${inboundOrderedPOs.length} Shipments`}
                  subtitle={inboundOrderedPOs[0]?.expectedDate ? `Next ETA: ${inboundOrderedPOs[0].expectedDate}` : t('industry_tools_no_delayed_shipments')}
                  valueColor="emerald"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {warehouses.map((wh) => {
                  const whUnits = items
                    .filter((i) => i.location === wh.name || i.locationId === wh.id)
                    .reduce((s, i) => s + i.quantity, 0);
                  const whCap = wh.capacity || 2000;
                  const pct = Math.min(100, (whUnits / whCap) * 100);
                  return (
                    <div key={wh.id} className="p-3.5 rounded-2xl terit-glass-sub space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{wh.name}</span>
                        <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 85 ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {fmt(t('industry_tools_units'), [whUnits.toLocaleString(), whCap.toLocaleString(), wh.code])}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Dock Receiving Scheduler linked to real Ordered Purchase Orders */}
          {activeStoreTab === 'dock' && (
            <div className="space-y-3">
              {inboundOrderedPOs.length === 0 ? (
                <div className="p-6 rounded-2xl terit-glass-sub text-center space-y-2 text-xs">
                  <PackageCheck className="w-7 h-7 text-emerald-500 mx-auto" />
                  <div className="font-bold text-slate-900 dark:text-white">{t('industry_tools_all_inbound_shipments_received')}</div>
                  <p className="text-slate-600 dark:text-slate-400">{t('industry_tools_no_pending_ordered_freight_deliveries')}</p>
                  <button
                    onClick={() => onOpenCreatePO()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >{t('industry_tools_create_inbound_po')}</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                  {inboundOrderedPOs.map((po, idx) => (
                    <div
                      key={po.id}
                      className="p-4 bg-white dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{fmt(t('industry_tools_dock_bay'), [idx + 1, po.poNumber])}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{po.supplierName}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                          {po.items.map((li) => `${li.name} (${li.quantity})`).join(' · ')}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300">{t('industry_tools_total')}{' '}<strong>{fmt(t('barcode_etb'), [po.totalAmount.toLocaleString()])}</strong>{' '}{t('industry_tools_expected')}{' '}
                          {po.expectedDate || 'Today'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDockReceivePO(po.id)}
                        disabled={receivingPoId === po.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        {receivingPoId === po.id ? t('industry_tools_posting_to_ledger') : t('industry_tools_receive_delivery_to_dock')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live MOQ Pricing Calculator */}
          {activeStoreTab === 'moq' && (
            <div className="p-4 rounded-2xl terit-glass-sub space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('industry_tools_wholesale_quantity_tier_rebate_calculator')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{t('industry_tools_calculate_live_b2b_distributor_contract')}</p>
                </div>
                {items.length > 0 && (
                  <select
                    value={selectedMoqItem?.id || ''}
                    onChange={(e) => setSelectedMoqItemId(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {fmt(t('industry_tools_etb'), [it.name, it.unitPrice.toLocaleString()])}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedMoqItem && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">{t('industry_tools_tier_standard_wholesale')}</div>
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                      {fmt(t('industry_tools_etb_2'), [selectedMoqItem.unitPrice.toLocaleString(), selectedMoqItem.unitOfMeasure])}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{fmt(t('industry_tools_unit_order_etb_off'), [(selectedMoqItem.unitPrice * 5).toLocaleString()])}</div>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/50 space-y-1">
                    <div className="font-bold text-amber-700 dark:text-amber-400">{t('industry_tools_tier_half_truckload_10_24')}</div>
                    <div className="text-lg font-mono font-bold text-amber-700 dark:text-amber-400">
                      {fmt(t('industry_tools_etb_2'), [Math.round(selectedMoqItem.unitPrice * 0.92).toLocaleString(), selectedMoqItem.unitOfMeasure])}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{fmt(t('industry_tools_10_unit_contract_etb_off'), [Math.round(selectedMoqItem.unitPrice * 0.92 * 10).toLocaleString()])}</div>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700/50 space-y-1">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{t('industry_tools_tier_full_container_25')}</div>
                    <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {fmt(t('industry_tools_etb_2'), [Math.round(selectedMoqItem.unitPrice * 0.82).toLocaleString(), selectedMoqItem.unitOfMeasure])}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{fmt(t('industry_tools_25_unit_contract_etb_18'), [Math.round(selectedMoqItem.unitPrice * 0.82 * 25).toLocaleString()])}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. BOUTIQUE / RETAIL SHOP */}
      {businessType === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeShopTab === 'sizes'}
              onClick={() => setActiveShopTab('sizes')}
              icon={<Grid className="w-3.5 h-3.5" />}
              label={`${t('tab_boutique_variants')} (${items.length})`}
            />
            <TabButton
              active={activeShopTab === 'markdown'}
              onClick={() => setActiveShopTab('markdown')}
              icon={<TrendingDown className="w-3.5 h-3.5" />}
              label={t('tab_clearance_sale')}
            />
          </div>

          {activeShopTab === 'sizes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('boutique_sizes_desc')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {items.map((item) => {
                  const statusTone =
                    item.quantity <= item.minStockAlert
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : item.quantity >= item.minStockAlert * 2.5
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border ${statusTone} flex flex-col justify-between gap-2`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {item.sku} · {item.location}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          {fmt(t('barcode_etb'), [item.unitPrice.toLocaleString()])}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">{item.unitOfMeasure}</span>
                          <span
                            className={`ml-2 text-[10px] font-bold ${
                              item.quantity <= item.minStockAlert
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.quantity >= item.minStockAlert * 2.5
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {item.quantity <= item.minStockAlert
                              ? t('status_critical_low')
                              : item.quantity >= item.minStockAlert * 2.5
                              ? t('status_overstocked')
                              : t('status_healthy')}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            item.quantity <= item.minStockAlert
                              ? onOpenCreatePO(item.supplierId, item.id)
                              : onOpenQuickAdjust(item.id)
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-[10px] cursor-pointer"
                        >
                          {item.quantity <= item.minStockAlert ? t('nav_reorder') : t('industry_tools_adjust')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeShopTab === 'markdown' && (
            <div className="p-4 rounded-2xl terit-glass-sub space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {t('clearance_sim_title')}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {t('clearance_sim_desc')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[15, 25, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setClearanceDiscount(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap cursor-pointer ${
                        clearanceDiscount === pct
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {pct}% {t('off_label')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {t('discount_selected_label')}
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                    {clearanceDiscount}% {t('off_label')}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {t('liquidity_released_label')}
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {fmt(t('barcode_etb'), [Math.round(clearanceLiquidity).toLocaleString()])}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {t('based_on_slow_movers')}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {t('shelf_space_label')}
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                    {clearanceUnits} {t('units_label')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. BUILDING MATERIALS & HARDWARE */}
      {businessType === 'building' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeBuildingTab === 'rebar'}
              onClick={() => setActiveBuildingTab('rebar')}
              icon={<Calculator className="w-3.5 h-3.5" />}
              label={t('tab_rebar_calc')}
            />
            <TabButton
              active={activeBuildingTab === 'dispatch'}
              onClick={() => setActiveBuildingTab('dispatch')}
              icon={<Truck className="w-3.5 h-3.5" />}
              label={t('tab_cement_dispatch')}
            />
            <TabButton
              active={activeBuildingTab === 'moisture'}
              onClick={() => setActiveBuildingTab('moisture')}
              icon={<Layers className="w-3.5 h-3.5" />}
              label={t('tab_moisture_sentinel')}
            />
          </div>

          {/* TAB 1: REBAR CALCULATOR */}
          {activeBuildingTab === 'rebar' && (
            <div className="space-y-4">
              {rebarDeductSuccess && <SuccessBanner message={rebarDeductSuccess} />}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl terit-glass-sub space-y-3 text-xs md:col-span-1">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-500" />
                    <span>{t('industry_tools_rebar_specification')}</span>
                  </h4>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('industry_tools_diameter')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {[8, 10, 12, 14, 16, 20, 24].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setRebarDiameter(d)}
                          className={`py-1.5 px-2 rounded-lg font-mono font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                            rebarDiameter === d
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {d}mm
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">{fmt(t('industry_tools_unit_weight_kg_12m_bar'), [weightPer12mBar, barsPerTon])}</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">{t('industry_tools_input_mode')}</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRebarMode('pieces')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold cursor-pointer ${
                            rebarMode === 'pieces'
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-slate-500'
                          }`}
                        >{t('industry_tools_bars')}</button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setRebarMode('tonnage')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold cursor-pointer ${
                            rebarMode === 'tonnage'
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-slate-500'
                          }`}
                        >{t('industry_tools_tons')}</button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step={rebarMode === 'tonnage' ? '0.1' : '1'}
                      value={rebarInputVal}
                      onChange={(e) => setRebarInputVal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('industry_tools_agreed_rate_per_12m_bar')}</label>
                    <input
                      type="number"
                      min="100"
                      value={rebarRatePerBar}
                      onChange={(e) => setRebarRatePerBar(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Calculation Output Cards */}
                <div className="md:col-span-2 space-y-3 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="min-w-0 p-3.5 rounded-2xl terit-glass-sub flex flex-col justify-between">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_total_steel_bars')}</span>
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                        {totalRebarBars.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500 font-sans">{t('industry_tools_bars_12m')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {fmt(t('industry_tools_mm_grade_60_rebar'), [rebarDiameter])}</div>
                    </div>

                    <div className="min-w-0 p-3.5 rounded-2xl terit-glass-sub flex flex-col justify-between">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_total_net_weight')}</span>
                      <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 dark:text-blue-400 mt-1 tabular-nums">
                        {totalRebarTons}{' '}
                        <span className="text-xs font-normal text-slate-500 font-sans">{t('industry_tools_tons_2')}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                        {fmt(t('industry_tools_quintals_kg'), [totalRebarQuintals, totalRebarWeightKg.toLocaleString()])}</div>
                    </div>

                    <div className="min-w-0 p-3.5 rounded-2xl terit-glass-sub flex flex-col justify-between">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('industry_tools_estimated_batch_value')}</span>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
                        {estimatedRebarCost.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500 font-sans">{t('currency_etb')}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                        {fmt(t('industry_tools_etb_ton'), [(estimatedRebarCost / (totalRebarTons || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })])}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl terit-glass-sub space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <span>{t('industry_tools_contractor_structural_fabrication_estimator')}</span>
                      <span className="text-[10px] font-mono text-slate-500">{t('industry_tools_ethiopian_standard_code')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 block">{t('industry_tools_cutting_scrap_loss_allowance')}</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-mono text-xs">{scrapLossKg} kg</strong>{' '}{t('industry_tools_scrap_buffer')}</div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 block">{t('industry_tools_recommended_tying_wire')}</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-xs">{tyingWireKg} kg</strong>{' '}{t('industry_tools_wire_required')}</div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleDeductRebar}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                      >{fmt(t('industry_tools_deduct_bars_from_inventory'), [totalRebarBars])}</button>
                      <button
                        type="button"
                        onClick={() => onOpenCreatePO()}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >{t('industry_tools_issue_procurement_po')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CEMENT & BLOCK DISPATCH NOTE */}
          {activeBuildingTab === 'dispatch' && (
            <div className="space-y-4 text-xs">
              {dispatchSuccess && <SuccessBanner message={dispatchSuccess} />}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl terit-glass-sub space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>{t('industry_tools_project_site_delivery_details')}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t('dispatch_site_label')} *
                      </label>
                      <input
                        type="text"
                        value={dispatchSite}
                        onChange={(e) => setDispatchSite(e.target.value)}
                        placeholder={t('dispatch_site_placeholder')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t('dispatch_client_label')}
                      </label>
                      <input
                        type="text"
                        value={dispatchClient}
                        onChange={(e) => setDispatchClient(e.target.value)}
                        placeholder={t('dispatch_client_placeholder')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t('dispatch_plate_label')}
                      </label>
                      <input
                        type="text"
                        value={dispatchPlate}
                        onChange={(e) => setDispatchPlate(e.target.value)}
                        placeholder={t('dispatch_plate_placeholder')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t('dispatch_driver_label')}
                      </label>
                      <input
                        type="text"
                        value={dispatchDriver}
                        onChange={(e) => setDispatchDriver(e.target.value)}
                        placeholder={t('dispatch_driver_placeholder')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('industry_tools_dispatch_vehicle_type_legal_axle')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'isuzu' as const, label: 'Isuzu FSR/NPR', cap: '11.0 Tons Max' },
                        { key: 'sino' as const, label: 'Sino Tipper', cap: '35.0 Tons Max' },
                        { key: 'pickup' as const, label: 'Pickup / Mini', cap: '3.0 Tons Max' },
                      ].map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setDispatchTruck(v.key)}
                          className={`p-2 rounded-xl text-center border cursor-pointer transition-colors ${
                            dispatchTruck === v.key
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-300 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          <div className="font-bold">{v.label}</div>
                          <div className="text-[10px] font-mono text-slate-500">{v.cap}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('industry_tools_cement_50kg_bags')}</label>
                      <input
                        type="number"
                        min="0"
                        value={dispatchCementQty}
                        onChange={(e) => setDispatchCementQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('industry_tools_hcb_blocks_15_20cm')}</label>
                      <input
                        type="number"
                        min="0"
                        value={dispatchBlockQty}
                        onChange={(e) => setDispatchBlockQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Weight Verification & Dispatch Pass */}
                <div className="p-4 rounded-2xl terit-glass-sub flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">{t('industry_tools_axle_load_weight_verification')}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase whitespace-nowrap ${
                          isPayloadOverweight
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                        }`}
                      >
                        {isPayloadOverweight ? 'OVERLOAD BREACH' : 'LOAD COMPLIANT'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600 dark:text-slate-400">{t('industry_tools_gross_payload')}</span>
                        <strong className="text-slate-900 dark:text-white">
                          {fmt(t('industry_tools_tons_kg'), [(totalPayloadWeightKg / 1000).toFixed(2), totalPayloadWeightKg.toLocaleString()])}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600 dark:text-slate-400">{t('industry_tools_legal_vehicle_rating')}</span>
                        <strong className="text-slate-900 dark:text-white">{fmt(t('industry_tools_tons_3'), [(maxAllowedKg / 1000).toFixed(1)])}</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPayloadOverweight ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (totalPayloadWeightKg / maxAllowedKg) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-slate-800 dark:text-slate-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-400">
                        <HardHat className="w-3.5 h-3.5" />
                        <span>{t('industry_tools_site_breakage_allowance')}</span>
                      </div>
                      <p>{t('industry_tools_include')}{' '}<strong>{fmt(t('industry_tools_blocks'), [recommendedBreakageBlocks])}</strong>{' '}{t('industry_tools_standard_offloading_and_rough_transit')}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowDispatchPass(!showDispatchPass)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{showDispatchPass ? t('industry_tools_hide_dispatch_pass') : t('industry_tools_view_dispatch_pass')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDispatchDeduct}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('industry_tools_deduct_from_yard_stock')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {showDispatchPass && (
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border-2 border-dashed border-amber-500/40 space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">{t('industry_tools_construction_site_delivery_dispatch_pass')}</div>
                      <div className="text-[10px] text-slate-500">{fmt(t('industry_tools_pass_ref_dsp'), [new Date().getFullYear(), Math.floor(1000 + Math.random() * 9000), new Date().toLocaleDateString()])}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const passContent = `CONSTRUCTION SITE DELIVERY DISPATCH PASS\nProject Site: ${dispatchSite}\nClient: ${dispatchClient}\nVehicle: ${dispatchPlate} (${dispatchTruck.toUpperCase()})\nItems Dispatched:\n- Cement: ${dispatchCementQty} Bags (50kg)\n- Blocks: ${dispatchBlockQty} Pcs (Breakage allowance +${recommendedBreakageBlocks})\nGross Weight: ${(totalPayloadWeightKg / 1000).toFixed(2)} Tons\nGate Clearance: APPROVED`;
                        navigator.clipboard.writeText(passContent);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 3000);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-sans text-xs font-semibold flex items-center gap-1 self-start sm:self-center whitespace-nowrap cursor-pointer"
                    >
                      {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPass ? t('barcode_copied_btn') : t('industry_tools_copy_pass')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">{t('dispatch_site_label')}:</span>
                      <strong className="text-slate-900 dark:text-white">{dispatchSite || t('not_assigned')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t('dispatch_client_label')}:</span>
                      <strong className="text-slate-900 dark:text-white">{dispatchClient || t('not_assigned')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t('dispatch_plate_label')}:</span>
                      <strong className="text-slate-900 dark:text-white">{dispatchPlate || t('not_assigned')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t('dispatch_driver_label')}:</span>
                      <strong className="text-slate-900 dark:text-white">{dispatchDriver || t('not_assigned')}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="font-bold mb-1 text-slate-800 dark:text-slate-200">{t('industry_tools_loaded_yard_inventory')}</div>
                    <div className="space-y-0.5">
                      <div>{t('industry_tools_cement_50kg_bags_2')}{' '}<strong>{fmt(t('industry_tools_bags'), [dispatchCementQty])}</strong> ({(dispatchCementQty * 50 / 1000).toFixed(2)}{' '}{t('industry_tools_tons_4')}</div>
                      <div>{t('industry_tools_hollow_concrete_blocks_15cm')}{' '}<strong>{fmt(t('industry_tools_pcs'), [dispatchBlockQty])}</strong> + {recommendedBreakageBlocks}{' '}{t('industry_tools_buffer_pcs')}</div>
                      <div>{t('industry_tools_total_payload')}{' '}<strong>{fmt(t('industry_tools_metric_tons'), [(totalPayloadWeightKg / 1000).toFixed(2)])}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MOISTURE & CEMENT SENTINEL */}
          {activeBuildingTab === 'moisture' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl terit-glass-sub space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>{t('industry_tools_hydraulic_cement_age_ambient_moisture')}</span>
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                      cementBagDays <= 30
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : cementBagDays <= 60
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                        : cementBagDays <= 90
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {cementBagDays <= 30
                      ? t('industry_tools_100_strength_prime')
                      : cementBagDays <= 60
                      ? t('industry_tools_95_strength_good')
                      : cementBagDays <= 90
                      ? t('industry_tools_85_strength_plaster_only')
                      : t('industry_tools_caked_test_required')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">{t('industry_tools_batch_storage_age_days')}</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={cementBagDays}
                      onChange={(e) => setCementBagDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      {cementBagDays <= 60 ? t('industry_tools_suitable_for_structural_concrete') : t('industry_tools_restrict_to_non_structural_mortar')}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">{t('industry_tools_stack_height_bags_high')}</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={palletHeightBags}
                      onChange={(e) => setPalletHeightBags(parseInt(e.target.value) || 1)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] mt-1 font-semibold">
                      {palletHeightBags <= 10 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">{t('industry_tools_safe_stack_10_bags')}</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">{t('industry_tools_exceeds_10_bags_compaction_risk')}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">{t('industry_tools_moisture_tarp_protection')}</label>
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={moistureCoverChecked}
                        onChange={(e) => setMoistureCoverChecked(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-300 text-xs">{t('industry_tools_raised_wooden_pallet_heavy_tarp')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. OTHER / GENERAL COMMERCIAL */}
      {businessType === 'other' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 overflow-x-auto">
            <TabButton
              active={activeOtherTab === 'transfer'}
              onClick={() => setActiveOtherTab('transfer')}
              icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
              label={t('industry_tools_multi_branch_stock_transfer')}
            />
            <TabButton
              active={activeOtherTab === 'landed'}
              onClick={() => setActiveOtherTab('landed')}
              icon={<Calculator className="w-3.5 h-3.5" />}
              label={t('industry_tools_landed_unit_cost_calculator_etb')}
            />
          </div>

          {activeOtherTab === 'transfer' && (
            <div className="p-4 rounded-2xl terit-glass-sub space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>{t('industry_tools_branch_department_requisition_transfer')}</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{t('industry_tools_move_stock_cleanly_between_warehouses')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCreatePO()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >{t('reorder_create_po')}</button>
                  <button
                    onClick={() => onOpenQuickAdjust()}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                  >{t('industry_tools_manual_adjust')}</button>
                </div>
              </div>

              {transferNotice && <SuccessBanner message={transferNotice} />}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_sku_to_allocate')}</label>
                  <select
                    value={transferItem?.id || ''}
                    onChange={(e) => setTransferItemId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.quantity} @ {it.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_destination_branch_depot')}</label>
                  <select
                    value={transferDestLocId}
                    onChange={(e) => setTransferDestLocId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {allLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('transfer_quantity')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={transferQty}
                      onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handleBranchTransfer}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
                    >{t('industry_tools_dispatch')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeOtherTab === 'landed' && (
            <div className="p-4 rounded-2xl terit-glass-sub space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{t('industry_tools_import_inter_regional_landed_cost')}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{t('industry_tools_factor_supplier_invoice_price_freight')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_factory_unit_cost_etb')}</label>
                  <input
                    type="number"
                    min="1"
                    value={landedFactoryETB}
                    onChange={(e) => setLandedFactoryETB(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_total_freight_etb')}</label>
                  <input
                    type="number"
                    min="0"
                    value={landedFreightETB}
                    onChange={(e) => setLandedFreightETB(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_customs_handling_etb')}</label>
                  <input
                    type="number"
                    min="0"
                    value={landedCustomsETB}
                    onChange={(e) => setLandedCustomsETB(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_batch_qty')}</label>
                  <input
                    type="number"
                    min="1"
                    value={landedQty}
                    onChange={(e) => setLandedQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('industry_tools_target_margin')}</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={landedMarginPct}
                    onChange={(e) => setLandedMarginPct(Math.min(90, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  title={t('industry_tools_freight_customs_overhead_unit')}
                  value={`${unitOverheadETB.toFixed(1)} ETB`}
                  subtitle="Allocated evenly per unit"
                />
                <StatCard
                  title={t('industry_tools_true_landed_unit_cost')}
                  value={`${trueLandedUnitETB.toFixed(1)} ETB`}
                  subtitle="Breakeven warehouse cost"
                  valueColor="amber"
                />
                <StatCard
                  title={`Target Retail (${landedMarginPct}% Margin)`}
                  value={`${Math.ceil(suggestedRetailETB).toLocaleString()} ETB`}
                  subtitle="Recommended selling price"
                  valueColor="emerald"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
