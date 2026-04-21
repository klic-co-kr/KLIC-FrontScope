import { useMemo } from 'react';
import { useRulerStorage } from './useRulerStorage';
import { Measurement, MeasurementStats } from '../../types/ruler';

export function useMeasurementHistory() {
  const {
    measurements,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
  } = useRulerStorage();

  /**
   * 타입별 필터링
   */
  const byType = useMemo(() => {
    return {
      element: measurements.filter((m) => m.type === 'element'),
      distance: measurements.filter((m) => m.type === 'distance'),
      gap: measurements.filter((m) => m.type === 'gap'),
    };
  }, [measurements]);

  /**
   * 통계 계산
   */
  const stats: MeasurementStats = useMemo(() => {
    const elementMeasurements = byType.element;

    let totalWidth = 0;
    let totalHeight = 0;

    elementMeasurements.forEach((m) => {
      if (m.element) {
        totalWidth += m.element.dimensions.width;
        totalHeight += m.element.dimensions.height;
      }
    });

    const avgWidth = elementMeasurements.length > 0
      ? totalWidth / elementMeasurements.length
      : 0;
    const avgHeight = elementMeasurements.length > 0
      ? totalHeight / elementMeasurements.length
      : 0;

    const lastMeasurement = measurements[0];

    return {
      totalMeasurements: measurements.length,
      byType: {
        element: byType.element.length,
        distance: byType.distance.length,
        gap: byType.gap.length,
      },
      averageDimensions: {
        width: avgWidth,
        height: avgHeight,
      },
      lastMeasurementTime: lastMeasurement?.timestamp || 0,
    };
  }, [measurements, byType]);

  /**
   * 최근 측정 가져오기
   */
  const getRecentMeasurements = (count: number = 5): Measurement[] => {
    return measurements.slice(0, count);
  };

  /**
   * 특정 측정 찾기
   */
  const findMeasurement = (id: string): Measurement | undefined => {
    return measurements.find((m) => m.id === id);
  };

  return {
    measurements,
    byType,
    stats,
    getRecentMeasurements,
    findMeasurement,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
  };
}
