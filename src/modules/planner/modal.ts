/**
 * [INPUT]: 依赖公开 Modal、人物颜色与 PlannerStore 保存能力。
 * [OUTPUT]: 提供安排编辑弹窗，取消不写入，失败保留表单。
 * [POS]: 大日历的唯一安排提交入口；拖选与详情编辑共用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Modal } from 'obsidian';
import { Arrangement, Draft, Interval, clock, minuteOf } from './model';
import { PlannerStore } from './store';
import { colorPalette } from './palette';
export class ArrangementModal extends Modal {
    private draft: Draft;
    private errorEl!: HTMLElement;
    private saving = false;
    private taskVersion = 0;
    constructor(private store: PlannerStore, interval: Interval, private saved: (id: string) => Promise<void>, private existing?: Arrangement) {
        super(store.app);
        this.draft = { ...interval, mode: existing?.kind ?? 'project', target: existing?.mocPath ?? '',
            projectName: '', name: existing?.name ?? '', notes: existing?.notes ?? '', people: existing?.people ?? [],
            relation: existing?.relation ?? 'self', sourceTask: existing?.sourceTask ?? '',
            color: existing?.color ?? 'purple', colorPerson: existing?.colorPerson ?? '', colorEdited: false };
    }
    onOpen(): void { this.modalEl.addClass('zwp-modal'); this.renderForm(); }
    onClose(): void { this.contentEl.empty(); }
    private field(parent: HTMLElement, label: string): HTMLDivElement {
        const field = parent.createDiv({ cls: 'zwp-field' }); field.createEl('label', { text: label }); return field;
    }
    private input(parent: HTMLElement, label: string, value: string, update: (value: string) => void, type = 'text'): HTMLInputElement {
        const field = this.field(parent, label), input = field.createEl('input', { type, value });
        input.setAttribute('aria-label', label); input.addEventListener('input', () => update(input.value)); return input;
    }
    private renderForm(): void {
        const root = this.contentEl; root.empty(); root.createEl('h2', { text: this.existing ? '编辑安排' : '安排这段时间' });
        const times = root.createDiv({ cls: 'zwp-times' });
        this.input(times, '日期', this.draft.day, v => { this.draft.day = v; }, 'date');
        this.input(times, '开始时间', clock(this.draft.start), v => { this.draft.start = minuteOf(v); }, 'time');
        this.input(times, '结束时间（可填 24:00）', clock(this.draft.end), v => { this.draft.end = minuteOf(v); });
        if (!this.existing) {
            const modes = root.createDiv({ cls: 'zwp-modes' });
            for (const [mode, label] of [['project', '进行中的项目'], ['area', '领域深入'], ['new', '新建项目']] as const) {
                const button = modes.createEl('button', { text: label, cls: mode === this.draft.mode ? 'is-active' : '' });
                button.onclick = () => {
                    this.draft.mode = mode; this.draft.target = ''; this.draft.sourceTask = '';
                    if (!this.draft.colorEdited && this.draft.relation === 'self') this.draft.color = mode === 'area' ? 'green' : 'purple';
                    this.renderForm();
                };
            }
        }
        if (this.draft.mode === 'new' && !this.existing) this.input(root, '新项目名称', this.draft.projectName, v => { this.draft.projectName = v; });
        else {
            const targetField = this.field(root, this.draft.mode === 'area' ? '查找领域' : '选择项目');
            const search = targetField.createEl('input', { type: 'search', attr: { placeholder: '按名称或路径查找', 'aria-label': '查找项目或领域' } });
            const select = targetField.createEl('select', { attr: { 'aria-label': '项目或领域', size: '4' } });
            const options = this.store.containers.filter(c => this.existing ? c.path === this.existing.mocPath
                : this.draft.mode === 'area' ? c.kind === 'area' : c.kind === 'project' && c.active);
            const paint = () => {
                select.empty();
                select.createEl('option', { text: '请选择…', value: '' });
                for (const item of options.filter(c => `${c.name} ${c.path}`.toLowerCase().includes(search.value.toLowerCase()))) {
                    select.createEl('option', { text: `${item.name} · ${item.folder}`, value: item.path });
                }
                select.value = this.draft.target;
            };
            paint(); search.oninput = paint; select.disabled = Boolean(this.existing);
            const taskField = this.field(root, '关联具体任务（可选）');
            const taskSelect = taskField.createEl('select', { attr: { 'aria-label': '关联具体任务' } });
            const loadTasks = async () => {
                const version = ++this.taskVersion;
                taskSelect.empty(); taskSelect.createEl('option', { text: '只安排项目 / 领域，不指定任务', value: '' });
                if (this.draft.sourceTask) taskSelect.createEl('option', { text: this.draft.sourceTask, value: this.draft.sourceTask });
                const path = this.draft.target;
                if (path) {
                    try {
                        const tasks = await this.store.tasksOf(path);
                        if (version !== this.taskVersion) return;
                        for (const task of tasks) if (task.value !== this.draft.sourceTask) taskSelect.createEl('option', { text: task.label, value: task.value });
                    } catch { /* 文件变化由提交时的完整校验报告。 */ }
                }
                taskSelect.value = this.draft.sourceTask;
            };
            select.onchange = () => { this.draft.target = select.value; this.draft.sourceTask = ''; void loadTasks(); };
            taskSelect.onchange = () => { this.draft.sourceTask = taskSelect.value; };
            void loadTasks();
        }
        const name = this.input(root, '安排名称 / 卡片笔记名称', this.draft.name, v => { this.draft.name = v; });
        name.disabled = Boolean(this.existing);
        if (this.existing) name.title = '重命名请在原卡片笔记中操作，Obsidian 会维护双链。';
        const notesField = this.field(root, '备注 → 卡片简介');
        const notes = notesField.createEl('textarea', { attr: { rows: '3', placeholder: '这段时间要推进什么？', 'aria-label': '备注' } });
        notes.value = this.draft.notes; notes.oninput = () => { this.draft.notes = notes.value; };
        const relationField = this.field(root, '这段安排和谁有关');
        const relation = relationField.createEl('select', { attr: { 'aria-label': '人物关系' } });
        for (const [value, text] of [['self', '自己安排'], ['with', '与人同行'], ['client', '受人委托']]) relation.createEl('option', { text, value });
        relation.value = this.draft.relation;
        const peopleField = root.createDiv({ cls: 'zwp-people-picker' });
        const peopleSearch = peopleField.createEl('input', { type: 'search', attr: { placeholder: '查找人脉或客户', 'aria-label': '查找人物' } });
        const peopleList = peopleField.createDiv({ cls: 'zwp-people-list' });
        const paintPeople = () => {
            peopleList.empty();
            for (const person of this.store.people.filter(p => `${p.name} ${p.path}`.toLowerCase().includes(peopleSearch.value.toLowerCase()))) {
                const label = peopleList.createEl('label'); const check = label.createEl('input', { type: 'checkbox' });
                check.checked = this.draft.people.includes(person.path);
                label.createSpan({ text: `${person.name} · ${person.kind === 'client' ? '客户' : '人脉'}` }); label.title = person.path;
                check.onchange = () => {
                    this.draft.people = check.checked ? [...this.draft.people, person.path] : this.draft.people.filter(p => p !== person.path);
                    paintColors();
                };
            }
            if (!this.store.people.length) peopleList.createDiv({ text: '请先用 ziminOS 新建人脉或客户档案。', cls: 'zwp-muted' });
        };
        peopleField.hidden = this.draft.relation === 'self'; paintPeople(); peopleSearch.oninput = paintPeople;
        const colorField = this.field(root, '时间块颜色');
        const paintColors = () => {
            colorField.querySelectorAll(':scope > :not(label)').forEach(el => el.remove());
            const paths = this.draft.relation === 'self' ? [] : this.draft.people;
            const owner = paths.includes(this.draft.colorPerson) ? this.draft.colorPerson : paths[0] ?? '';
            if (owner !== this.draft.colorPerson) { this.draft.colorPerson = owner; this.draft.colorEdited = false; }
            const person = this.store.people.find(p => p.path === this.draft.colorPerson);
            if (person && !this.draft.colorEdited) this.draft.color = person.color;
            if (paths.length > 1) {
                const owner = colorField.createEl('select', { attr: { 'aria-label': '颜色跟随的人物' } });
                for (const path of paths) owner.createEl('option', { text: this.store.people.find(p => p.path === path)?.name ?? path, value: path });
                owner.value = this.draft.colorPerson;
                owner.onchange = () => { this.draft.colorPerson = owner.value; this.draft.colorEdited = false; paintColors(); };
            }
            colorPalette(colorField, this.draft.color, color => { this.draft.color = color; this.draft.colorEdited = true; });
            colorField.createDiv({ cls: 'zwp-form-hint', text: person ? `跟随「${person.name}」；修改颜色会同步此人物的全部安排。` : '未关联人物，颜色只用于本次安排。' });
        };
        relation.onchange = () => { this.draft.relation = relation.value as Draft['relation']; peopleField.hidden = relation.value === 'self'; paintColors(); };
        paintColors();
        root.createDiv({ cls: 'zwp-form-hint', text: '保存后生成原模板卡片和一条 MOC 时间任务。勾选表示本次安排完成，关联来源任务独立保留。' });
        this.errorEl = root.createDiv({ cls: 'zwp-error', attr: { role: 'alert' } });
        const actions = root.createDiv({ cls: 'zwp-modal-actions' });
        const cancel = actions.createEl('button', { text: '取消' }); cancel.onclick = () => { if (!this.saving) this.close(); };
        const save = actions.createEl('button', { text: this.existing ? '保存修改' : '创建安排', cls: 'mod-cta' });
        save.onclick = async () => {
            if (this.saving) return; this.saving = true; save.disabled = true; cancel.disabled = true; this.errorEl.empty();
            try { const id = await this.store.save(this.draft, this.existing); this.close(); await this.saved(id); }
            catch (error) { this.errorEl.setText(error instanceof Error ? error.message : String(error)); }
            finally { this.saving = false; save.disabled = false; cancel.disabled = false; }
        };
    }
}
