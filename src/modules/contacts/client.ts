/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile；依赖 core/commands 的 CLIENT_COMMANDS，
 *          core/constants 的 CLIENT_FOLDER/CLIENT_MOC/LEGACY_CLIENT_MOC/CLIENT_PAYMENT_HEADING/PROJECT_PAYMENT_HEADING
 *          与 FIELDS/NOTE_TYPES/PAYMENT_FIELDS/TEMPLATE_FILES，
 *          core/folders 的 ensureFolderPath/normalizeFolderPath，
 *          core/markdown 的 insertIntoSection，core/modals 的 TextInputModal/ChoiceModal，
 *          core/time 的 nowStampAndUid/today，core/types 的 ZiminosContext 与 VaultSeed；
 *          依赖 ./identity 的 liveNotesOfType/descriptionOf、./moc 的新旧 MOC 寻址、
 *          ./templates 的生成器与旧档案答疑视图补齐器
 * [OUTPUT]: 对外提供 SeedApplier 契约、clientSeed（客户模块的产物）与 registerClientCommands（五条命令）
 * [POS]: 客户与付费这条线。clientSeed 随默认开荒落下客户目录、模板与一张四列 MOC；
 *        「初始化客户模块」命令继续调用同一份 seed，专门给旧库补齐或给误删后的库修复，
 *        从而让首次生成与恢复只有一个事实源，而不是两套各自漂移的流程；旧名已经存在时
 *        补齐与打开都继续使用旧名，插件更新不会并排制造第二张客户 MOC。
 *        一笔付费的本质是「我欠他一次交付」，那本来就是个待办，所以写入的是未勾选的任务行：
 *        交付完点一下勾即可，不用改文字、不用维护状态词，checkbox 直接充当交付状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import { CLIENT_COMMANDS } from '../../core/commands';
import {
    CLIENT_FOLDER,
    CLIENT_MOC,
    CLIENT_PAYMENT_HEADING,
    FIELDS,
    LEGACY_CLIENT_MOC,
    NOTE_TYPES,
    PAYMENT_FIELDS,
    PROJECT_PAYMENT_HEADING,
    TEMPLATE_FILES,
} from '../../core/constants';
import { ensureFolderPath, isSystemPath, normalizeFolderPath } from '../../core/folders';
import { insertIntoSection } from '../../core/markdown';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import { nowStampAndUid, today } from '../../core/time';
import type { VaultSeed, ZiminosContext } from '../../core/types';
import { extractLinks } from '../../core/vaultIndex';
import { descriptionOf, liveNotesOfType } from './identity';
import { resolveBuiltInMocPath } from './moc';
import {
    clientMocContent,
    clientNoteContent,
    clientTemplateFile,
    ensureClientAnswerView,
} from './templates';

/**
 * 「把一份开荒贡献落到库里」这项能力。
 * 由 main 在装配时注入，因此本文件不 import 开荒模块，模块之间仍然互不认识。
 */
export type SeedApplier = (seed: VaultSeed) => Promise<void>;

/** Obsidian 文件名禁用的字符，外加会破坏双链解析的方括号与井号 */
const ILLEGAL_NAME = /[\\/:*?"<>|#^[\]]/;

const MESSAGES = {
    setupDone: '客户模块已补齐 ✅',
    answersDone: '客户答疑检索已补齐',
    namePrompt: '怎么称呼他？（档案就用它命名）',
    namePlaceholder: '例如：王五',
    illegalName: '称呼里不能有 \\ / : * ? " < > | # ^ [ ] 这些字符。',
    sourcePrompt: '他从哪个渠道来？',
    contactPrompt: '联系方式（微信号、手机号、平台账号都行）',
    productPrompt: '他买的是什么？',
    amountPrompt: '多少钱？（只填数字）',
    amountInvalid: '金额要是个数字，这笔没记。',
    clientPrompt: '这笔付费是谁的？',
    projectPrompt: '这笔收款算哪个项目的？',
    noClients: '还没有客户档案。先运行「新建客户」建一个。',
    noProjects: `还没有客户项目。在项目 MOC 的属性里写 \`${FIELDS.client}: "[[某人]]"\` 就算一个。`,
    cancelled: '已取消。',
    existsPrefix: '已经有这份档案了，直接打开：',
    createdPrefix: '客户档案已建好：',
    paidPrefix: '已记一笔付费：',
    receiptPrefix: '已记一笔收款：',
    failedPrefix: '操作失败：',
} as const;

// ============================================================
// 开荒贡献
// ============================================================

/** 客户模块的产物：一个目录、一份模板、一张 MOC */
export function clientSeed(ctx: ZiminosContext): VaultSeed {
    const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
    const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
    const mocPath = resolveBuiltInMocPath(ctx.app, folder, CLIENT_MOC, LEGACY_CLIENT_MOC);

    return {
        folders: [folder],
        notes: [
            { path: TEMPLATE_FILES.client, content: clientTemplateFile() },
            { path: mocPath, content: clientMocContent(stamp, uid) },
        ],
    };
}

// ============================================================
// 命令
// ============================================================

/** 注册客户模块的五条命令 */
export function registerClientCommands(ctx: ZiminosContext, applySeed: SeedApplier): void {
    ctx.commands.register(CLIENT_COMMANDS.setup, () => {
        void setupClients(ctx, applySeed);
    });

    ctx.commands.register(CLIENT_COMMANDS.answers, () => {
        void backfillClientAnswerViews(ctx);
    });

    ctx.commands.register(CLIENT_COMMANDS.create, () => {
        void createClient(ctx);
    });

    ctx.commands.register(CLIENT_COMMANDS.payment, () => {
        void addPayment(ctx);
    });

    ctx.commands.register(CLIENT_COMMANDS.receipt, () => {
        void recordReceipt(ctx);
    });
}

/**
 * 旧档案不会因插件升级被静默改写；用户明确运行一次命令，才给所有客户补上只读答疑视图。
 * 新模板天然已经有这块，所以重复运行只会报告 0，不制造第二份标题或代码块。
 */
async function backfillClientAnswerViews(ctx: ZiminosContext): Promise<void> {
    try {
        let updated = 0;

        for (const file of ctx.app.vault.getMarkdownFiles()) {
            if (isSystemPath(file.path)) continue;

            const frontmatter = ctx.app.metadataCache.getFileCache(file)?.frontmatter;

            if (String(frontmatter?.[FIELDS.type] ?? '').trim() !== NOTE_TYPES.client) continue;

            const before = await ctx.app.vault.cachedRead(file);
            const after = ensureClientAnswerView(before);

            if (after === before) continue;

            ctx.guard.mark(file.path);
            await ctx.app.vault.process(file, (current) => ensureClientAnswerView(current));
            updated += 1;
        }

        new Notice(`${MESSAGES.answersDone}：${updated} 份档案。`);
    } catch (error) {
        notifyFailure(error);
    }
}

/** 为旧库补齐或修复客户模块，并把学员送到那张 MOC 上 */
async function setupClients(ctx: ZiminosContext, applySeed: SeedApplier): Promise<void> {
    try {
        const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
        const mocPath = resolveBuiltInMocPath(ctx.app, folder, CLIENT_MOC, LEGACY_CLIENT_MOC);

        await applySeed(clientSeed(ctx));

        new Notice(MESSAGES.setupDone);
        await ctx.app.workspace.openLinkText(mocPath, '', false);
    } catch (error) {
        notifyFailure(error);
    }
}

/** 三连问建一份客户档案 */
async function createClient(ctx: ZiminosContext): Promise<void> {
    try {
        const answer = await new TextInputModal(ctx.app, {
            title: MESSAGES.namePrompt,
            placeholder: MESSAGES.namePlaceholder,
        }).openAndGetValue();

        const name = (answer ?? '').trim();

        if (!name) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        if (ILLEGAL_NAME.test(name)) {
            new Notice(MESSAGES.illegalName);

            return;
        }

        // 渠道走选择而非手打：「B站/b站/哔哩哔哩」三种写法会把渠道效益统计打散成三份
        const source = await new ChoiceModal(ctx.app, {
            title: MESSAGES.sourcePrompt,
            items: optionsOf(ctx.settings.clientSources),
            labelOf: (item) => item,
        }).openAndGetChoice();

        if (!source) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const contact = await new TextInputModal(ctx.app, {
            title: MESSAGES.contactPrompt,
        }).openAndGetValue();

        if (contact === null) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
        const path = `${folder}/${name}.md`;
        const existing = ctx.app.vault.getAbstractFileByPath(path);

        if (existing instanceof TFile) {
            new Notice(MESSAGES.existsPrefix + name);
            await ctx.app.workspace.getLeaf(false).openFile(existing);

            return;
        }

        const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
        const content = clientNoteContent({
            created: stamp,
            uid,
            type: NOTE_TYPES.client,
            source,
            contact: contact.trim(),
        });

        await ensureFolderPath(ctx.app, folder);
        ctx.guard.mark(path);

        const file = await ctx.app.vault.create(path, content);

        new Notice(MESSAGES.createdPrefix + name);
        await ctx.app.workspace.getLeaf(false).openFile(file);
    } catch (error) {
        notifyFailure(error);
    }
}

/** 选客户 → 选产品 → 填金额 → 一条未勾选的任务行进他的档案 */
async function addPayment(ctx: ZiminosContext): Promise<void> {
    try {
        const clients = liveNotesOfType(ctx, NOTE_TYPES.client);

        if (!clients.length) {
            new Notice(MESSAGES.noClients);

            return;
        }

        const client = await new ChoiceModal(ctx.app, {
            title: MESSAGES.clientPrompt,
            items: clients,
            labelOf: (file) => {
                const hint = descriptionOf(ctx, file);

                return hint ? `${file.basename}　—　${hint}` : file.basename;
            },
        }).openAndGetChoice();

        if (!client) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const product = await new ChoiceModal(ctx.app, {
            title: MESSAGES.productPrompt,
            items: optionsOf(ctx.settings.clientProducts),
            labelOf: (item) => item,
        }).openAndGetChoice();

        if (!product) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const amount = await askAmount(ctx);

        if (amount === null) return;

        const line =
            `- [ ] [${PAYMENT_FIELDS.product}::${product}] ` +
            `[${PAYMENT_FIELDS.amount}::${amount}] [${PAYMENT_FIELDS.date}::${today()}]`;

        ctx.guard.mark(client.path);
        await ctx.app.vault.process(client, (content) =>
            insertIntoSection(content, CLIENT_PAYMENT_HEADING, line),
        );

        new Notice(`${MESSAGES.paidPrefix}${client.basename} · ${product} · ${amount}`);
    } catch (error) {
        notifyFailure(error);
    }
}

/** 选客户项目 → 填金额 → 一条未勾选的任务行进项目 MOC */
async function recordReceipt(ctx: ZiminosContext): Promise<void> {
    try {
        const projects = clientProjects(ctx);

        if (!projects.length) {
            new Notice(MESSAGES.noProjects);

            return;
        }

        const project = await new ChoiceModal(ctx.app, {
            title: MESSAGES.projectPrompt,
            items: projects,
            labelOf: (file) => file.basename,
        }).openAndGetChoice();

        if (!project) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const amount = await askAmount(ctx);

        if (amount === null) return;

        const line = `- [ ] [${PAYMENT_FIELDS.amount}::${amount}] [${PAYMENT_FIELDS.date}::${today()}]`;

        ctx.guard.mark(project.path);
        await ctx.app.vault.process(project, (content) =>
            insertIntoSection(content, PROJECT_PAYMENT_HEADING, line),
        );

        new Notice(`${MESSAGES.receiptPrefix}${project.basename} · ${amount}`);
    } catch (error) {
        notifyFailure(error);
    }
}

// ============================================================
// 共用
// ============================================================

/** 名下带 client 键的项目 MOC——写下那个键就等于宣告「我欠这个人一个交付」 */
function clientProjects(ctx: ZiminosContext): TFile[] {
    const found: TFile[] = [];

    for (const file of ctx.app.vault.getMarkdownFiles()) {
        if (isSystemPath(file.path)) continue;

        const frontmatter = ctx.app.metadataCache.getFileCache(file)?.frontmatter;

        if (String(frontmatter?.[FIELDS.type] ?? '').trim() !== NOTE_TYPES.project) continue;
        if (!extractLinks(String(frontmatter?.[FIELDS.client] ?? '')).length) continue;

        found.push(file);
    }

    return found.sort((left, right) => left.basename.localeCompare(right.basename, 'zh'));
}

/** 问一次金额，非数字一律拒绝——一笔记错的钱不会自己暴露出来 */
async function askAmount(ctx: ZiminosContext): Promise<number | null> {
    const answer = await new TextInputModal(ctx.app, {
        title: MESSAGES.amountPrompt,
        placeholder: '例如：365',
    }).openAndGetValue();

    if (answer === null) {
        new Notice(MESSAGES.cancelled);

        return null;
    }

    const amount = Number(answer.trim());

    if (!Number.isFinite(amount) || amount <= 0) {
        new Notice(MESSAGES.amountInvalid);

        return null;
    }

    return amount;
}

/** 把设置里的逗号分隔文本拆成候选项，中英文逗号都认 */
function optionsOf(raw: string): string[] {
    return raw
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function notifyFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    new Notice(MESSAGES.failedPrefix + message);
}
