/**
 * Font Comparison Component
 *
 * 폰트 비교 컴포넌트
 */

import React, { useState } from 'react';
import { useFontComparison } from '../../hooks/fontAnalyzer';
import './FontComparison.css';

export interface FontComparisonProps {
  onElementSelect?: (element: HTMLElement | null, slot: 'first' | 'second') => void;
}

export const FontComparison: React.FC<FontComparisonProps> = ({
  onElementSelect,
}) => {
  const { comparison, element1, element2, setElement1, setElement2 } = useFontComparison();
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');

  const handleClearSlot = (slot: 'first' | 'second') => {
    if (slot === 'first') {
      setElement1(null);
      onElementSelect?.(null, 'first');
    } else {
      setElement2(null);
      onElementSelect?.(null, 'second');
    }
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#eab308';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="font-comparison">
      {/* Mode Selector */}
      <div className="font-comparison-mode">
        <button
          className={`font-comparison-mode-btn ${compareMode === 'side-by-side' ? 'active' : ''}`}
          onClick={() => setCompareMode('side-by-side')}
        >
          Side by Side
        </button>
        <button
          className={`font-comparison-mode-btn ${compareMode === 'overlay' ? 'active' : ''}`}
          onClick={() => setCompareMode('overlay')}
        >
          Overlay
        </button>
        <button
          className={`font-comparison-mode-btn ${compareMode === 'diff' ? 'active' : ''}`}
          onClick={() => setCompareMode('diff')}
        >
          Differences
        </button>
      </div>

      {/* Comparison Slots */}
      <div className="font-comparison-slots">
        <div className="font-comparison-slot">
          <div className="font-comparison-slot-header">
            <span>First Font</span>
            {element1 && (
              <button
                className="font-comparison-clear"
                onClick={() => handleClearSlot('first')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="font-comparison-slot-content">
            {element1 ? (
              <div className="font-comparison-preview" style={{
                fontFamily: window.getComputedStyle(element1).fontFamily,
              }}>
                Ag
              </div>
            ) : (
              <div className="font-comparison-placeholder">
                Click an element to select
              </div>
            )}
          </div>
        </div>

        <div className="font-comparison-vs">VS</div>

        <div className="font-comparison-slot">
          <div className="font-comparison-slot-header">
            <span>Second Font</span>
            {element2 && (
              <button
                className="font-comparison-clear"
                onClick={() => handleClearSlot('second')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="font-comparison-slot-content">
            {element2 ? (
              <div className="font-comparison-preview" style={{
                fontFamily: window.getComputedStyle(element2).fontFamily,
              }}>
                Ag
              </div>
            ) : (
              <div className="font-comparison-placeholder">
                Click an element to select
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Result */}
      {comparison && (
        <div className="font-comparison-result">
          {/* Similarity Score */}
          <div className="font-comparison-score">
            <div
              className="font-comparison-score-circle"
              style={{ borderColor: getSimilarityColor(comparison.similarityScore) }}
            >
              <span
                className="font-comparison-score-value"
                style={{ color: getSimilarityColor(comparison.similarityScore) }}
              >
                {comparison.similarityScore}%
              </span>
              <span className="font-comparison-score-label">Similar</span>
            </div>
          </div>

          {/* Differences */}
          {comparison.diffs.length > 0 ? (
            <div className="font-comparison-diffs">
              <h4>Differences</h4>
              <div className="font-comparison-diffs-list">
                {comparison.diffs.map((diff, index) => (
                  <div
                    key={index}
                    className={`font-comparison-diff ${diff.significant ? 'significant' : ''}`}
                  >
                    <div className="font-comparison-diff-prop">
                      <span className="font-comparison-diff-label">{diff.property}</span>
                      {diff.significant && (
                        <span className="font-comparison-diff-badge">Significant</span>
                      )}
                    </div>
                    <div className="font-comparison-diff-values">
                      <span className="font-comparison-diff-value value1">
                        {String(diff.value1)}
                      </span>
                      <span className="font-comparison-diff-arrow">→</span>
                      <span className="font-comparison-diff-value value2">
                        {String(diff.value2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="font-comparison-identical">
              <span className="font-comparison-identical-icon">✓</span>
              <span>Fonts are identical</span>
            </div>
          )}

          {/* Font Details */}
          <div className="font-comparison-details">
            <div className="font-comparison-detail">
              <h5>Font 1</h5>
              <div className="font-comparison-detail-list">
                <div><strong>Family:</strong> {comparison.font1.family}</div>
                <div><strong>Size:</strong> {comparison.font1.size}{comparison.font1.sizeUnit}</div>
                <div><strong>Weight:</strong> {comparison.font1.weight}</div>
                <div><strong>Style:</strong> {comparison.font1.style}</div>
              </div>
            </div>
            <div className="font-comparison-detail">
              <h5>Font 2</h5>
              <div className="font-comparison-detail-list">
                <div><strong>Family:</strong> {comparison.font2.family}</div>
                <div><strong>Size:</strong> {comparison.font2.size}{comparison.font2.sizeUnit}</div>
                <div><strong>Weight:</strong> {comparison.font2.weight}</div>
                <div><strong>Style:</strong> {comparison.font2.style}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!comparison && (
        <div className="font-comparison-help">
          <p>Select two elements to compare their fonts</p>
          <p className="font-comparison-help-sub">
            Click on any element in the page to add it to the comparison
          </p>
        </div>
      )}
    </div>
  );
};

export default FontComparison;
