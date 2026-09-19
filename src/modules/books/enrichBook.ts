/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile 类型；依赖 core/commands 的 BOOK_COMMANDS、
 *          core/constants 的 FIELDS 与 BOOK_FIELDS（书目 YAML 键名的共同事实源——
 *          建书那条路按行拼文本、这里用 processFrontMatter 写对象，落的必须是同一批键）、
 *          core/modals 的 ChoiceModal、core/types 的 ZiminosContext；
 *          依赖同目录 douban 的搜索与详情、isbn 的 isbnUid、tags 的 bookTags、
 *          titleMatch 的 matchByTitle、identity 的身份四问、readBook 的 pickBook
 * [OUTPUT]: 对外提供 registerEnrichBookCommand（命令 enrich-book-info）
 * [POS]: 「给一本已经在库里的书补上豆瓣那套书目」这件事，也是**整个模块里唯一一条
 *        还会主动访问豆瓣的命令**——这不是巧合，是设计：批量导入一次要处理几十本书，
 *        而豆瓣几十次请求之后必然把你拦下来；被拦的后果不是慢，是一半的书有封面、
 *        一半没有，且谁也说不清断在哪一本。于是查豆瓣这件事被整件挪到这里，
 *        由人按着走：**一次运行只查一本，两次请求**（搜索页 + 详情页）。
 *        慢是故意的，它是这个模块对豆瓣的全部克制所在。
 *
 *        它同时是认错之后的纠正入口，两种在场因此有两套待遇，判据是这本书查过没有
 *        （frontmatter 里有没有 source）：**没查过**就允许机器自己指认，
 *        但只在归一书名完全一致且作者对得上时才算数——宁可多问一次，
 *        也不能把错的 ISBN 与封面写进 YAML，那种错没有人会去核对；
 *        **查过**则一定弹候选让人选，因为这时候他按下这条命令的唯一理由就是「上次那本不对」。
 *
 *        写入用官方 processFrontMatter，只动它要补的那几个键，正文一个字不碰。
 *        已归档的书不改 UID：归档记录里已经引用了那个号，主键改了就不是主键了
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { BOOK_COMMANDS } from '../../core/commands';
import { BOOK_FIELDS, FIELDS } from '../../core/constants';
import { ChoiceModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import { doubanFetcher, fetchBookDetail, searchBooks } from './douban';
import type { DoubanBook, DoubanCandidate } from './douban';
import { bookAuthorOf, bookNameOf, bookTitlesOf, isArchivedBook, isBookMoc } from './identity';
import { isbnUid } from './isbn';
import { pickBook } from './readBook';
import { bookTags } from './tags';
import { matchByTitle, normalizeTitle } from './titleMatch';

const MESSAGES = {
    pick: '给哪本书补齐信息？',
    searching: '正在豆瓣上找这本书……',
    noResult: (name: string) =>
        `豆瓣上没找到《${name}》。书名可能与豆瓣写法不同，` +
        `可以先把 MOC 的 aliases 补上豆瓣那边的写法再试。`,
    pickBook: '是这一本吗？',
    detailFailed: '取书籍详情失败：',
    archivedUid: '（这本书已归档，UID 保持原值：归档记录已经引用了它）',
} as const;

/** 注册「补齐书籍信息」命令 */
export function registerEnrichBookCommand(ctx: ZiminosContext): void {
    ctx.commands.register(BOOK_COMMANDS.enrich, () => {
        void enrichBook(ctx).catch((error) => {
            new Notice(`补齐书籍信息失败：${describe(error) || '未知错误'}`, 10000);
        });
    });
}

async function enrichBook(ctx: ZiminosContext): Promise<void> {
    // ============================================================
    // 1. 哪一本：站在书上就是它，站在别处先选一本
    // ============================================================

    const active = ctx.app.workspace.getActiveFile();
    const moc = active && isBookMoc(ctx, active) ? active : await pickBook(ctx, MESSAGES.pick);

    if (!moc) return;

    const titles = bookTitlesOf(ctx, moc);
    const author = bookAuthorOf(ctx, moc);
    const displayName = bookNameOf(moc);
    // 查过一次的书再来，意思一定是「上次那本不对」——那就绝不再替他自作主张
    const checkedBefore = !!String(
        ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.[BOOK_FIELDS.source] ?? '',
    ).trim();

    // ============================================================
    // 2. 搜豆瓣：一次运行只发这一次搜索
    // ============================================================

    const searching = new Notice(MESSAGES.searching, 0);
    let candidates: readonly DoubanCandidate[];

    try {
        candidates = await searchBooks(doubanFetcher, titles[0] ?? '');
    } finally {
        searching.hide();
    }

    if (!candidates.length) {
        new Notice(MESSAGES.noResult(displayName), 10000);

        return;
    }

    // ============================================================
    // 3. 指认：机器只在有把握时代劳，其余一律交还给人
    // ============================================================

    const confident = checkedBefore ? null : confidentPick(candidates, titles, author);
    const chosen =
        confident ??
        (await new ChoiceModal(ctx.app, {
            title: MESSAGES.pickBook,
            items: candidates,
            labelOf: (item) => (item.abstract ? `${item.title}　—　${item.abstract}` : item.title),
        }).openAndGetChoice());

    if (!chosen) return;

    // ============================================================
    // 4. 详情 → 写进 YAML
    // ============================================================

    let detail: DoubanBook;

    try {
        detail = await fetchBookDetail(doubanFetcher, chosen.id, chosen.title, chosen.abstract);
    } catch (error) {
        new Notice(MESSAGES.detailFailed + describe(error), 8000);

        return;
    }

    const archived = isArchivedBook(ctx, moc);

    await applyDetail(ctx, moc, detail, archived);

    const filled = [
        detail.cover ? '封面' : '',
        detail.isbn && !archived ? 'ISBN' : '',
        detail.publisher ? '出版社' : '',
        detail.tags.length ? '分类' : '',
    ].filter(Boolean);

    new Notice(
        `已补齐《${detail.title}》的书籍信息${filled.length ? `：${filled.join('、')}` : ''}。` +
            (archived && detail.isbn ? MESSAGES.archivedUid : ''),
        8000,
    );
}

// ============================================================
// 指认
// ============================================================

/**
 * 机器自己认一本，认不准就交回 null。
 *
 * 门槛刻意比 sources 那三轮严：这里只认**归一之后逐字相同**的候选，
 * 而且必须唯一——两条候选都叫这个名字（同名书、新旧版）时一律交还给人。
 * 互相包含那一轮在这里不用：它是为副标题准备的，对取划线足够安全（取错了顶多是
 * 几条划线落错地方，看得见），对写 ISBN 与封面则不够——那种错没有人会去核对。
 */
function confidentPick(
    candidates: readonly DoubanCandidate[],
    titles: readonly string[],
    author: string,
): DoubanCandidate | null {
    const wrapped = candidates.map((item) => ({
        titles: [item.title],
        // 豆瓣那行摘要以作者开头，作者比对只能拿它当依据
        author: item.abstract.split('/')[0]?.trim() ?? '',
        item,
    }));
    const matched = matchByTitle(wrapped, { titles, author });

    if (!matched) return null;

    // 同一个名字命中两条：那正是「哪一本」还没有答案的意思
    const key = normalizeTitle(matched.titles[0] ?? '');
    const sameName = wrapped.filter((entry) => normalizeTitle(entry.titles[0] ?? '') === key);

    return sameName.length === 1 ? matched.item : null;
}

// ============================================================
// 写入
// ============================================================

/**
 * 把书目写进 frontmatter。
 *
 * 只动它要补的那几个键，正文一个字不碰——用户可能已经在这本书里写了半年的想法。
 * aliases 只增不改：他自己加的别名是他的，机器补的是豆瓣那边的写法，两者并存才对。
 * 走官方 processFrontMatter 而不是自己拼 YAML：那份文本此刻已经不是模板生成的样子了。
 */
async function applyDetail(
    ctx: ZiminosContext,
    moc: TFile,
    detail: DoubanBook,
    archived: boolean,
): Promise<void> {
    const uid = isbnUid(detail.isbn);
    const tags = bookTags(detail.tags, ctx.settings.bookTagPrefix, ctx.settings.bookTagCount);
    const fullTitle = detail.subtitle ? `${detail.title}：${detail.subtitle}` : detail.title;
    const key = BOOK_FIELDS;

    // 补书目是替用户落笔（他刚刚指认了哪一本），所以不登记自写，书的 updated 照记
    await ctx.app.fileManager.processFrontMatter(moc, (frontmatter: Record<string, unknown>) => {
        const aliases = asList(frontmatter[FIELDS.aliases]);

        for (const name of [fullTitle, detail.title]) {
            if (name && !aliases.includes(name)) aliases.push(name);
        }

        frontmatter[FIELDS.aliases] = aliases;

        if (detail.authors.length) frontmatter[key.author] = [...detail.authors];
        if (detail.translators.length) frontmatter[key.translators] = [...detail.translators];
        if (detail.publisher) frontmatter[key.publisher] = detail.publisher;
        if (detail.publishDate) frontmatter[key.publishDate] = detail.publishDate;
        if (detail.pages) frontmatter[key.pages] = Number(detail.pages) || detail.pages;
        if (detail.cover) frontmatter[key.cover] = detail.cover;
        if (detail.url) frontmatter[key.source] = detail.url;
        if (tags.length) frontmatter[FIELDS.tags] = [...tags];

        // 归档过的书不换主键：出库单与归档记录里已经写着原来那个号，
        // 改了它，那几条记录就指向一个不存在的东西——而且不报错
        if (uid !== null && !archived) frontmatter[FIELDS.uid] = uid;
    });
}

/** frontmatter 里的列表字段：缺席、标量、列表三种形态都认 */
function asList(value: unknown): string[] {
    const list = Array.isArray(value) ? value : [value];

    return list.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
