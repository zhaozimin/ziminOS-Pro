/**
 * [INPUT]: 依赖 obsidian 的 PluginSettingTab 基类、Setting 构建器、setIcon 与 Platform；
 *          依赖 ./settingsModel 的 TABS/TEXTS/TEXT_FIELDS/BOOK_TAG_PREFIX_FIELD 与它们的类型、
 *          ./core/commands 的 GROUP_COLORS、./core/constants 的灵感默认值/插入位置与 BOOK_TAG_COUNTS、
 *          ./core/markdownStyle 的 FORMAT_RULES、./core/types 的 ZiminosContext/DEFAULT_SETTINGS
 * [OUTPUT]: 对外提供 ZiminosSettingTab 与它的注入契约 SettingActions，由 main.ts 在装配末尾挂载
 * [POS]: 插件唯一的图形界面，也是「人主导」这条红线的具象化——开荒只在用户按下按钮时发生，
 *        两个自动行为、以及状态栏那个常驻按钮，随时都可以关掉。
 *        本文件只回答「它怎么画出来」；「这一页有什么」住在 ./settingsModel。
 *        两者 v0.14.0 分家，判据是变更理由不同：加一个设置项、改一句文案动的是那边的表，
 *        改滚动行为、改标签栏样式动的是这边的类。分家之前它逼近一千行，
 *        而单文件 ≤800 行这条约束的用处正在于此——它先于人察觉到一个文件在同时干两件事。
 *        它只读写 ctx.settings 并调 ctx.saveSettings，不持有任何领域状态：
 *        每次 display 都从设置对象重新渲染，因此外部改动天然可见。
 *        V3 起页面按系统模块切成标签页（v0.14.0 起七张），切法不是新发明的分类，就是 modules/ 下的目录本身——
 *        一页只回答一个系统的配置问题，目录名也各自归还给它服务的那个模块，
 *        于是「一页看完就不必再往下翻」，而不是二十来个设置项排成一条长路。
 *        外观开关与作者名片并在「开荒」页里而不各占一页（一个控件撑一整页是把分页做成摆设）：
 *        开关排在初始化之后，名片是页尾落款；名片与首页导航尾部画的是同一张，实现只有一份。
 *        读书笔记那三项并进「项目」页，客户那三项并进「人脉」页（v0.14.0）——
 *        前者因为一本书就是一个项目，后者因为两页加起来只有四个字段；页内切段不切页。
 *        侧边栏那一页不认识任何一条具体命令：清单现读 ctx.commands 的花名册，
 *        因此加一条命令、改一个图标，这个文件一个字都不用改。
 *        开荒动作、微信读书连接/断开、两处显隐同步与作者名片都由 main 注入而非自己 import：
 *        设置页因此既不认识参与开荒的模块名单，也不认识登录窗口、状态栏按钮、边栏图标与名片的实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform, PluginSettingTab, Setting, setIcon } from 'obsidian';
import { GROUP_COLORS } from './core/commands';
import type { CommandSpec } from './core/commands';
import { BOOK_TAG_PREFIX_FIELD, TABS, TEXTS, TEXT_FIELDS } from './settingsModel';
import type {
    BooleanSettingKey,
    SettingsTab,
    TabId,
    TextField,
} from './settingsModel';
import {
    BOOK_TAG_COUNTS,
    INSPIRATION_DEFAULTS,
    INSPIRATION_INSERT_POSITIONS,
} from './core/constants';
import type { InspirationInsertPosition } from './core/constants';
import { FORMAT_RULES } from './core/markdownStyle';
import { DEFAULT_SETTINGS } from './core/types';
import type { ZiminosContext } from './core/types';


// ============================================================
// 注入契约
// ============================================================

/**
 * 设置页干不了、必须由 main 递进来的六件事。
 *
 * 用一个对象而不是五个位置参数：中间两个函数的类型都是 `() => void`，
 * 摆成位置参数的话调换顺序照样能通过编译，出的错却是「改了外观开关，边栏跟着动」——
 * 这种错没有任何编译期信号，只能靠人肉眼盯着两行长长的实参对齐。
 */
export interface SettingActions {
    /** 执行一次开荒。名单住在装配点，设置页因此不认识参与开荒的模块 */
    readonly initialize: () => Promise<void>;
    /**
     * 开微信读书的扫码登录窗口。登录逻辑住在 books 模块，设置页因此不 import 它。
     * 返回是否连上；设置页不看这个值——它连完就整页重建，状态现读设置对象。
     */
    readonly connectWeread: () => Promise<boolean>;
    /** 清掉微信读书持久 Cookie 与同一会话的内存令牌 */
    readonly disconnectWeread: () => Promise<void>;
    /** 让状态栏那个按钮按当前设置重新决定显隐 */
    readonly syncAppearanceSwitch: () => void;
    /** 让左侧边栏那列图标按当前设置重新决定各自显隐 */
    readonly syncRibbon: () => void;
    /** 把作者名片画进开荒页尾。名片住在 about 模块，设置页因此不认识它 */
    readonly renderAbout: (el: HTMLElement) => void;
}

/** 一页除字段之外的自有控件。三张页确实没有，见 panels 表 */
type PanelRenderer = (containerEl: HTMLElement) => void;

/**
 * 复盘与人脉两页除了字段没有别的控件。
 * 写成显式的空实现而不是让它们从 panels 表里缺席，是为了让 Record 的穷尽检查继续成立——
 * 加一张页却忘了写渲染，编译期就过不去，而不是运行时得到一张空白页。
 */
const FIELDS_ONLY: PanelRenderer = () => {};

// ============================================================
// 设置页
// ============================================================

/**
 * ziminOS 设置页。
 * 构造参数只收 ZiminosContext 一个：app 与 plugin 都能从中取出，
 * 设置页因此与 main.ts 共用同一个设置对象与同一个落盘通道，不存在第二份真相。
 */
export class ZiminosSettingTab extends PluginSettingTab {
    private readonly ctx: ZiminosContext;

    /**
     * 五件由 main 注入的事。
     * 设置页只会改设置对象并落盘，它既不知道有哪些模块要参与开荒，
     * 也无从让屏幕上已经画好的按钮与图标自己变——谁画的谁负责收，
     * 这里只负责在改完之后叫一声。
     */
    private readonly actions: SettingActions;

    /**
     * 当前停在哪一页。
     *
     * 这是页面状态而非领域状态，因此刻意不进 data.json——设置对象里存的都是
     * 「这个库是什么样」，而不是「上次那个人翻到了第几页」。
     * 它随本条插件实例存活，也就是关掉设置弹窗再打开仍停在原页、重启 Obsidian 归位，
     * 与 Obsidian 自己记住你上次停在哪个插件设置页是同一档待遇。
     */
    private activeTab: SettingsTab = TABS[0];

    /**
     * 「已摆出 N / 30 条」那行字。
     *
     * 这是全页唯一一处持有 DOM 引用的地方，理由很具体：勾选要即时更新这个数，
     * 而重建整页会把滚动条弹回顶部——三十行排下来，用户勾第十八行时页面一跳，
     * 他就得重新找回刚才那一行。持有的是一个渲染出来的节点，不是第二份状态：
     * 数字仍然现算自设置对象，每次 display 也会把它换成新节点。
     */
    private ribbonCountEl: HTMLElement | null = null;

    /**
     * 每页自己的控件。
     *
     * 用 Record<TabId, …> 而不是可选查表：加一张标签页却忘了写它的渲染，
     * 在这里是一个编译错误，而不是一张点进去空空如也的页。
     */
    private readonly panels: Readonly<Record<TabId, PanelRenderer>> = {
        // 开荒页自有控件两件：初始化按钮，加外观开关的显隐——外观包是开荒交付物的一部分，
        // 它唯一的开关跟着交付物走，不另占一页
        setup: (el) => {
            this.renderInitButton(el);
            this.renderAppearancePanel(el);
        },
        projects: (el) => this.renderProjectsPanel(el),
        inspiration: (el) => this.renderInspirationPanel(el),
        review: FIELDS_ONLY,
        contacts: FIELDS_ONLY,
        format: (el) => this.renderFormatPanel(el),
        ribbon: (el) => this.renderRibbonPanel(el),
    };

    constructor(ctx: ZiminosContext, actions: SettingActions) {
        super(ctx.app, ctx.plugin);

        this.ctx = ctx;
        this.actions = actions;
    }

    /** 每次打开设置页都整体重建，保证显示的永远是设置对象的当前值 */
    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.addClass('ziminos-settings');

        this.renderTabBar(containerEl);
        this.renderPanel(containerEl.createDiv({ cls: 'ziminos-settings-body' }));
    }

    // ============================================================
    // 一、标签栏与分页骨架
    // ============================================================

    /**
     * 标签栏：十枚按钮收进一条分段式控件里，当前页从容器底色上凸起。
     * 分段式而不是十颗散摆的按钮，是因为它们其实只是十个位置——
     * 一条共享的槽把这层语义画了出来，按钮自己反而要卸干净立体外观。
     * 用真的 button 而非 div，键盘与读屏器才认得它。
     */
    private renderTabBar(containerEl: HTMLElement): void {
        const bar = containerEl.createDiv({ cls: 'ziminos-settings-tabs' });
        const rail = bar.createDiv({ cls: 'ziminos-settings-tabrail' });

        for (const tab of TABS) {
            const active = tab.id === this.activeTab.id;
            const button = rail.createEl('button', {
                cls: 'ziminos-settings-tab',
                // aria-pressed 而不是 role=tab：没实现方向键遍历就自称 tablist 是撒谎，
                // 而「一枚按下去的按钮」既属实，读屏器也照样播报得清楚
                attr: { type: 'button', 'aria-pressed': String(active) },
            });

            // 第二个类名走 DOM，不塞进上面那个 cls：一个带空格的类名字符串是被整体赋给
            // className 还是被 classList.add 逐个吞下，取决于 Obsidian 的实现而非它的类型
            if (active) button.addClass('is-active');

            setIcon(button.createSpan({ cls: 'ziminos-settings-tab-icon' }), tab.icon);
            button.createSpan({ text: tab.label });
            button.addEventListener('click', () => this.switchTo(tab));
        }
    }

    /** 换页。同一页再点一次不重建，否则正在编辑的输入框会被换掉 */
    private switchTo(tab: SettingsTab): void {
        if (tab.id === this.activeTab.id) return;

        this.activeTab = tab;
        this.display();
        // 换页等于换一屏内容，滚动条必须归零：从三十行的边栏页切到只有几项的灵感页，
        // 不归零的话用户迎面是一片空白，会以为切坏了。containerEl 就是设置弹窗的滚动容器
        this.containerEl.scrollTop = 0;
    }

    /**
     * 一页的固定骨架：页头 → 明面上的文本字段 → 本页自有控件 → 高级折叠区。
     *
     * 四段的先后是一条跨七页的承诺，两头各占一句：页头永远先说清这一页是谁、跑没跑起来；
     * 折叠区永远在最后，于是任何一页往下翻到底，危险的东西都在同一个位置、同一个标题下，
     * 不需要每页重新找一遍。中间两段的顺序是「先说东西放哪儿，再说怎么用它」——
     * 灵感页把落点三问排在插入位置与格式之前，正是这条顺序，不必自己再画一次字段。
     *
     * 唯一排在折叠区之后的是开荒页尾的作者名片：它不是设置，是这套交付物的落款，
     * 落款排在正文与附录之后，正是它在纸上的位置。
     */
    private renderPanel(body: HTMLElement): void {
        const tab = this.activeTab;

        // 页头图标与标签栏同一枚，只是大一号、着强调色——它是整页唯一的一处强调色锚点
        const header = new Setting(body).setDesc(tab.status).setHeading();
        const title = header.nameEl.createSpan({ cls: 'ziminos-settings-page-title' });

        setIcon(title.createSpan({ cls: 'ziminos-settings-page-icon' }), tab.icon);
        title.createSpan({ text: tab.module });

        this.renderTextFields(body, tab.id, false);
        this.panels[tab.id](body);
        this.renderAdvancedFold(body, tab.id);

        if (tab.id === 'setup') this.renderAboutFooter(body);
    }

    /**
     * 开荒页尾的作者名片。
     * 名片画什么由 about 模块决定，这里只递一个容器过去；
     * 首页导航尾部那个「关于作者」视图块画的是同一张，两处不可能对不齐。
     */
    private renderAboutFooter(body: HTMLElement): void {
        const footer = body.createDiv({ cls: 'ziminos-settings-footer' });

        footer.createDiv({ cls: 'ziminos-settings-footer-title', text: '关于作者' });
        this.actions.renderAbout(footer);
    }

    // ============================================================
    // 二、通用控件：开关、文本框、折叠区
    // ============================================================

    /**
     * 渲染一个布尔开关。
     *
     * 改动立即落盘。两个自动化开关不需要 onApplied——监听方每次触发都现读设置，
     * 天然看得见新值；只有已经画在屏幕上的东西（状态栏按钮）才需要有人去推它一把。
     */
    private renderToggle(
        containerEl: HTMLElement,
        key: BooleanSettingKey,
        name: string,
        desc: string,
        onApplied?: () => void,
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle((toggle) => {
                toggle.setValue(this.ctx.settings[key]).onChange(async (value) => {
                    this.ctx.settings[key] = value;

                    await this.ctx.saveSettings();
                    onApplied?.();
                });
            });
    }

    /**
     * 画出本页某一档（明面/高级）的全部文本字段。没有就一个都不画，也不留空标题。
     * 带段名的字段在段名一变时先落一道小标题——人脉页靠它把「人脉」与「客户」分开，
     * 而绝大多数页一个段名都没有，于是一道标题也不会多出来。
     */
    private renderTextFields(containerEl: HTMLElement, tab: TabId, advanced: boolean): void {
        const fields = TEXT_FIELDS.filter(
            (field) => field.tab === tab && field.advanced === advanced,
        );
        let currentSection = '';

        for (const field of fields) {
            const section = field.section ?? '';

            if (section && section !== currentSection) {
                new Setting(containerEl).setName(section).setHeading();
            }

            currentSection = section;
            this.renderTextField(containerEl, field);
        }
    }

    /**
     * 本页的高级折叠区。默认折叠，本页没有高级字段就整块不出现——
     * 一个点开来是空的折叠区，比没有这个折叠区更让人怀疑自己漏了什么。
     */
    private renderAdvancedFold(containerEl: HTMLElement, tab: TabId): void {
        const hasAdvanced = TEXT_FIELDS.some((field) => field.tab === tab && field.advanced);

        if (!hasAdvanced) return;

        const details = containerEl.createEl('details', { cls: 'ziminos-advanced' });

        details.createEl('summary', { text: TEXTS.advancedHeading });
        this.renderTextFields(details, tab, true);
    }

    /**
     * 渲染一个文本框。
     * 这里刻意不做清洗与校验：留空或写错的值由各功能模块在使用时回落到默认值，
     * 校验集中在读取侧，设置页只负责如实记录用户敲进去的字。
     */
    private renderTextField(containerEl: HTMLElement, field: TextField): void {
        const fallback: string = DEFAULT_SETTINGS[field.key];
        // 明面上的字段只说它是什么；高级字段还要多说一句默认值，那是「改前三思」的依据
        const desc = field.advanced
            ? `${field.hint}${TEXTS.advancedSuffixPrefix}${fallback}${TEXTS.advancedSuffixTail}`
            : field.hint;

        new Setting(containerEl)
            .setName(field.name)
            .setDesc(desc)
            .addText((text) => {
                text.setPlaceholder(fallback)
                    .setValue(this.ctx.settings[field.key])
                    .onChange(async (value) => {
                        this.ctx.settings[field.key] = value;

                        await this.ctx.saveSettings();
                    });
            });
    }

    // ============================================================
    // 三、开荒页：一个按钮
    // ============================================================

    /**
     * 开荒按钮：一句状态说明 + 一个按钮。
     * 按钮点下后先禁用再执行，防止连点开出两次流程；完成后重建整个面板，
     * 状态说明随之从「尚未初始化」翻面成「已就绪」——停留的页不变，重建的是内容。
     */
    private renderInitButton(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(TEXTS.initName)
            .setDesc(this.describeInitState())
            .addButton((button) => {
                button
                    .setButtonText(TEXTS.initButton)
                    .setCta()
                    .onClick(async () => {
                        button.setDisabled(true);

                        try {
                            // 开荒自己吃掉全部异常并以 Notice 汇报，这里不需要再判断成败
                            await this.actions.initialize();
                        } finally {
                            // 重建面板即刷新状态；旧按钮随 containerEl 一起丢弃，无需解禁
                            this.display();
                        }
                    });
            });
    }

    /** 用 initializedAt 是否为空来决定说什么：这是「首次开荒」与「幂等补齐」的唯一判据 */
    private describeInitState(): string {
        const { initializedAt } = this.ctx.settings;

        if (!initializedAt) return TEXTS.initPending;

        return TEXTS.initReadyPrefix + initializedAt + TEXTS.initReadySuffix;
    }

    // ============================================================
    // 四、项目页：两个自动行为，加读书笔记那一段
    // ============================================================

    /** 插件仅有的两个常驻监听都住在 modules/projects，所以它们的开关也该在这一页 */
    private renderProjectsPanel(containerEl: HTMLElement): void {
        this.renderToggle(containerEl, 'autoCardInit', TEXTS.autoCardName, TEXTS.autoCardDesc);
        this.renderToggle(containerEl, 'autoUpdated', TEXTS.autoUpdatedName, TEXTS.autoUpdatedDesc);
        this.renderBooksSection(containerEl);
    }

    /**
     * 读书笔记的三项设置，同住项目页——一本书就是一个项目，不另开一页。
     *
     * 三项按「书建出来长什么样 → 划线从哪儿来」排：前两项决定标签怎么写，
     * 第三项是全插件唯一一处凭据的开关。书目字段（作者、ISBN、出版社）一项都不在这里，
     * 因为它们没有口味可言——豆瓣怎么写就怎么落，让人去配等于让人去改事实。
     */
    private renderBooksSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(TEXTS.booksHeading).setDesc(TEXTS.booksIntro).setHeading();

        this.renderTextField(containerEl, BOOK_TAG_PREFIX_FIELD);

        new Setting(containerEl)
            .setName(TEXTS.bookTagCountName)
            .setDesc(TEXTS.bookTagCountDesc)
            .addDropdown((dropdown) => {
                for (const count of BOOK_TAG_COUNTS) {
                    dropdown.addOption(String(count), count === 0 ? '不写标签' : `前 ${count} 个`);
                }

                dropdown
                    .setValue(String(this.normalizeBookTagCount(this.ctx.settings.bookTagCount)))
                    .onChange(async (value) => {
                        this.ctx.settings.bookTagCount = this.normalizeBookTagCount(Number(value));

                        await this.ctx.saveSettings();
                    });
            });

        this.renderWereadRow(containerEl);
    }

    /** 防御手改 data.json 写进来的怪数：不在候选里就回落默认，与灵感插入位置同一姿态 */
    private normalizeBookTagCount(value: number): number {
        return BOOK_TAG_COUNTS.includes(value) ? value : DEFAULT_SETTINGS.bookTagCount;
    }

    /**
     * 微信读书的连接状态，加一个按钮。
     *
     * 它是设置而不只是命令，理由是「人主导」：这是全插件唯一一份存在 data.json 里的凭据，
     * 那就必须有一处能看见它在不在、并且能当场撤掉。命令面板里那条「连接微信读书」
     * 只能连不能断——一条只往一个方向走的命令，不构成开关。
     * 断开只清掉本机存的那串 Cookie，不去动微信读书那边的任何东西：
     * 插件从来不代替用户管理他在别人家的账号。
     */
    private renderWereadRow(containerEl: HTMLElement): void {
        const connected = !!this.ctx.settings.wereadCookie.trim();

        new Setting(containerEl)
            .setName(TEXTS.wereadName)
            .setDesc(
                Platform.isDesktopApp
                    ? connected
                        ? TEXTS.wereadConnected
                        : TEXTS.wereadDisconnected
                    : TEXTS.wereadMobile,
            )
            .addButton((button) => {
                button.setButtonText(connected ? '断开' : '扫码连接').setDisabled(!Platform.isDesktopApp);

                if (!connected) button.setCta();

                button.onClick(async () => {
                    button.setDisabled(true);

                    try {
                        if (connected) {
                            await this.actions.disconnectWeread();
                        } else {
                            await this.actions.connectWeread();
                        }
                    } finally {
                        // 重建整页即刷新状态；旧按钮随 containerEl 一起丢弃，无需解禁
                        this.display();
                    }
                });
            });
    }

    // ============================================================
    // 五、灵感页：落点、位置与格式
    // ============================================================

    /**
     * 灵感页上的每一项都是「记录灵感」命令的下一次运行参数。
     * 落点那三个文本框已由骨架照字段表画在上方，这里只补两个非文本控件。
     */
    private renderInspirationPanel(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(TEXTS.inspirationPositionName)
            .setDesc(TEXTS.inspirationPositionDesc)
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('heading-top', '标题下方（新内容在前）')
                    .addOption('heading-bottom', '标题区末尾（新内容在后）')
                    .addOption('file-top', '正文顶部')
                    .addOption('file-bottom', '正文底部')
                    .setValue(this.normalizeInspirationPosition(this.ctx.settings.inspirationInsertPosition))
                    .onChange(async (value) => {
                        const position = this.normalizeInspirationPosition(value);

                        this.ctx.settings.inspirationInsertPosition = position;
                        await this.ctx.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName(TEXTS.inspirationFormatName)
            .setDesc(TEXTS.inspirationFormatDesc)
            .addTextArea((textArea) => {
                textArea
                    .setPlaceholder(INSPIRATION_DEFAULTS.format)
                    .setValue(this.ctx.settings.inspirationFormat)
                    .onChange(async (value) => {
                        this.ctx.settings.inspirationFormat = value;
                        await this.ctx.saveSettings();
                    });
                textArea.inputEl.rows = 3;
                textArea.inputEl.style.width = '100%';
            });
    }

    /** 防御手改 data.json 产生的未知枚举值，设置面板与写入模块保持同一回落策略 */
    private normalizeInspirationPosition(value: string): InspirationInsertPosition {
        const candidate = value as InspirationInsertPosition;

        return INSPIRATION_INSERT_POSITIONS.includes(candidate)
            ? candidate
            : INSPIRATION_DEFAULTS.insertPosition;
    }

    // ============================================================
    // 六、排版页：一个自动开关，加九条规则
    // ============================================================

    /**
     * 排版页：先决定「要不要替我按」，再决定「按下去做哪几件事」。
     *
     * 两者刻意不合成一个开关：自动整理关掉之后，命令仍然照这九条勾选执行——
     * 规则回答的是「标准写法是什么」，自动回答的是「谁来按」，把它们绑在一起，
     * 就没法表达「我自己按，但按下去要全套」这个再正常不过的用法。
     */
    private renderFormatPanel(containerEl: HTMLElement): void {
        this.renderToggle(
            containerEl,
            'autoFormat',
            TEXTS.autoFormatName,
            TEXTS.autoFormatDesc,
        );

        new Setting(containerEl)
            .setName(TEXTS.formatRulesHeading)
            .setDesc(TEXTS.formatRulesIntro)
            .setHeading();

        for (const rule of FORMAT_RULES) {
            this.renderRuleRow(containerEl, rule.key, rule.name, rule.desc);
        }
    }

    /**
     * 一条规则一行。
     *
     * 它与边栏那三十行是同一种控件——勾选决定一个 id 在不在清单里，而不是翻一个布尔字段。
     * 存清单而不是九个布尔字段，是为了让「加一条规则」不必动设置契约：
     * 老库升级时那条新规则不在清单里，于是默认不开，这与「不替用户改他没选过的东西」同源。
     */
    private renderRuleRow(
        containerEl: HTMLElement,
        key: string,
        name: string,
        desc: string,
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle((toggle) => {
                toggle.setValue(this.ctx.settings.formatRules.includes(key)).onChange(async (value) => {
                    this.ctx.settings.formatRules = this.nextFormatRules(key, value);

                    await this.ctx.saveSettings();
                });
            });
    }

    /**
     * 算出勾选之后的新清单。
     *
     * 与 nextRibbonCommands 同法同因：照 FORMAT_RULES 重排一遍而不是往旧数组里增删，
     * 于是顺序永远等于规则表的顺序，data.json 里混进的不认识的 id 也在第一次勾选时被扫掉。
     * 返回新数组，绝不原地改——它在用户没调过时与 DEFAULT_SETTINGS 共用引用。
     */
    private nextFormatRules(key: string, enabled: boolean): readonly string[] {
        const chosen = new Set(this.ctx.settings.formatRules);

        if (enabled) chosen.add(key);
        else chosen.delete(key);

        return FORMAT_RULES.map((rule) => rule.key).filter((candidate) => chosen.has(candidate));
    }

    // ============================================================
    // 七、外观开关：一个开关，随开荒页交付
    // ============================================================

    /** 这一页管的是「右下角要不要常驻这个按钮」，不管片段本身开着还是关着 */
    private renderAppearancePanel(containerEl: HTMLElement): void {
        this.renderToggle(
            containerEl,
            'showAppearanceSwitch',
            TEXTS.appearanceSwitchName,
            TEXTS.appearanceSwitchDesc,
            this.actions.syncAppearanceSwitch,
        );
    }

    // ============================================================
    // 八、边栏页：三十行
    // ============================================================

    /**
     * 边栏页：一句说明 + 按分组排下来的三十行。
     *
     * 清单现读花名册而不是自己维护一份，因此它与命令面板里能搜到的命令永远是同一批；
     * 分组标题按「相邻两行的 group 不同」切出来，与外观开关面板用的是同一套画法——
     * 分组顺序不需要另一张表，它就是命令的注册顺序。
     */
    private renderRibbonPanel(containerEl: HTMLElement): void {
        const summary = new Setting(containerEl)
            .setName(this.describeRibbonCount())
            .setDesc(TEXTS.ribbonIntro);

        this.ribbonCountEl = summary.nameEl;

        let currentGroup = '';

        for (const command of this.ctx.commands.list()) {
            if (command.spec.group !== currentGroup) {
                currentGroup = command.spec.group;
                containerEl.createDiv({ cls: 'ziminos-ribbon-group', text: currentGroup });
            }

            this.renderRibbonRow(containerEl, command.spec);
        }
    }

    /** 只改那一个数字，不重建页面——重建会把滚动条弹回顶部 */
    private refreshRibbonCount(): void {
        if (this.ribbonCountEl) this.ribbonCountEl.setText(this.describeRibbonCount());
    }

    /**
     * 「已摆出 7 / 30 条」。给的是一个量级感：勾多了那条边栏会变成谁也不看的图标柱。
     * 总数现算自花名册，不写死——这一页不认识任何一条具体命令，也就不该认识它们有几条。
     */
    private describeRibbonCount(): string {
        const total = this.ctx.commands.list().length;

        return (
            TEXTS.ribbonCountPrefix +
            this.ctx.settings.ribbonCommands.length +
            TEXTS.ribbonCountSeparator +
            total +
            TEXTS.ribbonCountSuffix
        );
    }

    /** 一行：图标 + 命令名 + 开关。图标带着它的分组功能色，就是它在边栏上的样子，勾之前先看见 */
    private renderRibbonRow(containerEl: HTMLElement, spec: CommandSpec): void {
        const { id, icon, name } = spec;
        const label = createFragment((frag) => {
            const iconEl = frag.createSpan({ cls: 'ziminos-ribbon-icon' });

            setIcon(iconEl, icon);
            // 与边栏同一张色表：这一行的图标就是按钮本人，颜色自然也得是本人的
            iconEl.style.color = GROUP_COLORS[spec.group];
            frag.createSpan({ text: name });
        });

        new Setting(containerEl)
            .setName(label)
            .setClass('ziminos-ribbon-row')
            .addToggle((toggle) => {
                toggle
                    .setValue(this.ctx.settings.ribbonCommands.includes(id))
                    .onChange(async (value) => {
                        this.ctx.settings.ribbonCommands = this.nextRibbonCommands(id, value);

                        await this.ctx.saveSettings();
                        this.actions.syncRibbon();
                        this.refreshRibbonCount();
                    });
            });
    }

    /**
     * 算出勾选之后的新清单。
     *
     * 一律照花名册重排一遍而不是往旧数组里增删：其一，边栏顺序因此永远等于命令的注册顺序，
     * 与用户先勾哪个无关；其二，data.json 里若混进了不认识的 id（换过版本、手改过文件），
     * 第一次勾选就顺手扫掉，不会留一条永远没人认领的记录。
     * 返回的是新数组，绝不原地改——ribbonCommands 在用户没调过时与 DEFAULT_SETTINGS 共用引用。
     */
    private nextRibbonCommands(id: string, enabled: boolean): readonly string[] {
        const chosen = new Set(this.ctx.settings.ribbonCommands);

        if (enabled) chosen.add(id);
        else chosen.delete(id);

        return this.ctx.commands
            .list()
            .map((command) => command.spec.id)
            .filter((candidate) => chosen.has(candidate));
    }
}
