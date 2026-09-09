/**
 * [INPUT]: 依赖 ../../core/constants 的 CARD_FIELDS（卡片十字段的权威顺序）
 * [OUTPUT]: 对外提供 MocContentOptions 类型与六个纯生成函数：mocFrontmatter、mocBaseBlock、mocContent、
 *           cardTemplateFile、mocTemplateFile、navContent
 * [POS]: projects 模块的文本工厂，是「笔记长成什么样」的唯一出处。
 *        全部函数无副作用、只吐字符串，既不碰 App 也不碰文件系统——因此建项目与开荒共用同一套骨架，
 *        库里所有 MOC 的 YAML 与 base 视图才可能长期同构；日后改版式只需动这一个文件。
 *        MOC 的 base 块只读 this.file 的实时位置与身份，不接收、不冻结项目路径；
 *        项目、领域、书籍与手动 MOC 因此共用同一块数据库代码，整个容器搬移后零改写自适应。
 *        它把直属笔记、up 归属笔记、递归附件与全部内容分成三个视图，
 *        并在全局排除当前 MOC 与 90-system 整棵系统目录树。
 *        书籍只在 YAML 与正文小节上增量，不再分叉 base 视图；
 *        新建、手动插入与状态流转于是都没有第二份查询协议可以漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { CARD_FIELDS } from '../../core/constants';

// ============================================================
// 模板骨架的字段与视图定义
// ============================================================

/**
 * MOC 模板文件的八个字段。
 * 与卡片十字段不同，MOC 用 type/status 描述自己的身份与生命周期，没有 rating/author/source/up，
 * 因此不复用 CARD_FIELDS；此处是「手动插入的空模板」专用，与运行时生成的 mocFrontmatter 各司其职。
 */
const MOC_FIELDS: readonly string[] = [
    'aliases',
    'description',
    'created',
    'updated',
    'tags',
    'UID',
    'type',
    'status',
];

/** 导航页开头的一行说明。面向零基础学员，不出现术语 */
const NAV_INTRO = '这里是你的家。下面四张表会自动列出库里所有项目、领域和书籍，新建之后自动出现，不用手动维护。';

/** 导航页的四个表格视图：显示名、筛选表达式与列顺序 */
const NAV_VIEWS: readonly {
    readonly name: string;
    readonly filter: string;
    readonly columns: readonly string[];
}[] = [
    {
        name: '正在进行中',
        filter: 'status == "active"',
        columns: ['file.name', 'description', 'formula.status_icon'],
    },
    {
        name: '项目',
        filter: 'type == "project"',
        columns: ['file.name', 'description', 'formula.status_icon'],
    },
    { name: '领域', filter: 'type == "area"', columns: ['file.name', 'description'] },
    {
        name: '书籍',
        filter: 'type == "book"',
        columns: ['file.name', 'description', 'formula.status_icon'],
    },
];

// ============================================================
// MOC 正文生成（自 create-project-moc.js 逐字移植）
// ============================================================

/** 一篇 MOC 的 YAML 全部可变量。用具名对象传递以杜绝顺序错位 */
export interface MocFrontmatterOptions {
    /** 概述，写入 description */
    readonly description: string;
    /** 创建时间戳，格式由调用方按设置决定 */
    readonly created: string;
    /**
     * 笔记的永久身份，数字类型，落盘不带引号。
     *
     * 通常是 14 位本地时间；书籍走的是它的 ISBN——一本书本来就有一个全世界通用的号，
     * 再发一个只有这个库认得的时间戳，是给同一个东西造第二个主键。
     * 换号这件事只发生在调用方：本文件不认识 ISBN，只认识「这是一个数字」。
     */
    readonly uid: number;
    /** 身份：NOTE_TYPES.project 或 NOTE_TYPES.area。它决定导航页把这篇笔记摆进哪张表 */
    readonly type: string;
    /**
     * 生命周期状态。项目写 active，领域**不写**——
     * 领域是没有终点的长期关注，给它一个「进行中」等于承诺它某天会结束，
     * 而导航页那张「正在进行中」正是按 status 筛的，写了它就会混进去。
     */
    readonly status?: string;
    /**
     * 作者。只有书籍容器带它，且有值才写——空的 author 键是登记表不是索引。
     *
     * 落盘写成**单元素列表**而不是标量，因为 `author` 在库级属性注册表
     * （`.obsidian/types.json`）里登记的是 multitext，属性示例笔记也写着「可以有好几位」。
     * 属性类型是全库共享的一张表，某一篇笔记写成标量就与其余笔记不同构了；
     * 而这种不同构既不报错也不会被任何视图挡下，只会让属性面板与查询各说各话。
     * 同理见 cardInit 写 up 的方式——它也是 multitext，也写成单元素列表。
     */
    readonly author?: string;
    /**
     * 别名。书籍容器用它装带副标题的全名——文件名只能用主书名（副标题太长做不了文件名），
     * 而搜索与双链要认得出全名，别名正是 Obsidian 为这件事准备的字段。
     */
    readonly aliases?: readonly string[];
    /**
     * 标签。只有书籍容器带它——书的分类不是个人习惯，是豆瓣几万人投出来的公共坐标，
     * 机器查得到就不该让人填。项目与领域仍留空：那两类的分类确实只有本人知道。
     * 落盘写成列表（`tags` 在库级属性表里登记的就是 tags 类型），且**不带井号**——
     * 井号是正文里的写法，属性里写的是标签本身，写进去会变成标签名的一部分。
     */
    readonly tags?: readonly string[];
    /** 出处链接。书籍容器写豆瓣条目地址，字段名沿用全库统一的 source */
    readonly source?: string;
    /**
     * 书目字段，只有书籍容器带。
     *
     * v0.14.0 从正文的「书籍信息」小节搬进 YAML：那一节是一张给人读的登记表，
     * 而这些值机器读得更多——按出版年排、按页数挑、按出版社筛，都得是属性才做得到；
     * 摆在正文里它们只是五行谁也不会去读第二遍的字。
     * 搬家时刻意丢掉了三样：ISBN 已经是 UID、豆瓣链接已经是 source、
     * 豆瓣评分不写（`rating` 是**学员自己**打的分，两个评分挤一个字段是在制造误读）。
     */
    readonly bibliography?: Bibliography;
    /** 与某个人的关系；自己独做的项目不带这一项，空键是登记表不是索引 */
    readonly relation?: ProjectRelation;
}

/**
 * 书目字段。空值整行不写——空的 publisher 键是登记表不是索引，与 author 同一条纪律。
 *
 * publishDate 落成文本而不是日期：豆瓣给的是「2018-9-1」也可能是「2021-7」，
 * 后者根本不是一个完整日期，登记成 date 类型会让属性面板整列解析失败。
 */
export interface Bibliography {
    readonly translators?: readonly string[];
    readonly publisher?: string;
    readonly publishDate?: string;
    readonly pages?: string;
    readonly cover?: string;
}

/**
 * 正文里的一个小节：标题，以及可选的现成正文。
 *
 * body 是书籍容器带来的：书目信息（出版社、ISBN、评分）在建书那一刻就已经取回来了，
 * 让它落在「书籍信息」小节里，学员打开就能看见，而不是留一个空标题等他自己抄。
 */
export interface ContainerSection {
    readonly heading: string;
    readonly body?: string;
}

/** MOC 正文的全部可变量：身份 YAML 与可选的正文小节 */
export interface MocContentOptions extends MocFrontmatterOptions {
    /**
     * 正文小节骨架，排在写字位之后、base 块之前。
     * 只有书籍容器带它（当前是「全部划线」落点）；项目与领域不带，产出与 V2 逐字相同。
     */
    readonly sections?: readonly ContainerSection[];
}

/**
 * 项目与人的关联：写哪个键、指向谁。
 *
 * 两个键分家的理由不是分类癖：client 是商业契约标记，写下它等于把那个人注册成客户，
 * 客户名录直接用它反推身份。所以「周六和张三去旅游」这类私人项目必须走 with，
 * 否则朋友会被无声注册成客户、项目会挂进「我还欠谁的交付」、结案后污染案例库的选题统计。
 */
export interface ProjectRelation {
    /** FIELDS.client 或 FIELDS.with */
    readonly field: string;
    /** 目标笔记的全路径与显示别名，落盘写成整值 wikilink，避免跨目录同名歧义 */
    readonly target: string;
}

/**
 * 把文本转换为 YAML 兼容的双引号字符串。
 * 自脚本一 toYamlString 原样移植：借 JSON.stringify 完成转义，中文与冒号都能安全落盘。
 */
function toYamlString(value: string): string {
    return JSON.stringify(String(value));
}

/**
 * 生成 MOC 的 YAML frontmatter。
 * aliases 与 updated 刻意留空：前者由用户自取，后者交给自动维护。
 * tags 从前也在这一列（分类是个人习惯），v0.14.0 起书籍是例外——
 * 书的分类不是个人习惯，是豆瓣几万人投出来的公共坐标，机器查得到就不该让人填；
 * 项目与领域仍留空，那两类的分类确实只有本人知道。
 */
export function mocFrontmatter(options: MocFrontmatterOptions): string {
    const {
        description,
        created,
        uid,
        type,
        status,
        author,
        aliases,
        tags,
        source,
        bibliography,
        relation,
    } = options;

    return [
        '---',
        // 别名是列表类型（types.json 登记为 aliases），有值就逐条写成列表项
        ...(aliases?.length
            ? ['aliases:', ...aliases.map((alias) => `  - ${toYamlString(alias)}`)]
            : ['aliases:']),
        `description: ${toYamlString(description)}`,
        `created: ${created}`,
        'updated:',
        // 书籍带着豆瓣的分类词进来，其余容器仍留一个空键等主人自己填
        ...(tags?.length ? ['tags:', ...tags.map((tag) => `  - ${toYamlString(tag)}`)] : ['tags:']),
        `UID: ${uid}`,
        `type: ${type}`,
        // 领域没有状态，那一行整行不写；空的 status 键会让它出现在「正在进行中」那张表里
        ...(status ? [`status: ${status}`] : []),
        // 只有书籍容器带作者，且学员跳过作者一问时整行不写——空键是登记表不是索引。
        // 写成单元素列表是因为 author 在 types.json 里是 multitext，理由见 MocFrontmatterOptions
        ...(author ? ['author:', `  - ${toYamlString(author)}`] : []),
        // 出处：书籍写豆瓣条目地址。它是 text 类型，直接写裸链接，Obsidian 会渲染成可点的
        ...(source ? [`source: ${source}`] : []),
        ...bibliographyLines(bibliography),
        // 只在有值时才写这一行：空的 client 键会让这个项目被当成一笔没有客户的委托
        ...(relation ? [`${relation.field}: "[[${relation.target}]]"`] : []),
        '---',
    ].join('\n');
}

/**
 * 书目那几行。全部可缺省，缺的整行不写。
 * translator 写成列表（一本书可以有好几位译者），与 author 同形同因：
 * 属性类型是全库共享的一张表，同一个字段一处标量一处列表就与其余笔记不同构了。
 */
function bibliographyLines(bibliography?: Bibliography): string[] {
    if (!bibliography) return [];

    const { translators, publisher, publishDate, pages, cover } = bibliography;

    return [
        ...(translators?.length
            ? ['translator:', ...translators.map((name) => `  - ${toYamlString(name)}`)]
            : []),
        ...(publisher ? [`publisher: ${toYamlString(publisher)}`] : []),
        ...(publishDate ? [`published: ${toYamlString(publishDate)}`] : []),
        ...(pages ? [`pages: ${pages}`] : []),
        ...(cover ? [`cover: ${cover}`] : []),
    ];
}

/**
 * 生成全部 MOC 共用的 base 代码块。
 * this.file 在内联 base 中恒指宿主 MOC：文件夹移动只改变实时结果，不再改写查询本身。
 * 「项目文件」优先呈现直属笔记与 up 归属；「附件」递归收非 Markdown；
 * 「全部」才把容器整棵子树铺开，三个视角不互相冒充。
 */
export function mocBaseBlock(): string {
    return [
        '```base',
        'filters:',
        '  and:',
        '    - file.path != this.file.path',
        `    - '!file.inFolder("90-system")'`,
        'properties:',
        '  note.description:',
        '    displayName: 概述',
        '  note.rating:',
        '    displayName: 评分',
        'views:',
        '  - type: table',
        '    name: 项目文件',
        '    filters:',
        '      or:',
        '        - up.contains(this.file.asLink())',
        '        - file.folder == this.file.folder',
        '    order:',
        '      - file.name',
        '      - description',
        '      - rating',
        '    sort:',
        '      - property: rating',
        '        direction: DESC',
        '    columnSize:',
        '      file.name: 170',
        '      note.description: 421',
        '  - type: table',
        '    name: 附件',
        '    filters:',
        '      and:',
        '        - file.inFolder(this.file.folder)',
        '        - file.ext != "md"',
        '    order:',
        '      - file.name',
        '      - file.ext',
        '      - file.mtime',
        '    sort:',
        '      - property: file.mtime',
        '        direction: DESC',
        '  - type: table',
        '    name: 全部',
        '    filters:',
        '      or:',
        '        - up.contains(this.file.asLink())',
        '        - file.inFolder(this.file.folder)',
        '    order:',
        '      - file.name',
        '      - file.ext',
        '      - description',
        '      - file.mtime',
        '    sort:',
        '      - property: file.mtime',
        '        direction: DESC',
        '',
        '```',
    ].join('\n');
}

/**
 * 拼出一篇完整 MOC 的正文。
 * 四个换行符使 YAML 与正文之间保留三个完整空行——这三行是留给用户写字的地方，
 * 建项目后光标正落在其中，脚本一的这条约定被完整保留。
 * 书籍容器多一段小节骨架，排在写字位之后、base 块之前：
 * 划线是原始数据、卡片表是汇总，数据在上汇总在下，与 insertIntoSection 守同一条阅读顺序。
 */
export function mocContent(options: MocContentOptions): string {
    const frontmatter = mocFrontmatter(options);
    const baseBlock = mocBaseBlock();
    const sectionBlock = (options.sections ?? [])
        .map((section) => (section.body ? `${section.heading}\n\n${section.body}\n\n` : `${section.heading}\n\n`))
        .join('');

    return `${frontmatter}\n\n\n\n${sectionBlock}${baseBlock}\n`;
}

// ============================================================
// 供「模板」核心插件手动插入的空模板
// ============================================================

/**
 * 按给定字段序生成全空值的 YAML 骨架。
 * 空模板的意义是"字段齐、值空"：用户手动插入后照着填，插件后续再补齐也不会打乱顺序。
 */
function emptyFrontmatter(fields: readonly string[]): string {
    return ['---', ...fields.map((field) => `${field}:`), '---', ''].join('\n');
}

/** 卡片笔记模板：十字段严格按 CARD_FIELDS 序，与自动登记后的排列完全一致 */
export function cardTemplateFile(): string {
    return emptyFrontmatter(CARD_FIELDS);
}

/** MOC 模板：八字段 + 与自动建容器完全同源的数据库块 */
export function mocTemplateFile(): string {
    return `${emptyFrontmatter(MOC_FIELDS)}\n\n${mocBaseBlock()}\n`;
}

// ============================================================
// 导航页
// ============================================================

/**
 * 生成 90-system/导航.md 的全文：一行说明 + 一个 base 块。
 * 导航页自身不写 frontmatter，因此不会被任何一个视图筛中，也不会被 updated 维护碰到——
 * 它是库的地图，不是库的一份笔记。
 * 作者名片不在这里（v0.10.0 起）：导航是学员每天办事的工位，名片住在 README——
 * 那是介绍这套系统的文档，作者署名在文档里才是署名，在工位上是打扰。
 */
export function navContent(): string {
    const lines: string[] = [
        NAV_INTRO,
        '',
        '```base',
        'filters:',
        '  and:',
        `    - '!file.inFolder("90-system")'`,
        'formulas:',
        '  status_icon: if(status == "active", "🟢 进行中", if(status == "paused", "🟡 搁置", if(status == "done", "✅ 完成", if(status == "dropped", "⚫️ 弃", if(status.isEmpty(), "", "⚠️ " + status)))))',
        'properties:',
        '  note.description:',
        '    displayName: 概述',
        '  note.status:',
        '    displayName: 状态',
        '  formula.status_icon:',
        '    displayName: 状态',
        'views:',
    ];

    for (const view of NAV_VIEWS) {
        lines.push(
            '  - type: table',
            `    name: ${view.name}`,
            '    filters:',
            '      and:',
            `        - ${view.filter}`,
            '    order:',
            ...view.columns.map((column) => `      - ${column}`),
        );
    }

    lines.push('', '```', '');

    return lines.join('\n');
}
