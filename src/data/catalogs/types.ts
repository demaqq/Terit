/**
 * Product catalogs: ready-made item templates per business model. A business picks
 * what it actually stocks (and which sizes/grades), then sets its own quantities and
 * prices. Catalog text is English with the common Ethiopian/Amharic trade name.
 */
export interface CatalogItem {
  /** Stable id within the catalog (used for SKU prefixes and de-duplication). */
  id: string;
  name: string;
  /** Local / Amharic trade name, e.g. ፌሮ ብረት, ቴፍሎን ቴፕ. */
  local?: string;
  /** Unit of measure the item is usually sold in. */
  unit: string;
  /** Sizes / grades / capacities. Each chosen variant becomes its own stock item. */
  variants?: string[];
  /** Quality check or usage note shown to the shop owner. */
  note?: string;
  /** Sells quickly; good to stock when opening. */
  fast?: boolean;
  /** Items per carton/bundle/pallet for order rounding. */
  pack?: number;
  /** Needs a batch number and expiry date. */
  expiry?: boolean;
  /** Must be kept at 2–8°C. */
  cold?: boolean;
}

export interface CatalogCategory {
  id: string;
  name: string;
  local?: string;
  items: CatalogItem[];
}

export type Catalog = CatalogCategory[];

/** Compact item constructor to keep catalog files readable. */
export const it = (
  id: string,
  name: string,
  unit: string,
  extra: Omit<CatalogItem, 'id' | 'name' | 'unit'> = {}
): CatalogItem => ({ id, name, unit, ...extra });
