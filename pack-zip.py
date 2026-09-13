#!/usr/bin/env python3
"""
[INPUT]: 依赖 Python 标准库 zipfile / os / stat / datetime；输入是一个已经组装好的目录
[OUTPUT]: 命令行工具：把该目录连同它自己的名字打成 zip，并当场自证可在别人电脑上正确解开
[POS]: 两个分发包（make-pro-package.sh 面向智能体、make-v1-package.sh 面向人）共用的唯一 zip 写出口。
       它从 make-pro-package.sh 里抽出来，是因为第二个分发包出现了——同一段「怎么把中文文件名
       安全装进 zip」的知识若各写一份，迟早只修一份，而修漏的那一份不会在打包时报错，
       只会在某个学员的 Windows 上解出一堆乱码目录。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

用法：python3 pack-zip.py <源目录> <zip 路径> [--date ISO8601]

为什么是 zipfile 而不是 zip 命令行：
    macOS 自带的 Info-ZIP 不给非 ASCII 文件名置 UTF-8 标志位（通用位第 11 位）。
    不置位的后果只在别人机器上发作：Windows 自带解压会按系统代码页去猜那串字节，
    解出来是乱码目录名，而安装步骤按名字找目录，于是第一步就失败——打包这边不会有任何报错。
    zipfile 对非 ASCII 名一律置位，跨平台因此可预期。

为什么时间戳要给定：
    不给 --date 时沿用 ZipInfo 的缺省值（1980-01-01），给了就所有条目用同一个时刻。
    两种都与「此刻几点打的包」无关，同一份输入因此总得到同一个 zip。
"""

import argparse
import datetime
import os
import stat
import sys
import zipfile


def pack(source: str, zip_path: str, date_time) -> int:
    name = os.path.basename(os.path.normpath(source))
    count = 0

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for folder, dirs, files in os.walk(source):
            dirs.sort()
            for filename in sorted(files):
                if filename == ".DS_Store":
                    continue

                full = os.path.join(folder, filename)
                arc = os.path.join(name, os.path.relpath(full, source)).replace(os.sep, "/")
                info = zipfile.ZipInfo(arc) if date_time is None else zipfile.ZipInfo(arc, date_time)
                info.compress_type = zipfile.ZIP_DEFLATED
                # 保留权限位，免得脚本解出来丢掉可执行属性
                info.external_attr = (stat.S_IMODE(os.stat(full).st_mode)) << 16
                with open(full, "rb") as handle:
                    archive.writestr(info, handle.read())
                count += 1

    return count


def verify(zip_path: str) -> None:
    with zipfile.ZipFile(zip_path) as archive:
        # 非 ASCII 的条目必须全部带上 UTF-8 标志位，否则这个包不许发出去
        bad = [
            info.filename
            for info in archive.infolist()
            if any(ord(char) > 127 for char in info.filename) and not (info.flag_bits & 0x800)
        ]
        if bad:
            sys.exit("有 %d 个中文文件名没带 UTF-8 标志位，拒绝出包" % len(bad))

        # 逐条解压核对 CRC：写坏的条目在这里现形，而不是在学员那里解到一半报「文件已损坏」
        broken = archive.testzip()
        if broken is not None:
            sys.exit("条目 %s 的校验和对不上，拒绝出包" % broken)


def main() -> None:
    parser = argparse.ArgumentParser(description="把一个目录打成跨平台可解的 zip")
    parser.add_argument("source")
    parser.add_argument("zip_path")
    parser.add_argument("--date", help="所有条目统一使用的时刻，ISO 8601（例如 git log --format=%%cI 的输出）")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        sys.exit("源目录不存在：%s" % args.source)

    # 取那个时刻在它自己时区里的钟面读数：zip 不记时区，解压方按本地时间显示
    date_time = None if args.date is None else datetime.datetime.fromisoformat(args.date).timetuple()[:6]

    count = pack(args.source, args.zip_path, date_time)
    verify(args.zip_path)
    print("    %d 个文件，中文名全部带 UTF-8 标志位" % count)


if __name__ == "__main__":
    main()
