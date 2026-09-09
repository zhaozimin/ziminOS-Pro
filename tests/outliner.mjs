/**
 * [INPUT]: 依赖 node:test/assert/crypto/fs/path/url，读取 Outliner 发布产物、默认启用清单、库内手册、第三方供应链记录与作者名片
 * [OUTPUT]: 为 npm test 提供 Outliner 列表编辑功能的跨产物回归，锁定版本、字节、启用状态、真实快捷键与致谢链接
 * [POS]: tests 的 Outliner 专项供应链审计；不重演上游的 CodeMirror 内核测试，只验证 ziminOS 承诺交付的那一层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_ROOT = path.join(ROOT, 'vault/.obsidian/plugins/obsidian-outliner');
const UPSTREAM = 'https://github.com/vslinko/obsidian-outliner';

function sha256(file) {
    return createHash('sha256').update(readFileSync(file)).digest('hex');
}

test('Outliner 列表编辑随库启用，手册与致谢指向同一上游', () => {
    const enabledPlugins = JSON.parse(
        readFileSync(path.join(ROOT, 'vault/.obsidian/community-plugins.json'), 'utf8'),
    );
    const manifest = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, 'manifest.json'), 'utf8'));
    const source = readFileSync(path.join(PLUGIN_ROOT, 'SOURCE.md'), 'utf8');
    const guide = readFileSync(path.join(ROOT, 'vault/README.md'), 'utf8');
    const supplyChain = readFileSync(path.join(ROOT, 'docs/第三方组件.md'), 'utf8');
    const about = readFileSync(path.join(ROOT, 'src/modules/about/view.ts'), 'utf8');

    assert.ok(enabledPlugins.includes('obsidian-outliner'));
    assert.equal(manifest.id, 'obsidian-outliner');
    assert.equal(manifest.version, '4.10.2');
    assert.equal(source.includes(UPSTREAM), true);
    assert.equal(about.includes(`url: '${UPSTREAM}'`), true);

    for (const file of ['main.js', 'manifest.json', 'styles.css', 'LICENSE']) {
        const artifact = path.join(PLUGIN_ROOT, file);
        assert.ok(existsSync(artifact), `Outliner 交付物缺失：${file}`);
        assert.ok(
            supplyChain.includes(`\`${file}\` SHA-256：\`${sha256(artifact)}\``),
            `Outliner 校验值过时：${file}`,
        );
    }

    assert.ok(guide.includes('Cmd + Shift + ↑/↓'));
    assert.ok(guide.includes('Ctrl + Shift + ↑/↓'));
    assert.equal(guide.includes('`Cmd + ↑/↓` 整条'), false);
});
