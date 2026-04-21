// src/components/AccessibilityChecker/IssueList.tsx
// Issue List - Displays accessibility issues with filtering

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IssueItem } from './IssueItem';
import type { AccessibilityIssue, IssueSeverity, ElementDescription } from '@/types/accessibility';
import { useTranslations } from '@/hooks/useTranslations';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface IssueListProps {
  issues: AccessibilityIssue[];
  severityFilter: IssueSeverity[];
  onSeverityFilterChange: (filter: IssueSeverity[]) => void;
  onSelectIssueElement?: (selector: string | undefined, issue?: AccessibilityIssue) => void;
}

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

export function IssueList({
  issues,
  severityFilter,
  onSeverityFilterChange,
  onSelectIssueElement,
}: IssueListProps) {
  const { t: translate } = useTranslations();
  const searchQuery: string = '';

  // Helper to get selector from element
  const getElementSelector = (element: string | ElementDescription | undefined): string => {
    if (!element) return '';
    if (typeof element === 'string') return element;
    return element.selector;
  };

  // Filter issues by severity
  const filteredIssues = issues.filter((issue) =>
    severityFilter.includes(issue.severity) &&
    (searchQuery === '' ||
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getElementSelector(issue.element).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by category
  const groupedByCategory = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, AccessibilityIssue[]>);

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'medium':
        return <Info className="w-4 h-4 text-info" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const toggleSeverity = (severity: IssueSeverity) => {
    if (severityFilter.includes(severity)) {
      onSeverityFilterChange(severityFilter.filter((s) => s !== severity));
    } else {
      onSeverityFilterChange([...severityFilter, severity]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {translate('accessibility.issues', { count: filteredIssues.length })}
          </CardTitle>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            {SEVERITY_ORDER.map((severity) => (
              <Badge
                key={severity}
                variant={severityFilter.includes(severity) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSeverity(severity)}
              >
                {getSeverityIcon(severity)}
                <span className="ml-1">{translate(`accessibility.severity.${severity}`)}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {filteredIssues.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground text-center">
              {translate('accessibility.noIssues')}
            </div>
          ) : (
            Object.entries(groupedByCategory).map(([category, categoryIssues]) => (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {translate(`accessibility.categories.${category}`)}
                  <Badge variant="secondary">{categoryIssues.length}</Badge>
                </h4>

                {categoryIssues.map((issue) => (
                  <IssueItem key={issue.id} issue={issue} onSelectElement={onSelectIssueElement} />
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
