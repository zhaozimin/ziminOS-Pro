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
 *        事件到达时判一次以决定排不排计划，落盘前再判一次以决定这计划还算不算数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FOLDERS } from '../../core/constants';
import type { Frontmatter } from '../../core/frontmatter';
import { withPreservedMarkdownScroll } from '../../core/markdownViewState';
import { nowStamp } from '../../core/time';
import type { ZiminosContext } from '../../core/types';

/**
 * 防抖窗口（毫秒）。用户连续敲字期间 modify 会密集触发，
 * 停手两秒后才落一次盘，既保证 updated 及时，又不与用户的输入抢文件。
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

    // ============================================================
    // 落盘
    // ============================================================

    /**
     * 防抖到点后真正写入 updated。
     * 此处必须把事件处理器的守卫重走一遍，而不是信任两秒前的那次判定：
     * 排计划与落盘之间隔着整整两秒，用户完全可能在这两秒里关掉开关、删掉整段 YAML，
     * 或把笔记挪进系统目录——落盘前的现场状态才是唯一可信的判据。
     */
    const applyUpdated = async (path: string): Promise<void> => {
        // 等待期间用户可能已关掉开关，人的意愿优先于在途的机器动作
        if (!ctx.settings.autoUpdated) return;

        // 系统目录下的导航与模板不记账；路径可能在等待期间被挪进来
        if (path.startsWith(SYSTEM_PREFIX)) return;

        const file = ctx.app.vault.getAbstractFileByPath(path);

        if (!(file instanceof TFile)) return;

        // 底线承诺的最后一道闸：用户若刚把 YAML 整段删掉，processFrontMatter 会替他凭空造回来，
        // 那正是本文件承诺绝不做的事——此刻没有 frontmatter，就此收手
        if (!ctx.app.metadataCache.getFileCache(file)?.frontmatter) return;

        // 先声明自写，再动手；这次写入引发的 modify 事件会被守卫挡在门外，不会自激成环
        ctx.guard.mark(path);

        await withPreservedMarkdownScroll(ctx.app, file, () =>
            ctx.app.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
                frontmatter.updated = nowStamp(ctx.settings.dateTimeFormat);
            }),
        );
    };

    // ============================================================
    // 防抖
    // ============================================================

    /** 为一个路径重排防抖：新的编辑总是把上一次的计划推迟 */
    const scheduleUpdate = (path: string): void => {
        const pending = pendingTimeouts.get(path);

        if (pending !== undefined) window.clearTimeout(pending);

        const timeoutId = window.setTimeout(() => {
            pendingTimeouts.delete(path);

            void applyUpdated(path).catch(() => {
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
        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile): void => {
                // 1. 用户在设置里关掉了自动维护
                if (!ctx.settings.autoUpdated) {
                    cancelUpdate(file.path);
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

                scheduleUpdate(file.path);
            }),
        );
    });
}
