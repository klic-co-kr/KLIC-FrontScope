/**
 * Tailwind Scanner Hook
 *
 * Tailwind 스캔 및 분석 기능
 */

import { useState, useCallback, useEffect } from 'react';
import type { TailwindScanResult, ScanHistoryItem } from '../../types/tailwindScanner';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { DEFAULT_TAILWIND_SETTINGS } from '../../constants/defaults';
import type { TailwindSettings } from '../../types/tailwindScanner';

/**
 * Hook 반환값
 */
interface UseTailwindScannerReturn {
  // 스캔 결과
  currentScan: TailwindScanResult | null;
  isScanning: boolean;
  scanError: string | null;

  // 히스토리
  history: ScanHistoryItem[];
  maxHistory: number;

  // 설정
  settings: TailwindSettings;

  // 메서드
  scanCurrentPage: () => Promise<TailwindScanResult | null>;
  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  exportHistory: () => Promise<string>;
  updateSettings: (settings: Partial<TailwindSettings>) => Promise<void>;

  // 재로드
  reload: () => Promise<void>;
}

/**
 * Tailwind 스캐너 Hook
 */
export function useTailwindScanner(): UseTailwindScannerReturn {
  const [currentScan, setCurrentScan] = useState<TailwindScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [settings, setSettings] = useState<TailwindSettings>(DEFAULT_TAILWIND_SETTINGS);

  const maxHistory = STORAGE_LIMITS.TAILWIND_MAX_HISTORY;

  /**
   * 설정 로드
   */
  const loadSettings = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.TAILWIND_SETTINGS);
      setSettings((result[STORAGE_KEYS.TAILWIND_SETTINGS] as TailwindSettings) || DEFAULT_TAILWIND_SETTINGS);
    } catch (error) {
      console.error('Failed to load Tailwind settings:', error);
    }
  }, []);

  /**
   * 히스토리 로드
   */
  const loadHistory = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.TAILWIND_HISTORY);
      const historyData = (result[STORAGE_KEYS.TAILWIND_HISTORY] as ScanHistoryItem[]) || [];
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load Tailwind history:', error);
    }
  }, []);

  /**
   * 현재 페이지 스캔
   */
  const scanCurrentPage = useCallback(async (): Promise<TailwindScanResult | null> => {
    setIsScanning(true);
    setScanError(null);

    try {
      // 현재 탭 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // 콘텐트 스크립트에 스캔 요청
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'TAILWIND_SCAN',
      });

      if (!response.success) {
        throw new Error(response.error || 'Scan failed');
      }

      const scanResult = response.data as TailwindScanResult;
      setCurrentScan(scanResult);

      // 히스토리에 추가
      if (settings.autoScan) {
        const historyItem: ScanHistoryItem = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          url: tab.url || '',
          title: tab.title || '',
          totalClasses: scanResult.totalClasses,
          result: scanResult,
        };

        const updatedHistory = [historyItem, ...history].slice(0, maxHistory);
        await chrome.storage.local.set({ [STORAGE_KEYS.TAILWIND_HISTORY]: updatedHistory });
        setHistory(updatedHistory);
      }

      return scanResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setScanError(errorMessage);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [history, maxHistory, settings.autoScan]);

  /**
   * 히스토리 지우기
   */
  const clearHistory = useCallback(async () => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.TAILWIND_HISTORY]: [] });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear Tailwind history:', error);
    }
  }, []);

  /**
   * 히스토리 항목 삭제
   */
  const deleteHistoryItem = useCallback(async (id: string) => {
    try {
      const updatedHistory = history.filter((item) => item.id !== id);
      await chrome.storage.local.set({ [STORAGE_KEYS.TAILWIND_HISTORY]: updatedHistory });
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  }, [history]);

  /**
   * 히스토리 내보내기
   */
  const exportHistory = useCallback(async () => {
    try {
      return JSON.stringify(history, null, 2);
    } catch (error) {
      console.error('Failed to export history:', error);
      return '[]';
    }
  }, [history]);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback(async (newSettings: Partial<TailwindSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await chrome.storage.local.set({ [STORAGE_KEYS.TAILWIND_SETTINGS]: updatedSettings });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }, [settings]);

  /**
   * 재로드
   */
  const reload = useCallback(async () => {
    await Promise.all([
      loadSettings(),
      loadHistory(),
    ]);
  }, [loadSettings, loadHistory]);

  // 초기 로드
  useEffect(() => {
    reload();
  }, [reload]);

  return {
    currentScan,
    isScanning,
    scanError,
    history,
    maxHistory,
    settings,
    scanCurrentPage,
    clearHistory,
    deleteHistoryItem,
    exportHistory,
    updateSettings,
    reload,
  };
}
