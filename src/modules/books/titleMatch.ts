/**
 * [INPUT]: 零依赖纯函数，不 import 任何模块
 * [OUTPUT]: 对外提供 TitleFacts 契约、normalizeTitle 归一、matchByTitle 三轮匹配
 * [POS]: 「这两个名字说的是不是同一本书」这件事的唯一事实源。
 *        它原本是 sources.ts 的两个私有函数，v0.36.0 抽出来，因为同一把尺子开始量三处：
 *        按书名从设备取划线（sources）、批量导入时判断这本书是不是已经在库里（importLibrary）、
 *        补书目时判断豆瓣候选里哪一条就是它（enrichBook）。
 *        抽出来不是为了复用代码，是为了**只有一把尺子**——三份各自演化的书名比对规则，
 *        意味着同一本书在三处会得到三种答案，而其中两种是错的、且不报错。
 *
 *        两边都收一批名字而不是一个书名，是 2026-08-14 真机实测逼出来的形状：
 *        《思维 : 关于决策、问题解决与预测的新科学》主书名只有「思维」两个字（文件名只能用主书名），
 *        设备那头写的却是带副标题的全名，于是逐字不中、归一不中，第三轮又被四字门槛挡在外面。
 *        出路不是把门槛降到两个字（那会让《活着》匹配上一堆书），
 *        而是把这本书已知的每一个名字都拿来试。库里那本书的名字同样不止一个：
 *        文件夹名是主书名，aliases 里躺着带副标题的全名——两边对称，尺子才量得准
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 契约
// ============================================================

/**
 * 一个「可能是某本书」的东西，已知的全部名字与作者。
 *
 * titles 收一批而不是一个：一本书在设备上、在豆瓣上、在这个库里可能各有各的写法，
 * 而它们全都是它。author 可以是空串——Kindle 的个人文档就没有作者，
 * 那时第三轮只靠书名收口，不因为缺一个字段就拒绝匹配。
 */
export interface TitleFacts {
    readonly titles: readonly string[];
    readonly author: string;
}

// ============================================================
// 归一
// ============================================================

/**
 * 归一：剥书名号、去掉全部空白与常见标点，只留「是不是同一本书」这件事。
 *
 * 不做繁简转换也不做大小写之外的任何语言处理——那些会让两本真正不同的书撞上，
 * 而误配比漏配难发现得多：漏配学员会发现（这本书的划线没来），误配他不会。
 */
export function normalizeTitle(value: string): string {
    return value
        .replace(/^《|》$/g, '')
        .replace(/[\s：:，,。.、·・\-—_()（）[\]【】"'"'?？!！]/g, '')
        .toLowerCase();
}

// ============================================================
// 匹配
// ============================================================

/** 互相包含那一轮的最短门槛：两个字的书名（《活着》）会包含进太多别的书里 */
const LOOSE_MIN_LENGTH = 4;

/**
 * 在一批候选里找出「就是这一本」，找不到返回 null。
 *
 * 三轮从严到宽：逐字 → 归一后逐字 → 互相包含。
 * 最后那一轮是为副标题准备的：豆瓣叫《卡片笔记写作法》，
 * 设备里可能叫《卡片笔记写作法：如何实现从阅读到写作》。
 * 但互相包含要求较短的那个不少于四个字，且在两边都有作者时要求作者也对得上一半，
 * 再收一道口——宁可漏一本让人手动指，也不能把《人类简史》的划线倒进《未来简史》。
 *
 * 三轮必须**整轮跑完再进下一轮**，不能对每个名字跑完三轮：
 * 前者保证「有一个逐字命中就绝不用宽的那一条」，后者会让第一个名字的宽匹配
 * 抢在第二个名字的逐字匹配之前，而那正是误配的来源。
 */
export function matchByTitle<T extends TitleFacts>(
    candidates: readonly T[],
    target: TitleFacts,
): T | null {
    // 空名字不参与比对：normalize('') 是空串，而空串被任何字符串包含，
    // 第三轮会拿它匹配上清单里的第一本书——一次静默的、100% 错的命中
    const names = target.titles.map((name) => name.trim()).filter(Boolean);

    if (!names.length) return null;

    for (const name of names) {
        const exact = candidates.find((item) => item.titles.some((title) => title === name));

        if (exact) return exact;
    }

    for (const name of names) {
        const key = normalizeTitle(name);

        if (!key) continue;

        const normalized = candidates.find((item) =>
            item.titles.some((title) => normalizeTitle(title) === key),
        );

        if (normalized) return normalized;
    }

    const targetAuthor = normalizeTitle(target.author);

    for (const name of names) {
        const key = normalizeTitle(name);

        if (key.length < LOOSE_MIN_LENGTH) continue;

        const loose = candidates.find((item) => {
            const overlaps = item.titles.some((title) => {
                const candidate = normalizeTitle(title);

                return (
                    candidate.length >= LOOSE_MIN_LENGTH &&
                    (candidate.includes(key) || key.includes(candidate))
                );
            });

            if (!overlaps) return false;

            return authorsAgree(targetAuthor, item.author);
        });

        if (loose) return loose;
    }

    return null;
}

/**
 * 作者对不对得上。
 *
 * 任一边没有作者就放行：Kindle 的个人文档、豆瓣的部分条目都可能缺这一项，
 * 缺席不是矛盾。两边都有时按「对得上一半」判——
 * 豆瓣写「[德] 申克·阿伦斯」，设备里可能只有「申克·阿伦斯」。
 */
function authorsAgree(targetAuthor: string, candidateAuthor: string): boolean {
    if (!targetAuthor) return true;

    const candidate = normalizeTitle(candidateAuthor);

    return !candidate || candidate.includes(targetAuthor) || targetAuthor.includes(candidate);
}
