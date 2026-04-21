import { describe, expect, it } from 'vitest';
import { validateHtml } from '../htmlValidator';

function createDocument(markup: string): Document {
  return new DOMParser().parseFromString(markup, 'text/html');
}

function findRuleCount(markup: string, rule: string): number {
  const result = validateHtml(createDocument(markup));
  return result.issues.filter((issue) => issue.rule === rule).length;
}

describe('htmlValidator accessible text rules', () => {
  it('does not flag image link when nested img has alt text', () => {
    const markup = `
      <html lang="ko">
        <body>
          <a href="https://example.com/news">
            <img src="https://s.pstatic.net/static/www/mobile/edit/20260130_1095/upload_1769735303912LzmMR.png" height="19" alt="2026 밀라노 올림픽">
          </a>
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'a[text]')).toBe(0);
    expect(findRuleCount(markup, 'img[alt]')).toBe(0);
  });

  it('accepts aria-labelledby as link accessible name', () => {
    const markup = `
      <html lang="ko">
        <body>
          <span id="headline-link-name">헤드라인 상세 보기</span>
          <a href="/headline" aria-labelledby="headline-link-name">
            <img src="headline.png" alt="">
          </a>
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'a[text]')).toBe(0);
  });

  it('flags link when no accessible name is available', () => {
    const markup = `
      <html lang="ko">
        <body>
          <a href="/icon-only"><img src="icon.png" alt=""></a>
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'a[text]')).toBe(1);
  });

  it('does not evaluate links hidden via CSS display none', () => {
    const markup = `
      <html lang="ko">
        <body>
          <div style="display:none">
            <a href="/hidden-link"></a>
          </div>
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'a[text]')).toBe(0);
  });

  it('does not count text hidden with display none as link accessible name', () => {
    const markup = `
      <html lang="ko">
        <body>
          <a href="/only-hidden-text"><span style="display:none">숨김 텍스트</span></a>
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'a[text]')).toBe(1);
  });

  it('does not flag presentational images without alt', () => {
    const markup = `
      <html lang="ko">
        <body>
          <img src="decorative.png" role="presentation">
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'img[alt]')).toBe(0);
  });

  it('flags non-presentational images without any text alternative', () => {
    const markup = `
      <html lang="ko">
        <body>
          <img src="content.png">
        </body>
      </html>
    `;

    expect(findRuleCount(markup, 'img[alt]')).toBe(1);
  });
});
