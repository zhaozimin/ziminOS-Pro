/**
 * [INPUT]: 依赖 core/exportStyle 的 ExportStyle 契约，依赖 ./layout 的占位符与水印几何纯函数，
 *          依赖 ./logo 的 ResolvedLogo（已经解析好的字节，本层不读盘）
 * [OUTPUT]: 对外提供 applyDecorations——把一套风格施加到一张已经渲好的纸上
 * [POS]: 导出模块的装饰层，与 paper.ts 严格分工：那边回答「这篇笔记有多大」，这边回答「它周围写什么」。
 *        本文件唯一的设计承诺是**幂等**：同一张纸连调十次与调一次结果一字不差。
 *        幂等不是性质而是前提——预览每拖动一次滑块就重放一次，而用户拖完立刻点导出时，
 *        排队中的那一帧可能还没轮到；导出前再照终值放一次，看见的与拿到的才必然是同一张图。
 *        第二条纪律是**全同步**：标志的字节由 ./logo 预先解析好递进来，本层一个 await 都不许有，
 *        否则帧与帧会乱序，用户会看见上一帧的水印盖在这一帧的排版上
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ExportStyle } from '../../core/exportStyle';
import {
    resolveExportText,
    watermarkMark,
    watermarkPosition,
    watermarkSvg,
    watermarkTile,
} from './layout';
import type { ExportTemplateContext } from './layout';
import type { ResolvedLogo } from './logo';

const DECORATION_SELECTOR =
    '.ziminos-export-header, .ziminos-export-footer, .ziminos-export-watermark';

/** 页眉页脚是一行 flex，所以「靠左」说的是 justify-content 而不是 text-align */
const JUSTIFY: Readonly<Record<ExportStyle['headerAlign'], string>> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};

/** 量文字宽度的那块 canvas 全模块共用一张：它从不显示，只是一把尺子 */
let ruler: HTMLCanvasElement | null = null;

/**
 * 把页眉、页脚与水印重新画一遍。先清干净再重建，因此调用多少次都只剩一份。
 *
 * 顺序不能换：页眉页脚会改变纸的高度，水印层却要盖满整张纸，
 * 所以必须等前两者落位、浏览器重算完版面，才有资格去问这张纸现在多高。
 */
export function applyDecorations(
    article: HTMLElement,
    style: ExportStyle,
    context: ExportTemplateContext,
    logo: ResolvedLogo | null,
): void {
    const content = article.querySelector<HTMLElement>('.markdown-preview-sizer');

    if (!content) return;

    article.querySelectorAll(DECORATION_SELECTOR).forEach((node) => node.remove());

    const header = buildLine(content, 'ziminos-export-header', {
        text: resolveExportText(style.header.trim(), context),
        align: style.headerAlign,
        logo,
        logoSize: style.headerLogoSize,
    });

    if (header) {
        header.style.marginBottom = `${style.headerGap}px`;
        content.prepend(header);
    }

    const footer = buildLine(content, 'ziminos-export-footer', {
        text: resolveExportText(style.footer.trim(), context),
        align: style.footerAlign,
        logo,
        logoSize: style.footerLogoSize,
    });

    if (footer) footer.style.marginTop = `${style.footerGap}px`;

    applyWatermark(article, style, context, logo);
}

interface LineInput {
    readonly text: string;
    readonly align: ExportStyle['headerAlign'];
    readonly logo: ResolvedLogo | null;
    readonly logoSize: number;
}

/**
 * 画一行页眉或页脚。文字与标志都没有就返回 null——**「关闭」的判据是这一行空无一物**，
 * 而不再是「文字为空」；只放一枚标志不写字，是落款最常见的样子。
 */
function buildLine(host: HTMLElement, cls: string, input: LineInput): HTMLElement | null {
    const showLogo = Boolean(input.logo) && input.logoSize > 0;

    if (!input.text && !showLogo) return null;

    const line = host.createDiv({ cls });

    Object.assign(line.style, {
        display: 'flex',
        alignItems: 'center',
        // 用 em 而不是 px：这一行的字号随主题与用户选的阅读字体走，
        // 图字之间那点空得跟着走，写死 px 会让换过字体的人看见图贴着字
        gap: '0.55em',
        justifyContent: JUSTIFY[input.align],
    });

    if (showLogo && input.logo) {
        const image = line.createEl('img', { attr: { src: input.logo.dataUrl, alt: '' } });

        // 只钉高度、宽度随比例走：换一张更宽的标志时，这一行的高度不该跟着跳
        Object.assign(image.style, {
            height: `${input.logoSize}px`,
            width: 'auto',
            display: 'block',
            flex: '0 0 auto',
        });
    }

    if (input.text) line.createSpan({ text: input.text });

    return line;
}

function applyWatermark(
    article: HTMLElement,
    style: ExportStyle,
    context: ExportTemplateContext,
    logo: ResolvedLogo | null,
): void {
    const text = resolveExportText(style.watermark.trim(), context);
    const showLogo = Boolean(logo) && style.watermarkLogoSize > 0;

    if (!text && !showLogo) return;

    const computed = getComputedStyle(article);
    const fontFamily = computed.fontFamily || 'sans-serif';
    const tiled = style.watermarkMode === 'tile';
    const logoHeight = showLogo ? style.watermarkLogoSize : 0;
    const logoWidth = showLogo && logo
        ? Math.max(1, Math.round((logoHeight * logo.width) / logo.height))
        : 0;
    const mark = watermarkMark({
        textWidth: text ? measureTextWidth(text, style.watermarkSize, fontFamily) : 0,
        fontSize: style.watermarkSize,
        logoWidth,
        logoHeight,
    });
    const tile = watermarkTile(
        mark,
        style.watermarkAngle,
        // 单个落款的间距量的是「离纸边多远」，砖本身不留白，否则那份留白会被算进偏移里两次
        tiled ? style.watermarkGapX : 0,
        tiled ? style.watermarkGapY : 0,
    );
    const svg = watermarkSvg({
        text,
        logoDataUrl: showLogo && logo ? logo.dataUrl : '',
        mark,
        tile,
        fontSize: style.watermarkSize,
        angle: style.watermarkAngle,
        // 水印文字取正文色而不是单开一个取色器：它在明暗两套主题里都读得出，
        // 而一个写死的品牌色在暗色主题下会变成一块看不见的东西。标志自带颜色，不受这条影响。
        color: computed.color || '#6b7280',
        fontFamily,
        opacity: style.watermarkOpacity,
    });
    const layer = article.createDiv({ cls: 'ziminos-export-watermark' });

    Object.assign(layer.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        // 高度按此刻的真实纸高写死而不是 inset:0：纸的盒子高度与它的 scrollHeight
        // 在内容溢出时并不相等，而截图取的正是后者，水印必须盖满被拍下来的那一块。
        width: `${Math.ceil(Math.max(1, article.scrollWidth))}px`,
        height: `${Math.ceil(Math.max(1, article.scrollHeight))}px`,
        zIndex: '20',
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundRepeat: tiled ? 'repeat' : 'no-repeat',
        backgroundPosition: tiled
            ? '0 0'
            : watermarkPosition(style.watermarkAnchor, style.watermarkGapX, style.watermarkGapY),
    });
}

/**
 * 用 canvas 量一行字在目标字号下的真实宽度。
 *
 * 不用「字数 × 字号」估：中英混排里那个估值能差出一倍，而水印砖一旦比字窄，
 * 平铺出来就是一行字被下一块砖切掉半截。量不到时才退回估值，那是最后一道兜底。
 */
function measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
    ruler ??= document.createElement('canvas');

    const context = ruler.getContext('2d');

    if (!context) return text.length * fontSize * 0.9;

    context.font = `${fontSize}px ${fontFamily}`;

    return context.measureText(text).width || text.length * fontSize * 0.9;
}
