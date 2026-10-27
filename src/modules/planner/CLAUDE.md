# planner/
> L2 | 父级: ../../CLAUDE.md

大日历模块。延续独立试用的视图身份与笔记契约。
正式运行时复用全局目录、命令台和设置保存入口。
main 注入原卡片与项目 MOC 模板工厂。
本模块不直接依赖 projects 模块。
卡片属性保存时间，MOC 原生任务保存完成状态。
人物 Dataview 检索同一任务，不复制完成状态。

## 成员清单

model.ts: 安排身份、区间、连续七日窗口与重叠布局。
colors.ts: 六色键、人物默认色与卡片回退色。
palette.ts: 详情与弹窗共用六色盘，支持单选与键盘。
viewport.ts: 滚动坐标、双端约束与缩放锚点。
slider.ts: 单行矩形滑块，读数避让手柄。
range.ts: 双端时间适配，15 分钟吸附与不可交叉约束。
markdown.ts: 原模板增量建卡、MOC 原生任务与人物 DQL。
transaction.ts: 原文比较后写入，失败逆序撤销未再编辑的产物。
store.ts: 公开 Vault 索引与写入，MOC 时间优先。
modal.ts: 安排编辑、项目与领域选择、人物颜色归属。
gestures.ts: 点击选择、按住即拖、边缘缩放与取消。
view.ts: 七日画布与单行工具栏，底部配色、关联与操作区。
styles.css: 大日历隔离样式，由正式构建合并交付。
host.ts: 呈现层能力与模板工厂契约，不认识正式 Plugin 实例。
runtime.ts: 命令、协议、视图与事件装配，保存全局 planner 设置。
migration.ts: 首次读取独立试用设置，不写笔记与旧配置。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
