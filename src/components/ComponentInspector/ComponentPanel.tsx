/**
 * ComponentPanel - 컴포넌트 인스펙터 패널
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Search, RefreshCw, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ComponentScanResult, ComponentInfo, ComponentType } from '@/types/component';
import { ComponentItem } from './ComponentItem';

export interface ComponentPanelProps {
  data: ComponentScanResult | null;
  isLoading?: boolean;
  onRefresh?: (options?: { frameworkOnly?: boolean }) => void;
  onTogglePicker?: () => void;
  isPickerActive?: boolean;
}

const TYPE_COLORS: Record<ComponentType, string> = {
  react: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  vue: 'bg-green-500/10 text-green-600 border-green-500/20',
  angular: 'bg-red-500/10 text-red-600 border-red-500/20',
  svelte: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'web-component': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  html: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function ComponentPanel({
  data,
  isLoading,
  onRefresh,
  onTogglePicker,
  isPickerActive,
}: ComponentPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ComponentType | 'all'>('all');
  const [includeHtml, setIncludeHtml] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<ComponentType>>(
    new Set(['react', 'vue', 'angular', 'svelte', 'web-component'])
  );

  const handleRefresh = () => onRefresh?.({ frameworkOnly: !includeHtml });

  const handleToggleHtml = () => {
    const next = !includeHtml;
    setIncludeHtml(next);
    onRefresh?.({ frameworkOnly: !next });
  };

  // 필터링된 컴포넌트 목록
  const filteredComponents = useMemo(() => {
    if (!data?.components) return [];

    let result = data.components;

    // 타입 필터
    if (filterType !== 'all') {
      result = result.filter((c) => c.type === filterType);
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.selector.toLowerCase().includes(query) ||
          c.tagName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data?.components, filterType, searchQuery]);

  // 타입별 그룹화
  const groupedComponents = useMemo(() => {
    const groups: Record<ComponentType, ComponentInfo[]> = {
      react: [],
      vue: [],
      angular: [],
      svelte: [],
      'web-component': [],
      html: [],
    };

    for (const component of filteredComponents) {
      groups[component.type].push(component);
    }

    return groups;
  }, [filteredComponents]);

  // 타입 토글
  const toggleType = (type: ComponentType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // 감지된 타입 목록
  const detectedTypes = useMemo(() => {
    if (!data?.components) return [];
    const types = new Set(data.components.map((c) => c.type));
    return Array.from(types);
  }, [data?.components]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Layers className="w-12 h-12 mb-4 opacity-50" />
        <p>{t('componentInspector.noData', '컴포넌트를 스캔하세요')}</p>
        <Button onClick={onTogglePicker} className="mt-4" variant="outline">
          {t('componentInspector.startPicker', '피커 시작')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4 mt-6">
      {/* 헤더 */}
      <div className="p-4 border-b border-border space-y-3">
        {/* 프레임워크 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.framework}
              {data.metaFramework && ` / ${data.metaFramework}`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {data.components.length}개 컴포넌트
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isLoading}
              title={t('componentInspector.refresh', '새로고침')}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              size="sm"
              variant={isPickerActive ? 'default' : 'outline'}
              onClick={onTogglePicker}
            >
              <Layers className="w-4 h-4 mr-1" />
              {isPickerActive
                ? t('componentInspector.pickerOff', '피커 끄기')
                : t('componentInspector.pickerOn', '피커 켜기')}
            </Button>
          </div>
        </div>

        {/* 검색 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('componentInspector.searchPlaceholder', '컴포넌트 검색...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as ComponentType | 'all')}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('componentInspector.allTypes', '전체')}</SelectItem>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="angular">Angular</SelectItem>
              <SelectItem value="svelte">Svelte</SelectItem>
              <SelectItem value="web-component">Web Components</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* HTML 포함 토글 */}
        <button
          onClick={handleToggleHtml}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
            includeHtml
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className={cn(
            'w-3 h-3 rounded-sm border',
            includeHtml ? 'bg-primary border-primary' : 'border-muted-foreground/40'
          )} />
          {t('componentInspector.includeHtml', 'HTML 요소 포함')}
        </button>
      </div>

      {/* 컴포넌트 목록 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {detectedTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('componentInspector.noResults', '검색 결과 없음')}
            </div>
          )}

          {detectedTypes.map((type) => {
            const components = groupedComponents[type];
            if (components.length === 0) return null;

            const isExpanded = expandedTypes.has(type);
            const count = components.length;

            return (
              <div key={type} className="mb-2">
                {/* 타입 헤더 */}
                <button
                  onClick={() => toggleType(type)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-muted/50'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Badge className={cn('text-xs', TYPE_COLORS[type])}>
                    {type}
                  </Badge>
                  <span className="text-muted-foreground text-xs">({count})</span>
                </button>

                {/* 컴포넌트 목록 */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {components.slice(0, 50).map((component) => (
                      <ComponentItem key={component.id} component={component} />
                    ))}
                    {components.length > 50 && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        +{components.length - 50}개 더 있음
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* 푸터 통계 */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>
            {t('componentInspector.totalElements', '전체 요소')}: {data.totalElements}
          </span>
          <span>
            {t('componentInspector.scannedAt', '스캔 시간')}:{' '}
            {new Date(data.scannedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
