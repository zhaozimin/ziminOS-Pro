/**
 * [INPUT]: 依赖 node:test/assert/path/url 与 esbuild，直接编译 projects/containerRenameText 纯文本内核
 * [OUTPUT]: 覆盖全路径/短链/别名/标题锚点/嵌入、卡片 YAML up、Markdown 链接、
 *           跨库出库单及普通正文不盲换，并锁定命令在 main 的事务装配
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
const { rewriteContainerReferences } = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
);

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
    assert.match(result.content, /\[参考\]\(<01-projects\/新项目\/卡片\.md#结论>\)/);
});

test('出库单以精确路径为身份证明，即使跨库双链无法解析也能更新', () => {
    const source = '- [ ] 2026-09-27 10:00 · 项目 · [[旧项目]] · `01-projects/旧项目` · UID 123';
    const result = rewriteContainerReferences(source, '90-system/出库单.md', facts, () => null);

    assert.equal(result.content, '- [ ] 2026-09-27 10:00 · 项目 · [[01-projects/新项目/MOC-新项目|新项目]] · `01-projects/新项目` · UID 123');
});

test('普通正文与无法证明归属的同名链接一字不动', () => {
    const source = '旧项目是一个普通词。[[旧项目]] 也可能指向别人的笔记。';
    const result = rewriteContainerReferences(source, '其他.md', facts, () => null);

    assert.equal(result.content, source);
    assert.equal(result.replacements, 0);
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
