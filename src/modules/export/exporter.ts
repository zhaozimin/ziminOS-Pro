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
import { applyDecorations, linkRegions } from './decorate';
import type { LinkRegion } from './decorate';
import { captureScale, pageMinHeightOf, pageWidthOf, pdfPageSize, safeExportName } from './layout';
import type { ExportTemplateContext } from './layout';
import { resolveLogo } from './logo';
import { ExportPreviewModal } from './modal';
import { renderPaper } from './paper';
import { openExportProgress } from './progress';
import type { ExportProgress } from './progress';
import type { ExportPaper } from './paper';

interface SaveDialogResult {
    readonly canceled: boolean;
    readonly filePath?: string;
}

/** 这次导出要落到哪儿。先问、后做，因此它必须是一个能提前拿在手里的值 */
interface ExportTarget {
    /** system＝系统保存框选的库外路径；vault＝没有系统框时落在笔记旁边 */
    readonly kind: 'system' | 'vault';
    readonly path: string;
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
    let progress: ExportProgress | null = null;

    try {
        new Notice('正在生成预览…');
        paper = await renderPaper(ctx, file);

        const context = templateContextOf(file);
        // 先问去处、后做图。旧的顺序是反的：点完「导出」先栅格化整张长图（长文要好几秒），
        // 期间弹窗已经关掉、屏幕上什么都没有，保存框才姗姗来迟——用户以为它死了。
        // 而且那几秒是白花的：他完全可能在保存框里按取消。
        // 这个盒子存在的唯一理由是回调里赋的值要带出闭包，TypeScript 对闭包里的赋值不做收窄。
        const picked: { target: ExportTarget | null } = { target: null };
        const style = await new ExportPreviewModal(
            ctx.app,
            paper,
            ctx.settings.exportStyle,
            context,
            async (candidate) => {
                picked.target = await chooseTarget(ctx, file, candidate.format);

                return picked.target !== null;
            },
        ).openAndGetValue();
        const target = picked.target;

        if (!style || !target) return;

        await rememberStyle(ctx, style);

        // 一条不会动的提示，用户的原话是「像盲盒一样」。进度条按阶段推进并自报家门，
        // 步数取决于格式——PDF 比 PNG 多一步「装进单页 PDF」，而那一步是真的要花时间。
        progress = openExportProgress(ctx.app, style.format === 'pdf' ? 4 : 3);

        const saved = await capture(ctx, file, paper, style, context, target, progress);

        progress.succeed(`已导出：${saved}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // 进度条开着就把话说在那儿（它不自动关，用户读完再点掉）；还没开就退回 Notice
        if (progress) progress.fail(message);
        else new Notice(`导出失败：${message}`);
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
    target: ExportTarget,
    progress: ExportProgress,
): Promise<string> {
    await progress.step('排版定稿…');

    // 与弹窗的 redraw 同样的几步、同样的先后：明暗 → 尺寸 → 装饰 → 量。
    // 重放一次的代价是零（两者都幂等），而不重放的代价是拿到的与看见的不是同一张。
    paper.setTheme(style.theme);
    paper.resize(pageWidthOf(style), pageMinHeightOf(style));
    // 标志在这里重解一次而不是信弹窗那一份：读盘是异步的，用户完全可能在它读完之前就点了导出。
    // resolveLogo 自带按路径与修改时间的缓存，重解一次通常连一次读盘都不会发生。
    applyDecorations(paper.article, style, context, await resolveLogo(ctx.app, style.logo));

    const { width, height } = paper.measure();

    await progress.step(`正在栅格化 ${width.toLocaleString('zh-CN')} × ${height.toLocaleString('zh-CN')} px…`);

    const blob = await domToImage.toBlob(paper.article, {
        width,
        height,
        scale: captureScale(width, height),
        bgcolor: backgroundColorOf(paper.article),
    });

    if (!blob) throw new Error('浏览器没有生成图片数据');

    const links = linkRegions(paper.article, style);
    let bytes: Uint8Array;

    if (style.format === 'png') {
        bytes = new Uint8Array(await blob.arrayBuffer());
    } else {
        await progress.step('装进单页 PDF…');
        bytes = await pdfBytes(blob, width, height, links);
    }

    await progress.step('写入文件…');

    const saved = await writeTarget(ctx, target, bytes);

    // PNG 就是一堆像素，「可点」这个概念在它那里不存在。用户填了链接却什么都没发生时，
    // 他会以为是链接写错了——所以这句话必须在他刚拿到文件的那一刻说，而不是只写在设置旁边。
    if (style.format === 'png' && links.length) {
        new Notice('笔记里的链接没有写进 PNG——图片点不了。要可点的链接，导出成 PDF。');
    }

    return saved;
}

function backgroundColorOf(element: HTMLElement): string {
    return getComputedStyle(element).backgroundColor || '#ffffff';
}

/**
 * 整页就是一张图，链接却照样能点：PDF 的链接注解与页面内容是两回事，
 * 它只是盖在坐标上的一块矩形。因此「一张长图」与「可点的页眉」并不冲突。
 */
async function pdfBytes(
    image: Blob,
    width: number,
    height: number,
    links: readonly LinkRegion[],
): Promise<Uint8Array> {
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

    // 纸张坐标可能被等比缩过（极长文超出单页 14,400pt 时），链接必须跟着同一个比例走，
    // 否则可点区域会停在图上别的地方——而那种错没有任何视觉提示。
    const factor = page.width / Math.max(1, width);

    for (const link of links) {
        pdf.link(link.x * factor, link.y * factor, link.width * factor, link.height * factor, {
            url: link.url,
        });
    }

    return new Uint8Array(pdf.output('arraybuffer'));
}

/**
 * 问清这次要落到哪儿。取消返回 null，于是预览弹窗留在原地等他改主意——
 * 这正是用户要的那条顺序：点导出 → 立刻弹保存框 → 选完路径，弹窗才消失。
 *
 * 没有系统保存框时（移动端，或探不到 Electron）不弹任何东西，直接给出笔记旁边的位置：
 * 那条路上本来就没有「去哪儿」这个问题要问。
 */
async function chooseTarget(
    ctx: ZiminosContext,
    source: TFile,
    format: ExportFormat,
): Promise<ExportTarget | null> {
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

            return { kind: 'system', path: result.filePath };
        }
    }

    return {
        kind: 'vault',
        path: await ctx.app.fileManager.getAvailablePathForAttachment(fileName, source.path),
    };
}

async function writeTarget(
    ctx: ZiminosContext,
    target: ExportTarget,
    bytes: Uint8Array,
): Promise<string> {
    if (target.kind === 'system') {
        const fs = require('node:fs/promises') as {
            writeFile(path: string, data: Uint8Array): Promise<void>;
        };

        await fs.writeFile(target.path, bytes);

        return target.path;
    }

    await ctx.app.vault.createBinary(target.path, bytes.slice().buffer as ArrayBuffer);

    return target.path;
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
