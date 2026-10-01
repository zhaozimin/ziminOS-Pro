/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与 core/editDebts 的生产调度器，用可控事件、时钟与本机存储重放欠账
 * [OUTPUT]: 验证跨组历史保留、同组归并、跨重启恢复、写入失败保留与部分提交后的幂等续写
 * [POS]: tests 的历史欠账专项；不复制日记业务，只验证公共调度契约中的持久事实队列
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
    entryPoints: [ROOT + 'src/core/editDebts.ts'], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
    plugins: [{ name: 'obsidian', setup(builder) {
        builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: `
            export class TFile { static [Symbol.hasInstance](value) { return value?.kind === 'file'; } }
            export class MarkdownView { static [Symbol.hasInstance](value) { return value?.kind === 'markdown'; } }
        ` }));
    } }],
});
const { registerEditDebts } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const day = time => Math.floor(time / 86400000).toString();
async function flush() { for (let i = 0; i < 8; i++) await new Promise(setImmediate); }

function fixture(storage = new Map()) {
    const file = { kind: 'file', path: '01-projects/卡片.md', stat: { mtime: 100 } };
    const handlers = new Map();
    const timers = new Map();
    let nextTimer = 0;
    let inFront = true;
    const ctx = {
        plugin: { register() {}, registerEvent() {} },
        app: {
            loadLocalStorage: key => storage.get(key) ?? null,
            saveLocalStorage: (key, value) => value === null ? storage.delete(key) : storage.set(key, structuredClone(value)),
            vault: {
                getAbstractFileByPath: path => path === file.path ? file : null,
                on: (name, callback) => handlers.set(name, callback),
            },
            workspace: {
                onLayoutReady: callback => callback(),
                on: (name, callback) => handlers.set(name, callback),
                getActiveFile: () => inFront ? file : null,
                iterateAllLeaves: visit => { if (inFront) visit({ view: { kind: 'markdown', file } }); },
            },
        },
    };
    globalThis.window = { setTimeout: callback => { const id = ++nextTimer; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id) };
    return {
        ctx, file, storage,
        async leave() { inFront = false; handlers.get('file-open')?.(); await flush(); },
        async runTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); await flush(); },
    };
}

test('持续开着跨过午夜：同日归并最后时刻，前一天的欠账仍会结算', async () => {
    const f = fixture();
    const settled = [];
    const debts = registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async (_, time) => { settled.push(time); return true; } });
    for (const time of [100, 200, 86400000 + 300]) { f.file.stat.mtime = time; debts.record(f.file); }
    await f.leave();
    assert.deepEqual(settled, [200, 86400000 + 300]);
    assert.equal(f.storage.has('history'), false);
});

test('历史欠账重启后即使源文件已被机器改过，事发日事实仍能补记', async () => {
    const f = fixture(new Map([['history', { '01-projects/卡片.md': [100, 86400000 + 300] }]]));
    const settled = [];
    f.file.stat.mtime = 90000000;
    registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async (_, time) => { settled.push(time); return true; } });
    await f.leave();
    assert.deepEqual(settled, [100, 86400000 + 300]);
});

test('日记写入异常保留欠账，下一次离开再写成功后才撤销', async () => {
    const f = fixture();
    let failed = true;
    const debts = registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async () => { if (failed) throw new Error('磁盘暂不可写'); return true; } });
    debts.record(f.file);
    await f.leave();
    assert.ok(f.storage.has('history'));
    failed = false;
    await f.leave();
    assert.equal(f.storage.has('history'), false);
});

test('前一日已提交而后一日目标仍在前台，只保留后一日并续写', async () => {
    const f = fixture();
    let blocked = true;
    const settled = [];
    const debts = registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async (_, time) => {
        if (time >= 86400000 && blocked) return false;
        settled.push(time); return true;
    } });
    debts.record(f.file); f.file.stat.mtime = 86400000 + 300; debts.record(f.file);
    await f.leave();
    assert.deepEqual(settled, [100]);
    assert.deepEqual(f.storage.get('history'), { '01-projects/卡片.md': [86400000 + 300] });
    blocked = false; await f.leave();
    assert.deepEqual(settled, [100, 86400000 + 300]);
});

test('兼容旧版单时间戳欠账，不要求用户清空本机存储', async () => {
    const f = fixture(new Map([['history', { '01-projects/卡片.md': 200 }]]));
    const settled = [];
    registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async (_, time) => { settled.push(time); return true; } });
    await f.leave();
    assert.deepEqual(settled, [200]);
});

test('结算途中同日出现新编辑，不把新版本一起勾销', async () => {
    const f = fixture();
    const settled = [];
    const debts = registerEditDebts(f.ctx, { debounceMs: 10, storageKey: 'history', historyGroup: day, settle: async (_, time) => {
        settled.push(time);
        if (time === 100) { f.file.stat.mtime = 200; debts.record(f.file); }
        return true;
    } });
    debts.record(f.file);
    await f.leave(); await f.runTimers();
    assert.deepEqual(settled, [100, 200]);
    assert.equal(f.storage.has('history'), false);
});
