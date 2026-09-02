/**
 * [INPUT]: 依赖 core/constants 的灵感默认值与插入位置类型；接收用户输入、模板时间变量和 Markdown 原文
 * [OUTPUT]: 对外提供输入/标题/格式规范化、灵感模板渲染、带文件最后修改时间分组的
 *           Dataview 未完成任务查询、
 *           “首块查询 + 其下标题”新笔记生成、老页眉换位与四种安全插入算法
 * [POS]: inspiration 模块的纯文本引擎，不接触 Obsidian、磁盘或设置落盘；capture.ts 只负责编排，
 *        所有会改变 Markdown 字符串的规则集中在这里，便于无笔记库环境下做确定性回归验证
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { INSPIRATION_DEFAULTS } from '../../core/constants';
import type { InspirationInsertPosition } from '../../core/constants';
import type { LocalDateTimeParts } from '../../core/time';

/** 灵感模板的四个公开占位符；未知占位符原样保留，避免擅自吞掉用户文本 */
const TEMPLATE_TOKENS = {
    content: '{{content}}',
    date: '{{date}}',
    time: '{{time}}',
    datetime: '{{datetime}}',
} as const;

/** 把输入压缩成一行，避免用户换行意外破坏 Markdown 任务结构 */
export function normalizeInspiration(input: string | null): string {
    if (input === null) return '';

    return input.replace(/\s+/g, ' ').trim();
}

/**
 * 标题允许写「灵感集」或完整的「## 灵感集」。
 * 运行时统一补成合法 Markdown 标题；空值回落默认标题。
 */
export function normalizeInspirationHeading(value: string | undefined): string {
    const candidate = typeof value === 'string' ? value.trim() : '';

    if (!candidate) return INSPIRATION_DEFAULTS.heading;

    const headingMatch = candidate.match(/^(#{1,6})\s*(.+)$/);

    if (headingMatch) return `${headingMatch[1]} ${headingMatch[2].trim()}`;

    return `# ${candidate}`;
}

/** 空格式回落默认值；缺少 content 会直接拒绝，防止看似成功却把用户输入丢掉 */
export function normalizeInspirationFormat(value: string | undefined): string {
    const candidate = typeof value === 'string' ? value : '';
    const format = candidate.trim() ? candidate : INSPIRATION_DEFAULTS.format;

    if (!format.includes(TEMPLATE_TOKENS.content)) {
        throw new Error('灵感格式必须包含 {{content}}，否则输入内容无处写入。');
    }

    return format;
}

/** 用显式白名单替换模板变量；不执行代码，不解释未知语法 */
export function renderInspirationEntry(
    format: string,
    inspiration: string,
    timeParts: LocalDateTimeParts,
): string {
    const replacements: Readonly<Record<string, string>> = {
        [TEMPLATE_TOKENS.content]: inspiration,
        [TEMPLATE_TOKENS.date]: timeParts.date,
        [TEMPLATE_TOKENS.time]: timeParts.time,
        [TEMPLATE_TOKENS.datetime]: timeParts.datetime,
    };

    return normalizeInspirationFormat(format).replace(
        /\{\{(?:content|date|time|datetime)\}\}/g,
        (token) => replacements[token] ?? token,
    );
}

/**
 * 系统页眉是「查询在上、标题在下」（v0.19.0 由用户拍板改的，此前反过来）。
 * 判据是这篇笔记被打开的姿势：它是收件箱，打开就为看还没勾掉的那几条，
 * 渲染出来的清单该占第一屏；标题之下是完整流水，最新的一条紧贴标题。
 */
export function buildInitialInspirationContent(
    entry: string,
    heading: string,
    targetPath: string,
): string {
    const filter = buildDataviewTaskQuery(targetPath);

    // 围栏与标题之间那一行空行不是装饰：标准 Markdown 要求代码块与标题各自成块，
    // 而读取侧的 skipBlankLines 本来就越过它，加了不影响任何一处解析
    return `${filter}\n\n${heading}\n\n${entry}\n`;
}

/**
 * 生成与当前自定义目标文件绑定的 Dataview TASK 查询。
 * 路径带 .md 时 Dataview 会强制按单文件解析；双引号与反斜杠先转义，避免破坏 DQL。
 * 用 file.mtime 给当前单文件任务分组，直接显示真实磁盘修改时间，不为灵感集强行注入 YAML。
 */
export function buildDataviewTaskQuery(targetPath: string): string {
    return buildDataviewTaskQueryVersion(targetPath, true);
}

/** 一个生成器同时描述 v0.3.0 旧查询与当前查询，迁移时因此不靠模糊文本判断 */
function buildDataviewTaskQueryVersion(targetPath: string, includeMtimeGroup: boolean): string {
    const escapedPath = targetPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const lines = [
        '```dataview',
        'task',
        'from',
        `    "${escapedPath}"`,
        'where',
        '    !completed',
    ];

    if (includeMtimeGroup) {
        lines.push(
            'group by',
            '    "最后更新 · " + dateformat(file.mtime, "yyyy-MM-dd HH:mm")',
        );
    }

    lines.push('```');

    return lines.join('\n');
}

/**
 * 把一条已渲染的灵感插入既有 Markdown。
 * 标题模式找不到标题时抛错且不返回新文本；正文顶部会越过 YAML、系统标题与
 * Dataview 围栏。老页眉（v0.3.0 与 v0.4.0–v0.18.0 两种）在用户下次显式记录灵感时安全换位。
 */
export function insertInspiration(
    content: string,
    entry: string,
    position: InspirationInsertPosition,
    heading: string,
    targetPath: string,
): string {
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    const entryLines = entry.split(/\r?\n/);

    normalizeSystemHeader(lines, heading, targetPath);

    switch (position) {
        case 'heading-top': {
            const headingIndex = findHeadingIndex(lines, heading);
            const insertionIndex = findHeadingContentStart(lines, headingIndex);

            lines.splice(insertionIndex, 0, ...entryLines);
            break;
        }
        case 'heading-bottom': {
            const headingIndex = findHeadingIndex(lines, heading);
            const headingLevel = heading.match(/^#+/)?.[0].length ?? 1;
            let insertionIndex = findHeadingSectionEnd(lines, headingIndex, headingLevel);

            while (insertionIndex > headingIndex + 1 && !lines[insertionIndex - 1]?.trim()) {
                insertionIndex -= 1;
            }

            lines.splice(insertionIndex, 0, ...entryLines);
            break;
        }
        case 'file-top': {
            const insertionIndex = findBodyStart(lines, heading);

            lines.splice(insertionIndex, 0, ...entryLines);
            break;
        }
        case 'file-bottom': {
            let insertionIndex = lines.length;

            while (insertionIndex > 0 && !lines[insertionIndex - 1]?.trim()) {
                insertionIndex -= 1;
            }

            lines.splice(insertionIndex, 0, ...entryLines);
            break;
        }
    }

    return lines.join(lineEnding);
}

/** 精确匹配规范化标题，避免相似标题之间串写 */
function findHeadingIndex(lines: readonly string[], heading: string): number {
    const index = lines.findIndex((line) => line.trim() === heading);

    if (index === -1) {
        throw new Error(`没有找到定位标题“${heading}”，未写入任何内容。`);
    }

    return index;
}

/** 标题区结束于下一条同级或更高级标题；更低级标题仍属于当前区块 */
function findHeadingSectionEnd(lines: readonly string[], headingIndex: number, headingLevel: number): number {
    for (let index = headingIndex + 1; index < lines.length; index += 1) {
        const nextHeading = lines[index]?.match(/^(#{1,6})\s+/);

        if (nextHeading && nextHeading[1].length <= headingLevel) return index;
    }

    return lines.length;
}

/**
 * 标题下方若还压着一块 Dataview（换不动的老页眉，或用户自己写的查询），
 * “置顶”仍解释为它下面的第一条内容——把新灵感插进查询上面等于每天把它往下推一行。
 */
function findHeadingContentStart(lines: readonly string[], headingIndex: number): number {
    const queryStart = firstContentLine(lines, headingIndex + 1);

    if (!isDataviewFence(lines[queryStart])) return queryStart;

    return firstContentLine(lines, findDataviewFenceEnd(lines, queryStart) + 1);
}

/**
 * 越过那一段排版空行，落在第一条真内容上；空行本身留在原处，新灵感因此不会
 * 紧贴标题挤成一块。唯一不越过的是**文件末尾那一行空串**——它是结尾的换行，
 * 插到它后面等于把换行吃掉，于是每写一条就少一个换行，直到某天两条并成一行。
 */
function firstContentLine(lines: readonly string[], start: number): number {
    const index = skipBlankLines(lines, start);

    return index < lines.length ? index : Math.max(start, lines.length - 1);
}

/**
 * 把可证明的系统页眉换成当前形态：查询在上、标题在下、查询带 mtime 分组。
 *
 * 三种老页眉都在此收口：v0.3.0 的“查询在前、查询不带分组”、
 * v0.4.0–v0.18.0 的“标题在前”，以及当前形态自身（换位后必须原样返回，否则每写一条抖一次）。
 * 换位的门槛是**整块字节相等**——只认这两版系统查询，用户改过的任何 Dataview 块
 * 不猜测、不搬动：搬错的那一次不报错，只会让他某天发现自己的查询凭空换了地方。
 */
function normalizeSystemHeader(lines: string[], heading: string, targetPath: string): void {
    const bodyStart = findMarkdownBodyStart(lines);
    let headingIndex = bodyStart;
    let queryStart = bodyStart;

    if (lines[bodyStart]?.trim() === heading) {
        queryStart = skipBlankLines(lines, bodyStart + 1);
    } else if (isDataviewFence(lines[bodyStart])) {
        const legacyQueryEnd = findDataviewFenceEnd(lines, bodyStart);

        headingIndex = skipBlankLines(lines, legacyQueryEnd + 1);
    } else {
        return;
    }

    if (lines[headingIndex]?.trim() !== heading || !isDataviewFence(lines[queryStart])) return;

    const queryEnd = findDataviewFenceEnd(lines, queryStart);
    const actualQuery = lines.slice(queryStart, queryEnd + 1).join('\n');
    const currentQuery = buildDataviewTaskQuery(targetPath);
    const legacyQuery = buildDataviewTaskQueryVersion(targetPath, false);

    if (actualQuery !== currentQuery && actualQuery !== legacyQuery) return;

    const systemEnd = Math.max(headingIndex, queryEnd);
    const contentStart = skipBlankLines(lines, systemEnd + 1);

    lines.splice(
        bodyStart,
        contentStart - bodyStart,
        ...currentQuery.split('\n'),
        '',
        heading,
        '',
    );
}

/** YAML 合法闭合时返回系统页眉后的正文起点；围栏未闭合时拒绝写入 */
function findBodyStart(lines: readonly string[], heading: string): number {
    const bodyStart = findMarkdownBodyStart(lines);
    let queryStart = bodyStart;

    if (/^#{1,6}\s+/.test(lines[bodyStart]?.trim() ?? '')) {
        const candidate = skipBlankLines(lines, bodyStart + 1);

        if (isDataviewFence(lines[candidate])) queryStart = candidate;
    }

    if (!isDataviewFence(lines[queryStart])) return bodyStart;

    const afterQuery = skipBlankLines(lines, findDataviewFenceEnd(lines, queryStart) + 1);

    // 当前形态里标题在查询下面，它同属系统页眉：不越过它，“正文顶部”会插进页眉中间
    return lines[afterQuery]?.trim() === heading ? skipBlankLines(lines, afterQuery + 1) : afterQuery;
}

/** 只负责越过 YAML 与紧随的空行，不对正文结构作任何推断 */
function findMarkdownBodyStart(lines: readonly string[]): number {
    let bodyStart = 0;

    if (lines[0]?.trim() === '---') {
        const closingIndex = lines.findIndex(
            (line, index) => index > 0 && (line.trim() === '---' || line.trim() === '...'),
        );

        if (closingIndex === -1) {
            throw new Error('目标笔记的 YAML 头部没有闭合，未写入任何内容。');
        }

        bodyStart = closingIndex + 1;
    }

    return skipBlankLines(lines, bodyStart);
}

/** Dataview 起始围栏对大小写不敏感，但不把其他代码块误当系统页眉 */
function isDataviewFence(line: string | undefined): boolean {
    return line?.trim().toLowerCase() === '```dataview';
}

/** 查询围栏未闭合时统一拒绝写入，不让任何插入算法各自漏判 */
function findDataviewFenceEnd(lines: readonly string[], start: number): number {
    const closingIndex = lines.findIndex(
        (line, index) => index > start && line.trim() === '```',
    );

    if (closingIndex === -1) {
        throw new Error('目标笔记顶部的 Dataview 查询没有闭合，未写入任何内容。');
    }

    return closingIndex;
}

/** 空行只是排版，寻找系统页眉或正文起点时统一跳过 */
function skipBlankLines(lines: readonly string[], start: number): number {
    let index = start;

    while (index < lines.length && !lines[index]?.trim()) index += 1;

    return index;
}
