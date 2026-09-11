/**
 * [INPUT]: 依赖 obsidian 的 App/Plugin 类型，依赖 ./constants 的 PARA、时间、灵感、读书、
 *          文件夹计数与最近文件的默认值/合法集合，
 *          依赖 ./device 的状态栏路径口径与 Eagle 本机参数，
 *          依赖 ./commands 的 DEFAULT_RIBBON_COMMANDS/normalizeRibbonCommands 与 CommandRegistry 类型，
 *          依赖 ./markdownStyle 的 DEFAULT_FORMAT_RULES/normalizeFormatRules，
 *          依赖 ./exportStyle 的 DEFAULT_EXPORT_STYLE/normalizeExportStyle，依赖 ./guard 的 SelfWriteGuard 类型，
 *          依赖 ./edition 的 EditionInfo 类型
 * [OUTPUT]: 对外提供 ZiminosSettings 设置契约、DEFAULT_SETTINGS 默认值、normalizeSettings 持久化边界验形、
 *           ZiminosContext 运行时上下文、开荒贡献契约 VaultSeed/VaultSeedNote，
 *           以及归档移交契约 ArchivedContainer/ArchivedHook（projects 交出、eternal 接住）
 * [POS]: core 的契约层，定义插件与各功能模块之间唯一的传参形态。
 *        功能模块一律只接收 ZiminosContext，不直接持有 Plugin 实例细节，也不各自读写设置文件——
 *        这样 main.ts 是唯一装配点，模块之间彼此不可见，可以并行开发、独立替换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { App, Plugin } from 'obsidian';
import { DEFAULT_RIBBON_COMMANDS, normalizeRibbonCommands } from './commands';
import type { CommandRegistry } from './commands';
import { DEFAULT_FORMAT_RULES, normalizeFormatRules } from './markdownStyle';
import {
    BOOK_TAG_DEFAULTS,
    BOOK_TAG_COUNTS,
    CLIENT_FOLDER,
    CONTACT_FOLDER,
    DEFAULT_DATETIME_FORMAT,
    FOLDER_COUNT_DEFAULTS,
    FOLDERS,
    INSPIRATION_DEFAULTS,
    INSPIRATION_INSERT_POSITIONS,
    LEGACY_INSPIRATION_FORMATS,
    RECENT_FILES_DEFAULTS,
    RECENT_FILES_LIMITS,
    RECENT_FILES_SORTS,
    FOLDER_COUNT_TARGETS,
} from './constants';
import type {
    FolderCountTarget,
    InspirationInsertPosition,
    RecentFilesSort,
} from './constants';
import { EAGLE_DEFAULTS, EAGLE_PORT_RANGE, FILE_PATH_DEFAULTS, FILE_PATH_SCOPES } from './device';
import type { FilePathScope } from './device';
import type { EditionInfo } from './edition';
import { DEFAULT_EXPORT_STYLE, normalizeExportStyle } from './exportStyle';
import type { ExportStyle } from './exportStyle';
import type { SelfWriteGuard } from './guard';

/** 插件设置，持久化在 vault/.obsidian/plugins/ziminos/data.json */
export interface ZiminosSettings {
    /** 在项目/领域目录内新建空 md 时，是否自动登记为卡片 */
    autoCardInit: boolean;
    /** 用户改动带 YAML 的笔记时，是否自动维护 updated 字段 */
    autoUpdated: boolean;
    /** 进行中的项目所在根目录 */
    projectFolder: string;
    /** 领域根目录 */
    areaFolder: string;
    /** 暂停、完成、放弃的项目所在归档根目录 */
    archiveFolder: string;
    /** created / updated 字段的时间格式（moment 语法） */
    dateTimeFormat: string;
    /** 灵感笔记所在目录，相对于笔记库根目录 */
    inspirationFolder: string;
    /** 灵感笔记文件名；运行时会自动补齐 .md */
    inspirationFileName: string;
    /** 标题插入模式定位的 Markdown 标题 */
    inspirationHeading: string;
    /** 新灵感在目标标题区或整篇正文中的插入位置 */
    inspirationInsertPosition: InspirationInsertPosition;
    /** 单条灵感模板，支持 content/date/time/datetime 四个占位符 */
    inspirationFormat: string;
    /** 复盘时间轴根目录；五个子目录由它派生，学员改一处即可整体搬家 */
    diaryFolder: string;
    /** 人脉档案根目录 */
    contactFolder: string;
    /** 客户档案根目录 */
    clientFolder: string;
    /** 客户来源渠道候选，逗号分隔。走选择而非手打，否则「B站/b站/哔哩哔哩」会把渠道统计打散 */
    clientSources: string;
    /** 产品候选，逗号分隔。产品名是学员自己的，必须可配，但仍要枚举化 */
    clientProducts: string;
    /**
     * 是否在右下角状态栏摆出外观开关。
     *
     * 插件往用户屏幕上常驻一个图标，就必须给出撤走它的办法——这是「人主导」的最小兑现。
     * 关掉只是收起按钮，命令面板里的「打开外观开关」照常可用。
     */
    showAppearanceSwitch: boolean;
    /**
     * 摆进左侧边栏的命令 id 清单，顺序不由它决定——边栏顺序永远是命令的注册顺序。
     *
     * 类型是 readonly：DEFAULT_SETTINGS 与设置对象在「用户没调过」时共享同一个数组引用，
     * 若允许原地 push/splice，用户第一次勾选就会把默认值本身改掉，
     * 此后连「恢复默认」都恢复不回来。声明成只读，改动就只能是造一个新数组，
     * 这条约束由编译器执行，不靠人记得。
     */
    ribbonCommands: readonly string[];
    /**
     * 是否在用户离开一篇笔记、或改动一篇没开着的笔记之后，自动按排版规则整理它。
     *
     * 关掉之后「整理当前笔记格式」这条命令照常可用——自动只是替他按下那条命令，
     * 而不是那条命令的唯一入口。
     */
    autoFormat: boolean;
    /**
     * 启用中的排版规则 id 清单，取值来自 core/markdownStyle 的 FORMAT_RULES。
     *
     * 与 ribbonCommands 同为 readonly 且同因：它在用户没调过时与 DEFAULT_SETTINGS 共用引用，
     * 允许原地增删的话，第一次勾选就把默认值本身改掉了。
     * 存「开着哪几条」而不是九个布尔字段，是为了让加一条规则不必动设置契约——
     * 老库升级时那条新规则默认不开，这与「不替用户改他没选过的东西」是同一条纪律。
     */
    formatRules: readonly string[];
    /**
     * 书籍标签的前缀，默认「书籍」，于是豆瓣的「方法论」落成 `#书籍/方法论`。
     *
     * 有前缀而不是直接用分类词，是为了让书的标签**成片**：标签面板里 `书籍/` 一展开就是
     * 整个书架的分类地图，而散着的「方法论」会与灵感、卡片、日记里同名的标签混成一堆，
     * 从此分不出哪一条来自哪本书。允许改，是因为有人的库里这一层本该叫「阅读/书籍」。
     */
    bookTagPrefix: string;
    /**
     * 一本书最多写几个标签；0 即不写标签。
     *
     * 豆瓣的分类按投票数从高到低排，前几条是这本书的公认位置，往后很快滑向个人化的碎语。
     * 因此这个数不是「够不够用」，是「从哪儿开始变成噪音」——默认 5。
     */
    bookTagCount: number;
    /**
     * 微信读书的登录态 Cookie，由「连接微信读书」扫码后写入。
     *
     * 它是全部设置里唯一一项**凭据**，因此三条纪律：只在本机 data.json 里、
     * 绝不出现在任何笔记或提示文案里、过期时如实报「登录已过期」而不是装作没有划线。
     * 空串＝没连过，那时读书命令只查本机的苹果图书与 Kindle。
     */
    wereadCookie: string;
    /**
     * 是否在文件浏览器里给每个文件夹右侧挂一个计数。
     *
     * 与状态栏那个按钮同一条纪律：插件往用户屏幕上常驻一样东西，就必须给出撤走它的办法。
     * 关掉之后计数当场消失、DOM 里一个残留节点都不留——一个「关掉了却还在那儿，重启才没」的
     * 开关，用户第二次就不会再信它。
     */
    showFolderCount: boolean;
    /** 那个数字数的是什么：笔记 / 子文件夹 / 全部条目。取值见 FOLDER_COUNT_TARGETS */
    folderCountTarget: FolderCountTarget;
    /**
     * 计数是否穿透子文件夹。
     *
     * 它与上面那个口径是**两个**设置而不是一个六选一的下拉框，因为两个问题彼此独立：
     * 「数什么」问的是我关心哪一类东西，「数多深」问的是这个文件夹算到哪儿为止。
     * 合成六个选项之后，学员为了把「笔记」换成「文件夹」得先想清楚自己刚才选的是哪一档深度。
     */
    folderCountRecursive: boolean;
    /**
     * 是否在右下角状态栏显示当前笔记的完整路径（点一下复制）。
     *
     * 与外观开关、文件夹计数同一条纪律：往用户屏幕上常驻一样东西，就得给出撤走它的办法。
     * 关掉只是收起那一块，命令「复制当前笔记路径」照常可用。
     */
    showFilePath: boolean;
    /**
     * 点那一块（或按命令）复制走的是哪一种路径：库内路径，还是本机绝对路径。
     *
     * 它与上面那个开关是**两件事**：开关回答「屏幕上要不要常驻这一块」，
     * 这一项回答「拿走的那串字给谁看」。绑成一个三选一的话，
     * 想收起那一块的人就再也没法决定命令复制什么——而命令在关掉之后照常可用。
     * 取值见 FILE_PATH_SCOPES；默认 vault，即 v0.20.0 之前唯一的行为。
     */
    filePathScope: FilePathScope;
    /** 「最近文件」清单显示几条；取值见 RECENT_FILES_LIMITS。记录本身另有更大的上限 */
    recentFilesLimit: number;
    /** 清单怎么排：按打开时刻还是按文件最后修改时间。取值见 RECENT_FILES_SORTS */
    recentFilesSort: RecentFilesSort;
    /**
     * 粘贴时，若剪贴板里是一条带协议的网址而编辑器里选着一段文字，
     * 是否把这次粘贴理解成「给这段文字加外链」。
     *
     * 关掉之后粘贴完全回到 Obsidian 自己的行为——这个开关必须存在，
     * 因为拦截 Cmd+V 是全库最容易让人不安的一件事，得让人随时能收回这份授权。
     */
    pasteLinkEnabled: boolean;
    /**
     * 是否将粘贴/拖入的附件交给 Eagle。
     * 这是 fail-closed 授权：打开后伴侣不可用，本次操作会明确报错，
     * 不会退回 Obsidian 本地附件。配对动作会自动打开它，断开则自动关掉。
     */
    eagleEnabled: boolean;
    /**
     * 是否将图片从 Eagle 接管中排除。
     * 打开后，纯图片粘贴/拖入事件原样交还 Obsidian 与其他图床插件；
     * 其他附件仍由 Eagle fail closed 接管。默认关闭，保留升级前行为。
     */
    eagleExcludeImages: boolean;
    /** Eagle 伴侣的本机回环端口；只是设备配置，不进笔记链接 */
    eaglePort: number;
    /** 项目外附件的可选 Eagle 目标文件夹 ID；项目内附件始终自动进入“项目/项目名” */
    eagleFolderId: string;
    /**
     * 是否记住每篇笔记关掉时的光标与滚动位置，下次打开时回到那里。
     *
     * 位置本身不在这里——它们是状态，住在插件目录下的 cursor-positions.json，
     * 与 data.json 分家（理由见那个常量的注释）。这里只有「要不要记」这一个开关。
     */
    rememberCursor: boolean;
    /**
     * 上一次导出用的那套风格：格式、页眉页脚、水印的文字与几何。
     *
     * 它落盘而不是只活在本次会话，因为这套值的用途是**品牌**——
     * 品牌的定义就是每次都一样。每次重启都要重打一遍水印文字、重拖六根滑块的话，
     * 用户第三次就会放弃加水印，而那正是他当初要这个功能的全部理由。
     * 它是设置里唯一一个嵌套对象：十五个字段平铺进来会让这张契约表一眼望不到头，
     * 而它们只被一个弹窗读写，天生是一个整体。
     */
    exportStyle: ExportStyle;
    /** 首次开荒完成的时间戳；空字符串表示尚未初始化，是「首次」与「补齐」的唯一判据 */
    initializedAt: string;
}

/** 默认设置。目录默认值取自 PARA 骨架常量，保证设置页与开荒结果天然一致 */
export const DEFAULT_SETTINGS: ZiminosSettings = {
    autoCardInit: true,
    autoUpdated: true,
    projectFolder: FOLDERS.projects,
    areaFolder: FOLDERS.areas,
    archiveFolder: FOLDERS.archives,
    dateTimeFormat: DEFAULT_DATETIME_FORMAT,
    inspirationFolder: INSPIRATION_DEFAULTS.folder,
    inspirationFileName: INSPIRATION_DEFAULTS.fileName,
    inspirationHeading: INSPIRATION_DEFAULTS.heading,
    inspirationInsertPosition: INSPIRATION_DEFAULTS.insertPosition,
    inspirationFormat: INSPIRATION_DEFAULTS.format,
    diaryFolder: FOLDERS.diary,
    contactFolder: CONTACT_FOLDER,
    clientFolder: CLIENT_FOLDER,
    clientSources: 'B站,抖音,小红书,公众号,朋友介绍,其他',
    clientProducts: '课程,咨询,陪跑',
    showAppearanceSwitch: true,
    ribbonCommands: DEFAULT_RIBBON_COMMANDS,
    autoFormat: true,
    formatRules: DEFAULT_FORMAT_RULES,
    bookTagPrefix: BOOK_TAG_DEFAULTS.prefix,
    bookTagCount: BOOK_TAG_DEFAULTS.count,
    wereadCookie: '',
    showFolderCount: true,
    folderCountTarget: FOLDER_COUNT_DEFAULTS.target,
    folderCountRecursive: FOLDER_COUNT_DEFAULTS.recursive,
    showFilePath: true,
    filePathScope: FILE_PATH_DEFAULTS.scope,
    recentFilesLimit: RECENT_FILES_DEFAULTS.limit,
    recentFilesSort: RECENT_FILES_DEFAULTS.sort,
    pasteLinkEnabled: true,
    eagleEnabled: false,
    eagleExcludeImages: false,
    eaglePort: EAGLE_DEFAULTS.port,
    eagleFolderId: EAGLE_DEFAULTS.folderId,
    rememberCursor: true,
    exportStyle: DEFAULT_EXPORT_STYLE,
    initializedAt: '',
};

/** 持久化 JSON 只在这里被当作未知输入；进入运行时上下文之后每个字段都已经是契约形态 */
export function normalizeSettings(input: unknown): ZiminosSettings {
    const stored = isRecord(input) ? input : {};
    const stringValue = <K extends keyof ZiminosSettings>(key: K): string =>
        typeof stored[key] === 'string'
            ? stored[key]
            : String(DEFAULT_SETTINGS[key]);
    const booleanValue = <K extends keyof ZiminosSettings>(key: K): boolean =>
        typeof stored[key] === 'boolean'
            ? stored[key]
            : Boolean(DEFAULT_SETTINGS[key]);
    const insertPosition = isInspirationInsertPosition(stored.inspirationInsertPosition)
        ? stored.inspirationInsertPosition
        : DEFAULT_SETTINGS.inspirationInsertPosition;
    const bookTagCount = isBookTagCount(stored.bookTagCount)
        ? stored.bookTagCount
        : DEFAULT_SETTINGS.bookTagCount;
    // 四个枚举/候选型字段各走一次验形，与上面两个同一姿态：
    // 它们的值会被直接用来查表（PICKERS）或喂给 slice，坏值不是显示错而是运行时错
    const folderCountTarget = isFolderCountTarget(stored.folderCountTarget)
        ? stored.folderCountTarget
        : DEFAULT_SETTINGS.folderCountTarget;
    const filePathScope = isFilePathScope(stored.filePathScope)
        ? stored.filePathScope
        : DEFAULT_SETTINGS.filePathScope;
    const recentFilesSort = isRecentFilesSort(stored.recentFilesSort)
        ? stored.recentFilesSort
        : DEFAULT_SETTINGS.recentFilesSort;
    const recentFilesLimit = isRecentFilesLimit(stored.recentFilesLimit)
        ? stored.recentFilesLimit
        : DEFAULT_SETTINGS.recentFilesLimit;
    const eaglePort = isEaglePort(stored.eaglePort)
        ? stored.eaglePort
        : DEFAULT_SETTINGS.eaglePort;

    return {
        autoCardInit: booleanValue('autoCardInit'),
        autoUpdated: booleanValue('autoUpdated'),
        projectFolder: stringValue('projectFolder'),
        areaFolder: stringValue('areaFolder'),
        archiveFolder: stringValue('archiveFolder'),
        dateTimeFormat: stringValue('dateTimeFormat'),
        inspirationFolder: stringValue('inspirationFolder'),
        inspirationFileName: stringValue('inspirationFileName'),
        inspirationHeading: stringValue('inspirationHeading'),
        inspirationInsertPosition: insertPosition,
        inspirationFormat: currentInspirationFormat(stringValue('inspirationFormat')),
        diaryFolder: stringValue('diaryFolder'),
        contactFolder: stringValue('contactFolder'),
        clientFolder: stringValue('clientFolder'),
        clientSources: stringValue('clientSources'),
        clientProducts: stringValue('clientProducts'),
        showAppearanceSwitch: booleanValue('showAppearanceSwitch'),
        ribbonCommands: normalizeRibbonCommands(stored.ribbonCommands),
        autoFormat: booleanValue('autoFormat'),
        formatRules: normalizeFormatRules(stored.formatRules),
        bookTagPrefix: stringValue('bookTagPrefix'),
        bookTagCount,
        wereadCookie: stringValue('wereadCookie'),
        showFolderCount: booleanValue('showFolderCount'),
        folderCountTarget,
        folderCountRecursive: booleanValue('folderCountRecursive'),
        showFilePath: booleanValue('showFilePath'),
        filePathScope,
        recentFilesLimit,
        recentFilesSort,
        pasteLinkEnabled: booleanValue('pasteLinkEnabled'),
        eagleEnabled: booleanValue('eagleEnabled'),
        eagleExcludeImages: booleanValue('eagleExcludeImages'),
        eaglePort,
        eagleFolderId: stringValue('eagleFolderId'),
        rememberCursor: booleanValue('rememberCursor'),
        exportStyle: normalizeExportStyle(stored.exportStyle),
        initializedAt: stringValue('initializedAt'),
    };
}

/**
 * 单条格式是全表唯一一个会被**改值**的字段：与某条旧默认字节相等时换成当前默认值。
 * 判据是字节相等而不是「看起来像默认值」——用户改过一个字，它就不再等于任何旧默认，
 * 于是原样留下。这条不是迁移脚本的开端：其余字段仍然只验形、不改值。
 */
function currentInspirationFormat(stored: string): string {
    return LEGACY_INSPIRATION_FORMATS.includes(stored) ? INSPIRATION_DEFAULTS.format : stored;
}

/** JSON 对象守卫；数组与 null 都不是设置记录 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 灵感插入位置只接受界面能够产生的闭合集合 */
function isInspirationInsertPosition(value: unknown): value is InspirationInsertPosition {
    return (
        typeof value === 'string' &&
        INSPIRATION_INSERT_POSITIONS.some((position) => position === value)
    );
}

/** 读书标签条数只接受设置页列出的数值，拒绝 NaN 与任意手改数字 */
function isBookTagCount(value: unknown): value is number {
    return typeof value === 'number' && BOOK_TAG_COUNTS.includes(value);
}

function isFolderCountTarget(value: unknown): value is FolderCountTarget {
    return typeof value === 'string' && FOLDER_COUNT_TARGETS.some((target) => target === value);
}

/** 复制口径同上。坏值会被直接拿去分支，回落默认比「照单全收」安全 */
function isFilePathScope(value: unknown): value is FilePathScope {
    return typeof value === 'string' && FILE_PATH_SCOPES.some((scope) => scope === value);
}

function isRecentFilesSort(value: unknown): value is RecentFilesSort {
    return typeof value === 'string' && RECENT_FILES_SORTS.some((sort) => sort === value);
}

function isRecentFilesLimit(value: unknown): value is number {
    return typeof value === 'number' && RECENT_FILES_LIMITS.includes(value);
}

/** 本地服务端口只接受无需提权的整数范围 */
function isEaglePort(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) &&
        value >= EAGLE_PORT_RANGE.min && value <= EAGLE_PORT_RANGE.max;
}

/**
 * 一份笔记的开荒诉求：路径 + 正文。
 * 正文是已经求值好的字符串而非工厂函数——模板都是纯函数，求值便宜，
 * 多一层惰性只会让「开荒到底会写出什么」这件事需要跑一遍才知道。
 */
export interface VaultSeedNote {
    readonly path: string;
    readonly content: string;
}

/**
 * 一个功能模块对开荒的全部贡献。
 *
 * 它存在的理由是依赖方向：开荒要建人脉 MOC、要建复盘目录，
 * 但开荒模块一旦 import 人脉模块，「模块之间彼此不认识」这条不变式就破了。
 * 改由每个模块自报诉求、main 装配、开荒只认这个契约——
 * 于是新增一个模块只是在 main 里多传一个 seed，开荒代码一行不改（OCP）。
 */
export interface VaultSeed {
    /** 本模块要求存在的目录，父目录必须排在子目录之前 */
    readonly folders: readonly string[];
    /** 本模块要求存在的笔记；已存在的一律不读不改不覆盖 */
    readonly notes: readonly VaultSeedNote[];
}

/**
 * 一个刚刚归档完成的容器（项目或书）的身份。
 *
 * 它住在 core 而不是 projects 模块里，理由与 VaultSeed 完全相同：
 * 它是**两个模块之间的契约**——projects 在归档成功后交出它，eternal 接住它写出库单。
 * 让 eternal 去 import projects 的类型，依赖图就从一棵树变成了一张网；
 * 契约上移到 core，两个模块就仍然彼此不认识。
 *
 * uid 是跨库身份，也是这份契约里最要紧的一个字段：项目可以被重新开始、
 * 再次完成，于是同一个项目会两次出现在出库单上。智能体靠 uid 判断
 * 「这是同一件事的新版本」而不是「又一个新项目」——没有它，
 * 《赛博永生》里会长出两页讲同一个项目的 wiki，而且谁都不知道该信哪一页。
 */
export interface ArchivedContainer {
    /** 项目名，也是文件夹名与 MOC 的基名 */
    readonly name: string;
    /** 容器类型，取 NOTE_TYPES 里的 project 或 book */
    readonly kind: string;
    /** 归档后的 MOC 库内路径 */
    readonly mocPath: string;
    /** 归档后的项目文件夹库内路径 */
    readonly folderPath: string;
    /** MOC 的 UID。跨库唯一身份，取不到时为空串——空串不写出库单，见 eternal 模块 */
    readonly uid: string;
}

/**
 * 「一个容器刚刚完成归档」这件事的接收者。
 * projects 模块声明这个洞，main 用 eternal 模块的能力填上；免费版根本不填，
 * 于是归档流程与第二版出现之前逐字节相同。
 */
export type ArchivedHook = (container: ArchivedContainer) => void;

/**
 * 运行时上下文：功能模块能力的全部来源。
 * settings 是 main.ts 持有的同一个对象引用，模块改字段后调 saveSettings 落盘；
 * guard 也是全局唯一实例，写方与监听方共用同一份自写记录才有意义。
 */
export interface ZiminosContext {
    app: App;
    /**
     * 供模块调用 addRibbonIcon / addStatusBarItem / registerEvent / register，
     * 生命周期由 Obsidian 托管。唯独 addCommand 不在此列——命令一律经下面的 commands 注册台，
     * 否则它只会出现在命令面板里，左侧边栏与设置页都看不见它。
     */
    plugin: Plugin;
    settings: ZiminosSettings;
    saveSettings: () => Promise<void>;
    guard: SelfWriteGuard;
    /**
     * 命令注册台。模块一律经它注册命令而不直接调 plugin.addCommand——
     * 那样命令才会同时出现在命令面板和左侧边栏的可选清单里，两处不会各说各话。
     */
    commands: CommandRegistry;
    /**
     * 本库的版次与它在三库系统里的角色，onload 时读一次磁盘得出，此后只读。
     *
     * 它放进上下文而不是让模块各自去读，理由与 settings 相同：全局唯一一份引用，
     * 不存在两个模块对「这是免费版还是付费版」给出不同答案的可能。
     * 但真正的隔离不在这里——第二版的模块压根不会在免费库里被注册（见 main.ts）。
     * 这个字段服务的是已经被注册起来的那些模块：它们需要知道赛博永生那本库叫什么，
     * 才能在出库单里写清目的地、在提示语里说对话。
     */
    edition: EditionInfo;
}
