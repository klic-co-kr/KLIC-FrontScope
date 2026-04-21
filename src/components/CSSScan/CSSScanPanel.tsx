/**
 * CSS Scan Panel Component
 *
 * CSS 스캔 메인 패널 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CSS_SCAN_MESSAGE_ACTIONS, CSSScanMessage } from '../../constants/cssScanMessages';
import { CSSScanSettings } from '../../types/cssScan';
import { useCSSScan } from '../../hooks/cssScan/useCSSScan';
import { StyleViewer } from './StyleViewer';
import { ColorPalette } from './ColorPalette';
import { FontList } from './FontList';
import { LayoutAnalyzer } from './LayoutAnalyzer';
import { CSSExport } from './CSSExport';

interface CSSScanPanelProps {
  onElementSelect?: (element: HTMLElement | null) => void;
}

export const CSSScanPanel: React.FC<CSSScanPanelProps> = ({ onElementSelect }) => {
  const [activeTab, setActiveTab] = useState<
    'inspector' | 'colors' | 'fonts' | 'layouts' | 'export'
  >('inspector');
  const [settings] = useState<CSSScanSettings>({
    autoScan: false,
    highlightOnHover: true,
    showBoxModel: true,
    showInherited: false,
    showComputed: true,
    exportFormat: 'css',
    theme: 'light',
  });
  const [isScanning, setIsScanning] = useState(false);

  const cssScan = useCSSScan({
    includeComputed: settings.showComputed,
    includeInherited: settings.showInherited,
  });

  // 메시지 리스너
  useEffect(() => {
    const handleMessage = (message: CSSScanMessage) => {
      switch (message.action) {
        case CSS_SCAN_MESSAGE_ACTIONS.ELEMENT_STYLE_RESPONSE:
          if (message.data) {
            // 스타일 데이터 처리
          }
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // 선택 요소 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onElementSelect?.(cssScan.selectedElement);
  }, [cssScan.selectedElement, onElementSelect]);

  const handleStartScan = useCallback(() => {
    setIsScanning(true);

    // Content script로 스캔 시작 요청
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: CSS_SCAN_MESSAGE_ACTIONS.START_SCAN,
          options: {
            includeComputed: settings.showComputed,
            includeInherited: settings.showInherited,
          },
        } as CSSScanMessage);
      }
    });
  }, [settings]);

  const handleStopScan = useCallback(() => {
    setIsScanning(false);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: CSS_SCAN_MESSAGE_ACTIONS.CANCEL_SCAN,
        } as CSSScanMessage);
      }
    });
  }, []);

  const tabButtons = [
    { id: 'inspector', label: 'Inspector', icon: '🔍' },
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'fonts', label: 'Fonts', icon: '🔤' },
    { id: 'layouts', label: 'Layouts', icon: '📐' },
    { id: 'export', label: 'Export', icon: '📤' },
  ] as const;

  return (
    <div className="klic-css-scan-panel flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="klic-css-header flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <h2 className="text-lg font-semibold text-gray-800">CSS Scan</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isScanning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isScanning ? 'Scanning...' : 'Scan Page'}
          </button>

          {isScanning && (
            <button
              onClick={handleStopScan}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="klic-css-tabs flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200">
        {tabButtons.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="klic-css-content flex-1 overflow-auto">
        {activeTab === 'inspector' && (
          <StyleViewer
            elementStyle={cssScan.elementStyle}
            colors={cssScan.colors}
            font={cssScan.font}
            boxModel={cssScan.boxModel}
            flexInfo={cssScan.flexInfo}
            gridInfo={cssScan.gridInfo}
          />
        )}

        {activeTab === 'colors' && <ColorPalette />}

        {activeTab === 'fonts' && <FontList />}

        {activeTab === 'layouts' && <LayoutAnalyzer />}

        {activeTab === 'export' && (
          <CSSExport format={settings.exportFormat} />
        )}
      </div>

      {/* Status Bar */}
      {cssScan.error && (
        <div className="klic-css-error px-4 py-2 bg-red-50 text-red-700 text-sm border-t border-red-200">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{cssScan.error}</span>
          </div>
        </div>
      )}

      {cssScan.selectedElement && (
        <div className="klic-css-status px-4 py-2 bg-blue-50 text-blue-700 text-sm border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              Selected: {cssScan.selectedElement.tagName.toLowerCase()}
              {cssScan.selectedElement.id && `#${cssScan.selectedElement.id}`}
              {cssScan.selectedElement.className &&
                `.${cssScan.selectedElement.className.split(' ').join('.')}`}
            </span>
            <button
              onClick={cssScan.clearSelection}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSSScanPanel;
