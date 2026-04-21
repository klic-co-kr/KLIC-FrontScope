# Phase 6: React 컴포넌트

**태스크 범위**: Task #11.34 ~ #11.43 (10개)
**예상 시간**: 5시간
**의존성**: Phase 1-5 완료

---

## Task #11.34: GridLayoutPanel 메인 컴포넌트

- **파일**: `src/components/GridLayout/GridLayoutPanel.tsx`
- **시간**: 45분
- **의존성**: Task #11.15, #11.18, #11.25, #11.28, #11.30
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useGuideLines } from '../../hooks/gridLayout/useGuideLines';
import { useViewport } from '../../hooks/gridLayout/useViewport';
import { useGridOverlay } from '../../hooks/gridLayout/useGridOverlay';
import { useWhitespace } from '../../hooks/gridLayout/useWhitespace';
import { GuideLinesPanel } from './GuideLinesPanel';
import { ViewportPanel } from './ViewportPanel';
import { GridSettingsPanel } from './GridSettingsPanel';
import { WhitespacePanel } from './WhitespacePanel';

type TabType = 'guides' | 'viewport' | 'grid' | 'whitespace';

export function GridLayoutPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const guides = useGuideLines();
  const viewport = useViewport();
  const grid = useGridOverlay();
  const whitespace = useWhitespace();

  return (
    <div className="grid-layout-panel">
      <div className="panel-header">
        <h2>그리드 & 레이아웃</h2>
        <div className="quick-actions">
          <button
            onClick={() => grid.toggle()}
            className={grid.settings.enabled ? 'active' : ''}
            title="그리드 토글 (Ctrl+G)"
          >
            📐
          </button>
          <button
            onClick={() => whitespace.toggle()}
            className={whitespace.settings.enabled ? 'active' : ''}
            title="화이트스페이스 토글"
          >
            ⬜
          </button>
          <button
            onClick={() => guides.clearAllGuides()}
            title="모든 가이드라인 삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('guides')}
          className={activeTab === 'guides' ? 'active' : ''}
        >
          가이드라인 ({guides.guides.length})
        </button>
        <button
          onClick={() => setActiveTab('viewport')}
          className={activeTab === 'viewport' ? 'active' : ''}
        >
          뷰포트
        </button>
        <button
          onClick={() => setActiveTab('grid')}
          className={activeTab === 'grid' ? 'active' : ''}
        >
          그리드
        </button>
        <button
          onClick={() => setActiveTab('whitespace')}
          className={activeTab === 'whitespace' ? 'active' : ''}
        >
          화이트스페이스
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'guides' && <GuideLinesPanel guides={guides} />}
        {activeTab === 'viewport' && <ViewportPanel viewport={viewport} />}
        {activeTab === 'grid' && <GridSettingsPanel grid={grid} />}
        {activeTab === 'whitespace' && <WhitespacePanel whitespace={whitespace} />}
      </div>
    </div>
  );
}
```

---

## Task #11.35: GuideLinesPanel 컴포넌트

- **파일**: `src/components/GridLayout/GuideLinesPanel.tsx`
- **시간**: 30분
- **의존성**: Task #11.15
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { GuideLine } from '../../types/gridLayout';
import { GUIDELINE_COLORS, GUIDELINE_STYLE_LABELS } from '../../constants/gridStyles';

interface GuideLinesPanelProps {
  guides: ReturnType<typeof useGuideLines>;
}

export function GuideLinesPanel({ guides }: GuideLinesPanelProps) {
  const [selectedColor, setSelectedColor] = useState(GUIDELINE_COLORS[0]);
  const [selectedStyle, setSelectedStyle] = useState<'solid' | 'dashed' | 'dotted'>('dashed');

  return (
    <div className="guidelines-panel">
      <div className="panel-section">
        <h3>가이드라인 추가</h3>
        <div className="add-buttons">
          <button onClick={() => guides.addHorizontalGuide(window.innerHeight / 2)}>
            수평 가이드라인
          </button>
          <button onClick={() => guides.addVerticalGuide(window.innerWidth / 2)}>
            수직 가이드라인
          </button>
        </div>

        <div className="style-options">
          <label>색상:</label>
          <div className="color-picker">
            {GUIDELINE_COLORS.map(color => (
              <button
                key={color}
                className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          <label>스타일:</label>
          <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as any)}>
            <option value="solid">{GUIDELINE_STYLE_LABELS.solid}</option>
            <option value="dashed">{GUIDELINE_STYLE_LABELS.dashed}</option>
            <option value="dotted">{GUIDELINE_STYLE_LABELS.dotted}</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <h3>가이드라인 목록 ({guides.guides.length})</h3>
        <div className="guides-list">
          {guides.guides.map(guide => (
            <div key={guide.id} className="guide-item">
              <div className="guide-info">
                <span className="guide-type">
                  {guide.type === 'horizontal' ? '↔' : '↕'}
                </span>
                <span className="guide-position">{Math.round(guide.position)}px</span>
              </div>
              <div className="guide-actions">
                <button
                  onClick={() => guides.toggleVisibility(guide.id)}
                  title={guide.visible ? '숨기기' : '표시'}
                >
                  {guide.visible ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={() => guides.toggleLock(guide.id)}
                  title={guide.locked ? '잠금 해제' : '잠금'}
                >
                  {guide.locked ? '🔒' : '🔓'}
                </button>
                <button
                  onClick={() => guides.removeGuide(guide.id)}
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bulk-actions">
          <button onClick={() => guides.showAll()}>모두 표시</button>
          <button onClick={() => guides.hideAll()}>모두 숨김</button>
          <button onClick={() => guides.clearAllGuides()}>모두 삭제</button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task #11.36: ViewportPanel 컴포넌트

- **파일**: `src/components/GridLayout/ViewportPanel.tsx`
- **시간**: 30분
- **의존성**: Task #11.18, #11.21
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { ViewportPreset, DeviceCategory } from '../../types/gridLayout';
import { VIEWPORT_PRESETS, VIEWPORT_PRESETS_BY_CATEGORY } from '../../constants/viewportPresets';

interface ViewportPanelProps {
  viewport: ReturnType<typeof useViewport>;
}

export function ViewportPanel({ viewport }: ViewportPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('desktop');

  const currentCategoryPresets = VIEWPORT_PRESETS_BY_CATEGORY[selectedCategory];

  return (
    <div className="viewport-panel">
      <div className="current-viewport">
        <h3>현재 뷰포트</h3>
        <div className="viewport-info">
          <div className="preset-name">
            {viewport.viewport.preset?.icon} {viewport.viewport.preset?.name || 'Custom'}
          </div>
          <div className="resolution">
            {viewport.viewport.customWidth} × {viewport.viewport.customHeight}
          </div>
          <div className="orientation">
            {viewport.viewport.orientation === 'portrait' ? '↕ 세로' : '↔ 가로'}
          </div>
          {viewport.viewport.zoom !== 1 && (
            <div className="zoom">줌: {Math.round(viewport.viewport.zoom * 100)}%</div>
          )}
        </div>

        <div className="viewport-actions">
          <button onClick={() => viewport.rotate()}>
            🔄 회전
          </button>
          <button onClick={() => viewport.setZoom(1)}>
            🔍 줌 리셋
          </button>
        </div>
      </div>

      <div className="preset-selector">
        <h3>프리셋</h3>
        <div className="category-tabs">
          <button
            onClick={() => setSelectedCategory('mobile')}
            className={selectedCategory === 'mobile' ? 'active' : ''}
          >
            📱 모바일
          </button>
          <button
            onClick={() => setSelectedCategory('tablet')}
            className={selectedCategory === 'tablet' ? 'active' : ''}
          >
            💻 태블릿
          </button>
          <button
            onClick={() => setSelectedCategory('desktop')}
            className={selectedCategory === 'desktop' ? 'active' : ''}
          >
            🖥️ 데스크톱
          </button>
        </div>

        <div className="preset-list">
          {currentCategoryPresets.map(preset => (
            <button
              key={preset.id}
              className={`preset-item ${viewport.viewport.preset?.id === preset.id ? 'active' : ''}`}
              onClick={() => viewport.selectPreset(preset)}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-name">{preset.name}</span>
              <span className="preset-resolution">{preset.width}×{preset.height}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="custom-viewport">
        <h3>사용자 정의</h3>
        <div className="dimension-inputs">
          <label>
            너비 (px):
            <input
              type="number"
              min="320"
              max="7680"
              value={viewport.viewport.customWidth}
              onChange={(e) => viewport.resize(
                parseInt(e.target.value) || 1280,
                viewport.viewport.customHeight
              )}
            />
          </label>
          <label>
            높이 (px):
            <input
              type="number"
              min="480"
              max="4320"
              value={viewport.viewport.customHeight}
              onChange={(e) => viewport.resize(
                viewport.viewport.customWidth,
                parseInt(e.target.value) || 720
              )}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
```

---

## Task #11.37: GridSettingsPanel 컴포넌트

- **파일**: `src/components/GridLayout/GridSettingsPanel.tsx`
- **시간**: 25분
- **의존성**: Task #11.25
- **상세 내용**:
```typescript
import React from 'react';
import { TAILWIND_BREAKPOINTS } from '../../constants/viewportPresets';
import { GUIDELINE_STYLE_LABELS } from '../../constants/gridStyles';

interface GridSettingsPanelProps {
  grid: ReturnType<typeof useGridOverlay>;
}

export function GridSettingsPanel({ grid }: GridSettingsPanelProps) {
  const { settings } = grid;

  return (
    <div className="grid-settings-panel">
      <div className="panel-section">
        <h3>그리드 설정</h3>
        <div className="toggle-section">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => grid.toggle()}
            />
            <span>그리드 표시</span>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>컬럼</h3>
        <label>
          컬럼 수: {settings.columns}
          <input
            type="range"
            min="1"
            max="16"
            value={settings.columns}
            onChange={(e) => grid.setColumns(parseInt(e.target.value))}
          />
        </label>
        <label>
          간격 (px): {settings.gap}
          <input
            type="range"
            min="0"
            max="100"
            value={settings.gap}
            onChange={(e) => grid.setGap(parseInt(e.target.value))}
          />
        </label>
        <label>
          여백:
          <input
            type="text"
            value={settings.margin}
            onChange={(e) => {/* TODO: update margin */}}
          />
        </label>
      </div>

      <div className="panel-section">
        <h3>스타일</h3>
        <label>
          색상:
          <input
            type="color"
            value={settings.color}
            onChange={(e) => grid.setColor(e.target.value)}
          />
        </label>
        <label>
          불투명도: {Math.round(settings.opacity * 100)}%
          <input
            type="range"
            min="0"
            max="100"
            value={settings.opacity * 100}
            onChange={(e) => grid.setOpacity(parseInt(e.target.value) / 100)}
          />
        </label>
        <label>
          스타일:
          <select
            value={settings.style}
            onChange={(e) => grid.setStyle(e.target.value as any)}
          >
            <option value="solid">{GUIDELINE_STYLE_LABELS.solid}</option>
            <option value="dashed">{GUIDELINE_STYLE_LABELS.dashed}</option>
            <option value="dotted">{GUIDELINE_STYLE_LABELS.dotted}</option>
          </select>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.showColumnNumbers}
            onChange={() => grid.toggleColumnNumbers()}
          />
          <span>컬럼 번호 표시</span>
        </label>
      </div>

      <div className="panel-section">
        <h3>반응형 브레이크포인트</h3>
        {(Object.entries(TAILWIND_BREAKPOINTS) as Array<[string, number]>).map(([key, value]) => (
          <div key={key} className="breakpoint-setting">
            <label>
              <input
                type="checkbox"
                checked={settings.breakpoints[key as keyof typeof settings.breakpoints].enabled}
                onChange={(e) => grid.updateBreakpoint(
                  key as any,
                  e.target.checked,
                  settings.breakpoints[key as keyof typeof settings.breakpoints].columns
                )}
              />
              <span>{key.toUpperCase()} ({value}px+)</span>
            </label>
            <input
              type="number"
              min="1"
              max="16"
              disabled={!settings.breakpoints[key as keyof typeof settings.breakpoints].enabled}
              value={settings.breakpoints[key as keyof typeof settings.breakpoints].columns}
              onChange={(e) => grid.updateBreakpoint(
                key as any,
                settings.breakpoints[key as keyof typeof settings.breakpoints].enabled,
                parseInt(e.target.value) || 12
              )}
            />
            <span>컬럼</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task #11.38: WhitespacePanel 컴포넌트

- **파일**: `src/components/GridLayout/WhitespacePanel.tsx`
- **시간**: 20분
- **의존성**: Task #11.28
- **상세 내용**:
```typescript
import React from 'react';
import { WHITESPACE_PATTERN_LABELS } from '../../constants/gridStyles';

interface WhitespacePanelProps {
  whitespace: ReturnType<typeof useWhitespace>;
}

export function WhitespacePanel({ whitespace }: WhitespacePanelProps) {
  const { settings } = whitespace;

  return (
    <div className="whitespace-panel">
      <div className="panel-section">
        <h3>화이트스페이스</h3>
        <div className="toggle-section">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => whitespace.toggle()}
            />
            <span>화이트스페이스 표시</span>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>패턴</h3>
        <div className="pattern-options">
          {(Object.keys(WHITESPACE_PATTERN_LABELS) as Array<keyof typeof WHITESPACE_PATTERN_LABELS>).map(pattern => (
            <button
              key={pattern}
              className={`pattern-btn ${settings.pattern === pattern ? 'active' : ''}`}
              onClick={() => whitespace.setPattern(pattern)}
            >
              {WHITESPACE_PATTERN_LABELS[pattern]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>스타일</h3>
        <label>
          색상:
          <input
            type="color"
            value={settings.color}
            onChange={(e) => whitespace.setColor(e.target.value)}
          />
        </label>
        <label>
          불투명도: {Math.round(settings.opacity * 100)}%
          <input
            type="range"
            min="0"
            max="100"
            value={settings.opacity * 100}
            onChange={(e) => whitespace.setOpacity(parseInt(e.target.value) / 100)}
          />
        </label>
        <label>
          크기 (px): {settings.size}
          <input
            type="range"
            min="5"
            max="100"
            value={settings.size}
            onChange={(e) => whitespace.setSize(parseInt(e.target.value))}
          />
        </label>
      </div>

      <div className="panel-section">
        <h3>미리보기</h3>
        <div
          className="pattern-preview"
          style={{
            width: '100%',
            height: '100px',
            border: '1px solid #ccc',
            // 패턴 적용
          }}
        />
      </div>
    </div>
  );
}
```

---

## Task #11.39: 가이드라인 핸들 컴포넌트

- **파일**: `src/components/GridLayout/GuideLineHandle.tsx`
- **시간**: 30분
- **의존성**: Task #11.10
- **상세 내용**:
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { GuideLine } from '../../types/gridLayout';
import { startGuideDrag, updateGuideDrag, endResize } from '../../utils/gridLayout/viewport/viewportResizer';

interface GuideLineHandleProps {
  guide: GuideLine;
  onDrag: (guideId: string, newPosition: number) => void;
}

export function GuideLineHandle({ guide, onDrag }: GuideLineHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; startPos: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragState.current) return;

      const newPosition = guide.type === 'horizontal'
        ? e.clientY
        : e.clientX;

      onDrag(guide.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragState.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, guide, onDrag]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (guide.locked) return;

    setIsDragging(true);
    dragState.current = {
      startX: guide.type === 'horizontal' ? e.clientY : e.clientX,
      startPos: guide.position,
    };
  };

  return (
    <div
      className={`guide-handle guide-handle-${guide.type} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        [guide.type === 'horizontal' ? 'top' : 'left']: `${guide.position}px`,
        [guide.type === 'horizontal' ? 'left' : 'top']: '0',
        [guide.type === 'horizontal' ? 'width' : 'height']: '100%',
        [guide.type === 'horizontal' ? 'height' : 'width']: '10px',
        backgroundColor: guide.color,
        cursor: guide.locked ? 'not-allowed' : (guide.type === 'horizontal' ? 'ns-resize' : 'ew-resize'),
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
```

---

## Task #11.40: 뷰포트 리사이저 핸들

- **파일**: `src/components/GridLayout/ViewportResizer.tsx`
- **시간**: 30분
- **의존성**: Task #11.20
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { ResizeHandle, startResize, calculateResize, endResize, getHandleCursor, getHandlePosition } from '../../utils/gridLayout/viewport/viewportResizer';

interface ViewportResizerProps {
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
}

export function ViewportResizer({ width, height, onResize }: ViewportResizerProps) {
  const [resizerState, setResizerState] = useState<{
    isResizing: boolean;
    handle: ResizeHandle | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const handles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  const handleMouseDown = (handle: ResizeHandle, e: React.MouseEvent) => {
    e.stopPropagation();

    const state = startResize(
      handle,
      e.clientX,
      e.clientY,
      width,
      height
    );

    setResizerState(state);
  };

  React.useEffect(() => {
    if (!resizerState.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newSize = calculateResize(
        resizerState,
        e.clientX,
        e.clientY
      );

      onResize(newSize.width, newSize.height);
    };

    const handleMouseUp = () => {
      setResizerState(prev => ({ ...prev, ...endResize() }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizerState, onResize]);

  return (
    <div className="viewport-resizer" style={{ position: 'relative', width, height }}>
      {handles.map(handle => {
        const position = getHandlePosition(handle, width, height, 10);

        return (
          <div
            key={handle}
            className={`resize-handle resize-handle-${handle}`}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: 10,
              height: 10,
              cursor: getHandleCursor(handle),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderRadius: '2px',
            }}
            onMouseDown={(e) => handleMouseDown(handle, e)}
          />
        );
      })}
    </div>
  );
}
```

---

## Task #11.41: 브레이크포인트 인디케이터

- **파일**: `src/components/GridLayout/BreakpointIndicator.tsx`
- **시간**: 20분
- **의존성**: Task #11.17
- **상세 내용**:
```typescript
import React from 'react';
import { getCurrentBreakpoint, getBreakpointInfo } from '../../utils/gridLayout/viewport/breakpointDetector';
import { TAILWIND_BREAKPOINTS } from '../../constants/viewportPresets';

interface BreakpointIndicatorProps {
  width: number;
}

export function BreakpointIndicator({ width }: BreakpointIndicatorProps) {
  const current = getCurrentBreakpoint(width);
  const info = getBreakpointInfo(width);

  const breakpoints = [
    { key: 'sm', value: TAILWIND_BREAKPOINTS.sm, label: 'SM' },
    { key: 'md', value: TAILWIND_BREAKPOINTS.md, label: 'MD' },
    { key: 'lg', value: TAILWIND_BREAKPOINTS.lg, label: 'LG' },
    { key: 'xl', value: TAILWIND_BREAKPOINTS.xl, label: 'XL' },
    { key: '2xl', value: TAILWIND_BREAKPOINTS['2xl'], label: '2XL' },
  ];

  return (
    <div className="breakpoint-indicator">
      <div className="current-breakpoint">
        <span className="breakpoint-label">{current.toUpperCase()}</span>
        <span className="breakpoint-width">{width}px</span>
      </div>

      <div className="breakpoint-scale">
        {breakpoints.map(bp => (
          <div
            key={bp.key}
            className={`breakpoint-mark ${width >= bp.value ? 'active' : ''}`}
            style={{
              left: `${(bp.value / 2560) * 100}%`,
            }}
            title={`${bp.label}: ${bp.value}px+`}
          />
        ))}
      </div>

      <div className="device-info">
        {info.isMobile && '📱 모바일'}
        {info.isTablet && '💻 태블릿'}
        {info.isDesktop && '🖥️ 데스크톱'}
      </div>
    </div>
  );
}
```

---

## Task #11.42: 그리드 오버레이 표시 컴포넌트

- **파일**: `src/components/GridLayout/GridOverlayDisplay.tsx`
- **시간**: 25분
- **의존성**: Task #11.22, #11.23
- **상세 내용**:
```typescript
import React, { useEffect, useState } from 'react';
import { GridOverlaySettings } from '../../types/gridLayout';
import { calculateResponsiveColumns, calculateColumnPositions } from '../../utils/gridLayout/grid/gridCalculator';

interface GridOverlayDisplayProps {
  settings: GridOverlaySettings;
  containerWidth: number;
}

export function GridOverlayDisplay({ settings, containerWidth }: GridOverlayDisplayProps) {
  const [columns, setColumns] = useState(12);
  const [positions, setPositions] = useState<Array<{ index: number; startX: number; endX: number; width: number }>>([]);

  useEffect(() => {
    const colCount = calculateResponsiveColumns(settings, containerWidth);
    const colPositions = calculateColumnPositions(
      containerWidth,
      colCount,
      settings.gap,
      parseFloat(settings.margin)
    );

    setColumns(colCount);
    setPositions(colPositions);
  }, [settings, containerWidth]);

  if (!settings.enabled) {
    return null;
  }

  return (
    <div
      className="grid-overlay-display"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9996,
      }}
    >
      {positions.map(pos => (
        <div
          key={pos.index}
          className="grid-column-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: `${pos.startX}px`,
            width: `${pos.width}px`,
            height: '100%',
            backgroundColor: settings.color,
            opacity: settings.opacity,
            borderStyle: settings.style,
          }}
        >
          {settings.showColumnNumbers && (
            <span
              className="column-number"
              style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                fontSize: '10px',
                color: settings.color,
              }}
            >
              {pos.index + 1}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Task #11.43: 키보드 단축키 헬퍼 표시

- **파일**: `src/components/GridLayout/KeyboardShortcutsHelp.tsx`
- **시간**: 20분
- **의존성**: Task #11.27
- **상세 내용**:
```typescript
import React from 'react';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';

interface KeyboardShortcutsHelpProps {
  shortcuts?: typeof DEFAULT_GRID_LAYOUT_SETTINGS.keyboardShortcuts;
}

export function KeyboardShortcutsHelp({ shortcuts = DEFAULT_GRID_LAYOUT_SETTINGS.keyboardShortcuts }: KeyboardShortcutsHelpProps) {
  return (
    <div className="keyboard-shortcuts-help">
      <h3>키보드 단축키</h3>

      <div className="shortcut-list">
        <div className="shortcut-item">
          <kbd>{shortcuts.toggleGrid}</kbd>
          <span>그리드 토글</span>
        </div>

        <div className="shortcut-item">
          <kbd>{shortcuts.toggleGuides}</kbd>
          <span>가이드라인 토글</span>
        </div>

        <div className="shortcut-item">
          <kbd>{shortcuts.clearAll}</kbd>
          <span>모두 지우기</span>
        </div>

        <div className="shortcut-item">
          <kbd>Ctrl + Z</kbd>
          <span>실행 취소</span>
        </div>

        <div className="shortcut-item">
          <kbd>Ctrl + Y</kbd>
          <span>다시 실행</span>
        </div>

        <div className="shortcut-item">
          <kbd>Esc</kbd>
          <span>현재 도구 비활성화</span>
        </div>
      </div>

      <div className="shortcut-tips">
        <p>💡 팁: 가이드라인을 드래그할 때 <strong>Shift</strong>를 누르면 스냅이 비활성화됩니다.</p>
        <p>💡 팁: 가이드라인 위에서 <strong>더블클릭</strong>하면 잠금/잠금 해제됩니다.</p>
      </div>
    </div>
  );
}
```

---

**완료 후 다음 단계**: [Phase 7: Content Script 통합](./TASK-11-phase-07-content-script.md)
