import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Bold, Italic, PaintBucket, RotateCcw, Strikethrough } from 'lucide-react';
import { ToolType } from '../constants/tools';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ToolData } from '../App';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import {
  buildListenerTags,
  buildStructuredInspectorJson,
  buildStructuredListenerJson,
  createListenerFingerprint,
  summarizeListenerForBadge,
} from '../utils/jsInspectorExport';
import type { FontAnalyzerPanelProps } from '@/components/FontAnalyzer/FontAnalyzerPanel';
import type { CssScannerPanelProps } from '@/components/CSSScan/CssScannerPanel';
import type { TextEditFontOptionsResponse, TextEditFormatCommand } from '@/types/textEdit';
import type { JsInspectorResult } from '@/types/jsInspector';
import type { ComponentPanelProps } from '@/components/ComponentInspector/ComponentPanel';

const LazyAssetManagerPanel = lazyWithRetry<Record<string, never>>(() =>
  import('./AssetManager').then((module) => ({ default: module.AssetManagerPanel })),
  'klic:lazy-retry:asset-manager-panel'
);
const LazyResourceNetworkPanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/ResourceNetwork/ResourceNetworkPanel').then((module) => ({
    default: module.ResourceNetworkPanel,
  })),
  'klic:lazy-retry:resource-network-panel',
);
const LazyGridLayoutPanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/GridLayout/GridLayoutPanel').then((module) => ({
    default: module.GridLayoutPanel,
  })),
  'klic:lazy-retry:grid-layout-panel',
);
const LazyTailwindScannerPanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/TailwindScanner').then((module) => ({
    default: module.TailwindScannerPanel,
  })),
  'klic:lazy-retry:tailwind-panel',
);
const LazyCssScannerPanel = lazyWithRetry<CssScannerPanelProps>(() =>
  import('../../components/CSSScan/CssScannerPanel').then((module) => ({
    default: module.CssScannerPanel,
  })),
  'klic:lazy-retry:css-scan-panel',
);
const LazyAccessibilityPanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/AccessibilityChecker/AccessibilityPanel').then((module) => ({
    default: module.AccessibilityPanel,
  })),
  'klic:lazy-retry:accessibility-panel',
);
const LazySidepanelConsolePanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/Console/ConsolePanel').then((module) => ({
    default: module.ConsolePanel,
  })),
  'klic:lazy-retry:console-panel',
);
const LazyCapturePanel = lazyWithRetry<Record<string, never>>(() =>
  import('../../components/Screenshot/CapturePanel').then((module) => ({
    default: module.CapturePanel,
  })),
  'klic:lazy-retry:capture-panel',
);
const LazyFontAnalyzerPanel = lazyWithRetry<FontAnalyzerPanelProps>(() =>
  import('../../components/FontAnalyzer/FontAnalyzerPanel').then((module) => ({
    default: module.FontAnalyzerPanel,
  })),
  'klic:lazy-retry:font-analyzer-panel',
);
const LazyComponentPanel = lazyWithRetry<ComponentPanelProps>(() =>
  import('../../components/ComponentInspector/ComponentPanel').then((module) => ({
    default: module.ComponentPanel,
  })),
  'klic:lazy-retry:component-panel',
);

interface ToolRouterProps {
  currentTool: ToolType | null;
  tools: Record<ToolType, unknown>;
  toolData: ToolData;
  onToggle: (toolId: ToolType) => void;
  onMarkUnsaved: (toolId: ToolType, hasChanges: boolean) => void;
  onCopy: (text: string) => Promise<void> | void;
  onReset: (toolId: ToolType) => void;
  // Palette picker props
  isPalettePickerActive?: boolean;
  onTogglePalettePicker?: () => void;
  // Component inspector props
  isComponentPickerActive?: boolean;
  onToggleComponentPicker?: () => void;
  onComponentScan?: () => void;
  isComponentScanning?: boolean;
}

function ToolPanelLoading() {
  return <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>;
}

export function ToolRouter({
  currentTool,
  tools,
  toolData,
  onToggle,
  onMarkUnsaved,
  onCopy,
  onReset,
  isPalettePickerActive,
  onTogglePalettePicker,
  isComponentPickerActive,
  onToggleComponentPicker,
  onComponentScan,
  isComponentScanning,
}: ToolRouterProps) {
  if (!currentTool) {
    return <EmptyState />;
  }

  const toolProps = {
    isActive: currentTool ? (tools[currentTool] as { isActive?: boolean })?.isActive ?? false : false,
    onToggle: () => onToggle(currentTool),
    onMarkUnsaved: (hasChanges: boolean) => onMarkUnsaved(currentTool, hasChanges),
    onCopy,
    onReset: () => onReset(currentTool),
  };

  switch (currentTool) {
    case 'textEdit':
      return <TextEditPanel onToggle={toolProps.onToggle} onReset={toolProps.onReset} />;
    case 'screenshot':
      return <ScreenshotPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'cssScan':
      return (
        <div className="mt-6 -m-4">
          <WrapperResetBar onReset={toolProps.onReset} />
          <Suspense fallback={<ToolPanelLoading />}>
            <LazyCssScannerPanel data={toolData.cssScanResult} onToggle={toolProps.onToggle} onCopy={onCopy} />
          </Suspense>
        </div>
      );
    case 'ruler':
      return <RulerPanel onToggle={toolProps.onToggle} onReset={toolProps.onReset} />;
    case 'gridLayout':
      return <GridLayoutPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'fontAnalyzer':
      return <FontAnalyzerPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} toolData={toolData} />;
    case 'palette':
      return (
        <PalettePanel
          data={toolData.paletteResult}
          onCopy={onCopy}
          isPickerActive={isPalettePickerActive}
          onTogglePicker={onTogglePalettePicker}
        />
      );
    case 'assets':
      return <AssetPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'console':
      return <ConsolePanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'tailwind':
      return <TailwindPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'jsInspector':
      return <JSInspectorPanel data={toolData.jsInspectorResult} onCopy={onCopy} />;
    case 'resourceNetwork':
      return <ResourceNetworkPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'accessibilityChecker':
      return <AccessibilityPanelWrapper onReset={toolProps.onReset} onToggle={toolProps.onToggle} />;
    case 'componentInspector':
      return (
        <div className="mt-6 -m-4">
          <Suspense fallback={<ToolPanelLoading />}>
            <LazyComponentPanel
              data={toolData.componentScanResult}
              isPickerActive={isComponentPickerActive}
              onTogglePicker={onToggleComponentPicker}
              onRefresh={onComponentScan}
              isLoading={isComponentScanning}
            />
          </Suspense>
        </div>
      );
    default:
      return <EmptyState />;
  }
}

/**
 * 래퍼 패널 상단 리셋 바
 */
function WrapperResetBar({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end px-4 pt-3 pb-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onReset}
        title={t('common.reset')}
      >
        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

function WrapperToolHeader({
  toolName,
  onReset,
  onToggle,
}: {
  toolName: string;
  onReset: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {toolName}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onReset}
            title={t('common.reset')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
            {t('common.disable')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScreenshotPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.screenshot.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyCapturePanel />
      </Suspense>
    </div>
  );
}

// Grid Layout Panel Wrapper
function GridLayoutPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.gridLayout.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyGridLayoutPanel />
      </Suspense>
    </div>
  );
}

// Resource Network Panel
function ResourceNetworkPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.resourceNetwork.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyResourceNetworkPanel />
      </Suspense>
    </div>
  );
}

// Tailwind Panel Wrapper
function TailwindPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.tailwind.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyTailwindScannerPanel />
      </Suspense>
    </div>
  );
}

// Asset Panel Wrapper
function AssetPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.assets.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyAssetManagerPanel />
      </Suspense>
    </div>
  );
}

function FontAnalyzerPanelWrapper({
  onReset,
  onToggle,
  toolData,
}: {
  onReset: () => void;
  onToggle: () => void;
  toolData: ToolData;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.fontAnalyzer.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyFontAnalyzerPanel elementInfo={toolData.fontElementInfo} />
      </Suspense>
    </div>
  );
}

function AccessibilityPanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.accessibilityChecker.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazyAccessibilityPanel />
      </Suspense>
    </div>
  );
}

function ConsolePanelWrapper({ onReset, onToggle }: { onReset: () => void; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 -m-4">
      <WrapperToolHeader toolName={t('tools.console.name')} onReset={onReset} onToggle={onToggle} />
      <Suspense fallback={<ToolPanelLoading />}>
        <LazySidepanelConsolePanel />
      </Suspense>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 p-6 bg-card rounded-xl border border-border shadow-sm text-center">
      <div className="text-4xl mb-3">🔧</div>
      <h2 className="text-lg font-bold text-foreground mb-2">도구를 선택하세요</h2>
      <p className="text-sm text-muted-foreground">
        왼쪽 메뉴에서 사용할 도구를 선택하세요.
      </p>
    </div>
  );
}

/**
 * 공통 패널 헤더 (간단한 패널용)
 */
function ToolPanelHeader({
  toolName,
  onToggle,
  onReset,
}: {
  toolName: string;
  onToggle: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        {toolName}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onReset}
          title={t('common.reset')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
          {t('common.disable')}
        </Button>
      </div>
    </div>
  );
}

// Text Edit Panel
function TextEditPanel({ onToggle, onReset }: { onToggle: () => void; onReset: () => void }) {
  const { t } = useTranslation();

  const [fontOptions, setFontOptions] = useState<string[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>('');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('16');
  const [customFontSize, setCustomFontSize] = useState<string>('16');
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);

  const fallbackFontOptions = useMemo(
    () => ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Noto Sans KR', 'Nanum Gothic'],
    []
  );
  const fontSizeOptions = useMemo(() => ['12', '14', '16', '18', '20', '24', '28', '32', '40', '48'], []);

  const resolveTargetTabId = useCallback(async (): Promise<number | null> => {
    const currentWindow = await chrome.windows.getCurrent().catch(() => null);
    if (currentWindow?.id !== undefined) {
      const [targetTab] = await chrome.tabs.query({
        active: true,
        windowId: currentWindow.id,
      }).catch(() => [] as chrome.tabs.Tab[]);

      if (targetTab?.id) {
        return targetTab.id;
      }
    }

    const [fallbackTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    }).catch(() => [] as chrome.tabs.Tab[]);

    return fallbackTab?.id ?? null;
  }, []);

  const sendTextEditMessage = useCallback(async (action: string, data?: unknown) => {
    const tabId = await resolveTargetTabId();
    if (!tabId) {
      toast.error(t('errors.contentScriptTimeout'));
      return null;
    }

    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action,
        data,
      }) as {
        success?: boolean;
        error?: string;
        reason?: string;
        data?: unknown;
      };

      return response;
    } catch {
      toast.error(t('errors.contentScriptTimeout'));
      return null;
    }
  }, [resolveTargetTabId, t]);

  const loadFontOptions = useCallback(async () => {
    await Promise.resolve();
    setIsLoadingFonts(true);

    const response = await sendTextEditMessage('TEXT_EDIT_GET_FONT_OPTIONS');
    const payload = response?.data as TextEditFontOptionsResponse | undefined;

    if (!response?.success || !payload) {
      setFontOptions(fallbackFontOptions);
      setSelectedFont((prev) => (prev.length > 0 ? prev : fallbackFontOptions[0] ?? ''));
      toast.error(t('tools.textEdit.fontFetchFailed'));
      setIsLoadingFonts(false);
      return;
    }

    const nextFontOptions = payload.fonts.length > 0 ? payload.fonts : fallbackFontOptions;
    setFontOptions(nextFontOptions);

    if (typeof payload.currentFontSize === 'number' && Number.isFinite(payload.currentFontSize)) {
      const nextFontSize = Math.round(payload.currentFontSize).toString();
      setSelectedFontSize(nextFontSize);
      setCustomFontSize(nextFontSize);
    }

    setSelectedFont((prev) => {
      if (prev.length > 0 && nextFontOptions.includes(prev)) {
        return prev;
      }

      if (payload.currentFont && nextFontOptions.includes(payload.currentFont)) {
        return payload.currentFont;
      }

      return nextFontOptions[0] ?? '';
    });
    setIsLoadingFonts(false);
  }, [fallbackFontOptions, sendTextEditMessage, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFontOptions();
    });
  }, [loadFontOptions]);

  const applyFormat = useCallback(async (command: TextEditFormatCommand) => {
    const response = await sendTextEditMessage('TEXT_EDIT_APPLY_FORMAT', { command });
    if (!response?.success) {
      if (response?.reason === 'TEXT_EDIT_NO_SELECTION') {
        toast.error(t('tools.textEdit.selectionRequired'));
        return;
      }

      toast.error(t('tools.textEdit.formatApplyFailed'));
    }
  }, [sendTextEditMessage, t]);

  const applyFontFamily = useCallback(async (fontFamily: string) => {
    setSelectedFont(fontFamily);

    const response = await sendTextEditMessage('TEXT_EDIT_APPLY_FONT_FAMILY', { fontFamily });
    if (!response?.success) {
      if (response?.reason === 'TEXT_EDIT_NO_SELECTION') {
        toast.error(t('tools.textEdit.selectionRequired'));
        return;
      }

      toast.error(t('tools.textEdit.fontApplyFailed'));
    }
  }, [sendTextEditMessage, t]);

  const applyFontSize = useCallback(async (fontSize: string) => {
    const normalized = Number(fontSize.trim());

    if (!Number.isFinite(normalized) || normalized < 8 || normalized > 200) {
      toast.error(t('tools.textEdit.fontSizeInvalid'));
      return;
    }

    const nextFontSize = Math.round(normalized).toString();
    setSelectedFontSize(nextFontSize);
    setCustomFontSize(nextFontSize);

    const numericFontSize = Number(nextFontSize);
    const response = await sendTextEditMessage('TEXT_EDIT_APPLY_FONT_SIZE', { fontSize: numericFontSize });

    if (!response?.success) {
      if (response?.reason === 'TEXT_EDIT_NO_SELECTION') {
        toast.error(t('tools.textEdit.selectionRequired'));
        return;
      }

      if (response?.reason === 'TEXT_EDIT_INVALID_FONT_SIZE') {
        toast.error(t('tools.textEdit.fontSizeInvalid'));
        return;
      }

      toast.error(t('tools.textEdit.fontSizeApplyFailed'));
    }
  }, [sendTextEditMessage, t]);

  const styleButtons: Array<{
    key: TextEditFormatCommand;
    label: string;
    icon?: typeof Bold;
    marker?: string;
  }> = [
    { key: 'bold', label: t('tools.textEdit.bold'), icon: Bold },
    { key: 'italic', label: t('tools.textEdit.italic'), icon: Italic },
    { key: 'strikethrough', label: t('tools.textEdit.strikethrough'), icon: Strikethrough },
    { key: 'underline', label: t('tools.textEdit.underline'), marker: 'U' },
    { key: 'superscript', label: t('tools.textEdit.superscript'), marker: 'x^2' },
    { key: 'subscript', label: t('tools.textEdit.subscript'), marker: 'x_2' },
  ];

  return (
    <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4 space-y-4">
        <ToolPanelHeader
          toolName={t('tools.textEdit.name')}
          onToggle={onToggle}
          onReset={onReset}
        />
        <p className="text-sm text-muted-foreground">
          {t('tools.textEdit.panelHint')}
        </p>

        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {t('tools.textEdit.formatting')}
          </div>

          <div className="flex flex-wrap gap-2">
            {styleButtons.map(({ key, label, icon: Icon, marker }) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  void applyFormat(key);
                }}
              >
                {Icon ? (
                  <Icon className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-semibold leading-none">{marker}</span>
                )}
                <span>{label}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{t('tools.textEdit.fontFamily')}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  void loadFontOptions();
                }}
                disabled={isLoadingFonts}
              >
                {isLoadingFonts ? t('common.loading') : t('tools.textEdit.refreshFonts')}
              </Button>
            </div>

            <Select
              value={selectedFont}
              onValueChange={(fontFamily) => {
                void applyFontFamily(fontFamily);
              }}
              disabled={fontOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('tools.textEdit.fontPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((fontFamily) => (
                  <SelectItem key={fontFamily} value={fontFamily}>
                    <span style={{ fontFamily: `"${fontFamily}", sans-serif` }}>{fontFamily}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-foreground">{t('tools.textEdit.fontSize')}</span>
            <Select
              value={fontSizeOptions.includes(selectedFontSize) ? selectedFontSize : ''}
              onValueChange={(fontSize) => {
                void applyFontSize(fontSize);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('tools.textEdit.fontSizePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {fontSizeOptions.map((fontSize) => (
                  <SelectItem key={fontSize} value={fontSize}>
                    {fontSize}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={8}
                max={200}
                step={1}
                value={customFontSize}
                placeholder={t('tools.textEdit.fontSizeCustomPlaceholder')}
                onChange={(event) => {
                  setCustomFontSize(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void applyFontSize(customFontSize);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  void applyFontSize(customFontSize);
                }}
              >
                {t('tools.textEdit.applySize')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{t('tools.textEdit.fontSizeRangeHint')}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('tools.textEdit.selectionHint')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Ruler Panel
function RulerPanel({ onToggle, onReset }: { onToggle: () => void; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4">
        <ToolPanelHeader
          toolName={t('tools.ruler.name')}
          onToggle={onToggle}
          onReset={onReset}
        />
        <p className="text-sm text-muted-foreground">
          드래그하여 거리를 측정하세요.
        </p>
      </CardContent>
    </Card>
  );
}

function JSInspectorPanel({
  data,
  onCopy,
}: {
  data: JsInspectorResult | null;
  onCopy: (text: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();

  const listeners = data?.listeners ?? [];
  const selection = data?.selection;
  const sortedListeners = [...listeners].sort((a, b) => {
    const aHasOriginal = Boolean(a.originalScriptUrl);
    const bHasOriginal = Boolean(b.originalScriptUrl);
    if (aHasOriginal !== bHasOriginal) {
      return aHasOriginal ? -1 : 1;
    }

    const aVendor = /(jquery|slick)/i.test(`${a.scriptUrl ?? ''} ${a.originalScriptUrl ?? ''}`);
    const bVendor = /(jquery|slick)/i.test(`${b.scriptUrl ?? ''} ${b.originalScriptUrl ?? ''}`);
    if (aVendor !== bVendor) {
      return aVendor ? 1 : -1;
    }

    return 0;
  });

  return (
    <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t('tools.jsInspector.name')}
        </div>

        <p className="text-sm text-muted-foreground">
          {listeners.length === 0
            ? t('content.jsInspectorHint')
            : `${data?.totalListeners ?? 0} listeners • ${data?.targetCount ?? 0} nodes`}
        </p>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-semibold text-foreground">
            {t('content.jsInspectorDepthLabel', { depth: selection?.depth ?? 0 })}
          </div>
          <div className="text-xs text-muted-foreground">{t('content.jsInspectorDepthHint')}</div>
          {selection ? (
            <pre className="text-[11px] leading-4 text-foreground/90 font-mono whitespace-pre-wrap break-words">
              {(() => {
                const formatNode = (node: typeof selection.path[number]) => {
                  const firstClass = node.className?.split(/\s+/)[0];
                  return `${node.tagName}${node.id ? `#${node.id}` : ''}${firstClass ? `.${firstClass}` : ''}`;
                };

                const lines = selection.path.map((node, idx) => {
                  const label = formatNode(node);
                  if (idx === 0) {
                    return `self  ${label}`;
                  }

                  const indent = '  '.repeat(Math.max(0, idx - 1));
                  const isLast = idx === selection.path.length - 1;
                  const branch = isLast ? '`- ' : '|- ';
                  const suffix = isLast ? ' (anchor)' : '';
                  return `${indent}${branch}${node.relation}  ${label}${suffix}`;
                });

                return lines.join('\n');
              })()}
            </pre>
          ) : (
            <div className="text-[11px] text-muted-foreground">
              Click an element once to set the selection path.
            </div>
          )}
        </div>

        {listeners.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void onCopy(buildStructuredInspectorJson(data))}
            >
              Copy Structured JSON
            </Button>
          </div>
        ) : null}

        {Array.isArray(data?.warnings) && data.warnings.length > 0 ? (
          <div className="rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            {data.warnings.map((warning) => (
              <div key={warning}>- {warning}</div>
            ))}
          </div>
        ) : null}

        <ScrollArea className="h-[360px] pr-3">
          <div className="space-y-3">
            {listeners.length === 0 ? (
              <div className="text-xs text-muted-foreground rounded-lg border border-border p-3">
                Select an element from the page to inspect attached event handlers.
              </div>
            ) : (
              sortedListeners.slice(0, 40).map((listener) => {
                const locationSnippet = listener.scriptSnippet ?? '';
                const originalSnippet = listener.originalSnippet ?? '';
                const handlerSource = listener.handlerSource ?? '';
                const fingerprint = createListenerFingerprint(listener);
                const summaryLine = summarizeListenerForBadge(listener);
                const tags = buildListenerTags(listener);
                const generatedLocation = [
                  listener.scriptUrl,
                  listener.scriptId,
                  listener.lineNumber ? `L${listener.lineNumber}` : null,
                  listener.columnNumber ? `C${listener.columnNumber}` : null,
                ]
                  .filter((item) => typeof item === 'string' && item.length > 0)
                  .join(' · ');

                const originalLocation = [
                  listener.originalScriptUrl,
                  listener.originalLineNumber ? `L${listener.originalLineNumber}` : null,
                  listener.originalColumnNumber ? `C${listener.originalColumnNumber}` : null,
                ]
                  .filter((item) => typeof item === 'string' && item.length > 0)
                  .join(' · ');

                const sourceSnippet = originalSnippet || locationSnippet;

                const hasLocationSnippet = locationSnippet.trim().length > 0;
                const hasOriginalSnippet = originalSnippet.trim().length > 0;
                const hasHandlerSource = handlerSource.trim().length > 0;
                const hasAnySource = hasOriginalSnippet || hasLocationSnippet || hasHandlerSource;

                const isVendor = /(jquery|slick)/i.test(`${listener.scriptUrl ?? ''} ${listener.originalScriptUrl ?? ''}`);

                return (
                  <div key={listener.id} className={`rounded-lg border border-border bg-card p-3 space-y-2 ${isVendor ? 'opacity-80' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={listener.isInlineHandler ? 'destructive' : 'secondary'}>
                          {listener.isInlineHandler ? 'inline' : 'listener'}
                        </Badge>
                        <Badge variant="outline">{listener.eventType}</Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">{fingerprint}</Badge>
                        <span className="text-muted-foreground">{listener.relation}</span>
                      </div>
                      {hasAnySource ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => void onCopy(sourceSnippet || handlerSource)}
                          >
                            {t('common.copy')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => void onCopy(buildStructuredListenerJson(listener))}
                          >
                            JSON
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="text-xs text-muted-foreground break-all">{listener.selector}</div>
                    <div className="text-[11px] text-muted-foreground break-all">{summaryLine}</div>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 10).map((tag) => (
                          <Badge key={`${listener.id}:${tag}`} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {originalLocation.length > 0 ? (
                      <div className="text-[11px] text-foreground break-all">
                        Original: {originalLocation}
                      </div>
                    ) : null}
                    {generatedLocation.length > 0 ? (
                      <div className="text-[11px] text-muted-foreground break-all">
                        Generated: {generatedLocation}
                      </div>
                    ) : null}

                    {(hasOriginalSnippet || hasLocationSnippet) ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-foreground">
                          {hasOriginalSnippet ? 'Original source snippet' : 'Source snippet'}
                        </div>
                        <pre className="text-[11px] rounded-md bg-muted p-2 overflow-x-auto whitespace-pre-wrap break-words">
                          {sourceSnippet}
                        </pre>
                      </div>
                    ) : null}

                    {hasHandlerSource && handlerSource !== locationSnippet ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-foreground">Handler source</div>
                        <pre className="text-[11px] rounded-md bg-muted p-2 overflow-x-auto whitespace-pre-wrap break-words">
                          {handlerSource}
                        </pre>
                      </div>
                    ) : null}

                    {!hasAnySource ? (
                      <div className="text-[11px] text-muted-foreground">No source extracted for this listener.</div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Palette Panel
function PalettePanel({
  data,
  onCopy,
  isPickerActive,
  onTogglePicker,
}: {
  data: string[];
  onCopy: (text: string) => Promise<void> | void;
  isPickerActive?: boolean;
  onTogglePicker?: () => void;
}) {
  const { t } = useTranslation();

  const handleCopyColor = async (color: string) => {
    try {
      await onCopy(color);
      toast.success(t('content.colorCopied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

  return (
    <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4">
        {/* 피커 모드 툴바 */}
        <div className="flex items-center gap-2 mb-3">
          {onTogglePicker && (
            <Button
              variant={isPickerActive ? 'default' : 'outline'}
              size="sm"
              onClick={onTogglePicker}
              className="gap-1"
            >
              <PaintBucket className="w-4 h-4" />
              {isPickerActive ? t('tools.palette.pickerOff') : t('tools.palette.pickerMode')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t('tools.palette.name')}
        </div>
        <ScrollArea className="h-[300px] pr-4">
          <div className="grid grid-cols-4 gap-2">
            {data.length === 0 && <div className="col-span-4 text-muted-foreground text-xs">색상을 분석 중입니다...</div>}
            {data.map((color, i) => (
              <div key={i} className="space-y-1">
                <Button
                  variant="outline"
                  className="w-full aspect-square p-0 relative group hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => void handleCopyColor(color)}
                  title={color}
                >
                  <span className="sr-only">{color}</span>
                </Button>
                <Badge variant="secondary" className="text-[9px] w-full justify-center py-0">
                  {color}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
