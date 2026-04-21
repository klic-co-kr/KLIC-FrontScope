/**
 * Animation Inspector Panel Component
 *
 * 애니메이션 검사기 패널
 */

import React, { useState } from 'react';
import type { AnimationInspectorPanelProps } from './types';
import type { CSSAnimation } from '../../types/resourceNetwork';
import { PERFORMANCE_IMPACT_COLORS } from '../../constants/resourceTypes';
import { formatDuration } from '../../utils/resourceNetwork/helpers';

export function AnimationInspectorPanel({ animation }: AnimationInspectorPanelProps) {
  const [selectedImpact, setSelectedImpact] = useState<'low' | 'medium' | 'high' | 'all'>('all');

  const filteredAnimations = selectedImpact === 'all'
    ? animation.animations
    : animation.animations.filter((a) => a.affectsPerformance === selectedImpact);

  return (
    <div className="animation-inspector-panel p-4 space-y-6">
      {/* Scan Section */}
      <div className="panel-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">애니메이션 스캔</h3>
          <button
            onClick={() => animation.scanAnimations()}
            disabled={animation.isScanning}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            🔍 애니메이션 스캔
          </button>
        </div>

        {animation.performanceReport && (
          <div className="bg-card rounded-lg p-3 mb-3">
            <div className="text-xs text-muted-foreground mb-2">성능 점수</div>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold`} style={{ color: PERFORMANCE_IMPACT_COLORS[animation.performanceReport.score >= 75 ? 'low' : animation.performanceReport.score >= 50 ? 'medium' : 'high'] }}>
                {animation.performanceReport.score}
              </div>
              <div className="flex-1 text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>높음:</span>
                  <span className="text-foreground">{animation.performanceReport.byImpact.high}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>중간:</span>
                  <span className="text-foreground">{animation.performanceReport.byImpact.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span>낮음:</span>
                  <span className="text-foreground">{animation.performanceReport.byImpact.low}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">제어</h3>
        <div className="control-buttons flex gap-2">
          <button
            onClick={() => (animation.isPaused ? animation.resumeAll() : animation.pauseAll())}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              animation.isPaused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {animation.isPaused ? '▶️ 재생' : '⏸️ 일시정지'}
          </button>
        </div>
      </div>

      {/* Filter by Impact */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">필터</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedImpact('all')}
            className={`px-3 py-1 text-xs rounded ${
              selectedImpact === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            전체 ({animation.animations.length})
          </button>
          <button
            onClick={() => setSelectedImpact('high')}
            className={`px-3 py-1 text-xs rounded ${
              selectedImpact === 'high' ? 'bg-red-600 text-white' : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            높음 ({animation.getAnimationsByImpact('high').length})
          </button>
          <button
            onClick={() => setSelectedImpact('medium')}
            className={`px-3 py-1 text-xs rounded ${
              selectedImpact === 'medium' ? 'bg-yellow-600 text-white' : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            중간 ({animation.getAnimationsByImpact('medium').length})
          </button>
          <button
            onClick={() => setSelectedImpact('low')}
            className={`px-3 py-1 text-xs rounded ${
              selectedImpact === 'low' ? 'bg-green-600 text-white' : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            낮음 ({animation.getAnimationsByImpact('low').length})
          </button>
        </div>
      </div>

      {/* Animation List */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">
          애니메이션 목록 ({filteredAnimations.length})
        </h3>
        <div className="animations-list space-y-2 max-h-64 overflow-y-auto">
          {filteredAnimations.slice(0, 50).map((anim) => (
            <div
              key={anim.id}
              className="animation-item bg-card rounded p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {anim.type === 'css' ? '🎨' : '📜'}
                  </span>
                  <span className="text-xs text-muted-foreground">{'<'}</span>
                  <span className="font-mono text-sm text-foreground truncate" title={anim.type === 'css' ? (anim as CSSAnimation).element : 'window'}>
                    {anim.type === 'css' ? (anim as CSSAnimation).element : 'JS'}
                  </span>
                  <span className="text-xs text-muted-foreground">{'>'}</span>
                </div>
                {anim.type === 'css' && (
                  <div className="text-xs text-muted-foreground">
                    {(anim as CSSAnimation).property} · {formatDuration((anim as CSSAnimation).duration)}
                  </div>
                )}
              </div>
              <div
                className={`px-2 py-1 text-xs rounded ${
                  anim.affectsPerformance === 'high'
                    ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                    : anim.affectsPerformance === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                }`}
              >
                {anim.affectsPerformance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {animation.performanceReport && animation.performanceReport.recommendations.length > 0 && (
        <div className="panel-section">
          <h3 className="text-sm font-medium text-foreground mb-3">권장사항</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            {animation.performanceReport.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>💡</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export */}
      <div className="panel-section">
        <button
          disabled
          className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground rounded border border-border opacity-50 cursor-not-allowed"
        >
          📤 내보내기
        </button>
      </div>
    </div>
  );
}
