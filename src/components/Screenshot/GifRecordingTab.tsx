// src/components/Screenshot/GifRecordingTab.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, SquareDashed, MousePointer } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGifSettings } from '@/hooks/useGifSettings';
import { useGifRecording } from '@/hooks/useGifRecording';
import { assessGifSizeBudget, estimateGifSize } from '@/utils/gif/estimateGifSize';
import { MESSAGE_ACTIONS } from '@/constants/messages';
import type { GIFQuality, GIFQualityProfile, GIFWidth, RecordingMode } from '@/types/recording';

export function GifRecordingTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useGifSettings();
  const { state: recordingState, startRecording, stopRecording } = useGifRecording({ settings });
  const [isStopping, setIsStopping] = useState(false);
  const [encodedGifUrl, setEncodedGifUrl] = useState<string | null>(null);
  const [encodingProgress, setEncodingProgress] = useState(0);
  const [memoryNoticeKey, setMemoryNoticeKey] = useState<string | null>(null);

  // Lock settings during recording/selecting/encoding (L1)
  const isLocked = recordingState.isRecording || recordingState.isSelecting || recordingState.isEncoding;

  // Handle encoding completion from background
  useEffect(() => {
    const handleMessage = (message: { action: string; data?: { success?: boolean; gifDataUrl?: string; percent?: number; reason?: string } }) => {
      if (message.action === 'GIF_ENCODE_COMPLETE') {
        if (message.data?.success && message.data?.gifDataUrl) {
          setEncodedGifUrl(message.data.gifDataUrl);
        }
      }

      if (message.action === MESSAGE_ACTIONS.GIF_RECORDING_MEMORY_ADJUSTED) {
        setMemoryNoticeKey('gifRecording.memoryAdjusted');
      }

      if (message.action === 'GIF_RECORDING_AUTO_STOPPED' && message.data?.reason === 'memory') {
        setMemoryNoticeKey('gifRecording.memoryAutoStopped');
      }

      if (message.action === 'GIF_ENCODING_PROGRESS') {
        setEncodingProgress(message.data?.percent ?? 0);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleStart = async () => {
    setEncodedGifUrl(null);
    setEncodingProgress(0);
    setMemoryNoticeKey(null);
    await startRecording();
  };

  const handleStop = async () => {
    setIsStopping(true);
    await stopRecording();
    setTimeout(() => setIsStopping(false), 500);
  };

  const handleDownload = async () => {
    if (!encodedGifUrl) return;
    chrome.downloads.download({ url: encodedGifUrl, saveAs: true });
    setEncodedGifUrl(null);
  };

  const estimatedSize = estimateGifSize(settings);
  const budget = assessGifSizeBudget(settings);

  const modeButtons: { mode: RecordingMode; icon: typeof Monitor; labelKey: string }[] = [
    { mode: 'fullscreen', icon: Monitor, labelKey: 'gifRecording.modeFullscreen' },
    { mode: 'selection', icon: SquareDashed, labelKey: 'gifRecording.modeSelection' },
    { mode: 'element', icon: MousePointer, labelKey: 'gifRecording.modeElement' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('gifRecording.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode selection */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {modeButtons.map(({ mode, icon: Icon, labelKey }) => (
              <Button
                key={mode}
                variant={settings.mode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateSettings({ mode })}
                disabled={isLocked}
                className="flex-1 gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {t(labelKey)}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="duration">{t('gifRecording.duration')}</Label>
              <Slider
                id="duration"
                min={3}
                max={30}
                step={1}
                value={[settings.duration]}
                onValueChange={(v) => updateSettings({ duration: v[0] })}
                disabled={isLocked}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">{settings.duration}s</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="fps">{t('gifRecording.fps')}</Label>
            <Select value={settings.fps.toString()} onValueChange={(v) => updateSettings({ fps: Number(v) })} disabled={isLocked}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t('gifRecording.fps5')}</SelectItem>
                <SelectItem value="10">{t('gifRecording.fps10')}</SelectItem>
                <SelectItem value="15">{t('gifRecording.fps15')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="quality">{t('gifRecording.quality')}</Label>
            <Select value={settings.quality} onValueChange={(v) => updateSettings({ quality: v as GIFQuality })} disabled={isLocked}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('gifRecording.qualityLow')}</SelectItem>
                <SelectItem value="medium">{t('gifRecording.qualityMedium')}</SelectItem>
                <SelectItem value="high">{t('gifRecording.qualityHigh')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="qualityProfile">{t('gifRecording.qualityProfile')}</Label>
            <Select
              value={settings.qualityProfile}
              onValueChange={(v) => updateSettings({ qualityProfile: v as GIFQualityProfile })}
              disabled={isLocked}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">{t('gifRecording.profileBalanced')}</SelectItem>
                <SelectItem value="highFidelity">{t('gifRecording.profileHighFidelity')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="width">{t('gifRecording.width')}</Label>
            <Select value={settings.width.toString()} onValueChange={(v) => updateSettings({ width: Number(v) as GIFWidth })} disabled={isLocked}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="320">{t('gifRecording.width320')}</SelectItem>
                <SelectItem value="640">{t('gifRecording.width640')}</SelectItem>
                <SelectItem value="800">{t('gifRecording.width800')}</SelectItem>
                <SelectItem value="960">{t('gifRecording.width960')}</SelectItem>
                <SelectItem value="1280">{t('gifRecording.width1280')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('gifRecording.recording')}</span>
              <span className="text-xs text-muted-foreground">
                {recordingState.isRecording && (
                  <span className="text-destructive-foreground animate-pulse">
                    ● REC {recordingState.elapsed.toFixed(1)}s
                  </span>
                )}
                {recordingState.isSelecting && (
                  <span className="text-warning-foreground animate-pulse">
                    {t('gifRecording.selecting')}
                  </span>
                )}
                {recordingState.isEncoding && (
                  <span className="flex items-center gap-2">
                    <Progress value={encodingProgress} className="w-24 h-2" />
                    <span className="text-sm text-muted-foreground ml-2">{t('gifRecording.encoding', { percent: encodingProgress })}</span>
                  </span>
                )}
                {!recordingState.isRecording && !recordingState.isEncoding && !recordingState.isSelecting && (
                  <span className="text-muted-foreground">{t('gifRecording.ready')}</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{t('gifRecording.estimated', { size: estimatedSize })}</span>
            </div>

            {budget.status !== 'ok' && (
              <div className={budget.status === 'critical' ? 'text-xs text-destructive' : 'text-xs text-warning'}>
                {t(`gifRecording.budget.${budget.status}`, {
                  estimated: budget.estimatedSizeMb,
                  budget: budget.targetBudgetMb,
                })}
                {budget.suggestion && (
                  <span>
                    {' '}
                    {t('gifRecording.budget.suggestion', {
                      width: budget.suggestion.width,
                      fps: budget.suggestion.fps,
                      quality: t(`gifRecording.budget.quality.${budget.suggestion.quality}`),
                    })}
                  </span>
                )}
              </div>
            )}

            {memoryNoticeKey && (
              <div className="text-xs text-warning">{t(memoryNoticeKey)}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {recordingState.isRecording ? (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  disabled={isStopping}
                  className="flex-1"
                >
                  {isStopping ? t('gifRecording.stopping') : t('gifRecording.stopRecording')}
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={recordingState.isEncoding || recordingState.isSelecting}
                  className="flex-1"
                >
                  {recordingState.isSelecting ? t('gifRecording.selecting') : t('gifRecording.startRecording')}
                </Button>
              )}

              <Button
                onClick={handleDownload}
                disabled={!encodedGifUrl}
                variant="outline"
              >
                {t('gifRecording.downloadGif')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
