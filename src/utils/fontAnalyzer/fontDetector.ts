/**
 * Font Detection Utilities
 *
 * 폰트 감지 유틸리티
 */

import type { FontInfo, FontCategory, FontDetectionResult } from '../../types/fontAnalyzer';
import { extractFontInfo } from './fontExtractor';
import { getSystemFonts } from './systemFontUtils';
import { extractWebFonts } from './webFontUtils';

/**
 * 페이지의 모든 폰트 감지
 */
export function detectAllFonts(): FontDetectionResult {
  const systemFonts = getSystemFonts();
  const webFonts = extractWebFonts();
  const usedFonts = new Map<string, FontInfo[]>();

  // 모든 요소에서 사용된 폰트 수집
  const elements = document.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;
    if (!element.textContent?.trim()) continue;

    const font = extractFontInfo(element);
    if (!font) continue;

    const key = font.family.toLowerCase();
    if (!usedFonts.has(key)) {
      usedFonts.set(key, []);
    }
    usedFonts.get(key)!.push(font);
  }

  // 시스템 폰트와 웹 폰트 분류
  const detectedSystemFonts: string[] = [];
  const detectedWebFonts: string[] = [];
  const unknownFonts: string[] = [];

  for (const [family, fonts] of usedFonts.entries()) {
    const actualFamily = fonts[0].family;

    // 시스템 폰트 확인
    const isSystem = systemFonts.some(sf =>
      sf.family.toLowerCase() === family && sf.available
    );
    if (isSystem) {
      detectedSystemFonts.push(actualFamily);
      continue;
    }

    // 웹 폰트 확인
    const isWeb = webFonts.some(wf =>
      wf.family.toLowerCase() === family
    );
    if (isWeb) {
      detectedWebFonts.push(actualFamily);
      continue;
    }

    // 알 수 없는 폰트
    unknownFonts.push(actualFamily);
  }

  return {
    systemFonts: detectedSystemFonts,
    webFonts: detectedWebFonts,
    unknownFonts,
    totalFonts: usedFonts.size,
    usedFonts: Array.from(usedFonts.entries()).map(([, fonts]) => ({
      family: fonts[0].family,
      count: fonts.length,
      variants: [...new Set(fonts.map(f => `${f.weight} ${f.style}`))],
      category: categorizeFont(fonts[0]),
    })),
  };
}

/**
 * 폰트 카테고리 분류
 */
export function categorizeFont(font: FontInfo): FontCategory {
  const family = font.family.toLowerCase();

  // 세리프 폰트
  const serifPatterns = [
    'times', 'georgia', 'garamond', 'baskerville', 'palatino',
    'bookman', 'caslon', 'merriweather', 'lora', 'crimson',
    'playfair', 'libre', 'source serif', 'noto serif',
  ];
  if (serifPatterns.some(p => family.includes(p))) {
    return 'serif';
  }

  // 산세리프 폰트
  const sansSerifPatterns = [
    'arial', 'helvetica', 'verdana', 'geneva', 'lucida',
    'trebuchet', 'gill sans', 'calibri', 'segoe', 'roboto',
    'open sans', 'lato', 'montserrat', 'source sans', 'noto sans',
    'inter', 'sf pro', 'system-ui', 'sans-serif',
  ];
  if (sansSerifPatterns.some(p => family.includes(p))) {
    return 'sans-serif';
  }

  // 모노스페이스 폰트
  const monospacePatterns = [
    'courier', 'consolas', 'monaco', 'menlo', 'inconsolata',
    'fira code', 'source code', 'roboto mono', 'ubuntu mono',
    'droid sans', 'monospace', 'coding',
  ];
  if (monospacePatterns.some(p => family.includes(p))) {
    return 'monospace';
  }

  // 디스플레이/장식 폰트
  const displayPatterns = [
    'impact', 'comic', 'papyrus', 'brush', 'lobster',
    'bebas', 'algerian', 'cooper', 'black',
  ];
  if (displayPatterns.some(p => family.includes(p))) {
    return 'display';
  }

  // 필기체 폰트
  const cursivePatterns = [
    'cursive', 'script', 'handwriting', 'dancing',
    'pacifico', 'satisfy', 'great vibes',
  ];
  if (cursivePatterns.some(p => family.includes(p))) {
    return 'cursive';
  }

  // 기본값
  return 'sans-serif';
}

/**
 * 특정 요소의 폰트 감지
 */
export function detectElementFont(
  element: HTMLElement
): {
  font: FontInfo;
  isSystem: boolean;
  isWeb: boolean;
  category: FontCategory;
  fallback?: string;
} | null {
  const font = extractFontInfo(element);
  if (!font) return null;

  const systemFonts = getSystemFonts();
  const webFonts = extractWebFonts();

  const isSystem = systemFonts.some(sf =>
    sf.family.toLowerCase() === font.family.toLowerCase() && sf.available
  );

  const isWeb = webFonts.some(wf =>
    wf.family.toLowerCase() === font.family.toLowerCase()
  );

  // Fallback 감지
  const testElement = document.createElement('span');
  testElement.style.fontFamily = font.family;
  testElement.style.visibility = 'hidden';
  testElement.textContent = 'A';
  document.body.appendChild(testElement);

  const computedFont = window.getComputedStyle(testElement).fontFamily;
  document.body.removeChild(testElement);

  const fallback = computedFont !== font.family
    ? computedFont.split(',')[0]?.replace(/['"]/g, '').trim()
    : undefined;

  return {
    font,
    isSystem,
    isWeb,
    category: categorizeFont(font),
    fallback,
  };
}

/**
 * FOBIT (Flash of Unstyled Text) 감지
 */
export function detectFOBIT(): {
  hasFOBIT: boolean;
  affectedFonts: string[];
  recommendations: string[];
} {
  const webFonts = extractWebFonts();
  const affectedFonts: string[] = [];

  for (const webFont of webFonts) {
    // font-display 확인
    let hasDisplaySwap = false;

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSFontFaceRule) {
            const fontFamily = rule.style.getPropertyValue('font-family');
            if (fontFamily.includes(webFont.family)) {
              const fontDisplay = rule.style.getPropertyValue('font-display');
              if (fontDisplay === 'swap') {
                hasDisplaySwap = true;
              }
              break;
            }
          }
        }
      } catch {
        // CORS 오류 무시
      }
    }

    if (!hasDisplaySwap) {
      affectedFonts.push(webFont.family);
    }
  }

  const recommendations: string[] = [];
  if (affectedFonts.length > 0) {
    recommendations.push('font-display: swap을 추가하여 FOBIT을 방지하세요');
    recommendations.push('또는 font-face에 unicode-range를 추가하여 필요한 문자만 로드하세요');
  }

  return {
    hasFOBIT: affectedFonts.length > 0,
    affectedFonts,
    recommendations,
  };
}

/**
 * 폰트 로딩 실패 감지
 */
export function detectFontLoadFailures(): string[] {
  const failedFonts: string[] = [];

  // document.fonts API 사용
  document.fonts.forEach((fontFace) => {
    if (fontFace.status === 'error' || fontFace.status === 'unloaded') {
      failedFonts.push(fontFace.family);
    }
  });

  return failedFonts;
}

/**
 * 사용되지 않는 웹 폰트 감지
 */
export function detectUnusedWebFonts(): string[] {
  const webFonts = extractWebFonts();
  const usedFonts = new Set<string>();

  // 모든 요소에서 실제로 사용된 폰트 수집
  const elements = document.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const style = window.getComputedStyle(element);
    const fontFamily = style.fontFamily.split(',')[0]?.replace(/['"]/g, '').trim();
    if (fontFamily) {
      usedFonts.add(fontFamily.toLowerCase());
    }
  }

  // 사용되지 않은 웹 폰트 필터링
  const unusedFonts = webFonts
    .filter(wf => !usedFonts.has(wf.family.toLowerCase()))
    .map(wf => wf.family);

  return unusedFonts;
}

/**
 * 폰트 파일 크기 추정
 */
export function estimateWebFontSize(fontFamily: string): {
  totalSize: number;
  format: string;
  variants: number;
  recommendations: string[];
} {
  const webFonts = extractWebFonts();
  const targetFont = webFonts.find(wf =>
    wf.family.toLowerCase() === fontFamily.toLowerCase()
  );

  if (!targetFont) {
    return {
      totalSize: 0,
      format: 'unknown',
      variants: 0,
      recommendations: ['폰트를 찾을 수 없습니다'],
    };
  }

  // 간단한 크기 추정 (실제로는 헤더 요청이 필요함)
  const avgVariantSize = 50; // KB
  const variants = targetFont.variants?.length || 1;
  const totalSize = avgVariantSize * variants;

  const recommendations: string[] = [];
  if (totalSize > 200) {
    recommendations.push('폰트 파일 크기가 큽니다. 서브셋팅을 고려하세요');
    recommendations.push('WOFF2 형식을 사용하여 파일 크기를 줄이세요');
  }
  if (variants > 4) {
    recommendations.push('불필요한 폰트 변형을 제거하세요');
  }

  return {
    totalSize,
    format: targetFont.url ? detectFormatFromUrl(targetFont.url) : 'unknown',
    variants,
    recommendations,
  };
}

/**
 * URL에서 형식 감지
 */
function detectFormatFromUrl(url: string): string {
  const path = url.toLowerCase();
  if (path.includes('.woff2')) return 'woff2';
  if (path.includes('.woff')) return 'woff';
  if (path.includes('.ttf')) return 'ttf';
  if (path.includes('.otf')) return 'otf';
  if (path.includes('.eot')) return 'eot';
  return 'unknown';
}

/**
 * CJK (중국어, 일본어, 한국어) 폰트 감지
 */
export function detectCJKFonts(): {
  chinese: string[];
  japanese: string[];
  korean: string[];
} {
  const systemFonts = getSystemFonts();
  const webFonts = extractWebFonts();

  const chinese: string[] = [];
  const japanese: string[] = [];
  const korean: string[] = [];

  // 시스템 폰트 확인
  for (const sysFont of systemFonts) {
    const family = sysFont.family.toLowerCase();

    // 한국어
    if (family.includes('malgun') || family.includes('dotum') ||
        family.includes('gulim') || family.includes('batang') ||
        family.includes('gungsuh')) {
      korean.push(sysFont.family);
    }

    // 일본어
    if (family.includes('hiragino') || family.includes('yu gothic') ||
        family.includes('meiryo') || family.includes('ms p')) {
      japanese.push(sysFont.family);
    }

    // 중국어
    if (family.includes('microsoft yahei') || family.includes('simhei') ||
        family.includes('pingfang') || family.includes('heiti')) {
      chinese.push(sysFont.family);
    }
  }

  // 웹 폰트 확인
  for (const webFont of webFonts) {
    const family = webFont.family.toLowerCase();

    if (family.includes('noto sans kr') || family.includes('noto serif kr') ||
        family.includes('nanum')) {
      korean.push(webFont.family);
    }

    if (family.includes('noto sans jp') || family.includes('noto serif jp')) {
      japanese.push(webFont.family);
    }

    if (family.includes('noto sans sc') || family.includes('noto serif sc')) {
      chinese.push(webFont.family);
    }
  }

  return {
    chinese: [...new Set(chinese)],
    japanese: [...new Set(japanese)],
    korean: [...new Set(korean)],
  };
}

/**
 * 가변 폰트 감지
 */
export function detectVariableFonts(): string[] {
  const variableFonts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSFontFaceRule) {
          const fontVariationSettings = rule.style.getPropertyValue('font-variation-settings');
          if (fontVariationSettings && fontVariationSettings !== 'normal') {
            const fontFamily = rule.style.getPropertyValue('font-family');
            variableFonts.push(fontFamily.replace(/['"]/g, ''));
          }
        }
      }
    } catch {
      // CORS 오류 무시
    }
  }

  return [...new Set(variableFonts)];
}

/**
 * 폰트 최적화 상태 점검
 */
export function checkFontOptimization(): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // FOBIT 확인
  const fobit = detectFOBIT();
  if (fobit.hasFOBIT) {
    score -= 20;
    issues.push(...fobit.affectedFonts.map(f => `${f}: font-display: swap 미사용`));
  }

  // 사용되지 않는 폰트 확인
  const unusedFonts = detectUnusedWebFonts();
  if (unusedFonts.length > 0) {
    score -= 15;
    issues.push(...unusedFonts.map(f => `${f}: 사용되지 않음`));
    recommendations.push('사용되지 않는 웹 폰트를 제거하세요');
  }

  // 로딩 실패 확인
  const failedFonts = detectFontLoadFailures();
  if (failedFonts.length > 0) {
    score -= 30;
    issues.push(...failedFonts.map(f => `${f}: 로딩 실패`));
    recommendations.push('로딩 실패한 폰트를 확인하세요');
  }

  // 가변 폰트 사용 확인
  const variableFonts = detectVariableFonts();
  if (variableFonts.length === 0) {
    score -= 5;
    recommendations.push('가변 폰트를 사용하여 파일 크기를 줄이세요');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}
