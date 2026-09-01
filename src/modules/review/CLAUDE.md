# src/modules/review/

> L2 | 父级: ../../CLAUDE.md

复盘模块。它用确定性日期算术取代 Templater + 日历插件 + 五份分发型模板：文件名、目录、导航链接、周期锚点与区间归属都从日期推出。中国日历不重写这套坐标系，只把点击产生的周期与锚点日期交给本模块。

它的主线是 **日主题 → 周主题 → 月主题 → 季主题 → 年主题**。学员在日记里写一次结论，其余四级是它的投影；项目横向数据再回答这个周期里什么真的动了。

## 成员清单

templates.ts: 五级笔记的唯一正文生成器，同时导出 viewBlock。模板只交付标题与留白：天气块因多网络依赖删除，theme 保持空白，方法论提问收进 README，不在每篇笔记里重复。
periodic.ts: 五级周期的入口与坐标系。「不存在就建，空文件就补骨架，有内容就不动」是它的幂等姿态。openPeriodNote 的 options 同时控制 reveal 与可选 day 锚点：记人情用 reveal=false 静默补日记，日历用 day 打开被点日期所属的日/周/月/季/年记录。它不写 daily-notes.json，避免核心日记插件造出无模板的空白岔路。
theme.ts: 主题链的唯一录入口。promptThemeIfMissing 只在 theme 去空白后仍为空时询问；「写复盘主题」是显式修改入口。日历打开历史日记时，提问使用该日文件名而不伪称「今天」。
views.ts: 主题链的两个自动视图（今日产出、主题链）。缺记录必须显式留空，不得用 0 伪装成一份已写的结果。
projectViews.ts: 项目数据汇入复盘的三个视图（项目动态、完成的项目、年度全景）。它们认 CONTAINER_TYPES（project + book），因为一本书也是有终点、可归档的项目。往年数据不把今日 status 伪装成当年快照。
seed.ts: 开荒贡献，只声报日记目录；不预建空日记，避免时间轴出现假记录。

## 年度口径

年度全景里“仍在进行”的耗时一律截到今天；未来年末只是视图边界，不是已经发生的时间。往年仍明确提示状态字段只能表达当前事实，既不把今天的状态冒充历史快照，也不把尚未来到的天数计入执行时长。

## 模块契约

对外暴露 reviewSeed、registerPeriodicCommands、registerThemeCommand、promptThemeIfMissing、openPeriodNote 与两个视图数组。main.ts 注入「日记打开后」回调与日历点击，防止 periodic.ts、theme.ts、calendar 互相 import。

**周归属月一律按 ISO 惯例以周四为准。** 每周只归一个月，不重不漏。日记刻意不写 period_start，因为文件名已是日期事实源。

「本周期完成了哪些项目」以 MOC 的 archived 为准，只在兼容 V2 存量笔记时回落 updated。projects 模块若不在状态流转时同步写 archived，月/季复盘会静默算错。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
