#!/usr/bin/env bash
#
# [INPUT]: 依赖 eagle-companion/ 源码、根 LICENSE/package.json 与系统 zip，产物目录为 vault 内 ziminOS 插件目录
# [OUTPUT]: 以固定文件清单、权限与时间戳生成可复现的 ziminOS-Eagle-Bridge.eagleplugin
# [POS]: Eagle 伴侣的唯一打包出口；产物跨工作区保持同一 SHA-256，不安装插件、不接触 Eagle 用户数据
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -euo pipefail

repo_root="$(cd "$(dirname "$0")" && pwd -P)"
source_dir="$repo_root/eagle-companion"
artifact="$repo_root/vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin"
package_version="$(node -p "require('$repo_root/package.json').version")"
companion_version="$(node -p "require('$source_dir/manifest.json').version")"

[ "$package_version" = "$companion_version" ] || {
    echo "Eagle 伴侣版本 $companion_version 与 ziminOS $package_version 不一致" >&2
    exit 1
}

command -v zip >/dev/null 2>&1 || {
    echo "缺少 zip，无法生成 .eagleplugin 产物" >&2
    exit 1
}

package_staging="$(mktemp -d "$repo_root/.eagle-package.XXXXXX")"
trap 'rm -rf "$package_staging"' EXIT
archive="$package_staging/ziminOS-Eagle-Bridge.eagleplugin"
package_root="$package_staging/root"

mkdir -p "$package_root/js"
cp "$source_dir/manifest.json" "$source_dir/index.html" "$source_dir/styles.css" \
    "$source_dir/logo.png" "$source_dir/README.md" "$package_root/"
cp "$source_dir/js/service.js" "$package_root/js/"
cp "$repo_root/LICENSE" "$package_root/"

# ZIP 会记住源文件 mtime 与 mode。若不归一，同一版源码在新克隆中会生成不同 SHA-256。
chmod 0755 "$package_root" "$package_root/js"
chmod 0644 "$package_root/manifest.json" "$package_root/index.html" "$package_root/styles.css" \
    "$package_root/logo.png" "$package_root/README.md" "$package_root/js/service.js" "$package_root/LICENSE"
TZ=UTC touch -t 198001010000.00 "$package_root" "$package_root/js" \
    "$package_root/manifest.json" "$package_root/index.html" "$package_root/styles.css" \
    "$package_root/logo.png" "$package_root/README.md" "$package_root/js/service.js" "$package_root/LICENSE"

(
    cd "$package_root"
    zip -X -q "$archive" manifest.json index.html styles.css logo.png README.md js/service.js LICENSE
)

mkdir -p "$(dirname "$artifact")"
mv -f "$archive" "$artifact"
