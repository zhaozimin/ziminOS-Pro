#!/usr/bin/env python3
"""notectl 的确定性回归。

[INPUT]: 依赖同目录 notectl 与标准库 unittest / tempfile。
[OUTPUT]: 一个可直接 `python3 test_notectl.py` 跑完的测试集，零第三方依赖。
[POS]: 这是全仓库第一个自动化测试，落在这里不是偶然——
       notectl 是**直接往用户笔记里写字**的代码，而它的核心全是零 I/O 的纯函数：
       输入输出都是字符串，天生可以在没有笔记库、没有 Obsidian 的环境里逐字节验证。
       每一条用例都对应一个真实会发生、且**不会报错**的错误：
       地址吞掉半句中文、砍掉维基链接的右括号、把「王小」从「王小明」里抠出来、
       日记导航行里的全角空格被写成半角、跨年周指向一篇不存在的周记。
       这些错误共同的特征是：写出来的东西看上去完全正常。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import notectl as N  # noqa: E402


class CleanTest(unittest.TestCase):
    def test_collapses_whitespace(self):
        self.assertEqual(N.clean("  两   段\n\n话  "), "两 段 话")

    def test_replaces_fullwidth_bar(self):
        """全角竖线是人情账本的记号，混进日记会凭空记一笔债且不报错。"""
        self.assertEqual(N.clean("去｜王磊｜请客"), "去|王磊|请客")

    def test_keeps_every_other_character(self):
        raw = "定价页把年付放在最前面，转化率提升 12%——这条要验证"
        self.assertEqual(N.clean(raw), raw)


class UrlTest(unittest.TestCase):
    def test_does_not_swallow_chinese(self):
        """中文不写空格，\\S+ 会把整句吞进地址，而写出来的链接看上去完全正常。"""
        found = N._find_urls("看这个 https://b.org/y，后者更清楚")
        self.assertEqual([url for _, _, url in found], ["https://b.org/y"])

    def test_keeps_balanced_parens(self):
        found = N._find_urls("见 https://en.wikipedia.org/wiki/Foo_(bar)")
        self.assertEqual([url for _, _, url in found], ["https://en.wikipedia.org/wiki/Foo_(bar)"])

    def test_trims_unbalanced_paren(self):
        found = N._find_urls("见 (https://example.com/x)")
        self.assertEqual([url for _, _, url in found], ["https://example.com/x"])

    def test_trims_trailing_punctuation(self):
        found = N._find_urls("见 https://example.com/x.")
        self.assertEqual([url for _, _, url in found], ["https://example.com/x"])

    def test_skips_existing_markdown_link(self):
        found = N._find_urls("看 [标题](https://example.com/x) 就好")
        self.assertEqual(found, [])


class RenderLinksTest(unittest.TestCase):
    def test_moves_single_trailing_link(self):
        body, moved = N.render_links("这个视频讲得好 https://b.org/v")
        self.assertEqual(body, "这个视频讲得好")
        self.assertEqual(moved, ["https://b.org/v"])

    def test_keeps_mid_sentence_link_inline(self):
        """搬走会留下「发来两个参考 和 ，后者更清楚」这种破句子。"""
        body, moved = N.render_links("他发来 https://b.org/x 说要看")
        self.assertEqual(moved, [])
        self.assertIn("[点击跳转](https://b.org/x)", body)
        self.assertTrue(body.startswith("他发来 "))

    def test_two_links_get_host_labels(self):
        body, moved = N.render_links("看 https://a.org/x 和 https://b.org/y")
        self.assertEqual(moved, [])
        self.assertIn("[点击跳转 · a.org](https://a.org/x)", body)
        self.assertIn("[点击跳转 · b.org](https://b.org/y)", body)

    def test_untouched_when_no_link(self):
        self.assertEqual(N.render_links("一句普通的话"), ("一句普通的话", []))


class PeopleTest(unittest.TestCase):
    def test_links_only_known_names(self):
        body, linked = N.link_people("和王磊、李四聊了聊", ["王磊"])
        self.assertEqual(body, "和[[王磊]]、李四聊了聊")
        self.assertEqual(linked, ["王磊"])

    def test_longest_name_wins(self):
        """先匹配短的会得到 [[王小]]明，既断链又难看。"""
        body, _ = N.link_people("见了王小明", ["王小", "王小明"])
        self.assertEqual(body, "见了[[王小明]]")

    def test_does_not_double_wrap(self):
        body, _ = N.link_people("和[[王磊]]聊", ["王磊"])
        self.assertEqual(body, "和[[王磊]]聊")

    def test_empty_roster_links_nothing(self):
        body, linked = N.link_people("和王磊聊", [])
        self.assertEqual(body, "和王磊聊")
        self.assertEqual(linked, [])


class InsertSectionTest(unittest.TestCase):
    def test_consumes_placeholder(self):
        """模板留的那根孤零零的横杠该被用掉，不该永远挂在记录下面。"""
        content = "## 今天做了什么\n\n- \n\n## 下一节\n"
        result = N.insert_into_section(content, "## 今天做了什么", ["- 干了活"])
        self.assertEqual(result, "## 今天做了什么\n\n- 干了活\n\n## 下一节\n")

    def test_inserts_before_view_block(self):
        """原始记录留在汇总表上方。"""
        content = "## 今天做了什么\n\n- 已有\n\n```ziminos\n今日产出\n```\n"
        result = N.insert_into_section(content, "## 今天做了什么", ["- 新的"])
        lines = result.split("\n")
        self.assertLess(lines.index("- 新的"), lines.index("```ziminos"))

    def test_appends_when_heading_missing(self):
        """学员改过标题不该导致他的记录丢失。"""
        result = N.insert_into_section("# 只有标题\n", "## 今天做了什么", ["- 一条"])
        self.assertIn("## 今天做了什么", result)
        self.assertIn("- 一条", result)


class InsertBelowHeadingTest(unittest.TestCase):
    def test_newest_sits_directly_below_heading(self):
        """新的一条永远是 `# 灵感集` 下面的第一行，且与旧条目连成同一串列表。"""
        content = N.INSPIRATION_NOTE
        for text in ["第一条", "第二条"]:
            content = N.insert_below_heading(content, N.INSPIRATION_HEADING, ["- [ ] " + text])

        self.assertEqual(
            content,
            N.INSPIRATION_QUERY + "\n\n# 灵感集\n\n- [ ] 第二条\n- [ ] 第一条\n",
        )

    def test_hoists_legacy_header(self):
        """老布局（标题在上、系统查询在下）在下一次写入时换位，此后只有一种形态。"""
        legacy = "# 灵感集\n\n" + N.INSPIRATION_QUERY + "\n\n- [ ] 旧的\n"
        result = N.insert_below_heading(legacy, N.INSPIRATION_HEADING, ["- [ ] 新的"])

        self.assertEqual(
            result,
            N.INSPIRATION_QUERY + "\n\n# 灵感集\n\n- [ ] 新的\n- [ ] 旧的\n",
        )

    def test_keeps_foreign_query_where_it_is(self):
        """用户自己写的查询一个字都不搬：搬错了不报错，只是某天它凭空换了地方。"""
        mine = "# 灵感集\n\n```dataview\ntask\nfrom \"别处\"\n```\n\n- [ ] 旧的\n"
        result = N.insert_below_heading(mine, N.INSPIRATION_HEADING, ["- [ ] 新的"])
        lines = result.split("\n")

        self.assertLess(lines.index("# 灵感集"), lines.index("```dataview"))
        self.assertLess(lines.index("```dataview"), lines.index("- [ ] 新的"))
        self.assertLess(lines.index("- [ ] 新的"), lines.index("- [ ] 旧的"))

    def test_restores_missing_heading_below_the_query(self):
        """学员删掉标题也不该让版式永久走样，更不该丢掉已有的条目。"""
        result = N.insert_below_heading(
            N.INSPIRATION_QUERY + "\n\n- [ ] 孤儿\n", N.INSPIRATION_HEADING, ["- [ ] 新的"]
        )
        lines = result.split("\n")

        self.assertLess(lines.index("```dataview"), lines.index("# 灵感集"))
        self.assertLess(lines.index("# 灵感集"), lines.index("- [ ] 新的"))
        self.assertIn("- [ ] 孤儿", lines)


# 装出去的那一份只有 scripts/，仓库里才有 vault-pro/。这条因此是**仓库期审计**：
# 交付的空模板与脚本认得的那一份必须逐字节相同——差一个字节，用户收到笔记库后
# 记的第一条口述就走进「认不出页眉」的降级路径，把标题补在查询上面，且不报错。
REPO_TEMPLATE = Path(__file__).resolve().parents[2] / "vault-pro" / "兼收并蓄" / "灵感集.md"


class ShippedTemplateTest(unittest.TestCase):
    @unittest.skipUnless(REPO_TEMPLATE.is_file(), "只在仓库里跑")
    def test_matches_initial_note(self):
        self.assertEqual(REPO_TEMPLATE.read_text(encoding="utf-8"), N.INSPIRATION_NOTE)


class DailyNoteTest(unittest.TestCase):
    def test_matches_plugin_template(self):
        """与插件那一侧逐字节一致。差一个字符，同一天会长出两种日记。"""
        now = datetime(2026, 8, 16, 19, 33, 7)
        expected = (
            "---\n"
            "created: 2026-08-16 19:33:07\n"
            "updated:\n"
            "UID: 20260816193307\n"
            "type: diary\n"
            "theme: 课程结构定稿\n"
            "---\n"
            "\n"
            "# 2026-08-16\n"
            "\n"
            "<< [[2026-08-15]] | [[2026-08-17]] >>　↑ [[2026-W33|本周]]\n"
            "\n"
            "## 今天做了什么\n"
            "\n"
            "- \n"
            "\n"
            "## 今日产出（自动）\n"
            "\n"
            "```ziminos\n今日产出\n```\n"
        )
        self.assertEqual(N.daily_note("2026-08-16", "课程结构定稿", now), expected)

    def test_parent_gap_is_ideographic_space(self):
        """改成半角肉眼无差别，但生成出来的日记就不再逐字节相同了。"""
        note = N.daily_note("2026-08-16", "", datetime(2026, 8, 16, 9, 0, 0))
        self.assertIn(">>　↑", note)

    def test_empty_theme_leaves_key_bare(self):
        note = N.daily_note("2026-08-16", "", datetime(2026, 8, 16, 9, 0, 0))
        self.assertIn("\ntheme:\n", note)


class IsoWeekTest(unittest.TestCase):
    def test_new_year_week_belongs_to_previous_year(self):
        """用日历年的话，元旦前后几天会指向一篇永远不存在的周记，且不报错。"""
        self.assertEqual(N.iso_week_title(date(2027, 1, 1)), "2026-W53")

    def test_ordinary_week(self):
        self.assertEqual(N.iso_week_title(date(2026, 8, 16)), "2026-W33")


class EndToEndTest(unittest.TestCase):
    """在一个临时三库系统上真的写一遍，验证布局发现与两条写入路径。"""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        marker = {
            "edition": "pro",
            "role": "human",
            "vaults": {"capture": "兼收并蓄", "human": "以人为本", "eternal": "赛博永生"},
        }
        human = self.root / "以人为本"
        (human / ".obsidian/plugins/ziminos").mkdir(parents=True)
        (human / ".obsidian/plugins/ziminos/edition.json").write_text(
            json.dumps(marker, ensure_ascii=False), encoding="utf-8"
        )
        (human / N.CONTACT_FOLDER).mkdir(parents=True)
        (human / N.CONTACT_FOLDER / "王磊.md").write_text("# 王磊\n", encoding="utf-8")
        (human / N.CONTACT_FOLDER / "人脉MOC.md").write_text("# 人脉MOC\n", encoding="utf-8")
        (self.root / "兼收并蓄").mkdir()
        (self.root / "赛博永生").mkdir()
        self.layout = N.discover_layout(str(self.root))

    def tearDown(self):
        self.tmp.cleanup()

    def test_roster_excludes_moc(self):
        self.assertEqual(N.roster(self.layout), ["王磊"])

    def test_inspiration_lands_in_capture(self):
        result = N.write_inspiration(
            self.layout, "定价页把年付放在最前面 https://a.org/x", datetime(2026, 8, 16, 19, 33)
        )
        written = Path(str(result["path"])).read_text(encoding="utf-8")
        self.assertIn("- [ ] 定价页把年付放在最前面 [[2026-08-16]] 19:33 #口述", written)
        self.assertIn("    - 🔗 [点击跳转](https://a.org/x)", written)
        self.assertTrue(str(result["path"]).startswith(str(self.layout.capture)))

    def test_diary_requires_theme_first_time(self):
        with self.assertRaises(N.Refused) as caught:
            N.write_diary(self.layout, "下午和王磊过了课程大纲", None, datetime(2026, 8, 16, 15, 0))

        self.assertIn("theme_required", str(caught.exception))

    def test_diary_creates_then_appends_without_asking_again(self):
        now = datetime(2026, 8, 16, 15, 0)
        first = N.write_diary(self.layout, "下午和王磊过了课程大纲", "课程结构定稿", now)
        self.assertTrue(first["created"])
        self.assertEqual(first["linkedPeople"], ["王磊"])

        second = N.write_diary(self.layout, "晚上又改了一版", None, now)
        self.assertFalse(second["created"])

        written = Path(str(second["path"])).read_text(encoding="utf-8")
        self.assertIn("theme: 课程结构定稿", written)
        self.assertIn("- 下午和[[王磊]]过了课程大纲 15:00 #口述", written)
        self.assertIn("- 晚上又改了一版 15:00 #口述", written)

    def test_clip_never_overwrites(self):
        now = datetime(2026, 8, 16, 19, 33)
        first = N.write_clip(self.layout, "分层架构", "正文一", now)
        second = N.write_clip(self.layout, "分层架构", "正文二", now)
        self.assertNotEqual(first["path"], second["path"])
        self.assertIn("分层架构（2）", str(second["path"]))

    def test_cli_status_runs(self):
        completed = subprocess.run(
            [sys.executable, str(Path(__file__).parent / "notectl.py"),
             "--root", str(self.root), "status"],
            capture_output=True, text=True,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(json.loads(completed.stdout)["peopleCount"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
