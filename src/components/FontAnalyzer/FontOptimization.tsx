/**
 * Font Optimization Component
 *
 * 폰트 최적화 추천 컴포넌트
 */

import React, { useState } from 'react';
import { useFontOptimization } from '../../hooks/fontAnalyzer';
import './FontOptimization.css';

export interface FontOptimizationProps {
  autoScan?: boolean;
}

export const FontOptimization: React.FC<FontOptimizationProps> = () => {
  const { score, issues, recommendations, isChecking, refresh } = useFontOptimization();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getScoreLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const scoreLevel = getScoreLevel(score);

  const getScoreDescription = (): string => {
    switch (scoreLevel) {
      case 'excellent':
        return 'Your fonts are well optimized!';
      case 'good':
        return 'Your fonts are mostly optimized with room for improvement.';
      case 'fair':
        return 'Some font optimization issues detected.';
      case 'poor':
        return 'Your fonts need significant optimization.';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="font-optimization">
      {/* Score Card */}
      <div className={`font-optimization-score-card ${scoreLevel}`}>
        <div className="font-optimization-score-circle">
          <span className="font-optimization-score-value">{score}</span>
          <span className="font-optimization-score-max">/100</span>
        </div>
        <div className="font-optimization-score-info">
          <h3 className="font-optimization-score-title">
            {scoreLevel.charAt(0).toUpperCase() + scoreLevel.slice(1)}
          </h3>
          <p className="font-optimization-score-description">
            {getScoreDescription()}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="font-optimization-actions">
        <button
          className="font-optimization-refresh"
          onClick={refresh}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Re-check Optimization'}
        </button>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="font-optimization-section">
          <div
            className={`font-optimization-section-header ${
              expandedSection === 'issues' ? 'expanded' : ''
            }`}
            onClick={() => toggleSection('issues')}
          >
            <h4>Issues Found ({issues.length})</h4>
            <span className="font-optimization-toggle">
              {expandedSection === 'issues' ? '−' : '+'}
            </span>
          </div>
          {expandedSection === 'issues' && (
            <div className="font-optimization-section-content">
              <ul className="font-optimization-issues-list">
                {issues.map((issue, index) => (
                  <li key={index} className="font-optimization-issue">
                    <span className="font-optimization-issue-icon">⚠️</span>
                    <span className="font-optimization-issue-text">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="font-optimization-section">
          <div
            className={`font-optimization-section-header ${
              expandedSection === 'recommendations' ? 'expanded' : ''
            }`}
            onClick={() => toggleSection('recommendations')}
          >
            <h4>Recommendations ({recommendations.length})</h4>
            <span className="font-optimization-toggle">
              {expandedSection === 'recommendations' ? '−' : '+'}
            </span>
          </div>
          {expandedSection === 'recommendations' && (
            <div className="font-optimization-section-content">
              <ul className="font-optimization-recommendations-list">
                {recommendations.map((rec, index) => (
                  <li key={index} className="font-optimization-recommendation">
                    <span className="font-optimization-recommendation-icon">💡</span>
                    <span className="font-optimization-recommendation-text">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Optimization Tips */}
      <div className="font-optimization-tips">
        <h4>Optimization Best Practices</h4>
        <div className="font-optimization-tips-list">
          <div className="font-optimization-tip">
            <h5>Use font-display: swap</h5>
            <p>Prevents flash of invisible text (FOIT) by showing fallback fonts immediately.</p>
            <code>font-display: swap;</code>
          </div>
          <div className="font-optimization-tip">
            <h5>Subset Your Fonts</h5>
            <p>Only include characters you actually use to reduce file size.</p>
            <code>unicode-range: U+0020-007F;</code>
          </div>
          <div className="font-optimization-tip">
            <h5>Use WOFF2 Format</h5>
            <p>WOFF2 provides better compression than other formats.</p>
          </div>
          <div className="font-optimization-tip">
            <h5>Preload Critical Fonts</h5>
            <p>Load above-the-fold fonts as early as possible.</p>
            <code>{`<link rel="preload" as="font" href="font.woff2" crossorigin>`}</code>
          </div>
          <div className="font-optimization-tip">
            <h5>Consider Variable Fonts</h5>
            <p>Replace multiple font files with a single variable font.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontOptimization;
