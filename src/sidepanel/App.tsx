import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Settings, GripVertical, RotateCcw } from 'lucide-react';
import { ALL_TOOLS, ToolType, isExclusiveTool, ToolInfo } from './constants/tools';
import { ToolRouter } from './components/ToolRouter';
import { useToolSwitcher } from './hooks/useToolSwitcher';
import { ErrorBoundary } from './components/LoadingStates';
import type { CssScanToolData } from '@/types/cssScan';
import type { ConsoleHistory, ConsoleLog, LogLevel } from '@/types/console';
import type { JsInspectorResult } from '@/types/jsInspector';
import type { SettingsPanelProps } from './components/SettingsPanel';
import { ThemeProvider } from '@/lib/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/i18n/react';
import { useTranslation } from 'react-i18next';
import { resetTool } from '@/utils/toolReset';
import { STORAGE_KEYS, STORAGE_LIMITS } from '@/constants/storage';
import { MODAL_MESSAGE_TYPES, type ModalMessageType } from '@/constants/messages';
import { lazyWithRetry } from './utils/lazyWithRetry';

const LazySettingsPanel = lazyWithRetry<SettingsPanelProps>(() =>
  import('./components/SettingsPanel').then((module) => ({
    default: module.SettingsPanel,
  })),
  'klic:lazy-retry:settings-panel',
);

/**
 * 도구 상태 인터페이스
 */
interface ToolState {
  isActive: boolean;
  hasUnsavedChanges: boolean;
  lastActivity: number;
}

/**
 * 앱 상태 인터페이스
 */
interface AppState {
  tools: Record<ToolType, ToolState>;
  currentTool: ToolType | null;
  allTabsAppliedTool: ToolType | null;
  sidebarOpen: boolean;
}

/**
 * Tool Data States
 */
export interface ToolData {
  fontResult: { family: string; weights: string[] }[];
  fontElementInfo: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    color: string;
    backgroundColor: string;
    element: {
      tag: string;
      id?: string;
      classList: string[];
      selector: string;
    };
  } | null;
  paletteResult: string[];
  assetResult: { type: string; src: string; alt: string; width: number; height: number }[];
  logs: { level: string; content: string; time: string }[];
  resourceNetworkData: unknown;
  cssScanResult: CssScanToolData | null;
  jsInspectorResult: JsInspectorResult | null;
  componentScanResult: import('@/types/component').ComponentScanResult | null;
}

function AppContent() {
  const { t } = useTranslation();
  const CONSOLE_DEDUP_WINDOW_MS = 4000;
  const queryParams = new URLSearchParams(window.location.search);
  const isModalMode = queryParams.get('mode') === 'modal';
  const modalNonce = queryParams.get('nonce')?.trim() ?? null;
  const modalToolFromQuery = (() => {
    const rawTool = queryParams.get('tool');
    return rawTool && ALL_TOOLS.some((tool) => tool.id === rawTool)
      ? (rawTool as ToolType)
      : null;
  })();

  const modalTabId = (() => {
    if (!isModalMode) {
      return null;
    }

    const rawTabId = queryParams.get('tabId');
    const parsedTabId = rawTabId ? Number(rawTabId) : NaN;
    if (!Number.isInteger(parsedTabId) || parsedTabId <= 0) {
      return null;
    }

    return parsedTabId;
  })();

  const isValidModalConfig = isModalMode
    ? modalTabId !== null && !!modalNonce
    : true;
  const modalRuntimePort = isModalMode ? 'sidepanel-session-modal' : 'sidepanel-session';

  const initialModalTool = isValidModalConfig ? modalToolFromQuery : null;

  const normalizeConsoleMessage = useCallback((message: string) => {
    return message
      .replace(/\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g, '<time>')
      .replace(/\b\d+\b/g, '<n>')
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27}\b/gi, '<uuid>')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const toLogLevel = useCallback((level?: string): LogLevel => {
    if (level === 'error' || level === 'warn' || level === 'info' || level === 'debug' || level === 'log') {
      return level;
    }
    return 'log';
  }, []);

  const createDefaultConsoleHistory = useCallback((): ConsoleHistory => ({
    logs: [],
    maxSize: STORAGE_LIMITS.CONSOLE_MAX_LOGS,
    totalLogs: 0,
    lastLogTime: 0,
    counts: {
      log: 0,
      warn: 0,
      error: 0,
      info: 0,
      debug: 0,
    },
  }), []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const appendConsoleLogToStorage = useCallback(async (log: ConsoleLog) => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_LOGS);
    const history = (result[STORAGE_KEYS.CONSOLE_LOGS] as ConsoleHistory) || createDefaultConsoleHistory();

    const latestLog = history.logs[0];
    const canMergeWithLatest =
      !!latestLog &&
      latestLog.level === log.level &&
      Math.abs(log.timestamp - latestLog.timestamp) <= CONSOLE_DEDUP_WINDOW_MS &&
      normalizeConsoleMessage(latestLog.message) === normalizeConsoleMessage(log.message);

    if (canMergeWithLatest && latestLog) {
      const existingMetadata = latestLog.metadata ?? log.metadata ?? {
        url: '',
        userAgent: '',
        timestamp: new Date(log.timestamp).toISOString(),
      };
      history.logs[0] = {
        ...latestLog,
        count: (latestLog.count ?? 1) + 1,
        timestamp: log.timestamp,
        metadata: {
          url: existingMetadata.url,
          userAgent: existingMetadata.userAgent,
          timestamp: new Date(log.timestamp).toISOString(),
        },
      };
    } else {
      history.logs.unshift(log);
      if (history.logs.length > history.maxSize) {
        history.logs = history.logs.slice(0, history.maxSize);
      }
    }

    history.totalLogs += 1;
    history.lastLogTime = log.timestamp;
    history.counts[log.level] += 1;

    await chrome.storage.local.set({
      [STORAGE_KEYS.CONSOLE_LOGS]: history,
    });
  }, [CONSOLE_DEDUP_WINDOW_MS, createDefaultConsoleHistory, normalizeConsoleMessage]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const buildConsoleLog = useCallback((request: {
    level?: string;
    content?: string;
    args?: unknown;
    timestamp?: number;
  }): ConsoleLog => {
    const now = Date.now();
    const timestamp = typeof request.timestamp === 'number' ? request.timestamp : now;
    const level = toLogLevel(request.level);
    const message = typeof request.content === 'string' ? request.content : '';
    const args = Array.isArray(request.args) ? request.args : message ? [message] : [];

    return {
      id: crypto.randomUUID(),
      timestamp,
      level,
      message,
      args,
      metadata: {
        url: typeof location !== 'undefined' ? location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date(timestamp).toISOString(),
      },
    };
  }, [toLogLevel]);

  // 초기 도구 상태 생성
  const createInitialTools = (toolToActivate: ToolType | null): Record<ToolType, ToolState> => {
    const tools = ALL_TOOLS.reduce((acc, tool) => {
      acc[tool.id] = {
        isActive: false,
        hasUnsavedChanges: false,
        lastActivity: 0,
      };
      return acc;
    }, {} as Record<ToolType, ToolState>);

    if (toolToActivate) {
      tools[toolToActivate] = {
        ...tools[toolToActivate],
        isActive: true,
      };
    }

    return tools;
  };

  const [state, setState] = useState<AppState>({
    tools: createInitialTools(initialModalTool),
    currentTool: initialModalTool,
    allTabsAppliedTool: null,
    sidebarOpen: true,
  });

  useEffect(() => {
    if (!initialModalTool) {
      return;
    }

    queueMicrotask(() => {
      setState((prev) => {
        if (!initialModalTool || !prev.tools[initialModalTool]?.isActive || prev.currentTool !== initialModalTool) {
          return prev;
        }

        if (prev.tools[initialModalTool].lastActivity > 0) {
          return prev;
        }

        return {
          ...prev,
          tools: {
            ...prev.tools,
            [initialModalTool]: {
              ...prev.tools[initialModalTool],
              lastActivity: Date.now(),
            },
          },
        };
      });
    });
  }, [initialModalTool]);

  // Tool order (drag & drop reordering)
  const [toolOrder, setToolOrder] = useState<ToolType[]>(ALL_TOOLS.map(t => t.id));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<{ startIndex: number } | null>(null);

  // Load saved tool order from storage
  useEffect(() => {
    chrome.storage.local.get(['toolOrder'], (result) => {
      const saved = result['toolOrder'] as ToolType[] | undefined;
      if (saved && Array.isArray(saved)) {
        // Ensure all tools are present (handle added/removed tools)
        const allIds = new Set(ALL_TOOLS.map(t => t.id));
        const validSaved = saved.filter(id => allIds.has(id));
        const missing = ALL_TOOLS.map(t => t.id).filter(id => !validSaved.includes(id));
        setToolOrder([...validSaved, ...missing]);
      }
    });
  }, []);

  const orderedTools: ToolInfo[] = toolOrder
    .map(id => ALL_TOOLS.find(t => t.id === id))
    .filter((t): t is ToolInfo => t !== undefined);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    dragRef.current = { startIndex: index };
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragRef.current === null) return;
    const fromIndex = dragRef.current.startIndex;
    if (fromIndex === dropIndex) return;

    setToolOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      chrome.storage.local.set({ toolOrder: next });
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  // Settings State
  const [showSettings, setShowSettings] = useState(false);

  // Palette Picker Mode State
  const [isPalettePickerActive, setIsPalettePickerActive] = useState(false);
  const [isComponentPickerActive, setIsComponentPickerActive] = useState(false);
  const [isComponentScanning, setIsComponentScanning] = useState(false);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: modalRuntimePort });
    let active = true;

    chrome.windows.getCurrent().then((currentWindow) => {
      if (!active || currentWindow.id === undefined) return;
      port.postMessage({ windowId: currentWindow.id });
    }).catch(() => undefined);

    return () => {
      active = false;
      try {
        port.disconnect();
      } catch (error) {
        void error;
      }
    };
  }, [modalRuntimePort]);

  // Tool Data States
  const [toolData, setToolData] = useState<ToolData>({
    fontResult: [],
    fontElementInfo: null,
    paletteResult: [],
    assetResult: [],
    logs: [],
    resourceNetworkData: null,
    cssScanResult: null,
    jsInspectorResult: null,
    componentScanResult: null,
  });

  /**
   * 도구 상태 변경 핸들러
   */
  const handleToolStateChange = useCallback((toolId: ToolType, newState: boolean) => {
    setState(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        [toolId]: {
          ...prev.tools[toolId],
          isActive: newState,
          lastActivity: Date.now(),
        },
      },
      currentTool: newState ? toolId : null,
      allTabsAppliedTool: null,
    }));
  }, []);

  // Tool Switcher Hook
  const { switchTool } =
    useToolSwitcher({
      onStateChange: handleToolStateChange,
    });

  const postModalMessageToParent = useCallback(
    (message: { type: ModalMessageType; tool?: string | null }) => {
      if (!isModalMode || !isValidModalConfig) {
        return;
      }

      if (window.parent === window) {
        return;
      }

      if (!modalNonce) {
        return;
      }

      const parentOrigin = (() => {
        if (!document.referrer) {
          return '*';
        }

        try {
          return new URL(document.referrer).origin;
        } catch {
          return '*';
        }
      })();

      window.parent.postMessage({ ...message, nonce: modalNonce }, parentOrigin);
    },
    [isModalMode, isValidModalConfig, modalNonce],
  );

  useEffect(() => {
    if (!isModalMode || !isValidModalConfig) {
      return;
    }

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      postModalMessageToParent({
        type: MODAL_MESSAGE_TYPES.CLOSE_REQUEST,
      });
    };

    postModalMessageToParent({
      type: MODAL_MESSAGE_TYPES.READY,
    });
    window.addEventListener('keydown', handleModalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleModalKeyDown);

      postModalMessageToParent({
        type: MODAL_MESSAGE_TYPES.CLOSE,
      });
    };
  }, [isModalMode, isValidModalConfig, postModalMessageToParent]);

  useEffect(() => {
    if (!isModalMode || !isValidModalConfig) {
      return;
    }

    if (!state.currentTool) {
      return;
    }

    postModalMessageToParent({
      type: MODAL_MESSAGE_TYPES.SET_TOOL,
      tool: state.currentTool,
    });
  }, [isModalMode, isValidModalConfig, postModalMessageToParent, state.currentTool]);

  /**
   * Content Script로 메시지 전송
   */
  const resolveTargetTab = useCallback(async () => {
    if (isModalMode) {
      if (!isValidModalConfig || modalTabId === null) {
        return null;
      }

      const targetTab = await chrome.tabs.get(modalTabId).catch(() => null);
      return targetTab ?? null;
    }

    const tryFromCurrentWindow = async () => {
      const currentWindow = await chrome.windows.getCurrent().catch(() => null);
      if (!currentWindow) {
        return null;
      }
      if (typeof currentWindow.id !== 'number') {
        return null;
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        windowId: currentWindow.id,
      }).catch(() => [] as chrome.tabs.Tab[]);

      return tab ?? null;
    };

    const tryFromLastFocusedWindow = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      }).catch(() => [] as chrome.tabs.Tab[]);

      return tab ?? null;
    };

    const tryFromCurrentWindowFlag = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      }).catch(() => [] as chrome.tabs.Tab[]);

      return tab ?? null;
    };

      return (
        (await tryFromCurrentWindow()) ??
        (await tryFromLastFocusedWindow()) ??
        (await tryFromCurrentWindowFlag())
      );
  }, [isModalMode, isValidModalConfig, modalTabId]);

  const sendToolMessage = useCallback(async (toolId: ToolType, enabled: boolean, options?: { pickerMode?: boolean }): Promise<void> => {
    if (isModalMode && !isValidModalConfig) {
      return;
    }

    try {
      const targetTab = await resolveTargetTab();

      if (!targetTab || !targetTab.id) {
        toast.error(t('errors.contentScriptTimeout'));
        return;
      }

      // Check for restricted pages
      if (targetTab.url && (
        targetTab.url.startsWith('chrome://') ||
        targetTab.url.startsWith('chrome-extension://') ||
        targetTab.url.startsWith('edge://') ||
        targetTab.url.startsWith('about:') ||
        targetTab.url.startsWith('moz-extension://')
      )) {
        toast.error(t('errors.contentScriptTimeout'));
        return;
      }

      const tabId = targetTab.id;

      // Check if content script is loaded via PING
      let contentScriptReady = false;
      let retries = 5;
      while (retries > 0) {
        try {
          const pingResponse = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
          contentScriptReady = pingResponse?.success === true;
        } catch {
          contentScriptReady = false;
        }

        if (contentScriptReady) {
          break;
        }

        retries -= 1;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
      }

      // If content script is not loaded, inject it dynamically
      if (!contentScriptReady) {
        const latestTab = await chrome.tabs.get(tabId).catch(() => null);
        if (!latestTab || latestTab.status !== 'complete') {
          console.error(t('errors.contentScriptTimeout'));
          toast.error(t('errors.contentScriptTimeout'));
          return;
        }

        try {
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: false },
            files: ['assets/content.js'],
          });

          // Verify script is listening with retry
          let verifyRetries = 5;
          while (verifyRetries > 0) {
            try {
              const ping = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
              if (ping?.success) {
                contentScriptReady = true;
                break;
              }
            } catch (error) {
              void error;
            }
            verifyRetries--;
            if (verifyRetries > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          if (!contentScriptReady) {
            console.error(t('errors.contentScriptTimeout'));
            toast.error(t('errors.contentScriptTimeout'));
            return;
          }
        } catch (injectError) {
          console.error(t('errors.injectionFailed'), injectError);
          toast.error(t('errors.injectionFailed'));
          return;
        }
      }

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'TOGGLE_TOOL',
        tool: toolId,
        active: enabled,
        pickerMode: options?.pickerMode,
      });

      if (response && !response.success) {
        console.error(t('errors.captureFailed'), response.error);
        toast.error(t('errors.captureFailed'));
      }
    } catch (error) {
      console.error(t('errors.injectionFailed'), error);
      toast.error(t('errors.injectionFailed'));
    }
  }, [isModalMode, isValidModalConfig, resolveTargetTab, t]);

  const isRestrictedUrl = useCallback((url?: string) => {
    if (!url) return false;
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('moz-extension://')
    );
  }, []);

  const ensureContentScriptInTab = useCallback(async (tabId: number) => {
    try {
      const pingResponse = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (pingResponse?.success) return;
    } catch (error) {
      void error;
    }

    const tab = await chrome.tabs.get(tabId);
    if (tab.status !== 'complete') {
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['assets/content.js'],
    });

    try {
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    } catch (error) {
      void error;
    }
  }, []);

  /**
   * 컴포넌트 스캔 실행
   */
  const handleComponentScan = useCallback(async (options?: { frameworkOnly?: boolean }) => {
    setIsComponentScanning(true);
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const [targetTab] = await chrome.tabs.query({
        active: true,
        windowId: currentWindow.id,
      }).catch(() => [] as chrome.tabs.Tab[]);

      if (!targetTab?.id) return;

      await ensureContentScriptInTab(targetTab.id);
      await chrome.tabs.sendMessage(targetTab.id, {
        action: 'COMPONENT_SCAN',
        options,
      }).catch(() => undefined);
    } finally {
      setIsComponentScanning(false);
    }
  }, [ensureContentScriptInTab]);

  /**
   * 도구 활성화 상태 토글
   */
  const handleToolClick = useCallback(
    async (toolId: ToolType) => {
      if (isModalMode && !isValidModalConfig) {
        return;
      }

      const currentState = state.tools[toolId];
      const newState = !currentState.isActive;

      // 저장되지 않은 변경사항 확인
      if (currentState.isActive && currentState.hasUnsavedChanges) {
        const confirmed = window.confirm(t('common.unsavedChanges'));
        if (!confirmed) return;
      }

      // 독점 도구 처리
      if (newState && isExclusiveTool(toolId)) {
        // 모든 독점 도구 비활성화
        for (const tool of ALL_TOOLS) {
          if (tool.id !== toolId && tool.exclusive && state.tools[tool.id].isActive) {
            await sendToolMessage(tool.id, false);
            setState(prev => ({
              ...prev,
              tools: {
                ...prev.tools,
                [tool.id]: { ...prev.tools[tool.id], isActive: false },
              },
            }));
          }
        }
        // 다른 exclusive 도구 활성화 시 피커 모드 비활성화
        if (isPalettePickerActive) {
          setIsPalettePickerActive(false);
        }
        if (isComponentPickerActive) {
          setIsComponentPickerActive(false);
        }
      }

      // palette가 비활성화될 때 피커 모드도 비활성화
      if (toolId === 'palette' && !newState && isPalettePickerActive) {
        setIsPalettePickerActive(false);
      }

      // componentInspector가 비활성화될 때 피커 모드도 비활성화
      if (toolId === 'componentInspector' && !newState && isComponentPickerActive) {
        setIsComponentPickerActive(false);
      }

      // 도구 전환
      await switchTool(state.currentTool, newState ? toolId : null);

      // Content Script에 메시지 전송
      await sendToolMessage(toolId, newState);

      // componentInspector 활성화 시 자동 스캔 실행
      if (toolId === 'componentInspector' && newState) {
        handleComponentScan();
      }
    },
    [isModalMode, isValidModalConfig, state, switchTool, sendToolMessage, t, isPalettePickerActive, isComponentPickerActive, handleComponentScan]
  );

  /**
   * 도구 변경사항 표시
   */
  const markUnsavedChanges = useCallback((toolId: ToolType, hasChanges: boolean) => {
    setState(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        [toolId]: {
          ...prev.tools[toolId],
          hasUnsavedChanges: hasChanges,
        },
      },
    }));
  }, []);

  /**
   * 팔레트 피커 모드 토글
   */
  const handleTogglePalettePicker = useCallback(async () => {
    const newPickerState = !isPalettePickerActive;
    setIsPalettePickerActive(newPickerState);

    // 피커 활성화 시 다른 exclusive 도구 비활성화
    if (newPickerState) {
      const exclusiveTools: ToolType[] = ['textEdit', 'screenshot', 'cssScan', 'tailwind', 'ruler', 'jsInspector', 'gridLayout'];
      for (const tool of exclusiveTools) {
        if (state.tools[tool]?.isActive) {
          await sendToolMessage(tool, false);
          setState(prev => ({
            ...prev,
            tools: {
              ...prev.tools,
              [tool]: { ...prev.tools[tool], isActive: false },
            },
          }));
        }
      }
    }

    // 팔레트 도구가 활성화되지 않았으면 활성화
    if (!state.tools['palette']?.isActive) {
      setState(prev => ({
        ...prev,
        tools: {
          ...prev.tools,
          palette: { ...prev.tools['palette'], isActive: true },
        },
        currentTool: 'palette',
      }));
    }

    // Content Script에 피커 모드 메시지 전송
    await sendToolMessage('palette', true, { pickerMode: newPickerState });
  }, [isPalettePickerActive, state.tools, sendToolMessage]);

  const handleToggleComponentPicker = useCallback(async () => {
    const newPickerState = !isComponentPickerActive;
    setIsComponentPickerActive(newPickerState);

    // 피커 활성화 시 componentInspector 도구도 활성화
    if (newPickerState) {
      // 다른 exclusive 도구 비활성화
      const exclusiveTools: ToolType[] = ['textEdit', 'screenshot', 'cssScan', 'tailwind', 'ruler', 'jsInspector', 'gridLayout'];
      for (const tool of exclusiveTools) {
        if (state.tools[tool]?.isActive) {
          await sendToolMessage(tool, false);
          setState(prev => ({
            ...prev,
            tools: {
              ...prev.tools,
              [tool]: { ...prev.tools[tool], isActive: false },
            },
          }));
        }
      }

      // componentInspector 도구 활성화
      if (!state.tools['componentInspector']?.isActive) {
        setState(prev => ({
          ...prev,
          tools: {
            ...prev.tools,
            componentInspector: { ...prev.tools['componentInspector'], isActive: true },
          },
          currentTool: 'componentInspector',
        }));
      }
    }

    // Content Script에 피커 모드 메시지 전송
    const currentWindow = await chrome.windows.getCurrent().catch(() => null);
    if (currentWindow?.id === undefined) return;

    const [targetTab] = await chrome.tabs.query({
      active: true,
      windowId: currentWindow.id,
    }).catch(() => [] as chrome.tabs.Tab[]);

    if (!targetTab?.id) return;

    // Content script 준비 확인 및 메시지 전송
    await ensureContentScriptInTab(targetTab.id);
    await chrome.tabs.sendMessage(targetTab.id, {
      action: 'COMPONENT_TOGGLE_PICKER',
      active: newPickerState,
    }).catch(() => undefined);
  }, [isComponentPickerActive, state.tools, sendToolMessage, ensureContentScriptInTab]);

  /**
   * 현재 활성 도구 목록 가져오기
   */
  const getActiveTools = useCallback((): ToolType[] => {
    return Object.entries(state.tools)
      .filter(([, s]) => s.isActive)
      .map(([id]) => id as ToolType);
  }, [state.tools]);

  /**
   * 클립보드에 복사
   */
  const copyToClipboard = (text: string) => {
    return navigator.clipboard.writeText(text);
  };

  const handleApplyCurrentToolToAllTabs = useCallback(async () => {
    if (isModalMode && !isValidModalConfig) {
      return;
    }

    if (!state.currentTool) return;

    const targetTool = state.currentTool;

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || isRestrictedUrl(tab.url)) continue;
      try {
        await ensureContentScriptInTab(tab.id);
        await chrome.tabs.sendMessage(tab.id, {
          action: 'TOGGLE_TOOL',
          tool: targetTool,
          active: true,
        });
      } catch (error) {
        void error;
      }
    }

    setState(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        [targetTool]: {
          ...prev.tools[targetTool],
          isActive: true,
          lastActivity: Date.now(),
        },
      },
      currentTool: targetTool,
      allTabsAppliedTool: targetTool,
    }));

    toast.success(t('app.appliedCurrentToolToAllTabs'));
  }, [ensureContentScriptInTab, isRestrictedUrl, isModalMode, isValidModalConfig, state.currentTool, t]);

  const handleDeactivateAllTabs = useCallback(async () => {
    if (isModalMode && !isValidModalConfig) {
      return;
    }

    const tabs = await chrome.tabs.query({});
    const fallbackTool = state.currentTool ?? ALL_TOOLS[0].id;

    for (const tab of tabs) {
      if (!tab.id || isRestrictedUrl(tab.url)) continue;
      try {
        await ensureContentScriptInTab(tab.id);
        await chrome.tabs.sendMessage(tab.id, {
          action: 'TOGGLE_TOOL',
          tool: fallbackTool,
          active: false,
        });
      } catch (error) {
        void error;
      }
    }

    setState(prev => ({
      ...prev,
      tools: Object.fromEntries(
        Object.entries(prev.tools).map(([id, toolState]) => [
          id,
          { ...toolState, isActive: false, hasUnsavedChanges: false },
        ])
      ) as Record<ToolType, ToolState>,
      currentTool: null,
      allTabsAppliedTool: null,
    }));

    toast.success(t('app.deactivatedToolsInAllTabs'));
  }, [ensureContentScriptInTab, isRestrictedUrl, isModalMode, isValidModalConfig, state.currentTool, t]);

  // 메시지 리스너 등록
  useEffect(() => {
    const handleMessage = (request: {
      action: string;
      level?: string;
      content?: string;
      args?: unknown;
      timestamp?: number;
      tool?: string;
      data?: unknown;
    }) => {
      // 피커 모드 종료 알림
      if (request.action === 'PALETTE_PICKER_DONE') {
        setIsPalettePickerActive(false);
        return;
      }

      if (request.action === 'COMPONENT_PICKER_DONE') {
        setIsComponentPickerActive(false);
        return;
      }

      if (request.action === 'COMPONENT_DATA') {
        const data = request.data;
        if (data && typeof data === 'object') {
          if ('components' in data) {
            // Full scan result
            setToolData(prev => ({
              ...prev,
              componentScanResult: data as import('@/types/component').ComponentScanResult,
            }));
          } else if ('component' in data) {
            // Single component from picker click
            const pickerData = data as import('@/types/component').ComponentPickerData;
            setToolData(prev => ({
              ...prev,
              componentScanResult: prev.componentScanResult
                ? {
                    ...prev.componentScanResult,
                    components: [
                      pickerData.component,
                      ...prev.componentScanResult.components.filter(
                        c => c.selector !== pickerData.component.selector
                      ),
                    ],
                  }
                : {
                    framework: 'unknown' as const,
                    components: [pickerData.component],
                    totalElements: 1,
                    scannedAt: Date.now(),
                  },
            }));
          }
        }
        return;
      }

      if (request.action === 'CONSOLE_LOG') {
        const consoleLog = buildConsoleLog(request);
        void appendConsoleLogToStorage(consoleLog);

        setToolData(prev => ({
          ...prev,
          logs: [
            ...prev.logs,
            {
              level: request.level || 'info',
              content: request.content || '',
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      } else if (request.action === 'TOOL_DATA') {
        if (request.tool === 'font') {
          setToolData(prev => ({ ...prev, fontResult: request.data as typeof prev.fontResult }));
        }
        if (request.tool === 'fontAnalyzer') {
          // Single element font info from click
          setToolData(prev => ({ ...prev, fontElementInfo: request.data as typeof prev.fontElementInfo }));
        }
        if (request.tool === 'palette') {
          setToolData(prev => ({ ...prev, paletteResult: request.data as typeof prev.paletteResult }));
        }
        if (request.tool === 'assets') {
          setToolData(prev => ({ ...prev, assetResult: request.data as typeof prev.assetResult }));
        }
        if (request.tool === 'resourceNetwork') {
          setToolData(prev => ({ ...prev, resourceNetworkData: request.data }));
        }
        if (request.tool === 'cssScan') {
          setToolData(prev => ({ ...prev, cssScanResult: request.data as CssScanToolData }));
        }
        if (request.tool === 'jsInspector') {
          setToolData(prev => ({ ...prev, jsInspectorResult: request.data as JsInspectorResult }));
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [appendConsoleLogToStorage, buildConsoleLog]);

  useEffect(() => {
    const deactivateToolsOnNavigation = async () => {
      const activeTools = getActiveTools();
      if (activeTools.length === 0) return;

      // 현재 윈도우의 활성 탭 가져오기
      const currentWindow = await chrome.windows.getCurrent();
      const [targetTab] = await chrome.tabs.query({
        active: true,
        windowId: currentWindow.id,
      });

      if (!targetTab || !targetTab.id) return;

      // 시스템 페이지 체크
      if (targetTab.url && (
        targetTab.url.startsWith('chrome://') ||
        targetTab.url.startsWith('chrome-extension://') ||
        targetTab.url.startsWith('edge://') ||
        targetTab.url.startsWith('about:') ||
        targetTab.url.startsWith('moz-extension://')
      )) {
        return;
      }

      for (const toolId of activeTools) {
        try {
          await ensureContentScriptInTab(targetTab.id);
          await chrome.tabs.sendMessage(targetTab.id, {
            action: 'TOGGLE_TOOL',
            tool: toolId,
            active: false,
          });
        } catch (error) {
          void error;
        }
      }

      setState(prev => {
        const updatedTools = { ...prev.tools };
        for (const toolId of activeTools) {
          updatedTools[toolId] = { ...updatedTools[toolId], isActive: false, hasUnsavedChanges: false };
        }
        return { ...prev, tools: updatedTools, currentTool: null, allTabsAppliedTool: null };
      });
    };

    // 탭 활성화 이벤트
    const handleTabActivated = () => {
      deactivateToolsOnNavigation();
    };

    // 탭 업데이트 이벤트 (페이지 새로고침, 이동)
    const handleTabUpdated = (tabId: number, changeInfo: { status?: string }) => {
      // 페이지 로드 완료시만 처리
      if (changeInfo.status === 'complete') {
        deactivateToolsOnNavigation();
      }
    };

    // 이벤트 리스너 등록
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [ensureContentScriptInTab, getActiveTools]);

  /**
   * 모든 활성 도구 storage 초기화 + 비활성화
   */
  const handleResetActiveTools = useCallback(async () => {
    const active = getActiveTools();
    if (active.length === 0) return;

    const confirmed = window.confirm(t('common.resetAllConfirm'));
    if (!confirmed) return;

    for (const toolId of active) {
      await resetTool(toolId);
      await sendToolMessage(toolId, false);
    }

    setState(prev => {
      const updatedTools = { ...prev.tools };
      for (const toolId of active) {
        updatedTools[toolId] = { ...updatedTools[toolId], isActive: false, hasUnsavedChanges: false };
      }
      return { ...prev, tools: updatedTools, currentTool: null, allTabsAppliedTool: null };
    });

    toast.success(t('common.resetSuccess'));
  }, [getActiveTools, sendToolMessage, t]);

  /**
   * 단일 도구 storage 초기화
   */
  const handleResetTool = useCallback(async (toolId: ToolType) => {
    const confirmed = window.confirm(t('common.resetToolConfirm'));
    if (!confirmed) return;

    await resetTool(toolId);
    toast.success(t('common.resetSuccess'));
  }, [t]);

  const activeTools = getActiveTools();
  const activeCount = activeTools.length;

  if (isModalMode && !isValidModalConfig) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center p-6 text-center text-muted-foreground">
        <div className="text-sm">Invalid modal context. Unable to connect tools.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col font-sans text-foreground relative">
      {/* Header */}
      <header className="px-4 py-3 bg-card border-b border-border flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/icons/icon48.png" alt="Logo" className="w-6 h-6" />
          <h1 className="font-bold text-sm">{t('app.name')}</h1>
          {activeCount > 0 && (
            <span className="text-xs text-primary font-medium">
              {t('app.activeCount', { count: activeCount })}
            </span>
          )}
          {state.allTabsAppliedTool && (
            <span className="text-xs text-emerald-600 font-medium">
              {t('app.allTabsApplied')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {state.currentTool && (
            <button
              onClick={handleApplyCurrentToolToAllTabs}
              className="px-2 py-1.5 hover:bg-muted rounded-lg text-xs text-muted-foreground transition-colors"
              aria-label={t('app.applyCurrentToolToAllTabs')}
              title={t('app.applyCurrentToolToAllTabs')}
            >
              {t('app.allOn')}
            </button>
          )}
          <button
            onClick={handleDeactivateAllTabs}
            className="px-2 py-1.5 hover:bg-muted rounded-lg text-xs text-muted-foreground transition-colors"
            aria-label={t('app.deactivateToolsInAllTabs')}
            title={t('app.deactivateToolsInAllTabs')}
          >
            {t('app.allOff')}
          </button>
          {activeCount > 0 && (
            <button
              onClick={handleResetActiveTools}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              aria-label={t('common.resetTool')}
              title={t('common.resetTool')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            aria-label={t('common.settings')}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {orderedTools.map((tool, index) => (
            <div
              key={tool.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all duration-200 ${
                dragIndex === index ? 'opacity-40 scale-95' : ''
              } ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-xl' : ''}`}
            >
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 relative ${
                  state.tools[tool.id].isActive
                    ? 'bg-primary/10 border-primary text-primary shadow-md transform scale-105'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-muted hover:shadow-sm'
                }`}
                aria-label={`${t(`tools.${tool.id}.name`)} ${state.tools[tool.id].isActive ? t('common.disable') : t('common.enable')}`}
              >
                <tool.icon
                  className={`w-6 h-6 mb-2 ${
                    state.tools[tool.id].isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span className="text-xs font-bold">{t(`tools.${tool.id}.name`)}</span>
                <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                  {t(`tools.${tool.id}.description`)}
                </span>
                {state.tools[tool.id].hasUnsavedChanges && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              <div className="absolute top-1 left-1 p-0.5 opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Tool Panel */}
        {state.currentTool && (
          <ToolRouter
            currentTool={state.currentTool}
            tools={state.tools}
            toolData={toolData}
            onToggle={handleToolClick}
            onMarkUnsaved={markUnsavedChanges}
            onCopy={copyToClipboard}
            onReset={handleResetTool}
            isPalettePickerActive={isPalettePickerActive}
            onTogglePalettePicker={handleTogglePalettePicker}
            isComponentPickerActive={isComponentPickerActive}
            onToggleComponentPicker={handleToggleComponentPicker}
            onComponentScan={handleComponentScan}
            isComponentScanning={isComponentScanning}
          />
        )}
      </main>

      {showSettings ? (
        <Suspense fallback={null}>
          <LazySettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </Suspense>
      ) : null}

      {/* Toaster */}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
