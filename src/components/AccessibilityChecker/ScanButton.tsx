// src/components/AccessibilityChecker/ScanButton.tsx
// Scan Button - Triggers accessibility scan

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ScanButtonProps {
  isScanning: boolean;
  isComplete: boolean;
  onScan: () => void;
}

export function ScanButton({ isScanning, isComplete, onScan }: ScanButtonProps) {
  const { t: translate } = useTranslations();

  return (
    <Button
      onClick={onScan}
      disabled={isScanning}
      variant={isComplete ? 'outline' : 'default'}
      className="w-full"
    >
      {isScanning ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {translate('accessibility.scanning')}
        </>
      ) : isComplete ? (
        <>
          <span className="mr-2">↻</span>
          {translate('accessibility.rescan')}
        </>
      ) : (
        <>
          <span className="mr-2">⚡</span>
          {translate('accessibility.scan')}
        </>
      )}
    </Button>
  );
}
