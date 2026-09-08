/**
 * [INPUT]: 依赖 core/folders 的目录设置规范化、core/types 的 ZiminosSettings 契约
 * [OUTPUT]: 对外提供 projectNameOfNotePath，从一篇笔记的库内路径反推出所属项目名
 * [POS]: projects 模块的项目位置判定器。项目名只认“项目根/第一层目录”，同时覆盖进行中与归档项目；
 *        main 把这个能力注入 Eagle，避免附件模块自行复制项目目录语义或反向依赖 projects
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { normalizeFolderPath } from '../../core/folders';
import { DEFAULT_SETTINGS } from '../../core/types';
import type { ZiminosSettings } from '../../core/types';

/**
 * 项目名就是项目根目录下的第一层文件夹名；更深的卡片目录不改变归属。
 * 归档只搬项目整棵目录，不改变身份，因此活动根与归档根使用同一条判定。
 */
export function projectNameOfNotePath(settings: ZiminosSettings, notePath: string): string | null {
    const roots = Array.from(new Set([
        normalizeFolderPath(settings.projectFolder, DEFAULT_SETTINGS.projectFolder),
        normalizeFolderPath(settings.archiveFolder, DEFAULT_SETTINGS.archiveFolder),
    ])).sort((left, right) => right.length - left.length);

    for (const root of roots) {
        const prefix = `${root}/`;

        if (!notePath.startsWith(prefix)) continue;

        const parts = notePath.slice(prefix.length).split('/').filter(Boolean);

        // 至少要有“项目名/笔记.md”两段；项目根下的散落笔记不凭文件名猜归属。
        return parts.length >= 2 ? parts[0] : null;
    }

    return null;
}
