/**
 * [INPUT]: 依赖 obsidian 的 TFile 与 App 类型；依赖 core/constants 的 FIELDS/FOLDERS，
 *          core/folders 的 isInFolder/normalizeFolderPath，core/modals 的 ChoiceModal/TextInputModal，
 *          core/types 的 ZiminosContext
 * [OUTPUT]: 对外提供 isLivePath（还在经营范围内）、liveNotesOfType（命令侧的候选人清单）、
 *           descriptionOf 与 askDescription（那句简介的一读一问）、lastContactDayOf
 *           与 pickPerson（跨两库的选人弹窗）
 * [POS]: 「谁还算数」这个问题的唯一答案处，被两条命令与十几个视图共用。
 *        全部视图靠 type 认身份、不靠文件夹，唯一还认位置的是归档——
 *        因为「不再往来的人」需要一个退出机制，而他的身份没变，
 *        变的是你不再经营这段关系，这件事只能用位置表达。
 *        归档目录取自插件设置，不再需要库内的一份配置笔记：
 *        视图搬进插件之后，位置依赖彻底收敛到设置页那一个输入框。
 *        那句简介的读（descriptionOf）与问（askDescription）同住这里：它是一个人在名录与
 *        选人列表里的脸面，「这一句该写什么」只能有一个说法，人脉与客户两条建档命令共用它
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { ViewContext } from '../../core/codeblock';
import { FIELDS, FOLDERS, NOTE_TYPES } from '../../core/constants';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import { isInFolder, isSystemPath, normalizeFolderPath } from '../../core/folders';
import { dayOfTitle } from '../../core/time';
import type { ZiminosContext } from '../../core/types';

/** 归档目录，按设置解析 */
export function archiveFolderOf(ctx: ZiminosContext): string {
    return normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives);
}

/** 这条路径还在经营范围内吗？搬进归档目录即退出全部名录 */
export function isLivePath(archiveFolder: string, path: string): boolean {
    return !isInFolder(path, archiveFolder);
}

/**
 * 某个身份的全部在营笔记，按名字排序。
 *
 * 命令侧专用：命令拿不到视图引擎的索引，只能自己走一遍 metadataCache。
 * 这点开销发生在人点了命令之后、弹窗出现之前，量级是全库一次遍历，感知不到。
 */
export function liveNotesOfType(ctx: ZiminosContext, type: string): TFile[] {
    const archive = archiveFolderOf(ctx);
    const matched: TFile[] = [];

    for (const file of ctx.app.vault.getMarkdownFiles()) {
        if (isSystemPath(file.path)) continue;
        if (!isLivePath(archive, file.path)) continue;

        const declared = ctx.app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.type];
        const values = Array.isArray(declared) ? declared : [declared];

        if (values.some((value) => String(value ?? '').trim() === type)) matched.push(file);
    }

    return matched.sort((left, right) => left.basename.localeCompare(right.basename, 'zh'));
}

/** 档案的一句话简介，用来让选择列表里的同名者可区分 */
export function descriptionOf(ctx: ZiminosContext, file: TFile): string {
    const value = ctx.app.metadataCache.getFileCache(file)?.frontmatter?.[FIELDS.description];

    return String(value ?? '').trim();
}

/**
 * 建档时问那句简介，人脉与客户两条命令共用。
 *
 * 必填，没有例外（v0.38.0 用户明令）：空着的档案在选人列表里只剩一个名字，
 * 同名时无从分辨，在名录「一句话」那一栏里也只是一格空白。空白提交留在原窗补，
 * 因此返回的一定是修剪过的非空文本；只有人主动取消才返回 null，调用方据此不建档。
 * 单行而不是多行：它落进 frontmatter，又要跟在名字后面挤进选人列表的那一行。
 */
export async function askDescription(app: App): Promise<string | null> {
    const answer = await new TextInputModal(app, {
        title: '用一句话介绍这个人',
        hint: '可以写你们是怎么认识的，或者这个人对你意味着什么。之后每次选人，它都跟在名字后面。',
        placeholder: '例如：2024 年读书会上认识，做独立出版，常一起聊选题',
        required: '这一句必须填，填好才能建档。',
    }).openAndGetValue();

    return answer === null ? null : answer.trim();
}

/**
 * 从全部在营档案里选一个人。
 *
 * 候选跨人脉与客户两库：现实不分家——客户可能是朋友，熟人也可能派活给你。
 * 靠 type 识别而非文件夹，归档目录内的人不进候选（不再往来的人不该出现在新项目的关联里）。
 * 没有任何档案时给一句明确的引导再返回 null，免得调用方只能说一句没头没脑的「已取消」。
 */
export async function pickPerson(ctx: ZiminosContext, title: string): Promise<TFile | null> {
    const candidates = [
        ...liveNotesOfType(ctx, NOTE_TYPES.person),
        ...liveNotesOfType(ctx, NOTE_TYPES.client),
    ];

    if (!candidates.length) {
        // 这句话一律要说。它曾经带一个「安静模式」开关，供「关联本来就可选」的场景关掉，
        // 而 V3 之后已经没有那种场景——会走到这里的每一次调用，
        // 都是用户刚刚明确表示要挂一个人，此时沉默就是让他对着一个不弹的弹窗发愣
        new Notice('还没有任何人脉或客户档案。先运行「新建人脉」建一个，再来关联。');

        return null;
    }

    return new ChoiceModal(ctx.app, {
        title,
        items: candidates,
        labelOf: (file) => {
            const hint = descriptionOf(ctx, file);

            return hint ? `${file.basename}　—　${hint}` : file.basename;
        },
    }).openAndGetChoice();
}

/**
 * 最近一次在日记里提到他是哪天，没提过返回 null。
 *
 * 只认日记：档案之间的互链、MOC 里的名录链接都不算「联系」，
 * 否则每个人都会显示成今天刚联系过——名录会变成一张永远全绿的假表，
 * 而这套系统里最值钱的恰恰是那个 ⚠️。
 */
export function lastContactDayOf(view: ViewContext, person: TFile): string | null {
    let latest: string | null = null;

    for (const source of view.index.backlinksOf(person)) {
        const day = dayOfTitle(source.basename);

        if (day && (!latest || day > latest)) latest = day;
    }

    return latest;
}
