import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreCard } from './ScoreCard';
import { IssueList } from './IssueList';
import { SettingsPanel } from './SettingsPanel';
import type {
  AccessibilityIssue,
  AccessibilitySettings,
  CategoryResult,
  ElementDescription,
  IssueSeverity,
  ValidationCategory,
} from '@/types/accessibility';
import { useTranslations } from '@/hooks/useTranslations';

interface CategoryTabsProps {
  categories: CategoryResult[];
  totalScore: number;
  grade: string;
  krdsCompliant: boolean;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
  onSelectIssueElement?: (selector: string | undefined, issue?: AccessibilityIssue) => void;
}

type IssueCategory = Exclude<ValidationCategory, 'summary'>;

const ISSUE_CATEGORIES: IssueCategory[] = [
  'html',
  'color',
  'typography',
  'component',
  'responsive',
  'token',
];

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const DEFAULT_VISIBLE_SEVERITIES: IssueSeverity[] = ['critical', 'high', 'medium'];

function getSeverityRank(severity: IssueSeverity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function normalizeSeverityFilter(values: IssueSeverity[]): IssueSeverity[] {
  const set = new Set(values);
  return SEVERITY_ORDER.filter((severity) => set.has(severity));
}

function getIssueSelector(issue: AccessibilityIssue): string | undefined {
  if (!issue.element) {
    return undefined;
  }

  if (typeof issue.element === 'string') {
    return issue.element;
  }

  return (issue.element as ElementDescription).selector;
}

export function CategoryTabs({
  categories,
  totalScore,
  grade,
  krdsCompliant,
  settings,
  onSettingsChange,
  onSelectIssueElement,
}: CategoryTabsProps) {
  const { t: translate } = useTranslations();
  const [activeTab, setActiveTab] = useState<'summary' | 'issues' | 'settings'>('summary');
  const [activeCategory, setActiveCategory] = useState<'all' | IssueCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity[]>(
    DEFAULT_VISIBLE_SEVERITIES
  );

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.category, category]));
  }, [categories]);

  const issueCategories = useMemo(() => {
    return ISSUE_CATEGORIES.map((categoryId) => {
      const categoryData = categoryMap.get(categoryId);
      return {
        id: categoryId,
        score: categoryData?.score ?? 0,
        issues: categoryData?.issues ?? [],
      };
    });
  }, [categoryMap]);

  const allIssues = useMemo(() => {
    return issueCategories.flatMap((category) => category.issues);
  }, [issueCategories]);

  const categoryFilteredIssues = useMemo(() => {
    if (activeCategory === 'all') {
      return allIssues;
    }

    return allIssues.filter((issue) => issue.category === activeCategory);
  }, [activeCategory, allIssues]);

  const hiddenMinorCount = useMemo(() => {
    return categoryFilteredIssues.filter((issue) => {
      return (issue.severity === 'low' || issue.severity === 'info')
        && !severityFilter.includes(issue.severity);
    }).length;
  }, [categoryFilteredIssues, severityFilter]);

  const categoriesWithIssues = useMemo(() => {
    return issueCategories.filter((category) => category.issues.length > 0);
  }, [issueCategories]);

  const categoriesWithoutIssuesCount = issueCategories.length - categoriesWithIssues.length;

  const topPriorityIssues = useMemo(() => {
    return [...allIssues]
      .filter((issue) => issue.severity !== 'info')
      .sort((a, b) => {
        const severityDiff = getSeverityRank(a.severity) - getSeverityRank(b.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return a.rule.localeCompare(b.rule);
      })
      .slice(0, 5);
  }, [allIssues]);

  const hasMinorSeverityVisible = severityFilter.includes('low') || severityFilter.includes('info');

  const toggleMinorSeverity = () => {
    if (hasMinorSeverityVisible) {
      setSeverityFilter((previous) => previous.filter((severity) => severity !== 'low' && severity !== 'info'));
      return;
    }

    setSeverityFilter((previous) => normalizeSeverityFilter([...previous, 'low', 'info']));
  };

  const issueTabLabel = translate('accessibility.issues', { count: allIssues.length });

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'summary' | 'issues' | 'settings')}>
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="summary">{translate('accessibility.categories.summary')}</TabsTrigger>
        <TabsTrigger value="issues">{issueTabLabel}</TabsTrigger>
        <TabsTrigger value="settings">{translate('accessibility.settings')}</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-4 space-y-4">
        <ScoreCard score={totalScore} grade={grade} krdsCompliant={krdsCompliant} />

        <Card>
          <CardHeader>
            <CardTitle>{translate('accessibility.issues', { count: topPriorityIssues.length })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPriorityIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">{translate('accessibility.noIssues')}</p>
            ) : (
              topPriorityIssues.map((issue) => {
                const selector = getIssueSelector(issue);

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => onSelectIssueElement?.(selector, issue)}
                    disabled={!selector}
                    className="w-full text-left rounded-md border p-3 hover:bg-muted/40 disabled:opacity-100 disabled:cursor-default"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{issue.rule}</span>
                      <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {translate(`accessibility.severity.${issue.severity}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{issue.message}</p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate('accessibility.categories.summary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoriesWithIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">{translate('accessibility.noIssues')}</p>
            ) : (
              categoriesWithIssues.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{translate(`accessibility.categories.${category.id}`)}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category.issues.length}</Badge>
                    <span className="text-xs text-muted-foreground">{category.score}</span>
                  </div>
                </div>
              ))
            )}

            {categoriesWithoutIssuesCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {categoriesWithoutIssuesCount} {translate('accessibility.noIssues')}
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="issues" className="mt-4 space-y-3">
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('all')}
              >
                All
              </Button>

              {categoriesWithIssues.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={activeCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {translate(`accessibility.categories.${category.id}`)}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant={hasMinorSeverityVisible ? 'default' : 'outline'}
                onClick={toggleMinorSeverity}
              >
                Low / Info
              </Button>

              {hiddenMinorCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {hiddenMinorCount} low/info hidden
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <IssueList
          issues={categoryFilteredIssues}
          severityFilter={severityFilter}
          onSeverityFilterChange={(filter) => setSeverityFilter(normalizeSeverityFilter(filter))}
          onSelectIssueElement={onSelectIssueElement}
        />
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />
      </TabsContent>
    </Tabs>
  );
}
