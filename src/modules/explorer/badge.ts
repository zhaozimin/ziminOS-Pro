/**
 * [INPUT]: 依赖 obsidian 的 setTooltip；依赖 core/constants 的
 *          FOLDER_COUNT_DEFAULTS/FOLDER_COUNT_TARGETS 与 FolderCountTarget 类型、
 *          core/types 的 ZiminosContext；依赖 ./count 的 tallyFolders/pickCount 与 FolderTally
 * [OUTPUT]: 对外提供 registerFolderCount，返回一个「按当前设置重画一次」的同步函数
 * [POS]: 文件浏览器计数模块的呈现层，也是本模块与 Obsidian 宿主之间唯一的接触面。
 *        它做三件事：找到文件浏览器那块 DOM、把 count.ts 数出来的那个数挂到每个文件夹右侧、
 *        在文件增删改名或树展开收起时重挂一次。
 *        全库唯一依赖「文件浏览器渲染出来长什么样」的地方就是本文件顶部那四个常量，
 *        它们与调用处同处一个文件（与 appearance/snippets.ts 收窄非公开 API 的纪律同一条），
 *        因此删掉 modules/explorer 就再没有任何代码认识 `.nav-folder-title`。
 *        本文件不数任何东西也不认识「笔记」这个概念，换一套计数口径碰不到它
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setTooltip } from 'obsidian';
import { FOLDER_COUNT_DEFAULTS, FOLDER_COUNT_TARGETS } from '../../core/constants';
import type { FolderCountTarget } from '../../core/constants';
import type { ZiminosContext } from '../../core/types';
import { pickCount, tallyFolders } from './count';
import type { FolderTally } from './count';

// ============================================================
// 宿主约定：本模块对 Obsidian 的全部假设，就这四条
// ============================================================

/**
 * 文件浏览器的视图类型名。它是 Obsidian 核心插件的身份，不是我们的常量，
 * 因此不进 core/constants——那份表回答「ziminOS 里有哪些东西」，这一行回答「宿主长什么样」。
 * 取不到叶子（用户把文件浏览器关了）时本模块整条静默缺席，不抛异常、不提示。
 */
const FILE_EXPLORER_VIEW_TYPE = 'file-explorer';

/** 一行文件夹标题。它同时是全库 CSS 片段与 Minimal 主题指着的同一层约定，不是内部字段 */
const FOLDER_TITLE_SELECTOR = '.nav-folder-title';

/** 文件夹标题上记着自己是谁的属性 */
const PATH_ATTR = 'data-path';

/**
 * 库根的路径。根那一行的标题被 Obsidian 与 Minimal 双双压平（高度接近零、内容隐藏），
 * 往一个看不见的地方挂数字，等于让「全库一共多少篇」这个数字的位置由主题决定——
 * 它要么不出现，要么某天忽然出现在库名旁边。所以根一律跳过。
 */
const ROOT_PATH = '/';

/** 我们挂上去的那个数字的类名。样式住在 vault 的 styles.css，与其余 ziminos- 选择器同处 */
const BADGE_CLASS = 'ziminos-folder-count';

// ============================================================
// 界面文案
// ============================================================

const TEXTS = {
    notes: ' 篇笔记',
    folders: ' 个文件夹',
    others: ' 个附件',
    separator: ' · ',
    deepSuffix: '（含子文件夹）',
} as const;

/**
 * 重画防抖（毫秒）。
 *
 * 它防的是同一个动作引发的一串事件：展开一个文件夹会一次性插入几十行，
 * 而「新建项目」这条命令连着建目录、建 MOC、写 YAML。每一条都重数一遍全库是白费。
 * 取值比视图重算（200ms）短，因为这里等的不是索引而是 DOM——
 * 数字比它旁边的文件夹名晚半秒出现，学员会看见它「跳」出来。
 */
const REPAINT_DEBOUNCE_MS = 80;

// ============================================================
// 装配
// ============================================================

/**
 * 装配文件夹计数。
 *
 * 返回值是给设置页用的：设置页只改 ctx.settings 并落盘，它无法让已经画在屏幕上的
 * 那一串数字自己改口径或自己消失，所以这里交出一个「按当前设置重画一次」的函数，
 * 由 main 转交过去——与外观开关、左侧边栏用的是同一套填洞手法，依赖图仍是一棵树。
 */
export function registerFolderCount(ctx: ZiminosContext): () => void {
    const badges = new FolderCountBadges(ctx);

    return () => badges.sync();
}

// ============================================================
// 计数的挂载与维护
// ============================================================

class FolderCountBadges {
    private readonly ctx: ZiminosContext;

    /**
     * 观察文件浏览器 DOM 的那一个观察者。
     *
     * 只用一个而不是「一个叶子一个」：MutationObserver 允许对多个目标 observe，
     * 全部回调进同一个入口，而 disconnect 一次全部撤掉。
     * 于是「现在有几块文件浏览器」这件事不需要任何记账——每次重挂都是先全撤再全挂。
     * null 即当前没有在观察（开关关着，或者文件浏览器不在场）。
     */
    private observer: MutationObserver | null = null;

    /** 防抖句柄。null 即当前没有排着的重画 */
    private timer: number | null = null;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;

        const { app, plugin } = ctx;

        // 文件浏览器在布局就绪之前还不存在，此时去找叶子只会拿到空数组
        app.workspace.onLayoutReady(() => this.sync());

        // 关掉、拖走、重开文件浏览器都会换掉那块容器，观察者必须跟着换
        plugin.registerEvent(app.workspace.on('layout-change', () => this.sync()));

        // 增、删、改名都会改变某个文件夹的数字。改名尤其必须单独听：
        // Obsidian 会复用同一个 DOM 节点、只改它的 data-path，
        // 那不是子节点变更，观察者一个字都看不见，而那一行的数字已经是别人的了
        plugin.registerEvent(app.vault.on('create', () => this.schedule()));
        plugin.registerEvent(app.vault.on('delete', () => this.schedule()));
        plugin.registerEvent(app.vault.on('rename', () => this.schedule()));

        // 这些数字挂在文件浏览器身上而不是我们自己的容器里，
        // 插件卸载时 Obsidian 不会替我们收——不收就会留下一串再也不更新的数字
        plugin.register(() => this.dispose());
    }

    /**
     * 按当前设置重画一次，必要时重挂观察者。设置页与两个工作区事件走的都是这一个入口。
     *
     * 开关关掉时连观察者一起撤掉，而不是留着它空转：一个关掉之后还在监听 DOM 的功能，
     * 与没关掉的区别只有用户看不见的那部分。
     */
    sync(): void {
        if (!this.ctx.settings.showFolderCount) {
            this.observer?.disconnect();
            this.observer = null;
            this.clear();

            return;
        }

        this.attach();
        this.repaint();
    }

    /** 把观察者挂到当前在场的每一块文件浏览器上。先全撤再全挂，因此重复调用无害 */
    private attach(): void {
        const containers = this.containers();

        this.observer?.disconnect();

        if (containers.length === 0) return;

        const observer = this.observer ?? new MutationObserver((records) => this.onMutations(records));

        this.observer = observer;

        // 只观察子节点的增删：展开一个文件夹、滚动到懒渲染的那一段、别的插件插一行，
        // 都是这一类。属性与文字变化一概不听——data-path 的变化由 vault 的 rename 事件覆盖，
        // 而听文字变化会把我们自己写进去的那个数字也算成一次变更
        for (const container of containers) {
            observer.observe(container, { childList: true, subtree: true });
        }
    }

    /**
     * DOM 变了。
     *
     * 先问一句「这变化是不是我自己刚才引起的」——判据与 SelfWriteGuard 同形，
     * 只是这里连时间窗口都不需要：我们的痕迹全都带着 BADGE_CLASS，认得出来。
     * 不问的话，写一个数字就是一次子节点变更，一次变更排一次重画，重画又写数字，
     * 这个环靠「值没变就不写」也能收敛，但收敛不等于不该成环。
     */
    private onMutations(records: readonly MutationRecord[]): void {
        if (records.every(isOurs)) return;

        this.schedule();
    }

    /** 排一次重画。同一串事件里排多少次都只画一次 */
    private schedule(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = window.setTimeout(() => {
            this.timer = null;
            this.repaint();
        }, REPAINT_DEBOUNCE_MS);
    }

    /**
     * 重画全部在场的文件夹。
     *
     * 一次重画只数一遍全库，屏幕上展开了多少行都共用这一张表；
     * 已经对的那些数字一个字都不重写，见 paint——那是这个功能不自激的第二道保证。
     */
    private repaint(): void {
        // 事件在开关关掉之后仍然会到（它们随插件存活，不随开关注册与撤销）。
        // 那时屏幕上没有任何数字要维护，直接回头，不必白数一遍全库
        if (!this.ctx.settings.showFolderCount) return;

        const containers = this.containers();

        if (containers.length === 0) return;

        const recursive = this.ctx.settings.folderCountRecursive;
        const target = this.target();
        const tallies = tallyFolders(this.ctx.app.vault.getRoot(), recursive);

        for (const container of containers) {
            for (const titleEl of Array.from(container.querySelectorAll(FOLDER_TITLE_SELECTOR))) {
                // 不做类型断言：断言只是让编译器闭嘴，而这里真的可能不是 HTMLElement
                if (titleEl instanceof HTMLElement) this.paint(titleEl, tallies, target, recursive);
            }
        }
    }

    /**
     * 给一行文件夹标题挂上（或摘掉）它的数字。
     *
     * 三种情况都摘掉而不是显示 0：根那一行、路径认不出来的那一行、以及数出来是 0 的那一行。
     * 一个 0 不解释任何事——空文件夹自己就写着「空」，而那个 0 只是让每一行都长出一个灰点。
     */
    private paint(
        titleEl: HTMLElement,
        tallies: Map<string, FolderTally>,
        target: FolderCountTarget,
        recursive: boolean,
    ): void {
        const path = titleEl.getAttribute(PATH_ATTR);
        const tally = path === null || path === ROOT_PATH ? undefined : tallies.get(path);
        const count = tally ? pickCount(tally, target) : 0;

        if (!tally || count === 0) {
            badgeOf(titleEl)?.remove();

            return;
        }

        const badge = badgeOf(titleEl) ?? titleEl.createSpan({ cls: BADGE_CLASS });
        const text = String(count);

        // 值没变就一个字都不写：写一次文字就是一次 DOM 变更，而 DOM 变更会排一次重画
        if (badge.textContent !== text) badge.setText(text);

        // 常驻的那个数字只说一件事，悬停才把三项说全——那正是「数笔记还是数文件夹」
        // 这个问题的另一半答案，问一句就有，不必回设置页改口径
        setTooltip(badge, describe(tally, recursive));
    }

    /** 撤掉全部痕迹。开关关掉与插件卸载共用它，因此「关掉」与「卸载」的结果一字不差 */
    private clear(): void {
        for (const container of this.containers()) {
            for (const badge of Array.from(container.querySelectorAll(`.${BADGE_CLASS}`))) {
                badge.remove();
            }
        }
    }

    private dispose(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);

        this.timer = null;
        this.observer?.disconnect();
        this.observer = null;
        this.clear();
    }

    /**
     * 当前在场的文件浏览器容器。
     *
     * 走的是公开的 getLeavesOfType 与 View.containerEl，不碰文件浏览器视图的内部字段——
     * 社区里那些「文件数」插件读的是 view.fileItems，那不在 obsidian.d.ts 里。
     * 一块都找不到时返回空数组，调用方一律据此静默收工。
     */
    private containers(): HTMLElement[] {
        return this.ctx.app.workspace
            .getLeavesOfType(FILE_EXPLORER_VIEW_TYPE)
            .map((leaf) => leaf.view.containerEl);
    }

    /** 防御手改 data.json 写进来的未知口径：不在候选里就回落默认，与灵感插入位置同一姿态 */
    private target(): FolderCountTarget {
        const candidate = this.ctx.settings.folderCountTarget;

        return FOLDER_COUNT_TARGETS.includes(candidate)
            ? candidate
            : FOLDER_COUNT_DEFAULTS.target;
    }
}

// ============================================================
// 纯函数：自写判定与提示文案
// ============================================================

/** 这条 DOM 变更是不是我们自己引起的：动的是某个数字本身，或者增删的全是数字 */
function isOurs(record: MutationRecord): boolean {
    const { target } = record;

    if (target instanceof HTMLElement && target.classList.contains(BADGE_CLASS)) return true;

    return allBadges(record.addedNodes) && allBadges(record.removedNodes);
}

function allBadges(nodes: NodeList): boolean {
    return Array.from(nodes).every(
        (node) => node instanceof HTMLElement && node.classList.contains(BADGE_CLASS),
    );
}

/** 取这一行已经挂着的那个数字。挂过就复用，不每次重建——重建即闪烁 */
function badgeOf(titleEl: HTMLElement): HTMLElement | null {
    const badge = titleEl.querySelector(`:scope > .${BADGE_CLASS}`);

    return badge instanceof HTMLElement ? badge : null;
}

/**
 * 悬停提示：把三项一次说全。
 *
 * 笔记与文件夹永远都说，哪怕是 0——它们正是用户在问的那两个数，
 * 「0 篇笔记 · 8 个文件夹」这句话本身就是答案。附件为 0 时不提，
 * 那是「一共」这个口径才关心的第三项，平时说出来只是噪音。
 */
function describe(tally: FolderTally, recursive: boolean): string {
    const parts = [`${tally.notes}${TEXTS.notes}`, `${tally.folders}${TEXTS.folders}`];

    if (tally.others > 0) parts.push(`${tally.others}${TEXTS.others}`);

    return parts.join(TEXTS.separator) + (recursive ? TEXTS.deepSuffix : '');
}
