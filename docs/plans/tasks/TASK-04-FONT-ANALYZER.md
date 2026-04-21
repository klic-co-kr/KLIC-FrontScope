# 도구 #4: 폰트 분석 - 완전 태스크 분해

**총 태스크**: 25개
**예상 시간**: 10-13시간 (1-1.5일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (5개 태스크, 1.5시간)](#phase-1-기반-설정)
- [Phase 2: 폰트 탐지 유틸리티 (8개 태스크, 4시간)](#phase-2-폰트-탐지-유틸리티)
- [Phase 3: 폰트 정보 (4개 태스크, 2시간)](#phase-3-폰트-정보)
- [Phase 4: Storage 및 상태 (2개 태스크, 1시간)](#phase-4-storage-및-상태)
- [Phase 5: React 컴포넌트 (5개 태스크, 2.5시간)](#phase-5-react-컴포넌트)
- [Phase 6: 테스트 및 최적화 (1개 태스크, 1시간)](#phase-6-테스트-및-최적화)

---

## Phase 1: 기반 설정 (5개 태스크, 1.5시간)

### Task #4.1: 타입 정의 - 폰트 인터페이스
- **파일**: `src/types/fontAnalyzer.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 폰트 타입
 */
export type FontType = 'system' | 'web' | 'variable' | 'icon';

/**
 * 폰트 소스
 */
export type FontSource = 'google' | 'adobe' | 'custom' | 'system' | 'unknown';

/**
 * 폰트 스타일
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * 단일 폰트 정보
 */
export interface FontInfo {
  id: string;                         // UUID
  family: string;                     // 폰트 패밀리명
  displayName: string;                // 표시용 이름 (따옴표 제거)
  type: FontType;                     // 폰트 타입
  source: FontSource;                 // 소스
  weights: number[];                  // 사용된 굵기 (100-900)
  styles: FontStyle[];                // 사용된 스타일
  usageCount: number;                 // 사용 빈도
  elements: {
    selector: string;
    tagName: string;
    text: string;
    weight: number;
    style: FontStyle;
  }[];                                // 사용 요소들
  fontFace?: FontFaceInfo;           // @font-face 정보
  variable?: VariableFontInfo;       // Variable font 정보
  metadata?: {
    category?: string;                // serif, sans-serif, monospace, etc
    fallbacks: string[];              // fallback 폰트들
    unicodeRange?: string;            // Unicode 범위
    format?: string;                  // woff2, woff, ttf, etc
    fileSize?: number;                // 파일 크기 (bytes)
    loadTime?: number;                // 로드 시간 (ms)
  };
}

/**
 * @font-face 규칙 정보
 */
export interface FontFaceInfo {
  family: string;
  src: string[];                      // url() 목록
  weight?: string;                    // 100-900 or "bold"
  style?: FontStyle;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  unicodeRange?: string;
  featureSettings?: string;
  variationSettings?: string;
}

/**
 * Variable font 정보
 */
export interface VariableFontInfo {
  axes: {
    tag: string;                      // wght, wdth, slnt, etc
    name: string;
    min: number;
    max: number;
    default: number;
  }[];
  instances?: {
    name: string;
    coordinates: Record<string, number>;
  }[];
}

/**
 * 폰트 분석 결과
 */
export interface FontAnalysisResult {
  fonts: FontInfo[];
  totalFonts: number;
  systemFonts: number;
  webFonts: number;
  variableFonts: number;
  totalElements: number;
  timestamp: number;
  url: string;
  googleFontsUrl?: string;            // Google Fonts CDN URL
  statistics: {
    mostUsedFont: string;
    mostUsedWeight: number;
    averageWeights: number;
    totalFileSize: number;
    totalLoadTime: number;
  };
}

/**
 * 폰트 분석 설정
 */
export interface FontAnalyzerSettings {
  includeSystemFonts: boolean;        // 시스템 폰트 포함
  includeIconFonts: boolean;          // 아이콘 폰트 포함
  analyzeFontFace: boolean;           // @font-face 분석
  detectVariableFonts: boolean;       // Variable font 감지
  estimateFileSize: boolean;          // 파일 크기 추정
  maxFontsToAnalyze: number;          // 최대 분석 폰트 수
  excludePatterns: string[];          // 제외할 폰트 패턴
}

/**
 * 폰트 미리보기 옵션
 */
export interface FontPreviewOptions {
  text?: string;                      // 미리보기 텍스트
  size: number;                       // 폰트 크기 (px)
  weight: number;                     // 굵기
  style: FontStyle;                   // 스타일
  showAlphabet: boolean;              // A-Z 표시
  showKorean: boolean;                // 가-힣 표시
  showNumbers: boolean;               // 0-9 표시
}

/**
 * 폰트 캐시 데이터
 */
export interface FontCache {
  [url: string]: {
    fonts: FontInfo[];
    timestamp: number;
    expiresAt: number;
  };
}

/**
 * 폰트 비교 데이터
 */
export interface FontComparison {
  font1: FontInfo;
  font2: FontInfo;
  similarities: {
    category: boolean;
    weights: string[];
    styles: string[];
  };
  differences: {
    type: boolean;
    source: boolean;
    usage: boolean;
  };
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #4.2: 폰트 상수 정의
- **파일**: `src/constants/fonts.ts`
- **시간**: 20분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 시스템 폰트 목록
 */
export const SYSTEM_FONTS = [
  // Windows
  'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
  'Georgia', 'Courier New', 'Comic Sans MS', 'Impact',
  'Segoe UI', 'Consolas', 'Calibri', 'Cambria',

  // macOS
  'San Francisco', 'SF Pro Text', 'SF Pro Display',
  'Helvetica Neue', 'Helvetica', 'Lucida Grande',
  'Monaco', 'Menlo',

  // Linux
  'Ubuntu', 'Liberation Sans', 'DejaVu Sans', 'Noto Sans',

  // 한글
  'Malgun Gothic', '맑은 고딕', 'Batang', '바탕',
  'Dotum', '돋움', 'Gulim', '굴림',
  'AppleGothic', 'Apple SD Gothic Neo',
  'Nanum Gothic', '나눔고딕', 'Noto Sans KR',
] as const;

/**
 * 아이콘 폰트 패턴
 */
export const ICON_FONT_PATTERNS = [
  'icon', 'icons', 'fa-', 'fontawesome',
  'material', 'glyphicon', 'icomoon',
  'lineicon', 'feather', 'tabler',
] as const;

/**
 * Google Fonts CDN 패턴
 */
export const GOOGLE_FONTS_CDN = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
] as const;

/**
 * Adobe Fonts CDN 패턴
 */
export const ADOBE_FONTS_CDN = [
  'use.typekit.net',
  'use.typekit.com',
  'use.fontkit.com',
] as const;

/**
 * 폰트 무게 이름 매핑
 */
export const FONT_WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
} as const;

/**
 * 폰트 카테고리
 */
export const FONT_CATEGORIES = [
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
] as const;

/**
 * Variable font 축 이름
 */
export const VARIABLE_FONT_AXES: Record<string, string> = {
  'wght': 'Weight',
  'wdth': 'Width',
  'slnt': 'Slant',
  'ital': 'Italic',
  'opsz': 'Optical Size',
  'GRAD': 'Grade',
} as const;

/**
 * 폰트 파일 포맷
 */
export const FONT_FORMATS = [
  'woff2',
  'woff',
  'truetype',
  'opentype',
  'embedded-opentype',
  'svg',
] as const;

/**
 * 미리보기 기본 텍스트
 */
export const PREVIEW_TEXTS = {
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz',
  korean: '가나다라마바사아자차카타파하\n갈갑값감강같갓갔강',
  numbers: '0123456789',
  pangram: {
    en: 'The quick brown fox jumps over the lazy dog',
    ko: '다람쥐 헌 쳇바퀴에 타고파',
  },
} as const;
```

### Task #4.3: Storage 키 추가
- **파일**: `src/constants/storage.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 폰트 분석
  FONT_ANALYZER_CACHE: 'fontAnalyzer:cache',
  FONT_ANALYZER_SETTINGS: 'fontAnalyzer:settings',
  FONT_ANALYZER_HISTORY: 'fontAnalyzer:history',
  FONT_ANALYZER_FAVORITES: 'fontAnalyzer:favorites',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한들

  FONT_ANALYZER_CACHE_SIZE: 5,       // 최대 5개 페이지 캐시
  FONT_ANALYZER_CACHE_TTL: 3600000,  // 1시간
  FONT_ANALYZER_MAX_FONTS: 50,       // 페이지당 최대 50개 폰트
} as const;
```

### Task #4.4: 메시지 액션 추가
- **파일**: `src/constants/messages.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 폰트 분석
  FONT_ANALYZER_START: 'FONT_ANALYZER_START',
  FONT_ANALYZER_COMPLETE: 'FONT_ANALYZER_COMPLETE',
  FONT_ANALYZER_GET_FONTS: 'FONT_ANALYZER_GET_FONTS',
  FONT_ANALYZER_HIGHLIGHT_ELEMENTS: 'FONT_ANALYZER_HIGHLIGHT_ELEMENTS',
  FONT_ANALYZER_COPY_CSS: 'FONT_ANALYZER_COPY_CSS',
  FONT_ANALYZER_DOWNLOAD_FONT: 'FONT_ANALYZER_DOWNLOAD_FONT',
} as const;
```

### Task #4.5: 기본 설정 값
- **파일**: `src/constants/defaults.ts`
- **시간**: 20분
- **의존성**: Task #4.1
- **상세 내용**:
```typescript
import { FontAnalyzerSettings, FontPreviewOptions } from '../types/fontAnalyzer';

export const DEFAULT_FONT_ANALYZER_SETTINGS: FontAnalyzerSettings = {
  includeSystemFonts: true,
  includeIconFonts: false,
  analyzeFontFace: true,
  detectVariableFonts: true,
  estimateFileSize: true,
  maxFontsToAnalyze: 50,
  excludePatterns: [
    'icon',
    'fa-',
    'glyphicon',
  ],
};

export const DEFAULT_FONT_PREVIEW_OPTIONS: FontPreviewOptions = {
  text: undefined,
  size: 24,
  weight: 400,
  style: 'normal',
  showAlphabet: true,
  showKorean: true,
  showNumbers: true,
};
```

---

## Phase 2: 폰트 탐지 유틸리티 (8개 태스크, 4시간)

### Task #4.6: 페이지 폰트 탐지
- **파일**: `src/utils/fontAnalyzer/fontDetector.ts`
- **시간**: 1시간
- **의존성**: Task #4.1, #4.2
- **상세 내용**:
```typescript
import { FontInfo, FontType, FontStyle } from '../../types/fontAnalyzer';
import { SYSTEM_FONTS, ICON_FONT_PATTERNS } from '../../constants/fonts';
import { generateUUID } from '../common/uuid';

/**
 * 페이지의 모든 폰트 탐지
 */
export function detectFonts(options?: {
  includeHidden?: boolean;
  includeSystemFonts?: boolean;
  includeIconFonts?: boolean;
  excludePatterns?: string[];
}): FontInfo[] {
  const {
    includeHidden = false,
    includeSystemFonts = true,
    includeIconFonts = false,
    excludePatterns = [],
  } = options || {};

  const fontMap = new Map<string, FontInfo>();
  const elements = getAllTextElements(includeHidden);

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily;
    const fontWeight = parseInt(computedStyle.fontWeight) || 400;
    const fontStyle = computedStyle.fontStyle as FontStyle;

    if (!fontFamily || fontFamily === 'initial') {
      return;
    }

    // 폰트 패밀리 파싱
    const families = parseFontFamily(fontFamily);

    families.forEach((family) => {
      const normalizedFamily = normalizeFamily(family);

      // 제외 패턴 체크
      if (shouldExcludeFont(normalizedFamily, excludePatterns)) {
        return;
      }

      // 시스템 폰트 제외
      if (!includeSystemFonts && isSystemFont(normalizedFamily)) {
        return;
      }

      // 아이콘 폰트 제외
      if (!includeIconFonts && isIconFont(normalizedFamily)) {
        return;
      }

      // 폰트 정보 추가 또는 업데이트
      if (!fontMap.has(normalizedFamily)) {
        fontMap.set(normalizedFamily, createFontInfo(normalizedFamily));
      }

      const fontInfo = fontMap.get(normalizedFamily)!;

      // 굵기 추가
      if (!fontInfo.weights.includes(fontWeight)) {
        fontInfo.weights.push(fontWeight);
        fontInfo.weights.sort((a, b) => a - b);
      }

      // 스타일 추가
      if (!fontInfo.styles.includes(fontStyle)) {
        fontInfo.styles.push(fontStyle);
      }

      // 사용 요소 추가
      fontInfo.usageCount++;
      fontInfo.elements.push({
        selector: getElementSelector(element),
        tagName: element.tagName,
        text: element.textContent?.substring(0, 50) || '',
        weight: fontWeight,
        style: fontStyle,
      });
    });
  });

  return Array.from(fontMap.values());
}

/**
 * 모든 텍스트 요소 가져오기
 */
function getAllTextElements(includeHidden: boolean): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const element = node as HTMLElement;

        // 숨겨진 요소 제외
        if (!includeHidden) {
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
        }

        // 텍스트가 있는 요소만
        if (element.textContent && element.textContent.trim()) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let node: Node | null;
  while (node = walker.nextNode()) {
    elements.push(node as HTMLElement);
  }

  return elements;
}

/**
 * 폰트 정보 생성
 */
function createFontInfo(family: string): FontInfo {
  const type = detectFontType(family);
  const source = detectFontSource(family);

  return {
    id: generateUUID(),
    family,
    displayName: family,
    type,
    source,
    weights: [],
    styles: [],
    usageCount: 0,
    elements: [],
    metadata: {
      fallbacks: [],
    },
  };
}

/**
 * 폰트 패밀리명 정규화
 */
function normalizeFamily(family: string): string {
  return family
    .replace(/^["']|["']$/g, '')  // 따옴표 제거
    .trim();
}

/**
 * 폰트 제외 여부 확인
 */
function shouldExcludeFont(family: string, patterns: string[]): boolean {
  const lowerFamily = family.toLowerCase();
  return patterns.some(pattern => lowerFamily.includes(pattern.toLowerCase()));
}

/**
 * 시스템 폰트 여부 확인
 */
function isSystemFont(family: string): boolean {
  return SYSTEM_FONTS.some(sysFont =>
    sysFont.toLowerCase() === family.toLowerCase()
  );
}

/**
 * 아이콘 폰트 여부 확인
 */
function isIconFont(family: string): boolean {
  const lowerFamily = family.toLowerCase();
  return ICON_FONT_PATTERNS.some(pattern =>
    lowerFamily.includes(pattern)
  );
}

/**
 * 요소 선택자 가져오기 (간단한 버전)
 */
function getElementSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes[0]}`;
    }
  }
  return element.tagName.toLowerCase();
}
```
- **테스트 케이스**:
  - 다양한 폰트 사용 페이지
  - 시스템 폰트 제외
  - 아이콘 폰트 제외
  - 숨겨진 요소 제외
- **완료 조건**: 모든 폰트 정확하게 탐지

### Task #4.7: 폰트 패밀리 파싱
- **파일**: `src/utils/fontAnalyzer/fontParser.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * font-family 속성 파싱
 * 예: '"Roboto", "Helvetica Neue", Arial, sans-serif'
 */
export function parseFontFamily(fontFamily: string): string[] {
  if (!fontFamily) {
    return [];
  }

  const fonts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < fontFamily.length; i++) {
    const char = fontFamily[i];

    if ((char === '"' || char === "'") && fontFamily[i - 1] !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      const trimmed = current.trim();
      if (trimmed) {
        fonts.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // 마지막 폰트 추가
  const trimmed = current.trim();
  if (trimmed) {
    fonts.push(trimmed);
  }

  return fonts;
}

/**
 * @font-face src 파싱
 * 예: 'url("font.woff2") format("woff2"), url("font.woff") format("woff")'
 */
export function parseFontFaceSrc(src: string): Array<{
  url: string;
  format?: string;
}> {
  const sources: Array<{ url: string; format?: string }> = [];
  const urlRegex = /url\((['"]?)(.+?)\1\)/g;
  const formatRegex = /format\((['"]?)(.+?)\1\)/g;

  const parts = src.split(',').map(s => s.trim());

  parts.forEach(part => {
    const urlMatch = urlRegex.exec(part);
    urlRegex.lastIndex = 0; // reset

    if (urlMatch) {
      const url = urlMatch[2];
      const formatMatch = formatRegex.exec(part);
      formatRegex.lastIndex = 0; // reset

      sources.push({
        url,
        format: formatMatch ? formatMatch[2] : undefined,
      });
    }
  });

  return sources;
}

/**
 * unicode-range 파싱
 */
export function parseUnicodeRange(range: string): Array<{
  start: number;
  end: number;
}> {
  const ranges: Array<{ start: number; end: number }> = [];
  const parts = range.split(',').map(s => s.trim());

  parts.forEach(part => {
    const match = part.match(/U\+([0-9A-F]+)(-([0-9A-F]+))?/i);
    if (match) {
      const start = parseInt(match[1], 16);
      const end = match[3] ? parseInt(match[3], 16) : start;
      ranges.push({ start, end });
    }
  });

  return ranges;
}
```
- **완료 조건**: 복잡한 font-family 문자열 정확하게 파싱

### Task #4.8: 폰트 타입 감지
- **파일**: `src/utils/fontAnalyzer/fontTypeDetector.ts`
- **시간**: 30분
- **의존성**: Task #4.2
- **상세 내용**:
```typescript
import { FontType, FontSource } from '../../types/fontAnalyzer';
import {
  SYSTEM_FONTS,
  ICON_FONT_PATTERNS,
  GOOGLE_FONTS_CDN,
  ADOBE_FONTS_CDN,
} from '../../constants/fonts';

/**
 * 폰트 타입 감지
 */
export function detectFontType(family: string): FontType {
  const lowerFamily = family.toLowerCase();

  // 아이콘 폰트 체크
  if (ICON_FONT_PATTERNS.some(pattern => lowerFamily.includes(pattern))) {
    return 'icon';
  }

  // Variable font 체크
  if (isVariableFont(family)) {
    return 'variable';
  }

  // 시스템 폰트 체크
  if (SYSTEM_FONTS.some(sysFont => sysFont.toLowerCase() === lowerFamily)) {
    return 'system';
  }

  // 웹 폰트
  return 'web';
}

/**
 * 폰트 소스 감지
 */
export function detectFontSource(family: string): FontSource {
  // @font-face 규칙 확인
  const fontFaceRules = getFontFaceRules(family);

  if (fontFaceRules.length > 0) {
    const rule = fontFaceRules[0];
    const src = rule.style.getPropertyValue('src');

    // Google Fonts 체크
    if (GOOGLE_FONTS_CDN.some(cdn => src.includes(cdn))) {
      return 'google';
    }

    // Adobe Fonts 체크
    if (ADOBE_FONTS_CDN.some(cdn => src.includes(cdn))) {
      return 'adobe';
    }

    return 'custom';
  }

  // 시스템 폰트
  if (detectFontType(family) === 'system') {
    return 'system';
  }

  return 'unknown';
}

/**
 * Variable font 여부 확인
 */
export function isVariableFont(family: string): boolean {
  try {
    // FontFace API로 variable font 체크
    if ('fonts' in document) {
      const fontFaces = Array.from(document.fonts);
      const fontFace = fontFaces.find(
        f => f.family.toLowerCase() === family.toLowerCase()
      );

      if (fontFace && 'variationSettings' in fontFace) {
        return true;
      }
    }

    // @font-face 규칙에서 font-variation-settings 체크
    const rules = getFontFaceRules(family);
    return rules.some(rule =>
      rule.style.getPropertyValue('font-variation-settings') !== ''
    );
  } catch (error) {
    return false;
  }
}

/**
 * @font-face 규칙 가져오기
 */
export function getFontFaceRules(family: string): CSSFontFaceRule[] {
  const rules: CSSFontFaceRule[] = [];
  const lowerFamily = family.toLowerCase();

  try {
    const styleSheets = Array.from(document.styleSheets);

    styleSheets.forEach(sheet => {
      try {
        const cssRules = Array.from(sheet.cssRules || []);

        cssRules.forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            const ruleFamily = rule.style.getPropertyValue('font-family')
              .replace(/^["']|["']$/g, '')
              .toLowerCase();

            if (ruleFamily === lowerFamily) {
              rules.push(rule);
            }
          }
        });
      } catch (e) {
        // CORS 에러 무시
      }
    });
  } catch (error) {
    console.warn('Failed to get font-face rules:', error);
  }

  return rules;
}
```
- **완료 조건**: 폰트 타입과 소스 정확하게 감지

### Task #4.9: @font-face 규칙 추출
- **파일**: `src/utils/fontAnalyzer/fontFaceExtractor.ts`
- **시간**: 45분
- **의존성**: Task #4.1, #4.7
- **상세 내용**:
```typescript
import { FontFaceInfo } from '../../types/fontAnalyzer';
import { parseFontFaceSrc } from './fontParser';
import { getFontFaceRules } from './fontTypeDetector';

/**
 * @font-face 정보 추출
 */
export function extractFontFaceInfo(family: string): FontFaceInfo | undefined {
  const rules = getFontFaceRules(family);

  if (rules.length === 0) {
    return undefined;
  }

  // 첫 번째 규칙 사용 (일반적으로 regular weight)
  const rule = rules[0];
  const style = rule.style;

  const srcValue = style.getPropertyValue('src');
  const sources = parseFontFaceSrc(srcValue);

  return {
    family: style.getPropertyValue('font-family').replace(/^["']|["']$/g, ''),
    src: sources.map(s => s.url),
    weight: style.getPropertyValue('font-weight') || undefined,
    style: (style.getPropertyValue('font-style') as any) || undefined,
    display: (style.getPropertyValue('font-display') as any) || undefined,
    unicodeRange: style.getPropertyValue('unicode-range') || undefined,
    featureSettings: style.getPropertyValue('font-feature-settings') || undefined,
    variationSettings: style.getPropertyValue('font-variation-settings') || undefined,
  };
}

/**
 * 모든 @font-face 규칙 추출
 */
export function extractAllFontFaceRules(): Map<string, FontFaceInfo[]> {
  const fontFaceMap = new Map<string, FontFaceInfo[]>();

  try {
    const styleSheets = Array.from(document.styleSheets);

    styleSheets.forEach(sheet => {
      try {
        const cssRules = Array.from(sheet.cssRules || []);

        cssRules.forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            const style = rule.style;
            const family = style.getPropertyValue('font-family')
              .replace(/^["']|["']$/g, '');

            const srcValue = style.getPropertyValue('src');
            const sources = parseFontFaceSrc(srcValue);

            const info: FontFaceInfo = {
              family,
              src: sources.map(s => s.url),
              weight: style.getPropertyValue('font-weight') || undefined,
              style: (style.getPropertyValue('font-style') as any) || undefined,
              display: (style.getPropertyValue('font-display') as any) || undefined,
              unicodeRange: style.getPropertyValue('unicode-range') || undefined,
              featureSettings: style.getPropertyValue('font-feature-settings') || undefined,
              variationSettings: style.getPropertyValue('font-variation-settings') || undefined,
            };

            if (!fontFaceMap.has(family)) {
              fontFaceMap.set(family, []);
            }

            fontFaceMap.get(family)!.push(info);
          }
        });
      } catch (e) {
        // CORS 에러 무시
      }
    });
  } catch (error) {
    console.warn('Failed to extract font-face rules:', error);
  }

  return fontFaceMap;
}

/**
 * @font-face CSS 코드 생성
 */
export function generateFontFaceCSS(info: FontFaceInfo): string {
  let css = '@font-face {\n';
  css += `  font-family: "${info.family}";\n`;

  // src
  const srcParts = info.src.map(url => {
    const format = getFormatFromUrl(url);
    return format
      ? `url("${url}") format("${format}")`
      : `url("${url}")`;
  });
  css += `  src: ${srcParts.join(',\n       ')};\n`;

  // weight
  if (info.weight) {
    css += `  font-weight: ${info.weight};\n`;
  }

  // style
  if (info.style && info.style !== 'normal') {
    css += `  font-style: ${info.style};\n`;
  }

  // display
  if (info.display) {
    css += `  font-display: ${info.display};\n`;
  }

  // unicode-range
  if (info.unicodeRange) {
    css += `  unicode-range: ${info.unicodeRange};\n`;
  }

  // font-feature-settings
  if (info.featureSettings) {
    css += `  font-feature-settings: ${info.featureSettings};\n`;
  }

  // font-variation-settings
  if (info.variationSettings) {
    css += `  font-variation-settings: ${info.variationSettings};\n`;
  }

  css += '}\n';

  return css;
}

/**
 * URL에서 포맷 추출
 */
function getFormatFromUrl(url: string): string | undefined {
  if (url.endsWith('.woff2')) return 'woff2';
  if (url.endsWith('.woff')) return 'woff';
  if (url.endsWith('.ttf')) return 'truetype';
  if (url.endsWith('.otf')) return 'opentype';
  if (url.endsWith('.eot')) return 'embedded-opentype';
  if (url.endsWith('.svg')) return 'svg';
  return undefined;
}
```
- **완료 조건**: @font-face 규칙 정확하게 추출 및 CSS 생성

### Task #4.10: 사용된 굵기/스타일 분석
- **파일**: `src/utils/fontAnalyzer/fontUsageAnalyzer.ts`
- **시간**: 30분
- **의존성**: Task #4.1
- **상세 내용**:
```typescript
import { FontInfo } from '../../types/fontAnalyzer';

/**
 * 폰트 사용 통계 계산
 */
export function calculateFontStatistics(fonts: FontInfo[]) {
  if (fonts.length === 0) {
    return {
      mostUsedFont: '',
      mostUsedWeight: 400,
      averageWeights: 0,
      totalFileSize: 0,
      totalLoadTime: 0,
    };
  }

  // 가장 많이 사용된 폰트
  const mostUsed = fonts.reduce((prev, current) =>
    current.usageCount > prev.usageCount ? current : prev
  );

  // 가장 많이 사용된 굵기
  const weightCounts = new Map<number, number>();
  fonts.forEach(font => {
    font.elements.forEach(el => {
      weightCounts.set(el.weight, (weightCounts.get(el.weight) || 0) + 1);
    });
  });

  let mostUsedWeight = 400;
  let maxCount = 0;
  weightCounts.forEach((count, weight) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedWeight = weight;
    }
  });

  // 평균 굵기 개수
  const totalWeights = fonts.reduce((sum, font) => sum + font.weights.length, 0);
  const averageWeights = totalWeights / fonts.length;

  // 총 파일 크기
  const totalFileSize = fonts.reduce(
    (sum, font) => sum + (font.metadata?.fileSize || 0),
    0
  );

  // 총 로드 시간
  const totalLoadTime = fonts.reduce(
    (sum, font) => sum + (font.metadata?.loadTime || 0),
    0
  );

  return {
    mostUsedFont: mostUsed.family,
    mostUsedWeight,
    averageWeights: Math.round(averageWeights * 10) / 10,
    totalFileSize,
    totalLoadTime,
  };
}

/**
 * 폰트 사용 빈도 정렬
 */
export function sortFontsByUsage(fonts: FontInfo[]): FontInfo[] {
  return [...fonts].sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * 폰트를 카테고리별로 그룹화
 */
export function groupFontsByCategory(fonts: FontInfo[]): Record<string, FontInfo[]> {
  const groups: Record<string, FontInfo[]> = {
    web: [],
    system: [],
    variable: [],
    icon: [],
  };

  fonts.forEach(font => {
    groups[font.type].push(font);
  });

  return groups;
}

/**
 * 폰트 사용 요소 필터링
 */
export function filterFontElements(
  font: FontInfo,
  options?: {
    weight?: number;
    style?: string;
    tagName?: string;
  }
): FontInfo['elements'] {
  let elements = font.elements;

  if (options?.weight !== undefined) {
    elements = elements.filter(el => el.weight === options.weight);
  }

  if (options?.style) {
    elements = elements.filter(el => el.style === options.style);
  }

  if (options?.tagName) {
    elements = elements.filter(el =>
      el.tagName.toLowerCase() === options.tagName!.toLowerCase()
    );
  }

  return elements;
}
```
- **완료 조건**: 통계 정확하게 계산

### Task #4.11: Google Fonts 링크 생성
- **파일**: `src/utils/fontAnalyzer/googleFontsGenerator.ts`
- **시간**: 30분
- **의존성**: Task #4.1
- **상세 내용**:
```typescript
import { FontInfo } from '../../types/fontAnalyzer';

/**
 * Google Fonts URL 생성
 */
export function generateGoogleFontsUrl(fonts: FontInfo[]): string | null {
  const googleFonts = fonts.filter(font => font.source === 'google');

  if (googleFonts.length === 0) {
    return null;
  }

  const families: string[] = [];

  googleFonts.forEach(font => {
    const familyParts: string[] = [font.family];

    // 이탤릭 여부 확인
    const hasItalic = font.styles.includes('italic');

    // 굵기 정렬 및 포맷
    const weights = [...font.weights].sort((a, b) => a - b);

    if (hasItalic) {
      // 이탤릭이 있는 경우: ital,wght@0,400;0,700;1,400;1,700
      const ital: string[] = [];
      weights.forEach(weight => {
        ital.push(`0,${weight}`);
      });
      weights.forEach(weight => {
        ital.push(`1,${weight}`);
      });
      familyParts.push(`ital,wght@${ital.join(';')}`);
    } else {
      // 일반: wght@400;700
      if (weights.length === 1 && weights[0] === 400) {
        // 기본 굵기만 있으면 생략
      } else {
        familyParts.push(`wght@${weights.join(';')}`);
      }
    }

    families.push(familyParts.join(':'));
  });

  if (families.length === 0) {
    return null;
  }

  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', families.join('&family='));
  url.searchParams.set('display', 'swap');

  return url.toString();
}

/**
 * Google Fonts 임베드 코드 생성 (HTML)
 */
export function generateGoogleFontsHtml(fonts: FontInfo[]): string | null {
  const url = generateGoogleFontsUrl(fonts);

  if (!url) {
    return null;
  }

  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${url}" rel="stylesheet">`;
}

/**
 * Google Fonts CSS import 생성
 */
export function generateGoogleFontsCssImport(fonts: FontInfo[]): string | null {
  const url = generateGoogleFontsUrl(fonts);

  if (!url) {
    return null;
  }

  return `@import url('${url}');`;
}

/**
 * 단일 Google Font URL 생성
 */
export function generateSingleGoogleFontUrl(font: FontInfo): string | null {
  if (font.source !== 'google') {
    return null;
  }

  return generateGoogleFontsUrl([font]);
}
```
- **완료 조건**: Google Fonts URL 정확하게 생성

### Task #4.12: Variable font 분석
- **파일**: `src/utils/fontAnalyzer/variableFontAnalyzer.ts`
- **시간**: 45분
- **의존성**: Task #4.1, #4.2
- **상세 내용**:
```typescript
import { VariableFontInfo } from '../../types/fontAnalyzer';
import { VARIABLE_FONT_AXES } from '../../constants/fonts';

/**
 * Variable font 정보 추출
 */
export function extractVariableFontInfo(family: string): VariableFontInfo | undefined {
  try {
    // FontFace API 사용
    if (!('fonts' in document)) {
      return undefined;
    }

    const fontFaces = Array.from(document.fonts);
    const fontFace = fontFaces.find(
      f => f.family.toLowerCase() === family.toLowerCase()
    );

    if (!fontFace) {
      return undefined;
    }

    // font-variation-settings 파싱
    const variationSettings = (fontFace as any).variationSettings;

    if (!variationSettings) {
      return undefined;
    }

    const axes = parseVariationAxes(variationSettings);

    if (axes.length === 0) {
      return undefined;
    }

    return {
      axes,
      instances: [], // 인스턴스는 일반적으로 폰트 파일에서만 확인 가능
    };
  } catch (error) {
    console.warn('Failed to extract variable font info:', error);
    return undefined;
  }
}

/**
 * font-variation-settings 파싱
 */
function parseVariationAxes(settings: string): VariableFontInfo['axes'] {
  const axes: VariableFontInfo['axes'] = [];

  // 형식: "wght" 400, "wdth" 100
  const regex = /["']([a-z]{4})["']\s+([\d.]+)/gi;
  let match;

  while ((match = regex.exec(settings)) !== null) {
    const tag = match[1];
    const value = parseFloat(match[2]);

    axes.push({
      tag,
      name: VARIABLE_FONT_AXES[tag] || tag,
      min: 0,        // 정확한 범위는 폰트 파일에서만 확인 가능
      max: 1000,
      default: value,
    });
  }

  return axes;
}

/**
 * Variable font CSS 생성
 */
export function generateVariableFontCSS(
  family: string,
  axes: VariableFontInfo['axes']
): string {
  const settings = axes.map(axis =>
    `"${axis.tag}" ${axis.default}`
  ).join(', ');

  return `font-family: "${family}";
font-variation-settings: ${settings};`;
}

/**
 * Variable font 축 범위 검증
 */
export function validateAxisValue(
  axis: VariableFontInfo['axes'][0],
  value: number
): boolean {
  return value >= axis.min && value <= axis.max;
}

/**
 * 일반 폰트 속성을 Variable font 축으로 변환
 */
export function convertToVariationSettings(options: {
  weight?: number;
  width?: number;
  slant?: number;
}): string {
  const parts: string[] = [];

  if (options.weight !== undefined) {
    parts.push(`"wght" ${options.weight}`);
  }

  if (options.width !== undefined) {
    parts.push(`"wdth" ${options.width}`);
  }

  if (options.slant !== undefined) {
    parts.push(`"slnt" ${options.slant}`);
  }

  return parts.join(', ');
}
```
- **완료 조건**: Variable font 정보 정확하게 추출

### Task #4.13: 폰트 파일 크기 추정
- **파일**: `src/utils/fontAnalyzer/fontSizeEstimator.ts`
- **시간**: 30분
- **의존성**: Task #4.1
- **상세 내용**:
```typescript
import { FontInfo } from '../../types/fontAnalyzer';

/**
 * 폰트 파일 크기 추정
 */
export async function estimateFontSize(font: FontInfo): Promise<number> {
  if (!font.fontFace || font.fontFace.src.length === 0) {
    return 0;
  }

  try {
    const url = font.fontFace.src[0]; // 첫 번째 소스 사용

    // HEAD 요청으로 Content-Length 확인
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
    });

    const contentLength = response.headers.get('Content-Length');

    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Content-Length가 없으면 GET 요청
    const fullResponse = await fetch(url, { mode: 'cors' });
    const blob = await fullResponse.blob();

    return blob.size;
  } catch (error) {
    console.warn(`Failed to estimate size for ${font.family}:`, error);

    // 기본 추정치 반환 (포맷별 평균 크기)
    return getDefaultSizeEstimate(font);
  }
}

/**
 * 기본 크기 추정치
 */
function getDefaultSizeEstimate(font: FontInfo): number {
  const format = font.metadata?.format || 'woff2';

  // 포맷별 평균 크기 (bytes)
  const averageSizes: Record<string, number> = {
    'woff2': 50000,      // 50KB
    'woff': 70000,       // 70KB
    'truetype': 100000,  // 100KB
    'opentype': 100000,  // 100KB
    'svg': 150000,       // 150KB
  };

  const baseSize = averageSizes[format] || 70000;

  // 굵기 개수에 따라 조정
  const weightMultiplier = font.weights.length / 2;

  return Math.round(baseSize * weightMultiplier);
}

/**
 * 모든 폰트 크기 추정
 */
export async function estimateAllFontSizes(fonts: FontInfo[]): Promise<Map<string, number>> {
  const sizeMap = new Map<string, number>();

  const promises = fonts.map(async (font) => {
    const size = await estimateFontSize(font);
    sizeMap.set(font.id, size);
  });

  await Promise.all(promises);

  return sizeMap;
}

/**
 * 크기 포맷팅 (bytes to human readable)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```
- **완료 조건**: 파일 크기 추정 및 포맷팅 정상 동작

---

## Phase 3: 폰트 정보 (4개 태스크, 2시간)

### Task #4.14: 폰트 메타데이터 수집
- **파일**: `src/utils/fontAnalyzer/fontMetadata.ts`
- **시간**: 45분
- **의존성**: Task #4.1, #4.7
- **상세 내용**:
```typescript
import { FontInfo } from '../../types/fontAnalyzer';
import { FONT_CATEGORIES } from '../../constants/fonts';
import { parseFontFamily } from './fontParser';

/**
 * 폰트 메타데이터 수집
 */
export function collectFontMetadata(
  family: string,
  fontFamilyValue: string
): FontInfo['metadata'] {
  const families = parseFontFamily(fontFamilyValue);
  const index = families.findIndex(
    f => f.replace(/^["']|["']$/g, '').toLowerCase() === family.toLowerCase()
  );

  // Fallback 폰트들
  const fallbacks = families.slice(index + 1);

  // 카테고리 감지
  const category = detectFontCategory(fallbacks);

  return {
    category,
    fallbacks,
  };
}

/**
 * 폰트 카테고리 감지
 */
export function detectFontCategory(fallbacks: string[]): string | undefined {
  const lowerFallbacks = fallbacks.map(f => f.toLowerCase());

  for (const category of FONT_CATEGORIES) {
    if (lowerFallbacks.includes(category)) {
      return category;
    }
  }

  return undefined;
}

/**
 * OpenType features 감지
 */
export function detectOpenTypeFeatures(element: HTMLElement): string[] {
  const features: string[] = [];
  const style = window.getComputedStyle(element);

  const featureSettings = style.getPropertyValue('font-feature-settings');

  if (featureSettings && featureSettings !== 'normal') {
    // 형식: "liga" 1, "kern" 1
    const regex = /["']([a-z]{4})["']\s+(\d+)/gi;
    let match;

    while ((match = regex.exec(featureSettings)) !== null) {
      if (match[2] === '1') {
        features.push(match[1]);
      }
    }
  }

  return features;
}

/**
 * 폰트 로드 시간 측정
 */
export async function measureFontLoadTime(family: string): Promise<number> {
  if (!('fonts' in document)) {
    return 0;
  }

  const startTime = performance.now();

  try {
    await document.fonts.load(`12px "${family}"`);
    const endTime = performance.now();

    return endTime - startTime;
  } catch (error) {
    console.warn(`Failed to measure load time for ${family}:`, error);
    return 0;
  }
}

/**
 * 폰트 렌더링 확인
 */
export async function checkFontRendering(family: string): Promise<boolean> {
  if (!('fonts' in document)) {
    return false;
  }

  try {
    const result = await document.fonts.load(`12px "${family}"`);
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 유사 폰트 찾기
 */
export function findSimilarFonts(
  font: FontInfo,
  allFonts: FontInfo[]
): FontInfo[] {
  const similar: FontInfo[] = [];

  allFonts.forEach(other => {
    if (other.id === font.id) {
      return;
    }

    let score = 0;

    // 카테고리 일치
    if (font.metadata?.category === other.metadata?.category) {
      score += 3;
    }

    // 굵기 일치
    const commonWeights = font.weights.filter(w => other.weights.includes(w));
    score += commonWeights.length;

    // 스타일 일치
    const commonStyles = font.styles.filter(s => other.styles.includes(s));
    score += commonStyles.length;

    // 타입 일치
    if (font.type === other.type) {
      score += 1;
    }

    if (score >= 3) {
      similar.push(other);
    }
  });

  return similar.sort((a, b) => b.usageCount - a.usageCount);
}
```
- **완료 조건**: 메타데이터 정확하게 수집

### Task #4.15: OpenType features 분석
- **파일**: `src/utils/fontAnalyzer/openTypeAnalyzer.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * OpenType feature 정의
 */
export const OPENTYPE_FEATURES: Record<string, string> = {
  'liga': 'Standard Ligatures',
  'dlig': 'Discretionary Ligatures',
  'hlig': 'Historical Ligatures',
  'clig': 'Contextual Ligatures',
  'kern': 'Kerning',
  'smcp': 'Small Caps',
  'c2sc': 'Caps to Small Caps',
  'swsh': 'Swash',
  'calt': 'Contextual Alternates',
  'salt': 'Stylistic Alternates',
  'ss01': 'Stylistic Set 1',
  'ss02': 'Stylistic Set 2',
  'ss03': 'Stylistic Set 3',
  'tnum': 'Tabular Numbers',
  'lnum': 'Lining Numbers',
  'onum': 'Old Style Numbers',
  'pnum': 'Proportional Numbers',
  'frac': 'Fractions',
  'sups': 'Superscript',
  'subs': 'Subscript',
  'ordn': 'Ordinals',
  'zero': 'Slashed Zero',
};

/**
 * font-feature-settings 파싱
 */
export function parseFeatureSettings(settings: string): Map<string, number> {
  const features = new Map<string, number>();

  if (!settings || settings === 'normal') {
    return features;
  }

  // 형식: "liga" 1, "kern" 1, "ss01" 0
  const regex = /["']([a-z0-9]{4})["']\s+([\d]+)/gi;
  let match;

  while ((match = regex.exec(settings)) !== null) {
    features.set(match[1], parseInt(match[2]));
  }

  return features;
}

/**
 * font-feature-settings CSS 생성
 */
export function generateFeatureSettingsCSS(features: Map<string, number>): string {
  const parts: string[] = [];

  features.forEach((value, feature) => {
    parts.push(`"${feature}" ${value}`);
  });

  return parts.join(', ');
}

/**
 * 활성화된 features 필터링
 */
export function getActiveFeatures(features: Map<string, number>): string[] {
  const active: string[] = [];

  features.forEach((value, feature) => {
    if (value === 1) {
      active.push(feature);
    }
  });

  return active;
}

/**
 * Feature 이름 가져오기
 */
export function getFeatureName(tag: string): string {
  return OPENTYPE_FEATURES[tag] || tag;
}
```
- **완료 조건**: OpenType features 정확하게 파싱

### Task #4.16: Unicode range 분석
- **파일**: `src/utils/fontAnalyzer/unicodeAnalyzer.ts`
- **시간**: 30분
- **의존성**: Task #4.7
- **상세 내용**:
```typescript
import { parseUnicodeRange } from './fontParser';

/**
 * Unicode 블록 정의
 */
export const UNICODE_BLOCKS: Record<string, { start: number; end: number; name: string }> = {
  'basic-latin': { start: 0x0000, end: 0x007F, name: 'Basic Latin (ASCII)' },
  'latin-1': { start: 0x0080, end: 0x00FF, name: 'Latin-1 Supplement' },
  'latin-ext-a': { start: 0x0100, end: 0x017F, name: 'Latin Extended-A' },
  'latin-ext-b': { start: 0x0180, end: 0x024F, name: 'Latin Extended-B' },
  'korean': { start: 0xAC00, end: 0xD7AF, name: 'Hangul Syllables' },
  'hiragana': { start: 0x3040, end: 0x309F, name: 'Hiragana' },
  'katakana': { start: 0x30A0, end: 0x30FF, name: 'Katakana' },
  'cjk': { start: 0x4E00, end: 0x9FFF, name: 'CJK Unified Ideographs' },
  'cyrillic': { start: 0x0400, end: 0x04FF, name: 'Cyrillic' },
  'greek': { start: 0x0370, end: 0x03FF, name: 'Greek and Coptic' },
  'arabic': { start: 0x0600, end: 0x06FF, name: 'Arabic' },
  'hebrew': { start: 0x0590, end: 0x05FF, name: 'Hebrew' },
};

/**
 * Unicode range 분석
 */
export function analyzeUnicodeRange(rangeStr: string): {
  blocks: string[];
  coverage: number;
  totalChars: number;
} {
  const ranges = parseUnicodeRange(rangeStr);

  if (ranges.length === 0) {
    return {
      blocks: [],
      coverage: 0,
      totalChars: 0,
    };
  }

  const blocks: string[] = [];
  let totalChars = 0;

  ranges.forEach(range => {
    totalChars += range.end - range.start + 1;

    // 어떤 블록에 속하는지 확인
    Object.entries(UNICODE_BLOCKS).forEach(([key, block]) => {
      if (rangesOverlap(range, block)) {
        if (!blocks.includes(block.name)) {
          blocks.push(block.name);
        }
      }
    });
  });

  // 커버리지 계산 (전체 Unicode 대비)
  const coverage = (totalChars / 0x10FFFF) * 100;

  return {
    blocks,
    coverage: Math.round(coverage * 100) / 100,
    totalChars,
  };
}

/**
 * 범위 겹침 확인
 */
function rangesOverlap(
  range1: { start: number; end: number },
  range2: { start: number; end: number }
): boolean {
  return range1.start <= range2.end && range1.end >= range2.start;
}

/**
 * Unicode range CSS 생성
 */
export function generateUnicodeRangeCSS(ranges: Array<{ start: number; end: number }>): string {
  const parts = ranges.map(range => {
    if (range.start === range.end) {
      return `U+${range.start.toString(16).toUpperCase()}`;
    }
    return `U+${range.start.toString(16).toUpperCase()}-${range.end.toString(16).toUpperCase()}`;
  });

  return parts.join(', ');
}

/**
 * 특정 문자가 범위에 포함되는지 확인
 */
export function isCharInRange(
  char: string,
  rangeStr: string
): boolean {
  const codePoint = char.codePointAt(0);

  if (codePoint === undefined) {
    return false;
  }

  const ranges = parseUnicodeRange(rangeStr);

  return ranges.some(range =>
    codePoint >= range.start && codePoint <= range.end
  );
}
```
- **완료 조건**: Unicode range 정확하게 분석

### Task #4.17: 폰트 비교 유틸리티
- **파일**: `src/utils/fontAnalyzer/fontComparison.ts`
- **시간**: 15분
- **의존성**: Task #4.1
- **상세 내용**:
```typescript
import { FontInfo, FontComparison } from '../../types/fontAnalyzer';

/**
 * 두 폰트 비교
 */
export function compareFonts(font1: FontInfo, font2: FontInfo): FontComparison {
  // 공통 굵기
  const commonWeights = font1.weights.filter(w => font2.weights.includes(w));

  // 공통 스타일
  const commonStyles = font1.styles.filter(s => font2.styles.includes(s));

  return {
    font1,
    font2,
    similarities: {
      category: font1.metadata?.category === font2.metadata?.category,
      weights: commonWeights.map(String),
      styles: commonStyles,
    },
    differences: {
      type: font1.type !== font2.type,
      source: font1.source !== font2.source,
      usage: Math.abs(font1.usageCount - font2.usageCount) > 10,
    },
  };
}

/**
 * 폰트 유사도 점수 계산 (0-100)
 */
export function calculateSimilarityScore(font1: FontInfo, font2: FontInfo): number {
  let score = 0;

  // 카테고리 일치 (30점)
  if (font1.metadata?.category === font2.metadata?.category) {
    score += 30;
  }

  // 타입 일치 (20점)
  if (font1.type === font2.type) {
    score += 20;
  }

  // 공통 굵기 (최대 25점)
  const commonWeights = font1.weights.filter(w => font2.weights.includes(w));
  const weightScore = (commonWeights.length / Math.max(font1.weights.length, font2.weights.length)) * 25;
  score += weightScore;

  // 공통 스타일 (최대 15점)
  const commonStyles = font1.styles.filter(s => font2.styles.includes(s));
  const styleScore = (commonStyles.length / Math.max(font1.styles.length, font2.styles.length)) * 15;
  score += styleScore;

  // 소스 일치 (10점)
  if (font1.source === font2.source) {
    score += 10;
  }

  return Math.round(score);
}
```
- **완료 조건**: 폰트 비교 정확하게 수행

---

## Phase 4: Storage 및 상태 (2개 태스크, 1시간)

### Task #4.18: Storage 훅
- **파일**: `src/hooks/fontAnalyzer/useFontAnalyzerStorage.ts`
- **시간**: 45분
- **의존성**: Task #4.1, #4.3
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { FontAnalysisResult, FontAnalyzerSettings, FontCache } from '../../types/fontAnalyzer';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { DEFAULT_FONT_ANALYZER_SETTINGS } from '../../constants/defaults';

/**
 * 폰트 분석 Storage 훅
 */
export function useFontAnalyzerStorage() {
  const [cache, setCache] = useState<FontCache>({});
  const [settings, setSettings] = useState<FontAnalyzerSettings>(DEFAULT_FONT_ANALYZER_SETTINGS);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.FONT_ANALYZER_CACHE,
        STORAGE_KEYS.FONT_ANALYZER_SETTINGS,
        STORAGE_KEYS.FONT_ANALYZER_FAVORITES,
      ]);

      if (result[STORAGE_KEYS.FONT_ANALYZER_CACHE]) {
        setCache(result[STORAGE_KEYS.FONT_ANALYZER_CACHE]);
      }

      if (result[STORAGE_KEYS.FONT_ANALYZER_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.FONT_ANALYZER_SETTINGS]);
      }

      if (result[STORAGE_KEYS.FONT_ANALYZER_FAVORITES]) {
        setFavorites(result[STORAGE_KEYS.FONT_ANALYZER_FAVORITES]);
      }
    } catch (error) {
      console.error('Failed to load font analyzer data:', error);
    }
  };

  /**
   * 캐시에 결과 저장
   */
  const saveToCache = async (url: string, result: FontAnalysisResult) => {
    try {
      const now = Date.now();
      const expiresAt = now + STORAGE_LIMITS.FONT_ANALYZER_CACHE_TTL;

      const newCache: FontCache = {
        ...cache,
        [url]: {
          fonts: result.fonts,
          timestamp: now,
          expiresAt,
        },
      };

      // 캐시 크기 제한
      const cacheEntries = Object.entries(newCache);
      if (cacheEntries.length > STORAGE_LIMITS.FONT_ANALYZER_CACHE_SIZE) {
        // 가장 오래된 항목 제거
        cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = cacheEntries.slice(-STORAGE_LIMITS.FONT_ANALYZER_CACHE_SIZE);
        Object.keys(newCache).forEach(key => {
          if (!toKeep.find(([k]) => k === key)) {
            delete newCache[key];
          }
        });
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.FONT_ANALYZER_CACHE]: newCache,
      });

      setCache(newCache);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  /**
   * 캐시에서 가져오기
   */
  const getFromCache = (url: string): FontAnalysisResult['fonts'] | null => {
    const cached = cache[url];

    if (!cached) {
      return null;
    }

    // 만료 확인
    if (Date.now() > cached.expiresAt) {
      return null;
    }

    return cached.fonts;
  };

  /**
   * 설정 저장
   */
  const saveSettings = async (newSettings: FontAnalyzerSettings) => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.FONT_ANALYZER_SETTINGS]: newSettings,
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  /**
   * 즐겨찾기 추가
   */
  const addFavorite = async (fontFamily: string) => {
    try {
      const newFavorites = [...favorites, fontFamily];

      await chrome.storage.local.set({
        [STORAGE_KEYS.FONT_ANALYZER_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  /**
   * 즐겨찾기 제거
   */
  const removeFavorite = async (fontFamily: string) => {
    try {
      const newFavorites = favorites.filter(f => f !== fontFamily);

      await chrome.storage.local.set({
        [STORAGE_KEYS.FONT_ANALYZER_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  /**
   * 캐시 초기화
   */
  const clearCache = async () => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.FONT_ANALYZER_CACHE]: {},
      });

      setCache({});
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return {
    cache,
    settings,
    favorites,
    saveToCache,
    getFromCache,
    saveSettings,
    addFavorite,
    removeFavorite,
    clearCache,
  };
}
```
- **완료 조건**: Storage 작업 정상 동작

### Task #4.19: 폰트 분석 상태 훅
- **파일**: `src/hooks/fontAnalyzer/useFontAnalysis.ts`
- **시간**: 15분
- **의존성**: Task #4.1, #4.6, #4.18
- **상세 내용**:
```typescript
import { useState } from 'react';
import { FontAnalysisResult, FontInfo } from '../../types/fontAnalyzer';
import { MESSAGE_ACTIONS } from '../../constants/messages';

/**
 * 폰트 분석 상태 훅
 */
export function useFontAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FontAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 폰트 분석 시작
   */
  const analyzeFonts = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: MESSAGE_ACTIONS.FONT_ANALYZER_START,
        timestamp: Date.now(),
      });

      if (response?.success) {
        setResult(response.data);
      } else {
        throw new Error(response?.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Font analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 결과 초기화
   */
  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    result,
    error,
    analyzeFonts,
    clearResult,
  };
}
```
- **완료 조건**: 분석 상태 관리 정상 동작

---

## Phase 5: React 컴포넌트 (5개 태스크, 2.5시간)

### Task #4.20: FontPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/FontAnalyzer/FontPanel.tsx`
- **시간**: 30분
- **의존성**: Task #4.18, #4.19
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useFontAnalysis } from '../../../hooks/fontAnalyzer/useFontAnalysis';
import { useFontAnalyzerStorage } from '../../../hooks/fontAnalyzer/useFontAnalyzerStorage';
import { FontList } from './FontList';
import { FontStats } from './FontStats';
import { SettingsPanel } from './SettingsPanel';

export function FontPanel() {
  const { isAnalyzing, result, error, analyzeFonts, clearResult } = useFontAnalysis();
  const { settings, saveSettings, favorites, addFavorite, removeFavorite } = useFontAnalyzerStorage();
  const [activeTab, setActiveTab] = useState<'fonts' | 'stats' | 'settings'>('fonts');

  /**
   * 분석 시작
   */
  const handleAnalyze = async () => {
    await analyzeFonts();
  };

  return (
    <div className="font-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>폰트 분석</h2>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="analyze-btn"
        >
          {isAnalyzing ? '분석 중...' : '폰트 분석'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 결과가 있을 때 */}
      {result && (
        <>
          {/* 탭 네비게이션 */}
          <div className="tab-navigation">
            <button
              onClick={() => setActiveTab('fonts')}
              className={activeTab === 'fonts' ? 'active' : ''}
            >
              폰트 목록 ({result.fonts.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={activeTab === 'stats' ? 'active' : ''}
            >
              통계
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={activeTab === 'settings' ? 'active' : ''}
            >
              설정
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-content">
            {activeTab === 'fonts' && (
              <FontList
                fonts={result.fonts}
                favorites={favorites}
                onAddFavorite={addFavorite}
                onRemoveFavorite={removeFavorite}
              />
            )}

            {activeTab === 'stats' && (
              <FontStats result={result} />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                settings={settings}
                onSave={saveSettings}
              />
            )}
          </div>
        </>
      )}

      {/* 빈 상태 */}
      {!result && !isAnalyzing && (
        <div className="empty-state">
          <p>페이지의 폰트를 분석해보세요.</p>
          <p>사용된 모든 폰트와 상세 정보를 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 메인 UI 정상 동작

### Task #4.21: FontCard 컴포넌트
- **파일**: `src/sidepanel/components/FontAnalyzer/FontCard.tsx`
- **시간**: 45분
- **의존성**: Task #4.1
- **상세 내용**: (폰트 정보 카드 - 폰트 패밀리, 타입, 소스, 굵기, 스타일, 사용 빈도 표시)
- **완료 조건**: 폰트 정보 정확하게 표시

### Task #4.22: FontPreview 컴포넌트
- **파일**: `src/sidepanel/components/FontAnalyzer/FontPreview.tsx`
- **시간**: 30분
- **의존성**: Task #4.1, #4.2
- **상세 내용**: (폰트 미리보기 - A-Z, 가-힣, 0-9 표시)
- **완료 조건**: 미리보기 정상 표시

### Task #4.23: FontWeightList 컴포넌트
- **파일**: `src/sidepanel/components/FontAnalyzer/FontWeightList.tsx`
- **시간**: 30분
- **의존성**: Task #4.1, #4.2
- **상세 내용**: (폰트 굵기 목록 - 100-900, 각 굵기별 미리보기)
- **완료 조건**: 굵기 목록 정상 표시

### Task #4.24: FontStats 컴포넌트
- **파일**: `src/sidepanel/components/FontAnalyzer/FontStats.tsx`
- **시간**: 15분
- **의존성**: Task #4.1
- **상세 내용**: (통계 표시 - 총 폰트 수, 시스템/웹 폰트, 가장 많이 사용된 폰트, 총 파일 크기)
- **완료 조건**: 통계 정확하게 표시

---

## Phase 6: 테스트 및 최적화 (1개 태스크, 1시간)

### Task #4.25: 단위 및 통합 테스트
- **파일**: `src/utils/fontAnalyzer/__tests__/fontAnalyzer.test.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { detectFonts } from '../fontDetector';
import { parseFontFamily } from '../fontParser';
import { detectFontType, detectFontSource } from '../fontTypeDetector';
import { generateGoogleFontsUrl } from '../googleFontsGenerator';
import { calculateFontStatistics } from '../fontUsageAnalyzer';

describe('fontParser', () => {
  it('should parse font-family with quotes', () => {
    const result = parseFontFamily('"Roboto", "Helvetica Neue", Arial, sans-serif');

    expect(result).toEqual(['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']);
  });

  it('should handle single quotes', () => {
    const result = parseFontFamily("'Times New Roman', Georgia, serif");

    expect(result).toEqual(['Times New Roman', 'Georgia', 'serif']);
  });
});

describe('fontTypeDetector', () => {
  it('should detect system fonts', () => {
    expect(detectFontType('Arial')).toBe('system');
    expect(detectFontType('Helvetica')).toBe('system');
  });

  it('should detect icon fonts', () => {
    expect(detectFontType('FontAwesome')).toBe('icon');
    expect(detectFontType('Material Icons')).toBe('icon');
  });
});

describe('googleFontsGenerator', () => {
  it('should generate Google Fonts URL', () => {
    const fonts = [
      {
        id: '1',
        family: 'Roboto',
        source: 'google',
        weights: [400, 700],
        styles: ['normal'],
      },
    ] as any;

    const url = generateGoogleFontsUrl(fonts);

    expect(url).toContain('fonts.googleapis.com');
    expect(url).toContain('Roboto');
    expect(url).toContain('400');
    expect(url).toContain('700');
  });
});

describe('fontUsageAnalyzer', () => {
  it('should calculate statistics correctly', () => {
    const fonts = [
      {
        id: '1',
        family: 'Font1',
        usageCount: 10,
        weights: [400, 700],
        elements: [
          { weight: 400 },
          { weight: 400 },
          { weight: 700 },
        ],
      },
      {
        id: '2',
        family: 'Font2',
        usageCount: 5,
        weights: [400],
        elements: [
          { weight: 400 },
        ],
      },
    ] as any;

    const stats = calculateFontStatistics(fonts);

    expect(stats.mostUsedFont).toBe('Font1');
    expect(stats.mostUsedWeight).toBe(400);
    expect(stats.averageWeights).toBeGreaterThan(0);
  });
});
```
- **테스트 커버리지**: 80% 이상
- **완료 조건**: 모든 테스트 통과

---

## ✅ 완료 체크리스트

- [ ] Phase 1: 기반 설정 (5개 태스크)
  - [ ] Task #4.1: 타입 정의
  - [ ] Task #4.2: 폰트 상수
  - [ ] Task #4.3: Storage 키
  - [ ] Task #4.4: 메시지 액션
  - [ ] Task #4.5: 기본 설정

- [ ] Phase 2: 폰트 탐지 유틸리티 (8개 태스크)
  - [ ] Task #4.6: 페이지 폰트 탐지
  - [ ] Task #4.7: 폰트 패밀리 파싱
  - [ ] Task #4.8: 폰트 타입 감지
  - [ ] Task #4.9: @font-face 규칙 추출
  - [ ] Task #4.10: 사용된 굵기/스타일 분석
  - [ ] Task #4.11: Google Fonts 링크 생성
  - [ ] Task #4.12: Variable font 분석
  - [ ] Task #4.13: 폰트 파일 크기 추정

- [ ] Phase 3: 폰트 정보 (4개 태스크)
  - [ ] Task #4.14: 폰트 메타데이터 수집
  - [ ] Task #4.15: OpenType features 분석
  - [ ] Task #4.16: Unicode range 분석
  - [ ] Task #4.17: 폰트 비교 유틸리티

- [ ] Phase 4: Storage 및 상태 (2개 태스크)
  - [ ] Task #4.18: Storage 훅
  - [ ] Task #4.19: 폰트 분석 상태 훅

- [ ] Phase 5: React 컴포넌트 (5개 태스크)
  - [ ] Task #4.20: FontPanel
  - [ ] Task #4.21: FontCard
  - [ ] Task #4.22: FontPreview
  - [ ] Task #4.23: FontWeightList
  - [ ] Task #4.24: FontStats

- [ ] Phase 6: 테스트 및 최적화 (1개 태스크)
  - [ ] Task #4.25: 단위 및 통합 테스트

---

**다음 단계**: 도구 #5 (CSS 스캔) 구현
