# Phase 1: 기반 설정

**태스크**: 6개
**예상 시간**: 2시간
**의존성**: 없음

---

### Task #9.1: 타입 정의 - 기본 인터페이스

- **파일**: `src/types/tailwindScanner.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Tailwind 클래스 정보
 */
export interface TailwindClass {
  name: string;                   // 클래스명 (예: 'bg-blue-500')
  category: ClassCategory;        // 카테고리
  isValid: boolean;              // 유효한 Tailwind 클래스인지
  isArbitrary: boolean;          // 임의 값 사용인지 (예: 'w-[123px]')
  isCustom: boolean;             // 사용자 정의 클래스인지
  value?: string;                // 추출된 값 (예: '123px')
  properties?: string[];         // 해당 CSS 속성들
}

/**
 * Tailwind 클래스 카테고리
 */
export type ClassCategory =
  | 'layout'        // display, position, etc
  | 'flexbox'       // flex, gap, etc
  | 'grid'          // grid, cols, etc
  | 'spacing'       // padding, margin
  | 'sizing'        // width, height
  | 'typography'    // font, text, etc
  | 'background'    // bg, gradient
  | 'borders'       // border, rounded
  | 'effects'       // shadow, opacity
  | 'filters'       // blur, brightness
  | 'tables'        // table 관련
  | 'transitions'   // transition, transform
  | 'interactivity' // hover, focus, etc
  | 'unknown';

/**
 * Tailwind 버전
 */
export type TailwindVersion = 'v2' | 'v3' | 'v4' | 'unknown';

/**
 * Tailwind 감지 결과
 */
export interface TailwindDetectionResult {
  detected: boolean;              // Tailwind 사용 여부
  version: TailwindVersion;       // 감지된 버전
  jitMode: boolean;              // JIT 모드 여부
  classes: TailwindClass[];      // 감지된 클래스들
  totalClasses: number;          // 전체 클래스 수
  customClasses: string[];       // 커스텀 클래스들
  arbitraryValues: string[];     // 임의 값 사용 클래스들
}

/**
 * CSS 속성 → Tailwind 변환 결과
 */
export interface CSSToTailwindResult {
  css: {
    property: string;            // CSS 속성명
    value: string;              // CSS 값
  };
  tailwind: {
    classes: string[];          // 변환된 Tailwind 클래스들
    confidence: number;         // 변환 확신도 (0-1)
  };
  alternatives?: string[][];    // 대안 클래스들
}

/**
 * Tailwind 설정
 */
export interface TailwindConfig {
  theme: {
    colors?: Record<string, string | Record<string, string>>;
    spacing?: Record<string, string>;
    fontSize?: Record<string, string | [string, object]>;
    borderRadius?: Record<string, string>;
    screens?: Record<string, string>;
  };
  plugins?: string[];
  presets?: string[];
}

/**
 * 요소 스타일 분석 결과
 */
export interface ElementStyleAnalysis {
  element: {
    tagName: string;
    selector: string;
    className?: string;
  };
  inlineStyles: Record<string, string>;     // 인라인 스타일
  computedStyles: Record<string, string>;   // 계산된 스타일
  tailwindClasses: TailwindClass[];         // Tailwind 클래스들
  conversionSuggestions: CSSToTailwindResult[]; // 변환 제안
  conversionScore: number;                   // 변환 가능성 점수 (0-1)
}

/**
 * Tailwind 사용 통계
 */
export interface TailwindUsageStats {
  totalElements: number;
  elementsWithTailwind: number;
  totalClasses: number;
  totalTailwindClasses: number;
  coverage: number;              // Tailwind 적용 범위 (0-1)
  categoryDistribution: Record<ClassCategory, number>;
  topClasses: Array<{ class: string; count: number }>;
  customClasses: string[];
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

---

### Task #9.2: Storage 상수 정의

- **파일**: `src/constants/storage.ts` (확장)
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // 기존 키들...

  // 테일윈드 스캔
  TAILWIND_SCAN_HISTORY: 'tailwindScan:history',
  TAILWIND_SETTINGS: 'tailwindScan:settings',
  TAILWIND_CONFIGS: 'tailwindScan:configs',
  TAILWIND_CACHE: 'tailwindScan:cache',
} as const;

export const STORAGE_LIMITS = {
  // 기존 제한들...

  TAILWIND_MAX_HISTORY: 15,
  TAILWIND_MAX_CONFIGS: 10,
  TAILWIND_CACHE_TTL: 1000 * 60 * 60, // 1시간
} as const;
```

---

### Task #9.3: 메시지 액션 상수 (확장)

- **파일**: `src/constants/messages.ts` (확장)
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // 기존 액션들...

  // 테일윈드 스캔
  TAILWIND_SCAN_PAGE: 'TAILWIND_SCAN_PAGE',
  TAILWIND_SCAN_ELEMENT: 'TAILWIND_SCAN_ELEMENT',
  TAILWIND_CONVERT_CSS: 'TAILWIND_CONVERT_CSS',
  TAILWIND_EXTRACT_CONFIG: 'TAILWIND_EXTRACT_CONFIG',
  TAILWIND_GET_STATS: 'TAILWIND_GET_STATS',
  TAILWIND_CLEAR_CACHE: 'TAILWIND_CLEAR_CACHE',
} as const;
```

---

### Task #9.4: CSS 클래스 상수 (확장)

- **파일**: `src/constants/classes.ts` (확장)
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const TAILWIND_SCAN_CLASSES = {
  HIGHLIGHT: 'klic-tailwind-highlight',
  CONVERTIBLE: 'klic-tailwind-convertible',
  NON_CONVERTIBLE: 'klic-tailwind-non-convertible',
  CUSTOM: 'klic-tailwind-custom',
  ARBITRARY: 'klic-tailwind-arbitrary',
} as const;
```

---

### Task #9.5: 에러 메시지 상수 (확장)

- **파일**: `src/constants/errors.ts` (확장)
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  // 기존 에러들...

  TAILWIND: {
    SCAN_FAILED: 'Tailwind 스캔에 실패했습니다',
    CONVERSION_FAILED: 'CSS 변환에 실패했습니다',
    INVALID_CSS: '유효하지 않은 CSS 속성입니다',
    CONFIG_EXTRACTION_FAILED: '설정 추출에 실패했습니다',
    NOT_TAILWIND_PROJECT: 'Tailwind 프로젝트가 아닙니다',
    VERSION_DETECTION_FAILED: '버전 감지에 실패했습니다',
  },
} as const;
```

---

### Task #9.6: 기본 설정 값 (확장)

- **파일**: `src/constants/defaults.ts` (확장)
- **시간**: 10분
- **의존성**: Task #9.1
- **상세 내용**:
```typescript
export const DEFAULT_TAILWIND_SETTINGS = {
  autoScan: true,               // 자동 스캔
  showConversionSuggestions: true, // 변환 제안 표시
  highlightConvertible: true,   // 변환 가능 요소 하이라이트
  minConfidence: 0.7,          // 최소 변환 확신도
  cacheEnabled: true,          // 캐시 활성화
  excludePatterns: [           // 제외 패턴
    /^__/,
    /^xs:/,
    /^sm:/,
    /^md:/,
    /^lg:/,
    /^xl:/,
    /^2xl:/,
  ],
} as const;
```

---

[Phase 2: Tailwind 감지](./TASK-09-PHASE2.md) 로 계속
