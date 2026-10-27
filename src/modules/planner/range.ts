/**
 * [INPUT]: 依赖共用滑块呈现器、时间格式与双端区间约束。
 * [OUTPUT]: 提供 00:00–24:00 双端滑块，15 分钟吸附且不可交叉。
 * [POS]: 工具栏和设置弹窗的时间适配器；自身不写设置或安排。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { STEP, clock } from './model';
import { sliderControl } from './slider';
import { TimeWindow, rangeEdge } from './viewport';
export interface RangeControl { element: HTMLElement; update(range: TimeWindow): void }
export function timeRangeControl(parent: HTMLElement, initial: TimeWindow, changed: (range: TimeWindow) => void): RangeControl {
    const slider = sliderControl(parent, [initial.start, initial.end], {
        label: '区间', names: ['区间开始时间', '区间结束时间'], min: 0, max: 1440, step: STEP, pageStep: 60,
        limits: ['0', '24'], format: clock,
        constrain: (values, index, value) => {
            const range = rangeEdge({ start: values[0], end: values[1] }, index === 0 ? 'start' : 'end', value);
            return [range.start, range.end];
        },
        changed: values => changed({ start: values[0], end: values[1] }),
    });
    slider.element.addClass('zwp-time-range');
    return { element: slider.element, update: range => slider.update([range.start, range.end]) };
}
