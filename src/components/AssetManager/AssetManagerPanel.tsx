/**
 * AssetManagerPanel Component
 *
 * 에셋 관리자 메인 패널 컴포넌트
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  FileArchive,
  Copy,
  RefreshCw,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAssetExtraction } from '../../hooks/assetManager/useAssetExtraction';
import { useAssetManagerStorage } from '../../hooks/assetManager/useAssetManagerStorage';
import { sortAssets } from '../../utils/assetManager/filterAssets';
import { AssetGrid } from './AssetGrid';
import type { ImageAsset, SortBy, SortOrder } from '../../types/assetManager';

type TabType = 'assets' | 'collections' | 'settings';

const FORMAT_TABS = [
  { key: 'all', label: 'ALL' },
  { key: 'jpg', label: 'JPG' },
  { key: 'png', label: 'PNG' },
  { key: 'gif', label: 'GIF' },
  { key: 'svg', label: 'SVG' },
  { key: 'webp', label: 'WEBP' },
  { key: 'ico', label: 'ICO' },
];

function getFormatFromUrl(url: string): string {
  try {
    const pathname = new URL(url, 'https://x').pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'].includes(ext)) {
      return ext;
    }
  } catch { /* ignore */ }
  return 'other';
}

interface PreviewModalProps {
  asset: ImageAsset;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ asset, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg z-10 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={asset.url}
          alt={asset.element?.alt || 'Preview'}
          className="max-w-full max-h-[85vh] object-contain"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm truncate">{asset.url}</p>
          {asset.dimensions && (
            <p className="text-white/80 text-xs">
              {asset.dimensions.width} × {asset.dimensions.height}
              {asset.size && ` • ${Math.round(asset.size / 1024)} KB`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const AssetManagerPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [formatTab, setFormatTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy] = useState<SortBy>('size');
  const [sortOrder] = useState<SortOrder>('desc');
  const [previewAsset, setPreviewAsset] = useState<ImageAsset | null>(null);

  const {
    collections,
    settings,
    saveCollection,
    deleteCollection,
    updateSettings,
  } = useAssetManagerStorage();

  const {
    extracting,
    progress,
    currentCollection,
    error: extractError,
    selectedAssets,
    extractAssets,
    toggleAsset,
    selectAll,
    clearSelection,
    downloadSelected,
    copyToClipboard,
  } = useAssetExtraction();

  // Get current assets
  const currentAssets = useMemo(() => {
    return currentCollection?.assets || [];
  }, [currentCollection]);

  // Format tab counts
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = { all: currentAssets.length };
    for (const asset of currentAssets) {
      const fmt = (asset.format || getFormatFromUrl(asset.url)).toLowerCase();
      counts[fmt] = (counts[fmt] || 0) + 1;
    }
    return counts;
  }, [currentAssets]);

  // Filter by format tab and sort
  const filteredAssets = useMemo(() => {
    const filtered = formatTab === 'all'
      ? currentAssets
      : currentAssets.filter(a => {
          const fmt = (a.format || getFormatFromUrl(a.url)).toLowerCase();
          // jpg/jpeg 통합
          if (formatTab === 'jpg') return fmt === 'jpg' || fmt === 'jpeg';
          return fmt === formatTab;
        });
    return sortAssets(filtered, sortBy, sortOrder);
  }, [currentAssets, formatTab, sortBy, sortOrder]);

  // Handle extract
  const handleExtract = useCallback(async () => {
    try {
      const collection = await extractAssets(settings);
      if (collection) {
        await saveCollection(collection);
      }
    } catch (error) {
      console.error('Failed to extract assets:', error);
    }
  }, [extractAssets, settings, saveCollection]);

  // Handle download
  const handleDownload = useCallback(
    async (format: 'original' | 'zip') => {
      try {
        await downloadSelected(currentAssets, format);
      } catch (error) {
        console.error('Failed to download:', error);
      }
    },
    [currentAssets, downloadSelected]
  );

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(currentAssets);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [currentAssets, copyToClipboard]);

  // Handle preview
  const handlePreview = useCallback((asset: ImageAsset) => {
    setPreviewAsset(asset);
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  // Download single asset
  const handleDownloadSingle = useCallback(async (asset: ImageAsset) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      await chrome.tabs.sendMessage(tab.id, {
        action: 'ASSET_DOWNLOAD_SINGLE',
        data: { asset },
      });
    } catch (error) {
      console.error('Failed to download asset:', error);
    }
  }, []);

  // Copy single asset
  const handleCopySingle = useCallback(async (asset: ImageAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, []);

  return (
    <div className="klic-asset-manager-panel flex flex-col h-full bg-muted">
      {/* Header */}
      <div className="klic-asset-manager-header flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{t('tools.assets.name')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExtract}
            disabled={extracting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              extracting
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${extracting ? 'animate-spin' : ''}`} />
            {extracting ? 'Extracting...' : 'Extract'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {extracting && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error Display */}
      {extractError && (
        <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Extraction Failed</p>
            <p className="text-sm text-destructive/80">{extractError}</p>
          </div>
          <button
            onClick={() => setPreviewAsset(null)}
            className="text-destructive/60 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="klic-asset-manager-tabs flex items-center gap-1 px-4 py-2 bg-background border-b border-border">
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'assets'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Current Assets
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'collections'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Collections ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="klic-asset-manager-content flex-1 overflow-hidden flex flex-col">
        {activeTab === 'assets' && (
          <>
            {/* Format Tabs */}
            {currentAssets.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-2 bg-background border-b border-border overflow-x-auto">
                {FORMAT_TABS.map(tab => {
                  const count = tab.key === 'all'
                    ? formatCounts.all
                    : tab.key === 'jpg'
                      ? (formatCounts['jpg'] || 0) + (formatCounts['jpeg'] || 0)
                      : formatCounts[tab.key] || 0;
                  if (tab.key !== 'all' && count === 0) return null;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFormatTab(tab.key)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        formatTab === tab.key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-1 opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Asset Grid */}
            <AssetGrid
              assets={filteredAssets}
              selectedIds={selectedAssets}
              onToggleSelect={toggleAsset}
              onSelectAll={() => selectAll(currentAssets)}
              onClearSelection={clearSelection}
              onDownload={handleDownloadSingle}
              onCopy={handleCopySingle}
              onPreview={handlePreview}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            {/* Action Footer */}
            {selectedAssets.size > 0 && (
              <div className="klic-asset-manager-footer flex items-center justify-between px-4 py-3 bg-primary/10 border-t border-primary/20">
                <span className="text-sm font-medium text-primary">
                  {selectedAssets.size} asset{selectedAssets.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URLs
                  </button>
                  <button
                    onClick={() => handleDownload('original')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDownload('zip')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    <FileArchive className="w-4 h-4" />
                    Download as ZIP
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'collections' && (
          <div className="p-4 overflow-auto">
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-lg font-medium">No saved collections</p>
                <p className="text-sm">
                  Extract assets to create your first collection
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {collection.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(collection.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCollection(collection.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-foreground/70">
                      {collection.stats.totalCount} assets •{' '}
                      {Math.round(collection.stats.totalSize / 1024)} KB
                    </div>
                    <button
                      onClick={() => window.open(collection.url, '_blank')}
                      className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Page
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 overflow-auto">
            <div className="max-w-md space-y-6">
              {/* Image Size Settings */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Image Size Filters
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Minimum Size (KB)
                    </label>
                    <input
                      type="number"
                      value={settings.minImageSize / 1024}
                      onChange={(e) =>
                        updateSettings({
                          minImageSize: parseInt(e.target.value) * 1024,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Maximum Size (KB)
                    </label>
                    <input
                      type="number"
                      value={settings.maxImageSize / 1024}
                      onChange={(e) =>
                        updateSettings({
                          maxImageSize: parseInt(e.target.value) * 1024,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Include Settings */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Include in Extraction
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeDataUri}
                      onChange={(e) =>
                        updateSettings({ includeDataUri: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Data URIs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeSvg}
                      onChange={(e) =>
                        updateSettings({ includeSvg: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">SVG Images</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeIcons}
                      onChange={(e) =>
                        updateSettings({ includeIcons: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Icons</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeBackgrounds}
                      onChange={(e) =>
                        updateSettings({ includeBackgrounds: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Background Images</span>
                  </label>
                </div>
              </div>

              {/* Detection Settings */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Detection
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.detectLazyLoad}
                      onChange={(e) =>
                        updateSettings({ detectLazyLoad: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      Detect Lazy Loading
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoAnalyze}
                      onChange={(e) =>
                        updateSettings({ autoAnalyze: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Auto Analyze</span>
                  </label>
                </div>
              </div>

              {/* Download Settings */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Download Options
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Default Format
                    </label>
                    <select
                      value={settings.defaultDownloadFormat}
                      onChange={(e) =>
                        updateSettings({
                          defaultDownloadFormat: e.target.value as 'original' | 'zip' | 'clipboard',
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                    >
                      <option value="original">Original</option>
                      <option value="zip">ZIP Archive</option>
                      <option value="clipboard">Clipboard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Filename Pattern
                    </label>
                    <select
                      value={settings.defaultFilenamePattern}
                      onChange={(e) =>
                        updateSettings({
                          defaultFilenamePattern: e.target.value as 'original' | 'numbered' | 'hash',
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                    >
                      <option value="original">Original</option>
                      <option value="numbered">Numbered</option>
                      <option value="hash">Hash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      )}
    </div>
  );
};

export default AssetManagerPanel;
