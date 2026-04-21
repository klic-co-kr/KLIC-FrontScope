import React from 'react';
import { RulerSettings as SettingsType } from '../../../types/ruler';

interface RulerSettingsProps {
  settings: SettingsType;
  onUpdateSettings: (settings: Partial<SettingsType>) => Promise<boolean>;
}

export function RulerSettings({ settings, onUpdateSettings }: RulerSettingsProps) {
  const handleChange = (key: keyof SettingsType, value: SettingsType[keyof SettingsType]) => {
    onUpdateSettings({ [key]: value });
  };

  return (
    <div className="ruler-settings">
      <div className="settings-section">
        <h3>표시 설정</h3>

        <div className="setting-item">
          <label htmlFor="unit">단위:</label>
          <select
            id="unit"
            value={settings.unit}
            onChange={(e) => handleChange('unit', e.target.value as 'px' | 'rem' | 'em')}
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
          </select>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showBoxModel}
              onChange={(e) => handleChange('showBoxModel', e.target.checked)}
            />
            Box Model 표시
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showAngle}
              onChange={(e) => handleChange('showAngle', e.target.checked)}
            />
            각도 표시
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showAspectRatio}
              onChange={(e) => handleChange('showAspectRatio', e.target.checked)}
            />
            종횡비 표시
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.snapToPixel}
              onChange={(e) => handleChange('snapToPixel', e.target.checked)}
            />
            픽셀 스냅 (레티나 대응)
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>스타일 설정</h3>

        <div className="setting-item">
          <label htmlFor="lineColor">측정선 색상:</label>
          <input
            id="lineColor"
            type="color"
            value={settings.lineColor}
            onChange={(e) => handleChange('lineColor', e.target.value)}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="labelColor">라벨 색상:</label>
          <input
            id="labelColor"
            type="color"
            value={settings.labelColor}
            onChange={(e) => handleChange('labelColor', e.target.value)}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="lineWidth">선 굵기:</label>
          <input
            id="lineWidth"
            type="number"
            min="1"
            max="10"
            value={settings.lineWidth}
            onChange={(e) => handleChange('lineWidth', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>히스토리 설정</h3>

        <div className="setting-item">
          <label htmlFor="maxHistorySize">최대 히스토리 크기:</label>
          <input
            id="maxHistorySize"
            type="number"
            min="5"
            max="100"
            value={settings.maxHistorySize}
            onChange={(e) => handleChange('maxHistorySize', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
