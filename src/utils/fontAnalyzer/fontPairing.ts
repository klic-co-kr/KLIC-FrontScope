/**
 * Font Pairing Utilities
 *
 * 폰트 페어링 유틸리티
 */

import type { FontPair } from '../../types/fontAnalyzer';
import { POPULAR_FONT_PAIRS } from '../../constants/fontAnalyzerDefaults';

/**
 * 폰트 페어 추천
 */
export function suggestFontPair(
  currentHeading?: string,
  currentBody?: string
): FontPair[] {
  const pairs: FontPair[] = [];

  // 인기 있는 페어 추가
  for (const pair of POPULAR_FONT_PAIRS) {
    const score = calculatePairScore(pair.heading, pair.body);
    pairs.push({
      heading: pair.heading,
      body: pair.body,
      score,
      contrast: 0, // TODO: 계산 필요
    });
  }

  // 현재 폰트와 조합이 좋은 페어 추천
  if (currentBody) {
    const compatible = getCompatiblePairs();
    for (const heading of compatible) {
      const score = calculatePairScore(heading, currentBody);
      pairs.push({
        heading,
        body: currentBody,
        score,
        contrast: 0,
      });
    }
  }

  // 점수순 정렬
  pairs.sort((a, b) => b.score - a.score);

  return pairs.slice(0, 10);
}

/**
 * 호환 가능한 폰트 페어 찾기
 */
function getCompatiblePairs(): string[] {
  const headingFonts = [
    'Playfair Display',
    'Montserrat',
    'Oswald',
    'Lora',
    'Raleway',
    'Merriweather',
    'Abril Fatface',
    'Bebas Neue',
    'Crimson Text',
    'Libre Baskerville',
    'Noto Serif KR',
    'Noto Serif JP',
    'Noto Serif SC',
  ];

  return headingFonts;
}

/**
 * 폰트 페어 점수 계산
 */
function calculatePairScore(headingFont: string, bodyFont: string): number {
  let score = 50;

  // 카테고리 매칭 (서로 + 산세르프 조합이 좋음)
  const headingIsSerif = [
    'Times',
    'Georgia',
    'Playfair',
    'Merriweather',
    'Lora',
    'Noto Serif',
    'Garamond',
  ].some(name => headingFont.includes(name));

  const bodyIsSerif = bodyFont.includes('Times') || bodyFont.includes('Georgia');

  if (headingIsSerif && !bodyIsSerif) {
    score += 20; // 서로 헤딩 + 산세리프 바디
  }

  if (!headingIsSerif && bodyIsSerif) {
    score += 15; // 산세리프 헤딩 + 서로 바디
  }

  // x-height 대비 검사
  const headingHasX = headingFont.includes('X') || headingFont.includes('Lowercase');
  const bodyHasX = bodyFont.includes('X') || bodyFont.includes('Lowercase');

  if (headingHasX && bodyHasX) {
    score += 5; // 둘 다 x-height 폰트
  }

  // 인기 페어 가중치
  const pairKey = `${headingFont}:${bodyFont}`;
  const popularPairs = [
    'Playfair Display:Source Sans Pro',
    'Montserrat:Open Sans',
    'Oswald:Roboto',
    'Lora:Lato',
    'Raleway:Open Sans',
    'Merriweather:Open Sans',
  ];

  for (const pair of popularPairs) {
    if (pairKey === pair || pairKey.includes(pair)) {
      score += 30;
      break;
    }
  }

  return Math.min(100, score);
}

/**
 * 폰트 페어 미리보기 생성
 */
export function createPairPreview(
  heading: string,
  body: string,
  options: {
    headingText?: string;
    bodyText?: string;
    size?: number;
  } = {}
): { heading: HTMLElement; body: HTMLElement } {
  const {
    headingText = 'Heading',
    bodyText = 'Body text example with quick brown fox jumps over the lazy dog.',
    size = 16,
  } = options;

  // 헤딩 미리보기
  const headingPreview = document.createElement('div');
  headingPreview.className = 'font-pair-heading';
  headingPreview.style.cssText = `
    font-family: ${heading};
    font-size: ${size * 1.5}px;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 0.5rem;
  `;
  headingPreview.textContent = headingText;

  // 바디 미리보기
  const bodyPreview = document.createElement('div');
  bodyPreview.className = 'font-pair-body';
  bodyPreview.style.cssText = `
    font-family: ${body};
    font-size: ${size}px;
    line-height: 1.5;
  `;
  bodyPreview.textContent = bodyText;

  return { heading: headingPreview, body: bodyPreview };
}

/**
 * 대비율 계산
 */
export function calculatePairContrast(
  heading: string,
  body: string
): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  // 간단화된 대비율 계산 (실제로는 렌더링된 텍스트로 계산해야 함)
  // 기본값으로 중간 정도의 대비율 반환
  const headingSize = parseInt(heading) || 16;
  const bodySize = parseInt(body) || 16;

  const ratio = headingSize / bodySize;

  return {
    ratio,
    wcagAA: ratio >= 1.2 && ratio <= 2.0,
    wcagAAA: ratio >= 1.5 && ratio <= 3.0,
  };
}

/**
 * 좋은 폰트 페어 규칙
 */
export function validatePair(heading: string, body: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 같은 폰트 패밀리 사용하지 않기
  if (heading === body) {
    issues.push('Heading and body use the same font');
  }

  // 너무 유사한 폰트 피하기
  if (heading.split(' ')[0] === body.split(' ')[0]) {
    issues.push('Heading and body are too similar');
  }

  // 크기 차이 확인
  const { ratio } = calculatePairContrast(heading, body);
  if (ratio < 1.2 || ratio > 3.0) {
    issues.push('Size ratio is outside recommended range (1.2-2.0)');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * 문서 기반 폰트 페어 추천
 */
export function getDocumentFontPairings(): Array<{
  heading: string;
  body: string;
  usageCount: number;
}> {
  const pairings = new Map<string, number>();

  // 문서의 헤딩과 바디 폰트 분석
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const bodies = document.querySelectorAll('p, span, div');

  const headingFonts = new Set<string>();
  const bodyFonts = new Set<string>();

  for (const heading of Array.from(headings)) {
    const fontInfo = extractFontInfo(heading as HTMLElement);
    if (fontInfo) {
      headingFonts.add(fontInfo.family);
    }
  }

  for (const body of Array.from(bodies)) {
    const fontInfo = extractFontInfo(body as HTMLElement);
    if (fontInfo && (body as HTMLElement).textContent?.trim()) {
      bodyFonts.add(fontInfo.family);
    }
  }

  // 페어링 생성
  for (const headingFont of headingFonts) {
    for (const bodyFont of bodyFonts) {
      const key = `${headingFont}:${bodyFont}`;
      pairings.set(key, (pairings.get(key) || 0) + 1);
    }
  }

  return Array.from(pairings.entries())
    .map(([pair, count]) => {
      const [heading, body] = pair.split(':');
      return { heading, body, usageCount: count };
    })
    .sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * extractFontInfo import
 */
import { extractFontInfo } from './fontExtractor';
