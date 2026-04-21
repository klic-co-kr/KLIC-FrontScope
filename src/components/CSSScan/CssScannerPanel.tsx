/**
 * CSS Scanner Panel Component
 *
 * 클릭한 요소의 전체 CSS 스타일을 카테고리별로 표시하는 데이터 기반 패널
 * 기본적으로 브라우저 기본값과 다른 (실제 적용된) 속성만 표시
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CssScanToolData, CSSRule as CssScanRule } from '../../types/cssScan';
import { CSS_PROPERTY_CATEGORIES } from '../../constants/cssScanDefaults';
import { BoxModelViewer } from './BoxModelViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Check } from 'lucide-react';

export interface CssScannerPanelProps {
  data: CssScanToolData | null;
  onToggle: () => void;
  onCopy: (text: string) => void;
}

const VENDOR_PREFIXES = ['-webkit-', '-moz-', '-ms-', '-o-'];

const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|lab\(|lch\()/i;

/** Extended category definitions for the panel */
const PANEL_CATEGORIES: Record<string, readonly string[]> = {
  ...CSS_PROPERTY_CATEGORIES,
  cssVariables: [],
};

/** i18n key mapping for category labels */
const CATEGORY_I18N_KEYS: Record<string, string> = {
  layout: 'cssScan.categoryLayout',
  typography: 'cssScan.categoryTypography',
  color: 'cssScan.categoryColor',
  background: 'cssScan.categoryBackground',
  border: 'cssScan.categoryBorder',
  spacing: 'cssScan.categorySpacing',
  size: 'cssScan.categorySize',
  flexbox: 'cssScan.categoryFlexbox',
  grid: 'cssScan.categoryGrid',
  animation: 'cssScan.categoryAnimation',
  effect: 'cssScan.categoryEffect',
  cssVariables: 'cssScan.categoryCssVariables',
};

function isVendorPrefixed(prop: string): boolean {
  return VENDOR_PREFIXES.some(prefix => prop.startsWith(prefix));
}

function isColorValue(value: string): boolean {
  return COLOR_PATTERN.test(value.trim());
}

function categorizeProperty(prop: string): string | null {
  for (const [category, props] of Object.entries(CSS_PROPERTY_CATEGORIES)) {
    if ((props as readonly string[]).some(p => prop === p || prop.startsWith(p + '-'))) {
      return category;
    }
  }
  return null;
}

export function CssScannerPanel({ data, onToggle, onCopy }: CssScannerPanelProps) {
  const { t } = useTranslation();
  const [hideVendorPrefix, setHideVendorPrefix] = useState(true);
  const [hideInherited, setHideInherited] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = useCallback((value: string, key: string) => {
    onCopy(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }, [onCopy]);

  /** Filter computed styles based on toggle state */
  const filteredStyles = useMemo(() => {
    if (!data) return {};

    const source = showAll ? data.allComputedStyles : data.computedStyles;
    const result: Record<string, string> = {};

    for (const [prop, value] of Object.entries(source)) {
      if (prop.startsWith('--')) continue;
      if (hideVendorPrefix && isVendorPrefixed(prop)) continue;
      if (hideInherited && prop in data.inheritedProperties) continue;
      result[prop] = value;
    }

    return result;
  }, [data, hideVendorPrefix, hideInherited, showAll]);

  /** Group styles by category */
  const categorizedStyles = useMemo(() => {
    const groups: Record<string, Array<{ prop: string; value: string }>> = {};

    for (const category of Object.keys(PANEL_CATEGORIES)) {
      groups[category] = [];
    }
    groups['other'] = [];

    for (const [prop, value] of Object.entries(filteredStyles)) {
      const category = categorizeProperty(prop);
      if (category && groups[category]) {
        groups[category].push({ prop, value });
      } else {
        groups['other'].push({ prop, value });
      }
    }

    return groups;
  }, [filteredStyles]);

  const totalCount = useMemo(() => Object.keys(filteredStyles).length, [filteredStyles]);

  if (!data) {
    return (
      <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {t('tools.cssScan.name')}
              </div>
            <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
              {t('common.disable')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('cssScan.clickToInspect')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const elementLabel = [
    data.element.tagName,
    data.element.id ? `#${data.element.id}` : '',
    ...data.element.classes.slice(0, 3).map(c => `.${c}`),
  ].join('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t('tools.cssScan.name')}
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
            {t('common.disable')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded truncate max-w-[200px]">
            {elementLabel}
          </code>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {data.element.dimensions.width} x {data.element.dimensions.height}
          </Badge>
        </div>
      </div>

      {/* Filter toggles */}
      <div className="px-4 py-2 bg-card border-b border-border space-y-1.5">
        <FilterToggle
          label={t('cssScan.hideVendorPrefix')}
          checked={hideVendorPrefix}
          onCheckedChange={setHideVendorPrefix}
        />
        <FilterToggle
          label={t('cssScan.hideInherited')}
          checked={hideInherited}
          onCheckedChange={setHideInherited}
        />
        <FilterToggle
          label={t('cssScan.showAll')}
          checked={showAll}
          onCheckedChange={setShowAll}
        />
        <div className="text-[10px] text-muted-foreground pt-0.5">
          {totalCount} {t('cssScan.properties')}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="styles" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-card px-4 h-9">
          <TabsTrigger value="styles" className="text-xs">{t('cssScan.tabStyles')}</TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">{t('cssScan.tabRules')}</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">{t('cssScan.tabInfo')}</TabsTrigger>
        </TabsList>

        {/* Styles Tab */}
        <TabsContent value="styles" className="mt-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="p-4 space-y-3">
              <BoxModelViewer boxModel={data.boxModel} />
              <Separator />

              <Accordion type="multiple" defaultValue={['size', 'spacing', 'typography', 'layout', 'color']}>
                {Object.entries(PANEL_CATEGORIES).map(([category]) => {
                  if (category === 'cssVariables') {
                    if (!data.cssVariables || data.cssVariables.length === 0) return null;
                    return (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="text-xs font-semibold py-2">
                          <span className="flex items-center gap-2">
                            {t(CATEGORY_I18N_KEYS[category] || category)}
                            <Badge variant="secondary" className="text-[9px] py-0">
                              {data.cssVariables.length}
                            </Badge>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-0.5">
                            {data.cssVariables.map((v) => (
                              <PropertyRow
                                key={v.name}
                                prop={v.name}
                                value={v.value}
                                copyKey={`var-${v.name}`}
                                copiedKey={copiedKey}
                                onCopy={handleCopyValue}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }

                  const items = categorizedStyles[category] || [];
                  if (items.length === 0) return null;

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="text-xs font-semibold py-2">
                        <span className="flex items-center gap-2">
                          {t(CATEGORY_I18N_KEYS[category] || category)}
                          <Badge variant="secondary" className="text-[9px] py-0">
                            {items.length}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-0.5">
                          {items.map(({ prop, value }) => (
                            <PropertyRow
                              key={prop}
                              prop={prop}
                              value={value}
                              copyKey={`style-${prop}`}
                              copiedKey={copiedKey}
                              onCopy={handleCopyValue}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}

                {categorizedStyles['other'] && categorizedStyles['other'].length > 0 && (
                  <AccordionItem value="other">
                    <AccordionTrigger className="text-xs font-semibold py-2">
                      <span className="flex items-center gap-2">
                        {t('cssScan.other')}
                        <Badge variant="secondary" className="text-[9px] py-0">
                          {categorizedStyles['other'].length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-0.5">
                        {categorizedStyles['other'].map(({ prop, value }) => (
                          <PropertyRow
                            key={prop}
                            prop={prop}
                            value={value}
                            copyKey={`other-${prop}`}
                            copiedKey={copiedKey}
                            onCopy={handleCopyValue}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="p-4 space-y-4">
              {data.matchedRules.length > 0 && (
                <RulesSection
                  title={t('cssScan.matchedRules')}
                  rules={data.matchedRules}
                  copiedKey={copiedKey}
                  onCopy={handleCopyValue}
                />
              )}

              {data.pseudoClassRules.length > 0 && (
                <>
                  <Separator />
                  <RulesSection
                    title={t('cssScan.pseudoClassRules')}
                    rules={data.pseudoClassRules}
                    copiedKey={copiedKey}
                    onCopy={handleCopyValue}
                  />
                </>
              )}

              {Object.keys(data.inlineStyles).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('cssScan.inlineStyles')}</h4>
                    <div className="space-y-0.5">
                      {Object.entries(data.inlineStyles).map(([prop, value]) => (
                        <PropertyRow
                          key={prop}
                          prop={prop}
                          value={value}
                          copyKey={`inline-${prop}`}
                          copiedKey={copiedKey}
                          onCopy={handleCopyValue}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {data.matchedRules.length === 0 && data.pseudoClassRules.length === 0 && Object.keys(data.inlineStyles).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">{t('cssScan.noRulesFound')}</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="p-4 space-y-4">
              {data.font && (
                <Card>
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('cssScan.font')}</h4>
                    <div className="space-y-1 text-xs">
                      <InfoRow label={t('cssScan.fontFamily')} value={data.font.family} onCopy={() => handleCopyValue(data.font!.family, 'font-family')} />
                      <InfoRow label={t('cssScan.fontSize')} value={`${data.font.size}${data.font.sizeUnit}`} onCopy={() => handleCopyValue(`${data.font!.size}${data.font!.sizeUnit}`, 'font-size')} />
                      <InfoRow label={t('cssScan.fontWeight')} value={String(data.font.weight)} onCopy={() => handleCopyValue(String(data.font!.weight), 'font-weight')} />
                      <InfoRow label={t('cssScan.fontStyle')} value={data.font.style} onCopy={() => handleCopyValue(data.font!.style, 'font-style')} />
                      <InfoRow label={t('cssScan.lineHeight')} value={String(data.font.lineHeight)} onCopy={() => handleCopyValue(String(data.font!.lineHeight), 'font-lh')} />
                      <InfoRow label={t('cssScan.letterSpacing')} value={data.font.letterSpacing} onCopy={() => handleCopyValue(data.font!.letterSpacing, 'font-ls')} />
                    </div>
                    <div
                      className="mt-2 p-2 bg-muted rounded text-sm"
                      style={{
                        fontFamily: data.font.family,
                        fontSize: `${data.font.size}${data.font.sizeUnit}`,
                        fontWeight: Number(data.font.weight) || data.font.weight as string,
                        fontStyle: data.font.style,
                        lineHeight: data.font.lineHeight,
                      }}
                    >
                      {t('cssScan.fontPreview')}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.colors.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('cssScan.colors')}</h4>
                    <div className="space-y-2">
                      {data.colors.map((color, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-border shrink-0"
                            style={{ backgroundColor: color.hex || color.rgb }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground">{color.property}</div>
                            <button
                              onClick={() => handleCopyValue(color.hex, `color-${i}`)}
                              className="text-xs font-mono text-foreground hover:text-primary transition-colors"
                            >
                              {color.hex}
                            </button>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-[9px] py-0 cursor-pointer" onClick={() => handleCopyValue(color.rgb, `rgb-${i}`)}>
                              RGB
                            </Badge>
                            <Badge variant="outline" className="text-[9px] py-0 cursor-pointer" onClick={() => handleCopyValue(color.hsl, `hsl-${i}`)}>
                              HSL
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.flexInfo && (
                <Card>
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('cssScan.flexbox')}</h4>
                    <div className="space-y-1 text-xs">
                      <InfoRow label={t('cssScan.direction')} value={data.flexInfo.direction} onCopy={() => handleCopyValue(data.flexInfo!.direction, 'flex-dir')} />
                      <InfoRow label={t('cssScan.wrap')} value={data.flexInfo.wrap} onCopy={() => handleCopyValue(data.flexInfo!.wrap, 'flex-wrap')} />
                      <InfoRow label={t('cssScan.justify')} value={data.flexInfo.justifyContent} onCopy={() => handleCopyValue(data.flexInfo!.justifyContent, 'flex-jc')} />
                      <InfoRow label={t('cssScan.align')} value={data.flexInfo.alignItems} onCopy={() => handleCopyValue(data.flexInfo!.alignItems, 'flex-ai')} />
                      <InfoRow label={t('cssScan.gap')} value={data.flexInfo.gap} onCopy={() => handleCopyValue(data.flexInfo!.gap, 'flex-gap')} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.gridInfo && (
                <Card>
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('cssScan.grid')}</h4>
                    <div className="space-y-1 text-xs">
                      <InfoRow label={t('cssScan.columns')} value={data.gridInfo.templateColumns} onCopy={() => handleCopyValue(data.gridInfo!.templateColumns, 'grid-cols')} />
                      <InfoRow label={t('cssScan.rows')} value={data.gridInfo.templateRows} onCopy={() => handleCopyValue(data.gridInfo!.templateRows, 'grid-rows')} />
                      <InfoRow label={t('cssScan.areas')} value={data.gridInfo.templateAreas} onCopy={() => handleCopyValue(data.gridInfo!.templateAreas, 'grid-areas')} />
                      <InfoRow label={t('cssScan.autoFlow')} value={data.gridInfo.autoFlow} onCopy={() => handleCopyValue(data.gridInfo!.autoFlow, 'grid-flow')} />
                      <InfoRow label={t('cssScan.gap')} value={data.gridInfo.gap} onCopy={() => handleCopyValue(data.gridInfo!.gap, 'grid-gap')} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilterToggle({ label, checked, onCheckedChange }: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="scale-75" />
    </div>
  );
}

function PropertyRow({ prop, value, copyKey, copiedKey, onCopy }: {
  prop: string;
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  const isCopied = copiedKey === copyKey;

  return (
    <div className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-muted/50 group text-[11px]">
      <span className="text-muted-foreground shrink-0 min-w-[120px] truncate font-mono">{prop}</span>
      <span className="text-muted-foreground shrink-0">:</span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {isColorValue(value) && (
          <span
            className="w-3 h-3 rounded-sm border border-border shrink-0 inline-block"
            style={{ backgroundColor: value }}
          />
        )}
        <button
          onClick={() => onCopy(`${prop}: ${value}`, copyKey)}
          className="text-foreground font-mono truncate text-left hover:text-primary transition-colors"
          title={value}
        >
          {value}
        </button>
      </div>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </span>
    </div>
  );
}

function RulesSection({ title, rules, copiedKey, onCopy }: {
  title: string;
  rules: CssScanRule[];
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground mb-2">{title}</h4>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={`${rule.selector}-${i}`} className="border border-border rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1.5">
              <code className="text-[11px] font-mono text-primary font-semibold truncate">{rule.selector}</code>
              <Badge variant="secondary" className="text-[9px] py-0 shrink-0">
                {rule.selectorType}
              </Badge>
              {rule.specificity > 0 && (
                <Badge variant="outline" className="text-[9px] py-0 shrink-0">
                  {rule.specificity}
                </Badge>
              )}
            </div>
            {rule.stylesheetUrl && (
              <div className="text-[10px] text-muted-foreground truncate mb-1">{rule.stylesheetUrl}</div>
            )}
            <div className="space-y-0.5">
              {rule.declarations.map((decl) => (
                <PropertyRow
                  key={`${rule.selector}-${decl.property}`}
                  prop={decl.property}
                  value={decl.important ? `${decl.value} !important` : decl.value}
                  copyKey={`rule-${i}-${decl.property}`}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy }: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <button
        onClick={onCopy}
        className="font-mono text-foreground hover:text-primary transition-colors truncate max-w-[160px] text-right"
        title={value}
      >
        {value}
      </button>
    </div>
  );
}

export default CssScannerPanel;
