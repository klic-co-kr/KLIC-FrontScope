# Phase 1: 컬러피커 - 기반 설정

**태스크 범위**: Task #5.1 ~ #5.8 (8개)
**예상 시간**: 2.5시간

---

## Task #5.1: 타입 정의 - 색상 및 컬렉션

- **파일**: `src/types/colorPicker.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
/**
 * 색상 포맷 타입
 */
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'cssvar';

/**
 * RGB 색상
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * RGBA 색상
 */
export interface RGBA extends RGB {
  a: number; // 0-1
}

/**
 * HSL 색상
 */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * HSLA 색상
 */
export interface HSLA extends HSL {
  a: number; // 0-1
}

/**
 * HSV 색상
 */
export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/**
 * 색상 객체 (통합)
 */
export interface Color {
  id: string;                    // UUID
  timestamp: number;             // Date.now()
  hex: string;                   // '#RRGGBB'
  rgb: RGB;
  rgba: RGBA;
  hsl: HSL;
  hsla: HSLA;
  hsv: HSV;
  name?: string;                 // 사용자 지정 이름
  tags?: string[];               // 태그
  isFavorite?: boolean;
  collectionId?: string;         // 속한 컬렉션 ID
}

/**
 * 색상 히스토리
 */
export interface ColorHistory {
  colors: Color[];
  maxSize: number;              // 무제한 (0) 또는 최대 개수
  totalPicked: number;
}

/**
 * 색상 컬렉션 (팔레트)
 */
export interface ColorCollection {
  id: string;
  name: string;
  description?: string;
  colors: Color[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

/**
 * 색상 팔레트 타입
 */
export type PaletteType =
  | 'analogous'        // 유사색
  | 'complementary'    // 보색
  | 'triadic'          // 3색 조합
  | 'tetradic'         // 4색 조합
  | 'monochromatic'    // 단색 조합
  | 'shades'           // 명암 변화
  | 'tints';           // 색조 변화

/**
 * 팔레트 생성 옵션
 */
export interface PaletteOptions {
  type: PaletteType;
  count?: number;              // 생성할 색상 개수
  variation?: number;          // 변화 정도 (0-1)
}

/**
 * WCAG 레벨
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * 대비율 결과
 */
export interface ContrastResult {
  ratio: number;                 // 대비율 (1-21)
  passAA: boolean;               // AA 통과 여부
  passAAA: boolean;              // AAA 통과 여부
  rating: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * 컬러피커 설정
 */
export interface ColorPickerSettings {
  defaultFormat: ColorFormat;
  autoSave: boolean;
  maxHistorySize: number;        // 0 = 무제한
  enableEyeDropper: boolean;
  showContrastChecker: boolean;
  autoCopyToClipboard: boolean;
  generatePaletteOnPick: boolean;
  defaultPaletteType: PaletteType;
}

/**
 * Export 포맷
 */
export type ExportFormat = 'json' | 'css' | 'scss' | 'tailwind' | 'csv';

/**
 * Export 데이터
 */
export interface ColorExport {
  format: ExportFormat;
  content: string;
  filename: string;
}
```

**검증**: TypeScript 컴파일 성공, 타입 오류 없음

---

## Task #5.2: Storage 상수 추가

- **파일**: `src/constants/storage.ts`
- **시간**: 15분
- **의존성**: 없음

```typescript
// 기존 STORAGE_KEYS에 추가
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 컬러피커
  COLOR_PICKER_HISTORY: 'colorPicker:history',
  COLOR_PICKER_COLLECTIONS: 'colorPicker:collections',
  COLOR_PICKER_FAVORITES: 'colorPicker:favorites',
  COLOR_PICKER_SETTINGS: 'colorPicker:settings',
} as const;

// 기존 STORAGE_LIMITS에 추가
export const STORAGE_LIMITS = {
  // ... 기존 제한

  COLOR_PICKER_MAX_HISTORY: 0,        // 무제한
  COLOR_PICKER_MAX_COLLECTIONS: 50,
  COLOR_PICKER_MAX_COLORS_PER_COLLECTION: 100,
} as const;
```

---

## Task #5.3: 메시지 액션 추가

- **파일**: `src/constants/messages.ts`
- **시간**: 15분
- **의존성**: 없음

```typescript
// 기존 MESSAGE_ACTIONS에 추가
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 컬러피커
  COLOR_PICKER_PICK: 'COLOR_PICKER_PICK',
  COLOR_PICKER_SAVE: 'COLOR_PICKER_SAVE',
  COLOR_PICKER_DELETE: 'COLOR_PICKER_DELETE',
  COLOR_PICKER_FAVORITE: 'COLOR_PICKER_FAVORITE',
  COLOR_PICKER_COPY: 'COLOR_PICKER_COPY',
  COLOR_PICKER_GENERATE_PALETTE: 'COLOR_PICKER_GENERATE_PALETTE',
  COLOR_PICKER_CREATE_COLLECTION: 'COLOR_PICKER_CREATE_COLLECTION',
  COLOR_PICKER_EXPORT: 'COLOR_PICKER_EXPORT',
  COLOR_PICKER_IMPORT: 'COLOR_PICKER_IMPORT',
} as const;
```

---

## Task #5.4: 색상 상수 정의

- **파일**: `src/constants/colors.ts`
- **시간**: 20분
- **의존성**: 없음

```typescript
import { ColorFormat, WCAGLevel } from '../types/colorPicker';

/**
 * 기본 색상 포맷
 */
export const DEFAULT_COLOR_FORMAT: ColorFormat = 'hex';

/**
 * 지원하는 색상 포맷
 */
export const COLOR_FORMATS: readonly ColorFormat[] = [
  'hex',
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hsv',
  'cssvar',
] as const;

/**
 * 포맷 표시 이름
 */
export const COLOR_FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: 'HEX',
  rgb: 'RGB',
  rgba: 'RGBA',
  hsl: 'HSL',
  hsla: 'HSLA',
  hsv: 'HSV',
  cssvar: 'CSS Variable',
};

/**
 * WCAG 대비율 기준
 */
export const WCAG_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,        // AA 일반 텍스트
  AA_LARGE: 3,           // AA 큰 텍스트
  AAA_NORMAL: 7,         // AAA 일반 텍스트
  AAA_LARGE: 4.5,        // AAA 큰 텍스트
} as const;

/**
 * 팔레트 타입 표시 이름
 */
export const PALETTE_TYPE_LABELS = {
  analogous: '유사색',
  complementary: '보색',
  triadic: '3색 조합',
  tetradic: '4색 조합',
  monochromatic: '단색 조합',
  shades: '명암 변화',
  tints: '색조 변화',
} as const;

/**
 * 팔레트 타입별 기본 색상 개수
 */
export const PALETTE_DEFAULT_COUNTS = {
  analogous: 5,
  complementary: 2,
  triadic: 3,
  tetradic: 4,
  monochromatic: 7,
  shades: 7,
  tints: 7,
} as const;

/**
 * Export 포맷 레이블
 */
export const EXPORT_FORMAT_LABELS = {
  json: 'JSON',
  css: 'CSS',
  scss: 'SCSS',
  tailwind: 'Tailwind',
  csv: 'CSV',
} as const;
```

---

## Task #5.5: 에러 메시지 추가

- **파일**: `src/constants/errors.ts`
- **시간**: 15분
- **의존성**: 없음

```typescript
// 기존 ERROR_MESSAGES에 추가
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  COLOR_PICKER: {
    EYEDROPPER_NOT_SUPPORTED: 'EyeDropper API를 지원하지 않는 브라우저입니다',
    EYEDROPPER_FAILED: '색상 추출에 실패했습니다',
    INVALID_COLOR: '유효하지 않은 색상 값입니다',
    CLIPBOARD_FAILED: '클립보드 복사에 실패했습니다',
    COLLECTION_FULL: '컬렉션 저장 공간이 부족합니다',
    COLLECTION_NOT_FOUND: '컬렉션을 찾을 수 없습니다',
    EXPORT_FAILED: '내보내기에 실패했습니다',
    IMPORT_FAILED: '가져오기에 실패했습니다',
    INVALID_FORMAT: '지원하지 않는 포맷입니다',
  },
} as const;
```

---

## Task #5.6: 기본 설정 값

- **파일**: `src/constants/defaults.ts`
- **시간**: 15분
- **의존성**: Task #5.1

```typescript
import { ColorPickerSettings } from '../types/colorPicker';
import { DEFAULT_COLOR_FORMAT } from './colors';

// 기존 defaults에 추가
export const DEFAULT_COLOR_PICKER_SETTINGS: ColorPickerSettings = {
  defaultFormat: DEFAULT_COLOR_FORMAT,
  autoSave: true,
  maxHistorySize: 0,             // 무제한
  enableEyeDropper: true,
  showContrastChecker: true,
  autoCopyToClipboard: false,
  generatePaletteOnPick: true,
  defaultPaletteType: 'analogous',
};
```

---

## Task #5.7: 정규식 패턴

- **파일**: `src/utils/colorPicker/patterns.ts`
- **시간**: 20분
- **의존성**: 없음

```typescript
/**
 * 색상 포맷 정규식
 */
export const COLOR_PATTERNS = {
  // HEX: #RGB, #RRGGBB, #RRGGBBAA
  hex: /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/,

  // RGB: rgb(255, 255, 255)
  rgb: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,

  // RGBA: rgba(255, 255, 255, 0.5)
  rgba: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i,

  // HSL: hsl(360, 100%, 50%)
  hsl: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,

  // HSLA: hsla(360, 100%, 50%, 0.5)
  hsla: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)$/i,

  // CSS Variable: var(--color-name)
  cssvar: /^var\(\s*--[\w-]+\s*\)$/i,
} as const;

/**
 * 색상 포맷 감지
 */
export function detectColorFormat(color: string): ColorFormat | null {
  if (COLOR_PATTERNS.hex.test(color)) return 'hex';
  if (COLOR_PATTERNS.rgba.test(color)) return 'rgba';
  if (COLOR_PATTERNS.rgb.test(color)) return 'rgb';
  if (COLOR_PATTERNS.hsla.test(color)) return 'hsla';
  if (COLOR_PATTERNS.hsl.test(color)) return 'hsl';
  if (COLOR_PATTERNS.cssvar.test(color)) return 'cssvar';

  return null;
}

/**
 * 색상 유효성 검증
 */
export function isValidColor(color: string): boolean {
  return detectColorFormat(color) !== null;
}
```

---

## Task #5.8: 유틸리티 헬퍼

- **파일**: `src/utils/colorPicker/helpers.ts`
- **시간**: 20분
- **의존성**: Task #5.1

```typescript
import { Color } from '../../types/colorPicker';
import { generateUUID } from '../common/uuid';

/**
 * 색상 ID 생성
 */
export function generateColorId(): string {
  return generateUUID();
}

/**
 * 색상 이름 생성 (HEX 기반)
 */
export function generateColorName(hex: string): string {
  return `Color ${hex.toUpperCase()}`;
}

/**
 * 숫자를 범위 내로 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 숫자를 지정된 소수점 자리수로 반올림
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * HEX 값 정규화 (#RGB -> #RRGGBB)
 */
export function normalizeHex(hex: string): string {
  let normalized = hex.replace('#', '');

  // 3자리 HEX를 6자리로 확장
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  return `#${normalized.toUpperCase()}`;
}

/**
 * 색상 복제
 */
export function cloneColor(color: Color): Color {
  return {
    ...color,
    id: generateColorId(),
    timestamp: Date.now(),
    rgb: { ...color.rgb },
    rgba: { ...color.rgba },
    hsl: { ...color.hsl },
    hsla: { ...color.hsla },
    hsv: { ...color.hsv },
    tags: color.tags ? [...color.tags] : undefined,
  };
}

/**
 * 두 색상이 같은지 비교
 */
export function areColorsEqual(color1: Color, color2: Color): boolean {
  return color1.hex === color2.hex;
}

/**
 * 색상 배열에서 중복 제거
 */
export function deduplicateColors(colors: Color[]): Color[] {
  const seen = new Set<string>();

  return colors.filter((color) => {
    if (seen.has(color.hex)) {
      return false;
    }

    seen.add(color.hex);
    return true;
  });
}
```

**검증**: 모든 헬퍼 함수 정상 동작

---

**완료 후 다음 단계**: [Phase 2: 색상 변환 유틸리티](./TASK-05-phase-02-conversions.md)
