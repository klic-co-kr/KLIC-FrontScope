/**
 * Screenshot Collection Utilities
 *
 * 스크린샷 컬렉션 관리 유틸리티
 */

import type { Screenshot } from '../../../types/screenshot';
import { getScreenshots, saveScreenshot } from './screenshotStorage';

/**
 * 컬렉션
 */
export interface ScreenshotCollection {
  id: string;
  name: string;
  description?: string;
  screenshotIds: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 컬렉션 생성
 */
export async function createCollection(
  name: string,
  description?: string
): Promise<ScreenshotCollection> {
  const collection: ScreenshotCollection = {
    id: crypto.randomUUID(),
    name,
    description,
    screenshotIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const collections = await getCollections();
  collections.push(collection);

  await chrome.storage.local.set({
    'screenshot-collections': collections,
  });

  return collection;
}

/**
 * 모든 컬렉션 가져오기
 */
export async function getCollections(): Promise<ScreenshotCollection[]> {
  const result = await chrome.storage.local.get('screenshot-collections');
  return (result['screenshot-collections'] as ScreenshotCollection[]) || [];
}

/**
 * ID로 컬렉션 가져오기
 */
export async function getCollectionById(id: string): Promise<ScreenshotCollection | null> {
  const collections = await getCollections();
  return collections.find(c => c.id === id) || null;
}

/**
 * 컬렉션 업데이트
 */
export async function updateCollection(
  id: string,
  updates: Partial<Omit<ScreenshotCollection, 'id' | 'createdAt'>>
): Promise<void> {
  const collections = await getCollections();
  const index = collections.findIndex(c => c.id === id);

  if (index !== -1) {
    collections[index] = {
      ...collections[index],
      ...updates,
      updatedAt: Date.now(),
    };

    await chrome.storage.local.set({
      'screenshot-collections': collections,
    });
  }
}

/**
 * 컬렉션 삭제
 */
export async function deleteCollection(id: string): Promise<void> {
  const collections = await getCollections();
  const filtered = collections.filter(c => c.id !== id);

  await chrome.storage.local.set({
    'screenshot-collections': filtered,
  });
}

/**
 * 컬렉션에 스크린샷 추가
 */
export async function addScreenshotToCollection(
  collectionId: string,
  screenshotId: string
): Promise<void> {
  const collection = await getCollectionById(collectionId);
  if (!collection) return;

  if (!collection.screenshotIds.includes(screenshotId)) {
    collection.screenshotIds.push(screenshotId);
    await updateCollection(collectionId, {
      screenshotIds: collection.screenshotIds,
    });
  }
}

/**
 * 컬렉션에서 스크린샷 제거
 */
export async function removeScreenshotFromCollection(
  collectionId: string,
  screenshotId: string
): Promise<void> {
  const collection = await getCollectionById(collectionId);
  if (!collection) return;

  const filtered = collection.screenshotIds.filter(id => id !== screenshotId);
  await updateCollection(collectionId, {
    screenshotIds: filtered,
  });
}

/**
 * 컬렉션의 스크린샷 가져오기
 */
export async function getCollectionScreenshots(
  collectionId: string
): Promise<Screenshot[]> {
  const collection = await getCollectionById(collectionId);
  if (!collection) return [];

  const allScreenshots = await getScreenshots();
  return allScreenshots.filter(s => collection.screenshotIds.includes(s.id));
}

/**
 * 스크린샷이 포함된 컬렉션 가져오기
 */
export async function getCollectionsForScreenshot(
  screenshotId: string
): Promise<ScreenshotCollection[]> {
  const collections = await getCollections();
  return collections.filter(c => c.screenshotIds.includes(screenshotId));
}

/**
 * 스마트 컬렉션 (자동 그룹화)
 */
export interface SmartCollectionRule {
  field: 'format' | 'mode' | 'date' | 'tag';
  operator: 'equals' | 'contains' | 'after' | 'before';
  value: string | number;
}

/**
 * 스마트 컬렉션 생성
 */
export async function createSmartCollection(
  name: string,
  rules: SmartCollectionRule[]
): Promise<ScreenshotCollection> {
  // 규칙에 맞는 스크린샷 찾기
  const screenshots = await getScreenshots();
  const matchingIds: string[] = [];

  for (const screenshot of screenshots) {
    if (matchesRules(screenshot, rules)) {
      matchingIds.push(screenshot.id);
    }
  }

  const collection: ScreenshotCollection = {
    id: crypto.randomUUID(),
    name,
    description: `Smart collection (${rules.length} rules)`,
    screenshotIds: matchingIds,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const collections = await getCollections();
  collections.push(collection);

  await chrome.storage.local.set({
    'screenshot-collections': collections,
  });

  return collection;
}

/**
 * 규칙 일치 확인
 */
function matchesRules(screenshot: Screenshot, rules: SmartCollectionRule[]): boolean {
  for (const rule of rules) {
    let matches = false;

    switch (rule.field) {
      case 'format':
        matches = rule.operator === 'equals' && screenshot.format === rule.value;
        break;
      case 'mode':
        matches = rule.operator === 'equals' && screenshot.mode === rule.value;
        break;
      case 'date': {
        const date = new Date(screenshot.timestamp);
        const ruleDate = new Date(rule.value as number);
        if (rule.operator === 'after') {
          matches = date > ruleDate;
        } else if (rule.operator === 'before') {
          matches = date < ruleDate;
        }
        break;
      }
      case 'tag':
        matches =
          rule.operator === 'contains' &&
          (screenshot.tags?.some(tag => tag.includes(rule.value as string)) ?? false);
        break;
    }

    if (!matches) return false;
  }

  return true;
}

/**
 * 컬렉션 병합
 */
export async function mergeCollections(
  targetCollectionId: string,
  sourceCollectionIds: string[]
): Promise<void> {
  const targetCollection = await getCollectionById(targetCollectionId);
  if (!targetCollection) return;

  const allScreenshotIds = new Set(targetCollection.screenshotIds);

  for (const sourceId of sourceCollectionIds) {
    const sourceCollection = await getCollectionById(sourceId);
    if (sourceCollection) {
      for (const screenshotId of sourceCollection.screenshotIds) {
        allScreenshotIds.add(screenshotId);
      }
    }
  }

  await updateCollection(targetCollectionId, {
    screenshotIds: Array.from(allScreenshotIds),
  });
}

/**
 * 컬렉션 내보내기
 */
export async function exportCollection(collectionId: string): Promise<string> {
  const collection = await getCollectionById(collectionId);
  if (!collection) {
    throw new Error('Collection not found');
  }

  const screenshots = await getCollectionScreenshots(collectionId);

  return JSON.stringify(
    {
      collection,
      screenshots,
    },
    null,
    2
  );
}

/**
 * 컬렉션 가져오기
 */
export async function importCollection(json: string): Promise<ScreenshotCollection> {
  const data = JSON.parse(json);

  // 스크린샷 저장
  if (Array.isArray(data.screenshots)) {
    for (const screenshot of data.screenshots) {
      await saveScreenshot(screenshot);
    }
  }

  // 컬렉션 저장
  const collection: ScreenshotCollection = {
    ...data.collection,
    id: crypto.randomUUID(), // 새 ID 생성
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const collections = await getCollections();
  collections.push(collection);

  await chrome.storage.local.set({
    'screenshot-collections': collections,
  });

  return collection;
}
