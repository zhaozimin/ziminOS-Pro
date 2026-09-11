/**
 * [INPUT]: 依赖 obsidian 的 Notice/Platform/TFile；依赖 dom-to-image-more 的整 DOM 栅格化、
 *          jspdf 的单页 PDF 封装；依赖 core/commands 的 EXPORT_COMMAND、core/types 的 ZiminosContext、
 *          core/exportStyle 的 ExportStyle 契约；依赖 ./paper 渲纸、./logo 解析品牌标志、
 *          ./decorate 施加风格、./modal 收选择、./layout 的尺寸纯函数；桌面保存时按需 require Electron 与 node:fs
 * [OUTPUT]: 对外提供 registerExportCommand，把“导出当前笔记”接进命令台
 * [POS]: 导出模块的唯一编排点，只讲流程：渲一张纸 → 交给预览让用户调 → 照终值再施一次风格 →
 *        一次性截图 → 按格式交付。内容渲染、装饰与界面各有其主，这里一件都不自己做。
 *        截图前**再施加一次风格**不是保险起见：用户拖完滑块立刻点导出时，
 *        预览排队中的那一帧可能还没轮到，而 applyDecorations 幂等，重放一次的代价是零。
 *        任何失败都只落 Notice，不影响原笔记与活动视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import domToImage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';
import { Notice, Platform, TFile } from 'obsidian';
import { EXPORT_COMMAND } from '../../core/commands';
import type { ExportFormat, ExportStyle } from '../../core/exportStyle';
import type { ZiminosContext } from '../../core/types';
import { applyDecorations } from './decorate';
import { captureScale, pdfPageSize, safeExportName } from './layout';
import type { ExportTemplateContext } from './layout';
import { resolveLogo } from './logo';
import { ExportPreviewModal } from './modal';
import { renderPaper } from './paper';
import type { ExportPaper } from './paper';

interface SaveDialogResult {
    readonly canceled: boolean;
    readonly filePath?: string;
}

interface SaveDialog {
    showSaveDialog(options: {
        readonly title: string;
        readonly defaultPath: string;
        readonly filters: readonly { readonly name: string; readonly extensions: readonly string[] }[];
        readonly properties: readonly string[];
    }): Promise<SaveDialogResult>;
}

/** 注册唯一入口 */
export function registerExportCommand(ctx: ZiminosContext): void {
    ctx.commands.register(EXPORT_COMMAND, () => {
        void exportCurrentNote(ctx);
    });
}

async function exportCurrentNote(ctx: ZiminosContext): Promise<void> {
    const file = ctx.app.workspace.getActiveFile();

    if (!(file instanceof TFile) || file.extension !== 'md') {
        new Notice('请先打开一篇 Markdown 笔记。');

        return;
    }

    let paper: ExportPaper | null = null;

    try {
        new Notice('正在生成预览…');
        paper = await renderPaper(ctx, file);

        const context = templateContextOf(file);
        const style = await new ExportPreviewModal(
            ctx.app,
            paper,
            ctx.settings.exportStyle,
            context,
        ).openAndGetValue();

        if (!style) return;

        await rememberStyle(ctx, style);

        const saved = await capture(ctx, file, paper, style, context);

        if (saved) new Notice(`已导出：${saved}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(`导出失败：${message}`);
    } finally {
        paper?.release();
    }
}

/**
 * 这套风格落盘，下一次打开预览就是它。
 *
 * 只在用户点了「导出」之后才存：拖动过程中的每一个中间值都不算数据，
 * 取消就该什么都没发生——这是「人主导」在这个弹窗里的具体形状。
 */
async function rememberStyle(ctx: ZiminosContext, style: ExportStyle): Promise<void> {
    ctx.settings.exportStyle = style;
    await ctx.saveSettings();
}

async function capture(
    ctx: ZiminosContext,
    file: TFile,
    paper: ExportPaper,
    style: ExportStyle,
    context: ExportTemplateContext,
): Promise<string | null> {
    // 标志在这里重解一次而不是信弹窗那一份：读盘是异步的，用户完全可能在它读完之前就点了导出。
    // resolveLogo 自带按路径与修改时间的缓存，重解一次通常连一次读盘都不会发生。
    applyDecorations(paper.article, style, context, await resolveLogo(ctx.app, style.logo));

    const { width, height } = paper.measure();
    const blob = await domToImage.toBlob(paper.article, {
        width,
        height,
        scale: captureScale(width, height),
        bgcolor: backgroundColorOf(paper.article),
    });

    if (!blob) throw new Error('浏览器没有生成图片数据');

    const bytes = style.format === 'png'
        ? new Uint8Array(await blob.arrayBuffer())
        : await pdfBytes(blob, width, height);

    return saveExport(ctx, file, style.format, bytes);
}

function backgroundColorOf(element: HTMLElement): string {
    return getComputedStyle(element).backgroundColor || '#ffffff';
}

async function pdfBytes(image: Blob, width: number, height: number): Promise<Uint8Array> {
    const page = pdfPageSize(width, height);
    const pdf = new jsPDF({
        unit: 'pt',
        format: [page.width, page.height],
        orientation: page.width > page.height ? 'landscape' : 'portrait',
        compress: true,
    });

    pdf.addImage(
        new Uint8Array(await image.arrayBuffer()),
        'PNG',
        0,
        0,
        page.width,
        page.height,
        undefined,
        'FAST',
    );

    return new Uint8Array(pdf.output('arraybuffer'));
}

async function saveExport(
    ctx: ZiminosContext,
    source: TFile,
    format: ExportFormat,
    bytes: Uint8Array,
): Promise<string | null> {
    const fileName = `${safeExportName(source.basename)}.${format}`;

    if (Platform.isDesktopApp) {
        const dialog = resolveSaveDialog();

        if (dialog) {
            const result = await dialog.showSaveDialog({
                title: '导出当前笔记',
                defaultPath: fileName,
                filters: [{ name: format === 'png' ? 'PNG 图片' : 'PDF 文档', extensions: [format] }],
                properties: ['showOverwriteConfirmation', 'createDirectory'],
            });

            if (result.canceled || !result.filePath) return null;

            const fs = require('node:fs/promises') as {
                writeFile(path: string, data: Uint8Array): Promise<void>;
            };

            await fs.writeFile(result.filePath, bytes);

            return result.filePath;
        }
    }

    const path = await ctx.app.fileManager.getAvailablePathForAttachment(fileName, source.path);

    await ctx.app.vault.createBinary(path, bytes.slice().buffer as ArrayBuffer);

    return path;
}

/** Electron 只负责系统保存框；探不到时调用方有公开 Vault API 的完整降级路径 */
function resolveSaveDialog(): SaveDialog | null {
    try {
        const electron = require('electron') as { remote?: { dialog?: SaveDialog } };

        if (electron.remote?.dialog) return electron.remote.dialog;
    } catch {
        // 某些 Obsidian 版本只暴露 @electron/remote，继续试下一条
    }

    try {
        const remote = require('@electron/remote') as { dialog?: SaveDialog };

        return remote.dialog ?? null;
    } catch {
        return null;
    }
}

/** 占位符认的是「按下导出那一刻」，所以时间在渲纸时取一次，此后拖多久都不变 */
function templateContextOf(file: TFile): ExportTemplateContext {
    const now = new Date();

    return {
        title: file.basename,
        date: localDay(now),
        time: localTime(now),
    };
}

function localDay(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function localTime(value: Date): string {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}
