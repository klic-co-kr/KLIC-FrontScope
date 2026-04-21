# Phase 1: Infrastructure (Tasks 1-8)

> Types, KRDS rule constants, message constants, i18n keys

---

## Task 1: Define Accessibility Types

**Files:**
- Create: `src/types/accessibility.ts`
- Test: `src/types/__tests__/accessibility.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/accessibility.test.ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_A11Y_SETTINGS,
  SEVERITY_WEIGHTS,
  GRADE_THRESHOLDS,
} from '../accessibility';
import type {
  AccessibilityIssue,
  AccessibilityReport,
  CategoryResult,
  ValidationCategory,
  IssueSeverity,
  AccessibilityGrade,
  AccessibilitySettings,
} from '../accessibility';

describe('accessibility types', () => {
  it('DEFAULT_A11Y_SETTINGS has expected categories enabled', () => {
    // token validator exists but is disabled by default.
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toHaveLength(5);
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toContain('html');
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toContain('color');
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toContain('typography');
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toContain('component');
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).toContain('responsive');
    expect(DEFAULT_A11Y_SETTINGS.enabledCategories).not.toContain('token');
  });

  it('DEFAULT_A11Y_SETTINGS has correct defaults', () => {
    expect(DEFAULT_A11Y_SETTINGS.maxElementsToScan).toBe(1000);
    expect(DEFAULT_A11Y_SETTINGS.includeHidden).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.autoScanOnActivate).toBe(false);
  });

  it('SEVERITY_WEIGHTS assigns correct values', () => {
    expect(SEVERITY_WEIGHTS.critical).toBe(10);
    expect(SEVERITY_WEIGHTS.high).toBe(5);
    expect(SEVERITY_WEIGHTS.medium).toBe(3);
    expect(SEVERITY_WEIGHTS.low).toBe(1);
    expect(SEVERITY_WEIGHTS.info).toBe(0);
  });

  it('GRADE_THRESHOLDS covers full range', () => {
    expect(GRADE_THRESHOLDS).toHaveLength(5);
    expect(GRADE_THRESHOLDS[0].grade).toBe('A');
    expect(GRADE_THRESHOLDS[4].grade).toBe('F');
    expect(GRADE_THRESHOLDS[4].min).toBe(0);
  });

  it('AccessibilityIssue type is assignable', () => {
    const issue: AccessibilityIssue = {
      id: 'test-1',
      category: 'html',
      severity: 'critical',
      rule: 'img[alt]',
      message: 'Image missing alt',
      suggestion: 'Add alt attribute',
    };
    expect(issue.category).toBe('html');
  });

  it('CategoryResult type is assignable', () => {
    const result: CategoryResult = {
      category: 'color',
      label: '색상 대비',
      passed: 8,
      total: 10,
      score: 80,
      issues: [],
    };
    expect(result.score).toBe(80);
  });

  it('AccessibilityReport type is assignable', () => {
    const report: AccessibilityReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      totalScore: 85,
      grade: 'B',
      krdsCompliant: true,
      categories: [],
      summary: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 0,
        info: 3,
        totalIssues: 6,
        totalPassed: 40,
        totalChecks: 46,
      },
      scanDuration: 1200,
    };
    expect(report.krdsCompliant).toBe(true);
  });
});
```

**Step 2:** Run test → FAIL (module not found)

**Step 3: Write implementation** (see types in 00-overview.md "Key Types" section)

**Step 4:** Run test → PASS

**Step 5:** `tsc -b` → No errors

**Step 6:** Commit: `feat(a11y): add accessibility checker types and constants`

---

## Task 2: Create KRDS Color Constants

**Files:**
- Create: `src/constants/krds/colors.ts`

Extract from `krds_get_colors` MCP tool:

```typescript
// src/constants/krds/colors.ts

/**
 * WCAG contrast grade when used as TEXT on WHITE (#FFFFFF) background.
 * - 'AAA': contrast ratio ≥ 7:1 (enhanced)
 * - 'AA': contrast ratio ≥ 4.5:1 (normal text)
 * - 'AA-LARGE': contrast ratio ≥ 3:1 (large text only, ≥18.66px bold or ≥24px)
 * - 'BACKGROUND': not suitable as text on white; intended for backgrounds/borders
 */
export type KRDSColorGrade = 'AAA' | 'AA' | 'AA-LARGE' | 'BACKGROUND';

export interface KRDSColor {
  id: string;
  name: string;
  nameKo: string;
  hex: string;
  rgb: [number, number, number];
  usage: string;
  /** WCAG contrast grade as text on white background */
  grade: KRDSColorGrade;
  /** Actual contrast ratio against white (#FFFFFF) */
  contrastOnWhite: number;
}

export const KRDS_COLORS: readonly KRDSColor[] = [
  // === Primary & Status Colors ===
  { id: 'government-blue', name: 'Government Blue', nameKo: '정부 블루', hex: '#0F4C8C', rgb: [15, 76, 140], usage: '정부 기관 대표 색상, 주요 액션 버튼', grade: 'AAA', contrastOnWhite: 9.27 },
  { id: 'korean-red', name: 'Korean Red', nameKo: '대한민국 레드', hex: '#CD2E3A', rgb: [205, 46, 58], usage: '강조 포인트', grade: 'AAA', contrastOnWhite: 7.15 },
  { id: 'success', name: 'Success', nameKo: '성공', hex: '#28A745', rgb: [40, 167, 69], usage: '성공 상태, 완료, 승인', grade: 'AA-LARGE', contrastOnWhite: 3.08 },
  { id: 'warning', name: 'Warning', nameKo: '경고', hex: '#FFC107', rgb: [255, 193, 7], usage: '주의 상태, 경고, 대기 (배경색으로 사용 권장)', grade: 'BACKGROUND', contrastOnWhite: 1.58 },
  { id: 'error', name: 'Error', nameKo: '오류', hex: '#DC3545', rgb: [220, 53, 69], usage: '오류 상태, 위험, 삭제', grade: 'AA', contrastOnWhite: 6.33 },
  { id: 'info', name: 'Info', nameKo: '정보', hex: '#17A2B8', rgb: [23, 162, 184], usage: '정보 제공, 알림, 도움말', grade: 'AA-LARGE', contrastOnWhite: 3.66 },

  // === Neutral (Text-safe: AAA/AA on white) ===
  { id: 'black', name: 'Black', nameKo: '검정', hex: '#000000', rgb: [0, 0, 0], usage: '최고 대비, 순수 텍스트', grade: 'AAA', contrastOnWhite: 21.0 },
  { id: 'gray-900', name: 'Gray 900', nameKo: '그레이 900', hex: '#212529', rgb: [33, 37, 41], usage: '주요 텍스트, 제목', grade: 'AAA', contrastOnWhite: 14.8 },
  { id: 'gray-800', name: 'Gray 800', nameKo: '그레이 800', hex: '#343A40', rgb: [52, 58, 64], usage: '보조 텍스트', grade: 'AAA', contrastOnWhite: 12.2 },
  { id: 'gray-700', name: 'Gray 700', nameKo: '그레이 700', hex: '#495057', rgb: [73, 80, 87], usage: '비활성 텍스트', grade: 'AAA', contrastOnWhite: 9.3 },
  { id: 'gray-600', name: 'Gray 600', nameKo: '그레이 600', hex: '#6C757D', rgb: [108, 117, 125], usage: '플레이스홀더 텍스트', grade: 'AA', contrastOnWhite: 5.6 },

  // === Neutral (Background-only: fail WCAG text contrast on white) ===
  { id: 'gray-500', name: 'Gray 500', nameKo: '그레이 500', hex: '#ADB5BD', rgb: [173, 181, 189], usage: '비활성 요소, 아이콘 (대형 텍스트만 가능)', grade: 'BACKGROUND', contrastOnWhite: 2.09 },
  { id: 'gray-400', name: 'Gray 400', nameKo: '그레이 400', hex: '#CED4DA', rgb: [206, 212, 218], usage: '테두리, 구분선 (텍스트 불가)', grade: 'BACKGROUND', contrastOnWhite: 1.49 },
  { id: 'gray-300', name: 'Gray 300', nameKo: '그레이 300', hex: '#DEE2E6', rgb: [222, 226, 230], usage: '연한 테두리 (텍스트 불가)', grade: 'BACKGROUND', contrastOnWhite: 1.29 },
  { id: 'gray-200', name: 'Gray 200', nameKo: '그레이 200', hex: '#E9ECEF', rgb: [233, 236, 239], usage: '배경 구분 (텍스트 불가)', grade: 'BACKGROUND', contrastOnWhite: 1.18 },
  { id: 'gray-100', name: 'Gray 100', nameKo: '그레이 100', hex: '#F8F9FA', rgb: [248, 249, 250], usage: '연한 배경, 페이지 배경 (텍스트 불가)', grade: 'BACKGROUND', contrastOnWhite: 1.05 },
  { id: 'white', name: 'White', nameKo: '흰색', hex: '#FFFFFF', rgb: [255, 255, 255], usage: '기본 배경, 카드 배경 (텍스트 불가)', grade: 'BACKGROUND', contrastOnWhite: 1.0 },

  // === Accent & Interactive ===
  { id: 'electric-blue', name: 'Electric Blue', nameKo: '일렉트릭 블루', hex: '#007BFF', rgb: [0, 123, 255], usage: '하이퍼링크, 포커스 상태', grade: 'AA', contrastOnWhite: 5.2 },
  { id: 'vibrant-green', name: 'Vibrant Green', nameKo: '비비드 그린', hex: '#20C997', rgb: [32, 201, 151], usage: '새로운 기능, 알림 배지 (배경색으로 사용 권장)', grade: 'BACKGROUND', contrastOnWhite: 2.57 },

  // === Data Visualization ===
  { id: 'chart-blue', name: 'Chart Blue', nameKo: '차트 블루', hex: '#4285F4', rgb: [66, 133, 244], usage: '데이터 시각화 - 시리즈 1', grade: 'AA', contrastOnWhite: 4.65 },
  { id: 'chart-green', name: 'Chart Green', nameKo: '차트 그린', hex: '#34A853', rgb: [52, 168, 83], usage: '데이터 시각화 - 시리즈 2', grade: 'AA-LARGE', contrastOnWhite: 3.58 },
  { id: 'chart-orange', name: 'Chart Orange', nameKo: '차트 오렌지', hex: '#FBBC04', rgb: [251, 188, 4], usage: '데이터 시각화 - 시리즈 3 (배경색으로 사용 권장)', grade: 'BACKGROUND', contrastOnWhite: 1.68 },
  { id: 'chart-red', name: 'Chart Red', nameKo: '차트 레드', hex: '#EA4335', rgb: [234, 67, 53], usage: '데이터 시각화 - 시리즈 4', grade: 'AA', contrastOnWhite: 6.07 },
  { id: 'chart-purple', name: 'Chart Purple', nameKo: '차트 퍼플', hex: '#9C27B0', rgb: [156, 39, 176], usage: '데이터 시각화 - 시리즈 5', grade: 'AAA', contrastOnWhite: 8.9 },
] as const;

/** WCAG 2.1 contrast ratio thresholds */
export const CONTRAST_THRESHOLDS = {
  /** Normal text (< 24px/18pt and not bold 14pt+): minimum 4.5:1 */
  AA_NORMAL: 4.5,
  /** Large text (>= 24px/18pt, or >= 18.66px/14pt bold): minimum 3:1 */
  AA_LARGE: 3.0,
  /** Enhanced normal text: minimum 7:1 */
  AAA_NORMAL: 7.0,
  /** Enhanced large text: minimum 4.5:1 */
  AAA_LARGE: 4.5,
  /** UI components and graphical objects: minimum 3:1 */
  UI_COMPONENT: 3.0,
} as const;
```

**Commit:** `feat(a11y): add KRDS color constants extracted from KRDS MCP`

---

## Task 3: Create KRDS Typography Constants

**Files:**
- Create: `src/constants/krds/typography.ts`

```typescript
// src/constants/krds/typography.ts

export interface KRDSTypographyStyle {
  id: string;
  name: string;
  nameKo: string;
  category: 'display' | 'heading' | 'body' | 'interactive' | 'utility';
  fontSize: number;      // px
  fontWeight: number;
  lineHeight: number;    // ratio
  letterSpacing: string; // em or 0
  usage: string;
}

export const KRDS_TYPOGRAPHY: readonly KRDSTypographyStyle[] = [
  { id: 'display-xl', name: 'Display XL', nameKo: '디스플레이 XL', category: 'display', fontSize: 64, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.05em', usage: '랜딩 페이지 메인 타이틀' },
  { id: 'display-large', name: 'Display Large', nameKo: '디스플레이 Large', category: 'display', fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.025em', usage: '메인 타이틀, 히어로 섹션' },
  { id: 'display-medium', name: 'Display Medium', nameKo: '디스플레이 Medium', category: 'display', fontSize: 36, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em', usage: '페이지 타이틀' },
  { id: 'heading-1', name: 'Heading 1', nameKo: '제목 1', category: 'heading', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0', usage: '섹션 타이틀' },
  { id: 'heading-2', name: 'Heading 2', nameKo: '제목 2', category: 'heading', fontSize: 28, fontWeight: 600, lineHeight: 1.3, letterSpacing: '0', usage: '하위 섹션 제목' },
  { id: 'heading-3', name: 'Heading 3', nameKo: '제목 3', category: 'heading', fontSize: 24, fontWeight: 600, lineHeight: 1.4, letterSpacing: '0', usage: '소제목' },
  { id: 'heading-4', name: 'Heading 4', nameKo: '제목 4', category: 'heading', fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: '0', usage: '카드 제목, 폼 제목' },
  { id: 'heading-5', name: 'Heading 5', nameKo: '제목 5', category: 'heading', fontSize: 18, fontWeight: 600, lineHeight: 1.4, letterSpacing: '0', usage: '작은 제목' },
  { id: 'body-xl', name: 'Body XL', nameKo: '본문 XL', category: 'body', fontSize: 20, fontWeight: 400, lineHeight: 1.6, letterSpacing: '0', usage: '중요한 본문, 리드 문단' },
  { id: 'body-large', name: 'Body Large', nameKo: '본문 Large', category: 'body', fontSize: 18, fontWeight: 400, lineHeight: 1.6, letterSpacing: '0', usage: '강조 본문, 리드 텍스트' },
  { id: 'body-regular', name: 'Body Regular', nameKo: '본문 Regular', category: 'body', fontSize: 16, fontWeight: 400, lineHeight: 1.6, letterSpacing: '0', usage: '일반 본문, 기본 텍스트' },
  { id: 'body-small', name: 'Body Small', nameKo: '본문 Small', category: 'body', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: '0', usage: '보조 텍스트, 설명' },
  { id: 'caption', name: 'Caption', nameKo: '캡션', category: 'utility', fontSize: 12, fontWeight: 400, lineHeight: 1.4, letterSpacing: '0.025em', usage: '캡션, 메타 정보, 저작권' },
  { id: 'label-large', name: 'Label Large', nameKo: '라벨 Large', category: 'interactive', fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '0', usage: '중요한 라벨, 버튼 텍스트' },
  { id: 'label-medium', name: 'Label Medium', nameKo: '라벨 Medium', category: 'interactive', fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '0', usage: '일반 라벨, 폼 라벨' },
  { id: 'label-small', name: 'Label Small', nameKo: '라벨 Small', category: 'interactive', fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.025em', usage: '작은 라벨, 태그, 배지' },
  { id: 'button-large', name: 'Button Large', nameKo: '버튼 Large', category: 'interactive', fontSize: 18, fontWeight: 600, lineHeight: 1, letterSpacing: '0', usage: '큰 버튼 텍스트' },
  { id: 'button-medium', name: 'Button Medium', nameKo: '버튼 Medium', category: 'interactive', fontSize: 16, fontWeight: 600, lineHeight: 1, letterSpacing: '0', usage: '기본 버튼 텍스트' },
  { id: 'button-small', name: 'Button Small', nameKo: '버튼 Small', category: 'interactive', fontSize: 14, fontWeight: 600, lineHeight: 1, letterSpacing: '0', usage: '작은 버튼 텍스트' },
  { id: 'code', name: 'Code', nameKo: '코드', category: 'utility', fontSize: 14, fontWeight: 400, lineHeight: 1.4, letterSpacing: '0', usage: '인라인 코드' },
] as const;

/** Minimum acceptable values for accessibility */
export const TYPOGRAPHY_RULES = {
  /** Minimum body text font size (KRDS Body Regular) */
  MIN_BODY_FONT_SIZE: 16,
  /** Minimum caption/small text font size */
  MIN_CAPTION_FONT_SIZE: 12,
  /** Minimum body text line height (WCAG 1.4.12) */
  MIN_BODY_LINE_HEIGHT: 1.5,
  /** Minimum heading line height */
  MIN_HEADING_LINE_HEIGHT: 1.2,
  /** Heading sizes in descending order (KRDS scale) */
  HEADING_SCALE: [32, 28, 24, 20, 18] as const,
} as const;
```

**Commit:** `feat(a11y): add KRDS typography constants extracted from KRDS MCP`

---

## Task 4: Create KRDS Token & Spacing Constants

**Files:**
- Create: `src/constants/krds/tokens.ts`

```typescript
// src/constants/krds/tokens.ts

/** KRDS spacing scale (4px base unit) */
export const KRDS_SPACING_SCALE = [
  0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48,
  56, 64, 80, 96, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 384,
] as const;

/** KRDS semantic spacing */
export const KRDS_SPACING_SEMANTIC = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
} as const;

/** KRDS base unit for spacing grid alignment */
export const KRDS_SPACING_BASE_UNIT = 4;

/**
 * Check if a value aligns to the KRDS 4px grid
 */
export function isAlignedToGrid(value: number): boolean {
  return value % KRDS_SPACING_BASE_UNIT === 0;
}

/**
 * Find the nearest KRDS spacing value
 */
export function nearestKRDSSpacing(value: number): number {
  return KRDS_SPACING_SCALE.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}
```

**Commit:** `feat(a11y): add KRDS token and spacing constants`

---

## Task 5: Create KRDS Responsive System Constants

**Files:**
- Create: `src/constants/krds/systems.ts`

```typescript
// src/constants/krds/systems.ts

export interface KRDSBreakpoint {
  id: string;
  name: string;
  nameKo: string;
  minWidth: number;
  maxWidth: number | null;
  strategy: string;
  minTouchTarget: number;
}

export const KRDS_BREAKPOINTS: readonly KRDSBreakpoint[] = [
  { id: 'mobile', name: 'Mobile', nameKo: '모바일', minWidth: 320, maxWidth: 767, strategy: '단일 열 레이아웃, 간결한 네비게이션', minTouchTarget: 44 },
  { id: 'tablet', name: 'Tablet', nameKo: '태블릿', minWidth: 768, maxWidth: 1023, strategy: '2-3열 그리드, 적응형 네비게이션', minTouchTarget: 44 },
  { id: 'desktop', name: 'Desktop', nameKo: '데스크톱', minWidth: 1024, maxWidth: 1439, strategy: '다열 그리드, 사이드바 활용', minTouchTarget: 0 },
  { id: 'wide', name: 'Wide', nameKo: '와이드', minWidth: 1440, maxWidth: null, strategy: '최대 너비 제한, 여백 활용', minTouchTarget: 0 },
] as const;

/** Minimum interactive element size (KRDS + WCAG 2.5.5) */
export const MIN_TOUCH_TARGET = 44; // px

/** Minimum spacing between interactive elements */
export const MIN_TARGET_SPACING = 8; // px
```

**Commit:** `feat(a11y): add KRDS responsive system constants`

---

## Task 6: Create KRDS Component & Pattern Accessibility Constants

**Files:**
- Create: `src/constants/krds/components.ts`
- Create: `src/constants/krds/patterns.ts`

```typescript
// src/constants/krds/components.ts

export interface KRDSComponentRule {
  componentId: string;
  rule: string;
  description: string;
  descriptionKo: string;
  severity: 'critical' | 'high' | 'medium';
  selector: string;  // CSS selector to find this component type
  check: string;     // validator function name
}

export const KRDS_COMPONENT_RULES: readonly KRDSComponentRule[] = [
  { componentId: 'text-input', rule: 'input-label', description: 'Text input must have associated label', descriptionKo: '텍스트 입력에 레이블이 연결되어야 합니다', severity: 'critical', selector: 'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input:not([type])', check: 'hasAssociatedLabel' },
  { componentId: 'textarea', rule: 'textarea-label', description: 'Textarea must have associated label', descriptionKo: '텍스트영역에 레이블이 연결되어야 합니다', severity: 'critical', selector: 'textarea', check: 'hasAssociatedLabel' },
  { componentId: 'date-input', rule: 'date-format', description: 'Date input must show format hint', descriptionKo: '날짜 입력에 형식 안내가 있어야 합니다', severity: 'medium', selector: 'input[type="date"]', check: 'hasPlaceholderOrHint' },
  { componentId: 'file-upload', rule: 'file-type-info', description: 'File upload must show allowed types', descriptionKo: '파일 업로드에 허용 형식이 표시되어야 합니다', severity: 'medium', selector: 'input[type="file"]', check: 'hasAcceptAttribute' },
  { componentId: 'button', rule: 'button-text', description: 'Button must have accessible text', descriptionKo: '버튼에 접근 가능한 텍스트가 있어야 합니다', severity: 'critical', selector: 'button, [role="button"], input[type="submit"], input[type="button"]', check: 'hasAccessibleText' },
  { componentId: 'button', rule: 'button-size', description: 'Button must be at least 44x44px', descriptionKo: '버튼 크기가 최소 44x44px이어야 합니다', severity: 'high', selector: 'button, [role="button"]', check: 'meetsMinSize' },
  { componentId: 'checkbox', rule: 'checkbox-label', description: 'Checkbox must have associated label', descriptionKo: '체크박스에 레이블이 연결되어야 합니다', severity: 'critical', selector: 'input[type="checkbox"]', check: 'hasAssociatedLabel' },
  { componentId: 'radio-button', rule: 'radio-label', description: 'Radio button must have associated label', descriptionKo: '라디오 버튼에 레이블이 연결되어야 합니다', severity: 'critical', selector: 'input[type="radio"]', check: 'hasAssociatedLabel' },
  { componentId: 'select', rule: 'select-label', description: 'Select must have associated label', descriptionKo: '선택 목록에 레이블이 연결되어야 합니다', severity: 'critical', selector: 'select', check: 'hasAssociatedLabel' },
  { componentId: 'modal', rule: 'modal-focus-trap', description: 'Modal must trap focus within', descriptionKo: '모달은 포커스를 내부에 가두어야 합니다', severity: 'high', selector: '[role="dialog"], dialog', check: 'hasFocusTrap' },
  { componentId: 'modal', rule: 'modal-escape', description: 'Modal must close on Escape', descriptionKo: '모달은 Escape 키로 닫을 수 있어야 합니다', severity: 'medium', selector: '[role="dialog"], dialog', check: 'hasEscapeHandler' },
  { componentId: 'tooltip', rule: 'tooltip-trigger', description: 'Tooltip must work on hover and focus', descriptionKo: '툴팁은 호버와 포커스 모두에서 표시되어야 합니다', severity: 'medium', selector: '[data-tooltip], [aria-describedby]', check: 'hasFocusTrigger' },
  { componentId: 'accordion', rule: 'accordion-keyboard', description: 'Accordion must be keyboard operable', descriptionKo: '아코디언은 키보드로 조작 가능해야 합니다', severity: 'medium', selector: '[role="tablist"], details', check: 'isKeyboardOperable' },
  { componentId: 'navigation', rule: 'nav-landmark', description: 'Navigation must use nav element with aria-label', descriptionKo: '네비게이션은 nav 요소와 aria-label을 사용해야 합니다', severity: 'high', selector: 'nav', check: 'hasAriaLabel' },
] as const;
```

```typescript
// src/constants/krds/patterns.ts

export interface KRDSPatternAccessibility {
  patternId: string;
  name: string;
  nameKo: string;
  accessibilityNotes: string[];
  requiredComponents: string[];
}

export const KRDS_PATTERN_ACCESSIBILITY: readonly KRDSPatternAccessibility[] = [
  { patternId: 'personal-identification', name: 'Personal Identification', nameKo: '개인정보 확인', accessibilityNotes: ['필수 항목 명확히 표시', '오류 메시지 제공'], requiredComponents: ['text-input', 'select', 'radio-button', 'button'] },
  { patternId: 'help', name: 'Help', nameKo: '도움말', accessibilityNotes: ['키보드로 접근 가능', '스크린리더 호환'], requiredComponents: ['help-panel', 'tooltip', 'contextual-help', 'modal'] },
  { patternId: 'consent', name: 'Consent', nameKo: '동의', accessibilityNotes: ['체크박스와 레이블 연결', '필수 항목 안내'], requiredComponents: ['checkbox', 'button', 'disclosure', 'modal'] },
  { patternId: 'list-navigation', name: 'List Navigation', nameKo: '목록 탐색', accessibilityNotes: ['테이블 구조 활용', '현재 페이지 안내'], requiredComponents: ['structured-list', 'pagination', 'select', 'button'] },
  { patternId: 'user-feedback', name: 'User Feedback', nameKo: '사용자 피드백', accessibilityNotes: ['폼 요소 레이블링', '제출 결과 알림'], requiredComponents: ['textarea', 'radio-button', 'button', 'modal'] },
  { patternId: 'detailed-information', name: 'Detailed Information', nameKo: '상세 정보', accessibilityNotes: ['제목 계층 구조', '랜드마크 활용'], requiredComponents: ['tab', 'accordion', 'table', 'image'] },
  { patternId: 'error-handling', name: 'Error Handling', nameKo: '오류 처리', accessibilityNotes: ["role='alert'", '포커스 이동'], requiredComponents: ['critical-alerts', 'modal', 'button', 'link'] },
  { patternId: 'input-forms', name: 'Input Forms', nameKo: '입력 양식', accessibilityNotes: ['fieldset/legend 사용', '오류 메시지 연결'], requiredComponents: ['text-input', 'select', 'checkbox', 'radio-button', 'button'] },
  { patternId: 'file-attachments', name: 'File Attachments', nameKo: '파일 첨부', accessibilityNotes: ['파일 정보 읽기', '진행 상태 알림'], requiredComponents: ['file-upload', 'button', 'link', 'badge'] },
  { patternId: 'filtering-sorting', name: 'Filtering and Sorting', nameKo: '필터링 및 정렬', accessibilityNotes: ['필터 상태 알림', '결과 업데이트 알림'], requiredComponents: ['select', 'checkbox', 'radio-button', 'button', 'tag'] },
  { patternId: 'confirmation', name: 'Confirmation', nameKo: '확인', accessibilityNotes: ['포커스 트랩', '명확한 버튼 레이블'], requiredComponents: ['modal', 'button', 'critical-alerts'] },
] as const;
```

**Commit:** `feat(a11y): add KRDS component and pattern accessibility constants`

---

## Task 6.5: Install shadcn/ui Progress Component

**Files:**
- (auto-created) `src/components/ui/progress.tsx`

**Why:** `SummaryTab` uses `<Progress>` for category score bars. This component is not yet installed.

**Step 1: Verify Progress is not yet installed**

Run: `ls src/components/ui/progress.tsx`
Expected: No such file

**Step 2: Install Progress component**

Run: `npx shadcn@latest add progress`
Expected: `src/components/ui/progress.tsx` created

**Step 3: Verify installation**

Run: `ls src/components/ui/progress.tsx`
Expected: File exists

**Step 4: Type check**

Run: `tsc -b`
Expected: No errors

**Commit:** `feat(a11y): install shadcn/ui Progress component`

---

## Task 7: Add Accessibility Message Actions

**Files:**
- Modify: `src/constants/messages.ts`

Add after the `GRID_LAYOUT_*` section:

```typescript
  // 접근성 체커
  A11Y_SCAN_START: 'A11Y_SCAN_START',
  A11Y_SCAN_RESULT: 'A11Y_SCAN_RESULT',
  A11Y_SCAN_PROGRESS: 'A11Y_SCAN_PROGRESS',
  A11Y_SCAN_ELEMENT: 'A11Y_SCAN_ELEMENT',
  A11Y_SCAN_CLEAR: 'A11Y_SCAN_CLEAR',
```

**Commit:** `feat(a11y): add accessibility checker message action constants`

---

## Task 8: Add i18n Keys

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

Add the accessibility-related i18n keys as documented in the overview's "i18n Keys" section.

**Commit:** `feat(a11y): add i18n keys for accessibility checker (ko/en)`
