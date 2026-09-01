/**
 * [INPUT]: 依赖 core/constants 的 EXPORT_MANIFEST_HEADING/EXPORT_MANIFEST_SEPARATOR 与 FIELDS/NOTE_TYPES
 * [OUTPUT]: 对外提供 ManifestEntry 类型、manifestLine（渲染一行）、parseManifestLine（解析一行）、
 *           manifestSkeleton（新建出库单的完整正文）与 KIND_LABELS
 * [POS]: eternal 模块的纯文本层，不认识磁盘、不认识 Obsidian，输入输出都是字符串。
 *        它与 core/markdownStyle 是同一种分工：**这里是唯一会把出库单写歪的地方**，
 *        所以它必须能在没有笔记库的环境里逐字节回归。
 *        渲染与解析写在同一个文件、彼此紧邻，是因为它们是同一份格式的两面：
 *        插件按 manifestLine 写、按 parseManifestLine 读，桌面智能体也按同一份格式勾选。
 *        三方共用一份格式而它只存在一处，两处分叉这件事因此在结构上不可能发生。
 *        解析刻意宽容而渲染刻意严格：用户会手改这张清单（这是我们承诺给他的自由），
 *        改乱的行不该让整个视图炸掉，只该让那一行落选。字段边界从固定结构两端定位，
 *        项目名或文件夹名即使含有可见分隔符也不会把后续字段推错位。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
    EXPORT_MANIFEST_HEADING,
    EXPORT_MANIFEST_SEPARATOR,
    NOTE_TYPES,
    VIEW_BLOCK_LANG,
} from '../../core/constants';

/** 代码块围栏。写在单引号里，免得与 TypeScript 模板字符串的反引号打架 */
const FENCE = '```';

// ============================================================
// 契约
// ============================================================

/** 出库单上的一行：一个已完成、等着搬进《赛博永生》的容器 */
export interface ManifestEntry {
    /** 是否已经被搬走并提炼过。对应那个复选框 */
    readonly done: boolean;
    /** 归档时刻，YYYY-MM-DD HH:mm */
    readonly stamp: string;
    /** 容器类型的中文名，学员读得懂的那个词 */
    readonly kindLabel: string;
    /** 项目名 */
    readonly name: string;
    /** 归档后的文件夹库内路径 */
    readonly folderPath: string;
    /** 跨库身份 */
    readonly uid: string;
}

/**
 * 容器类型的中文显示名。
 * 出库单是给人看的，`project` 三个字母对学员不构成信息；
 * 而智能体读的是同一行里的 UID 与路径，不靠这个词做判断，因此翻译成中文是安全的。
 */
export const KIND_LABELS: Readonly<Record<string, string>> = {
    [NOTE_TYPES.project]: '项目',
    [NOTE_TYPES.book]: '书',
};

/** UID 在行内的前缀。它同时是解析时认出这一段的锚点 */
const UID_PREFIX = 'UID ';

// ============================================================
// 渲染
// ============================================================

/**
 * 渲染出库单的一行。
 *
 * 形态是一条标准 Markdown 任务行，不是自造格式：这本库里「还没做的事」
 * 长什么样已经有答案了（灵感集、日记的待办都是任务行），出库单再发明一种
 * 只会让学员多学一样东西。而且任务行天然能被本插件的表格渲染器勾选、
 * 能被 Obsidian 自己的搜索找到、能被用户直接手改。
 *
 * 项目名写成双链而不是纯文字：它指向的 MOC 确实存在于本库，点得开。
 * 这与「兼收并蓄里不写双链」是同一条判据的两面——那边指向的人物档案在隔壁库，
 * 点不开，所以不写。
 */
export function manifestLine(entry: ManifestEntry): string {
    const box = entry.done ? '- [x] ' : '- [ ] ';
    const fields = [
        entry.stamp,
        entry.kindLabel,
        `[[${entry.name}]]`,
        `\`${entry.folderPath}\``,
        `${UID_PREFIX}${entry.uid}`,
    ];

    return box + fields.join(EXPORT_MANIFEST_SEPARATOR);
}

/**
 * 新建出库单时的完整正文。
 *
 * 正文里那两句话是写给人的，不是装饰：学员某天点开 90-system 看见一篇没见过的笔记，
 * 必须能在三秒内知道它是什么、谁在写它、他能不能删。删得掉是重点——
 * 说清「删掉只是丢了这张待办清单，项目本身好好待在归档里」，
 * 他才敢真的去动它，而不是留着一个不敢碰的黑盒。
 */
export function manifestSkeleton(eternalVaultName: string): string {
    return [
        '---',
        'type: ziminos-export-manifest',
        '---',
        '',
        '# 赛博永生出库单',
        '',
        `下面每一行是一个**已经完成并归档**、但还没搬进《${eternalVaultName}》的项目或书。`,
        '',
        '你不用管它。下次和桌面智能体说话时，它会把这些项目搬过去、提炼成知识，',
        '然后把这里对应的那一行勾上。想手动跳过某一行，自己勾掉就行。',
        '',
        '删掉这篇笔记是安全的：丢掉的只是这张待办清单，项目本身好好待在归档目录里。',
        '',
        // 汇总在上、流水在下，与灵感集同一套画法：一进来先知道欠了几笔，再往下看是哪几笔
        `${FENCE}${VIEW_BLOCK_LANG}`,
        '待搬运',
        FENCE,
        '',
        EXPORT_MANIFEST_HEADING,
        '',
        '',
    ].join('\n');
}

// ============================================================
// 解析
// ============================================================

/** 任务行的形态：行首可缩进，`- [ ]` 或 `- [x]`，方括号里那一个字符决定勾没勾 */
const TASK_LINE = /^\s*-\s*\[([ xX])\]\s*(.*)$/;

/**
 * 解析出库单的一行。
 *
 * 认不出就返回 null，绝不抛异常也绝不猜：这张清单是用户可以随手编辑的，
 * 他写进去的一句备注、一个空行、一条自己加的待办，都会经过这里。
 * 让一行看不懂的文字炸掉整个视图，等于因为他行使了我们承诺给他的自由而惩罚他。
 *
 * 判据只有一条硬的：**必须找得到 UID**。其余字段缺了都还能显示，
 * 唯独没有 UID 的行无法与《赛博永生》里的任何东西对上号——
 * 搬过去会变成一页来路不明的 wiki，重复归档时还会再长出一页一模一样的。
 */
export function parseManifestLine(line: string): ManifestEntry | null {
    const matched = TASK_LINE.exec(line);

    if (!matched) return null;

    const done = matched[1]?.toLowerCase() === 'x';
    const body = matched[2] ?? '';
    const uidMarker = `${EXPORT_MANIFEST_SEPARATOR}${UID_PREFIX}`;
    const uidAt = body.lastIndexOf(uidMarker);

    if (uidAt < 0) return null;

    const uid = body.slice(uidAt + uidMarker.length).trim();

    if (!uid) return null;

    // 从右侧的 `路径` 与 UID 先定位，避免项目名/路径里的「 · 」被当成分隔符。
    // 这不改可读的旧格式，已有出库单与新写入行仍能互通。
    const beforeUid = body.slice(0, uidAt);
    const folderMarker = `${EXPORT_MANIFEST_SEPARATOR}\``;
    const folderAt = beforeUid.lastIndexOf(folderMarker);

    if (folderAt < 0) return null;

    const prefix = beforeUid.slice(0, folderAt);
    const firstSeparatorAt = prefix.indexOf(EXPORT_MANIFEST_SEPARATOR);
    const secondSeparatorAt = prefix.indexOf(
        EXPORT_MANIFEST_SEPARATOR,
        firstSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length,
    );

    if (firstSeparatorAt < 0 || secondSeparatorAt < 0) return null;

    const stamp = prefix.slice(0, firstSeparatorAt).trim();
    const kindLabel = prefix
        .slice(firstSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length, secondSeparatorAt)
        .trim();
    const name = prefix.slice(secondSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length).trim();
    const folderPath = beforeUid.slice(folderAt + EXPORT_MANIFEST_SEPARATOR.length).trim();

    return {
        done,
        stamp,
        kindLabel,
        name: stripLink(name),
        folderPath: stripCode(folderPath),
        uid,
    };
}

/** 去掉双链的方括号，拿回里面那个名字；不是双链就原样返回 */
function stripLink(field: string): string {
    const matched = /^\[\[(.+)\]\]$/.exec(field);

    return matched?.[1]?.split('|')[0]?.trim() ?? field;
}

/** 去掉行内代码的反引号；没有就原样返回 */
function stripCode(field: string): string {
    const matched = /^`(.+)`$/.exec(field);

    return matched?.[1]?.trim() ?? field;
}
