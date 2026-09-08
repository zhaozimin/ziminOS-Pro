#!/usr/bin/env bash
#
# [INPUT]: 依赖 eagle-companion/ 源码、根 LICENSE/package.json 与系统 zip，产物目录为 vault 内 ziminOS 插件目录
# [OUTPUT]: 以确定文件清单生成 ziminOS-Eagle-Bridge.eagleplugin，供 macOS/Windows 用户直接安装
# [POS]: Eagle 伴侣的唯一打包出口；只生成可重建产物，不安装插件、不接触 Eagle 用户数据
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

(
    cd "$source_dir"
    zip -X -q "$archive" manifest.json index.html styles.css logo.png README.md js/service.js
)
(
    cd "$repo_root"
    zip -X -q -j "$archive" LICENSE
)

mkdir -p "$(dirname "$artifact")"
mv -f "$archive" "$artifact"
