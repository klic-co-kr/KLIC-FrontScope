/**
 * Font Analyzer Storage Utilities
 *
 * 폰트 분석기 스토리지 유틸리티
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  FontAnalysisResult,
  FontAnalyzerSettings,
  FontPair,
  WebFontInfo,
} from '../../../types/fontAnalyzer';
import {
  FONT_ANALYZER_STORAGE_KEYS,
  DEFAULT_FONT_ANALYZER_SETTINGS,
} from '../../../constants/fontAnalyzerStorage';

/**
 * 분석 결과 저장
 */
export async function saveAnalysisResult(
  result: FontAnalysisResult
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS], (data: any) => {
        const results = data[FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS] || [];
        results.unshift(result); // 최신 결과가 앞에 오도록

        // 최대 100개까지만 저장
        const trimmedResults = results.slice(0, 100);

        chrome.storage.local.set(
          {
            [FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS]: trimmedResults,
            [FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT]: result,
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      });
    } else {
      // Fallback for content script without chrome.storage
      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS,
        JSON.stringify([result])
      );
      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT,
        JSON.stringify(result)
      );
      resolve();
    }
  });
}

/**
 * 모든 분석 결과 불러오기
 */
export async function loadAnalysisResults(): Promise<FontAnalysisResult[]> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS],
        (data: any) => {
          resolve(data[FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS] || []);
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS
      );
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
}

/**
 * 최신 분석 결과 불러오기
 */
export async function loadLatestResult(): Promise<FontAnalysisResult | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT],
        (data: any) => {
          resolve(data[FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT] || null);
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT
      );
      resolve(stored ? JSON.parse(stored) : null);
    }
  });
}

/**
 * 설정 저장
 */
export async function saveSettings(
  settings: Partial<FontAnalyzerSettings>
): Promise<FontAnalyzerSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.SETTINGS],
        (data: any) => {
          const currentSettings = {
            ...DEFAULT_FONT_ANALYZER_SETTINGS,
            ...data[FONT_ANALYZER_STORAGE_KEYS.SETTINGS],
          };
          const newSettings = { ...currentSettings, ...settings };

          chrome.storage.local.set(
            {
              [FONT_ANALYZER_STORAGE_KEYS.SETTINGS]: newSettings,
            },
            () => {
              resolve(newSettings);
            }
          );
        }
      );
    } else {
      const stored = localStorage.getItem(FONT_ANALYZER_STORAGE_KEYS.SETTINGS);
      const currentSettings = stored
        ? { ...DEFAULT_FONT_ANALYZER_SETTINGS, ...JSON.parse(stored) }
        : DEFAULT_FONT_ANALYZER_SETTINGS;
      const newSettings = { ...currentSettings, ...settings };

      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.SETTINGS,
        JSON.stringify(newSettings)
      );
      resolve(newSettings);
    }
  });
}

/**
 * 설정 불러오기
 */
export async function loadSettings(): Promise<FontAnalyzerSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([FONT_ANALYZER_STORAGE_KEYS.SETTINGS], (data: any) => {
        resolve({
          ...DEFAULT_FONT_ANALYZER_SETTINGS,
          ...data[FONT_ANALYZER_STORAGE_KEYS.SETTINGS],
        });
      });
    } else {
      const stored = localStorage.getItem(FONT_ANALYZER_STORAGE_KEYS.SETTINGS);
      resolve(
        stored
          ? { ...DEFAULT_FONT_ANALYZER_SETTINGS, ...JSON.parse(stored) }
          : DEFAULT_FONT_ANALYZER_SETTINGS
      );
    }
  });
}

/**
 * 즐겨찾는 폰트 추가
 */
export async function addFavoriteFont(family: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS],
        (data: any) => {
          const favorites = data[FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS] || [];
          if (!favorites.includes(family)) {
            favorites.push(family);
            chrome.storage.local.set(
              {
                [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS]: favorites,
              },
              () => resolve()
            );
          } else {
            resolve();
          }
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS
      );
      const favorites = stored ? JSON.parse(stored) : [];
      if (!favorites.includes(family)) {
        favorites.push(family);
        localStorage.setItem(
          FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS,
          JSON.stringify(favorites)
        );
      }
      resolve();
    }
  });
}

/**
 * 즐겨찾는 폰트 제거
 */
export async function removeFavoriteFont(family: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS],
        (data: any) => {
          const favorites = (data[FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS] || [])
            .filter((f: string) => f !== family);

          chrome.storage.local.set(
            {
              [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS]: favorites,
            },
            () => resolve()
          );
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS
      );
      const favorites = (stored ? JSON.parse(stored) : []).filter(
        (f: string) => f !== family
      );
      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS,
        JSON.stringify(favorites)
      );
      resolve();
    }
  });
}

/**
 * 즐겨찾는 폰트 목록 불러오기
 */
export async function loadFavoriteFonts(): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS],
        (data: any) => {
          resolve(data[FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS] || []);
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS
      );
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
}

/**
 * 폰트 페어 저장
 */
export async function saveFontPair(pair: FontPair): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS],
        (data: any) => {
          const pairs = data[FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS] || [];
          const exists = pairs.some(
            (p: FontPair) => p.heading === pair.heading && p.body === pair.body
          );

          if (!exists) {
            pairs.unshift(pair);
            chrome.storage.local.set(
              {
                [FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS]: pairs.slice(0, 50),
              },
              () => resolve()
            );
          } else {
            resolve();
          }
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS
      );
      const pairs = stored ? JSON.parse(stored) : [];
      const exists = pairs.some(
        (p: FontPair) => p.heading === pair.heading && p.body === pair.body
      );

      if (!exists) {
        pairs.unshift(pair);
        localStorage.setItem(
          FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS,
          JSON.stringify(pairs.slice(0, 50))
        );
      }
      resolve();
    }
  });
}

/**
 * 폰트 페어 목록 불러오기
 */
export async function loadFontPairs(): Promise<FontPair[]> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS], (data: any) => {
        resolve(data[FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS] || []);
      });
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS
      );
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
}

/**
 * 검색 기록 저장
 */
export async function saveSearchHistory(query: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY],
        (data: any) => {
          const history = data[FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY] || [];

          // 중복 제거
          const filtered = history.filter((h: string) => h !== query);
          filtered.unshift(query);

          chrome.storage.local.set(
            {
              [FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY]: filtered.slice(0, 20),
            },
            () => resolve()
          );
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY
      );
      const history = stored ? JSON.parse(stored) : [];
      const filtered = history.filter((h: string) => h !== query);
      filtered.unshift(query);

      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(filtered.slice(0, 20))
      );
      resolve();
    }
  });
}

/**
 * 검색 기록 불러오기
 */
export async function loadSearchHistory(): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY],
        (data: any) => {
          resolve(data[FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY] || []);
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY
      );
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
}

/**
 * 검색 기록 비우기
 */
export async function clearSearchHistory(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set(
        {
          [FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY]: [],
        },
        () => resolve()
      );
    } else {
      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify([])
      );
      resolve();
    }
  });
}

/**
 * 웹 폰트 캐시 저장
 */
export async function saveWebFontCache(
  fonts: WebFontInfo[]
): Promise<void> {
  return new Promise((resolve) => {
    const cacheData = {
      timestamp: Date.now(),
      fonts,
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set(
        {
          [FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE]: cacheData,
        },
        () => resolve()
      );
    } else {
      localStorage.setItem(
        FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE,
        JSON.stringify(cacheData)
      );
      resolve();
    }
  });
}

/**
 * 웹 폰트 캐시 불러오기
 */
export async function loadWebFontCache(
  maxAge: number = 3600000 // 1 hour
): Promise<WebFontInfo[] | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE],
        (data: any) => {
          const cached = data[FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE];
          if (cached && Date.now() - cached.timestamp < maxAge) {
            resolve(cached.fonts);
          } else {
            resolve(null);
          }
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE
      );
      if (stored) {
        const cached = JSON.parse(stored);
        if (Date.now() - cached.timestamp < maxAge) {
          resolve(cached.fonts);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    }
  });
}

/**
 * 모든 데이터 초기화
 */
export async function clearAllData(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.clear(() => resolve());
    } else {
      Object.values(FONT_ANALYZER_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      resolve();
    }
  });
}

/**
 * 분석 결과 삭제
 */
export async function deleteAnalysisResult(timestamp: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(
        [FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS],
        (data: any) => {
          const results = (data[FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS] || [])
            .filter((r: FontAnalysisResult) => r.timestamp !== timestamp);

          chrome.storage.local.set(
            {
              [FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS]: results,
            },
            () => resolve()
          );
        }
      );
    } else {
      const stored = localStorage.getItem(
        FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS
      );
      if (stored) {
        const results = JSON.parse(stored).filter(
          (r: FontAnalysisResult) => r.timestamp !== timestamp
        );
        localStorage.setItem(
          FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS,
          JSON.stringify(results)
        );
      }
      resolve();
    }
  });
}
