/**
 * [INPUT]: 依赖 obsidian 的 TFolder、normalizePath 与 App 类型，依赖 ./constants 的 FOLDERS
 * [OUTPUT]: 对外提供 ensureFolderPath（逐级建目录）、normalizeFolderPath（规范化设置里的目录路径）、
 *           isInFolder（路径归属判定）与 isSystemPath（功能目录判定，一切检索的统一排除口）
 * [POS]: core 的目录安全层，是所有会创建目录的模块（开荒、建项目、项目搬移）的共同入口。
 *        它的存在只为守住一条底线：绝不覆盖用户已有的同名文件——遇到就抛错中止，
 *        由调用方转成 Notice 呈现；并发创建只在现场已是目录时复用，不吞掉真正的 I/O 错误
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFolder, normalizePath } from 'obsidian';
import type { App } from 'obsidian';
import { FOLDERS } from './constants';

/**
 * 路径是否在功能目录（90-system）内。
 * 功能目录里住的是导航、模板与属性示例——它们是系统的零件，没有知识属性，
 * 因此不参与任何检索：不进反向链接表、不进 type 名录、不进任何一张视图。
 * 判定收口在此一处，二十四个视图与两处直扫共用，不散写二十几遍前缀比较。
 */
export function isSystemPath(path: string): boolean {
    return path === FOLDERS.system || path.startsWith(`${FOLDERS.system}/`);
}

/**
 * 逐级创建路径中缺失的每一层目录。
 * 若某一层已经是同名文件（而非目录），立即抛错终止，避免破坏用户内容。
 * 已存在的目录直接跳过，因此本函数天然幂等，可重复调用。
 */
export async function ensureFolderPath(app: App, folderPath: string): Promise<void> {
    const normalizedFolderPath = normalizePath(folderPath);
    const pathParts = normalizedFolderPath.split('/').filter(Boolean);

    let currentPath = '';

    for (const pathPart of pathParts) {
        currentPath = currentPath ? `${currentPath}/${pathPart}` : pathPart;

        const existingEntry = app.vault.getAbstractFileByPath(currentPath);

        if (!existingEntry) {
            try {
                await app.vault.createFolder(currentPath);
            } catch (error) {
                // 另一条命令可能在 await 期间建好了同一层；只有目录事实能证明本步已经完成。
                if (!(app.vault.getAbstractFileByPath(currentPath) instanceof TFolder)) throw error;
            }
            continue;
        }

        if (!(existingEntry instanceof TFolder)) {
            throw new Error(`无法创建文件夹，因为同一路径下已经存在文件：${currentPath}`);
        }
    }
}

/**
 * 规范化用户在设置页填写的目录路径：
 * 空值回落到默认值，反斜杠统一成正斜杠，去掉首尾多余的斜杠，最后交给 Obsidian 规范化。
 * 设置项是自由文本，任何读取目录设置的地方都必须先过这一道，否则路径拼接会失准。
 */
export function normalizeFolderPath(value: string | undefined, fallback: string): string {
    const candidate = typeof value === 'string' ? value.trim() : '';
    const path = (candidate || fallback).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    return normalizePath(path);
}

/**
 * 判断某个路径是否落在指定目录（含其全部子目录）内。
 *
 * 必须带上分隔符再比前缀：裸 startsWith 会让 `04-archives-old/` 被当成 `04-archives/` 的内部，
 * 而归档判定是「这个人还算不算数」的开关，误判一次整组人会从名录里消失。
 */
export function isInFolder(path: string, folder: string): boolean {
    const base = folder.replace(/\/+$/, '');

    if (!base) return true;

    return path === base || path.startsWith(`${base}/`);
}
