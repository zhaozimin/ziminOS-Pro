/**
 * [INPUT]: 接收未知 JSON，不依赖 Obsidian 与业务模块。
 * [OUTPUT]: 提供大日历显示偏好、默认值与严格验形。
 * [POS]: 全局设置与大日历共用的持久化边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const PLANNER_MIN_ZOOM = 100;
export const PLANNER_MAX_ZOOM = 400;
export interface PlannerPreferences {
    startHour: number; endHour: number; zoom: number; cardTemplate: string;
}
export const DEFAULT_PLANNER_PREFERENCES: PlannerPreferences = {
    startHour: 0, endHour: 24, zoom: PLANNER_MIN_ZOOM,
    cardTemplate: '90-system/Template/卡片笔记模板.md',
};
export function normalizePlannerPreferences(input: unknown): PlannerPreferences {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
    const result = { ...DEFAULT_PLANNER_PREFERENCES };
    const { startHour, endHour, zoom } = source;
    if (typeof startHour === 'number' && typeof endHour === 'number' && Number.isInteger(startHour * 4)
        && Number.isInteger(endHour * 4) && startHour >= 0 && endHour <= 24 && endHour - startHour >= .25) {
        result.startHour = startHour; result.endHour = endHour;
    }
    if (typeof zoom === 'number' && Number.isFinite(zoom) && zoom >= PLANNER_MIN_ZOOM && zoom <= PLANNER_MAX_ZOOM) result.zoom = zoom;
    if (typeof source.cardTemplate === 'string') {
        const path = source.cardTemplate.trim();
        if (path && !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..')) result.cardTemplate = path;
    }
    return result;
}
