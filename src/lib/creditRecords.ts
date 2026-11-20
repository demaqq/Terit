import type { BusinessType } from '../i18n/translations';
import type { CreditRecord } from '../types/inventory';
import { BUSINESS_PRESET_CREDIT_RECORDS } from '../data/businessPresets';

const key = (biz: BusinessType) => `terit_credit_records_${biz}`;

/** Credit (receivable) records for a business, from this device, or the demo set. */
export function loadCreditRecords(biz: BusinessType): CreditRecord[] {
  try {
    const saved = localStorage.getItem(key(biz));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // storage unavailable: fall through to the demo set
  }
  return BUSINESS_PRESET_CREDIT_RECORDS[biz] || BUSINESS_PRESET_CREDIT_RECORDS.shop || [];
}

export function saveCreditRecords(biz: BusinessType, records: CreditRecord[]): void {
  try {
    localStorage.setItem(key(biz), JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('terit:credit-records', { detail: biz }));
  } catch {
    // storage full or blocked: records stay in memory for this session
  }
}

const normalise = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** What a customer still owes across all their open records (matched by phone, else name). */
export function outstandingForCustomer(records: CreditRecord[], name: string, phone: string): number {
  const p = normalise(phone || '');
  const n = normalise(name || '');
  const hasPhone = p.replace(/\D/g, '').length >= 9;
  return records
    .filter((r) => (hasPhone ? normalise(r.customerPhone || '') === p : normalise(r.customerName || '') === n))
    .reduce((sum, r) => sum + Math.max(0, r.remainingAmount || 0), 0);
}

export function isOverdue(r: CreditRecord, now = new Date()): boolean {
  if (r.remainingAmount <= 0 || !r.dueDate) return false;
  return new Date(r.dueDate + 'T23:59:59').getTime() < now.getTime();
}
