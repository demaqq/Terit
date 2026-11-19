import React, { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  LogOut,
  LogIn,
  Crown,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  TrendingUp,
  CreditCard,
  Users,
  Bell,
  User,
  Receipt,
  Package,
  Truck,
  Target,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PRIMARY_NAV, SECONDARY_NAV } from '../navigation';

const NAV_ACTIVE =
  'bg-[rgba(212,91,37,0.15)] dark:bg-[rgba(212,91,37,0.25)] text-[#D45B25] dark:text-[#E8632B] font-bold border-[#D45B25]/50 shadow-xs';
const NAV_IDLE =
  'text-[#111625] dark:text-slate-300 hover:text-[#D45B25] dark:hover:text-white border-transparent hover:bg-white/50 dark:hover:bg-white/8';
import { SupportedLanguage, BUSINESS_TYPES } from '../i18n/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsPricingOpen: (open: boolean) => void;
  onOpenOnboarding: () => void;
  onOpenAlerts?: () => void;
  onOpenSyncGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  setIsChatOpen,
  setIsPricingOpen,
  onOpenOnboarding,
  onOpenAlerts,
  onOpenSyncGuide,
}) => {
  const {
    items,
    user,
    loginWithGoogle,
    logout,
    tier,
    language,
    setLanguage,
    theme,
    setTheme,
    businessType,
    companyProfile,
    t,
  } = useInventory();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [user?.uid]);

  const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.quantity <= i.minStockAlert).length;

  const languages: { id: SupportedLanguage; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'am', label: 'Amharic', native: 'አማርኛ' },
    { id: 'om', label: 'Oromifa', native: 'Afaan Oromoo' },
    { id: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
    { id: 'so', label: 'Somali', native: 'Af Soomaali' },
  ];

  const currentLang = languages.find((l) => l.id === language) || languages[0];

  const accountName = user?.displayName || user?.email?.split('@')[0] || t('nav_account');
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || 'U';

  const tierLabel = (tier || 'free').toUpperCase();
  const isPro = tier === 'pro';
  const activeSecondary = SECONDARY_NAV.find((n) => n.id === activeTab);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMoreOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setIsMoreOpen(false);
        return;
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [isMoreOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/88 dark:bg-slate-950/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-900/10 dark:border-white/12 text-slate-900 dark:text-slate-100 shadow-[0_10px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_10px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Brand (left) | Right Controls (right) */}
        <div className="flex items-center justify-between h-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              aria-label={`${t('app_name')} dashboard`}
              className="flex min-w-0 items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[var(--terit-radius)] bg-amber-500 flex items-center justify-center text-white font-bold shadow-sm shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0">
                <Boxes className="w-5 h-5 text-white" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  {t('app_name')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {companyProfile?.companyName
                      ? companyProfile.companyName
                      : t(BUSINESS_TYPES.find(b => b.id === businessType)?.titleKey || 'biz_shop_title')}
                  </span>
                  {companyProfile?.city && (
                    <>
                      <span>·</span>
                      <span>{companyProfile.city}</span>
                    </>
                  )}
                </span>
              </span>
            </button>
           </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Alerts Bell */}
            <button
              onClick={() => onOpenAlerts && onOpenAlerts()}
              aria-label={t('sms_email_alerts_label')}
              className="relative p-1.5 sm:p-2 rounded-[var(--terit-radius)] terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={t('sms_email_alerts_label')}
            >
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                aria-label={currentLang.native}
                aria-expanded={isLangMenuOpen}
                className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--terit-radius)] terit-glass-sub text-slate-800 dark:text-slate-200 text-xs hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-[11px]">
                  <span className="sm:hidden uppercase font-mono">{language}</span>
                  <span className="hidden sm:inline">{currentLang.native}</span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-36 terit-glass rounded-[var(--terit-radius)] py-1 z-50 animate-in fade-in duration-150">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLanguage(l.id);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                        language === l.id
                          ? 'font-bold text-amber-700 dark:text-amber-400 bg-amber-500/12'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{l.native}</span>
                      {language === l.id && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? t('switch_theme_dark') : t('switch_theme_light')}
              className="p-1.5 sm:p-2 rounded-[var(--terit-radius)] terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              title={theme === 'light' ? t('switch_theme_dark') : t('switch_theme_light')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Profile */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label={user ? `${accountName} ${t('nav_account_menu')}` : t('google_sign_in_label')}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-controls="navbar-account-menu"
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--terit-radius)] terit-glass-sub text-slate-800 dark:text-slate-100 hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                    {user ? accountInitial : <User className="w-4 h-4" />}
                  </span>
                )}
                <div className="hidden sm:block">
                  <p className="max-w-32 truncate text-left text-xs font-semibold text-slate-900 dark:text-white leading-none">
                    {user ? accountName : t('nav_sign_in')}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {user ? `${tierLabel} ${t('nav_plan_suffix')}` : t('nav_account')}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div
                  id="navbar-account-menu"
                  role="menu"
                  aria-label={t('nav_account_options')}
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden terit-glass rounded-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="flex items-center gap-3 p-3.5 border-b border-slate-900/10 dark:border-white/10">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 text-sm font-bold shrink-0">
                        {user ? accountInitial : <User className="w-5 h-5" />}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {user ? accountName : t('nav_guest_account')}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user?.email || t('nav_sign_in_sync_hint')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenOnboarding();
                    }}
                    role="menuitem"
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    {t('edit_store_profile')}
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsPricingOpen && setIsPricingOpen(true);
                    }}
                    role="menuitem"
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      isPro
                        ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>{tierLabel} · {t('manage_plan_btn')}</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800" />
                  {user ? (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        void logout();
                      }}
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('sign_out_label')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          void loginWithGoogle();
                        }}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        {t('google_sign_in_label')}
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          void logout();
                        }}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('exit_guest_mode_label')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Scrollable Nav Tabs (full width below top row) */}
        <div className="hidden lg:block border-t border-slate-900/8 dark:border-white/10">
          <nav aria-label={t('nav_main_navigation')} className="flex items-center gap-1 py-1.5 flex-wrap">
            {PRIMARY_NAV.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative min-h-9 whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-[var(--terit-radius)] text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
                    isActive ? NAV_ACTIVE : NAV_IDLE
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-900/10 dark:bg-white/15 shrink-0" />
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                className={`min-h-9 whitespace-nowrap px-3.5 py-1.5 rounded-[var(--terit-radius)] text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
                  activeSecondary ? NAV_ACTIVE : NAV_IDLE
                }`}
              >
                {activeSecondary ? (
                  <>
                    <activeSecondary.Icon className="w-3.5 h-3.5" />
                    <span>{t(activeSecondary.labelKey)}</span>
                  </>
                ) : (
                  <span>{t('more_nav')}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMoreOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-1.5 w-56 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50"
                >
                  {SECONDARY_NAV.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        role="menuitem"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[rgba(212,91,37,0.12)] text-[#D45B25] dark:text-[#E8632B]'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <item.Icon className={`w-4 h-4 ${item.iconClass}`} />
                        <span>{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
