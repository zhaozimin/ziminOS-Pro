/**
 * [INPUT]: 依赖 obsidian 的 TFile；依赖 core/codeblock 的 ViewContext/ViewDefinition；
 *          依赖 core/constants 的 EXPORT_MANIFEST_FILE/ETERNAL_FOLDERS/ETERNAL_LOG_FILE/
 *          ETERNAL_LOG_INGEST_MARKS/FIELDS；依赖 core/folders 的 isInFolder；
 *          依赖 core/table 的 noteLink/renderEmpty/renderNote/renderSummary/renderTable 与 Cell 类型；
 *          依赖 core/vaultIndex 的 toText；依赖 ./manifest 的 KIND_LABELS/parseManifestLine
 * [OUTPUT]: 对外提供 humanEternalViews（待搬运）与 eternalRawViews（待提炼）两个视图数组
 * [POS]: eternal 模块的读取侧。两张清单住在两本不同的库里，回答的是同一条流水线上
 *        前后两道工序的问题：**「以人为本」那张问「还有什么没送出去」，
 *        《赛博永生》那张问「送进来的还有什么没消化」。**
 *        它们刻意不合并成一个视图，因为插件看不见隔壁库——一张跨库的清单只能靠猜，
 *        而猜出来的数字会让人以为活儿干完了。两张各自只讲自己库里的事实，各自都能自证。
 *        「待提炼」判定已消化与否的依据是账本而不是原料上的标记：
 *        原料层是不可变的事实层（卡帕西那三层里的 Raw），往里写一个 ingested 字段，
 *        它就不再是当初归档时的那份东西了。账本在外面记，原料保持原样。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';

import type { ViewContext, ViewDefinition } from '../../core/codeblock';
import {
    ETERNAL_FOLDERS,
    ETERNAL_LOG_FILE,
    ETERNAL_LOG_INGEST_MARKS,
    EXPORT_MANIFEST_FILE,
    FIELDS,
} from '../../core/constants';
import { isInFolder } from '../../core/folders';
import { noteLink, renderEmpty, renderNote, renderSummary, renderTable } from '../../core/table';
import type { Cell } from '../../core/table';
import { toText } from '../../core/vaultIndex';
import type { ManifestEntry } from './manifest';
import { KIND_LABELS, parseManifestLine } from './manifest';

/** 一张表最多列多少行。与复盘那几张同一个口径：清单要的是判断，不是流水账 */
const MAX_ROWS = 20;

/** 拿不到布局时的兜底称呼。视图是只读的，为一个显示用的名字拒绝渲染毫无道理 */
const FALLBACK_ETERNAL_NAME = '赛博永生';

// ============================================================
// 「以人为本」侧：待搬运
// ============================================================

/**
 * 出库单上还没被勾掉的那些行。
 *
 * 它读的就是那篇出库单本身，因此与桌面智能体看到的永远是同一份事实——
 * 没有第二份索引、没有缓存，也就没有「视图说还欠三个、智能体说一个都没有」的可能。
 */
const pendingHandover: ViewDefinition = {
    name: '待搬运',
    render: async (view: ViewContext): Promise<void> => {
        const eternalName = view.ctx.edition.layout?.eternal ?? FALLBACK_ETERNAL_NAME;
        const content = await readNote(view, EXPORT_MANIFEST_FILE);

        if (content === null) {
            renderEmpty(
                view.el,
                `还没有项目完成过。完成第一个项目并归档之后，这里会列出等着搬进《${eternalName}》的东西。`,
            );

            return;
        }

        const pending = parseEntries(content).filter((entry) => !entry.done);

        if (pending.length === 0) {
            renderSummary(view.el, '都搬完了。');
            renderEmpty(view.el, '新完成的项目会自动出现在这里，不需要你做任何登记。');

            return;
        }

        renderSummary(view.el, `${pending.length} 个已完成的项目等着搬进《${eternalName}》。`);

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['项目', '类型', '归档于'],
            pending.slice(0, MAX_ROWS).map((entry): Cell[] => [
                linkTo(view, entry.name),
                entry.kindLabel || '—',
                entry.stamp || '—',
            ]),
            0,
        );

        if (pending.length > MAX_ROWS) {
            renderNote(view.el, `…另有 ${pending.length - MAX_ROWS} 个也在等着`);
        }
    },
};

/** 「以人为本」库里的视图集合 */
export const humanEternalViews: readonly ViewDefinition[] = [pendingHandover];

// ============================================================
// 《赛博永生》侧：待提炼
// ============================================================

/**
 * 原料层里有、但 log.md 还没记过的那些项目。
 *
 * 这就是「这本库会自动识别新加入的内容」那句话的落地：**认出来是脚本干的，
 * 提炼是智能体干的。** 两件事分开，红线与观感才能同时成立——
 * 没有定时器、没有轮询，打开这篇笔记就是一次重算，数字永远是此刻的事实。
 */
const pendingIngest: ViewDefinition = {
    name: '待提炼',
    render: async (view: ViewContext): Promise<void> => {
        const raws = rawContainers(view);

        if (raws.length === 0) {
            renderEmpty(
                view.el,
                '原料层还是空的。在《以人为本》里完成一个项目并归档，下次和智能体说话时它会把项目搬进来。',
            );

            return;
        }

        const ingested = await ingestedUids(view);
        const pending = raws.filter((file) => {
            const uid = fieldOf(view, file, FIELDS.uid);

            // 拿不到 UID 的原料一律算待提炼：宁可让智能体多看一眼，
            // 也不能因为一个字段缺失就把一份真实存在的材料从清单上抹掉
            return uid === '' || !ingested.has(uid);
        });

        if (pending.length === 0) {
            renderSummary(view.el, `${raws.length} 份原料全部提炼过了。`);
            renderEmpty(view.el, '新搬进来的项目会自动出现在这里。');

            return;
        }

        renderSummary(view.el, `${pending.length} / ${raws.length} 份原料还没提炼。`);

        renderTable(
            view.ctx.app,
            view.el,
            view.sourcePath,
            ['原料', '类型', '归档于'],
            pending.slice(0, MAX_ROWS).map((file): Cell[] => [
                noteLink(file),
                kindLabelOf(view, file),
                fieldOf(view, file, FIELDS.archived) || '—',
            ]),
            0,
        );

        if (pending.length > MAX_ROWS) {
            renderNote(view.el, `…另有 ${pending.length - MAX_ROWS} 份原料也在等着`);
        }
    },
};

/** 《赛博永生》库里的视图集合 */
export const eternalRawViews: readonly ViewDefinition[] = [pendingIngest];

// ============================================================
// 取数
// ============================================================

/** 把出库单正文解析成一串条目，认不出的行直接落选而不是让整张表炸掉 */
function parseEntries(content: string): readonly ManifestEntry[] {
    const entries: ManifestEntry[] = [];

    for (const line of proseLines(content)) {
        const entry = parseManifestLine(line);

        if (entry) entries.push(entry);
    }

    return entries;
}

/**
 * 只交出代码围栏之外的行。
 *
 * 这两篇笔记的正文里都写着自己的格式示例——账本开头有三行样例，出库单里有一个视图代码块。
 * 逐行扫描会把示例当成真账：账本那行示例里的 UID 会被登记为「已提炼」，
 * 于是某天真有一个项目撞上这个号，它会永远显示成消化过了，而没有任何东西报错。
 * 教格式的句子必须先让自己不被当成格式，这与 core/table 里
 * 「空态示例走行内代码」是同一条判据的两面。
 */
function* proseLines(content: string): Generator<string> {
    let fenced = false;

    for (const line of content.split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) {
            fenced = !fenced;
            continue;
        }

        if (!fenced) yield line;
    }
}

/**
 * 原料层里的容器 MOC。
 *
 * 认的是「原料目录下、同时带 UID 与 type 的 md」而不是「所有 md」：
 * 一个项目文件夹里躺着的每张卡片也在这个目录下，把它们全算成原料，
 * 数字会瞬间失真十倍，而失真的方向恰恰是让人觉得欠了很多活。
 */
function rawContainers(view: ViewContext): readonly TFile[] {
    return view.index
        .allNotes()
        .filter((file) => isInFolder(file.path, ETERNAL_FOLDERS.raw))
        .filter(
            (file) =>
                fieldOf(view, file, FIELDS.uid) !== '' && fieldOf(view, file, FIELDS.type) !== '',
        );
}

/**
 * 账本里已经记过「消化」的 UID 集合。
 *
 * 判据宽松是刻意的：只要那一行里同时出现消化标记与一串数字 UID，就算数。
 * 账本是智能体逐行追加、人也会去读去改的文件，对它的格式要求越严，
 * 它越容易在某次手改之后整体失效——而失效的表现是「所有原料忽然都变成待提炼」，
 * 接着一次重复提炼就把 wiki 写乱了。宽松在这里是安全侧。
 */
async function ingestedUids(view: ViewContext): Promise<ReadonlySet<string>> {
    const content = await readNote(view, ETERNAL_LOG_FILE);
    const uids = new Set<string>();

    if (content === null) return uids;

    // 走 proseLines 而不是 split：账本正文开头就写着三行格式示例，
    // 那行示例里的 UID 若被登记成已提炼，撞上它的真项目会永远显示成消化过了
    for (const line of proseLines(content)) {
        if (!ETERNAL_LOG_INGEST_MARKS.some((mark) => line.includes(mark))) continue;

        for (const matched of line.matchAll(/\d{8,}/g)) {
            uids.add(matched[0]);
        }
    }

    return uids;
}

/** 读一篇笔记的正文。不存在返回 null 而不是空串——「没有这篇」与「这篇是空的」是两件事 */
async function readNote(view: ViewContext, path: string): Promise<string | null> {
    const file = view.ctx.app.vault.getAbstractFileByPath(path);

    return file instanceof TFile ? view.ctx.app.vault.read(file) : null;
}

/**
 * 把出库单上的项目名画成链接。
 *
 * 名字要经索引解析回真实文件才能画成可点的链接；解析不到就退回纯文字——
 * 项目可能已经被用户改名或删掉，而一条点开是空白新笔记的链接比纯文字更糟。
 */
function linkTo(view: ViewContext, name: string): Cell {
    const file = view.index.resolve(name, view.sourcePath);

    return file ? noteLink(file, name) : name;
}

/**
 * 原料的类型，取中文显示名。
 *
 * 原料是从《以人为本》原样拷来的项目 MOC，它的 `type` 是 `project` / `book` 这类机器值——
 * 那是给视图认身份用的，不是给人读的。这本库里除了它，用户看得见的每一个词都是中文；
 * 单让这一列说英文，等于在一张中文表格里留一个没人解释的字段。
 * 显示名与出库单共用 KIND_LABELS 那一份，两张清单讲同一件事时不会各叫各的。
 */
function kindLabelOf(view: ViewContext, file: TFile): string {
    const type = fieldOf(view, file, FIELDS.type);

    // 认不出的 type 原样显示而不是画成「—」：那是用户自己造的身份，
    // 抹成横杠等于告诉他这份原料没有类型，而它明明有
    return KIND_LABELS[type] ?? (type || '—');
}

/** 取一个 frontmatter 字段并收敛成可比较的文本。缺失、null、数字统一成字符串 */
function fieldOf(view: ViewContext, file: TFile, field: string): string {
    return toText(view.index.fieldOf(file, field)).trim();
}
