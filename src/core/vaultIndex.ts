/**
 * [INPUT]: 依赖 obsidian 的 App/TFile 与其公开索引 metadataCache.resolvedLinks、
 *          metadataCache.getFileCache、metadataCache.getFirstLinkpathDest、vault.cachedRead，及 ./lineEndings 的拆行能力
 * [OUTPUT]: 对外提供 VaultIndex 类（backlinksOf / frontmatterLinksTo / resolve / frontmatterOf /
 *           notesOfType / listLinesOf / invalidate）与携带原行快照的 ListLine 类型
 * [POS]: 视图引擎的事实层，二十四个笔记内视图的唯一数据来源（关于作者除外）。
 *        它只回答关于文件的客观问题——
 *        谁链到了我、这个链接指向哪个文件、这篇笔记有哪些列表行——不认识「人脉」「复盘」
 *        任何一个业务概念，业务口径一律由 modules 侧解释。
 *        它取代的是 Dataview 的索引层，因此必须补上 Dataview 两个已知的坑：
 *        其一，行级链接在 Dataview 里未被规范化成完整路径，逐字比对恒为 false；
 *        这里一律经 getFirstLinkpathDest 解析后比对 TFile，别名、子路径、锚点三种写法都认得。
 *        其二，Dataview 靠 2500ms 轮询刷新，而红线不许轮询；这里改为事件驱动失效——
 *        索引懒构建、按修订号自校验，两次渲染之间没有任何后台活动
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { App, ListItemCache } from 'obsidian';
import { isSystemPath } from './folders';
import { splitTextLines } from './lineEndings';

/**
 * 一条列表行的解析结果。
 * text 已剥掉列表标记与复选框，因此「- [ ] 出方案给 [[张三]]」的 text 是「出方案给 [[张三]]」。
 */
export interface ListLine {
    /** 剥掉列表标记与复选框后的整行文本 */
    readonly text: string;
    /** 含缩进与标记的首行原文；写回时用于确认任务身份，不用压平后的显示文本代替 */
    readonly rawLine: string;
    /** 是否是任务行（写了方括号复选框） */
    readonly isTask: boolean;
    /** 任务是否已勾选；非任务行恒为 false */
    readonly checked: boolean;
    /** 行内出现的 wikilink 原文（已去掉别名与锚点，尚未解析成文件） */
    readonly links: readonly string[];
    /** 行首在文件中的行号，从 0 起 */
    readonly line: number;
}

/** 列表标记与复选框：`- `、`* `、`1. `、`- [ ] `、`- [x] ` 全覆盖 */
const LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[(.)\]\s*)?/;

/** 行内 wikilink；只取内层文本，别名与锚点在解析时再剥 */
const WIKILINK = /\[\[([^\]]+)\]\]/g;

/** 列表行缓存同时认文件时间与元数据快照，索引迟到不能沿用旧位置解析的结果 */
interface CachedLines {
    readonly mtime: number;
    readonly items: readonly ListItemCache[] | undefined;
    readonly lines: readonly ListLine[];
}

/**
 * 全库只读索引。
 *
 * 生命周期与插件同寿：每次内容变更由宿主调 invalidate 递增修订号，
 * 下一次真正有人来问的时候才重建——没人打开笔记就没人问，也就没有任何计算。
 */
export class VaultIndex {
    private readonly app: App;

    /** 修订号。变更事件只递增它，不做任何重建工作，因此事件回调恒为 O(1) */
    private revision = 0;

    /** 反向链接索引构建时的修订号，与当前修订号不等即视为过期 */
    private backlinksRevision = -1;
    private backlinks: Map<string, TFile[]> | null = null;

    /** 按 type 分组的笔记，同一次渲染里一张 MOC 要问四五遍，缓存一次省四五遍全库遍历 */
    private typesRevision = -1;
    private types: Map<string, TFile[]> | null = null;

    /**
     * 列表行缓存。它刻意不随修订号整体作废——每条记录自带 mtime 与 listItems 快照，
     * 改一篇日记不该让另外九十七篇重新读盘。
     */
    private readonly listCache = new Map<string, CachedLines>();

    constructor(app: App) {
        this.app = app;
    }

    /** 宣告索引已过期。只递增计数，重建推迟到下一次查询 */
    invalidate(): void {
        this.revision += 1;
    }

    /**
     * 全库 Markdown 笔记，功能目录（90-system）除外。
     * 那里住的是导航、模板与属性示例——系统的零件，没有知识属性，不参与检索。
     * 排除做在这一层，notesOfType 与所有靠它遍历的视图自动继承，不必各自记得。
     */
    allNotes(): TFile[] {
        return this.app.vault.getMarkdownFiles().filter((file) => !isSystemPath(file.path));
    }

    /** 某篇笔记的 frontmatter；没有 YAML 时返回 undefined */
    frontmatterOf(file: TFile): Record<string, unknown> | undefined {
        return this.app.metadataCache.getFileCache(file)?.frontmatter;
    }

    /**
     * 取 frontmatter 里某个字段的原始值。
     * 视图对字段的一切访问都走这里，好处是「笔记没有 YAML」与「有 YAML 但没这个字段」
     * 在调用侧收敛成同一个 undefined，不必每处各写一次可选链。
     */
    fieldOf(file: TFile, field: string): unknown {
        return this.frontmatterOf(file)?.[field];
    }

    /**
     * 全库 type 为指定值的笔记。
     *
     * 身份靠 type 认，不靠文件夹——学员重命名目录、改分层、用英文目录名，视图一个都不用改。
     * type 在 Obsidian 里可能被写成字符串也可能被写成单元素列表，两种都认。
     */
    notesOfType(type: string): readonly TFile[] {
        if (!this.types || this.typesRevision !== this.revision) {
            const grouped = new Map<string, TFile[]>();

            for (const file of this.allNotes()) {
                for (const value of toStringList(this.fieldOf(file, 'type'))) {
                    const bucket = grouped.get(value);

                    if (bucket) bucket.push(file);
                    else grouped.set(value, [file]);
                }
            }

            this.types = grouped;
            this.typesRevision = this.revision;
        }

        return this.types.get(type) ?? [];
    }

    /**
     * 链到指定文件的全部笔记。
     *
     * 用一次全库遍历建反向表而不是逐个正查：一张名录有上百个人，
     * 逐个去 resolvedLinks 里正查是「人数 × 全库」，建一次表是「全库」，
     * 而这张表在同一次渲染里被所有视图共用。
     */
    backlinksOf(file: TFile): readonly TFile[] {
        if (!this.backlinks || this.backlinksRevision !== this.revision) {
            const map = new Map<string, TFile[]>();
            const resolved = this.app.metadataCache.resolvedLinks;

            for (const sourcePath of Object.keys(resolved)) {
                // 功能目录里的链接不算数：属性示例里的「[[某位客户]]」是教材，不是事实
                if (isSystemPath(sourcePath)) continue;

                const source = this.app.vault.getAbstractFileByPath(sourcePath);

                if (!(source instanceof TFile)) continue;

                for (const targetPath of Object.keys(resolved[sourcePath])) {
                    const bucket = map.get(targetPath);

                    if (bucket) bucket.push(source);
                    else map.set(targetPath, [source]);
                }
            }

            this.backlinks = map;
            this.backlinksRevision = this.revision;
        }

        return this.backlinks.get(file.path) ?? [];
    }

    /**
     * 一篇来源笔记是否在 frontmatter 的任意属性里链到了指定目标。
     *
     * `resolvedLinks` 只能回答“这篇里出现过链接”，不能回答链接写在属性还是正文。
     * 客户答疑的归属是属性事实，正文里举例提到另一个客户不该把整篇答疑挂到他名下，
     * 因此再用官方 frontmatterLinks 缩一次范围，并仍经 resolve 比对真实路径。
     */
    frontmatterLinksTo(source: TFile, target: TFile): boolean {
        const links = this.app.metadataCache.getFileCache(source)?.frontmatterLinks ?? [];

        return links.some((link) => this.resolve(link.link, source.path)?.path === target.path);
    }

    /**
     * 把一段 wikilink 原文解析成它真正指向的文件。
     *
     * 这是全库唯一允许的链接比对方式。`[[张三]]`、`[[张三|老张]]`、`[[02-areas/人脉/张三]]`、
     * `[[张三#约定]]` 指向同一篇笔记，任何基于文件名的字符串匹配都会在其中某一种上失手——
     * 而失手的表现是视图静默少一行，不报错、不留痕。
     */
    resolve(linktext: string, sourcePath: string): TFile | null {
        const path = linktext.split('#')[0].replace(/\\$/, '').trim();

        if (!path) return null;

        return this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    }

    /**
     * 读出一篇笔记的全部列表行。
     *
     * metadataCache 的 listItems 只给位置与复选框，不给文本，所以必须回磁盘取一次原文。
     * 调用方永远只对「反链指向我的那几篇日记」调它，不扫全库——
     * 一份人情账本要读的通常是几十篇日记，不是几千篇笔记。
     */
    async listLinesOf(file: TFile): Promise<readonly ListLine[]> {
        const path = file.path;
        const mtime = file.stat.mtime;
        const items = this.app.metadataCache.getFileCache(file)?.listItems;
        const cached = this.listCache.get(path);

        if (cached && cached.mtime === mtime && cached.items === items) return cached.lines;

        const lines = items?.length ? parseListLines(await this.app.vault.cachedRead(file), items) : [];

        // await 后文件或元数据可能已经改变；旧读盘结果不能冒充新快照，也不能覆盖它的缓存。
        if (file.path === path && file.stat.mtime === mtime
            && this.app.metadataCache.getFileCache(file)?.listItems === items) {
            this.listCache.set(path, { mtime, items, lines });
        }

        return lines;
    }
}

// ============================================================
// 解析
// ============================================================

/** 按 listItems 给出的位置切出每一条列表行并剥掉标记 */
function parseListLines(content: string, items: readonly ListItemCache[]): ListLine[] {
    const parsed: ListLine[] = [];
    const physicalLines = splitTextLines(content).lines;

    for (const item of items) {
        const raw = content.slice(item.position.start.offset, item.position.end.offset);
        const marker = LIST_MARKER.exec(raw);
        // 多行列表项在此压成一行：视图消费的都是单行约定（账本行、事件行、任务行）
        const text = raw.slice(marker?.[0].length ?? 0).replace(/\s*\n\s*/g, ' ').trim();
        const box = typeof item.task === 'string' ? item.task : marker?.[1];

        parsed.push({
            text,
            rawLine: physicalLines[item.position.start.line] ?? '',
            isTask: typeof box === 'string',
            checked: typeof box === 'string' && box.trim().toLowerCase() === 'x',
            links: extractLinks(text),
            line: item.position.start.line,
        });
    }

    return parsed;
}

/**
 * 抽出一段文字里的全部 wikilink，去掉别名与锚点，只留可供解析的链接路径。
 * 导出是给「只看某一段」的调用方用的——人情账本的债主只认首段里的链接，
 * 事项里被顺带提到的人不算欠债。
 */
export function extractLinks(text: string): string[] {
    const links: string[] = [];

    WIKILINK.lastIndex = 0;

    let match = WIKILINK.exec(text);

    while (match) {
        // 表格里的链接会写成 [[张三\|老张]]，别名分隔符前多一个转义反斜杠
        const linktext = match[1].split('|')[0].replace(/\\$/, '').trim();

        if (linktext) links.push(linktext);

        match = WIKILINK.exec(text);
    }

    return links;
}

/**
 * 把 frontmatter 里的值收敛成字符串数组。
 * type、tags、get 这类字段在 YAML 里既可能写成一个词也可能写成一串，
 * 两种写法在 Obsidian 里分别解析成 string 与 array，视图不该为此各写一遍分支。
 */
export function toStringList(value: unknown): string[] {
    if (value === null || value === undefined) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0);
    }

    const text = String(value).trim();

    return text ? [text] : [];
}

/** 把 frontmatter 里的值收敛成单个字符串，缺失或空白返回空串 */
export function toText(value: unknown): string {
    if (value === null || value === undefined) return '';

    return String(value).trim();
}

/** 把 frontmatter 里的值收敛成布尔：只有明确为真才算真，缺失即否 */
export function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;

    const text = toText(value).toLowerCase();

    return text === 'true' || text === 'yes' || text === '是';
}
