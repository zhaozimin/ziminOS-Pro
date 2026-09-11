/**
 * [INPUT]: 只依赖调用方给出的文章尺寸、当前时间、标题与用户填写的装饰文本
 * [OUTPUT]: 对外提供 ExportFormat/ExportOptions/ExportTemplateContext 契约、DEFAULT_EXPORT_OPTIONS，
 *           以及 resolveExportText/safeExportName/captureScale/pdfPageSize 四个纯函数
 * [POS]: 导出模块的无 DOM 口径层。浏览器画布上限、PDF 单页上限、占位符与文件名规则
 *        都在这里收口，使渲染器只负责拿事实，不再夹带一套难以单测的尺寸算法
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 当前支持的两个交付格式；图片只交付无损 PNG，避免再长出一排近义选项 */
export type ExportFormat = 'png' | 'pdf';

/** 一次导出的全部用户选择；空装饰文本就是明确关闭，不需要三枚额外开关 */
export interface ExportOptions {
    readonly format: ExportFormat;
    readonly header: string;
    readonly footer: string;
    readonly watermark: string;
}

/** 装饰文本允许引用的三个稳定事实 */
export interface ExportTemplateContext {
    readonly title: string;
    readonly date: string;
    readonly time: string;
}

export interface PdfPageSize {
    readonly width: number;
    readonly height: number;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    format: 'png',
    header: '',
    footer: '',
    watermark: '',
};

/**
 * Chromium 对 canvas 的限制既看单边也看总像素。倍率从 2x 开始，长文越长越主动降采样，
 * 目标只有一个：宁可一张完整、稍低清的长图，也不在不告诉用户的情况下截掉后半篇。
 */
const MAX_CANVAS_SIDE = 32_000;
const MAX_CANVAS_PIXELS = 192_000_000;
const PREFERRED_SCALE = 2;

/** PDF 规范与 Chromium 常见实现都把单边 14,400pt 当安全边界 */
const MAX_PDF_POINTS = 14_400;
const POINTS_PER_CSS_PIXEL = 72 / 96;

/** 把 {title}/{date}/{time} 换成这一次导出的事实；未知占位符原样保留 */
export function resolveExportText(template: string, context: ExportTemplateContext): string {
    const values: Readonly<Record<string, string>> = {
        title: context.title,
        date: context.date,
        time: context.time,
    };

    return template.replace(/\{(title|date|time)\}/g, (_match, key: string) => values[key]);
}

/** 导出的默认文件名来自笔记名；只清掉各桌面系统共同不接受的字符 */
export function safeExportName(title: string): string {
    const cleaned = title.replace(/[\\/:*?"<>|]/g, '－').trim();

    return cleaned || '未命名笔记';
}

/** 在画布单边与总像素两道边界内求最大倍率 */
export function captureScale(width: number, height: number): number {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const bySide = Math.min(MAX_CANVAS_SIDE / safeWidth, MAX_CANVAS_SIDE / safeHeight);
    const byArea = Math.sqrt(MAX_CANVAS_PIXELS / (safeWidth * safeHeight));

    return Math.max(Number.EPSILON, Math.min(PREFERRED_SCALE, bySide, byArea));
}

/**
 * CSS px 先换成 pt；超出单页安全边界时只缩纸张坐标，不裁图片。
 * 文章纵横比因此保持不变，PDF 始终只有一页且包含整篇。
 */
export function pdfPageSize(width: number, height: number): PdfPageSize {
    const pointWidth = Math.max(1, width) * POINTS_PER_CSS_PIXEL;
    const pointHeight = Math.max(1, height) * POINTS_PER_CSS_PIXEL;
    const scale = Math.min(1, MAX_PDF_POINTS / Math.max(pointWidth, pointHeight));

    return {
        width: pointWidth * scale,
        height: pointHeight * scale,
    };
}
