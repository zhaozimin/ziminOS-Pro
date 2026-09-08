/**
 * [INPUT]: 依赖 obsidian 的 FileSystemAdapter、Platform 与 App 类型
 * [OUTPUT]: 对外提供 vaultBasePath（笔记库在这台机器上的绝对路径）与
 *           localPath（库内路径 → 本机绝对路径），三个消费方共用：外观片段、状态栏与 Eagle 伴侣安装包；
 *           两函数都在库不落在本机文件系统上时返回 null
 * [POS]: core 里唯一知道「本机绝对路径怎么算」的地方，两个模块共用：
 *        外观片段要交给操作系统，文件模块要交到剪贴板，Eagle 模块要显示随插件交付的伴侣包。
 *        它单独成文件而不是留在其中任何一处，判据是这件事**谁都不属于**——
 *        它既不谈片段也不谈笔记，只回答「Obsidian 眼里的这个相对路径，
 *        在操作系统眼里叫什么」，这正是 core 的收留标准。
 *        它同时把备案第 10 条那句「借来的只有打开这一步」变成物理事实：
 *        路径的计算住在这里，与 Electron 无关，因此 reveal.ts 的
 *        「只会因为 Electron 变而变」才真的成立。
 *        两个函数都返回可空而不抛：库落不落在本机文件系统上是**事实**不是错误，
 *        怎么应对（降级、还是翻成一句中文抛出去）是调用方的事，
 *        而事实层一旦替调用方决定了反应，两个调用方就只能共用同一种反应
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FileSystemAdapter, Platform } from 'obsidian';
import type { App } from 'obsidian';

/** Windows 的分隔符。它只在这一个文件里出现，因为只有这里需要说人机之间的路径方言 */
const WINDOWS_SEPARATOR = '\\';

/**
 * 笔记库在这台机器上的绝对路径；库不在本机文件系统上（手机端、某些同步实现）时为 null。
 *
 * getBasePath 是 obsidian.d.ts 里标着 @public 的方法，FileSystemAdapter 是它标着 @public
 * 的导出类，因此「库在哪」这件事全程由 Obsidian 回答，这里一个字都不猜。
 */
export function vaultBasePath(app: App): string | null {
    const adapter = app.vault.adapter;

    return adapter instanceof FileSystemAdapter ? adapter.getBasePath() : null;
}

/**
 * 库内相对路径 → 本机绝对路径。
 *
 * 分隔符按平台给，而不是一律用正斜杠：库内路径永远是正斜杠，而 Windows 上的库根是
 * `C:\Users\…` 那种反斜杠形态，直接拼出来的混合体各种 API 都认，但这条路径的去处是
 * **人**——用户要把它粘进终端、粘进资源管理器、发给同事，那时它得看起来像这台机器上的
 * 一条路径，而不是两半拼起来的。判据取 Platform.isWin 而不是「库根里有没有反斜杠」：
 * 反斜杠在 macOS 上是合法的文件名字符，拿它猜平台会在某个人的文件夹名上出错。
 */
export function localPath(app: App, relative: string): string | null {
    const base = vaultBasePath(app);

    if (base === null) return null;

    return Platform.isWin
        ? `${base}${WINDOWS_SEPARATOR}${relative.split('/').join(WINDOWS_SEPARATOR)}`
        : `${base}/${relative}`;
}
