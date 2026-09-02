/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 setTooltip；依赖 core/commands 的 COPY_PATH_COMMAND、
 *          core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerFilePath，交回一个「按当前设置重画」的同步函数
 * [POS]: 文件模块的第二个成员，回答「我此刻在哪一篇」。
 *        它在右下角状态栏常驻当前笔记的完整路径，点一下把路径复制走。
 *        与外观开关做邻居不是巧合：那两个都是「插件往用户屏幕上常驻一样东西」，
 *        因此都必须给出撤走它的办法——开关关掉即收起，命令照常可用。
 *        路径这件事有两个出口而不是一个：状态栏那一块用来**看**，
 *        命令用来在没有状态栏（或者手机上）时也能**拿**，两者调同一段复制
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, setTooltip } from 'obsidian';
import { COPY_PATH_COMMAND } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';

const TEXTS = {
    tooltip: '当前笔记路径：点一下复制',
    /** 没有打开任何笔记时状态栏留空而不是写「无」——一句「无」比空白更占注意力 */
    empty: '',
    copied: '已复制路径：',
    noFile: '当前没有打开任何笔记，没有路径可复制。',
    failed: '复制失败：',
} as const;

// ============================================================
// 装配
// ============================================================

export function registerFilePath(ctx: ZiminosContext): () => void {
    const bar = new FilePathBar(ctx);

    return () => bar.sync();
}

class FilePathBar {
    private readonly ctx: ZiminosContext;

    private readonly statusEl: HTMLElement;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;
        this.statusEl = ctx.plugin.addStatusBarItem();

        this.statusEl.addClass('ziminos-file-path');
        this.statusEl.addClass('mod-clickable');
        setTooltip(this.statusEl, TEXTS.tooltip, { placement: 'top' });
        this.statusEl.addEventListener('click', () => void this.copy());

        const { app, plugin } = ctx;

        // 两个事件都要听：换文件走 file-open，而在两个开着同一篇的标签之间切换只有
        // active-leaf-change。少听一个就会出现「路径还是上一篇的」那种最难察觉的错
        plugin.registerEvent(app.workspace.on('file-open', () => this.sync()));
        plugin.registerEvent(app.workspace.on('active-leaf-change', () => this.sync()));

        ctx.commands.register(COPY_PATH_COMMAND, () => void this.copy());

        this.sync();
    }

    /** 按当前设置决定显隐，并把文字换成此刻这一篇的路径。设置页与两个事件走同一个入口 */
    sync(): void {
        this.statusEl.toggle(this.ctx.settings.showFilePath);
        this.statusEl.setText(this.path() ?? TEXTS.empty);
    }

    /**
     * 此刻这一篇的路径。
     *
     * 取的是 workspace.getActiveFile() 而不是活动视图里的文件：焦点落在侧栏（比如刚点了
     * 最近文件那张清单）时活动视图不是 Markdown 视图，但用户心里「当前这一篇」并没有变。
     */
    private path(): string | null {
        return this.ctx.app.workspace.getActiveFile()?.path ?? null;
    }

    /** 复制路径。状态栏那一块与命令走的是这同一段，因此两条路的结果与提示语一字不差 */
    private async copy(): Promise<void> {
        const path = this.path();

        if (!path) {
            new Notice(TEXTS.noFile);

            return;
        }

        try {
            await navigator.clipboard.writeText(path);
            new Notice(TEXTS.copied + path);
        } catch (error) {
            new Notice(TEXTS.failed + (error instanceof Error ? error.message : String(error)));
        }
    }
}
