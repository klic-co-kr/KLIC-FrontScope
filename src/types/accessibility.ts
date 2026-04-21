// src/types/accessibility.ts
// Accessibility Checker Type Definitions

/**
 * WCAG 2.1 issue severity levels
 * - CRITICAL: Must fix — blocks WCAG AA compliance
 * - HIGH: Should fix — significant accessibility barrier
 * - MEDIUM: Recommended — improves usability
 * - LOW: Optional — enhancement for KRDS alignment
 * - INFO: Informational — no impact on total score (weight 0)
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * 6 validation categories based on KRDS design system
 * Each category has its own validator module and produces a CategoryResult
 */
export type ValidationCategory =
  | 'html'          // HTML accessibility (WCAG 2.1 AA)
  | 'color'         // Color contrast (KRDS Color System)
  | 'typography'    // Typography (KRDS Typography)
  | 'component'     // Component patterns (KRDS Components)
  | 'responsive'    // Responsive design (KRDS Responsive)
  | 'token'         // Design tokens (KRDS Tokens)
  | 'summary';      // Overall summary

/**
 * Accessibility grade based on total score
 */
export type AccessibilityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Element description for accessibility issues
 */
export interface ElementDescription {
  tagName: string;
  selector: string;
  outerHTML: string;
}

/**
 * Individual accessibility issue found during validation
 */
export interface AccessibilityIssue {
  id: string;
  category: ValidationCategory;
  severity: IssueSeverity;
  rule: string;
  message: string;
  suggestion: string;
  element?: string | ElementDescription;
  wcagCriteria?: string;  // e.g. "1.1.1", "1.4.3"
  krdsCriteria?: string;  // e.g. "color-contrast-aa", "spacing-4px-grid"
}

/**
 * Result for a single validation category
 * score = (passed / total) * 100 — raw compliance ratio
 * Total score uses severity-weighted calculation in scoreCalculator
 */
export interface CategoryResult {
  category: ValidationCategory;
  label: string;
  passed: number;
  total: number;
  score: number;         // 0-100
  issues: AccessibilityIssue[];
  elements?: HTMLElement[];
}

/**
 * Complete accessibility report for a page scan
 */
export interface AccessibilityReport {
  url: string;
  timestamp: number;
  totalScore: number;     // 0-100 weighted
  grade: AccessibilityGrade;
  krdsCompliant: boolean; // score ≥ 75
  issues: AccessibilityIssue[];
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
  scanDuration?: number;   // ms
}

/**
 * User settings for accessibility scanning
 */
export interface AccessibilitySettings {
  enabledCategories: ValidationCategory[];
  severityFilter: IssueSeverity[];
  maxElementsToScan: number;  // default 1000
  includeHidden: boolean;     // scan display:none elements
  autoScanOnActivate: boolean;
}

/**
 * Default accessibility checker settings
 */
export const DEFAULT_A11Y_SETTINGS: AccessibilitySettings = {
  enabledCategories: ['html', 'color', 'typography', 'component', 'responsive'],
  severityFilter: ['critical', 'high', 'medium', 'low', 'info'],
  maxElementsToScan: 1000,
  includeHidden: false,
  autoScanOnActivate: false,
};

/**
 * Severity weights for total score calculation
 * Higher weight = more impact on score when failed
 * INFO has weight 0 — doesn't affect score
 */
export const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 10,
  high: 5,
  medium: 3,
  low: 1,
  info: 0,
};

/**
 * Grade thresholds for score-to-grade mapping
 */
export const GRADE_THRESHOLDS: { min: number; grade: AccessibilityGrade; label: string; labelKo: string }[] = [
  { min: 90, grade: 'A', label: 'Excellent', labelKo: '우수' },
  { min: 75, grade: 'B', label: 'Good', labelKo: '양호' },
  { min: 60, grade: 'C', label: 'Average', labelKo: '보통' },
  { min: 40, grade: 'D', label: 'Below Average', labelKo: '미흡' },
  { min: 0, grade: 'F', label: 'Non-compliant', labelKo: '부적합' },
];
