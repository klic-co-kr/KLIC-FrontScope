/**
 * Asset Grid
 * Displays image assets in a grid layout
 */

import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageAsset } from '../../../types/assetManager';
import { formatBytes } from '../../../utils/assetManager/imageMeasure';
import { FORMAT_PRIORITY, getAssetFormatKey } from '../../../utils/assetManager/assetFormat';

function getFormatLabel(format: string, t: (key: string) => string): string {
  if (format === 'unknown') return t('assetManager.filters.imageTypes.other');
  if (format === 'data-uri') return t('assetManager.grid.dataUri');
  if (format === 'jpg') return 'JPG/JPEG';
  return format.toUpperCase();
}

interface AssetGridProps {
  assets: ImageAsset[];
  selectedAssets: Set<string>;
  onToggleAsset: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function AssetGrid({
  assets,
  selectedAssets,
  onToggleAsset,
  onSelectAll,
  onClearSelection,
}: AssetGridProps) {
  const { t } = useTranslation();
  const allSelected = assets.length > 0 && assets.every((a) => selectedAssets.has(a.id));

  const groupedAssets = useMemo(() => {
    const groups: Record<string, ImageAsset[]> = {};

    for (const asset of assets) {
      const format = getAssetFormatKey(asset);
      if (!groups[format]) {
        groups[format] = [];
      }
      groups[format].push(asset);
    }

    const dynamicKeys = Object.keys(groups).filter((key) => !FORMAT_PRIORITY.includes(key)).sort((a, b) => a.localeCompare(b));
    const orderedKeys = [...FORMAT_PRIORITY.filter((key) => groups[key]?.length), ...dynamicKeys];

    return orderedKeys.map((format) => ({
      format,
      assets: groups[format],
    }));
  }, [assets]);

  const handleToggleAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <p className="text-sm">{t('assetManager.grid.noAssets')}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Select All */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <button
          onClick={handleToggleAll}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
            allSelected ? 'bg-primary border-primary' : 'border-border'
          }`}>
            {allSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          {allSelected ? t('assetManager.grid.deselectAll') : t('assetManager.grid.selectAll')}
        </button>

        <span className="text-xs text-muted-foreground">
          {selectedAssets.size} / {assets.length}
        </span>
      </div>

      {/* Grid */}
      <div className="space-y-5">
        {groupedAssets.map((group) => (
          <section key={group.format}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {getFormatLabel(group.format, t)}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {group.assets.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedAssets.has(asset.id)}
                  onToggle={() => onToggleAsset(asset.id)}
                  t={t}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: ImageAsset;
  selected: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

function AssetCard({ asset, selected, onToggle, t }: AssetCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = `image-${asset.id.slice(0, 8)}`;
    link.click();
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(asset.url);
    } catch {
      console.error('Failed to copy URL');
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(asset.url, '_blank');
  };

  return (
    <div
      onClick={onToggle}
      className={`group relative border-2 rounded-lg overflow-hidden bg-muted cursor-pointer transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border'
      }`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <div className={`w-5 h-5 rounded border flex items-center justify-center shadow-sm ${
          selected ? 'bg-primary border-primary' : 'bg-card/90 border-border'
        }`}>
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>

      {/* Image Preview */}
      <div className="aspect-square flex items-center justify-center p-2">
        {asset.url.startsWith('data:') ? (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{t('assetManager.grid.dataUri')}</span>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={asset.element?.alt || t('assetManager.grid.assetAlt')}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
          />
        )}
      </div>

      {/* Actions Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={handleDownload}
          className="p-2 bg-card text-foreground rounded-lg hover:bg-muted"
          title={t('assetManager.grid.download')}
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleCopy}
          className="p-2 bg-card text-foreground rounded-lg hover:bg-muted"
          title={t('assetManager.grid.copyUrl')}
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={handleOpen}
          className="p-2 bg-card text-foreground rounded-lg hover:bg-muted"
          title={t('assetManager.grid.openInNewTab')}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between text-white">
          <span className="text-[10px] font-medium uppercase">
            {asset.format || 'IMG'}
          </span>
          {asset.size && (
            <span className="text-[10px] opacity-80">
              {formatBytes(asset.size)}
            </span>
          )}
        </div>
        {asset.dimensions && (
          <div className="text-[9px] text-white/70">
            {asset.dimensions.width} × {asset.dimensions.height}
          </div>
        )}
      </div>

      {/* Type Badge */}
      <div className="absolute top-2 right-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
          asset.type === 'svg' ? 'bg-purple-100 text-purple-700' :
          asset.type === 'background' ? 'bg-blue-100 text-blue-700' :
          asset.type === 'picture' ? 'bg-green-100 text-green-700' :
          asset.type === 'icon' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {asset.type}
        </span>
      </div>
    </div>
  );
}
