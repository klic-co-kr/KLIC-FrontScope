/**
 * Scanner Settings Component
 *
 * Tailwind 스캐너 설정 UI
 */

import React from 'react';
import type { TailwindSettings } from '../../types/tailwindScanner';

interface ScannerSettingsProps {
  settings: TailwindSettings;
  onUpdateSettings: (settings: Partial<TailwindSettings>) => Promise<void>;
}

export function ScannerSettings({ settings, onUpdateSettings }: ScannerSettingsProps) {
  const handleSettingChange = async (key: keyof TailwindSettings, value: boolean | number) => {
    await onUpdateSettings({ [key]: value });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Detection Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          감지 설정
        </h3>

        <div className="space-y-3">
          {/* JIT Mode Detection */}
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">JIT 모드 감지</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tailwind JIT 모드 사용 여부 감지
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.detectJIT}
              onChange={(e) => handleSettingChange('detectJIT', e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Include Arbitrary */}
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">임의 값 포함</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                임의 값 ([...] 형식) 클래스 포함
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.includeArbitrary}
              onChange={(e) => handleSettingChange('includeArbitrary', e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Conversion Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          변환 설정
        </h3>

        <div className="space-y-3">
          {/* Show Suggestions */}
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">변환 제안 표시</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CSS를 Tailwind 클래스로 변환 제안
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showSuggestions}
              onChange={(e) => handleSettingChange('showSuggestions', e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Scan Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          스캔 설정
        </h3>

        <div className="space-y-3">
          {/* Auto Scan */}
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">자동 스캔</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                페이지 로드 시 자동으로 Tailwind 스캔
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoScan}
              onChange={(e) => handleSettingChange('autoScan', e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Max History Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-900 dark:text-white">최대 히스토리 크기</p>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {settings.maxHistorySize}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={settings.maxHistorySize}
              onChange={(e) => handleSettingChange('maxHistorySize', parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              저장할 스캔 히스토리 최대 개수
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 이 설정은 Tailwind 스캐너의 동작 방식을 제어합니다. 변경 사항은 즉시 적용됩니다.
        </p>
      </div>
    </div>
  );
}

export default ScannerSettings;
