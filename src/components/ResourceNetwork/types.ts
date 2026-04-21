/**
 * Types for Resource Network Components
 */

import { useStorageCleaner } from '../../hooks/resourceNetwork/useStorageCleaner';
import { useAnimationInspector } from '../../hooks/resourceNetwork/useAnimationInspector';
import { useNetworkMonitor } from '../../hooks/resourceNetwork/useNetworkMonitor';
import { useCacheManager } from '../../hooks/resourceNetwork/useCacheManager';

export interface StorageCleanerPanelProps {
  storage: ReturnType<typeof useStorageCleaner>;
}

export interface AnimationInspectorPanelProps {
  animation: ReturnType<typeof useAnimationInspector>;
}

export interface NetworkMonitorPanelProps {
  network: ReturnType<typeof useNetworkMonitor>;
}

export interface CacheManagerPanelProps {
  cache: ReturnType<typeof useCacheManager>;
}
