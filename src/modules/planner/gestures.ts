/**
 * [INPUT]: 依赖周历 DOM、实时画布尺寸、时间坐标与安排快照。
 * [OUTPUT]: 提供点击选择、按住即拖的跨日移动、拖选创建、边缘缩放和 Esc 取消。
 * [POS]: 日历手势层；预览不写盘，仅拖动后松手提交；空白单击不创建。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Arrangement, Interval, STEP, clock } from './model';
import { minuteAt, timeRatio } from './viewport';
const DRAG_DISTANCE = 3;
interface Gesture {
    pointer: number; x: number; y: number; anchorMinute: number; mode: 'select' | 'move' | 'start' | 'end';
    origin: Interval; current: Interval; event?: Arrangement; moved: boolean;
}
export class CalendarGestures {
    private gesture?: Gesture;
    private ghost?: HTMLElement;
    private doc: Document;
    constructor(private root: HTMLElement, private days: string[], private start: number, private end: number,
        private events: Arrangement[], private select: (value: Interval) => void,
        private commit: (event: Arrangement, value: Interval) => void, private choose: (event: Arrangement) => void) {
        this.doc = root.ownerDocument;
        root.addEventListener('pointerdown', this.down);
        root.addEventListener('pointermove', this.move);
        root.addEventListener('pointerup', this.up);
        root.addEventListener('pointercancel', this.cancel);
        this.doc.addEventListener('keydown', this.key);
    }
    destroy(): void {
        this.reset();
        this.root.removeEventListener('pointerdown', this.down);
        this.root.removeEventListener('pointermove', this.move);
        this.root.removeEventListener('pointerup', this.up);
        this.root.removeEventListener('pointercancel', this.cancel);
        this.doc.removeEventListener('keydown', this.key);
    }
    private point(x: number, y: number): { day: string; minute: number } {
        const columns = Array.from(this.root.querySelectorAll<HTMLElement>('.zwp-day-column'));
        const first = columns[0].getBoundingClientRect(), last = columns[6].getBoundingClientRect();
        const index = Math.min(6, Math.max(0, Math.floor((x - first.left) / ((last.right - first.left) / 7))));
        const minute = minuteAt(y, first.top, first.height, { start: this.start, end: this.end });
        return { day: this.days[index], minute };
    }
    private down = (e: PointerEvent): void => {
        if (this.gesture || e.button !== 0 || !(e.target instanceof Element) || e.target.closest('input,button')) return;
        const column = e.target.closest('.zwp-day-column'); if (!column) return;
        const block = e.target.closest<HTMLElement>('.zwp-event');
        const item = block ? this.events.find(item => item.id === block.dataset.id) : undefined;
        if (item?.error) { this.choose(item); return; }
        const point = this.point(e.clientX, e.clientY);
        const edge = e.target.closest<HTMLElement>('[data-edge]')?.dataset.edge as 'start' | 'end' | undefined;
        const mode = item ? edge ?? 'move' : 'select';
        const origin = item ? { day: item.day, start: item.start, end: item.end }
            : { day: point.day, start: Math.min(point.minute, this.end - STEP), end: Math.min(point.minute + STEP, this.end) };
        this.gesture = { pointer: e.pointerId, x: e.clientX, y: e.clientY, anchorMinute: point.minute, mode, origin, current: { ...origin }, event: item, moved: false };
        this.root.setPointerCapture(e.pointerId);
        if (mode !== 'move') { e.preventDefault(); this.preview(); }
    };
    private move = (e: PointerEvent): void => {
        const g = this.gesture; if (!g || g.pointer !== e.pointerId) return;
        const distance = Math.hypot(e.clientX - g.x, e.clientY - g.y);
        if (!g.moved && distance <= DRAG_DISTANCE) return;
        e.preventDefault(); g.moved = true; this.root.addClass('zwp-dragging');
        const point = this.point(e.clientX, e.clientY);
        if (g.mode === 'select') {
            g.current = { day: g.origin.day, start: Math.min(g.origin.start, Math.min(point.minute, this.end - STEP)), end: Math.max(g.origin.end, point.minute) };
        } else if (g.mode === 'move') {
            const duration = g.origin.end - g.origin.start;
            const start = Math.max(0, Math.min(1440 - duration, g.origin.start + point.minute - g.anchorMinute));
            g.current = { day: point.day, start, end: start + duration };
        } else if (g.mode === 'start') g.current.start = Math.max(0, Math.min(g.origin.end - STEP, point.minute));
        else g.current.end = Math.min(1440, Math.max(g.origin.start + STEP, point.minute));
        this.preview();
    };
    private preview(): void {
        const g = this.gesture; if (!g) return;
        this.ghost?.remove();
        const column = this.root.querySelector<HTMLElement>(`.zwp-day-column[data-day="${g.current.day}"]`);
        if (!column) return;
        this.ghost = column.createDiv({ cls: 'zwp-selection' });
        const range = { start: this.start, end: this.end };
        this.ghost.style.top = `${timeRatio(g.current.start, range) * 100}%`;
        this.ghost.style.height = `${(g.current.end - g.current.start) / (this.end - this.start) * 100}%`;
        this.ghost.createDiv({ text: `${clock(g.current.start)}–${clock(g.current.end)}` });
        if (g.event) this.ghost.createDiv({ text: g.event.name });
    }
    private up = (e: PointerEvent): void => {
        const g = this.gesture; if (!g || g.pointer !== e.pointerId) return;
        this.move(e);
        const changed = JSON.stringify(g.origin) !== JSON.stringify(g.current);
        this.reset();
        if (g.mode === 'select' && g.moved) this.select(g.current);
        else if (g.event && g.moved && changed) this.commit(g.event, g.current);
        else if (g.event) this.choose(g.event);
    };
    private key = (e: KeyboardEvent): void => { if (e.key === 'Escape' && this.gesture) { e.preventDefault(); this.reset(); } };
    private cancel = (): void => { this.reset(); };
    private reset(): void {
        if (this.gesture && this.root.hasPointerCapture(this.gesture.pointer)) this.root.releasePointerCapture(this.gesture.pointer);
        this.gesture = undefined; this.ghost?.remove(); this.ghost = undefined; this.root.removeClass('zwp-dragging');
    }
}
