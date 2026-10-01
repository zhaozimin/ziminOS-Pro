/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与 renameContainer 公共命令，用受控宿主注入预览/写盘故障
 * [OUTPUT]: 验证改名确认后的字节与对象身份复核、跨 PARA 重名复核、MOC 目标冲突及独立逆序回滚
 * [POS]: tests 的容器改名事务专项；替身只实现文件系统与确认边界，直接执行生产事务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const notices = [];
globalThis.__renameAuditNotices = notices;
const stub = `
export class TFile { static [Symbol.hasInstance](value) { return value?.kind === 'file'; } }
export class TFolder { static [Symbol.hasInstance](value) { return value?.kind === 'folder'; } }
export class MarkdownView {}
export class Notice { constructor(message) { globalThis.__renameAuditNotices.push(message); } }
export class Modal { constructor(app) { this.app = app; } open() { this.app.preview(this); } }
export class ButtonComponent {}
export const normalizePath = value => value;
export class Vault { static recurseChildren(folder, visit) {
    for (const child of folder.children) { visit(child); if (child.kind === 'folder') this.recurseChildren(child, visit); }
} }
`;
const result = await build({
    entryPoints: [ROOT + 'src/modules/projects/renameContainer.ts'], bundle: true, format: 'esm',
    platform: 'node', write: false, logLevel: 'silent', plugins: [{ name: 'host', setup(builder) {
        builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: stub }));
        builder.onResolve({ filter: /core\/modals$/ }, () => ({ path: 'input', namespace: 'input' }));
        builder.onLoad({ filter: /.*/, namespace: 'input' }, () => ({ contents: `
            export class TextInputModal { constructor(app) { this.app = app; }
                async openAndGetValue() { return this.app.newName; } }
        ` }));
    } }],
});
const { runContainerRename } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

function fixture() {
    notices.length = 0;
    const files = new Map();
    const operations = [];
    const folder = { kind: 'folder', path: '01-projects/旧项目', name: '旧项目', children: [] };
    files.set(folder.path, folder);
    function add(path, content, type) {
        const name = path.split('/').at(-1);
        const file = { kind: 'file', path, name, basename: name.slice(0, -3), extension: 'md', content, type };
        files.set(path, file);
        if (path.startsWith(folder.path + '/')) { folder.children.push(file); file.parent = folder; }
        return file;
    }
    const moc = add(folder.path + '/MOC-旧项目.md', '# 原始概述\n', 'project');
    const card = add(folder.path + '/卡片.md', '卡片原文');
    const reference = add('其他.md', '[[MOC-旧项目]]');
    const ctx = {
        settings: { projectFolder: '01-projects', areaFolder: '02-areas', archiveFolder: '04-archives', eagleEnabled: false },
        guard: { mark() {} },
        app: {
            newName: '新项目', preview: modal => modal.resolveResult(true),
            workspace: { getActiveFile: () => moc, iterateAllLeaves() {}, getLeaf: () => ({ openFile: async () => {} }) },
            metadataCache: {
                getFirstLinkpathDest: link => link === 'MOC-旧项目' ? moc : null,
                getFileCache: file => ({ frontmatter: { type: file.type }, links: [...file.content.matchAll(/\[\[[^\]]+\]\]/g)].map(match => ({
                    original: match[0], position: { start: { offset: match.index }, end: { offset: match.index + match[0].length } },
                })) }),
            },
            vault: {
                getAbstractFileByPath: path => files.get(path),
                getMarkdownFiles: () => [...files.values()].filter(file => file.kind === 'file'),
                cachedRead: async file => file.content,
                process: async (file, transform) => { operations.push(['process', file.path]); file.content = transform(file.content); },
                rename: async (entry, target) => {
                    operations.push(['rename', entry.path, target]);
                    if (files.get(entry.path) !== entry || files.has(target)) throw new Error('身份或目标冲突');
                    const oldPath = entry.path;
                    const moving = [...files.values()].filter(file => file === entry || (entry.kind === 'folder' && file.path.startsWith(oldPath + '/')));
                    for (const file of moving) files.delete(file.path);
                    for (const file of moving) {
                        file.path = target + file.path.slice(oldPath.length);
                        file.name = file.path.split('/').at(-1);
                        if (file.kind === 'file') file.basename = file.name.slice(0, -3);
                        files.set(file.path, file);
                    }
                },
            },
        },
    };
    return { ctx, files, operations, folder, moc, card, reference, add };
}

test('正常改名提交整棵目录、MOC 与外部双链，只记录一次语义动作', async () => {
    const f = fixture();
    const recorded = [];
    await runContainerRename(f.ctx, undefined, async (...args) => recorded.push(args));
    assert.equal(f.folder.path, '01-projects/新项目');
    assert.equal(f.moc.path, '01-projects/新项目/MOC-新项目.md');
    assert.equal(f.card.path, '01-projects/新项目/卡片.md');
    assert.equal(f.reference.content, '[[01-projects/新项目/MOC-新项目]]');
    assert.equal(recorded.length, 1);
});

test('预览期间容器里的普通正文改变，未改链的卡片也使旧计划作废', async () => {
    const f = fixture();
    f.ctx.app.preview = modal => { f.card.content = '用户新输入'; modal.resolveResult(true); };
    await runContainerRename(f.ctx);
    assert.equal(f.folder.path, '01-projects/旧项目');
    assert.equal(f.card.content, '用户新输入');
    assert.equal(f.operations.length, 0);
});

test('预览期间另一个 PARA 根出现同名，新计划在动盘前停止', async () => {
    const f = fixture();
    f.ctx.app.preview = modal => { f.files.set('02-areas/新项目', { kind: 'folder', path: '02-areas/新项目' }); modal.resolveResult(true); };
    await runContainerRename(f.ctx);
    assert.equal(f.folder.path, '01-projects/旧项目');
    assert.equal(f.operations.length, 0);
});

test('MOC 同路径换成相同字节的新对象，确认不借旧身份继续执行', async () => {
    const f = fixture();
    f.ctx.app.preview = modal => {
        const replacement = { ...f.moc };
        f.files.set(f.moc.path, replacement);
        f.folder.children[0] = replacement;
        modal.resolveResult(true);
    };
    await runContainerRename(f.ctx);
    assert.equal(f.operations.length, 0);
    assert.equal(f.folder.path, '01-projects/旧项目');
});

test('新 MOC 名已被容器内卡片占用，预览前直接拒绝', async () => {
    const f = fixture();
    const occupant = f.add('01-projects/旧项目/MOC-新项目.md', '用户文档');
    await runContainerRename(f.ctx);
    assert.equal(f.operations.length, 0);
    assert.equal(occupant.content, '用户文档');
});

test('元数据缺席或缓存引用与正文不同步时停止，防止漏改链后仍搬目录', async () => {
    for (const cache of [null, { links: [{ original: '[[已过时]]', position: { start: { offset: 0 }, end: { offset: 8 } } }] }]) {
        const f = fixture();
        const getCache = f.ctx.app.metadataCache.getFileCache;
        f.ctx.app.metadataCache.getFileCache = file => file === f.reference ? cache : getCache(file);
        await runContainerRename(f.ctx);
        assert.equal(f.operations.length, 0);
        assert.match(notices.at(-1), /元数据/);
    }
});

test('双引号等不安全名称在生成 YAML 属性与跨平台文件之前拒绝', async () => {
    for (const name of ['含"引号', '冒号:名称', '']) {
        const f = fixture(); f.ctx.app.newName = name;
        await runContainerRename(f.ctx);
        assert.equal(f.operations.length, 0);
    }
});

test('目录改名已经提交后拒绝，仍根据同一目录对象恢复原路径', async () => {
    const f = fixture();
    const rename = f.ctx.app.vault.rename;
    let calls = 0;
    f.ctx.app.vault.rename = async (...args) => { await rename(...args); if (calls++ === 0) throw new Error('提交后失败'); };
    await runContainerRename(f.ctx);
    assert.equal(f.folder.path, '01-projects/旧项目');
    assert.equal(f.moc.path, '01-projects/旧项目/MOC-旧项目.md');
});

test('写入落盘后 Promise 拒绝，内容与路径仍完整恢复', async () => {
    const f = fixture();
    const process = f.ctx.app.vault.process;
    let calls = 0;
    f.ctx.app.vault.process = async (...args) => { await process(...args); if (calls++ === 0) throw new Error('提交后失败'); };
    await runContainerRename(f.ctx);
    assert.equal(f.reference.content, '[[MOC-旧项目]]');
    assert.equal(f.folder.path, '01-projects/旧项目');
    assert.equal(f.moc.path, '01-projects/旧项目/MOC-旧项目.md');
});

test('MOC 名称回滚失败时仍尝试恢复目录位置，并明确报告未恢复项', async () => {
    const f = fixture();
    const rename = f.ctx.app.vault.rename;
    f.ctx.app.vault.process = async () => { throw new Error('正文提交失败'); };
    f.ctx.app.vault.rename = async (entry, target) => {
        if (entry === f.moc && target.endsWith('MOC-旧项目.md')) throw new Error('MOC 回滚失败');
        return rename(entry, target);
    };
    await runContainerRename(f.ctx);
    assert.equal(f.folder.path, '01-projects/旧项目');
    assert.match(notices.at(-1), /MOC 回滚失败/);
});
