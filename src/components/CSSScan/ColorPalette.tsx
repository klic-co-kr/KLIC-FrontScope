/**
 * Color Palette Component
 *
 * 색상 팔레트 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  count: number;
}

export const ColorPalette: React.FC = () => {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'hue' | 'saturation'>('none');

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
  };

  const getContrastTextColor = (hex: string): '#ffffff' | '#111827' => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#111827';

    const toLinear = (channel: number) => {
      const sRGB = channel / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4;
    };

    const luminance =
      0.2126 * toLinear(rgb.r) +
      0.7152 * toLinear(rgb.g) +
      0.0722 * toLinear(rgb.b);

    return luminance < 0.45 ? '#ffffff' : '#111827';
  };

  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const analyzePageColors = useCallback(() => {
    const colorMap = new Map<string, { rgb: string; hsl: string; count: number }>();
    const elements = document.querySelectorAll('*');

    for (const element of Array.from(elements)) {
      if (!(element instanceof HTMLElement)) continue;

      const computedStyle = window.getComputedStyle(element);
      const properties = ['color', 'background-color', 'border-color', 'outline-color'];

      for (const prop of properties) {
        const value = computedStyle.getPropertyValue(prop);
        if (!value || value === 'none' || value === 'transparent') continue;

        // 간단한 RGB 파싱
        const rgbMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);

          const hex = rgbToHex(r, g, b);
          const hsl = rgbToHsl(r, g, b);

          if (colorMap.has(hex)) {
            colorMap.get(hex)!.count++;
          } else {
            colorMap.set(hex, { rgb: value, hsl, count: 1 });
          }
        }
      }
    }

    return Array.from(colorMap.entries())
      .map(([hex, data]) => ({ hex, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }, []);

  useEffect(() => {
    const result = analyzePageColors();
    setColors(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyRgb = (e: React.MouseEvent, rgb: string) => {
    e.stopPropagation();
    copyToClipboard(rgb);
  };

  return (
    <div className="klic-color-palette p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Page Colors ({colors.length})
        </h3>
        <button
          onClick={analyzePageColors}
          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>

      {/* 그룹화 옵션 */}
      <div className="flex gap-2">
        <button
          onClick={() => setGroupBy('none')}
          className={`px-2 py-1 text-xs rounded ${
            groupBy === 'none'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          None
        </button>
        <button
          onClick={() => setGroupBy('hue')}
          className={`px-2 py-1 text-xs rounded ${
            groupBy === 'hue'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Hue
        </button>
        <button
          onClick={() => setGroupBy('saturation')}
          className={`px-2 py-1 text-xs rounded ${
            groupBy === 'saturation'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Saturation
        </button>
      </div>

      {/* 색상 그리드 */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {colors.map((color) => (
          <div
            key={color.hex}
            onClick={() => setSelectedColor(color)}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden
              transition-transform hover:scale-105
              ${selectedColor?.hex === color.hex ? 'ring-2 ring-blue-500' : ''}
            `}
            title={`${color.hex} / ${color.rgb} - ${color.count} uses`}
          >
            {/* 색상 미리보기 */}
            <div
              className="aspect-square"
              style={{ backgroundColor: color.hex }}
            />

            {(() => {
              const textColor = getContrastTextColor(color.hex);
              const labelBg = textColor === '#ffffff' ? 'rgba(0, 0, 0, 0.34)' : 'rgba(255, 255, 255, 0.58)';

              return (
                <button
                  type="button"
                  onClick={(e) => handleCopyRgb(e, color.rgb)}
                  className="absolute left-1 right-1 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded text-[9px] font-medium font-mono text-center truncate backdrop-blur-[1px] hover:scale-[1.02] transition-transform"
                  style={{
                    color: textColor,
                    backgroundColor: labelBg,
                    textShadow: textColor === '#ffffff' ? '0 1px 1px rgba(0,0,0,0.45)' : '0 1px 1px rgba(255,255,255,0.35)',
                  }}
                  title={`${color.rgb} 복사`}
                >
                  {color.rgb}
                </button>
              );
            })()}

            {/* 사용 횟수 배지 */}
            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded">
              {color.count}
            </div>

            {/* 툴팁 */}
            <div className="absolute inset-0 pointer-events-none bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
              <div className="text-white text-[10px] text-center">
                <div className="font-mono">{color.hex}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 색상 상세 */}
      {selectedColor && (
        <div className="klic-color-detail p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Color Details</h4>
            <button
              onClick={() => setSelectedColor(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 색상 미리보기 */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-lg shadow-inner"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">HEX</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{selectedColor.hex}</code>
                  <button
                    onClick={() => copyToClipboard(selectedColor.hex)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">RGB</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono">{selectedColor.rgb}</code>
                  <button
                    onClick={() => copyToClipboard(selectedColor.rgb)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">HSL</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono">{selectedColor.hsl}</code>
                  <button
                    onClick={() => copyToClipboard(selectedColor.hsl)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 사용 정보 */}
          <div className="text-xs text-gray-600">
            Used <span className="font-semibold">{selectedColor.count}</span>{' '}
            time{selectedColor.count !== 1 ? 's' : ''} on this page
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {colors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No colors detected</p>
          <p className="text-xs mt-1">Try refreshing the page colors</p>
        </div>
      )}
    </div>
  );
};

export default ColorPalette;
