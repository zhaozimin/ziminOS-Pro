/**
 * [INPUT]: 依赖 obsidian 的 ButtonComponent/Modal/Notice/TFile/TFolder/Vault/normalizePath 与 App 类型，
 *          依赖 core/commands 的 TRANSITION_COMMANDS，
 *          依赖 core/constants 的 TRANSITIONS、STATUS_LABELS、FIELDS 与流转类型，依赖 core/time 的 today，
 *          依赖 core/folders 的 ensureFolderPath、normalizeFolderPath，
 *          依赖 core/types 的 ZiminosContext/DEFAULT_SETTINGS 与归档移交契约 ArchivedHook，
 *          依赖 core/frontmatter 的 Frontmatter 类型
 * [OUTPUT]: 对外提供 registerTransitionCommands（注册四条流转命令）与 runProjectTransition（执行单次流转），
 *           两者都收一个可选的 ArchivedHook——那是「项目刚刚完成归档」这件事的出口
 * [POS]: projects 模块的生命周期终局，与 createProject 构成项目的一生两端——
 *        createProject 在项目目录里造出 MOC，本文件按 TRANSITIONS 状态机把整个项目文件夹
 *        在「项目目录」与「归档目录」之间整体搬移，并在同一次写入里改写 MOC 的 status 与 archived。
 *        archived 是复盘「本月完成了哪些项目」唯一可信的时间事实：文件系统时间会被同步、
 *        rsync 与批量脚本改写，frontmatter 的 updated 又恰恰被自写抑制挡在门外（归档是插件的
 *        动作而非人的编辑），因此归档时刻若不在这里落笔，就再也无处可查。
 *        全部守卫（必须站在约定路径的同名 MOC 上、type 必须在 MOVABLE_TYPES 内（project 或 book，
 *        v0.12.0 起书与项目共用这台状态机）、当前 status 必须在
 *        allowedStatuses 内、目标位置不得已有同名项目）都前置在搬移之前；搬移之后任一步失败
 *        都整体回滚，绝不留下「文件夹已搬走但状态没改」的半截状态。这是全插件唯一会移动
 *        用户整个目录的写路径，因此它对确认框与回滚的谨慎程度必须高于其他模块，
 *        自写登记也必须覆盖整棵子树而非仅那一个被重命名的节点——搬移会连带重写项目内
 *        每张卡片的 up 双链，那是插件的动作，不该被 updatedMaintainer 记成用户的编辑。
 *        v0.16.0 起它多了一个出口而非多了一段流程：归档成功之后，若上游递进来了
 *        ArchivedHook，就把刚归档的容器身份交出去。本文件不知道接住它的是谁、
 *        更不知道《赛博永生》是什么——第二版把它接到出库单上，第一版根本不递这个参数，
 *        于是免费库里这条 if 恒为假，归档流程与第二版出现之前逐字节相同
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, Modal, Notice, TFile, TFolder, Vault, normalizePath } from 'obsidian';
import type { App } from 'obsidian';

import { TRANSITION_COMMANDS } from '../../core/commands';
import { CONTAINER_TYPES, FIELDS, STATUS_LABELS, TRANSITIONS } from '../../core/constants';
import type { FolderRole, ProjectTransition, TransitionAction } from '../../core/constants';
import { ensureFolderPath, normalizeFolderPath } from '../../core/folders';
import type { Frontmatter } from '../../core/frontmatter';
import { today } from '../../core/time';
import { DEFAULT_SETTINGS } from '../../core/types';
import type { ArchivedHook, ZiminosContext } from '../../core/types';
import { resolveMocPath } from './moc';

// ============================================================
// 模块常量
// ============================================================

/**
 * 允许流转的容器类型，取自 core/constants 的 CONTAINER_TYPES。
 * v0.12.0 起书与项目共用这台状态机——一本书就是一个项目，读完即归档（规格书-V2 §19 授权）；
 * 两者的目录结构与 MOC 命名完全同构，搬移、回滚与 base 路径修正因此一行都不用改。
 * 其余守卫（同名 MOC、allowedStatuses、防覆盖）对两类一视同仁。
 */
const MOVABLE_TYPES = CONTAINER_TYPES;

/** 确认框容器的样式钩子类名，自原脚本原样保留（V1 无 styles.css，仅作标识） */
const CONFIRM_MODAL_CLASS = 'qa-project-transition-confirm';

/**
 * 唯一会触发归档移交的终态。
 * 写成常量而不是就地比一个字符串，是为了让「为什么只有完成会出库」这件事有一个可搜的落点——
 * 将来若要放宽到「放弃也算素材」，改的是这一行，而不是去正文里找那个字符串。
 */
const ARCHIVE_HANDOVER_STATUS = TRANSITIONS.done.status;

// ============================================================
// 流转计划：守卫全部通过后才生成，是执行阶段唯一的输入
// ============================================================

/** 一次已经通过全部前置校验的流转，携带执行与回滚所需的全部路径 */
interface TransitionPlan {
    /** 本次要执行的流转规则 */
    readonly transition: ProjectTransition;
    /** 当前项目的文件夹对象，搬移的直接对象 */
    readonly projectFolder: TFolder;
    /** 项目名（即文件夹名，也是 MOC 文件名） */
    readonly projectName: string;
    /** 流转前 MOC 中的 status，回滚时要写回去 */
    readonly currentStatus: string;
    /** 搬移前的项目文件夹路径 */
    readonly sourceProjectPath: string;
    /** 目标根目录（项目目录或归档目录），搬移前需确保存在 */
    readonly targetRoot: string;
    /** 搬移后的项目文件夹路径 */
    readonly targetProjectPath: string;
    /** 搬移后的 MOC 路径 */
    readonly targetMocPath: string;
    /** 搬移前的 MOC 路径，回滚后据此复核 */
    readonly expectedMocPath: string;
    /** 容器类型（project 或 book），归档移交时要交给下游区分是项目还是一本书 */
    readonly containerType: string;
    /** MOC 的 UID，归档移交时的跨库身份；YAML 里没有时为空串 */
    readonly uid: string;
}

/** 执行过程中已经走到哪一步，决定回滚要撤销哪几件事 */
interface TransitionProgress {
    /** 文件夹是否已经搬走 */
    moved: boolean;
    /** MOC 的 status 是否已经改写 */
    statusChanged: boolean;
    /** MOC 里的 Base 筛选路径是否已经改写 */
    basePathChanged: boolean;
    /**
     * 改写前的 archived 原值，回滚时原样放回。
     * 记原值而不是「回滚就删掉」：重新开始一个已归档项目时，
     * 若流转中途失败却把归档日抹了，那篇项目会变成一个没有完成时间的完成项目。
     */
    previousArchived: unknown;
}

// ============================================================
// 命令注册
// ============================================================

/**
 * 注册四条项目流转命令。
 * 一律用 callback 而非 checkCallback：命令必须在任何情况下都可见可点，
 * 用户在错误的笔记上执行时要得到「为什么不行」的中文提示，而不是命令凭空消失。
 */
export function registerTransitionCommands(ctx: ZiminosContext, onArchived?: ArchivedHook): void {
    for (const command of TRANSITION_COMMANDS) {
        // 回调不能是 async：流转内部已吃掉全部异常并转成 Notice，此处无需等待
        ctx.commands.register(command, () => {
            void runProjectTransition(ctx, command.action, onArchived);
        });
    }
}

// ============================================================
// 流转主流程
// ============================================================

/**
 * 执行一次项目状态流转：校验 → 确认 → 搬移改状态 → 重新打开 → 汇报。
 * 全程异常收敛在这里，任何失败都以中文 Notice 呈现，不向调用方抛出。
 */
export async function runProjectTransition(
    ctx: ZiminosContext,
    action: TransitionAction,
    onArchived?: ArchivedHook,
): Promise<void> {
    try {
        // 动作由命令表固化，理论上必然命中；保留原脚本守卫作为最后一道防线
        const transition: ProjectTransition | undefined = TRANSITIONS[action];

        if (!transition) {
            new Notice(`未知的项目流转动作：${action}`);
            return;
        }

        const plan = resolveTransitionPlan(ctx, transition);

        // 守卫未通过：resolveTransitionPlan 已经给出对应的 Notice
        if (!plan) return;

        const confirmed = await showProjectTransitionConfirm(ctx.app, plan);

        if (!confirmed) return;

        const basePathChanged = await applyTransition(ctx, plan);

        await reopenMovedMoc(ctx, plan.targetMocPath);

        if (!basePathChanged) {
            new Notice(
                '项目流转成功，但 MOC（项目导航笔记）中没有找到需要更新的 file.folder（文件夹）筛选条件。',
            );
        }

        new Notice(
            `项目已${transition.label}：${plan.projectName} → ${formatStatusForDisplay(transition.status)}`,
        );

        // 归档移交：只有「完成」才交出去。
        // 暂停与放弃同样搬进归档目录，但它们不是结论——一个还没想好、一个明确不要了，
        // 把它们当成知识素材送进《赛博永生》，等于让那本库里长出一堆讲「我当时没做完」的页。
        // 重新开始更不该交：它是反向流转，项目正回到台面上。
        // 这一步刻意排在成功 Notice 之后：出库单写不写得成，都不该影响
        // 「项目已经归档」这个已经落地的事实，也不该让用户看到两条互相矛盾的提示
        if (onArchived && transition.status === ARCHIVE_HANDOVER_STATUS) {
            onArchived({
                name: plan.projectName,
                kind: plan.containerType,
                mocPath: plan.targetMocPath,
                folderPath: plan.targetProjectPath,
                uid: plan.uid,
            });
        }
    } catch (error) {
        new Notice(`项目状态流转失败：${getErrorMessage(error)}`);
    }
}

/**
 * 执行全部前置守卫并生成流转计划。
 * 任何一条守卫不通过都直接 Notice 并返回 null——所有拒绝都发生在动土之前，
 * 这样「校验」与「写入」彻底分家：只要走到 applyTransition，就意味着条件已经全部成立。
 */
function resolveTransitionPlan(
    ctx: ZiminosContext,
    transition: ProjectTransition,
): TransitionPlan | null {
    const { app, settings } = ctx;

    const activeFolder = normalizeFolderPath(settings.projectFolder, DEFAULT_SETTINGS.projectFolder);
    const archiveFolder = normalizeFolderPath(settings.archiveFolder, DEFAULT_SETTINGS.archiveFolder);

    if (activeFolder === archiveFolder) {
        new Notice('项目目录和归档目录不能设置为同一路径。');
        return null;
    }

    const sourceRoot = transition.source === 'active' ? activeFolder : archiveFolder;
    const targetRoot = transition.target === 'active' ? activeFolder : archiveFolder;
    const mocFile = app.workspace.getActiveFile();

    if (!(mocFile instanceof TFile) || mocFile.extension !== 'md') {
        new Notice('请先打开需要进行状态流转的项目 MOC。');
        return null;
    }

    const projectFolder = mocFile.parent;

    if (!(projectFolder instanceof TFolder)) {
        new Notice('无法识别当前项目文件夹。');
        return null;
    }

    const projectName = projectFolder.name;
    const sourceProjectPath = normalizePath(`${sourceRoot}/${projectName}`);
    // 两种命名都认：V3 起是 MOC-文件夹名，V3 之前与文件夹同名。
    // 老库里的项目不会被改名，而「完成项目」在它们身上必须照样能按
    const expectedMocPath = resolveMocPath(app, sourceProjectPath, projectName);

    // 只允许从约定目录中的同名项目 MOC 执行，防止误移动卡片或其他文件夹。
    if (normalizePath(mocFile.path) !== expectedMocPath) {
        new Notice(`当前命令只能在以下项目 MOC 中执行：${expectedMocPath}`);
        return null;
    }

    const frontmatter = app.metadataCache.getFileCache(mocFile)?.frontmatter;
    const type = normalizeText(frontmatter?.type);
    const currentStatus = normalizeText(frontmatter?.status);

    if (!MOVABLE_TYPES.includes(type)) {
        new Notice('当前笔记不是项目或读书笔记 MOC：缺少 type: project（项目）或 type: book（书）。');
        return null;
    }

    if (!transition.allowedStatuses.includes(currentStatus)) {
        new Notice(
            `项目当前状态为“${formatStatusForDisplay(currentStatus)}”，不能执行“${transition.label}”操作。`,
        );
        return null;
    }

    const targetProjectPath = normalizePath(`${targetRoot}/${projectName}`);
    // 搬的是整个文件夹，MOC 的文件名一个字都不会变——所以这里沿用它此刻的名字，
    // 而不是照当前约定重新拼一个：那样会让老库的项目在搬完之后「找不到自己的 MOC」而整体回滚
    const targetMocPath = normalizePath(`${targetProjectPath}/${mocFile.name}`);
    const existingTarget = app.vault.getAbstractFileByPath(targetProjectPath);

    // 绝不覆盖或合并同名项目。
    if (existingTarget) {
        new Notice(`目标位置已经存在同名项目，操作已停止：${targetProjectPath}`);
        return null;
    }

    return {
        transition,
        projectFolder,
        projectName,
        currentStatus,
        sourceProjectPath,
        targetRoot,
        targetProjectPath,
        targetMocPath,
        expectedMocPath,
        containerType: type,
        uid: normalizeText(frontmatter?.[FIELDS.uid]),
    };
}

/**
 * 落地一次流转：搬目录 → 改状态 → 修 Base 路径，返回 Base 路径是否真的被改过。
 * 三步共用一个 progress 记录，任一步抛错就按记录逐项回滚；
 * 回滚也失败时把两个原因合并成一条消息抛出，让用户知道库处于何种状态。
 */
async function applyTransition(ctx: ZiminosContext, plan: TransitionPlan): Promise<boolean> {
    const { app, guard } = ctx;

    await ensureFolderPath(app, plan.targetRoot);

    const progress: TransitionProgress = {
        moved: false,
        statusChanged: false,
        basePathChanged: false,
        previousArchived: undefined,
    };

    try {
        // 使用 FileManager 移动整个 TFolder，让 Obsidian 按设置维护内部链接。
        // 登记必须覆盖整棵子树：Obsidian 维护链接时会逐个改写卡片，那些也是本次搬移的一部分。
        markFolderTree(ctx, plan.projectFolder, plan.targetProjectPath);
        await app.fileManager.renameFile(plan.projectFolder, plan.targetProjectPath);
        progress.moved = true;

        const movedMoc = app.vault.getAbstractFileByPath(plan.targetMocPath);

        if (!(movedMoc instanceof TFile)) {
            throw new Error(`移动后没有找到项目 MOC：${plan.targetMocPath}`);
        }

        // 通过 Obsidian Frontmatter API 修改唯一 YAML，不直接拼接文本。
        guard.mark(movedMoc.path);
        await app.fileManager.processFrontMatter(movedMoc, (movedFrontmatter: Frontmatter) => {
            if (!MOVABLE_TYPES.includes(normalizeText(movedFrontmatter.type))) {
                throw new Error('移动后的 MOC 缺少 type: project（项目）或 type: book（书）。');
            }

            movedFrontmatter.status = plan.transition.status;

            // 归档日必须与 status 在同一次写入里落笔。
            // 「哪个项目在本月完成」这件事没有别的可信来源：文件系统时间会被同步与脚本改写，
            // frontmatter 的 updated 又恰恰被自写抑制挡住（归档是插件的动作，不是人的编辑），
            // 于是不写它的话，一次归档在数据上根本没有发生过。
            progress.previousArchived = movedFrontmatter[FIELDS.archived];

            if (plan.transition.target === 'archive') {
                movedFrontmatter[FIELDS.archived] = today();
            } else {
                // 重新开始意味着这个项目又回到进行中，旧的归档日不再成立，留着会让年度全景重复计数
                delete movedFrontmatter[FIELDS.archived];
            }
        });
        progress.statusChanged = true;

        // 同步修正 MOC Base 中硬编码的 file.folder 查询路径。
        progress.basePathChanged = await updateMocBaseFolderPath(
            ctx,
            movedMoc,
            plan.sourceProjectPath,
            plan.targetProjectPath,
        );
    } catch (operationError) {
        const rollbackError = await rollbackTransition(ctx, plan, progress);

        if (rollbackError) {
            throw new Error(
                `${getErrorMessage(operationError)}；自动回滚也失败：${getErrorMessage(rollbackError)}`,
            );
        }

        throw operationError;
    }

    return progress.basePathChanged;
}

/**
 * 把一次整目录搬移的真实影响面登记为自写。
 *
 * SelfWriteGuard 按精确路径查表，而 renameFile 搬走的是一整棵树：库设置里
 * alwaysUpdateLinks 为真，卡片的 up 字段又是 `[[01-projects/写作/写作|写作]]` 这样的全路径双链，
 * 于是 MOC 一旦换了位置，Obsidian 必须逐个改写项目内每张卡片里的这条链接，每改一个就是一次
 * modify 事件。只登记文件夹自己，这些事件会被 updatedMaintainer 当成用户的编辑——一条归档命令
 * 就把整个项目所有卡片的 updated 刷成归档时刻，而用户一个字都没动。抑制范围必须与写入的
 * 真实影响面对齐，这正是 SelfWriteGuard「把机器的动作与人的动作区分开」的本分。
 *
 * 新旧两个路径都登记：事件带的是搬移前还是搬移后的路径取决于 Obsidian 的内部次序，
 * 两个都登记的代价只是几十个 Map 条目，三秒后自动过期。
 */
function markFolderTree(ctx: ZiminosContext, folder: TFolder, targetPath: string): void {
    const { guard } = ctx;
    const sourcePath = folder.path;

    guard.mark(sourcePath);
    guard.mark(targetPath);

    Vault.recurseChildren(folder, (child) => {
        // 目录本身不会触发 modify，只有文件需要登记
        if (!(child instanceof TFile)) return;

        // 从子文件当前路径切出相对路径，再拼到目标根上，得到它搬移后的落点
        const relativePath = child.path.slice(sourcePath.length + 1);

        guard.mark(child.path);
        guard.mark(normalizePath(`${targetPath}/${relativePath}`));
    });
}

/**
 * 搬移完成后把 MOC 重新打开在当前面板。
 * 打开失败不抛错：文件操作已经成功，视图问题不值得回滚用户的笔记。
 */
async function reopenMovedMoc(ctx: ZiminosContext, targetMocPath: string): Promise<void> {
    const movedMoc = ctx.app.vault.getAbstractFileByPath(targetMocPath);

    if (!(movedMoc instanceof TFile)) return;

    try {
        await ctx.app.workspace.getLeaf(false).openFile(movedMoc, { active: true });
    } catch {
        // 项目流转已经成功；重新打开视图失败不应回滚文件操作。
    }
}

/**
 * 更新由项目 MOC 模板生成的 Base 文件夹筛选条件。
 * 只替换完全匹配的旧项目路径，避免误改正文中的其他文本。
 */
async function updateMocBaseFolderPath(
    ctx: ZiminosContext,
    mocFile: TFile,
    oldProjectPath: string,
    newProjectPath: string,
): Promise<boolean> {
    const oldFilter = `file.folder == ${JSON.stringify(oldProjectPath)}`;
    const newFilter = `file.folder == ${JSON.stringify(newProjectPath)}`;
    let changed = false;

    ctx.guard.mark(mocFile.path);
    await ctx.app.vault.process(mocFile, (content) => {
        if (!content.includes(oldFilter)) return content;

        changed = true;
        return content.split(oldFilter).join(newFilter);
    });

    return changed;
}

/**
 * 关键步骤失败时尽力恢复原目录、原状态与原 Base 路径。
 * 成功返回 null，失败返回捕获到的异常——由调用方决定如何呈现，
 * 回滚过程本身绝不再抛出，否则原始失败原因会被掩盖。
 */
async function rollbackTransition(
    ctx: ZiminosContext,
    plan: TransitionPlan,
    progress: TransitionProgress,
): Promise<unknown> {
    if (!progress.moved) return null;

    const { app, guard } = ctx;

    try {
        const currentFolder =
            app.vault.getAbstractFileByPath(plan.targetProjectPath) ?? plan.projectFolder;

        if (!(currentFolder instanceof TFolder)) {
            throw new Error(`回滚时没有找到项目目录：${plan.targetProjectPath}`);
        }

        if (app.vault.getAbstractFileByPath(plan.sourceProjectPath)) {
            throw new Error(`原位置已经被占用：${plan.sourceProjectPath}`);
        }

        // 反向搬移同样会牵动整棵子树的链接改写，登记范围与正向一致
        markFolderTree(ctx, currentFolder, plan.sourceProjectPath);
        await app.fileManager.renameFile(currentFolder, plan.sourceProjectPath);

        const restoredMoc = app.vault.getAbstractFileByPath(plan.expectedMocPath);

        if (!(restoredMoc instanceof TFile)) {
            throw new Error(`回滚后没有找到项目 MOC：${plan.expectedMocPath}`);
        }

        if (progress.statusChanged) {
            guard.mark(restoredMoc.path);
            await app.fileManager.processFrontMatter(restoredMoc, (frontmatter: Frontmatter) => {
                frontmatter.status = plan.currentStatus;

                // 状态与归档日是一次写入落的两个字段，回滚也必须一起还原
                if (progress.previousArchived === undefined) delete frontmatter[FIELDS.archived];
                else frontmatter[FIELDS.archived] = progress.previousArchived;
            });
        }

        if (progress.basePathChanged) {
            await updateMocBaseFolderPath(
                ctx,
                restoredMoc,
                plan.targetProjectPath,
                plan.sourceProjectPath,
            );
        }

        return null;
    } catch (error) {
        return error;
    }
}

// ============================================================
// 确认弹窗
// ============================================================

/**
 * 显示项目状态流转确认框。
 * 使用中文按钮与分区信息，避免 QuickAdd 原生 No / Yes 按钮。
 */
async function showProjectTransitionConfirm(app: App, plan: TransitionPlan): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        new ProjectTransitionConfirmModal(app, plan, resolve).open();
    });
}

/**
 * 流转确认弹窗：把「改哪个项目、状态怎么变、文件夹从哪搬到哪」四件事一次说清。
 * 用户在这里点确认，才是整个流程唯一的授权点——之后的写入不再询问。
 */
class ProjectTransitionConfirmModal extends Modal {
    private readonly plan: TransitionPlan;

    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    private resolver: ((value: boolean) => void) | null;

    /** 按钮结算与关闭结算都会走到 settle，用它保证只生效一次 */
    private settled = false;

    constructor(app: App, plan: TransitionPlan, resolver: (value: boolean) => void) {
        super(app);
        this.plan = plan;
        this.resolver = resolver;
    }

    onOpen(): void {
        const { transition } = this.plan;

        this.containerEl.addClass(CONFIRM_MODAL_CLASS);
        this.modalEl.style.width = '520px';
        this.modalEl.style.maxWidth = 'calc(100vw - 32px)';

        this.titleEl.setText(`确认${transition.label}项目`);
        this.contentEl.empty();

        const description = this.contentEl.createEl('p', {
            text: '项目文件夹将整体移动，并同步更新 MOC（项目导航笔记）状态。',
        });
        description.style.margin = '0 0 14px';
        description.style.color = 'var(--text-muted)';
        description.style.lineHeight = '1.6';

        const summary = this.contentEl.createDiv();
        summary.style.padding = '12px 14px';
        summary.style.borderRadius = '10px';
        summary.style.background = 'var(--background-secondary)';
        summary.style.border = '1px solid var(--background-modifier-border)';

        createModalInfoRow(summary, '项目', this.plan.projectName, true);
        createModalInfoRow(
            summary,
            '状态',
            `${formatStatusForDisplay(this.plan.currentStatus)}  →  ${formatStatusForDisplay(transition.status)}`,
        );

        const pathSection = summary.createDiv();
        pathSection.style.marginTop = '8px';
        pathSection.style.paddingTop = '8px';
        pathSection.style.borderTop = '1px solid var(--background-modifier-border)';

        createModalInfoRow(
            pathSection,
            '从',
            `${this.plan.sourceProjectPath}（${getFolderTypeLabel(transition.source)}）`,
        );
        createModalInfoRow(
            pathSection,
            '到',
            `${this.plan.targetProjectPath}（${getFolderTypeLabel(transition.target)}）`,
        );

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '18px';

        new ButtonComponent(buttonBar).setButtonText('取消').onClick(() => this.settle(false));

        const confirmButton = new ButtonComponent(buttonBar)
            .setButtonText(`确认${transition.label}`)
            .setCta()
            .onClick(() => this.settle(true));

        confirmButton.buttonEl.focus();
    }

    onClose(): void {
        // Esc、遮罩点击、取消按钮最终都汇到这里；未经确认即视为放弃本次流转
        this.settle(false);
        this.contentEl.empty();
    }

    /** 唯一结算点，保证 Promise 只被兑现一次 */
    private settle(value: boolean): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);

        this.close();
    }
}

/**
 * 创建确认框中的一行标签和值。
 */
function createModalInfoRow(
    parent: HTMLElement,
    label: string,
    value: string,
    emphasize = false,
): void {
    const row = parent.createDiv();
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '4em minmax(0, 1fr)';
    row.style.gap = '10px';
    row.style.alignItems = 'start';
    row.style.padding = '5px 0';

    const labelElement = row.createDiv({ text: label });
    labelElement.style.color = 'var(--text-muted)';

    const valueElement = row.createDiv({ text: value });
    valueElement.style.minWidth = '0';
    valueElement.style.overflowWrap = 'anywhere';
    valueElement.style.lineHeight = '1.5';

    if (emphasize) {
        valueElement.style.fontWeight = '600';
        valueElement.style.color = 'var(--text-normal)';
    }
}

// ============================================================
// 文本工具
// ============================================================

/**
 * 用「简体中文（英文原值）」显示项目状态。
 */
function formatStatusForDisplay(status: string): string {
    const normalizedStatus = normalizeText(status);

    if (!normalizedStatus) return '未设置（空）';

    return `${STATUS_LABELS[normalizedStatus] || '未知状态'}（${normalizedStatus}）`;
}

/**
 * 把 active/archive 目录角色转换为中文。
 */
function getFolderTypeLabel(folderType: FolderRole): string {
    return folderType === 'active' ? '项目目录' : '归档目录';
}

/**
 * 把来源不明的 YAML 值收敛成可比较的小写文本，等价于原脚本的
 * String(value ?? '').trim().toLowerCase()：缺字段、null、大小写混写都归一到同一形态。
 */
function normalizeText(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}

/**
 * 把任意异常转换为可读消息。
 */
function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
