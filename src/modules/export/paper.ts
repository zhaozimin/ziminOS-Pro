/**
 * [INPUT]: 依赖 obsidian 的 Component/MarkdownRenderer/MarkdownView/requestUrl/TFile，
 *          依赖 core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 ExportPaper 契约与 renderPaper——把一篇笔记渲成一张可以被截图的纸
 * [POS]: 导出模块的内容层，只回答「这篇笔记铺开来是什么样、有多大」，不认识页眉页脚水印。
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

const ARTICLE_WIDTH_FALLBACK = 760;
const ARTICLE_WIDTH_MIN = 480;
const ARTICLE_WIDTH_MAX = 1_600;
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
    const desiredWidth = articleWidthOf(ctx, file);

    component.load();
    parkStage(stage);
    styleArticle(article, content, desiredWidth);

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

    // 宽表格与长代码行可以真实撑宽文章；再按 scrollWidth 回填一次，随后重算最终高度。
    const naturalWidth = Math.ceil(Math.max(desiredWidth, article.scrollWidth));

    article.style.width = `${naturalWidth}px`;
    content.style.width = `${naturalWidth}px`;
    await waitForStableLayout(article);

    return {
        article,
        mount: (host, scale) => {
            host.appendChild(stage);
            Object.assign(stage.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                zIndex: 'auto',
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

/** 舞台不被预览借走时停在屏幕外：看不见、不挡事、不参与任何命中测试 */
function parkStage(stage: HTMLElement): void {
    Object.assign(stage.style, {
        position: 'fixed',
        left: '-100000px',
        top: '0',
        width: 'max-content',
        height: 'max-content',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: '-1',
        transform: 'none',
    });
}

/** 从当前笔记实际显示宽度取数；源码/阅读两态都探不到时才回落 760px */
function articleWidthOf(ctx: ZiminosContext, file: TFile): number {
    const view = ctx.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view || view.file?.path !== file.path) return ARTICLE_WIDTH_FALLBACK;

    const element = view.contentEl.querySelector<HTMLElement>('.markdown-preview-sizer, .cm-sizer');
    const measured = element?.getBoundingClientRect().width ?? 0;

    return Math.round(
        Math.min(ARTICLE_WIDTH_MAX, Math.max(ARTICLE_WIDTH_MIN, measured || ARTICLE_WIDTH_FALLBACK)),
    );
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
