/**
 * Settings Panel Component
 *
 * 텍스트 편집 설정을 관리하는 컴포넌트
 */

import { useState } from 'react';
import type { TextEditSettings } from '../../types/textEdit';
import { DEFAULT_TEXT_EDIT_SETTINGS } from '../../constants/defaults';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<TextEditSettings>(
    DEFAULT_TEXT_EDIT_SETTINGS
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await chrome.storage.local.set({
        'textEdit:settings': settings,
      });
      console.log('설정이 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">⚙️ 설정</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* 최대 히스토리 크기 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          최대 히스토리 크기: {settings.maxHistory}
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={settings.maxHistory}
          onChange={(e) =>
            setSettings({ ...settings, maxHistory: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* 자동 저장 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">자동 저장</label>
        <button
          onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.autoSave ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.autoSave ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* 포맷 보존 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">포맷 보존</label>
        <button
          onClick={() =>
            setSettings({ ...settings, preserveFormatting: !settings.preserveFormatting })
          }
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.preserveFormatting ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.preserveFormatting ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* 하이라이트 색상 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">하이라이트 색상</label>
        <input
          type="color"
          value={settings.highlightColor}
          onChange={(e) =>
            setSettings({ ...settings, highlightColor: e.target.value })
          }
          className="w-16 h-8 rounded cursor-pointer"
        />
      </div>

      {/* 키보드 단축키 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">키보드 단축키</label>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-20">저장:</span>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {settings.shortcuts.save}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20">취소:</span>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {settings.shortcuts.cancel}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20">되돌리기:</span>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {settings.shortcuts.undo}
            </code>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
