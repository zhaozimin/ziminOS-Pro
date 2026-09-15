/**
 * [INPUT]: 依赖 core/lineEndings 的行尾判定、core/constants 的 MOC 身份常量，
 *          依赖同目录 templates 的当前 MOC/导航 Base 事实源
 * [OUTPUT]: 对外提供 BaseContentUpgrade 结果契约、planMocBaseUpgrade / planNavigationBaseUpgrade，
 *           以及 applyMigrationBatch / MigrationBatchError 批次回滚契约
 * [POS]: projects 的纯文本迁移内核；只判断一段 Markdown 能否被确定性升级并产出新全文，
 *        不认识 Obsidian、文件路径、弹窗或磁盘。旧模板、当前模板与冲突三种身份在此唯一判定，
 *        编排层因此没有机会用模糊替换覆盖用户自定义的 Base；两张内建领域总控台即使
 *        名称与 type 符合普通容器，也在身份层明确排除。导航历史模板按版本白名单递进，
 *        因此旧书可显式升级为 aliases 书名卡片，自定义视图仍原封不动
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { lineEndingOf } from '../../core/lineEndings';
import { CLIENT_MOC, CONTACT_MOC, MOC_PREFIX, NOTE_TYPES } from '../../core/constants';
import { mocBaseBlock, navContent } from './templates';

export type BaseUpgradeAction = '替换旧 Base' | '补上缺失 Base' | '升级导航 Base';

export type BaseContentUpgrade =
    | {
        readonly status: 'change';
        readonly action: BaseUpgradeAction;
        readonly content: string;
        readonly beforeBlock: string | null;
        readonly afterBlock: string;
    }
    | { readonly status: 'unchanged' }
    | { readonly status: 'conflict'; readonly reason: string };

/** 批次失败既保留原始错误，也完整交代哪些文件没能恢复 */
export class MigrationBatchError extends Error {
    readonly operationError: unknown;

    readonly rollbackFailures: readonly string[];

    constructor(operationError: unknown, rollbackFailures: readonly string[]) {
        const operationMessage = errorMessage(operationError);
        const detail = rollbackFailures.length
            ? `自动回滚未能恢复：${rollbackFailures.join('；')}`
            : '本轮已修改文件已全部回滚';

        super(`迁移失败：${operationMessage}。${detail}。`);
        this.name = 'MigrationBatchError';
        this.operationError = operationError;
        this.rollbackFailures = rollbackFailures;
    }
}

interface TextLineRange {
    readonly start: number;
    readonly end: number;
    readonly text: string;
}

interface BaseBlockRange {
    readonly start: number;
    readonly end: number;
    readonly text: string;
}

interface BaseBlockScan {
    readonly blocks: readonly BaseBlockRange[];
    readonly unclosed: boolean;
}

const CURRENT_MOC_BASE = mocBaseBlock();
const CURRENT_NAV_BASE = currentNavigationBase();
const MIGRATABLE_MOC_TYPES = new Set<string>([
    NOTE_TYPES.project,
    NOTE_TYPES.area,
    NOTE_TYPES.book,
]);

/**
 * 两张内建领域总控台虽然服从 `MOC-目录名` 的统一命名，却不是“文件夹 + 卡片”的容器 MOC。
 * 不在身份层排除，存量 Base 迁移会因为名字与 type 都吻合而给它们错误补上一块项目数据库。
 */
const NON_CONTAINER_MOC_BASENAMES = new Set<string>([
    basenameWithoutExtension(CONTACT_MOC),
    basenameWithoutExtension(CLIENT_MOC),
]);

/** v0.22.7 之前导航页由 templates.ts 生成的唯一 Base 形态 */
const LEGACY_NAV_BASE = [
    '```base',
    'properties:',
    '  note.description:',
    '    displayName: 概述',
    '  note.status:',
    '    displayName: 状态',
    'views:',
    '  - type: table',
    '    name: 正在进行中',
    '    filters:',
    '      and:',
    '        - status == "active"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - status',
    '  - type: table',
    '    name: 项目',
    '    filters:',
    '      and:',
    '        - type == "project"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - status',
    '  - type: table',
    '    name: 领域',
    '    filters:',
    '      and:',
    '        - type == "area"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - status',
    '  - type: table',
    '    name: 书籍',
    '    filters:',
    '      and:',
    '        - type == "book"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - status',
    '',
    '```',
].join('\n');

/** 状态图标已上线、但导航仍把书籍做成普通表格的上一版 Base */
const LEGACY_FILE_NAME_TABLE_NAV_BASE = [
    '```base',
    'filters:',
    '  and:',
    '    - \'!file.inFolder("90-system")\'',
    'formulas:',
    '  status_icon: if(status == "active", "🟢 进行中", if(status == "paused", "🟡 搁置", if(status == "done", "✅ 完成", if(status == "dropped", "⚫️ 弃", if(status.isEmpty(), "", "⚠️ " + status)))))',
    'properties:',
    '  note.description:',
    '    displayName: 概述',
    '  note.status:',
    '    displayName: 状态',
    '  formula.status_icon:',
    '    displayName: 状态',
    'views:',
    '  - type: table',
    '    name: 正在进行中',
    '    filters:',
    '      and:',
    '        - status == "active"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '  - type: table',
    '    name: 项目',
    '    filters:',
    '      and:',
    '        - type == "project"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '  - type: table',
    '    name: 领域',
    '    filters:',
    '      and:',
    '        - type == "area"',
    '    order:',
    '      - file.name',
    '      - description',
    '  - type: table',
    '    name: 书籍',
    '    filters:',
    '      and:',
    '        - type == "book"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '',
    '```',
].join('\n');

/** 用户提供的封面卡片版导航；升级时只换书名列，并顺带采用递归系统目录排除 */
const LEGACY_FILE_NAME_CARD_NAV_BASE = [
    '```base',
    'filters:',
    '  and:',
    '    - file.folder != "90-system"',
    'formulas:',
    '  status_icon: if(status == "active", "🟢 进行中", if(status == "paused", "🟡 搁置", if(status == "done", "✅ 完成", if(status == "dropped", "⚫️ 弃", if(status.isEmpty(), "", "⚠️ " + status)))))',
    'properties:',
    '  note.description:',
    '    displayName: 概述',
    '  note.status:',
    '    displayName: 状态',
    '  formula.status_icon:',
    '    displayName: 状态',
    'views:',
    '  - type: table',
    '    name: 正在进行中',
    '    filters:',
    '      and:',
    '        - status == "active"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '  - type: table',
    '    name: 项目',
    '    filters:',
    '      and:',
    '        - type == "project"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '    sort:',
    '      - property: formula.status_icon',
    '        direction: DESC',
    '  - type: table',
    '    name: 领域',
    '    filters:',
    '      and:',
    '        - type == "area"',
    '    order:',
    '      - file.name',
    '      - description',
    '  - type: cards',
    '    name: 书籍',
    '    filters:',
    '      and:',
    '        - type == "book"',
    '    order:',
    '      - file.name',
    '      - description',
    '      - formula.status_icon',
    '    image: note.cover',
    '    imageAspectRatio: 1.35',
    '    imageFit: contain',
    '    cardSize: 200',
    '',
    '```',
].join('\n');

const LEGACY_NAV_BASES = new Set<string>([
    LEGACY_NAV_BASE,
    LEGACY_FILE_NAME_TABLE_NAV_BASE,
    LEGACY_FILE_NAME_CARD_NAV_BASE,
]);

/** 用户确认 v0.22.7 方案前使用过的“相对上下文但只有一张表”形态 */
const LEGACY_RELATIVE_MOC_BASE = [
    '```base',
    'filters:',
    '  and:',
    '    - file.path != this.file.path',
    '    - \'!file.inFolder("90-system")\'',
    'properties:',
    '  note.description:',
    '    displayName: 概述',
    '  note.rating:',
    '    displayName: 评分',
    'views:',
    '  - type: table',
    '    name: 项目文件',
    '    filters:',
    '      or:',
    '        - up.contains(this.file.asLink())',
    '        - file.folder == this.file.folder',
    '    order:',
    '      - file.name',
    '      - description',
    '      - rating',
    '    sort:',
    '      - property: rating',
    '        direction: DESC',
    '    columnSize:',
    '      file.name: 170',
    '      note.description: 421',
    '',
    '```',
].join('\n');

/** v0.22.6 及更早的硬编码 MOC Base；三个动态值先换成占位符再与骨架逐字比较 */
const LEGACY_HARDCODED_MOC_SKELETON = [
    '```base',
    'filters:',
    '  and:',
    '    - file.path != this.file.path',
    'properties:',
    '  note.description:',
    '    displayName: 概述',
    '  note.rating:',
    '    displayName: 评分',
    'views:',
    '  - type: table',
    '    name: <view>',
    '    filters:',
    '      or:',
    '        - up == link(<moc>)',
    '        - file.folder == <folder>',
    '    order:',
    '      - file.name',
    '      - description',
    '      - rating',
    '    sort:',
    '      - property: rating',
    '        direction: DESC',
    '    columnSize:',
    '      file.name: 170',
    '      note.description: 421',
    '',
    '```',
].join('\n');

/** 为一篇 MOC 规划升级；只返回文本结果，不写盘 */
export function planMocBaseUpgrade(content: string): BaseContentUpgrade {
    const scan = scanBaseBlocks(content);

    if (scan.unclosed) {
        return { status: 'conflict', reason: '存在未闭合的 ```base 代码块' };
    }

    if (scan.blocks.length > 1) {
        return { status: 'conflict', reason: `存在 ${scan.blocks.length} 个 Base，无法判断该替换哪一个` };
    }

    if (scan.blocks.length === 0) {
        const afterBlock = withDocumentLineEnding(CURRENT_MOC_BASE, content);

        return {
            status: 'change',
            action: '补上缺失 Base',
            content: appendBlock(content, afterBlock),
            beforeBlock: null,
            afterBlock,
        };
    }

    const block = scan.blocks[0];
    const normalized = normalizeLineEndings(block.text);

    if (normalized === CURRENT_MOC_BASE) return { status: 'unchanged' };

    if (normalized !== LEGACY_RELATIVE_MOC_BASE && !isLegacyHardcodedMocBase(normalized)) {
        return { status: 'conflict', reason: 'Base 含有自定义内容，不会自动覆盖' };
    }

    const afterBlock = withDocumentLineEnding(CURRENT_MOC_BASE, content);

    return {
        status: 'change',
        action: '替换旧 Base',
        content: replaceBlock(content, block, afterBlock),
        beforeBlock: block.text,
        afterBlock,
    };
}

/**
 * 只认项目/领域/书籍三类“文件夹 + MOC”；两张内建总控台由明确名单排除。
 * 新名 `MOC-文件夹名` 与 V3 前旧名 `文件夹名` 同时保留，迁移不会逼旧库先改名。
 */
export function isContainerMocIdentity(
    basename: string,
    parentName: string,
    type: unknown,
): boolean {
    const normalizedType = typeof type === 'string' ? type.trim() : '';
    const nameMatches = basename === parentName || basename === `${MOC_PREFIX}${parentName}`;

    return (
        nameMatches &&
        !NON_CONTAINER_MOC_BASENAMES.has(basename) &&
        MIGRATABLE_MOC_TYPES.has(normalizedType)
    );
}

/** 从库内路径取 Markdown 文件名，不让 projects 反向依赖 contacts 的模板工具。 */
function basenameWithoutExtension(path: string): string {
    return path.replace(/\.md$/, '').split('/').pop() ?? path;
}

/** 为系统导航页规划升级；导航缺块或被自定义时宁可冲突，也不把整页猜成系统模板 */
export function planNavigationBaseUpgrade(content: string): BaseContentUpgrade {
    const scan = scanBaseBlocks(content);

    if (scan.unclosed) {
        return { status: 'conflict', reason: '导航页存在未闭合的 ```base 代码块' };
    }

    if (scan.blocks.length !== 1) {
        return {
            status: 'conflict',
            reason: scan.blocks.length === 0
                ? '导航页没有 Base，无法确认其结构'
                : `导航页存在 ${scan.blocks.length} 个 Base，无法判断该替换哪一个`,
        };
    }

    const block = scan.blocks[0];
    const normalized = normalizeLineEndings(block.text);

    if (normalized === CURRENT_NAV_BASE) return { status: 'unchanged' };

    if (!LEGACY_NAV_BASES.has(normalized)) {
        return { status: 'conflict', reason: '导航 Base 含有自定义内容，不会自动覆盖' };
    }

    const afterBlock = withDocumentLineEnding(CURRENT_NAV_BASE, content);

    return {
        status: 'change',
        action: '升级导航 Base',
        content: replaceBlock(content, block, afterBlock),
        beforeBlock: block.text,
        afterBlock,
    };
}

/**
 * 逐项写入一个迁移批次；当前项在调用写函数前就进入回滚栈，覆盖“磁盘已提交但 Promise 拒绝”。
 * 回滚按相反顺序执行且不因单项失败中断，最终错误因此能列出完整的人工恢复清单。
 */
export async function applyMigrationBatch<T>(
    items: readonly T[],
    applyItem: (item: T) => Promise<void>,
    rollbackItem: (item: T) => Promise<void>,
    describeItem: (item: T) => string,
): Promise<void> {
    const attempted: T[] = [];

    try {
        for (const item of items) {
            attempted.push(item);
            await applyItem(item);
        }
    } catch (operationError) {
        const rollbackFailures: string[] = [];

        for (const item of [...attempted].reverse()) {
            try {
                await rollbackItem(item);
            } catch (rollbackError) {
                rollbackFailures.push(`${describeItem(item)}（${errorMessage(rollbackError)}）`);
            }
        }

        throw new MigrationBatchError(operationError, rollbackFailures);
    }
}

/** 从当前导航全文中抽出 Base；生成器若失去唯一代码块，模块加载阶段就立即失败 */
function currentNavigationBase(): string {
    const scan = scanBaseBlocks(navContent());

    if (scan.unclosed || scan.blocks.length !== 1) {
        throw new Error('当前导航模板必须且只能包含一个闭合 Base');
    }

    return normalizeLineEndings(scan.blocks[0].text);
}

function isLegacyHardcodedMocBase(block: string): boolean {
    const lines = block.split('\n');

    if (lines.length !== LEGACY_HARDCODED_MOC_SKELETON.split('\n').length) return false;
    if (!/^    name: (项目文件|读书卡片)$/.test(lines[11] ?? '')) return false;
    if (!isJsonStringExpression(lines[14] ?? '', '        - up == link(', ')')) return false;
    if (!isJsonStringExpression(lines[15] ?? '', '        - file.folder == ', '')) return false;

    const normalized = [...lines];
    normalized[11] = '    name: <view>';
    normalized[14] = '        - up == link(<moc>)';
    normalized[15] = '        - file.folder == <folder>';

    return normalized.join('\n') === LEGACY_HARDCODED_MOC_SKELETON;
}

/** 动态值必须是合法 JSON 字符串；只像旧模板还不够，不能把任意表达式当模板覆盖 */
function isJsonStringExpression(line: string, prefix: string, suffix: string): boolean {
    if (!line.startsWith(prefix) || !line.endsWith(suffix)) return false;

    const end = suffix ? line.length - suffix.length : line.length;
    const expression = line.slice(prefix.length, end);

    try {
        return typeof JSON.parse(expression) === 'string';
    } catch {
        return false;
    }
}

function scanBaseBlocks(content: string): BaseBlockScan {
    const lines = lineRanges(content);
    const blocks: BaseBlockRange[] = [];
    let opening: TextLineRange | null = null;

    for (const line of lines) {
        if (!opening) {
            if (line.text.trimEnd() === '```base') opening = line;

            continue;
        }

        if (line.text.trimEnd() !== '```') continue;

        blocks.push({
            start: opening.start,
            end: line.end,
            text: content.slice(opening.start, line.end),
        });
        opening = null;
    }

    return { blocks, unclosed: opening !== null };
}

/** 行范围保留原始字符偏移，替换 Base 时不会顺手规范化用户正文的混合行尾 */
function lineRanges(content: string): TextLineRange[] {
    const lines: TextLineRange[] = [];
    let start = 0;

    while (start < content.length) {
        let cursor = start;

        while (cursor < content.length && content[cursor] !== '\r' && content[cursor] !== '\n') {
            cursor += 1;
        }

        lines.push({ start, end: cursor, text: content.slice(start, cursor) });

        if (cursor >= content.length) break;

        start = content[cursor] === '\r' && content[cursor + 1] === '\n'
            ? cursor + 2
            : cursor + 1;
    }

    return lines;
}

function replaceBlock(content: string, block: BaseBlockRange, replacement: string): string {
    return content.slice(0, block.start) + replacement + content.slice(block.end);
}

function appendBlock(content: string, block: string): string {
    if (!content) return `${block}${lineEndingOf(block)}`;

    const lineEnding = lineEndingOf(content);
    const trailingBreaks = content.match(/(?:(?:\r\n|\r|\n))+$/)?.[0]
        ?.match(/\r\n|\r|\n/g)?.length ?? 0;
    const gap = lineEnding.repeat(Math.max(0, 2 - trailingBreaks));

    return `${content}${gap}${block}${lineEnding}`;
}

function withDocumentLineEnding(block: string, content: string): string {
    return block.replace(/\n/g, lineEndingOf(content));
}

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n|\r/g, '\n');
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
