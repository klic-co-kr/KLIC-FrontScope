// src/components/AccessibilityChecker/ExportButton.tsx
// Export Button - Export accessibility report in various formats

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Code, Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ExportButtonProps {
  onExport: (format: 'json' | 'csv' | 'html') => void;
  disabled?: boolean;
  isExporting?: boolean;
}

export function ExportButton({ onExport, disabled = true, isExporting = false }: ExportButtonProps) {
  const { t: translate } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {translate('accessibility.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onExport('json')}>
          <Code className="w-4 h-4 mr-2" />
          {translate('accessibility.exportJSON')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          {translate('accessibility.exportCSV')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('html')}>
          <Download className="w-4 h-4 mr-2" />
          {translate('accessibility.exportHTML')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
