---
name: ziminos-pro-setup
description: 在用户已经创建并命名一个文件夹、再用桌面 Agent 打开该文件夹后，把当前工作区搭建成 ziminOS 第二版三库系统（兼收并蓄 / 以人为本 / 赛博永生），或把一个已有的第一版笔记库原地升级为三库系统。用户发送仓库地址并说「按这个仓库搭建三库系统」「安装 ziminOS 第二版」「装付费版」「我买了 pro，帮我装」「把我现在的库升级成三库」时使用。第一版（单库、免费）的安装契约在 skill/SKILL.md，不要混用。
---

# ziminOS 第二版 · 三库系统安装

**先分清版次。** 这个仓库交付两套东西：

| | 第一版（免费） | 第二版（付费·本文件） |
| --- | --- | --- |
| 笔记库 | 一本 | **三本** |
| 契约 | `skill/SKILL.md` | `skill-pro/SKILL.md`（本文件） |
| 口述捕获 | 无 | 有 |
| 赛博永生 | 无 | 有 |

**如果用户只说「搭建 Obsidian 笔记库」而没有提到三库、付费版或 pro，去执行 `skill/SKILL.md`，不要执行本文件。** 装错版次的代价不对称：把免费版装成三库，用户会得到两本他没买、也不知道怎么用的库。

## 与第一版最大的不同

第一版的核心承诺是「**当前工作区就是最终笔记库**」。第二版不是。

第二版里，当前工作区是**系统根**，它自己不是笔记库，里面并排住着三本各自独立的笔记库：

```text
文件夹 A/              ← 用户已创建、已命名；这是系统根，不是笔记库
├── 兼收并蓄/          ← 笔记库 1：进料口
├── 以人为本/          ← 笔记库 2：工作台（= 第一版那本库）
├── 赛博永生/          ← 笔记库 3：知识成品库
└── .ziminos/          ← 智能体自己的东西，用户不用管
```

用户随后在 Obsidian 里**分别打开这三本**，不是打开 A。这一点必须在交付话术里说清楚，否则他会用 Obsidian 打开 A，然后看到一个空库。

---

## 一、锁定并判定模式

```bash
system_root="$(pwd -P)"
```

不要询问系统名称或安装位置。当前目录的文件夹名就是用户已经确定的系统名称。

执行只读安全检查，**任何一条不通过就停止并说明，不要猜**：

1. 当前目录是 `/`、用户主目录、「文档 / Documents」根目录、桌面根目录或其他宽泛目录 → 停止，请用户专门创建一个文件夹再用 Agent 打开它。
2. 当前目录含 `src/`、`vault/`、`skill/` 与 `package.json` → Agent 打开的是源码仓库 → 停止，绝不把源码仓库改造成笔记库。
3. 当前目录存在 `.obsidian/` **但不存在** `以人为本/` → 这是一本**第一版的单库**，先做第二节取得施工源，再进入「三、B 从第一版升级到第二版」。
4. 当前目录存在 `以人为本/.obsidian/` 或 `.ziminos/` → 已经是三库系统，先做第二节取得施工源，再进入「三、C 三库系统的日常升级」。
5. 以上都不是，且除 `.DS_Store` 与智能体自己点开头的配置目录外目录为空 → 全新安装：先跑下面的安装脚本；脚本走不通，再做第二节取得施工源、进入「三、A 全新安装」。
6. 目录非空、又不符合 3 与 4 → 停止，不覆盖任何文件。

### 全新安装：先交给安装脚本

上面第 5 条判定为全新安装时，**先运行下面这一条命令，不要逐条执行后面的步骤。** 安装脚本在一条命令里做完取包、校验、铺库、装字体、自检与清理——比逐条执行快得多，也不会因为某台电脑缺某个命令而卡住。一台新的 Windows 电脑上逐条执行曾经花掉二十多分钟，时间全耗在试工具上。

Windows（在 PowerShell、cmd 或 Git Bash 里都原样运行；命令里没有 `$`，哪种命令行都不会改写它）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=3072; iwr -useb https://gitee.com/ziminzhao/ziminos-pro/raw/main/installer/install.ps1 -OutFile ([IO.Path]::GetTempPath()+'ziminos-install.ps1'); & ([IO.Path]::GetTempPath()+'ziminos-install.ps1') -Edition pro"
```

macOS：

```bash
curl -fsSL https://gitee.com/ziminzhao/ziminos-pro/raw/main/installer/install.sh -o /tmp/ziminos-install.sh && bash /tmp/ziminos-install.sh pro
```

第一次运行时，Windows 会先下载一个 11 MB 的便携 Python（没装开发者工具的 Mac 是 17 MB），以后复用。整个过程通常在一两分钟内，主要看网速；**等它自己结束，不要中途重跑。**

结束后读当前文件夹里的 `.ziminos-install-result.json`（看不见命令输出时也读它），按 `status` 办：

| `status` | 意思 | 你做什么 |
| --- | --- | --- |
| `ok` | 装好了，而且每个文件都与安装包逐字节核对过 | 删掉这个结果文件，直接按第六节交付给用户，并把结果里的 `version` 报给他 |
| `upgrade` | 这里已经装过 ziminOS | 删掉结果文件，按结果里的 `mode` 走：`upgrade-B` 进「三、B 从第一版升级到第二版」，`upgrade-C` 进「三、C 三库系统的日常升级」，都从第二节取得施工源开始 |
| `refused` | 文件夹不安全或不是空的，`message` 写着原因 | 把 `message` 原话告诉用户，停下来，不要换办法绕过去 |
| `failed` | 取包、校验或自检没过，`error` 或 `problems` 写着卡在哪 | 先看 `rolled_back`：`true` 表示它写进文件夹的东西已经撤干净，删掉结果文件、从第二节起逐条执行即可；`false` 时 `rollback_leftovers` 列着撤不掉的那几个，**先请用户手动删掉它们再继续**——留着它们，下一次运行会把这里当成「已经装过」而去走升级。两种情况都把 `error` 告诉用户 |

命令本身报错、没有生成结果文件时，按 `failed` 处理。

---

## 二、在工作区外取得施工源

施工源只有一份内容，取法有三种。**按顺序试，前一种走通就不看后面。** 三种取法最后都得到同一个 `$src`——同时含 `vault/`、`vault-pro/`、`skill-pro/`、`fonts/` 的那个目录，下文每一步只认它。

三种取的是**同一份内容**的不同形态：第二版有两个同步源码镜像，GitHub `zhaozimin/ziminOS-Pro` 与 Gitee `ziminzhao/ziminos-pro`；发行包目前只挂在 Gitee。**第一版则是 GitHub `zhaozimin/ziminOS` / Gitee `ziminzhao/zimin-os-v1`，那里没有 `vault-pro/` 与 `skill-pro/`**。拿第一版装第二版会卡在下面那张交付物清单上——这是最容易走错的一步，因为 clone 本身仍会成功。

一律在**工作区之外**的系统临时目录里做（macOS / Linux 的 `/tmp`，Windows 的 `%TEMP%`），临时目录名以 `ziminos-install.` 开头，第五节清理时只认这个名字。禁止在 `$system_root` 内下载、解压或克隆。

### 在 Windows 上，动手前先读这四条

一台新的 Windows 电脑上，这一节曾经花掉二十分钟，而真正装库只用了几分钟。时间全耗在同一组环境问题反复撞墙上：

1. **下文命令用 bash 书写只为好读；Windows 上请用 Python 标准库（`urllib` / `zipfile` / `shutil` / `json`）或 PowerShell 完成同样的事，不要去修 bash。** 智能体自带的 bash 常常是精简版：只有 bash 本体，没有 `ls`、`cp`、`tail`、`unzip`，也找不到 `git`。为它补 PATH、找工具，是这类安装最大的时间黑洞。
2. **PowerShell 的输出看不见时**（有些智能体的沙箱会吞掉它），把结果写进临时目录里的日志文件再读，不要反复重跑同一条命令。
3. **不要在命令后面接 `| tail`、`| head`。** 缺一个小工具，整条管道会被连带杀掉，只留下一半的文件，而你看到的只是「被终止」。
4. **不走取法三就不需要 Git。** 取法一只要能发一次 HTTPS 请求、能解开一个 zip，Python 与 PowerShell 都自带这两样。

### 取法一：下载 Gitee 发行版上的分发包（首选，不需要 Git，也不需要登录）

1. 读 `https://gitee.com/ziminzhao/ziminos-pro/raw/main/vault/.obsidian/plugins/ziminos/manifest.json`，取出 `version`（例如 `0.33.0`）。
2. 下载 `https://gitee.com/ziminzhao/ziminos-pro/releases/download/v版本号/ziminOS-pro-v版本号.zip`。返回 404 说明这一版的包还没挂上发行版，直接改走取法三，不要换别的下载办法去试。
3. 核对下载结果：几十 MB，开头两个字节是 `PK`。
4. 解到临时目录里，`$src` 就是解压出来的 `ziminOS-pro-v版本号/`。

**不要用 `api/v5` 开头的开放接口去找发行版。** 它对未登录的请求限流，同一个出口 IP 下请求一多就返回 `403 Rate Limit Exceeded`——一间教室的学员同时安装、或者智能体多重试几次，都会撞上。上面两个地址走的是网页与文件通道，不受这个限制。

Python 标准库写法，macOS、Linux、Windows 通用：

```python
import json, os, shutil, tempfile, urllib.error, urllib.request, zipfile

REPO = "https://gitee.com/ziminzhao/ziminos-pro"
with urllib.request.urlopen(REPO + "/raw/main/vault/.obsidian/plugins/ziminos/manifest.json", timeout=60) as response:
    version = json.load(response)["version"]
name = "ziminOS-pro-v%s" % version

install_staging_dir = tempfile.mkdtemp(prefix="ziminos-install.")
archive = os.path.join(install_staging_dir, name + ".zip")
try:
    with urllib.request.urlopen("%s/releases/download/v%s/%s.zip" % (REPO, version, name), timeout=120) as response, \
            open(archive, "wb") as out:
        shutil.copyfileobj(response, out)
except urllib.error.HTTPError as error:
    raise SystemExit("发行版上取不到 %s.zip（HTTP %s），改走取法三" % (name, error.code))

with open(archive, "rb") as handle:
    if handle.read(2) != b"PK":
        raise SystemExit("下载到的不是 zip，改走取法三")
with zipfile.ZipFile(archive) as z:
    z.extractall(install_staging_dir)

src = os.path.join(install_staging_dir, name)
print(version, src)
```

没有 Python 时用 PowerShell（Windows 自带）。前两行不能省：旧系统默认的 TLS 版本连不上 Gitee，而下载进度条会把几十 MB 的下载拖慢十倍以上。版本号那个文件是 `text/plain`，要用 `ConvertFrom-Json` 自己解析：

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$repo = 'https://gitee.com/ziminzhao/ziminos-pro'
$manifest = Invoke-WebRequest "$repo/raw/main/vault/.obsidian/plugins/ziminos/manifest.json" -UseBasicParsing
$version = ($manifest.Content | ConvertFrom-Json).version
$name = "ziminOS-pro-v$version"
$install_staging_dir = Join-Path $env:TEMP ('ziminos-install.' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item $install_staging_dir -ItemType Directory | Out-Null
$archive = Join-Path $install_staging_dir "$name.zip"
Invoke-WebRequest "$repo/releases/download/v$version/$name.zip" -OutFile $archive -UseBasicParsing
Expand-Archive $archive -DestinationPath $install_staging_dir
$src = Join-Path $install_staging_dir $name
```

下载那一行报 404，同样改走取法三。

**这两件事都有人试过，每一件都白白花掉十分钟，不要做：**

- 不要下载仓库的「下载 ZIP」地址（`…/repository/archive/…zip`）：未登录拿到的是一张几十 KB 的 HTML 跳转页，带什么请求头都一样。
- 不要用 raw 地址或文件树接口逐个文件拼仓库：大字体文件返回 403，个别文件返回 451，永远拼不全。（取法一第 1 步只读一个 `manifest.json` 取版本号，不在此列。）

### 取法二：用户手里已经有分发包

把压缩包解到工作区之外的临时目录（Python 的 `zipfile`、PowerShell 的 `Expand-Archive`、macOS 的 `unzip` 都行），`$src` 是解压出来那个同时含四个目录的目录：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
unzip -q "<用户给的 zip 路径>" -d "$install_staging_dir"
src="$(find "$install_staging_dir" -maxdepth 2 -type d -name vault-pro | head -1 | xargs dirname)"
```

找不到四个目录就停止并说明包不完整，**不要**从另一份来源逐个拼目录。要补就走取法一重新取完整发行包，或走取法三完整克隆同一版次的官方镜像。

### 取法三：git clone（前两种都走不通时）

用户从 GitHub 进入时：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
git clone --depth 1 "https://github.com/zhaozimin/ziminOS-Pro.git" "$install_staging_dir/repo"
src="$install_staging_dir/repo"
```

用户从 Gitee 进入，或没有指定平台时：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
git clone --depth 1 "https://gitee.com/ziminzhao/ziminos-pro.git" "$install_staging_dir/repo"
src="$install_staging_dir/repo"
```

两条命令只运行一条；它们是同一版次的镜像。**地址必须是 GitHub 的 `zhaozimin/ziminOS-Pro` 或 Gitee 的 `ziminzhao/ziminos-pro`，不能是第一版的 `zhaozimin/ziminOS` / `ziminzhao/zimin-os-v1`。** 第一版 clone 下来是能成功的——失败要等到交付物清单那一步才发作，报的还是「仓库不完整」这种听上去像网络出错的话。

Windows 上找不到 `git` 时，先看智能体自带的 PortableGit：`git.exe` 常常在它的 `cmd\` 目录里，而不在只放了 bash 的 `bin\` 里，用绝对路径调用即可。当前镜像 clone 失败时可以尝试同一版次的另一个官方镜像；两个都走不通就说明情况，停下来，不让用户为安装去创建账号。

三种取法之后的每一步完全相同，因为**分发包内部就是仓库的目录结构**——这么打包正是为了让契约里的路径一个字都不用改。

确认第二版交付物齐全，任一缺失就停止并说明仓库不完整：

```text
$src/vault/                                    第一版笔记库成品（= 以人为本的主体）
$src/vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin    可选的第一方 Eagle 伴侣包
$src/vault-pro/兼收并蓄/                        进料口成品
$src/vault-pro/以人为本/.obsidian/plugins/ziminos/edition.json    版次标记（叠加件）
$src/vault-pro/赛博永生/                        成品库成品
$src/skill-pro/capture/SKILL.md                口述捕获契约
$src/skill-pro/distill/SKILL.md                赛博永生提炼契约
$src/skill-pro/scripts/notectl.py              口述捕获的确定性脚本
$src/fonts/                                    四款正文字体
```

`vault/` 与 `vault-pro/` 的分工是硬的，别搞混：**`vault/` 是三本库共享的那一份程序与外观资产的唯一出处**（ziminOS 插件、Dataview、Style Settings、Minimal 主题、十三个 CSS 片段），仓库里只存在这一份；`vault-pro/` 只装第二版特有的内容与配置。这样第一版与第二版永远不会在主题或插件版本上分叉。

不要运行 `npm install` / `npm run build`，不要安装 Node.js，不要去 Obsidian 商店另行下载任何东西。Eagle 伴侣包只随 ziminOS 程序分发，**不得替用户静默安装或启动**；用户启用附件桥接时，再从 ziminOS 设置页主动打开它。

---

## 三、A 全新安装

### 1. 三本库的骨架

```bash
capture="$system_root/兼收并蓄"
human="$system_root/以人为本"
eternal="$system_root/赛博永生"

# 以人为本 = 第一版那本库，一字不改地铺开
mkdir -p "$human"
cp -R "$src/vault/." "$human/"

# 另外两本
mkdir -p "$capture" "$eternal"
cp -R "$src/vault-pro/兼收并蓄/." "$capture/"
cp -R "$src/vault-pro/赛博永生/." "$eternal/"

# 空目录不进 git，这两个得自己建
mkdir -p "$capture/剪藏"
mkdir -p "$eternal/10-原料"
```

`cp -R .../.` 里那个 `/.` 不得省略，否则会多出一层目录。

### 2. 把版次标记叠到「以人为本」上

```bash
mkdir -p "$human/.obsidian/plugins/ziminos"
cp "$src/vault-pro/以人为本/.obsidian/plugins/ziminos/edition.json" \
   "$human/.obsidian/plugins/ziminos/edition.json"
```

**这一步是第二版全部功能的开关。** 没有它，`以人为本` 就是一本普普通通的第一版笔记库——插件照常工作，但归档不写出库单、「待搬运」视图不存在。有了它，插件才知道自己站在三库系统里。

它刻意是一个用户看得见、打得开、删得掉的文件。删掉它，那本库立刻退回第一版行为，不报错也不损坏任何数据。

### 3. 分发共享的程序与外观资产

三本库的主题、片段与 Style Settings 全部从 `vault/` 那一份来，仓库里不存第二份：

```bash
for v in "$capture" "$eternal"; do
    mkdir -p "$v/.obsidian/themes/Minimal" "$v/.obsidian/snippets" \
             "$v/.obsidian/plugins/obsidian-style-settings"
    cp -R "$src/vault/.obsidian/themes/Minimal/." "$v/.obsidian/themes/Minimal/"
    cp -R "$src/vault/.obsidian/snippets/." "$v/.obsidian/snippets/"
    cp -R "$src/vault/.obsidian/plugins/obsidian-style-settings/." \
          "$v/.obsidian/plugins/obsidian-style-settings/"
done

# 兼收并蓄要 Dataview（灵感集顶部那块未完成清单靠它）
mkdir -p "$capture/.obsidian/plugins/dataview"
cp -R "$src/vault/.obsidian/plugins/dataview/." "$capture/.obsidian/plugins/dataview/"

# 赛博永生要 ziminOS 插件（「待提炼」视图靠它），但不要 Dataview
mkdir -p "$eternal/.obsidian/plugins/ziminos"
cp "$src/vault/.obsidian/plugins/ziminos/main.js"      "$eternal/.obsidian/plugins/ziminos/"
cp "$src/vault/.obsidian/plugins/ziminos/manifest.json" "$eternal/.obsidian/plugins/ziminos/"
cp "$src/vault/.obsidian/plugins/ziminos/styles.css"    "$eternal/.obsidian/plugins/ziminos/"
cp "$src/vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin" "$eternal/.obsidian/plugins/ziminos/"
```

注意 `赛博永生` 的 `edition.json` 已经随它的模板一起铺进去了（`role: eternal`），不要再覆盖。

`types.json` 只有「以人为本」需要——另外两本库没有卡片、没有人脉，属性面板里没有要登记的类型。

### 4. 装字体

与第一版完全相同：把 `$src/fonts/` 里的五个字体文件装进**当前用户**的字体目录，不碰系统级、不提权、同名文件绝不覆盖。

macOS：

```bash
mkdir -p ~/Library/Fonts
find "$src/fonts" -type f \( -name '*.ttf' -o -name '*.otf' \) | while IFS= read -r f; do
    target=~/Library/Fonts/"$(basename "$f")"
    [ -e "$target" ] || cp "$f" "$target"
done
```

Linux 目录换成 `~/.local/share/fonts`，拷完执行一次 `fc-cache -f`。

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
Get-ChildItem "$src\fonts" -Recurse -Include *.ttf,*.otf | ForEach-Object {
    $target = Join-Path $fontDir $_.Name
    if (-not (Test-Path $target)) { Copy-Item $_.FullName $target }
    New-ItemProperty $regKey -Name $fonts[$_.Name] -Value $target -PropertyType String -Force | Out-Null
}
```

生效时机要说对话：**全新安装**是先装字体、用户后开 Obsidian，打开就是文楷；**升级**时若 Obsidian 正开着，Chromium 只在启动时枚举一次系统字体，必须完全退出再重开才看得见新字体——「重新加载」不够。

> 这一段与第一版 `skill/SKILL.md` 的字体安装逐字相同，**刻意复制而非交叉引用**：本契约要能随分发包单独发出去，而分发包里没有第一版的契约。改动字体清单时两处必须同时改。

### 5. 把智能体自己的说明书留在本地

```bash
mkdir -p "$system_root/.ziminos/skills"
cp -R "$src/skill-pro/capture"  "$system_root/.ziminos/skills/"
cp -R "$src/skill-pro/distill"  "$system_root/.ziminos/skills/"
cp -R "$src/skill-pro/scripts"  "$system_root/.ziminos/skills/"
```

这一步不是可选的。口述捕获与知识提炼是**日常**要用的，每次都回 GitHub 拉一遍既慢又要求联网，而这套系统对用户的承诺是记录过程不联网。留在本地之后，用户说一句话，你读本地的契约就能干活。

`.ziminos` 是点开头的隐藏目录，且它在三本库之外——Obsidian 永远不会把它当成笔记。

### 6. 让系统根自己会认路

```bash
cp "$src/skill-pro/system-root/CLAUDE.md" "$system_root/CLAUDE.md"
cp "$src/skill-pro/system-root/AGENTS.md" "$system_root/AGENTS.md"
```

**这一步和第 5 步是一件事的两半，缺了它第 5 步等于白做。** 契约躺在 `.ziminos/skills/` 里没有用——没有任何东西告诉一个刚打开这个文件夹的智能体去读它。而智能体打开一个目录时**会自动读**的恰恰是 `CLAUDE.md` 与 `AGENTS.md`，系统根里原本一个都没有。

后果很具体：用户每开一个新会话都得从头解释「我这是个三库系统、库在哪儿、你该读哪份契约」，解释不全智能体就开始猜。铺下这两份之后，他打开文件夹说一句「记一下：……」就能直接干活。

这两份是**给智能体的指令**，不是笔记：Obsidian 打开的是里面那三个文件夹，永远看不到它们；用户可以随手改，改坏了重装即可恢复。

---

## 三、B 从第一版升级到第二版

用户现在打开的是**一本已有的第一版笔记库**，里面有他的真实笔记。

**绝不移动他的笔记库。** 一个字节都不搬。做法是在它的**同级**长出另外两本库：

```bash
human="$(pwd -P)"
system_root="$(dirname "$human")"
human_name="$(basename "$human")"
```

先向用户确认，拿到明确同意再动手：

> 你现在这本库会保持原样，一个文件都不动，它会成为三库里的「以人为本」。
> 我需要在它旁边（`{system_root}`）新建两个文件夹：`兼收并蓄` 和 `赛博永生`。
> 可以吗？

**这是整个安装流程里唯一一次在工作区之外写文件，因此必须问。** 用户说不行就停下，让他新建一个专门的文件夹再走全新安装。

同意之后：

1. 检查 `$system_root/兼收并蓄` 与 `$system_root/赛博永生` 都不存在。存在就停止并说明。
2. 按 A 的第 1 步建那两本库（不碰 `$human`）。
3. 按 A 的第 3 步分发共享资产给那两本库。
4. 把版次标记写进现有库，**并且把 `vaults.human` 改成他这本库的真实名字**：

```bash
mkdir -p "$human/.obsidian/plugins/ziminos"
```

用你自己的 JSON 能力写出 `$human/.obsidian/plugins/ziminos/edition.json`：

```json
{
  "edition": "pro",
  "role": "human",
  "vaults": { "capture": "兼收并蓄", "human": "他这本库的真实文件夹名", "eternal": "赛博永生" }
}
```

同样要改 `$eternal/.obsidian/plugins/ziminos/edition.json` 里的 `vaults.human`。**两份标记里的 `vaults` 必须完全一致**，它是系统布局的唯一事实源，不一致会让出库单指向一个不存在的地方。

5. 现有库的 `main.js` / `manifest.json` / `styles.css` / `ziminOS-Eagle-Bridge.eagleplugin`、Minimal 主题与十三个实名片段更新到施工源的版本。片段复制前先记下目标中不存在的文件名，复制后按 C 模式第 2 步的规则，只把这批「本次新增」里默认启用的片段追加进 `appearance.json`；已有片段的开关一个都不动。
6. 按 A 的第 4、5、6 步装字体、留说明书、铺系统根的认路文件。
7. **现有库的一切「选择」一律不动**：`data.json`、`holiday-cache.json`、`types.json` 已调过的键、`appearance.json` 里用户选过的主题/字体/已有片段、`app.json`、`templates.json`、用户自己的片段与全部笔记。唯一例外是第 5 步那批复制前根本不存在的新片段——用户此前不可能关掉一个还没有的开关。

升级后**不要**让用户重新点「初始化」——他的库早就开过荒了。

---

## 三、C 三库系统的日常升级

已经是三库系统，只更新程序、不动选择。

**动手前必须先做完第二节取得 `$src`。** 这一步最容易被跳过——本节从头到尾在说「更新成施工源的版本」，而没有施工源时那句话没有对象，于是整个升级安静地什么都不做：没有报错、没有警告，用户重启 Obsidian 后发现插件还是旧的，却找不到哪一步失败了。

### 1. 认路并记下升级前的版本

```bash
system_root="$(pwd -P)"

# 三本库的名字从版次标记读，不要写死——升级上来的用户那本工作台是他自己取的名字
# 深度是 5：<库名>/.obsidian/plugins/ziminos/edition.json，一层都不能少
edition="$(find "$system_root" -maxdepth 5 -name edition.json -path '*/plugins/ziminos/*' | head -1)"
[ -n "$edition" ] || { echo "找不到 edition.json，这里可能不是三库系统"; exit 1; }

human="$system_root/$(grep -o '"human"[^"]*"[^"]*"' "$edition" | sed 's/.*"\([^"]*\)"$/\1/')"
capture="$system_root/$(grep -o '"capture"[^"]*"[^"]*"' "$edition" | sed 's/.*"\([^"]*\)"$/\1/')"
eternal="$system_root/$(grep -o '"eternal"[^"]*"[^"]*"' "$edition" | sed 's/.*"\([^"]*\)"$/\1/')"

# 升级前后各读一次，收尾时必须对照——这是本节唯一能自证「真的干了活」的证据
version_of() { grep -o '"version"[^,]*' "$1/.obsidian/plugins/ziminos/manifest.json" 2>/dev/null | head -1; }
before="$(version_of "$human")"
echo "升级前：$before ；施工源：$(grep -o '"version"[^,]*' "$src/vault/.obsidian/plugins/ziminos/manifest.json" | head -1)"
```

### 2. 更新程序

```bash
# 插件运行文件与 Eagle 伴侣包：只有装了插件的两本库有
for v in "$human" "$eternal"; do
    for f in main.js manifest.json styles.css ziminOS-Eagle-Bridge.eagleplugin; do
        cp "$src/vault/.obsidian/plugins/ziminos/$f" "$v/.obsidian/plugins/ziminos/$f"
    done
done

# 主题与十三个实名片段：三本库都要。只覆盖施工源里那十三个文件，
# 用户自己放进 snippets/ 的其他 .css 一个都不动、不删、不改名
for v in "$human" "$capture" "$eternal"; do
    mkdir -p "$v/.obsidian/themes/Minimal" "$v/.obsidian/snippets"
    cp -R "$src/vault/.obsidian/themes/Minimal/." "$v/.obsidian/themes/Minimal/"
    new_snippets="$install_staging_dir/new-snippets-$(basename "$v").txt"
    : > "$new_snippets"
    for snippet in "$src/vault/.obsidian/snippets/"*.css; do
        target="$v/.obsidian/snippets/$(basename "$snippet")"
        [ -e "$target" ] || printf '%s\n' "$(basename "${snippet%.css}")" >> "$new_snippets"
        cp "$snippet" "$target"
    done
done

# 第三方插件的运行文件：装了哪个就更新哪个，绝不新装用户没有的
for v in "$human" "$capture" "$eternal"; do
    for plug in dataview obsidian-style-settings; do
        [ -d "$v/.obsidian/plugins/$plug" ] || continue
        for f in main.js manifest.json styles.css; do
            [ -f "$src/vault/.obsidian/plugins/$plug/$f" ] && cp "$src/vault/.obsidian/plugins/$plug/$f" "$v/.obsidian/plugins/$plug/$f"
        done
    done
done

# 智能体自己的契约副本，与系统根的两份认路文件
rm -rf "$system_root/.ziminos/skills/capture" "$system_root/.ziminos/skills/distill" "$system_root/.ziminos/skills/scripts"
mkdir -p "$system_root/.ziminos/skills"
cp -R "$src/skill-pro/capture" "$src/skill-pro/distill" "$src/skill-pro/scripts" "$system_root/.ziminos/skills/"
cp "$src/skill-pro/system-root/CLAUDE.md" "$system_root/CLAUDE.md"
cp "$src/skill-pro/system-root/AGENTS.md" "$system_root/AGENTS.md"
```

复制完成后，用结构化 JSON 能力逐本合并 `appearance.json`：只检查对应的 `new-snippets-{库名}.txt`，并只把其中属于以下默认启用清单的名字追加到 `enabledCssSnippets`——`ziminos-quote-semantic-colors`、`【文件】文件图标前缀`、`【文件】二级文件夹前缀LOGO`、`【文件】彩虹文件夹（引导线版）`、`【笔记属性】自动伸缩`、`【编辑】当前行高亮（阴影）`、`【编辑-删除线】突出废弃内容`、`【编辑-图片】居中显示`、`【编辑-代码块】增加行号`、`【编辑-Baes】隐藏新建按钮`、`【PDF】列表参考线`。不要重写已有数组，不要追加清单外的名字。一个片段若复制前不存在，用户此前不可能关掉它，所以可以按新版默认启用一次；从它存在后的下一次升级起，它的开关就归用户，永远不再代开。

### 3. 自证：版本必须真的前进

```bash
after="$(version_of "$human")"
echo "升级后：$after"
[ "$before" != "$after" ] || echo "⚠️ 版本没变。若施工源本来就是同一版则正常，否则上面某一步没落地，回头查 \$src 是否为空"
```

**这三个数字要报给用户看**（升级前 / 施工源 / 升级后）。不报，一次什么都没干的升级与一次成功的升级在他眼里长得一模一样。

### 4. 这些一律不动


- `main.js` / `manifest.json` / `styles.css` / `ziminOS-Eagle-Bridge.eagleplugin`：整份更新（只有装了插件的「以人为本」与「赛博永生」有）。
- Dataview / Style Settings 的运行文件、Minimal 主题、十三个实名片段：整份更新。
- `.ziminos/skills/`：整份更新。
- **系统根的 `CLAUDE.md` / `AGENTS.md`：缺就补，在就按第三节第 6 步整份更新。** 这两份是 v0.19.0 新增的，此前装好的系统里没有——不补上，用户每开一个新会话仍要从头解释一遍这是什么地方。它们是程序说明不是用户内容；他如果改过，先把差异摆给他看再决定。
- **`edition.json`：存在就一个字节都不许碰。** 它里面的 `vaults.human` 可能是用户升级时的真实库名，覆盖成模板里的「以人为本」会让出库单指向一个不存在的目录。
- **`data.json` / `holiday-cache.json` / `types.json` 已有的键 / `appearance.json` 里已有片段的用户选择 / `app.json` / `templates.json` / 用户自带片段 / 全部笔记：一律不动。** 唯一例外是复制前不存在的新片段可按上一段规则默认启用一次。

- **《赛博永生》的 `CLAUDE.md` 与 `README.md`：改过就先问，没改过才整份更新。** 这两篇是本轮唯一需要判断的东西——它们既是随版本更新的说明书（讲三层结构怎么用），又是我们**明说过用户可以改**的文件（那份 Schema 就是他调整机器干活方式的地方）。判据用 diff 而不是猜：与上一版模板逐字节相同就直接换新；不同就把差异摆给用户看，问他是要保留自己的版本、还是换新版并把他改的段落搬过去。**不问就覆盖，等于把他对这本库立的规矩悄悄删掉，而他不会立刻发现。**
- 其余全部 Markdown（三本库里的每一篇笔记，含《兼收并蓄》的 `灵感集.md`、`剪藏/`，《赛博永生》的 `10-原料/`、`20-知识/`、`90-系统/账本.md`）：**一个字节都不动。**

一句话记住边界，与第一版同一条总纲：**受管的是「程序」，不受管的是「选择」。**

### 一次性：《赛博永生》三层目录的汉化迁移

v0.17.0 把《赛博永生》的三层目录名从英文改成中文。**只有在那本库里还留着旧名字时才做这一步**，做过一次就永远不会再触发：

```bash
# $eternal 从任意一份 edition.json 的 vaults.eternal 得出，不要写死「赛博永生」
[ -d "$eternal/10-raw"    ] && mv "$eternal/10-raw"    "$eternal/10-原料"
[ -d "$eternal/20-wiki"   ] && mv "$eternal/20-wiki"   "$eternal/20-知识"
[ -d "$eternal/90-system" ] && mv "$eternal/90-system" "$eternal/90-系统"
[ -f "$eternal/20-知识/index.md" ] && mv "$eternal/20-知识/index.md" "$eternal/20-知识/索引.md"
[ -f "$eternal/90-系统/log.md"   ] && mv "$eternal/90-系统/log.md"   "$eternal/90-系统/账本.md"
```

**是 `mv` 不是 `cp`。** 这不是分发一份新资产，是给用户已有的内容改名；拷一份会让「待提炼」在两处各数一遍，同一份原料显示成两份。

`CLAUDE.md` 与 `README.md` 这两篇属于**受管的程序说明**，整份更新成施工源的版本——它们讲的是三层结构怎么用，旧版本讲的是已经不存在的目录。但用户如果改过 `CLAUDE.md`（那是我们明说过他可以改的），**先问再覆盖**，并把他改动的段落搬进新版本。

`10-原料/` 里的原料一个字节都不许动，`90-系统/账本.md` 里已有的记录一行都不许改——旧记录写的是英文 `ingest`，插件读账本时两种标记都认，不需要也不许去批量替换。改它等于重写用户的账。

改完提醒一句：Obsidian 若正开着这本库，要重开一次才会认到新目录。

---

## 四、验证

全新安装后，`$system_root` 顶层除安装前已有的 `.DS_Store` 外只允许：

```text
兼收并蓄/
以人为本/
赛博永生/
.ziminos/
CLAUDE.md
AGENTS.md
```

逐条确认：

- 三本库各自有 `.obsidian/`，各自有 `.obsidian/themes/Minimal/theme.css` 与 13 个 `.css` 片段（`ls .obsidian/snippets/*.css | wc -l` ≥ 13）；三份 `appearance.json` 的 `enabledCssSnippets` 都含 `【编辑-删除线】突出废弃内容`。
- `以人为本/.obsidian/plugins/ziminos/{main.js,manifest.json,styles.css,ziminOS-Eagle-Bridge.eagleplugin,edition.json}` 齐全，伴侣包 `unzip -t` 校验通过；`edition.json` 是合法 JSON 且 `role` 为 `human`。
- `赛博永生/.obsidian/plugins/ziminos/edition.json` 的 `role` 为 `eternal`；`10-原料/`、`20-知识/索引.md`、`90-系统/账本.md`、`CLAUDE.md`、`README.md` 齐全（这本库的三层目录名是中文的，不是 `10-raw` / `20-wiki` / `90-system`）。
- `兼收并蓄/灵感集.md` 与 `兼收并蓄/剪藏/` 存在；`.obsidian/plugins/dataview/main.js` 存在。
- **两份 `edition.json`（`以人为本` 与 `赛博永生`）的 `vaults` 完全一致**，且三个值都是 `$system_root` 下真实存在的目录名。只有装了 ziminOS 插件的库才有版次标记；《兼收并蓄》没有这个插件，**也不该有 `edition.json`，不要为了凑数给它补一份**。
- `.ziminos/skills/capture/SKILL.md`、`.ziminos/skills/distill/SKILL.md`、`.ziminos/skills/scripts/notectl.py` 存在。
- 系统根的 `CLAUDE.md` 与 `AGENTS.md` 存在，且**除它们之外系统根没有第三个 `.md`**。自检方式：换一个全新会话打开系统根，只说一句「记一下：测试」，它应当不再反问「你的笔记库在哪」。
- 用户字体目录里五个字体文件齐全。
- **三本库里都不存在 `.obsidian/plugins/ziminos/data.json`。** 全新安装不该生成它——它由插件在用户第一次改设置时自己写出来。`.obsidian/plugins/obsidian-style-settings/data.json` 不在此列：它是随库分发的默认配色，三本库都**必须有**，不要删。
- `$system_root` 内不存在 `.git/`、`src/`、`docs/`、`skill/`、`skill-pro/`、`vault/`、`vault-pro/`、`fonts/`、`node_modules/`、`package.json`。

升级模式（B / C）**先确认程序真的前进了**：`以人为本` 与 `赛博永生` 的 `manifest.json` 版本号等于施工源的版本号；两本库的 `main.js` 与施工源的 `main.js` SHA-256 相同；两本库的 `ziminOS-Eagle-Bridge.eagleplugin` 与施工源 SHA-256 相同且 `unzip -t` 校验通过；`.ziminos/skills/` 下三个目录齐全；系统根的 `CLAUDE.md` 与 `AGENTS.md` 存在。**这些条目缺一条，这次升级就是没做成**——而它不会自己报错，用户只会在重启 Obsidian 后发现插件还是旧的。

然后额外确认：升级前已存在的 `data.json` 的 SHA-256 全部不变；`types.json` 里用户原有的属性类型一个都没被改写；用户原有插件、非空自选主题、自选正文字体、自己放进 `snippets/` 的片段与全部 Markdown 笔记一个不少；`enabledCssSnippets` 里升级前已有的名字一个没少，被用户关掉的既有片段一个都没被重新打开；v0.22.10 的「突出废弃内容」只在复制前缺失的库中默认追加一次。

---

## 五、清理

无论成功失败都清理。删除前必须确认它是本次创建的临时目录：在系统临时目录下、名字以 `ziminos-install.` 开头。

```bash
case "$install_staging_dir" in
    /tmp/ziminos-install.*) find "$install_staging_dir" -depth -delete ;;
    *) echo "拒绝清理非 ziminOS 临时目录：$install_staging_dir" >&2; exit 1 ;;
esac
```

Windows 上用 Python 或 PowerShell 删。取法三克隆出的 `.git` 里有只读文件，直接删会报 `WinError 5` / 拒绝访问——先去掉只读属性再删，而不是换别的办法重试：

```python
import os, shutil, stat

def _clear_readonly(func, path, _):
    os.chmod(path, stat.S_IWRITE)
    func(path)

assert os.path.basename(install_staging_dir).startswith("ziminos-install.")
shutil.rmtree(install_staging_dir, onerror=_clear_readonly)
```

PowerShell 的 `Remove-Item -LiteralPath $install_staging_dir -Recurse -Force` 同样能删掉只读文件（`-Force` 不能省）。

不得删除 `$system_root` 或其中任何一本库。

---

## 六、交付给用户

全新安装后输出：

> 三本笔记库都建好了，它们在同一个文件夹里并排住着：
>
> - **兼收并蓄** —— 进料口。转发的、随手想到的，全往这儿扔。
> - **以人为本** —— 工作台。项目、读书、复盘、人脉、日历都在这里。
> - **赛博永生** —— 成品库。做完的项目会自动搬进来，由我提炼成知识。
>
> 接下来三步：
>
> 1. 用 Obsidian **分别打开这三个文件夹**（不是它们外面那一层）。Obsidian 一次开一本，左下角切换。每本第一次打开时都会问信不信任，点「信任仓库作者并启用插件」。
> 2. **只有「以人为本」需要你手动开荒**：打开设置 → 左边找到 ziminOS → 第一张标签「开荒」→ 点「初始化」。另外两本已经布置好了，打开就能用。
> 3. 开完荒，跟我说句话试试：「记一下：随便什么想法」或「记一下今天：下午和谁聊了什么」——两句都会进《兼收并蓄》的 `灵感集.md`；`剪藏/` 只归浏览器插件。
>
> 笔记正文已经是霞鹜文楷，四款阅读字体都装好了。

升级（B）后输出：

> 你原来那本库一个文件都没动，它现在是三库里的「以人为本」。旁边新建了《兼收并蓄》和《赛博永生》两本，都在 `{system_root}` 里。
>
> 你的笔记、设置、左侧边栏摆好的命令、自定义配色全都在。不需要重新初始化。
>
> 用 Obsidian 把新的两本也打开一次就能用了。请**完全退出 Obsidian 再重新打开**——新字体只有重启后才看得见。然后在工作台里按 `Cmd/Ctrl + P` 运行一次「升级存量 MOC 数据库」：先看逐文件差异，确认后才迁移；自定义或多数据库笔记只报告冲突，不会覆盖，任一步失败会回滚整批。

升级（C）后输出：

> 三库系统里的 ziminOS 已从 v旧版本更新到 v新版本。你的笔记、设置、左侧边栏摆好的命令和自定义配色都没有被覆盖，不需要重新初始化。
>
> 如果这是 v0.22.8 之前开荒的旧库，请在工作台里按 `Cmd/Ctrl + P` 运行一次「升级存量 MOC 数据库」：第一扇窗口只显示逐文件差异，确认后才迁移；自定义或多数据库笔记只报告冲突，不会覆盖，任一步失败会回滚整批。

---

## 红线

- **先确认版次。** 用户没提三库 / pro / 付费，就去执行 `skill/SKILL.md`。
- 系统根不是笔记库，绝不往它根目录写**笔记**。唯一的例外是第三节第 6 步那两份 `CLAUDE.md` / `AGENTS.md`——它们是给智能体读的指令而不是给人读的笔记，也正是「新会话认不出这是什么地方」这个问题的唯一解法。除它们之外一个 `.md` 都不许建。
- 不在系统根内克隆任何源码镜像；不让用户打开仓库或仓库里的 `vault/`、`vault-pro/`。
- **绝不移动、改名或删除用户已有的笔记库。** 升级靠在旁边新建，不靠搬家。
- 在工作区之外写任何东西（B 模式那两个新目录）之前必须问，用户说不行就停。
- 只交付仓库已锁定的资产，不临时下载任何软件、插件、主题、图标或字体。
- 字体只装用户级目录，绝不提权，同名不覆盖。
- 升级绝不覆盖 `edition.json`、任何 `data.json`、用户主题/字体/片段选择、`app.json`、`templates.json`、用户笔记。
- 两份 `edition.json`（`以人为本` 与 `赛博永生`）的 `vaults` 必须完全一致；不给《兼收并蓄》补版次标记。
- 判断不了当前目录是否安全时停止，不要猜。
