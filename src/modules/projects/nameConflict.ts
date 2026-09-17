/**
 * [INPUT]: 依赖 obsidian 的 Modal/ButtonComponent 与 App 类型，依赖 core/constants 的四个 PARA
 *          内容根目录、core/folders 的 normalizeFolderPath，core/types 的 ZiminosSettings
 * [OUTPUT]: 对外提供 ContainerNameConflict 事实、findContainerNameConflicts 四根目录同名检索、
 *           confirmContainerNameConflict 明示继续授权
 * [POS]: projects 的容器命名边界；只把项目、领域、资源、存档根目录的第一层视为
 *        可比较容器，不扫普通子目录制造假阳性。它只陈述“哪里已有同名”并索取授权，
 *        目标位置覆盖与提交前复核仍由 createContainer 负责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, Modal, normalizePath } from 'obsidian';
import type { App } from 'obsidian';
import { FOLDERS } from '../../core/constants';
import { normalizeFolderPath } from '../../core/folders';
import type { ZiminosSettings } from '../../core/types';

/** 一个已存在的同名容器位置；多个角色可能因自定义设置指向同一根目录 */
export interface ContainerNameConflict {
    readonly roles: readonly string[];
    readonly path: string;
}

interface ContainerRoot {
    readonly roles: readonly string[];
    readonly path: string;
}

/**
 * 四个有“容器”语义的根目录。
 *
 * 项目、领域、存档尊重用户设置；资源没有设置项，因此读固定 PARA 事实。
 * 若用户把两个角色配到同一路径，返回时合并角色，避免在弹窗里报两次同一个地方。
 */
function containerRoots(settings: ZiminosSettings): readonly ContainerRoot[] {
    const configured = [
        {
            role: '项目',
            path: normalizeFolderPath(settings.projectFolder, FOLDERS.projects),
        },
        {
            role: '领域',
            path: normalizeFolderPath(settings.areaFolder, FOLDERS.areas),
        },
        { role: '资源', path: FOLDERS.resources },
        {
            role: '存档',
            path: normalizeFolderPath(settings.archiveFolder, FOLDERS.archives),
        },
    ] as const;
    const rolesByPath = new Map<string, string[]>();

    for (const root of configured) {
        const roles = rolesByPath.get(root.path) ?? [];

        if (!roles.includes(root.role)) roles.push(root.role);
        rolesByPath.set(root.path, roles);
    }

    return [...rolesByPath].map(([path, roles]) => ({ path, roles }));
}

/**
 * 查找四个 PARA 容器根目录第一层的同名路径。
 *
 * 这不是全库文本搜索：项目内部的“素材”子目录不是另一个项目，不应该因为同名就阻塞新建。
 */
export function findContainerNameConflicts(
    app: App,
    settings: ZiminosSettings,
    containerName: string,
): readonly ContainerNameConflict[] {
    const conflicts: ContainerNameConflict[] = [];

    for (const root of containerRoots(settings)) {
        const path = normalizePath(`${root.path}/${containerName}`);

        if (!app.vault.getAbstractFileByPath(path)) continue;

        conflicts.push({ roles: root.roles, path });
    }

    return conflicts;
}

/** 列出同名位置，只有用户明确点“仍然创建”才返回 true */
export function confirmContainerNameConflict(
    app: App,
    kindLabel: string,
    containerName: string,
    conflicts: readonly ContainerNameConflict[],
): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        new ContainerNameConflictModal(
            app,
            kindLabel,
            containerName,
            conflicts,
            resolve,
        ).open();
    });
}

/** 同名可能是用户有意的，因此这里是显式授权门，不把警告假装成绝对禁止 */
class ContainerNameConflictModal extends Modal {
    private resolver: ((value: boolean) => void) | null;

    private settled = false;

    constructor(
        app: App,
        private readonly kindLabel: string,
        private readonly containerName: string,
        private readonly conflicts: readonly ContainerNameConflict[],
        resolver: (value: boolean) => void,
    ) {
        super(app);
        this.resolver = resolver;
    }

    onOpen(): void {
        this.modalEl.style.width = '560px';
        this.modalEl.style.maxWidth = 'calc(100vw - 32px)';
        this.titleEl.setText('发现同名容器');
        this.contentEl.empty();

        const description = this.contentEl.createEl('p', {
            text: `库中已经有名为“${this.containerName}”的容器：`,
        });
        description.style.margin = '0 0 12px';

        const list = this.contentEl.createEl('ul');
        list.style.margin = '0';
        list.style.paddingLeft = '1.4em';

        for (const conflict of this.conflicts) {
            const item = list.createEl('li');
            item.style.margin = '6px 0';

            item.createEl('strong', { text: `${conflict.roles.join(' / ')}：` });
            const path = item.createEl('code', { text: conflict.path });
            path.style.overflowWrap = 'anywhere';
        }

        const hasArchiveConflict = this.conflicts.some((conflict) =>
            conflict.roles.includes('存档'),
        );
        const willBeArchived = this.kindLabel === '项目' || this.kindLabel === '读书笔记';
        const warning = this.contentEl.createEl('p', {
            text:
                hasArchiveConflict && willBeArchived
                    ? '同名本身是允许的，但容易误认；而且存档里已有同名容器，这个新容器日后归档时会被阻止。'
                    : '同名本身是允许的，但容易在搜索、链接和人工整理时误认；建议用更具体的名称。',
        });
        warning.style.margin = '14px 0 0';
        warning.style.color = 'var(--text-muted)';
        warning.style.lineHeight = '1.6';

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '18px';

        new ButtonComponent(buttonBar)
            .setButtonText(`仍然创建${this.kindLabel}`)
            .onClick(() => this.settle(true));

        const cancelButton = new ButtonComponent(buttonBar)
            .setButtonText('取消，换个名称')
            .setCta()
            .onClick(() => this.settle(false));

        cancelButton.buttonEl.focus();
    }

    onClose(): void {
        this.settle(false);
        this.contentEl.empty();
    }

    private settle(value: boolean): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);

        this.close();
    }
}
