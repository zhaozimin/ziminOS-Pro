/**
 * [INPUT]: 依赖 obsidian 的 Platform；桌面守卫通过后才按需 require Node 的 fs/os/path；
 *          依赖同目录 parsers 的 parseHighlightExport（My Clippings 的解析规则只存在一份）
 * [OUTPUT]: 对外提供 kindleClippingsPath（自动找到那个文件）、kindleAvailable、
 *           listKindleBooks、readKindleBookHighlights
 * [POS]: 划线来源之一：Kindle。它与苹果图书同属「本机数据」那一类——
 *        My Clippings.txt 就在插着的设备里，读它不需要网络也不需要 Amazon 登录。
 *        本文件只做一件 parsers 不做的事：**把那个文件找出来**。
 *        学员的认知里没有「My Clippings.txt 在哪」这一条，让他去找等于把一步变成三步；
 *        而它的位置其实是确定的——Kindle 插上电脑就是一个卷宗，
 *        `documents/My Clippings.txt` 是固定路径，扫一遍挂载点即可。
 *        解析仍然交给 parsers：同一份格式规则不该有第二份实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform } from 'obsidian';
import { parseHighlightExport } from './parsers';
import type { ParsedBook, ParsedHighlight } from './parsers';

/** Kindle 来源用到的最小 Node 能力；只在桌面端求值 */
interface KindleNodeTools {
    readonly existsSync: typeof import('fs').existsSync;
    readonly readFileSync: typeof import('fs').readFileSync;
    readonly readdirSync: typeof import('fs').readdirSync;
    readonly statSync: typeof import('fs').statSync;
    readonly homedir: typeof import('os').homedir;
    readonly join: typeof import('path').join;
}

let cachedNodeTools: KindleNodeTools | null | undefined;

/** 桌面端按需取得 Node 能力；移动端加载插件时不会执行任何 Node require */
function nodeTools(): KindleNodeTools | null {
    if (!Platform.isDesktopApp) return null;
    if (cachedNodeTools !== undefined) return cachedNodeTools;

    try {
        const fs = require('fs') as typeof import('fs');
        const os = require('os') as typeof import('os');
        const path = require('path') as typeof import('path');

        cachedNodeTools = {
            existsSync: fs.existsSync,
            readFileSync: fs.readFileSync,
            readdirSync: fs.readdirSync,
            statSync: fs.statSync,
            homedir: os.homedir,
            join: path.join,
        };
    } catch {
        cachedNodeTools = null;
    }

    return cachedNodeTools;
}

/**
 * 找到 My Clippings.txt。
 *
 * 三处依次找，顺序即「有多大把握是学员这次要的那一份」：
 * 插着的 Kindle（最新、最全）→ 下载目录里的副本（他自己拷出来过）→ 桌面。
 * 找不到返回 null，由调用方讲清「没插设备也没找到副本」，而不是弹一个文件选择框——
 * 选择框正是我们要消灭的那一步。
 */
export function kindleClippingsPath(): string | null {
    const tools = nodeTools();

    if (!tools) return null;

    for (const candidate of candidatePaths(tools)) {
        try {
            if (tools.existsSync(candidate) && tools.statSync(candidate).isFile()) return candidate;
        } catch {
            // 卷宗刚被拔掉、或没有读权限：换下一个候选，不打断整条流程
        }
    }

    return null;
}

/** 全部候选路径，按把握从大到小 */
function candidatePaths(tools: KindleNodeTools): string[] {
    const paths: string[] = [];
    const home = tools.homedir();
    const deviceRelative = tools.join('documents', 'My Clippings.txt');

    // macOS 把外接设备挂在 /Volumes 下；Linux 常见 /media/<user> 与 /run/media/<user>
    for (const mountRoot of ['/Volumes', `/media/${process.env.USER ?? ''}`, `/run/media/${process.env.USER ?? ''}`]) {
        try {
            if (!tools.existsSync(mountRoot)) continue;

            for (const volume of tools.readdirSync(mountRoot)) {
                paths.push(tools.join(mountRoot, volume, deviceRelative));
            }
        } catch {
            // 挂载点不可读就跳过，这一步是探测不是断言
        }
    }

    // Windows：盘符逐个试，Kindle 通常是可移动卷
    if (process.platform === 'win32') {
        for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
            paths.push(`${letter}:\\${deviceRelative}`);
        }
    }

    paths.push(tools.join(home, 'Downloads', 'My Clippings.txt'));
    paths.push(tools.join(home, 'Desktop', 'My Clippings.txt'));

    return paths;
}

/** 这台机器此刻能不能读到 Kindle 划线 */
export function kindleAvailable(): boolean {
    return kindleClippingsPath() !== null;
}

/** 读出整份 My Clippings 并按书分组。文件不在返回空清单，读失败则交给汇流层如实说明 */
export function listKindleBooks(): readonly ParsedBook[] {
    const path = kindleClippingsPath();
    const tools = nodeTools();

    if (!path || !tools) return [];

    return parseHighlightExport(tools.readFileSync(path, 'utf8'))?.books ?? [];
}

/** 取某一本书的划线；书名逐字对不上时返回空 */
export function readKindleBookHighlights(title: string): readonly ParsedHighlight[] {
    return listKindleBooks().find((book) => book.title === title)?.highlights ?? [];
}
