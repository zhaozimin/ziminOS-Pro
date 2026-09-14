/**
 * [INPUT]: 依赖 obsidian 的 TFile 与 TAbstractFile 类型；依赖 core/constants 的 FOLDERS、core/editDebts 的编辑欠账、
 *          core/frontmatter 的 Frontmatter 类型、core/markdownViewState 的分栏滚动保护、
 *          core/time 的 stampOfMillis、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerUpdatedMaintainer（注册 updated 字段的自动维护）
 * [POS]: projects 模块里唯一常驻的编辑监听者，替代原方案中由 Linter 承担的 updated 维护职责。
 *        它与 cardInit 共守同一张卡片：那边写「出生」字段（created/UID/up），这边只碰 updated 一个字段，
 *        两边都不整篇重写。本文件只回答两件事——哪一次变化算人改的（记账），以及到点之后写下什么值（结算）；
 *        「什么时候写才不伤人」整件交给 core/editDebts：正开着的那一篇等走开、走开包含关掉、
 *        账跟着改名走、欠账存进本机，退出之后下次启动补上——那件事与 formatter 同一份实现，不再各写一份。
 *        写下的值是**最后一次改完时磁盘上的修改时间**，而不是落笔的此刻：补记可以晚，记下的值不能跟着晚。
 *        写盘会再次触发 modify，自激回路靠 SelfWriteGuard 断开；「只给已有 YAML 的笔记记账、绝不主动注入 YAML」
 *        是它对用户的底线承诺，记账与结算隔着两秒乃至一夜，所以守卫两头都站
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FOLDERS } from '../../core/constants';
import { registerEditDebts } from '../../core/editDebts';
import type { Frontmatter } from '../../core/frontmatter';
import { withPreservedMarkdownScroll } from '../../core/markdownViewState';
import { stampOfMillis } from '../../core/time';
import type { ZiminosContext } from '../../core/types';

/**
 * 防抖窗口（毫秒）。它管的是「没开着的那些笔记」——在 Bases 里改了一格、在人物档案里勾掉一条待办、
 * 同步工具刚拉下来一篇——连续变化收敛成一次写盘。正开着的那一篇不由它管，等走开。
 */
const UPDATED_DEBOUNCE_MS = 2000;

/**
 * 欠账在本机 localStorage 里的键（按库隔离）。
 * 它说的是「这台机器上还没补的那几笔」，所以既不进 data.json，也不落成随库同步的文件。
 */
const UPDATED_DEBTS_KEY = 'ziminos-updated-debts';

/** 系统目录前缀：导航与模板属于插件的基础设施，不参与修改留痕 */
const SYSTEM_PREFIX = `${FOLDERS.system}/`;

/**
 * 注册 updated 字段的自动维护。
 * 欠账先于 modify 监听注册，于是上一次运行留下的欠账总是先于这一次的第一笔新账被恢复。
 */
export function registerUpdatedMaintainer(ctx: ZiminosContext): void {
    /**
     * 结算一笔：把 updated 写成那一刻。
     *
     * 记账时的守卫在这里必须重走一遍，而不是信任当时的判定：两者之间可能隔着两秒，也可能隔着一夜，
     * 用户完全可能在这期间关掉开关、删掉整段 YAML、把笔记挪进系统目录——结算那一刻的现场才是唯一可信的判据。
     * 这几种情况一律视同结算完毕：那笔账已经不该存在了，而不是「以后再说」。
     */
    const stamp = async (file: TFile, changedAt: number): Promise<boolean> => {
        // 人的意愿优先于在途的机器动作
        if (!ctx.settings.autoUpdated) return true;

        if (file.path.startsWith(SYSTEM_PREFIX)) return true;

        const frontmatter = ctx.app.metadataCache.getFileCache(file)?.frontmatter;

        // 底线承诺的最后一道闸：此刻没有 YAML，processFrontMatter 会替他凭空造回来
        if (!frontmatter) return true;

        const value = stampOfMillis(changedAt, ctx.settings.dateTimeFormat);

        // 已经是这个值：同一个事实不再写一遍盘
        if (String(frontmatter.updated ?? '') === value) return true;

        // 先声明自写，再动手；这次写入引发的 modify 会被守卫挡在门外，不会自激成环
        ctx.guard.mark(file.path);

        await withPreservedMarkdownScroll(ctx.app, file, () =>
            ctx.app.fileManager.processFrontMatter(file, (fields: Frontmatter) => {
                fields.updated = value;
            }),
        );

        return true;
    };

    const debts = registerEditDebts(ctx, {
        debounceMs: UPDATED_DEBOUNCE_MS,
        storageKey: UPDATED_DEBTS_KEY,
        settle: stamp,
    });

    ctx.app.workspace.onLayoutReady(() => {
        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile): void => {
                // 1. 用户在设置里关掉了自动维护：这一篇的欠账一并作废
                if (!ctx.settings.autoUpdated) {
                    debts.forget(file.path);
                    return;
                }

                // 2. 只认 Markdown 文件
                if (!(file instanceof TFile) || file.extension !== 'md') return;

                // 3. 系统目录下的导航与模板不记账
                if (file.path.startsWith(SYSTEM_PREFIX)) {
                    debts.forget(file.path);
                    return;
                }

                // 4. 机器的反应不记账（updated 自己落笔、排版、出生、迁移、搬家——见 core/guard）。
                //    这一条只说明「这次变化不是人改的」，不否定人先前的编辑，因此不撤销已有的欠账
                if (ctx.guard.isRecent(file.path)) return;

                // 5. 只给已经有 YAML 的笔记记账，绝不给纯正文笔记强行注入 frontmatter。
                //    用户刚把 YAML 删光时，先前记下的那笔一并作废
                if (!ctx.app.metadataCache.getFileCache(file)?.frontmatter) {
                    debts.forget(file.path);
                    return;
                }

                // 6. 记下这一笔。开着的那一篇绝不当场写盘——在用户眼皮底下写盘，Obsidian 会当成外部修改，
                //    合并之后整篇重灌、视口跳走（v0.33.0 真机）；欠账替它等到走开
                debts.record(file);
            }),
        );
    });
}
