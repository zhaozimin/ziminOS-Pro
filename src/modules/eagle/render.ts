/**
 * [INPUT]: 依赖 obsidian 公开 Markdown 后处理器、CodeMirror 扩展注册、弹出窗口事件与 Menu/Notice，依赖本模块 platform 的桌面闸门、editor 的编辑器适配与 EagleBridgeClient 取内容/打开项目
 * [OUTPUT]: 对外提供 registerEagleRenderer，返回可在重新配对后重试渲染的 refresh 函数
 * [POS]: Eagle 模块的呈现边界。Markdown 始终保留稳定语义链接，阅读视图/实时预览只在 DOM 层换成临时 blob URL；
 *        blob 随插件卸载统一撤销，绝不把 Eagle 真实路径或认证令牌泄漏进笔记与 DOM 属性
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Menu, Notice } from 'obsidian';
import type { ZiminosContext } from '../../core/types';
import type { EagleBridgeClient } from './client';
import { createEagleEditorExtension, eagleReferenceFromTarget } from './editor';
import { isSupportedEagleDesktop } from './platform';
import { buildEagleUri, parseEagleUri } from './protocol';
import type { EagleReference } from './protocol';

const SELECTOR = [
    'img[src^="ziminos-eagle://"]',
    'img[data-ziminos-eagle-uri]',
    'a[href^="ziminos-eagle://"]',
    '[data-href^="ziminos-eagle://"]',
].join(',');

export function registerEagleRenderer(
    ctx: ZiminosContext,
    client: EagleBridgeClient,
): () => void {
    if (!isSupportedEagleDesktop()) return () => undefined;

    const observers = new Map<Document, MutationObserver>();
    const objectUrls = new Set<string>();
    const imageUrls = new Map<HTMLImageElement, string>();
    let loadGeneration = 0;
    let disposed = false;

    const objectUrl = async (reference: EagleReference): Promise<string> => {
        const { bytes, contentType } = await client.content(reference);
        const value = URL.createObjectURL(new Blob([bytes], { type: contentType }));

        objectUrls.add(value);

        return value;
    };

    const hydrate = async (element: Element): Promise<void> => {
        if (element.tagName !== 'IMG') return;

        const image = element as HTMLImageElement;
        if (image.dataset.ziminosEagleState === 'loading' || image.dataset.ziminosEagleState === 'ready') return;

        const original = image.dataset.ziminosEagleUri || image.getAttribute('src') || '';
        const reference = parseEagleUri(original);

        if (!reference) return;

        image.dataset.ziminosEagleUri = original;
        image.dataset.ziminosEagleState = 'loading';
        const generation = String(++loadGeneration);
        image.dataset.ziminosEagleLoad = generation;
        image.classList.add('ziminos-eagle-attachment');

        try {
            const url = await objectUrl(reference);

            if (disposed || image.dataset.ziminosEagleLoad !== generation) {
                // 同一节点在请求期间被移除/复用；这份 blob 已没有宿主，立即释放
                URL.revokeObjectURL(url);
                objectUrls.delete(url);
                return;
            }

            imageUrls.set(image, url);
            image.src = url;
            image.dataset.ziminosEagleState = 'ready';
            delete image.dataset.ziminosEagleLoad;
            image.title = '点击在 Eagle 中打开；编辑模式请按 ⌘/Ctrl';
        } catch (error) {
            if (image.dataset.ziminosEagleLoad !== generation) return;
            image.dataset.ziminosEagleState = 'error';
            delete image.dataset.ziminosEagleLoad;
            image.title = `Eagle 附件暂时不可用：${errorMessage(error)}`;
        }
    };

    const scan = (root: ParentNode): void => {
        for (const element of root.querySelectorAll(SELECTOR)) void hydrate(element);
    };

    const releaseImage = (image: HTMLImageElement): void => {
        const url = imageUrls.get(image);

        if (url) {
            imageUrls.delete(image);
            URL.revokeObjectURL(url);
            objectUrls.delete(url);
        }

        // Obsidian 偶尔会把同一 DOM 节点移走再复用；清状态后重新插入时会按身份再水合
        image.removeAttribute('src');
        image.dataset.ziminosEagleState = '';
        delete image.dataset.ziminosEagleLoad;
    };

    const release = (root: ParentNode): void => {
        if ((root as Element).tagName === 'IMG') releaseImage(root as HTMLImageElement);
        for (const image of root.querySelectorAll<HTMLImageElement>('img[data-ziminos-eagle-uri]')) releaseImage(image);
    };

    const observe = (doc: Document): void => {
        if (observers.has(doc) || !doc.body) return;

        const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
        const observer = new Observer((records) => {
            for (const record of records) {
                for (const node of record.removedNodes) {
                    if (node.nodeType === 1) release(node as Element);
                }
                for (const node of record.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    const element = node as Element;
                    if (element.matches(SELECTOR)) void hydrate(element);
                    scan(element);
                }
            }
        });

        observer.observe(doc.body, { childList: true, subtree: true });
        observers.set(doc, observer);
        scan(doc);
    };

    const openAt = (event: MouseEvent): void => {
        // 编辑器里的单击必须留给放置光标；已渲染出身份属性时，在捕获阶段先于通用外链处理精确打开。
        if ((event.target as Element | null)?.closest?.('.cm-editor') && !event.metaKey && !event.ctrlKey) return;

        const reference = eagleReferenceFromTarget(event.target);

        if (!reference) return;

        event.preventDefault();
        event.stopPropagation();
        void client.open(reference).catch((error) => {
            new Notice(`无法在 Eagle 中打开：${errorMessage(error)}`, 8000);
        });
    };

    const menuAt = (event: MouseEvent): void => {
        const reference = eagleReferenceFromTarget(event.target);

        if (!reference) return;

        event.preventDefault();
        event.stopPropagation();

        const menu = new Menu();

        menu.addItem((item) => item
            .setTitle('在 Eagle 中打开')
            .setIcon('external-link')
            .onClick(() => void client.open(reference).catch((error) => {
                new Notice(`无法在 Eagle 中打开：${errorMessage(error)}`, 8000);
            })));
        menu.addItem((item) => item
            .setTitle('复制 Eagle 身份链接')
            .setIcon('copy')
            .onClick(() => void navigator.clipboard.writeText(buildEagleUri(reference)).catch(() => {
                new Notice('复制 Eagle 身份链接失败，请检查系统剪贴板权限。');
            })));
        menu.showAtMouseEvent(event);
    };

    const bindDocument = (doc: Document): void => {
        observe(doc);
        doc.addEventListener('click', openAt, true);
        doc.addEventListener('contextmenu', menuAt, true);
    };

    const unbindDocument = (doc: Document): void => {
        // 弹出窗口关闭后它的 DOM 不再产生 removedNodes；必须在解绑时主动收掉该窗口的 blob。
        release(doc);
        observers.get(doc)?.disconnect();
        observers.delete(doc);
        doc.removeEventListener('click', openAt, true);
        doc.removeEventListener('contextmenu', menuAt, true);
    };

    bindDocument(ctx.app.workspace.containerEl.ownerDocument);
    ctx.plugin.registerEditorExtension(createEagleEditorExtension(client));
    ctx.plugin.registerMarkdownPostProcessor((element) => scan(element));
    ctx.plugin.registerEvent(ctx.app.workspace.on('window-open', (workspaceWindow) => bindDocument(workspaceWindow.doc)));
    ctx.plugin.registerEvent(ctx.app.workspace.on('window-close', (workspaceWindow) => unbindDocument(workspaceWindow.doc)));
    ctx.plugin.register(() => {
        disposed = true;
        for (const doc of observers.keys()) unbindDocument(doc);
        for (const image of [...imageUrls.keys()]) releaseImage(image);
        for (const url of objectUrls) URL.revokeObjectURL(url);
        objectUrls.clear();
    });

    return () => {
        // 配对成功后只重试之前失败的节点；已成功的 blob 不重复下载
        for (const doc of observers.keys()) {
            for (const element of doc.querySelectorAll<HTMLImageElement>('img[data-ziminos-eagle-state="error"]')) {
                element.dataset.ziminosEagleState = '';
                element.src = element.dataset.ziminosEagleUri || element.src;
            }
            scan(doc);
        }
    };
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
