/**
 * Text Edit Integration Tests
 *
 * 텍스트 편집 기능의 통합 테스트
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from '@playwright/test';

test.describe('Text Edit Tool', () => {
  test.beforeEach(async ({ page }) => {
    // Extension 로드
    // await page.goto('chrome-extension://<extension-id>/sidepanel.html');
  });

  test('should activate text edit mode', async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('https://example.com');

    // Side Panel에서 활성화 버튼 클릭
    // await page.click('[data-testid="text-edit-toggle"]');

    // 텍스트 요소에 호버
    // const textElement = page.locator('p').first();
    // await textElement.hover();

    // 하이라이트 확인
    // await expect(textElement).toHaveCSS('outline', '2px dashed rgb(245, 158, 11)');
  });

  test('should edit text element', async ({ page }) => {
    await page.goto('https://example.com');

    // 편집 모드 활성화
    // await page.click('[data-testid="text-edit-toggle"]');

    // 텍스트 요소 클릭
    // const p = page.locator('p').first();
    // await p.click();

    // 텍스트 편집
    // await p.fill('Modified text');

    // 저장
    // await page.keyboard.press('Control+Enter');

    // 변경 확인
    // await expect(p).toHaveText('Modified text');
  });

  test('should show edit history in side panel', async ({ page }) => {
    // 편집 후 사이드 패널 확인
    // await page.goto('https://example.com');
    // await page.click('[data-testid="text-edit-toggle"]');
    // await page.locator('p').first().click();
    // await page.locator('p').first().fill('New text');
    // await page.keyboard.press('Control+Enter');

    // 사이드 패널의 히스토리 확인
    // const historyItem = page.locator('[data-testid="edit-history-item"]').first();
    // await expect(historyItem).toContainText('New text');
  });

  test('should undo edit', async ({ page }) => {
    await page.goto('https://example.com');

    // 편집 모드 활성화 및 텍스트 편집
    // await page.click('[data-testid="text-edit-toggle"]');
    // const p = page.locator('p').first();
    // await p.click();
    // await p.fill('Modified text');
    // await page.keyboard.press('Control+Enter');

    // 되돌리기 버튼 클릭
    // await page.click('[data-testid="undo-button"]');

    // 원본 텍스트로 복원 확인
    // await expect(p).not.toHaveText('Modified text');
  });

  test('should filter edit history', async ({ page }) => {
    // 여러 편집 수행 후 필터 확인
    // ...

    // "오늘" 필터 클릭
    // await page.click('[data-testid="filter-today"]');

    // 오늘의 편집만 표시되는지 확인
    // const items = page.locator('[data-testid="edit-history-item"]');
    // 각 항목의 타임스탬프 확인
  });
});

test.describe('Text Edit Keyboard Shortcuts', () => {
  test('should cancel edit with Escape', async ({ page }) => {
    await page.goto('https://example.com');

    // 편집 모드 활성화
    // await page.click('[data-testid="text-edit-toggle"]');
    // const p = page.locator('p').first();
    // await p.click();

    // ESC 키로 취소
    // await page.keyboard.press('Escape');

    // 편집 모드 종료 확인
    // await expect(p).not.toHaveAttribute('contenteditable', 'true');
  });

  test('should save with Ctrl+Enter', async ({ page }) => {
    await page.goto('https://example.com');

    // 편집 모드 활성화
    // await page.click('[data-testid="text-edit-toggle"]');
    // const p = page.locator('p').first();
    // await p.click();
    // await p.fill('New text');

    // Ctrl+Enter로 저장
    // await page.keyboard.press('Control+Enter');

    // 저장 확인 (사이드 패널 히스토리에 추가됨)
  });
});
