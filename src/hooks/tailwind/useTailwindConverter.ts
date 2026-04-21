/**
 * Tailwind Converter Hook
 *
 * CSS를 Tailwind로 변환하는 기능
 */

import { useState, useCallback } from 'react';
import type { ConversionReport } from '../../types/tailwindScanner';

/**
 * Hook 반환값
 */
interface UseTailwindConverterReturn {
  // 변환 상태
  isConverting: boolean;
  conversionError: string | null;

  // 변환 결과
  currentReport: ConversionReport | null;
  generatedClasses: string;

  // 변환 메서드
  convertCSS: (css: string) => Promise<ConversionReport | null>;
  convertElement: (selector: string) => Promise<ConversionReport | null>;
  convertInlineStyles: () => Promise<ConversionReport | null>;

  // 클래스 생성
  generateClasses: (report: ConversionReport) => string;
  copyClasses: (classes: string) => Promise<boolean>;

  // 설정
  includeArbitrary: boolean;
  setIncludeArbitrary: (include: boolean) => void;
  minConfidence: number;
  setMinConfidence: (confidence: number) => void;
}

/**
 * Tailwind 변환기 Hook
 */
export function useTailwindConverter(): UseTailwindConverterReturn {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<ConversionReport | null>(null);
  const [generatedClasses, setGeneratedClasses] = useState('');
  const [includeArbitrary, setIncludeArbitrary] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.7);

  /**
   * CSS 문자열 변환
   */
  const convertCSS = useCallback(async (css: string): Promise<ConversionReport | null> => {
    setIsConverting(true);
    setConversionError(null);

    try {
      // 현재 탭 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // 콘텐트 스크립트에 변환 요청
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'TAILWIND_CONVERT_CSS',
        data: { css, includeArbitrary, minConfidence },
      });

      if (!response.success) {
        throw new Error(response.error || 'Conversion failed');
      }

      const report = response.data as ConversionReport;
      setCurrentReport(report);
      setGeneratedClasses(generateClassesFromReport(report));

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConversionError(errorMessage);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [includeArbitrary, minConfidence]);

  /**
   * 요소 스타일 변환
   */
  const convertElement = useCallback(async (selector: string): Promise<ConversionReport | null> => {
    setIsConverting(true);
    setConversionError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'TAILWIND_CONVERT_ELEMENT',
        data: { selector, includeArbitrary, minConfidence },
      });

      if (!response.success) {
        throw new Error(response.error || 'Conversion failed');
      }

      const report = response.data as ConversionReport;
      setCurrentReport(report);
      setGeneratedClasses(generateClassesFromReport(report));

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConversionError(errorMessage);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [includeArbitrary, minConfidence]);

  /**
   * 모든 인라인 스타일 변환
   */
  const convertInlineStyles = useCallback(async (): Promise<ConversionReport | null> => {
    setIsConverting(true);
    setConversionError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'TAILWIND_CONVERT_ALL_INLINE',
        data: { includeArbitrary, minConfidence },
      });

      if (!response.success) {
        throw new Error(response.error || 'Conversion failed');
      }

      const report = response.data as ConversionReport;
      setCurrentReport(report);
      setGeneratedClasses(generateClassesFromReport(report));

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConversionError(errorMessage);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [includeArbitrary, minConfidence]);

  /**
   * 리포트에서 클래스 문자열 생성
   */
  const generateClasses = useCallback((report: ConversionReport): string => {
    return generateClassesFromReport(report);
  }, []);

  /**
   * 클래스 클립보드에 복사
   */
  const copyClasses = useCallback(async (classes: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(classes);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isConverting,
    conversionError,
    currentReport,
    generatedClasses,
    convertCSS,
    convertElement,
    convertInlineStyles,
    generateClasses,
    copyClasses,
    includeArbitrary,
    setIncludeArbitrary,
    minConfidence,
    setMinConfidence,
  };
}

/**
 * 리포트에서 클래스 문자열 생성
 */
function generateClassesFromReport(report: ConversionReport): string {
  const classes: string[] = [];

  report.conversions.forEach((conv) => {
    // 신뢰도 필터링
    if (conv.confidence < 0.7) return;

    // 임의 값 필터링
    if (conv.isArbitrary) {
      classes.push(conv.tailwind);
    } else {
      // 표준 클래스
      classes.push(conv.tailwind);
    }
  });

  return classes.join(' ');
}
