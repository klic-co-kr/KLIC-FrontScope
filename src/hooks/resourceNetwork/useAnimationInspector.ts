/**
 * Animation Inspector Hook
 *
 * 애니메이션 검사 및 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationInfo } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';
import {
  scanCSSAnimations,
  pauseAllCSSAnimations,
  resumeAllCSSAnimations,
} from '../../utils/resourceNetwork/animation/cssAnimationScanner';
import {
  detectRAFUsage,
  detectAnimationLibraries,
  measureFPS,
  startFPSMonitoring,
  stopRAFMonitoring,
  getActiveWebAnimations,
} from '../../utils/resourceNetwork/animation/jsAnimationScanner';
import {
  analyzeAnimationPerformance,
  getOptimizationSuggestions,
  getPerformanceGrade,
  generateAnimationStatistics,
  AnimationPerformanceReport,
} from '../../utils/resourceNetwork/animation/performanceAnalyzer';

export function useAnimationInspector() {
  const [animations, setAnimations] = useState<AnimationInfo[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [performanceReport, setPerformanceReport] =
    useState<AnimationPerformanceReport | null>(null);
  const [currentFPS, setCurrentFPS] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedLibraries, setDetectedLibraries] = useState<string[]>([]);
  const [settings, setSettings] = useState(
    DEFAULT_RESOURCE_NETWORK_SETTINGS.animation
  );

  const fpsMonitorRefRef = useRef<(() => void) | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // 초기 스캔
  useEffect(() => {
    loadSettings();
    scanAnimations();

    return () => {
      // 정리
      if (fpsMonitorRefRef.current) {
        fpsMonitorRefRef.current();
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      stopRAFMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 설정 불러오기
  const loadSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        const savedSettings = result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] as typeof DEFAULT_RESOURCE_NETWORK_SETTINGS | undefined;
        if (savedSettings?.animation) {
          setSettings(savedSettings.animation);
        }
      }
    } catch (error) {
      console.error('Failed to load animation settings:', error);
    }
  };

  // FPS 모니터링 시작
  const startFPSMonitor = useCallback(() => {
    if (fpsMonitorRefRef.current) {
      fpsMonitorRefRef.current(); // 기존 모니터 정지
    }

    fpsMonitorRefRef.current = startFPSMonitoring((fps) => {
      setCurrentFPS(fps);
    }, 1000);
  }, []);

  // FPS 모니터링 정지
  const stopFPSMonitor = useCallback(() => {
    if (fpsMonitorRefRef.current) {
      fpsMonitorRefRef.current();
      fpsMonitorRefRef.current = null;
    }
    setCurrentFPS(null);
  }, []);

  // 애니메이션 스캔
  const scanAnimations = useCallback(async () => {
    setIsScanning(true);

    try {
      // CSS 애니메이션 스캔
      const cssAnimations = scanCSSAnimations();

      // JS 애니메이션 라이브러리 감지
      const libraries = detectAnimationLibraries();
      setDetectedLibraries(libraries);

      // Web Animation API 감지 (실제 실행 중인 애니메이션)
      getActiveWebAnimations();

      // RAF 사용 감지 (비동기)
      detectRAFUsage();

      // 모든 애니메이션 합치기
      const allAnimations: AnimationInfo[] = [
        ...cssAnimations,
        // JS 애니메이션은 실시간 감지가 어려우므로 라이브러리만 표시
        ...libraries.map((lib, idx) => ({
          id: `js-lib-${lib}-${idx}`,
          type: 'js' as const,
          library: lib as string,
          frameCount: 0,
          estimatedFPS: 60,
          affectsPerformance: 'low' as const,
        })),
      ];

      setAnimations(allAnimations);

      // 성능 분석
      const report = analyzeAnimationPerformance(allAnimations);
      setPerformanceReport(report);
    } catch (error) {
      console.error('Failed to scan animations:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // 자동 스캔 설정
  const enableAutoScan = useCallback((intervalMs: number = 5000) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(() => {
      scanAnimations();
    }, intervalMs) as unknown as number;
  }, [scanAnimations]);

  const disableAutoScan = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  // 모든 애니메이션 일시정지
  const pauseAll = useCallback(() => {
    pauseAllCSSAnimations();
    setIsPaused(true);
  }, []);

  // 모든 애니메이션 재개
  const resumeAll = useCallback(() => {
    resumeAllCSSAnimations();
    setIsPaused(false);
  }, []);

  // 특정 애니메이션 토글
  const toggleAnimation = useCallback((id: string) => {
    const animation = animations.find((a) => a.id === id);
    if (animation && animation.type === 'css') {
      const element = document.querySelector(animation.element);
      if (element) {
        const current = (element as HTMLElement).style.animationPlayState;
        (element as HTMLElement).style.animationPlayState =
          current === 'paused' ? 'running' : 'paused';
      }
    }
  }, [animations]);

  // 성능 영향별 필터링
  const getAnimationsByImpact = useCallback(
    (impact: 'low' | 'medium' | 'high') => {
      return animations.filter((a) => a.affectsPerformance === impact);
    },
    [animations]
  );

  // 최적화 제안 가져오기
  const getOptimizations = useCallback(() => {
    return getOptimizationSuggestions(animations);
  }, [animations]);

  // 성능 등급 가져오기
  const getGrade = useCallback(() => {
    if (!performanceReport) return null;
    return getPerformanceGrade(performanceReport.score);
  }, [performanceReport]);

  // 통계 정보 가져오기
  const getStatistics = useCallback(() => {
    return generateAnimationStatistics(animations);
  }, [animations]);

  // FPS 측정
  const measureCurrentFPS = useCallback(async () => {
    const fps = await measureFPS(1000);
    setCurrentFPS(fps);
    return fps;
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback(async (newSettings: typeof settings) => {
    setSettings(newSettings);

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        const existing = (result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] as typeof DEFAULT_RESOURCE_NETWORK_SETTINGS | undefined) || {};

        await chrome.storage.local.set({
          [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: {
            ...existing,
            animation: newSettings,
          },
        });
      }
    } catch (error) {
      console.error('Failed to save animation settings:', error);
    }
  }, []);

  // 하이라이트 토글 설정
  const toggleHighlight = useCallback(() => {
    const newSettings = {
      ...settings,
      highlightOnHover: !settings.highlightOnHover,
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  // 성능 영향 표시 설정
  const togglePerformanceImpact = useCallback(() => {
    const newSettings = {
      ...settings,
      showPerformanceImpact: !settings.showPerformanceImpact,
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  return {
    // 상태
    animations,
    isPaused,
    performanceReport,
    currentFPS,
    isScanning,
    detectedLibraries,
    settings,

    // 액션
    scanAnimations,
    pauseAll,
    resumeAll,
    toggleAnimation,
    getAnimationsByImpact,
    getOptimizations,
    getGrade,
    getStatistics,
    measureCurrentFPS,
    startFPSMonitor,
    stopFPSMonitor,
    enableAutoScan,
    disableAutoScan,

    // 설정
    toggleHighlight,
    togglePerformanceImpact,
    updateSettings,
  };
}
