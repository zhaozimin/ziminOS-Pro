/**
 * [INPUT]: 依赖 node:test/assert/fs/os/path/child_process，实跑仓库 esbuild.config.mjs 与一个最小 CJS 依赖
 * [OUTPUT]: 验证本地依赖与跨目录中文/空格路径依赖构建得到逐字节相同的生产 JS
 * [POS]: tests 的构建位置专项；不复制归一算法，通过真实构建入口验证输出中没有本机目录泄漏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
test('本地依赖与跨目录的中文空格依赖构建得到同一份产物', () => {
    const staging = mkdtempSync(path.join(os.tmpdir(), 'ziminos-build-location-'));
    try {
        function dependency(base) {
            const target = path.join(base, 'node_modules/audit-dependency');
            mkdirSync(target, { recursive: true });
            writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'audit-dependency', main: 'index.cjs' }));
            writeFileSync(path.join(target, 'index.cjs'), 'module.exports = { value: 42, literal: "../外部 依赖/node_modules/audit-dependency/index.cjs" };');
        }
        function project(name) {
            const base = path.join(staging, name);
            for (const folder of ['src', 'eagle-companion', 'vault/.obsidian/plugins/ziminos']) mkdirSync(path.join(base, folder), { recursive: true });
            writeFileSync(path.join(base, 'src/main.ts'), 'export { value, literal } from "audit-dependency";');
            writeFileSync(path.join(base, 'package.json'), '{"version":"0.39.1"}');
            for (const file of ['eagle-companion/manifest.json', 'vault/.obsidian/plugins/ziminos/manifest.json']) writeFileSync(path.join(base, file), '{"version":"0.39.1"}');
            return base;
        }
        function compile(base) {
            const result = spawnSync(process.execPath, [path.join(ROOT, 'esbuild.config.mjs'), 'production'], { cwd: base, encoding: 'utf8' });
            assert.equal(result.status, 0, result.stderr);
            return readFileSync(path.join(base, 'vault/.obsidian/plugins/ziminos/main.js'), 'utf8');
        }
        const local = project('local'); dependency(local);
        const external = path.join(staging, '外部 依赖'); dependency(external);
        const borrowed = project('借用 构建'); symlinkSync(path.join(external, 'node_modules'), path.join(borrowed, 'node_modules'), 'dir');
        const canonical = compile(local);
        const fromBorrowed = compile(borrowed);
        assert.equal(fromBorrowed, canonical);
        assert.ok(!fromBorrowed.includes('// ../外部 依赖/'));
        assert.ok(fromBorrowed.includes('literal: "../\\u5916\\u90E8 \\u4F9D\\u8D56/node_modules/audit-dependency/index.cjs"'));
    } finally {
        rmSync(staging, { recursive: true, force: true });
    }
});
