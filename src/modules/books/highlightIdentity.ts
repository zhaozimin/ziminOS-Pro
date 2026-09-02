/**
 * [INPUT]: 依赖 ./parsers 的 ParsedHighlight 契约，接收多个书源汇合后的划线批次
 * [OUTPUT]: 对外提供 flattenHighlight、normalizedHighlightKey、highlightKey 与 coalesceHighlights
 * [POS]: books 的划线身份层；它只回答“哪些输入是同一条”，不读笔记、不决定写入位置。
 *        身份键只剥成对 Markdown 表现包裹并保留正文语义字符；同批次先在此合并，
 *        后续落盘引擎因此永远面对一键一条的输入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BOOK_THOUGHT_PREFIX } from '../../core/constants';
import type { ParsedHighlight } from './parsers';

/** 写入与去重共用的单行形态 */
export function flattenHighlight(highlight: ParsedHighlight): ParsedHighlight {
    return {
        chapter: highlight.chapter.replace(/\s+/g, ' ').trim(),
        text: highlight.text.replace(/\s+/g, ' ').trim(),
        thoughts: highlight.thoughts
            .map((thought) => thought.replace(/\s+/g, ' ').trim())
            .filter(Boolean),
    };
}

/**
 * 去掉排版整理与手工强调造成的表现差异，但保留正文里的语义字符。
 *
 * 不能把 `= _ ~ \`` 全局删掉：`x=1` 与 `x1`、`a_b` 与 `ab` 是不同内容。
 * 这里只剥能确认成对闭合的 Markdown 包裹符；未闭合或只出现一次的符号原样参与身份。
 */
export function normalizedHighlightKey(text: string): string {
    let normalized = text;
    let previous = '';

    // 允许嵌套强调：`**==重点==**` 需要两轮才能只剩正文。
    while (normalized !== previous) {
        previous = normalized;
        normalized = normalized
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')
            .replace(/==(.+?)==/g, '$1')
            .replace(/`([^`\n]+)`/g, '$1');
    }

    return normalized.replace(/\s/g, '');
}

/** 划线与独立想法占用不同键空间 */
export function highlightKey(highlight: ParsedHighlight): string {
    if (highlight.text) return normalizedHighlightKey(highlight.text);

    const thoughtKey = normalizedHighlightKey(highlight.thoughts[0] ?? '');

    return thoughtKey ? BOOK_THOUGHT_PREFIX.trim() + thoughtKey : '';
}

/**
 * 同批次以划线键合并，保留首见顺序并对想法做有序并集。
 * 后来的来源若提供了更完整的章节名，只补空章节，不改写先到的原文。
 */
export function coalesceHighlights(incoming: readonly ParsedHighlight[]): ParsedHighlight[] {
    const collected = new Map<string, { highlight: ParsedHighlight; thoughtKeys: Set<string> }>();

    for (const raw of incoming) {
        const highlight = flattenHighlight(raw);
        const key = highlightKey(highlight);

        if (!key) continue;

        const existing = collected.get(key);

        if (!existing) {
            collected.set(key, {
                highlight,
                thoughtKeys: new Set(highlight.thoughts.map(normalizedHighlightKey)),
            });
            continue;
        }

        const thoughts = [...existing.highlight.thoughts];

        for (const thought of highlight.thoughts) {
            const thoughtKey = normalizedHighlightKey(thought);

            if (!thoughtKey || existing.thoughtKeys.has(thoughtKey)) continue;

            existing.thoughtKeys.add(thoughtKey);
            thoughts.push(thought);
        }

        existing.highlight = {
            ...existing.highlight,
            chapter: existing.highlight.chapter || highlight.chapter,
            thoughts,
        };
    }

    return [...collected.values()].map(({ highlight }) => highlight);
}
