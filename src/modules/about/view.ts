/**
 * [INPUT]: 依赖 core/codeblock 的 ViewDefinition 类型与 ./avatar 的 AVATAR_DATA_URI；
 *          视图名 ABOUT_VIEW 是本文件的局部常量——v0.10.0 名片从导航搬进 README 之后，
 *          再没有第二个模块需要它，于是从 core/constants 收了回来
 * [OUTPUT]: 对外提供 renderAboutPanel（把作者名片画进任意容器）与 aboutViews（「关于作者」视图）
 *           名片自 v0.14.0 起以「致谢」收尾：上半是思路来源（学到了什么，逐条写明），
 *           下半是随库交付资产的署名（许可要求，非客套）；
 *           v0.15.0 起同步署名编译进 main.js 的 lunar-typescript 与内置节假日快照的 holiday-cn
 * [POS]: 关于作者模块的全部。它把作者的入口编译进 main.js——插件传到哪，这张名片就跟到哪，
 *        不依赖库里任何一篇笔记还在不在。同一个渲染函数挂两处：开荒写进导航页尾的
 *        「关于作者」视图块，以及设置页开荒页尾的落款（没开过荒、只拿到 main.js 的库也看得见）。
 *        版式（v0.9.4 定稿）：最上是两枚站点磁贴（头像照片＝官网、星图＝插件教程），
 *        站是国内外一体的，一枚磁贴装 .cn/.com 两个域名、各自成行可点；
 *        磁贴之下是频道胶囊，按地域切成上「海外」下「中国大陆」两区——
 *        平台才分边，站不分边；分组本身就是「哪边快用哪边」的解释。
 *        胶囊 = 品牌原色图标 + 作者的平台账号名。
 *        头像以 data URI 编译进 main.js（≈19KB，渲染零网络请求，红线不破）；
 *        星图 logo 逐字取自 edu 站 favicon.svg，内联 SVG 最清晰。
 *        频道图形取自 Simple Icons（CC0，见 docs/第三方组件.md）：Gitee/YouTube/B站/小红书
 *        按官方色值，GitHub 与 X 的官方原色本就是黑白两版，
 *        取 currentColor 随主题走正是「原本的颜色」
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ViewDefinition } from '../../core/codeblock';
import { AVATAR_DATA_URI } from './avatar';

/**
 * 「关于作者」视图的名字。
 * 唯一的库内消费方是 vault/README.md 里那个手写的代码块——README 是静态交付物，
 * import 不到常量，所以改这个名字必须同步改 README，两处都在本仓库里，肉眼可核。
 */
const ABOUT_VIEW = '关于作者';

// ============================================================
// 链接与图形（本模块唯一的数据源，改链接只改这里）
// ============================================================

/** 站点磁贴里的一个域名：写什么、指哪去、部署在哪边 */
interface SiteDomain {
    readonly domain: string;
    readonly url: string;
    readonly region: string;
}

/** 站点磁贴：logo、站名、一句身份说明，加国内外两个域名——同一个站，一枚磁贴装完 */
interface Site {
    readonly logo: 'avatar' | 'edu';
    readonly name: string;
    readonly sub: string;
    readonly domains: readonly SiteDomain[];
}

/** 频道胶囊：品牌图形 + 作者在该平台的账号名 */
interface Channel {
    /** 平台名，进 aria-label 与悬停提示 */
    readonly name: string;
    /** 胶囊上的备注，一律是作者的平台账号名 */
    readonly label: string;
    readonly url: string;
    /** Simple Icons 的 24 格单路径图形 */
    readonly path: string;
    /** 品牌色；GitHub 与 X 的官方标就是黑白两版，留空取 currentColor 随主题走 */
    readonly color?: string;
    /** 文字标（如小红书）：没有色块打底的纯字形，常规尺寸认不清，渲染时放大一档 */
    readonly wordmark?: boolean;
}

/** 一个频道分区：区名 + 一排胶囊。只有频道分海外/大陆，站点磁贴国内外一体 */
interface ChannelRegion {
    readonly label: string;
    readonly channels: readonly Channel[];
}

/* 六段 path 逐字取自 simple-icons@15 的 gitee/github/x/youtube/bilibili/xiaohongshu，不手改坐标 */
const GITEE_PATH =
    'M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z';

const GITHUB_PATH =
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

const X_PATH =
    'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z';

const YOUTUBE_PATH =
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';

const BILIBILI_PATH =
    'M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z';

const XIAOHONGSHU_PATH =
    'M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z';

/** 两枚站点磁贴：同一个站的国内外两个域名装在同一枚里，站是一个站，只是门有两扇 */
const SITES: readonly Site[] = [
    {
        logo: 'avatar',
        name: '官网',
        sub: '赵子民的个人主页',
        domains: [
            { domain: 'zhaozimin.cn', url: 'https://zhaozimin.cn', region: '大陆' },
            { domain: 'zhaozimin.com', url: 'https://zhaozimin.com', region: '海外' },
        ],
    },
    {
        logo: 'edu',
        name: '插件教程',
        sub: '系统课与学习地图',
        domains: [
            { domain: 'edu.zhaozimin.cn', url: 'https://edu.zhaozimin.cn', region: '大陆' },
            { domain: 'edu.zhaozimin.com', url: 'https://edu.zhaozimin.com', region: '海外' },
        ],
    },
];

/**
 * 频道胶囊上「海外」下「中国大陆」：平台才分边，分组即解释。
 *
 * 两行**同序**：代码 → 图文 → 长视频（GitHub / X / YouTube，Gitee / 小红书 / 哔哩哔哩）。
 * 这不是排版洁癖——两行并排摆着，读者会不自觉地按列去对，
 * 列对不齐就得逐个读标签才知道哪个是哪个，而分组本来就是为了省掉这一步。
 * 长视频排在最后也有它自己的理由：那是三者里门槛最高的一个入口，
 * 摆在末位符合读者从轻到重的浏览顺序。加频道时照这条序插进去。
 */
const CHANNEL_REGIONS: readonly ChannelRegion[] = [
    {
        label: '海外',
        channels: [
            { name: 'GitHub', label: 'zhaozimin', url: 'https://github.com/zhaozimin', path: GITHUB_PATH },
            { name: 'X', label: '@ZiminZhao', url: 'https://x.com/ZiminZhao', path: X_PATH },
            { name: 'YouTube', label: '@ZiminZhao', url: 'https://www.youtube.com/@ZiminZhao', path: YOUTUBE_PATH, color: '#FF0000' },
        ],
    },
    {
        label: '中国大陆',
        channels: [
            { name: 'Gitee', label: 'ziminzhao', url: 'https://gitee.com/ziminzhao', path: GITEE_PATH, color: '#C71D23' },
            { name: '小红书', label: '光头obsidian教程', url: 'https://xhslink.cn/m/3NnLHIc6lQA', path: XIAOHONGSHU_PATH, color: '#FF2442', wordmark: true },
            { name: '哔哩哔哩', label: '光头obsidian教程', url: 'https://b23.tv/E2UTPzQ', path: BILIBILI_PATH, color: '#00A1D6' },
        ],
    },
];

// ============================================================
// 致谢
// ============================================================

/** 一条致谢：项目名、它的地址，以及**我们究竟从它那里学到了什么** */
interface Credit {
    readonly name: string;
    readonly url: string;
    /** 一句话，必须具体到某个决定。写「很棒的插件」等于没写 */
    readonly what: string;
}

/**
 * 思路致谢：一行代码都没抄，但每一条都改变了 ziminOS 的某个决定。
 *
 * 名单的判据只有一条——**没有它，这里会走错**。因此每条后面那句话必须指得出具体的东西：
 * 是它让我们知道豆瓣的 JSON 接口走不通、是它让我们知道苹果图书的划线躺在哪个 SQLite 里。
 * 「优秀的开源项目」这种句子一条都不要，那是客套不是致谢；
 * 读者看完这张表应该确切地知道欠了谁什么，而不只是知道我们心怀感激。
 *
 * 排序即欠得多少，不是字母序。
 */
const CREDITS: readonly Credit[] = [
    {
        name: 'obsidian-weread-plugin',
        url: 'https://github.com/zhaohongxuan/obsidian-weread-plugin',
        what: '微信读书的扫码登录与三个取数接口。「开一个真浏览器窗口让用户自己扫，成功后取走 Cookie」这条路是它走通的——否则只能让学员去开发者工具里手抄一长串 Cookie。',
    },
    {
        name: 'obsidian-kindle-plugin',
        url: 'https://github.com/hadynz/obsidian-kindle-plugin',
        what: 'Kindle 的 My Clippings.txt 该去哪儿找、那份纯文本的分隔与元信息该怎么切。',
    },
    {
        name: 'obsidian-apple-books-highlights-plugin',
        url: 'https://github.com/bandantonio/obsidian-apple-books-highlights-plugin',
        what: '苹果图书的划线原来就躺在本机两个 SQLite 里，连库路径与那两张表的字段名都是从它那儿认得的。',
    },
    {
        name: 'obsidian-douban',
        url: 'https://github.com/Wanxp/obsidian-douban',
        what: '豆瓣的 JSON 接口对非浏览器一律拒绝、而 HTML 页面照常返回，以及被反爬拦下时页面长什么样——省了我们一整轮试错。',
    },
    {
        name: 'Dust Calendar',
        url: 'https://github.com/a-nano-dust/dust-obsidian-calendar',
        what: '从日期、周数、月、季度到年的可点时间维度，让日历不只是展示，而是周期笔记的导航坐标。ziminOS 重写了实现，没有复制其代码。',
    },
    {
        name: 'QuickAdd',
        url: 'https://github.com/chhoumann/quickadd',
        what: 'ziminOS 的建项目、卡片登记与四态流转，本来是跑在它上面的三份脚本。这套系统是从那三份脚本长出来的。',
    },
    {
        name: 'Obsidian Linter',
        url: 'https://github.com/platers/obsidian-linter',
        what: '「改完走开就替你整理」这件事本来该装它。排版模块那九条规则是照着它的行为重写的，为的是让学员少装一个插件。',
    },
    {
        name: 'File Explorer Note Count',
        url: 'https://github.com/ozntel/file-explorer-note-count',
        what: '「计数该长在文件夹名右侧」这个交互结论是它给的。它读的是文件浏览器视图的 view.fileItems——正是看清那个字段不在 obsidian.d.ts 里，我们才改走公开的 getLeavesOfType。',
    },
    {
        name: 'Recent Files',
        url: 'https://github.com/tgrosinger/recent-files-obsidian',
        what: '「最近」的成员是你**打开过**的、而不是库里改动过的。这条语义分得清清楚楚，于是一个从没打开过的文件不会突然出现在清单里让人愣一下。',
    },
    {
        name: 'Remember cursor position',
        url: 'https://github.com/dy-sh/obsidian-remember-cursor-position',
        what: '光标位置该在**离开一篇时**记下，而不是边打字边记——就这一条把定时器从方案里彻底去掉了。',
    },
    {
        name: 'Paste URL into selection',
        url: 'https://github.com/denolehov/obsidian-url-into-selection',
        what: '「选中文字 + 粘贴网址 = 外链」这个动作本身。它没有许可证，一个字节都不能转发，但这个动作值得留下来。',
    },
    {
        name: 'Show Current File Path',
        url: 'https://github.com/ravimashru/obsidian-show-file-path',
        what: '当前路径该住在右下角状态栏、点一下就复制——位置与交互都照它。',
    },
    {
        name: 'Legacy Vault Switcher',
        url: 'https://github.com/Quorafind/Obsidian-Legacy-Vault-Switcher',
        what: 'Obsidian 1.6 挪走的那三个按钮请得回来。它同样没有许可证不能转发，但它先证明了这件事做得成。',
    },
];

/** 随库或随 main.js 交付的第三方资产：这一段是许可要求的署名，不是客套 */
const BUNDLED: readonly Credit[] = [
    { name: 'Dataview', url: 'https://github.com/blacksmithgu/obsidian-dataview', what: 'MIT' },
    { name: 'Outliner', url: 'https://github.com/vslinko/obsidian-outliner', what: 'MIT' },
    {
        name: 'Quiet Outline',
        url: 'https://github.com/guopenghui/obsidian-quiet-outline',
        what: 'MIT',
    },
    { name: 'Minimal', url: 'https://github.com/kepano/obsidian-minimal', what: 'MIT' },
    {
        name: 'Style Settings',
        url: 'https://github.com/community-archive/obsidian-style-settings',
        what: 'GPL-3.0',
    },
    { name: 'Pikaicons', url: 'https://pikaicons.com', what: 'MIT' },
    { name: 'Simple Icons', url: 'https://simpleicons.org', what: 'CC0' },
    { name: 'lunar-typescript', url: 'https://github.com/6tail/lunar-typescript', what: 'MIT' },
    { name: 'holiday-cn', url: 'https://github.com/NateScarlet/holiday-cn', what: 'MIT' },
    { name: '霞鹜文楷 GB 屏幕版', url: 'https://github.com/lxgw/LxgwWenKai-Screen', what: 'OFL' },
    { name: '思源宋体 CN', url: 'https://github.com/adobe-fonts/source-han-serif', what: 'OFL' },
    { name: '朱雀仿宋', url: 'https://github.com/TrionesType/zhuque', what: 'OFL' },
    { name: '霞鹜新晰黑＋', url: 'https://github.com/lxgw/LxgwNeoXiHei', what: 'IPA' },
];

// ============================================================
// 渲染
// ============================================================

/** 星图 logo，逐字取自 edu 站 favicon.svg（墨底 + 纸色折线 + 一颗朱砂点） */
function renderEduLogo(el: HTMLElement): void {
    const svg = el.createSvg('svg', {
        cls: 'ziminos-about-logo-square',
        attr: { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    });

    svg.createSvg('rect', { attr: { width: '24', height: '24', rx: '5', fill: '#161616' } });
    svg.createSvg('path', {
        attr: {
            d: 'M4 16 L10 7 L15 12 L20 5',
            stroke: '#F5F3EE',
            'stroke-width': '1.5',
            fill: 'none',
            'stroke-linecap': 'round',
        },
    });
    svg.createSvg('circle', { attr: { cx: '4', cy: '16', r: '2', fill: '#F5F3EE' } });
    svg.createSvg('circle', { attr: { cx: '10', cy: '7', r: '2', fill: '#F5F3EE' } });
    svg.createSvg('circle', { attr: { cx: '15', cy: '12', r: '2.4', fill: '#E8503A' } });
    svg.createSvg('circle', { attr: { cx: '20', cy: '5', r: '2', fill: '#F5F3EE' } });
}

/** 一枚站点磁贴：logo + 站名 + 一句身份说明，下面国内外两个域名各自成行、各自可点 */
function renderSite(row: HTMLElement, site: Site): void {
    const tile = row.createDiv({ cls: 'ziminos-about-tile' });
    const head = tile.createDiv({ cls: 'ziminos-about-tile-head' });

    if (site.logo === 'avatar') {
        // 刻意不用 <img>：外观包的「图片居中」片段（以及互联网上同款流行片段）
        // 会给一切 img 加 margin:auto !important，在 flex 行里就是把头像推到中间、文字挤到边上。
        // 背景图 div 不是 img，任何针对 img 的主题规则都够不着它——名片是第一屏广告，必须防身
        const avatar = head.createDiv({ cls: 'ziminos-about-logo-round' });

        avatar.style.backgroundImage = `url("${AVATAR_DATA_URI}")`;
    } else {
        renderEduLogo(head);
    }

    const text = head.createDiv({ cls: 'ziminos-about-tile-text' });

    text.createDiv({ cls: 'ziminos-about-tile-name', text: site.name });
    text.createDiv({ cls: 'ziminos-about-tile-sub', text: site.sub });

    const list = tile.createDiv({ cls: 'ziminos-about-domains' });

    for (const entry of site.domains) {
        const link = list.createEl('a', {
            cls: 'ziminos-about-domain',
            href: entry.url,
            attr: { rel: 'noopener' },
        });

        link.createSpan({ text: entry.domain });
        link.createSpan({ cls: 'ziminos-about-domain-region', text: entry.region });
    }
}

/** 一枚频道胶囊：品牌原色图标 + 平台账号名 */
function renderChannel(row: HTMLElement, channel: Channel): void {
    const pill = row.createEl('a', {
        cls: 'ziminos-about-pill',
        href: channel.url,
        attr: { 'aria-label': channel.name, title: channel.name, rel: 'noopener' },
    });
    const icon = pill.createSvg('svg', {
        cls: 'ziminos-about-pill-icon',
        attr: { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
    });

    // 第二个类名走 addClass 而不塞进 cls：带空格的类名串怎么被拆，取决于实现而非类型
    if (channel.wordmark) icon.addClass('is-wordmark');

    icon.createSvg('path', { attr: { d: channel.path } });

    // 品牌色写在元素上而不进 styles.css：它是这条数据的一部分，与主题无关也不该被主题改
    if (channel.color) icon.style.color = channel.color;

    pill.appendText(channel.label);
}

/**
 * 把作者名片画进任意容器。
 * 不接收 ctx 也不读设置：内容是编译期常量，画出来的东西在任何库里都一样。
 */
export function renderAboutPanel(el: HTMLElement): void {
    const panel = el.createDiv({ cls: 'ziminos-about' });

    // 两枚站点磁贴在最上：站是国内外一体的，不参与地域分组
    const tiles = panel.createDiv({ cls: 'ziminos-about-tiles' });

    for (const site of SITES) renderSite(tiles, site);

    // 频道胶囊按地域上下两区：平台才分边，分组即解释
    for (const region of CHANNEL_REGIONS) {
        const section = panel.createDiv({ cls: 'ziminos-about-region' });

        section.createDiv({ cls: 'ziminos-about-region-title', text: region.label });

        const pills = section.createDiv({ cls: 'ziminos-about-pills' });

        for (const channel of region.channels) renderChannel(pills, channel);
    }

    renderCredits(panel);
}

/**
 * 名片最下方的致谢，排在作者的一切之后。
 *
 * 位置就是态度：一张自我介绍的卡片，最后一段留给别人。
 * 分两块——上面是**思路**（一行代码没抄，但少了谁就会走错），
 * 下面是**随库交付的东西**（那一块是许可要求的署名，不是客套，所以只列名字与许可证）。
 */
function renderCredits(panel: HTMLElement): void {
    const block = panel.createDiv({ cls: 'ziminos-about-credits' });

    block.createDiv({ cls: 'ziminos-about-credits-title', text: '致谢' });
    block.createDiv({
        cls: 'ziminos-about-credits-intro',
        text: '这些项目在前面，ziminOS 才走得到这里。一行代码都没有抄，但每一条都改变了它的某个决定。',
    });

    for (const credit of CREDITS) {
        const item = block.createDiv({ cls: 'ziminos-about-credit' });

        item.createEl('a', {
            cls: 'ziminos-about-credit-name',
            text: credit.name,
            href: credit.url,
            attr: { rel: 'noopener' },
        });
        item.createDiv({ cls: 'ziminos-about-credit-what', text: credit.what });
    }

    const bundled = block.createDiv({ cls: 'ziminos-about-bundled' });

    bundled.createSpan({ text: '随库交付：' });

    BUNDLED.forEach((entry, index) => {
        if (index) bundled.appendText('、');

        bundled.createEl('a', {
            cls: 'ziminos-about-bundled-link',
            text: entry.name,
            href: entry.url,
            attr: { rel: 'noopener', title: `${entry.name}（${entry.what}）` },
        });
    });

    // 这一句必须逐项属实，否则它比不写更糟：学员照着去找一个根本不存在的许可文件，
    // 得到的结论是这套系统在署名这件事上说了谎。三种安排各自为真，就分三句写
    bundled.appendText(
        '。Dataview、Minimal、Style Settings 与四款字体的许可证全文随文件交付；' +
        'Pikaicons、lunar-typescript 与 holiday-cn 的许可声明写在 main.js 开头；' +
        'Simple Icons 是 CC0。',
    );
}

/** 「关于作者」视图：内容与库无关，渲染即完成，重算对它是无害的重画 */
export const aboutViews: readonly ViewDefinition[] = [
    {
        name: ABOUT_VIEW,
        render: (view) => {
            renderAboutPanel(view.el);

            return Promise.resolve();
        },
    },
];
