/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 setTooltip；依赖 core/commands 的 COPY_PATH_COMMAND、
 *          core/localPath 的 localPath、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerFilePath，交回一个「按当前设置重画」的同步函数
 * [POS]: 文件模块的第二个成员，回答「我此刻在哪一篇」。
 *        它在右下角状态栏常驻当前笔记的路径，点一下把路径复制走。
 *        与外观开关做邻居不是巧合：那两个都是「插件往用户屏幕上常驻一样东西」，
 *        因此都必须给出撤走它的办法——开关关掉即收起，命令照常可用。
 *        路径这件事有两个出口而不是一个：状态栏那一块用来**看**，
 *        命令用来在没有状态栏（或者手机上）时也能**拿**，两者调同一段复制。
 *        v0.21.0 起「看」与「拿」还各有各的口径，见下面 SCOPE 那段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, setTooltip } from 'obsidian';
import { COPY_PATH_COMMAND } from '../../core/commands';
import { localPath } from '../../core/localPath';
import type { ZiminosContext } from '../../core/types';

const TEXTS = {
    /**
     * 有文件时的提示语前缀。它把「这一下会复制什么」原样摆出来，看的与拿的因此不必互相猜。
     * 一行到底而不换行：Obsidian 的提示气泡不解释 \n，写进去只会多出一个看得见的空格。
     */
    tooltipPrefix: '点一下复制：',
    /** 没有打开任何笔记时的提示语。此时状态栏是空的，提示只需说清这一块是干什么的 */
    tooltipEmpty: '当前笔记路径：点一下复制',
    /** 没有打开任何笔记时状态栏留空而不是写「无」——一句「无」比空白更占注意力 */
    empty: '',
    copied: '已复制路径：',
    /** 选了本机完整路径、这个库却不落在本机文件系统上。说清换了什么、以及为什么 */
    degraded: '这个笔记库不在本机文件系统上（手机端就是如此），已改为复制库内路径：',
    noFile: '当前没有打开任何笔记，没有路径可复制。',
    failed: '复制失败：',
} as const;

/**
 * 一次「此刻这一篇的路径」的解算结果。
 *
 * degraded 不是错误标志而是**一句话该不该说**：用户选了本机完整路径却拿到库内路径时，
 * 沉默地给他一串短路径是最坏的一种——他会把它粘进终端，得到「文件不存在」，
 * 然后回来怀疑的是自己的手而不是这个设置。
 */
interface ResolvedPath {
    readonly text: string;
    readonly degraded: boolean;
}

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
        this.statusEl.addEventListener('click', () => void this.copy());

        const { app, plugin } = ctx;

        // 两个事件都要听：换文件走 file-open，而在两个开着同一篇的标签之间切换只有
        // active-leaf-change。少听一个就会出现「路径还是上一篇的」那种最难察觉的错
        plugin.registerEvent(app.workspace.on('file-open', () => this.sync()));
        plugin.registerEvent(app.workspace.on('active-leaf-change', () => this.sync()));

        ctx.commands.register(COPY_PATH_COMMAND, () => void this.copy());

        this.sync();
    }

    /**
     * 按当前设置决定显隐，并把文字与提示语换成此刻这一篇的。
     * 设置页、两个事件与构造函数走同一个入口。
     */
    sync(): void {
        const resolved = this.resolve();

        this.statusEl.toggle(this.ctx.settings.showFilePath);
        this.statusEl.setText(this.vaultPath() ?? TEXTS.empty);
        setTooltip(
            this.statusEl,
            resolved ? TEXTS.tooltipPrefix + resolved.text : TEXTS.tooltipEmpty,
            { placement: 'top' },
        );
    }

    /**
     * 此刻这一篇的库内路径。
     *
     * 取的是 workspace.getActiveFile() 而不是活动视图里的文件：焦点落在侧栏（比如刚点了
     * 最近文件那张清单）时活动视图不是 Markdown 视图，但用户心里「当前这一篇」并没有变。
     */
    private vaultPath(): string | null {
        return this.ctx.app.workspace.getActiveFile()?.path ?? null;
    }

    // ============================================================
    // 看的与拿的：为什么屏幕上那一块永远是库内路径（SCOPE）
    // ============================================================

    /**
     * 按 filePathScope 解算「这一下会复制什么」。
     *
     * **屏幕上显示的永远是库内路径，只有复制走的那一串随设置变。** 这不是偷懒，是两件事：
     * 其一，机器前缀（/你的用户目录/笔记库）对库里每一篇都一模一样——
     * 它提供的信息量为零，占掉的宽度却最大，而那一块在 styles.css 里只有 32ch 并带省略号：
     * 把绝对路径塞进去，被省略号吃掉的恰恰是唯一有信息的那一头（笔记名）；
     * 其二，这一块回答的是「我在库里的哪儿」，而复制往往是要把这篇交到**库外面**去
     * （终端、别的程序、一个智能体），两个问题的答案本来就不必是同一串字。
     * 看与拿不一致这件事因此必须当场说清，而不是留给用户去发现：
     * 悬停提示写着这一下会复制什么，复制完的提示把复制走的原样报回来。
     *
     * 拿不到本机路径时**降级**而不是拒绝：库不在本机文件系统上是一个事实（手机端、
     * 某些同步实现），不是用户做错了什么。此时给他库内路径并说一声为什么，
     * 比让「复制」这个动作什么都不做要好——后者他只会以为按钮坏了。
     */
    private resolve(): ResolvedPath | null {
        const relative = this.vaultPath();

        if (relative === null) return null;

        if (this.ctx.settings.filePathScope === 'vault') {
            return { text: relative, degraded: false };
        }

        const full = localPath(this.ctx.app, relative);

        return full === null
            ? { text: relative, degraded: true }
            : { text: full, degraded: false };
    }

    /** 复制路径。状态栏那一块与命令走的是这同一段，因此两条路的结果与提示语一字不差 */
    private async copy(): Promise<void> {
        const resolved = this.resolve();

        if (!resolved) {
            new Notice(TEXTS.noFile);

            return;
        }

        try {
            await navigator.clipboard.writeText(resolved.text);
            new Notice((resolved.degraded ? TEXTS.degraded : TEXTS.copied) + resolved.text);
        } catch (error) {
            new Notice(TEXTS.failed + (error instanceof Error ? error.message : String(error)));
        }
    }
}
