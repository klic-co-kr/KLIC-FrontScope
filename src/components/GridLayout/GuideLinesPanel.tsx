/**
 * Guide Lines Panel Component
 *
 * 가이드라인 관리 패널 컴포넌트
 */

import React, { useState } from 'react';
import type { GuideLine } from '../../types/gridLayout';
import { GRID_COLOR_PRESETS } from '../../constants/gridStyles';
import { GUIDE_LINE_STYLE_LABELS } from '../../constants/gridStyles';

interface GuideLinesPanelProps {
  guides: {
    guides: GuideLine[];
    addHorizontalGuide: (position: number, options?: { color?: string; width?: number; style?: 'solid' | 'dashed' | 'dotted' }) => Promise<GuideLine>;
    addVerticalGuide: (position: number, options?: { color?: string; width?: number; style?: 'solid' | 'dashed' | 'dotted' }) => Promise<GuideLine>;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;
    removeGuide: (id: string) => void;
    showAll: () => void;
    hideAll: () => void;
    clearAllGuides: () => void;
    stats: {
      total: number;
      visible: number;
      horizontal: number;
      vertical: number;
      locked: number;
      editable: number;
    };
  };
}

export function GuideLinesPanel({ guides }: GuideLinesPanelProps) {
  const [selectedColor, setSelectedColor] = useState('#FF3366');
  const [selectedStyle, setSelectedStyle] = useState<'solid' | 'dashed' | 'dotted'>('dashed');

  const visibleGuides = guides.guides.filter((g: GuideLine) => g.visible);

  return (
    <div className="guidelines-panel space-y-4">
      {/* Quick Add */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">빠른 추가</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => guides.addHorizontalGuide(window.innerHeight / 2, { color: selectedColor, style: selectedStyle })}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            수평 가이드
          </button>
          <button
            onClick={() => guides.addVerticalGuide(window.innerWidth / 2, { color: selectedColor, style: selectedStyle })}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            수직 가이드
          </button>
        </div>

        {/* Style Options */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">색상</label>
            <div className="flex flex-wrap gap-1">
              {GRID_COLOR_PRESETS.map(color => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded transition-transform hover:scale-110 ${
                    selectedColor === color.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-2">스타일</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as 'solid' | 'dashed' | 'dotted')}
              className="w-full px-3 py-2 bg-accent text-foreground rounded border border-border"
            >
              <option value="solid">{GUIDE_LINE_STYLE_LABELS.solid}</option>
              <option value="dashed">{GUIDE_LINE_STYLE_LABELS.dashed}</option>
              <option value="dotted">{GUIDE_LINE_STYLE_LABELS.dotted}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guides List */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            가이드라인 목록 ({visibleGuides.length}/{guides.guides.length})
          </h3>
        </div>

        {guides.guides.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            가이드라인이 없습니다
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {guides.guides.map((guide: GuideLine) => (
              <div
                key={guide.id}
                className="guide-item flex items-center justify-between p-2 bg-accent rounded"
                style={{ opacity: guide.visible ? 1 : 0.5 }}
              >
                <div className="guide-info flex items-center gap-3">
                  <span className="text-lg">
                    {guide.type === 'horizontal' ? '↔' : '↕'}
                  </span>
                  <span className="text-sm text-foreground font-mono">
                    {Math.round(guide.position)}px
                  </span>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: guide.color }}
                  />
                </div>

                <div className="guide-actions flex gap-1">
                  <button
                    onClick={() => guides.toggleVisibility(guide.id)}
                    className="p-1 hover:bg-accent/80 rounded transition-colors"
                    title={guide.visible ? '숨기기' : '표시'}
                  >
                    {guide.visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => guides.toggleLock(guide.id)}
                    className="p-1 hover:bg-accent/80 rounded transition-colors"
                    title={guide.locked ? '잠금 해제' : '잠금'}
                  >
                    {guide.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    onClick={() => guides.removeGuide(guide.id)}
                    className="p-1 hover:bg-destructive/60 rounded transition-colors"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => guides.showAll()}
            className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            모두 표시
          </button>
          <button
            onClick={() => guides.hideAll()}
            className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            모두 숨김
          </button>
          <button
            onClick={() => guides.clearAllGuides()}
            className="px-2 py-1 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
          >
            모두 삭제
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">통계</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>전체: {guides.stats.total}</div>
          <div>표시: {guides.stats.visible}</div>
          <div>수평: {guides.stats.horizontal}</div>
          <div>수직: {guides.stats.vertical}</div>
          <div>잠금: {guides.stats.locked}</div>
          <div>편집: {guides.stats.editable}</div>
        </div>
      </div>
    </div>
  );
}
