# Phase 2: 가이드라인 시스템

**태스크 범위**: Task #11.9 ~ #11.15 (7개)
**예상 시간**: 3시간
**의존성**: Phase 1 완료

---

## Task #11.9: 가이드라인 생성 유틸리티

- **파일**: `src/utils/gridLayout/guideLines/createGuideLine.ts`
- **시간**: 25분
- **의존성**: Task #11.1, #11.8
- **상세 내용**:
```typescript
import { GuideLine, GuideLineOrientation } from '../../../types/gridLayout';
import { generateGuideLineId, isValidGuideLinePosition } from '../helpers';

/**
 * 수평 가이드라인 생성
 */
export function createHorizontalGuide(
  position: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine {
  return {
    id: generateGuideLineId(),
    type: 'horizontal',
    position: Math.max(0, Math.min(position, window.innerHeight)),
    color: options?.color || '#FF3366',
    width: options?.width || 2,
    style: options?.style || 'dashed',
    locked: false,
    visible: true,
  };
}

/**
 * 수직 가이드라인 생성
 */
export function createVerticalGuide(
  position: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine {
  return {
    id: generateGuideLineId(),
    type: 'vertical',
    position: Math.max(0, Math.min(position, window.innerWidth)),
    color: options?.color || '#FF3366',
    width: options?.width || 2,
    style: options?.style || 'dashed',
    locked: false,
    visible: true,
  };
}

/**
 * 다중 가이드라인 생성 (균등 분배)
 */
export function createDistributedGuides(
  type: GuideLineOrientation,
  start: number,
  end: number,
  count: number
): GuideLine[] {
  const guides: GuideLine[] = [];
  const step = (end - start) / (count - 1);

  for (let i = 0; i < count; i++) {
    const position = start + (step * i);
    guides.push(createVerticalGuide(position)); // 또는 createHorizontalGuide
  }

  return guides;
}

/**
 * 중앙 가이드라인 생성
 */
export function createCenterGuides(width: number, height: number): GuideLine[] {
  return [
    createVerticalGuide(width / 2, { style: 'solid', color: '#4ECDC4' }),
    createHorizontalGuide(height / 2, { style: 'solid', color: '#4ECDC4' }),
  ];
}

/**
 * 삼분할 가이드라인 생성
 */
export function createThirdsGuides(width: number, height: number): GuideLine[] {
  const guides: GuideLine[] = [];

  // 수직 3분할
  for (let i = 1; i < 3; i++) {
    guides.push(createVerticalGuide((width / 3) * i));
  }

  // 수평 3분할
  for (let i = 1; i < 3; i++) {
    guides.push(createHorizontalGuide((height / 3) * i));
  }

  return guides;
}
```
- **완료 조건**: 모든 생성 함수 정상 작동

---

## Task #11.10: 가이드라인 위치 조작

- **파일**: `src/utils/gridLayout/guideLines/positionGuide.ts`
- **시간**: 25분
- **의존성**: Task #11.1, #11.8
- **상세 내용**:
```typescript
import { GuideLine } from '../../../types/gridLayout';

/**
 * 가이드라인 위치 이동
 */
export function moveGuideLine(
  guide: GuideLine,
  newPosition: number,
  maxDimension?: number
): GuideLine {
  const maxPos = maxDimension ?? (guide.type === 'horizontal' ? window.innerHeight : window.innerWidth);
  const clampedPosition = Math.max(0, Math.min(newPosition, maxPos));

  return {
    ...guide,
    position: clampedPosition,
  };
}

/**
 * 가이드라인 드래그 시작
 */
export interface DragState {
  guideId: string;
  startPosition: number;
  currentPosition: number;
  offset: number;
}

export function startGuideDrag(
  guide: GuideLine,
  mousePosition: number
): DragState {
  return {
    guideId: guide.id,
    startPosition: guide.position,
    currentPosition: mousePosition,
    offset: mousePosition - guide.position,
  };
}

/**
 * 가이드라인 드래그 중 위치 계산
 */
export function updateGuideDrag(
  dragState: DragState,
  mousePosition: number
): number {
  const newPosition = mousePosition - dragState.offset;
  const maxDimension = window.innerWidth; // 또는 height

  return Math.max(0, Math.min(newPosition, maxDimension));
}

/**
 * 가이드라인 스냅 (다른 라인에)
 */
export function snapGuideToPosition(
  position: number,
  snapTargets: number[],
  threshold: number = 10
): { position: number; snapped: boolean } {
  for (const target of snapTargets) {
    if (Math.abs(position - target) < threshold) {
      return { position: target, snapped: true };
    }
  }

  return { position, snapped: false };
}

/**
 * 가이드라인 정렬
 */
export function alignGuideLines(guides: GuideLine[], alignTo: 'start' | 'center' | 'end', gap: number = 0): GuideLine[] {
  const horizontalGuides = guides.filter(g => g.type === 'horizontal').sort((a, b) => a.position - b.position);
  const verticalGuides = guides.filter(g => g.type === 'vertical').sort((a, b) => a.position - b.position);

  const alignedGuides: GuideLine[] = [];

  for (const guide of [...horizontalGuides, ...verticalGuides]) {
    alignedGuides.push({ ...guide });
  }

  return alignedGuides;
}
```

---

## Task #11.11: 가이드라인 표시/숨김

- **파일**: `src/utils/gridLayout/guideLines/visibility.ts`
- **시간**: 15분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GuideLine } from '../../../types/gridLayout';

/**
 * 가이드라인 표시 여부 토글
 */
export function toggleGuideVisibility(guide: GuideLine): GuideLine {
  return {
    ...guide,
    visible: !guide.visible,
  };
}

/**
 * 가이드라인 표시 설정
 */
export function setGuideVisibility(guide: GuideLine, visible: boolean): GuideLine {
  return {
    ...guide,
    visible,
  };
}

/**
 * 모든 가이드라인 표시
 */
export function showAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, visible: true }));
}

/**
 * 모든 가이드라인 숨김
 */
export function hideAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, visible: false }));
}

/**
 * 표시 중인 가이드라인만 필터링
 */
export function getVisibleGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.visible);
}

/**
 * 특정 타입의 가이드라인 필터링
 */
export function getGuidesByType(guides: GuideLine[], type: 'horizontal' | 'vertical'): GuideLine[] {
  return guides.filter(g => g.type === type && g.visible);
}
```

---

## Task #11.12: 가이드라인 잠금

- **파일**: `src/utils/gridLayout/guideLines/locking.ts`
- **시간**: 10분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GuideLine } from '../../../types/gridLayout';

/**
 * 가이드라인 잠금 토글
 */
export function toggleGuideLock(guide: GuideLine): GuideLine {
  return {
    ...guide,
    locked: !guide.locked,
  };
}

/**
 * 가이드라인 잠금 설정
 */
export function setGuideLock(guide: GuideLine, locked: boolean): GuideLine {
  return {
    ...guide,
    locked,
  };
}

/**
 * 잠금 해제된 가이드라인만 필터링
 */
export function getUnlockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => !g.locked);
}

/**
 * 잠긴 가이드라인만 필터링
 */
export function getLockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.locked);
}
```

---

## Task #11.13: 가이드라인 스타일 변경

- **파일**: `src/utils/gridLayout/guideLines/styling.ts`
- **시간**: 20분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GuideLine, GuideLineStyle } from '../../../types/gridLayout';

/**
 * 가이드라인 색상 변경
 */
export function setGuideColor(guide: GuideLine, color: string): GuideLine {
  return {
    ...guide,
    color,
  };
}

/**
 * 가이드라인 두께 변경
 */
export function setGuideWidth(guide: GuideLine, width: number): GuideLine {
  return {
    ...guide,
    width: Math.max(1, Math.min(width, 5)),
  };
}

/**
 * 가이드라인 스타일 변경
 */
export function setGuideStyle(guide: GuideLine, style: GuideLineStyle): GuideLine {
  return {
    ...guide,
    style,
  };
}

/**
 * 가이드라인 스타일 일괄 변경
 */
export function setAllGuidesStyle(
  guides: GuideLine[],
  style: GuideLineStyle
): GuideLine[] {
  return guides.map(g => ({ ...g, style }));
}

/**
 * 가이드라인 색상 일괄 변경
 */
export function setAllGuidesColor(
  guides: GuideLine[],
  color: string
): GuideLine[] {
  return guides.map(g => ({ ...g, color }));
}
```

---

## Task #11.14: 가이드라인 삭제

- **파일**: `src/utils/gridLayout/guideLines/removeGuide.ts`
- **시간**: 15분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GuideLine } from '../../../types/gridLayout';

/**
 * 특정 가이드라인 삭제
 */
export function removeGuideLine(guides: GuideLine[], guideId: string): GuideLine[] {
  return guides.filter(g => g.id !== guideId);
}

/**
 * 여러 가이드라인 삭제
 */
export function removeGuideLines(guides: GuideLine[], guideIds: string[]): GuideLine[] {
  const idSet = new Set(guideIds);
  return guides.filter(g => !idSet.has(g.id));
}

/**
 * 모든 가이드라인 삭제
 */
export function clearAllGuides(): GuideLine[] {
  return [];
}

/**
 * 특정 타입의 가이드라인만 삭제
 */
export function clearGuidesByType(guides: GuideLine[], type: 'horizontal' | 'vertical'): GuideLine[] {
  return guides.filter(g => g.type !== type);
}

/**
 * 잠금 해제된 가이드라인만 삭제
 */
export function clearUnlockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.locked);
}
```

---

## Task #11.15: 가이드라인 관리 훅

- **파일**: `src/hooks/gridLayout/useGuideLines.ts`
- **시간**: 40분
- **의존성**: Task #11.1, #11.2, #11.9-#11.14
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { GuideLine } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { createHorizontalGuide, createVerticalGuide } from '../../utils/gridLayout/guideLines/createGuideLine';
import { moveGuideLine } from '../../utils/gridLayout/guideLines/positionGuide';
import { toggleGuideVisibility, showAllGuides, hideAllGuides } from '../../utils/gridLayout/guideLines/visibility';
import { toggleGuideLock } from '../../utils/gridLayout/guideLines/locking';
import { setGuideColor, setGuideStyle } from '../../utils/gridLayout/guideLines/styling';
import { removeGuideLine, clearAllGuides as clearAll } from '../../utils/gridLayout/guideLines/removeGuide';

export function useGuideLines() {
  const [guides, setGuides] = useState<GuideLine[]>(DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.items);
  const [showOnHover, setShowOnHover] = useState(DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.showOnHover);

  // 초기 데이터 로드
  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_GUIDELINES);
      if (result[STORAGE_KEYS.GRID_LAYOUT_GUIDELINES]) {
        setGuides(result[STORAGE_KEYS.GRID_LAYOUT_GUIDELINES]);
      }
    } catch (error) {
      console.error('Failed to load guide lines:', error);
    }
  };

  const saveGuides = async (newGuides: GuideLine[]) => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_GUIDELINES]: newGuides,
      });
      setGuides(newGuides);
    } catch (error) {
      console.error('Failed to save guide lines:', error);
    }
  };

  // 가이드라인 추가
  const addHorizontalGuide = useCallback(async (position: number) => {
    const newGuide = createHorizontalGuide(position);
    await saveGuides([...guides, newGuide]);
  }, [guides]);

  const addVerticalGuide = useCallback(async (position: number) => {
    const newGuide = createVerticalGuide(position);
    await saveGuides([...guides, newGuide]);
  }, [guides]);

  // 가이드라인 이동
  const moveGuide = useCallback(async (guideId: string, newPosition: number) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? moveGuideLine(g, newPosition) : g
    );
    await saveGuides(newGuides);
  }, [guides]);

  // 가이드라인 표시/숨김
  const toggleVisibility = useCallback(async (guideId: string) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? toggleGuideVisibility(g) : g
    );
    await saveGuides(newGuides);
  }, [guides]);

  const showAll = useCallback(async () => {
    const newGuides = showAllGuides(guides);
    await saveGuides(newGuides);
  }, [guides]);

  const hideAll = useCallback(async () => {
    const newGuides = hideAllGuides(guides);
    await saveGuides(newGuides);
  }, [guides]);

  // 가이드라인 잠금
  const toggleLock = useCallback(async (guideId: string) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? toggleGuideLock(g) : g
    );
    await saveGuides(newGuides);
  }, [guides]);

  // 가이드라인 스타일 변경
  const updateGuideStyle = useCallback(async (guideId: string, color?: string, style?: 'solid' | 'dashed' | 'dotted') => {
    const newGuides = guides.map(g => {
      if (g.id === guideId) {
        let updated = g;
        if (color) updated = setGuideColor(updated, color);
        if (style) updated = setGuideStyle(updated, style);
        return updated;
      }
      return g;
    });
    await saveGuides(newGuides);
  }, [guides]);

  // 가이드라인 삭제
  const removeGuide = useCallback(async (guideId: string) => {
    const newGuides = removeGuideLine(guides, guideId);
    await saveGuides(newGuides);
  }, [guides]);

  const clearAllGuides = useCallback(async () => {
    await saveGuides([]);
  }, []);

  return {
    guides,
    showOnHover,
    setShowOnHover,
    addHorizontalGuide,
    addVerticalGuide,
    moveGuide,
    toggleVisibility,
    showAll,
    hideAll,
    toggleLock,
    updateGuideStyle,
    removeGuide,
    clearAllGuides,
  };
}
```
- **완료 조건**: CRUD 동작 검증

---

**완료 후 다음 단계**: [Phase 3: 뷰포트 체커](./TASK-11-phase-03-viewport.md)
