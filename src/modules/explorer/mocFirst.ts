/**
 * [INPUT]: 依赖 obsidian 的 TFile、View/TFolder 类型及 core/types 的运行时上下文；
 *          由 main 注入本文件夹的 MOC 路径，沿用项目模块的新旧命名规则
 * [OUTPUT]: 对外提供 FolderMocResolver 与 registerMocFirst
 * [POS]: 文件浏览器的 MOC 置顶适配。宿主先排序，本文件只前移唯一 MOC。
 *        getSortedFolderItems/requestSort 是非公开宿主边界。
 *        运行时验形后才接入，保留原生树节点与虚拟滚动。
 *        卸载恢复原方法；其他插件后续包裹时只停用自身逻辑。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { TFolder, View } from 'obsidian';
import type { ZiminosContext } from '../../core/types';

export type FolderMocResolver = (folder: TFolder) => string;

// ============================================================
// 宿主边界：只借原生排序，不改文件、DOM 或排序偏好
// ============================================================

const FILE_EXPLORER_VIEW_TYPE = 'file-explorer';
const SORT_METHOD = 'getSortedFolderItems';

interface SortableExplorer extends View {
    getSortedFolderItems(folder: TFolder): unknown;
    requestSort(): void;
}

interface SortPatch {
    restore(): void;
}

function isSortable(view: View): view is SortableExplorer {
    return SORT_METHOD in view && typeof view.getSortedFolderItems === 'function'
        && 'requestSort' in view && typeof view.requestSort === 'function';
}

/** 只前移命中的原生文件节点，其他节点的身份与相对顺序不变。 */
function mocFirst(items: unknown, path: string): unknown {
    if (!Array.isArray(items)) return items;

    const index = items.findIndex(item =>
        typeof item === 'object' && item !== null && 'file' in item
        && item.file instanceof TFile && item.file.path === path,
    );

    if (index <= 0) return items;

    return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

/** 宿主接口变动或视图正在关闭时，保持插件其余功能可用。 */
function requestSort(view: SortableExplorer): void {
    try {
        view.requestSort();
    } catch {
        // 排序由宿主事件再次触发；此处不启动轮询。
    }
}

function attach(view: SortableExplorer, resolveMoc: FolderMocResolver): SortPatch | null {
    const original = view.getSortedFolderItems;
    const descriptor = Object.getOwnPropertyDescriptor(view, SORT_METHOD);
    let active = true;

    function sorted(this: SortableExplorer, folder: TFolder): unknown {
        const items = original.call(this, folder);

        if (!active) return items;

        try {
            return mocFirst(items, resolveMoc(folder));
        } catch {
            return items;
        }
    }

    try {
        Object.defineProperty(view, SORT_METHOD, {
            configurable: true,
            enumerable: descriptor?.enumerable ?? false,
            writable: true,
            value: sorted,
        });
    } catch {
        return null;
    }

    requestSort(view);

    return {
        restore(): void {
            if (!active) return;

            active = false;

            // 后来的插件若包裹了当前方法，不覆盖它；闭包仍能停用自身的前移动作。
            try {
                if (view.getSortedFolderItems === sorted) {
                    if (descriptor) Object.defineProperty(view, SORT_METHOD, descriptor);
                    else Reflect.deleteProperty(view, SORT_METHOD);
                }
            } catch {
                // 其他插件若锁定了属性，停用的包装仍直接交还原生排序。
            }

            requestSort(view);
        },
    };
}

// ============================================================
// 生命周期：每个原生文件浏览器独立接入，布局变化时核对实例
// ============================================================

export function registerMocFirst(ctx: ZiminosContext, resolveMoc: FolderMocResolver): void {
    const patches = new Map<SortableExplorer, SortPatch>();
    let disposed = false;

    const sync = (): void => {
        if (disposed) return;

        const views = ctx.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE)
            .map(leaf => leaf.view)
            .filter(isSortable);
        const current = new Set(views);

        for (const [view, patch] of patches) {
            if (current.has(view)) continue;

            patches.delete(view);
            patch.restore();
        }

        for (const view of views) {
            if (patches.has(view)) continue;

            const patch = attach(view, resolveMoc);

            if (patch) patches.set(view, patch);
        }
    };

    ctx.app.workspace.onLayoutReady(sync);
    ctx.plugin.registerEvent(ctx.app.workspace.on('layout-change', sync));
    ctx.plugin.register(() => {
        disposed = true;

        for (const patch of patches.values()) patch.restore();
        patches.clear();
    });
}
