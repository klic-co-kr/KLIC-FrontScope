// src/hooks/useTranslations.ts
// Translation hook wrapper for accessibility components

import { useTranslation } from 'react-i18next';

/**
 * Translation hook wrapper
 * Provides consistent interface for translation across components
 */
export function useTranslations() {
  const { t } = useTranslation();
  return { t };
}
