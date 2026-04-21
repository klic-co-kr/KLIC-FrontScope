// src/components/AccessibilityChecker/AccessibilityPanel.tsx
// Accessibility Panel - Main container for accessibility checker

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ScanButton } from './ScanButton';
import { CategoryTabs } from './CategoryTabs';
import { ExportButton } from './ExportButton';
import { useAccessibilityScanner } from '@/hooks/accessibility';
import { useAccessibilityReport } from '@/hooks/accessibility/useAccessibilityReport';
import { useTranslations } from '@/hooks/useTranslations';

export function AccessibilityPanel() {
  const {
    isScanning,
    isComplete,
    report,
    error,
    settings,
    updateSettings,
    startScan,
    highlightElement,
    clearHighlights,
  } = useAccessibilityScanner();
  const { t: translate } = useTranslations();
  const { exportReport, isExporting } = useAccessibilityReport(report);
  const autoScanAttemptedRef = useRef(false);

  const handleExport = (format: 'json' | 'csv' | 'html') => {
    exportReport(format);
  };

  // Auto-scan on mount if enabled
  useEffect(() => {
    if (!settings.autoScanOnActivate) {
      autoScanAttemptedRef.current = false;
      return;
    }

    if (autoScanAttemptedRef.current) {
      return;
    }

    if (!isComplete && !isScanning && !report) {
      autoScanAttemptedRef.current = true;
      startScan();
    }
  }, [settings.autoScanOnActivate, isComplete, isScanning, report, startScan]);

  useEffect(() => {
    return () => {
      void clearHighlights();
    };
  }, [clearHighlights]);

  return (
    <div className="space-y-6">
      {report && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <ScanButton isScanning={isScanning} isComplete={isComplete} onScan={startScan} />
            <ExportButton onExport={handleExport} disabled={!report || isExporting} isExporting={isExporting} />
          </div>
        </div>
      )}

      {error && (
        <Card>
          <div className="px-4 py-3 text-sm text-destructive">{error}</div>
        </Card>
      )}

      {/* Main Content */}
      {report ? (
        <CategoryTabs
          categories={report.categories}
          totalScore={report.totalScore}
          grade={report.grade}
          krdsCompliant={report.krdsCompliant}
          settings={settings}
          onSettingsChange={updateSettings}
          onSelectIssueElement={highlightElement}
        />
      ) : (
        /* Empty State */
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-2m6 6l-4-4m6 6 4-4"
                />
              </svg>
            </div>
            <p className="text-muted-foreground mb-6">
              {translate('accessibility.emptyState')}
            </p>

            <div className="inline-flex items-center">
              <ScanButton isScanning={isScanning} isComplete={isComplete} onScan={startScan} />
            </div>

            {isScanning && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{translate('accessibility.scanning')}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
