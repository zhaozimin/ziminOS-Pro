/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译并载入 src 中的纯 TypeScript 模块
 * [OUTPUT]: 提供 npm test 的审计回归集，覆盖 ISBN 校验、换行符保真、移动端 Node 边界，
 *           并在专业版源码存在时额外覆盖出库单的分隔符往返
 * [POS]: tests 的唯一可执行入口；只验证公开行为与关键平台边界，不复制业务实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTypeScript(relativePath) {
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });
    const source = result.outputFiles[0].text;

    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { isbnUid } = await loadTypeScript('src/modules/books/isbn.ts');
const { formatMarkdown } = await loadTypeScript('src/core/markdownStyle.ts');

test('ISBN-13 只接受正确前缀与校验位', () => {
    assert.equal(isbnUid('978-7-115-56467-2'), 9787115564672);
    assert.equal(isbnUid('9787115564673'), null);
    assert.equal(isbnUid('1234567890128'), null);
});

test('ISBN-10 先验真再无损换成 ISBN-13', () => {
    assert.equal(isbnUid('0-306-40615-2'), 9780306406157);
    assert.equal(isbnUid('0-8044-2957-X'), 9780804429573);
    assert.equal(isbnUid('0-306-40615-3'), null);
});

test('CRLF 笔记整理后仍通篇使用 CRLF', () => {
    const input = '---\r\ntitle: test\r\n---\r\n正文English\r\n';
    const output = formatMarkdown(input, ['cjk-space']);

    assert.match(output, /正文 English/);
    assert.equal(output.replaceAll('\r\n', '').includes('\n'), false);
    assert.equal(output.includes('\r\n'), true);
});

test('传统 CR 笔记整理后不被混成 LF', () => {
    const output = formatMarkdown('中文English\r下一行', ['cjk-space']);

    assert.equal(output, '中文 English\r下一行');
});

test('全部规则关闭时逐字节原样返回', () => {
    const input = '\ufeff中文English\r\n\r\n';

    assert.equal(formatMarkdown(input, []), input);
});

test('本机书源不在模块顶层静态引入 Node 内建模块', () => {
    for (const relativePath of [
        'src/modules/books/sourceAppleBooks.ts',
        'src/modules/books/sourceKindle.ts',
    ]) {
        const source = readFileSync(path.join(ROOT, relativePath), 'utf8');

        assert.doesNotMatch(source, /from ['"](?:fs|path|child_process|os)['"]/);
        assert.ok(source.indexOf('Platform.isDesktopApp') < source.indexOf("require('"));
    }
});

const manifestPath = path.join(ROOT, 'src/modules/eternal/manifest.ts');

if (existsSync(manifestPath)) {
    const { manifestLine, parseManifestLine } = await loadTypeScript('src/modules/eternal/manifest.ts');

    test('出库单项目名与路径含可见分隔符时仍能无损往返', () => {
        const entry = {
            done: false,
            stamp: '2026-08-18 09:30',
            kindLabel: '项目',
            name: '西风 · 庄园',
            folderPath: '70-archive/西风 · 庄园',
            uid: '20260818093000',
        };

        assert.deepEqual(parseManifestLine(manifestLine(entry)), entry);
        assert.equal(parseManifestLine('- [ ] 一条没有 UID 的手写备注'), null);
    });
}
