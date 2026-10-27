/**
 * [INPUT]: 依赖 core/time 的日历算术与 core/plannerSettings 的显示偏好验形。
 * [OUTPUT]: 提供安排、缩放配置、滚动七日窗口与重叠布局。
 * [POS]: 大日历领域模型；不读写笔记。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { dayText, shiftDay, today } from '../../core/time';
import { DEFAULT_PLANNER_PREFERENCES, normalizePlannerPreferences, PLANNER_MIN_ZOOM, PLANNER_MAX_ZOOM } from '../../core/plannerSettings';
import type { ColorKey } from './colors';
export const VIEW_TYPE = 'ziminos-week-planner-view';
export const STEP = 15;
export const MIN_ZOOM = PLANNER_MIN_ZOOM;
export const MAX_ZOOM = PLANNER_MAX_ZOOM;
export const DISPLAY_DEFAULTS = { startHour: 0, endHour: 24, zoom: 100 };
export interface PlannerSettings {
    startHour: number; endHour: number; projectFolder: string; areaFolder: string;
    archiveFolder: string; cardTemplate: string; dateTimeFormat: string; zoom: number;
}
export const DEFAULTS: PlannerSettings = {
    ...DEFAULT_PLANNER_PREFERENCES, projectFolder: '01-projects', areaFolder: '02-areas',
    archiveFolder: '04-archives',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
};
export interface Interval { day: string; start: number; end: number }
export interface Container { path: string; folder: string; name: string; kind: 'project' | 'area'; active: boolean }
export interface Person { path: string; name: string; kind: string; color: ColorKey }
export interface Arrangement extends Interval {
    id: string; cardPath: string; mocPath: string; name: string; notes: string;
    people: string[]; relation: 'self' | 'with' | 'client'; done: boolean;
    kind: 'project' | 'area'; sourceTask: string; color: ColorKey; colorPerson: string; error?: string;
}
export interface Draft extends Interval {
    mode: 'project' | 'area' | 'new'; target: string; projectName: string;
    name: string; notes: string; people: string[]; relation: 'self' | 'with' | 'client'; sourceTask: string;
    color: ColorKey; colorPerson: string; colorEdited: boolean;
}
export function settingsOf(value: Partial<PlannerSettings> = {}): PlannerSettings {
    const output = { ...DEFAULTS, ...normalizePlannerPreferences(value) };
    for (const key of ['projectFolder', 'areaFolder', 'archiveFolder', 'dateTimeFormat'] as const) {
        const text = typeof value[key] === 'string' ? value[key].trim() : '';
        if (text && (key === 'dateTimeFormat' || (!text.startsWith('/') && !text.split('/').includes('..')))) output[key] = text.replace(/\/$/, '');
    }
    return output;
}
export function validDay(day: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(day) && dayText(day) === day; }
export function clock(minute: number): string { return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`; }
export function minuteOf(text: string): number {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text) && text !== '24:00') return NaN;
    const [h, m] = text.split(':').map(Number); return h * 60 + m;
}
export function validateInterval(value: Interval): void {
    if (!validDay(value.day) || !Number.isInteger(value.start) || !Number.isInteger(value.end) || value.start < 0 || value.end > 1440 || value.end - value.start < STEP) {
        throw new Error('请选择有效日期和至少 15 分钟的同日区间。');
    }
}
export function localStamp(day: string, minute: number): string {
    return minute === 1440 ? `${shiftDay(day, 1, 'day')}T00:00:00` : `${day}T${clock(minute)}:00`;
}
export function intervalOf(start: unknown, end: unknown): Interval | null {
    if (typeof start !== 'string' || typeof end !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(start) || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(end)) return null;
    const day = start.slice(0, 10), s = minuteOf(start.slice(11, 16));
    const e = end.slice(0, 10) === day ? minuteOf(end.slice(11, 16))
        : end.slice(0, 10) === shiftDay(day, 1, 'day') && end.slice(11, 16) === '00:00' ? 1440 : NaN;
    const value = { day, start: s, end: e };
    try { validateInterval(value); return value; } catch { return null; }
}
export function weekOf(day = today()): string[] {
    // 日历算术走现有时间口径；公历 1970-01-05 是周一。
    let cursor = day;
    const anchor = Date.parse(`${day}T12:00:00Z`);
    const weekday = new Date(anchor).getUTCDay();
    cursor = shiftDay(cursor, -((weekday + 6) % 7), 'day');
    return daysFrom(cursor);
}
export function daysFrom(day: string): string[] { return Array.from({ length: 7 }, (_, i) => shiftDay(day, i, 'day')); }
export function weekdayOf(day: string): number { return new Date(`${day}T12:00:00Z`).getUTCDay(); }
export function durationText(minutes: number): string {
    const hours = Math.floor(minutes / 60), rest = minutes % 60;
    return `${hours ? `${hours} 小时` : ''}${hours && rest ? ' ' : ''}${rest ? `${rest} 分钟` : ''}` || '0 分钟';
}
export function safeName(name: string): string {
    const text = name.trim();
    if (!text || text === '.' || text === '..' || /[\\/:*?"<>|\[\]#^\r\n\x00-\x1f]/.test(text) || /[. ]$/.test(text) || text.length > 120 || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(text)) {
        throw new Error('名称不能为空，且不能含路径符、双链符号或系统保留名称。');
    }
    return text;
}
export function wiki(path: string, alias = path.split('/').pop()!.replace(/\.md$/, '')): string {
    return `[[${path.replace(/\.md$/, '')}|${alias.replace(/[\[\]|\r\n]/g, '')}]]`;
}
export function calendarLink(day: string, id: string, vault: string): string {
    return `obsidian://ziminos-calendar?vault=${encodeURIComponent(vault)}&date=${day}&event=${encodeURIComponent(id)}`;
}
export function layoutEvents(events: Arrangement[]): Map<string, { lane: number; count: number }> {
    const result = new Map<string, { lane: number; count: number }>();
    let group: Arrangement[] = [], lanes: number[] = [], maxEnd = -1;
    const finish = () => { for (const item of group) result.get(item.id)!.count = lanes.length; group = []; lanes = []; };
    for (const item of [...events].sort((a, b) => a.start - b.start || a.end - b.end)) {
        if (group.length && item.start >= maxEnd) { finish(); maxEnd = -1; }
        let lane = lanes.findIndex(end => end <= item.start);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = item.end; maxEnd = Math.max(maxEnd, item.end); group.push(item);
        result.set(item.id, { lane, count: 1 });
    }
    finish(); return result;
}
