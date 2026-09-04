/**
 * [INPUT]: 依赖 obsidian 的 Platform 与 App 类型；运行时按需 require('electron') 取 shell（仅桌面端）；
 *          依赖 core/localPath 的 vaultBasePath/localPath、
 *          core/constants 的 SNIPPET_FOLDER_NAME/SNIPPET_EXTENSION
 * [OUTPUT]: 对外提供 canReveal（这台机器上能不能交给操作系统打开）、
 *           openSnippetFolder（打开片段目录）、openSnippetFile（打开单个片段）
 * [POS]: 外观模块的第三个成员，也是它的**出境口**：前两个成员一个管事实、一个管呈现，
 *        都待在 Obsidian 里；这一个负责把路径交给操作系统，让用户拿自己惯用的编辑器改 CSS。
 *        它单独成文件而不是并进 snippets.ts，判据是变更理由不同——
 *        那个文件会因为 Obsidian 的 CSS 子系统变而变，这个文件只会因为 Electron 变而变，
 *        两个外部依赖挤在一个文件里，将来任何一处塌方都要把另一处一起翻出来读。
 *        它是全仓库第二处直接向 Electron 伸手的地方（第一处是 books/sourceWeread 的
 *        扫码登录窗口），三条纪律与那一处逐条对齐，见下面那段备案。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform } from 'obsidian';
import type { App } from 'obsidian';
import { SNIPPET_EXTENSION, SNIPPET_FOLDER_NAME } from '../../core/constants';
import { localPath, vaultBasePath } from '../../core/localPath';

// ============================================================
// 与 Electron 的第二处约定（备案第 10 条）
// ============================================================

/**
 * 备案：这是 ziminOS 第二次直接向 Electron 伸手（第一次是微信读书的扫码窗口）。
 *
 * 「把这个文件夹交给访达 / 资源管理器打开」「用系统默认程序打开这个 .css」
 * 在 `obsidian.d.ts`（1.13.1，8482 行）里没有任何入口——全文搜不到 shell、
 * 搜不到 openPath、搜不到 showInFolder，App 的十个公开成员里也没有一个沾边。
 * 不碰它，这两个按钮就不成为功能：面板能列出十二个片段，却没有任何办法把其中一个
 * 交到用户的编辑器手上，而「快速直接改 CSS」正是这两个按钮存在的全部理由。
 *
 * **路径本身不在借用范围内**：绝对路径走的是公开的 `FileSystemAdapter.getBasePath()`
 * （obsidian.d.ts 里标着 @public 的导出类），因此「文件在哪」这件事永远由 Obsidian 回答，
 * 借来的只有「把它打开」这最后一步。v0.21.0 起那段计算搬进了 `core/localPath`——
 * 它与 Electron 无关，留在这里会让本文件「只因 Electron 而变」的说法名不副实。
 *
 * 三条纪律与 sourceWeread 那一处逐条对齐：
 * 其一，只有「打开」这一个动作借用，清单、状态、路径全部走公开 API；
 * 其二，先验 Platform.isDesktopApp 再 require，全程 try/catch 且返回可空，
 *       手机上、或 Obsidian 哪天不再跑在 Electron 上，都只该让这两个按钮消失或说一句人话，
 *       而不是让插件加载失败；
 * 其三，声明与调用同处这一个文件，删掉 modules/appearance 即让本条备案消失。
 */
interface ElectronShell {
    /** 成功返回空串，失败返回一句英文错误——不是抛异常，所以必须看返回值 */
    openPath(path: string): Promise<string>;
    showItemInFolder(path: string): void;
}

/** 探不到 Electron 时说的那句话。它要说清「不是你的库坏了」以及「你仍然可以自己去哪儿做」 */
const NO_SHELL = '这个环境没有给出「交给操作系统打开」的入口（手机端没有，桌面端换了运行时也可能没有）。' +
    'ziminOS 探不到就不硬来——你可以自己打开笔记库文件夹里的 .obsidian/snippets/。';

/** 拿不到本机绝对路径时说的那句话。发生在非本地库（如手机或某些同步实现）上 */
const NO_LOCAL_PATH = '这个笔记库不在本机文件系统上，没有可以交给操作系统的路径。';

// ============================================================
// 能力探测
// ============================================================

/**
 * 这台机器上能不能把路径交给操作系统。
 *
 * 它只回答**稳定且公开**的那半个问题：是不是桌面端、库是不是落在本机文件系统上。
 * Electron 探得到探不到刻意不算进来——那要在点下去的那一刻才验（与 modules/legacy 同一条纪律：
 * 注册发生在加载最早的一段，热重载与版本升级都可能让答案在之后改变）。
 * 两者分工的判据是「画不画」与「点了会怎样」是两个问题：
 * 手机上没有文件管理器可去，画出来就是骗人，所以静默缺席（与 explorer 的角标同一条）；
 * 桌面上按钮照画，万一探不到，用户得到的是一句为什么，而不是一个凭空少掉的按钮。
 */
export function canReveal(app: App): boolean {
    return Platform.isDesktopApp && vaultBasePath(app) !== null;
}

// ============================================================
// 两个出口
// ============================================================

/**
 * 打开片段目录。
 *
 * 目录不存在时先建出来：这个按钮最该有用的时刻恰恰是「库里还一个片段都没有、
 * 我想去放一个进去」，此时报一句「文件夹不存在」等于把人堵在门口。
 * 建目录走公开的 DataAdapter.mkdir，且只在用户点了这个按钮时发生——
 * 人主导那条红线要的是「写入由用户动作触发」，不是「永不写入」。
 */
export async function openSnippetFolder(app: App): Promise<void> {
    const shell = requireShell();
    const folder = `${app.vault.configDir}/${SNIPPET_FOLDER_NAME}`;

    if (!(await app.vault.adapter.exists(folder))) await app.vault.adapter.mkdir(folder);

    const failure = await shell.openPath(absolutePath(app, folder));

    if (failure) throw new Error(failure);
}

/**
 * 用系统默认程序打开一个片段。
 *
 * 返回 true 表示默认程序接手了；false 表示这台机器没有登记 .css 的默认程序，
 * 已经退一步在文件管理器里选中它。这两种都不是失败，所以不抛——
 * 与 setSnippetEnabled 用「即刻生效 / 只落了盘」区分两种成功是同一套写法：
 * 调用方据此决定要不要说话，而不必知道底下分了几条路。
 * 真正的失败（探不到 Electron、拿不到本机路径）照常抛，由呈现层翻成一句中文。
 */
export async function openSnippetFile(app: App, name: string): Promise<boolean> {
    const shell = requireShell();
    const relative = `${app.vault.configDir}/${SNIPPET_FOLDER_NAME}/${name}${SNIPPET_EXTENSION}`;
    const full = absolutePath(app, relative);

    if (!(await shell.openPath(full))) return true;

    // 没有默认程序不该是死路：至少把人送到文件跟前，他自己知道该用什么打开
    shell.showItemInFolder(full);

    return false;
}

// ============================================================
// 内部
// ============================================================

/**
 * 取 Electron 的 shell，探不到就抛一句人话。
 *
 * 在**每次点击**时取而不是启动时取一次，理由与 modules/legacy 完全一致：
 * 注册发生在插件加载最早的一段，而热重载与版本升级都可能让答案在之后改变。
 */
function requireShell(): ElectronShell {
    const shell = resolveShell();

    if (!shell) throw new Error(NO_SHELL);

    return shell;
}

/** 手机上没有 require，Obsidian 日后换掉运行时也一样——两种情况都只该返回 null */
function resolveShell(): ElectronShell | null {
    if (!Platform.isDesktopApp) return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const electron = require('electron') as { shell?: Partial<ElectronShell> };
        const shell = electron?.shell;

        // 声明是一份约定而非事实，两个方法各验一次形：缺任何一个都算探不到，
        // 因为「打不开就退回选中它」这条降级路径要求两个方法同时在场
        return typeof shell?.openPath === 'function' && typeof shell?.showItemInFolder === 'function'
            ? (shell as ElectronShell)
            : null;
    } catch {
        return null;
    }
}

/**
 * 库内相对路径 → 本机绝对路径，拿不到就翻成一句中文抛出去。
 *
 * 算路径这件事住在 core/localPath（状态栏那块路径与这里共用同一份算法，
 * 它也是唯一不引入 node:path 的理由所在）；这里只负责把「库不在本机」这个**事实**
 * 翻成本模块的**反应**——两个出门按钮点下去都该说一句人话，而不是静静地什么都不做。
 */
function absolutePath(app: App, relative: string): string {
    const full = localPath(app, relative);

    if (full === null) throw new Error(NO_LOCAL_PATH);

    return full;
}
