import { setupReactI18n } from './config';

// React에서 사용할 i18n 인스턴스
export const i18n = setupReactI18n();

// 언어 변경 함수
export async function changeLanguage(lang: 'ko' | 'en') {
  await i18n.changeLanguage(lang);
  // Chrome Storage에 저장
  chrome.storage.local.set({ 'app:language': lang });
}
