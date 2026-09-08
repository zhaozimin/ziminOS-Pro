/**
 * [INPUT]: 依赖 obsidian 的 App/MarkdownView/TFile 公开视图契约
 * [OUTPUT]: 对外提供 withPreservedMarkdownScroll，在后台写笔记时保住所有已加载分栏的滚动位置
 * [POS]: core 的 Markdown 视图稳定层。Vault.process 与 processFrontMatter 负责文件一致性，
 *        本文件只修补它们从磁盘回推到已打开 MarkdownView 时可能丢失的滚动状态；
 *        业务模块因此不需要各自认识分栏、实时预览或阅读视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownView } from 'obsidian';
import type { App, MarkdownViewModeType, TFile } from 'obsidian';

interface MarkdownScrollMark {
    readonly view: MarkdownView;
    readonly path: string;
    readonly mode: MarkdownViewModeType;
    readonly scroll: number;
}

/**
 * 执行一次文件写入，并保住这篇笔记在每个已加载 Markdown 分栏中的滚动位置。
 *
 * 立即恢复处理同步回推，下一帧再恢复一次处理 CodeMirror/阅读视图的延后排版。
 * 只认仍在显示同一路径、且模式没变的原视图：写入期间用户若换了文件或切了模式，
 * 新选择比旧滚动位置优先。
 */
export async function withPreservedMarkdownScroll<T>(
    app: App,
    file: TFile,
    write: () => Promise<T>,
): Promise<T> {
    const marks = captureMarkdownScroll(app, file.path);

    if (marks.length === 0) return write();

    try {
        return await write();
    } finally {
        restoreMarkdownScroll(marks);

        // 外部写入触发的视图重排可能晚于 Promise 完成，下一帧再把视口放回去。
        window.requestAnimationFrame(() => restoreMarkdownScroll(marks));
    }
}

function captureMarkdownScroll(app: App, path: string): MarkdownScrollMark[] {
    const marks: MarkdownScrollMark[] = [];

    // Obsidian 1.7.2 起后台页签可能是 DeferredView；instanceof 是官方要求的边界。
    app.workspace.iterateAllLeaves((leaf) => {
        if (!(leaf.view instanceof MarkdownView) || leaf.view.file?.path !== path) return;

        const mode = leaf.view.getMode();
        const scroll = leaf.view.currentMode.getScroll();

        if (!Number.isFinite(scroll) || scroll < 0) return;

        marks.push({ view: leaf.view, path, mode, scroll });
    });

    return marks;
}

function restoreMarkdownScroll(marks: readonly MarkdownScrollMark[]): void {
    for (const mark of marks) {
        if (mark.view.file?.path !== mark.path || mark.view.getMode() !== mark.mode) continue;

        mark.view.currentMode.applyScroll(mark.scroll);
    }
}
