/**
 * [INPUT]: 依赖显示区间、15 分钟步长与缩放边界。
 * [OUTPUT]: 提供时间坐标、双端区间约束、缩放与区间滚动锚点。
 * [POS]: 周历几何内核；缩放改变格子大小，不改变配置区间。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { MAX_ZOOM, MIN_ZOOM, PlannerSettings, STEP } from './model';
export interface TimeWindow { start: number; end: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function windowOf(settings: PlannerSettings): TimeWindow { return { start: settings.startHour * 60, end: settings.endHour * 60 }; }
export function timeRatio(minute: number, range: TimeWindow): number { return (minute - range.start) / (range.end - range.start); }
export function rangeEdge(range: TimeWindow, edge: 'start' | 'end', minute: number): TimeWindow {
    if (!Number.isFinite(minute)) return { ...range };
    const value = Math.round(minute / STEP) * STEP;
    return edge === 'start' ? { start: clamp(value, 0, range.end - STEP), end: range.end }
        : { start: range.start, end: clamp(value, range.start + STEP, 1440) };
}
export function rangeScroll(scroll: number, height: number, zoom: number, before: TimeWindow, after: TimeWindow): number {
    const gridHeight = height * zoom / 100;
    const minute = before.start + (scroll + height / 2) / gridHeight * (before.end - before.start);
    return clamp(timeRatio(minute, after) * gridHeight - height / 2, 0, Math.max(0, gridHeight - height));
}
export function minuteAt(y: number, top: number, height: number, range: TimeWindow): number {
    const minute = range.start + clamp((y - top) / Math.max(1, height), 0, 1) * (range.end - range.start);
    return clamp(Math.round(minute / STEP) * STEP, range.start, range.end);
}
export function zoomValue(value: number): number { return Math.round(clamp(value, MIN_ZOOM, MAX_ZOOM) * 10) / 10; }
export function zoomScroll(scroll: number, viewportHeight: number, before: number, after: number, anchorY: number): number {
    const anchor = clamp(anchorY, 0, viewportHeight);
    const next = (scroll + anchor) * after / before - anchor;
    return clamp(next, 0, Math.max(0, viewportHeight * (after / 100 - 1)));
}
export class WheelZoom {
    private pending = 0;
    reset(): void { this.pending = 0; }
    apply(zoom: number, delta: number, modified: boolean): number | null {
        if (!modified || !delta || !Number.isFinite(delta)) { this.reset(); return null; }
        if (delta * this.pending < 0) this.reset();
        this.pending = clamp(this.pending + delta, -120, 120);
        const next = zoomValue(zoom * Math.exp(-this.pending * .003));
        if (next !== zoom || (next === MIN_ZOOM && delta > 0) || (next === MAX_ZOOM && delta < 0)) this.reset();
        return next;
    }
}
