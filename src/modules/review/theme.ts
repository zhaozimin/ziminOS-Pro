/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile；依赖 core/commands 的 THEME_COMMAND，core/constants 的 FIELDS/PERIODS，
 *          core/modals 的 TextInputModal，core/frontmatter 的 Frontmatter 类型，
 *          core/time 的 today，core/types 的 ZiminosContext；依赖 ./periodic 的 periodOfFile 与 openPeriodNote
 * [OUTPUT]: 对外提供 registerThemeCommand（注册「写复盘主题」命令）与
 *           promptThemeIfMissing（只在日记尚无主题时询问一次）
 * [POS]: 主题链的唯一录入口。整条链——日→周→月→季→年——只需要人写这一句，
 *        其余四级全是它的投影，所以这条命令的可用性直接决定复盘系统成不成立。
 *        三个设计取舍都指向同一件事：让写下这句话的成本尽可能低。
 *        其一，学员主动打开今天的日记时，缺主题才问、已有主题不打扰；
 *        其二，「写复盘主题」是明确的修改入口，一条命令覆盖五级：
 *        站在周记上写周主题，站在别处写今天的日主题，
 *        行为可预测，不必为每一级各记一条命令；
 *        其三，弹窗带出现有值可直接改写，但留空不清空——
 *        误触 Esc 或空回车不该把已经写好的结论抹掉
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { THEME_COMMAND } from '../../core/commands';
import { FIELDS, PERIODS } from '../../core/constants';
import type { PeriodDefinition } from '../../core/constants';
import type { Frontmatter } from '../../core/frontmatter';
import { TextInputModal } from '../../core/modals';
import { today } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import { openPeriodNote, periodOfFile } from './periodic';

const MESSAGES = {
    unchanged: '主题没有变化（留空不会清掉已经写好的主题）',
    donePrefix: '已写入',
    failedPrefix: '写主题失败：',
} as const;

/** 注册「写复盘主题」命令 */
export function registerThemeCommand(ctx: ZiminosContext): void {
    ctx.commands.register(THEME_COMMAND, () => {
        void writeTheme(ctx);
    });
}

/** 打开今天的日记时补齐缺失主题；已有内容时保持安静 */
export async function promptThemeIfMissing(
    ctx: ZiminosContext,
    file: TFile,
): Promise<void> {
    try {
        const current = themeOf(ctx, file);

        if (current) return;

        await promptAndWriteTheme(ctx, file, PERIODS.daily, current);
    } catch (error) {
        reportFailure(error);
    }
}

/**
 * 找到该写主题的那篇笔记，问一句，写进去。
 *
 * 目标笔记的确定规则只有一条：当前笔记本身是复盘笔记就写它的，否则写今天的日记。
 * 后者会顺带把今天的日记建出来——学员从任何地方触发这条命令，都能立刻落笔，
 * 不需要先想起来「我得先建一篇日记」。
 */
async function writeTheme(ctx: ZiminosContext): Promise<void> {
    try {
        const target = await resolveTarget(ctx);

        if (!target) return;

        const { file, period } = target;
        await promptAndWriteTheme(ctx, file, period, themeOf(ctx, file));
    } catch (error) {
        reportFailure(error);
    }
}

/** 统一的询问与写入流程：自动补齐与主动修改只差在调用前是否过滤已有主题 */
async function promptAndWriteTheme(
    ctx: ZiminosContext,
    file: TFile,
    period: PeriodDefinition,
    current: string,
): Promise<void> {
    const answer = await new TextInputModal(ctx.app, {
        title: promptOf(period, file),
        placeholder: '一句话，写结论不写过程',
        initial: current,
    }).openAndGetValue();

    if (answer === null) return;

    const theme = answer.trim();

    if (!theme) {
        new Notice(MESSAGES.unchanged);

        return;
    }

    // 替人落笔，不登记自写：主题是用户写的结论，这篇周期笔记的 updated 应当照记（见 core/guard）
    await ctx.app.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
        frontmatter[FIELDS.theme] = theme;
    });

    new Notice(`${MESSAGES.donePrefix}${period.label}主题：${theme}`);
}

/** 缓存里的 theme 是这条链的唯一判据：去空白后有值就算已完成 */
function themeOf(ctx: ZiminosContext, file: TFile): string {
    return String(
        ctx.app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.theme] ?? '',
    ).trim();
}

/** 两个入口共用同一种中文错误反馈 */
function reportFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    new Notice(MESSAGES.failedPrefix + message);
}

/** 当前笔记是复盘笔记就用它，否则打开（必要时创建）今天的日记 */
async function resolveTarget(
    ctx: ZiminosContext,
): Promise<{ file: TFile; period: PeriodDefinition } | null> {
    const active = ctx.app.workspace.getActiveFile();

    if (active) {
        const period = periodOfFile(ctx.app, active);

        if (period) return { file: active, period };
    }

    const diary = await openPeriodNote(ctx, PERIODS.daily);

    return diary ? { file: diary, period: PERIODS.daily } : null;
}

/** 每一级问的问题不同：日看做了什么，周看推进了哪项目标，越往上越问主线 */
function promptOf(period: PeriodDefinition, file: TFile): string {
    switch (period.key) {
        case 'daily':
            return file.basename === today()
                ? '今天主要做了什么？（周复盘看的就是它）'
                : `${file.basename} 主要做了什么？（周复盘看的就是它）`;
        case 'weekly':
            return '本周主题：这周主要推进了哪项人生管理目标？';
        case 'monthly':
            return '本月主题：这个月主线推进到哪一步了？';
        case 'quarterly':
            return '季度主题：这三个月，主线任务推进了多少？';
        default:
            return '年度主题：用一句话概括这一年的主线';
    }
}
