/**
 * Font Pairing Component
 *
 * 폰트 페어링 추천 컴포넌트
 */

import React, { useState } from 'react';
import { useFontPairs, useFavoriteFonts } from '../../hooks/fontAnalyzer';
import type { FontPair } from '../../types/fontAnalyzer';
import './FontPairing.css';

export interface FontPairingProps {
  currentHeading?: string;
  currentBody?: string;
  onPairSelect?: (pair: FontPair) => void;
}

export const FontPairing: React.FC<FontPairingProps> = ({
  currentHeading,
  currentBody,
  onPairSelect,
}) => {
  const { pairs, isLoading } = useFontPairs(currentHeading, currentBody);
  const { favorites, addFavorite, removeFavorite } = useFavoriteFonts();
  const [filter, setFilter] = useState<'all' | 'high-score' | 'favorites'>('all');

  const filteredPairs = pairs.filter(pair => {
    if (filter === 'high-score') return pair.score >= 70;
    if (filter === 'favorites') {
      return favorites.includes(pair.heading) || favorites.includes(pair.body);
    }
    return true;
  });

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#94a3b8';
  };

  const handlePairClick = (pair: FontPair) => {
    onPairSelect?.(pair);
  };

  return (
    <div className="font-pairing">
      {/* Header */}
      <div className="font-pairing-header">
        <h3>Font Pairing</h3>
        {currentHeading && currentBody && (
          <div className="font-pairing-current">
            <span className="font-pairing-current-label">Current:</span>
            <span className="font-pairing-current-heading" style={{ fontFamily: currentHeading }}>
              {currentHeading}
            </span>
            <span> + </span>
            <span className="font-pairing-current-body" style={{ fontFamily: currentBody }}>
              {currentBody}
            </span>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="font-pairing-filter">
        <button
          className={`font-pairing-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({pairs.length})
        </button>
        <button
          className={`font-pairing-filter-btn ${filter === 'high-score' ? 'active' : ''}`}
          onClick={() => setFilter('high-score')}
        >
          High Score
        </button>
        <button
          className={`font-pairing-filter-btn ${filter === 'favorites' ? 'active' : ''}`}
          onClick={() => setFilter('favorites')}
        >
          ⭐ Favorites
        </button>
      </div>

      {/* Pairs List */}
      {isLoading ? (
        <div className="font-pairing-loading">
          <div className="font-pairing-spinner" />
          <p>Loading suggestions...</p>
        </div>
      ) : filteredPairs.length === 0 ? (
        <div className="font-pairing-empty">
          <p>No font pairs found</p>
        </div>
      ) : (
        <div className="font-pairing-list">
          {filteredPairs.map((pair, index) => (
            <div
              key={index}
              className="font-pairing-item"
              onClick={() => handlePairClick(pair)}
            >
              {/* Score */}
              <div className="font-pairing-score">
                <div
                  className="font-pairing-score-circle"
                  style={{ borderColor: getScoreColor(pair.score) }}
                >
                  <span style={{ color: getScoreColor(pair.score) }}>
                    {pair.score}
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div className="font-pairing-preview">
                <div className="font-pairing-preview-heading">
                  <span
                    className="font-pairing-preview-text"
                    style={{ fontFamily: pair.heading, fontSize: '24px', fontWeight: 'bold' }}
                  >
                    Heading
                  </span>
                </div>
                <div className="font-pairing-preview-body">
                  <span
                    className="font-pairing-preview-text"
                    style={{ fontFamily: pair.body, fontSize: '14px' }}
                  >
                    Body text example with quick brown fox.
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="font-pairing-details">
                <div className="font-pairing-font-name">
                  {pair.heading}
                </div>
                <div className="font-pairing-plus">+</div>
                <div className="font-pairing-font-name">
                  {pair.body}
                </div>
              </div>

              {/* Actions */}
              <div className="font-pairing-actions">
                <button
                  className={`font-pairing-favorite ${
                    favorites.includes(pair.heading) || favorites.includes(pair.body)
                      ? 'active'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (favorites.includes(pair.heading)) {
                      removeFavorite(pair.heading);
                    } else {
                      addFavorite(pair.heading);
                    }
                  }}
                  title="Toggle favorite"
                >
                  ⭐
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="font-pairing-tips">
        <h4>💡 Pairing Tips</h4>
        <ul>
          <li>Contrast serif headings with sans-serif body text</li>
          <li>Maintain clear size hierarchy (heading should be 1.5-2x larger)</li>
          <li>Avoid using too many font families (2-3 is ideal)</li>
          <li>Consider x-height for readability</li>
        </ul>
      </div>
    </div>
  );
};

export default FontPairing;
