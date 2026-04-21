/**
 * Asset Stats
 * Displays statistics about extracted assets
 */

import { useMemo } from 'react';
import { TrendingUp, Package, FileType, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AssetCollection } from '../../../types/assetManager';
import { formatBytes } from '../../../utils/assetManager/imageMeasure';
import { useAssetStats } from '../../../hooks/assetManager';

interface AssetStatsProps {
  collection: AssetCollection;
}

export function AssetStats({ collection }: AssetStatsProps) {
  const { t } = useTranslation();
  const stats = useAssetStats(collection.assets);

  // Format type labels
  const typeLabels: Record<string, string> = {
    img: t('assetManager.stats.typeLabels.img'),
    background: t('assetManager.stats.typeLabels.background'),
    picture: t('assetManager.stats.typeLabels.picture'),
    svg: t('assetManager.stats.typeLabels.svg'),
    icon: t('assetManager.stats.typeLabels.icon'),
    other: t('assetManager.stats.typeLabels.other'),
  };

  // Get top formats
  const topFormats = useMemo(() => {
    return stats.formatDistribution.slice(0, 5);
  }, [stats.formatDistribution]);

  // Get top types
  const topTypes = useMemo(() => {
    return stats.typeDistribution;
  }, [stats.typeDistribution]);

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package className="w-4 h-4" />}
          label={t('assetManager.stats.totalAssets')}
          value={stats.totalAssets}
          color="amber"
        />
        <StatCard
          icon={<HardDrive className="w-4 h-4" />}
          label={t('assetManager.stats.totalSize')}
          value={formatBytes(stats.totalSize)}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label={t('assetManager.stats.averageSize')}
          value={formatBytes(stats.averageSize)}
          color="green"
        />
        <StatCard
          icon={<FileType className="w-4 h-4" />}
          label={t('assetManager.stats.formatTypes')}
          value={Object.keys(stats.byFormat).length}
          color="purple"
        />
      </div>

      {/* Largest Asset */}
      {stats.largestAsset && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">{t('assetManager.stats.largestFile')}</div>
          <div className="flex items-center justify-between">
            <div className="flex-1 truncate">
              <div className="text-sm font-medium truncate">
                {stats.largestAsset.url}
              </div>
              <div className="text-xs text-gray-500">
                {formatBytes(stats.largestAsset.size)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type Distribution */}
      <div>
        <h4 className="text-xs font-medium text-gray-600 mb-2">{t('assetManager.stats.typeDistribution')}</h4>
        <div className="space-y-2">
          {topTypes.map((item) => (
            <TypeBar
              key={item.type}
              label={typeLabels[item.type] || item.type}
              count={item.count}
              percentage={item.percentage}
              color={getTypeColor(item.type)}
              countLabel={t('assetManager.stats.countLabel', { count: item.count })}
            />
          ))}
        </div>
      </div>

      {/* Format Distribution */}
      <div>
        <h4 className="text-xs font-medium text-gray-600 mb-2">{t('assetManager.stats.formatDistribution')}</h4>
        <div className="space-y-2">
          {topFormats.map((item) => (
            <FormatBar
              key={item.format}
              format={item.format}
              count={item.count}
              percentage={item.percentage}
              countLabel={t('assetManager.stats.countLabel', { count: item.count })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'amber' | 'blue' | 'green' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

interface TypeBarProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
  countLabel: string;
}

function TypeBar({ label, percentage, color, countLabel }: TypeBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-600">{label}</div>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-16 text-xs text-gray-600 text-right">{countLabel}</div>
    </div>
  );
}

interface FormatBarProps {
  format: string;
  count: number;
  percentage: number;
  countLabel: string;
}

function FormatBar({ format, percentage, countLabel }: FormatBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-600 uppercase">{format}</div>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-16 text-xs text-gray-600 text-right">{countLabel}</div>
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    img: 'bg-amber-500',
    background: 'bg-blue-500',
    picture: 'bg-green-500',
    svg: 'bg-purple-500',
    icon: 'bg-yellow-500',
    other: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
}
