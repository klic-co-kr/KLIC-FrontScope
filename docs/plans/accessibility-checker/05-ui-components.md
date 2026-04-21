# Phase 5: UI Components (Tasks 32-42)

> Side Panel UI with ScoreCard, CategoryTabs, IssueList, ExportButton, Settings

---

## Task 32: Create ScoreCard Component

**Files:**
- Create: `src/components/AccessibilityChecker/ScoreCard.tsx`

Displays the overall accessibility score with circular progress, grade badge, and KRDS compliance status.

```tsx
// src/components/AccessibilityChecker/ScoreCard.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AccessibilityReport } from '@/types/accessibility';
import { GRADE_THRESHOLDS } from '@/types/accessibility';

interface ScoreCardProps {
  report: AccessibilityReport;
}

export function ScoreCard({ report }: ScoreCardProps) {
  const gradeInfo = GRADE_THRESHOLDS.find(g => report.totalScore >= g.min)!;

  // SVG circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (report.totalScore / 100) * circumference;

  const scoreColor = report.totalScore >= 75
    ? 'text-success'
    : report.totalScore >= 50
      ? 'text-warning'
      : 'text-destructive';

  return (
    <Card className="bg-card">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Circular Score */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor"
              strokeWidth="6" className="text-muted" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor"
              strokeWidth="6" strokeLinecap="round" className={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor}`}>{report.totalScore}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Grade & Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={report.totalScore >= 75 ? 'default' : 'destructive'}
              className="text-lg px-3 py-1 font-bold">
              {report.grade}
            </Badge>
            <span className="text-sm text-muted-foreground">{gradeInfo.labelKo}</span>
          </div>

          {report.krdsCompliant && (
            <Badge variant="outline" className="text-xs border-primary text-primary">
              KRDS 준수
            </Badge>
          )}

          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>{report.summary.totalPassed}/{report.summary.totalChecks} 통과</div>
            <div>{report.scanDuration.toFixed(0)}ms 소요</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Commit:** `feat(a11y): create ScoreCard component with circular progress`

---

## Task 33: Create IssueItem Component

**Files:**
- Create: `src/components/AccessibilityChecker/IssueItem.tsx`

Individual issue display with severity badge, message, element info, and fix suggestion.

```tsx
// src/components/AccessibilityChecker/IssueItem.tsx
import { Badge } from '@/components/ui/badge';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import type { AccessibilityIssue } from '@/types/accessibility';

interface IssueItemProps {
  issue: AccessibilityIssue;
  onHighlightElement?: (selector: string) => void;
}

const SEVERITY_VARIANT: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
  info: 'outline',
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: '심각',
  high: '높음',
  medium: '보통',
  low: '낮음',
  info: '정보',
};

export function IssueItem({ issue, onHighlightElement }: IssueItemProps) {
  return (
    <AccordionItem value={issue.id}>
      <AccordionTrigger className="hover:no-underline py-2">
        <div className="flex items-center gap-2 text-left">
          <Badge variant={SEVERITY_VARIANT[issue.severity]} className="text-[10px] px-1.5 py-0">
            {SEVERITY_LABEL[issue.severity]}
          </Badge>
          <span className="text-xs">{issue.message}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="text-xs space-y-2 pb-3">
        {issue.element && (
          <div className="space-y-1">
            <div className="text-muted-foreground">요소:</div>
            <code className="block bg-muted px-2 py-1 rounded text-[10px] font-mono break-all">
              {issue.element.selector}
            </code>
            {onHighlightElement && (
              <button
                onClick={() => onHighlightElement(issue.element!.selector)}
                className="text-primary text-[10px] hover:underline"
              >
                페이지에서 찾기
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          <div className="text-muted-foreground">개선 방법:</div>
          <p className="text-foreground">{issue.suggestion}</p>
        </div>

        {(issue.wcagCriteria || issue.krdsCriteria) && (
          <div className="flex items-center gap-2 pt-1">
            {issue.wcagCriteria && (
              <Badge variant="outline" className="text-[9px]">WCAG {issue.wcagCriteria}</Badge>
            )}
            {issue.krdsCriteria && (
              <Badge variant="outline" className="text-[9px]">KRDS {issue.krdsCriteria}</Badge>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
```

**Commit:** `feat(a11y): create IssueItem component with severity badge and fix suggestion`

---

## Task 34: Create IssueList Component

**Files:**
- Create: `src/components/AccessibilityChecker/IssueList.tsx`

Filterable, sortable list of issues with accordion expansion.

```tsx
// src/components/AccessibilityChecker/IssueList.tsx
import { Accordion } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IssueItem } from './IssueItem';
import type { AccessibilityIssue, IssueSeverity } from '@/types/accessibility';

interface IssueListProps {
  issues: AccessibilityIssue[];
  severityFilter: IssueSeverity[];
  onHighlightElement?: (selector: string) => void;
}

export function IssueList({ issues, severityFilter, onHighlightElement }: IssueListProps) {
  const filtered = issues.filter(i => severityFilter.includes(i.severity));
  const sorted = [...filtered].sort((a, b) => {
    const order: IssueSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        이슈가 없습니다
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <Accordion type="multiple" className="space-y-1">
        {sorted.map((issue) => (
          <IssueItem
            key={issue.id}
            issue={issue}
            onHighlightElement={onHighlightElement}
          />
        ))}
      </Accordion>
    </ScrollArea>
  );
}
```

**Commit:** `feat(a11y): create IssueList component with filtering and sorting`

---

## Task 35: Create SummaryTab Component

**Files:**
- Create: `src/components/AccessibilityChecker/SummaryTab.tsx`

Overview of all categories with mini score bars and issue count by severity.

**Commit:** `feat(a11y): create SummaryTab component with category overview`

---

## Task 36: Create CategoryDetail Component

**Files:**
- Create: `src/components/AccessibilityChecker/CategoryDetail.tsx`

Shows details for a single validation category with its score, issues, and KRDS reference info.

**Commit:** `feat(a11y): create CategoryDetail component`

---

## Task 37: Create CategoryTabs Component

**Files:**
- Create: `src/components/AccessibilityChecker/CategoryTabs.tsx`

Top-level tabs: 요약 | HTML | 색상 | 타이포 | 컴포넌트 | 반응형 | 토큰

```tsx
// src/components/AccessibilityChecker/CategoryTabs.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SummaryTab } from './SummaryTab';
import { CategoryDetail } from './CategoryDetail';
import type { AccessibilityReport, IssueSeverity } from '@/types/accessibility';

interface CategoryTabsProps {
  report: AccessibilityReport;
  severityFilter: IssueSeverity[];
  onHighlightElement?: (selector: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  summary: '요약',
  html: 'HTML',
  color: '색상',
  typography: '타이포',
  component: '컴포넌트',
  responsive: '반응형',
  token: '토큰',
};

export function CategoryTabs({ report, severityFilter, onHighlightElement }: CategoryTabsProps) {
  return (
    <Tabs defaultValue="summary" className="flex-1">
      <TabsList className="w-full flex-wrap h-auto gap-0.5 p-1">
        <TabsTrigger value="summary" className="text-[10px] px-2 py-1">
          {CATEGORY_LABELS.summary}
        </TabsTrigger>
        {report.categories.map((cat) => (
          <TabsTrigger key={cat.category} value={cat.category} className="text-[10px] px-2 py-1 gap-1">
            {CATEGORY_LABELS[cat.category]}
            {cat.issues.length > 0 && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-0.5">
                {cat.issues.length}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="summary">
        <SummaryTab report={report} />
      </TabsContent>

      {report.categories.map((cat) => (
        <TabsContent key={cat.category} value={cat.category}>
          <CategoryDetail
            result={cat}
            severityFilter={severityFilter}
            onHighlightElement={onHighlightElement}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

**Commit:** `feat(a11y): create CategoryTabs component with issue count badges`

---

## Task 38: Create ScanButton Component

**Files:**
- Create: `src/components/AccessibilityChecker/ScanButton.tsx`

```tsx
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, RotateCw } from 'lucide-react';

interface ScanButtonProps {
  isScanning: boolean;
  hasReport: boolean;
  onScan: () => void;
}

export function ScanButton({ isScanning, hasReport, onScan }: ScanButtonProps) {
  return (
    <Button
      className="w-full h-10 text-sm gap-2"
      variant={hasReport ? 'outline' : 'default'}
      onClick={onScan}
      disabled={isScanning}
    >
      {isScanning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          검사 중...
        </>
      ) : hasReport ? (
        <>
          <RotateCw className="w-4 h-4" />
          다시 검사
        </>
      ) : (
        <>
          <ShieldCheck className="w-4 h-4" />
          접근성 검사 시작
        </>
      )}
    </Button>
  );
}
```

**Commit:** `feat(a11y): create ScanButton component`

---

## Task 39: Create ExportButton Component

**Files:**
- Create: `src/components/AccessibilityChecker/ExportButton.tsx`

Export report as JSON, CSV, or HTML.

**Commit:** `feat(a11y): create ExportButton with JSON/CSV/HTML export`

---

## Task 40: Create SettingsPanel Component

**Files:**
- Create: `src/components/AccessibilityChecker/SettingsPanel.tsx`

Category toggles, severity filter, scan options (maxElements, includeHidden, autoScan).

**Commit:** `feat(a11y): create SettingsPanel with category and severity toggles`

---

## Task 41: Create AccessibilityPanel (Main Container)

**Files:**
- Create: `src/components/AccessibilityChecker/AccessibilityPanel.tsx`

```tsx
// src/components/AccessibilityChecker/AccessibilityPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useAccessibilityScanner } from '@/hooks/accessibility';
import { ScoreCard } from './ScoreCard';
import { CategoryTabs } from './CategoryTabs';
import { ScanButton } from './ScanButton';
import { SettingsPanel } from './SettingsPanel';
import { ExportButton } from './ExportButton';

interface AccessibilityPanelProps {
  onToggle: () => void;
}

export function AccessibilityPanel({ onToggle }: AccessibilityPanelProps) {
  const {
    settings, updateSettings, toggleCategory, toggleSeverity, resetSettings,
    report, isScanning, scanError, scan, clearReport,
  } = useAccessibilityScanner();

  const [showSettings, setShowSettings] = useState(false);

  const handleHighlightElement = async (selector: string) => {
    // Use chrome.windows.getCurrent() to target the correct window (CLAUDE.md requirement)
    const currentWindow = await chrome.windows.getCurrent();
    const [tab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'A11Y_SCAN_ELEMENT',
        selector,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary" />
          접근성 검사
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setShowSettings(s => !s)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
            비활성화
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Scan Button */}
        <ScanButton isScanning={isScanning} hasReport={!!report} onScan={scan} />

        {/* Error */}
        {scanError && (
          <div className="text-destructive text-xs p-2 bg-destructive/10 rounded">
            {scanError}
          </div>
        )}

        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onToggleCategory={toggleCategory}
            onToggleSeverity={toggleSeverity}
            onReset={resetSettings}
          />
        )}

        {/* Report */}
        {report && (
          <>
            <ScoreCard report={report} />
            <CategoryTabs
              report={report}
              severityFilter={settings.severityFilter}
              onHighlightElement={handleHighlightElement}
            />
            <ExportButton report={report} />
          </>
        )}
      </div>
    </div>
  );
}
```

**Commit:** `feat(a11y): create AccessibilityPanel main container component`

---

## Task 42: Create Barrel Export

**Files:**
- Create: `src/components/AccessibilityChecker/index.ts`

```typescript
export { AccessibilityPanel } from './AccessibilityPanel';
export { ScoreCard } from './ScoreCard';
export { CategoryTabs } from './CategoryTabs';
export { IssueList } from './IssueList';
export { IssueItem } from './IssueItem';
export { SummaryTab } from './SummaryTab';
export { CategoryDetail } from './CategoryDetail';
export { ExportButton } from './ExportButton';
export { ScanButton } from './ScanButton';
export { SettingsPanel } from './SettingsPanel';
```

**Commit:** `feat(a11y): add AccessibilityChecker barrel exports`
