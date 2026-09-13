#!/usr/bin/env python3
"""
[INPUT]: 依赖 Python ≥ 3.9 标准库（zipfile / shutil / hashlib / json；Windows 上另用 winreg 与 ctypes 登记用户级字体）；
         依赖一个已经在本机的分发包——第一版 ziminOS-v{版本}-setup.zip、第二版 ziminOS-pro-v{版本}.zip，
         也接受它们解压后的目录，或者仓库根本身（仓库形态）
[OUTPUT]: 命令行工具：把当前工作区原地装成第一版单库或第二版三库系统，自检，
          把结果写进工作区里的 .ziminos-install-result.json（Obsidian 不索引点开头的文件）
[POS]: installer 的核心，也是「全新安装」这件事唯一可执行的事实源。两个启动脚本（install.ps1 / install.sh）
       只负责准备 Python、从发行版下载包并核对 SHA-256，然后把包交给它；它自己不联网，因此能在任何机器上离线测试。
       判据来自一份 Windows 新电脑上的二十分钟复盘：慢不在装库，在智能体一步一步地试工具、执行几十条命令——
       把这几十步收进一个确定性程序，智能体只剩「运行、读结果、告诉用户」三件事。
       全新安装失败时它把这一次写进工作区的东西原样撤掉——安装前那里是空的，撤干净才能换契约里的逐条做法重来。
       升级（第一版升级、第二版 B/C 模式）暂不在这里：它返回 upgrade，由契约里原有的升级分支接手，
       直到这里的升级实现在真机上验证过为止。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

用法：
    python ziminos_install.py --edition free|pro --source 包.zip [--target 工作区] [--result 结果.json] [--font-dir 目录]

退出码：0 装好并自检通过；10 这里已经装过，要走升级；20 拒绝动手（目录不安全或不是空的）；30 出错。
"""

import argparse
import hashlib
import json
import os
import platform
import shutil
import stat
import sys
import tempfile
import time
import zipfile

INSTALLER_VERSION = "1"
RESULT_NAME = ".ziminos-install-result.json"

EXIT_OK, EXIT_UPGRADE, EXIT_REFUSED, EXIT_FAILED = 0, 10, 20, 30

# 安装前工作区里允许存在的东西：系统杂项，以及智能体自己的点开头配置目录（它们与笔记库互不相干）
JUNK = {".DS_Store", "desktop.ini", "Thumbs.db", RESULT_NAME}
OURS = {".obsidian", ".ziminos"}

# 用户级字体在 Windows 注册表里的值名必须是「家族名 (格式)」，写错字体就不出现
FONT_REGISTRY_NAMES = {
    "LXGWWenKaiGBScreen.ttf": "LXGW WenKai GB Screen (TrueType)",
    "SourceHanSerifCN-Regular.otf": "Source Han Serif CN (OpenType)",
    "SourceHanSerifCN-Bold.otf": "Source Han Serif CN Bold (OpenType)",
    "ZhuqueFangsong-Regular.ttf": "Zhuque Fangsong (technical preview) (TrueType)",
    "LXGWNeoXiHeiPlus.ttf": "LXGW Neo XiHei Plus (TrueType)",
}
FONT_EXTENSIONS = (".ttf", ".otf")

# 第二版里空目录不进 git，由安装时建出来
CAPTURE_EMPTY_DIRS = ("剪藏",)
ETERNAL_EMPTY_DIRS = ("10-原料",)
ETERNAL_PLUGIN_FILES = ("main.js", "manifest.json", "styles.css", "ziminOS-Eagle-Bridge.eagleplugin")
SKILL_DIRS = ("capture", "distill", "scripts")


class Refused(Exception):
    """工作区不适合动手。不是错误，是纪律：宁可停下来问，也不在不该写的地方写。"""

    def __init__(self, reason, detail):
        super().__init__(detail)
        self.reason = reason


class InstallError(Exception):
    pass


# ============================================================
# 工作区判断
# ============================================================


def significant_entries(path):
    """决定「这个文件夹是不是空的」时要看的条目：系统杂项与别人的点开头目录不算，我们自己的算。"""
    entries = []
    for name in os.listdir(path):
        if name in JUNK:
            continue
        if name.startswith(".") and name not in OURS:
            continue
        entries.append(name)
    return sorted(entries)


def is_broad_directory(path):
    real = os.path.normcase(os.path.realpath(path))
    home = os.path.normcase(os.path.realpath(os.path.expanduser("~")))
    drive, rest = os.path.splitdrive(real)
    if real == os.path.normcase(os.path.abspath(os.sep)) or (drive and rest in ("", "\\", "/")):
        return True
    broad = {home}
    for name in ("Desktop", "Documents", "Downloads", "桌面", "文档", "下载"):
        broad.add(os.path.normcase(os.path.join(home, name)))
        broad.add(os.path.normcase(os.path.join(home, "OneDrive", name)))
    return real in broad


def looks_like_source_repository(path):
    return all(os.path.exists(os.path.join(path, name)) for name in ("src", "vault", "skill", "package.json"))


def read_json(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def find_pro_markers(root):
    """扫描直接子目录里的版次标记，返回 [(子目录, 标记内容)]。库名以磁盘为准，不写死。"""
    found = []
    for name in sorted(os.listdir(root)):
        marker = os.path.join(root, name, ".obsidian", "plugins", "ziminos", "edition.json")
        if os.path.isfile(marker):
            try:
                data = read_json(marker)
            except ValueError:
                continue
            if data.get("edition") == "pro":
                found.append((name, data))
    return found


def detect_mode(edition, target):
    if is_broad_directory(target):
        raise Refused("broad_directory", "当前文件夹是用户主目录、桌面、文档或磁盘根这类宽泛目录，请专门新建一个文件夹再装")
    if looks_like_source_repository(target):
        raise Refused("source_repository", "当前文件夹是 ziminOS 的源码仓库，不能把它改造成笔记库")

    if edition == "free":
        if os.path.isdir(os.path.join(target, ".obsidian", "plugins", "ziminos")):
            return "upgrade"
    else:
        if os.path.isdir(os.path.join(target, ".ziminos")) or find_pro_markers(target):
            return "upgrade-C"
        if os.path.isdir(os.path.join(target, ".obsidian")):
            return "upgrade-B"

    entries = significant_entries(target)
    if entries:
        raise Refused("not_empty", "当前文件夹不是空的（有 %s），不覆盖任何文件" % "、".join(entries[:5]))
    return "fresh"


# ============================================================
# 分发包
# ============================================================


class Layout(object):
    """把三种来路（第一版给人看的包、第二版的包、仓库根）归一成同一组目录。"""

    def __init__(self, vault, fonts, vault_pro=None, skill_pro=None):
        self.vault = vault
        self.fonts = fonts
        self.vault_pro = vault_pro
        self.skill_pro = skill_pro
        self.version = read_json(os.path.join(vault, ".obsidian", "plugins", "ziminos", "manifest.json"))["version"]


def safe_extract(archive, destination):
    with zipfile.ZipFile(archive) as bundle:
        broken = bundle.testzip()
        if broken is not None:
            raise InstallError("安装包里的 %s 校验和不对，包下载坏了，重新下载一次" % broken)
        root = os.path.realpath(destination)
        for member in bundle.namelist():
            resolved = os.path.realpath(os.path.join(destination, member))
            if resolved != root and not resolved.startswith(root + os.sep):
                raise InstallError("安装包里有越界路径：%s" % member)
        bundle.extractall(destination)


def locate_layout(root, edition):
    candidates = [root] + [os.path.join(root, name) for name in sorted(os.listdir(root))
                           if os.path.isdir(os.path.join(root, name))]
    for base in candidates:
        has = lambda name: os.path.isdir(os.path.join(base, name))  # noqa: E731
        if edition == "pro":
            if has("vault") and has("vault-pro") and has("skill-pro") and has("fonts"):
                return Layout(os.path.join(base, "vault"), os.path.join(base, "fonts"),
                              os.path.join(base, "vault-pro"), os.path.join(base, "skill-pro"))
        else:
            if has("vault") and has("fonts"):
                return Layout(os.path.join(base, "vault"), os.path.join(base, "fonts"))
            if has("ziminOS") and has("字体"):
                return Layout(os.path.join(base, "ziminOS"), os.path.join(base, "字体"))
    wanted = "vault/、vault-pro/、skill-pro/、fonts/" if edition == "pro" else "ziminOS/ 与 字体/（或 vault/ 与 fonts/）"
    raise InstallError("安装包里找不到 %s，包不完整或版次不对" % wanted)


def open_source(source, edition, staging):
    if os.path.isdir(source):
        return locate_layout(source, edition)
    if not zipfile.is_zipfile(source):
        raise InstallError("%s 不是 zip 安装包" % source)
    safe_extract(source, staging)
    return locate_layout(staging, edition)


# ============================================================
# 铺库
# ============================================================


def _ignore_dev_junk(_directory, names):
    return [name for name in names if name in (".DS_Store", "__pycache__")]


def copy_tree(source, destination):
    shutil.copytree(source, destination, dirs_exist_ok=True, ignore=_ignore_dev_junk)


def copy_file(source, destination):
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    shutil.copy2(source, destination)


def install_free(layout, target):
    copy_tree(layout.vault, target)
    return [target]


def pro_names(layout):
    markers = dict((data.get("role"), (name, data)) for name, data in find_pro_markers(layout.vault_pro))
    if "human" not in markers:
        raise InstallError("第二版包里找不到工作台的版次标记")
    vaults = markers["human"][1].get("vaults") or {}
    names = (vaults.get("capture"), vaults.get("human"), vaults.get("eternal"))
    if not all(names):
        raise InstallError("版次标记里的 vaults 不完整")
    return names


def install_pro(layout, target):
    capture_name, human_name, eternal_name = pro_names(layout)
    capture = os.path.join(target, capture_name)
    human = os.path.join(target, human_name)
    eternal = os.path.join(target, eternal_name)
    shared = os.path.join(layout.vault, ".obsidian")

    # 工作台 = 第一版那本库，再叠上版次标记
    copy_tree(layout.vault, human)
    copy_tree(os.path.join(layout.vault_pro, human_name), human)

    copy_tree(os.path.join(layout.vault_pro, capture_name), capture)
    copy_tree(os.path.join(layout.vault_pro, eternal_name), eternal)
    for name in CAPTURE_EMPTY_DIRS:
        os.makedirs(os.path.join(capture, name), exist_ok=True)
    for name in ETERNAL_EMPTY_DIRS:
        os.makedirs(os.path.join(eternal, name), exist_ok=True)

    # 主题、片段与 Style Settings 只从 vault/ 那一份分发
    for vault in (capture, eternal):
        for part in (("themes", "Minimal"), ("snippets",), ("plugins", "obsidian-style-settings")):
            copy_tree(os.path.join(shared, *part), os.path.join(vault, ".obsidian", *part))
    copy_tree(os.path.join(shared, "plugins", "dataview"), os.path.join(capture, ".obsidian", "plugins", "dataview"))
    for name in ETERNAL_PLUGIN_FILES:
        copy_file(os.path.join(shared, "plugins", "ziminos", name), os.path.join(eternal, ".obsidian", "plugins", "ziminos", name))

    skills = os.path.join(target, ".ziminos", "skills")
    for name in SKILL_DIRS:
        copy_tree(os.path.join(layout.skill_pro, name), os.path.join(skills, name))
    for name in ("CLAUDE.md", "AGENTS.md"):
        copy_file(os.path.join(layout.skill_pro, "system-root", name), os.path.join(target, name))

    return [capture, human, eternal]


# ============================================================
# 字体：只装当前用户，同名不覆盖，绝不提权
# ============================================================


def user_font_dir():
    system = platform.system()
    if system == "Windows":
        return os.path.join(os.environ["LOCALAPPDATA"], "Microsoft", "Windows", "Fonts")
    if system == "Darwin":
        return os.path.expanduser("~/Library/Fonts")
    return os.path.join(os.environ.get("XDG_DATA_HOME") or os.path.expanduser("~/.local/share"), "fonts")


def register_windows_fonts(paths):
    import ctypes
    import winreg

    key = winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows NT\CurrentVersion\Fonts", 0, winreg.KEY_SET_VALUE)
    try:
        for path in paths:
            name = os.path.basename(path)
            kind = "OpenType" if name.lower().endswith(".otf") else "TrueType"
            winreg.SetValueEx(key, FONT_REGISTRY_NAMES.get(name, "%s (%s)" % (os.path.splitext(name)[0], kind)), 0, winreg.REG_SZ, path)
    finally:
        winreg.CloseKey(key)
    # 让这个登录会话里接下来启动的程序立刻认得新字体；失败不影响注册表里的登记
    try:
        for path in paths:
            ctypes.windll.gdi32.AddFontResourceW(path)
        ctypes.windll.user32.SendMessageTimeoutW(0xFFFF, 0x001D, 0, 0, 0x0002, 1000, None)
    except Exception:  # noqa: BLE001
        pass


def install_fonts(fonts_dir, override_dir=None):
    files = []
    for folder, _dirs, names in os.walk(fonts_dir):
        files.extend(os.path.join(folder, name) for name in sorted(names) if name.lower().endswith(FONT_EXTENSIONS))
    if not files:
        raise InstallError("安装包里没有字体文件")

    destination = override_dir or user_font_dir()
    os.makedirs(destination, exist_ok=True)
    installed, skipped, placed = [], [], []
    for path in sorted(files, key=os.path.basename):
        target = os.path.join(destination, os.path.basename(path))
        if os.path.exists(target):
            skipped.append(os.path.basename(path))
        else:
            shutil.copy2(path, target)
            installed.append(os.path.basename(path))
        placed.append(target)

    if override_dir is None and platform.system() == "Windows":
        register_windows_fonts(placed)
    elif override_dir is None and platform.system() == "Linux" and shutil.which("fc-cache"):
        os.system("fc-cache -f >/dev/null 2>&1")

    return {"dir": destination, "installed": installed, "skipped": skipped, "files": [os.path.basename(p) for p in placed]}


# ============================================================
# 自检：装出来的每个文件都与包里那一份逐字节相同
# ============================================================


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compare_tree(source, destination, problems, label):
    for folder, dirs, names in os.walk(source):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for name in names:
            if name == ".DS_Store":
                continue
            relative = os.path.relpath(os.path.join(folder, name), source)
            copied = os.path.join(destination, relative)
            if not os.path.isfile(copied):
                problems.append("%s 缺少 %s" % (label, relative))
            elif sha256(copied) != sha256(os.path.join(folder, name)):
                problems.append("%s 的 %s 与安装包里的不一致" % (label, relative))


def verify_free(layout, target, fonts):
    problems = []
    compare_tree(layout.vault, target, problems, "笔记库")
    entries = significant_entries(target)
    if entries != [".obsidian", "README.md"]:
        problems.append("笔记库顶层应当只有 .obsidian 与 README.md，实际是 %s" % entries)
    problems.extend(verify_common_vault(target, layout.version, "笔记库"))
    problems.extend(verify_fonts(fonts))
    return problems


def verify_common_vault(vault, version, label):
    problems = []
    plugin = os.path.join(vault, ".obsidian", "plugins", "ziminos")
    manifest = os.path.join(plugin, "manifest.json")
    if not os.path.isfile(manifest) or read_json(manifest).get("version") != version:
        problems.append("%s 的 ziminOS 版本不是 %s" % (label, version))
    if os.path.exists(os.path.join(plugin, "data.json")):
        problems.append("%s 里出现了 ziminOS 的 data.json，全新安装不该有它" % label)
    return problems


def verify_fonts(fonts):
    missing = [name for name in fonts["files"] if not os.path.isfile(os.path.join(fonts["dir"], name))]
    return ["用户字体目录里缺少 %s" % "、".join(missing)] if missing else []


def verify_pro(layout, target, vaults, fonts):
    problems = []
    capture, human, eternal = vaults
    capture_name, human_name, eternal_name = (os.path.basename(v) for v in vaults)

    expected_root = sorted([capture_name, human_name, eternal_name, ".ziminos", "AGENTS.md", "CLAUDE.md"])
    if significant_entries(target) != expected_root:
        problems.append("系统根顶层应当是 %s，实际是 %s" % (expected_root, significant_entries(target)))

    compare_tree(layout.vault, human, problems, human_name)
    compare_tree(os.path.join(layout.vault_pro, human_name), human, problems, human_name)
    compare_tree(os.path.join(layout.vault_pro, capture_name), capture, problems, capture_name)
    compare_tree(os.path.join(layout.vault_pro, eternal_name), eternal, problems, eternal_name)
    for name in SKILL_DIRS:
        compare_tree(os.path.join(layout.skill_pro, name), os.path.join(target, ".ziminos", "skills", name), problems, ".ziminos/skills")
    shared = os.path.join(layout.vault, ".obsidian")
    for vault, name in ((capture, capture_name), (eternal, eternal_name)):
        for part in (("themes", "Minimal"), ("snippets",), ("plugins", "obsidian-style-settings")):
            compare_tree(os.path.join(shared, *part), os.path.join(vault, ".obsidian", *part), problems, name)
    compare_tree(os.path.join(shared, "plugins", "dataview"), os.path.join(capture, ".obsidian", "plugins", "dataview"), problems, capture_name)
    for file_name in ETERNAL_PLUGIN_FILES:
        copied = os.path.join(eternal, ".obsidian", "plugins", "ziminos", file_name)
        if not os.path.isfile(copied) or sha256(copied) != sha256(os.path.join(shared, "plugins", "ziminos", file_name)):
            problems.append("%s 的 ziminOS 程序文件 %s 缺失或不一致" % (eternal_name, file_name))

    problems.extend(verify_common_vault(human, layout.version, human_name))
    problems.extend(verify_common_vault(eternal, layout.version, eternal_name))

    for vault, name in ((capture, capture_name), (eternal, eternal_name)):
        style = os.path.join(vault, ".obsidian", "plugins", "obsidian-style-settings", "data.json")
        if not os.path.isfile(style):
            problems.append("%s 缺少 Style Settings 的默认配色" % name)
    if not os.path.isfile(os.path.join(capture, ".obsidian", "plugins", "dataview", "main.js")):
        problems.append("%s 缺少 Dataview" % capture_name)
    if os.path.exists(os.path.join(eternal, ".obsidian", "plugins", "dataview")):
        problems.append("%s 不该装 Dataview" % eternal_name)
    for vault, dirs in ((capture, CAPTURE_EMPTY_DIRS), (eternal, ETERNAL_EMPTY_DIRS)):
        for name in dirs:
            if not os.path.isdir(os.path.join(vault, name)):
                problems.append("%s 缺少空目录 %s" % (os.path.basename(vault), name))

    # 版次标记只随装了 ziminOS 插件的两本库分发；两份的 vaults 必须一致，且都指向真实存在的目录
    markers = find_pro_markers(target)
    roles = sorted(data.get("role") for _name, data in markers)
    if roles != ["eternal", "human"]:
        problems.append("版次标记应当恰好两份（human 与 eternal），实际是 %s" % roles)
    layouts = set(json.dumps(data.get("vaults"), sort_keys=True, ensure_ascii=False) for _name, data in markers)
    if len(layouts) != 1:
        problems.append("两份版次标记里的 vaults 不一致")
    elif not all(os.path.isdir(os.path.join(target, name)) for name in json.loads(layouts.pop()).values()):
        problems.append("版次标记里的 vaults 指向了不存在的目录")

    problems.extend(verify_fonts(fonts))
    return problems


# ============================================================
# 清理与出口
# ============================================================


def remove_tree(path):
    """删临时目录。Windows 上 git 留下的只读文件、杀毒软件的短暂占用都会让一次删除失败，先去只读再重试。"""

    def clear_readonly(func, target, _info):
        os.chmod(target, stat.S_IWRITE)
        func(target)

    for attempt in range(3):
        try:
            if sys.version_info >= (3, 12):
                shutil.rmtree(path, onexc=clear_readonly)
            else:
                shutil.rmtree(path, onerror=clear_readonly)
            return
        except OSError:
            time.sleep(1 + attempt)


def roll_back(target, before):
    """全新安装失败时，把这一次写进工作区的东西原样撤掉：安装前它是空的，撤干净才能换别的办法重装。"""
    for name in set(os.listdir(target)) - before - {RESULT_NAME}:
        path = os.path.join(target, name)
        if os.path.isdir(path) and not os.path.islink(path):
            remove_tree(path)
        else:
            try:
                os.remove(path)
            except OSError:
                pass


def main(argv=None):
    parser = argparse.ArgumentParser(description="ziminOS 安装程序（全新安装）")
    parser.add_argument("--edition", choices=("free", "pro"), required=True)
    parser.add_argument("--source", required=True, help="分发包 zip、解压后的目录或仓库根")
    parser.add_argument("--target", default=os.getcwd())
    parser.add_argument("--result", default=None)
    parser.add_argument("--font-dir", default=None, help="把字体装到这个目录而不是用户字体目录（测试用）")
    args = parser.parse_args(argv)

    started = time.time()
    target = os.path.realpath(args.target)
    result_path = args.result or os.path.join(target, RESULT_NAME)
    result = {"installer": INSTALLER_VERSION, "edition": args.edition, "target": target, "status": "failed"}
    staging = None
    before = None
    code = EXIT_FAILED

    try:
        if not os.path.isdir(target):
            raise Refused("target_missing", "目标文件夹不存在：%s" % target)
        mode = detect_mode(args.edition, target)
        result["mode"] = mode
        if mode != "fresh":
            result.update(status="upgrade", message="这里已经装过 ziminOS，请按安装契约里的升级分支执行")
            code = EXIT_UPGRADE
        else:
            before = set(os.listdir(target))
            staging = tempfile.mkdtemp(prefix="ziminos-install.")
            layout = open_source(os.path.realpath(args.source), args.edition, staging)
            result["version"] = layout.version
            if args.edition == "pro":
                vaults = install_pro(layout, target)
            else:
                vaults = install_free(layout, target)
            fonts = install_fonts(layout.fonts, args.font_dir)
            result.update(vaults=vaults, fonts=fonts)
            problems = verify_pro(layout, target, vaults, fonts) if args.edition == "pro" else verify_free(layout, target, fonts)
            if problems:
                result.update(status="failed", problems=problems)
                roll_back(target, before)
                result["rolled_back"] = True
            else:
                result["status"] = "ok"
                code = EXIT_OK
    except Refused as refusal:
        result.update(status="refused", reason=refusal.reason, message=str(refusal))
        code = EXIT_REFUSED
    except Exception as error:  # noqa: BLE001 —— 任何意外都要落进结果文件，智能体可能看不见屏幕输出
        result.update(status="failed", error="%s: %s" % (type(error).__name__, error))
        code = EXIT_FAILED
        if before is not None:
            roll_back(target, before)
            result["rolled_back"] = True
    finally:
        if staging:
            remove_tree(staging)

    result["seconds"] = round(time.time() - started, 1)
    try:
        with open(result_path, "w", encoding="utf-8") as handle:
            json.dump(result, handle, ensure_ascii=False, indent=2)
    except OSError:
        pass
    # 屏幕上只打一行 ASCII：有些终端与沙箱会吞掉或读错中文
    print("ZIMINOS_RESULT status=%s exit=%d" % (result["status"], code))
    return code


if __name__ == "__main__":
    sys.exit(main())
