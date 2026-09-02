/**
 * [INPUT]: 无。本文件不 import 任何模块，是 core 层依赖图的最底层叶子
 * [OUTPUT]: 对外提供 PARA 目录常量 FOLDERS/INIT_FOLDERS/CONTACT_FOLDER/CLIENT_FOLDER、
 *           笔记路径常量 NAV_FILE/TEMPLATE_FILES/CONTACT_MOC/CLIENT_MOC、
 *           卡片字段序 CARD_FIELDS 与其字段类型 CardField、统一字段名 FIELDS 与身份取值 NOTE_TYPES、
 *           时间格式 DEFAULT_DATETIME_FORMAT/UID_FORMAT/DAY_FORMAT、
 *           灵感收集默认值 INSPIRATION_DEFAULTS/LEGACY_INSPIRATION_FORMATS 与插入位置，
 *           自写抑制窗口 SELF_WRITE_WINDOW_MS，项目生命周期状态机 TRANSITIONS/STATUS_LABELS
 *           及其类型 ProjectStatus/TransitionAction/FolderRole/ProjectTransition，
 *           五级复盘周期表 PERIODS 及其类型 PeriodKey/PeriodDefinition，
 *           人脉三轴 CONTACT_TIERS/TIER_LIMITS/CONTACT_DIRECTIONS、人情账本格式 LEDGER、
 *           付费流水字段 PAYMENT_FIELDS，读书笔记契约 BOOK_HEADINGS/BOOK_CHAPTER_PREFIX/
 *           BOOK_THOUGHT_PREFIX 与标签契约 BOOK_TAG_COUNTS/BOOK_TAG_DEFAULTS，外观开关契约 SNIPPET_FOLDER_NAME/SNIPPET_EXTENSION/
 *           APPEARANCE_FILE_NAME/ENABLED_SNIPPETS_KEY，
 *           文件夹计数契约 FOLDER_COUNT_TARGETS/FOLDER_COUNT_DEFAULTS 及其类型 FolderCountTarget，
 *           最近文件契约 RECENT_FILES_FILE/RECENT_FILES_KEEP/RECENT_FILES_LIMITS/
 *           RECENT_FILES_SORTS/RECENT_FILES_DEFAULTS 及其类型 RecentFilesSort，
 *           光标记忆契约 CURSOR_STATE_FILE/CURSOR_MEMORY_LIMIT，
 *           视图代码块契约 VIEW_BLOCK_LANG/VIEW_REFRESH_DEBOUNCE_MS，
 *           以及第二版三库系统的赛博永生契约 EXPORT_MANIFEST_FILE/EXPORT_MANIFEST_HEADING/
 *           EXPORT_MANIFEST_SEPARATOR 与 ETERNAL_FOLDERS/ETERNAL_INDEX_FILE/ETERNAL_LOG_FILE/
 *           ETERNAL_LOG_INGEST_MARKS。
 *           三十条命令的身份（id/名字/图标/分组）不在这里，在 ./commands——
 *           本文件回答「系统里有哪些东西」，那里回答「用户能让系统做哪些事」
 * [POS]: 全仓库唯一的常量源。规格要求「禁魔法字符串」，任何目录名、字段名、状态名、时间格式
 *        都必须从这里取而不得就地硬编码；因为它零依赖，所有模块都可单向依赖它而不产生环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// PARA 目录骨架
// ============================================================

/**
 * 笔记库的七个根文件夹与模板目录，值是相对于库根的路径。
 *
 * 前六个是 PARA 骨架，回答「这东西属于谁」；diary 是 V2 新增的第七个，回答「这事什么时候发生」。
 * 两种坐标轴不塞进同一格：复盘是时间轴，它在 PARA 的四个象限里都找不到自己的位置。
 */
export const FOLDERS = {
    inbox: '00-inbox',
    projects: '01-projects',
    areas: '02-areas',
    resources: '03-resources',
    archives: '04-archives',
    diary: '05-diary',
    system: '90-system',
    template: '90-system/Template',
} as const;

/**
 * 开荒时由骨架本身保证存在的目录：六个 PARA 根目录 + 模板子目录（父目录先于子目录）。
 *
 * 这里刻意不含 05-diary 与 02-areas/人脉——它们由复盘与人脉模块各自的开荒贡献带来。
 * 「第七个根文件夹存在，是因为复盘模块存在」这件事必须在代码里也成立，
 * 否则删掉一个模块，库里会留下一个永远空着的目录。
 */
export const INIT_FOLDERS: readonly string[] = [
    FOLDERS.inbox,
    FOLDERS.projects,
    FOLDERS.areas,
    FOLDERS.resources,
    FOLDERS.archives,
    FOLDERS.system,
    FOLDERS.template,
];

/** 人脉档案的家：平铺存放，不建子目录（分组靠 up 归属链接，不靠文件夹） */
export const CONTACT_FOLDER = `${FOLDERS.areas}/人脉`;

/** 客户档案的家；它不进开荒骨架，由「初始化客户模块」命令按需长出 */
export const CLIENT_FOLDER = `${FOLDERS.areas}/客户`;

// ============================================================
// 系统笔记路径
// ============================================================

/** 导航笔记：库的总入口，开荒时生成 */
export const NAV_FILE = `${FOLDERS.system}/导航.md`;

/**
 * 随库交付的 README，住在库根。
 * 开荒完成后第一个打开的是它而不是导航——它的头部是作者名片，正文是整套系统的说明书；
 * 学员日常的入口仍是导航，README 只在这种「刚开完荒」的时刻被主动送到眼前。
 */
export const README_FILE = 'README.md';

/**
 * 属性类型示例笔记：全部属性各出现一次，每个都带一个正确格式的样例值。
 *
 * 它解决的是一个很具体的麻烦：模板里的空字段在属性面板里一律显示成「文本」，
 * 学员看到 created 是文本、UID 是文本，只能一个个手动改类型。
 * 真正的权威是 `.obsidian/types.json`（随库交付，Obsidian 读它决定每个属性的控件），
 * 本笔记是给人看的那一份——它同时充当活文档：想知道某个属性该怎么填，打开它照抄。
 * 它住在 90-system 且 type 取一个不在封闭枚举内的值，因此不会混进任何一个视图。
 */
export const SCHEMA_NOTE = `${FOLDERS.system}/属性类型示例.md`;

/** 供「模板」核心插件手动插入的模板文件 */
export const TEMPLATE_FILES = {
    moc: `${FOLDERS.template}/MOC 模板.md`,
    card: `${FOLDERS.template}/卡片笔记模板.md`,
    person: `${FOLDERS.template}/人脉模板.md`,
    client: `${FOLDERS.template}/客户模板.md`,
} as const;

/** 人脉领域总控台，也是新建档案时 up 的默认指向 */
export const CONTACT_MOC = `${CONTACT_FOLDER}/人脉MOC.md`;

/** 客户领域总控台，随客户模块一起长出 */
export const CLIENT_MOC = `${CLIENT_FOLDER}/客户MOC.md`;

// ============================================================
// 灵感收集
// ============================================================

/** 灵感可以落在标题区或整篇正文的头尾；值会持久化到插件设置，禁止随意改名 */
export const INSPIRATION_INSERT_POSITIONS = [
    'heading-top',
    'heading-bottom',
    'file-top',
    'file-bottom',
] as const;

/** 灵感插入位置，由可持久化值直接推导，设置页与写入模块共用 */
export type InspirationInsertPosition = (typeof INSPIRATION_INSERT_POSITIONS)[number];

/** 全新库的灵感收集默认值；老库升级时由 DEFAULT_SETTINGS 自动补齐 */
export const INSPIRATION_DEFAULTS = {
    folder: FOLDERS.inbox,
    fileName: '灵感集.md',
    heading: '# 灵感集',
    insertPosition: 'heading-top' as InspirationInsertPosition,
    format: '- [ ] {{content}} [[{{date}}]] {{time}}',
} as const;

/**
 * 曾经当过默认值、如今要被换掉的单条格式。
 * `- [ ]` 后面那两个空格从来不是谁的选择，是默认值自带的笔误；老库的 data.json 里
 * 躺着它的副本，只改上面那行救不了已经装过的人。normalizeSettings 按**字节相等**
 * 认出它并换成当前默认值——自己改过格式的人一个字不动，因为改过的不等于任何一条旧默认。
 */
export const LEGACY_INSPIRATION_FORMATS: readonly string[] = [
    '- [ ]  {{content}} [[{{date}}]] {{time}}',
];

// ============================================================
// 卡片 YAML 字段
// ============================================================

/**
 * 卡片笔记的十个标准字段，数组顺序即 YAML 中的呈现顺序。
 * 重排 frontmatter 与生成卡片模板都以此为准，两处共用同一份定义。
 */
export const CARD_FIELDS = [
    'aliases',
    'description',
    'created',
    'updated',
    'tags',
    'UID',
    'rating',
    'author',
    'source',
    'up',
] as const;

/** 卡片标准字段名的联合类型，由 CARD_FIELDS 推导，增删字段无需同步维护类型 */
export type CardField = (typeof CARD_FIELDS)[number];

// ============================================================
// 时间格式
// ============================================================

/** created / updated 字段的默认时间格式（moment 语法） */
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * UID 字段的 14 位本地时间格式（moment 语法）。
 *
 * 必须是 14 位而不是带毫秒的 17 位：UID 在属性面板里登记为**数字**类型，
 * 而 JavaScript 的安全整数上限是 9007199254740991（16 位）。
 * 17 位数值一旦不加引号就会被静默四舍五入——20260812084155123 落盘成 20260812084155120，
 * 既不报错，值又变了，且此后每次读写都在错误的值上继续。
 * 代价是同一秒内建的两篇笔记会撞号；命令都是人触发的，一秒一篇是现实上限，
 * 这个代价远小于「主键会悄悄改数」。
 */
export const UID_FORMAT = 'YYYYMMDDHHmmss';

// ============================================================
// 自写抑制
// ============================================================

/**
 * 自写抑制窗口（毫秒）。插件写盘后的这段时间内，
 * 由该次写入引发的 vault 事件视为插件自己造成，不再触发自动化，避免自激循环。
 */
export const SELF_WRITE_WINDOW_MS = 3000;

// ============================================================
// 项目生命周期状态机（自 move-project.js 移植）
// ============================================================

/** 项目 MOC 的 status 四态 */
export type ProjectStatus = 'active' | 'paused' | 'done' | 'dropped';

/** 四条流转命令对应的动作名 */
export type TransitionAction = 'done' | 'dropped' | 'paused' | 'active';

/** 目录角色：项目目录（进行中）或归档目录 */
export type FolderRole = 'active' | 'archive';

/** 一次状态流转的完整描述：从哪个目录搬到哪个目录、写入什么状态、允许从哪些状态出发 */
export interface ProjectTransition {
    /** 中文动作名，用于确认框与 Notice 文案 */
    readonly label: string;
    /** 源目录角色 */
    readonly source: FolderRole;
    /** 目标目录角色 */
    readonly target: FolderRole;
    /** 流转后写入 MOC 的 status */
    readonly status: ProjectStatus;
    /** 允许执行本次流转的当前状态；用 string[] 是为了直接与 YAML 里的任意文本比较 */
    readonly allowedStatuses: readonly string[];
}

/**
 * 四条流转规则。done/dropped/paused 都是「项目目录 → 归档目录」，
 * 只有 active 是反向的「归档目录 → 项目目录」，因此重新开始只允许从三个终态出发。
 */
export const TRANSITIONS: Readonly<Record<TransitionAction, ProjectTransition>> = {
    done: {
        label: '完成',
        source: 'active',
        target: 'archive',
        status: 'done',
        allowedStatuses: ['active'],
    },
    dropped: {
        label: '放弃',
        source: 'active',
        target: 'archive',
        status: 'dropped',
        allowedStatuses: ['active'],
    },
    paused: {
        label: '暂停',
        source: 'active',
        target: 'archive',
        status: 'paused',
        allowedStatuses: ['active'],
    },
    active: {
        label: '重新开始',
        source: 'archive',
        target: 'active',
        status: 'active',
        allowedStatuses: ['done', 'dropped', 'paused'],
    },
};

/**
 * 状态的中文显示名。索引签名用 string 而非 ProjectStatus，
 * 因为查询来源是用户 YAML 里的任意文本，未知状态需要能安全地兜底。
 */
export const STATUS_LABELS: Readonly<Record<string, string>> = {
    active: '进行中',
    paused: '已暂停',
    done: '已完成',
    dropped: '已放弃',
};

// ============================================================
// 全库统一字段名与身份取值
// ============================================================

/**
 * frontmatter 字段名的唯一出处。
 *
 * 视图靠字段认事实，命令靠字段写事实，两边写错一个字母就静默失联——
 * 而 YAML 里的空字段查不出来也报不了错，是最难发现的一类 bug。因此全部收敛在此。
 */
export const FIELDS = {
    aliases: 'aliases',
    description: 'description',
    created: 'created',
    updated: 'updated',
    tags: 'tags',
    uid: 'UID',
    type: 'type',
    status: 'status',
    up: 'up',
    /** 归档时刻。由状态流转命令与 status 同一次写入，是「本月完成了什么」唯一可信的时间事实 */
    archived: 'archived',
    /** 项目→人的商业契约标记：写下它等于宣告「我欠这个人一个交付」 */
    client: 'client',
    /** 项目→人的同行标记：一起做的，无交付债务 */
    with: 'with',
    tier: 'tier',
    direction: 'direction',
    gift: 'gift',
    address: 'address',
    get: 'get',
    birthday: 'birthday',
    source: 'source',
    author: 'author',
    rating: 'rating',
    contact: 'contact',
    homepage: 'homepage',
    /** 复盘主题：主题链的唯一入口，五级各写一句 */
    theme: 'theme',
    /** 复盘周期锚点，YYYY-MM-DD 定宽字符串；日记没有此字段，它的锚点是文件名 */
    periodStart: 'period_start',
} as const;

/**
 * type 字段的封闭枚举。
 *
 * 全部视图靠它认身份，与文件夹无关——学员重命名目录、换分层、用英文目录名，视图一个都不用改。
 * 唯一保留的位置依赖是归档目录：「不再往来的人」身份没变，变的是不再经营，只能用位置表达。
 */
export const NOTE_TYPES = {
    project: 'project',
    area: 'area',
    /** 读书笔记：一本书就是一个项目，住项目目录，读完走「完成项目」归档 */
    book: 'book',
    /** 人脉档案：认识的人，有生日有脾气有人情往来 */
    person: 'person',
    /** 付费用户：陌生人买你的东西，你只知道渠道与联系方式，是与 person 并列的独立物种 */
    client: 'client',
    diary: 'diary',
    weekly: 'weekly',
    monthly: 'monthly',
    quarterly: 'quarterly',
    yearly: 'yearly',
} as const;

/**
 * 住在项目目录里、共用同一台生命周期状态机的两类容器。
 *
 * 一本书就是一个项目：它有终点（读完），因此走同一条「完成项目」归档。
 * 收成一份常量而不是各处写 `=== 'project'`，是因为消费方不止一个，
 * 而漏掉一处的表现是**静默的**——状态流转那边漏掉，书就按不了「完成项目」（还会给出
 * 一句说它不是项目的拒绝，用户至少看得见）；复盘的「项目动态」那边漏掉更糟：
 * 它按目录扫、按 type 认 MOC，认不出就把这本书的文件夹当成「有改动却没有 MOC 的孤儿」
 * 点名报警——于是学员每读一本书，周复盘里就多一条他看不懂的假警报。
 */
export const CONTAINER_TYPES: readonly string[] = [NOTE_TYPES.project, NOTE_TYPES.book];

/**
 * MOC 笔记的文件名前缀。
 *
 * 一个项目是「一个文件夹 + 一篇 MOC」，而 V3 之前那篇 MOC 与文件夹同名，
 * 于是文件树里父子两级写着同一个词，学员分不出哪一篇是总览、哪一篇是普通卡片。
 * 加个前缀，它在任何按名字排序的地方都浮到最上面，也一眼认得出。
 * 存量笔记不改名——读取侧靠 modules/projects/moc 的 resolveMocPath 两种命名都认。
 */
export const MOC_PREFIX = 'MOC-';

/** 全库一切区间比较的落地格式：定宽，字典序即时间序，零日期算术、零跨类型陷阱 */
export const DAY_FORMAT = 'YYYY-MM-DD';

// ============================================================
// 五级复盘周期表
// ============================================================

/** 五级复盘的档位标识；同时是 DIARY 子目录与 PERIODS 表的键 */
export type PeriodKey = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * 一级复盘的完整描述。
 * 只放格式串不放日期算术：本文件零 import，moment 属于 core/time 的地界。
 */
export interface PeriodDefinition {
    readonly key: PeriodKey;
    /** 写入 frontmatter 的 type 值 */
    readonly type: string;
    /** 中文名，用于正文标题与提示文案 */
    readonly label: string;
    /** 所在子目录 */
    readonly folder: string;
    /** 文件名即标题的 moment 格式 */
    readonly titleFormat: string;
    /** moment startOf 的单位，用于算周期锚点 */
    readonly startOfUnit: 'day' | 'isoWeek' | 'month' | 'quarter' | 'year';
    /** moment add/subtract 的单位，用于算上一篇与下一篇 */
    readonly stepUnit: 'day' | 'week' | 'month' | 'quarter' | 'year';
    /** 上一级周期；年记没有上级 */
    readonly parent: PeriodKey | null;
    /** 导航行里指向上级的链接别名 */
    readonly parentAlias: string;
}

/**
 * 五级复盘表。
 *
 * 日记刻意没有 period_start：它的文件名就是日期，多写一个字段等于给同一件事两个事实源。
 * 周归属月一律按 ISO 惯例（周四落在哪个月算哪个月），每周只归一个月，不重不漏。
 */
export const PERIODS: Readonly<Record<PeriodKey, PeriodDefinition>> = {
    daily: {
        key: 'daily',
        type: NOTE_TYPES.diary,
        label: '日记',
        folder: `${FOLDERS.diary}/01-daily`,
        titleFormat: DAY_FORMAT,
        startOfUnit: 'day',
        stepUnit: 'day',
        parent: 'weekly',
        parentAlias: '本周',
    },
    weekly: {
        key: 'weekly',
        type: NOTE_TYPES.weekly,
        label: '周记',
        folder: `${FOLDERS.diary}/02-weekly`,
        // GGGG 是 ISO 周所属年，与 WW 配对才不会在跨年周上错位
        titleFormat: 'GGGG-[W]WW',
        startOfUnit: 'isoWeek',
        stepUnit: 'week',
        parent: 'monthly',
        parentAlias: '本月',
    },
    monthly: {
        key: 'monthly',
        type: NOTE_TYPES.monthly,
        label: '月记',
        folder: `${FOLDERS.diary}/03-monthly`,
        titleFormat: 'YYYY-MM',
        startOfUnit: 'month',
        stepUnit: 'month',
        parent: 'quarterly',
        parentAlias: '本季',
    },
    quarterly: {
        key: 'quarterly',
        type: NOTE_TYPES.quarterly,
        label: '季记',
        folder: `${FOLDERS.diary}/04-quarterly`,
        titleFormat: 'YYYY-[Q]Q',
        startOfUnit: 'quarter',
        stepUnit: 'quarter',
        parent: 'yearly',
        parentAlias: '本年',
    },
    yearly: {
        key: 'yearly',
        type: NOTE_TYPES.yearly,
        label: '年记',
        folder: `${FOLDERS.diary}/05-yearly`,
        titleFormat: 'YYYY',
        startOfUnit: 'year',
        stepUnit: 'year',
        parent: null,
        parentAlias: '',
    },
};

/** 按 PERIODS 派生的五个子目录，开荒时由复盘模块贡献（父目录先于子目录） */
export const DIARY_FOLDERS: readonly string[] = [
    FOLDERS.diary,
    PERIODS.daily.folder,
    PERIODS.weekly.folder,
    PERIODS.monthly.folder,
    PERIODS.quarterly.folder,
    PERIODS.yearly.folder,
];

/**
 * 日记里那个「今天做了什么」小节的标题。
 *
 * 它是复盘模板与人脉记账之间唯一的书面约定：模板按这个标题生成小节，
 * 记人情命令把账本行追加到这个小节末尾。约定放在常量里而不是各写一遍，
 * 是因为一旦两边不一致，账本行会落到文件末尾（今日产出视图之后），
 * 既难看又让人以为命令坏了——而这种不一致没有任何报错。
 */
export const DIARY_LOG_HEADING = '## 今天做了什么';

// ============================================================
// 人脉三轴与人情账本
// ============================================================

/** 联系节奏分层，数组顺序即名录里的排序优先级 */
export const CONTACT_TIERS = ['密', '近', '熟', '远'] as const;

/** 分层的联系节奏上限（天）。超出即在名录里标 ⚠️，那是该主动找他的信号 */
export const TIER_LIMITS: Readonly<Record<string, number>> = {
    密: 7,
    近: 30,
    熟: 90,
    远: 365,
};

/** 分层缺失或写了未知值时的兜底节奏，取最宽松的一档 */
export const TIER_FALLBACK_LIMIT = 365;

/** 关系位势：这段关系往哪个方向使劲 */
export const CONTACT_DIRECTIONS = ['向上', '平行', '向下'] as const;

/**
 * 人情账本行的格式约定：`- [[人名]]｜去｜事项｜状态`。
 *
 * 分隔符用全角｜而非半角，因为半角 | 在 Markdown 表格里有语法含义，
 * 学员把账本行粘进表格时会炸；事项内出现的全角｜由记账命令清洗成半角，防止段错位。
 */
export const LEDGER = {
    separator: '｜',
    /** 第二段必须是它们之一，否则这行不是账本行 */
    kinds: ['去', '来'] as const,
    /** 第四段的合法取值；写了别的以 ⚠️ 前缀暴露，不静默吞掉 */
    statuses: ['两清', '我欠', '他欠'] as const,
    /** 第四段省略即两清——两清是最常见的情形，让最常见的写法最短 */
    defaultStatus: '两清',
} as const;

/**
 * 付费流水的行内字段名，一律中文。
 *
 * 含大写字母的键会被 Dataview 额外补一份小写规范名，遍历求和把钱算两遍；
 * 学员的库里可能同时装着 Dataview，两边看到的必须是同一笔账，故格式按原样交付。
 */
export const PAYMENT_FIELDS = {
    product: '产品',
    amount: '金额',
    date: '日期',
} as const;

/** 付费流水在客户档案里的落点 */
export const CLIENT_PAYMENT_HEADING = '## 付费与交付';

/** 收款流水在客户项目 MOC 里的落点 */
export const PROJECT_PAYMENT_HEADING = '## 收款';

// ============================================================
// 读书笔记
// ============================================================

/**
 * 书籍 MOC 的两个固定小节标题。
 *
 * 它们是三方之间的书面约定：建书命令按它们生成小节骨架，
 * 导入命令把划线合并进「全部划线」，豆瓣插件或学员的手抄落在「书籍信息」。
 * 约定收在常量里而不是各写一遍，理由与 DIARY_LOG_HEADING 相同——
 * 两边一旦不一致，划线会落到文件末尾，而这种不一致没有任何报错。
 */
export const BOOK_HEADINGS = {
    highlights: '## 全部划线',
} as const;

/**
 * 「全部划线」小节内的行形态约定：章节是三级标题，划线是顶层列表行，
 * 想法缩进一层并带 💭 前缀。它同时是导入命令的写入格式与去重判据的读取格式，
 * 两个用途必须同源——写入认一种形态、去重认另一种的话，同一条划线每次导入都是「新的」。
 */
export const BOOK_CHAPTER_PREFIX = '### ';

/**
 * 想法行的前缀。**只用于读旧笔记**（v0.14.0 之前那种缩进列表形态）。
 * 新写入一律走标注块，见 BOOK_CALLOUTS。
 */
export const BOOK_THOUGHT_PREFIX = '💭 ';

/**
 * 划线与想法各自的标注块类型（v0.14.0 起的写入形态）。
 *
 * 换掉缩进列表的理由只有一条，是学员看着自己的笔记说的：
 * 「并不能清晰地显示划线和我写的内容」。原先两者都是 bullet，只差一层缩进与一个表情——
 * 三五条排下来，书的声音和人的声音糊成同一串灰字，而**这两种字的价值完全不同**：
 * 划线是书的，想法才是他的。标注块给它们各自的边框与颜色，一眼分得出谁在说话。
 *
 * 取 quote / note 这两个内建类型而不自造名字：Obsidian 与 Minimal 都为它们备了配色与图标，
 * 自造的类型在没装对应片段的库里会退化成灰框，而这套系统承诺换主题不必改笔记。
 * 想法嵌在划线块里（前面多一层 `> `），因为想法是**对着某一句写的**——
 * 平列会让它变成一条与上下文无关的独白。
 */
export const BOOK_CALLOUTS = {
    highlight: '> [!quote]',
    thought: '> [!note]',
} as const;

/**
 * 一本书写几个标签的候选值。0 即不写——有人只要书目不要分类，那是正当选择。
 *
 * 它住在常量里而不是设置页里，理由与 INSPIRATION_INSERT_POSITIONS 同一条：
 * 这份清单同时是**设置页的下拉选项**与**读取侧的合法性判据**，
 * 两处各写一份的话，手改 data.json 写进来的怪数会在一边被拍平、在另一边照单全收，
 * 于是下拉框显示「前 5 个」而笔记里落进四十条——这种分叉不报错。
 */
export const BOOK_TAG_COUNTS: readonly number[] = [0, 3, 5, 8];

/** 全新库的读书标签默认值；老库升级时由 DEFAULT_SETTINGS 自动补齐，也是读取侧的回落值 */
export const BOOK_TAG_DEFAULTS = {
    prefix: '书籍',
    count: 5,
} as const;

// ============================================================
// 外观：CSS 片段开关
// ============================================================

/**
 * CSS 片段目录名，相对于 `.obsidian` 配置目录。
 * 拼路径时一律用 `app.vault.configDir` 打头而不写死 `.obsidian`——
 * 配置目录是可以被改名的，写死会让改过名的库里一个片段都读不到。
 */
export const SNIPPET_FOLDER_NAME = 'snippets';

/**
 * 片段文件扩展名。
 *
 * 必须小写：Obsidian 的片段加载器按小写后缀筛文件，一个名叫 `x.CSS` 的片段
 * 在它眼里根本不存在——既不加载也不报错。外观开关沿用同一条判据，
 * 于是开关里看到的清单与「设置 → 外观」里看到的永远是同一份。
 */
export const SNIPPET_EXTENSION = '.css';

/** 外观配置文件名，相对于 `.obsidian` 配置目录 */
export const APPEARANCE_FILE_NAME = 'appearance.json';

/** appearance.json 中登记已启用片段的键；值是不含扩展名的文件基名数组 */
export const ENABLED_SNIPPETS_KEY = 'enabledCssSnippets';

// ============================================================
// 文件浏览器：文件夹计数
// ============================================================

/**
 * 文件夹右侧那个数字数的是什么。
 *
 * 三个取值就是学员看着文件浏览器时会问的三个问题：这里面有多少篇笔记、
 * 我有几个项目（也就是几个子文件夹）、这个文件夹一共装了多少东西。
 * 三者刻意都收成**一个**数字：侧边栏宽度以像素计，两个数并排会把文件夹名挤成省略号，
 * 而完整的三项拆分改由数字自己的悬停提示给出——常驻的那一个安静，问一句才把话说全。
 *
 * 「全部条目」把附件也算进去，是因为它承诺的是「一共」；
 * 少算图片的「一共」是句假话，而假话不会报错。
 */
export const FOLDER_COUNT_TARGETS = ['notes', 'folders', 'all'] as const;

/** 计数口径的联合类型，供设置页与读取侧共用；写错一个字母在编译期倒下 */
export type FolderCountTarget = (typeof FOLDER_COUNT_TARGETS)[number];

/**
 * 全新库的计数默认值，也是读取侧的回落值。
 *
 * 默认数笔记且**含子文件夹**：这是唯一一档在任何层级上都说得通的口径。
 * 只数本层的话，01-projects 这种「只装文件夹」的层会显示 0——
 * 一个空文件夹与一个装着八个项目、两百篇卡片的文件夹长得一模一样，
 * 那个数字于是既不解释什么，还让人以为功能坏了。
 */
export const FOLDER_COUNT_DEFAULTS = {
    target: 'notes',
    recursive: true,
} as const;

// ============================================================
// 文件浏览器：最近文件
// ============================================================

/**
 * 状态文件名，与日历的 holiday-cache.json 同一档：它们是**状态**不是设置。
 *
 * 分家的理由很具体：升级契约承诺 data.json 的 SHA-256 前后不变，
 * 而「我刚翻过哪几篇」「光标停在第几行」每分钟都在改。
 * 混进 data.json 之后那条承诺就永远验不过，验不过的承诺等于没有承诺。
 */
export const RECENT_FILES_FILE = 'recent-files.json';

/** 光标记忆的状态文件名。同上，同一条判据 */
export const CURSOR_STATE_FILE = 'cursor-positions.json';

/**
 * 记录里最多留几条（与「显示几条」是两个数）。
 *
 * 留得比能显示的多，是为了让「显示 10 条」的人改成「显示 50 条」时立刻就有 50 条，
 * 而不是从此刻重新攒；留得有上限，是因为一份永远只增不减的清单迟早变成一份日志。
 */
export const RECENT_FILES_KEEP = 50;

/** 「显示几条」的候选。既是设置页下拉框的选项，又是读取侧的合法性判据，故必须同源 */
export const RECENT_FILES_LIMITS: readonly number[] = [10, 20, 30, 50];

/**
 * 清单的两种排法。
 *
 * 成员永远是「你打开过的」，两个取值只改排序：opened 按打开时刻，modified 按文件的最后修改时间。
 * 分成两种而不是只留一种，是因为「我刚才在哪」与「我最近改了什么」是两个真实且不同的问题——
 * 读了一天资料没动笔的人问前者，写了一天的人问后者。
 */
export const RECENT_FILES_SORTS = ['opened', 'modified'] as const;

/** 排法的联合类型，供设置页与读取侧共用 */
export type RecentFilesSort = (typeof RECENT_FILES_SORTS)[number];

/** 全新库的最近文件默认值，也是读取侧的回落值 */
export const RECENT_FILES_DEFAULTS = {
    limit: 30,
    sort: 'opened',
} as const;

/**
 * 光标记忆最多记几篇笔记。
 *
 * 它不是设置：记 200 篇还是 500 篇，用户永远没法从界面上察觉差别，
 * 而一个察觉不到差别的开关只是让设置页更长。取 200 是「常用笔记全都在里面」
 * 与「状态文件仍然只有几十 KB」之间的取值。
 */
export const CURSOR_MEMORY_LIMIT = 200;

// ============================================================
// 视图代码块
// ============================================================

/**
 * 视图代码块的语言标记。学员写的是：
 *
 * ```ziminos
 * 人脉名录
 * ```
 *
 * 只注册这一个 processor：视图名是块里的第一行内容而非语言标记本身，
 * 因此新增视图不需要动 main.ts，也不会让学员的笔记里出现二十种代码块语言。
 */
export const VIEW_BLOCK_LANG = 'ziminos';

/**
 * 视图重算防抖（毫秒）。
 * 重算由 metadataCache 变更事件驱动而非轮询——这正是 V2 不采用 DataviewJS 的理由之一：
 * 它靠一个 2500ms 的 setInterval 刷新，而「无定时器、无后台轮询」是红线。
 */
export const VIEW_REFRESH_DEBOUNCE_MS = 200;

// ============================================================
// 赛博永生（第二版三库系统，free 版永远走不到这里）
// ============================================================

/**
 * 出库单：住在「以人为本」库里，记着哪些已完成的项目还没搬进《赛博永生》。
 *
 * 它是插件与桌面智能体之间唯一的书面约定，因此收在常量里而不是两边各写一遍——
 * 判据与 DIARY_LOG_HEADING 完全相同：**写入方与读取方共同的约定**。
 * 插件按这个路径追加，智能体按这个路径读取并勾掉，两处一旦分叉，
 * 归档的项目会静静地躺在一张没人看的清单上，而没有任何东西会报错。
 *
 * 它刻意是一篇普通的、可见的、可删的 Markdown，而不是 .obsidian 里的一个 json：
 * 这套系统对用户的承诺是「一切都是你能打开、能看懂、能删的文件」，
 * 一张他看不见的待办清单会把那句话变成半句真话。
 */
export const EXPORT_MANIFEST_FILE = `${FOLDERS.system}/赛博永生出库单.md`;

/** 出库单里那个装待办行的小节标题。新行追加到它末尾，与记人情写日记同一套画法 */
export const EXPORT_MANIFEST_HEADING = '## 待搬运';

/**
 * 出库单一行的字段分隔符。
 *
 * 用「 · 」而不是人情账本那个全角竖线：出库单行本身是一条任务行，
 * 而全角竖线是账本行的形态判据——两种行长得像，解析器就迟早会把一个已归档项目
 * 当成一笔人情债记进别人的档案，且不报错。这条与捕获域清洗竖线是同一个理由的两面。
 */
export const EXPORT_MANIFEST_SEPARATOR = ' · ';

/**
 * 《赛博永生》库的三层结构，取自卡帕西 LLM wiki 的 Raw / Wiki / Schema。
 *
 * 原料层只读——它装的是从「以人为本」搬来的已完成项目副本，是不可变的事实；
 * wiki 层归机器写，人也可以改；log 是 append-only 的账本，也是「哪些原料已经提炼过」
 * 这个问题的唯一答案。用账本而不是在原料上打标记，是为了让原料层真的保持不可变——
 * 往原料里写一个 ingested 字段，它就不再是当初归档时的那份东西了。
 */
export const ETERNAL_FOLDERS = {
    raw: '10-原料',
    wiki: '20-知识',
    system: '90-系统',
} as const;

/** wiki 的目录页与账本，两者都是卡帕西原文点名的关键文件 */
export const ETERNAL_INDEX_FILE = `${ETERNAL_FOLDERS.wiki}/索引.md`;
export const ETERNAL_LOG_FILE = `${ETERNAL_FOLDERS.system}/账本.md`;

/**
 * 账本里一条「消化」记录的标记；「待提炼」视图靠它认出哪些原料已经提炼过。
 *
 * 写只写第一个，读认全部。留着英文 `ingest` 不是念旧：这本库的三层结构本来是英文的，
 * 而账本是**智能体逐行追加、用户也会去手改**的文件——万一某台机器上 `.ziminos/skills/`
 * 还是汉化之前那份契约，它写下的仍是 `ingest`。少认一个标记的表现不是报错，
 * 是那几份原料整体退回「待提炼」，接着一次重复提炼把 wiki 写重一遍。
 * 认错方向的代价在这里高度不对称，因此宽松在安全侧。
 */
export const ETERNAL_LOG_INGEST_MARKS: readonly string[] = ['消化', 'ingest'];
