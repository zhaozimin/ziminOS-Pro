/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile 类型；依赖 core/codeblock 的 ViewContext/ViewDefinition，
 *          core/constants 的 FIELDS/NOTE_TYPES，core/markdown 的 toggleTaskLine，
 *          core/table 的渲染原语与 TaskLine 类型，core/time 的 dayOfTitle/dayText/dayOfMillis，
 *          core/vaultIndex 的 extractLinks/toText；依赖 ./ledger 的 collectLedger/mentions/isLedgerLine
 * [OUTPUT]: 对外提供 personViews（相关项目、人情账本、关键事件、待办四个视图定义）
 * [POS]: 长在人物档案上的四个视图，人脉与客户档案共用同一套——两类档案守同一条法：
 *        稳定事实进 frontmatter，发生的事写进当天日记，档案自动检索。
 *        四个视图的分工是一条时间线：相关项目答「我们现在手上有什么」，
 *        关键事件答「我们之间发生过什么」，待办答「我还欠他什么」，人情账本答「谁欠谁」。
 *        项目一旦终结就从「相关项目」移进「关键事件」——它不再是手上的活，
 *        而是这段关系上发生过的一件事，带着确定的日期。
 *        「关键事件」刻意排除档案之间的互链：两份档案互相提到对方是常事，
 *        算成事件会在两个人的时间线上凭空多出一条谁也没做过的记录。
 *        待办勾选核对原行快照与勾选状态，漂移或写入失败用 Notice 交代；
 *        勾掉一条待办是用户在改那篇日记，所以不登记自写——那篇日记的 updated 照记
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import { FIELDS, NOTE_TYPES } from '../../core/constants';
import { toggleTaskLine } from '../../core/markdown';
import {
    noteLink,
    renderEmpty,
    renderNote,
    renderSummary,
    renderTable,
    renderTaskList,
    richText,
} from '../../core/table';
import type { Cell, TaskLine } from '../../core/table';
import { dayOfMillis, dayOfTitle, dayText } from '../../core/time';
import { extractLinks, toText } from '../../core/vaultIndex';
import { collectLedger, isLedgerLine, mentions } from './ledger';

/** 一张表最多列多少行 */
const MAX_ROWS = 20;

/** 项目的终态：走到这两个状态，它就不再是「手上的活」，而是时间线上的一件事 */
const TERMINAL_STATUS: Readonly<Record<string, string>> = {
    done: '完成',
    dropped: '放弃',
};

/** 这个人与某个项目的关系 */
interface Relation {
    readonly project: TFile;
    readonly relation: string;
    readonly status: string;
}

// ============================================================
// 相关项目
// ============================================================

/**
 * 手上还在推进的项目——他委托的，以及和他一起做的。
 *
 * 两个键分工严格：client 是商业契约标记，写下它等于宣告「我欠这个人一个交付」，
 * 客户名录直接用它反推身份；with 只是同行，没有交付债务。
 * 同一项目两个键都指向他时按委托计——债务重的那一层优先。
 */
const relatedProjects: ViewDefinition = {
    name: '相关项目',
    render: async (view: ViewContext): Promise<void> => {
        if (!view.host) {
            renderEmpty(view.el, '这个视图要长在人物档案上才有内容。');

            return;
        }

        const living = relationsOf(view, view.host).filter(
            (item) => !TERMINAL_STATUS[item.status],
        );

        if (!living.length) {
            renderEmpty(
                view.el,
                `手上没有和他相关的项目。在项目 MOC 的属性里写 \`${FIELDS.client}: "[[${view.host.basename}]]"\`（他委托的）或 \`${FIELDS.with}\`（一起做的）。已经结束的项目会出现在下面的「关键事件」里。`,
            );

            return;
        }

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['项目', '关系', '概述'],
            living.map((item): Cell[] => [
                noteLink(item.project),
                item.relation,
                toText(view.index.fieldOf(item.project, FIELDS.description)) || '—',
            ]),
            2,
        );
    },
};

/** 这个人名下的全部项目，连同关系与状态 */
function relationsOf(view: ViewContext, person: TFile): Relation[] {
    const found: Relation[] = [];

    for (const project of view.index.notesOfType(NOTE_TYPES.project)) {
        const relation = fieldPointsTo(view, project, FIELDS.client, person)
            ? '委托'
            : fieldPointsTo(view, project, FIELDS.with, person)
              ? '同行'
              : null;

        if (!relation) continue;

        found.push({
            project,
            relation,
            status: toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase(),
        });
    }

    return found;
}

/** 某个 frontmatter 字段里的链接是否指向这个人 */
function fieldPointsTo(view: ViewContext, note: TFile, field: string, target: TFile): boolean {
    const raw = view.index.fieldOf(note, field);
    const values = Array.isArray(raw) ? raw : [raw];

    for (const value of values) {
        for (const link of extractLinks(String(value ?? ''))) {
            if (view.index.resolve(link, note.path)?.path === target.path) return true;
        }
    }

    return false;
}

// ============================================================
// 人情账本
// ============================================================

/** 这个人名下的全部账本行，按日期倒序 */
const personLedger: ViewDefinition = {
    name: '人情账本',
    render: async (view: ViewContext): Promise<void> => {
        const host = view.host;

        if (!host) {
            renderEmpty(view.el, '这个视图要长在人物档案上才有内容。');

            return;
        }

        const entries = await collectLedger(view, (owner) => owner.path === host.path);

        if (!entries.length) {
            renderEmpty(
                view.el,
                `还没有账。命令面板运行「记人情」，或在当天日记里写一行：\`- [[${host.basename}]]｜去｜事项｜两清\``,
            );

            return;
        }

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['日期', '去/来', '事项', '状态'],
            entries.map((entry): Cell[] => [
                noteLink(entry.diary, entry.day),
                entry.kind,
                richText(entry.item, entry.diary.path),
                entry.legal ? entry.status : `⚠️ ${entry.status}`,
            ]),
            2,
        );
    },
};

// ============================================================
// 关键事件
// ============================================================

/** 时间线上的一条记录：可能来自日记原文，也可能是一个项目的终结 */
interface EventRow {
    readonly day: string;
    readonly source: TFile;
    readonly text: string;
    readonly link: TFile | null;
}

/** 日记里提到他的普通行，加上一起做完（或放弃）的项目 */
const keyEvents: ViewDefinition = {
    name: '关键事件',
    render: async (view: ViewContext): Promise<void> => {
        const host = view.host;

        if (!host) {
            renderEmpty(view.el, '这个视图要长在人物档案上才有内容。');

            return;
        }

        const events: EventRow[] = [];

        for (const source of mentionSources(view, host)) {
            for (const line of await view.index.listLinesOf(source.file)) {
                if (line.isTask || isLedgerLine(line)) continue;
                if (!mentions(view, line, source.file.path, host)) continue;

                events.push({ day: source.day, source: source.file, text: line.text, link: null });
            }
        }

        // 项目走到终态就从「手上的活」变成「发生过的事」，带着 archived 给的确定日期
        for (const item of relationsOf(view, host)) {
            const label = TERMINAL_STATUS[item.status];

            if (!label) continue;

            const day =
                dayText(view.index.fieldOf(item.project, FIELDS.archived)) ??
                dayOfMillis(item.project.stat.mtime);

            events.push({
                day,
                source: item.project,
                text: `${label}了${item.relation === '委托' ? '他委托的' : '一起做的'}项目`,
                link: item.project,
            });
        }

        if (!events.length) {
            renderEmpty(
                view.el,
                `还没有和他有关的事。在当天日记里写一行提到 \`[[${host.basename}]]\`，这里就会长出来。`,
            );

            return;
        }

        events.sort((left, right) => right.day.localeCompare(left.day));

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['日期', '发生了什么'],
            events.slice(0, MAX_ROWS).map((event): Cell[] => [
                noteLink(event.source, event.day),
                event.link
                    ? richText(`${event.text}《[[${event.link.basename}]]》`, view.sourcePath)
                    : richText(event.text, event.source.path),
            ]),
            1,
        );

        if (events.length > MAX_ROWS) {
            renderNote(view.el, `…另有 ${events.length - MAX_ROWS} 条更早的记录`);
        }
    },
};

// ============================================================
// 待办
// ============================================================

/** 日记里跟他有关、还没勾掉的任务行；可以直接在这里勾 */
const openTasks: ViewDefinition = {
    name: '待办',
    render: async (view: ViewContext): Promise<void> => {
        const host = view.host;

        if (!host) {
            renderEmpty(view.el, '这个视图要长在人物档案上才有内容。');

            return;
        }

        const open: TaskLine[] = [];
        let done = 0;

        for (const source of mentionSources(view, host)) {
            for (const line of await view.index.listLinesOf(source.file)) {
                if (!line.isTask) continue;
                if (!mentions(view, line, source.file.path, host)) continue;

                if (line.checked) done += 1;
                else {
                    open.push({
                        file: source.file,
                        day: source.day,
                        text: line.text,
                        line: line.line,
                        rawLine: line.rawLine,
                        checked: false,
                    });
                }
            }
        }

        if (!open.length) {
            renderEmpty(
                view.el,
                done
                    ? `跟他有关的事都办完了（已完成 ${done} 件）。`
                    : `没有待办。需要跟进的共识写成任务行：\`- [ ] 出方案给 [[${host.basename}]]\``,
            );

            return;
        }

        renderSummary(view.el, `还欠 **${open.length}** 件事${done ? `（已完成 ${done} 件）` : ''}`);
        renderTaskList(view.ctx.app, view.el, view.sourcePath, open, (task) => {
            void toggleTask(view, task);
        });
    },
};

/**
 * 把一条待办勾掉，写回它所在的那一行。
 * 行内容对不上就什么都不做——视图渲染之后用户可能改过那篇日记，行号会漂，勾错一条别人的待办比没勾上难发现得多。
 * 这一笔不登记自写：勾的是用户，改的是他的日记，updated 应当照记（守卫只登记机器的反应，见 core/guard）。
 */
async function toggleTask(view: ViewContext, task: TaskLine): Promise<void> {
    let stale = false;

    try {
        await view.ctx.app.vault.process(task.file, (content) => {
            const changed = toggleTaskLine(content, task.line, task.checked, task.rawLine);

            if (changed === null) {
                stale = true;
                return content;
            }
            if (changed === content) return content;

            return changed;
        });

        if (stale) new Notice('待办原文已经变化，请等列表刷新后再勾选。');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`待办更新失败：${message}`);
    }
}

// ============================================================
// 共用
// ============================================================

/**
 * 可能提到这个人的日记，按日期倒序。
 *
 * 只走反链而不扫全库：链到他的笔记通常只有几十篇。
 * 同时排除另一份档案——两份档案互相提到对方是常事（「张三把李四介绍给我」会写进日记，
 * 但档案正文里的互相引用不是一次事件），把它算进去等于凭空造出一条记录。
 */
function mentionSources(view: ViewContext, host: TFile): { file: TFile; day: string }[] {
    const sources: { file: TFile; day: string }[] = [];

    for (const file of view.index.backlinksOf(host)) {
        const day = dayOfTitle(file.basename);

        if (!day) continue;

        const type = toText(view.index.fieldOf(file, FIELDS.type));

        if (type === NOTE_TYPES.person || type === NOTE_TYPES.client) continue;

        sources.push({ file, day });
    }

    return sources.sort((left, right) => right.day.localeCompare(left.day));
}

/** 长在人物档案上的四个视图 */
export const personViews: readonly ViewDefinition[] = [
    relatedProjects,
    personLedger,
    keyEvents,
    openTasks,
];
