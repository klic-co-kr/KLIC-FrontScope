/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'light' | 'dark' | 'system'
type Accent = 'blue' | 'amber' | 'green' | 'violet' | 'rose'

interface ThemeContext {
  mode: Mode
  accent: Accent
  resolvedMode: 'light' | 'dark'
  setMode: (mode: Mode) => void
  setAccent: (accent: Accent) => void
}

const ThemeCtx = createContext<ThemeContext | null>(null)

interface StorageResult {
  'theme:mode'?: Mode
  'theme:accent'?: Accent
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('system')
  const [accent, setAccentState] = useState<Accent>('blue')
  const [ready, setReady] = useState(false)
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 시스템 다크모드 변경 감지
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Chrome Storage에서 테마 설정 로드
  useEffect(() => {
    chrome.storage.local.get(['theme:mode', 'theme:accent'], (result: StorageResult) => {
      if (result['theme:mode']) setModeState(result['theme:mode']!)
      if (result['theme:accent']) setAccentState(result['theme:accent']!)
      setReady(true)
    })
  }, [])

  // 멀티 컨텍스트 동기화: 다른 컨텍스트(예: popup)에서 테마 변경 시 반영
  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes['theme:mode']?.newValue !== undefined) {
        setModeState(changes['theme:mode'].newValue as Mode)
      }
      if (changes['theme:accent']?.newValue !== undefined) {
        setAccentState(changes['theme:accent'].newValue as Accent)
      }
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  // DOM에 테마 적용
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedMode === 'dark')
    root.setAttribute('data-theme', accent)
  }, [resolvedMode, accent])

  const setMode = (m: Mode) => {
    setModeState(m)
    chrome.storage.local.set({ 'theme:mode': m })
  }

  const setAccent = (a: Accent) => {
    setAccentState(a)
    chrome.storage.local.set({ 'theme:accent': a })
  }

  // FOUC 방지: storage 로딩 완료 전까지 children 렌더링 차단
  if (!ready) return null

  return (
    <ThemeCtx.Provider value={{ mode, accent, resolvedMode, setMode, setAccent }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
