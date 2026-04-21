/**
 * Asset Manager Panel
 * Main panel component for managing image assets
 */

import { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Filter, BarChart3, Settings, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssetExtraction } from '../../../hooks/assetManager';
import { useAssetManagerStorage } from '../../../hooks/assetManager';
import { ASSET_ERRORS } from '../../../constants/errors';
import type { ImageAsset } from '../../../types/assetManager';


import { AssetGrid } from './AssetGrid';
import { AssetFilters } from './AssetFilters';
import { AssetStats } from './AssetStats';
import { AssetSettings } from './AssetSettings';

type TabType = 'grid' | 'filters' | 'stats' | 'settings';

export function AssetManagerPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [filteredAssets, setFilteredAssets] = useState<ImageAsset[]>([]);

  const {
    extracting,
    progress,
    currentCollection,
    error,
    extractAssets,
    selectedAssets,
    toggleAsset,
    selectAll,
    clearSelection,
    downloadSelected,
    copyToClipboard,
  } = useAssetExtraction();

  const { settings, updateSettings, saveCollection } = useAssetManagerStorage();

  useEffect(() => {
    const nextAssets = currentCollection ? currentCollection.assets : [];

    queueMicrotask(() => {
      setFilteredAssets(nextAssets);
    });
  }, [currentCollection]);

  // Handle extraction
  const handleExtract = async () => {
    try {
      const collection = await extractAssets(settings);
      setFilteredAssets(collection.assets);
      await saveCollection(collection);
    } catch (err) {
      console.error('Extraction failed:', err);
    }
  };

  // Handle download
  const handleDownload = async (format: 'original' | 'zip') => {
    if (!currentCollection) return;

    try {
      await downloadSelected(currentCollection.assets, format);
    } catch (err) {
      console.error('Download failed:', err);
      alert(ASSET_ERRORS.DOWNLOAD_FAILED);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!currentCollection) return;

    try {
      await copyToClipboard(currentCollection.assets);
    } catch (err) {
      console.error('Copy failed:', err);
      alert(ASSET_ERRORS.CLIPBOARD_FAILED);
    }
  };

  const selectedCount = selectedAssets.size;
  const hasAssets = currentCollection && currentCollection.assets.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-end mb-3">

          {currentCollection && (
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('assetManager.newExtraction')}
            </button>
          )}
        </div>

        {!currentCollection && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {extracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('assetManager.extractingProgress', { progress })}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t('assetManager.extractImages')}
              </>
            )}
          </button>
        )}

        {error && (
          <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      {hasAssets && (
        <div className="flex border-b border-border bg-card px-2">
          <TabButton
            active={activeTab === 'grid'}
            icon={<ImageIcon className="w-4 h-4" />}
            label={t('assetManager.tabs.images')}
            count={currentCollection.assets.length}
            onClick={() => setActiveTab('grid')}
          />
          <TabButton
            active={activeTab === 'filters'}
            icon={<Filter className="w-4 h-4" />}
            label={t('assetManager.tabs.filters')}
            onClick={() => setActiveTab('filters')}
          />
          <TabButton
            active={activeTab === 'stats'}
            icon={<BarChart3 className="w-4 h-4" />}
            label={t('assetManager.tabs.stats')}
            onClick={() => setActiveTab('stats')}
          />
          <TabButton
            active={activeTab === 'settings'}
            icon={<Settings className="w-4 h-4" />}
            label={t('assetManager.tabs.settings')}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'grid' && currentCollection && (
          <AssetGrid
            assets={filteredAssets}
            selectedAssets={selectedAssets}
            onToggleAsset={toggleAsset}
            onSelectAll={() => selectAll(filteredAssets)}
            onClearSelection={clearSelection}
          />
        )}

        {activeTab === 'filters' && currentCollection && (
          <div>
            <AssetFilters
              assets={currentCollection.assets}
              onFilterChange={setFilteredAssets}
            />
            <div className="border-t border-border">
              <AssetGrid
                assets={filteredAssets}
                selectedAssets={selectedAssets}
                onToggleAsset={toggleAsset}
                onSelectAll={() => selectAll(filteredAssets)}
                onClearSelection={clearSelection}
              />
            </div>
          </div>
        )}

        {activeTab === 'stats' && currentCollection && (
          <AssetStats collection={currentCollection} />
        )}

        {activeTab === 'settings' && (
          <AssetSettings
            settings={settings}
            onSettingsChange={updateSettings}
          />
        )}

        {!hasAssets && !extracting && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">{t('assetManager.emptyStateLine1')}</p>
            <p className="text-sm">{t('assetManager.emptyStateLine2')}</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {hasAssets && selectedCount > 0 && (
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {t('assetManager.footer.selectedCount', { count: selectedCount })}
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('assetManager.footer.clearSelection')}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('original')}
              className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('assetManager.footer.download')}
            </button>
            <button
              onClick={() => handleDownload('zip')}
              className="flex-1 py-2 px-3 bg-success hover:bg-success/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('assetManager.footer.zip')}
            </button>
            <button
              onClick={handleCopy}
              className="py-2 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              {t('assetManager.footer.copy')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}

function TabButton({ active, icon, label, count, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
        active
          ? 'border-amber-500 text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
          active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-muted-foreground'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
