# eagle-companion/

> L2 | 父级: ../CLAUDE.md

ziminOS Eagle 附件桥接的 Eagle 半边，以后台服务插件随 Eagle 启动。它与 `src/modules/eagle/` 是一个产品的两个运行时：Obsidian 半边决定何时接管粘贴与 Markdown 写什么，这一边通过 Eagle 官方 API 执行导入、Range 流式预览、打开附件当前文件夹并选中附件。

安全模型：服务只绑定 `127.0.0.1`，一次性 6 位码换取 256 位配对令牌；控制端点同时验令牌、逻辑库标识与实体资源库路径。媒体 GET 只接受另一个 256 位单附件临时票据，并重复核对客户与实体库路径。切换或搬动资源库后只允许重新配对，绝不猜测“可能还是同一库”。

库身份校验覆盖目录队列开始及每次 Eagle 异步 API 返回后的继续执行点：用户在请求等待期间切库，后续建目录、导入、读取和打开都会中止。已经交给 Eagle 的单次 API 由宿主完成，伴侣不假装能锁定资源库或回滚宿主。导入原路径不裁剪空白，避免合法文件名被改成另一个源文件。

## 成员清单

manifest.json: Eagle 插件入口，`platform/arch: all`，`serviceMode: true`，运行时覆盖 macOS 与 Windows。
logo.png: 256×256 透明底安装图标，以纸页、z 形桥与翼形表达 Obsidian ↔ Eagle，只服务插件面板识别。
index.html: 最小界面骨架，先加载媒体边界，再启动服务层；放置配对、端口、客户清单与反向查找四块显式操作。
styles.css: 纯呈现层，跟随运行时深浅色，错误和失配状态都保留文字而不只靠颜色。
js/media.js: 媒体流执行层，单附件票据只读一个 item；四小时无请求失效，DOM 离开、断开配对或伴侣退出立即撤销；每次读取重验客户与实体库路径，浏览器通过 Range 按需取视频字节。
js/service.js: 回环 HTTP 与 Eagle 执行层，托管生命周期、配对令牌、Eagle 官方 item/folder/app API 与 Obsidian URI 反向搜索；内容容器与日记导入各用独立端点，先在同一队列串行创建或复用严格的 `项目/容器名` 两级目录或顶层 `日记`，再把 ID 交给 item API，重名歧义直接中止；`/v1/projects/rename` 精确改唯一的旧名子目录；打开时按 itemId 现查 folders，先恢复主窗口，再打开目录并选中附件。
README.md: 独立安装、配对、移动语义与安全边界，可随 Eagle 插件包交给审核人员与用户。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
