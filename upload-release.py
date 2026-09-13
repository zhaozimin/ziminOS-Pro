#!/usr/bin/env python3
"""
[INPUT]: 依赖 Python 标准库；令牌取自 macOS 钥匙串（service = ziminos-gitee-token）或环境变量 GITEE_TOKEN；
         依赖 Gitee OpenAPI v5 的 releases 与 attach_files 两组接口
[OUTPUT]: 命令行工具：在指定仓库建（或复用）一个发行版，把文件作为附件传上去，再从公开下载通道逐个核对字节数
[POS]: 两个分发包与 Python 运行时共用的唯一上传出口，排在 publish-v1.sh 与两个打包脚本之后。
       它存在是因为「发版」这件事的最后一步原本要人手拖文件——而发行版上没有包，没有 Git 的机器就只剩克隆这条慢路；
       手动的一步迟早被忘，被忘的那一次不会报错，只会让那一版的学员退回二十分钟。
       令牌一个字节都不进命令行参数、不进输出、不进文件：进程列表与终端回滚都看得见前两者。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

用法：
    python3 upload-release.py --repo ziminzhao/ziminos-pro --tag v0.33.0 --title "…" --notes notes.md FILE [FILE ...]
    加 --dry-run 只打印将要做什么，不取令牌、不联网。

令牌只需存一次（终端里运行，按提示粘贴，屏幕不回显）：
    security add-generic-password -a "$USER" -s ziminos-gitee-token -w
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

API = "https://gitee.com/api/v5/repos/%s"
KEYCHAIN_SERVICE = "ziminos-gitee-token"
USER_AGENT = "ziminos-release-uploader"


def fail(message):
    sys.exit("upload-release: " + message)


def read_token():
    token = os.environ.get("GITEE_TOKEN", "").strip()
    if token:
        return token
    try:
        found = subprocess.run(
            ["security", "find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"],
            capture_output=True, text=True, check=False,
        )
    except FileNotFoundError:
        found = None
    if found is None or found.returncode != 0 or not found.stdout.strip():
        fail("钥匙串里没有 %s。先在终端运行一次：\n"
             "    security add-generic-password -a \"$USER\" -s %s -w" % (KEYCHAIN_SERVICE, KEYCHAIN_SERVICE))
    return found.stdout.strip()


def request(method, url, token, fields=None, file_path=None, query=None):
    """发一次 API 请求。令牌放进表单或查询串（Gitee 文档化的两种写法），绝不拼进会被打印的字符串。"""
    query = dict(query or {})
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    data = None

    if method in ("GET", "DELETE"):
        query["access_token"] = token
    elif file_path is None:
        form = dict(fields or {})
        form["access_token"] = token
        data = urllib.parse.urlencode(form).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    else:
        boundary = "----ziminos" + uuid.uuid4().hex
        parts = []
        for key, value in dict(fields or {}, access_token=token).items():
            parts.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n" % (boundary, key, value)).encode("utf-8"))
        name = os.path.basename(file_path)
        parts.append(("--%s\r\nContent-Disposition: form-data; name=\"file\"; filename=\"%s\"\r\n"
                      "Content-Type: application/octet-stream\r\n\r\n" % (boundary, name)).encode("utf-8"))
        with open(file_path, "rb") as handle:
            parts.append(handle.read())
        parts.append(("\r\n--%s--\r\n" % boundary).encode("utf-8"))
        data = b"".join(parts)
        headers["Content-Type"] = "multipart/form-data; boundary=%s" % boundary

    full = url + ("?" + urllib.parse.urlencode(query) if query else "")
    try:
        with urllib.request.urlopen(urllib.request.Request(full, data=data, headers=headers, method=method), timeout=1800) as response:
            body = response.read()
            return response.status, (json.loads(body) if body.strip() else None)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        return error.code, {"error": detail}
    except (urllib.error.URLError, OSError) as error:
        # 请求地址里带着令牌：只报原因，不报地址
        return 0, {"error": "%s: %s" % (type(error).__name__, getattr(error, "reason", error))}


def public_size(repo, tag, name):
    """从公开下载通道（不经 API、不带令牌）读附件大小：学员拿到的就是这个。"""
    url = "https://gitee.com/%s/releases/download/%s/%s" % (repo, tag, urllib.parse.quote(name))
    try:
        # 只取第一个字节：Content-Range 的分母就是整个文件的大小，CDN 对 HEAD 不一定给 Content-Length
        probe = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Range": "bytes=0-0"})
        with urllib.request.urlopen(probe, timeout=120) as response:
            content_range = response.headers.get("Content-Range", "")
            if "/" in content_range:
                return int(content_range.rsplit("/", 1)[1])
            return int(response.headers.get("Content-Length") or -1)
    except urllib.error.HTTPError as error:
        return -error.code


def main():
    parser = argparse.ArgumentParser(description="建 Gitee 发行版并上传附件")
    parser.add_argument("--repo", required=True, help="owner/repo")
    parser.add_argument("--tag", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--notes", required=True, help="发行说明文件（Markdown）")
    parser.add_argument("--target", default="main", help="新建标签时指向的分支")
    parser.add_argument("--replace", action="store_true", help="同名附件已存在时删掉重传")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()

    for path in args.files:
        if not os.path.isfile(path):
            fail("找不到要上传的文件：%s" % path)
        if any(ord(char) > 127 for char in os.path.basename(path)):
            # 契约让智能体用 urllib 按名字取包，而 urllib 遇到路径里的中文直接 UnicodeEncodeError
            fail("附件名必须是 ASCII：%s" % os.path.basename(path))
    notes = open(args.notes, encoding="utf-8").read()

    if args.dry_run:
        print("dry-run: %s 标签 %s（不存在则建在 %s 上），上传 %s" % (args.repo, args.tag, args.target, ", ".join(os.path.basename(p) for p in args.files)))
        return

    token = read_token()

    # 仓库改过名时旧名字靠跳转才到得了，而 urllib 跟随跳转会把 POST 变成 GET——建发行版就成了列发行版。
    # 所以先用 GET（跳转无害）问出它现在的真名，之后每一步都用真名
    status, info = request("GET", API % args.repo, token)
    if status != 200 or not isinstance(info, dict) or not info.get("full_name"):
        fail("读不到仓库 %s（HTTP %s）：令牌没有这个仓库的权限，或者仓库名写错了" % (args.repo, status))
    repo = info["full_name"]
    if repo != args.repo:
        print("%s 现在叫 %s，按新名字上传" % (args.repo, repo))
    base = API % repo

    status, release = request("GET", "%s/releases/tags/%s" % (base, urllib.parse.quote(args.tag)), token)
    if status == 200 and isinstance(release, dict) and release.get("id"):
        print("复用已有发行版 %s（id %s）" % (args.tag, release["id"]))
    else:
        status, release = request("POST", "%s/releases" % base, token, fields={
            "tag_name": args.tag, "name": args.title, "body": notes,
            "target_commitish": args.target, "prerelease": "false",
        })
        if status not in (200, 201) or not isinstance(release, dict) or not release.get("id"):
            fail("建发行版失败（HTTP %s）：%s" % (status, release))
        print("已建发行版 %s（id %s）" % (args.tag, release["id"]))
    release_id = release["id"]

    status, existing = request("GET", "%s/releases/%s/attach_files" % (base, release_id), token, query={"per_page": 100})
    existing = existing if status == 200 and isinstance(existing, list) else []
    by_name = {item.get("name"): item for item in existing}

    for path in args.files:
        name = os.path.basename(path)
        if name in by_name:
            if not args.replace:
                print("跳过 %s：同名附件已在（要重传加 --replace）" % name)
                continue
            status, _ = request("DELETE", "%s/releases/%s/attach_files/%s" % (base, release_id, by_name[name]["id"]), token)
            if status not in (200, 204):
                fail("删旧附件 %s 失败（HTTP %s）" % (name, status))
        size_mb = os.path.getsize(path) / 1048576
        print("上传 %s（%.1f MB）…" % (name, size_mb), flush=True)
        status, uploaded = request("POST", "%s/releases/%s/attach_files" % (base, release_id), token, file_path=path)
        if status not in (200, 201):
            fail("上传 %s 失败（HTTP %s）：%s" % (name, status, uploaded))

    # 自证：从学员走的公开通道核对每个附件的字节数，而不是相信接口说「成功」。
    # 用命令行给的名字而不是真名：安装脚本里写的是那个名字，跳转走不通就该在这里暴露
    problems = []
    for path in args.files:
        name = os.path.basename(path)
        remote = public_size(args.repo, args.tag, name)
        local = os.path.getsize(path)
        if remote != local:
            problems.append("%s：公开通道报 %s，本地 %s" % (name, remote, local))
        else:
            print("核对通过 %s（%d 字节，公开下载可达）" % (name, remote))
    if problems:
        fail("附件核对没过：\n  " + "\n  ".join(problems))


if __name__ == "__main__":
    main()
