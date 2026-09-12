/**
 * [INPUT]: 依赖 core/exportStyle 的契约与标签表、modules/export/layout 的几何、
 *          modules/export/decorate 的 applyDecorations、modules/export/panel 的控件列、
 *          modules/export/progressBody 的进度条
 * [OUTPUT]: 把上述四者打成一个浏览器全局 ZExport，供 docs 的交互演示页调用
 * [POS]: 演示页与插件真源之间唯一的接缝。演示页不重写任何一行几何、装饰、控件或进度逻辑——
 *        它拿到的与 Obsidian 里跑的是同一份字节，因此「演示里好看、装上去不是那样」
 *        这件事在结构上不可能发生。能这样，是因为那三个文件都刻意不 import obsidian：
 *        panel 只用 HTMLElement 上那几个便捷方法（演示页补齐即可），progressBody 连那些也不用。
 *        它住在 docs/ 而不是 src/ 是因为它不参与插件构建：
 *        esbuild.config.mjs 的入口只有 src/main.ts，本文件只被同目录的 build.mjs 拿去打包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export {
    DEFAULT_EXPORT_STYLE,
    EXPORT_SLIDERS,
    PAPER_PRESET_SIZES,
    normalizeExportStyle,
} from '../../src/core/exportStyle';
export {
    captureScale,
    pageMinHeightOf,
    pageWidthOf,
    pdfPageSize,
    resolveExportText,
} from '../../src/modules/export/layout';
export { applyDecorations } from '../../src/modules/export/decorate';
export { buildExportPanel } from '../../src/modules/export/panel';
export { createProgressBody } from '../../src/modules/export/progressBody';
