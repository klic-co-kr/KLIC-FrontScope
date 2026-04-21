/**
 * 색상 포맷 타입
 */
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'cssvar';

/**
 * RGB 색상
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * RGBA 색상
 */
export interface RGBA extends RGB {
  a: number; // 0-1
}

/**
 * HSL 색상
 */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * HSLA 색상
 */
export interface HSLA extends HSL {
  a: number; // 0-1
}

/**
 * HSV 색상
 */
export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/**
 * 색상 객체 (통합)
 */
export interface Color {
  id: string;                    // UUID
  timestamp: number;             // Date.now()
  hex: string;                   // '#RRGGBB'
  rgb: RGB;
  rgba: RGBA;
  hsl: HSL;
  hsla: HSLA;
  hsv: HSV;
  name?: string;                 // 사용자 지정 이름
  tags?: string[];               // 태그
  isFavorite?: boolean;
  collectionId?: string;         // 속한 컬렉션 ID
}

/**
 * 색상 히스토리
 */
export interface ColorHistory {
  colors: Color[];
  maxSize: number;              // 무제한 (0) 또는 최대 개수
  totalPicked: number;
}

/**
 * 색상 컬렉션 (팔레트)
 */
export interface ColorCollection {
  id: string;
  name: string;
  description?: string;
  colors: Color[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

/**
 * 색상 팔레트 타입
 */
export type PaletteType =
  | 'analogous'        // 유사색
  | 'complementary'    // 보색
  | 'triadic'          // 3색 조합
  | 'tetradic'         // 4색 조합
  | 'monochromatic'    // 단색 조합
  | 'shades'           // 명암 변화
  | 'tints';           // 색조 변화

/**
 * 팔레트 생성 옵션
 */
export interface PaletteOptions {
  type: PaletteType;
  count?: number;              // 생성할 색상 개수
  variation?: number;          // 변화 정도 (0-1)
}

/**
 * WCAG 레벨
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * 대비율 결과
 */
export interface ContrastResult {
  ratio: number;                 // 대비율 (1-21)
  passAA: boolean;               // AA 통과 여부
  passAAA: boolean;              // AAA 통과 여부
  rating: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * 컬러피커 설정
 */
export interface ColorPickerSettings {
  defaultFormat: ColorFormat;
  autoSave: boolean;
  maxHistorySize: number;        // 0 = 무제한
  enableEyeDropper: boolean;
  showContrastChecker: boolean;
  autoCopyToClipboard: boolean;
  generatePaletteOnPick: boolean;
  defaultPaletteType: PaletteType;
}

/**
 * Export 포맷
 */
export type ExportFormat = 'json' | 'css' | 'scss' | 'tailwind' | 'csv';

/**
 * Export 데이터
 */
export interface ColorExport {
  format: ExportFormat;
  content: string;
  filename: string;
}
