/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 TFile 类型；依赖 core/commands 的 BOOK_COMMANDS、
 *          core/modals 的 TextInputModal、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 BookContainerPreset/BookContainerCreator 契约、
 *           createBook 与 registerCreateBookCommand（命令 create-book）
 * [POS]: books 模块的建书入口。一本书就是一个项目，「文件夹 + MOC」那套流程住在
 *        projects 的 createContainer 里——本模块不 import 它，只声明一个
 *        「建一个书籍容器」的洞（BookContainerCreator），由 main 用 createContainer
 *        与 BOOK_KIND 填上，与 PersonPicker/DailyNoteProvider 同一手法。
 *        本文件只管书特有的三问：书名（必答，文件名自动包上《》，真实书名写入 aliases）、
 *        作者、为什么想读——
 *        后两问 Esc 或留空都直接放行，与开荒问名字同一姿态：宁可跳过也不打断。
 *        防覆盖、光标落点与全部错误文案由容器流程统一给出，这里一句都不重写
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { BOOK_COMMANDS } from '../../core/commands';
import { TextInputModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import type { Bibliography, ContainerSection } from '../projects/templates';

/** 建书容器要交出去的全部答案。字段与 createContainer 的预设契约结构兼容 */
export interface BookContainerPreset {
    /** 已包好《》的书名，同时是文件夹名与 MOC 文件名的后半截 */
    name: string;
    /** 为什么想读它，写入 description；空串即跳过 */
    description: string;
    /** 作者；缺省即学员跳过了这一问 */
    author?: string;
    /** 真实书名，落成至少一个别名，供导航展示与书名匹配使用 */
    aliases: readonly [string, ...string[]];
    /** 已经拼成 `书籍/xxx` 的标签，落成 tags。只有走豆瓣那条路才有 */
    tags?: readonly string[];
    /**
     * 这本书的 ISBN，落成 UID。只有走豆瓣、且那本书确实登记了书号时才有。
     * 缺席即回落到时间戳 UID——手动建的书没有豆瓣可查，那是它应得的待遇，不是降级。
     */
    uid?: number;
    /** 豆瓣条目地址，落成 source */
    source?: string;
    /** 书目字段（译者、出版社、出版年、页数、封面），落成 YAML。只有走豆瓣那条路才有 */
    bibliography?: Bibliography;
    /** 覆盖小节骨架。目前无人使用，形状与容器预设保持一致 */
    sections?: readonly ContainerSection[];
}

/**
 * 「建一个书籍容器」这项能力，由 main 在装配时注入。
 * 建书要走 createContainer 的全套流程（防覆盖、光标落点、中文 Notice），
 * 而那套流程住在 projects 模块——本文件因此不 import 那个模块，只声明这个洞。
 */
export type BookContainerCreator = (preset: BookContainerPreset) => Promise<TFile | null>;

const MESSAGES = {
    namePrompt: '这本书叫什么名字？',
    namePlaceholder: '例如：卡片笔记写作法',
    nameMissing: '未输入书名，操作已取消。',
    authorPrompt: '作者是谁？（选填，Esc 跳过）',
    descriptionPrompt: '一句话：为什么想读这本书？（选填，Esc 跳过）',
} as const;

/**
 * 新建一本书：三问之后交给容器流程。
 * 返回新建的 MOC 文件；取消、名称非法、同名已存在或过程出错时返回 null。
 */
export async function createBook(
    ctx: ZiminosContext,
    create: BookContainerCreator,
): Promise<TFile | null> {
    const nameInput = await new TextInputModal(ctx.app, {
        title: MESSAGES.namePrompt,
        placeholder: MESSAGES.namePlaceholder,
    }).openAndGetValue();

    if (nameInput === null || !nameInput.trim()) {
        new Notice(MESSAGES.nameMissing);

        return null;
    }

    const trueName = unwrapBookTitle(nameInput.trim());

    // 「《 》」外层看起来非空，去掉书名号后却没有真实书名，不能用空 alias 建档
    if (!trueName) {
        new Notice(MESSAGES.nameMissing);

        return null;
    }

    const name = wrapBookTitle(trueName);

    // 后两问 Esc 与留空同义：书名之后的一切都不该拦住建书这件事
    const authorInput = await new TextInputModal(ctx.app, {
        title: MESSAGES.authorPrompt,
    }).openAndGetValue();
    const author = (authorInput ?? '').trim();

    const descriptionInput = await new TextInputModal(ctx.app, {
        title: MESSAGES.descriptionPrompt,
    }).openAndGetValue();
    const description = (descriptionInput ?? '').trim();

    return create({ name, aliases: [trueName], description, ...(author ? { author } : {}) });
}

/** 注册「新建读书笔记」命令 */
export function registerCreateBookCommand(
    ctx: ZiminosContext,
    create: BookContainerCreator,
): void {
    ctx.commands.register(BOOK_COMMANDS.create, () => {
        void createBook(ctx, create);
    });
}

/**
 * 给书名包上《》；学员自己敲了书名号就不再包一层。
 * 《》让书在文件树、导航表与边栏的任何清单里一眼认出来是书，不与项目混行。
 */
function wrapBookTitle(input: string): string {
    return `《${input}》`;
}

/** 去掉用户可能已经输入的一层书名号，aliases 只保留书本自己的名字 */
function unwrapBookTitle(input: string): string {
    const inner = /^《(.+)》$/.exec(input);

    return (inner ? inner[1] : input).trim();
}
