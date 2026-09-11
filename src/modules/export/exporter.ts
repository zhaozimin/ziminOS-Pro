/**
 * [INPUT]: 依赖 obsidian 的 Component/MarkdownRenderer/MarkdownView/Notice/Platform/requestUrl/TFile；
 *          依赖 dom-to-image-more 的整 DOM 栅格化、jspdf 的单页 PDF 封装；
 *          依赖 core/commands 的 EXPORT_COMMAND、core/types 的 ZiminosContext，
 *          依赖 ./layout 的选项/尺寸纯函数与 ./modal 的导出弹窗；桌面保存时按需 require Electron 与 node:fs
 * [OUTPUT]: 对外提供 registerExportCommand，把“导出当前笔记”接进命令台
 * [POS]: 导出模块的唯一编排点：读取当前笔记、离屏渲染、等待版面稳定、内联图片、一次性截图，
 *        再按用户选择直接保存 PNG 或把同一张图装进单页 PDF。两种格式不各自解释 Markdown，
 *        因此动态视图、页眉页脚与水印天然同构；任何失败都只落 Notice，不影响原笔记与活动视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import domToImage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';
import {
    Component,
    MarkdownRenderer,
    MarkdownView,
    Notice,
    Platform,
    requestUrl,
    TFile,
} from 'obsidian';
import { EXPORT_COMMAND } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';
import {
    captureScale,
    DEFAULT_EXPORT_OPTIONS,
    pdfPageSize,
    resolveExportText,
    safeExportName,
} from './layout';
import type { ExportOptions, ExportTemplateContext } from './layout';
import { ExportOptionsModal } from './modal';

interface RenderedArticle {
    readonly element: HTMLElement;
    readonly width: number;
    readonly height: number;
    readonly release: () => void;
}

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

const ARTICLE_WIDTH_FALLBACK = 760;
const ARTICLE_WIDTH_MIN = 480;
const ARTICLE_WIDTH_MAX = 1_600;
const IMAGE_TIMEOUT_MS = 6_000;
const LAYOUT_TIMEOUT_MS = 3_000;

/** 注册唯一入口；上次选择只活在本次 Obsidian 会话，不污染全局设置 */
export function registerExportCommand(ctx: ZiminosContext): void {
    let previous = DEFAULT_EXPORT_OPTIONS;

    ctx.commands.register(EXPORT_COMMAND, () => {
        void (async () => {
            const options = await new ExportOptionsModal(ctx.app, previous).openAndGetValue();

            if (!options) return;

            previous = options;
            await exportCurrentNote(ctx, options);
        })();
    });
}

async function exportCurrentNote(ctx: ZiminosContext, options: ExportOptions): Promise<void> {
    const file = ctx.app.workspace.getActiveFile();

    if (!(file instanceof TFile) || file.extension !== 'md') {
        new Notice('请先打开一篇 Markdown 笔记。');

        return;
    }

    let article: RenderedArticle | null = null;

    try {
        new Notice('正在生成完整长页…');
        article = await renderArticle(ctx, file, options);

        const scale = captureScale(article.width, article.height);
        const blob = await domToImage.toBlob(article.element, {
            width: article.width,
            height: article.height,
            scale,
            bgcolor: backgroundColorOf(article.element),
        });

        if (!blob) throw new Error('浏览器没有生成图片数据');

        const bytes = options.format === 'png'
            ? new Uint8Array(await blob.arrayBuffer())
            : await pdfBytes(blob, article.width, article.height);
        const saved = await saveExport(ctx, file, options.format, bytes);

        if (saved) new Notice(`已导出：${saved}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(`导出失败：${message}`);
    } finally {
        article?.release();
    }
}

/**
 * 用 MarkdownRenderer 重新渲染，而不是截当前可见区域：用户停在源码模式、滚到文章中段，
 * 或视图容器启用了虚拟滚动时，导出仍然必须从标题到最后一行完整一致。
 */
async function renderArticle(
    ctx: ZiminosContext,
    file: TFile,
    options: ExportOptions,
): Promise<RenderedArticle> {
    const component = new Component();
    const stage = document.body.createDiv({ cls: 'ziminos-export-stage' });
    const article = stage.createDiv({ cls: 'markdown-preview-view markdown-rendered ziminos-export-article' });
    const content = article.createDiv({ cls: 'markdown-preview-sizer' });
    const now = new Date();
    const context: ExportTemplateContext = {
        title: file.basename,
        date: localDay(now),
        time: localTime(now),
    };
    const desiredWidth = articleWidthOf(ctx, file);

    component.load();
    styleStage(stage);
    styleArticle(article, content, desiredWidth);

    if (options.header.trim()) {
        content.createDiv({
            cls: 'ziminos-export-header',
            text: resolveExportText(options.header.trim(), context),
        });
    }

    content.createDiv({ cls: 'inline-title', text: file.basename });

    const markdown = content.createDiv({ cls: 'ziminos-export-markdown' });

    await MarkdownRenderer.render(ctx.app, await ctx.app.vault.cachedRead(file), markdown, file.path, component);

    if (options.footer.trim()) {
        content.createDiv({
            cls: 'ziminos-export-footer',
            text: resolveExportText(options.footer.trim(), context),
        });
    }

    await inlineImages(markdown);
    await document.fonts?.ready;
    await waitForStableLayout(article);

    // 宽表格与长代码行可以真实撑宽文章；再按 scrollWidth 回填一次，随后重算最终高度。
    const naturalWidth = Math.ceil(Math.max(desiredWidth, article.scrollWidth));

    article.style.width = `${naturalWidth}px`;
    content.style.width = `${naturalWidth}px`;
    await waitForStableLayout(article);

    const width = Math.ceil(Math.max(1, article.scrollWidth));
    const height = Math.ceil(Math.max(1, article.scrollHeight));

    if (options.watermark.trim()) {
        addWatermark(article, resolveExportText(options.watermark.trim(), context), width, height);
    }

    return {
        element: article,
        width,
        height,
        release: () => {
            component.unload();
            stage.remove();
        },
    };
}

/** 从当前笔记实际显示宽度取数；源码/阅读两态都探不到时才回落 760px */
function articleWidthOf(ctx: ZiminosContext, file: TFile): number {
    const view = ctx.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view || view.file?.path !== file.path) return ARTICLE_WIDTH_FALLBACK;

    const element = view.contentEl.querySelector<HTMLElement>('.markdown-preview-sizer, .cm-sizer');
    const measured = element?.getBoundingClientRect().width ?? 0;

    return Math.round(Math.min(ARTICLE_WIDTH_MAX, Math.max(ARTICLE_WIDTH_MIN, measured || ARTICLE_WIDTH_FALLBACK)));
}

function styleStage(stage: HTMLElement): void {
    Object.assign(stage.style, {
        position: 'fixed',
        left: '-100000px',
        top: '0',
        width: 'max-content',
        height: 'max-content',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: '-1',
    });
}

function styleArticle(article: HTMLElement, content: HTMLElement, width: number): void {
    Object.assign(article.style, {
        boxSizing: 'border-box',
        position: 'relative',
        width: `${width}px`,
        minHeight: '1px',
        height: 'auto',
        overflow: 'visible',
        color: 'var(--text-normal)',
        background: 'var(--background-primary)',
    });
    Object.assign(content.style, {
        boxSizing: 'border-box',
        position: 'relative',
        width: `${width}px`,
        maxWidth: 'none',
        minHeight: '1px',
        padding: '48px 56px',
    });
}

/** 远端图片先经 Obsidian requestUrl 取回，避免浏览器 CORS 让整篇导出在最后一步失败 */
async function inlineImages(root: HTMLElement): Promise<void> {
    const images = [...root.querySelectorAll<HTMLImageElement>('img')];

    await Promise.all(images.map(async (img) => {
        const source = img.currentSrc || img.src;

        if (!source || source.startsWith('data:')) return;

        try {
            const dataUrl = await withTimeout(imageDataUrl(source), IMAGE_TIMEOUT_MS);

            img.src = dataUrl;
            await withTimeout(img.decode(), IMAGE_TIMEOUT_MS);
        } catch {
            const fallback = document.createElement('span');

            fallback.className = 'ziminos-export-image-fallback';
            fallback.textContent = `【图片未能载入${img.alt ? `：${img.alt}` : ''}】`;
            img.replaceWith(fallback);
        }
    }));
}

async function imageDataUrl(source: string): Promise<string> {
    if (/^https?:/i.test(source)) {
        const response = await requestUrl({ url: source, method: 'GET' });
        const type = response.headers['content-type'] || 'application/octet-stream';

        return `data:${type};base64,${base64Of(response.arrayBuffer)}`;
    }

    const response = await fetch(source);

    if (!response.ok) throw new Error(`图片读取失败：${response.status}`);

    const blob = await response.blob();

    return `data:${blob.type || 'application/octet-stream'};base64,${base64Of(await blob.arrayBuffer())}`;
}

function base64Of(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let start = 0; start < bytes.length; start += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    }

    return btoa(binary);
}

/** 连续三帧尺寸不变即视为稳定；动态视图失手时最多等三秒，不让导出永久悬挂 */
async function waitForStableLayout(element: HTMLElement): Promise<void> {
    const started = Date.now();
    let stableFrames = 0;
    let previous = '';

    while (stableFrames < 3 && Date.now() - started < LAYOUT_TIMEOUT_MS) {
        await nextFrame();

        const current = `${element.scrollWidth}x${element.scrollHeight}`;

        stableFrames = current === previous ? stableFrames + 1 : 0;
        previous = current;
    }
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('等待超时')), milliseconds);

        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                window.clearTimeout(timer);
                reject(error);
            },
        );
    });
}

function addWatermark(article: HTMLElement, text: string, width: number, height: number): void {
    const escaped = escapeXml(text);
    const color = escapeXml(getComputedStyle(article).color || '#6b7280');
    const tile = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="180">` +
        `<text x="140" y="90" text-anchor="middle" dominant-baseline="middle" ` +
        `transform="rotate(-28 140 90)" fill="${color}" fill-opacity="0.14" ` +
        `font-family="sans-serif" font-size="16">${escaped}</text></svg>`,
    );
    const layer = article.createDiv({ cls: 'ziminos-export-watermark' });

    Object.assign(layer.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: `${width}px`,
        height: `${height}px`,
        zIndex: '20',
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,${tile}")`,
        backgroundRepeat: 'repeat',
    });
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
    format: ExportOptions['format'],
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

function localDay(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function localTime(value: Date): string {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}
