import React from 'react';
import { Measurement } from '../../../types/ruler';
import { formatWithUnit } from '../../../utils/ruler/units';

interface MeasurementCardProps {
  measurement: Measurement;
  onDelete: (id: string) => void;
  unit: 'px' | 'rem' | 'em';
}

export function MeasurementCard({ measurement, onDelete, unit }: MeasurementCardProps) {
  const timeAgo = new Date(measurement.timestamp).toLocaleString('ko-KR');

  /**
   * 타입별 렌더링
   */
  const renderContent = () => {
    if (measurement.type === 'element' && measurement.element) {
      const { dimensions, selector } = measurement.element;

      return (
        <div className="measurement-content">
          <div className="measurement-type">요소 크기</div>
          <div className="measurement-value">
            {formatWithUnit(dimensions.width, unit, 1)} × {formatWithUnit(dimensions.height, unit, 1)}
          </div>
          <div className="measurement-detail">
            종횡비: {dimensions.aspectRatio.toFixed(2)}
          </div>
          <div className="measurement-selector">{selector}</div>
        </div>
      );
    }

    if (measurement.type === 'distance' && measurement.distance) {
      const { result } = measurement.distance;

      return (
        <div className="measurement-content">
          <div className="measurement-type">거리</div>
          <div className="measurement-value">
            {formatWithUnit(result.diagonal, unit, 1)}
          </div>
          <div className="measurement-detail">
            수평: {formatWithUnit(result.horizontal, unit, 1)},
            수직: {formatWithUnit(result.vertical, unit, 1)}
          </div>
          <div className="measurement-detail">
            각도: {(result.angle * 180 / Math.PI).toFixed(1)}°
          </div>
        </div>
      );
    }

    if (measurement.type === 'gap' && measurement.gap) {
      const { element1, element2, value, direction } = measurement.gap;

      return (
        <div className="measurement-content">
          <div className="measurement-type">간격 ({direction})</div>
          <div className="measurement-value">
            {typeof value === 'number'
              ? formatWithUnit(value, unit, 1)
              : `H: ${formatWithUnit(value.horizontal, unit, 1)}, V: ${formatWithUnit(value.vertical, unit, 1)}`}
          </div>
          <div className="measurement-selector">
            {element1} ↔ {element2}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="measurement-card">
      <div className="card-header">
        <span className="time-ago">{timeAgo}</span>
        <button
          onClick={() => onDelete(measurement.id)}
          className="delete-btn"
        >
          삭제
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
