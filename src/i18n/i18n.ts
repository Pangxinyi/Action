import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import zh from './translations/zh';

/* eslint import/no-named-as-default-member: off */

export const getSystemLanguage = () => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      if (languageCode && languageCode.toLowerCase().startsWith('zh')) return 'zh';
    }
  } catch {
    // fallback
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: getSystemLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;