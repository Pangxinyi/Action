import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import zh from './translations/zh';

const LANGUAGE_KEY = 'app_language';

// 获取系统语言，返回 'en' 或 'zh'
const getSystemLanguage = (): string => {
  try {
    // 使用 expo-localization 获取设备语言
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const primaryLocale = locales[0];
      const languageCode = primaryLocale.languageCode || '';
      // 检测是否为中文
      if (languageCode.toLowerCase().startsWith('zh')) {
        return 'zh';
      }
    }
    return 'en';
  } catch (e) {
    console.error('Failed to get system language:', e);
    return 'en';
  }
};

// 初始化语言（优先使用系统语言，忽略之前保存的值）
const initLanguage = async () => {
  const systemLang = getSystemLanguage();
  console.log('System language detected:', systemLang);
  
  try {
    // 清除旧的保存值，强制使用系统语言
    await AsyncStorage.removeItem(LANGUAGE_KEY);
  } catch (error) {
    console.error('Failed to clear saved language:', error);
  }
  
  return systemLang;
};

// 保存语言选择
export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: 'en', // 默认语言，会在下面异步加载后覆盖
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React Native 已经处理了 XSS
  },
  compatibilityJSON: 'v4', // 兼容性设置
});

// 异步加载保存的语言
initLanguage().then((language) => {
  i18n.changeLanguage(language);
});

export default i18n;
