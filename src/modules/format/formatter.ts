/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile/TAbstractFile 类型；依赖 core/commands 的 FORMAT_COMMAND、
 *          core/markdownStyle 的 formatMarkdown、core/markdownViewState 的分栏滚动保护、
 *          core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerFormatter（注册整理命令与自动整理）
 * [POS]: 排版模块的全部。规则本体住在 core/markdownStyle——那是一趟纯字符串变换，
 *        本文件只回答「什么时候对哪一篇跑它」，且自动写盘前以实时活动文件作最后闸门；
 *        两件事分开是因为前者可测、后者只能真机验。
 *        它替代的是学员原本要自己装的 Linter 插件，但刻意只做那一件最基础的事：
 *        标准 Markdown 的写法，而不是一百条可配置的重排。
 *        全插件第二个常驻编辑监听（第一个是 updatedMaintainer），
 *        两者共处一室的规矩写在下面 shouldSkip 那一段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FORMAT_COMMAND } from '../../core/commands';
import { formatMarkdown } from '../../core/markdownStyle';
import { withPreservedMarkdownScroll } from '../../core/markdownViewState';
import type { ZiminosContext } from '../../core/types';

// ============================================================
// 时间常量
// ============================================================

/** 防抖窗口。与 updatedMaintainer 取同一个值：它们回应的是同一件事——用户停手了 */
const FORMAT_DEBOUNCE_MS = 2000;

/**
 * 再入锁的窗口。
 *
 * 断开「整理 → 写盘 → 触发监听 → 再整理」这个环，靠的本来是 formatMarkdown 的幂等：
 * 第二趟算出来的东西与第一趟一模一样，于是没有第二次写入。这把锁是那句话的保险——
 * 幂等一旦被某条新规则破坏，代价是一个不停写盘的死循环，而那种代价不该赌在一句注释上。
 */
const RE_ENTRY_MS = 1000;

const TEXTS = {
    formatted: '已按标准写法整理这一篇 ✓',
    unchanged: '这一篇已经是标准写法，没有可改的',
    noFile: '先打开一篇笔记，再运行整理',
    noRules: '排版规则一条都没开，先去设置 → ziminOS → 排版打开几条',
    failed: '整理没能写进去，这一篇没有变。稍后再试一次',
} as const;

// ============================================================
// 装配
// ============================================================

/**
 * 注册整理命令与自动整理。
 *
 * 命令与自动走同一条落盘路径，区别只在「谁决定此刻该整理」：
 * 命令是用户当场按下的，自动是他停手或走开时替他按的。
 */
export function registerFormatter(ctx: ZiminosContext): void {
    /** 路径 → 在途的防抖 timeout id */
    const pendingTimeouts = new Map<string, number>();

    /**
     * 用户改过、但当时正开在他眼前的笔记。
     *
     * 它们不当场整理，等他切走再说——这是本模块最要紧的一条纪律，理由见 scheduleFormat。
     */
    const dirtyWhileOpen = new Set<string>();

    /** 路径 → 最近一次真正整理的时刻，配合 RE_ENTRY_MS 使用 */
    const lastRun = new Map<string, number>();

    /** 当前停在哪一篇。用户切走时要回头整理的正是它 */
    let openPath: string | null = null;

    // ============================================================
    // 落盘
    // ============================================================

    /**
     * 整理一篇笔记，返回它是否真的被改动。
     *
     * 先读一遍算算改不改得动，改不动就不写——这不是省一次 IO，是本模块的命门：
     * 写盘会触发 modify，modify 又排下一次整理，只要「没变化也照写」，这个环就永远转下去。
     * 真要写时仍走 vault.process 重算一遍，那个回调拿到的是最新内容，
     * 于是读与写之间用户敲下的字不会被这次整理吞掉。
     */
    const formatFile = async (
        file: TFile,
        mayWrite: () => boolean = () => true,
    ): Promise<boolean> => {
        const rules = ctx.settings.formatRules;
        const current = await ctx.app.vault.cachedRead(file);

        if (formatMarkdown(current, rules) === current) return false;
        if (!mayWrite()) return false;

        let changed = false;

        await withPreservedMarkdownScroll(ctx.app, file, () =>
            ctx.app.vault.process(file, (content) => {
                // 排队期间用户可能重新打开这篇；真正写盘的这一刻再问一次，人的编辑权优先
                if (!mayWrite()) return content;

                const next = formatMarkdown(content, rules);

                if (next === content) return content;

                changed = true;
                lastRun.set(file.path, Date.now());
                // 只在确定要写时声明自写，失败或无变化不能遮掉随后真正的用户编辑
                ctx.guard.mark(file.path);

                return next;
            }),
        );

        return changed;
    };

    /** 按路径取回文件并整理，文件已不在则安静放弃 */
    const formatPath = async (path: string): Promise<void> => {
        if (!ctx.settings.autoFormat) return;

        const file = ctx.app.vault.getAbstractFileByPath(path);

        if (!(file instanceof TFile) || file.extension !== 'md') return;

        const mayWrite = (): boolean => ctx.app.workspace.getActiveFile()?.path !== path;

        if (!mayWrite()) {
            dirtyWhileOpen.add(path);
            return;
        }

        const changed = await formatFile(file, mayWrite);

        // 若最后一道闸关上了，这篇仍然是脏的；等用户下一次离开再整理
        if (!changed && !mayWrite()) dirtyWhileOpen.add(path);
    };

    // ============================================================
    // 防抖与在途计划
    // ============================================================

    const cancel = (path: string): void => {
        const pending = pendingTimeouts.get(path);

        if (pending === undefined) return;

        window.clearTimeout(pending);
        pendingTimeouts.delete(path);
    };

    const schedule = (path: string): void => {
        cancel(path);

        const timeoutId = window.setTimeout(() => {
            pendingTimeouts.delete(path);

            void formatPath(path).catch(() => {
                // 自动整理是背景动作：文件在等待期间被删被改而写入失败属于常态，
                // 弹 Notice 只会变成噪音。用户随时可以用命令再整理一次
            });
        }, FORMAT_DEBOUNCE_MS);

        pendingTimeouts.set(path, timeoutId);
    };

    ctx.plugin.register(() => {
        for (const timeoutId of pendingTimeouts.values()) window.clearTimeout(timeoutId);

        pendingTimeouts.clear();
    });

    // ============================================================
    // 什么时候不该动手
    // ============================================================

    /**
     * 这次变化该不该排一次整理。
     *
     * 它与 updatedMaintainer 的同名判断有一处**故意的不同**：那边看见「插件刚写过」就直接跳过，
     * 这边不看守卫。理由是插件自己插进去的那一行（记人情、增加付费、记收款、记灵感）
     * 恰恰最需要被整理——里面有用户现敲的字。不看守卫的底气是幂等：
     * 整理写盘后再来一趟，算出来一模一样，于是自己停下，不需要守卫替它刹车。
     * 真正的刹车是上面那把再入锁，它只挡住一秒内的第二次。
     */
    const shouldSkip = (path: string): boolean => {
        const last = lastRun.get(path);

        return last !== undefined && Date.now() - last < RE_ENTRY_MS;
    };

    // ============================================================
    // 监听
    // ============================================================

    ctx.app.workspace.onLayoutReady(() => {
        openPath = ctx.app.workspace.getActiveFile()?.path ?? null;

        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile): void => {
                if (!ctx.settings.autoFormat) {
                    cancel(file.path);
                    dirtyWhileOpen.delete(file.path);
                    return;
                }

                if (!(file instanceof TFile) || file.extension !== 'md') return;
                if (shouldSkip(file.path)) return;

                /*
                 * 分岔就在这一句：正开在眼前的那一篇，只记下「它脏了」，绝不当场整理。
                 *
                 * 中文输入法在合成期间被外部改写会吞字，而两秒的停顿在斟酌一句话时太常见；
                 * 就算不吞字，整篇重写也会让光标从他正打字的位置上移开。
                 *
                 * 这条纪律曾被当成本模块独有的，理由是「整篇重写才这么危险」。v0.33.0 由真机改正：
                 * updatedMaintainer 只改一个 YAML 字段，症状一模一样——代价与写多少字节无关，
                 * 只与「写盘的那一刻编辑器手里有没有未保存的改动」有关。于是它也搬来了同一套
                 * dirtyWhileOpen + 走开再补，两个常驻监听现在守的是同一条边界。
                 */
                if (file.path === openPath) {
                    dirtyWhileOpen.add(file.path);
                    return;
                }

                schedule(file.path);
            }),
        );

        /**
         * 用户换了笔记：回头把刚离开的那一篇整理掉。
         *
         * active-leaf-change 与 file-open 都订，是因为它们各管一半——
         * 换面板走前者，同一个面板里换文件走后者，漏掉任何一个都会留下一篇永远等不到整理的笔记。
         * 处理器本身可重入：整理完就从 dirty 里摘掉，两个事件先后到达也只跑一次。
         */
        const leaveCurrent = (): void => {
            const nextPath = ctx.app.workspace.getActiveFile()?.path ?? null;

            if (nextPath === openPath) return;

            const leaving = openPath;

            openPath = nextPath;

            if (leaving === null || !dirtyWhileOpen.delete(leaving)) return;

            void formatPath(leaving).catch(() => {
                // 同上：走开时的顺手整理失败不该拦住用户下一步
            });
        };

        ctx.plugin.registerEvent(ctx.app.workspace.on('active-leaf-change', leaveCurrent));
        ctx.plugin.registerEvent(ctx.app.workspace.on('file-open', leaveCurrent));
    });

    // ============================================================
    // 命令
    // ============================================================

    /**
     * 手动整理当前笔记。
     *
     * 它是唯一会动「你正开着的那一篇」的路径，因为此刻动手是你自己按下的——
     * 自动整理绕开这一篇的全部理由，在一次明确的按键面前都不成立。
     * 三种结果都出声：改了、本来就对、没打开笔记。这条命令是用户主动问的问题，
     * 沉默等于不回答。
     */
    ctx.commands.register(FORMAT_COMMAND, () => {
        const file = ctx.app.workspace.getActiveFile();

        if (!file || file.extension !== 'md') {
            new Notice(TEXTS.noFile);
            return;
        }

        // 九条全关时 formatMarkdown 是恒等函数，报「已经是标准写法」等于撒谎——
        // 真相是这次按键什么都没执行，而那是设置里的事，得指路
        if (ctx.settings.formatRules.length === 0) {
            new Notice(TEXTS.noRules);
            return;
        }

        void formatFile(file)
            .then((changed) => {
                dirtyWhileOpen.delete(file.path);
                new Notice(changed ? TEXTS.formatted : TEXTS.unchanged);
            })
            .catch(() => {
                new Notice(TEXTS.failed);
            });
    });
}
