/**
 * [INPUT]: 依赖 core/lineEndings 的换行保真；其余只接收日记原文与活动事件，零 Obsidian 依赖
 * [OUTPUT]: 对外提供 DAILY_ACTIVITY_START/END 标记、emptyDailyActivityBlock 模板、
 *           upsertDailyActivity 幂等写入与 readDailyActivities 历史读取
 * [POS]: review 的每日活动纯文本内核。它把「当天做过什么」直接固化为日记里可读、
 *        可搜索、可同步的 Markdown；同篇同日只留一条，新建优先于修改，既有日记的
 *        旧「今日产出」代码块在第一次记账时就地升级，不需要独立修改历史目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { joinTextLines, splitTextLines } from '../../core/lineEndings';

export const DAILY_ACTIVITY_START = '<!-- ziminos:daily-activity:start -->';
export const DAILY_ACTIVITY_END = '<!-- ziminos:daily-activity:end -->';

const DAILY_OUTPUT_HEADING = '## 今日产出（自动）';
const LEGACY_BLOCK = ['```ziminos', '今日产出', '```'];

export type DailyActivityKind = 'created' | 'modified' | 'renamed';

export interface DailyActivity {
    readonly kind: DailyActivityKind;
    readonly time: string;
    /** 新建/修改的笔记路径，或改名后的 MOC 路径；不带 .md */
    readonly path: string;
    /** 链接对人显示的文字 */
    readonly label: string;
    /** 改名事件的旧名；普通事件不填 */
    readonly oldName?: string;
}

/** 新日记的可读占位；注释只给插件定位，不隐藏任何用户数据 */
export function emptyDailyActivityBlock(): string {
    return [DAILY_ACTIVITY_START, '- 今天还没有笔记产出。', DAILY_ACTIVITY_END].join('\n');
}

/**
 * 在日记的托管区中幂等写入一条活动。
 *
 * 同篇笔记当天多次修改只更新时间；当天新建的笔记即使后续继续写，
 * 仍只算「新建」而不再虚增一条「修改」。改名是单独的语义事件，不与笔记编辑折叠。
 */
export function upsertDailyActivity(content: string, event: DailyActivity): string {
    const split = splitTextLines(content);
    const lines = [...split.lines];
    const bounds = activityBounds(lines);
    const replacement = mergeActivityLines(bounds ? lines.slice(bounds.start + 1, bounds.end) : [], event);

    if (bounds) {
        lines.splice(bounds.start + 1, bounds.end - bounds.start - 1, ...replacement);
        return joinTextLines(lines, split.lineEnding);
    }

    const legacyStart = findSequence(lines, LEGACY_BLOCK);
    const block = [DAILY_ACTIVITY_START, ...replacement, DAILY_ACTIVITY_END];

    if (legacyStart >= 0) {
        lines.splice(legacyStart, LEGACY_BLOCK.length, ...block);
        return joinTextLines(lines, split.lineEnding);
    }

    const heading = lines.findIndex((line) => line.trim() === DAILY_OUTPUT_HEADING);

    if (heading >= 0) {
        let insertAt = heading + 1;
        while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt += 1;
        lines.splice(insertAt, 0, ...block, '');
        return joinTextLines(lines, split.lineEnding);
    }

    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (lines.length) lines.push('');
    lines.push(DAILY_OUTPUT_HEADING, '', ...block, '');
    return joinTextLines(lines, split.lineEnding);
}

/** 读取托管区中的活动；旧日记没有标记时返回 null，便于周视图对它单独走兼容口径 */
export function readDailyActivities(content: string): readonly DailyActivity[] | null {
    const lines = splitTextLines(content).lines;
    const bounds = activityBounds(lines);

    if (!bounds) return null;

    return lines
        .slice(bounds.start + 1, bounds.end)
        .map(parseActivityLine)
        .filter((item): item is DailyActivity => item !== null);
}

function mergeActivityLines(current: readonly string[], event: DailyActivity): string[] {
    const parsed = current.map(parseActivityLine).filter((item): item is DailyActivity => item !== null);
    const others = parsed.filter((item) => !sameActivity(item, event));

    if (event.kind === 'modified') {
        const created = parsed.find((item) => item.kind === 'created' && item.path === event.path);
        if (created) return parsed.map(formatActivityLine);
    }

    if (event.kind === 'created') {
        for (let index = others.length - 1; index >= 0; index -= 1) {
            if (others[index].kind === 'modified' && others[index].path === event.path) others.splice(index, 1);
        }
    }

    others.push(event);
    others.sort((left, right) => left.time.localeCompare(right.time));
    return others.map(formatActivityLine);
}

function sameActivity(left: DailyActivity, right: DailyActivity): boolean {
    if (left.kind !== right.kind) return false;
    if (left.kind === 'renamed') return left.path === right.path && left.oldName === right.oldName;
    return left.path === right.path;
}

function formatActivityLine(event: DailyActivity): string {
    const icon = event.kind === 'created' ? '🆕' : event.kind === 'modified' ? '✏️' : '🏷️';
    return `- ${icon} ${event.time} [[${event.path}|${event.label}]]`;
}

function parseActivityLine(line: string): DailyActivity | null {
    const match = /^- (?:🆕|✏️|🏷️) (\d{2}:\d{2}) \[\[([^\]|]+)\|([^\]]+)\]\]$/.exec(line.trim());
    if (!match) return null;

    const icon = line.includes('🆕') ? 'created' : line.includes('✏️') ? 'modified' : 'renamed';
    const label = match[3];
    const rename = icon === 'renamed' ? /^(.*?) → (.*)$/.exec(label) : null;

    return {
        kind: icon,
        time: match[1],
        path: match[2],
        label,
        ...(rename ? { oldName: rename[1] } : {}),
    };
}

function activityBounds(lines: readonly string[]): { start: number; end: number } | null {
    const start = lines.findIndex((line) => line.trim() === DAILY_ACTIVITY_START);
    if (start < 0) return null;

    const relativeEnd = lines.slice(start + 1).findIndex((line) => line.trim() === DAILY_ACTIVITY_END);
    if (relativeEnd < 0) return null;

    return { start, end: start + 1 + relativeEnd };
}

function findSequence(lines: readonly string[], sequence: readonly string[]): number {
    for (let index = 0; index <= lines.length - sequence.length; index += 1) {
        if (sequence.every((line, offset) => lines[index + offset].trim() === line)) return index;
    }
    return -1;
}
