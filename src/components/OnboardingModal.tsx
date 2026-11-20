import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Warehouse,
  Store,
  ShoppingCart,
  Building,
  Check,
  Globe,
  Crown,
  CheckCircle2,
  Building2,
  X,
  Pill,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { BusinessType, SupportedLanguage } from '../i18n/translations';
import { PlanTier } from '../types/inventory';
import { useToast } from '../components/Toast';
import {
  isCompanyProfileComplete,
  validateCompanyProfileCriteria,
} from '../lib/validation';
import { fmt } from '../i18n/fmt';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowDismiss?: boolean;
}

interface UnifiedPlanModel {
  id: BusinessType;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  planTitleKey: string;
  tier: PlanTier;
  monthlyETB: number;
  annualETB: number;
  icon: any;
  skuLimitKey: string;
  locationsKey: string;
  scannerKey: string;
  alertsKey: string;
  featureKey: string;
}

const UNIFIED_MODELS: UnifiedPlanModel[] = [
  {
    id: 'shop',
    titleKey: 'biz_shop_title',
    descKey: 'biz_shop_desc',
    badgeKey: 'biz_shop_badge',
    planTitleKey: 'starter_plan',
    tier: 'starter',
    monthlyETB: 999,
    annualETB: 9990,
    icon: ShoppingBag,
    skuLimitKey: 'biz_spec_sku_limit_shop',
    locationsKey: 'biz_spec_locations_shop',
    scannerKey: 'biz_spec_scanner_shop',
    alertsKey: 'biz_spec_alerts_shop',
    featureKey: 'biz_shop_feature',
  },
  {
    id: 'building',
    titleKey: 'biz_building_title',
    descKey: 'biz_building_desc',
    badgeKey: 'biz_building_badge',
    planTitleKey: 'starter_plan',
    tier: 'starter',
    monthlyETB: 999,
    annualETB: 9990,
    icon: Building2,
    skuLimitKey: 'biz_spec_sku_limit_shop',
    locationsKey: 'biz_spec_locations_shop',
    scannerKey: 'biz_spec_scanner_shop',
    alertsKey: 'biz_spec_alerts_shop',
    featureKey: 'biz_building_feature',
  },
  {
    id: 'minimarket',
    titleKey: 'biz_minimarket_title',
    descKey: 'biz_minimarket_desc',
    badgeKey: 'biz_minimarket_badge',
    planTitleKey: 'starter_plan',
    tier: 'starter',
    monthlyETB: 999,
    annualETB: 9990,
    icon: Store,
    skuLimitKey: 'biz_spec_sku_limit_minimarket',
    locationsKey: 'biz_spec_locations_minimarket',
    scannerKey: 'biz_spec_scanner_minimarket',
    alertsKey: 'biz_spec_alerts_minimarket',
    featureKey: 'biz_minimarket_feature',
  },
  {
    id: 'pharmacy',
    titleKey: 'biz_pharmacy_title',
    descKey: 'biz_pharmacy_desc',
    badgeKey: 'biz_pharmacy_badge',
    planTitleKey: 'pro_plan',
    tier: 'pro',
    monthlyETB: 1499,
    annualETB: 14990,
    icon: Pill,
    skuLimitKey: 'biz_spec_sku_limit_pharmacy',
    locationsKey: 'biz_spec_locations_pharmacy',
    scannerKey: 'biz_spec_scanner_pharmacy',
    alertsKey: 'biz_spec_alerts_pharmacy',
    featureKey: 'biz_pharmacy_feature',
  },
  {
    id: 'supermarket',
    titleKey: 'biz_supermarket_title',
    descKey: 'biz_supermarket_desc',
    badgeKey: 'biz_supermarket_badge',
    planTitleKey: 'pro_plan',
    tier: 'pro',
    monthlyETB: 1499,
    annualETB: 14990,
    icon: ShoppingCart,
    skuLimitKey: 'biz_spec_sku_limit_supermarket',
    locationsKey: 'biz_spec_locations_supermarket',
    scannerKey: 'biz_spec_scanner_supermarket',
    alertsKey: 'biz_spec_alerts_supermarket',
    featureKey: 'biz_supermarket_feature',
  },
  {
    id: 'store',
    titleKey: 'biz_store_title',
    descKey: 'biz_store_desc',
    badgeKey: 'biz_store_badge',
    planTitleKey: 'enterprise_plan',
    tier: 'enterprise',
    monthlyETB: 2499,
    annualETB: 24990,
    icon: Warehouse,
    skuLimitKey: 'biz_spec_sku_limit_store',
    locationsKey: 'biz_spec_locations_store',
    scannerKey: 'biz_spec_scanner_store',
    alertsKey: 'biz_spec_alerts_store',
    featureKey: 'biz_store_feature',
  },
  {
    id: 'other',
    titleKey: 'biz_other_title',
    descKey: 'biz_other_desc',
    badgeKey: 'biz_other_badge',
    planTitleKey: 'enterprise_plan',
    tier: 'enterprise',
    monthlyETB: 2499,
    annualETB: 24990,
    icon: Briefcase,
    skuLimitKey: 'biz_spec_sku_limit_other',
    locationsKey: 'biz_spec_locations_other',
    scannerKey: 'biz_spec_scanner_other',
    alertsKey: 'biz_spec_alerts_other',
    featureKey: 'biz_other_feature',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  allowDismiss = true,
}) => {
  const {
    user,
    businessType,
    setBusinessType,
    setTier,
    companyProfile,
    setCompanyProfile,
    language,
    setLanguage,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    t,
  } = useInventory();
  const { toast } = useToast();

  // Wizard Step State: 1 = Choose business type, 2 = Enter company info, 3 = Review and finish setup
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected Unified Business Model & Reference Billing View
  const [selectedType, setSelectedType] = useState<BusinessType>(businessType || 'shop');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    companyProfile?.billingCycle || 'monthly'
  );

  // Step 2: Personal & Company Info Form
  const [companyName, setCompanyName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [subcity, setSubcity] = useState<string>('');
  const [tin, setTin] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [loadPresets, setLoadPresets] = useState<boolean>(!hasCompletedOnboarding);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'companyName' | 'contactName' | 'phone' | 'email' | 'city' | 'address', string>>
  >({});
  const [needsMissingCriteriaNotice, setNeedsMissingCriteriaNotice] = useState<boolean>(false);

  // Sync wizard fields cleanly whenever modal opens or authenticated user changes
  useEffect(() => {
    if (!isOpen) return;
    const hasExistingCompany = Boolean(
      companyProfile?.companyName &&
        companyProfile.companyName !== 'Terit Enterprises Store' &&
        companyProfile.companyName !== 'Terit Retail Store'
    );
    const shouldResumeStep2 =
      (hasExistingCompany || Boolean(companyProfile?.selectedBMPlan)) &&
      !isCompanyProfileComplete(companyProfile);

    setStep(shouldResumeStep2 ? 2 : 1);
    setNeedsMissingCriteriaNotice(shouldResumeStep2);
    setFieldErrors({});
    setSetupComplete(false);
    setIsSaving(false);
    setSelectedType(businessType || 'shop');
    setBillingCycle(companyProfile?.billingCycle || 'monthly');
    setCompanyName(hasExistingCompany ? companyProfile?.companyName || '' : '');
    setContactName(
      companyProfile?.contactName && companyProfile.contactName !== 'Store Manager'
        ? companyProfile.contactName
        : user?.displayName || ''
    );
    setPhone(companyProfile?.phone || '');
    setEmail(companyProfile?.email || user?.email || '');
    setCity(companyProfile?.city || '');
    setSubcity(companyProfile?.subcity || companyProfile?.address || '');
    setTin(companyProfile?.tin || '');
    setBranchName(companyProfile?.branchName || '');
    setLoadPresets(!hasCompletedOnboarding && !hasExistingCompany);
  }, [isOpen, user?.uid, hasCompletedOnboarding]);

  if (!isOpen) return null;

  const currentModel = UNIFIED_MODELS.find((m) => m.id === selectedType) || UNIFIED_MODELS[0];
  const activePriceDisplay = `0 ETB (${t('free_plan')})`;

  const languageOptions: { id: SupportedLanguage; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'am', label: 'Amharic', native: 'አማርኛ' },
    { id: 'om', label: 'Oromifa', native: 'Afaan Oromoo' },
    { id: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
    { id: 'so', label: 'Somali', native: 'Af Soomaali' },
  ];

  const handleNextToCompanyInfo = () => {
    setStep(2);
  };

  const buildCriteriaErrors = () => {
    const check = validateCompanyProfileCriteria({
      companyName,
      contactName,
      phone,
      email,
      city,
      subcity,
      address: subcity,
    });
    const nextErrors: Partial<
      Record<'companyName' | 'contactName' | 'phone' | 'email' | 'city' | 'address', string>
    > = {};
    if (check.missingFields.includes('companyName')) {
      nextErrors.companyName = t('onboarding_error_company');
    }
    if (check.missingFields.includes('contactName')) {
      nextErrors.contactName = t('onboarding_error_contact');
    }
    if (check.missingFields.includes('phone')) {
      nextErrors.phone = t('onboarding_error_phone');
    }
    if (check.missingFields.includes('email')) {
      nextErrors.email = t('onboarding_error_email');
    }
    if (check.missingFields.includes('city')) {
      nextErrors.city = t('onboarding_error_city');
    }
    if (check.missingFields.includes('address')) {
      nextErrors.address = t('onboarding_error_address');
    }
    return { valid: check.valid, nextErrors };
  };

  const clearFieldError = (
    field: 'companyName' | 'contactName' | 'phone' | 'email' | 'city' | 'address'
  ) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, nextErrors } = buildCriteriaErrors();
    setFieldErrors(nextErrors);
    if (!valid) {
      toast(t('onboarding_fill_required_toast'), 'error');
      return;
    }
    setStep(3);
  };

  const handleConfirmAndActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    const { valid, nextErrors } = buildCriteriaErrors();
    if (!valid) {
      setFieldErrors(nextErrors);
      setStep(2);
      toast(t('onboarding_fill_required_toast'), 'error');
      return;
    }
    setIsSaving(true);
    try {
      await setBusinessType(selectedType, loadPresets, false);
      setTier('free', false);
      const updatedProfile = {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        subcity: subcity.trim(),
        address: subcity.trim(),
        tin: tin.trim(),
        branchName: branchName.trim(),
        selectedBMPlan: t(currentModel.titleKey),
        billingCycle,
        paymentMethod: undefined,
        paymentStatus: 'trial' as const,
        paymentDate: undefined,
        lastPaymentTxId: undefined,
        onboardingCompleted: true,
      };
      setCompanyProfile(updatedProfile);
      setHasCompletedOnboarding(true);
      setNeedsMissingCriteriaNotice(false);
      setSetupComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-4xl w-full p-5 sm:p-8 relative m-auto text-slate-900 dark:text-slate-100 transition-colors max-h-[92dvh] flex flex-col">
        {/* Top Dismiss Button */}
        {allowDismiss && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors cursor-pointer z-10"
            title={t('close_btn')}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Wizard Progress Bar */}
        <div className="mb-5 pr-8 sm:pr-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-3 max-w-2xl mx-auto text-[11px] sm:text-xs font-bold">
            <div
              onClick={() => setStep(1)}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 cursor-pointer transition-colors min-w-0 text-center sm:text-left ${
                step === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  step === 1
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : step > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </span>
              <span className="truncate max-w-full">{t('step_model_plan')}</span>
            </div>

            <div className="w-6 sm:w-12 h-0.5 bg-slate-200 dark:bg-slate-800 shrink-0">
              <div
                className={`h-full bg-amber-500 transition-all ${
                  step >= 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>

            <div
              onClick={() => {
                if (step > 1) setStep(2);
              }}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 transition-colors min-w-0 text-center sm:text-left ${
                step === 2
                  ? 'text-amber-600 dark:text-amber-400 cursor-pointer'
                  : step > 2
                  ? 'text-slate-500 dark:text-slate-400 cursor-pointer'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  step === 2
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : step > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </span>
              <span className="truncate max-w-full">{t('step_company_info')}</span>
            </div>

            <div className="w-6 sm:w-12 h-0.5 bg-slate-200 dark:bg-slate-800 shrink-0">
              <div
                className={`h-full bg-amber-500 transition-all ${
                  step === 3 ? 'w-full' : 'w-0'
                }`}
              />
            </div>

            <div
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 transition-colors min-w-0 text-center sm:text-left ${
                step === 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  step === 3
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                3
              </span>
              <span className="truncate max-w-full">{t('step_payment_settle')}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
          {/* ================= STEP 1: UNIFIED BUSINESS MODEL & PLAN ================= */}
          {step === 1 && (
            <div>
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/25 dark:border-amber-400/30 text-xs font-bold mb-2">
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t('onboarding_badge')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white text-balance">
                  {t('choose_biz_title')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {t('choose_biz_subtitle')}
                </p>
              </div>

              {/* Language & Billing Cycle Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl terit-glass-sub mb-5">
                {/* Language Selector */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {t('language')}:
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                          language === lang.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'bg-white/75 dark:bg-slate-800/75 border border-slate-900/10 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        {lang.native}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing Cycle Toggle: Monthly vs Annual */}
                <div className="flex items-center gap-1.5 bg-white/75 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-900/12 dark:border-white/12 self-end sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      billingCycle === 'monthly'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {t('monthly_billing')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      billingCycle === 'annual'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <span>{t('annual_billing')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black uppercase">
                      {t('annual_save_badge')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Unified Models Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
                {UNIFIED_MODELS.map((model) => {
                  const isSelected = selectedType === model.id;
                  const Icon = model.icon;
                  const price =
                    billingCycle === 'annual'
                      ? `${model.annualETB.toLocaleString()} ETB / ${t('per_year_short')}`
                      : `${model.monthlyETB.toLocaleString()} ETB / ${t('per_month_short')}`;

                  return (
                    <div
                      key={model.id}
                      onClick={() => setSelectedType(model.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-amber-50/90 dark:bg-amber-950/35 backdrop-blur-xl border border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500'
                          : 'terit-glass-sub hover:-translate-y-0.5 hover:border-slate-900/25 dark:hover:border-white/25'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {t('selected_model_plan')}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="text-right font-mono">
                            <div className="text-base font-black text-amber-600 dark:text-amber-400">
                              {price}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                              {t(model.planTitleKey)}
                            </div>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {t(model.titleKey)}
                        </h3>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mb-1.5">
                          {t(model.badgeKey)}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                          {t(model.descKey)}
                        </p>

                        <div className="space-y-1 text-[10px] font-mono border-t border-slate-100 dark:border-slate-800/80 pt-2 mb-2">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>{t('sku_limit_label')}</span>
                            <strong className="text-slate-800 dark:text-slate-200">{t(model.skuLimitKey)}</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>{t('locations_label')}</span>
                            <strong className="text-slate-800 dark:text-slate-200">{t(model.locationsKey)}</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>{t('scanner_spec_label')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                              {t(model.scannerKey)}
                            </strong>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>{t('alerts_spec_label')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                              {t(model.alertsKey)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {t('free_eval_forever')}
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {t('free_plan')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Free Evaluation Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{t('free_trial_banner_title')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {t('free_eval_forever')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      {t('free_trial_banner_desc')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                  {t('free_trial_selected')}
                </span>
              </div>

              {/* Next Step Action Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-900/10 dark:border-white/10">
                <div className="text-xs font-mono tabular-nums">
                  <span className="text-slate-600 dark:text-slate-400">{t('plan_selected_prefix')} </span>
                  <strong className="text-amber-700 dark:text-amber-400 font-bold">
                    {fmt(t('onboarding_etb'), [t(currentModel.titleKey), t('free_plan')])}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleNextToCompanyInfo}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{t('next_company_btn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PERSONAL OR COMPANY INFO ================= */}
          {step === 2 && (
            <form onSubmit={handleNextToReview} noValidate>
              <div className="text-center max-w-xl mx-auto mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/25 dark:border-amber-400/30 text-xs font-bold mb-2">
                  <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t('step2_badge')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white text-balance">
                  {t('step2_title')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {t('step2_desc')}
                </p>
              </div>

              {needsMissingCriteriaNotice && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/12 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{t('onboarding_complete_missing_criteria_notice')}</span>
                </div>
              )}

              {/* Aligned Plan Summary */}
              <div className="p-3 rounded-2xl bg-amber-500/12 dark:bg-amber-950/25 border border-amber-600/25 dark:border-amber-400/30 mb-5 flex items-center justify-between text-xs backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {t('unified_model_plan_label')}{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {t(currentModel.titleKey)}
                    </strong>
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-[11px] tabular-nums">
                  {activePriceDisplay}
                </span>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('company_name_label')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        clearFieldError('companyName');
                      }}
                      placeholder={t('onboarding_company_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.companyName
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.companyName && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('contact_name_label')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value);
                        clearFieldError('contactName');
                      }}
                      placeholder={t('onboarding_contact_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.contactName
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.contactName && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.contactName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('phone_number_label')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      placeholder={t('phone_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.phone
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('email_address_label')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder={t('email_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.email
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('city_region_label')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        clearFieldError('city');
                      }}
                      placeholder={t('onboarding_city_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.city
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('street_subcity_address_label')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={subcity}
                      onChange={(e) => {
                        setSubcity(e.target.value);
                        clearFieldError('address');
                      }}
                      placeholder={t('onboarding_address_placeholder')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden ${
                        fieldErrors.address
                          ? 'border-rose-500 dark:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.address && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('branch_name_label')}
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder={t('onboarding_branch_placeholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {t('tin_number_label')}
                    </label>
                    <input
                      type="text"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      placeholder={t('onboarding_tin_placeholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Preload Presets Checkbox */}
                <div
                  onClick={() => setLoadPresets(!loadPresets)}
                  className="p-3 rounded-xl terit-glass-sub flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                        loadPresets
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-500'
                      }`}
                    >
                      {loadPresets && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {t('preload_catalog_label')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {t('instant_test_catalog')}
                  </span>
                </div>
              </div>

              {/* Form Navigation Buttons */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-900/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('back_to_model_btn')}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{t('next_step_payment')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: REVIEW & ACTIVATION ================= */}
          {step === 3 && (
            <div>
              {!setupComplete ? (
                <div>
                  <div className="text-center max-w-xl mx-auto mb-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/25 dark:border-amber-400/30 text-xs font-bold mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t('free_evaluation_label')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white text-balance">
                      {t('onboarding_complete_setup_title')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {t('onboarding_no_payment_required_desc')}
                    </p>
                  </div>

                  {/* Summary Invoice Box */}
                  <div className="terit-glass-sub rounded-2xl p-4 sm:p-5 mb-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 dark:border-white/10 text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                          {t('onboarding_free_eval_summary')}
                        </div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {companyName}
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <div className="text-slate-400">
                          {t('plan_label')}{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {t('free_evaluation_label')}
                          </strong>
                        </div>
                        <div className="text-slate-400">
                          {t('onboarding_no_payment_due')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('payer_name_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate block">
                          {contactName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('unified_model_plan_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 block">
                          {t(currentModel.titleKey)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('billing_cycle_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 block uppercase">
                          {billingCycle === 'annual' ? t('annual_billing') : t('monthly_billing')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] text-right">
                          {t('onboarding_amount_due')}
                        </span>
                        <strong className="text-base font-black text-amber-600 dark:text-amber-400 block text-right">
                          {activePriceDisplay}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-900/10 dark:border-white/10 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('phone_number_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 block truncate">
                          {phone}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('email_address_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 block truncate">
                          {email}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('street_subcity_address_label')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 block truncate">
                          {subcity}, {city}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 rounded-xl border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-200">
                    {t('onboarding_free_eval_notice')}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('back_to_info_btn')}</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleConfirmAndActivate()}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>
                          {t('onboarding_start_free_eval')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Setup completion confirmation */
                <div className="text-center py-8 max-w-md mx-auto space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {t('onboarding_free_eval_ready')}
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                      {t('onboarding_setup_complete_desc')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl terit-glass-sub text-xs font-mono text-left space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t('company_name_label')}:</span>
                      <strong className="text-slate-900 dark:text-white">{companyName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t('unified_model_plan_label')}</span>
                      <strong className="text-amber-700 dark:text-amber-400">
                        {t(currentModel.titleKey)} · {t('free_plan')}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t('launch_dashboard')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
