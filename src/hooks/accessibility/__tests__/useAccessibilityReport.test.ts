import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AccessibilityReport } from '../../../types/accessibility';
import {
  buildAccessibilityReportCsv,
  buildAccessibilityReportHtml,
  buildAccessibilityReportJson,
  useAccessibilityReport,
} from '../useAccessibilityReport';
import { downloadText } from '../../../utils/download';
import { validateHtml } from '../../../utils/accessibility/htmlValidator';

vi.mock('../../../utils/download', () => ({
  downloadText: vi.fn(),
}));

const sampleReport: AccessibilityReport = {
  url: 'https://example.com/page',
  timestamp: 1735689600000,
  totalScore: 82,
  grade: 'B',
  krdsCompliant: true,
  issues: [
    {
      id: 'issue-1',
      category: 'html',
      severity: 'critical',
      rule: 'img-alt',
      message: '이미지에 대체 텍스트가 없습니다',
      suggestion: 'alt 속성을 추가하세요',
      wcagCriteria: '1.1.1',
      krdsCriteria: 'alt-text',
      element: {
        tagName: 'img',
        selector: '#hero img',
        outerHTML: '<img src="hero.png">',
      },
    },
  ],
  categories: [
    {
      category: 'html',
      label: 'HTML 접근성',
      passed: 14,
      total: 15,
      score: 93,
      issues: [
        {
          id: 'issue-1',
          category: 'html',
          severity: 'critical',
          rule: 'img-alt',
          message: '이미지에 대체 텍스트가 없습니다',
          suggestion: 'alt 속성을 추가하세요',
          wcagCriteria: '1.1.1',
          krdsCriteria: 'alt-text',
          element: {
            tagName: 'img',
            selector: '#hero img',
            outerHTML: '<img src="hero.png">',
          },
        },
      ],
    },
    {
      category: 'responsive',
      label: '반응형',
      passed: 8,
      total: 8,
      score: 100,
      issues: [],
    },
  ],
  summary: {
    critical: 1,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    totalIssues: 1,
    totalPassed: 22,
    totalChecks: 23,
  },
  scanDuration: 420,
};

describe('useAccessibilityReport export helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds csv with issue rows', () => {
    const csv = buildAccessibilityReportCsv(sampleReport);
    const lines = csv.split('\n');

    expect(lines[0]).toContain('"url"');
    expect(lines[1]).toContain('"https://example.com/page"');
    expect(lines[1]).toContain('"img-alt"');
    expect(lines.length).toBe(2);
  });

  it('builds json with checklist reference', () => {
    const json = buildAccessibilityReportJson(sampleReport);
    const parsed = JSON.parse(json) as {
      metadata: { schemaVersion: string };
      report: AccessibilityReport;
      checklistReference: Array<{ id: string }>;
    };

    expect(parsed.metadata.schemaVersion).toBe('1.1.0');
    expect(parsed.report.totalScore).toBe(82);
    expect(parsed.checklistReference.length).toBeGreaterThan(0);
  });

  it('builds html with checklist section', () => {
    const html = buildAccessibilityReportHtml(sampleReport);

    expect(html).toContain('평가 기준 참고표');
    expect(html).toContain('원칙 1. 인식의 용이성');
    expect(html).toContain('1.1.1');
    expect(html).toContain('본문으로 건너뛰기');
    expect(html).toContain('<header');
    expect(html).toContain('<nav');
    expect(html).toContain('<footer');
  });

  it('builds html without landmark or heading-order violations in html validator', () => {
    const html = buildAccessibilityReportHtml(sampleReport);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const result = validateHtml(doc);

    const landmarkIssues = result.issues.filter((issue) => issue.rule === 'landmark');
    const headingOrderIssues = result.issues.filter((issue) => issue.rule === 'heading-order');

    expect(landmarkIssues.length).toBe(0);
    expect(headingOrderIssues.length).toBe(0);
  });

  it('uses report CSS defaults that satisfy internal min typography and touch-target baselines', () => {
    const html = buildAccessibilityReportHtml(sampleReport);

    expect(html).toContain('.report-nav a');
    expect(html).toContain('font-size: 16px;');
    expect(html).toContain('min-height: 44px;');
    expect(html).not.toContain('font-size: 11px;');
    expect(html).not.toContain('font-size: 12px;');
    expect(html).not.toContain('font-size: 13px;');
    expect(html).not.toContain('font-size: 14px;');
    expect(html).not.toContain('font-size: 15px;');
  });

  it('exports json through download utility', () => {
    const { result } = renderHook(() => useAccessibilityReport(sampleReport));

    act(() => {
      result.current.exportReport('json');
    });

    expect(downloadText).toHaveBeenCalledTimes(1);
    const [content, filename, mimeType] = vi.mocked(downloadText).mock.calls[0];
    expect(filename.endsWith('.json')).toBe(true);
    expect(mimeType).toBe('application/json');
    expect(content).toContain('"schemaVersion"');
    expect(result.current.isExporting).toBe(false);
  });
});
