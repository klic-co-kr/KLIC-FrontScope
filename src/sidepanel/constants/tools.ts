/**
 * Tool Constants
 *
 * 모든 도구의 타입, 정보, 설정을 중앙 관리
 */

import {
  Type,
  Camera,
  Palette,
  Eye,
  Ruler,
  Download,
  Terminal,
  Monitor,
  Network,
  Grid3x3,
  ShieldCheck,
  Code2,
  Layers,
} from 'lucide-react';

/**
 * 도구 타입 enum
 */
export type ToolType =
  | 'textEdit'
  | 'screenshot'
  | 'cssScan'
  | 'fontAnalyzer'
  | 'palette'
  | 'ruler'
  | 'assets'
  | 'console'
  | 'tailwind'
  | 'jsInspector'
  | 'gridLayout'
  | 'resourceNetwork'
  | 'accessibilityChecker'
  | 'componentInspector';

/**
 * 도구 정보 인터페이스
 */
export interface ToolInfo {
  /** 도구 ID */
  id: ToolType;
  /** 표시 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 아이콘 컴포넌트 */
  icon: React.ComponentType<{ className?: string }>;
  /** 카테고리 */
  category: 'edit' | 'analyze' | 'capture' | 'measure' | 'utility';
  /** 독점 모드 (한 번에 하나만 활성화 가능) */
  exclusive: boolean;
  /** 단축키 */
  shortcut?: string;
}

/**
 * 모든 도구 목록
 */
export const ALL_TOOLS: readonly ToolInfo[] = [
  {
    id: 'textEdit',
    name: '텍스트 편집',
    description: '페이지 텍스트 수정',
    icon: Type,
    category: 'edit',
    exclusive: true,
    shortcut: 'Ctrl+Shift+E',
  },
  {
    id: 'screenshot',
    name: '스크린샷',
    description: '요소 캡처',
    icon: Camera,
    category: 'capture',
    exclusive: true,
    shortcut: 'Ctrl+Shift+S',
  },
  {
    id: 'cssScan',
    name: 'CSS 스캔',
    description: '스타일 검사',
    icon: Eye,
    category: 'analyze',
    exclusive: true,
    shortcut: 'Ctrl+Shift+I',
  },
  {
    id: 'ruler',
    name: '자',
    description: '요소 크기 측정',
    icon: Ruler,
    category: 'measure',
    exclusive: true,
    shortcut: 'Ctrl+Shift+R',
  },
  {
    id: 'gridLayout',
    name: '그리드 레이아웃',
    description: '레이아웃 그리드 및 가이드라인',
    icon: Grid3x3,
    category: 'measure',
    exclusive: true,
    shortcut: 'Ctrl+Shift+G',
  },
  {
    id: 'fontAnalyzer',
    name: '폰트',
    description: '폰트 분석',
    icon: Type,
    category: 'analyze',
    exclusive: false,
  },
  {
    id: 'palette',
    name: '팔레트',
    description: '페이지 색상 + 피커',
    icon: Palette,
    category: 'analyze',
    exclusive: false,
  },
  {
    id: 'assets',
    name: '에셋',
    description: '이미지 다운로드',
    icon: Download,
    category: 'utility',
    exclusive: false,
  },
  {
    id: 'console',
    name: '콘솔',
    description: '로그 확인',
    icon: Terminal,
    category: 'utility',
    exclusive: false,
  },
  {
    id: 'tailwind',
    name: '테일윈드',
    description: '클래스 스캔',
    icon: Monitor,
    category: 'analyze',
    exclusive: true,
  },
  {
    id: 'jsInspector',
    name: 'JS 인스펙터',
    description: '이벤트 스크립트 추적',
    icon: Code2,
    category: 'analyze',
    exclusive: true,
  },
  {
    id: 'resourceNetwork',
    name: '리소스 네트워크',
    description: '성능 최적화',
    icon: Network,
    category: 'utility',
    exclusive: false,
  },
  {
    id: 'accessibilityChecker',
    name: '접근성 검사',
    description: 'KRDS 웹접근성 검사',
    icon: ShieldCheck,
    category: 'analyze',
    exclusive: false,
    shortcut: 'Ctrl+Shift+A',
  },
  {
    id: 'componentInspector',
    name: '컴포넌트 인스펙터',
    description: '프레임워크 컴포넌트 분석',
    icon: Layers,
    category: 'analyze',
    exclusive: true,
  },
] as const;

/**
 * 별칭: 이전 코드와의 호환성
 */
export const allTools = ALL_TOOLS;

/**
 * 독점 도구인지 확인
 */
export function isExclusiveTool(toolId: ToolType): boolean {
  const tool = ALL_TOOLS.find(t => t.id === toolId);
  return tool?.exclusive ?? true; // 기본값은 독점
}

/**
 * 도구 카테고리별로 그룹화
 */
export function getToolsByCategory(
  category: ToolInfo['category']
): ToolInfo[] {
  return ALL_TOOLS.filter(tool => tool.category === category);
}

/**
 * 도구 ID로 도구 정보 조회
 */
export function getToolById(toolId: ToolType): ToolInfo | undefined {
  return ALL_TOOLS.find(tool => tool.id === toolId);
}

/**
 * 단축키로 도구 조회
 */
export function getToolByShortcut(shortcut: string): ToolInfo | undefined {
  return ALL_TOOLS.find(tool => tool.shortcut === shortcut);
}

/**
 * 모든 독점 도구 목록
 */
export const EXCLUSIVE_TOOLS: ToolType[] = ALL_TOOLS.filter(
  tool => tool.exclusive
).map(tool => tool.id);

/**
 * 동시 실행 가능한 도구 목록
 */
export const CONCURRENT_TOOLS: ToolType[] = ALL_TOOLS.filter(
  tool => !tool.exclusive
).map(tool => tool.id);
