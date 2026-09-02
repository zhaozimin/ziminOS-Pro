/**
 * [INPUT]: 依赖 obsidian 的 Platform/Notice/requestUrl（后者是公开 API，可自定义请求头与携带 Cookie）；
 *          运行时按需 require('@electron/remote') 取 BrowserWindow（登录窗口，仅桌面端）；
 *          依赖 core/types 的 ZiminosContext、parsers 的 ParsedHighlight
 * [OUTPUT]: 对外提供 wereadAvailable、loginWeread/disconnectWeread/disposeWereadSession 登录态生命周期、
 *           listWereadBooks、readWereadBookHighlights
 * [POS]: 划线来源之一：微信读书。三个来源里唯一需要登录的一个，也因此是唯一会失效的一个。
 *        它与另两个来源的分工写在这里：苹果图书与 Kindle 的数据在本机，读它们是确定的；
 *        微信读书的数据在腾讯的服务器上，只能带着登录态去要。
 *        登录只做一次且不碰账号密码——开一个真正的浏览器窗口让学员用微信扫码，
 *        成功后从那个窗口的会话里取走 Cookie。这是 Obsidian 生态里这类插件的通行做法，
 *        也是唯一不必让学员去开发者工具里手抄一长串 Cookie 的做法。
 *        取数走**两套通道**，这是 2026-08-14 真机实测定下来的：
 *        书架仍走 Cookie（`/api/user/notebook`），而划线与想法走取数网关
 *        （`i.weread.qq.com/api/agent/gateway`，认 Bearer 令牌，令牌用登录态换）。
 *        非如此不可——老的 `weread.qq.com/web/*` 两条路都已作废：
 *        `/web/review/list` 回 200 + `{"errCode":-2012,"errMsg":"登录超时"}`，
 *        `/web/book/bookmarklist` 更彻底，无论带不带 Cookie、书号真假一律回 200 + `{}`，
 *        连错误码都不给。后者尤其危险：一具空壳的回答与「这本书确实没划过线」完全一样。
 *        由此定下本文件最要紧的一条纪律：**判成败不能只看 HTTP 状态码**，
 *        微信读书失败时照样回 200 并把错误写在正文里（网关用 errcode、老接口用 errCode，
 *        两套都要认），只看状态码就会把一次失败当成「这本书一条划线都没有」讲给学员听。
 *        令牌刻意不落盘：它随时能拿登录态再换，存下来只会多一份会过期、要维护、
 *        断开时要记得一并清掉的凭据——全插件的持久凭据仍然只有 Cookie 一份。
 *        章节名有两个来源：划线接口自带的章节表，以及想法条目自带的 chapterName；
 *        后者不是冗余——一本书可能一条纯划线都没有，那时章节表是空的
 *        部分取数也必须诚实：想法接口失败时可以保留已取回的划线，
 *        但结果必须带 note，不得把「只成功一半」伪装成完整同步
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform, requestUrl } from 'obsidian';
import type { ZiminosContext } from '../../core/types';
import type { ParsedHighlight } from './parsers';

// ============================================================
// 契约
// ============================================================

/** 微信读书书架里的一本有笔记的书 */
export interface WereadBook {
    readonly id: string;
    readonly title: string;
    readonly author: string;
}

/** 一次取数的结果：拿到的划线，以及「这次少了什么、为什么」的一句实话 */
export interface WereadHighlights {
    readonly highlights: readonly ParsedHighlight[];
    /** 与微读自己的账对不上时的交代；对得上就是空串 */
    readonly note: string;
}

const BASE = 'https://weread.qq.com';

/**
 * 微信读书的取数网关（v0.14.0 起走这条）。
 *
 * 旧的 `weread.qq.com/web/*` 那两条路已经死了（实测见 api 的注释），而这条是活的：
 * 它是微读为「技能/智能体」开的正门，认 Bearer 令牌而不认 Cookie，
 * 令牌用登录态自己换得到，因此对学员仍然是零操作——扫一次码，别的都不必管。
 */
const GATEWAY = 'https://i.weread.qq.com/api/agent/gateway';

/** 拿登录态换取数令牌的地方。它与网关不同源：换令牌在 weread.qq.com，取数在 i.weread.qq.com */
const API_KEY_PATH = '/api/skills/apikeyGet';

/** 网关要求随每次调用报一次技能版本 */
const SKILL_VERSION = '1.0.3';

/** 登录成功的判据：这两个 Cookie 同时在，就是登录态 */
const REQUIRED_COOKIES = ['wr_vid', 'wr_skey'];

/** 扫码窗口最多存活两分钟；超时就是一次正常取消，不让轮询永久悬挂 */
const LOGIN_TIMEOUT_MS = 120000;

/** 当前扫码窗口的取消句柄；全模块同时只允许存在一个登录会话 */
let activeLoginCancel: (() => void) | null = null;

// ============================================================
// 登录
// ============================================================

/** 已经连上微信读书了没有。判据是设置里存着 Cookie，真假由第一次取数去验 */
export function wereadAvailable(ctx: ZiminosContext): boolean {
    return Platform.isDesktopApp && !!ctx.settings.wereadCookie.trim();
}

/**
 * 开一个窗口让学员扫码登录，成功后把 Cookie 收进设置。
 *
 * 用真正的浏览器窗口而不是自己实现扫码：微信的登录协议会变，而那个窗口里跑的
 * 就是微信读书官方的登录页，它变它自己的，我们只负责在登录成功后取走 Cookie。
 * 插件全程不碰账号密码，也不接触二维码本身。
 *
 * 返回 true 表示拿到了登录态。窗口被关掉、或超时未登录都返回 false 而不抛错——
 * 「我又不想登了」是一个正当选择，不该以异常收场。
 */
export async function loginWeread(ctx: ZiminosContext): Promise<boolean> {
    const BrowserWindow = resolveBrowserWindow();

    if (!BrowserWindow) return false;

    // 重复点击连接时先收掉上一扇窗口，避免两个轮询争着覆盖同一份 Cookie
    activeLoginCancel?.();

    return new Promise<boolean>((resolve) => {
        const win = new BrowserWindow({
            width: 480,
            height: 660,
            title: '登录微信读书（用微信扫码）',
            autoHideMenuBar: true,
            webPreferences: { nodeIntegration: false, contextIsolation: true },
        });

        let settled = false;
        let timer: number | null = null;
        let timeout: number | null = null;
        const cancel = (): void => finish(false);
        const finish = (ok: boolean): void => {
            if (settled) return;

            settled = true;
            if (timer !== null) window.clearInterval(timer);
            if (timeout !== null) window.clearTimeout(timeout);
            if (activeLoginCancel === cancel) activeLoginCancel = null;

            try {
                if (!win.isDestroyed()) win.close();
            } catch {
                // 窗口已经被用户关掉了，正是我们要的结果之一
            }

            resolve(ok);
        };

        activeLoginCancel = cancel;

        /**
         * 轮询会话里的 Cookie 而不是监听某个跳转地址：
         * 微信读书登录成功后的落地页改过不止一次，而「Cookie 里有没有 wr_skey」
         * 是这件事本身，不随页面结构变。这个轮询只活在登录窗口开着的那几十秒里，
         * 与「插件内无后台轮询」那条纪律说的不是一回事——它有明确的起止与用户在场。
         */
        timer = window.setInterval(() => {
            void (async () => {
                try {
                    if (win.isDestroyed()) {
                        finish(false);

                        return;
                    }

                    const cookies = await win.webContents.session.cookies.get({
                        domain: '.weread.qq.com',
                    });

                    // 等 Cookie 的间隙里窗口可能已被关闭或被新会话取代。
                    // 旧请求不再有权把凭据写回设置。
                    if (settled || activeLoginCancel !== cancel) return;

                    const names = cookies.map((cookie: { name: string }) => cookie.name);

                    if (!REQUIRED_COOKIES.every((name) => names.includes(name))) return;

                    const cookie = cookies
                        .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
                        .join('; ');

                    clearCachedKey();
                    ctx.settings.wereadCookie = cookie;
                    await ctx.saveSettings();
                    finish(true);
                } catch {
                    finish(false);
                }
            })();
        }, 1000);

        timeout = window.setTimeout(() => finish(false), LOGIN_TIMEOUT_MS);

        win.on('closed', () => finish(false));
        void win.loadURL(`${BASE}/#login`).catch(() => finish(false));
    });
}

/** 设置页断开：持久 Cookie 与内存令牌作为一个认证状态同时清掉 */
export async function disconnectWeread(ctx: ZiminosContext): Promise<void> {
    activeLoginCancel?.();
    clearCachedKey();
    ctx.settings.wereadCookie = '';
    await ctx.saveSettings();
}

/** 插件卸载时收掉扫码窗口与全部内存凭据 */
export function disposeWereadSession(): void {
    activeLoginCancel?.();
    clearCachedKey();
}

/**
 * 取 Electron 的 BrowserWindow。
 *
 * 它住在 Obsidian 自带的 `@electron/remote` 里（桌面版 app.asar 内实测存在）。
 * 全程 try/catch 且返回可空：移动端没有 require、Obsidian 日后换掉这个模块，
 * 都只该让「连接微信读书」这一条命令失灵，而不是让插件加载失败。
 */
function resolveBrowserWindow(): (new (options: unknown) => WereadWindow) | null {
    if (!Platform.isDesktopApp) return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const remote = require('@electron/remote') as { BrowserWindow?: unknown };

        return typeof remote?.BrowserWindow === 'function'
            ? (remote.BrowserWindow as new (options: unknown) => WereadWindow)
            : null;
    } catch {
        return null;
    }
}

/** 登录窗口用到的那几样能力，只声明我们真正碰的部分 */
interface WereadWindow {
    isDestroyed(): boolean;
    close(): void;
    loadURL(url: string): Promise<void>;
    on(event: string, listener: () => void): void;
    webContents: {
        session: {
            cookies: {
                get(filter: { domain: string }): Promise<{ name: string; value: string }[]>;
            };
        };
    };
}

// ============================================================
// 取数
// ============================================================

/**
 * 带着登录态请求一个接口，返回解析后的 JSON。
 *
 * 判成败**不能只看 HTTP 状态码**。微信读书失败时照样回 200，把错误写在正文里：
 *
 *     {"errCode":-2012,"errMsg":"登录超时","errLog":"CAPk0B6"}
 *
 * 只看状态码的话，这个响应会被当成一份「一条划线都没有」的正常结果，
 * 于是学员看到的是「没在设备里找到这本书的划线」——一句关于他的书的假话。
 * 这正是那条红线要求的反面：网络来源失手就如实说，绝不装作没有数据。
 * 真机实测抓到过这一幕（2026-08-14），代价是那本书看起来像是从没划过线。
 */
async function api(ctx: ZiminosContext, path: string): Promise<Record<string, unknown>> {
    const response = await requestUrl({
        url: `${BASE}${path}`,
        method: 'GET',
        headers: {
            Cookie: ctx.settings.wereadCookie,
            Referer: `${BASE}/`,
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        throw: false,
    });

    if (response.status === 401) throw new Error(EXPIRED);
    if (response.status >= 400) throw new Error(`微信读书接口返回 ${response.status}`);

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const errCode = Number(payload.errCode ?? 0);

    if (errCode) {
        // -2012 与 -2010 都是登录态失效，说人话；其余原样转出微读自己的措辞
        throw new Error(
            errCode === -2012 || errCode === -2010
                ? EXPIRED
                : `微信读书拒绝了这次请求：${text(payload.errMsg) || errCode}`,
        );
    }

    return payload;
}

const EXPIRED = '微信读书的登录已过期，重新运行「连接微信读书」。';

// ============================================================
// 取数网关：令牌换取与调用
// ============================================================

/**
 * 本次会话的取数令牌，只活在内存里。
 *
 * **刻意不落盘**：它随时可以拿登录态再换一个，存下来只会让 data.json 里多一份
 * 会过期、要维护、要在断开时记得一并清掉的凭据。全插件的持久凭据仍然只有 Cookie 一份，
 * 「断开」因此仍然只需要清那一个字段。插件重载即重新换取，代价是一次 GET。
 */
let cachedKey = '';
let cachedCookie = '';

/** 内存令牌与产生它的 Cookie 必须一起失效 */
function clearCachedKey(): void {
    cachedKey = '';
    cachedCookie = '';
}

/** 用登录态换一枚取数令牌。换不到返回空串——调用方据此降级，而不是抛错中断 */
async function apiKey(ctx: ZiminosContext): Promise<string> {
    const cookie = ctx.settings.wereadCookie.trim();

    if (cachedCookie !== cookie) {
        cachedKey = '';
        cachedCookie = cookie;
    }

    if (cachedKey) return cachedKey;

    try {
        const payload = await api(ctx, API_KEY_PATH);

        cachedKey = text(payload.apikey);
    } catch {
        cachedKey = '';
    }

    return cachedKey;
}

/**
 * 走网关调一个接口。
 *
 * 与 Cookie 那条路的判成败方式相同、错误字段不同：网关用 `errcode`/`errmsg`，
 * 老接口用 `errCode`/`errMsg`，两套都要认——认错一套就等于不认。
 */
async function gateway(
    ctx: ZiminosContext,
    apiName: string,
    key: string,
    params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const response = await requestUrl({
        url: GATEWAY,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_name: apiName, skill_version: SKILL_VERSION, ...params }),
        throw: false,
    });

    if (response.status === 401) {
        // 令牌失效：丢掉缓存，下次调用会拿登录态重换一枚
        clearCachedKey();
        throw new Error(EXPIRED);
    }

    if (response.status >= 400) throw new Error(`微信读书网关返回 ${response.status}`);

    const payload = (response.json ?? {}) as Record<string, unknown>;

    if (Number(payload.errcode ?? 0)) {
        throw new Error(`微信读书拒绝了这次请求：${text(payload.errmsg) || payload.errcode}`);
    }

    return payload;
}

/** 书架上全部有笔记的书 */
export async function listWereadBooks(ctx: ZiminosContext): Promise<readonly WereadBook[]> {
    const payload = await api(ctx, '/api/user/notebook');
    const books: WereadBook[] = [];

    for (const raw of asArray(payload.books)) {
        const entry = raw as Record<string, unknown>;
        const book = entry.book as Record<string, unknown> | undefined;

        if (!book) continue;

        const id = text(book.bookId);
        const title = text(book.title);

        if (id && title) {
            books.push({
                id,
                title,
                author: text(book.author),
            });
        }
    }

    return books;
}

/**
 * 一本书的全部划线与想法。
 *
 * 三个接口合成一条：划线给正文与 chapterUid，章节接口把 uid 翻译成章节名，
 * 想法接口给学员自己写的评论。想法按 chapterUid + 划线文本挂回对应的划线——
 * 微信读书的想法本来就是「对着某一段写的」，挂不回去就作为独立条目留下。
 */
export async function readWereadBookHighlights(
    ctx: ZiminosContext,
    book: WereadBook,
): Promise<WereadHighlights> {
    const key = await apiKey(ctx);

    // 换不到令牌就退到只取想法那条老路。它是真的降级而不是等价路线，
    // 因此必须留一句话交代——沉默地少交一半，与「这本书没划过线」在学员眼里一模一样
    if (!key) return await cookieOnly(ctx, book.id);

    const marks = await gateway(ctx, '/book/bookmarklist', key, { bookId: book.id });
    const chapterNames = chapterMapOf(marks);
    const highlights: ParsedHighlight[] = [];

    for (const raw of asArray(marks.updated)) {
        const mark = raw as Record<string, unknown>;
        const content = text(mark.markText);

        if (!content) continue;

        highlights.push({
            chapter: chapterNames.get(text(mark.chapterUid)) ?? '',
            text: content,
            thoughts: [],
        });
    }

    // 想法单独一趟：接口不同、失败也不该让划线跟着丢
    let note = '';

    try {
        const reviews = await gateway(ctx, '/review/list/mine', key, {
            bookid: book.id,
            synckey: 0,
        });

        mergeReviews(highlights, reviews, chapterNames);
    } catch (error) {
        // 想法拿不到就只交划线：少一半好过一条都没有。
        // 但若划线也一条没有，这次失败就是全部真相，必须抛出去——
        // 否则学员得到的是「这本书没有划线」，而事实是「微读没让我们看」
        if (!highlights.length) throw error;

        const message = error instanceof Error ? error.message : String(error);

        note = `微信读书想法取数失败：${message || '未知错误'}；本次只同步了划线。`;
    }

    return { highlights, note };
}

/**
 * 降级路线：只用登录态，只取得到带想法的那些。
 *
 * 走到这里意味着令牌换不到（微读改了换发方式、或这个账号没开通）。
 * 纯划线在这条路上取不回来——`/web/book/bookmarklist` 已是一具空壳，
 * 无论带不带 Cookie、书号真假一律回 200 + `{}`，连错误码都不给。
 * 因此这里**必须留下那句 note**：静默地少交一半，与「这本书没划过线」
 * 在学员眼里长得一模一样，而前者是我们的问题，后者不是。
 */
async function cookieOnly(ctx: ZiminosContext, bookId: string): Promise<WereadHighlights> {
    const highlights: ParsedHighlight[] = [];
    const reviews = await api(
        ctx,
        `/api/review/list?bookId=${encodeURIComponent(bookId)}&listType=11&mine=1&syncKey=0`,
    );

    mergeReviews(highlights, reviews, new Map());

    return {
        highlights,
        note:
            '没能拿到微信读书的取数授权，这次只取回了写过想法的那些；' +
            '纯划线取不到。重新运行一次「连接微信读书」通常就能恢复。',
    };
}

/**
 * 把想法并进划线清单。
 *
 * 想法**并**回被评论的那条而不是「谁先谁算数」——同一句话隔半年重读会有第二个想法，
 * 丢掉后来那条，学员第二次读的收获在这一步就没了。
 * 挂不回去（原文对不上、或那条划线本身没同步过来）就作为独立条目留下。
 */
function mergeReviews(
    highlights: ParsedHighlight[],
    payload: Record<string, unknown>,
    chapterNames: Map<string, string>,
): void {
    for (const raw of asArray(payload.reviews)) {
        const wrapper = raw as Record<string, unknown>;
        const review = (wrapper.review ?? wrapper) as Record<string, unknown>;
        const written = text(review.content);

        if (!written) continue;

        const quoted = text(review.abstract);
        const hostIndex = quoted
            ? highlights.findIndex(
                  (item) => item.text.replace(/\s+/g, '') === quoted.replace(/\s+/g, ''),
              )
            : -1;

        // thoughts 是只读数组（契约如此），因此重建那一条而不是原地追加
        if (hostIndex >= 0) {
            const host = highlights[hostIndex];

            highlights[hostIndex] = { ...host, thoughts: [...host.thoughts, written] };
        } else {
            highlights.push({
                // 想法自带 chapterName，优先用它：一本书可能一条纯划线都没有
                // （只有「划一段再写句话」的想法），那时章节表是空的，
                // 靠 chapterUid 去查只会查到空字符串，整章信息白白丢掉
                chapter: text(review.chapterName) || chapterNames.get(text(review.chapterUid)) || '',
                text: quoted,
                thoughts: [written],
            });
        }
    }
}


/** 划线接口自带的章节表：chapterUid → 章节名 */
function chapterMapOf(payload: Record<string, unknown>): Map<string, string> {
    const names = new Map<string, string>();

    for (const raw of asArray(payload.chapters)) {
        const chapter = raw as Record<string, unknown>;
        const uid = text(chapter.chapterUid);
        const title = text(chapter.title);

        if (uid && title) names.set(uid, title);
    }

    return names;
}

/** 接口返回的数组字段可能缺席，收敛成数组 */
function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

/** 把来路不明的 JSON 值收敛成字符串 */
function text(value: unknown): string {
    if (value === null || value === undefined) return '';

    return String(value).trim();
}
