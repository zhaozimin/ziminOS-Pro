/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile 与 App/TAbstractFile 类型；依赖 core/commands 的 PERIOD_COMMANDS，
 *          core/constants 的 PERIODS/FIELDS/FOLDERS，
 *          core/folders 的 ensureFolderPath/isInFolder/normalizeFolderPath，core/time 的 currentPeriodTitle/
 *          periodOfTitle/periodStartOf/dayText/titleOfDay，core/types 的 ZiminosContext；
 *          依赖 ./templates 的 periodNoteContent
 * [OUTPUT]: 对外提供 registerPeriodicCommands（五条打开命令，可注入「日记打开后」回调）、
 *           registerPeriodAutoInit（新生复盘笔记的自动归位与套模板）、
 *           openPeriodNote（定位或创建当前或指定日期所属的某一级笔记）、
 *           periodFolderOf/diaryFolders（目录解析）、periodOfFile/periodStartOfNote（周期归属判定）
 * [POS]: 复盘模块的入口与坐标系。它替代的是 Templater + 日历插件那一套：
 *        五级笔记的文件名、目录、导航链接、周期锚点全部由日期算术确定性地推出，
 *        同输入同结果，无网络、无模板引擎。
 *        「不存在就按模板创建，存在但是空文件就补齐内容」是它的幂等姿态——
 *        学员用别的方式建过一个空日记，命令不会拒绝也不会覆盖，只把该有的骨架填进去。
 *        空态在 vault.process 的最新正文内复核；自动归位也在目录准备后复核文件身份与空态，
 *        异步等待期间已经写下内容或改变归属的笔记不再由旧计划接管。
 *        v0.22.13 之前这份幂等只在命令与日历两个入口上成立，于是同一篇日记
 *        会因为诞生方式不同变成两种东西；registerPeriodAutoInit 把它挂回
 *        「一篇复盘笔记诞生」这个事件本身——**入口不决定结果，名字与位置才决定身份**。
 *        「打开今天的日记」所需的缺失主题提示通过回调注入，底层 openPeriodNote 仍保持纯粹；
 *        记人情等只想静默确保日记存在的流程，不会被弹窗抢走焦点。自动认领同样不提问：
 *        建一篇笔记不是一次复盘，点开明天的日记更不是——主题归「写复盘主题」那条命令。
 *        它刻意不写 daily-notes.json：核心日记插件会建出不带模板的空文件，
 *        播种那份配置等于给学员造一条通向空白笔记的岔路
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import type { App, TAbstractFile } from 'obsidian';
import { PERIOD_COMMANDS } from '../../core/commands';
import { FIELDS, FOLDERS, PERIODS } from '../../core/constants';
import type { PeriodDefinition, PeriodKey } from '../../core/constants';
import { ensureFolderPath, isInFolder, normalizeFolderPath } from '../../core/folders';
import {
    currentPeriodTitle,
    dayText,
    periodOfTitle,
    periodStartOf,
    shiftDay,
    titleOfDay,
} from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import { periodNoteContent } from './templates';

// ============================================================
// 目录解析
// ============================================================

/**
 * 某一级复盘笔记该住的目录。
 * 五个子目录名固定，根目录取自设置——学员把 05-diary 改名或整体搬走，
 * 只改设置页那一个输入框，五条命令与四个视图跟着走。
 */
export function periodFolderOf(ctx: ZiminosContext, period: PeriodDefinition): string {
    const root = normalizeFolderPath(ctx.settings.diaryFolder, FOLDERS.diary);
    const leaf = period.folder.slice(FOLDERS.diary.length + 1);

    return `${root}/${leaf}`;
}

/** 复盘时间轴的全部目录，父目录先于子目录，供开荒贡献使用 */
export function diaryFolders(ctx: ZiminosContext): string[] {
    const root = normalizeFolderPath(ctx.settings.diaryFolder, FOLDERS.diary);

    return [root, ...Object.values(PERIODS).map((period) => periodFolderOf(ctx, period))];
}

// ============================================================
// 周期归属判定
// ============================================================

/**
 * 这篇笔记是哪一级复盘？不是复盘笔记返回 null。
 *
 * 先认 type 再认文件名：type 是笔记自己声明的身份，最可信；
 * 文件名解析是给「用别的工具建出来、还没来得及有 type」的笔记留的后路。
 * 两条都用严格解析，2026-13-45 这类看着像日期的名字不会蒙混过关。
 */
export function periodOfFile(app: App, file: TFile): PeriodDefinition | null {
    const declaredType = String(
        app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.type] ?? '',
    ).trim();

    for (const period of Object.values(PERIODS)) {
        if (period.type === declaredType) return period;
    }

    return periodOfTitle(file.basename);
}

/**
 * 一篇复盘笔记的周期锚点。
 * 优先读声明的 period_start，读不到才从标题推——日记本来就没有这个字段，
 * 它的锚点永远是文件名，这不是缺失而是设计。
 */
export function periodStartOfNote(
    app: App,
    file: TFile,
    period: PeriodDefinition,
): string | null {
    const declared = dayText(app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.periodStart]);

    return declared ?? periodStartOf(period, file.basename);
}

/** 「范围」参数到周期的映射；学员在代码块里写「范围: 周」 */
const SCOPE_ALIASES: Readonly<Record<string, PeriodKey>> = {
    周: 'weekly',
    月: 'monthly',
    季: 'quarterly',
    年: 'yearly',
};

/** 一次视图渲染所处的时间坐标：哪一级、从哪天到哪天（右端开区间） */
export interface PeriodScope {
    readonly period: PeriodDefinition;
    readonly start: string;
    readonly end: string;
}

/**
 * 解出一个视图该看哪段时间。
 *
 * 以宿主笔记自己的身份为准，认不出来才看块里写的「范围」——
 * 笔记的 type 是它自己声明的事实，比代码块里的一行参数可信；
 * 参数存在的意义是给那些还没有 type 的笔记留一条明路，而不是覆盖事实。
 * 区间一律取左闭右开，五级共用同一条比较式，不存在「月末那天算不算」这类边界分歧。
 */
export function resolveScope(
    app: App,
    host: TFile | null,
    params: Readonly<Record<string, string>>,
): PeriodScope | null {
    const aliasKey = SCOPE_ALIASES[params['范围'] ?? ''];
    const period = (host ? periodOfFile(app, host) : null) ?? (aliasKey ? PERIODS[aliasKey] : null);

    if (!period || !host) return null;

    const start = periodStartOfNote(app, host, period);

    if (!start) return null;

    return { period, start, end: shiftDay(start, 1, period.stepUnit) };
}

// ============================================================
// 打开或创建
// ============================================================

/**
 * 打开当下所属的那一篇复盘笔记，不存在就按模板创建。
 *
 * 三种情形三种姿态，都不覆盖用户内容：
 * 文件不存在 → 建；文件在但是空的 → 把骨架填进去（别的工具建的空壳也能用起来）；
 * 文件在且有内容 → 一个字不动，直接打开。
 */
export interface OpenPeriodNoteOptions {
    /** false 时只保证文件存在，不抢走当前编辑视野 */
    readonly reveal?: boolean;
    /** 任意 YYYY-MM-DD 锚点；缺省即今天。日历五级点击经它复用同一套创建内核 */
    readonly day?: string;
}

/**
 * 空文件就把骨架填进去，有内容就一个字不动。
 *
 * 「空」以磁盘上的字节数为准而不是以「看起来没写什么」为准：
 * 同步工具带着内容落盘的笔记不是新建，插件永远没有改写它的资格。
 * 命令入口与自动认领共用这一段，于是「一篇复盘笔记该长什么样」
 * 不会因为它是怎么诞生的而出现第二个答案。
 */
async function fillSkeletonIfEmpty(
    ctx: ZiminosContext,
    file: TFile,
    period: PeriodDefinition,
    title: string,
): Promise<void> {
    if (file.stat.size !== 0) return;

    await ctx.app.vault.process(file, (content) => {
        if (
            content !== '' || file.path !== `${periodFolderOf(ctx, period)}/${title}.md` ||
            ctx.app.vault.getAbstractFileByPath(file.path) !== file
        ) return content;
        ctx.guard.mark(file.path);
        return periodNoteContent(period, title, ctx.settings.dateTimeFormat);
    });
}

export async function openPeriodNote(
    ctx: ZiminosContext,
    period: PeriodDefinition,
    options?: OpenPeriodNoteOptions,
): Promise<TFile | null> {
    try {
        const title = options?.day ? titleOfDay(options.day, period) : currentPeriodTitle(period);

        if (!title) {
            new Notice(`无法从日期 ${options?.day ?? ''} 定位${period.label}`);

            return null;
        }

        const folder = periodFolderOf(ctx, period);
        const path = `${folder}/${title}.md`;
        const existing = ctx.app.vault.getAbstractFileByPath(path);

        if (existing && !(existing instanceof TFile)) {
            new Notice(`同名的不是笔记而是文件夹：${path}`);

            return null;
        }

        let file = existing as TFile | null;

        if (!file) {
            await ensureFolderPath(ctx.app, folder);
            ctx.guard.mark(path);
            try {
                file = await ctx.app.vault.create(
                    path,
                    periodNoteContent(period, title, ctx.settings.dateTimeFormat),
                );
            } catch (error) {
                // 两个入口同时打开今天时，后到者复用先到者创建的笔记。
                const created = ctx.app.vault.getAbstractFileByPath(path);
                if (!(created instanceof TFile)) throw error;
                file = created;
                await fillSkeletonIfEmpty(ctx, file, period, title);
            }
        } else {
            await fillSkeletonIfEmpty(ctx, file, period, title);
        }

        // reveal 为 false 时只保证笔记存在，不抢走学员当前的视野——
        // 记人情这类「顺手记一笔」的动作不该把他正在读的笔记顶掉
        if (options?.reveal !== false) await ctx.app.workspace.getLeaf(false).openFile(file);

        return file;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(`打开${period.label}失败：${message}`);

        return null;
    }
}

/**
 * 注册五条打开命令。
 *
 * 五条而不是「一条命令再选周期」：每一条都能各自绑快捷键，
 * 而日记是每天要开的高频入口，让它多经过一层选择是把成本加在最高频的动作上。
 */
export function registerPeriodicCommands(
    ctx: ZiminosContext,
    onDailyOpened?: (file: TFile) => Promise<void>,
): void {
    for (const period of Object.values(PERIODS)) {
        ctx.commands.register(PERIOD_COMMANDS[period.key], () => {
            void (async () => {
                const file = await openPeriodNote(ctx, period);

                if (file && period.key === 'daily') await onDailyOpened?.(file);
            })();
        });
    }
}

// ============================================================
// 自动认领：一篇复盘笔记不因为诞生方式不同而变成两种东西
// ============================================================

/**
 * 一篇新生的笔记该被认成哪一级、该住到哪里去；认不出来返回 null。
 *
 * 判据只有两条，都与「谁把它建出来的」无关：**名字**说它是哪一级，
 * **位置**说它归不归这套时间轴管。复盘根目录之外一概不猜——
 * 00-inbox 里一篇叫 2026 的笔记是用户自己的事，不是年记。
 */
function adoptionOf(
    ctx: ZiminosContext,
    file: TFile,
): { readonly period: PeriodDefinition; readonly title: string; readonly path: string } | null {
    if (file.extension !== 'md') return null;

    const root = normalizeFolderPath(ctx.settings.diaryFolder, FOLDERS.diary);

    if (!isInFolder(file.path, root)) return null;

    const period = periodOfTitle(file.basename);

    if (!period) return null;

    return {
        period,
        title: file.basename,
        path: `${periodFolderOf(ctx, period)}/${file.basename}.md`,
    };
}

/**
 * 把一篇刚诞生的空笔记认领成复盘笔记：放到该去的目录，填上该有的骨架。
 *
 * 归位这一步是为那条上级双链准备的。日记正文里的 `↑ [[2026-W37|本周]]` 只写标题不写路径，
 * Obsidian 便按它自己的「新笔记位置」设置落盘——默认是「当前文件所在目录」，
 * 于是点一下上级，周记被建进了 01-daily。位置在这套坐标系里不是摆设：
 * periodFolderOf 是「哪一级住哪儿」的唯一事实源，一篇住错目录的周记
 * 会让整个时间轴的目录语义失效。搬动只发生在空文件上，因此搬不丢任何东西。
 */
async function adoptPeriodNote(ctx: ZiminosContext, file: TFile): Promise<void> {
    const adoption = adoptionOf(ctx, file);

    if (!adoption) return;

    const { period, title, path } = adoption;
    const originalPath = file.path;

    if (file.path !== path) {
        const occupant = ctx.app.vault.getAbstractFileByPath(path);

        // 那一级已经有同名笔记了：既不覆盖它，也不在错误的目录里再造一篇冒名的。
        // 这一句必须说出来——静默放过的话，学员会看着两篇 2026-W37 不知道哪篇是真的
        if (occupant) {
            new Notice(`${period.label} ${title} 已经在 ${path}，这一篇没有搬过去`);

            return;
        }

        await ensureFolderPath(ctx.app, path.slice(0, path.lastIndexOf('/')));
        // 创建目录期间用户可能已经写字、改名或移动文件；事件到达时的空态不再是授权。
        if (
            file.stat.size !== 0 || file.path !== originalPath ||
            ctx.app.vault.getAbstractFileByPath(originalPath) !== file ||
            adoptionOf(ctx, file)?.path !== path
        ) return;
        // 搬动前后两个路径都要登记：重命名事件报的是新路径，登记漏一个就会自己触发自己
        ctx.guard.mark(file.path);
        ctx.guard.mark(path);
        await ctx.app.fileManager.renameFile(file, path);
    }

    await fillSkeletonIfEmpty(ctx, file, period, title);
}

/**
 * 注册新生复盘笔记的自动认领。
 *
 * 它补的是这个模块一直缺的那一半：openPeriodNote 把「定位、创建、套模板」焊在一条链上，
 * 而那条链只有命令与日历两个入口够得着。学员在文件夹里右键新建、点开一条还没有目标的双链、
 * 或者让同步工具落下一个空壳，得到的都是一篇没有骨架的空笔记——
 * 同一篇日记，因为诞生方式不同变成了两种东西。**入口不该决定结果。**
 *
 * 两个事件缺一不可，因为「在文件夹里新建一篇日记」根本不是一次 create：
 * Obsidian 先建出「未命名」再让你就地改名，日期是在 rename 那一刻才出现的。
 * 只听 create 的话，用户最常用的那条路恰好是听不见的那条。
 *
 * 五道闸全部指向同一件事——只碰那些确实是刚诞生、且确实属于这套时间轴的空笔记：
 * 不是 Markdown 不碰、插件自己刚写过不碰、有内容不碰、复盘目录之外不碰、名字解析不出周期不碰。
 * 监听放在 onLayoutReady 内是官方推荐写法：库启动期会为每个既有文件补发 create 事件，
 * 在此之前注册会把整库笔记误当成新建。
 */
export function registerPeriodAutoInit(ctx: ZiminosContext): void {
    const handle = (file: TAbstractFile): void => {
        // 插件自己刚建或刚搬的文件不触发，避免自激
        if (!(file instanceof TFile) || ctx.guard.isRecent(file.path)) return;

        // 有内容的笔记一律放过：它不是刚诞生的，插件没有改写它的资格
        if (file.stat.size !== 0) return;

        void adoptPeriodNote(ctx, file).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);

            new Notice(`套用复盘模板失败：${message}`);
        });
    };

    ctx.app.workspace.onLayoutReady(() => {
        ctx.plugin.registerEvent(ctx.app.vault.on('create', handle));
        ctx.plugin.registerEvent(ctx.app.vault.on('rename', handle));
    });
}
