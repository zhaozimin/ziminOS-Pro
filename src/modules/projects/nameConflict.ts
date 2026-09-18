/**
 * [INPUT]: 依赖 obsidian 的 Modal/ButtonComponent 与 App 类型，依赖 core/constants 的四个 PARA
 *          内容根目录、core/folders 的 normalizeFolderPath，core/types 的 ZiminosSettings
 * [OUTPUT]: 对外提供 ContainerNameConflict 事实、findContainerNameConflicts 四根目录同名检索、
 *           requestAvailableContainerName 同流程更名能力
 * [POS]: projects 的容器命名边界；只把项目、领域、资源、存档根目录的第一层视为
 *        可比较容器，不扫普通子目录制造假阳性。发现重名后在同一个弹窗列出位置并接住
 *        新名称，直到名称可用或人主动取消；目标位置防覆盖与提交前复核仍由 createContainer 负责
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

/**
 * 名称无冲突就原样返回；有冲突则在同一个弹窗里展示位置并等待改名。
 *
 * 弹窗内部会对每次新输入重新检索，因此连续撞名不会退出命令，也不会叠出多层弹窗。
 */
export function requestAvailableContainerName(
    app: App,
    settings: ZiminosSettings,
    kindLabel: string,
    containerName: string,
): Promise<string | null> {
    const conflicts = findContainerNameConflicts(app, settings, containerName);

    if (conflicts.length === 0) return Promise.resolve(containerName);

    return new Promise<string | null>((resolve) => {
        new ContainerNameConflictModal(
            app,
            settings,
            kindLabel,
            containerName,
            conflicts,
            resolve,
        ).open();
    });
}

/** 同名纠错只占一个弹窗：列表与输入框一起更新，不让人重新运行命令 */
class ContainerNameConflictModal extends Modal {
    private resolver: ((value: string | null) => void) | null;

    private settled = false;

    private conflictEl: HTMLElement | null = null;

    private inputEl: HTMLInputElement | null = null;

    private errorEl: HTMLElement | null = null;

    private currentName: string;

    private currentConflicts: readonly ContainerNameConflict[];

    constructor(
        app: App,
        private readonly settings: ZiminosSettings,
        private readonly kindLabel: string,
        containerName: string,
        conflicts: readonly ContainerNameConflict[],
        resolver: (value: string | null) => void,
    ) {
        super(app);
        this.currentName = containerName;
        this.currentConflicts = conflicts;
        this.resolver = resolver;
    }

    onOpen(): void {
        this.modalEl.style.width = '560px';
        this.modalEl.style.maxWidth = 'calc(100vw - 32px)';
        this.titleEl.setText(`${this.kindLabel}名称已存在`);
        this.contentEl.empty();

        this.conflictEl = this.contentEl.createDiv();
        this.renderConflicts();

        const label = this.contentEl.createEl('label', {
            text: `请输入新的${this.kindLabel}名称`,
        });
        label.style.display = 'block';
        label.style.margin = '16px 0 6px';
        label.style.fontWeight = '600';

        const inputEl = this.contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
        });
        inputEl.id = 'ziminos-container-name-conflict-input';
        inputEl.style.width = '100%';
        label.htmlFor = inputEl.id;
        this.inputEl = inputEl;

        const errorEl = this.contentEl.createEl('p');
        errorEl.style.minHeight = '1.4em';
        errorEl.style.margin = '6px 0 0';
        errorEl.style.color = 'var(--text-error)';
        this.errorEl = errorEl;

        inputEl.addEventListener('input', () => {
            this.showError('');
        });
        inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.isComposing) return;

            event.preventDefault();
            this.submit();
        });

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '18px';

        new ButtonComponent(buttonBar)
            .setButtonText('取消')
            .onClick(() => this.close());

        new ButtonComponent(buttonBar)
            .setButtonText('使用新名称继续')
            .setCta()
            .onClick(() => this.submit());

        inputEl.focus();
        inputEl.select();
    }

    onClose(): void {
        this.settle(null);
        this.contentEl.empty();
    }

    /** 用当前冲突事实重画列表；再次撞名时不关窗，只替换这一区 */
    private renderConflicts(): void {
        if (!this.conflictEl) return;

        this.conflictEl.empty();

        const description = this.conflictEl.createEl('p', {
            text: `库中已经有名为“${this.currentName}”的容器：`,
        });
        description.style.margin = '0 0 12px';

        const list = this.conflictEl.createEl('ul');
        list.style.margin = '0';
        list.style.paddingLeft = '1.4em';

        for (const conflict of this.currentConflicts) {
            const item = list.createEl('li');
            item.style.margin = '6px 0';

            item.createEl('strong', { text: `${conflict.roles.join(' / ')}：` });
            const path = item.createEl('code', { text: conflict.path });
            path.style.overflowWrap = 'anywhere';
        }

        const guidance = this.conflictEl.createEl('p', {
            text: '请在下方直接换一个名称；确认后会继续刚才的创建流程，不需要重新运行命令。',
        });
        guidance.style.margin = '14px 0 0';
        guidance.style.color = 'var(--text-muted)';
        guidance.style.lineHeight = '1.6';
    }

    /** 校验并重查新名称；仍冲突时留在原弹窗，可继续修改 */
    private submit(): void {
        if (!this.inputEl) return;

        const candidate = this.inputEl.value.trim();

        if (!candidate) {
            this.showError(`请输入新的${this.kindLabel}名称。`);
            return;
        }

        if (/[\\/]/.test(candidate) || candidate === '.' || candidate === '..') {
            this.showError(`${this.kindLabel}名称不能包含斜杠、反斜杠，也不能是 . 或 ..。`);
            return;
        }

        const conflicts = findContainerNameConflicts(this.app, this.settings, candidate);

        if (conflicts.length > 0) {
            this.currentName = candidate;
            this.currentConflicts = conflicts;
            this.renderConflicts();
            this.showError('这个名称仍然重复，请再换一个。');
            this.inputEl.focus();
            this.inputEl.select();
            return;
        }

        this.settle(candidate);
        this.close();
    }

    private showError(message: string): void {
        if (this.errorEl) this.errorEl.setText(message);
    }

    private settle(value: string | null): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);

        this.close();
    }
}
