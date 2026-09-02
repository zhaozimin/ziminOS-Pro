/**
 * [INPUT]: 依赖 ./lineEndings 的 lineEndingOf；其余只认字符串，不认识 Obsidian 与业务
 * [OUTPUT]: 对外提供规则目录 FORMAT_RULES 与它的键 FormatRuleKey、默认启用清单 DEFAULT_FORMAT_RULES、
 *           读取侧兜底 normalizeFormatRules，以及保留原换行风格的唯一入口 formatMarkdown
 * [POS]: core 的 Markdown 排版层，与 markdown.ts 分工明确：那边动的是「往哪一行插什么」，
 *        这边动的是「这一篇写得规不规范」。九条规则合成一趟纯函数变换，
 *        同输入同输出、且**幂等**——formatMarkdown(formatMarkdown(x)) === formatMarkdown(x)。
 *        幂等不是性质而是设计前提：自动整理会写盘，写盘再触发监听，
 *        断开这个环靠的正是「第二趟算出来的东西与第一趟一模一样，于是没有第二次写入」。
 *        它最要紧的不是加空格，而是**不加**：文件名、双链、行内代码、URL、标签、YAML
 *        一律整段保护——`[[人脉MOC]]` 里插一个空格，全库的链接当场断在那儿，
 *        而断链既不报错也没人当天发现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { lineEndingOf } from './lineEndings';

// ============================================================
// 规则目录
// ============================================================

/** 九条规则的键。它会落进用户的 data.json，故视同公开契约，改名等于让他的选择失效 */
export type FormatRuleKey =
    | 'cjk-space'
    | 'heading-blank'
    | 'list-blank'
    | 'table-blank'
    | 'code-blank'
    | 'yaml-blank'
    | 'blank-collapse'
    | 'trailing-space'
    | 'final-newline';

/** 一条规则在设置页上的样子。规则的实现不在这张表里——见 formatMarkdown 那句注释 */
export interface FormatRule {
    readonly key: FormatRuleKey;
    readonly name: string;
    readonly desc: string;
}

/**
 * 九条规则，顺序即它们在排版页上从上到下的顺序：
 * 第一条改的是「字」，后八条改的只是「空白」——这是它们之间唯一重要的分界，
 * 所以它单独排在最前面，学员一眼就能看出哪一条会动他写下的内容。
 */
export const FORMAT_RULES: readonly FormatRule[] = [
    {
        key: 'cjk-space',
        name: '中英文之间加空格',
        desc: '汉字与英文、数字相邻时补一个空格，「使用Dataview查询」写成「使用 Dataview 查询」。文件名、[[双链]]、行内代码、网址与 #标签 一律整段跳过——那里面加空格会当场断链。',
    },
    {
        key: 'heading-blank',
        name: '标题上下留空行',
        desc: '每个 # 标题与它前后的内容之间各空一行。标题连着正文时，很多 Markdown 渲染器会把标题读成普通段落。',
    },
    {
        key: 'list-blank',
        name: '列表上下留空行',
        desc: '列表与前后的段落之间各空一行，列表内部不动。紧贴正文的列表在标准 Markdown 里根本不会被渲染成列表。',
    },
    {
        key: 'table-blank',
        name: '表格上下留空行',
        desc: '表格与前后的内容之间各空一行，表格内部不动。',
    },
    {
        key: 'code-blank',
        name: '代码块上下留空行',
        desc: '``` 围起来的块与前后内容之间各空一行，块里面一个字都不动。视图代码块也走这一条。',
    },
    {
        key: 'yaml-blank',
        name: 'YAML 与正文之间留空行',
        desc: '文件顶部的属性区收尾之后空一行再写正文。属性区里面一个字都不动——那里存的是事实，不是排版。',
    },
    {
        key: 'blank-collapse',
        name: '连续空行收成一行',
        desc: '两行以上的连续空行压成一行。删掉一段话之后最容易留下这种空洞。',
    },
    {
        key: 'trailing-space',
        name: '去掉行尾空格',
        desc: '每行末尾多余的空格与制表符去掉。代价说在前面：用两个行尾空格做硬换行的写法会一并被去掉。',
    },
    {
        key: 'final-newline',
        name: '文末只留一个换行',
        desc: '文件结尾恰好一个换行符，不多不少。它不影响阅读，但能让每次 Git 差异只显示你真正改过的那几行。',
    },
];

/** 全新库默认九条全开：那就是标准 Markdown 的样子，学员不必先学会才能用对 */
export const DEFAULT_FORMAT_RULES: readonly string[] = FORMAT_RULES.map((rule) => rule.key);

/**
 * 把磁盘上读到的 formatRules 收敛成一份可用的清单。
 *
 * 与 normalizeRibbonCommands 同形同因：data.json 是用户能手改的文件，
 * 而这个字段会被 `.includes` 直接使用，一个 null 就让整趟排版在第一条规则上炸掉。
 * 不是数组就退回默认（等同于「这个键没写过」），是数组则只留字符串项；
 * 空数组合法——那表示用户把九条全关了，此时 formatMarkdown 原样返回。
 */
export function normalizeFormatRules(value: unknown): readonly string[] {
    if (!Array.isArray(value)) return DEFAULT_FORMAT_RULES;

    return value.filter((item): item is string => typeof item === 'string');
}

// ============================================================
// 保护名单：哪些字一个都不能动
// ============================================================

/** 汉字、假名与兼容表意文字。刻意不含 　-〿 那段标点——「，Dataview」不该变成「， Dataview」 */
const CJK = '\\u4e00-\\u9fff\\u3400-\\u4dbf\\u3040-\\u30ff\\uf900-\\ufaff';

/** 加空格只发生在汉字与拉丁字母、数字之间 */
const LATIN = 'A-Za-z0-9';

const CJK_THEN_LATIN = new RegExp(`([${CJK}])([${LATIN}])`, 'g');
const LATIN_THEN_CJK = new RegExp(`([${LATIN}])([${CJK}])`, 'g');

/**
 * 一行里绝对不能动的六种东西，按出现频率排列。
 *
 * 它们的共同点是「里面的字符有语法含义」：`[[人脉MOC]]` 是文件名，插一个空格就指向了
 * 一篇不存在的笔记；`#项目2026` 是标签，断开就变成两个标签；URL 里的空格直接让链接失效。
 * 这份名单是本文件存在的真正理由——加空格谁都会写，难的是知道哪里不能加。
 */
const PROTECTED = new RegExp(
    [
        '`[^`]*`', // 行内代码
        '\\[\\[[^\\]]*\\]\\]', // 双链，连别名一起保护
        '\\[[^\\]]*\\]\\([^)]*\\)', // Markdown 链接，连显示文字一起保护
        'https?://\\S+', // 裸网址
        '<[^>]+>', // HTML 标签
        '#[^\\s#]+', // 标签。`## ` 这类标题不会命中：# 后面必须紧跟非空白非 # 字符
    ].join('|'),
    'g',
);

/**
 * 加空格。保护段内部一个字符都不碰，但它**外面**照加——
 * 「打开[[人脉MOC]]看看」变成「打开 [[人脉MOC]] 看看」，空格落在方括号之外，
 * 链接本身一字未动。这个区分是整条规则的要害：真正会断链的是括号里那一个空格，
 * 而括号外那一个恰恰是中文与英文之间该有的呼吸。
 */
function addCjkSpaces(line: string): string {
    let result = '';
    let cursor = 0;
    let match: RegExpExecArray | null;

    PROTECTED.lastIndex = 0;

    while ((match = PROTECTED.exec(line)) !== null) {
        result = join(result, spacePlainText(line.slice(cursor, match.index)));
        result = join(result, match[0]);
        cursor = match.index + match[0].length;
    }

    return join(result, spacePlainText(line.slice(cursor)));
}

/** 两趟替换而非一趟：「中a中」这种夹心要靠第二趟才补得齐右边那个空格 */
function spacePlainText(text: string): string {
    return text.replace(CJK_THEN_LATIN, '$1 $2').replace(LATIN_THEN_CJK, '$1 $2');
}

const IS_CJK = new RegExp(`[${CJK}]`);
/** 可见的半角字符。全角标点被排除在外，因此「路径，」与「。[[链接]]」都不会被塞进空格 */
const IS_ASCII_GRAPH = /[!-~]/;

/**
 * 把两段接起来，必要时在接缝处补一个空格。
 * 判据只有一条：一边是汉字、另一边是可见的半角字符。两边都是全角，或有一边已经是空白，
 * 都不补——中文标点与汉字之间本来就不该有空格，而重复补空格会让这个函数不再幂等。
 */
function join(left: string, right: string): string {
    if (!left || !right) return left + right;

    const tail = left.charAt(left.length - 1);
    const head = right.charAt(0);
    const gap =
        (IS_CJK.test(tail) && IS_ASCII_GRAPH.test(head)) ||
        (IS_ASCII_GRAPH.test(tail) && IS_CJK.test(head));

    return gap ? `${left} ${right}` : left + right;
}

// ============================================================
// 行的种类：空行规则全部建立在它之上
// ============================================================

/** 一行在排版意义上的身份。text 是兜底，它从不要求前后留空行 */
type LineKind = 'blank' | 'heading' | 'list' | 'table' | 'code' | 'text';

const FENCE = /^\s*(?:```|~~~)/;
const HEADING = /^#{1,6}\s/;
const LIST = /^\s*(?:[-*+]|\d+[.)])\s/;
const TABLE = /^\s*\|/;
/** 列表项的续行：至少两格缩进，且上文正处在一个列表里 */
const INDENTED = /^\s{2,}\S/;

/**
 * 逐行判定身份。它必须带着上下文走，因为两件事只看一行是判不出来的：
 * 代码块里的任何一行都是代码（哪怕它长得像标题），而缩进的续行只有在列表里才是列表的一部分。
 */
function classifyLines(lines: readonly string[]): LineKind[] {
    const kinds: LineKind[] = [];
    let inCode = false;
    let inList = false;

    for (const line of lines) {
        if (FENCE.test(line)) {
            kinds.push('code');
            inCode = !inCode;
            inList = false;
            continue;
        }

        if (inCode) {
            kinds.push('code');
            continue;
        }

        // 空行不结束列表：列表项之间空一行仍是同一个列表（松散列表）
        if (line.trim() === '') {
            kinds.push('blank');
            continue;
        }

        if (HEADING.test(line)) {
            kinds.push('heading');
            inList = false;
            continue;
        }

        if (LIST.test(line)) {
            kinds.push('list');
            inList = true;
            continue;
        }

        if (TABLE.test(line)) {
            kinds.push('table');
            inList = false;
            continue;
        }

        if (inList && INDENTED.test(line)) {
            kinds.push('list');
            continue;
        }

        kinds.push('text');
        inList = false;
    }

    return kinds;
}

// ============================================================
// 排版
// ============================================================

/** 每种身份由哪条规则决定「要不要与邻居隔开一行」。text 不在表里，它永远不要求隔开 */
const ISOLATING_RULE: Readonly<Partial<Record<LineKind, FormatRuleKey>>> = {
    heading: 'heading-blank',
    list: 'list-blank',
    table: 'table-blank',
    code: 'code-blank',
};

/**
 * 整理一篇 Markdown。
 *
 * 规则的实现不挂在 FORMAT_RULES 那张表上，是因为八条空行规则本质上共用同一趟扫描：
 * 「标题上下留空行」与「列表上下留空行」在「一个标题紧跟一个列表」这一处是同一个决定，
 * 拆成八个独立变换的话，它们会各自插一行，然后再靠第九条把多余的压掉——
 * 那样既慢，也让「为什么这里是一行不是两行」变成一道要追八步才答得出的题。
 *
 * enabled 传空数组即原样返回：用户把九条全关掉，这个函数就该是恒等函数。
 */
export function formatMarkdown(content: string, enabled: readonly string[]): string {
    const on = new Set(enabled);

    if (on.size === 0) return content;

    const lineEnding = lineEndingOf(content);
    const normalized = content.replace(/\r\n|\r/g, '\n');
    const { frontmatter, body } = splitFrontmatter(normalized);
    const lines = body.split('\n');
    const kinds = classifyLines(lines);
    const out: string[] = [];
    let previousKind: LineKind = 'blank';

    for (let index = 0; index < lines.length; index += 1) {
        const kind = kinds[index];
        let line = lines[index];

        if (on.has('trailing-space')) line = line.replace(/[ \t]+$/, '');

        // 代码块里的字一个都不动：那里面的空格与缩进本身就是内容
        if (on.has('cjk-space') && kind !== 'code') line = addCjkSpaces(line);

        if (kind === 'blank') {
            // 连续空行只留第一个；文档开头的空行一律不留
            if (on.has('blank-collapse') && (out.length === 0 || out[out.length - 1] === '')) {
                continue;
            }

            out.push(line);
            continue;
        }

        if (needsBlankBetween(previousKind, kind, on) && out.length > 0 && out[out.length - 1] !== '') {
            out.push('');
        }

        out.push(line);
        previousKind = kind;
    }

    const formatted = assemble(frontmatter, out.join('\n'), on);

    return lineEnding === '\n' ? formatted : formatted.replace(/\n/g, lineEnding);
}

/**
 * 两行相邻的非空行之间要不要塞一个空行。
 *
 * 同类相邻一律不塞（列表的第二项、表格的第二行、代码块的第二行都不该被拆开），
 * 唯独标题例外：两个标题之间也要空一行，否则「## 甲」下面紧跟「### 乙」会挤成一坨。
 */
function needsBlankBetween(before: LineKind, after: LineKind, on: ReadonlySet<string>): boolean {
    if (before === after && after !== 'heading') return false;

    const rules = [ISOLATING_RULE[before], ISOLATING_RULE[after]];

    return rules.some((rule) => rule !== undefined && on.has(rule));
}

/** 属性区与正文的边界。没有属性区时 frontmatter 为空串，正文就是全文 */
interface SplitNote {
    readonly frontmatter: string;
    readonly body: string;
}

/**
 * 切出文件顶部的属性区。
 *
 * 判据故意收得很紧：必须从第一个字符起就是 `---`，且后面存在一行单独的 `---`。
 * 松一点就会把正文里的水平分割线当成属性区的开头，于是把用户的一段正文当 YAML 保护起来——
 * 那是「不动它」这条承诺用错了地方，比动错了更难发现。
 */
function splitFrontmatter(content: string): SplitNote {
    if (content.indexOf('---\n') !== 0) return { frontmatter: '', body: content };

    const lines = content.split('\n');

    for (let index = 1; index < lines.length; index += 1) {
        if (lines[index].trim() !== '---') continue;

        return {
            frontmatter: lines.slice(0, index + 1).join('\n'),
            body: lines.slice(index + 1).join('\n'),
        };
    }

    return { frontmatter: '', body: content };
}

/** 把属性区与正文接回去，并收拾文件的两头 */
function assemble(frontmatter: string, body: string, on: ReadonlySet<string>): string {
    let text = body;

    if (frontmatter) {
        // 正文开头的空行由这里统一决定，免得与 blank-collapse 各说各话
        text = on.has('yaml-blank')
            ? `${frontmatter}\n\n${text.replace(/^\n+/, '')}`
            : `${frontmatter}\n${text}`;
    }

    if (on.has('final-newline')) text = `${text.replace(/\s*$/, '')}\n`;

    return text;
}
