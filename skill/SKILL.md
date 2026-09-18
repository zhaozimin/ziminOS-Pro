---
name: ziminos-vault-setup
description: 在用户已经创建并命名一个文件夹、再用桌面 Agent 打开该文件夹后，根据 ziminOS GitHub / Gitee 官方镜像把当前工作区原地搭建或升级为 Obsidian 个人知识管理笔记库。用户发送仓库地址并说「按照这个仓库搭建我的个人知识管理系统」「搭建/开荒 Obsidian 笔记库」「安装/更新 ziminOS」时使用；不询问名称或安装路径，不创建子级笔记库，不把源码仓库克隆到当前工作区。
---

# ziminOS 当前工作区安装

把 Agent 当前打开的工作区视为最终 Obsidian 笔记库。用户已经在打开工作区之前完成了文件夹创建与命名，不要再替他创建另一层目录。

## 成功模型

安装前：

```text
文件夹 A/    ← 用户已创建、已命名、桌面 Agent 正在这里工作
```

全新安装后、尚未在 Obsidian 内初始化时：

```text
文件夹 A/    ← 仍是同一个目录
├── .obsidian/
└── README.md
```

用户随后直接用 Obsidian 打开文件夹 A。不得生成 `文件夹 A/另一个名称/`，也不得让用户打开源码仓库里的 `vault/`。

## 一、锁定当前工作区

把当前工作目录的真实绝对路径记为唯一目标：

```bash
vault_root="$(pwd -P)"
```

不要询问系统名称或安装位置。当前目录的文件夹名就是用户已经确定的系统名称；不要重命名它，也不要在里面新建笔记库子目录。

执行只读安全检查：

1. 若当前目录是 `/`、用户主目录、“文档/Documents”根目录、桌面根目录或其他宽泛目录，停止并让用户重新用 Agent 打开专门创建的文件夹 A。
2. 若当前目录含 `src/`、`vault/`、`skill/` 和 `package.json` 等 ziminOS 源码仓库特征，说明 Agent 打开错了目录，停止；不要把源码仓库改造成笔记库。
3. 若当前目录不存在 `.obsidian/plugins/ziminos/`，则除系统自动生成的 `.DS_Store` 与智能体自己点开头的配置目录外必须为空；非空就停止，不覆盖任何文件。
4. 若当前目录已经存在 `.obsidian/plugins/ziminos/`，进入升级模式。

### 全新安装：先交给安装脚本

上面第 3 条判定为全新安装时，**先运行下面这一条命令，不要逐条执行后面的步骤。** 安装脚本在一条命令里做完取包、校验、铺库、装字体、自检与清理——比逐条执行快得多，也不会因为某台电脑缺某个命令而卡住。一台新的 Windows 电脑上逐条执行曾经花掉二十多分钟，时间全耗在试工具上。

Windows（在 PowerShell、cmd 或 Git Bash 里都原样运行；命令里没有 `$`，哪种命令行都不会改写它）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=3072; iwr -useb https://gitee.com/ziminzhao/zimin-os-v1/raw/main/installer/install.ps1 -OutFile ([IO.Path]::GetTempPath()+'ziminos-install.ps1'); & ([IO.Path]::GetTempPath()+'ziminos-install.ps1') -Edition free"
```

macOS：

```bash
curl -fsSL https://gitee.com/ziminzhao/zimin-os-v1/raw/main/installer/install.sh -o /tmp/ziminos-install.sh && bash /tmp/ziminos-install.sh free
```

第一次运行时，Windows 会先下载一个 11 MB 的便携 Python（没装开发者工具的 Mac 是 17 MB），以后复用。整个过程通常在一两分钟内，主要看网速；**等它自己结束，不要中途重跑。**

结束后读当前文件夹里的 `.ziminos-install-result.json`（看不见命令输出时也读它），按 `status` 办：

| `status` | 意思 | 你做什么 |
| --- | --- | --- |
| `ok` | 装好了，而且每个文件都与安装包逐字节核对过 | 删掉这个结果文件，直接按第六节交付给用户，并把结果里的 `version` 报给他 |
| `upgrade` | 这里已经装过 ziminOS | 删掉结果文件，按第三节的「升级」分支执行（从第二节取得施工源开始） |
| `refused` | 文件夹不安全或不是空的，`message` 写着原因 | 把 `message` 原话告诉用户，停下来，不要换办法绕过去 |
| `failed` | 取包、校验或自检没过，`error` 或 `problems` 写着卡在哪 | 脚本已经撤掉了它写进文件夹的东西。删掉结果文件，从第二节起逐条执行；把 `error` 一并告诉用户 |

命令本身报错、没有生成结果文件时，按 `failed` 处理。

## 二、在工作区外取得施工源

官方施工源有两个同步镜像：GitHub `zhaozimin/ziminOS` 与 Gitee `ziminzhao/zimin-os-v1`。发行包目前只挂在 Gitee，因此**先走取法一，走不通再走取法二**；需要 clone 时，用户若明确给了 GitHub 或 Gitee 链接就沿用同一平台，没给链接时优先 Gitee。两种取法最后都得到同一个 `$install_staging_dir/repo`（含 `vault/` 与 `fonts/`），把它记为施工源，下文每一步只认它。

一律在当前工作区之外的系统临时目录里做（macOS / Linux 的 `/tmp`，Windows 的 `%TEMP%`），临时目录名以 `ziminos-install.` 开头，第五节清理时只认这个名字。禁止在 `$vault_root` 内下载、解压或克隆，禁止把仓库根目录复制进 `$vault_root`。

### 在 Windows 上，动手前先读这四条

1. **下文命令用 bash 书写只为好读；Windows 上请用 Python 标准库（`urllib` / `zipfile` / `shutil` / `json`）或 PowerShell 完成同样的事，不要去修 bash。** 智能体自带的 bash 常常是精简版：只有 bash 本体，没有 `ls`、`cp`、`tail`、`unzip`，也找不到 `git`。为它补 PATH、找工具，是这类安装最大的时间黑洞。
2. **PowerShell 的输出看不见时**（有些智能体的沙箱会吞掉它），把结果写进临时目录里的日志文件再读，不要反复重跑同一条命令。
3. **不要在命令后面接 `| tail`、`| head`。** 缺一个小工具，整条管道会被连带杀掉，只留下一半的文件。
4. **不走取法二就不需要 Git。** 取法一只要能发一次 HTTPS 请求、能解开一个 zip，Python 与 PowerShell 都自带这两样。

### 取法一：下载 Gitee 发行版上的安装包（首选，不需要 Git，也不需要登录）

1. 读 `https://gitee.com/ziminzhao/zimin-os-v1/raw/main/vault/.obsidian/plugins/ziminos/manifest.json`，取出 `version`（例如 `0.33.0`）。
2. 下载 `https://gitee.com/ziminzhao/zimin-os-v1/releases/download/v版本号/ziminOS-v版本号-setup.zip`。返回 404 说明这一版的包还没挂上发行版，直接改走取法二，不要换别的下载办法去试。
3. 核对下载结果：几十 MB，开头两个字节是 `PK`。
4. 解到临时目录里，得到 `ziminOS-v版本号-setup/`。这是给人手动安装的形态，**改两次名就是下文要的仓库形态**：`ziminOS-v版本号-setup/ziminOS` → `$install_staging_dir/repo/vault`，`ziminOS-v版本号-setup/字体` → `$install_staging_dir/repo/fonts`。包里另外的 `升级文件/`、`许可证/`、`安装说明.html` 不参与安装。

**不要用 `api/v5` 开头的开放接口去找发行版。** 它对未登录的请求限流，同一个出口 IP 下请求一多就返回 `403 Rate Limit Exceeded`——一间教室的学员同时安装、或者智能体多重试几次，都会撞上。上面两个地址走的是网页与文件通道，不受这个限制。

Python 标准库写法，macOS、Linux、Windows 通用：

```python
import json, os, shutil, tempfile, urllib.error, urllib.request, zipfile

REPO = "https://gitee.com/ziminzhao/zimin-os-v1"
with urllib.request.urlopen(REPO + "/raw/main/vault/.obsidian/plugins/ziminos/manifest.json", timeout=60) as response:
    version = json.load(response)["version"]
name = "ziminOS-v%s-setup" % version

install_staging_dir = tempfile.mkdtemp(prefix="ziminos-install.")
archive = os.path.join(install_staging_dir, name + ".zip")
try:
    with urllib.request.urlopen("%s/releases/download/v%s/%s.zip" % (REPO, version, name), timeout=120) as response, \
            open(archive, "wb") as out:
        shutil.copyfileobj(response, out)
except urllib.error.HTTPError as error:
    raise SystemExit("发行版上取不到 %s.zip（HTTP %s），改走取法二" % (name, error.code))

with open(archive, "rb") as handle:
    if handle.read(2) != b"PK":
        raise SystemExit("下载到的不是 zip，改走取法二")
with zipfile.ZipFile(archive) as z:
    z.extractall(install_staging_dir)

package = os.path.join(install_staging_dir, name)
os.makedirs(os.path.join(install_staging_dir, "repo"))
os.rename(os.path.join(package, "ziminOS"), os.path.join(install_staging_dir, "repo", "vault"))
os.rename(os.path.join(package, "字体"), os.path.join(install_staging_dir, "repo", "fonts"))
print(version, os.path.join(install_staging_dir, "repo"))
```

没有 Python 时用 PowerShell（Windows 自带）。前两行不能省：旧系统默认的 TLS 版本连不上 Gitee，而下载进度条会把几十 MB 的下载拖慢十倍以上。版本号那个文件是 `text/plain`，要用 `ConvertFrom-Json` 自己解析；字体文件夹按「里面装着 `.ttf` 的那个」认，命令里不写中文——PowerShell 5.1 读无 BOM 的 UTF-8 脚本会把中文读成乱码：

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$repo = 'https://gitee.com/ziminzhao/zimin-os-v1'
$manifest = Invoke-WebRequest "$repo/raw/main/vault/.obsidian/plugins/ziminos/manifest.json" -UseBasicParsing
$version = ($manifest.Content | ConvertFrom-Json).version
$name = "ziminOS-v$version-setup"
$install_staging_dir = Join-Path $env:TEMP ('ziminos-install.' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item (Join-Path $install_staging_dir 'repo') -ItemType Directory | Out-Null
$archive = Join-Path $install_staging_dir "$name.zip"
Invoke-WebRequest "$repo/releases/download/v$version/$name.zip" -OutFile $archive -UseBasicParsing
Expand-Archive $archive -DestinationPath $install_staging_dir
$package = Join-Path $install_staging_dir $name
Move-Item (Join-Path $package 'ziminOS') (Join-Path $install_staging_dir 'repo\vault')
$fonts = Get-ChildItem $package -Directory | Where-Object { Get-ChildItem $_.FullName -Filter *.ttf } | Select-Object -First 1
Move-Item $fonts.FullName (Join-Path $install_staging_dir 'repo\fonts')
```

下载那一行报 404，同样改走取法二。

**这两件事都有人试过，每一件都白白花掉十分钟，不要做：**

- 不要下载仓库的「下载 ZIP」地址（`…/repository/archive/…zip`）：未登录拿到的是一张几十 KB 的 HTML 跳转页，带什么请求头都一样。
- 不要用 raw 地址或文件树接口逐个文件拼仓库：大字体文件返回 403，个别文件返回 451，永远拼不全。（取法一第 1 步只读一个 `manifest.json` 取版本号，不在此列。）

### 取法二：git clone（取法一走不通时）

用户从 GitHub 进入时：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
git clone --depth 1 "https://github.com/zhaozimin/ziminOS.git" "$install_staging_dir/repo"
```

用户从 Gitee 进入，或没有指定平台时：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
git clone --depth 1 "https://gitee.com/ziminzhao/zimin-os-v1.git" "$install_staging_dir/repo"
```

两条命令只运行一条；它们是同一版次的镜像，不是两套产品。Windows 上找不到 `git` 时，先看智能体自带的 PortableGit：`git.exe` 常常在它的 `cmd\` 目录里，而不在只放了 bash 的 `bin\` 里，用绝对路径调用即可。当前镜像克隆失败时可以尝试同一版次的另一个官方镜像；两个都走不通就说明情况、停下来。

确认下面的系统交付文件都存在：

```text
施工源/vault/.obsidian/plugins/ziminos/manifest.json
施工源/vault/.obsidian/plugins/ziminos/main.js
施工源/vault/.obsidian/plugins/ziminos/styles.css
施工源/vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin
施工源/vault/.obsidian/plugins/dataview/manifest.json
施工源/vault/.obsidian/plugins/dataview/main.js
施工源/vault/.obsidian/plugins/dataview/styles.css
施工源/vault/.obsidian/plugins/dataview/LICENSE.txt
施工源/vault/.obsidian/plugins/dataview/SOURCE.md
施工源/vault/.obsidian/plugins/obsidian-outliner/manifest.json
施工源/vault/.obsidian/plugins/obsidian-outliner/main.js
施工源/vault/.obsidian/plugins/obsidian-outliner/styles.css
施工源/vault/.obsidian/plugins/obsidian-outliner/LICENSE
施工源/vault/.obsidian/plugins/obsidian-outliner/SOURCE.md
施工源/vault/.obsidian/plugins/obsidian-quiet-outline/manifest.json
施工源/vault/.obsidian/plugins/obsidian-quiet-outline/main.js
施工源/vault/.obsidian/plugins/obsidian-quiet-outline/styles.css
施工源/vault/.obsidian/plugins/obsidian-quiet-outline/LICENSE
施工源/vault/.obsidian/plugins/obsidian-quiet-outline/SOURCE.md
施工源/vault/.obsidian/plugins/obsidian-style-settings/manifest.json
施工源/vault/.obsidian/plugins/obsidian-style-settings/main.js
施工源/vault/.obsidian/plugins/obsidian-style-settings/styles.css
施工源/vault/.obsidian/plugins/obsidian-style-settings/data.json
施工源/vault/.obsidian/plugins/obsidian-style-settings/LICENSE.md
施工源/vault/.obsidian/plugins/obsidian-style-settings/SOURCE.md
施工源/vault/.obsidian/themes/Minimal/manifest.json
施工源/vault/.obsidian/themes/Minimal/theme.css
施工源/vault/.obsidian/themes/Minimal/LICENSE
施工源/vault/.obsidian/snippets/ziminos-quote-semantic-colors.css
施工源/vault/.obsidian/snippets/【PDF】列表参考线.css
施工源/vault/.obsidian/snippets/【文件】二级文件夹前缀LOGO.css
施工源/vault/.obsidian/snippets/【文件】彩虹文件夹（引导线版）.css
施工源/vault/.obsidian/snippets/【文件】文件图标前缀.css
施工源/vault/.obsidian/snippets/【笔记属性】自动伸缩.css
施工源/vault/.obsidian/snippets/【编辑】当前行高亮（阴影）.css
施工源/vault/.obsidian/snippets/【编辑-删除线】突出废弃内容.css
施工源/vault/.obsidian/snippets/【编辑-Baes】隐藏新建按钮.css
施工源/vault/.obsidian/snippets/【编辑-代码块】增加行号.css
施工源/vault/.obsidian/snippets/【编辑-代码块】水平滑轮.css
施工源/vault/.obsidian/snippets/【编辑-图片】居中显示.css
施工源/vault/.obsidian/snippets/【编辑-水平线】中间图标.css
施工源/vault/.obsidian/types.json
施工源/vault/.obsidian/.gitignore
施工源/vault/.obsidian/app.json
施工源/vault/.obsidian/templates.json
施工源/vault/.obsidian/community-plugins.json
施工源/vault/.obsidian/appearance.json
施工源/fonts/lxgw-wenkai-gb-screen/LXGWWenKaiGBScreen.ttf
施工源/fonts/lxgw-wenkai-gb-screen/OFL.txt
施工源/fonts/source-han-serif-cn/SourceHanSerifCN-Regular.otf
施工源/fonts/source-han-serif-cn/SourceHanSerifCN-Bold.otf
施工源/fonts/source-han-serif-cn/LICENSE.txt
施工源/fonts/zhuque-fangsong/ZhuqueFangsong-Regular.ttf
施工源/fonts/zhuque-fangsong/LICENSE.txt
施工源/fonts/lxgw-neo-xihei-plus/LXGWNeoXiHeiPlus.ttf
施工源/fonts/lxgw-neo-xihei-plus/LICENSE.md
施工源/fonts/lxgw-neo-xihei-plus/LICENSE_CHS.md
```

这十三个片段的文件名带【】与中文，复制时一律用引号包住路径；扩展名必须是小写 `.css`，大写的 `.CSS` Obsidian 的片段加载器认不出来。

`.obsidian/.gitignore` 是随库落地的隐私护栏：即使学员以后在笔记库里初始化 Git，也不会把微信读书 Cookie、工作区状态和本机运行缓存提交出去。最后四份则是笔记库的开箱设置，别当成可有可无的杂项：`app.json` 定下附件落在 `./附件`、粘链接用 wiki 语法并自动跟着改名；`templates.json` 把模板目录指向 `90-system/Template`，缺了它学员打开核心「模板」插件后得自己去翻路径；`community-plugins.json` 决定三个系统插件是否启用；`appearance.json` 决定主题与十一个默认启用的片段。

取法一的安装包在打包时已经按这份清单逐项核对过；改完名之后 `repo/fonts/` 下是平铺的五个字体文件，许可证留在包里的 `许可证/`，不参与安装。因此取法一核对 `repo/vault/` 下的每一项与五个字体文件名即可，取法二逐项核对全部条目。

任一缺失就停止并说明仓库不完整。ziminOS（含左侧边栏命令坞、三十六枚命令图标与三枚设置页专用图标，图标 SVG 已编进 `main.js`）、Dataview、Outliner、Quiet Outline、Minimal 与 Style Settings 的运行产物已全部在 `vault/` 中，四款正文字体已全部锁定在 `fonts/` 中；可选的第一方 Eagle 伴侣包也已经随 ziminOS 插件交付，安装器只复制它，**不得替用户静默安装或启动 Eagle 插件**。不要运行 `npm install` / `npm run build`，不要安装 Node.js，也不要去 Obsidian 商店或网络另行下载主题/插件、图标包或字体。禁止额外安装 QuickAdd、Linter 等非系统组件。

## 三、原地搭建当前工作区

### 全新安装

只把施工源中 `vault/` 的内部内容复制到当前工作区根目录，包括隐藏的 `.obsidian`：

```bash
cp -R "$install_staging_dir/repo/vault/." "$vault_root/"
```

这里的 `/.` 不得省略。禁止复制仓库根目录，禁止生成 `$vault_root/vault/`，禁止生成任何以用户系统名称命名的子目录。

### 升级

先读取新旧 ziminOS `manifest.json` 的版本号。若目标已有 **ziminOS**、Dataview、Style Settings、Outliner 或 Quiet Outline 的 `data.json`，分别记录 SHA-256；验证阶段必须证明这些用户设置一个字节都未变。ziminOS 那份尤其要先记下来——它装着学员的侧边栏摆放与全部设置。

先补齐目录，再只更新明确归 ziminOS 管理的运行文件：

```bash
mkdir -p "$vault_root/.obsidian/plugins/ziminos"
mkdir -p "$vault_root/.obsidian/plugins/dataview"
mkdir -p "$vault_root/.obsidian/plugins/obsidian-outliner"
mkdir -p "$vault_root/.obsidian/plugins/obsidian-quiet-outline"
mkdir -p "$vault_root/.obsidian/plugins/obsidian-style-settings"
mkdir -p "$vault_root/.obsidian/themes/Minimal"
mkdir -p "$vault_root/.obsidian/snippets"

cp "$install_staging_dir/repo/vault/.obsidian/plugins/ziminos/manifest.json" "$vault_root/.obsidian/plugins/ziminos/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/ziminos/main.js" "$vault_root/.obsidian/plugins/ziminos/main.js"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/ziminos/styles.css" "$vault_root/.obsidian/plugins/ziminos/styles.css"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin" "$vault_root/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin"

cp "$install_staging_dir/repo/vault/.obsidian/plugins/dataview/manifest.json" "$vault_root/.obsidian/plugins/dataview/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/dataview/main.js" "$vault_root/.obsidian/plugins/dataview/main.js"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/dataview/styles.css" "$vault_root/.obsidian/plugins/dataview/styles.css"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/dataview/LICENSE.txt" "$vault_root/.obsidian/plugins/dataview/LICENSE.txt"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/dataview/SOURCE.md" "$vault_root/.obsidian/plugins/dataview/SOURCE.md"

cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-outliner/manifest.json" "$vault_root/.obsidian/plugins/obsidian-outliner/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-outliner/main.js" "$vault_root/.obsidian/plugins/obsidian-outliner/main.js"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-outliner/styles.css" "$vault_root/.obsidian/plugins/obsidian-outliner/styles.css"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-outliner/LICENSE" "$vault_root/.obsidian/plugins/obsidian-outliner/LICENSE"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-outliner/SOURCE.md" "$vault_root/.obsidian/plugins/obsidian-outliner/SOURCE.md"

cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-quiet-outline/manifest.json" "$vault_root/.obsidian/plugins/obsidian-quiet-outline/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-quiet-outline/main.js" "$vault_root/.obsidian/plugins/obsidian-quiet-outline/main.js"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-quiet-outline/styles.css" "$vault_root/.obsidian/plugins/obsidian-quiet-outline/styles.css"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-quiet-outline/LICENSE" "$vault_root/.obsidian/plugins/obsidian-quiet-outline/LICENSE"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-quiet-outline/SOURCE.md" "$vault_root/.obsidian/plugins/obsidian-quiet-outline/SOURCE.md"

cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-style-settings/manifest.json" "$vault_root/.obsidian/plugins/obsidian-style-settings/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-style-settings/main.js" "$vault_root/.obsidian/plugins/obsidian-style-settings/main.js"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-style-settings/styles.css" "$vault_root/.obsidian/plugins/obsidian-style-settings/styles.css"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-style-settings/LICENSE.md" "$vault_root/.obsidian/plugins/obsidian-style-settings/LICENSE.md"
cp "$install_staging_dir/repo/vault/.obsidian/plugins/obsidian-style-settings/SOURCE.md" "$vault_root/.obsidian/plugins/obsidian-style-settings/SOURCE.md"

cp "$install_staging_dir/repo/vault/.obsidian/themes/Minimal/manifest.json" "$vault_root/.obsidian/themes/Minimal/manifest.json"
cp "$install_staging_dir/repo/vault/.obsidian/themes/Minimal/theme.css" "$vault_root/.obsidian/themes/Minimal/theme.css"
cp "$install_staging_dir/repo/vault/.obsidian/themes/Minimal/LICENSE" "$vault_root/.obsidian/themes/Minimal/LICENSE"

cp "$install_staging_dir/repo/vault/.obsidian/snippets/ziminos-quote-semantic-colors.css" "$vault_root/.obsidian/snippets/ziminos-quote-semantic-colors.css"
```

CSS 片段整体更新，但要先记下哪些是「本次新增」——下一步合并 `appearance.json` 时只有它们才该被登记为启用：

```bash
for snippet in "$install_staging_dir/repo/vault/.obsidian/snippets/"*.css; do
    target="$vault_root/.obsidian/snippets/$(basename "$snippet")"
    [ -e "$target" ] || echo "$(basename "$snippet" .css)"   # 本次新增，记下来
    cp "$snippet" "$target"
done
```

只覆盖施工源里的这十三个实名文件；用户自己放进 `snippets/` 的其他 `.css` 一个都不动、不删、不改名。

然后按下列所有权规则处理用户配置：

0. **ziminOS 自己的 `plugins/ziminos/data.json`：存在就一个字节都不许碰，施工源也不提供它。** 这条排在最前面，因为它最容易被当成「我们自己的文件」而顺手覆盖——它不是。它装着用户在设置页做过的每一个决定：左侧边栏摆了哪几条命令、右下角外观开关显不显示、七个目录改没改过名、灵感落点与时间格式；连接微信读书之后还包含登录 Cookie。**安装与审计只能确认它是否存在或比较 SHA-256，禁止复制、上传、展示或输出文件内容。** 覆盖它等于把学员用了半年的工作台一键推平，而且没有任何报错；公开它则等于泄露登录凭据。插件启动时以默认值打底合并这份存档，所以新版本新增的设置项对老库自动生效，根本不需要在安装侧动它。
0a. **ziminOS 插件目录下的三份运行时状态文件：存在就保留，不归安装器替换或清理。** 它们是 `holiday-cache.json`（日历已通过严格校验的最后好数据）、`recent-files.json`（最近打开过哪几篇）与 `cursor-positions.json`（每篇笔记上次的光标位置）。施工源一份都不提供；升级后新版插件各自按 schema 读取，读不懂就当没有、从头开始记，安装侧不代替业务层判断。这条与 `data.json` 那条的区别值得说清：`data.json` 是**选择**，这三份是**状态**——两者都不受管，但状态文件丢了只是少一点便利，选择丢了是把学员的设置抹掉。后两份还各自装着笔记的完整路径，因此与 `data.json` 同样不得输出内容。
0b. **`.obsidian/.gitignore`：保留用户已有的全部规则，只补齐缺少的八行。** 它们是 `workspace*.json`、`plugins/ziminos/data.json`、`plugins/ziminos/holiday-cache.json`、`plugins/ziminos/recent-files.json`、`plugins/ziminos/cursor-positions.json`、`plugins/dataview/data.json`、`plugins/obsidian-outliner/data.json` 与 `plugins/obsidian-quiet-outline/data.json`。文件不存在时复制施工源版本；存在时逐行检查并只追加缺项，禁止整份覆盖。它不是装饰文档，而是用户未来把笔记库纳入 Git 时阻断 Cookie、笔记路径与设备状态外泄的最后一道防线。
1. Dataview `data.json`：施工源不提供默认设置文件；目标存在时原样保留，不得创建或覆盖。DataviewJS 因此保持插件上游默认关闭，用户已有选择仍归用户所有。
1b. `types.json`（属性类型登记表）：目标不存在时才从施工源复制；已存在则解析现有 JSON，只补进缺失的属性键，绝不改写用户已经调过的类型。它决定属性面板给每个属性什么控件（文本/日期时间/日期/数字/列表/勾选框），缺了它学员会看到所有属性都是文本，只能一个个手动改。
2. Style Settings `data.json`：目标不存在时才从施工源复制；已存在则一个字节都不得改。
3. `community-plugins.json`：解析现有 JSON 数组，仅追加缺失的 `ziminos`、`dataview` 与 `obsidian-style-settings`；保留原顺序、原插件和用户状态。文件不存在时才复制施工源默认文件。
4. `appearance.json`：解析现有 JSON 对象。`cssTheme` 缺失或为空时设为 `Minimal`；若用户已选其他非空主题则保留。`textFontFamily` 同一条规矩：缺失或为空时设为 `LXGW WenKai GB Screen`，用户已设其他非空值则一字不动——他在「设置 → 外观」里挑过正文字体，那就是他的字体。文件不存在时才复制施工源默认文件。
   `enabledCssSnippets` 只追加**上一步记下的本次新增片段**中默认启用的那些，此前已经交付过的片段一律不动，用户自己启用的其他片段也一律保留。这条是硬规矩：ziminOS 在右下角给了用户一个逐个开关 CSS 片段的按钮，他关掉某个片段就是一次明确表态，升级替他重新打开等于把他的决定抹掉。复制前根本不存在的新片段不属于这种选择，因为用户此前不可能关掉一个还没有的开关。默认启用的十一个是——`ziminos-quote-semantic-colors`、`【文件】文件图标前缀`、`【文件】二级文件夹前缀LOGO`、`【文件】彩虹文件夹（引导线版）`、`【笔记属性】自动伸缩`、`【编辑】当前行高亮（阴影）`、`【编辑-删除线】突出废弃内容`、`【编辑-图片】居中显示`、`【编辑-代码块】增加行号`、`【编辑-Baes】隐藏新建按钮`、`【PDF】列表参考线`；`【编辑-代码块】水平滑轮` 与 `【编辑-水平线】中间图标` 照常交付但默认关闭。

5. `app.json` 与 `templates.json`：目标不存在时才从施工源复制；已存在则原样保留。它们是 Obsidian 自己的库设置（附件目录、链接写法、模板目录），学员照着课程调过之后就归他所有。

使用 Agent 自身的 JSON 读写能力做结构化合并；禁止用字符串替换破坏 JSON，禁止整份覆盖用户已有配置。不得改动 Markdown 笔记、其他 CSS、其他主题或其他插件。

一句话记住升级的边界：**受管的是「程序」，不受管的是「选择」与「状态」。** 程序（`main.js` / `manifest.json` / `styles.css` / `ziminOS-Eagle-Bridge.eagleplugin` / 四个第三方插件的运行文件 / 十三个实名片段 / 主题）整份更新；选择（五份 `data.json`、`types.json` 已调过的键、非空自选主题、已启用片段清单、`app.json`、`templates.json`、用户自带的片段与笔记）与状态（ziminOS 那三份运行时 JSON）一律不动；唯一例外是本次首次出现的新片段可按新版默认追加启用。

### 安装字体到用户系统（全新安装与升级都执行）

施工源 `fonts/` 里有四款正文字体（五个文件），装进**当前用户**的字体目录——不是笔记库，不是系统目录。学员正文因此开箱就是霞鹜文楷，其余三款出现在「设置 → 外观 → 正文字体」的下拉里备选。

两条纪律先立住：

1. **只碰用户级目录，永不碰系统级**（macOS 的 `/Library/Fonts`、Windows 的 `C:\Windows\Fonts`、Linux 的 `/usr/share/fonts` 一概禁入）。用户级安装不需要管理员权限——如果哪一步向你要密码或要求提权，说明走错了路，停下来。
2. **目标文件已存在就跳过，绝不覆盖。** 用户可能自己装过同名字体的别的版本，那是他的选择。

macOS：

```bash
mkdir -p ~/Library/Fonts
# 取法二的 fonts/ 按字体分子目录，取法一改名过来的是平铺的五个文件；find 两种都认
find "$install_staging_dir/repo/fonts" -type f \( -name '*.ttf' -o -name '*.otf' \) | while IFS= read -r f; do
    target=~/Library/Fonts/"$(basename "$f")"
    [ -e "$target" ] || cp "$f" "$target"
done
```

Linux 同理，目录换成 `~/.local/share/fonts`，拷完执行一次 `fc-cache -f`。

Windows（PowerShell，免管理员的按用户安装：文件进 `%LOCALAPPDATA%\Microsoft\Windows\Fonts`，同时在 HKCU 登记；注册表值名是「家族名 (格式)」、值数据是**完整路径**——这点与机器级安装只写裸文件名相反，写错字体就不出现）：

```powershell
$fontDir = "$env:LOCALAPPDATA\Microsoft\Windows\Fonts"
$regKey  = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item $fontDir -ItemType Directory -Force | Out-Null
$fonts = @{
    'LXGWWenKaiGBScreen.ttf'       = 'LXGW WenKai GB Screen (TrueType)'
    'SourceHanSerifCN-Regular.otf' = 'Source Han Serif CN (OpenType)'
    'SourceHanSerifCN-Bold.otf'    = 'Source Han Serif CN Bold (OpenType)'
    'ZhuqueFangsong-Regular.ttf'   = 'Zhuque Fangsong (technical preview) (TrueType)'
    'LXGWNeoXiHeiPlus.ttf'         = 'LXGW Neo XiHei Plus (TrueType)'
}
Get-ChildItem "$install_staging_dir\repo\fonts" -Recurse -Include *.ttf,*.otf | ForEach-Object {
    $target = Join-Path $fontDir $_.Name
    if (-not (Test-Path $target)) { Copy-Item $_.FullName $target }
    New-ItemProperty $regKey -Name $fonts[$_.Name] -Value $target -PropertyType String -Force | Out-Null
}
```

生效时机不用做任何额外动作，但要说对话：**全新安装**是先装字体、学员后开 Obsidian，打开就是文楷；**升级**时若 Obsidian 正开着，Chromium 只在启动时枚举一次系统字体，必须完全退出再重开才看得见新字体——「重新加载」不够，话术见第六节。

许可证不用装进系统，随施工源清理一并带走即可：四款字体（OFL 1.1 × 3、IPA 1.0 × 1）的许可副本长期随仓库 `fonts/` 分发，合规义务由仓库承担。

全新安装后检查 `$vault_root` 顶层。除安装前已存在的 `.DS_Store` 外，只允许：

```text
.obsidian/
README.md
```

确认：

- `$vault_root/.obsidian/plugins/ziminos/main.js` 存在，且 `grep -c 'ziminos-vault' main.js` 大于 0 —— 三十六枚命令图标与三枚设置页专用图标都编进产物，grep 不到就说明拿到的是旧版 `main.js`，装上去左边那列会是空的。
- `$vault_root/.obsidian/plugins/ziminos/manifest.json` 存在，`version` 与施工源一致；`styles.css` 存在。
- `$vault_root/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin` 存在，且 `unzip -t` 校验通过；它只是待用户从 ziminOS 设置页主动安装到 Eagle 的第一方伴侣包。
- `$vault_root/.obsidian/plugins/dataview/main.js` 存在，版本为 0.5.68。
- `$vault_root/.obsidian/plugins/obsidian-outliner/main.js` 存在，版本为 4.10.2；`LICENSE` 与 `SOURCE.md` 都在。
- `$vault_root/.obsidian/plugins/obsidian-quiet-outline/main.js` 存在，版本为 0.5.18；`LICENSE` 与 `SOURCE.md` 都在。
- `$vault_root/.obsidian/plugins/obsidian-style-settings/main.js` 存在，`data.json` 是合法 JSON 对象。
- `$vault_root/.obsidian/themes/Minimal/theme.css` 存在，版本为 9.0.2。
- `$vault_root/.obsidian/snippets/` 下十三个片段全部存在，扩展名一律小写 `.css`（`ls .obsidian/snippets/*.css | wc -l` 至少为 13）。
- `$vault_root/.obsidian/types.json` 存在且是合法 JSON，`types` 下至少含 `created: datetime`、`UID: number`、`up: multitext`。
- `$vault_root/.obsidian/.gitignore` 存在，并包含 `workspace*.json`、`plugins/ziminos/data.json`、`plugins/ziminos/holiday-cache.json`、`plugins/ziminos/recent-files.json`、`plugins/ziminos/cursor-positions.json`、`plugins/dataview/data.json`、`plugins/obsidian-outliner/data.json` 与 `plugins/obsidian-quiet-outline/data.json` 八条隐私规则。
- `$vault_root/.obsidian/community-plugins.json` 包含 `ziminos`、`dataview`、`obsidian-style-settings`、`obsidian-outliner` 与 `obsidian-quiet-outline` 五个 id。
- `$vault_root/.obsidian/appearance.json` 的全新安装默认主题为 `Minimal`，`textFontFamily` 为 `LXGW WenKai GB Screen`，`enabledCssSnippets` 恰好是上面列出的十一个默认启用片段。
- 用户字体目录里五个字体文件齐全（macOS `~/Library/Fonts`、Linux `~/.local/share/fonts`、Windows `%LOCALAPPDATA%\Microsoft\Windows\Fonts`）：`LXGWWenKaiGBScreen.ttf`、`SourceHanSerifCN-Regular.otf`、`SourceHanSerifCN-Bold.otf`、`ZhuqueFangsong-Regular.ttf`、`LXGWNeoXiHeiPlus.ttf`；Windows 还要确认 HKCU 字体注册表键下五个值名齐全且各自指向存在的文件。
- `$vault_root/.obsidian/app.json` 的 `attachmentFolderPath` 为 `./附件`，`templates.json` 的 `folder` 为 `90-system/Template`。
- `$vault_root/.obsidian/plugins/ziminos/data.json` **不存在**。全新安装不该生成它——它由插件在用户第一次改设置时自己写出来。
- `$vault_root` 内不存在 `.git/`、`src/`、`docs/`、`skill/`、`vault/`、`fonts/`、`node_modules/` 或 `package.json`——字体的家在用户字体目录，不在笔记库。

升级模式还要确认：升级前已存在的 **ziminOS / Dataview / Style Settings / Outliner / Quiet Outline 各份 `data.json` SHA-256 全部不变**（一律不得打印内容；Outliner 与 Quiet Outline 的设置同样是学员的选择，不归 ziminOS 管，而 ziminOS 那份装着侧边栏摆放与全部设置、还可能包含微信读书 Cookie，最不能动也最不能公开）；ziminOS 插件目录下已存在的 `holiday-cache.json` / `recent-files.json` / `cursor-positions.json` 一份都没被删或被覆盖；`.obsidian/.gitignore` 原有行全部保留且八条系统隐私规则齐全；`types.json` 里用户原有的属性类型一个都没被改写；用户原有插件 ID、非空自选主题、自己放进 `snippets/` 的其他 CSS 片段与 Markdown 笔记全部仍在；`enabledCssSnippets` 里升级前已有的名字一个没少，升级前被用户关掉的片段一个都没被重新打开；升级前 `textFontFamily` 已是其他非空值的，升级后原样未动；`app.json` 与 `templates.json` 保持升级前原样。

若发现开发文件，说明安装错误；由 Agent 修正，不让用户判断哪些文件该删。

## 五、清理临时施工源

无论成功或失败，都清理本次创建的临时目录。删除前必须确认它就是本次创建的那一个：在系统临时目录下、名字以 `ziminos-install.` 开头，只删除这个精确目录：

```bash
case "$install_staging_dir" in
    /tmp/ziminos-install.*) find "$install_staging_dir" -depth -delete ;;
    *) echo "拒绝清理非 ziminOS 临时目录：$install_staging_dir" >&2; exit 1 ;;
esac
```

Windows 上用 Python 或 PowerShell 删。取法二克隆出的 `.git` 里有只读文件，直接删会报 `WinError 5` / 拒绝访问——先去掉只读属性再删，而不是换别的办法重试：

```python
import os, shutil, stat

def _clear_readonly(func, path, _):
    os.chmod(path, stat.S_IWRITE)
    func(path)

assert os.path.basename(install_staging_dir).startswith("ziminos-install.")
shutil.rmtree(install_staging_dir, onerror=_clear_readonly)
```

PowerShell 的 `Remove-Item -LiteralPath $install_staging_dir -Recurse -Force` 同样能删掉只读文件（`-Force` 不能省）。

不得删除 `$vault_root`，不得删除用户提供的任何目录，不在当前工作区旁留下源码仓库、压缩包或安装脚本。

## 六、交付给用户

全新安装完成后输出：

> 已经把当前文件夹搭建成你的个人知识管理系统。
>
> 现在直接用 Obsidian 打开这个文件夹，然后：
> 1. Obsidian 询问信任时，点「信任仓库作者并启用插件」。Dataview、Minimal 主题、Style Settings 和默认配色已就位。
> 2. 打开设置，在左边找到 ziminOS，顶上第一张标签「开荒」里点「初始化」。设置按系统模块分成八张标签页，「记录灵感」那一套在「灵感」页。
> 3. 看到「开荒完成 ✅」后，跟着笔记库里的 README 使用。
> 4. 看**最左边一条竖栏**，七个常用命令已经摆好了：新建项目、记录灵感、今天的日记、写复盘主题、新建人脉、记人情、外观开关。点一下就走，不用背快捷键。还有二十六条命令在设置 → ziminOS → 左侧边栏里勾一下就能摆出来，摆出来之后顺序可以直接拖。
> 5. 看**右下角**，有个 🎨 按钮，点开就能逐个开关十三个外观片段——文件夹图标、彩虹引导线、代码块行号、废弃内容突出这些，看着不顺眼随手关掉，立刻生效不用重启。
> 6. 笔记正文已经是**霞鹜文楷**（屏幕阅读版，四款阅读字体已一并装进你的系统）。想换口味：设置 → 外观 → 正文字体，下拉里还备着思源宋体 CN（书卷衬线）、朱雀仿宋（民国铅字）、霞鹜新晰黑＋（清爽黑体）。

不要再给用户一个新的文件夹路径，不要提临时源码位置，不要让他寻找 `vault/` 子目录。

升级完成后输出：

> 当前笔记库里的 ziminOS 已从 v旧版本更新到 v新版本，Dataview 和外观包也已补齐，四款阅读字体（霞鹜文楷屏幕版、思源宋体 CN、朱雀仿宋、霞鹜新晰黑＋）已装进你的系统。你的笔记、自定义配色、左侧边栏摆好的命令和其他插件都没有被覆盖。请**完全退出 Obsidian 再重新打开**——新字体只有重启后才看得见，只「重新加载」是不够的。
>
> 如果这是 v0.22.8 之前开荒的旧库，重开后按 `Cmd/Ctrl + P` 运行一次「升级存量 MOC 数据库」：第一扇窗口只显示逐文件差异，确认后才迁移；自定义或多数据库笔记只报告冲突，不会覆盖，任一步失败会回滚整批。

## 红线

- 当前工作区就是最终笔记库，不另建目录。
- 不在当前工作区克隆任何源码镜像。
- 不让用户打开仓库或仓库内的 `vault/`。
- 不删除或覆盖用户笔记。
- 只交付仓库已锁定的 ziminOS、Dataview、Outliner、Quiet Outline、Minimal、Style Settings、ziminOS CSS 与 `fonts/` 里的四款字体；不临时下载或安装任何额外软件、插件、主题、图标包或字体。三十六枚命令图标与三枚设置页专用图标的 SVG 已经编进 `main.js`，不需要也不允许另外下载。**Outliner 与 Quiet Outline 同样已在仓库里，不要去 GitHub 或插件市场重新拉一份**——版本与 SHA-256 由 `docs/第三方组件.md` 锁定，现拉的那份对不上。
- 字体只装进当前用户的字体目录，绝不碰系统级目录、绝不提权要密码；目标位置已有同名文件绝不覆盖。升级时用户已自选的 `textFontFamily` 绝不改动。
- 全新安装可播种默认配色与默认启用的片段；升级绝不覆盖 **ziminOS 自己的 `data.json`**（侧边栏摆放与全部设置都在里面）、用户 Dataview / Style Settings `data.json`、非空自选主题、额外插件、自带片段，也绝不替用户重新打开他关掉的片段。
- 不复制、不上传、不展示、不输出 `.obsidian/plugins/ziminos/data.json` 的内容；它可能含微信读书 Cookie。升级只可比较摘要，隐私规则只可增量合并。
- 判断不了当前目录是否安全时停止，不要猜。
