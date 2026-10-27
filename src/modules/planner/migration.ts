/**
 * [INPUT]: 依赖公开 Vault adapter 与 core/plannerSettings 验形。
 * [OUTPUT]: 提供首次继承独立试用显示偏好的读取入口。
 * [POS]: 升级边界；正式设置已有 planner 时不读旧插件，绝不写笔记。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Notice } from 'obsidian';
import type { App } from 'obsidian';
import { normalizePlannerPreferences } from '../../core/plannerSettings';
import type { PlannerPreferences } from '../../core/plannerSettings';
export async function inheritTrialPlannerSettings(app: App, saved: unknown): Promise<PlannerPreferences | undefined> {
    if (saved && typeof saved === 'object' && Object.prototype.hasOwnProperty.call(saved, 'planner')) return;
    const path = `${app.vault.configDir}/plugins/ziminos-week-planner/data.json`;
    try {
        if (!await app.vault.adapter.exists(path)) return;
        const trial: unknown = JSON.parse(await app.vault.adapter.read(path));
        if (!trial || typeof trial !== 'object' || Array.isArray(trial)) throw new Error('试用配置格式无效');
        return normalizePlannerPreferences(trial);
    } catch (error) {
        new Notice(`大日历试用设置未继承，原配置已保留：${String(error)}`, 7000);
    }
}
