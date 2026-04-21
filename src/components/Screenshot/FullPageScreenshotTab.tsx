import { useEffect, useMemo, useState } from 'react';
import { Camera, FileImage, MousePointerClick, ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { captureFullPageScreenshot } from '@/utils/screenshot/fullPageCapture';
import { downloadDataUrl, generateDownloadFilename } from '@/utils/screenshot/downloadHelpers';
import type { CaptureMode, Screenshot } from '@/types/screenshot';
import { sendMessageToActiveTab } from '@/hooks/resourceNetwork/activeTabMessaging';

type RuntimeScreenshotMessage = {
  action?: string;
  screenshot?: Screenshot;
  error?: string;
};

type InteractiveMode = Exclude<CaptureMode, 'full-page'>;

export function FullPageScreenshotTab() {
  const { t } = useTranslation();
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeMode, setActiveMode] = useState<CaptureMode | null>(null);

  useEffect(() => {
    const handleMessage = (message: RuntimeScreenshotMessage) => {
      if (message.action === 'SCREENSHOT_CAPTURE_COMPLETE' && message.screenshot?.dataUrl) {
        const screenshot = message.screenshot;
        const filename = generateDownloadFilename(screenshot.format, `klic-${screenshot.mode}`, screenshot.timestamp);

        downloadDataUrl(screenshot.dataUrl, filename);
        toast.success(t('screenshotCapture.success', {
          width: screenshot.dimensions.width,
          height: screenshot.dimensions.height,
        }));

        setIsCapturing(false);
        setActiveMode(null);
      }

      if (message.action === 'SCREENSHOT_CAPTURE_ERROR') {
        toast.error(message.error || t('screenshotCapture.failed'));
        setIsCapturing(false);
        setActiveMode(null);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [t]);

  const modeCards = useMemo(() => ([
    {
      mode: 'element' as InteractiveMode,
      icon: MousePointerClick,
      titleKey: 'screenshotCapture.elementTitle',
      descriptionKey: 'screenshotCapture.elementDescription',
      buttonKey: 'screenshotCapture.elementButton',
      hintKey: 'screenshotCapture.elementHint',
    },
    {
      mode: 'area' as InteractiveMode,
      icon: ScanLine,
      titleKey: 'screenshotCapture.areaTitle',
      descriptionKey: 'screenshotCapture.areaDescription',
      buttonKey: 'screenshotCapture.areaButton',
      hintKey: 'screenshotCapture.areaHint',
    },
  ]), []);

  const startInteractiveCapture = async (mode: InteractiveMode) => {
    setIsCapturing(true);
    setActiveMode(mode);

    try {
      await sendMessageToActiveTab<void>({
        action: 'SCREENSHOT_START_CAPTURE',
        mode,
        format: 'png',
        quality: 0.92,
        enableAnnotations: false,
      });

      toast.message(t(mode === 'element' ? 'screenshotCapture.elementHint' : 'screenshotCapture.areaHint'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Restricted page')) {
        toast.error(t('screenshotCapture.restricted'));
      } else {
        toast.error(t('screenshotCapture.failed'));
      }

      setIsCapturing(false);
      setActiveMode(null);
    }
  };

  const handleCaptureFullPage = async () => {
    setIsCapturing(true);
    setActiveMode('full-page');

    try {
      const result = await captureFullPageScreenshot();
      const filename = generateDownloadFilename('png', 'klic-fullpage');

      downloadDataUrl(result.dataUrl, filename);
      toast.success(t('screenshotCapture.success', {
        width: result.width,
        height: result.height,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Restricted page')) {
        toast.error(t('screenshotCapture.restricted'));
      } else {
        toast.error(t('screenshotCapture.failed'));
      }
    } finally {
      setIsCapturing(false);
      setActiveMode(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            {t('screenshotCapture.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('screenshotCapture.description')}
          </p>

          {modeCards.map((modeCard) => {
            const Icon = modeCard.icon;
            return (
              <div key={modeCard.mode} className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-foreground" />
                  <div className="text-sm font-semibold text-foreground">{t(modeCard.titleKey)}</div>
                </div>
                <div className="text-xs text-muted-foreground">{t(modeCard.descriptionKey)}</div>

                <Button
                  onClick={() => void startInteractiveCapture(modeCard.mode)}
                  disabled={isCapturing}
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isCapturing && activeMode === modeCard.mode
                    ? t('screenshotCapture.capturing')
                    : t(modeCard.buttonKey)}
                </Button>
              </div>
            );
          })}

          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-foreground" />
              <div className="text-sm font-semibold text-foreground">{t('screenshotCapture.fullPageTitle')}</div>
            </div>
            <div className="text-xs text-muted-foreground">{t('screenshotCapture.fullPageDescription')}</div>

            <Button onClick={() => void handleCaptureFullPage()} disabled={isCapturing} className="w-full gap-2">
              <Camera className="h-4 w-4" />
              {isCapturing && activeMode === 'full-page'
                ? t('screenshotCapture.capturing')
                : t('screenshotCapture.captureButton')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{t('screenshotCapture.escapeHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
