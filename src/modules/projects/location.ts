/**
 * [INPUT]: 依赖 core/folders 的目录设置规范化、core/constants 的资源根与 core/types 的 ZiminosSettings 契约
 * [OUTPUT]: 对外提供 NoteAttachmentRoute/attachmentRouteOfNotePath，从一篇笔记的库内路径反推“项目/容器名”或“日记”附件路由
 * [POS]: projects 模块的容器位置事实出口。项目/领域/资源/存档共用“根目录下第一层文件夹”的容器身份，
 *        日记根则折叠为单一路由；main 只把结果注入 Eagle，附件模块不反向认识任一业务目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { normalizeFolderPath } from '../../core/folders';
import { FOLDERS } from '../../core/constants';
import { DEFAULT_SETTINGS } from '../../core/types';
import type { ZiminosSettings } from '../../core/types';

export type NoteAttachmentRoute =
    | { readonly kind: 'project'; readonly name: string }
    | { readonly kind: 'diary' };

interface RouteRoot {
    readonly root: string;
    readonly kind: NoteAttachmentRoute['kind'];
}

/**
 * 四棵内容根都以第一层文件夹为容器身份，更深的卡片目录不改归属。
 * 日记的日/周/月/季/年子目录只是时间粒度，不是五个 Eagle 项目，故全部折叠为 diary。
 */
export function attachmentRouteOfNotePath(
    settings: ZiminosSettings,
    notePath: string,
): NoteAttachmentRoute | null {
    const roots: RouteRoot[] = [
        { root: normalizeFolderPath(settings.projectFolder, DEFAULT_SETTINGS.projectFolder), kind: 'project' },
        { root: normalizeFolderPath(settings.areaFolder, DEFAULT_SETTINGS.areaFolder), kind: 'project' },
        { root: FOLDERS.resources, kind: 'project' },
        { root: normalizeFolderPath(settings.archiveFolder, DEFAULT_SETTINGS.archiveFolder), kind: 'project' },
        { root: normalizeFolderPath(settings.diaryFolder, DEFAULT_SETTINGS.diaryFolder), kind: 'diary' },
    ];

    roots.sort((left, right) => right.root.length - left.root.length);

    for (const { root, kind } of roots) {
        const prefix = `${root}/`;

        if (!notePath.startsWith(prefix)) continue;
        if (kind === 'diary') return { kind: 'diary' };

        const parts = notePath.slice(prefix.length).split('/').filter(Boolean);

        // 至少要有“容器名/笔记.md”两段；根目录散落笔记不凭文件名猜归属。
        return parts.length >= 2 ? { kind: 'project', name: parts[0] } : null;
    }

    return null;
}
