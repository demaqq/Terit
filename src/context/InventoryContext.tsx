import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  InventoryItem,
  StockLedgerEntry,
  StockBalance,
  Supplier,
  PurchaseOrder,
  Warehouse,
  Location,
  PlanTier,
  ItemStatus,
  CompanyProfile,
  LedgerEntryType,
  ReorderRecommendation,
  SyncStatus,
  POLineItem,
} from '../types/inventory';
import {
  SupportedLanguage,
  BusinessType,
  TRANSLATIONS,
} from '../i18n/translations';
import {
  BUSINESS_PRESET_ITEMS,
  BUSINESS_PRESET_LOCATIONS,
  BUSINESS_PRESET_PURCHASE_ORDERS,
  BUSINESS_PRESET_SUPPLIERS,
  BUSINESS_PRESET_TRANSACTIONS,
  BUSINESS_PRESET_WAREHOUSES,
} from '../data/businessPresets';
import { useToast } from '../components/Toast';
import { offlineSync } from '../lib/offlineSync';
import { isCompanyProfileComplete } from '../lib/validation';

export const getPlanForBusinessType = (type: BusinessType): PlanTier => {
  switch (type) {
    case 'shop':
    case 'minimarket':
    case 'building':
      return 'starter';
    case 'pharmacy':
    case 'supermarket':
      return 'pro';
    case 'store':
    case 'other':
    default:
      return 'enterprise';
  }
};

export const getBusinessTypeForPlan = (plan: PlanTier): BusinessType => {
  switch (plan) {
    case 'starter':
    case 'shop':
      return 'shop';
    case 'pro':
    case 'pharmacy':
      return 'pharmacy';
    case 'enterprise':
    case 'warehouse':
      return 'store';
    default:
      return 'shop';
  }
};

interface InventoryContextType {
  user: User | null;
  authLoading: boolean;
  isAuthActionPending: boolean;
  isGuestMode: boolean;
  justLoggedOut: boolean;
  tier: PlanTier;
  alignedPlan: PlanTier;
  getPlanForBusinessType: (type: BusinessType) => PlanTier;
  setTier: (tier: PlanTier, syncBusinessType?: boolean) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  businessType: BusinessType;
  setBusinessType: (type: BusinessType, loadPresets?: boolean, syncPlan?: boolean) => Promise<void>;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  companyProfile: CompanyProfile;
  setCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  // Data
  items: InventoryItem[];
  locations: Location[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  transactions: StockLedgerEntry[];
  stockBalances: StockBalance[];
  purchaseOrders: PurchaseOrder[];
  isCloudSynced: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  // Auth & Guest Mode
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  // Item actions
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<boolean>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  // Location actions
  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;
  // Ledger actions
  postLedgerEntry: (entry: Omit<StockLedgerEntry, 'id' | 'userId' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  recordSale: (itemId: string, locationId: string, quantity: number, unitPrice: number, reason?: string, referenceId?: string) => Promise<boolean>;
  recordPurchaseReceipt: (itemId: string, locationId: string, quantity: number, unitCost: number, reason?: string, referenceId?: string, poId?: string) => Promise<boolean>;
  transferStock: (itemId: string, sourceLocationId: string, targetLocationId: string, quantity: number, reason?: string) => Promise<boolean>;
  adjustStock: (itemId: string, locationId: string, delta: number, reason: string, referenceNumber?: string) => Promise<boolean>;
  quickAdjustStock: (id: string, delta: number, reason: string, referenceNumber?: string) => Promise<boolean>;
  // Bundle actions
  assembleBundle: (bundleItemId: string, locationId: string, quantity: number) => Promise<boolean>;
  disassembleBundle: (bundleItemId: string, locationId: string, quantity: number) => Promise<boolean>;
  // Stock queries
  getStockBalance: (itemId: string, locationId: string) => StockBalance | undefined;
  getItemQuantityAtLocation: (itemId: string, locationId: string) => number;
  getReorderRecommendations: () => ReorderRecommendation[];
  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  // PO actions
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<boolean>;
  receivePurchaseOrder: (id: string) => Promise<boolean>;
  // Warehouse actions (backward compat)
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt'>) => Promise<boolean>;
  // Bulk import
  importItems: (newItems: InventoryItem[]) => Promise<boolean>;
  // Offline sync
  forceSync: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const stripUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)).filter((v) => v !== undefined) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
};

const txsToLedger = (
  txs: typeof BUSINESS_PRESET_TRANSACTIONS.shop,
  scopeFn: (id: string) => string = (id) => id,
  userId?: string,
  locationsList: Location[] = []
): StockLedgerEntry[] =>
  txs.map((tx) => {
    const matchedLoc = locationsList.find((l) => l.name === tx.location);
    const resolvedLocId = matchedLoc ? scopeFn(matchedLoc.id) : tx.location;
    return {
      id: scopeFn(tx.id),
      userId,
      itemId: scopeFn(tx.itemId),
      itemName: tx.itemName,
      sku: tx.sku,
      type: tx.type as LedgerEntryType,
      quantity: Math.abs(tx.quantity),
      sourceLocationId: tx.quantity < 0 ? resolvedLocId : undefined,
      sourceLocationName: tx.quantity < 0 ? tx.location : undefined,
      destinationLocationId: tx.quantity >= 0 ? resolvedLocId : undefined,
      destinationLocationName: tx.quantity >= 0 ? tx.location : undefined,
      unitCost: 0,
      totalCost: 0,
      previousQuantity: tx.previousQuantity ?? 0,
      newQuantity: tx.newQuantity ?? tx.quantity,
      referenceType: 'stock_adjustment' as const,
      referenceId: tx.referenceNumber,
      reason: tx.reason,
      syncStatus: 'synced' as SyncStatus,
      createdAt: tx.createdAt,
      updatedAt: tx.createdAt,
    };
  });

const isLegacyAustinData = (parsed: unknown): boolean => {
  if (!Array.isArray(parsed) || parsed.length === 0) return false;
  return parsed.some(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      (('location' in entry && typeof entry.location === 'string' && entry.location.includes('Austin')) ||
        ('name' in entry && typeof entry.name === 'string' && entry.name.includes('Austin')) ||
        ('sku' in entry && entry.sku === 'TRT-AUD-901'))
  );
};

const VALID_BUSINESS_TYPES: BusinessType[] = [
  'shop',
  'building',
  'minimarket',
  'pharmacy',
  'supermarket',
  'store',
  'other',
];

const clearWorkspaceSessionStorage = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('terit_') && key !== 'terit_language' && key !== 'terit_theme') {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {}
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthActionPending, setIsAuthActionPending] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('terit_guest_mode') === 'true';
  });
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const authSessionSeqRef = useRef(0);

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('terit_language') as SupportedLanguage) || 'en';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('terit_theme') as 'light' | 'dark') || 'light';
  });

  const [businessType, setBusinessTypeState] = useState<BusinessType>(() => {
    const saved = localStorage.getItem('terit_business_type') as BusinessType;
    return VALID_BUSINESS_TYPES.includes(saved) ? saved : 'shop';
  });

  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(() => {
    return localStorage.getItem('terit_onboarding_done') === 'true';
  });

  const [tier, setTierState] = useState<PlanTier>('free');

  const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    billingCycle: 'monthly',
    paymentStatus: 'trial',
    onboardingCompleted: false,
  };

  const isSyntheticTestProfile = (profile: Partial<CompanyProfile> | null | undefined): boolean => {
    if (!profile) return false;
    const normalizedCompany = (profile.companyName || '').trim().toLowerCase();
    const normalizedContact = (profile.contactName || '').trim().toLowerCase();
    const normalizedPhone = (profile.phone || '').trim();
    const normalizedEmail = (profile.email || '').trim().toLowerCase();

    return (
      normalizedCompany === 'example shop' ||
      normalizedContact === 'test contact' ||
      normalizedContact === 'john doe' ||
      normalizedPhone === '0911111111' ||
      normalizedEmail === 'test@example.com' ||
      normalizedEmail === 'demo@example.com'
    );
  };

  const [companyProfile, setCompanyProfileState] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('terit_company_profile');
    if (!saved) return DEFAULT_COMPANY_PROFILE;
    try {
      const profile = JSON.parse(saved) as CompanyProfile;
      if (isSyntheticTestProfile(profile)) {
        localStorage.removeItem('terit_company_profile');
        return DEFAULT_COMPANY_PROFILE;
      }
      const migratedProfile: CompanyProfile = { ...profile };
      let changed = false;
      if (profile.paymentStatus === 'paid') {
        migratedProfile.paymentStatus = 'trial';
        changed = true;
      }
      for (const key of ['paymentDate', 'lastPaymentTxId', 'paymentMethod'] as const) {
        if (migratedProfile[key] !== undefined) {
          delete migratedProfile[key];
          changed = true;
        }
      }
      if (migratedProfile.contactName === 'Store Manager') {
        migratedProfile.contactName = '';
        changed = true;
      }
      if (migratedProfile.phone === '+251 91 190 2841') {
        migratedProfile.phone = '';
        changed = true;
      }
      if (migratedProfile.email === 'contact@terit.et') {
        migratedProfile.email = '';
        changed = true;
      }
      if (migratedProfile.city === 'Addis Ababa') {
        migratedProfile.city = '';
        changed = true;
      }
      if (migratedProfile.subcity === 'Bole Subcity') {
        delete migratedProfile.subcity;
        changed = true;
      }
      if (migratedProfile.tin === '0038472910' || migratedProfile.tin === '0019283746') {
        delete migratedProfile.tin;
        changed = true;
      }
      if (migratedProfile.branchName === 'Main Bole Branch' || migratedProfile.branchName === 'Main Branch') {
        delete migratedProfile.branchName;
        changed = true;
      }
      if (changed) localStorage.setItem('terit_company_profile', JSON.stringify(migratedProfile));
      return migratedProfile;
    } catch {
      localStorage.removeItem('terit_company_profile');
      return DEFAULT_COMPANY_PROFILE;
    }
  });

  const setCompanyProfile = (profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfileState((prev) => {
      const next = { ...prev, ...profileUpdate };
      localStorage.setItem('terit_company_profile', JSON.stringify(next));
      if (user) {
        setDoc(
          doc(db, 'users', user.uid),
          stripUndefined({
            userId: user.uid,
            companyName: (next.companyName || '').slice(0, 128),
            companyProfile: next,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        ).catch(() => {});
      }
      return next;
    });
  };

  // --- Data state ---
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_items');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as unknown;
      if (isLegacyAustinData(parsed)) {
        localStorage.removeItem('terit_items');
        return [];
      }
      return Array.isArray(parsed) ? (parsed as InventoryItem[]) : [];
    } catch {
      localStorage.removeItem('terit_items');
      return [];
    }
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Location[];
        if (Array.isArray(parsed) && !isLegacyAustinData(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_warehouses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Warehouse[];
        if (Array.isArray(parsed) && !isLegacyAustinData(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_suppliers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Supplier[];
        if (Array.isArray(parsed) && !parsed.some((s) => s.id === 'sup-1' && s.name?.includes('Apex Microelectronics'))) {
          return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_ledger');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StockLedgerEntry[];
        if (Array.isArray(parsed) && !isLegacyAustinData(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    if (localStorage.getItem('terit_guest_mode') !== 'true') return [];
    const saved = localStorage.getItem('terit_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PurchaseOrder[];
        if (Array.isArray(parsed) && !parsed.some((po) => po.supplierName?.includes('Apex Microelectronics'))) {
          return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' && navigator.onLine);
  const { toast } = useToast();

  // --- Derived stock balances ---
  const stockBalances = useMemo(() => {
    const balances = new Map<string, StockBalance>();
    const getKey = (itemId: string, locationId: string) => `${itemId}|${locationId}`;

    // Replay strictly in chronological order. ledgerEntries is kept newest-first for display,
    // and the outbound branch clamps at zero, so replaying newest-first silently drops
    // stock-outs that are processed before the inbound they consume.
    const chronological = [...ledgerEntries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const entry of chronological) {
      // Destination (inbound)
      if (entry.destinationLocationId && entry.quantity > 0) {
        const key = getKey(entry.itemId, entry.destinationLocationId);
        const existing = balances.get(key) || {
          itemId: entry.itemId,
          locationId: entry.destinationLocationId,
          locationName: entry.destinationLocationName || entry.destinationLocationId,
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          averageUnitCost: 0,
          totalValue: 0,
          lastUpdated: entry.createdAt,
        };
        const newQty = existing.quantityOnHand + entry.quantity;
        const newCost = ((existing.averageUnitCost * existing.quantityOnHand) + ((entry.unitCost ?? 0) * entry.quantity)) / newQty;
        balances.set(key, {
          ...existing,
          quantityOnHand: newQty,
          quantityAvailable: newQty - existing.quantityReserved,
          averageUnitCost: newCost,
          totalValue: newQty * newCost,
          lastUpdated: entry.createdAt,
        });
      }
      // Source (outbound)
      if (entry.sourceLocationId && entry.quantity > 0) {
        const key = getKey(entry.itemId, entry.sourceLocationId);
        const existing = balances.get(key) || {
          itemId: entry.itemId,
          locationId: entry.sourceLocationId,
          locationName: entry.sourceLocationName || entry.sourceLocationId,
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          averageUnitCost: 0,
          totalValue: 0,
          lastUpdated: entry.createdAt,
        };
        const newQty = Math.max(0, existing.quantityOnHand - entry.quantity);
        balances.set(key, {
          ...existing,
          quantityOnHand: newQty,
          quantityAvailable: Math.max(0, newQty - existing.quantityReserved),
          totalValue: newQty * existing.averageUnitCost,
          lastUpdated: entry.createdAt,
        });
      }
    }

    return Array.from(balances.values());
  }, [ledgerEntries]);

  // Sync item.quantity to default location balance when a ledger balance exists and differs
  useEffect(() => {
    const defaultLoc = locations.find((l) => l.isDefault);
    if (!defaultLoc) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const balance = stockBalances.find((b) => b.itemId === item.id && b.locationId === defaultLoc.id);
        if (balance && balance.quantityOnHand !== item.quantity) {
          changed = true;
          return { ...item, quantity: balance.quantityOnHand };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [stockBalances, locations]);

  // --- Translation ---
  const t = useCallback((key: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) return langDict[key];
    return TRANSLATIONS.en[key] || key;
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('terit_language', lang);
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { userId: user.uid, language: lang, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('terit_theme', newTheme);
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { userId: user.uid, theme: newTheme, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setBusinessType = async (
    type: BusinessType,
    loadPresets = false,
    syncPlan = true
  ): Promise<void> => {
    setBusinessTypeState(type);
    localStorage.setItem('terit_business_type', type);
    if (syncPlan) {
      setTier('free', false);
    }

    const scopeFn = (id: string) => (user && !id.startsWith(`${user.uid}_`) ? `${user.uid}_${id}` : id);

    if (loadPresets && BUSINESS_PRESET_ITEMS[type]) {
      const nextLocations = (BUSINESS_PRESET_LOCATIONS[type] || BUSINESS_PRESET_LOCATIONS.shop).map((loc) => ({
        ...loc,
        id: scopeFn(loc.id),
        userId: user?.uid,
      }));
      const nextWarehouses = (BUSINESS_PRESET_WAREHOUSES[type] || BUSINESS_PRESET_WAREHOUSES.shop).map((wh) => ({
        ...wh,
        id: scopeFn(wh.id),
        userId: user?.uid,
      }));
      const nextSuppliers = (BUSINESS_PRESET_SUPPLIERS[type] || BUSINESS_PRESET_SUPPLIERS.shop).map((sup) => ({
        ...sup,
        id: scopeFn(sup.id),
        userId: user?.uid,
      }));
      const nextItems = BUSINESS_PRESET_ITEMS[type].map((item) => ({
        ...item,
        id: scopeFn(item.id),
        userId: user?.uid,
        locationId: item.locationId ? scopeFn(item.locationId) : nextLocations[0]?.id,
        supplierId: item.supplierId ? scopeFn(item.supplierId) : undefined,
      }));
      const nextPOs = (BUSINESS_PRESET_PURCHASE_ORDERS[type] || []).map((po) => ({
        ...po,
        id: scopeFn(po.id),
        userId: user?.uid,
        supplierId: po.supplierId ? scopeFn(po.supplierId) : '',
        items: po.items.map((line) => ({
          ...line,
          itemId: scopeFn(line.itemId),
        })),
      }));
      const rawPresetLocations = BUSINESS_PRESET_LOCATIONS[type] || BUSINESS_PRESET_LOCATIONS.shop;
      const nextLedger = txsToLedger(BUSINESS_PRESET_TRANSACTIONS[type] || [], scopeFn, user?.uid, rawPresetLocations);

      setLocations(nextLocations);
      setWarehouses(nextWarehouses);
      setSuppliers(nextSuppliers);
      setItems(nextItems);
      setPurchaseOrders(nextPOs);
      setLedgerEntries(nextLedger);

      localStorage.setItem('terit_locations', JSON.stringify(nextLocations));
      localStorage.setItem('terit_warehouses', JSON.stringify(nextWarehouses));
      localStorage.setItem('terit_suppliers', JSON.stringify(nextSuppliers));
      localStorage.setItem('terit_items', JSON.stringify(nextItems));
      localStorage.setItem('terit_pos', JSON.stringify(nextPOs));
      localStorage.setItem('terit_ledger', JSON.stringify(nextLedger));

      if (user) {
        try {
          const userCols = [
            'inventory_items',
            'locations',
            'warehouses',
            'suppliers',
            'purchase_orders',
            'stock_ledger',
          ] as const;
          const existingSnaps = await Promise.all(
            userCols.map((colName) => getDocs(query(collection(db, colName), where('userId', '==', user.uid))))
          );

          const batch = writeBatch(db);
          existingSnaps.forEach((snap, idx) => {
            const colName = userCols[idx];
            snap.forEach((docSnap) => {
              batch.delete(doc(db, colName, docSnap.id));
            });
          });
          for (const loc of nextLocations) batch.set(doc(db, 'locations', loc.id), stripUndefined(loc));
          for (const wh of nextWarehouses) batch.set(doc(db, 'warehouses', wh.id), stripUndefined(wh));
          for (const sup of nextSuppliers) batch.set(doc(db, 'suppliers', sup.id), stripUndefined(sup));
          for (const item of nextItems) batch.set(doc(db, 'inventory_items', item.id), stripUndefined(item));
          for (const po of nextPOs) batch.set(doc(db, 'purchase_orders', po.id), stripUndefined(po));
          for (const tx of nextLedger) batch.set(doc(db, 'stock_ledger', tx.id), stripUndefined(tx));
          await batch.commit();
        } catch (e) {
          console.warn('Preset sync notice:', e);
        }
      }
    } else if (locations.length === 0) {
      // Ensure at least one default store location exists for blank workspaces
      const ts = new Date().toISOString();
      const defaultLoc: Location = {
        id: scopeFn('loc-main'),
        userId: user?.uid,
        name: t('main_branch_default'),
        code: 'MAIN',
        type: 'store',
        isDefault: true,
        createdAt: ts,
        updatedAt: ts,
      };
      setLocations([defaultLoc]);
      setWarehouses([defaultLoc]);
      localStorage.setItem('terit_locations', JSON.stringify([defaultLoc]));
      localStorage.setItem('terit_warehouses', JSON.stringify([defaultLoc]));
      if (user) {
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, 'locations', defaultLoc.id), stripUndefined(defaultLoc));
          batch.set(doc(db, 'warehouses', defaultLoc.id), stripUndefined(defaultLoc));
          await batch.commit();
        } catch (e) {
          console.warn('Default location sync notice:', e);
        }
      }
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { userId: user.uid, businessType: type, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch {}
    }
  };

  const setHasCompletedOnboarding = (completed: boolean) => {
    setHasCompletedOnboardingState(completed);
    localStorage.setItem('terit_onboarding_done', completed ? 'true' : 'false');
  };

  // --- Persistence effects ---
  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_items', JSON.stringify(items));
  }, [items, user, isGuestMode]);

  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_locations', JSON.stringify(locations));
  }, [locations, user, isGuestMode]);

  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_warehouses', JSON.stringify(warehouses));
  }, [warehouses, user, isGuestMode]);

  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_suppliers', JSON.stringify(suppliers));
  }, [suppliers, user, isGuestMode]);

  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries, user, isGuestMode]);

  useEffect(() => {
    if (user || isGuestMode) localStorage.setItem('terit_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders, user, isGuestMode]);

  const setTier = (newTier: PlanTier, syncBusinessType = true) => {
    if (newTier !== 'free') {
      console.error('Paid plan activation requires server-side payment verification.');
      return;
    }
    setTierState(newTier);
    localStorage.setItem('terit_plan_tier', newTier);
    if (syncBusinessType && newTier !== 'free' && newTier !== 'pro') {
      const matchingBiz = getBusinessTypeForPlan(newTier);
      setBusinessTypeState(matchingBiz);
      localStorage.setItem('terit_business_type', matchingBiz);
      if (user) {
        setDoc(
          doc(db, 'users', user.uid),
          { userId: user.uid, businessType: matchingBiz, planTier: newTier, updatedAt: new Date().toISOString() },
          { merge: true }
        ).catch(() => {});
      }
    } else if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { userId: user.uid, planTier: newTier, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
  };

  // --- Auth ---
  useEffect(() => {
    let snapshotUnsubs: Array<() => void> = [];

    const clearSnapshotListeners = () => {
      for (const unsub of snapshotUnsubs) {
        try {
          unsub();
        } catch {}
      }
      snapshotUnsubs = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      const sessionSeq = ++authSessionSeqRef.current;
      clearSnapshotListeners();
      setUser(currentUser);

      if (currentUser) {
        const userId = currentUser.uid;
        setIsGuestMode(false);
        localStorage.removeItem('terit_guest_mode');
        setJustLoggedOut(false);
        setIsCloudSynced(true);

        const nowIso = new Date().toISOString();
        const savedLang = (localStorage.getItem('terit_language') as SupportedLanguage) || 'en';
        const savedTheme = (localStorage.getItem('terit_theme') as 'light' | 'dark') || 'light';

        try {
          const userDocRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userDocRef);
          if (sessionSeq !== authSessionSeqRef.current) return;

          if (userSnap.exists()) {
            const profileData = userSnap.data() as Record<string, any>;
            if (profileData.language && ['en', 'am', 'om', 'ti', 'so'].includes(profileData.language)) {
              setLanguageState(profileData.language as SupportedLanguage);
              localStorage.setItem('terit_language', profileData.language);
            }
            if (profileData.theme === 'light' || profileData.theme === 'dark') {
              setThemeState(profileData.theme);
              localStorage.setItem('terit_theme', profileData.theme);
            }
            const cloudBiz = profileData.businessType as BusinessType;
            if (cloudBiz && VALID_BUSINESS_TYPES.includes(cloudBiz)) {
              setBusinessTypeState(cloudBiz);
              localStorage.setItem('terit_business_type', cloudBiz);
            }
            setTierState('free');
            localStorage.setItem('terit_plan_tier', 'free');

            const remoteProfile = (profileData.companyProfile || {}) as Partial<CompanyProfile>;
            const mergedProfile: CompanyProfile = {
              ...DEFAULT_COMPANY_PROFILE,
              ...remoteProfile,
              companyName: remoteProfile.companyName || profileData.companyName || '',
              contactName: remoteProfile.contactName || currentUser.displayName || '',
              email: remoteProfile.email || currentUser.email || '',
              subcity: remoteProfile.subcity || remoteProfile.address || '',
              address: remoteProfile.address || remoteProfile.subcity || '',
            };

            const hasStartedSetup =
              remoteProfile.onboardingCompleted === true ||
              Boolean(mergedProfile.companyName.trim());
            const isOnboarded = hasStartedSetup && isCompanyProfileComplete(mergedProfile);
            mergedProfile.onboardingCompleted = isOnboarded;

            setCompanyProfileState(mergedProfile);
            localStorage.setItem('terit_company_profile', JSON.stringify(mergedProfile));
            setHasCompletedOnboardingState(isOnboarded);
            localStorage.setItem('terit_onboarding_done', isOnboarded ? 'true' : 'false');

            if (!hasStartedSetup) {
              setItems([]);
              setLocations([]);
              setWarehouses([]);
              setSuppliers([]);
              setLedgerEntries([]);
              setPurchaseOrders([]);
            }

            await setDoc(
              userDocRef,
              stripUndefined({
                userId,
                email: currentUser.email || undefined,
                displayName: currentUser.displayName || undefined,
                photoURL: currentUser.photoURL || undefined,
                updatedAt: nowIso,
              }),
              { merge: true }
            );
          } else {
            // New Google Sign-Up: initialize fresh profile and prompt Business Model onboarding
            const newProfile: CompanyProfile = {
              ...DEFAULT_COMPANY_PROFILE,
              contactName: currentUser.displayName || '',
              email: currentUser.email || '',
              onboardingCompleted: false,
            };

            setBusinessTypeState('shop');
            localStorage.setItem('terit_business_type', 'shop');
            setTierState('free');
            localStorage.setItem('terit_plan_tier', 'free');
            setCompanyProfileState(newProfile);
            localStorage.setItem('terit_company_profile', JSON.stringify(newProfile));
            setHasCompletedOnboardingState(false);
            localStorage.setItem('terit_onboarding_done', 'false');

            // Clear any guest/stale demo records before the new Google user selects their business model
            setItems([]);
            setLocations([]);
            setWarehouses([]);
            setSuppliers([]);
            setLedgerEntries([]);
            setPurchaseOrders([]);
            await offlineSync.clearOutbox().catch(() => {});

            await setDoc(
              userDocRef,
              stripUndefined({
                userId,
                email: (currentUser.email || '').slice(0, 256),
                displayName: (currentUser.displayName || '').slice(0, 128),
                photoURL: (currentUser.photoURL || '').slice(0, 512),
                tier: 'free',
                planTier: 'free',
                businessType: 'shop',
                language: savedLang,
                theme: savedTheme,
                currency: 'ETB',
                companyProfile: newProfile,
                createdAt: nowIso,
                updatedAt: nowIso,
              })
            );
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }

        if (sessionSeq !== authSessionSeqRef.current) return;

        // Flush only offline records belonging to this account
        try {
          const outbox = await offlineSync.getOutbox();
          const hasMatchingOutbox = outbox.some((entry) => entry.payload?.userId === userId);
          if (hasMatchingOutbox) {
            await offlineSync.syncAll(currentUser);
          }
        } catch {}

        if (sessionSeq !== authSessionSeqRef.current) return;

        const unsubItems = onSnapshot(
          query(collection(db, 'inventory_items'), where('userId', '==', userId)),
          (snap) => {
            const cloudItems: InventoryItem[] = [];
            snap.forEach((d) => cloudItems.push(d.data() as InventoryItem));
            setItems(cloudItems);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'inventory_items')
        );

        const unsubLocations = onSnapshot(
          query(collection(db, 'locations'), where('userId', '==', userId)),
          (snap) => {
            const cloudLocations: Location[] = [];
            snap.forEach((d) => cloudLocations.push(d.data() as Location));
            setLocations(cloudLocations);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'locations')
        );

        const unsubWarehouses = onSnapshot(
          query(collection(db, 'warehouses'), where('userId', '==', userId)),
          (snap) => {
            const cloudWarehouses: Warehouse[] = [];
            snap.forEach((d) => cloudWarehouses.push(d.data() as Warehouse));
            setWarehouses(cloudWarehouses);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'warehouses')
        );

        const unsubSuppliers = onSnapshot(
          query(collection(db, 'suppliers'), where('userId', '==', userId)),
          (snap) => {
            const cloudSuppliers: Supplier[] = [];
            snap.forEach((d) => cloudSuppliers.push(d.data() as Supplier));
            setSuppliers(cloudSuppliers);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'suppliers')
        );

        const unsubLedger = onSnapshot(
          query(collection(db, 'stock_ledger'), where('userId', '==', userId)),
          (snap) => {
            const cloudLedger: StockLedgerEntry[] = [];
            snap.forEach((d) => cloudLedger.push(d.data() as StockLedgerEntry));
            setLedgerEntries(
              cloudLedger.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            );
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'stock_ledger')
        );

        const unsubPOs = onSnapshot(
          query(collection(db, 'purchase_orders'), where('userId', '==', userId)),
          (snap) => {
            const cloudPOs: PurchaseOrder[] = [];
            snap.forEach((d) => cloudPOs.push(d.data() as PurchaseOrder));
            setPurchaseOrders(cloudPOs);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'purchase_orders')
        );

        snapshotUnsubs = [
          unsubItems,
          unsubLocations,
          unsubWarehouses,
          unsubSuppliers,
          unsubLedger,
          unsubPOs,
        ];
        setAuthLoading(false);
      } else {
        setIsCloudSynced(false);
        const guestActive = localStorage.getItem('terit_guest_mode') === 'true';
        setIsGuestMode(guestActive);
        if (!guestActive) {
          setItems([]);
          setLocations([]);
          setWarehouses([]);
          setSuppliers([]);
          setLedgerEntries([]);
          setPurchaseOrders([]);
          setCompanyProfileState(DEFAULT_COMPANY_PROFILE);
          setTierState('free');
          setHasCompletedOnboardingState(false);
        }
        setAuthLoading(false);
      }
    });

    return () => {
      authSessionSeqRef.current += 1;
      clearSnapshotListeners();
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsAuthActionPending(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setJustLoggedOut(false);
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        toast(t('auth_popup_closed_toast'), 'info');
      } else if (code === 'auth/popup-blocked') {
        toast(t('auth_popup_blocked_toast'), 'error');
      } else {
        console.error('Login error:', error);
        toast(t('auth_signin_error_toast'), 'error');
      }
    } finally {
      setIsAuthActionPending(false);
    }
  };

  const logout = async () => {
    setIsAuthActionPending(true);
    try {
      await signOut(auth);
      clearWorkspaceSessionStorage();
      await offlineSync.clearOutbox().catch(() => {});
      setUser(null);
      setIsCloudSynced(false);
      setIsGuestMode(false);
      setItems([]);
      setLocations([]);
      setWarehouses([]);
      setSuppliers([]);
      setLedgerEntries([]);
      setPurchaseOrders([]);
      setCompanyProfileState(DEFAULT_COMPANY_PROFILE);
      setTierState('free');
      setBusinessTypeState('shop');
      setHasCompletedOnboardingState(false);
      setJustLoggedOut(true);
      toast(t('auth_signed_out_toast'), 'info');
    } catch (error) {
      console.error('Logout error:', error);
      toast(t('auth_signout_error_toast'), 'error');
    } finally {
      setIsAuthActionPending(false);
    }
  };

  const enterGuestMode = () => {
    clearWorkspaceSessionStorage();
    localStorage.setItem('terit_guest_mode', 'true');
    localStorage.setItem('terit_onboarding_done', 'false');
    localStorage.setItem('terit_business_type', 'shop');
    setJustLoggedOut(false);
    setBusinessTypeState('shop');
    setTierState('free');
    setCompanyProfileState(DEFAULT_COMPANY_PROFILE);
    setHasCompletedOnboardingState(false);
    setItems([]);
    setLocations([]);
    setWarehouses([]);
    setSuppliers([]);
    setLedgerEntries([]);
    setPurchaseOrders([]);
    setIsGuestMode(true);
  };

  const calculateStatus = (qty: number, min: number): ItemStatus => {
    if (qty <= 0) return 'out_of_stock';
    if (qty <= min) return 'low_stock';
    return 'in_stock';
  };

  // --- Core ledger engine ---
  const now = () => new Date().toISOString();

  const getItemQuantityAtLocation = useCallback((itemId: string, locationId: string): number => {
    const balance = stockBalances.find((b) => b.itemId === itemId && b.locationId === locationId);
    return balance ? balance.quantityOnHand : 0;
  }, [stockBalances]);

  const getStockBalance = useCallback((itemId: string, locationId: string): StockBalance | undefined => {
    return stockBalances.find((b) => b.itemId === itemId && b.locationId === locationId);
  }, [stockBalances]);

  const postLedgerEntry = async (
    entryData: Omit<StockLedgerEntry, 'id' | 'userId' | 'syncStatus' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = 'ledger-' + crypto.randomUUID();
    const ts = now();
    const entry: StockLedgerEntry = {
      ...entryData,
      id,
      userId: user?.uid,
      syncStatus: isOnline && user ? 'synced' : 'pending',
      localId: isOnline && user ? undefined : 'local-' + crypto.randomUUID(),
      createdAt: ts,
      updatedAt: ts,
    };

    // Optimistically update local state
    setLedgerEntries((prev) => [entry, ...prev]);

    // Handle bundle assembly/disassembly
    if (entry.type === 'assembly' || entry.type === 'disassembly') {
      const bundleItem = items.find((i) => i.id === entry.itemId);
      if (bundleItem?.bundleComponents) {
        for (const comp of bundleItem.bundleComponents) {
          const compEntry: Omit<StockLedgerEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
            itemId: comp.itemId,
            itemName: comp.itemName,
            sku: comp.sku,
            type: entry.type === 'assembly' ? 'disassembly' : 'assembly',
            quantity: entry.quantity * comp.quantity,
            sourceLocationId: entry.type === 'assembly' ? entry.sourceLocationId : entry.destinationLocationId,
            sourceLocationName: entry.type === 'assembly' ? entry.sourceLocationName : entry.destinationLocationName,
            destinationLocationId: entry.type === 'assembly' ? entry.destinationLocationId : entry.sourceLocationId,
            destinationLocationName: entry.type === 'assembly' ? entry.destinationLocationName : entry.sourceLocationName,
            unitCost: entry.unitCost ?? 0,
            totalCost: (entry.totalCost ?? 0) * comp.quantity,
            referenceType: entry.type === 'assembly' ? 'bundle_assembly' : 'bundle_disassembly',
            referenceId: entry.id,
            reason: `Bundle ${entry.type === 'assembly' ? 'assembly' : 'disassembly'}: ${bundleItem.name}`,
            syncStatus: entry.syncStatus ?? 'synced',
          };
          setLedgerEntries((prev) => [{ ...compEntry, id: 'ledger-comp-' + crypto.randomUUID(), createdAt: ts, updatedAt: ts, userId: user?.uid, syncStatus: entry.syncStatus ?? 'synced', localId: 'local-comp-' + crypto.randomUUID() }, ...prev]);
        }
      }
    }

    // Persist to Firestore if online
    if (user) {
      try {
        await setDoc(doc(db, 'stock_ledger', id), stripUndefined(entry));
        // Sync item quantities
        const affectedItemIds = new Set([entry.itemId]);
        if (entry.type === 'assembly' || entry.type === 'disassembly') {
          const bundleItem = items.find((i) => i.id === entry.itemId);
          if (bundleItem?.bundleComponents) {
            bundleItem.bundleComponents.forEach((c) => affectedItemIds.add(c.itemId));
          }
        }
        for (const itemId of affectedItemIds) {
          const item = items.find((i) => i.id === itemId);
          if (item) {
            const defaultLoc = locations.find((l) => l.isDefault);
            const locId = entry.destinationLocationId || entry.sourceLocationId || defaultLoc?.id || item.locationId || 'loc-default';
            const balance = stockBalances.find((b) => b.itemId === itemId && b.locationId === locId);
            const baseQty = balance ? balance.quantityOnHand : item.quantity;
            let signedDelta = 0;
            if (entry.itemId === itemId) {
              if (entry.type === 'initial') {
                signedDelta = balance ? entry.quantity : 0;
              } else if (entry.destinationLocationId && !entry.sourceLocationId) {
                signedDelta = entry.quantity;
              } else if (entry.sourceLocationId && !entry.destinationLocationId) {
                signedDelta = -entry.quantity;
              }
            }
            const qty = Math.max(0, baseQty + signedDelta);
            await updateItemFirestore(itemId, { quantity: qty, status: calculateStatus(qty, item.minStockAlert) });
          }
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `stock_ledger/${id}`);
        // Queue for offline sync
        offlineSync.queueOutbox({
          localId: id,
          operation: 'create',
          collection: 'stock_ledger',
          payload: stripUndefined(entry),
        });
      }
    } else {
      offlineSync.queueOutbox({
        localId: id,
        operation: 'create',
        collection: 'stock_ledger',
        payload: stripUndefined(entry),
      });
    }

    return true;
  };

  const updateItemFirestore = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await setDoc(doc(db, 'inventory_items', id), stripUndefined({ ...updates, updatedAt: now() }), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `inventory_items/${id}`);
    }
  };

  // --- Item actions ---
  const addItem = async (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<boolean> => {
    if (tier === 'free' && items.length >= 25) {
      toast(t('free_tier_limit_add_toast'), 'error');
      return false;
    }

    const id = 'item-' + crypto.randomUUID();
    const ts = now();
    const defaultLoc = locations.find((l) => l.isDefault);
    const newItem: InventoryItem = {
      ...itemData,
      id,
      userId: user?.uid,
      locationId: itemData.locationId || defaultLoc?.id || 'loc-default',
      status: calculateStatus(itemData.quantity, itemData.minStockAlert),
      costingMethod: itemData.costingMethod || 'wac',
      isBundle: itemData.isBundle || false,
      bundleComponents: itemData.bundleComponents,
      createdAt: ts,
      updatedAt: ts,
    };

    setItems((prev) => [newItem, ...prev]);

    // Initial inbound ledger entry
    if (newItem.quantity > 0) {
      await postLedgerEntry({
        itemId: id,
        itemName: newItem.name,
        sku: newItem.sku,
        type: 'initial',
        quantity: newItem.quantity,
        sourceLocationId: undefined,
        sourceLocationName: undefined,
        destinationLocationId: newItem.locationId,
        destinationLocationName: defaultLoc?.name || 'Main Warehouse',
        unitCost: newItem.costPrice,
        totalCost: newItem.quantity * newItem.costPrice,
        referenceType: 'initial',
        reason: 'Initial item creation',
      });
    }

    if (user) {
      try {
        await setDoc(doc(db, 'inventory_items', id), stripUndefined(newItem));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `inventory_items/${id}`);
      }
    }

    return true;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    const existing = items.find((i) => i.id === id);
    if (!existing) return false;

    const newQty = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    const newMin = updates.minStockAlert !== undefined ? updates.minStockAlert : existing.minStockAlert;
    const status = calculateStatus(newQty, newMin);

    const updatedItem: InventoryItem = {
      ...existing,
      ...updates,
      userId: existing.userId || user?.uid,
      status,
      updatedAt: now(),
    };

    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));

    if (user) {
      try {
        await setDoc(doc(db, 'inventory_items', id), stripUndefined(updatedItem));
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `inventory_items/${id}`);
      }
    }
    return true;
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'inventory_items', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `inventory_items/${id}`);
      }
    }
    return true;
  };

  // --- Location actions ---
  const addLocation = async (
    locData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = 'loc-' + crypto.randomUUID();
    const ts = now();
    const newLoc: Location = {
      ...locData,
      id,
      userId: user?.uid,
      createdAt: ts,
      updatedAt: ts,
    };
    setLocations((prev) => [...prev, newLoc]);
    if (user) {
      try {
        await setDoc(doc(db, 'locations', id), stripUndefined(newLoc));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `locations/${id}`);
      }
    }
    return true;
  };

  const updateLocation = async (id: string, updates: Partial<Location>): Promise<boolean> => {
    const existing = locations.find((l) => l.id === id);
    if (!existing) return false;
    const updated: Location = { ...existing, ...updates, userId: existing.userId || user?.uid, updatedAt: now() };
    setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
    if (user) {
      try {
        await setDoc(doc(db, 'locations', id), stripUndefined(updated));
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `locations/${id}`);
      }
    }
    return true;
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    const loc = locations.find((l) => l.id === id);
    if (loc?.isDefault) return false;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'locations', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `locations/${id}`);
      }
    }
    return true;
  };

  // --- Ledger actions ---
  const quickAdjustStock = async (
    id: string,
    delta: number,
    reason: string,
    referenceNumber?: string
  ): Promise<boolean> => {
    const item = items.find((i) => i.id === id);
    if (!item) return false;
    const defaultLoc = locations.find((l) => l.isDefault);
    const locId = item.locationId || defaultLoc?.id || 'loc-default';
    return adjustStock(item.id, locId, delta, reason, referenceNumber);
  };

  const recordSale = async (
    itemId: string,
    locationId: string,
    quantity: number,
    unitPrice: number,
    reason?: string,
    referenceId?: string
  ): Promise<boolean> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    const available = getItemQuantityAtLocation(itemId, locationId);
    if (available < quantity) {
      toast(`Insufficient stock at ${locationId}. Available: ${available}`, 'error');
      return false;
    }

    // Bundles are sold from assembled bundle stock (components were already consumed
    // by assembleBundle), so a sale is a plain outbound of the bundle SKU. Previously
    // this deducted components AND posted an *inbound* of the bundle, so selling a
    // bundle increased its stock.
    {
      await postLedgerEntry({
        itemId,
        itemName: item.name,
        sku: item.sku,
        type: 'outbound',
        quantity,
        sourceLocationId: locationId,
        sourceLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
        destinationLocationId: undefined,
        destinationLocationName: undefined,
        unitCost: item.costPrice,
        totalCost: item.costPrice * quantity,
        referenceType: 'sale',
        referenceId,
        reason: reason || `Sale: ${item.name}`,
      });
    }
    return true;
  };

  const recordPurchaseReceipt = async (
    itemId: string,
    locationId: string,
    quantity: number,
    unitCost: number,
    reason?: string,
    referenceId?: string,
    poId?: string
  ): Promise<boolean> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    await postLedgerEntry({
      itemId,
      itemName: item.name,
      sku: item.sku,
      type: 'inbound',
      quantity,
      sourceLocationId: undefined,
      sourceLocationName: undefined,
      destinationLocationId: locationId,
      destinationLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
      unitCost,
      totalCost: quantity * unitCost,
      referenceType: poId ? 'purchase_order' : 'initial',
      referenceId: poId || referenceId,
      reason: reason || `Purchase receipt: ${item.name}`,
    });
    return true;
  };

  const transferStock = async (
    itemId: string,
    sourceLocationId: string,
    targetLocationId: string,
    quantity: number,
    reason?: string
  ): Promise<boolean> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    const available = getItemQuantityAtLocation(itemId, sourceLocationId);
    if (available < quantity) {
      toast(`${t('transfer_insufficient_source_toast')}: ${available}`, 'error');
      return false;
    }

    const sourceLoc = locations.find((l) => l.id === sourceLocationId);
    const targetLoc = locations.find((l) => l.id === targetLocationId);

    // Outbound from source
    await postLedgerEntry({
      itemId,
      itemName: item.name,
      sku: item.sku,
      type: 'transfer',
      quantity,
      sourceLocationId,
      sourceLocationName: sourceLoc?.name || sourceLocationId,
      destinationLocationId: targetLocationId,
      destinationLocationName: targetLoc?.name || targetLocationId,
      unitCost: item.costPrice,
      totalCost: quantity * item.costPrice,
      referenceType: 'transfer',
      reason: reason || `Transfer from ${sourceLoc?.name} to ${targetLoc?.name}`,
    });
    return true;
  };

  const adjustStock = async (
    itemId: string,
    locationId: string,
    delta: number,
    reason: string,
    referenceNumber?: string
  ): Promise<boolean> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    const existingBalance = stockBalances.find((b) => b.itemId === itemId && b.locationId === locationId);
    const currentQty = existingBalance ? existingBalance.quantityOnHand : item.quantity;
    const newQty = Math.max(0, currentQty + delta);

    if (!existingBalance && item.quantity > 0) {
      await postLedgerEntry({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: 'initial',
        quantity: item.quantity,
        sourceLocationId: undefined,
        sourceLocationName: undefined,
        destinationLocationId: locationId,
        destinationLocationName: locations.find((l) => l.id === locationId)?.name || item.location || 'Main Warehouse',
        unitCost: item.costPrice,
        totalCost: item.quantity * item.costPrice,
        referenceType: 'initial',
        reason: 'Opening stock baseline',
      });
    }

    await postLedgerEntry({
      itemId,
      itemName: item.name,
      sku: item.sku,
      type: delta >= 0 ? 'inbound' : 'outbound',
      quantity: Math.abs(delta),
      sourceLocationId: delta < 0 ? locationId : undefined,
      sourceLocationName: delta < 0 ? locations.find((l) => l.id === locationId)?.name : undefined,
      destinationLocationId: delta > 0 ? locationId : undefined,
      destinationLocationName: delta > 0 ? locations.find((l) => l.id === locationId)?.name : undefined,
      unitCost: item.costPrice,
      totalCost: Math.abs(delta) * item.costPrice,
      referenceType: 'stock_adjustment',
      referenceId: referenceNumber,
      reason,
    });

    await updateItem(itemId, { quantity: newQty, status: calculateStatus(newQty, item.minStockAlert) });
    return true;
  };

  // --- Bundle actions ---
  const assembleBundle = async (bundleItemId: string, locationId: string, quantity: number): Promise<boolean> => {
    const bundleItem = items.find((i) => i.id === bundleItemId);
    if (!bundleItem || !bundleItem.isBundle || !bundleItem.bundleComponents) return false;

    // Check component availability
    for (const comp of bundleItem.bundleComponents) {
      const compQty = comp.quantity * quantity;
      const compAvailable = getItemQuantityAtLocation(comp.itemId, locationId);
      if (compAvailable < compQty) {
        toast(`${t('bundle_insufficient_component')}: ${comp.itemName} (${compQty} / ${compAvailable})`, 'error');
        return false;
      }
    }

    // Deduct components
    for (const comp of bundleItem.bundleComponents) {
      await postLedgerEntry({
        itemId: comp.itemId,
        itemName: comp.itemName,
        sku: comp.sku,
        type: 'outbound',
        quantity: comp.quantity * quantity,
        sourceLocationId: locationId,
        sourceLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
        destinationLocationId: undefined,
        destinationLocationName: undefined,
        unitCost: bundleItem.costPrice / bundleItem.bundleComponents.length,
        totalCost: (bundleItem.costPrice / bundleItem.bundleComponents.length) * comp.quantity * quantity,
        referenceType: 'bundle_assembly',
        referenceId: bundleItemId,
        reason: `Bundle assembly: ${bundleItem.name}`,
      });
    }

    // Add bundle
    await postLedgerEntry({
      itemId: bundleItemId,
      itemName: bundleItem.name,
      sku: bundleItem.sku,
      type: 'inbound',
      quantity,
      sourceLocationId: undefined,
      sourceLocationName: undefined,
      destinationLocationId: locationId,
      destinationLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
      unitCost: bundleItem.costPrice,
      totalCost: bundleItem.costPrice * quantity,
      referenceType: 'bundle_assembly',
      referenceId: bundleItemId,
      reason: `Bundle assembly: ${bundleItem.name}`,
    });

    return true;
  };

  const disassembleBundle = async (bundleItemId: string, locationId: string, quantity: number): Promise<boolean> => {
    const bundleItem = items.find((i) => i.id === bundleItemId);
    if (!bundleItem || !bundleItem.isBundle) return false;

    const bundleAvailable = getItemQuantityAtLocation(bundleItemId, locationId);
    if (bundleAvailable < quantity) {
      toast(`${t('bundle_insufficient_stock')}: ${bundleItem.name}`, 'error');
      return false;
    }

    // Deduct bundle
    await postLedgerEntry({
      itemId: bundleItemId,
      itemName: bundleItem.name,
      sku: bundleItem.sku,
      type: 'outbound',
      quantity,
      sourceLocationId: locationId,
      sourceLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
      destinationLocationId: undefined,
      destinationLocationName: undefined,
      unitCost: bundleItem.costPrice,
      totalCost: bundleItem.costPrice * quantity,
      referenceType: 'bundle_disassembly',
      referenceId: bundleItemId,
      reason: `Bundle disassembly: ${bundleItem.name}`,
    });

    // Add components
    for (const comp of (bundleItem.bundleComponents || [])) {
      await postLedgerEntry({
        itemId: comp.itemId,
        itemName: comp.itemName,
        sku: comp.sku,
        type: 'inbound',
        quantity: comp.quantity * quantity,
        sourceLocationId: undefined,
        sourceLocationName: undefined,
        destinationLocationId: locationId,
        destinationLocationName: locations.find((l) => l.id === locationId)?.name || locationId,
        unitCost: bundleItem.costPrice / (bundleItem.bundleComponents?.length || 1),
        totalCost: (bundleItem.costPrice / (bundleItem.bundleComponents?.length || 1)) * comp.quantity * quantity,
        referenceType: 'bundle_disassembly',
        referenceId: bundleItemId,
        reason: `Bundle disassembly: ${bundleItem.name}`,
      });
    }

    return true;
  };

  // --- Reorder recommendations (AI) ---
  const getReorderRecommendations = useCallback((): ReorderRecommendation[] => {
    const recommendations: ReorderRecommendation[] = [];
    const defaultLoc = locations.find((l) => l.isDefault);
    const locId = defaultLoc?.id || 'loc-default';

    const nowMs = Date.now();
    const ninetyDaysAgo = nowMs - 90 * 24 * 60 * 60 * 1000;

    for (const item of items) {
      if (item.isBundle) continue;

      const balance = stockBalances.find((b) => b.itemId === item.id && b.locationId === locId);
      const qtyOnHand = balance ? balance.quantityOnHand : 0;

      // Calculate average daily velocity from outbound ledger entries in last 90 days
      const outboundEntries = ledgerEntries.filter(
        (e) => e.itemId === item.id &&
          ((e.sourceLocationId === locId && e.quantity > 0) || (e.destinationLocationId === undefined && e.type === 'outbound')) &&
          new Date(e.createdAt).getTime() > ninetyDaysAgo
      );

      const totalSold = outboundEntries.reduce((sum, e) => sum + e.quantity, 0);
      const avgDailyVelocity = totalSold / 90;

      const supplier = suppliers.find((s) => s.id === item.supplierId);
      const leadTimeDays = supplier?.leadTimeDays || 7;

      // Reorder point = velocity * lead_time + safety stock (10% of lead time demand)
      const safetyStock = avgDailyVelocity * leadTimeDays * 0.1;
      const reorderPoint = avgDailyVelocity * leadTimeDays + safetyStock;

      if (qtyOnHand <= reorderPoint && avgDailyVelocity > 0) {
        const recommendedQty = Math.ceil(reorderPoint * 2 - qtyOnHand); // 2x coverage
        const urgency = qtyOnHand <= 0 ? 'critical' : qtyOnHand <= reorderPoint * 0.5 ? 'high' : qtyOnHand <= reorderPoint * 0.8 ? 'medium' : 'low';
        recommendations.push({
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          locationId: locId,
          locationName: defaultLoc?.name || 'Main Warehouse',
          quantityOnHand: qtyOnHand,
          averageDailyVelocity: Math.round(avgDailyVelocity * 100) / 100,
          leadTimeDays,
          reorderPoint: Math.ceil(reorderPoint),
          safetyStock: Math.ceil(safetyStock),
          recommendedOrderQuantity: Math.max(recommendedQty, 1),
          estimatedCost: Math.max(recommendedQty, 1) * item.costPrice,
          urgency,
          reason: qtyOnHand <= 0 ? 'Out of stock' : `Below reorder point (${Math.ceil(reorderPoint)})`,
        });
      }
    }

    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [items, ledgerEntries, locations, stockBalances, suppliers]);

  // --- Supplier actions ---
  const addSupplier = async (
    supData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const now = new Date().toISOString();
    const id = 'sup-' + crypto.randomUUID();
    const newSup: Supplier = {
      ...supData,
      id,
      userId: user?.uid,
      createdAt: now,
      updatedAt: now,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'suppliers', id), stripUndefined(newSup));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `suppliers/${id}`);
      }
    }
    return true;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>): Promise<boolean> => {
    const existing = suppliers.find((s) => s.id === id);
    if (!existing) return false;
    const updated: Supplier = { ...existing, ...updates, userId: existing.userId || user?.uid, updatedAt: new Date().toISOString() };
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (user) {
      try {
        await setDoc(doc(db, 'suppliers', id), stripUndefined(updated));
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `suppliers/${id}`);
      }
    }
    return true;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `suppliers/${id}`);
      }
    }
    return true;
  };

  // --- PO actions ---
  const createPurchaseOrder = async (
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const now = new Date().toISOString();
    const id = 'po-' + crypto.randomUUID();
    let totalAmount = 0;
    const totalLandedCost = poData.totalLandedCost || 0;

    const itemsWithLanded: POLineItem[] = poData.items.map((line) => {
      const lineTotal = line.quantity * line.unitCost;
      totalAmount += lineTotal;
      return {
        ...line,
        totalCost: lineTotal,
        landedCostAllocated: line.landedCostAllocated ?? 0,
        landedUnitCost: line.landedUnitCost ?? line.unitCost,
      };
    });

    const resolvedStatus = poData.status || 'draft';
    const cleanOrderDate = (poData.orderDate || now).includes('T')
      ? (poData.orderDate || now).split('T')[0]
      : poData.orderDate;

    const newPO: PurchaseOrder = {
      ...poData,
      id,
      userId: user?.uid,
      items: itemsWithLanded,
      totalAmount,
      totalLandedCost,
      grandTotal: totalAmount + totalLandedCost,
      status: resolvedStatus,
      orderDate: cleanOrderDate,
      createdAt: now,
      updatedAt: now,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'purchase_orders', id), stripUndefined(newPO));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `purchase_orders/${id}`);
      }
    }
    toast(
      t('po_created_toast')
        .replace('{poNumber}', newPO.poNumber)
        .replace('{status}', t(resolvedStatus === 'ordered' ? 'po_status_ordered' : 'po_status_draft')),
      'success'
    );
    return true;
  };

  const updatePurchaseOrder = async (
    id: string,
    updates: Partial<PurchaseOrder>
  ): Promise<boolean> => {
    const existing = purchaseOrders.find((p) => p.id === id);
    if (!existing) return false;
    const updated: PurchaseOrder = { ...existing, ...updates, userId: existing.userId || user?.uid, updatedAt: new Date().toISOString() };
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (user) {
      try {
        await setDoc(doc(db, 'purchase_orders', id), stripUndefined(updated));
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `purchase_orders/${id}`);
      }
    }
    if (updates.status === 'ordered' && existing.status !== 'ordered') {
      toast(t('po_dispatched_toast').replace('{poNumber}', existing.poNumber), 'success');
    } else if (updates.status === 'cancelled' && existing.status !== 'cancelled') {
      toast(t('po_cancelled_toast').replace('{poNumber}', existing.poNumber), 'info');
    }
    return true;
  };

  const receivePurchaseOrder = async (id: string): Promise<boolean> => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po || po.status === 'received' || po.status === 'cancelled') return false;

    const now = new Date().toISOString();
    const defaultLoc = locations.find((l) => l.isDefault) || locations[0];
    const fallbackLocId = defaultLoc?.id || 'loc-default';
    let totalUnitsReceived = 0;

    for (const line of po.items) {
      const item = items.find((i) => i.id === line.itemId || (line.sku && i.sku === line.sku));
      const effectiveUnitCost =
        line.landedUnitCost && line.landedUnitCost > 0 ? line.landedUnitCost : line.unitCost;
      totalUnitsReceived += line.quantity;

      if (item) {
        const targetLocId = item.locationId || fallbackLocId;
        const existingBalance = stockBalances.find(
          (b) => b.itemId === item.id && b.locationId === targetLocId
        );
        const currentQty = existingBalance ? existingBalance.quantityOnHand : item.quantity;

        if (!existingBalance && item.quantity > 0) {
          await postLedgerEntry({
            itemId: item.id,
            itemName: item.name,
            sku: item.sku,
            type: 'initial',
            quantity: item.quantity,
            sourceLocationId: undefined,
            sourceLocationName: undefined,
            destinationLocationId: targetLocId,
            destinationLocationName:
              locations.find((l) => l.id === targetLocId)?.name || item.location || defaultLoc?.name || 'Main Warehouse',
            unitCost: item.costPrice,
            totalCost: item.quantity * item.costPrice,
            referenceType: 'initial',
            reason: 'Opening stock baseline before PO receipt',
          });
        }

        await recordPurchaseReceipt(
          item.id,
          targetLocId,
          line.quantity,
          effectiveUnitCost,
          `Received PO ${po.poNumber} from ${po.supplierName}`,
          po.poNumber,
          po.id
        );

        const nextQty = currentQty + line.quantity;
        await updateItem(item.id, {
          quantity: nextQty,
          costPrice: effectiveUnitCost,
          status: calculateStatus(nextQty, item.minStockAlert),
        });
      } else {
        // Create new item from PO line
        await addItem({
          name: line.name,
          sku: line.sku,
          barcode: '',
          category: 'General Supplies',
          description: `Received via ${po.poNumber}`,
          quantity: line.quantity,
          minStockAlert: Math.max(5, Math.floor(line.quantity * 0.25)),
          unitPrice: Math.round(effectiveUnitCost * 1.35 * 100) / 100,
          costPrice: effectiveUnitCost,
          unitOfMeasure: 'pcs',
          location: defaultLoc?.name || 'Main Warehouse',
          locationId: fallbackLocId,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
        });
      }
    }

    await updatePurchaseOrder(id, {
      status: 'received',
      receivedDate: now.split('T')[0],
      grandTotal: po.grandTotal,
    });

    toast(
      t('po_received_toast')
        .replace('{poNumber}', po.poNumber)
        .replace('{units}', String(totalUnitsReceived)),
      'success'
    );

    return true;
  };

  // --- Warehouse actions (backward compat) ---
  const addWarehouse = async (
    whData: Omit<Warehouse, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    const now = new Date().toISOString();
    const id = 'wh-' + crypto.randomUUID();
    const newWH: Warehouse = {
      ...whData,
      id,
      userId: user?.uid,
      createdAt: now,
    };
    setWarehouses((prev) => [...prev, newWH]);
    if (user) {
      try {
        await setDoc(doc(db, 'warehouses', id), stripUndefined(newWH));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `warehouses/${id}`);
      }
    }
    return true;
  };

  // --- Bulk Import ---
  const importItems = async (newItems: InventoryItem[]): Promise<boolean> => {
    if (tier === 'free' && items.length + newItems.length > 25) {
      toast(t('free_tier_limit_import_toast'), 'error');
      return false;
    }
    const defaultLoc = locations.find((l) => l.isDefault);
    const itemsWithLoc = newItems.map((item) => {
      const scopedId = user && !item.id.startsWith(`${user.uid}_`) ? `${user.uid}_${item.id}` : item.id;
      return {
        ...item,
        id: scopedId,
        userId: user?.uid,
        locationId: item.locationId || defaultLoc?.id || 'loc-default',
      };
    });
    setItems((prev) => [...itemsWithLoc, ...prev]);
    if (user) {
      for (const item of itemsWithLoc) {
        try {
          await setDoc(doc(db, 'inventory_items', item.id), stripUndefined({ ...item, userId: user.uid }));
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `inventory_items/${item.id}`);
        }
      }
    }
    return true;
  };

  // --- Offline sync ---
  const forceSync = async () => {
    try {
      await offlineSync.syncAll(user);
      setIsCloudSynced(true);
      toast(t('offline_sync_success_toast'), 'success');
    } catch (err) {
      console.error('Sync error:', err);
      toast(t('offline_sync_error_toast'), 'error');
    }
  };

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        user,
        authLoading,
        isAuthActionPending,
        isGuestMode,
        justLoggedOut,
        tier,
        alignedPlan: getPlanForBusinessType(businessType),
        getPlanForBusinessType,
        setTier,
        language,
        setLanguage,
        t,
        theme,
        setTheme,
        businessType,
        setBusinessType,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        companyProfile,
        setCompanyProfile,
        items,
        locations,
        warehouses,
        suppliers,
        transactions: ledgerEntries,
        stockBalances,
        purchaseOrders,
        isCloudSynced,
        isOnline,
        syncStatus: isOnline ? 'synced' : 'pending',
        loginWithGoogle,
        logout,
        enterGuestMode,
        addItem,
        updateItem,
        deleteItem,
        addLocation,
        updateLocation,
        deleteLocation,
        postLedgerEntry,
        recordSale,
        recordPurchaseReceipt,
        transferStock,
        adjustStock,
        quickAdjustStock,
        assembleBundle,
        disassembleBundle,
        getStockBalance,
        getItemQuantityAtLocation,
        getReorderRecommendations,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPurchaseOrder,
        updatePurchaseOrder,
        receivePurchaseOrder,
        addWarehouse,
        importItems,
        forceSync,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
