import { useTranslation } from 'react-i18next';

/**
 * Translated text component - renders translated text
 * @example <T key="common.save" />
 * @example <T key="app.activeCount" values={{ count: 5 }} />
 */
export function T({ key, values }: { key: string; values?: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <>{t(key, values)}</>;
}

/**
 * Translated label component
 * @example <LabelT key="settings.language.label" htmlFor="language" />
 */
export function LabelT({
  key,
  values,
  ...props
}: {
  key: string;
  values?: Record<string, unknown>;
} & Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'children'>) {
  const { t } = useTranslation();
  return <label {...props}>{t(key, values)}</label>;
}
