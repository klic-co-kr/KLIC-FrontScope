/**
 * ConsolePanel Component
 *
 * 콘솔 패널 메인 컴포넌트
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Settings,
  BarChart3,
  FileText,
  Play,
  Pause,
  AlertTriangle,
  Bug,
  Braces,
  ShieldAlert,
} from 'lucide-react';
import { useConsoleStorage } from '../../hooks/console/useConsoleStorage';
import { useConsoleFilter } from '../../hooks/console/useConsoleFilter';
import { useConsoleStats } from '../../hooks/console/useConsoleStats';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { LogList } from './LogList';
import { LogFilter } from './LogFilter';
import { LogStats } from './LogStats';
import { SearchBar } from './SearchBar';
import { exportLogs, downloadFile } from '../../utils/console/export';
import { groupLogs } from '../../utils/console/grouping';
import type { ConsoleLog } from '../../types/console';

type TabType = 'logs' | 'stats' | 'settings';

export function ConsolePanel() {
  const { logs, clearLogs, isLoading } = useConsoleStorage();
  const groupedLogs = useMemo(() => groupLogs(logs), [logs]);
  const { filteredLogs, filter, toggleLevel, setLevels, setSearch, resetFilter } =
    useConsoleFilter(groupedLogs);
  const stats = useConsoleStats(groupedLogs);

  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [viewMode, setViewMode] = useState<'core' | 'all' | 'objects'>('core');

  const ensureContentScriptInTab = useCallback(async (tabId: number) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
        if (response?.success) {
          return true;
        }
      } catch (error) {
        void error;
      }

      retries -= 1;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }

    return false;
  }, []);

  const toggleCapture = useCallback(async (enabled: boolean) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { success: false, enabled: false };

    const ready = await ensureContentScriptInTab(tab.id);
    if (!ready) return { success: false, enabled: false };

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: MESSAGE_ACTIONS.CONSOLE_TOGGLE_INTERCEPT,
        data: { enabled },
      });
      return {
        success: Boolean(response?.success),
        enabled: Boolean(response?.enabled),
      };
    } catch {
      return { success: false, enabled: false };
    }
  }, [ensureContentScriptInTab]);

  const hasObjectPayload = useCallback((log: ConsoleLog) => {
    return log.args.some((arg) => arg !== null && typeof arg === 'object');
  }, []);

  const objectLogs = useMemo(() => {
    return filteredLogs.filter((log) => hasObjectPayload(log));
  }, [filteredLogs, hasObjectPayload]);

  const coreLogs = useMemo(() => {
    return filteredLogs.filter((log) =>
      log.level === 'error' ||
      log.level === 'warn' ||
      (log.count ?? 1) > 1 ||
      hasObjectPayload(log)
    );
  }, [filteredLogs, hasObjectPayload]);

  const visibleLogs = useMemo(() => {
    if (viewMode === 'objects') return objectLogs;
    if (viewMode === 'core') return coreLogs;
    return filteredLogs;
  }, [coreLogs, filteredLogs, objectLogs, viewMode]);

  const keySignals = useMemo(() => {
    const repeatedLogs = groupedLogs
      .filter((log) => (log.count ?? 1) > 1)
      .sort((a, b) => (b.count ?? 1) - (a.count ?? 1));
    return {
      totalErrors: groupedLogs.reduce((sum, log) => sum + (log.level === 'error' ? (log.count ?? 1) : 0), 0),
      totalWarnings: groupedLogs.reduce((sum, log) => sum + (log.level === 'warn' ? (log.count ?? 1) : 0), 0),
      objectEntries: groupedLogs.filter((log) => hasObjectPayload(log)).length,
      topRepeatedCount: repeatedLogs[0]?.count ?? 0,
      repeatedSamples: repeatedLogs.slice(0, 5),
    };
  }, [groupedLogs, hasObjectPayload]);

  const handleShowCritical = useCallback(() => {
    setLevels(['error', 'warn']);
    setViewMode('core');
  }, [setLevels]);

  const handleShowAll = useCallback(() => {
    setLevels(['log', 'warn', 'error', 'info', 'debug']);
    setViewMode('all');
  }, [setLevels]);

  const handleShowObjects = useCallback(() => {
    setLevels(['log', 'warn', 'error', 'info', 'debug']);
    setViewMode('objects');
  }, [setLevels]);

  useEffect(() => {
    const ensureCapture = async () => {
      const response = await toggleCapture(true);
      setIsIntercepting(response.success && response.enabled);
    };

    void ensureCapture();
  }, [toggleCapture]);

  /**
   * 인터셉터 토글
   */
  const handleToggleIntercept = useCallback(async () => {
    const nextEnabled = !isIntercepting;
    const response = await toggleCapture(nextEnabled);
    setIsIntercepting(response.success && response.enabled);
  }, [isIntercepting, toggleCapture]);

  /**
   * 로그 지우기
   */
  const handleClearLogs = useCallback(async () => {
    if (!confirm('모든 로그를 지우시겠습니까?')) {
      return;
    }

    await clearLogs();
  }, [clearLogs]);

  /**
   * 로그 내보내기
   */
  const handleExportLogs = useCallback((format: 'json' | 'txt' | 'csv') => {
    const content = exportLogs(filteredLogs, {
      format,
      includeStackTrace: true,
      includeMetadata: true,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `console-logs-${timestamp}.${format}`;
    const mimeTypes = {
      json: 'application/json',
      txt: 'text/plain',
      csv: 'text/csv',
    };

    downloadFile(content, filename, mimeTypes[format]);
  }, [filteredLogs]);

  /**
   * Settings 탭 컨텐츠
   */
  const renderSettingsTab = () => (
    <div className="console-settings p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">콘솔 설정</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-gray-700">자동 스크롤</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-gray-700">타임스탬프 표시</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-gray-700">스택 트레이스 표시</span>
          </label>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="console-panel flex items-center justify-center h-full bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="klic-console-panel flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <div className="console-header flex items-center justify-end px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* 인터셉트 토글 */}
          <button
            onClick={handleToggleIntercept}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isIntercepting
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isIntercepting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isIntercepting ? '캡처 중' : '캡처 시작'}
          </button>

          {/* 지우기 */}
          <button
            onClick={handleClearLogs}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="로그 지우기"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* 내보내기 */}
          <div className="relative group">
            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity">
              <button
                onClick={() => handleExportLogs('json')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 first:rounded-t-lg"
              >
                JSON으로 내보내기
              </button>
              <button
                onClick={() => handleExportLogs('txt')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                텍스트로 내보내기
              </button>
              <button
                onClick={() => handleExportLogs('csv')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 last:rounded-b-lg"
              >
                CSV로 내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="console-controls px-4 py-3 bg-white border-b border-gray-200 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <div className="text-[11px] text-red-700 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              핵심 에러
            </div>
            <div className="text-lg font-semibold text-red-800">{keySignals.totalErrors}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              경고
            </div>
            <div className="text-lg font-semibold text-amber-800">{keySignals.totalWarnings}</div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
            <div className="text-[11px] text-orange-700 font-medium flex items-center gap-1">
              <Braces className="w-3.5 h-3.5" />
              객체 로그
            </div>
            <div className="text-lg font-semibold text-orange-800">{keySignals.objectEntries}</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
              <Bug className="w-3.5 h-3.5" />
              최다 반복
            </div>
            <div className="text-lg font-semibold text-blue-800">x{keySignals.topRepeatedCount}</div>
          </div>
        </div>

        {keySignals.repeatedSamples.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <div className="font-semibold mb-1">핵심 요소</div>
            <div className="space-y-1">
              {keySignals.repeatedSamples.map((log) => (
                <div key={log.id} className="flex items-center gap-2">
                  <span className="inline-block min-w-8 text-right font-semibold text-blue-700">x{log.count ?? 1}</span>
                  <span className="truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowCritical}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          >
            핵심만
          </button>
          <button
            onClick={handleShowObjects}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            객체 로그
          </button>
          <button
            onClick={handleShowAll}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            전체 보기
          </button>
        </div>

        <SearchBar onSearch={setSearch} />
        <LogFilter filter={filter} onToggleLevel={toggleLevel} onReset={resetFilter} />
      </div>

      {/* 탭 */}
      <div className="console-tabs flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          로그 ({visibleLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'stats'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          통계
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="console-content flex-1 overflow-auto">
        {activeTab === 'logs' && (
          <LogList
            logs={visibleLogs}
            emptyMessage={
              viewMode === 'core'
                ? '핵심 요소 조건에 맞는 로그가 없습니다.'
                : viewMode === 'objects'
                  ? '객체 로그가 없습니다.'
                  : '표시할 로그가 없습니다.'
            }
          />
        )}
        {activeTab === 'stats' && <LogStats stats={stats} />}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* 빈 상태 */}
      {!isIntercepting && logs.length === 0 && (
        <div className="console-empty flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <Terminal className="w-16 h-16 mb-4 text-gray-400" />
          <p className="text-lg font-medium">콘솔 로그가 없습니다</p>
          <p className="text-sm">캡처 시작 버튼을 눌러 로그 수집을 시작하세요</p>
        </div>
      )}
    </div>
  );
}

export default ConsolePanel;
