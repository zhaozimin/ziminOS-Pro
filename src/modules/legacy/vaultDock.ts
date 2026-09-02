/**
 * [INPUT]: 依赖 obsidian 的 Notice 与 App 类型；依赖 core/commands 的 LEGACY_COMMANDS、
 *          core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 registerLegacyDock（注册「切换笔记库 / 打开帮助 / 打开设置」三条命令）
 * [POS]: 旧版入口模块，全仓库第二处（也是唯一另一处）接触 Obsidian 非公开成员的地方。
 *        它存在的理由是 Obsidian 1.6 的一次改动：笔记库切换、帮助与设置三个按钮
 *        从左侧 ribbon 挪进了文件浏览器底下那一条，而那一条离文件树太近、
 *        点错的代价又不对称——想开设置，结果收起了整棵树。
 *        本模块不去搬 Obsidian 的 DOM，也不复刻那一条：它把这三件事注册成三条 ziminOS 命令，
 *        于是它们自动出现在命令面板、可绑快捷键、并且在「设置 → ziminOS → 边栏」那张清单里
 *        勾一下就变成最左边那一列的图标——摆按钮这件事全程走公开的 addRibbonIcon。
 *        借来的只有「点下去要发生什么」：App 的公开成员只有十项，
 *        开设置、开库选择器、开帮助三件事没有任何公开替代品（见文件内那段备案）。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import type { App } from 'obsidian';
import { LEGACY_COMMANDS } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';

// ============================================================
// 与 Obsidian 内部的第二处约定（备案第 8 条）
// ============================================================

/**
 * 备案：这是 ziminOS 第二次、也是最后一次伸手到官方公开 API 之外。
 *
 * `obsidian.d.ts`（1.13.1）里 App 的公开成员只有十项——keymap / scope / workspace /
 * vault / metadataCache / fileManager / lastEvent / renderContext / secretStorage /
 * isDarkMode()。「打开设置面板」「打开笔记库选择器」「打开官方帮助」三件事一件都不在其中，
 * 全文既搜不到 openVaultChooser 也搜不到 openHelp，setting 也不是 App 的公开字段。
 * 按 id 执行命令的 executeCommandById 同样不在里面，所以那条路也不是出路。
 * 完全不碰的话，「把那三个按钮拿回来」就不成为一个功能——这与外观开关那处缺口
 * （不碰 customCss，开关就退化成配置文件的另一种写法）是同一条判据。
 *
 * 三条纪律与那一处完全一致：
 * 其一，只有「点下去要发生什么」这一步借用，摆按钮走公开的 addRibbonIcon 与命令注册台；
 * 其二，用模块增强声明成**可选**成员并在运行时二次验形（typeof === 'function'），
 *       于是 TypeScript 强制判空，探不到时的后果被锁死在「弹一句人话」，而不是抛异常；
 * 其三，声明与调用同处这一个文件，不散进 .d.ts，删掉 modules/legacy 即让红线重新完整。
 */
declare module 'obsidian' {
    interface App {
        setting?: {
            open?: () => void;
        };
        openVaultChooser?: () => void;
        openHelp?: () => void;
    }
}

/**
 * 探不到时说的那句话。
 *
 * 它刻意说清三件事：这一条为什么点不动、这不是你的库出了问题、以及去哪儿做同一件事。
 * 命令不因为探不到就消失——CommandRegistry 的纪律是「命令必须在任何情况下都可见可点，
 * 用户在做不到时该得到一句为什么，而不是眼看着命令凭空不见」。
 */
const UNAVAILABLE_SUFFIX = '：这个 Obsidian 版本没有给出这个入口。它不属于官方公开 API，' +
    'ziminOS 探不到就不硬来。你仍然可以用 Obsidian 自己的按钮做同一件事。';

// ============================================================
// 装配
// ============================================================

export function registerLegacyDock(ctx: ZiminosContext): void {
    const { app } = ctx;

    // 三条都在**点下去的那一刻**才验形，而不是注册时验一次：
    // 注册发生在插件加载最早的一段，而热重载与版本升级都可能让答案在之后改变
    ctx.commands.register(LEGACY_COMMANDS.vault, () => {
        run(LEGACY_COMMANDS.vault.name, bind(app, app.openVaultChooser));
    });

    ctx.commands.register(LEGACY_COMMANDS.help, () => {
        run(LEGACY_COMMANDS.help.name, bind(app, app.openHelp));
    });

    // 设置面板藏在两层上（app.setting.open），两层里任何一层缺席都算探不到
    ctx.commands.register(LEGACY_COMMANDS.settings, () => {
        run(LEGACY_COMMANDS.settings.name, bind(app.setting, app.setting?.open));
    });
}

/**
 * 验形并绑好宿主。
 *
 * 必须 call 而不是把方法摘下来直接调：它们是 Obsidian 自己对象上的方法，
 * 摘下来之后 this 就丢了——那种错不报错，只是点了没反应。
 * 收成一个函数是为了让「验形」这件事全模块只有一种写法，不在三处各写一遍可选链。
 */
function bind<T extends object>(
    host: T | undefined,
    fn: (() => void) | undefined,
): (() => void) | undefined {
    if (!host || typeof fn !== 'function') return undefined;

    return () => fn.call(host);
}

/** 借来的那一步：能调就调，探不到就说人话。绝不抛——它只是一个按钮 */
function run(label: string, opener: (() => void) | undefined): void {
    if (!opener) {
        new Notice(label + UNAVAILABLE_SUFFIX);

        return;
    }

    opener();
}
