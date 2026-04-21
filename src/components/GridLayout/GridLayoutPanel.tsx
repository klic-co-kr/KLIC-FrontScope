/**
 * Grid Layout Panel Component
 *
 * 그리드 레이아웃 도구의 메인 패널 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGuideLines } from '../../hooks/gridLayout/useGuideLines';
import { useViewport } from '../../hooks/gridLayout/useViewport';
import { useGridOverlay } from '../../hooks/gridLayout/useGridOverlay';
import { useWhitespace } from '../../hooks/gridLayout/useWhitespace';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Ruler, Monitor, Grid3X3, Square, Keyboard, Trash2, GripVertical } from 'lucide-react';
import { sendGridMessage } from '../../hooks/gridLayout/sendGridMessage';
import { MESSAGE_ACTIONS } from '../../constants/messages';

import { GuideLinesPanel } from './GuideLinesPanel';
import { ViewportPanel } from './ViewportPanel';
import { GridSettingsPanel } from './GridSettingsPanel';
import { WhitespacePanel } from './WhitespacePanel';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

type TabType = 'guides' | 'viewport' | 'grid' | 'whitespace' | 'shortcuts';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_TABS: TabConfig[] = [
  { id: 'guides', label: '가이드라인', icon: Ruler },
  { id: 'viewport', label: '뷰포트', icon: Monitor },
  { id: 'grid', label: '그리드', icon: Grid3X3 },
  { id: 'whitespace', label: '화이트스페이스', icon: Square },
  { id: 'shortcuts', label: '단축키', icon: Keyboard },
];

const STORAGE_KEY = 'gridLayout:tabOrder';

// Storage에서 저장된 탭 순서 불러오기
async function loadTabOrder(): Promise<TabType[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const savedOrder = result[STORAGE_KEY] as TabType[];
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length === DEFAULT_TABS.length) {
      return savedOrder;
    }
  } catch (e) {
    console.error('Failed to load tab order:', e);
  }
  return DEFAULT_TABS.map(t => t.id);
}

// 탭 순서 저장
async function saveTabOrder(order: TabType[]) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: order });
  } catch (e) {
    console.error('Failed to save tab order:', e);
  }
}

// 탭 ID로 설정 조회
function getTabConfig(id: TabType): TabConfig {
  return DEFAULT_TABS.find(t => t.id === id) || DEFAULT_TABS[0];
}

export function GridLayoutPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [tabOrder, setTabOrder] = useState<TabType[]>(DEFAULT_TABS.map(t => t.id));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const guides = useGuideLines();
  const viewport = useViewport();
  const grid = useGridOverlay();
  const whitespace = useWhitespace();

  // 저장된 탭 순서 로드
  useEffect(() => {
    loadTabOrder().then(setTabOrder);
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // 드래그 중 (드롭 타겟 위에 있을 때)
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...tabOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setTabOrder(newOrder);
    setDraggedIndex(index);
  }, [draggedIndex, tabOrder]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    saveTabOrder(tabOrder);
  }, [tabOrder]);

  // 정렬된 탭 목록
  const sortedTabs = tabOrder.map(id => getTabConfig(id));

  return (
    <div className="grid-layout-panel flex flex-col h-full">
      {/* Header */}
      <div className="panel-header border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center justify-end">
          <div className="quick-actions flex gap-2">
            <Button
              onClick={() => grid.toggle()}
              variant={grid.settings.enabled ? "default" : "outline"}
              size="sm"
              title="그리드 토글 (Ctrl+Shift+G)"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => whitespace.toggle()}
              variant={whitespace.settings.enabled ? "destructive" : "outline"}
              size="sm"
              title="화이트스페이스 토글"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              onClick={async () => {
                await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL);
                await guides.clearAllGuides();
                await grid.disable();
                await whitespace.disable();
              }}
              variant="outline"
              size="sm"
              title="모두 지우기"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>가이드: {guides.stats.total}</span>
          <span>뷰포트: {viewport.viewport.customWidth}×{viewport.viewport.customHeight}</span>
          <span>컬럼: {grid.getCurrentColumns ? grid.getCurrentColumns(window.innerWidth) : '-'}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-1 flex flex-col">
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-5 border-b border-border bg-muted/30">
            {sortedTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative flex items-center justify-center gap-1 px-3 py-2
                    cursor-pointer transition-all duration-200
                    ${isActive ? 'bg-background text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                    ${isDragging ? 'opacity-50' : ''}
                  `}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {/* 드래그 핸들 (hover 시 표시) */}
                  <div className="drag-handle absolute left-1 top-1.5 opacity-0 group-hover:opacity-30 hover:opacity-50 transition-opacity">
                    <GripVertical className="h-3 w-3" />
                  </div>

                  {/* 탭 아이콘과 내용 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 group">
                        <Icon className="h-4 w-4" />
                        {tab.id === 'guides' && (
                          <span className="text-xs">{guides.stats.total}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{tab.label}</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'guides' && <div className="p-4"><GuideLinesPanel guides={guides} /></div>}
          {activeTab === 'viewport' && <div className="p-4"><ViewportPanel viewport={viewport} /></div>}
          {activeTab === 'grid' && <div className="p-4"><GridSettingsPanel grid={grid} /></div>}
          {activeTab === 'whitespace' && <div className="p-4"><WhitespacePanel whitespace={whitespace} /></div>}
          {activeTab === 'shortcuts' && <div className="p-4"><KeyboardShortcutsHelp /></div>}
        </div>
      </div>
    </div>
  );
}
