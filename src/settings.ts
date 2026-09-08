/**
 * [INPUT]: 依赖 obsidian 的 PluginSettingTab 基类、Setting 构建器与 setIcon；
 *          依赖 ./settingsModel 的 TABS/TEXTS/TEXT_FIELDS 与
 *          SettingActions/SettingsTab/TabId/TextField/BooleanSettingKey 类型、
 *          ./settingsPanels 的 SettingsPanels 与 PanelHost 契约、
 *          ./core/types 的 ZiminosContext/DEFAULT_SETTINGS
 * [OUTPUT]: 对外提供 ZiminosSettingTab，由 main.ts 在装配末尾挂载
 * [POS]: 插件唯一图形界面的**骨架**，也是「人主导」这条红线的具象化——
 *        开荒只在用户按下按钮时发生，两个自动行为与两块常驻状态栏随时都可以关掉。
 *        本文件回答三个问题：标签栏怎么画、一页分哪四段、开关与文本框长什么样。
 *        「这一页有什么」住在 ./settingsModel，「每一页塞进去什么」住在 ./settingsPanels。
 *        三家两次分出来，判据每次都是同一条——变更理由不同：
 *        v0.14.0 把数据表分走（加一个设置项、改一句文案与渲染无关），
 *        v0.17.0 把八张页各自的控件分走（给一页多一段，与骨架无关）。
 *        两次的触发点都是那条 ≤800 行，它两次都先于人察觉到一个文件在同时干两件事。
 *        它只读写 ctx.settings 并调 ctx.saveSettings，不持有任何领域状态：
 *        每次 display 都从设置对象重新渲染，因此外部改动天然可见。
 *        一页的骨架固定为页头 → 明面字段 → 自有控件 → 高级折叠，
 *        唯一排在折叠之后的是开荒页尾那张作者名片——它不是设置，是这套交付物的落款，
 *        因此它归骨架而不归面板：落款的位置是跨八页的承诺，不是某一页自己的事。
 *        V3 起页面按系统模块切成标签页（v0.17.0 起八张），切法不是新发明的分类，
 *        就是 modules/ 下的目录本身；边栏排在最末，因为它在 main.ts 里必须最后装配。
 *        开荒动作、微信读书连接/断开、三处重绘、Eagle 五个设备动作与作者名片都由 main 注入：
 *        设置页因此不认识开荒名单、登录窗口、状态栏、目录树、Eagle 协议/凭据与名片实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { PluginSettingTab, Setting, setIcon } from 'obsidian';
import { TABS, TEXTS, TEXT_FIELDS } from './settingsModel';
import type {
    BooleanSettingKey,
    SettingActions,
    SettingsTab,
    TabId,
    TextField,
} from './settingsModel';
import { SettingsPanels } from './settingsPanels';
import type { PanelHost } from './settingsPanels';
import { DEFAULT_SETTINGS } from './core/types';
import type { ZiminosContext } from './core/types';

// ============================================================
// 设置页
// ============================================================

/**
 * ziminOS 设置页。
 * 构造参数只收 ZiminosContext 一个：app 与 plugin 都能从中取出，
 * 设置页因此与 main.ts 共用同一个设置对象与同一个落盘通道，不存在第二份真相。
 */
export class ZiminosSettingTab extends PluginSettingTab implements PanelHost {
    readonly ctx: ZiminosContext;

    /**
     * 十二件由 main 注入的事。
     * 设置页只会改设置对象并落盘，它既不知道有哪些模块要参与开荒，
     * 也无从让屏幕上已经画好的按钮、图标与计数自己变——谁画的谁负责收，
     * 这里只负责在改完之后叫一声。
     */
    readonly actions: SettingActions;

    /**
     * 当前停在哪一页。
     *
     * 这是页面状态而非领域状态，因此刻意不进 data.json——设置对象里存的都是
     * 「这个库是什么样」，而不是「上次那个人翻到了第几页」。
     * 它随本条插件实例存活，也就是关掉设置弹窗再打开仍停在原页、重启 Obsidian 归位，
     * 与 Obsidian 自己记住你上次停在哪个插件设置页是同一档待遇。
     */
    private activeTab: SettingsTab = TABS[0];

    /** 八张页各自的控件。骨架不认识任何一页有什么，只认识「往这儿画」 */
    private readonly panels: SettingsPanels;

    constructor(ctx: ZiminosContext, actions: SettingActions) {
        super(ctx.app, ctx.plugin);

        this.ctx = ctx;
        this.actions = actions;
        // 面板拿到的是这个骨架本身：它借开关、文本框与「重建整页」三样能力，别的一概不知道
        this.panels = new SettingsPanels(this);
    }

    /** 面板改完状态要让整页翻面时叫它。语义与 display 完全一致，名字换成面板那边看得懂的 */
    rebuild(): void {
        this.display();
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
        this.panels.render[tab.id](body);
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
    renderToggle(
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
    renderTextField(containerEl: HTMLElement, field: TextField): void {
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

}
