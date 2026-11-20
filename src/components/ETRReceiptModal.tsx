import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Receipt, Check, Usb, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  DEFAULT_TAX_SETTINGS,
  calculateEthiopianTax,
  formatETRReceiptText,
} from '../lib/ethiopianTax';
import { printViaWindow, WebSerialPrinter } from '../lib/posHardware';
import { useToast } from './Toast';
import { backdrop } from '../lib/dismiss';

interface ETRReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; qty: number; price: number }[];
  customerName?: string;
}

export const ETRReceiptModal: React.FC<ETRReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  customerName,
}) => {
  const { companyProfile, t } = useInventory();
  const { toast } = useToast();
  const [taxSettings, setTaxSettings] = useState(() => ({
    ...DEFAULT_TAX_SETTINGS,
    tinNumber: companyProfile?.tin || '',
  }));
  const [isSerialPrinting, setIsSerialPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTaxSettings((prev) => ({
        ...prev,
        tinNumber: prev.tinNumber || companyProfile?.tin || '',
      }));
      setPrintSuccess(false);
    }
  }, [isOpen, companyProfile?.tin]);

  const receiptNo = useMemo(() => {
    if (!isOpen) return 'ETR-000000';
    return 'ETR-' + Math.floor(100000 + Math.random() * 900000);
  }, [isOpen, items, customerName]);

  if (!isOpen) return null;

  const taxResult = calculateEthiopianTax(
    items.map((i) => ({ price: i.price, quantity: i.qty })),
    taxSettings
  );
  const storeName = companyProfile?.companyName || t('app_name');

  const receiptText = formatETRReceiptText(
    storeName,
    taxSettings.tinNumber,
    taxSettings.vatRegistrationNo,
    receiptNo,
    items,
    taxResult,
    customerName
  );

  const handleBrowserPrint = () => {
    const ok = printViaWindow(receiptText, storeName);
    if (ok) {
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } else {
      toast(t('etr_print_error_toast'), 'error');
    }
  };

  const handleSerialPrint = async () => {
    setIsSerialPrinting(true);
    try {
      const printer = new WebSerialPrinter();
      const success = await printer.printReceipt(receiptText);
      if (success) {
        setPrintSuccess(true);
        setTimeout(() => setPrintSuccess(false), 3000);
      } else {
        toast(t('etr_usb_connect_error_toast'), 'error');
      }
    } catch (e) {
      console.error(e);
      toast(t('etr_thermal_error_toast'), 'error');
    } finally {
      setIsSerialPrinting(false);
    }
  };

  return (
    <div {...backdrop(onClose)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="terit-modal rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 text-slate-900 dark:text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{t('etr_modal_title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('etr_modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close_btn')}
            className="w-8 h-8 rounded-full terit-glass-sub flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tax Config Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl terit-glass-sub text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('etr_tin_label')}</label>
            <input
              type="text"
              value={taxSettings.tinNumber}
              onChange={(e) => setTaxSettings({ ...taxSettings, tinNumber: e.target.value })}
              placeholder={t('onboarding_tin_placeholder')}
              className="w-full px-3 py-1.5 rounded-lg terit-glass bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">{t('etr_vat_reg_label')}</label>
            <input
              type="text"
              value={taxSettings.vatRegistrationNo}
              onChange={(e) => setTaxSettings({ ...taxSettings, vatRegistrationNo: e.target.value })}
              placeholder={t('etr_vat_reg_placeholder')}
              className="w-full px-3 py-1.5 rounded-lg terit-glass bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={taxSettings.isVatRegistered}
                onChange={(e) => setTaxSettings({ ...taxSettings, isVatRegistered: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              {t('etr_apply_vat_15')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={taxSettings.isWithholdingApplicable}
                onChange={(e) => setTaxSettings({ ...taxSettings, isWithholdingApplicable: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              {t('etr_apply_withholding_2')}
            </label>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-tight border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto whitespace-pre">
          {receiptText}
        </div>

        {printSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold">
            <Check className="w-4 h-4" />
            {t('etr_print_success')}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl terit-glass-sub text-xs font-semibold hover:bg-slate-900/5 dark:hover:bg-white/10 cursor-pointer"
          >
            {t('close_btn')}
          </button>
          <button
            onClick={handleSerialPrint}
            disabled={isSerialPrinting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            <Usb className="w-4 h-4" />
            <span>{isSerialPrinting ? t('etr_usb_connecting') : t('etr_print_usb_btn')}</span>
          </button>
          <button
            onClick={handleBrowserPrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>{t('etr_print_receipt_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
