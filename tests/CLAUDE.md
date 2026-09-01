# tests/

> L2 | 父级: ../CLAUDE.md

这里收口可以离开 Obsidian 真机验证的回归行为。测试直接编译 `src/` 里的 TypeScript 事实源，不维护第二份实现；平台结构检查只钉住「移动端加载前不引入 Node」这条不能由纯函数表达的边界。专业版多出的出库单测试按源文件是否存在自动启用，因此同一入口可用于两个版次。

## 成员清单

regression.mjs: Node 内建测试入口，用 esbuild 内存编译纯 TypeScript 模块，对本轮审计中会导致静默数据损坏或整体加载失败的边界做最小回归。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
