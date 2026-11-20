import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Zap, Snowflake, CalendarClock, Plus, Trash2, X, PackagePlus, Settings2, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from './Toast';
import { loadCatalog, Catalog, CatalogCategory, CatalogItem } from '../data/catalogs';
import { useStockOptions } from '../lib/useStockOptions';
import { allowsFraction } from '../data/businessProfiles';
import { fmt } from '../i18n/fmt';

interface Row {
  key: string;
  item: CatalogItem;
  category: CatalogCategory;
  variant?: string;
  qty: string;
  cost: string;
  price: string;
  min: string;
  batch: string;
  expiry: string;
}

const SIZE_LIKE = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d{2}|\d{1,2}-\d{1,2}[ym])$/;
const itemName = (item: CatalogItem, variant?: string) => (variant ? `${item.name} — ${variant}` : item.name);
const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 10);
const FREE_LIMIT = 25;

const inputCls =
  'w-full min-w-0 px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 tabular-nums';

export const CatalogView: React.FC<{ onOpenAddItem: () => void }> = ({ onOpenAddItem }) => {
  const { items, addItem, locations, profile, businessType, tier, t } = useInventory();
  const { toast } = useToast();
  const stockOptions = useStockOptions();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newUnit, setNewUnit] = useState('');

  useEffect(() => {
    let alive = true;
    setCatalog(null);
    setRows([]);
    setActiveCat('all');
    loadCatalog(businessType).then((c) => alive && setCatalog(c)).catch(() => alive && setCatalog([]));
    return () => {
      alive = false;
    };
  }, [businessType]);

  const inStock = useMemo(() => new Set(items.map((i) => i.name.trim().toLowerCase())), [items]);
  const remaining = tier === 'free' ? Math.max(0, FREE_LIMIT - items.length) : Infinity;
  const selectedKeys = useMemo(() => new Set(rows.map((r) => r.key)), [rows]);

  const visible = useMemo(() => {
    if (!catalog) return [];
    const q = search.trim().toLowerCase();
    return catalog
      .filter((c) => activeCat === 'all' || c.id === activeCat || q)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            !q ||
            i.name.toLowerCase().includes(q) ||
            (i.local || '').includes(search.trim()) ||
            c.name.toLowerCase().includes(q) ||
            (i.variants || []).some((v) => v.toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [catalog, activeCat, search]);

  const toggle = (category: CatalogCategory, item: CatalogItem, variant?: string) => {
    const key = `${item.id}|${variant || ''}`;
    setRows((prev) => {
      if (prev.some((r) => r.key === key)) return prev.filter((r) => r.key !== key);
      return [
        ...prev,
        { key, item, category, variant, qty: '0', cost: '', price: '', min: item.fast ? '10' : '5', batch: '', expiry: '' },
      ];
    });
  };

  const selectFastMovers = () => {
    if (!catalog) return;
    const next = [...rows];
    for (const c of catalog) {
      for (const i of c.items) {
        if (!i.fast) continue;
        for (const v of i.variants?.length ? i.variants : [undefined]) {
          const key = `${i.id}|${v || ''}`;
          if (next.some((r) => r.key === key) || inStock.has(itemName(i, v).toLowerCase())) continue;
          if (next.length >= remaining) break;
          next.push({ key, item: i, category: c, variant: v, qty: '0', cost: '', price: '', min: '10', batch: '', expiry: '' });
          break; // one size per fast item; owners add the other sizes they carry
        }
      }
    }
    setRows(next);
  };

  const update = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addToStock = async () => {
    if (rows.length === 0) return;
    if (rows.length > remaining) {
      toast(fmt(t('catalog_limit_error'), [remaining]), 'error');
      return;
    }
    for (const r of rows) {
      const qty = Number(r.qty), cost = Number(r.cost || 0), price = Number(r.price), min = Number(r.min || 0);
      if (![qty, cost, price, min].every(Number.isFinite) || qty < 0 || cost < 0 || min < 0) {
        toast(fmt(t('catalog_row_invalid'), [itemName(r.item, r.variant)]), 'error');
        return;
      }
      if (!(price > 0)) {
        toast(fmt(t('catalog_price_required'), [itemName(r.item, r.variant)]), 'error');
        return;
      }
      if (!allowsFraction(r.item.unit, profile) && (!Number.isInteger(qty) || !Number.isInteger(min))) {
        toast(fmt(t('catalog_whole_units'), [itemName(r.item, r.variant)]), 'error');
        return;
      }
      if (r.item.expiry && profile.expiry.required && qty > 0 && !r.expiry) {
        toast(fmt(t('catalog_expiry_required'), [itemName(r.item, r.variant)]), 'error');
        return;
      }
    }

    setSaving(true);
    const defaultLoc = locations.find((l) => l.isDefault) || locations[0];
    const usedSkus = new Set(items.map((i) => i.sku.toUpperCase()));
    let added = 0;
    for (const r of rows) {
      let sku = `${slug(r.category.id).slice(0, 3)}-${slug(r.item.id)}${r.variant ? '-' + slug(r.variant) : ''}`;
      for (let n = 2; usedSkus.has(sku); n++) sku = `${sku.replace(/-\d+$/, '')}-${n}`;
      usedSkus.add(sku);
      const sizeLike = r.variant && SIZE_LIKE.test(r.variant);
      const ok = await addItem({
        name: itemName(r.item, r.variant).slice(0, 200),
        sku,
        barcode: '',
        category: r.category.name,
        description: [r.item.local, r.item.note].filter(Boolean).join(' · ').slice(0, 1000),
        quantity: Number(r.qty),
        minStockAlert: Number(r.min || 0),
        unitPrice: Number(r.price),
        costPrice: Number(r.cost || 0),
        unitOfMeasure: r.item.unit,
        location: defaultLoc?.name,
        locationId: defaultLoc?.id,
        size: sizeLike ? r.variant : undefined,
        specs: !sizeLike && r.variant ? r.variant.slice(0, 128) : undefined,
        packSize: r.item.pack,
        batchNumber: r.batch || undefined,
        expiryDate: r.expiry || undefined,
      });
      if (!ok) break;
      added++;
    }
    setSaving(false);
    if (added > 0) {
      toast(fmt(t('catalog_added_toast'), [added]), 'success');
      setRows((prev) => prev.slice(added));
    }
  };

  const totalCost = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.cost) || 0), 0);

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            {t('catalog_title')}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">{t('catalog_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={selectFastMovers} disabled={!catalog}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold terit-glass-sub text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            {t('catalog_select_fast')}
          </button>
          <button type="button" onClick={() => setShowCustomise((v) => !v)} aria-expanded={showCustomise}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold terit-glass-sub text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-800 cursor-pointer">
            <Settings2 className="w-3.5 h-3.5" />
            {t('catalog_customise_btn')}
          </button>
          <button type="button" onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            {t('catalog_custom_item_btn')}
          </button>
        </div>
      </div>

      {/* Customise: own categories and units */}
      {showCustomise && (
        <section className="terit-glass rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ['category', stockOptions.customCategories, newCat, setNewCat, t('catalog_your_categories'), t('option_new_category_ph')],
            ['unit', stockOptions.customUnits, newUnit, setNewUnit, t('catalog_your_units'), t('option_new_unit_ph')],
          ] as const).map(([kind, list, draft, setDraft, label, ph]) => (
            <div key={kind} className="space-y-2 min-w-0">
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</h2>
              <div className="flex flex-wrap gap-1.5">
                {list.length === 0 && <span className="text-xs text-slate-500">{t('catalog_none_yet')}</span>}
                {list.map((v) => (
                  <span key={v} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    {v}
                    <button type="button" onClick={() => stockOptions.removeCustom(kind, v)} aria-label={`${t('remove_btn')} ${v}`} className="p-0.5 rounded-full hover:bg-amber-500/20 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form
                className="flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (stockOptions.addCustom(kind, draft)) setDraft('');
                }}
              >
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={ph} className={inputCls} />
                <button type="submit" className="px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer">{t('option_add_confirm')}</button>
              </form>
            </div>
          ))}
        </section>
      )}

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('catalog_search_ph')} aria-label={t('catalog_search_ph')}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500" />
        </div>
        <select value={activeCat} onChange={(e) => setActiveCat(e.target.value)} aria-label={t('category_label')}
          className="lg:hidden px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100">
          <option value="all">{t('all_categories')}</option>
          {(catalog || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.local ? ` · ${c.local}` : ''}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-4 items-start">
        {/* Category list (desktop) */}
        <nav aria-label={t('category_label')} className="hidden lg:flex flex-col gap-0.5 terit-glass rounded-2xl p-2 sticky top-28">
          {[{ id: 'all', name: t('all_categories'), local: '' } as Pick<CatalogCategory, 'id' | 'name' | 'local'>, ...(catalog || [])].map((c) => {
            const count = c.id === 'all' ? rows.length : rows.filter((r) => r.category.id === c.id).length;
            return (
              <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
                className={`text-left px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2 ${
                  activeCat === c.id ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5'
                }`}>
                <span className="min-w-0">
                  <span className="block truncate">{c.name}</span>
                  {c.local && <span className="block truncate text-[10px] text-slate-500">{c.local}</span>}
                </span>
                {count > 0 && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white tabular-nums">{count}</span>}
              </button>
            );
          })}
        </nav>

        {/* Items */}
        <div className="space-y-4 min-w-0">
          {!catalog && <p className="text-sm text-slate-500 py-10 text-center">{t('loading')}</p>}
          {catalog && visible.length === 0 && <p className="text-sm text-slate-500 py-10 text-center">{t('catalog_no_match')}</p>}
          {visible.map((c) => (
            <section key={c.id} className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {c.name} {c.local && <span className="font-normal text-slate-500">· {c.local}</span>}
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {c.items.map((i) => {
                  const variants = i.variants?.length ? i.variants : [undefined];
                  return (
                    <article key={i.id} className="terit-glass rounded-xl p-3 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{i.name}</h3>
                          {i.local && <p className="text-xs text-slate-600 dark:text-slate-400">{i.local}</p>}
                        </div>
                        <div className="flex flex-wrap justify-end gap-1 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">{i.unit}</span>
                          {i.fast && <span title={t('catalog_fast_badge')} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold inline-flex items-center gap-0.5"><Zap className="w-3 h-3" />{t('catalog_fast_badge')}</span>}
                          {i.cold && <span title="2–8°C" className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-800 dark:text-sky-300 font-semibold inline-flex items-center gap-0.5"><Snowflake className="w-3 h-3" />2–8°C</span>}
                          {i.expiry && <span title={t('expiry_date')} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-800 dark:text-rose-300 inline-flex items-center"><CalendarClock className="w-3 h-3" /></span>}
                        </div>
                      </div>
                      {i.note && <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{i.note}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v) => {
                          const key = `${i.id}|${v || ''}`;
                          const already = inStock.has(itemName(i, v).toLowerCase());
                          const on = selectedKeys.has(key);
                          return (
                            <button key={key} type="button" disabled={already} aria-pressed={on} onClick={() => toggle(c, i, v)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors disabled:cursor-not-allowed ${
                                already
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                  : on
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-amber-500'
                              }`}>
                              {already && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                              {v || (already ? t('catalog_in_stock') : on ? t('catalog_selected') : t('catalog_select'))}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Selection: set quantities and prices, then add */}
      {rows.length > 0 && (
        <section className="terit-glass rounded-2xl p-4 space-y-3" aria-label={t('catalog_selection_title')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{fmt(t('catalog_selection_title_n'), [rows.length])}</h2>
            <button type="button" onClick={() => setRows([])} className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer">{t('catalog_clear')}</button>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] text-slate-600 dark:text-slate-400">
                  <th className="px-1 py-1 font-semibold">{t('product_name')}</th>
                  <th className="px-1 py-1 font-semibold w-20">{t('ledger_quantity')}</th>
                  <th className="px-1 py-1 font-semibold w-24">{t('cost_price')}</th>
                  <th className="px-1 py-1 font-semibold w-24">{t('unit_price')} *</th>
                  <th className="px-1 py-1 font-semibold w-20">{t('min_alert')}</th>
                  {profile.expiry.tracked && <th className="px-1 py-1 font-semibold w-48">{t('batch_lot')} / {t('expiry_date')}</th>}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const frac = allowsFraction(r.item.unit, profile);
                  return (
                    <tr key={r.key} className="border-t border-slate-900/8 dark:border-white/10 align-top">
                      <td className="px-1 py-1.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{itemName(r.item, r.variant)}</div>
                        <div className="text-[10px] text-slate-500">{r.category.name} · {r.item.unit}</div>
                      </td>
                      <td className="px-1 py-1.5"><input aria-label={t('ledger_quantity')} type="number" min="0" step={frac ? 'any' : '1'} value={r.qty} onChange={(e) => update(r.key, { qty: e.target.value })} className={inputCls} /></td>
                      <td className="px-1 py-1.5"><input aria-label={t('cost_price')} type="number" min="0" step="0.01" value={r.cost} onChange={(e) => update(r.key, { cost: e.target.value })} placeholder="0.00" className={inputCls} /></td>
                      <td className="px-1 py-1.5"><input aria-label={t('unit_price')} type="number" min="0" step="0.01" value={r.price} onChange={(e) => update(r.key, { price: e.target.value })} placeholder="0.00" className={inputCls} /></td>
                      <td className="px-1 py-1.5"><input aria-label={t('min_alert')} type="number" min="0" step={frac ? 'any' : '1'} value={r.min} onChange={(e) => update(r.key, { min: e.target.value })} className={inputCls} /></td>
                      {profile.expiry.tracked && (
                        <td className="px-1 py-1.5">
                          {r.item.expiry ? (
                            <div className="flex gap-1">
                              <input aria-label={t('batch_lot')} value={r.batch} onChange={(e) => update(r.key, { batch: e.target.value })} placeholder="LOT" className={`${inputCls} font-mono`} />
                              <input aria-label={t('expiry_date')} type="date" value={r.expiry} onChange={(e) => update(r.key, { expiry: e.target.value })} className={inputCls} />
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-1 py-1.5">
                        <button type="button" onClick={() => setRows((p) => p.filter((x) => x.key !== r.key))} aria-label={t('remove_btn')} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900/8 dark:border-white/10">
            <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {fmt(t('catalog_total_cost'), [totalCost.toLocaleString()])}
              {Number.isFinite(remaining) && (
                <span className={`block ${rows.length > remaining ? 'text-rose-700 dark:text-rose-400 font-semibold' : ''}`}>
                  {fmt(t('catalog_free_slots'), [remaining])}
                </span>
              )}
            </p>
            <button type="button" onClick={addToStock} disabled={saving || rows.length > remaining}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold cursor-pointer">
              <PackagePlus className="w-4 h-4" />
              {fmt(t('catalog_add_n'), [rows.length])}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
