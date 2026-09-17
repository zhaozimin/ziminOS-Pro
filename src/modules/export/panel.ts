/**
 * [INPUT]: 依赖 core/exportStyle 的契约、标签表、滑块规格与纸张预设；
 *          不 import obsidian，只用它挂在 HTMLElement 上的 createDiv/createEl/createSpan
 * [OUTPUT]: 对外提供 PanelHost 契约与 buildExportPanel（返回一个把全部控件照当前值画对的 refresh）
 * [POS]: 导出弹窗右边那一列控件。它从 modal.ts 分出来的判据与 settings/settingsPanels 那次完全相同——
 *        **变更理由不同**：那边回答「骨架怎么画、纸怎么缩放、什么时候关窗」，这边回答「每一段塞什么」；
 *        触发点也同样是那条 ≤800 行。
 *
 *        这一列的全部设计压在两句话上，因为它要在三百二十像素里装下三十个字段：
 *        其一，**说明不常驻**——每行一句灰字才是吃掉高度的大头，它们搬进了名字的悬停提示；
 *        其二，**关着的段落不画**——页眉页脚水印各有一个开关，关掉时它下面那一堆根本不存在。
 *        默认（三段全关、纸张自适应）只有六行，打开哪一段才长出哪一段。
 *
 *        它刻意不用 obsidian 的 Setting 原语：Setting 是「名字在左、控件在右、说明在名字下面」的
 *        固定三件套，而这一列要的正是把第三件拿掉。用它就得一路和它的默认版式打架。
 *        纸张预设的 width/height 在控件边界映射为风格的 pageWidth/pageHeight，交付尺寸只读后者
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
    EXPORT_ALIGN_LABELS,
    EXPORT_FORMAT_LABELS,
    EXPORT_SLIDERS,
    EXPORT_THEME_LABELS,
    PAGE_SIZE_MODE_LABELS,
    PAPER_PRESET_LABELS,
    PAPER_PRESET_SIZES,
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
    PaperPreset,
    WatermarkAnchor,
    WatermarkMode,
} from '../../core/exportStyle';

/** 这一列要用到的、但不归它管的几件事 */
export interface PanelHost {
    value(): ExportStyle;
    update(patch: Partial<ExportStyle>): void;
    /** 标志此刻解出来没有；用来画缩略图与那行文件名 */
    logoUrl(): string;
    logoName(): string;
    /** 正文此刻是什么色，给「跟随正文色」那个状态填一个看着对的色块 */
    inheritedColor(): string;
    pickLogo(): void;
    clearLogo(): void;
}

/** 三处颜色的键。收成联合类型，加一处颜色却忘了给它控件会是编译错 */
type ColorKey = 'headerColor' | 'footerColor' | 'watermarkColor';

interface Row {
    readonly row: HTMLElement;
    readonly control: HTMLElement;
}

export function buildExportPanel(host: HTMLElement, panel: PanelHost): () => void {
    const refreshers: (() => void)[] = [];
    const S = () => panel.value();

    // ── 格式：左滑图片、右滑 PDF ──
    duo(
        row(host, '格式', 'PNG 是一整张长图；PDF 是只含一页的完整长页。两者拍的是同一张图').control,
        ['png', EXPORT_FORMAT_LABELS.png],
        ['pdf', EXPORT_FORMAT_LABELS.pdf],
        () => S().format,
        (format: ExportFormat) => panel.update({ format }),
        refreshers,
    );

    // ── 纸张：自适应 / 自定；自定才长出下面那几行 ──
    duo(
        row(host, '纸张', '自适应＝跟着编辑区的正文栏走；自定＝钉死尺寸，换台电脑也一样').control,
        ['auto', PAGE_SIZE_MODE_LABELS.auto],
        ['fixed', PAGE_SIZE_MODE_LABELS.fixed],
        () => S().pageMode,
        (pageMode: PageSizeMode) => panel.update({ pageMode }),
        refreshers,
    );

    const pageBody = host.createDiv({ cls: 'ziminos-export-body' });
    const presetRow = row(pageBody, '预设', 'A4 / A3 按 96dpi 换算成像素；选中即把下面两个数填好，此后照样能接着拖');

    segmented(
        presetRow.control,
        (['free', 'a4', 'a3'] as const).map((key) => [key, PAPER_PRESET_LABELS[key]] as const),
        () => S().paperPreset,
        (preset: PaperPreset) => {
            const size = PAPER_PRESET_SIZES[preset];

            panel.update(size
                ? { paperPreset: preset, pageWidth: size.width, pageHeight: size.height }
                : { paperPreset: preset });
        },
        refreshers,
    );

    sliders(pageBody, 'page', panel, refreshers);

    // ── 明暗：导出用哪一套配色，与界面主题分开 ──
    segmented(
        row(host, '明暗', '导出这张纸用哪一套配色，与 Obsidian 此刻是什么主题分开。常年用暗色写作、却要交一张白底给客户，是很常见的一件事').control,
        (['auto', 'light', 'dark'] as const).map((key) => [key, EXPORT_THEME_LABELS[key]] as const),
        () => S().theme,
        (theme: ExportTheme) => panel.update({ theme }),
        refreshers,
    );

    // ── 标志：缩略图 + 一枚按钮 + 文件名 + 清除，全在一行 ──
    buildLogoRow(host, panel, refreshers);

    // ── 三段装饰 ──
    buildLine(host, panel, 'header', '页眉', '显示在文章标题上方', refreshers);
    buildLine(host, panel, 'footer', '页脚', '显示在文章正文下方', refreshers);
    buildWatermark(host, panel, refreshers);

    // 预设只在 PDF 下露面：A4/A3 是印刷开本，图片没有「开本」这回事
    refreshers.push(() => {
        pageBody.hidden = S().pageMode !== 'fixed';
        presetRow.row.hidden = S().format !== 'pdf';
    });

    return () => {
        for (const refresh of refreshers) refresh();
    };
}

// ============================================================
// 段落
// ============================================================

function buildLogoRow(host: HTMLElement, panel: PanelHost, refreshers: (() => void)[]): void {
    const cell = row(host, '标志', '一张图，页眉页脚水印三处各自决定放多大；0 就是那一处不放');
    const box = cell.control.createDiv({ cls: 'ziminos-export-logo' });
    const thumb = box.createDiv({ cls: 'ziminos-export-logo-thumb' });
    const pick = box.createEl('button', { cls: 'ziminos-export-mini', text: '选图', attr: { type: 'button' } });
    const name = box.createDiv({ cls: 'ziminos-export-logo-name' });
    const clear = box.createEl('button', {
        cls: 'ziminos-export-reset',
        text: '✕',
        attr: { type: 'button', title: '不用标志' },
    });

    pick.addEventListener('click', () => panel.pickLogo());
    clear.addEventListener('click', () => panel.clearLogo());

    refreshers.push(() => {
        const url = panel.logoUrl();

        thumb.style.backgroundImage = url ? `url("${url}")` : '';
        name.setText(panel.logoName());
    });
}

/** 页眉与页脚是同一种东西的两个落点，所以只有一份画法 */
function buildLine(
    host: HTMLElement,
    panel: PanelHost,
    section: 'header' | 'footer',
    label: string,
    tip: string,
    refreshers: (() => void)[],
): void {
    const isHeader = section === 'header';
    const onKey = isHeader ? 'headerEnabled' : 'footerEnabled';
    const alignKey = isHeader ? 'headerAlign' : 'footerAlign';
    const colorKey: ColorKey = isHeader ? 'headerColor' : 'footerColor';
    const linkKey = isHeader ? 'headerLink' : 'footerLink';
    const S = () => panel.value();

    rule(host);

    const head = row(host, label, tip);

    head.row.addClass('ziminos-export-head');
    swatch(head.control, colorKey, panel, refreshers);
    toggle(head.control, () => S()[onKey], (on) => panel.update({ [onKey]: on }), refreshers);

    const body = host.createDiv({ cls: 'ziminos-export-body' });

    // 位置排在第一个：先决定这一行站哪儿，再决定它说什么
    segmented(
        row(body, '位置', '这一行靠纸的哪一边').control,
        (['left', 'center', 'right'] as const).map((key) => [key, EXPORT_ALIGN_LABELS[key]] as const),
        () => S()[alignKey],
        (align: ExportAlign) => panel.update({ [alignKey]: align }),
        refreshers,
    );
    text(row(body, '文字', '可用 {title}、{date}、{time}；留空就只放标志或链接').control,
        section, '留空即不加', panel, refreshers);
    buildLinkRow(body, panel, linkKey, refreshers);
    sliders(body, section, panel, refreshers);

    refreshers.push(() => { body.hidden = !S()[onKey]; });
}

/** 链接那一行的说明随格式变：PNG 下它必须当场说自己不成立 */
function buildLinkRow(
    host: HTMLElement,
    panel: PanelHost,
    key: 'headerLink' | 'footerLink',
    refreshers: (() => void)[],
): void {
    const cell = row(host, '链接', '');

    text(cell.control, key, 'edu.example.com', panel, refreshers);

    refreshers.push(() => {
        const png = panel.value().format === 'png';

        cell.row.toggleClass('ziminos-export-warn', png);
        cell.row.setAttribute('title', png
            ? 'PNG 是图片，点不了。要可点的链接，把格式换成 PDF'
            : '填一个网址，这一行在 PDF 里整段可点并带下划线（不带 https:// 也认）');
    });
}

function buildWatermark(host: HTMLElement, panel: PanelHost, refreshers: (() => void)[]): void {
    const S = () => panel.value();

    rule(host);

    const head = row(host, '水印', '铺在正文之上的那一层');

    head.row.addClass('ziminos-export-head');
    swatch(head.control, 'watermarkColor', panel, refreshers);
    toggle(head.control, () => S().watermarkEnabled,
        (on) => panel.update({ watermarkEnabled: on }), refreshers);

    const body = host.createDiv({ cls: 'ziminos-export-body' });

    segmented(
        row(body, '布局', '平铺裁不掉，适合防转发；单个安静，适合当落款').control,
        (['tile', 'single'] as const).map((key) => [key, WATERMARK_MODE_LABELS[key]] as const),
        () => S().watermarkMode,
        (mode: WatermarkMode) => panel.update({ watermarkMode: mode }),
        refreshers,
    );

    const anchorRow = row(body, '位置', '单个落款落在纸的哪一格');

    anchorRow.row.addClass('ziminos-export-anchor');
    segmented(
        anchorRow.control,
        WATERMARK_ANCHOR_GRID.flat().map((key) => [key, WATERMARK_ANCHOR_LABELS[key]] as const),
        () => S().watermarkAnchor,
        (anchor: WatermarkAnchor) => panel.update({ watermarkAnchor: anchor }),
        refreshers,
        'ziminos-export-grid',
    );

    text(row(body, '文字', '可用 {title}、{date}、{time}；留空就只放标志').control,
        'watermark', '留空即不加', panel, refreshers);
    sliders(body, 'watermark', panel, refreshers);

    refreshers.push(() => {
        body.hidden = !S().watermarkEnabled;
        // 平铺的水印没有「位置」——无限重复的图案只有疏密。
        // 整行收起而不是变灰：留着一个永远无效的控件，用户会以为是它坏了。
        anchorRow.row.hidden = S().watermarkMode !== 'single';
    });
}

// ============================================================
// 控件原语
// ============================================================

/** 一行 = 左边名字 + 右边控件。说明挂在名字的 title 上，不占一行高度 */
function row(host: HTMLElement, label: string, tip: string): Row {
    const line = host.createDiv({ cls: 'ziminos-export-row' });
    const name = line.createDiv({ cls: 'ziminos-export-label', text: label });

    if (tip) name.setAttribute('title', tip);

    return { row: line, control: line.createDiv({ cls: 'ziminos-export-ctl' }) };
}

function rule(host: HTMLElement): void {
    host.createDiv({ cls: 'ziminos-export-rule' });
}

/** 二选一滑块：左滑一个意思，右滑另一个意思 */
function duo<T extends string>(
    host: HTMLElement,
    left: readonly [T, string],
    right: readonly [T, string],
    read: () => T,
    write: (value: T) => void,
    refreshers: (() => void)[],
): void {
    const track = host.createDiv({ cls: 'ziminos-export-duo' });

    // 滑块本身用 <i> 而不是 <span>：CSS 里那两条 :first/:last-of-type 选的是标签，
    // 它若也是 span 就会被选中，于是选中那一侧的字会变成同色不可读。
    track.createEl('i', { cls: 'ziminos-export-duo-thumb' });

    const labels = [left, right].map((entry) => {
        const span = track.createEl('span', { cls: 'ziminos-export-duo-lab', text: entry[1] });

        span.addEventListener('click', () => write(entry[0]));

        return span;
    });

    refreshers.push(() => {
        track.dataset.at = read() === left[0] ? '0' : '1';
        void labels;
    });
}

/** 开关：只回答开还是关 */
function toggle(
    host: HTMLElement,
    read: () => boolean,
    write: (value: boolean) => void,
    refreshers: (() => void)[],
): void {
    const button = host.createEl('button', {
        cls: 'ziminos-export-toggle',
        attr: { type: 'button', role: 'switch' },
    });

    button.addEventListener('click', () => write(!read()));
    refreshers.push(() => button.setAttribute('aria-checked', read() ? 'true' : 'false'));
}

/**
 * 一小块颜色 + 一枚「退回去」。
 *
 * 取色器没有空态，它永远握着一个具体色号；而「跟随正文色」是一个有意义的状态。
 * 于是值为空时把当前正文色填进色块（看着是对的）、状态仍是空串（行为是对的），
 * 旁边那枚 ↺ 是唯一能回到空串的路——少了它，用户点过一次就再也回不到跟随主题。
 */
function swatch(
    host: HTMLElement,
    key: ColorKey,
    panel: PanelHost,
    refreshers: (() => void)[],
): void {
    const box = host.createEl('button', {
        cls: 'ziminos-export-swatch',
        attr: { type: 'button', title: '文字颜色（A＝跟随正文色）' },
    });
    const input = box.createEl('input', { attr: { type: 'color' } });
    const reset = host.createEl('button', {
        cls: 'ziminos-export-reset',
        text: '↺',
        attr: { type: 'button', title: '跟随正文色' },
    });

    input.addEventListener('input', () => panel.update({ [key]: input.value }));
    reset.addEventListener('click', () => panel.update({ [key]: '' }));

    refreshers.push(() => {
        const current = panel.value()[key];

        box.toggleClass('is-auto', !current);
        input.value = current || panel.inheritedColor();
    });
}

/** 一排互斥按钮。位置这件事该用位置来问，而不是把空间压成一列文字 */
function segmented<T extends string>(
    host: HTMLElement,
    items: readonly (readonly [T, string])[],
    read: () => T,
    write: (value: T) => void,
    refreshers: (() => void)[],
    extraClass?: string,
): void {
    const group = host.createDiv({ cls: 'ziminos-export-seg' });

    if (extraClass) group.addClass(extraClass);

    const buttons = items.map(([value, label]) => {
        const button = group.createEl('button', { text: label, attr: { type: 'button' } });

        button.addEventListener('click', () => write(value));

        return { value, button };
    });

    refreshers.push(() => {
        const current = read();

        for (const entry of buttons) entry.button.toggleClass('is-on', entry.value === current);
    });
}

function text(
    host: HTMLElement,
    key: 'header' | 'footer' | 'watermark' | 'headerLink' | 'footerLink',
    placeholder: string,
    panel: PanelHost,
    refreshers: (() => void)[],
): void {
    const input = host.createEl('input', { attr: { type: 'text', placeholder } });

    input.addEventListener('input', () => panel.update({ [key]: input.value }));
    refreshers.push(() => {
        // 只在真的不一样时才写回：每改一个字都会跑一遍全表，
        // 往 input.value 写一个与现值相同的字符串，按规范是要把光标挪到末尾的
        const current = panel.value()[key];

        if (input.value !== current) input.value = current;
    });
}

/** 照 EXPORT_SLIDERS 那张表铺滑块。范围与验形区间同源，界面拖得到的值重启后一定还认 */
function sliders(
    host: HTMLElement,
    section: ExportSliderSpec['section'],
    panel: PanelHost,
    refreshers: (() => void)[],
): void {
    for (const spec of EXPORT_SLIDERS.filter((entry) => entry.section === section)) {
        const cell = row(host, spec.name, spec.desc);
        const slider = cell.control.createEl('input', {
            cls: 'ziminos-export-slider',
            attr: { type: 'range', min: spec.min, max: spec.max, step: spec.step },
        });
        // 读数可以直接改：拖得到的值受 step 限制（间距一档 4px，永远拖不出 150），
        // 而「就要这个数」是真实诉求——尤其纸宽，用户想要的是 800，不是「800 附近」。
        const readout = cell.control.createEl('input', {
            cls: 'ziminos-export-value',
            attr: { type: 'number', min: spec.min, max: spec.max, step: spec.step },
        });
        const put = (raw: number) => panel.update({
            [spec.key]: Math.min(spec.max, Math.max(spec.min, Math.round(raw))),
        });

        slider.addEventListener('input', () => put(Number(slider.value)));
        readout.addEventListener('input', () => {
            const typed = Number.parseFloat(readout.value);

            // 打到一半的「-」「」「1e」都不是回答；放过去会让预览闪成 NaN
            if (Number.isFinite(typed)) put(typed);
        });

        refreshers.push(() => {
            const current = panel.value()[spec.key];

            if (Number(slider.value) !== current) slider.value = String(current);
            if (Number.parseFloat(readout.value) !== current) readout.value = String(current);
        });
    }
}
