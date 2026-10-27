/**
 * [INPUT]: 依赖公开 ItemView/Workspace 布局保存、弹窗、人物颜色与滚动坐标。
 * [OUTPUT]: 提供连续七日周历、单行滑块、滚动缩放与置底的配色、关联和操作区。
 * [POS]: 大日历呈现层；文件写入全部交给 PlannerStore。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { ItemView, Modal, Notice, WorkspaceLeaf } from 'obsidian';
import { today, shiftDay } from '../../core/time';
import { Arrangement, DISPLAY_DEFAULTS, Interval, MAX_ZOOM, MIN_ZOOM, VIEW_TYPE, clock, daysFrom, durationText, layoutEvents, validateInterval, validDay, weekdayOf, weekOf } from './model';
import { TimeWindow, WheelZoom, rangeScroll, timeRatio, windowOf, zoomScroll, zoomValue } from './viewport';
import { ArrangementModal } from './modal';
import { CalendarGestures } from './gestures';
import { colorPalette, paintColor } from './palette';
import { RangeControl, timeRangeControl } from './range';
import { SliderControl, sliderControl } from './slider';
import type { PlannerHost } from './host';
export class WeekPlannerView extends ItemView {
    private anchor = weekOf(today())[0];
    private selected = '';
    private gestures?: CalendarGestures;
    private observer?: ResizeObserver;
    private saveTimer?: ReturnType<typeof setTimeout>;
    private wheelZoom = new WheelZoom();
    private detailEl?: HTMLElement;
    private frameEl?: HTMLElement;
    private gridEl?: HTMLElement;
    private rangeControl?: RangeControl;
    private scaleControl?: SliderControl;
    constructor(leaf: WorkspaceLeaf, private planner: PlannerHost) { super(leaf); }
    getViewType(): string { return VIEW_TYPE; }
    getDisplayText(): string { return '大日历'; }
    getIcon(): string { return 'calendar-range'; }
    async onOpen(): Promise<void> { this.contentEl.addClass('zwp-root'); await this.planner.refreshPlanner(); this.renderWeek(); }
    async onClose(): Promise<void> {
        this.gestures?.destroy(); this.observer?.disconnect();
        if (this.saveTimer) { clearTimeout(this.saveTimer); await this.persistDisplay(); }
        this.contentEl.empty();
    }
    getState(): Record<string, unknown> { return { anchor: this.anchor, windowStart: this.anchor, selected: this.selected, scrollTop: this.frameEl?.scrollTop ?? 0 }; }
    async setState(state: Record<string, unknown>, result: { history: boolean }): Promise<void> {
        if (typeof state.windowStart === 'string' && validDay(state.windowStart)) this.anchor = state.windowStart;
        else if (typeof state.anchor === 'string' && validDay(state.anchor)) this.anchor = weekOf(state.anchor)[0];
        if (typeof state.selected === 'string') this.selected = state.selected;
        await super.setState(state, result); this.renderWeek();
        if (typeof state.scrollTop === 'number' && Number.isFinite(state.scrollTop) && this.frameEl) this.frameEl.scrollTop = Math.max(0, state.scrollTop);
        else this.scrollToSelection();
    }
    revealArrangement(day: string, id = ''): void {
        if (!daysFrom(this.anchor).includes(day)) this.anchor = day;
        this.selected = id;
        const item = this.planner.store.events.find(e => e.id === id), range = windowOf(this.planner.settings);
        if (item && (item.start < range.start || item.end > range.end)) {
            this.planner.settings.startHour = Math.min(range.start, item.start) / 60;
            this.planner.settings.endHour = Math.max(range.end, item.end) / 60;
            this.queueSave();
        }
        this.renderWeek(); this.scrollToSelection(); this.app.workspace.requestSaveLayout();
    }
    private scrollToSelection(): void {
        const frame = this.frameEl, grid = this.gridEl, item = this.planner.store.events.find(e => e.id === this.selected);
        if (frame && grid && item) frame.scrollTop = timeRatio((item.start + item.end) / 2, windowOf(this.planner.settings)) * grid.getBoundingClientRect().height - frame.clientHeight / 2;
    }
    private navigate(day: string): void {
        this.anchor = day;
        if (!this.planner.store.events.some(e => e.id === this.selected && daysFrom(day).includes(e.day))) this.selected = '';
        this.renderWeek(); this.app.workspace.requestSaveLayout();
    }
    private button(parent: HTMLElement, text: string, action: () => void, title?: string): HTMLButtonElement {
        const button = parent.createEl('button', { text }); button.onclick = action;
        if (title) { button.title = title; button.setAttribute('aria-label', title); } return button;
    }
    private completion(parent: HTMLElement, item: Arrangement, cls: string): HTMLButtonElement {
        const check = this.button(parent, item.done ? '✓' : '', () => {
            check.disabled = true;
            void this.attempt(() => this.planner.store.toggle(item, !item.done)).finally(() => { check.disabled = Boolean(item.error); });
        }, `${item.done ? '取消完成' : '完成安排'}：${item.name}`);
        check.addClass('zwp-check', cls); check.setAttribute('role', 'checkbox'); check.setAttribute('aria-checked', String(item.done));
        check.disabled = Boolean(item.error); check.ondblclick = e => e.stopPropagation(); return check;
    }
    private async attempt(action: () => Promise<unknown>, success?: string): Promise<void> {
        try { await action(); await this.planner.refreshPlanner(); if (success) new Notice(success); }
        catch (error) { new Notice(error instanceof Error ? error.message : String(error), 9000); await this.planner.refreshPlanner(); }
    }
    private editArrangement(value: Interval, existing?: Arrangement): void {
        new ArrangementModal(this.planner.store, value, async id => {
            await this.planner.refreshPlanner();
            const item = this.planner.store.events.find(e => e.id === id);
            this.revealArrangement(item?.day ?? value.day, id);
        }, existing).open();
    }
    private async persistDisplay(): Promise<void> {
        this.saveTimer = undefined;
        try { await this.planner.savePlannerSettings(); }
        catch (error) { new Notice(`显示设置保存失败：${String(error)}`); }
    }
    private queueSave(): void {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => { void this.persistDisplay(); }, 250);
    }
    private setZoom(value: number, anchorY?: number): void {
        const frame = this.frameEl, grid = this.gridEl; if (!frame || !grid) return;
        const before = this.planner.settings.zoom, after = zoomValue(value);
        if (before === after) return;
        const scroll = zoomScroll(frame.scrollTop, frame.clientHeight, before, after, anchorY ?? frame.clientHeight / 2);
        this.wheelZoom.reset(); this.planner.settings.zoom = after;
        grid.style.height = `${after}%`; this.renderCanvas(); frame.scrollTop = scroll;
        this.updateScaleControls(); this.queueSave();
    }
    private setRange(range: TimeWindow): void {
        const frame = this.frameEl; if (!frame) return;
        const settings = this.planner.settings, before = windowOf(settings);
        if (range.start === before.start && range.end === before.end) return;
        const scroll = rangeScroll(frame.scrollTop, frame.clientHeight, settings.zoom, before, range);
        settings.startHour = range.start / 60; settings.endHour = range.end / 60;
        this.renderCanvas(); frame.scrollTop = scroll;
        this.updateScaleControls(); this.queueSave();
    }
    private resetDisplay(): void {
        Object.assign(this.planner.settings, DISPLAY_DEFAULTS); this.wheelZoom.reset();
        if (this.gridEl) this.gridEl.style.height = `${DISPLAY_DEFAULTS.zoom}%`;
        this.renderCanvas(); if (this.frameEl) this.frameEl.scrollTop = 0;
        this.updateScaleControls(); this.queueSave(); this.app.workspace.requestSaveLayout();
    }
    private updateScaleControls(): void {
        const settings = this.planner.settings, range = windowOf(settings);
        this.scaleControl?.update([settings.zoom]);
        if (this.rangeControl) {
            const days = daysFrom(this.anchor), hidden = this.planner.store.events.filter(e => days.includes(e.day) && (e.start < range.start || e.end > range.end)).length;
            this.rangeControl.update(range);
            this.rangeControl.element.dataset.hidden = String(hidden > 0);
            this.rangeControl.element.title = `自定义显示时间${hidden ? `；${hidden} 项安排超出此区间，仍会保留` : ''}`;
            this.rangeControl.element.setAttribute('aria-label', `自定义显示时间${hidden ? `，${hidden} 项安排超出区间` : ''}`);
        }
    }
    renderWeek(): void {
        const oldScroll = this.frameEl?.scrollTop ?? 0;
        this.wheelZoom.reset(); this.gestures?.destroy(); this.observer?.disconnect();
        const root = this.contentEl; root.empty(); const store = this.planner.store;
        const settings = this.planner.settings, days = daysFrom(this.anchor);
        const top = root.createDiv({ cls: 'zwp-top' }), toolbar = top.createDiv({ cls: 'zwp-toolbar' });
        const navigation = toolbar.createDiv({ cls: 'zwp-row zwp-nav' });
        this.button(navigation, '‹', () => this.navigate(shiftDay(this.anchor, -1, 'day')), '前一天：向左移动一天');
        this.button(navigation, '本周', () => this.navigate(weekOf(today())[0]));
        this.button(navigation, '›', () => this.navigate(shiftDay(this.anchor, 1, 'day')), '后一天：向右移动一天');
        const rangeText = `${days[0]} — ${days[6].slice(0,4) === days[0].slice(0,4) ? days[6].slice(5) : days[6]}`;
        navigation.createSpan({ cls: 'zwp-week-label', text: rangeText });
        const controls = toolbar.createDiv({ cls: 'zwp-display-controls' });
        this.button(controls, '默认', () => this.resetDisplay(), '默认：恢复 00:00–24:00、100%').addClass('zwp-default');
        this.rangeControl = timeRangeControl(controls, windowOf(settings), range => this.setRange(range));
        this.scaleControl = sliderControl(controls, [settings.zoom], {
            label: '比例', names: ['时间显示比例'], min: MIN_ZOOM, max: MAX_ZOOM, step: .1, pageStep: 10,
            limits: [`${MIN_ZOOM}%`, `${MAX_ZOOM}%`], format: value => `${value}%`,
            constrain: (_values, _index, value) => [zoomValue(value)], changed: values => this.setZoom(values[0]),
        });
        this.scaleControl.element.addClass('zwp-zoom');
        this.scaleControl.element.title = '普通滚轮上下浏览；Command / Ctrl + 滚轮缩放。100% 完整显示区间。';
        if (store.issues.length) root.createDiv({ cls: 'zwp-alert zwp-error', text: store.issues.slice(0, 3).join('；') });
        const layout = root.createDiv({ cls: 'zwp-layout' }), panel = layout.createDiv({ cls: 'zwp-calendar-panel' });
        const header = panel.createDiv({ cls: 'zwp-calendar-header' }); header.createDiv({ text: '时间', cls: 'zwp-zone' });
        days.forEach(day => {
            const cell = header.createDiv({ cls: `zwp-day-head${day === today() ? ' is-today' : ''}` });
            cell.createDiv({ text: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekdayOf(day)] });
            cell.createSpan({ text: String(Number(day.slice(8))) }); cell.title = day;
        });
        const frame = panel.createDiv({ cls: 'zwp-frame', attr: { 'aria-label': '日历时间滚动区', tabindex: '0' } }); this.frameEl = frame;
        this.gridEl = frame.createDiv({ cls: 'zwp-grid' }); this.gridEl.style.height = `${settings.zoom}%`;
        frame.addEventListener('scroll', () => { this.app.workspace.requestSaveLayout(); }, { passive: true });
        frame.addEventListener('wheel', e => {
            if (!e.metaKey && !e.ctrlKey) { this.wheelZoom.reset(); return; }
            e.preventDefault(); e.stopPropagation();
            const rect = frame.getBoundingClientRect();
            const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? frame.clientHeight : 1);
            const zoom = this.wheelZoom.apply(settings.zoom, delta, true);
            if (zoom !== null) this.setZoom(zoom, e.clientY - rect.top);
        }, { passive: false });
        this.detailEl = layout.createDiv({ cls: 'zwp-detail' }); this.renderDetail();
        this.updateScaleControls(); this.renderCanvas(); frame.scrollTop = oldScroll;
        let width = 0, height = 0;
        this.observer = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            if (Math.abs(rect.width - width) < 1 && Math.abs(rect.height - height) < 1) return;
            width = rect.width; height = rect.height; this.updateScaleControls(); this.renderCanvas();
        });
        this.observer.observe(frame);
    }
    private renderCanvas(): void {
        const grid = this.gridEl; if (!grid?.isConnected) return;
        this.gestures?.destroy(); grid.empty();
        const frame = this.frameEl!;
        grid.parentElement!.parentElement!.style.setProperty('--zwp-scrollbar', `${frame.offsetWidth - frame.clientWidth}px`);
        const store = this.planner.store, days = daysFrom(this.anchor), range = windowOf(this.planner.settings);
        const events = store.events.filter(e => days.includes(e.day));
        const height = grid.getBoundingClientRect().height, span = range.end - range.start;
        const axis = grid.createDiv({ cls: 'zwp-axis' }), columns = grid.createDiv({ cls: 'zwp-days' });
        const hourHeight = height * 60 / span, tick = hourHeight < 30 ? 120 : hourHeight < 72 ? 60 : 30;
        const ticks = new Set([range.start, range.end]);
        for (let minute = Math.ceil(range.start / tick) * tick; minute < range.end; minute += tick) {
            if ((minute - range.start) / span * height > 18 && (range.end - minute) / span * height > 18) ticks.add(minute);
        }
        for (const minute of [...ticks].sort((a, b) => a - b)) {
            const label = axis.createDiv({ text: clock(minute), cls: 'zwp-time-label' }); label.style.top = `${timeRatio(minute, range) * 100}%`;
        }
        days.forEach(day => {
            const weekend = [0, 6].includes(weekdayOf(day));
            const column = columns.createDiv({ cls: `zwp-day-column${day === today() ? ' is-today' : ''}${weekend ? ' is-weekend' : ''}`, attr: { 'data-day': day } });
            const guideStep = hourHeight >= 72 ? 15 : 30;
            for (let minute = Math.ceil(range.start / guideStep) * guideStep; minute < range.end; minute += guideStep) {
                const line = column.createDiv({ cls: `zwp-grid-line${minute % 60 ? ' is-minor' : ''}` }); line.style.top = `${timeRatio(minute, range) * 100}%`;
            }
            const dayEvents = events.filter(e => e.day === day && e.end > range.start && e.start < range.end), lanes = layoutEvents(dayEvents);
            for (const item of dayEvents) this.renderEvent(column, item, lanes.get(item.id)!, range, height);
        });
        this.gestures = new CalendarGestures(grid, days, range.start, range.end, events,
            value => this.editArrangement(value), (item, value) => { void this.attempt(() => store.move(item, value), '时间安排已更新'); }, item => this.chooseArrangement(item));
    }
    private renderEvent(column: HTMLElement, item: Arrangement, lane: { lane: number; count: number }, range: TimeWindow, height: number): void {
        const start = Math.max(item.start, range.start), end = Math.min(item.end, range.end), span = range.end - range.start;
        const pixels = (end - start) / span * height;
        const density = pixels < 25 ? ' is-micro' : pixels < 40 ? ' is-compact' : pixels < 72 ? ' is-medium' : '';
        const block = column.createDiv({ cls: `zwp-event ${item.kind}${density}${item.done ? ' is-done' : ''}${item.id === this.selected ? ' is-selected' : ''}${item.error ? ' is-error' : ''}`,
            attr: { 'data-id': item.id, tabindex: '0', role: 'group', 'aria-label': `${item.name} ${clock(item.start)}至${clock(item.end)}` } });
        paintColor(block, item.color);
        block.style.top = `${timeRatio(start, range) * 100}%`; block.style.height = `${(end - start) / span * 100}%`;
        block.style.left = `calc(${lane.lane / lane.count * 100}% + 3px)`; block.style.width = `calc(${100 / lane.count}% - 6px)`;
        block.title = `${item.name}\n${clock(item.start)}–${clock(item.end)}\n${item.notes}\n点击选择；按住即可拖动；拖动上下边缘调整时长`;
        const head = block.createDiv({ cls: 'zwp-event-head' }), text = head.createDiv({ cls: 'zwp-event-text' });
        text.createDiv({ text: item.name, cls: 'zwp-event-title' }); this.completion(head, item, 'zwp-event-check');
        block.createDiv({ text: `${clock(item.start)}–${clock(item.end)}`, cls: 'zwp-event-time' });
        block.createDiv({ text: this.planner.store.containers.find(c => c.path === item.mocPath)?.name ?? item.kind, cls: 'zwp-event-subtitle' });
        if (item.notes) block.createDiv({ text: item.notes, cls: 'zwp-event-note' });
        for (const edge of ['start', 'end'] as const) {
            const handle = block.createDiv({ cls: `zwp-resize zwp-resize-${edge}`, attr: { 'data-edge': edge, tabindex: '0', role: 'slider', 'aria-label': `${item.name}：调整${edge === 'start' ? '开始' : '结束'}时间`, 'aria-valuetext': clock(item[edge]) } });
            handle.onkeydown = e => {
                if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
                e.preventDefault(); e.stopPropagation(); const value = { day: item.day, start: item.start, end: item.end };
                value[edge] += e.key === 'ArrowUp' ? -15 : 15;
                try { validateInterval(value); void this.attempt(() => this.planner.store.move(item, value)); } catch (error) { new Notice(String(error)); }
            };
        }
        block.onkeydown = e => { if (e.target === block && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.chooseArrangement(item); } };
    }
    private chooseArrangement(item: Arrangement): void {
        this.selected = item.id;
        this.contentEl.querySelectorAll<HTMLElement>('.zwp-event').forEach(block => block.toggleClass('is-selected', block.dataset.id === item.id));
        this.renderDetail(); this.app.workspace.requestSaveLayout();
    }
    private renderDetail(): void {
        const root = this.detailEl; if (!root) return; root.empty();
        const store = this.planner.store, item = store.events.find(e => e.id === this.selected), body = root.createDiv({ cls: 'zwp-detail-body' });
        body.createDiv({ text: '安排详情', cls: 'zwp-detail-kicker' });
        if (!item) {
            body.createEl('h2', { text: '选择一项安排' });
            body.createDiv({ cls: 'zwp-note', text: '点击时间块查看详情，或在空白处拖选时间来新建安排。' }); return;
        }
        paintColor(root, item.color);
        body.createDiv({ cls: 'zwp-detail-date', text: item.day });
        body.createDiv({ cls: 'zwp-detail-time', text: `${clock(item.start)}–${clock(item.end)}` });
        body.createDiv({ cls: 'zwp-muted', text: `本次 ${durationText(item.end - item.start)}` });
        const dayEvents = store.events.filter(e => e.day === item.day), total = dayEvents.reduce((sum, e) => sum + e.end - e.start, 0);
        body.createDiv({ cls: 'zwp-day-summary', text: `当天 ${dayEvents.length} 项安排 · 共 ${durationText(total)}` });
        body.createEl('h2', { text: item.name });
        body.createDiv({ cls: 'zwp-detail-note', text: item.notes || '尚未填写备注。' });
        const complete = body.createDiv({ cls: 'zwp-complete-row' }); this.completion(complete, item, 'zwp-detail-check');
        complete.createSpan({ text: item.done ? '这次安排已完成' : '完成后手动打勾', cls: item.done ? 'zwp-done-text' : '' });
        if (item.sourceTask) body.createDiv({ cls: 'zwp-note', text: `来源任务：${item.sourceTask}` });
        if (item.error) body.createDiv({ cls: 'zwp-error', text: item.error });
        const bottom = root.createDiv({ cls: 'zwp-detail-bottom' }), meta = bottom.createDiv({ cls: 'zwp-detail-meta' });
        const color = meta.createDiv({ cls: 'zwp-detail-color' });
        color.createDiv({ cls: 'zwp-detail-label', text: '时间块颜色' });
        const palette = colorPalette(color, item.color, selected => {
            palette.disable(true);
            void this.attempt(() => store.setColor(item, selected)).finally(() => {
                palette.update(store.events.find(e => e.id === item.id)?.color ?? item.color); palette.disable(Boolean(item.error));
            });
        });
        palette.disable(Boolean(item.error));
        const owner = store.people.find(p => p.path === item.colorPerson);
        color.createDiv({ cls: 'zwp-form-hint', text: owner ? `跟随「${owner.name}」，此人物的全部安排共用颜色。` : '仅用于本次安排。' });
        const links = meta.createDiv({ cls: 'zwp-associations' });
        const project = links.createDiv({ cls: 'zwp-association' });
        project.createDiv({ cls: 'zwp-detail-label', text: item.kind === 'area' ? '深入的领域' : '所属项目' });
        const projectLink = this.button(project, store.containers.find(c => c.path === item.mocPath)?.name ?? item.mocPath, () => { void this.app.workspace.openLinkText(item.mocPath, '', true); });
        projectLink.addClass('zwp-chip'); projectLink.title = item.mocPath; paintColor(projectLink, item.color);
        const people = links.createDiv({ cls: 'zwp-association' });
        people.createDiv({ cls: 'zwp-detail-label', text: item.relation === 'client' ? '委托人' : '相关人员' });
        for (const path of item.people) {
            const person = store.people.find(p => p.path === path);
            const chip = this.button(people, person?.name ?? path.split('/').pop()!.replace(/\.md$/, ''), () => { void this.app.workspace.openLinkText(path, '', true); });
            chip.addClass('zwp-chip'); chip.title = `${path}${path === item.colorPerson ? ' · 时间块跟随此人物颜色' : ''}`;
            paintColor(chip, person?.color ?? item.color);
        }
        if (!item.people.length) people.createDiv({ cls: 'zwp-muted', text: '自己安排' });
        const actions = bottom.createDiv({ cls: 'zwp-detail-actions' });
        this.button(actions, '编辑时间、备注和人物', () => this.editArrangement(item, item)).disabled = Boolean(item.error);
        this.button(actions, '打开卡片笔记 ↗', () => { void this.app.workspace.openLinkText(item.cardPath, '', true); });
        this.button(actions, '查看 MOC 时间任务 ↗', () => { void this.app.workspace.openLinkText(`${item.mocPath}#^schedule-${item.id}`, '', true); });
    }
}
export class RangeModal extends Modal {
    constructor(private planner: PlannerHost) { super(planner.app); }
    onOpen(): void {
        this.contentEl.createEl('h2', { text: '显示哪段时间' });
        this.contentEl.createEl('p', { text: '设置可浏览的时间区间。普通滚轮上下浏览；Command / Ctrl + 滚轮调整格子大小，范围外安排会保留。' });
        this.modalEl.addClass('zwp-range-modal');
        let selected = windowOf(this.planner.settings);
        const control = timeRangeControl(this.contentEl, selected, range => { selected = range; });
        const presets = this.contentEl.createDiv({ cls: 'zwp-modal-actions' });
        const full = presets.createEl('button', { text: '全天' }); full.onclick = () => { selected = { start: 0, end: 1440 }; control.update(selected); };
        const normal = presets.createEl('button', { text: '08:00–23:00' }); normal.onclick = () => { selected = { start: 480, end: 1380 }; control.update(selected); };
        const save = presets.createEl('button', { text: '应用', cls: 'mod-cta' });
        save.onclick = async () => {
            this.planner.settings.startHour = selected.start / 60; this.planner.settings.endHour = selected.end / 60;
            await this.planner.savePlannerSettings(); this.close(); this.planner.repaintPlanner();
        };
    }
}
