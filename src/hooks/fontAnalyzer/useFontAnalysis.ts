/**
 * Font Analyzer React Hooks
 *
 * 폰트 분석기 React 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FontInfo,
  FontPair,
  FontAnalysisResult,
  FontAnalyzerSettings,
  WebFontInfo,
  SystemFont,
  FontComparisonResult,
} from '../../types/fontAnalyzer';
import {
  detectAllFonts,
  extractFontInfo,
  suggestFontPair,
} from '../../utils/fontAnalyzer';
import {
  saveAnalysisResult,
  loadAnalysisResults,
  loadLatestResult,
  saveSettings,
  loadSettings,
  addFavoriteFont,
  removeFavoriteFont,
  loadFavoriteFonts,
  saveFontPair,
  loadFontPairs,
  saveSearchHistory,
  loadSearchHistory,
  clearSearchHistory,
  deleteAnalysisResult,
} from '../../utils/fontAnalyzer/storage/fontAnalyzerStorage';
import { FONT_ANALYZER_MESSAGE_ACTIONS } from '../../constants/fontAnalyzerMessages';

interface FontAnalyzerStartResponse {
  success?: boolean;
  result?: FontAnalysisResult;
  optimization?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

interface FontAnalyzerPageAnalysisPayload {
  result: FontAnalysisResult;
  optimization?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

async function getActiveTabId(): Promise<number | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    return null;
  }

  try {
    const currentWindow = await chrome.windows.getCurrent();
    const [tab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
    return tab?.id ?? null;
  } catch {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  }
}

async function requestPageAnalysisFromContent(): Promise<FontAnalyzerPageAnalysisPayload | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs?.sendMessage) {
    return null;
  }

  const tabId = await getActiveTabId();
  if (!tabId) {
    return null;
  }

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: FONT_ANALYZER_MESSAGE_ACTIONS.START_ANALYSIS,
      }) as FontAnalyzerStartResponse;

      if (response?.success && response.result) {
        return {
          result: response.result,
          optimization: response.optimization,
        };
      }
    } catch (error) {
      void error;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return null;
}

/**
 * 폰트 분석 훅
 */
export function useFontAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FontAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const pageAnalysis = await requestPageAnalysisFromContent();
      if (!pageAnalysis) {
        throw new Error('Active page font analysis failed');
      }

      const analysisResult = pageAnalysis.result;

      setResult(analysisResult);
      await saveAnalysisResult(analysisResult);

      return analysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    result,
    error,
    analyze,
    clearResult,
  };
}

/**
 * 요소 폰트 정보 훅
 */
export function useElementFont(element: HTMLElement | null) {
  const [font, setFont] = useState<FontInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!element) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    // 비동기로 폰트 정보 추출
    const timer = setTimeout(() => {
      const fontInfo = extractFontInfo(element);
      setFont(fontInfo);
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [element]);

  return { font, isLoading };
}

/**
 * 페이지의 모든 폰트 훅
 */
export function usePageFonts() {
  const [fonts, setFonts] = useState<FontAnalysisResult['fonts']>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFonts = useCallback(async () => {
    setIsLoading(true);
    try {
      const pageAnalysis = await requestPageAnalysisFromContent();
      setFonts(pageAnalysis?.result.fonts ?? []);
    } catch {
      setFonts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  return { fonts, isLoading, refresh: loadFonts };
}

/**
 * 웹 폰트 훅
 */
export function useWebFonts() {
  const [webFonts, setWebFonts] = useState<WebFontInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadWebFonts = async () => {
      try {
        // 웹 폰트 추출 로직
        if (!cancelled) {
          setWebFonts([]);
        }
      } catch {
        if (!cancelled) {
          setWebFonts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadWebFonts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { webFonts, isLoading };
}

/**
 * 시스템 폰트 훅
 */
export function useSystemFonts() {
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSystemFonts = async () => {
      try {
        // 시스템 폰트 감지
        if (!cancelled) {
          setSystemFonts([]);
        }
      } catch {
        if (!cancelled) {
          setSystemFonts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSystemFonts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { systemFonts, isLoading };
}

/**
 * 폰트 페어 훅
 */
export function useFontPairs(heading?: string, body?: string) {
  const [pairs, setPairs] = useState<FontPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestPairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const suggestions = suggestFontPair(heading, body);
      setPairs(suggestions);

      // 저장된 페어 로드
      const savedPairs = await loadFontPairs();
      const combined = [...suggestions, ...savedPairs]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      setPairs(combined);
    } catch {
      setPairs([]);
    } finally {
      setIsLoading(false);
    }
  }, [heading, body]);

  const savePair = useCallback(async (pair: FontPair) => {
    await saveFontPair(pair);
    await suggestPairs();
  }, [suggestPairs]);

  useEffect(() => {
    suggestPairs();
  }, [suggestPairs]);

  return { pairs, isLoading, refresh: suggestPairs, savePair };
}

/**
 * 폰트 설정 훅
 */
export function useFontSettings() {
  const [settings, setSettingsState] = useState<FontAnalyzerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await loadSettings();
      setSettingsState(stored);
    } catch {
      setSettingsState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<FontAnalyzerSettings>) => {
    try {
      const newSettings = await saveSettings(updates);
      setSettingsState(newSettings);
      return newSettings;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    refresh: loadStoredSettings,
  };
}

/**
 * 즐겨찾는 폰트 훅
 */
export function useFavoriteFonts() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await loadFavoriteFonts();
      setFavorites(stored);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFavorite = useCallback(async (family: string) => {
    await addFavoriteFont(family);
    await loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = useCallback(async (family: string) => {
    await removeFavoriteFont(family);
    await loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    refresh: loadFavorites,
  };
}

/**
 * 폰트 검색 훅
 */
export function useFontSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await loadSearchHistory();
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (searchQuery.trim()) {
          // 검색 결과 처리
          setResults([]);

          // 검색 기록 저장
          await saveSearchHistory(searchQuery);
          await loadHistory();
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    try {
      await clearSearchHistory();
      setHistory([]);
    } catch {
      // ignore
    }
  }, []);

  return {
    query,
    results,
    history,
    isSearching,
    search,
    clearHistory,
  };
}

/**
 * 폰트 비교 훅
 */
export function useFontComparison() {
  const [comparison, setComparison] = useState<FontComparisonResult | null>(null);
  const [element1, setElement1] = useState<HTMLElement | null>(null);
  const [element2, setElement2] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!element1 || !element2) {
      setComparison(null);
      return;
    }

    const compare = async () => {
      const { compareFonts } = await import('../../utils/fontAnalyzer');
      const result = compareFonts(element1, element2);
      setComparison(result);
    };

    compare();
  }, [element1, element2]);

  return {
    comparison,
    element1,
    element2,
    setElement1,
    setElement2,
  };
}

/**
 * 폰트 최적화 체크 훅
 */
export function useFontOptimization() {
  const [score, setScore] = useState<number>(100);
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkOptimization = useCallback(async () => {
    setIsChecking(true);
    try {
      const pageAnalysis = await requestPageAnalysisFromContent();
      if (pageAnalysis?.optimization) {
        setScore(pageAnalysis.optimization.score);
        setIssues(pageAnalysis.optimization.issues);
        setRecommendations(pageAnalysis.optimization.recommendations);
      } else {
        setScore(0);
        setIssues([]);
        setRecommendations([]);
      }
    } catch {
      setScore(0);
      setIssues([]);
      setRecommendations([]);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkOptimization();
  }, [checkOptimization]);

  return {
    score,
    issues,
    recommendations,
    isChecking,
    refresh: checkOptimization,
  };
}

/**
 * 폰트 분석 기록 훅
 */
export function useAnalysisHistory() {
  const [history, setHistory] = useState<FontAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await loadAnalysisResults();
      setHistory(results);
    } catch {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteResult = useCallback(async (timestamp: number) => {
    try {
      await deleteAnalysisResult(timestamp);
      await loadHistory();
    } catch {
      // ignore
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    refresh: loadHistory,
    deleteResult,
  };
}

/**
 * 최신 분석 결과 훅
 */
export function useLatestAnalysis() {
  const [result, setResult] = useState<FontAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const latest = await loadLatestResult();
        if (!cancelled) {
          setResult(latest);
        }
      } catch {
        if (!cancelled) {
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { result, isLoading };
}

/**
 * 폰트 카테고리별 목록 훅
 */
export function useFontsByCategory() {
  const [categorized, setCategorized] = useState<Map<string, FontInfo[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const categorize = async () => {
      setIsLoading(true);
      try {
        const detectionResult = detectAllFonts();
        const categories = new Map<string, FontInfo[]>();

        for (const item of detectionResult.usedFonts) {
          const category = item.category;

          if (!categories.has(category)) {
            categories.set(category, []);
          }

          // Create a FontInfo-like object from the item
          const fontInfo: FontInfo = {
            family: item.family,
            style: 'normal',
            weight: 400,
            size: 16,
            sizeUnit: 'px',
            lineHeight: 1.5,
            letterSpacing: 'normal',
            wordSpacing: 'normal',
            variant: 'normal',
          };

          categories.get(category)!.push(fontInfo);
        }

        setCategorized(categories);
      } catch {
        setCategorized(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    categorize();
  }, []);

  return { categorized, isLoading };
}

/**
 * 폰트 하이라이트 훅
 */
export function useFontHighlight() {
  const [highlightedFont, setHighlightedFont] = useState<string | null>(null);

  const highlight = useCallback((fontFamily: string) => {
    setHighlightedFont(fontFamily);

    // 모든 요소 중 해당 폰트 사용 요소 하이라이트
    const elements = document.querySelectorAll('*');
    for (const element of Array.from(elements)) {
      if (!(element instanceof HTMLElement)) continue;

      const font = extractFontInfo(element);
      if (font && font.family.toLowerCase() === fontFamily.toLowerCase()) {
        element.style.outline = '2px solid #ff0000';
        element.style.outlineOffset = '2px';
      } else {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }
    }
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedFont(null);

    const elements = document.querySelectorAll('*');
    for (const element of Array.from(elements)) {
      if (element instanceof HTMLElement) {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }
    }
  }, []);

  return {
    highlightedFont,
    highlight,
    clearHighlight,
  };
}
