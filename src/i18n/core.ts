import { createI18nInstance } from './config';

let coreI18n: Awaited<ReturnType<typeof createI18nInstance>> | null = null;

// background, content script에서 사용
export async function getCoreI18n() {
  if (!coreI18n) {
    coreI18n = await createI18nInstance();
  }
  return coreI18n;
}

// 번역 함수 (간단한 사용을 위해)
export async function t(key: string, options?: Record<string, unknown>) {
  const i18n = await getCoreI18n();
  return i18n.t(key, options);
}
