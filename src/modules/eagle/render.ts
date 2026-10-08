/**
 * [INPUT]: 依赖 obsidian 公开 Markdown 后处理器、CodeMirror 扩展注册、弹出窗口事件与 Menu/Notice，依赖本模块 platform 的桌面闸门、editor 的编辑器适配与 EagleBridgeClient 临时媒体会话/打开项目
 * [OUTPUT]: 对外提供 registerEagleRenderer，返回可在重新配对后重试渲染的 refresh 函数
 * [POS]: Eagle 模块的呈现边界。Markdown 始终保留稳定语义链接；图片与视频只在 DOM 层领取单附件临时票据，
 *        浏览器按 Range 直连伴侣，绝不让 Obsidian 主进程缓冲整段视频；节点离开即撤销票据，不触碰普通媒体
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
    'video[data-ziminos-eagle-uri]',
    'a[href^="ziminos-eagle://"]',
    '[data-href^="ziminos-eagle://"]',
].join(',');

export function registerEagleRenderer(
    ctx: ZiminosContext,
    client: EagleBridgeClient,
): () => void {
    if (!isSupportedEagleDesktop()) return () => undefined;

    const observers = new Map<Document, MutationObserver>();
    const mediaSessions = new Map<Element, string>();
    let loadGeneration = 0;
    let disposed = false;

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
            const media = await client.media(reference);

            if (disposed || image.dataset.ziminosEagleLoad !== generation) {
                if (media.sessionId) void client.revokeMedia(media.sessionId).catch(() => undefined);
                return;
            }

            if (media.kind === 'video') {
                const video = image.ownerDocument.createElement('video');

                video.controls = true;
                video.preload = 'metadata';
                video.playsInline = true;
                video.src = media.url;
                video.dataset.ziminosEagleUri = original;
                video.dataset.ziminosEagleState = 'ready';
                video.classList.add('ziminos-eagle-attachment', 'ziminos-eagle-video');
                video.title = '可直接播放；按 ⌘/Ctrl + 单击或右键可在 Eagle 中打开';
                video.setAttribute('aria-label', media.name);
                mediaSessions.set(video, media.sessionId);
                image.replaceWith(video);
                return;
            }

            if (media.kind === 'file') {
                const link = image.ownerDocument.createElement('a');

                link.href = original;
                link.textContent = media.name;
                link.dataset.ziminosEagleUri = original;
                link.title = '点击在 Eagle 中打开';
                image.replaceWith(link);
                return;
            }

            mediaSessions.set(image, media.sessionId);
            image.src = media.url;
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

    const releaseMedia = (element: HTMLImageElement | HTMLVideoElement): void => {
        if (!element.dataset.ziminosEagleUri) return;

        const sessionId = mediaSessions.get(element);

        if (sessionId) {
            mediaSessions.delete(element);
            void client.revokeMedia(sessionId).catch(() => undefined);
        }

        if (element.tagName === 'VIDEO') {
            const video = element as HTMLVideoElement;

            video.pause();
            video.removeAttribute('src');
            video.load();
        } else {
            element.removeAttribute('src');
        }
        element.dataset.ziminosEagleState = '';
        delete element.dataset.ziminosEagleLoad;
    };

    const release = (root: ParentNode): void => {
        const element = root as Element;

        if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
            releaseMedia(element as HTMLImageElement | HTMLVideoElement);
        }
        for (const media of root.querySelectorAll<HTMLImageElement | HTMLVideoElement>(
            'img[data-ziminos-eagle-uri], video[data-ziminos-eagle-uri]',
        )) releaseMedia(media);
    };

    const observe = (doc: Document): void => {
        if (observers.has(doc) || !doc.body) return;

        const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
        const observer = new Observer((records) => {
            for (const record of records) {
                for (const node of record.removedNodes) {
                    if (node.nodeType === 1) release(node as Element);
                }
            }
            // 同一批变更可能先报告插入、再报告旧父节点移除；统一先释放，避免复用图片最后被清空。
            for (const record of records) {
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
        const target = event.target as Element | null;

        // 视频普通单击属于播放器控制；修饰键单击和右键仍交给 Eagle。
        if (target?.closest?.('video[data-ziminos-eagle-uri]') && !event.metaKey && !event.ctrlKey) return;
        // 编辑器里的单击必须留给放置光标；已渲染出身份属性时，在捕获阶段先于通用外链处理精确打开。
        if (target?.closest?.('.cm-editor') && !event.metaKey && !event.ctrlKey) return;

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
        // 弹出窗口关闭后它的 DOM 不再产生 removedNodes；必须在解绑时主动撤销该窗口的媒体票据。
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
        for (const media of [...mediaSessions.keys()]) releaseMedia(media as HTMLImageElement | HTMLVideoElement);
        mediaSessions.clear();
    });

    return () => {
        // 配对成功后只重试失败节点；已成功的临时媒体会话不重复领取
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
