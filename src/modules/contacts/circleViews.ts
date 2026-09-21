/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型；依赖 core/codeblock 的 ViewContext/ViewDefinition，
 *          core/constants 的 FIELDS/NOTE_TYPES/CONTACT_TIERS/TIER_LIMITS/TIER_FALLBACK_LIMIT/LEDGER，
 *          core/table 的渲染原语，core/time 的 today/dayText/daysBetween，
 *          core/vaultIndex 的 toText/toStringList/toBoolean/extractLinks；
 *          依赖 ./identity 的 archiveFolderOf/isLivePath/lastContactDayOf、./ledger 的 collectLedger
 * [OUTPUT]: 对外提供 circleViews（人脉名录、投喂名单、本月生日、人情余额四个视图定义）
 * [POS]: 长在人脉 MOC 上的四个视图，回答的是经营视角的四件事：
 *        认识谁、谁在变冷、该给谁送东西、谁还欠着谁。
 *        名录按 up 归属链接分组而非按分类枚举分组，这是整套人脉系统的地基——
 *        卡片不带分类，想新分一个圈子只需建一张圈子 MOC 并把那批人的 up 指过去，
 *        名录自动多一组；换工作时整组重估靠的就是它。
 *        「最近联系」是从日记反链算出来的，不用手填，因此不会有「更新了名单却忘了改日期」
 *        这种谎；⚠️ 是超出该层联系节奏的信号，对客户而言它就是流失预警
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TFile } from 'obsidian';
import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import {
    CONTACT_TIERS,
    FIELDS,
    LEDGER,
    NOTE_TYPES,
    TIER_FALLBACK_LIMIT,
    TIER_LIMITS,
} from '../../core/constants';
import { noteLink, renderEmpty, renderHeading, renderNote, renderSummary, renderTable } from '../../core/table';
import type { Cell } from '../../core/table';
import { dayText, daysBetween, today } from '../../core/time';
import { extractLinks, toBoolean, toStringList, toText } from '../../core/vaultIndex';
import { archiveFolderOf, isLivePath, lastContactDayOf } from './identity';
import { collectLedger } from './ledger';

/** 没写 up 的人归到这一组，垫在名录最后 */
const UNGROUPED = '未归圈';

/** 名录里一个人的全部计算结果 */
interface RosterRow {
    readonly file: TFile;
    readonly tier: string;
    readonly tierRank: number;
    readonly days: number | null;
    readonly overdue: boolean;
}

// ============================================================
// 人脉名录
// ============================================================

const roster: ViewDefinition = {
    name: '人脉名录',
    render: async (view: ViewContext): Promise<void> => {
        const people = livePeople(view);

        if (!people.length) {
            renderEmpty(view.el, '还没有档案。命令面板运行「新建人脉」建第一个。');

            return;
        }

        const circles = new Map<string, RosterRow[]>();
        let stale = 0;

        for (const person of people) {
            const row = rosterRowOf(view, person);

            if (row.overdue) stale += 1;

            const circle = circleOf(view, person);
            const bucket = circles.get(circle);

            if (bucket) bucket.push(row);
            else circles.set(circle, [row]);
        }

        renderSummary(
            view.el,
            stale
                ? `共 ${people.length} 人，其中 **${stale} 人**已超出该层的联系节奏。`
                : `共 ${people.length} 人，都在联系半径内。`,
        );

        // 圈子按人数降序，未归圈垫底——那一组是待办事项，不是一个真的圈子
        const ordered = [...circles.entries()].sort((left, right) => {
            if (left[0] === UNGROUPED) return 1;
            if (right[0] === UNGROUPED) return -1;

            return right[1].length - left[1].length;
        });

        for (const [circle, rows] of ordered) {
            renderHeading(view.el, 3, `${circle}（${rows.length}）`);

            if (circle === UNGROUPED) {
                renderNote(view.el, `这些档案的 \`${FIELDS.up}\` 没指向任何圈子 MOC，补上就会归入对应的组。`);
            }

            // 先按层，层内最久没联系的排前面——最该被找的人排在最容易看见的位置
            rows.sort((left, right) => left.tierRank - right.tierRank || staleness(right) - staleness(left));

            renderTable(
                view.ctx.app,
                view.el,
                view.sourcePath,
                ['谁', '一句话', '层', '方向', '他能给我的', '最近联系'],
                rows.map((row): Cell[] => [
                    noteLink(row.file),
                    toText(view.index.fieldOf(row.file, FIELDS.description)),
                    row.tier || '—',
                    toText(view.index.fieldOf(row.file, FIELDS.direction)) || '—',
                    toStringList(view.index.fieldOf(row.file, FIELDS.get)).join('、') || '—',
                    lastContactText(row),
                ]),
                1,
            );
        }
    },
};

/** 算一个人的联系状态 */
function rosterRowOf(view: ViewContext, person: TFile): RosterRow {
    const tier = toText(view.index.fieldOf(person, FIELDS.tier));
    const last = lastContactDayOf(view, person);
    const days = last ? daysBetween(last, today()) : null;
    const limit = TIER_LIMITS[tier] ?? TIER_FALLBACK_LIMIT;

    return {
        file: person,
        tier,
        // 层没写或写了未知值的排在所有已知层之后，但不算错——只是还没定节奏
        tierRank: CONTACT_TIERS.indexOf(tier as (typeof CONTACT_TIERS)[number]) < 0
            ? CONTACT_TIERS.length
            : CONTACT_TIERS.indexOf(tier as (typeof CONTACT_TIERS)[number]),
        days,
        overdue: days === null || days > limit,
    };
}

/** 排序用的「有多久没联系」：从未联系过排在最前，它比任何超期都紧急 */
function staleness(row: RosterRow): number {
    return row.days ?? Number.MAX_SAFE_INTEGER;
}

/** 最近联系那一格的文字；超期的带 ⚠️，那是该主动找他的信号 */
function lastContactText(row: RosterRow): string {
    if (row.days === null) return '⚠️ 从未';

    const text = row.days === 0 ? '今天' : `${row.days} 天前`;

    return row.overdue ? `⚠️ ${text}` : text;
}

/** 他归哪个圈子：up 指向的那张 MOC 的名字 */
function circleOf(view: ViewContext, person: TFile): string {
    for (const link of extractLinks(String(view.index.fieldOf(person, FIELDS.up) ?? ''))) {
        // 圈子 MOC 还没建出来也照样分组：名字本身就够当组名，不必等文件存在
        return view.index.resolve(link, person.path)?.basename ?? link.split('/').pop() ?? UNGROUPED;
    }

    return UNGROUPED;
}

// ============================================================
// 投喂名单
// ============================================================

/** 愿意持续在他身上花钱花心思的那些人，连同寄件信息 */
const giftList: ViewDefinition = {
    name: '投喂名单',
    render: async (view: ViewContext): Promise<void> => {
        const rows: Cell[][] = [];

        for (const person of livePeople(view)) {
            if (!toBoolean(view.index.fieldOf(person, FIELDS.gift))) continue;

            const address = toText(view.index.fieldOf(person, FIELDS.address));

            rows.push([
                noteLink(person),
                toText(view.index.fieldOf(person, FIELDS.description)),
                address || '⚠️ 还没填寄件信息',
            ]);
        }

        if (!rows.length) {
            renderEmpty(
                view.el,
                `名单是空的。打开某人的档案，属性里把 \`${FIELDS.gift}\` 写成 true、\`${FIELDS.address}\` 填上整串寄件信息，他就会出现在这里。`,
            );

            return;
        }

        renderTable(view.ctx.app, view.el, view.sourcePath, ['谁', '一句话', '寄件信息'], rows, 2);
    },
};

// ============================================================
// 本月生日
// ============================================================

/** 这个月过生日的人，按日子排 */
const birthdays: ViewDefinition = {
    name: '本月生日',
    render: async (view: ViewContext): Promise<void> => {
        const now = today();
        const month = now.slice(5, 7);
        const upcoming: { file: TFile; date: string; days: number | null }[] = [];

        for (const person of livePeople(view)) {
            const birthday = dayText(view.index.fieldOf(person, FIELDS.birthday));

            if (!birthday || birthday.slice(5, 7) !== month) continue;

            const thisYear = `${now.slice(0, 4)}-${birthday.slice(5)}`;

            upcoming.push({ file: person, date: birthday.slice(5), days: daysBetween(now, thisYear) });
        }

        if (!upcoming.length) {
            renderEmpty(view.el, `这个月没有人过生日。在档案属性里填 \`${FIELDS.birthday}\`，到月份了会自动出现。`);

            return;
        }

        upcoming.sort((left, right) => left.date.localeCompare(right.date));

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['谁', '生日', '还有几天'],
            upcoming.map((entry): Cell[] => [noteLink(entry.file), entry.date, countdownOf(entry.days)]),
        );
    },
};

/** 生日倒计时的说法；已经过去的照样列出来，补一句总比忘了强 */
function countdownOf(days: number | null): string {
    if (days === null) return '—';
    if (days === 0) return '🎂 就是今天';

    return days > 0 ? `还有 ${days} 天` : `已过 ${-days} 天`;
}

// ============================================================
// 人情余额
// ============================================================

/** 一个人的未两清余额 */
interface Balance {
    readonly person: TFile;
    owed: number;
    owing: number;
    last: string;
}

/** 谁还欠着谁，一人一行 */
const balance: ViewDefinition = {
    name: '人情余额',
    render: async (view: ViewContext): Promise<void> => {
        const archive = archiveFolderOf(view.ctx);
        const entries = await collectLedger(view, (owner) => isLivePath(archive, owner.path));
        const balances = new Map<string, Balance>();

        for (const entry of entries) {
            if (entry.status === LEDGER.defaultStatus) continue;

            const current = balances.get(entry.person.path) ?? {
                person: entry.person,
                owed: 0,
                owing: 0,
                last: entry.day,
            };

            if (entry.status === '我欠') current.owing += 1;
            else if (entry.status === '他欠') current.owed += 1;

            if (entry.day > current.last) current.last = entry.day;

            balances.set(entry.person.path, current);
        }

        if (!balances.size) {
            renderEmpty(view.el, '没有未两清的人情。命令面板运行「礼尚往来」记下一笔。');

            return;
        }

        const rows = [...balances.values()].sort(
            (left, right) => right.owing + right.owed - (left.owing + left.owed),
        );

        renderSummary(view.el, `**${rows.length}** 个人还有没两清的账。`);
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['谁', '我欠他', '他欠我', '最近一笔'],
            rows.map((row): Cell[] => [
                noteLink(row.person),
                row.owing || '—',
                row.owed || '—',
                row.last,
            ]),
        );
    },
};

// ============================================================
// 共用
// ============================================================

/** 还在经营范围内的人脉档案：靠 type 认身份，归档目录内的不算 */
function livePeople(view: ViewContext): TFile[] {
    const archive = archiveFolderOf(view.ctx);

    return view.index
        .notesOfType(NOTE_TYPES.person)
        .filter((file) => isLivePath(archive, file.path));
}

/** 长在人脉 MOC 上的四个视图 */
export const circleViews: readonly ViewDefinition[] = [roster, giftList, birthdays, balance];
