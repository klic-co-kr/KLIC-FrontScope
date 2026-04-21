import type { ImageAsset } from '../../types/assetManager';

export const FORMAT_PRIORITY = [
  'png',
  'jpg',
  'webp',
  'svg',
  'gif',
  'avif',
  'ico',
  'bmp',
  'data-uri',
  'unknown',
];

const FORMAT_ALIAS: Record<string, string> = {
  jpeg: 'jpg',
  'svg+xml': 'svg',
  'image/svg+xml': 'svg',
};

export function normalizeAssetFormat(raw?: string): string | null {
  if (!raw) return null;

  const normalized = raw.toLowerCase().trim();
  const withoutMimePrefix = normalized.startsWith('image/')
    ? normalized.slice('image/'.length)
    : normalized;

  return FORMAT_ALIAS[withoutMimePrefix] ?? withoutMimePrefix;
}

export function inferAssetFormatFromUrl(url: string): string {
  if (url.startsWith('data:image/')) {
    const mime = url.slice('data:image/'.length).split(/[;,]/)[0]?.toLowerCase() || '';
    return normalizeAssetFormat(mime) ?? 'data-uri';
  }

  try {
    const pathname = new URL(url, 'https://klic.local').pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return normalizeAssetFormat(ext) ?? 'unknown';
  } catch {
    const ext = url.split('?')[0]?.split('#')[0]?.split('.').pop()?.toLowerCase();
    return normalizeAssetFormat(ext) ?? 'unknown';
  }
}

export function getAssetFormatKey(asset: Pick<ImageAsset, 'format' | 'url'>): string {
  const explicitFormat = normalizeAssetFormat(asset.format);

  if (explicitFormat && explicitFormat !== 'unknown' && explicitFormat !== 'other' && explicitFormat !== 'data-uri') {
    return explicitFormat;
  }

  const inferredFormat = inferAssetFormatFromUrl(asset.url);
  if (inferredFormat !== 'unknown') {
    return inferredFormat;
  }

  return explicitFormat === 'other' ? 'unknown' : (explicitFormat ?? 'unknown');
}
