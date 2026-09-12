/**
 * [INPUT]: 依赖 core/exportStyle 的 ExportStyle 契约，依赖 ./layout 的占位符与水印几何纯函数，
 *          依赖 ./logo 的 ResolvedLogo（已经解析好的字节，本层不读盘）
 * [OUTPUT]: 对外提供 applyDecorations——把一套风格施加到一张已经渲好的纸上，
 *           以及 LinkRegion/linkRegions——页眉页脚与正文外链那些可点区域在纸上的坐标（只有 PDF 用得上）
 * [POS]: 导出模块的装饰层，与 paper.ts 严格分工：那边回答「这篇笔记有多大」，这边回答「它周围写什么」。
 *        本文件唯一的设计承诺是**幂等**：同一张纸连调十次与调一次结果一字不差。
 *        幂等不是性质而是前提——预览每拖动一次滑块就重放一次，而用户拖完立刻点导出时，
 *        排队中的那一帧可能还没轮到；导出前再照终值放一次，看见的与拿到的才必然是同一张图。
 *        第二条纪律是**全同步**：标志的字节由 ./logo 预先解析好递进来，本层一个 await 都不许有，
 *        否则帧与帧会乱序，用户会看见上一帧的水印盖在这一帧的排版上。
 *        第三条是**可点区域只有一套算法**：页眉页脚与正文外链共用 pushRects 一个换算——
 *        v0.32.0 之前分两套，offsetTop 那套把页脚的 y 算了两遍，整条链接落到纸外面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ExportStyle } from '../../core/exportStyle';
import {
    exportLinkUrl,
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

/**
 * PDF 里那块看不见的可点区域，坐标以文章左上角为原点、单位是 CSS 像素。
 *
 * 它是本层交给导出器的**唯一**一样不是 DOM 的东西，理由是位置只有这里知道：
 * 页眉页脚落在哪一行、那一行里真正有墨的是哪一段，都是刚刚排完版才成立的事实。
 */
export interface LinkRegion {
    readonly url: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

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

    // 参考线恒开，不再是一个开关：v0.30.0 由用户明令去掉那个按钮——
    // 它是默认就该有的观感，而不是一个需要人来决定的问题。
    // 它只翻一个类、不参与上面那次清场；翻类本身幂等，与本函数的承诺一致。
    article.addClass('ziminos-export-guides');

    const header = buildLine(content, 'ziminos-export-header', {
        enabled: style.headerEnabled,
        text: resolveExportText(style.header.trim(), context),
        align: style.headerAlign,
        color: style.headerColor,
        link: style.headerLink,
        format: style.format,
        logo,
        logoSize: style.headerLogoSize,
    });

    if (header) {
        header.style.marginBottom = `${style.headerGap}px`;
        content.prepend(header);
    }

    const footer = buildLine(content, 'ziminos-export-footer', {
        enabled: style.footerEnabled,
        text: resolveExportText(style.footer.trim(), context),
        align: style.footerAlign,
        color: style.footerColor,
        link: style.footerLink,
        format: style.format,
        logo,
        logoSize: style.footerLogoSize,
    });

    if (footer) footer.style.marginTop = `${style.footerGap}px`;

    applyWatermark(article, style, context, logo);
}

interface LineInput {
    /**
     * 这一段开不开。它排在文字、标志、链接之前——**关着就是关着**，
     * 哪怕那行字还写在设置里。开关让用户临时不要页眉时不必先把自己写好的字删掉。
     */
    readonly enabled: boolean;
    readonly text: string;
    readonly align: ExportStyle['headerAlign'];
    /** 空串＝跟随正文色，也就是不往元素上写任何颜色，让主题自己说了算 */
    readonly color: string;
    /** 用户填的那条网址原文（未验形）。它同时参与「这一行有没有东西」的判断 */
    readonly link: string;
    readonly format: ExportStyle['format'];
    readonly logo: ResolvedLogo | null;
    readonly logoSize: number;
}

/**
 * 画一行页眉或页脚。文字、标志与链接**三样都没有**才返回 null。
 *
 * 链接原本不参与这个判断，于是「只填链接、不填文字」得到的是：整行不存在、
 * 没有可点区域、而且不报错——一个填了却什么都不发生的输入框，正是本模块一路在打的那类错。
 * 现在文字为空时就用链接本身当文字：你想推广 `edu.example.com`，那就把它印出来，
 * 这也是用户填下那串字时心里想的样子。
 */
function buildLine(host: HTMLElement, cls: string, input: LineInput): HTMLElement | null {
    const showLogo = Boolean(input.logo) && input.logoSize > 0;
    const url = exportLinkUrl(input.link);
    // 印出来的是他填的原文而不是验形后的 href：他写 edu.example.com 就该看见 edu.example.com，
    // 而不是被补成 https://edu.example.com/ 这种他没写过的样子。
    const text = input.text || (url ? input.link.trim() : '');

    if (!input.enabled || (!text && !showLogo)) return null;

    const line = host.createDiv({ cls });

    Object.assign(line.style, {
        display: 'flex',
        alignItems: 'center',
        // 用 em 而不是 px：这一行的字号随主题与用户选的阅读字体走，
        // 图字之间那点空得跟着走，写死 px 会让换过字体的人看见图贴着字
        gap: '0.55em',
        justifyContent: JUSTIFY[input.align],
    });

    if (input.color) line.style.color = input.color;

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

    if (text) {
        const span = line.createSpan({ text });

        // 下划线**只在 PDF 下画**：那条线的含义是「这里可以点」，
        // 而在 PNG 里那句话是假的——一张位图上没有「点」这回事。
        // 于是切换格式时下划线跟着出现或消失，用户一眼就知道这一版能不能点，
        // 不必等导出完看提示。没有任何视觉提示的可点区域等于不存在：没人会去点它。
        if (url && input.format === 'pdf') {
            span.style.textDecoration = 'underline';
            span.style.textUnderlineOffset = '0.22em';
        }
    }

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

    if (!style.watermarkEnabled || (!text && !showLogo)) return;

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
        // 用户挑了色就用他的；没挑（空串）才跟随正文色。
        // 默认必须是后者：「跟随主题」在明暗两套配色下各自成立，
        // 而任何一个写死的色号只在其中一套里成立。标志自带颜色，不受这条影响。
        color: style.watermarkColor || computed.color || '#6b7280',
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

/**
 * 页眉与页脚各自指向哪儿、那块可点区域在纸上的什么位置。
 *
 * 量的是**那一行里真正有墨的部分**（标志与文字的并集），不是整行的盒子：
 * 一行 flex 是块级的，它的盒子横跨整张纸宽，把它整块变成链接，
 * 用户点在标题右边八厘米的空白上也会跳转——那不是他以为自己点到的东西。
 *
 * 坐标走 offsetLeft/offsetTop 链而不是 getBoundingClientRect：后者会把祖先身上的
 * transform 一并算进去，而预览正是靠 transform 缩放的。用布局值，量到的就永远是纸自己的坐标。
 */
export function linkRegions(article: HTMLElement, style: ExportStyle): LinkRegion[] {
    const regions: LinkRegion[] = [];
    const frame = frameOf(article);
    // 关着的那一段不会有元素，因此这里不必再判一次开关——
    // querySelector 找不到就自然没有可点区域，两处判断只留一处。
    const collect = (selector: string, raw: string): void => {
        const url = exportLinkUrl(raw);

        if (!url) return;

        const line = article.querySelector<HTMLElement>(selector);

        // 量的是这一行里**有墨的那几段**（标志与文字），不是整条 flex 行：
        // 那一行横跨整个正文栏，整条可点意味着用户点在页脚左边一片空白上也会跳走。
        for (const child of line?.children ?? []) {
            if (child instanceof HTMLElement) pushRects(regions, url, child, frame);
        }
    };

    collect('.ziminos-export-header', style.headerLink);
    collect('.ziminos-export-footer', style.footerLink);

    // 正文里本来就有的链接同样该能点。
    // 「导出成 PDF 之后所有外链变成死字」是个不该由用户承担的退化——
    // 那些链接是他写进笔记里的，图片留不住它们，而 PDF 留得住。
    for (const anchor of article.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        const url = bodyLinkUrl(anchor);

        if (url) pushRects(regions, url, anchor, frame);
    }

    return regions;
}

/**
 * 纸的原点与缩放，量一次给所有可点区域共用。
 *
 * 预览里这张纸是被 transform 缩过的，客户端矩形会一并带上那个比例。
 * 拿「画出来多宽 ÷ 布局上多宽」把它除回去，于是缩放与不缩放时给出同一组坐标。
 */
interface LinkFrame {
    readonly left: number;
    readonly top: number;
    readonly scale: number;
}

function frameOf(article: HTMLElement): LinkFrame {
    const base = article.getBoundingClientRect();

    return {
        left: base.left,
        top: base.top,
        scale: base.width > 0 && article.offsetWidth > 0 ? base.width / article.offsetWidth : 1,
    };
}

/**
 * 一个元素占的可点区域，坐标以纸的左上角为原点。
 *
 * **全库只有这一处算这件事**，而这正是 v0.32.0 修掉的那个 bug 的形状：
 * 此前页眉页脚走 `offsetTop` 逐级累加、正文走客户端矩形，两套算法算同一件事。
 * `offsetTop` 那套错在一个看不见的前提上——它量的是「离最近那个**定位祖先**多远」，
 * 而页眉页脚那一行只设了 display:flex、没有 position，于是它子元素的 offsetTop
 * 量的是离正文栏顶端多远，再加上行自己的 y 就把同一段距离算了两遍。
 * 页眉在 y≈0，算两遍还是 0，看不出来；页脚在 y≈1240，一加就落到纸外面，整条链接失效。
 * 所以修法不是给那一行补一个 position——那是让几何依赖一条为别的目的写下的 CSS；
 * 是把两套合成一套，让「页眉的链接能点」与「正文的链接能点」从此是同一件事的两次调用。
 *
 * 用 `getClientRects()` 而不是一个整的包围盒：一条横跨两行的链接，包围盒会把中间那段
 * 与它无关的空白也圈进去，用户点在两行之间的缝隙上也会跳转。逐行取矩形才对得上他看见的下划线。
 */
function pushRects(out: LinkRegion[], url: string, element: HTMLElement, frame: LinkFrame): void {
    for (const rect of element.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;

        out.push({
            url,
            x: (rect.left - frame.left) / frame.scale,
            y: (rect.top - frame.top) / frame.scale,
            width: rect.width / frame.scale,
            height: rect.height / frame.scale,
        });
    }
}

/**
 * 正文里这个 `<a>` 该不该变成 PDF 里的一个动作。
 *
 * 它**刻意不与页眉页脚共用 `exportLinkUrl`**，因为「没写协议」这四个字在两种输入里
 * 意思正好相反：设置里那个输入框写着 `edu.zhaozimin.cn`，意思是「他省略了 https://」；
 * 而 DOM 里一个没有协议的 href，意思是「这根本不是一条外链」——库内双链、标签、脚注
 * 跳转全长这样。把补协议那条规则套到 href 上，`[[MOC数据库代码]]` 就会变成
 * `https://moc数据库代码/`，用户拿到的 PDF 里多出几个指向不存在域名的链接，
 * 而且点下去之前没有任何迹象。这不是少了一条判断，是一条规则被用到了它不成立的地方。
 */
function bodyLinkUrl(anchor: HTMLAnchorElement): string {
    const raw = (anchor.getAttribute('href') ?? '').trim();

    // 已经带 http/https 的才往下走；其余（app://、obsidian://、#标签、库内相对路径）
    // 在 Obsidian 之外都没有意义，交给 exportLinkUrl 的协议白名单再滤一道
    return /^https?:\/\//i.test(raw) ? exportLinkUrl(raw) : '';
}
