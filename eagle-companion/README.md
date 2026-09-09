<!--
 [INPUT]: 依赖随 ziminOS 交付的 Eagle 伴侣安装包、Obsidian 端配对界面与 Eagle 4.0 Build 18+ 公开 API
 [OUTPUT]: 对学员和调试者说明伴侣安装、配对、容器/日记归档、当前文件夹定位、打开手势与安全边界
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

配对成功后，由 Eagle 接管的附件只存入当前 Eagle 资源库；Markdown 写入 `ziminos-eagle://v1/primary/{itemId}`。在 ziminOS 的项目、领域、资源或存档根目录中，伴侣会按笔记所在的第一层容器创建或复用 `项目/容器名`；所有日/周/月/季/年日记则共用 Eagle 的单一 `日记` 根目录。内容根下直接散落的笔记与其他路径不猜归属，仍走 Obsidian 设置中的可选固定文件夹 ID，留空即未归类。同一资源库内移动附件或文件夹不会改变 `itemId`，因此不需要更新笔记。若切换了 Eagle 资源库或移动了整个资源库目录，请重新配对。

v0.22.9 的当前文件夹定位与既有容器/日记路由都需要 Obsidian 与 Eagle 两端同时支持。升级时必须用「显示安装包」定位的同版 `.eagleplugin` 覆盖安装伴侣；旧伴侣不会被当成已完成文件夹定位。

点击链接时，伴侣会按 `itemId` 查询附件此刻所属的文件夹，恢复最小化的 Eagle 主窗口，打开该文件夹并选中附件。因此在 Eagle 内手工搬动附件后，下次点击会直接进入新文件夹，Markdown 仍无需更新。若 Eagle 已完全退出，Obsidian 端会先用系统原生 `eagle://item/{itemId}` 深链启动 Eagle，再在约 10 秒的有界窗口内等待伴侣就绪并完成文件夹定位；不会开启后台轮询。

## 安全边界

- HTTP 服务只绑定 `127.0.0.1`，默认端口 `23119`。
- 除一次性配对外，所有读取和写入都要求 256 位随机令牌。
- Obsidian 令牌保存在官方 `SecretStorage`，Eagle 令牌保存在插件本机存储；两者都不写入笔记、`data.json`、URL 或日志。
- 资源操作只调用 Eagle 官方 `item` 与 `folder` API；不直接修改 `metadata.json` 或资源库内部文件。

若断开时 Eagle 伴侣不在线，Obsidian 会先清掉本机令牌，并提醒你稍后在伴侣窗口手动移除旧授权。

运行要求：Eagle 4.0 Build 18 或更高；macOS 与 Windows。
