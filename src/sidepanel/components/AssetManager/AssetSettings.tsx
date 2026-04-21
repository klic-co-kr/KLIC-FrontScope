/**
 * Asset Settings
 * Settings panel for Asset Manager
 */

import { Settings, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AssetManagerSettings } from '../../../types/assetManager';

interface AssetSettingsProps {
  settings: AssetManagerSettings;
  onSettingsChange: (settings: Partial<AssetManagerSettings>) => void;
}

export function AssetSettings({ settings, onSettingsChange }: AssetSettingsProps) {
  const { t } = useTranslation();
  const updateSetting = <K extends keyof AssetManagerSettings>(
    key: K,
    value: AssetManagerSettings[K]
  ) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-sm">{t('assetManager.settings.title')}</h3>
      </div>

      {/* Image Size Range */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.settings.imageSizeRange')}</label>
        <div className="flex items-center gap-2">
          <SizeInput
            value={settings.minImageSize}
            onChange={(value) => updateSetting('minImageSize', value)}
            label={t('assetManager.settings.min')}
          />
          <span className="text-gray-400">-</span>
          <SizeInput
            value={settings.maxImageSize}
            onChange={(value) => updateSetting('maxImageSize', value)}
            label={t('assetManager.settings.max')}
          />
        </div>
      </div>

      {/* Include Options */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.settings.includeImages')}</label>
        <div className="space-y-2">
          <ToggleOption
            enabled={settings.includeDataUri}
            onChange={(value) => updateSetting('includeDataUri', value)}
            label={t('assetManager.settings.dataUriImage')}
          />
          <ToggleOption
            enabled={settings.includeSvg}
            onChange={(value) => updateSetting('includeSvg', value)}
            label={t('assetManager.settings.svgImage')}
          />
          <ToggleOption
            enabled={settings.includeIcons}
            onChange={(value) => updateSetting('includeIcons', value)}
            label={t('assetManager.settings.smallIcons')}
          />
          <ToggleOption
            enabled={settings.includeBackgrounds}
            onChange={(value) => updateSetting('includeBackgrounds', value)}
            label={t('assetManager.settings.backgroundImage')}
          />
        </div>
      </div>

      {/* Detection Options */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.settings.detectionOptions')}</label>
        <div className="space-y-2">
          <ToggleOption
            enabled={settings.detectLazyLoad}
            onChange={(value) => updateSetting('detectLazyLoad', value)}
            label={t('assetManager.settings.detectLazy')}
          />
          <ToggleOption
            enabled={settings.autoAnalyze}
            onChange={(value) => updateSetting('autoAnalyze', value)}
            label={t('assetManager.settings.autoAnalyze')}
          />
        </div>
      </div>

      {/* Download Options */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.settings.downloadOptions')}</label>
        <div className="space-y-3">
          <SelectOption
            label={t('assetManager.settings.defaultFormat')}
            value={settings.defaultDownloadFormat}
            options={[
              { value: 'original', label: t('assetManager.settings.formatOriginal') },
              { value: 'zip', label: t('assetManager.settings.formatZip') },
            ]}
            onChange={(value) => updateSetting('defaultDownloadFormat', value as 'original' | 'zip')}
          />
          <SelectOption
            label={t('assetManager.settings.filenamePattern')}
            value={settings.defaultFilenamePattern}
            options={[
              { value: 'original', label: t('assetManager.settings.filenameOriginal') },
              { value: 'numbered', label: t('assetManager.settings.filenameNumbered') },
              { value: 'hash', label: t('assetManager.settings.filenameHash') },
            ]}
            onChange={(value) => updateSetting('defaultFilenamePattern', value as 'original' | 'numbered' | 'hash')}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={() => {
            chrome.storage.local.remove('assetManager:settings');
            window.location.reload();
          }}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('assetManager.settings.resetDefaults')}
        </button>
      </div>
    </div>
  );
}

interface SizeInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

function SizeInput({ value, onChange, label }: SizeInputProps) {
  const { t } = useTranslation();
  const presets = [0, 1024, 10240, 102400, 1048576, 10485760];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return t('assetManager.settings.unlimited');
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="flex-1">
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {presets.map((preset) => (
          <option key={preset} value={preset}>
            {formatBytes(preset)}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToggleOptionProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function ToggleOption({ enabled, onChange, label }: ToggleOptionProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
        enabled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <span className="text-sm">{label}</span>
      <div className={`w-9 h-5 rounded-full relative transition-colors ${
        enabled ? 'bg-amber-500' : 'bg-gray-300'
      }`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          enabled ? 'left-4.5' : 'left-0.5'
        }`} />
      </div>
    </button>
  );
}

interface SelectOptionProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectOption({ label, value, options, onChange }: SelectOptionProps) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
