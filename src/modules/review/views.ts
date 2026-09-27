/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型；依赖 core/codeblock 的 ViewContext/ViewDefinition，
 *          core/constants 的 FIELDS/FOLDERS/PERIODS，core/folders 的 isInFolder/normalizeFolderPath，
 *          core/table 的五个渲染原语，core/time 的 dayText/dayOfMillis/dayOfTitle/shiftDay/titleOfDay，
 *          core/vaultIndex 的 toText；依赖 ./periodic 的 periodOfFile/periodStartOfNote
 * [OUTPUT]: 对外提供 reviewThemeViews（旧日记的今日产出兼容视图、主题链视图）
 * [POS]: 主题链的自动侧，并为尚未升级为持久 Markdown 活动区的旧日记保留查询投影。
 *        日记写一句 theme，其余四级全是它的投影——本文件就是那个投影仪。
 *        两个视图共守一条纪律：缺记录必须显式留空，绝不兜底成 0。
 *        实测日记覆盖密度只有 16%，把空结果说成零值，等于把「本月没记录」
 *        伪装成「本月跑了 0 公里」——那是最容易骗人的画面，也是复盘失真的起点。
 *        因此每张表都把「几分之几有记录」和结论摆在同一屏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TFile } from 'obsidian';
import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import { FIELDS, FOLDERS, PERIODS } from '../../core/constants';
import type { PeriodDefinition, PeriodKey } from '../../core/constants';
import { isInFolder, normalizeFolderPath } from '../../core/folders';
import { noteLink, renderEmpty, renderNote, renderSummary, renderTable } from '../../core/table';
import { dayOfMillis, dayOfTitle, dayText, shiftDay, titleOfDay } from '../../core/time';
import { toText } from '../../core/vaultIndex';
import type { Cell } from '../../core/table';
import { periodStartOfNote, resolveScope } from './periodic';
import type { PeriodScope } from './periodic';

/** 一张表最多列多少行，超出折成一句「另有 N 篇」——复盘要的是判断，不是流水账 */
const MAX_ROWS = 12;

/** 每一级向下看一级：周记看日记，月记看周记，季记与年记都看月记 */
const CHILD_OF: Readonly<Record<PeriodKey, PeriodKey | null>> = {
    daily: null,
    weekly: 'daily',
    monthly: 'weekly',
    quarterly: 'monthly',
    yearly: 'monthly',
};

/** 季看三个月，年看十二个月 */
const MONTH_SPAN: Readonly<Record<string, number>> = { quarterly: 3, yearly: 12 };

const WEEKDAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

// ============================================================
// 今日产出
// ============================================================

/**
 * 今天新建与改动了哪些笔记，按所属项目标注来源。
 * 日记只看单篇粒度——从周记开始才把卡片折叠成项目，因为周期越长越该看结果而非动作。
 */
const dailyOutput: ViewDefinition = {
    name: '今日产出',
    render: async (view: ViewContext): Promise<void> => {
        const day = view.host ? dayOfTitle(view.host.basename) : null;

        if (!day) {
            renderEmpty(view.el, '这篇笔记的文件名不是 YYYY-MM-DD，拿不到日期。用「打开今天的日记」建的笔记，本区块自动生效。');

            return;
        }

        const folders = contentFolders(view);
        const created: TFile[] = [];
        const changed: TFile[] = [];

        for (const file of view.index.allNotes()) {
            if (!folders.some((folder) => isInFolder(file.path, folder))) continue;

            if (dayOf(view, file, FIELDS.created, file.stat.ctime) === day) {
                // 今天新建的不重复计入「改动」：它当然也是今天改的，说两遍等于虚报
                created.push(file);

                continue;
            }

            if (dayOf(view, file, FIELDS.updated, file.stat.mtime) === day) changed.push(file);
        }

        if (!created.length && !changed.length) {
            renderEmpty(view.el, '今天还没有笔记产出。在项目目录里写点什么，这里会自动长出来。');

            return;
        }

        renderSummary(view.el, `新建 **${created.length}** 篇 · 改动 **${changed.length}** 篇`);

        // 两类行合进一张表，用首列标记区分：分两次建表会得到两个各自算列宽的表格，列必然对不齐
        const rows: Cell[][] = [];

        collectRows(rows, '🆕', created, view);
        collectRows(rows, '✏️', changed, view);

        renderTable(view.ctx.app, view.el, view.sourcePath, ['', '笔记', '所属'], rows, 1);
    },
};

/** 把一组笔记折成表格行，超出上限的折成一句提示 */
function collectRows(rows: Cell[][], mark: string, files: readonly TFile[], view: ViewContext): void {
    for (const file of files.slice(0, MAX_ROWS)) {
        rows.push([mark, noteLink(file), originOf(view, file)]);
    }

    if (files.length > MAX_ROWS) rows.push([mark, `…另有 ${files.length - MAX_ROWS} 篇`, '']);
}

/** 从路径反推笔记的归属：项目目录下取项目名，归档目录下加个箱子标记，其余取顶层目录 */
function originOf(view: ViewContext, file: TFile): string {
    const projects = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
    const archives = normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives);
    const folder = file.parent?.path ?? '';

    if (isInFolder(folder, projects) && folder !== projects) {
        return folder.slice(projects.length + 1).split('/')[0];
    }

    if (isInFolder(folder, archives) && folder !== archives) {
        return `📦 ${folder.slice(archives.length + 1).split('/')[0]}`;
    }

    return folder.split('/')[0] || '根目录';
}

/** 内容目录：资源库刻意不算产出——它是备而不用的仓库，往里放东西不等于推进了什么 */
function contentFolders(view: ViewContext): string[] {
    return [
        FOLDERS.inbox,
        normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects),
        normalizeFolderPath(view.ctx.settings.areaFolder, FOLDERS.areas),
        normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives),
    ];
}

/** 取某个时间字段的日粒度值，字段缺失才回落文件系统时间 */
function dayOf(view: ViewContext, file: TFile, field: string, fallbackMillis: number): string {
    return dayText(view.index.fieldOf(file, field)) ?? dayOfMillis(fallbackMillis);
}

// ============================================================
// 主题链
// ============================================================

/**
 * 下一级周期的主题清单。
 * 主题链就是靠它一级级向上汇总：七句日主题连成一周，四条周主题连成一月，直到一年。
 */
const themeChain: ViewDefinition = {
    name: '主题链',
    render: async (view: ViewContext): Promise<void> => {
        const scope = resolveScope(view.ctx.app, view.host, view.params);

        if (!scope) {
            renderEmpty(view.el, '这篇笔记算不出周期坐标：它不是复盘笔记，文件名也不是本级格式。用「打开本周复盘」建的笔记，本区块自动生效。');

            return;
        }

        const childKey = CHILD_OF[scope.period.key];

        if (!childKey) {
            renderEmpty(view.el, '日记下面没有更小的周期了，主题链放在周记及以上才有内容。');

            return;
        }

        const child = PERIODS[childKey];

        if (childKey === 'daily') renderDays(view, child, scope.start);
        else if (childKey === 'weekly') renderWeeks(view, child, scope);
        else renderMonths(view, child, scope);
    },
};

/** 周记看七天：缺日记的格子显式写「（无日记）」，末尾报几分之几 */
function renderDays(view: ViewContext, child: PeriodDefinition, start: string): void {
    const byTitle = notesByTitle(view, child);
    const rows: Cell[][] = [];
    let filled = 0;

    for (let offset = 0; offset < 7; offset += 1) {
        const day = shiftDay(start, offset, 'day');
        const note = byTitle.get(day);

        if (note) filled += 1;

        rows.push([
            note ? noteLink(note) : day.slice(5),
            `周${WEEKDAY_NAMES[offset]}`,
            themeCell(view, note, '（无日记）'),
        ]);
    }

    renderTable(view.ctx.app, view.el, view.sourcePath, ['日期', '星期', '当日主题'], rows, 2);
    renderNote(view.el, `本周 **${filled}/7** 天有日记。`);
}

/**
 * 月记看各周。
 * 周归属月按 ISO 惯例以周四为准：每周只归一个月，不重不漏。
 * 按周一归属的话，跨月那一周会在两个月里各出现一次，或者一次都不出现。
 */
function renderWeeks(view: ViewContext, child: PeriodDefinition, scope: PeriodScope): void {
    const weeks: { start: string; note: TFile }[] = [];

    for (const note of view.index.notesOfType(child.type)) {
        const weekStart = periodStartOfNote(view.ctx.app, note, child);

        if (!weekStart) continue;

        const thursday = shiftDay(weekStart, 3, 'day');

        if (thursday < scope.start || thursday >= scope.end) continue;

        weeks.push({ start: weekStart, note });
    }

    if (!weeks.length) {
        renderEmpty(view.el, '本月还没有周记。命令面板运行「打开本周复盘」写第一篇。');

        return;
    }

    weeks.sort((left, right) => left.start.localeCompare(right.start));

    renderTable(
        view.ctx.app,
        view.el,
        view.sourcePath,
        ['周', '本周主题'],
        weeks.map((week) => [noteLink(week.note), themeCell(view, week.note, '')]),
        1,
    );
}

/** 季记看三个月、年记看十二个月：缺月记的月份显式标注 */
function renderMonths(view: ViewContext, child: PeriodDefinition, scope: PeriodScope): void {
    const span = MONTH_SPAN[scope.period.key] ?? 12;
    const byTitle = notesByTitle(view, child);
    const rows: Cell[][] = [];
    let filled = 0;

    for (let offset = 0; offset < span; offset += 1) {
        const monthStart = shiftDay(scope.start, offset, 'month');
        const title = titleOfDay(monthStart, child) ?? monthStart;
        const note = byTitle.get(title);

        if (note) filled += 1;

        rows.push([note ? noteLink(note) : title, themeCell(view, note, '（无月记）')]);
    }

    renderTable(view.ctx.app, view.el, view.sourcePath, ['月份', '本月主题'], rows, 1);
    renderNote(
        view.el,
        `本${scope.period.key === 'quarterly' ? '季' : '年'} **${filled}/${span}** 个月有月记。`,
    );
}

// ============================================================
// 共用
// ============================================================

/** 某一级的全部笔记，按标题索引 */
function notesByTitle(view: ViewContext, period: PeriodDefinition): Map<string, TFile> {
    const map = new Map<string, TFile>();

    for (const note of view.index.notesOfType(period.type)) {
        map.set(note.basename, note);
    }

    return map;
}

/** 主题格：笔记在但没写主题、笔记根本不存在，是两件不同的事，不能都显示成空白 */
function themeCell(view: ViewContext, note: TFile | undefined, missing: string): string {
    if (!note) return missing;

    return toText(view.index.fieldOf(note, FIELDS.theme)) || '（未写主题）';
}

/** 复盘的主题链两视图 */
export const reviewThemeViews: readonly ViewDefinition[] = [dailyOutput, themeChain];
