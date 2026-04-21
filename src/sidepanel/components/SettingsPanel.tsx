import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Monitor, Languages } from 'lucide-react';
import { ToolType, ALL_TOOLS } from '../constants/tools';
import { STORAGE_KEYS } from '../../constants/storage';
import { getStorage, setStorage } from '../../utils/storage';
import { useTheme } from '@/lib/theme-provider';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getShortcuts, updateShortcut } from '../../utils/shortcuts/shortcutService';
import type { ShortcutStorageData } from '../../types/shortcuts';
import { parseToolShortcutKeydown } from '../../utils/shortcuts/keyboardParser';
import { validateToolShortcutAssignment } from '../../utils/shortcuts/shortcutValidation';
import {
  downloadJsonFile,
  getShortcutExportFilename,
  parseAndNormalizeShortcutImport,
} from '../../utils/shortcuts/shortcutImportExport';

interface GlobalSettings {
  autoSave: boolean;
  showNotifications: boolean;
  keyboardShortcuts: boolean;
  defaultTool?: ToolType;
  toolSettings: Partial<Record<ToolType, unknown>>;
}

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENTS: { value: 'blue' | 'amber' | 'green' | 'violet' | 'rose'; color: string; name: string }[] = [
  { value: 'blue', color: 'oklch(0.55 0.22 264)', name: 'Blue' },
  { value: 'amber', color: 'oklch(0.70 0.19 70)', name: 'Amber' },
  { value: 'green', color: 'oklch(0.58 0.19 149)', name: 'Green' },
  { value: 'violet', color: 'oklch(0.56 0.24 292)', name: 'Violet' },
  { value: 'rose', color: 'oklch(0.60 0.23 16)', name: 'Rose' },
];

const APP_VERSION = '2.0.1';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const isModalMode = new URLSearchParams(window.location.search).get('mode') === 'modal';
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [settings, setSettings] = useState<GlobalSettings>({
    autoSave: true,
    showNotifications: true,
    keyboardShortcuts: true,
    toolSettings: {},
  });
  const [activeTab, setActiveTab] = useState<'general' | 'tools' | 'shortcuts'>('general');
  const [isSaving, setIsSaving] = useState(false);

  const { mode, accent, setMode, setAccent } = useTheme();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadLanguage();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await getStorage<GlobalSettings>(STORAGE_KEYS.APP_SETTINGS);
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadLanguage = async () => {
    try {
      const storedLang = await getStorage<'ko' | 'en'>('app:language');
      if (storedLang) {
        setLanguage(storedLang);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<GlobalSettings>) => {
    try {
      setIsSaving(true);

      const updated = { ...settings, ...newSettings };
      await setStorage(STORAGE_KEYS.APP_SETTINGS, updated);

      setSettings(updated);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (lang: 'ko' | 'en') => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className={`bg-card w-full h-[80%] ${isModalMode ? 'sm:h-[80%]' : 'sm:h-auto'} sm:max-w-md sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full text-muted-foreground"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 탭 네비게이션 */}
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">{t('common.general')}</TabsTrigger>
              <TabsTrigger value="tools" className="flex-1">{t('common.tools')}</TabsTrigger>
              <TabsTrigger value="shortcuts" className="flex-1">{t('common.shortcuts')}</TabsTrigger>
            </TabsList>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {activeTab === 'general' && (
              <GeneralSettings
                settings={settings}
                mode={mode}
                accent={accent}
                setMode={setMode}
                setAccent={setAccent}
                onSave={saveSettings}
                isSaving={isSaving}
                language={language}
                onLanguageChange={handleLanguageChange}
              />
            )}

            {activeTab === 'tools' && <ToolSettings />}

            {activeTab === 'shortcuts' && (
              <ShortcutSettings settings={settings} />
            )}
          </div>
        </Tabs>

        <div className="p-4 border-t border-border text-center">
          <div className="text-xs text-muted-foreground mb-1">{t('settings.footer.version', { version: APP_VERSION })}</div>
          <a
            href="https://github.com/acc0mplish"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {t('settings.footer.visitGithub')}
          </a>
        </div>
      </div>
    </div>
  );
}

interface GeneralSettingsProps {
  settings: GlobalSettings;
  mode: 'light' | 'dark' | 'system';
  accent: 'blue' | 'amber' | 'green' | 'violet' | 'rose';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setAccent: (accent: 'blue' | 'amber' | 'green' | 'violet' | 'rose') => void;
  onSave: (newSettings: Partial<GlobalSettings>) => void;
  isSaving: boolean;
  language: 'ko' | 'en';
  onLanguageChange: (lang: 'ko' | 'en') => void;
}

function GeneralSettings({
  settings,
  mode,
  accent,
  setMode,
  setAccent,
  onSave,
  isSaving,
  language,
  onLanguageChange,
}: GeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.language.label')}</div>
            <div className="text-xs text-muted-foreground">Language / 언어</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLanguageChange('ko')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              language === 'ko'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <span className="text-sm">🇰🇷</span>
            <span className="text-xs">{t('settings.language.ko')}</span>
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              language === 'en'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <span className="text-sm">🇺🇸</span>
            <span className="text-xs">{t('settings.language.en')}</span>
          </button>
        </div>
      </div>

      {/* Theme Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            {mode === 'dark' ? <Moon className="w-4 h-4" /> : mode === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.theme.label')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.theme.modeDescription')}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode('light')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              mode === 'light'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-xs">{t('settings.theme.light')}</span>
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              mode === 'dark'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-xs">{t('settings.theme.dark')}</span>
          </button>
          <button
            onClick={() => setMode('system')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              mode === 'system'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="text-xs">{t('settings.theme.system')}</span>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <span className="text-sm">🎨</span>
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.theme.accentColor')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.theme.accentDescription')}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAccent(a.value)}
              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                accent === a.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: a.color }}
              aria-label={a.name}
              title={a.name}
            />
          ))}
        </div>
      </div>

      {/* Auto Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <span className="text-sm">💾</span>
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.general.autoSave')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.general.autoSaveDescription')}</div>
          </div>
        </div>
        <Switch
          checked={settings.autoSave}
          onCheckedChange={(checked: boolean) => onSave({ autoSave: checked })}
          disabled={isSaving}
        />
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <span className="text-sm">🔔</span>
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.general.notifications')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.general.notificationsDescription')}</div>
          </div>
        </div>
        <Switch
          checked={settings.showNotifications}
          onCheckedChange={(checked) => onSave({ showNotifications: checked })}
          disabled={isSaving}
        />
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <span className="text-sm">⌨️</span>
          </div>
          <div>
            <div className="font-medium text-sm">{t('settings.general.keyboardShortcuts')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.general.keyboardShortcutsDescription')}</div>
          </div>
        </div>
        <Switch
          checked={settings.keyboardShortcuts}
          onCheckedChange={(checked) => onSave({ keyboardShortcuts: checked })}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}

function ToolSettings(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-foreground mb-3">{t('settings.toolsSettings.title')}</h3>

      {ALL_TOOLS.map((tool) => (
        <details key={tool.id} className="group">
          <summary className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <tool.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t(`tools.${tool.id}.name`)}</span>
            </div>
            <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-3 text-xs text-muted-foreground">
            {t('settings.toolsSettings.comingSoon', { name: t(`tools.${tool.id}.name`) })}
          </div>
        </details>
      ))}
    </div>
  );
}

function ShortcutSettings({
  settings,
}: {
  settings: GlobalSettings;
}) {
  const { t, i18n } = useTranslation();

  const isKo = (i18n.resolvedLanguage ?? i18n.language) === 'ko';

  const [shortcutData, setShortcutData] = useState<ShortcutStorageData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [ioBusy, setIoBusy] = useState(false);
  const [ioFeedback, setIoFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [capturingToolId, setCapturingToolId] = useState<ToolType | null>(null);
  const [rowSaving, setRowSaving] = useState<Partial<Record<ToolType, boolean>>>({});
  const [rowFeedback, setRowFeedback] = useState<
    Partial<Record<ToolType, { type: 'success' | 'error' | 'info'; message: string }>>
  >({});

  const pushIoFeedback = React.useCallback(
    (feedback: { type: 'success' | 'error' | 'info'; message: string }) => {
      setIoFeedback(feedback);

      window.setTimeout(() => {
        setIoFeedback((current) => {
          if (!current) return null;
          if (current.type !== feedback.type || current.message !== feedback.message) return current;
          return null;
        });
      }, 3500);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getShortcuts();
        if (cancelled) return;
        setShortcutData(data);
        setLoadFailed(false);
      } catch (error) {
        console.error('Failed to load shortcuts:', error);
        if (cancelled) return;
        setShortcutData(null);
        setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const anyRowSaving = React.useMemo(() => {
    return Object.values(rowSaving).some(Boolean);
  }, [rowSaving]);

  const fallbackToolShortcuts = React.useMemo(() => {
    return Object.fromEntries(ALL_TOOLS.map((tool) => [tool.id, null])) as Record<ToolType, string | null>;
  }, []);

  const toolShortcutMap = shortcutData?.tools ?? fallbackToolShortcuts;

  const noneLabel = t('settings.shortcutSettings.none', {
    defaultValue: isKo ? '없음' : 'None',
  });

  const formatShortcutLabel = (shortcut: string) => {
    return shortcut
      .split('+')
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' + ');
  };

  const pushRowFeedback = React.useCallback(
    (toolId: ToolType, feedback: { type: 'success' | 'error' | 'info'; message: string }) => {
      setRowFeedback((prev) => ({ ...prev, [toolId]: feedback }));

      window.setTimeout(() => {
        setRowFeedback((prev) => {
          const current = prev[toolId];
          if (!current) return prev;
          if (current.type !== feedback.type || current.message !== feedback.message) return prev;

          const next = { ...prev };
          delete next[toolId];
          return next;
        });
      }, 2500);
    },
    []
  );

  const onExportShortcuts = async () => {
    if (ioBusy) return;

    setIoBusy(true);
    try {
      const current = await getShortcuts();
      downloadJsonFile(getShortcutExportFilename(), current);
      pushIoFeedback({
        type: 'success',
        message: t('settings.shortcutSettings.exported', {
          defaultValue: isKo ? '단축키 JSON을 저장했습니다.' : 'Shortcut JSON exported.',
        }),
      });
    } catch (error) {
      console.error('Failed to export shortcuts:', error);
      pushIoFeedback({
        type: 'error',
        message: t('settings.shortcutSettings.exportFailed', {
          defaultValue: isKo ? '내보내기에 실패했습니다.' : 'Export failed.',
        }),
      });
    } finally {
      setIoBusy(false);
    }
  };

  const onImportClick = () => {
    if (ioBusy) return;
    importInputRef.current?.click();
  };

  const onImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) return;

    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.json')) {
      pushIoFeedback({
        type: 'error',
        message: t('settings.shortcutSettings.invalidFileType', {
          defaultValue: isKo ? 'JSON 파일만 가져올 수 있습니다.' : 'Only JSON files are supported.',
        }),
      });
      return;
    }

    setIoBusy(true);
    try {
      const text = await file.text();
      const parsed = parseAndNormalizeShortcutImport(text);

      if (!parsed.ok) {
        const message =
          parsed.code === 'invalid_json'
            ? t('settings.shortcutSettings.importParseFailed', {
                defaultValue: isKo ? 'JSON 파싱에 실패했습니다.' : 'Failed to parse JSON.',
              })
            : parsed.code === 'unsupported_version'
              ? t('settings.shortcutSettings.importUnsupportedVersion', {
                  defaultValue: isKo
                    ? '지원하지 않는 단축키 스키마 버전입니다.'
                    : 'Unsupported shortcut schema version.',
                })
              : t('settings.shortcutSettings.importSchemaInvalid', {
                  defaultValue: isKo ? '단축키 JSON 형식이 올바르지 않습니다.' : 'Invalid shortcut JSON schema.',
                });

        pushIoFeedback({
          type: 'error',
          message: `${message} (${parsed.message})`,
        });
        return;
      }

      const persisted = await setStorage(STORAGE_KEYS.SHORTCUTS_DATA, parsed.normalized);
      if (!persisted) {
        pushIoFeedback({
          type: 'error',
          message: t('settings.shortcutSettings.importPersistFailed', {
            defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to persist imported shortcuts.',
          }),
        });
        return;
      }

      const refreshed = await getShortcuts();
      setShortcutData(refreshed);
      setLoadFailed(false);
      setCapturingToolId(null);
      setRowFeedback({});
      pushIoFeedback({
        type: 'success',
        message: t('settings.shortcutSettings.imported', {
          defaultValue: isKo ? '단축키를 가져왔습니다.' : 'Shortcuts imported.',
        }),
      });
    } catch (error) {
      console.error('Failed to import shortcuts:', error);
      pushIoFeedback({
        type: 'error',
        message: t('settings.shortcutSettings.importFailed', {
          defaultValue: isKo ? '가져오기에 실패했습니다.' : 'Import failed.',
        }),
      });
    } finally {
      setIoBusy(false);
    }
  };

  useEffect(() => {
    if (!capturingToolId) return;

    const toolId = capturingToolId;

    const onKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.repeat) {
        return;
      }

      const parsed = parseToolShortcutKeydown(event);

      if (parsed.type === 'ignore') {
        return;
      }

      if (parsed.type === 'cancel') {
        setCapturingToolId(null);
        pushRowFeedback(toolId, {
          type: 'info',
          message: t('settings.shortcutSettings.captureCancelled', {
            defaultValue: isKo ? '입력을 취소했습니다.' : 'Capture cancelled.',
          }),
        });
        return;
      }

      if (parsed.type === 'error') {
        const message =
          parsed.code === 'modifier_required'
            ? t('settings.shortcutSettings.modifierRequired', {
                defaultValue: isKo
                  ? 'Ctrl/Alt/Shift/Meta 중 최소 1개를 포함해야 합니다.'
                  : 'Include at least one modifier: Ctrl/Alt/Shift/Meta.',
              })
            : t('settings.shortcutSettings.invalidKey', {
                defaultValue: isKo ? '지원하지 않는 키입니다. 다시 시도하세요.' : 'Unsupported key. Try again.',
              });

        pushRowFeedback(toolId, { type: 'error', message });
        return;
      }

      const validation = validateToolShortcutAssignment({
        toolId,
        shortcut: parsed.value,
        toolShortcuts: toolShortcutMap,
      });

      if (!validation.valid) {
        const prettyShortcut = formatShortcutLabel(validation.normalizedShortcut);
        const validationMessage =
          validation.code === 'duplicate'
            ? t('settings.shortcutSettings.duplicate', {
                toolName: validation.conflictingToolId
                  ? t(`tools.${validation.conflictingToolId}.name`)
                  : t('common.tools'),
                defaultValue: isKo
                  ? '{{toolName}} 도구에서 이미 사용 중인 단축키입니다.'
                  : 'This shortcut is already used by {{toolName}}.',
              })
            : t('settings.shortcutSettings.browserReserved', {
                shortcut: prettyShortcut,
                defaultValue: isKo
                  ? '{{shortcut}}는 브라우저 예약 단축키입니다. 다른 조합을 사용하세요.'
                  : '{{shortcut}} is reserved by the browser. Choose another shortcut.',
              });

        pushRowFeedback(toolId, {
          type: 'error',
          message: validationMessage,
        });
        return;
      }

      setRowSaving((prev) => ({ ...prev, [toolId]: true }));

      try {
        const result = await updateShortcut({
          scope: 'tool',
          id: toolId,
          shortcut: validation.normalizedShortcut,
        });

        if (!result.success) {
          pushRowFeedback(toolId, {
            type: 'error',
            message:
              result.error ??
              t('settings.shortcutSettings.saveFailed', {
                defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to save.',
              }),
          });
          return;
        }

        setShortcutData(result.data);
        setLoadFailed(false);
        pushRowFeedback(toolId, {
          type: 'success',
          message: t('settings.shortcutSettings.saved', {
            defaultValue: isKo ? '저장됨' : 'Saved',
          }),
        });
      } catch (error) {
        console.error('Failed to update shortcut:', error);
        pushRowFeedback(toolId, {
          type: 'error',
          message: t('settings.shortcutSettings.saveFailed', {
            defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to save.',
          }),
        });
      } finally {
        setRowSaving((prev) => ({ ...prev, [toolId]: false }));
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [capturingToolId, isKo, pushRowFeedback, t, toolShortcutMap]);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-foreground mb-3">{t('settings.shortcutSettings.title')}</h3>

      <div className="p-3 bg-muted rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">
              {t('settings.shortcutSettings.importExport', {
                defaultValue: isKo ? '가져오기 / 내보내기' : 'Import / Export',
              })}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {t('settings.shortcutSettings.importExportHint', {
                defaultValue: isKo
                  ? '현재 단축키 설정을 JSON으로 백업하거나 복원할 수 있습니다.'
                  : 'Back up or restore shortcut settings as JSON.',
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportFileChange}
            />

            <button
              type="button"
              onClick={onExportShortcuts}
              disabled={ioBusy || anyRowSaving || capturingToolId !== null}
              className="text-xs px-2 py-1 rounded border bg-card border-border text-foreground hover:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t('settings.shortcutSettings.export', { defaultValue: isKo ? '내보내기' : 'Export' })}
            </button>

            <button
              type="button"
              onClick={onImportClick}
              disabled={ioBusy || anyRowSaving || capturingToolId !== null}
              className="text-xs px-2 py-1 rounded border bg-card border-border text-foreground hover:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t('settings.shortcutSettings.import', { defaultValue: isKo ? '가져오기' : 'Import' })}
            </button>
          </div>
        </div>

        {ioFeedback && (
          <div
            className={`mt-2 text-[11px] ${
              ioFeedback.type === 'error'
                ? 'text-destructive'
                : ioFeedback.type === 'success'
                  ? 'text-success-foreground'
                  : 'text-muted-foreground'
            }`}
          >
            {ioFeedback.message}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {ALL_TOOLS.map((tool) => {
          const shortcut = toolShortcutMap[tool.id];
          const hasShortcut = typeof shortcut === 'string' && shortcut.trim().length > 0;
          const shortcutLabel = hasShortcut ? formatShortcutLabel(shortcut) : noneLabel;

          const isListening = capturingToolId === tool.id;
          const isRowSaving = rowSaving[tool.id] ?? false;
          const feedback = rowFeedback[tool.id];

          const kbdLabel = isListening
            ? t('settings.shortcutSettings.listening', {
                defaultValue: isKo ? '입력 대기…' : 'Listening…',
              })
            : shortcutLabel;

          const startCapture = () => {
            setCapturingToolId(tool.id);
            pushRowFeedback(tool.id, {
              type: 'info',
              message: t('settings.shortcutSettings.captureHint', {
                defaultValue: isKo
                  ? '키 조합을 누르세요. (Esc: 취소)'
                  : 'Press a key combo. (Esc to cancel)',
              }),
            });
          };

          const cancelCapture = () => {
            setCapturingToolId((current) => (current === tool.id ? null : current));
            pushRowFeedback(tool.id, {
              type: 'info',
              message: t('settings.shortcutSettings.captureCancelled', {
                defaultValue: isKo ? '입력을 취소했습니다.' : 'Capture cancelled.',
              }),
            });
          };

          const clearShortcut = async () => {
            if (capturingToolId === tool.id) {
              setCapturingToolId(null);
            }

            setRowSaving((prev) => ({ ...prev, [tool.id]: true }));
            try {
              const result = await updateShortcut({
                scope: 'tool',
                id: tool.id,
                shortcut: null,
              });

              if (!result.success) {
                pushRowFeedback(tool.id, {
                  type: 'error',
                  message:
                    result.error ??
                    t('settings.shortcutSettings.saveFailed', {
                      defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to save.',
                    }),
                });
                return;
              }

              setShortcutData(result.data);
              setLoadFailed(false);
              pushRowFeedback(tool.id, {
                type: 'success',
                message: t('settings.shortcutSettings.cleared', {
                  defaultValue: isKo ? '해제됨' : 'Cleared',
                }),
              });
            } catch (error) {
              console.error('Failed to clear shortcut:', error);
              pushRowFeedback(tool.id, {
                type: 'error',
                message: t('settings.shortcutSettings.saveFailed', {
                  defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to save.',
                }),
              });
            } finally {
              setRowSaving((prev) => ({ ...prev, [tool.id]: false }));
            }
          };

          return (
            <div key={tool.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <tool.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">{t(`tools.${tool.id}.name`)}</span>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-2">
                  <kbd
                    className={`text-xs font-mono bg-card border border-border rounded px-2 py-1 ${
                      isListening
                        ? 'text-primary border-primary/40 bg-primary/5'
                        : hasShortcut
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/70 italic'
                    }`}
                    title={isListening ? 'Esc' : undefined}
                  >
                    {kbdLabel}
                  </kbd>

                  <button
                    type="button"
                    onClick={isListening ? cancelCapture : startCapture}
                    disabled={isRowSaving}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      isListening
                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15'
                        : 'bg-card border-border text-foreground hover:border-primary/50'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isListening
                      ? t('settings.shortcutSettings.cancel', { defaultValue: isKo ? '취소' : 'Cancel' })
                      : t('settings.shortcutSettings.record', { defaultValue: isKo ? '기록' : 'Record' })}
                  </button>

                  <button
                    type="button"
                    onClick={clearShortcut}
                    disabled={isRowSaving}
                    className="text-xs px-2 py-1 rounded border bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {t('settings.shortcutSettings.clear', { defaultValue: isKo ? '해제' : 'Clear' })}
                  </button>
                </div>

                {feedback && (
                  <span
                    className={`text-[11px] ${
                      feedback.type === 'error'
                        ? 'text-destructive'
                        : feedback.type === 'success'
                          ? 'text-success-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {feedback.message}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loadFailed && (
        <div className="mt-3 p-3 bg-muted border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            {t('settings.shortcutSettings.loadFailed', {
              defaultValue: isKo
                ? '저장된 단축키를 불러올 수 없습니다. 기본값을 표시합니다.'
                : 'Saved shortcuts could not be loaded. Showing defaults.',
            })}
          </p>
        </div>
      )}

      {!settings.keyboardShortcuts && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-xs text-warning-foreground">
            {t('settings.shortcutSettings.shortcutsDisabled')}
          </p>
        </div>
      )}
    </div>
  );
}
