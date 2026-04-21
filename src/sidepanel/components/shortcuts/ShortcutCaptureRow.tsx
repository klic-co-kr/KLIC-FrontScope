import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolInfo, ToolType } from '../../constants/tools';
import { parseToolShortcutKeydown } from '../../../utils/shortcuts/keyboardParser';

type FeedbackType = 'success' | 'error' | 'info';

type SaveShortcutResult = {
  success: boolean;
  error?: string;
};

interface ShortcutCaptureRowProps {
  tool: ToolInfo;
  shortcut: string | null;
  onSaveShortcut: (toolId: ToolType, shortcut: string | null) => Promise<SaveShortcutResult>;
}

function formatShortcutLabel(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' + ');
}

export function ShortcutCaptureRow({
  tool,
  shortcut,
  onSaveShortcut,
}: ShortcutCaptureRowProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isKo = (i18n.resolvedLanguage ?? i18n.language) === 'ko';

  const [isListening, setIsListening] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: FeedbackType; message: string } | null>(null);
  const feedbackTimerRef = React.useRef<number | null>(null);

  const clearFeedbackTimer = React.useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer]);

  const pushFeedback = React.useCallback(
    (nextFeedback: { type: FeedbackType; message: string }) => {
      clearFeedbackTimer();
      setFeedback(nextFeedback);

      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback((current) => {
          if (!current) {
            return current;
          }

          if (current.type !== nextFeedback.type || current.message !== nextFeedback.message) {
            return current;
          }

          return null;
        });
        feedbackTimerRef.current = null;
      }, 2500);
    },
    [clearFeedbackTimer]
  );

  const noneLabel = t('settings.shortcutSettings.none', {
    defaultValue: isKo ? '없음' : 'None',
  });

  const saveFailedMessage = t('settings.shortcutSettings.saveFailed', {
    defaultValue: isKo ? '저장에 실패했습니다.' : 'Failed to save.',
  });

  React.useEffect(() => {
    if (!isListening) {
      return;
    }

    const onKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const parsed = parseToolShortcutKeydown(event);

      if (parsed.type === 'ignore') {
        return;
      }

      if (parsed.type === 'cancel') {
        setIsListening(false);
        pushFeedback({
          type: 'info',
          message: t('settings.shortcutSettings.captureCancelled', {
            defaultValue: isKo ? '입력을 취소했습니다.' : 'Capture cancelled.',
          }),
        });
        return;
      }

      if (parsed.type === 'error') {
        pushFeedback({
          type: 'error',
          message:
            parsed.code === 'modifier_required'
              ? t('settings.shortcutSettings.modifierRequired', {
                  defaultValue: isKo
                    ? 'Ctrl/Alt/Shift/Meta 중 최소 1개를 포함해야 합니다.'
                    : 'Include at least one modifier: Ctrl/Alt/Shift/Meta.',
                })
              : t('settings.shortcutSettings.invalidKey', {
                  defaultValue: isKo ? '지원하지 않는 키입니다. 다시 시도하세요.' : 'Unsupported key. Try again.',
                }),
        });
        return;
      }

      setIsListening(false);
      setIsSaving(true);

      try {
        const result = await onSaveShortcut(tool.id, parsed.value);
        if (!result.success) {
          pushFeedback({
            type: 'error',
            message: result.error ?? saveFailedMessage,
          });
          return;
        }

        pushFeedback({
          type: 'success',
          message: t('settings.shortcutSettings.saved', {
            defaultValue: isKo ? '저장됨' : 'Saved',
          }),
        });
      } catch (error) {
        console.error('Failed to update shortcut:', error);
        pushFeedback({
          type: 'error',
          message: saveFailedMessage,
        });
      } finally {
        setIsSaving(false);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [isListening, isKo, onSaveShortcut, pushFeedback, saveFailedMessage, t, tool.id]);

  const startCapture = React.useCallback(() => {
    setIsListening(true);
    pushFeedback({
      type: 'info',
      message: t('settings.shortcutSettings.captureHint', {
        defaultValue: isKo
          ? '키 조합을 누르세요. (Esc: 취소)'
          : 'Press a key combo. (Esc to cancel)',
      }),
    });
  }, [isKo, pushFeedback, t]);

  const cancelCapture = React.useCallback(() => {
    setIsListening(false);
    pushFeedback({
      type: 'info',
      message: t('settings.shortcutSettings.captureCancelled', {
        defaultValue: isKo ? '입력을 취소했습니다.' : 'Capture cancelled.',
      }),
    });
  }, [isKo, pushFeedback, t]);

  const clearShortcut = React.useCallback(async () => {
    if (isListening) {
      setIsListening(false);
    }

    setIsSaving(true);

    try {
      const result = await onSaveShortcut(tool.id, null);
      if (!result.success) {
        pushFeedback({
          type: 'error',
          message: result.error ?? saveFailedMessage,
        });
        return;
      }

      pushFeedback({
        type: 'success',
        message: t('settings.shortcutSettings.cleared', {
          defaultValue: isKo ? '해제됨' : 'Cleared',
        }),
      });
    } catch (error) {
      console.error('Failed to clear shortcut:', error);
      pushFeedback({
        type: 'error',
        message: saveFailedMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [isListening, isKo, onSaveShortcut, pushFeedback, saveFailedMessage, t, tool.id]);

  const hasShortcut = typeof shortcut === 'string' && shortcut.trim().length > 0;
  const shortcutLabel = hasShortcut ? formatShortcutLabel(shortcut) : noneLabel;

  const kbdLabel = isListening
    ? t('settings.shortcutSettings.listening', {
        defaultValue: isKo ? '입력 대기…' : 'Listening…',
      })
    : shortcutLabel;

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
            disabled={isSaving}
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
            disabled={isSaving}
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
}
