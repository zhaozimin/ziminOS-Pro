/**
 * [INPUT]: 依赖 node:test/assert/fs/vm/stream 与 esbuild，编译真实 Eagle 传输和呈现模块并在隔离宿主中执行伴侣源码
 * [OUTPUT]: 验证导入失败保留选中文本、原路径保留空白、普通图片不被清空、Eagle 节点复用后重新水合，以及异步切库时停止后续读取/写入
 * [POS]: tests 的 Eagle 数据完整性回归；用可控异步边界复现用户操作时序，不连接真实 Eagle、不读取设备凭据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeRequire = createRequire(import.meta.url);
const flush = () => new Promise((resolve) => setImmediate(resolve));

async function loadModule(entry, overrides = {}) {
    const result = await build({
        entryPoints: [path.join(ROOT, entry)], bundle: true, format: 'cjs', platform: 'node',
        external: ['obsidian', '@codemirror/state', '@codemirror/view'], write: false, logLevel: 'silent',
    });
    const notices = [];
    const module = { exports: {} };
    const dependencies = {
        obsidian: {
            Notice: class { constructor(message) { notices.push(message); } },
            Platform: { isDesktopApp: true, isMacOS: true },
        },
        electron: { webUtils: { getPathForFile: (file) => `/tmp/${file.name}` } },
        '@codemirror/state': { Prec: { highest: (value) => value } },
        '@codemirror/view': { EditorView: { domEventHandlers: (value) => value } },
    };
    const context = createContext({
        module, exports: module.exports, Blob,
        require: (id) => dependencies[id] ?? nodeRequire(id),
        ...overrides,
    });
    runInContext(result.outputFiles[0].text, context);
    return { ...module.exports, notices };
}

async function runTransfer({ failure = false, routeFailure = false, fileName = '附件.pdf' } = {}) {
    const { registerEagleTransfers, notices } = await loadModule('src/modules/eagle/transfer.ts');
    const listeners = new Map();
    const importedPaths = [];
    let text = '前文重要原文后文';
    const editor = {
        getValue: () => text,
        getSelection: () => '重要原文',
        replaceSelection: (value) => { text = `前文${value}后文`; },
        offsetToPos: (offset) => offset,
        replaceRange: (value, from, to) => { text = text.slice(0, from) + value + text.slice(to); },
    };
    const ctx = {
        settings: { eagleEnabled: true },
        app: { workspace: { on: (event, listener) => listeners.set(event, listener) } },
        plugin: { registerEvent: () => undefined },
    };
    registerEagleTransfers(ctx, {
        importFile: async (filePath) => {
            importedPaths.push(filePath);
            if (failure) throw new Error('伴侣离线');
            return { itemId: 'ITEM123', name: '附件.pdf' };
        },
    }, () => {
        if (routeFailure) throw new Error('路径解析失败');
        return null;
    });
    const event = {
        defaultPrevented: false,
        clipboardData: { files: [{ name: fileName, type: 'application/pdf' }] },
        preventDefault() { this.defaultPrevented = true; },
    };
    listeners.get('editor-paste')(event, editor, { file: { path: '笔记.md' } });
    assert.equal(event.defaultPrevented, true);
    await flush();
    return { text, notices, importedPaths };
}

test('所有附件导入失败时恢复被选中的原文，而不留下占位符', async () => {
    const { text, notices } = await runTransfer({ failure: true });
    assert.equal(text, '前文重要原文后文');
    assert.ok(notices.some((message) => message.includes('伴侣离线')));
});

test('附件导入成功才用稳定链接替换选中文本', async () => {
    const { text } = await runTransfer();
    assert.equal(text, '前文[附件.pdf](ziminos-eagle://v1/primary/ITEM123)后文');
});

test('路由解析失败时不把占位符写入正文', async () => {
    const { text, notices } = await runTransfer({ routeFailure: true });
    assert.equal(text, '前文重要原文后文');
    assert.ok(notices.some((message) => message.includes('路径解析失败')));
});

test('桌面拖入路径逐字传给伴侣，不裁掉合法文件名末尾的空格', async () => {
    const { importedPaths } = await runTransfer({ fileName: '附件.pdf ' });
    assert.deepEqual(importedPaths, ['/tmp/附件.pdf ']);
});

function imageElement(src) {
    return {
        tagName: 'IMG', nodeType: 1, src, dataset: {}, classList: { add: () => undefined },
        getAttribute(name) { return name === 'src' ? this.src : null; },
        removeAttribute(name) { if (name === 'src') this.src = ''; },
        querySelectorAll: () => [],
        matches() { return this.src.startsWith('ziminos-eagle://') || !!this.dataset.ziminosEagleUri; },
    };
}

async function rendererHarness(initialImages = []) {
    let observer;
    let dispose;
    let serial = 0;
    const revoked = [];
    const { registerEagleRenderer } = await loadModule('src/modules/eagle/render.ts', {
        URL: {
            createObjectURL: () => `blob:test-${++serial}`,
            revokeObjectURL: (value) => revoked.push(value),
        },
        MutationObserver: class {
            constructor(callback) { observer = callback; }
            observe() {}
            disconnect() {}
        },
    });
    const doc = {
        body: {}, querySelectorAll: () => initialImages,
        addEventListener() {}, removeEventListener() {},
    };
    registerEagleRenderer({
        app: { workspace: { containerEl: { ownerDocument: doc }, on() {} } },
        plugin: {
            registerEditorExtension() {}, registerMarkdownPostProcessor() {}, registerEvent() {},
            register(callback) { dispose = callback; },
        },
    }, { content: async () => ({ bytes: new ArrayBuffer(1), contentType: 'image/png' }) });
    await flush();
    return { mutate: (records) => observer(records), dispose: () => dispose(), revoked };
}

test('全局移除监听不清空普通图片的 src', async () => {
    const harness = await rendererHarness();
    const image = imageElement('app://local/原图.png');
    try {
        harness.mutate([{ removedNodes: [image], addedNodes: [] }]);
        assert.equal(image.src, 'app://local/原图.png');
        assert.deepEqual(harness.revoked, []);
    } finally { harness.dispose(); }
});

test('同批 DOM 记录先插入后移除时，Eagle 复用图片仍能重新水合', async () => {
    const image = imageElement('ziminos-eagle://v1/primary/ITEM123');
    const harness = await rendererHarness([image]);
    try {
        assert.equal(image.src, 'blob:test-1');
        harness.mutate([
            { addedNodes: [image], removedNodes: [] },
            { addedNodes: [], removedNodes: [image] },
        ]);
        await flush();
        assert.equal(image.src, 'blob:test-2');
        assert.equal(image.dataset.ziminosEagleState, 'ready');
        assert.deepEqual(harness.revoked, ['blob:test-1']);
    } finally { harness.dispose(); }
    assert.deepEqual(harness.revoked, ['blob:test-1', 'blob:test-2']);
});

function companionHarness() {
    const source = readFileSync(path.join(ROOT, 'eagle-companion/js/service.js'), 'utf8');
    const module = { exports: {} };
    const context = createContext({ Buffer, URL, module, process, require: nodeRequire });
    runInContext(source, context);
    const directory = mkdtempSync(path.join(tmpdir(), 'ziminos-eagle-integrity-'));
    const attachment = path.join(directory, 'sample.txt');
    writeFileSync(attachment, 'hello-eagle');
    const calls = [];
    context.eagle = {
        library: { path: directory, name: '原资源库' },
        folder: {
            getAll: async () => { calls.push('getAll'); return []; },
            create: async () => { calls.push('create'); return { id: 'ROOT', parent: '' }; },
            createSubfolder: async () => { calls.push('createSubfolder'); return { id: 'CHILD', parent: 'ROOT' }; },
            open: async () => { calls.push('openFolder'); return true; },
        },
        item: {
            addFromPath: async () => { calls.push('addFromPath'); return 'ITEM123'; },
            getById: async () => ({ filePath: attachment, folders: ['CHILD'] }),
            select: async () => { calls.push('select'); return true; },
            open: async () => { calls.push('openItem'); return true; },
        },
        app: { show: async () => { calls.push('show'); return true; } },
    };
    return {
        service: new module.exports.BridgeService(), eagle: context.eagle, attachment, calls,
        client: { libraryKey: 'primary', libraryPath: directory },
        changeLibrary: () => { context.eagle.library.path = `${directory}-other`; },
        cleanup: () => rmSync(directory, { recursive: true, force: true }),
    };
}

function jsonRequest(body) {
    return Readable.from([Buffer.from(JSON.stringify(body))]);
}

test('伴侣按含空白的原路径导入，不误取同目录中去掉空白后的另一份文件', async () => {
    const harness = companionHarness();
    try {
        const attachment = `${harness.attachment} `;
        writeFileSync(attachment, 'the intended file');
        const imported = [];
        harness.eagle.item.addFromPath = async (filePath) => { imported.push(filePath); return 'ITEM123'; };
        const response = { writeHead() {}, end() {} };
        await harness.service.importItem(jsonRequest({ libraryKey: 'primary', filePath: attachment }), response, harness.client, 'fixed');
        assert.deepEqual(imported, [attachment]);
    } finally { harness.cleanup(); }
});

for (const boundary of ['queue', 'getAll', 'create', 'createSubfolder']) {
    test(`附件导入在 ${boundary} 等待期间切库后，不继续向新库建目录或导入`, async () => {
        const harness = companionHarness();
        const { service, eagle, client, attachment, calls } = harness;
        let release;
        try {
            if (boundary === 'queue') {
                service.folderOperation = new Promise((resolve) => { release = resolve; });
            } else {
                const original = eagle.folder[boundary];
                eagle.folder[boundary] = async (...args) => {
                    const result = await original(...args);
                    harness.changeLibrary();
                    return result;
                };
            }
            const operation = service.importItem(jsonRequest({
                libraryKey: 'primary', filePath: attachment, projectName: '项目甲',
            }), {}, client, 'project');
            const rejection = assert.rejects(operation, /资源库与配对时不同/);
            if (release) {
                await flush();
                harness.changeLibrary();
                release();
            }
            await rejection;
            assert.deepEqual(calls, {
                queue: [], getAll: ['getAll'], create: ['getAll', 'create'],
                createSubfolder: ['getAll', 'create', 'createSubfolder'],
            }[boundary]);
        } finally { harness.cleanup(); }
    });
}

test('读取附件等待 getById 时切库，在打开文件内容前拒绝旧请求', async () => {
    const harness = companionHarness();
    try {
        const original = harness.eagle.item.getById;
        harness.eagle.item.getById = async () => {
            const item = await original();
            harness.changeLibrary();
            return item;
        };
        await assert.rejects(harness.service.sendContent({ headers: {} }, {}, harness.client, 'ITEM123', 'primary'), /资源库与配对时不同/);
    } finally { harness.cleanup(); }
});

for (const boundary of ['getById', 'show', 'openFolder']) {
    test(`打开附件等待 ${boundary} 时切库，不继续用旧 ID 操作新库`, async () => {
        const harness = companionHarness();
        try {
            const owner = boundary === 'getById' ? harness.eagle.item : boundary === 'show' ? harness.eagle.app : harness.eagle.folder;
            const name = boundary === 'openFolder' ? 'open' : boundary;
            const original = owner[name];
            owner[name] = async (...args) => {
                const result = await original(...args);
                harness.changeLibrary();
                return result;
            };
            await assert.rejects(harness.service.openItem(jsonRequest({ libraryKey: 'primary' }), {}, harness.client, 'ITEM123'), /资源库与配对时不同/);
            assert.deepEqual(harness.calls, { getById: [], show: ['show'], openFolder: ['show', 'openFolder'] }[boundary]);
        } finally { harness.cleanup(); }
    });
}

test('唤起主窗口失败且期间切库时，不通过原生深链绕过库身份检查', async () => {
    const harness = companionHarness();
    try {
        harness.eagle.app.show = async () => { harness.changeLibrary(); return false; };
        const nativeLinks = [];
        harness.eagle.shell = { openExternal: async (url) => nativeLinks.push(url) };
        await assert.rejects(harness.service.openItem(jsonRequest({ libraryKey: 'primary' }), {}, harness.client, 'ITEM123'), /资源库与配对时不同/);
        assert.deepEqual(nativeLinks, []);
    } finally { harness.cleanup(); }
});
