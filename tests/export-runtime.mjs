/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与导出模块真源；用最小宿主替身控制 DOM、组件与异步完成顺序
 * [OUTPUT]: 验证渲纸失败清理、释放幂等、预览关闭后的迟到回调、保存参数快照与重复命令隔离
 * [POS]: tests 的导出生命周期回归；执行真实业务代码，界面视觉与第三方栅格化仍由运行时验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { transform } from 'esbuild';

const ROOT = new URL('../', import.meta.url);

async function loadRuntime(relative, imports = {}, globals = {}) {
    const { code } = await transform(readFileSync(new URL(relative, ROOT), 'utf8'), {
        sourcefile: fileURLToPath(new URL(relative, ROOT)),
        loader: 'ts', format: 'cjs', target: 'node20',
    });
    const module = { exports: {} };
    const require = (name) => {
        assert.ok(Object.hasOwn(imports, name), `未提供宿主依赖：${name}`);
        return imports[name];
    };

    new Function('require', 'module', 'exports', ...Object.keys(globals), code)(
        require, module, module.exports, ...Object.values(globals),
    );
    return module.exports;
}

const style = await loadRuntime('src/core/exportStyle.ts');
const layout = await loadRuntime('src/modules/export/layout.ts');

function deferred() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
}

class Element {
    children = [];
    style = {};
    classes = new Set();
    dataset = {};
    attributes = {};
    listeners = {};
    clientWidth = 800;
    offsetWidth = 760;
    scrollWidth = 760;
    scrollHeight = 900;

    createDiv(options = {}) { return this.createEl('div', options); }
    createEl(_tag, options = {}) {
        const child = new Element();
        for (const cls of (options.cls ?? '').split(' ').filter(Boolean)) child.addClass(cls);
        child.textContent = options.text ?? '';
        child.attributes = { ...options.attr };
        return this.appendChild(child);
    }
    appendChild(child) {
        child.remove();
        child.parent = this;
        this.children.push(child);
        return child;
    }
    remove() {
        if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
        this.parent = null;
    }
    empty() { for (const child of [...this.children]) child.remove(); }
    addClass(name) { this.classes.add(name); }
    removeClass(name) { this.classes.delete(name); }
    hasClass(name) { return this.classes.has(name); }
    toggleClass(name, active) { if (active) this.addClass(name); else this.removeClass(name); }
    setText(text) { this.textContent = text; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    querySelectorAll() { return []; }
}

async function paperHarness({ readFails = false, renderFails = false, unloadFails = false } = {}) {
    const body = new Element();
    const stats = { loaded: 0, unloaded: 0 };
    const failure = new Error('模拟宿主失败');
    class Component {
        load() { stats.loaded += 1; }
        unload() {
            stats.unloaded += 1;
            if (unloadFails) throw failure;
        }
    }
    const { renderPaper } = await loadRuntime('src/modules/export/paper.ts', {
        obsidian: {
            Component, MarkdownView: class {}, TFile: class {},
            MarkdownRenderer: { render: async () => { if (renderFails) throw failure; } },
        },
    }, {
        document: { body, fonts: { ready: Promise.resolve() } },
        requestAnimationFrame: (callback) => queueMicrotask(callback),
    });
    const ctx = { app: {
        workspace: { getActiveViewOfType: () => null },
        vault: { cachedRead: async () => { if (readFails) throw failure; return '# 测试'; } },
    } };
    return { body, stats, failure, render: () => renderPaper(ctx, { basename: '测试', path: '测试.md' }) };
}

for (const stage of ['readFails', 'renderFails']) {
    test(`渲纸在 ${stage} 失败时也释放组件与已挂载舞台`, async () => {
        const harness = await paperHarness({ [stage]: true });

        await assert.rejects(harness.render(), (error) => error === harness.failure);
        assert.equal(harness.stats.loaded, 1);
        assert.equal(harness.stats.unloaded, 1);
        assert.equal(harness.body.children.length, 0);
    });
}

test('纸张重复释放只卸载一次；组件卸载抛错也移除舞台并归还主题', async () => {
    const harness = await paperHarness({ unloadFails: true });
    harness.body.addClass('theme-dark');
    const paper = await harness.render();
    paper.setTheme('light');

    assert.throws(() => paper.release(), (error) => error === harness.failure);
    assert.equal(harness.body.hasClass('theme-dark'), true);
    assert.equal(harness.body.hasClass('theme-light'), false);
    assert.equal(harness.body.children.length, 0);
    assert.doesNotThrow(() => paper.release());
    assert.equal(harness.stats.unloaded, 1);
});

async function modalHarness({ confirm = async () => true, chooseLogo = async () => null } = {}) {
    const frames = new Map();
    let serial = 0;
    const calls = { theme: 0, unmount: 0 };
    class Modal {
        constructor(app) {
            this.app = app;
            this.contentEl = new Element();
            this.modalEl = new Element();
            this.titleEl = new Element();
        }
        open() { this.onOpen(); }
        close() { this.onClose(); }
    }
    const paper = {
        article: new Element(),
        setTheme: () => { calls.theme += 1; },
        resize() {}, mount() {},
        unmount: () => { calls.unmount += 1; },
        measure: () => ({ width: 760, height: 900 }),
    };
    const { ExportPreviewModal } = await loadRuntime('src/modules/export/modal.ts', {
        obsidian: { Modal, Notice: class {}, TFile: class {} },
        '../../core/exportStyle': style,
        '../../core/modals': {},
        './decorate': { applyDecorations() {} },
        './layout': layout,
        './logo': { resolveLogo: async () => null },
        './logoImport': { canImportLogo: () => true, importLogoFromDisk: chooseLogo },
        './panel': { buildExportPanel: () => () => {} },
    }, {
        ResizeObserver: class { observe() {} disconnect() {} },
        requestAnimationFrame: (callback) => { frames.set(++serial, callback); return serial; },
        cancelAnimationFrame: (id) => frames.delete(id),
    });
    const initial = { ...style.DEFAULT_EXPORT_STYLE, format: 'png' };
    const modal = new ExportPreviewModal({}, paper, initial, {}, confirm);
    const result = modal.openAndGetValue();
    return { modal, initial, result, frames, calls };
}

test('保存框等待期间修改格式，落盘仍使用提交给保存框的同一份风格', async () => {
    const selected = deferred();
    let submitted;
    const harness = await modalHarness({ confirm: (candidate) => {
        submitted = candidate;
        return selected.promise;
    } });
    const pending = harness.modal.finish({ disabled: false });
    harness.modal.update({ format: 'pdf' });
    selected.resolve(true);
    await pending;

    assert.equal(submitted.format, 'png');
    assert.equal(await harness.result, submitted);
});

test('关闭预览后，迟到的标志选择结果不能重新排帧或改写全局主题', async () => {
    const selected = deferred();
    const harness = await modalHarness({ chooseLogo: () => selected.promise });
    const pending = harness.modal.pickLogo();
    harness.modal.close();
    assert.equal(await harness.result, null);
    const changesAtClose = harness.calls.theme;
    selected.resolve('90-system/导出标志/logo.png');
    await pending;
    await Promise.resolve();

    assert.equal(harness.frames.size, 0);
    assert.equal(harness.calls.theme, changesAtClose);
    assert.equal(harness.modal.value.logo, harness.initial.logo);
});

test('保存框返回前关闭预览，迟到的确认不得再次关闭或触碰已经释放的纸', async () => {
    const selected = deferred();
    const harness = await modalHarness({ confirm: () => selected.promise });
    const pending = harness.modal.finish({ disabled: false });
    harness.modal.close();
    assert.equal(await harness.result, null);
    selected.resolve(true);
    await pending;

    assert.equal(harness.calls.unmount, 1);
});

test('取消系统保存框保留预览与当前风格，下一次确认仍能交付', async () => {
    let attempts = 0;
    const harness = await modalHarness({ confirm: async () => ++attempts === 2 });
    await harness.modal.finish({ disabled: false });
    assert.equal(harness.calls.unmount, 0);

    await harness.modal.finish({ disabled: false });
    assert.equal(await harness.result, harness.initial);
    assert.equal(harness.calls.unmount, 1);
});

test('旧版只有页眉页脚链接的风格升级时仍保持可见，显式关闭继续有效', () => {
    const upgraded = style.normalizeExportStyle({ headerLink: 'edu.example.com', footerLink: 'example.com' });
    assert.equal(upgraded.headerEnabled, true);
    assert.equal(upgraded.footerEnabled, true);
    assert.equal(style.normalizeExportStyle({ headerLink: 'example.com', headerEnabled: false }).headerEnabled, false);
    assert.equal(style.normalizeExportStyle({ headerLink: '   ' }).headerEnabled, false);
});

test('同一插件的导出命令只能有一张活动纸，失败后可以重新执行', async () => {
    const rendering = deferred();
    let calls = 0;
    let command;
    class TFile { extension = 'md'; }
    const { registerExportCommand } = await loadRuntime('src/modules/export/exporter.ts', {
        'dom-to-image-more': {}, jspdf: {},
        obsidian: { TFile, Notice: class {} },
        '../../core/commands': { EXPORT_COMMAND: {} },
        './decorate': {}, './layout': layout, './logo': {}, './modal': {}, './progress': {},
        './paper': { renderPaper: async () => {
            calls += 1;
            await rendering.promise;
            throw new Error('模拟预览失败');
        } },
    });
    registerExportCommand({
        commands: { register: (_definition, callback) => { command = callback; } },
        app: { workspace: { getActiveFile: () => new TFile() } },
    });

    const first = command();
    const repeated = command();
    const simultaneous = calls;
    rendering.resolve();
    await Promise.all([first, repeated]);
    assert.equal(simultaneous, 1);

    await command();
    assert.equal(calls, 2);
});

test('最终清理抛错时命令不产生未处理拒绝，并继续允许下一次导出', async () => {
    let command;
    let released = 0;
    const notices = [];
    class TFile { extension = 'md'; basename = '测试'; }
    const { registerExportCommand } = await loadRuntime('src/modules/export/exporter.ts', {
        'dom-to-image-more': {}, jspdf: {},
        obsidian: { TFile, Notice: class { constructor(message) { notices.push(message); } } },
        '../../core/commands': { EXPORT_COMMAND: {} },
        './decorate': {}, './layout': layout, './logo': {}, './progress': {},
        './modal': { ExportPreviewModal: class { async openAndGetValue() { return null; } } },
        './paper': { renderPaper: async () => ({ release() {
            released += 1;
            throw new Error('组件卸载失败');
        } }) },
    });
    registerExportCommand({
        commands: { register: (_definition, callback) => { command = callback; } },
        app: { workspace: { getActiveFile: () => new TFile() } },
        settings: { exportStyle: style.DEFAULT_EXPORT_STYLE },
    });

    await assert.doesNotReject(() => command());
    await assert.doesNotReject(() => command());
    assert.equal(released, 2);
    assert.equal(notices.filter((message) => message.includes('组件卸载失败')).length, 2);
});

test('点击 A4/A3 预设会修改真实纸张尺寸，切回自由保留已选尺寸', async () => {
    const { buildExportPanel } = await loadRuntime('src/modules/export/panel.ts', {
        '../../core/exportStyle': style,
    });
    const host = new Element();
    let value = { ...style.DEFAULT_EXPORT_STYLE, format: 'pdf', pageMode: 'fixed' };
    const refresh = buildExportPanel(host, {
        value: () => value,
        update: (patch) => { value = { ...value, ...patch }; },
        logoUrl: () => '', logoName: () => '', inheritedColor: () => '#000000',
        pickLogo() {}, clearLogo() {},
    });
    const descendants = (element) => [element, ...element.children.flatMap(descendants)];
    const click = (label) => {
        descendants(host).find((element) => element.textContent === label).listeners.click();
        refresh();
    };

    click('A4');
    assert.equal(layout.pageWidthOf(value), 794);
    assert.equal(layout.pageMinHeightOf(value), 1_123);
    click('A3');
    assert.equal(layout.pageWidthOf(value), 1_123);
    assert.equal(layout.pageMinHeightOf(value), 1_587);
    click('自由');
    assert.equal(value.paperPreset, 'free');
    assert.equal(layout.pageWidthOf(value), 1_123);
    assert.equal(Object.hasOwn(value, 'width'), false);
    assert.equal(Object.hasOwn(value, 'height'), false);
});
