/**
 * Conversion Suggestions Component
 *
 * CSS를 Tailwind로 변환하는 UI
 */

import React, { useState } from 'react';
import { Code, Copy, Check, FileText, MousePointer } from 'lucide-react';
import { useTailwindConverter } from '../../hooks/tailwind';

export function ConversionSuggestions() {
  const {
    isConverting,
    conversionError,
    currentReport,
    generatedClasses,
    convertCSS,
    convertElement,
    convertInlineStyles,
    copyClasses,
    includeArbitrary,
    setIncludeArbitrary,
    minConfidence,
    setMinConfidence,
  } = useTailwindConverter();

  const [inputMode, setInputMode] = useState<'css' | 'element' | 'inline'>('css');
  const [cssInput, setCssInput] = useState('');
  const [elementSelector, setElementSelector] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    switch (inputMode) {
      case 'css':
        await convertCSS(cssInput);
        break;
      case 'element':
        await convertElement(elementSelector);
        break;
      case 'inline':
        await convertInlineStyles();
        break;
    }
  };

  const handleCopy = async () => {
    const success = await copyClasses(generatedClasses);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Input Mode Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('css')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            inputMode === 'css'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Code className="w-4 h-4" />
          CSS 입력
        </button>

        <button
          onClick={() => setInputMode('element')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            inputMode === 'element'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          요소 선택
        </button>

        <button
          onClick={() => setInputMode('inline')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            inputMode === 'inline'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          인라인 스타일
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        {inputMode === 'css' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSS 코드 입력
            </label>
            <textarea
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              placeholder="color: #3b82f6; padding: 1rem; margin: 0.5rem;"
              className="w-full h-32 px-3 py-2 font-mono text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
          </div>
        )}

        {inputMode === 'element' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSS 선택자 입력
            </label>
            <input
              type="text"
              value={elementSelector}
              onChange={(e) => setElementSelector(e.target.value)}
              placeholder=".my-class, #my-id, div.container"
              className="w-full px-3 py-2 font-mono text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {inputMode === 'inline' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              페이지의 모든 인라인 스타일을 스캔하여 Tailwind 클래스로 변환합니다.
            </p>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={isConverting || (inputMode === 'css' && !cssInput.trim()) || (inputMode === 'element' && !elementSelector.trim())}
          className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? '변환 중...' : '변환'}
        </button>
      </div>

      {/* Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          변환 옵션
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              임의 값 포함
            </span>
            <input
              type="checkbox"
              checked={includeArbitrary}
              onChange={(e) => setIncludeArbitrary(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              최소 신뢰도: {Math.round(minConfidence * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {conversionError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{conversionError}</p>
        </div>
      )}

      {/* Results */}
      {currentReport && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">전체 속성</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentReport.totalProperties}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">변환됨</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {currentReport.convertedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">변환율</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(currentReport.conversionRate * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Generated Classes */}
          {generatedClasses && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  생성된 Tailwind 클래스
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      복사
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-gray-900 dark:bg-gray-950 rounded-lg">
                <code className="text-sm text-green-400 whitespace-pre-wrap break-all">
                  {generatedClasses}
                </code>
              </div>
            </div>
          )}

          {/* Conversion Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              변환 상세
            </h3>

            <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              {currentReport.conversions.map((conv, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                      {conv.css}
                    </p>
                    <p className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {conv.tailwind}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {conv.isArbitrary && (
                      <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                        임의
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {Math.round(conv.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unmapped */}
          {currentReport.unmapped.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                변환되지 않은 속성
              </h3>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <ul className="space-y-1">
                  {currentReport.unmapped.map((prop, index) => (
                    <li key={index} className="text-xs font-mono text-orange-700 dark:text-orange-400">
                      {prop}
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

export default ConversionSuggestions;
