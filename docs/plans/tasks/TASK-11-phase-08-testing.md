# Phase 8: 테스트

**태스크 범위**: Task #11.50 ~ #11.53 (4개)
**예상 시간**: 3시간
**의존성**: 모든 Phase 완료

---

## Task #11.50: 단위 테스트

- **파일**: `src/utils/gridLayout/__tests__/gridLayout.test.ts`
- **시간**: 2시간
- **의존성**: 모든 유틸리티 태스크
- **상세 내용**:
```typescript
import { describe, it, expect } from 'vitest';
import { createHorizontalGuide, createVerticalGuide } from '../guideLines/createGuideLine';
import { moveGuideLine, toggleGuideVisibility } from '../guideLines/positionGuide';
import { createViewportStateFromPreset } from '../viewport/viewportCalculator';
import { getCurrentBreakpoint } from '../viewport/breakpointDetector';
import { calculateColumnPositions } from '../grid/gridCalculator';

describe('Grid Layout - Guide Lines', () => {
  it('should create horizontal guide line', () => {
    const guide = createHorizontalGuide(500);
    expect(guide.type).toBe('horizontal');
    expect(guide.position).toBe(500);
    expect(guide.visible).toBe(true);
  });

  it('should create vertical guide line', () => {
    const guide = createVerticalGuide(500);
    expect(guide.type).toBe('vertical');
    expect(guide.position).toBe(500);
  });

  it('should move guide line', () => {
    const guide = createVerticalGuide(500);
    const moved = moveGuideLine(guide, 600);
    expect(moved.position).toBe(600);
  });

  it('should toggle guide visibility', () => {
    const guide = createVerticalGuide(500);
    expect(guide.visible).toBe(true);
    const toggled = toggleGuideVisibility(guide);
    expect(toggled.visible).toBe(false);
  });
});

describe('Grid Layout - Viewport', () => {
  it('should create viewport state from preset', () => {
    const preset = {
      id: 'test',
      name: 'Test',
      category: 'desktop',
      width: 1920,
      height: 1080,
      icon: '🖥️',
    };
    const state = createViewportStateFromPreset(preset);
    expect(state.customWidth).toBe(1920);
    expect(state.customHeight).toBe(1080);
    expect(state.orientation).toBe('landscape');
  });

  it('should detect current breakpoint', () => {
    expect(getCurrentBreakpoint(500)).toBe('sm');
    expect(getCurrentBreakpoint(700)).toBe('md');
    expect(getCurrentBreakpoint(1000)).toBe('lg');
    expect(getCurrentBreakpoint(1300)).toBe('xl');
    expect(getCurrentBreakpoint(1600)).toBe('2xl');
  });
});

describe('Grid Layout - Grid Calculator', () => {
  it('should calculate column positions', () => {
    const positions = calculateColumnPositions(1200, 12, 24, 24);
    expect(positions).toHaveLength(12);
    expect(positions[0].startX).toBe(24);
    expect(positions[11].endX).toBeLessThanOrEqual(1200 - 24);
  });
});
```
- **테스트 항목**:
  - 가이드라인 생성, 이동, 표시/숨김, 잠금, 스타일 변경
  - 뷰포트 상태 계산, 회전, 줌, 리사이징
  - 브레이크포인트 감지
  - 그리드 컬럼 계산
  - 화이트스페이스 패턴 생성
  - 스냅 시스템
- **완료 조건**: 80% 이상 테스트 커버리지

---

## Task #11.51: 통합 테스트

- **파일**: `src/components/GridLayout/__tests__/integration.test.tsx`
- **시간**: 40분
- **의존성**: 모든 컴포넌트 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GridLayoutPanel } from '../GridLayoutPanel';
import { useGuideLines } from '../../../hooks/gridLayout/useGuideLines';
import { useViewport } from '../../../hooks/gridLayout/useViewport';
import { useGridOverlay } from '../../../hooks/gridLayout/useGridOverlay';

// Mock hooks
vi.mock('../../../hooks/gridLayout/useGuideLines');
vi.mock('../../../hooks/gridLayout/useViewport');
vi.mock('../../../hooks/gridLayout/useGridOverlay');

describe('Grid Layout Panel - Integration', () => {
  const mockGuides = {
    guides: [],
    showOnHover: false,
    addHorizontalGuide: vi.fn(),
    addVerticalGuide: vi.fn(),
    clearAllGuides: vi.fn(),
  } as any;

  const mockViewport = {
    viewport: {
      preset: null,
      customWidth: 1280,
      customHeight: 720,
      orientation: 'landscape' as const,
      zoom: 1,
    },
    rotate: vi.fn(),
    setZoom: vi.fn(),
    resize: vi.fn(),
  } as any;

  const mockGrid = {
    settings: {
      enabled: false,
      columns: 12,
      gap: 24,
      margin: '1.5rem',
      maxWidth: '1280px',
      color: '#3B82F6',
      opacity: 0.5,
      style: 'solid' as const,
      showColumnNumbers: true,
    },
    toggle: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useGuideLines as any).mockReturnValue(mockGuides);
    (useViewport as any).mockReturnValue(mockViewport);
    (useGridOverlay as any).mockReturnValue(mockGrid);
  });

  it('should render panel with tabs', () => {
    render(<GridLayoutPanel />);

    expect(screen.getByText('그리드 & 레이아웃')).toBeInTheDocument();
    expect(screen.getByText('가이드라인 (0)')).toBeInTheDocument();
    expect(screen.getByText('뷰포트')).toBeInTheDocument();
    expect(screen.getByText('그리드')).toBeInTheDocument();
    expect(screen.getByText('화이트스페이스')).toBeInTheDocument();
  });

  it('should switch tabs', async () => {
    render(<GridLayoutPanel />);

    const guidesTab = screen.getByText('가이드라인 (0)');
    const viewportTab = screen.getByText('뷰포트');

    fireEvent.click(viewportTab);

    await waitFor(() => {
      expect(viewportTab).toHaveClass('active');
    });
  });

  it('should call grid toggle when quick action clicked', async () => {
    render(<GridLayoutPanel />);

    const gridButton = screen.getByTitle('그리드 토글 (Ctrl+G)');
    fireEvent.click(gridButton);

    expect(mockGrid.toggle).toHaveBeenCalled();
  });

  it('should display viewport information', () => {
    render(<GridLayoutPanel />);

    expect(screen.getByText('1280 × 720')).toBeInTheDocument();
    expect(screen.getByText('↔ 가로')).toBeInTheDocument();
  });
});
```

---

## Task #11.52: E2E 테스트 (Playwright)

- **파일**: `e2e/gridLayout.spec.ts`
- **시간**: 30분
- **의존성**: 전체 구현 완료
- **상세 내용**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Grid Layout Tool', () => {
  test.beforeEach(async ({ page }) => {
    // Extension 로드
    // 테스트 페이지 접속
    await page.goto('https://example.com');
  });

  test('should open grid layout panel', async ({ page }) => {
    // Side Panel 오픈
    // TODO: Extension 아이콘 클릭 또는 단축키

    // 그리드 패널 확인
    // await expect(page.locator('.grid-layout-panel')).toBeVisible();
  });

  test('should add horizontal guide line', async ({ page }) => {
    // 가이드라인 탭 선택
    // await page.click('text=가이드라인');

    // 수평 가이드라인 추가 버튼 클릭
    // await page.click('text=수평 가이드라인');

    // 가이드라인이 생성되었는지 확인
    // await expect(page.locator('.guide-line-horizontal')).toHaveCount(1);
  });

  test('should switch viewport preset', async ({ page }) => {
    // 뷰포트 탭 선택
    // await page.click('text=뷰포트');

    // 모바일 카테고리 선택
    // await page.click('text=📱 모바일');

    // iPhone SE 프리셋 선택
    // await page.click('text=iPhone SE');

    // 뷰포트 정보 확인
    // await expect(page.locator('.viewport-info')).toContainText('375×667');
  });

  test('should toggle grid overlay', async ({ page }) => {
    // 그리드 탭 선택
    // await page.click('text=그리드');

    // 그리드 토글 버튼 클릭
    // await page.click('[title="그리드 토글 (Ctrl+G)"]');

    // 그리드 오버레이 확인
    // await expect(page.locator('#grid-overlay-container')).toBeVisible();
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    // Ctrl+G로 그리드 토글
    // await page.keyboard.press('Control+g');

    // 변경 사항 확인
    // await expect(page.locator('.grid-overlay-container')).toBeVisible();
  });
});
```

---

## Task #11.53: 사용자 인터랙션 테스트

- **파일**: `e2e/gridLayout-interactions.spec.ts`
- **시간**: 30분
- **의존성**: 전체 구현 완료
- **상세 내용**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Grid Layout - User Interactions', () => {
  test('should drag guide line to new position', async ({ page }) => {
    await page.goto('https://example.com');

    // 가이드라인 추가
    // 수직 가이드라인을 500px 위치에 추가

    // 드래그 시작
    // const guide = page.locator('.guide-line-vertical').first();
    // await guide.dragTo(page, { x: 700, y: 0 });

    // 새 위치 확인
    // await expect(guide).toHaveCSS('left', '700px');
  });

  test('should snap guide line to grid', async ({ page }) => {
    // 그리드 활성화
    // 가이드라인 추가

    // 스냅 기능이 켜짐 상태에서 가이드라인 드래그

    // 가장 가까운 그리드 라인에 스냅되었는지 확인
    // await expect(guide).toHaveCSS('left', /grid-column-position/);
  });

  test('should lock and unlock guide line', async ({ page }) => {
    // 가이드라인 추가

    // 더블클릭으로 잠금
    // await page.locator('.guide-line').first().dblclick();

    // 잠금 상태 확인
    // await expect(guide).toHaveClass('locked');

    // 드래그 시도 (잠금으로 인해 실패해야 함)

    // 다시 더블클릭으로 잠금 해제
    // await page.locator('.guide-line').first().dblclick();

    // 잠금 해제 확인
    // await expect(guide).not.toHaveClass('locked');
  });

  test('should resize viewport with handles', async ({ page }) => {
    // 뷰포트 편집 모드 활성화

    // 우측 핸들 드래그
    // const handle = page.locator('.resize-handle-e');
    // await handle.dragTo(page, { x: 200, y: 0 });

    // 새 크기 확인
    // await expect(page.locator('.viewport-info')).toContainText(/1480×720/);
  });

  test('should export and import settings', async ({ page }) => {
    // 설정 메뉴 열기

    // 내보내기 클릭
    // await page.click('text=내보내기');

    // 다운로드 확인

    // 가져오기 클릭
    // 파일 선택 및 업로드

    // 설정이 적용되었는지 확인
  });
});
```

---

**전체 완료 후**: 모든 태스크 완료 및 릴리스 준비
