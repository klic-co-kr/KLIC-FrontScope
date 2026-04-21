import { ImageAsset } from '../../../types/assetManager';

/**
 * 에셋에서 파일명 추출
 */
export function getFilename(asset: ImageAsset): string {
  try {
    const url = new URL(asset.url);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

    // 파일명이 없으면 생성
    if (!filename || filename.length === 0) {
      return generateFilename(asset);
    }

    // 확장자 확인
    if (!filename.includes('.')) {
      return `${filename}.${asset.format || 'jpg'}`;
    }

    return filename;
  } catch {
    // URL 파싱 실패 시 생성
    return generateFilename(asset);
  }
}

/**
 * 파일명 생성
 */
export function generateFilename(
  asset: ImageAsset,
  pattern: 'original' | 'numbered' | 'hash' = 'original',
  index?: number
): string {
  const extension = asset.format || 'jpg';

  switch (pattern) {
    case 'original':
      return getFilename(asset);

    case 'numbered':
      if (index !== undefined) {
        return `image-${String(index + 1).padStart(3, '0')}.${extension}`;
      }
      return `image.${extension}`;

    case 'hash': {
      const hash = hashString(asset.url);
      return `${hash}.${extension}`;
    }

    default:
      return `image.${extension}`;
  }
}

/**
 * 문자열 해시
 */
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * 파일명 안전화 (특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * 중복 파일명 해결
 */
export function resolveFilenameConflict(
  filename: string,
  existingFilenames: Set<string>
): string {
  if (!existingFilenames.has(filename)) {
    return filename;
  }

  const [name, extension] = splitFilename(filename);
  let counter = 1;
  let newFilename: string;

  do {
    newFilename = `${name}-${counter}.${extension}`;
    counter++;
  } while (existingFilenames.has(newFilename));

  return newFilename;
}

/**
 * 파일명과 확장자 분리
 */
function splitFilename(filename: string): [string, string] {
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1) {
    return [filename, ''];
  }

  const name = filename.substring(0, lastDot);
  const extension = filename.substring(lastDot + 1);

  return [name, extension];
}
