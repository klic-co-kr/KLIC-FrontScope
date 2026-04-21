/**
 * AssetStats Component
 *
 * 에셋 통계 컴포넌트 - 요약 통계 표시
 */

import React, { useMemo } from 'react';
import { AssetStatistics } from '../../hooks/assetManager/useAssetStats';
import {
  BarChart3,
  FileImage,
  HardDrive,
  TrendingUp,
  PieChart,
} from 'lucide-react';

interface AssetStatsProps {
  stats: AssetStatistics;
  compact?: boolean;
}

export const AssetStats: React.FC<AssetStatsProps> = ({ stats, compact = false }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Calculate optimization potential (must be before early return for hooks rules)
  const optimizationPotential = useMemo(() => {
    let potential = 0;
    for (const type in stats.byType) {
      if (type === 'other' || type === 'svg') continue;
      const count = stats.byType[type as keyof typeof stats.byType];
      // Assume 20% potential savings for non-optimized formats
      potential += count * stats.averageSize * 0.2;
    }
    return potential;
  }, [stats]);

  if (compact) {
    return (
      <div className="klic-asset-stats-compact flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileImage className="w-4 h-4" />
          <span className="font-medium">{stats.totalAssets}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <HardDrive className="w-4 h-4" />
          <span className="font-medium">{formatBytes(stats.totalSize)}</span>
        </div>
        {stats.averageSize > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{formatBytes(stats.averageSize)} avg</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="klic-asset-stats bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Statistics</h3>
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Assets */}
        <div className="bg-primary/10 dark:bg-primary/5 rounded-lg p-3">
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileImage className="w-4 h-4" />
            <span className="text-xs font-medium">Total Assets</span>
          </div>
          <div className="text-xl font-bold text-primary">{stats.totalAssets}</div>
        </div>

        {/* Total Size */}
        <div className="bg-purple-500/10 dark:bg-purple-500/5 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs font-medium">Total Size</span>
          </div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {formatBytes(stats.totalSize)}
          </div>
        </div>

        {/* Average Size */}
        <div className="bg-green-500/10 dark:bg-green-500/5 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Average</span>
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {formatBytes(stats.averageSize)}
          </div>
        </div>

        {/* Optimization Potential */}
        {optimizationPotential > 0 && (
          <div className="bg-orange-500/10 dark:bg-orange-500/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
              <PieChart className="w-4 h-4" />
              <span className="text-xs font-medium">Potential Savings</span>
            </div>
            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {formatBytes(optimizationPotential)}
            </div>
          </div>
        )}
      </div>

      {/* Largest & Smallest */}
      {(stats.largestAsset || stats.smallestAsset) && (
        <div className="space-y-2">
          {stats.largestAsset && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground">Largest Asset</span>
              <span className="text-xs font-medium text-foreground">
                {formatBytes(stats.largestAsset.size)}
              </span>
            </div>
          )}
          {stats.smallestAsset && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground">Smallest Asset</span>
              <span className="text-xs font-medium text-foreground">
                {formatBytes(stats.smallestAsset.size)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Type Distribution */}
      {stats.typeDistribution.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">By Type</h4>
          <div className="space-y-2">
            {stats.typeDistribution.slice(0, 5).map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 uppercase">
                  {item.type}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-16 text-right">
                  {item.count} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Distribution */}
      {stats.formatDistribution.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">By Format</h4>
          <div className="flex flex-wrap gap-2">
            {stats.formatDistribution.slice(0, 8).map((item) => (
              <div
                key={item.format}
                className="px-2.5 py-1 bg-muted rounded-md text-xs"
              >
                <span className="font-medium uppercase">{item.format}</span>
                <span className="text-muted-foreground ml-1">
                  {item.count} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetStats;
