# Accessibility Checker (Tool #13) - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a KRDS-based web accessibility checker to the KLIC-Tool Chrome Extension as Tool #13 (`accessibilityChecker`). Scans the current page's DOM in real-time and evaluates compliance against Korean government web accessibility standards (WCAG 2.1 AA + KRDS 2024).

**Architecture:** Content Script scans the page DOM, extracts elements/colors/typography/layout data, runs client-side validators against baked-in KRDS rules, and sends results to the Side Panel via `chrome.runtime.sendMessage`. Side Panel displays a categorized report with score, issues, and fix suggestions.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui (Tabs, Progress, Badge, Accordion, ScrollArea), KRDS MCP (development-time rule extraction), vitest + jest-chrome

**KRDS MCP Role:** The KRDS MCP server provides design system specifications at **development time**. All KRDS rules (colors, typography, spacing, tokens, patterns) are extracted via MCP and baked into the extension as static validation constants. The extension does NOT call KRDS MCP at runtime.

---

## Logical Review of Existing Infrastructure

Before implementation, the following considerations were identified:

| # | Consideration | Impact | Resolution |
|---|---------------|--------|------------|
| 1 | Content script already has `hoverHandler.ts` for element inspection | HIGH | Reuse hover overlay pattern for element-level accessibility hints |
| 2 | CSS Scan tool extracts computed styles — overlapping logic | HIGH | Share extraction utilities; accessibility checker adds KRDS validation layer |
| 3 | Color Picker has WCAG contrast checking (Phase 04) | MEDIUM | Extend contrast logic with KRDS color system compliance |
| 4 | `ToolType` union must be extended | LOW | Add `'accessibilityChecker'` to union |
| 5 | Tool category `'analyze'` is appropriate | LOW | `exclusive: false` — one-shot scan, coexists with other tools |
| 6 | 12 tools already registered in context menu | INFO | Add 13th entry in `background/index.ts` TOOLS array |
| 7 | i18n keys needed in `en.json` and `ko.json` | INFO | Add Korean-first labels for government accessibility context |
| 8 | Highlight state vars (`activeHighlightTimer`, `clearA11yHighlight`) commented out in Task 45 but referenced as live code → TypeScript 컴파일 오류 | CRITICAL | Phase 6 Task 45 앞에 module-level 변수 선언 단계 추가 |
| 9 | `<Progress>` shadcn/ui 컴포넌트 미설치 → SummaryTab 카테고리 바에서 import 실패 | HIGH | Phase 1 Task 6.5 추가: `npx shadcn@latest add progress` |
| 10 | `AccessibilityPanel.handleHighlightElement`에서 `currentWindow: true` 패턴 사용 — CLAUDE.md 표준 위반 | HIGH | Phase 5 Task 41에서 `chrome.windows.getCurrent()` 패턴으로 수정 |
| 11 | File Change Summary 4개 파일 누락 (contrastUtils.test.ts, hooks/index.ts, hooks 테스트, progress.tsx) | MEDIUM | 00-overview.md 파일 목록 및 카운트 수정 (47→53) |
| 12 | Phase Index "Tasks 9-20" — Task 9.5 비표준 번호로 실제 12개 태스크 | LOW | Phase Index 표기를 "9, 9.5, 10-20"으로 수정 |

---

## KRDS MCP Integration Strategy

### Development-Time Data Extraction

The following KRDS MCP tools are used during development to generate validation rule constants:

| KRDS MCP Tool | Extracted Data | Target Constant File |
|---------------|---------------|---------------------|
| `krds_get_colors` | 24 colors with accessibility grades (AA/AAA) | `src/constants/krds/colors.ts` |
| `krds_get_typography` | 20 typography styles (size, weight, line-height, letter-spacing) | `src/constants/krds/typography.ts` |
| `krds_get_design_tokens` | 350 tokens (spacing, sizing, border, shadow, motion) | `src/constants/krds/tokens.ts` |
| `krds_get_systems` | Responsive breakpoints, spacing scale, dark mode | `src/constants/krds/systems.ts` |
| `krds_get_components` | 46 component accessibility guidelines | `src/constants/krds/components.ts` |
| `krds_get_global_patterns` | 11 global pattern accessibility notes | `src/constants/krds/patterns.ts` |
| `krds_validate_accessibility` | 15-item WCAG 2.1 AA checklist | `src/utils/accessibility/htmlValidator.ts` |
| `krds_get_design_principles` | 7 design principles (포용성, 간결성, etc.) | Referenced in report UI |

### Runtime Validation Flow

```
Page DOM
  │
  ├─► HTML Validator ─────────── alt, label, aria, table, heading, lang, landmark
  ├─► Color Validator ─────────── contrast ratio (WCAG AA 4.5:1 / AAA 7:1), KRDS palette match
  ├─► Typography Validator ───── font-size ≥ 12px, line-height ≥ 1.4, KRDS scale match
  ├─► Component Validator ────── button size ≥ 44px, form label association, focus visible
  ├─► Responsive Validator ───── viewport meta, touch target 44px, breakpoint coverage
  └─► Token Validator ─────────── spacing (4px grid), color token match, border-radius
       │
       ▼
  Aggregated Report (score, issues by severity, suggestions)
       │
       ▼
  Side Panel UI (tabs: 요약 | HTML | 색상 | 타이포 | 컴포넌트 | 반응형 | 토큰)
```

---

## 6 Validation Categories

### Category 1: HTML Accessibility (WCAG 2.1 AA)

Based on `krds_validate_accessibility` 15-item checklist:

| Check | Rule | Severity |
|-------|------|----------|
| `img[alt]` | All `<img>` must have `alt` attribute | CRITICAL |
| `input[label]` | All inputs must have associated `<label>`, `aria-label`, or `aria-labelledby` | CRITICAL |
| `a[text]` | All `<a>` must have visible text or `aria-label` | CRITICAL |
| `table[th]` | Data tables must have `<th>` headers | HIGH |
| `heading-order` | Heading levels must not skip (h1→h3 without h2) | HIGH |
| `html[lang]` | `<html>` must have `lang` attribute | HIGH |
| `landmark` | Page must have `<main>`, `<nav>`, `<header>`, `<footer>` landmarks | MEDIUM |
| `button[text]` | Buttons must have accessible text | CRITICAL |
| `form[fieldset]` | Related form controls should be grouped with `<fieldset>`/`<legend>` | MEDIUM |
| `tabindex` | No positive `tabindex` values (disrupts natural tab order) | MEDIUM |
| `aria-roles` | ARIA roles must be valid | HIGH |
| `focus-visible` | Interactive elements must have visible focus indicator | HIGH |
| `color-only` | Information must not be conveyed by color alone | MEDIUM |
| `video[captions]` | `<video>` must have captions/subtitles track | HIGH |
| `auto-play` | No auto-playing media without user consent | MEDIUM |

### Category 2: Color Contrast (KRDS Color System)

Based on `krds_get_colors` (24 colors with AA/AAA grades):

| Check | Rule | Severity |
|-------|------|----------|
| `text-contrast-aa` | Normal text (< 24px and not bold 14pt+): contrast ratio ≥ 4.5:1 | CRITICAL |
| `text-contrast-aa-large` | Large text (≥ 18.66px/14pt bold or ≥ 24px/18pt): contrast ratio ≥ 3:1 (AA) | HIGH |
| `ui-contrast` | UI components and graphical objects: contrast ratio ≥ 3:1 | HIGH |
| `krds-palette-match` | Colors should match KRDS official palette | INFO |
| `government-blue` | Primary actions should use Government Blue (#0F4C8C, AAA) | INFO |
| `status-colors` | Success (#28A745), Warning (#FFC107), Error (#DC3545) — correct semantic usage | MEDIUM |

**KRDS Color Reference (baked-in):**

```typescript
// Grade = WCAG contrast level as text on white (#FFFFFF)
// 'AAA' ≥ 7:1 | 'AA' ≥ 4.5:1 | 'AA-LARGE' ≥ 3:1 | 'BACKGROUND' < 3:1
export const KRDS_COLORS: readonly KRDSColor[] = [
  { id: 'government-blue', hex: '#0F4C8C', grade: 'AAA', contrastOnWhite: 9.27 },
  { id: 'korean-red', hex: '#CD2E3A', grade: 'AAA', contrastOnWhite: 7.15 },
  { id: 'success', hex: '#28A745', grade: 'AA-LARGE', contrastOnWhite: 3.08 },
  { id: 'warning', hex: '#FFC107', grade: 'BACKGROUND', contrastOnWhite: 1.58 },
  { id: 'error', hex: '#DC3545', grade: 'AA', contrastOnWhite: 6.33 },
  { id: 'info', hex: '#17A2B8', grade: 'AA-LARGE', contrastOnWhite: 3.66 },
  // ... 18 more colors (see 01-infrastructure.md for full list)
] as const;
```

### Category 3: Typography (KRDS Typography System)

Based on `krds_get_typography` (20 styles):

| Check | Rule | Severity |
|-------|------|----------|
| `min-font-size` | Body text ≥ 16px (Body Regular), captions ≥ 12px | HIGH |
| `line-height` | Body text line-height ≥ 1.5 (WCAG), headings ≥ 1.2 | HIGH |
| `letter-spacing` | No negative letter-spacing on body text | MEDIUM |
| `font-weight` | Headings ≥ 600, body 400, labels 500 | INFO |
| `heading-scale` | Heading sizes should follow KRDS scale (32→28→24→20→18px) | INFO |
| `text-spacing` | Paragraph spacing, word spacing compliance | MEDIUM |

**KRDS Typography Reference (baked-in):**

```typescript
export const KRDS_TYPOGRAPHY = {
  heading1: { size: 32, weight: 700, lineHeight: 1.2 },
  heading2: { size: 28, weight: 600, lineHeight: 1.3 },
  heading3: { size: 24, weight: 600, lineHeight: 1.4 },
  heading4: { size: 20, weight: 600, lineHeight: 1.4 },
  heading5: { size: 18, weight: 600, lineHeight: 1.4 },
  bodyRegular: { size: 16, weight: 400, lineHeight: 1.6 },
  bodySmall: { size: 14, weight: 400, lineHeight: 1.5 },
  caption: { size: 12, weight: 400, lineHeight: 1.4, letterSpacing: '0.025em' },
  labelLarge: { size: 16, weight: 500, lineHeight: 1.5 },
  labelMedium: { size: 14, weight: 500, lineHeight: 1.5 },
  buttonMedium: { size: 16, weight: 600, lineHeight: 1 },
  // ... more styles
} as const;
```

### Category 4: Component Patterns (KRDS Component Guidelines)

Based on `krds_get_components` (46 components) + `krds_get_global_patterns` (11 patterns):

| Check | Rule | Severity |
|-------|------|----------|
| `button-min-size` | Buttons ≥ 44x44px touch target (KRDS responsive guideline) | HIGH |
| `form-label` | Every form input has visible, associated label | CRITICAL |
| `form-fieldset` | Related inputs grouped with `<fieldset>`/`<legend>` | MEDIUM |
| `form-error` | Error messages use `role="alert"`, linked via `aria-describedby` | HIGH |
| `modal-focus-trap` | Modal dialogs trap focus | HIGH |
| `modal-escape` | Modal closes on Escape key | MEDIUM |
| `tooltip-hover-focus` | Tooltips appear on both hover and focus | MEDIUM |
| `accordion-keyboard` | Accordion items operable via keyboard | MEDIUM |
| `navigation-landmark` | Navigation uses `<nav>` with `aria-label` | HIGH |
| `checkbox-label` | Checkbox/radio have associated labels | CRITICAL |
| `error-handling-pattern` | Error pages follow KRDS error-handling pattern (friendly tone, solution guidance) | INFO |
| `consent-pattern` | Consent forms distinguish required/optional, provide full text links | INFO |

**KRDS Global Pattern Accessibility Notes:**

| Pattern | Key Accessibility Requirement |
|---------|------------------------------|
| personal-identification | 필수 항목 명확히 표시, 오류 메시지 제공 |
| help | 키보드로 접근 가능, 스크린리더 호환 |
| consent | 체크박스와 레이블 연결, 필수 항목 안내 |
| list-navigation | 테이블 구조 활용, 현재 페이지 안내 |
| user-feedback | 폼 요소 레이블링, 제출 결과 알림 |
| detailed-information | 제목 계층 구조, 랜드마크 활용 |
| error-handling | role='alert', 포커스 이동 |
| input-forms | fieldset/legend 사용, 오류 메시지 연결 |
| file-attachments | 파일 정보 읽기, 진행 상태 알림 |
| filtering-sorting | 필터 상태 알림, 결과 업데이트 알림 |
| confirmation | 포커스 트랩, 명확한 버튼 레이블 |

### Category 5: Responsive Design (KRDS Responsive System)

Based on `krds_get_systems('responsive')`:

| Check | Rule | Severity |
|-------|------|----------|
| `viewport-meta` | `<meta name="viewport">` with `width=device-width` | CRITICAL |
| `touch-target-44` | Interactive elements ≥ 44x44px (KRDS mobile guideline) | HIGH |
| `no-horizontal-scroll` | No horizontal scrollbar at viewport width | HIGH |
| `text-resize` | Text remains readable at 200% zoom | MEDIUM |
| `media-queries` | Uses KRDS breakpoints (320, 768, 1024, 1440px) | INFO |
| `mobile-first` | CSS follows mobile-first approach (min-width media queries) | INFO |
| `content-reflow` | Content reflows without loss at 320px width | HIGH |

**KRDS Breakpoints (baked-in):**

```typescript
export const KRDS_BREAKPOINTS = {
  mobile: { min: 320, max: 767, columns: 1, touchTarget: 44 },
  tablet: { min: 768, max: 1023, columns: '2-3', touchTarget: 44 },
  desktop: { min: 1024, max: 1439, columns: 'multi' },
  wide: { min: 1440, columns: 'multi', maxWidth: true },
} as const;
```

### Category 6: Design Token Compliance (KRDS Token System)

Based on `krds_get_design_tokens` (350 tokens):

| Check | Rule | Severity |
|-------|------|----------|
| `spacing-4px-grid` | Spacing values should align to 4px grid (KRDS spacing scale) | INFO |
| `spacing-scale` | Uses KRDS spacing: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96px | INFO |
| `border-radius` | Border radius values match KRDS token scale | INFO |
| `shadow-tokens` | Box shadows match KRDS shadow tokens | INFO |
| `motion-duration` | Animation durations match KRDS motion tokens | INFO |
| `color-token-match` | Colors match KRDS color tokens (exact hex match) | INFO |

**KRDS Spacing Scale (baked-in):**

```typescript
export const KRDS_SPACING = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 128] as const;
```

---

## Scoring System

### Score Calculation

**Category Score** (per-category raw compliance):
```
Category Score = (passed / total) * 100
```
Each validator reports a simple pass/fail ratio. This shows how many checks passed regardless of severity.

**Total Score** (severity-weighted, risk-adjusted):
```
maxPenalty   = totalChecks × WEIGHT_CRITICAL (10)
actualPenalty = Σ WEIGHT[issue.severity] for each failed check
Total Score  = max(0, round((1 - actualPenalty / maxPenalty) × 100))
```
The total score penalizes failures proportionally to their severity. CRITICAL failures have 10× the impact of LOW failures. INFO issues (weight 0) do not affect the total score.

**Note:** Category scores and total score use different formulas intentionally. A category with many INFO failures will show a low category score (e.g., 50%) but contribute 0 penalty to the total score. This design prioritizes WCAG compliance (CRITICAL/HIGH) over KRDS alignment (INFO) in the overall grade.

**Severity Weights:**

| Severity | Weight | Description |
|----------|--------|-------------|
| CRITICAL | 10 | Must fix — blocks WCAG AA compliance |
| HIGH | 5 | Should fix — significant accessibility barrier |
| MEDIUM | 3 | Recommended — improves usability |
| LOW | 1 | Optional — enhancement for KRDS alignment |
| INFO | 0 | Informational — no impact on total score |

### Grade Mapping

| Score | Grade | Label |
|-------|-------|-------|
| 90-100 | A | 우수 (Excellent) |
| 75-89 | B | 양호 (Good) |
| 60-74 | C | 보통 (Average) |
| 40-59 | D | 미흡 (Below Average) |
| 0-39 | F | 부적합 (Non-compliant) |

### KRDS Compliance Badge

Pages scoring ≥ 75 (Grade B+) receive a "KRDS 준수" badge in the report.

---

## Phase Index

| Phase | File | Tasks | Description |
|-------|------|-------|-------------|
| 1 | [01-infrastructure.md](./01-infrastructure.md) | 1-8 | Types, KRDS rule constants, message constants, i18n keys |
| 2 | [02-validators.md](./02-validators.md) | 9, 9.5, 10-20 | 6 validator modules (HTML, color, typography, component, responsive, token) |
| 3 | [03-content-scanner.md](./03-content-scanner.md) | 21-26 | Content script DOM scanner, element extraction, scan orchestrator |
| 4 | [04-hooks-state.md](./04-hooks-state.md) | 27-31 | React hooks (useAccessibilityReport, useAccessibilitySettings), storage |
| 5 | [05-ui-components.md](./05-ui-components.md) | 32-42 | Side Panel UI (ScoreCard, IssueList, CategoryTabs, ReportPanel, ExportButton) |
| 6 | [06-integration.md](./06-integration.md) | 43-47 | Tool registration, ToolRouter, content script handler, background context menu |
| 7 | [07-verification.md](./07-verification.md) | 48-50 | Build verification, lint, manual E2E checklist |

**Total: ~50 tasks, estimated 25-30 hours**

---

## File Change Summary

| File | Change | Phase |
|------|--------|-------|
| **Phase 1: Infrastructure** | | |
| `src/types/accessibility.ts` | Create | 1 |
| `src/constants/krds/colors.ts` | Create | 1 |
| `src/constants/krds/typography.ts` | Create | 1 |
| `src/constants/krds/tokens.ts` | Create | 1 |
| `src/constants/krds/systems.ts` | Create | 1 |
| `src/constants/krds/components.ts` | Create | 1 |
| `src/constants/krds/patterns.ts` | Create | 1 |
| `src/constants/messages.ts` | Modify (add A11Y actions) | 1 |
| `src/i18n/locales/ko.json` | Modify (add A11Y labels) | 1 |
| `src/i18n/locales/en.json` | Modify (add A11Y labels) | 1 |
| **Phase 2: Validators** | | |
| `src/utils/accessibility/htmlValidator.ts` | Create | 2 |
| `src/utils/accessibility/colorValidator.ts` | Create | 2 |
| `src/utils/accessibility/typographyValidator.ts` | Create | 2 |
| `src/utils/accessibility/componentValidator.ts` | Create | 2 |
| `src/utils/accessibility/responsiveValidator.ts` | Create | 2 |
| `src/utils/accessibility/tokenValidator.ts` | Create | 2 |
| `src/utils/accessibility/contrastUtils.ts` | Create | 2 |
| `src/utils/accessibility/selectorUtils.ts` | Create | 2 |
| `src/utils/accessibility/scoreCalculator.ts` | Create | 2 |
| `src/utils/accessibility/index.ts` | Create | 2 |
| `src/utils/accessibility/__tests__/contrastUtils.test.ts` | Create | 2 |
| `src/utils/accessibility/__tests__/htmlValidator.test.ts` | Create | 2 |
| `src/utils/accessibility/__tests__/colorValidator.test.ts` | Create | 2 |
| `src/utils/accessibility/__tests__/scoreCalculator.test.ts` | Create | 2 |
| **Phase 3: Content Scanner** | | |
| `src/content/accessibility/domScanner.ts` | Create | 3 |
| `src/content/accessibility/elementExtractor.ts` | Create | 3 |
| `src/content/accessibility/colorExtractor.ts` | Create | 3 |
| `src/content/accessibility/typographyExtractor.ts` | Create | 3 |
| `src/content/accessibility/layoutExtractor.ts` | Create | 3 |
| `src/content/accessibility/scanOrchestrator.ts` | Create | 3 |
| **Phase 4: Hooks & State** | | |
| `src/hooks/accessibility/useAccessibilityReport.ts` | Create | 4 |
| `src/hooks/accessibility/useAccessibilitySettings.ts` | Create | 4 |
| `src/hooks/accessibility/useAccessibilityScanner.ts` | Create | 4 |
| `src/hooks/accessibility/index.ts` | Create | 4 |
| `src/hooks/accessibility/__tests__/useAccessibilitySettings.test.ts` | Create | 4 |
| `src/components/ui/progress.tsx` | Create (via shadcn CLI) | 1 |
| **Phase 5: UI Components** | | |
| `src/components/AccessibilityChecker/AccessibilityPanel.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/ScoreCard.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/CategoryTabs.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/IssueList.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/IssueItem.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/SummaryTab.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/CategoryDetail.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/ExportButton.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/ScanButton.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/SettingsPanel.tsx` | Create | 5 |
| `src/components/AccessibilityChecker/index.ts` | Create | 5 |
| **Phase 6: Integration** | | |
| `src/sidepanel/constants/tools.ts` | Modify (add accessibilityChecker) | 6 |
| `src/sidepanel/components/ToolRouter.tsx` | Modify (add case) | 6 |
| `src/content/index.ts` | Modify (add A11Y scan handler) | 6 |
| `src/background/index.ts` | Modify (add context menu entry) | 6 |
| **Phase 7: Verification** | | |
| (no new files) | Build, lint, E2E verification | 7 |

**Total: 53 files (46 new, 7 modified)**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Side Panel (React)                    │
│                                                         │
│  ┌──────────┐  ┌────────────────────────────────────┐  │
│  │ ScanBtn  │  │         AccessibilityPanel          │  │
│  │  스캔    │  │  ┌────┬────┬────┬────┬────┬────┬────┐│  │
│  └──────────┘  │  │요약│HTML│색상│타이포│컴포│반응│토큰││  │
│                │  └────┴────┴────┴────┴────┴────┴────┘│  │
│  ┌──────────┐  │  ┌─────────────────────────────┐   │  │
│  │ScoreCard │  │  │         IssueList            │   │  │
│  │  85/100  │  │  │  [!] img alt 누락 (CRITICAL) │   │  │
│  │ Grade: B │  │  │  [!] 대비율 3.2:1 (HIGH)     │   │  │
│  └──────────┘  │  │  [i] KRDS 토큰 불일치 (INFO) │   │  │
│                │  └─────────────────────────────┘   │  │
│  ┌──────────┐  │  ┌─────────────────────────────┐   │  │
│  │ Export   │  │  │      SettingsPanel           │   │  │
│  │ 리포트   │  │  │  Categories: [x]HTML [x]Color│   │  │
│  └──────────┘  │  └─────────────────────────────┘   │  │
│                └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │  chrome.tabs.sendMessage
         ▼
┌─────────────────────────────────────────────────────────┐
│                 Content Script                           │
│                                                         │
│  ┌─────────────────────┐   ┌──────────────────────┐    │
│  │   scanOrchestrator   │──►│   domScanner         │    │
│  │   (entry point)      │   │   (DOM traversal)    │    │
│  └──────────┬──────────┘   └──────────────────────┘    │
│             │                                           │
│  ┌──────────▼──────────┐                                │
│  │     Extractors       │                                │
│  │  ┌────────────────┐ │   ┌──────────────────────┐    │
│  │  │ elementExtract │ │   │    Validators         │    │
│  │  │ colorExtract   │ │──►│  htmlValidator        │    │
│  │  │ typoExtract    │ │   │  colorValidator       │    │
│  │  │ layoutExtract  │ │   │  typographyValidator   │    │
│  │  └────────────────┘ │   │  componentValidator    │    │
│  └─────────────────────┘   │  responsiveValidator   │    │
│                             │  tokenValidator        │    │
│  chrome.runtime.sendMessage │  scoreCalculator       │    │
│  (A11Y_SCAN_RESULT)        └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Message Flow

```
Side Panel ──A11Y_SCAN_START──► Content Script
                                    │
                              DOM Scan + Validate
                                    │
Content Script ──A11Y_SCAN_RESULT──► Side Panel
Content Script ──A11Y_SCAN_PROGRESS─► Side Panel (optional, for large pages)
```

**New Message Actions:**

```typescript
// 접근성 체커
A11Y_SCAN_START: 'A11Y_SCAN_START',           // Side Panel → Content: start scanning
A11Y_SCAN_RESULT: 'A11Y_SCAN_RESULT',         // Content → Side Panel: scan results
A11Y_SCAN_PROGRESS: 'A11Y_SCAN_PROGRESS',     // Content → Side Panel: scan progress
A11Y_SCAN_ELEMENT: 'A11Y_SCAN_ELEMENT',       // Side Panel → Content: highlight specific element
A11Y_SCAN_CLEAR: 'A11Y_SCAN_CLEAR',           // Side Panel → Content: clear highlights
```

---

## Key Types

```typescript
// src/types/accessibility.ts

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ValidationCategory =
  | 'html'          // HTML 접근성 (WCAG 2.1 AA)
  | 'color'         // 색상 대비 (KRDS Color System)
  | 'typography'    // 타이포그래피 (KRDS Typography)
  | 'component'     // 컴포넌트 패턴 (KRDS Components)
  | 'responsive'    // 반응형 디자인 (KRDS Responsive)
  | 'token';        // 디자인 토큰 (KRDS Tokens)

export type AccessibilityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AccessibilityIssue {
  id: string;
  category: ValidationCategory;
  severity: IssueSeverity;
  rule: string;
  message: string;
  suggestion: string;
  element?: {
    tagName: string;
    selector: string;
    outerHTML: string;    // truncated to 200 chars
  };
  wcagCriteria?: string;  // e.g. "1.1.1", "1.4.3"
  krdsCriteria?: string;  // e.g. "color-contrast-aa", "spacing-4px-grid"
}

export interface CategoryResult {
  category: ValidationCategory;
  label: string;
  passed: number;
  total: number;
  score: number;         // 0-100
  issues: AccessibilityIssue[];
}

export interface AccessibilityReport {
  url: string;
  timestamp: number;
  totalScore: number;     // 0-100 weighted
  grade: AccessibilityGrade;
  krdsCompliant: boolean; // score ≥ 75
  categories: CategoryResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    totalIssues: number;
    totalPassed: number;
    totalChecks: number;
  };
  scanDuration: number;   // ms
}

export interface AccessibilitySettings {
  enabledCategories: ValidationCategory[];
  severityFilter: IssueSeverity[];
  maxElementsToScan: number;  // default 1000
  includeHidden: boolean;     // scan display:none elements
  autoScanOnActivate: boolean;
}

export const DEFAULT_A11Y_SETTINGS: AccessibilitySettings = {
  // NOTE: token validator exists, but is disabled by default.
  enabledCategories: ['html', 'color', 'typography', 'component', 'responsive'],
  severityFilter: ['critical', 'high', 'medium', 'low', 'info'],
  maxElementsToScan: 1000,
  includeHidden: false,
  autoScanOnActivate: false,
};

export const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 10,
  high: 5,
  medium: 3,
  low: 1,
  info: 0,
};

export const GRADE_THRESHOLDS: { min: number; grade: AccessibilityGrade; label: string; labelKo: string }[] = [
  { min: 90, grade: 'A', label: 'Excellent', labelKo: '우수' },
  { min: 75, grade: 'B', label: 'Good', labelKo: '양호' },
  { min: 60, grade: 'C', label: 'Average', labelKo: '보통' },
  { min: 40, grade: 'D', label: 'Below Average', labelKo: '미흡' },
  { min: 0, grade: 'F', label: 'Non-compliant', labelKo: '부적합' },
];
```

---

## Tool Registration

```typescript
// In src/sidepanel/constants/tools.ts

// Add to ToolType union:
| 'accessibilityChecker'

// Add to ALL_TOOLS array:
{
  id: 'accessibilityChecker',
  name: '접근성 검사',
  description: 'KRDS 웹접근성 검사',
  icon: ShieldCheck,  // from lucide-react
  category: 'analyze',
  exclusive: false,
  shortcut: 'Ctrl+Shift+A',
}
```

**Note:** `exclusive: false` — accessibility checker can run alongside other tools, but it DOES use in-page DOM overlays when active (hover selection outline + Inspector panel). The scan itself is still triggered by `A11Y_SCAN_START` (Scan button), not by activation.

---

## UI Component Structure

```
AccessibilityPanel
├── Header (title + scan button + settings toggle)
├── ScoreCard (circular score, grade badge, KRDS compliance badge)
├── CategoryTabs
│   ├── SummaryTab (overview of all categories, issue count by severity)
│   ├── CategoryDetail("html") — HTML 접근성
│   ├── CategoryDetail("color") — 색상 대비
│   ├── CategoryDetail("typography") — 타이포그래피
│   ├── CategoryDetail("component") — 컴포넌트 패턴
│   ├── CategoryDetail("responsive") — 반응형
│   └── (optional) CategoryDetail("token") — 디자인 토큰 (기본값 비활성화)
├── IssueList (filterable by severity, sortable)
│   └── IssueItem (severity badge, message, element selector, fix suggestion)
├── ExportButton (JSON, CSV, HTML report)
└── SettingsPanel (category toggles, severity filter, scan options)
```

**shadcn/ui Components Used:**
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` — category navigation
- `Progress` — score visualization
- `Badge` — severity labels, grade badge
- `Accordion` / `AccordionItem` — issue details expansion
- `ScrollArea` — issue list scrolling
- `Button` — scan trigger, export
- `Switch` — category toggles in settings
- `Select` — severity filter
- `Card` / `CardContent` — score card, summary cards
- `Separator` — section dividers
- `Tooltip` — KRDS criteria explanations

---

## Content Script Scan Flow

```typescript
// src/content/accessibility/scanOrchestrator.ts

export async function runAccessibilityScan(
  settings: AccessibilitySettings
): Promise<AccessibilityReport> {
  const startTime = performance.now();
  const url = window.location.href;

  // 1. Scan DOM and extract data
  const scannableElements = scanDOM(document, settings.maxElementsToScan, settings.includeHidden);
  const elementData = extractElements(scannableElements);
  const colorData = extractColors(scannableElements);
  const typographyData = extractTypography(scannableElements);
  const layoutData = extractLayout(settings.maxElementsToScan);

  // 2. Run validators (only enabled categories)
  const categories: CategoryResult[] = [];

  if (settings.enabledCategories.includes('html')) {
    categories.push(validateHtml(document));
  }
  if (settings.enabledCategories.includes('color')) {
    categories.push(validateColors(colorData));
  }
  if (settings.enabledCategories.includes('typography')) {
    categories.push(validateTypography(typographyData));
  }
  if (settings.enabledCategories.includes('component')) {
    categories.push(validateComponents(elementData));
  }
  if (settings.enabledCategories.includes('responsive')) {
    categories.push(validateResponsive(layoutData));
  }
  if (settings.enabledCategories.includes('token')) {
    categories.push(validateTokens(scannableElements));
  }

  // 3. Calculate score
  const report = calculateReport(url, categories, performance.now() - startTime);

  return report;
}
```

---

## Export Formats

### JSON Report
Full `AccessibilityReport` object serialized as JSON.

### CSV Report
```
Category,Severity,Rule,Message,Element,WCAG,KRDS,Suggestion
html,critical,img[alt],"이미지에 alt 속성이 누락되었습니다",img.hero-image,1.1.1,,alt 속성을 추가하세요
color,high,text-contrast-aa,"텍스트 대비율이 3.2:1입니다 (최소 4.5:1 필요)",p.subtitle,,color-contrast-aa,텍스트 또는 배경색을 조정하세요
```

### HTML Report
Styled, printable HTML report with KRDS branding (Government Blue header, score visualization).

---

## i18n Keys (Korean-first)

```json
{
  "accessibility": {
    "title": "접근성 검사",
    "description": "KRDS 웹접근성 검사",
    "scan": "검사 시작",
    "scanning": "검사 중...",
    "rescan": "다시 검사",
    "score": "접근성 점수",
    "grade": "등급",
    "krdsCompliant": "KRDS 준수",
    "krdsNonCompliant": "KRDS 미준수",
    "categories": {
      "summary": "요약",
      "html": "HTML 접근성",
      "color": "색상 대비",
      "typography": "타이포그래피",
      "component": "컴포넌트",
      "responsive": "반응형",
      "token": "디자인 토큰"
    },
    "severity": {
      "critical": "심각",
      "high": "높음",
      "medium": "보통",
      "low": "낮음",
      "info": "정보"
    },
    "grades": {
      "A": "우수",
      "B": "양호",
      "C": "보통",
      "D": "미흡",
      "F": "부적합"
    },
    "export": "리포트 내보내기",
    "settings": "검사 설정",
    "noIssues": "이슈가 없습니다",
    "issues": "{{count}}개 이슈",
    "passed": "{{count}}개 통과",
    "scanDuration": "검사 시간: {{ms}}ms"
  }
}
```

---

## Pre-requisites

```bash
# Verify current build is clean
npm run build
npm run lint
tsc -b
```

---

## Dependencies

No new npm packages required. All validation logic is implemented in pure TypeScript.

**Existing dependencies leveraged:**
- `lucide-react` — `ShieldCheck` icon for tool
- `shadcn/ui` — UI components (already installed)
- Color contrast calculation — pure math (relative luminance formula)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Large DOM pages (>10k elements) cause scan slowdown | HIGH | MEDIUM | `maxElementsToScan` limit (default 1000), progress indicator |
| Cross-origin iframes not scannable | HIGH | LOW | Document limitation, skip iframes with `try/catch` |
| Shadow DOM elements not accessible | MEDIUM | LOW | Use `element.shadowRoot?.querySelectorAll` where available |
| Color extraction from complex gradients/images | MEDIUM | LOW | Focus on text foreground/background pairs only |
| Dynamic content changes after scan | LOW | LOW | Re-scan button, option for auto-scan on mutation |
| KRDS rules change over time | LOW | MEDIUM | Version KRDS constants, easy update path |

---

## Success Criteria

- [ ] All 6 validation categories implemented and tested
- [ ] Score calculation produces consistent results
- [ ] Scan completes in < 3 seconds for pages with ≤ 1000 elements
- [ ] UI displays results clearly with Korean labels
- [ ] Export produces valid JSON/CSV/HTML reports
- [ ] No regression in existing 12 tools
- [ ] Build succeeds with 0 TypeScript errors
- [ ] Unit test coverage ≥ 80% for validator modules
