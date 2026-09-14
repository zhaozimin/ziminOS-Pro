/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile；依赖 core/commands 的 CONTACT_COMMANDS，
 *          core/constants 的 DIARY_LOG_HEADING/LEDGER/NOTE_TYPES，
 *          core/modals 的 TextInputModal/ChoiceModal，core/types 的 ZiminosContext；
 *          依赖 ./identity 的 liveNotesOfType/descriptionOf
 * [OUTPUT]: 对外提供 DailyNoteProvider 契约与 registerRecordFavorCommand（注册「记人情」命令）
 * [POS]: 人情账本的录入口。它把四步点选变成日记里的一行标准账本行，
 *        人物档案的「人情账本」与人脉 MOC 的「人情余额」都从那一行长出来。
 *        它刻意不认识复盘模块：当天日记从构造时注入的 DailyNoteProvider 取，
 *        由 main 在装配点把两者接上——记人情要用日记，但不该因此依赖整个复盘模块。
 *        事项里的全角竖线会被清洗成半角，否则一句「他给我讲了 A｜B 两种方案」
 *        会把这一行劈成五段，状态段错位成「B 两种方案」，而这不会报错
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { CONTACT_COMMANDS } from '../../core/commands';
import { DIARY_LOG_HEADING, LEDGER, NOTE_TYPES } from '../../core/constants';
import { insertIntoSection } from '../../core/markdown';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import { descriptionOf, liveNotesOfType } from './identity';

/**
 * 「拿到当天的日记」这项能力。
 * 由 main 在装配时注入，因此本文件不 import 复盘模块，
 * 两个模块仍然互不认识，只有 main 同时认识它们。
 */
export type DailyNoteProvider = () => Promise<TFile | null>;

const MESSAGES = {
    noContacts: '还没有任何档案。先运行「新建人脉」建一个，再来记账。',
    personPrompt: '这笔人情，是跟谁？',
    kindPrompt: '人情往哪个方向走？',
    itemPrompt: '什么事？（一句话）',
    itemPlaceholder: '例如：送了半斤生普',
    statusPrompt: '现在算清了吗？',
    cancelled: '已取消，没有记账。',
    noDiary: '拿不到今天的日记，没有记账。',
    donePrefix: '已记进今天的日记：',
    failedPrefix: '记人情失败：',
} as const;

/** 去与来各自的说明，让方向在列表里自带含义 */
const KIND_HINTS: Readonly<Record<string, string>> = {
    去: '我给出去的（送礼、帮忙、请客）',
    来: '我收到的（收礼、被帮、被请）',
};

/** 三种状态的说明 */
const STATUS_HINTS: Readonly<Record<string, string>> = {
    两清: '这笔不用记挂了',
    我欠: '我还欠他一份',
    他欠: '他还欠我一份',
};

/** 注册「记人情」命令 */
export function registerRecordFavorCommand(ctx: ZiminosContext, openDaily: DailyNoteProvider): void {
    ctx.commands.register(CONTACT_COMMANDS.favor, () => {
        void recordFavor(ctx, openDaily);
    });
}

/** 四步点选 → 写进当天日记 */
async function recordFavor(ctx: ZiminosContext, openDaily: DailyNoteProvider): Promise<void> {
    try {
        // 候选跨人脉与客户两类：现实不分家，客户可能是朋友，熟人也可能来买东西
        const candidates = [
            ...liveNotesOfType(ctx, NOTE_TYPES.person),
            ...liveNotesOfType(ctx, NOTE_TYPES.client),
        ];

        if (!candidates.length) {
            new Notice(MESSAGES.noContacts);

            return;
        }

        const person = await new ChoiceModal(ctx.app, {
            title: MESSAGES.personPrompt,
            items: candidates,
            labelOf: (file) => {
                const hint = descriptionOf(ctx, file);

                return hint ? `${file.basename}　—　${hint}` : file.basename;
            },
        }).openAndGetChoice();

        if (!person) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const kind = await new ChoiceModal(ctx.app, {
            title: MESSAGES.kindPrompt,
            items: LEDGER.kinds,
            labelOf: (item) => `${item}　—　${KIND_HINTS[item] ?? ''}`,
        }).openAndGetChoice();

        if (!kind) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const answer = await new TextInputModal(ctx.app, {
            title: MESSAGES.itemPrompt,
            placeholder: MESSAGES.itemPlaceholder,
        }).openAndGetValue();

        const item = cleanItem(answer ?? '');

        if (!item) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const status = await new ChoiceModal(ctx.app, {
            title: MESSAGES.statusPrompt,
            items: LEDGER.statuses,
            labelOf: (value) => `${value}　—　${STATUS_HINTS[value] ?? ''}`,
        }).openAndGetChoice();

        if (!status) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const diary = await openDaily();

        if (!diary) {
            new Notice(MESSAGES.noDiary);

            return;
        }

        const line = ledgerLine(personLink(person), kind, item, status);

        // 替人落笔，不登记自写：这一行是用户记的，那篇日记的 updated 应当照记（见 core/guard）
        await ctx.app.vault.process(diary, (content) =>
            insertIntoSection(content, DIARY_LOG_HEADING, line),
        );

        new Notice(MESSAGES.donePrefix + line);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(MESSAGES.failedPrefix + message);
    }
}

/**
 * 事项文本清洗：压成一行，并把全角竖线换成半角。
 * 全角竖线是账本行的分隔符，事项里出现一个就会把这一行多劈出一段，
 * 状态段随之错位——而错位后的行依然是一行合法 Markdown，不会有任何报错。
 */
function cleanItem(raw: string): string {
    return raw.replace(/\s+/g, ' ').split(LEDGER.separator).join('|').trim();
}

/** 同名档案用全路径消歧，显示仍只露出姓名 */
function personLink(person: TFile): string {
    return `[[${person.path.replace(/\.md$/i, '')}|${person.basename}]]`;
}

/** 拼一条标准账本行；两清是最常见的情形，省略状态段让最常见的写法最短 */
function ledgerLine(person: string, kind: string, item: string, status: string): string {
    const segments = [person, kind, item];

    if (status !== LEDGER.defaultStatus) segments.push(status);

    return `- ${segments.join(LEDGER.separator)}`;
}
