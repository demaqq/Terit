import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Printer,
  Upload,
  QrCode,
  Edit2,
  Trash2,
  Minus,
  ArrowUpDown,
  Crown,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem, ItemStatus } from '../types/inventory';
import { useToast } from '../components/Toast';
import { escapeHtml, printHtmlDocument } from '../lib/posHardware';

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuotes = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < source.length; i += 1) {
    const character = source[i];

    if (insideQuotes) {
      if (character === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      if (cell.length > 0) throw new Error('Unexpected quote in an unquoted field.');
      insideQuotes = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (insideQuotes) throw new Error('A quoted field is not closed.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
};

const escapeCSVField = (value: string | number): string =>
  `"${String(value).replace(/"/g, '""')}"`;

interface InventoryViewProps {
  onOpenAddItem: () => void;
  onOpenEditItem: (item: InventoryItem) => void;
  onOpenQuickAdjust: (itemId?: string) => void;
  onOpenBarcode: (item: InventoryItem) => void;
  onViewItemDetails: (item: InventoryItem) => void;
  onOpenPricing: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddItem,
  onOpenEditItem,
  onOpenQuickAdjust,
  onOpenBarcode,
  onViewItemDetails,
  onOpenPricing,
}) => {
  const { items, deleteItem, tier, importItems, warehouses, businessType, t } = useInventory();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedSpecs, setSelectedSpecs] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedExpiryWindow, setSelectedExpiryWindow] = useState<string>('all');
  const [selectedStockBand, setSelectedStockBand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'unitPrice' | 'costPrice'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Reset business-specific filters cleanly when the business model changes
  useEffect(() => {
    setSelectedCategory('all');
    setSelectedColor('all');
    setSelectedSize('all');
    setSelectedSpecs('all');
    setSelectedUnit('all');
    setSelectedSupplier('all');
    setSelectedExpiryWindow('all');
    setSelectedStockBand('all');
  }, [businessType]);

  // Distinct attribute option lists
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [items]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.color?.trim()) set.add(i.color.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.size?.trim()) set.add(i.size.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [items]);

  const specsList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.specs?.trim()) set.add(i.specs.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const unitsList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.unitOfMeasure?.trim()) set.add(i.unitOfMeasure.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.supplierName?.trim()) set.add(i.supplierName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (selectedCategory !== 'all') count += 1;
    if (selectedLocation !== 'all') count += 1;
    if (selectedStatus !== 'all') count += 1;
    if (selectedColor !== 'all') count += 1;
    if (selectedSize !== 'all') count += 1;
    if (selectedSpecs !== 'all') count += 1;
    if (selectedUnit !== 'all') count += 1;
    if (selectedSupplier !== 'all') count += 1;
    if (selectedExpiryWindow !== 'all') count += 1;
    if (selectedStockBand !== 'all') count += 1;
    return count;
  }, [
    searchTerm,
    selectedCategory,
    selectedLocation,
    selectedStatus,
    selectedColor,
    selectedSize,
    selectedSpecs,
    selectedUnit,
    selectedSupplier,
    selectedExpiryWindow,
    selectedStockBand,
  ]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setSelectedColor('all');
    setSelectedSize('all');
    setSelectedSpecs('all');
    setSelectedUnit('all');
    setSelectedSupplier('all');
    setSelectedExpiryWindow('all');
    setSelectedStockBand('all');
  };

  // Filter & sort items
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const todayMs = new Date().setHours(0, 0, 0, 0);

    return items
      .filter((item) => {
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.barcode.toLowerCase().includes(q) ||
          (item.batchNumber && item.batchNumber.toLowerCase().includes(q)) ||
          (item.color && item.color.toLowerCase().includes(q)) ||
          (item.size && item.size.toLowerCase().includes(q)) ||
          (item.specs && item.specs.toLowerCase().includes(q)) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(q));

        const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesLoc = selectedLocation === 'all' || item.location === selectedLocation;
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
        const matchesColor =
          selectedColor === 'all' || (item.color || '').trim().toLowerCase() === selectedColor.toLowerCase();
        const matchesSize =
          selectedSize === 'all' || (item.size || '').trim().toLowerCase() === selectedSize.toLowerCase();
        const matchesSpecs =
          selectedSpecs === 'all' || (item.specs || '').trim().toLowerCase() === selectedSpecs.toLowerCase();
        const matchesUnit =
          selectedUnit === 'all' || (item.unitOfMeasure || '').trim().toLowerCase() === selectedUnit.toLowerCase();
        const matchesSupplier =
          selectedSupplier === 'all' || (item.supplierName || '').trim() === selectedSupplier;

        let matchesExpiry = true;
        if (selectedExpiryWindow !== 'all') {
          if (!item.expiryDate) {
            matchesExpiry = selectedExpiryWindow === 'valid';
          } else {
            const expMs = new Date(item.expiryDate).setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24));
            if (selectedExpiryWindow === 'expired') matchesExpiry = diffDays < 0;
            else if (selectedExpiryWindow === 'expiring_7') matchesExpiry = diffDays >= 0 && diffDays <= 7;
            else if (selectedExpiryWindow === 'expiring_14') matchesExpiry = diffDays >= 0 && diffDays <= 14;
            else if (selectedExpiryWindow === 'expiring_30') matchesExpiry = diffDays >= 0 && diffDays <= 30;
            else if (selectedExpiryWindow === 'expiring_90') matchesExpiry = diffDays >= 0 && diffDays <= 90;
            else if (selectedExpiryWindow === 'valid') matchesExpiry = diffDays > 30;
          }
        }

        let matchesStockBand = true;
        if (selectedStockBand === 'below_reorder') {
          matchesStockBand = item.quantity <= item.minStockAlert;
        } else if (selectedStockBand === 'high_value') {
          matchesStockBand = item.quantity * item.unitPrice >= 25000;
        } else if (selectedStockBand === 'healthy') {
          matchesStockBand = item.quantity > item.minStockAlert * 2;
        }

        return (
          matchesSearch &&
          matchesCat &&
          matchesLoc &&
          matchesStatus &&
          matchesColor &&
          matchesSize &&
          matchesSpecs &&
          matchesUnit &&
          matchesSupplier &&
          matchesExpiry &&
          matchesStockBand
        );
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [
    items,
    searchTerm,
    selectedCategory,
    selectedLocation,
    selectedStatus,
    selectedColor,
    selectedSize,
    selectedSpecs,
    selectedUnit,
    selectedSupplier,
    selectedExpiryWindow,
    selectedStockBand,
    sortBy,
    sortDirection,
  ]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Quantity', 'Unit', 'Min Alert', 'Unit Price', 'Cost Price', 'Location', 'Color', 'Size', 'Specs', 'Batch', 'Expiry Date', 'Status'];
    const rows = filteredItems.map((item) =>
      [
        item.name,
        item.sku,
        item.barcode,
        item.category,
        item.quantity,
        item.unitOfMeasure,
        item.minStockAlert,
        item.unitPrice,
        item.costPrice,
        item.location || '',
        item.color || '',
        item.size || '',
        item.specs || '',
        item.batchNumber || '',
        item.expiryDate || '',
        item.status,
      ]
        .map(escapeCSVField)
        .join(',')
    );
    const csvContent = [headers.map(escapeCSVField).join(','), ...rows].join('\r\n');
    const objectUrl = URL.createObjectURL(new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `terit-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleExportPDF = () => {
    const rows = filteredItems.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.sku)}</td><td>${escapeHtml(item.category)}</td>
        <td style="text-align:right">${item.quantity} ${escapeHtml(item.unitOfMeasure)}</td>
        <td style="text-align:right">${item.unitPrice.toFixed(2)} ETB</td>
        <td style="text-align:right">${(item.quantity * item.unitPrice).toFixed(2)} ETB</td>
        <td>${escapeHtml(item.location || '')}</td><td>${escapeHtml(item.status)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(t('nav_inventory'))}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 4px}p{color:#555;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5}</style>
      </head><body><h1>${escapeHtml(t('nav_inventory'))}</h1><p>${escapeHtml(new Date().toLocaleString())} · ${filteredItems.length}</p>
      <table><thead><tr><th>${escapeHtml(t('product_sku'))}</th><th>SKU</th><th>${escapeHtml(t('category'))}</th><th>${escapeHtml(t('on_hand'))}</th><th>${escapeHtml(t('unit_price'))}</th><th>${escapeHtml(t('valuation'))}</th><th>${escapeHtml(t('location'))}</th><th>${escapeHtml(t('status'))}</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    if (!printHtmlDocument(html)) {
      toast(t('print_unavailable_toast'), 'error');
    }
  };

  // CSV Import handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== 'string') throw new Error('The selected file could not be read as text.');
        const records = parseCSV(text);
        if (records.length < 2) throw new Error('The CSV must include a header row and at least one item.');

        const headers = records[0].map((header) => header.trim().toLowerCase());
        const requiredHeaders = ['name', 'sku', 'category', 'quantity', 'unit', 'min alert', 'unit price', 'cost price', 'location'];
        const columnIndexes = new Map(headers.map((header, index) => [header, index]));
        const missingHeaders = requiredHeaders.filter((header) => !columnIndexes.has(header));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}.`);
        }

        const getField = (columns: string[], header: string) =>
          columns[columnIndexes.get(header) ?? -1]?.trim() ?? '';
        const parseNumber = (value: string, label: string, recordNumber: number) => {
          if (value === '') throw new Error(`Row ${recordNumber}: ${label} is required.`);
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error(`Row ${recordNumber}: ${label} must be a non-negative number.`);
          }
          return parsed;
        };

        const imported: InventoryItem[] = [];
        const now = new Date().toISOString();

        for (let i = 1; i < records.length; i += 1) {
          const columns = records[i];
          const recordNumber = i + 1;
          if (columns.length > headers.length) {
            throw new Error(`Row ${recordNumber}: contains more fields than the header row.`);
          }

          const name = getField(columns, 'name');
          const sku = getField(columns, 'sku');
          const category = getField(columns, 'category');
          const unitOfMeasure = getField(columns, 'unit');
          const location = getField(columns, 'location') || warehouses[0]?.name || 'Primary Location';
          if (!name || !sku || !category || !unitOfMeasure) {
            throw new Error(`Row ${recordNumber}: name, SKU, category, and unit are required.`);
          }

          const quantity = parseNumber(getField(columns, 'quantity'), 'Quantity', recordNumber);
          const minStockAlert = parseNumber(getField(columns, 'min alert'), 'Min Alert', recordNumber);
          const unitPrice = parseNumber(getField(columns, 'unit price'), 'Unit Price', recordNumber);
          const costPrice = parseNumber(getField(columns, 'cost price'), 'Cost Price', recordNumber);
          const status: ItemStatus =
            quantity <= 0 ? 'out_of_stock' : quantity <= minStockAlert ? 'low_stock' : 'in_stock';

          imported.push({
            id: `item-imp-${Date.now()}-${i}`,
            name,
            sku,
            barcode: getField(columns, 'barcode'),
            category,
            description: 'Imported via CSV',
            quantity,
            minStockAlert,
            unitPrice,
            costPrice,
            unitOfMeasure,
            location,
            status,
            batchNumber: getField(columns, 'batch') || undefined,
            expiryDate: getField(columns, 'expiry date') || undefined,
            color: getField(columns, 'color') || undefined,
            size: getField(columns, 'size') || undefined,
            specs: getField(columns, 'specs') || undefined,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (await importItems(imported)) {
          toast(t('inv_csv_imported_toast').replace('{count}', String(imported.length)), 'success');
        }
      } catch (err) {
        toast(
          err instanceof Error
            ? t('inv_csv_failed_toast').replace('{error}', err.message)
            : t('inv_csv_read_error_toast'),
          'error'
        );
      }
    };
    reader.onerror = () => toast(t('inv_csv_read_error_toast'), 'error');
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSort = (field: 'name' | 'quantity' | 'unitPrice' | 'costPrice') => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('nav_inventory')}
            </h1>
            <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded terit-glass-sub text-slate-700 dark:text-slate-300">
              {t('inv_items_count_of')
                .replace('{filtered}', String(filteredItems.length))
                .replace('{total}', String(items.length))}
            </span>
            {tier === 'free' && (
              <button
                onClick={onOpenPricing}
                className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                <span>{t('free_plan')} ({items.length}/25 SKUs)</span>
                <Crown className="w-3 h-3 shrink-0" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('inv_subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('import_csv')}</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('export_csv')}</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('export_pdf')}</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_item_btn')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="terit-glass rounded-2xl p-3.5 space-y-3 transition-colors">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Core Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 max-w-full bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{t('all_statuses')}</option>
              <option value="in_stock">{t('in_stock')}</option>
              <option value="low_stock">{t('low_stock')}</option>
              <option value="out_of_stock">{t('out_of_stock')}</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 max-w-full bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{t('all_categories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Warehouse Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 max-w-full bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{t('all_warehouses')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/25 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('filter_clear_btn')} ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Business-Model-Specific Filters Strip */}
        <div className="pt-2.5 border-t border-slate-900/8 dark:border-white/8 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t(`filter_model_strip_${businessType}`) || t('filter_model_strip_other')}</span>
            </span>

            {/* Boutique: Color + Size + Supplier */}
            {businessType === 'shop' && (
              <>
                <select
                  aria-label={t('filter_color')}
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_all_colors')}</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  aria-label={t('filter_size')}
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_all_sizes')}</option>
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Building Materials & Other: Grade/Specs + Unit */}
            {(businessType === 'building' || businessType === 'other') && (
              <>
                <select
                  aria-label={t(`filter_specs_${businessType}`)}
                  value={selectedSpecs}
                  onChange={(e) => setSelectedSpecs(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t(`filter_all_specs_${businessType}`)}</option>
                  {specsList.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>

                <select
                  aria-label={t('filter_unit')}
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_all_units')}</option>
                  {unitsList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Pharmacy, Supermarket, Minimarket: Expiry/Freshness Window + Form/Pack Unit */}
            {(businessType === 'pharmacy' || businessType === 'supermarket' || businessType === 'minimarket') && (
              <>
                <select
                  aria-label={t(`filter_expiry_label_${businessType}`)}
                  value={selectedExpiryWindow}
                  onChange={(e) => setSelectedExpiryWindow(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_expiry_all')}</option>
                  <option value="expired">{t('filter_expiry_expired')}</option>
                  {businessType === 'minimarket' && (
                    <option value="expiring_7">{t('filter_expiry_7')}</option>
                  )}
                  {businessType === 'supermarket' && (
                    <option value="expiring_14">{t('filter_expiry_14')}</option>
                  )}
                  {businessType === 'pharmacy' && (
                    <>
                      <option value="expiring_30">{t('filter_expiry_30')}</option>
                      <option value="expiring_90">{t('filter_expiry_90')}</option>
                    </>
                  )}
                  <option value="valid">{t('filter_expiry_valid')}</option>
                </select>

                <select
                  aria-label={t('filter_unit')}
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_all_units')}</option>
                  {unitsList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Wholesale Store: Stock Band + Bulk Unit */}
            {businessType === 'store' && (
              <>
                <select
                  aria-label={t('filter_stock_band_label')}
                  value={selectedStockBand}
                  onChange={(e) => setSelectedStockBand(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_stock_band_all')}</option>
                  <option value="below_reorder">{t('filter_stock_band_below')}</option>
                  <option value="high_value">{t('filter_stock_band_high_value')}</option>
                  <option value="healthy">{t('filter_stock_band_healthy')}</option>
                </select>

                <select
                  aria-label={t('filter_unit')}
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">{t('filter_all_units')}</option>
                  {unitsList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Supplier Filter across all business models */}
            {suppliersList.length > 0 && (
              <select
                aria-label={t('filter_supplier')}
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">{t('filter_all_suppliers')}</option>
                {suppliersList.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Boutique Quick Color & Size Chips for Instant One-Tap Filtering */}
          {businessType === 'shop' && (colors.length > 0 || sizes.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {colors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mr-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mr-0.5">
                    {t('filter_color')}:
                  </span>
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(selectedColor === c ? 'all' : c)}
                      className={`px-2 py-0.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                        selectedColor === c
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                          : 'bg-white/75 dark:bg-slate-900/75 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {sizes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mr-0.5">
                    {t('filter_size')}:
                  </span>
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(selectedSize === s ? 'all' : s)}
                      className={`px-2 py-0.5 rounded-lg border font-mono font-medium transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                          : 'bg-white/75 dark:bg-slate-900/75 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="terit-glass rounded-2xl overflow-hidden transition-colors">
        {/* Mobile Touch-Optimized Cards View (Visible on mobile screens) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              {t('inv_empty_state')}
            </div>
          ) : (
            filteredItems.map((item) => {
              const itemValuation = item.quantity * item.unitPrice;
              return (
                <div
                  key={item.id}
                  onClick={() => onViewItemDetails(item)}
                  className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span>{item.sku}</span>
                        <span>·</span>
                        <span className="text-slate-400">{item.category}</span>
                      </div>
                      {(item.color || item.size || item.specs) && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {item.color && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                              {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-200">
                              {item.size}
                            </span>
                          )}
                          {item.specs && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-800 dark:text-amber-300">
                              {item.specs}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.status === 'in_stock'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : item.status === 'low_stock'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.status === 'in_stock' ? t('in_stock') : item.status === 'low_stock' ? t('low_stock') : t('out_of_stock')}
                    </span>
                  </div>

                  {/* Stock Quantity & Quick Touch Adjust */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('on_hand')}</div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {item.quantity}{' '}
                        <span className="text-xs font-normal text-slate-400">{item.unitOfMeasure}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenQuickAdjust(item.id)}
                        className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 active:scale-95 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold"
                        title={t('inv_stock_out')}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenQuickAdjust(item.id)}
                        className="w-10 h-10 rounded-xl bg-amber-500 active:scale-95 text-slate-950 flex items-center justify-center font-bold shadow-xs"
                        title={t('inv_stock_in')}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing & Location */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="text-slate-500">
                      {t('unit_price')}: <strong className="text-slate-900 dark:text-white">{item.unitPrice.toFixed(2)} ETB</strong>
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 font-bold">
                      {t('valuation')}: {itemValuation.toFixed(2)} ETB
                    </div>
                  </div>

                  {/* Batch / Expiry */}
                  {item.expiryDate && (
                    <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg flex items-center justify-between">
                      <span>{t('batch_lot')}: {item.batchNumber || t('not_available_short')}</span>
                      <span>{t('exp_short')}: {item.expiryDate}</span>
                    </div>
                  )}

                  {/* Mobile Actions Bar */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenBarcode(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{t('inv_barcode_btn')}</span>
                    </button>
                    <button
                      onClick={() => onOpenEditItem(item)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      title={t('item_details_edit_btn')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('product_sku')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold">{t('category')}</th>
                <th className="py-3 px-3 font-bold">{t('location')}</th>
                {businessType === 'pharmacy' && (
                  <th className="py-3 px-3 font-bold text-center">{t('inv_batch_expiry_col')}</th>
                )}
                <th
                  onClick={() => toggleSort('quantity')}
                  className="py-3 px-3 font-bold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t('on_hand')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold text-center">{t('status')}</th>
                <th
                  onClick={() => toggleSort('costPrice')}
                  className="py-3 px-3 font-bold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('cost_price')}
                </th>
                <th
                  onClick={() => toggleSort('unitPrice')}
                  className="py-3 px-3 font-bold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('unit_price')}
                </th>
                <th className="py-3 px-3 font-bold text-right">{t('valuation')}</th>
                <th className="py-3 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={businessType === 'pharmacy' ? 10 : 9} className="py-12 text-center text-slate-500">
                    {t('inv_empty_state')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const itemValuation = item.quantity * item.unitPrice;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onViewItemDetails(item)}
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{item.sku}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-slate-400 dark:text-slate-500">{item.barcode}</span>
                          </div>
                          {(item.color || item.size || item.specs) && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {item.color && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-200">
                                  {item.size}
                                </span>
                              )}
                              {item.specs && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-800 dark:text-amber-300">
                                  {item.specs}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <span className="text-xs">{item.category}</span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="text-[11px] truncate block max-w-[140px]">{item.location}</span>
                      </td>

                      {/* Batch & Expiry (Pharmacy specialty) */}
                      {businessType === 'pharmacy' && (
                        <td className="py-3 px-3 text-center font-mono text-[11px]">
                          <div>{item.batchNumber || '—'}</div>
                          {item.expiryDate ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              {item.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Quantity & Quick Adjust */}
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenQuickAdjust(item.id)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title={t('inv_quick_adjust_title')}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onOpenQuickAdjust(item.id)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title={t('inv_quick_adjust_title')}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono text-right mt-0.5">
                          {t('min_alert')}: {item.minStockAlert} {item.unitOfMeasure}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {item.status === 'in_stock' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('in_stock')}
                          </span>
                        )}
                        {item.status === 'low_stock' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {t('low_stock')}
                          </span>
                        )}
                        {item.status === 'out_of_stock' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {t('out_of_stock')}
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        {item.costPrice.toFixed(2)} ETB
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                        {item.unitPrice.toFixed(2)} ETB
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                        {itemValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* Barcode Viewer */}
                          <button
                            onClick={() => onOpenBarcode(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title={t('print_label')}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item */}
                          <button
                            onClick={() => onOpenEditItem(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title={t('item_details_edit_btn')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title={t('delete_item')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-sm w-full p-6 m-auto max-h-[92dvh] overflow-y-auto space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">{t('inv_delete_modal_title')}</h3>
                <p className="text-xs text-slate-500 font-mono truncate">{itemToDelete.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('inv_delete_modal_desc')
                .replace('{name}', itemToDelete.name)
                .replace('{sku}', itemToDelete.sku)}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm"
              >
                {t('confirm_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
