/**
 * ComponentItem - 개별 컴포넌트 표시
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Copy, ExternalLink, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentInfo } from '@/types/component';

interface ComponentItemProps {
  component: ComponentInfo;
  depth?: number;
}

export function ComponentItem({ component, depth = 0 }: ComponentItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasDetails = component.props || component.state || component.hasShadow;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScrollTo = () => {
    const element = document.querySelector(component.selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 하이라이트 효과
      element.classList.add('klic-component-highlight');
      setTimeout(() => {
        element.classList.remove('klic-component-highlight');
      }, 2000);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-colors',
        depth > 0 && 'ml-2'
      )}
    >
      {/* 컴포넌트 헤더 */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        {hasDetails ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* 이름 */}
        <span className="font-mono text-sm font-medium truncate flex-1" title={component.name}>
          {component.name}
        </span>

        {/* 태그명 */}
        {component.tagName && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {component.tagName}
          </Badge>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={handleScrollTo}
            title={t('componentInspector.scrollTo', '요소로 이동')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={() => handleCopy(component.selector)}
            title={t('componentInspector.copySelector', '선택자 복사')}
          >
            <Copy className={cn('w-3 h-3', copied && 'text-green-500')} />
          </Button>
        </div>
      </div>

      {/* 상세 정보 */}
      {isExpanded && hasDetails && (
        <div className="px-2 pb-2 pt-1 space-y-2 text-xs border-t border-border/50 mt-1">
          {/* 선택자 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">Selector:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono truncate">
              {component.selector}
            </code>
          </div>

          {/* ID */}
          {component.elementId && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">ID:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">
                #{component.elementId}
              </code>
            </div>
          )}

          {/* 클래스 */}
          {component.className && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">Class:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono truncate">
                .{component.className.split(' ').join('.')}
              </code>
            </div>
          )}

          {/* 깊이 & 자식 수 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Depth:</span>
              <span>{component.depth}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Children:</span>
              <span>{component.children}</span>
            </div>
          </div>

          {/* Shadow DOM */}
          {component.hasShadow && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                Shadow DOM
              </Badge>
            </div>
          )}

          {/* Props (React/Vue) */}
          {component.props && Object.keys(component.props).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Code className="w-3 h-3" />
                <span>Props:</span>
              </div>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(component.props, null, 2)}
              </pre>
            </div>
          )}

          {/* State (React/Vue) */}
          {component.state && Object.keys(component.state).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Code className="w-3 h-3" />
                <span>State:</span>
              </div>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(component.state, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
