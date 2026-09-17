/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与可控的 Obsidian 文件/索引替身，编译真实 core 与人脉视图源码
 * [OUTPUT]: 验证任务写回的原行身份、索引异步快照、并发建目录与双链锚点保真
 * [POS]: tests 的基础设施行为回归；模拟编辑和索引更新时间不同步，防止测试只覆盖顺序成功路径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
    stdin: {
        contents: `export * from './src/core/markdown';
            export * from './src/core/folders';
            export * from './src/core/vaultIndex';
            export * from './src/core/table';
            export * from './src/modules/contacts/personViews';
            export { TFile, TFolder, notices } from 'obsidian';`,
        resolveDir: root,
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
    plugins: [{
        name: 'obsidian-core-safety',
        setup(builder) {
            builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
                contents: `import moment from 'moment'; export { moment };
                    export class TFile {} export class TFolder {}
                    export const notices = [];
                    export class Notice { constructor(message) { notices.push(message); } }
                    export const normalizePath = (path) => path;`,
                resolveDir: root,
            }));
        },
    }],
});
const core = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

test('任务行发生漂移时，即使新旧两项都未勾选也不能改写另一项', () => {
    const before = '- [ ] 给 [[张三]] 发方案';
    const current = `- [ ] 给 [[李四]] 发合同\n${before}\n`;
    assert.equal(core.toggleTaskLine(current, 0, false, before), null);
    assert.equal(core.toggleTaskLine(`${before}\n`, 0, false, before), '- [x] 给 [[张三]] 发方案\n');
    assert.equal(core.toggleTaskLine('- [x] 已办\n', 0, false, before), null);
});

test('列表索引迟到时，同一 mtime 的空缓存不能永久遮住任务', async () => {
    const file = Object.assign(new core.TFile(), { path: '日记.md', stat: { mtime: 1 } });
    const content = '  - [ ] 给 [[张三]] 发方案\r\n';
    let items;
    const index = new core.VaultIndex({
        vault: { cachedRead: async () => content },
        metadataCache: { getFileCache: () => ({ listItems: items }) },
    });
    assert.deepEqual(await index.listLinesOf(file), []);
    items = [{
        position: { start: { line: 0, offset: 2 }, end: { line: 0, offset: content.length - 2 } },
        task: ' ',
    }];
    index.invalidate();
    const lines = await index.listLinesOf(file);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].rawLine, content.trimEnd());
});

test('读盘期间文件变化不能把旧文本标成新 mtime 缓存', async () => {
    const file = Object.assign(new core.TFile(), { path: '日记.md', stat: { mtime: 1 } });
    const old = '- [ ] 旧任务';
    let content = old;
    let finishRead;
    const items = [{ position: { start: { line: 0, offset: 0 }, end: { line: 0, offset: old.length } }, task: ' ' }];
    let reads = 0;
    const index = new core.VaultIndex({
        vault: { cachedRead: () => ++reads === 1 ? new Promise((resolve) => { finishRead = resolve; }) : Promise.resolve(content) },
        metadataCache: { getFileCache: () => ({ listItems: items }) },
    });
    const pending = index.listLinesOf(file);
    file.stat.mtime = 2;
    content = '- [ ] 新任务';
    finishRead(old);
    await pending;
    assert.equal((await index.listLinesOf(file))[0].text, '新任务');
    assert.equal(reads, 2);
});

test('两个操作同时建同一个父目录时均能成功，已存在目录不重建', async () => {
    const entries = new Map();
    const app = { vault: {
        getAbstractFileByPath: (path) => entries.get(path),
        createFolder: async (path) => {
            await Promise.resolve();
            if (entries.has(path)) throw new Error('already exists');
            entries.set(path, new core.TFolder());
        },
    } };
    await Promise.all([core.ensureFolderPath(app, '共同/目录'), core.ensureFolderPath(app, '共同/目录')]);
    assert.deepEqual([...entries.keys()], ['共同', '共同/目录']);
});

test('建目录失败不能掩盖文件占位或真实 I/O 错误', async () => {
    const failure = new Error('disk failure');
    const app = { vault: { getAbstractFileByPath: () => null, createFolder: async () => { throw failure; } } };
    await assert.rejects(core.ensureFolderPath(app, '目录'), (error) => error === failure);
    app.vault.getAbstractFileByPath = () => new core.TFile();
    await assert.rejects(core.ensureFolderPath(app, '目录'), /已经存在文件/);
});

test('汇总视图双链保留标题与块锚点，别名只影响显示', () => {
    const anchors = [];
    const parent = {
        appendText() {},
        createEl(tag, options) {
            const anchor = { ...options, setAttribute() {}, addEventListener() {} };
            anchors.push(anchor);
            return anchor;
        },
    };
    core.renderTextWithLinks({}, parent, '[[笔记#标题|跳到标题]] [[笔记#^块]] [[#本页标题]] [[笔记\\|别名]]', '日记.md');
    assert.deepEqual(anchors.map(({ href }) => href), ['笔记#标题', '笔记#^块', '#本页标题', '笔记']);
    assert.equal(anchors[0].text, '跳到标题');
    assert.equal(anchors[3].text, '别名');
});

test('人脉视图点击旧任务快照时拒绝误勾，并将写入失败呈现给用户', async () => {
    const elements = [];
    class Element {
        constructor(tag = 'div') { this.tag = tag; this.listeners = {}; elements.push(this); }
        createEl(tag) { return new Element(tag); }
        createDiv() { return this.createEl('div'); }
        createSpan() { return this.createEl('span'); }
        appendChild() {}
        appendText() {}
        addClass() {}
        setText() {}
        setAttribute() {}
        addEventListener(type, handler) { this.listeners[type] = handler; }
    }
    const previousElement = globalThis.HTMLElement;
    const previousCreateSpan = globalThis.createSpan;
    globalThis.HTMLElement = Element;
    globalThis.createSpan = () => new Element('span');
    core.notices.length = 0;
    try {
        const rawLine = '- [ ] 给 [[张三]] 发方案';
        let content = `${rawLine}\n`;
        let fail = false;
        let marks = 0;
        const file = { path: '2026-09-12.md', basename: '2026-09-12' };
        const host = { path: '张三.md', basename: '张三' };
        const view = {
            el: new Element(), host, sourcePath: host.path,
            index: {
                backlinksOf: () => [file], fieldOf: () => undefined, resolve: () => host,
                listLinesOf: async () => [{ text: '给 [[张三]] 发方案', rawLine, line: 0, checked: false, isTask: true, links: ['张三'] }],
            },
            ctx: { guard: { mark: () => { marks += 1; } }, app: { vault: {
                process: async (_file, transform) => {
                    if (fail) throw new Error('disk failure');
                    content = transform(content);
                },
            } } },
        };
        await core.personViews.find(({ name }) => name === '待办').render(view);
        const box = elements.find(({ tag }) => tag === 'input');
        const click = async () => {
            box.listeners.click({ preventDefault() {} });
            await new Promise((resolve) => setImmediate(resolve));
        };
        content = `- [ ] 给 [[李四]] 发合同\n${rawLine}\n`;
        const shifted = content;
        await click();
        assert.equal(content, shifted);
        assert.equal(marks, 0);
        assert.match(core.notices.at(-1), /原文已经变化/);

        content = `${rawLine}\n`;
        await click();
        assert.equal(content, '- [x] 给 [[张三]] 发方案\n');
        assert.equal(marks, 0);

        fail = true;
        await click();
        assert.match(core.notices.at(-1), /待办更新失败：disk failure/);
    } finally {
        globalThis.HTMLElement = previousElement;
        globalThis.createSpan = previousCreateSpan;
    }
});
