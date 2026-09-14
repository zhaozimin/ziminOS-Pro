/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile/TAbstractFile 类型；依赖 core/commands 的 FORMAT_COMMAND、
 *          core/editDebts 的编辑欠账与 isNoteInFront、core/markdownStyle 的 formatMarkdown、
 *          core/markdownViewState 的分栏滚动保护、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerFormatter（注册整理命令与自动整理）
 * [POS]: 排版模块的全部。规则本体住在 core/markdownStyle——那是一趟纯字符串变换，
 *        本文件只回答「这次变化该不该排一次整理」与「到点之后怎么整理」，两件事分开是因为前者可测、后者只能真机验。
 *        「什么时候整理才不伤人」整件交给 core/editDebts，与 updatedMaintainer 同一份实现：
 *        正开着的那一篇等走开、走开包含关掉、账跟着改名走——这件事原本两边各写一份，
 *        v0.33.0 只修好了那一边的「关标签页」，这一边一直在拿「最近活动过」当「开着」。
 *        它替代的是学员原本要自己装的 Linter 插件，但刻意只做那一件最基础的事：
 *        标准 Markdown 的写法，而不是一百条可配置的重排。
 *        全插件第二个常驻编辑监听（第一个是 updatedMaintainer），两者共处一室的规矩写在下面 shouldSkip 那一段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FORMAT_COMMAND } from '../../core/commands';
import { isNoteInFront, registerEditDebts } from '../../core/editDebts';
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
    /** 路径 → 最近一次真正整理的时刻，配合 RE_ENTRY_MS 使用 */
    const lastRun = new Map<string, number>();

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
                // 读盘之后用户可能把这篇点回眼前；真正写盘的这一刻再问一次，人的编辑权优先
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

    /**
     * 结算一笔：把已经不在眼前的那一篇整理掉。
     *
     * 欠账保证调用时它不在眼前；可 cachedRead 之后隔着一次读盘，用户完全可能把它点回来，
     * 于是闸门在读盘后与写盘时各问一次。返回 false 只有这一种情况——这笔账留着，等他下一次走开。
     */
    const settle = async (file: TFile): Promise<boolean> => {
        if (!ctx.settings.autoFormat || file.extension !== 'md') return true;

        const stillAway = (): boolean => !isNoteInFront(ctx.app, file.path);
        const changed = await formatFile(file, stillAway);

        return changed || stillAway();
    };

    const debts = registerEditDebts(ctx, { debounceMs: FORMAT_DEBOUNCE_MS, settle });

    // ============================================================
    // 什么时候不该动手
    // ============================================================

    /**
     * 这次变化该不该排一次整理。
     *
     * 它与 updatedMaintainer 的同名判断有一处**故意的不同**：那边看见「插件刚写过」就直接跳过，
     * 这边不看守卫。理由是插件替人插进去的那一行（记人情、增加付费、记收款、记灵感）
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
        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile): void => {
                if (!ctx.settings.autoFormat) {
                    debts.forget(file.path);
                    return;
                }

                if (!(file instanceof TFile) || file.extension !== 'md') return;
                if (shouldSkip(file.path)) return;

                /*
                 * 记一笔，由欠账决定什么时候整理：正开在眼前的那一篇绝不当场整理。
                 *
                 * 中文输入法在合成期间被外部改写会吞字，而两秒的停顿在斟酌一句话时太常见；
                 * 就算不吞字，整篇重写也会让光标从他正打字的位置上移开。
                 * 这条纪律曾被当成本模块独有的（「整篇重写才这么危险」），v0.33.0 由真机改正：
                 * 代价与写多少字节无关，只与「写盘的那一刻编辑器手里有没有未保存的改动」有关。
                 */
                debts.record(file);
            }),
        );
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
                debts.forget(file.path);
                new Notice(changed ? TEXTS.formatted : TEXTS.unchanged);
            })
            .catch(() => {
                new Notice(TEXTS.failed);
            });
    });
}
