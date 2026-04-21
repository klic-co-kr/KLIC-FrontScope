import React, { useState } from 'react';
import { useMeasurementHistory } from '../../../hooks/ruler/useMeasurementHistory';
import { useRulerStorage } from '../../../hooks/ruler/useRulerStorage';
import { MeasurementList } from './MeasurementList';
import { MeasurementStats } from './MeasurementStats';
import { RulerSettings } from './RulerSettings';
import { MESSAGE_ACTIONS } from '../../../constants/messages';

interface RulerPanelProps {
  isActive: boolean;
  onToggle: () => void;
}

export function RulerPanel({ isActive, onToggle }: RulerPanelProps) {
  const {
    measurements,
    byType,
    stats,
    deleteMeasurement,
    clearMeasurements,
  } = useMeasurementHistory();

  const { settings, updateSettings } = useRulerStorage();

  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'settings'>('history');
  const [filterType, setFilterType] = useState<'all' | 'element' | 'distance' | 'gap'>('all');

  /**
   * 측정 모드 토글
   */
  const handleToggleMeasureMode = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: MESSAGE_ACTIONS.RULER_TOGGLE,
          data: { enabled: !isActive },
        });

        onToggle();
      }
    } catch (error) {
      console.error('Failed to toggle measure mode:', error);
    }
  };

  /**
   * 오버레이 클리어
   */
  const handleClearOverlay = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: MESSAGE_ACTIONS.RULER_CLEAR_OVERLAY,
        });
      }
    } catch (error) {
      console.error('Failed to clear overlay:', error);
    }
  };

  /**
   * 측정 삭제
   */
  const handleDeleteMeasurement = async (id: string) => {
    await deleteMeasurement(id);
  };

  /**
   * 모든 측정 삭제
   */
  const handleClearAll = async () => {
    if (!confirm('모든 측정을 삭제하시겠습니까?')) {
      return;
    }

    await clearMeasurements();
  };

  /**
   * 필터링된 측정
   */
  const filteredMeasurements = filterType === 'all'
    ? measurements
    : byType[filterType];

  return (
    <div className="ruler-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>자/측정</h2>

        <div className="header-actions">
          <button
            onClick={handleToggleMeasureMode}
            className={`toggle-btn ${isActive ? 'active' : ''}`}
          >
            {isActive ? '측정 모드 OFF' : '측정 모드 ON'}
          </button>

          {isActive && (
            <button
              onClick={handleClearOverlay}
              className="clear-overlay-btn"
            >
              오버레이 지우기
            </button>
          )}

          {measurements.length > 0 && (
            <button
              onClick={handleClearAll}
              className="clear-all-btn"
            >
              모두 삭제
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
          히스토리 ({measurements.length})
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
          <>
            {/* 필터 */}
            <div className="filter-bar">
              <button
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'active' : ''}
              >
                전체 ({measurements.length})
              </button>
              <button
                onClick={() => setFilterType('element')}
                className={filterType === 'element' ? 'active' : ''}
              >
                요소 ({byType.element.length})
              </button>
              <button
                onClick={() => setFilterType('distance')}
                className={filterType === 'distance' ? 'active' : ''}
              >
                거리 ({byType.distance.length})
              </button>
              <button
                onClick={() => setFilterType('gap')}
                className={filterType === 'gap' ? 'active' : ''}
              >
                간격 ({byType.gap.length})
              </button>
            </div>

            <MeasurementList
              measurements={filteredMeasurements}
              onDelete={handleDeleteMeasurement}
              unit={settings.unit}
            />
          </>
        )}

        {activeTab === 'stats' && (
          <MeasurementStats stats={stats} unit={settings.unit} />
        )}

        {activeTab === 'settings' && (
          <RulerSettings
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        )}
      </div>

      {/* 안내 메시지 */}
      {!isActive && measurements.length === 0 && (
        <div className="empty-state">
          <p>측정 모드를 활성화하고</p>
          <p>요소를 클릭하거나 드래그하여 측정하세요.</p>
        </div>
      )}
    </div>
  );
}
