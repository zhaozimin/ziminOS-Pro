# calendar/

> L2 | 父级: ../../CLAUDE.md

中国日历模块。它把“看时间”与“在这个时间坐标上写复盘”接成一个入口：月视图同时显示公历、农历、传统节日、二十四节气、国务院放假与补班；年视图把十二个月按四个季度排开。头部沿用 Dust Calendar 经过验证的时间坐标，年、季、月各有前后箭头，不让一组全局箭头在不同视图里改变含义。点日、ISO 周数、月、季、年，意图交给 main 注入的复盘 opener，真正的目录、模板、幂等创建与防覆盖仍只在 review 模块定义。

调休不是算法，是国务院每年发布的事实。农历换算完全离线，调休则走“内置已核快照 → 本地最后正确缓存 → holiday-cn 三个公开镜像”的降级链。视图打开或切年才检查，没有定时器、没有轮询；24 小时内不重复请求。下一年通知可能影响本年十二月，因此显示一年时同时检查本年与下一标题年。任何响应先整份验形，成功才替换，失败只停在旧数据，不弹窗、不清空。

## 成员清单

holidayTypes.ts: 远端响应、内置快照、磁盘缓存与界面共用的数据边界，只描述国务院通知中的稀疏覆盖日；普通周末不混进这份年度事实。
holidaySnapshot.ts: 已人工核过的 2026 国务院放假安排离线底座，编译进 main.js；它只保首次联网前与断网时仍能显示正确的“休/班”，不承担更新。
model.ts: 零 Obsidian 依赖的日期与农历计算层。生成以周一开头的 ISO 月历行，并用 lunar-typescript 计算农历、传统节日和节气；短标签同时返回分类，供视图突出节日/节气而不反向解析中文文案。
holidays.ts: 唯一联网与落缓存出口。经 Obsidian 公开 requestUrl 依次读取 holiday-cn 的 jsDelivr/Fastly/Raw 镜像，严格校验后写入插件目录的 holiday-cache.json；网络与缓存损坏均静默退回最后正确数据。
view.ts: Obsidian ItemView 呈现与点击编排。v0.30.0 起每一格还回答两个**互不排斥**的事实：这一天（或这一周）的复盘写过了涂绿、今天涂红，两者兼有时红块之上补一枚绿点——今天也可能已经写完，做成三选一就只剩一半信息。写没写过由 main 注入的 CalendarNoteProbe 回答，与 opener 同一条路数：日历不学目录规则，否则全库会有第二处对「日记住哪儿」的理解。重画两条路缺一不可——点一格之后立刻重画（那篇常常已经在了，只是被打开，此时没有任何 vault 事件），以及听 create/delete/rename 防抖 80ms。做这件事的那个方法叫 `openAndRepaint` 而不是 `open`，这三个多余的字是一次事故的赔款（v0.31.0）：`View.prototype` **自己有一个 `open`**，Obsidian 打开视图时调的正是它，而 `obsidian.d.ts` 里一个字都没写——同名方法把宿主那份盖掉，编译期一声不吭，运行期宿主调进来、参数全是 undefined，日历整个开不出来，右侧栏一片空白。**声明文件是宿主答应支持的那一部分，不是它运行时真有的那一部分**；继承宿主的类时，方法名只能取那些不可能是框架词汇的。tests/regression.mjs 的「ItemView 子类不占用宿主自己的成员名」钉住这条。插件启用即注册并默认放进右侧栏，不提供功能开关；年/季/月三组箭头各自修改同一显示坐标，“今”无论从何处出发都回归月视图的当天，“月/年”才是常规视图切换；五级时间点击经 CalendarPeriodOpener 交回 main 装配。

## 模块契约

对外只暴露 registerCalendar 与 CalendarPeriodOpener / CalendarNoteProbe 两个注入契约。calendar 不 import review；main 用 review.openPeriodNote 填洞，日记点击后仍沿用 theme.promptThemeIfMissing 的同一条规则。删掉本模块只损失日历视图、打开命令与 holiday-cache.json，既有五级复盘命令与笔记一字不动。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
