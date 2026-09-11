# src/modules/export/

> L2 | 父级: ../../CLAUDE.md

把当前 Markdown 笔记导出为一整张 PNG 或单页 PDF。两种格式共用同一份离屏渲染结果：先按当前笔记可见正文宽度建立纸面，再等待 Markdown、ziminOS 代码块、图片与字体稳定，最后按真实 `scrollWidth / scrollHeight` 一次性栅格化；因此页眉、页脚、水印与正文不会在两个导出器里各实现一遍。

## 成员清单

layout.ts: 无 DOM 的导出口径层；定义 PNG/PDF 与页眉、页脚、水印选项，负责模板占位符、文件名清洗、浏览器画布上限内的自适应倍率，以及 PDF 单页 14,400pt 边界内的等比纸张尺寸。
modal.ts: 导出前唯一交互面；一次收齐格式、页眉、页脚与水印，空值就是关闭，关闭或取消零写入。
exporter.ts: 导出编排与运行时边界；用 Obsidian `MarkdownRenderer` 离屏生成完整文章、把远端图片内联后交给 dom-to-image-more 一次性生成 PNG，PDF 只把同一长图装进一页；桌面优先借 Electron 保存对话框，探不到则与移动端一起回落到笔记库附件位置。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
