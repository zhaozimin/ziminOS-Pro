<!--
 [INPUT]: 依赖随 ziminOS 交付的 Eagle 伴侣安装包、Obsidian 端配对界面、Range 媒体预览与 Eagle 4.0 Build 18+ 公开 API
 [OUTPUT]: 对学员和调试者说明伴侣安装、配对、容器/日记归档、图片/视频呈现、当前文件夹定位、打开手势与安全边界
 [POS]: eagle-companion 的运行说明，与面向学员的 docs HTML 手册同源但服务伴侣源码读者
 [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# ziminOS Obsidian Bridge

这是 ziminOS 的 Eagle 后台伴侣，不是第二个 Obsidian 插件。它负责让 Obsidian 端通过稳定的 Eagle `itemId` 导入、显示并打开附件。

## 安装与配对

1. 在 Obsidian 的「设置 → ziminOS → 编辑 → Eagle 附件」点「显示安装包」，双击或拖入 Eagle 安装 `ziminOS-Eagle-Bridge.eagleplugin`。开发者调试源码时才从 Eagle「插件 → 开发者选项」导入本目录。
2. 打开伴侣，记下 6 位配对码。
3. 在 Obsidian 打开「设置 → ziminOS → 编辑 → Eagle 附件」，确认端口一致，点击「配对」并输入配对码。
4. 默认由 Eagle 接管图片与其他附件。如果图片要继续走已有图床，保持图床插件启用，并在 ziminOS 打开「图片不交给 Eagle（交给图床）」；单独粘贴图片验证。

配对成功后，由 Eagle 接管的附件只存入当前 Eagle 资源库；Markdown 写入 `ziminos-eagle://v1/primary/{itemId}`。在 ziminOS 的项目、领域、资源或存档根目录中，伴侣会按笔记所在的第一层容器创建或复用 `项目/容器名`；所有日/周/月/季/年日记则共用 Eagle 的单一 `日记` 根目录。用 ziminOS 的「修改当前项目或领域名称」时，若已配对 Eagle，这一层附件文件夹也会同步改名；重名或存在多个同名根时伴侣会拒绝猜测并明示报错。内容根下直接散落的笔记与其他路径不猜归属，仍走 Obsidian 设置中的可选固定文件夹 ID，留空即未归类。同一资源库内移动附件或文件夹不会改变 `itemId`，因此不需要更新笔记。若切换了 Eagle 资源库或移动了整个资源库目录，请重新配对。

v0.39.2 的大视频预览需要 Obsidian 与 Eagle 两端同时支持。升级时必须用「显示安装包」定位的同版 `.eagleplugin` 覆盖安装伴侣；旧伴侣不会回退整文件读取，而会明确要求升级。

新导入的 MP4、WebM 与 MOV 会写成 Markdown 嵌入，并在正文显示原生播放器。媒体元素只按需读取本机 Range，不把整段视频送进 Obsidian 主进程。已有普通视频链接前加 `!` 即可启用播放器。视频普通单击播放；macOS 用 `⌘ + 单击`、Windows 用 `Ctrl + 单击`或右键菜单在 Eagle 打开。

点击链接时，伴侣会按 `itemId` 查询附件此刻所属的文件夹，恢复最小化的 Eagle 主窗口，打开该文件夹并选中附件。因此在 Eagle 内手工搬动附件后，下次点击会直接进入新文件夹，Markdown 仍无需更新。若 Eagle 已完全退出，Obsidian 端会先用系统原生 `eagle://item/{itemId}` 深链启动 Eagle，再在约 10 秒的有界窗口内等待伴侣就绪并完成文件夹定位；不会开启后台轮询。

## 安全边界

- HTTP 服务只绑定 `127.0.0.1`，默认端口 `23119`。
- 除一次性配对外，控制请求都要求 256 位配对令牌。媒体读取改用另一个只读单附件、可撤销、四小时无访问即失效的 256 位票据。
- Obsidian 配对令牌保存在官方 `SecretStorage`，Eagle 配对令牌保存在插件本机存储；两者都不写入笔记、`data.json`、URL 或日志。媒体 URL 只携带临时单附件票据，不携带配对令牌。
- 资源操作只调用 Eagle 官方 `item` 与 `folder` API；不直接修改 `metadata.json` 或资源库内部文件。

若断开时 Eagle 伴侣不在线，Obsidian 会先清掉本机令牌，并提醒你稍后在伴侣窗口手动移除旧授权。

运行要求：Eagle 4.0 Build 18 或更高；macOS 与 Windows。
