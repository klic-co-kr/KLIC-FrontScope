/**
 * CSS Scan Default Settings
 *
 * CSS 스캔 기본 설정값
 */

import type { CSSScanSettings, CSSExportOptions } from '../types/cssScan';

/**
 * CSS 스캔 기본 설정
 */
export const DEFAULT_CSS_SCAN_SETTINGS: CSSScanSettings = {
  autoScan: false,
  highlightOnHover: true,
  showBoxModel: true,
  showInherited: false,
  showComputed: true,
  exportFormat: 'css',
  theme: 'light',
};

/**
 * 내보내기 기본 옵션
 */
export const DEFAULT_CSS_EXPORT_OPTIONS: CSSExportOptions = {
  format: 'css',
  includeComputed: true,
  includeInherited: false,
  minify: false,
  includeSelectors: true,
  includeMediaQueries: true,
};

/**
 * 박스 모델 기본 색상
 */
export const BOX_MODEL_COLORS = {
  content: '#4ade80', // green-400
  padding: '#60a5fa', // blue-400
  border: '#f472b6', // pink-400
  margin: '#fbbf24', // amber-400
} as const;

/**
 * 하이라이트 기본 색상
 */
export const HIGHLIGHT_COLORS = {
  default: '#3b82f6', // blue-500
  hover: '#8b5cf6', // violet-500
  selected: '#ef4444', // red-500
  matched: '#10b981', // emerald-500
} as const;

/**
 * CSS 속성 카테고리
 */
export const CSS_PROPERTY_CATEGORIES = {
  layout: [
    'display',
    'position',
    'float',
    'clear',
    'visibility',
    'opacity',
    'overflow',
    'z-index',
  ],
  typography: [
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-variant',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-transform',
    'text-indent',
    'white-space',
  ],
  color: [
    'color',
    'background-color',
    'opacity',
  ],
  background: [
    'background',
    'background-image',
    'background-position',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-clip',
    'background-origin',
  ],
  border: [
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-radius',
    'outline',
  ],
  spacing: [
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
  ],
  size: [
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
  ],
  flexbox: [
    'flex',
    'flex-direction',
    'flex-wrap',
    'flex-flow',
    'justify-content',
    'align-items',
    'align-content',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'align-self',
    'order',
    'gap',
    'row-gap',
    'column-gap',
  ],
  grid: [
    'grid',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-auto-columns',
    'grid-auto-rows',
    'grid-auto-flow',
    'grid-column',
    'grid-row',
    'grid-area',
    'justify-items',
    'align-items',
    'justify-content',
    'align-content',
    'gap',
    'row-gap',
    'column-gap',
  ],
  animation: [
    'animation',
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'transition',
    'transform',
    'transform-origin',
  ],
  effect: [
    'box-shadow',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask',
    'perspective',
  ],
} as const;

/**
 * 단위 목록
 */
export const CSS_UNITS = {
  length: ['px', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', '%', 'ch', 'ex', 'cm', 'mm', 'in', 'pt', 'pc'],
  angle: ['deg', 'rad', 'grad', 'turn'],
  time: ['s', 'ms'],
  frequency: ['Hz', 'kHz'],
  resolution: ['dpi', 'dpcm', 'dppx'],
} as const;

/**
 * 기본 브라우저 스타일
 */
export const DEFAULT_BROWSER_STYLES: Record<string, Record<string, string>> = {
  div: {
    display: 'block',
  },
  span: {
    display: 'inline',
  },
  p: {
    display: 'block',
    'margin-top': '1em',
    'margin-bottom': '1em',
  },
  h1: {
    display: 'block',
    'font-size': '2em',
    'margin-top': '0.67em',
    'margin-bottom': '0.67em',
    'font-weight': 'bold',
  },
  h2: {
    display: 'block',
    'font-size': '1.5em',
    'margin-top': '0.83em',
    'margin-bottom': '0.83em',
    'font-weight': 'bold',
  },
  a: {
    display: 'inline',
    color: '-webkit-link',
    'text-decoration': 'underline',
    cursor: 'auto',
  },
  img: {
    display: 'inline',
  },
  ul: {
    display: 'block',
    'list-style-type': 'disc',
    'margin-top': '1em',
    'margin-bottom': '1em',
    'padding-left': '40px',
  },
  ol: {
    display: 'block',
    'list-style-type': 'decimal',
    'margin-top': '1em',
    'margin-bottom': '1em',
    'padding-left': '40px',
  },
  button: {
    display: 'inline-block',
  },
  input: {
    display: 'inline-block',
  },
};

/**
 * 색상 키워드
 */
export const CSS_COLOR_KEYWORDS = [
  'transparent',
  'currentColor',
  'inherit',
  'initial',
  'unset',
  'revert',
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
] as const;

/**
 * CSS 카테고리 라벨 (다국어)
 */
export const CSS_CATEGORY_LABELS = {
  layout: { en: 'Layout', ko: '레이아웃' },
  typography: { en: 'Typography', ko: '타이포그래피' },
  color: { en: 'Color', ko: '색상' },
  background: { en: 'Background', ko: '배경' },
  border: { en: 'Border', ko: '테두리' },
  spacing: { en: 'Spacing', ko: '간격' },
  size: { en: 'Size', ko: '크기' },
  flexbox: { en: 'Flexbox', ko: '플렉스박스' },
  grid: { en: 'Grid', ko: '그리드' },
  animation: { en: 'Animation', ko: '애니메이션' },
  effect: { en: 'Effects', ko: '효과' },
} as const;
