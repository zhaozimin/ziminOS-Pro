# skill/

> L2 | 父级: ../CLAUDE.md

## 成员清单

SKILL.md: 桌面 Agent 的原地安装/升级契约，把当前工作区锁定为唯一笔记库。全新安装先交给 `installer/` 的一键命令（Windows 与 macOS 各一条，读 `.ziminos-install-result.json` 按 ok / upgrade / refused / failed 处理，失败才回到逐条执行）；施工源固定取 Gitee `ziminzhao/zimin-os-v1`：先下载发行版上的 `ziminOS-v{版本}-setup.zip`（版本号从 raw 读 manifest、包从 `releases/download` 取，不需要 Git 与登录，也不碰对未登录请求限流的 `api/v5`；给出 Python 标准库与纯 ASCII 的 PowerShell 两种写法），改两次名归一成 `repo/vault` 与 `repo/fonts`；走不通再 `git clone`。Windows 前置四条与只读文件的清理写法来自一份新电脑上的真机复盘。全新安装交付锁定插件/主题/十三个片段/设置/字体，以及随 ziminOS 放置但不静默安装的第一方 `ziminOS-Eagle-Bridge.eagleplugin`。升级只换程序（含伴侣包）、不动选择与状态；唯一例外是复制前不存在的新片段可按新版默认追加启用，已存在片段的开关一律保留。data.json、运行状态、用户主题/字体/片段、笔记一律保留，任何流程都不得输出可能含凭据的 ziminOS data.json。v0.22.8 起升级回执会引导旧库在 Obsidian 内主动运行存量 MOC 数据库迁移，安装器自身仍不改笔记。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
