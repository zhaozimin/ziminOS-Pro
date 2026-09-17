/**
 * [INPUT]: 不依赖任何模块——它只回答「一套导出风格长什么样、哪些取值算数」
 * [OUTPUT]: 对外提供 ExportFormat/ExportAlign/WatermarkMode/WatermarkAnchor 四个枚举与它们的中文标签，
 *           ExportStyle 契约（含品牌标志路径与三处各自的尺寸）、DEFAULT_EXPORT_STYLE 默认值、
 *           滑块规格表 EXPORT_SLIDERS、九宫格排布 WATERMARK_ANCHOR_GRID、纸张预设 PAPER_PRESET_SIZES，
 *           以及读取侧兜底 normalizeExportStyle（开关键缺席时从文字、标志与页眉页脚链接推导可见性）
 * [POS]: core 的导出口径层，与 markdownStyle/device 同列：模块自己的设置形状必须住在 core，
 *        否则 normalizeSettings 就得反向 import 一个功能模块，依赖图从树变成网。
 *        本文件最要紧的设计是 EXPORT_SLIDERS——它同时是界面的滑块范围与持久化的验形区间，
 *        一份事实两处使用，因此「界面能拖到的值」与「重启后还认的值」永远不可能对不上
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 枚举：四个闭合集合
// ============================================================

/** 当前支持的两个交付格式；图片只交付无损 PNG，避免再长出一排近义选项 */
export type ExportFormat = 'png' | 'pdf';

/** 页眉、页脚这类单行装饰的横向落点。它们永远贴着纸的上下缘，所以「位置」只剩左右 */
export type ExportAlign = 'left' | 'center' | 'right';

/**
 * 水印的排布方式。两者不是同一件事的浓淡，是两个目的：
 * 平铺防的是「截一段转发出去」，裁不掉；单个求的是落款，安静、不挡字。
 */
export type WatermarkMode = 'tile' | 'single';

/** 单个水印的九宫格落点。平铺时无意义——无限重复的图案没有「位置」，只有疏密 */
export type WatermarkAnchor =
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * 纸张某一边的定法：跟着走，还是钉死。
 *
 * 「自适应」是这一版之前唯一的行为——宽度跟编辑区、高度跟内容。它够用，却有一个说不出口的毛病：
 * **跟的是这台电脑此刻那扇窗户有多宽**，是屏幕的偶然，不是笔记的属性。
 * 同一篇笔记在笔记本与外接显示器上导出，得到两种宽度；而「品牌每次都一样」正是这个模块的立身之本。
 * 钉死一个值，补的是这个洞。
 */
export type PageSizeMode = 'auto' | 'fixed';

/**
 * 导出用哪一套明暗，与 Obsidian 此刻是什么主题**分开**。
 *
 * 「跟随」是升级前唯一的行为，也必须是默认——换了默认，所有人下一次导出的底色都变了。
 * 但它不该是唯一选项：常年用暗色写作、却要交一张白底给客户，是很常见的一件事，
 * 而为了导一张图去把整个 Obsidian 切成亮色再切回来，是让人替机器干活。
 */
export type ExportTheme = 'auto' | 'light' | 'dark';

export const EXPORT_THEME_LABELS: Readonly<Record<ExportTheme, string>> = {
    auto: '跟随',
    light: '亮色',
    dark: '暗色',
};

export const PAGE_SIZE_MODE_LABELS: Readonly<Record<PageSizeMode, string>> = {
    auto: '自适应',
    fixed: '自定',
};

/**
 * 纸张预设。只在 PDF 下有意义——A4/A3 是印刷开本，图片没有「开本」这回事。
 *
 * 它不是第四种尺寸模式，只是两个数字的快捷填法：选中即把宽高填成对应像素，
 * 此后照样可以接着拖。因此 free 不是「关掉预设」，是「这两个数字是我自己定的」。
 */
export type PaperPreset = 'free' | 'a4' | 'a3';

export const PAPER_PRESET_LABELS: Readonly<Record<PaperPreset, string>> = {
    free: '自由',
    a4: 'A4',
    a3: 'A3',
};

/** 按 96dpi 换算：A4 210×297mm、A3 297×420mm。不写 mm 是因为这张纸最终是像素 */
export const PAPER_PRESET_SIZES: Readonly<Record<PaperPreset, { width: number; height: number } | null>> = {
    free: null,
    a4: { width: 794, height: 1_123 },
    a3: { width: 1_123, height: 1_587 },
};

export const EXPORT_FORMAT_LABELS: Readonly<Record<ExportFormat, string>> = {
    png: 'PNG 长图',
    pdf: 'PDF 单页',
};

export const EXPORT_ALIGN_LABELS: Readonly<Record<ExportAlign, string>> = {
    left: '靠左',
    center: '居中',
    right: '靠右',
};

export const WATERMARK_MODE_LABELS: Readonly<Record<WatermarkMode, string>> = {
    tile: '平铺整篇',
    single: '单个落款',
};

/** 九宫格按屏幕上的样子排成三行三列，界面直接照着铺格子，不再自己拼一次顺序 */
export const WATERMARK_ANCHOR_GRID: readonly (readonly WatermarkAnchor[])[] = [
    ['top-left', 'top-center', 'top-right'],
    ['middle-left', 'middle-center', 'middle-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
];

export const WATERMARK_ANCHOR_LABELS: Readonly<Record<WatermarkAnchor, string>> = {
    'top-left': '左上',
    'top-center': '正上',
    'top-right': '右上',
    'middle-left': '左中',
    'middle-center': '正中',
    'middle-right': '右中',
    'bottom-left': '左下',
    'bottom-center': '正下',
    'bottom-right': '右下',
};

// ============================================================
// 契约与默认值
// ============================================================

/**
 * 一套导出风格。字段一律只读，与 ribbonCommands/formatRules 同因：
 * 用户没调过时它与 DEFAULT_EXPORT_STYLE 共享同一个对象引用，
 * 若允许原地改字段，第一次拖滑块就把默认值本身改掉了，此后连「恢复默认」都恢复不回来。
 * 只读之后改动就只能是造一个新对象，这条约束由编译器执行，不靠人记得。
 */
export interface ExportStyle {
    readonly format: ExportFormat;
    /**
     * 纸张尺寸怎么定：auto＝宽跟编辑区正文栏、高跟内容；fixed＝两边都按下面那两个数。
     *
     * v0.27.0 时这是**两个**开关，判据是「宽和高是两个独立的问题」。合成一个是用户的判决，
     * 而它站得住的理由很具体：高度本来就是**下限**，拖到最小 200 就等于没约束，
     * 于是「只想钉宽度」在一个开关下照样做得到。少一个开关换来的是少一行控件——
     * 在三百二十像素那一列里，每一行都得挣出它占的地方。
     */
    readonly pageMode: PageSizeMode;
    readonly pageWidth: number;
    /**
     * **至少**这么高，不是「就是」这么高。
     *
     * 内容比它高时若按定高裁掉，用户会拿到一张少了半篇的图，而且没有任何提示。
     * 这个模块从第一版起守着同一条——宁可一张完整、稍不好看的图，
     * 也不在不告诉他的情况下截掉后半篇。
     */
    readonly pageHeight: number;
    /** 纸张预设，只在 PDF 下露面。选中即把上面那两个数填成对应像素 */
    readonly paperPreset: PaperPreset;
    /** 导出这张纸用哪一套明暗；auto＝跟随 Obsidian 当前主题 */
    readonly theme: ExportTheme;
    readonly header: string;
    readonly headerAlign: ExportAlign;
    /** 页眉与正文标题之间的留白 */
    readonly headerGap: number;
    /**
     * 页眉文字的颜色。**空串＝跟随正文色**，也就是升级之前唯一的行为。
     *
     * 留一个空态而不是给它一个具体的默认色，是因为这两件事不可互相表达：
     * 「跟随主题」在明暗两套配色下各自成立，而任何一个写死的色号只在其中一套里成立。
     * 用户挑了色就是他要压过主题，没挑就该跟着主题走——默认值必须是后者。
     */
    readonly headerColor: string;
    /**
     * 页眉整行指向的网址，空即没有链接。
     *
     * 它只在 PDF 里成立：PNG 是一张位图，「可点」这个概念在它那里不存在。
     * 因此这不是一个「格式支持度不同」的可选增强，而是**必须在界面上说清**的一条事实——
     * 用户在 PNG 下填了它却什么都没发生时，他会以为是链接写错了。
     */
    readonly headerLink: string;
    readonly footer: string;
    readonly footerAlign: ExportAlign;
    /** 页脚与正文末尾之间的留白 */
    readonly footerGap: number;
    readonly footerColor: string;
    readonly footerLink: string;
    readonly watermark: string;
    /** 水印文字的颜色。空串＝跟随正文色。标志自带颜色，不受它影响 */
    readonly watermarkColor: string;
    /**
     * 这一段开不开。三个开关是 v0.30.0 新增的，它们把「关闭」从一个**推断**变成一个**声明**。
     *
     * 此前「关掉页眉」的唯一办法是把文字和标志尺寸都清空——于是想临时不要页眉的人，
     * 得先把自己写好的那行字删掉。开关让他保住那行字。
     * 它同时是面板能压缩到六行的根据：关着的段落，下面那一堆控件根本不画。
     *
     * 升级时它们在 data.json 里并不存在，默认**不能**取 false（所有人的页眉页脚水印会一夜消失），
     * 也不能取 true（空内容的段落会平白展开）。正确的默认是从内容推导：有东西就是开着。
     */
    readonly headerEnabled: boolean;
    readonly footerEnabled: boolean;
    readonly watermarkEnabled: boolean;
    readonly watermarkMode: WatermarkMode;
    readonly watermarkAnchor: WatermarkAnchor;
    readonly watermarkSize: number;
    /** 平铺时是两列之间的距离；单个时是离左右纸边的距离 */
    readonly watermarkGapX: number;
    /** 平铺时是两行之间的距离；单个时是离上下纸边的距离 */
    readonly watermarkGapY: number;
    readonly watermarkAngle: number;
    /** 百分数。水印的成败全在这个数：太淡等于没有，太浓等于毁了正文 */
    readonly watermarkOpacity: number;
    /**
     * 品牌标志的库内路径，空即没有标志。
     *
     * 只有一个而不是三个——你只有一个 logo，让人在三处各选一遍同一张图不是灵活，是重复劳动。
     * 三处各自用下面那个尺寸决定放多大，**0 就是这一处不放**；
     * 这与「文字留空即关闭」是同一条语法，学员不必为标志再学一套开关。
     */
    readonly logo: string;
    readonly headerLogoSize: number;
    readonly footerLogoSize: number;
    readonly watermarkLogoSize: number;
}

/**
 * 默认值刻意等于 v0.23.0 那套写死的观感（-28 度、14% 不透明度），
 * 于是老用户升级后第一次打开预览，看见的就是他已经熟悉的那张图，而不是一张陌生的。
 */
export const DEFAULT_EXPORT_STYLE: ExportStyle = {
    format: 'png',
    // 默认跟着走：升级之后不选任何东西的人，导出的那张图与升级前逐像素相同
    pageMode: 'auto',
    pageWidth: 800,
    pageHeight: 1_200,
    paperPreset: 'free',
    // 跟随：升级之后不选任何东西的人，导出的底色与升级前一模一样
    theme: 'auto',
    header: '',
    headerAlign: 'center',
    headerGap: 24,
    footer: '',
    footerAlign: 'center',
    footerGap: 32,
    watermark: '',
    watermarkMode: 'tile',
    watermarkAnchor: 'bottom-right',
    watermarkSize: 18,
    watermarkGapX: 140,
    watermarkGapY: 100,
    watermarkAngle: -28,
    watermarkOpacity: 14,
    // 三处颜色默认空串＝跟随正文色，也就是升级之前唯一的行为
    headerColor: '',
    headerLink: '',
    footerColor: '',
    footerLink: '',
    watermarkColor: '',
    // 三个开关的默认值只在「全新的库」这一种情况下用得上；
    // 老库升级走的是 normalizeExportStyle 里那条「有东西就是开着」的推导
    headerEnabled: false,
    footerEnabled: false,
    watermarkEnabled: false,
    logo: '',
    // 三个尺寸默认 0：老库升级之后，没选过标志的人导出的那张图与升级前逐像素相同。
    // 新功能的默认值应当是「不发生」，而不是「替他做了个决定」。
    headerLogoSize: 0,
    footerLogoSize: 0,
    watermarkLogoSize: 0,
};

// ============================================================
// 滑块规格：界面范围与验形区间的唯一事实源
// ============================================================

/**
 * 能用滑块调的键，由 ExportStyle 的数字字段**推导**而来而不是另抄一份。
 * 于是往契约里加一个数字字段，编译器会立刻在下面的种子表上指出「你还没给它一根滑块」。
 */
export type ExportSliderKey = {
    [K in keyof ExportStyle]: ExportStyle[K] extends number ? K : never;
}[keyof ExportStyle];

export interface ExportSliderSpec {
    readonly key: ExportSliderKey;
    /** 归哪一段：决定它出现在面板的哪一组下面 */
    readonly section: 'page' | 'header' | 'footer' | 'watermark';
    /** 面板上那一列名字。**必须短**——它占的是一条 68px 的定宽列，长了就得换行，一换行整列就不齐了 */
    readonly name: string;
    /** 完整说明。它不常驻在屏幕上，只在鼠标停到名字上时才出现——那一行灰字才是吃掉面板高度的大头 */
    readonly desc: string;
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly unit: string;
    /**
     * 这根滑块得先有什么，才谈得上有意义：
     * text 只作用于文字（字号），logo 只作用于标志（标志大小），mark 作用于整个标记（间距、角度…），
     * switch 表示「归它自己那个开关管」——纸宽与纸高各有各的自适应/自定开关，
     * 通用的那套判断（这一段有没有字、有没有图）对它们一句都不适用，因此明写成第四种取值，
     * 而不是硬塞进前三种里的某一个。
     *
     * 它不是装饰性的元数据——界面照它决定谁该变灰。没有它的话，
     * 「文字留空时把标志大小也一起禁掉」这种 bug 会让用户永远打不开标志：
     * 要开标志得先拖那根滑块，而那根滑块恰恰被关着。
     */
    readonly requires: 'text' | 'logo' | 'mark' | 'switch';
}

export const EXPORT_SLIDERS: readonly ExportSliderSpec[] = [
    {
        key: 'pageWidth',
        section: 'page',
        name: '宽',
        desc: '整张纸多宽（含左右页边）。正文栏＝纸宽减去两侧页边。',
        min: 320,
        max: 2_400,
        step: 10,
        unit: 'px',
        requires: 'switch',
    },
    {
        key: 'pageHeight',
        section: 'page',
        name: '高',
        desc: '内容不足时补到这么高；内容更高时照样往下长，绝不裁掉。',
        min: 200,
        max: 4_000,
        step: 10,
        unit: 'px',
        requires: 'switch',
    },
    {
        key: 'headerLogoSize',
        section: 'header',
        name: '标志',
        desc: '页眉里那枚标志多高。0 就是页眉不放标志。',
        min: 0,
        max: 160,
        step: 2,
        unit: 'px',
        requires: 'logo',
    },
    {
        key: 'headerGap',
        section: 'header',
        name: '间距',
        desc: '页眉离标题多远。0 就是紧贴着标题。',
        min: 0,
        max: 120,
        step: 2,
        unit: 'px',
        requires: 'mark',
    },
    {
        key: 'footerLogoSize',
        section: 'footer',
        name: '标志',
        desc: '页脚里那枚标志多高。0 就是页脚不放标志。',
        min: 0,
        max: 160,
        step: 2,
        unit: 'px',
        requires: 'logo',
    },
    {
        key: 'footerGap',
        section: 'footer',
        name: '间距',
        desc: '页脚离最后一行多远。',
        min: 0,
        max: 120,
        step: 2,
        unit: 'px',
        requires: 'mark',
    },
    {
        key: 'watermarkLogoSize',
        section: 'watermark',
        name: '标志',
        desc: '水印里那枚标志多高。0 就是水印只有文字。',
        min: 0,
        max: 320,
        step: 4,
        unit: 'px',
        requires: 'logo',
    },
    {
        key: 'watermarkSize',
        section: 'watermark',
        name: '字号',
        desc: '水印文字本身多大。',
        min: 10,
        max: 120,
        step: 1,
        unit: 'px',
        requires: 'text',
    },
    {
        key: 'watermarkGapX',
        section: 'watermark',
        name: '横向',
        desc: '平铺时是左右两个水印之间的距离；单个时是离左右纸边的距离。',
        min: 0,
        max: 480,
        step: 4,
        unit: 'px',
        requires: 'mark',
    },
    {
        key: 'watermarkGapY',
        section: 'watermark',
        name: '纵向',
        desc: '平铺时是上下两个水印之间的距离；单个时是离上下纸边的距离。',
        min: 0,
        max: 480,
        step: 4,
        unit: 'px',
        requires: 'mark',
    },
    {
        key: 'watermarkAngle',
        section: 'watermark',
        name: '角度',
        desc: '负数往左倒，正数往右倒，0 是水平。标志与文字一起转。',
        min: -90,
        max: 90,
        step: 1,
        unit: '°',
        requires: 'mark',
    },
    {
        key: 'watermarkOpacity',
        section: 'watermark',
        name: '透明',
        desc: '越低越像纸纹，越高越难被裁掉——但也越挡字。标志与文字同一个数。',
        min: 1,
        max: 100,
        step: 1,
        unit: '%',
        requires: 'mark',
    },
];

// ============================================================
// 读取侧兜底
// ============================================================

/** 持久化 JSON 只在这里被当作未知输入；出去之后每个字段都已经是契约形态 */
export function normalizeExportStyle(input: unknown): ExportStyle {
    const stored = isRecord(input) ? input : {};
    // 七个默认值显式列一遍而不是遍历生成：Record 的完整性由编译器检查，
    // 于是「加了字段却忘了给它验形」会在编译期就断，而不是等用户的 data.json 里出现一个 NaN。
    const numbers: Record<ExportSliderKey, number> = {
        headerGap: DEFAULT_EXPORT_STYLE.headerGap,
        footerGap: DEFAULT_EXPORT_STYLE.footerGap,
        watermarkSize: DEFAULT_EXPORT_STYLE.watermarkSize,
        watermarkGapX: DEFAULT_EXPORT_STYLE.watermarkGapX,
        watermarkGapY: DEFAULT_EXPORT_STYLE.watermarkGapY,
        watermarkAngle: DEFAULT_EXPORT_STYLE.watermarkAngle,
        watermarkOpacity: DEFAULT_EXPORT_STYLE.watermarkOpacity,
        pageWidth: DEFAULT_EXPORT_STYLE.pageWidth,
        pageHeight: DEFAULT_EXPORT_STYLE.pageHeight,
        headerLogoSize: DEFAULT_EXPORT_STYLE.headerLogoSize,
        footerLogoSize: DEFAULT_EXPORT_STYLE.footerLogoSize,
        watermarkLogoSize: DEFAULT_EXPORT_STYLE.watermarkLogoSize,
    };

    for (const spec of EXPORT_SLIDERS) {
        numbers[spec.key] = clampSlider(stored[spec.key], spec, numbers[spec.key]);
    }

    return {
        format: isFormat(stored.format) ? stored.format : DEFAULT_EXPORT_STYLE.format,
        pageMode: isPageSizeMode(stored.pageMode) ? stored.pageMode : DEFAULT_EXPORT_STYLE.pageMode,
        pageWidth: numbers.pageWidth,
        pageHeight: numbers.pageHeight,
        paperPreset: isPaperPreset(stored.paperPreset)
            ? stored.paperPreset
            : DEFAULT_EXPORT_STYLE.paperPreset,
        theme: isExportTheme(stored.theme) ? stored.theme : DEFAULT_EXPORT_STYLE.theme,
        header: text(stored.header, DEFAULT_EXPORT_STYLE.header),
        headerAlign: isAlign(stored.headerAlign) ? stored.headerAlign : DEFAULT_EXPORT_STYLE.headerAlign,
        headerGap: numbers.headerGap,
        footer: text(stored.footer, DEFAULT_EXPORT_STYLE.footer),
        footerAlign: isAlign(stored.footerAlign) ? stored.footerAlign : DEFAULT_EXPORT_STYLE.footerAlign,
        footerGap: numbers.footerGap,
        watermark: text(stored.watermark, DEFAULT_EXPORT_STYLE.watermark),
        watermarkMode: isMode(stored.watermarkMode) ? stored.watermarkMode : DEFAULT_EXPORT_STYLE.watermarkMode,
        watermarkAnchor: isAnchor(stored.watermarkAnchor)
            ? stored.watermarkAnchor
            : DEFAULT_EXPORT_STYLE.watermarkAnchor,
        watermarkSize: numbers.watermarkSize,
        watermarkGapX: numbers.watermarkGapX,
        watermarkGapY: numbers.watermarkGapY,
        watermarkAngle: numbers.watermarkAngle,
        watermarkOpacity: numbers.watermarkOpacity,
        headerColor: color(stored.headerColor),
        headerLink: text(stored.headerLink, DEFAULT_EXPORT_STYLE.headerLink),
        footerColor: color(stored.footerColor),
        footerLink: text(stored.footerLink, DEFAULT_EXPORT_STYLE.footerLink),
        watermarkColor: color(stored.watermarkColor),
        headerEnabled: enabled(stored.headerEnabled, stored.header, stored.headerLogoSize, stored.headerLink),
        footerEnabled: enabled(stored.footerEnabled, stored.footer, stored.footerLogoSize, stored.footerLink),
        watermarkEnabled: enabled(stored.watermarkEnabled, stored.watermark, stored.watermarkLogoSize),
        logo: text(stored.logo, DEFAULT_EXPORT_STYLE.logo),
        headerLogoSize: numbers.headerLogoSize,
        footerLogoSize: numbers.footerLogoSize,
        watermarkLogoSize: numbers.watermarkLogoSize,
    };
}

/**
 * 越界的数字**夹回区间**而不是回落默认：手改过 data.json 的人想要的是「尽量大」，
 * 把 999 读成默认的 140 会让他以为设置没保存，夹成上限 480 才是回答了他的意图。
 * 但不是数字、是 NaN 或是 Infinity 时没有意图可言，那时才回落默认。
 */
function clampSlider(value: unknown, spec: ExportSliderSpec, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;

    return Math.min(spec.max, Math.max(spec.min, Math.round(value)));
}

function text(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

/**
 * 颜色只认十六进制色号，其余一律回落空串（＝跟随正文色）。
 *
 * 收得这么紧是因为这个值会被直接写进 SVG 的 fill 与元素的 style。
 * 放任意字符串进来，一条 `red; content: url(...)` 就成了一次样式注入；
 * 而验形失败时回落成「跟随主题」，用户看见的是颜色没变，不是一篇渲染坏掉的导出。
 */
function color(value: unknown): string {
    return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value.trim())
        ? value.trim().toLowerCase()
        : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExportTheme(value: unknown): value is ExportTheme {
    return value === 'auto' || value === 'light' || value === 'dark';
}

/**
 * 这一段开着还是关着。
 *
 * 键**不存在**时不能取 false，那会让所有升级上来的用户的页眉页脚水印一夜消失；
 * 也不能取 true，那会让空内容的段落平白展开。唯一对的默认是从内容推导：
 * 文字、标志或页眉页脚的链接还在，说明它本来就在显示；只填链接时原本也会印出网址。
 */
function enabled(flag: unknown, text: unknown, logoSize: unknown, link?: unknown): boolean {
    if (typeof flag === 'boolean') return flag;

    const hasText = typeof text === 'string' && text.trim() !== '';
    const hasLogo = typeof logoSize === 'number' && logoSize > 0;
    const hasLink = typeof link === 'string' && link.trim() !== '';

    return hasText || hasLogo || hasLink;
}

function isPaperPreset(value: unknown): value is PaperPreset {
    return value === 'free' || value === 'a4' || value === 'a3';
}

function isPageSizeMode(value: unknown): value is PageSizeMode {
    return value === 'auto' || value === 'fixed';
}

function isFormat(value: unknown): value is ExportFormat {
    return value === 'png' || value === 'pdf';
}

function isAlign(value: unknown): value is ExportAlign {
    return value === 'left' || value === 'center' || value === 'right';
}

function isMode(value: unknown): value is WatermarkMode {
    return value === 'tile' || value === 'single';
}

function isAnchor(value: unknown): value is WatermarkAnchor {
    return typeof value === 'string' &&
        WATERMARK_ANCHOR_GRID.some((row) => row.some((anchor) => anchor === value));
}
