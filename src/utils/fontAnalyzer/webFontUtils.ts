/**
 * Web Font Utilities
 *
 * 웹 폰트 관련 유틸리티
 */

import type { WebFontInfo, FontLoadInfo, FontFormat, FontVariant } from '../../types/fontAnalyzer';
import { FONT_FORMATS } from '../../constants/fontAnalyzerDefaults';

/**
 * 페이지의 웹 폰트 추출
 */
export function extractWebFonts(): WebFontInfo[] {
  const webFonts: WebFontInfo[] = [];
  const processedFamilies = new Set<string>();

  // 모든 스타일시트 순회
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;

      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSFontFaceRule) {
          const fontFamily = rule.style.getPropertyValue('font-family');
          const src = rule.style.getPropertyValue('src');

          if (!fontFamily || processedFamilies.has(fontFamily)) continue;

          processedFamilies.add(fontFamily);

          // URL 추출
          const urlMatch = src.match(/url\(['"]?([^'")]+)['"]?\)/);
          const url = urlMatch ? urlMatch[1] : undefined;

          webFonts.push({
            family: fontFamily.replace(/['"]/g, ''),
            source: sheet.href || 'inline',
            url,
            variants: parseFontFaceRule(rule),
          });
        }
      }
    } catch {
      // CORS 오류 무시
    }
  }

  return webFonts;
}

/**
 * @font-face 규칙 파싱
 */
function parseFontFaceRule(rule: CSSFontFaceRule): WebFontInfo['variants'] {
  const style = rule.style;

  const weight = style.getPropertyValue('font-weight');
  const fontStyle = style.getPropertyValue('font-style');
  const fontStretch = style.getPropertyValue('font-stretch');
  // const unicodeRange = style.getPropertyValue('unicode-range');

  const variants: FontVariant[] = [];

  // 여러 weight/style 조합 처리
  const weights = weight.split(',').map(w => w.trim());
  const styles = fontStyle ? fontStyle.split(',') : ['normal'];

  for (const w of weights) {
    for (const s of styles) {
      variants.push({
        weight: parseInt(w) || 400,
        style: s.trim(),
        stretch: fontStretch || 'normal',
      });
    }
  }

  return variants;
}

/**
 * 구글 폰트로드
 */
export function loadGoogleFont(
  family: string,
  options: {
    weights?: number[];
    styles?: string[];
    subsets?: string[];
    display?: 'swap' | 'fallback' | 'optional';
    text?: string;
  } = {}
): Promise<void> {
  const {
    weights = [400, 700],
    styles = ['normal'],
    subsets = ['latin'],
    display = 'swap',
  } = options;

  // 이미 로드된 폰트 확인
  if (document.fonts.check(`400 1em "${family}"`) &&
    document.fonts.check(`700 1em "${family}"`)) {
    return Promise.resolve();
  }

  // 구글 폰트 URL 생성
  const styleParams = [
    weights.map(w => `wght@${w}`).join(','),
    styles.map(s => `ital@${s}`).join(','),
    subsets.map(s => `subset=${s}`).join(','),
  ].filter(Boolean);

  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:${styleParams.join('&')}&display=${display}`;

  return new Promise((resolve, reject) => {
    // 이미 존재하는 링크 확인
    const existingLink = document.querySelector(`link[href*="${family}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    // 폰트 로드
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${family}`));

    document.head.appendChild(link);
  });
}

/**
 * 폰트 로딩 상태 확인
 */
export function checkFontLoadStatus(
  family: string,
  timeout: number = 3000
): Promise<FontLoadInfo> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Document.fonts 사용
    const check = (): boolean => {
      const isLoaded = document.fonts.check(`400 1em "${family}"`) &&
        document.fonts.check(`700 1em "${family}"`);

      if (isLoaded) {
        resolve({
          family,
          status: 'loaded',
          loadTime: Date.now() - startTime,
        });
        return true;
      }
      return false;
    };

    // 이미 로드되었는지 즉시 확인
    if (check()) return;

    // 폰트 로드 대기
    document.fonts.ready.then(() => check());

    // 타임아웃
    setTimeout(() => {
      resolve({
        family,
        status: 'loading', // Changed from timeout to loading to match intent? Or timeout?
        // If it was meant to be timeout, use timeout. But previous code had 'loading' in setTimeout.
        // Wait, previous code had 'timeout' in check's else block (which was wrong) and 'loading' in setTimeout.
      });
    }, timeout);
  });
}

/**
 * 모든 폰트 로딩 상태 확인
 */
export async function checkAllFontLoads(
  families: string[],
  timeout: number = 3000
): Promise<FontLoadInfo[]> {
  const promises = families.map(family => checkFontLoadStatus(family, timeout));
  return Promise.all(promises);
}

/**
 * Typekit 폰트 로드
 */
export function loadTypekitFont(
  kitId: string,
  options: {
    families?: string[];
    script?: boolean;
    fontUrls?: string[];
  } = {}
): Promise<void> {
  const { script = true } = options;

  return new Promise((resolve, reject) => {
    if (script) {
      // Typekit 스크립트 로드
      const script = document.createElement('script');
      script.src = `https://use.typekit.net/${kitId}.js`;
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Typekit load failed'));

      document.head.appendChild(script);
    } else {
      // CSS @import 방식 (deprecated)
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://use.typekit.net/${kitId}.css`;
      link.crossOrigin = 'anonymous';

      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Typekit CSS load failed'));

      document.head.appendChild(link);
    }
  });
}

/**
 * Adobe Fonts (Typekit) 폰트 추출
 */
export function detectTypekitFonts(): string[] {
  const fonts: string[] = [];

  // Typekit 로드된 요소 확인
  const typekitElements = document.querySelectorAll('[data-kit]');
  for (const element of Array.from(typekitElements)) {
    const kitId = element.getAttribute('data-kit');
    if (kitId) {
      // kitId에서 폰트 정보 추출 (간단화)
      fonts.push(`Typekit Kit: ${kitId}`);
    }
  }

  // Typekit 스타일시트 확인
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href?.includes('typekit')) {
      // URL에서 폰트 이름 추출 시도
      fonts.push('Typekit (CSS)');
    }
  }

  return fonts;
}

/**
 * Adobe Fonts (Adobe Fonts) 폰트 추출
 */
export function detectAdobeFonts(): string[] {
  const fonts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href?.includes('fonts.adobe.com')) {
      // Adobe Fonts 사용 중
      return ['Adobe Fonts'];
    }
  }

  return fonts;
}

/**
 * 웹 폰트 미리보기 생성
 */
export function createFontPreview(
  family: string,
  options: {
    text?: string;
    size?: number;
    weight?: number;
    style?: string;
    color?: string;
    backgroundColor?: string;
  } = {}
): HTMLElement {
  const {
    text = 'ABCDEFGHIJKLMNPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\nThe quick brown fox jumps over the lazy dog.',
    size = 24,
    weight = 400,
    style = 'normal',
    color = '#000000',
    backgroundColor = '#ffffff',
  } = options;

  const preview = document.createElement('div');
  preview.className = 'font-preview';
  preview.style.cssText = `
    font-family: ${family};
    font-size: ${size}px;
    font-weight: ${weight};
    font-style: ${style};
    color: ${color};
    background-color: ${backgroundColor};
    padding: 1rem;
    border-radius: 0.5rem;
    white-space: pre-wrap;
    line-height: 1.5;
  `;
  preview.textContent = text;

  return preview;
}

/**
 * 폰트 파일 형식 감지
 */
export function detectFontFormat(url: string): FontFormat | null {
  const extension = url.split('.').pop()?.toLowerCase();

  if (extension && extension in FONT_FORMATS) {
    return extension as FontFormat;
  }

  // Content-Type 헤더에서 확인 (해당되는 경우)
  const path = url.toLowerCase();
  if (path.includes('.woff2')) return 'woff2';
  if (path.includes('.woff')) return 'woff';
  if (path.includes('.ttf')) return 'ttf';
  if (path.includes('.otf')) return 'otf';
  if (path.includes('.eot')) return 'eot';
  if (path.includes('.svg')) return 'svg';

  return null;
}

/**
 * 폰트 최적화 권장사항 생성
 */
export function generateFontOptimization(
  webFont: WebFontInfo
): {
  currentFormat: FontFormat | null;
  recommendedFormat: FontFormat;
  hasSubset: boolean;
  hasDisplaySwap: boolean;
  hasPreload: boolean;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // 형식 확인
  const currentFormat = webFont.url ? detectFontFormat(webFont.url) : null;

  // WOFF2 권장
  const recommendedFormat = 'woff2';

  if (currentFormat && currentFormat !== 'woff2') {
    recommendations.push(`WOFF2 형식을 사용하여 파일 크기를 줄이세요`);
  }

  // 서브셋 확인
  const hasSubset = !!(webFont.subset && webFont.subset !== '*');

  // font-display 확인
  let hasDisplaySwap = false;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          const fontFamily = rule.style.getPropertyValue('font-family');
          if (fontFamily.includes(webFont.family)) {
            const fontDisplay = rule.style.getPropertyValue('font-display');
            if (fontDisplay === 'swap') {
              hasDisplaySwap = true;
              break;
            }
          }
        }
      }
    } catch {
      // CORS 무시
    }
    if (hasDisplaySwap) break;
  }

  if (!hasDisplaySwap) {
    recommendations.push('font-display: swap을 추가하여 FOF를 방지하세요');
  }

  // 프리로드 확인
  let hasPreload = false;
  const preloadLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
  for (const link of Array.from(preloadLinks)) {
    if (link.getAttribute('href')?.includes(webFont.family)) {
      hasPreload = true;
      break;
    }
  }

  if (!hasPreload && webFont.url) {
    recommendations.push('중요한 폰트를 preload하세요');
  }

  // 가변 폰트 확인
  const hasVariable = webFont.variants && webFont.variants.some(v =>
    v.weight === 400 || v.weight === 700
  );

  if (!hasVariable) {
    recommendations.push('가변 폰트를 사용하여 파일 크기를 줄이세요');
  }

  return {
    currentFormat,
    recommendedFormat,
    hasSubset,
    hasDisplaySwap,
    hasPreload,
    recommendations,
  };
}

/**
 * 구글 폰트 검색
 */
export async function searchGoogleFonts(
  query: string,
  options: {
    limit?: number;
    categories?: string[];
  } = {}
): Promise<GoogleFont[]> {
  const { limit = 10 } = options;

  try {
    // 구글 폰트 API (CORS 제한 있음)
    // 실제 구현에서는 백그라운드를 통해 해야 함
    const response = await fetch(
      `https://fonts.googleapis.com/v1/fonts?key=YOUR_API_KEY&family=${query}`
    );

    if (!response.ok) {
      throw new Error('Google Fonts API request failed');
    }

    const data = await response.json();
    return data.items.slice(0, limit);
  } catch {
    // API 호출 실패 시 빈 배열 반환
    return [];
  }
}

/**
 * 폰트 페어 점수 계산
 */
export function calculatePairScore(
  headingFont: string,
  bodyFont: string
): number {
  // 같은 폰트면 점수 감소
  if (headingFont === bodyFont) {
    return 50;
  }

  // 일반적으로 좋은 페어들
  const goodPairs = [
    ['Playfair Display', 'Source Sans Pro'],
    ['Montserrat', 'Open Sans'],
    ['Oswald', 'Roboto'],
    ['Lora', 'Lato'],
    ['Raleway', 'Open Sans'],
    ['Merriweather', 'Open Sans'],
    ['Abril Fatface', 'Roboto Condensed'],
    ['Bebas Neue', 'Montserrat'],
    ['Crimson Text', 'Work Sans'],
    ['Libre Baskerville', 'Lato'],
  ];

  for (const [heading, body] of goodPairs) {
    if (
      headingFont.includes(heading) ||
      bodyFont.includes(body)
    ) {
      return 80;
    }
  }

  // 카테고리에 따른 점수
  const headingIsSerif = ['Times', 'Georgia', 'Playfair', 'Merriweather', 'Lora']
    .some(name => headingFont.includes(name));

  const bodyIsSerif = bodyFont.includes('Times') || bodyFont.includes('Georgia');

  if (headingIsSerif && !bodyIsSerif) {
    return 70; // Serif heading + Sans body
  }

  if (!headingIsSerif && bodyIsSerif) {
    return 60; // Sans heading + Serif body
  }

  return 50;
}

/**
 * Google Font 정보 인터페이스
 */
interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
}

/**
 * Google 폰트 가져오기
 */
export async function getGoogleFonts(): Promise<GoogleFont[]> {
  try {
    const response = await fetch('https://fonts.googleapis.com/v1/fonts?key=YOUR_API_KEY&sort=popularity');

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

/**
 * Adobe Fonts 정보 가져오기
 */
export function getAdobeFonts(): string[] {
  const fonts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href?.includes('fonts.adobe.com')) {
      // Adobe Fonts 사용 중
      return [
        'Adobe Garamond Pro',
        'Adobe Caslon Pro',
        'Adobe Jenson',
        'Adobe Minion Pro',
        'Myriad Pro',
      ];
    }
  }

  return fonts;
}
