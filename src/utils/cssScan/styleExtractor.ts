/**
 * Style Extractor Utilities
 *
 * 요소 스타일 추출 유틸리티
 */

import type { ElementStyleInfo, CSSProperty, SelectorInfo, CSSPropertyType, CSSValueType } from '../../types/cssScan';

/**
 * 요소 스타일 정보 추출
 */
export function extractElementStyle(
  element: HTMLElement,
  options: {
    includeComputed?: boolean;
    includeInherited?: boolean;
    includeAnimations?: boolean;
  } = {}
): ElementStyleInfo {
  const {
    includeComputed = true,
    includeInherited = false,
    includeAnimations = false,
  } = options;

  const computedStyle = window.getComputedStyle(element);
  const inlineStyle = element.style;

  // 기본 정보
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classes: Array.from(element.classList),
    attributes: getAttributes(element),
  };

  // 선택자 정보
  const selectors = generateSelectors(element);

  // 계산된 스타일
  const computedStyleMap: Record<string, string> = {};
  if (includeComputed) {
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      computedStyleMap[prop] = computedStyle.getPropertyValue(prop);
    }
  }

  // 인라인 스타일
  const inlineStyleMap: Record<string, string> = {};
  for (let i = 0; i < inlineStyle.length; i++) {
    const prop = inlineStyle[i];
    inlineStyleMap[prop] = inlineStyle.getPropertyValue(prop);
  }

  // 매칭된 규칙
  const matchedRules = extractMatchedRules(element);

  // 상속된 속성
  const inheritedProperties: Record<string, string> = {};
  if (includeInherited) {
    extractInheritedProperties(element, inheritedProperties);
  }

  // 애니메이션 정보
  let animationProperties;
  if (includeAnimations) {
    animationProperties = extractAnimationInfo(element, computedStyle);
  }

  return {
    element: elementInfo,
    selectors,
    computedStyle: computedStyleMap,
    inlineStyle: inlineStyleMap,
    matchedRules,
    inheritedProperties,
    animationProperties,
  };
}

/**
 * 요소 속성 추출
 */
function getAttributes(element: HTMLElement): Record<string, string> {
  const attrs: Record<string, string> = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }

  return attrs;
}

/**
 * 선택자 생성
 */
function generateSelectors(element: HTMLElement): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];

  // ID 선택자
  if (element.id) {
    selectors.push({
      selector: `#${element.id}`,
      type: 'id',
      specificity: { ids: 1, classes: 0, elements: 0 },
      matches: true,
    });
  }

  // 클래스 선택자
  for (const className of element.classList) {
    selectors.push({
      selector: `.${className}`,
      type: 'class',
      specificity: { ids: 0, classes: 1, elements: 0 },
      matches: true,
    });
  }

  // 태그 선택자
  selectors.push({
    selector: element.tagName.toLowerCase(),
    type: 'tag',
    specificity: { ids: 0, classes: 0, elements: 1 },
    matches: true,
  });

  // 속성 선택자
  for (const attrName of Object.keys(getAttributes(element))) {
    const attrValue = element.getAttribute(attrName);
    if (attrValue) {
      selectors.push({
        selector: `[${attrName}="${attrValue}"]`,
        type: 'attribute',
        specificity: { ids: 0, classes: 0, elements: 1 },
        matches: true,
      });
    }
  }

  return selectors;
}

/**
 * 매칭된 규칙 추출
 */
function extractMatchedRules(element: HTMLElement) {
  try {
    const rules = [];

    // 모든 스타일시트 순회
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        // Cross-Origin 제한 처리
        const sheetRules = sheet.cssRules || sheet.rules;

        for (const rule of Array.from(sheetRules)) {
          if (rule instanceof CSSStyleRule) {
            try {
              if (element.matches(rule.selectorText)) {
                rules.push({
                  selector: rule.selectorText,
                  selectorType: 'class' as const,
                  specificity: calculateSpecificity(rule.selectorText),
                  declarations: extractDeclarations(rule.style),
                  stylesheetId: getStylesheetId(sheet),
                  stylesheetUrl: sheet.href || undefined,
                });
              }
            } catch {
              // 선택자 매칭 오류 무시
            }
          }
        }
      } catch {
        // 스타일시이트 접근 오류 무시 (CORS)
      }
    }

    // 특이도 순 정렬
    return rules.sort((a, b) => b.specificity - a.specificity);
  } catch {
    return [];
  }
}

/**
 * 선언 추출
 */
function extractDeclarations(style: CSSStyleDeclaration) {
  const declarations = [];

  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    declarations.push({
      property: prop,
      value: style.getPropertyValue(prop),
      important: style.getPropertyPriority(prop) === 'important',
    });
  }

  return declarations;
}

/**
 * 선택자 특이도 계산
 */
export function calculateSpecificity(selector: string): number {
  // 간단 특이도 계산 (ID: 100, Class/Attr/Pseudo: 10, Element: 1)
  let specificity = 0;

  // ID 선택자
  specificity += (selector.match(/#/g) || []).length * 100;

  // 클래스, 속성, 의사 클래스
  specificity +=
    (
      selector.match(
        /(\.[\w-]+)|\[[^\]]+\]|:(hover|active|focus|visited|link|target|not|has|where|is)/gi
      ) || []
    ).length * 10;

  // 요소, 의사 요소
  specificity +=
    (selector.match(/(^|[^:\w-])([\w-]+)(::|:|$)/g) || []).length * 1;

  return specificity;
}

/**
 * 스타일시트 ID 생성
 */
function getStylesheetId(sheet: CSSStyleSheet): string | undefined {
  if (sheet.ownerNode) {
    return (sheet.ownerNode as HTMLElement).getAttribute('data-scan-id') || undefined;
  }
  return undefined;
}

/**
 * 상속된 속성 추출
 */
function extractInheritedProperties(
  element: HTMLElement,
  result: Record<string, string>
): void {
  const inheritableProperties = [
    'color',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-indent',
    'text-transform',
    'white-space',
    'direction',
    'visibility',
    'cursor',
  ];

  const parent = element.parentElement;
  if (!parent) return;

  const parentStyle = window.getComputedStyle(parent);

  for (const prop of inheritableProperties) {
    if (!result[prop]) {
      result[prop] = parentStyle.getPropertyValue(prop);
    }
  }
}

/**
 * 애니메이션 정보 추출
 */
function extractAnimationInfo(
  element: HTMLElement,
  computedStyle: CSSStyleDeclaration
) {
  const animationName = computedStyle.getPropertyValue('animation-name');
  const animationDuration = computedStyle.getPropertyValue('animation-duration');
  const animationDelay = computedStyle.getPropertyValue('animation-delay');
  const animationIterationCount = computedStyle.getPropertyValue(
    'animation-iteration-count'
  );

  if (animationName === 'none') return undefined;

  return {
    name: animationName,
    duration: parseTime(animationDuration),
    timingFunction: computedStyle.getPropertyValue('animation-timing-function'),
    delay: parseTime(animationDelay),
    iterationCount: (animationIterationCount === 'infinite' ? 'infinite' : (parseInt(animationIterationCount) || 1)) as number | 'infinite',
    direction: computedStyle.getPropertyValue('animation-direction'),
    fillMode: computedStyle.getPropertyValue('animation-fill-mode'),
    playState: computedStyle.getPropertyValue('animation-play-state'),
  };
}

/**
 * 시간 값 파싱
 */
function parseTime(timeValue: string): number {
  const match = timeValue.match(/^([\d.]+)(s|ms)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 's' ? value * 1000 : value;
}

/**
 * CSS 속성 추출 (단일 속성)
 */
export function extractCSSProperty(
  element: HTMLElement,
  propertyName: string,
  computed: boolean = true
): CSSProperty | null {
  const style = computed ? window.getComputedStyle(element) : element.style;
  const value = style.getPropertyValue(propertyName);

  if (!value) return null;

  return {
    name: propertyName,
    value,
    type: getPropertyType(propertyName) as CSSPropertyType,
    valueType: getValueType(value) as CSSValueType,
    source: computed ? 'computed' : 'inline',
    important: style.getPropertyPriority(propertyName) === 'important',
    inherited: isInheritableProperty(propertyName),
    default: getDefaultValue(),
    unit: extractUnit(value),
  };
}

/**
 * 속성 타입 가져오기
 */
function getPropertyType(property: string): string {
  const layoutProps = ['display', 'position', 'float', 'clear', 'overflow', 'z-index'];
  const typographyProps = ['font', 'text', 'line', 'letter', 'word'];
  const colorProps = ['color', 'background', 'border'];
  const spacingProps = ['margin', 'padding'];
  const sizeProps = ['width', 'height', 'min', 'max'];

  const lowerProp = property.toLowerCase();

  if (layoutProps.some(p => lowerProp.includes(p))) return 'layout';
  if (typographyProps.some(p => lowerProp.includes(p))) return 'typography';
  if (colorProps.some(p => lowerProp.includes(p))) return 'color';
  if (spacingProps.some(p => lowerProp.includes(p))) return 'spacing';
  if (sizeProps.some(p => lowerProp.includes(p))) return 'size';

  return 'other';
}

/**
 * 값 타입 가져오기
 */
function getValueType(value: string): string {
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return 'color';
  if (/^rgba?\(/i.test(value)) return 'color';
  if (/^hsla?\(/i.test(value)) return 'color';
  if (CSS_COLOR_KEYWORDS.includes(value)) return 'color';
  if (/^[\d.]+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i.test(value))
    return 'length';
  if (/^[\d.]+%$/.test(value)) return 'percentage';
  if (/^url\(/i.test(value)) return 'url';
  if (/^\d+$/.test(value)) return 'number';
  if (/^[\d.]+(deg|rad|grad|turn)$/i.test(value)) return 'angle';
  if (/^[\d.]+(s|ms)$/i.test(value)) return 'time';
  if (/\(/.test(value)) return 'function';

  return 'keyword';
}

/**
 * 상속 가능 속성인지 확인
 */
function isInheritableProperty(property: string): boolean {
  const inheritable = [
    'color',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-indent',
    'text-transform',
    'white-space',
    'direction',
    'visibility',
    'cursor',
  ];

  return inheritable.some(p => property.includes(p));
}

/**
 * 기본값 가져오기
 */
function getDefaultValue(): string {
  // 브라우저 기본 스타일 사용
  return '';
}

/**
 * 단위 추출
 */
function extractUnit(value: string): string | undefined {
  const match = value.match(/^([\d.-]+)(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|deg|rad|grad|turn|s|ms)?$/i);
  return match?.[2];
}

/**
 * CSS 색상 키워드 (파일 상단에서 import)
 */
const CSS_COLOR_KEYWORDS = [
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
];
