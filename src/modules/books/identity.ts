/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型；依赖 core/constants 的 FIELDS/MOC_PREFIX/NOTE_TYPES、
 *          core/folders 的 isSystemPath、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 isBookMoc（哪篇笔记算一本书）、bookNameOf（这本书叫什么）、
 *           bookTitlesOf/bookAuthorOf（它已知的全部名字与作者，三条命令共用同一份答案）、
 *           allBookMocs（全库的书，命令侧候选清单）、isArchivedBook（读完归档了没有）
 * [POS]: books 模块的身份判定处，与 contacts/identity 担同一职：
 *        「哪篇算数」这个问题只答一遍，导入与摘卡两条命令共用同一个答案。
 *        身份靠 type: book 认、不靠文件夹——与全库视图同一条纪律；
 *        归档目录里的书不排除：给读完的书补录划线是正当动作，不是错误。
 *        命令拿不到视图引擎的索引，只能自己走一遍 metadataCache，
 *        开销发生在人点了命令之后、弹窗出现之前，量级是全库一次遍历，感知不到
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import { FIELDS, FOLDERS, MOC_PREFIX, NOTE_TYPES } from '../../core/constants';
import { isInFolder, isSystemPath, normalizeFolderPath } from '../../core/folders';
import type { ZiminosContext } from '../../core/types';

/** 这篇笔记是不是一本书的 MOC？type 可能被写成字符串或单元素列表，两种都认 */
export function isBookMoc(ctx: ZiminosContext, file: TFile): boolean {
    const declared = ctx.app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.type];
    const values = Array.isArray(declared) ? declared : [declared];

    return values.some((value) => String(value ?? '').trim() === NOTE_TYPES.book);
}

/**
 * 这本书叫什么：一本书是「《书名》文件夹 + MOC-《书名》」，文件夹名就是书名。
 * MOC 直接躺在库根这种手工造出来的形态没有文件夹可取，退回剥掉前缀的文件名。
 */
export function bookNameOf(file: TFile): string {
    const folderName = file.parent?.name ?? '';

    if (folderName) return folderName;

    return file.basename.startsWith(MOC_PREFIX)
        ? file.basename.slice(MOC_PREFIX.length)
        : file.basename;
}

/**
 * 这本书已知的全部名字：文件夹名（去掉书名号）＋ aliases 里的每一个。
 *
 * 三条命令都得问这一句——同步划线、批量导入时的库内查重、补书目时的豆瓣指认。
 * 各问各的话，同一本书在三条命令下会得到三批不同的名字，
 * 而书名匹配的成败全看递进去的是哪一批。aliases 里装的正是带副标题的全名，
 * 那往往才是设备与豆瓣那头写的名字。
 */
export function bookTitlesOf(ctx: ZiminosContext, moc: TFile): readonly string[] {
    const raw = ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.[FIELDS.aliases];
    const list = Array.isArray(raw) ? raw : [raw];
    const aliases = list.map((value) => String(value ?? '').trim()).filter(Boolean);

    return [stripBraces(bookNameOf(moc)), ...aliases].filter(Boolean);
}

/** 书的 MOC 上写着的第一位作者，用来给书名匹配再收一道口 */
export function bookAuthorOf(ctx: ZiminosContext, moc: TFile): string {
    const raw = ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.author;
    const list = Array.isArray(raw) ? raw : [raw];

    return String(list[0] ?? '').trim();
}

/** 《书名》→ 书名 */
function stripBraces(name: string): string {
    const inner = /^《(.+)》$/.exec(name);

    return inner ? inner[1] : name;
}

/** 全库的书，按名字排序。功能目录照旧排除 */
export function allBookMocs(ctx: ZiminosContext): TFile[] {
    const matched: TFile[] = [];

    for (const file of ctx.app.vault.getMarkdownFiles()) {
        if (isSystemPath(file.path)) continue;
        if (isBookMoc(ctx, file)) matched.push(file);
    }

    return matched.sort((left, right) => bookNameOf(left).localeCompare(bookNameOf(right), 'zh'));
}

/**
 * 这本书读完归档了没有。
 *
 * 归档的书不从候选里剔除——给读完的书补录几条划线是正当动作，不是错误；
 * 但清单上必须认得出来，否则读完八本、在读两本的人面对十个只有书名的条目，
 * 只能靠记忆去猜哪一个是他刚才那本。
 */
export function isArchivedBook(ctx: ZiminosContext, file: TFile): boolean {
    return isInFolder(file.path, normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives));
}
