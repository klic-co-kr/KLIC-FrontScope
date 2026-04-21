/**
 * Tailwind Scanner Panel
 *
 * Tailwind CSS 스캔 및 분석 메인 패널
 */

import React, { useState } from 'react';
import {
  Scan,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useTailwindScanner } from '../../hooks/tailwind';
import ScanResults from './ScanResults';
import ConversionSuggestions from './ConversionSuggestions';
import ConfigExtractor from './ConfigExtractor';
import ScannerSettings from './ScannerSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Tab = 'scan' | 'convert' | 'config' | 'settings';

export function TailwindScannerPanel() {
  const {
    currentScan,
    isScanning,
    scanError,
    history,
    maxHistory,
    settings,
    scanCurrentPage,
    clearHistory,
    deleteHistoryItem,
    exportHistory,
    updateSettings,
  } = useTailwindScanner();

  const [activeTab, setActiveTab] = useState<Tab>('scan');

  const handleScan = async () => {
    await scanCurrentPage();
  };

  const handleExport = async () => {
    const data = await exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailwind-scan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = async () => {
    if (confirm('스캔 히스토리를 모두 삭제하시겠습니까?')) {
      await clearHistory();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-end px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Scan Status */}
          {currentScan && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {currentScan.isTailwindDetected ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              <span>
                {currentScan.totalClasses}개 클래스
              </span>
            </div>
          )}

          {/* Scan Button */}
          <Button
            onClick={handleScan}
            disabled={isScanning}
            size="sm"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                스캔 중...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-1" />
                스캔
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">
            스캔 결과
            {currentScan && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {currentScan.totalClasses}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="convert">CSS 변환</TabsTrigger>
          <TabsTrigger value="config">설정 추출</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="scan" className="mt-0">
            <ScanResults
              scan={currentScan}
              isScanning={isScanning}
              error={scanError}
              history={history}
              maxHistory={maxHistory}
              onDeleteHistoryItem={deleteHistoryItem}
              onClearHistory={handleClearHistory}
              onExport={handleExport}
            />
          </TabsContent>

          <TabsContent value="convert" className="mt-0">
            <ConversionSuggestions />
          </TabsContent>

          <TabsContent value="config" className="mt-0">
            <ConfigExtractor />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ScannerSettings
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default TailwindScannerPanel;
