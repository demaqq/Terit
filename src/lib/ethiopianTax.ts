export interface TaxCalculationResult {
  subtotalETB: number;
  vatAmountETB: number;
  totAmountETB: number;
  withholdingETB: number;
  grandTotalETB: number;
  isVatRegistered: boolean;
  tinNumber: string;
}

export interface TaxSettings {
  isVatRegistered: boolean;
  vatRate: number; // default 0.15 (15%)
  isTotApplicable: boolean;
  totRate: number; // 0.02 for goods, 0.10 for services
  isWithholdingApplicable: boolean; // 2% for commercial purchases >= 10,000 ETB
  tinNumber: string;
  vatRegistrationNo: string;
}

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  isVatRegistered: true,
  vatRate: 0.15,
  isTotApplicable: false,
  totRate: 0.02,
  isWithholdingApplicable: false,
  tinNumber: '',
  vatRegistrationNo: '',
};

export const validateEthiopianTIN = (tin: string): boolean => {
  const clean = tin.trim();
  // Ethiopian TIN is typically 10 digits
  return /^\d{10}$/.test(clean);
};

export const calculateEthiopianTax = (
  items: { price: number; quantity: number; isService?: boolean }[],
  settings: TaxSettings
): TaxCalculationResult => {
  let subtotalETB = 0;
  for (const item of items) {
    subtotalETB += item.price * item.quantity;
  }

  let vatAmountETB = 0;
  let totAmountETB = 0;
  let withholdingETB = 0;

  if (settings.isVatRegistered) {
    vatAmountETB = subtotalETB * settings.vatRate;
  } else if (settings.isTotApplicable) {
    totAmountETB = subtotalETB * settings.totRate;
  }

  if (settings.isWithholdingApplicable && subtotalETB >= 10000) {
    withholdingETB = subtotalETB * 0.02; // 2% withholding tax for qualifying commercial sales
  }

  const grandTotalETB = subtotalETB + vatAmountETB + totAmountETB - withholdingETB;

  return {
    subtotalETB,
    vatAmountETB,
    totAmountETB,
    withholdingETB,
    grandTotalETB,
    isVatRegistered: settings.isVatRegistered,
    tinNumber: settings.tinNumber,
  };
};

export const formatETRReceiptText = (
  storeName: string,
  tin: string,
  vatNo: string,
  receiptNo: string,
  items: { name: string; qty: number; price: number }[],
  taxResult: TaxCalculationResult,
  customerName?: string
): string => {
  const line = '----------------------------------------';
  let text = `\n${storeName.toUpperCase()}\n`;
  text += `TIN: ${tin.trim() || 'N/A'} | VAT No: ${vatNo.trim() || 'N/A'}\n`;
  text += `ETR FISCAL RECEIPT # ${receiptNo}\n`;
  if (customerName?.trim()) {
    text += `Customer: ${customerName.trim()}\n`;
  }
  text += `Date: ${new Date().toLocaleString()}\n`;
  text += `${line}\n`;
  text += `ITEM                 QTY    PRICE    TOTAL\n`;
  text += `${line}\n`;

  for (const item of items) {
    const name = item.name.substring(0, 20).padEnd(20, ' ');
    const qty = String(item.qty).padStart(3, ' ');
    const price = item.price.toFixed(2).padStart(8, ' ');
    const total = (item.qty * item.price).toFixed(2).padStart(8, ' ');
    text += `${name} ${qty} ${price} ${total}\n`;
  }

  text += `${line}\n`;
  text += `SUBTOTAL:          ETB ${taxResult.subtotalETB.toFixed(2).padStart(10, ' ')}\n`;
  if (taxResult.vatAmountETB > 0) {
    text += `VAT (15%):         ETB ${taxResult.vatAmountETB.toFixed(2).padStart(10, ' ')}\n`;
  }
  if (taxResult.totAmountETB > 0) {
    text += `TOT (2%):          ETB ${taxResult.totAmountETB.toFixed(2).padStart(10, ' ')}\n`;
  }
  if (taxResult.withholdingETB > 0) {
    text += `WITHHOLDING (2%): -ETB ${taxResult.withholdingETB.toFixed(2).padStart(9, ' ')}\n`;
  }
  text += `${line}\n`;
  text += `GRAND TOTAL:       ETB ${taxResult.grandTotalETB.toFixed(2).padStart(10, ' ')}\n`;
  text += `${line}\n`;
  text += `   MINISTRY OF REVENUES - ETR VERIFIED   \n`;
  text += `          THANK YOU FOR YOUR BUSINESS!    \n\n`;
  return text;
};
