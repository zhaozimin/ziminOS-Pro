/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile；依赖 core/constants 的 EXPORT_MANIFEST_FILE/
 *          EXPORT_MANIFEST_HEADING 与 FOLDERS；依赖 core/folders 的 ensureFolderPath；
 *          依赖 core/markdown 的 insertIntoSection；依赖 core/time 的 nowStamp；
 *          依赖 core/types 的 ArchivedContainer/ArchivedHook/ZiminosContext；
 *          依赖 ./manifest 的 KIND_LABELS/manifestLine/manifestSkeleton/parseManifestLine
 * [OUTPUT]: 对外提供 createExportHook（造出「归档之后往出库单记一笔」那个函数）
 * [POS]: eternal 模块的写入侧，也是整个第二版里**唯一一处跨库意图的落点**——
 *        注意它落的是「意图」不是「文件」：它只往本库的一篇 Markdown 里追加一行，
 *        一个字节都不写到《赛博永生》里去。跨库拷贝由桌面智能体执行。
 *        这条分工不是实现上的将就，是三条红线里第三条的直接推论：
 *        Obsidian 的 vault API 被沙箱锁在本库内，插件要写隔壁库只能借 Node fs，
 *        那会是「只用官方公开 API」的第三处缺口，而且手机上必炸。
 *        既然提炼本来就得智能体来干，就让它一次进门把搬运与提炼一起做完——
 *        插件负责记住「欠了这一笔」，智能体负责还。
 *        它对失败的姿态也由此决定：出库单写不成绝不打断归档。
 *        归档已经落地了，用户的项目已经搬走了，这时候抛一个错只会让他以为归档失败。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';

import { EXPORT_MANIFEST_FILE, EXPORT_MANIFEST_HEADING, FOLDERS } from '../../core/constants';
import { ensureFolderPath } from '../../core/folders';
import { insertIntoSection } from '../../core/markdown';
import { nowStamp } from '../../core/time';
import type { ArchivedContainer, ArchivedHook, ZiminosContext } from '../../core/types';
import { KIND_LABELS, manifestLine, manifestSkeleton, parseManifestLine } from './manifest';

/** 出库单上时间戳的格式。到分即可——它回答的是「哪天归的档」，不是一次计时 */
const STAMP_FORMAT = 'YYYY-MM-DD HH:mm';

// ============================================================
// 对外
// ============================================================

/**
 * 造出归档移交的接收函数。
 *
 * 返回的是同步函数而不是 async：projects 那边在归档成功之后调它，
 * 那时用户已经看到「项目已完成」的提示，这一步不该让他再等一次磁盘 I/O。
 */
export function createExportHook(ctx: ZiminosContext): ArchivedHook {
    return (container: ArchivedContainer): void => {
        void recordExport(ctx, container);
    };
}

// ============================================================
// 实现
// ============================================================

/**
 * 往出库单追加一笔，全程不向上抛错。
 *
 * 三种情况静默跳过而不提示：没有 UID、已经记过、本库不是「以人为本」。
 * 前两种是数据判断，第三种是角色判断——《赛博永生》里也装着同一个插件，
 * 而在那本库里归档一个项目不该再把它送回自己的出库单。
 */
async function recordExport(ctx: ZiminosContext, container: ArchivedContainer): Promise<void> {
    try {
        const layout = ctx.edition.layout;

        if (ctx.edition.role !== 'human' || !layout) return;

        // 没有 UID 的容器无法在《赛博永生》里被认领。这是老库里手建的项目才会出现的情况，
        // 提示一句而不是静静跳过：他会想知道为什么这个项目没被送过去
        if (!container.uid) {
            new Notice(
                `《${container.name}》没有 UID，暂时没法送进《${layout.eternal}》。在它的 MOC 里补一个 UID 再归档一次即可。`,
            );

            return;
        }

        const content = await readOrCreateManifest(ctx, layout.eternal);

        // 同一个项目可以被重新开始、再次完成，于是同一个 UID 会第二次走到这里。
        // 已经在单子上（无论勾没勾）就不再追加：勾过的说明智能体已经提炼过，
        // 它下次会按 UID 认出这是同一件事的新版本；没勾的本来就还欠着，重复记一笔只是噪音
        if (alreadyListed(content, container.uid)) return;

        const line = manifestLine({
            done: false,
            stamp: nowStamp(STAMP_FORMAT),
            kindLabel: KIND_LABELS[container.kind] ?? container.kind,
            name: container.name,
            folderPath: container.folderPath,
            uid: container.uid,
        });

        const next = insertIntoSection(content, EXPORT_MANIFEST_HEADING, line);

        await writeManifest(ctx, next);

        new Notice(`已记进出库单：下次和智能体说话时，《${container.name}》会搬进《${layout.eternal}》。`);
    } catch (error) {
        // 归档已经成功落地了。这里失败只意味着少记了一笔待办，
        // 用户随时可以让智能体重新扫一遍归档目录补上——因此只报告，绝不惊动归档本身
        new Notice(`出库单没记成（项目已经正常归档）：${message(error)}`);
    }
}

/** 读出库单；不存在就现建一篇，连同它的说明正文 */
async function readOrCreateManifest(ctx: ZiminosContext, eternalVaultName: string): Promise<string> {
    const file = ctx.app.vault.getAbstractFileByPath(EXPORT_MANIFEST_FILE);

    if (file instanceof TFile) return ctx.app.vault.read(file);

    await ensureFolderPath(ctx.app, FOLDERS.system);

    return manifestSkeleton(eternalVaultName);
}

/**
 * 落盘。
 * 写之前登记自写：这是插件的动作，不该被 updatedMaintainer 记成用户的编辑，
 * 也不该让视图引擎把它当成一次值得重画的人为改动。
 */
async function writeManifest(ctx: ZiminosContext, content: string): Promise<void> {
    const file = ctx.app.vault.getAbstractFileByPath(EXPORT_MANIFEST_FILE);

    ctx.guard.mark(EXPORT_MANIFEST_FILE);

    if (file instanceof TFile) {
        await ctx.app.vault.modify(file, content);

        return;
    }

    await ctx.app.vault.create(EXPORT_MANIFEST_FILE, content);
}

/** 这个 UID 是不是已经在单子上了。勾没勾都算在 */
function alreadyListed(content: string, uid: string): boolean {
    return content.split('\n').some((line) => parseManifestLine(line)?.uid === uid);
}

/** 异常转中文一句话。与全库其余写路径同一种姿态：用户看到的永远是话，不是堆栈 */
function message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
