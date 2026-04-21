/**
 * Screenshot Storage Utilities Index
 *
 * 모든 스크린샷 저장소 유틸리티 내보내기
 */

// Screenshot storage
export {
  saveScreenshot,
  getScreenshots,
  getScreenshotById,
  deleteScreenshot,
  clearScreenshots,
  updateScreenshot,
  saveScreenshotSettings,
  getScreenshotSettings,
  getScreenshotStats,
  cleanupOldScreenshots,
  searchScreenshots,
  addScreenshotTags,
  removeScreenshotTags,
  toggleScreenshotFavorite,
  getFavoriteScreenshots,
  getStorageUsage,
  exportScreenshots,
  importScreenshots,
  saveScreenshotBlob,
  getScreenshotBlob,
  deleteScreenshotBlob,
} from './screenshotStorage';

// Screenshot collection
export {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addScreenshotToCollection,
  removeScreenshotFromCollection,
  getCollectionScreenshots,
  getCollectionsForScreenshot,
  createSmartCollection,
  mergeCollections,
  exportCollection,
  importCollection,
  type ScreenshotCollection,
  type SmartCollectionRule,
} from './screenshotCollection';
