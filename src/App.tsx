import React, { Suspense, lazy, useEffect, useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { ToastProvider, Toast, useToast } from './components/Toast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthGateView } from './components/AuthGateView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BarcodeScannerListener } from './lib/posHardware';
import { InventoryItem, Supplier, PurchaseOrder } from './types/inventory';
import { BotMessageSquare, Boxes, Sparkles, Thermometer, Tag, Ship } from 'lucide-react';

// Popups load on first open (and the common ones are prefetched when the page is idle).
const AddItemModal = lazy(() => import('./components/AddItemModal').then((m) => ({ default: m.AddItemModal })));
const QuickAdjustModal = lazy(() => import('./components/QuickAdjustModal').then((m) => ({ default: m.QuickAdjustModal })));
const BarcodeModal = lazy(() => import('./components/BarcodeModal').then((m) => ({ default: m.BarcodeModal })));
const CreatePOModal = lazy(() => import('./components/CreatePOModal').then((m) => ({ default: m.CreatePOModal })));
const TransferStockModal = lazy(() => import('./components/TransferStockModal').then((m) => ({ default: m.TransferStockModal })));
const ItemDetailsModal = lazy(() => import('./components/ItemDetailsModal').then((m) => ({ default: m.ItemDetailsModal })));
const AddSupplierModal = lazy(() => import('./components/AddSupplierModal').then((m) => ({ default: m.AddSupplierModal })));
const AddWarehouseModal = lazy(() => import('./components/AddWarehouseModal').then((m) => ({ default: m.AddWarehouseModal })));
const PODetailsModal = lazy(() => import('./components/PODetailsModal').then((m) => ({ default: m.PODetailsModal })));
const PricingModal = lazy(() => import('./components/PricingModal').then((m) => ({ default: m.PricingModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then((m) => ({ default: m.OnboardingModal })));
const AlertsModal = lazy(() => import('./components/AlertsModal').then((m) => ({ default: m.AlertsModal })));
const ColdChainModal = lazy(() => import('./components/ColdChainModal').then((m) => ({ default: m.ColdChainModal })));
const EveningMarkdownModal = lazy(() => import('./components/EveningMarkdownModal').then((m) => ({ default: m.EveningMarkdownModal })));
const LandedCostModal = lazy(() => import('./components/LandedCostModal').then((m) => ({ default: m.LandedCostModal })));
const MobileSyncModal = lazy(() => import('./components/MobileSyncModal').then((m) => ({ default: m.MobileSyncModal })));
const ETRReceiptModal = lazy(() => import('./components/ETRReceiptModal').then((m) => ({ default: m.ETRReceiptModal })));

// After the first screen is up, quietly fetch what people open most, so it opens instantly.
const prefetchCommonScreens = () => {
  void import('./components/InventoryView');
  void import('./components/AddItemModal');
  void import('./components/QuickAdjustModal');
  void import('./components/ItemDetailsModal');
};

const DashboardView = lazy(() => import('./components/DashboardView').then((m) => ({ default: m.DashboardView })));
const InventoryView = lazy(() => import('./components/InventoryView').then((m) => ({ default: m.InventoryView })));
const PurchaseOrdersView = lazy(() => import('./components/PurchaseOrdersView').then((m) => ({ default: m.PurchaseOrdersView })));
const SuppliersView = lazy(() => import('./components/SuppliersView').then((m) => ({ default: m.SuppliersView })));
const WarehousesView = lazy(() => import('./components/WarehousesView').then((m) => ({ default: m.WarehousesView })));
const ReportsView = lazy(() => import('./components/ReportsView').then((m) => ({ default: m.ReportsView })));
const CreditLedgerView = lazy(() => import('./components/CreditLedgerView').then((m) => ({ default: m.CreditLedgerView })));
const StaffRosterView = lazy(() => import('./components/StaffRosterView').then((m) => ({ default: m.StaffRosterView })));
const LedgerView = lazy(() => import('./components/LedgerView').then((m) => ({ default: m.LedgerView })));
const BundleBuilder = lazy(() => import('./components/BundleBuilder').then((m) => ({ default: m.BundleBuilder })));
const LandedCostEditor = lazy(() => import('./components/LandedCostEditor').then((m) => ({ default: m.LandedCostEditor })));
const ReorderDashboard = lazy(() => import('./components/ReorderDashboard').then((m) => ({ default: m.ReorderDashboard })));
const AICopilotDrawer = lazy(() => import('./components/AICopilotDrawer').then((m) => ({ default: m.AICopilotDrawer })));

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`terit-skeleton rounded-xl ${className}`} />
);

const ViewFallback = () => (
  <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-9 w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="terit-glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900 border border-white/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
        <SkeletonBlock className="h-64 w-full rounded-xl" />
      </div>
      <div className="bg-white/60 dark:bg-slate-900 border border-white/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <SkeletonBlock className="h-5 w-36" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

function AppContent() {
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(prefetchCommonScreens) : window.setTimeout(prefetchCommonScreens, 2000);
    return () => {
      if (!w.requestIdleCallback) window.clearTimeout(id);
    };
  }, []);

  const { user, authLoading, isGuestMode, hasCompletedOnboarding, items, purchaseOrders, businessType, t } = useInventory();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isColdChainOpen, setIsColdChainOpen] = useState(false);
  const [isMarkdownOpen, setIsMarkdownOpen] = useState(false);
  const [isLandedCostOpen, setIsLandedCostOpen] = useState(false);
  const [isSyncGuideOpen, setIsSyncGuideOpen] = useState(false);

  // Modal States
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [adjustTargetItemId, setAdjustTargetItemId] = useState<string | undefined>(undefined);

  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeTargetItem, setBarcodeTargetItem] = useState<InventoryItem | null>(null);

  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [poPreselectedSupplier, setPoPreselectedSupplier] = useState<string | undefined>(undefined);
  const [poPreselectedItem, setPoPreselectedItem] = useState<string | undefined>(undefined);

  const [isPODetailsOpen, setIsPODetailsOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferDefaultWarehouse, setTransferDefaultWarehouse] = useState<string | undefined>(undefined);

  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);

  const [isETROpen, setIsETROpen] = useState(false);
  const [etrItem, setEtrItem] = useState<InventoryItem | null>(null);

  // Reset UI view & open modals whenever the active session changes (login / logout / switch account)
  useEffect(() => {
    setActiveTab('dashboard');
    setIsChatOpen(false);
    setIsPricingOpen(false);
    setIsAlertsOpen(false);
    setIsSyncGuideOpen(false);
    setIsAddItemOpen(false);
    setEditingItem(null);
    setIsQuickAdjustOpen(false);
    setIsBarcodeOpen(false);
    setIsCreatePOOpen(false);
    setIsPODetailsOpen(false);
    setIsTransferOpen(false);
    setIsItemDetailsOpen(false);
    setIsAddSupplierOpen(false);
    setIsAddWarehouseOpen(false);
    setIsETROpen(false);
  }, [user?.uid, isGuestMode]);

  // Open Business Model onboarding automatically for new Google sign-ups and new guest sessions
  useEffect(() => {
    if (authLoading) return;
    if (user || isGuestMode) {
      if (!hasCompletedOnboarding) {
        setIsOnboardingOpen(true);
      } else {
        setIsOnboardingOpen(false);
      }
    } else {
      setIsOnboardingOpen(false);
    }
  }, [authLoading, user?.uid, isGuestMode, hasCompletedOnboarding]);

  // Global USB / Bluetooth HID Barcode Scanner listener
  useEffect(() => {
    if (!user && !isGuestMode) return;
    const listener = new BarcodeScannerListener((scannedCode) => {
      const normalized = scannedCode.trim().toLowerCase();
      const matched = items.find(
        (item) =>
          (item.barcode && item.barcode.trim().toLowerCase() === normalized) ||
          item.sku.trim().toLowerCase() === normalized
      );
      if (matched) {
        setSelectedItem(matched);
        setIsItemDetailsOpen(true);
        toast(t('scanner_item_found_toast').replace('{name}', matched.name), 'info');
      } else {
        toast(t('scanner_item_not_found_toast').replace('{code}', scannedCode), 'info');
      }
    });
    listener.start();
    return () => listener.stop();
  }, [user, isGuestMode, items, toast, t]);

  // Handlers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsAddItemOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  const handleOpenQuickAdjust = (itemId?: string) => {
    setAdjustTargetItemId(itemId);
    setIsQuickAdjustOpen(true);
  };

  const handleOpenBarcode = (item: InventoryItem) => {
    setBarcodeTargetItem(item);
    setIsBarcodeOpen(true);
  };

  const handleOpenCreatePO = (supplierId?: string, itemId?: string) => {
    setPoPreselectedSupplier(supplierId);
    setPoPreselectedItem(itemId);
    setIsCreatePOOpen(true);
  };

  const handleViewPODetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsPODetailsOpen(true);
  };

  const handleOpenTransfer = (warehouseName?: string) => {
    setTransferDefaultWarehouse(warehouseName);
    setIsTransferOpen(true);
  };

  const handleViewItemDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsItemDetailsOpen(true);
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setIsAddSupplierOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsAddSupplierOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-slate-900 dark:text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25 animate-pulse">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <div className="text-sm font-bold">{t('app_name')}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{t('auth_loading_label')}</div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return <AuthGateView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-slate-950 transition-colors">
      {/* Universal Responsive Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsChatOpen={setIsChatOpen}
        setIsPricingOpen={setIsPricingOpen}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSyncGuide={() => setIsSyncGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">
          <Suspense fallback={<ViewFallback />}>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveTab}
                onOpenAddItem={handleOpenAddItem}
                onOpenQuickAdjust={handleOpenQuickAdjust}
                onOpenCreatePO={handleOpenCreatePO}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onOpenBarcode={handleOpenBarcode}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                onOpenAddItem={handleOpenAddItem}
                onOpenEditItem={handleOpenEditItem}
                onOpenQuickAdjust={handleOpenQuickAdjust}
                onOpenBarcode={handleOpenBarcode}
                onViewItemDetails={handleViewItemDetails}
                onOpenPricing={() => setIsPricingOpen(true)}
              />
            )}

            {activeTab === 'credit' && <CreditLedgerView />}

            {activeTab === 'staff' && <StaffRosterView />}

            {activeTab === 'reports' && (
              <ReportsView
                onOpenCreatePO={handleOpenCreatePO}
                onNavigateTab={setActiveTab}
              />
            )}


            {activeTab === 'procurement' && (
              <PurchaseOrdersView
                onOpenCreatePO={() => handleOpenCreatePO()}
                onViewPODetails={handleViewPODetails}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersView
                onOpenAddSupplier={handleOpenAddSupplier}
                onOpenEditSupplier={handleOpenEditSupplier}
                onOpenCreatePOForSupplier={(supId) => handleOpenCreatePO(supId)}
              />
            )}

            {activeTab === 'warehouses' && (
              <WarehousesView
                onOpenAddWarehouse={() => setIsAddWarehouseOpen(true)}
                onOpenStockTransfer={handleOpenTransfer}
                onOpenPricing={() => setIsPricingOpen(true)}
              />
            )}

            {(activeTab === 'ledger' || activeTab === 'movements') && <LedgerView />}

            {activeTab === 'bundles' && <BundleBuilder />}

            {activeTab === 'landed-cost' && <LandedCostEditor />}

            {activeTab === 'reorder' && (
              <ReorderDashboard
                onNavigate={setActiveTab}
                onOpenQuickAdjust={handleOpenQuickAdjust}
                onViewPODetails={handleViewPODetails}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Floating Copilot Quick Button (Desktop) */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="hidden lg:flex fixed bottom-6 right-6 z-30 p-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-xl shadow-amber-500/20 hover:scale-105 transition-all items-center gap-2 group cursor-pointer"
        title={t('copilot_open_title')}
      >
        <BotMessageSquare className="w-5 h-5 text-slate-950" />
        <span className="text-xs font-bold pr-1">{t('copilot_btn')}</span>
        <Sparkles className="w-3.5 h-3.5 text-slate-900 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Cold-Chain Log Quick Button (Pharmacy only) */}
      {businessType === 'pharmacy' && (
        <button
          onClick={() => setIsColdChainOpen(true)}
          className="hidden lg:flex fixed bottom-24 right-6 z-30 p-3 rounded-full bg-sky-500 text-white font-bold shadow-xl shadow-sky-500/20 hover:scale-105 transition-all items-center gap-2 cursor-pointer"
          title={t('coldchain_title') || 'Cold-Chain Temperature Log'}
        >
          <Thermometer className="w-4 h-4" />
        </button>
      )}

      {/* Evening Markdown Quick Button (Supermarket only) */}
      {businessType === 'supermarket' && (
        <button
          onClick={() => setIsMarkdownOpen(true)}
          className="hidden lg:flex fixed bottom-24 right-6 z-30 p-3 rounded-full bg-amber-500 text-slate-950 font-bold shadow-xl shadow-amber-500/20 hover:scale-105 transition-all items-center gap-2 cursor-pointer"
          title={t('markdown_title') || 'Evening Markdown'}
        >
          <Tag className="w-4 h-4" />
        </button>
      )}

      {/* Landed Cost Quick Button (General Trade / Store) */}
      {(businessType === 'other' || businessType === 'store') && (
        <button
          onClick={() => setIsLandedCostOpen(true)}
          className="hidden lg:flex fixed bottom-24 right-6 z-30 p-3 rounded-full bg-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all items-center gap-2 cursor-pointer"
          title={t('landed_title') || 'Landed Cost Calculator'}
        >
          <Ship className="w-4 h-4" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl py-4 text-center text-xs text-slate-700 dark:text-slate-300 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 lg:pr-52 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium">{t('app_name')} · {t('footer_tagline')}</div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span>{t('footer_sync_label')}</span>
            <span>·</span>
            <span>{t('footer_ai_label')}</span>
          </div>
        </div>
      </footer>

      {/* Mobile-First Persistent Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSyncGuide={() => setIsSyncGuideOpen(true)}
      />

      {/* Onboarding & Business Type Modal */}
      {isOnboardingOpen && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            allowDismiss={hasCompletedOnboarding}
          />
        </Suspense>
      )}

      {/* AI Copilot Drawer */}
      {isChatOpen && (
        <Suspense fallback={null}>
          <AICopilotDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </Suspense>
      )}

      {/* Pricing / Plan Modal */}
      {isPricingOpen && (
        <Suspense fallback={null}>
          <PricingModal
            isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
            </Suspense>
            )}

            {/* SMS & Email Alerts Sentinel Modal */}
            {isAlertsOpen && (
            <Suspense fallback={null}>
            <AlertsModal
            isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
            </Suspense>
            )}
            {isColdChainOpen && (
            <Suspense fallback={null}>
            <ColdChainModal
            isOpen={isColdChainOpen} onClose={() => setIsColdChainOpen(false)} />
            </Suspense>
            )}
            {isMarkdownOpen && (
            <Suspense fallback={null}>
            <EveningMarkdownModal
            isOpen={isMarkdownOpen} onClose={() => setIsMarkdownOpen(false)} />
            </Suspense>
            )}
            {isLandedCostOpen && (
            <Suspense fallback={null}>
            <LandedCostModal
            isOpen={isLandedCostOpen} onClose={() => setIsLandedCostOpen(false)} />
            </Suspense>
            )}

            {/* Android Mobile App Sync Guide Modal */}
            {isSyncGuideOpen && (
            <Suspense fallback={null}>
            <MobileSyncModal
            isOpen={isSyncGuideOpen} onClose={() => setIsSyncGuideOpen(false)} />
            </Suspense>
            )}

            {/* Add / Edit Item Modal (with Smart SKU Generator) */}
            {isAddItemOpen && (
            <Suspense fallback={null}>
            <AddItemModal
            isOpen={isAddItemOpen}
            onClose={() => setIsAddItemOpen(false)}
            editingItem={editingItem}
          />
        </Suspense>
      )}

      {/* Quick Adjust In/Out Modal */}
      {isQuickAdjustOpen && (
        <Suspense fallback={null}>
          <QuickAdjustModal
            isOpen={isQuickAdjustOpen}
            onClose={() => setIsQuickAdjustOpen(false)}
            targetItemId={adjustTargetItemId}
          />
        </Suspense>
      )}

      {/* QR & Barcode Generator Modal */}
      {isBarcodeOpen && (
        <Suspense fallback={null}>
          <BarcodeModal
            isOpen={isBarcodeOpen}
            onClose={() => setIsBarcodeOpen(false)}
            item={barcodeTargetItem}
          />
        </Suspense>
      )}

      {/* Create PO Modal */}
      {isCreatePOOpen && (
        <Suspense fallback={null}>
          <CreatePOModal
            isOpen={isCreatePOOpen}
            onClose={() => setIsCreatePOOpen(false)}
            preselectedSupplierId={poPreselectedSupplier}
            preselectedItemId={poPreselectedItem}
          />
        </Suspense>
      )}

      {/* PO Details Modal */}
      {isPODetailsOpen && (
        <Suspense fallback={null}>
          <PODetailsModal
            isOpen={isPODetailsOpen}
            onClose={() => setIsPODetailsOpen(false)}
            po={selectedPO ? (purchaseOrders.find((p) => p.id === selectedPO.id) ?? selectedPO) : null}
            onNavigate={setActiveTab}
          />
        </Suspense>
      )}

      {/* Transfer Stock Modal */}
      {isTransferOpen && (
        <Suspense fallback={null}>
          <TransferStockModal
            isOpen={isTransferOpen}
            onClose={() => setIsTransferOpen(false)}
            defaultWarehouse={transferDefaultWarehouse}
          />
        </Suspense>
      )}

      {/* Item Details View Modal */}
      {isItemDetailsOpen && (
        <Suspense fallback={null}>
          <ItemDetailsModal
            isOpen={isItemDetailsOpen}
            onClose={() => setIsItemDetailsOpen(false)}
            item={selectedItem}
            onOpenEdit={handleOpenEditItem}
            onOpenQuickAdjust={handleOpenQuickAdjust}
            onOpenBarcode={handleOpenBarcode}
            onOpenETR={(item) => {
              setIsItemDetailsOpen(false);
              setEtrItem(item);
              setIsETROpen(true);
            }}
          />
        </Suspense>
      )}

      {/* ETR Fiscal Tax Receipt Modal */}
      {isETROpen && (
        <Suspense fallback={null}>
          <ETRReceiptModal
            isOpen={isETROpen}
            onClose={() => setIsETROpen(false)}
            items={etrItem ? [{ name: etrItem.name, qty: 1, price: etrItem.unitPrice }] : []}
          />
        </Suspense>
      )}

      {/* Add / Edit Supplier Modal */}
      {isAddSupplierOpen && (
        <Suspense fallback={null}>
          <AddSupplierModal
            isOpen={isAddSupplierOpen}
            onClose={() => setIsAddSupplierOpen(false)}
            editingSupplier={editingSupplier}
          />
        </Suspense>
      )}

      {/* Add Warehouse Modal */}
      {isAddWarehouseOpen && (
        <Suspense fallback={null}>
          <AddWarehouseModal
            isOpen={isAddWarehouseOpen}
            onClose={() => setIsAddWarehouseOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <InventoryProvider>
          <AppContent />
          <Toast />
        </InventoryProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
