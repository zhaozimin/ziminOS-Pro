/**
 * [INPUT]: 依赖 obsidian 的 Platform、Setting 与 setIcon；依赖 ./settingsModel 的 TEXTS/
 *          BOOK_TAG_PREFIX_FIELD/FOLDER_COUNT_LABELS/RECENT_SORT_LABELS 与
 *          TabId/BooleanSettingKey/TextField/SettingActions 类型；
 *          依赖 core/commands 的 GROUP_COLORS 与 CommandSpec 类型、
 *          core/constants 的 BOOK_TAG_COUNTS/灵感与文件夹计数/最近文件的候选与默认值、
 *          core/markdownStyle 的 FORMAT_RULES、core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 PanelRenderer/PanelHost 两个契约与 SettingsPanels 一个类，
 *           后者交出 render 一张 Record<TabId, PanelRenderer> 表
 * [POS]: 设置页八张页**各自的控件**。隔壁 settings.ts 是骨架：标签栏怎么画、
 *        一页分哪四段、开关与文本框长什么样、折叠区怎么收；这里是每一页在那副骨架里
 *        塞进去的东西——开荒的那颗按钮、项目页的读书一段、编辑页的排版一段、
 *        边栏那三十五行、文件页的三段。
 *        v0.17.0 从 settings.ts 分出来，判据与 v0.14.0 分出 settingsModel.ts 时同一条：
 *        变更理由不同。加一个设置项、给一页多一段，动的是这个文件；
 *        改标签栏样式、改滚动行为、改一页的四段先后，动的是那个文件。
 *        触发点又是那条 ≤800 行——它第二次先于人察觉到一个文件在同时干两件事。
 *        本文件不认识 PluginSettingTab、不碰 containerEl、也不决定任何一页的段落顺序：
 *        它拿到的是「往这个容器里画」，画完就完
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform, Setting, setIcon } from 'obsidian';
import { GROUP_COLORS } from './core/commands';
import type { CommandSpec } from './core/commands';
import {
    BOOK_TAG_COUNTS,
    FOLDER_COUNT_DEFAULTS,
    FOLDER_COUNT_TARGETS,
    INSPIRATION_DEFAULTS,
    INSPIRATION_INSERT_POSITIONS,
    RECENT_FILES_DEFAULTS,
    RECENT_FILES_LIMITS,
    RECENT_FILES_SORTS,
} from './core/constants';
import type {
    FolderCountTarget,
    InspirationInsertPosition,
    RecentFilesSort,
} from './core/constants';
import { FORMAT_RULES } from './core/markdownStyle';
import { DEFAULT_SETTINGS } from './core/types';
import type { ZiminosContext } from './core/types';
import {
    BOOK_TAG_PREFIX_FIELD,
    FOLDER_COUNT_LABELS,
    RECENT_SORT_LABELS,
    TEXTS,
} from './settingsModel';
import type {
    BooleanSettingKey,
    SettingActions,
    TabId,
    TextField,
} from './settingsModel';

/** 一页除骨架画的字段之外的自有控件。三张页确实没有，见 render 表 */
export type PanelRenderer = (containerEl: HTMLElement) => void;

/**
 * 面板向骨架借的四样东西。
 *
 * 借而不是各自实现，是为了让「一个开关长什么样」全页面只有一种画法；
 * rebuild 单独列出来是因为只有两处需要它（开荒按钮与微读连接改完状态要翻面），
 * 而重建整页会把滚动条弹回顶部——那个代价必须由知道自己在干什么的人显式付。
 */
export interface PanelHost {
    readonly ctx: ZiminosContext;
    readonly actions: SettingActions;
    renderToggle(
        containerEl: HTMLElement,
        key: BooleanSettingKey,
        name: string,
        desc: string,
        onApplied?: () => void,
    ): void;
    renderTextField(containerEl: HTMLElement, field: TextField): void;
    /** 重建整页。只在状态需要翻面时用，代价是滚动条归零 */
    rebuild(): void;
}

/**
 * 空实现。写成显式的空函数而不是让那几页从 render 表里缺席，
 * 是为了让 Record 的穷尽检查继续成立——加一张页却忘了写渲染，编译期就过不去。
 */
const FIELDS_ONLY: PanelRenderer = () => {};

export class SettingsPanels {
    private readonly host: PanelHost;

    private readonly ctx: ZiminosContext;

    private readonly actions: SettingActions;

    /**
     * 「已摆出 N / 35 条」那行字。
     *
     * 这是全文件唯一一处持有 DOM 引用的地方，理由很具体：勾选要即时更新这个数，
     * 而重建整页会把滚动条弹回顶部——三十五行排下来，用户勾第二十行时页面一跳，
     * 他就得重新找回刚才那一行。持有的是一个渲染出来的节点，不是第二份状态：
     * 数字仍然现算自设置对象，每次重画也会把它换成新节点。
     */
    private ribbonCountEl: HTMLElement | null = null;

    /**
     * 每页自己的控件。
     *
     * 用 Record<TabId, …> 而不是可选查表：加一张标签页却忘了写它的渲染，
     * 在这里是一个编译错误，而不是一张点进去空空如也的页。
     * 反过来也成立：v0.17.0 把「排版」并进「编辑」时，只需从 TabId 里删掉一个取值，
     * 这张表漏删的那一行立刻报编译错，不会留下一个再也翻不到的渲染函数。
     */
    readonly render: Readonly<Record<TabId, PanelRenderer>>;

    constructor(host: PanelHost) {
        this.host = host;
        this.ctx = host.ctx;
        this.actions = host.actions;
        this.render = {
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
            editing: (el) => this.renderEditingPanel(el),
            explorer: (el) => this.renderExplorerPanel(el),
            ribbon: (el) => this.renderRibbonPanel(el),
        };
    }

    // ============================================================
    // 一、开荒页：一个按钮
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
                            this.host.rebuild();
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
    // 二、项目页：两个自动行为，加读书笔记那一段
    // ============================================================

    /** 插件仅有的两个常驻监听都住在 modules/projects，所以它们的开关也该在这一页 */
    private renderProjectsPanel(containerEl: HTMLElement): void {
        this.host.renderToggle(containerEl, 'autoCardInit', TEXTS.autoCardName, TEXTS.autoCardDesc);
        this.host.renderToggle(containerEl, 'autoUpdated', TEXTS.autoUpdatedName, TEXTS.autoUpdatedDesc);
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

        this.host.renderTextField(containerEl, BOOK_TAG_PREFIX_FIELD);

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
                            // 只抹掉 data.json 里那串 Cookie 不算断开——同一会话的内存令牌还在。
                            // 「断开」的边界只有 books 模块自己知道，因此走注入（v0.16.0 审计结论）
                            await this.actions.disconnectWeread();
                        } else {
                            await this.actions.connectWeread();
                        }
                    } finally {
                        // 重建整页即刷新状态；旧按钮随 containerEl 一起丢弃，无需解禁
                        this.host.rebuild();
                    }
                });
            });
    }

    // ============================================================
    // 三、灵感页：落点、位置与格式
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
    // 四、排版段：编辑页的后半截，一个自动开关加九条规则
    // ============================================================

    /**
     * 排版：先决定「要不要替我按」，再决定「按下去做哪几件事」。
     *
     * 两者刻意不合成一个开关：自动整理关掉之后，命令仍然照这九条勾选执行——
     * 规则回答的是「标准写法是什么」，自动回答的是「谁来按」，把它们绑在一起，
     * 就没法表达「我自己按，但按下去要全套」这个再正常不过的用法。
     *
     * v0.17.0 起它不再是一整页，而是「编辑」页的后半截：排版与粘贴、光标发生在
     * 同一个时刻（都在你敲字的那会儿），单列成页会逼学员先分清「整理格式算不算编辑」
     * 才知道该翻哪一页。前面那道小标题由 renderEditingPanel 落下。
     */
    private renderFormatSection(containerEl: HTMLElement): void {
        this.host.renderToggle(
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
    // 五、外观开关：一个开关，随开荒页交付
    // ============================================================

    /** 这一页管的是「右下角要不要常驻这个按钮」，不管片段本身开着还是关着 */
    private renderAppearancePanel(containerEl: HTMLElement): void {
        this.host.renderToggle(
            containerEl,
            'showAppearanceSwitch',
            TEXTS.appearanceSwitchName,
            TEXTS.appearanceSwitchDesc,
            this.actions.syncAppearanceSwitch,
        );
    }

    // ============================================================
    // 六、边栏页：三十五行
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

    // ============================================================
    // 七、文件页：文件夹计数、最近文件与状态栏路径
    // ============================================================

    /**
     * 文件页：三样东西回答同一个问题——我在哪、有哪些、刚才去过哪儿。
     *
     * 顺序是从「一眼扫过去」到「专门去找」：文件夹计数是不请自来的（那棵树上就有），
     * 最近文件要自己请出来，状态栏那一块又回到不请自来但住在屏幕另一端。
     * 每一项都得叫一声 syncExplorer：它们改的不是「下一次触发时怎么办」，
     * 而是**此刻**屏幕上那些东西本身——目录树与侧栏清单都不会自己再读一次设置。
     * 口径与条数在开关关着时照样可改，理由与排版页那九条规则一样：
     * 口径回答的是「该显示什么」，开关回答的是「要不要摆出来」，
     * 绑在一起就没法表达「先把口径调好，回头再打开看」。
     */
    private renderExplorerPanel(containerEl: HTMLElement): void {
        this.host.renderToggle(
            containerEl,
            'showFolderCount',
            TEXTS.folderCountName,
            TEXTS.folderCountDesc,
            this.actions.syncExplorer,
        );

        new Setting(containerEl)
            .setName(TEXTS.folderCountTargetName)
            .setDesc(TEXTS.folderCountTargetDesc)
            .addDropdown((dropdown) => {
                // 选项照 FOLDER_COUNT_TARGETS 的顺序摆，名字照 FOLDER_COUNT_LABELS 取：
                // 加一个口径不必回这里改，忘了给它起名则编译不过
                for (const target of FOLDER_COUNT_TARGETS) {
                    dropdown.addOption(target, FOLDER_COUNT_LABELS[target]);
                }

                dropdown
                    .setValue(this.normalizeFolderCountTarget(this.ctx.settings.folderCountTarget))
                    .onChange(async (value) => {
                        this.ctx.settings.folderCountTarget = this.normalizeFolderCountTarget(value);

                        await this.ctx.saveSettings();
                        this.actions.syncExplorer();
                    });
            });

        this.host.renderToggle(
            containerEl,
            'folderCountRecursive',
            TEXTS.folderCountRecursiveName,
            TEXTS.folderCountRecursiveDesc,
            this.actions.syncExplorer,
        );

        this.renderRecentSection(containerEl);

        // 状态栏那一块排在最后：它与上面两段服务同一个问题（我在哪、有哪些），
        // 但它住在屏幕的另一端，放在一起会让人以为它也是侧栏里的东西
        this.host.renderToggle(
            containerEl,
            'showFilePath',
            TEXTS.filePathName,
            TEXTS.filePathDesc,
            this.actions.syncExplorer,
        );
    }

    /** 最近文件那一段：一句说明，加「显示几条」与「怎么排」两个下拉框 */
    private renderRecentSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(TEXTS.recentHeading).setDesc(TEXTS.recentIntro).setHeading();

        new Setting(containerEl)
            .setName(TEXTS.recentLimitName)
            .setDesc(TEXTS.recentLimitDesc)
            .addDropdown((dropdown) => {
                for (const limit of RECENT_FILES_LIMITS) {
                    dropdown.addOption(String(limit), `${limit} 条`);
                }

                dropdown
                    .setValue(String(this.normalizeRecentLimit(this.ctx.settings.recentFilesLimit)))
                    .onChange(async (value) => {
                        this.ctx.settings.recentFilesLimit = this.normalizeRecentLimit(Number(value));

                        await this.ctx.saveSettings();
                        this.actions.syncExplorer();
                    });
            });

        new Setting(containerEl)
            .setName(TEXTS.recentSortName)
            .setDesc(TEXTS.recentSortDesc)
            .addDropdown((dropdown) => {
                for (const sort of RECENT_FILES_SORTS) {
                    dropdown.addOption(sort, RECENT_SORT_LABELS[sort]);
                }

                dropdown
                    .setValue(this.normalizeRecentSort(this.ctx.settings.recentFilesSort))
                    .onChange(async (value) => {
                        this.ctx.settings.recentFilesSort = this.normalizeRecentSort(value);

                        await this.ctx.saveSettings();
                        this.actions.syncExplorer();
                    });
            });
    }

    // ============================================================
    // 八、编辑页：打字时发生的三件事（粘贴、光标，加后半截的排版）
    // ============================================================

    /**
     * 编辑页：你在编辑器里敲字时发生的全部事情。
     *
     * 三件事同住一页是用户在 v0.17.0 明令的，判据比前几处并页都直白——
     * **它们发生在同一个时刻**：粘贴变成链接、光标记住位置、走开之后这一篇
     * 被整理成标准写法。排版单列成页时，学员得先分清「整理格式算不算编辑」
     * 才知道该翻哪一页，而那个问题本身就不该存在。
     *
     * 页内的先后是「立刻发生的」在前、「走开之后发生的」在后：
     * 粘贴与光标是你按下键的那一瞬间，排版是你离开这一篇之后。
     * 三项都不需要叫任何人重画——监听与记忆每次触发都现读设置对象，天然看得见新值；
     * 这一页因此是八张页里唯一「改完什么都不用同步」的一张，
     * 那正好说明它管的不是屏幕上的东西，而是行为。
     */
    private renderEditingPanel(containerEl: HTMLElement): void {
        this.host.renderToggle(
            containerEl,
            'pasteLinkEnabled',
            TEXTS.pasteLinkName,
            TEXTS.pasteLinkDesc,
        );
        this.host.renderToggle(
            containerEl,
            'rememberCursor',
            TEXTS.rememberCursorName,
            TEXTS.rememberCursorDesc,
        );

        new Setting(containerEl)
            .setName(TEXTS.formatHeading)
            .setDesc(TEXTS.formatIntro)
            .setHeading();

        this.renderFormatSection(containerEl);
    }

    /** 防御手改 data.json 产生的未知口径，与灵感插入位置同一姿态、同一回落策略 */
    private normalizeFolderCountTarget(value: string): FolderCountTarget {
        const candidate = value as FolderCountTarget;

        return FOLDER_COUNT_TARGETS.includes(candidate)
            ? candidate
            : FOLDER_COUNT_DEFAULTS.target;
    }

    /** 同上。不在候选里的条数一律回落默认，而不是照单全收一个写死在别处的怪数 */
    private normalizeRecentLimit(value: number): number {
        return RECENT_FILES_LIMITS.includes(value) ? value : RECENT_FILES_DEFAULTS.limit;
    }

    private normalizeRecentSort(value: string): RecentFilesSort {
        const candidate = value as RecentFilesSort;

        return RECENT_FILES_SORTS.includes(candidate) ? candidate : RECENT_FILES_DEFAULTS.sort;
    }
}
