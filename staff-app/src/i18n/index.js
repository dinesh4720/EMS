/**
 * i18n configuration for Staff App
 *
 * Supports: English, Hindi, Kannada, Tamil, Telugu, Urdu (RTL)
 *
 * Usage:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation();
 *   t('attendance.markAttendance')
 *
 * Change language:
 *   import { setLanguage } from '../i18n';
 *   setLanguage('hi');
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Locale resources bundled inline (no async file loading needed in RN)
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import knCommon from './locales/kn/common.json';
import taCommon from './locales/ta/common.json';
import teCommon from './locales/te/common.json';
import urCommon from './locales/ur/common.json';

const LANGUAGE_KEY = '@staff_app_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिंदी', dir: 'ltr' },
  { code: 'kn', name: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
];

const resources = {
  en: { translation: enCommon },
  hi: { translation: hiCommon },
  kn: { translation: knCommon },
  ta: { translation: taCommon },
  te: { translation: teCommon },
  ur: { translation: urCommon },
};

// Load persisted language preference
async function getSavedLanguage() {
  try {
    return (await AsyncStorage.getItem(LANGUAGE_KEY)) || 'en';
  } catch {
    return 'en';
  }
}

export async function initI18n() {
  const savedLang = await getSavedLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

  return i18n;
}

export async function setLanguage(langCode) {
  await i18n.changeLanguage(langCode);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
  } catch {
    // ignore storage error
  }
}

export function getCurrentLanguage() {
  return i18n.language || 'en';
}

export function isRTL() {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === getCurrentLanguage());
  return lang?.dir === 'rtl';
}

export default i18n;
