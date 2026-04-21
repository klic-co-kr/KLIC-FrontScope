import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 파일 import
import ko from './locales/ko.json';
import en from './locales/en.json';

// 리소스
const resources = {
  ko: { translation: ko },
  en: { translation: en },
};

// 지원 언어
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// 언어 감지 함수
export function detectLanguage(): SupportedLanguage {
  const browserLang = chrome.i18n.getUILanguage();
  return browserLang.startsWith('ko') ? 'ko' : 'en';
}

// i18n 초기화 옵션
export const i18nConfig = {
  resources,
  fallbackLng: 'en' as const,
  lng: undefined, // LanguageDetector에서 자동 감지
  debug: process.env.NODE_ENV === 'development',

  interpolation: {
    escapeValue: false, // React가 이미 XSS를 방지
  },

  detection: {
    // Chrome Storage에서 언어 읽기
    lookup: 'localStorage',
    caches: ['localStorage'],
  },
};

// i18n 인스턴스 생성 (core용)
export async function createI18nInstance() {
  const instance = i18n.createInstance();
  await instance.use(LanguageDetector).init({
    ...i18nConfig,
    lng: detectLanguage(),
  });
  return instance;
}

// React용 i18n 설정
export function setupReactI18n() {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    ...i18nConfig,
    lng: detectLanguage(),
  });
  return i18n;
}
