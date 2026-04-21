/**
 * Permissions Helper
 *
 * Chrome 권한 요청/확인 기능
 */

/**
 * 권한 요청
 */
export async function requestPermissions(permissions: string[]): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      permissions: permissions as chrome.permissions.Permissions['permissions'],
    });

    if (granted) {
      console.log('Permissions granted:', permissions);
    } else {
      console.log('Permissions denied:', permissions);
    }

    return granted;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

/**
 * 권한 확인
 */
export async function checkPermissions(permissions: string[]): Promise<boolean> {
  try {
    const result = await chrome.permissions.contains({
      permissions: permissions as chrome.permissions.Permissions['permissions'],
    });
    return result;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * 호스트 권한 요청
 */
export async function requestHostPermissions(hosts: string[]): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      origins: hosts,
    });

    if (granted) {
      console.log('Host permissions granted:', hosts);
    } else {
      console.log('Host permissions denied:', hosts);
    }

    return granted;
  } catch (error) {
    console.error('Host permission request error:', error);
    return false;
  }
}

/**
 * 호스트 권한 확인
 */
export async function checkHostPermissions(hosts: string[]): Promise<boolean> {
  try {
    return await chrome.permissions.contains({
      origins: hosts,
    });
  } catch (error) {
    console.error('Host permission check error:', error);
    return false;
  }
}

/**
 * 모든 권한 제거 (개발용/테스트용)
 */
export async function removeAllPermissions(): Promise<boolean> {
  try {
    const result = await chrome.permissions.remove({
      permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    });
    console.log('All permissions removed');
    return result;
  } catch (error) {
    console.error('Remove permissions error:', error);
    return false;
  }
}

/**
 * 현재 모든 권한 가져오기
 */
export async function getAllPermissions(): Promise<chrome.permissions.Permissions> {
  try {
    return await chrome.permissions.getAll();
  } catch (error) {
    console.error('Get all permissions error:', error);
    return { permissions: [], origins: [] };
  }
}

/**
 * 필수 권한 확인
 */
export async function checkRequiredPermissions(): Promise<{
  hasAll: boolean;
  missing: { permissions: string[]; origins: string[] };
}> {
  const requiredPermissions = ['activeTab', 'scripting', 'storage', 'sidePanel'];
  const requiredOrigins = ['<all_urls>'];

  const [hasPermissions, hasOrigins] = await Promise.all([
    checkPermissions(requiredPermissions),
    checkHostPermissions(requiredOrigins),
  ]);

  const missing: { permissions: string[]; origins: string[] } = {
    permissions: [],
    origins: [],
  };

  if (!hasPermissions) {
    missing.permissions = requiredPermissions;
  }

  if (!hasOrigins) {
    missing.origins = requiredOrigins;
  }

  return {
    hasAll: hasPermissions && hasOrigins,
    missing,
  };
}

/**
 * 권한 변경 감지 리스너
 */
export function onPermissionsChanged(
  callback: (permissions: chrome.permissions.Permissions) => void
): () => void {
  const listener = (permissions: chrome.permissions.Permissions) => {
    callback(permissions);
  };

  chrome.permissions.onAdded.addListener(listener);
  chrome.permissions.onRemoved.addListener(listener);

  // 정리 함수 반환
  return () => {
    chrome.permissions.onAdded.removeListener(listener);
    chrome.permissions.onRemoved.removeListener(listener);
  };
}
