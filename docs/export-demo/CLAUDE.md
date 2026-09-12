# docs/export-demo/

> L2 | 父级: ../CLAUDE.md

`docs/导出预览交互演示.html` 的四份真源。那份 HTML 是**生成物**，入库只为让人双击就能看；一个字都不该手改。

这个目录存在的理由只有一句：**示意图会撒谎，生成物不会。** 一张手抄的截图或一份手写的仿真页，在代码改过之后仍然一动不动地讲着旧故事，而且没有任何人会在那一刻发现。所以演示页里三处事实全部来自真源——导出样式逐字取自插件的 `styles.css`，水印几何与装饰逻辑由 esbuild 从 `src/` 直接打包，控件清单在运行时读 `EXPORT_SLIDERS`。改了插件却忘了重新生成，回归会当场变红（见 tests/export.mjs）。

它不进插件构建链：`esbuild.config.mjs` 的入口只有 `src/main.ts`，本目录只由 `npm run demo` 显式调用。

有一处跨仓库的暗礁值得单独记一笔：`entry.ts` 进了 `tsconfig.json` 的 include，而 `publish-v1.sh` 把 tsconfig **同步**给第一版仓库、却把 `docs/` 留在第二版这边。于是第一版拿到的那份 tsconfig 有一条指向不存在路径的 include。实测确认 tsc 对不匹配的 include 项只是忽略（已在缺失该目录的情况下跑过一遍，退出码 0），因此发布通道是安全的——但前提是 `src/**/*.ts` 那条必须留着：include **全部**不匹配时 tsc 会报「找不到输入文件」，整条构建会断在第一版那边，而这边永远是绿的。这正是备案里那次「发布通道静默卡死」的形状，所以它由回归钉住而不是靠人记得。

## 成员清单

entry.ts: 演示页与插件真源之间唯一的接缝，把契约表、几何纯函数与 `applyDecorations` 打成浏览器全局 `ZExport`。它是本目录里唯一进 `tsconfig.json` 的文件——签名被改动或导出被删掉时，`npm run check` 当场报错，而不是等演示页在浏览器里静静地画错。
shell.html: 外壳模板。它只负责把弹窗放进一个像 Obsidian 的环境里：遮罩、Setting 原语的近似外观、明暗两套变量、以及一段写给读者的说明。这里的 CSS 一条都不描述 ziminOS 自己的导出外观——那条边界一旦破，演示页就会长出第二套导出样式，而它与插件的那套迟早不一样。四处 `{{}}` 占位由 build.mjs 填。
driver.js: 演示驱动。v0.30.0 起它**不再自己画控件**——右边那一列由插件真源的 `buildExportPanel` 画出来（那个文件刻意不 import obsidian，正是为了能被搬到这里），于是它与 `modal.ts` 成了同一套交互的两个**骨架**：那边住在 Obsidian 里，这边住在浏览器里，中间那一列是共用的，驱动本身也从 576 行降到 347。它补上 Obsidian 挂在 HTMLElement 上、而 panel 与 decorate 确实用到的那几个便捷方法（createDiv / createSpan / createEl / addClass / removeClass / toggleClass / setText），此外不复制插件的任何判断。真插件的「选择图片」开的是笔记库图片清单，这里换成本机文件选择框，好让读者直接拿自己的 logo 试。点「导出」会走一遍真的进度条（`createProgressBody` 来自插件真源）——**唯一伪造的是每一步之间的时长**，这里没有真的在栅格化；长什么样、怎么走、说什么话全是真的。
build.mjs: 生成器。`buildExportDemo()` 只算出字节不落盘，于是回归可以拿它与入库产物比对而不必先把文件改掉；直接执行时才写出 `docs/导出预览交互演示.html`。占位符替换一律走函数形式的 `replace`——传字符串的话，注入的 CSS 与打包产物里凡是出现 `$&` 或 `$1` 都会被当成回溯引用展开，而那种错的表现是页面某处莫名少了一截。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
