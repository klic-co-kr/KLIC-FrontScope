import React from 'react';

interface FooterProps {
  activeToolCount?: number;
  onDeactivateAll?: () => void;
}

export function Footer({ activeToolCount = 0, onDeactivateAll }: FooterProps) {
  return (
    <footer className="px-4 py-2 bg-white border-t border-gray-200 flex items-center justify-between text-xs">
      <div className="footer-left flex items-center gap-3">
        <span className="status-indicator flex items-center gap-1.5">
          <span className="status-dot w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-gray-600">활성</span>
        </span>
        {activeToolCount > 0 && (
          <span className="active-tools text-amber-600 font-medium">
            {activeToolCount}개 도구 실행 중
          </span>
        )}
      </div>

      <div className="footer-right">
        {activeToolCount > 0 && (
          <button
            onClick={onDeactivateAll}
            className="footer-action px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            title="모든 도구 비활성화"
          >
            전체 끄기
          </button>
        )}
      </div>
    </footer>
  );
}
