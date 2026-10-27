/**
 * [INPUT]: 依赖公开 Vault/MetadataCache/MarkdownView、注入的原模板工厂与 core 保存口径。
 * [OUTPUT]: 提供安排索引、建卡、改时、勾选、人物颜色与检索补齐。
 * [POS]: 大日历数据服务；所有多文件写入经过比较与回滚。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { App, MarkdownView, TFile, TFolder } from 'obsidian';
import type { PlannerTemplates } from './host';
import { nowStampAndUid } from '../../core/time';
import { saveDisplayedMarkdownViews, isNoteInFront } from '../../core/editDebts';
import { ensureFolderPath } from '../../core/folders';
import { splitTextLines } from '../../core/lineEndings';
import { Arrangement, Container, Draft, Interval, Person, PlannerSettings, calendarLink, intervalOf, localStamp, safeName, validateInterval, wiki } from './model';
import { appendRow, createCard, ensurePersonTasks, linkList, linkedPath, patchProperties, replaceRow, scheduleRow, taskRows, yamlOf } from './markdown';
import { WritePort, WriteTransaction } from './transaction';
import { ColorKey, colorAppearance, colorKey, defaultPersonColor } from './colors';
export class PlannerStore implements WritePort {
    events: Arrangement[] = []; containers: Container[] = []; people: Person[] = []; issues: string[] = [];
    busy = false;
    private known = new Set<string>();
    private baselines = new Map<string, { card: string; row: string }>();
    constructor(readonly app: App, readonly settings: PlannerSettings, private templates: PlannerTemplates) {}
    file(path: string): TFile {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error(`笔记不存在：${path}`);
        return file;
    }
    async read(path: string): Promise<string> { return this.app.vault.read(this.file(path)); }
    async change(path: string, before: string, after: string): Promise<void> {
        const file = this.file(path);
        // 比较编辑缓冲区，不能用磁盘快照盖掉仍在输入的内容。
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file === file && leaf.view.getMode() === 'source' && leaf.view.editor.getValue() !== before) {
                throw new Error(`笔记仍有未保存编辑，请稍后重试：${path}`);
            }
        });
        await this.app.vault.process(file, current => {
            if (current !== before) throw new Error(`笔记已被修改，请重新打开安排：${path}`);
            return after;
        });
    }
    async create(path: string, text: string): Promise<void> {
        await this.app.vault.create(path, text); this.known.add(path);
    }
    async remove(path: string, expected: string): Promise<void> {
        const file = this.file(path);
        if (await this.app.vault.read(file) !== expected) throw new Error(path);
        await this.app.vault.trash(file, false);
    }
    async flush(paths: string[]): Promise<void> {
        for (const path of [...new Set(paths)]) await saveDisplayedMarkdownViews(this.app, path);
    }
    private async exclusive<T>(action: () => Promise<T>): Promise<T> {
        if (this.busy) throw new Error('上一笔安排正在保存，请稍候。');
        this.busy = true;
        try { return await action(); } finally { this.busy = false; }
    }
    private resolve(value: string, source: string): string {
        return this.app.metadataCache.getFirstLinkpathDest(value, source)?.path ?? `${value.replace(/\.md$/, '')}.md`;
    }
    async refresh(): Promise<void> {
        if (this.busy) return;
        await this.exclusive(async () => {
            const containers: Container[] = [], people: Person[] = [], cards: TFile[] = [];
            const roots = [this.settings.projectFolder, this.settings.areaFolder, this.settings.archiveFolder];
            for (const file of this.app.vault.getMarkdownFiles()) {
                if (file.path.startsWith('90-system/')) continue;
                const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
                if (fm?.type === 'person' || fm?.type === 'client') people.push({ path: file.path, name: file.basename, kind: fm.type,
                    color: colorKey(fm.calendar_color) ?? defaultPersonColor(String(fm.UID ?? file.path)) });
                const folder = file.parent?.path ?? '';
                if (['project', 'area'].includes(fm?.type) && roots.some(root => folder.startsWith(`${root}/`)) && [folder.split('/').pop(), `MOC-${folder.split('/').pop()}`].includes(file.basename)) {
                    containers.push({ path: file.path, folder, name: folder.split('/').pop()!, kind: fm!.type, active: fm!.status === 'active' });
                }
                if (fm?.schedule_id || this.known.has(file.path)) cards.push(file);
            }
            const events: Arrangement[] = [], issues: string[] = [], texts = new Map<string, string>();
            const getText = async (path: string) => {
                if (!texts.has(path)) texts.set(path, await this.read(path)); return texts.get(path)!;
            };
            for (const card of cards) {
                try {
                    const fm = yamlOf(await getText(card.path)), id = String(fm.schedule_id ?? '');
                    if (!/^[a-zA-Z0-9-]+$/.test(id)) continue;
                    const interval = intervalOf(fm.schedule_start, fm.schedule_end);
                    if (!interval) { issues.push(`${card.basename}：日历时间属性无效。`); continue; }
                    const mocPath = this.resolve(linkedPath(fm.schedule_task) || linkedPath(fm.up), card.path);
                    const text = await getText(mocPath), parsed = taskRows(text);
                    const rows = parsed.rows.filter(row => row.id === id);
                    const row = rows[0];
                    const error = rows.length !== 1 || parsed.errors.some(e => e.includes(id)) ? 'MOC 任务缺失、重复或格式无效。'
                        : this.resolve(linkedPath(row.cardLink), mocPath) !== card.path ? 'MOC 任务链接与卡片身份不一致。' : undefined;
                    const kind = containers.find(c => c.path === mocPath)?.kind ?? 'project';
                    const personPaths = linkList(fm.client ?? fm.with).map(p => this.resolve(p, card.path));
                    const owner = linkedPath(fm.schedule_color_person);
                    const item: Arrangement = { ...interval, id, cardPath: card.path, mocPath, name: card.basename,
                        notes: String(fm.description ?? ''), people: personPaths,
                        relation: fm.client ? 'client' : fm.with ? 'with' : 'self', done: row?.done ?? false,
                        kind, sourceTask: String(fm.schedule_source_task ?? ''), error,
                        ...colorAppearance(fm.schedule_color, owner ? this.resolve(owner, card.path) : '', personPaths, people, kind) };
                    if (!error && row) {
                        const cardKey = JSON.stringify(interval), rowValue = { day: row.day, start: row.start, end: row.end }, rowKey = JSON.stringify(rowValue);
                        const old = this.baselines.get(id);
                        if (cardKey !== rowKey) {
                            const bothChanged = old && old.card !== cardKey && old.row !== rowKey;
                            if (bothChanged) item.error = '卡片和 MOC 的时间同时发生修改，请先统一时间。';
                            else if (old && old.card !== cardKey && old.row === rowKey) {
                                if (!isNoteInFront(this.app, mocPath)) {
                                    const next = replaceRow(text, id, scheduleRow(item), row.raw);
                                    await this.change(mocPath, text, next); texts.set(mocPath, next);
                                    this.baselines.set(id, { card: cardKey, row: cardKey });
                                }
                            } else {
                                Object.assign(item, rowValue);
                                if (!isNoteInFront(this.app, card.path) && !isNoteInFront(this.app, mocPath)) {
                                    const original = await getText(card.path);
                                    const next = patchProperties(original, this.timeProperties(item));
                                    await this.change(card.path, original, next); texts.set(card.path, next);
                                    this.baselines.set(id, { card: rowKey, row: rowKey });
                                }
                            }
                        } else this.baselines.set(id, { card: cardKey, row: rowKey });
                    }
                    events.push(item);
                } catch (error) { issues.push(`${card.path}：${error instanceof Error ? error.message : error}`); }
            }
            const ids = new Set<string>();
            for (const event of events) {
                if (ids.has(event.id)) for (const duplicate of events.filter(e => e.id === event.id)) duplicate.error = '安排身份重复，请检查复制的卡片。';
                ids.add(event.id);
                if (event.error) issues.push(`${event.name}：${event.error}`);
            }
            this.events = events; this.containers = containers.sort((a,b) => a.name.localeCompare(b.name, 'zh'));
            this.people = people.sort((a,b) => a.name.localeCompare(b.name, 'zh')); this.issues = issues;
        });
    }
    private timeProperties(item: Interval & { id: string }): Record<string, unknown> {
        return { schedule_start: localStamp(item.day, item.start), schedule_end: localStamp(item.day, item.end),
            calendar: calendarLink(item.day, item.id, this.app.vault.getName()) };
    }
    private check(item: Arrangement): void {
        if (item.error) throw new Error(item.error);
        if (this.events.filter(e => e.id === item.id).length !== 1) throw new Error('安排身份不唯一，已停止写入。');
    }
    async save(draft: Draft, existing?: Arrangement): Promise<string> {
        validateInterval(draft);
        if (!colorKey(draft.color)) throw new Error('请选择红、橙、黄、绿、蓝或紫色。');
        return this.exclusive(async () => {
            if (existing) this.check(existing);
            const name = existing?.name ?? safeName(draft.name);
            let container = this.containers.find(c => c.path === draft.target);
            let newFolder = '';
            if (!existing && draft.mode === 'new') {
                const projectName = safeName(draft.projectName);
                for (const root of [this.settings.projectFolder, this.settings.areaFolder, this.settings.archiveFolder, '03-resources']) {
                    if (this.app.vault.getAbstractFileByPath(`${root}/${projectName}`)) throw new Error(`名称已存在：${root}/${projectName}。请换一个名称。`);
                }
                newFolder = `${this.settings.projectFolder}/${projectName}`;
                container = { folder: newFolder, path: `${newFolder}/MOC-${projectName}.md`, name: projectName, kind: 'project', active: true };
            }
            if (existing) container = this.containers.find(c => c.path === existing.mocPath);
            if (!container) throw new Error('请选择一个项目或领域。');
            if (!existing && draft.mode === 'project' && !container.active) throw new Error('项目已不在进行中，请重新选择。');
            const personPaths = draft.relation === 'self' ? [] : [...new Set(draft.people)];
            if (draft.relation !== 'self' && !personPaths.length) throw new Error('请选择同行人或委托人。');
            for (const path of personPaths) if (!this.people.some(p => p.path === path)) throw new Error('人物档案已发生变化，请重新选择。');
            const id = existing?.id ?? crypto.randomUUID();
            const cardPath = existing?.cardPath ?? `${container.folder}/${name}.md`;
            if (!existing && this.app.vault.getAbstractFileByPath(cardPath)) throw new Error('同名卡片已存在，请更换安排名称。');
            await this.flush([container.path, ...(existing ? [cardPath] : []), ...personPaths].filter(path => this.app.vault.getAbstractFileByPath(path)));
            const item: Arrangement = { ...draft, id, cardPath, mocPath: container.path, name,
                kind: container.kind, done: existing?.done ?? false, people: personPaths,
                ...colorAppearance(draft.color, draft.colorPerson, personPaths, this.people, container.kind) };
            if (draft.colorEdited) item.color = draft.color;
            const stamp = nowStampAndUid(this.settings.dateTimeFormat);
            const properties = { ...this.timeProperties(item), description: draft.notes,
                schedule_id: id, schedule_task: wiki(`${container.path}#^schedule-${id}`, '预设任务'),
                schedule_source_task: draft.sourceTask || null,
                schedule_color: item.color, schedule_color_person: item.colorPerson ? wiki(item.colorPerson) : null,
                with: draft.relation === 'with' ? personPaths.map(p => wiki(p)) : null,
                client: draft.relation === 'client' ? personPaths.map(p => wiki(p)) : null };
            const tx = new WriteTransaction(this);
            try {
                if (newFolder) {
                    await ensureFolderPath(this.app, this.settings.projectFolder);
                    await this.app.vault.createFolder(newFolder);
                }
                await tx.run(async () => {
                    let mocBefore = '';
                    if (newFolder) {
                        mocBefore = this.templates.project({ description: draft.notes, created: stamp.stamp, uid: stamp.uid });
                        await tx.create(container!.path, mocBefore);
                    } else mocBefore = await this.read(container!.path);
                    const row = scheduleRow(item);
                    const mocAfter = existing ? replaceRow(mocBefore, id, row, this.currentRow(mocBefore, existing)) : appendRow(mocBefore, row);
                    if (existing) {
                        const before = await this.read(cardPath), fm = yamlOf(before);
                        const paths = linkList(fm.client ?? fm.with).map(p => this.resolve(p, cardPath));
                        const colorOwner = linkedPath(fm.schedule_color_person);
                        const appearance = colorAppearance(fm.schedule_color, colorOwner ? this.resolve(colorOwner, cardPath) : '', paths, this.people, existing.kind);
                        if (appearance.colorPerson !== existing.colorPerson || appearance.color !== existing.color) throw new Error('安排颜色或绑定人物已修改，请重新打开安排。');
                        if (fm.schedule_id !== id || JSON.stringify(intervalOf(fm.schedule_start, fm.schedule_end)) !== JSON.stringify({ day: existing.day, start: existing.start, end: existing.end }) || String(fm.description ?? '') !== existing.notes || JSON.stringify(linkList(fm.client ?? fm.with).map(p => this.resolve(p, cardPath))) !== JSON.stringify(existing.people) || (fm.client ? 'client' : fm.with ? 'with' : 'self') !== existing.relation || String(fm.schedule_source_task ?? '') !== existing.sourceTask) throw new Error('卡片已在其他窗口修改，请重新打开安排。');
                        await tx.change(cardPath, before, patchProperties(before, properties));
                    } else {
                        const templateFile = this.app.vault.getAbstractFileByPath(this.settings.cardTemplate);
                        const template = templateFile instanceof TFile ? await this.app.vault.read(templateFile) : this.templates.card();
                        await tx.create(cardPath, createCard(template, { created: stamp.stamp, UID: stamp.uid,
                            up: [wiki(container!.path, container!.name)], ...properties }));
                    }
                    await tx.change(container!.path, mocBefore, mocAfter);
                    for (const path of personPaths) {
                        const before = await this.read(path);
                        const fm = yamlOf(before);
                        if (!['person', 'client'].includes(String(fm.type))) throw new Error('人物档案类型已改变，请重新选择人物。');
                        let after = ensurePersonTasks(before, this.settings);
                        const desired = path === item.colorPerson && draft.colorEdited ? item.color : this.people.find(p => p.path === path)!.color;
                        if (!colorKey(fm.calendar_color) || (path === item.colorPerson && draft.colorEdited)) after = patchProperties(after, { calendar_color: desired });
                        await tx.change(path, before, after);
                    }
                });
                this.baselines.delete(id); return id;
            } catch (error) {
                if (newFolder) {
                    const folder = this.app.vault.getAbstractFileByPath(newFolder);
                    if (folder instanceof TFolder && !folder.children.length) await this.app.vault.delete(folder);
                }
                throw error;
            }
        });
    }
    private currentRow(text: string, item: Arrangement): string {
        const rows = taskRows(text).rows.filter(row => row.id === item.id);
        const row = rows[0];
        if (rows.length !== 1 || row.day !== item.day || row.start !== item.start || row.end !== item.end || row.done !== item.done) throw new Error('MOC 任务已在其他窗口修改，请重新打开安排。');
        return row.raw;
    }
    async move(item: Arrangement, interval: Interval): Promise<void> {
        await this.save({ ...item, ...interval, mode: item.kind, target: item.mocPath, projectName: '', colorEdited: false }, item);
    }
    async setColor(item: Arrangement, color: ColorKey): Promise<void> {
        this.check(item);
        if (!colorKey(color)) throw new Error('请选择六种预设颜色之一。');
        await this.exclusive(async () => {
            const path = item.colorPerson || item.cardPath;
            await this.flush([item.cardPath, path]);
            const card = await this.read(item.cardPath), props = yamlOf(card);
            const paths = linkList(props.client ?? props.with).map(p => this.resolve(p, item.cardPath));
            const owner = linkedPath(props.schedule_color_person);
            const appearance = colorAppearance(props.schedule_color, owner ? this.resolve(owner, item.cardPath) : '', paths, this.people, item.kind);
            if (props.schedule_id !== item.id || appearance.colorPerson !== item.colorPerson) throw new Error('安排绑定人物已改变，请重新打开安排。');
            const before = await this.read(path), fm = yamlOf(before);
            if (item.colorPerson) {
                if (!['person', 'client'].includes(String(fm.type))) throw new Error('绑定的人物档案已改变，请重新打开安排。');
                if ((colorKey(fm.calendar_color) ?? defaultPersonColor(String(fm.UID ?? path))) !== item.color) throw new Error('人物颜色已修改，请重新打开安排。');
                await this.change(path, before, patchProperties(before, { calendar_color: color }));
            } else {
                if (appearance.color !== item.color) throw new Error('安排颜色已修改，请重新打开安排。');
                await this.change(path, before, patchProperties(before, { schedule_color: color }));
            }
        });
    }
    async toggle(item: Arrangement, done: boolean): Promise<void> {
        this.check(item);
        await this.exclusive(async () => {
            await this.flush([item.mocPath]);
            const text = await this.read(item.mocPath), raw = this.currentRow(text, item);
            const next = raw.replace(/^- \[[ xX]\]/, `- [${done ? 'x' : ' '}]`);
            await this.change(item.mocPath, text, replaceRow(text, item.id, next, raw));
        });
    }
    async tasksOf(path: string): Promise<{ label: string; value: string }[]> {
        const container = this.containers.find(c => c.path === path);
        const candidates = container ? this.app.vault.getMarkdownFiles().filter(file => file.path.startsWith(`${container.folder}/`)) : [this.file(path)];
        const tasks: { label: string; value: string }[] = [];
        for (const file of candidates) {
            const { lines } = splitTextLines(await this.app.vault.read(file));
            let fenced = false;
            lines.forEach((line, index) => {
                if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return; }
                if (fenced || !/^\s*- \[ \] /.test(line) || /\^schedule-/.test(line)) return;
                const title = line.replace(/^\s*- \[ \] /, '');
                const blockId = /\^([a-zA-Z0-9-]+)\s*$/.exec(line)?.[1];
                const link = wiki(`${file.path}${blockId ? `#^${blockId}` : ''}`, file.basename);
                tasks.push({ label: `${title.slice(0, 90)} · ${file.basename}`, value: `${link} · 第 ${index + 1} 行：${title}` });
            });
        }
        return tasks;
    }
    async addPeopleQueries(): Promise<number> {
        return this.exclusive(async () => {
            let count = 0; const tx = new WriteTransaction(this);
            await this.flush(this.people.map(p => p.path));
            await tx.run(async () => {
                for (const person of this.people) {
                    const before = await this.read(person.path), after = ensurePersonTasks(before, this.settings);
                    if (before !== after) { await tx.change(person.path, before, after); count++; }
                }
            }); return count;
        });
    }
}
