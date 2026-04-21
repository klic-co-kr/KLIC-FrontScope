/**
 * Font Inspector Component
 *
 * 요소 폰트 속성 검사 컴포넌트
 */

import React, { useState, useEffect, useRef } from 'react';
import { useElementFont } from '../../hooks/fontAnalyzer';
import './FontInspector.css';

export interface FontInspectorProps {
  targetElement?: HTMLElement | null;
  onHoverChange?: (isHovering: boolean) => void;
}

export const FontInspector: React.FC<FontInspectorProps> = ({
  targetElement,
  onHoverChange,
}) => {
  const { font, isLoading } = useElementFont(targetElement ?? null);
  const [showMetrics, setShowMetrics] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetElement && onHoverChange) {
      onHoverChange(true);
    }

    return () => {
      if (onHoverChange) {
        onHoverChange(false);
      }
    };
  }, [targetElement, onHoverChange]);

  const getWeightLabel = (weight: number | string): string => {
    const weightMap: Record<number, string> = {
      100: 'Thin',
      200: 'Extra Light',
      300: 'Light',
      400: 'Normal',
      500: 'Medium',
      600: 'Semi Bold',
      700: 'Bold',
      800: 'Extra Bold',
      900: 'Black',
    };

    const numWeight = typeof weight === 'number' ? weight : parseInt(String(weight)) || 400;
    return weightMap[numWeight] || `${numWeight}`;
  };

  const getCategory = (family: string): string => {
    const lower = family.toLowerCase();

    if (lower.includes('serif') && !lower.includes('sans')) return 'Serif';
    if (lower.includes('sans')) return 'Sans-serif';
    if (lower.includes('mono') || lower.includes('code')) return 'Monospace';
    if (lower.includes('display')) return 'Display';

    return 'Unknown';
  };

  if (!targetElement) {
    return (
      <div className="font-inspector-placeholder">
        <div className="font-inspector-placeholder-icon">🎯</div>
        <p>Hover over any element to inspect its font</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-inspector-loading">
        <div className="font-inspector-spinner" />
        <p>Analyzing font...</p>
      </div>
    );
  }

  if (!font) {
    return (
      <div className="font-inspector-error">
        <p>Unable to extract font information</p>
      </div>
    );
  }

  return (
    <div className="font-inspector">
      {/* Preview */}
      <div className="font-inspector-preview">
        <div
          className="font-inspector-preview-text"
          style={{
            fontFamily: font.family,
            fontSize: '24px',
            fontWeight: font.weight,
            fontStyle: font.style,
          }}
        >
          Ag
        </div>
      </div>

      {/* Font Family */}
      <div className="font-inspector-section">
        <div className="font-inspector-label">Font Family</div>
        <div className="font-inspector-value large">{font.family}</div>
        <div className="font-inspector-meta">
          <span className="font-inspector-tag">{getCategory(font.family)}</span>
        </div>
      </div>

      {/* Size & Weight */}
      <div className="font-inspector-grid">
        <div className="font-inspector-section">
          <div className="font-inspector-label">Size</div>
          <div className="font-inspector-value">
            {font.size}{font.sizeUnit}
          </div>
        </div>

        <div className="font-inspector-section">
          <div className="font-inspector-label">Weight</div>
          <div className="font-inspector-value">
            {getWeightLabel(font.weight)}
          </div>
          <div className="font-inspector-meta">
            {font.weight}
          </div>
        </div>

        <div className="font-inspector-section">
          <div className="font-inspector-label">Style</div>
          <div className="font-inspector-value">
            {font.style}
          </div>
        </div>

        <div className="font-inspector-section">
          <div className="font-inspector-label">Line Height</div>
          <div className="font-inspector-value">
            {font.lineHeight}
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="font-inspector-section">
        <div className="font-inspector-label">Spacing</div>
        <div className="font-inspector-spacing">
          <div className="font-inspector-spacing-item">
            <span className="font-inspector-spacing-label">Letter</span>
            <span className="font-inspector-spacing-value">
              {font.letterSpacing || 'normal'}
            </span>
          </div>
          <div className="font-inspector-spacing-item">
            <span className="font-inspector-spacing-label">Word</span>
            <span className="font-inspector-spacing-value">
              {font.wordSpacing || 'normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Properties */}
      {(font.variant !== 'normal' || font.stretch) && (
        <div className="font-inspector-section">
          <div className="font-inspector-label">Additional</div>
          {font.variant !== 'normal' && (
            <div className="font-inspector-prop">
              <span className="font-inspector-prop-label">Variant:</span>
              <span className="font-inspector-prop-value">{font.variant}</span>
            </div>
          )}
          {font.stretch && font.stretch !== 'normal' && (
            <div className="font-inspector-prop">
              <span className="font-inspector-prop-label">Stretch:</span>
              <span className="font-inspector-prop-value">{font.stretch}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="font-inspector-actions">
        <button
          className="font-inspector-action-btn"
          onClick={() => setShowMetrics(!showMetrics)}
        >
          {showMetrics ? 'Hide' : 'Show'} Metrics
        </button>
        <button
          className="font-inspector-action-btn"
          onClick={() => {
            navigator.clipboard.writeText(
              `font-family: ${font.family}; font-size: ${font.size}${font.sizeUnit}; font-weight: ${font.weight};`
            );
          }}
        >
          Copy CSS
        </button>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (
        <div className="font-inspector-metrics" ref={overlayRef}>
          <h4>Font Metrics</h4>
          <div className="font-inspector-metrics-grid">
            <div className="font-inspector-metric">
              <span className="font-inspector-metric-label">EM Height</span>
              <span className="font-inspector-metric-value">{font.size}px</span>
            </div>
            <div className="font-inspector-metric">
              <span className="font-inspector-metric-label">Cap Height</span>
              <span className="font-inspector-metric-value">
                {(font.size * 0.7).toFixed(1)}px
              </span>
            </div>
            <div className="font-inspector-metric">
              <span className="font-inspector-metric-label">X-Height</span>
              <span className="font-inspector-metric-value">
                {(font.size * 0.5).toFixed(1)}px
              </span>
            </div>
            <div className="font-inspector-metric">
              <span className="font-inspector-metric-label">Ascender</span>
              <span className="font-inspector-metric-value">
                {(font.size * 0.8).toFixed(1)}px
              </span>
            </div>
            <div className="font-inspector-metric">
              <span className="font-inspector-metric-label">Descender</span>
              <span className="font-inspector-metric-value">
                {(font.size * 0.2).toFixed(1)}px
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontInspector;
