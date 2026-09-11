/**
 * [INPUT]: 依赖 obsidian 的 App 类型，接收设置归一化后的模块目录与新旧 MOC 默认路径
 * [OUTPUT]: 对外提供 basenameOf 与 resolveBuiltInMocPath，统一 MOC 文件名提取和存量兼容寻址
 * [POS]: contacts 的命名兼容层；新库只产出 `MOC-目录名`，旧库继续沿用已经存在的旧名，
 *        防止插件升级后新人物写出一条指向不存在新 MOC 的双链
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { App } from 'obsidian';

/** 从笔记路径取出可用于双链的名字。 */
export function basenameOf(path: string): string {
    return path.replace(/\.md$/, '').split('/').pop() ?? path;
}

/**
 * 新名优先、旧名兜底；两者都不存在时返回新名供 seed 创建。
 *
 * 升级不能静默改用户文件名，但也不能让后续建档突然指向一个不存在的 MOC。
 * 把选择集中在这里，开荒、模块补齐与新建人脉才会看见同一个目标。
 */
export function resolveBuiltInMocPath(
    app: App,
    folder: string,
    preferredDefaultPath: string,
    legacyDefaultPath: string,
): string {
    const preferred = `${folder}/${basenameOf(preferredDefaultPath)}.md`;

    if (app.vault.getAbstractFileByPath(preferred)) return preferred;

    const legacy = `${folder}/${basenameOf(legacyDefaultPath)}.md`;

    return app.vault.getAbstractFileByPath(legacy) ? legacy : preferred;
}
