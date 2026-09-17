/**
 * [INPUT]: 依赖 obsidian 的 Modal/Notice/TFile，依赖 core/exportStyle 的契约与默认值、
 *          core/modals 的 ChoiceModal 选图；依赖 ./paper 的 ExportPaper、./panel 的控件列、
 *          ./decorate 的 applyDecorations、./logo 与 ./logoImport 的标志解析与导入、./layout 的尺寸纯函数
 * [OUTPUT]: 对外提供 ExportPreviewModal，调用方 openAndGetValue 一次取得整套导出风格
 * [POS]: 导出模块的**骨架**：纸怎么缩放着摆进左边、状态怎么存、什么时候关窗、标志从哪儿来。
 *        右边那一列控件长什么样归 ./panel（v0.30.0 分出去，判据与 settings/settingsPanels 同源：
 *        变更理由不同，触发点是那条 ≤800 行）。
 *
 *        每一次改动只重放装饰、不碰内容，因此「实时」不是靠节流硬撑出来的；
 *        三步的先后不能换——明暗 → 尺寸 → 装饰，否则水印会用上一套主题的颜色、
 *        量着上一张纸的高度。Esc、遮罩与取消全部收敛为 null，使「没导出」在调用侧只有一种语义。
 *        关窗即撤销异步回调的写回权；保存框与最终交付共用点击当时的风格快照
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Modal, Notice, TFile } from 'obsidian';
import type { App, ButtonComponent } from 'obsidian';
import { DEFAULT_EXPORT_STYLE } from '../../core/exportStyle';
import type { ExportStyle } from '../../core/exportStyle';
import { ChoiceModal } from '../../core/modals';
import { applyDecorations } from './decorate';
import { captureScale, pageMinHeightOf, pageWidthOf } from './layout';
import type { ExportTemplateContext } from './layout';
import { isLogoFile, resolveLogo } from './logo';
import type { ResolvedLogo } from './logo';
import { canImportLogo, importLogoFromDisk } from './logoImport';
import { buildExportPanel } from './panel';
import type { ExportPaper } from './paper';

/** 预览区左右各留一点余白，纸不贴着框边，缩放比例照这个可用宽度算 */
const VIEWPORT_PADDING = 24;

/**
 * 「用户按下了导出」这件事的接收者。返回 true 才关窗。
 *
 * 它存在的理由是一条顺序：**先问去处，再做图**。导出器在这个回调里弹系统保存框——
 * 那一步是瞬时的，于是点完按钮当场就有反应；若用户在保存框里按了取消，
 * 回调返回 false，预览留在原地等他改主意，而不是先把窗关掉、再让他对着空屏幕等几秒。
 */
type ExportConfirm = (style: ExportStyle) => Promise<boolean>;

export class ExportPreviewModal extends Modal {
    private readonly paper: ExportPaper;
    private readonly initial: ExportStyle;
    private readonly context: ExportTemplateContext;
    private readonly confirm: ExportConfirm;
    private value: ExportStyle;
    private resolver: ((value: ExportStyle | null) => void) | null = null;
    private refreshPanel: (() => void) | null = null;
    private canvasEl: HTMLElement | null = null;
    private viewportEl: HTMLElement | null = null;
    private metaEl: HTMLElement | null = null;
    private observer: ResizeObserver | null = null;
    private frame: number | null = null;
    private logo: ResolvedLogo | null = null;
    /** 解析标志是异步的；只有最后一次请求有权写回结果，否则快速换两张图会画错那一张 */
    private logoToken = 0;
    /** 正在问去处。挡住第二次点击——两个保存框叠在一起谁都说不清是哪一次导出 */
    private asking = false;
    /** 生命周期闸门：系统选图与保存框都可能晚于预览关闭才返回 */
    private active = false;

    constructor(
        app: App,
        paper: ExportPaper,
        initial: ExportStyle,
        context: ExportTemplateContext,
        confirm: ExportConfirm,
    ) {
        super(app);

        this.paper = paper;
        this.initial = initial;
        this.context = context;
        this.value = initial;
        this.confirm = confirm;
    }

    openAndGetValue(): Promise<ExportStyle | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        this.active = true;
        this.value = this.initial;
        this.logo = null;
        this.modalEl.addClass('ziminos-export-modal');
        this.titleEl.setText('导出当前笔记');
        this.contentEl.empty();

        const layout = this.contentEl.createDiv({ cls: 'ziminos-export-layout' });

        this.buildPreview(layout.createDiv({ cls: 'ziminos-export-preview' }));
        this.refreshPanel = buildExportPanel(layout.createDiv({ cls: 'ziminos-export-controls' }), {
            value: () => this.value,
            update: (patch) => this.update(patch),
            logoUrl: () => this.logo?.dataUrl ?? '',
            logoName: () => this.logoStatus(),
            inheritedColor: () => hexOf(getComputedStyle(this.paper.article).color) || '#6b7280',
            pickLogo: () => void this.pickLogo(),
            clearLogo: () => this.update({ logo: '' }),
        });
        this.buildActions();

        this.refreshPanel();
        this.redraw();
        void this.loadLogo();
    }

    onClose(): void {
        this.active = false;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.logoToken += 1;
        this.observer?.disconnect();
        this.observer = null;
        // 纸必须先回到离屏舞台：它在预览里是被 transform 缩过的，
        // 而截图前的那一刻，被拍的元素头上不该压着任何一层缩放。
        this.paper.unmount();
        this.refreshPanel = null;
        this.canvasEl = null;
        this.viewportEl = null;
        this.metaEl = null;
        this.contentEl.empty();
        this.settle(null);
    }

    // ============================================================
    // 预览
    // ============================================================

    private buildPreview(host: HTMLElement): void {
        this.metaEl = host.createDiv({ cls: 'ziminos-export-meta' });
        this.viewportEl = host.createDiv({ cls: 'ziminos-export-viewport' });
        this.canvasEl = this.viewportEl.createDiv({ cls: 'ziminos-export-canvas' });

        // 弹窗会随窗口一起变宽变窄，缩放比例是算出来的而不是写死的，
        // 所以可用宽度一变就得重算——否则纸要么溢出、要么白留半边。
        this.observer = new ResizeObserver(() => this.fitPreview());
        this.observer.observe(this.viewportEl);
    }

    /**
     * 先定明暗、再定尺寸、然后施装饰，最后重算预览缩放——四步的先后不能换。
     *
     * 明暗改的是配色变量，而装饰层要读正文色去定水印颜色；纸宽会让正文重新折行、纸变高，
     * 而水印层要盖满**此刻**这张纸。内容一帧都不重渲：Markdown 早已是 DOM，改宽度只是重排一次。
     */
    private redraw(): void {
        this.paper.setTheme(this.value.theme);
        this.paper.resize(pageWidthOf(this.value), pageMinHeightOf(this.value));
        applyDecorations(this.paper.article, this.value, this.context, this.logo);
        this.fitPreview();
    }

    private schedule(): void {
        if (!this.active || this.frame !== null) return;

        this.frame = requestAnimationFrame(() => {
            this.frame = null;
            this.redraw();
        });
    }

    private fitPreview(): void {
        const viewport = this.viewportEl;
        const canvas = this.canvasEl;

        if (!viewport || !canvas) return;

        const paper = this.paper.measure();
        const available = Math.max(1, viewport.clientWidth - VIEWPORT_PADDING);
        const scale = Math.min(1, available / paper.width);

        this.paper.mount(canvas, scale);
        canvas.style.width = `${Math.ceil(paper.width * scale)}px`;
        canvas.style.height = `${Math.ceil(paper.height * scale)}px`;

        // 把导出清晰度一并报出来：超长文会被主动降采样，那是诚实的退化，
        // 但它必须在导出之前就写在脸上，而不是等用户拿到一张糊图才发现。
        this.metaEl?.setText(
            `纸面 ${paper.width.toLocaleString('zh-CN')} × ${paper.height.toLocaleString('zh-CN')} px` +
            `　·　导出清晰度 ${captureScale(paper.width, paper.height).toFixed(1)}×` +
            `　·　预览 ${Math.round(scale * 100)}%`,
        );
    }

    // ============================================================
    // 标志
    // ============================================================

    /** 三种状态各有各的话：没选过、选了但读不出、读出来了多大 */
    private logoStatus(): string {
        const path = this.value.logo.trim();

        if (!path) return '未选';
        if (!this.logo) return `读不出：${path}`;

        return path;
    }

    /**
     * 选标志只有一枚按钮，平台决定它开哪一种。
     *
     * 桌面端开系统文件框——用户的 logo 本来就在电脑上，逼他先拖进笔记库再回来选一遍，
     * 是把实现细节当成他的工序；选完由插件复制进库，存的仍是库内路径。
     * 手机上没有那个框，就退回库内图片清单（一个封闭集合，走 ChoiceModal 而不是手打路径）。
     */
    private async pickLogo(): Promise<void> {
        if (canImportLogo()) {
            try {
                const path = await importLogoFromDisk(this.app);

                if (!this.active || !path) return;

                this.update({ logo: path });
                new Notice(`标志已放进笔记库：${path}`);
            } catch (error) {
                new Notice(`选图失败：${error instanceof Error ? error.message : String(error)}`);
            }

            return;
        }

        const images = this.app.vault.getFiles().filter((file) => isLogoFile(file));

        if (!images.length) {
            new Notice('笔记库里还没有图片。先把标志放进库里，再回来选。');

            return;
        }

        const picked = await new ChoiceModal<TFile>(this.app, {
            title: '选一张图片当品牌标志',
            items: images,
            labelOf: (file) => file.path,
        }).openAndGetChoice();

        if (picked) this.update({ logo: picked.path });
    }

    /** 读盘是异步的，所以它自己排在预览之外；读完再同步一次控件与画面 */
    private async loadLogo(): Promise<void> {
        const token = ++this.logoToken;
        const resolved = await resolveLogo(this.app, this.value.logo);

        if (token !== this.logoToken) return;

        this.logo = resolved;
        this.refreshPanel?.();
        this.schedule();
    }

    // ============================================================
    // 底部与状态
    // ============================================================

    private buildActions(): void {
        const bar = this.contentEl.createDiv({ cls: 'ziminos-export-actions' });
        const reset = bar.createEl('button', {
            cls: 'ziminos-export-reset',
            text: '↺',
            attr: { type: 'button', title: '恢复默认风格' },
        });
        const cancel = bar.createEl('button', { text: '取消', attr: { type: 'button' } });
        const confirm = bar.createEl('button', { cls: 'mod-cta', text: '导出', attr: { type: 'button' } });

        reset.addEventListener('click', () => this.update(DEFAULT_EXPORT_STYLE));
        cancel.addEventListener('click', () => this.close());
        confirm.addEventListener('click', () => void this.finish(confirm));
    }

    /**
     * 按下导出：先问去处，问到了才关窗。
     *
     * 取消保存框与导出失败在这里是同一种结局——弹窗留着。它们对用户是同一件事：
     * 「这次没导出成」，而他刚调了十分钟的那套风格不该因此消失。
     */
    private async finish(button: HTMLButtonElement): Promise<void> {
        if (!this.active || this.asking) return;

        this.asking = true;
        button.disabled = true;
        const candidate = this.value;

        try {
            if (!await this.confirm(candidate) || !this.active) return;

            this.settle(candidate);
            this.close();
        } catch (error) {
            new Notice(`导出失败：${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.asking = false;
            button.disabled = false;
        }
    }

    private update(patch: Partial<ExportStyle>): void {
        if (!this.active) return;

        const previous = this.value.logo;

        this.value = { ...this.value, ...patch };

        if (this.value.logo !== previous) void this.loadLogo();

        this.refreshPanel?.();
        this.schedule();
    }

    private settle(value: ExportStyle | null): void {
        const resolve = this.resolver;

        this.resolver = null;
        resolve?.(value);
    }
}

/**
 * `rgb(43, 49, 56)` 换成 `#2b3138`。取色器只吃十六进制，而计算样式只吐 rgb()。
 * 认不出就返回空串，让调用方用自己的兜底色——这里不替它决定「认不出时该是什么颜色」。
 */
function hexOf(color: string): string {
    const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color.trim());

    if (!match) return /^#[0-9a-f]{3,8}$/i.test(color.trim()) ? color.trim().toLowerCase() : '';

    return `#${[match[1], match[2], match[3]]
        .map((part) => Number(part).toString(16).padStart(2, '0'))
        .join('')}`;
}
