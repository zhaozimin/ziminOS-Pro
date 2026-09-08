/**
 * [INPUT]: 依赖 obsidian 公开 Platform 运行时标识
 * [OUTPUT]: 对外提供 isSupportedEagleDesktop，统一判定 Eagle 桥接是否处在 macOS/Windows 桌面端
 * [POS]: Eagle 模块的平台闸门。渲染、传输与设置动作共用它，避免 Linux/移动端出现能打开却永远不可用的半套界面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Platform } from 'obsidian';

export function isSupportedEagleDesktop(): boolean {
    return Platform.isDesktopApp && (Platform.isMacOS || Platform.isWin);
}
