/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与源模块；以可控 Obsidian 替身重放并发写入
 * [OUTPUT]: 提供出库单追加、复盘空文件初始化与项目流转的写入安全回归
 * [POS]: tests 的文件事务专项；测试公共入口，把用户编辑插入真实异步边界，不复制业务实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const notices = [];
globalThis.__writeSafetyNotices = notices;

const stub = `
    import moment from 'moment';
    export { moment };
    export class TFile { static [Symbol.hasInstance](value) { return value?.kind === 'file'; } }
    export class TFolder { static [Symbol.hasInstance](value) { return value?.kind === 'folder'; } }
    export class Notice { constructor(message) { globalThis.__writeSafetyNotices.push(message); } }
    export class Modal {
        constructor(app) { this.app = app; }
        open() { this.app.confirm?.(this); }
    }
    export class ButtonComponent {}
    export const normalizePath = value => value;
    export class Vault { static recurseChildren(folder, callback) {
        for (const child of folder.children ?? []) { callback(child); if (child.kind === 'folder') this.recurseChildren(child, callback); }
    } }
`;

async function load(relativePath) {
    const result = await build({
        entryPoints: [ROOT + relativePath], bundle: true, format: 'esm', platform: 'node',
        write: false, logLevel: 'silent', plugins: [{ name: 'obsidian', setup(builder) {
            builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: stub, resolveDir: ROOT }));
        } }],
    });
    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { createExportHook } = await load('src/modules/eternal/export.ts');
const { openPeriodNote, registerPeriodAutoInit } = await load('src/modules/review/periodic.ts');
const { runProjectTransition } = await load('src/modules/projects/transitions.ts');
const { EXPORT_MANIFEST_FILE, PERIODS } = await load('src/core/constants.ts');
const { manifestSkeleton, parseManifestLine } = await load('src/modules/eternal/manifest.ts');

function fixture() {
    const files = new Map();
    const listeners = new Map();
    const ctx = {
        edition: { role: 'human', layout: { eternal: '赛博永生' } },
        settings: { diaryFolder: '05-diary', projectFolder: '01-projects', archiveFolder: '04-archives' },
        guard: { mark() {}, isRecent() { return false; } },
        plugin: { registerEvent() {} },
        app: {
            workspace: { getLeaf: () => ({ openFile: async () => {} }), onLayoutReady: callback => callback() },
            metadataCache: { getFileCache: file => ({ frontmatter: file.frontmatter }) },
            fileManager: {},
            vault: {
                getAbstractFileByPath: path => files.get(path) ?? null,
                read: async file => file.content,
                modify: async (file, content) => { file.content = content; },
                process: async (file, callback) => {
                    await Promise.resolve();
                    file.content = callback(file.content);
                    file.stat.size = Buffer.byteLength(file.content);
                    return file.content;
                },
                create: async (path, content) => {
                    await Promise.resolve();
                    if (files.has(path)) throw new Error('File already exists');
                    return addFile(path, content);
                },
                createFolder: async path => {
                    if (files.has(path)) throw new Error('Folder already exists');
                    files.set(path, { kind: 'folder', path });
                },
                on: (event, callback) => { listeners.set(event, callback); },
            },
        },
    };
    function addFile(path, content = '') {
        const name = path.split('/').at(-1);
        const file = { kind: 'file', path, name, basename: name.slice(0, -3), extension: 'md', content,
            stat: { size: Buffer.byteLength(content) } };
        files.set(path, file);
        return file;
    }
    files.set('90-system', { kind: 'folder', path: '90-system' });
    return { ctx, files, addFile, listeners };
}

const archived = uid => ({ uid, name: `项目${uid}`, kind: 'project', folderPath: `04-archives/项目${uid}` });
const entries = content => content.split('\n').map(parseManifestLine).filter(Boolean);
async function flush() { for (let i = 0; i < 8; i++) await new Promise(setImmediate); }

test('并发归档在已有出库单保留每个项目，重复 UID 只落一笔', async () => {
    const { ctx, addFile } = fixture();
    const manifest = addFile(EXPORT_MANIFEST_FILE, manifestSkeleton('赛博永生'));
    const hook = createExportHook(ctx);
    hook(archived('1')); hook(archived('2')); hook(archived('1'));
    await flush();
    assert.deepEqual(entries(manifest.content).map(entry => entry.uid).sort(), ['1', '2']);
});

test('首次并发归档只建一张出库单，两笔都保留', async () => {
    const { ctx, files } = fixture();
    const hook = createExportHook(ctx);
    hook(archived('1')); hook(archived('2'));
    await flush();
    assert.deepEqual(entries(files.get(EXPORT_MANIFEST_FILE).content).map(entry => entry.uid).sort(), ['1', '2']);
});

test('出库单在读取和落盘之间的新编辑不会被归档覆盖', async () => {
    const { ctx, addFile } = fixture();
    const manifest = addFile(EXPORT_MANIFEST_FILE, manifestSkeleton('赛博永生'));
    ctx.app.vault.read = async file => {
        const stale = file.content;
        file.content += '\n用户刚写的备注\n';
        return stale;
    };
    const process = ctx.app.vault.process;
    ctx.app.vault.process = async (file, callback) => {
        file.content += '\n用户刚写的备注\n';
        return process(file, callback);
    };
    createExportHook(ctx)(archived('1'));
    await flush();
    assert.match(manifest.content, /用户刚写的备注/);
    assert.equal(entries(manifest.content).length, 1);
});

test('补复盘骨架在原子回调内发现新输入时保留用户正文', async () => {
    const { ctx, addFile } = fixture();
    const diary = addFile('05-diary/01-daily/2026-09-12.md');
    ctx.app.vault.process = async (file, callback) => {
        file.content = callback('刚写下的日记');
        return file.content;
    };
    await openPeriodNote(ctx, PERIODS.daily, { day: '2026-09-12', reveal: false });
    assert.equal(diary.content, '刚写下的日记');
});

test('两个入口并发打开同一天时都返回同一篇日记', async () => {
    const { ctx, files } = fixture();
    for (const path of ['05-diary', '05-diary/01-daily']) files.set(path, { kind: 'folder', path });
    const [first, second] = await Promise.all([
        openPeriodNote(ctx, PERIODS.daily, { day: '2026-09-12', reveal: false }),
        openPeriodNote(ctx, PERIODS.daily, { day: '2026-09-12', reveal: false }),
    ]);
    assert.ok(first);
    assert.equal(second, first);
    assert.match(first.content, /# 2026-09-12/);
    assert.equal([...files.values()].filter(file => file.kind === 'file').length, 1);
});

test('空复盘正常补骨架，有空白字符的笔记仍原样保留', async () => {
    for (const content of ['', ' \n']) {
        const { ctx, addFile } = fixture();
        const diary = addFile('05-diary/01-daily/2026-09-12.md', content);
        await openPeriodNote(ctx, PERIODS.daily, { day: '2026-09-12', reveal: false });
        if (content === '') assert.match(diary.content, /# 2026-09-12/);
        else assert.equal(diary.content, content);
    }
});

test('自动归位等待建目录期间笔记被编辑后，不再搬动它', async () => {
    const { ctx, addFile, files, listeners } = fixture();
    const diary = addFile('05-diary/2026-09-12.md');
    let renamed = false;
    ctx.app.vault.createFolder = async path => {
        files.set(path, { kind: 'folder', path });
        diary.content = '同步工具刚落下的正文';
        diary.stat.size = Buffer.byteLength(diary.content);
    };
    ctx.app.fileManager.renameFile = async () => { renamed = true; };
    registerPeriodAutoInit(ctx);
    listeners.get('create')(diary);
    await flush();
    assert.equal(renamed, false);
    assert.equal(diary.path, '05-diary/2026-09-12.md');
});

function transitionFixture() {
    const result = fixture();
    const { ctx, files, addFile } = result;
    const folder = { kind: 'folder', path: '01-projects/任务', name: '任务', children: [] };
    files.set(folder.path, folder);
    files.set('04-archives', { kind: 'folder', path: '04-archives' });
    const moc = addFile('01-projects/任务/MOC-任务.md', '用户正文');
    moc.parent = folder;
    moc.frontmatter = { type: 'project', status: 'active', UID: '123' };
    folder.children.push(moc);
    ctx.app.workspace.getActiveFile = () => moc;
    ctx.app.confirm = modal => modal.resolver(true);
    ctx.app.fileManager.renameFile = async (entry, target) => {
        if (files.has(target)) throw new Error('Target already exists');
        files.delete(entry.path); files.delete(moc.path);
        entry.path = target; moc.path = `${target}/${moc.name}`;
        files.set(entry.path, entry); files.set(moc.path, moc);
    };
    ctx.app.fileManager.processFrontMatter = async (file, callback) => callback(file.frontmatter);
    return { ...result, folder, moc };
}

test('同一项目同时确认两次完成，不会被第二次失败回滚到进行中目录', async () => {
    const { ctx, folder, moc } = transitionFixture();
    await Promise.all([runProjectTransition(ctx, 'done'), runProjectTransition(ctx, 'done')]);
    assert.equal(folder.path, '04-archives/任务');
    assert.equal(moc.frontmatter.status, 'done');
});

test('确认期间项目被搬走并出现替代目录，旧计划不移动任何一边', async () => {
    const { ctx, files, folder, moc } = transitionFixture();
    ctx.app.confirm = modal => {
        files.delete(folder.path); files.delete(moc.path);
        folder.path = '02-areas/任务'; moc.path = `${folder.path}/${moc.name}`;
        files.set(folder.path, folder); files.set(moc.path, moc);
        files.set('01-projects/任务', { kind: 'folder', path: '01-projects/任务', name: '任务' });
        modal.resolver(true);
    };
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '02-areas/任务');
    assert.equal(moc.frontmatter.status, 'active');
    assert.equal(files.has('04-archives/任务'), false);
});

test('取消确认释放同项目锁，后续仍能正常完成', async () => {
    const { ctx, folder, moc } = transitionFixture();
    ctx.app.confirm = modal => modal.resolver(false);
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '01-projects/任务');
    ctx.app.confirm = modal => modal.resolver(true);
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '04-archives/任务');
    assert.equal(moc.frontmatter.status, 'done');
});

test('目录改名已提交后拒绝，仍以同一对象恢复原位置', async () => {
    const { ctx, folder, moc } = transitionFixture();
    const rename = ctx.app.fileManager.renameFile;
    let attempts = 0;
    ctx.app.fileManager.renameFile = async (file, target) => {
        await rename(file, target);
        if (attempts++ === 0) throw new Error('链接维护在改名后失败');
    };
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '01-projects/任务');
    assert.equal(moc.frontmatter.status, 'active');
    assert.equal(attempts, 2);
});

test('frontmatter 写入已提交后拒绝，恢复原位置、状态与归档日', async () => {
    const { ctx, folder, moc } = transitionFixture();
    moc.frontmatter.archived = '2025-12-01';
    let attempts = 0;
    ctx.app.fileManager.processFrontMatter = async (file, callback) => {
        callback(file.frontmatter);
        if (attempts++ === 0) throw new Error('状态落盘后失败');
    };
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '01-projects/任务');
    assert.equal(moc.frontmatter.status, 'active');
    assert.equal(moc.frontmatter.archived, '2025-12-01');
    assert.equal(attempts, 2);
});

test('确认期间新建同名目标时，保留源目录与无关目标目录', async () => {
    const { ctx, files, folder, moc } = transitionFixture();
    const occupant = { kind: 'folder', path: '04-archives/任务', name: '任务' };
    ctx.app.confirm = modal => {
        files.set(occupant.path, occupant);
        modal.resolver(true);
    };
    await runProjectTransition(ctx, 'done');
    assert.equal(folder.path, '01-projects/任务');
    assert.equal(files.get(occupant.path), occupant);
    assert.equal(moc.frontmatter.status, 'active');
});

test('改名失败后目标被无关目录占据，回滚不接管该目录', async () => {
    const { ctx, files, folder, moc } = transitionFixture();
    const occupant = { kind: 'folder', path: '04-archives/任务', name: '任务' };
    let renames = 0;
    ctx.app.fileManager.renameFile = async () => {
        renames++;
        files.delete(folder.path); files.delete(moc.path);
        files.set(occupant.path, occupant);
        throw new Error('移动失败且目录现场已变化');
    };
    await runProjectTransition(ctx, 'done');
    assert.equal(renames, 1);
    assert.equal(files.get(occupant.path), occupant);
    assert.equal(files.has('01-projects/任务'), false);
    assert.match(notices.at(-1), /回滚位置已被其他目录占用/);
});
