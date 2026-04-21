// src/components/Screenshot/CapturePanel.tsx
/**
 * CapturePanel — Refactored from ScreenshotPanel
 * - Generic capture functionality (screenshot ↔ GIF recording)
 * - Uses Gallery/Settings sub-tabs for management
 * - Uses GifRecordingTab for GIF recording
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GifRecordingTab } from './GifRecordingTab';
import { FullPageScreenshotTab } from './FullPageScreenshotTab';

export function CapturePanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'screenshot' | 'gif'>('screenshot');

  return (
    <Card className="bg-transparent border-0 shadow-lg w-full">
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="screenshot">{t('tools.screenshot.name')}</TabsTrigger>
            <TabsTrigger value="gif">{t('gifRecording.title')}</TabsTrigger>
          </TabsList>

          <TabsContent value="screenshot">
            <FullPageScreenshotTab />
          </TabsContent>

          <TabsContent value="gif">
            <GifRecordingTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
