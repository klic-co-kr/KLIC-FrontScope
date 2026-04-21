/**
 * Asset Filters
 * Filters and searches through assets
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ImageAsset, AssetFilter, ImageType, ImageSource } from '../../../types/assetManager';
import { filterAssets } from '../../../utils/assetManager/filterAssets';
import { FORMAT_PRIORITY, getAssetFormatKey } from '../../../utils/assetManager/assetFormat';

interface AssetFiltersProps {
  assets: ImageAsset[];
  onFilterChange: (filtered: ImageAsset[]) => void;
}

const IMAGE_TYPES: ImageType[] = ['img', 'background', 'picture', 'svg', 'icon'];

const IMAGE_SOURCES: ImageSource[] = ['img-tag', 'background-css', 'picture-tag', 'svg-tag', 'inline-svg', 'data-uri'];

const SIZE_OPTIONS = [
  { key: 'all', value: 0 },
  { key: '1kb', value: 1024 },
  { key: '10kb', value: 10240 },
  { key: '100kb', value: 102400 },
  { key: '1mb', value: 1048576 },
];

function getFormatLabel(format: string, t: (key: string) => string): string {
  if (format === 'unknown') return t('assetManager.filters.imageTypes.other');
  if (format === 'data-uri') return t('assetManager.grid.dataUri');
  if (format === 'jpg') return 'JPG/JPEG';
  return format.toUpperCase();
}

export function AssetFilters({ assets, onFilterChange }: AssetFiltersProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ImageType[]>([]);
  const [selectedSources, setSelectedSources] = useState<ImageSource[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [minSize, setMinSize] = useState(0);

  const availableFormats = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const asset of assets) {
      const format = getAssetFormatKey(asset);
      counts[format] = (counts[format] || 0) + 1;
    }

    const dynamicKeys = Object.keys(counts)
      .filter((key) => !FORMAT_PRIORITY.includes(key))
      .sort((a, b) => a.localeCompare(b));

    const orderedKeys = [...FORMAT_PRIORITY.filter((key) => counts[key]), ...dynamicKeys];

    return orderedKeys.map((format) => ({
      format,
      count: counts[format],
    }));
  }, [assets]);

  const typeLabelMap: Record<ImageType, string> = {
    img: t('assetManager.filters.imageTypes.img'),
    background: t('assetManager.filters.imageTypes.background'),
    picture: t('assetManager.filters.imageTypes.picture'),
    svg: t('assetManager.filters.imageTypes.svg'),
    icon: t('assetManager.filters.imageTypes.icon'),
    other: t('assetManager.filters.imageTypes.other'),
  };

  const sourceLabelMap: Record<ImageSource, string> = {
    'img-tag': t('assetManager.filters.imageSources.imgTag'),
    'background-css': t('assetManager.filters.imageSources.backgroundCss'),
    'picture-tag': t('assetManager.filters.imageSources.pictureTag'),
    'svg-tag': t('assetManager.filters.imageSources.svgTag'),
    'inline-svg': t('assetManager.filters.imageSources.inlineSvg'),
    'data-uri': t('assetManager.filters.imageSources.dataUri'),
  };

  // Apply filters
  const filteredAssets = useMemo(() => {
    const filter: AssetFilter = {
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      source: selectedSources.length > 0 ? selectedSources : undefined,
      format: selectedFormats.length > 0 ? selectedFormats : undefined,
      minSize: minSize > 0 ? minSize : undefined,
      searchQuery: searchQuery || undefined,
    };

    return filterAssets(assets, filter);
  }, [assets, selectedTypes, selectedSources, selectedFormats, minSize, searchQuery]);

  // Notify parent of filtered results
  useEffect(() => {
    onFilterChange(filteredAssets);
  }, [filteredAssets, onFilterChange]);

  const toggleType = (type: ImageType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleSource = (source: ImageSource) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const clearAll = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedSources([]);
    setSelectedFormats([]);
    setMinSize(0);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedTypes.length > 0 ||
    selectedSources.length > 0 ||
    selectedFormats.length > 0 ||
    minSize > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-sm">{t('assetManager.filters.title')}</h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {t('assetManager.filters.reset')}
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.filters.search')}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('assetManager.filters.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Image Type */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.filters.imageType')}</label>
        <div className="flex flex-wrap gap-1.5">
          {IMAGE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedTypes.includes(type)
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {typeLabelMap[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Image Source */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.filters.imageSource')}</label>
        <div className="flex flex-wrap gap-1.5">
          {IMAGE_SOURCES.map((source) => (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedSources.includes(source)
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sourceLabelMap[source]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.filters.imageExtension')}</label>
        <div className="flex flex-wrap gap-1.5">
          {availableFormats.map(({ format, count }) => (
            <button
              key={format}
              onClick={() => toggleFormat(format)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFormats.includes(format)
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getFormatLabel(format, t)}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block">{t('assetManager.filters.minSize')}</label>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMinSize(option.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                minSize === option.value
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(`assetManager.filters.sizeOptions.${option.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600 text-center">
          {t('assetManager.filters.results', { filtered: filteredAssets.length, total: assets.length })}
        </div>
      </div>
    </div>
  );
}
