/**
 * Config Extractor Component
 *
 * Tailwind 설정 추출 UI
 */

import React, { useState } from 'react';
import { Download, Copy, Check, Palette, Ruler, Type } from 'lucide-react';

type ConfigTab = 'colors' | 'spacing' | 'fontSize' | 'full';

export function ConfigExtractor() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('colors');
  const [extractedConfig, setExtractedConfig] = useState<Record<string, unknown> | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExtract = async () => {
    setIsExtracting(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'TAILWIND_EXTRACT_CONFIG',
        data: { type: activeTab },
      });

      if (response.success) {
        setExtractedConfig(response.data);
      } else {
        throw new Error(response.error || 'Extraction failed');
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedConfig) return;

    const configText = formatConfig(activeTab, extractedConfig);
    try {
      await navigator.clipboard.writeText(configText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed
    }
  };

  const handleDownload = () => {
    if (!extractedConfig) return;

    const configText = formatConfig(activeTab, extractedConfig);
    const blob = new Blob([configText], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailwind.config.${activeTab === 'full' ? 'js' : 'ts'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatConfig = (tab: ConfigTab, config: Record<string, unknown>): string => {
    switch (tab) {
      case 'colors':
        return formatColorsConfig(config);
      case 'spacing':
        return formatSpacingConfig(config);
      case 'fontSize':
        return formatFontSizeConfig(config);
      case 'full':
        return formatFullConfig(config);
      default:
        return JSON.stringify(config, null, 2);
    }
  };

  const formatColorsConfig = (config: Record<string, unknown>): string => {
    const colors = config?.colors || {};
    let output = '// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n';

    Object.entries(colors).forEach(([name, value]: [string, unknown]) => {
      if (typeof value === 'object' && value !== null) {
        output += `        ${name}: {\n`;
        Object.entries(value as Record<string, unknown>).forEach(([shade, hex]) => {
          output += `          '${shade}': '${hex}',\n`;
        });
        output += `        },\n`;
      } else {
        output += `        ${name}: '${value}',\n`;
      }
    });

    output += '      },\n    },\n  },\n};';
    return output;
  };

  const formatSpacingConfig = (config: Record<string, unknown>): string => {
    const spacing = config?.spacing || {};
    let output = '// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      spacing: {\n';

    Object.entries(spacing).forEach(([key, value]) => {
      output += `        '${key}': '${value}',\n`;
    });

    output += '      },\n    },\n  },\n};';
    return output;
  };

  const formatFontSizeConfig = (config: Record<string, unknown>): string => {
    const fontSize = config?.fontSize || {};
    let output = '// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      fontSize: {\n';

    Object.entries(fontSize).forEach(([key, value]: [string, unknown]) => {
      if (Array.isArray(value)) {
        output += `        '${key}': ['${value[0]}', '${value[1]}'],\n`;
      } else {
        output += `        '${key}': '${value}',\n`;
      }
    });

    output += '      },\n    },\n  },\n};';
    return output;
  };

  const formatFullConfig = (config: Record<string, unknown>): string => {
    return '// tailwind.config.js\nmodule.exports = ' + JSON.stringify(config, null, 2);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Tab Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'colors'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Palette className="w-4 h-4" />
          색상
        </button>

        <button
          onClick={() => setActiveTab('spacing')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'spacing'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Ruler className="w-4 h-4" />
          간격
        </button>

        <button
          onClick={() => setActiveTab('fontSize')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'fontSize'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Type className="w-4 h-4" />
          폰트 크기
        </button>

        <button
          onClick={() => setActiveTab('full')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'full'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Download className="w-4 h-4" />
          전체 설정
        </button>
      </div>

      {/* Extract Button */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          페이지에서 사용된 커스텀 {activeTab === 'colors' ? '색상' : activeTab === 'spacing' ? '간격' : activeTab === 'fontSize' ? '폰트 크기' : '설정'}을 추출하여 Tailwind config를 생성합니다.
        </p>

        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtracting ? '추출 중...' : '설정 추출'}
        </button>
      </div>

      {/* Results */}
      {extractedConfig && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  복사
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>

          {/* Config Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              생성된 설정
            </h3>

            <div className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm text-green-400 whitespace-pre-wrap">
                {extractedConfig ? formatConfig(activeTab, extractedConfig) : 'Loading...'}
              </pre>
            </div>
          </div>

          {/* Recommendations */}
          {extractedConfig && 'recommendations' in extractedConfig && Array.isArray(extractedConfig.recommendations) && extractedConfig.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                추천사항
              </h3>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <ul className="space-y-1">
                  {(extractedConfig.recommendations as string[]).map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-400">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConfigExtractor;
