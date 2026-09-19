/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile 类型；依赖 core/commands 的 BOOK_COMMANDS、
 *          core/constants 的 FIELDS/FOLDERS、core/folders 的 ensureFolderPath、
 *          core/editDebts 的 isNoteInFront、core/time 的 nowStamp、core/types 的 ZiminosContext；
 *          依赖同目录 librarySources 的三份来源规格、libraryModal 的三态弹窗、
 *          titleMatch 的 matchByTitle、identity 的 allBookMocs/bookNameOf、
 *          importHighlights 的 mergeHighlights、createBook 的书名号规则与 BookContainerCreator
 * [OUTPUT]: 对外提供 registerLibraryImportCommands（三条整架导入命令）
 * [POS]: 「把一个来源里全部有划线的书端进来」这件事的唯一实现，三条命令共用它。
 *
 *        它与 readBook 那条主干命令的分工，值得说清楚：那一条是**从书出发**
 *        （我要读这本书 → 查豆瓣 → 建档 → 找划线），这一条是**从划线出发**
 *        （我在那边划过的所有书 → 逐本落库）。方向相反，因此中间那一步也相反——
 *        那一条必须查豆瓣（它就是靠豆瓣认出这是哪一本），这一条**一次都不查**。
 *        八十本书就是一百六十次豆瓣请求，几十次之后必被拦；而被拦的后果不是「慢一点」，
 *        是一半的书有封面一半没有，且谁也说不清断在哪一本。
 *        书目因此整件交给「补齐书籍信息」——那条命令一次只查一本，由人按着走。
 *
 *        五条纪律写在这里，每一条都对应一种会让学员发现不了的坏结果：
 *        其一，**已经在库里的书只补划线，绝不重建**——认书靠 titleMatch 那把全模块共用的尺子；
 *        其二，**正开着的那一篇一个字都不写**（core/editDebts 的判据），
 *        否则 Obsidian 会弹「已被外部修改」并把他正在编辑的那篇整份重灌；
 *        其三，**撞名不改名**，留一本《人类简史 2》比少导一本更难收拾；
 *        其四，**取回零条就不建档**——微信读书的书架里混着只加过书签的书，
 *        而筛子只能落在实际取回了什么上，不能落在任何一个计数字段上；
 *        其五，**每一本独立落盘**，因此随时可以停、可以关掉 Obsidian、可以明天再跑一次，
 *        不需要任何断点状态文件——只有补不回来的事实才需要存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { BOOK_COMMANDS } from '../../core/commands';
import { FIELDS, FOLDERS } from '../../core/constants';
import { isNoteInFront } from '../../core/editDebts';
import { ensureFolderPath } from '../../core/folders';
import { nowStamp } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import type { BookContainerCreator } from './createBook';
import { unwrapBookTitle, wrapBookTitle } from './createBook';
import { allBookMocs, bookNameOf } from './identity';
import { mergeHighlights } from './importHighlights';
import { LIBRARY_SOURCES } from './librarySources';
import type { LibraryBook, LibrarySource } from './librarySources';
import { LibraryImportModal } from './libraryModal';
import type { LibraryImportSummaryLine } from './libraryModal';
import { matchByTitle } from './titleMatch';

const MESSAGES = {
    listing: (label: string) => `正在读取 ${label} 的书目……`,
    listFailed: (label: string) => `读取 ${label} 的书目失败：`,
    nothing: (label: string) =>
        `${label} 里没有找到有划线或笔记的书。读一阵子再回来，或者换一个来源试试。`,
    reportIntro:
        '这是一次批量导入的账目。上面的事处理完就可以把这篇删掉——' +
        '导入可以反复跑，再跑一次只会补新的划线，不会重复写。',
} as const;

// ============================================================
// 注册
// ============================================================

/** 注册三条整架导入命令。加一个来源 = librarySources 多一条规格 + 这里多一行 */
export function registerLibraryImportCommands(
    ctx: ZiminosContext,
    create: BookContainerCreator,
): void {
    const pairs = [
        [BOOK_COMMANDS.importWeread, LIBRARY_SOURCES.weread],
        [BOOK_COMMANDS.importKindle, LIBRARY_SOURCES.kindle],
        [BOOK_COMMANDS.importApple, LIBRARY_SOURCES.apple],
    ] as const;

    for (const [command, source] of pairs) {
        ctx.commands.register(command, () => {
            void runLibraryImport(ctx, source, create).catch((error) => {
                new Notice(`导入${source.label}失败：${describe(error) || '未知错误'}`, 10000);
            });
        });
    }
}

// ============================================================
// 主流程
// ============================================================

async function runLibraryImport(
    ctx: ZiminosContext,
    source: LibrarySource,
    create: BookContainerCreator,
): Promise<void> {
    if (!source.available(ctx)) {
        new Notice(source.unavailableHint, 12000);

        return;
    }

    // ============================================================
    // 1. 枚举：问来源「你那儿都有些什么」
    // ============================================================

    const listing = new Notice(MESSAGES.listing(source.label), 0);
    let books: readonly LibraryBook[];

    try {
        books = await source.list(ctx);
    } catch (error) {
        new Notice(MESSAGES.listFailed(source.label) + describe(error), 10000);

        return;
    } finally {
        // 无限时长的提示必须由 finally 收掉，失败也不把「正在读取」永远留在屏幕上
        listing.hide();
    }

    if (!books.length) {
        new Notice(MESSAGES.nothing(source.label), 10000);

        return;
    }

    // ============================================================
    // 2. 与库里已有的书对账：认书靠全模块共用的那把尺子
    // ============================================================

    // 书架随导入生长：同一批里可能有两个写法指向同一本书（Kindle 上带不带副标题就是两条），
    // 拿一份冻住的快照去比，第二个写法会撞上刚刚建出来的那个目录并整本失败，
    // 而它本该是「这本已经有了，补划线」
    const shelf = shelfOf(ctx);
    const existingCount = books.filter((book) => findOnShelf(shelf, book)).length;

    // ============================================================
    // 3. 唯一的授权点：他在这里点「开始导入」，之后不再询问
    // ============================================================

    const ui = new LibraryImportModal(ctx.app, {
        sourceLabel: source.label,
        total: books.length,
        fresh: books.length - existingCount,
        existing: existingCount,
    });

    if (!(await ui.openAndConfirm())) return;

    // ============================================================
    // 4. 逐本落库。顺序就是来源给的顺序——重排是我们的发明，不是它的事实
    // ============================================================

    const ledger = emptyLedger();
    let done = 0;

    for (const book of books) {
        if (ui.stopped) {
            ledger.stopped = true;
            break;
        }

        done += 1;
        await ui.advance(done, book.title);

        try {
            // 每一本现问一次书架，而不是用循环开始前那份快照
            const line = await importOne(ctx, book, shelf, create, ledger);

            if (line) ui.note(line);
        } catch (error) {
            const reason = describe(error) || '未知错误';

            ledger.untouched.push({ name: book.title, reason });
            ui.note(`《${book.title}》没有导入：${reason}`);
        }

        if (source.pacingMs) await pause(source.pacingMs);
    }

    // ============================================================
    // 5. 账目落成一篇笔记：跑完八十本，一条 Notice 说不完
    // ============================================================

    const report = await writeReport(ctx, source, ledger);

    ui.showResult(
        summaryOf(ledger),
        report ? () => void ctx.app.workspace.getLeaf(false).openFile(report) : null,
    );
}

// ============================================================
// 一本书
// ============================================================

/** 处理一本书，返回一句要显示在进度条下面的交代（没有就返回空） */
async function importOne(
    ctx: ZiminosContext,
    book: LibraryBook,
    shelf: ShelfBook[],
    create: BookContainerCreator,
    ledger: Ledger,
): Promise<string> {
    const { highlights, note } = await book.read();

    if (note) ledger.notes.push(`《${book.title}》${note}`);

    // 取回零条就不建档：微信读书的书架里混着只加过书签的书，
    // 为它们建一个空壳，学员回头要一本本删
    if (!highlights.length) {
        ledger.empty += 1;

        return note ? `《${book.title}》${note}` : '';
    }

    let moc = findOnShelf(shelf, book);
    let created = false;

    if (!moc) {
        const folderName = safeFolderName(book.title);

        if (!folderName) throw new Error('书名里没有可用作文件夹名的字符');

        const aliases = aliasesOf(book.title, folderName);

        // quiet：不打开文件、不聚焦、不弹 Notice、撞名不改名，失败抛出由上面记账
        moc = await create({
            name: wrapBookTitle(folderName),
            aliases,
            description: '',
            ...(book.author ? { author: book.author } : {}),
            quiet: true,
        });

        if (!moc) throw new Error('建档没有返回文件');

        // 立刻上架：同一批里另一个写法指向这本书时，那一条要认得出它
        shelf.push({ titles: [folderName, ...aliases], author: book.author, file: moc });
        created = true;
    }

    // 正开着的那一篇一个字都不写：此刻它的编辑器可能捏着没保存的改动，
    // 写盘会让 Obsidian 三方合并并把整篇重灌（v0.33.0 修过的那件事）
    if (!created && isNoteInFront(ctx.app, moc.path)) {
        ledger.untouched.push({
            name: book.title,
            reason: '这一篇正开着，没有动它。关掉它之后再跑一次就会补上。',
        });

        return `《${book.title}》正开着，跳过了`;
    }

    const outcome = await mergeInto(ctx, moc, highlights);
    const record = { name: book.title, path: moc.path, added: outcome.added, thoughts: outcome.attachedThoughts };

    if (created) ledger.created.push(record);
    else if (outcome.added || outcome.attachedThoughts) ledger.updated.push(record);
    else ledger.unchanged += 1;

    return '';
}

/** 划线合并：写的是用户自己的划线，所以不登记自写，书的 updated 照记（见 core/guard） */
async function mergeInto(
    ctx: ZiminosContext,
    moc: TFile,
    highlights: Parameters<typeof mergeHighlights>[1],
): Promise<{ added: number; attachedThoughts: number }> {
    const run: { added: number; attachedThoughts: number } = { added: 0, attachedThoughts: 0 };

    await ctx.app.vault.process(moc, (content) => {
        const outcome = mergeHighlights(content, highlights);

        run.added = outcome.added;
        run.attachedThoughts = outcome.attachedThoughts;

        // 幂等同步不制造虚假的文件变更事件
        return outcome.content === content ? content : outcome.content;
    });

    return run;
}

// ============================================================
// 库里已有哪些书
// ============================================================

interface ShelfBook {
    readonly titles: readonly string[];
    readonly author: string;
    readonly file: TFile;
}

/** 这本来源里的书在库里有没有对应的一本 */
function findOnShelf(shelf: readonly ShelfBook[], book: LibraryBook): TFile | null {
    return matchByTitle(shelf, { titles: [book.title], author: book.author })?.file ?? null;
}

/**
 * 库里每一本书**已知的全部名字**。
 *
 * 不止文件夹名：aliases 里躺着带副标题的全名，而设备那头写的往往正是那个。
 * 只拿文件夹名去比，《思维》这类主书名极短的书每次都会被判成「库里没有」，
 * 于是每导一次就多建一本。
 */
function shelfOf(ctx: ZiminosContext): ShelfBook[] {
    return allBookMocs(ctx).map((file) => {
        const frontmatter = ctx.app.metadataCache.getFileCache(file)?.frontmatter;
        const declared = frontmatter?.[FIELDS.aliases];
        const aliases = (Array.isArray(declared) ? declared : [declared])
            .map((value) => String(value ?? '').trim())
            .filter(Boolean);

        return {
            titles: [unwrapBookTitle(bookNameOf(file)), ...aliases],
            author: String(frontmatter?.author ?? '').trim(),
            file,
        };
    });
}

// ============================================================
// 书名
// ============================================================

/**
 * 文件名里放不得的字符。
 *
 * 前六个是 Windows 的，`#^[]|` 是 Obsidian 的——它们在链接语法里有含义，
 * 留在文件名里会让双链在某些位置断掉而不报错。
 * 一律换成空格而不是全角替身：替身是我们发明的写法，而空格只是少了一个字符。
 * 真实书名原样留在 aliases 里，一个字都没丢。
 */
const UNSAFE_NAME = /[\\/:*?"<>|#^[\]]/g;

function safeFolderName(title: string): string {
    return title
        .replace(UNSAFE_NAME, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[.\s]+/, '')
        .replace(/[.\s]+$/, '')
        .trim();
}

/**
 * 这本书要登记哪些别名。
 *
 * 真实书名永远是第一个；文件夹名被清洗过时把它也记上，
 * 于是下一次导入无论拿哪个名字来比都认得出这是同一本。
 */
function aliasesOf(title: string, folderName: string): readonly [string, ...string[]] {
    const real = unwrapBookTitle(title) || folderName;

    return real === folderName ? [real] : [real, folderName];
}

// ============================================================
// 账目
// ============================================================

interface LedgerRecord {
    readonly name: string;
    readonly path: string;
    readonly added: number;
    readonly thoughts: number;
}

interface Ledger {
    created: LedgerRecord[];
    updated: LedgerRecord[];
    untouched: { name: string; reason: string }[];
    notes: string[];
    /** 取回零条划线的（只加过书签的书） */
    empty: number;
    /** 已经是最新、这次一个字没写的 */
    unchanged: number;
    stopped: boolean;
}

function emptyLedger(): Ledger {
    return { created: [], updated: [], untouched: [], notes: [], empty: 0, unchanged: 0, stopped: false };
}

/** 结果态弹窗上的那几行 */
function summaryOf(ledger: Ledger): readonly LibraryImportSummaryLine[] {
    const lines: LibraryImportSummaryLine[] = [
        { label: '新建', value: `${ledger.created.length} 本`, warn: false },
        { label: '补划线', value: `${ledger.updated.length} 本` },
    ];

    if (ledger.unchanged) lines.push({ label: '已是最新', value: `${ledger.unchanged} 本` });
    if (ledger.empty) lines.push({ label: '只有书签', value: `${ledger.empty} 本，没有建档` });
    if (ledger.untouched.length) {
        lines.push({ label: '没导入', value: `${ledger.untouched.length} 本，见报告`, warn: true });
    }
    if (ledger.notes.length) {
        lines.push({ label: '来源交代', value: `${ledger.notes.length} 条，见报告`, warn: true });
    }
    if (ledger.stopped) lines.push({ label: '状态', value: '你中途停了，已写入的都保留着', warn: true });

    return lines;
}

// ============================================================
// 报告
// ============================================================

/**
 * 把账目写成收件箱里的一篇笔记。
 *
 * 为什么不是一条 Notice：跑完八十本书要说的是四类事实（建了哪些、补了哪些、
 * 哪些没动、来源有什么交代），而其中两类是**他之后要去处理的**。
 * 一条会自己消失的提示装不下待办。
 *
 * 报告是机器写的文件，因此登记自写——它不是用户的笔记，不该让排版与 updated 记账把它当成人的编辑。
 */
async function writeReport(
    ctx: ZiminosContext,
    source: LibrarySource,
    ledger: Ledger,
): Promise<TFile | null> {
    const lines: string[] = [];
    const stamp = nowStamp('YYYY-MM-DD HH:mm');

    lines.push(`# 读书笔记导入 · ${source.label} · ${stamp}`, '');
    lines.push(`> [!info] ${MESSAGES.reportIntro}`, '');

    if (ledger.stopped) {
        lines.push('> [!warning] 这次是中途停下的，剩下的书还没轮到。再跑一次会接着做。', '');
    }

    section(lines, `已建档并写入（${ledger.created.length} 本）`, ledger.created.map(recordLine));
    section(lines, `库里已有，补了新划线（${ledger.updated.length} 本）`, ledger.updated.map(recordLine));

    if (ledger.untouched.length) {
        section(
            lines,
            `没有导入（${ledger.untouched.length} 本）`,
            ledger.untouched.map((item) => `- 《${item.name}》—— ${item.reason}`),
        );
    }

    if (ledger.notes.length) {
        section(lines, `来源的交代（${ledger.notes.length} 条）`, ledger.notes.map((note) => `- ${note}`));
    }

    if (ledger.empty || ledger.unchanged) {
        const skipped: string[] = [];

        if (ledger.empty) skipped.push(`${ledger.empty} 本只有书签、没有划线，没有为它们建档。`);
        if (ledger.unchanged) skipped.push(`${ledger.unchanged} 本的划线已经是最新的，一个字没写。`);

        section(lines, '另外', skipped.map((text) => `- ${text}`));
    }

    section(lines, '下一步', [
        '这些书还没有封面与书目信息。打开其中一本的 MOC，运行「**补齐书籍信息**」——',
        '那条命令一次只查一本豆瓣，慢是故意的：一口气查八十本一定会被豆瓣拦下来。',
        '',
        '每本书读完、重排、想过之后，再用「完成项目」把它归档。',
    ]);

    const folder = FOLDERS.inbox;
    const path = `${folder}/读书笔记导入-${source.label}-${nowStamp('YYYYMMDD-HHmmss')}.md`;

    try {
        await ensureFolderPath(ctx.app, folder);
        // 机器写的文件：登记自写，免得排版与 updated 记账把它当成人的编辑
        ctx.guard.mark(path);

        return await ctx.app.vault.create(path, lines.join('\n'));
    } catch {
        // 报告写不出来不该让整次导入看起来失败了——书已经在库里了，那才是正事
        return null;
    }
}

function recordLine(record: LedgerRecord): string {
    // 来源给的书名偶尔自带书名号（Kindle 上的中文书就有），不剥一层会得到《《书名》》
    const link = `[[${record.path.replace(/\.md$/i, '')}|《${unwrapBookTitle(record.name)}》]]`;
    const counts = [`${record.added} 条划线`];

    if (record.thoughts) counts.push(`${record.thoughts} 条想法`);

    return `- ${link} · ${counts.join(' · ')}`;
}

function section(lines: string[], heading: string, body: readonly string[]): void {
    if (!body.length) return;

    lines.push(`## ${heading}`, '', ...body, '');
}

// ============================================================
// 零碎
// ============================================================

/**
 * 两本之间歇一下。
 *
 * 这是流程内的一次性等待，不是定时器轮询：它有明确的起止，用户就在弹窗前等着，
 * 命令跑完它就不存在了。存在的理由写在 librarySources 的 pacingMs 上。
 */
function pause(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
