/**
 * [INPUT]: 依赖 obsidian 公开 editor-paste/editor-drop 事件与 Notice，依赖 main 注入的容器/日记路由解析器，依赖本模块 platform 的桌面闸门、EagleBridgeClient 导入与 protocol 图片识别/链接生成
 * [OUTPUT]: 对外提供 EagleRouteResolver/registerEagleTransfers，可将纯图片事件放行给图床，其他附件按宿主笔记路由到 Eagle 的项目容器或日记文件夹并以稳定链接替换占位符
 * [POS]: Eagle 模块的写入边界。图片排除判定先于 preventDefault；事件一经接管就 fail closed，导入失败只撤掉占位并报错，
 *        绝不回退到 Obsidian 本地附件。Electron/Node 仅在桌面守卫通过后按需取得，移动端加载不解析它们
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { Editor, MarkdownFileInfo, MarkdownView } from 'obsidian';
import type { ZiminosContext } from '../../core/types';
import type { EagleBridgeClient } from './client';
import type { EagleImportRoute } from './client';
import { isSupportedEagleDesktop } from './platform';
import { buildEagleMarkdown, EAGLE_LIBRARY_KEY, isImageAttachment } from './protocol';

interface MaterializedFile {
    readonly path: string;
    readonly cleanup: () => Promise<void>;
}

interface NodeTools {
    readonly fs: typeof import('fs').promises;
    readonly join: typeof import('path').join;
    readonly tmpdir: typeof import('os').tmpdir;
}

let cachedNodeTools: NodeTools | null | undefined;

/** 容器/日记业务规则留在上游模块；Eagle 只消费 main 注入的最小结果。 */
export type EagleRouteResolver = (notePath: string) => EagleImportRoute | null;

export function registerEagleTransfers(
    ctx: ZiminosContext,
    client: EagleBridgeClient,
    resolveRoute: EagleRouteResolver,
): void {
    if (!isSupportedEagleDesktop()) return;

    ctx.plugin.registerEvent(
        ctx.app.workspace.on('editor-paste', (event, editor, info) => {
            void takeTransfer(ctx, client, resolveRoute, event, editor, info).catch((error) => {
                new Notice(`Eagle 附件处理失败：${errorMessage(error)}。未在 Obsidian 本地保留副本。`, 10000);
            });
        }),
    );
    ctx.plugin.registerEvent(
        ctx.app.workspace.on('editor-drop', (event, editor, info) => {
            void takeTransfer(ctx, client, resolveRoute, event, editor, info).catch((error) => {
                new Notice(`Eagle 附件处理失败：${errorMessage(error)}。未在 Obsidian 本地保留副本。`, 10000);
            });
        }),
    );
}

async function takeTransfer(
    ctx: ZiminosContext,
    client: EagleBridgeClient,
    resolveRoute: EagleRouteResolver,
    event: ClipboardEvent | DragEvent,
    editor: Editor,
    info: MarkdownView | MarkdownFileInfo,
): Promise<void> {
    if (!ctx.settings.eagleEnabled || event.defaultPrevented) return;

    const data = 'clipboardData' in event ? event.clipboardData : event.dataTransfer;
    const incomingFiles = Array.from(data?.files ?? []);

    if (incomingFiles.length === 0) return;

    const files = ctx.settings.eagleExcludeImages
        ? incomingFiles.filter((file) => !isImageAttachment(file.name, file.type))
        : incomingFiles;
    const excludedImageCount = incomingFiles.length - files.length;

    // 纯图片事件不得 preventDefault：后续图床插件与 Obsidian 必须还能看见它
    if (files.length === 0) return;

    // 已选中的非图片附件必须在第一个 await 前接管，否则 Obsidian 会先落一份本地副本
    event.preventDefault();

    const marker = `<!-- ziminos:eagle-upload:${uniqueId()} -->`;

    editor.replaceSelection(marker);

    const links: string[] = [];
    const failures: string[] = [];
    const folderPaths = new Set<string>();
    const route = info.file ? resolveRoute(info.file.path) : null;

    for (const file of files) {
        let materialized: MaterializedFile | null = null;
        const name = attachmentName(file);

        try {
            materialized = await materialize(file, name);

            const item = await client.importFile(materialized.path, name, route);

            if (item.folderPath) folderPaths.add(item.folderPath);

            links.push(buildEagleMarkdown(
                { libraryKey: EAGLE_LIBRARY_KEY, itemId: item.itemId },
                item.name,
                file.type,
            ));
        } catch (error) {
            failures.push(`${name}：${errorMessage(error)}`);
        } finally {
            await materialized?.cleanup().catch(() => undefined);
        }
    }

    const replacement = links.join('\n');
    const replaced = replaceMarker(editor, marker, replacement);

    if (!replaced && replacement) {
        const copied = await copyToClipboard(replacement);

        new Notice(copied
            ? '附件已存入 Eagle，但上传期间编辑器内容变了；链接已复制，请在目标位置粘贴。'
            : '附件已存入 Eagle，但上传期间编辑器内容变了，且自动复制链接失败；请从 Eagle 重新取得引用。', 10000);
    }

    if (failures.length > 0) {
        const suffix = links.length > 0 ? `；其余 ${links.length} 个已存入 Eagle` : '';

        new Notice(`Eagle 导入失败：${failures.join('；')}${suffix}。未在 Obsidian 本地保留副本。`, 10000);
    } else if (links.length > 0 && replaced) {
        const destination = folderPaths.size === 1 ? ` → ${Array.from(folderPaths)[0]}` : '';

        new Notice(`已存入 Eagle：${links.length} 个附件${destination}`);
    }

    if (excludedImageCount > 0) {
        new Notice(
            `已跳过 ${excludedImageCount} 张图片。图片与其他附件混在同一次操作时，` +
            '请将图片单独粘贴或拖入，再交给图床插件处理。',
            10000,
        );
    }
}

/** 尽量直接交原路径；截图等只有内存字节的 File 才落到系统临时目录 */
async function materialize(file: File, name: string): Promise<MaterializedFile> {
    const sourcePath = pathForFile(file);

    if (sourcePath) return { path: sourcePath, cleanup: async () => undefined };

    const tools = nodeTools();

    if (!tools) throw new Error('当前桌面运行时无法读取临时文件');

    const dir = await tools.fs.mkdtemp(tools.join(tools.tmpdir(), 'ziminos-eagle-'));
    const path = tools.join(dir, safeTempName(name));

    try {
        await tools.fs.writeFile(path, new Uint8Array(await file.arrayBuffer()));
    } catch (error) {
        await tools.fs.rmdir(dir).catch(() => undefined);
        throw error;
    }

    return {
        path,
        cleanup: async () => {
            await tools.fs.unlink(path).catch(() => undefined);
            await tools.fs.rmdir(dir).catch(() => undefined);
        },
    };
}

/** Electron 33+ 不再允许 file.path，官方替代入口是 webUtils.getPathForFile */
function pathForFile(file: File): string {
    if (!isSupportedEagleDesktop()) return '';

    try {
        const electron = require('electron') as {
            webUtils?: { getPathForFile?: (candidate: File) => string };
        };

        return electron.webUtils?.getPathForFile?.(file)?.trim() ?? '';
    } catch {
        return '';
    }
}

function nodeTools(): NodeTools | null {
    if (!isSupportedEagleDesktop()) return null;
    if (cachedNodeTools !== undefined) return cachedNodeTools;

    try {
        cachedNodeTools = {
            fs: (require('fs') as typeof import('fs')).promises,
            join: (require('path') as typeof import('path')).join,
            tmpdir: (require('os') as typeof import('os')).tmpdir,
        };
    } catch {
        cachedNodeTools = null;
    }

    return cachedNodeTools;
}

function replaceMarker(editor: Editor, marker: string, replacement: string): boolean {
    try {
        const content = editor.getValue();
        const start = content.indexOf(marker);

        if (start < 0) return false;

        editor.replaceRange(
            replacement,
            editor.offsetToPos(start),
            editor.offsetToPos(start + marker.length),
        );

        return true;
    } catch {
        // 上传期间页签被关闭时 editor 可能已经失效；调用方会把链接转交剪贴板
        return false;
    }
}

function safeTempName(name: string): string {
    const safe = name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/[. ]+$/g, '').slice(-180);

    if (!safe) return 'attachment.bin';

    // Windows 即使带扩展名也保留这些 DOS 设备名；统一加前缀，macOS 上同样无害。
    return /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe) ? `_${safe}` : safe;
}

/** 剪贴板截图偶尔没有文件名；补上由 MIME 决定的扩展名，Eagle 才能正确识别格式 */
function attachmentName(file: File): string {
    const supplied = file.name.trim();

    if (supplied) return supplied;

    const extensions: Record<string, string> = {
        'image/avif': 'avif',
        'image/bmp': 'bmp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/svg+xml': 'svg',
        'image/tiff': 'tiff',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
    };

    return `附件.${extensions[file.type.toLowerCase()] ?? 'bin'}`;
}

function uniqueId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function copyToClipboard(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        return false;
    }
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
