# eagle/

> L2 | 父级: ../../CLAUDE.md

Eagle 附件桥接的 Obsidian 半边。这里不是第二个 Obsidian 插件：它就是 ziminOS 内部一个桌面增强模块，与根目录 `eagle-companion/` 的 Eagle 后台伴侣组成一个产品、两个运行时。分开是平台边界，不是产品边界。

笔记只保存 `ziminos-eagle://v1/{libraryKey}/{itemId}`：`itemId` 是 Eagle 项目的稳定身份，文件夹、真实路径、服务端口都属于可变的设备状态，不进 Markdown。所以在同一 Eagle 资源库里移动附件，Obsidian 链接不需要更新；整个资源库换了路径时只重新配对。

安全边界是硬的：伴侣只监听 `127.0.0.1`，除配对外的端点全部要本机令牌；Obsidian 端令牌只进官方 `SecretStorage`，不进会同步的 `data.json`。断开时若伴侣离线，本机照样清令牌，但必须告诉用户 Eagle 端旧授权仍需手动移除。事件一经接管就 fail closed：Eagle 导入失败时告诉用户，绝不偷偷退回 Obsidian 本地附件。

## 成员清单

protocol.ts: 两端共同的身份语法，构建/严格解析 v1 URI、计算 Markdown/YAML 里的点击命中区间、生成附件链接并区分图片嵌入与普通链接。
platform.ts: 唯一平台闸门，只有 macOS/Windows 的 Obsidian 桌面端能注册桥接；移动端与 Linux 不出现半套运行时。
client.ts: 唯一 HTTP 出境口，以 Obsidian `requestUrl` 访问回环伴侣，在官方 `SecretStorage` 中持有配对令牌，不向上游泄漏端口、请求头或响应形状。
transfer.ts: 附件写入边界，在第一个异步操作前拦下粘贴/拖放，将内存 File 短暂物化到系统临时目录，导入成功后用身份链接替换占位符。
editor.ts: CodeMirror 交互适配层，把实时预览/源码模式/YAML 属性区的 ⌘/Ctrl+单击还原成当前行的稳定身份；同一个近邻 DOM 提取函数交给 render 在捕获阶段处理会自行截断事件的 YAML 控件，不抢占用于编辑的普通单击。
render.ts: 附件呈现与窗口生命周期边界，阅读视图与实时预览通过伴侣读取内容并生成临时 blob URL，并装配 editor 扩展；离开 DOM 即释放 blob。
index.ts: 局部装配点，把 client/transfer/render 连起来，对 main 交回配对、检测、断开、状态说明与显示伴侣安装包五个设置动作。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
