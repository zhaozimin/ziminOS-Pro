/**
 * [INPUT]: 依赖 obsidian 的 Notice；依赖 core/constants 的 FOLDERS/INIT_FOLDERS/NAV_FILE/README_FILE、
 *          core/folders 的 ensureFolderPath、core/time 的 nowStamp/nowStampAndUid、
 *          ./schemaNote 的 schemaNoteContent、
 *          core/types 的 ZiminosContext 与 VaultSeed
 * [OUTPUT]: 对外提供 initializeVault（开荒笔记库）与 applySeed（按需长出单个模块的产物）
 * [POS]: 开荒编排者，由设置页「初始化」按钮与 init-vault 命令唯一触发（人主导，无定时器）。
 *        它只保证三件事属于笔记库本身：PARA 骨架目录、属性类型示例笔记，
 *        以及「开荒过没有」这个事实。属性示例归这里而不归任一模块，
 *        是因为属性注册表横跨全部模块，它属于笔记库自己。
 *        其余一切产物——模板、导航、复盘时间轴、人脉 MOC——都由各功能模块自报 VaultSeed，
 *        由 main 装配后递进来。因此本文件不 import 任何兄弟模块，
 *        新增一个模块只是在 main 里多传一个 seed，这里一行不改（OCP）。
 *        开荒完成后第一个打开 README（头部是作者名片，正文是说明书；缺 README 回落导航）。
 *        两条原则压倒一切：绝不覆盖——所有写入都先查存在性，故可反复执行；
 *        绝不半途报错吓人——首个项目跳过、弹窗取消都不算失败，只有真异常才提示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import { FOLDERS, INIT_FOLDERS, NAV_FILE, README_FILE, SCHEMA_NOTE } from '../../core/constants';
import { ensureFolderPath } from '../../core/folders';
import { nowStamp, nowStampAndUid } from '../../core/time';
import { schemaNoteContent } from './schemaNote';
import type { VaultSeed, ZiminosContext } from '../../core/types';

// ============================================================
// 开荒常量
// ============================================================

/** 全部用户可见文案集中在此，避免同一句话在多处各写一遍 */
const MESSAGES = {
    notEmpty: '检测到已有笔记，ziminOS 只在空库开荒。请新建一个空库再试。',
    done: '开荒完成 ✅',
    failedPrefix: '初始化失败：',
} as const;

// ============================================================
// 开荒主流程
// ============================================================

/**
 * 开荒笔记库：建骨架目录、落各模块的产物、开出第一个项目。
 *
 * 首次开荒与后续补齐走同一条流程，差别只有三处：空库检查、各模块的 finish、
 * 以及 initializedAt 在确定性种子落齐后立即提交。这样「初始化」按钮永远可点——
 * 学员误删了模板、导航或人脉 MOC，再点一次就补回来，而已有笔记一个字都不会动。
 */
export async function initializeVault(
    ctx: ZiminosContext,
    seeds: readonly VaultSeed[],
): Promise<void> {
    try {
        // 是否首次开荒的唯一判据，必须在写入时间戳之前取出
        const isFirstRun = ctx.settings.initializedAt === '';

        if (isFirstRun && hasUserNotes(ctx, seeds)) {
            new Notice(MESSAGES.notEmpty);

            return;
        }

        // ============================================================
        // 1. PARA 骨架：笔记库自己的地基，与任何模块无关
        // ============================================================

        for (const folder of INIT_FOLDERS) {
            await ensureFolderPath(ctx.app, folder);
        }

        // ============================================================
        // 2. 属性类型示例：全部属性各出现一次，学员不必手动改任何一个属性的类型
        // ============================================================

        const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);

        await createFileIfMissing(ctx, SCHEMA_NOTE, schemaNoteContent(stamp, uid));

        // ============================================================
        // 3. 各模块的产物：目录先全部就位，再写笔记
        // ============================================================

        for (const seed of seeds) {
            await applySeed(ctx, seed);
        }

        // ============================================================
        // 4. 首次事实先落盘，再做可选收尾
        // ============================================================

        if (isFirstRun) {
            // 确定性的骨架与种子已经落齐，此刻初始化事实已经成立。
            // 必须在可选 finish 之前提交：否则第一个项目建成、随后设置落盘失败时，
            // 重启后它会被空库检查当成用户笔记，整个初始化从此无法恢复。
            ctx.settings.initializedAt = nowStamp(ctx.settings.dateTimeFormat);
            await ctx.saveSettings();

            for (const seed of seeds) {
                await seed.finish?.();
            }
        }

        // ============================================================
        // 5. 收尾：把学员送到 README
        // ============================================================

        new Notice(MESSAGES.done);

        // 开荒完成后第一眼是 README：头部是作者名片，正文是说明书。
        // 只拿到 main.js 的库没有 README，那就回落到导航——两者必有其一是这次开荒刚建的
        const landing = ctx.app.vault.getAbstractFileByPath(README_FILE) ? README_FILE : NAV_FILE;

        await ctx.app.workspace.openLinkText(landing, '', false);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(MESSAGES.failedPrefix + message);
    }
}

/**
 * 落一份开荒贡献：先建目录，再写缺失的笔记。
 *
 * 独立导出是为了客户模块——它不进默认开荒，由「初始化客户模块」命令按需执行同一段逻辑。
 * 「按需长出」与「开荒时长出」因此是同一件事的两个触发点，而不是两份各自演化的代码。
 */
export async function applySeed(ctx: ZiminosContext, seed: VaultSeed): Promise<void> {
    for (const folder of seed.folders) {
        await ensureFolderPath(ctx.app, folder);
    }

    for (const note of seed.notes) {
        await createFileIfMissing(ctx, note.path, note.content);
    }
}

// ============================================================
// 内部步骤
// ============================================================

/**
 * 判断库里是否已经存在用户自己的笔记。
 * 随模板分发的库内导游与 90-system/ 下的系统笔记都不算数——
 * 前者是学员拿到库时就在的，后者是插件自己写的，把它们计入会让开荒第一步就被自己挡住。
 */
function hasUserNotes(ctx: ZiminosContext, seeds: readonly VaultSeed[]): boolean {
    const systemPrefix = `${FOLDERS.system}/`;
    const generated = new Set<string>([
        README_FILE,
        SCHEMA_NOTE,
        ...seeds.flatMap((seed) => seed.notes.map((note) => note.path)),
    ]);

    // 首次失败可能已经留下部分种子；它们仍然是插件产物，不能反过来挡住恢复。
    return ctx.app.vault
        .getMarkdownFiles()
        .some((file) => !generated.has(file.path) && !file.path.startsWith(systemPrefix));
}

/**
 * 只在文件缺失时创建，是开荒可以反复执行的关键：已存在的文件一律不读不改不覆盖。
 * 写盘前先 mark，让卡片自动登记与 updated 维护把这次变化认作插件自己所为，不再回头处理。
 */
async function createFileIfMissing(
    ctx: ZiminosContext,
    path: string,
    content: string,
): Promise<void> {
    if (ctx.app.vault.getAbstractFileByPath(path)) return;

    ctx.guard.mark(path);
    await ctx.app.vault.create(path, content);
}
