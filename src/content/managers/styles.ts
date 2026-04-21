/**
 * Style Injector
 *
 * 모든 도구의 CSS를 중앙 관리하고 Shadow DOM을 통해 격리
 */

import { ToolType } from '../../sidepanel/constants/tools';

interface StyleBundle {
  toolId: ToolType;
  styles: string;
  styleId: string;
  injected: boolean;
}

class StyleInjector {
  private bundles = new Map<ToolType, StyleBundle>();
  private shadowRoot: ShadowRoot | null = null;
  private styleHost: HTMLElement | null = null;

  constructor() {
    this.createShadowRoot();
  }

  private createShadowRoot() {
    this.styleHost = document.createElement('div');
    this.styleHost.id = 'klic-style-host';
    this.styleHost.style.display = 'none';
    document.documentElement.appendChild(this.styleHost);

    this.shadowRoot = this.styleHost.attachShadow({ mode: 'open' });
  }

  register(toolId: ToolType, styles: string) {
    const styleId = `klic-${toolId}-styles`;

    this.bundles.set(toolId, {
      toolId,
      styles,
      styleId,
      injected: false,
    });
  }

  inject(toolId: ToolType) {
    const bundle = this.bundles.get(toolId);
    if (!bundle || bundle.injected) return;

    const style = document.createElement('style');
    style.id = bundle.styleId;
    style.textContent = bundle.styles;

    if (this.shadowRoot) {
      this.shadowRoot.appendChild(style);
    }

    bundle.injected = true;
  }

  injectAll() {
    this.bundles.forEach((_, toolId) => {
      this.inject(toolId);
    });
  }

  remove(toolId: ToolType) {
    const bundle = this.bundles.get(toolId);
    if (!bundle || !bundle.injected) return;

    const style = this.shadowRoot?.getElementById(bundle.styleId);
    if (style) {
      style.remove();
    }

    bundle.injected = false;
  }

  removeAll() {
    this.bundles.forEach((_, toolId) => {
      this.remove(toolId);
    });
  }

  update(toolId: ToolType, styles: string) {
    this.remove(toolId);

    const bundle = this.bundles.get(toolId);
    if (bundle) {
      bundle.styles = styles;
      this.inject(toolId);
    }
  }

  isInjected(toolId: ToolType): boolean {
    const bundle = this.bundles.get(toolId);
    return bundle?.injected ?? false;
  }

  destroy() {
    this.removeAll();
    if (this.styleHost) {
      this.styleHost.remove();
      this.styleHost = null;
      this.shadowRoot = null;
    }
  }
}

export const styleInjector = new StyleInjector();
