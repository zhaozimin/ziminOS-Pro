/**
 * [INPUT]: 依赖 obsidian 的 ButtonComponent/Modal/Notice/TFile 与 App 类型；
 *          依赖 core/commands 的 BOOK_COMMANDS、core/constants 的 BOOK_CHAPTER_PREFIX/
 *          BOOK_HEADINGS/BOOK_THOUGHT_PREFIX/BOOK_CALLOUTS、core/lineEndings 的行尾保真、
 *          core/modals 的 ChoiceModal/TextAreaModal、
 *          core/types 的 ZiminosContext；依赖同目录 identity 的三个判定函数、
 *          parsers 的 parseHighlightExport、highlightIdentity 的批次归并与身份键、
 *          templates 的行形态四函数
 * [OUTPUT]: 对外提供 registerImportHighlightsCommand（命令 import-book-highlights）
 *           与 mergeHighlights（合并去重的纯函数，导出以供检验）
 * [POS]: books 模块的导入编排：选书 → 粘贴 → 解析 →（多本书时选一本）→ 确认 → 合并写入。
 *        确认框是整条流程唯一的授权点（人主导），零新增时连确认框都不弹、一个字不写。
 *        mergeHighlights 是本文件的心脏，三条法：其一，去重键是「去除全部空白与强调符」的
 *        划线文本——排版整理会往汉英之间补空格、学员会加粗，键不这么归一的话，
 *        同一条划线整理后再导一次就成了「新的」；其二，只增不删不改，学员在小节里的
 *        手改一概不碰，删过的行下次导入会回来——这是「只增」的正直代价，
 *        好过为记住删除而引入一份影子状态；其三，划线已存在而想法是新的，
 *        想法补挂到那条划线名下——想法是学员亲手打的字，是整份导出里最贵的部分，不许静默丢
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, Modal, Notice } from 'obsidian';
import type { App, TFile } from 'obsidian';
import { BOOK_COMMANDS } from '../../core/commands';
import {
    BOOK_CALLOUTS,
    BOOK_CHAPTER_PREFIX,
    BOOK_HEADINGS,
    BOOK_THOUGHT_PREFIX,
} from '../../core/constants';
import { joinTextLines, splitTextLines } from '../../core/lineEndings';
import { ChoiceModal, TextAreaModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import { allBookMocs, bookNameOf, isArchivedBook, isBookMoc } from './identity';
import {
    coalesceHighlights,
    highlightKey,
    normalizedHighlightKey,
} from './highlightIdentity';
import { parseHighlightExport } from './parsers';
import type { ParsedBook, ParsedHighlight } from './parsers';
import {
    chapterHeadingLine,
    highlightLines,
    legacyThoughtLine,
    thoughtLines,
} from './templates';

// ============================================================
// 文案
// ============================================================

const MESSAGES = {
    noBooks: '还没有任何读书笔记。先运行「新建读书笔记」建一本，再来导入。',
    pickBook: '导入到哪本书？',
    pasteTitle: '粘贴划线',
    pasteHint:
        '把从微信读书（笔记页 → 分享 → 复制到剪贴板）、Kindle（My Clippings.txt 全文）' +
        '或苹果图书（选中划线后复制）得到的文本原样粘贴进来，Cmd/Ctrl+Enter 或点确认提交。',
    pastePlaceholder: '在此粘贴……',
    pasteEmpty: '没有粘贴任何内容，操作已取消。',
    unrecognized:
        '认不出这段文本的来源。目前支持三种官方导出：微信读书（分享 → 复制到剪贴板）、' +
        'Kindle 的 My Clippings.txt、苹果图书的选中复制。具体导出方法见库根的 README。',
    pickParsedBook: '粘贴里有好几本书的划线，导入哪一本？',
    /**
     * 取消一律出声，一句话管三个取消点（选书、粘贴、选粘贴里的哪本书）。
     *
     * 这是仓库的既有惯例——建项目连「没输名字」都要说一句「操作已取消」——
     * 而它在这条流程上格外要紧：学员可能刚粘完几百 KB 的 My Clippings，
     * 屏幕上什么都不发生的话，他分不出「取消了」和「插件卡死了」。
     * 补一句剪贴板还在，是因为那正是他此刻最想知道的下一步。
     */
    cancelled: '已取消，没有写入任何内容。刚才复制的东西还在剪贴板里，可以直接再来一次。',
    emptyBook: '解析成功，但这本书里没有一条划线。',
    /**
     * 认得出来源、却一条划线都没解析到。
     *
     * 与「认不出来源」必须是两句话：一份只含书签的 My Clippings 认得出是 Kindle，
     * 只是里面没有可导入的东西；告诉他「认不出」，他会去怀疑自己复制错了，
     * 而真正的原因是那份导出里本来就没有划线。
     */
    recognizedButEmptyPrefix: '认出这是',
    recognizedButEmptySuffix: '的导出，但里面没有可以导入的划线（书签、空条目与受版权保护的占位句不算）。',
    /** 归档过的书仍可导入（给读完的书补录划线是正当动作），但清单上要认得出来 */
    archivedSuffix: '（已归档）',
    unknownTitle: '（这段文本里没有书名）',
    titleMismatch: '这段划线看起来不是这本书的。写入不可撤销，请先确认。',
    failedPrefix: '导入划线失败：',
} as const;

// ============================================================
// 命令
// ============================================================

/** 注册「导入读书划线」命令 */
export function registerImportHighlightsCommand(ctx: ZiminosContext): void {
    ctx.commands.register(BOOK_COMMANDS.importNotes, () => {
        void runImport(ctx);
    });
}

/** 导入主流程。全程异常收敛在这里，任何失败都以中文 Notice 呈现 */
async function runImport(ctx: ZiminosContext): Promise<void> {
    try {
        const target = await resolveTargetBook(ctx);

        // 「一本书都没有」时 resolveTargetBook 已经指过路了，别再压一句「已取消」上去
        if (!target) {
            if (allBookMocs(ctx).length) new Notice(MESSAGES.cancelled);

            return;
        }

        const raw = await new TextAreaModal(ctx.app, {
            title: `${MESSAGES.pasteTitle} → 《${stripBraces(bookNameOf(target))}》`,
            hint: MESSAGES.pasteHint,
            placeholder: MESSAGES.pastePlaceholder,
        }).openAndGetValue();

        if (raw === null) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        if (!raw.trim()) {
            new Notice(MESSAGES.pasteEmpty);

            return;
        }

        const parsed = parseHighlightExport(raw);

        if (!parsed) {
            new Notice(MESSAGES.unrecognized, 10000);

            return;
        }

        if (!parsed.books.length) {
            new Notice(
                MESSAGES.recognizedButEmptyPrefix +
                    parsed.sourceLabel +
                    MESSAGES.recognizedButEmptySuffix,
                10000,
            );

            return;
        }

        const book = await resolveParsedBook(ctx, parsed.books);

        if (!book) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        if (!book.highlights.length) {
            new Notice(MESSAGES.emptyBook);

            return;
        }

        // 先在当前内容上试算一遍：零新增就不弹确认、不写盘——没有变化就不该有仪式
        const targetName = bookNameOf(target);
        const preview = mergeHighlights(await ctx.app.vault.read(target), book.highlights);

        if (!preview.added && !preview.attachedThoughts) {
            new Notice(
                `没有新增内容：${book.highlights.length} 条划线全都已经在${targetName}里。`,
            );

            return;
        }

        const confirmed = await new ImportConfirmModal(ctx.app, {
            sourceLabel: parsed.sourceLabel,
            parsedTitle: book.title,
            targetName,
            preview,
        }).openAndGetChoice();

        if (!confirmed) return;

        // 先打开这本书，再往里写——顺序反过来会踩排版模块的一条纪律：
        // 它对「没开着的笔记」排一次两秒后的整篇重写，而两秒后这篇已经在学员眼前了，
        // 于是「绝不整理你正开着的那一篇」形同虚设，整篇重排会把他正敲的中文吞掉。
        // 先打开，那次 modify 就落在「正开着的那一篇」这一支上，排版会一直等到他走开
        if (ctx.app.workspace.getActiveFile()?.path !== target.path) {
            await ctx.app.workspace.getLeaf(false).openFile(target, { active: true });
        }

        // 写入时在最新内容上重算；预览只负责授权，完成提示只认这次真实落盘的账
        let outcome: MergeOutcome | null = null;

        await ctx.app.vault.process(target, (content) => {
            const merged = mergeHighlights(content, book.highlights);

            outcome = merged;

            if (merged.content === content) return content;

            // 替人落笔，不登记自写：写进去的是用户自己的划线，书的 updated 应当照记（见 core/guard）
            return merged.content;
        });

        if (!outcome) throw new Error('划线合并没有返回结果');

        new Notice(describeImported(outcome, targetName));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(MESSAGES.failedPrefix + message);
    }
}

/**
 * 落笔之后说一句人话。
 *
 * 不能只报 added：一次「补挂想法」的导入 added 恰恰是 0（划线全都已经在了，
 * 新的只有想法），报「已导入 0 条划线」会让学员判定这次失败、回头再导一次——
 * 而第二次因为想法也已存在，会撞上「没有新增内容」，把误判坐得更实。
 */
function describeImported(outcome: MergeOutcome, targetName: string): string {
    if (!outcome.added && !outcome.attachedThoughts) {
        return `确认期间${targetName}已被其他同步补齐，没有重复写入。`;
    }

    const parts: string[] = [];

    if (outcome.added) parts.push(`${outcome.added} 条划线`);
    if (outcome.attachedThoughts) parts.push(`${outcome.attachedThoughts} 条想法`);

    return `已导入 ${parts.join(' 与 ')}到${targetName}。`;
}

/** 站在书的 MOC 上就用它；站在别处则从全库的书里选一本 */
async function resolveTargetBook(ctx: ZiminosContext): Promise<TFile | null> {
    const active = ctx.app.workspace.getActiveFile();

    if (active && isBookMoc(ctx, active)) return active;

    const books = allBookMocs(ctx);

    if (!books.length) {
        new Notice(MESSAGES.noBooks);

        return null;
    }

    // 这一层的取消由调用方汇报：三个取消点说同一句话，不必各写一遍

    return new ChoiceModal(ctx.app, {
        title: MESSAGES.pickBook,
        items: books,
        // 归档的书照样能选（给读完的书补录划线是正当动作），但要一眼认得出来
        labelOf: (file) =>
            isArchivedBook(ctx, file)
                ? `${bookNameOf(file)}${MESSAGES.archivedSuffix}`
                : bookNameOf(file),
    }).openAndGetChoice();
}

/** My Clippings 含全部书；多于一本时让学员点选，绝不按书名相似度替他猜 */
async function resolveParsedBook(
    ctx: ZiminosContext,
    books: readonly ParsedBook[],
): Promise<ParsedBook | null> {
    if (books.length === 1) return books[0];

    return new ChoiceModal(ctx.app, {
        title: MESSAGES.pickParsedBook,
        items: books,
        labelOf: (book) =>
            `${book.title || '（没有书名）'}　—　${book.highlights.length} 条`,
    }).openAndGetChoice();
}

/** 《书名》用于「导入到哪」的弹窗标题时剥掉书名号，避免《《书名》》式的叠套 */
function stripBraces(name: string): string {
    const inner = /^《(.+)》$/.exec(name);

    return inner ? inner[1] : name;
}

/** 比对两个书名时的归一形态：剥掉书名号与全部空白，只留「是不是同一本书」这件事 */
function normalizedTitle(name: string): string {
    return stripBraces(name.trim()).replace(/\s+/g, '');
}

// ============================================================
// 合并与去重（纯函数）
// ============================================================

/** 小节里一条既有划线：它在第几行，以及它名下已经有哪些想法（键已归一） */
interface ExistingHighlight {
    /** 原始行号；-1 表示「本批次刚加的，还没有真实行号」 */
    line: number;
    readonly thoughts: Set<string>;
    /**
     * 它是不是 v0.14.0 之前那种缩进列表形态。
     *
     * 补挂想法必须按**那条划线自己的形态**落笔：往旧笔记的列表行下面塞一块标注，
     * 会得到一条既不属于列表也不属于引用的孤儿行。老库不迁移是刻意的——
     * 「只增不删不改」这条承诺对已经写下的笔记同样成立。
     */
    readonly legacy: boolean;
}

/** 一次合并的结果与账目 */
export interface MergeOutcome {
    readonly content: string;
    /** 新落盘的划线（含独立想法行）条数 */
    readonly added: number;
    /** 已存在而跳过的条数 */
    readonly skipped: number;
    /** 补挂到既有划线名下的想法条数 */
    readonly attachedThoughts: number;
}

/** 小节的边界：下一个一二级标题。章节是三级标题，属于小节内部 */
const SECTION_BOUNDARY = /^#{1,2}\s/;

/** 顶层划线行 */
/** 一条标注块的头行判定：`> [!quote]`，或嵌了 depth 层 `> ` 之后的 `> [!note]` */
function isCalloutHead(line: string, callout: string, depth = 0): boolean {
    return line.trim().startsWith('> '.repeat(depth) + callout);
}

/** 剥掉 depth 层引用标记，交出正文 */
function stripQuote(line: string, depth: number): string {
    let body = line.trim();

    for (let level = 0; level < depth; level += 1) {
        body = body.replace(/^>\s?/, '');
    }

    return body.trim();
}

/** 独立想法条目的键前缀，与 highlightKey 共用 */
const THOUGHT_MARKER = BOOK_THOUGHT_PREFIX.trim();

const TOP_BULLET = /^- /;

/** 缩进一层的想法行 */
const NESTED_BULLET = /^[ \t]+- /;

/**
 * 把一批解析出的划线合并进「全部划线」小节，只增不删不改。
 *
 * 标题被学员删了就在文末重建——位置不理想好过拒绝写入，与 insertIntoSection 同一条法。
 * 新划线插进它所属章节块的末尾，章节不存在就在小节末尾新开一块；
 * 小节里若出现围栏（学员挪过 base 块），插入点一律停在围栏之前。
 * 全部插入点按原始行号计算、从后往前落刀，因此既有行一个都不动。
 */
export function mergeHighlights(
    content: string,
    incoming: readonly ParsedHighlight[],
): MergeOutcome {
    // 先把本批重复键归并：同一条划线后来才带来的想法不能被先到的空记录吃掉。
    const highlights = coalesceHighlights(incoming);
    const split = splitTextLines(content);
    const lineEnding = split.lineEnding;
    let lines = split.lines;
    let headingIndex = lines.findIndex((line) => line.trim() === BOOK_HEADINGS.highlights);

    if (headingIndex < 0) {
        const rebuilt = joinTextLines(
            [content.replace(/\s*$/, ''), '', BOOK_HEADINGS.highlights, ''],
            lineEnding,
        );

        lines = splitTextLines(rebuilt).lines;
        headingIndex = lines.findIndex((line) => line.trim() === BOOK_HEADINGS.highlights);
    }

    // 小节终点：下一个一二级标题或任何围栏
    let sectionEnd = lines.length;

    for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
        if (SECTION_BOUNDARY.test(lines[cursor]) || isFenceLine(lines[cursor])) {
            sectionEnd = cursor;
            break;
        }
    }

    // 盘点既有内容：划线键 → 它那一条的行号与它名下已有的想法，章节名 → 标题行号
    const existingHighlights = new Map<string, ExistingHighlight>();
    const chapterHeadingAt = new Map<string, number>();
    /** 正在收拢想法的那条划线。想法属于它上面最近的那条顶层行，不属于整个小节 */
    let owner: ExistingHighlight | null = null;

    for (let cursor = headingIndex + 1; cursor < sectionEnd; cursor += 1) {
        const raw = lines[cursor];

        if (raw.startsWith(BOOK_CHAPTER_PREFIX)) {
            // 键要归一：章节标题同样会被排版整理改写（「第1章 A的意义」→「第 1 章 A 的意义」），
            // 不归一的话每导入一次就新开一个同名章节块，同一章在页面上被切成好几段。
            // 这与划线键归一是同一条理由，漏了章节名是两套判据的不对称
            chapterHeadingAt.set(
                normalizedHighlightKey(raw.slice(BOOK_CHAPTER_PREFIX.length)),
                cursor,
            );
            owner = null;
            continue;
        }

        // ── 新形态：标注块。`> [!quote]` 起一条划线，正文在紧接着的那一行 ──
        if (isCalloutHead(raw, BOOK_CALLOUTS.highlight)) {
            const body = lines[cursor + 1] ?? '';

            owner = { line: cursor + 1, thoughts: new Set<string>(), legacy: false };
            existingHighlights.set(keyOfLineBody(stripQuote(body, 1)), owner);
            cursor += 1;
            continue;
        }

        // 嵌一层的备注块是上面那条划线的想法；顶层的是一条没有划线的独立笔记
        if (isCalloutHead(raw, BOOK_CALLOUTS.thought, 1)) {
            owner?.thoughts.add(
                normalizedHighlightKey(stripQuote(lines[cursor + 1] ?? '', 2)),
            );
            cursor += 1;
            continue;
        }

        if (isCalloutHead(raw, BOOK_CALLOUTS.thought)) {
            const body = normalizedHighlightKey(stripQuote(lines[cursor + 1] ?? '', 1));

            owner = { line: cursor + 1, thoughts: new Set([body]), legacy: false };
            existingHighlights.set(body ? THOUGHT_MARKER + body : '', owner);
            cursor += 1;
            continue;
        }

        // ── 旧形态：缩进列表（v0.14.0 之前建的书）。只读不写，读得懂才不会重复导入 ──
        if (TOP_BULLET.test(raw)) {
            owner = { line: cursor, thoughts: new Set<string>(), legacy: true };
            existingHighlights.set(keyOfLineBody(raw.slice(2).trim()), owner);
            continue;
        }

        if (NESTED_BULLET.test(raw)) {
            owner?.thoughts.add(
                normalizedHighlightKey(stripThoughtPrefix(raw.replace(NESTED_BULLET, '').trim())),
            );
        }
    }

    // 小节尾部的插入点：回退掉尾随空行，与 insertIntoSection 同法
    let sectionTail = sectionEnd;

    while (sectionTail > headingIndex + 1 && lines[sectionTail - 1].trim() === '') sectionTail -= 1;

    /**
     * 无章节划线的落点：第一个章节标题之前那一段的末尾；一个章节都没有时就是小节末尾。
     *
     * 不能一律追加到小节末尾——小节末尾往往正是最后一个章节块的内部，
     * 追加进去，这条划线在页面上就长在那一章名下了。Kindle 与苹果图书都不给章节，
     * 而同一本书很可能先从微信读书导过一次（带章节），于是这不是边角情形。
     */
    let chapterlessTail = sectionTail;

    for (let cursor = headingIndex + 1; cursor < sectionEnd; cursor += 1) {
        if (!lines[cursor].startsWith(BOOK_CHAPTER_PREFIX)) continue;

        chapterlessTail = cursor;

        while (
            chapterlessTail > headingIndex + 1 &&
            lines[chapterlessTail - 1].trim() === ''
        ) {
            chapterlessTail -= 1;
        }

        break;
    }

    /** 章节块的插入点：块内容之后、下一个章节或小节终点之前 */
    const chapterTail = (headingLine: number): number => {
        let end = sectionEnd;

        for (let cursor = headingLine + 1; cursor < sectionEnd; cursor += 1) {
            if (lines[cursor].startsWith(BOOK_CHAPTER_PREFIX) || isFenceLine(lines[cursor])) {
                end = cursor;
                break;
            }
        }

        while (end > headingLine + 1 && lines[end - 1].trim() === '') end -= 1;

        return end;
    };

    /**
     * 全部插入按原始行号登记，同一行号上分两格：想法在前、新划线在后。
     *
     * 两者会算出同一个数：既有划线是本段最后一行时，它后面那个位置既是「本段的追加位」，
     * 也是「它自己的想法位」。混在一个桶里按登记先后拼接的话，
     * 排在前面的新划线会先落地，那条缩进的想法就挂到了刚插进去的**新划线**名下——
     * 想法是学员亲手打的字，挂错主人不报错，事后也看不出来。
     */
    const inserts = new Map<number, { thoughts: string[]; lines: string[] }>();
    const bucketAt = (at: number): { thoughts: string[]; lines: string[] } => {
        const bucket = inserts.get(at) ?? { thoughts: [], lines: [] };

        inserts.set(at, bucket);

        return bucket;
    };
    const pushThought = (at: number, extra: readonly string[]): void => {
        bucketAt(at).thoughts.push(...extra);
    };
    const pushInsert = (at: number, extra: readonly string[]): void => {
        bucketAt(at).lines.push(...extra);
    };

    /** 本次新开的章节块，首见顺序即落盘顺序 */
    const freshChapters = new Map<string, string[]>();
    let added = 0;
    let skipped = 0;
    let attachedThoughts = 0;

    for (const highlight of highlights) {
        const key = highlightKey(highlight);

        if (!key) continue;

        const existing = existingHighlights.get(key);

        if (existing) {
            skipped += 1;

            // 划线已在、想法是新的：补挂到那条划线名下，排在它已有的想法之后。
            // 「是不是新的」只问这条划线自己有没有过这句话——拿整个小节的想法当判据的话，
            // 「重要」「同意」这类短评一旦在别处出现过，学员这次写的就被静默丢掉了
            if (highlight.text && existing.line >= 0) {
                const fresh = highlight.thoughts.filter(
                    (thought) => !existing.thoughts.has(normalizedHighlightKey(thought)),
                );

                if (fresh.length) {
                    let at = existing.line + 1;
                    const rendered: string[] = [];

                    // 补挂要按**那条划线自己的形态**落笔：旧笔记里的划线是列表行，
                    // 往它下面塞一块标注会得到一条既不属于列表也不属于引用的孤儿
                    if (existing.legacy) {
                        while (at < sectionEnd && NESTED_BULLET.test(lines[at])) at += 1;

                        for (const thought of fresh) rendered.push(legacyThoughtLine(thought));
                    } else {
                        // 走到块尾：同一块引用里的行都以 `>` 打头，空行即分界
                        while (at < sectionEnd && lines[at].startsWith('>')) at += 1;

                        for (const thought of fresh) rendered.push(...thoughtLines(thought));
                    }

                    pushThought(at, rendered);

                    for (const thought of fresh) {
                        existing.thoughts.add(normalizedHighlightKey(thought));
                    }

                    attachedThoughts += fresh.length;
                }
            }

            continue;
        }

        // coalesceHighlights 已保证本批一个身份只到达一次。
        // 行号 -1 只表示「本次刚加、还没有真实行号」，防御后续逻辑误当成旧行补挂。
        existingHighlights.set(key, {
            line: -1,
            thoughts: new Set(highlight.thoughts.map(normalizedHighlightKey)),
            legacy: false,
        });

        const rendered = highlightLines(highlight);
        const chapter = highlight.chapter.trim();

        added += 1;

        if (!chapter) {
            pushInsert(chapterlessTail, rendered);
            continue;
        }

        // 查表用归一键，写标题用原文：认得出排版整理改写过的旧标题，新开的块仍写导出里的原名
        const chapterKey = normalizedHighlightKey(chapter);
        const headingLine = chapterHeadingAt.get(chapterKey);

        if (headingLine !== undefined) {
            pushInsert(chapterTail(headingLine), rendered);
            continue;
        }

        const block = freshChapters.get(chapterKey) ?? ['', chapterHeadingLine(chapter)];

        block.push(...rendered);
        freshChapters.set(chapterKey, block);
    }

    for (const block of freshChapters.values()) pushInsert(sectionTail, block);

    // 从后往前落刀，前面的行号才不会漂；同一行号上想法先落，新划线后落
    const positions = [...inserts.keys()].sort((left, right) => right - left);

    for (const at of positions) {
        const bucket = inserts.get(at);

        if (bucket) lines.splice(at, 0, ...bucket.thoughts, ...bucket.lines);
    }

    return { content: joinTextLines(lines, lineEnding), added, skipped, attachedThoughts };
}

/** 这一行是不是代码围栏的起止（容忍缩进） */
function isFenceLine(line: string): boolean {
    return line.replace(/^\s+/, '').startsWith('```');
}

/** 一条既有顶层行的键，规则与 highlightKey 严格对偶 */
function keyOfLineBody(body: string): string {
    const marker = BOOK_THOUGHT_PREFIX.trim();

    if (body.startsWith(marker)) {
        return marker + normalizedHighlightKey(body.slice(marker.length));
    }

    return normalizedHighlightKey(body);
}

/** 剥掉想法行的图形前缀 */
function stripThoughtPrefix(body: string): string {
    const marker = BOOK_THOUGHT_PREFIX.trim();

    return body.startsWith(marker) ? body.slice(marker.length).trim() : body;
}

// ============================================================
// 确认弹窗
// ============================================================

/** 确认框要说清的四件事 */
interface ImportSummary {
    readonly sourceLabel: string;
    readonly parsedTitle: string;
    readonly targetName: string;
    readonly preview: MergeOutcome;
}

/**
 * 导入确认弹窗：来源、识别出的书、写到哪、写多少，一次说清。
 * 学员在这里点确认，才是整个流程唯一的授权点——之后的写入不再询问。
 */
class ImportConfirmModal extends Modal {
    private readonly summary: ImportSummary;

    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    private resolver: ((value: boolean) => void) | null = null;

    /** 按钮结算与关闭结算都会走到 settle，用它保证只生效一次 */
    private settled = false;

    constructor(app: App, summary: ImportSummary) {
        super(app);
        this.summary = summary;
    }

    /** 打开弹窗并等待授权：确认返回 true，其余一切关闭路径返回 false */
    openAndGetChoice(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        const { sourceLabel, parsedTitle, targetName, preview } = this.summary;
        // 「识别出的书」与「要写入的书」对不上，是这条流程唯一会造成不可撤销损失的岔路：
        // 写入只增不删，一整本书的划线落错地方就只能手工删。归一到「去掉书名号与空白」再比，
        // 免得《书名》与书名这种纯写法差异天天报警
        const mismatched =
            !!parsedTitle && normalizedTitle(parsedTitle) !== normalizedTitle(targetName);

        this.titleEl.setText('确认导入划线');
        this.contentEl.empty();

        const summary = this.contentEl.createDiv();

        summary.style.padding = '12px 14px';
        summary.style.borderRadius = '10px';
        summary.style.background = 'var(--background-secondary)';
        summary.style.border = '1px solid var(--background-modifier-border)';

        this.renderRow(summary, '来源', sourceLabel);
        // 认不出书名时也照样画这一行：空着会让学员无从判断插件到底认出了什么，只能盲点确认
        this.renderRow(summary, '识别出', parsedTitle ? `《${parsedTitle}》` : MESSAGES.unknownTitle);
        this.renderRow(summary, '写入', targetName, true);

        if (mismatched) {
            const warning = this.contentEl.createDiv({ text: `⚠️ ${MESSAGES.titleMismatch}` });

            warning.style.marginTop = '12px';
            warning.style.padding = '10px 12px';
            warning.style.borderRadius = '8px';
            warning.style.lineHeight = '1.6';
            warning.style.color = 'var(--text-warning)';
            warning.style.background = 'var(--background-modifier-error-hover)';
        }

        const counts = [`新增 ${preview.added} 条`];

        if (preview.skipped) counts.push(`跳过 ${preview.skipped} 条已有`);
        if (preview.attachedThoughts) counts.push(`补挂 ${preview.attachedThoughts} 条想法`);

        this.renderRow(summary, '数量', counts.join(' · '));

        const buttonBar = this.contentEl.createDiv();

        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '18px';

        new ButtonComponent(buttonBar).setButtonText('取消').onClick(() => this.settle(false));

        new ButtonComponent(buttonBar)
            .setButtonText('确认导入')
            .setCta()
            .onClick(() => this.settle(true));
    }

    onClose(): void {
        // Esc、遮罩点击、取消按钮最终都汇到这里；未经确认即视为放弃本次导入
        this.settle(false);
        this.contentEl.empty();
    }

    /** 一行「标签 + 值」 */
    private renderRow(parent: HTMLElement, label: string, value: string, emphasize = false): void {
        const row = parent.createDiv();

        row.style.display = 'grid';
        row.style.gridTemplateColumns = '4em minmax(0, 1fr)';
        row.style.gap = '10px';
        row.style.padding = '5px 0';

        const labelEl = row.createDiv({ text: label });

        labelEl.style.color = 'var(--text-muted)';

        const valueEl = row.createDiv({ text: value });

        valueEl.style.overflowWrap = 'anywhere';
        valueEl.style.lineHeight = '1.5';

        if (emphasize) {
            valueEl.style.fontWeight = '600';
            valueEl.style.color = 'var(--text-normal)';
        }
    }

    /** 唯一结算点，保证 Promise 只被兑现一次 */
    private settle(value: boolean): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;

        this.resolver = null;

        if (resolve) resolve(value);

        this.close();
    }
}
