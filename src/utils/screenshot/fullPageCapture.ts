import { resolveActiveTabId, sendMessageToActiveTab } from '@/hooks/resourceNetwork/activeTabMessaging';

type PageDimensions = {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
};

type DimensionsResponse = {
  success?: boolean;
  dimensions?: PageDimensions;
  error?: string;
};

type FullPageCaptureResponse = {
  success?: boolean;
  captures?: string[];
  error?: string;
};

type ScrollPosition = {
  x: number;
  y: number;
};

export type FullPageCaptureResult = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function captureFullPageScreenshot(): Promise<FullPageCaptureResult> {
  const tabId = await resolveActiveTabId();
  if (!tabId) {
    throw new Error('No active tab found');
  }

  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) {
    throw new Error('Active tab is not available');
  }

  const dimensionsResponse = await sendMessageToActiveTab<DimensionsResponse>({
    action: 'GET_PAGE_DIMENSIONS',
  });

  if (!dimensionsResponse?.success || !dimensionsResponse.dimensions) {
    throw new Error(dimensionsResponse?.error || 'Failed to read page dimensions');
  }

  const dimensions = dimensionsResponse.dimensions;
  const scrollPositions = buildScrollPositions(dimensions);

  let capturesResponse: FullPageCaptureResponse | undefined;
  try {
    capturesResponse = await chrome.runtime.sendMessage({
      action: 'CAPTURE_FULL_PAGE',
      tabId,
      windowId: tab.windowId,
      scrollPositions,
    }) as FullPageCaptureResponse;
  } finally {
    await sendMessageToActiveTab({
      action: 'SCROLL_TO',
      x: dimensions.scrollX,
      y: dimensions.scrollY,
    }).catch(() => undefined);
  }

  if (!capturesResponse?.success || !Array.isArray(capturesResponse.captures) || capturesResponse.captures.length === 0) {
    throw new Error(capturesResponse?.error || 'Full page capture failed');
  }

  const dataUrl = await stitchCaptures(capturesResponse.captures, dimensions, scrollPositions);

  return {
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}

function buildScrollPositions(dimensions: PageDimensions): ScrollPosition[] {
  const positions: ScrollPosition[] = [];

  for (let y = 0; y < dimensions.height; y += dimensions.viewportHeight) {
    for (let x = 0; x < dimensions.width; x += dimensions.viewportWidth) {
      positions.push({ x, y });
    }
  }

  return positions;
}

async function stitchCaptures(
  captures: string[],
  dimensions: PageDimensions,
  scrollPositions: ScrollPosition[]
): Promise<string> {
  const images = await Promise.all(captures.map(loadImage));
  const firstImage = images[0];
  const dpr = firstImage.width > 0 && dimensions.viewportWidth > 0
    ? firstImage.width / dimensions.viewportWidth
    : window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(dimensions.width * dpr));
  canvas.height = Math.max(1, Math.round(dimensions.height * dpr));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create canvas context');
  }

  const drawCount = Math.min(images.length, scrollPositions.length);
  for (let index = 0; index < drawCount; index += 1) {
    const image = images[index];
    const position = scrollPositions[index];

    const targetX = Math.round(position.x * dpr);
    const targetY = Math.round(position.y * dpr);
    const targetWidth = Math.round(Math.min(dimensions.viewportWidth, dimensions.width - position.x) * dpr);
    const targetHeight = Math.round(Math.min(dimensions.viewportHeight, dimensions.height - position.y) * dpr);

    context.drawImage(
      image,
      0,
      0,
      targetWidth,
      targetHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    );
  }

  return canvas.toDataURL('image/png');
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode captured image'));
    image.src = dataUrl;
  });
}
