import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';

const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ur: 'ur-PK',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
  { code: 'kn', name: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', dir: 'ltr' },
];

const STORAGE_KEY = 'ems-user-language';

const LOCALE_LOADERS = {
  hi: () => import('./locales/hi.json'),
  ur: () => import('./locales/ur.json'),
  kn: () => import('./locales/kn.json'),
  ta: () => import('./locales/ta.json'),
  te: () => import('./locales/te.json'),
};

async function loadLocale(lang) {
  if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) return;
  const loader = LOCALE_LOADERS[lang];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(lang, 'translation', mod.default, true, true);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
      cacheUserLanguage: false, // we manage persistence ourselves
    },
  });

// Lazy-load the detected language bundle on startup
loadLocale(i18n.language);

/**
 * Returns the BCP-47 locale tag for the current i18n language.
 * Used by Intl.DateTimeFormat / Intl.NumberFormat throughout the app.
 */
export function getDateLocale() {
  const lang = i18n.language || 'en';
  return LOCALE_MAP[lang] || 'en-IN';
}

/**
 * Sync language from the school's language.defaultLanguage setting.
 * Called by AppContext when school settings load. Only applies if the
 * user hasn't explicitly chosen a language via setLanguage().
 */
export async function syncSchoolLanguage(defaultLanguage) {
  if (!defaultLanguage || !LOCALE_MAP[defaultLanguage]) return;
  const userChose = localStorage.getItem(STORAGE_KEY);
  if (userChose) return;
  if (i18n.language !== defaultLanguage) {
    await loadLocale(defaultLanguage);
    i18n.changeLanguage(defaultLanguage);
  }
}

/** Set language explicitly (user action) — persists to localStorage. */
export async function setLanguage(lang) {
  if (!LOCALE_MAP[lang]) return;
  localStorage.setItem(STORAGE_KEY, lang);
  await loadLocale(lang);
  i18n.changeLanguage(lang);
}

export default i18n;
