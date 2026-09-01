/**
 * [INPUT]: 依赖 obsidian 的 App（vault.configDir 与 vault.adapter 两个公开能力）
 * [OUTPUT]: 对外提供 Edition/VaultRole/SystemLayout 三个类型、FREE_EDITION 常量，
 *           以及 readEdition（读出本库的版次与它在系统里的角色）
 * [POS]: core 的版次闸门，是「同一份 main.js 交付两版用户」这条纪律的唯一执行处。
 *        第一版（免费·单库）与第二版（付费·三库）共用同一个插件产物，
 *        因此「这个库能用哪些功能」不能写死在代码里，只能问磁盘上的一份标记。
 *        标记由第二版安装器写下，第一版永远没有它——于是免费库里 v2 模块的注册函数
 *        一次都不会被调用，行为与加这套东西之前逐字节相同。这不是运行时开关，
 *        是装配期开关：main 拿到 free 就根本不 import 那条线上的能力，
 *        没有命令、没有视图、没有监听，也就没有任何东西可能出错。
 *        失败方向是刻意的：文件缺席、读不动、JSON 坏了、字段不认识，一律回落 free。
 *        坏标记把付费功能塞进免费库，比坏标记让付费库退化成免费库严重得多——
 *        后者用户看得见（功能不见了会来问），前者他看不见（凭空多出的文件不会有人报错）。
 *        它也是系统布局的唯一事实源：插件与桌面智能体读同一份 vaults 表，
 *        因此「赛博永生那本库叫什么」这件事不存在两个答案。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { App } from 'obsidian';

// ============================================================
// 契约
// ============================================================

/** 插件目录下的版次标记文件名。它与 data.json、holiday-cache.json 同住，但归安装器所有 */
export const EDITION_FILE_NAME = 'edition.json';

/** 版次。free 是第一版（单库、免费），pro 是第二版（三库、付费、含 Skill） */
export type Edition = 'free' | 'pro';

/**
 * 一本库在三库系统里的角色。
 * capture 只收不理，human 是人干活的地方，eternal 是机器加工知识的地方——
 * 三者对「被改写」的容忍度完全不同，这也正是它们必须分家的理由。
 */
export type VaultRole = 'capture' | 'human' | 'eternal';

/** 三本库在系统根下的目录名。桌面智能体与插件读同一份，因此不存在两个答案 */
export interface SystemLayout {
    readonly capture: string;
    readonly human: string;
    readonly eternal: string;
}

/** 本库的版次结论。role 与 layout 只在 pro 下有意义，free 下恒为 null */
export interface EditionInfo {
    readonly edition: Edition;
    readonly role: VaultRole | null;
    readonly layout: SystemLayout | null;
}

/**
 * 免费版结论，也是一切读取失败时的回落值。
 * 它是一个常量而不是每次现造的对象字面量：调用方拿到的永远是同一个引用，
 * 「是不是回落值」因此可以用恒等判断，不必比较字段。
 */
export const FREE_EDITION: EditionInfo = {
    edition: 'free',
    role: null,
    layout: null,
};

// ============================================================
// 读取
// ============================================================

const VAULT_ROLES: readonly VaultRole[] = ['capture', 'human', 'eternal'];

/** 标记文件的库内路径。走 configDir 而非写死 .obsidian——用户可以改配置目录名 */
function editionPath(app: App): string {
    return `${app.vault.configDir}/plugins/ziminos/${EDITION_FILE_NAME}`;
}

/**
 * 读出本库的版次。
 *
 * 全程不抛异常：这个函数在 onload 的最前面被调用，它一旦抛出，
 * 整个插件就加载失败——而失败的原因会是「一个本来可有可无的标记文件坏了」。
 * 免费版用户根本没有这个文件，走的正是 exists 返回 false 那条最短路径。
 */
export async function readEdition(app: App): Promise<EditionInfo> {
    const path = editionPath(app);

    try {
        if (!(await app.vault.adapter.exists(path))) return FREE_EDITION;

        const parsed: unknown = JSON.parse(await app.vault.adapter.read(path));

        return interpret(parsed);
    } catch {
        // 读不动、不是合法 JSON、权限不足——三种都回落免费版。
        // 这里刻意不发 Notice：标记文件是系统的零件不是用户的东西，
        // 为一个他没见过的文件弹一句他看不懂的话，只会让他以为库坏了
        return FREE_EDITION;
    }
}

/**
 * 把磁盘上那个来路不明的对象收敛成结论。
 *
 * 每一项都单独验形而不是整体断言：标记文件是安装器写的，
 * 但用户随时可以打开它、改它、删掉半行——而这套系统对用户的承诺正是
 * 「一切都是你能打开、能看懂、能删的文件」。允许他改，就必须扛得住他改坏。
 */
function interpret(parsed: unknown): EditionInfo {
    if (typeof parsed !== 'object' || parsed === null) return FREE_EDITION;

    const raw = parsed as Record<string, unknown>;

    // 只认 'pro' 一个值。将来若有第三版，那时它自己会来改这里；
    // 现在就把未知字符串当成「某种付费版」放行，等于让一个拼错的值打开功能
    if (raw.edition !== 'pro') return FREE_EDITION;

    const role = VAULT_ROLES.find((candidate) => candidate === raw.role) ?? null;
    const layout = interpretLayout(raw.vaults);

    // 角色或布局任一缺失即整份作废。三库系统里「我是 pro 但不知道自己是谁」
    // 是个没有意义的状态：出库单该写给谁、清单视图该扫哪里，都答不上来
    if (role === null || layout === null) return FREE_EDITION;

    return { edition: 'pro', role, layout };
}

/** 三本库的目录名，缺一不可，且都必须是去空白后非空的字符串 */
function interpretLayout(value: unknown): SystemLayout | null {
    if (typeof value !== 'object' || value === null) return null;

    const raw = value as Record<string, unknown>;
    const capture = folderName(raw.capture);
    const human = folderName(raw.human);
    const eternal = folderName(raw.eternal);

    if (capture === null || human === null || eternal === null) return null;

    return { capture, human, eternal };
}

/**
 * 收敛一个目录名。
 * 它只是名字不是路径，因此含分隔符即判定为坏值——一个带斜杠的「目录名」
 * 会让下游拼出的路径静默指向别处，而那正是这套系统最不能容忍的那类错误。
 */
function folderName(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();

    if (trimmed === '' || trimmed.includes('/') || trimmed.includes('\\')) return null;

    return trimmed;
}
