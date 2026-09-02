/**
 * [INPUT]: 依赖 obsidian 的 Platform（判断桌面端）；桌面守卫通过后才按需 require Node 的
 *          child_process/os/fs/path，确保移动端加载插件时不解析桌面运行时依赖
 * [OUTPUT]: 对外提供 appleBooksAvailable、listAppleBooks、readAppleBookHighlights 与 AppleBook 契约
 * [POS]: 划线来源之一：苹果图书。它是三个来源里最确定的一个——数据就在本机两个 SQLite 里，
 *        零网络、零登录、同输入同结果，「脚本驱动」这条红线在这一支上原样成立；
 *        多个历史 SQLite 共存时先按修改时间排序、再验目标表，只读取最新的兼容主库
 *        取数方式是 `spawn('sqlite3', [库, SQL, '-json'])`：macOS 自带 sqlite3（实测 3.51.0），
 *        因此不必打包任何 sqlite 库，也不必碰原生模块——Obsidian 插件带原生模块是个死结。
 *        它比「让学员在图书里复制粘贴」多给两样东西：**章节名**（ZFUTUREPROOFING5）
 *        与**批注**（ZANNOTATIONNOTE）——那两样在复制出来的文本里根本不存在，
 *        这正是「一步到位」比「三步手工」不只是省事、而是拿到更多东西的地方
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform } from 'obsidian';
import type { ParsedHighlight } from './parsers';

// ============================================================
// 契约
// ============================================================

/** 图书库里的一本书 */
export interface AppleBook {
    /** ZASSETID，划线表靠它认书 */
    readonly id: string;
    readonly title: string;
    readonly author: string;
}

// ============================================================
// 库文件定位
// ============================================================

/**
 * 两个库的目录。文件名带版本后缀（`BKLibrary-1-091020131601.sqlite`、
 * `AEAnnotation_v10312011_1727_local.sqlite`），且随 macOS 版本变过——
 * 因此只认目录、扫里面的 .sqlite，不把那串数字写死。
 */
const LIBRARY_DIR = 'Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary';
const ANNOTATION_DIR = 'Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation';

/** 苹果图书来源用到的最小 Node 能力；只在桌面端求值，移动端连 require 都不会执行 */
interface AppleNodeTools {
    readonly spawn: typeof import('child_process').spawn;
    readonly homedir: typeof import('os').homedir;
    readonly existsSync: typeof import('fs').existsSync;
    readonly readdirSync: typeof import('fs').readdirSync;
    readonly statSync: typeof import('fs').statSync;
    readonly join: typeof import('path').join;
}

let cachedNodeTools: AppleNodeTools | null | undefined;

/** 桌面端按需取得 Node 能力；探不到即让整个来源降级为不可用 */
function nodeTools(): AppleNodeTools | null {
    if (!Platform.isDesktopApp) return null;
    if (cachedNodeTools !== undefined) return cachedNodeTools;

    try {
        const childProcess = require('child_process') as typeof import('child_process');
        const os = require('os') as typeof import('os');
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');

        cachedNodeTools = {
            spawn: childProcess.spawn,
            homedir: os.homedir,
            existsSync: fs.existsSync,
            readdirSync: fs.readdirSync,
            statSync: fs.statSync,
            join: path.join,
        };
    } catch {
        cachedNodeTools = null;
    }

    return cachedNodeTools;
}

/**
 * 目录里的 SQLite 主库，按修改时间从新到旧排列。
 * readdirSync 的顺序没有业务含义，历史版本库共存时拿 found[0] 会随机读到旧快照。
 */
function sqliteCandidatesIn(relative: string): string[] {
    const tools = nodeTools();

    if (!tools) return [];

    const dir = tools.join(tools.homedir(), relative);

    if (!tools.existsSync(dir)) return [];

    // 排除 -wal / -shm 这些同名旁支，只要主库文件
    const found = tools.readdirSync(dir)
        .filter((name) => name.endsWith('.sqlite'))
        .map((name) => {
            const path = tools.join(dir, name);

            return { path, modified: tools.statSync(path).mtimeMs };
        })
        .sort((left, right) => right.modified - left.modified);

    return found.map(({ path }) => path);
}

/**
 * 这台机器上能不能读苹果图书。
 * 三个条件缺一不可：桌面端（移动端没有 Node）、macOS（只有它有图书的库）、两个库文件都在。
 */
export function appleBooksAvailable(): boolean {
    if (!Platform.isDesktopApp || process.platform !== 'darwin') return false;

    return sqliteCandidatesIn(LIBRARY_DIR).length > 0 && sqliteCandidatesIn(ANNOTATION_DIR).length > 0;
}

// ============================================================
// 取数
// ============================================================

/**
 * 跑一句只读 SQL，拿回 JSON。
 *
 * 走 macOS 自带的 sqlite3 命令行而不是打包一个 sqlite 库：Obsidian 插件带原生模块
 * 要为每个平台各编一份，而 wasm 版又要多塞几百 KB 进 main.js——
 * 而这件事只在 macOS 上发生，那台机器上一定有 /usr/bin/sqlite3。
 *
 * **打开方式试两次，顺序不能反**，这是 2026-08-14 真机实测改出来的：
 *
 * 先 `mode=ro`（只读，但认 -wal）。苹果图书是 WAL 模式，而且**把大量新数据留在 -wal 里
 * 迟迟不回写主库**——实测那台机器上主库里 0 本书、0 条标注，-wal 里 1 本书、4 条标注。
 * 此前这里写的是 `immutable=1`，那个参数会让 sqlite **完全忽略 -wal**，
 * 于是插件读到一份陈旧快照，如实汇报「这台机器上没有苹果图书的划线」——
 * 一句听上去像事实的假话，而学员手里正开着那本划得满满的书。
 * 「不去碰别人正开着的库」这个初衷是对的，只是选错了参数：`mode=ro` 同样一个字节都不写。
 *
 * 再退回 `immutable=1`。只读连接读 WAL 需要 -shm 那个共享内存文件；
 * 库已经彻底 checkpoint 过、-shm 不在时，`mode=ro` 会开不了，那时用不着管 -wal，
 * 陈旧快照与真相恰好是同一份。两条路合起来才覆盖全部状态。
 */
async function query(dbPath: string, sql: string): Promise<Record<string, unknown>[]> {
    try {
        return await runSqlite(dbPath, sql, 'mode=ro');
    } catch {
        // -shm 不在导致开不了：那意味着没有待回写的 -wal，陈旧快照就是全部事实
        return await runSqlite(dbPath, sql, 'immutable=1');
    }
}

/** 按给定的打开参数跑一次 sqlite3 */
async function runSqlite(
    dbPath: string,
    sql: string,
    openMode: string,
): Promise<Record<string, unknown>[]> {
    const tools = nodeTools();

    if (!tools) throw new Error('当前平台不能读取苹果图书数据库');

    return new Promise((resolve, reject) => {
        const child = tools.spawn('sqlite3', [`file:${dbPath}?${openMode}`, sql, '-json'], {
            timeout: 20000,
        });

        let out = '';
        let err = '';

        child.stdout.on('data', (chunk) => {
            out += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            err += String(chunk);
        });
        child.on('error', (error) => reject(error));
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(err.trim() || `sqlite3 退出码 ${code}`));

                return;
            }

            // 空结果时 sqlite3 什么都不打印，那不是错误，是「这本书没有划线」
            if (!out.trim()) {
                resolve([]);

                return;
            }

            try {
                resolve(JSON.parse(out) as Record<string, unknown>[]);
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    });
}

/** 把 SQL 字面量里的单引号转义，防止书名里的 `'` 截断语句 */
function quote(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

/**
 * 从新到旧寻找真正兼容当前查询的数据库。
 * 文件名和修改时间只能排序，目标表才是兼容性的事实；坏库被跳过，但全部打不开时保留最后异常。
 */
async function compatibleSqliteIn(relative: string, requiredTable: string): Promise<string | null> {
    let lastError: unknown = null;

    for (const candidate of sqliteCandidatesIn(relative)) {
        try {
            const table = await query(
                candidate,
                `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quote(requiredTable)} LIMIT 1`,
            );

            if (table.length) return candidate;
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) throw lastError;

    return null;
}

/**
 * 图书库里全部有划线的书。
 *
 * 只列有划线的：图书库里躺着一堆买了没读的书，全列出来会让选书弹窗变成一份购物记录。
 * 两个库分属两个文件、sqlite3 一次只连一个，所以先取有划线的 assetId 集合，再回图书库要书名。
 */
export async function listAppleBooks(): Promise<readonly AppleBook[]> {
    const [libraryDb, annotationDb] = await Promise.all([
        compatibleSqliteIn(LIBRARY_DIR, 'ZBKLIBRARYASSET'),
        compatibleSqliteIn(ANNOTATION_DIR, 'ZAEANNOTATION'),
    ]);

    if (!libraryDb || !annotationDb) return [];

    const withHighlights = await query(
        annotationDb,
        `SELECT DISTINCT ZANNOTATIONASSETID AS id FROM ZAEANNOTATION
         WHERE ZANNOTATIONSELECTEDTEXT IS NOT NULL AND ZANNOTATIONDELETED = 0`,
    );
    const ids = withHighlights
        .map((row) => String(row.id ?? '').trim())
        .filter(Boolean);

    if (!ids.length) return [];

    const books = await query(
        libraryDb,
        `SELECT ZASSETID AS id, ZTITLE AS title, ZAUTHOR AS author FROM ZBKLIBRARYASSET
         WHERE ZASSETID IN (${ids.map(quote).join(',')})`,
    );

    return books
        .map((row) => ({
            id: String(row.id ?? '').trim(),
            title: String(row.title ?? '').trim(),
            author: String(row.author ?? '').trim(),
        }))
        .filter((book) => book.id && book.title);
}

/**
 * 一本书的全部划线，按划线时刻排。
 *
 * 不按书里的物理位置排，是因为那一列（epubcfi 字符串）字典序不等于阅读序；
 * 而划线时刻对线性阅读的人就是阅读序，且这一列一定存在。
 *
 * 四个字段各有出处：选中的原文是划线本身，ZANNOTATIONNOTE 是学员自己敲的批注（＝想法），
 * ZFUTUREPROOFING5 是章节名——最后这个是复制粘贴那条路完全拿不到的东西。
 * 删掉的划线（ZANNOTATIONDELETED）不要：苹果只是打个标记不真删，
 * 照收会把学员明确删掉的句子又搬回来。
 */
export async function readAppleBookHighlights(assetId: string): Promise<readonly ParsedHighlight[]> {
    const annotationDb = await compatibleSqliteIn(ANNOTATION_DIR, 'ZAEANNOTATION');

    if (!annotationDb) return [];

    const rows = await query(
        annotationDb,
        `SELECT ZANNOTATIONSELECTEDTEXT AS text, ZANNOTATIONNOTE AS note,
                ZFUTUREPROOFING5 AS chapter, ZANNOTATIONLOCATION AS location
         FROM ZAEANNOTATION
         WHERE ZANNOTATIONASSETID = ${quote(assetId)}
           AND ZANNOTATIONSELECTEDTEXT IS NOT NULL
           AND ZANNOTATIONDELETED = 0
         ORDER BY ZANNOTATIONCREATIONDATE`,
    );

    return rows
        .map((row) => {
            const note = String(row.note ?? '').trim();

            return {
                chapter: String(row.chapter ?? '').trim(),
                text: String(row.text ?? '').trim(),
                thoughts: note ? [note] : [],
            };
        })
        .filter((highlight) => highlight.text);
}
