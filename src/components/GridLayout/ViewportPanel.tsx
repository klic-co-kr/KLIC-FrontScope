/**
 * Viewport Panel Component
 *
 * 뷰포트 설정 관리 패널 컴포넌트
 */

import React, { useState } from 'react';
import type { DeviceCategory } from '../../types/gridLayout';
import { VIEWPORT_PRESETS_BY_CATEGORY } from '../../constants/viewportPresets';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface ViewportPanelProps {
  viewport: {
    viewport: {
      preset: { id: string; icon: string; name: string } | null;
      customWidth: number;
      customHeight: number;
      orientation: 'portrait' | 'landscape';
      zoom: number;
    };
    currentBreakpoint: string;
    rotate: () => void;
    setZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    selectPreset: (preset: { id: string; name: string; category: DeviceCategory; width: number; height: number; devicePixelRatio?: number; userAgent?: string; icon: string }) => void;
    setCustomSize: (width: number, height: number) => void;
    resize: (width: number, height: number) => void;
    saveAsPreset: (name: string, options?: { devicePixelRatio?: number; icon?: string }) => void;
  };
}

export function ViewportPanel({ viewport }: ViewportPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('desktop');
  const [customWidth, setCustomWidth] = useState(viewport.viewport.customWidth);
  const [customHeight, setCustomHeight] = useState(viewport.viewport.customHeight);

  const currentCategoryPresets = VIEWPORT_PRESETS_BY_CATEGORY[selectedCategory];

  return (
    <div className="viewport-panel space-y-4">
      {/* Current Viewport Info */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">현재 뷰포트</h3>

        <div className="viewport-info space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">프리셋</span>
            <span className="text-sm text-foreground font-medium">
              {viewport.viewport.preset?.icon} {viewport.viewport.preset?.name || 'Custom'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">해상도</span>
            <span className="text-sm text-foreground font-mono">
              {viewport.viewport.customWidth} × {viewport.viewport.customHeight}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">방향</span>
            <span className="text-sm text-foreground">
              {viewport.viewport.orientation === 'portrait' ? '↕ 세로' : '↔ 가로'}
            </span>
          </div>

          {viewport.viewport.zoom !== 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">줌</span>
              <span className="text-sm text-foreground">
                {Math.round(viewport.viewport.zoom * 100)}%
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">브레이크포인트</span>
            <span className="text-sm text-primary font-mono">
              {viewport.currentBreakpoint.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Viewport Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => viewport.rotate()}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            🔄 회전
          </button>
          <button
            onClick={() => viewport.setZoom(1)}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            🔍 줌 리셋
          </button>
          <button
            onClick={() => viewport.zoomIn()}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            ➕ 확대
          </button>
          <button
            onClick={() => viewport.zoomOut()}
            className="px-3 py-2 text-sm bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            ➕ 축소
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">프리셋</h3>

        {/* Category Tabs */}
        <TooltipProvider delayDuration={300}>
          <div className="category-tabs flex gap-1 mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedCategory('mobile')}
                  className={`p-2 rounded transition-colors ${
                    selectedCategory === 'mobile'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>모바일</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedCategory('tablet')}
                  className={`p-2 rounded transition-colors ${
                    selectedCategory === 'tablet'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  }`}
                >
                  <Tablet className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>태블릿</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedCategory('desktop')}
                  className={`p-2 rounded transition-colors ${
                    selectedCategory === 'desktop'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>데스크톱</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Preset List */}
        <div className="preset-list space-y-1 max-h-48 overflow-y-auto">
          {currentCategoryPresets.map(preset => (
            <button
              key={preset.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                viewport.viewport.preset?.id === preset.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
              onClick={() => viewport.selectPreset(preset)}
            >
              <span className="text-lg">{preset.icon}</span>
              <span className="flex-1 text-sm">{preset.name}</span>
              <span className="text-xs font-mono opacity-70">
                {preset.width}×{preset.height}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Viewport */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">사용자 정의</h3>

        <div className="dimension-inputs space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              너비 (px): {customWidth}
            </label>
            <input
              type="range"
              min="320"
              max="7680"
              step="10"
              value={customWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value);
                setCustomWidth(width);
                viewport.resize(width, customHeight);
              }}
              className="w-full"
            />
            <input
              type="number"
              min="320"
              max="7680"
              value={customWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value) || 320;
                setCustomWidth(width);
                viewport.resize(width, customHeight);
              }}
              className="w-full mt-1 px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              높이 (px): {customHeight}
            </label>
            <input
              type="range"
              min="480"
              max="4320"
              step="10"
              value={customHeight}
              onChange={(e) => {
                const height = parseInt(e.target.value);
                setCustomHeight(height);
                viewport.resize(customWidth, height);
              }}
              className="w-full"
            />
            <input
              type="number"
              min="480"
              max="4320"
              value={customHeight}
              onChange={(e) => {
                const height = parseInt(e.target.value) || 480;
                setCustomHeight(height);
                viewport.resize(customWidth, height);
              }}
              className="w-full mt-1 px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
            />
          </div>
        </div>

        {/* Common Sizes */}
        <div className="mt-3">
          <label className="block text-xs text-muted-foreground mb-2">일반적인 크기</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { w: 1280, h: 720, label: '13"' },
              { w: 1440, h: 900, label: '15"' },
              { w: 1920, h: 1080, label: 'FHD' },
            ].map(size => (
              <button
                key={size.label}
                onClick={() => {
                  viewport.resize(size.w, size.h);
                  setCustomWidth(size.w);
                  setCustomHeight(size.h);
                }}
                className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save as Preset */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <button
          onClick={() => {
            const name = prompt('프리셋 이름을 입력하세요:');
            if (name) {
              viewport.saveAsPreset(name);
            }
          }}
          className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          💾 현재 크기를 프리셋으로 저장
        </button>
      </div>
    </div>
  );
}
