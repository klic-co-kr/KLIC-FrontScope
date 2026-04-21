/**
 * Storage Key Constants
 */

/**
 * Chrome Storage Keys
 */
export const STORAGE_KEYS = {
  // Grid Layout Settings
  GRID_LAYOUT_SETTINGS: 'gridLayout:settings',

  // Guide Lines
  GRID_LAYOUT_GUIDELINES: 'gridLayout:guidelines',

  // Viewport Preset
  GRID_LAYOUT_VIEWPORT: 'gridLayout:viewport',

  // Grid Overlay
  GRID_LAYOUT_OVERLAY: 'gridLayout:gridOverlay',

  // Whitespace Settings
  GRID_LAYOUT_WHITESPACE: 'gridLayout:whitespace',

  // Custom Presets
  GRID_LAYOUT_CUSTOM_PRESETS: 'gridLayout:customPresets',

  // Snapshots
  GRID_LAYOUT_SNAPSHOTS: 'gridLayout:snapshots',

  // Cache
  GRID_LAYOUT_CACHE: 'gridLayout:cache',

  // Analytics
  GRID_LAYOUT_ANALYTICS: 'gridLayout:analytics',
} as const;

/**
 * Storage Key Type
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Storage TTL (Time To Live) in milliseconds
 */
export const STORAGE_TTL = {
  CACHE: 5 * 60 * 1000, // 5 minutes
  PRESETS: 24 * 60 * 60 * 1000, // 24 hours
  SNAPSHOTS: 7 * 24 * 60 * 60 * 1000, // 7 days
  ANALYTICS: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

/**
 * Storage Size Limits (in bytes)
 */
export const STORAGE_LIMITS = {
  MAX_SINGLE_ITEM: 10 * 1024 * 1024, // 10MB (Chrome extension limit)
  MAX_TOTAL_STORAGE: 100 * 1024 * 1024, // 100MB (approximate)
  MAX_CACHE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SNAPSHOT_SIZE: 1 * 1024 * 1024, // 1MB per snapshot
  MAX_SNAPSHOTS: 50, // Maximum number of snapshots
} as const;

/**
 * Storage Priority Levels
 */
export const STORAGE_PRIORITY = {
  HIGH: 1, // User settings, active guides
  MEDIUM: 2, // Custom presets, recent snapshots
  LOW: 3, // Analytics, old snapshots
} as const;

/**
 * Storage Cleanup Intervals (in milliseconds)
 */
export const STORAGE_CLEANUP_INTERVALS = {
  CACHE: 60 * 1000, // 1 minute
  SNAPSHOTS: 24 * 60 * 60 * 1000, // 24 hours
  ANALYTICS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Storage Error Codes
 */
export const STORAGE_ERRORS = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INVALID_DATA: 'INVALID_DATA',
  STORAGE_DISABLED: 'STORAGE_DISABLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

/**
 * Valid Storage Key Pattern
 */
export const VALID_STORAGE_KEY_PATTERN = /^gridLayout:[a-zA-Z0-9:_-]+$/;
