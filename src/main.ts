/**
 * [INPUT]: 依赖 obsidian 的 Plugin 基类；依赖 core 的 SelfWriteGuard、CommandRegistry、
 *          INIT_VAULT_COMMAND、DEFAULT_SETTINGS/normalizeSettings、
 *          ZiminosSettings/ZiminosContext/VaultSeed 契约、PERIODS 与 registerViewCodeBlock；
 *          依赖 modules/setup 的 initializeVault/applySeed，以及项目管理、读书笔记、灵感收集、
 *          日历、复盘、人脉与客户七个模块各自的 seed、register 函数与视图数组，
 *          其中读书笔记那三条命令还要 modules/projects/createContainer 的 createContainer/BOOK_KIND
 *          来填「建一个书籍容器」那个洞，设置页那颗「扫码连接」还要 modules/books/sourceWeread
 *          的 loginWeread/disconnectWeread/disposeWereadSession 来管理登录窗口、断开与卸载清理；
 *          复盘的打开命令还要 theme 的 promptThemeIfMissing 来填「日记已打开」那个洞；
 *          再加 modules/format 的 registerFormatter、modules/appearance 的 registerAppearanceSwitch、
 *          modules/ribbon 的 registerRibbon、
 *          modules/editing 的 registerPasteLink/registerCursorMemory、
 *          modules/explorer 的 registerFolderCount/registerRecentFiles/registerFilePath、
 *          modules/legacy 的 registerLegacyDock
 *          与 modules/about 的 aboutViews/renderAboutPanel
 * [OUTPUT]: 默认导出 ZiminosPlugin，即 Obsidian 加载 main.js 时实例化的插件入口类
 * [POS]: 插件唯一入口与唯一装配点。它只做四件事：把磁盘上的设置读成一个对象、
 *        把它连同 app/plugin/guard 装配成 ZiminosContext、把上下文分发给各模块去自行注册、
 *        再把彼此需要但不该互相认识的能力接上线。
 *        最后这件事是 V2 新增的，也是本文件最有分量的部分：
 *        记人情要往当天日记里写一行，客户模块要按需长出自己的产物，
 *        建一本书要走项目模块那套「文件夹 + MOC」的流程，
 *        设置页要能开出读书模块那个扫码登录窗口，
 *        还要能让状态栏那两块、左侧边栏那列图标与文件模块画出来的三样东西按新设置重画——
 *        它们分别需要复盘模块、开荒模块、项目模块、读书模块、外观模块、ribbon 模块
 *        与 explorer 模块的能力。explorer 那三样只占一个洞：它们同属一个模块，
 *        设置页不该知道那个模块内部由几个文件把它们画出来。
 *        它们都不 import 对方，而是各自声明一个函数类型的洞，由这里填上。
 *        于是依赖图仍是一棵树：main 认识所有模块，模块之间彼此不认识，
 *        加一个模块只是在这里多几行，删一个模块只需删掉那几行。
 *        这里还多了一条纪律：命令一律经 ctx.commands 注册，且左侧边栏必须最后装配——
 *        它是照着花名册摆图标的，摆的时候花名册必须已经收齐
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Plugin } from 'obsidian';
import { registerViewCodeBlock } from './core/codeblock';
import { CommandRegistry, INIT_VAULT_COMMAND } from './core/commands';
import { readEdition } from './core/edition';
import { PERIODS } from './core/constants';
import { SelfWriteGuard } from './core/guard';
import { DEFAULT_SETTINGS, normalizeSettings } from './core/types';
import type { VaultSeed, ZiminosContext, ZiminosSettings } from './core/types';
import { aboutViews, renderAboutPanel } from './modules/about/view';
import { registerAppearanceSwitch } from './modules/appearance/statusBar';
import { registerCreateBookCommand } from './modules/books/createBook';
import { registerExcerptCardCommand } from './modules/books/extractCard';
import { registerImportHighlightsCommand } from './modules/books/importHighlights';
import {
    registerConnectWereadCommand,
    registerReadBookCommand,
    registerSyncHighlightsCommand,
} from './modules/books/readBook';
import { disconnectWeread, disposeWereadSession, loginWeread } from './modules/books/sourceWeread';
import { registerCursorMemory } from './modules/editing/cursorMemory';
import { registerPasteLink } from './modules/editing/pasteLink';
import { registerFolderCount } from './modules/explorer/badge';
import { registerFilePath } from './modules/explorer/filePath';
import { registerRecentFiles } from './modules/explorer/recentFiles';
import { registerFormatter } from './modules/format/formatter';
import { registerLegacyDock } from './modules/legacy/vaultDock';
import { registerCalendar } from './modules/calendar/view';
import { circleViews } from './modules/contacts/circleViews';
import { clientViews } from './modules/contacts/clientViews';
import { registerClientCommands } from './modules/contacts/client';
import { registerCreateContactCommand } from './modules/contacts/createContact';
import { pickPerson } from './modules/contacts/identity';
import { personViews } from './modules/contacts/personViews';
import { registerRecordFavorCommand } from './modules/contacts/recordFavor';
import { contactsSeed } from './modules/contacts/seed';
import { registerInspirationCaptureCommand } from './modules/inspiration/capture';
import { registerCardAutoInit, registerCardInitCommand } from './modules/projects/cardInit';
import { registerCreateAreaCommand } from './modules/projects/createArea';
import { BOOK_KIND, createContainer } from './modules/projects/createContainer';
import { createExportHook } from './modules/eternal/export';
import { eternalRawViews, humanEternalViews } from './modules/eternal/views';
import { registerCreateProjectCommand } from './modules/projects/createProject';
import { projectsSeed } from './modules/projects/seed';
import { registerTransitionCommands } from './modules/projects/transitions';
import { registerUpdatedMaintainer } from './modules/projects/updatedMaintainer';
import { openPeriodNote, registerPeriodicCommands } from './modules/review/periodic';
import { reviewProjectViews } from './modules/review/projectViews';
import { reviewSeed } from './modules/review/seed';
import { promptThemeIfMissing, registerThemeCommand } from './modules/review/theme';
import { reviewThemeViews } from './modules/review/views';
import { registerRibbon } from './modules/ribbon/dock';
import { applySeed, initializeVault } from './modules/setup/init';
import { ZiminosSettingTab } from './settings';

// ============================================================
// 插件入口
// ============================================================

export default class ZiminosPlugin extends Plugin {
    /**
     * 全局唯一的设置对象。
     * 它会被原样放进 ZiminosContext，各模块与设置页读写的都是这同一份引用——
     * 设置页改完一个开关，正在监听的模块下次触发时立刻看见新值，中间没有任何同步环节。
     */
    settings: ZiminosSettings = { ...DEFAULT_SETTINGS };

    async onload(): Promise<void> {
        await this.loadSettings();

        // 版次必须最先读出来：它决定下面哪几条注册线根本不铺。
        // 免费库里没有那个标记文件，readEdition 走的是「文件不存在」那条最短路径，
        // 结果恒为 FREE_EDITION，第二版的模块因此一次都不会被调用
        const edition = await readEdition(this.app);

        // ============================================================
        // 装配上下文：模块要用的一切能力都从这里获得，不再各自去摸 app 或磁盘
        // ============================================================

        const ctx: ZiminosContext = {
            app: this.app,
            plugin: this,
            settings: this.settings,
            saveSettings: () => this.saveData(this.settings),
            // 守卫必须全库唯一：写方标记与监听方查询共用同一份记录，自写抑制才成立
            guard: new SelfWriteGuard(),
            // 注册台同样全库唯一：它手里那份花名册就是左侧边栏与设置页看到的命令清单
            commands: new CommandRegistry(this),
            edition,
        };

        // 扫码窗口与内存令牌属于插件会话；卸载时必须一并收口
        this.register(disposeWereadSession);

        // ============================================================
        // 开荒：各模块自报诉求，开荒模块只认这份契约，不认识任何模块
        // ============================================================

        // 每次点「初始化」都重新求值，而不是在 onload 时算好一份：
        // seed 里带着 created 与 UID，插件早上加载、下午开荒的话，
        // 预先算好的时间戳会把开荒时刻记成加载时刻
        const collectSeeds = (): VaultSeed[] => [
            projectsSeed(),
            reviewSeed(ctx),
            contactsSeed(ctx),
        ];

        // 开荒内部已把全部异常转成中文 Notice，此处无需等待也无需接住
        ctx.commands.register(INIT_VAULT_COMMAND, () => {
            void initializeVault(ctx, collectSeeds());
        });

        // ============================================================
        // 各模块注册自己的命令与自动行为
        // ============================================================

        // 建项目要问「这是谁委托的」，候选人住在人脉模块——用同一套注入把两者接上
        registerCreateProjectCommand(ctx, (title) => pickPerson(ctx, title));
        registerCreateAreaCommand(ctx);
        registerCardInitCommand(ctx);
        registerCardAutoInit(ctx);
        // 归档移交：只有第二版的「以人为本」库才递得出这个洞。
        // 免费版与另外两本库拿到的是 undefined，于是流转命令里那条 if 恒为假，
        // 归档流程与第二版出现之前逐字节相同——这就是「保留第一版」在代码里的样子
        registerTransitionCommands(
            ctx,
            ctx.edition.role === 'human' ? createExportHook(ctx) : undefined,
        );
        registerUpdatedMaintainer(ctx);

        // 一本书就是一个项目：建书要的「一个文件夹 + 一篇 MOC」正是 createContainer 那套流程，
        // 而 books 模块不认识 projects——它只声明了一个「建一个书籍容器」的洞，由这里填上。
        // BOOK_KIND 那张表说清了书与项目的全部差别，因此这里递的是规格，不是又一条流程
        // 「读一本书」是主干：一条命令走完「查书目 → 建档 → 把设备里的划线灌进来」，
        // 它与手动建书共用同一个容器洞，差别只在 preset 里的字段是查来的还是问来的
        registerReadBookCommand(ctx, (preset) => createContainer(ctx, BOOK_KIND, preset));
        registerSyncHighlightsCommand(ctx);
        registerConnectWereadCommand(ctx);
        registerCreateBookCommand(ctx, (preset) => createContainer(ctx, BOOK_KIND, preset));
        registerImportHighlightsCommand(ctx);
        registerExcerptCardCommand(ctx);

        registerInspirationCaptureCommand(ctx);

        // 日历只表达“用户点了哪个时间坐标”，五级笔记的目录、模板与幂等创建仍归复盘模块。
        // 这里把两者接上；点日记后再走同一条缺主题检查，日历入口与命令入口行为不分叉。
        registerCalendar(ctx, async (periodKey, day) => {
            const file = await openPeriodNote(ctx, PERIODS[periodKey], { day });

            if (file && periodKey === 'daily') await promptThemeIfMissing(ctx, file);
        });

        // 打开命令只管「打开」，主题模块只管「有没有主题」；
        // 这里把两者接上，于是首次打开会问，已有主题再打开就安静
        registerPeriodicCommands(ctx, (file) => promptThemeIfMissing(ctx, file));
        registerThemeCommand(ctx);

        registerCreateContactCommand(ctx);
        // 记人情要往当天日记里写一行。它不认识复盘模块，只声明了一个「拿到今天的日记」的洞，
        // 由这里用复盘模块的能力填上；reveal 关掉，顺手记一笔不该顶掉学员正在读的笔记
        registerRecordFavorCommand(ctx, () => openPeriodNote(ctx, PERIODS.daily, { reveal: false }));
        // 客户模块要按需长出自己的产物，同理只声明了一个「落一份开荒贡献」的洞
        registerClientCommands(ctx, (seed) => applySeed(ctx, seed));

        // 排版整理横跨全库、不属于任何一套笔记，它注册的是一条命令与一个编辑监听，一篇笔记都不生产。
        // 位置排在这里而不是更早：注册顺序就是左侧边栏的分组顺序，它该落在客户与外观之间，
        // 与设置页那八张标签的先后对齐——两处只要有一处自作主张，学员就会觉得是两套东西。
        // v0.17.0 起排版是「编辑」页的后半截（同一个时刻发生的事），装配顺序不变
        registerFormatter(ctx);

        // 外观开关在状态栏常驻一个按钮，而设置页只会改设置对象、没法让已经画出来的按钮消失，
        // 因此它交回一个「按当前设置重新决定显隐」的函数，由下面转交给设置页
        const syncAppearanceSwitch = registerAppearanceSwitch(ctx);

        // ============================================================
        // 编辑：粘贴与光标，两个监听、一条命令都不注册
        // ============================================================

        // 它们不交回任何同步函数：监听与记忆每次触发都现读设置对象，天然看得见新值。
        // 需要有人去推一把的，永远只是「已经画在屏幕上」的东西
        registerPasteLink(ctx);
        registerCursorMemory(ctx);

        // ============================================================
        // 文件：文件夹计数、最近文件与状态栏路径
        // ============================================================

        // 三样东西回答同一个问题（我在哪、有哪些、刚才去过哪儿），因此只向设置页交回
        // **一个**同步函数：设置页不必知道那个模块内部由几个文件把这三样画出来。
        // 装配位置从「边栏之后」挪到了这里（v0.17.0）——最近文件与复制路径是两条命令，
        // 而边栏是照着花名册摆图标的，摆的时候花名册必须已经收齐。
        // 这也让装配顺序重新等于设置页那八张标签的先后：编辑（含排版）→ 文件 → 边栏
        const syncFolderCount = registerFolderCount(ctx);
        const syncRecentFiles = registerRecentFiles(ctx);
        const syncFilePath = registerFilePath(ctx);
        const syncExplorer = (): void => {
            syncFolderCount();
            syncRecentFiles();
            syncFilePath();
        };

        // ============================================================
        // 旧版入口：Obsidian 1.6 挪走的那三个按钮
        // ============================================================

        // 三条命令，做的是 Obsidian 自己的事，因此单列一组并着中性灰。
        // 它们默认就摆进左侧边栏——一个需要先去设置页勾选才回来的按钮，等于没有回来
        registerLegacyDock(ctx);

        // ============================================================
        // 左侧边栏：必须在全部命令注册完之后，它摆的就是上面那些命令
        // ============================================================

        // 与外观开关同理：设置页改完勾选，得有人去推那列已经画出来的图标一把
        const syncRibbon = registerRibbon(ctx);

        // ============================================================
        // 代码块视图引擎：二十二个笔记内视图；日历是独立 ItemView，不在此处重复注册
        // ============================================================

        registerViewCodeBlock(ctx, [
            ...reviewThemeViews,
            ...reviewProjectViews,
            ...personViews,
            ...circleViews,
            // 客户视图始终注册：视图是只读的，注册它零成本，
            // 而用开关控制注册会让「块能不能渲染」变成需要重启才生效的事
            ...clientViews,
            // 作者名片：开荒写进导航页尾的那个块由它渲染
            ...aboutViews,
            // 第二版的两张清单按角色分发：出库单那张只在「以人为本」画得出，
            // 待提炼那张只在《赛博永生》画得出。免费版两个 role 都不是，两张都不注册，
            // 于是学员的笔记里即便凑巧写了同名代码块，也只会看到「未知视图」而不是一张空表——
            // 空表会让他以为系统坏了，而未知视图如实说明这里没有这个东西
            ...(ctx.edition.role === 'human' ? humanEternalViews : []),
            ...(ctx.edition.role === 'eternal' ? eternalRawViews : []),
        ]);

        // ============================================================
        // 挂载设置页：它是「人主导」这条红线的操作面，放在最后保证挂载时上下文已完备
        // ============================================================

        this.addSettingTab(
            new ZiminosSettingTab(ctx, {
                initialize: () => initializeVault(ctx, collectSeeds()),
                // 设置页里那颗「扫码连接」按钮，与命令面板那条「连接微信读书」是同一段登录流程；
                // 设置页不 import books 模块，因此这项能力也走注入
                connectWeread: () => loginWeread(ctx),
                disconnectWeread: () => disconnectWeread(ctx),
                syncAppearanceSwitch,
                syncRibbon,
                syncExplorer,
                // 设置页的「关于作者」区与导航页尾的视图块画同一张名片，实现只有 about 一份
                renderAbout: renderAboutPanel,
            }),
        );
    }

    /**
     * 读取持久化设置并在唯一入口逐字段验形。
     * 合法旧值原样保留，缺失或类型错误的字段各自回落默认；数组与枚举再走自己的白名单，
     * 因此损坏或手改过的 data.json 不会把错误形态带进模块。首次安装仍得到纯默认值。
     */
    private async loadSettings(): Promise<void> {
        this.settings = normalizeSettings(await this.loadData());
    }
}
