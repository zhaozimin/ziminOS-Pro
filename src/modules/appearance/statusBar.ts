/**
 * [INPUT]: 依赖 obsidian 的 Notice/ToggleComponent/setIcon/setTooltip；
 *          依赖 core/commands 的 APPEARANCE_COMMAND、core/types 的 ZiminosContext；
 *          依赖 ./snippets 的 readSnippets/setSnippetEnabled/SnippetState；
 *          依赖 ./reveal 的 canReveal/openSnippetFolder/openSnippetFile
 * [OUTPUT]: 对外提供 registerAppearanceSwitch，返回一个「按设置重新决定按钮显隐」的同步函数
 * [POS]: 外观模块的呈现层：右下角状态栏的那个按钮，以及它弹出的片段清单面板。
 *        打开这个面板有三条路——状态栏按钮、命令面板、左侧边栏那个调色盘图标；
 *        后两条同源，因为本文件经 ctx.commands 注册命令，边栏是照花名册摆的。
 *        它不认识 Obsidian 的 CSS 子系统，只认识 snippets.ts 给出的那四个字段，
 *        因此内部实现怎么变都碰不到这个文件。
 *        面板刻意不是 Menu：MySnippets 正是把开关塞进 Menu 的内部 DOM 才在新版里散架的——
 *        Menu 的结构属于 Obsidian，往里塞控件等于把自己焊死在别人的实现细节上。
 *        这里改成一个自己的浮层：只用 createDiv 与公开的 ToggleComponent，
 *        位置按状态栏按钮的实际位置算出来，没有任何写死的像素偏移。
 *        每次打开都现读一次磁盘，因此用户在「设置 → 外观」里的改动、
 *        或者往目录里新丢的 .css，下一次打开就都在。
 *        面板上另有两个「出门」的入口（v0.20.0）：每一行开关左边一个打开这个 .css，
 *        页脚右下角一个打开整个片段目录。它们把面板从「只能开关」变成「能改」——
 *        开关回答「要不要」，这两个按钮回答「怎么改」，后者此前只能靠用户自己
 *        在文件管理器里一层层翻到 .obsidian/snippets/。
 *        两个按钮都只在 canReveal 为真时画出来：手机上没有文件管理器可去，
 *        画一个点了只会道歉的按钮不如不画（与 explorer 角标同一条纪律）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, ToggleComponent, setIcon, setTooltip } from 'obsidian';
import { APPEARANCE_COMMAND } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';
import { canReveal, openSnippetFile, openSnippetFolder } from './reveal';
import { readSnippets, setSnippetEnabled } from './snippets';
import type { SnippetState } from './snippets';

// ============================================================
// 界面文案
// ============================================================

const TEXTS = {
    tooltip: '外观开关：开关 CSS 片段',
    /** setIcon 认不出图标名时的替身。MySnippets 就是因为图标名随 Obsidian 换图标库失效而「看不见」 */
    iconFallback: '🎨',
    iconName: 'palette',

    title: '外观开关',
    countSuffix: ' 个片段',

    empty: '片段目录里还没有 CSS 文件。把 .css 文件放进 .obsidian/snippets/，再点一次这个按钮。',
    pendingReload: '已记下这次改动，重新载入 Obsidian 后生效。',
    failedReadPrefix: '读不到片段目录：',
    failedPrefix: '写入失败：',

    /** 每行开关左边那个：把这一个 .css 交给系统默认程序 */
    openIcon: 'file-code',
    openFallback: '✎',
    openTooltip: '用默认程序打开这个 CSS 文件',
    openedInFolder: '这台机器没有登记 .css 的默认程序，已在文件管理器里选中它。',
    openFailedPrefix: '打不开这个片段：',

    /** 页脚那个：把整个片段目录交给文件管理器 */
    folderIcon: 'folder-open',
    folderFallback: '📂',
    folderLabel: '片段文件夹',
    folderTooltip: '在文件管理器里打开 .obsidian/snippets/',
    folderFailedPrefix: '打不开片段文件夹：',
} as const;

/**
 * 同一次点击的 mousedown 与 click 之间的最大间隔（毫秒）。
 * 取值只需覆盖一次手势内两个事件的派发间隔（实际是同一帧内的微秒级），
 * 又要短到不会把用户「关掉之后马上再点开」的第二次真实意图吃掉。
 */
const SAME_GESTURE_MS = 300;

// ============================================================
// 装配
// ============================================================

/**
 * 装配外观开关。
 *
 * 返回值是给设置页用的：设置页只改 ctx.settings 并落盘，它无法让一个已经画在屏幕上的
 * 状态栏按钮自己消失，所以这里交出一个同步函数由 main 转交过去——
 * 与「记人情要日记」「客户要开荒」用的是同一套填洞手法，依赖图仍是一棵树。
 */
export function registerAppearanceSwitch(ctx: ZiminosContext): () => void {
    const swi = new AppearanceSwitch(ctx);

    return () => swi.syncVisibility();
}

// ============================================================
// 状态栏按钮与浮层
// ============================================================

class AppearanceSwitch {
    private readonly ctx: ZiminosContext;

    private readonly statusEl: HTMLElement;

    /** 浮层只在打开期间存在；null 即「当前没开」，不留隐藏的空壳 */
    private panelEl: HTMLElement | null = null;

    /** 关闭浮层用的解绑动作。开一次装一次、关一次拆干净，不给插件生命周期留监听残渣 */
    private readonly detachers: (() => void)[] = [];

    /**
     * 上一次「点了别处所以关掉」发生在什么时刻（performance.now）。
     *
     * 它解决的是第三个入口带来的一个具体麻烦：左侧边栏那个调色盘按钮不在放行名单里
     * （状态栏按钮是构造时就拿到的引用，边栏按钮由 ribbon 模块发出，本文件够不着），
     * 于是点它一下会被同一次手势处理两遍——mousedown 判定「点了别处」先关，
     * 随后 click 触发命令又开回来，浮层闪一下还在，用户以为按钮坏了。
     * 记一个时刻而不是维护一份放行名单，是因为「谁能打开我」这件事会随入口增加而增长，
     * 名单迟早漏掉一个；而「这次打开是不是刚才那次关闭的同一个手势」是个恒定的问题。
     * 判据与 SelfWriteGuard 同形：都是「这动作是不是我自己刚才引起的」。
     */
    private dismissedAt = Number.NEGATIVE_INFINITY;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;
        this.statusEl = ctx.plugin.addStatusBarItem();

        this.statusEl.addClass('ziminos-appearance-switch');
        this.statusEl.addClass('mod-clickable');
        setTooltip(this.statusEl, TEXTS.tooltip, { placement: 'top' });
        this.paintIcon();
        this.syncVisibility();

        this.statusEl.addEventListener('click', () => this.toggle());

        // 按钮可以被用户收起来，命令与左侧边栏是到达这个面板的另外两条路
        ctx.commands.register(APPEARANCE_COMMAND, () => this.toggle());

        // 插件卸载时浮层挂在 body 上，不会随状态栏一起被回收，必须自己收走
        ctx.plugin.register(() => this.close());
    }

    /** 按设置决定按钮显隐。关掉只是收起按钮，命令与浮层照常可用 */
    syncVisibility(): void {
        this.statusEl.toggle(this.ctx.settings.showAppearanceSwitch);
    }

    /**
     * 画图标。
     * 图标名属于 Obsidian 的图标库，换库就会失效——那正是 MySnippets 在新版里
     * 只剩一个看不见的按钮的原因。这里画完检查一眼有没有真的画出 svg，没有就退回一个字符。
     */
    private paintIcon(): void {
        paintIcon(this.statusEl, TEXTS.iconName, TEXTS.iconFallback);
    }

    // ============================================================
    // 开合
    // ============================================================

    private toggle(): void {
        if (this.panelEl) {
            this.close();

            return;
        }

        // 同一次点击刚把浮层关掉，这一下就是那次关闭本身，不该再开回来。
        // 判过一次就把印记清掉：一次关闭最多吞一次打开，否则窗口内连点第三下会被无故吃掉
        const sameGesture = performance.now() - this.dismissedAt < SAME_GESTURE_MS;

        this.dismissedAt = Number.NEGATIVE_INFINITY;

        if (sameGesture) return;

        void this.open();
    }

    /** 打开浮层。事实现读，因此「设置 → 外观」里的改动与新丢进目录的文件都会出现在这一次 */
    private async open(): Promise<void> {
        this.close();

        const panel = document.body.createDiv({ cls: 'ziminos-appearance-panel' });

        this.panelEl = panel;
        this.place(panel);
        this.bindDismiss(panel);

        try {
            const snippets = await readSnippets(this.ctx.app);

            // 读盘期间用户可能已经把浮层关了、或者又开了一个新的：
            // 认准自己这一份，否则会往一个已经摘掉的 div 上画画
            if (this.panelEl !== panel) return;

            this.render(panel, snippets);
        } catch (error) {
            if (this.panelEl !== panel) return;

            // 读不到片段目录也要说人话，不能留一个空框让人以为系统坏了
            panel.createDiv({
                cls: 'ziminos-appearance-empty',
                text: TEXTS.failedReadPrefix + describe(error),
            });
            // 这一步失败时「去文件夹自己看看」恰恰是下一步，页脚照画
            this.renderFooter(panel);
        }
    }

    private close(): void {
        for (const detach of this.detachers) detach();

        this.detachers.length = 0;
        this.panelEl?.remove();
        this.panelEl = null;
    }

    /**
     * 把浮层贴到状态栏按钮上方。
     *
     * 位置一律由按钮的实际矩形算出，不写死像素——MySnippets 用的是
     * 「窗口右下角减 15 和 37」，换一套窗口边框就飘出屏幕。
     * 按钮被用户收起来时（此时用命令打开）矩形是全零，退回贴着窗口右下角。
     */
    private place(panel: HTMLElement): void {
        const rect = this.statusEl.getBoundingClientRect();
        const anchored = rect.width > 0;

        panel.style.bottom = `${anchored ? window.innerHeight - rect.top + 6 : 34}px`;
        panel.style.right = `${anchored ? Math.max(8, window.innerWidth - rect.right) : 12}px`;
    }

    /** 点别处、按 Esc、改窗口大小都算「不看了」。三个监听都记进 detachers，关闭时一起拆掉 */
    private bindDismiss(panel: HTMLElement): void {
        const onPointerDown = (event: MouseEvent): void => {
            const target = event.target;

            if (!(target instanceof Node)) return;
            // 点按钮本身不在这里处理：让它落到按钮的 click 上，由 toggle 收起，否则会关了又开
            if (panel.contains(target) || this.statusEl.contains(target)) return;

            this.dismissedAt = performance.now();
            this.close();
        };

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') this.close();
        };

        const onResize = (): void => this.close();

        document.addEventListener('mousedown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('resize', onResize);

        this.detachers.push(
            () => document.removeEventListener('mousedown', onPointerDown, true),
            () => document.removeEventListener('keydown', onKeyDown, true),
            () => window.removeEventListener('resize', onResize),
        );
    }

    // ============================================================
    // 渲染
    // ============================================================

    /** 画标题、分组与每一行。分组名来自用户自己的【】命名习惯，不是我们发明的分类 */
    private render(panel: HTMLElement, snippets: readonly SnippetState[]): void {
        const header = panel.createDiv({ cls: 'ziminos-appearance-header' });

        header.createSpan({ text: TEXTS.title });
        header.createSpan({
            cls: 'ziminos-appearance-count',
            text: `${snippets.length}${TEXTS.countSuffix}`,
        });

        // 一次打开只问一次「这台机器能不能出门」：答案在面板存活期间不会变，
        // 每行各问一次只是把同一个稳定事实算十二遍
        const revealable = canReveal(this.ctx.app);

        if (snippets.length === 0) {
            panel.createDiv({ cls: 'ziminos-appearance-empty', text: TEXTS.empty });
            // 空库时这个按钮最有用：他正想去放第一个片段进去
            this.renderFooter(panel);

            return;
        }

        const list = panel.createDiv({ cls: 'ziminos-appearance-list' });
        let currentGroup = '';

        for (const snippet of snippets) {
            if (snippet.group !== currentGroup) {
                currentGroup = snippet.group;
                list.createDiv({ cls: 'ziminos-appearance-group', text: currentGroup });
            }

            this.renderRow(list, snippet, revealable);
        }

        this.renderFooter(panel);
    }

    /**
     * 页脚：右下角那个「片段文件夹」。
     *
     * 它带文字而每行那个只有图标，不是随手定的：这一个每面板只出现一次，
     * 说清它去哪儿的成本只付一遍；每行那个要出现十二次，十二个「打开这个 CSS 文件」
     * 会把片段名从清单里挤走，而它在哪一行本身就说明了它开哪个文件。
     * 探不到本机文件系统就整段缺席——手机上没有文件管理器可去，
     * 画一个点了只会道歉的按钮不如不画。
     */
    private renderFooter(panel: HTMLElement): void {
        if (!canReveal(this.ctx.app)) return;

        const footer = panel.createDiv({ cls: 'ziminos-appearance-footer' });
        const button = footer.createDiv({ cls: 'ziminos-appearance-folder' });

        // 图标单独一个 span：setIcon 会重写宿主元素的内容，与标签共用一个容器会把标签抹掉
        paintIcon(button.createSpan(), TEXTS.folderIcon, TEXTS.folderFallback);
        button.createSpan({ text: TEXTS.folderLabel });
        setTooltip(button, TEXTS.folderTooltip, { placement: 'top' });

        button.addEventListener('click', () => void this.openFolder());
    }

    /**
     * 一行：名字 + 开关。
     *
     * 失败要把开关拨回去——否则界面说「开着」而磁盘上是关着的，
     * 用户下次打开面板会看到它自己变了回去，那比一开始就报错更让人不信任系统。
     * 回拨用一个重入标志兜住：ToggleComponent.setValue 是否回调 onChange 属于它的实现细节，
     * 不该由我们来赌。
     */
    private renderRow(list: HTMLElement, snippet: SnippetState, revealable: boolean): void {
        const row = list.createDiv({ cls: 'ziminos-appearance-row' });

        row.createSpan({ cls: 'ziminos-appearance-name', text: snippet.label });

        // 出门按钮排在开关**之前**，因为 ToggleComponent 是往 row 上追加的：
        // 谁先建谁在左边。位置本身是句话——先问「怎么改」，再问「要不要」
        if (revealable) this.renderOpenButton(row, snippet);

        const toggle = new ToggleComponent(row);
        let rollingBack = false;

        toggle.setValue(snippet.enabled).onChange((value) => {
            if (rollingBack) return;

            void this.applyToggle(snippet, value, () => {
                rollingBack = true;
                toggle.setValue(!value);
                rollingBack = false;
            });
        });
    }

    /**
     * 一行里那个只有图标的按钮：把这一个 .css 交给系统默认程序。
     *
     * 刻意不用 Obsidian 的 clickable-icon 类：那是宿主与主题共用的一层约定，
     * 借它省下的几行样式，换来的是「主题改了这个类名，按钮就变成一坨没有边界的图形」。
     * 样式全部写在 styles.css 里自己那两条选择器上，与外观开关面板的其余部分同源。
     */
    private renderOpenButton(row: HTMLElement, snippet: SnippetState): void {
        const button = row.createDiv({ cls: 'ziminos-appearance-open' });

        paintIcon(button, TEXTS.openIcon, TEXTS.openFallback);
        setTooltip(button, TEXTS.openTooltip, { placement: 'top' });

        button.addEventListener('click', () => void this.openFile(snippet));
    }

    // ============================================================
    // 三个动作
    // ============================================================

    /**
     * 打开一个片段。
     *
     * 面板不因此关闭：想改 CSS 的人往往一次要开好几个片段对照着看，
     * 点一个关一次会逼他把面板重开三遍。外部程序抢走焦点之后，
     * 他点回 Obsidian 的任何地方都会让浮层自己消失，这已经够了。
     */
    private async openFile(snippet: SnippetState): Promise<void> {
        try {
            // 落到文件管理器里也算成功，只是要说一声，否则用户会以为按钮没反应
            if (!(await openSnippetFile(this.ctx.app, snippet.name))) {
                new Notice(TEXTS.openedInFolder);
            }
        } catch (error) {
            new Notice(TEXTS.openFailedPrefix + describe(error));
        }
    }

    /** 打开片段目录。成功就闭嘴——文件管理器自己跳到最前面，就是最好的反馈 */
    private async openFolder(): Promise<void> {
        try {
            await openSnippetFolder(this.ctx.app);
        } catch (error) {
            new Notice(TEXTS.folderFailedPrefix + describe(error));
        }
    }

    /** 落一次开关：即刻生效就闭嘴，只落了盘就提醒重载，失败就回拨并说明原因 */
    private async applyToggle(
        snippet: SnippetState,
        value: boolean,
        rollback: () => void,
    ): Promise<void> {
        try {
            const applied = await setSnippetEnabled(this.ctx.app, snippet.name, value);

            // 生效了就什么都不说：开关自己拨过去了，就是最好的反馈
            if (!applied) new Notice(TEXTS.pendingReload);
        } catch (error) {
            rollback();
            new Notice(TEXTS.failedPrefix + describe(error));
        }
    }
}

/**
 * 画一个图标，画完检查一眼。
 *
 * 图标名属于 Obsidian 的图标库，换库就会失效——那正是 MySnippets 在新版里
 * 只剩一个看不见的按钮的原因。状态栏按钮、每行的出门按钮、页脚的文件夹按钮
 * 三处共用这一条纪律：与其信任一个名字，不如画完看看有没有真的画出 svg。
 */
function paintIcon(el: HTMLElement, name: string, fallback: string): void {
    setIcon(el, name);

    if (!el.querySelector('svg')) el.setText(fallback);
}

/** 异常转人话。全模块只此一处，保证提示语气一致 */
function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
