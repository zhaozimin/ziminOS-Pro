/**
 * [INPUT]: 依赖 obsidian 的 MarkdownView/TFile 与 App/TAbstractFile 类型；依赖 ./types 的 ZiminosContext 类型
 * [OUTPUT]: 对外提供 isNoteInFront（「开在用户眼前的那一篇」的唯一定义）、registerEditDebts（编辑欠账），
 *           以及 EditDebts / EditDebtOptions 两个类型
 * [POS]: core 的后台补写调度层。updatedMaintainer 与 formatter 两个常驻编辑监听，都要在用户改完一篇之后替他补一笔写入，
 *        而「什么时候补才不伤人」这件事原本各写了一份——一份修好了关标签页、另一份没有，两份都不认改名，
 *        都活不过一次退出。这里把它收成一处：没开着的笔记防抖、开着的等走开、走开包含关掉、
 *        结算前让仍显示着它的分栏先存盘、账跟着改名走、删掉即作废；给了 storageKey 的还把欠账存进本机本库的
 *        localStorage，退出、崩溃、重载插件之后照样补上。模块只回答两件事：哪一次变化算人改的（record），
 *        以及到点之后写什么（settle）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownView, TFile } from 'obsidian';
import type { App, TAbstractFile } from 'obsidian';
import type { ZiminosContext } from './types';

// ============================================================
// 「开在眼前」与「最近活动过」是两件事
// ============================================================

/**
 * 这篇笔记此刻是否正开在用户眼前：它是活动文件，且真的显示在某个 Markdown 分栏里。
 *
 * 不能只问 `getActiveFile()`——它在当前视图不是 FileView 时报的是「最近活动过的文件」（官方语义），
 * 关掉最后一个标签页之后仍指着刚关掉的那一篇，于是「我走开了」看上去从没发生。
 * 判据就是要防的那件事本身：没有分栏显示它，就没有编辑器能捏着它的未保存改动，写盘不可能引出合并。
 * 点右侧栏的日历、点文件树时，那一篇仍显示在它的标签页里，所以不算走开——用户并没有离开它。
 *
 * 全插件只能有这一个定义：两处各判一次，就会出现「钩子刚决定要写、闸门又把它挡回去」的互相抵消，而且不报错。
 */
export function isNoteInFront(app: App, path: string): boolean {
    if (app.workspace.getActiveFile()?.path !== path) return false;

    let displayed = false;

    app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView && leaf.view.file?.path === path) displayed = true;
    });

    return displayed;
}

/**
 * 结算之前，让仍显示着这一篇的分栏先把手里的未保存改动存盘。
 *
 * 眼前那一篇根本走不到这里；走到这里的是「刚从左栏点进右栏」这一种——左栏已不在眼前，
 * 却可能还捏着最后两秒敲下的字。那一刻写盘，Obsidian 仍会弹「已被外部修改」并三方合并。
 * 先存盘，缓冲区就是干净的，随后那次写入只引起一次静默重载，分栏的视口由 markdownViewState 保住。
 * `save()` 在内容未变时什么都不写，所以对干净的分栏它是空操作。
 */
async function flushDisplayedViews(app: App, path: string): Promise<void> {
    const saves: Promise<void>[] = [];

    app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView && leaf.view.file?.path === path) {
            saves.push(leaf.view.save());
        }
    });

    await Promise.all(saves);
}

// ============================================================
// 契约
// ============================================================

export interface EditDebtOptions {
    /** 没开着的那些笔记：连续变化收敛成一次结算的防抖窗口（毫秒） */
    readonly debounceMs: number;
    /**
     * 结算一笔。调用时这一篇保证不在用户眼前，且显示着它的分栏都已存盘。
     * `changedAt` 是它最后一次被人改动时磁盘上的修改时间。
     * 返回 false 表示落盘前最后一刻它又被点回眼前，这笔账原样留着等下一次走开；
     * 抛错视同结算完毕——背景动作，文件在等待期间被删改而失败属于常态，不重试。
     */
    readonly settle: (file: TFile, changedAt: number) => Promise<boolean>;
    /**
     * 给了就把欠账存进本机本库的 localStorage（公开 API `App.saveLocalStorage`）。
     * 不进 data.json 也不落成文件：它说的是「这台机器上还没补的那几笔」，同步到另一台机器就是在替别人补账。
     * 只有补不回来的事实才需要它——updated 记的时刻错过就没了；排版任何时候都能从内容重新算出来，不必存。
     */
    readonly storageKey?: string;
}

export interface EditDebts {
    /** 这一篇刚被人改过：记下它此刻的修改时间；没开着就排防抖，开着就等走开 */
    record(file: TFile): void;
    /** 这一篇不该再结算了（开关关掉、YAML 删光、挪进系统目录）：撤掉在途计划与欠账 */
    forget(path: string): void;
}

/** 一笔账 */
interface Debt {
    path: string;
    /** 最后一次被人改动时磁盘上的修改时间 */
    changedAt: number;
    /** 每记一次递增；结算途中又被改过，结算完就不能把新的那一程一起勾销 */
    version: number;
    /** 没开着的那一篇在等防抖；为 null 表示在等走开 */
    timer: number | null;
    /** 正在结算：两个走开事件先后到达时不重复结算 */
    settling: boolean;
}

// ============================================================
// 欠账
// ============================================================

/**
 * 注册一本编辑欠账。
 * 监听与恢复放在 onLayoutReady 内：恢复要按路径找回文件，库还没加载完时一篇都找不到。
 * 模块应在注册自己的 modify 监听之前调用本函数，于是恢复总是先于第一笔新账。
 */
export function registerEditDebts(ctx: ZiminosContext, options: EditDebtOptions): EditDebts {
    const { app, plugin } = ctx;
    const debts = new Map<string, Debt>();
    let version = 0;

    const persist = (): void => {
        if (!options.storageKey) return;

        const stored: Record<string, number> = {};

        for (const debt of debts.values()) stored[debt.path] = debt.changedAt;

        app.saveLocalStorage(options.storageKey, debts.size > 0 ? stored : null);
    };

    const stopTimer = (debt: Debt): void => {
        if (debt.timer === null) return;

        window.clearTimeout(debt.timer);
        debt.timer = null;
    };

    const drop = (debt: Debt): void => {
        stopTimer(debt);

        if (debts.get(debt.path) === debt) debts.delete(debt.path);

        persist();
    };

    /** 没开着就排防抖；开着就什么都不排，等走开 */
    const schedule = (debt: Debt): void => {
        stopTimer(debt);

        if (isNoteInFront(app, debt.path)) return;

        debt.timer = window.setTimeout(() => {
            debt.timer = null;
            void settle(debt);
        }, options.debounceMs);
    };

    /**
     * 结算一笔账。任何一道闸没过都原样留着它，交给下一次走开或下一次记账。
     * 定时器回调里读的是 debt.path 而不是闭包里的旧路径，所以排着防抖时被改名也不落空。
     */
    const settle = async (debt: Debt): Promise<void> => {
        if (debt.settling || debts.get(debt.path) !== debt) return;

        // 还在眼前：等走开
        if (isNoteInFront(app, debt.path)) return;

        const file = app.vault.getAbstractFileByPath(debt.path);

        if (!(file instanceof TFile)) {
            drop(debt);
            return;
        }

        stopTimer(debt);
        debt.settling = true;

        let settled = true;
        let recorded = debt.version;

        try {
            await flushDisplayedViews(app, debt.path);

            // 存盘那一刻它自己会发 modify 并记一笔新账——那正是用户最后敲下的字，按新的时刻结算
            recorded = debt.version;

            // 存盘途中又被点回眼前
            if (isNoteInFront(app, debt.path)) {
                settled = false;
            } else {
                settled = await options.settle(file, debt.changedAt);
            }
        } catch {
            // 背景动作：失败不弹 Notice、不重试，这一笔就此勾销
        } finally {
            debt.settling = false;
        }

        // 结算途中又被人改过：新的那一程按它自己的样子重新排，不能一起勾销
        if (debt.version !== recorded) {
            if (debts.get(debt.path) === debt && debt.timer === null) schedule(debt);
            return;
        }

        if (settled) drop(debt);
    };

    /** 走开的时刻：所有在等走开、且已不在眼前的账一并结算 */
    const sweep = (): void => {
        for (const debt of [...debts.values()]) {
            if (debt.timer === null) void settle(debt);
        }
    };

    /**
     * 上一次运行留下的欠账。
     * 补记有一个前提：磁盘上的那一篇还是用户离开时的样子——修改时间对不上，说明 Obsidian 关着的时候
     * 别的设备同步过来一版、或者别的程序改过它，这笔旧账就不再成立，拿旧时间盖上去等于让 updated 倒退。
     */
    const restore = (): void => {
        if (!options.storageKey) return;

        const stored: unknown = app.loadLocalStorage(options.storageKey);

        if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
            persist();
            return;
        }

        for (const [path, changedAt] of Object.entries(stored)) {
            if (typeof changedAt !== 'number' || !Number.isFinite(changedAt)) continue;

            const file = app.vault.getAbstractFileByPath(path);

            if (!(file instanceof TFile) || file.stat.mtime !== changedAt) continue;

            version += 1;
            debts.set(path, { path, changedAt, version, timer: null, settling: false });
        }

        // 作废的那几笔顺手从存储里清掉
        persist();
        sweep();
    };

    app.workspace.onLayoutReady(() => {
        restore();

        // 换面板走 active-leaf-change，同一面板里换文件走 file-open；漏一个就会留下一篇永远等不到结算的笔记
        plugin.registerEvent(app.workspace.on('active-leaf-change', sweep));
        plugin.registerEvent(app.workspace.on('file-open', sweep));

        // 行内标题改名、拖进别的文件夹、整个项目归档：账跟着新路径走。
        // 文件夹改名时 Obsidian 会为其中每个文件各发一次 rename，所以按单个路径搬就够了
        plugin.registerEvent(
            app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
                const debt = debts.get(oldPath);

                if (!debt) return;

                debts.delete(oldPath);
                debt.path = file.path;
                debts.set(file.path, debt);
                persist();
            }),
        );

        plugin.registerEvent(
            app.vault.on('delete', (file: TAbstractFile) => {
                const debt = debts.get(file.path);

                if (debt) drop(debt);
            }),
        );
    });

    // 插件卸载时只停计时器、不清存储：存储正是为了让这几笔活过这一次卸载
    plugin.register(() => {
        for (const debt of debts.values()) stopTimer(debt);
    });

    return {
        record(file: TFile): void {
            const debt: Debt = debts.get(file.path) ?? {
                path: file.path,
                changedAt: 0,
                version: 0,
                timer: null,
                settling: false,
            };

            version += 1;
            // modify 事件发出之前 Obsidian 已经换上了新的 stat，所以这就是这次保存落盘的时刻
            debt.changedAt = file.stat.mtime;
            debt.version = version;
            debts.set(debt.path, debt);

            // 结算中的那一笔由结算收尾时按新版本重新排，这里不抢
            if (!debt.settling) schedule(debt);

            persist();
        },

        forget(path: string): void {
            const debt = debts.get(path);

            if (debt) drop(debt);
        },
    };
}
