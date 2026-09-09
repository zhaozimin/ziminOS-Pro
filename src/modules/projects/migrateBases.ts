/**
 * [INPUT]: 依赖 obsidian 的 TFile/Modal/Notice/ButtonComponent；依赖 core/constants 的导航、模板路径与
 *          MOC_PREFIX，依赖 core/commands 的迁移命令身份、core/types 的 ZiminosContext，
 *          依赖同目录 baseMigration 的纯文本规划与 moc 的命名约定
 * [OUTPUT]: 对外提供 registerBaseMigrationCommand 与 runBaseMigration
 * [POS]: projects 的存量 Bases 升级编排器。它只在用户主动执行命令后扫描，先把逐文件差异与冲突
 *        完整交给确认弹窗，再以乐观并发校验逐篇写入；任一步失败都逆序恢复本轮已触达文件。
 *        自定义、多 Base 与未闭合围栏只进冲突清单，绝不因“看起来像”而被覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, Modal, Notice, TFile } from 'obsidian';
import { PROJECT_COMMANDS } from '../../core/commands';
import { MOC_PREFIX, NAV_FILE, TEMPLATE_FILES } from '../../core/constants';
import type { ZiminosContext } from '../../core/types';
import {
    applyMigrationBatch,
    isContainerMocIdentity,
    planMocBaseUpgrade,
    planNavigationBaseUpgrade,
} from './baseMigration';
import type { BaseContentUpgrade, BaseUpgradeAction } from './baseMigration';

interface PlannedMigration {
    readonly path: string;
    readonly action: BaseUpgradeAction;
    readonly before: string;
    readonly after: string;
    readonly beforeBlock: string | null;
    readonly afterBlock: string;
}

interface MigrationConflict {
    readonly path: string;
    readonly reason: string;
}

interface MigrationPreview {
    readonly changes: readonly PlannedMigration[];
    readonly conflicts: readonly MigrationConflict[];
    readonly unchangedCount: number;
}

/** 注册入口；闭包锁防止用户在第一轮预览尚未结束时又启动第二轮 */
export function registerBaseMigrationCommand(ctx: ZiminosContext): void {
    let running = false;

    ctx.commands.register(PROJECT_COMMANDS.migrate, () => {
        if (running) {
            new Notice('存量 MOC 数据库升级正在进行，请先完成当前窗口。');

            return;
        }

        running = true;
        void runBaseMigration(ctx)
            .catch((error) => {
                new MigrationReportModal(ctx.app, '存量数据库升级失败', [errorMessage(error)]).open();
            })
            .finally(() => {
                running = false;
            });
    });
}

/** 扫描 → 预览 → 确认 → 原子式迁移；任何异常都在本命令的人机边界内说明 */
export async function runBaseMigration(ctx: ZiminosContext): Promise<void> {
    const scanning = new Notice('正在检查导航与存量 MOC 数据库…', 0);
    let preview: MigrationPreview;

    try {
        preview = await buildMigrationPreview(ctx);
    } catch (error) {
        scanning.hide();
        new MigrationReportModal(ctx.app, '检查失败', [errorMessage(error)]).open();

        return;
    }

    scanning.hide();

    const confirmed = await new BaseMigrationPreviewModal(ctx.app, preview).openAndConfirm();

    if (!confirmed || preview.changes.length === 0) return;

    const migrating = new Notice(`正在迁移 ${preview.changes.length} 个文件…`, 0);

    try {
        await applyMigrationsWithRollback(ctx, preview.changes);
        migrating.hide();

        const summary = [`已升级 ${preview.changes.length} 个文件。`];

        if (preview.conflicts.length) {
            summary.push(`${preview.conflicts.length} 个自定义或异常文件保持原样，请按预览清单人工处理。`);
        }

        new MigrationReportModal(ctx.app, '存量数据库升级完成', summary).open();
    } catch (error) {
        migrating.hide();
        new MigrationReportModal(ctx.app, '存量数据库升级失败', [errorMessage(error)]).open();
    }
}

async function buildMigrationPreview(ctx: ZiminosContext): Promise<MigrationPreview> {
    const changes: PlannedMigration[] = [];
    const conflicts: MigrationConflict[] = [];
    let unchangedCount = 0;

    const navigation = ctx.app.vault.getAbstractFileByPath(NAV_FILE);

    if (navigation instanceof TFile) {
        const content = await ctx.app.vault.read(navigation);
        const result = planNavigationBaseUpgrade(content);
        const counted = collectResult(navigation, content, result, changes, conflicts);

        if (counted === 'unchanged') unchangedCount += 1;
    } else if (navigation) {
        conflicts.push({ path: NAV_FILE, reason: '导航路径存在，但不是 Markdown 文件' });
    } else {
        conflicts.push({ path: NAV_FILE, reason: '导航页不存在；请先执行“初始化笔记库”补齐' });
    }

    for (const file of ctx.app.vault.getMarkdownFiles()) {
        if (file.path === NAV_FILE) continue;
        if (!(await isMocCandidate(ctx, file))) continue;

        try {
            const content = await ctx.app.vault.read(file);
            const result = planMocBaseUpgrade(content);
            const counted = collectResult(file, content, result, changes, conflicts);

            if (counted === 'unchanged') unchangedCount += 1;
        } catch (error) {
            conflicts.push({ path: file.path, reason: `读取失败：${errorMessage(error)}` });
        }
    }

    return {
        changes: changes.sort(comparePath),
        conflicts: conflicts.sort(comparePath),
        unchangedCount,
    };
}

function collectResult(
    file: TFile,
    before: string,
    result: BaseContentUpgrade,
    changes: PlannedMigration[],
    conflicts: MigrationConflict[],
): 'change' | 'unchanged' | 'conflict' {
    if (result.status === 'unchanged') return 'unchanged';

    if (result.status === 'conflict') {
        conflicts.push({ path: file.path, reason: result.reason });

        return 'conflict';
    }

    changes.push({
        path: file.path,
        action: result.action,
        before,
        after: result.content,
        beforeBlock: result.beforeBlock,
        afterBlock: result.afterBlock,
    });

    return 'change';
}

/** 模板文件总是候选；普通 MOC 必须同时满足容器 type 与新/旧两代文件名约定 */
async function isMocCandidate(ctx: ZiminosContext, file: TFile): Promise<boolean> {
    if (file.path === TEMPLATE_FILES.moc) return true;

    const parentName = file.parent?.name;

    if (!parentName) return false;

    const type = ctx.app.metadataCache.getFileCache(file)?.frontmatter?.type;

    if (isContainerMocIdentity(file.basename, parentName, type)) return true;

    const nameMatches = file.basename === parentName || file.basename === `${MOC_PREFIX}${parentName}`;

    if (!nameMatches) return false;

    // 元数据缓存可能在插件刚加载时尚未完成；只对命名吻合的少数文件回读 YAML 兜底。
    const content = await ctx.app.vault.read(file);
    const frontmatter = content.match(/^---(?:\r\n|\r|\n)([\s\S]*?)(?:\r\n|\r|\n)---(?:\r\n|\r|\n|$)/)?.[1] ?? '';
    const rawType = frontmatter.match(/^type:\s*["']?([^"'\s#]+)["']?\s*(?:#.*)?$/m)?.[1] ?? '';

    return isContainerMocIdentity(file.basename, parentName, rawType);
}

/** 写入前核对预览版本；失败时连当前项在内逆序恢复，绝不覆盖预览后的用户编辑 */
async function applyMigrationsWithRollback(
    ctx: ZiminosContext,
    changes: readonly PlannedMigration[],
): Promise<void> {
    await applyMigrationBatch(
        changes,
        async (change) => {
            const currentFile = ctx.app.vault.getAbstractFileByPath(change.path);

            if (!(currentFile instanceof TFile)) {
                throw new Error(`${change.path} 在确认后被移动或删除`);
            }

            ctx.guard.mark(change.path);
            await ctx.app.vault.process(currentFile, (current) => {
                if (current !== change.before) {
                    throw new Error(`${change.path} 在预览后发生变化，已停止以免覆盖新内容`);
                }

                return change.after;
            });
        },
        async (change) => {
            const file = ctx.app.vault.getAbstractFileByPath(change.path);

            if (!(file instanceof TFile)) throw new Error('文件已被移动或删除');

            ctx.guard.mark(change.path);
            await ctx.app.vault.process(file, (current) => {
                if (current === change.before) return current;
                if (current !== change.after) throw new Error('回滚前文件又发生变化，拒绝覆盖');

                return change.before;
            });
        },
        (change) => change.path,
    );
}

class BaseMigrationPreviewModal extends Modal {
    private readonly preview: MigrationPreview;

    private resolver: ((confirmed: boolean) => void) | null = null;

    private settled = false;

    constructor(app: ZiminosContext['app'], preview: MigrationPreview) {
        super(app);
        this.preview = preview;
    }

    openAndConfirm(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        const { changes, conflicts, unchangedCount } = this.preview;

        this.titleEl.setText('预览存量数据库升级');
        this.contentEl.empty();

        const summary = this.contentEl.createEl('p', {
            text: `待升级 ${changes.length} 个 · 已是新版 ${unchangedCount} 个 · 冲突跳过 ${conflicts.length} 个`,
        });
        summary.style.margin = '0 0 12px';
        summary.style.fontWeight = '600';

        const note = this.contentEl.createEl('p', {
            text: '展开文件可查看 Base 的当前内容与升级后内容。确认后只修改“待升级”文件；冲突文件保持原样。',
        });
        note.style.margin = '0 0 14px';
        note.style.color = 'var(--text-muted)';
        note.style.lineHeight = '1.6';

        const list = this.contentEl.createDiv();
        list.style.maxHeight = '52vh';
        list.style.overflow = 'auto';
        list.style.border = '1px solid var(--background-modifier-border)';
        list.style.borderRadius = '8px';
        list.style.padding = '6px 10px';

        for (const [index, change] of changes.entries()) {
            const details = list.createEl('details');
            details.open = index === 0;

            const label = details.createEl('summary', {
                text: `${change.action} · ${change.path}`,
            });
            label.style.cursor = 'pointer';
            label.style.padding = '8px 2px';

            const diff = details.createEl('pre');
            diff.setText(renderBlockDiff(change.beforeBlock, change.afterBlock));
            diff.style.margin = '0 0 10px';
            diff.style.padding = '10px';
            diff.style.maxHeight = '320px';
            diff.style.overflow = 'auto';
            diff.style.whiteSpace = 'pre';
            diff.style.fontSize = '0.82em';
            diff.style.background = 'var(--background-primary-alt)';
        }

        if (conflicts.length) {
            const heading = list.createEl('h4', { text: '保持原样的冲突文件' });
            heading.style.margin = '12px 0 4px';

            const conflictList = list.createEl('ul');

            for (const conflict of conflicts) {
                conflictList.createEl('li', { text: `${conflict.path}：${conflict.reason}` });
            }
        }

        if (!changes.length && !conflicts.length) {
            list.createEl('p', { text: '没有发现需要升级的导航或 MOC。' });
        }

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '16px';

        new ButtonComponent(buttonBar)
            .setButtonText(changes.length ? '取消' : '关闭')
            .onClick(() => this.settle(false));

        if (changes.length) {
            new ButtonComponent(buttonBar)
                .setButtonText(`确认迁移 ${changes.length} 个文件`)
                .setCta()
                .onClick(() => this.settle(true));
        }
    }

    onClose(): void {
        this.settle(false);
        this.contentEl.empty();
    }

    private settle(confirmed: boolean): void {
        if (this.settled) return;

        this.settled = true;
        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(confirmed);
        this.close();
    }
}

class MigrationReportModal extends Modal {
    private readonly heading: string;

    private readonly lines: readonly string[];

    constructor(app: ZiminosContext['app'], heading: string, lines: readonly string[]) {
        super(app);
        this.heading = heading;
        this.lines = lines;
    }

    onOpen(): void {
        this.titleEl.setText(this.heading);
        this.contentEl.empty();

        for (const line of this.lines) {
            const paragraph = this.contentEl.createEl('p', { text: line });
            paragraph.style.lineHeight = '1.6';
        }

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';

        new ButtonComponent(buttonBar).setButtonText('关闭').setCta().onClick(() => this.close());
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

function renderBlockDiff(before: string | null, after: string): string {
    const beforeLines = before === null
        ? ['（当前没有 Base）']
        : before.replace(/\r\n|\r/g, '\n').split('\n');
    const afterLines = after.replace(/\r\n|\r/g, '\n').split('\n');

    return [
        '--- 当前',
        '+++ 升级后',
        ...beforeLines.map((line) => `- ${line}`),
        ...afterLines.map((line) => `+ ${line}`),
    ].join('\n');
}

function comparePath(left: { readonly path: string }, right: { readonly path: string }): number {
    return left.path.localeCompare(right.path, 'zh-CN');
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
