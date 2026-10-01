/**
 * [INPUT]: 依赖 node:test/assert/path/url 与 esbuild，直接编译 projects/containerRenameText 纯文本内核
 * [OUTPUT]: 覆盖全路径/短链/别名/标题锚点/嵌入、卡片 YAML up、Markdown 链接、
 *           精确出库单路径、移动后相对链接、元数据引用范围与卡片展示别名保真，
 *           普通正文和代码示例不盲换，并锁定命令在 main 的事务装配
 * [POS]: tests 的容器改名语义专项；确定性文本变换用行为测试覆盖，
 *        Obsidian 宿主事务则以装配/二次快照/回滚结构回归守住，最终由学员真库验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
    entryPoints: [path.join(ROOT, 'src/modules/projects/containerRenameText.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    write: false,
    logLevel: 'silent',
});
const { rewriteContainerReferences: rewriteKnownReferences } = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
);

const rewriteContainerReferences = (content, source, facts, resolve, spans = [{ start: 0, end: content.length }]) =>
    rewriteKnownReferences(content, source, facts, resolve, spans);

const paths = new Map([
    ['01-projects/旧项目/MOC-旧项目.md', '01-projects/新项目/MOC-新项目.md'],
    ['01-projects/旧项目/卡片.md', '01-projects/新项目/卡片.md'],
]);
const facts = {
    oldName: '旧项目',
    newName: '新项目',
    oldFolderPath: '01-projects/旧项目',
    newFolderPath: '01-projects/新项目',
    oldMocPath: '01-projects/旧项目/MOC-旧项目.md',
    newMocPath: '01-projects/新项目/MOC-新项目.md',
    paths,
};
const aliases = new Map([
    ['MOC-旧项目', facts.oldMocPath],
    ['旧项目', facts.oldMocPath],
    ['01-projects/旧项目/MOC-旧项目', facts.oldMocPath],
    ['01-projects/旧项目/卡片', '01-projects/旧项目/卡片.md'],
    ['01-projects/旧项目/卡片.md', '01-projects/旧项目/卡片.md'],
]);
const resolve = (linkpath) => aliases.get(linkpath) ?? null;

test('双链、嵌入、别名与锚点全部指向改名后的确定路径', () => {
    const source = [
        '[[MOC-旧项目]]',
        '[[旧项目|旧项目]]',
        '![[01-projects/旧项目/卡片#结论|保留别名]]',
    ].join('\n');
    const result = rewriteContainerReferences(source, '02-areas/复盘.md', facts, resolve);

    assert.equal(result.content, [
        '[[01-projects/新项目/MOC-新项目]]',
        '[[01-projects/新项目/MOC-新项目|新项目]]',
        '![[01-projects/新项目/卡片#结论|保留别名]]',
    ].join('\n'));
    assert.equal(result.replacements, 3);
});

test('卡片属性 up 与 Markdown 链接同步更新', () => {
    const source = ['---', 'up:', '  - "[[01-projects/旧项目/MOC-旧项目|旧项目]]"', '---', '', '[参考](<01-projects/旧项目/卡片.md#结论>)'].join('\n');
    const result = rewriteContainerReferences(source, '01-projects/旧项目/另一篇.md', facts, resolve);

    assert.match(result.content, /up:\n  - "\[\[01-projects\/新项目\/MOC-新项目\|新项目\]\]"/);
    assert.equal(result.content.split('\n').at(-1), `[参考](<${encodeURIComponent('卡片')}.md#结论>)`);
});

test('出库单以精确路径为身份证明，即使跨库双链无法解析也能更新', () => {
    const source = '- [ ] 2026-09-27 10:00 · 项目 · [[旧项目]] · `01-projects/旧项目` · UID 123';
    const result = rewriteContainerReferences(source, '90-system/赛博永生出库单.md', facts, () => null);

    assert.equal(result.content, '- [ ] 2026-09-27 10:00 · 项目 · [[01-projects/新项目/MOC-新项目|新项目]] · `01-projects/新项目` · UID 123');
});

test('普通正文与无法证明归属的同名链接一字不动', () => {
    const source = '旧项目是一个普通词。[[旧项目]] 也可能指向别人的笔记。';
    const result = rewriteContainerReferences(source, '其他.md', facts, () => null);

    assert.equal(result.content, source);
    assert.equal(result.replacements, 0);
});

test('相对 Markdown 链接仍从改名后的源目录解析，并编码特殊路径字符', () => {
    const sourcePath = '01-projects/旧项目/目录/说明.md';
    const target = '01-projects/旧项目/卡片.md';
    const source = '[参考](../卡片.md#结论)';
    const result = rewriteContainerReferences(source, sourcePath, facts, () => target);
    const destination = /\]\(([^)]+)\)/.exec(result.content)[1].split('#')[0];
    assert.equal(path.posix.normalize(path.posix.join('01-projects/新项目/目录', decodeURIComponent(destination))), paths.get(target));
});

test('尖括号里的空格路径整体改写，保留锚点与标题', () => {
    const target = '01-projects/旧项目/有 空格.md';
    const next = '01-projects/新项目/有 空格.md';
    const source = '[参考](<../旧项目/有 空格.md#结论> "说明")';
    const result = rewriteContainerReferences(source, '01-projects/旁边/说明.md', { ...facts, paths: new Map([[target, next]]) }, () => target);
    assert.ok(result.content.includes('新项目') || result.content.includes(encodeURIComponent('新项目')));
    assert.ok(result.content.endsWith('#结论> "说明")'));
    assert.equal(result.replacements, 1);
});

test('卡片别名恰好等于项目名时仍保留用户的展示文字', () => {
    const source = '[[01-projects/旧项目/卡片|旧项目]]';
    const result = rewriteContainerReferences(source, '其他.md', facts, resolve);
    assert.equal(result.content, '[[01-projects/新项目/卡片|旧项目]]');
});

test('只改元数据证明的引用，代码示例和过时缓存原文保持原样', () => {
    const link = '[[MOC-旧项目]]';
    const source = ['```md', link, '```', '`' + link + '`', link].join('\n');
    const start = source.lastIndexOf(link);
    const result = rewriteContainerReferences(source, '其他.md', facts, resolve, [{ start, end: start + link.length, original: link }]);
    assert.equal(result.content, source.slice(0, start) + '[[01-projects/新项目/MOC-新项目]]');
    const stale = rewriteContainerReferences(source, '其他.md', facts, resolve, [{ start, end: start + link.length, original: '[[其他]]' }]);
    assert.equal(stale.content, source);
});

test('改名命令装配二次快照、本地回滚、Eagle 同步与日记语义记录', () => {
    const main = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const command = readFileSync(path.join(ROOT, 'src/modules/projects/renameContainer.ts'), 'utf8');

    assert.ok(main.includes('registerContainerRenameCommand(ctx'));
    assert.ok(main.includes('renameEagleContainer(oldName, newName)'));
    assert.ok(main.includes('recordContainerRenameActivity(ctx, oldName, newName, newMocPath)'));
    assert.ok(command.includes('const livePlan = await buildPlan(ctx, liveIdentity, newName)'));
    assert.ok(command.includes('livePlan.fingerprint !== plan.fingerprint'));
    assert.ok(command.includes('await app.vault.rename(plan.identity.folder, plan.newFolderPath)'));
    assert.ok(command.includes('for (const edit of [...applied].reverse())'));
    assert.ok(command.includes('await app.vault.rename(plan.identity.folder, plan.facts.oldFolderPath)'));
});
