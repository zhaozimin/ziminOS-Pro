# ziminOS Obsidian Bridge

这是 ziminOS 的 Eagle 后台伴侣，不是第二个 Obsidian 插件。它负责让 Obsidian 端通过稳定的 Eagle `itemId` 导入、显示并打开附件。

## 安装与配对

1. 在 Obsidian 的「设置 → ziminOS → 编辑 → Eagle 附件」点「显示安装包」，双击或拖入 Eagle 安装 `ziminOS-Eagle-Bridge.eagleplugin`。开发者调试源码时才从 Eagle「插件 → 开发者选项」导入本目录。
2. 打开伴侣，记下 6 位配对码。
3. 在 Obsidian 打开「设置 → ziminOS → 编辑 → Eagle 附件」，确认端口一致，点击「配对」并输入配对码。
4. 关闭其他会接管附件粘贴的图床/附件插件，再复制粘贴一张图片验证。

配对成功后，图片和附件只存入当前 Eagle 资源库；Markdown 写入 `ziminos-eagle://v1/primary/{itemId}`。同一资源库内移动附件或文件夹不会改变 `itemId`，因此不需要更新笔记。若切换了 Eagle 资源库或移动了整个资源库目录，请重新配对。

## 安全边界

- HTTP 服务只绑定 `127.0.0.1`，默认端口 `23119`。
- 除一次性配对外，所有读取和写入都要求 256 位随机令牌。
- Obsidian 令牌保存在官方 `SecretStorage`，Eagle 令牌保存在插件本机存储；两者都不写入笔记、`data.json`、URL 或日志。
- 资源操作只调用 Eagle 官方 `item` API；不直接修改 `metadata.json` 或资源库内部文件。

若断开时 Eagle 伴侣不在线，Obsidian 会先清掉本机令牌，并提醒你稍后在伴侣窗口手动移除旧授权。

运行要求：Eagle 4.0 Build 12 或更高；macOS 与 Windows。
