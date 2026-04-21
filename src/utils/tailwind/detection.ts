/**
 * Tailwind Detection Utilities
 *
 * Tailwind CSS 사용 감지 및 버전 확인
 */

import type { TailwindVersion } from '../../types/tailwindScanner';

/**
 * Tailwind CSS 감지 정규식 패턴
 */
const TAILWIND_INDICATORS = {
  // HTML 클래스 속성
  classAttribute: /\bclass\s*=\s*["']([^"']+)["']/gi,

  // Tailwind CDN
  cdnV3: /tailwindcss\.com\/\^[\d.]+/,
  cdnV3Play: /cdn\.tailwindcss\.com/,
  cdnV2: /cdn\.jsdelivr\.net\/npm\/tailwindcss@/,

  // 스타일 태그
  styleTag: /<style[^>]*>[\s\S]*?<\/style>/gi,

  // Tailwind 관련 클래스 패턴
  tailwindClasses: [
    // 레이아웃
    /\b(container|grid|flex|block|inline|hidden|table)\b/,
    // 플렉스박스
    /\b(flex-(row|col|wrap|grow|shrink)|justify-(start|end|center|between|around)|items-(start|end|center|baseline|stretch))\b/,
    // 그리드
    /\bgrid-(cols|rows)-\d/,
    // 간격
    /\b(p|m)[xytrbl]?\d/,
    // 색상
    /\btext-(|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
    /\bbg-(|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
    // 크기
    /\bw-\d|w-(auto|full|screen)\b/,
    /\bh-\d|h-(auto|full|screen)\b/,
    // 폰트
    /\btext-(xs|sm|base|lg|xl|\dxl)\b/,
    /\bfont-(thin|light|normal|medium|semibold|bold|extrabold|black)\b/,
    // 반응형
    /\b(sm|md|lg|xl|2xl):/,
    // 다크 모드
    /\bdark:/,
    // Tailwind v4 특이사항
    /\b@theme\b/,
  ],
};

/**
 * Tailwind CDN URL에서 버전 추출
 */
export function extractVersionFromCDN(url: string): TailwindVersion {
  if (TAILWIND_INDICATORS.cdnV3.test(url) || TAILWIND_INDICATORS.cdnV3Play.test(url)) {
    return 'v3';
  }
  if (TAILWIND_INDICATORS.cdnV2.test(url)) {
    const match = url.match(/tailwindcss@(\d+)/);
    if (match) {
      const majorVersion = parseInt(match[1], 10);
      if (majorVersion === 2) return 'v2';
      if (majorVersion === 3) return 'v3';
      if (majorVersion >= 4) return 'v4';
    }
    return 'v2';
  }
  return 'unknown';
}

/**
 * 스크립트 태그에서 Tailwind CDN 감지
 */
export function detectTailwindCDN(): TailwindVersion {
  const scripts = document.querySelectorAll('script[src]');
  let detectedVersion: TailwindVersion = 'unknown';

  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src) return;

    const version = extractVersionFromCDN(src);
    if (version !== 'unknown') {
      detectedVersion = version;
    }
  });

  return detectedVersion;
}

/**
 * 스타일 태그에서 Tailwind v4 감지 (@theme)
 */
export function detectTailwindV4(): boolean {
  const styleTags = document.querySelectorAll('style');
  for (const style of styleTags) {
    if (style.textContent?.includes('@theme') || style.textContent?.includes('@utility')) {
      return true;
    }
  }
  return false;
}

/**
 * PostCSS 설정 감지 (개발 환경)
 */
export function detectPostCSSConfig(): boolean {
  // 실제로는 접근할 수 없지만, 페이지 내 Tailwind 클래스 존재로 추론
  return detectTailwindClasses().count > 10;
}

/**
 * Tailwind 클래스 감지
 */
export function detectTailwindClasses(): {
  count: number;
  examples: string[];
  categories: Record<string, number>;
} {
  const elements = document.querySelectorAll('[class]');
  const classes = new Set<string>();
  const examples: string[] = [];
  const categories: Record<string, number> = {};

  elements.forEach((el) => {
    const classNames = el.className?.toString().split(/\s+/) || [];
    classNames.forEach((cls) => {
      if (cls && isTailwindClass(cls)) {
        classes.add(cls);
      }
    });
  });

  classes.forEach((cls) => {
    if (examples.length < 20) {
      examples.push(cls);
    }
    const category = categorizeClass(cls);
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    count: classes.size,
    examples,
    categories,
  };
}

/**
 * 단일 클래스가 Tailwind 클래스인지 확인
 */
export function isTailwindClass(className: string): boolean {
  // Tailwind 클래스 패턴 확인
  const patterns = [
    // 기본 패턴: prefix-variant-value
    /^(?:[a-z]+:)?(?:[a-z]+-)?[a-z0-9-]+$/i,
    // 음수 값
    /^-\[?[\w.]+\]?$/,
  ];

  // Tailwind 예약어 확인
  const tailwindKeywords = [
    'container', 'sr-only', 'not-sr-only',
    'peer', 'group', 'focus-within', 'focus-visible',
    'motion-safe', 'motion-reduce', 'print', 'portrait', 'landscape',
  ];

  if (tailwindKeywords.includes(className)) {
    return true;
  }

  // 패턴 일치 확인
  for (const pattern of patterns) {
    if (pattern.test(className)) {
      // 추가 검증: 일반적인 웹 클래스 이름 필터링
      if (!looksLikeCustomClass(className)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 커스텀 클래스인 것 같은지 확인
 */
function looksLikeCustomClass(className: string): boolean {
  // 대문자가 포함된 경우 (일반적으로 Tailwind는 소문자만)
  if (/[A-Z]/.test(className)) {
    return true;
  }

  // 너무 긴 클래스 이름 (20자 이상)
  if (className.length > 20 && !className.includes('[')) {
    return true;
  }

  // 특정 CSS 프레임워크 클래스 필터링
  const frameworkClasses = [
    'btn-', 'button-', 'card-', 'nav-', 'header-', 'footer-', 'sidebar-',
    'active', 'disabled', 'selected', 'hidden', 'visible',
  ];

  for (const prefix of frameworkClasses) {
    if (className.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * 클래스 카테고리 분류
 */
function categorizeClass(className: string): string {
  const categories = {
    layout: /^(container|(?:flex|grid|block|inline|table|hidden|flow))/,
    flexbox: /^(flex|shrink|grow|justify|items|self|place)/,
    grid: /^grid/,
    spacing: /^(p|m)[xytrbl]?/,
    sizing: /^(w|h|min-w|max-w|min-h|max-h)/,
    typography: /^(text|font|leading|tracking|align)/,
    colors: /^(text|bg|border|ring|fill|stroke)-(?!transparent|current)/,
    effects: /^(shadow|opacity|mix-blend|filter|blur)/,
    transitions: /^transition/,
    transforms: /^(scale|rotate|translate|skew)/,
    interactivity: /^(cursor|pointer|select|touch|resiz|user)/,
    svg: /^(stroke|fill)-/,
  };

  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(className)) {
      return category;
    }
  }

  return 'other';
}

/**
 * Tailwind 사용 감지 (메인 함수)
 */
export function detectTailwind(): {
  isDetected: boolean;
  version: TailwindVersion;
  confidence: number;
  source: 'cdn' | 'build' | 'unknown';
  classCount: number;
} {
  let version: TailwindVersion = 'unknown';
  let source: 'cdn' | 'build' | 'unknown' = 'unknown';
  let confidence = 0;

  // CDN 감지
  version = detectTailwindCDN();
  if (version !== 'unknown') {
    source = 'cdn';
    confidence = 0.95;
    return { isDetected: true, version, confidence, source, classCount: 0 };
  }

  // v4 감지
  if (detectTailwindV4()) {
    version = 'v4';
    source = 'build';
    confidence = 0.9;
    return { isDetected: true, version, confidence, source, classCount: 0 };
  }

  // 클래스 기반 감지
  const classDetection = detectTailwindClasses();
  if (classDetection.count > 5) {
    version = 'v3'; // 기본값
    source = 'build';
    confidence = Math.min(0.8, classDetection.count / 50);
    return {
      isDetected: true,
      version,
      confidence,
      source,
      classCount: classDetection.count,
    };
  }

  return { isDetected: false, version: 'unknown', confidence: 0, source: 'unknown', classCount: 0 };
}

/**
 * Tailwind 버전 추론
 */
export function inferTailwindVersion(): TailwindVersion {
  const detection = detectTailwind();
  if (!detection.isDetected) {
    return 'unknown';
  }
  return detection.version;
}

/**
 * Tailwind JIT 모드 감지
 */
export function detectJITMode(): boolean {
  // JIT 모드 특징:
  // 1. 임의 값 사용: [value]
  // 2. 동적 클래스: md:w-[500px]
  const elements = document.querySelectorAll('[class]');
  let arbitraryCount = 0;
  let totalClasses = 0;

  elements.forEach((el) => {
    const classNames = el.className?.toString().split(/\s+/) || [];
    classNames.forEach((cls) => {
      totalClasses++;
      if (cls.includes('[') && cls.includes(']')) {
        arbitraryCount++;
      }
    });
  });

  // 임의 값 클래스가 1% 이상이면 JIT로 간주
  return totalClasses > 0 && arbitraryCount / totalClasses > 0.01;
}
