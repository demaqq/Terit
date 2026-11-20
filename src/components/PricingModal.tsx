import React from 'react';
import {
  X,
  Check,
  Crown,
  Sparkles,
  CheckCircle2,
  Warehouse,
  Pill,
  Store,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PlanTier } from '../types/inventory';
import { useToast } from './Toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const {
    tier,
    setTier,
    businessType,
    alignedPlan,
    setCompanyProfile,
    t,
  } = useInventory();
  const { toast } = useToast();

  if (!isOpen) return null;

  const plans = [
    {
      id: 'starter' as PlanTier,
      titleKey: 'starter_plan',
      descKey: 'plan_starter_desc',
      badgeKey: 'biz_shop_badge',
      categoryIcon: Store,
      priceETB: `999 ETB / ${t('per_month_short')}`,
      priceAnnualETB: `9,990 ETB / ${t('per_year_two_free')}`,
      rawETB: 999,
      period: t('monthly_billing'),
      popular: false,
      skuLimitKey: 'biz_spec_sku_limit_shop',
      locationsKey: 'biz_spec_locations_shop',
      scannerKey: 'biz_spec_scanner_shop',
      alertsKey: 'biz_spec_alerts_shop',
      features: [
        'biz_spec_sku_limit_shop',
        'biz_spec_scanner_shop',
        'biz_shop_feature',
        'printable_proforma_title',
      ],
    },
    {
      id: 'pro' as PlanTier,
      titleKey: 'pro_plan',
      descKey: 'plan_pro_desc',
      badgeKey: 'biz_supermarket_badge',
      categoryIcon: Pill,
      priceETB: `1,499 ETB / ${t('per_month_short')}`,
      priceAnnualETB: `14,990 ETB / ${t('per_year_two_free')}`,
      rawETB: 1499,
      period: t('monthly_billing'),
      popular: true,
      skuLimitKey: 'biz_spec_sku_limit_pharmacy',
      locationsKey: 'biz_spec_locations_pharmacy',
      scannerKey: 'biz_spec_scanner_pharmacy',
      alertsKey: 'biz_spec_alerts_pharmacy',
      features: [
        'biz_spec_sku_limit_pharmacy',
        'biz_pharmacy_feature',
        'biz_supermarket_feature',
        'printable_proforma_title',
      ],
    },
    {
      id: 'enterprise' as PlanTier,
      titleKey: 'enterprise_plan',
      descKey: 'plan_enterprise_desc',
      badgeKey: 'biz_store_badge',
      categoryIcon: Warehouse,
      priceETB: `2,499 ETB / ${t('per_month_short')}`,
      priceAnnualETB: `24,990 ETB / ${t('per_year_two_free')}`,
      rawETB: 2499,
      period: t('monthly_billing'),
      popular: false,
      skuLimitKey: 'biz_spec_sku_limit_store',
      locationsKey: 'biz_spec_locations_store',
      scannerKey: 'biz_spec_scanner_store',
      alertsKey: 'biz_spec_alerts_store',
      features: [
        'biz_spec_sku_limit_store',
        'biz_store_feature',
        'biz_other_feature',
        'printable_proforma_title',
      ],
    },
  ];

  const handleStartUpgrade = (selectedTier: PlanTier) => {
    if (selectedTier !== 'free') {
      toast(t('pricing_checkout_unavailable_toast'), 'error');
      return;
    }
    setTier('free');
    setCompanyProfile({
      selectedBMPlan: 'Free Evaluation',
      billingCycle: 'monthly',
      paymentMethod: undefined,
      paymentStatus: 'trial',
      paymentDate: undefined,
      lastPaymentTxId: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-5xl w-full p-5 sm:p-8 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={t('close_btn')}
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div>
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold mb-2">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('app_name')} · {t('pricing_modal_title')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {t('pricing_modal_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('pricing_modal_subtitle')}
              </p>
            </div>

            <div className="mb-6 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-900 dark:text-blue-200">
              {t('pricing_reference_notice')}
            </div>

            {/* Recommended plan context */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{t('current_business_sync')}: </span>
                  <strong className="text-slate-900 dark:text-white uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 ml-1">
                    {t(`biz_${businessType}_title`)}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    → {t('aligned_plan_sync')}:{' '}
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">
                      {plans.find((p) => p.id === alignedPlan)?.priceETB}
                    </strong>
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                {t('current_tier_prefix')} {tier === 'free' ? (t('free_evaluation_label')) : t('current_active_plan_btn')}
              </span>
            </div>

            {/* Plans Grid: 3 Core Industry Tiers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {plans.map((p) => {
                const isCurrent =
                  tier === p.id ||
                  (p.id === 'starter' && (tier === 'shop' || (tier as string) === 'minimarket' || (tier as string) === 'building')) ||
                  (p.id === 'pro' && (tier === 'pharmacy' || (tier as string) === 'supermarket')) ||
                  (p.id === 'enterprise' && (tier === 'warehouse' || (tier as string) === 'store'));
                const isAligned =
                  alignedPlan === p.id ||
                  (p.id === 'starter' && (alignedPlan === 'shop' || alignedPlan === 'starter')) ||
                  (p.id === 'pro' && (alignedPlan === 'pharmacy' || alignedPlan === 'pro')) ||
                  (p.id === 'enterprise' && (alignedPlan === 'warehouse' || alignedPlan === 'enterprise'));
                const IconComponent = p.categoryIcon;
                return (
                  <div
                    key={p.id}
                    className={`rounded-3xl p-5 flex flex-col justify-between transition-all relative ${
                      isAligned
                        ? 'bg-amber-50/90 dark:bg-amber-950/30 border border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-500'
                        : p.popular
                        ? 'terit-glass-sub ring-1 ring-slate-900/10 dark:ring-white/10'
                        : 'terit-glass-sub'
                    }`}
                  >
                    {isAligned ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] truncate px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{t('aligned_with_badge')} {t(`biz_${businessType}_title`)}</span>
                      </span>
                    ) : p.popular ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] truncate px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                        {t(p.badgeKey)}
                      </span>
                    ) : null}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {t(p.titleKey)}
                          </h3>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            {t(p.badgeKey)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 min-h-[30px] leading-relaxed">
                        {t(p.descKey)}
                      </p>

                      <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                          {p.priceETB}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {p.priceAnnualETB} · {p.period}
                        </div>
                      </div>

                      {/* Specs Highlights */}
                      <div className="space-y-1 text-[11px] mb-4 font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500">{t('sku_limit_label')}</span>
                          <strong className="text-slate-900 dark:text-white">{t(p.skuLimitKey)}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500">{t('locations_label')}</span>
                          <strong className="text-slate-900 dark:text-white">{t(p.locationsKey)}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500">{t('scanner_spec_label')}</span>
                          <strong className="text-slate-900 dark:text-white truncate max-w-[120px] text-right">
                            {t(p.scannerKey)}
                          </strong>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-500">{t('alerts_spec_label')}</span>
                          <strong className="text-slate-900 dark:text-white truncate max-w-[120px] text-right">
                            {t(p.alertsKey)}
                          </strong>
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-1.5 text-[11px]">
                        {p.features.map((featKey, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300 leading-tight">
                              {t(featKey)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleStartUpgrade(p.id)}
                        className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 cursor-default'
                            : p.popular
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{t('current_active_plan_btn')}</span>
                          </>
                        ) : (
                          <span>{t('upgrade_now_btn')} ({p.priceETB})</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Starter Free Switcher */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  {t('free_eval_forever')}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {t('free_trial_banner_desc')}
                </span>
              </div>
              <button
                onClick={() => handleStartUpgrade('free')}
                className={`px-4 py-1.5 rounded-xl font-semibold text-xs border transition-colors cursor-pointer shrink-0 ${
                  tier === 'free'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent cursor-default'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                {tier === 'free' ? t('free_trial_selected') : t('select_free_eval')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
