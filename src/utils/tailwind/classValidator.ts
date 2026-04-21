/**
 * Tailwind Class Validation Utilities
 *
 * Tailwind 클래스 유효성 검사
 */

import type { TailwindVersion } from '../../types/tailwindScanner';

/**
 * Tailwind v3 표준 클래스 패턴
 */
const TAILWIND_V3_PATTERNS = {
  // 레이아웃
  display: /^(static|fixed|absolute|relative|sticky|contents|hidden)$/,
  container: /^container$/,
  overflow: /^(overflow|overflow-x|overflow-y)-(auto|hidden|visible|scroll|clip)$/,
  zIndex: /^z-(0|10|20|30|40|50|auto|base)$/,

  // 플렉스
  flex: /^(flex|inline-flex|grid|inline-grid)$/,
  flexDirection: /^(flex-row|flex-row-reverse|flex-col|flex-col-reverse)$/,
  flexWrap: /^(flex-wrap|flex-nowrap|flex-wrap-reverse)$/,
  flexGrow: /^(flex-grow|flex-shrink|flex)-(\d+|0)$/,
  justify: /^(justify-(start|end|center|between|around|evenly))$/,
  items: /^(items-(start|end|center|baseline|stretch))$/,
  self: /^(self-(start|end|center|baseline|stretch))$/,
  place: /^(place-(start|end|center|stretch))$/,

  // 그리드
  gridCols: /^grid-cols-(\d+|none|\[.+\])$/,
  gridRows: /^grid-rows-(\d+|none|\[.+\])$/,
  gridFlow: /^grid-flow-(col|row|dense|col-dense|row-dense)$/,

  // 간격 (Spacing)
  padding: /^p(x|y|t|r|b|l)?-?(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|auto|\[.+\])$/,
  margin: /^-?m(x|y|t|r|b|l)?-?(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|auto|\[.+\])$/,
  space: /^-?space-(x|y)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|\[.+\])$/,

  // 크기 (Sizing)
  width: /^w-(auto|full|screen|screen-md|screen-lg|screen-xl|screen-2xl|min|max|\d+\/\d+|\[.+\])$/,
  height: /^h-(auto|full|screen|screen-md|screen-lg|screen-xl|screen-2xl|min|max|\d+\/\d+|\[.+\])$/,
  maxWidth: /^max-w-(none|0|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|screen|min|\[.+\])$/,
  maxHeight: /^max-h-(none|full|screen|screen-md|screen-lg|screen-xl|screen-2xl|min|\[.+\])$/,

  // 폰트 (Typography)
  fontSize: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[.+\])$/,
  fontWeight: /^(font-)?(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  lineHeight: /^(leading-)(none|tight|snug|normal|relaxed|loose|\d+|\[.+\])$/,
  letterSpacing: /^(tracking-)(tighter|tight|normal|wide|wider|widest|\[.+\])$/,
  textAlign: /^(text-(left|center|right|justify|start|end))$/,
  textTransform: /^(uppercase|lowercase|capitalize|normal-case)$/,
  textDecoration: /^(underline|overline|line-through|no-underline)$/,

  // 색상 (Colors)
  textColor: /^(text-)(transparent|current|black|white|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)|\[.+\])$/,
  bgColor: /^(bg-)(transparent|current|black|white|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)|\[.+\])$/,
  borderColor: /^(border-)(transparent|current|black|white|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)|\[.+\])$/,

  // 경계 (Borders)
  borderRadius: /^(rounded)(-?(none|sm|md|lg|xl|2xl|3xl|full|\[.+\]))?$/,
  borderWidth: /^(border)(-?(0|2|4|8))?$/,
  borderStyle: /^(border-)(solid|dashed|dotted|double|none)$/,

  // 효과 (Effects)
  boxShadow: /^shadow(-(none|sm|md|lg|xl|2xl|inner|\[.+\]))?$/,
  opacity: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100|\[.+\])$/,

  // 필터 (Filters)
  blur: /^blur-(none|sm|md|lg|xl|2xl|3xl|\[.+\])$/,
  brightness: /^brightness-(0|50|75|90|95|100|105|110|125|150|200|\[.+\])$/,
  contrast: /^contrast-(0|25|50|75|100|125|150|200|\[.+\])$/,
  grayscale: /^grayscale-(0|50|100|\[.+\])$/,
  invert: /^invert-(0|50|100|\[.+\])$/,

  // 전환 (Transitions)
  transition: /^transition(-(all|colors|opacity|shadow|transform))?$/,
  duration: /^duration-(75|100|150|200|300|500|700|1000|\[.+\])$/,
  ease: /^ease-(linear|in|out|in-out|-(?:snap|bounce|elastic|cubic-bezier\(.+\)))$/,

  // 변환 (Transforms)
  scale: /^scale-?(0|50|75|90|95|100|105|110|125|150|\[.+\])?$/,
  rotate: /^rotate-?(0|1|2|3|6|12|45|90|180|\[.+\])?$/,
  translate: /^translate-(x|y)?-?(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|full|1\/2|1\/3|2\/3|1\/4|3\/4|\[.+\])$/,

  // 상태 (Interactivity)
  cursor: /^cursor-(auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out)$/,
  userSelect: /^(select-)(none|text|all|auto)$/,
  pointerEvents: /^(pointer-events-)(none|auto)$/,

  // SVG
  fill: /^fill-(currentColor|none|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)|\[.+\])$/,
  stroke: /^stroke-(currentColor|none|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)|\[.+\])$/,
  strokeWidth: /^stroke-(0|1|2|\[.+\])$/,
};

/**
 * 반응형 프리픽스
 */
const RESPONSIVE_PREFIXES = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];

/**
 * 상태 프리픽스
 */
const STATE_PREFIXES = [
  'hover:', 'focus:', 'active:', 'visited:', 'disabled:',
  'focus-within:', 'focus-visible:',
  'group-hover:', 'group-focus:',
  'peer-hover:', 'peer-focus:', 'peer-checked:',
];

/**
 * 다크 모드 프리픽스
 */
const DARK_PREFIX = 'dark:';

/**
 * 단일 클래스 유효성 검사
 */
export function validateClass(
  className: string,
  version: TailwindVersion = 'v3'
): {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  // 빈 문자열 확인
  if (!className || className.trim() === '') {
    return { valid: false, reason: '빈 클래스 이름' };
  }

  // 프리픽스 제거
  const baseClass = removePrefixes(className);

  // 임의 값 확인
  if (baseClass.includes('[') && baseClass.includes(']')) {
    return {
      valid: version === 'v3' || version === 'v4',
      reason: version === 'v2' ? 'v2에서는 임의 값을 사용할 수 없습니다' : undefined,
    };
  }

  // 음수 값 확인
  const isNegative = baseClass.startsWith('-');
  const checkClass = isNegative ? baseClass.slice(1) : baseClass;

  // v3 패턴 확인
  if (version === 'v3' || version === 'unknown') {
    for (const [, pattern] of Object.entries(TAILWIND_V3_PATTERNS)) {
      if (pattern.test(checkClass)) {
        return { valid: true };
      }
    }
  }

  // 특수 클래스 확인
  const specialClasses = [
    'sr-only', 'not-sr-only',
    'prose', 'prose-sm', 'prose-lg', 'prose-xl', 'prose-2xl',
  ];

  if (specialClasses.includes(checkClass)) {
    return { valid: true };
  }

  // 유효하지 않음 - 제안 제공
  return {
    valid: false,
    reason: '알 수 없는 Tailwind 클래스',
    suggestions: getSimilarClasses(checkClass),
  };
}

/**
 * 프리픽스 제거
 */
function removePrefixes(className: string): string {
  let result = className;

  // 반응형 프리픽스 제거
  for (const prefix of RESPONSIVE_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length);
      break;
    }
  }

  // 상태 프리픽스 제거
  for (const prefix of STATE_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length);
      break;
    }
  }

  // 다크 모드 제거
  if (result.startsWith(DARK_PREFIX)) {
    result = result.slice(DARK_PREFIX.length);
  }

  return result;
}

/**
 * 유사한 클래스 제안
 */
function getSimilarClasses(invalidClass: string): string[] {
  const suggestions: string[] = [];
  const baseClass = invalidClass.replace(/^-/, '');

  // 일반적인 오타 교정
  const corrections: Record<string, string> = {
    'text-center': 'text-center',
    'text-centre': 'text-center',
    'bg-coler': 'bg-color',
    'backround': 'background',
    'm-auto': 'mx-auto',
    'p-auto': 'px-auto', // 또는 그냥 auto
    'w-100': 'w-full',
    'h-100': 'h-full',
    'flex-center': 'flex justify-center items-center',
  };

  if (corrections[baseClass]) {
    suggestions.push(corrections[baseClass]);
  }

  // 유사한 접두사의 기본 클래스 제안
  if (baseClass.startsWith('p')) {
    suggestions.push('p-4', 'px-4', 'py-2');
  } else if (baseClass.startsWith('m')) {
    suggestions.push('m-4', 'mx-auto', 'my-2');
  } else if (baseClass.startsWith('text')) {
    suggestions.push('text-base', 'text-lg', 'text-center');
  } else if (baseClass.startsWith('bg')) {
    suggestions.push('bg-white', 'bg-gray-100', 'bg-blue-500');
  } else if (baseClass.startsWith('flex')) {
    suggestions.push('flex', 'flex-row', 'flex-col');
  } else if (baseClass.startsWith('grid')) {
    suggestions.push('grid', 'grid-cols-2', 'grid-rows-3');
  }

  return suggestions.slice(0, 5);
}

/**
 * 여러 클래스 유효성 검사
 */
export function validateClasses(
  classNames: string[],
  version?: TailwindVersion
): {
  valid: string[];
  invalid: Array<{ className: string; reason: string; suggestions?: string[] }>;
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
    validityRate: number;
  };
} {
  const valid: string[] = [];
  const invalid: Array<{ className: string; reason: string; suggestions?: string[] }> = [];

  classNames.forEach((className) => {
    const result = validateClass(className, version);
    if (result.valid) {
      valid.push(className);
    } else {
      invalid.push({
        className,
        reason: result.reason || '알 수 없는 이유',
        suggestions: result.suggestions,
      });
    }
  });

  return {
    valid,
    invalid,
    summary: {
      total: classNames.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      validityRate: classNames.length > 0 ? valid.length / classNames.length : 0,
    },
  };
}

/**
 * 중복 클래스 확인
 */
export function findDuplicateClasses(classNames: string[]): {
  duplicates: string[];
  groups: Record<string, number[]>;
} {
  const duplicates: string[] = [];
  const groups: Record<string, number[]> = {};

  classNames.forEach((className, index) => {
    if (!groups[className]) {
      groups[className] = [];
    }
    groups[className].push(index);
  });

  for (const [className, indices] of Object.entries(groups)) {
    if (indices.length > 1) {
      duplicates.push(className);
    }
  }

  return { duplicates, groups };
}

/**
 * 상충하는 클래스 확인
 */
export function findConflictingClasses(classNames: string[]): {
  conflicts: Array<{ classes: string[]; description: string }>;
} {
  const conflicts: Array<{ classes: string[]; description: string }> = [];

  // 크기 상충
  const sizeClasses = classNames.filter((c) => /^w-|^h-|^max-w-|^max-h-/.test(c));
  if (sizeClasses.length > 1) {
    const widthClasses = sizeClasses.filter((c) => /^w-/.test(c));
    const maxWidthClasses = sizeClasses.filter((c) => /^max-w-/.test(c));

    if (widthClasses.length > 1) {
      conflicts.push({
        classes: widthClasses,
        description: '중복된 너비 클래스',
      });
    }

    if (widthClasses.length > 0 && maxWidthClasses.length > 0) {
      conflicts.push({
        classes: [...widthClasses.slice(0, 1), ...maxWidthClasses.slice(0, 1)],
        description: '너비와 최대 너비가 함께 사용됨',
      });
    }
  }

  // 색상 상충
  const textColorClasses = classNames.filter((c) => /^text-/.test(c) && !/^text-(size|align|weight)/.test(c));
  if (textColorClasses.length > 1) {
    conflicts.push({
      classes: textColorClasses,
      description: '중복된 텍스트 색상',
    });
  }

  // 배경색 상충
  const bgColorClasses = classNames.filter((c) => /^bg-/.test(c));
  if (bgColorClasses.length > 1) {
    conflicts.push({
      classes: bgColorClasses,
      description: '중복된 배경 색상',
    });
  }

  // 표시 상충
  const displayClasses = classNames.filter((c) =>
    /^(hidden|block|flex|grid|inline|table|contents)/.test(c)
  );
  if (displayClasses.length > 1) {
    conflicts.push({
      classes: displayClasses,
      description: '중복된 표시 속성',
    });
  }

  return { conflicts };
}

/**
 * 사용되지 않는 클래스 확인 (DOM 기반)
 */
export function findUnusedClasses(definedClasses: string[]): {
  unused: string[];
  used: string[];
} {
  const usedInDOM = new Set<string>();

  // DOM에서 실제 사용된 클래스 수집
  const elements = document.querySelectorAll('[class]');
  elements.forEach((element) => {
    const classNames = element.className?.toString().split(/\s+/) || [];
    classNames.forEach((cls) => {
      usedInDOM.add(cls);
    });
  });

  // 사용되지 않은 클래스 확인
  const unused = definedClasses.filter((cls) => !usedInDOM.has(cls));
  const used = definedClasses.filter((cls) => usedInDOM.has(cls));

  return { unused, used };
}

/**
 * 클래스 최적화 제안
 */
export function optimizeClassString(classString: string): {
  optimized: string;
  removed: string[];
  reasons: string[];
} {
  const classNames = classString.split(/\s+/).filter((c) => c);
  const removed: string[] = [];
  const reasons: string[] = [];
  const optimized: string[] = [];

  // 중복 제거
  const seen = new Set<string>();
  classNames.forEach((cls) => {
    if (seen.has(cls)) {
      removed.push(cls);
      reasons.push('중복');
    } else {
      seen.add(cls);
      optimized.push(cls);
    }
  });

  // 상충하는 클래스 중 나중 것 제거
  const { conflicts } = findConflictingClasses(optimized);
  conflicts.forEach(({ classes, description }) => {
    if (classes.length > 1) {
      // 첫 번째 유지, 나머지 제거
      for (let i = 1; i < classes.length; i++) {
        const index = optimized.indexOf(classes[i]);
        if (index > -1) {
          optimized.splice(index, 1);
          removed.push(classes[i]);
          reasons.push(`${description} - ${classes[0]}이(가) 이미 있음`);
        }
      }
    }
  });

  return {
    optimized: optimized.join(' '),
    removed,
    reasons,
  };
}
