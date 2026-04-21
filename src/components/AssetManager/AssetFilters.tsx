/**
 * AssetFilters Component
 *
 * 에셋 필터 컴포넌트 - 타입, 크기, 소스별 필터링
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  AssetFilter,
  ImageType,
  ImageSource,
  SortBy,
  SortOrder,
} from '../../types/assetManager';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface AssetFiltersProps {
  filter: AssetFilter;
  onFilterChange: (filter: AssetFilter) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy, order: SortOrder) => void;
  assetCount?: number;
  filteredCount?: number;
}

const TYPE_OPTIONS: Array<{ value: ImageType; label: string; color: string }> = [
  { value: 'img', label: 'Images', color: 'bg-blue-500' },
  { value: 'background', label: 'Backgrounds', color: 'bg-purple-500' },
  { value: 'picture', label: 'Pictures', color: 'bg-green-500' },
  { value: 'svg', label: 'SVG', color: 'bg-orange-500' },
  { value: 'icon', label: 'Icons', color: 'bg-pink-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const SOURCE_OPTIONS: Array<{ value: ImageSource; label: string }> = [
  { value: 'img-tag', label: 'IMG Tag' },
  { value: 'background-css', label: 'Background CSS' },
  { value: 'picture-tag', label: 'Picture Tag' },
  { value: 'svg-tag', label: 'SVG Tag' },
  { value: 'inline-svg', label: 'Inline SVG' },
  { value: 'data-uri', label: 'Data URI' },
];

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'size', label: 'Size' },
  { value: 'dimensions', label: 'Dimensions' },
  { value: 'format', label: 'Format' },
  { value: 'source', label: 'Source' },
  { value: 'url', label: 'URL' },
];

const SIZE_PRESETS = [
  { label: '< 10KB', max: 10 * 1024 },
  { label: '10KB - 100KB', min: 10 * 1024, max: 100 * 1024 },
  { label: '100KB - 1MB', min: 100 * 1024, max: 1024 * 1024 },
  { label: '> 1MB', min: 1024 * 1024 },
];

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  filter,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  assetCount = 0,
  filteredCount = 0,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showSizePresets, setShowSizePresets] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return (
      (filter.type && filter.type.length > 0) ||
      (filter.source && filter.source.length > 0) ||
      filter.minSize !== undefined ||
      filter.maxSize !== undefined ||
      filter.minWidth !== undefined ||
      filter.maxWidth !== undefined ||
      filter.minHeight !== undefined ||
      filter.maxHeight !== undefined ||
      (filter.format && filter.format.length > 0) ||
      !!filter.searchQuery
    );
  }, [filter]);

  const handleClearAll = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const handleTypeToggle = useCallback(
    (type: ImageType) => {
      const current = filter.type || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      onFilterChange({ ...filter, type: updated.length > 0 ? updated : undefined });
    },
    [filter, onFilterChange]
  );

  const handleSourceToggle = useCallback(
    (source: ImageSource) => {
      const current = filter.source || [];
      const updated = current.includes(source)
        ? current.filter((s) => s !== source)
        : [...current, source];
      onFilterChange({ ...filter, source: updated.length > 0 ? updated : undefined });
    },
    [filter, onFilterChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      onFilterChange({
        ...filter,
        searchQuery: value || undefined,
      });
    },
    [filter, onFilterChange]
  );

  const handleSizePreset = useCallback(
    (preset: typeof SIZE_PRESETS[0]) => {
      onFilterChange({
        ...filter,
        minSize: preset.min,
        maxSize: preset.max,
      });
      setShowSizePresets(false);
    },
    [filter, onFilterChange]
  );

  const handleSortChange = useCallback(
    (value: SortBy) => {
      if (value === sortBy) {
        // Toggle order
        onSortChange(value, sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        onSortChange(value, 'desc');
      }
    },
    [sortBy, sortOrder, onSortChange]
  );

  return (
    <div className="klic-asset-filters bg-background border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              Active
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-3">
          {/* Results Count */}
          <span className="text-sm text-muted-foreground">
            {filteredCount !== assetCount
              ? `${filteredCount} of ${assetCount}`
              : `${assetCount} assets`}
          </span>

          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by URL, selector, or alt text..."
              value={filter.searchQuery || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => {
                const isSelected = filter.type?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTypeToggle(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? 'text-white ring-2 ring-offset-1 ring-offset-background'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: option.color.replace('bg-', '#'),
                            outline: `2px solid ${option.color.replace('bg-', '#')}`,
                          }
                        : undefined
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Source
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((option) => {
                const isSelected = filter.source?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSourceToggle(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-2 border-primary/30'
                        : 'bg-muted text-foreground hover:bg-muted/80 border-2 border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              File Size
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Min (KB)"
                  value={filter.minSize ? Math.round(filter.minSize / 1024) : ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      minSize: e.target.value
                        ? parseInt(e.target.value) * 1024
                        : undefined,
                    })
                  }
                  className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max (KB)"
                  value={filter.maxSize ? Math.round(filter.maxSize / 1024) : ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      maxSize: e.target.value
                        ? parseInt(e.target.value) * 1024
                        : undefined,
                    })
                  }
                  className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
                />
                <button
                  onClick={() => setShowSizePresets(!showSizePresets)}
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Presets
                </button>
              </div>

              {/* Size Presets Dropdown */}
              {showSizePresets && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleSizePreset(preset)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const isSelected = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors relative ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-2 border-primary/30'
                        : 'bg-muted text-foreground hover:bg-muted/80 border-2 border-transparent'
                    }`}
                  >
                    {option.label}
                    {isSelected && (
                      <span className="ml-1 text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetFilters;
