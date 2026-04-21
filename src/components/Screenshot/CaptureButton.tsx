/**
 * CaptureButton Component
 *
 * 캡처 버튼 컴포넌트
 */

import React from 'react';
import { CaptureMode } from '../../types/screenshot';

interface CaptureButtonProps {
  mode: CaptureMode;
  isCapturing: boolean;
  onCapture: (mode: CaptureMode) => void;
  disabled?: boolean;
}

const MODE_CONFIGS: Record<
  CaptureMode,
  { label: string; icon: string; description: string }
> = {
  element: {
    label: 'Element',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
    description: 'Capture a specific element',
  },
  area: {
    label: 'Area',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>`,
    description: 'Select and capture an area',
  },
  'full-page': {
    label: 'Full Page',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>`,
    description: 'Capture the entire page',
  },
};

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  mode,
  isCapturing,
  onCapture,
  disabled = false,
}) => {
  const config = MODE_CONFIGS[mode];

  return (
    <button
      onClick={() => onCapture(mode)}
      disabled={disabled}
      className={`
        klic-capture-button klic-capture-button-${mode}
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow'
        }
      `}
      title={config.description}
    >
      <span dangerouslySetInnerHTML={{ __html: config.icon }} />
      <span>{config.label}</span>
      {isCapturing && (
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
};

export default CaptureButton;
