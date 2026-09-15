/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile；依赖 core/commands 的 BOOK_COMMANDS、
 *          core/modals 的 TextInputModal/ChoiceModal、
 *          core/types 的 ZiminosContext；依赖同目录 douban 的搜索与详情、
 *          isbn 的 isbnUid、tags 的 bookTags、
 *          sources 的 collectHighlightsFor、importHighlights 的 mergeHighlights、
 *          createBook 的 BookContainerCreator 洞
 * [OUTPUT]: 对外提供 registerReadBookCommand（命令 read-book：一步建书并把划线灌进去）
 * [POS]: 读书笔记模块的主干命令，也是整个模块存在的理由。
 *        它取代的是学员原本的三步：豆瓣插件建档 → 划线插件导到某个文件夹 → 手工复制粘贴汇总。
 *        那三步里有两步是机器该干的活儿：书目字段（出版社、ISBN、页数、评分）机器查得到，
 *        划线在哪台设备上机器也查得到；只有「是不是这一本」必须人来指认。
 *        因此这条命令只问两件事——书名叫什么、候选里哪一本——其余全自动：
 *        抓详情 → 建《书名》文件夹与 MOC（YAML 已填好真实书名别名与书目字段，
 *        UID 直接取这本书的 ISBN、标签直接取豆瓣的分类词）→
 *        遍历本机可用的划线来源 → 按书名认出这本书 → 划线直接落进「全部划线」小节。
 *        中间不产生任何需要学员再搬一次的中转文件，这正是「一步」的全部含义。
 *        三条异步命令共用异常边界，取数进度提示由 finally 收口；底层异常不会变成未处理拒绝，
 *        同步只在合并真正改变文本时才写盘，幂等同步不伪造文件变更事实；
 *        写进去的是用户自己的划线，所以不登记自写，书的 updated 照记
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { BOOK_COMMANDS } from '../../core/commands';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import type { BookContainerCreator } from './createBook';
import { doubanFetcher, fetchBookDetail, searchBooks } from './douban';
import type { DoubanBook, DoubanCandidate } from './douban';
import { mergeHighlights } from './importHighlights';
import type { MergeOutcome } from './importHighlights';
import { isbnUid } from './isbn';
import { bookTags } from './tags';
import { availableSourceLabels, collectHighlightsFor } from './sources';
import { loginWeread } from './sourceWeread';
import { allBookMocs, bookNameOf, isBookMoc } from './identity';

const MESSAGES = {
    namePrompt: '想读哪本书？',
    namePlaceholder: '书名，例如：卡片笔记写作法',
    nameMissing: '没有输入书名，操作已取消。',
    searching: '正在豆瓣上找这本书……',
    searchFailed: '没能连上豆瓣。检查一下网络，或者用「新建读书笔记」手动建一本。',
    noResult: '豆瓣上没找到这本书。换个书名再试，或者用「新建读书笔记」手动建一本。',
    pickBook: '是这一本吗？',
    detailFailed: '取书籍详情失败：',
    pulling: '书建好了，正在找这本书的划线……',
    noSource: '这台机器上没找到划线来源（苹果图书要在本机读过，Kindle 要插上或有 My Clippings.txt）。用「导入读书划线」粘贴也行。',
    noHighlights: '没在设备里找到这本书的划线。读一阵子再回来跑「同步这本书的划线」。',
} as const;

/** 注册「读一本书」命令 */
export function registerReadBookCommand(
    ctx: ZiminosContext,
    create: BookContainerCreator,
): void {
    ctx.commands.register(BOOK_COMMANDS.read, () => {
        runBookCommand(() => readBook(ctx, create), '读一本书失败：');
    });
}

/** 命令边界统一接住异步异常；内部步骤可以专注业务，用户仍永远得到中文收场 */
function runBookCommand(task: () => Promise<void>, failurePrefix: string): void {
    void task().catch((error) => {
        new Notice(failurePrefix + (describe(error) || '未知错误'), 10000);
    });
}

/**
 * 一步读一本书：问书名 → 选一本 → 建档 → 灌划线。
 * 任何一步失败都以中文 Notice 收场，且已经建出来的东西不回滚——
 * 书建好了但划线没拉到，那本书仍然是有用的。
 */
async function readBook(ctx: ZiminosContext, create: BookContainerCreator): Promise<void> {
    // ============================================================
    // 1. 问书名（学员的第一次、也是仅有的两次输入之一）
    // ============================================================

    const input = await new TextInputModal(ctx.app, {
        title: MESSAGES.namePrompt,
        placeholder: MESSAGES.namePlaceholder,
    }).openAndGetValue();

    if (input === null || !input.trim()) {
        new Notice(MESSAGES.nameMissing);

        return;
    }

    // ============================================================
    // 2. 搜豆瓣，让他指认哪一本（第二次、也是最后一次输入）
    // ============================================================

    const searching = new Notice(MESSAGES.searching, 0);
    let candidates: readonly DoubanCandidate[];

    try {
        candidates = await searchBooks(doubanFetcher, input.trim());
    } catch (error) {
        searching.hide();
        // 反爬拦截与断网是两回事，解析层已经把前者说成一句人话，原样转出去
        new Notice(describe(error) || MESSAGES.searchFailed, 10000);

        return;
    }

    searching.hide();

    if (!candidates.length) {
        new Notice(MESSAGES.noResult, 8000);

        return;
    }

    const chosen = await new ChoiceModal(ctx.app, {
        title: MESSAGES.pickBook,
        items: candidates,
        // 摘要那一行是豆瓣给的「作者 / 译者 / 出版社 / 年份 / 定价」，同名书全靠它分辨
        labelOf: (item) => (item.abstract ? `${item.title}　—　${item.abstract}` : item.title),
    }).openAndGetChoice();

    if (!chosen) return;

    // ============================================================
    // 3. 抓详情并建档：YAML 与书籍信息小节都已填好，学员一个字不用打
    // ============================================================

    let detail: DoubanBook;

    try {
        detail = await fetchBookDetail(doubanFetcher, chosen.id, chosen.title, chosen.abstract);
    } catch (error) {
        new Notice(MESSAGES.detailFailed + describe(error), 8000);

        return;
    }

    // ISBN 换不出数字（豆瓣没登记书号）时整项不带，容器流程自动落回时间戳 UID；
    // 标签数量设成 0 时同理——两处都不该由这里去判断「那就写个什么吧」
    const uid = isbnUid(detail.isbn);
    const tags = bookTags(detail.tags, ctx.settings.bookTagPrefix, ctx.settings.bookTagCount);
    const fullTitle = fullTitleOf(detail);
    const trueTitle = fullTitle || detail.title;

    const moc = await create({
        name: `《${detail.title}》`,
        description: detail.summary.slice(0, 120),
        ...(detail.authors.length ? { author: detail.authors[0] } : {}),
        aliases: [trueTitle],
        ...(uid === null ? {} : { uid }),
        ...(tags.length ? { tags } : {}),
        source: detail.url,
        // 书目全部进 YAML，正文只留「全部划线」一个落点。
        // ISBN 已经是 UID、豆瓣链接已经是 source，因此这里不再重复它们；
        // 豆瓣评分也不写——`rating` 是学员自己打的分，两个评分挤一个字段是在制造误读
        bibliography: {
            translators: detail.translators,
            publisher: detail.publisher,
            publishDate: detail.publishDate,
            pages: detail.pages,
            cover: detail.cover,
        },
    });

    // 建档失败（重名、名称非法、用户取消）已由容器流程给出中文 Notice，这里不再补刀
    if (!moc) return;

    // ============================================================
    // 4. 自动找划线：不问他在哪个 App 里读的，机器自己查
    // ============================================================

    // 两个名字都递过去：主书名是文件名，带副标题的全名才是设备与云端那头写的那个。
    // 只递主书名的话，《思维 : 关于决策、问题解决与预测的新科学》这类书永远匹配不上
    await pullHighlights(
        ctx,
        moc,
        fullTitle ? [detail.title, fullTitle] : [detail.title],
        detail.authors[0] ?? '',
    );
}

/**
 * 从本机可用来源取这本书的划线并合并进 MOC。
 *
 * 单独成函数是因为它还要服务第二条命令（「同步这本书的划线」）——
 * 读到一半再拉一次是常事，而那次不该重新建档。
 */
export async function pullHighlights(
    ctx: ZiminosContext,
    moc: TFile,
    names: readonly string[],
    author: string,
): Promise<void> {
    const labels = availableSourceLabels(ctx);

    if (!labels.length) {
        new Notice(MESSAGES.noSource, 10000);

        return;
    }

    const title = names[0] ?? '';
    const pulling = new Notice(MESSAGES.pulling, 0);
    let hits;

    try {
        hits = await collectHighlightsFor(ctx, names, author);
    } finally {
        // 即使未来汇流层出现未预料异常，无限时长的进度提示也必须收掉
        pulling.hide();
    }

    // 来源自己交代的「这次少了什么」，一律带到学员眼前
    const notes = hits.map((hit) => hit.note ?? '').filter(Boolean);

    // 多个来源的划线一次性合并：mergeHighlights 按归一文本去重，
    // 同一句话在手机和 Kindle 上各划过一次也只会写进去一条
    const all = hits.flatMap((hit) => [...hit.highlights]);

    // 一条都没有时不写盘、也不说「取回来了」。有交代就说交代，
    // 没交代才是真的「这本书没划过线」——两者绝不能说成同一句话
    if (!all.length) {
        new Notice(
            notes.length ? notes.join('\n') : `${MESSAGES.noHighlights}（已查过：${labels.join('、')}）`,
            12000,
        );

        return;
    }

    const mergeRun: { outcome?: MergeOutcome } = {};

    await ctx.app.vault.process(moc, (content) => {
        mergeRun.outcome = mergeHighlights(content, all);

        if (mergeRun.outcome.content === content) return content;

        // 替人落笔，不登记自写：写进去的是用户自己的划线，书的 updated 应当照记（见 core/guard）
        return mergeRun.outcome.content;
    });

    const outcome = mergeRun.outcome;

    if (!outcome) throw new Error('划线合并没有返回结果');
    // 只报真的交了东西的来源：一个只带着一句交代、零条划线的来源
    // 出现在「已从 微信读书 0 条 取回划线」里，读起来像在邀功
    const from = hits
        .filter((hit) => hit.highlights.length)
        .map((hit) => `${hit.label} ${hit.highlights.length} 条`)
        .join('、');

    const tail = notes.length ? `\n${notes.join('\n')}` : '';

    const result = !outcome.added && !outcome.attachedThoughts
        ? `划线已是最新（${from}）。`
        : !outcome.added
          ? `已从 ${from} 补进 ${outcome.attachedThoughts} 条想法。`
          : `已从 ${from} 取回划线，写进《${title}》。` +
            (outcome.attachedThoughts ? `另补进 ${outcome.attachedThoughts} 条想法。` : '');

    new Notice(
        result + tail,
        notes.length ? 12000 : 6000,
    );
}

// ============================================================
// 文本
// ============================================================

/** 带副标题的全名；没有副标题时由调用方回落主书名 */
function fullTitleOf(book: DoubanBook): string {
    return book.subtitle ? `${book.title}：${book.subtitle}` : '';
}


/** 把任意异常转成一句可读的中文尾巴 */
function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// ============================================================
// 同步：读到一半再拉一次
// ============================================================

/**
 * 注册「同步这本书的划线」。
 * 站在某本书的 MOC 上按它即可；站在别处会先让他选一本——
 * 与导入命令同一条待客之道，不因为「你站错了」就拒绝办事。
 */
export function registerSyncHighlightsCommand(ctx: ZiminosContext): void {
    ctx.commands.register(BOOK_COMMANDS.sync, () => {
        runBookCommand(() => syncCurrentBook(ctx), '同步读书划线失败：');
    });
}

async function syncCurrentBook(ctx: ZiminosContext): Promise<void> {
    const active = ctx.app.workspace.getActiveFile();
    const target =
        active && isBookMoc(ctx, active)
            ? active
            : await pickBook(ctx);

    if (!target) return;

    // 别名里装的正是带副标题的全名（建书时写进去的），它往往才是微读与设备那头的书名。
    // 「同步」与「读一本书」必须递同一批名字，否则同一本书在两条命令下匹配结果会不一样
    const names = [stripBraces(bookNameOf(target)), ...aliasesOf(ctx, target)];
    const author = firstAuthorOf(ctx, target);

    await pullHighlights(ctx, target, names, author);
}

/** 这本书的别名。缺席、写成标量、写成列表三种形态都认 */
function aliasesOf(ctx: ZiminosContext, moc: TFile): readonly string[] {
    const raw = ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.aliases;
    const list = Array.isArray(raw) ? raw : [raw];

    return list.map((value) => String(value ?? '').trim()).filter(Boolean);
}

/** 从全库的书里选一本 */
async function pickBook(ctx: ZiminosContext): Promise<TFile | null> {
    const books = allBookMocs(ctx);

    if (!books.length) {
        new Notice('还没有任何读书笔记。先运行「读一本书」。');

        return null;
    }

    return new ChoiceModal(ctx.app, {
        title: '同步哪本书的划线？',
        items: books,
        labelOf: (file) => bookNameOf(file),
    }).openAndGetChoice();
}

/** 书的 MOC 上写着的第一位作者，用来给书名匹配再收一道口 */
function firstAuthorOf(ctx: ZiminosContext, moc: TFile): string {
    const raw = ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.author;
    const list = Array.isArray(raw) ? raw : [raw];

    return String(list[0] ?? '').trim();
}

/** 《书名》→ 书名 */
function stripBraces(name: string): string {
    const inner = /^《(.+)》$/.exec(name);

    return inner ? inner[1] : name;
}

// ============================================================
// 连接微信读书
// ============================================================

/**
 * 注册「连接微信读书」。
 * 一辈子按一次：扫码之后，「读一本书」与「同步这本书的划线」就会自动去微读取数。
 */
export function registerConnectWereadCommand(ctx: ZiminosContext): void {
    ctx.commands.register(BOOK_COMMANDS.connectWeread, () => {
        runBookCommand(async () => {
            const ok = await loginWeread(ctx);

            new Notice(
                ok
                    ? '微信读书已连上。以后「读一本书」会自动把你在微读上的划线一并取回来。'
                    : '没有连上微信读书。窗口关掉了、或者还没扫码；随时可以再按一次。',
                8000,
            );
        }, '连接微信读书失败：');
    });
}
