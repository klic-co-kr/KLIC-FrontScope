/**
 * ScreenshotSettings Component
 *
 * 스크린샷 설정 패널 컴포넌트
 */

import React from 'react';
import type { ScreenshotSettings, ImageFormat, CaptureMode } from '../../types/screenshot';

interface ScreenshotSettingsProps {
  settings: ScreenshotSettings;
  onChange: (settings: ScreenshotSettings) => void;
}

export const ScreenshotSettingsComponent: React.FC<ScreenshotSettingsProps> = ({
  settings,
  onChange,
}) => {
  const handleSettingChange = <K extends keyof ScreenshotSettings>(
    key: K,
    value: ScreenshotSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const imageFormats: { value: ImageFormat; label: string; description: string }[] = [
    { value: 'png', label: 'PNG', description: 'Lossless compression, best for quality' },
    { value: 'jpeg', label: 'JPEG', description: 'Smaller file size, good for photos' },
    { value: 'webp', label: 'WebP', description: 'Modern format, best compression' },
  ];

  const captureModes: { value: CaptureMode; label: string; description: string }[] = [
    { value: 'element', label: 'Element', description: 'Capture a specific element' },
    { value: 'area', label: 'Area', description: 'Select and capture an area' },
    { value: 'full-page', label: 'Full Page', description: 'Capture the entire page' },
  ];

  return (
    <div className="klic-screenshot-settings p-4 space-y-6">
      {/* Default Format */}
      <div className="klic-setting-group">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Format</h3>
        <div className="space-y-2">
          {imageFormats.map((format) => (
            <label
              key={format.value}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${
                  settings.defaultFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="format"
                value={format.value}
                checked={settings.defaultFormat === format.value}
                onChange={(e) =>
                  handleSettingChange('defaultFormat', e.target.value as ImageFormat)
                }
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">{format.label}</span>
                <p className="text-sm text-gray-500">{format.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      {settings.defaultFormat !== 'png' && (
        <div className="klic-setting-group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Quality</h3>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(settings.quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={settings.quality}
            onChange={(e) =>
              handleSettingChange('quality', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Smaller file</span>
            <span>Better quality</span>
          </div>
        </div>
      )}

      {/* Default Capture Mode */}
      <div className="klic-setting-group">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Default Capture Mode</h3>
        <div className="space-y-2">
          {captureModes.map((mode) => (
            <label
              key={mode.value}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${
                  settings.captureMode === mode.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="captureMode"
                value={mode.value}
                checked={settings.captureMode === mode.value}
                onChange={(e) =>
                  handleSettingChange('captureMode', e.target.value as CaptureMode)
                }
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">{mode.label}</span>
                <p className="text-sm text-gray-500">{mode.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="klic-setting-group">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Options</h3>
        <div className="space-y-3">
          {/* Enable Annotations */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
            <div>
              <span className="font-medium text-gray-800">Enable Annotations</span>
              <p className="text-sm text-gray-500">Allow adding annotations after capture</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAnnotations}
              onChange={(e) => handleSettingChange('enableAnnotations', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Auto Download */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
            <div>
              <span className="font-medium text-gray-800">Auto Download</span>
              <p className="text-sm text-gray-500">Automatically download screenshots</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoDownload}
              onChange={(e) => handleSettingChange('autoDownload', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Include Cursor */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
            <div>
              <span className="font-medium text-gray-800">Include Cursor</span>
              <p className="text-sm text-gray-500">Capture mouse cursor in screenshots</p>
            </div>
            <input
              type="checkbox"
              checked={settings.includeCursor}
              onChange={(e) => handleSettingChange('includeCursor', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="klic-setting-info p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800">About Screenshot Settings</h4>
            <p className="text-sm text-blue-700 mt-1">
              These settings will be applied to all new screenshots. Existing screenshots
              will not be affected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotSettingsComponent;
