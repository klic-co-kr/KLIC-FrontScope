/**
 * Font List Component
 *
 * 폰트 목록 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';

interface FontInfo {
  family: string;
  weights: Set<number>;
  styles: Set<string>;
  usage: number;
}

export const FontList: React.FC = () => {
  const [fonts, setFonts] = useState<FontInfo[]>([]);
  const [selectedFont, setSelectedFont] = useState<FontInfo | null>(null);

  const analyzePageFonts = useCallback(() => {
    const fontMap = new Map<string, FontInfo>();
    const elements = document.querySelectorAll('*');

    for (const element of Array.from(elements)) {
      if (!(element instanceof HTMLElement)) continue;
      if (!element.textContent?.trim()) continue;

      const computedStyle = window.getComputedStyle(element);
      const fontFamily = computedStyle.getPropertyValue('font-family');
      const family = fontFamily.split(',')[0].replace(/['"]/g, '').trim();

      const fontWeight = parseInt(computedStyle.getPropertyValue('font-weight')) || 400;
      const fontStyle = computedStyle.getPropertyValue('font-style');

      if (!fontMap.has(family)) {
        fontMap.set(family, {
          family,
          weights: new Set(),
          styles: new Set(),
          usage: 0,
        });
      }

      const fontData = fontMap.get(family)!;
      fontData.weights.add(fontWeight);
      fontData.styles.add(fontStyle);
      fontData.usage++;
    }

    const sorted = Array.from(fontMap.values()).sort((a, b) => b.usage - a.usage);
    return sorted;
  }, []);

  useEffect(() => {
    const result = analyzePageFonts();
    setFonts(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getWeightLabel = (weight: number): string => {
    if (weight <= 100) return 'Thin';
    if (weight <= 200) return 'Extra Light';
    if (weight <= 300) return 'Light';
    if (weight <= 400) return 'Regular';
    if (weight <= 500) return 'Medium';
    if (weight <= 600) return 'Semi Bold';
    if (weight <= 700) return 'Bold';
    if (weight <= 800) return 'Extra Bold';
    return 'Black';
  };

  return (
    <div className="klic-font-list p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Fonts ({fonts.length})
        </h3>
        <button
          onClick={analyzePageFonts}
          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>

      {/* 폰트 목록 */}
      <div className="space-y-2">
        {fonts.map((font) => (
          <div
            key={font.family}
            onClick={() => setSelectedFont(font)}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all
              ${
                selectedFont?.family === font.family
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {/* 폰트 이름과 사용량 */}
            <div className="flex items-center justify-between mb-2">
              <div
                className="font-medium"
                style={{ fontFamily: font.family }}
              >
                {font.family}
              </div>
              <div className="text-xs text-gray-500">
                {font.usage} uses
              </div>
            </div>

            {/* 웨이트와 스타일 */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex gap-1">
                {Array.from(font.weights)
                  .sort((a, b) => a - b)
                  .map((weight) => (
                    <span
                      key={weight}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {weight}
                    </span>
                  ))}
              </div>
              <div className="flex gap-1">
                {Array.from(font.styles).map((style) => (
                  <span
                    key={style}
                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 폰트 상세 */}
      {selectedFont && (
        <div className="klic-font-detail p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Font Details</h4>
            <button
              onClick={() => setSelectedFont(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 폰트 미리보기 */}
          <div className="mb-4">
            <div
              className="text-2xl p-2 bg-gray-50 rounded border border-gray-200"
              style={{ fontFamily: selectedFont.family }}
            >
              The quick brown fox jumps over the lazy dog.
            </div>
          </div>

          {/* 폰트 정보 */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Family:</span>
              <span className="font-mono">{selectedFont.family}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Usage:</span>
              <span>{selectedFont.usage} element{selectedFont.usage !== 1 ? 's' : ''}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Weights:</span>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedFont.weights)
                  .sort((a, b) => a - b)
                  .map((weight) => (
                    <span
                      key={weight}
                      className="px-2 py-1 bg-gray-100 rounded"
                      style={{ fontFamily: selectedFont.family, fontWeight: weight.toString() }}
                    >
                      {weight} - {getWeightLabel(weight)}
                    </span>
                  ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Styles:</span>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedFont.styles).map((style) => (
                  <span
                    key={style}
                    className="px-2 py-1 bg-gray-100 rounded capitalize"
                    style={{ fontFamily: selectedFont.family, fontStyle: style }}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {fonts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No fonts detected</p>
          <p className="text-xs mt-1">Try refreshing the page fonts</p>
        </div>
      )}
    </div>
  );
};

export default FontList;
