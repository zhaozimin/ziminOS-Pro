#!/bin/bash
#
# ziminOS 安装程序的 macOS / Linux 启动脚本。
#
# [INPUT]: 依赖系统自带的 bash、curl、tar 与 shasum（或 sha256sum）；
#          Python ≥ 3.9 优先用已装好的（macOS 必须先确认开发者工具在场），没有就下载校验过的独立版
# [OUTPUT]: 下载安装程序核心与发行版上的分发包（按 .sha256 核对），运行核心，
#           结果留在 <工作区>/.ziminos-install-result.json；退出码与核心一致（0 装好、10 要升级、20 拒绝、30 出错）
# [POS]: installer 在 macOS / Linux 上的入口。它只准备 Python 与下载，装库的每一个决定都在 ziminos_install.py 里。
#        下载交给 curl 而不是 Python：curl 走系统的证书库，任何一种 Python 在任何一台机器上都不必再为证书操心。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#
# 用法：
#   curl -fsSL https://gitee.com/ziminzhao/zimin-os-v1/raw/main/installer/install.sh -o /tmp/ziminos-install.sh && bash /tmp/ziminos-install.sh free
#   bash install.sh free|pro [工作区] [本地分发包.zip]
#
# 测试用的两个环境变量：ZIMINOS_INSTALLER_CORE 指向本地的 ziminos_install.py（不下载），
# ZIMINOS_FONT_DIR 把字体装到指定目录（不碰用户字体目录）。

set -euo pipefail

EDITION="${1:-free}"
TARGET="${2:-$(pwd -P)}"
SOURCE="${3:-}"

case "$EDITION" in
    free) REPO="https://gitee.com/ziminzhao/zimin-os-v1" ;;
    pro)  REPO="https://gitee.com/ziminzhao/ziminos-pro" ;;
    *) echo "用法：install.sh free|pro [工作区] [分发包.zip]" >&2; exit 2 ;;
esac

PY_VERSION="3.12.10"
PBS_TAG="20250409"
RESULT="$TARGET/.ziminos-install-result.json"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/ziminos-install.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

say() { echo "ziminOS: $*" >&2; }

fail() {
    # 智能体可能看不见屏幕输出：失败也必须落进结果文件。
    # 提示行打到 stderr：find_python 跑在 $( ) 里，stdout 会被当成 Python 的路径吞掉
    local escaped
    escaped="$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"
    printf '{\n  "status": "failed",\n  "stage": "bootstrap",\n  "edition": "%s",\n  "error": "%s"\n}\n' "$EDITION" "$escaped" > "$RESULT" 2>/dev/null || true
    echo "ziminOS: $1" >&2
    echo "ZIMINOS_RESULT status=failed exit=30" >&2
    exit 30
}

fetch() {
    # 每一次下载都走这里。Gitee 偶尔对单次请求回 451 / 403 / 429 或掐断连接，隔几秒同一个请求就过——
    # 不重试，这一下就把智能体送回二十分钟的逐条执行。不用 curl 的 --retry-all-errors：
    # macOS 11 自带的 curl 7.64 不认识它，整条下载会直接失败
    local attempt
    for attempt in 1 2 3 4; do
        curl -fsSL --connect-timeout 20 -o "$2" "$1" && return 0
        [ "$attempt" -lt 4 ] && sleep $((attempt * 2))
    done
    return 1
}

sha256_of() {
    if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | cut -d ' ' -f 1; else sha256sum "$1" | cut -d ' ' -f 1; fi
}

python_ok() {
    "$1" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1
}

provision_python_darwin() {
    local cache="$1" arch sha name url
    case "$(uname -m)" in
        arm64)  arch="aarch64"; sha="0be1fe0b35a4d3c382141764ef16ed3b8cc2b4620b657f678daa7b7f8df39699" ;;
        x86_64) arch="x86_64";  sha="ad3bef94b6054adcf8e0a47886e21b00dfc6a37f22eea229cf0f8725bd0e1023" ;;
        *) fail "不认识的 Mac 处理器：$(uname -m)" ;;
    esac
    name="cpython-${PY_VERSION}+${PBS_TAG}-${arch}-apple-darwin-install_only_stripped.tar.gz"
    say "下载 Python ${PY_VERSION}（约 17 MB，只下载一次）"
    for url in "https://registry.npmmirror.com/-/binary/python-build-standalone/${PBS_TAG}/${name}" \
               "https://github.com/astral-sh/python-build-standalone/releases/download/${PBS_TAG}/${name/+/%2B}"; do
        if fetch "$url" "$WORK/python.tar.gz" && [ "$(sha256_of "$WORK/python.tar.gz")" = "$sha" ]; then
            mkdir -p "$WORK/python-extract" "$cache"
            tar -xzf "$WORK/python.tar.gz" -C "$WORK/python-extract"
            rm -rf "$cache/python-${PY_VERSION}"
            mv "$WORK/python-extract/python" "$cache/python-${PY_VERSION}"
            return 0
        fi
        rm -f "$WORK/python.tar.gz"
    done
    fail "下载不到校验通过的 Python ${PY_VERSION}"
}

find_python() {
    local cache portable candidate
    case "$(uname -s)" in
        Darwin)
            cache="$HOME/Library/Application Support/ziminOS"
            portable="$cache/python-${PY_VERSION}/bin/python3"
            if [ -x "$portable" ] && python_ok "$portable"; then echo "$portable"; return; fi
            # /usr/bin/python3 在没装开发者工具的 Mac 上只是个壳，一运行就弹窗要求安装——先问 xcode-select，它不弹窗
            if xcode-select -p >/dev/null 2>&1 && python_ok /usr/bin/python3; then echo /usr/bin/python3; return; fi
            for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3; do
                if [ -x "$candidate" ] && python_ok "$candidate"; then echo "$candidate"; return; fi
            done
            provision_python_darwin "$cache"
            echo "$portable"
            ;;
        *)
            for candidate in python3 python; do
                if command -v "$candidate" >/dev/null 2>&1 && python_ok "$(command -v "$candidate")"; then
                    command -v "$candidate"; return
                fi
            done
            fail "没有找到 Python 3.9 或更高版本"
            ;;
    esac
}

[ -d "$TARGET" ] || fail "工作区不存在：$TARGET"
PYTHON="$(find_python)"

if [ -n "${ZIMINOS_INSTALLER_CORE:-}" ]; then
    CORE="$ZIMINOS_INSTALLER_CORE"
else
    CORE="$WORK/ziminos_install.py"
    fetch "$REPO/raw/main/installer/ziminos_install.py" "$CORE" || fail "下载不到安装程序"
fi

if [ -z "$SOURCE" ]; then
    # 版本号读 main 上的 manifest，包直接从 releases/download 取：不经对未登录请求限流的开放接口
    fetch "$REPO/raw/main/vault/.obsidian/plugins/ziminos/manifest.json" "$WORK/manifest.json" || fail "读不到版本号"
    VERSION="$("$PYTHON" -c 'import json, sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["version"])' "$WORK/manifest.json")"
    if [ "$EDITION" = "pro" ]; then NAME="ziminOS-pro-v${VERSION}"; else NAME="ziminOS-v${VERSION}-setup"; fi
    URL="$REPO/releases/download/v${VERSION}/${NAME}.zip"
    fetch "$URL.sha256" "$WORK/${NAME}.zip.sha256" || fail "发行版上没有 ${NAME}.zip.sha256，这一版的包可能还没挂上去"
    say "下载 ${NAME}.zip"
    fetch "$URL" "$WORK/${NAME}.zip" || fail "发行版上取不到 ${NAME}.zip"
    [ "$(sha256_of "$WORK/${NAME}.zip")" = "$(cut -d ' ' -f 1 < "$WORK/${NAME}.zip.sha256")" ] || fail "${NAME}.zip 的 SHA-256 对不上，下载坏了"
    SOURCE="$WORK/${NAME}.zip"
fi

say "安装"
set +e
if [ -n "${ZIMINOS_FONT_DIR:-}" ]; then
    "$PYTHON" "$CORE" --edition "$EDITION" --source "$SOURCE" --target "$TARGET" --result "$RESULT" --font-dir "$ZIMINOS_FONT_DIR"
else
    "$PYTHON" "$CORE" --edition "$EDITION" --source "$SOURCE" --target "$TARGET" --result "$RESULT"
fi
CODE=$?
set -e
exit "$CODE"
