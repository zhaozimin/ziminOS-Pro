/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 contacts/templates 事实源，
 *          并读取 main 与 clientViews 的装配代码
 * [OUTPUT]: 验证客户 MOC 默认开荒接线、单一客户名录块、四列表头与待交付优先顺序
 * [POS]: tests 的客户模块专项契约；把「新库长出什么」与「名录如何排序」钉在同一条用户路径上
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
                        contents: "import moment from 'moment'; export { moment };",
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

const { clientMocContent } = await loadTemplates();

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
