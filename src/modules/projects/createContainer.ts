/**
 * [INPUT]: 依赖 obsidian 的 MarkdownView/Notice/normalizePath 与 App/TFile 类型，
 *          依赖 core/constants 的 FIELDS/FOLDERS/NOTE_TYPES、core/folders 的
 *          ensureFolderPath/normalizeFolderPath、core/modals 的 TextInputModal/ChoiceModal、
 *          core/time 的 nowStampAndUid、core/types 的 ZiminosContext/ZiminosSettings，
 *          依赖同目录 moc 的 mocPathOf 与 templates 的 mocContent/mocFrontmatter
 * [OUTPUT]: 对外提供 ContainerKind 契约、PROJECT_KIND/AREA_KIND/BOOK_KIND 三份规格、
 *           CreateContainerPreset 预设契约、PersonPicker 选人能力契约、createContainer
 * [POS]: 「一个文件夹 + 一篇 MOC」这件事的唯一实现，项目、领域与书籍共用它。
 *        三者的差别全部收在 ContainerKind 那张表里：落在哪个根目录、
 *        写什么 type、问不问归属、带不带小节骨架。三者的 Base 必须同源且只读
 *        this.file 实时上下文，不得把命名或路径再塞回容器规格。除此之外它们连一个字的提示文案都不该分叉——
 *        分叉的代价不是重复代码，是「新建领域」某天悄悄少了一道防覆盖校验。
 *        名称合法性、防覆盖、光标落点这些规矩因此只在此处定义一次。
 *        问答顺序是设计过的：名称 → 归属 →（只有挂了人的归属才问）选人 → 概述。
 *        概述放最后，是因为前面全是点选，中途取消不至于让人白写一段话；
 *        归属必须在动土之前问完，客户委托却没选到人时中止，不留半个空文件夹。
 *        文案与流程仍逐段对照 create-project-moc.js，只有一处 V3 主动偏离并已备案：
 *        归属由两项拆成三项，「自己做」从此不再多问一句同行者（理由写在 OWNERSHIP 头上）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { MarkdownView, Notice, normalizePath } from 'obsidian';
import type { TFile } from 'obsidian';
import { BOOK_HEADINGS, FIELDS, FOLDERS, NOTE_TYPES } from '../../core/constants';
import { ensureFolderPath, normalizeFolderPath } from '../../core/folders';
import { ChoiceModal, TextInputModal } from '../../core/modals';
import { nowStampAndUid } from '../../core/time';
import type { ZiminosContext, ZiminosSettings } from '../../core/types';
import { mocPathOf } from './moc';
import { mocContent, mocFrontmatter } from './templates';
import type { Bibliography, ContainerSection, ProjectRelation } from './templates';

/**
 * 「从库里选一个人」这项能力，由 main 在装配时注入。
 * 建项目要问「这是谁委托的」，而候选人住在人脉模块——本文件因此不 import 那个模块，只声明这个洞。
 *
 * 它曾经还带一个「库里没人时要不要吭声」的开关，V3 随归属三选项一起拆掉了：
 * 那个开关只为「自己独做但顺口问一句同行者」那条路存在，而现在会走到这里的每一次调用，
 * 都是用户刚刚明确表示要挂一个人——库里一个档案都没有时，那句话必须说。
 */
export type PersonPicker = (title: string) => Promise<TFile | null>;

/** 一个归属选项要挂的人。「自己做」没有这一项——这正是它与另外两项的全部区别 */
interface OwnershipLink {
    /** 写进 frontmatter 的字段：FIELDS.client 或 FIELDS.with */
    readonly field: string;
    /** 选人弹窗的标题 */
    readonly ask: string;
    /** 没选到人时是不是就不该建这个项目 */
    readonly required: boolean;
}

/** 一个归属选项：一句给人看的话，加上「要不要挂人、挂哪个字段」 */
interface OwnershipOption {
    readonly label: string;
    readonly link?: OwnershipLink;
}

/**
 * 项目归属的三个选项。
 *
 * 这一问是整条流程里信息量最大的一步，所以选项文案直接把后果写出来。
 *
 * 三个而不是两个，是 V3 修掉的一处自相矛盾：此前只有「自己的项目」与「客户委托的」，
 * 而选了「自己的项目」之后仍会弹一次「和谁一起做？（自己独做就按 Esc 跳过）」——
 * 标签刚说完这是自己的项目，下一屏就问你还有谁，用户只能靠按 Esc 来表达「真的只有我」。
 * 一个必须靠取消才能走完的流程，是在拿取消键当确认键使。
 * 拆开之后，「要不要挂人」由用户在同一屏里一次答完：自己做就直接进下一步，
 * 而「和别人一起做」与「客户委托的」才会弹选人。
 *
 * 后两项分家的理由不是分类癖：client 是商业契约标记，写下它等于把那个人注册成客户，
 * 三张客户表全靠它过滤；「周六和张三去旅游」这类私人项目必须走 with，
 * 否则朋友会被无声注册成客户、项目会挂进「我还欠谁的交付」，结案后还会污染案例库的选题统计。
 * 两者的必答性也不同：客户委托却没选到人就不该建这个项目——一笔没有债主的交付债务毫无意义；
 * 而一起做的人没选到，项目照建，只是少挂一条 with，那不影响这个项目成立。
 */
const OWNERSHIP: readonly OwnershipOption[] = [
    { label: '自己做（只有我，不挂任何人）' },
    {
        label: '和别人一起做（写 with，不算客户）',
        link: { field: FIELDS.with, ask: '和谁一起做？', required: false },
    },
    {
        label: '客户委托的（写 client，我欠他一个交付）',
        link: { field: FIELDS.client, ask: '这是谁委托的？', required: true },
    },
];

// ============================================================
// 项目与领域的全部差别
// ============================================================

/**
 * 一类容器的规格。
 *
 * 这张表存在的意义是把「项目和领域到底差在哪」摆成三行可读的事实，
 * 而不是散在流程里的三处 if。将来若再来第三类容器（比如「书籍」），
 * 它是这张表多一条，而不是这条流程多一个分支。
 */
export interface ContainerKind {
    /** 中文名，出现在每一句提示里 */
    readonly label: string;
    /** 写进 frontmatter 的 type，导航页据此把它摆进哪张表 */
    readonly type: string;
    /**
     * 写进 frontmatter 的 status；留空表示这类容器没有生命周期。
     * 领域正是如此：它没有终点，给它一个「进行中」等于承诺它某天会结束，
     * 而导航页那张「正在进行中」恰恰按 status 筛。
     */
    readonly status?: string;
    /** 取哪个设置项当根目录 */
    readonly folderKey: 'projectFolder' | 'areaFolder';
    /** 该设置项为空或写错时回落到哪个默认目录 */
    readonly folderFallback: string;
    /**
     * 要不要问「这是谁的」。
     *
     * 只有项目要问，因为只有项目可能是替别人做的、可能欠着一笔交付。
     * 领域是你对自己某一部分人生的长期关注——健康、手艺、人脉——
     * 它天然只属于你自己，问一句「这是谁委托的」是在问一个不成立的问题。
     */
    readonly asksOwnership: boolean;
    /** MOC 正文的小节骨架。只有书籍带（全部划线一个落点），项目与领域不带 */
    readonly sections?: readonly ContainerSection[];
}

export const PROJECT_KIND: ContainerKind = {
    label: '项目',
    type: NOTE_TYPES.project,
    status: 'active',
    folderKey: 'projectFolder',
    folderFallback: FOLDERS.projects,
    asksOwnership: true,
};

export const AREA_KIND: ContainerKind = {
    label: '领域',
    type: NOTE_TYPES.area,
    folderKey: 'areaFolder',
    folderFallback: FOLDERS.areas,
    asksOwnership: false,
};

/**
 * 书籍：第三类容器，这张表当初预言的那一条。
 *
 * 一本书就是一个项目——读完是它的终点，所以有 status: active，
 * 住项目目录（不新增设置字段），读完用既有的「完成项目」归档。
 * 不问归属：书没有委托人。它比另两类多一样东西——正文的「全部划线」落点。
 * 曾经还有一个「书籍信息」小节，v0.14.0 撤了：
 * 那一节是一张给人读的登记表，而那些值机器读得更多（按出版年排、按页数挑），
 * 于是整体搬进 YAML——摆在正文里它们只是五行谁也不会读第二遍的字。
 * 问答不走本流程：建书的三问（书名/作者/为什么读）由 books 模块自己问，
 * 答案装进 preset 递进来，因此这里一句提示文案都不必分叉。
 */
export const BOOK_KIND: ContainerKind = {
    label: '读书笔记',
    type: NOTE_TYPES.book,
    status: 'active',
    folderKey: 'projectFolder',
    folderFallback: FOLDERS.projects,
    asksOwnership: false,
    sections: [{ heading: BOOK_HEADINGS.highlights }],
};

/**
 * 免问答建容器的预设值。
 * 开荒流程已经从用户那里问到了名字，不该让人再答一遍，于是把答案直接递进来跳过两次弹窗；
 * 但预设值同样要过下面的名称校验——它源自用户输入，并不比手打的更可信。
 */
export interface CreateContainerPreset {
    /** 名称，同时是文件夹名与 MOC 文件名的后半截 */
    name: string;
    /** 概述，写入 MOC 的 description 字段 */
    description: string;
    /** 作者，只有书籍预设带；有值才落 YAML 行 */
    author?: string;
    /** 别名（书籍的带副标题全名），只有书籍预设带 */
    aliases?: readonly string[];
    /** 标签（书籍的豆瓣分类词），只有书籍预设带 */
    tags?: readonly string[];
    /**
     * 覆盖 UID。缺省即照惯例取 14 位时间戳。
     *
     * 只有书籍走这条：书自带 ISBN 这个全世界通用的号，给它再发一个只有本库认得的时间戳，
     * 等于给同一个东西造两个主键。换不出数字（豆瓣没给 ISBN、或者那本根本是电子书）时
     * 预设不带这一项，于是自动落回时间戳——本流程因此不需要知道 ISBN 是什么。
     */
    uid?: number;
    /** 出处链接（书籍的豆瓣条目地址），只有书籍预设带 */
    source?: string;
    /** 书目字段（译者、出版社、出版年、页数、封面），只有书籍预设带 */
    bibliography?: Bibliography;
    /** 覆盖 kind 自带的小节骨架。目前无人使用，留着是因为容器规格本就允许各类自带骨架 */
    sections?: readonly ContainerSection[];
}

/**
 * 新建一个项目或领域：建文件夹、写 MOC、打开并把光标停在正文起点。
 * 返回新建的 MOC 文件；用户取消、名称非法、同名 MOC 已存在或过程出错时返回 null。
 * 任何一步失败都不留半成品之外的痕迹，也绝不覆盖已有文件。
 */
export async function createContainer(
    ctx: ZiminosContext,
    kind: ContainerKind,
    preset?: CreateContainerPreset,
    pickPerson?: PersonPicker,
): Promise<TFile | null> {
    const { app } = ctx;

    try {
        // ============================================================
        // 1. 读取设置中的基础目录
        // ============================================================

        const settings: ZiminosSettings = ctx.settings;
        const baseFolder = normalizeFolderPath(settings[kind.folderKey], kind.folderFallback);

        // ============================================================
        // 2. 获取名称
        // ============================================================

        const nameInput = preset
            ? preset.name
            : await new TextInputModal(app, {
                  title: `请输入新建${kind.label}的名称`,
              }).openAndGetValue();

        if (nameInput === null || !nameInput.trim()) {
            new Notice(`未输入${kind.label}名称，操作已取消。`);
            return null;
        }

        const containerName = nameInput.trim();

        // 防止名称意外生成嵌套目录
        if (/[\\/]/.test(containerName)) {
            new Notice(`${kind.label}名称不能包含斜杠或反斜杠。`);
            return null;
        }

        // ============================================================
        // 3. 归属与关联的人：领域不问，开荒的首个项目走预设也不问
        // ============================================================

        let relation: ProjectRelation | undefined;

        if (kind.asksOwnership && !preset) {
            const ownership = await new ChoiceModal(app, {
                title: `这个${kind.label}是谁的？`,
                items: OWNERSHIP,
                labelOf: (item) => item.label,
            }).openAndGetChoice();

            if (!ownership) {
                new Notice(`未选择${kind.label}归属，操作已取消。`);
                return null;
            }

            // 「自己做」没有 link，因此一个字都不再问，直接进下一步——
            // 这正是用户选它时表达的意思，不该再让他按一次 Esc 来重申
            if (ownership.link && pickPerson) {
                const { field, ask, required } = ownership.link;
                const person = await pickPerson(ask);

                // 客户委托却没选到人，就不该建这个项目：一笔没有债主的交付债务毫无意义，
                // 而且此刻还没动土，中止不留半成品。一起做的人没选到则照建，
                // 少挂一条 with 不影响这个项目成立
                if (required && !person) {
                    new Notice('未选择客户，操作已取消。');
                    return null;
                }

                if (person) {
                    relation = {
                        field,
                        // 全路径消除人脉与客户目录里的同名歧义，别名仍让属性面板只显示姓名
                        target: `${person.path.replace(/\.md$/i, '')}|${person.basename}`,
                    };
                }
            }
        }

        // ============================================================
        // 4. 获取概述
        // ============================================================

        // 概述允许为空，因此只判断「是否取消」，不判断「是否填了字」
        const descriptionInput = preset
            ? preset.description
            : await new TextInputModal(app, {
                  title: `请输入${kind.label}概述`,
              }).openAndGetValue();

        if (descriptionInput === null) {
            new Notice(`已取消输入${kind.label}概述，操作已取消。`);
            return null;
        }

        const description = descriptionInput.trim();

        // ============================================================
        // 5. 生成文件夹与 MOC 笔记路径
        // ============================================================

        const containerFolderPath = normalizePath(`${baseFolder}/${containerName}`);
        const mocFilePath = mocPathOf(containerFolderPath, containerName);

        // ============================================================
        // 6. 逐级创建缺失的基础目录
        // ============================================================

        await ensureFolderPath(app, baseFolder);

        // ============================================================
        // 7. 创建容器文件夹
        // ============================================================

        await ensureFolderPath(app, containerFolderPath);

        // ============================================================
        // 8. 防止覆盖已经存在的 MOC
        // ============================================================

        const existingMocFile = app.vault.getAbstractFileByPath(mocFilePath);

        if (existingMocFile) {
            new Notice(`${kind.label} MOC 笔记已经存在，未执行覆盖：${mocFilePath}`);
            return null;
        }

        // ============================================================
        // 9. 生成 YAML 与 Base 内容
        // ============================================================

        // created 与 UID 必须出自同一时刻，否则跨秒时同一篇 MOC 的两个时间身份会差一秒；
        // 时间格式的空值回落由 core/time 内部负责，此处传原始设置值即可
        const { stamp: created, uid } = nowStampAndUid(settings.dateTimeFormat);

        const identity = {
            description,
            created,
            // 书籍预设带着 ISBN 进来时用它当 UID；其余一切情况仍是这一刻的 14 位时间戳
            uid: preset?.uid ?? uid,
            type: kind.type,
            status: kind.status,
            // 作者只可能来自书籍预设；交互路径从不问它，undefined 时那一行整行不写
            author: preset?.author,
            aliases: preset?.aliases,
            tags: preset?.tags,
            source: preset?.source,
            bibliography: preset?.bibliography,
            relation,
        };

        const mocMarkdown = mocContent({
            ...identity,
            // 预设带了小节就用预设的（书目信息已填好），否则用这一类容器的空骨架
            sections: preset?.sections ?? kind.sections,
        });

        // 光标落点只取决于 YAML 有多少行，故单独取一份 frontmatter 量行数；
        // 它是纯函数，与 mocMarkdown 内那一份逐字相同，正文的拼装规则仍只由 templates 一处定义
        const frontmatter = mocFrontmatter(identity);

        // ============================================================
        // 10. 创建、打开 MOC 并定位光标
        // ============================================================

        // 本次写入由插件发起，先登记再落盘，自动化监听据此放行
        ctx.guard.mark(mocFilePath);

        const mocFile = await app.vault.create(mocFilePath, mocMarkdown);

        const leaf = app.workspace.getLeaf(false);

        await leaf.openFile(mocFile, {
            active: true,
            state: {
                mode: 'source',
            },
        });

        if (leaf.view instanceof MarkdownView) {
            const editor = leaf.view.editor;

            // 三个空行中的第二行：紧接 YAML 之后留一行呼吸，人一落笔就在正文里
            const secondBlankLine = frontmatter.split('\n').length + 1;

            const cursorPosition = {
                line: secondBlankLine,
                ch: 0,
            };

            editor.setCursor(cursorPosition);
            editor.focus();

            if (typeof editor.scrollIntoView === 'function') {
                editor.scrollIntoView(
                    {
                        from: cursorPosition,
                        to: cursorPosition,
                    },
                    true,
                );
            }
        }

        new Notice(`${kind.label}已创建：${containerName}`);

        return mocFile;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        new Notice(`创建${kind.label}失败：${message}`);

        return null;
    }
}
