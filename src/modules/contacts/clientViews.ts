/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型；依赖 core/codeblock 的 ViewContext/ViewDefinition，
 *          core/constants 的 FIELDS/NOTE_TYPES/PAYMENT_FIELDS，core/table 的渲染原语，
 *          core/time 的 dayText/dayOfMillis/daysBetween/today，core/vaultIndex 的 extractLinks/toStringList/toText；
 *          依赖 ./identity 的 archiveFolderOf/isLivePath/lastContactDayOf
 * [OUTPUT]: 对外提供 clientViews（客户 MOC 六视图 + 客户档案的付费与交付 + 项目 MOC 的项目收款）
 * [POS]: 客户与付费这条线的全部读侧。两条交易线回答的问题不同，所以分两区：
 *        产品型（陌生人买东西，只知道渠道与联系方式）问的是钱从哪来、货给了没；
 *        服务型（认识的人找你办事，有项目有过程）问的是欠谁的活、哪类问题该做成课。
 *        客户身份一律从事实推断而非标注：名下有 client 指向他的项目就是客户，
 *        给谁干过活谁才算——零标注、不会撒谎，也因此身份不互斥，
 *        同一个人可以既在人脉名录里又在客户名录里，因为他本来就是两者。
 *        服务历史可以保留，当前客户名录仍必须排除已归档人物，与人脉的「谁还算数」判据一致
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TFile } from 'obsidian';
import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import { FIELDS, NOTE_TYPES, PAYMENT_FIELDS } from '../../core/constants';
import { noteLink, renderEmpty, renderHeading, renderNote, renderSummary, renderTable } from '../../core/table';
import type { Cell } from '../../core/table';
import { dayOfMillis, dayText, daysBetween, today } from '../../core/time';
import { extractLinks, toStringList, toText } from '../../core/vaultIndex';
import { archiveFolderOf, isLivePath, lastContactDayOf } from './identity';

/** 一笔付费流水 */
interface Payment {
    readonly note: TFile;
    readonly product: string;
    readonly amount: number;
    readonly date: string;
    /** 勾上即已交付；checkbox 直接充当交付状态，无需另设字段 */
    readonly delivered: boolean;
}

/** 行内字段 `[键::值]`；键名一律中文，含大写的键会被补一份规范名而致求和双计数 */
const INLINE_FIELD = /\[([^\]:]+)::([^\]]*)\]/g;

// ============================================================
// 产品区
// ============================================================

/** 收了钱还没给货的：等最久的排最前，那是最该先做的 */
const pending: ViewDefinition = {
    name: '待交付',
    render: async (view: ViewContext): Promise<void> => {
        const payments = (await allPayments(view)).filter((payment) => !payment.delivered);

        if (!payments.length) {
            renderEmpty(view.el, '没有待交付的单子。收了钱就用「增加付费」记一笔，交付完点掉那个勾。');

            return;
        }

        const now = today();

        payments.sort((left, right) => left.date.localeCompare(right.date));

        renderSummary(view.el, `**${payments.length}** 笔还没交付，共 **${sum(payments)}**。`);
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['谁', '产品', '金额', '付款日', '等了'],
            payments.map((payment): Cell[] => [
                noteLink(payment.note),
                payment.product || '—',
                payment.amount,
                payment.date || '—',
                formatDays(daysBetween(payment.date, now)),
            ]),
        );
    },
};

/** 钱从哪个渠道来、哪个产品在挣钱 */
const sales: ViewDefinition = {
    name: '销售分析',
    render: async (view: ViewContext): Promise<void> => {
        const payments = await allPayments(view);

        if (!payments.length) {
            renderEmpty(view.el, '还没有任何流水。命令面板运行「增加付费」记第一笔。');

            return;
        }

        renderSummary(view.el, `累计 **${payments.length}** 笔，共 **${sum(payments)}**。`);

        // 渠道属于人不属于每一笔，所以从档案的 source 读，而不是从流水行读
        const byChannel = new Map<string, { people: Set<string>; count: number; total: number }>();

        for (const payment of payments) {
            const channel = toText(view.index.fieldOf(payment.note, FIELDS.source)) || '未标渠道';
            const bucket = byChannel.get(channel) ?? { people: new Set<string>(), count: 0, total: 0 };

            bucket.people.add(payment.note.path);
            bucket.count += 1;
            bucket.total += payment.amount;
            byChannel.set(channel, bucket);
        }

        renderHeading(view.el, 4, '按渠道');
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['渠道', '人数', '笔数', '金额', '客单价'],
            [...byChannel.entries()]
                .sort((left, right) => right[1].total - left[1].total)
                .map(([channel, bucket]): Cell[] => [
                    channel,
                    bucket.people.size,
                    bucket.count,
                    bucket.total,
                    Math.round(bucket.total / bucket.people.size),
                ]),
        );

        const byProduct = new Map<string, { count: number; total: number }>();

        for (const payment of payments) {
            const product = payment.product || '未标产品';
            const bucket = byProduct.get(product) ?? { count: 0, total: 0 };

            bucket.count += 1;
            bucket.total += payment.amount;
            byProduct.set(product, bucket);
        }

        renderHeading(view.el, 4, '按产品');
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['产品', '笔数', '金额'],
            [...byProduct.entries()]
                .sort((left, right) => right[1].total - left[1].total)
                .map(([product, bucket]): Cell[] => [product, bucket.count, bucket.total]),
        );
    },
};

/** 谁是大客户、谁复购了 */
const paidUsers: ViewDefinition = {
    name: '付费用户',
    render: async (view: ViewContext): Promise<void> => {
        const payments = await allPayments(view);

        if (!payments.length) {
            renderEmpty(view.el, '还没有付费用户。命令面板运行「新建客户」，再用「增加付费」记一笔。');

            return;
        }

        const byClient = new Map<string, { note: TFile; count: number; total: number; last: string }>();

        for (const payment of payments) {
            const bucket = byClient.get(payment.note.path) ?? {
                note: payment.note,
                count: 0,
                total: 0,
                last: '',
            };

            bucket.count += 1;
            bucket.total += payment.amount;

            if (payment.date > bucket.last) bucket.last = payment.date;

            byClient.set(payment.note.path, bucket);
        }

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['谁', '渠道', '笔数', '累计', '最近一笔'],
            [...byClient.values()]
                .sort((left, right) => right.total - left.total)
                .map((bucket): Cell[] => [
                    noteLink(bucket.note),
                    toText(view.index.fieldOf(bucket.note, FIELDS.source)) || '—',
                    // 复购是最值得一眼看见的事实，用 ★ 标出来
                    bucket.count > 1 ? `${bucket.count} ★` : bucket.count,
                    bucket.total,
                    bucket.last || '—',
                ]),
        );
    },
};

// ============================================================
// 服务区
// ============================================================

/** 我还欠谁的交付 */
const openCases: ViewDefinition = {
    name: '未结案',
    render: async (view: ViewContext): Promise<void> => {
        const now = today();
        const rows: Cell[][] = [];

        for (const { project, client } of clientProjects(view)) {
            if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() !== 'active') continue;

            const born = dayText(view.index.fieldOf(project, FIELDS.created)) ?? dayOfMillis(project.stat.ctime);

            rows.push([
                noteLink(project),
                client ? noteLink(client) : '—',
                born,
                formatDays(daysBetween(born, now)),
            ]);
        }

        if (!rows.length) {
            renderEmpty(view.el, '没有未结的案子。手上的活儿都交付完了。');

            return;
        }

        renderSummary(view.el, `还欠 **${rows.length}** 个交付。`);
        renderTable(view.ctx.app, view.el, view.sourcePath, ['项目', '客户', '开始', '已进行'], rows);
    },
};

/** 客户的问题集中在哪几类：某个主题堆到三五个，就该做成课程 */
const caseLibrary: ViewDefinition = {
    name: '案例库',
    render: async (view: ViewContext): Promise<void> => {
        const rows: Cell[][] = [];
        const topics = new Map<string, number>();

        for (const { project, client } of clientProjects(view)) {
            if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() !== 'done') continue;

            const born = dayText(view.index.fieldOf(project, FIELDS.created)) ?? dayOfMillis(project.stat.ctime);
            const closed = dayText(view.index.fieldOf(project, FIELDS.archived));

            for (const tag of toStringList(view.index.fieldOf(project, FIELDS.tags))) {
                topics.set(tag, (topics.get(tag) ?? 0) + 1);
            }

            rows.push([
                noteLink(project),
                client ? noteLink(client) : '—',
                closed ?? '—',
                formatDays(daysBetween(born, closed)),
            ]);
        }

        if (!rows.length) {
            renderEmpty(view.el, '案例库还是空的。结案的客户项目会自动收进来。');

            return;
        }

        renderTable(view.ctx.app, view.el, view.sourcePath, ['项目', '客户', '结案', '历时'], rows);

        const ranked = [...topics.entries()].sort((left, right) => right[1] - left[1]);

        if (ranked.length) {
            renderNote(
                view.el,
                `主题分布：${ranked.map(([tag, count]) => `${tag} ${count}`).join(' · ')}　（堆到三五个就该做成课）`,
            );
        }
    },
};

/** 认识的人里谁有未结案、谁要凉了 */
const serviceClients: ViewDefinition = {
    name: '服务客户',
    render: async (view: ViewContext): Promise<void> => {
        const archive = archiveFolderOf(view.ctx);
        const stats = new Map<string, { note: TFile; open: number; total: number }>();

        for (const { project, client } of clientProjects(view)) {
            // 项目史实可以保留，但已归档的人不应重新出现在当前客户名录。
            if (!client || !isLivePath(archive, client.path)) continue;

            const bucket = stats.get(client.path) ?? { note: client, open: 0, total: 0 };

            bucket.total += 1;

            if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() === 'active') {
                bucket.open += 1;
            }

            stats.set(client.path, bucket);
        }

        if (!stats.size) {
            renderEmpty(
                view.el,
                `还没有服务客户。在项目 MOC 的属性里写 \`${FIELDS.client}: "[[某人]]"\`，他就会出现在这里。`,
            );

            return;
        }

        const now = today();

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['谁', '未结案', '合作过', '最近联系'],
            [...stats.values()]
                .sort((left, right) => right.open - left.open || right.total - left.total)
                .map((bucket): Cell[] => {
                    const last = lastContactDayOf(view, bucket.note);
                    const days = last ? daysBetween(last, now) : null;

                    return [
                        noteLink(bucket.note),
                        bucket.open || '—',
                        bucket.total,
                        days === null ? '⚠️ 从未' : days === 0 ? '今天' : `${days} 天前`,
                    ];
                }),
        );
    },
};

// ============================================================
// 长在档案与项目上的两个视图
// ============================================================

/** 这个客户的全部流水 */
const clientPayments: ViewDefinition = {
    name: '付费与交付',
    render: async (view: ViewContext): Promise<void> => {
        if (!view.host) {
            renderEmpty(view.el, '这个视图要长在客户档案上才有内容。');

            return;
        }

        const payments = await paymentsOf(view, view.host);

        if (!payments.length) {
            renderEmpty(view.el, '还没有付费记录。命令面板运行「增加付费」记一笔。');

            return;
        }

        renderSummary(
            view.el,
            `**${payments.length}** 笔，累计 **${sum(payments)}**；未交付 **${payments.filter((payment) => !payment.delivered).length}** 笔。`,
        );
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['产品', '金额', '日期', '交付'],
            payments
                .sort((left, right) => right.date.localeCompare(left.date))
                .map((payment): Cell[] => [
                    payment.product || '—',
                    payment.amount,
                    payment.date || '—',
                    payment.delivered ? '✅ 已交付' : '⏳ 待交付',
                ]),
        );
    },
};

/** 这个项目收了多少钱 */
const projectPayments: ViewDefinition = {
    name: '项目收款',
    render: async (view: ViewContext): Promise<void> => {
        if (!view.host) {
            renderEmpty(view.el, '这个视图要长在项目 MOC 上才有内容。');

            return;
        }

        const payments = await paymentsOf(view, view.host);

        if (!payments.length) {
            renderEmpty(view.el, '这个项目还没有收款记录。命令面板运行「记收款」记一笔。');

            return;
        }

        const received = payments.filter((payment) => payment.delivered);

        renderSummary(
            view.el,
            `合计 **${sum(payments)}**，已到账 **${sum(received)}**，未到账 **${sum(payments) - sum(received)}**。`,
        );
        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['金额', '日期', '到账'],
            payments
                .sort((left, right) => right.date.localeCompare(left.date))
                .map((payment): Cell[] => [
                    payment.amount,
                    payment.date || '—',
                    payment.delivered ? '✅ 已到账' : '⏳ 未到账',
                ]),
        );
    },
};

// ============================================================
// 共用
// ============================================================

/** 全库在营客户的付费流水 */
async function allPayments(view: ViewContext): Promise<Payment[]> {
    const archive = archiveFolderOf(view.ctx);
    const collected: Payment[] = [];

    for (const client of view.index.notesOfType(NOTE_TYPES.client)) {
        if (!isLivePath(archive, client.path)) continue;

        collected.push(...(await paymentsOf(view, client)));
    }

    return collected;
}

/**
 * 一篇笔记里的付费任务行。
 * 一笔一行不嵌套：父项与子项的行内字段各自扁平上浮，嵌套会让金额与日期配对丢失。
 */
async function paymentsOf(view: ViewContext, note: TFile): Promise<Payment[]> {
    const payments: Payment[] = [];

    for (const line of await view.index.listLinesOf(note)) {
        if (!line.isTask) continue;

        const fields = inlineFieldsOf(line.text);
        const amount = Number(fields[PAYMENT_FIELDS.amount]);

        if (!Number.isFinite(amount)) continue;

        payments.push({
            note,
            product: fields[PAYMENT_FIELDS.product] ?? '',
            amount,
            date: fields[PAYMENT_FIELDS.date] ?? '',
            delivered: line.checked,
        });
    }

    return payments;
}

/** 解析一行里的全部 `[键::值]` */
function inlineFieldsOf(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    INLINE_FIELD.lastIndex = 0;

    let match = INLINE_FIELD.exec(text);

    while (match) {
        fields[match[1].trim()] = match[2].trim();
        match = INLINE_FIELD.exec(text);
    }

    return fields;
}

/** 全部客户项目连同它委托人的档案 */
function clientProjects(view: ViewContext): { project: TFile; client: TFile | null }[] {
    const found: { project: TFile; client: TFile | null }[] = [];

    for (const project of view.index.notesOfType(NOTE_TYPES.project)) {
        const links = extractLinks(String(view.index.fieldOf(project, FIELDS.client) ?? ''));

        if (!links.length) continue;

        found.push({ project, client: view.index.resolve(links[0], project.path) });
    }

    return found;
}

function sum(payments: readonly Payment[]): number {
    return payments.reduce((total, payment) => total + payment.amount, 0);
}

/** 算不出天数就说算不出，不写 0 天 */
function formatDays(days: number | null): string {
    return days === null ? '—' : `${days} 天`;
}

/** 客户与付费的八个视图 */
export const clientViews: readonly ViewDefinition[] = [
    pending,
    sales,
    paidUsers,
    openCases,
    caseLibrary,
    serviceClients,
    clientPayments,
    projectPayments,
];
