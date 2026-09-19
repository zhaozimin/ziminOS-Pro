/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与 src/modules/calendar/view.ts 事实源；
 *          自带一台按 Obsidian 1.14.2 真实语义复刻的工作区替身（叶子、视图注册台与 ensureSideLeaf）
 * [OUTPUT]: 提供「中国日历在右侧栏只应有一个」的回归：冷启动开一个、热重载不再多一个、
 *           叶子被拖到主编辑区也不被当成第二个日历
 * [POS]: tests 的日历专项。它验的不是日历画得对不对（那归 regression.mjs 的视图成员名一条），
 *        而是**谁负责把这个视图摆进侧栏**：宿主在 view-registered 那一刻会自己还原老叶子，
 *        插件若在同一拍里再问一次「有没有」，得到的是一个正在重建中的假答案
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

// ============================================================
// DOM 替身：只够日历把那几百个格子画出来
// ============================================================

class FakeElement {
    constructor(tag = 'div') {
        this.tag = tag;
        this.children = [];
        this.classes = new Set();
        this.text = '';
        this.attrs = {};
        this.listeners = {};
    }

    #child(tag, options = {}) {
        const child = new FakeElement(tag);

        if (options.cls) for (const cls of String(options.cls).split(/\s+/)) child.classes.add(cls);
        if (options.text !== undefined) child.text = String(options.text);
        if (options.attr) Object.assign(child.attrs, options.attr);
        this.children.push(child);

        return child;
    }

    createEl(tag, options) {
        return this.#child(tag, options);
    }

    createDiv(options) {
        return this.#child('div', options);
    }

    createSpan(options) {
        return this.#child('span', options);
    }

    addClass(cls) {
        this.classes.add(cls);
    }

    removeClass(cls) {
        this.classes.delete(cls);
    }

    toggleClass(cls, on) {
        const names = Array.isArray(cls) ? cls : [cls];

        for (const name of names) {
            if (on) this.classes.add(name);
            else this.classes.delete(name);
        }
    }

    setText(text) {
        this.text = String(text);
    }

    setAttribute(name, value) {
        this.attrs[name] = String(value);
    }

    empty() {
        this.children = [];
        this.text = '';
    }

    addEventListener(type, listener) {
        this.listeners[type] = listener;
    }
}

// ============================================================
// Obsidian 替身
//
// 三段语义逐字照抄 1.14.2 的 app.js，它们合起来正是这个缺陷的成因：
//   1. Plugin.registerView 的卸载钩子只在**用户主动停用**时 detach 叶子，
//      插件重载（更新 / plugin:reload）留着老叶子；
//   2. viewRegistry 的 view-registered / view-unregistered 都会把老叶子
//      先 open 成空视图、再异步 setViewState 还原——同步那一半先发生；
//   3. onLayoutReady 在布局已就绪时是**同步**回调。
// ============================================================

class EmptyView {
    constructor(leaf) {
        this.leaf = leaf;
    }

    getViewType() {
        return 'empty';
    }

    getState() {
        return {};
    }

    async open() {}

    async close() {}
}

/** 宿主在「视图类型没人认领」时摆出来的那块墓碑，它仍然报出原来的类型 */
class UnknownView extends EmptyView {
    constructor(leaf, type) {
        super(leaf);
        this.viewType = type;
        this.state = {};
    }

    getViewType() {
        return this.viewType;
    }

    getState() {
        return this.state;
    }

    async setState(state) {
        this.state = state;
    }
}

class Leaf {
    constructor(workspace, root) {
        this.workspace = workspace;
        this.root = root;
        this.working = false;
        this.containerEl = new FakeElement();
        this._empty = new EmptyView(this);
        this.view = this._empty;
    }

    getRoot() {
        return this.root;
    }

    getViewState() {
        return { type: this.view.getViewType(), state: this.view.getState?.() ?? {} };
    }

    /** WorkspaceLeaf.prototype.open：老视图是空视图族时**不等**它关完，this.view 当场就换 */
    async open(view) {
        const previous = this.view;

        if (previous === view) return view;

        if (previous) {
            const closing = previous.close?.();

            if (!(previous instanceof EmptyView)) await closing;
        }

        this.view = view ?? this._empty;
        await this.view.open?.(this.containerEl);

        return this.view;
    }

    async setViewState(state) {
        if (this.working) return;
        this.working = true;

        try {
            if (state.type !== this.view.getViewType()) {
                const factory = this.workspace.viewByType.get(state.type);
                const next = factory
                    ? factory(this)
                    : state.type && state.type !== 'empty'
                      ? new UnknownView(this, state.type)
                      : this._empty;

                await this.open(next);
            }

            await this.view.setState?.(state.state ?? {}, {});
        } finally {
            this.working = false;
        }
    }

    async loadIfDeferred() {}

    detach() {
        this.root.children = this.root.children.filter((leaf) => leaf !== this);
        void this.view.close?.();
        this.view = this._empty;
    }
}

class Workspace {
    constructor(app) {
        this.app = app;
        this.rootSplit = { children: [] };
        this.leftSplit = { children: [] };
        this.rightSplit = { children: [] };
        this.viewByType = new Map();
        this.onLayoutReadyCallbacks = [];
        this.revealed = [];
    }

    // ---------- 视图注册台 ----------

    registerViewType(type, factory) {
        if (this.viewByType.has(type)) throw new Error(`duplicate view type ${type}`);
        this.viewByType.set(type, factory);
        this.#rebuildLeavesOfType(type);
    }

    unregisterViewType(type) {
        if (this.viewByType.delete(type)) this.#rebuildLeavesOfType(type);
    }

    /** 宿主对 view-registered / view-unregistered 的同一段响应：先清空，再异步还原 */
    #rebuildLeavesOfType(type) {
        for (const leaf of this.getLeavesOfType(type)) {
            const state = leaf.getViewState();

            void (async () => {
                await leaf.open(new EmptyView(leaf));
                await leaf.setViewState(state);
            })();
        }
    }

    // ---------- 叶子 ----------

    iterateAllLeaves(callback) {
        for (const split of [this.rootSplit, this.leftSplit, this.rightSplit]) {
            for (const leaf of [...split.children]) callback(leaf);
        }
    }

    getLeavesOfType(type) {
        const found = [];

        this.iterateAllLeaves((leaf) => {
            if (leaf.view.getViewType() === type) found.push(leaf);
        });

        return found;
    }

    detachLeavesOfType(type) {
        for (const leaf of this.getLeavesOfType(type)) leaf.detach();
    }

    getRightLeaf() {
        const leaf = new Leaf(this, this.rightSplit);

        this.rightSplit.children.push(leaf);

        return leaf;
    }

    getLeftLeaf() {
        const leaf = new Leaf(this, this.leftSplit);

        this.leftSplit.children.push(leaf);

        return leaf;
    }

    /** 主编辑区新开一个页签，用来模拟用户把日历拖出侧栏 */
    openRootLeaf() {
        const leaf = new Leaf(this, this.rootSplit);

        this.rootSplit.children.push(leaf);

        return leaf;
    }

    async revealLeaf(leaf) {
        this.revealed.push(leaf);
    }

    setActiveLeaf(leaf) {
        this.activeLeaf = leaf;
    }

    onLayoutReady(callback) {
        if (this.onLayoutReadyCallbacks === null) callback();
        else this.onLayoutReadyCallbacks.push(callback);
    }

    finishLayout() {
        const callbacks = this.onLayoutReadyCallbacks ?? [];

        this.onLayoutReadyCallbacks = null;
        for (const callback of callbacks) callback();
    }

    /** Workspace.prototype.ensureSideLeaf，逐句照抄 */
    async ensureSideLeaf(type, side, options = {}) {
        const { active, split, reveal = true, state } = options;
        const existing = this.getLeavesOfType(type);
        const leaf =
            existing.length === 0
                ? side === 'left'
                    ? this.getLeftLeaf(split)
                    : this.getRightLeaf(split)
                : existing[0];

        if (active || reveal) await leaf.loadIfDeferred();
        if (state || leaf.view.getViewType() !== type) await leaf.setViewState({ type, state });
        if (reveal) await this.revealLeaf(leaf);
        if (active) this.setActiveLeaf(leaf, { focus: true });

        return leaf;
    }
}

class FakePlugin {
    constructor(app) {
        this.app = app;
        this.manifest = { id: 'ziminos' };
        this.unloaders = [];
        this._userDisabled = false;
    }

    register(fn) {
        this.unloaders.push(fn);
    }

    registerView(type, factory) {
        this.app.workspace.registerViewType(type, factory);
        this.register(() => {
            this.app.workspace.unregisterViewType(type);
            if (this._userDisabled) this.app.workspace.detachLeavesOfType(type);
        });
    }

    addCommand() {}

    registerEvent() {}

    unload() {
        for (const fn of this.unloaders.splice(0).reverse()) fn();
    }
}

function makeApp() {
    const app = {
        vault: {
            configDir: '.obsidian',
            adapter: {
                async exists() {
                    return false;
                },
                async read() {
                    return '{}';
                },
                async write() {},
            },
            on: () => ({}),
        },
    };

    app.workspace = new Workspace(app);

    return app;
}

function makeContext(app, plugin) {
    return {
        app,
        plugin,
        settings: {},
        saveSettings: async () => {},
        guard: { mark: () => {}, isSelf: () => false },
        commands: { register: () => {} },
        edition: { edition: 'free' },
    };
}

// ============================================================
// 事实源
// ============================================================

const obsidianStub = `
    export class TFile {}
    export class ItemView {
        constructor(leaf) {
            this.leaf = leaf;
            this.app = leaf.workspace.app;
            this.containerEl = leaf.containerEl;
            this.contentEl = { ...leaf.containerEl, __el: null };
            this.contentEl = globalThis.__ziminosMakeEl();
            this.events = [];
        }
        registerEvent(ref) { this.events.push(ref); }
        async open() { await this.onOpen?.(); }
        async close() { await this.onClose?.(); }
        getViewType() { return 'view'; }
        getState() { return {}; }
        async setState() {}
    }
    export async function requestUrl() { return { status: 500, text: '' }; }
`;

async function loadCalendar() {
    const result = await build({
        entryPoints: [`${ROOT}src/modules/calendar/view.ts`],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
                        contents: obsidianStub,
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    return import(
        `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
    );
}

globalThis.window = globalThis;
globalThis.__ziminosMakeEl = () => new FakeElement();

const { registerCalendar, CALENDAR_VIEW_TYPE } = await loadCalendar();

/** 让所有排队中的微任务跑完——宿主那笔「还原老叶子」就藏在里面 */
async function settle() {
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

function install(app) {
    const plugin = new FakePlugin(app);

    registerCalendar(
        makeContext(app, plugin),
        async () => {},
        () => false,
    );

    return plugin;
}

function calendarLeaves(app) {
    return app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
}

// ============================================================
// 回归
// ============================================================

test('冷启动在右侧栏摆出唯一一个中国日历', async () => {
    const app = makeApp();

    install(app);
    app.workspace.finishLayout();
    await settle();

    assert.equal(calendarLeaves(app).length, 1);
    assert.equal(calendarLeaves(app)[0].getRoot(), app.workspace.rightSplit);
});

test('插件热重载后仍然只有一个中国日历', async () => {
    const app = makeApp();
    let plugin = install(app);

    app.workspace.finishLayout();
    await settle();

    // 插件更新走的是 disablePlugin + enablePlugin，_userDisabled 为假：
    // 宿主留着老叶子，并在重新注册的那一刻自己把它还原成日历。
    for (let round = 0; round < 3; round += 1) {
        plugin.unload();
        await settle();
        plugin = install(app);
        await settle();

        assert.equal(
            calendarLeaves(app).length,
            1,
            `第 ${round + 1} 次热重载之后多出了日历标签页`,
        );
    }
});

test('用户把日历拖进主编辑区后，重载不会在侧栏再开一个', async () => {
    const app = makeApp();
    let plugin = install(app);

    app.workspace.finishLayout();
    await settle();

    // 搬家：把那一个日历叶子从右侧栏移到主编辑区
    const leaf = calendarLeaves(app)[0];

    app.workspace.rightSplit.children = app.workspace.rightSplit.children.filter(
        (item) => item !== leaf,
    );
    leaf.root = app.workspace.rootSplit;
    app.workspace.rootSplit.children.push(leaf);

    plugin.unload();
    await settle();
    plugin = install(app);
    await settle();

    assert.equal(calendarLeaves(app).length, 1);
    assert.equal(calendarLeaves(app)[0].getRoot(), app.workspace.rootSplit);
});
