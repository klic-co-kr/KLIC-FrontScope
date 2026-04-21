/**
 * Style Viewer Component
 *
 * 스타일 뷰어 컴포넌트
 */

import React, { useState, useMemo } from 'react';
import type { ElementStyleInfo, ColorInfo, FontInfo, BoxModel, FlexInfo, GridInfo } from '../../types/cssScan';
import { CSS_PROPERTY_CATEGORIES } from '../../constants/cssScanDefaults';
import { BoxModelViewer } from './BoxModelViewer';

interface StyleViewerProps {
  elementStyle: ElementStyleInfo | null;
  colors: ColorInfo[];
  font: FontInfo | null;
  boxModel: BoxModel | null;
  flexInfo: FlexInfo | null;
  gridInfo: GridInfo | null;
}

export const StyleViewer: React.FC<StyleViewerProps> = ({
  elementStyle,
  colors,
  font,
  boxModel,
  flexInfo,
  gridInfo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBoxModel] = useState(true);

  // 스타일 속성 카테고리 분류
  const categorizedStyles = useMemo(() => {
    if (!elementStyle?.computedStyle) return {};

    const styles: Record<string, Array<{ property: string; value: string }>> = {};

    for (const [category, props] of Object.entries(CSS_PROPERTY_CATEGORIES)) {
      styles[category] = [];

      for (const prop of props) {
        const value = elementStyle.computedStyle[prop];
        if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
          styles[category].push({ property: prop, value });
        }
      }
    }

    return styles;
  }, [elementStyle]);

  // 현재 카테고리의 스타일
  const currentStyles = useMemo(() => {
    if (selectedCategory === 'all') {
      const all: Array<{ property: string; value: string }> = [];
      for (const styles of Object.values(categorizedStyles)) {
        all.push(...styles);
      }
      return all.sort((a, b) => a.property.localeCompare(b.property));
    }
    return categorizedStyles[selectedCategory] || [];
  }, [selectedCategory, categorizedStyles]);

  const categories = [
    { id: 'all', label: 'All', count: currentStyles.length },
    { id: 'layout', label: 'Layout', count: categorizedStyles.layout?.length || 0 },
    { id: 'typography', label: 'Typography', count: categorizedStyles.typography?.length || 0 },
    { id: 'color', label: 'Color', count: categorizedStyles.color?.length || 0 },
    { id: 'background', label: 'Background', count: categorizedStyles.background?.length || 0 },
    { id: 'border', label: 'Border', count: categorizedStyles.border?.length || 0 },
    { id: 'spacing', label: 'Spacing', count: categorizedStyles.spacing?.length || 0 },
    { id: 'size', label: 'Size', count: categorizedStyles.size?.length || 0 },
    { id: 'flexbox', label: 'Flexbox', count: categorizedStyles.flexbox?.length || 0 },
    { id: 'grid', label: 'Grid', count: categorizedStyles.grid?.length || 0 },
  ];

  return (
    <div className="klic-style-viewer p-4 space-y-4">
      {/* 요소 정보 */}
      {elementStyle && (
        <div className="klic-element-info p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Element</h3>
          <code className="text-xs text-gray-600 block">
            {elementStyle.element.tagName.toLowerCase()}
            {elementStyle.element.id && `#${elementStyle.element.id}`}
            {elementStyle.element.classes.length > 0 &&
              elementStyle.element.classes.map(c => `.${c}`).join('')}
          </code>
        </div>
      )}

      {/* 선택자 */}
      {elementStyle && elementStyle.selectors.length > 0 && (
        <div className="klic-selectors p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selectors</h3>
          <div className="space-y-1">
            {elementStyle.selectors.slice(0, 5).map((selector, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">
                  {selector.type}
                </span>
                <code className="text-xs text-gray-600 font-mono">
                  {selector.selector}
                </code>
                {selector.matches && (
                  <span className="text-xs text-green-600">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 박스 모델 */}
      {boxModel && showBoxModel && (
        <BoxModelViewer boxModel={boxModel} />
      )}

      {/* 플렉스 정보 */}
      {flexInfo?.enabled && (
        <div className="klic-flex-info p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Flexbox</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-600">Direction:</span>{' '}
              <span className="font-mono">{flexInfo.direction}</span>
            </div>
            <div>
              <span className="text-blue-600">Wrap:</span>{' '}
              <span className="font-mono">{flexInfo.wrap}</span>
            </div>
            <div>
              <span className="text-blue-600">Justify:</span>{' '}
              <span className="font-mono">{flexInfo.justifyContent}</span>
            </div>
            <div>
              <span className="text-blue-600">Align:</span>{' '}
              <span className="font-mono">{flexInfo.alignItems}</span>
            </div>
          </div>
        </div>
      )}

      {/* 그리드 정보 */}
      {gridInfo?.enabled && (
        <div className="klic-grid-info p-3 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">Grid</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-purple-600">Columns:</span>{' '}
              <span className="font-mono">{gridInfo.templateColumns}</span>
            </div>
            <div>
              <span className="text-purple-600">Rows:</span>{' '}
              <span className="font-mono">{gridInfo.templateRows}</span>
            </div>
            <div>
              <span className="text-purple-600">Gap:</span>{' '}
              <span className="font-mono">{gridInfo.gap}</span>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="klic-category-filter flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* 스타일 속성 목록 */}
      <div className="klic-styles p-3 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Computed Styles</h3>

        {currentStyles.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No styles found</p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-auto">
            {currentStyles.map((style) => (
              <div
                key={style.property}
                className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 text-xs group"
              >
                <span className="font-mono text-blue-600 min-w-0 flex-1 truncate">
                  {style.property}:
                </span>
                <span className="font-mono text-gray-700 min-w-0 flex-1 truncate">
                  {style.value}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(style.value)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                  title="Copy value"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 컬러 정보 */}
      {colors.length > 0 && (
        <div className="klic-colors p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 text-xs"
              >
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-mono">{color.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 폰트 정보 */}
      {font && (
        <div className="klic-font p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Font</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Family:</span>{' '}
              <span className="font-medium">{font.family}</span>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>{' '}
              <span className="font-mono">
                {font.size}{font.sizeUnit}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Weight:</span>{' '}
              <span className="font-mono">{font.weight}</span>
            </div>
            <div>
              <span className="text-gray-500">Style:</span>{' '}
              <span className="font-mono">{font.style}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Line Height:</span>{' '}
              <span className="font-mono">{font.lineHeight}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleViewer;
