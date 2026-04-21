/**
 * CSS Scan Hook
 *
 * CSS 스캔 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { CSSScanResult, ElementStyleInfo } from '../../types/cssScan';
import { extractElementStyle } from '../../utils/cssScan/styleExtractor';
import { extractColorInfo } from '../../utils/cssScan/colorAnalyzer';
import { extractFontInfo } from '../../utils/cssScan/fontAnalyzer';
import { extractBoxModel } from '../../utils/cssScan/boxModel';
import {
  extractFlexInfo,
  findFlexContainers,
} from '../../utils/cssScan/flexboxAnalyzer';
import {
  extractGridInfo,
  findGridContainers,
} from '../../utils/cssScan/gridAnalyzer';

export interface UseCSSScanOptions {
  includeComputed?: boolean;
  includeInherited?: boolean;
  includeAnimations?: boolean;
}

export interface UseCSSScanReturn {
  // 상태
  selectedElement: HTMLElement | null;
  elementStyle: ElementStyleInfo | null;
  colors: ReturnType<typeof extractColorInfo>;
  font: ReturnType<typeof extractFontInfo> | null;
  boxModel: ReturnType<typeof extractBoxModel> | null;
  flexInfo: ReturnType<typeof extractFlexInfo> | null;
  gridInfo: ReturnType<typeof extractGridInfo> | null;
  isScanning: boolean;
  error: string | null;

  // 작업
  selectElement: (element: HTMLElement | null) => void;
  scanElement: (element: HTMLElement) => void;
  clearSelection: () => void;
  startScanning: () => void;
  stopScanning: () => void;

  // 전체 스캔
  scanAll: () => Promise<CSSScanResult | null>;
}

/**
 * CSS 스캔 Hook
 */
export function useCSSScan(
  options: UseCSSScanOptions = {}
): UseCSSScanReturn {
  const { includeComputed = true, includeInherited = false, includeAnimations = false } = options;

  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [elementStyle, setElementStyle] = useState<ElementStyleInfo | null>(null);
  const [colors, setColors] = useState<ReturnType<typeof extractColorInfo>>([]);
  const [font, setFont] = useState<ReturnType<typeof extractFontInfo> | null>(null);
  const [boxModel, setBoxModel] = useState<ReturnType<typeof extractBoxModel> | null>(null);
  const [flexInfo, setFlexInfo] = useState<ReturnType<typeof extractFlexInfo> | null>(null);
  const [gridInfo, setGridInfo] = useState<ReturnType<typeof extractGridInfo> | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 요소 선택
  const selectElement = useCallback((element: HTMLElement | null) => {
    setSelectedElement(element);

    if (!element) {
      setElementStyle(null);
      setColors([]);
      setFont(null);
      setBoxModel(null);
      setFlexInfo(null);
      setGridInfo(null);
      setError(null);
      return;
    }

    try {
      // 스타일 추출
      const style = extractElementStyle(element, {
        includeComputed,
        includeInherited,
        includeAnimations,
      });
      setElementStyle(style);

      // 색상 추출
      const colorInfo = extractColorInfo(element);
      setColors(colorInfo);

      // 폰트 추출
      const fontInfo = extractFontInfo(element);
      setFont(fontInfo);

      // 박스 모델
      const box = extractBoxModel(element);
      setBoxModel(box);

      // 플렉스 정보
      const flex = extractFlexInfo(element);
      setFlexInfo(flex);

      // 그리드 정보
      const grid = extractGridInfo(element);
      setGridInfo(grid);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [includeComputed, includeInherited, includeAnimations]);

  // 요소 스캔
  const scanElement = useCallback((element: HTMLElement) => {
    selectElement(element);
  }, [selectElement]);

  // 선택 해제
  const clearSelection = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  // 스캔 시작
  const startScanning = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  // 스캔 중지
  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  // 전체 페이지 스캔
  const scanAll = useCallback(async () => {
    try {
      const startTime = Date.now();

      // 모든 요소 수집
      const elements = document.querySelectorAll('*');
      const scannedElements: ElementStyleInfo[] = [];

      // 색상 수집
      const colorSet = new Set<string>();
      // 폰트 수집
      const fontSet = new Set<string>();

      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        // 텍스트 요소만
        if (!element.textContent?.trim()) continue;

        const style = extractElementStyle(element, {
          includeComputed: true,
          includeInherited: false,
        });

        scannedElements.push(style);

        // 색상 수집
        const colors = extractColorInfo(element);
        for (const color of colors) {
          colorSet.add(color.hex);
        }

        // 폰트 수집
        const fontInfo = extractFontInfo(element);
        if (fontInfo) {
          fontSet.add(fontInfo.family);
        }
      }

      // 스타일시트 정보
      const stylesheets = Array.from(document.styleSheets).map(sheet => ({
        id: `sheet-${Math.random().toString(36).substr(2, 9)}`,
        href: sheet.href || 'inline',
        disabled: sheet.disabled,
        rules: [],
        imports: [],
        media: [],
      }));

      const result: CSSScanResult = {
        timestamp: startTime,
        url: window.location.href,
        title: document.title,
        elements: scannedElements,
        stylesheets,
        summary: {
          totalElements: scannedElements.length,
          totalRules: scannedElements.reduce((sum, s) => sum + s.matchedRules.length, 0),
          totalStylesheets: stylesheets.length,
          uniqueFonts: Array.from(fontSet),
          uniqueColors: Array.from(colorSet),
        },
      };

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      return null;
    }
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      setSelectedElement(null);
    };
  }, []);

  return {
    selectedElement,
    elementStyle,
    colors,
    font,
    boxModel,
    flexInfo,
    gridInfo,
    isScanning,
    error,
    selectElement,
    scanElement,
    clearSelection,
    startScanning,
    stopScanning,
    scanAll,
  };
}

/**
 * 플렉스 컨테이너 탐지 Hook
 */
export function useFlexContainers() {
  const [containers, setContainers] = useState<HTMLElement[]>([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    const found = findFlexContainers();
    setContainers(found);
    setCount(found.length);
  }, []);

  // Initial load
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const found = findFlexContainers();
    setContainers(found);
    setCount(found.length);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    // DOM 변경 감지
    const observer = new MutationObserver(() => {
      const found = findFlexContainers();
      setContainers(found);
      setCount(found.length);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return { containers, count, refresh };
}

/**
 * 그리드 컨테이너 탐지 Hook
 */
export function useGridContainers() {
  const [containers, setContainers] = useState<HTMLElement[]>([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    const found = findGridContainers();
    setContainers(found);
    setCount(found.length);
  }, []);

  // Initial load
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const found = findGridContainers();
    setContainers(found);
    setCount(found.length);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    // DOM 변경 감지
    const observer = new MutationObserver(() => {
      const found = findGridContainers();
      setContainers(found);
      setCount(found.length);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return { containers, count, refresh };
}

/**
 * 페이지 색상 통계 Hook
 */
export function usePageColors() {
  const [colors, setColors] = useState<Array<{
    color: string;
    count: number;
    percentage: number;
  }>>([]);
  const [uniqueCount, setUniqueCount] = useState(0);

  const analyze = useCallback(() => {
    const colorMap = new Map<string, number>();
    const elements = document.querySelectorAll('*');

    for (const element of Array.from(elements)) {
      if (!(element instanceof HTMLElement)) continue;

      const computedStyle = window.getComputedStyle(element);
      const properties = ['color', 'background-color', 'border-color'];

      for (const prop of properties) {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
          colorMap.set(value, (colorMap.get(value) || 0) + 1);
        }
      }
    }

    const total = Array.from(colorMap.values()).reduce((sum, count) => sum + count, 0);

    const sorted = Array.from(colorMap.entries())
      .map(([color, count]) => ({
        color,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    setColors(sorted);
    setUniqueCount(colorMap.size);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    analyze();
  }, [analyze]);

  return { colors, uniqueCount, analyze };
}

/**
 * 페이지 폰트 통계 Hook
 */
export function usePageFonts() {
  const [fonts, setFonts] = useState<Array<{
    family: string;
    weights: Set<number>;
    styles: Set<string>;
    usage: number;
  }>>([]);
  const [uniqueCount, setUniqueCount] = useState(0);

  const analyze = useCallback(() => {
    const fontMap = new Map<string, {
      weights: Set<number>;
      styles: Set<string>;
      usage: number;
    }>();

    const elements = document.querySelectorAll('*');

    for (const element of Array.from(elements)) {
      if (!(element instanceof HTMLElement)) continue;

      const computedStyle = window.getComputedStyle(element);
      const fontFamily = computedStyle.getPropertyValue('font-family');
      const family = fontFamily.split(',')[0].replace(/['"]/g, '').trim();

      if (!fontMap.has(family)) {
        fontMap.set(family, {
          weights: new Set(),
          styles: new Set(),
          usage: 0,
        });
      }

      const data = fontMap.get(family)!;

      const fontWeight = parseInt(computedStyle.getPropertyValue('font-weight')) || 400;
      data.weights.add(fontWeight);

      const fontStyle = computedStyle.getPropertyValue('font-style');
      data.styles.add(fontStyle);

      data.usage++;
    }

    const sorted = Array.from(fontMap.entries())
      .map(([family, data]) => ({
        family,
        weights: data.weights,
        styles: data.styles,
        usage: data.usage,
      }))
      .sort((a, b) => b.usage - a.usage);

    setFonts(sorted);
    setUniqueCount(fontMap.size);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    analyze();
  }, [analyze]);

  return { fonts, uniqueCount, analyze };
}
