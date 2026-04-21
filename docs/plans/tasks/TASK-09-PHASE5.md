# Phase 5: Storage

**태스크**: 2개
**예상 시간**: 1시간
**의존성**: Phase 1-4 완료

---

### Task #9.29: Storage 기본 CRUD

- **파일**: `src/hooks/tailwind/useTailwindStorage.ts`
- **시간**: 30분
- **의존성**: Task #9.1, #9.2
- **상세 내용**:
```typescript
import { STORAGE_KEYS } from '../constants/storage';
import { TailwindConfig, TailwindDetectionResult, ConversionReport } from '../types/tailwindScanner';

/**
 * 스캔 결과 저장
 */
export async function saveScanResult(result: TailwindDetectionResult): Promise<boolean> {
  try {
    const { TAILWIND_SCAN_HISTORY } = STORAGE_KEYS;

    // 기존 히스토리 가져오기
    const { [TAILWIND_SCAN_HISTORY]: history = [] } = await chrome.storage.local.get(TAILWIND_SCAN_HISTORY);

    // 새 결과 추가
    const newHistory = [
      {
        ...result,
        timestamp: Date.now(),
        url: window.location.href,
      },
      ...history.slice(0, 14), // 최대 15개 유지
    ];

    await chrome.storage.local.set({ [TAILWIND_SCAN_HISTORY]: newHistory });

    return true;
  } catch (error) {
    console.error('Failed to save scan result:', error);
    return false;
  }
}

/**
 * 스캔 히스토리 가져오기
 */
export async function getScanHistory(): Promise<Array<TailwindDetectionResult & { timestamp: number; url: string }>> {
  try {
    const { TAILWIND_SCAN_HISTORY } = STORAGE_KEYS;
    const { [TAILWIND_SCAN_HISTORY]: history = [] } = await chrome.storage.local.get(TAILWIND_SCAN_HISTORY);

    return history;
  } catch (error) {
    console.error('Failed to get scan history:', error);
    return [];
  }
}

/**
 * 설정 저장
 */
export async function saveTailwindConfig(config: TailwindConfig, url: string): Promise<boolean> {
  try {
    const { TAILWIND_CONFIGS } = STORAGE_KEYS;

    const { [TAILWIND_CONFIGS]: configs = {} } = await chrome.storage.local.get(TAILWIND_CONFIGS);

    configs[url] = {
      ...config,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ [TAILWIND_CONFIGS]: configs });

    return true;
  } catch (error) {
    console.error('Failed to save config:', error);
    return false;
  }
}

/**
 * 설정 가져오기
 */
export async function getTailwindConfig(url: string): Promise<TailwindConfig | null> {
  try {
    const { TAILWIND_CONFIGS } = STORAGE_KEYS;
    const { [TAILWIND_CONFIGS]: configs = {} } = await chrome.storage.local.get(TAILWIND_CONFIGS);

    return configs[url]?.config || null;
  } catch (error) {
    console.error('Failed to get config:', error);
    return null;
  }
}

/**
 * 변환 리포트 저장
 */
export async function saveConversionReport(report: ConversionReport): Promise<boolean> {
  try {
    const { TAILWIND_CACHE } = STORAGE_KEYS;

    const { [TAILWIND_CACHE]: cache = {} } = await chrome.storage.local.get(TAILWIND_CACHE);

    cache[report.element.selector] = {
      report,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ [TAILWIND_CACHE]: cache });

    return true;
  } catch (error) {
    console.error('Failed to save conversion report:', error);
    return false;
  }
}

/**
 * 캐시 정리
 */
export async function clearTailwindCache(): Promise<boolean> {
  try {
    const { TAILWIND_CACHE } = STORAGE_KEYS;
    await chrome.storage.local.remove(TAILWIND_CACHE);

    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}
```
- **완료 조건**: 안정적인 CRUD 동작

---

### Task #9.30: 히스토리 관리

- **파일**: `src/hooks/tailwind/useTailwindHistory.ts`
- **시간**: 30분
- **의존성**: Task #9.29
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { getScanHistory, saveScanResult } from './useTailwindStorage';
import { TailwindDetectionResult } from '../types/tailwindScanner';

export function useTailwindHistory() {
  const [history, setHistory] = useState<Array<TailwindDetectionResult & { timestamp: number; url: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const result = await getScanHistory();
    setHistory(result);
    setLoading(false);
  };

  const addResult = async (result: TailwindDetectionResult) => {
    const success = await saveScanResult(result);

    if (success) {
      await loadHistory();
    }

    return success;
  };

  const clearHistory = async () => {
    try {
      const { TAILWIND_SCAN_HISTORY } = STORAGE_KEYS;
      await chrome.storage.local.remove(TAILWIND_SCAN_HISTORY);
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getHistoryForUrl = (url: string) => {
    return history.filter(item => item.url === url);
  };

  const getLatestResult = () => {
    return history.length > 0 ? history[0] : null;
  };

  return {
    history,
    loading,
    addResult,
    clearHistory,
    getHistoryForUrl,
    getLatestResult,
  };
}
```
- **완료 조건**: 히스토리 관리 정상 동작

---

[Phase 6: React 컴포넌트](./TASK-09-PHASE6.md) 로 계속
