import React from 'react';
import { Measurement } from '../../../types/ruler';
import { MeasurementCard } from './MeasurementCard';

interface MeasurementListProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  unit: 'px' | 'rem' | 'em';
}

export function MeasurementList({ measurements, onDelete, unit }: MeasurementListProps) {
  if (measurements.length === 0) {
    return (
      <div className="empty-list">
        <p>측정 히스토리가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="measurement-list">
      {measurements.map((measurement) => (
        <MeasurementCard
          key={measurement.id}
          measurement={measurement}
          onDelete={onDelete}
          unit={unit}
        />
      ))}
    </div>
  );
}
