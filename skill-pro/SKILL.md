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
3. 当前目录存在 `.obsidian/` **但不存在** `以人为本/` → 这是一本**第一版的单库**，进入「二、B 升级模式」。
4. 当前目录存在 `以人为本/.obsidian/` 或 `.ziminos/` → 已经是三库系统，进入「二、C 三库升级模式」。
5. 以上都不是，且除 `.DS_Store` 外目录为空 → 「二、A 全新安装」。
6. 目录非空、又不符合 3 与 4 → 停止，不覆盖任何文件。

---

## 二、在工作区外取得施工源

施工源有两种来路，**先看用户手里有没有分发包**。多数用户拿到的是一个压缩包而不是仓库地址。

两条来路取的是**同一个仓库**，只是形态不同：第二版的事实源是 Gitee 上的 `ziminzhao/ziminos-pro`。**第一版住在另一个仓库 `ziminzhao/zimin-os-v1`，那里没有 `vault-pro/` 与 `skill-pro/`**，拿它装第二版会卡在下面那张交付物清单上——这是最容易走错的一步，因为第一版的契约里写的正是那个地址。（GitHub 上的 `zhaozimin/ziminOS` 已 403，两个版次都不要用它。）

### 来路一：用户给了分发包（最常见）

把压缩包解压到**工作区之外**的临时目录，解压出来的那个目录就是施工源：

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
unzip -q "<用户给的 zip 路径>" -d "$install_staging_dir"
src="$(find "$install_staging_dir" -maxdepth 2 -type d -name vault-pro | head -1 | xargs dirname)"
```

`$src` 应当是那个同时含 `vault/`、`vault-pro/`、`skill-pro/`、`fonts/` 的目录。找不到就停止并说明包不完整，**不要**试图去 GitHub 补那几个缺的目录——那个仓库里根本没有它们。要补只能走来路二，从 Gitee 的第二版仓库重新取一份完整的。

### 来路二：用户给了仓库地址

```bash
install_staging_dir="$(mktemp -d /tmp/ziminos-install.XXXXXX)"
git clone --depth 1 "https://gitee.com/ziminzhao/ziminos-pro.git" "$install_staging_dir/repo"
src="$install_staging_dir/repo"
```

**地址是 `ziminzhao/ziminos-pro`，不是第一版那个 `ziminzhao/zimin-os-v1`。** 后者 clone 下来是能成功的——失败要等到交付物清单那一步才发作，报的还是「仓库不完整」这种听上去像网络出错的话。用户如果给的是第一版地址或已经 403 的 GitHub 地址，直接告诉他那不是第二版的，换成上面这个。

clone 需要认证或直接失败时，**不要让用户去创建账号、也不要去找别的镜像**：说明情况，请他改用来路一的分发包。仓库的可见性是作者随时可能调整的东西，而一条装不上的指令好过一条把人引去别处的指令。

两种来路之后的每一步完全相同，因为**分发包内部就是仓库的目录结构**——这么打包正是为了让契约里的路径一个字都不用改。

禁止在 `$system_root` 内解压或 `git clone`。

确认第二版交付物齐全，任一缺失就停止并说明仓库不完整：

```text
$src/vault/                                    第一版笔记库成品（= 以人为本的主体）
$src/vault-pro/兼收并蓄/                        进料口成品
$src/vault-pro/以人为本/.obsidian/plugins/ziminos/edition.json    版次标记（叠加件）
$src/vault-pro/赛博永生/                        成品库成品
$src/skill-pro/capture/SKILL.md                口述捕获契约
$src/skill-pro/distill/SKILL.md                赛博永生提炼契约
$src/skill-pro/scripts/notectl.py              口述捕获的确定性脚本
$src/fonts/                                    四款正文字体
```

`vault/` 与 `vault-pro/` 的分工是硬的，别搞混：**`vault/` 是三本库共享的那一份程序与外观资产的唯一出处**（ziminOS 插件、Dataview、Style Settings、Minimal 主题、十二个 CSS 片段），仓库里只存在这一份；`vault-pro/` 只装第二版特有的内容与配置。这样第一版与第二版永远不会在主题或插件版本上分叉。

不要运行 `npm install` / `npm run build`，不要安装 Node.js，不要去 Obsidian 商店另行下载任何东西。

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
```

注意 `赛博永生` 的 `edition.json` 已经随它的模板一起铺进去了（`role: eternal`），不要再覆盖。

`types.json` 只有「以人为本」需要——另外两本库没有卡片、没有人脉，属性面板里没有要登记的类型。

### 4. 装字体

与第一版完全相同：把 `$src/fonts/` 里的五个字体文件装进**当前用户**的字体目录，不碰系统级、不提权、同名文件绝不覆盖。

macOS：

```bash
mkdir -p ~/Library/Fonts
for f in "$src"/fonts/*/*.ttf "$src"/fonts/*/*.otf; do
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

同样要改 `$eternal/.obsidian/plugins/ziminos/edition.json` 里的 `vaults.human`。**三份标记里的 `vaults` 必须完全一致**，它是系统布局的唯一事实源，不一致会让出库单指向一个不存在的地方。

5. 现有库的 `main.js` / `manifest.json` / `styles.css` 更新到施工源的版本（第二版的功能就在这份产物里）。
6. 按 A 的第 4、5、6 步装字体、留说明书、铺系统根的认路文件。
7. **现有库的一切「选择」一律不动**：`data.json`、`holiday-cache.json`、`types.json` 已调过的键、`appearance.json` 里用户选过的主题/字体/片段、`app.json`、`templates.json`、用户自己的片段与全部笔记。规则与第一版 `skill/SKILL.md` 第三节的所有权表逐条相同。

升级后**不要**让用户重新点「初始化」——他的库早就开过荒了。

---

## 三、C 三库系统的日常升级

已经是三库系统，只更新程序、不动选择。

对三本库分别执行：

- `main.js` / `manifest.json` / `styles.css`：整份更新（只有装了插件的「以人为本」与「赛博永生」有）。
- Dataview / Style Settings 的运行文件、Minimal 主题、十二个实名片段：整份更新。
- `.ziminos/skills/`：整份更新。
- **系统根的 `CLAUDE.md` / `AGENTS.md`：缺就补，在就按第三节第 6 步整份更新。** 这两份是 v0.19.0 新增的，此前装好的系统里没有——不补上，用户每开一个新会话仍要从头解释一遍这是什么地方。它们是程序说明不是用户内容；他如果改过，先把差异摆给他看再决定。
- **`edition.json`：存在就一个字节都不许碰。** 它里面的 `vaults.human` 可能是用户升级时的真实库名，覆盖成模板里的「以人为本」会让出库单指向一个不存在的目录。
- **`data.json` / `holiday-cache.json` / `types.json` 已有的键 / `appearance.json` 的用户选择 / `app.json` / `templates.json` / 用户自带片段 / 全部笔记：一律不动。**

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

- 三本库各自有 `.obsidian/`，各自有 `.obsidian/themes/Minimal/theme.css` 与 12 个 `.css` 片段（`ls .obsidian/snippets/*.css | wc -l` ≥ 12）。
- `以人为本/.obsidian/plugins/ziminos/{main.js,manifest.json,styles.css,edition.json}` 齐全；`edition.json` 是合法 JSON 且 `role` 为 `human`。
- `赛博永生/.obsidian/plugins/ziminos/edition.json` 的 `role` 为 `eternal`；`10-原料/`、`20-知识/索引.md`、`90-系统/账本.md`、`CLAUDE.md`、`README.md` 齐全（这本库的三层目录名是中文的，不是 `10-raw` / `20-wiki` / `90-system`）。
- `兼收并蓄/灵感集.md` 与 `兼收并蓄/剪藏/` 存在；`.obsidian/plugins/dataview/main.js` 存在。
- **三份 `edition.json` 里的 `vaults` 三个值两两一致**，且每个值都是 `$system_root` 下真实存在的目录名。
- `.ziminos/skills/capture/SKILL.md`、`.ziminos/skills/distill/SKILL.md`、`.ziminos/skills/scripts/notectl.py` 存在。
- 系统根的 `CLAUDE.md` 与 `AGENTS.md` 存在，且**除它们之外系统根没有第三个 `.md`**。自检方式：换一个全新会话打开系统根，只说一句「记一下：测试」，它应当不再反问「你的笔记库在哪」。
- 用户字体目录里五个字体文件齐全。
- **三本库里都不存在 `data.json`。** 全新安装不该生成它——它由插件在用户第一次改设置时自己写出来。
- `$system_root` 内不存在 `.git/`、`src/`、`docs/`、`skill/`、`skill-pro/`、`vault/`、`vault-pro/`、`fonts/`、`node_modules/`、`package.json`。

升级模式（B / C）额外确认：升级前已存在的 `data.json` 的 SHA-256 全部不变；`types.json` 里用户原有的属性类型一个都没被改写；用户原有插件、非空自选主题、自选正文字体、自己放进 `snippets/` 的片段与全部 Markdown 笔记一个不少；`enabledCssSnippets` 里升级前已有的名字一个没少，被用户关掉的片段一个都没被重新打开。

---

## 五、清理

无论成功失败都清理，删除前必须验证路径：

```bash
case "$install_staging_dir" in
    /tmp/ziminos-install.*) find "$install_staging_dir" -depth -delete ;;
    *) echo "拒绝清理非 ziminOS 临时目录：$install_staging_dir" >&2; exit 1 ;;
esac
```

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
> 1. 用 Obsidian **分别打开这三个文件夹**（不是它们外面那一层）。Obsidian 一次开一本，左下角切换。每本第一次打开时都会问信不信任，点「信任作者并启用插件」。
> 2. **只有「以人为本」需要你手动开荒**：打开设置 → 左边找到 ziminOS → 第一张标签「开荒」→ 点「初始化」。另外两本已经布置好了，打开就能用。
> 3. 开完荒，跟我说句话试试：「记一下：随便什么想法」——它会进《兼收并蓄》；「记一下今天：下午和谁聊了什么」——它会进《以人为本》今天的日记。
>
> 笔记正文已经是霞鹜文楷，四款阅读字体都装好了。

升级（B）后输出：

> 你原来那本库一个文件都没动，它现在是三库里的「以人为本」。旁边新建了《兼收并蓄》和《赛博永生》两本，都在 `{system_root}` 里。
>
> 你的笔记、设置、左侧边栏摆好的命令、自定义配色全都在。不需要重新初始化。
>
> 用 Obsidian 把新的两本也打开一次就能用了。请**完全退出 Obsidian 再重新打开**——新字体只有重启后才看得见。

---

## 红线

- **先确认版次。** 用户没提三库 / pro / 付费，就去执行 `skill/SKILL.md`。
- 系统根不是笔记库，绝不往它根目录写**笔记**。唯一的例外是第三节第 6 步那两份 `CLAUDE.md` / `AGENTS.md`——它们是给智能体读的指令而不是给人读的笔记，也正是「新会话认不出这是什么地方」这个问题的唯一解法。除它们之外一个 `.md` 都不许建。
- 不在系统根内克隆 GitHub 仓库；不让用户打开仓库或仓库里的 `vault/`、`vault-pro/`。
- **绝不移动、改名或删除用户已有的笔记库。** 升级靠在旁边新建，不靠搬家。
- 在工作区之外写任何东西（B 模式那两个新目录）之前必须问，用户说不行就停。
- 只交付仓库已锁定的资产，不临时下载任何软件、插件、主题、图标或字体。
- 字体只装用户级目录，绝不提权，同名不覆盖。
- 升级绝不覆盖 `edition.json`、任何 `data.json`、用户主题/字体/片段选择、`app.json`、`templates.json`、用户笔记。
- 三份 `edition.json` 的 `vaults` 必须完全一致。
- 判断不了当前目录是否安全时停止，不要猜。
