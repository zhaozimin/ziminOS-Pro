/**
 * [INPUT]: 依赖 obsidian 的 TFile/TAbstractFile，core/constants 的 FOLDERS/PERIODS，
 *          core/editDebts 的 registerEditDebts/isNoteInFront/saveDisplayedMarkdownViews，
 *          core/folders 的目录归属判定，core/markdownViewState 的分栏滚动保护，core/time 的日期时间口径，
 *          core/types 的 ZiminosContext，依赖 ./dailyActivityText 纯文本内核与 ./periodic 的日记定位能力
 * [OUTPUT]: 对外提供 registerDailyActivityRecorder（常驻记录新建/修改）与
 *           recordContainerRenameActivity（项目/领域改名的显式记录口）
 * [POS]: review 的历史记账编排层。DataviewJS 只能查「现在」，无法保留「当时」；
 *        本文件在 vault 事件发生时先记欠账，等源笔记离开前台后，把事件直接写入当天日记。
 *        日记本身就是持久事件源，不产生第二套「修改历史」文件，也不在用户正编辑时写盘
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { TAbstractFile } from 'obsidian';
import { FOLDERS, PERIODS } from '../../core/constants';
import { isNoteInFront, registerEditDebts, saveDisplayedMarkdownViews } from '../../core/editDebts';
import { isInFolder, normalizeFolderPath } from '../../core/folders';
import { withPreservedMarkdownScroll } from '../../core/markdownViewState';
import { dayOfMillis, stampOfMillis } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import { upsertDailyActivity } from './dailyActivityText';
import type { DailyActivity } from './dailyActivityText';
import { openPeriodNote } from './periodic';

const ACTIVITY_DEBOUNCE_MS = 2000;
const ACTIVITY_DEBTS_KEY = 'ziminos-daily-activity-debts';

export function registerDailyActivityRecorder(ctx: ZiminosContext): void {
    const settle = async (file: TFile, changedAt: number): Promise<boolean> => {
        if (!isContentNote(ctx, file.path)) return true;

        const day = dayOfMillis(changedAt);
        const daily = await openPeriodNote(ctx, PERIODS.daily, { day, reveal: false });
        if (!daily) return true;

        if (isNoteInFront(ctx.app, daily.path)) return false;
        await saveDisplayedMarkdownViews(ctx.app, daily.path);
        if (isNoteInFront(ctx.app, daily.path)) return false;

        const created = dayOfMillis(file.stat.ctime) === day;
        const event: DailyActivity = {
            kind: created ? 'created' : 'modified',
            time: stampOfMillis(created ? file.stat.ctime : changedAt, 'HH:mm'),
            path: withoutMarkdownExtension(file.path),
            label: file.basename,
        };

        await writeActivity(ctx, daily, event);
        return true;
    };

    const debts = registerEditDebts(ctx, {
        debounceMs: ACTIVITY_DEBOUNCE_MS,
        storageKey: ACTIVITY_DEBTS_KEY,
        settle,
    });

    ctx.app.workspace.onLayoutReady(() => {
        ctx.plugin.registerEvent(
            ctx.app.vault.on('create', (file: TAbstractFile) => {
                if (file instanceof TFile && file.extension === 'md' && isContentNote(ctx, file.path)) debts.record(file);
            }),
        );

        ctx.plugin.registerEvent(
            ctx.app.vault.on('modify', (file: TAbstractFile) => {
                if (!(file instanceof TFile) || file.extension !== 'md') return;
                if (!isContentNote(ctx, file.path)) {
                    debts.forget(file.path);
                    return;
                }
                if (ctx.guard.isRecent(file.path)) return;
                debts.record(file);
            }),
        );
    });
}

/** 容器改名是一次人主导的语义动作，不让底层几十次 rename/modify 事件代替它 */
export async function recordContainerRenameActivity(
    ctx: ZiminosContext,
    oldName: string,
    newName: string,
    newMocPath: string,
    changedAt: number = Date.now(),
): Promise<void> {
    const day = dayOfMillis(changedAt);
    const daily = await openPeriodNote(ctx, PERIODS.daily, { day, reveal: false });
    if (!daily) throw new Error('无法创建当天日记');

    await saveDisplayedMarkdownViews(ctx.app, daily.path);
    await writeActivity(ctx, daily, {
        kind: 'renamed',
        time: stampOfMillis(changedAt, 'HH:mm'),
        path: withoutMarkdownExtension(newMocPath),
        label: `${oldName} → ${newName}`,
        oldName,
    });
}

async function writeActivity(ctx: ZiminosContext, daily: TFile, event: DailyActivity): Promise<void> {
    await withPreservedMarkdownScroll(ctx.app, daily, () =>
        ctx.app.vault.process(daily, (content) => {
            const next = upsertDailyActivity(content, event);
            if (next !== content) ctx.guard.mark(daily.path);
            return next;
        }),
    );
}

function isContentNote(ctx: ZiminosContext, path: string): boolean {
    const roots = [
        FOLDERS.inbox,
        normalizeFolderPath(ctx.settings.projectFolder, FOLDERS.projects),
        normalizeFolderPath(ctx.settings.areaFolder, FOLDERS.areas),
        normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives),
    ];

    return roots.some((root) => isInFolder(path, root));
}

function withoutMarkdownExtension(path: string): string {
    return path.endsWith('.md') ? path.slice(0, -3) : path;
}
