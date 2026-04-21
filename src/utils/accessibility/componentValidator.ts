// src/utils/accessibility/componentValidator.ts
// Component Pattern Validator - KRDS Component Guidelines

import type { AccessibilityIssue, ValidationCategory } from '@/types/accessibility';
import { isButtonMinimumSize, hasProperLabel } from '@/constants/krds/components';

const category: ValidationCategory = 'component';

/**
 * Validate component patterns against KRDS component guidelines
 */
export function validateComponents(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  issues.push(...checkButtonSizes(elements));
  issues.push(...checkFormLabels(elements));
  issues.push(...checkModals(elements));
  issues.push(...checkFormFieldsets(elements));
  issues.push(...checkAccordions(elements));
  issues.push(...checkAlerts(elements));
  issues.push(...checkFocusAppearance());
  issues.push(...checkDraggingAlternatives(elements));
  issues.push(...checkRedundantEntry(elements));
  issues.push(...checkAuthenticationSupport(elements));
  issues.push(...checkConsistentHelp(elements));

  return issues;
}

/**
 * Check button minimum touch target size (44x44px)
 */
function checkButtonSizes(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const buttons = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    return tag === 'button' || role === 'button';
  });

  for (const button of buttons) {
    const rect = button.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (!isButtonMinimumSize(width, height)) {
      issues.push({
        id: `button-size-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'button-min-size',
        message: `버튼 크기가 부족합니다 (${width}x${height}px, 최소 44x44px 필요)`,
        suggestion: '버튼 크기를 44x44px 이상으로 늘리세요',
        wcagCriteria: '2.5.8',
        krdsCriteria: 'button-min-size',
        element: {
          tagName: button.tagName.toLowerCase(),
          selector: generateSelector(button),
          outerHTML: button.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

/**
 * Check form input labels
 */
function checkFormLabels(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const inputs = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    return ['input', 'select', 'textarea'].includes(tag);
  });

  for (const input of inputs) {
    if (!hasProperLabel(input as HTMLInputElement)) {
      issues.push({
        id: `form-label-${Date.now()}-${Math.random()}`,
        category,
        severity: 'critical',
        rule: 'form-label',
        message: '입력 요소에 레이블이 연결되지 않았습니다',
        suggestion: 'label 태그를 연결하거나 aria-label을 추가하세요',
        wcagCriteria: '1.3.1',
        krdsCriteria: 'form-label',
        element: {
          tagName: input.tagName.toLowerCase(),
          selector: generateSelector(input),
          outerHTML: input.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

/**
 * Check modal focus trap
 */
function checkModals(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const modals = elements.filter((el) => {
    const role = el.getAttribute('role');
    const dialog = el.tagName.toLowerCase() === 'dialog';
    return role === 'dialog' || dialog;
  });

  for (const modal of modals) {
    // Check for ESC key handler (presence of close button suggests this)
    const closeButton = modal.querySelector('button[aria-label*="close"], button[aria-label*="닫"], [data-dismiss]');
    if (!closeButton) {
      issues.push({
        id: `modal-close-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'modal-escape',
        message: '모달에 닫기 버튼이 없습니다',
        suggestion: 'ESC 키로 닫을 수 있는 닫기 버튼을 추가하세요',
        krdsCriteria: 'modal-escape',
        element: {
          tagName: modal.tagName.toLowerCase(),
          selector: generateSelector(modal),
          outerHTML: modal.outerHTML.substring(0, 200),
        },
      });
    }

    // Check for focus trap attributes
    const hasAriaModal = modal.getAttribute('aria-modal') === 'true';
    if (!hasAriaModal) {
      issues.push({
        id: `modal-trap-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'modal-focus-trap',
        message: '모달에 aria-modal 속성이 없습니다',
        suggestion: 'aria-modal="true" 속성을 추가하여 포커스 트랩을 구현하세요',
        krdsCriteria: 'modal-focus-trap',
        element: {
          tagName: modal.tagName.toLowerCase(),
          selector: generateSelector(modal),
          outerHTML: modal.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

/**
 * Check form fieldset grouping for related inputs
 */
function checkFormFieldsets(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check radio button groups
  const radioGroups: Record<string, HTMLElement[]> = {};
  const radios = elements.filter((el) => el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'radio');

  for (const radio of radios) {
    const name = radio.getAttribute('name') || 'unnamed';
    if (!radioGroups[name]) {
      radioGroups[name] = [];
    }
    radioGroups[name].push(radio);
  }

  for (const [name, group] of Object.entries(radioGroups)) {
    if (group.length > 1) {
      const parentFieldset = group[0].closest('fieldset');
      if (!parentFieldset) {
        issues.push({
          id: `form-fieldset-${Date.now()}-${Math.random()}`,
          category,
          severity: 'medium',
          rule: 'form-fieldset',
          message: `관련 라디오 버튼이 fieldset으로 그룹화되지 않았습니다 (${name})`,
          suggestion: 'fieldset와 legend를 사용하여 관련 입력을 그룹화하세요',
          krdsCriteria: 'form-fieldset',
          element: {
            tagName: group[0].tagName.toLowerCase(),
            selector: generateSelector(group[0]),
            outerHTML: group[0].outerHTML.substring(0, 200),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Check accordion keyboard support
 */
function checkAccordions(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const accordions = elements.filter((el) => {
    return el.classList.contains('accordion') ||
           el.getAttribute('role') === 'region' ||
           el.closest('.accordion');
  });

  for (const accordion of accordions) {
    // Check for aria-expanded
    const headers = accordion.querySelectorAll('[aria-expanded]');
    for (const header of headers) {
      const expanded = header.getAttribute('aria-expanded');
      const controlled = header.getAttribute('aria-controls');

      if (expanded && !controlled) {
        issues.push({
          id: `accordion-aria-${Date.now()}-${Math.random()}`,
          category,
          severity: 'high',
          rule: 'accordion-keyboard',
          message: '아코디언 헤더에 aria-controls가 누락되었습니다',
          suggestion: 'aria-controls 속성으로 패널을 연결하세요',
          krdsCriteria: 'accordion-keyboard',
          element: {
            tagName: header.tagName.toLowerCase(),
            selector: generateSelector(header as HTMLElement),
            outerHTML: header.outerHTML.substring(0, 200),
          },
        });
      }
    }

    // Check for keyboard activation (Enter/Space support)
    const buttons = accordion.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const tabIndex = button.getAttribute('tabindex');
      if (tabIndex === '-1' || tabIndex === null) {
        issues.push({
          id: `accordion-tab-${Date.now()}-${Math.random()}`,
          category,
          severity: 'medium',
          rule: 'accordion-keyboard',
          message: '아코디언 버튼에 키보드 접근이 제한되었습니다',
          suggestion: 'tabindex="0"을 추가하여 키보드로 접근 가능하게 하세요',
          krdsCriteria: 'accordion-keyboard',
          element: {
            tagName: button.tagName.toLowerCase(),
            selector: generateSelector(button as HTMLElement),
            outerHTML: button.outerHTML.substring(0, 200),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Check alert/error handling
 */
function checkAlerts(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const alerts = elements.filter((el) => {
    const role = el.getAttribute('role');
    return role === 'alert' || role === 'alertdialog' || el.classList.contains('alert');
  });

  for (const alert of alerts) {
    // Check for aria-live (for dynamic alerts)
    const hasLiveRegion = alert.closest('[aria-live]') || alert.getAttribute('aria-live');

    if (!hasLiveRegion) {
      issues.push({
        id: `alert-live-${Date.now()}-${Math.random()}`,
        category,
        severity: 'medium',
        rule: 'error-handling',
        message: '알림에 aria-live 속성이 없습니다',
        suggestion: 'aria-live="polite" 또는 aria-live="assertive"를 추가하여 스크린리더에 알리세요',
        krdsCriteria: 'error-handling',
        element: {
          tagName: alert.tagName.toLowerCase(),
          selector: generateSelector(alert),
          outerHTML: alert.outerHTML.substring(0, 200),
        },
      });
    }

    // Check for aria-atomic for complete messages
    if (!alert.getAttribute('aria-atomic')) {
      issues.push({
        id: `alert-atomic-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'error-handling',
        message: '알림에 aria-atomic 속성이 없습니다',
        suggestion: 'aria-atomic="true"을 추가하여 메시지 전체를 읽히게 하세요',
        krdsCriteria: 'error-handling',
        element: {
          tagName: alert.tagName.toLowerCase(),
          selector: generateSelector(alert),
          outerHTML: alert.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

function checkFocusAppearance(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const suppressedSelectors: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type !== CSSRule.STYLE_RULE) continue;

      const styleRule = rule as CSSStyleRule;
      const selector = styleRule.selectorText || '';
      if (!selector.includes(':focus') && !selector.includes(':focus-visible')) continue;

      const outline = (styleRule.style.outline || '').trim().toLowerCase();
      const outlineStyle = (styleRule.style.outlineStyle || '').trim().toLowerCase();
      const outlineWidth = (styleRule.style.outlineWidth || '').trim().toLowerCase();
      const boxShadow = (styleRule.style.boxShadow || '').trim().toLowerCase();
      const borderWidth = (styleRule.style.borderWidth || '').trim().toLowerCase();
      const borderStyle = (styleRule.style.borderStyle || '').trim().toLowerCase();

      const removesOutline = outline === 'none' || outlineStyle === 'none' || outlineWidth === '0px' || outlineWidth === '0';
      const removesBoxShadow = boxShadow === '' || boxShadow === 'none';
      const hasBorderIndicator = borderStyle !== '' && borderStyle !== 'none' && borderWidth !== '' && borderWidth !== '0px' && borderWidth !== '0';

      if (removesOutline && removesBoxShadow && !hasBorderIndicator) {
        suppressedSelectors.push(selector);
      }
    }
  }

  if (suppressedSelectors.length > 0) {
    issues.push({
      id: `focus-appearance-${Date.now()}`,
      category,
      severity: 'medium',
      rule: 'focus-appearance',
      message: '포커스 표시가 제거되어 키보드 사용 시 현재 위치를 파악하기 어렵습니다',
      suggestion: ':focus 또는 :focus-visible에서 명확한 포커스 스타일을 제공하세요',
      wcagCriteria: '2.4.13',
      element: suppressedSelectors[0],
    });
  }

  return issues;
}

function checkDraggingAlternatives(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const draggableElements = elements.filter((el) => {
    const role = el.getAttribute('role') || '';
    return el.getAttribute('draggable') === 'true' ||
      el.hasAttribute('aria-grabbed') ||
      el.hasAttribute('ondragstart') ||
      role === 'application' ||
      el.classList.contains('draggable') ||
      el.getAttribute('data-draggable') === 'true';
  });

  const seenSelectors = new Set<string>();

  for (const draggable of draggableElements) {
    const selector = generateSelector(draggable);
    if (seenSelectors.has(selector)) continue;
    seenSelectors.add(selector);

    const keyboardAccessible = isKeyboardAccessible(draggable);
    const hasAlternative = hasDragAlternativeControl(draggable);

    if (!keyboardAccessible && !hasAlternative) {
      issues.push({
        id: `drag-alt-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'dragging-movements',
        message: '드래그 동작을 대체할 단일 포인터/키보드 조작 방법이 확인되지 않았습니다',
        suggestion: '이동/정렬을 위한 버튼 또는 키보드 조작 대안을 제공하세요',
        wcagCriteria: '2.5.7',
        element: {
          tagName: draggable.tagName.toLowerCase(),
          selector,
          outerHTML: draggable.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

function checkRedundantEntry(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const forms = Array.from(new Set(elements
    .map((el) => el.closest('form'))
    .filter((form): form is HTMLFormElement => form instanceof HTMLFormElement)));

  for (const form of forms) {
    const groupedByAutocomplete = new Map<string, HTMLElement[]>();
    const fields = Array.from(form.querySelectorAll<HTMLElement>('input[autocomplete], textarea[autocomplete], select[autocomplete]'));

    for (const field of fields) {
      const token = (field.getAttribute('autocomplete') || '').trim().toLowerCase();
      if (!token || token === 'off' || token === 'on') continue;
      if (token === 'new-password' || token === 'current-password' || token === 'one-time-code') continue;

      const bucket = groupedByAutocomplete.get(token) || [];
      bucket.push(field);
      groupedByAutocomplete.set(token, bucket);
    }

    for (const [token, groupedFields] of groupedByAutocomplete) {
      if (groupedFields.length < 2) continue;

      const emptyFields = groupedFields.filter((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          return field.value.trim() === '';
        }
        if (field instanceof HTMLSelectElement) {
          return (field.value || '').trim() === '';
        }
        return true;
      });

      if (emptyFields.length < 2) continue;

      const target = groupedFields[0];
      issues.push({
        id: `redundant-entry-${Date.now()}-${Math.random()}`,
        category,
        severity: 'low',
        rule: 'redundant-entry',
        message: `동일한 입력(${token})이 여러 번 요구될 수 있습니다`,
        suggestion: '이전 입력값 자동 채우기 또는 선택 기반 재사용 방식을 제공하세요',
        wcagCriteria: '3.3.7',
        element: {
          tagName: target.tagName.toLowerCase(),
          selector: generateSelector(target),
          outerHTML: target.outerHTML.substring(0, 200),
        },
      });
      break;
    }
  }

  return issues;
}

function checkAuthenticationSupport(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const passwordInputs = elements.filter((el) => el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'password');

  for (const passwordInput of passwordInputs) {
    const input = passwordInput as HTMLInputElement;
    const form = input.closest('form') || document.body;
    const autocomplete = (input.getAttribute('autocomplete') || '').trim().toLowerCase();
    const onPaste = (input.getAttribute('onpaste') || '').toLowerCase();

    if (!autocomplete) {
      issues.push({
        id: `auth-autocomplete-${Date.now()}-${Math.random()}`,
        category,
        severity: 'medium',
        rule: 'auth-autocomplete',
        message: '인증 입력에 autocomplete 속성이 없어 보조기술/자동완성 사용이 제한될 수 있습니다',
        suggestion: '비밀번호 필드에 autocomplete="current-password" 또는 "new-password"를 지정하세요',
        wcagCriteria: '3.3.8',
        element: {
          tagName: input.tagName.toLowerCase(),
          selector: generateSelector(input),
          outerHTML: input.outerHTML.substring(0, 200),
        },
      });
    }

    if (onPaste.includes('return false') || onPaste.includes('preventdefault')) {
      issues.push({
        id: `auth-paste-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'auth-no-paste',
        message: '비밀번호 필드에서 붙여넣기를 차단하고 있습니다',
        suggestion: '붙여넣기 차단을 제거해 비밀번호 관리자 사용을 허용하세요',
        wcagCriteria: '3.3.8',
        element: {
          tagName: input.tagName.toLowerCase(),
          selector: generateSelector(input),
          outerHTML: input.outerHTML.substring(0, 200),
        },
      });
    }

    const hasCaptcha = form.querySelector('[class*="captcha" i], [id*="captcha" i], iframe[src*="captcha" i], [aria-label*="captcha" i]') !== null;
    const hasCaptchaAlternative = form.querySelector('[aria-label*="audio" i], [aria-label*="대체" i], [data-captcha-alt], button[title*="audio" i], button[title*="alternative" i]') !== null;
    if (hasCaptcha && !hasCaptchaAlternative) {
      issues.push({
        id: `auth-captcha-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'auth-captcha-alternative',
        message: '인증 절차에 대체 가능한 CAPTCHA 수단이 확인되지 않았습니다',
        suggestion: '오디오 CAPTCHA 또는 비인지 기반 대체 인증 수단을 제공하세요',
        wcagCriteria: '3.3.8',
        element: {
          tagName: input.tagName.toLowerCase(),
          selector: generateSelector(input),
          outerHTML: input.outerHTML.substring(0, 200),
        },
      });
    }

    const hasRevealToggle = form.querySelector('[data-password-toggle], button[aria-label*="password" i], button[aria-label*="비밀번호" i], button[title*="show" i], button[title*="보기" i]') !== null;
    const hasAlternativeAuth = document.querySelector('[aria-label*="passkey" i], [aria-label*="security key" i], [aria-label*="생체" i], [data-passkey], [data-webauthn]') !== null;

    if (!hasRevealToggle && !hasAlternativeAuth) {
      issues.push({
        id: `auth-enhanced-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'auth-cognitive-support',
        message: '인지 부담 완화를 위한 보조 인증 UI(비밀번호 표시/패스키)가 확인되지 않았습니다',
        suggestion: '비밀번호 표시 토글 또는 패스키/보안키 기반 인증을 함께 제공하세요',
        wcagCriteria: '3.3.9',
        element: {
          tagName: input.tagName.toLowerCase(),
          selector: generateSelector(input),
          outerHTML: input.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

function checkConsistentHelp(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const formFieldElements = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (!['input', 'select', 'textarea'].includes(tag)) {
      return false;
    }

    if (tag !== 'input') {
      return true;
    }

    const type = (el as HTMLInputElement).type.toLowerCase();
    return !['hidden', 'submit', 'button', 'image', 'reset'].includes(type);
  });

  const forms = Array.from(new Set(formFieldElements
    .map((el) => el.closest('form'))
    .filter((form): form is HTMLFormElement => form instanceof HTMLFormElement)));

  if (forms.length < 2) {
    return issues;
  }

  const helpSelector = [
    'a[href*="help" i]',
    'a[href*="support" i]',
    'a[href*="faq" i]',
    'button[aria-label*="help" i]',
    'button[aria-label*="도움" i]',
    '[data-help]',
    '[class*="help" i]',
    '[id*="help" i]',
  ].join(', ');

  const hasGlobalHelp = document.querySelector([
    `header ${helpSelector}`,
    `[role="navigation"] ${helpSelector}`,
    '[data-help-global]',
    '[aria-label*="customer support" i]',
    '[aria-label*="고객센터" i]',
  ].join(', ')) !== null;

  if (hasGlobalHelp) {
    return issues;
  }

  const hasLocalHelp = forms.map((form) => form.querySelector(helpSelector) !== null);
  const hasHelpForm = hasLocalHelp.some((v) => v);
  const hasMissingHelpForm = hasLocalHelp.some((v) => !v);

  if (hasHelpForm && hasMissingHelpForm) {
    const targetForm = forms[hasLocalHelp.findIndex((v) => !v)] ?? forms[0];
    issues.push({
      id: `consistent-help-${Date.now()}-${Math.random()}`,
      category,
      severity: 'info',
      rule: 'consistent-help',
      message: '반복되는 입력 구간에서 도움말 제공이 일관되지 않을 수 있습니다',
      suggestion: '동일한 입력 단계에는 동일한 도움말/지원 수단을 같은 위치에 제공하세요',
      wcagCriteria: '3.2.6',
      element: {
        tagName: targetForm.tagName.toLowerCase(),
        selector: generateSelector(targetForm),
        outerHTML: targetForm.outerHTML.substring(0, 200),
      },
    });
  }

  return issues;
}

function isKeyboardAccessible(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role') || '';
  const tabIndex = el.getAttribute('tabindex');

  if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) {
    return true;
  }

  if (role === 'button' || role === 'link' || role === 'menuitem') {
    return true;
  }

  if (tabIndex === null) {
    return false;
  }

  const parsed = Number(tabIndex);
  return Number.isFinite(parsed) && parsed >= 0;
}

function hasDragAlternativeControl(el: HTMLElement): boolean {
  const container = el.closest('[data-sortable], [role="list"], [role="listbox"], [role="grid"], ul, ol, table, form') || el.parentElement;
  if (!container) {
    return false;
  }

  const controls = Array.from(container.querySelectorAll<HTMLElement>('button, [role="button"], a[href], input[type="number"], select'));
  const hintRegex = /(move|reorder|sort|up|down|left|right|이동|정렬|순서|위|아래)/i;

  if (controls.some((control) => {
    const label = `${control.textContent || ''} ${control.getAttribute('aria-label') || ''} ${control.getAttribute('title') || ''}`;
    return hintRegex.test(label);
  })) {
    return true;
  }

  const describedBy = el.getAttribute('aria-describedby');
  if (!describedBy) {
    return false;
  }

  const describedText = describedBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent || '')
    .join(' ');

  return hintRegex.test(describedText);
}

/**
 * Generate CSS selector for element
 */
function generateSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className
        .toString()
        .split(' ')
        .filter((c) => c.length > 0)
        .map((c) => `.${c}`)
        .slice(0, 3);
      selector += classes.join('');
    }

    path.unshift(selector);
    current = current.parentElement as HTMLElement;
    if (path.length > 5) break;
  }

  return path.join(' > ');
}
