/**
 * [INPUT]: 依赖 obsidian 的 MarkdownView、TFile 与 TAbstractFile 类型；
 *          依赖 core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerCursorMemory（装配「关掉时的光标位置，下次打开还在」）
 * [POS]: 编辑模块的光标支线。它管的是一件小事和一条纪律：
 *        小事是每篇笔记最后一次的光标行列与滚动位置；
 *        纪律是这些位置**不是设置**——它们是状态，因此住在插件目录下自己的
 *        cursor-positions.json 里，与日历的 holiday-cache.json 同一档待遇，
 *        绝不混进 data.json。混进去的后果很具体：升级契约承诺 data.json 的 SHA-256
 *        前后不变，而一个每次翻笔记都在改的字段会让那条承诺变成噪音。
 *        它不装定时器也不轮询：位置只在「离开这一篇」时读一次，
 *        因为那一刻的光标正是下次要回到的地方，中间的每一次移动都不必知道
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownView, TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { CURSOR_STATE_FILE, CURSOR_MEMORY_LIMIT } from '../../core/constants';
import type { ZiminosContext } from '../../core/types';

/** 一篇笔记上次停在哪儿：光标行列 + 滚动条位置 */
interface CursorMark {
    readonly line: number;
    readonly ch: number;
    readonly top: number;
}

/** 落盘信封。带 version 是为了将来换形态时读得懂旧文件，而不是猜 */
interface CursorFile {
    readonly version: 1;
    readonly marks: Record<string, CursorMark>;
}

/**
 * 落盘防抖（毫秒）。
 * 记忆本身是内存里的事，翻一篇笔记就写一次盘没必要；但也不能只在退出时写——
 * Obsidian 被强制退出、或者系统重启，那一份就全丢了。一秒是「用户不会察觉」
 * 与「丢也只丢最后一步」之间的取值。
 */
const PERSIST_DEBOUNCE_MS = 1000;

// ============================================================
// 装配
// ============================================================

export function registerCursorMemory(ctx: ZiminosContext): void {
    new CursorMemory(ctx);
}

// ============================================================
// 记忆本体
// ============================================================

class CursorMemory {
    private readonly ctx: ZiminosContext;

    /**
     * 路径 → 上次的位置。Map 的插入序被当作最近使用序用：
     * 每次记一篇都先删再插，于是最旧的那一条永远在最前面，超额时从前面丢。
     */
    private readonly marks = new Map<string, CursorMark>();

    /**
     * 当前正盯着的那一篇。
     *
     * 必须自己记一份而不是临时去问「现在活动的是谁」——要记的位置属于**刚离开**的那一篇，
     * 而 file-open 触发时活动视图已经换成新的了。
     */
    private tracked: { path: string; view: MarkdownView } | null = null;

    private timer: number | null = null;

    private readonly statePath: string;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;
        this.statePath =
            `${ctx.app.vault.configDir}/plugins/${ctx.plugin.manifest.id}/${CURSOR_STATE_FILE}`;

        const { app, plugin } = ctx;

        // 读盘要等布局就绪：这一刻活动视图才存在，读完顺手把开着的那一篇恢复回原处，
        // 「重启 Obsidian 之后还在昨天那一行」正是这个功能最主要的价值
        app.workspace.onLayoutReady(() => {
            void this.load().then(() => this.adopt(true));
        });

        plugin.registerEvent(
            app.workspace.on('file-open', () => {
                // 先记下刚离开那一篇（它的视图还活着），再认领新的这一篇并恢复它
                this.remember();
                this.adopt(true);
            }),
        );

        // 用户改名或删掉一篇笔记时，跟着搬走或丢掉那条记忆——
        // 留着的话它既永远命不中，又白占着上限里的一格
        plugin.registerEvent(
            app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
                const mark = this.marks.get(oldPath);

                this.marks.delete(oldPath);

                if (mark && file instanceof TFile) this.marks.set(file.path, mark);
                if (this.tracked?.path === oldPath && file instanceof TFile) {
                    this.tracked = { path: file.path, view: this.tracked.view };
                }

                this.schedulePersist();
            }),
        );

        plugin.registerEvent(
            app.vault.on('delete', (file: TAbstractFile) => {
                if (!this.marks.delete(file.path)) return;

                this.schedulePersist();
            }),
        );

        // 退出前再记一次并立刻落盘：最后那一篇是最可能被恢复的一篇
        plugin.registerEvent(
            app.workspace.on('quit', () => {
                this.remember();
                void this.persist();
            }),
        );

        plugin.register(() => {
            this.remember();

            if (this.timer !== null) window.clearTimeout(this.timer);

            this.timer = null;
            void this.persist();
        });
    }

    // ============================================================
    // 认领与恢复
    // ============================================================

    /** 把当前活动的 Markdown 视图认成「正盯着的那一篇」，需要时顺手恢复它的位置 */
    private adopt(restore: boolean): void {
        const view = this.ctx.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file ?? null;

        if (!view || !file) {
            this.tracked = null;

            return;
        }

        this.tracked = { path: file.path, view };

        if (restore) this.restore(view, file.path);
    }

    /**
     * 把光标与滚动条放回上次的位置。
     *
     * 只在光标还停在文首（0 行 0 列）时才动手，这是本文件第二要紧的一条判断：
     * 从一条带锚点的双链跳进来时，Obsidian 已经把光标放在那个标题或块上了——
     * 那是用户刚刚点的那一下，比「上次离开时在哪」优先。
     * 行列都要按当前文档夹一次：笔记可能在别处被改短过，越界的行号会让 setCursor 失准。
     */
    private restore(view: MarkdownView, path: string): void {
        if (!this.ctx.settings.rememberCursor) return;

        const mark = this.marks.get(path);

        if (!mark) return;

        const { editor } = view;
        const current = editor.getCursor();

        if (current.line !== 0 || current.ch !== 0) return;

        const line = Math.min(mark.line, editor.lastLine());
        const ch = Math.min(mark.ch, editor.getLine(line).length);

        editor.setCursor({ line, ch });

        // 滚动位置要等这一帧的排版落定再设：此刻编辑器往往还没有最终高度，
        // 现在设的值会被随后的重排抹掉。一次 rAF，不是定时器也不是轮询
        window.requestAnimationFrame(() => {
            if (this.tracked?.view === view) editor.scrollTo(null, mark.top);
        });
    }

    /** 记下「正盯着那一篇」此刻的位置。视图已经换过文件或已关闭时什么都不做 */
    private remember(): void {
        const tracked = this.tracked;

        if (!tracked || !this.ctx.settings.rememberCursor) return;
        if (tracked.view.file?.path !== tracked.path) return;

        const { editor } = tracked.view;
        const { line, ch } = editor.getCursor();
        const { top } = editor.getScrollInfo();

        this.put(tracked.path, { line, ch, top });
    }

    /** 写进记忆并维持上限。先删再插是为了把这一条挪到最近端，于是淘汰的总是最久没碰过的 */
    private put(path: string, mark: CursorMark): void {
        this.marks.delete(path);
        this.marks.set(path, mark);

        while (this.marks.size > CURSOR_MEMORY_LIMIT) {
            const oldest = this.marks.keys().next();

            if (oldest.done) break;

            this.marks.delete(oldest.value);
        }

        this.schedulePersist();
    }

    // ============================================================
    // 落盘与读盘
    // ============================================================

    private schedulePersist(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = window.setTimeout(() => {
            this.timer = null;
            void this.persist();
        }, PERSIST_DEBOUNCE_MS);
    }

    /**
     * 写状态文件。写不进去就安静收场——它只是「下次能不能回到原处」这件小事，
     * 为它弹一个红字提示，代价比它本身还大。
     */
    private async persist(): Promise<void> {
        // 手写这一圈而不用 Object.fromEntries：tsconfig 的 lib 停在 ES2018，那是 ES2019 的方法
        const marks: Record<string, CursorMark> = {};

        for (const [path, mark] of this.marks) marks[path] = mark;

        const payload: CursorFile = { version: 1, marks };

        try {
            await this.ctx.app.vault.adapter.write(
                this.statePath,
                `${JSON.stringify(payload, null, 2)}\n`,
            );
        } catch {
            // 读写状态文件失败不影响任何正在进行的事，故不打扰用户
        }
    }

    /** 读状态文件。文件不存在是全新库的常态；读到坏数据一律当没有，不猜也不修 */
    private async load(): Promise<void> {
        const { adapter } = this.ctx.app.vault;

        try {
            if (!(await adapter.exists(this.statePath))) return;

            const raw: unknown = JSON.parse(await adapter.read(this.statePath));

            for (const [path, mark] of readMarks(raw)) this.marks.set(path, mark);
        } catch {
            // 同上：坏文件不值得打扰用户，下一次落盘会把它写成好的
        }
    }
}

// ============================================================
// 纯函数：把磁盘上读到的东西验成记忆
// ============================================================

/**
 * 逐条验形。
 *
 * 状态文件是用户能手改、也可能被同步工具截断的普通 JSON，
 * 而这里读出来的数字会直接喂给 setCursor 与 scrollTo——
 * 一个 NaN 就让光标跑到不存在的行上。所以只认三个有限数字，别的一律跳过。
 */
function readMarks(raw: unknown): [string, CursorMark][] {
    if (typeof raw !== 'object' || raw === null) return [];

    const marks = (raw as { marks?: unknown }).marks;

    if (typeof marks !== 'object' || marks === null) return [];

    const out: [string, CursorMark][] = [];

    for (const [path, value] of Object.entries(marks)) {
        if (typeof value !== 'object' || value === null) continue;

        const { line, ch, top } = value as Record<string, unknown>;

        if (!isCount(line) || !isCount(ch) || !isCount(top)) continue;

        out.push([path, { line, ch, top }]);
    }

    // 只留最近的一批：文件可能来自上限更大的旧版本，而上限的意义就是别让它无限长
    return out.slice(-CURSOR_MEMORY_LIMIT);
}

function isCount(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
