# Phase 3: 전체 통합 - Background Script

**태스크 범위**: Task #10.17 ~ #10.20 (4개)
**예상 시간**: 2시간
**의존성**: 없음

---

## Task #10.17: Extension 설치/업데이트 핸들러

- **파일**: `src/background/installHandler.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_SETTINGS } from '../constants/defaults';

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

async function handleInstall() {
  console.log('KLIC Extension installed');

  // 기본 설정 저장
  await chrome.storage.local.set({
    [STORAGE_KEYS.GLOBAL_SETTINGS]: DEFAULT_SETTINGS,
  });

  // 모든 도구 기본 설정 저장
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS.toolSettings)) {
    await chrome.storage.local.set({
      [key]: value,
    });
  }

  // 환영 페이지 오픈
  await chrome.tabs.create({
    url: chrome.runtime.getURL('sidepanel.html'),
  });
}

async function handleUpdate(previousVersion: string) {
  console.log(`KLIC Extension updated from ${previousVersion}`);

  // 버전별 마이그레이션 로직
  const migrations = [
    { version: '0.9.0', migrate: migrateFrom090 },
    { version: '1.0.0', migrate: migrateFrom100 },
  ];

  for (const { version, migrate } of migrations) {
    if (shouldRunMigration(previousVersion, version)) {
      await migrate();
    }
  }
}

function shouldRunMigration(previousVersion: string, migrationVersion: string): boolean {
  const prev = parseVersion(previousVersion);
  const migration = parseVersion(migrationVersion);

  return prev.major < migration.major ||
    (prev.major === migration.major && prev.minor < migration.minor);
}

function parseVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

// 마이그레이션 함수들
async function migrateFrom090() {
  // 0.9.0 → 1.0.0 마이그레이션
}

async function migrateFrom100() {
  // 1.0.0 → 1.1.0 마이그레이션
}
```

**완료 조건**: 설치/업데이트 시 정상 동작

---

## Task #10.18: Side Panel 열기/닫기 핸들러

- **파일**: `src/background/panelHandler.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
export function registerPanelHandlers() {
  // Side Panel 아이콘 클릭
  chrome.action.onClicked.addListener(async (tab) => {
    await openSidePanel();
  });

  // 커맨드 (Ctrl+Shift+K)
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'open-side-panel') {
      await openSidePanel();
    }
  });
}

async function openSidePanel() {
  // 현재 탭 가져오기
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) return;

  // Side Panel 오픈
  await chrome.sidePanel.open({ tabId: tab.id });

  // Content Script 주입 (확인)
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
  } catch (error) {
    // Content Script가 주입되지 않은 경우 주입
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  }
}

async function closeSidePanel() {
  // Chrome Extension API는 Side Panel을 프로그래밍으로 닫는 기능을 제공하지 않음
  // 사용자가 수동으로 닫아야 함
}

export async function toggleSidePanel() {
  // Side Panel이 열려있는지 확인할 방법이 없음
  // 항상 열기 시도
  await openSidePanel();
}
```

**완료 조건**: Side Panel 정상 열기

---

## Task #10.19: 권한 요청 핸들러

- **파일**: `src/background/permissions.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
export async function requestPermissions(permissions: string[]): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      permissions,
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

export async function checkPermissions(permissions: string[]): Promise<boolean> {
  try {
    return await chrome.permissions.contains({
      permissions,
    });
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

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

export async function removeAllPermissions() {
  try {
    await chrome.permissions.removeAll();
  } catch (error) {
    console.error('Remove permissions error:', error);
  }
}
```

**완료 조건**: 권한 요청/체크 정상 동작

---

## Task #10.20: 메시지 중계 시스템

- **파일**: `src/background/messageRelay.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
interface MessageRelay {
  from: 'content' | 'sidepanel' | 'background';
  to: 'content' | 'sidepanel' | 'background';
  message: any;
}

class MessageRelaySystem {
  constructor() {
    this.setupRelay();
  }

  private setupRelay() {
    // Content Script ↔ Side Panel 중계
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Background Script로 보내는 메시지가 아니면 중계
      if (message.target !== 'background') {
        this.relayMessage(message, sender);
      }
    });
  }

  private async relayMessage(message: any, sender: chrome.runtime.MessageSender) {
    const { action, data, target } = message;

    try {
      let response: any;

      switch (target) {
        case 'sidepanel':
          response = await this.sendToSidePanel(action, data);
          break;
        case 'content':
          response = await this.sendToContentScript(action, data, sender.tab?.id);
          break;
        default:
          // 브로드캐스트
          await this.broadcast(action, data);
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Relay error:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendToSidePanel(action: string, data: any) {
    // Side Panel은 별도의 컨텍스트이므로 Storage를 통해 통신
    const channel = new MessageChannel();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Side panel timeout'));
      }, 5000);

      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      channel.port1.onmessageerror = () => {
        clearTimeout(timeout);
        reject(new Error('Side panel communication error'));
      };

      // Storage를 통해 신호 전송
      chrome.storage.local.set({
        _relay: { action, data, timestamp: Date.now() }
      });
    });
  }

  private async sendToContentScript(action: string, data: any, tabId?: number) {
    if (!tabId) {
      throw new Error('No tab ID');
    }

    return await chrome.tabs.sendMessage(tabId, { action, data });
  }

  private async broadcast(action: string, data: any) {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action, data });
        } catch (error) {
          // 일부 탭은 Content Script가 주입되지 않을 수 있음
          console.debug('Failed to send to tab:', tab.id);
        }
      }
    }
  }
}

export const messageRelay = new MessageRelaySystem();
```

**완료 조건**: 모든 메시지 정상 중계

---

**완료 후 다음 단계**: [Phase 4: 공통 유틸리티](./TASK-10-phase-04-utils.md)
