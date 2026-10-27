/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与 explorer/mocFirst、projects/moc 事实源
 * [OUTPUT]: 提供原生排序保全、新旧 MOC 命名、视图生命周期与其他插件兼容回归
 * [POS]: 文件树置顶的宿主边界测试。直接执行排序包装与卸载，
 *        验证长列表不依赖 DOM，原生节点与普通排序均保留。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
    stdin: {
        contents: `
            export { registerMocFirst } from './src/modules/explorer/mocFirst';
            export { resolveMocPath } from './src/modules/projects/moc';
            export { View, TFile, TFolder } from 'obsidian';
        `,
        resolveDir: ROOT,
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
    plugins: [{
        name: 'obsidian',
        setup(builder) {
            builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: `
                export class View {}
                class Entry {
                    constructor(path) { this.path = path; this.name = path.split('/').at(-1); }
                }
                export class TFile extends Entry {}
                export class TFolder extends Entry {}
                export const normalizePath = path => path.replace(/\\\\/g, '/').replace(/\\/+/g, '/');
            ` }));
        },
    }],
});
const { registerMocFirst, resolveMocPath, View, TFile, TFolder } = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`,
);

class Explorer extends View {
    constructor() {
        super();
        this.items = new Map();
        this.requests = 0;
    }
    getSortedFolderItems(folder) { return this.items.get(folder.path); }
    requestSort() { this.requests++; }
}

function fixture(initialViews = [new Explorer()], readyImmediately = true) {
    let views = initialViews;
    let layoutReady;
    const handlers = new Map();
    const cleanup = [];
    const files = new Map();
    const ctx = {
        app: {
            vault: { getAbstractFileByPath: path => files.get(path) ?? null },
            workspace: {
                getLeavesOfType(type) {
                    assert.equal(type, 'file-explorer');
                    return views.map(view => ({ view }));
                },
                onLayoutReady(callback) {
                    layoutReady = callback;
                    if (readyImmediately) callback();
                },
                on(name, callback) { handlers.set(name, callback); return name; },
            },
        },
        plugin: {
            registerEvent() {},
            register(callback) { cleanup.push(callback); },
        },
    };

    return {
        ctx, files,
        register(resolve = folder => resolveMocPath(ctx.app, folder.path, folder.name)) {
            registerMocFirst(ctx, resolve);
        },
        layout(next = views) { views = next; handlers.get('layout-change')(); },
        ready() { layoutReady(); },
        dispose() { for (const callback of cleanup) callback(); },
    };
}

function folderFiles(view, fixture, path, names) {
    const folder = new TFolder(path);
    const items = names.map(name => ({ file: new TFile(`${path}/${name}`) }));
    for (const item of items) fixture.files.set(item.file.path, item.file);
    view.items.set(path, Object.freeze(items));
    return { folder, items };
}

test('项目、领域、资源与书籍的 MOC 排在子文件夹之前，其他原生排序不变', () => {
    const view = new Explorer();
    const state = fixture([view]);
    state.register();

    for (const path of ['01-projects/项目甲', '02-areas/健康', '03-resources/工具', '01-projects/《书籍》', '04-archives/旧项目']) {
        const name = path.split('/').at(-1);
        const { folder, items } = folderFiles(view, state, path, ['附件', '000-卡片.md', `MOC-${name}.md`, 'zzz.md']);
        items[0].file = new TFolder(`${path}/附件`);
        const sorted = view.getSortedFolderItems(folder);
        assert.deepEqual(sorted, [items[2], items[0], items[1], items[3]]);
        assert.equal(sorted[0], items[2]);
        assert.equal(items[0].file.name, '附件');
    }

    state.dispose();
});

test('长列表与升降序、时间排序共用同一优先规则，不修改宿主数组', () => {
    const view = new Explorer();
    const state = fixture([view]);
    const names = Array.from({ length: 1200 }, (_, i) => `${i}.md`);
    const { folder, items } = folderFiles(view, state, '01-projects/长项目', [...names, 'MOC-长项目.md']);
    const moc = items.at(-1);
    state.register();

    for (const ordinary of [items.slice(0, -1), items.slice(0, -1).reverse(), [...items.slice(500, -1), ...items.slice(0, 500)]]) {
        const native = Object.freeze([...ordinary, moc]);
        view.items.set(folder.path, native);
        const sorted = view.getSortedFolderItems(folder);
        assert.deepEqual(sorted, [moc, ...ordinary]);
        assert.equal(native.at(-1), moc);
        assert.equal(sorted.length, native.length);
    }

    state.dispose();
});

test('新命名优先，旧同名 MOC 兼容；改名后按实时路径识别，不靠元数据缓存', () => {
    const view = new Explorer();
    const state = fixture([view]);
    const { folder, items } = folderFiles(view, state, '03-resources/工具', ['A.md', '工具.md', 'MOC-工具.md']);
    state.register();
    assert.equal(view.getSortedFolderItems(folder)[0], items[2]);
    state.files.delete(items[2].file.path);
    view.items.set(folder.path, items.slice(0, 2));
    assert.equal(view.getSortedFolderItems(folder)[0], items[1]);

    const renamed = folderFiles(view, state, '03-resources/新工具', ['A.md', 'MOC-新工具.md']);
    assert.equal(view.getSortedFolderItems(renamed.folder)[0], renamed.items[1]);
    state.dispose();
});

test('没有 MOC、MOC 已在首位或节点形状未知时原样交回原生结果', () => {
    const view = new Explorer();
    const state = fixture([view]);
    const { folder, items } = folderFiles(view, state, '03-resources/工具', ['A.md', 'MOC-其他.md']);
    state.register();
    assert.equal(view.getSortedFolderItems(folder), items);
    for (const native of [null, { changedHost: true }, [null, {}, { file: { path: '03-resources/工具/MOC-工具.md' } }]]) {
        view.items.set(folder.path, native);
        assert.equal(view.getSortedFolderItems(folder), native);
    }
    const current = folderFiles(view, state, folder.path, ['MOC-工具.md', 'A.md']);
    assert.equal(view.getSortedFolderItems(folder), current.items);
    state.dispose();
});

test('多视图分别接入，反复布局不叠加；关闭视图与卸载恢复原方法和属性描述', () => {
    const first = new Explorer();
    const second = new Explorer();
    const state = fixture([first]);
    const original = first.getSortedFolderItems;
    Object.defineProperty(second, 'getSortedFolderItems', { value: original, configurable: true, writable: true, enumerable: true });
    const descriptor = Object.getOwnPropertyDescriptor(second, 'getSortedFolderItems');
    state.register();
    const wrapped = first.getSortedFolderItems;
    state.layout();
    assert.equal(first.getSortedFolderItems, wrapped);
    assert.equal(first.requests, 1);
    state.layout([first, second]);
    assert.notEqual(second.getSortedFolderItems, original);
    state.layout([second]);
    assert.equal(first.getSortedFolderItems, original);
    assert.equal(Object.hasOwn(first, 'getSortedFolderItems'), false);
    state.dispose();
    assert.deepEqual(Object.getOwnPropertyDescriptor(second, 'getSortedFolderItems'), descriptor);
    state.layout([first, second]);
    assert.equal(first.getSortedFolderItems, original);
});

test('保留前后接入的第三方排序包装，卸载后停用自己的置顶逻辑', () => {
    const view = new Explorer();
    const state = fixture([view]);
    const { folder, items } = folderFiles(view, state, '02-areas/健康', ['A.md', 'MOC-健康.md']);
    const native = view.getSortedFolderItems;
    view.getSortedFolderItems = function(folder) { return native.call(this, folder); };
    const predecessor = view.getSortedFolderItems;
    state.register();
    const ours = view.getSortedFolderItems;
    const later = function(folder) { return ours.call(this, folder); };
    view.getSortedFolderItems = later;
    assert.equal(view.getSortedFolderItems(folder)[0], items[1]);
    state.dispose();
    assert.equal(view.getSortedFolderItems, later);
    assert.equal(view.getSortedFolderItems(folder), items);

    view.getSortedFolderItems = predecessor;
    const again = fixture([view]);
    again.register();
    again.dispose();
    assert.equal(view.getSortedFolderItems, predecessor);
});

test('宿主不支持、属性被锁定、延迟布局晚于卸载时安全跳过', () => {
    const locked = Object.freeze(new Explorer());
    const state = fixture([new View(), locked], false);
    state.register();
    state.ready();
    state.dispose();
    assert.equal(Object.hasOwn(locked, 'getSortedFolderItems'), false);

    const view = new Explorer();
    const late = fixture([view], false);
    late.register();
    late.dispose();
    late.ready();
    assert.equal(Object.hasOwn(view, 'getSortedFolderItems'), false);
});

test('MOC 解析失败回落原排序；恢复属性失败不阻断其他视图清理', () => {
    const view = new Explorer();
    const second = new Explorer();
    const state = fixture([view, second]);
    const { folder, items } = folderFiles(view, state, '03-resources/工具', ['A.md', 'MOC-工具.md']);
    state.register(() => { throw new Error('解析失败'); });
    assert.equal(view.getSortedFolderItems(folder), items);
    Object.defineProperty(view, 'getSortedFolderItems', { configurable: false, writable: false });
    state.dispose();
    assert.equal(view.getSortedFolderItems(folder), items);
    assert.equal(Object.hasOwn(second, 'getSortedFolderItems'), false);
});
