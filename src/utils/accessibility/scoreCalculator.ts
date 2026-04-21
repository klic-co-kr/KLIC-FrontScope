// src/utils/accessibility/scoreCalculator.ts
// Score calculation for accessibility reports

import type { AccessibilityIssue, CategoryResult, AccessibilityReport } from '@/types/accessibility';
import { SEVERITY_WEIGHTS, GRADE_THRESHOLDS } from '@/types/accessibility';

/**
 * Calculate category score (raw compliance ratio)
 */
export function calculateCategoryScore(passed: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((passed / total) * 100);
}

/**
 * Calculate total weighted score (severity-weighted, risk-adjusted)
 * Formula: max(0, round((1 - actualPenalty / maxPenalty) × 100))
 */
export function calculateTotalScore(categories: CategoryResult[]): number {
  let totalChecks = 0;
  let actualPenalty = 0;

  for (const category of categories) {
    totalChecks += category.total;

    for (const issue of category.issues) {
      actualPenalty += SEVERITY_WEIGHTS[issue.severity] || 0;
    }
  }

  // Max penalty assumes all checks failed at CRITICAL level
  const maxPenalty = totalChecks * 10;

  const score = Math.max(0, Math.round((1 - actualPenalty / maxPenalty) * 100));
  return score;
}

/**
 * Get grade from total score
 */
export function getGrade(score: number): string {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.grade;
    }
  }
  return 'F';
}

/**
 * Get grade label in Korean
 */
export function getGradeLabel(score: number): string {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.labelKo;
    }
  }
  return '부적합';
}

/**
 * Generate complete accessibility report
 */
export function calculateReport(
  url: string,
  categories: CategoryResult[],
  scanDuration: number
): AccessibilityReport {
  // Calculate total score
  const totalScore = calculateTotalScore(categories);

  // Calculate grade
  const grade = getGrade(totalScore) as 'A' | 'B' | 'C' | 'D' | 'F';

  // Calculate summary
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    totalIssues: 0,
    totalPassed: 0,
    totalChecks: 0,
  };

  for (const category of categories) {
    summary.totalIssues += category.issues.length;
    summary.totalChecks += category.total;
    summary.totalPassed += category.passed;

    for (const issue of category.issues) {
      const severity = issue.severity;
      if (severity === 'critical') summary.critical++;
      else if (severity === 'high') summary.high++;
      else if (severity === 'medium') summary.medium++;
      else if (severity === 'low') summary.low++;
      else if (severity === 'info') summary.info++;
    }
  }

  // KRDS compliance: score ≥ 75
  const krdsCompliant = totalScore >= 75;

  // Collect all issues from categories
  const issues: AccessibilityIssue[] = [];
  for (const category of categories) {
    issues.push(...category.issues);
  }

  return {
    url,
    timestamp: Date.now(),
    totalScore,
    grade,
    krdsCompliant,
    issues,
    categories,
    summary,
    scanDuration,
  };
}
