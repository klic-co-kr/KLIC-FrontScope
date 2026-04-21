/**
 * Overlay Manager
 *
 * 모든 도구의 오버레이를 중앙 관리하고 z-index 충돌을 방지
 */

import { ToolType } from '../../sidepanel/constants/tools';

export interface OverlayController {
  show: () => void;
  hide: () => void;
  isVisible: () => boolean;
  getZIndex: () => number;
  setZIndex: (zIndex: number) => void;
  destroy: () => void;
}

interface OverlayManager {
  overlays: Map<ToolType, OverlayController>;
  zIndexes: Map<ToolType, number>;
  baseZIndex: number;
}

class OverlayManagerImpl implements OverlayManager {
  overlays = new Map<ToolType, OverlayController>();
  zIndexes = new Map<ToolType, number>();
  baseZIndex = 10000;

  register(toolId: ToolType, controller: OverlayController) {
    this.overlays.set(toolId, controller);
    this.zIndexes.set(toolId, this.baseZIndex + this.overlays.size);
  }

  unregister(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.destroy();
      this.overlays.delete(toolId);
      this.zIndexes.delete(toolId);
    }
  }

  show(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.show();
      this.bringToFront(toolId);
    }
  }

  hide(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.hide();
    }
  }

  hideAll() {
    this.overlays.forEach((controller) => {
      controller.hide();
    });
  }

  bringToFront(toolId: ToolType) {
    const maxZIndex = Math.max(...Array.from(this.zIndexes.values()), this.baseZIndex);
    const newZIndex = maxZIndex + 1;

    this.zIndexes.set(toolId, newZIndex);

    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.setZIndex(newZIndex);
    }
  }

  sendToBack(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.setZIndex(this.baseZIndex);
      this.zIndexes.set(toolId, this.baseZIndex);
    }
  }

  isVisible(toolId: ToolType): boolean {
    const controller = this.overlays.get(toolId);
    return controller ? controller.isVisible() : false;
  }

  getVisibleOverlays(): ToolType[] {
    return Array.from(this.overlays.entries())
      .filter(([, controller]) => controller.isVisible())
      .map(([toolId]) => toolId);
  }

  destroyAll() {
    this.overlays.forEach((controller) => {
      controller.destroy();
    });
    this.overlays.clear();
    this.zIndexes.clear();
  }

  getZIndex(toolId: ToolType): number {
    return this.zIndexes.get(toolId) ?? this.baseZIndex;
  }
}

export const overlayManager = new OverlayManagerImpl();
