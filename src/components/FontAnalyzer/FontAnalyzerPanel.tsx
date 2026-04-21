/**
 * Font Analyzer Main Panel Component
 *
 * 폰트 분석기 메인 패널 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useFontAnalysis,
  usePageFonts,
  useFontSettings,
  useFontOptimization,
} from '../../hooks/fontAnalyzer';

export interface FontAnalyzerPanelProps {
  className?: string;
  elementInfo?: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    color: string;
    backgroundColor: string;
    element: {
      tag: string;
      id?: string;
      classList: string[];
      selector: string;
    };
  } | null;
}

export const FontAnalyzerPanel: React.FC<FontAnalyzerPanelProps> = ({
  className = '',
  elementInfo = null,
}) => {
  const { t } = useTranslation();
  useFontSettings();
  const { isAnalyzing, result, analyze, clearResult } = useFontAnalysis();
  const { fonts: pageFonts, isLoading: isLoadingFonts } = usePageFonts();
  const { score, issues, recommendations } = useFontOptimization();

  // Use analyzed fonts if available, otherwise use page fonts
  const fonts = result?.fonts || pageFonts;
  const isLoading = isAnalyzing || isLoadingFonts;

  const [activeTab, setActiveTab] = useState<'overview' | 'fonts' | 'inspector' | 'optimization'>('overview');
  const [previewSize, setPreviewSize] = useState(16);
  const [pageInfo, setPageInfo] = useState({
    hostname: '-',
    title: '-',
  });
  const parsedFontWeight = Number.parseInt(elementInfo?.fontWeight ?? '', 10);
  const previewBoxWidth = Math.max(56, Math.min(144, Math.round(previewSize * 3)));
  const previewBoxHeight = Math.max(48, Math.min(96, Math.round(previewSize * 2)));
  const useStackedPreviewLayout = previewSize >= 38;

  const isValidTab = (value: string): value is 'overview' | 'fonts' | 'inspector' | 'optimization' => (
    value === 'overview' || value === 'fonts' || value === 'inspector' || value === 'optimization'
  );

  const handleAnalyze = async () => {
    await analyze();
  };

  useEffect(() => {
    let cancelled = false;

    const parseHostname = (url?: string) => {
      if (!url) return '';
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    };

    const fallbackHostname = parseHostname(result?.url) || '-';
    const fallbackTitle = result?.title?.trim() || '-';

    const loadActiveTabInfo = async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        const [targetTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
        if (cancelled) return;

        const hostname = parseHostname(targetTab?.url) || fallbackHostname;
        const title = targetTab?.title?.trim() || fallbackTitle;

        setPageInfo({
          hostname,
          title,
        });
      } catch {
        if (!cancelled) {
          setPageInfo({
            hostname: fallbackHostname,
            title: fallbackTitle,
          });
        }
      }
    };

    void loadActiveTabInfo();

    return () => {
      cancelled = true;
    };
  }, [result?.title, result?.url]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-end p-4 border-b border-border">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? t('fontAnalyzer.analyzing') : t('fontAnalyzer.analyzePage')}
          </Button>
          {result && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearResult}
            >
              {t('common.clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isValidTab(value)) {
            setActiveTab(value);
          }
        }}
        className="px-4"
      >
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('fontAnalyzer.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="fonts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('fontAnalyzer.tabs.fonts')} ({fonts.length})
          </TabsTrigger>
          <TabsTrigger value="inspector" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('fontAnalyzer.tabs.fontInspector')}
          </TabsTrigger>
          <TabsTrigger value="optimization" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('fontAnalyzer.tabs.optimization')}
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Score Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${getScoreBorderColor(score)}`}
                    >
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {t('fontAnalyzer.fontScore')}
                      </span>
                    </div>
                    <div className="flex-1 flex gap-4">
                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold">{fonts.length}</div>
                        <div className="text-xs text-muted-foreground">{t('fontAnalyzer.fontFamilies')}</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold">
                          {fonts.reduce((sum, f) => sum + f.count, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t('fontAnalyzer.totalUses')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {(recommendations.length > 0 || issues.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('fontAnalyzer.recommendations')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100">
                          {rec}
                        </li>
                      ))}
                      {issues.map((issue, i) => (
                        <li key={i} className="text-sm p-2 rounded bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('fontAnalyzer.pageStatistics')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-lg">📄</span>
                    <div className="flex-1">
                      <div className="text-muted-foreground">{t('fontAnalyzer.url')}</div>
                      <div className="font-medium">{pageInfo.hostname}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-lg">🔤</span>
                    <div className="flex-1">
                      <div className="text-muted-foreground">{t('fontAnalyzer.title')}</div>
                      <div className="font-medium truncate">{pageInfo.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('fontAnalyzer.allFontsOnPage')}</h3>
                <Badge variant="secondary">{fonts.length} {t('fontAnalyzer.fontFamilies')}</Badge>
              </div>

              {/* Preview Size Control */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {t('fontAnalyzer.previewSize')}:
                    </span>
                    <Slider
                      value={[previewSize]}
                      onValueChange={([v]) => setPreviewSize(typeof v === 'number' ? v : 16)}
                      min={10}
                      max={72}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-right">{previewSize}px</span>
                  </div>
                </CardContent>
              </Card>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('fontAnalyzer.loadingFonts')}</div>
              ) : fonts.length === 0 && result ? (
                <div className="text-center py-8 text-muted-foreground">{t('fontAnalyzer.noFontsFound')}</div>
              ) : fonts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('fontAnalyzer.readyToAnalyze')}</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {fonts.map((font, index) => (
                      <Card key={index} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className={`flex gap-3 ${useStackedPreviewLayout ? 'flex-col items-start' : 'items-start'}`}>
                          <div
                            className="flex items-center justify-center border rounded bg-background shrink-0 overflow-hidden"
                            style={{
                              width: `${previewBoxWidth}px`,
                              height: `${previewBoxHeight}px`,
                              fontFamily: font.family,
                              fontSize: `${previewSize}px`,
                            }}
                          >
                            <span className="leading-none whitespace-nowrap">가나다</span>
                          </div>
                          <div className={useStackedPreviewLayout ? 'w-full min-w-0' : 'flex-1 min-w-0'}>
                            <div className="font-medium text-sm truncate">{font.family}</div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{font.count} {t('fontAnalyzer.uses')}</span>
                              <Badge variant="outline" className="text-xs">{font.category}</Badge>
                            </div>
                            {font.variants && font.variants.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {font.variants.slice(0, 5).map((variant, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {variant}
                                  </Badge>
                                ))}
                                {font.variants.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{font.variants.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('fontAnalyzer.inspectorHint')}
              </p>
              {elementInfo ? (
                <div className="space-y-4">
                  {/* Element Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('fontAnalyzer.element')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.tag')}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {elementInfo.element.tag}
                        </span>
                      </div>
                      {elementInfo.element.id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('fontAnalyzer.id')}:</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            #{elementInfo.element.id}
                          </span>
                        </div>
                      )}
                      {elementInfo.element.classList.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('fontAnalyzer.classes')}:</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-right truncate max-w-[200px]">
                            {elementInfo.element.classList.slice(0, 3).map(c => `.${c}`).join(' ')}
                            {elementInfo.element.classList.length > 3 && ' ...'}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Font Properties */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('fontAnalyzer.fontProperties')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.fontFamily')}:</span>
                        <span className="font-medium" style={{ fontFamily: elementInfo.fontFamily }}>
                          {elementInfo.fontFamily.split(',')[0].replace(/['"]/g, '')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.fontSize')}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{elementInfo.fontSize}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.fontWeight')}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{elementInfo.fontWeight}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.lineHeight')}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{elementInfo.lineHeight}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.letterSpacing')}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{elementInfo.letterSpacing}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('fontAnalyzer.colors')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('fontAnalyzer.color')}:</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-border"
                            style={{ backgroundColor: elementInfo.color }}
                          />
                          <span className="font-mono text-xs">{elementInfo.color}</span>
                        </div>
                      </div>
                      {elementInfo.backgroundColor && elementInfo.backgroundColor !== 'rgba(0, 0, 0, 0)' && elementInfo.backgroundColor !== 'transparent' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('fontAnalyzer.background')}:</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: elementInfo.backgroundColor }}
                            />
                            <span className="font-mono text-xs">{elementInfo.backgroundColor}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('fontAnalyzer.preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div
                        className="text-center p-4 rounded-lg border border-border bg-background"
                        style={{
                          fontFamily: elementInfo.fontFamily,
                          fontSize: elementInfo.fontSize,
                          fontWeight: Number.isNaN(parsedFontWeight) ? undefined : parsedFontWeight,
                          lineHeight: parseFloat(elementInfo.lineHeight),
                          letterSpacing: elementInfo.letterSpacing,
                          color: elementInfo.color,
                          backgroundColor: elementInfo.backgroundColor === 'rgba(0, 0, 0, 0)' || elementInfo.backgroundColor === 'transparent' ? undefined : elementInfo.backgroundColor,
                        }}
                      >
                        가나다라 ABC abc 123
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>{t('fontAnalyzer.inspectorPlaceholder')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('fontAnalyzer.optimizationScore')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex justify-center">
                    <div
                      className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${getScoreBorderColor(score)}`}
                    >
                      <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('fontAnalyzer.issuesFound')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-2">
                      {issues.map((issue, i) => (
                        <li key={i} className="text-sm p-2 rounded bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('fontAnalyzer.recommendations')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {result
          ? `${t('fontAnalyzer.analyzed')}: ${new Date(result.timestamp).toLocaleString()}`
          : t('fontAnalyzer.readyToAnalyze')
        }
      </div>
    </div>
  );
};

export default FontAnalyzerPanel;
