/**
 * CSS Export Component
 *
 * CSS 내보내기 컴포넌트
 */

import React, { useState } from 'react';
import type { CSSExportOptions } from '../../types/cssScan';

interface CSSExportProps {
  format: CSSExportOptions['format'];
}

export const CSSExport: React.FC<CSSExportProps> = ({ format }) => {
  const [selectedFormat, setSelectedFormat] = useState<CSSExportOptions['format']>(format);
  const [options, setOptions] = useState({
    minify: false,
    includeComputed: true,
    includeInherited: false,
    includeSelectors: true,
  });
  const [exportedCSS, setExportedCSS] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    try {
      // Content script로 내보내기 요청
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'CSS_EXPORT_STYLES',
          format: selectedFormat,
          options,
        });

        if (response?.data) {
          setExportedCSS(response.data);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportedCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `styles.${selectedFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="klic-css-export p-4 space-y-4">
      {/* 헤더 */}
      <h3 className="text-sm font-semibold text-gray-700">Export CSS</h3>

      {/* 형식 선택 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Format</label>
        <div className="flex gap-2">
          {(['css', 'scss', 'less', 'json'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedFormat === fmt
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 옵션 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Options</label>
        <div className="space-y-1">
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
            <input
              type="checkbox"
              checked={options.minify}
              onChange={(e) => setOptions({ ...options, minify: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs">Minify output</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
            <input
              type="checkbox"
              checked={options.includeComputed}
              onChange={(e) =>
                setOptions({ ...options, includeComputed: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs">Include computed styles</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
            <input
              type="checkbox"
              checked={options.includeInherited}
              onChange={(e) =>
                setOptions({ ...options, includeInherited: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs">Include inherited styles</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
            <input
              type="checkbox"
              checked={options.includeSelectors}
              onChange={(e) =>
                setOptions({ ...options, includeSelectors: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs">Include selectors</span>
          </label>
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <button
        onClick={handleExport}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Generate CSS
      </button>

      {/* 결과 */}
      {exportedCSS && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {exportedCSS.length} characters
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Download
              </button>
            </div>
          </div>

          {/* 코드 미리보기 */}
          <div className="relative">
            <pre
              className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-xs font-mono"
              style={{ maxHeight: '300px' }}
            >
              {exportedCSS}
            </pre>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!exportedCSS && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">Click "Generate CSS" to export page styles</p>
        </div>
      )}
    </div>
  );
};

export default CSSExport;
