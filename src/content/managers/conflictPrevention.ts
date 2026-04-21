/**
 * Conflict Prevention System
 *
 * 도구 간 충돌을 감지하고 해결
 */

import { ToolType, isExclusiveTool } from '../../sidepanel/constants/tools';

export type ConflictResolution = 'disable1' | 'disable2' | 'coexist' | 'priority1' | 'priority2';

export interface ConflictRule {
  tool1: ToolType;
  tool2: ToolType;
  resolution: ConflictResolution;
  description?: string;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingTools: ToolType[];
  resolution?: ConflictResolution;
  description?: string;
}

/**
 * Conflict Prevention 클래스
 */
export class ConflictPrevention {
  private rules: ConflictRule[] = [
    // 독점 도구들은 서로 충돌 (우선순위: 첫 번째 도구)
    { tool1: 'textEdit' as ToolType, tool2: 'screenshot' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'textEdit' as ToolType, tool2: 'cssScan' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'textEdit' as ToolType, tool2: 'tailwind' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'textEdit' as ToolType, tool2: 'ruler' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'screenshot' as ToolType, tool2: 'cssScan' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'screenshot' as ToolType, tool2: 'tailwind' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'screenshot' as ToolType, tool2: 'ruler' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'cssScan' as ToolType, tool2: 'tailwind' as ToolType, resolution: 'coexist' as ConflictResolution, description: 'CSS 스캔과 Tailwind는 공존 가능' },
    { tool1: 'cssScan' as ToolType, tool2: 'ruler' as ToolType, resolution: 'priority1' as ConflictResolution },
    { tool1: 'tailwind' as ToolType, tool2: 'ruler' as ToolType, resolution: 'priority1' as ConflictResolution },
  ];

  /**
   * 충돌 확인
   */
  checkConflict(toolId: ToolType, activeTools: ToolType[]): ConflictCheck {
    const conflicts: ConflictRule[] = [];

    for (const activeTool of activeTools) {
      if (activeTool === toolId) continue;

      const rule = this.findRule(toolId, activeTool);
      if (rule && rule.resolution !== 'coexist') {
        conflicts.push(rule);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictingTools: conflicts.map(c => c.tool1 === toolId ? c.tool2 : c.tool1),
      resolution: conflicts[0]?.resolution,
      description: conflicts[0]?.description,
    };
  }

  /**
   * 특정 두 도구 간의 충돌 확인
   */
  hasConflict(tool1: ToolType, tool2: ToolType): boolean {
    const rule = this.findRule(tool1, tool2);
    return rule?.resolution !== 'coexist';
  }

  /**
   * 충돌 해결
   */
  resolveConflict(toolId: ToolType, activeTools: ToolType[]): ToolType[] {
    const conflict = this.checkConflict(toolId, activeTools);

    if (!conflict.hasConflict) {
      return activeTools;
    }

    const toDisable: ToolType[] = [];

    switch (conflict.resolution) {
      case 'disable1':
        toDisable.push(conflict.conflictingTools[0]);
        break;
      case 'disable2':
        toDisable.push(toolId);
        break;
      case 'priority1':
        // tool1 우선 - toolId가 기존 도구들과 충돌하면 기존 도구 비활성화
        if (conflict.conflictingTools.includes(toolId)) {
          // 새 도구가 기존과 충돌 -> 기존 도구들 비활성화
          toDisable.push(...conflict.conflictingTools.filter(t => t !== toolId));
        } else {
          // 기존 도구가 새 도구와 충돌 -> 충돌하는 기존 도구 비활성화
          toDisable.push(...conflict.conflictingTools);
        }
        break;
      case 'priority2':
        // tool2 우선
        if (conflict.conflictingTools.includes(toolId)) {
          toDisable.push(toolId);
        } else {
          toDisable.push(...conflict.conflictingTools);
        }
        break;
      case 'coexist':
        // 아무것도 하지 않음
        break;
    }

    return activeTools.filter(tool => !toDisable.includes(tool));
  }

  /**
   * 공존 가능한지 확인
   */
  canCoexist(tool1: ToolType, tool2: ToolType): boolean {
    // 독점 도구들은 공존 불가
    if (isExclusiveTool(tool1) && isExclusiveTool(tool2)) {
      return false;
    }

    const rule = this.findRule(tool1, tool2);
    return rule?.resolution === 'coexist' || !rule;
  }

  /**
   * 충돌 규칙 찾기
   */
  private findRule(tool1: ToolType, tool2: ToolType): ConflictRule | undefined {
    return this.rules.find(rule =>
      (rule.tool1 === tool1 && rule.tool2 === tool2) ||
      (rule.tool1 === tool2 && rule.tool2 === tool1)
    );
  }

  /**
   * 모든 충돌 규칙 가져오기
   */
  getAllRules(): ConflictRule[] {
    return [...this.rules];
  }

  /**
   * 새 충돌 규칙 추가
   */
  addRule(rule: ConflictRule): void {
    // 기존 규칙 제거
    this.rules = this.rules.filter(r =>
      !((r.tool1 === rule.tool1 && r.tool2 === rule.tool2) ||
        (r.tool1 === rule.tool2 && r.tool2 === rule.tool1))
    );

    this.rules.push(rule);
  }

  /**
   * 충돌 규칙 제거
   */
  removeRule(tool1: ToolType, tool2: ToolType): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule =>
      !((rule.tool1 === tool1 && rule.tool2 === tool2) ||
        (rule.tool1 === tool2 && rule.tool2 === tool1))
    );
    return this.rules.length < initialLength;
  }

  /**
   * 도구와 충돌하는 모든 도구 목록
   */
  getConflictingTools(toolId: ToolType): ToolType[] {
    const conflicting = new Set<ToolType>();

    for (const rule of this.rules) {
      if (rule.tool1 === toolId && rule.resolution !== 'coexist') {
        conflicting.add(rule.tool2);
      }
      if (rule.tool2 === toolId && rule.resolution !== 'coexist') {
        conflicting.add(rule.tool1);
      }
    }

    return Array.from(conflicting);
  }
}

export const conflictPrevention = new ConflictPrevention();
