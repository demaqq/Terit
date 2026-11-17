import React, { useState } from 'react';
import {
  Boxes,
  Package,
  TrendingUp,
  BotMessageSquare,
  Menu,
  X,
  ShoppingCart,
  ArrowRightLeft,
  Building2,
  Warehouse,
  Globe,
  Sun,
  Moon,
  LogOut,
  LogIn,
  CreditCard,
  Users,
  Bell,
  Smartphone,
  Crown,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { SupportedLanguage } from '../i18n/translations';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat: () => void;
  onOpenOnboarding: () => void;
  onOpenPricing: () => void;
  onOpenAlerts?: () => void;
  onOpenSyncGuide?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenChat,
  onOpenOnboarding,
  onOpenPricing,
  onOpenAlerts,
  onOpenSyncGuide,
}) => {
  const {
    items,
    user,
    loginWithGoogle,
    logout,
    language,
    setLanguage,
    theme,
    setTheme,
    businessType,
    tier,
    t,
  } = useInventory();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.quantity <= i.minStockAlert).length;

  const languages: { id: SupportedLanguage; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'am', label: 'Amharic', native: 'አማርኛ' },
    { id: 'om', label: 'Oromifa', native: 'Afaan Oromoo' },
    { id: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
    { id: 'so', label: 'Somali', native: 'Af Soomaali' },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  const handleSignIn = async () => {
    setIsMoreMenuOpen(false);
    await loginWithGoogle();
  };

  const handleSignOut = async () => {
    setIsMoreMenuOpen(false);
    await logout();
  };

  return (
    <>
      {/* Slide-up "More" Drawer for Secondary Actions on Mobile */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/55 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-slate-900/12 dark:border-white/15 rounded-t-3xl p-5 max-h-[82vh] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {t('app_name')} · {t('mobile_matrix_title')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                  {t(`biz_${businessType}_title`)}
                </span>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Strip */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenChat();
                }}
                className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex flex-col items-center justify-center text-center gap-1 shadow-2xs cursor-pointer"
              >
                <BotMessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] leading-tight">{t('copilot_btn')}</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAlerts && onOpenAlerts();
                }}
                className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex flex-col items-center justify-center text-center gap-1 relative cursor-pointer"
              >
                <div className="relative">
                  <Bell className="w-5 h-5 text-amber-500" />
                  {lowStockCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {lowStockCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight truncate max-w-full">{t('sms_email_alerts_label')}</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSyncGuide && onOpenSyncGuide();
                }}
                className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] leading-tight truncate max-w-full">{t('android_sync_label')}</span>
              </button>
            </div>

            {/* Navigation Links Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleTabClick('credit')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'credit'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>{t('nav_credit')}</span>
              </button>

              <button
                onClick={() => handleTabClick('staff')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>{t('nav_staff')}</span>
              </button>

              <button
                onClick={() => handleTabClick('procurement')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'procurement'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-purple-500" />
                <span>{t('nav_pos')}</span>
              </button>

              <button
                onClick={() => handleTabClick('movements')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'movements'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                <span>{t('nav_movements')}</span>
              </button>

              <button
                onClick={() => handleTabClick('suppliers')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'suppliers'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>{t('nav_suppliers')}</span>
              </button>

              <button
                onClick={() => handleTabClick('warehouses')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${
                  activeTab === 'warehouses'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Warehouse className="w-4 h-4 text-rose-500" />
                <span>{t('nav_warehouses')}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">

              {/* Switch Business Model / Edit Store Profile Button */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>{t('edit_store_profile')}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  {t(`biz_${businessType}_title`)}
                </span>
              </button>

              {/* Synced Subscription Plan Button */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenPricing();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-between"
              >
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{t('aligned_subscription_label')}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold">
                  {tier === 'starter' || tier === 'shop'
                    ? `${t('starter_plan')} · 999 ETB`
                    : tier === 'pro' || tier === 'pharmacy'
                    ? `${t('pro_plan')} · 1,499 ETB`
                    : tier === 'enterprise' || tier === 'warehouse'
                    ? `${t('enterprise_plan')} · 2,499 ETB`
                    : `${t('free_plan')} (0 ETB)`}
                </span>
              </button>

              {/* Language Selection Bar */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
                {languages.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      language === l.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>

              {/* Theme & Auth */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5"
                >
                  {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{theme === 'light' ? t('switch_theme_dark') : t('switch_theme_light')}</span>
                </button>

                {user ? (
                  <button
                    onClick={() => void handleSignOut()}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('sign_out_label')}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleSignIn()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t('google_sign_in_label')}</span>
                    </button>
                    <button
                      onClick={() => void handleSignOut()}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('exit_guest_mode_label')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar for Mobile Devices */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/92 dark:bg-slate-950/78 backdrop-blur-2xl backdrop-saturate-150 border-t border-slate-900/10 dark:border-white/12 px-1.5 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-10px_30px_-6px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_-10px_30px_-6px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors">
        {/* Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-amber-700 dark:text-amber-400 font-bold scale-105'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[9.5px] mt-0.5 truncate max-w-full">{t('nav_dashboard')}</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => handleTabClick('inventory')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-amber-700 dark:text-amber-400 font-bold scale-105'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[9.5px] mt-0.5 truncate max-w-full">{t('nav_inventory')}</span>
        </button>

        {/* Credit & Debts */}
        <button
          onClick={() => handleTabClick('credit')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'credit'
              ? 'text-amber-700 dark:text-amber-400 font-bold scale-105'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[9.5px] mt-0.5 truncate max-w-full">{t('credit_nav')}</span>
        </button>

        {/* Reports & Analytics */}
        <button
          onClick={() => handleTabClick('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'text-amber-700 dark:text-amber-400 font-bold scale-105'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9.5px] mt-0.5 truncate max-w-full">{t('reports_nav')}</span>
        </button>

        {/* AI Chatbot / Terit Copilot */}
        <button
          onClick={() => {
            setIsMoreMenuOpen(false);
            onOpenChat();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer text-amber-700 dark:text-amber-400 hover:scale-105 active:scale-95 group"
          title={t('copilot_btn')}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xs shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <BotMessageSquare className="w-3.5 h-3.5 text-slate-950" />
            </div>
          </div>
          <span className="text-[9.5px] font-bold text-amber-800 dark:text-amber-300 mt-0.5 truncate max-w-full">
            {t('copilot_nav')}
          </span>
        </button>

        {/* More / Menu */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
            isMoreMenuOpen || ['staff', 'procurement', 'movements', 'suppliers', 'warehouses'].includes(activeTab)
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9.5px] mt-0.5 truncate max-w-full">{t('more_nav')}</span>
        </button>
      </div>
    </>
  );
};
