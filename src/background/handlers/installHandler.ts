/**
 * Install Handler
 *
 * Extension 설치/업데이트 시 초기 설정 및 마이그레이션 처리
 */

import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_APP_SETTINGS, DEFAULT_SCREENSHOT_SETTINGS, DEFAULT_CSS_SCAN_SETTINGS, DEFAULT_FONT_SETTINGS, DEFAULT_COLOR_PICKER_SETTINGS, DEFAULT_RULER_SETTINGS, DEFAULT_ASSET_MANAGER_SETTINGS, DEFAULT_CONSOLE_SETTINGS, DEFAULT_TAILWIND_SETTINGS } from '../../constants/defaults';

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface Migration {
  version: string;
  migrate: () => Promise<void>;
}

/**
 * 기본 설정 저장
 */
async function saveDefaultSettings() {
  const settings = {
    [STORAGE_KEYS.APP_SETTINGS]: DEFAULT_APP_SETTINGS,
    // Tool-specific settings
    'textEdit:settings': {
      maxHistorySize: 20,
      autoSave: true,
      preserveFormatting: true,
      highlightColor: '#f59e0b',
      enableKeyboardShortcuts: true,
    },
    'screenshot:settings': DEFAULT_SCREENSHOT_SETTINGS,
    'cssScan:settings': DEFAULT_CSS_SCAN_SETTINGS,
    'fontAnalyzer:settings': DEFAULT_FONT_SETTINGS,
    'colorPicker:settings': DEFAULT_COLOR_PICKER_SETTINGS,
    'ruler:settings': DEFAULT_RULER_SETTINGS,
    'assetManager:settings': DEFAULT_ASSET_MANAGER_SETTINGS,
    'console:settings': DEFAULT_CONSOLE_SETTINGS,
    'tailwind:settings': DEFAULT_TAILWIND_SETTINGS,
  };

  await chrome.storage.local.set(settings);
}

/**
 * 설치 핸들러
 */
async function handleInstall() {
  console.log('KLIC Extension installed');

  // 기본 설정 저장
  await saveDefaultSettings();

  // 환영 탭 오픈 (선택사항 - Side Panel이 열리므로 생략 가능)
  // await chrome.tabs.create({
  //   url: chrome.runtime.getURL('sidepanel.html'),
  // });
}

/**
 * 버전 파싱
 */
function parseVersion(version: string): Version {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor: minor ?? 0, patch: patch ?? 0 };
}

/**
 * 마이그레이션 실행 여부 확인
 */
function shouldRunMigration(previousVersion: string, migrationVersion: string): boolean {
  const prev = parseVersion(previousVersion);
  const migration = parseVersion(migrationVersion);

  return prev.major < migration.major ||
    (prev.major === migration.major && prev.minor < migration.minor);
}

/**
 * 업데이트 핸들러
 */
async function handleUpdate(previousVersion?: string) {
  if (!previousVersion) {
    console.log('KLIC Extension updated (unknown previous version)');
    return;
  }

  console.log(`KLIC Extension updated from ${previousVersion}`);

  // 버전별 마이그레이션 로직
  const migrations: Migration[] = [
    // 이전 버전에서의 마이그레이션이 필요한 경우 여기에 추가
    // { version: '2.0.0', migrate: migrateFrom200 },
  ];

  for (const { version, migrate } of migrations) {
    if (shouldRunMigration(previousVersion, version)) {
      console.log(`Running migration to ${version}...`);
      await migrate();
    }
  }
}

/**
 * 설치/업데이트 핸들러 등록
 */
export function registerInstallHandler() {
  chrome.runtime.onInstalled.addListener(async (details) => {
    switch (details.reason) {
      case 'install':
        await handleInstall();
        break;
      case 'update':
        await handleUpdate(details.previousVersion);
        break;
      case 'chrome_update':
      case 'shared_module_update':
        // 무시
        break;
    }
  });
}

// 내보내기 for testing
export { handleInstall, handleUpdate, parseVersion, shouldRunMigration };
