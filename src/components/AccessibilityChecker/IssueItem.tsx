// src/components/AccessibilityChecker/IssueItem.tsx
// Issue Item - Individual accessibility issue display

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import type { AccessibilityIssue, ElementDescription } from '@/types/accessibility';
import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface IssueItemProps {
  issue: AccessibilityIssue;
  onSelectElement?: (selector: string | undefined, issue?: AccessibilityIssue) => void;
}

const SEVERITY_STYLES = {
  critical: 'border-l-4 border-destructive',
  high: 'border-l-4 border-warning',
  medium: 'border-l-4 border-info',
  low: 'border-l-4 border-muted',
  info: 'border-l-4 border-muted opacity-60',
};

export function IssueItem({ issue, onSelectElement }: IssueItemProps) {
  const { t: translate } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to get selector from element
  const getElementSelector = (element: string | ElementDescription | undefined): string => {
    if (!element) return '';
    if (typeof element === 'string') return element;
    return element.selector;
  };

  const selector = getElementSelector(issue.element);

  const handleSelect = () => {
    if (!selector) return;
    onSelectElement?.(selector, issue);
  };

  return (
    <Card
      className={`mb-2 ${SEVERITY_STYLES[issue.severity]} ${selector ? 'cursor-pointer hover:bg-muted/40' : ''}`}
      onClick={handleSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                {translate(`accessibility.severity.${issue.severity}`)}
              </Badge>
              <span className="font-mono text-sm">{issue.rule}</span>
            </div>

            <p className="text-sm mb-2">{issue.message}</p>

            {issue.element && (
              <code className="block text-xs bg-muted p-1 rounded font-mono">
                {selector}
              </code>
            )}

            <div className="text-sm">
              <span className="font-semibold">{translate('accessibility.fixSuggestion')}:</span>{' '}
              {issue.suggestion}
            </div>

            {(issue.wcagCriteria || issue.krdsCriteria) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {issue.wcagCriteria && (
                  <span>{translate('accessibility.wcagCriteria')}: {issue.wcagCriteria}</span>
                )}
                {issue.krdsCriteria && (
                  <span>{translate('accessibility.krdsCriteria')}: {issue.krdsCriteria}</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
