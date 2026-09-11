/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url，读取第二版微信快捷收集 Skill 的用户可见契约
 * [OUTPUT]: 验证所有保存请求只有 inspiration 一条命令路径，剪藏明确保留给浏览器插件
 * [POS]: tests 的三库捕获路由契约；它防的是文案回退成“长内容进剪藏、今天的事进日记”这类静默分流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 整份文件验的都是第二版契约，而 publish-v1.sh 把 tests/ 整份同步到第一版仓库、
// 又不搬 skill-pro/。顶层直接 readFileSync 会让整个文件在那边加载即崩，
// 连 skip 都来不及——所以读盘必须推迟到闸门之后。
const contractPath = path.join(ROOT, 'skill-pro/capture/SKILL.md');
const isProRepo = existsSync(contractPath);
const source = isProRepo ? readFileSync(contractPath, 'utf8') : '';

test('微信快捷收集只调用 inspiration，剪藏归浏览器插件', { skip: !isProRepo }, () => {
    const commandLines = source
        .split('\n')
        .filter((line) => line.includes('notectl.py') && !line.includes('执行一律调用'));

    assert.match(source, /只有一个落点/);
    assert.match(source, /浏览器剪藏插件的独占落点/);
    assert.match(source, /仍写入灵感集/);
    assert.ok(commandLines.some((line) => line.includes('inspiration')));
    assert.ok(!commandLines.some((line) => /notectl\.py\s+(clip|diary)/.test(line)));
});
