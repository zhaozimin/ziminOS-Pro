/**
 * [INPUT]: 依赖 obsidian 的 App（vault.configDir 与 vault.adapter 两个公开能力）；
 *          依赖 core/constants 的 SNIPPET_FOLDER_NAME/SNIPPET_EXTENSION/
 *          APPEARANCE_FILE_NAME/ENABLED_SNIPPETS_KEY
 * [OUTPUT]: 对外提供片段事实 SnippetState、读取入口 readSnippets、开关入口 setSnippetEnabled
 * [POS]: 外观模块的事实层与动作层，也是全仓库唯一接触 Obsidian 非公开 API 的地方。
 *        它把这件事关在一扇门里：门外只看得见「库里有哪些片段、哪些开着、把某个开或关」，
 *        门内才知道读事实走的是公开的 DataAdapter、而让改动即刻生效需要借一次 customCss。
 *        事实与生效刻意分成两条路，不是啰嗦：
 *        事实只认磁盘（snippets 目录 + appearance.json），因此开关里看到的清单
 *        与「设置 → 外观」看到的永远是同一份，哪怕内部实现哪天变了也不会说谎；
 *        appearance.json 若已损坏则拒绝开关，不拿空对象覆盖用户主题、强调色等其他配置；
 *        生效那一步没有公开替代品，故做成可选调用 + 能力探测 + 公开 API 兜底，
 *        探不到就改 appearance.json 并告知重载，功能降级但绝不崩。
 *        不缓存、不监听、不轮询：每次有人问就现读一次磁盘，这是最便宜也最不会过期的做法
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { App } from 'obsidian';
import {
    APPEARANCE_FILE_NAME,
    ENABLED_SNIPPETS_KEY,
    SNIPPET_EXTENSION,
    SNIPPET_FOLDER_NAME,
} from '../../core/constants';

// ============================================================
// 与 Obsidian 内部的唯一一处约定
// ============================================================

/**
 * 备案：这是 ziminOS 唯一一次伸手到官方公开 API 之外。
 *
 * 「让某个 CSS 片段此刻就生效或失效」在 obsidian.d.ts（1.13.1，8482 行）里没有任何入口——
 * 全文搜不到 customCss，也搜不到 snippet。能做到这件事的只有 app.customCss。
 * 完全不碰它的话，开关就只能改 appearance.json 并要求用户重启 Obsidian，
 * 那已经不是开关，是配置文件的另一种写法。
 *
 * 因此这里用模块增强把它声明成**可选**成员，而不是断言成必然存在：
 * 可选意味着 TypeScript 会强制每一处调用先判空，
 * 于是「哪天 Obsidian 改了内部实现」的后果被锁死在「这个开关退回重载生效」，
 * 而不是插件在用户库里抛异常。声明就写在唯一的使用处旁边，不藏进 .d.ts 文件里。
 */
declare module 'obsidian' {
    interface App {
        customCss?: {
            setCssEnabledStatus?(snippet: string, enabled: boolean): void;
        };
    }
}

// ============================================================
// 片段事实
// ============================================================

/** 分组前缀：文件名开头的【…】。这是用户自己的命名习惯，开关照着它分组，不另发明一套 */
const GROUP_PATTERN = /^【([^】]+)】\s*/;

/** 没有【】前缀的片段归到这一组，排在最后 */
export const UNGROUPED_LABEL = '其他';

/** 一个 CSS 片段此刻的全部事实 */
export interface SnippetState {
    /** 不含扩展名的文件基名，也是 appearance.json 里登记的那个名字 */
    readonly name: string;
    /** 分组名，取自【】前缀；没有前缀时为 UNGROUPED_LABEL */
    readonly group: string;
    /** 去掉【】前缀后的显示名；整个名字就是前缀时回落为原名 */
    readonly label: string;
    readonly enabled: boolean;
}

/**
 * 读出库里全部 CSS 片段及其开关状态。
 *
 * 两个来源都只用公开 API：目录清单来自 DataAdapter.list，启用清单来自 appearance.json。
 * 筛选条件与 Obsidian 自己一致——小写 .css，别的一概不认；
 * 若放宽成大小写不敏感，开关里就会出现一条 Obsidian 根本没加载、点了也不会有反应的片段。
 * 片段目录不存在（全新库还没放过任何片段）不是错误，返回空数组即可。
 */
export async function readSnippets(app: App): Promise<SnippetState[]> {
    const folder = `${app.vault.configDir}/${SNIPPET_FOLDER_NAME}`;

    if (!(await app.vault.adapter.exists(folder))) return [];

    const listed = await app.vault.adapter.list(folder);
    const enabled = await readEnabledNames(app);
    const states: SnippetState[] = [];

    for (const path of listed.files) {
        if (!path.endsWith(SNIPPET_EXTENSION)) continue;

        const base = path.slice(path.lastIndexOf('/') + 1, -SNIPPET_EXTENSION.length);

        if (!base) continue;

        states.push({ ...splitGroup(base), name: base, enabled: enabled.has(base) });
    }

    return states.sort(compareSnippets);
}

/** 把【分组】显示名拆开。没有前缀、或整个名字就是一个前缀时，都退回「其他 + 原名」 */
function splitGroup(base: string): { group: string; label: string } {
    const matched = GROUP_PATTERN.exec(base);

    if (!matched) return { group: UNGROUPED_LABEL, label: base };

    const label = base.slice(matched[0].length);

    return label ? { group: matched[1], label } : { group: UNGROUPED_LABEL, label: base };
}

/** 先按分组、再按显示名排序；「其他」永远垫底，因为它是兜底而不是一类 */
function compareSnippets(a: SnippetState, b: SnippetState): number {
    if (a.group !== b.group) {
        if (a.group === UNGROUPED_LABEL) return 1;
        if (b.group === UNGROUPED_LABEL) return -1;

        return a.group.localeCompare(b.group, 'zh');
    }

    return a.label.localeCompare(b.label, 'zh');
}

// ============================================================
// 开关
// ============================================================

/**
 * 开或关一个片段。
 *
 * 返回 true 表示已经即刻生效，false 表示只落到了 appearance.json、需要重载 Obsidian——
 * 调用方据此决定要不要说话，而不必知道这两条路分别是怎么走的。
 * 写盘失败照常抛出，由调用方翻成一句中文提示：静默失败会让人以为开关坏了却查不出原因。
 */
export async function setSnippetEnabled(
    app: App,
    name: string,
    enabled: boolean,
): Promise<boolean> {
    const customCss = app.customCss;

    // 声明是一份约定而非事实，所以运行时再验一次形状：
    // 万一哪天 customCss 还在、这个方法没了，我们要降级而不是抛异常
    if (typeof customCss?.setCssEnabledStatus === 'function') {
        // 它自己会写 appearance.json 并挂/摘 <style>，我们不能再写一遍，否则两处打架
        customCss.setCssEnabledStatus(name, enabled);

        return true;
    }

    await writeEnabledNames(app, name, enabled);

    return false;
}

// ============================================================
// appearance.json 读写（全公开 API）
// ============================================================

/** appearance.json 的完整路径 */
function appearancePath(app: App): string {
    return `${app.vault.configDir}/${APPEARANCE_FILE_NAME}`;
}

/** 读出已启用片段名集合。文件缺失或键不存在可视为空；损坏文件必须拒绝写入 */
async function readEnabledNames(app: App): Promise<Set<string>> {
    return extractEnabledNames(await readAppearanceConfig(app));
}

/** 从已读出的配置里摘启用清单。摘取与读盘分开，写入侧才能读一次文件就同时拿到两样东西 */
function extractEnabledNames(config: Record<string, unknown>): Set<string> {
    const listed = config[ENABLED_SNIPPETS_KEY];

    if (!Array.isArray(listed)) return new Set();

    return new Set(listed.filter((item): item is string => typeof item === 'string'));
}

/**
 * 兜底路径：直接改 appearance.json 的启用清单。
 *
 * 先整份读回再改一个键，是为了原样留住 cssTheme、accentColor 与用户的其他外观设置——
 * 这个文件不只属于我们。配置与清单出自同一次读盘，中间不会被别人插进来改一手。
 * 缩进跟 Obsidian 自己一致取 2 空格，免得每换一次开关都在 Git 里炸出一整份 diff。
 */
async function writeEnabledNames(app: App, name: string, enabled: boolean): Promise<void> {
    const config = await readAppearanceConfig(app);
    const names = extractEnabledNames(config);

    if (enabled) names.add(name);
    else names.delete(name);

    config[ENABLED_SNIPPETS_KEY] = [...names];

    await app.vault.adapter.write(appearancePath(app), `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * 读出 appearance.json 的全部键值。
 *
 * 逐键搬进一个新对象而不是直接用解析结果，是为了让类型收敛成 Record 而不需要任何断言。
 * 文件存在却读不懂时绝不返回空对象：appearance.json 属于 Obsidian 与用户，拿空对象继续写
 * 会顺手抹掉 cssTheme、accentColor 等不属于本插件的配置。
 */
async function readAppearanceConfig(app: App): Promise<Record<string, unknown>> {
    const config: Record<string, unknown> = {};
    const path = appearancePath(app);

    if (!(await app.vault.adapter.exists(path))) return config;

    let parsed: unknown;

    try {
        parsed = JSON.parse(await app.vault.adapter.read(path));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`无法读取外观配置 ${path}：${message || '文件不是合法 JSON'}`);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`外观配置 ${path} 的顶层必须是 JSON 对象，已拒绝覆盖原文件`);
    }

    for (const [key, value] of Object.entries(parsed)) config[key] = value;

    return config;
}
