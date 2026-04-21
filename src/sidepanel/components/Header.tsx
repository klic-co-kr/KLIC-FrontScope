import React, { useState } from 'react';
import { Settings, Search, X } from 'lucide-react';

interface HeaderProps {
  activeToolCount?: number;
  onOpenSettings?: () => void;
}

export function Header({ activeToolCount = 0, onOpenSettings }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <img src="/icons/icon48.png" alt="Logo" className="w-6 h-6" />
        <h1 className="font-bold text-sm">KLIC-FrontScope</h1>
        {activeToolCount > 0 && (
          <span className="text-xs text-amber-600 font-medium">
            ({activeToolCount}개 활성)
          </span>
        )}
      </div>

      {/* Center: Search */}
      <div className="header-center">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="도구 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-32"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <button
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="검색"
            title="도구 검색"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: Settings */}
      <div className="header-right">
        <button
          onClick={onOpenSettings}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          aria-label="설정"
          title="설정"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
