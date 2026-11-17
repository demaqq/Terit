import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Barcode, Calendar, Sparkles, Sliders, Tag } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';
import { BUSINESS_TYPES } from '../i18n/translations';
import { BUSINESS_NICHE_CONFIG } from '../data/businessPresets';
import { useToast } from '../components/Toast';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: InventoryItem | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  editingItem,
}) => {
  const { addItem, updateItem, suppliers, warehouses, businessType, t } = useInventory();
  const currentBiz = BUSINESS_TYPES.find((b) => b.id === businessType) || BUSINESS_TYPES[0];
  const nicheConfig = BUSINESS_NICHE_CONFIG[businessType] || BUSINESS_NICHE_CONFIG.shop;
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(currentBiz.defaultCategories[0] || 'General');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(nicheConfig.defaultQuantity);
  const [minStockAlert, setMinStockAlert] = useState(nicheConfig.defaultMinAlert);
  const [unitPrice, setUnitPrice] = useState(nicheConfig.defaultUnitPriceETB);
  const [costPrice, setCostPrice] = useState(nicheConfig.defaultCostPriceETB);
  const [unitOfMeasure, setUnitOfMeasure] = useState(currentBiz.defaultUnits[0] || 'pcs');
  const [location, setLocation] = useState(warehouses[0]?.name || 'Primary Location');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [specs, setSpecs] = useState('');
  const [showVariants, setShowVariants] = useState(false);

  const BOUTIQUE_COLORS = ['Black', 'White', 'Navy', 'Brown', 'Tan', 'Beige', 'Red', 'Blue', 'Green', 'Grey'];
  const BOUTIQUE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', '45'];

  // Automated SKU Generator settings
  const [showSkuGenerator, setShowSkuGenerator] = useState(false);
  const [skuPattern, setSkuPattern] = useState<'standard' | 'compact' | 'date_first'>('standard');
  const [skuDelimiter, setSkuDelimiter] = useState<'-' | '_' | '.'>('-');

  // Helper to build smart SKU from category, supplier, and timestamp
  const generatedPreview = useMemo(() => {
    const cleanCat = category.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const catCode = cleanCat.length >= 4 ? cleanCat.slice(0, 4) : (cleanCat + 'XXX').slice(0, 3);

    const selectedSup = suppliers.find((s) => s.id === supplierId);
    let supCode = 'DIR';
    if (selectedSup?.name) {
      const words = selectedSup.name.trim().split(/\s+/);
      if (words.length >= 2) {
        supCode = (words[0][0] + words[1].slice(0, 2)).toUpperCase();
      } else {
        supCode = selectedSup.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'SUP';
      }
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const timeCode = `${yy}${mm}`;
    const salt = '108'; // deterministic preview salt

    let fullSku = '';
    if (skuPattern === 'compact') {
      fullSku = [catCode, timeCode, salt].join(skuDelimiter);
    } else if (skuPattern === 'date_first') {
      fullSku = [timeCode, catCode, supCode, salt].join(skuDelimiter);
    } else {
      fullSku = [catCode, supCode, timeCode, salt].join(skuDelimiter);
    }

    return { catCode, supCode, timeCode, salt, fullSku };
  }, [category, supplierId, suppliers, skuPattern, skuDelimiter]);

  const applyGeneratedSku = () => {
    const salt = String(Math.floor(100 + Math.random() * 900));
    let newSku = '';
    if (skuPattern === 'compact') {
      newSku = [generatedPreview.catCode, generatedPreview.timeCode, salt].join(skuDelimiter);
    } else if (skuPattern === 'date_first') {
      newSku = [generatedPreview.timeCode, generatedPreview.catCode, generatedPreview.supCode, salt].join(skuDelimiter);
    } else {
      newSku = [generatedPreview.catCode, generatedPreview.supCode, generatedPreview.timeCode, salt].join(skuDelimiter);
    }
    setSku(newSku);

    // Also synchronize a complementary numeric EAN/UPC barcode
    const barcodeBase = String(new Date().getFullYear()) + String(Date.now()).slice(-6) + salt.slice(0, 2);
    setBarcode(barcodeBase);
  };

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSku(editingItem.sku);
      setBarcode(editingItem.barcode);
      setCategory(editingItem.category);
      setDescription(editingItem.description);
      setQuantity(editingItem.quantity);
      setMinStockAlert(editingItem.minStockAlert);
      setUnitPrice(editingItem.unitPrice);
      setCostPrice(editingItem.costPrice);
      setUnitOfMeasure(editingItem.unitOfMeasure);
      setLocation(editingItem.location || '');
      setSupplierId(editingItem.supplierId || '');
      setBatchNumber(editingItem.batchNumber || '');
      setExpiryDate(editingItem.expiryDate || '');
      setColor(editingItem.color || '');
      setSize(editingItem.size || '');
      setSpecs(editingItem.specs || '');
      setShowVariants(Boolean(editingItem.color || editingItem.size || businessType === 'shop'));
    } else {
      setName('');
      // Auto-generate smart initial SKU on open
      const initialCat = currentBiz.defaultCategories[0] || 'General';
      const cleanCat = initialCat.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'TRT';
      const now = new Date();
      const timeCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const salt = String(Math.floor(100 + Math.random() * 900));
      setSku(`${cleanCat}-DIR-${timeCode}-${salt}`);
      setBarcode(String(now.getFullYear()) + String(Date.now()).slice(-6) + salt.slice(0, 2));
      setCategory(initialCat);
      setDescription('');
      setQuantity(nicheConfig.defaultQuantity);
      setMinStockAlert(nicheConfig.defaultMinAlert);
      setUnitPrice(nicheConfig.defaultUnitPriceETB);
      setCostPrice(nicheConfig.defaultCostPriceETB);
      setUnitOfMeasure(currentBiz.defaultUnits[0] || 'pcs');
      setLocation(warehouses[0]?.name || 'Primary Location');
      setSupplierId(suppliers[0]?.id || '');
      setBatchNumber(`LOT-${now.getFullYear()}-Q${Math.ceil(Math.random() * 4)}`);
      setExpiryDate('');
      setColor('');
      setSize('');
      setSpecs('');
      setShowVariants(businessType === 'shop');
    }
  }, [editingItem, isOpen, businessType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      toast(t('add_item_error_required') || 'Please fill out product name and SKU.', 'error');
      return;
    }

    const q = Number(quantity);
    const min = Number(minStockAlert);
    const up = Number(unitPrice);
    const cp = Number(costPrice);
    if (![q, min, up, cp].every(Number.isFinite) || q < 0 || min < 0 || up < 0 || cp < 0) {
      toast(t('add_item_error_numbers') || 'Enter valid non-negative numbers for quantity, min stock, and prices.', 'error');
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === supplierId);

    if (editingItem) {
      await updateItem(editingItem.id, {
        name,
        sku,
        barcode: barcode || String(Math.floor(100000000000 + Math.random() * 900000000000)),
        category,
        description,
        quantity: q,
        minStockAlert: min,
        unitPrice: up,
        costPrice: cp,
        unitOfMeasure,
        location,
        supplierId,
        supplierName: selectedSup?.name,
        batchNumber,
        expiryDate: expiryDate || undefined,
        color: color.trim() || undefined,
        size: size.trim() || undefined,
        specs: specs.trim() || undefined,
      });
    } else {
      await addItem({
        name,
        sku,
        barcode: barcode || String(Math.floor(100000000000 + Math.random() * 900000000000)),
        category,
        description,
        quantity: q,
        minStockAlert: min,
        unitPrice: up,
        costPrice: cp,
        unitOfMeasure,
        location,
        supplierId,
        supplierName: selectedSup?.name,
        batchNumber,
        expiryDate: expiryDate || undefined,
        color: color.trim() || undefined,
        size: size.trim() || undefined,
        specs: specs.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold">
            {editingItem ? t('edit_item_title') : `${t('add_item_btn')} · ${t(currentBiz.titleKey)}`}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t('add_item_desc') || 'Enter product parameters, reorder thresholds, pricing, and fulfillment site assignment.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('product_title_label') || 'Product Title / Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={nicheConfig.sampleItemName}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* SKU & Barcode Fields with Automated Generator Tool */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">{t('sku_code_label') || 'SKU Code *'}</label>
                  <button
                    type="button"
                    onClick={() => setShowSkuGenerator(!showSkuGenerator)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{showSkuGenerator ? (t('hide_generator') || 'Hide Generator') : (t('smart_sku_tool') || 'Smart SKU Tool')}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 pr-16"
                  />
                  <button
                    type="button"
                    onClick={applyGeneratedSku}
                    className="absolute right-1.5 top-1.5 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold"
                    title={t('regenerate_sku') || 'Regenerate unique identifier'}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t('barcode_label') || 'Barcode (UPC / EAN-13)'}</label>
                    <button
                      type="button"
                      onClick={() => setBarcode(String(new Date().getFullYear()) + String(Date.now()).slice(-6) + String(Math.floor(10 + Math.random() * 90)))}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono font-medium cursor-pointer"
                    >
                      <Barcode className="w-3 h-3" /> {t('auto_ean') || 'Auto-EAN'}
                    </button>
                  </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* EXPANDABLE SMART SKU GENERATOR TOOL */}
            {showSkuGenerator && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{t('sku_formula_label') || 'Automated SKU Formula: [Category] + [Supplier] + [Timestamp] + [Salt]'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{t('live_configurator') || 'Live Configurator'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">{t('pattern_formula_label') || 'Pattern Formula'}</label>
                    <select
                      value={skuPattern}
                      onChange={(e) => setSkuPattern(e.target.value as any)}
                      className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-200"
                    >
                      <option value="standard">[CAT]-[SUP]-[YYMM]-[SEQ]</option>
                      <option value="compact">[CAT]-[YYMM]-[SEQ]</option>
                      <option value="date_first">[YYMM]-[CAT]-[SUP]-[SEQ]</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">{t('separator_label') || 'Separator'}</label>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {(['-', '_', '.'] as const).map((sep) => (
                        <button
                          key={sep}
                          type="button"
                          onClick={() => setSkuDelimiter(sep)}
                          className={`flex-1 py-0.5 text-center font-mono text-xs rounded ${
                            skuDelimiter === sep ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {sep}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={applyGeneratedSku}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t('apply_to_item') || 'Apply to Item'}</span>
                    </button>
                  </div>
                </div>

                {/* Token breakdown preview pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                  <span className="text-slate-500">{t('components_label') || 'Components:'}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    {t('cat_label') || 'Cat'}: {generatedPreview.catCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                    {t('sup_label') || 'Sup'}: {generatedPreview.supCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    {t('date_label') || 'Date'}: {generatedPreview.timeCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    {t('salt_label') || 'Salt'}: XXX
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('category_label') || 'Category'}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {currentBiz.defaultCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('unit_of_measure_label') || 'Unit of Measure'}</label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {currentBiz.defaultUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Business-Model-Tailored Attributes (Boutique Color/Size & Industry Specs) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {t(`item_specs_label_${businessType}`) || t('item_specs_label_other')}
              </span>
              {businessType !== 'shop' && (
                <button
                  type="button"
                  onClick={() => setShowVariants((prev) => !prev)}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {showVariants ? t('item_hide_color_size_btn') : t('item_add_color_size_btn')}
                </button>
              )}
            </div>

            <div>
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder={t(`item_specs_placeholder_${businessType}`) || t('item_specs_placeholder_other')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {(showVariants || businessType === 'shop') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('item_color_label')}
                  </label>
                  <input
                    type="text"
                    list="terit-color-options"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={t('item_color_placeholder')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="terit-color-options">
                    {BOUTIQUE_COLORS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {BOUTIQUE_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(color === c ? '' : c)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                          color.toLowerCase() === c.toLowerCase()
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('item_size_label')}
                  </label>
                  <input
                    type="text"
                    list="terit-size-options"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder={t('item_size_placeholder')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="terit-size-options">
                    {BOUTIQUE_SIZES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['S', 'M', 'L', 'XL', '41', '42', '43'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(size === s ? '' : s)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                          size.toLowerCase() === s.toLowerCase()
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantity & Safety Alert Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('initial_qty_label') || 'Initial On-Hand Quantity *'}
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('low_stock_threshold_label') || 'Low Stock Threshold (Alert Sentinel) *'}
              </label>
              <input
                type="number"
                min="0"
                required
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Pricing: Cost vs Retail Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {`${t('cost_price') || 'Cost Price'} (ETB)`}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {`${t('unit_price') || 'Retail / Selling Price'} (ETB)`}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('warehouse_location_label') || 'Warehouse / Storage Location'}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('assigned_supplier_label') || 'Assigned Vendor / Supplier'}
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">{t('no_direct_supplier') || '-- No Direct Supplier --'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.leadTimeDays}d {t('lead_time_short') || 'lead time'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch / Lot & Expiry Tracking (Pharmacy, Perishables & Cement Shelf-Life) */}
          {nicheConfig.supportsBatchExpiry && (
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-slate-950/60 border border-amber-200/70 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                <span>{nicheConfig.batchSectionLabel}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('batch_lot_label') || 'Batch / Lot Number'}
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder={t('batch_lot_placeholder') || 'LOT-A102'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {nicheConfig.expiryFieldLabel}
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes / Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('internal_notes_label') || 'Internal Notes / Item Specs'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={nicheConfig.sampleNotesPlaceholder}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors"
            >
              {t('cancel_btn') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-all cursor-pointer"
            >
              {editingItem ? (t('save_changes_btn') || 'Save Changes') : (t('create_item_btn') || 'Create Inventory Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

