/**
 * [INPUT]: 依赖 obsidian 的 App/Platform/TFile 与公开的 vault 读写，依赖 core/constants 的 FOLDERS、
 *          core/folders 的 ensureFolderPath、./logo 的扩展名白名单；桌面端按需 require Electron 与 node:fs
 * [OUTPUT]: 对外提供 LOGO_HOME、canImportLogo 与 importLogoFromDisk
 * [POS]: 导出模块的「把电脑上的一张图搬进笔记库」那一步。它与 logo.ts 刻意分成两个文件，
 *        判据与 appearance 模块把 snippets 与 reveal 分开时完全相同——**变更理由不同**：
 *        那边随 Obsidian 的读盘与画布走，这边随 Electron 走，而后者是红线上的一处缺口。
 *        搬进库而不是记一条本机绝对路径，是因为绝对路径换台电脑就断，而且会把一条
 *        只在这台电脑上成立的绝对路径 写进可同步的 data.json；进库之后它随笔记库走，手机上也认得。
 *        落点固定在 90-system 下：那棵树本来就是「系统的零件而非知识」，
 *        isSystemPath 已经把它挡在全部检索之外，标志放进去不会污染任何视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform, TFile } from 'obsidian';
import type { App } from 'obsidian';
import { FOLDERS } from '../../core/constants';
import { ensureFolderPath } from '../../core/folders';
import { LOGO_EXTENSIONS } from './logo';

/** 标志在库里的家。放 90-system 之下，于是它不进任何一个视图的检索范围 */
export const LOGO_HOME = `${FOLDERS.system}/导出标志`;

interface OpenDialogResult {
    readonly canceled: boolean;
    readonly filePaths?: readonly string[];
}

interface OpenDialog {
    showOpenDialog(options: {
        readonly title: string;
        readonly properties: readonly string[];
        readonly filters: readonly { readonly name: string; readonly extensions: readonly string[] }[];
    }): Promise<OpenDialogResult>;
}

/** 能不能开系统文件选择框。手机上恒为假——那边只能从库里选 */
export function canImportLogo(): boolean {
    return Platform.isDesktopApp && resolveOpenDialog() !== null;
}

/**
 * 让用户从电脑上挑一张图，复制进库并返回它的库内路径；取消返回 null。
 *
 * 同一张图重复挑不会在库里堆出一串副本：先按**字节**比对整个落点目录，
 * 一模一样就直接复用那一份。按字节而不是按文件名，因为用户第二次挑的很可能是
 * 同一张图的另一个名字（`logo.png` 与 `logo 副本.png`），而那两份没有任何区别。
 */
export async function importLogoFromDisk(app: App): Promise<string | null> {
    const dialog = resolveOpenDialog();

    if (!dialog) throw new Error('这台设备打不开系统文件选择框，请改用「从库里选」。');

    const result = await dialog.showOpenDialog({
        title: '选一张图片当品牌标志',
        properties: ['openFile'],
        filters: [{ name: '图片', extensions: LOGO_EXTENSIONS }],
    });

    if (result.canceled || !result.filePaths?.length) return null;

    const source = result.filePaths[0];
    const name = baseNameOf(source);
    const extension = extensionOf(name);

    if (!LOGO_EXTENSIONS.includes(extension)) {
        throw new Error(`不认识的图片格式：.${extension || '（没有扩展名）'}`);
    }

    const fs = require('node:fs/promises') as { readFile(path: string): Promise<Uint8Array> };
    const bytes = await fs.readFile(source);

    await ensureFolderPath(app, LOGO_HOME);

    const existing = await findIdentical(app, bytes);

    if (existing) return existing;

    const path = freePath(app, name);

    await app.vault.createBinary(path, bytes.slice().buffer as ArrayBuffer);

    return path;
}

async function findIdentical(app: App, bytes: Uint8Array): Promise<string | null> {
    const candidates = app.vault.getFiles()
        .filter((file) => file.parent?.path === LOGO_HOME && LOGO_EXTENSIONS.includes(file.extension.toLowerCase()));

    for (const file of candidates) {
        // 先比长度：不同就没必要把整份读进来
        if (file.stat.size !== bytes.byteLength) continue;

        const stored = new Uint8Array(await app.vault.readBinary(file));

        if (sameBytes(stored, bytes)) return file.path;
    }

    return null;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length) return false;

    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
    }

    return true;
}

/** 同名已被占用时加数字后缀；绝不覆盖——那可能是用户上一枚还在用的标志 */
function freePath(app: App, name: string): string {
    const extension = extensionOf(name);
    const stem = extension ? name.slice(0, -(extension.length + 1)) : name;
    const safeStem = stem.replace(/[\\/:*?"<>|]/g, '－').trim() || '标志';
    let candidate = `${LOGO_HOME}/${safeStem}.${extension}`;
    let serial = 1;

    while (app.vault.getAbstractFileByPath(candidate) instanceof TFile) {
        candidate = `${LOGO_HOME}/${safeStem}-${serial}.${extension}`;
        serial += 1;
    }

    return candidate;
}

function baseNameOf(path: string): string {
    const parts = path.split(/[\\/]/);

    return parts[parts.length - 1] || '标志.png';
}

function extensionOf(name: string): string {
    const dot = name.lastIndexOf('.');

    return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Electron 只负责系统打开框；探不到时调用方还有「从库里选」这条完整的退路 */
function resolveOpenDialog(): OpenDialog | null {
    if (!Platform.isDesktopApp) return null;

    try {
        const electron = require('electron') as { remote?: { dialog?: OpenDialog } };

        if (electron.remote?.dialog) return electron.remote.dialog;
    } catch {
        // 某些 Obsidian 版本只暴露 @electron/remote，继续试下一条
    }

    try {
        const remote = require('@electron/remote') as { dialog?: OpenDialog };

        return remote.dialog ?? null;
    } catch {
        return null;
    }
}
