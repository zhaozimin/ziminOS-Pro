/**
 * [INPUT]: 依赖 ./core/commands 的 COMMAND_ICONS（标签页图标与左侧边栏同源），
 *          依赖 ./core/constants 的 FolderCountTarget/RecentFilesSort 与 ./core/device 的 FilePathScope
 *          （计数口径、最近文件排法与复制口径的显示名各按它们建一张表）
 * [OUTPUT]: 对外提供设置页的注入契约 SettingActions（含 Eagle 配对/检测/断开/状态），
 *           与它的三张数据表——
 *           TABS（八张标签页的身份）、TEXTS（全部界面文案）、
 *           TEXT_FIELDS 与 BOOK_TAG_PREFIX_FIELD（文本框）、FOLDER_COUNT_LABELS、
 *           RECENT_SORT_LABELS 与 FILE_PATH_SCOPE_LABELS（三个下拉框的显示名），
 *           连同它们的类型 TabId/SettingsTab/BooleanSettingKey/TextSettingKey/TextField/TextFieldSpec
 * [POS]: 设置页的**数据模型**，回答「这一页有什么」；隔壁 settings.ts 回答「它怎么画出来」。
 *        两者分家不是为了凑行数，是因为它们的变更理由不同：
 *        加一个设置项、改一句文案、调一次字段顺序，动的都是这里的表，与渲染无关；
 *        改滚动行为、改标签栏样式、改折叠区画法，动的都是那边的类，与有哪些设置无关。
 *        本文件零渲染代码、零 obsidian 依赖（图标名只是字符串），
 *        因此「这个库到底有哪些设置」这个问题，读一个文件就能答完
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { COMMAND_ICONS } from './core/commands';
import type { FolderCountTarget, RecentFilesSort } from './core/constants';
import type { FilePathScope } from './core/device';

// ============================================================
// 八张标签页：一页一个系统模块
// ============================================================

/**
 * 页标识。取值一律与 modules/ 下的目录同名——同名不是巧合而是纪律：
 * 设置页的分页若与代码的模块边界对不上，学员问「客户的设置在哪」时，
 * 答案就会取决于当初谁把它排在了哪一段。
 *
 * Eagle、appearance、about 等模块刻意没有自己的页，判据是同一条——页面按用户找设置的语境分：
 * Eagle 附件就是粘贴/拖入时发生的编辑行为，住 editing；
 * **一个控件撑一整页是把分页做成摆设**：
 * appearance 只有一个开关、about 只有一张名片（v0.9.2 拍板），
 * 而它们本就天然属于「开荒」（外观是开荒交付物的一部分，名片是这套交付物的落款）；
 * explorer 反过来说明了同一条判据的另一半（v0.16.0）：它的三项——开不开、数什么、
 * 含不含子文件夹——彼此独立，缺一个就说不完整，而它管的又是屏幕上那棵目录树、
 * 不属于任何一套笔记；凑不成一页的是外观开关那一个控件，不是这三个。
 * v0.17.0 的 editing 同理拿到自己的一页，并在同一版把 format 并了进来（用户明令：
 * 「排版和编辑应该算作一起，它们属于一类」）——这一条判据比前几条都直白：
 * 两者发生在同一个时刻。你在编辑器里敲字，粘贴变成链接、光标记住位置、
 * 走开之后这一篇被整理成标准写法，是同一件事的三个瞬间；
 * 而「排版」若单列成页，学员就得先分清「整理格式」算不算编辑才知道该翻哪一页。
 * 页内切段：两个开关在前，「排版」一道小标题带着它的自动开关与九条规则在后。
 * legacy 那三条**没有**页，判据同样是这一条的反面——
 * 它整个模块只有「摆不摆出来」这一个问题，而那正是「边栏」页早已在回答的问题，
 * 三条命令自动出现在那张清单里，一个新字段都不需要。
 * books 的设置（标签前缀、标签条数、微信读书的连接）住在「项目」页里，
 * 理由不是它小，是**一本书就是一个项目**——书落在项目目录、走项目的四态流转归档，
 * 给它单开一页等于在界面上否认代码里那条已经成立的事实。
 *
 * clients 也不再单列（v0.14.0）。它曾经单列，理由与 COMMAND_GROUPS 里单列成组的
 * 是同一条：客户与人脉在业务上是两个物种。那条理由对**命令**仍然成立——
 * 建一个人脉和建一个客户是两件事，分组色也不同；但对**设置**不成立：
 * 两页加起来只有四个字段，其中两个还是同一种东西（人脉目录 / 客户目录）。
 * 分页的意义是「一页看完就不必再往下翻」，而不是「每个物种都得有张页」；
 * 一张只有一个目录框的页，翻到它的人只会以为自己漏了什么。
 * 页内仍按「人脉」「客户」切成两段——分的是段落，不是页。
 */
export type TabId =
    | 'setup'
    | 'projects'
    | 'inspiration'
    | 'review'
    | 'contacts'
    | 'editing'
    | 'explorer'
    | 'ribbon';

/** 一张标签页的全部身份：标签栏上的那枚按钮，与它翻开之后的那句页头 */
export interface SettingsTab {
    readonly id: TabId;
    /** 标签上的短名。八张一律两个字——长短不齐的标签会让人以为它们不是一类东西 */
    readonly label: string;
    /**
     * 这个模块的视觉身份，取自 COMMAND_ICONS——与左侧边栏、命令面板同一套笔画图形。
     * 标签与页头共用同一枚，用户因此知道自己翻开的正是刚点的那张。
     * 曾经是 emoji：十枚彩色符号排成一行，与这套系统其余图标全不同源，像贴纸不像界面。
     */
    readonly icon: string;
    /** 页头上的全名，带版本号 */
    readonly module: string;
    /** 交付状态，即页头那句「这一页管的是什么、跑没跑起来」 */
    readonly status: string;
}

/**
 * 八张页，顺序即学员的使用顺序，也正好是 main.ts 的装配顺序与命令的注册顺序：
 * 先开荒，再是每天在用的三套（项目、灵感、复盘），然后是关系与生意（人脉与客户合成一页），
 * 最后三张管的不是笔记内容而是你与屏幕之间的事（编辑、文件、边栏）。
 * 这三张的先后是从「手」走到「屏幕」：编辑管你打字时发生什么（含排版），
 * 文件管那棵树告诉你什么，边栏管最左边那一列摆着什么。
 * 边栏排在最末不是随手放的——main.ts 里它必须最后装配（它照着命令花名册摆图标，
 * 摆的时候花名册必须已经收齐），而这张表承诺自己的顺序就是装配顺序。
 *
 * 外观开关与作者名片住在「开荒」页里而不各占一页：一个控件撑一整页是把分页做成摆设，
 * 且它们本就是开荒交付物的一部分与落款（见 TabId 的注释）。
 *
 * 这张表同时喂两处：标签栏上那枚两个字的按钮，与每页页头那句「这一页是谁、跑没跑起来」。
 * 一处事实两处呈现，因此不存在「标签上写着排版、页头却是另一句」这种事。
 *
 * 曾经还有第三处——开荒页上一份逐行列出全部模块的清单。它被摘掉了，
 * 理由是标签栏本身就是那份清单：八张页一直摆在屏幕最上方，点一下即到，
 * 再在首页把同样八行重列一遍，是把「索引」误当成了「介绍」。
 * status 那句话没有跟着一起消失，它搬进了各页页头——在那儿它回答的是「我现在在哪、这页管什么」，
 * 而不是「这套系统都有些什么」。
 */
export const TABS: readonly SettingsTab[] = [
    {
        id: 'setup',
        label: '开荒',
        icon: COMMAND_ICONS.vault,
        module: '开荒 v1',
        status: '运行中 · 七个文件夹、模板与导航，再点一次只补齐缺失',
    },
    {
        id: 'projects',
        label: '项目',
        icon: COMMAND_ICONS.project,
        module: '项目管理 v1',
        status: '运行中 · 建项目、卡片登记、四态流转；读书笔记也住在这里（一本书就是一个项目）',
    },
    {
        id: 'inspiration',
        label: '灵感',
        icon: COMMAND_ICONS.inspiration,
        module: '灵感收集 v1',
        status: '运行中 · Dataview 未完成任务视图已就绪',
    },
    {
        id: 'review',
        label: '复盘',
        icon: COMMAND_ICONS.daily,
        module: '复盘 v1',
        status: '运行中 · 五级周期笔记、主题链与项目数据共五个视图',
    },
    {
        id: 'contacts',
        label: '人脉',
        icon: COMMAND_ICONS.contact,
        module: '人脉与客户 v1',
        status:
            '运行中 · 新建人脉、记人情，档案与 MOC 共八个视图；' +
            '客户 MOC 默认随开荒生成，以人物、金额、交付和创建日期汇总客户',
    },
    {
        id: 'editing',
        label: '编辑',
        icon: COMMAND_ICONS.editing,
        module: '编辑与排版 v1',
        status:
            '运行中 · 选中文字粘一条网址就成外链、每篇笔记记住上次的光标位置，' +
            '加九条标准 Markdown 写法（改完走开就替你整理）',
    },
    {
        id: 'explorer',
        label: '文件',
        icon: COMMAND_ICONS.explorer,
        module: '文件浏览器 v2',
        status: '运行中 · 文件夹计数、最近文件清单与状态栏当前路径',
    },
    {
        id: 'ribbon',
        label: '边栏',
        icon: COMMAND_ICONS.dock,
        module: '左侧边栏 v1',
        status: '运行中 · 三十八条命令配 Pikaicons 图标，默认摆出十条',
    },
];

// ============================================================
// 注入契约
// ============================================================

/**
 * 设置页干不了、必须由 main 递进来的十二件事。
 *
 * 纯行为开关仍无需同步：粘贴监听与光标记忆每次触发都现读设置对象。
 * Eagle 的五个洞不是同步 DOM，而是把配对、鉴权、HTTP 与本机包路径留在领域模块里，
 * 设置页只发起用户动作、显示业务结果。
 *
 * 用一个对象而不是一串位置参数：多组函数拥有相同签名，
 * 摆成位置参数的话调换顺序照样能通过编译，出的错却是「改了外观开关，边栏跟着动」——
 * 这种错没有任何编译期信号，只能靠人肉眼盯着几行长长的实参对齐。
 * 三处显隐同步并列摆在这里，也正好说明它们是同一类东西：
 * 已经画在屏幕上的 DOM 不会自己再问一次设置。
 */
export interface SettingActions {
    /** 执行一次开荒。名单住在装配点，设置页因此不认识参与开荒的模块 */
    readonly initialize: () => Promise<void>;
    /**
     * 开微信读书的扫码登录窗口。登录逻辑住在 books 模块，设置页因此不 import 它。
     * 返回是否连上；设置页不看这个值——它连完就整页重建，状态现读设置对象。
     */
    readonly connectWeread: () => Promise<boolean>;
    /**
     * 断开微信读书：清掉持久 Cookie，也清掉同一会话里那份内存令牌。
     *
     * 它与 connectWeread 分成两件事而不是一个 toggle，是因为两者的失败语义不同——
     * 连接会失败（扫码超时、网络断），断开不会：本机能删掉的东西一定删得掉。
     * 由 main 注入而非设置页自己清字段，是 v0.16.0 审计的结论：
     * 只把 data.json 里那串 Cookie 抹掉并不算断开，同一会话的内存令牌还在，
     * 而「断开」这件事的边界只有 books 模块自己知道。
     */
    readonly disconnectWeread: () => Promise<void>;
    /** 让状态栏那个按钮按当前设置重新决定显隐 */
    readonly syncAppearanceSwitch: () => void;
    /** 让左侧边栏那列图标按当前设置重新决定各自显隐 */
    readonly syncRibbon: () => void;
    /**
     * 让「文件」这一页管的三样东西按当前设置重画一次：文件夹计数、最近文件那张清单、
     * 状态栏那一块路径。收成一个洞而不是三个，因为它们同属一个模块——
     * 设置页不必知道那个模块内部由几个文件把这三样画出来。
     */
    readonly syncExplorer: () => void;
    /** Eagle 伴侣的配对、检测、断开与状态；凭据与 HTTP 细节不进设置页 */
    readonly pairEagle: () => Promise<boolean>;
    readonly testEagle: () => Promise<boolean>;
    readonly disconnectEagle: () => Promise<void>;
    readonly describeEagleStatus: () => Promise<string>;
    readonly revealEaglePackage: () => Promise<void>;
    /** 把作者名片画进开荒页尾。名片住在 about 模块，设置页因此不认识它 */
    readonly renderAbout: (el: HTMLElement) => void;
}

// ============================================================
// 界面文案（全中文，集中在此，避免同一句话散落在多处）
// ============================================================

export const TEXTS = {
    initName: '初始化笔记库',
    initButton: '初始化',
    initPending: '尚未初始化。点右边的按钮，为这个库铺好七个文件夹、模板与导航，并长出人脉与复盘两套系统。',
    initReadyPrefix: '已就绪 ✓ 首次开荒于 ',
    initReadySuffix: '。再点一次只补齐缺失的文件，不会覆盖你写过的任何笔记。',

    autoCardName: '新建笔记自动登记为卡片',
    autoCardDesc: '在项目或领域目录里新建空笔记时，自动补齐标准字段，并链回它所属的 MOC。关掉后可用命令「初始化当前卡片」手动登记。',
    autoUpdatedName: '自动维护 updated 时间',
    autoUpdatedDesc: '改完带 YAML 的笔记、停手两秒后，自动记下这次修改时间。没有 YAML 的笔记一个字都不动。',

    booksHeading: '读书笔记',
    booksIntro:
        '一本书就是一个项目：它落在项目目录里，读完用「完成项目」归档，所以它的设置也住在这一页。' +
        '书目字段（作者、出版社、ISBN、评分）没有开关——豆瓣怎么写就怎么落，那是事实不是口味。' +
        'UID 直接写这本书的 ISBN；豆瓣没登记书号时才退回时间戳。',
    bookTagCountName: '标签条数',
    bookTagCountDesc:
        '豆瓣的分类按投票数从高到低排，取前几个。往后很快滑向个人化的碎语，所以这个数问的不是「够不够」，是「从哪儿开始变成噪音」。',

    wereadName: '微信读书',
    wereadConnected:
        '已连接。「读一本书」与「同步这本书的划线」会自动把你在微读上的划线与想法取回来。' +
        '断开只清掉本机存的这份登录凭据，不动你在微信读书那边的任何东西。',
    wereadDisconnected:
        '未连接。连上之后，读书命令会多一处划线来源（另两处是本机的苹果图书与 Kindle，不需要连接）。' +
        '连接走扫码，插件全程不碰你的账号和密码。',
    wereadMobile: '扫码登录只在电脑版可用。手机上仍可用「导入读书划线」把划线粘贴进来。',

    inspirationPositionName: '插入位置',
    inspirationPositionDesc: '决定新灵感写在标题区或整篇正文的头尾。置顶会自动避开 YAML、页面标题和 Dataview 筛选区。',
    inspirationFormatName: '单条格式',
    inspirationFormatDesc: '必须保留 {{content}}；还可使用 {{date}}、{{time}}、{{datetime}}。',

    ribbonIntro:
        '勾上的命令会变成最左边那一列图标，点一下就执行，不用再打开命令面板。' +
        '图标是 Pikaicons，跟着主题的颜色与描边粗细走。' +
        '最后那一组「旧版」是灰的，因为它们做的是 Obsidian 自己的事——' +
        '切换笔记库、帮助、设置这三个按钮在 Obsidian 1.6 之后被挪进了文件浏览器底下，' +
        '这三条把它们请回最左边那一列；位置归你，摆出来之后直接拖。' +
        '取消勾选后，它在「设置 → 外观 → 功能区」和手机端的边栏菜单里要重启 Obsidian 才消失；' +
        '反过来，你在那两处藏掉的图标，这里勾上也不会出现——那是 Obsidian 自己的开关，得回那儿打开。',
    ribbonCountPrefix: '已摆出 ',
    ribbonCountSeparator: ' / ',
    ribbonCountSuffix: ' 条',

    autoFormatName: '改完走开自动整理',
    autoFormatDesc: '离开一篇刚改过的笔记时，按下面勾选的规则整理它一次；插件自己往笔记里写过东西之后同样会整理。它刻意不动你正开着的那一篇——中文输入法在合成中途被外部改写会吞字，而两秒的停顿在斟酌一句话时太常见。想当场整理，用命令「整理当前笔记格式」。',

    formatHeading: '排版',
    formatIntro:
        '排版与上面两项同住一页，因为它们发生在同一个时刻：你在编辑器里敲字，' +
        '粘贴变成链接、光标记住位置、走开之后这一篇被整理成标准写法。' +
        '下面先决定「要不要替我按」，再决定「按下去做哪几件事」——' +
        '两者不合成一个开关：自动整理关掉之后，命令「整理当前笔记格式」仍照这九条勾选执行。',
    formatRulesHeading: '九条规则',
    formatRulesIntro: '关掉哪一条，整理时就不再执行它。命令与自动整理走的是同一份勾选。',

    appearanceSwitchName: '状态栏外观开关',
    appearanceSwitchDesc: '在右下角状态栏放一个 🎨 按钮，点开就能逐个开关 CSS 片段，不必再进设置翻外观页。关掉只是收起按钮，命令面板里的「打开外观开关」照常可用。',

    folderCountName: '文件夹右侧显示计数',
    folderCountDesc:
        '在左边那棵目录树上，给每个文件夹右侧标一个数字：这里面攒了多少。' +
        '把鼠标停在数字上，笔记数与子文件夹数会一起报出来。' +
        '空文件夹不标数字——一个 0 不解释任何事。关掉时数字当场消失，不留残迹、不用重启。',
    folderCountTargetName: '数什么',
    folderCountTargetDesc:
        '常驻在屏幕上的只有一个数，所以要先说清它数的是什么。' +
        'ziminOS 里的文件夹是容器：01-projects 里装的是项目，一个项目里装的是卡片——' +
        '所以「有多少篇笔记」和「我有几个项目」是同一棵树的两个问题，选你更常问的那个。',
    folderCountRecursiveName: '含子文件夹',
    folderCountRecursiveDesc:
        '开着时，数字是这个文件夹连同它所有后代加起来的总数；关掉只数直接放在这一层的。' +
        '默认开着，因为 01-projects 这种只装文件夹的层在关掉时会显示 0——' +
        '那让它与一个真正的空文件夹长得一模一样。反过来，想让数字回答「我有几个项目」' +
        '而不是「项目里一共多少张卡片」，关掉它才是对的。',

    filePathName: '状态栏显示当前笔记路径',
    filePathDesc:
        '在右下角状态栏显示你此刻这一篇在哪个文件夹里，点一下把路径复制走（复制哪一种见下面那项）。' +
        '关掉只是收起那一块，命令「复制当前笔记路径」照常可用（可以去设置 → 快捷键给它绑个键）。',
    filePathScopeName: '复制哪一种路径',
    filePathScopeDesc:
        '屏幕上那一块永远显示库内路径——它短，且每篇都不同；这一项决定的是「复制走的那一串」。' +
        '库内路径（01-projects/开源之道/开源之道.md）说给 Obsidian 自己听：写双链、跟同一个库的人说我那篇在哪儿。' +
        '本机完整路径（/你的用户目录/笔记库/01-projects/开源之道/开源之道.md）说给库外面听：' +
        '在终端里 cd 过去、拖进别的程序、交给一个智能体去读那个文件。' +
        '把鼠标停在状态栏那一块上，会先告诉你这一下将复制什么。' +
        '手机上没有本机路径这回事，那时它自动退回库内路径，并说一声为什么。',

    recentHeading: '最近文件',
    recentIntro:
        '一张「我刚才在哪几篇里」的清单，住在右侧栏。' +
        '用命令「打开最近文件」或左侧边栏那只钟把它请出来；它不会自己占住侧栏——' +
        '那是找不回某一篇时才想起来的工具，不是每天都要看的东西。' +
        '清单的成员永远是你打开过的文件（含模板与系统笔记，导航不该藏东西）。',
    recentLimitName: '显示几条',
    recentLimitDesc:
        '清单最多列几行。记录本身一直留着五十条，所以你把 10 改成 50，立刻就有 50 条，不必从此刻重新攒。',
    recentSortName: '怎么排',
    recentSortDesc:
        '「刚才我在哪」和「我最近改了什么」是两个不同的问题——读了一天资料没动笔的人问前者，写了一天的人问后者。',

    pasteLinkName: '粘贴到选中文字上＝加外链',
    pasteLinkDesc:
        '选中一段文字，直接 Cmd + V 粘一条网址，那段文字就变成指向它的外链。' +
        '四条都满足才会动手：选了字、剪贴板里只有一条**带协议**的网址（www 开头的裸域名不算）、' +
        '选中的文字里没有换行、这次粘贴还没被别的插件处理过。任何一条不满足就原样粘贴。',

    eagleHeading: 'Eagle 附件',
    eagleIntro:
        '默认将粘贴或拖入的图片与附件存入 Eagle，笔记只保留稳定 itemId 链接。' +
        '项目笔记里的附件会自动进入“项目/项目名称”；同一 Eagle 资源库内换文件夹不会影响链接。' +
        '导入失败时明确报错，不会偷偷在 Obsidian 留副本。',
    eagleEnabledName: '附件交给 Eagle',
    eagleEnabledDesc:
        '只在 macOS / Windows 生效。请先安装 ziminOS Eagle 伴侣并完成配对；' +
        '若图片要继续走现有图床，打开下一项。',
    eagleExcludeImagesName: '图片不交给 Eagle（交给图床）',
    eagleExcludeImagesDesc:
        '打开后，单独粘贴或拖入的图片会原样放行，由你已安装的图床插件处理；' +
        'PDF、压缩包、音视频等其他附件仍进 Eagle。ziminOS 不保存图床密钥。' +
        '图片与其他附件请分两次粘贴或拖入。',
    eagleStatusName: '伴侣连接',
    eagleStatusChecking: '正在检查本机 Eagle…',
    eaglePackageName: 'Eagle 伴侣安装包',
    eaglePackageDesc: '伴侣已随 ziminOS 放在本机插件目录；在 Eagle 中安装这份 .eagleplugin 后再回来配对。',
    eaglePortName: '本机端口',
    eaglePortDesc: '默认 23119，必须与 Eagle 伴侣窗口中的端口一致。端口不写进笔记。',
    eagleFolderName: '非项目附件的 Eagle 文件夹 ID（可选）',
    eagleFolderDesc:
        '项目目录和归档目录中的笔记会自动进入“项目/项目名称”，不读取这里。' +
        '只有项目外的附件才使用此 ID；留空即进入当前资源库未归类区。',

    rememberCursorName: '记住每篇笔记的光标位置',
    rememberCursorDesc:
        '离开一篇笔记时记下光标在第几行、滚动条在哪儿，下次打开就回到那里，重启 Obsidian 也还在。' +
        '它不与你的点击抢：从一条带锚点的双链跳进来时，Obsidian 已经把光标放好了，这时它不插手。' +
        '位置记在插件目录的 cursor-positions.json 里，不进你的设置文件，也不写进任何一篇笔记。',

    advancedHeading: '高级设置（一般不用改）',
    advancedSuffixPrefix: '课程默认值 ',
    advancedSuffixTail: '，改前三思。',
} as const;

// ============================================================
// 文本字段：谁住在哪一页，谁该被收进折叠区
// ============================================================

/**
 * 最近文件的两种排法在下拉框里各自叫什么。
 * 与下面那张口径表同因同法：加一种排法却忘了给它起名，在这里是编译错。
 */
export const RECENT_SORT_LABELS: Readonly<Record<RecentFilesSort, string>> = {
    opened: '按打开时间（最近打开的在最上面）',
    modified: '按修改时间（最近改过的在最上面）',
};

/**
 * 三个计数口径在下拉框里各自叫什么。
 *
 * 建成 `Record<FolderCountTarget, …>` 而不是在渲染处摆三行 addOption 字面量：
 * 往 FOLDER_COUNT_TARGETS 里加一个口径却忘了给它起名，在这里是编译错，
 * 而不是一个在界面上根本选不到的口径——与 count.ts 那张 PICKERS 表同因同法，
 * 一处加口径、两处都必须跟上，两处都由编译器盯着。
 */
export const FOLDER_COUNT_LABELS: Readonly<Record<FolderCountTarget, string>> = {
    notes: '笔记',
    folders: '文件夹',
    all: '全部条目（含附件）',
};

/**
 * 状态栏那一块点下去复制哪一种路径，两个取值在下拉框里各自叫什么。
 *
 * 与上面两张表同因同法：往 FILE_PATH_SCOPES 里加一种口径却忘了给它起名，在这里是编译错。
 * 名字刻意不用「相对 / 绝对」这对术语——学员分不清相对于谁，而「笔记库」与「这台电脑」
 * 是他看得见的两样东西。
 */
export const FILE_PATH_SCOPE_LABELS: Readonly<Record<FilePathScope, string>> = {
    vault: '库内路径（从笔记库根算起）',
    system: '本机完整路径（从这台电脑的根算起）',
};

/** 走开关控件的设置项，全部是布尔字段 */
export type BooleanSettingKey =
    | 'autoCardInit'
    | 'autoUpdated'
    | 'autoFormat'
    | 'showAppearanceSwitch'
    | 'showFolderCount'
    | 'folderCountRecursive'
    | 'showFilePath'
    | 'pasteLinkEnabled'
    | 'eagleEnabled'
    | 'eagleExcludeImages'
    | 'rememberCursor';

/** 可由文本框直接编辑的设置项，全部是字符串字段 */
export type TextSettingKey =
    | 'projectFolder'
    | 'areaFolder'
    | 'archiveFolder'
    | 'bookTagPrefix'
    | 'inspirationFolder'
    | 'inspirationFileName'
    | 'inspirationHeading'
    | 'diaryFolder'
    | 'contactFolder'
    | 'clientSources'
    | 'clientProducts'
    | 'clientFolder'
    | 'dateTimeFormat';

/**
 * 画一个文本框需要知道的全部。
 *
 * 它比下面那张表少两个字段，为的是让**面板也能画文本框**：
 * 读书笔记那几项必须与它的下拉框、连接按钮排在一起，而骨架画的字段一律排在面板之前，
 * 交给骨架就会被拆到两段里去。分成两层之后，进表的带去处、面板自持的不带，没有闲置字段。
 */
export interface TextField {
    readonly key: TextSettingKey;
    readonly name: string;
    /** 说明的前半句；高级字段的后半句由默认值自动补出，保证提示与 DEFAULT_SETTINGS 永不失同步 */
    readonly hint: string;
    /**
     * 是否收进本页末尾那个「高级设置（一般不用改）」折叠区。
     *
     * 判据不是「难不难懂」，是「改了会不会让学员的库与课程讲义对不上」：
     * 目录名与时间格式是课程内容的一部分，所以既要留出口，又不能摆在明面上诱导人去动它；
     * 而客户渠道与产品清单本来就是学员自己的业务数据——产品名只能由他自己写，
     * 把它锁进「一般不用改」里才是真的误导。
     */
    readonly advanced: boolean;
}

/** 一个进了下面那张表的文本框：它还得说清自己住在哪一页、哪一段 */
export interface TextFieldSpec extends TextField {
    /**
     * 它住在哪一页。这个字段回答的其实是「这是谁的设置」——
     * 目录名归属它服务的那个模块，而不是笼统地归属「高级」。
     */
    readonly tab: TabId;
    /**
     * 页内小标题。一页只服务一个系统时不需要它（绝大多数如此）；
     * 人脉页同时装着人脉与客户两套，段名就是那句「以下是谁的设置」。
     * 相邻两行的段名一变就切一道标题——与边栏页按分组切标题是同一套画法，
     * 段的顺序因此不需要另一张表，它已经写在这张表的行序里了。
     */
    readonly section?: string;
}

/** 十一个进表的文本字段。同一页内的先后即它们在页面上的先后 */
export const TEXT_FIELDS: readonly TextFieldSpec[] = [
    { key: 'projectFolder', tab: 'projects', name: '项目目录', hint: '正在推进的项目放在这里；读书笔记也落在这里。', advanced: true },
    { key: 'areaFolder', tab: 'projects', name: '领域目录', hint: '长期关注、没有终点的领域放在这里。', advanced: true },
    { key: 'archiveFolder', tab: 'projects', name: '归档目录', hint: '完成、暂停、放弃的项目会搬到这里；人脉档案搬进来即退出全部名录。', advanced: true },

    { key: 'inspirationFolder', tab: 'inspiration', name: '文件夹', hint: '灵感笔记放在哪个文件夹。相对于笔记库根目录。', advanced: false },
    { key: 'inspirationFileName', tab: 'inspiration', name: '笔记名称', hint: '灵感写入哪一篇笔记；没写 .md 时会自动补齐。', advanced: false },
    { key: 'inspirationHeading', tab: 'inspiration', name: '定位标题', hint: '选择标题插入时，用它定位具体区域。可写“灵感集”或完整 Markdown 标题。', advanced: false },

    { key: 'diaryFolder', tab: 'review', name: '复盘目录', hint: '日/周/月/季/年五级复盘的时间轴根目录，五个子目录由它派生。', advanced: true },

    { key: 'clientSources', tab: 'contacts', section: '客户', name: '客户渠道', hint: '「新建客户」的渠道候选，用逗号分隔。走选择而非手打，统计才不会被同义写法打散。', advanced: false },
    { key: 'clientProducts', tab: 'contacts', section: '客户', name: '产品清单', hint: '「增加付费」的产品候选，用逗号分隔。写你自己在卖的东西。', advanced: false },
    { key: 'contactFolder', tab: 'contacts', section: '人脉', name: '人脉目录', hint: '人物档案平铺存放在这里；视图靠 type 认人，挪走也不影响。', advanced: true },
    { key: 'clientFolder', tab: 'contacts', section: '客户', name: '客户目录', hint: '客户 MOC 与付费用户档案存放在这里；视图靠 type 识别客户。', advanced: true },

    { key: 'dateTimeFormat', tab: 'setup', name: '时间格式', hint: 'created 与 updated 字段的写法，moment 语法。', advanced: true },
];

/**
 * 书籍标签的前缀。它不进上面那张表，因为它必须紧挨着「标签条数」那个下拉框——
 * 一个说前缀叫什么、一个说取几条，拆开之后两句话谁也说不完整。
 */
export const BOOK_TAG_PREFIX_FIELD: TextField = {
    key: 'bookTagPrefix',
    name: '标签前缀',
    hint: '豆瓣的「方法论」会写成 #书籍/方法论。前缀让整个书架的分类成片，不与灵感、卡片里的同名标签混在一起。',
    advanced: false,
};
