/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 Platform；依赖 core/types 的 ZiminosContext；
 *          依赖 ./icons 的 registerZiminosIcons
 * [OUTPUT]: 对外提供 registerRibbon，返回一个「按设置重新决定哪几个图标露面」的同步函数
 * [POS]: ribbon 模块的呈现层，左侧边栏上那一列图标。
 *        它不认识任何一条具体命令——清单来自 ctx.commands 的花名册，
 *        因此加一条命令只要它经注册台注册过，就自动出现在边栏的可选清单里，
 *        本文件一个字都不用改（OCP）。按钮按下去直接调花名册上的回调，
 *        不去问 Obsidian「id 为 X 的命令是谁」——那条路（executeCommandById）不是公开 API。
 *        它只为勾选中的命令建按钮，这条纪律的理由写在 syncVisibility 上，是本文件的全部要害
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, Platform } from 'obsidian';
import { GROUP_COLORS } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';
import { registerZiminosIcons } from './icons';

// ============================================================
// 样式钩子
// ============================================================

/** 每个由本模块发出的边栏按钮都带它，供 styles.css 定位 */
const ITEM_CLASS = 'ziminos-ribbon-item';

/**
 * 「这个按钮本次会话内被取消勾选了」。
 *
 * 显隐必须走 class 而不能写 inline style：Obsidian 的 WorkspaceRibbon.onChange 会遍历
 * 它自己那份 items，对每一项无条件执行 `buttonEl.toggle(!item.hidden)`——
 * 也就是说 inline 的 display 是它保留的通道，我们写进去的会被它下一次重排原样抹掉。
 * 而 item.hidden 只有它自己的边栏菜单能改，公开 API 里没有入口。
 * 换成 class 就不在同一条通道上：它清掉 inline display 之后，class 规则照样生效。
 */
const HIDDEN_CLASS = 'ziminos-ribbon-hidden';

/**
 * 手机端取消勾选时的提示。
 *
 * 手机上根本没有那一列图标（Obsidian 自己给 `.is-phone .side-dock-ribbon` 设了 display:none），
 * 唯一的入口是底栏那个边栏菜单，而它读的是 Obsidian 的 items 不是 DOM——
 * 于是「藏起来」这套机制在手机上一寸作用都没有：学员拨了开关，屏幕上什么都不变。
 * 不给一句话的话，他只会连拨几次然后认定功能坏了。桌面端不提示：那里图标当场就没了，
 * 再弹一个通知是噪音。
 */
const MOBILE_PENDING = '已取消。手机端要重启 Obsidian 后，它才会从边栏菜单里消失。';

// ============================================================
// 装配
// ============================================================

/**
 * 装配左侧边栏。必须在全部命令注册完之后调用——它是照着花名册摆图标的，
 * 花名册上还没有的命令，这里也就摆不出来。
 *
 * 返回值给设置页用：设置页只改设置对象并落盘，它无从让一个已经画在边栏上的图标消失，
 * 所以这里交出一个同步函数由 main 转交过去，与外观开关用的是同一套填洞手法。
 */
export function registerRibbon(ctx: ZiminosContext): () => void {
    const dock = new RibbonDock(ctx);

    return () => dock.syncVisibility();
}

// ============================================================
// 边栏上的那一列图标
// ============================================================

class RibbonDock {
    private readonly ctx: ZiminosContext;

    /** 已经发出去的按钮，键是命令 id。发出去的收不回来，所以这张表只增不减 */
    private readonly buttons = new Map<string, HTMLElement>();

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;

        // 图标必须先进图标库，否则 addRibbonIcon 拿到的是一个认不出的名字，画出来是空的
        registerZiminosIcons(ctx.plugin);

        this.syncVisibility();
    }

    /**
     * 让边栏与设置对齐：勾上的建出来（或取消隐藏），取消勾选的藏起来。
     *
     * 这里有两条纪律，都来自 Obsidian 边栏的真实模型，不是口味问题：
     *
     * 其一，**只为勾上的命令建按钮**，而不是一次建齐全部命令再切显隐。
     * Obsidian 的 leftRibbon 自己存着一份 items，手机端底栏的边栏菜单与
     * 桌面「设置 → 外观 → 功能区」的管理弹窗都是遍历这份 items 画出来的，
     * 两处的过滤条件都只有 item.hidden，与 DOM 无关（边栏右键菜单会多看一眼 buttonEl 在不在，
     * 但那对我们没用——被藏起来的按钮 buttonEl 还在）。一次建齐的话，那两处永远列着全部命令，
     * 包括「初始化笔记库」这种一辈子只该按一次的——那正是这个功能想消灭的杂乱。
     *
     * 其二，**藏起来走 class 不走 inline display**，理由见 HIDDEN_CLASS。
     *
     * 代价说清楚：Obsidian 没有公开的「撤下某一个边栏按钮」，所以本次会话内取消勾选的
     * 只能先藏着，它在 items 里的那条记录要等下次重载才消失（重载时它压根不会被建出来）。
     * 在那之前，另外三处入口仍然列着它、也点得动：手机端底栏的边栏菜单、
     * 桌面「设置 → 外观 → 功能区」的管理弹窗、以及边栏空白处的右键菜单。
     * 边栏那一列是主入口，用户看到的就是消失了，所以这个残留在桌面上无伤；
     * 手机上则完全看不出变化，那一句 Notice 就是为它准备的。
     */
    syncVisibility(): void {
        const enabled = new Set(this.ctx.settings.ribbonCommands);

        // 按花名册顺序遍历：装载那一次，它决定了勾选中那几个按钮的先后。
        // 会话中途新勾上的只能追加在末尾（addRibbonIcon 是 push），重载即归位；
        // 而重载之后顺序由 Obsidian 与用户共同拥有（拖拽排序记在 workspace.json 里），我们不再干预
        for (const command of this.ctx.commands.list()) {
            const id = command.spec.id;
            const existing = this.buttons.get(id);

            if (!enabled.has(id)) {
                if (existing && !existing.hasClass(HIDDEN_CLASS)) {
                    existing.addClass(HIDDEN_CLASS);

                    if (Platform.isPhone) new Notice(MOBILE_PENDING);
                }

                continue;
            }

            if (existing) {
                existing.removeClass(HIDDEN_CLASS);

                continue;
            }

            const el = this.ctx.plugin.addRibbonIcon(command.spec.icon, command.spec.name, () => {
                command.run();
            });

            el.addClass(ITEM_CLASS);
            // 功能色按分组上：同画法的笔画图标排成一列时，颜色隔着半个屏幕就分了组。
            // 图标 stroke 取 currentColor，染容器即染图形
            el.style.color = GROUP_COLORS[command.spec.group];
            this.buttons.set(id, el);
        }
    }
}
