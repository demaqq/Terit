import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, HandCoins, ArrowRight } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { daysUntilExpiry, expiryState } from '../data/businessProfiles';
import { loadCreditRecords, isOverdue } from '../lib/creditRecords';
import type { CreditRecord } from '../types/inventory';

const etb = (n: number) => `${Math.round(n).toLocaleString()} ETB`;

/**
 * The one extra number each business model watches daily: expiry risk for
 * pharmacies and food retail, money owed by customers for everyone else.
 */
export const BusinessInsightCard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { items, businessType, profile, t } = useInventory();

  if (profile.insight === 'expiry') {
    return <ExpiryInsight items={items} onNavigate={onNavigate} />;
  }
  return <ReceivablesInsight businessType={businessType} onNavigate={onNavigate} customerNoun={t(profile.customerNounKey)} />;
};

const Shell: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, action, onAction, children }) => (
  <section className="terit-glass rounded-2xl p-5 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
      >
        {action}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string; tone: 'bad' | 'warn' | 'neutral' }> = ({ label, value, tone }) => (
  <div className="rounded-xl terit-glass-sub p-3 min-w-0">
    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{label}</div>
    <div
      className={`mt-1 text-lg font-bold font-mono tabular-nums truncate ${
        tone === 'bad' ? 'text-rose-700 dark:text-rose-400' : tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
      }`}
    >
      {value}
    </div>
  </div>
);

const ExpiryInsight: React.FC<{ items: ReturnType<typeof useInventory>['items']; onNavigate: (tab: string) => void }> = ({
  items,
  onNavigate,
}) => {
  const { profile, t } = useInventory();
  const rows = useMemo(
    () =>
      items
        .filter((i) => i.quantity > 0)
        .map((i) => ({ item: i, state: expiryState(i, profile), days: daysUntilExpiry(i) }))
        .filter((r) => r.state === 'expired' || r.state === 'soon')
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
    [items, profile]
  );
  const expired = rows.filter((r) => r.state === 'expired');
  const soon = rows.filter((r) => r.state === 'soon');
  const valueAtRisk = rows.reduce((sum, r) => sum + r.item.quantity * (r.item.costPrice || 0), 0);

  return (
    <Shell
      icon={<CalendarClock className="w-5 h-5" />}
      title={t('insight_expiry_title')}
      subtitle={t('insight_expiry_subtitle').replace('{days}', String(profile.expiry.warnDays))}
      action={t('nav_inventory')}
      onAction={() => onNavigate('inventory')}
    >
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('insight_expired')} value={String(expired.length)} tone={expired.length ? 'bad' : 'neutral'} />
        <Stat label={t('insight_expiring_soon')} value={String(soon.length)} tone={soon.length ? 'warn' : 'neutral'} />
        <Stat label={t('insight_value_at_risk')} value={etb(valueAtRisk)} tone={valueAtRisk ? 'warn' : 'neutral'} />
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{t('insight_expiry_clear')}</p>
      ) : (
        <ul className="divide-y divide-slate-900/8 dark:divide-white/10 text-xs">
          {rows.slice(0, 4).map(({ item, state, days }) => (
            <li key={item.id} className="py-2 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                {item.name}
                {item.batchNumber ? <span className="text-slate-500 dark:text-slate-400 font-mono"> · {item.batchNumber}</span> : null}
              </span>
              <span
                className={`shrink-0 font-semibold tabular-nums ${
                  state === 'expired' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {state === 'expired'
                  ? t('insight_expired_ago').replace('{days}', String(Math.abs(days ?? 0)))
                  : t('expires_in_days').replace('{days}', String(days ?? 0))}
                {' · '}
                {item.quantity} {item.unitOfMeasure}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
};

const ReceivablesInsight: React.FC<{
  businessType: ReturnType<typeof useInventory>['businessType'];
  customerNoun: string;
  onNavigate: (tab: string) => void;
}> = ({ businessType, customerNoun, onNavigate }) => {
  const { profile, t } = useInventory();
  const [records, setRecords] = useState<CreditRecord[]>(() => loadCreditRecords(businessType));
  useEffect(() => {
    setRecords(loadCreditRecords(businessType));
    const refresh = () => setRecords(loadCreditRecords(businessType));
    window.addEventListener('terit:credit-records', refresh);
    return () => window.removeEventListener('terit:credit-records', refresh);
  }, [businessType]);

  const open = records.filter((r) => r.remainingAmount > 0);
  const overdue = open.filter((r) => isOverdue(r)).sort((a, b) => b.remainingAmount - a.remainingAmount);
  const outstanding = open.reduce((s, r) => s + r.remainingAmount, 0);
  const overdueTotal = overdue.reduce((s, r) => s + r.remainingAmount, 0);

  return (
    <Shell
      icon={<HandCoins className="w-5 h-5" />}
      title={t('insight_receivables_title')}
      subtitle={t('insight_receivables_subtitle').replace('{days}', String(profile.credit.termDays))}
      action={t('nav_credit')}
      onAction={() => onNavigate('credit')}
    >
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('insight_outstanding')} value={etb(outstanding)} tone="neutral" />
        <Stat label={t('insight_overdue')} value={etb(overdueTotal)} tone={overdueTotal ? 'bad' : 'neutral'} />
        <Stat label={t('insight_open_accounts').replace('{noun}', customerNoun)} value={String(open.length)} tone="neutral" />
      </div>
      {overdue.length === 0 ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{t('insight_no_overdue')}</p>
      ) : (
        <ul className="divide-y divide-slate-900/8 dark:divide-white/10 text-xs">
          {overdue.slice(0, 4).map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                {r.customerName}
                <span className="text-slate-500 dark:text-slate-400 font-mono"> · {r.customerPhone}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {etb(r.remainingAmount)} · {t('insight_due')} {r.dueDate}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
};
