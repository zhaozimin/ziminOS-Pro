/**
 * [INPUT]: 依赖 obsidian 的 ItemView/TFile/setTooltip 与 App/WorkspaceLeaf/TAbstractFile 类型；
 *          依赖 core/commands 的 RECENT_FILES_COMMAND、core/constants 的
 *          RECENT_FILES_FILE/RECENT_FILES_KEEP 与 RecentFilesSort 类型、
 *          core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 RECENT_FILES_VIEW_TYPE 与装配入口 registerRecentFiles，
 *           后者交回一个「按当前设置重画」的同步函数
 * [POS]: 文件模块的第三个成员，回答「我刚才在哪几篇里」。
 *        它与文件夹计数是同一个模块的两半：那边数「这个文件夹里有什么」，
 *        这边记「我最近碰过什么」，两个问题合起来才是一个人对自己库的位置感。
 *        事实只有一份、住在插件目录下自己的 recent-files.json 里（与光标记忆、
 *        节假日缓存同一档：状态不是设置，绝不混进 data.json）；
 *        视图是它的一个呈现，关掉视图不影响记录，删掉记录文件也只是从头开始记。
 *        它刻意**不**排除 90-system：模板与属性示例也是你刚才打开过的东西，
 *        「最近去过哪儿」是导航而不是检索，藏起来只会让人以为记漏了
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ItemView, TFile, setTooltip } from 'obsidian';
import type { App, TAbstractFile, WorkspaceLeaf } from 'obsidian';
import { RECENT_FILES_COMMAND } from '../../core/commands';
import { RECENT_FILES_FILE, RECENT_FILES_KEEP } from '../../core/constants';
import type { RecentFilesSort } from '../../core/constants';
import type { ZiminosContext } from '../../core/types';

/** 视图类型名，与日历那个同一套命名 */
export const RECENT_FILES_VIEW_TYPE = 'ziminos-recent-files';

const TEXTS = {
    title: '最近文件',
    /** 视图可能在热重载时早于自有图标注册，标签页用 Obsidian 内建图标最稳（与日历同因） */
    icon: 'history',
    empty: '还没有记录。打开任意一篇笔记，它就会出现在这里。',
} as const;

/** 落盘防抖（毫秒）。理由与光标记忆同一条：翻一篇写一次盘没必要，只在退出时写又会丢 */
const PERSIST_DEBOUNCE_MS = 1000;

/** 一条记录：路径 + 打开的时刻 */
interface RecentEntry {
    readonly path: string;
    readonly at: number;
}

interface RecentFile {
    readonly version: 1;
    readonly entries: readonly RecentEntry[];
}

// ============================================================
// 装配
// ============================================================

/**
 * 装配最近文件。
 *
 * 返回值交给设置页：改「显示几条」或「怎么排」之后，已经画在侧栏里的那张清单
 * 不会自己再读一次设置——与文件夹计数、状态栏路径同一套填洞手法。
 */
export function registerRecentFiles(ctx: ZiminosContext): () => void {
    const store = new RecentFilesStore(ctx);

    ctx.plugin.registerView(
        RECENT_FILES_VIEW_TYPE,
        (leaf) => new RecentFilesView(leaf, ctx, store),
    );

    ctx.commands.register(RECENT_FILES_COMMAND, () => {
        void revealRecentFiles(ctx.app).catch(() => undefined);
    });

    return () => store.notify();
}

/**
 * 把视图请到右侧栏。
 *
 * 与日历不同，它**不**在启动时自动展开：日历是每天都要看一眼的坐标，
 * 而「最近文件」是找不回某一篇时才想起来的工具。自动占住半个侧栏，
 * 对不需要它的人就是一次没被请求的界面改动。
 */
async function revealRecentFiles(app: App): Promise<void> {
    await app.workspace.ensureSideLeaf(RECENT_FILES_VIEW_TYPE, 'right', {
        active: true,
        reveal: true,
        split: false,
    });
}

// ============================================================
// 事实层：记录本身
// ============================================================

class RecentFilesStore {
    private readonly ctx: ZiminosContext;

    /** 最近的排在最前。只存路径与时刻，文件本体每次渲染时现查——名字与修改时间都会变 */
    private entries: RecentEntry[] = [];

    private readonly listeners = new Set<() => void>();

    private timer: number | null = null;

    private readonly statePath: string;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;
        this.statePath =
            `${ctx.app.vault.configDir}/plugins/${ctx.plugin.manifest.id}/${RECENT_FILES_FILE}`;

        const { app, plugin } = ctx;

        app.workspace.onLayoutReady(() => {
            void this.load().then(() => this.notify());
        });

        plugin.registerEvent(
            app.workspace.on('file-open', (file) => {
                if (file) this.push(file.path);
            }),
        );

        // 改名要跟着搬：清单上显示的是文件名，留着旧路径会得到一条永远打不开的记录
        plugin.registerEvent(
            app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
                let touched = false;

                this.entries = this.entries.map((entry) => {
                    if (entry.path !== oldPath) return entry;

                    touched = true;

                    return { path: file.path, at: entry.at };
                });

                if (touched) this.commit();
            }),
        );

        plugin.registerEvent(
            app.vault.on('delete', (file: TAbstractFile) => {
                const before = this.entries.length;

                this.entries = this.entries.filter((entry) => entry.path !== file.path);

                if (this.entries.length !== before) this.commit();
            }),
        );

        plugin.register(() => {
            if (this.timer !== null) window.clearTimeout(this.timer);

            this.timer = null;
            this.listeners.clear();
            void this.persist();
        });
    }

    /** 视图开着时订阅一次，关掉时退订。返回退订函数，与日历的 HolidayService 同形 */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    notify(): void {
        for (const listener of this.listeners) listener();
    }

    /**
     * 按当前设置取出该显示的那几条。
     *
     * 「最近修改」不是另一份清单，是同一份清单的另一种排法——清单的成员永远是
     * 「你打开过的」，因为一个你从没打开过的文件出现在「最近」里只会让人愣一下。
     * 路径查不到文件的一律跳过（在别处被删或被移走了），不显示一条点不开的记录。
     */
    list(sort: RecentFilesSort, limit: number): TFile[] {
        const files: TFile[] = [];

        for (const entry of this.entries) {
            const file = this.ctx.app.vault.getAbstractFileByPath(entry.path);

            if (file instanceof TFile) files.push(file);
        }

        if (sort === 'modified') files.sort((a, b) => b.stat.mtime - a.stat.mtime);

        return files.slice(0, limit);
    }

    /** 记一次打开。已经在清单里的挪到最前，不留两条 */
    private push(path: string): void {
        this.entries = [
            { path, at: Date.now() },
            ...this.entries.filter((entry) => entry.path !== path),
        ].slice(0, RECENT_FILES_KEEP);

        this.commit();
    }

    private commit(): void {
        this.notify();
        this.schedulePersist();
    }

    private schedulePersist(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = window.setTimeout(() => {
            this.timer = null;
            void this.persist();
        }, PERSIST_DEBOUNCE_MS);
    }

    private async persist(): Promise<void> {
        const payload: RecentFile = { version: 1, entries: this.entries };

        try {
            await this.ctx.app.vault.adapter.write(
                this.statePath,
                `${JSON.stringify(payload, null, 2)}\n`,
            );
        } catch {
            // 状态文件写不进去不影响任何正在进行的事，故不打扰用户（与光标记忆同一条）
        }
    }

    private async load(): Promise<void> {
        const { adapter } = this.ctx.app.vault;

        try {
            if (!(await adapter.exists(this.statePath))) return;

            this.entries = readEntries(JSON.parse(await adapter.read(this.statePath)));
        } catch {
            // 坏文件当没有：下一次打开笔记就会把它写成好的
        }
    }
}

// ============================================================
// 呈现层：侧栏里那张清单
// ============================================================

class RecentFilesView extends ItemView {
    private readonly ctx: ZiminosContext;

    private readonly store: RecentFilesStore;

    private unsubscribe: (() => void) | null = null;

    constructor(leaf: WorkspaceLeaf, ctx: ZiminosContext, store: RecentFilesStore) {
        super(leaf);
        this.ctx = ctx;
        this.store = store;
    }

    getViewType(): string {
        return RECENT_FILES_VIEW_TYPE;
    }

    getDisplayText(): string {
        return TEXTS.title;
    }

    getIcon(): string {
        return TEXTS.icon;
    }

    async onOpen(): Promise<void> {
        this.contentEl.addClass('ziminos-recent');
        this.unsubscribe = this.store.subscribe(() => this.render());
        this.render();
    }

    async onClose(): Promise<void> {
        this.unsubscribe?.();
        this.unsubscribe = null;
        this.contentEl.empty();
    }

    /** 每次重画都整片重建：清单最长五十行，重建比逐行比对便宜，也不可能留下错位的行 */
    private render(): void {
        this.contentEl.empty();

        const { recentFilesSort, recentFilesLimit } = this.ctx.settings;
        const files = this.store.list(recentFilesSort, recentFilesLimit);

        if (files.length === 0) {
            this.contentEl.createDiv({ cls: 'ziminos-recent-empty', text: TEXTS.empty });

            return;
        }

        const list = this.contentEl.createDiv({ cls: 'ziminos-recent-list' });

        for (const file of files) this.renderRow(list, file);
    }

    /**
     * 一行一篇，只有笔记名。
     *
     * 曾经在名字下面另起一行写它在哪个文件夹，v0.17.0 由用户明令去掉——
     * 判据是这张清单该长得**与文件树一致**：文件树里一行就是一个名字，
     * 这里多出一行灰字，它就从「同一棵树的另一种排法」变成了另一种控件，
     * 而学员每认一行都要多读一行不需要的字。侧栏本来就窄，省下来的是行数也是注意力。
     * 完整路径没有丢，只是搬进了悬停提示——两篇同名笔记要分辨时问一句就有，
     * 平时不占屏幕。这也是「尽可能不显示路径」与「必须能分辨」唯一同时成立的位置。
     * 点一下用 openLinkText 打开——它认路径也认别名，与库里所有双链走同一条解析。
     */
    private renderRow(list: HTMLElement, file: TFile): void {
        const row = list.createDiv({ cls: 'ziminos-recent-row', text: file.basename });

        setTooltip(row, file.path, { placement: 'top' });

        row.addEventListener('click', () => {
            void this.ctx.app.workspace.openLinkText(file.path, '', false);
        });
    }
}

// ============================================================
// 纯函数：把磁盘上读到的东西验成记录
// ============================================================

/** 逐条验形，理由与光标记忆同一条：状态文件是用户能手改、也可能被同步工具截断的普通 JSON */
function readEntries(raw: unknown): RecentEntry[] {
    if (typeof raw !== 'object' || raw === null) return [];

    const entries = (raw as { entries?: unknown }).entries;

    if (!Array.isArray(entries)) return [];

    const out: RecentEntry[] = [];

    for (const item of entries) {
        if (typeof item !== 'object' || item === null) continue;

        const { path, at } = item as Record<string, unknown>;

        if (typeof path !== 'string' || !path) continue;
        if (typeof at !== 'number' || !Number.isFinite(at)) continue;

        out.push({ path, at });
    }

    return out.slice(0, RECENT_FILES_KEEP);
}
