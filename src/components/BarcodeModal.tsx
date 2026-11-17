import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Tag,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';
import { InventoryItem } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

type CodeType = 'barcode' | 'qrcode' | 'dual';
type QrContentMode = 'sku' | 'json' | 'link' | 'custom';

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ isOpen, onClose, item }) => {
  const { t } = useInventory();
  const [codeType, setCodeType] = useState<CodeType>('dual');
  const [qrContentMode, setQrContentMode] = useState<QrContentMode>('json');
  const [customText, setCustomText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Active target values
  const activeSku = item?.sku || '';
  const activeBarcode = item?.barcode || item?.sku || '';
  const activeName = item?.name || t('barcode_sample_product');
  const activePrice = item?.unitPrice ?? 0;
  const activeLocation = item?.location || t('not_assigned');
  const activeUnit = item?.unitOfMeasure || 'pcs';
  const activeBatch = item?.batchNumber || t('not_available_short');
  const activeExpiry = item?.expiryDate || '';

  // Compute payload for QR Code
  const qrPayload = useMemo(() => {
    if (qrContentMode === 'custom' && customText.trim()) {
      return customText;
    }
    if (qrContentMode === 'link') {
      return `https://app.terit.et/scan?sku=${encodeURIComponent(activeSku)}`;
    }
    if (qrContentMode === 'sku') {
      return activeSku;
    }
    // Full smart JSON payload for handheld camera scanners
    return JSON.stringify({
      sku: activeSku,
      barcode: activeBarcode,
      name: activeName,
      price: activePrice,
      batch: activeBatch,
      expiry: activeExpiry,
      loc: activeLocation,
      app: 'Terit OS',
    });
  }, [qrContentMode, customText, activeSku, activeBarcode, activeName, activePrice, activeBatch, activeExpiry, activeLocation]);

  // Generate QR Code image DataURL
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [qrPayload, isOpen]);

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${activeSku}-QR.png`;
    a.click();
  };

  // 1D Barcode pattern visualization
  const barcodeChars = (activeBarcode + activeSku).split('');
  const barPattern = barcodeChars.map((ch, idx) => {
    const code = ch.charCodeAt(0);
    const width = (code % 3) + 1.5;
    const height = 44 + (code % 12);
    return { width, height, isSpacer: idx % 4 === 0 };
  });

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-xl w-full p-5 sm:p-7 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold">{t('barcode_title')}</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t('barcode_subtitle')}
        </p>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('barcode_code_format')}
              </label>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['dual', 'qrcode', 'barcode'] as const).map((tMode) => (
                <button
                  key={tMode}
                  onClick={() => setCodeType(tMode)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    codeType === tMode
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tMode === 'dual' ? (t('barcode_mode_dual')||'Dual') : tMode === 'qrcode' ? (t('barcode_mode_qr')||'2D QR') : (t('barcode_mode_1d')||'1D Barcode')}
                </button>
              ))}
            </div>
          </div>

          <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('barcode_qr_content')}
              </label>
            <select
              value={qrContentMode}
              onChange={(e) => setQrContentMode(e.target.value as any)}
              className="w-full p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-slate-100"
            >
              <option value="json">{t('barcode_qr_json')}</option>
              <option value="sku">{(t('barcode_qr_sku_only')||'SKU Code Only')} ({activeSku})</option>
              <option value="link">{t('barcode_qr_link')||'Web Scan Link (app.terit.et)'}</option>
              <option value="custom">{t('barcode_qr_custom')}</option>
            </select>
          </div>

          {qrContentMode === 'custom' && (
            <div className="col-span-2">
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('barcode_custom_label')}
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t('barcode_custom_placeholder')}
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
              />
            </div>
          )}
        </div>

        {/* PRINTABLE LABEL CARD */}
        <div
          id="printable-label"
          className="bg-white text-slate-950 p-5 rounded-2xl border-2 border-dashed border-slate-300 shadow-md space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-2">
            <div>
              <div className="text-[9px] font-black tracking-widest text-amber-600 uppercase font-mono">
                {t('app_name')}
              </div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight mt-0.5 line-clamp-1">
                {activeName}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-base font-black font-mono text-slate-900">
                {activePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {t('barcode_price_unit').replace('{unit}', activeUnit)}
              </div>
            </div>
          </div>

          {/* Visual Codes Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
            {/* 2D QR Code */}
            {(codeType === 'qrcode' || codeType === 'dual') && (
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={t('barcode_mode_qr') || '2D QR Code'} className="w-24 h-24 object-contain rounded-lg" />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center text-slate-400">{t('loading')||'Loading...'}</div>
                )}
                <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">{t('barcode_quick_scan')||'2D QUICK-SCAN'}</span>
              </div>
            )}

            {/* 1D Barcode */}
            {(codeType === 'barcode' || codeType === 'dual') && (
              <div className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 border border-slate-200 w-full">
                <div className="flex items-end justify-center gap-[2px] h-12 w-full px-2 overflow-hidden">
                  {barPattern.map((bar, i) => (
                    <div
                      key={i}
                      className="bg-slate-950"
                      style={{
                        width: `${bar.width}px`,
                        height: `${bar.height}px`,
                        marginRight: bar.isSpacer ? '1.5px' : '0px',
                      }}
                    />
                  ))}
                </div>
                <div className="text-center font-mono font-bold text-[11px] tracking-[0.2em] text-slate-900 mt-1">
                  {activeBarcode}
                </div>
              </div>
            )}
          </div>

          {/* Item Meta Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 font-mono border-t border-slate-200 pt-2">
            <div>
              <span className="text-slate-400">{t('sku_short')||'SKU'}:</span> <strong className="text-slate-900">{activeSku}</strong>
            </div>
            <div>
              <span className="text-slate-400">{t('bin_short')||'BIN'}:</span> <strong className="text-slate-900">{activeLocation}</strong>
            </div>
            <div>
              <span className="text-slate-400">{t('lot_short')||'LOT'}:</span> <strong className="text-slate-900">{activeBatch}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400">{t('exp_short') || 'EXP'}:</span>{' '}
              <strong className="text-rose-600">{activeExpiry || t('not_available_short') || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="truncate">            {copied ? t('barcode_copied_btn') : t('barcode_copy_btn')}</span>
          </button>

          <button
            onClick={handleDownloadQr}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('barcode_download_btn')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('barcode_print_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
