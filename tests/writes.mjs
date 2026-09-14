/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url、esbuild 与 moment，直接编译 updatedMaintainer、formatter、
 *          core/markdownStyle 事实源，并以一台最小的 Obsidian 替身按真机顺序喂事件
 * [OUTPUT]: 验证两个常驻编辑监听的后台写入——正开着的那一篇不写、走开（切走或关掉）才补、
 *           改名之后那笔账跟着新路径走、退出之后下次启动补上且不拿旧时间盖掉别处的新修改、
 *           updated 记的是最后一次改完的时刻，以及自写守卫只登记机器的反应
 * [POS]: tests 的后台写入专项。它验的是「有没有写盘、写到哪一篇、写了什么值」而不是源码里有没有那几个字——
 *        这一类错在源码里长得完全正常，只在事件的先后顺序里现形
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import moment from 'moment';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 替身只回答被测代码真正问的那几个问题：这是不是一个文件、这个分栏是不是 Markdown 视图。
 * 文件夹没有 extension，于是 instanceof TFile 对它为假，与真机一致。
 */
const OBSIDIAN_STUB = `
import moment from 'moment';
export { moment };
export class TFile {
    static [Symbol.hasInstance](value) {
        return typeof value === 'object' && value !== null && typeof value.extension === 'string';
    }
}
export class MarkdownView {
    static [Symbol.hasInstance](value) {
        return typeof value === 'object' && value !== null && value.kind === 'markdown';
    }
}
export class Notice {}
`;

async function load(relativePath) {
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-test-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: OBSIDIAN_STUB,
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

const { registerUpdatedMaintainer } = await load('src/modules/projects/updatedMaintainer.ts');
const { registerFormatter } = await load('src/modules/format/formatter.ts');
const { DEFAULT_FORMAT_RULES, formatMarkdown } = await load('src/core/markdownStyle.ts');

const FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** 一个时刻按设置格式写出来的样子，也就是 updated 该落下的那个值 */
const stampOf = (millis) => moment(millis).format(FORMAT);

/** 让排在微任务与 I/O 回调上的落盘链全部走完 */
async function drain() {
    for (let round = 0; round < 4; round += 1) {
        await new Promise((resolve) => setImmediate(resolve));
    }
}

// ============================================================
// 一台 Obsidian 替身
// ============================================================

/**
 * 一台装着一本库的 Obsidian。
 *
 * 库（文件、磁盘上的修改时间、本机 localStorage）跨重启存活；工作区（开着哪几个标签页、事件订阅、
 * 在途计时器、自写登记）随退出一起清空——与真机退出再打开是同一种边界。
 * 时钟是假的，所以「过了两秒」「读了一个小时」「第二天再打开」都能精确表达，
 * 而 updated 该写成什么值也因此可以逐字断言。
 */
function createObsidian(initial) {
    let clock = Date.parse('2026-09-13T10:00:00');
    const files = new Map();
    /** 文件对象 → 它的 YAML 与正文；以对象为键，改名之后自然跟着走 */
    const notes = new Map();
    const storage = new Map();
    const writes = [];
    /** 插件写盘的那一刻，哪几篇的编辑器还捏着未保存的改动——真机上每一条都是一次「已被外部修改」合并弹窗 */
    const conflicts = [];
    /** 编辑器里敲了、但 Obsidian 还没存盘的笔记 */
    const unsaved = new Set();
    /** 每一篇最后一次由编辑器存盘的时刻 */
    const savedAt = new Map();
    let handlers = {};
    let timers = new Map();
    let nextTimerId = 1;
    let unloaders = [];
    let marks = new Set();
    let tabs = [];
    let activePath = null;

    for (const [notePath, spec] of Object.entries(initial)) {
        const file = { path: notePath, extension: 'md', stat: { mtime: clock } };

        files.set(notePath, file);
        notes.set(file, {
            frontmatter: spec.frontmatter === undefined ? { updated: 'old' } : spec.frontmatter,
            content: spec.content ?? '',
        });
    }

    const fire = (name, ...args) => {
        for (const handler of [...(handlers[name] ?? [])]) handler(...args);
    };

    const on = (name, handler) => {
        (handlers[name] ??= []).push(handler);

        return { name, handler };
    };

    /** 磁盘上这一篇变了：修改时间前进，Obsidian 发出 modify——与真机一样，先改 stat 再发事件 */
    const touch = (file) => {
        clock += 1000;
        file.stat.mtime = clock;
        fire('modify', file);
    };

    /** 编辑器把手里的字存盘 */
    const saveFromEditor = (file) => {
        unsaved.delete(file.path);
        clock += 1000;
        file.stat.mtime = clock;
        savedAt.set(file.path, clock);
        fire('modify', file);
    };

    /** 插件写盘：先看有没有编辑器还捏着这一篇的未保存改动 */
    const writeFromPlugin = (file) => {
        if (unsaved.has(file.path)) conflicts.push(file.path);

        touch(file);
    };

    globalThis.window = {
        setTimeout(callback) {
            const id = nextTimerId++;

            timers.set(id, callback);

            return id;
        },
        clearTimeout(id) {
            timers.delete(id);
        },
        requestAnimationFrame(callback) {
            callback(0);

            return 0;
        },
    };

    const leafOf = (notePath) => ({
        view: {
            kind: 'markdown',
            file: files.get(notePath) ?? null,
            getMode: () => 'source',
            currentMode: { getScroll: () => 0, applyScroll: () => {} },
            // 与真机一致：内容没变就什么都不写
            save: async () => {
                if (unsaved.has(notePath)) saveFromEditor(files.get(notePath));
            },
        },
    });

    const ctx = {
        settings: {
            autoUpdated: true,
            autoFormat: true,
            formatRules: DEFAULT_FORMAT_RULES,
            dateTimeFormat: FORMAT,
        },
        guard: {
            mark: (notePath) => marks.add(notePath),
            isRecent: (notePath) => marks.has(notePath),
        },
        plugin: {
            register: (callback) => unloaders.push(callback),
            registerEvent: () => {},
        },
        commands: { register: () => {} },
        app: {
            vault: {
                on,
                getAbstractFileByPath: (notePath) => files.get(notePath) ?? null,
                cachedRead: async (file) => notes.get(file).content,
                process: async (file, transform) => {
                    const note = notes.get(file);
                    const next = transform(note.content);

                    if (next === note.content) return next;

                    note.content = next;
                    writes.push({ path: file.path, content: next });
                    writeFromPlugin(file);

                    return next;
                },
            },
            workspace: {
                onLayoutReady: (callback) => callback(),
                getActiveFile: () => files.get(activePath) ?? null,
                iterateAllLeaves: (visit) => {
                    for (const notePath of tabs) visit(leafOf(notePath));
                },
                on,
            },
            metadataCache: {
                getFileCache: (file) => {
                    const note = notes.get(file);

                    return note ? { frontmatter: note.frontmatter ?? undefined } : null;
                },
            },
            fileManager: {
                processFrontMatter: async (file, mutate) => {
                    const note = notes.get(file);

                    note.frontmatter ??= {};
                    mutate(note.frontmatter);
                    writes.push({ path: file.path, value: note.frontmatter.updated });
                    writeFromPlugin(file);
                },
            },
            loadLocalStorage: (key) => (storage.has(key) ? JSON.parse(storage.get(key)) : null),
            saveLocalStorage: (key, data) => {
                if (data === null) storage.delete(key);
                else storage.set(key, JSON.stringify(data));
            },
        },
    };

    return {
        ctx,
        writes,
        conflicts,

        writtenPaths: () => writes.map((write) => write.path),
        /** 这一篇最后一次由编辑器存盘的时刻，也就是 updated 该记下的那一刻 */
        lastSaveOf: (notePath) => savedAt.get(notePath),

        /** 打开 Obsidian，工作区恢复出这几个标签页；插件的注册由测试自己调用 */
        launch({ open = [], active = open.at(-1) ?? null, hoursLater = 0 } = {}) {
            clock += hoursLater * 60 * 60 * 1000;
            tabs = [...open];
            activePath = active;
        },

        /** 退出：Obsidian 先把编辑器手里的字存盘，再卸载插件；订阅与计时器清空，库和 localStorage 留着 */
        quit() {
            for (const notePath of [...unsaved]) saveFromEditor(files.get(notePath));
            for (const unload of unloaders) unload();

            handlers = {};
            timers = new Map();
            unloaders = [];
            marks = new Set();
            tabs = [];
            activePath = null;
        },

        /** 用户在编辑器里敲了字，Obsidian 把它存盘 */
        type(notePath) {
            saveFromEditor(files.get(notePath));
        },

        /** 用户刚敲下几个字，Obsidian 的两秒存盘还没到 */
        typeWithoutSaving(notePath) {
            unsaved.add(notePath);
        },

        /** 在当前标签页里换一篇：同一个分栏换文件只走 file-open */
        openHere(notePath) {
            const index = tabs.indexOf(activePath);

            if (index === -1) tabs.push(notePath);
            else tabs[index] = notePath;

            activePath = notePath;
            fire('file-open', files.get(notePath));
        },

        /** 新开一个标签页：换面板走 active-leaf-change，随后 file-open */
        openInNewTab(notePath) {
            tabs.push(notePath);
            activePath = notePath;
            fire('active-leaf-change');
            fire('file-open', files.get(notePath));
        },

        /** 点回一个已经开着的标签页 */
        activate(notePath) {
            activePath = notePath;
            fire('active-leaf-change');
        },

        /** 点右侧栏的日历、文件树这类非 FileView：活动文件仍报最近那一篇 */
        focusSidebar() {
            fire('active-leaf-change');
        },

        /** 关掉全部标签页：活动文件仍报刚关掉的那一篇（官方语义：最近活动过的文件） */
        closeAllTabs() {
            tabs = [];
            fire('active-leaf-change');
        },

        /** 行内标题改名、拖进别的文件夹：同一个文件对象换了路径 */
        rename(oldPath, newPath) {
            const file = files.get(oldPath);

            files.delete(oldPath);
            file.path = newPath;
            files.set(newPath, file);

            if (savedAt.has(oldPath)) savedAt.set(newPath, savedAt.get(oldPath));
            if (unsaved.delete(oldPath)) unsaved.add(newPath);

            tabs = tabs.map((notePath) => (notePath === oldPath ? newPath : notePath));
            if (activePath === oldPath) activePath = newPath;
            fire('rename', file, oldPath);
        },

        /** Obsidian 关着的时候，别的设备或别的程序改了这一篇 */
        editElsewhere(notePath, updated) {
            const file = files.get(notePath);

            clock += 1000;
            file.stat.mtime = clock;
            notes.get(file).frontmatter.updated = updated;
        },

        /** 时间过去：自写登记过期，到点的防抖计划执行，落盘链走完 */
        async later(ms = 2500) {
            marks = new Set();
            clock += ms;

            const due = [...timers.values()];

            timers = new Map();

            for (const callback of due) callback();

            await drain();
        },
    };
}

// ============================================================
// updated 记账
// ============================================================

/*
 * 用户正开着的那一篇，绝不写盘。
 *
 * 这条回归是真机报上来的（v0.33.0）：在一篇满是远端图片的笔记里打字，每隔几秒 Obsidian 就弹
 * 「已被外部修改，正在自动合并更改」，然后视口跳到同一张图上。modify 事件来自 Obsidian 自己的保存
 * 而不是用户停手，两秒后那一笔 updated 正好落在一个还有未保存改动的编辑器上，合并会把整个文档重新灌回去。
 */
test('updated 记账绝不落在用户正开着的那一篇上，等他走开才补', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'C.md': {} });

    obsidian.launch({ open: ['A.md'] });
    registerUpdatedMaintainer(obsidian.ctx);

    // 1. 用户在 A 里打字：Obsidian 保存了好几次，一次都不许落到 A 上
    obsidian.type('A.md');
    await obsidian.later();
    obsidian.type('A.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), [], '正开着的那一篇被写盘了，真机上这就是那个合并弹窗');

    // 2. 没开着的那一篇照旧走防抖，背景写入这条路不能被这次修复顺手掐掉
    obsidian.type('C.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['C.md']);

    // 3. 点右侧栏的日历这类非 FileView：用户并没有离开那一篇
    obsidian.focusSidebar();
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['C.md'], '点侧边栏被误当成走开了');

    // 4. 用户切去 C：刚离开的 A 这时候才记账，且只记一次
    obsidian.openInNewTab('C.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['C.md', 'A.md']);

    // 5. 再切回来不该凭空多一笔——债已经还过了
    obsidian.activate('A.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['C.md', 'A.md']);

    /*
     * 6. 关掉这篇笔记也算走开。
     *
     * 关掉最后一个标签页时 active-leaf-change 照样触发，可 getActiveFile() 仍报刚关掉的那一篇——
     * 它是「最近活动过的文件」。只问活动文件的话，这一笔会一直等到下一次开笔记才补。
     */
    obsidian.type('A.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['C.md', 'A.md'], '打字期间又写了一次');

    obsidian.closeAllTabs();
    await obsidian.later();

    assert.deepEqual(
        obsidian.writtenPaths(),
        ['C.md', 'A.md', 'A.md'],
        '关掉标签页之后那一笔没补上——「开着」与「最近活动过」被当成了一件事',
    );
    assert.deepEqual(obsidian.conflicts, []);
});

/*
 * 分栏并排：在左栏敲完最后几个字，Obsidian 两秒一次的存盘还没到，就点进了右栏。
 * 左栏已不在眼前，却还捏着没存盘的字——判据是「写盘那一刻编辑器手里有没有未保存的改动」，
 * 不是「焦点在不在」。那一刻直接写盘，Obsidian 照样弹「已被外部修改」并三方合并。
 */
test('刚离开的分栏还捏着没存盘的字：先让它存盘，再补记', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'B.md': {} });

    obsidian.launch({ open: ['A.md', 'B.md'], active: 'A.md' });
    registerUpdatedMaintainer(obsidian.ctx);

    obsidian.type('A.md');
    await obsidian.later();
    obsidian.typeWithoutSaving('A.md');
    obsidian.activate('B.md');
    await obsidian.later();

    assert.deepEqual(obsidian.conflicts, [], '写盘时左栏还捏着未保存的改动，真机上这就是那个合并弹窗');
    assert.deepEqual(
        obsidian.writes,
        [{ path: 'A.md', value: stampOf(obsidian.lastSaveOf('A.md')) }],
        '补记的应当是左栏最后存下的那几个字的时刻',
    );
});

/*
 * 新建一篇笔记最常见的走法：先在「未命名」里敲几个字，再在行内标题里改名，接着写正文。
 * 在途的账若按旧路径记着，走开时去找旧路径，找不到就静默放弃——新路径上的那一篇永远等不到记账。
 */
test('改名或挪走之后，那笔账跟着新路径走', async () => {
    const obsidian = createObsidian({ '未命名.md': {}, 'C.md': {}, 'X.md': {} });

    obsidian.launch({ open: ['未命名.md'] });
    registerUpdatedMaintainer(obsidian.ctx);

    obsidian.type('未命名.md');
    await obsidian.later();
    obsidian.rename('未命名.md', '读书方法.md');
    obsidian.type('读书方法.md');
    await obsidian.later();

    const lastEdit = obsidian.lastSaveOf('读书方法.md');

    obsidian.openHere('C.md');
    await obsidian.later();

    assert.deepEqual(
        obsidian.writes,
        [{ path: '读书方法.md', value: stampOf(lastEdit) }],
        '改名之后走开，那一笔去找了旧路径，新路径上一个字没写',
    );

    // 没开着的那一篇排着防抖时被拖进别的文件夹：计划跟着搬，不落空
    obsidian.type('X.md');
    obsidian.rename('X.md', '归档/X.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['读书方法.md', '归档/X.md']);
});

/*
 * updated 说的是「这一篇最后一次被改是什么时候」。
 * 改完之后在同一篇上读了一个小时再切走，那一小时里这篇笔记一个字都没变——记成切走的时刻就是记错了。
 * 这一条也是下面「退出之后补记」能成立的前提：补记可以晚，记下的值不能跟着晚。
 */
test('updated 记的是最后一次改完的时刻，不是走开的时刻', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'B.md': {} });

    obsidian.launch({ open: ['A.md'] });
    registerUpdatedMaintainer(obsidian.ctx);

    obsidian.type('A.md');
    await obsidian.later();

    const lastEdit = obsidian.lastSaveOf('A.md');

    await obsidian.later(60 * 60 * 1000);
    obsidian.openHere('B.md');
    await obsidian.later();

    assert.deepEqual(
        obsidian.writes,
        [{ path: 'A.md', value: stampOf(lastEdit) }],
        '记下的是切走那一刻，而不是改完的那一刻',
    );
});

/*
 * 在一篇笔记里写完直接退出 Obsidian，中途一次都没切走——这是最常见的收工方式，
 * 而 v0.33.0 把这一程的 updated 明写成了可以接受的损失。欠账只活在内存里，退出就没了。
 */
test('退出时还没走开的那一笔，下次启动补上，记的仍是改完的那一刻', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'B.md': {} });

    obsidian.launch({ open: ['A.md'] });
    registerUpdatedMaintainer(obsidian.ctx);
    obsidian.type('A.md');
    await obsidian.later();

    const lastEdit = obsidian.lastSaveOf('A.md');

    obsidian.quit();

    // 第二天打开，工作区恢复出上次那一篇：它就在眼前，照旧不写
    obsidian.launch({ open: ['A.md'], hoursLater: 20 });
    registerUpdatedMaintainer(obsidian.ctx);
    await obsidian.later();

    assert.deepEqual(obsidian.writes, [], '启动时恢复出来的那一篇就在眼前，却被写盘了');

    obsidian.openHere('B.md');
    await obsidian.later();

    assert.deepEqual(
        obsidian.writes,
        [{ path: 'A.md', value: stampOf(lastEdit) }],
        '退出前那一笔丢了，或者被记成了第二天打开的时刻',
    );
});

test('上次退出时欠下的账，那一篇不在眼前就启动即补', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'B.md': {} });

    obsidian.launch({ open: ['A.md'] });
    registerUpdatedMaintainer(obsidian.ctx);
    obsidian.type('A.md');
    await obsidian.later();

    const lastEdit = obsidian.lastSaveOf('A.md');

    obsidian.quit();
    obsidian.launch({ open: ['B.md'], hoursLater: 20 });
    registerUpdatedMaintainer(obsidian.ctx);
    await obsidian.later();

    assert.deepEqual(obsidian.writes, [{ path: 'A.md', value: stampOf(lastEdit) }]);
});

/*
 * 补记有一个前提：磁盘上的那一篇还是用户离开时的样子。
 * Obsidian 关着的这段时间里，别的设备同步过来一版、或者别的程序改过它，这笔旧账就不再成立——
 * 拿旧时间盖上去，等于让一篇刚被改过的笔记的 updated 倒退回去。
 */
test('启动时那一篇已被别处改过，旧账作废，不拿旧时间盖掉新的', async () => {
    const obsidian = createObsidian({ 'A.md': {}, 'B.md': {} });

    obsidian.launch({ open: ['A.md'] });
    registerUpdatedMaintainer(obsidian.ctx);
    obsidian.type('A.md');
    await obsidian.later();
    obsidian.quit();

    obsidian.editElsewhere('A.md', '2026-09-14 08:00:00');
    obsidian.launch({ open: ['B.md'], hoursLater: 20 });
    registerUpdatedMaintainer(obsidian.ctx);
    await obsidian.later();

    assert.deepEqual(obsidian.writes, [], '别处的新修改被一笔旧账盖掉了');
});

// ============================================================
// 自动排版
// ============================================================

/*
 * 排版与 updated 守的是同一条边界，而那条边界曾经被修过一半：v0.33.0 给 updated 下了「开在眼前」的定义，
 * 排版还在问「最近活动过的是哪一篇」，于是关掉标签页之后它一直等到下一次开笔记才整理；改名也同样丢账。
 */
test('自动排版同样认「关掉标签页也算走开」，改名之后跟着新路径走', async () => {
    const messy = '# 标题\n正文\n';

    assert.notEqual(formatMarkdown(messy, DEFAULT_FORMAT_RULES), messy, '测试前提：这段内容需要被整理');

    const obsidian = createObsidian({
        'A.md': { content: messy },
        'B.md': { content: messy },
        'C.md': { content: '' },
    });

    obsidian.launch({ open: ['A.md'] });
    registerFormatter(obsidian.ctx);

    obsidian.type('A.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), [], '正开着的那一篇被整理了');

    obsidian.closeAllTabs();
    await obsidian.later();

    assert.deepEqual(
        obsidian.writtenPaths(),
        ['A.md'],
        '关掉标签页之后没有整理——排版还在拿「最近活动过」当「开着」',
    );

    obsidian.openInNewTab('B.md');
    obsidian.type('B.md');
    await obsidian.later();
    obsidian.rename('B.md', 'B2.md');
    obsidian.openHere('C.md');
    await obsidian.later();

    assert.deepEqual(obsidian.writtenPaths(), ['A.md', 'B2.md'], '改名之后走开，排版去找了旧路径');
});

// ============================================================
// 自写守卫
// ============================================================

/*
 * 自写守卫的唯一读者是那些「对变化作出反应」的监听者，而 updated 记账是其中之一：被登记过的写入不记账。
 * 于是登记与否就是一个语义决定——这一笔是机器的反应，还是替人落下的笔。
 *
 * 替人落笔的写入（记人情、记付费、记收款、记灵感、勾掉一条待办、导入划线、定主题）改的是用户自己的笔记，
 * 规格的验收清单写着「记一笔人情之后那篇日记的 updated 两秒内更新」，而它们一登记，这一条就不可能成立。
 * 所以清单反过来列：每一处登记都必须说清它是哪一种机器反应，新增一处而不归类，这条就红。
 */
test('自写守卫只登记机器的反应，替人落笔的写入不登记', () => {
    const MACHINE_REACTIONS = {
        'src/modules/projects/updatedMaintainer.ts': 1, // updated 自己落笔：不登记就会自激成环
        'src/modules/format/formatter.ts': 1, // 排版是整理写法，不是改内容
        'src/modules/projects/cardInit.ts': 1, // 卡片出生字段
        'src/modules/projects/createContainer.ts': 1, // 容器 MOC 带着完整 YAML 出生
        'src/modules/projects/transitions.ts': 6, // 整棵子树搬家，Obsidian 随即逐篇改写双链
        'src/modules/projects/migrateBases.ts': 2, // 存量 Bases 迁移
        'src/modules/contacts/client.ts': 2, // 客户档案出生、存量档案补答疑块
        'src/modules/contacts/createContact.ts': 1, // 人脉档案出生
        'src/modules/setup/init.ts': 1, // 开荒骨架
        'src/modules/books/extractCard.ts': 1, // 摘录卡片带着完整 YAML 出生
        'src/modules/review/periodic.ts': 4, // 周期笔记出生、空笔记套骨架、归位搬家
        'src/modules/inspiration/capture.ts': 1, // 灵感集第一次出生
        'src/modules/eternal/export.ts': 1, // 出库单是插件自己的账
    };

    const actual = {};

    const walk = (directory) => {
        for (const name of readdirSync(directory)) {
            const full = path.join(directory, name);

            if (statSync(full).isDirectory()) {
                walk(full);
                continue;
            }

            if (!name.endsWith('.ts')) continue;

            const count = (readFileSync(full, 'utf8').match(/\bguard\.mark\(/g) ?? []).length;

            if (count > 0) actual[path.relative(ROOT, full).split(path.sep).join('/')] = count;
        }
    };

    walk(path.join(ROOT, 'src'));

    assert.deepEqual(actual, MACHINE_REACTIONS);
});
