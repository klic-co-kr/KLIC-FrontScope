/**
 * Keyboard Shortcuts Help Component
 *
 * 키보드 단축키 도움말 컴포넌트
 */

import React from 'react';
import { GRID_LAYOUT_SHORTCUTS } from '../../constants/gridStyles';
import { parseKeyCombo } from '../../utils/gridLayout/grid/keyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  className?: string;
  showDescriptions?: boolean;
}

export function KeyboardShortcutsHelp({
  className = '',
  showDescriptions = true,
}: KeyboardShortcutsHelpProps) {
  // 단축키 카테고리별 그룹화
  const categorizedShortcuts = React.useMemo(() => {
    const categories: Record<string, typeof GRID_LAYOUT_SHORTCUTS> = {
      토글: [],
      가이드라인: [],
      뷰포트: [],
      그리드: [],
      화이트스페이스: [],
      일반: [],
    };

    GRID_LAYOUT_SHORTCUTS.forEach(shortcut => {
      if (shortcut.category === 'toggle') {
        categories.토글.push(shortcut);
      } else if (shortcut.category === 'guides') {
        categories.가이드라인.push(shortcut);
      } else if (shortcut.category === 'viewport') {
        categories.뷰포트.push(shortcut);
      } else if (shortcut.category === 'grid') {
        categories.그리드.push(shortcut);
      } else if (shortcut.category === 'whitespace') {
        categories.화이트스페이스.push(shortcut);
      } else {
        categories.일반.push(shortcut);
      }
    });

    return categories;
  }, []);

  // 키 표시 컴포넌트
  const KeyBadge = ({ keys }: { keys: string[] }) => (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-muted-foreground">+</span>}
          <kbd
            className="px-2 py-1 text-xs font-mono rounded border bg-muted border-border text-foreground"
          >
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  );

  // 단축키에서 키 배열 추출
  const getKeysFromShortcut = (shortcut: string): string[] => {
    const combo = parseKeyCombo(shortcut);
    const keys: string[] = [];
    if (combo.ctrl) keys.push('Ctrl');
    if (combo.shift) keys.push('Shift');
    if (combo.alt) keys.push('Alt');
    if (combo.meta) keys.push('Cmd');
    keys.push(combo.key);
    return keys;
  };

  return (
    <div className={`keyboard-shortcuts-help ${className}`}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="shortcuts-header">
          <h3 className="text-lg font-semibold text-foreground mb-2">키보드 단축키</h3>
          <p className="text-sm text-muted-foreground">
            그리드 레이아웃 도구를 더 빠르게 제어할 수 있습니다.
          </p>
        </div>

        {/* 단축키 목록 */}
        <div className="shortcuts-list space-y-4">
          {Object.entries(categorizedShortcuts).map(([category, shortcuts]) =>
            shortcuts.length > 0 ? (
              <div key={category} className="shortcut-category">
                <h4 className="text-sm font-medium text-primary mb-2">{category}</h4>
                <div className="space-y-2">
                  {shortcuts.map(shortcut => {
                    return (
                      <div
                        key={shortcut.id}
                        className="shortcut-item flex items-center justify-between p-2 bg-accent/50 rounded hover:bg-accent transition-colors"
                      >
                        <div className="shortcut-info flex-1">
                          <div className="text-sm text-foreground">{shortcut.label}</div>
                          {showDescriptions && shortcut.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {shortcut.description}
                            </div>
                          )}
                        </div>
                        <div className="shortcut-keys">
                          <KeyBadge keys={getKeysFromShortcut(shortcut.shortcut)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* 참고 사항 */}
        <div className="shortcuts-note mt-6 p-3 bg-primary/10 border border-primary/30 rounded">
          <h4 className="text-sm font-medium text-primary mb-1">💡 참고</h4>
          <ul className="text-xs text-primary/80 space-y-1">
            <li>• 단축키는 페이지에서 작동할 때 사용하세요</li>
            <li>• 일부 단축키는 브라우저 단축키와 충돌할 수 있습니다</li>
            <li>• 텍스트 입력 필드에서는 단축키가 비활성화됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 단축키 레퍼런스 카드
 */
interface ShortcutCardProps {
  shortcut: string;
  label: string;
  description?: string;
  className?: string;
}

export function ShortcutCard({
  shortcut,
  label,
  description,
  className = '',
}: ShortcutCardProps) {
  const getKeysFromShortcut = (shortcut: string): string[] => {
    const combo = parseKeyCombo(shortcut);
    const keys: string[] = [];
    if (combo.ctrl) keys.push('Ctrl');
    if (combo.shift) keys.push('Shift');
    if (combo.alt) keys.push('Alt');
    if (combo.meta) keys.push('Cmd');
    keys.push(combo.key);
    return keys;
  };

  const keys = getKeysFromShortcut(shortcut);

  return (
    <div className={`shortcut-card flex items-center justify-between p-3 bg-muted rounded-lg ${className}`}>
      <div className="shortcut-info">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      <div className="shortcut-keys flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <span className="text-muted-foreground text-xs">+</span>}
            <kbd className="px-2 py-1 text-xs font-mono bg-accent border border-border text-foreground rounded">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * 단축키 테이블 컴포넌트
 */
interface ShortcutTableProps {
  shortcuts: typeof GRID_LAYOUT_SHORTCUTS;
  className?: string;
}

export function ShortcutTable({ shortcuts, className = '' }: ShortcutTableProps) {
  const getKeysFromShortcut = (shortcut: string): { modifiers: string[]; key: string } => {
    const combo = parseKeyCombo(shortcut);
    const modifiers: string[] = [];
    if (combo.ctrl) modifiers.push('Ctrl');
    if (combo.shift) modifiers.push('Shift');
    if (combo.alt) modifiers.push('Alt');
    if (combo.meta) modifiers.push('Cmd');
    return { modifiers, key: combo.key };
  };

  return (
    <div className={`shortcut-table overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">동작</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">단축키</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">설명</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map(shortcut => {
            const { modifiers, key } = getKeysFromShortcut(shortcut.shortcut);
            return (
              <tr key={shortcut.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-2 px-3 text-foreground">{shortcut.label}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    {modifiers.map((mod, i) => (
                      <React.Fragment key={mod}>
                        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-accent border border-border text-foreground rounded">
                          {mod}
                        </kbd>
                        {i < modifiers.length || <span className="text-muted-foreground text-xs">+</span>}
                      </React.Fragment>
                    ))}
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-accent border border-border text-foreground rounded">
                      {key}
                    </kbd>
                  </div>
                </td>
                <td className="py-2 px-3 text-muted-foreground text-xs">{shortcut.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 단축키 검색 가능한 컴포넌트
 */
interface SearchableShortcutsProps {
  className?: string;
}

export function SearchableShortcuts({ className = '' }: SearchableShortcutsProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredShortcuts = React.useMemo(() => {
    if (!searchQuery.trim()) return GRID_LAYOUT_SHORTCUTS;

    const query = searchQuery.toLowerCase();
    return GRID_LAYOUT_SHORTCUTS.filter(
      shortcut =>
        shortcut.label.toLowerCase().includes(query) ||
        shortcut.description?.toLowerCase().includes(query) ||
        shortcut.shortcut.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={`searchable-shortcuts ${className}`}>
      {/* 검색 입력 */}
      <div className="search-input mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="단축키 검색..."
          className="w-full px-3 py-2 bg-accent text-foreground rounded border border-border focus:border-primary focus:outline-none text-sm"
        />
      </div>

      {/* 검색 결과 */}
      <div className="search-results space-y-2">
        {filteredShortcuts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            검색 결과가 없습니다
          </div>
        ) : (
          filteredShortcuts.map(shortcut => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut.shortcut}
              label={shortcut.label}
              description={shortcut.description}
            />
          ))
        )}
      </div>

      {/* 결과 수 */}
      <div className="mt-4 text-xs text-muted-foreground">
        {filteredShortcuts.length} / {GRID_LAYOUT_SHORTCUTS.length} 개의 단축키
      </div>
    </div>
  );
}

/**
 * 단축키 빠른 참조 패널
 */
export function QuickShortcutReference({ className = '' }: { className?: string }) {
  const essentialShortcuts = GRID_LAYOUT_SHORTCUTS.filter(s =>
    ['toggle-grid', 'toggle-guides', 'toggle-whitespace', 'add-horizontal-guide', 'add-vertical-guide'].includes(s.id)
  );

  const getKeysFromShortcut = (shortcut: string): string[] => {
    const combo = parseKeyCombo(shortcut);
    const keys: string[] = [];
    if (combo.ctrl) keys.push('Ctrl');
    if (combo.shift) keys.push('Shift');
    if (combo.alt) keys.push('Alt');
    if (combo.meta) keys.push('Cmd');
    keys.push(combo.key);
    return keys;
  };

  return (
    <div className={`quick-shortcut-reference ${className}`}>
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">빠른 참조</h4>
      <div className="grid grid-cols-1 gap-1">
        {essentialShortcuts.map(shortcut => {
          const keys = getKeysFromShortcut(shortcut.shortcut);
          return (
            <div key={shortcut.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{shortcut.label}</span>
              <div className="flex items-center gap-0.5">
                {keys.map((key, i) => (
                  <React.Fragment key={key}>
                    {i > 0 && <span className="text-muted-foreground">+</span>}
                    <kbd className="px-1 py-0.5 font-mono bg-accent text-foreground rounded text-xs">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
