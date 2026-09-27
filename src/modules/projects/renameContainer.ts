/**
 * [INPUT]: 依赖 obsidian 的 Modal/ButtonComponent/MarkdownView/Notice/TFile/TFolder/Vault/normalizePath，
 *          core/commands 的 PROJECT_COMMANDS，core/constants 的 FIELDS/FOLDERS/NOTE_TYPES，
 *          core/folders 的路径归属，core/modals 的 TextInputModal，core/types 的 ZiminosContext，
 *          依赖同目录 containerRenameText/moc/nameConflict；日记语义记录与 Eagle 同步由 main 通过函数洞注入
 * [OUTPUT]: 对外提供 EagleContainerRenamer/ContainerRenameRecorder 两个能力洞、registerContainerRenameCommand 与
 *           runContainerRename（当前项目/领域的双确认事务改名）
 * [POS]: projects 的容器身份变更编排层。从容器内任意笔记发起，第一窗预填当前名，
 *        第二窗展示整棵文件树、MOC、所有引用改写与 Eagle 影响面；确认后再次构建计划，
 *        现场与预览任一字节不同就停。本地事务包含文件夹、MOC 名、全库双链/属性/出库单，
 *        失败按磁盘事实逆序回滚；Eagle 是本地提交后的可选副作用，不能反向撤销已安全落盘的笔记
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, MarkdownView, Modal, Notice, TFile, TFolder, Vault, normalizePath } from 'obsidian';
import type { App } from 'obsidian';
import { PROJECT_COMMANDS } from '../../core/commands';
import { FIELDS, FOLDERS, NOTE_TYPES } from '../../core/constants';
import { isInFolder, normalizeFolderPath } from '../../core/folders';
import { TextInputModal } from '../../core/modals';
import type { ZiminosContext } from '../../core/types';
import { rewriteContainerReferences } from './containerRenameText';
import type { ContainerRenameFacts } from './containerRenameText';
import { mocPathOf, resolveMocPath } from './moc';
import { findContainerNameConflicts } from './nameConflict';

export type EagleContainerRenamer = (oldName: string, newName: string) => Promise<'renamed' | 'missing' | 'skipped'>;
export type ContainerRenameRecorder = (oldName: string, newName: string, newMocPath: string) => Promise<void>;

interface ContainerIdentity {
    readonly folder: TFolder;
    readonly moc: TFile;
    readonly name: string;
    readonly label: '项目' | '领域';
    readonly root: string;
}

interface ContentEdit {
    readonly file: TFile;
    readonly pathAtPreview: string;
    readonly before: string;
    readonly after: string;
    readonly replacements: number;
}

interface RenamePlan {
    readonly identity: ContainerIdentity;
    readonly newName: string;
    readonly newFolderPath: string;
    readonly newMocPath: string;
    readonly pathPairs: readonly { oldPath: string; newPath: string }[];
    readonly edits: readonly ContentEdit[];
    readonly facts: ContainerRenameFacts;
    readonly fingerprint: string;
}

const pendingRenames = new WeakSet<TFolder>();

export function registerContainerRenameCommand(
    ctx: ZiminosContext,
    renameEagle?: EagleContainerRenamer,
    recordRename?: ContainerRenameRecorder,
): void {
    ctx.commands.register(PROJECT_COMMANDS.rename, () => {
        void runContainerRename(ctx, renameEagle, recordRename);
    });
}

export async function runContainerRename(
    ctx: ZiminosContext,
    renameEagle?: EagleContainerRenamer,
    recordRename?: ContainerRenameRecorder,
): Promise<void> {
    let locked: TFolder | null = null;

    try {
        await saveAllDisplayedMarkdownViews(ctx.app);

        const identity = resolveCurrentContainer(ctx);
        if (!identity) return;
        if (pendingRenames.has(identity.folder)) {
            new Notice(`这个${identity.label}已有改名操作正在进行。`);
            return;
        }

        locked = identity.folder;
        pendingRenames.add(locked);

        const answer = await new TextInputModal(ctx.app, {
            title: `修改当前${identity.label}名称`,
            hint: '下一步会列出所有文件、内容改写与双链，此时尚不会写入。',
            initial: identity.name,
            required: '新名称不能为空。',
        }).openAndGetValue();
        if (answer === null) return;

        const newName = answer.trim();
        const invalid = validateName(identity.name, newName);
        if (invalid) {
            new Notice(invalid, 8000);
            return;
        }

        const conflicts = findContainerNameConflicts(ctx.app, ctx.settings, newName);
        if (conflicts.length) {
            new Notice(`新名称已被占用：${conflicts.map((item) => item.path).join('、')}`, 8000);
            return;
        }

        const plan = await buildPlan(ctx, identity, newName);
        const confirmed = await showRenamePreview(ctx.app, plan, Boolean(ctx.settings.eagleEnabled));
        if (!confirmed) return;

        await saveAllDisplayedMarkdownViews(ctx.app);
        const liveIdentity = resolveCurrentContainer(ctx, identity.folder);
        if (!liveIdentity) throw new Error('确认期间容器身份已改变，本次操作已停止。');
        const livePlan = await buildPlan(ctx, liveIdentity, newName);
        if (livePlan.fingerprint !== plan.fingerprint) {
            throw new Error('确认期间文件或双链已变化，请重新执行命令查看新预览。');
        }

        await applyPlan(ctx, livePlan);

        let eagleWarning = '';
        if (renameEagle) {
            try {
                const result = await renameEagle(identity.name, newName);
                if (result === 'missing') eagleWarning = '；Eagle 中没有同名附件文件夹，未作改动';
            } catch (error) {
                eagleWarning = `；但 Eagle 文件夹未同步：${messageOf(error)}`;
            }
        }

        try {
            await recordRename?.(identity.name, newName, livePlan.newMocPath);
        } catch (error) {
            new Notice(`${identity.label}改名已完成，但日记记录失败：${messageOf(error)}`, 10000);
            return;
        }

        const movedMoc = ctx.app.vault.getAbstractFileByPath(livePlan.newMocPath);
        if (movedMoc instanceof TFile) await ctx.app.workspace.getLeaf(false).openFile(movedMoc, { active: true });
        new Notice(`${identity.label}已改名：${identity.name} → ${newName}${eagleWarning}`, eagleWarning ? 12000 : 5000);
    } catch (error) {
        new Notice(`修改名称失败：${messageOf(error)}`, 12000);
    } finally {
        if (locked) pendingRenames.delete(locked);
    }
}

function resolveCurrentContainer(ctx: ZiminosContext, expectedFolder?: TFolder): ContainerIdentity | null {
    const active = ctx.app.workspace.getActiveFile();
    if (!(active instanceof TFile)) {
        new Notice('请先打开项目或领域中的任意一篇笔记。');
        return null;
    }

    const roots = [
        { path: normalizeFolderPath(ctx.settings.projectFolder, FOLDERS.projects), label: '项目' as const },
        { path: normalizeFolderPath(ctx.settings.areaFolder, FOLDERS.areas), label: '领域' as const },
        { path: normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives), label: '项目' as const },
    ];

    for (const root of roots) {
        if (!isInFolder(active.path, root.path) || active.path === root.path) continue;
        const name = active.path.slice(root.path.length + 1).split('/')[0];
        const folderPath = normalizePath(`${root.path}/${name}`);
        const folder = ctx.app.vault.getAbstractFileByPath(folderPath);
        if (!(folder instanceof TFolder) || (expectedFolder && folder !== expectedFolder)) continue;

        const mocPath = resolveMocPath(ctx.app, folderPath, name);
        const moc = ctx.app.vault.getAbstractFileByPath(mocPath);
        if (!(moc instanceof TFile)) {
            new Notice(`当前文件夹缺少 MOC：${mocPath}`);
            return null;
        }

        const type = String(ctx.app.metadataCache.getFileCache(moc)?.frontmatter?.[FIELDS.type] ?? '').trim();
        if (type === NOTE_TYPES.book) {
            new Notice('当前容器是一本书。本命令只修改项目或领域名称。');
            return null;
        }
        if (root.label === '项目' && type !== NOTE_TYPES.project) {
            new Notice('当前 MOC 不是项目（type: project）。');
            return null;
        }
        if (root.label === '领域' && type !== NOTE_TYPES.area) {
            new Notice('当前 MOC 不是领域（type: area）。');
            return null;
        }

        return { folder, moc, name, label: root.label, root: root.path };
    }

    new Notice('当前笔记不在项目、归档项目或领域的第一层容器中。');
    return null;
}

async function buildPlan(ctx: ZiminosContext, identity: ContainerIdentity, newName: string): Promise<RenamePlan> {
    if (ctx.app.vault.getAbstractFileByPath(normalizePath(`${identity.root}/${newName}`))) {
        throw new Error(`目标位置已存在：${identity.root}/${newName}`);
    }

    const newFolderPath = normalizePath(`${identity.root}/${newName}`);
    const newMocPath = mocPathOf(newFolderPath, newName);
    const pairs: { oldPath: string; newPath: string }[] = [];

    Vault.recurseChildren(identity.folder, (child) => {
        if (child instanceof TFile) {
            const relative = child.path.slice(identity.folder.path.length + 1);
            const target = child === identity.moc ? newMocPath : normalizePath(`${newFolderPath}/${relative}`);
            pairs.push({ oldPath: child.path, newPath: target });
        }
    });
    pairs.sort((left, right) => left.oldPath.localeCompare(right.oldPath));

    const paths = new Map(pairs.map((pair) => [pair.oldPath, pair.newPath]));
    const facts: ContainerRenameFacts = {
        oldName: identity.name,
        newName,
        oldFolderPath: identity.folder.path,
        newFolderPath,
        oldMocPath: identity.moc.path,
        newMocPath,
        paths,
    };
    const edits: ContentEdit[] = [];

    for (const file of ctx.app.vault.getMarkdownFiles()) {
        const before = await ctx.app.vault.cachedRead(file);
        const rewritten = rewriteContainerReferences(before, file.path, facts, (linkpath, sourcePath) =>
            ctx.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath)?.path ?? null,
        );
        if (rewritten.content === before) continue;
        edits.push({ file, pathAtPreview: file.path, before, after: rewritten.content, replacements: rewritten.replacements });
    }

    edits.sort((left, right) => left.pathAtPreview.localeCompare(right.pathAtPreview));
    const fingerprint = JSON.stringify({
        folder: identity.folder.path,
        moc: identity.moc.path,
        newName,
        pairs,
        edits: edits.map((edit) => [edit.pathAtPreview, edit.before, edit.after]),
    });

    return { identity, newName, newFolderPath, newMocPath, pathPairs: pairs, edits, facts, fingerprint };
}

async function applyPlan(ctx: ZiminosContext, plan: RenamePlan): Promise<void> {
    const { app, guard } = ctx;
    const applied: ContentEdit[] = [];

    markPlan(ctx, plan);

    try {
        await app.vault.rename(plan.identity.folder, plan.newFolderPath);
        const movedMocPath = normalizePath(`${plan.newFolderPath}/${plan.identity.moc.name}`);
        if (plan.identity.moc.path !== movedMocPath || app.vault.getAbstractFileByPath(movedMocPath) !== plan.identity.moc) {
            throw new Error('文件夹改名后 MOC 身份已改变。');
        }
        await app.vault.rename(plan.identity.moc, plan.newMocPath);

        for (const edit of plan.edits) {
            try {
                await app.vault.process(edit.file, (content) => {
                    if (content !== edit.before) throw new Error(`写入前内容已改变：${edit.file.path}`);
                    guard.mark(edit.file.path);
                    return edit.after;
                });
                applied.push(edit);
            } catch (error) {
                const current = await app.vault.cachedRead(edit.file);
                if (current === edit.after) applied.push(edit);
                throw error;
            }
        }
    } catch (operationError) {
        const rollbackErrors: string[] = [];

        for (const edit of [...applied].reverse()) {
            try {
                await app.vault.process(edit.file, (content) => {
                    if (content !== edit.after) throw new Error(`回滚时内容又被修改：${edit.file.path}`);
                    guard.mark(edit.file.path);
                    return edit.before;
                });
            } catch (error) {
                rollbackErrors.push(messageOf(error));
            }
        }

        try {
            if (plan.identity.moc.path === plan.newMocPath) {
                const oldMocName = plan.facts.oldMocPath.split('/').pop() ?? plan.identity.moc.name;
                const oldNameAtNewFolder = normalizePath(`${plan.newFolderPath}/${oldMocName}`);
                await app.vault.rename(plan.identity.moc, oldNameAtNewFolder);
            }
            if (plan.identity.folder.path === plan.newFolderPath) {
                await app.vault.rename(plan.identity.folder, plan.facts.oldFolderPath);
            }
        } catch (error) {
            rollbackErrors.push(messageOf(error));
        }

        const rollback = rollbackErrors.length ? `；自动回滚也失败：${rollbackErrors.join('、')}` : '';
        throw new Error(`${messageOf(operationError)}${rollback}`);
    }
}

function markPlan(ctx: ZiminosContext, plan: RenamePlan): void {
    ctx.guard.mark(plan.facts.oldFolderPath);
    ctx.guard.mark(plan.newFolderPath);
    for (const pair of plan.pathPairs) {
        ctx.guard.mark(pair.oldPath);
        ctx.guard.mark(pair.newPath);
    }
    for (const edit of plan.edits) ctx.guard.mark(edit.file.path);
}

function validateName(oldName: string, newName: string): string | null {
    if (newName === oldName) return '新名称与当前名称相同，没有需要修改的内容。';
    if (/[\\/]/.test(newName) || newName === '.' || newName === '..') return '名称不能包含斜杠、反斜杠，也不能是 . 或 ..。';
    if (newName.includes(']') || newName.includes('|') || newName.includes('#') || /[\u0000-\u001F\u007F]/.test(newName)) {
        return '名称不能包含 ]、|、# 或控制字符，否则无法安全生成双链。';
    }
    return null;
}

function showRenamePreview(app: App, plan: RenamePlan, eagleEnabled: boolean): Promise<boolean> {
    return new Promise((resolve) => new RenamePreviewModal(app, plan, eagleEnabled, resolve).open());
}

class RenamePreviewModal extends Modal {
    private settled = false;

    constructor(
        app: App,
        private readonly plan: RenamePlan,
        private readonly eagleEnabled: boolean,
        private readonly resolveResult: (value: boolean) => void,
    ) {
        super(app);
    }

    onOpen(): void {
        this.modalEl.style.width = 'min(880px, calc(100vw - 32px))';
        this.contentEl.style.maxHeight = '70vh';
        this.contentEl.style.overflowY = 'auto';
        this.titleEl.setText(`确认修改${this.plan.identity.label}名称`);
        this.contentEl.createEl('p', { text: `${this.plan.identity.name} → ${this.plan.newName}` });
        this.section('文件与目录', [
            `${this.plan.facts.oldFolderPath} → ${this.plan.newFolderPath}`,
            ...this.plan.pathPairs.map((pair) => `${pair.oldPath} → ${pair.newPath}`),
        ]);
        this.section('内容、属性与双链', this.plan.edits.length
            ? this.plan.edits.map((edit) => `${edit.pathAtPreview}（${edit.replacements} 处）`)
            : ['无外部引用需要改写']);
        this.section('Eagle', [this.eagleEnabled
            ? `项目/${this.plan.identity.name} → 项目/${this.plan.newName}${this.plan.identity.label === '领域' ? '（Eagle 将领域与项目统一归档在这个根目录）' : ''}`
            : '未启用：不改 Eagle']);

        const warning = this.contentEl.createEl('p', {
            text: '确认后会原子执行上述本地变更；任一步失败将自动回滚。',
        });
        warning.style.fontWeight = '600';

        const bar = this.contentEl.createDiv();
        bar.style.display = 'flex';
        bar.style.justifyContent = 'flex-end';
        bar.style.gap = '8px';
        new ButtonComponent(bar).setButtonText('取消').onClick(() => this.close());
        new ButtonComponent(bar).setButtonText('确认全部修改').setWarning().onClick(() => {
            this.settle(true);
            this.close();
        });
    }

    onClose(): void {
        this.settle(false);
        this.contentEl.empty();
    }

    private section(title: string, items: readonly string[]): void {
        this.contentEl.createEl('h3', { text: title });
        const list = this.contentEl.createEl('ul');
        for (const item of items) list.createEl('li', { text: item });
    }

    private settle(value: boolean): void {
        if (this.settled) return;
        this.settled = true;
        this.resolveResult(value);
    }
}

async function saveAllDisplayedMarkdownViews(app: App): Promise<void> {
    const saves: Promise<void>[] = [];
    app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView) saves.push(leaf.view.save());
    });
    await Promise.all(saves);
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
