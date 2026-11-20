import type { BusinessType } from '../i18n/translations';
import type { InventoryItem } from '../types/inventory';

/**
 * How each business model actually operates. These rules drive core behaviour
 * (reorder maths, expiry enforcement, quantities, credit terms, which screens appear),
 * not just labels. Change a number here and every screen that uses it follows.
 */
export interface BusinessProfile {
  /** Translation key for what this business calls the people it sells to. */
  customerNounKey: string;
  reorder: {
    /** Days of demand to cover beyond the supplier lead time when ordering. */
    coverDays: number;
    /** Extra buffer on top of lead-time demand, as a fraction (0.2 = 20%). */
    safetyFactor: number;
    /** Lead time assumed when the item has no supplier or the supplier has none set. */
    defaultLeadTimeDays: number;
    /** Round order quantities up to the item's pack size (carton, pallet, bundle). */
    roundToPack: boolean;
  };
  expiry: {
    /** Show expiry tracking and warnings at all. */
    tracked: boolean;
    /** New items must have an expiry date. */
    required: boolean;
    /** Expired stock cannot be sold or issued; it can only be written off. */
    blockExpiredIssue: boolean;
    /** Warn this many days before expiry. */
    warnDays: number;
  };
  /** Allow quantities like 2.5 (kg, tons, m³). */
  fractionalQty: boolean;
  credit: {
    /** Default days until a credit sale is due. */
    termDays: number;
    /** Maximum outstanding balance per customer in ETB; null = no limit. */
    limitPerCustomer: number | null;
  };
  /** Screens that do not fit this business; hidden from navigation. */
  hiddenScreens: string[];
  /** The extra dashboard insight this business needs most. */
  insight: 'expiry' | 'receivables';
}

export const BUSINESS_PROFILES: Record<BusinessType, BusinessProfile> = {
  pharmacy: {
    customerNounKey: 'customer_noun_patient',
    reorder: { coverDays: 30, safetyFactor: 0.25, defaultLeadTimeDays: 7, roundToPack: true },
    expiry: { tracked: true, required: true, blockExpiredIssue: true, warnDays: 90 },
    fractionalQty: false,
    credit: { termDays: 14, limitPerCustomer: 5_000 },
    hiddenScreens: ['bundles'],
    insight: 'expiry',
  },
  supermarket: {
    customerNounKey: 'customer_noun_customer',
    reorder: { coverDays: 14, safetyFactor: 0.2, defaultLeadTimeDays: 3, roundToPack: true },
    expiry: { tracked: true, required: false, blockExpiredIssue: true, warnDays: 7 },
    fractionalQty: true,
    credit: { termDays: 30, limitPerCustomer: 50_000 },
    hiddenScreens: [],
    insight: 'expiry',
  },
  minimarket: {
    customerNounKey: 'customer_noun_neighbour',
    reorder: { coverDays: 7, safetyFactor: 0.3, defaultLeadTimeDays: 2, roundToPack: true },
    expiry: { tracked: true, required: false, blockExpiredIssue: true, warnDays: 5 },
    fractionalQty: true,
    credit: { termDays: 7, limitPerCustomer: 2_000 },
    hiddenScreens: ['landed-cost', 'bundles'],
    insight: 'expiry',
  },
  shop: {
    customerNounKey: 'customer_noun_customer',
    reorder: { coverDays: 30, safetyFactor: 0.15, defaultLeadTimeDays: 7, roundToPack: false },
    expiry: { tracked: false, required: false, blockExpiredIssue: false, warnDays: 0 },
    fractionalQty: false,
    credit: { termDays: 14, limitPerCustomer: 10_000 },
    hiddenScreens: ['landed-cost'],
    insight: 'receivables',
  },
  building: {
    customerNounKey: 'customer_noun_contractor',
    reorder: { coverDays: 30, safetyFactor: 0.15, defaultLeadTimeDays: 5, roundToPack: true },
    expiry: { tracked: false, required: false, blockExpiredIssue: false, warnDays: 0 },
    fractionalQty: true,
    credit: { termDays: 30, limitPerCustomer: 200_000 },
    hiddenScreens: ['bundles'],
    insight: 'receivables',
  },
  store: {
    customerNounKey: 'customer_noun_buyer',
    reorder: { coverDays: 45, safetyFactor: 0.1, defaultLeadTimeDays: 14, roundToPack: true },
    expiry: { tracked: true, required: false, blockExpiredIssue: true, warnDays: 30 },
    fractionalQty: true,
    credit: { termDays: 45, limitPerCustomer: 500_000 },
    hiddenScreens: [],
    insight: 'receivables',
  },
  other: {
    customerNounKey: 'customer_noun_client',
    reorder: { coverDays: 30, safetyFactor: 0.15, defaultLeadTimeDays: 7, roundToPack: false },
    expiry: { tracked: false, required: false, blockExpiredIssue: false, warnDays: 0 },
    fractionalQty: true,
    credit: { termDays: 30, limitPerCustomer: null },
    hiddenScreens: [],
    insight: 'receivables',
  },
};

export const getBusinessProfile = (type: BusinessType | string | undefined): BusinessProfile =>
  BUSINESS_PROFILES[(type as BusinessType) || 'shop'] || BUSINESS_PROFILES.shop;

const DAY_MS = 24 * 60 * 60 * 1000;

// Units that can be measured out in parts. Countable units (bags, pcs, boxes, strips,
// pallets) are always whole, even in businesses that also sell by weight.
const MEASURED_UNITS = new Set([
  'kg', 'g', 'gram', 'grams', 'ton', 'tons', 'tonne', 'tonnes', 'quintal', 'quintals',
  'l', 'litre', 'litres', 'liter', 'liters', 'ml',
  'm', 'meter', 'meters', 'metre', 'metres', 'm2', 'm²', 'm3', 'm³', 'sqm', 'cbm', 'ft',
  'truckloads', 'truckload',
]);

/** Whether a quantity of this unit may be fractional in this business. */
export function allowsFraction(unit: string | undefined, profile: BusinessProfile): boolean {
  if (!profile.fractionalQty) return false;
  return MEASURED_UNITS.has((unit || '').trim().toLowerCase());
}

/** Whole days until the item expires (negative once expired); null when it has no expiry date. */
export function daysUntilExpiry(item: Pick<InventoryItem, 'expiryDate'>, now = Date.now()): number | null {
  if (!item.expiryDate) return null;
  const t = new Date(item.expiryDate + (item.expiryDate.length === 10 ? 'T23:59:59' : '')).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - now) / DAY_MS);
}

export type ExpiryState = 'none' | 'ok' | 'soon' | 'expired';

export function expiryState(item: Pick<InventoryItem, 'expiryDate'>, profile: BusinessProfile, now = Date.now()): ExpiryState {
  if (!profile.expiry.tracked) return 'none';
  const days = daysUntilExpiry(item, now);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= profile.expiry.warnDays) return 'soon';
  return 'ok';
}

/** Round an order quantity up to whole packs when the business buys in packs. */
export function roundToPack(qty: number, packSize: number | undefined, profile: BusinessProfile): number {
  if (!profile.reorder.roundToPack || !packSize || packSize <= 1) return qty;
  return Math.ceil(qty / packSize) * packSize;
}

/** Days until a credit sale made today is due, as an ISO date (YYYY-MM-DD). */
export function defaultDueDate(profile: BusinessProfile, from = new Date()): string {
  const d = new Date(from.getTime() + profile.credit.termDays * DAY_MS);
  return d.toISOString().split('T')[0];
}
