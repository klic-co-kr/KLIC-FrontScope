/**
 * Whitespace Panel Component
 *
 * 화이트스페이스 설정 패널 컴포넌트
 */

import React from 'react';
import { WHITESPACE_PATTERN_LABELS as WHITESPACE_PATTERN_LABELS_TYPED } from '../../constants/gridStyles';
import type { WhitespacePattern } from '../../types/gridLayout';

interface WhitespacePanelProps {
  whitespace: {
    settings: {
      enabled: boolean;
      pattern: WhitespacePattern;
      color: string;
      opacity: number;
      size: number;
    };
    toggle: () => void;
    setPattern: (pattern: WhitespacePattern) => void;
    setColor: (color: string) => void;
    setOpacity: (opacity: number) => void;
    setSize: (size: number) => void;
    applyPreset: (preset: 'light' | 'medium' | 'heavy') => void;
  };
}

export function WhitespacePanel({ whitespace }: WhitespacePanelProps) {
  const { settings } = whitespace;

  // Pattern 레이블 타입 변환을 위한 안전한 접근
  const getPatternLabel = (pattern: WhitespacePattern) => {
    const labels = {
      solid: '단색',
      diagonal: '대각선',
      crosshatch: '십자무늬',
    };
    return labels[pattern] || pattern;
  };

  return (
    <div className="whitespace-panel space-y-4">
      {/* Toggle */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">화이트스페이스</h3>
          <label className="toggle flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => whitespace.toggle()}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-foreground">
              {settings.enabled ? '표시 중' : '숨김'}
            </span>
          </label>
        </div>
      </div>

      {/* Pattern Selection */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">패턴</h3>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(WHITESPACE_PATTERN_LABELS_TYPED) as Array<WhitespacePattern>).map(pattern => (
            <button
              key={pattern}
              onClick={() => whitespace.setPattern(pattern)}
              className={`p-3 text-sm rounded transition-colors ${
                settings.pattern === pattern
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
            >
              {getPatternLabel(pattern)}
            </button>
          ))}
        </div>
      </div>

      {/* Style Settings */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">스타일</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1">색상</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => whitespace.setColor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.color}
                onChange={(e) => whitespace.setColor(e.target.value)}
                className="flex-1 px-2 py-1 bg-accent text-foreground rounded border border-border text-sm"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>불투명도</span>
              <span className="text-primary">{Math.round(settings.opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.opacity * 100}
              onChange={(e) => whitespace.setOpacity(parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>패턴 크기</span>
              <span className="text-primary">{settings.size}px</span>
            </label>
            <input
              type="range"
              min="4"
              max="50"
              value={settings.size}
              onChange={(e) => whitespace.setSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">미리보기</h3>

        <div
          className="pattern-preview w-full h-24 rounded border border-border"
          style={{
            backgroundSize: `${settings.size}px ${settings.size}px`,
            ...(settings.pattern === 'solid' && {
              backgroundColor: settings.color,
              opacity: settings.opacity,
            }),
            ...(settings.pattern === 'diagonal' && {
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent ${settings.size / 2}px,
                ${settings.color} ${settings.size / 2}px,
                ${settings.color} ${settings.size}px
              )`,
              opacity: settings.opacity,
            }),
            ...(settings.pattern === 'crosshatch' && {
              backgroundImage: `
                linear-gradient(${settings.color} ${settings.opacity}, ${settings.color} ${settings.opacity}),
                linear-gradient(90deg, ${settings.color} ${settings.opacity}, ${settings.color} ${settings.opacity})
              `,
              backgroundSize: `${settings.size}px ${settings.size}px`,
              backgroundPosition: '0 0, 4px 4px',
            }),
          }}
        />
      </div>

      {/* Presets */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">프리셋</h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => whitespace.applyPreset('light')}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            가벼움
          </button>
          <button
            onClick={() => whitespace.applyPreset('medium')}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            중간
          </button>
          <button
            onClick={() => whitespace.applyPreset('heavy')}
            className="px-2 py-2 text-xs bg-accent text-foreground rounded hover:bg-accent/80 transition-colors"
          >
            강하게
          </button>
        </div>
      </div>

      {/* Color Presets */}
      <div className="panel-section bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">색상 프리셋</h3>

        <div className="flex flex-wrap gap-1">
          {[
            { color: '#EF4444', name: '빨간' },
            { color: '#F59E0B', name: '주황' },
            { color: '#10B981', name: '녹색' },
            { color: '#3B82F6', name: '파란' },
            { color: '#8B5CF6', name: '보라' },
            { color: '#6B7280', name: '회색' },
            { color: '#FFFFFF', name: '흰색' },
          ].map(preset => (
            <button
              key={preset.color}
              onClick={() => whitespace.setColor(preset.color)}
              className={`w-6 h-6 rounded transition-transform hover:scale-110 ${
                settings.color === preset.color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
