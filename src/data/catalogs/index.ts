import type { BusinessType } from '../../i18n/translations';
import type { Catalog } from './types';

export type { Catalog, CatalogCategory, CatalogItem } from './types';

// Catalogs are loaded on demand (only when someone opens the catalog), so they add
// nothing to the app's startup download.
const LOADERS: Record<BusinessType, () => Promise<Catalog>> = {
  building: () => import('./building').then((m) => m.default),
  pharmacy: () => import('./pharmacy').then((m) => m.default),
  supermarket: () => import('./grocery').then((m) => m.supermarket),
  minimarket: () => import('./grocery').then((m) => m.minimarket),
  shop: () => import('./retail').then((m) => m.shop),
  store: () => import('./retail').then((m) => m.store),
  other: () => import('./retail').then((m) => m.other),
};

export function loadCatalog(type: BusinessType): Promise<Catalog> {
  return (LOADERS[type] || LOADERS.other)();
}
