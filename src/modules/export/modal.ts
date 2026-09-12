/**
 * [INPUT]: 依赖 obsidian 的 Modal/Setting/Notice/TFile 界面原语，依赖 core/exportStyle 的契约、标签表与滑块规格，
 *          依赖 core/modals 的 ChoiceModal 选图，依赖 ./paper 的 ExportPaper、./decorate 的 applyDecorations、
 *          ./logo 的 resolveLogo/isLogoFile、./layout 的 captureScale
 * [OUTPUT]: 对外提供 ExportPreviewModal，调用方 openAndGetValue 一次取得整套导出风格
 * [POS]: 导出模块唯一的人机交互面。它借来那张已经渲好的纸、缩放着摆进左边，
 *        右边每一次拖动都只重放装饰、不碰内容，因此「实时」不是靠节流硬撑出来的。
 *        它只收选择、只借纸、不碰文件也不开始截图；Esc、遮罩与取消全部收敛为 null，
 *        使「没导出」在调用侧只有一种语义。
 *        全部控件挂在 refreshers 一张表上：加一个控件就是多注册一个「照着 value 把自己画对」的闭包，
 *        于是「恢复默认」不必逐个想起谁需要被同步——想不起来的那一个正是会出错的那一个。
 *        滑块该不该变灰由 EXPORT_SLIDERS 的 requires 字段决定而不是在这里逐根判断，
 *        因为那个判断一旦写错，用户会被锁在「要开标志得先拖那根滑块、而那根滑块正关着」里出不来
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Modal, Notice, Setting, TFile } from 'obsidian';
import type { App, ButtonComponent, TextComponent } from 'obsidian';
import {
    DEFAULT_EXPORT_STYLE,
    EXPORT_ALIGN_LABELS,
    EXPORT_FORMAT_LABELS,
    EXPORT_SLIDERS,
    EXPORT_THEME_LABELS,
    PAGE_SIZE_MODE_LABELS,
    WATERMARK_ANCHOR_GRID,
    WATERMARK_ANCHOR_LABELS,
    WATERMARK_MODE_LABELS,
} from '../../core/exportStyle';
import type {
    ExportAlign,
    ExportFormat,
    ExportSliderSpec,
    ExportStyle,
    ExportTheme,
    PageSizeMode,
    WatermarkAnchor,
    WatermarkMode,
} from '../../core/exportStyle';
import { ChoiceModal } from '../../core/modals';
import { applyDecorations } from './decorate';
import { captureScale, pageMinHeightOf, pageWidthOf } from './layout';
import type { ExportTemplateContext } from './layout';
import { isLogoFile, resolveLogo } from './logo';
import type { ResolvedLogo } from './logo';
import { canImportLogo, importLogoFromDisk } from './logoImport';
import type { ExportPaper } from './paper';

/** 预览区左右各留一点余白，纸不贴着框边，缩放比例照这个可用宽度算 */
const VIEWPORT_PADDING = 24;

/** 一根滑块和它的规格；规格随身带着，禁用规则才不必回头去查表 */
interface SliderRow {
    readonly spec: ExportSliderSpec;
    readonly setting: Setting;
}

/** 三处可调颜色的键。收成一个联合类型，加一处颜色却忘了给它控件会是编译错 */
type ColorKey = 'headerColor' | 'footerColor' | 'watermarkColor';

/** 一段装饰此刻手里有什么。三个布尔量正好对上 requires 的三种取值 */
interface SectionState {
    readonly text: boolean;
    readonly logo: boolean;
    readonly mark: boolean;
}

/**
 * 只在真的不一样时才写回控件。
 *
 * 每改一个字都会把整张 refreshers 表跑一遍，其中就包括用户此刻正在打字的那个输入框。
 * 往 input.value 写一个与现值相同的字符串，按 HTML 规范是要把光标挪到末尾的
 * （Chromium 恰好在值没变时略过这一步，但那是实现的善意，不是承诺）。
 * 一行判断就让「在句子中间插一个字，光标跳到行尾」这类 bug 在结构上不可能发生。
 */
function syncText(text: TextComponent, value: string): void {
    if (text.getValue() !== value) text.setValue(value);
}

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
    private value: ExportStyle;
    private resolver: ((value: ExportStyle | null) => void) | null = null;
    private readonly refreshers: (() => void)[] = [];
    private canvasEl: HTMLElement | null = null;
    private viewportEl: HTMLElement | null = null;
    private metaEl: HTMLElement | null = null;
    private observer: ResizeObserver | null = null;
    private frame: number | null = null;
    private logo: ResolvedLogo | null = null;
    /** 解析标志是异步的；只有最后一次请求有权写回结果，否则快速换两张图会画错那一张 */
    private logoToken = 0;
    private readonly confirm: ExportConfirm;
    /** 正在问去处。挡住第二次点击——两个保存框叠在一起谁都说不清是哪一次导出 */
    private asking = false;

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
        this.open();

        return new Promise((resolve) => {
            this.resolver = resolve;
        });
    }

    onOpen(): void {
        this.value = this.initial;
        this.logo = null;
        this.refreshers.length = 0;
        this.modalEl.addClass('ziminos-export-modal');
        this.titleEl.setText('导出当前笔记');
        this.contentEl.empty();

        const layout = this.contentEl.createDiv({ cls: 'ziminos-export-layout' });

        this.buildPreview(layout.createDiv({ cls: 'ziminos-export-preview' }));
        this.buildControls(layout.createDiv({ cls: 'ziminos-export-controls' }));
        this.buildActions();

        this.syncControls();
        this.redraw();
        void this.loadLogo();
    }

    onClose(): void {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.logoToken += 1;
        this.observer?.disconnect();
        this.observer = null;
        // 纸必须先回到离屏舞台：它在预览里是被 transform 缩过的，
        // 而截图前的那一刻，被拍的元素头上不该压着任何一层缩放。
        this.paper.unmount();
        this.canvasEl = null;
        this.viewportEl = null;
        this.metaEl = null;
        this.refreshers.length = 0;
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
     * 先定纸的尺寸，再施装饰，最后重算预览缩放——三步的先后不能换。
     *
     * 改纸宽会让正文重新折行、纸变高，而水印层要盖满**此刻**这张纸；
     * 装饰跑在尺寸前面的话，水印量到的是上一张纸的高度。内容一帧都不重渲：
     * Markdown 早已是 DOM，改宽度只是让浏览器重排一次。
     */
    private redraw(): void {
        // 明暗排在最前：它改的是配色变量，而装饰层要读正文色去定水印的颜色。
        // 反过来的话，水印会用上一套主题的颜色画在这一套主题的纸上。
        this.paper.setTheme(this.value.theme);
        this.paper.resize(pageWidthOf(this.value), pageMinHeightOf(this.value));
        applyDecorations(this.paper.article, this.value, this.context, this.logo);
        this.fitPreview();
    }

    private schedule(): void {
        if (this.frame !== null) return;

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
    // 控件
    // ============================================================

    private buildControls(host: HTMLElement): void {
        // 这一列只有三百二十像素宽，所以「说明在上、控件在下」是没有例外的一条规则：
        // 留一行侧放，说明文字就会把它的控件挤成一小段，而那一行并没有因此更好读。
        new Setting(host)
            .setName('格式')
            .setDesc('PNG 是一整张长图；PDF 是只含一页的完整长页。两者拍的是同一张图。')
            .setClass('ziminos-export-field')
            .addDropdown((dropdown) => {
                for (const [format, label] of Object.entries(EXPORT_FORMAT_LABELS)) {
                    dropdown.addOption(format, label);
                }

                dropdown.onChange((format) => this.update({ format: format as ExportFormat }));
                this.refreshers.push(() => dropdown.setValue(this.value.format));
            });

        this.buildPage(host);

        const themeSetting = new Setting(host)
            .setName('明暗')
            .setDesc('导出这张纸用哪一套配色，与 Obsidian 此刻是什么主题分开。常年用暗色写作、却要交一张白底给客户，是很常见的一件事。')
            .setClass('ziminos-export-field');

        this.addPicker(
            themeSetting,
            ['auto', 'light', 'dark'],
            EXPORT_THEME_LABELS,
            () => this.value.theme,
            (theme: ExportTheme) => this.update({ theme }),
        );

        new Setting(host).setName('正文').setHeading();

        new Setting(host)
            .setName('列表参考线')
            .setDesc('给列表画上缩进参考线，一眼看得出哪几条是同一层。')
            .setClass('ziminos-export-field')
            .addToggle((toggle) => {
                toggle.onChange((on) => this.update({ listGuides: on }));
                this.refreshers.push(() => toggle.setValue(this.value.listGuides));
            });

        this.buildLogoPicker(host);
        this.buildLine(host, 'header', '页眉', '显示在文章标题上方。');
        this.buildLine(host, 'footer', '页脚', '显示在文章正文下方。');
        this.buildWatermark(host);
    }

    /**
     * 纸张两边各自的定法。
     *
     * 宽与高分成两个开关而不是一个「自定尺寸」总开关：它们是两个独立的问题。
     * 只想把宽度钉成 800 让手机上读着舒服、高度仍随内容长的人，是最常见的那一种；
     * 合成一个开关，他就得连高度一起替自己决定一次。
     */
    private buildPage(host: HTMLElement): void {
        new Setting(host).setName('纸张').setHeading();

        const rows = this.buildSliders(host, 'page');

        for (const row of rows) {
            const modeKey = row.spec.key === 'pageWidth' ? 'pageWidthMode' : 'pageHeightMode';
            const picker = new Setting(host)
                .setName(row.spec.key === 'pageWidth' ? '宽度' : '高度')
                .setDesc(row.spec.key === 'pageWidth'
                    ? '自适应＝跟着编辑区的正文栏走；自定＝钉死一个数，换台电脑也一样。'
                    : '自适应＝跟着内容长；自定＝至少这么高，内容更多时照样往下长。')
                .setClass('ziminos-export-field');

            this.addPicker(
                picker,
                ['auto', 'fixed'],
                PAGE_SIZE_MODE_LABELS,
                () => this.value[modeKey],
                (mode: PageSizeMode) => this.update({ [modeKey]: mode }),
            );

            // 开关画在滑块之前：先问「要不要自己定」，再问「定成多少」。
            // buildSliders 已经把滑块追加在后面了，所以这里把开关那一行挪到它前面去。
            row.setting.settingEl.before(picker.settingEl);
            this.refreshers.push(() => row.setting.setDisabled(this.value[modeKey] !== 'fixed'));
        }
    }

    /**
     * 选标志。两条路，各答一个不同的问题。
     *
     * **从电脑选**是主路：用户的 logo 本来就在电脑上，逼他先把图拖进笔记库、再回来选一遍，
     * 是把实现细节（「我只认库内路径」）当成了他的工序。选完由插件复制进库，
     * 于是那条路径仍然是库内路径——可同步、换台电脑还认得、手机上也画得出来。
     *
     * **从库里选**是次路，也是手机上唯一的一条：库里的图片是一个封闭集合，
     * 因此走 ChoiceModal 而不是让人手打路径——这条纪律与 core/modals 里那句
     * 「凡取值来自封闭集合一律走 ChoiceModal」同源：手打出来的路径能通过一切非空校验，
     * 然后安静地渲不出图。
     */
    private buildLogoPicker(host: HTMLElement): void {
        new Setting(host).setName('品牌标志').setHeading();

        const fromDisk = canImportLogo();
        const setting = new Setting(host)
            .setName('图片')
            .setClass('ziminos-export-field')
            .setClass('ziminos-export-logo');

        if (fromDisk) {
            setting.addButton((button) => {
                button.setButtonText('从电脑选…').setCta().onClick(() => void this.importLogo());
            });
        }

        setting.addButton((button) => {
            button
                .setButtonText(fromDisk ? '从库里选' : '选择图片…')
                .onClick(() => void this.pickFromVault());
        });

        setting.addExtraButton((button) => {
            button
                .setIcon('x')
                .setTooltip('不用标志')
                .onClick(() => this.update({ logo: '' }));
        });

        this.refreshers.push(() => setting.setDesc(this.logoStatus()));
    }

    /** 从电脑上挑一张，复制进库。取消什么都不做；失败如实说一句，不静默 */
    private async importLogo(): Promise<void> {
        try {
            const path = await importLogoFromDisk(this.app);

            if (!path) return;

            this.update({ logo: path });
            new Notice(`标志已放进笔记库：${path}`);
        } catch (error) {
            new Notice(`选图失败：${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /** 三种状态各有各的话：没选过、选了但读不出、读出来了多大 */
    private logoStatus(): string {
        const path = this.value.logo.trim();

        if (!path) {
            return canImportLogo()
                ? '从电脑上挑一张（会复制进笔记库），或从库里已有的图片里选。页眉、页脚与水印各自决定放多大，尺寸 0 就是那一处不放。'
                : '从库里已有的图片里选一张。页眉、页脚与水印各自决定放多大，尺寸 0 就是那一处不放。';
        }

        if (!this.logo) return `这张图读不出来了（可能已被改名或删除）：${path}`;

        return `${path}　·　${this.logo.width} × ${this.logo.height}`;
    }

    private async pickFromVault(): Promise<void> {
        const images = this.app.vault.getFiles().filter((file) => isLogoFile(file));

        if (!images.length) {
            new Notice(canImportLogo()
                ? '笔记库里还没有图片。用「从电脑选…」直接挑一张，插件会替你复制进库。'
                : '笔记库里还没有图片。先把标志放进库里，再回来选。');

            return;
        }

        const picked = await new ChoiceModal<TFile>(this.app, {
            title: '选一张图片当品牌标志',
            items: images,
            labelOf: (file) => file.path,
        }).openAndGetChoice();

        if (!picked) return;

        this.update({ logo: picked.path });
    }

    /** 页眉与页脚是同一种东西的两个落点，所以只有一份画法 */
    private buildLine(
        host: HTMLElement,
        section: 'header' | 'footer',
        name: string,
        description: string,
    ): void {
        const alignKey = section === 'header' ? 'headerAlign' : 'footerAlign';
        const logoSizeKey = section === 'header' ? 'headerLogoSize' : 'footerLogoSize';

        new Setting(host).setName(name).setHeading();

        new Setting(host)
            .setName('文字')
            .setDesc(`${description}留空即不添加；可用 {title}、{date}、{time}。`)
            .setClass('ziminos-export-field')
            .addText((text) => {
                text.setPlaceholder('留空即不添加')
                    .onChange((input) => this.update({ [section]: input }));
                this.refreshers.push(() => syncText(text, this.value[section]));
            });

        const linkKey = section === 'header' ? 'headerLink' : 'footerLink';
        const colorKey = section === 'header' ? 'headerColor' : 'footerColor';

        new Setting(host)
            .setName('链接')
            .setDesc('填一个网址，这一行在 PDF 里整段可点（不带 https:// 也认）。')
            .setClass('ziminos-export-field')
            .addText((text) => {
                text.setPlaceholder('edu.example.com')
                    .onChange((input) => this.update({ [linkKey]: input }));
                this.refreshers.push(() => syncText(text, this.value[linkKey]));
            })
            .then((setting) => this.refreshers.push(() => {
                // 格式一换，这句话的真假就变了。PNG 下它必须当场说自己不成立，
                // 否则用户填了链接、导出、发现点不动，只会怀疑是网址写错了。
                setting.descEl.toggleClass('ziminos-export-warn', this.value.format === 'png');
                setting.setDesc(this.value.format === 'png'
                    ? 'PNG 是图片，点不了。要可点的链接，把格式换成 PDF。'
                    : '填一个网址，这一行在 PDF 里整段可点（不带 https:// 也认）。');
            }));

        this.addColor(host, colorKey, '文字颜色');

        const alignSetting = new Setting(host).setName('位置').setClass('ziminos-export-field');

        this.addPicker(
            alignSetting,
            ['left', 'center', 'right'],
            EXPORT_ALIGN_LABELS,
            () => this.value[alignKey],
            (align: ExportAlign) => this.update({ [alignKey]: align }),
        );

        const rows = this.buildSliders(host, section);

        this.refreshers.push(() => {
            const state = this.stateOf(this.value[section], this.value[logoSizeKey]);

            alignSetting.setDisabled(!state.mark);
            applySliderState(rows, state);
        });
    }

    private buildWatermark(host: HTMLElement): void {
        new Setting(host).setName('水印').setHeading();

        new Setting(host)
            .setName('文字')
            .setDesc('留空即不添加；可用 {title}、{date}、{time}。只放标志也成立。')
            .setClass('ziminos-export-field')
            .addText((text) => {
                text.setPlaceholder('留空即不添加')
                    .onChange((input) => this.update({ watermark: input }));
                this.refreshers.push(() => syncText(text, this.value.watermark));
            });

        this.addColor(host, 'watermarkColor', '文字颜色');

        const modeSetting = new Setting(host)
            .setName('排布')
            .setDesc('平铺裁不掉，适合防转发；单个安静，适合当落款。')
            .setClass('ziminos-export-field');

        this.addPicker(
            modeSetting,
            ['tile', 'single'],
            WATERMARK_MODE_LABELS,
            () => this.value.watermarkMode,
            (mode: WatermarkMode) => this.update({ watermarkMode: mode }),
        );

        const anchorSetting = new Setting(host)
            .setName('位置')
            .setDesc('单个落款落在纸的哪一格。')
            .setClass('ziminos-export-field');

        this.addPicker(
            anchorSetting,
            WATERMARK_ANCHOR_GRID.flat(),
            WATERMARK_ANCHOR_LABELS,
            () => this.value.watermarkAnchor,
            (anchor: WatermarkAnchor) => this.update({ watermarkAnchor: anchor }),
            'ziminos-export-grid',
        );

        const rows = this.buildSliders(host, 'watermark');

        this.refreshers.push(() => {
            const state = this.stateOf(this.value.watermark, this.value.watermarkLogoSize);

            modeSetting.setDisabled(!state.mark);
            // 平铺的水印没有「位置」——无限重复的图案只有疏密。
            // 那一格因此不是变灰而是整行收起：留着一个永远无效的控件，用户会以为是它坏了。
            anchorSetting.settingEl.toggleClass(
                'ziminos-export-hidden',
                !state.mark || this.value.watermarkMode !== 'single',
            );
            applySliderState(rows, state);
        });
    }

    /**
     * 一个颜色栏。空串＝跟随正文色，因此它比一个普通取色器多一个「退回去」的按钮。
     *
     * 取色器本身没有空态：它永远握着一个具体色号。所以「跟随主题」只能由我们自己表达——
     * 值为空时把当前正文色填进色块（看着是对的），状态却仍是空串（行为是对的），
     * 旁边那枚 ✕ 是唯一能回到空串的路。少了它，用户点过一次取色器就再也回不到跟随主题。
     */
    private addColor(host: HTMLElement, key: ColorKey, name: string): void {
        const setting = new Setting(host).setName(name).setClass('ziminos-export-field');

        setting.addColorPicker((picker) => {
            picker.onChange((value) => this.update({ [key]: value }));
            this.refreshers.push(() => picker.setValue(this.value[key] || this.inheritedColor()));
        });
        setting.addExtraButton((button) => {
            button
                .setIcon('rotate-ccw')
                .setTooltip('跟随正文色')
                .onClick(() => this.update({ [key]: '' }));
        });

        this.refreshers.push(() => setting.setDesc(
            this.value[key] ? `用这个色：${this.value[key]}` : '跟随正文色（明暗两套主题下都读得出）。',
        ));
    }

    /** 正文此刻是什么色，用来给「跟随主题」那个状态填一个看着对的色块 */
    private inheritedColor(): string {
        return hexOf(getComputedStyle(this.paper.article).color) || '#6b7280';
    }

    /**
     * 一段装饰此刻有没有字、有没有图可用、整体显不显示。
     *
     * `logo` 问的是「选没选过一张读得出的图」而不是「这一处放不放」——
     * 正因为如此，标志大小那根滑块在这一处尺寸为 0 时**依然可拖**，
     * 否则它就是自己把自己锁死的那根滑块。
     */
    private stateOf(text: string, logoSize: number): SectionState {
        const hasText = text.trim() !== '';
        const hasLogo = this.logo !== null;

        return {
            text: hasText,
            logo: hasLogo,
            mark: hasText || (hasLogo && logoSize > 0),
        };
    }

    /** 照 EXPORT_SLIDERS 那张表铺滑块。范围与验形区间同源，界面拖得到的值重启后一定还认 */
    private buildSliders(host: HTMLElement, section: ExportSliderSpec['section']): SliderRow[] {
        return EXPORT_SLIDERS.filter((spec) => spec.section === section).map((spec) => {
            const setting = new Setting(host)
                .setName(spec.name)
                .setDesc(spec.desc)
                .setClass('ziminos-export-field');
            // 读数是**可以直接改的**，不是一块只读的标签。
            // 拖得到的值受 step 限制（间距一档 4px，你永远拖不出 150），而「就要这个数」
            // 是个真实的诉求——尤其纸宽：用户想要的是 800，不是「800 附近」。
            const readout = setting.nameEl.createEl('input', {
                cls: 'ziminos-export-value',
                attr: { type: 'number', min: spec.min, max: spec.max, step: spec.step },
            });

            readout.addEventListener('input', () => {
                const typed = Number.parseFloat(readout.value);

                // 打到一半的「-」「」「1e」都不是回答，放过去会让预览闪成 NaN。
                // 夹在区间里而不是拒绝：越界说明他想要更大/更小，给他边界比什么都不做诚实。
                if (!Number.isFinite(typed)) return;

                this.update({ [spec.key]: Math.min(spec.max, Math.max(spec.min, Math.round(typed))) });
            });

            setting.addSlider((slider) => {
                slider
                    .setLimits(spec.min, spec.max, spec.step)
                    .setInstant(true)
                    .onChange((input) => this.update({ [spec.key]: input }));
                this.refreshers.push(() => {
                    const current = this.value[spec.key];

                    if (slider.getValue() !== current) slider.setValue(current);
                    // 与文本框同一条守卫：正在打字的那个框不该被自己触发的这一轮同步改写
                    if (Number.parseFloat(readout.value) !== current) readout.value = String(current);
                });
            });

            return { spec, setting };
        });
    }

    /**
     * 一排互斥按钮。位置这件事该用位置来问：
     * 下拉框把「左中右」和「九宫格」压成一列文字，而它们本来就是空间。
     */
    private addPicker<T extends string>(
        setting: Setting,
        values: readonly T[],
        labels: Readonly<Record<T, string>>,
        read: () => T,
        write: (value: T) => void,
        extraClass?: string,
    ): void {
        const group = setting.controlEl.createDiv({ cls: 'ziminos-export-picker' });

        if (extraClass) group.addClass(extraClass);

        const buttons = values.map((value) => {
            const button = group.createEl('button', { text: labels[value], attr: { type: 'button' } });

            button.addEventListener('click', () => write(value));

            return { value, button };
        });

        this.refreshers.push(() => {
            const current = read();

            for (const entry of buttons) {
                entry.button.toggleClass('is-active', entry.value === current);
            }
        });
    }

    private buildActions(): void {
        new Setting(this.contentEl)
            .setClass('ziminos-export-actions')
            .addExtraButton((button) => {
                button
                    .setIcon('rotate-ccw')
                    .setTooltip('恢复默认风格')
                    .onClick(() => this.update(DEFAULT_EXPORT_STYLE));
            })
            .addButton((button) => {
                button.setButtonText('取消').onClick(() => this.close());
            })
            .addButton((button) => {
                button
                    .setButtonText('导出')
                    .setCta()
                    .onClick(() => void this.finish(button));
            });
    }

    // ============================================================
    // 状态
    // ============================================================

    /**
     * 按下导出：先问去处，问到了才关窗。
     *
     * 取消保存框与导出失败在这里是同一种结局——弹窗留着。它们对用户是同一件事：
     * 「这次没导出成」，而他刚调了十分钟的那套风格不该因此消失。
     */
    private async finish(button: ButtonComponent): Promise<void> {
        if (this.asking) return;

        this.asking = true;
        button.setDisabled(true);

        try {
            if (!await this.confirm(this.value)) return;

            this.settle(this.value);
            this.close();
        } catch (error) {
            new Notice(`导出失败：${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.asking = false;
            button.setDisabled(false);
        }
    }

    private update(patch: Partial<ExportStyle>): void {
        const previous = this.value.logo;

        this.value = { ...this.value, ...patch };

        if (this.value.logo !== previous) void this.loadLogo();

        this.syncControls();
        this.schedule();
    }

    /** 读盘是异步的，所以它自己排在预览之外；读完再同步一次控件与画面 */
    private async loadLogo(): Promise<void> {
        const token = ++this.logoToken;
        const resolved = await resolveLogo(this.app, this.value.logo);

        if (token !== this.logoToken) return;

        this.logo = resolved;
        this.syncControls();
        this.schedule();
    }

    private syncControls(): void {
        for (const refresh of this.refreshers) refresh();
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

/**
 * 谁该变灰由规格里的 requires 决定，不在调用处逐根写死。
 *
 * `switch` 是唯一的例外，而且是明写出来的例外：纸宽与纸高各有各的自适应开关，
 * 「这一段有没有字、有没有图」那套判断对它们一句都不适用，因此由 buildPage 自己接线。
 */
function applySliderState(rows: readonly SliderRow[], state: SectionState): void {
    for (const row of rows) {
        if (row.spec.requires === 'switch') continue;

        row.setting.setDisabled(!state[row.spec.requires]);
    }
}
