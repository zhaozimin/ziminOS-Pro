/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url，读取第二版微信快捷收集 Skill 的用户可见契约
 * [OUTPUT]: 验证所有保存请求只有 inspiration 一条命令路径，剪藏明确保留给浏览器插件
 * [POS]: tests 的三库捕获路由契约；它防的是文案回退成“长内容进剪藏、今天的事进日记”这类静默分流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(ROOT, 'skill-pro/capture/SKILL.md'), 'utf8');

test('微信快捷收集只调用 inspiration，剪藏归浏览器插件', () => {
    const commandLines = source
        .split('\n')
        .filter((line) => line.includes('notectl.py') && !line.includes('执行一律调用'));

    assert.match(source, /只有一个落点/);
    assert.match(source, /浏览器剪藏插件的独占落点/);
    assert.match(source, /仍写入灵感集/);
    assert.ok(commandLines.some((line) => line.includes('inspiration')));
    assert.ok(!commandLines.some((line) => /notectl\.py\s+(clip|diary)/.test(line)));
});
