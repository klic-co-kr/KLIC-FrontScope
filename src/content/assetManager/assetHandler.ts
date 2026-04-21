/// <reference types="chrome" />

import { t as translate } from '../../i18n/core';

/**
 * Asset Manager Handler
 *
 * 페이지에서 이미지 에셋을 추출하고 다운로드/복사 기능 제공
 */

async function translateMessage(
    key: string,
    fallback: string,
    options?: Record<string, unknown>
): Promise<string> {
    try {
        const value = await translate(key, options);
        return value && value !== key ? value : fallback;
    } catch {
        return fallback;
    }
}

// Helper: Get CSS selector
function getCssSelector(element: HTMLElement): string {
    if (element.id) {
        return `#${element.id}`;
    }

    if (element.className) {
        const classes = element.className.split(' ').filter((c: string) => c.trim());
        if (classes.length > 0) {
            return `${element.tagName.toLowerCase()}.${classes[0]}`;
        }
    }

    return element.tagName.toLowerCase();
}

// Helper: Get format from URL
function getFormatFromUrl(url: string): string | undefined {
    if (url.startsWith('data:')) {
        const match = url.match(/^data:image\/([a-z+]+);/);
        return match ? match[1] : undefined;
    }

    const match = url.match(/\.([a-z]+)(?:\?|$)/i);
    return match ? match[1].toLowerCase() : undefined;
}

// Helper: Generate UUID
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Helper: Extract from IMG element
function extractFromImg(img: HTMLImageElement) {
    const url = img.src;
    if (!url || url === window.location.href) return null;

    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy');
    const finalUrl = dataSrc || url;

    const dimensions = {
        width: img.naturalWidth || img.offsetWidth,
        height: img.naturalHeight || img.offsetHeight,
    };

    const type = dimensions.width <= 32 && dimensions.height <= 32 ? 'icon' : 'img';

    return {
        id: generateUUID(),
        url: finalUrl,
        type,
        source: dataSrc ? 'data-uri' : 'src',
        dimensions,
        format: getFormatFromUrl(finalUrl),
        element: {
            tagName: img.tagName.toLowerCase(),
            selector: getCssSelector(img),
            alt: img.alt || undefined,
        },
        metadata: {
            isLazyLoaded: !!dataSrc,
            isBackgroundImage: false,
            isDataUri: finalUrl.startsWith('data:'),
            isOptimized: false,
            aspectRatio: dimensions.width > 0 ? dimensions.height / dimensions.width : 0,
        },
    };
}

// Helper: Extract background image
function extractBackgroundImage(element: HTMLElement) {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;

    if (!backgroundImage || backgroundImage === 'none') return null;

    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (!match) return null;

    const url = match[1];
    const dimensions = {
        width: element.offsetWidth,
        height: element.offsetHeight,
    };

    return {
        id: generateUUID(),
        url,
        type: 'background',
        source: 'background-image',
        dimensions,
        format: getFormatFromUrl(url),
        element: {
            tagName: element.tagName.toLowerCase(),
            selector: getCssSelector(element),
        },
        metadata: {
            isLazyLoaded: false,
            isBackgroundImage: true,
            isDataUri: url.startsWith('data:'),
            isOptimized: false,
            aspectRatio: dimensions.width > 0 ? dimensions.height / dimensions.width : 0,
        },
    };
}

// Helper: Remove duplicates
function removeDuplicates<T extends { url: string }>(assets: T[]): T[] {
    const seen = new Set();
    return assets.filter(asset => {
        const key = asset.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Handle asset extraction
export async function handleAssetExtract(settings: { includeBackgrounds?: boolean; includeIcons?: boolean }) {
    type AssetItem = { url: string; dimensions: { width: number; height: number }; type: string; format?: string };
    const assets: AssetItem[] = [];

    const images = document.querySelectorAll('img');
    for (const img of Array.from(images)) {
        const asset = extractFromImg(img as HTMLImageElement);
        if (asset) assets.push(asset);
    }

    if (settings?.includeBackgrounds !== false) {
        const elements = document.querySelectorAll('*');
        for (const element of Array.from(elements)) {
            if (element instanceof HTMLElement) {
                const asset = extractBackgroundImage(element);
                if (asset) {
                    if (settings?.includeIcons === false) {
                        if (asset.dimensions.width <= 32 && asset.dimensions.height <= 32) {
                            continue;
                        }
                    }
                    assets.push(asset);
                }
            }
        }
    }

    const uniqueAssets = removeDuplicates(assets);

    const stats = {
        totalCount: uniqueAssets.length,
        totalSize: 0,
        byType: {} as Record<string, number>,
        byFormat: {} as Record<string, number>,
    };

    for (const asset of uniqueAssets) {
        stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
        if (asset.format) {
            stats.byFormat[asset.format] = (stats.byFormat[asset.format] || 0) + 1;
        }
    }

    return {
        id: generateUUID(),
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        assets: uniqueAssets,
        stats,
    };
}

// Handle download multiple
export async function handleAssetDownloadMultiple(assets: { url: string; id: string }[]) {
    for (const asset of assets) {
        const link = document.createElement('a');
        link.href = asset.url;
        link.download = `asset-${asset.id.slice(0, 8)}`;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Handle download ZIP
export async function handleAssetDownloadZip(
    _assets: unknown[],
    showToast: (message: string, color?: string) => void
) {
    showToast(await translateMessage('content.assetZipNotSupported', 'ZIP download coming soon'), '#F59E0B');
}

// Handle copy to clipboard
export async function handleAssetCopyClipboard(
    assets: { url: string }[],
    showToast: (message: string, color?: string) => void
) {
    const urls = assets.map(a => a.url).join('\n');
    await navigator.clipboard.writeText(urls);
    showToast(
        await translateMessage('content.assetUrlsCopied', `Copied ${assets.length} URLs`, { count: assets.length }),
        '#10B981'
    );
}
