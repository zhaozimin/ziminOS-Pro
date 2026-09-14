/**
 * [INPUT]: 依赖 Obsidian 的 Notice/TFile/TFolder/normalizePath，依赖 core/commands 的 INSPIRATION_COMMAND，
 *          依赖 core 的设置上下文、目录保障、时间变量与输入弹窗，
 *          依赖同目录 templates 的纯文本生成和插入规则
 * [OUTPUT]: 对外提供 registerInspirationCaptureCommand，经注册台登记「记录灵感」
 * [POS]: inspiration 模块的唯一副作用编排器：向人提问、解析目标路径、按需创建目录/笔记并原子写入；
 *        不持有第二份设置、不依赖 QuickAdd；Dataview 作为独立运行组件消费它生成的查询块，
 *        灵感集第一次出生时登记全局 SelfWriteGuard；往已有灵感集里插入的那一条是用户记的，不登记，updated 照记
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile, TFolder, normalizePath } from 'obsidian';
import { INSPIRATION_COMMAND } from '../../core/commands';
import { INSPIRATION_DEFAULTS, INSPIRATION_INSERT_POSITIONS } from '../../core/constants';
import type { InspirationInsertPosition } from '../../core/constants';
import { ensureFolderPath, normalizeFolderPath } from '../../core/folders';
import { TextInputModal } from '../../core/modals';
import { nowLocalDateTimeParts } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import {
    buildInitialInspirationContent,
    insertInspiration,
    normalizeInspiration,
    normalizeInspirationFormat,
    normalizeInspirationHeading,
    renderInspirationEntry,
} from './templates';

interface InspirationTarget {
    readonly folder: string;
    readonly path: string;
    readonly heading: string;
    readonly position: InspirationInsertPosition;
    readonly format: string;
}

/** 注册一个显式命令；是否绑定键盘快捷键由用户在 Obsidian 设置里决定 */
export function registerInspirationCaptureCommand(ctx: ZiminosContext): void {
    ctx.commands.register(INSPIRATION_COMMAND, () => {
        void captureInspiration(ctx);
    });
}

/** 完整捕获流程：提问 → 生成条目 → 原子写入；任何失败只以中文 Notice 呈现 */
async function captureInspiration(ctx: ZiminosContext): Promise<void> {
    try {
        const input = await new TextInputModal(ctx.app, {
            title: '请输入要记录的灵感',
            placeholder: '一句话记下来，稍后再整理',
        }).openAndGetValue();
        const inspiration = normalizeInspiration(input);

        if (!inspiration) {
            new Notice('未输入内容，操作已取消。');
            return;
        }

        const target = resolveInspirationTarget(ctx);
        const timeParts = nowLocalDateTimeParts(ctx.settings.dateTimeFormat);
        const entry = renderInspirationEntry(target.format, inspiration, timeParts);
        let targetEntry = ctx.app.vault.getAbstractFileByPath(target.path);

        if (targetEntry instanceof TFolder) {
            throw new Error(`目标路径是文件夹，无法写入：${target.path}`);
        }

        if (!targetEntry) {
            if (target.folder) await ensureFolderPath(ctx.app, target.folder);
            ctx.guard.mark(target.path);
            targetEntry = await ctx.app.vault.create(
                target.path,
                buildInitialInspirationContent(entry, target.heading, target.path),
            );
        } else {
            if (!(targetEntry instanceof TFile) || targetEntry.extension.toLowerCase() !== 'md') {
                throw new Error(`目标路径不是 Markdown 文件：${target.path}`);
            }

            await ctx.app.vault.process(targetEntry, (content) => {
                const updatedContent = insertInspiration(
                    content,
                    entry,
                    target.position,
                    target.heading,
                    target.path,
                );

                // 替人落笔，不登记自写：这一条是用户记的，灵感集的 updated 应当照记（见 core/guard）
                return updatedContent;
            });
        }

        new Notice(`已记录灵感：${inspiration}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(`记录灵感失败：${message}`);
    }
}

/** 设置页允许自由文本，使用前统一在这里校验与回落，磁盘永远只收到安全路径 */
function resolveInspirationTarget(ctx: ZiminosContext): InspirationTarget {
    const folder = normalizeFolderPath(ctx.settings.inspirationFolder, INSPIRATION_DEFAULTS.folder);
    const fileName = normalizeInspirationFileName(ctx.settings.inspirationFileName);
    const path = normalizePath(folder ? `${folder}/${fileName}` : fileName);

    if (folder.split('/').some((part) => part === '.' || part === '..')) {
        throw new Error('灵感文件夹不能包含 . 或 .. 路径段。');
    }

    return {
        folder,
        path,
        heading: normalizeInspirationHeading(ctx.settings.inspirationHeading),
        position: normalizeInsertPosition(ctx.settings.inspirationInsertPosition),
        format: normalizeInspirationFormat(ctx.settings.inspirationFormat),
    };
}

/** 文件夹与笔记名分开配置，文件名因此禁止携带路径；没写扩展名时友好补齐 .md */
function normalizeInspirationFileName(value: string | undefined): string {
    const candidate = typeof value === 'string' ? value.trim() : '';
    const fileName = candidate || INSPIRATION_DEFAULTS.fileName;

    if (fileName === '.' || fileName === '..' || /[\\/:*?"<>|]/.test(fileName)) {
        throw new Error('灵感笔记名称不能包含路径或系统保留字符。');
    }

    return fileName.toLowerCase().endsWith('.md') ? fileName : `${fileName}.md`;
}

/** 老版本或手改 data.json 产生未知值时回落默认，而不是让 switch 静默不写 */
function normalizeInsertPosition(value: string | undefined): InspirationInsertPosition {
    const candidate = value as InspirationInsertPosition;

    return INSPIRATION_INSERT_POSITIONS.includes(candidate)
        ? candidate
        : INSPIRATION_DEFAULTS.insertPosition;
}
