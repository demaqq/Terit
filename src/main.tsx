import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadLocale, type SupportedLanguage } from './i18n/translations';

// Fetch the saved language before the first render so non-English users never see
// a flash of English. English is bundled, so this resolves immediately for most users.
let savedLang: SupportedLanguage = 'en';
try {
  savedLang = (localStorage.getItem('terit_language') as SupportedLanguage) || 'en';
} catch {
  // storage unavailable: default to English
}

loadLocale(savedLang)
  .catch(() => undefined)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(<App />);
  });
