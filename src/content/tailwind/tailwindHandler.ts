/**
 * Tailwind Scanner Handlers
 *
 * 페이지에서 Tailwind CSS 클래스 스캔, 변환, 감지 기능
 */

import { rgbStringToHex } from '../../utils/common/colorUtils';

/**
 * Tailwind 페이지 스캔
 */
export async function handleTailwindScan() {
    const detection = detectTailwindUsage();
    const allClasses = extractTailwindClasses();

    const classesByCategory: Record<string, number> = {};
    allClasses.forEach(cls => {
        const category = categorizeClass(cls);
        classesByCategory[category] = (classesByCategory[category] || 0) + 1;
    });

    const customClasses = allClasses.filter(cls => !isTailwindClass(cls));
    const arbitraryValues = allClasses.filter(cls => cls.includes('[') && cls.includes(']'));

    return {
        timestamp: Date.now(),
        url: window.location.href,
        title: document.title,
        isTailwindDetected: detection.detected,
        version: detection.version,
        isJITMode: detection.jitMode,
        totalClasses: allClasses.length,
        classesByCategory,
        classes: allClasses.map(name => ({
            name,
            category: categorizeClass(name),
            isValid: isTailwindClass(name),
            isArbitrary: name.includes('['),
            isCustom: !isTailwindClass(name),
        })),
        customClasses,
        arbitraryValues,
    };
}

/**
 * CSS를 Tailwind로 변환
 */
export async function handleTailwindConvertCSS(data: { css: string; includeArbitrary?: boolean }) {
    const conversions: Array<{ css: string; tailwind: string; confidence: number }> = [];
    const properties = parseCSSString(data.css);

    for (const prop of properties) {
        const tailwind = convertPropertyToTailwind(prop.property, prop.value);
        if (tailwind) {
            if (!data.includeArbitrary && tailwind.includes('[')) continue;
            conversions.push({
                css: `${prop.property}: ${prop.value}`,
                tailwind,
                confidence: calculateConfidence(prop.property),
            });
        }
    }

    return {
        totalProperties: properties.length,
        convertedCount: conversions.length,
        conversionRate: properties.length > 0 ? conversions.length / properties.length : 0,
        conversions,
        unmapped: properties
            .filter(p => !conversions.some(c => c.css === `${p.property}: ${p.value}`))
            .map(p => `${p.property}: ${p.value}`),
    };
}

/**
 * 요소를 Tailwind로 변환
 */
export async function handleTailwindConvertElement(data: { selector: string }) {
    const element = document.querySelector(data.selector) as HTMLElement;
    if (!element) {
        throw new Error('Element not found');
    }

    const style = window.getComputedStyle(element);
    const classes: string[] = [];

    if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
        classes.push(`text-[${rgbStringToHex(style.color)}]`);
    }
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        classes.push(`bg-[${rgbStringToHex(style.backgroundColor)}]`);
    }

    if (style.fontSize) classes.push(`text-[${style.fontSize}]`);
    if (style.fontWeight === '700' || style.fontWeight === 'bold') classes.push('font-bold');
    else if (style.fontWeight === '600') classes.push('font-semibold');
    else if (style.fontWeight === '500') classes.push('font-medium');

    if (style.padding && style.padding !== '0px') {
        const p = style.padding.split(' ').map(v => `[${v}]`).join(' ');
        classes.push(`p-${p}`);
    }
    if (style.margin && style.margin !== '0px') {
        const m = style.margin.split(' ').map(v => `[${v}]`).join(' ');
        classes.push(`m-${m}`);
    }

    if (style.display === 'flex') {
        classes.push('flex');
        if (style.flexDirection) classes.push(`flex-${style.flexDirection.replace('row', 'row').replace('column', 'col')}`);
        if (style.alignItems) classes.push(`items-${style.alignItems}`);
        if (style.justifyContent) {
            const justify = style.justifyContent.replace('flex-', '').replace('space-', '');
            classes.push(`justify-${justify}`);
        }
    } else if (style.display === 'grid') {
        classes.push('grid');
    } else if (style.display === 'block') {
        classes.push('block');
    }

    if (style.borderRadius && style.borderRadius !== '0px') {
        classes.push(`rounded-[${style.borderRadius}]`);
    }

    return {
        element: data.selector,
        classes,
        classString: classes.join(' '),
    };
}

/**
 * 모든 인라인 스타일 변환
 */
export async function handleTailwindConvertAllInline() {
    const elements = document.querySelectorAll('[style]');
    const results: Array<{ selector: string; classes: string[] }> = [];

    elements.forEach(el => {
        const selector = getSelector(el);
        const style = el.getAttribute('style');
        if (style) {
            const classes = style.split(';').map(s => s.trim()).filter(s => s);
            results.push({ selector, classes });
        }
    });

    return {
        totalElements: elements.length,
        convertedElements: results.length,
        results,
    };
}

/**
 * Tailwind 설정 추출
 */
export async function handleTailwindExtractConfig() {
    const config: { theme: Record<string, unknown> } = {
        theme: {},
    };

    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const content = script.textContent;
        if (content && content.includes('tailwind.config')) {
            const themeMatch = content.match(/theme:\s*(\{[\s\S]*?\})/);
            if (themeMatch) {
                config.theme = parseSimpleObject();
            }
            break;
        }
    }

    const usedColors = inferUsedColors();
    if (Object.keys(usedColors).length > 0) {
        const existingColors = typeof config.theme.colors === 'object' && config.theme.colors !== null
            ? config.theme.colors as Record<string, unknown>
            : {};
        config.theme.colors = { ...existingColors, ...usedColors };
    }

    return config;
}

/**
 * Tailwind 감지 정보 반환
 */
export async function handleTailwindGetDetection() {
    return detectTailwindUsage();
}

// --- Helper Functions ---

/**
 * Tailwind 사용 감지
 */
function detectTailwindUsage() {
    let detected = false;
    let version: 'v2' | 'v3' | 'v4' | 'unknown' = 'unknown';
    let jitMode = false;

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        if (src.includes('tailwindcss.com') || src.includes('cdn.tailwindcss.com')) {
            detected = true;
            version = 'v3';
        } else if (src.includes('tailwindcss@3')) {
            detected = true;
            version = 'v3';
        } else if (src.includes('tailwindcss@2')) {
            detected = true;
            version = 'v2';
        }
    });

    const styles = document.querySelectorAll('style');
    for (const style of styles) {
        if (style.textContent && (style.textContent.includes('@theme') || style.textContent.includes('@utility'))) {
            detected = true;
            version = 'v4';
            break;
        }
    }

    if (!detected) {
        const elements = document.querySelectorAll('[class]');
        let tailwindClassCount = 0;
        elements.forEach(el => {
            const classes = el.className?.toString().split(/\s+/) || [];
            classes.forEach(cls => {
                if (isTailwindClass(cls)) tailwindClassCount++;
            });
        });

        if (tailwindClassCount > 10) {
            detected = true;
            version = 'v3';
        }
    }

    const allElements = document.querySelectorAll('[class]');
    let arbitraryCount = 0;
    allElements.forEach(el => {
        const classes = el.className?.toString().split(/\s+/) || [];
        classes.forEach(cls => {
            if (cls.includes('[') && cls.includes(']')) arbitraryCount++;
        });
    });
    jitMode = arbitraryCount > 0;

    return { detected, version, jitMode };
}

/**
 * 페이지에서 모든 Tailwind 클래스 추출
 */
function extractTailwindClasses(): string[] {
    const classes = new Set<string>();
    const elements = document.querySelectorAll('[class]');

    elements.forEach(el => {
        const classNames = el.className?.toString().split(/\s+/) || [];
        classNames.forEach(cls => {
            if (cls && cls.trim()) classes.add(cls.trim());
        });
    });

    return Array.from(classes);
}

/**
 * 클래스 카테고리 분류
 */
function categorizeClass(className: string): string {
    const base = getUtilityClassName(className);

    if (!base) return 'unknown';
    if (base.startsWith('[')) return 'arbitrary';

    if (/^(flex|block|inline|table|hidden|fixed|absolute|relative|sticky|static|flow|contents)/.test(base)) return 'layout';
    if (/^(items|justify|self|content|place-|basis|grow|shrink|order)/.test(base)) return 'flexbox';
    if (/^(grid|col-|row-|auto-cols|auto-rows)/.test(base)) return 'grid';
    if (/^(p[trblxy]?|m[trblxy]?|space-[xy]|inset|top-|right-|bottom-|left-)/.test(base)) return 'spacing';
    if (/^(w-|h-|min-w-|max-w-|min-h-|max-h-|size-)/.test(base)) return 'sizing';
    if (/^(font|text-|leading|tracking|align|whitespace|break-|uppercase|lowercase|capitalize|truncate|line-clamp)/.test(base)) return 'typography';
    if (/^(bg-|text-|border-|ring-|from-|via-|to-|stroke-|fill-)/.test(base)) return 'colors';
    if (/^(bg-|background)/.test(base)) return 'background';
    if (/^(border|rounded|divide-|outline-)/.test(base)) return 'borders';
    if (/^(shadow|opacity|mix-blend|bg-blend)/.test(base)) return 'effects';
    if (/^(blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|drop-shadow|backdrop-)/.test(base)) return 'filters';
    if (/^(transition|duration|ease|delay|animate)/.test(base)) return 'transitions';
    if (/^(hover|focus|active|disabled|visited|cursor-|select-|pointer-events-)/.test(base)) return 'interactivity';

    return 'unknown';
}

function getUtilityClassName(className: string): string {
    const normalized = className.trim().replace(/^!/, '');
    const segments = normalized.split(':').filter(Boolean);
    const utility = segments.length > 0 ? segments[segments.length - 1] : normalized;
    return utility.replace(/^-/, '');
}

/**
 * Tailwind 클래스인지 확인
 */
function isTailwindClass(className: string): boolean {
    const base = getUtilityClassName(className);

    const validPrefixes = [
        'flex', 'grid', 'block', 'inline', 'table', 'hidden', 'flow',
        'items', 'justify', 'self', 'content', 'gap',
        'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
        'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
        'space', 'inset', 'top', 'right', 'bottom', 'left',
        'w', 'h', 'min-w', 'max-w', 'min-h', 'max-h',
        'text', 'font', 'leading', 'tracking', 'align',
        'bg', 'border', 'rounded', 'shadow', 'opacity', 'ring', 'outline',
        'transition', 'duration', 'ease', 'delay',
        'hover', 'focus', 'active', 'disabled', 'group',
        'sm', 'md', 'lg', 'xl', '2xl',
        'sr-only', 'not-sr-only',
        'container', 'prose', 'animate', 'cursor', 'pointer-events',
    ];

    if (!base) return false;
    if (base.startsWith('[') && base.endsWith(']')) return true;

    if (['container', 'sr-only', 'not-sr-only', 'prose'].includes(base)) return true;

    const prefix = base.split('-')[0];
    if (validPrefixes.includes(prefix)) return true;

    if (className.startsWith('-') && validPrefixes.includes(prefix.slice(1))) return true;

    return false;
}

/**
 * CSS 문자열 파싱
 */
function parseCSSString(cssString: string): Array<{ property: string; value: string }> {
    const properties: Array<{ property: string; value: string }> = [];
    const declarations = cssString.split(';').filter(d => d.trim());

    declarations.forEach(declaration => {
        const colonIndex = declaration.indexOf(':');
        if (colonIndex > 0) {
            const property = declaration.slice(0, colonIndex).trim();
            const value = declaration.slice(colonIndex + 1).trim();
            if (property && value) {
                properties.push({ property, value });
            }
        }
    });

    return properties;
}

/**
 * CSS 속성을 Tailwind로 변환
 */
function convertPropertyToTailwind(property: string, value: string): string | null {
    const prop = property.toLowerCase();
    const val = value.toLowerCase();

    if (prop === 'display') {
        if (val === 'flex') return 'flex';
        if (val === 'grid') return 'grid';
        if (val === 'block') return 'block';
        if (val === 'inline-block') return 'inline-block';
        if (val === 'hidden') return 'hidden';
    }

    if (prop === 'flex-direction') {
        if (val === 'row') return 'flex-row';
        if (val === 'column') return 'flex-col';
        if (val === 'row-reverse') return 'flex-row-reverse';
        if (val === 'column-reverse') return 'flex-col-reverse';
    }

    if (prop === 'justify-content') {
        if (val === 'center') return 'justify-center';
        if (val === 'flex-start') return 'justify-start';
        if (val === 'flex-end') return 'justify-end';
        if (val === 'space-between') return 'justify-between';
        if (val === 'space-around') return 'justify-around';
    }

    if (prop === 'align-items') {
        if (val === 'center') return 'items-center';
        if (val === 'flex-start') return 'items-start';
        if (val === 'flex-end') return 'items-end';
        if (val === 'stretch') return 'items-stretch';
    }

    if (prop === 'text-align') {
        if (val === 'center') return 'text-center';
        if (val === 'left') return 'text-left';
        if (val === 'right') return 'text-right';
        if (val === 'justify') return 'text-justify';
    }

    return null;
}

/**
 * 변환 확신도 계산
 */
function calculateConfidence(property: string): number {
    const standardProps = ['display', 'flex-direction', 'justify-content', 'align-items', 'text-align'];
    if (standardProps.includes(property.toLowerCase())) {
        return 0.95;
    }
    return 0.7;
}

/**
 * 사용된 색상 추론
 */
function inferUsedColors(): Record<string, string> {
    const colors: Record<string, string> = {};
    const colorMap = new Map<string, number>();

    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;

        [color, bg].forEach(c => {
            if (c && !c.includes('rgba(0, 0, 0, 0)')) {
                const hex = rgbStringToHex(c);
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }
        });
    });

    const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    sortedColors.forEach(([color], i) => {
        colors[`custom-${i + 1}`] = color;
    });

    return colors;
}

/**
 * 간단한 객체 파싱
 */
function parseSimpleObject(): Record<string, unknown> {
    try {
        return {};
    } catch {
        return {};
    }
}

/**
 * 요소 선택자 생성
 */
function getSelector(element: Element): string {
    if (element.id) {
        return `#${element.id}`;
    }

    const classes = Array.from(element.classList)
        .filter(c => c.length < 20)
        .slice(0, 2)
        .join('.');

    if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
    }

    return element.tagName.toLowerCase();
}

/**
 * Tailwind 간단 매핑 (hover 시 클릭용)
 */
export function mapToTailwind(el: HTMLElement): string {
    const style = window.getComputedStyle(el);
    const classes: string[] = [];

    if (style.color && style.color !== 'rgba(0, 0, 0, 0)') classes.push(`text-[${style.color.replace(/\s/g, '')}]`);
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') classes.push(`bg-[${style.backgroundColor.replace(/\s/g, '')}]`);

    if (style.fontSize) classes.push(`text-[${style.fontSize}]`);
    if (style.fontWeight === '700' || style.fontWeight === 'bold') classes.push('font-bold');
    else if (style.fontWeight === '600') classes.push('font-semibold');
    else if (style.fontWeight === '500') classes.push('font-medium');

    if (style.textAlign) classes.push(`text-${style.textAlign}`);

    if (style.padding && style.padding !== '0px') classes.push(`p-[${style.padding.replace(/\s/g, '_')}]`);
    if (style.margin && style.margin !== '0px') classes.push(`m-[${style.margin.replace(/\s/g, '_')}]`);

    if (style.display === 'flex') {
        classes.push('flex');
        if (style.flexDirection) classes.push(`flex-${style.flexDirection.replace('row', 'row').replace('column', 'col')}`);
        if (style.alignItems) classes.push(`items-${style.alignItems}`);
        if (style.justifyContent) classes.push(`justify-${style.justifyContent.replace('space-between', 'between').replace('center', 'center')}`);
        if (style.gap && style.gap !== '0px') classes.push(`gap-[${style.gap}]`);
    } else if (style.display === 'grid') {
        classes.push('grid');
    } else if (style.display === 'block') {
        classes.push('block');
    } else if (style.display === 'none') {
        classes.push('hidden');
    }

    if (style.borderRadius && style.borderRadius !== '0px') classes.push(`rounded-[${style.borderRadius}]`);

    return classes.join(' ');
}
