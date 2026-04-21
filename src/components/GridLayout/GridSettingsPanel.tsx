/**
 * Grid Settings Panel Component
 *
 * 그리드 오버레이 설정 패널 컴포넌트
 */

import React from 'react';
import { TAILWIND_BREAKPOINTS } from '../../constants/viewportPresets';
import { GUIDE_LINE_STYLE_LABELS } from '../../constants/gridStyles';

interface GridSettingsPanelProps {
  grid: {
    settings: {
      enabled: boolean;
      columns: number;
      gap: number;
      margin: string;
      maxWidth: string;
      color: string;
      opacity: number;
      style: 'solid' | 'dashed' | 'dotted';
      showColumnNumbers: boolean;
      showColumnBackgrounds?: boolean;
      showInfo?: boolean;
      lineWidth?: number;
      zIndex?: number;
      size?: number;
      breakpoints: {
        sm: { enabled: boolean; columns: number };
        md: { enabled: boolean; columns: number };
        lg: { enabled: boolean; columns: number };
        xl: { enabled: boolean; columns: number };
        '2xl': { enabled: boolean; columns: number };
      };
    };
    toggle: () => void;
    setColumns: (n: number) => void;
    setColor: (c: string) => void;
    setOpacity: (o: number) => void;
    setGap: (gap: number) => void;
    setMargin: (margin: string) => void;
    setMaxWidth: (maxWidth: string) => void;
    setStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
    toggleColumnNumbers: () => void;
    updateBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl', enabled: boolean, columns: number) => void;
    setAllBreakpoints: (enabled: boolean, columns: number) => void;
  };
}

export function GridSettingsPanel({ grid }: GridSettingsPanelProps) {
  const { settings } = grid;

  return (
    <div className="grid-settings-panel space-y-4">
      {/* Toggle */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">그리드 설정</h3>
          <label className="toggle flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => grid.toggle()}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-foreground">
              {settings.enabled ? '표시 중' : '숨김'}
            </span>
          </label>
        </div>
      </div>

      {/* Column Settings */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">컬럼</h3>

        <div className="space-y-3">
          <div>
            <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>컬럼 수</span>
              <span className="text-primary">{settings.columns}</span>
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={settings.columns}
              onChange={(e) => grid.setColumns(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>간격 (px)</span>
              <span className="text-primary">{settings.gap}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.gap}
              onChange={(e) => grid.setGap(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1">여백</label>
            <input
              type="text"
              value={settings.margin}
              onChange={() => {/* TODO: update margin */}}
              className="w-full px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1">최대 너비</label>
            <input
              type="text"
              value={settings.maxWidth}
              onChange={() => {/* TODO: update maxWidth */}}
              className="w-full px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
            />
          </div>
        </div>
      </div>

      {/* Style Settings */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">스타일</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1">색상</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => grid.setColor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.color}
                onChange={(e) => grid.setColor(e.target.value)}
                className="flex-1 px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>불투명도</span>
              <span className="text-primary">{Math.round(settings.opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.opacity * 100}
              onChange={(e) => grid.setOpacity(parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1">스타일</label>
            <div className="flex gap-1">
              {(Object.keys(GUIDE_LINE_STYLE_LABELS) as Array<keyof typeof GUIDE_LINE_STYLE_LABELS>).map(style => (
                <button
                  key={style}
                  onClick={() => grid.setStyle(style)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    settings.style === style
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  }`}
                >
                  {GUIDE_LINE_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showColumnNumbers}
              onChange={() => grid.toggleColumnNumbers()}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs text-foreground">컬럼 번호 표시</span>
          </label>
        </div>
      </div>

      {/* Breakpoint Settings */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          반응형 브레이크포인트
        </h3>

        <div className="space-y-2">
          {(Object.entries(TAILWIND_BREAKPOINTS) as Array<[string, number]>).map(([key, value]) => {
            const bp = key as keyof typeof settings.breakpoints;
            const bpSettings = settings.breakpoints[bp];

            return (
              <div key={key} className="breakpoint-setting p-2 bg-accent rounded">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bpSettings.enabled}
                      onChange={(e) => grid.updateBreakpoint(
                        bp,
                        e.target.checked,
                        bpSettings.columns
                      )}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">
                      {key.toUpperCase()} ({value}px+)
                    </span>
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {bpSettings.columns} 컬럼
                  </span>
                </div>

                <input
                  type="number"
                  min="1"
                  max="16"
                  disabled={!bpSettings.enabled}
                  value={bpSettings.columns}
                  onChange={(e) => grid.updateBreakpoint(
                    bp,
                    bpSettings.enabled,
                    parseInt(e.target.value) || 12
                  )}
                  className={`w-full px-2 py-1 bg-muted text-foreground rounded border border-border text-sm ${
                    !bpSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => grid.setAllBreakpoints(true, 12)}
            className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            모두 활성화 (12)
          </button>
          <button
            onClick={() => grid.setAllBreakpoints(false, 12)}
            className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            모두 비활성화
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">프리셋</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              grid.setColumns(12);
              grid.setGap(24);
              grid.setStyle('dashed');
            }}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            Tailwind 기본
          </button>
          <button
            onClick={() => {
              grid.setColumns(12);
              grid.setGap(16);
              grid.setStyle('dotted');
              grid.setOpacity(0.3);
            }}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            부드라인
          </button>
          <button
            onClick={() => {
              grid.setColumns(16);
              grid.setGap(32);
              grid.setStyle('solid');
              grid.setOpacity(0.5);
            }}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            넓은 그리드
          </button>
          <button
            onClick={() => {
              grid.setColumns(4);
              grid.setGap(16);
              grid.setOpacity(0.7);
            }}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            모바일
          </button>
        </div>
      </div>
    </div>
  );
}
