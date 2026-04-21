/**
 * Font List Component
 *
 * 페이지의 모든 폰트 목록 표시 컴포넌트
 */

import React, { useState } from 'react';
import { usePageFonts, useFavoriteFonts } from '../../hooks/fontAnalyzer';
import './FontList.css';

export interface FontListProps {
  onFontSelect?: (font: string) => void;
  selectedFont?: string;
  showPreview?: boolean;
  showVariants?: boolean;
  showUsage?: boolean;
  maxItems?: number;
}

export const FontList: React.FC<FontListProps> = ({
  onFontSelect,
  selectedFont,
  showPreview = true,
  showVariants = true,
  showUsage = true,
  maxItems,
}) => {
  const { fonts, isLoading } = usePageFonts();
  const { favorites, addFavorite, removeFavorite } = useFavoriteFonts();
  const [filter, setFilter] = useState<'all' | 'system' | 'web' | 'favorite'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFonts = fonts
    .filter(font => {
      if (searchQuery && !font.family.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filter === 'favorite') {
        return favorites.includes(font.family);
      }

      return true;
    })
    .slice(0, maxItems);

  const toggleFavorite = async (fontFamily: string) => {
    if (favorites.includes(fontFamily)) {
      await removeFavorite(fontFamily);
    } else {
      await addFavorite(fontFamily);
    }
  };

  const getFontPreview = (family: string, text: string = 'Aa') => {
    return (
      <span
        className="font-list-preview"
        style={{ fontFamily: family }}
      >
        {text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="font-list-loading">
        <div className="font-list-spinner" />
        <p>Loading fonts...</p>
      </div>
    );
  }

  return (
    <div className="font-list">
      {/* Header */}
      <div className="font-list-header">
        <h3>Fonts ({filteredFonts.length})</h3>

        {/* Filter */}
        <div className="font-list-filter">
          <button
            className={`font-list-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`font-list-filter-btn ${filter === 'system' ? 'active' : ''}`}
            onClick={() => setFilter('system')}
          >
            System
          </button>
          <button
            className={`font-list-filter-btn ${filter === 'web' ? 'active' : ''}`}
            onClick={() => setFilter('web')}
          >
            Web
          </button>
          <button
            className={`font-list-filter-btn ${filter === 'favorite' ? 'active' : ''}`}
            onClick={() => setFilter('favorite')}
          >
            ⭐ Favorites ({favorites.length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          className="font-list-search"
          placeholder="Search fonts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {filteredFonts.length === 0 ? (
        <div className="font-list-empty">
          <p>No fonts found</p>
          {searchQuery && (
            <button
              className="font-list-clear"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="font-list-items">
          {filteredFonts.map((font, index) => (
            <div
              key={index}
              className={`font-list-item ${selectedFont === font.family ? 'selected' : ''}`}
              onClick={() => onFontSelect?.(font.family)}
            >
              {showPreview && (
                <div className="font-list-item-preview">
                  {getFontPreview(font.family)}
                </div>
              )}

              <div className="font-list-item-info">
                <div className="font-list-item-name">
                  {font.family}
                </div>

                {showUsage && (
                  <div className="font-list-item-usage">
                    <span className="font-list-count">{font.count}</span>
                    <span className="font-list-percentage">
                      {font.percentage.toFixed(1)}%
                    </span>
                  </div>
                )}

                {showVariants && font.variants && font.variants.length > 0 && (
                  <div className="font-list-variants">
                    {font.variants.slice(0, 3).map((variant, i) => (
                      <span key={i} className="font-list-variant">
                        {variant}
                      </span>
                    ))}
                    {font.variants.length > 3 && (
                      <span className="font-list-variants-more">
                        +{font.variants.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                className={`font-list-favorite ${favorites.includes(font.family) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(font.family);
                }}
                title={favorites.includes(font.family) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favorites.includes(font.family) ? '⭐' : '☆'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontList;
