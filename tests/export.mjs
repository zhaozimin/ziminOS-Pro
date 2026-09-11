/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 export/layout 纯函数，
 *          并读取导出器、命令表与 package.json 的装配事实
 * [OUTPUT]: 验证长页画布自适应、PDF 单页边界、装饰占位符、完整 DOM 栅格化与两种格式接线
 * [POS]: tests 的导出模块专项契约；浏览器真机负责验视觉，本文件先钉住不会静默截断的尺寸算法
 *        与“一份渲染结果、两种交付格式”的架构边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadLayout() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/export/layout.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const layout = await loadLayout();

test('短文保留 2x，超长文自动降采样但不越过画布边界', () => {
    assert.equal(layout.captureScale(800, 3_000), 2);

    const scale = layout.captureScale(1_200, 60_000);

    assert.ok(scale < 1);
    assert.ok(scale * 60_000 <= 32_000);
    assert.ok(1_200 * 60_000 * scale * scale <= 192_000_000);

    const extreme = layout.captureScale(1_200, 400_000);

    assert.ok(extreme < 0.1);
    assert.ok(extreme * 400_000 <= 32_000);
    assert.ok(1_200 * 400_000 * extreme * extreme <= 192_000_000);
});

test('PDF 纸张保持文章比例并收进单页安全边界', () => {
    const page = layout.pdfPageSize(1_000, 40_000);

    assert.ok(Math.max(page.width, page.height) <= 14_400);
    assert.ok(Math.abs(page.width / page.height - 1 / 40) < 0.000001);
});

test('页眉页脚与水印只替换公开占位符，文件名跨平台安全', () => {
    assert.equal(
        layout.resolveExportText('{title} · {date} {time} · {other}', {
            title: '答疑/Alex',
            date: '2026-09-11',
            time: '10:30',
        }),
        '答疑/Alex · 2026-09-11 10:30 · {other}',
    );
    assert.equal(layout.safeExportName('答疑/Alex: 第1篇'), '答疑－Alex－ 第1篇');
});

test('导出命令只渲染一次完整 DOM，再分流 PNG 与单页 PDF', () => {
    const exporter = readFileSync(path.join(ROOT, 'src/modules/export/exporter.ts'), 'utf8');
    const commands = readFileSync(path.join(ROOT, 'src/core/commands.ts'), 'utf8');
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    assert.match(commands, /id: 'export-current-note'/);
    assert.match(commands, /name: '导出当前笔记'/);
    assert.match(exporter, /MarkdownRenderer\.render/);
    assert.match(exporter, /domToImage\.toBlob/);
    assert.match(exporter, /pdf\.addImage/);
    assert.match(exporter, /article\.scrollWidth/);
    assert.match(exporter, /article\.scrollHeight/);
    assert.match(exporter, /options\.header/);
    assert.match(exporter, /options\.footer/);
    assert.match(exporter, /options\.watermark/);
    assert.equal(pkg.dependencies['dom-to-image-more'], '3.10.2');
    assert.equal(pkg.dependencies.jspdf, '4.2.1');
});
