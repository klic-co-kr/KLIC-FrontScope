/**
 * Font Metrics Visualization Component
 *
 * 폰트 메트릭스 시각화 컴포넌트
 */

import React, { useState, useEffect, useRef } from 'react';
import { measureRenderedFontMetrics, createMetricsOverlay } from '../../utils/fontAnalyzer';
import type { FontMetrics as FontMetricsType, MetricsOverlayOptions } from '../../types/fontAnalyzer';
import './FontMetrics.css';

export interface FontMetricsProps {
  targetElement?: HTMLElement | null;
}

export const FontMetrics: React.FC<FontMetricsProps> = ({
  targetElement,
}) => {
  const [metrics, setMetrics] = useState<FontMetricsType | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBaselineGrid, setShowBaselineGrid] = useState(false);
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!targetElement) {
      return;
    }

    const measured = measureRenderedFontMetrics(targetElement);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMetrics(measured);
  }, [targetElement]);

  useEffect(() => {
    if (!showOverlay || !targetElement || !overlayContainerRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    const options: MetricsOverlayOptions = {
      showAscender: true,
      showDescender: true,
      showCapHeight: true,
      showXHeight: true,
      showBaseline: true,
      showMedian: true,
      color: '#ff0000',
      lineWidth: 1,
    };

    const overlay = createMetricsOverlay(targetElement, options);
    overlayContainerRef.current.appendChild(overlay);

    cleanupRef.current = () => {
      overlay.remove();
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [showOverlay, targetElement]);

  const toggleOverlay = () => {
    setShowOverlay(prev => !prev);
  };

  const toggleBaselineGrid = () => {
    setShowBaselineGrid(prev => !prev);
  };

  if (!targetElement || !metrics) {
    return (
      <div className="font-metrics-placeholder">
        <div className="font-metrics-placeholder-icon">📐</div>
        <p>Click on any element to view its font metrics</p>
      </div>
    );
  }

  return (
    <div className="font-metrics">
      {/* Controls */}
      <div className="font-metrics-controls">
        <button
          className={`font-metrics-control-btn ${showOverlay ? 'active' : ''}`}
          onClick={toggleOverlay}
        >
          {showOverlay ? 'Hide' : 'Show'} Metrics Overlay
        </button>
        <button
          className={`font-metrics-control-btn ${showBaselineGrid ? 'active' : ''}`}
          onClick={toggleBaselineGrid}
        >
          {showBaselineGrid ? 'Hide' : 'Show'} Baseline Grid
        </button>
      </div>

      {/* Metrics Display */}
      <div className="font-metrics-display">
        <h4>Font Metrics</h4>

        {/* Visual Diagram */}
        <div className="font-metrics-diagram">
          <svg className="font-metrics-svg" viewBox="0 0 200 150">
            {/* Ascender Line */}
            <line x1="10" y1="20" x2="190" y2="20" stroke="#ff0000" strokeWidth="1" strokeDasharray="4" />
            <text x="195" y="24" fontSize="8" fill="#ff0000">Ascender</text>

            {/* Cap Height Line */}
            <line x1="10" y1="35" x2="190" y2="35" stroke="#00ff00" strokeWidth="1" strokeDasharray="4" />
            <text x="195" y="39" fontSize="8" fill="#00ff00">Cap</text>

            {/* X-Height/Median Line */}
            <line x1="10" y1="55" x2="190" y2="55" stroke="#0000ff" strokeWidth="1" strokeDasharray="4" />
            <text x="195" y="59" fontSize="8" fill="#0000ff">x-Height</text>

            {/* Baseline */}
            <line x1="10" y1="80" x2="190" y2="80" stroke="#ff00ff" strokeWidth="1" strokeDasharray="4" />
            <text x="195" y="84" fontSize="8" fill="#ff00ff">Baseline</text>

            {/* Descender Line */}
            <line x1="10" y1="100" x2="190" y2="100" stroke="#ff0000" strokeWidth="1" strokeDasharray="4" />
            <text x="195" y="104" fontSize="8" fill="#ff0000">Descender</text>

            {/* Sample Text */}
            <text x="100" y="85" fontSize="40" textAnchor="middle" fill="#333">
              Ag
            </text>
          </svg>
        </div>

        {/* Metrics Table */}
        <div className="font-metrics-table">
          <div className="font-metrics-row">
            <span className="font-metrics-label">EM Height</span>
            <span className="font-metrics-value">{metrics.emHeight.toFixed(2)}px</span>
          </div>
          <div className="font-metrics-row">
            <span className="font-metrics-label">Ascender</span>
            <span className="font-metrics-value">{metrics.ascender.toFixed(2)}px</span>
          </div>
          <div className="font-metrics-row">
            <span className="font-metrics-label">Descender</span>
            <span className="font-metrics-value">{metrics.descent.toFixed(2)}px</span>
          </div>
          <div className="font-metrics-row">
            <span className="font-metrics-label">Cap Height</span>
            <span className="font-metrics-value">{metrics.capHeight.toFixed(2)}px</span>
          </div>
          <div className="font-metrics-row">
            <span className="font-metrics-label">X-Height</span>
            <span className="font-metrics-value">{metrics.xHeight.toFixed(2)}px</span>
          </div>
          <div className="font-metrics-row">
            <span className="font-metrics-label">Units per EM</span>
            <span className="font-metrics-value">{metrics.unitsPerEm}</span>
          </div>
        </div>

        {/* Calculated Ratios */}
        <div className="font-metrics-ratios">
          <h5>Proportions</h5>
          <div className="font-metrics-ratio">
            <span className="font-metrics-ratio-label">Cap to EM</span>
            <div className="font-metrics-ratio-bar">
              <div
                className="font-metrics-ratio-fill"
                style={{ width: `${(metrics.capHeight / metrics.emHeight) * 100}%` }}
              />
            </div>
            <span className="font-metrics-ratio-value">
              {((metrics.capHeight / metrics.emHeight) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="font-metrics-ratio">
            <span className="font-metrics-ratio-label">x-Height to EM</span>
            <div className="font-metrics-ratio-bar">
              <div
                className="font-metrics-ratio-fill"
                style={{ width: `${(metrics.xHeight / metrics.emHeight) * 100}%` }}
              />
            </div>
            <span className="font-metrics-ratio-value">
              {((metrics.xHeight / metrics.emHeight) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="font-metrics-ratio">
            <span className="font-metrics-ratio-label">Ascender to EM</span>
            <div className="font-metrics-ratio-bar">
              <div
                className="font-metrics-ratio-fill"
                style={{ width: `${(metrics.ascender / metrics.emHeight) * 100}%` }}
              />
            </div>
            <span className="font-metrics-ratio-value">
              {((metrics.ascender / metrics.emHeight) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Overlay Container */}
      <div ref={overlayContainerRef} className="font-metrics-overlay-container" />
    </div>
  );
};

export default FontMetrics;
