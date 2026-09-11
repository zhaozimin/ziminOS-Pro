/**
 * [INPUT]: 依赖 obsidian 的 Notice/TFile；依赖 core/commands 的 CONTACT_COMMANDS，
 *          core/constants 的 CONTACT_FOLDER/CONTACT_MOC/LEGACY_CONTACT_MOC/CONTACT_TIERS/CONTACT_DIRECTIONS/NOTE_TYPES，
 *          core/folders 的 ensureFolderPath/
 *          normalizeFolderPath，core/modals 的 TextInputModal/ChoiceModal，core/time 的 nowStampAndUid，
 *          core/types 的 ZiminosContext；依赖 ./moc 的新旧 MOC 寻址与 ./templates 的 personNoteContent
 * [OUTPUT]: 对外提供 registerCreateContactCommand（注册「新建人脉」命令）
 * [POS]: 人脉档案的诞生处。三连问的顺序是设计过的——姓名是自由文本放最前，
 *        分层与方向都是封闭枚举放在后面：先付出的成本最小，中途反悔损失最少。
 *        两个枚举一律走 ChoiceModal 而非文本输入，这是全模块的纪律：
 *        自由文本会长出「近/较近/比较近」三种写法，而它们在名录里是三个不同的层。
 *        type: person 由本命令填、模板留空——识别身份靠 type 不靠文件夹，
 *        模板若自带 type，它自己就会变成名录里的一个人。新建档案的 up 优先指向新名，
 *        但已安装库只有旧 MOC 时继续指向旧名，不因插件升级制造悬空双链
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice, TFile } from 'obsidian';
import { CONTACT_COMMANDS } from '../../core/commands';
import {
    CONTACT_DIRECTIONS,
    CONTACT_FOLDER,
    CONTACT_MOC,
    CONTACT_TIERS,
    LEGACY_CONTACT_MOC,
    NOTE_TYPES,
} from '../../core/constants';
import { ensureFolderPath, normalizeFolderPath } from '../../core/folders';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import { nowStampAndUid } from '../../core/time';
import type { ZiminosContext } from '../../core/types';
import { basenameOf, resolveBuiltInMocPath } from './moc';
import { personNoteContent } from './templates';

/** Obsidian 文件名禁用的字符，外加会破坏双链解析的方括号与井号 */
const ILLEGAL_NAME = /[\\/:*?"<>|#^[\]]/;

const MESSAGES = {
    namePrompt: '这个人叫什么？（真名，档案就用它命名）',
    namePlaceholder: '例如：张三',
    cancelled: '已取消，没有建档。',
    illegalName: '姓名里不能有 \\ / : * ? " < > | # ^ [ ] 这些字符。',
    tierPrompt: '多久该跟他说句话？',
    directionPrompt: '这段关系往哪个方向使劲？',
    existsPrefix: '已经有这份档案了，直接打开：',
    donePrefix: '档案已建好：',
    failedPrefix: '建档失败：',
} as const;

/** 分层的说明，让「密/近/熟/远」在选择列表里自带含义 */
const TIER_HINTS: Readonly<Record<string, string>> = {
    密: '每周说句话',
    近: '每月说句话',
    熟: '每季说句话',
    远: '每年说句话',
};

/** 方向的说明 */
const DIRECTION_HINTS: Readonly<Record<string, string>> = {
    向上: '要用心维护',
    平行: '互相搭把手',
    向下: '给机会，结善缘',
};

/** 注册「新建人脉」命令 */
export function registerCreateContactCommand(ctx: ZiminosContext): void {
    ctx.commands.register(CONTACT_COMMANDS.create, () => {
        void createContact(ctx);
    });
}

/** 三连问 → 建档 → 打开 */
async function createContact(ctx: ZiminosContext): Promise<void> {
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

        const tier = await new ChoiceModal(ctx.app, {
            title: MESSAGES.tierPrompt,
            items: CONTACT_TIERS,
            labelOf: (item) => `${item}　—　${TIER_HINTS[item] ?? ''}`,
        }).openAndGetChoice();

        if (!tier) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const direction = await new ChoiceModal(ctx.app, {
            title: MESSAGES.directionPrompt,
            items: CONTACT_DIRECTIONS,
            labelOf: (item) => `${item}　—　${DIRECTION_HINTS[item] ?? ''}`,
        }).openAndGetChoice();

        if (!direction) {
            new Notice(MESSAGES.cancelled);

            return;
        }

        const folder = normalizeFolderPath(ctx.settings.contactFolder, CONTACT_FOLDER);
        const mocPath = resolveBuiltInMocPath(ctx.app, folder, CONTACT_MOC, LEGACY_CONTACT_MOC);
        const path = `${folder}/${name}.md`;
        const existing = ctx.app.vault.getAbstractFileByPath(path);

        // 重名一律打开而不覆盖：同名的很可能就是同一个人，覆盖会毁掉一份积累多年的档案
        if (existing instanceof TFile) {
            new Notice(MESSAGES.existsPrefix + name);
            await ctx.app.workspace.getLeaf(false).openFile(existing);

            return;
        }

        const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
        const content = personNoteContent({
            created: stamp,
            uid,
            type: NOTE_TYPES.person,
            up: `[[${basenameOf(mocPath)}]]`,
            tier,
            direction,
        });

        await ensureFolderPath(ctx.app, folder);
        ctx.guard.mark(path);

        const file = await ctx.app.vault.create(path, content);

        new Notice(MESSAGES.donePrefix + name);
        await ctx.app.workspace.getLeaf(false).openFile(file);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(MESSAGES.failedPrefix + message);
    }
}
