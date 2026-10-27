/**
 * [INPUT]: 依赖公开 App 类型、日历设置与 PlannerStore 类型。
 * [OUTPUT]: 提供 PlannerHost 与由 main 填入的 PlannerTemplates 契约。
 * [POS]: 视图只依赖此契约，不依赖 Plugin 或装配实现。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { App } from 'obsidian';
import type { PlannerSettings } from './model';
import type { PlannerStore } from './store';
export interface PlannerTemplates {
    card(): string;
    project(options: { description: string; created: string; uid: number }): string;
}
export interface PlannerHost {
    readonly app: App;
    readonly settings: PlannerSettings;
    readonly store: PlannerStore;
    refreshPlanner(): Promise<void>;
    repaintPlanner(): void;
    savePlannerSettings(): Promise<void>;
}
