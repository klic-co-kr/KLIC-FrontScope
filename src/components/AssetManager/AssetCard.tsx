/**
 * AssetCard Component
 *
 * 개별 에셋 카드 컴포넌트 - 미리보기 및 정보 표시
 */

import React, { useState, useCallback } from 'react';
import { ImageAsset, ImageType } from '../../types/assetManager';
import { Download, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface AssetCardProps {
  asset: ImageAsset;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDownload?: (asset: ImageAsset) => void;
  onCopy?: (asset: ImageAsset) => void;
  onPreview?: (asset: ImageAsset) => void;
}

const TYPE_COLORS: Record<ImageType, string> = {
  img: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  background: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  picture: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  svg: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  icon: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
  other: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

const TYPE_LABELS: Record<ImageType, string> = {
  img: 'IMG',
  background: 'BG',
  picture: 'PICTURE',
  svg: 'SVG',
  icon: 'ICON',
  other: 'OTHER',
};

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  selected,
  onToggleSelect,
  onDownload,
  onCopy,
  onPreview,
}) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await onCopy?.(asset);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [asset, onCopy]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getThumbnailUrl = (): string => {
    if (asset.type === 'svg' && asset.url.startsWith('data:image/svg+xml')) {
      return asset.url;
    }
    return asset.url;
  };

  return (
    <div
      className={`klic-asset-card group relative bg-background dark:bg-background rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => onToggleSelect(asset.id)}
    >
      {/* Selection Indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-primary border-primary'
              : 'bg-background border-border group-hover:border-primary/40'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>

      {/* Type Badge */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${TYPE_COLORS[asset.type]}`}
        >
          {TYPE_LABELS[asset.type]}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="klic-asset-thumbnail aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
        {/* Checkered pattern for transparency */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{
          backgroundImage: `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)`,
          backgroundSize: '16px 16px'
        }} />
        {!imageError && getThumbnailUrl() ? (
          <img
            src={getThumbnailUrl()}
            alt={asset.element?.alt || asset.url}
            className="w-full h-full object-contain relative z-10"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <ImageIcon className="w-12 h-12 text-muted-foreground relative z-10" />
        )}
      </div>

      {/* Info */}
      <div className="klic-asset-info p-3 space-y-1 bg-card">
        {/* URL */}
        <div className="text-xs text-foreground/80 truncate" title={asset.url}>
          {asset.url.split('/').pop() || asset.url}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {asset.dimensions && (
              <span>
                {asset.dimensions.width}×{asset.dimensions.height}
              </span>
            )}
            {asset.format && <span className="uppercase">{asset.format}</span>}
          </div>
          <span>{formatFileSize(asset.size)}</span>
        </div>

        {/* Additional Info */}
        {asset.metadata?.isLazyLoaded && (
          <div className="text-xs text-warning">Lazy Load</div>
        )}
        {asset.metadata?.isDataUri && (
          <div className="text-xs text-muted-foreground">Data URI</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="klic-asset-actions absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(asset);
          }}
          className="p-1.5 bg-background/90 hover:bg-background rounded-md text-foreground hover:text-primary transition-colors backdrop-blur-sm"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="p-1.5 bg-background/90 hover:bg-background rounded-md text-foreground hover:text-success transition-colors backdrop-blur-sm"
          title="Copy URL"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(asset);
          }}
          className="p-1.5 bg-background/90 hover:bg-background rounded-md text-foreground hover:text-primary transition-colors backdrop-blur-sm"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AssetCard;
