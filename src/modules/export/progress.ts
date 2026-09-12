/**
 * [INPUT]: 依赖 obsidian 的 Modal 与 App 类型，依赖 ./progressBody 的纯 DOM 半边
 * [OUTPUT]: 对外提供 ExportProgress 契约与 openExportProgress
 * [POS]: 把那块进度条装进一个 Obsidian 弹窗——本文件只管**宿主**：开、关、标题、成功后自己退场。
 *        画什么、怎么推进全在 ./progressBody，那一半零 obsidian 依赖，因此演示页能原样拿去用。
 *
 *        它替换的是一条右上角的 Notice。用户的原话是「像盲盒一样，不知道到底有没有正常导出」，
 *        而那正是一条不会动的提示给人的感觉：摆到屏幕正中、每一步自报家门，才治得住
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Modal } from 'obsidian';
import type { App } from 'obsidian';
import { createProgressBody } from './progressBody';
import type { ProgressBody } from './progressBody';

/**
 * 调用方看得见的那一面。
 *
 * 它比 ProgressBody 少一个参数：失败时「知道了」按钮该做什么是**宿主**的事（关掉这个弹窗），
 * 不该让导出流程去操心。契约只留下导出流程真正需要说的三句话。
 */
export interface ExportProgress {
    step(label: string): Promise<void>;
    succeed(message: string): void;
    fail(message: string): void;
}

/** 成功之后停留多久再自动关掉。够读完一行字，又不至于让人等着去点它 */
const SUCCESS_LINGER_MS = 1_600;

export function openExportProgress(app: App, total: number): ExportProgress {
    const modal = new ExportProgressModal(app, total);

    modal.open();

    return modal;
}

class ExportProgressModal extends Modal implements ExportProgress {
    private readonly total: number;
    private body: ProgressBody | null = null;
    private timer: number | null = null;

    constructor(app: App, total: number) {
        super(app);

        this.total = total;
    }

    onOpen(): void {
        this.modalEl.addClass('ziminos-export-progress-modal');
        this.titleEl.setText('正在导出');
        this.contentEl.empty();

        this.body = createProgressBody(this.contentEl, {
            total: this.total,
            onTitle: (text) => this.titleEl.setText(text),
        });
    }

    onClose(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
        this.body = null;
        this.contentEl.empty();
    }

    step(label: string): Promise<void> {
        return this.body?.step(label) ?? Promise.resolve();
    }

    succeed(message: string): void {
        this.body?.succeed(message);
        this.timer = window.setTimeout(() => this.close(), SUCCESS_LINGER_MS);
    }

    fail(message: string): void {
        this.body?.fail(message, () => this.close());
    }
}
