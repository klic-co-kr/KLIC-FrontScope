/**
 * Animation Export
 *
 * 애니메이션 데이터 내보내기 기능 제공
 */

import { AnimationInfo, CSSAnimation, JSAnimation } from '../../../types/resourceNetwork';

/**
 * 애니메이션 내보내기 데이터
 */
export interface AnimationExport {
  timestamp: number;
  url: string;
  pageTitle: string;
  totalAnimations: number;
  cssAnimations: number;
  jsAnimations: number;
  animations: Array<{
    id: string;
    type: string;
    element: string;
    duration: number;
    delay: number;
    iterationCount: number | 'infinite';
    timingFunction: string;
    performanceImpact: string;
  }>;
  performance: {
    score: number;
    grade: string;
    recommendations: string[];
  };
}

/**
 * 애니메이션 내보내기
 */
export function exportAnimations(
  animations: AnimationInfo[],
  performanceReport?: {
    score: number;
    recommendations: string[];
  }
): AnimationExport {
  const cssAnimations = animations.filter((a) => a.type === 'css');
  const jsAnimations = animations.filter((a) => a.type === 'js');

  return {
    timestamp: Date.now(),
    url: window.location.href,
    pageTitle: document.title,
    totalAnimations: animations.length,
    cssAnimations: cssAnimations.length,
    jsAnimations: jsAnimations.length,
    animations: animations.map((anim) => ({
      id: anim.id,
      type: anim.type,
      element: anim.type === 'css' ? (anim as CSSAnimation).element : 'window',
      duration: anim.type === 'css' ? (anim as CSSAnimation).duration : 0,
      delay: anim.type === 'css' ? (anim as CSSAnimation).delay : 0,
      iterationCount:
        anim.type === 'css' ? (anim as CSSAnimation).iterationCount ?? 1 : 1,
      timingFunction:
        anim.type === 'css' ? (anim as CSSAnimation).timingFunction ?? 'linear' : 'N/A',
      performanceImpact: anim.affectsPerformance,
    })),
    performance: (performanceReport || {
      score: 0,
      grade: 'N/A',
      recommendations: [] as string[],
    }) as { score: number; grade: string; recommendations: string[] },
  };
}

/**
 * JSON 파일로 다운로드
 */
export function downloadAnimationExport(exp: AnimationExport): void {
  const blob = new Blob([JSON.stringify(exp, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `animation-export-${new Date(exp.timestamp)
    .toISOString()
    .replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * HTML 보고서 생성
 */
export function generateAnimationReport(
  animations: AnimationInfo[],
  performanceReport?: {
    score: number;
    recommendations: string[];
  }
): string {
  const exp = exportAnimations(animations, performanceReport);

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A':
        return '#10B981';
      case 'B':
        return '#3B82F6';
      case 'C':
        return '#F59E0B';
      case 'D':
        return '#EF4444';
      case 'F':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const gradeColor = getGradeColor(exp.performance.grade);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>애니메이션 분석 보고서</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
      color: white;
      padding: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .meta {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f3f4f6;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: 700;
      color: #3B82F6;
    }
    .summary-card .label {
      color: #6B7280;
      font-size: 14px;
      margin-top: 5px;
    }
    .grade {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      font-size: 36px;
      font-weight: 700;
      color: white;
      background: ${gradeColor};
    }
    .section {
      padding: 30px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .recommendations {
      list-style: none;
    }
    .recommendations li {
      padding: 12px 16px;
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #6B7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:hover {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge.high { background: #FEE2E2; color: #DC2626; }
    .badge.medium { background: #FEF3C7; color: #D97706; }
    .badge.low { background: #D1FAE5; color: #059669; }
    .badge.css { background: #DBEAFE; color: #1D4ED8; }
    .badge.js { background: #EDE9FE; color: #7C3AED; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>애니메이션 분석 보고서</h1>
      <div class="meta">
        <p><strong>URL:</strong> ${exp.url}</p>
        <p><strong>생성일:</strong> ${new Date(exp.timestamp).toLocaleString('ko-KR')}</p>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${exp.totalAnimations}</div>
        <div class="label">전체 애니메이션</div>
      </div>
      <div class="summary-card">
        <div class="value">${exp.cssAnimations}</div>
        <div class="label">CSS 애니메이션</div>
      </div>
      <div class="summary-card">
        <div class="value">${exp.jsAnimations}</div>
        <div class="label">JS 애니메이션</div>
      </div>
      <div class="summary-card">
        <div class="grade">${exp.performance.grade}</div>
        <div class="label">성능 등급</div>
      </div>
    </div>

    <div class="section">
      <h2>권장사항</h2>
      <ul class="recommendations">
        ${exp.performance.recommendations
          .map((r) => `<li>${r}</li>`)
          .join('')}
      </ul>
    </div>

    <div class="section">
      <h2>애니메이션 목록</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>타입</th>
            <th>요소</th>
            <th>지속시간</th>
            <th>지연</th>
            <th>반복</th>
            <th>성능 영향</th>
          </tr>
        </thead>
        <tbody>
          ${exp.animations
            .map(
              (anim) => `
            <tr>
              <td><code>${anim.id}</code></td>
              <td><span class="badge ${anim.type}">${anim.type}</span></td>
              <td><code>${anim.element}</code></td>
              <td>${anim.duration}ms</td>
              <td>${anim.delay}ms</td>
              <td>${anim.iterationCount}</td>
              <td><span class="badge ${anim.performanceImpact}">${anim.performanceImpact}</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

/**
 * HTML 보고서 다운로드
 */
export function downloadAnimationReport(
  animations: AnimationInfo[],
  performanceReport?: {
    score: number;
    recommendations: string[];
  }
): void {
  const html = generateAnimationReport(animations, performanceReport);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `animation-report-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV로 내보내기
 */
export function exportAnimationsToCsv(animations: AnimationInfo[]): string {
  const headers = [
    'ID',
    'Type',
    'Element',
    'Duration',
    'Delay',
    'Iteration Count',
    'Timing Function',
    'Performance Impact',
  ];

  const rows = animations.map((anim) => {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;
      return [
        cssAnim.id,
        'CSS',
        cssAnim.element,
        cssAnim.duration.toString(),
        cssAnim.delay.toString(),
        (cssAnim.iterationCount ?? 1).toString(),
        cssAnim.timingFunction,
        cssAnim.affectsPerformance,
      ].join(',');
    } else {
      const jsAnim = anim as JSAnimation;
      return [
        jsAnim.id,
        'JS',
        'window',
        '0',
        '0',
        '1',
        'N/A',
        jsAnim.affectsPerformance,
      ].join(',');
    }
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * CSV 다운로드
 */
export function downloadAnimationCsv(animations: AnimationInfo[]): void {
  const csv = exportAnimationsToCsv(animations);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `animation-export-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 클립보드에 복사
 */
export async function copyAnimationsToClipboard(
  animations: AnimationInfo[],
  format: 'json' | 'csv' = 'json'
): Promise<boolean> {
  try {
    let text = '';

    if (format === 'json') {
      const exp = exportAnimations(animations);
      text = JSON.stringify(exp, null, 2);
    } else {
      text = exportAnimationsToCsv(animations);
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 간단한 텍스트 요약 생성
 */
export function generateAnimationSummary(
  animations: AnimationInfo[],
  performanceReport?: {
    score: number;
    recommendations: string[];
  }
): string {
  const cssCount = animations.filter((a) => a.type === 'css').length;
  const jsCount = animations.filter((a) => a.type === 'js').length;
  const highImpact = animations.filter((a) => a.affectsPerformance === 'high').length;

  let summary = `애니메이션 분석 요약
==================
URL: ${window.location.href}
분석 시간: ${new Date().toLocaleString('ko-KR')}

전체 애니메이션: ${animations.length}개
- CSS: ${cssCount}개
- JS: ${jsCount}개

성능 영향:
- 높음: ${highImpact}개
- 중간: ${animations.filter((a) => a.affectsPerformance === 'medium').length}개
- 낮음: ${animations.filter((a) => a.affectsPerformance === 'low').length}개
`;

  if (performanceReport) {
    const grade = 'grade' in performanceReport ? performanceReport.grade : 'N/A';
    summary += `\n성능 점수: ${performanceReport.score}/100 (${grade}등급)\n`;
    if (performanceReport.recommendations.length > 0) {
      summary += '\n권장사항:\n';
      performanceReport.recommendations.forEach((r, i) => {
        summary += `${i + 1}. ${r}\n`;
      });
    }
  }

  return summary;
}
