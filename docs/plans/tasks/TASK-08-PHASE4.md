# Phase 4: React 컴포넌트

**태스크**: 5개
**예상 시간**: 2.5시간
**의존성**: Phase 1-3 완료

---

### Task #8.15: ConsolePanel 메인 컴포넌트

- **파일**: `src/sidepanel/components/Console/ConsolePanel.tsx`
- **시간**: 45분
- **의존성**: Task #8.11-#8.14
- **상세 내용**:
```typescript
import React, { useState, useEffect } from 'react';
import { useConsoleStorage } from '../../../hooks/console/useConsoleStorage';
import { useConsoleFilter } from '../../../hooks/console/useConsoleFilter';
import { useConsoleStats } from '../../../hooks/console/useConsoleStats';
import { LogList } from './LogList';
import { LogFilter } from './LogFilter';
import { LogStats } from './LogStats';
import { SearchBar } from './SearchBar';

export function ConsolePanel() {
  const { logs, totalLogs, clearLogs, isLoading } = useConsoleStorage();
  const { filteredLogs, filter, toggleLevel, setSearch, resetFilter } =
    useConsoleFilter(logs);
  const stats = useConsoleStats(filteredLogs);

  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');
  const [isIntercepting, setIsIntercepting] = useState(false);

  /**
   * 인터셉터 토글
   */
  const handleToggleIntercept = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'CONSOLE_TOGGLE_INTERCEPT',
          data: { enabled: !isIntercepting },
        });

        setIsIntercepting(!isIntercepting);
      }
    } catch (error) {
      console.error('Failed to toggle console intercept:', error);
    }
  };

  /**
   * 로그 지우기
   */
  const handleClearLogs = async () => {
    if (!confirm('모든 로그를 지우시겠습니까?')) {
      return;
    }

    await clearLogs();
  };

  /**
   * 로그 내보내기
   */
  const handleExportLogs = () => {
    // Export 모달 열기
    console.log('Export logs');
  };

  if (isLoading) {
    return (
      <div className="console-panel loading">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="console-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>콘솔</h2>

        <div className="header-actions">
          <button
            onClick={handleToggleIntercept}
            className={`toggle-btn ${isIntercepting ? 'active' : ''}`}
          >
            {isIntercepting ? '캡처 중' : '캡처 시작'}
          </button>

          <button onClick={handleClearLogs} className="clear-btn">
            지우기
          </button>

          <button onClick={handleExportLogs} className="export-btn">
            내보내기
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="panel-controls">
        <SearchBar onSearch={setSearch} />
        <LogFilter filter={filter} onToggleLevel={toggleLevel} onReset={resetFilter} />
      </div>

      {/* 탭 */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('logs')}
          className={activeTab === 'logs' ? 'active' : ''}
        >
          로그 ({filteredLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={activeTab === 'stats' ? 'active' : ''}
        >
          통계
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'logs' && <LogList logs={filteredLogs} />}
        {activeTab === 'stats' && <LogStats stats={stats} />}
      </div>

      {/* 빈 상태 */}
      {!isIntercepting && logs.length === 0 && (
        <div className="empty-state">
          <p>콘솔 캡처를 시작하여 로그를 확인하세요.</p>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: UI 정상 동작

---

### Task #8.16: LogList 컴포넌트

- **파일**: `src/sidepanel/components/Console/LogList.tsx`
- **시간**: 30분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import React from 'react';
import { ConsoleLog } from '../../../types/console';
import { LogEntry } from './LogEntry';

interface LogListProps {
  logs: ConsoleLog[];
}

export function LogList({ logs }: LogListProps) {
  if (logs.length === 0) {
    return (
      <div className="empty-list">
        <p>로그가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="log-list">
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
}
```
- **완료 조건**: 리스트 렌더링 정상

---

### Task #8.17: LogEntry 컴포넌트

- **파일**: `src/sidepanel/components/Console/LogEntry.tsx`
- **시간**: 45분
- **의존성**: Task #8.1, #8.4
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { ConsoleLog } from '../../../types/console';
import { format } from 'date-fns';
import { LOG_LEVEL_COLORS, LOG_LEVEL_ICONS } from '../../../constants/console';
import { StackTrace } from './StackTrace';

interface LogEntryProps {
  log: ConsoleLog;
}

export function LogEntry({ log }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const time = format(log.timestamp, 'HH:mm:ss.SSS');
  const color = LOG_LEVEL_COLORS[log.level];
  const icon = LOG_LEVEL_ICONS[log.level];

  return (
    <div className={`log-entry log-level-${log.level}`}>
      <div className="entry-header" onClick={() => setIsExpanded(!isExpanded)}>
        {/* 시간 */}
        <span className="log-time">{time}</span>

        {/* 레벨 아이콘 */}
        <span className="log-icon" style={{ color }}>
          {icon}
        </span>

        {/* 메시지 */}
        <span className="log-message" style={{ color }}>
          {log.message}
        </span>

        {/* 카운트 */}
        {log.count && log.count > 1 && (
          <span className="log-count">{log.count}</span>
        )}

        {/* 확장 아이콘 */}
        {(log.stackTrace || log.source || log.args.length > 1) && (
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        )}
      </div>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="entry-details">
          {/* 원본 인자 */}
          {log.args.length > 0 && (
            <div className="log-args">
              <label>Arguments:</label>
              <pre>{JSON.stringify(log.args, null, 2)}</pre>
            </div>
          )}

          {/* 소스 위치 */}
          {log.source && (
            <div className="log-source">
              <label>Source:</label>
              <span>
                {log.source.file}:{log.source.line}:{log.source.column}
              </span>
            </div>
          )}

          {/* 성능 정보 */}
          {log.performance && (
            <div className="log-performance">
              <label>Performance:</label>
              <span>
                {log.performance.label}: {log.performance.duration.toFixed(2)}ms
              </span>
            </div>
          )}

          {/* 스택 트레이스 */}
          {log.stackTrace && <StackTrace stack={log.stackTrace} />}
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 로그 항목 정상 표시

---

### Task #8.18: LogFilter 컴포넌트

- **파일**: `src/sidepanel/components/Console/LogFilter.tsx`
- **시간**: 20분
- **의존성**: Task #8.1, #8.4
- **상세 내용**:
```typescript
import React from 'react';
import { ConsoleFilter, LogLevel } from '../../../types/console';
import { LOG_LEVEL_LABELS, LOG_LEVEL_ICONS } from '../../../constants/console';

interface LogFilterProps {
  filter: ConsoleFilter;
  onToggleLevel: (level: LogLevel) => void;
  onReset: () => void;
}

export function LogFilter({ filter, onToggleLevel, onReset }: LogFilterProps) {
  const levels: LogLevel[] = ['log', 'warn', 'error', 'info', 'debug'];

  return (
    <div className="log-filter">
      <div className="filter-levels">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onToggleLevel(level)}
            className={`level-btn ${filter.levels.includes(level) ? 'active' : ''}`}
            data-level={level}
          >
            <span className="level-icon">{LOG_LEVEL_ICONS[level]}</span>
            <span className="level-label">{LOG_LEVEL_LABELS[level]}</span>
          </button>
        ))}
      </div>

      <button onClick={onReset} className="reset-btn">
        필터 초기화
      </button>
    </div>
  );
}
```
- **완료 조건**: 필터 UI 정상 동작

---

### Task #8.19: StackTrace 및 SearchBar 컴포넌트

- **파일**: `src/sidepanel/components/Console/StackTrace.tsx`, `SearchBar.tsx`
- **시간**: 30분
- **의존성**: Task #8.6
- **상세 내용**:
```typescript
// StackTrace.tsx
import React from 'react';
import { parseStackTrace } from '../../../utils/console/stackTrace';

interface StackTraceProps {
  stack: string;
}

export function StackTrace({ stack }: StackTraceProps) {
  const frames = parseStackTrace(stack);

  return (
    <div className="stack-trace">
      <label>Stack Trace:</label>
      <div className="stack-frames">
        {frames.map((frame, index) => (
          <div key={index} className="stack-frame">
            <span className="frame-function">
              {frame.functionName || '<anonymous>'}
            </span>
            <span className="frame-location">
              {frame.file}:{frame.line}:{frame.column}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// SearchBar.tsx
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="로그 검색..."
        className="search-input"
      />

      {query && (
        <button onClick={handleClear} className="clear-search-btn">
          ✕
        </button>
      )}
    </div>
  );
}
```
- **완료 조건**: 컴포넌트 정상 동작

---

[Phase 5: 테스트](./TASK-08-PHASE5.md) 로 계속
