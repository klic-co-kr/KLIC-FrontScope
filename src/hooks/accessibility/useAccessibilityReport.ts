import { useCallback, useState } from 'react';
import type { AccessibilityIssue, AccessibilityReport, ElementDescription } from '../../types/accessibility';
import { downloadText } from '../../utils/download';

export type AccessibilityExportFormat = 'json' | 'csv' | 'html';

interface ExportFormat {
  format: AccessibilityExportFormat;
  label: string;
}

interface ChecklistCriterion {
  id: string;
  title: string;
  description: string;
}

interface ChecklistPrinciple {
  id: string;
  title: string;
  description: string;
  criteria: ChecklistCriterion[];
}

interface ExportFile {
  filename: string;
  content: string;
  mimeType: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { format: 'json', label: 'JSON' },
  { format: 'csv', label: 'CSV' },
  { format: 'html', label: 'HTML Report' },
];

export const KWCAG_REPORT_CHECKLIST: ChecklistPrinciple[] = [
  {
    id: '1',
    title: '인식의 용이성 (Perceivable)',
    description: '모든 콘텐츠는 사용자가 인식할 수 있어야 한다.',
    criteria: [
      { id: '1.1.1', title: '적절한 대체 텍스트 제공', description: '텍스트 아닌 콘텐츠는 그 의미나 용도를 이해할 수 있도록 대체 텍스트를 제공해야 한다.' },
      { id: '1.2.1', title: '자막 제공', description: '멀티미디어 콘텐츠에는 자막, 원고 또는 수화를 제공해야 한다.' },
      { id: '1.3.1', title: '표의 구성', description: '표는 이해하기 쉽게 구성해야 한다.' },
      { id: '1.3.2', title: '콘텐츠의 선형구조', description: '콘텐츠는 논리적인 순서로 제공해야 한다.' },
      { id: '1.3.3', title: '명확한 지시사항 제공', description: '지시사항은 모양, 크기, 위치, 방향, 색, 소리 등에 관계없이 인식될 수 있어야 한다.' },
      { id: '1.4.1', title: '색에 무관한 콘텐츠 인식', description: '콘텐츠는 색에 관계없이 인식될 수 있어야 한다.' },
      { id: '1.4.2', title: '자동 재생 금지', description: '자동으로 소리가 재생되지 않아야 한다.' },
      { id: '1.4.3', title: '텍스트 콘텐츠의 명도 대비', description: '텍스트 콘텐츠와 배경 간의 명도 대비는 4.5 대 1 이상이어야 한다.' },
      { id: '1.4.4', title: '콘텐츠 간의 구분', description: '이웃한 콘텐츠는 구별될 수 있어야 한다.' },
    ],
  },
  {
    id: '2',
    title: '운용의 용이성 (Operable)',
    description: '사용자 인터페이스 구성요소는 조작 가능하고 내비게이션 할 수 있어야 한다.',
    criteria: [
      { id: '2.1.1', title: '키보드 사용 보장', description: '모든 기능은 키보드만으로도 사용할 수 있어야 한다.' },
      { id: '2.1.2', title: '초점 이동과 표시', description: '키보드에 의한 초점은 논리적으로 이동해야 하며, 시각적으로 구별할 수 있어야 한다.' },
      { id: '2.1.3', title: '조작 가능', description: '사용자 입력 및 콘트롤은 조작 가능하도록 제공되어야 한다.' },
      { id: '2.1.4', title: '문자 단축키', description: '문자 단축키는 오동작으로 인한 오류를 방지하여야 한다.' },
      { id: '2.2.1', title: '응답시간 조절', description: '시간제한이 있는 콘텐츠는 응답시간을 조절할 수 있어야 한다.' },
      { id: '2.2.2', title: '정지 기능 제공', description: '자동으로 변경되는 콘텐츠는 움직임을 제어할 수 있어야 한다.' },
      { id: '2.3.1', title: '깜빡임과 번쩍임 사용 제한', description: '초당 3~50회 주기로 깜빡이거나 번쩍이는 콘텐츠를 제공하지 않아야 한다.' },
      { id: '2.4.1', title: '반복 영역 건너뛰기', description: '콘텐츠의 반복되는 영역은 건너뛸 수 있어야 한다.' },
      { id: '2.4.2', title: '제목 제공', description: '페이지, 프레임, 콘텐츠 블록에는 적절한 제목을 제공해야 한다.' },
      { id: '2.4.3', title: '적절한 링크 텍스트', description: '링크 텍스트는 용도나 목적을 이해할 수 있도록 제공해야 한다.' },
      { id: '2.4.4', title: '고정된 참조 위치 정보', description: '전자출판문서 형식의 웹 페이지는 각 페이지로 이동할 수 있는 기능이 있어야 하고, 서식이나 플랫폼에 상관없이 참조 위치 정보를 일관되게 제공 및 유지해야 한다.' },
      { id: '2.5.1', title: '단일 포인터 입력 지원', description: '다중 포인터 또는 경로기반 동작을 통한 입력은 단일 포인터 입력으로도 조작할 수 있어야 한다.' },
      { id: '2.5.2', title: '포인터 입력 취소', description: '단일 포인터 입력으로 실행되는 기능은 취소할 수 있어야 한다.' },
      { id: '2.5.3', title: '레이블과 네임', description: '텍스트 또는 텍스트 이미지가 포함된 레이블이 있는 사용자 인터페이스 구성요소는 네임에 시각적으로 표시되는 해당 텍스트를 포함해야 한다.' },
      { id: '2.5.4', title: '동작기반 작동', description: '동작기반으로 작동하는 기능은 사용자 인터페이스 구성요소로 조작할 수 있고, 동작기반 기능을 비활성화할 수 있어야 한다.' },
    ],
  },
  {
    id: '3',
    title: '이해의 용이성 (Understandable)',
    description: '콘텐츠는 이해할 수 있어야 한다.',
    criteria: [
      { id: '3.1.1', title: '기본 언어 표시', description: '주로 사용하는 언어를 명시해야 한다.' },
      { id: '3.2.1', title: '사용자 요구에 따른 실행', description: '사용자가 의도하지 않은 기능(새 창, 초점에 의한 맥락 변화 등)은 실행되지 않아야 한다.' },
      { id: '3.2.2', title: '찾기 쉬운 도움 정보', description: '도움 정보가 제공되는 경우, 각 페이지에서 동일한 상대적인 순서로 접근할 수 있어야 한다.' },
      { id: '3.3.1', title: '오류 정정', description: '입력 오류를 정정할 수 있는 방법을 제공해야 한다.' },
      { id: '3.3.2', title: '레이블 제공', description: '사용자 입력에는 대응하는 레이블을 제공해야 한다.' },
      { id: '3.3.3', title: '접근 가능한 인증', description: '인증 과정은 인지 기능 테스트에만 의존해서는 안 된다.' },
      { id: '3.3.4', title: '반복 입력 정보', description: '반복되는 입력 정보는 자동 입력 또는 선택 입력할 수 있어야 한다.' },
    ],
  },
  {
    id: '4',
    title: '견고성 (Robust)',
    description: '웹 콘텐츠는 미래의 기술로도 접근할 수 있도록 견고하게 만들어야 한다.',
    criteria: [
      { id: '4.1.1', title: '마크업 오류 방지', description: '마크업 언어의 요소는 열고 닫음, 중첩 관계 및 속성 선언에 오류가 없어야 한다.' },
      { id: '4.2.1', title: '웹 애플리케이션 접근성 준수', description: '콘텐츠에 포함된 웹 애플리케이션은 접근성이 있어야 한다.' },
    ],
  },
];

function getElementDescription(element: string | ElementDescription | undefined): string {
  if (!element) return '';
  if (typeof element === 'string') return element;
  return `${element.tagName} (${element.selector})`;
}

function getGradeColor(grade: string): string {
  const colors = {
    A: '#16a34a',
    B: '#0284c7',
    C: '#f59e0b',
    D: '#f97316',
    F: '#dc2626',
  };
  return colors[grade as keyof typeof colors] || '#64748b';
}

function formatExportDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[:.]/g, '-');
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function summarizePrincipleCoverage(issues: AccessibilityIssue[]): Record<string, number> {
  const summary: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    unknown: 0,
  };

  for (const issue of issues) {
    const criteria = (issue.wcagCriteria || '').trim();
    if (!criteria) {
      summary.unknown += 1;
      continue;
    }

    const principleId = criteria.split('.')[0] || 'unknown';
    if (Object.prototype.hasOwnProperty.call(summary, principleId)) {
      summary[principleId] += 1;
    } else {
      summary.unknown += 1;
    }
  }

  return summary;
}

function toDomId(prefix: string, value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.length > 0 ? `${prefix}-${normalized}` : `${prefix}-item`;
}

export function buildAccessibilityReportCsv(report: AccessibilityReport): string {
  const categoryLabelById = new Map(report.categories.map((category) => [category.category, category.label]));
  const headers = [
    'url',
    'timestamp',
    'totalScore',
    'grade',
    'krdsCompliant',
    'category',
    'categoryLabel',
    'severity',
    'rule',
    'message',
    'suggestion',
    'element',
    'wcagCriteria',
    'krdsCriteria',
  ];

  const rows: string[][] = [];

  for (const category of report.categories) {
    for (const issue of category.issues) {
      rows.push([
        report.url,
        String(report.timestamp),
        String(report.totalScore),
        report.grade,
        report.krdsCompliant ? 'true' : 'false',
        issue.category,
        categoryLabelById.get(issue.category) || issue.category,
        issue.severity,
        issue.rule,
        issue.message,
        issue.suggestion,
        getElementDescription(issue.element),
        issue.wcagCriteria || '',
        issue.krdsCriteria || '',
      ]);
    }
  }

  if (rows.length === 0) {
    rows.push([
      report.url,
      String(report.timestamp),
      String(report.totalScore),
      report.grade,
      report.krdsCompliant ? 'true' : 'false',
      '',
      '',
      '',
      '',
      'No issues detected',
      '',
      '',
      '',
      '',
    ]);
  }

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')),
  ].join('\n');
}

export function buildAccessibilityReportJson(report: AccessibilityReport): string {
  const payload = {
    metadata: {
      schemaVersion: '1.1.0',
      exportedAt: new Date().toISOString(),
      reportTimestamp: new Date(report.timestamp).toISOString(),
      sourceUrl: report.url,
      tool: 'KLIC-FrontScope Accessibility Checker',
    },
    report,
    checklistReference: KWCAG_REPORT_CHECKLIST,
  };

  return JSON.stringify(payload, null, 2);
}

export function buildAccessibilityReportHtml(report: AccessibilityReport): string {
  const gradeColor = getGradeColor(report.grade);
  const principleCoverage = summarizePrincipleCoverage(report.issues);

  const categorySections = report.categories.map((category) => {
    const categorySectionId = toDomId('category', category.category);

    const issueItems = category.issues.length === 0
      ? '<p class="empty-state">해당 카테고리에서 이슈가 발견되지 않았습니다.</p>'
      : category.issues.map((issue) => {
        const wcag = issue.wcagCriteria ? `<span class="chip">WCAG ${escapeHtml(issue.wcagCriteria)}</span>` : '';
        const krds = issue.krdsCriteria ? `<span class="chip">KRDS ${escapeHtml(issue.krdsCriteria)}</span>` : '';
        const element = getElementDescription(issue.element);

        return `
          <article class="issue issue-${escapeHtml(issue.severity)}">
            <header class="issue-header">
              <h4>${escapeHtml(issue.rule)}</h4>
              <span class="severity">${escapeHtml(issue.severity.toUpperCase())}</span>
            </header>
            <p>${escapeHtml(issue.message)}</p>
            <p class="suggestion"><strong>권장 조치:</strong> ${escapeHtml(issue.suggestion)}</p>
            ${element ? `<p class="element">${escapeHtml(element)}</p>` : ''}
            <div class="chips">${wcag}${krds}</div>
          </article>
        `;
      }).join('');

    return `
      <section id="${categorySectionId}" class="panel panel-nested" aria-labelledby="${categorySectionId}-title">
        <div class="panel-title-row">
          <h3 id="${categorySectionId}-title">${escapeHtml(category.label)}</h3>
          <span class="panel-score">${category.score}% (${category.passed}/${category.total})</span>
        </div>
        ${issueItems}
      </section>
    `;
  }).join('');

  const checklistSections = KWCAG_REPORT_CHECKLIST.map((principle) => {
    const principleSectionId = toDomId('principle', principle.id);
    const rows = principle.criteria.map((criterion) => `
      <tr>
        <td>${escapeHtml(criterion.id)}</td>
        <td>${escapeHtml(criterion.title)}</td>
        <td>${escapeHtml(criterion.description)}</td>
      </tr>
    `).join('');

    return `
      <section id="${principleSectionId}" class="panel panel-nested" aria-labelledby="${principleSectionId}-title">
        <div class="panel-title-row">
          <h3 id="${principleSectionId}-title">원칙 ${escapeHtml(principle.id)}. ${escapeHtml(principle.title)}</h3>
          <span class="panel-subtitle">${escapeHtml(principle.description)}</span>
        </div>
        <table class="criteria-table">
          <caption class="sr-only">원칙 ${escapeHtml(principle.id)} 평가 기준 표</caption>
          <thead>
            <tr>
              <th>ID</th>
              <th>항목명</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>접근성 검사 리포트</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f1f5f9;
      --text: #111827;
      --muted: #334155;
      --card: #ffffff;
      --line: #cbd5e1;
      --brand: #0f4c8c;
      --critical: #dc2626;
      --high: #f97316;
      --medium: #0ea5e9;
      --low: #6b7280;
      --info: #64748b;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Pretendard', 'Noto Sans KR', 'Segoe UI', sans-serif;
      background: radial-gradient(circle at top right, #dbeafe 0%, var(--bg) 42%);
      color: var(--text);
      line-height: 1.55;
    }

    .skip-link {
      position: absolute;
      left: 12px;
      top: -100px;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 16px;
      min-height: 44px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      line-height: 1.4;
    }
    .skip-link:focus {
      top: 12px;
      outline: 3px solid #f59e0b;
      outline-offset: 2px;
    }

    .hero-shell { padding: 24px 20px 12px; }
    .container { max-width: 1120px; margin: 0 auto; display: grid; gap: 20px; }
    .hero {
      background: linear-gradient(135deg, #0f4c8c 0%, #0b3a66 100%);
      color: #fff;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 16px 30px rgba(15, 76, 140, 0.2);
    }
    .hero h1 { margin: 0; font-size: 28px; letter-spacing: -0.02em; }
    .hero p { margin: 8px 0 0; opacity: 1; font-size: 16px; }

    .report-nav-shell { padding: 0 20px 12px; }
    .report-nav {
      max-width: 1120px;
      margin: 0 auto;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .report-nav a {
      display: inline-flex;
      align-items: center;
      padding: 12px 16px;
      min-height: 44px;
      border-radius: 999px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 600;
      text-decoration: none;
    }
    .report-nav a:hover {
      background: #dbeafe;
    }
    .report-nav a:focus-visible {
      outline: 3px solid #f59e0b;
      outline-offset: 2px;
    }

    main.container { padding: 0 20px 24px; }

    .score-grid {
      display: grid;
      grid-template-columns: 180px repeat(5, minmax(80px, 1fr));
      gap: 12px;
      margin-top: 20px;
      align-items: stretch;
    }
    .score-main,
    .score-item {
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 14px;
      text-align: center;
    }
    .score-main .value { font-size: 44px; font-weight: 700; line-height: 1; }
    .score-main .grade {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 10px;
      border-radius: 999px;
      background: ${gradeColor};
      color: #fff;
      font-weight: 700;
    }
    .score-item .label { font-size: 16px; opacity: 1; line-height: 1.4; }
    .score-item .value { margin-top: 6px; font-size: 26px; font-weight: 700; }

    .panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
    }
    .panel-nested {
      margin-top: 12px;
      border-color: #d9e2ec;
      box-shadow: none;
    }
    .panel-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .panel-title-row h2 { margin: 0; font-size: 20px; letter-spacing: -0.01em; }
    .panel-title-row h3 { margin: 0; font-size: 17px; }
    .panel-score { color: var(--muted); font-size: 16px; white-space: nowrap; line-height: 1.4; }
    .panel-subtitle { color: var(--muted); font-size: 16px; line-height: 1.4; }

    .coverage-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 10px;
    }
    .coverage-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      text-align: center;
      background: #f8fafc;
    }
    .coverage-item strong { display: block; font-size: 22px; }
    .coverage-item span { color: var(--muted); font-size: 16px; line-height: 1.4; }

    .issue {
      border: 1px solid var(--line);
      border-left-width: 4px;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      background: #fcfdff;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .issue h4 { margin: 0; font-size: 18px; line-height: 1.3; }
    .issue p { margin: 4px 0; color: #1f2937; font-size: 16px; line-height: 1.5; }
    .issue .suggestion { color: #0f172a; }
    .issue .element { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size: 16px; color: #334155; line-height: 1.4; }
    .issue-critical { border-left-color: var(--critical); }
    .issue-high { border-left-color: var(--high); }
    .issue-medium { border-left-color: var(--medium); }
    .issue-low { border-left-color: var(--low); }
    .issue-info { border-left-color: var(--info); }
    .severity {
      font-size: 16px;
      letter-spacing: 0.03em;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      color: #334155;
      background: #f8fafc;
      font-weight: 700;
      line-height: 1.4;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .chip {
      display: inline-flex;
      padding: 6px 10px;
      font-size: 16px;
      border-radius: 999px;
      background: #e8f1fd;
      border: 1px solid #c6dbf7;
      color: #0f4c8c;
      font-weight: 600;
      line-height: 1.4;
    }
    .empty-state {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
      padding: 4px 0;
    }

    .criteria-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
    }
    .criteria-table th,
    .criteria-table td {
      border-bottom: 1px solid var(--line);
      padding: 10px;
      text-align: left;
      font-size: 16px;
      vertical-align: top;
      line-height: 1.5;
    }
    .criteria-table th {
      background: #eff6ff;
      color: #1e3a8a;
      font-weight: 700;
    }
    .criteria-table tbody tr:nth-child(even) {
      background: #fbfdff;
    }
    .criteria-table td:first-child { width: 90px; white-space: nowrap; font-weight: 700; color: #1d4ed8; }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
      white-space: nowrap;
    }

    .footer {
      max-width: 1120px;
      margin: 0 auto;
      color: var(--muted);
      font-size: 16px;
      text-align: right;
      padding: 12px 22px 32px;
      line-height: 1.4;
    }

    @media (max-width: 960px) {
      .score-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
      .score-main { grid-column: 1 / -1; }
      .coverage-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
      .hero-shell,
      .report-nav-shell,
      main.container,
      .footer { padding-left: 14px; padding-right: 14px; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#report-main">본문으로 건너뛰기</a>

  <header class="hero-shell">
    <section class="hero" aria-labelledby="report-title">
      <h1 id="report-title">접근성 검사 리포트</h1>
      <p>${escapeHtml(new Date(report.timestamp).toLocaleString('ko-KR'))} · ${escapeHtml(report.url)}</p>
      <div class="score-grid" aria-label="점수 요약">
        <article class="score-main" aria-label="총점과 등급">
          <div class="value">${report.totalScore}</div>
          <div class="grade">${escapeHtml(report.grade)}</div>
        </article>
        <article class="score-item" aria-label="Critical 이슈 ${report.summary.critical}건"><div class="label">Critical</div><div class="value">${report.summary.critical}</div></article>
        <article class="score-item" aria-label="High 이슈 ${report.summary.high}건"><div class="label">High</div><div class="value">${report.summary.high}</div></article>
        <article class="score-item" aria-label="Medium 이슈 ${report.summary.medium}건"><div class="label">Medium</div><div class="value">${report.summary.medium}</div></article>
        <article class="score-item" aria-label="Low 이슈 ${report.summary.low}건"><div class="label">Low</div><div class="value">${report.summary.low}</div></article>
        <article class="score-item" aria-label="Info 이슈 ${report.summary.info}건"><div class="label">Info</div><div class="value">${report.summary.info}</div></article>
      </div>
    </section>
  </header>

  <nav class="report-nav-shell" aria-label="리포트 탐색">
    <div class="report-nav">
      <a href="#report-summary">원칙별 요약</a>
      <a href="#report-categories">카테고리 이슈</a>
      <a href="#report-checklist">평가 기준 참고표</a>
    </div>
  </nav>

  <main id="report-main" class="container">
    <section id="report-summary" class="panel" aria-labelledby="report-summary-title">
      <div class="panel-title-row">
        <h2 id="report-summary-title">원칙별 이슈 분포</h2>
        <span class="panel-subtitle">WCAG 기준 번호의 첫 자리 기준 집계</span>
      </div>
      <div class="coverage-grid">
        <div class="coverage-item"><strong>${principleCoverage['1']}</strong><span>원칙 1 인식</span></div>
        <div class="coverage-item"><strong>${principleCoverage['2']}</strong><span>원칙 2 운용</span></div>
        <div class="coverage-item"><strong>${principleCoverage['3']}</strong><span>원칙 3 이해</span></div>
        <div class="coverage-item"><strong>${principleCoverage['4']}</strong><span>원칙 4 견고성</span></div>
        <div class="coverage-item"><strong>${principleCoverage.unknown}</strong><span>분류 외</span></div>
      </div>
    </section>

    <section id="report-categories" class="panel" aria-labelledby="report-categories-title">
      <div class="panel-title-row">
        <h2 id="report-categories-title">카테고리 상세 이슈</h2>
        <span class="panel-subtitle">카테고리별 규칙 위반과 권장 조치</span>
      </div>
      ${categorySections}
    </section>

    <section id="report-checklist" class="panel" aria-labelledby="report-checklist-title">
      <div class="panel-title-row">
        <h2 id="report-checklist-title">평가 기준 참고표</h2>
        <span class="panel-subtitle">사용자 제공 항목 기반 정리</span>
      </div>
      <p class="empty-state">자동 스캔 결과 해석 시 아래 기준을 함께 참고하세요.</p>
      ${checklistSections}
    </section>
  </main>

  <footer class="footer">
    Generated by KLIC-FrontScope Accessibility Checker
  </footer>
</body>
</html>`;
}

function buildExportFile(report: AccessibilityReport, format: AccessibilityExportFormat): ExportFile {
  const suffix = formatExportDate(report.timestamp);
  const baseName = `accessibility-report-${suffix}`;

  if (format === 'json') {
    return {
      filename: `${baseName}.json`,
      content: buildAccessibilityReportJson(report),
      mimeType: 'application/json',
    };
  }

  if (format === 'csv') {
    return {
      filename: `${baseName}.csv`,
      content: buildAccessibilityReportCsv(report),
      mimeType: 'text/csv;charset=utf-8',
    };
  }

  return {
    filename: `${baseName}.html`,
    content: buildAccessibilityReportHtml(report),
    mimeType: 'text/html;charset=utf-8',
  };
}

export function useAccessibilityReport(report: AccessibilityReport | null) {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = useCallback((format: AccessibilityExportFormat) => {
    if (!report) {
      return;
    }

    setIsExporting(true);

    try {
      const file = buildExportFile(report, format);
      downloadText(file.content, file.filename, file.mimeType);
    } finally {
      setIsExporting(false);
    }
  }, [report]);

  return {
    isExporting,
    exportReport,
    exportFormats: EXPORT_FORMATS,
  };
}
