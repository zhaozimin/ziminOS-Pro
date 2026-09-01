/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型；依赖 core/codeblock 的 ViewContext/ViewDefinition，
 *          core/constants 的 FIELDS/FOLDERS/CONTAINER_TYPES，core/folders 的 isInFolder/normalizeFolderPath，
 *          core/table 的渲染原语，core/time 的 dayText/dayOfMillis/daysBetween/today，
 *          core/vaultIndex 的 toText；依赖 ./periodic 的 resolveScope
 * [OUTPUT]: 对外提供 reviewProjectViews（项目动态、完成的项目、年度全景三个视图定义）
 * [POS]: 主题链是纵向的，项目数据是横向汇入的那一支——本文件是那一支。
 *        三个视图对应三种周期长度下该问的问题，这个分工本身就是复盘方法论：
 *        周看「哪些项目在动」（周期短，动作即信号），
 *        月与季看「完成了哪些」（周期长，新建只说明起了念头，完成才说明真推进了），
 *        年看格局（四态分布与月度节奏，事件被折叠成计数）。
 *        「完成」的判定一律以 MOC 的 archived 为准——那是状态流转命令与 status 同一次写入落的
 *        确定事实；回落 updated 只为兼容 V2 之前建的项目。
 *        三个视图认的容器是 CONTAINER_TYPES（project 与 book）而不只是 project：
 *        一本书就是一个项目，它同样住项目目录、同样经「完成项目」归档，
 *        只认 project 会让读书这件事在整套复盘里彻底隐身，还会让「项目动态」
 *        把每一本在读的书当成没有 MOC 的孤儿点名报警
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TFile } from 'obsidian';
import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import { CONTAINER_TYPES, FIELDS, FOLDERS } from '../../core/constants';
import { isInFolder, normalizeFolderPath } from '../../core/folders';
import { noteLink, renderEmpty, renderHeading, renderNote, renderSummary, renderTable } from '../../core/table';
import type { Cell } from '../../core/table';
import { dayOfMillis, dayText, daysBetween, today } from '../../core/time';
import { toText } from '../../core/vaultIndex';
import { resolveScope } from './periodic';

/** 一张表最多列多少行 */
const MAX_ROWS = 10;

/** 周期的中文说法，用于文案里的「本周/本月/本季/本年」 */
const PERIOD_NAMES: Readonly<Record<string, string>> = {
    daily: '今天',
    weekly: '本周',
    monthly: '本月',
    quarterly: '本季',
    yearly: '本年',
};

/** 年度全景里三个终态的分组标题 */
const CLOSED_TITLES: readonly { status: string; title: string }[] = [
    { status: 'done', title: '✅ 本年完成' },
    { status: 'dropped', title: '❌ 本年放弃' },
    { status: 'paused', title: '⏸ 本年暂停' },
];

/** 项目的一次「归档」在数据上长什么样 */
interface ClosedProject {
    readonly file: TFile;
    readonly born: string | null;
    readonly closed: string | null;
    readonly status: string;
}

// ============================================================
// 项目动态（周）
// ============================================================

/** 一个项目目录在本周期内的动静 */
interface ActivityEntry {
    name: string;
    moc: TFile | null;
    status: string;
    born: number;
    touched: number;
    last: string;
}

/**
 * 本周期哪些项目在动。
 * 只扫进行中的项目目录：归档的项目属于「完成的项目」那张表，
 * 让它们挤进本周前排，会把「我这周推进了什么」变成「我这周碰过什么」。
 * 正在读的书也住在这个目录里，因此也会出现在这张表上——一本书就是一个项目，
 * 它这周有没有动（新划线、新卡片）与别的项目是同一个问题。
 */
const projectActivity: ViewDefinition = {
    name: '项目动态',
    render: async (view: ViewContext): Promise<void> => {
        const scope = resolveScope(view.ctx.app, view.host, view.params);

        if (!scope) {
            renderEmpty(view.el, '这篇笔记算不出周期坐标。用「打开本周复盘」建的笔记，本区块自动生效。');

            return;
        }

        const periodName = PERIOD_NAMES[scope.period.key] ?? '本周期';
        const root = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
        const entries = new Map<string, ActivityEntry>();
        const within = (day: string | null): boolean =>
            !!day && day >= scope.start && day < scope.end;

        for (const file of view.index.allNotes()) {
            const folder = file.parent?.path ?? '';

            if (!isInFolder(folder, root) || folder === root) continue;

            const name = folder.slice(root.length + 1).split('/')[0];
            const entry = entries.get(name) ?? {
                name,
                moc: null,
                status: '',
                born: 0,
                touched: 0,
                last: '',
            };

            // 项目与书都是住在这个目录里的容器，两种 MOC 都算数。
            // 只认 project 的话，学员每读一本书，这张表就会把那本书的文件夹当成
            // 「有改动却没有 MOC 的孤儿」点名报警——而他根本看不懂那是在说什么
            if (CONTAINER_TYPES.includes(toText(view.index.fieldOf(file, FIELDS.type)))) {
                entry.moc = file;
                entry.status = toText(view.index.fieldOf(file, FIELDS.status));
            }

            const created = dayText(view.index.fieldOf(file, FIELDS.created)) ?? dayOfMillis(file.stat.ctime);
            const updated = dayText(view.index.fieldOf(file, FIELDS.updated)) ?? dayOfMillis(file.stat.mtime);

            if (within(created)) {
                entry.born += 1;

                if (created > entry.last) entry.last = created;
            } else if (within(updated)) {
                entry.touched += 1;

                if (updated > entry.last) entry.last = updated;
            }

            entries.set(name, entry);
        }

        const moving = [...entries.values()].filter((entry) => entry.born + entry.touched > 0);
        // 口径与「完成的项目」一致：必须有同名的 type: project 笔记才算一个项目
        const orphans = moving.filter((entry) => !entry.moc);
        const counted = moving
            .filter((entry) => entry.moc)
            .sort((left, right) => right.born + right.touched - (left.born + left.touched));

        if (!counted.length) {
            renderEmpty(view.el, `${periodName}没有项目产生新增或改动。`);
            warnOrphans(view, orphans);

            return;
        }

        const totalBorn = counted.reduce((sum, entry) => sum + entry.born, 0);
        const totalTouched = counted.reduce((sum, entry) => sum + entry.touched, 0);

        renderSummary(
            view.el,
            `${periodName} **${counted.length}** 个项目在动，共新增 **${totalBorn}** 篇、改动 **${totalTouched}** 篇。`,
        );

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['项目', '状态', '新增', '改动', '最近'],
            counted.slice(0, MAX_ROWS).map((entry): Cell[] => [
                entry.moc ? noteLink(entry.moc, entry.name) : entry.name,
                entry.status || '—',
                entry.born,
                entry.touched,
                entry.last || '—',
            ]),
        );

        if (counted.length > MAX_ROWS) {
            renderNote(view.el, `…另有 ${counted.length - MAX_ROWS} 个项目${periodName}也有动静`);
        }

        warnOrphans(view, orphans);
    },
};

/** 有改动却没有同名 MOC 的文件夹要显式点名：不点名它们就是一批静默漏掉的数据 */
function warnOrphans(view: ViewContext, orphans: readonly ActivityEntry[]): void {
    if (!orphans.length) return;

    renderNote(
        view.el,
        `⚠️ 另有 ${orphans.length} 个文件夹有改动但缺少同名的 MOC（type 为 project 或 book），未计入：${orphans
            .map((entry) => entry.name)
            .join('、')}`,
    );
}

// ============================================================
// 完成的项目（月 / 季）
// ============================================================

/**
 * 本周期完成并归档了哪些项目。
 * 历时是白送的：开始与完成两个时间戳一减就有，不需要任何额外记录。
 */
const finishedProjects: ViewDefinition = {
    name: '完成的项目',
    render: async (view: ViewContext): Promise<void> => {
        const scope = resolveScope(view.ctx.app, view.host, view.params);

        if (!scope) {
            renderEmpty(view.el, '这篇笔记算不出周期坐标。用「打开本月复盘」建的笔记，本区块自动生效。');

            return;
        }

        const periodName = PERIOD_NAMES[scope.period.key] ?? '本周期';
        const finished = collectProjects(view)
            .filter((project) => project.status === 'done')
            .filter((project) => !!project.closed && project.closed >= scope.start && project.closed < scope.end)
            .sort((left, right) => String(left.closed).localeCompare(String(right.closed)));

        if (!finished.length) {
            renderEmpty(
                view.el,
                `${periodName}没有项目完成归档。（口径：status 为 done，且归档日落在${periodName}）`,
            );

            return;
        }

        const spans = finished
            .map((project) => daysBetween(project.born, project.closed))
            .filter((days): days is number => days !== null);
        const average = spans.length
            ? `，平均历时 **${Math.round(spans.reduce((sum, days) => sum + days, 0) / spans.length)}** 天`
            : '';

        renderSummary(view.el, `${periodName}完成 **${finished.length}** 个项目${average}：`);
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['项目', '开始', '完成', '历时'],
            finished.map((project) => durationRow(project, project.closed)),
        );
    },
};

// ============================================================
// 年度全景
// ============================================================

/**
 * 一年的格局：四态计数、十二个月的新开与完成节奏、按状态分组的清单。
 * 年度看的是分布而非事件，所以项目在这里被折叠成计数与柱子。
 */
const yearlyOverview: ViewDefinition = {
    name: '年度全景',
    render: async (view: ViewContext): Promise<void> => {
        const scope = resolveScope(view.ctx.app, view.host, view.params);

        if (!scope) {
            renderEmpty(view.el, '这篇笔记算不出周期坐标。用「打开本年复盘」建的笔记，本区块自动生效。');

            return;
        }

        const within = (day: string | null): boolean => !!day && day >= scope.start && day < scope.end;
        const monthIndex = (day: string): number => Number(day.slice(5, 7)) - 1;
        const year = scope.start.slice(0, 4);

        const born: ClosedProject[] = [];
        const buckets = new Map<string, ClosedProject[]>();
        const monthlyBorn = new Array<number>(12).fill(0);
        const monthlyDone = new Array<number>(12).fill(0);

        for (const project of collectProjects(view)) {
            if (within(project.born)) {
                born.push(project);
                monthlyBorn[monthIndex(project.born as string)] += 1;
            }

            if (project.status !== 'active' && within(project.closed)) {
                const bucket = buckets.get(project.status);

                if (bucket) bucket.push(project);
                else buckets.set(project.status, [project]);

                if (project.status === 'done') monthlyDone[monthIndex(project.closed as string)] += 1;
            }

            // 进行中的项目必须在该年结束前就已存在，否则往年年记会列出当年还不存在的项目
            if (project.status === 'active' && (!project.born || project.born < scope.end)) {
                const bucket = buckets.get('active');

                if (bucket) bucket.push(project);
                else buckets.set('active', [project]);
            }
        }

        const countOf = (status: string): number => buckets.get(status)?.length ?? 0;

        renderSummary(
            view.el,
            `**${year} 年**：新开 **${born.length}** 个 · 完成 **${countOf('done')}** 个 · ` +
                `放弃 **${countOf('dropped')}** 个 · 暂停 **${countOf('paused')}** 个 · ` +
                `仍在进行 **${countOf('active')}** 个`,
        );

        renderMonthlyBars(view, monthlyBorn, monthlyDone);

        for (const { status, title } of CLOSED_TITLES) {
            renderClosedGroup(view, title, buckets.get(status) ?? []);
        }

        renderActiveGroup(view, buckets.get('active') ?? [], scope.end, year);

        if (!born.length && !buckets.size) {
            renderEmpty(view.el, '本年没有任何项目记录。');
        }
    },
};

/** 十二根双柱：左柱新开，右柱完成。纯 DOM，不引入任何图表库 */
function renderMonthlyBars(
    view: ViewContext,
    monthlyBorn: readonly number[],
    monthlyDone: readonly number[],
): void {
    const peak = Math.max(...monthlyBorn, ...monthlyDone, 1);
    const chart = view.el.createDiv();

    chart.style.cssText =
        'display:flex;align-items:flex-end;gap:4px;height:150px;margin:14px 0 6px;' +
        'padding-bottom:24px;border-bottom:1px solid var(--background-modifier-border)';

    for (let month = 0; month < 12; month += 1) {
        const column = chart.createDiv();

        column.style.cssText =
            'flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;' +
            'align-items:center;position:relative';

        const pair = column.createDiv();

        pair.style.cssText =
            'display:flex;align-items:flex-end;gap:2px;height:100%;width:100%;justify-content:center';

        addBar(pair, monthlyBorn[month], peak, 'var(--text-accent)', `${month + 1} 月新开`);
        addBar(pair, monthlyDone[month], peak, 'var(--color-green, #16a34a)', `${month + 1} 月完成`);

        const label = column.createDiv();

        label.style.cssText = 'position:absolute;bottom:-21px;font-size:11px;color:var(--text-muted)';
        label.setText(String(month + 1));
    }

    renderNote(view.el, `左柱＝新开　右柱＝完成　纵轴峰值 ${peak}　横轴为月份`);
}

/** 画一根柱子；计数为 0 时不给最小高度，空月份就该看起来是空的 */
function addBar(parent: HTMLElement, count: number, peak: number, color: string, label: string): void {
    const bar = parent.createDiv();

    bar.style.cssText =
        `width:42%;height:${Math.round((count / peak) * 100)}%;` +
        `min-height:${count > 0 ? 3 : 0}px;background:${color};border-radius:2px 2px 0 0`;

    if (count > 0) bar.setAttribute('aria-label', `${label}：${count}`);
}

/** 终态分组：看历时 */
function renderClosedGroup(view: ViewContext, title: string, list: readonly ClosedProject[]): void {
    if (!list.length) return;

    const sorted = [...list].sort((left, right) =>
        String(left.closed).localeCompare(String(right.closed)),
    );

    renderHeading(view.el, 4, `${title}（${list.length}）`);
    renderTable(
        view.ctx.app,
        view.el,
        view.sourcePath,
        ['项目', '开始', '归档', '历时'],
        sorted.map((project) => durationRow(project, project.closed)),
    );
}

/**
 * 进行中分组：看已经进行了多久。
 * 往年的年记必须换个说法——status 只有当前值，无法回溯到那一年的年末，
 * 假装它是那一年的快照，就是拿今天的事实冒充历史。
 */
function renderActiveGroup(
    view: ViewContext,
    list: readonly ClosedProject[],
    end: string,
    year: string,
): void {
    if (!list.length) return;

    const cutoff = today();
    const isPastYear = end <= cutoff;
    const sorted = [...list].sort((left, right) =>
        String(left.born).localeCompare(String(right.born)),
    );

    renderHeading(view.el, 4, `🔥 截至今日仍在进行（${list.length}）`);

    if (isPastYear) {
        renderNote(
            view.el,
            `项目状态只有当前值，无法回溯到 ${year} 年末，此处显示的是此刻仍在进行的项目。`,
        );
    }

    renderTable(
        view.ctx.app,
        view.el,
        view.sourcePath,
        ['项目', '开始', '最近改动', '已进行'],
        sorted.map((project): Cell[] => [
            noteLink(project.file),
            project.born ?? '—',
            project.closed ?? '—',
            formatDays(daysBetween(project.born, cutoff)),
        ]),
    );
}

// ============================================================
// 共用
// ============================================================

/**
 * 全部容器 MOC（项目与书），连同它们的诞生日与归档日。
 * 两个根目录都要扫：完成的项目已经被状态流转命令整个文件夹搬进了归档目录。
 *
 * 书一并收进来，因为读完一本书与做完一个项目在复盘里是同一件事——
 * 它同样有起点、有终点、有历时，同样经「完成项目」落下 archived。
 * 不收的话，学员今年读完的十二本书在月记、季记、年记里一本都看不见，
 * 而他明明在这套系统里读的它们。表格里那一行写着《书名》，是书是项目一眼可辨。
 */
function collectProjects(view: ViewContext): ClosedProject[] {
    const projectRoot = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
    const archiveRoot = normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives);
    const collected: ClosedProject[] = [];
    // 逐个 type 取而不是 flatMap 拼：目标是 ES2018，那个方法要 ES2019 才有
    const containers: TFile[] = [];

    for (const type of CONTAINER_TYPES) {
        for (const file of view.index.notesOfType(type)) containers.push(file);
    }

    for (const file of containers) {
        if (!isInFolder(file.path, projectRoot) && !isInFolder(file.path, archiveRoot)) continue;

        collected.push({
            file,
            born: dayText(view.index.fieldOf(file, FIELDS.created)) ?? dayOfMillis(file.stat.ctime),
            // 归档日优先取状态流转命令写入的 archived；回落 updated 只为兼容 V2 之前建的项目
            closed:
                dayText(view.index.fieldOf(file, FIELDS.archived)) ??
                dayText(view.index.fieldOf(file, FIELDS.updated)) ??
                dayOfMillis(file.stat.mtime),
            status: toText(view.index.fieldOf(file, FIELDS.status)).toLowerCase(),
        });
    }

    return collected;
}

/** 「项目 / 开始 / 结束 / 历时」四列，三张表共用 */
function durationRow(project: ClosedProject, endDay: string | null): Cell[] {
    return [
        noteLink(project.file),
        project.born ?? '—',
        endDay ?? '—',
        formatDays(daysBetween(project.born, endDay)),
    ];
}

/** 算不出天数就说算不出，不写 0 天 */
function formatDays(days: number | null): string {
    return days === null ? '—' : `${days} 天`;
}

/** 复盘的项目数据三视图 */
export const reviewProjectViews: readonly ViewDefinition[] = [
    projectActivity,
    finishedProjects,
    yearlyOverview,
];
