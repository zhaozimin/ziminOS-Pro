/**
 * [INPUT]: 依赖 obsidian 的 App 与 TFile 类型；只用 createEl/createDiv 等原生 DOM 辅助与
 *          workspace.openLinkText，不依赖任何渲染插件；样式由插件自带的 styles.css 承担
 * [OUTPUT]: 对外提供单元格类型 Cell/NoteLink/RichText 与 noteLink/richText 构造器，
 *           渲染原语 renderTable / renderTaskList / renderEmpty / renderNote / renderHeading /
 *           renderSummary / renderRichText，以及携带写回身份快照的 TaskLine；双链保留原有锚点
 * [POS]: 视图引擎的呈现层，二十四个视图的唯一出口。它不认识任何业务概念，只认识
 *        「表头 + 行 + 单元格」与「一组任务」。三条纪律都来自真机对比：
 *        其一，文本里的 `[[双链]]` 必须渲染成可点的链接。视图检索出来的是日记原文，
 *        原文里的人名、项目名都是双链——渲染成死文本，等于把一张关系网拍平成一段字符串；
 *        其二，任务行必须渲染成真的复选框并能勾。看起来像复选框却点不动是撒谎，
 *        所以勾选会写回源文件那一行；
 *        其三，表格是三线表。逻辑上属于同一张表的内容必须一次画完——
 *        两次建表会得到两个各自算列宽的 table，同一张逻辑表的列必然错位
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { App } from 'obsidian';

/** 指向库内某篇笔记的链接单元格 */
export interface NoteLink {
    readonly path: string;
    /** 显示文本，默认取文件名 */
    readonly display: string;
}

/**
 * 一段可能含 `[[双链]]` 的文本。
 * from 是解析这些链接的基准路径——视图检索出来的行来自日记，
 * 链接必须相对那篇日记解析，而不是相对视图所在的档案。
 */
export interface RichText {
    readonly text: string;
    readonly from: string;
}

/** 表格单元格可以是文本、数字、笔记链接、带双链的文本，或调用方自己搭好的元素 */
export type Cell = string | number | NoteLink | RichText | HTMLElement | null | undefined;

/** 一条待办：它从哪篇笔记的哪一行来，现在勾没勾 */
export interface TaskLine {
    readonly file: TFile;
    /** 分组用的日期，通常是来源日记的文件名 */
    readonly day: string;
    readonly text: string;
    readonly line: number;
    readonly rawLine: string;
    readonly checked: boolean;
}

/** 由文件构造链接单元格；display 缺省即文件名 */
export function noteLink(file: TFile, display?: string): NoteLink {
    return { path: file.path, display: display ?? file.basename };
}

/** 由一段原文构造富文本单元格，fromPath 是解析其中双链的基准 */
export function richText(text: string, fromPath: string): RichText {
    return { text, from: fromPath };
}

function isObjectCell(cell: Cell): cell is NoteLink | RichText {
    return typeof cell === 'object' && cell !== null && !(cell instanceof HTMLElement);
}

function isNoteLink(cell: Cell): cell is NoteLink {
    return isObjectCell(cell) && 'path' in cell;
}

// ============================================================
// 表格
// ============================================================

/**
 * 渲染一张三线表。
 *
 * 首列表头带上行数（`项目 (3)`）——一屏之内先知道「有几条」，再决定要不要细看，
 * 这是复盘与名录都需要的第一个信息。
 *
 * grow 指出哪一列该吃掉剩余宽度。表格总是占满整行，问题只在于多出来的空间给谁：
 * 不指定时浏览器按内容比例摊给每一列，结果是每列都窄一点、每列都要换行；
 * 指定之后，日期、状态、数字这些定宽列各自收到刚好够用的宽度，
 * 概述、事项、发生了什么这类句子列拿走全部余量。一句话读不读得下去，差别就在这里。
 */
export function renderTable(
    app: App,
    el: HTMLElement,
    sourcePath: string,
    headers: readonly string[],
    rows: readonly (readonly Cell[])[],
    grow?: number,
): void {
    const wrapper = el.createDiv({ cls: 'ziminos-table-wrap' });
    const table = wrapper.createEl('table', { cls: 'ziminos-table' });
    const headRow = table.createEl('thead').createEl('tr');
    // 只有真的指定了句子列，其余列才收紧；否则一律放开，交给浏览器按内容摊
    const classOf = (index: number): string | undefined =>
        grow === undefined ? undefined : index === grow ? 'ziminos-grow' : 'ziminos-tight';

    headers.forEach((header, index) => {
        headRow.createEl('th', {
            cls: classOf(index),
            text: index === 0 && rows.length ? `${header} (${rows.length})` : header,
        });
    });

    const body = table.createEl('tbody');

    for (const row of rows) {
        const tr = body.createEl('tr');

        row.forEach((cell, index) => {
            renderCell(app, tr.createEl('td', { cls: classOf(index) }), sourcePath, cell);
        });
    }
}

/** 把一个单元格画进 td */
function renderCell(app: App, td: HTMLElement, sourcePath: string, cell: Cell): void {
    if (cell === null || cell === undefined) {
        td.setText('—');

        return;
    }

    if (cell instanceof HTMLElement) {
        td.appendChild(cell);

        return;
    }

    if (isNoteLink(cell)) {
        renderNoteLink(app, td, sourcePath, cell);

        return;
    }

    if (isObjectCell(cell)) {
        renderTextWithLinks(app, td, cell.text, cell.from);

        return;
    }

    renderRichText(td, String(cell));
}

/**
 * 画一条库内链接。
 *
 * 类名与 data-href 让 Obsidian 认出它并接管悬停预览与样式；
 * 点击则由我们自己转交给 workspace.openLinkText，因此即使将来那套约定变了，
 * 链接依然点得开——样式可以退化，功能不能。
 */
function renderNoteLink(app: App, parent: HTMLElement, sourcePath: string, link: NoteLink): void {
    const anchor = parent.createEl('a', {
        cls: 'internal-link',
        text: link.display,
        href: link.path,
    });

    anchor.setAttribute('data-href', link.path);

    anchor.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        void app.workspace.openLinkText(link.path, sourcePath, event.ctrlKey || event.metaKey);
    });
}

/** 匹配一段文本里的 `[[目标]]` 或 `[[目标|别名]]` */
const WIKILINK = /\[\[([^\]|]+?)(?:\\?\|([^\]]*))?\]\]/g;

/**
 * 把一段原文画出来，其中的 `[[双链]]` 渲染成可点的链接。
 *
 * 只认双链这一种标记，不接完整 Markdown 渲染器：这些文本是用户日记里的原话，
 * 交给渲染器等于把用户数据当代码执行，一个 `![[大图]]` 就会在名录里嵌进一张图。
 * 未解析到文件的链接照样画成链接（点击会走 Obsidian 的新建流程），
 * 这与在正文里点一个红色链接的行为一致，不制造第二套语义。
 */
export function renderTextWithLinks(
    app: App,
    parent: HTMLElement,
    text: string,
    fromPath: string,
): void {
    WIKILINK.lastIndex = 0;

    let cursor = 0;
    let match = WIKILINK.exec(text);

    while (match) {
        if (match.index > cursor) parent.appendText(text.slice(cursor, match.index));

        const target = match[1].trim();
        const display = (match[2] ?? '').trim() || target;

        renderNoteLink(app, parent, fromPath, { path: target, display });

        cursor = match.index + match[0].length;
        match = WIKILINK.exec(text);
    }

    if (cursor < text.length) parent.appendText(text.slice(cursor));
}

// ============================================================
// 待办
// ============================================================

/**
 * 把一组任务渲染成一张三线表：事项一列、日期一列。
 *
 * 它走的是与其余二十一个视图同一个 renderTable，因此三线、列宽分配、行数计数
 * 全都自动一致——待办不该是这套系统里唯一长得不一样的东西。
 * 复选框与事项必须同处一格：分成两列的话，一个待办会被表格的列切成两半，
 * 而勾选框离它要勾的那句话越远，越容易勾错。
 *
 * 勾选会写回源文件那一行——看起来像复选框却点不动是撒谎，
 * 而「在档案里看见待办、顺手勾掉」正是这个视图存在的理由。
 * 写回由调用方负责（它才有 guard 与写权限），这里只负责把点击事件交出去。
 */
export function renderTaskList(
    app: App,
    el: HTMLElement,
    sourcePath: string,
    tasks: readonly TaskLine[],
    onToggle: (task: TaskLine) => void,
): void {
    const ordered = [...tasks].sort((left, right) => right.day.localeCompare(left.day));

    renderTable(
        app,
        el,
        sourcePath,
        ['待办', '日期'],
        ordered.map((task): Cell[] => [taskCell(app, task, onToggle), noteLink(task.file, task.day)]),
        0,
    );
}

/** 一个待办格：复选框 + 事项原文（其中的双链照样可点） */
function taskCell(app: App, task: TaskLine, onToggle: (task: TaskLine) => void): HTMLElement {
    const cell = createSpan({ cls: 'ziminos-task' });
    const box = cell.createEl('input', { type: 'checkbox', cls: 'task-list-item-checkbox' });

    box.checked = task.checked;

    if (task.checked) cell.addClass('is-checked');

    box.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        onToggle(task);
    });

    renderTextWithLinks(app, cell.createSpan({ cls: 'ziminos-task-text' }), task.text, task.file.path);

    return cell;
}

// ============================================================
// 文字
// ============================================================

/**
 * 空态：一句话说清楚「现在什么都没有」以及「下一步该做什么」。
 *
 * 强制带指引，是因为学员第一次打开 MOC 时全部视图都是空的——
 * 一片空白会让他以为系统坏了，一句「命令面板运行『新建人脉』建第一个」则是入口。
 */
export function renderEmpty(el: HTMLElement, message: string): void {
    renderRichText(el.createEl('p', { cls: 'ziminos-empty' }), `📭 ${message}`);
}

/** 视图的说明或统计行，弱化显示 */
export function renderNote(el: HTMLElement, message: string): void {
    renderRichText(el.createEl('p', { cls: 'ziminos-note' }), message);
}

/** 视图内的分组小标题 */
export function renderHeading(el: HTMLElement, level: 3 | 4, text: string): void {
    el.createEl(level === 3 ? 'h3' : 'h4', { cls: 'ziminos-heading', text });
}

/** 视图顶部的一句话总结，允许 **加粗** */
export function renderSummary(el: HTMLElement, text: string): void {
    renderRichText(el.createEl('p', { cls: 'ziminos-summary' }), text);
}

/** 我们自己写的文案里认得的两种标记：`**加粗**` 与 `` `行内代码` ``。先到先得，故代码里的 ** 不再是加粗 */
const RICH_MARKUP = /`([^`]+)`|\*\*([^*]+)\*\*/g;

/**
 * 只认识 `**加粗**` 与 `` `行内代码` `` 的极小文本渲染，用于我们自己写的文案。
 * 用户数据一律走 renderTextWithLinks，两者的区别是：这里的文本是我们写的，那里的不是。
 *
 * 行内代码这一条是必须的，不是锦上添花：空态提示的正文就是「照着这行抄」——
 * `- [[张三]]｜去｜事项｜两清` 是一行要被原样敲进日记的账本行，
 * 把包着它的反引号原样打印出来，学员会连反引号一起抄进去，那一行就再也不会被解析成账。
 * 提示语教的是语法，而教语法的句子自己必须先把语法显示对。
 *
 * 扫描一遍、先到先得，两种标记因此不会互相嵌套：反引号里的 ** 是代码的一部分，
 * 不是加粗。落单的反引号或星号匹配不上，原样留着——文案里出现一个孤立的星号是常事，
 * 让它吃掉后面半句比不认识它更糟。
 */
export function renderRichText(parent: HTMLElement, text: string): void {
    RICH_MARKUP.lastIndex = 0;

    let cursor = 0;
    let match = RICH_MARKUP.exec(text);

    while (match) {
        if (match.index > cursor) parent.appendText(text.slice(cursor, match.index));

        if (match[1] !== undefined) parent.createEl('code', { text: match[1] });
        else parent.createEl('strong', { text: match[2] });

        cursor = match.index + match[0].length;
        match = RICH_MARKUP.exec(text);
    }

    if (cursor < text.length) parent.appendText(text.slice(cursor));
}
