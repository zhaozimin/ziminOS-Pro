/**
 * [INPUT]: 依赖 node:fs/path/url 与 esbuild；读同目录的 entry.ts / shell.html / driver.js、
 *          插件的 vault/.obsidian/plugins/ziminos/styles.css 与 package.json 的版本
 * [OUTPUT]: 生成 docs/导出预览交互演示.html，并导出 buildExportDemo 供回归直接调用
 * [POS]: 演示页的生成器，也是本仓库回答「示意图会不会和产品说两样话」的方式：**不手抄，只生成**。
 *        样式逐字取自插件的 styles.css，几何与装饰由 esbuild 从 src/ 直接打包，
 *        控件清单在运行时读 EXPORT_SLIDERS——三处事实全部来自真源，
 *        于是「演示里是这样、装上去不是这样」这件事在结构上不可能发生。
 *        它不进插件构建链（esbuild.config.mjs 的入口只有 src/main.ts），
 *        由 npm run demo 显式调用；回归则调用 buildExportDemo 与入库产物比对，
 *        改了源却忘了重新生成会当场变红
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

export const DEMO_PATH = path.join(ROOT, 'docs/导出预览交互演示.html');

/**
 * 生成演示页的完整字节，但不落盘——回归拿它与入库的那份比对，构建脚本拿它写出去。
 * 分成两步是为了让「检查是否过期」不必先把文件改掉。
 */
export async function buildExportDemo() {
    const [shell, driver, css, pkg] = await Promise.all([
        readFile(path.join(HERE, 'shell.html'), 'utf8'),
        readFile(path.join(HERE, 'driver.js'), 'utf8'),
        readFile(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/styles.css'), 'utf8'),
        readFile(path.join(ROOT, 'package.json'), 'utf8'),
    ]);
    const bundled = await build({
        entryPoints: [path.join(HERE, 'entry.ts')],
        bundle: true,
        format: 'iife',
        globalName: 'ZExport',
        target: 'es2018',
        platform: 'browser',
        write: false,
        logLevel: 'silent',
    });
    const version = JSON.parse(pkg).version;
    // 模板自己的 [PROTOCOL] 头讲的是模板，不是产物；产物换上一句「别手改这里」的告示
    const body = shell.replace(/^<!--[\s\S]*?-->\n/, '');

    return fill(`<!--
  这个文件是**生成**出来的，不要手改：改动会在下一次 npm run demo 时被整份覆盖。
  真源在 docs/export-demo/ —— 外壳 shell.html、驱动 driver.js、与 src/ 的接缝 entry.ts。
  页内的导出样式逐字来自 vault/.obsidian/plugins/ziminos/styles.css，
  几何与装饰逻辑由 esbuild 从 src/ 直接打包，因此它与插件里跑的是同一份判断。
  ziminOS v${version}
-->
${body}`, {
        VERSION: version,
        PLUGIN_CSS: css,
        BUNDLE: bundled.outputFiles[0].text,
        DRIVER: driver,
    });
}

/**
 * 占位符替换一律走函数形式的 replace。
 * 直接传字符串的话，注入的那几段里凡是出现 `$&` 或 `$1` 都会被当成回溯引用展开——
 * 而打包产物与 CSS 里出现这类字节是完全正常的事，出错时表现为页面某处莫名少了一截。
 */
function fill(template, values) {
    return template.replace(/\{\{(VERSION|PLUGIN_CSS|BUNDLE|DRIVER)\}\}/g, (_match, key) => values[key]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const html = await buildExportDemo();

    await writeFile(DEMO_PATH, html, 'utf8');
    console.log(`导出预览交互演示.html 已生成（${(html.length / 1024).toFixed(0)} KB）`);
}
