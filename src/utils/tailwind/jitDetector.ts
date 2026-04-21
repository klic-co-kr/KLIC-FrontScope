/**
 * JIT Mode Detection Utilities
 *
 * Tailwind CSS JIT 모드 감지 및 분석
 */

import { extractAllArbitraryValues } from './arbitraryDetector';

/**
 * JIT 모드 특징 패턴
 */
const JIT_INDICATORS = {
  // 임의 값: [value]
  arbitrary: /\[[\w#()%,.-]+\]/,

  // 동적 클래스 생성 패턴
  dynamicVariants: [
    // 반응형 + 상태 + 값: hover:md:text-red-500
    /^(hover|focus|active|visited|disabled|group-hover|peer-hover|focus-within|focus-visible):(sm|md|lg|xl|2xl):/,
    // 상태 + 반응형 + 값: md:hover:text-red-500
    /^(sm|md|lg|xl|2xl):(hover|focus|active|visited|disabled):/,
  ],

  // 스택된 변형
  stackedVariants: /\w+:\w+:\w+/,

  // JIT 전용 클래스
  jitOnly: [
    // 콘텐츠 기반 변형
    /has-\[.*\]/,
    /group-\[.*\]/,
    /peer-\[.*\]/,

    // 스타일 기반 변형
    /not-\[.*\]/,
  ],
};

/**
 * JIT 모드 감지 결과
 */
export interface JITDetectionResult {
  isJIT: boolean;
  confidence: number;
  indicators: {
    arbitraryValues: number;
    dynamicVariants: number;
    stackedVariants: number;
    jitOnlyClasses: number;
  };
  details: {
    arbitraryRatio: number; // 임의 값 클래스 비율
    avgVariantDepth: number; // 평균 변형 깊이
    uniqueClassCount: number;
  };
}

/**
 * 문서에서 JIT 모드 감지
 */
export function detectJITMode(): JITDetectionResult {
  const elements = document.querySelectorAll('[class]');
  let totalClasses = 0;
  let arbitraryValues = 0;
  let dynamicVariants = 0;
  let stackedVariants = 0;
  let jitOnlyClasses = 0;
  let totalVariantDepth = 0;
  const uniqueClasses = new Set<string>();

  elements.forEach((element) => {
    const classNames = element.className?.toString().split(/\s+/) || [];

    classNames.forEach((className) => {
      if (!className) return;

      totalClasses++;
      uniqueClasses.add(className);

      // 임의 값 확인
      if (JIT_INDICATORS.arbitrary.test(className)) {
        arbitraryValues++;
      }

      // 변형 깊이 계산
      const variantDepth = (className.match(/:/g) || []).length;
      totalVariantDepth += variantDepth;

      // 동적 변형 확인
      for (const pattern of JIT_INDICATORS.dynamicVariants) {
        if (pattern.test(className)) {
          dynamicVariants++;
          break;
        }
      }

      // 스택된 변형 확인 (3개 이상 :)
      if (variantDepth >= 2) {
        stackedVariants++;
      }

      // JIT 전용 클래스 확인
      for (const pattern of JIT_INDICATORS.jitOnly) {
        if (pattern.test(className)) {
          jitOnlyClasses++;
          break;
        }
      }
    });
  });

  // 신뢰도 계산
  const confidence = calculateJITConfidence({
    totalClasses,
    arbitraryValues,
    dynamicVariants,
    stackedVariants,
    jitOnlyClasses,
    uniqueClassCount: uniqueClasses.size,
  });

  // 임의 값 비율
  const arbitraryRatio = totalClasses > 0 ? arbitraryValues / totalClasses : 0;

  // 평균 변형 깊이
  const avgVariantDepth = totalClasses > 0 ? totalVariantDepth / totalClasses : 0;

  return {
    isJIT: confidence > 0.5,
    confidence,
    indicators: {
      arbitraryValues,
      dynamicVariants,
      stackedVariants,
      jitOnlyClasses,
    },
    details: {
      arbitraryRatio,
      avgVariantDepth,
      uniqueClassCount: uniqueClasses.size,
    },
  };
}

/**
 * JIT 신뢰도 계산
 */
function calculateJITConfidence(data: {
  totalClasses: number;
  arbitraryValues: number;
  dynamicVariants: number;
  stackedVariants: number;
  jitOnlyClasses: number;
  uniqueClassCount: number;
}): number {
  let confidence = 0;
  const { totalClasses, arbitraryValues, dynamicVariants, stackedVariants, jitOnlyClasses } = data;

  if (totalClasses === 0) {
    return 0;
  }

  // 임의 값 존재 (강력한 신호)
  if (arbitraryValues > 0) {
    const arbitraryRatio = arbitraryValues / totalClasses;
    confidence += Math.min(arbitraryRatio * 5, 0.4); // 최대 0.4
  }

  // 동적 변형 존재
  if (dynamicVariants > 0) {
    const dynamicRatio = dynamicVariants / totalClasses;
    confidence += Math.min(dynamicRatio * 3, 0.25); // 최대 0.25
  }

  // 스택된 변형 존재
  if (stackedVariants > 0) {
    const stackedRatio = stackedVariants / totalClasses;
    confidence += Math.min(stackedRatio * 2, 0.15); // 최대 0.15
  }

  // JIT 전용 클래스 존재
  if (jitOnlyClasses > 0) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1);
}

/**
 * 스크립트 태그에서 Tailwind Play CDN 감지 (항상 JIT)
 */
export function detectTailwindPlayCDN(): boolean {
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (src?.includes('cdn.tailwindcss.com')) {
      return true;
    }
  }
  return false;
}

/**
 * 개발자 도구에서 JIT 구성 감지
 */
export function detectJITConfiguration(): {
  mode: 'jit' | 'cli' | 'unknown';
  safelist?: string[];
  important?: boolean;
  prefix?: string;
  separator?: string;
} {
  // DOM에서 직접 구성을 읽을 수 없으므로 클래스 패턴으로 추론
  const detection = detectJITMode();

  if (!detection.isJIT) {
    return { mode: 'cli' };
  }

  // 접두사 추론
  let prefix: string | undefined;
  const elements = document.querySelectorAll('[class]');
  for (const element of elements) {
    const classNames = element.className?.toString().split(/\s+/) || [];
    for (const cls of classNames) {
      // tw- 같은 커스텀 접두사 확인
      if (/^(tw|css)-/.test(cls)) {
        prefix = cls.match(/^(tw|css)-/)?.[0];
        break;
      }
    }
    if (prefix) break;
  }

  // 구분자 추론
  let separator: string | undefined;
  // JIT 기본값은 ':'이지만 커스텀 가능

  return {
    mode: 'jit',
    prefix,
    separator,
  };
}

/**
 * JIT에서 생성된 클래스 추정
 */
export function estimateGeneratedClasses(): {
  estimatedTotal: number;
  actualUsed: number;
  utilizationRatio: number;
  potentialUnused: string[];
} {
  // 실제 사용된 클래스
  const elements = document.querySelectorAll('[class]');
  const actualUsed = new Set<string>();

  elements.forEach((element) => {
    const classNames = element.className?.toString().split(/\s+/) || [];
    classNames.forEach((cls) => {
      if (cls) actualUsed.add(cls);
    });
  });

  // 기본 Tailwind v3 클래스 수 (대략)
  const baseUtilityCount = 50000;

  // 변형 조합으로 생성 가능한 클래스 수
  const variants = [
    '', 'hover:', 'focus:', 'active:', 'focus-within:', 'focus-visible:',
    'sm:', 'md:', 'lg:', 'xl:', '2xl:', 'dark:',
  ];

  // 조합 가능한 클래스 수 (이론적 최대값)
  // 실제로는 모든 조합이 사용되지 않음
  const estimatedTotal = baseUtilityCount * variants.length;

  // 활용률 (실제 사용 / 생성 가능)
  const utilizationRatio = actualUsed.size / estimatedTotal;

  // 잠재적으로 사용되지 않은 클래스 (샘플)
  const potentialUnused: string[] = [];

  // 일반적으로 사용되지만 현재 페이지에 없는 클래스
  const commonClasses = [
    'container', 'mx-auto', 'px-4', 'py-2',
    'text-center', 'font-bold', 'text-xl',
    'bg-white', 'text-black', 'rounded',
  ];

  commonClasses.forEach((cls) => {
    if (!actualUsed.has(cls)) {
      potentialUnused.push(cls);
    }
  });

  return {
    estimatedTotal,
    actualUsed: actualUsed.size,
    utilizationRatio,
    potentialUnused,
  };
}

/**
 * JIT 최적화 제안
 */
export function getJITOptimizationSuggestions(): {
  safelistedArbitrary: string[];
  canConsolidate: string[];
  considerConfig: string[];
} {
  const arbitraryData = extractAllArbitraryValues();
  const safelistedArbitrary: string[] = [];
  const canConsolidate: string[] = [];
  const considerConfig: string[] = [];

  // 반복되는 임의 값 확인 (safelist 후보)
  const valueFrequency = new Map<string, number>();
  arbitraryData.values.forEach((v) => {
    const key = `${v.property}:${v.value}`;
    valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
  });

  valueFrequency.forEach((count, key) => {
    if (count >= 3) {
      safelistedArbitrary.push(key);
    }
  });

  // 커스텀 테마 추천
  if (arbitraryData.values.length > 10) {
    considerConfig.push('반복되는 임의 값을 theme.extend에 추가하여 CSS 크기 줄이기');
  }

  // 다크 모드 사용 확인
  const hasDarkMode = document.querySelectorAll('[class*="dark:"]').length > 0;
  if (hasDarkMode) {
    considerConfig.push('darkMode: "class" 설정 확인');
  }

  return {
    safelistedArbitrary,
    canConsolidate,
    considerConfig,
  };
}

/**
 * JIT vs CLI 모드 비교 분석
 */
export function compareJITvsCLI(): {
  currentMode: 'jit' | 'cli' | 'unknown';
  recommendation: string;
  benefits: string[];
  drawbacks: string[];
} {
  const detection = detectJITMode();
  const isPlayCDN = detectTailwindPlayCDN();

  if (isPlayCDN) {
    return {
      currentMode: 'jit',
      recommendation: 'Tailwind Play CDN은 개발용입니다. 프로덕션에서는 빌드 과정을 사용하세요.',
      benefits: [
        '모든 클래스를 JIT로 생성',
        '별도 설정 불필요',
        '빠른 프로토타이핑',
      ],
      drawbacks: [
        '프로덕션에 적합하지 않음',
        '매번 클래스를 컴파일하여 성능 저하',
        'CSS 크기가 커짐',
      ],
    };
  }

  if (detection.isJIT) {
    return {
      currentMode: 'jit',
      recommendation: '현재 JIT 모드를 사용 중입니다. Tailwind v3+의 권장 모드입니다.',
      benefits: [
        '모든 변형 조합 지원',
        '임의 값 사용 가능',
        '더 빠른 빌드 시간',
        '작은 CSS 파일',
        '삭제되지 않은 스타일',
      ],
      drawbacks: [
        '일부 레거시 브라우저에서 문제 가능성',
        'PostCSS 8 필요',
      ],
    };
  }

  return {
    currentMode: 'cli',
    recommendation: '현재 CLI 모드를 사용 중입니다. JIT 모드로 업그레이드를 고려해보세요.',
    benefits: [
      '레거시 브라우저 호환성',
    ],
    drawbacks: [
      '제한된 변형 조합',
      '더 큰 CSS 파일',
      '느린 빌드 시간',
    ],
  };
}
