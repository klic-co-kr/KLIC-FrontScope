# Phase 6: React 컴포넌트

**태스크**: 4개
**예상 시간**: 2.5시간
**의존성**: Phase 1-5 완료

---

### Task #9.31: TailwindScannerPanel 메인 컴포넌트

- **파일**: `src/sidepanel/components/TailwindScanner/TailwindScannerPanel.tsx`
- **시간**: 45분
- **의존성**: Task #9.29, #9.30
- **상세 내용**:
```typescript
import React, { useState, useEffect } from 'react';
import { useTailwindHistory } from '../../../hooks/tailwind/useTailwindHistory';
import { ScanResults } from './ScanResults';
import { ConversionSuggestions } from './ConversionSuggestions';
import { ConfigExtractor } from './ConfigExtractor';
import { SettingsPanel } from './SettingsPanel';

interface TailwindScannerPanelProps {
  isActive: boolean;
  onToggle: () => void;
}

export function TailwindScannerPanel({ isActive, onToggle }: TailwindScannerPanelProps) {
  const {
    history,
    loading,
    addResult,
    getLatestResult,
  } = useTailwindHistory();

  const [activeTab, setActiveTab] = useState<'scan' | 'convert' | 'config' | 'settings'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState(getLatestResult());

  /**
   * 페이지 스캔
   */
  const handleScanPage = async () => {
    try {
      setIsScanning(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TAILWIND_SCAN_PAGE',
        });

        if (response?.success) {
          await addResult(response.data);
          setCurrentResult(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to scan page:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="tailwind-scanner-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>Tailwind 스캐너</h2>
        <button
          onClick={handleScanPage}
          disabled={isScanning}
          className="scan-btn"
        >
          {isScanning ? '스캔 중...' : '페이지 스캔'}
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('scan')}
          className={activeTab === 'scan' ? 'active' : ''}
        >
          스캔 결과
        </button>
        <button
          onClick={() => setActiveTab('convert')}
          className={activeTab === 'convert' ? 'active' : ''}
        >
          변환 제안
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={activeTab === 'config' ? 'active' : ''}
        >
          설정 추출
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'scan' && (
          <ScanResults
            result={currentResult}
            history={history}
            loading={loading}
          />
        )}

        {activeTab === 'convert' && (
          <ConversionSuggestions />
        )}

        {activeTab === 'config' && (
          <ConfigExtractor />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </div>
    </div>
  );
}
```
- **완료 조건**: UI 정상 동작

---

### Task #9.32: ScanResults 컴포넌트

- **파일**: `src/sidepanel/components/TailwindScanner/ScanResults.tsx`
- **시간**: 30분
- **의존성**: Task #9.1
- **상세 내용**:
```typescript
import React from 'react';
import { TailwindDetectionResult } from '../../../types/tailwindScanner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScanResultsProps {
  result: TailwindDetectionResult & { timestamp?: number; url?: string } | null;
  history: Array<TailwindDetectionResult & { timestamp: number; url: string }>;
  loading: boolean;
}

export function ScanResults({ result, history, loading }: ScanResultsProps) {
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!result) {
    return (
      <div className="empty-state">
        <p>Tailwind 사용을 스캔하려면</p>
        <p>페이지 스캔 버튼을 클릭하세요.</p>
      </div>
    );
  }

  return (
    <div className="scan-results">
      {/* 현재 결과 */}
      <div className="current-result">
        <h3>현재 페이지</h3>

        <div className="result-summary">
          <div className="summary-item">
            <span className="label">감지됨</span>
            <span className={`value ${result.detected ? 'yes' : 'no'}`}>
              {result.detected ? '예' : '아니오'}
            </span>
          </div>

          {result.detected && (
            <>
              <div className="summary-item">
                <span className="label">버전</span>
                <span className="value">{result.version}</span>
              </div>

              <div className="summary-item">
                <span className="label">JIT 모드</span>
                <span className="value">{result.jitMode ? '예' : '아니오'}</span>
              </div>

              <div className="summary-item">
                <span className="label">클래스 수</span>
                <span className="value">{result.totalClasses}</span>
              </div>

              <div className="summary-item">
                <span className="label">커스텀</span>
                <span className="value">{result.customClasses.length}</span>
              </div>
            </>
          )}
        </div>

        {result.timestamp && (
          <div className="scan-time">
            스캔 시간: {formatDistanceToNow(result.timestamp, { addSuffix: true, locale: ko })}
          </div>
        )}
      </div>

      {/* 히스토리 */}
      {history.length > 1 && (
        <div className="scan-history">
          <h4>이전 스캔</h4>
          <div className="history-list">
            {history.slice(1).map((item, index) => (
              <div key={index} className="history-item">
                <span className="url">{item.url}</span>
                <span className="time">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: ko })}
                </span>
                <span className="classes">{item.totalClasses}개 클래스</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 정상적인 결과 표시

---

### Task #9.33: ConversionSuggestions 컴포넌트

- **파일**: `src/sidepanel/components/TailwindScanner/ConversionSuggestions.tsx`
- **시간**: 45분
- **의존성**: Task #9.1
- **상세 내용**:
```typescript
import React, { useState, useEffect } from 'react';
import { CSSToTailwindResult, ConversionReport } from '../../../types/tailwindScanner';

export function ConversionSuggestions() {
  const [reports, setReports] = useState<ConversionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  /**
   * 요소 스캔
   */
  const handleScanElement = async () => {
    try {
      setLoading(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TAILWIND_SCAN_ELEMENT',
        });

        if (response?.success) {
          setReports(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to scan element:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="conversion-suggestions">
      <div className="action-bar">
        <button
          onClick={handleScanElement}
          disabled={loading}
          className="scan-element-btn"
        >
          {loading ? '스캔 중...' : '요소 스캔'}
        </button>
        <p className="hint">페이지에서 요소를 선택한 후 스캔하세요</p>
      </div>

      {reports.length > 0 && (
        <div className="reports-list">
          {reports.map((report, index) => (
            <ConversionReportCard
              key={index}
              report={report}
              isExpanded={selectedElement === report.element.selector}
              onToggle={() => setSelectedElement(
                selectedElement === report.element.selector ? null : report.element.selector
              )}
            />
          ))}
        </div>
      )}

      {reports.length === 0 && !loading && (
        <div className="empty-state">
          <p>변환 제안이 없습니다.</p>
          <p>요소를 스캔하여 CSS를 Tailwind 클래스로 변환하세요.</p>
        </div>
      )}
    </div>
  );
}

interface ConversionReportCardProps {
  report: ConversionReport;
  isExpanded: boolean;
  onToggle: () => void;
}

function ConversionReportCard({ report, isExpanded, onToggle }: ConversionReportCardProps) {
  return (
    <div className="report-card">
      <div className="card-header" onClick={onToggle}>
        <span className="selector">{report.element.selector}</span>
        <span className={`conversion-rate ${getRateClass(report.summary.conversionRate)}`}>
          {Math.round(report.summary.conversionRate * 100)}% 변환 가능
        </span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="card-body">
          {/* 변환 가능 */}
          {report.conversions.length > 0 && (
            <div className="conversions-section">
              <h4>변환 가능 ({report.conversions.length})</h4>
              <div className="conversion-list">
                {report.conversions.map((conv, index) => (
                  <div key={index} className="conversion-item">
                    <div className="css-property">
                      <span className="property">{conv.css.property}</span>
                      <span className="value">{conv.css.value}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="tailwind-classes">
                      {conv.tailwind.classes.map((cls, i) => (
                        <span key={i} className="class">{cls}</span>
                      ))}
                      <span className="confidence">
                        {Math.round(conv.tailwind.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 추천 클래스 */}
          {report.suggestedClasses.length > 0 && (
            <div className="suggested-section">
              <h4>추천 클래스</h4>
              <code className="suggested-classes">
                {report.suggestedClasses.join(' ')}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(report.suggestedClasses.join(' '))}
                className="copy-btn"
              >
                복사
              </button>
            </div>
          )}

          {/* 변환 불가 */}
          {report.nonConvertible.length > 0 && (
            <div className="non-convertible-section">
              <h4>변환 불가 ({report.nonConvertible.length})</h4>
              <div className="non-convertible-list">
                {report.nonConvertible.map((item, index) => (
                  <div key={index} className="non-convertible-item">
                    <span className="property">{item.property}: {item.value}</span>
                    <span className="reason">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRateClass(rate: number): string {
  if (rate >= 0.8) return 'high';
  if (rate >= 0.5) return 'medium';
  return 'low';
}
```
- **완료 조건**: 정상적인 변환 제안 표시

---

### Task #9.34: ConfigExtractor 및 SettingsPanel 컴포넌트

- **파일**: `src/sidepanel/components/TailwindScanner/ConfigExtractor.tsx`
- **시간**: 30분
- **의존성**: Task #9.1
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { TailwindConfig } from '../../../types/tailwindScanner';

export function ConfigExtractor() {
  const [config, setConfig] = useState<TailwindConfig | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 설정 추출
   */
  const handleExtractConfig = async () => {
    try {
      setLoading(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TAILWIND_EXTRACT_CONFIG',
        });

        if (response?.success) {
          setConfig(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to extract config:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 설정 복사
   */
  const handleCopyConfig = () => {
    if (config) {
      const configString = JSON.stringify(config, null, 2);
      navigator.clipboard.writeText(configString);
    }
  };

  return (
    <div className="config-extractor">
      <div className="action-bar">
        <button
          onClick={handleExtractConfig}
          disabled={loading}
          className="extract-btn"
        >
          {loading ? '추출 중...' : '설정 추출'}
        </button>

        {config && (
          <button
            onClick={handleCopyConfig}
            className="copy-btn"
          >
            설정 복사
          </button>
        )}
      </div>

      {config && (
        <div className="config-display">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}

      {!config && !loading && (
        <div className="empty-state">
          <p>페이지에서 Tailwind 설정을 추출하세요.</p>
        </div>
      )}
    </div>
  );
}

// SettingsPanel (간단 버전)
export function SettingsPanel() {
  return (
    <div className="settings-panel">
      <h3>Tailwind 스캐너 설정</h3>
      <div className="settings-form">
        <label>
          <input type="checkbox" defaultChecked={true} />
          자동 스캔
        </label>
        <label>
          <input type="checkbox" defaultChecked={true} />
          변환 제안 표시
        </label>
        <label>
          <input type="checkbox" defaultChecked={true} />
          캐시 활성화
        </label>
      </div>
    </div>
  );
}
```
- **완료 조건**: 정상적인 설정 추출 및 표시

---

[Phase 7: 테스트](./TASK-09-PHASE7.md) 로 계속
