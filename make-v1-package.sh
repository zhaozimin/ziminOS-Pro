#!/usr/bin/env bash
#
# 打第一版（免费·单库）的手动安装包：不用智能体、不用装 Git，下载解压后照着说明自己装。
#
# [INPUT]: 依赖 git（只从 HEAD 取交付物）、npm test、python3 与 pack-zip.py；
#          依赖 skill/SKILL.md 的两份清单——「装完必须存在的交付物」与「升级时整份替换的程序文件」；
#          依赖 docs/第一版手动安装指南.html；经 SSH 只取第一版仓库 main 的提交与树（不取文件内容）核对两边一致
# [OUTPUT]: ziminOS-v{版本}-setup.zip 与同名 .sha256，并打印一段可直接贴进 Gitee 发行版的说明
# [POS]: 第一版面向「人」的唯一分发出口，与面向智能体的 make-pro-package.sh 并列。
#        三条判据决定了它的形状：
#        一、清单不另写。装完该有哪些文件、升级该换哪些文件，只在安装契约里有一份——
#           这里解析契约而不是抄一份，于是手动装出来的库与智能体装出来的库不可能是两种东西。
#        二、包是第一版仓库 main 的另一种形态。交付物只从 HEAD 取：被 .gitignore 挡住的开发库状态
#           （可能装着微信读书 Cookie 的 data.json）在工作区里看得见、在 git status 里看不见，
#           cp -R 会把它一起带出门。取完再与第一版仓库 main 的树对象比对——发行版挂在那边，
#           包里的字节就必须是那边的字节。「产物对得上源码」归 publish-v1.sh 的构建闸管，这里不重复构建：
#           esbuild 会把 node_modules 所在的相对位置写进注释，换个目录重建就会与入库那份差一截前缀。
#        三、布局给人看，不给机器看。字体文件夹里只放字体（混进一个许可证，Windows 全选后右键就没有「安装」）；
#           升级文件里只放程序、并按 Obsidian 设置里那三枚「打开…文件夹」按钮分组——
#           学员照着按钮名找得到落点，照着拖也盖不掉任何一份设置。
#        附件名只用 ASCII：skill/SKILL.md 的取法一让智能体按这个名字去发行版取包，
#        Python 的 urllib 遇到路径里的中文直接抛异常——而那正是没有 Git 的 Windows 上最常见的下载工具。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#
# 用法：./make-v1-package.sh [输出目录]

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
out_dir="${1:-$repo_root}"
cd "$repo_root"

contract="skill/SKILL.md"
guide="docs/第一版手动安装指南.html"
# 与 publish-v1.sh 的 V1_REMOTE 是同一个仓库。Gitee 上它已改名为 ziminos-mini，旧名至今仍解析
v1_repo="ziminzhao/zimin-os-v1"
V1_REMOTE="git@gitee.com:$v1_repo.git"

# ============================================================
# 一、闸门
# ============================================================

if [ -n "$(git status --porcelain)" ]; then
    echo "工作区不干净。先提交——包里装的必须是已经进过 git 的那一版。" >&2
    exit 1
fi

echo "==> 回归"
if ! test_log="$(npm test 2>&1)"; then
    printf '%s\n' "$test_log" | tail -30 >&2
    echo "回归没过，拒绝出包。" >&2
    exit 1
fi

version="$(node -p "require('./package.json').version")"
name="ziminOS-v${version}-setup"

# ============================================================
# 二、核对第一版仓库
# ============================================================

# 走 publish-v1.sh 推送用的同一条 SSH 通道，不走 Gitee 开放接口：它对未登录请求限流（403），
# 而打包恰恰紧跟在 publish-v1.sh 之后——v0.33.0 发版时这一步就是这样卡住的。
# 只取提交与树、不取文件内容（--filter=blob:none）：比的是树对象哈希，一个 blob 都用不着，实测 5 秒、百来 KB
v1_main_matching_head() {
    local probe commit folder
    probe="$(mktemp -d /tmp/ziminos-v1-probe.XXXXXX)"
    if ! git init --quiet --bare "$probe" || ! git -C "$probe" fetch --quiet --depth 1 --filter=blob:none "$V1_REMOTE" main; then
        rm -rf "$probe"
        echo "连不上第一版仓库（$V1_REMOTE），确认不了它与本地是否一致" >&2
        return 1
    fi
    commit="$(git -C "$probe" rev-parse FETCH_HEAD)"
    # 只比包里装着的那两棵树：README、docs 两边本来就各说各的
    for folder in vault fonts; do
        if [ "$(git -C "$probe" rev-parse "FETCH_HEAD:$folder")" != "$(git rev-parse "HEAD:$folder")" ]; then
            rm -rf "$probe"
            echo "第一版仓库 main 的 $folder/ 与本地 HEAD 不一致。先跑 ./publish-v1.sh --push，再来打包。" >&2
            return 1
        fi
    done
    rm -rf "$probe"
    echo "$commit"
}

echo "==> 核对第一版仓库"
v1_head="$(v1_main_matching_head)"
echo "    vault/ 与 fonts/ 与第一版仓库 main（${v1_head:0:7}）逐字节相同"

# ============================================================
# 三、组装：从 HEAD 取料，按契约摆成给人看的样子
# ============================================================

work="$(mktemp -d /tmp/ziminos-v1-package.XXXXXX)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/src" "$work/$name"

git archive --format=tar HEAD vault fonts "$guide" | tar -x -C "$work/src"

echo "==> 组装 $name"
python3 - "$work/src" "$work/$name" "$contract" "$guide" "$version" << 'ASSEMBLE'
import json, os, re, shutil, sys

src, stage, contract_path, guide, version = sys.argv[1:6]
contract = open(contract_path, encoding="utf-8").read()

# 包里的名字。它们也写在安装说明里，tests/packaging.mjs 钉着两边同名
VAULT = "ziminOS"
FONTS = "字体"
LICENSES = "许可证"
UPGRADE = "升级文件"
GUIDE = "安装说明.html"
FONT_EXT = (".ttf", ".otf")
# 升级文件按 Obsidian 设置里的三枚按钮分组：「打开插件文件夹」「打开样式代码片段文件夹」「打开主题文件夹」
UPGRADE_HOMES = {"plugins": "插件文件夹", "snippets": "样式代码片段文件夹", "themes": "主题文件夹"}


def copy(from_rel, to_rel):
    target = os.path.join(stage, to_rel)
    if os.path.exists(target):
        sys.exit("两个文件要落到同一个位置：%s" % to_rel)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.copy2(os.path.join(src, from_rel), target)


# ------------------------------------------------------------
# 从契约里读两份清单
# ------------------------------------------------------------

listing = re.search(r"确认下面的系统交付文件都存在：\s*```text\n(.*?)\n```", contract, re.S)
if not listing:
    sys.exit("契约里找不到「确认下面的系统交付文件都存在」那份清单——契约改了版式，这里要跟着改")
required = [line.strip()[len("施工源/"):] for line in listing.group(1).splitlines() if line.strip().startswith("施工源/")]

# 升级分支里逐个 cp 的程序文件，加上整份更新的片段目录
upgrade = set(re.findall(r'cp "\$install_staging_dir/repo/(vault/\.obsidian/[^"]+)"', contract))
if not re.search(r'for \w+ in "\$install_staging_dir/repo/vault/\.obsidian/snippets/"\*\.css', contract):
    sys.exit("契约不再整份更新 CSS 片段——升级文件该装哪些片段，这里要跟着改")
snippet_dir = os.path.join(src, "vault/.obsidian/snippets")
upgrade |= {"vault/.obsidian/snippets/" + f for f in os.listdir(snippet_dir) if f.endswith(".css")}

if "vault/.obsidian/plugins/ziminos/main.js" not in upgrade:
    sys.exit("从契约里没读出 ziminOS 的 main.js——解析坏了，这个包不许发")
if any(os.path.basename(rel) == "data.json" for rel in upgrade):
    # 契约若把某份设置当程序整份替换，手动升级的人会照着把自己的设置盖掉
    sys.exit("契约的升级分支在替换 data.json——那是用户的设置，不是程序")

# ------------------------------------------------------------
# 摆放
# ------------------------------------------------------------

# 笔记库：HEAD 里 vault/ 的全部，一个不多一个不少
shutil.copytree(os.path.join(src, "vault"), os.path.join(stage, VAULT))

# 字体与许可证分开放；fonts/ 根上那份 CLAUDE.md 是写给开发者的地图，不进包
fonts_root = os.path.join(src, "fonts")
for family in sorted(os.listdir(fonts_root)):
    if not os.path.isdir(os.path.join(fonts_root, family)):
        continue
    for filename in sorted(os.listdir(os.path.join(fonts_root, family))):
        if filename.lower().endswith(FONT_EXT):
            copy("fonts/%s/%s" % (family, filename), "%s/%s" % (FONTS, filename))
        else:
            copy("fonts/%s/%s" % (family, filename), "%s/%s/%s" % (LICENSES, family, filename))

for rel in sorted(upgrade):
    home, rest = rel[len("vault/.obsidian/"):].split("/", 1)
    if home not in UPGRADE_HOMES:
        sys.exit("契约要替换一个不在三枚按钮之下的程序文件：%s" % rel)
    copy(rel, "%s/%s/%s" % (UPGRADE, UPGRADE_HOMES[home], rest))

copy(guide, GUIDE)

# ------------------------------------------------------------
# 校验：问题一次报全，而不是修一个再撞下一个
# ------------------------------------------------------------

problems = []


def expect(ok, message):
    if not ok:
        problems.append(message)


def stage_path(*parts):
    return os.path.join(stage, *parts)


for rel in required:
    area, rest = rel.split("/", 1)
    if area == "vault":
        target = stage_path(VAULT, rest)
    elif area == "fonts":
        family, filename = rest.split("/", 1)
        target = stage_path(FONTS, filename) if filename.lower().endswith(FONT_EXT) else stage_path(LICENSES, family, filename)
    else:
        problems.append("契约清单里有一项不知道该放进包里哪儿：" + rel)
        continue
    expect(os.path.isfile(target), "缺少交付物：" + os.path.relpath(target, stage))

# 与智能体装出来的那本逐项相同：库根只有 .obsidian 与 README.md
top = sorted(os.listdir(stage_path(VAULT)))
expect(top == [".obsidian", "README.md"], "笔记库顶层应当只有 .obsidian 与 README.md，实际是 %s" % top)

named_fonts = sorted(os.path.basename(rel) for rel in required if rel.startswith("fonts/") and rel.lower().endswith(FONT_EXT))
expect(named_fonts and sorted(os.listdir(stage_path(FONTS))) == named_fonts, "「%s」里的文件与契约点名的字体不一致" % FONTS)

vault_snippets = sorted(f for f in os.listdir(stage_path(VAULT, ".obsidian/snippets")) if f.endswith(".css"))
expect(sorted(os.listdir(stage_path(UPGRADE, UPGRADE_HOMES["snippets"]))) == vault_snippets, "升级文件里的片段与笔记库里的片段不一致")

manifest = json.load(open(stage_path(VAULT, ".obsidian/plugins/ziminos/manifest.json"), encoding="utf-8"))
expect(manifest.get("version") == version, "插件 manifest 的版本 %s 与 package.json 的 %s 不一致" % (manifest.get("version"), version))
expect(os.path.isfile(stage_path(GUIDE)), "缺少安装说明")

# 私有状态与开发文件一个都不许出门。唯一的 data.json 是 Style Settings 的默认配色——契约要求它随新库交付，
# 而升级文件里一份 data.json 都不许有
allowed_data = os.path.join(VAULT, ".obsidian/plugins/obsidian-style-settings/data.json")
private = {"holiday-cache.json", "recent-files.json", "cursor-positions.json", "edition.json", "CLAUDE.md", "AGENTS.md"}
for folder, dirs, files in os.walk(stage):
    for filename in files:
        rel = os.path.relpath(os.path.join(folder, filename), stage)
        expect(filename not in private, "包里混进了不该出门的文件：" + rel)
        expect(not (filename.startswith("workspace") and filename.endswith(".json")), "包里混进了工作区状态：" + rel)
        expect(filename != "data.json" or rel == allowed_data, "包里混进了一份设置：" + rel)

if problems:
    sys.exit("\n".join(["交付物校验没过："] + ["  - " + p for p in problems]))

count = sum(len(files) for _, _, files in os.walk(stage))
print("    笔记库、%d 个字体、%d 个升级程序文件，共 %d 个文件" % (len(named_fonts), len(upgrade), count))
ASSEMBLE

# ============================================================
# 四、打包
# ============================================================

echo "==> 打包"
mkdir -p "$out_dir"
zip_path="$out_dir/$name.zip"
rm -f "$zip_path" "$zip_path.sha256"

# 时间戳取这次提交的时刻：同一个提交无论何时重打，都得到同一个 zip
python3 "$repo_root/pack-zip.py" "$work/$name" "$zip_path" --date "$(git log -1 --format=%cI HEAD)"

( cd "$out_dir" && shasum -a 256 "$name.zip" > "$name.zip.sha256" )
sha="$(cut -d ' ' -f 1 < "$zip_path.sha256")"
# 按字节数算，不用 du：du 报的是磁盘占用，簇大的卷上能比文件本身大出几 MB；
# 除以 1024² 是因为 Windows 与浏览器下载栏标的「MB」就是这么算的，学员看到的是这个数
size="$(awk -v bytes="$(wc -c < "$zip_path")" 'BEGIN { printf "%.0f MB", bytes / 1048576 }')"

notes="$out_dir/$name.release.md"
cat > "$notes" << NOTES
**不用智能体、不用装 Git，下载就能装。** 需要 Obsidian 1.13.0 或更高版本。

1. 下载附件 **$name.zip**（$size）。页面上如果还有 \`v$version.zip\`、\`v$version.tar.gz\`，那是 Gitee 自动附带的源代码，不是安装包。
2. 解压，双击里面的「安装说明.html」，照着做：装字体 → 用 Obsidian 打开「ziminOS」文件夹 → 设置里点「初始化」。
3. 已经装过的人：只看安装说明里的「以后怎么升级」，**不要**把新的「ziminOS」文件夹覆盖到你原来那本库上。

用桌面智能体安装的人不用管这个页面：智能体运行安装脚本时会自己来取同一个包，不需要 Git。

SHA-256：\`$sha\`
NOTES

# 安装脚本按名字取 zip 与 .sha256：两个都得挂上去，文件名一个字都不许改
cat << DONE

✅ $zip_path
   ${size}  ·  SHA-256 $sha

==> 挂到发行版（令牌取自钥匙串，一次性设置见 upload-release.py 头部）：
   python3 "$repo_root/upload-release.py" --repo "$v1_repo" --tag "v$version" --title "ziminOS v$version 安装包" \\
       --notes "$notes" "$zip_path" "$zip_path.sha256"
DONE
