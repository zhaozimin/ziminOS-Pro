/**
 * [INPUT]: 依赖 obsidian 的 MarkdownRenderChild 与 MarkdownPostProcessorContext；
 *          依赖 ./constants 的 VIEW_BLOCK_LANG/VIEW_REFRESH_DEBOUNCE_MS、./vaultIndex 的 VaultIndex、
 *          ./table 的 renderEmpty/renderNote、./types 的 ZiminosContext
 * [OUTPUT]: 对外提供视图契约 ViewContext/ViewRenderer/ViewDefinition 与装配入口 registerViewCodeBlock
 * [POS]: 视图引擎的宿主。它把「学员在笔记里写下的一个代码块」翻译成「一次视图渲染」，
 *        并负责这次渲染的全部生命周期：解析块内容、查表分发、失败兜底、变更后重算。
 *        它不认识任何一个具体视图——视图清单由 main.ts 在装配时递进来，
 *        因此新增一个视图不需要改动本文件（OCP）。
 *        重算策略是本文件最关键的设计：变更事件只递增索引修订号并排一次防抖，
 *        到点后由宿主统一重算全部在场的块。这样既不轮询（红线），
 *        也不会出现「块比索引先醒来、拿着上一版数据重画一遍」的竞态——
 *        失效与重算由同一个入口先后执行，顺序不依赖事件注册的先后
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownRenderChild, TFile } from 'obsidian';
import type { MarkdownPostProcessorContext } from 'obsidian';
import { VIEW_BLOCK_LANG, VIEW_REFRESH_DEBOUNCE_MS } from './constants';
import { renderEmpty, renderNote } from './table';
import type { ZiminosContext } from './types';
import { VaultIndex } from './vaultIndex';

/** 一次视图渲染能拿到的全部能力 */
export interface ViewContext {
    /** 渲染目标，进入渲染函数时已经清空 */
    readonly el: HTMLElement;
    /** 宿主笔记路径。视图靠它知道「我长在谁身上」，档案类视图的全部语义都由此展开 */
    readonly sourcePath: string;
    /**
     * 宿主笔记本身。极少数情形下取不到（笔记正在被删、或块渲染在非笔记语境里），
     * 故是可空的——档案类视图必须先判空再展开，那正是它们语义成立的前提。
     */
    readonly host: TFile | null;
    /** 代码块里写的参数，键值都已 trim */
    readonly params: Readonly<Record<string, string>>;
    readonly index: VaultIndex;
    readonly ctx: ZiminosContext;
}

/** 视图渲染函数：把内容画进 view.el，不返回任何东西 */
export type ViewRenderer = (view: ViewContext) => Promise<void>;

/** 一个视图的定义：学员写的名字 + 怎么画 */
export interface ViewDefinition {
    /** 代码块首行写的名字，中文，学员读得懂 */
    readonly name: string;
    readonly render: ViewRenderer;
}

/** 代码块解析结果 */
interface ViewRequest {
    readonly name: string;
    readonly params: Record<string, string>;
}

/**
 * 装配视图引擎。
 *
 * 只注册一个代码块语言：视图名写在块的第一行而不是语言标记上，
 * 否则学员的笔记里会出现二十种代码块语言，而每加一个视图都要改这里。
 */
export function registerViewCodeBlock(ctx: ZiminosContext, views: readonly ViewDefinition[]): void {
    const host = new ViewHost(ctx, views);

    // 三类事件都要失效：改内容走 metadataCache，删与改名不走它但同样让反链表过期
    ctx.plugin.registerEvent(ctx.app.metadataCache.on('changed', () => host.notifyChanged()));
    ctx.plugin.registerEvent(ctx.app.vault.on('delete', () => host.notifyChanged()));
    ctx.plugin.registerEvent(ctx.app.vault.on('rename', () => host.notifyChanged()));
    ctx.plugin.register(() => host.dispose());

    ctx.plugin.registerMarkdownCodeBlockProcessor(
        VIEW_BLOCK_LANG,
        (source: string, el: HTMLElement, blockCtx: MarkdownPostProcessorContext) => {
            blockCtx.addChild(new ViewBlock(el, host, parseBlock(source), blockCtx.sourcePath));
        },
    );
}

// ============================================================
// 宿主
// ============================================================

/**
 * 全插件唯一的视图宿主：持有索引、视图清单、在场的块，以及那唯一一个防抖句柄。
 * 「一个索引、一次失效、一次重算」是它存在的全部理由——
 * 若让每个块各自失效各自重算，一页十个视图就会把全库反链表重建十遍。
 */
class ViewHost {
    readonly index: VaultIndex;

    readonly registry: ReadonlyMap<string, ViewDefinition>;

    readonly names: readonly string[];

    private readonly ctx: ZiminosContext;

    private readonly blocks = new Set<ViewBlock>();

    private timer: number | null = null;

    constructor(ctx: ZiminosContext, views: readonly ViewDefinition[]) {
        this.ctx = ctx;
        this.index = new VaultIndex(ctx.app);
        this.registry = new Map(views.map((view) => [view.name, view]));
        this.names = views.map((view) => view.name);
    }

    contextFor(el: HTMLElement, sourcePath: string, params: Record<string, string>): ViewContext {
        const found = this.ctx.app.vault.getAbstractFileByPath(sourcePath);

        return {
            el,
            sourcePath,
            host: found instanceof TFile ? found : null,
            params,
            index: this.index,
            ctx: this.ctx,
        };
    }

    attach(block: ViewBlock): void {
        this.blocks.add(block);
    }

    detach(block: ViewBlock): void {
        this.blocks.delete(block);
    }

    /**
     * 内容变了。
     * 事件回调本身必须是 O(1)——它在每一次击键的落盘上都会被叫到，
     * 因此这里只递增修订号并排一次防抖，真正的重建推迟到有人来问的时候。
     */
    notifyChanged(): void {
        this.index.invalidate();

        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = window.setTimeout(() => {
            this.timer = null;

            for (const block of this.blocks) void block.render();
        }, VIEW_REFRESH_DEBOUNCE_MS);
    }

    dispose(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = null;
        this.blocks.clear();
    }
}

// ============================================================
// 单个块
// ============================================================

/**
 * 一个视图代码块的生命周期载体。
 * 交给 Obsidian 的 addChild 托管：笔记关掉、切走、重渲，它自己会卸载，
 * 我们只需在卸载时把自己从在场名单里摘掉，不必手写任何监听解绑。
 */
class ViewBlock extends MarkdownRenderChild {
    private readonly host: ViewHost;

    private readonly request: ViewRequest;

    private readonly sourcePath: string;

    /** 每次重画递增；异步返回时只有最新一代有权提交 DOM */
    private renderGeneration = 0;

    /** 卸载后的异步结果必须丢弃，不能再碰已经离场的容器 */
    private loaded = false;

    constructor(el: HTMLElement, host: ViewHost, request: ViewRequest, sourcePath: string) {
        super(el);
        this.host = host;
        this.request = request;
        this.sourcePath = sourcePath;
    }

    onload(): void {
        this.loaded = true;
        this.host.attach(this);
        void this.render();
    }

    onunload(): void {
        this.loaded = false;
        this.renderGeneration += 1;
        this.host.detach(this);
    }

    /**
     * 重画一次。
     * 三条兜底缺一不可：块里没写名字、名字不认识、视图自己抛错——
     * 任何一种都必须画出一句中文说明，绝不能留一个空白块让学员以为系统坏了。
     */
    async render(): Promise<void> {
        const generation = ++this.renderGeneration;
        const output = document.createElement('div');

        if (!this.request.name) {
            renderEmpty(output, '这个 ziminos 代码块没写视图名。第一行写视图名即可，例如「人脉名录」。');
            this.commit(output, generation);

            return;
        }

        const definition = this.host.registry.get(this.request.name);

        if (!definition) {
            renderEmpty(output, `没有名为「${this.request.name}」的视图。`);
            renderNote(output, `可用视图：${this.host.names.join(' · ')}`);
            this.commit(output, generation);

            return;
        }

        try {
            await definition.render(
                this.host.contextFor(output, this.sourcePath, this.request.params),
            );
            this.commit(output, generation);
        } catch (error) {
            if (!this.loaded || generation !== this.renderGeneration) return;

            const message = error instanceof Error ? error.message : String(error);

            output.empty();
            renderEmpty(output, `视图「${this.request.name}」渲染失败：${message}`);
            this.commit(output, generation);
        }
    }

    /** 将离屏结果一次性换上去；旧代与卸载后的结果在这里无声作废 */
    private commit(output: HTMLElement, generation: number): void {
        if (!this.loaded || generation !== this.renderGeneration) return;

        this.containerEl.empty();

        while (output.firstChild) this.containerEl.appendChild(output.firstChild);
    }
}

// ============================================================
// 解析
// ============================================================

/**
 * 解析代码块内容：第一行非空内容是视图名，其后每行一个「键: 值」。
 * 冒号全角半角都认——中文输入法下打出的是全角，而学员不该为此被系统拒绝。
 */
function parseBlock(source: string): ViewRequest {
    const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
    const params: Record<string, string> = {};

    for (const line of lines.slice(1)) {
        const separator = line.search(/[:：]/);

        if (separator <= 0) continue;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();

        if (key) params[key] = value;
    }

    return { name: lines[0] ?? '', params };
}
