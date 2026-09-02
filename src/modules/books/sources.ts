/**
 * [INPUT]: 依赖同目录 sourceAppleBooks 与 sourceKindle 的探测与取数函数，
 *          以及 parsers 的 ParsedHighlight 类型
 * [OUTPUT]: 对外提供 SourceBook/SourceHit 契约、collectHighlightsFor（按书名从全部可用来源取划线并保留失败说明）
 *           与 availableSourceLabels（这台机器上此刻有哪些来源）
 * [POS]: 划线来源的汇流处。它存在的理由是「一步」这个目标本身：
 *        学员不该被问「你这本书的划线在哪个 App 里」——那是他刚刚做完的事，机器自己能查。
 *        于是本文件把「有哪些来源、这台机器上哪些能用、哪一本对得上」收成一个问题，
 *        建书流程只管拿结果。三条纪律：
 *        其一，**探测不抛异常**——某个来源坏了（设备拔了、库文件锁着）不该拖垮整条流程，
 *        它只是这次没有贡献而已；
 *        其二，**书名匹配从严到宽**——先逐字，再去标点空白，最后互相包含；
 *        宁可漏一本让学员手动指，也不能把《人类简史》的划线倒进《未来简史》；
 *        其三，来源之间**不去重**——那是 mergeHighlights 的活儿，它按归一文本去重，
 *        同一句话从两个设备来也只会写进去一次；任何可用来源没匹配到目标书时也返回 note，
 *        不把漏匹配伪装成「这本书没有划线」
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ParsedHighlight } from './parsers';
import type { ZiminosContext } from '../../core/types';
import { listWereadBooks, readWereadBookHighlights, wereadAvailable } from './sourceWeread';
import {
    appleBooksAvailable,
    listAppleBooks,
    readAppleBookHighlights,
} from './sourceAppleBooks';
import { kindleAvailable, listKindleBooks, readKindleBookHighlights } from './sourceKindle';

// ============================================================
// 契约
// ============================================================

/** 某个来源里的一本书 */
export interface SourceBook {
    readonly label: string;
    readonly id: string;
    readonly title: string;
    readonly author: string;
}

/** 一次命中：哪个来源、哪本书、多少条划线 */
export interface SourceHit {
    readonly label: string;
    readonly title: string;
    readonly highlights: readonly ParsedHighlight[];
    /**
     * 这次取数少了什么、为什么。有值就原样说给学员听。
     *
     * 它存在是因为「一条都没取到」有两种成因：书上确实没划过，与接口取不到。
     * 两者在数据上长得一模一样，只有来源自己分得出（微读拿书架上的计数对账）。
     * 不把这句话带出来，插件就会在自己失手的时候说「这本书没有划线」。
     */
    readonly note?: string;
}

// ============================================================
// 探测
// ============================================================

/** 这台机器此刻能用的来源名，用于在提示里如实交代「查过哪几处」 */
export function availableSourceLabels(ctx: ZiminosContext): readonly string[] {
    const labels: string[] = [];

    if (probeAvailable(() => wereadAvailable(ctx))) labels.push('微信读书');
    if (probeAvailable(appleBooksAvailable)) labels.push('苹果图书');
    if (probeAvailable(kindleAvailable)) labels.push('Kindle');

    return labels;
}

/**
 * 探测抛错不等于「来源不存在」：把它留在候选里，
 * 后续取数层才能捕获同一个错误并向用户交代。
 */
function probeAvailable(probe: () => boolean): boolean {
    try {
        return probe();
    } catch {
        return true;
    }
}

// ============================================================
// 按书名取划线
// ============================================================

/**
 * 从全部可用来源里，把这本书的划线都取回来。
 *
 * 每个来源各自 try/catch：读苹果图书要起一个 sqlite3 子进程、读 Kindle 要碰一个
 * 随时可能被拔掉的卷宗，任何一处失手都只是少一个来源，不该让整条建书流程失败——
 * 学员此刻要的是那本书建出来，划线是锦上添花。
 */
export async function collectHighlightsFor(
    ctx: ZiminosContext,
    names: readonly string[],
    author = '',
): Promise<readonly SourceHit[]> {
    const hits: SourceHit[] = [];

    try {
        if (wereadAvailable(ctx)) {
            const books = (await listWereadBooks(ctx)).map((book) => ({ ...book, label: '微信读书' }));
            const matched = matchBook(books, names, author);

            if (matched) {
                const { highlights, note } = await readWereadBookHighlights(ctx, matched);

                // 一条都没取到但有话要说时也记一笔：那句话正是这次调用唯一的产出
                if (highlights.length || note) {
                    hits.push({ label: '微信读书', title: matched.title, highlights, note });
                }
            } else {
                hits.push(unmatchedHit('微信读书', names));
            }
        }
    } catch (error) {
        hits.push(failedHit('微信读书', names, error));
    }

    try {
        if (appleBooksAvailable()) {
            const books = (await listAppleBooks()).map((book) => ({ ...book, label: '苹果图书' }));
            const matched = matchBook(books, names, author);

            if (matched) {
                const highlights = await readAppleBookHighlights(matched.id);

                if (highlights.length) {
                    hits.push({ label: '苹果图书', title: matched.title, highlights });
                }
            } else {
                hits.push(unmatchedHit('苹果图书', names));
            }
        }
    } catch (error) {
        hits.push(failedHit('苹果图书', names, error));
    }

    try {
        if (kindleAvailable()) {
            const books = listKindleBooks().map((book) => ({
                label: 'Kindle',
                id: book.title,
                title: book.title,
                author: book.author,
            }));
            const matched = matchBook(books, names, author);

            if (matched) {
                const highlights = readKindleBookHighlights(matched.title);

                if (highlights.length) {
                    hits.push({ label: 'Kindle', title: matched.title, highlights });
                }
            } else {
                hits.push(unmatchedHit('Kindle', names));
            }
        }
    } catch (error) {
        hits.push(failedHit('Kindle', names, error));
    }

    return hits;
}

/** 来源失败仍然是一条结果：零划线加一句实话，调用方才能与“确实没有”分开 */
function failedHit(label: string, names: readonly string[], error: unknown): SourceHit {
    const message = error instanceof Error ? error.message : String(error);

    return {
        label,
        title: names.find((name) => name.trim()) ?? '',
        highlights: [],
        note: `${label}取数失败：${message || '未知错误'}`,
    };
}

/** 来源能读、书单也拿到了，但没有一本能安全认成目标书；它不等于“这本书没有划线” */
function unmatchedHit(label: string, names: readonly string[]): SourceHit {
    return {
        label,
        title: names.find((name) => name.trim()) ?? '',
        highlights: [],
        note: `${label}没有匹配到这本书（可能是书名或副标题不同），没有把其他书的划线混进来。`,
    };
}

// ============================================================
// 书名匹配
// ============================================================

/**
 * 在一批书里找出「就是这一本」。
 *
 * 三轮从严到宽：逐字 → 去掉书名号标点空白后逐字 → 互相包含。
 * 最后那一轮是为副标题准备的：豆瓣叫《卡片笔记写作法》，
 * 苹果图书里可能叫《卡片笔记写作法：如何实现从阅读到写作》。
 * 但互相包含也要求较短的那个不少于四个字——两个字的书名（《活着》）
 * 会包含进太多别的书里，那种误配比漏配难发现得多。
 * 有作者信息时，第三轮还要求作者也对得上一半，再收一道口。
 *
 * **收 names 而不是一个 title**，是 2026-08-14 真机实测逼出来的一条。
 * 那本书豆瓣写作「思维 : 关于决策、问题解决与预测的新科学」，
 * 主书名只有「思维」两个字（文件名只能用主书名，副标题太长），
 * 而微信读书那头写的是带副标题的全名。于是逐字不中、归一不中，
 * 第三轮又被那道四字门槛挡在外面——一本明明有笔记的书，机器一条都取不到。
 *
 * 出路不是把门槛放宽到两个字（那会让《活着》匹配上一堆书，误配比漏配难发现得多），
 * 而是**把这本书已知的每一个名字都拿来试**：主书名、带副标题的全名，都是它。
 * 全名一到手，第二轮的归一比对就直接命中了，一道门槛都不用动。
 * 这两个名字建书时本来就在手上（全名正是写进 aliases 的那个），从来不必现算。
 */
function matchBook<T extends SourceBook>(
    books: readonly T[],
    names: readonly string[],
    author: string,
): T | null {
    // 空名字不参与比对：normalize('') 是空串，而空串被任何字符串包含，
    // 第三轮会拿它匹配上书架第一本书——一次静默的、100% 错的命中
    const candidates = names.map((name) => name.trim()).filter(Boolean);

    for (const name of candidates) {
        const exact = books.find((book) => book.title === name);

        if (exact) return exact;
    }

    for (const name of candidates) {
        const key = normalize(name);

        if (!key) continue;

        const normalized = books.find((book) => normalize(book.title) === key);

        if (normalized) return normalized;
    }

    const authorKey = normalize(author);

    for (const name of candidates) {
        const key = normalize(name);

        if (key.length < 4) continue;

        const loose = books.find((book) => {
            const candidate = normalize(book.title);
            const overlaps =
                candidate.length >= 4 && (candidate.includes(key) || key.includes(candidate));

            if (!overlaps) return false;
            if (!authorKey) return true;

            // 作者对得上一半即可：豆瓣写「[德] 申克·阿伦斯」，设备里可能只有「申克·阿伦斯」
            const bookAuthor = normalize(book.author);

            return !bookAuthor || bookAuthor.includes(authorKey) || authorKey.includes(bookAuthor);
        });

        if (loose) return loose;
    }

    return null;
}

/** 归一：剥书名号、去掉全部空白与常见标点，只留「是不是同一本书」这件事 */
function normalize(value: string): string {
    return value
        .replace(/^《|》$/g, '')
        .replace(/[\s：:，,。.、·・\-—_()（）[\]【】"'"'?？!！]/g, '')
        .toLowerCase();
}
