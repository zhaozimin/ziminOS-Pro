/**
 * [INPUT]: 依赖同目录 sourceWeread 的 wereadAvailable/listWereadBooks/readWereadBookHighlights、
 *          sourceKindle 的 kindleAvailable/listKindleBooks、
 *          sourceAppleBooks 的 appleBooksAvailable/listAppleBooks/readAppleBookHighlights、
 *          parsers 的 ParsedHighlight 类型与 core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 LibraryBook/LibraryHighlights/LibrarySource 契约与 LIBRARY_SOURCES 三份规格
 * [POS]: 三个划线来源的**全量枚举**面，与 sources.ts 是一对兄弟：
 *        那一份回答「我手上这本书的划线在哪儿」（按名字拉），这一份回答「你那儿都有些什么」（整架端走）。
 *        方向相反，因此不能合并——按名字拉的那条路每问一本书就要重新枚举一次全部来源，
 *        批量跑八十本就是八十次 notebook 请求、八十次重读整份 My Clippings。
 *
 *        三个来源在「只要划线了或记笔记了」这个筛子上待遇不同，这是本文件最值得记的一件事：
 *        Kindle 与苹果图书**天生就筛好了**——groupKindleEntries 跳过书签与空内容，
 *        listAppleBooks 的 SQL 写着 ZANNOTATIONSELECTEDTEXT IS NOT NULL；
 *        微信读书的 /api/user/notebook 是「我的笔记」书架，里面可能混着只加过书签的书。
 *        于是筛子只能落在**实际取回了什么**上，而不是任何一个计数字段：
 *        取回零条就不建档。多花一次请求，换的是这条规则对三个来源同时成立，
 *        且不依赖某个接口某天还会不会返回那个字段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ZiminosContext } from '../../core/types';
import type { ParsedHighlight } from './parsers';
import { listWereadBooks, readWereadBookHighlights, wereadAvailable } from './sourceWeread';
import { kindleAvailable, listKindleBooks } from './sourceKindle';
import { appleBooksAvailable, listAppleBooks, readAppleBookHighlights } from './sourceAppleBooks';

// ============================================================
// 契约
// ============================================================

/** 一次取数的结果：拿到的划线，以及「这次少了什么、为什么」的一句实话 */
export interface LibraryHighlights {
    readonly highlights: readonly ParsedHighlight[];
    /** 来源自己的交代；没有就是空 */
    readonly note?: string;
}

/**
 * 来源里的一本书。
 *
 * read 是函数而不是已经取好的数据，因为三个来源的代价差了两个数量级：
 * Kindle 整份文件一次解析完（划线早就在手里），微信读书每本书要两次网络请求。
 * 把取数推迟到真正要用的那一刻，「跑到第几本」才是一句诚实的话。
 */
export interface LibraryBook {
    readonly id: string;
    readonly title: string;
    readonly author: string;
    read(): Promise<LibraryHighlights>;
}

/** 一个可以整架端走的来源 */
export interface LibrarySource {
    readonly key: 'weread' | 'kindle' | 'apple';
    readonly label: string;
    /** 这台机器此刻能不能用它 */
    available(ctx: ZiminosContext): boolean;
    /** 用不了时说给学员听的那句话：它必须说清**下一步该做什么**，而不只是「不可用」 */
    readonly unavailableHint: string;
    /** 整架书目。天然只含有划线或有笔记的书（微信读书除外，见文件头） */
    list(ctx: ZiminosContext): Promise<readonly LibraryBook[]>;
    /**
     * 两本书之间歇多久（毫秒）。
     *
     * 本机来源是 0——读自己电脑上的文件不需要对谁客气。
     * 微信读书走网络，八十本书就是一百六十次请求；这个间隔不是为了绕过什么，
     * 是因为**一次批量导入对服务器来说本就该长得像一个人在翻书，而不是像一次抓取**。
     */
    readonly pacingMs: number;
}

// ============================================================
// 三份规格
// ============================================================

const WEREAD: LibrarySource = {
    key: 'weread',
    label: '微信读书',
    available: (ctx) => wereadAvailable(ctx),
    unavailableHint: '还没连上微信读书。先运行一次「连接微信读书」，扫码登录之后再回来。',
    pacingMs: 400,
    list: async (ctx) => {
        const books = await listWereadBooks(ctx);

        return books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            read: () => readWereadBookHighlights(ctx, book),
        }));
    },
};

const KINDLE: LibrarySource = {
    key: 'kindle',
    label: 'Kindle',
    available: () => kindleAvailable(),
    unavailableHint:
        '没找到 My Clippings.txt。用数据线把 Kindle 插上，' +
        '或者把设备 documents 目录里的 My Clippings.txt 复制到「下载」或桌面。',
    pacingMs: 0,
    list: async () =>
        // 整份文件在枚举这一步就解析完了，每本书的划线早已在手里：
        // 这里的 read 只是把它交出去，不会再碰一次磁盘
        listKindleBooks().map((book) => ({
            id: book.title,
            title: book.title,
            author: book.author,
            read: async () => ({ highlights: book.highlights }),
        })),
};

const APPLE: LibrarySource = {
    key: 'apple',
    label: '苹果图书',
    available: () => appleBooksAvailable(),
    unavailableHint:
        '这台机器上没找到苹果图书的划线数据（需要在本机的「图书」App 里读过并划过线）。',
    pacingMs: 0,
    list: async () => {
        const books = await listAppleBooks();

        return books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            read: async () => ({ highlights: await readAppleBookHighlights(book.id) }),
        }));
    },
};

/** 三份规格，按命令注册顺序排。加一个来源 = 这里多一条，导入流程一个字都不改 */
export const LIBRARY_SOURCES: Readonly<Record<LibrarySource['key'], LibrarySource>> = {
    weread: WEREAD,
    kindle: KINDLE,
    apple: APPLE,
};
