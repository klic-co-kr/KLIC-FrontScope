/**
 * Component Inspector Types
 *
 * 컴포넌트 인스펙터에서 사용하는 타입 정의
 */

/**
 * 감지 가능한 컴포넌트 타입
 */
export type ComponentType = 'react' | 'vue' | 'angular' | 'svelte' | 'web-component' | 'html';

/**
 * 감지 가능한 프레임워크 타입
 */
export type FrameworkType = 'react' | 'vue' | 'angular' | 'svelte' | 'next' | 'nuxt' | 'sveltekit' | 'unknown';

/**
 * 컴포넌트 정보
 */
export interface ComponentInfo {
  /** 고유 ID */
  id: string;
  /** 컴포넌트 타입 */
  type: ComponentType;
  /** 컴포넌트 이름 */
  name: string;
  /** CSS 선택자 */
  selector: string;
  /** 컴포넌트 props (React/Vue) */
  props?: Record<string, unknown>;
  /** 컴포넌트 state (React/Vue) */
  state?: Record<string, unknown>;
  /** 소스 파일 정보 */
  source?: string;
  /** HTML 태그명 */
  tagName: string;
  /** CSS 클래스명 */
  className?: string;
  /** 요소 ID */
  elementId?: string;
  /** 자식 요소 수 */
  children: number;
  /** DOM 깊이 */
  depth: number;
  /** Shadow DOM 여부 (Web Components) */
  hasShadow?: boolean;
}

/**
 * 컴포넌트 스캔 결과
 */
export interface ComponentScanResult {
  /** 감지된 프레임워크 */
  framework: FrameworkType;
  /** 메타 프레임워크 (Next.js, Nuxt 등) */
  metaFramework?: 'next' | 'nuxt' | 'sveltekit';
  /** 감지된 컴포넌트 목록 */
  components: ComponentInfo[];
  /** 전체 요소 수 */
  totalElements: number;
  /** 스캔 시간 */
  scannedAt: number;
}

/**
 * 컴포넌트 피커 데이터
 */
export interface ComponentPickerData {
  /** 선택된 컴포넌트 정보 */
  component: ComponentInfo;
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
}
