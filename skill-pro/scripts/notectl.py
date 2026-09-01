#!/usr/bin/env python3
"""口述捕获的确定性引擎。

[INPUT]: 依赖三库系统的目录布局与各库 .obsidian/plugins/ziminos/edition.json；
         内容经 --content 或 --content-file 传入，不走管道也不走 heredoc。
[OUTPUT]: status / people / inspiration / diary / clip 五条命令；
         写入失败按「明确未写入（退出码 2）」与「结果未知（退出码 3）」两级分离。
[POS]: 第二版口述入口的**脚本侧**，与 capture/SKILL.md 是一件事的两半：
       那边只回答「这句话是灵感还是日记」，这边负责其余全部——
       目标路径、清洗、链接搬运、人名双链、插入位置、日记骨架，一律不问 LLM。
       分工的判据是第二条红线：写入用户原话的路径上零 AI。
       链接怎么排、人名连不连得上，是同输入同结果的活儿，交给模型每次都可能不一样，
       而这套系统对用户最硬的承诺是**原话保留**。
       它也刻意不依赖任何第三方库：装了就能跑，跑不起来的唯一可能是没有 Python。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

# ============================================================
# 与 ziminOS 插件共享的约定
# 对侧真源：src/core/constants.ts。改这里之前先去那边确认——
# 它们是写入方与读取方共同的约定，两处一旦分叉，同一条记录每次都写歪且不报错。
# ============================================================

DAY_FORMAT = "%Y-%m-%d"                  # 对侧 DAY_FORMAT = 'YYYY-MM-DD'
TIME_FORMAT = "%H:%M"                    # 对侧 nowLocalDateTimeParts 的 time
STAMP_FORMAT = "%Y-%m-%d %H:%M:%S"       # 对侧 DEFAULT_DATETIME_FORMAT
UID_FORMAT = "%Y%m%d%H%M%S"              # 对侧 UID_FORMAT

INSPIRATION_HEADING = "# 灵感集"          # 对侧 INSPIRATION_DEFAULTS.heading
INSPIRATION_FORMAT = "- [ ]  {content} [[{date}]] {time}"   # `- [ ]` 后是两个空格

DIARY_SUBFOLDER = "05-diary/01-daily"    # 对侧 PERIODS.daily.folder
DIARY_HEADING = "## 今天做了什么"          # 对侧 DIARY_LOG_HEADING
PRODUCTION_HEADING = "## 今日产出（自动）"
VIEW_BLOCK_LANG = "ziminos"              # 对侧 VIEW_BLOCK_LANG
PLACEHOLDER = "-"                        # 对侧 markdown.ts 的 PLACEHOLDER
CONTACT_FOLDER = "02-areas/人脉"          # 对侧 CONTACT_FOLDER

# 导航行里父级链接前的那个字符是全角空格 U+3000，不是普通空格。
# 它在对侧模板里是字面量，改成半角肉眼无差别，但生成出来的日记就不再逐字节相同了。
PARENT_GAP = "　"

# 人情账本行的形态判据（对侧 LEDGER）。本脚本不写账本行，但必须认得它，
# 否则一句含全角竖线的日记会被 ziminOS 解析成人情账，在他人档案里凭空记一笔债且不报错。
LEDGER_SEPARATOR = "｜"
LEDGER_SEPARATOR_SAFE = "|"

# ============================================================
# 本脚本自有的约定
# ============================================================

EDITION_REL = ".obsidian/plugins/ziminos/edition.json"
INSPIRATION_FILE = "灵感集.md"
CLIP_FOLDER = "剪藏"

SOURCE_MARK = "#口述"      # 笔迹可辨认：口述记的与手打的要能分出来。空串即关闭
LINK_LABEL = "点击跳转"
LINK_ICON = "🔗"
LINK_INDENT = "    "
LINK_HOST_SEPARATOR = " · "

MAX_ENTRY_CHARS = 2000
MAX_NOTE_BYTES = 4 * 1024 * 1024

EXIT_REFUSED = 2   # 明确没写进去
EXIT_UNKNOWN = 3   # 结果未知，禁止重试


class Refused(Exception):
    """明确未写入。调用方照实转达，用户可以放心重来。"""


# ============================================================
# 布局发现
# ============================================================

class Layout:
    """三本库的绝对路径。它是本脚本一切写入的唯一坐标系。"""

    def __init__(self, root: Path, names: Dict[str, str]) -> None:
        self.root = root
        self.capture = root / names["capture"]
        self.human = root / names["human"]
        self.eternal = root / names["eternal"]

    def as_dict(self) -> Dict[str, str]:
        return {
            "systemRoot": str(self.root),
            "capture": str(self.capture),
            "human": str(self.human),
            "eternal": str(self.eternal),
        }


def discover_layout(explicit_root: Optional[str]) -> Layout:
    """找出系统根，再从任意一本库的版次标记里读出三本库的名字。

    系统根优先按本脚本自己的位置推：安装契约把它放在 `系统根/.ziminos/skills/scripts/`，
    因此往上数三层就是根。这条路不需要任何配置文件，也不会因为用户在哪个目录下
    敲的命令而变——工作目录是会变的，脚本的位置不会。
    """
    root = Path(explicit_root).expanduser().resolve() if explicit_root else _root_from_script()

    if not root.is_dir():
        raise Refused(f"系统根不存在：{root}")

    names = _read_layout_names(root)

    if names is None:
        raise Refused(
            f"在 {root} 下没找到任何一本装了版次标记的笔记库。"
            "这台机器上可能还没装第二版，或者装在了别的位置——用 --root 指出系统根。"
        )

    layout = Layout(root, names)

    for label, path in (("兼收并蓄", layout.capture), ("以人为本", layout.human)):
        if not path.is_dir():
            raise Refused(f"{label} 那本库不在它该在的位置：{path}")

    return layout


def _root_from_script() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent


def _read_layout_names(root: Path) -> Optional[Dict[str, str]]:
    """扫系统根下的直接子目录，读第一份合法的版次标记。

    刻意扫描而不是写死「以人为本」这个名字：从第一版升级上来的用户，
    他那本库叫什么是他自己当初取的，标记文件里的 vaults.human 才是事实源。
    """
    for child in sorted(root.iterdir()):
        if not child.is_dir():
            continue

        marker = child / EDITION_REL

        if not marker.is_file():
            continue

        try:
            parsed = json.loads(marker.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue

        if not isinstance(parsed, dict) or parsed.get("edition") != "pro":
            continue

        vaults = parsed.get("vaults")

        if not isinstance(vaults, dict):
            continue

        names = {key: vaults.get(key) for key in ("capture", "human", "eternal")}

        if all(isinstance(value, str) and value.strip() for value in names.values()):
            return {key: str(value).strip() for key, value in names.items()}

    return None


# ============================================================
# 文本清洗
# ============================================================

def clean(text: str) -> str:
    """把一句口述收敛成可以安全写进 Markdown 的一行。

    只做两件事，多一件都不做：压缩空白，以及把全角竖线换成半角。
    第二件不是排版洁癖——那个符号在《以人为本》里是人情账本的记号，
    一句带它的话会被解析成一笔凭空的人情债记进别人的档案，而且不报错。

    **除此之外一个字都不许动。** 不润色、不总结、不改措辞、不补主语、不加标签。
    被改过的想法，半年后用户分不清哪句是自己说的。
    """
    collapsed = re.sub(r"\s+", " ", text).strip()

    return collapsed.replace(LEDGER_SEPARATOR, LEDGER_SEPARATOR_SAFE)


def _guard_entry(text: str) -> str:
    cleaned = clean(text)

    if not cleaned:
        raise Refused("内容是空的，没有可记的东西。")

    if len(cleaned) > MAX_ENTRY_CHARS:
        raise Refused(
            f"这一条有 {len(cleaned)} 个字，超过单条上限 {MAX_ENTRY_CHARS}。"
            "通常是语音识别出了问题——请用户确认要记的是哪一句。"
        )

    return cleaned


# ============================================================
# 链接
# ============================================================

# 地址的字符集必须**显式排除汉字**。
# 中文不写空格，`\S+` 会把「https://b.org/y，后者更清楚」整句吞进地址，
# 而写出来的链接看上去完全正常，点开才是 404。
_URL = re.compile(
    r"https?://[^\s　-〿一-鿿＀-￯，。！？；：、「」『』（）【】…]+"
)

# 已经是 Markdown 链接的片段一律不动——那是用户自己排的版
_MD_LINK = re.compile(r"\[[^\]]*\]\([^)]*\)")


def _trim_url(url: str) -> str:
    """砍掉地址尾部那些其实属于句子的标点，但**配平的右括号属于地址本身**。

    维基那种 `/wiki/Foo_(bar)` 一律砍尾会砍出一个 404，
    所以只在右括号多于左括号时才砍它。
    """
    trimmed = url

    while trimmed:
        last = trimmed[-1]

        if last in ".,;:!?'\"":
            trimmed = trimmed[:-1]
            continue

        if last == ")" and trimmed.count(")") > trimmed.count("("):
            trimmed = trimmed[:-1]
            continue

        break

    return trimmed


def _find_urls(text: str) -> List[Tuple[int, int, str]]:
    """找出正文里的裸地址，跳过已经写成 Markdown 链接的那些。"""
    protected = [(m.start(), m.end()) for m in _MD_LINK.finditer(text)]
    found: List[Tuple[int, int, str]] = []

    for match in _URL.finditer(text):
        if any(start <= match.start() < end for start, end in protected):
            continue

        url = _trim_url(match.group(0))

        if url:
            found.append((match.start(), match.start() + len(url), url))

    return found


def _host_of(url: str) -> str:
    matched = re.match(r"https?://([^/\s]+)", url)

    return matched.group(1) if matched else url


def render_links(text: str) -> Tuple[str, List[str]]:
    """决定链接是就地包成 Markdown 链接，还是搬到下一行的子项。

    只有「整条记录仅一个链接、且它就在话的末尾」时才搬走。链接夹在句子中间就地包，
    因为搬走会留下「发来两个参考 和 ，后者更清楚」这种破句子。

    返回 (正文, 要另起一行的链接)。**绝不去访问地址取标题**——取标题要出网，
    而这套系统对用户的承诺是记录的过程不联网。
    """
    urls = _find_urls(text)

    if not urls:
        return text, []

    if len(urls) == 1:
        start, end, url = urls[0]

        if text[end:].strip() == "":
            return text[:start].rstrip(), [url]

    # 从后往前替换，前面的下标才不会被前一次替换挪动
    rendered = text

    for start, end, url in reversed(urls):
        label = LINK_LABEL if len(urls) == 1 else f"{LINK_LABEL}{LINK_HOST_SEPARATOR}{_host_of(url)}"
        rendered = rendered[:start] + f"[{label}]({url})" + rendered[end:]

    return rendered, []


def _link_lines(urls: Sequence[str]) -> List[str]:
    return [f"{LINK_INDENT}- {LINK_ICON} [{LINK_LABEL}]({url})" for url in urls]


# ============================================================
# 人名双链
# ============================================================

def roster(layout: Layout) -> List[str]:
    """《以人为本》里真实存在档案的人名。

    只有名单里的人才会被写成双链。这不是保守——凭空写一个双链会生成悬空链接，
    看上去记上了，但在那个人的档案、关键事件与待办里一条都不会出现，且不报错。
    """
    folder = layout.human / CONTACT_FOLDER

    if not folder.is_dir():
        return []

    names = []

    for path in folder.glob("*.md"):
        stem = path.stem

        # MOC 是总控台不是人
        if stem.endswith("MOC"):
            continue

        names.append(stem)

    return sorted(names)


def link_people(text: str, names: Sequence[str]) -> Tuple[str, List[str]]:
    """把名单里出现过的人名包成双链，已经是双链的不重复包。

    长名字优先匹配：「王小明」与「王小」同时在册时，先匹配长的，
    否则会得到 `[[王小]]明` 这种既断链又难看的东西。
    """
    linked: List[str] = []
    rendered = text

    for name in sorted(names, key=len, reverse=True):
        if not name or name not in rendered:
            continue

        # 已经在双链里的不再动
        pattern = re.compile(r"(?<!\[\[)" + re.escape(name) + r"(?!\]\])")
        rendered, count = pattern.subn(f"[[{name}]]", rendered)

        if count:
            linked.append(name)

    return rendered, linked


# ============================================================
# 插入算法（对侧 core/markdown.ts 的 insertIntoSection）
# ============================================================

_ANY_HEADING = re.compile(r"^#{1,6}\s")


def insert_into_section(content: str, heading: str, lines_to_add: Sequence[str]) -> str:
    """往指定小节末尾追加若干行，行为与插件那一侧逐条对齐。

    找不到小节时宁可追加到文末也绝不拒绝写入——学员改过标题不该导致他的记录丢失。
    """
    lines = content.split("\n")
    heading_index = next(
        (i for i, text in enumerate(lines) if text.strip() == heading.strip()), -1
    )

    if heading_index < 0:
        tail = content.rstrip()

        return tail + "\n\n" + heading + "\n\n" + "\n".join(lines_to_add) + "\n"

    section_end = len(lines)

    for cursor in range(heading_index + 1, len(lines)):
        if _ANY_HEADING.match(lines[cursor]):
            section_end = cursor
            break

    insert_at = section_end
    fence = "```" + VIEW_BLOCK_LANG

    # 小节里有视图块就插在它之前，让原始记录留在汇总表上方
    for cursor in range(heading_index + 1, section_end):
        if lines[cursor].lstrip().startswith(fence):
            insert_at = cursor
            break

    while insert_at > heading_index + 1 and lines[insert_at - 1].strip() == "":
        insert_at -= 1

    # 模板留的那行空占位直接用掉，免得记录下面永远挂着一根孤零零的横杠
    if insert_at > heading_index + 1 and lines[insert_at - 1].strip() == PLACEHOLDER:
        lines[insert_at - 1 : insert_at] = list(lines_to_add)

        return "\n".join(lines)

    lines[insert_at:insert_at] = list(lines_to_add)

    return "\n".join(lines)


def insert_below_heading(content: str, heading: str, lines_to_add: Sequence[str]) -> str:
    """插到标题区的最前面（灵感集的 heading-top）。

    越过标题本身、紧随其后的空行与 Dataview 查询块——那块是系统生成的汇总，
    新记录该落在它下面而不是把它顶开。
    """
    lines = content.split("\n")
    heading_index = next(
        (i for i, text in enumerate(lines) if text.strip() == heading.strip()), -1
    )

    if heading_index < 0:
        return heading + "\n\n" + "\n".join(lines_to_add) + "\n\n" + content.lstrip()

    cursor = heading_index + 1

    while cursor < len(lines) and lines[cursor].strip() == "":
        cursor += 1

    # 跳过紧随标题的代码块（Dataview 查询）
    if cursor < len(lines) and lines[cursor].lstrip().startswith("```"):
        cursor += 1

        while cursor < len(lines) and not lines[cursor].lstrip().startswith("```"):
            cursor += 1

        cursor = min(cursor + 1, len(lines))

        while cursor < len(lines) and lines[cursor].strip() == "":
            cursor += 1

    lines[cursor:cursor] = list(lines_to_add) + [""]

    return "\n".join(lines)


# ============================================================
# 日记骨架（对侧 modules/review/templates.ts 的 periodNoteContent）
# ============================================================

def iso_week_title(day: date) -> str:
    """周记标题 `GGGG-WWW`：ISO 周所属年 + W + 两位周序。

    必须用 ISO 周年而不是日历年。跨年那一周属于哪一年，两种口径给出不同答案，
    于是元旦前后几天的日记会把「本周」指向一篇根本不存在的周记，且不报错。
    """
    week_year, week, _ = day.isocalendar()

    return "%04d-W%02d" % (week_year, week)


def daily_note(day: str, theme: str, now: datetime) -> str:
    """生成今天的日记全文，与插件那一侧逐字节一致。"""
    anchor = datetime.strptime(day, DAY_FORMAT).date()
    theme_value = (" " + theme) if theme else ""
    frontmatter = "\n".join(
        [
            "---",
            "created: " + now.strftime(STAMP_FORMAT),
            "updated:",
            "UID: " + now.strftime(UID_FORMAT),
            "type: diary",
            "theme:" + theme_value,
            "---",
        ]
    )
    navigation = (
        "<< [[%s]] | [[%s]] >>%s↑ [[%s|本周]]"
        % (
            (anchor - timedelta(days=1)).strftime(DAY_FORMAT),
            (anchor + timedelta(days=1)).strftime(DAY_FORMAT),
            PARENT_GAP,
            iso_week_title(anchor),
        )
    )
    body = "\n".join(
        [
            DIARY_HEADING,
            "",
            "- ",
            "",
            PRODUCTION_HEADING,
            "",
            "```" + VIEW_BLOCK_LANG + "\n今日产出\n```",
        ]
    )

    return "\n".join([frontmatter, "", "# " + day, "", navigation, "", body, ""])


# ============================================================
# 文件闸门
# ============================================================

def _normalize(path: Path) -> Path:
    """NFC 归一。中文库名在 macOS 上有 NFC / NFD 两种形态，肉眼相同但字符串不等。"""
    return Path(unicodedata.normalize("NFC", str(path)))


def read_note(path: Path) -> str:
    if not path.is_file():
        return ""

    if path.stat().st_size > MAX_NOTE_BYTES:
        raise Refused(f"目标笔记超过 {MAX_NOTE_BYTES // 1024 // 1024} MB，拒绝整篇读改写：{path}")

    return path.read_text(encoding="utf-8")


def write_note(path: Path, content: str) -> None:
    """保权限原子写入：先写同目录临时文件再改名，中途断电也不会留下半篇笔记。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = path.stat().st_mode if path.is_file() else None
    handle, temp_name = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")

    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            stream.write(content)

        if mode is not None:
            os.chmod(temp_name, mode)

        os.replace(temp_name, str(path))
    except BaseException:
        if os.path.exists(temp_name):
            os.unlink(temp_name)

        raise


# ============================================================
# 三条写入
# ============================================================

def write_inspiration(layout: Layout, raw: str, now: datetime) -> Dict[str, object]:
    """灵感、链接、一切还没消化的东西——一律进《兼收并蓄》。"""
    body, moved = render_links(_guard_entry(raw))
    entry = INSPIRATION_FORMAT.format(
        content=body, date=now.strftime(DAY_FORMAT), time=now.strftime(TIME_FORMAT)
    )

    if SOURCE_MARK:
        entry += " " + SOURCE_MARK

    target = _normalize(layout.capture / INSPIRATION_FILE)
    content = read_note(target) or (INSPIRATION_HEADING + "\n\n")
    updated = insert_below_heading(content, INSPIRATION_HEADING, [entry] + _link_lines(moved))

    write_note(target, updated)

    return {
        "display": "✓ 已记进灵感集 · " + INSPIRATION_FILE,
        "vault": str(layout.capture),
        "path": str(target),
        "links": list(moved),
        "linkedPeople": [],
    }


def write_diary(
    layout: Layout, raw: str, theme: Optional[str], now: datetime
) -> Dict[str, object]:
    """明确说「记今天的事」才走这条——进《以人为本》今天的日记。"""
    entry_text = _guard_entry(raw)
    body, moved = render_links(entry_text)
    body, linked = link_people(body, roster(layout))

    day = now.strftime(DAY_FORMAT)
    target = _normalize(layout.human / DIARY_SUBFOLDER / (day + ".md"))
    created = False

    if not target.is_file():
        # 主题是用户对这一天的结论，AI 替他写等于伪造。
        # 「没给 theme」与「明确传空串」因此是两种语义：前者必须停下来先问人
        if theme is None:
            raise Refused(
                "theme_required：今天的日记还没建。先问用户一句「今天的主题是什么」，"
                "拿到回答再用 --theme 重发一次；他说不想写就传 --theme \"\"。"
            )

        write_note(target, daily_note(day, clean(theme), now))
        created = True

    line = "- " + body + " " + now.strftime(TIME_FORMAT)

    if SOURCE_MARK:
        line += " " + SOURCE_MARK

    content = read_note(target)
    updated = insert_into_section(content, DIARY_HEADING, [line] + _link_lines(moved))

    write_note(target, updated)

    return {
        "display": "✓ 已记进今天的日记 · " + day,
        "vault": str(layout.human),
        "path": str(target),
        "created": created,
        "links": list(moved),
        "linkedPeople": linked,
    }


def write_clip(layout: Layout, title: str, raw: str, now: datetime) -> Dict[str, object]:
    """转发来的长内容，一条一个文件，落在《兼收并蓄》的剪藏里。

    单独成文件而不是塞进灵感集流水，判据在下游：这些东西日后可能被《赛博永生》
    逐条消化，而流水里的一行没法单独标记「这条消化过了」。
    """
    clean_title = clean(title)

    if not clean_title:
        raise Refused("剪藏必须有标题——它就是文件名，也是日后唯一能认出它的东西。")

    body = clean(raw)

    if not body:
        raise Refused("剪藏的正文是空的。")

    if len(body) > MAX_NOTE_BYTES:
        raise Refused("这条剪藏太大了，拒绝写入。")

    rendered, moved = render_links(body)
    safe_title = re.sub(r"[/\\:*?\"<>|]", "－", clean_title)[:80]
    target = _normalize(layout.capture / CLIP_FOLDER / (safe_title + ".md"))
    index = 2

    # 同名不覆盖：剪藏是收进来的原件，覆盖一份原件是不可逆的
    while target.is_file():
        target = _normalize(layout.capture / CLIP_FOLDER / ("%s（%d）.md" % (safe_title, index)))
        index += 1

    content = "\n".join(
        [
            "---",
            "created: " + now.strftime(STAMP_FORMAT),
            "UID: " + now.strftime(UID_FORMAT),
            "type: clip",
            "---",
            "",
            "# " + clean_title,
            "",
            rendered,
            "",
        ]
        + _link_lines(moved)
        + [""]
    )

    write_note(target, content)

    return {
        "display": "✓ 已剪藏 · " + CLIP_FOLDER + "/" + target.name,
        "vault": str(layout.capture),
        "path": str(target),
        "links": list(moved),
        "linkedPeople": [],
    }


# ============================================================
# CLI
# ============================================================

def _content_of(args: argparse.Namespace) -> str:
    """内容要么直接给，要么放文件里。

    禁止管道灌 JSON 与 heredoc：口述内容里出现引号、换行或反引号是常态，
    经 shell 拼装迟早把一句话截断成半句，而截断后的那半句会被照单写进笔记。
    """
    if getattr(args, "content_file", None):
        try:
            return Path(args.content_file).read_text(encoding="utf-8")
        except OSError as exc:
            raise Refused("读不到内容文件：%s" % exc)

    if getattr(args, "content", None) is None:
        raise Refused("必须给出 --content 或 --content-file。")

    return args.content


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ziminOS 口述捕获（灵感 / 日记 / 剪藏）。")
    parser.add_argument("--root", help="系统根绝对路径。不给就按本脚本自己的位置推。")
    commands = parser.add_subparsers(dest="command", required=True)

    commands.add_parser("status", help="三本库在哪、灵感和日记会写去哪。")
    commands.add_parser("people", help="《以人为本》里有档案的人名；决定哪些会写成双链。")

    for name, help_text in (
        ("inspiration", "记一条灵感 / 链接，进《兼收并蓄》。"),
        ("diary", "记一条今天的事，进《以人为本》今天的日记。"),
    ):
        sub = commands.add_parser(name, help=help_text)
        sub.add_argument("--content")
        sub.add_argument("--content-file")

        if name == "diary":
            sub.add_argument(
                "--theme",
                default=None,
                help="今天的主题。只有今天的日记还不存在时才需要，且必须问过用户。",
            )

    clip = commands.add_parser("clip", help="剪藏一段转发来的长内容，一条一个文件。")
    clip.add_argument("--title", required=True)
    clip.add_argument("--content")
    clip.add_argument("--content-file")

    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    now = datetime.now()

    try:
        layout = discover_layout(args.root)

        if args.command == "status":
            result: Dict[str, object] = dict(layout.as_dict())
            result["inspirationPath"] = str(layout.capture / INSPIRATION_FILE)
            result["diaryFolder"] = str(layout.human / DIARY_SUBFOLDER)
            result["peopleCount"] = len(roster(layout))
        elif args.command == "people":
            result = {"people": roster(layout)}
        elif args.command == "inspiration":
            result = write_inspiration(layout, _content_of(args), now)
        elif args.command == "diary":
            result = write_diary(layout, _content_of(args), args.theme, now)
        else:
            result = write_clip(layout, args.title, _content_of(args), now)
    except Refused as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))

        return EXIT_REFUSED
    except OSError as exc:
        # 磁盘层面的失败结果未知：可能写了一半，也可能一个字节都没落。
        # 这一级**禁止重试**——重试可能把同一条记录写两遍
        print(json.dumps({"error": "结果未知，请先打开笔记看一眼：%s" % exc}, ensure_ascii=False))

        return EXIT_UNKNOWN

    print(json.dumps(result, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    sys.exit(main())
