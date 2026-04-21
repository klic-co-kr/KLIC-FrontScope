/**
 * Layout Analyzer Component
 *
 * 레이아웃 분석 컴포넌트 (Flexbox, Grid)
 */

import React, { useState } from 'react';
import { useFlexContainers, useGridContainers } from '../../hooks/cssScan/useCSSScan';
import type { FlexInfo, GridInfo } from '../../types/cssScan';

interface LayoutItem {
  element: HTMLElement;
  type: 'flex' | 'grid';
  info: FlexInfo | GridInfo;
}

export const LayoutAnalyzer: React.FC = () => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutItem | null>(null);
  const [activeView, setActiveView] = useState<'flex' | 'grid' | 'all'>('all');

  const { containers: flexContainers, count: flexCount, refresh: refreshFlex } =
    useFlexContainers();
  const { containers: gridContainers, count: gridCount, refresh: refreshGrid } =
    useGridContainers();

  const layouts: LayoutItem[] = [
    ...flexContainers.map(el => ({
      element: el,
      type: 'flex' as const,
      info: {} as FlexInfo, // Will be filled on demand
    })),
    ...gridContainers.map(el => ({
      element: el,
      type: 'grid' as const,
      info: {} as GridInfo,
    })),
  ];

  const filteredLayouts =
    activeView === 'all'
      ? layouts
      : layouts.filter(l => l.type === activeView);

  const handleRefresh = () => {
    refreshFlex();
    refreshGrid();
  };

  const getLayoutInfo = (item: LayoutItem): string => {
    if (item.type === 'flex') {
      const computedStyle = window.getComputedStyle(item.element);
      return `flex: ${computedStyle.getPropertyValue('flex-direction')} | ${computedStyle.getPropertyValue('justify-content')}`;
    } else {
      const computedStyle = window.getComputedStyle(item.element);
      return `grid: ${computedStyle.getPropertyValue('grid-template-columns')}`;
    }
  };

  return (
    <div className="klic-layout-analyzer p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Layouts</h3>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>

      {/* 통계 */}
      <div className="flex gap-4">
        <div className="flex-1 p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{flexCount}</div>
          <div className="text-xs text-blue-600">Flexbox</div>
        </div>
        <div className="flex-1 p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{gridCount}</div>
          <div className="text-xs text-purple-600">Grid</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeView === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({layouts.length})
        </button>
        <button
          onClick={() => setActiveView('flex')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeView === 'flex'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Flexbox ({flexCount})
        </button>
        <button
          onClick={() => setActiveView('grid')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeView === 'grid'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Grid ({gridCount})
        </button>
      </div>

      {/* 레이아웃 목록 */}
      <div className="space-y-2 max-h-96 overflow-auto">
        {filteredLayouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No layouts found</p>
            <p className="text-xs mt-1">
              {activeView === 'flex'
                ? 'No flexbox containers detected'
                : activeView === 'grid'
                ? 'No grid containers detected'
                : 'No flexbox or grid containers detected'}
            </p>
          </div>
        ) : (
          filteredLayouts.map((item, index) => {
            const computedStyle = window.getComputedStyle(item.element);
            const tagName = item.element.tagName.toLowerCase();
            const id = item.element.id;
            const classes = Array.from(item.element.classList).slice(0, 3);

            return (
              <div
                key={`${item.type}-${index}`}
                onClick={() => setSelectedLayout(item)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${
                    selectedLayout === item
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        item.type === 'flex'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {item.type === 'flex' ? 'FLEX' : 'GRID'}
                    </span>
                    <code className="text-xs">
                      {tagName}
                      {id && `#${id}`}
                      {classes.length > 0 && `.${classes.join('.')}`}
                    </code>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="text-xs opacity-60 hover:opacity-100"
                    title="Scroll to element"
                  >
                    📍
                  </button>
                </div>
                <div
                  className={`text-xs font-mono truncate ${
                    selectedLayout === item ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {getLayoutInfo(item)}
                </div>
                {item.type === 'flex' && (
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] px-1 py-0.5 bg-gray-200 rounded text-gray-600">
                      {computedStyle.getPropertyValue('justify-content')}
                    </span>
                    <span className="text-[10px] px-1 py-0.5 bg-gray-200 rounded text-gray-600">
                      {computedStyle.getPropertyValue('align-items')}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 선택된 레이아웃 상세 */}
      {selectedLayout && (
        <div className="klic-layout-detail p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Layout Details</h4>
            <button
              onClick={() => setSelectedLayout(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {selectedLayout.type === 'flex' ? (
            <FlexLayoutDetails element={selectedLayout.element} />
          ) : (
            <GridLayoutDetails element={selectedLayout.element} />
          )}
        </div>
      )}
    </div>
  );
};

const FlexLayoutDetails: React.FC<{ element: HTMLElement }> = ({ element }) => {
  const computedStyle = window.getComputedStyle(element);

  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-gray-500">Direction:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('flex-direction')}</span>
        </div>
        <div>
          <span className="text-gray-500">Wrap:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('flex-wrap')}</span>
        </div>
        <div>
          <span className="text-gray-500">Justify:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('justify-content')}</span>
        </div>
        <div>
          <span className="text-gray-500">Align:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('align-items')}</span>
        </div>
        <div>
          <span className="text-gray-500">Align Content:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('align-content')}</span>
        </div>
        <div>
          <span className="text-gray-500">Gap:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('gap')}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <span className="text-gray-500 block mb-1">Children ({element.children.length}):</span>
        <div className="max-h-24 overflow-auto">
          {Array.from(element.children).slice(0, 5).map((child, i) => {
            const childStyle = window.getComputedStyle(child as HTMLElement);
            return (
              <div key={i} className="text-xs font-mono text-gray-600 truncate">
                {child.tagName.toLowerCase()}: grow={childStyle.getPropertyValue(
                  'flex-grow'
                )}, shrink={childStyle.getPropertyValue('flex-shrink')}
              </div>
            );
          })}
          {element.children.length > 5 && (
            <div className="text-xs text-gray-400">
              ...and {element.children.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GridLayoutDetails: React.FC<{ element: HTMLElement }> = ({ element }) => {
  const computedStyle = window.getComputedStyle(element);

  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-gray-500">Columns:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('grid-template-columns')}</span>
        </div>
        <div>
          <span className="text-gray-500">Rows:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('grid-template-rows')}</span>
        </div>
        <div>
          <span className="text-gray-500">Areas:</span>{' '}
          <span className="font-mono truncate">{computedStyle.getPropertyValue('grid-template-areas') || 'none'}</span>
        </div>
        <div>
          <span className="text-gray-500">Gap:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('gap')}</span>
        </div>
        <div>
          <span className="text-gray-500">Auto Flow:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('grid-auto-flow')}</span>
        </div>
        <div>
          <span className="text-gray-500">Auto Columns:</span>{' '}
          <span className="font-mono">{computedStyle.getPropertyValue('grid-auto-columns')}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <span className="text-gray-500 block mb-1">Children ({element.children.length}):</span>
        <div className="max-h-24 overflow-auto">
          {Array.from(element.children).slice(0, 5).map((child, i) => {
            const childStyle = window.getComputedStyle(child as HTMLElement);
            return (
              <div key={i} className="text-xs font-mono text-gray-600">
                {child.tagName.toLowerCase()}: col={childStyle.getPropertyValue(
                  'grid-column'
                )}, row={childStyle.getPropertyValue('grid-row')}
              </div>
            );
          })}
          {element.children.length > 5 && (
            <div className="text-xs text-gray-400">
              ...and {element.children.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayoutAnalyzer;
