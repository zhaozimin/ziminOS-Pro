/**
 * [INPUT]: 依赖 obsidian 的 TFile 与 TAbstractFile 类型；依赖 core/constants 的 FOLDERS、
 *          core/frontmatter 的 Frontmatter 类型、core/markdownViewState 的分栏滚动保护、
 *          core/time 的 nowStamp、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerUpdatedMaintainer（注册 updated 字段的自动维护）
 * [POS]: projects 模块里唯一常驻的编辑监听者，替代原方案中由 Linter 承担的 updated 维护职责。
 *        它与 cardInit 共守同一张卡片：那边写「出生」字段（created/UID/up），这边只碰 updated 一个字段，
 *        两边都不整篇重写。它是全插件最容易失控的部件——写盘本身会再次触发 modify 事件，
 *        因此必须靠 SelfWriteGuard 断开自激回路，并用 per-file 防抖把连续击键收敛成一次写盘；
 *        「只给已有 YAML 的笔记记账、绝不主动注入 YAML」是它对用户的底线承诺，
 *        而防抖意味着「判定」与「落盘」隔着两秒，因此守卫必须两头都站：
 *        事件到达时判一次以决定排不排计划，落盘前再判一次以决定这计划还算不算数。
 *        它与 formatter 共享同一条最要紧的纪律——**绝不写用户正开着的那一篇**，
 *        理由写在下面 dirtyWhileOpen 那一段；而「开着」在本文件是个有定义的词，
 *        不是 `getActiveFile()`（那个方法报的是「最近活动过的文件」，关掉标签页之后仍指着它），
 *        事件处理器与写入闸门都从 activeOpenPath 一处取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownView, TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FOLDERS } from '../../core/constants';
import type { Frontmatter } from '../../core/frontmatter';
import { withPreservedMarkdownScroll } from '../../core/markdownViewState';
import { nowStamp } from '../../core/time';
import type { ZiminosContext } from '../../core/types';

/**
 * 防抖窗口（毫秒）。它管的是「没开着的那些笔记」——插件刚往今天的日记里插了一行、
 * 同步工具刚拉下来一篇——连续变化收敛成一次写盘。
 * 正开着的那一篇不由它管，见 dirtyWhileOpen。
 */
const UPDATED_DEBOUNCE_MS = 2000;

/** 系统目录前缀：导航与模板属于插件的基础设施，不参与修改留痕 */
const SYSTEM_PREFIX = `${FOLDERS.system}/`;

/**
 * 注册 updated 字段的自动维护。
 * 监听放在 onLayoutReady 内，事件与防抖 timeout 分别交给 registerEvent 与 register 托管，
 * 插件禁用时不留任何在途回调。
 */
export function registerUpdatedMaintainer(ctx: ZiminosContext): void {
    /** 路径 → 在途的防抖 timeout id；键取登记时的路径快照，文件改名后不会串味 */
    const pendingTimeouts = new Map<string, number>();

    /**
     * 用户改过、但当时正开在他眼前的笔记。它们不当场记账，等他切走再说。
     *
     * 这是本模块与 formatter 共享的那条纪律，而它一度被误判成「只有整篇重写才需要」：
     * 旧设计认为改一个 YAML 字段太小、停手两秒就足够安全。真机否掉了这个判断——
     * **代价与写多少字节无关，只与「写盘的那一刻编辑器手里有没有未保存的改动」有关**。
     * `modify` 事件来自 Obsidian 自己的保存，不是来自用户停手；他保存后接着敲，
     * 两秒后我们这一笔就正好落在一个脏缓冲区上，于是 Obsidian 报
     * 「已被外部修改，正在自动合并更改」，合并会把整个文档重新灌进编辑器。
     * 对一篇满是远端图片的笔记，那一下等于把所有图片的高度清零再重新量一遍，
     * 视口于是跳到一个谁也没要求过的位置——用户每敲几个字就被弹开一次。
     *
     * withPreservedMarkdownScroll 救不回来：合并晚于我们这次写入的 Promise，
     * 而且图片高度已经全部作废，那个捕获下来的滚动值指向的版面已经不存在了。
     * 唯一可靠的做法是别在他眼前写，所以这里只记账不落盘。
     */
    const dirtyWhileOpen = new Set<string>();

    /**
     * 当前停在哪一篇。用户切走时要回头记账的正是它。
     *
     * 它**不等于** `getActiveFile()`：那个方法在当前视图不是 FileView 时报的是
     * 「最近活动过的文件」（官方语义，见 obsidian.d.ts），于是关掉最后一个标签页之后，
     * 它仍然指着那篇刚被关掉的笔记——「我走开了」这件事看上去从没发生。
     * 这个变量的名字说的是「开着的那一篇」，所以它必须真的开着，见 activeOpenPath。
     */
    let openPath: string | null = null;

    // ============================================================
    // 「开着」与「最近活动过」是两件事
    // ============================================================

    /**
     * 这篇笔记此刻是否真的显示在某个 Markdown 分栏里。
     *
     * 判据就是我们要防的那件事本身：没有任何分栏显示它，就没有编辑器能捏着它的未保存改动，
     * 写盘因此不可能引出合并。用 MarkdownView 而不是「任何 FileView」，
     * 是因为 PDF 与图片视图本来就没有 Markdown 缓冲区。
     */
    const isDisplayed = (path: string | null): boolean => {
        if (path === null) return false;

        let displayed = false;

        ctx.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView && leaf.view.file?.path === path) {
                displayed = true;
            }
        });

        return displayed;
    };

    /** 此刻真正开在用户眼前的那一篇；关掉之后是 null，而不是「最近活动过的那一篇」 */
    const activeOpenPath = (): string | null => {
        const active = ctx.app.workspace.getActiveFile()?.path ?? null;

        return isDisplayed(active) ? active : null;
    };

    // ============================================================
    // 落盘
    // ============================================================

    /**
     * 真正写入 updated。
     * 此处必须把事件处理器的守卫重走一遍，而不是信任两秒前的那次判定：
     * 排计划与落盘之间隔着整整两秒，用户完全可能在这两秒里关掉开关、删掉整段 YAML，
     * 把笔记挪进系统目录，或者干脆把它重新打开——落盘前的现场状态才是唯一可信的判据。
     */
    const applyUpdated = async (
        path: string,
        mayWrite: () => boolean = () => true,
    ): Promise<void> => {
        // 等待期间用户可能已关掉开关，人的意愿优先于在途的机器动作
        if (!ctx.settings.autoUpdated) return;

        // 系统目录下的导航与模板不记账；路径可能在等待期间被挪进来
        if (path.startsWith(SYSTEM_PREFIX)) return;

        const file = ctx.app.vault.getAbstractFileByPath(path);

        if (!(file instanceof TFile)) return;

        // 底线承诺的最后一道闸：用户若刚把 YAML 整段删掉，processFrontMatter 会替他凭空造回来，
        // 那正是本文件承诺绝不做的事——此刻没有 frontmatter，就此收手
        if (!ctx.app.metadataCache.getFileCache(file)?.frontmatter) return;

        // 排队期间用户可能重新打开这篇（改名也会让 openPath 一时失准）；
        // 真正写盘的这一刻再问一次现场，人的编辑权优先，这笔账留到他走开
        if (!mayWrite()) {
            dirtyWhileOpen.add(path);
            return;
        }

        // 先声明自写，再动手；这次写入引发的 modify 事件会被守卫挡在门外，不会自激成环
        ctx.guard.mark(path);

        await withPreservedMarkdownScroll(ctx.app, file, () =>
            ctx.app.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
                frontmatter.updated = nowStamp(ctx.settings.dateTimeFormat);
            }),
        );
    };

    /**
     * 给一个路径记账，并在落盘前拿现场再问一次。
     *
     * 闸门问的是 activeOpenPath 而不是活动文件，这一点是被自己的回归逼出来的：
     * 关掉标签页之后 `getActiveFile()` 仍报那一篇，于是旧闸门会把走开钩子刚决定要写的
     * 那一笔又挡回去，两处判断互相抵消、谁都没错却什么也没发生。
     * **「开在眼前的那一篇」全模块只能有一个定义**，事件处理器与写入闸门都从它取。
     */
    const runUpdated = (path: string): Promise<void> =>
        applyUpdated(path, () => activeOpenPath() !== path);

    // ============================================================
    // 防抖
    // ============================================================

    /** 为一个路径重排防抖：新的编辑总是把上一次的计划推迟 */
    const scheduleUpdate = (path: string): void => {
        const pending = pendingTimeouts.get(path);

        if (pending !== undefined) window.clearTimeout(pending);

        const timeoutId = window.setTimeout(() => {
            pendingTimeouts.delete(path);

            void runUpdated(path).catch(() => {
                // updated 维护是背景动作：文件在等待期间被删改而写入失败属于常态，
                // 弹 Notice 只会变成噪音，故静默放弃本次留痕
            });
        }, UPDATED_DEBOUNCE_MS);

        pendingTimeouts.set(path, timeoutId);
    };

    /**
     * 撤销一个路径在途的记账计划。
     * 「这篇笔记现在不该记账」必须既作用于新计划、也作用于已经排下的旧计划，
     * 否则用户删掉 YAML 之后，两秒前排下的那次写入照样会落地。
     */
    const cancelUpdate = (path: string): void => {
        const pending = pendingTimeouts.get(path);

        if (pending === undefined) return;

        window.clearTimeout(pending);
        pendingTimeouts.delete(path);
    };

    // 插件卸载时清空所有在途防抖，避免回调在插件已下线后落地
    ctx.plugin.register(() => {
        for (const timeoutId of pendingTimeouts.values()) {
            window.clearTimeout(timeoutId);
        }

        pendingTimeouts.clear();
    });

    // ============================================================
    // 监听
    // ============================================================

    ctx.app.workspace.onLayoutReady(() => {
        openPath = activeOpenPath();

        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile): void => {
                // 1. 用户在设置里关掉了自动维护
                if (!ctx.settings.autoUpdated) {
                    cancelUpdate(file.path);
                    dirtyWhileOpen.delete(file.path);
                    return;
                }

                // 2. 只认 Markdown 文件
                if (!(file instanceof TFile) || file.extension !== 'md') return;

                // 3. 系统目录下的导航与模板不记账
                if (file.path.startsWith(SYSTEM_PREFIX)) {
                    cancelUpdate(file.path);
                    return;
                }

                // 4. 插件自己刚写过的文件不记账，否则一次写入会引出下一次写入。
                //    这一条只说明「这次变化不是人干的」，不否定人先前的编辑，因此不撤销在途计划
                if (ctx.guard.isRecent(file.path)) return;

                // 5. 只给已经有 YAML 的笔记记账，绝不给纯正文笔记强行注入 frontmatter。
                //    用户刚把 YAML 删光时，先前排下的计划必须一并作废
                if (!ctx.app.metadataCache.getFileCache(file)?.frontmatter) {
                    cancelUpdate(file.path);
                    return;
                }

                // 6. 正开在眼前的那一篇只记下「它脏了」，绝不当场写盘——理由见 dirtyWhileOpen。
                //    这一篇若还有在途计划也一并作废：那是它刚才还没被打开时排下的
                if (file.path === openPath) {
                    cancelUpdate(file.path);
                    dirtyWhileOpen.add(file.path);
                    return;
                }

                scheduleUpdate(file.path);
            }),
        );

        /**
         * 用户换了笔记：回头给刚离开的那一篇记账。
         *
         * 与 formatter 的同名处理器同构，也同样必须订两个事件——换面板走 active-leaf-change，
         * 同一个面板里换文件走 file-open，漏掉任何一个都会留下一篇永远等不到记账的笔记。
         * 处理器本身可重入：记完就从 dirty 里摘掉，两个事件先后到达也只跑一次。
         *
         * 走开的那一刻才是 updated 想说的那个时刻：他还在改，「最后一次修改」就还没发生，
         * 此刻写下的任何值都会在下一秒过期。
         *
         * 「走开」包含**关掉这篇笔记**，而那一格差点漏掉：关掉最后一个标签页时本事件照样触发，
         * 可 `getActiveFile()` 仍报刚关掉的那一篇（它是「最近活动过的」），于是
         * nextPath === openPath、提前 return、那笔账留在 dirtyWhileOpen 里等下一次开笔记才补，
         * 中间若退出 Obsidian 就丢了。所以这里问的是 activeOpenPath 而不是活动文件——
         * **「开着」与「最近活动过」是两件事**，这个洞就长在两者之差上。
         */
        const leaveCurrent = (): void => {
            const nextPath = activeOpenPath();

            if (nextPath === openPath) return;

            const leaving = openPath;

            openPath = nextPath;

            if (leaving === null || !dirtyWhileOpen.delete(leaving)) return;

            void runUpdated(leaving).catch(() => {
                // 同上：走开时的顺手记账失败不该拦住用户下一步
            });
        };

        ctx.plugin.registerEvent(ctx.app.workspace.on('active-leaf-change', leaveCurrent));
        ctx.plugin.registerEvent(ctx.app.workspace.on('file-open', leaveCurrent));
    });
}
