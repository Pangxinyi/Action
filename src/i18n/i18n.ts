import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as enTranslations from './translations/en';
import * as zhTranslations from './translations/zh';

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: enTranslations.default },
      zh: { translation: zhTranslations.default },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
