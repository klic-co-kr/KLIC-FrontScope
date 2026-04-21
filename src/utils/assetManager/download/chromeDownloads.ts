import { ImageAsset } from '../../../types/assetManager';

/**
 * Chrome Downloads API를 사용한 다운로드
 */
export async function downloadWithChromeAPI(
  asset: ImageAsset,
  filename: string
): Promise<boolean> {
  try {
    // Data URI는 지원 안 됨
    if (asset.url.startsWith('data:')) {
      return false;
    }

    // 다운로드 시작
    const downloadId = await chrome.downloads.download({
      url: asset.url,
      filename,
      saveAs: false,
    });

    return downloadId !== undefined;
  } catch (error) {
    console.error('Failed to download with Chrome API:', error);
    return false;
  }
}

/**
 * 다운로드 진행 상태 모니터링
 */
export function monitorDownload(
  downloadId: number,
  callback: (state: chrome.downloads.State) => void
): void {
  const listener = (delta: chrome.downloads.DownloadDelta) => {
    if (delta.id === downloadId && delta.state && delta.state.current) {
      callback(delta.state.current as chrome.downloads.State);

      if (delta.state.current === 'complete' || delta.state.current === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
      }
    }
  };

  chrome.downloads.onChanged.addListener(listener);
}
