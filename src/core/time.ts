/**
 * [INPUT]: 依赖 obsidian 导出的 moment，依赖 ./constants 的 UID_FORMAT、DEFAULT_DATETIME_FORMAT、
 *          DAY_FORMAT、五级周期表 PERIODS 与 PeriodDefinition 类型
 * [OUTPUT]: 对外提供 nowStamp（按设置格式取当前时间）、stampOfMillis（按设置格式写出过去某一刻）、
 *           nowUid（14 位本地时间数字 UID）、
 *           nowStampAndUid（同一时刻派生时间戳与 UID）、nowLocalDateTimeParts（同一时刻派生
 *           日期/分钟/自定义时间）；日粒度口径 today/dayText/dayOfMillis/dayOfTitle/shiftDay/daysBetween；
 *           五级复盘周期算术 currentPeriodTitle/periodOfTitle/periodStartOf/periodEndOf/
 *           periodNeighbours/titleOfDay 及对应返回类型
 * [POS]: core 的时间口径统一处，同时是 dateTimeFormat 设置项的守门人——
 *        设置页刻意不做校验，空值回落在此收敛为唯一一处，调用方传原值即可，无从遗漏。
 *        原始脚本里存在手写 padStart 与 moment 两套实现，此处统一为 moment 一种
 *        （输出字符串完全一致，属消重而非行为改变）；原脚本「同一时刻派生 created 与 UID」
 *        的原子性由 nowStampAndUid 承载，跨秒边界下两个字段不会各说各话。
 *        dayText 对 ISO 前缀做严格日历校验，形似日期的不存在日不进入视图区间。
 *        全仓库禁止再就地 new Date() 拼时间，格式必须走这里，dateTimeFormat 设置才真正生效
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { moment } from 'obsidian';
import { DAY_FORMAT, DEFAULT_DATETIME_FORMAT, PERIODS, UID_FORMAT } from './constants';
import type { PeriodDefinition } from './constants';

/**
 * 本模块用到的 moment 能力，按接口隔离原则只声明这些，不引入 moment 的完整类型。
 * 注意 startOf/add/subtract 在 moment 里是就地修改并返回自身，
 * 因此任何派生计算都必须先 clone，否则一次取上一篇会把原始时刻改掉。
 */
interface MomentLike {
    format(format: string): string;
    isValid(): boolean;
    clone(): MomentLike;
    startOf(unit: string): MomentLike;
    add(amount: number, unit: string): MomentLike;
    subtract(amount: number, unit: string): MomentLike;
    diff(other: MomentLike, unit: string): number;
}

/** moment 的三种调用形态：取当下、解析时间戳、按格式严格解析标题 */
type MomentFactory = (input?: string | number, format?: string, strict?: boolean) => MomentLike;

/** 同一时刻派生出的两个时间身份：人读的时间戳与机器认的永久 UID */
export interface StampAndUid {
    /** 按 dateTimeFormat 格式化的可读时间，写入 created */
    readonly stamp: string;
    /** 14 位本地时间 UID，写入 UID。是 number 而非 string——属性面板把它登记为数字类型 */
    readonly uid: number;
}

/** 同一时刻派生出的模板时间变量，避免跨分钟边界时一条灵感出现互相矛盾的日期与时间 */
export interface LocalDateTimeParts {
    readonly date: string;
    readonly time: string;
    readonly datetime: string;
}

/**
 * obsidian 把 moment 作为「命名空间」导出，而 tsconfig 开启了 esModuleInterop，
 * 命名空间类型不携带调用签名，因此需要在此还原它本来的函数形态。
 * 运行时拿到的就是 Obsidian 内置的 moment 本体，本断言只修类型不改行为，且全仓库仅此一处。
 */
const momentFactory = moment as unknown as MomentFactory;

/**
 * 把设置页里的自由文本收敛成可用的 moment 格式串：空串、纯空白、非字符串一律回落默认格式。
 * 这道兜底刻意不外露——nowStamp 与 nowStampAndUid 内部各走一次，
 * 调用方直接把 settings.dateTimeFormat 原值递进来即可，不存在「某个读取点忘了兜底」的可能。
 * 若把空串透传给 moment，它会改用自己的 ISO 默认格式，同一个库里就会分叉出两种时间写法。
 */
function normalizeDateTimeFormat(value: string | undefined): string {
    const candidate = typeof value === 'string' ? value.trim() : '';

    return candidate || DEFAULT_DATETIME_FORMAT;
}

/**
 * 按设置的时间格式取当前本地时间。
 * 传入原始设置值即可，空值回落由本函数负责。
 */
export function nowStamp(format: string): string {
    return momentFactory().format(normalizeDateTimeFormat(format));
}

/**
 * 把过去的某个时刻按设置的时间格式写出来。
 * updated 记的是「最后一次改完的那一刻」而不是「落笔的这一刻」——两者可以隔着一小时（改完接着读），
 * 也可以隔着一夜（退出之后下次启动才补），所以落笔处必须能把一个过去的时刻写成与 nowStamp 同一种格式。
 */
export function stampOfMillis(millis: number, format: string): string {
    return momentFactory(millis).format(normalizeDateTimeFormat(format));
}

/**
 * 取 14 位本地时间 UID（YYYYMMDDHHmmss）。
 * UID 是笔记的永久身份，格式固定不可配置，因此不接受参数。
 * 返回 number 而非 string：它在属性面板里是数字类型，落盘时不带引号。
 * 位数为何是 14 而不是 17，见 constants 里 UID_FORMAT 的说明——这关系到主键会不会自己改数。
 */
export function nowUid(): number {
    return Number(momentFactory().format(UID_FORMAT));
}

/**
 * 在同一时刻同时取出时间戳与 UID。
 * 原脚本 create-project-moc.js 与 initialize-card-note.js 都先取一个 now 再派生两个字段，
 * 分成两次调用会在跨秒边界上让 created 与 UID 相差一秒——同一张卡片的两个时间身份必须一致，
 * 因此凡是要同时写 created 与 UID 的地方一律走这里，不得各调一次。
 */
export function nowStampAndUid(format: string): StampAndUid {
    const now = momentFactory();

    return {
        stamp: now.format(normalizeDateTimeFormat(format)),
        uid: Number(now.format(UID_FORMAT)),
    };
}

/**
 * 为可配置文本模板一次性生成三个本地时间变量。
 * date/time 是稳定的短格式，datetime 跟随插件 dateTimeFormat 设置。
 */
export function nowLocalDateTimeParts(format: string): LocalDateTimeParts {
    const now = momentFactory();

    return {
        date: now.format(DAY_FORMAT),
        time: now.format('HH:mm'),
        datetime: now.format(normalizeDateTimeFormat(format)),
    };
}

// ============================================================
// 日粒度：全库一切区间比较的落地格式
// ============================================================

/** 今天，YYYY-MM-DD */
export function today(): string {
    return momentFactory().format(DAY_FORMAT);
}

/**
 * 把 frontmatter 里的任意时间值收敛成 YYYY-MM-DD，收敛不了返回 null。
 *
 * 全库一切区间比较都降到这个定宽字符串空间——字典序即时间序，
 * 于是不存在日期算术、不存在跨年边界、也不存在「字符串与日期对象比大小」这种
 * 不报错却恒定返回同一结果的静默陷阱。
 *
 * 只认 ISO 前缀是刻意的：`2026/8/10` 这类写法宁可算作「没填」，也不做宽松猜测——
 * 猜错产生的是一个看起来合理的错误日期，比空值有害得多。全部模板写出的都是 ISO。
 */
export function dayText(value: unknown): string | null {
    if (value === null || value === undefined) return null;

    if (value instanceof Date) {
        const time = value.getTime();
        const parsed = momentFactory(time);

        return Number.isNaN(time) || !parsed.isValid() ? null : parsed.format(DAY_FORMAT);
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null;

        const parsed = momentFactory(value);

        return parsed.isValid() ? parsed.format(DAY_FORMAT) : null;
    }

    const text = String(value).trim();
    const day = /^\d{4}-\d{2}-\d{2}/.exec(text)?.[0];

    if (!day) return null;

    return momentFactory(day, DAY_FORMAT, true).isValid() ? day : null;
}

/** 把文件时间戳（毫秒）转成日粒度，供 frontmatter 缺字段时兜底 */
export function dayOfMillis(millis: number): string {
    return momentFactory(millis).format(DAY_FORMAT);
}

/**
 * 文件名恰好是一个合法日期时返回它，否则 null。
 *
 * 这是全库唯一的「这篇是不是日记」判据——只认文件名，不认文件夹。
 * 学员把日记挪出 05-diary、改成英文目录名、按年份再分层，人脉与复盘的十几个视图一个都不用改。
 * 严格解析同时挡掉 2026-13-45 这类看着像日期的文件名。
 */
export function dayOfTitle(title: string): string | null {
    return momentFactory(title, DAY_FORMAT, true).isValid() ? title : null;
}

/** 在日粒度上平移，返回仍是 YYYY-MM-DD；输入非法时原样返回，调用方的比较自然落空 */
export function shiftDay(day: string, amount: number, unit: string): string {
    const parsed = momentFactory(day, DAY_FORMAT, true);

    if (!parsed.isValid()) return day;

    return parsed.add(amount, unit).format(DAY_FORMAT);
}

/** 两个日粒度时间之间的天数；任一为空返回 null（不要把「算不出」伪装成 0 天） */
export function daysBetween(from: string | null, to: string | null): number | null {
    if (!from || !to) return null;

    const start = momentFactory(from, DAY_FORMAT, true);
    const end = momentFactory(to, DAY_FORMAT, true);

    if (!start.isValid() || !end.isValid()) return null;

    return Math.round(end.diff(start, 'days'));
}

// ============================================================
// 五级复盘的周期算术
// ============================================================

/** 一篇周期笔记的三个邻居，用于生成导航行 */
export interface PeriodNeighbours {
    readonly prev: string;
    readonly next: string;
    /** 上级周期笔记标题；年记没有上级 */
    readonly parent: string | null;
}

/** 当下所属周期的标题，也就是「今天/本周/本月/本季/本年」那篇笔记的文件名 */
export function currentPeriodTitle(period: PeriodDefinition): string {
    return momentFactory().format(period.titleFormat);
}

/**
 * 从一个文件名反解出它是哪一级周期笔记，认不出来返回 null。
 *
 * 它是 currentPeriodTitle 的逆函数：那边由「哪一级 + 此刻」推出文件名，
 * 这边由文件名推回「哪一级」。五种格式在严格解析下互不相容
 * （2026-09 不是年、2026-09-10 不是月、2026-W37 不是月），
 * 因此按 PERIODS 的顺序取第一个解得通的，结果唯一且与遍历次序无关。
 * 严格二字是全部的分量所在：「未命名」「会议纪要 2026-09-10」「2026-13-45」
 * 都必须认不出来——认错一次，插件就会往一篇不是日记的笔记里写日记骨架。
 */
export function periodOfTitle(title: string): PeriodDefinition | null {
    for (const period of Object.values(PERIODS)) {
        if (periodStartOf(period, title) !== null) return period;
    }

    return null;
}

/**
 * 从周期笔记的标题反解出周期锚点（YYYY-MM-DD）。
 * 严格解析：标题不是该级的格式就返回 null，由调用方显式提示，
 * 绝不悄悄回退到「当前周期」——那会让一篇命名错误的笔记安静地冒充本周。
 */
export function periodStartOf(period: PeriodDefinition, title: string): string | null {
    const parsed = momentFactory(title, period.titleFormat, true);

    if (!parsed.isValid()) return null;

    return parsed.startOf(period.startOfUnit).format(DAY_FORMAT);
}

/** 周期区间的开区间右端：`start <= x < end`，五级共用同一条比较式 */
export function periodEndOf(period: PeriodDefinition, startDay: string): string {
    return shiftDay(startDay, 1, period.stepUnit);
}

/**
 * 算出一篇周期笔记的上一篇、下一篇与上级。
 *
 * 上级一律用「周期锚点 → 按上级格式重新格式化」求得，唯独周记要先 +3 天：
 * 周归属月按 ISO 惯例以周四为准，每周只归一个月，不重不漏。
 * 若改成按周一归属，跨月那一周会在两个月里各出现一次或一次都不出现。
 */
export function periodNeighbours(
    period: PeriodDefinition,
    title: string,
    parentPeriod: PeriodDefinition | null,
): PeriodNeighbours | null {
    const parsed = momentFactory(title, period.titleFormat, true);

    if (!parsed.isValid()) return null;

    const prev = parsed.clone().subtract(1, period.stepUnit).format(period.titleFormat);
    const next = parsed.clone().add(1, period.stepUnit).format(period.titleFormat);

    if (!parentPeriod) return { prev, next, parent: null };

    const anchor = parsed.clone().startOf(period.startOfUnit);
    const parent = (period.key === 'weekly' ? anchor.add(3, 'days') : anchor).format(
        parentPeriod.titleFormat,
    );

    return { prev, next, parent };
}

/**
 * 把某个日粒度时间按某一级的标题格式重新表达。
 * 主题链向上汇总时用它把「某一天」折算成「它属于哪一周/哪个月」。
 */
export function titleOfDay(day: string, period: PeriodDefinition): string | null {
    const parsed = momentFactory(day, DAY_FORMAT, true);

    return parsed.isValid() ? parsed.format(period.titleFormat) : null;
}
