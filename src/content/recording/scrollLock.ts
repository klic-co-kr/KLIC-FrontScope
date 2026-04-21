// src/content/recording/scrollLock.ts
// Lock/unlock scroll during selection/element mode recording (C3)

let originalOverflow = '';
let isLocked = false;

export function lockScroll(): void {
  if (isLocked) return;
  isLocked = true;
  originalOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  if (!isLocked) return;
  isLocked = false;
  document.documentElement.style.overflow = originalOverflow;
}
