/**
 * [INPUT]: 接收数值边界、格式、约束函数与变更回调。
 * [OUTPUT]: 提供单行矩形滑块；数值置于轨道内，支持指针和键盘。
 * [POS]: 区间和比例共用的呈现器；业务约束与设置写入由调用方负责。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export interface SliderControl { element: HTMLElement; update(values: number[]): void }
interface SliderOptions {
    label: string; names: string[]; min: number; max: number; step: number; pageStep: number;
    limits: [string, string]; format(value: number): string;
    constrain(values: number[], index: number, value: number): number[];
    changed(values: number[]): void;
}
const THUMB_WIDTH = 16, THUMB_CENTER = THUMB_WIDTH / 2, BADGE_GAP = 8;
export function sliderControl(parent: HTMLElement, initial: number[], options: SliderOptions): SliderControl {
    let current = [...initial];
    let drag: { id: number; index: number; offset: number; origin: number[] } | undefined;
    const root = parent.createDiv({ cls: 'zwp-slider', attr: { role: 'group', 'aria-label': options.label } });
    root.createDiv({ cls: 'zwp-slider-label', text: options.label });
    const track = root.createDiv({ cls: 'zwp-slider-track' });
    const rail = track.createDiv({ cls: 'zwp-slider-rail' });
    const fill = rail.createDiv({ cls: 'zwp-slider-fill', attr: { 'aria-hidden': 'true' } });
    const thumbs = initial.map((_, index) => {
        const thumb = rail.createDiv({ cls: 'zwp-slider-thumb', attr: { 'data-thumb': String(index) } });
        thumb.createDiv({ cls: 'zwp-slider-grip', attr: { 'aria-hidden': 'true' } });
        const input = thumb.createEl('input', { type: 'range', cls: 'zwp-slider-input', attr: {
            min: String(options.min), max: String(options.max), step: String(options.step), 'aria-label': options.names[index],
        } });
        const badge = thumb.createSpan({ cls: 'zwp-slider-badge', attr: { 'aria-hidden': 'true' } });
        input.oninput = () => commit(options.constrain(current, index, Number(input.value)));
        input.onkeydown = e => {
            const delta: Record<string, number> = { ArrowLeft: -options.step, ArrowDown: -options.step, ArrowRight: options.step, ArrowUp: options.step, PageDown: -options.pageStep, PageUp: options.pageStep };
            const value = e.key === 'Home' ? options.min : e.key === 'End' ? options.max : e.key in delta ? current[index] + delta[e.key] : undefined;
            if (value !== undefined) { e.preventDefault(); e.stopPropagation(); commit(options.constrain(current, index, value)); }
        };
        return { thumb, input, badge };
    });
    const merged = rail.createSpan({ cls: 'zwp-slider-badge zwp-slider-merged', attr: { 'aria-hidden': 'true' } });
    track.title = `${options.label}范围：${options.limits[0]}–${options.limits[1]}`;
    const ratio = (value: number) => (value - options.min) / (options.max - options.min);
    function update(values: number[]): void {
        current = [...values];
        const positions = values.map(ratio), width = Math.max(1, rail.clientWidth - THUMB_WIDTH);
        const last = positions[positions.length - 1];
        thumbs.forEach(({ thumb, input, badge }, index) => {
            thumb.style.left = `calc(${positions[index] * 100}% - ${positions[index] * THUMB_WIDTH}px)`;
            input.value = String(values[index]); input.setAttribute('aria-valuetext', options.format(values[index]));
            const bounds = [options.constrain(values, index, options.min)[index], options.constrain(values, index, options.max)[index]];
            input.setAttribute('aria-valuemin', String(bounds[0])); input.setAttribute('aria-valuemax', String(bounds[1]));
            badge.textContent = options.format(values[index]); badge.hidden = false;
        });
        fill.style.left = values.length === 1 ? '0' : `calc(${positions[0] * 100}% - ${positions[0] * THUMB_WIDTH}px)`;
        fill.style.right = `calc(${(1 - last) * 100}% - ${(1 - last) * THUMB_WIDTH}px)`;
        // -- 数值贴近手柄内侧；选区过窄时借用轨道空白区 --
        const gap = (last - positions[0]) * width;
        const joined = values.length === 2 && gap < thumbs[0].badge.offsetWidth + thumbs[1].badge.offsetWidth + THUMB_WIDTH + BADGE_GAP * 2;
        thumbs.forEach(({ badge }, index) => {
            badge.hidden = joined; badge.style.left = index ? 'auto' : `${THUMB_WIDTH + BADGE_GAP / 2}px`;
            badge.style.right = index ? `${THUMB_WIDTH + BADGE_GAP / 2}px` : 'auto';
            badge.style.transform = 'translateY(-50%)';
        });
        if (values.length === 1) {
            const badge = thumbs[0].badge, inside = last * width >= badge.offsetWidth + BADGE_GAP;
            badge.style.left = inside ? `${-BADGE_GAP / 2}px` : `${THUMB_WIDTH + BADGE_GAP / 2}px`;
            badge.style.transform = inside ? 'translate(-100%,-50%)' : 'translateY(-50%)';
        }
        merged.hidden = !joined; merged.textContent = values.map(options.format).join('–');
        if (joined) {
            const start = positions[0] * width, end = last * width + THUMB_WIDTH;
            let center = (start + end) / 2;
            if (gap - THUMB_WIDTH < merged.offsetWidth + BADGE_GAP) {
                const before = start, after = rail.clientWidth - end;
                center = before >= after ? before / 2 : end + after / 2;
            }
            const inset = merged.offsetWidth / 2 + BADGE_GAP / 2;
            merged.style.left = `${Math.max(inset, Math.min(rail.clientWidth - inset, center))}px`;
        }
    }
    function commit(values: number[]): void {
        const same = values.every((value, index) => value === current[index]);
        update(values); if (!same) options.changed([...values]);
    }
    function valueAt(x: number): number {
        const rect = rail.getBoundingClientRect();
        return options.min + (x - rect.left - THUMB_CENTER) / Math.max(1, rect.width - THUMB_WIDTH) * (options.max - options.min);
    }
    function release(cancel = false): void {
        const active = drag; drag = undefined; root.removeClass('is-dragging');
        if (active && track.hasPointerCapture(active.id)) track.releasePointerCapture(active.id);
        if (cancel && active) commit(active.origin);
    }
    track.onpointerdown = e => {
        if (e.button !== 0 || drag) return;
        const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-thumb]') : null;
        const value = valueAt(e.clientX);
        const index = target ? Number(target.dataset.thumb) : current.reduce((nearest, item, i) => Math.abs(item - value) < Math.abs(current[nearest] - value) ? i : nearest, 0);
        const rect = thumbs[index].thumb.getBoundingClientRect();
        drag = { id: e.pointerId, index, offset: target ? e.clientX - rect.left - THUMB_CENTER : 0, origin: [...current] };
        e.preventDefault(); thumbs[index].input.focus({ preventScroll: true });
        root.addClass('is-dragging'); track.setPointerCapture(e.pointerId);
        if (!target) commit(options.constrain(current, index, value));
    };
    track.onpointermove = e => { if (drag?.id === e.pointerId) { e.preventDefault(); commit(options.constrain(current, drag.index, valueAt(e.clientX - drag.offset))); } };
    track.onpointerup = e => {
        if (drag?.id === e.pointerId) {
            commit(options.constrain(current, drag.index, valueAt(e.clientX - drag.offset))); release();
        }
    };
    track.onpointercancel = () => release(true); track.onlostpointercapture = () => release();
    track.addEventListener('keydown', e => { if (e.key === 'Escape' && drag) { release(true); e.preventDefault(); e.stopPropagation(); } });
    update(initial); return { element: root, update };
}
