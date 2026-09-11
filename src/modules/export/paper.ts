/**
 * [INPUT]: 依赖 obsidian 的 Component/MarkdownRenderer/MarkdownView/requestUrl/TFile，
 *          依赖 core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 ExportPaper 契约与 renderPaper——把一篇笔记渲成一张可以被截图的纸
 * [POS]: 导出模块的内容层，只回答「这篇笔记铺开来是什么样、有多大」，不认识页眉页脚水印。
 *        它的版面口径全部**量自用户此刻那个编辑区**（宽度、左右留白、字号、行高），一个数都不是这里定的——
 *        发明尺寸就是在替用户排版，而那件事他已经在 Obsidian 的设置里回答过一次了。
 *        它与 decorate.ts 分家是整个预览功能的根：内容渲染昂贵且只该发生一次
 *        （解析 Markdown、内联远端图、等字体与版面稳定），装饰廉价却要在每一次拖动滑块时重来。
 *        两者原本焊在一个函数里，于是「实时」只能靠整篇重渲染，而那是卡顿的另一个名字。
 *        纸默认停在离屏舞台上；预览借走时只是把舞台挪进弹窗并缩放，被截图的始终是同一个元素——
 *        预览因此不是导出的仿真，而就是导出物本身，两者不可能各说各话
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Component, MarkdownRenderer, MarkdownView, requestUrl, TFile } from 'obsidian';
import type { ZiminosContext } from '../../core/types';

/** 一张已经渲好、随时可以被装饰与截图的纸 */
export interface ExportPaper {
    /** 真正被 dom-to-image 拍下来的那一个元素 */
    readonly article: HTMLElement;
    /** 交给预览：把舞台挪进宿主并按 scale 缩放 */
    mount(host: HTMLElement, scale: number): void;
    /** 收回离屏。预览关掉、或准备截图之前调用——祖先带 transform 的元素不该被拍 */
    unmount(): void;
    /** 此刻的真实尺寸。高度随页眉页脚的留白变化，所以每次装饰之后都要重新问一遍 */
    measure(): { readonly width: number; readonly height: number };
    release(): void;
}

/**
 * 一张纸的版面口径，全部**量自用户此刻那个编辑区**，一个数都不是这里定的。
 *
 * 这层东西以前是三个常量（760 / 480 / 1600）加一句写死的 `padding: 48px 56px`，
 * 于是导出的纸与屏幕上那一篇宽窄不同、字号也可能不同。用户的判决很直接：
 * 按编辑区原来的字体大小与宽度，不许自己加宽。**发明尺寸就是在替用户排版**，
 * 而排版这件事他已经在 Obsidian 的设置里回答过一次了。
 */
interface PaperMetrics {
    /** 纸面宽（含左右内边距），取自那个 sizer 的 border-box */
    readonly width: number;
    readonly paddingLeft: number;
    readonly paddingRight: number;
    readonly paddingY: number;
    /** 空串＝不覆盖，让主题自己说了算 */
    readonly fontSize: string;
    readonly fontFamily: string;
    readonly lineHeight: string;
}

/**
 * 正文栏那一个元素，按这个顺序找。
 *
 * 阅读态是 `.markdown-preview-sizer`；编辑态**必须是 `.cm-content`**，不能是 `.cm-sizer`——
 * 后者是整个编辑器那一栏，左右内边距为 0，量它会得到「纸和编辑器一样宽、正文顶到纸边」，
 * 也正是 v0.25.0 里文字被挤出显示范围的原因。`.cm-content` 才是行真正落脚的盒子，
 * 它的内边距就是 Obsidian 的 `--file-margins`。
 */
const COLUMN_SELECTORS = ['.markdown-preview-sizer', '.cm-content', '.cm-sizer'] as const;

/**
 * 纸的最小页边。
 *
 * 留白优先取真实值，但**不能取到 0**：量到的那个元素未必自己带边距（编辑态常常不带），
 * 而一张文字顶着边框的纸不是排版紧凑，是排版坏了。所以这不是「发明尺寸」的回潮——
 * 它回答的是另一个问题：纸总得有边。
 */
const MIN_PAGE_MARGIN = 48;

/** 只有在连编辑区都探不到时才用的兜底：它是「没有事实可依」时的最后一手，不是默认版面 */
const FALLBACK_METRICS: PaperMetrics = {
    width: 760,
    paddingLeft: 56,
    paddingRight: 56,
    paddingY: 48,
    fontSize: '',
    fontFamily: '',
    lineHeight: '',
};

const IMAGE_TIMEOUT_MS = 6_000;
const LAYOUT_TIMEOUT_MS = 3_000;

/**
 * 用 MarkdownRenderer 重新渲染，而不是截当前可见区域：用户停在源码模式、滚到文章中段，
 * 或视图容器启用了虚拟滚动时，导出仍然必须从标题到最后一行完整一致。
 */
export async function renderPaper(ctx: ZiminosContext, file: TFile): Promise<ExportPaper> {
    const component = new Component();
    const stage = document.body.createDiv({ cls: 'ziminos-export-stage' });
    const article = stage.createDiv({
        cls: 'markdown-preview-view markdown-rendered ziminos-export-article',
    });
    const content = article.createDiv({ cls: 'markdown-preview-sizer' });
    const metrics = measureSource(ctx, file);

    component.load();
    parkStage(stage);
    styleArticle(article, content, metrics);

    content.createDiv({ cls: 'inline-title', text: file.basename });

    const markdown = content.createDiv({ cls: 'ziminos-export-markdown' });

    await MarkdownRenderer.render(
        ctx.app,
        await ctx.app.vault.cachedRead(file),
        markdown,
        file.path,
        component,
    );

    await inlineImages(markdown);
    await document.fonts?.ready;
    await waitForStableLayout(article);

    // 这里**刻意不再**按 scrollWidth 把纸加宽。
    // 旧版遇到宽表格或长代码行时会把整张纸撑开，好处是一个字都不丢，
    // 代价是导出的图比屏幕上那一篇宽——而用户要的正是「跟编辑区一样宽」。
    // 于是超宽内容与它在 Obsidian 里的样子一致：留在自己那个横向滚动的盒子里，
    // 到列宽为止。这是一次有意的取舍，不是遗漏。

    return {
        article,
        mount: (host, scale) => {
            host.appendChild(stage);
            Object.assign(stage.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                zIndex: 'auto',
                // 停靠时它是全透明的（见 parkStage），借给预览就得把这层隐藏收回来
                opacity: '1',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            });
        },
        unmount: () => {
            document.body.appendChild(stage);
            parkStage(stage);
        },
        measure: () => ({
            width: Math.ceil(Math.max(1, article.scrollWidth)),
            height: Math.ceil(Math.max(1, article.scrollHeight)),
        }),
        release: () => {
            component.unload();
            stage.remove();
        },
    };
}

/**
 * 舞台不被预览借走时停在哪儿：**屏幕左上角，完全透明、不吃鼠标、压在所有内容之下**。
 *
 * v0.25.0 之前它停在 `left: -100000px`。那个位置的代价是看不见的：
 * Obsidian Bases 这类视图按「进没进视口」决定要不要把单元格画出来，
 * 而一张停在十万像素之外的纸永远不进视口——于是导出的图里表格有行、有「4 个结果」，
 * 单元格却是空的。挪回视口之内、靠透明度隐藏，那类懒渲染才会真的发生。
 *
 * 透明度写在舞台上而不是纸上：被拍的是纸，dom-to-image 读的是**它自己**的计算样式，
 * 祖先的 opacity 不参与，因此这层隐藏不会把导出的图一起变透明。
 */
function parkStage(stage: HTMLElement): void {
    Object.assign(stage.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        opacity: '0',
        width: 'max-content',
        height: 'max-content',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: '-1',
        transform: 'none',
    });
}

/**
 * 量当前这篇笔记正显示成什么样：多宽、左右留多少、字多大。
 *
 * 阅读态量 `.markdown-preview-sizer`，编辑态量 `.cm-sizer`——两者都是「正文那一栏连同它的留白」，
 * 也正是 Obsidian 把「可读行宽」这个设置作用上去的那个元素。因此这里既不夹取也不取整成好看的数：
 * 用户把行宽调到 612px，导出的纸就是 612px。
 *
 * 探不到（笔记没开着、或那两个类名都不在）才回落 FALLBACK_METRICS，并且如实回落整套，
 * 不做「宽度用量到的、内边距用写死的」这种一半一半——那会拼出一个哪儿都不存在的版面。
 */
function measureSource(ctx: ZiminosContext, file: TFile): PaperMetrics {
    const view = ctx.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view || view.file?.path !== file.path) return FALLBACK_METRICS;

    // 按顺序找而不是交给一条并列选择器：querySelector 返回的是**文档顺序**里的第一个，
    // 两种视图同时在场时谁先谁后并无保证，而这两者量出来的东西差着一整条编辑器的宽度。
    const element = COLUMN_SELECTORS
        .map((selector) => view.contentEl.querySelector<HTMLElement>(selector))
        .find((found): found is HTMLElement => found !== null);

    if (!element) return FALLBACK_METRICS;

    const box = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    const width = Math.round(box.width);

    if (!Number.isFinite(width) || width < 1) return FALLBACK_METRICS;

    const paddingLeft = Math.max(MIN_PAGE_MARGIN, pixels(computed.paddingLeft));
    const paddingRight = Math.max(MIN_PAGE_MARGIN, pixels(computed.paddingRight));
    const paddingTop = pixels(computed.paddingTop);

    return {
        width,
        paddingLeft,
        paddingRight,
        // 上下留白取真实值；真实值是 0 时跟左右一样宽——
        // 那不是发明，是「这一栏的留白就这么宽」在另一个方向上的同一句话。
        paddingY: Math.max(MIN_PAGE_MARGIN, paddingTop > 0 ? paddingTop : Math.max(paddingLeft, paddingRight)),
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        lineHeight: computed.lineHeight,
    };
}

function pixels(value: string): number {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function styleArticle(article: HTMLElement, content: HTMLElement, metrics: PaperMetrics): void {
    Object.assign(article.style, {
        boxSizing: 'border-box',
        position: 'relative',
        width: `${metrics.width}px`,
        minHeight: '1px',
        height: 'auto',
        overflow: 'visible',
        color: 'var(--text-normal)',
        background: 'var(--background-primary)',
    });

    // 字号与字体照抄编辑区。理论上主题变量会自己传下来，但这张纸挂在 body 上而不是
    // 工作区叶子里，主题那些以容器打头的选择器未必够得着它——抄一遍是这件事唯一确定的做法。
    if (metrics.fontSize) article.style.fontSize = metrics.fontSize;
    if (metrics.fontFamily) article.style.fontFamily = metrics.fontFamily;
    if (metrics.lineHeight) article.style.lineHeight = metrics.lineHeight;

    Object.assign(content.style, {
        boxSizing: 'border-box',
        position: 'relative',
        width: `${metrics.width}px`,
        maxWidth: 'none',
        minHeight: '1px',
        padding: `${metrics.paddingY}px ${metrics.paddingRight}px ${metrics.paddingY}px ${metrics.paddingLeft}px`,
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
