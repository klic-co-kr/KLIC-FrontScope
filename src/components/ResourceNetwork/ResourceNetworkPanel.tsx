/**
 * Resource Network Panel Component
 *
 * 리소스 및 네트워크 최적화 도구 메인 패널
 */

import React, { useState } from 'react';
import { useStorageCleaner } from '../../hooks/resourceNetwork/useStorageCleaner';
import { useAnimationInspector } from '../../hooks/resourceNetwork/useAnimationInspector';
import { useNetworkMonitor } from '../../hooks/resourceNetwork/useNetworkMonitor';
import { useCacheManager } from '../../hooks/resourceNetwork/useCacheManager';
import { StorageCleanerPanel } from './StorageCleanerPanel';
import { AnimationInspectorPanel } from './AnimationInspectorPanel';
import { NetworkMonitorPanel } from './NetworkMonitorPanel';
import { CacheManagerPanel } from './CacheManagerPanel';
import { formatBytes } from '../../utils/resourceNetwork/helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type TabType = 'storage' | 'animation' | 'network' | 'cache';

export function ResourceNetworkPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('storage');

  const storage = useStorageCleaner();
  const animation = useAnimationInspector();
  const network = useNetworkMonitor();
  const cache = useCacheManager();

  return (
    <div className="resource-network-panel flex flex-col h-full">
      <div className="panel-header p-4 border-b border-border bg-card">
        <div className="summary-badges flex flex-wrap gap-2">
          <Badge variant="secondary">
            📦 스토리지:{' '}
            {storage.stats ? formatBytes(storage.stats.totalSize) : '-'}
          </Badge>
          <Badge variant="secondary">
            🎬 애니메이션: {animation.animations.length}
          </Badge>
          <Badge variant="secondary">
            🌐 요청: {network.stats.totalRequests}
          </Badge>
          <Badge variant="secondary">
            💾 캐시: {cache.stats ? formatBytes(cache.stats.totalSize) : '-'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="storage">🗑️ 스토리지</TabsTrigger>
          <TabsTrigger value="animation">🎬 애니메이션</TabsTrigger>
          <TabsTrigger value="network">🌐 네트워크</TabsTrigger>
          <TabsTrigger value="cache">💾 캐시</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="storage" className="mt-0">
            <StorageCleanerPanel storage={storage} />
          </TabsContent>
          <TabsContent value="animation" className="mt-0">
            <AnimationInspectorPanel animation={animation} />
          </TabsContent>
          <TabsContent value="network" className="mt-0">
            <NetworkMonitorPanel network={network} />
          </TabsContent>
          <TabsContent value="cache" className="mt-0">
            <CacheManagerPanel cache={cache} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
