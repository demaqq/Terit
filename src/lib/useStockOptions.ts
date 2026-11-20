import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { BUSINESS_TYPES } from '../i18n/translations';
import { loadCatalog } from '../data/catalogs';

// Units every business may need, on top of its catalog and defaults.
const COMMON_UNITS = ['pcs', 'kg', 'L', 'm', 'm²', 'm³', 'boxes', 'packs', 'cartons', 'bags', 'bottles', 'sets', 'pairs', 'rolls', 'sheets', 'tons'];

const uniq = (list: (string | undefined)[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = (raw || '').trim();
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
};

/**
 * Categories and units a business can choose from: its catalog, its defaults, what it already
 * uses, and the ones it added itself (kept on the company profile so they sync).
 */
export function useStockOptions() {
  const { businessType, items, companyProfile, setCompanyProfile } = useInventory();
  const biz = BUSINESS_TYPES.find((b) => b.id === businessType) || BUSINESS_TYPES[0];
  const [catalogCats, setCatalogCats] = useState<string[]>([]);
  const [catalogUnits, setCatalogUnits] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    loadCatalog(businessType)
      .then((cat) => {
        if (!alive) return;
        setCatalogCats(cat.map((c) => c.name));
        setCatalogUnits(cat.flatMap((c) => c.items.map((i) => i.unit)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [businessType]);

  const customCategories = useMemo(() => companyProfile.customCategories || [], [companyProfile.customCategories]);
  const customUnits = useMemo(() => companyProfile.customUnits || [], [companyProfile.customUnits]);

  const categories = useMemo(
    () => uniq([...customCategories, ...catalogCats, ...biz.defaultCategories, ...items.map((i) => i.category)]),
    [customCategories, catalogCats, biz.defaultCategories, items]
  );
  const units = useMemo(
    () => uniq([...biz.defaultUnits, ...customUnits, ...catalogUnits, ...COMMON_UNITS, ...items.map((i) => i.unitOfMeasure)]),
    [customUnits, catalogUnits, biz.defaultUnits, items]
  );

  const addCustom = useCallback(
    (kind: 'category' | 'unit', value: string): string | null => {
      const v = value.trim().slice(0, kind === 'unit' ? 32 : 100);
      if (!v) return null;
      const list = kind === 'category' ? customCategories : customUnits;
      if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return v;
      setCompanyProfile(kind === 'category' ? { customCategories: [...list, v] } : { customUnits: [...list, v] });
      return v;
    },
    [customCategories, customUnits, setCompanyProfile]
  );

  const removeCustom = useCallback(
    (kind: 'category' | 'unit', value: string) => {
      if (kind === 'category') setCompanyProfile({ customCategories: customCategories.filter((x) => x !== value) });
      else setCompanyProfile({ customUnits: customUnits.filter((x) => x !== value) });
    },
    [customCategories, customUnits, setCompanyProfile]
  );

  return { categories, units, customCategories, customUnits, addCustom, removeCustom };
}
