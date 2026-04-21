/**
 * AssetGrid Component
 *
 * 에셋 그리드 컴포넌트 - 다중 에셋 표시 및 선택
 */

import React, { useMemo } from 'react';
import { ImageAsset, ImageType } from '../../types/assetManager';
import { AssetCard } from './AssetCard';
import { Check, Grid3x3, List } from 'lucide-react';

interface AssetGridProps {
  assets: ImageAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownload?: (asset: ImageAsset) => void;
  onCopy?: (asset: ImageAsset) => void;
  onPreview?: (asset: ImageAsset) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onDownload,
  onCopy,
  onPreview,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const allSelected = assets.length > 0 && selectedIds.size === assets.length;

  // Group assets by type when in list view
  const groupedAssets = useMemo(() => {
    const groups: Record<ImageType, ImageAsset[]> = {
      img: [],
      background: [],
      picture: [],
      svg: [],
      icon: [],
      other: [],
    };

    for (const asset of assets) {
      groups[asset.type].push(asset);
    }

    return groups;
  }, [assets]);

  const handleSelectAllToggle = () => {
    if (allSelected || (selectedIds.size > 0 && !allSelected)) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  if (assets.length === 0) {
    return (
      <div className="klic-asset-empty flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <svg
          className="w-16 h-16 mb-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-lg font-medium">No assets found</p>
        <p className="text-sm">Extract assets from the current page to get started</p>
      </div>
    );
  }

  return (
    <div className="klic-asset-grid h-full flex flex-col">
      {/* Toolbar */}
      <div className="klic-asset-grid-toolbar flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          {/* Select All Checkbox */}
          <button
            onClick={handleSelectAllToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              allSelected
                ? 'bg-primary border-primary'
                : 'border-border hover:border-primary/50'
            }`}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            {(allSelected || selectedIds.size > 0) && <Check className="w-3 h-3 text-primary-foreground" />}
          </button>

          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${assets.length} selected`
              : `${assets.length} assets`}
          </span>
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid/List Content */}
      <div className="klic-asset-grid-content flex-1 overflow-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onToggleSelect={onToggleSelect}
                onDownload={onDownload}
                onCopy={onCopy}
                onPreview={onPreview}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {(
              Object.entries(groupedAssets) as Array<[ImageType, ImageAsset[]]>
            ).map(([type, typeAssets]) =>
              typeAssets.length > 0 ? (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                    {type} ({typeAssets.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {typeAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        onToggleSelect={onToggleSelect}
                        onDownload={onDownload}
                        onCopy={onCopy}
                        onPreview={onPreview}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Selection Footer */}
      {selectedIds.size > 0 && (
        <div className="klic-asset-grid-footer flex items-center justify-between px-4 py-3 bg-primary/10 border-t border-primary/20">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} asset{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 rounded-md transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetGrid;
