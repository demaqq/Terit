import React, { useState } from 'react';
import {
  Boxes,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Receipt,
  Warehouse,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Loader2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { SupportedLanguage } from '../i18n/translations';

export const AuthGateView: React.FC = () => {
  const {
    loginWithGoogle,
    enterGuestMode,
    isAuthActionPending,
    justLoggedOut,
    language,
    setLanguage,
    theme,
    setTheme,
    t,
  } = useInventory();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const languages: { id: SupportedLanguage; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'am', label: 'Amharic', native: 'አማርኛ' },
    { id: 'om', label: 'Oromifa', native: 'Afaan Oromoo' },
    { id: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
    { id: 'so', label: 'Somali', native: 'Af Soomaali' },
  ];

  const currentLang = languages.find((l) => l.id === language) || languages[0];

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-900/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-[var(--terit-radius)] bg-amber-500 flex items-center justify-center text-white font-bold shadow-sm shadow-amber-500/25 shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <div className="font-bold text-base sm:text-lg tracking-tight truncate">
                {t('app_name')}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate hidden sm:block">
                {t('footer_tagline')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                aria-expanded={isLangMenuOpen}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--terit-radius)] terit-glass-sub text-xs font-semibold hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="sm:hidden uppercase font-mono">{language}</span>
                <span className="hidden sm:inline">{currentLang.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-36 terit-glass rounded-[var(--terit-radius)] py-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      type="button"
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
                      {language === l.id && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? t('switch_theme_dark') : t('switch_theme_light')}
              className="p-2 rounded-[var(--terit-radius)] terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-800" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Auth Gate Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Summary */}
          <div className="lg:col-span-7 space-y-5">
            {justLoggedOut && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t('auth_gate_logged_out_banner')}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t('auth_gate_badge')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight text-balance">
                {t('auth_gate_title')}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {t('auth_gate_subtitle')}
              </p>
            </div>

            {/* Key Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="terit-glass-sub rounded-2xl p-4 space-y-1.5">
                <Warehouse className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {t('auth_gate_feature_models_title')}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('auth_gate_feature_models_desc')}
                </p>
              </div>

              <div className="terit-glass-sub rounded-2xl p-4 space-y-1.5">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {t('auth_gate_feature_tax_title')}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('auth_gate_feature_tax_desc')}
                </p>
              </div>

              <div className="terit-glass-sub rounded-2xl p-4 space-y-1.5">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {t('auth_gate_feature_sync_title')}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('auth_gate_feature_sync_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-5">
            <div className="terit-modal rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black mx-auto shadow-lg shadow-amber-500/20">
                  <Boxes className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white pt-2">
                  {t('auth_gate_card_title')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('auth_gate_card_desc')}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isAuthActionPending}
                  onClick={() => void loginWithGoogle()}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isAuthActionPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{t('auth_continue_google_btn')}</span>
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-1 border-t border-slate-900/10 dark:border-white/10" />
                  <span className="px-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {t('auth_or_label')}
                  </span>
                  <div className="flex-1 border-t border-slate-900/10 dark:border-white/10" />
                </div>

                <button
                  type="button"
                  disabled={isAuthActionPending}
                  onClick={enterGuestMode}
                  className="w-full py-2.5 px-4 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('auth_try_guest_btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Required Activation Criteria Strip */}
              <div className="rounded-2xl terit-glass-sub p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {t('auth_gate_criteria_title')}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/10">
                    <Mail className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t('auth_gate_criteria_email')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/10">
                    <Phone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t('auth_gate_criteria_phone')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/10">
                    <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t('auth_gate_criteria_address')}</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                {t('auth_gate_signup_hint')}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
