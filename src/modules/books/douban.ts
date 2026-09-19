/**
 * [INPUT]: 依赖 obsidian 的 requestUrl（公开 API，绕开渲染进程的同源限制并可自定义请求头）
 * [OUTPUT]: 对外提供 DoubanCandidate/DoubanBook 契约、纯解析函数 parseSearchResults/parseBookDetail，
 *           以及带网络的 searchBooks/fetchBookDetail 与它们共用的 PageFetcher/doubanFetcher
 * [POS]: 书籍信息的来源。学员建一本书时只该做一件事——报出书名、从候选里指认哪一本，
 *        其余（作者、译者、出版社、出版年、ISBN、页数、评分、封面、豆瓣链接、分类词）一律自动填。
 *        让人手打这些字段是把书目数据库的活儿摊派给读者，而那些字段恰恰是最容易打错、
 *        打错了又最难发现的（ISBN 错一位仍然是合法的一串数字）。
 *        取数分两步走，因为豆瓣的两条通道待遇不同：JSON 搜索接口（/j/search 与
 *        rexxar/api）对非浏览器来源一律 403，而**搜索页与详情页的 HTML 照常返回 200**，
 *        且搜索页把结果原样铺在 `window.__DATA__` 的明文 JSON 里——于是走 HTML 这条路。
 *        分类词是 v0.14.0 添的第十三个字段，取自页首那行广告投放参数而非 DOM——
 *        详情页那个「常用标签」小节已经不在页面上了，理由与取法写在 parseCategories 头上。
 *        解析与取数分家：parse* 是纯函数，喂它一段存档 HTML 就能离线验证，
 *        网络那一层薄到只剩「拼 URL、带浏览器请求头、把 body 交出去」
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requestUrl } from 'obsidian';

// ============================================================
// 契约
// ============================================================

/** 搜索结果里的一本候选书，够学员分辨「是不是这一本」即可 */
export interface DoubanCandidate {
    readonly id: string;
    readonly title: string;
    /** 豆瓣那行摘要原文：`[德] 申克·阿伦斯 / 陈琳 / 人民邮电出版社 / 2021-7 / 69.80元` */
    readonly abstract: string;
    readonly cover: string;
}

/** 一本书的完整书目信息，逐项对应 MOC 的 YAML */
export interface DoubanBook {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly authors: readonly string[];
    readonly translators: readonly string[];
    readonly publisher: string;
    readonly publishDate: string;
    readonly isbn: string;
    readonly pages: string;
    readonly rating: string;
    readonly cover: string;
    readonly url: string;
    readonly summary: string;
    /**
     * 豆瓣成员给这本书打的分类词，已按投票数从高到低排好。
     * 它是「这本书在知识地图上的位置」的唯一来源——本文件只负责如实解析并保序，
     * 该留几条、怎么变成合法的 Obsidian 标签是 tags.ts 的活儿。
     */
    readonly tags: readonly string[];
}

/** 取一个网页的 HTML。抽成参数是为了让解析可以离线验证，网络只在装配时接进来 */
export type PageFetcher = (url: string) => Promise<string>;

// ============================================================
// 网络层：薄到只剩请求头
// ============================================================

/**
 * 豆瓣认浏览器。不带这套请求头，搜索页会退化成验证码页或直接 403；
 * requestUrl 是 obsidian.d.ts 里的公开 API，走主进程发请求，
 * 因此既没有同源限制，也能如实设置 User-Agent（浏览器里 fetch 改不了它）。
 */
const BROWSER_HEADERS: Readonly<Record<string, string>> = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
};

/** 走 Obsidian 公开 API 取页面。throw 交给调用方转成中文 Notice */
export const doubanFetcher: PageFetcher = async (url) => {
    const response = await requestUrl({ url, method: 'GET', headers: BROWSER_HEADERS });

    return response.text;
};

/** 搜书：给一个书名，得到候选清单 */
export async function searchBooks(
    fetch: PageFetcher,
    keyword: string,
): Promise<readonly DoubanCandidate[]> {
    const url = `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(keyword)}`;

    return parseSearchResults(await fetch(url));
}

/**
 * 抓详情：给一个豆瓣 id，得到整套书目字段。
 *
 * 递上候选那一行的标题，是因为两个页面给的东西不一样多：详情页的 og:title 常常
 * 只有主书名（本书就是如此），而搜索结果的标题写着「卡片笔记写作法 : 如何实现从阅读到写作」——
 * 副标题只在那一头有。既然候选是刚刚从同一次搜索里选出来的，顺手带过来就是了。
 */
export async function fetchBookDetail(
    fetch: PageFetcher,
    id: string,
    candidateTitle = '',
    candidateAbstract = '',
): Promise<DoubanBook> {
    const url = detailUrlOf(id);
    const detail = parseBookDetail(await fetch(url), id, candidateTitle);

    return enrichFromAbstract(detail, candidateAbstract);
}

/**
 * 详情页没给的字段，用候选那行摘要补上。
 *
 * 摘要的形态是固定的：`[以色列] 尤瓦尔·赫拉利 / 林俊宏 / 中信出版社 / 2014-11 / 68.00元`，
 * 用斜杠分段，价格与年份认得出来，剩下的按位置分派。
 * 这一层存在的理由是详情页会失手——改版、地区限制、或者点中的根本是一个丛书条目，
 * 那时字段全空，学员拿到的是一张空壳。有摘要垫底，至少作者与出版社不会缺。
 */
function enrichFromAbstract(book: DoubanBook, abstract: string): DoubanBook {
    if (!abstract.trim()) return book;
    if (book.publisher && book.authors.length) return book;

    const parts = abstract
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);

    if (!parts.length) return book;

    const priceAt = parts.findIndex((part) => /元|\$|USD|CNY/.test(part));
    const dateAt = parts.findIndex((part) => /^\d{4}(-\d{1,2})?(-\d{1,2})?$/.test(part));
    const publisherAt = dateAt > 0 ? dateAt - 1 : priceAt > 1 ? priceAt - 1 : parts.length - 1;

    // 出版社之前的都是人：第一位是作者，其余是译者
    const people = parts.slice(0, Math.max(publisherAt, 0));

    return {
        ...book,
        authors: book.authors.length ? book.authors : people.slice(0, 1),
        translators: book.translators.length ? book.translators : people.slice(1),
        publisher: book.publisher || (publisherAt >= 0 ? parts[publisherAt] ?? '' : ''),
        publishDate: book.publishDate || (dateAt >= 0 ? parts[dateAt] : ''),
    };
}

/** 一本书在豆瓣上的地址。它同时是详情页的取数地址与写进 YAML 的那条链接 */
export function detailUrlOf(id: string): string {
    return `https://book.douban.com/subject/${id}/`;
}

// ============================================================
// 解析层：纯函数，喂存档 HTML 即可离线验证
// ============================================================

/**
 * 从搜索页抠出候选清单。
 *
 * 豆瓣把结果原样铺在 `window.__DATA__ = {…}` 里，是明文 JSON 不是编码串，
 * 因此不必解析 DOM——但那段 JSON 后面紧跟着别的脚本，不能靠贪婪匹配截断，
 * 只能数花括号配对到真正的结尾。
 * 没有 title 的条目是广告位与「没有找到」占位，一律剔除。
 */
export function parseSearchResults(html: string): readonly DoubanCandidate[] {
    // 撞上反爬先抛错而不是交空清单：两者对学员是两句完全不同的话——
    // 「豆瓣没有这本书」他会换个书名，「豆瓣把你拦下了」他该等一会儿再来。
    // 把后者说成前者，他会一直换书名，越换越频繁，越频繁越被拦
    if (isBlocked(html)) throw new Error(BLOCKED_MESSAGE);

    const start = html.indexOf('window.__DATA__');

    if (start < 0) return [];

    const braceStart = html.indexOf('{', start);

    if (braceStart < 0) return [];

    const json = html.slice(braceStart, matchingBraceEnd(html, braceStart));
    let payload: { items?: unknown[] };

    try {
        payload = JSON.parse(json) as { items?: unknown[] };
    } catch {
        // 豆瓣改版把明文换成编码串时走到这里：交出空清单，由调用方讲清「没搜到」
        return [];
    }

    const candidates: DoubanCandidate[] = [];

    for (const raw of payload.items ?? []) {
        const item = raw as Record<string, unknown>;
        const title = text(item.title);
        const id = text(item.id);

        if (!title || !id) continue;
        // 丛书与套装不是「一本书」：它们的详情页没有 ISBN、没有页数、结构也不同，
        // 建成读书笔记会得到一个字段全空的壳子。搜「人类简史」时它恰恰排在第一条
        if (NOT_A_SINGLE_BOOK.test(title)) continue;

        candidates.push({
            id,
            title,
            abstract: text(item.abstract),
            cover: text(item.cover_url),
        });
    }

    return candidates;
}

/**
 * 豆瓣的三种拦截页：工作量证明挑战、人机验证、禁止访问。
 *
 * 它们都返回 200，正文却不是搜索页——只看「有没有 __DATA__」的话，
 * 三种拦截都会被当成「没搜到这本书」。这一条是照豆瓣插件的反爬处理反推的：
 * 它为此在主线程暴力枚举 nonce 算 SHA-512 去闯关，我们不闯，如实说。
 */
const BLOCKED_PATTERNS = [/sec\.douban\.com/, /禁止访问/, /有异常请求/, /验证码/];

const BLOCKED_MESSAGE = '豆瓣暂时拦下了这次请求（换个网络或过几分钟再试）。也可以用「新建读书笔记」手动建一本。';

/** 这一页是不是拦截页而不是搜索结果 */
function isBlocked(html: string): boolean {
    if (html.includes('window.__DATA__')) return false;

    return BLOCKED_PATTERNS.some((pattern) => pattern.test(html));
}

/** 搜索结果里那些不是「一本书」的条目：丛书、套装、多卷合集 */
const NOT_A_SINGLE_BOOK = /^\s*[[［【]\s*(丛书|套装|系列)/;

/** 从 `{` 数到与它配对的 `}` 的下一位。字符串字面量里的花括号要跳过，否则书名带 `{` 就会截错 */
function matchingBraceEnd(source: string, from: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let cursor = from; cursor < source.length; cursor += 1) {
        const char = source[cursor];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;

            if (depth === 0) return cursor + 1;
        }
    }

    return source.length;
}

/**
 * 从详情页抠出整套书目字段。
 *
 * 书名与封面走 og: 元信息——那是给分享用的，比正文结构稳；
 * 其余字段住在 `id="info"` 那一块，形态是「`<span class="pl">键:</span> 值`」，
 * 键与冒号之间可能有空格、值可能包在 `<a>` 里，所以逐个键取到下一个 `<br` 为止再剥标签。
 */
export function parseBookDetail(html: string, id: string, candidateTitle = ''): DoubanBook {
    const info = infoBlockOf(html);
    const title = attr(html, /<meta property="og:title" content="([^"]*)"/);

    return {
        id,
        title: stripSubtitle(title || candidateTitle),
        // 三处依次兜底：信息区的副标题字段、详情页标题里冒号之后的部分、候选那一行的标题
        subtitle: field(info, '副标题') || subtitleOf(title) || subtitleOf(candidateTitle),
        authors: splitNames(field(info, '作者')),
        translators: splitNames(field(info, '译者')),
        publisher: field(info, '出版社'),
        publishDate: field(info, '出版年'),
        isbn: field(info, 'ISBN'),
        pages: field(info, '页数'),
        rating: attr(html, /property="v:average">\s*([0-9.]+)/),
        cover: attr(html, /<meta property="og:image" content="([^"]*)"/),
        url: detailUrlOf(id),
        summary: attr(html, /<meta property="og:description" content="([^"]*)"/),
        tags: parseCategories(html),
    };
}

/**
 * 取这本书的豆瓣分类词，按投票数从高到低。
 *
 * 取数点选得刁钻，是因为正经那一处已经不在了：详情页当年那个「豆瓣成员常用的标签」小节
 * （`id="db-tags-section"`）在四本实测样本里一个都没有，DOM 里根本没有这块内容。
 * 但同一份数据仍然完整地留在页首那行广告投放参数上：
 *
 *     criteria = '7:写作|7:方法论|7:笔记|7:读书笔记|…|3:/subject/35503571/'
 *
 * 豆瓣拿它去定向投广告，所以它必须是**这本书最能代表读者群的那几个词**，
 * 也就必须与常用标签同源、同序。`7:` 是标签，`3:` 是这本书自己的条目地址，只收前者。
 *
 * 它比 DOM 更稳的地方在于：页面版式改版频繁，而这行参数是发给广告系统的接口。
 * 它不稳的地方也说清楚——豆瓣哪天换掉投放方案，这里就取不到东西，
 * 那时的表现是「这本书没有标签」，而不是报错或者标错，因此没有兜底的必要。
 */
function parseCategories(html: string): readonly string[] {
    const raw = /criteria\s*=\s*'([^']*)'/.exec(html)?.[1] ?? '';

    if (!raw) return [];

    const categories: string[] = [];

    for (const entry of raw.split('|')) {
        const word = /^7:(.+)$/.exec(entry.trim())?.[1]?.trim();

        if (word) categories.push(word);
    }

    return categories;
}

/** 信息区的原始 HTML；取不到就退回全文，让逐键匹配自己去碰运气而不是直接失败 */
function infoBlockOf(html: string): string {
    const start = html.indexOf('id="info"');

    if (start < 0) return html;

    const end = html.indexOf('</div>', start);

    return html.slice(start, end < 0 ? html.length : end);
}

/**
 * 取信息区里某个键的值。
 * 键名两侧允许空格（豆瓣的「 作者」前面真的有一个），冒号在标签内或标签外都认，
 * 值取到下一个 `<br` 为止，再剥掉链接标签与实体。
 */
function field(info: string, key: string): string {
    const pattern = new RegExp(
        `<span class="pl">\\s*${key}\\s*:?\\s*</span>\\s*:?([\\s\\S]*?)<br`,
        'i',
    );

    return clean(pattern.exec(info)?.[1] ?? '');
}

/** 作者与译者可能有好几位，豆瓣用相邻的 `<a>` 并排；剥完标签后按空白与顿号切开 */
function splitNames(value: string): readonly string[] {
    return value
        .split(/\s{2,}|\s*[/、]\s*/)
        .map((name) => name.trim())
        .filter(Boolean);
}

/** og:title 里书名与副标题用冒号连在一起，MOC 的文件名只要主书名 */
function stripSubtitle(title: string): string {
    return title.split(/\s*:\s*/)[0].trim() || title.trim();
}

/** 主书名之后的部分即副标题；信息区没写副标题时用它兜底 */
function subtitleOf(title: string): string {
    const parts = title.split(/\s*:\s*/);

    return parts.length > 1 ? parts.slice(1).join('：').trim() : '';
}

/** 取一个正则的第一个捕获组并清洗 */
function attr(html: string, pattern: RegExp): string {
    return clean(pattern.exec(html)?.[1] ?? '');
}

/** 这一趟认得的实体。表与正则同源，加一条只改这里 */
const ENTITIES: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
};

/**
 * 剥标签、还原实体、压空白。豆瓣的字段值里混着 `<a>`、`&amp;` 与大量换行缩进。
 *
 * 实体**一趟换完**，而不是一条 replace 接一条：链式替换里 `&amp;` 排在 `&lt;` 前面，
 * 于是 `&amp;lt;` 先变成 `&lt;`、再变成 `<`——一次二次解码。书名里带尖括号的概率不高，
 * 但这段文字接着会被写进 Markdown，而 Obsidian 的渲染器认 HTML：
 * 那个 `<` 从此不再是学员看到的那个字，它成了标记。一趟扫描让这件事在机制上不可能发生，
 * 而不是靠「记得把 &amp; 放最后」这种下一个人不会知道的约定。
 */
function clean(value: string): string {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&(?:nbsp|amp|quot|#39|lt|gt);/g, (entity) => ENTITIES[entity] ?? entity)
        .replace(/\s+/g, ' ')
        .trim();
}

/** 把来路不明的 JSON 值收敛成字符串 */
function text(value: unknown): string {
    if (value === null || value === undefined) return '';

    return String(value).trim();
}
