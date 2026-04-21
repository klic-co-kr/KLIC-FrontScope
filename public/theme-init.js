// public/theme-init.js
// FOUC 방지: React 마운트 전 테마 적용
chrome.storage.local.get(['theme:mode', 'theme:accent'], (r) => {
  const mode = r['theme:mode'] || 'system';
  const accent = r['theme:accent'] || 'blue';
  const dark = mode === 'system'
    ? matchMedia('(prefers-color-scheme:dark)').matches
    : mode === 'dark';
  if (dark) document.documentElement.classList.add('dark');
  // 모든 액센트(blue 포함)는 data-theme 설정
  document.documentElement.setAttribute('data-theme', accent);
});
