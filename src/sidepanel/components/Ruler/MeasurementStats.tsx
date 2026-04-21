import React from 'react';
import { MeasurementStats as StatsType } from '../../../types/ruler';
import { formatWithUnit } from '../../../utils/ruler/units';

interface MeasurementStatsProps {
  stats: StatsType;
  unit: 'px' | 'rem' | 'em';
}

export function MeasurementStats({ stats, unit }: MeasurementStatsProps) {
  return (
    <div className="measurement-stats">
      <div className="stats-section">
        <h3>전체 통계</h3>
        <div className="stat-item">
          <span className="stat-label">총 측정 수:</span>
          <span className="stat-value">{stats.totalMeasurements}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">마지막 측정:</span>
          <span className="stat-value">
            {stats.lastMeasurementTime > 0
              ? new Date(stats.lastMeasurementTime).toLocaleString('ko-KR')
              : '없음'}
          </span>
        </div>
      </div>

      <div className="stats-section">
        <h3>타입별 통계</h3>
        <div className="stat-item">
          <span className="stat-label">요소 측정:</span>
          <span className="stat-value">{stats.byType.element}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">거리 측정:</span>
          <span className="stat-value">{stats.byType.distance}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">간격 측정:</span>
          <span className="stat-value">{stats.byType.gap}</span>
        </div>
      </div>

      {stats.byType.element > 0 && (
        <div className="stats-section">
          <h3>평균 크기</h3>
          <div className="stat-item">
            <span className="stat-label">너비:</span>
            <span className="stat-value">
              {formatWithUnit(stats.averageDimensions.width, unit, 1)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">높이:</span>
            <span className="stat-value">
              {formatWithUnit(stats.averageDimensions.height, unit, 1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
