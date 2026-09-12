/**
 * [INPUT]: 依赖 core/exportStyle 的 WatermarkAnchor 类型；其余只认调用方给出的数字与文本
 * [OUTPUT]: 对外提供 ExportTemplateContext 契约与十个纯函数——resolveExportText / safeExportName /
 *           captureScale / pdfPageSize / exportLinkUrl / pageWidthOf / pageMinHeightOf /
 *           watermarkMark / watermarkTile / watermarkSvg / watermarkPosition
 * [POS]: 导出模块的无 DOM 口径层。浏览器画布上限、PDF 单页上限、占位符、文件名规则与水印几何
 *        都在这里收口，使渲染器只负责拿事实，不再夹带一套难以单测的尺寸算法。
 *        水印几何刻意不在这里量文字宽度——测宽要 canvas，而 canvas 一进来整层就不再可单测；
 *        宽度由 DOM 层量好递进来，于是「一行字斜过来占多大地方」这道题仍然是纯算术
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ExportStyle, WatermarkAnchor } from '../../core/exportStyle';

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

/** 一块水印底图的尺寸。平铺时它是砖，单个时它就是水印本身 */
export interface WatermarkTile {
    readonly width: number;
    readonly height: number;
}

export interface WatermarkMarkInput {
    /** 一行水印文字在目标字号下的真实宽度，由 DOM 层量好递进来；0 即没有文字 */
    readonly textWidth: number;
    readonly fontSize: number;
    /** 标志按目标高度换算后的宽；0 即没有标志 */
    readonly logoWidth: number;
    readonly logoHeight: number;
}

/**
 * 一枚水印标记：可能是一行字、一枚图，或者图在左字在右。
 *
 * 它是「砖」与「图案」之间那个缺失的概念。原先只有字时，砖的尺寸就是字的尺寸，
 * 两者可以合成一步；加进标志之后再合并，`watermarkTile` 与 `watermarkSvg` 就要各算一遍
 * 同一套内部排布——那是同一个答案的两份实现，改一处必然漏另一处。
 */
export interface WatermarkMark {
    readonly width: number;
    readonly height: number;
    readonly logoX: number;
    readonly logoY: number;
    readonly logoWidth: number;
    readonly logoHeight: number;
    /** 文字锚点，配 text-anchor="middle" 与 dominant-baseline="central" 使用 */
    readonly textX: number;
    readonly textY: number;
}

export interface WatermarkSvgInput {
    readonly text: string;
    /** 标志的 data URI；空串即这枚标记里没有图 */
    readonly logoDataUrl: string;
    readonly mark: WatermarkMark;
    readonly tile: WatermarkTile;
    readonly fontSize: number;
    readonly angle: number;
    readonly color: string;
    readonly fontFamily: string;
    /** 百分数 */
    readonly opacity: number;
}

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

/** 一行字在字号之上还要占的行高比例。中日文字形比拉丁高，取 1.32 才不会把上下缘削掉 */
const LINE_BOX_RATIO = 1.32;

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

/** 图与字之间那点空，按字号成比例给；不新增旋钮，因为它没有第二种合理取值 */
const LOGO_TEXT_GAP_RATIO = 0.45;

/**
 * 一枚标记内部怎么排：图在左、字在右、两者垂直居中。
 *
 * 只有图、只有字、图字兼有三种情形共用这一段算术——把「没有」表达成宽度 0，
 * 而不是三条分支。分支会让「只有图时间距该不该算」这类问题各答一次，迟早答岔。
 */
export function watermarkMark(input: WatermarkMarkInput): WatermarkMark {
    const textWidth = Math.max(0, input.textWidth);
    const logoWidth = Math.max(0, input.logoWidth);
    const logoHeight = Math.max(0, input.logoHeight);
    const textHeight = textWidth > 0 ? input.fontSize * LINE_BOX_RATIO : 0;
    const gap = textWidth > 0 && logoWidth > 0
        ? Math.round(input.fontSize * LOGO_TEXT_GAP_RATIO)
        : 0;
    const width = Math.max(1, Math.ceil(logoWidth + gap + textWidth));
    const height = Math.max(1, Math.ceil(Math.max(logoHeight, textHeight)));

    return {
        width,
        height,
        logoX: 0,
        logoY: (height - logoHeight) / 2,
        logoWidth,
        logoHeight,
        textX: logoWidth + gap + textWidth / 2,
        textY: height / 2,
    };
}

/**
 * 一块水印砖有多大：先求这枚标记斜过来之后的外接矩形，再各加一份间距。
 *
 * 加的是**外接矩形**而不是标记本身的宽高，否则角度一大，相邻两行就会互相插进对方的空档里——
 * 用户明明在把间距调大，看见的却是水印挤成一团。间距因此永远是「两个水印之间真实的空白」。
 */
export function watermarkTile(
    mark: WatermarkMark,
    angle: number,
    gapX: number,
    gapY: number,
): WatermarkTile {
    const radians = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    return {
        width: Math.max(1, Math.ceil(mark.width * cos + mark.height * sin + Math.max(0, gapX))),
        height: Math.max(1, Math.ceil(mark.width * sin + mark.height * cos + Math.max(0, gapY))),
    };
}

/**
 * 把一枚标记画成一块砖。标记居中摆进砖里，再整体绕砖心旋转，
 * 于是平铺与单个共用同一张底图，图与字也必然一起转、一起淡——
 * 不透明度写在外层 <g> 上而不是各写一遍，正是为了让「一起」这件事在结构上成立。
 */
export function watermarkSvg(input: WatermarkSvgInput): string {
    const centerX = input.tile.width / 2;
    const centerY = input.tile.height / 2;
    const offsetX = (input.tile.width - input.mark.width) / 2;
    const offsetY = (input.tile.height - input.mark.height) / 2;
    const opacity = Math.min(1, Math.max(0, input.opacity / 100));
    const logo = input.logoDataUrl && input.mark.logoWidth > 0
        ? `<image x="${input.mark.logoX}" y="${round(input.mark.logoY)}" ` +
          `width="${round(input.mark.logoWidth)}" height="${round(input.mark.logoHeight)}" ` +
          `href="${escapeXml(input.logoDataUrl)}"/>`
        : '';
    const text = input.text
        ? `<text x="${round(input.mark.textX)}" y="${round(input.mark.textY)}" ` +
          `text-anchor="middle" dominant-baseline="central" fill="${escapeXml(input.color)}" ` +
          `font-family="${escapeXml(input.fontFamily)}" font-size="${input.fontSize}">` +
          `${escapeXml(input.text)}</text>`
        : '';

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${input.tile.width}" height="${input.tile.height}">` +
        `<g opacity="${opacity}" transform="rotate(${input.angle} ${centerX} ${centerY}) ` +
        `translate(${round(offsetX)} ${round(offsetY)})">${logo}${text}</g></svg>`
    );
}

/** SVG 属性里不留十几位小数：它们只会把 data URI 撑长，画出来一个像素都不差 */
function round(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * 单个水印落在哪儿，写成一条 background-position。
 *
 * 靠右/靠下用的是 `calc(100% - Npx)`，看着像会把图顶出纸外，其实不会：
 * background-position 里的百分比是按「容器减去图」算的，100% 就已经是贴右缘，
 * 再减 N 正好是「离右缘 N 像素」。因此三种落点共用一条式子，不必分出四值语法那一套特例。
 */
export function watermarkPosition(anchor: WatermarkAnchor, gapX: number, gapY: number): string {
    const [vertical, horizontal] = anchor.split('-');
    const x = horizontal === 'left'
        ? `${Math.max(0, gapX)}px`
        : horizontal === 'right' ? `calc(100% - ${Math.max(0, gapX)}px)` : '50%';
    const y = vertical === 'top'
        ? `${Math.max(0, gapY)}px`
        : vertical === 'bottom' ? `calc(100% - ${Math.max(0, gapY)}px)` : '50%';

    return `${x} ${y}`;
}

/**
 * 把用户填的那一行收成一个可以安全放进 PDF 链接注解的网址，收不成就返回空串。
 *
 * 两条规矩，各有各的理由：
 *
 * 其一，**不带协议就补 `https://`**。用户想推广的是 `edu.zhaozimin.cn` 这种写法——
 * 逼他先学会「链接必须带 https://」，是把实现细节当成了功课。
 *
 * 其二，**只认 http 与 https**。这串字会原样变成 PDF 里的一个动作，
 * 而 PDF 阅读器对 `javascript:`、`file:` 这类 scheme 的处置各不相同；
 * 白名单之外一律判为「没填链接」，不是「填错了就凑合执行」。
 */
export function exportLinkUrl(raw: string): string {
    const trimmed = raw.trim();

    if (!trimmed) return '';

    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
        const url = new URL(candidate);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';

        return url.href;
    } catch {
        return '';
    }
}

/**
 * 纸该有多宽——null 表示「别管，跟编辑区」。
 *
 * 翻译放在这里而不是各自在弹窗与导出器里写一次三元：那两处必须给出同一个答案，
 * 否则预览里看见的宽度与拍下来的宽度会差一点，而那一点没有任何东西会提示。
 */
export function pageWidthOf(style: ExportStyle): number | null {
    return style.pageMode === 'fixed' ? Math.max(1, Math.round(style.pageWidth)) : null;
}

/** 纸至少该有多高——null 表示「别管，跟内容」。内容更高时照样往下长 */
export function pageMinHeightOf(style: ExportStyle): number | null {
    return style.pageMode === 'fixed' ? Math.max(1, Math.round(style.pageHeight)) : null;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
