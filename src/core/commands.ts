/**
 * [INPUT]: 依赖 obsidian 的 Plugin 类型；依赖 ./constants 的 PeriodKey 与 TransitionAction 两个类型
 * [OUTPUT]: 对外提供命令身份契约 CommandSpec、分组名 COMMAND_GROUPS、图标名 COMMAND_ICONS，
 *           三十八条命令的规格 INIT_VAULT_COMMAND/PROJECT_COMMANDS/TRANSITION_COMMANDS（含类型
 *           TransitionCommand）/BOOK_COMMANDS/INSPIRATION_COMMAND/PERIOD_COMMANDS/THEME_COMMAND/
 *           OPEN_CALENDAR_COMMAND/CONTACT_COMMANDS/CLIENT_COMMANDS/APPEARANCE_COMMAND/FORMAT_COMMAND/
 *           RECENT_FILES_COMMAND/COPY_PATH_COMMAND/EXPORT_COMMAND/LEGACY_COMMANDS，
 *           左侧边栏默认摆件 DEFAULT_RIBBON_COMMANDS
 *           与它的读取侧兜底 normalizeRibbonCommands，
 *           以及注册台 CommandRegistry 与它交出的 RegisteredCommand
 * [POS]: 命令这件事的全部。constants.ts 回答「系统里有哪些东西」，本文件回答「用户能让系统做哪些事」——
 *        它从 constants 里分出来，是因为命令自带了目录名字段名都没有的两样东西：图标与分组，
 *        它们只服务界面，与业务事实无关，混在一起会让那份常量表同时是数据字典和界面清单。
 *        本文件最要紧的设计是 CommandRegistry：模块注册命令时把回调也留一份在花名册上，
 *        于是左侧边栏想执行一条命令，直接调那个回调即可，不必去问 Obsidian「id 为 X 的命令是谁」。
 *        这不是省事，是守红线——按 id 执行命令的 executeCommandById 不在 obsidian.d.ts 里，
 *        走它就等于为了摆几个图标再开一个非公开 API 的口子
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Plugin } from 'obsidian';
import type { PeriodKey, TransitionAction } from './constants';

// ============================================================
// 命令身份
// ============================================================

/**
 * 一条命令的完整身份。
 *
 * 四个字段各有去处：id 与 name 交给命令面板，icon 同时喂给命令面板与左侧边栏，
 * group 只服务侧边栏设置页的分区。把它们收成一个结构而不是四个平列常量，
 * 是因为「注册一条命令」从此只需递一个值——命令面板、侧边栏、设置页拿到的
 * 永远是同一份身份，不可能出现「侧边栏上的图标和命令面板里的不是一个」。
 */
export interface CommandSpec {
    /** 全局唯一命令 id。它会落进用户的快捷键配置，改名等于让已绑的快捷键失效，故视同公开契约 */
    readonly id: string;
    /**
     * 命令面板里的中文名，同时是侧边栏按钮的悬停提示。
     *
     * 它和 id 一样是对外契约，理由不那么显然：Obsidian 的边栏用
     * `插件id + ":" + 标题` 当作一个边栏项的身份，也就是说这个**中文名**才是
     * 用户拖出来的顺序与「在 Obsidian 里藏掉它」这两件事被记进 workspace.json 的键。
     * 改名等于换一个新按钮，用户在边栏上的排布会静默丢失。
     * 由此还得出一条不变式：全部 name 必须互不相同——撞名会让两条命令共用同一个边栏项。
     */
    readonly name: string;
    /** 图标名，取值必须来自 COMMAND_ICONS */
    readonly icon: string;
    /**
     * 所属分组，类型收成 COMMAND_GROUPS 的值联合而非 string：
     * GROUP_COLORS 按组查色，组名写错一个字就查不到——收窄成联合类型让这种错在编译期倒下。
     */
    readonly group: CommandGroup;
}

/**
 * 十一个命令分组。
 *
 * 它不是新发明的分类，而是照着插件自己的结构切的：十个同名于 modules/ 下的目录
 * （setup / projects / books / inspiration / review / contacts / appearance / format /
 * explorer / legacy），clients 是唯一的例外——客户不是独立目录，
 * 是 contacts 模块里 client.ts 那一支，单列成组是因为客户与人脉在业务上本就是两个物种
 * （见 contacts 的 L2）。modules/ribbon 与 modules/editing 都不在其中：
 * 前者一条命令都不注册、只负责把别人的命令摆出来，后者是两个监听、没有可执行的入口。
 */
export const COMMAND_GROUPS = {
    setup: '开荒',
    projects: '项目',
    books: '读书',
    inspiration: '灵感',
    review: '复盘',
    contacts: '人脉',
    clients: '客户',
    appearance: '外观',
    format: '排版',
    explorer: '文件',
    legacy: '旧版',
} as const;

/** 分组名的联合类型，供按组建表的地方做穷尽检查 */
export type CommandGroup = (typeof COMMAND_GROUPS)[keyof typeof COMMAND_GROUPS];

/**
 * 每个分组一种功能色，左侧边栏的图标与设置页边栏清单照它上色。
 *
 * 色不是装饰，是索引：几十个同画法的笔画图标排成一列时，形状要凑近看才认得出，
 * 颜色隔着半个屏幕就分了组。取色全部从功能的天然联想出发，学员不需要背——
 * 开荒是垦土、读书是朱批、灵感是灯泡、复盘是沉思、人脉是心、客户是钱、外观是调色盘。
 * 全部取中间明度，深浅两种主题下都立得住；写成十六进制而非主题变量，
 * 因为它们是身份不是皮肤——主题可以换掉界面的灰，不该换掉「灵感是黄色的」这件事。
 */
export const GROUP_COLORS: Readonly<Record<CommandGroup, string>> = {
    [COMMAND_GROUPS.setup]: '#A8763E',       // 开荒＝垦土，泥土棕
    [COMMAND_GROUPS.projects]: '#4C8DD6',    // 项目＝蓝图，工程蓝
    [COMMAND_GROUPS.books]: '#C15449',       // 读书＝批注用朱笔，朱批红
    [COMMAND_GROUPS.inspiration]: '#E3A93C', // 灵感＝灯泡，琥珀黄
    [COMMAND_GROUPS.review]: '#9A6BD6',      // 复盘＝沉思，紫
    [COMMAND_GROUPS.contacts]: '#E06C8A',    // 人脉＝心，玫红
    [COMMAND_GROUPS.clients]: '#43A868',     // 客户＝生意与钱，绿
    [COMMAND_GROUPS.appearance]: '#E07B39',  // 外观＝调色盘，橙
    [COMMAND_GROUPS.format]: '#3BAFBF',      // 排版＝整洁，青
    [COMMAND_GROUPS.explorer]: '#5A6ACF',    // 文件＝找路，罗盘针的靛蓝
    // 旧版这三条做的是 Obsidian 自己的事，不属于 ziminOS 的任何一摊。
    // 中性灰是这句话的视觉说法：在那一列彩色图标里，它们一眼就看得出是外来的
    [COMMAND_GROUPS.legacy]: '#7A8290',
};

/**
 * 四十一个图标名：三十八条命令各一枚，加设置页那三张没有命令与之对应的标签页（边栏、文件、编辑）。
 *
 * 一律带 `ziminos-` 前缀：图标名是 Obsidian 全局共享的命名空间，
 * 不加前缀就可能盖掉 lucide 里的同名图标，或者被后装的插件盖掉。
 * 这里只定名字，图形本体住在 modules/ribbon/icons.ts——
 * 隔着一层字符串对齐，是为了让「删掉 ribbon 模块」只损失图形而不损失命令：
 * Obsidian 遇到认不出的图标名只是不画，既不报错也不影响命令本身可执行。
 */
export const COMMAND_ICONS = {
    vault: 'ziminos-vault',
    project: 'ziminos-project',
    area: 'ziminos-area',
    card: 'ziminos-card',
    migrate: 'ziminos-migrate',
    done: 'ziminos-done',
    paused: 'ziminos-paused',
    dropped: 'ziminos-dropped',
    active: 'ziminos-active',
    book: 'ziminos-book',
    readBook: 'ziminos-read-book',
    weread: 'ziminos-weread',
    syncHighlights: 'ziminos-sync-highlights',
    highlights: 'ziminos-highlights',
    excerpt: 'ziminos-excerpt',
    inspiration: 'ziminos-inspiration',
    calendar: 'ziminos-calendar',
    daily: 'ziminos-daily',
    weekly: 'ziminos-weekly',
    monthly: 'ziminos-monthly',
    quarterly: 'ziminos-quarterly',
    yearly: 'ziminos-yearly',
    theme: 'ziminos-theme',
    contact: 'ziminos-contact',
    favor: 'ziminos-favor',
    clients: 'ziminos-clients',
    client: 'ziminos-client',
    payment: 'ziminos-payment',
    receipt: 'ziminos-receipt',
    qa: 'ziminos-qa',
    appearance: 'ziminos-appearance',
    format: 'ziminos-format',
    /**
     * 不属于任何命令的两枚：设置页「边栏」与「文件」两张标签页的图标。
     * 这两个模块管的都是屏幕上的一块地方而不是一件可执行的事，
     * 没有哪条命令天然长它们的样子，图形与其余三十个同住 icons.ts，同一套画法。
     *
     * 两枚都画那块地方本身而不画它的功能：边栏是「一块带左栏的面板」，
     * 文件浏览器是「一个文件夹」。文件夹上刻意不加数字或角标——
     * 标签页的身份是「文件浏览器的设置在这儿」，而计数只是它眼下唯一那件事，
     * 把当期功能画进图标里，下一件功能进来时这枚图标就开始撒谎。
     */
    recent: 'ziminos-recent',
    filePath: 'ziminos-file-path',
    export: 'ziminos-export',
    vaultSwitch: 'ziminos-vault-switch',
    help: 'ziminos-help',
    appSettings: 'ziminos-app-settings',
    dock: 'ziminos-dock',
    explorer: 'ziminos-explorer',
    editing: 'ziminos-editing',
} as const;

// ============================================================
// 三十八条命令：顺序即它们在左侧边栏里的先后
// ============================================================

/**
 * 开荒命令。它是唯一不属于任何功能模块的命令——开荒横跨全库骨架并要收齐各模块的诉求，
 * 因此由 main.ts 直接注册；其余二十条都由各自模块自行注册。
 */
export const INIT_VAULT_COMMAND: CommandSpec = {
    id: 'init-vault',
    name: '初始化笔记库',
    icon: COMMAND_ICONS.vault,
    group: COMMAND_GROUPS.setup,
};

/** 项目模块的四个入口（含一次性迁移）；四条状态流转另见 TRANSITION_COMMANDS */
export const PROJECT_COMMANDS: Readonly<Record<'create' | 'area' | 'card' | 'migrate', CommandSpec>> = {
    create: {
        id: 'create-project',
        name: '新建项目',
        icon: COMMAND_ICONS.project,
        group: COMMAND_GROUPS.projects,
    },
    /**
     * 新建领域。它与新建项目共用一条流程，差别只有三处（目录、type、不问归属），
     * 因此也归项目组——PARA 里「项目」与「领域」是同一个问题的两个答案：这件事有没有终点。
     */
    area: {
        id: 'create-area',
        name: '新建领域',
        icon: COMMAND_ICONS.area,
        group: COMMAND_GROUPS.projects,
    },
    card: {
        id: 'init-card',
        name: '初始化当前卡片',
        icon: COMMAND_ICONS.card,
        group: COMMAND_GROUPS.projects,
    },
    /** 用户主动触发的存量升级：预览导航/MOC Base 差异，确认后写入，失败整批回滚 */
    migrate: {
        id: 'migrate-moc-bases',
        name: '升级存量 MOC 数据库',
        icon: COMMAND_ICONS.migrate,
        group: COMMAND_GROUPS.projects,
    },
};

/** 一条流转命令：命令身份，加上它绑定的那个动作 */
export interface TransitionCommand extends CommandSpec {
    /** 对应 constants 里 TRANSITIONS 的动作键 */
    readonly action: TransitionAction;
}

/**
 * 四条命令与四个动作的绑定表。
 * 原脚本靠 QuickAdd 设置里的 action 文本选择动作，插件里改为命令自带动作，
 * 用户不可能再填错动作名——这是「一个命令一个确定行为」的收敛。
 */
export const TRANSITION_COMMANDS: readonly TransitionCommand[] = [
    {
        id: 'project-done',
        name: '完成项目',
        icon: COMMAND_ICONS.done,
        group: COMMAND_GROUPS.projects,
        action: 'done',
    },
    {
        id: 'project-paused',
        name: '暂停项目',
        icon: COMMAND_ICONS.paused,
        group: COMMAND_GROUPS.projects,
        action: 'paused',
    },
    {
        id: 'project-dropped',
        name: '放弃项目',
        icon: COMMAND_ICONS.dropped,
        group: COMMAND_GROUPS.projects,
        action: 'dropped',
    },
    {
        id: 'project-active',
        name: '重新开始项目',
        icon: COMMAND_ICONS.active,
        group: COMMAND_GROUPS.projects,
        action: 'active',
    },
];

/**
 * 读书笔记模块的三条命令：建书、导划线、炼卡。
 *
 * 一本书就是一个项目（建书走的正是 createContainer 那条流程），
 * 但它们单独成组：读书有自己的三样动作与自己的素材形态（划线），
 * 混进项目组会让「新建项目」与「新建读书笔记」在边栏上看起来是同一类事的两个按钮。
 */
export const BOOK_COMMANDS: Readonly<
    Record<'read' | 'sync' | 'connectWeread' | 'create' | 'importNotes' | 'excerpt', CommandSpec>
> = {
    /**
     * 主干命令：一步读一本书。
     *
     * 它取代的是学员原本的三步（豆瓣插件建档 → 划线插件导出 → 手工复制粘贴汇总）。
     * 排在这一组的第一条，因为它是绝大多数时候唯一该按的那一条；
     * 其余四条都是它覆盖不到的边角：手动建、粘贴导、再同步、炼卡。
     */
    read: {
        id: 'read-book',
        name: '读一本书',
        icon: COMMAND_ICONS.readBook,
        group: COMMAND_GROUPS.books,
    },
    /** 读到一半再拉一次划线。与建书共用同一套取数与合并，只是不再建档 */
    sync: {
        id: 'sync-book-highlights',
        name: '同步这本书的划线',
        icon: COMMAND_ICONS.syncHighlights,
        group: COMMAND_GROUPS.books,
    },
    /** 连微信读书。一辈子按一次，扫码登录后划线才能自动来 */
    connectWeread: {
        id: 'connect-weread',
        name: '连接微信读书',
        icon: COMMAND_ICONS.weread,
        group: COMMAND_GROUPS.books,
    },
    create: {
        id: 'create-book',
        name: '新建读书笔记',
        icon: COMMAND_ICONS.book,
        group: COMMAND_GROUPS.books,
    },
    /** 把微信读书 / Kindle / 苹果图书导出的纯文本解析进书的 MOC；零网络，粘贴才动 */
    importNotes: {
        id: 'import-book-highlights',
        name: '导入读书划线',
        icon: COMMAND_ICONS.highlights,
        group: COMMAND_GROUPS.books,
    },
    /** 把选中的划线炼成一张十字段卡片，是读书笔记从素材走向知识的那一步 */
    excerpt: {
        id: 'excerpt-book-card',
        name: '摘成卡片',
        icon: COMMAND_ICONS.excerpt,
        group: COMMAND_GROUPS.books,
    },
};

/** 灵感收集的唯一入口；不预占系统快捷键，用户可在 Obsidian 快捷键设置里自由绑定 */
export const INSPIRATION_COMMAND: CommandSpec = {
    id: 'capture-inspiration',
    name: '记录灵感',
    icon: COMMAND_ICONS.inspiration,
    group: COMMAND_GROUPS.inspiration,
};

/** 中国日历视图的找回入口；视图默认常驻右侧栏，这条命令在用户关闭后负责重新打开 */
export const OPEN_CALENDAR_COMMAND: CommandSpec = {
    id: 'open-calendar',
    name: '打开中国日历',
    icon: COMMAND_ICONS.calendar,
    group: COMMAND_GROUPS.review,
};

/**
 * 五级复盘各自的「打开本级笔记」命令，键与 constants 的 PERIODS 同源。
 *
 * 它没有内嵌进 PERIODS，是因为那张表谈的全是时间——格式串、startOf 单位、上下级关系；
 * 命令谈的是入口与图标。用 Record<PeriodKey, …> 而不是数组，
 * 是让「加一级周期却忘了给它命令」在编译期就过不去。
 */
export const PERIOD_COMMANDS: Readonly<Record<PeriodKey, CommandSpec>> = {
    daily: {
        id: 'open-diary',
        name: '打开今天的日记',
        icon: COMMAND_ICONS.daily,
        group: COMMAND_GROUPS.review,
    },
    weekly: {
        id: 'open-weekly',
        name: '打开本周复盘',
        icon: COMMAND_ICONS.weekly,
        group: COMMAND_GROUPS.review,
    },
    monthly: {
        id: 'open-monthly',
        name: '打开本月复盘',
        icon: COMMAND_ICONS.monthly,
        group: COMMAND_GROUPS.review,
    },
    quarterly: {
        id: 'open-quarterly',
        name: '打开本季复盘',
        icon: COMMAND_ICONS.quarterly,
        group: COMMAND_GROUPS.review,
    },
    yearly: {
        id: 'open-yearly',
        name: '打开本年复盘',
        icon: COMMAND_ICONS.yearly,
        group: COMMAND_GROUPS.review,
    },
};

/** 写主题命令：当前笔记是复盘笔记就写它的，否则写今天日记的 */
export const THEME_COMMAND: CommandSpec = {
    id: 'write-theme',
    name: '写复盘主题',
    icon: COMMAND_ICONS.theme,
    group: COMMAND_GROUPS.review,
};

/** 人脉模块的两条命令 */
export const CONTACT_COMMANDS: Readonly<Record<'create' | 'favor', CommandSpec>> = {
    create: {
        id: 'create-contact',
        name: '新建人脉',
        icon: COMMAND_ICONS.contact,
        group: COMMAND_GROUPS.contacts,
    },
    favor: {
        id: 'record-favor',
        name: '记人情',
        icon: COMMAND_ICONS.favor,
        group: COMMAND_GROUPS.contacts,
    },
};

/** 客户模块的五条命令：两条为旧库补齐或修复，三条日常 */
export const CLIENT_COMMANDS: Readonly<
    Record<'setup' | 'answers' | 'create' | 'payment' | 'receipt', CommandSpec>
> = {
    setup: {
        id: 'setup-clients',
        name: '初始化客户模块',
        icon: COMMAND_ICONS.clients,
        group: COMMAND_GROUPS.clients,
    },
    answers: {
        id: 'backfill-client-answer-views',
        name: '补齐客户答疑检索',
        icon: COMMAND_ICONS.qa,
        group: COMMAND_GROUPS.clients,
    },
    create: {
        id: 'create-client',
        name: '新建客户',
        icon: COMMAND_ICONS.client,
        group: COMMAND_GROUPS.clients,
    },
    payment: {
        id: 'add-payment',
        name: '增加付费',
        icon: COMMAND_ICONS.payment,
        group: COMMAND_GROUPS.clients,
    },
    receipt: {
        id: 'record-receipt',
        name: '记收款',
        icon: COMMAND_ICONS.receipt,
        group: COMMAND_GROUPS.clients,
    },
};

/** 外观开关的命令入口。状态栏按钮可以被关掉，命令是它永远存在的另一条路 */
export const APPEARANCE_COMMAND: CommandSpec = {
    id: 'open-appearance-switch',
    name: '打开外观开关',
    icon: COMMAND_ICONS.appearance,
    group: COMMAND_GROUPS.appearance,
};

/** 排版整理的命令入口。自动整理刻意不碰你正在编辑的那一篇，这条命令是不受此限的那条路 */
export const FORMAT_COMMAND: CommandSpec = {
    id: 'format-note',
    name: '整理当前笔记格式',
    icon: COMMAND_ICONS.format,
    group: COMMAND_GROUPS.format,
};


// ============================================================
// 文件与旧版入口
// ============================================================

/** 打开侧栏那张「最近文件」清单。它不随启动自动展开——找不回某一篇时才想起它 */
export const RECENT_FILES_COMMAND: CommandSpec = {
    id: 'open-recent-files',
    name: '打开最近文件',
    icon: COMMAND_ICONS.recent,
    group: COMMAND_GROUPS.explorer,
};

/**
 * 复制当前笔记的完整路径。
 * 它与右下角状态栏那一块是同一件事的两个出口：那一块用来看，这条用来在手机上
 * （或把状态栏收起来之后）也能拿。两者调同一段复制，因此提示语一字不差。
 */
export const COPY_PATH_COMMAND: CommandSpec = {
    id: 'copy-file-path',
    name: '复制当前笔记路径',
    icon: COMMAND_ICONS.filePath,
    group: COMMAND_GROUPS.explorer,
};

/**
 * 把当前 Markdown 笔记导成一整张 PNG 或单页 PDF。
 * 它不进默认边栏：导出发生在分享或交付的明确时刻，不是一天会反复按的记录动作。
 */
export const EXPORT_COMMAND: CommandSpec = {
    id: 'export-current-note',
    name: '导出当前笔记',
    icon: COMMAND_ICONS.export,
    group: COMMAND_GROUPS.explorer,
};

/**
 * Obsidian 1.6 挪走的那三个入口。
 *
 * 它们是全部命令里唯一一组**不属于 ziminOS 自己**的——做的是 Obsidian 的事，
 * 因此单独成组、着中性灰，在边栏那张清单里一眼看出「这三个不是我家的东西」。
 * 三条都走命令而不是自己画一条按钮栏：命令自动进命令面板、可绑快捷键，
 * 勾进边栏后位置还归用户拖，比复刻一条固定的按钮栏更像 Obsidian 原本的样子。
 */
export const LEGACY_COMMANDS: Readonly<Record<'vault' | 'help' | 'settings', CommandSpec>> = {
    vault: {
        id: 'open-vault-chooser',
        name: '切换笔记库',
        icon: COMMAND_ICONS.vaultSwitch,
        group: COMMAND_GROUPS.legacy,
    },
    help: {
        id: 'open-obsidian-help',
        name: '打开帮助',
        icon: COMMAND_ICONS.help,
        group: COMMAND_GROUPS.legacy,
    },
    settings: {
        id: 'open-obsidian-settings',
        name: '打开设置',
        icon: COMMAND_ICONS.appSettings,
        group: COMMAND_GROUPS.legacy,
    },
};

// ============================================================
// 左侧边栏：默认摆出哪几个
// ============================================================

/**
 * 全新库默认摆进左侧边栏的十条命令。
 *
 * 全部命令都摆上去等于把选择的负担丢回给学员——那条边栏会长成一根谁也不看的图标柱。
 * 这七条的判据是「一天里可能按不止一次」：记灵感、开日记、写主题是每天的动作，
 * 新建项目与新建人脉是每周的动作，记人情发生在关系推进的当下，外观开关是刚上手时天天在调的。
 * 其余命令要么一辈子只按一次（初始化笔记库、旧库补齐客户模块、补齐客户答疑检索、升级存量 MOC 数据库），
 * 要么发生在某个具体场景里（新建领域、初始化当前卡片、四条流转、读书三条、
 * 客户建档与流水、导出当前笔记、周月季年四级复盘）——
 * 那些场景里用户本来就停在对的笔记上，命令面板比一根图标柱更快。
 * 新建领域不在默认清单里，是因为一个人的领域屈指可数：健康、手艺、人脉，建完就是好几年；
 * 「整理当前笔记格式」默认开着自动整理，它是那条留给例外情况的手动路，
 * 常按不上它反而说明自动那条跑得好。
 *
 * 老库升级正是它生效的场景：0.4.0 升上来的库 data.json 里没有 ribbonCommands 这个键，
 * 于是以这份清单打底，一次性长出这七个图标；而已经调过侧边栏的人以存档为准，
 * 一条都不会被覆盖。两种情况都由 main.ts 那句「默认值打底、存档覆盖」的合并顺序保证。
 */
export const DEFAULT_RIBBON_COMMANDS: readonly string[] = [
    PROJECT_COMMANDS.create.id,
    INSPIRATION_COMMAND.id,
    PERIOD_COMMANDS.daily.id,
    THEME_COMMAND.id,
    CONTACT_COMMANDS.create.id,
    CONTACT_COMMANDS.favor.id,
    APPEARANCE_COMMAND.id,
    // 旧版那三个默认就摆出来：它们存在的全部理由就是「回到 ribbon 上」，
    // 一个需要先去设置页勾选才回来的按钮，等于没有回来。
    // 顺序归用户——摆出来之后拖到哪儿由 Obsidian 自己记
    LEGACY_COMMANDS.vault.id,
    LEGACY_COMMANDS.help.id,
    LEGACY_COMMANDS.settings.id,
];

/**
 * 把磁盘上读到的 ribbonCommands 收敛成一份可用的清单。
 *
 * 校验放在读取侧，是这个仓库的一贯做法（目录名走 normalizeFolderPath、
 * 时间格式的兜底收在 core/time 内部），理由在这里格外硬：
 * data.json 是用户能手改的文件，而 ribbonCommands 恰好是唯一一个「坏值会让设置页画到一半炸掉」的字段——
 * 它被 `.length` 与 `.includes` 直接使用，一个 null 就让整个设置页从「左侧边栏」那一区起全部消失，
 * 包括下面的高级设置。收敛一次，两个消费方（边栏与设置页）都不必各自判空。
 *
 * 不是数组就退回默认清单（等同于「这个键没写过」），是数组则只留下字符串项。
 * 空数组是合法的：用户把全部命令都取消了，那就一个图标都不摆。
 */
export function normalizeRibbonCommands(value: unknown): readonly string[] {
    if (!Array.isArray(value)) return DEFAULT_RIBBON_COMMANDS;

    return value.filter((item): item is string => typeof item === 'string');
}

// ============================================================
// 注册台
// ============================================================

/** 花名册上的一条：命令的身份，加上按下去真正执行的那件事 */
export interface RegisteredCommand {
    readonly spec: CommandSpec;
    /** 命令的回调本体。侧边栏按钮直接调它，不经过 Obsidian 的命令查找 */
    readonly run: () => void;
}

/**
 * 命令注册台。
 *
 * 它做两件事，且两件必须同时做：把命令交给 Obsidian（于是命令面板与快捷键能找到它），
 * 同时在花名册上留一份（于是左侧边栏有东西可摆、设置页有清单可列）。
 * 各模块只调 register，先后顺序即花名册顺序，也就是图标在边栏里从上到下的顺序——
 * 那份顺序不需要另一张表来规定，它已经写在 main.ts 的装配段里了。
 *
 * 花名册存回调而不是只存 id，是这个类最关键的一处取舍：
 * 「按 id 执行一条命令」的 executeCommandById 不在 obsidian.d.ts 里，
 * 为了摆几个图标去开非公开 API 的口子不划算，而回调本来就在手上，接住即可。
 */
export class CommandRegistry {
    private readonly plugin: Plugin;

    private readonly entries: RegisteredCommand[] = [];

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /**
     * 注册一条命令。
     *
     * 一律用 callback 而非 checkCallback：命令必须在任何情况下都可见可点，
     * 用户在错误的笔记上执行时该得到一句「为什么不行」，而不是眼看着命令凭空消失。
     * 这条纪律同样适用于侧边栏——一个会自己隐身的图标比一句提示更让人困惑。
     */
    register(spec: CommandSpec, run: () => void): void {
        this.plugin.addCommand({
            id: spec.id,
            name: spec.name,
            icon: spec.icon,
            callback: run,
        });

        this.entries.push({ spec, run });
    }

    /** 花名册，顺序即注册顺序。交出只读视图，谁都别想往里塞一条没注册过的命令 */
    list(): readonly RegisteredCommand[] {
        return this.entries;
    }
}
