import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { NetworkRequest, ResourceType, NetworkStats } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { RESOURCE_NETWORK_MESSAGES } from '../../constants/messages';
import { sendMessageToActiveTab, resolveActiveTabId } from './activeTabMessaging';
import {
  analyzeNetworkRequests,
  createWaterfall,
  groupRequestsByType,
  filterRequests,
  getSlowRequests,
  getFailedRequests,
  getLargeRequests,
  calculatePerformanceScore,
} from '../../utils/resourceNetwork/network/networkAnalyzer';
import { extractDomain } from '../../utils/resourceNetwork/helpers';

function createEmptyByTypeStats(): NetworkStats['byType'] {
  return {
    document: { count: 0, totalSize: 0, avgDuration: 0 },
    stylesheet: { count: 0, totalSize: 0, avgDuration: 0 },
    script: { count: 0, totalSize: 0, avgDuration: 0 },
    image: { count: 0, totalSize: 0, avgDuration: 0 },
    font: { count: 0, totalSize: 0, avgDuration: 0 },
    xhr: { count: 0, totalSize: 0, avgDuration: 0 },
    fetch: { count: 0, totalSize: 0, avgDuration: 0 },
    websocket: { count: 0, totalSize: 0, avgDuration: 0 },
    other: { count: 0, totalSize: 0, avgDuration: 0 },
  };
}

function mergeRequests(existing: NetworkRequest[], incoming: NetworkRequest[]): NetworkRequest[] {
  const map = new Map<string, NetworkRequest>();

  for (const request of existing) {
    map.set(request.id, request);
  }

  for (const request of incoming) {
    map.set(request.id, request);
  }

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

function buildNetworkStats(requests: NetworkRequest[]): NetworkStats {
  const byType = createEmptyByTypeStats();
  let totalSize = 0;
  let totalDuration = 0;
  let cacheHits = 0;

  for (const request of requests) {
    byType[request.type].count += 1;
    byType[request.type].totalSize += request.size;
    totalSize += request.size;
    totalDuration += request.duration;
    if (request.cached) {
      cacheHits += 1;
    }
  }

  for (const type of Object.keys(byType) as ResourceType[]) {
    const count = byType[type].count;
    byType[type].avgDuration = count > 0
      ? requests
        .filter((request) => request.type === type)
        .reduce((sum, request) => sum + request.duration, 0) / count
      : 0;
  }

  const failedRequests = getFailedRequests(requests);
  const slowRequests = getSlowRequests(requests);

  return {
    totalRequests: requests.length,
    totalSize,
    totalDuration,
    byType,
    failedRequests,
    slowRequests,
    cacheHits,
    cacheMisses: requests.length - cacheHits,
  };
}

export function useNetworkMonitor() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);
  const activeTabIdRef = useRef<number | null>(null);

  const refreshRequests = useCallback(async () => {
    try {
      const tabId = await resolveActiveTabId();
      activeTabIdRef.current = tabId;

      const response = await sendMessageToActiveTab<{
        success?: boolean;
        data?: { requests?: NetworkRequest[] };
        error?: string;
      }>({
        action: RESOURCE_NETWORK_MESSAGES.NETWORK_COLLECT,
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to collect network requests');
      }

      const initialRequests = Array.isArray(response.data?.requests)
        ? response.data.requests
        : [];

      setRequests(mergeRequests([], initialRequests));
    } catch (error) {
      console.error('Failed to refresh network requests:', error);
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    try {
      const tabId = await resolveActiveTabId();
      activeTabIdRef.current = tabId;

      const activateResponse = await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
        action: RESOURCE_NETWORK_MESSAGES.ACTIVATE,
      });

      if (!activateResponse?.success) {
        throw new Error(activateResponse?.error || 'Failed to activate network monitoring');
      }

      await refreshRequests();
      setIsMonitoring(true);
    } catch (error) {
      console.error('Failed to start network monitoring:', error);
      setIsMonitoring(false);
    }
  }, [refreshRequests]);

  const stopMonitoring = useCallback(async () => {
    try {
      await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
        action: RESOURCE_NETWORK_MESSAGES.DEACTIVATE,
      });
    } catch (error) {
      console.error('Failed to stop network monitoring:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  useEffect(() => {
    if (!isMonitoring || typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
      return;
    }

    const handleRuntimeMessage = (
      message: { action?: string; data?: { requests?: NetworkRequest[] } },
      sender: chrome.runtime.MessageSender
    ) => {
      if (
        message.action !== RESOURCE_NETWORK_MESSAGES.NETWORK_COLLECT
        && message.action !== RESOURCE_NETWORK_MESSAGES.NETWORK_UPDATE
      ) {
        return;
      }

      if (
        typeof activeTabIdRef.current === 'number'
        && typeof sender.tab?.id === 'number'
        && sender.tab.id !== activeTabIdRef.current
      ) {
        return;
      }

      const incomingRequests = Array.isArray(message.data?.requests)
        ? message.data.requests
        : [];

      if (incomingRequests.length === 0) {
        return;
      }

      setRequests((previous) => mergeRequests(previous, incomingRequests));
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
  }, [isMonitoring]);

  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      refreshIntervalRef.current = window.setInterval(() => {
        void refreshRequests();
      }, 1000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, isMonitoring, refreshRequests]);

  const filteredRequests = filterRequests(requests, {
    type: selectedType === 'all' ? undefined : selectedType,
    searchQuery: searchQuery || undefined,
  });

  const domainFiltered =
    selectedDomain === 'all'
      ? filteredRequests
      : filteredRequests.filter((req) => extractDomain(req.url) === selectedDomain);

  const stats = useMemo(() => buildNetworkStats(requests), [requests]);

  const analysis = analyzeNetworkRequests(requests);

  const performanceScore = calculatePerformanceScore(analysis);

  const waterfall = createWaterfall(requests);

  const domains = Array.from(
    new Set(requests.map((req) => extractDomain(req.url)))
  ).sort();

  const requestsByType = groupRequestsByType(requests);

  const slowRequests = getSlowRequests(requests);

  const failedRequests = getFailedRequests(requests);

  const largeRequests = getLargeRequests(requests);

  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  }, []);

  const removeFailedRequests = useCallback(() => {
    setRequests((prev) => prev.filter((req) => req.status < 400 && req.status !== 0));
  }, []);

  const getTypeCount = useCallback(
    (type: ResourceType): number => {
      return requestsByType[type]?.length || 0;
    },
    [requestsByType]
  );

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get([
            STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
          ]);
          const existing = result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] || {};

          await chrome.storage.local.set({
            [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: {
              ...existing,
              network: {
                captureRequests: isMonitoring,
              },
            },
          });
        }
      } catch (error) {
        console.error('Failed to save network settings:', error);
      }
    };

    void saveSettings();
  }, [isMonitoring]);

  return {
    requests,
    filteredRequests: domainFiltered,
    isMonitoring,
    selectedType,
    selectedDomain,
    searchQuery,
    autoRefresh,

    stats,
    analysis,
    performanceScore,
    waterfall,
    domains,
    requestsByType,
    slowRequests,
    failedRequests,
    largeRequests,

    startMonitoring,
    stopMonitoring,
    refreshRequests,
    clearRequests,
    removeRequest,
    removeFailedRequests,

    setSelectedType,
    setSelectedDomain,
    setSearchQuery,
    getTypeCount,
    toggleAutoRefresh,
  };
}
