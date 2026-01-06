import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import zh from './translations/zh';

/* eslint import/no-named-as-default-member: off */

// 2. 简单的系统语言检测函数
const getSystemLanguage = () => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      // 如果系统语言是 zh 开头 (zh-CN, zh-TW)，则返回中文
      if (languageCode && languageCode.toLowerCase().startsWith('zh')) {
        return 'zh';
      }
    }
  } catch (e) {
    console.error('Failed to detect locale', e);
  }
  return 'en'; // 默认回退到英文
};

i18n
  .use(initReactI18next)
  .init({
    // 3. 关键配置
    compatibilityJSON: 'v4', // 在 React Native 中建议用 v3 兼容模式，解决安卓闪退问题
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    // 4. 这里直接调用检测函数，同步初始化
    lng: getSystemLanguage(), 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 默认防注入，不需要 i18n 处理
    },
    react: {
      useSuspense: false, // 避免在 RN 中因为加载 loading 报错
    },
  });

export default i18n;