#!/usr/bin/env bash
#
# 打第二版（付费·三库）的分发包。
#
# [INPUT]: 依赖仓库里的 vault/、vault-pro/、skill-pro/、fonts/ 与 npm run build 的产物
# [OUTPUT]: 一个自足的 zip + 同名 .sha256，解压出来的目录可直接充当 skill-pro/SKILL.md 的施工源
# [POS]: 唯一的分发出口。手工拖拽打包迟早漏一个文件或带上一份陈旧的 main.js，
#        而漏掉的那个文件不会在打包时报错——只会在测试者装到一半时报错。
#        因此这里先跑插件回归与构建、再跑智能体脚本测试、再逐项校验交付物，
#        任何一步失败就整体中止。
#        包内**保持仓库的目录结构**，是为了让契约里的 $src/... 路径一个字都不用改。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#
# 用法：./make-pro-package.sh [输出目录]

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
out_dir="${1:-$repo_root}"
version="$(node -p "require('$repo_root/package.json').version")"
stamp="$(date +%Y-%m-%d)"
name="ziminOS-第二版-v${version}-${stamp}"
work="$(mktemp -d /tmp/ziminos-package.XXXXXX)"
stage="$work/$name"

cleanup() { rm -rf "$work"; }
trap cleanup EXIT

echo "==> 插件回归 + 构建（类型检查 + 打包）"
( cd "$repo_root" && npm run check >/dev/null )

echo "==> 智能体脚本回归"
python3 "$repo_root/skill-pro/scripts/test_notectl.py" 2>&1 | tail -1

echo "==> 组装 $name"
mkdir -p "$stage"

# 包内保持仓库结构：契约里的 $src/vault、$src/vault-pro、$src/skill-pro、$src/fonts 因此原样可用
for item in vault vault-pro skill-pro fonts; do
    cp -R "$repo_root/$item" "$stage/$item"
done

# 开发垃圾一律不进包
find "$stage" -name '.DS_Store' -delete
find "$stage" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true
find "$stage" -name '.impeccable' -type d -exec rm -rf {} + 2>/dev/null || true

echo "==> 写安装说明"
cat > "$stage/安装说明.md" << 'GUIDE'
# ziminOS 第二版 · 安装说明

这个包会在你的电脑上装出**三本各自独立的 Obsidian 笔记库**：

- **兼收并蓄** —— 进料口。想到什么、转发什么，说一句就进来。
- **以人为本** —— 工作台。项目、读书、灵感、中国日历、复盘、人脉都在这里。
- **赛博永生** —— 成品库。做完的项目自动搬进来，由智能体提炼成知识。

不需要安装 Node.js，不需要另外下载插件、主题或字体。

---

## 三步

**第一步**：新建一个**空文件夹**，取好名字。这个名字是你整套系统的名字。
它不是笔记库，是装那三本库的箱子。

**第二步**：用桌面智能体（Claude Code 桌面版等）**打开这个空文件夹**。

**第三步**：把下面整段复制给它，连同这个 zip 的位置一起告诉它。

```text
我有一个 ziminOS 第二版的安装包（路径见下）。请把它解压到当前工作区之外的临时目录，
然后严格执行解压目录里 skill-pro/SKILL.md 的安装契约，在当前工作区原地搭建三库系统。
当前工作区是系统根，不是笔记库：不要询问名称或安装路径，不要把安装包解压进当前工作区。
请完成契约里的全部安装、验证与清理步骤，完成后告诉我如何用 Obsidian 打开并初始化。

安装包路径：<把 zip 的完整路径粘在这里>
```

---

## 装完之后

磁盘上会长这样：

```text
你建的那个文件夹/
├── 兼收并蓄/
├── 以人为本/
├── 赛博永生/
└── .ziminos/     ← 智能体自己的东西，不用管
```

用 Obsidian **分别打开里面那三个文件夹**（不是外面那一层）。Obsidian 一次开一本，左下角切换。
每本第一次打开都会问信不信任，点「信任作者并启用插件」。

**只有「以人为本」需要手动开荒**：设置 → 左边找到 ziminOS → 第一张标签「开荒」→ 点「初始化」。
另外两本已经布置好了，打开就能用，不要去点初始化。

请使用 Obsidian 1.13.0 或更高版本。

---

## 已经在用第一版？用这一段

不要新建文件夹。用桌面智能体**直接打开你现在那本笔记库**，然后复制下面整段：

```text
我现在这个工作区是一本已经在用的 ziminOS 第一版笔记库，里面有我的真实笔记。
我有一个 ziminOS 第二版的安装包（路径见下），想升级成三库系统。
请把它解压到当前工作区之外的临时目录，然后按解压目录里 skill-pro/SKILL.md 的
「三、B 从第一版升级到第二版」执行。
我现在这本库必须保持原样、一个文件都不动，它会成为三库里的「以人为本」；
另外两本库请建在它的同级目录。动手之前先跟我确认一次要写到哪里。
完成后告诉我怎么打开新的两本库。

安装包路径：<把 zip 的完整路径粘在这里>
```

它会在你那本库**旁边**新建另外两本。**你那本库一个文件都不会动**——不搬家、不改名、不需要重新初始化，
笔记、设置、左侧边栏摆好的命令、自定义配色全都在。库名也保持你原来取的那个。

因为要在工作区之外写文件，它会先停下来问你一次。你说不行它就停手。

---

## 测试反馈请特别留意

这是测试包。以下几处是新做的，最需要有人替我踩一遍：

1. **安装本身**：三本库是否都建出来了，顶层有没有多余文件。
2. **口述记录**：对智能体说「记一下：随便什么想法」，看是否进《兼收并蓄》的 `灵感集.md`。
3. **口述日记**：说「记一下今天：……」，它应当问一次今天的主题，当天第二次记录不再问。
4. **人名双链**：在《以人为本》里先建一个人脉档案，再口述一句提到他，看名字有没有变成双链。
5. **归档出库**：完成并归档一个项目，看 `90-system/赛博永生出库单.md` 有没有多出一行。
6. **提炼**：跟智能体说「提炼一下」，看项目有没有搬进《赛博永生》的 `10-原料/` 并长出知识页；再把那篇 MOC 的路径单独粘给它一次，走通路径驱动那个入口。
7. **第一版没被弄坏**：如果你是从第一版升级的，确认笔记、设置与边栏摆放一个都没变。

有任何一步卡住，把当时的原话和它的回复一起发回来。
GUIDE

echo "==> 校验交付物"
required=(
    "vault/.obsidian/plugins/ziminos/main.js"
    "vault/.obsidian/plugins/ziminos/manifest.json"
    "vault/.obsidian/plugins/ziminos/styles.css"
    "vault/.obsidian/plugins/dataview/main.js"
    "vault/.obsidian/plugins/obsidian-style-settings/main.js"
    "vault/.obsidian/themes/Minimal/theme.css"
    "vault/README.md"
    "vault-pro/以人为本/.obsidian/plugins/ziminos/edition.json"
    "vault-pro/兼收并蓄/灵感集.md"
    "vault-pro/兼收并蓄/README.md"
    "vault-pro/赛博永生/CLAUDE.md"
    "vault-pro/赛博永生/README.md"
    "vault-pro/赛博永生/20-知识/索引.md"
    "vault-pro/赛博永生/90-系统/账本.md"
    "vault-pro/赛博永生/.obsidian/plugins/ziminos/edition.json"
    "skill-pro/SKILL.md"
    "skill-pro/capture/SKILL.md"
    "skill-pro/distill/SKILL.md"
    "skill-pro/scripts/notectl.py"
    "安装说明.md"
)
for path in "${required[@]}"; do
    [ -e "$stage/$path" ] || { echo "缺少交付物：$path" >&2; exit 1; }
done

snippets="$(find "$stage/vault/.obsidian/snippets" -name '*.css' | wc -l | tr -d ' ')"
[ "$snippets" -ge 12 ] || { echo "CSS 片段只有 $snippets 个，应当至少 12 个" >&2; exit 1; }

font_files="$(find "$stage/fonts" \( -name '*.ttf' -o -name '*.otf' \) | wc -l | tr -d ' ')"
[ "$font_files" -eq 5 ] || { echo "字体文件有 $font_files 个，应当是 5 个" >&2; exit 1; }

# 版次标记里的三本库名必须两两一致，否则出库单会指向一个不存在的目录
node -e '
const fs = require("fs");
const paths = process.argv.slice(1);
const seen = paths.map((p) => JSON.stringify(JSON.parse(fs.readFileSync(p, "utf8")).vaults));
if (new Set(seen).size !== 1) { console.error("edition.json 的 vaults 不一致"); process.exit(1); }
' "$stage/vault-pro/以人为本/.obsidian/plugins/ziminos/edition.json" \
  "$stage/vault-pro/赛博永生/.obsidian/plugins/ziminos/edition.json"

# 第一版的库里绝不能混进版次标记，否则免费版会被误当成付费版
[ ! -e "$stage/vault/.obsidian/plugins/ziminos/edition.json" ] || {
    echo "vault/ 里混进了 edition.json —— 那会让第一版的库被当成第二版" >&2; exit 1; }

echo "==> 打包"
mkdir -p "$out_dir"
zip_path="$out_dir/$name.zip"
rm -f "$zip_path" "$zip_path.sha256"

# 用 Python 的 zipfile 而不是 zip 命令行。
# 理由是这个包里 104 个条目**全部**含中文文件名（三本库名、十二个带【】的 CSS 片段、安装说明），
# 而 macOS 自带的 Info-ZIP 不给它们置 UTF-8 标志位（通用位第 11 位）。
# 不置位的后果只在别人机器上发作：Windows 自带解压会按系统代码页去猜那串字节，
# 解出来是一堆乱码目录名，而安装契约按名字找目录，于是第一步就失败——
# 打包这边不会有任何报错。zipfile 对非 ASCII 名一律置位，跨平台因此可预期。
python3 - "$work" "$name" "$zip_path" << 'PACK'
import os, stat, sys, zipfile

work, name, zip_path = sys.argv[1], sys.argv[2], sys.argv[3]
root = os.path.join(work, name)
count = 0

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for folder, dirs, files in os.walk(root):
        dirs.sort()
        for filename in sorted(files):
            if filename == ".DS_Store":
                continue

            full = os.path.join(folder, filename)
            arc = os.path.join(name, os.path.relpath(full, root)).replace(os.sep, "/")
            info = zipfile.ZipInfo(arc)
            info.compress_type = zipfile.ZIP_DEFLATED
            # 保留权限位，免得脚本解出来丢掉可执行属性
            info.external_attr = (stat.S_IMODE(os.stat(full).st_mode)) << 16
            with open(full, "rb") as handle:
                z.writestr(info, handle.read())
            count += 1

# 自证：非 ASCII 的条目必须全部带上 UTF-8 标志位，否则这个包不许发出去
with zipfile.ZipFile(zip_path) as z:
    bad = [i.filename for i in z.infolist()
           if any(ord(c) > 127 for c in i.filename) and not (i.flag_bits & 0x800)]

if bad:
    print("有 %d 个中文文件名没带 UTF-8 标志位，拒绝出包" % len(bad), file=sys.stderr)
    sys.exit(1)

print("    %d 个文件，中文名全部带 UTF-8 标志位" % count)
PACK

( cd "$out_dir" && shasum -a 256 "$name.zip" > "$name.zip.sha256" )

echo ""
echo "✅ $zip_path"
echo "   $(du -h "$zip_path" | cut -f1)  ·  $(unzip -l "$zip_path" | tail -1 | awk '{print $2}') 个文件"
echo "   $(cat "$zip_path.sha256")"
