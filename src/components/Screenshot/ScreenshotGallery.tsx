/**
 * ScreenshotGallery Component
 *
 * 스크린샷 갤러리 컴포넌트
 */

import React, { useState, useMemo } from 'react';
import type { Screenshot } from '../../types/screenshot';
import { formatBytes } from '../../utils/screenshot/downloadHelpers';

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  selected: Screenshot | null;
  onSelect: (screenshot: Screenshot | null) => void;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onCopyToClipboard: (screenshot: Screenshot) => void;
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  screenshots,
  selected,
  onSelect,
  onDelete,
  onDownload,
  onCopyToClipboard,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMode, setFilterMode] = useState<'all' | 'element' | 'area' | 'full-page'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');

  // 필터링된 스크린샷
  const filteredScreenshots = useMemo(() => {
    let filtered = screenshots;

    if (filterMode !== 'all') {
      filtered = filtered.filter(s => s.mode === filterMode);
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [screenshots, filterMode, sortBy]);

  const handleSelect = (screenshot: Screenshot) => {
    onSelect(screenshot === selected ? null : screenshot);
  };

  return (
    <div className="klic-screenshot-gallery flex flex-col h-full">
      {/* Toolbar */}
      <div className="klic-gallery-toolbar flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'element' | 'area' | 'full-page')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="element">Element</option>
            <option value="area">Area</option>
            <option value="full-page">Full Page</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'size' | 'name')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : ''
              }`}
              title="Grid view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : ''
              }`}
              title="List view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="klic-gallery-content flex-1 overflow-auto p-4">
        {filteredScreenshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p className="text-lg font-medium">No screenshots yet</p>
            <p className="text-sm">Take your first screenshot to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredScreenshots.map((screenshot) => (
              <ScreenshotThumbnail
                key={screenshot.id}
                screenshot={screenshot}
                isSelected={selected?.id === screenshot.id}
                onClick={() => handleSelect(screenshot)}
                onDelete={() => onDelete(screenshot.id)}
                onDownload={() => onDownload(screenshot)}
                onCopyToClipboard={() => onCopyToClipboard(screenshot)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredScreenshots.map((screenshot) => (
              <ScreenshotListItem
                key={screenshot.id}
                screenshot={screenshot}
                isSelected={selected?.id === screenshot.id}
                onClick={() => handleSelect(screenshot)}
                onDelete={() => onDelete(screenshot.id)}
                onDownload={() => onDownload(screenshot)}
                onCopyToClipboard={() => onCopyToClipboard(screenshot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="klic-gallery-stats px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        {filteredScreenshots.length} screenshot{filteredScreenshots.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

// Screenshot Thumbnail Component
interface ScreenshotThumbnailProps {
  screenshot: Screenshot;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCopyToClipboard: () => void;
}

const ScreenshotThumbnail: React.FC<ScreenshotThumbnailProps> = ({
  screenshot,
  isSelected,
  onClick,
  onDelete,
  onDownload,
  onCopyToClipboard,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`
        klic-screenshot-thumbnail relative group rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm hover:shadow-md'}
      `}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <img
        src={screenshot.dataUrl}
        alt={screenshot.title || 'Screenshot'}
        className="w-full aspect-video object-cover bg-white"
      />

      {/* Overlay */}
      <div className={`
        klic-thumbnail-overlay absolute inset-0 bg-black/0 group-hover:bg-black/40
        transition-all duration-200
        ${isSelected ? 'bg-black/20' : ''}
      `} />

      {/* Actions */}
      {showActions && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyToClipboard();
            }}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            title="Copy to clipboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            title="Download"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
        {screenshot.mode}
      </div>
    </div>
  );
};

// Screenshot List Item Component
interface ScreenshotListItemProps {
  screenshot: Screenshot;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCopyToClipboard: () => void;
}

const ScreenshotListItem: React.FC<ScreenshotListItemProps> = ({
  screenshot,
  isSelected,
  onClick,
  onDelete,
  onDownload,
  onCopyToClipboard,
}) => {
  return (
    <div
      className={`
        klic-screenshot-list-item flex items-center gap-3 p-3 rounded-lg
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}
      `}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <img
        src={screenshot.dataUrl}
        alt={screenshot.title || 'Screenshot'}
        className="w-24 h-16 object-cover rounded bg-gray-100"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {screenshot.title || 'Untitled'}
        </p>
        <p className="text-sm text-gray-500">
          {new Date(screenshot.timestamp).toLocaleString()} • {screenshot.dimensions.width}×{screenshot.dimensions.height} • {formatBytes(screenshot.size || 0)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopyToClipboard();
          }}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Download"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ScreenshotGallery;
