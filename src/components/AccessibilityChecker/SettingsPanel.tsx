// src/components/AccessibilityChecker/SettingsPanel.tsx
// Settings Panel - Accessibility checker configuration

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_A11Y_SETTINGS, type AccessibilitySettings, type ValidationCategory, type IssueSeverity } from '@/types/accessibility';
import { useTranslations } from '@/hooks/useTranslations';

interface SettingsPanelProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
}

const CATEGORY_IDS: ValidationCategory[] = ['html', 'color', 'typography', 'component', 'responsive', 'token'];
const SEVERITY_IDS: IssueSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const { t: translate } = useTranslations();

  const toggleCategory = (categoryId: ValidationCategory) => {
    const isEnabled = settings.enabledCategories.includes(categoryId);
    const newCategories = isEnabled
      ? settings.enabledCategories.filter((c) => c !== categoryId)
      : [...settings.enabledCategories, categoryId];

    onSettingsChange({ enabledCategories: newCategories });
  };

  const toggleSeverity = (severityId: IssueSeverity) => {
    const isEnabled = settings.severityFilter.includes(severityId);
    const newFilter = isEnabled
      ? settings.severityFilter.filter((s) => s !== severityId)
      : [...settings.severityFilter, severityId];

    onSettingsChange({ severityFilter: newFilter });
  };

  const enabledCount = settings.enabledCategories.length;
  const severityFilterCount = settings.severityFilter.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate('accessibility.settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-6 pr-4">
            {/* Category Toggle */}
            <div>
              <Label className="text-base font-semibold mb-3">
                {translate('accessibility.categoriesCount', { enabled: enabledCount, total: CATEGORY_IDS.length })}
              </Label>
              <div className="space-y-2">
                {CATEGORY_IDS.map((catId) => {
                  const isEnabled = settings.enabledCategories.includes(catId);
                  return (
                    <div key={catId} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{translate(`accessibility.categories.${catId}`)}</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleCategory(catId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <Label className="text-base font-semibold mb-3">
                {translate('accessibility.severityFilterCount', { enabled: severityFilterCount, total: SEVERITY_IDS.length })}
              </Label>
              <div className="space-y-2">
                {SEVERITY_IDS.map((sevId) => {
                  const isEnabled = settings.severityFilter.includes(sevId);
                  return (
                    <div key={sevId} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{translate(`accessibility.severity.${sevId}`)}</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleSeverity(sevId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scan Options */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3">{translate('accessibility.scanOptions')}</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <span>{translate('accessibility.maxElementCount', { count: settings.maxElementsToScan })}</span>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    step={100}
                    value={settings.maxElementsToScan}
                    onChange={(e) => onSettingsChange({
                      maxElementsToScan: parseInt(e.target.value) || 1000,
                    })}
                    className="w-20 h-8 px-2 rounded border"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <span>{translate('accessibility.includeHidden')}</span>
                  <Switch
                    checked={settings.includeHidden}
                    onCheckedChange={(checked) => onSettingsChange({ includeHidden: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <span>{translate('accessibility.autoScanOnActivate')}</span>
                  <Switch
                    checked={settings.autoScanOnActivate}
                    onCheckedChange={(checked) => onSettingsChange({ autoScanOnActivate: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onSettingsChange(DEFAULT_A11Y_SETTINGS);
                }}
              >
                {translate('accessibility.resetToDefault')}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
