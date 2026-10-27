/**
 * [INPUT]: 依赖 Obsidian YAML 公共函数、原卡片字段序和 Markdown 换行口径。
 * [OUTPUT]: 提供模板建卡、保留原文的属性补写、稳定任务行和人物 Dataview。
 * [POS]: 大日历的文本边界；日历不另造卡片模板或完成字段。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { parseYaml, stringifyYaml } from 'obsidian';
import { CARD_FIELDS } from '../../core/constants';
import { insertIntoSection } from '../../core/markdown';
import { splitTextLines, joinTextLines } from '../../core/lineEndings';
import { clock, minuteOf, validDay, validateInterval, wiki } from './model';
import type { Arrangement, Interval, PlannerSettings } from './model';
export const SCHEDULE_HEADING = '## 时间安排';
export const PEOPLE_MARKER = '<!-- ziminos-week-planner:tasks -->';
export interface TaskRow extends Interval { id: string; line: number; raw: string; done: boolean; cardLink: string }
export function yamlOf(text: string): Record<string, unknown> {
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!match) return {};
    const value: unknown = parseYaml(match[1]);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('笔记属性不是有效的 YAML 对象。');
    return value as Record<string, unknown>;
}
// 只替换明确拥有的顶层键，保留其他字段、注释和正文原文。
export function patchProperties(text: string, patch: Record<string, unknown>): string {
    const { lineEnding } = splitTextLines(text);
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    yamlOf(text);
    const lines = match ? match[1].split(/\r?\n/) : [];
    for (const [key, value] of Object.entries(patch)) {
        const indexes = lines.flatMap((line, i) => line.startsWith(`${key}:`) ? [i] : []);
        if (indexes.length > 1) throw new Error(`属性 ${key} 重复，已停止写入。`);
        const encoded = stringifyYaml({ [key]: value }).trimEnd().split(/\r?\n/);
        if (!indexes.length) { lines.push(...encoded); continue; }
        const start = indexes[0]; let end = start + 1;
        while (end < lines.length && !/^[^\s#][^:]*:/.test(lines[end])) end++;
        // 末尾空行和独立注释属于原文，不随字段替换删除。
        while (end > start + 1 && /^(?:\s*|#.*)$/.test(lines[end - 1])) end--;
        lines.splice(start, end - start, ...encoded);
    }
    const body = match ? text.slice(match[0].length) : text;
    return ['---', ...lines, '---', body].join(lineEnding);
}
export function createCard(template: string, values: Record<string, unknown>): string {
    const original = yamlOf(template);
    const fields: Record<string, unknown> = {};
    for (const key of CARD_FIELDS) fields[key] = original[key] ?? null;
    Object.assign(fields, original, values);
    const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(template);
    const body = match ? template.slice(match[0].length) : template;
    return `---\n${stringifyYaml(fields)}---\n${body}`;
}
export function scheduleRow(item: Pick<Arrangement, 'id' | 'day' | 'start' | 'end' | 'done' | 'cardPath' | 'name' | 'people'>): string {
    const people = item.people.length ? ` · ${item.people.map(path => wiki(path)).join(' · ')}` : '';
    return `- [${item.done ? 'x' : ' '}] ${item.day} ${clock(item.start)}–${clock(item.end)}：${wiki(item.cardPath, item.name)}${people} ^schedule-${item.id}`;
}
export function taskRows(text: string): { rows: TaskRow[]; errors: string[] } {
    const { lines } = splitTextLines(text); const rows: TaskRow[] = [], errors: string[] = [];
    let section = false, fenced = false;
    lines.forEach((raw, line) => {
        if (/^\s*(```|~~~)/.test(raw)) { fenced = !fenced; return; }
        if (fenced) return;
        if (/^#{1,6}\s/.test(raw)) section = raw.trim() === SCHEDULE_HEADING;
        const id = /\^schedule-([a-zA-Z0-9-]+)\s*$/.exec(raw)?.[1];
        if (!id) return;
        const match = /^- \[([ xX])\] (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})[–-](\d{2}:\d{2})[：:]\s*(\[\[[^\]]+\]\])/.exec(raw);
        if (!section || !match) { errors.push(`预设任务 ${id} 的日期或格式不完整。`); return; }
        const value = { day: match[2], start: minuteOf(match[3]), end: minuteOf(match[4]) };
        try { validateInterval(value); } catch { errors.push(`预设任务 ${id} 的时间无效。`); return; }
        rows.push({ ...value, id, line, raw, done: match[1] !== ' ', cardLink: match[5] });
    });
    const seen = new Set<string>();
    for (const row of rows) { if (seen.has(row.id)) errors.push(`预设任务 ${row.id} 出现重复身份。`); seen.add(row.id); }
    return { rows, errors };
}
export function replaceRow(text: string, id: string, replacement: string, expected?: string): string {
    const { rows, errors } = taskRows(text);
    const found = rows.filter(row => row.id === id);
    if (found.length !== 1 || errors.some(error => error.includes(id))) throw new Error('MOC 任务缺失、重复或格式有变，请先检查原笔记。');
    if (expected !== undefined && found[0].raw !== expected) throw new Error('安排已在其他窗口修改，请重新打开后再试。');
    const { lines, lineEnding } = splitTextLines(text); lines[found[0].line] = replacement;
    return joinTextLines(lines, lineEnding);
}
export function appendRow(text: string, row: string): string {
    const id = /\^schedule-([^\s]+)$/.exec(row)?.[1];
    if (!id || text.includes(`^schedule-${id}`)) throw new Error('安排身份已存在，已停止重复创建。');
    return insertIntoSection(text, SCHEDULE_HEADING, row);
}
export function personTasks(settings: PlannerSettings): string {
    const roots = [...new Set([settings.projectFolder, settings.areaFolder, settings.archiveFolder])];
    return `${PEOPLE_MARKER}\n## 预设任务\n\n\`\`\`dataview\nTASK FROM ${roots.map(root => JSON.stringify(root)).join(' OR ')}\nWHERE meta(section).subpath = "时间安排"\n  AND contains(outlinks, this.file.link)\n  AND !completed\nSORT text ASC\n\`\`\`\n\n<!-- 删除 AND !completed 可同时查看已完成安排。 -->\n`;
}
export function ensurePersonTasks(text: string, settings: PlannerSettings): string {
    if (text.includes(PEOPLE_MARKER)) return text;
    const { lineEnding } = splitTextLines(text);
    return `${text.trimEnd()}${lineEnding}${lineEnding}${personTasks(settings).replace(/\n/g, lineEnding)}`;
}
export function linkedPath(value: unknown): string {
    const first = Array.isArray(value) ? value[0] : value;
    return typeof first === 'string' ? first.replace(/^\[\[/, '').split(/[|#\]]/)[0] : '';
}
export function linkList(value: unknown): string[] {
    return (Array.isArray(value) ? value : value ? [value] : []).map(linkedPath).filter(Boolean);
}
