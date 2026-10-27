/**
 * [INPUT]: 依赖 ZiminosContext、正式命令台、公开视图 API 与 PlannerStore。
 * [OUTPUT]: 提供 registerWeekPlanner，以及打开日历、区间设置与人物检索补齐。
 * [POS]: 正式大日历唯一装配入口；复用全局设置，不另建 Plugin 实例。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Notice, debounce } from 'obsidian';
import { PLANNER_COMMANDS } from '../../core/commands';
import { normalizePlannerPreferences } from '../../core/plannerSettings';
import { today } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import type { PlannerHost, PlannerTemplates } from './host';
import { settingsOf, validDay, VIEW_TYPE } from './model';
import { PlannerStore } from './store';
import { RangeModal, WeekPlannerView } from './view';

export function registerWeekPlanner(ctx: ZiminosContext, templates: PlannerTemplates): WeekPlannerRuntime {
    const runtime = new WeekPlannerRuntime(ctx, templates); runtime.register(); return runtime;
}
export class WeekPlannerRuntime implements PlannerHost {
    readonly app;
    readonly settings;
    readonly store;
    private snapshot = '';
    private disposed = false;
    constructor(private ctx: ZiminosContext, templates: PlannerTemplates) {
        this.app = ctx.app;
        this.settings = settingsOf({ ...ctx.settings, ...ctx.settings.planner });
        this.store = new PlannerStore(this.app, this.settings, templates);
    }
    register(): void {
        const { plugin, commands } = this.ctx;
        plugin.registerView(VIEW_TYPE, leaf => new WeekPlannerView(leaf, this));
        commands.register(PLANNER_COMMANDS.open, () => { void this.showPlanner(); });
        commands.register(PLANNER_COMMANDS.range, () => this.showRange());
        commands.register(PLANNER_COMMANDS.people, async () => {
            try { await this.refreshPlanner(); const count = await this.store.addPeopleQueries(); new Notice(`已为 ${count} 份档案补齐预设任务检索。`); }
            catch (error) { new Notice(String(error), 9000); }
        });
        plugin.registerObsidianProtocolHandler('ziminos-calendar', async params => {
            if (params.vault && params.vault !== this.app.vault.getName()) return;
            await this.showPlanner(validDay(params.date ?? '') ? params.date : today(), params.event ?? '');
        });
        const update = debounce(() => { void this.refreshPlanner(); }, 180, true);
        plugin.registerEvent(this.app.metadataCache.on('changed', update));
        plugin.registerEvent(this.app.metadataCache.on('resolved', update));
        plugin.registerEvent(this.app.vault.on('delete', update));
        plugin.registerEvent(this.app.vault.on('rename', update));
        plugin.registerEvent(this.app.workspace.on('active-leaf-change', update));
        plugin.register(() => { this.disposed = true; update.cancel(); });
    }
    showRange(): void { new RangeModal(this).open(); }
    async refreshPlanner(): Promise<void> {
        if (this.disposed) return;
        for (const key of ['projectFolder', 'areaFolder', 'archiveFolder', 'dateTimeFormat'] as const) this.settings[key] = this.ctx.settings[key];
        this.settings.cardTemplate = this.ctx.settings.planner.cardTemplate;
        try {
            await this.store.refresh();
            if (this.disposed) return;
            const next = JSON.stringify([this.store.events, this.store.containers, this.store.people, this.store.issues]);
            if (next !== this.snapshot) { this.snapshot = next; this.repaintPlanner(); }
        } catch (error) { new Notice(`大日历刷新失败：${String(error)}`, 7000); }
    }
    repaintPlanner(): void {
        for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) if (leaf.view instanceof WeekPlannerView) leaf.view.renderWeek();
    }
    async savePlannerSettings(): Promise<void> {
        const { startHour, endHour, zoom } = this.settings;
        this.ctx.settings.planner = normalizePlannerPreferences({ ...this.ctx.settings.planner, startHour, endHour, zoom });
        await this.ctx.saveSettings();
    }
    async showPlanner(day?: string, event?: string): Promise<void> {
        let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) { leaf = this.app.workspace.getLeaf('tab'); await leaf.setViewState({ type: VIEW_TYPE, active: true }); }
        await this.app.workspace.revealLeaf(leaf); await this.refreshPlanner();
        if (day && leaf.view instanceof WeekPlannerView) leaf.view.revealArrangement(day, event);
    }
}
