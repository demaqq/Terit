export type SupportedLanguage = 'en' | 'am' | 'om' | 'ti' | 'so';

export type BusinessType =
  | 'shop'
  | 'store'
  | 'minimarket'
  | 'supermarket'
  | 'pharmacy'
  | 'building'
  | 'other';

export interface BusinessConfig {
  id: BusinessType;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  iconName: string;
  defaultCategories: string[];
  defaultUnits: string[];
  specialFeatureKey: string;
}

export const BUSINESS_TYPES: BusinessConfig[] = [
  {
    id: 'shop',
    titleKey: 'biz_shop_title',
    descKey: 'biz_shop_desc',
    badgeKey: 'biz_shop_badge',
    iconName: 'ShoppingBag',
    defaultCategories: ['Clothing & Apparel', 'Footwear', 'Electronics', 'Accessories', 'Beauty & Cosmetics', 'Home Goods'],
    defaultUnits: ['pcs', 'pairs', 'sets', 'packs'],
    specialFeatureKey: 'biz_shop_feature',
  },
  {
    id: 'building',
    titleKey: 'biz_building_title',
    descKey: 'biz_building_desc',
    badgeKey: 'biz_building_badge',
    iconName: 'Building2',
    defaultCategories: ['Cement & Concrete', 'Rebar & Steel', 'Bricks & Blocks', 'Roofing & Sheets', 'Sand & Aggregate', 'Plumbing & Electrical'],
    defaultUnits: ['bags', 'tons', 'pcs', 'bundles', 'meters', 'truckloads'],
    specialFeatureKey: 'biz_building_feature',
  },
  {
    id: 'store',
    titleKey: 'biz_store_title',
    descKey: 'biz_store_desc',
    badgeKey: 'biz_store_badge',
    iconName: 'Warehouse',
    defaultCategories: ['Bulk Raw Materials', 'Heavy Packaging', 'Industrial Hardware', 'Pallet Stock', 'Spare Parts'],
    defaultUnits: ['pallets', 'crates', 'tons', 'kg', 'boxes', 'bundles'],
    specialFeatureKey: 'biz_store_feature',
  },
  {
    id: 'minimarket',
    titleKey: 'biz_minimarket_title',
    descKey: 'biz_minimarket_desc',
    badgeKey: 'biz_minimarket_badge',
    iconName: 'Store',
    defaultCategories: ['Dairy & Eggs', 'Bakery & Grains', 'Beverages & Soft Drinks', 'Snacks & Confectionery', 'Canned & Dry Foods', 'Personal Care'],
    defaultUnits: ['pcs', 'cartons', 'bottles', 'cans', 'kg'],
    specialFeatureKey: 'biz_minimarket_feature',
  },
  {
    id: 'supermarket',
    titleKey: 'biz_supermarket_title',
    descKey: 'biz_supermarket_desc',
    badgeKey: 'biz_supermarket_badge',
    iconName: 'ShoppingCart',
    defaultCategories: ['Fresh Produce', 'Butchery & Poultry', 'Dairy & Refrigerated', 'Pantry & Grains', 'Household Cleaners', 'Frozen Goods', 'Personal Hygiene'],
    defaultUnits: ['pcs', 'crates', 'kg', 'packs', 'cartons'],
    specialFeatureKey: 'biz_supermarket_feature',
  },
  {
    id: 'pharmacy',
    titleKey: 'biz_pharmacy_title',
    descKey: 'biz_pharmacy_desc',
    badgeKey: 'biz_pharmacy_badge',
    iconName: 'Cross',
    defaultCategories: ['Prescription Medicines (Rx)', 'Over-the-Counter (OTC)', 'Antibiotics & Vaccines', 'Vitamins & Supplements', 'First Aid & Surgical', 'Baby & Maternal Care'],
    defaultUnits: ['strips', 'boxes', 'bottles', 'vials', 'tablets', 'ampoules'],
    specialFeatureKey: 'biz_pharmacy_feature',
  },
  {
    id: 'other',
    titleKey: 'biz_other_title',
    descKey: 'biz_other_desc',
    badgeKey: 'biz_other_badge',
    iconName: 'Building',
    defaultCategories: ['General Supplies', 'Hardware & Tools', 'Finished Goods', 'Parts & Consumables'],
    defaultUnits: ['pcs', 'units', 'boxes', 'kg', 'meters'],
    specialFeatureKey: 'biz_other_feature',
  },
];

import en from './locales/en';

/**
 * English ships with the app and is the fallback for every missing key. Other languages
 * are separate chunks fetched only when chosen, so most users download one language.
 */
export const TRANSLATIONS_EN: Record<string, string> = en;

const LOCALE_LOADERS: Record<Exclude<SupportedLanguage, 'en'>, () => Promise<{ default: Record<string, string> }>> = {
  am: () => import('./locales/am'),
  om: () => import('./locales/om'),
  ti: () => import('./locales/ti'),
  so: () => import('./locales/so'),
};

const loadedLocales: Partial<Record<SupportedLanguage, Record<string, string>>> = { en };

export function getLoadedLocale(lang: SupportedLanguage): Record<string, string> | undefined {
  return loadedLocales[lang];
}

export async function loadLocale(lang: SupportedLanguage): Promise<Record<string, string>> {
  const cached = loadedLocales[lang];
  if (cached) return cached;
  const loader = LOCALE_LOADERS[lang as Exclude<SupportedLanguage, 'en'>];
  if (!loader) return en;
  const mod = await loader();
  loadedLocales[lang] = mod.default;
  return mod.default;
}
