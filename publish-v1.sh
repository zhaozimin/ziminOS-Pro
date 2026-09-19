#!/usr/bin/env bash
#
# [INPUT]: 依赖本仓库为第二版事实源（含 vault-pro/ 与 skill-pro/），依赖 npm run check 通过，
#          依赖 git 与 rsync；第一版的 GitHub / Gitee 两个目标仓库均需可写
# [OUTPUT]: 把两版共享的那部分（src / vault / eagle-companion / fonts / skill / tests / 构建与依赖配置）
#           单向发布到第一版公开仓库，并在 --push 时把同一提交推到 GitHub 与 Gitee；
#           FORCE_TRACK 里的种子文件被目标端的 .gitignore 挡着，必须显式 force-add 才出得了门
# [POS]: Pro 事实源到第一版两个公开镜像之间**唯一**的同步通道，方向只有 pro → v1 一条。
#        它存在的理由是一次事故：两个仓库曾各自能改同一份 src/，于是分叉出
#        editing/explorer/legacy 与 eternal/edition 两批互不相容的改动，
#        最后要靠一次 23 个文件的三方合并才收得回来。收敛成单向通道之后，
#        「同一个 bug 在两边各修一次、修错一次」这件事在结构上不再可能发生。
#        Shell 变量紧邻中文标点时必须写成 ${name}，否则部分 Bash/locale 会把多字节
#        字符误吞进变量名，让同步在全部回归通过之后才因 unbound variable 中止。
#        方向不能反：pro 的 src/ 是 v1 的**严格超集**——第二版代码被装配期开关
#        关掉后，免费库行为与第二版出现之前逐字节相同；从 v1 往回同步会删掉第二版。
# [PROTOCOL]: 新增任何第二版专属的顶层路径时，必须同步 PRO_ONLY——
#             漏一个就是把付费交付物推进公开仓库，而 git 不会因此报错
#
set -euo pipefail

# SSH 而不是 HTTPS：这条通道要**推**，非交互环境不能回答平台的用户名/密码提示。
# 两个平台都在真正写入前 dry-run；任何一边分叉都中止，不以 force 假装镜像一致。
V1_GITEE_REMOTE="git@gitee.com:ziminzhao/zimin-os-v1.git"
V1_GITHUB_REMOTE="git@github.com:zhaozimin/ziminOS.git"

# ============================================================
# 两份清单：搬什么、绝不搬什么
# ============================================================

# 两版共享的全部东西。src/ 整份过去（含第二版那部分，没有 edition.json 就不执行），
# 因此两个仓库的 src/、vault/ 与 main.js 逐字节相同，不存在第二种构建。
SHARED=(
    src
    vault
    eagle-companion
    fonts
    skill
    installer
    tests
    package-eagle.sh
    package.json
    package-lock.json
    tsconfig.json
    esbuild.config.mjs
    .gitattributes
    .gitignore
    LICENSE
)

# 只住在第二版仓库的：付费交付物，以及只在事实源仓库里跑的发布工具。一个字节都不许进公开仓库。
# make-v1-package.sh 打的是第一版的包，却同样只在这边跑——它核对的正是本脚本推过去的那份结果
PRO_ONLY=(
    skill-pro
    vault-pro
    make-pro-package.sh
    make-v1-package.sh
    pack-zip.py
    upload-release.py
    publish-v1.sh
)

# 被 vault/.obsidian/.gitignore 挡着、却必须随交付物出门的种子文件。
# 那条 workspace*.json 的规则是给**学员的笔记库**写的（布局与最近打开的文件是本机状态），
# 而同一个文件名在仓库这边是一份只含 left-ribbon 的种子，决定学员第一眼的左侧功能区。
# rsync 把它搬过去了，但目标仓库的 `git add -A` 认那条规则，于是它会停在工作区、永不入库；
# 更隐蔽的是随后那句 `git status --porcelain` 判空——只改了种子的那一次会被报成「无需发布」。
# 因此这里显式 force-add。两版的 vault/ 树哈希必须逐字节相同，
# make-v1-package.sh 打包前正是拿这个哈希对账，漏一个就在那里中止。
FORCE_TRACK=(
    vault/.obsidian/workspace.json
)

# 两个仓库各自说给各自读者听的，发布时一律不碰——
# 覆盖它们等于让第一版的首页开始介绍它没有的功能
PER_REPO=(
    README.md
    AGENTS.md
    CLAUDE.md
    docs
)

# ============================================================
# 一、闸门
# ============================================================

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$repo_root"

[ -d vault-pro ] && [ -d skill-pro ] || {
    echo "这里不是第二版仓库（缺 vault-pro/ 或 skill-pro/），拒绝发布。" >&2
    exit 1
}

if [ -n "$(git status --porcelain)" ]; then
    echo "工作区不干净。先提交或收起改动——发布的必须是已经进过 git 的那一版。" >&2
    exit 1
fi

echo "==> 回归与构建"
npm run check >/dev/null
python3 skill-pro/scripts/test_notectl.py >/dev/null 2>&1

# 构建会重写 main.js。若它与 HEAD 不一致，说明入库的产物是陈的——
# 推一份和源码对不上的 main.js 出去，用户装到的插件行为与仓库里的代码不是一回事
if [ -n "$(git status --porcelain)" ]; then
    echo "构建后工作区出现改动，说明入库的 main.js 是陈的。先提交重建结果再发布：" >&2
    git status --short >&2
    exit 1
fi

source_sha="$(git rev-parse --short HEAD)"
version="$(node -p "require('./package.json').version")"

# ============================================================
# 二、取目标仓库
# ============================================================

# 暂存放在仓库内部而不是 /tmp，只为一件事：目标端要跑回归，而 Node 的 ESM 解析
# 从模块真实路径逐级向上找 node_modules——symlink 过去的那份它不认（ERR_MODULE_NOT_FOUND）。
# 放在仓库里，向上一级就是本仓库的 node_modules，两边版本按定义相同（package.json 刚同步过）。
staging="$repo_root/.publish-staging"
trap 'rm -rf "$repo_root/.publish-staging"' EXIT
rm -rf "$staging"

echo "==> 取第一版仓库"
# 不能浅克隆：若 GitHub 落后多个提交，推送端必须持有中间历史才能把它快进到 Gitee。
# blob 仍按需取，避免为了提交血缘重复下载全部历史字体与二进制产物。
git clone --quiet --filter=blob:none --no-tags "$V1_GITEE_REMOTE" "$staging/v1"
target="$staging/v1"

# ============================================================
# 三、同步共享部分
# ============================================================

echo "==> 同步 ${#SHARED[@]} 个共享路径"
for item in "${SHARED[@]}"; do
    [ -e "$item" ] || { echo "共享清单里的 $item 在本仓库不存在" >&2; exit 1; }

    if [ -d "$item" ]; then
        # --delete 让目标端跟着删：只加不减会在对面留下已经被重构掉的旧文件，
        # 而那些文件仍会被 tsc 编译、被测试读到
        rsync -a --delete \
              --exclude '.DS_Store' --exclude '.impeccable' --exclude '__pycache__' \
              "$item/" "$target/$item/"
    else
        cp "$item" "$target/$item"
    fi
done

# ============================================================
# 三点五、把被忽略规则挡着的种子显式入库
# ============================================================

for item in "${FORCE_TRACK[@]}"; do
    [ -e "$target/$item" ] || { echo "同步之后目标仓库里没有 ${item}" >&2; exit 1; }

    git -C "$target" add -f "$item"
done

# ============================================================
# 四、防泄漏：断言目标里没有第二版的任何东西
# ============================================================

echo "==> 检查目标仓库"
for item in "${PRO_ONLY[@]}"; do
    [ -e "$target/$item" ] && { echo "目标仓库里出现了第二版专属的 ${item}，中止。" >&2; exit 1; }
done

# 版次标记是第二版功能的总开关。它若混进公开仓库，
# 免费用户装完会拿到一本自称三库系统、却找不到另外两本库的笔记库
if find "$target" -name edition.json -not -path '*/.git/*' | grep -q .; then
    echo "目标仓库里出现了 edition.json，中止。" >&2
    exit 1
fi

for item in "${PER_REPO[@]}"; do
    [ -e "$target/$item" ] || echo "  提醒：目标仓库没有 ${item}（本脚本不负责它）"
done

# ============================================================
# 四点五、在目标仓库里把回归跑一遍
# ============================================================
#
# 同步过去的 tests/regression.mjs 里有几条只在第二版成立（它们靠 skill-pro/SKILL.md
# 是否存在自我关闭）。「关得掉」这件事必须在**目标那边**证明，不能在这边推断——
# 推一份自己从没在对面跑过的测试出去，等于把红灯留给用户去发现。
# 依赖直接借本仓库的：package.json 刚同步过去，两边版本按定义相同。

echo "==> 在第一版仓库里跑回归"
( cd "$target" && node --test tests/*.mjs >/dev/null 2>&1 ) || {
    echo "同步后的第一版仓库跑不过自己的回归，中止发布。" >&2
    ( cd "$target" && node --test tests/*.mjs 2>&1 | grep -E '^(not ok|✖|  [A-Za-z])' | head -20 ) >&2
    exit 1
}

# ============================================================
# 五、给人看，再决定推不推
# ============================================================

cd "$target"

push_mirrors() {
    # 两边没有跨主机事务，先用 dry-run 同时验证快进与权限，再真正推送。
    # 任何一边出现分叉都中止，绝不用 force 把一个公开仓库盖过去。
    echo "==> 预检第一版 GitHub / Gitee 两个镜像"
    git push --dry-run "$V1_GITHUB_REMOTE" HEAD:main >/dev/null
    git push --dry-run "$V1_GITEE_REMOTE" HEAD:main >/dev/null

    echo "==> 推送到 $V1_GITHUB_REMOTE"
    git push "$V1_GITHUB_REMOTE" HEAD:main
    echo "==> 推送到 $V1_GITEE_REMOTE"
    git push "$V1_GITEE_REMOTE" HEAD:main
}

if [ -z "$(git status --porcelain)" ]; then
    if [ "${1:-}" = "--push" ]; then
        push_mirrors
        echo "==> 第一版内容未变化；两个镜像已核对到同一提交。"
    else
        echo "==> 第一版仓库已经是最新的，无需发布。"
    fi
    exit 0
fi

echo
echo "==> 将要发布的改动（v${version}，来自 pro@${source_sha}）"
git add -A
git --no-pager diff --cached --stat
echo

git commit --quiet -m "sync: 从第二版仓库同步共享源码与笔记库模板 v$version

来源 ziminos-pro@${source_sha}。两版共享的 src/、vault/、fonts/、skill/、tests/
与构建配置由 publish-v1.sh 单向发布，第一版仓库不再直接改这些路径。

src/ 含第二版那部分代码，但没有 edition.json 它一行都不执行——两版共用一份
main.js 是刻意的：分成两个插件产物就等于分成两套代码，迟早在同一个 bug 上
修两次、修错一次。

README.md / AGENTS.md / CLAUDE.md / docs/ 不在同步范围，它们各自说给各自的读者听。"

if [ "${1:-}" = "--push" ]; then
    push_mirrors
    echo "==> 完成。第一版 GitHub / Gitee 镜像已更新到 v${version}。"
else
    echo "==> 已在临时目录提交，**没有推送**。"
    echo "    确认上面的改动没问题后，重新执行并加 --push："
    echo "        ./publish-v1.sh --push"
    echo "    （临时目录退出时会自动清理，--push 会重新走一遍完整流程）"
fi
