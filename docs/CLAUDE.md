# docs/

> L2 | 父级: ../CLAUDE.md

## 成员清单

设计规格书.md: V1（v0.3.1，项目管理与灵感收集）的唯一设计事实源；与 V2 有交集时以 V2 为准。
设计规格书-V2.md: v0.4.0 起的追加式设计事实源。现从人脉与五级复盘追加到 v0.16.0 的两版三库系统（§27），并记录 2026-08-18 跨版本审计加固（§28）。§19–20 记录读书从零网络纯文本导入到用户授权自动取数的路线修正；§22–24 记录 HTTP 200 仍可失败、新旧笔记形态兼容与 Apple Books WAL 三类静默失败；§25 收口 GitHub README 安装入口；§26 定义日历五维点击、年/季/月独立导航、三层日历事实、无定时器更新与失败降级。
第三方组件.md: 全仓库供应链锁定与外部设计参照表。记录 lunar-typescript、holiday-cn、Dust Calendar 交互参照、Dataview、Minimal、Style Settings、Pikaicons、Simple Icons、四款正文字体与十二个 CSS 片段的版本、上游、许可、交付形态与升级边界。编译进 main.js 的组件必须与 esbuild banner 及作者名片署名同步；原样交付的发布资产由 SHA-256 与 `.gitattributes` 保护，只参考交互而未引入代码的项目必须明示“非运行依赖”。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
