/**
 * [INPUT]: 依赖 core/exportStyle 的契约与标签表、modules/export/layout 的几何、
 *          modules/export/decorate 的 applyDecorations
 * [OUTPUT]: 把上述三者打成一个浏览器全局 ZExport，供 docs 的交互演示页调用
 * [POS]: 演示页与插件真源之间唯一的接缝。演示页不重写任何一行几何或装饰逻辑——
 *        它拿到的 applyDecorations 与 Obsidian 里跑的是同一份字节，
 *        因此「演示里好看、装上去不是那样」这件事在结构上不可能发生。
 *        它住在 docs/ 而不是 src/ 是因为它不参与插件构建：
 *        esbuild.config.mjs 的入口只有 src/main.ts，本文件只被同目录的 build.mjs 拿去打包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export {
    DEFAULT_EXPORT_STYLE,
    EXPORT_ALIGN_LABELS,
    EXPORT_FORMAT_LABELS,
    EXPORT_SLIDERS,
    WATERMARK_ANCHOR_GRID,
    WATERMARK_ANCHOR_LABELS,
    WATERMARK_MODE_LABELS,
    normalizeExportStyle,
} from '../../src/core/exportStyle';
export { captureScale, pdfPageSize, resolveExportText } from '../../src/modules/export/layout';
export { applyDecorations } from '../../src/modules/export/decorate';
