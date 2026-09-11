/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 contacts/templates 事实源，
 *          并读取 main、clientViews、VaultIndex 与客户命令的装配代码
 * [OUTPUT]: 验证两张内建 MOC 的新名初始化与旧名兼容寻址、客户名录排序，
 *           以及客户答疑的模板、旧档案补齐与“QA 标签 + 属性双链”两道检索闸门
 * [POS]: tests 的客户模块专项契约；把「新库长出什么」「插件更新后链接指向谁」、
 *        「旧档案怎么升级」与「答疑为什么归到这个客户」钉在同一条用户路径上
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTemplates() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/contacts/templates.ts')],
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
                        contents: "import moment from 'moment'; export { moment }; export const normalizePath = (value) => value;",
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    const source = result.outputFiles[0].text;
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

async function loadVaultIndex() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/core/vaultIndex.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-vault-index-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: 'export class TFile {}; export class TFolder {}; export const normalizePath = (value) => value;',
                        loader: 'js',
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const {
    clientMocContent,
    clientNoteContent,
    contactMocContent,
    ensureClientAnswerView,
} = await loadTemplates();

async function loadConstants() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/core/constants.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { CLIENT_MOC, CONTACT_MOC } = await loadConstants();

async function loadMocPaths() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/contacts/moc.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-moc-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: 'export const normalizePath = (value) => value;',
                        loader: 'js',
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { basenameOf, resolveBuiltInMocPath } = await loadMocPaths();

test('两张内建 MOC 初始化时统一使用 MOC 前缀', () => {
    const contactSeedSource = readFileSync(path.join(ROOT, 'src/modules/contacts/seed.ts'), 'utf8');
    const clientSeedSource = readFileSync(path.join(ROOT, 'src/modules/contacts/client.ts'), 'utf8');
    const contactContent = contactMocContent('2026-09-11 10:00:00', 20260911100000);
    const legacyFiles = new Set(['02-areas/人脉/人脉MOC.md']);
    const appWithLegacy = {
        vault: { getAbstractFileByPath: (candidate) => legacyFiles.has(candidate) ? {} : null },
    };
    const appWithoutMoc = { vault: { getAbstractFileByPath: () => null } };
    const appWithBoth = { vault: { getAbstractFileByPath: () => ({}) } };

    assert.equal(CONTACT_MOC, '02-areas/人脉/MOC-人脉.md');
    assert.equal(CLIENT_MOC, '02-areas/客户/MOC-客户.md');
    assert.equal(basenameOf(CONTACT_MOC), 'MOC-人脉');
    assert.equal(basenameOf(CLIENT_MOC), 'MOC-客户');
    assert.match(contactSeedSource, /resolveBuiltInMocPath\(/);
    assert.match(clientSeedSource, /resolveBuiltInMocPath\(/);
    assert.match(contactContent, /\[\[MOC-客户\]\]/);
    assert.equal(
        resolveBuiltInMocPath(appWithoutMoc, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        CONTACT_MOC,
    );
    assert.equal(
        resolveBuiltInMocPath(appWithLegacy, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        '02-areas/人脉/人脉MOC.md',
    );
    assert.equal(
        resolveBuiltInMocPath(appWithBoth, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        CONTACT_MOC,
    );
});

test('客户 MOC 随默认开荒生成，并只用一张四列名录回答核心问题', () => {
    const content = clientMocContent('2026-09-10 12:00', 20260910120000);
    const mainSource = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const viewSource = readFileSync(
        path.join(ROOT, 'src/modules/contacts/clientViews.ts'),
        'utf8',
    );
    const collectStart = mainSource.indexOf('const collectSeeds');
    const collectEnd = mainSource.indexOf('];', collectStart);
    const collectSeeds = mainSource.slice(collectStart, collectEnd);

    assert.notEqual(collectStart, -1);
    assert.notEqual(collectEnd, -1);
    assert.match(collectSeeds, /clientSeed\(ctx\)/);
    assert.match(content, /```ziminos\n客户名录\n```/);
    assert.equal([...content.matchAll(/```ziminos/g)].length, 1);
    assert.match(viewSource, /name: '客户名录'/);
    assert.match(viewSource, /\['人物', '金额', '交付', '创建日期'\]/);
    assert.match(viewSource, /Number\(right\.pendingCount > 0\)/);
});

test('新客户自带答疑视图，旧档案只补一次且保留原换行', () => {
    const fresh = clientNoteContent({
        created: '2026-09-11 10:00:00',
        uid: 20260911100000,
        type: 'client',
        source: '小红书',
        contact: 'alex',
    });
    const legacy = '---\r\ntype: client\r\n---\r\n\r\n## 关键事件（自动）\r\n';
    const upgraded = ensureClientAnswerView(legacy);

    assert.equal([...fresh.matchAll(/```ziminos\n客户答疑\n```/g)].length, 1);
    assert.match(upgraded, /## 客户答疑（自动）\r\n\r\n```ziminos\r\n客户答疑\r\n```/);
    assert.equal(ensureClientAnswerView(upgraded), upgraded);
    assert.ok(!upgraded.replaceAll('\r\n', '').includes('\n'));
});

test('客户答疑同时要求 QA 标签与 frontmatter 双链，并提供显式旧档案补齐命令', () => {
    const viewSource = readFileSync(path.join(ROOT, 'src/modules/contacts/clientViews.ts'), 'utf8');
    const indexSource = readFileSync(path.join(ROOT, 'src/core/vaultIndex.ts'), 'utf8');
    const commandSource = readFileSync(path.join(ROOT, 'src/core/commands.ts'), 'utf8');
    const clientSource = readFileSync(path.join(ROOT, 'src/modules/contacts/client.ts'), 'utf8');

    assert.match(viewSource, /name: '客户答疑'/);
    assert.match(viewSource, /CLIENT_ANSWER_TAG = 'obsidian\/qa'/);
    assert.match(viewSource, /frontmatterLinksTo\(file, client\)/);
    assert.match(indexSource, /frontmatterLinks/);
    assert.match(commandSource, /id: 'backfill-client-answer-views'/);
    assert.match(commandSource, /name: '补齐客户答疑检索'/);
    assert.match(clientSource, /ensureClientAnswerView\(current\)/);
});

test('客户归属只认 frontmatterLinks 中真实解析到档案的链接', async () => {
    const { VaultIndex } = await loadVaultIndex();
    const client = { path: '02-areas/客户/Alex.md' };
    const linkedAnswer = { path: '02-areas/obsidian/答疑-Alex.md' };
    const bodyOnlyAnswer = { path: '02-areas/obsidian/正文提到-Alex.md' };
    const caches = new Map([
        [linkedAnswer.path, { frontmatterLinks: [{ link: 'Alex' }, { link: 'MOC-obsidian' }] }],
        [bodyOnlyAnswer.path, { frontmatterLinks: [{ link: 'MOC-obsidian' }] }],
    ]);
    const app = {
        metadataCache: {
            getFileCache: (file) => caches.get(file.path),
            getFirstLinkpathDest: (link) => (
                link === 'Alex' ? client : { path: '02-areas/obsidian/MOC-obsidian.md' }
            ),
        },
    };
    const index = new VaultIndex(app);

    assert.equal(index.frontmatterLinksTo(linkedAnswer, client), true);
    assert.equal(index.frontmatterLinksTo(bodyOnlyAnswer, client), false);
});
