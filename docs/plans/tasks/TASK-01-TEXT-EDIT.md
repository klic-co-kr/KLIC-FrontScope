# 도구 #1: 텍스트 편집 - 완전 태스크 분해

**총 태스크**: 30개
**예상 시간**: 12-15시간 (1.5-2일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (6개 태스크, 2시간)](#phase-1-기반-설정)
- [Phase 2: DOM 조작 유틸리티 (10개 태스크, 6시간)](#phase-2-dom-조작-유틸리티)
- [Phase 3: Storage 및 히스토리 관리 (2개 태스크, 2.5시간)](#phase-3-storage-및-히스토리-관리)
- [Phase 4: React 컴포넌트 (5개 태스크, 3시간)](#phase-4-react-컴포넌트)
- [Phase 5: Content Script 통합 (4개 태스크, 2.5시간)](#phase-5-content-script-통합)
- [Phase 6: 테스트 및 최적화 (3개 태스크, 2시간)](#phase-6-테스트-및-최적화)

---

## Phase 1: 기반 설정 (6개 태스크, 2시간)

### Task #1.1: 타입 정의 - 기본 인터페이스
- **파일**: `src/types/textEdit.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 단일 텍스트 편집 기록
 */
export interface TextEdit {
  id: string;                    // UUID
  timestamp: number;             // Date.now()
  element: {
    tagName: string;            // 'P', 'H1', 'SPAN' etc
    selector: string;           // CSS selector
    xpath: string;              // XPath
    className?: string;         // 클래스명
    id?: string;                // 요소 ID
  };
  changes: {
    before: string;             // 수정 전 텍스트
    after: string;              // 수정 후 텍스트
    charDiff: number;           // 글자 수 차이
  };
  metadata?: {
    wordCount: {
      before: number;
      after: number;
    };
    language?: 'ko' | 'en' | 'ja' | 'zh' | 'other';
    editDuration?: number;      // 편집에 걸린 시간 (ms)
  };
}

/**
 * 텍스트 편집 히스토리
 */
export interface TextEditHistory {
  edits: TextEdit[];
  maxSize: number;              // 기본 20
  totalEdits: number;
  lastEditTime: number;
}

/**
 * 편집 가능한 요소 정보
 */
export interface EditableElement {
  element: HTMLElement;
  selector: string;
  originalText: string;
  isEditing: boolean;
  editStartTime?: number;
}

/**
 * 텍스트 편집 설정
 */
export interface TextEditSettings {
  maxHistorySize: number;       // 기본 20
  autoSave: boolean;            // 자동 저장
  preserveFormatting: boolean;  // 포맷 보존
  highlightColor: string;       // 하이라이트 색상
  enableKeyboardShortcuts: boolean;
  shortcuts: {
    save: string;               // 기본 'Ctrl+Enter'
    cancel: string;             // 기본 'Escape'
    undo: string;               // 기본 'Ctrl+Z'
  };
}

/**
 * 텍스트 편집 통계
 */
export interface TextEditStats {
  totalEdits: number;
  totalCharsAdded: number;
  totalCharsRemoved: number;
  totalCharsChanged: number;
  totalWordsChanged: number;
  editedElements: number;
  averageEditDuration: number;
  lastEditTime: number;
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #1.2: Storage 상수 정의
- **파일**: `src/constants/storage.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // 텍스트 편집
  TEXT_EDIT_HISTORY: 'textEdit:history',
  TEXT_EDIT_SETTINGS: 'textEdit:settings',
  TEXT_EDIT_TEMP: 'textEdit:temp',
  TEXT_EDIT_STATS: 'textEdit:stats',

  // 스크린샷
  SCREENSHOT_HISTORY: 'screenshot:history',
  SCREENSHOT_SETTINGS: 'screenshot:settings',

  // CSS 스캔
  CSS_SCAN_HISTORY: 'cssScan:history',

  // ... 나머지 도구들
} as const;

export const STORAGE_LIMITS = {
  TEXT_EDIT_MAX_HISTORY: 20,
  SCREENSHOT_MAX_HISTORY: 10,
  CSS_SCAN_MAX_HISTORY: 15,
  TOTAL_QUOTA_MB: 10,
} as const;
```

### Task #1.3: 메시지 액션 상수
- **파일**: `src/constants/messages.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // 텍스트 편집
  TEXT_EDIT_TOGGLE: 'TEXT_EDIT_TOGGLE',
  TEXT_EDIT_SAVE: 'TEXT_EDIT_SAVE',
  TEXT_EDIT_UNDO: 'TEXT_EDIT_UNDO',
  TEXT_EDIT_UNDO_ALL: 'TEXT_EDIT_UNDO_ALL',
  TEXT_EDIT_GET_STATS: 'TEXT_EDIT_GET_STATS',
  TEXT_EDIT_HIGHLIGHT: 'TEXT_EDIT_HIGHLIGHT',
  TEXT_EDIT_START: 'TEXT_EDIT_START',
  TEXT_EDIT_END: 'TEXT_EDIT_END',

  // 스크린샷
  SCREENSHOT_CAPTURE: 'SCREENSHOT_CAPTURE',
  SCREENSHOT_SAVE: 'SCREENSHOT_SAVE',

  // ... 나머지
} as const;

export type MessageAction = typeof MESSAGE_ACTIONS[keyof typeof MESSAGE_ACTIONS];

export interface Message<T = any> {
  action: MessageAction;
  data?: T;
  timestamp: number;
}
```

### Task #1.4: CSS 클래스 상수
- **파일**: `src/constants/classes.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const TEXT_EDIT_CLASSES = {
  HOVER: 'klic-text-edit-hover',
  EDITING: 'klic-text-edit-editing',
  EDITED: 'klic-text-edit-edited',
  HIGHLIGHT: 'klic-text-edit-highlight',
  DISABLED: 'klic-text-edit-disabled',
} as const;

export const TOOL_PREFIX = 'klic-' as const;

export function getToolClass(tool: string, state: string): string {
  return `${TOOL_PREFIX}${tool}-${state}`;
}
```

### Task #1.5: 에러 메시지 상수
- **파일**: `src/constants/errors.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  TEXT_EDIT: {
    ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
    STORAGE_FULL: '저장 공간이 부족합니다',
    INVALID_ELEMENT: '편집할 수 없는 요소입니다',
    PERMISSION_DENIED: '편집 권한이 없습니다',
    IFRAME_ACCESS: 'iframe 내부는 접근할 수 없습니다',
    RESTORE_FAILED: '원본 복원에 실패했습니다',
  },
  SCREENSHOT: {
    CAPTURE_FAILED: '캡처에 실패했습니다',
    CLIPBOARD_DENIED: '클립보드 권한이 없습니다',
    SIZE_TOO_LARGE: '이미지 크기가 너무 큽니다',
  },
  // ... 나머지
} as const;

export class KlicError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'KlicError';
  }
}
```

### Task #1.6: 기본 설정 값
- **파일**: `src/constants/defaults.ts`
- **시간**: 15분
- **의존성**: Task #1.1
- **상세 내용**:
```typescript
import { TextEditSettings } from '../types/textEdit';

export const DEFAULT_TEXT_EDIT_SETTINGS: TextEditSettings = {
  maxHistorySize: 20,
  autoSave: true,
  preserveFormatting: true,
  highlightColor: '#f59e0b',
  enableKeyboardShortcuts: true,
  shortcuts: {
    save: 'Ctrl+Enter',
    cancel: 'Escape',
    undo: 'Ctrl+Z',
  },
};

export const DEFAULT_SCREENSHOT_SETTINGS = {
  format: 'png' as const,
  quality: 0.92,
  captureMode: 'element' as const,
};

// ... 나머지 도구 기본값
```

---

## Phase 2: DOM 조작 유틸리티 (10개 태스크, 6시간)

### Task #1.7: 편집 가능한 요소 탐지
- **파일**: `src/utils/textEdit/elementDetector.ts`
- **시간**: 1시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **테스트 케이스**:
  - 일반 p, h1 태그 감지
  - 자식이 있는 div 제외
  - 숨겨진 요소 제외
  - contentEditable="false" 제외
  - SVG 텍스트 제외
  - iframe 내부 제외
- **완료 조건**: 모든 테스트 통과, 실제 페이지에서 정확한 요소만 선택

### Task #1.8: CSS 선택자 생성
- **파일**: `src/utils/dom/selectorGenerator.ts`
- **시간**: 1.5시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **테스트 케이스**:
  - ID 있는 요소 → `#id`
  - 유니크 클래스 → `.class1.class2`
  - data-testid 있는 요소 → `[data-testid="value"]`
  - nth-child 필요한 요소
  - 깊이 중첩된 요소
  - 특수 문자 포함 ID/클래스
- **완료 조건**: 모든 테스트 통과, 실제 페이지에서 정확한 요소 선택

### Task #1.9: XPath 생성
- **파일**: `src/utils/dom/xpathGenerator.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 생성된 XPath로 정확한 요소 검색 가능

### Task #1.10: 원본 텍스트 저장/복원
- **파일**: `src/utils/textEdit/textStorage.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 메모리 누수 없이 원본 관리

### Task #1.11: 텍스트 분석 유틸리티
- **파일**: `src/utils/textEdit/textAnalysis.ts`
- **시간**: 1시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 모든 언어에서 정확한 분석

### Task #1.12: 텍스트 diff 계산
- **파일**: `src/utils/textEdit/textDiff.ts`
- **시간**: 1.5시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 정확한 diff 생성

### Task #1.13: 포맷 보존 유틸리티
- **파일**: `src/utils/textEdit/formatPreserver.ts`
- **시간**: 1.5시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 포맷 손실 없이 텍스트 변경

### Task #1.14: 요소 하이라이트
- **파일**: `src/utils/textEdit/highlighter.ts`
- **시간**: 1시간
- **의존성**: Task #1.4
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 애니메이션 부드럽게 동작

### Task #1.15: contentEditable 제어
- **파일**: `src/utils/textEdit/editableControl.ts`
- **시간**: 1시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 모든 제어 기능 정상 동작

### Task #1.16: 키보드 이벤트 핸들러
- **파일**: `src/utils/textEdit/keyboardHandler.ts`
- **시간**: 1.5시간
- **의존성**: 없음
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 모든 단축키 동작

---

## Phase 3: Storage 및 히스토리 관리 (2개 태스크, 2.5시간)

### Task #1.17: Storage 기본 CRUD 훅
- **파일**: `src/hooks/textEdit/useTextEditStorage.ts`
- **시간**: 1.5시간
- **의존성**: Task #1.1, #1.2
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 안정적인 CRUD 동작

### Task #1.18: 히스토리 추가 로직
- **파일**: `src/hooks/textEdit/useTextEditHistory.ts`
- **시간**: 1시간
- **의존성**: Task #1.1, #1.17
- **상세 내용**: (COMPLETE-TASK-BREAKDOWN.md 참조)
- **완료 조건**: 히스토리 관리 정상 동작

---

## Phase 4: React 컴포넌트 (5개 태스크, 3시간)

### Task #1.19: TextEditorPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/TextEdit/TextEditorPanel.tsx`
- **시간**: 45분
- **의존성**: Task #1.17, #1.18
- **상세 내용**:
```typescript
import React, { useState, useEffect } from 'react';
import { useTextEditHistory } from '../../../hooks/textEdit/useTextEditHistory';
import { EditHistoryList } from './EditHistoryList';
import { TextEditStats } from './TextEditStats';
import { SettingsPanel } from './SettingsPanel';

interface TextEditorPanelProps {
  isActive: boolean;
  onToggle: () => void;
}

export function TextEditorPanel({ isActive, onToggle }: TextEditorPanelProps) {
  const {
    edits,
    totalEdits,
    lastEditTime,
    undoEdit,
    undoAll,
    getRecentEdits,
  } = useTextEditHistory();

  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'settings'>('history');
  const [isUndoingAll, setIsUndoingAll] = useState(false);

  /**
   * 텍스트 편집 모드 토글
   */
  const handleToggleEditMode = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TEXT_EDIT_TOGGLE',
          data: { enabled: !isActive },
        });

        onToggle();
      }
    } catch (error) {
      console.error('Failed to toggle edit mode:', error);
    }
  };

  /**
   * 특정 편집 되돌리기
   */
  const handleUndoEdit = async (editId: string) => {
    try {
      const success = await undoEdit(editId);

      if (success) {
        // 성공 알림 (토스트 등)
        console.log('Edit undone successfully');
      }
    } catch (error) {
      console.error('Failed to undo edit:', error);
    }
  };

  /**
   * 모든 편집 되돌리기
   */
  const handleUndoAll = async () => {
    if (!confirm('모든 편집을 되돌리시겠습니까?')) {
      return;
    }

    try {
      setIsUndoingAll(true);
      const count = await undoAll();

      console.log(`${count} edits undone`);
    } catch (error) {
      console.error('Failed to undo all:', error);
    } finally {
      setIsUndoingAll(false);
    }
  };

  /**
   * 요소 하이라이트
   */
  const handleHighlightElement = async (selector: string) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TEXT_EDIT_HIGHLIGHT',
          data: { selector },
        });
      }
    } catch (error) {
      console.error('Failed to highlight element:', error);
    }
  };

  return (
    <div className="text-editor-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>텍스트 편집</h2>

        <div className="header-actions">
          <button
            onClick={handleToggleEditMode}
            className={`toggle-btn ${isActive ? 'active' : ''}`}
          >
            {isActive ? '편집 모드 OFF' : '편집 모드 ON'}
          </button>

          {edits.length > 0 && (
            <button
              onClick={handleUndoAll}
              disabled={isUndoingAll}
              className="undo-all-btn"
            >
              {isUndoingAll ? '되돌리는 중...' : '모두 되돌리기'}
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'active' : ''}
        >
          히스토리 ({edits.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={activeTab === 'stats' ? 'active' : ''}
        >
          통계
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'history' && (
          <EditHistoryList
            edits={edits}
            onUndoEdit={handleUndoEdit}
            onHighlightElement={handleHighlightElement}
          />
        )}

        {activeTab === 'stats' && (
          <TextEditStats
            totalEdits={totalEdits}
            lastEditTime={lastEditTime}
            edits={edits}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </div>

      {/* 안내 메시지 */}
      {!isActive && edits.length === 0 && (
        <div className="empty-state">
          <p>텍스트 편집 모드를 활성화하고</p>
          <p>페이지의 텍스트를 클릭하여 편집하세요.</p>
        </div>
      )}
    </div>
  );
}
```
- **테스트 케이스**:
  - 편집 모드 토글
  - 탭 전환
  - 전체 되돌리기 확인 다이얼로그
  - 빈 상태 메시지 표시
- **완료 조건**: 모든 UI 동작 정상

### Task #1.20: EditHistoryList 컴포넌트
- **파일**: `src/sidepanel/components/TextEdit/EditHistoryList.tsx`
- **시간**: 30분
- **의존성**: Task #1.1
- **상세 내용**:
```typescript
import React from 'react';
import { TextEdit } from '../../../types/textEdit';
import { EditHistoryItem } from './EditHistoryItem';

interface EditHistoryListProps {
  edits: TextEdit[];
  onUndoEdit: (editId: string) => void;
  onHighlightElement: (selector: string) => void;
}

export function EditHistoryList({
  edits,
  onUndoEdit,
  onHighlightElement,
}: EditHistoryListProps) {
  if (edits.length === 0) {
    return (
      <div className="empty-list">
        <p>편집 히스토리가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="edit-history-list">
      {edits.map((edit) => (
        <EditHistoryItem
          key={edit.id}
          edit={edit}
          onUndo={() => onUndoEdit(edit.id)}
          onHighlight={() => onHighlightElement(edit.element.selector)}
        />
      ))}
    </div>
  );
}
```
- **완료 조건**: 리스트 렌더링 정상

### Task #1.21: EditHistoryItem 컴포넌트
- **파일**: `src/sidepanel/components/TextEdit/EditHistoryItem.tsx`
- **시간**: 45분
- **의존성**: Task #1.1
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { TextEdit } from '../../../types/textEdit';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EditHistoryItemProps {
  edit: TextEdit;
  onUndo: () => void;
  onHighlight: () => void;
}

export function EditHistoryItem({ edit, onUndo, onHighlight }: EditHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(edit.timestamp, {
    addSuffix: true,
    locale: ko,
  });

  const charDiff = edit.changes.charDiff;
  const diffSign = charDiff > 0 ? '+' : '';
  const diffClass = charDiff > 0 ? 'positive' : charDiff < 0 ? 'negative' : 'neutral';

  return (
    <div className="edit-history-item">
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        {/* 요소 정보 */}
        <div className="element-info">
          <span className="tag-name">{edit.element.tagName.toLowerCase()}</span>
          {edit.element.className && (
            <span className="class-name">.{edit.element.className.split(' ')[0]}</span>
          )}
          {edit.element.id && (
            <span className="element-id">#{edit.element.id}</span>
          )}
        </div>

        {/* 변경 정보 */}
        <div className="change-info">
          <span className={`char-diff ${diffClass}`}>
            {diffSign}{charDiff} 글자
          </span>
          <span className="time-ago">{timeAgo}</span>
        </div>

        {/* 확장 아이콘 */}
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="item-details">
          {/* 변경 전 */}
          <div className="text-section">
            <label>변경 전:</label>
            <div className="text-content before">
              {edit.changes.before || '(빈 텍스트)'}
            </div>
          </div>

          {/* 변경 후 */}
          <div className="text-section">
            <label>변경 후:</label>
            <div className="text-content after">
              {edit.changes.after || '(빈 텍스트)'}
            </div>
          </div>

          {/* 메타데이터 */}
          {edit.metadata && (
            <div className="metadata">
              {edit.metadata.language && (
                <span className="meta-item">
                  언어: {edit.metadata.language}
                </span>
              )}
              {edit.metadata.wordCount && (
                <span className="meta-item">
                  단어: {edit.metadata.wordCount.before} → {edit.metadata.wordCount.after}
                </span>
              )}
              {edit.metadata.editDuration && (
                <span className="meta-item">
                  편집 시간: {Math.round(edit.metadata.editDuration / 1000)}초
                </span>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="item-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHighlight();
              }}
              className="highlight-btn"
            >
              요소 하이라이트
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              className="undo-btn"
            >
              되돌리기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```
- **테스트 케이스**:
  - 확장/축소 토글
  - 시간 표시 (상대 시간)
  - 글자 수 증감 표시
  - 되돌리기 버튼
  - 하이라이트 버튼
- **완료 조건**: 모든 UI 정상 동작

### Task #1.22: TextEditStats 컴포넌트
- **파일**: `src/sidepanel/components/TextEdit/TextEditStats.tsx`
- **시간**: 30분
- **의존성**: Task #1.1
- **상세 내용**:
```typescript
import React, { useMemo } from 'react';
import { TextEdit } from '../../../types/textEdit';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TextEditStatsProps {
  totalEdits: number;
  lastEditTime: number;
  edits: TextEdit[];
}

export function TextEditStats({ totalEdits, lastEditTime, edits }: TextEditStatsProps) {
  /**
   * 통계 계산
   */
  const stats = useMemo(() => {
    let totalCharsAdded = 0;
    let totalCharsRemoved = 0;
    let totalCharsChanged = 0;
    let totalEditDuration = 0;
    const editedElements = new Set<string>();

    edits.forEach((edit) => {
      const diff = edit.changes.charDiff;

      if (diff > 0) {
        totalCharsAdded += diff;
      } else if (diff < 0) {
        totalCharsRemoved += Math.abs(diff);
      }

      totalCharsChanged += Math.abs(diff);

      if (edit.metadata?.editDuration) {
        totalEditDuration += edit.metadata.editDuration;
      }

      editedElements.add(edit.element.selector);
    });

    const averageEditDuration = edits.length > 0
      ? totalEditDuration / edits.length
      : 0;

    return {
      totalCharsAdded,
      totalCharsRemoved,
      totalCharsChanged,
      totalEditDuration,
      averageEditDuration,
      editedElements: editedElements.size,
    };
  }, [edits]);

  const lastEditDate = lastEditTime > 0
    ? format(lastEditTime, 'PPP p', { locale: ko })
    : '없음';

  return (
    <div className="text-edit-stats">
      <h3>편집 통계</h3>

      <div className="stats-grid">
        {/* 총 편집 수 */}
        <div className="stat-card">
          <div className="stat-label">총 편집 수</div>
          <div className="stat-value">{totalEdits}</div>
        </div>

        {/* 현재 편집 수 */}
        <div className="stat-card">
          <div className="stat-label">현재 편집 수</div>
          <div className="stat-value">{edits.length}</div>
        </div>

        {/* 편집한 요소 수 */}
        <div className="stat-card">
          <div className="stat-label">편집한 요소</div>
          <div className="stat-value">{stats.editedElements}</div>
        </div>

        {/* 추가된 글자 */}
        <div className="stat-card positive">
          <div className="stat-label">추가된 글자</div>
          <div className="stat-value">+{stats.totalCharsAdded}</div>
        </div>

        {/* 삭제된 글자 */}
        <div className="stat-card negative">
          <div className="stat-label">삭제된 글자</div>
          <div className="stat-value">-{stats.totalCharsRemoved}</div>
        </div>

        {/* 변경된 글자 */}
        <div className="stat-card">
          <div className="stat-label">변경된 글자</div>
          <div className="stat-value">{stats.totalCharsChanged}</div>
        </div>

        {/* 평균 편집 시간 */}
        <div className="stat-card">
          <div className="stat-label">평균 편집 시간</div>
          <div className="stat-value">
            {Math.round(stats.averageEditDuration / 1000)}초
          </div>
        </div>

        {/* 마지막 편집 */}
        <div className="stat-card full-width">
          <div className="stat-label">마지막 편집</div>
          <div className="stat-value small">{lastEditDate}</div>
        </div>
      </div>
    </div>
  );
}
```
- **완료 조건**: 통계 정확하게 계산 및 표시

### Task #1.23: SettingsPanel 컴포넌트
- **파일**: `src/sidepanel/components/TextEdit/SettingsPanel.tsx`
- **시간**: 30분
- **의존성**: Task #1.1
- **상세 내용**:
```typescript
import React, { useState, useEffect } from 'react';
import { TextEditSettings } from '../../../types/textEdit';
import { STORAGE_KEYS } from '../../../constants/storage';
import { DEFAULT_TEXT_EDIT_SETTINGS } from '../../../constants/defaults';

export function SettingsPanel() {
  const [settings, setSettings] = useState<TextEditSettings>(DEFAULT_TEXT_EDIT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 초기 설정 로드
   */
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.TEXT_EDIT_SETTINGS);

      if (result[STORAGE_KEYS.TEXT_EDIT_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.TEXT_EDIT_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  /**
   * 설정 저장
   */
  const saveSettings = async (newSettings: TextEditSettings) => {
    try {
      setIsSaving(true);

      await chrome.storage.local.set({
        [STORAGE_KEYS.TEXT_EDIT_SETTINGS]: newSettings,
      });

      setSettings(newSettings);

      // 성공 알림
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = <K extends keyof TextEditSettings>(
    key: K,
    value: TextEditSettings[K]
  ) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };

    saveSettings(newSettings);
  };

  return (
    <div className="settings-panel">
      <h3>텍스트 편집 설정</h3>

      <div className="settings-form">
        {/* 최대 히스토리 크기 */}
        <div className="setting-item">
          <label htmlFor="maxHistorySize">최대 히스토리 크기</label>
          <input
            id="maxHistorySize"
            type="number"
            min="5"
            max="100"
            value={settings.maxHistorySize}
            onChange={(e) => handleChange('maxHistorySize', parseInt(e.target.value))}
          />
          <span className="setting-hint">5-100 사이의 값</span>
        </div>

        {/* 자동 저장 */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
            자동 저장
          </label>
          <span className="setting-hint">편집 완료 시 자동으로 저장</span>
        </div>

        {/* 포맷 보존 */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.preserveFormatting}
              onChange={(e) => handleChange('preserveFormatting', e.target.checked)}
            />
            포맷 보존
          </label>
          <span className="setting-hint">HTML 태그와 스타일 유지</span>
        </div>

        {/* 하이라이트 색상 */}
        <div className="setting-item">
          <label htmlFor="highlightColor">하이라이트 색상</label>
          <input
            id="highlightColor"
            type="color"
            value={settings.highlightColor}
            onChange={(e) => handleChange('highlightColor', e.target.value)}
          />
        </div>

        {/* 키보드 단축키 활성화 */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enableKeyboardShortcuts}
              onChange={(e) => handleChange('enableKeyboardShortcuts', e.target.checked)}
            />
            키보드 단축키 활성화
          </label>
        </div>

        {/* 단축키 설정 */}
        {settings.enableKeyboardShortcuts && (
          <div className="shortcuts-section">
            <h4>단축키</h4>

            <div className="shortcut-item">
              <label>저장</label>
              <span className="shortcut-value">{settings.shortcuts.save}</span>
            </div>

            <div className="shortcut-item">
              <label>취소</label>
              <span className="shortcut-value">{settings.shortcuts.cancel}</span>
            </div>

            <div className="shortcut-item">
              <label>실행 취소</label>
              <span className="shortcut-value">{settings.shortcuts.undo}</span>
            </div>
          </div>
        )}
      </div>

      {isSaving && (
        <div className="saving-indicator">저장 중...</div>
      )}
    </div>
  );
}
```
- **완료 조건**: 설정 변경 시 즉시 저장

---

## Phase 5: Content Script 통합 (4개 태스크, 2.5시간)

### Task #1.24: Content Script 이벤트 리스너
- **파일**: `src/content/textEdit/eventListeners.ts`
- **시간**: 45분
- **의존성**: Task #1.7, #1.14, #1.15
- **상세 내용**:
```typescript
import { getEditableElements, isElementEditable } from '../../utils/textEdit/elementDetector';
import { highlightElement, removeHighlight } from '../../utils/textEdit/highlighter';
import { makeEditable, makeUneditable } from '../../utils/textEdit/editableControl';
import { saveOriginalText, getOriginalText } from '../../utils/textEdit/textStorage';

let isTextEditMode = false;
let currentEditingElement: HTMLElement | null = null;

/**
 * 텍스트 편집 모드 초기화
 */
export function initTextEditMode() {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  document.addEventListener('blur', handleBlur, true);
}

/**
 * 텍스트 편집 모드 정리
 */
export function cleanupTextEditMode() {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('blur', handleBlur, true);

  // 모든 하이라이트 제거
  removeAllHighlights();

  // 현재 편집 중인 요소 정리
  if (currentEditingElement) {
    makeUneditable(currentEditingElement);
    currentEditingElement = null;
  }
}

/**
 * 마우스 오버 핸들러
 */
function handleMouseOver(event: MouseEvent) {
  if (!isTextEditMode) return;
  if (currentEditingElement) return; // 편집 중에는 hover 비활성화

  const target = event.target as HTMLElement;

  if (isElementEditable(target)) {
    highlightElement(target, 'hover');
  }
}

/**
 * 마우스 아웃 핸들러
 */
function handleMouseOut(event: MouseEvent) {
  if (!isTextEditMode) return;
  if (currentEditingElement) return;

  const target = event.target as HTMLElement;

  if (isElementEditable(target)) {
    removeHighlight(target, 'hover');
  }
}

/**
 * 클릭 핸들러
 */
function handleClick(event: MouseEvent) {
  if (!isTextEditMode) return;

  const target = event.target as HTMLElement;

  // 이미 편집 중인 요소면 무시
  if (target === currentEditingElement) {
    return;
  }

  // 편집 가능한 요소가 아니면 무시
  if (!isElementEditable(target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  // 이전 편집 요소 정리
  if (currentEditingElement) {
    finishEditing(currentEditingElement);
  }

  // 새 요소 편집 시작
  startEditing(target);
}

/**
 * 블러 핸들러
 */
function handleBlur(event: FocusEvent) {
  if (!isTextEditMode) return;

  const target = event.target as HTMLElement;

  if (target === currentEditingElement) {
    finishEditing(target);
  }
}

/**
 * 편집 시작
 */
function startEditing(element: HTMLElement) {
  // 원본 저장
  saveOriginalText(element);

  // 편집 가능하게
  makeEditable(element);

  // 하이라이트
  removeHighlight(element, 'hover');
  highlightElement(element, 'editing');

  currentEditingElement = element;

  // Side Panel에 알림
  chrome.runtime.sendMessage({
    action: 'TEXT_EDIT_START',
    data: {
      selector: getSelector(element),
      originalText: getOriginalText(element),
    },
  });
}

/**
 * 편집 완료
 */
function finishEditing(element: HTMLElement) {
  const originalText = getOriginalText(element);
  const newText = element.textContent || '';

  // 변경사항이 있으면 저장
  if (originalText !== newText) {
    saveEdit(element, originalText, newText);
  }

  // 편집 불가능하게
  makeUneditable(element);

  // 하이라이트 변경
  removeHighlight(element, 'editing');

  if (originalText !== newText) {
    highlightElement(element, 'edited');
  }

  currentEditingElement = null;
}

/**
 * 편집 저장
 */
async function saveEdit(element: HTMLElement, before: string, after: string) {
  const edit: TextEdit = {
    id: generateUUID(),
    timestamp: Date.now(),
    element: {
      tagName: element.tagName,
      selector: getSelector(element),
      xpath: getXPath(element),
      className: element.className,
      id: element.id,
    },
    changes: {
      before,
      after,
      charDiff: after.length - before.length,
    },
    metadata: {
      wordCount: {
        before: countWords(before),
        after: countWords(after),
      },
      language: detectLanguage(after),
      editDuration: element.dataset.editDuration
        ? parseInt(element.dataset.editDuration)
        : undefined,
    },
  };

  // Side Panel에 전송
  chrome.runtime.sendMessage({
    action: 'TEXT_EDIT_SAVE',
    data: edit,
  });
}

/**
 * 텍스트 편집 모드 토글
 */
export function toggleTextEditMode(enabled: boolean) {
  isTextEditMode = enabled;

  if (enabled) {
    initTextEditMode();
  } else {
    cleanupTextEditMode();
  }
}

// 필요한 함수들 import
import { getSelector } from '../../utils/dom/selectorGenerator';
import { getXPath } from '../../utils/dom/xpathGenerator';
import { countWords, detectLanguage } from '../../utils/textEdit/textAnalysis';
import { TextEdit } from '../../types/textEdit';
import { generateUUID } from '../../utils/common/uuid';
import { removeAllHighlights } from '../../utils/textEdit/highlighter';
```
- **완료 조건**: 이벤트 리스너 정상 동작

### Task #1.25: 메시지 핸들러 구현
- **파일**: `src/content/textEdit/messageHandler.ts`
- **시간**: 30분
- **의존성**: Task #1.3, #1.24
- **상세 내용**:
```typescript
import { Message } from '../../constants/messages';
import { toggleTextEditMode } from './eventListeners';
import { undoSingleEdit, highlightElementBySelector } from './actions';

/**
 * 메시지 핸들러 등록
 */
export function registerMessageHandler() {
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * 메시지 처리
 */
function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  switch (message.action) {
    case 'TEXT_EDIT_TOGGLE':
      handleToggle(message.data);
      sendResponse({ success: true });
      break;

    case 'TEXT_EDIT_UNDO':
      handleUndo(message.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답

    case 'TEXT_EDIT_HIGHLIGHT':
      handleHighlight(message.data);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return false;
}

/**
 * 토글 처리
 */
function handleToggle(data: { enabled: boolean }) {
  toggleTextEditMode(data.enabled);
}

/**
 * 되돌리기 처리
 */
async function handleUndo(data: TextEdit) {
  try {
    await undoSingleEdit(data);
  } catch (error) {
    console.error('Failed to undo edit:', error);
    throw error;
  }
}

/**
 * 하이라이트 처리
 */
function handleHighlight(data: { selector: string }) {
  highlightElementBySelector(data.selector);
}
```
- **완료 조건**: 모든 메시지 처리 정상

### Task #1.26: 오버레이 스타일 주입
- **파일**: `src/content/textEdit/styles.ts`
- **시간**: 30분
- **의존성**: Task #1.4
- **상세 내용**:
```typescript
import { TEXT_EDIT_CLASSES } from '../../constants/classes';

/**
 * 텍스트 편집 스타일 주입
 */
export function injectTextEditStyles() {
  const styleId = 'klic-text-edit-styles';

  // 이미 주입되었으면 무시
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Hover 상태 */
    .${TEXT_EDIT_CLASSES.HOVER} {
      outline: 2px dashed #f59e0b !important;
      outline-offset: 2px !important;
      cursor: text !important;
      transition: outline 0.2s ease !important;
    }

    /* 편집 중 */
    .${TEXT_EDIT_CLASSES.EDITING} {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px !important;
      background-color: rgba(59, 130, 246, 0.05) !important;
      transition: all 0.2s ease !important;
    }

    /* 편집 완료 */
    .${TEXT_EDIT_CLASSES.EDITED} {
      outline: 2px solid #10b981 !important;
      outline-offset: 2px !important;
      transition: outline 0.2s ease !important;
    }

    /* 하이라이트 */
    .${TEXT_EDIT_CLASSES.HIGHLIGHT} {
      animation: klic-pulse 1s ease-in-out 3;
    }

    @keyframes klic-pulse {
      0%, 100% {
        background-color: transparent;
      }
      50% {
        background-color: rgba(245, 158, 11, 0.3);
      }
    }

    /* 비활성화 */
    .${TEXT_EDIT_CLASSES.DISABLED} {
      pointer-events: none !important;
      opacity: 0.5 !important;
    }

    /* contentEditable 스타일 개선 */
    [contenteditable="true"]:focus {
      outline: none !important;
    }

    [contenteditable="true"] {
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  `;

  document.head.appendChild(style);
}

/**
 * 텍스트 편집 스타일 제거
 */
export function removeTextEditStyles() {
  const style = document.getElementById('klic-text-edit-styles');

  if (style) {
    style.remove();
  }
}
```
- **완료 조건**: 스타일 정상 적용

### Task #1.27: Side Panel 통신
- **파일**: `src/content/textEdit/communication.ts`
- **시간**: 45분
- **의존성**: Task #1.3
- **상세 내용**:
```typescript
import { Message, MESSAGE_ACTIONS } from '../../constants/messages';
import { TextEdit, TextEditStats } from '../../types/textEdit';

/**
 * Side Panel에 편집 저장 메시지 전송
 */
export async function sendEditToSidePanel(edit: TextEdit): Promise<boolean> {
  try {
    const message: Message = {
      action: MESSAGE_ACTIONS.TEXT_EDIT_SAVE,
      data: edit,
      timestamp: Date.now(),
    };

    const response = await chrome.runtime.sendMessage(message);

    return response?.success === true;
  } catch (error) {
    console.error('Failed to send edit to side panel:', error);
    return false;
  }
}

/**
 * 편집 시작 알림
 */
export function notifyEditStart(selector: string, originalText: string) {
  const message: Message = {
    action: MESSAGE_ACTIONS.TEXT_EDIT_START,
    data: { selector, originalText },
    timestamp: Date.now(),
  };

  chrome.runtime.sendMessage(message).catch((error) => {
    console.error('Failed to notify edit start:', error);
  });
}

/**
 * 편집 종료 알림
 */
export function notifyEditEnd(selector: string) {
  const message: Message = {
    action: MESSAGE_ACTIONS.TEXT_EDIT_END,
    data: { selector },
    timestamp: Date.now(),
  };

  chrome.runtime.sendMessage(message).catch((error) => {
    console.error('Failed to notify edit end:', error);
  });
}

/**
 * 통계 요청
 */
export async function requestStats(): Promise<TextEditStats | null> {
  try {
    const message: Message = {
      action: MESSAGE_ACTIONS.TEXT_EDIT_GET_STATS,
      data: {},
      timestamp: Date.now(),
    };

    const response = await chrome.runtime.sendMessage(message);

    return response?.data || null;
  } catch (error) {
    console.error('Failed to request stats:', error);
    return null;
  }
}
```
- **완료 조건**: 통신 정상 동작

---

## Phase 6: 테스트 및 최적화 (3개 태스크, 2시간)

### Task #1.28: 단위 테스트 작성
- **파일**: `src/utils/textEdit/__tests__/textEdit.test.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEditableElements, isElementEditable } from '../elementDetector';
import { getSelector, isSelectorUnique } from '../../dom/selectorGenerator';
import { getXPath, getElementByXPath } from '../../dom/xpathGenerator';
import { countWords, detectLanguage, getTextStats } from '../textAnalysis';
import { calculateDiff } from '../textDiff';
import {
  saveOriginalText,
  getOriginalText,
  restoreOriginalText,
  isTextChanged,
} from '../textStorage';

describe('elementDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <p id="editable-p">Test paragraph</p>
        <h1>Test heading</h1>
        <span>Test span</span>
        <div style="display: none">Hidden div</div>
        <script>console.log('test')</script>
        <input type="text" value="input" />
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect editable elements', () => {
    const elements = getEditableElements();

    expect(elements.length).toBeGreaterThan(0);
    expect(elements.some((el) => el.tagName === 'P')).toBe(true);
    expect(elements.some((el) => el.tagName === 'H1')).toBe(true);
  });

  it('should exclude hidden elements', () => {
    const elements = getEditableElements({ includeHidden: false });

    expect(elements.every((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    })).toBe(true);
  });

  it('should exclude script and input elements', () => {
    const elements = getEditableElements();

    expect(elements.some((el) => el.tagName === 'SCRIPT')).toBe(false);
    expect(elements.some((el) => el.tagName === 'INPUT')).toBe(false);
  });

  it('should check if element is editable', () => {
    const p = document.getElementById('editable-p') as HTMLElement;
    const input = document.querySelector('input') as HTMLElement;

    expect(isElementEditable(p)).toBe(true);
    expect(isElementEditable(input)).toBe(false);
  });
});

describe('selectorGenerator', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="unique-id">Content</div>
      <div class="unique-class">Content</div>
      <div><p>Nested</p></div>
    `;
  });

  it('should generate selector with ID', () => {
    const el = document.getElementById('unique-id')!;
    const selector = getSelector(el);

    expect(selector).toBe('#unique-id');
    expect(isSelectorUnique(selector)).toBe(true);
  });

  it('should generate selector with class', () => {
    const el = document.querySelector('.unique-class')!;
    const selector = getSelector(el);

    expect(selector).toContain('unique-class');
  });

  it('should generate unique selector', () => {
    const el = document.querySelector('p')!;
    const selector = getSelector(el);

    expect(isSelectorUnique(selector)).toBe(true);
    expect(document.querySelector(selector)).toBe(el);
  });
});

describe('xpathGenerator', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <p>First</p>
        <p>Second</p>
      </div>
    `;
  });

  it('should generate XPath', () => {
    const p = document.querySelector('p')!;
    const xpath = getXPath(p);

    expect(xpath).toBeTruthy();
    expect(xpath).toContain('p');
  });

  it('should find element by XPath', () => {
    const p = document.querySelector('p')!;
    const xpath = getXPath(p);
    const found = getElementByXPath(xpath);

    expect(found).toBe(p);
  });
});

describe('textAnalysis', () => {
  it('should count English words', () => {
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('One two three four')).toBe(4);
  });

  it('should count Korean characters', () => {
    expect(countWords('안녕하세요', 'ko')).toBe(5);
  });

  it('should detect language', () => {
    expect(detectLanguage('Hello world')).toBe('en');
    expect(detectLanguage('안녕하세요')).toBe('ko');
    expect(detectLanguage('こんにちは')).toBe('ja');
    expect(detectLanguage('你好')).toBe('zh');
  });

  it('should get text stats', () => {
    const stats = getTextStats('Hello world\nNew line');

    expect(stats.chars).toBeGreaterThan(0);
    expect(stats.words).toBe(3);
    expect(stats.lines).toBe(2);
    expect(stats.language).toBe('en');
  });
});

describe('textDiff', () => {
  it('should calculate diff', () => {
    const diff = calculateDiff('Hello world', 'Hello beautiful world');

    expect(diff.added).toContain('beautiful');
    expect(diff.charDiff).toBeGreaterThan(0);
    expect(diff.wordDiff).toBe(1);
  });

  it('should calculate similarity', () => {
    const diff1 = calculateDiff('test', 'test');
    const diff2 = calculateDiff('test', 'best');
    const diff3 = calculateDiff('test', 'completely different');

    expect(diff1.similarity).toBe(1);
    expect(diff2.similarity).toBeGreaterThan(0.5);
    expect(diff3.similarity).toBeLessThan(0.5);
  });
});

describe('textStorage', () => {
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<p>Original text</p>';
    element = document.querySelector('p')!;
  });

  it('should save and get original text', () => {
    saveOriginalText(element);

    expect(getOriginalText(element)).toBe('Original text');
  });

  it('should restore original text', () => {
    saveOriginalText(element);
    element.textContent = 'Modified text';

    expect(isTextChanged(element)).toBe(true);

    restoreOriginalText(element);

    expect(element.textContent).toBe('Original text');
    expect(getOriginalText(element)).toBeUndefined();
  });

  it('should detect text changes', () => {
    saveOriginalText(element);

    expect(isTextChanged(element)).toBe(false);

    element.textContent = 'New text';

    expect(isTextChanged(element)).toBe(true);
  });
});
```
- **완료 조건**: 80% 이상 테스트 커버리지

### Task #1.29: 통합 테스트 작성
- **파일**: `src/content/textEdit/__tests__/integration.test.ts`
- **시간**: 45분
- **의존성**: Task #1.24-#1.27
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTextEditMode, cleanupTextEditMode, toggleTextEditMode } from '../eventListeners';
import { injectTextEditStyles, removeTextEditStyles } from '../styles';
import { sendEditToSidePanel, notifyEditStart, notifyEditEnd } from '../communication';

describe('Text Edit Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-page">
        <h1>Test Heading</h1>
        <p id="test-p">Test paragraph</p>
        <span>Test span</span>
      </div>
    `;

    // Mock chrome API
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
        onMessage: {
          addListener: vi.fn(),
        },
      },
    } as any;
  });

  afterEach(() => {
    cleanupTextEditMode();
    removeTextEditStyles();
    document.body.innerHTML = '';
  });

  it('should initialize text edit mode', () => {
    injectTextEditStyles();
    initTextEditMode();

    const style = document.getElementById('klic-text-edit-styles');
    expect(style).toBeTruthy();
  });

  it('should handle mouse over and highlight element', () => {
    injectTextEditStyles();
    toggleTextEditMode(true);

    const p = document.getElementById('test-p')!;

    // Simulate mouse over
    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    Object.defineProperty(mouseOverEvent, 'target', { value: p, enumerable: true });

    p.dispatchEvent(mouseOverEvent);

    // Check if hover class is added
    expect(p.classList.contains('klic-text-edit-hover')).toBe(true);
  });

  it('should handle click and make element editable', () => {
    toggleTextEditMode(true);

    const p = document.getElementById('test-p')!;

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(clickEvent, 'target', { value: p, enumerable: true });

    p.dispatchEvent(clickEvent);

    // Check if element is editable
    expect(p.contentEditable).toBe('true');
  });

  it('should send edit to side panel', async () => {
    const edit = {
      id: 'test-id',
      timestamp: Date.now(),
      element: {
        tagName: 'P',
        selector: '#test-p',
        xpath: '//*[@id="test-p"]',
      },
      changes: {
        before: 'Before',
        after: 'After',
        charDiff: 1,
      },
    };

    const result = await sendEditToSidePanel(edit);

    expect(result).toBe(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
  });

  it('should cleanup properly', () => {
    injectTextEditStyles();
    toggleTextEditMode(true);

    toggleTextEditMode(false);
    removeTextEditStyles();

    const style = document.getElementById('klic-text-edit-styles');
    expect(style).toBeFalsy();
  });
});
```
- **완료 조건**: 통합 시나리오 테스트 통과

### Task #1.30: 성능 최적화
- **파일**: `src/utils/textEdit/performance.ts`
- **시간**: 15분
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
/**
 * 디바운스 유틸리티
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * 쓰로틀 유틸리티
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 배치 처리 유틸리티
 */
export function batchProcess<T>(
  items: T[],
  processor: (item: T) => void,
  batchSize: number = 10
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;

    function processBatch() {
      const batch = items.slice(index, index + batchSize);

      batch.forEach(processor);

      index += batchSize;

      if (index < items.length) {
        requestAnimationFrame(processBatch);
      } else {
        resolve();
      }
    }

    processBatch();
  });
}

/**
 * 요소 캐싱
 */
const elementCache = new WeakMap<Element, any>();

export function cacheElement<T>(element: Element, key: string, value: T): void {
  let cache = elementCache.get(element);

  if (!cache) {
    cache = {};
    elementCache.set(element, cache);
  }

  cache[key] = value;
}

export function getCachedElement<T>(element: Element, key: string): T | undefined {
  const cache = elementCache.get(element);
  return cache?.[key];
}

/**
 * 성능 측정
 */
export function measurePerformance(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return duration;
}

/**
 * 메모리 사용량 추정
 */
export function estimateMemoryUsage(obj: any): number {
  const json = JSON.stringify(obj);
  return new Blob([json]).size;
}
```
- **최적화 항목**:
  - 이벤트 리스너 디바운스/쓰로틀
  - 요소 선택자 캐싱
  - 배치 처리로 렌더링 최적화
  - WeakMap 사용으로 메모리 누수 방지
- **완료 조건**: 성능 테스트 통과, 메모리 누수 없음

---

## ✅ 완료 체크리스트

- [ ] Phase 1: 기반 설정 (6개 태스크)
  - [ ] Task #1.1: 타입 정의
  - [ ] Task #1.2: Storage 상수
  - [ ] Task #1.3: 메시지 액션
  - [ ] Task #1.4: CSS 클래스
  - [ ] Task #1.5: 에러 메시지
  - [ ] Task #1.6: 기본 설정

- [ ] Phase 2: DOM 조작 유틸리티 (10개 태스크)
  - [ ] Task #1.7: 요소 탐지
  - [ ] Task #1.8: 선택자 생성
  - [ ] Task #1.9: XPath 생성
  - [ ] Task #1.10: 원본 저장/복원
  - [ ] Task #1.11: 텍스트 분석
  - [ ] Task #1.12: Diff 계산
  - [ ] Task #1.13: 포맷 보존
  - [ ] Task #1.14: 하이라이트
  - [ ] Task #1.15: contentEditable 제어
  - [ ] Task #1.16: 키보드 핸들러

- [ ] Phase 3: Storage 및 히스토리 (2개 태스크)
  - [ ] Task #1.17: Storage CRUD
  - [ ] Task #1.18: 히스토리 관리

- [ ] Phase 4: React 컴포넌트 (5개 태스크)
  - [ ] Task #1.19: TextEditorPanel
  - [ ] Task #1.20: EditHistoryList
  - [ ] Task #1.21: EditHistoryItem
  - [ ] Task #1.22: TextEditStats
  - [ ] Task #1.23: SettingsPanel

- [ ] Phase 5: Content Script 통합 (4개 태스크)
  - [ ] Task #1.24: 이벤트 리스너
  - [ ] Task #1.25: 메시지 핸들러
  - [ ] Task #1.26: 스타일 주입
  - [ ] Task #1.27: Side Panel 통신

- [ ] Phase 6: 테스트 및 최적화 (3개 태스크)
  - [ ] Task #1.28: 단위 테스트
  - [ ] Task #1.29: 통합 테스트
  - [ ] Task #1.30: 성능 최적화

---

**다음 단계**: 도구 #2 (스크린샷) 구현
