/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译并载入 src 中的纯 TypeScript 模块
 * [OUTPUT]: 提供 npm test 的审计回归集，覆盖 ISBN 校验、换行符保真、移动端 Node 边界，
 *           并在专业版源码存在时额外覆盖出库单的分隔符往返与《赛博永生》的路径同构
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

    const {
        ETERNAL_FOLDERS,
        ETERNAL_INDEX_FILE,
        ETERNAL_LOG_FILE,
        ETERNAL_LOG_INGEST_MARKS,
    } = await loadTypeScript('src/core/constants.ts');

    /**
     * 插件认的路径与模板、安装契约里实际写着的路径必须是同一批字符串。
     *
     * 这是《赛博永生》汉化留下的一类真实风险：常量改了而模板没改（或反过来）不会有任何东西报错，
     * 表现只是「待提炼」永远是空的——它去一个不存在的目录里找原料，找不到，于是显示「原料层还是空的」。
     * 三处各自都说得通，合起来是错的，而只有跨文件比对才看得见。
     */
    test('《赛博永生》的目录名在常量、模板与安装契约三处一致', () => {
        const eternalRoot = path.join(ROOT, 'vault-pro/赛博永生');

        assert.ok(existsSync(path.join(eternalRoot, ETERNAL_INDEX_FILE)), ETERNAL_INDEX_FILE);
        assert.ok(existsSync(path.join(eternalRoot, ETERNAL_LOG_FILE)), ETERNAL_LOG_FILE);

        // 原料层是空目录，空目录不进 git，因此它的事实源是安装契约里那行 mkdir
        const contract = readFileSync(path.join(ROOT, 'skill-pro/SKILL.md'), 'utf8');

        assert.ok(contract.includes(`mkdir -p "$eternal/${ETERNAL_FOLDERS.raw}"`), ETERNAL_FOLDERS.raw);
    });

    /**
     * 汉化之前写下的账本行用的是英文 `ingest`。少认这一个标记不会报错，
     * 只会让那几份原料整体退回「待提炼」，接着被重复消化一遍、知识层跟着重一遍。
     * 这条钉着它，免得某次「清理遗留」把它顺手删了。
     */
    test('账本仍认得汉化之前写下的 ingest 行', () => {
        assert.ok(ETERNAL_LOG_INGEST_MARKS.includes('消化'));
        assert.ok(ETERNAL_LOG_INGEST_MARKS.includes('ingest'));
    });

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
