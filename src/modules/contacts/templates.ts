/**
 * [INPUT]: 依赖 core/constants 的 FIELDS/NOTE_TYPES/CLIENT_MOC/LEDGER/PAYMENT_FIELDS，
 *          依赖 ../review/templates 的 viewBlock 与 ./moc 的 basenameOf
 * [OUTPUT]: 对外提供 personTemplateFile/personNoteContent、clientTemplateFile/clientNoteContent、
 *           contactMocContent/clientMocContent、ensureClientAnswerView 七个纯函数，
 *           以及 PersonValues/ClientValues 两个入参类型
 * [POS]: 人脉与客户模块唯一生成文本的地方，纯函数无副作用。
 *        一条贯穿全文件的纪律：模板文件的 type 必须留空。识别身份靠 type 而不靠文件夹，
 *        模板一旦自带 type: person，它自己就会变成名录里的一个人、投喂名单上的一张嘴、
 *        以及「记人情」选人列表里的一个候选。留空是它不污染任何统计的唯一办法，
 *        代价是手工复制模板建档要自己补 type——用命令建档则不必操心。
 *        两张 MOC 的使用说明正文一并在此：它们是学员唯一会反复读的说明书，
 *        而说明书与实现分处两地必然漂移，所以让它们从同一处生成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
    CLIENT_MOC,
    FIELDS,
    LEDGER,
    NOTE_TYPES,
    PAYMENT_FIELDS,
} from '../../core/constants';
import { viewBlock } from '../review/templates';
import { basenameOf } from './moc';

/** 建档时要填进 frontmatter 的值；模板文件则全部留空 */
export interface PersonValues {
    readonly created: string;
    /** 14 位数字 UID；模板文件传 null 表示留空 */
    readonly uid: number | null;
    /** 模板留空，建档填 person */
    readonly type: string;
    /** 归属圈子，建档时默认指向人脉 MOC */
    readonly up: string;
    readonly tier: string;
    readonly direction: string;
}

/** 客户档案建档时要填进 frontmatter 的值 */
export interface ClientValues {
    readonly created: string;
    /** 14 位数字 UID；模板文件传 null 表示留空 */
    readonly uid: number | null;
    readonly type: string;
    /** 他从哪个渠道来 */
    readonly source: string;
    readonly contact: string;
}

const CLIENT_ANSWER_HEADING = '## 客户答疑（自动）';
const CLIENT_ANSWER_VIEW = viewBlock('客户答疑');

// ============================================================
// 人脉档案
// ============================================================

/**
 * 人脉档案正文。
 *
 * 档案里只留两类手写小节（联系方式、喜好与私事）和四个自动视图：
 * 稳定事实写一次就不动，发生的事一律写进当天日记由视图检索过来。
 * 因此没有手写的「往来记录」小节——那种小节的宿命是写三次就再也没人维护。
 */
export function personNoteContent(values: PersonValues): string {
    const frontmatter = [
        '---',
        `${FIELDS.aliases}:`,
        `${FIELDS.description}:`,
        `${FIELDS.created}: ${values.created}`,
        `${FIELDS.updated}:`,
        `${FIELDS.tags}:`,
        // UID 不加引号：属性面板把它登记为数字类型，加引号就变成一个长得像数字的字符串
        `${FIELDS.uid}:${values.uid === null ? '' : ` ${values.uid}`}`,
        `${FIELDS.type}:${values.type ? ` ${values.type}` : ''}`,
        // up 写成 YAML 列表：它在属性面板里是列表类型，一个人可以同时属于多个圈子
        values.up ? `${FIELDS.up}:\n  - "${values.up}"` : `${FIELDS.up}:`,
        `${FIELDS.tier}:${values.tier ? ` ${values.tier}` : ''}`,
        `${FIELDS.direction}:${values.direction ? ` ${values.direction}` : ''}`,
        `${FIELDS.gift}:`,
        `${FIELDS.address}:`,
        `${FIELDS.get}:`,
        `${FIELDS.birthday}:`,
        '---',
    ].join('\n');

    return [
        frontmatter,
        '',
        '## 联系方式',
        '',
        '## 喜好与私事',
        '',
        '## 相关项目（自动）',
        '',
        viewBlock('相关项目'),
        '',
        '## 人情账本（自动）',
        '',
        viewBlock('人情账本'),
        '',
        '## 关键事件（自动）',
        '',
        viewBlock('关键事件'),
        '',
        '## 待办（自动）',
        '',
        viewBlock('待办'),
        '',
    ].join('\n');
}

/** 供手工复制的人脉模板：全字段留空，type 尤其必须空 */
export function personTemplateFile(): string {
    return personNoteContent({ created: '', uid: null, type: '', up: '', tier: '', direction: '' });
}

// ============================================================
// 客户档案
// ============================================================

/**
 * 客户档案正文。
 *
 * 付费用户是与人脉并列的独立物种，不共用模板：tier（多久联系一次）、gift（送不送特产）、
 * birthday 在陌生付费用户身上是结构性拿不到，不是暂时没填——
 * 一个字段如果对整类笔记恒空，它就不该出现在那类笔记上。
 * 正文不带 %% 提示注释（v0.5.1）：付费行的格式示例住在客户 MOC 的使用说明与 README，
 * 每份新档案交付的都是干净的写作位，学员不必每次手删同一段提示。
 */
export function clientNoteContent(values: ClientValues): string {
    const frontmatter = [
        '---',
        `${FIELDS.aliases}:`,
        `${FIELDS.description}:`,
        `${FIELDS.created}: ${values.created}`,
        `${FIELDS.updated}:`,
        `${FIELDS.tags}:`,
        `${FIELDS.uid}:${values.uid === null ? '' : ` ${values.uid}`}`,
        `${FIELDS.type}:${values.type ? ` ${values.type}` : ''}`,
        `${FIELDS.source}:${values.source ? ` ${values.source}` : ''}`,
        `${FIELDS.contact}:${values.contact ? ` ${values.contact}` : ''}`,
        `${FIELDS.homepage}:`,
        '---',
    ].join('\n');

    return [
        frontmatter,
        '',
        '## 付费与交付',
        '',
        viewBlock('付费与交付'),
        '',
        CLIENT_ANSWER_HEADING,
        '',
        CLIENT_ANSWER_VIEW,
        '',
        '## 关键事件（自动）',
        '',
        viewBlock('关键事件'),
        '',
        '## 待办（自动）',
        '',
        viewBlock('待办'),
        '',
    ].join('\n');
}

/** 供手工复制的客户模板：全字段留空 */
export function clientTemplateFile(): string {
    return clientNoteContent({ created: '', uid: null, type: '', source: '', contact: '' });
}

/**
 * 给旧客户档案只补一块“客户答疑”视图。
 *
 * 这是显式升级命令的纯文本内核：已有块逐字不动；已有同名标题就只把块放进标题下；
 * 标题也没有时优先插在关键事件前，让新旧档案的阅读顺序一致。全文换行符沿用原文件。
 */
export function ensureClientAnswerView(content: string): string {
    const newline = content.includes('\r\n') ? '\r\n' : '\n';
    const normalized = content.replace(/\r\n/g, '\n');

    if (normalized.includes(CLIENT_ANSWER_VIEW)) return content;

    const section = `${CLIENT_ANSWER_HEADING}\n\n${CLIENT_ANSWER_VIEW}\n`;
    let updated: string;

    if (normalized.includes(CLIENT_ANSWER_HEADING)) {
        updated = normalized.replace(CLIENT_ANSWER_HEADING, `${CLIENT_ANSWER_HEADING}\n\n${CLIENT_ANSWER_VIEW}`);
    } else if (normalized.includes('## 关键事件（自动）')) {
        updated = normalized.replace('## 关键事件（自动）', `${section}\n## 关键事件（自动）`);
    } else {
        updated = `${normalized.replace(/\n*$/, '')}\n\n${section}`;
    }

    return newline === '\n' ? updated : updated.replace(/\n/g, newline);
}

// ============================================================
// 两张 MOC
// ============================================================

/** 领域 MOC 的 frontmatter：领域没有终点，status 恒空 */
function areaFrontmatter(description: string, created: string, uid: number): string {
    return [
        '---',
        `${FIELDS.aliases}:`,
        `${FIELDS.description}: ${description}`,
        `${FIELDS.created}: ${created}`,
        `${FIELDS.updated}:`,
        `${FIELDS.tags}:`,
        `${FIELDS.uid}: ${uid}`,
        `${FIELDS.type}: ${NOTE_TYPES.area}`,
        `${FIELDS.status}:`,
        '---',
    ].join('\n');
}

/** 人脉领域总控台 */
export function contactMocContent(
    created: string,
    uid: number,
    clientMocName = basenameOf(CLIENT_MOC),
): string {
    return [
        areaFrontmatter('人脉领域总控台：按圈子分组的名录、投喂名单、本月生日、人情余额', created, uid),
        '',
        `> 这里是全部人的经营视角。付费与交付另见 [[${clientMocName}]]。`,
        '> 一个人可以同时出现在两张地图上：他确实可以既是我的客户，又是我的朋友。',
        '',
        '## 📇 名录',
        '',
        viewBlock('人脉名录'),
        '',
        '## 🎁 投喂名单',
        '',
        viewBlock('投喂名单'),
        '',
        '## 🎂 本月生日',
        '',
        viewBlock('本月生日'),
        '',
        '## ⚖️ 人情余额（未两清）',
        '',
        viewBlock('人情余额'),
        '',
        '## 📖 使用说明',
        '',
        '### 卡片上没有分类，只有归属',
        '',
        '人物档案是卡片笔记，**卡片不带分类**。所以这里没有「客户/生活/工作」这种身份字段，取而代之的是两条机制：',
        '',
        '| 要回答的 | 靠什么 |',
        '|---|---|',
        `| **他属于哪个圈子** | \`${FIELDS.up}\` 这条**归属链接**。指向哪个圈子 MOC，名录里就归到哪一组。想新分一个圈子（比如某公司的同事），建一个圈子 MOC，把那批人的 \`${FIELDS.up}\` 指过去，名录自动多一组 |`,
        `| **他是不是客户** | **不标注，从事实推断**：名下有 \`${FIELDS.client}\` 指向他的项目，他就是客户。给谁干过活谁才是客户，这比贴标签诚实 |`,
        '',
        '好处是身份不再互斥：同一个人可以既在名录里（经营关系），又在客户名录里（交付关系），因为他本来就是两者。',
        '',
        '### 档案放哪都行',
        '',
        `视图**靠 \`${FIELDS.type}: ${NOTE_TYPES.person}\` 认人，不靠文件夹**。你把档案挪去别的目录、改掉目录名、甚至用英文目录名，十几个视图一个都不用改。`,
        '',
        '唯一还认位置的是**归档**：档案移进归档目录即退出全部名录（身份没变，是你不再经营这段关系了）。归档目录在「设置 › ziminOS › 高级」里改一次，全部视图跟着走。',
        '',
        '### 另外三条轴',
        '',
        '| 属性 | 管什么 | 取值 |',
        '|---|---|---|',
        `| \`${FIELDS.tier}\` | **联系节奏**：多久该说句话 | 密=每周 / 近=每月 / 熟=每季 / 远=每年 |`,
        `| \`${FIELDS.direction}\` | **位势**：这段关系往哪个方向使劲 | 向上（要用心维护）/ 平行 / 向下（给机会，结善缘） |`,
        `| \`${FIELDS.gift}\` | **主动投资**：愿不愿意持续在他身上花钱花心思 | 勾上即进「投喂名单」 |`,
        '',
        '三者互不蕴含：发小是「密 + 平行」却不在投喂名单上（他会笑你见外）；大客户是「熟 + 向上」却铁定在名单上。所以是三个字段，不是一个。',
        '',
        `\`${FIELDS.address}\` 存整串寄件信息（收件人 + 电话 + 地址），照着复制就能填快递单。它不参与筛选，进属性的唯一理由是投喂名单要把它聚合成一张表。`,
        '',
        '### 日常三个动作',
        '',
        '- **建档**：命令面板运行「新建人脉」，三连问（姓名 → 分层 → 方向），归属自动指向本 MOC。档案平铺存放，不建子目录。',
        `- **进投喂名单**：打开档案，属性里把 \`${FIELDS.gift}\` 写成 true、填好 \`${FIELDS.address}\`。带特产回来时，名单和地址已经就位。`,
        '- **记事记账**：全部写进**当天日记**，靠一行的形态自动分流到他的档案：',
        '',
        '| 你写的 | 落到他档案的 |',
        '|---|---|',
        '| `和 [[张三]] 去了新疆，谈定一起投一家网咖` | 关键事件 |',
        '| `- [ ] 出网咖投资方案给 [[张三]]` | 待办 |',
        `| \`- [[张三]]${LEDGER.separator}去${LEDGER.separator}送了半斤生普${LEDGER.separator}两清\` | 人情账本 |`,
        '',
        `账本行也可以用命令「记人情」四步点选写入。手写时注意：人名必须带 \`[[ ]]\`（它是索引），分隔符用全角 \`${LEDGER.separator}\`，状态取 ${LEDGER.statuses.join(' / ')}，${LEDGER.defaultStatus}可整段省略。`,
        '',
        '### 名录怎么读',
        '',
        '先看圈子，再看人。每组一张表回答四件事：认识谁、谁能给我什么、谁在变冷、谁要重点维护。',
        '',
        '「最近联系」是从日记反链**算出来的**，不用手填——你每记一笔人情或写一句日记，它自动刷新。超出该层节奏的会标 ⚠️，那就是该主动找他的信号。对客户而言这个 ⚠️ 最值钱：它是流失预警。',
        '',
        '### 年检',
        '',
        `每年过一遍名录：\`${FIELDS.up}\` 换圈（同事变路人就移出那个圈子）、\`${FIELDS.tier}\` 升降级、\`${FIELDS.direction}\` 修订、\`${FIELDS.gift}\` 进出、余额清账。`,
        '',
        '换工作时额外做一件事：打开那份工作的圈子 MOC，名录里那一组整组过一遍——留下的把归属改指人脉 MOC，散了的移进归档目录。不归档的话它会一直占着名录。',
        '',
    ].join('\n');
}

/** 客户领域总控台 */
export function clientMocContent(created: string, uid: number): string {
    return [
        areaFrontmatter('客户领域总控台：按人物汇总金额、交付状态与建档日期', created, uid),
        '',
        '> 一张表看清钱从谁来、交付欠到哪、关系从何时开始。',
        '> 待交付客户置顶，其余按累计金额排列。',
        '',
        '## 💰 客户名录',
        '',
        viewBlock('客户名录'),
        '',
        '## 📖 使用说明',
        '',
        '### 四列都从事实计算',
        '',
        '| 列 | 怎么来 |',
        '|---|---|',
        `| **人物** | 所有仍在经营、且 \`${FIELDS.type}: ${NOTE_TYPES.client}\` 的客户档案 |`,
        `| **金额** | 这个人物名下全部 \`${PAYMENT_FIELDS.amount}\` 的累计，不另设汇总字段 |`,
        '| **交付** | 未勾选的付费任务有几项；全部勾完即显示「已交付」 |',
        `| **创建日期** | 客户档案的 \`${FIELDS.created}\`，只表示这段客户关系何时建档，不随付款更新 |`,
        '',
        '客户刚建档、还没产生付费时，金额与交付都显示「—」，不拿 0 假装已经发生过一笔交易。',
        '',
        '### 日常三个动作',
        '',
        '- **建档**：命令面板运行「新建客户」，填写称呼、渠道和联系方式。',
        '- **记一笔钱**：运行「增加付费」，选客户、产品并填写金额。',
        '- **完成交付**：打开客户档案，在「付费与交付」小节勾掉对应任务；MOC 自动刷新。',
        '',
        '### 付费怎么记：一笔一条任务',
        '',
        '**一笔付费的本质，就是「我欠他一次交付」，那本来就是个待办。** 所以命令写入的是**未勾选**的任务行，交付完点一下勾：',
        '',
        '```markdown',
        `- [x] [${PAYMENT_FIELDS.product}::课程] [${PAYMENT_FIELDS.amount}::365] [${PAYMENT_FIELDS.date}::2026-08-12]`,
        `- [ ] [${PAYMENT_FIELDS.product}::咨询] [${PAYMENT_FIELDS.amount}::199] [${PAYMENT_FIELDS.date}::2026-09-01]`,
        '```',
        '',
        '**三条格式纪律**，每条都在躲一个真坑：',
        '',
        '| 纪律 | 为什么 |',
        '|---|---|',
        `| **键名用中文**（${PAYMENT_FIELDS.amount}，不写 Amount） | 含大写的键会被额外补一份小写规范名，同一笔钱在遍历求和时被算两遍 |`,
        '| **一笔写一行，不要嵌套** | 父项和子项的字段各自扁平上浮，页面级看不到谁配谁，配对丢失 |',
        '| **产品名写在值里，不当键名** | 写成 `[课程::365]` 的话，算总收入就得枚举所有产品名，加一个产品要改所有查询 |',
        '',
        `渠道不写进流水行——它属于这个人不属于每一笔，写在 frontmatter 的 \`${FIELDS.source}\` 里就够了。也**不设「付费次数」「累计金额」字段**：数行数就是次数，求和就是累计，手工维护的计数迟早和流水对不上，而对不上的那天你不会发现。`,
        '',
        '### 一条法，两类档案都守',
        '',
        '**日常发生的事只写一处：当天日记，句子里带 `[[客户名]]`。** 客户档案的「关键事件」和「待办」会自己把它们检索过来，和人脉档案完全同一套机制。所以客户档案里没有手写的「他的问题」「交付记录」小节——**你不用维护任何一份档案的正文**。',
        '',
    ].join('\n');
}
