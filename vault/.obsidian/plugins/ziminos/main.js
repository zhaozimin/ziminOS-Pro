/*
本文件由 esbuild 自 src/ 目录打包生成，请勿直接编辑。
需要修改行为请改 src/ 下的 TypeScript 源码，然后运行 npm run build。

图标来自 Pikaicons（https://pikaicons.com），MIT License，Copyright (c) 2022 Mau Joost。
其中若干图形由 ziminOS 照同一套画法补画，同样以 MIT 授权分发。
农历换算来自 lunar-typescript（https://github.com/6tail/lunar-typescript），MIT License，Copyright (c) 2020 6tail。
内置节假日快照沿用 holiday-cn（https://github.com/NateScarlet/holiday-cn）数据格式，MIT License，Copyright (c) 2019 NateScarlet。
详见 docs/第三方组件.md。
*/

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ZiminosPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian43 = require("obsidian");

// src/core/codeblock.ts
var import_obsidian3 = require("obsidian");

// src/core/constants.ts
var FOLDERS = {
  inbox: "00-inbox",
  projects: "01-projects",
  areas: "02-areas",
  resources: "03-resources",
  archives: "04-archives",
  diary: "05-diary",
  system: "90-system",
  template: "90-system/Template"
};
var INIT_FOLDERS = [
  FOLDERS.inbox,
  FOLDERS.projects,
  FOLDERS.areas,
  FOLDERS.resources,
  FOLDERS.archives,
  FOLDERS.system,
  FOLDERS.template
];
var CONTACT_FOLDER = `${FOLDERS.areas}/\u4EBA\u8109`;
var CLIENT_FOLDER = `${FOLDERS.areas}/\u5BA2\u6237`;
var NAV_FILE = `${FOLDERS.system}/\u5BFC\u822A.md`;
var README_FILE = "README.md";
var SCHEMA_NOTE = `${FOLDERS.system}/\u5C5E\u6027\u7C7B\u578B\u793A\u4F8B.md`;
var TEMPLATE_FILES = {
  moc: `${FOLDERS.template}/MOC \u6A21\u677F.md`,
  card: `${FOLDERS.template}/\u5361\u7247\u7B14\u8BB0\u6A21\u677F.md`,
  person: `${FOLDERS.template}/\u4EBA\u8109\u6A21\u677F.md`,
  client: `${FOLDERS.template}/\u5BA2\u6237\u6A21\u677F.md`
};
var CONTACT_MOC = `${CONTACT_FOLDER}/\u4EBA\u8109MOC.md`;
var CLIENT_MOC = `${CLIENT_FOLDER}/\u5BA2\u6237MOC.md`;
var INSPIRATION_INSERT_POSITIONS = [
  "heading-top",
  "heading-bottom",
  "file-top",
  "file-bottom"
];
var INSPIRATION_DEFAULTS = {
  folder: FOLDERS.inbox,
  fileName: "\u7075\u611F\u96C6.md",
  heading: "# \u7075\u611F\u96C6",
  insertPosition: "heading-top",
  format: "- [ ] {{content}} [[{{date}}]] {{time}}"
};
var LEGACY_INSPIRATION_FORMATS = [
  "- [ ]  {{content}} [[{{date}}]] {{time}}"
];
var CARD_FIELDS = [
  "aliases",
  "description",
  "created",
  "updated",
  "tags",
  "UID",
  "rating",
  "author",
  "source",
  "up"
];
var DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
var UID_FORMAT = "YYYYMMDDHHmmss";
var SELF_WRITE_WINDOW_MS = 3e3;
var TRANSITIONS = {
  done: {
    label: "\u5B8C\u6210",
    source: "active",
    target: "archive",
    status: "done",
    allowedStatuses: ["active"]
  },
  dropped: {
    label: "\u653E\u5F03",
    source: "active",
    target: "archive",
    status: "dropped",
    allowedStatuses: ["active"]
  },
  paused: {
    label: "\u6682\u505C",
    source: "active",
    target: "archive",
    status: "paused",
    allowedStatuses: ["active"]
  },
  active: {
    label: "\u91CD\u65B0\u5F00\u59CB",
    source: "archive",
    target: "active",
    status: "active",
    allowedStatuses: ["done", "dropped", "paused"]
  }
};
var STATUS_LABELS = {
  active: "\u8FDB\u884C\u4E2D",
  paused: "\u5DF2\u6682\u505C",
  done: "\u5DF2\u5B8C\u6210",
  dropped: "\u5DF2\u653E\u5F03"
};
var FIELDS = {
  aliases: "aliases",
  description: "description",
  created: "created",
  updated: "updated",
  tags: "tags",
  uid: "UID",
  type: "type",
  status: "status",
  up: "up",
  /** 归档时刻。由状态流转命令与 status 同一次写入，是「本月完成了什么」唯一可信的时间事实 */
  archived: "archived",
  /** 项目→人的商业契约标记：写下它等于宣告「我欠这个人一个交付」 */
  client: "client",
  /** 项目→人的同行标记：一起做的，无交付债务 */
  with: "with",
  tier: "tier",
  direction: "direction",
  gift: "gift",
  address: "address",
  get: "get",
  birthday: "birthday",
  source: "source",
  author: "author",
  rating: "rating",
  contact: "contact",
  homepage: "homepage",
  /** 复盘主题：主题链的唯一入口，五级各写一句 */
  theme: "theme",
  /** 复盘周期锚点，YYYY-MM-DD 定宽字符串；日记没有此字段，它的锚点是文件名 */
  periodStart: "period_start"
};
var NOTE_TYPES = {
  project: "project",
  area: "area",
  /** 读书笔记：一本书就是一个项目，住项目目录，读完走「完成项目」归档 */
  book: "book",
  /** 人脉档案：认识的人，有生日有脾气有人情往来 */
  person: "person",
  /** 付费用户：陌生人买你的东西，你只知道渠道与联系方式，是与 person 并列的独立物种 */
  client: "client",
  diary: "diary",
  weekly: "weekly",
  monthly: "monthly",
  quarterly: "quarterly",
  yearly: "yearly"
};
var CONTAINER_TYPES = [NOTE_TYPES.project, NOTE_TYPES.book];
var MOC_PREFIX = "MOC-";
var DAY_FORMAT = "YYYY-MM-DD";
var PERIODS = {
  daily: {
    key: "daily",
    type: NOTE_TYPES.diary,
    label: "\u65E5\u8BB0",
    folder: `${FOLDERS.diary}/01-daily`,
    titleFormat: DAY_FORMAT,
    startOfUnit: "day",
    stepUnit: "day",
    parent: "weekly",
    parentAlias: "\u672C\u5468"
  },
  weekly: {
    key: "weekly",
    type: NOTE_TYPES.weekly,
    label: "\u5468\u8BB0",
    folder: `${FOLDERS.diary}/02-weekly`,
    // GGGG 是 ISO 周所属年，与 WW 配对才不会在跨年周上错位
    titleFormat: "GGGG-[W]WW",
    startOfUnit: "isoWeek",
    stepUnit: "week",
    parent: "monthly",
    parentAlias: "\u672C\u6708"
  },
  monthly: {
    key: "monthly",
    type: NOTE_TYPES.monthly,
    label: "\u6708\u8BB0",
    folder: `${FOLDERS.diary}/03-monthly`,
    titleFormat: "YYYY-MM",
    startOfUnit: "month",
    stepUnit: "month",
    parent: "quarterly",
    parentAlias: "\u672C\u5B63"
  },
  quarterly: {
    key: "quarterly",
    type: NOTE_TYPES.quarterly,
    label: "\u5B63\u8BB0",
    folder: `${FOLDERS.diary}/04-quarterly`,
    titleFormat: "YYYY-[Q]Q",
    startOfUnit: "quarter",
    stepUnit: "quarter",
    parent: "yearly",
    parentAlias: "\u672C\u5E74"
  },
  yearly: {
    key: "yearly",
    type: NOTE_TYPES.yearly,
    label: "\u5E74\u8BB0",
    folder: `${FOLDERS.diary}/05-yearly`,
    titleFormat: "YYYY",
    startOfUnit: "year",
    stepUnit: "year",
    parent: null,
    parentAlias: ""
  }
};
var DIARY_FOLDERS = [
  FOLDERS.diary,
  PERIODS.daily.folder,
  PERIODS.weekly.folder,
  PERIODS.monthly.folder,
  PERIODS.quarterly.folder,
  PERIODS.yearly.folder
];
var DIARY_LOG_HEADING = "## \u4ECA\u5929\u505A\u4E86\u4EC0\u4E48";
var CONTACT_TIERS = ["\u5BC6", "\u8FD1", "\u719F", "\u8FDC"];
var TIER_LIMITS = {
  \u5BC6: 7,
  \u8FD1: 30,
  \u719F: 90,
  \u8FDC: 365
};
var TIER_FALLBACK_LIMIT = 365;
var CONTACT_DIRECTIONS = ["\u5411\u4E0A", "\u5E73\u884C", "\u5411\u4E0B"];
var LEDGER = {
  separator: "\uFF5C",
  /** 第二段必须是它们之一，否则这行不是账本行 */
  kinds: ["\u53BB", "\u6765"],
  /** 第四段的合法取值；写了别的以 ⚠️ 前缀暴露，不静默吞掉 */
  statuses: ["\u4E24\u6E05", "\u6211\u6B20", "\u4ED6\u6B20"],
  /** 第四段省略即两清——两清是最常见的情形，让最常见的写法最短 */
  defaultStatus: "\u4E24\u6E05"
};
var PAYMENT_FIELDS = {
  product: "\u4EA7\u54C1",
  amount: "\u91D1\u989D",
  date: "\u65E5\u671F"
};
var CLIENT_PAYMENT_HEADING = "## \u4ED8\u8D39\u4E0E\u4EA4\u4ED8";
var PROJECT_PAYMENT_HEADING = "## \u6536\u6B3E";
var BOOK_HEADINGS = {
  highlights: "## \u5168\u90E8\u5212\u7EBF"
};
var BOOK_CHAPTER_PREFIX = "### ";
var BOOK_THOUGHT_PREFIX = "\u{1F4AD} ";
var BOOK_CALLOUTS = {
  highlight: "> [!quote]",
  thought: "> [!note]"
};
var BOOK_TAG_COUNTS = [0, 3, 5, 8];
var BOOK_TAG_DEFAULTS = {
  prefix: "\u4E66\u7C4D",
  count: 5
};
var SNIPPET_FOLDER_NAME = "snippets";
var SNIPPET_EXTENSION = ".css";
var APPEARANCE_FILE_NAME = "appearance.json";
var ENABLED_SNIPPETS_KEY = "enabledCssSnippets";
var FOLDER_COUNT_TARGETS = ["notes", "folders", "all"];
var FOLDER_COUNT_DEFAULTS = {
  target: "notes",
  recursive: true
};
var RECENT_FILES_FILE = "recent-files.json";
var CURSOR_STATE_FILE = "cursor-positions.json";
var RECENT_FILES_KEEP = 50;
var RECENT_FILES_LIMITS = [10, 20, 30, 50];
var RECENT_FILES_SORTS = ["opened", "modified"];
var RECENT_FILES_DEFAULTS = {
  limit: 30,
  sort: "opened"
};
var CURSOR_MEMORY_LIMIT = 200;
var VIEW_BLOCK_LANG = "ziminos";
var VIEW_REFRESH_DEBOUNCE_MS = 200;
var EXPORT_MANIFEST_FILE = `${FOLDERS.system}/\u8D5B\u535A\u6C38\u751F\u51FA\u5E93\u5355.md`;
var EXPORT_MANIFEST_HEADING = "## \u5F85\u642C\u8FD0";
var EXPORT_MANIFEST_SEPARATOR = " \xB7 ";
var ETERNAL_FOLDERS = {
  raw: "10-\u539F\u6599",
  wiki: "20-\u77E5\u8BC6",
  system: "90-\u7CFB\u7EDF"
};
var ETERNAL_INDEX_FILE = `${ETERNAL_FOLDERS.wiki}/\u7D22\u5F15.md`;
var ETERNAL_LOG_FILE = `${ETERNAL_FOLDERS.system}/\u8D26\u672C.md`;
var ETERNAL_LOG_INGEST_MARKS = ["\u6D88\u5316", "ingest"];

// src/core/table.ts
function noteLink(file, display) {
  return { path: file.path, display: display != null ? display : file.basename };
}
function richText(text3, fromPath) {
  return { text: text3, from: fromPath };
}
function isObjectCell(cell) {
  return typeof cell === "object" && cell !== null && !(cell instanceof HTMLElement);
}
function isNoteLink(cell) {
  return isObjectCell(cell) && "path" in cell;
}
function renderTable(app, el, sourcePath, headers, rows, grow) {
  const wrapper = el.createDiv({ cls: "ziminos-table-wrap" });
  const table = wrapper.createEl("table", { cls: "ziminos-table" });
  const headRow = table.createEl("thead").createEl("tr");
  const classOf = (index) => grow === void 0 ? void 0 : index === grow ? "ziminos-grow" : "ziminos-tight";
  headers.forEach((header, index) => {
    headRow.createEl("th", {
      cls: classOf(index),
      text: index === 0 && rows.length ? `${header} (${rows.length})` : header
    });
  });
  const body = table.createEl("tbody");
  for (const row of rows) {
    const tr = body.createEl("tr");
    row.forEach((cell, index) => {
      renderCell(app, tr.createEl("td", { cls: classOf(index) }), sourcePath, cell);
    });
  }
}
function renderCell(app, td, sourcePath, cell) {
  if (cell === null || cell === void 0) {
    td.setText("\u2014");
    return;
  }
  if (cell instanceof HTMLElement) {
    td.appendChild(cell);
    return;
  }
  if (isNoteLink(cell)) {
    renderNoteLink(app, td, sourcePath, cell);
    return;
  }
  if (isObjectCell(cell)) {
    renderTextWithLinks(app, td, cell.text, cell.from);
    return;
  }
  renderRichText(td, String(cell));
}
function renderNoteLink(app, parent, sourcePath, link) {
  const anchor = parent.createEl("a", {
    cls: "internal-link",
    text: link.display,
    href: link.path
  });
  anchor.setAttribute("data-href", link.path);
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    void app.workspace.openLinkText(link.path, sourcePath, event.ctrlKey || event.metaKey);
  });
}
var WIKILINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\\?\|([^\]]*))?\]\]/g;
function renderTextWithLinks(app, parent, text3, fromPath) {
  var _a;
  WIKILINK.lastIndex = 0;
  let cursor = 0;
  let match = WIKILINK.exec(text3);
  while (match) {
    if (match.index > cursor) parent.appendText(text3.slice(cursor, match.index));
    const target = match[1].trim();
    const display = ((_a = match[2]) != null ? _a : "").trim() || target;
    renderNoteLink(app, parent, fromPath, { path: target, display });
    cursor = match.index + match[0].length;
    match = WIKILINK.exec(text3);
  }
  if (cursor < text3.length) parent.appendText(text3.slice(cursor));
}
function renderTaskList(app, el, sourcePath, tasks, onToggle) {
  const ordered = [...tasks].sort((left, right) => right.day.localeCompare(left.day));
  renderTable(
    app,
    el,
    sourcePath,
    ["\u5F85\u529E", "\u65E5\u671F"],
    ordered.map((task) => [taskCell(app, task, onToggle), noteLink(task.file, task.day)]),
    0
  );
}
function taskCell(app, task, onToggle) {
  const cell = createSpan({ cls: "ziminos-task" });
  const box = cell.createEl("input", { type: "checkbox", cls: "task-list-item-checkbox" });
  box.checked = task.checked;
  if (task.checked) cell.addClass("is-checked");
  box.addEventListener("click", (event) => {
    event.preventDefault();
    onToggle(task);
  });
  renderTextWithLinks(app, cell.createSpan({ cls: "ziminos-task-text" }), task.text, task.file.path);
  return cell;
}
function renderEmpty(el, message2) {
  renderRichText(el.createEl("p", { cls: "ziminos-empty" }), `\u{1F4ED} ${message2}`);
}
function renderNote(el, message2) {
  renderRichText(el.createEl("p", { cls: "ziminos-note" }), message2);
}
function renderHeading(el, level, text3) {
  el.createEl(level === 3 ? "h3" : "h4", { cls: "ziminos-heading", text: text3 });
}
function renderSummary(el, text3) {
  renderRichText(el.createEl("p", { cls: "ziminos-summary" }), text3);
}
var RICH_MARKUP = /`([^`]+)`|\*\*([^*]+)\*\*/g;
function renderRichText(parent, text3) {
  RICH_MARKUP.lastIndex = 0;
  let cursor = 0;
  let match = RICH_MARKUP.exec(text3);
  while (match) {
    if (match.index > cursor) parent.appendText(text3.slice(cursor, match.index));
    if (match[1] !== void 0) parent.createEl("code", { text: match[1] });
    else parent.createEl("strong", { text: match[2] });
    cursor = match.index + match[0].length;
    match = RICH_MARKUP.exec(text3);
  }
  if (cursor < text3.length) parent.appendText(text3.slice(cursor));
}

// src/core/vaultIndex.ts
var import_obsidian2 = require("obsidian");

// src/core/folders.ts
var import_obsidian = require("obsidian");
function isSystemPath(path) {
  return path === FOLDERS.system || path.startsWith(`${FOLDERS.system}/`);
}
async function ensureFolderPath(app, folderPath) {
  const normalizedFolderPath = (0, import_obsidian.normalizePath)(folderPath);
  const pathParts = normalizedFolderPath.split("/").filter(Boolean);
  let currentPath = "";
  for (const pathPart of pathParts) {
    currentPath = currentPath ? `${currentPath}/${pathPart}` : pathPart;
    const existingEntry = app.vault.getAbstractFileByPath(currentPath);
    if (!existingEntry) {
      await app.vault.createFolder(currentPath);
      continue;
    }
    if (!(existingEntry instanceof import_obsidian.TFolder)) {
      throw new Error(`\u65E0\u6CD5\u521B\u5EFA\u6587\u4EF6\u5939\uFF0C\u56E0\u4E3A\u540C\u4E00\u8DEF\u5F84\u4E0B\u5DF2\u7ECF\u5B58\u5728\u6587\u4EF6\uFF1A${currentPath}`);
    }
  }
}
function normalizeFolderPath(value, fallback) {
  const candidate = typeof value === "string" ? value.trim() : "";
  const path = (candidate || fallback).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return (0, import_obsidian.normalizePath)(path);
}
function isInFolder(path, folder) {
  const base = folder.replace(/\/+$/, "");
  if (!base) return true;
  return path === base || path.startsWith(`${base}/`);
}

// src/core/vaultIndex.ts
var LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[(.)\]\s*)?/;
var WIKILINK2 = /\[\[([^\]]+)\]\]/g;
var VaultIndex = class {
  constructor(app) {
    /** 修订号。变更事件只递增它，不做任何重建工作，因此事件回调恒为 O(1) */
    this.revision = 0;
    /** 反向链接索引构建时的修订号，与当前修订号不等即视为过期 */
    this.backlinksRevision = -1;
    this.backlinks = null;
    /** 按 type 分组的笔记，同一次渲染里一张 MOC 要问四五遍，缓存一次省四五遍全库遍历 */
    this.typesRevision = -1;
    this.types = null;
    /**
     * 列表行缓存。它刻意不随修订号整体作废——每条记录自带 mtime，
     * 改一篇日记不该让另外九十七篇重新读盘。
     */
    this.listCache = /* @__PURE__ */ new Map();
    this.app = app;
  }
  /** 宣告索引已过期。只递增计数，重建推迟到下一次查询 */
  invalidate() {
    this.revision += 1;
  }
  /**
   * 全库 Markdown 笔记，功能目录（90-system）除外。
   * 那里住的是导航、模板与属性示例——系统的零件，没有知识属性，不参与检索。
   * 排除做在这一层，notesOfType 与所有靠它遍历的视图自动继承，不必各自记得。
   */
  allNotes() {
    return this.app.vault.getMarkdownFiles().filter((file) => !isSystemPath(file.path));
  }
  /** 某篇笔记的 frontmatter；没有 YAML 时返回 undefined */
  frontmatterOf(file) {
    var _a;
    return (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  }
  /**
   * 取 frontmatter 里某个字段的原始值。
   * 视图对字段的一切访问都走这里，好处是「笔记没有 YAML」与「有 YAML 但没这个字段」
   * 在调用侧收敛成同一个 undefined，不必每处各写一次可选链。
   */
  fieldOf(file, field2) {
    var _a;
    return (_a = this.frontmatterOf(file)) == null ? void 0 : _a[field2];
  }
  /**
   * 全库 type 为指定值的笔记。
   *
   * 身份靠 type 认，不靠文件夹——学员重命名目录、改分层、用英文目录名，视图一个都不用改。
   * type 在 Obsidian 里可能被写成字符串也可能被写成单元素列表，两种都认。
   */
  notesOfType(type) {
    var _a;
    if (!this.types || this.typesRevision !== this.revision) {
      const grouped = /* @__PURE__ */ new Map();
      for (const file of this.allNotes()) {
        for (const value of toStringList(this.fieldOf(file, "type"))) {
          const bucket = grouped.get(value);
          if (bucket) bucket.push(file);
          else grouped.set(value, [file]);
        }
      }
      this.types = grouped;
      this.typesRevision = this.revision;
    }
    return (_a = this.types.get(type)) != null ? _a : [];
  }
  /**
   * 链到指定文件的全部笔记。
   *
   * 用一次全库遍历建反向表而不是逐个正查：一张名录有上百个人，
   * 逐个去 resolvedLinks 里正查是「人数 × 全库」，建一次表是「全库」，
   * 而这张表在同一次渲染里被所有视图共用。
   */
  backlinksOf(file) {
    var _a;
    if (!this.backlinks || this.backlinksRevision !== this.revision) {
      const map = /* @__PURE__ */ new Map();
      const resolved = this.app.metadataCache.resolvedLinks;
      for (const sourcePath of Object.keys(resolved)) {
        if (isSystemPath(sourcePath)) continue;
        const source = this.app.vault.getAbstractFileByPath(sourcePath);
        if (!(source instanceof import_obsidian2.TFile)) continue;
        for (const targetPath of Object.keys(resolved[sourcePath])) {
          const bucket = map.get(targetPath);
          if (bucket) bucket.push(source);
          else map.set(targetPath, [source]);
        }
      }
      this.backlinks = map;
      this.backlinksRevision = this.revision;
    }
    return (_a = this.backlinks.get(file.path)) != null ? _a : [];
  }
  /**
   * 把一段 wikilink 原文解析成它真正指向的文件。
   *
   * 这是全库唯一允许的链接比对方式。`[[张三]]`、`[[张三|老张]]`、`[[02-areas/人脉/张三]]`、
   * `[[张三#约定]]` 指向同一篇笔记，任何基于文件名的字符串匹配都会在其中某一种上失手——
   * 而失手的表现是视图静默少一行，不报错、不留痕。
   */
  resolve(linktext, sourcePath) {
    const path = linktext.split("#")[0].replace(/\\$/, "").trim();
    if (!path) return null;
    return this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
  }
  /**
   * 读出一篇笔记的全部列表行。
   *
   * metadataCache 的 listItems 只给位置与复选框，不给文本，所以必须回磁盘取一次原文。
   * 调用方永远只对「反链指向我的那几篇日记」调它，不扫全库——
   * 一份人情账本要读的通常是几十篇日记，不是几千篇笔记。
   */
  async listLinesOf(file) {
    var _a, _b;
    const cached = this.listCache.get(file.path);
    if (cached && cached.mtime === file.stat.mtime) return cached.lines;
    const items = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.listItems) != null ? _b : [];
    const lines = items.length ? parseListLines(await this.app.vault.cachedRead(file), items) : [];
    this.listCache.set(file.path, { mtime: file.stat.mtime, lines });
    return lines;
  }
};
function parseListLines(content, items) {
  var _a;
  const parsed = [];
  for (const item of items) {
    const raw = content.slice(item.position.start.offset, item.position.end.offset);
    const marker = LIST_MARKER.exec(raw);
    const text3 = raw.slice((_a = marker == null ? void 0 : marker[0].length) != null ? _a : 0).replace(/\s*\n\s*/g, " ").trim();
    const box = typeof item.task === "string" ? item.task : marker == null ? void 0 : marker[1];
    parsed.push({
      text: text3,
      isTask: typeof box === "string",
      checked: typeof box === "string" && box.trim().toLowerCase() === "x",
      links: extractLinks(text3),
      line: item.position.start.line
    });
  }
  return parsed;
}
function extractLinks(text3) {
  const links = [];
  WIKILINK2.lastIndex = 0;
  let match = WIKILINK2.exec(text3);
  while (match) {
    const linktext = match[1].split("|")[0].replace(/\\$/, "").trim();
    if (linktext) links.push(linktext);
    match = WIKILINK2.exec(text3);
  }
  return links;
}
function toStringList(value) {
  if (value === null || value === void 0) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item != null ? item : "").trim()).filter((item) => item.length > 0);
  }
  const text3 = String(value).trim();
  return text3 ? [text3] : [];
}
function toText(value) {
  if (value === null || value === void 0) return "";
  return String(value).trim();
}
function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const text3 = toText(value).toLowerCase();
  return text3 === "true" || text3 === "yes" || text3 === "\u662F";
}

// src/core/codeblock.ts
function registerViewCodeBlock(ctx, views) {
  const host = new ViewHost(ctx, views);
  ctx.plugin.registerEvent(ctx.app.metadataCache.on("changed", () => host.notifyChanged()));
  ctx.plugin.registerEvent(ctx.app.vault.on("delete", () => host.notifyChanged()));
  ctx.plugin.registerEvent(ctx.app.vault.on("rename", () => host.notifyChanged()));
  ctx.plugin.register(() => host.dispose());
  ctx.plugin.registerMarkdownCodeBlockProcessor(
    VIEW_BLOCK_LANG,
    (source, el, blockCtx) => {
      blockCtx.addChild(new ViewBlock(el, host, parseBlock(source), blockCtx.sourcePath));
    }
  );
}
var ViewHost = class {
  constructor(ctx, views) {
    this.blocks = /* @__PURE__ */ new Set();
    this.timer = null;
    this.ctx = ctx;
    this.index = new VaultIndex(ctx.app);
    this.registry = new Map(views.map((view) => [view.name, view]));
    this.names = views.map((view) => view.name);
  }
  contextFor(el, sourcePath, params) {
    const found = this.ctx.app.vault.getAbstractFileByPath(sourcePath);
    return {
      el,
      sourcePath,
      host: found instanceof import_obsidian3.TFile ? found : null,
      params,
      index: this.index,
      ctx: this.ctx
    };
  }
  attach(block) {
    this.blocks.add(block);
  }
  detach(block) {
    this.blocks.delete(block);
  }
  /**
   * 内容变了。
   * 事件回调本身必须是 O(1)——它在每一次击键的落盘上都会被叫到，
   * 因此这里只递增修订号并排一次防抖，真正的重建推迟到有人来问的时候。
   */
  notifyChanged() {
    this.index.invalidate();
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      for (const block of this.blocks) void block.render();
    }, VIEW_REFRESH_DEBOUNCE_MS);
  }
  dispose() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.blocks.clear();
  }
};
var ViewBlock = class extends import_obsidian3.MarkdownRenderChild {
  constructor(el, host, request, sourcePath) {
    super(el);
    /** 每次重画递增；异步返回时只有最新一代有权提交 DOM */
    this.renderGeneration = 0;
    /** 卸载后的异步结果必须丢弃，不能再碰已经离场的容器 */
    this.loaded = false;
    this.host = host;
    this.request = request;
    this.sourcePath = sourcePath;
  }
  onload() {
    this.loaded = true;
    this.host.attach(this);
    void this.render();
  }
  onunload() {
    this.loaded = false;
    this.renderGeneration += 1;
    this.host.detach(this);
  }
  /**
   * 重画一次。
   * 三条兜底缺一不可：块里没写名字、名字不认识、视图自己抛错——
   * 任何一种都必须画出一句中文说明，绝不能留一个空白块让学员以为系统坏了。
   */
  async render() {
    const generation = ++this.renderGeneration;
    const output = document.createElement("div");
    if (!this.request.name) {
      renderEmpty(output, "\u8FD9\u4E2A ziminos \u4EE3\u7801\u5757\u6CA1\u5199\u89C6\u56FE\u540D\u3002\u7B2C\u4E00\u884C\u5199\u89C6\u56FE\u540D\u5373\u53EF\uFF0C\u4F8B\u5982\u300C\u4EBA\u8109\u540D\u5F55\u300D\u3002");
      this.commit(output, generation);
      return;
    }
    const definition = this.host.registry.get(this.request.name);
    if (!definition) {
      renderEmpty(output, `\u6CA1\u6709\u540D\u4E3A\u300C${this.request.name}\u300D\u7684\u89C6\u56FE\u3002`);
      renderNote(output, `\u53EF\u7528\u89C6\u56FE\uFF1A${this.host.names.join(" \xB7 ")}`);
      this.commit(output, generation);
      return;
    }
    try {
      await definition.render(
        this.host.contextFor(output, this.sourcePath, this.request.params)
      );
      this.commit(output, generation);
    } catch (error) {
      if (!this.loaded || generation !== this.renderGeneration) return;
      const message2 = error instanceof Error ? error.message : String(error);
      output.empty();
      renderEmpty(output, `\u89C6\u56FE\u300C${this.request.name}\u300D\u6E32\u67D3\u5931\u8D25\uFF1A${message2}`);
      this.commit(output, generation);
    }
  }
  /** 将离屏结果一次性换上去；旧代与卸载后的结果在这里无声作废 */
  commit(output, generation) {
    if (!this.loaded || generation !== this.renderGeneration) return;
    this.containerEl.empty();
    while (output.firstChild) this.containerEl.appendChild(output.firstChild);
  }
};
function parseBlock(source) {
  var _a;
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  const params = {};
  for (const line of lines.slice(1)) {
    const separator = line.search(/[:：]/);
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) params[key] = value;
  }
  return { name: (_a = lines[0]) != null ? _a : "", params };
}

// src/core/commands.ts
var COMMAND_GROUPS = {
  setup: "\u5F00\u8352",
  projects: "\u9879\u76EE",
  books: "\u8BFB\u4E66",
  inspiration: "\u7075\u611F",
  review: "\u590D\u76D8",
  contacts: "\u4EBA\u8109",
  clients: "\u5BA2\u6237",
  appearance: "\u5916\u89C2",
  format: "\u6392\u7248",
  explorer: "\u6587\u4EF6",
  legacy: "\u65E7\u7248"
};
var GROUP_COLORS = {
  [COMMAND_GROUPS.setup]: "#A8763E",
  // 开荒＝垦土，泥土棕
  [COMMAND_GROUPS.projects]: "#4C8DD6",
  // 项目＝蓝图，工程蓝
  [COMMAND_GROUPS.books]: "#C15449",
  // 读书＝批注用朱笔，朱批红
  [COMMAND_GROUPS.inspiration]: "#E3A93C",
  // 灵感＝灯泡，琥珀黄
  [COMMAND_GROUPS.review]: "#9A6BD6",
  // 复盘＝沉思，紫
  [COMMAND_GROUPS.contacts]: "#E06C8A",
  // 人脉＝心，玫红
  [COMMAND_GROUPS.clients]: "#43A868",
  // 客户＝生意与钱，绿
  [COMMAND_GROUPS.appearance]: "#E07B39",
  // 外观＝调色盘，橙
  [COMMAND_GROUPS.format]: "#3BAFBF",
  // 排版＝整洁，青
  [COMMAND_GROUPS.explorer]: "#5A6ACF",
  // 文件＝找路，罗盘针的靛蓝
  // 旧版这三条做的是 Obsidian 自己的事，不属于 ziminOS 的任何一摊。
  // 中性灰是这句话的视觉说法：在那一列彩色图标里，它们一眼就看得出是外来的
  [COMMAND_GROUPS.legacy]: "#7A8290"
};
var COMMAND_ICONS = {
  vault: "ziminos-vault",
  project: "ziminos-project",
  area: "ziminos-area",
  card: "ziminos-card",
  done: "ziminos-done",
  paused: "ziminos-paused",
  dropped: "ziminos-dropped",
  active: "ziminos-active",
  book: "ziminos-book",
  readBook: "ziminos-read-book",
  weread: "ziminos-weread",
  syncHighlights: "ziminos-sync-highlights",
  highlights: "ziminos-highlights",
  excerpt: "ziminos-excerpt",
  inspiration: "ziminos-inspiration",
  calendar: "ziminos-calendar",
  daily: "ziminos-daily",
  weekly: "ziminos-weekly",
  monthly: "ziminos-monthly",
  quarterly: "ziminos-quarterly",
  yearly: "ziminos-yearly",
  theme: "ziminos-theme",
  contact: "ziminos-contact",
  favor: "ziminos-favor",
  clients: "ziminos-clients",
  client: "ziminos-client",
  payment: "ziminos-payment",
  receipt: "ziminos-receipt",
  appearance: "ziminos-appearance",
  format: "ziminos-format",
  /**
   * 不属于任何命令的两枚：设置页「边栏」与「文件」两张标签页的图标。
   * 这两个模块管的都是屏幕上的一块地方而不是一件可执行的事，
   * 没有哪条命令天然长它们的样子，图形与其余三十个同住 icons.ts，同一套画法。
   *
   * 两枚都画那块地方本身而不画它的功能：边栏是「一块带左栏的面板」，
   * 文件浏览器是「一个文件夹」。文件夹上刻意不加数字或角标——
   * 标签页的身份是「文件浏览器的设置在这儿」，而计数只是它眼下唯一那件事，
   * 把当期功能画进图标里，下一件功能进来时这枚图标就开始撒谎。
   */
  recent: "ziminos-recent",
  filePath: "ziminos-file-path",
  vaultSwitch: "ziminos-vault-switch",
  help: "ziminos-help",
  appSettings: "ziminos-app-settings",
  dock: "ziminos-dock",
  explorer: "ziminos-explorer",
  editing: "ziminos-editing"
};
var INIT_VAULT_COMMAND = {
  id: "init-vault",
  name: "\u521D\u59CB\u5316\u7B14\u8BB0\u5E93",
  icon: COMMAND_ICONS.vault,
  group: COMMAND_GROUPS.setup
};
var PROJECT_COMMANDS = {
  create: {
    id: "create-project",
    name: "\u65B0\u5EFA\u9879\u76EE",
    icon: COMMAND_ICONS.project,
    group: COMMAND_GROUPS.projects
  },
  /**
   * 新建领域。它与新建项目共用一条流程，差别只有三处（目录、type、不问归属），
   * 因此也归项目组——PARA 里「项目」与「领域」是同一个问题的两个答案：这件事有没有终点。
   */
  area: {
    id: "create-area",
    name: "\u65B0\u5EFA\u9886\u57DF",
    icon: COMMAND_ICONS.area,
    group: COMMAND_GROUPS.projects
  },
  card: {
    id: "init-card",
    name: "\u521D\u59CB\u5316\u5F53\u524D\u5361\u7247",
    icon: COMMAND_ICONS.card,
    group: COMMAND_GROUPS.projects
  }
};
var TRANSITION_COMMANDS = [
  {
    id: "project-done",
    name: "\u5B8C\u6210\u9879\u76EE",
    icon: COMMAND_ICONS.done,
    group: COMMAND_GROUPS.projects,
    action: "done"
  },
  {
    id: "project-paused",
    name: "\u6682\u505C\u9879\u76EE",
    icon: COMMAND_ICONS.paused,
    group: COMMAND_GROUPS.projects,
    action: "paused"
  },
  {
    id: "project-dropped",
    name: "\u653E\u5F03\u9879\u76EE",
    icon: COMMAND_ICONS.dropped,
    group: COMMAND_GROUPS.projects,
    action: "dropped"
  },
  {
    id: "project-active",
    name: "\u91CD\u65B0\u5F00\u59CB\u9879\u76EE",
    icon: COMMAND_ICONS.active,
    group: COMMAND_GROUPS.projects,
    action: "active"
  }
];
var BOOK_COMMANDS = {
  /**
   * 主干命令：一步读一本书。
   *
   * 它取代的是学员原本的三步（豆瓣插件建档 → 划线插件导出 → 手工复制粘贴汇总）。
   * 排在这一组的第一条，因为它是绝大多数时候唯一该按的那一条；
   * 其余四条都是它覆盖不到的边角：手动建、粘贴导、再同步、炼卡。
   */
  read: {
    id: "read-book",
    name: "\u8BFB\u4E00\u672C\u4E66",
    icon: COMMAND_ICONS.readBook,
    group: COMMAND_GROUPS.books
  },
  /** 读到一半再拉一次划线。与建书共用同一套取数与合并，只是不再建档 */
  sync: {
    id: "sync-book-highlights",
    name: "\u540C\u6B65\u8FD9\u672C\u4E66\u7684\u5212\u7EBF",
    icon: COMMAND_ICONS.syncHighlights,
    group: COMMAND_GROUPS.books
  },
  /** 连微信读书。一辈子按一次，扫码登录后划线才能自动来 */
  connectWeread: {
    id: "connect-weread",
    name: "\u8FDE\u63A5\u5FAE\u4FE1\u8BFB\u4E66",
    icon: COMMAND_ICONS.weread,
    group: COMMAND_GROUPS.books
  },
  create: {
    id: "create-book",
    name: "\u65B0\u5EFA\u8BFB\u4E66\u7B14\u8BB0",
    icon: COMMAND_ICONS.book,
    group: COMMAND_GROUPS.books
  },
  /** 把微信读书 / Kindle / 苹果图书导出的纯文本解析进书的 MOC；零网络，粘贴才动 */
  importNotes: {
    id: "import-book-highlights",
    name: "\u5BFC\u5165\u8BFB\u4E66\u5212\u7EBF",
    icon: COMMAND_ICONS.highlights,
    group: COMMAND_GROUPS.books
  },
  /** 把选中的划线炼成一张十字段卡片，是读书笔记从素材走向知识的那一步 */
  excerpt: {
    id: "excerpt-book-card",
    name: "\u6458\u6210\u5361\u7247",
    icon: COMMAND_ICONS.excerpt,
    group: COMMAND_GROUPS.books
  }
};
var INSPIRATION_COMMAND = {
  id: "capture-inspiration",
  name: "\u8BB0\u5F55\u7075\u611F",
  icon: COMMAND_ICONS.inspiration,
  group: COMMAND_GROUPS.inspiration
};
var OPEN_CALENDAR_COMMAND = {
  id: "open-calendar",
  name: "\u6253\u5F00\u4E2D\u56FD\u65E5\u5386",
  icon: COMMAND_ICONS.calendar,
  group: COMMAND_GROUPS.review
};
var PERIOD_COMMANDS = {
  daily: {
    id: "open-diary",
    name: "\u6253\u5F00\u4ECA\u5929\u7684\u65E5\u8BB0",
    icon: COMMAND_ICONS.daily,
    group: COMMAND_GROUPS.review
  },
  weekly: {
    id: "open-weekly",
    name: "\u6253\u5F00\u672C\u5468\u590D\u76D8",
    icon: COMMAND_ICONS.weekly,
    group: COMMAND_GROUPS.review
  },
  monthly: {
    id: "open-monthly",
    name: "\u6253\u5F00\u672C\u6708\u590D\u76D8",
    icon: COMMAND_ICONS.monthly,
    group: COMMAND_GROUPS.review
  },
  quarterly: {
    id: "open-quarterly",
    name: "\u6253\u5F00\u672C\u5B63\u590D\u76D8",
    icon: COMMAND_ICONS.quarterly,
    group: COMMAND_GROUPS.review
  },
  yearly: {
    id: "open-yearly",
    name: "\u6253\u5F00\u672C\u5E74\u590D\u76D8",
    icon: COMMAND_ICONS.yearly,
    group: COMMAND_GROUPS.review
  }
};
var THEME_COMMAND = {
  id: "write-theme",
  name: "\u5199\u590D\u76D8\u4E3B\u9898",
  icon: COMMAND_ICONS.theme,
  group: COMMAND_GROUPS.review
};
var CONTACT_COMMANDS = {
  create: {
    id: "create-contact",
    name: "\u65B0\u5EFA\u4EBA\u8109",
    icon: COMMAND_ICONS.contact,
    group: COMMAND_GROUPS.contacts
  },
  favor: {
    id: "record-favor",
    name: "\u8BB0\u4EBA\u60C5",
    icon: COMMAND_ICONS.favor,
    group: COMMAND_GROUPS.contacts
  }
};
var CLIENT_COMMANDS = {
  setup: {
    id: "setup-clients",
    name: "\u521D\u59CB\u5316\u5BA2\u6237\u6A21\u5757",
    icon: COMMAND_ICONS.clients,
    group: COMMAND_GROUPS.clients
  },
  create: {
    id: "create-client",
    name: "\u65B0\u5EFA\u5BA2\u6237",
    icon: COMMAND_ICONS.client,
    group: COMMAND_GROUPS.clients
  },
  payment: {
    id: "add-payment",
    name: "\u589E\u52A0\u4ED8\u8D39",
    icon: COMMAND_ICONS.payment,
    group: COMMAND_GROUPS.clients
  },
  receipt: {
    id: "record-receipt",
    name: "\u8BB0\u6536\u6B3E",
    icon: COMMAND_ICONS.receipt,
    group: COMMAND_GROUPS.clients
  }
};
var APPEARANCE_COMMAND = {
  id: "open-appearance-switch",
  name: "\u6253\u5F00\u5916\u89C2\u5F00\u5173",
  icon: COMMAND_ICONS.appearance,
  group: COMMAND_GROUPS.appearance
};
var FORMAT_COMMAND = {
  id: "format-note",
  name: "\u6574\u7406\u5F53\u524D\u7B14\u8BB0\u683C\u5F0F",
  icon: COMMAND_ICONS.format,
  group: COMMAND_GROUPS.format
};
var RECENT_FILES_COMMAND = {
  id: "open-recent-files",
  name: "\u6253\u5F00\u6700\u8FD1\u6587\u4EF6",
  icon: COMMAND_ICONS.recent,
  group: COMMAND_GROUPS.explorer
};
var COPY_PATH_COMMAND = {
  id: "copy-file-path",
  name: "\u590D\u5236\u5F53\u524D\u7B14\u8BB0\u8DEF\u5F84",
  icon: COMMAND_ICONS.filePath,
  group: COMMAND_GROUPS.explorer
};
var LEGACY_COMMANDS = {
  vault: {
    id: "open-vault-chooser",
    name: "\u5207\u6362\u7B14\u8BB0\u5E93",
    icon: COMMAND_ICONS.vaultSwitch,
    group: COMMAND_GROUPS.legacy
  },
  help: {
    id: "open-obsidian-help",
    name: "\u6253\u5F00\u5E2E\u52A9",
    icon: COMMAND_ICONS.help,
    group: COMMAND_GROUPS.legacy
  },
  settings: {
    id: "open-obsidian-settings",
    name: "\u6253\u5F00\u8BBE\u7F6E",
    icon: COMMAND_ICONS.appSettings,
    group: COMMAND_GROUPS.legacy
  }
};
var DEFAULT_RIBBON_COMMANDS = [
  PROJECT_COMMANDS.create.id,
  INSPIRATION_COMMAND.id,
  PERIOD_COMMANDS.daily.id,
  THEME_COMMAND.id,
  CONTACT_COMMANDS.create.id,
  CONTACT_COMMANDS.favor.id,
  APPEARANCE_COMMAND.id,
  // 旧版那三个默认就摆出来：它们存在的全部理由就是「回到 ribbon 上」，
  // 一个需要先去设置页勾选才回来的按钮，等于没有回来。
  // 顺序归用户——摆出来之后拖到哪儿由 Obsidian 自己记
  LEGACY_COMMANDS.vault.id,
  LEGACY_COMMANDS.help.id,
  LEGACY_COMMANDS.settings.id
];
function normalizeRibbonCommands(value) {
  if (!Array.isArray(value)) return DEFAULT_RIBBON_COMMANDS;
  return value.filter((item) => typeof item === "string");
}
var CommandRegistry = class {
  constructor(plugin) {
    this.entries = [];
    this.plugin = plugin;
  }
  /**
   * 注册一条命令。
   *
   * 一律用 callback 而非 checkCallback：命令必须在任何情况下都可见可点，
   * 用户在错误的笔记上执行时该得到一句「为什么不行」，而不是眼看着命令凭空消失。
   * 这条纪律同样适用于侧边栏——一个会自己隐身的图标比一句提示更让人困惑。
   */
  register(spec, run2) {
    this.plugin.addCommand({
      id: spec.id,
      name: spec.name,
      icon: spec.icon,
      callback: run2
    });
    this.entries.push({ spec, run: run2 });
  }
  /** 花名册，顺序即注册顺序。交出只读视图，谁都别想往里塞一条没注册过的命令 */
  list() {
    return this.entries;
  }
};

// src/core/edition.ts
var EDITION_FILE_NAME = "edition.json";
var FREE_EDITION = {
  edition: "free",
  role: null,
  layout: null
};
var VAULT_ROLES = ["capture", "human", "eternal"];
function editionPath(app) {
  return `${app.vault.configDir}/plugins/ziminos/${EDITION_FILE_NAME}`;
}
async function readEdition(app) {
  const path = editionPath(app);
  try {
    if (!await app.vault.adapter.exists(path)) return FREE_EDITION;
    const parsed = JSON.parse(await app.vault.adapter.read(path));
    return interpret(parsed);
  } catch (e) {
    return FREE_EDITION;
  }
}
function interpret(parsed) {
  var _a;
  if (typeof parsed !== "object" || parsed === null) return FREE_EDITION;
  const raw = parsed;
  if (raw.edition !== "pro") return FREE_EDITION;
  const role = (_a = VAULT_ROLES.find((candidate) => candidate === raw.role)) != null ? _a : null;
  const layout = interpretLayout(raw.vaults);
  if (role === null || layout === null) return FREE_EDITION;
  return { edition: "pro", role, layout };
}
function interpretLayout(value) {
  if (typeof value !== "object" || value === null) return null;
  const raw = value;
  const capture = folderName(raw.capture);
  const human = folderName(raw.human);
  const eternal = folderName(raw.eternal);
  if (capture === null || human === null || eternal === null) return null;
  return { capture, human, eternal };
}
function folderName(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.includes("/") || trimmed.includes("\\")) return null;
  return trimmed;
}

// src/core/guard.ts
var SelfWriteGuard = class {
  constructor() {
    /** 路径 → 插件最近一次写入该路径的时间戳（毫秒） */
    this.marks = /* @__PURE__ */ new Map();
  }
  /** 插件写入任一文件之前调用，声明「接下来这个路径的变化是我干的」 */
  mark(path) {
    this.marks.set(path, Date.now());
  }
  /**
   * 判断某路径是否仍处于自写窗口内。
   * 遍历时顺手清掉所有过期登记：读多写少的场景下，这比另起定时器清理更简单，
   * 也符合「无定时器、无后台轮询」的红线。
   */
  isRecent(path, windowMs = SELF_WRITE_WINDOW_MS) {
    const now = Date.now();
    let recent = false;
    for (const [markedPath, markedAt] of this.marks) {
      if (now - markedAt > windowMs) {
        this.marks.delete(markedPath);
        continue;
      }
      if (markedPath === path) recent = true;
    }
    return recent;
  }
};

// src/core/lineEndings.ts
function lineEndingOf(content) {
  var _a;
  const matched = (_a = content.match(/\r\n|\n|\r/)) == null ? void 0 : _a[0];
  return matched === "\r\n" || matched === "\r" ? matched : "\n";
}
function splitTextLines(content) {
  return {
    lines: content.split(/\r\n|\n|\r/),
    lineEnding: lineEndingOf(content)
  };
}
function joinTextLines(lines, lineEnding) {
  return lines.join(lineEnding);
}

// src/core/markdownStyle.ts
var FORMAT_RULES = [
  {
    key: "cjk-space",
    name: "\u4E2D\u82F1\u6587\u4E4B\u95F4\u52A0\u7A7A\u683C",
    desc: "\u6C49\u5B57\u4E0E\u82F1\u6587\u3001\u6570\u5B57\u76F8\u90BB\u65F6\u8865\u4E00\u4E2A\u7A7A\u683C\uFF0C\u300C\u4F7F\u7528Dataview\u67E5\u8BE2\u300D\u5199\u6210\u300C\u4F7F\u7528 Dataview \u67E5\u8BE2\u300D\u3002\u6587\u4EF6\u540D\u3001[[\u53CC\u94FE]]\u3001\u884C\u5185\u4EE3\u7801\u3001\u7F51\u5740\u4E0E #\u6807\u7B7E \u4E00\u5F8B\u6574\u6BB5\u8DF3\u8FC7\u2014\u2014\u90A3\u91CC\u9762\u52A0\u7A7A\u683C\u4F1A\u5F53\u573A\u65AD\u94FE\u3002"
  },
  {
    key: "heading-blank",
    name: "\u6807\u9898\u4E0A\u4E0B\u7559\u7A7A\u884C",
    desc: "\u6BCF\u4E2A # \u6807\u9898\u4E0E\u5B83\u524D\u540E\u7684\u5185\u5BB9\u4E4B\u95F4\u5404\u7A7A\u4E00\u884C\u3002\u6807\u9898\u8FDE\u7740\u6B63\u6587\u65F6\uFF0C\u5F88\u591A Markdown \u6E32\u67D3\u5668\u4F1A\u628A\u6807\u9898\u8BFB\u6210\u666E\u901A\u6BB5\u843D\u3002"
  },
  {
    key: "list-blank",
    name: "\u5217\u8868\u4E0A\u4E0B\u7559\u7A7A\u884C",
    desc: "\u5217\u8868\u4E0E\u524D\u540E\u7684\u6BB5\u843D\u4E4B\u95F4\u5404\u7A7A\u4E00\u884C\uFF0C\u5217\u8868\u5185\u90E8\u4E0D\u52A8\u3002\u7D27\u8D34\u6B63\u6587\u7684\u5217\u8868\u5728\u6807\u51C6 Markdown \u91CC\u6839\u672C\u4E0D\u4F1A\u88AB\u6E32\u67D3\u6210\u5217\u8868\u3002"
  },
  {
    key: "table-blank",
    name: "\u8868\u683C\u4E0A\u4E0B\u7559\u7A7A\u884C",
    desc: "\u8868\u683C\u4E0E\u524D\u540E\u7684\u5185\u5BB9\u4E4B\u95F4\u5404\u7A7A\u4E00\u884C\uFF0C\u8868\u683C\u5185\u90E8\u4E0D\u52A8\u3002"
  },
  {
    key: "code-blank",
    name: "\u4EE3\u7801\u5757\u4E0A\u4E0B\u7559\u7A7A\u884C",
    desc: "``` \u56F4\u8D77\u6765\u7684\u5757\u4E0E\u524D\u540E\u5185\u5BB9\u4E4B\u95F4\u5404\u7A7A\u4E00\u884C\uFF0C\u5757\u91CC\u9762\u4E00\u4E2A\u5B57\u90FD\u4E0D\u52A8\u3002\u89C6\u56FE\u4EE3\u7801\u5757\u4E5F\u8D70\u8FD9\u4E00\u6761\u3002"
  },
  {
    key: "yaml-blank",
    name: "YAML \u4E0E\u6B63\u6587\u4E4B\u95F4\u7559\u7A7A\u884C",
    desc: "\u6587\u4EF6\u9876\u90E8\u7684\u5C5E\u6027\u533A\u6536\u5C3E\u4E4B\u540E\u7A7A\u4E00\u884C\u518D\u5199\u6B63\u6587\u3002\u5C5E\u6027\u533A\u91CC\u9762\u4E00\u4E2A\u5B57\u90FD\u4E0D\u52A8\u2014\u2014\u90A3\u91CC\u5B58\u7684\u662F\u4E8B\u5B9E\uFF0C\u4E0D\u662F\u6392\u7248\u3002"
  },
  {
    key: "blank-collapse",
    name: "\u8FDE\u7EED\u7A7A\u884C\u6536\u6210\u4E00\u884C",
    desc: "\u4E24\u884C\u4EE5\u4E0A\u7684\u8FDE\u7EED\u7A7A\u884C\u538B\u6210\u4E00\u884C\u3002\u5220\u6389\u4E00\u6BB5\u8BDD\u4E4B\u540E\u6700\u5BB9\u6613\u7559\u4E0B\u8FD9\u79CD\u7A7A\u6D1E\u3002"
  },
  {
    key: "trailing-space",
    name: "\u53BB\u6389\u884C\u5C3E\u7A7A\u683C",
    desc: "\u6BCF\u884C\u672B\u5C3E\u591A\u4F59\u7684\u7A7A\u683C\u4E0E\u5236\u8868\u7B26\u53BB\u6389\u3002\u4EE3\u4EF7\u8BF4\u5728\u524D\u9762\uFF1A\u7528\u4E24\u4E2A\u884C\u5C3E\u7A7A\u683C\u505A\u786C\u6362\u884C\u7684\u5199\u6CD5\u4F1A\u4E00\u5E76\u88AB\u53BB\u6389\u3002"
  },
  {
    key: "final-newline",
    name: "\u6587\u672B\u53EA\u7559\u4E00\u4E2A\u6362\u884C",
    desc: "\u6587\u4EF6\u7ED3\u5C3E\u6070\u597D\u4E00\u4E2A\u6362\u884C\u7B26\uFF0C\u4E0D\u591A\u4E0D\u5C11\u3002\u5B83\u4E0D\u5F71\u54CD\u9605\u8BFB\uFF0C\u4F46\u80FD\u8BA9\u6BCF\u6B21 Git \u5DEE\u5F02\u53EA\u663E\u793A\u4F60\u771F\u6B63\u6539\u8FC7\u7684\u90A3\u51E0\u884C\u3002"
  }
];
var DEFAULT_FORMAT_RULES = FORMAT_RULES.map((rule) => rule.key);
function normalizeFormatRules(value) {
  if (!Array.isArray(value)) return DEFAULT_FORMAT_RULES;
  return value.filter((item) => typeof item === "string");
}
var CJK = "\\u4e00-\\u9fff\\u3400-\\u4dbf\\u3040-\\u30ff\\uf900-\\ufaff";
var LATIN = "A-Za-z0-9";
var CJK_THEN_LATIN = new RegExp(`([${CJK}])([${LATIN}])`, "g");
var LATIN_THEN_CJK = new RegExp(`([${LATIN}])([${CJK}])`, "g");
var PROTECTED = new RegExp(
  [
    "`[^`]*`",
    // 行内代码
    "\\[\\[[^\\]]*\\]\\]",
    // 双链，连别名一起保护
    "\\[[^\\]]*\\]\\([^)]*\\)",
    // Markdown 链接，连显示文字一起保护
    "https?://\\S+",
    // 裸网址
    "<[^>]+>",
    // HTML 标签
    "#[^\\s#]+"
    // 标签。`## ` 这类标题不会命中：# 后面必须紧跟非空白非 # 字符
  ].join("|"),
  "g"
);
function addCjkSpaces(line) {
  let result = "";
  let cursor = 0;
  let match;
  PROTECTED.lastIndex = 0;
  while ((match = PROTECTED.exec(line)) !== null) {
    result = join(result, spacePlainText(line.slice(cursor, match.index)));
    result = join(result, match[0]);
    cursor = match.index + match[0].length;
  }
  return join(result, spacePlainText(line.slice(cursor)));
}
function spacePlainText(text3) {
  return text3.replace(CJK_THEN_LATIN, "$1 $2").replace(LATIN_THEN_CJK, "$1 $2");
}
var IS_CJK = new RegExp(`[${CJK}]`);
var IS_ASCII_GRAPH = /[!-~]/;
function join(left, right) {
  if (!left || !right) return left + right;
  const tail = left.charAt(left.length - 1);
  const head = right.charAt(0);
  const gap = IS_CJK.test(tail) && IS_ASCII_GRAPH.test(head) || IS_ASCII_GRAPH.test(tail) && IS_CJK.test(head);
  return gap ? `${left} ${right}` : left + right;
}
var FENCE = /^\s*(?:```|~~~)/;
var HEADING = /^#{1,6}\s/;
var LIST = /^\s*(?:[-*+]|\d+[.)])\s/;
var TABLE = /^\s*\|/;
var INDENTED = /^\s{2,}\S/;
function classifyLines(lines) {
  const kinds = [];
  let inCode = false;
  let inList = false;
  for (const line of lines) {
    if (FENCE.test(line)) {
      kinds.push("code");
      inCode = !inCode;
      inList = false;
      continue;
    }
    if (inCode) {
      kinds.push("code");
      continue;
    }
    if (line.trim() === "") {
      kinds.push("blank");
      continue;
    }
    if (HEADING.test(line)) {
      kinds.push("heading");
      inList = false;
      continue;
    }
    if (LIST.test(line)) {
      kinds.push("list");
      inList = true;
      continue;
    }
    if (TABLE.test(line)) {
      kinds.push("table");
      inList = false;
      continue;
    }
    if (inList && INDENTED.test(line)) {
      kinds.push("list");
      continue;
    }
    kinds.push("text");
    inList = false;
  }
  return kinds;
}
var ISOLATING_RULE = {
  heading: "heading-blank",
  list: "list-blank",
  table: "table-blank",
  code: "code-blank"
};
function formatMarkdown(content, enabled) {
  const on = new Set(enabled);
  if (on.size === 0) return content;
  const lineEnding = lineEndingOf(content);
  const normalized = content.replace(/\r\n|\r/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const lines = body.split("\n");
  const kinds = classifyLines(lines);
  const out = [];
  let previousKind = "blank";
  for (let index = 0; index < lines.length; index += 1) {
    const kind = kinds[index];
    let line = lines[index];
    if (on.has("trailing-space")) line = line.replace(/[ \t]+$/, "");
    if (on.has("cjk-space") && kind !== "code") line = addCjkSpaces(line);
    if (kind === "blank") {
      if (on.has("blank-collapse") && (out.length === 0 || out[out.length - 1] === "")) {
        continue;
      }
      out.push(line);
      continue;
    }
    if (needsBlankBetween(previousKind, kind, on) && out.length > 0 && out[out.length - 1] !== "") {
      out.push("");
    }
    out.push(line);
    previousKind = kind;
  }
  const formatted = assemble(frontmatter, out.join("\n"), on);
  return lineEnding === "\n" ? formatted : formatted.replace(/\n/g, lineEnding);
}
function needsBlankBetween(before, after, on) {
  if (before === after && after !== "heading") return false;
  const rules = [ISOLATING_RULE[before], ISOLATING_RULE[after]];
  return rules.some((rule) => rule !== void 0 && on.has(rule));
}
function splitFrontmatter(content) {
  if (content.indexOf("---\n") !== 0) return { frontmatter: "", body: content };
  const lines = content.split("\n");
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() !== "---") continue;
    return {
      frontmatter: lines.slice(0, index + 1).join("\n"),
      body: lines.slice(index + 1).join("\n")
    };
  }
  return { frontmatter: "", body: content };
}
function assemble(frontmatter, body, on) {
  let text3 = body;
  if (frontmatter) {
    text3 = on.has("yaml-blank") ? `${frontmatter}

${text3.replace(/^\n+/, "")}` : `${frontmatter}
${text3}`;
  }
  if (on.has("final-newline")) text3 = `${text3.replace(/\s*$/, "")}
`;
  return text3;
}

// src/core/types.ts
var DEFAULT_SETTINGS = {
  autoCardInit: true,
  autoUpdated: true,
  projectFolder: FOLDERS.projects,
  areaFolder: FOLDERS.areas,
  archiveFolder: FOLDERS.archives,
  dateTimeFormat: DEFAULT_DATETIME_FORMAT,
  inspirationFolder: INSPIRATION_DEFAULTS.folder,
  inspirationFileName: INSPIRATION_DEFAULTS.fileName,
  inspirationHeading: INSPIRATION_DEFAULTS.heading,
  inspirationInsertPosition: INSPIRATION_DEFAULTS.insertPosition,
  inspirationFormat: INSPIRATION_DEFAULTS.format,
  diaryFolder: FOLDERS.diary,
  contactFolder: CONTACT_FOLDER,
  clientFolder: CLIENT_FOLDER,
  clientSources: "B\u7AD9,\u6296\u97F3,\u5C0F\u7EA2\u4E66,\u516C\u4F17\u53F7,\u670B\u53CB\u4ECB\u7ECD,\u5176\u4ED6",
  clientProducts: "\u8BFE\u7A0B,\u54A8\u8BE2,\u966A\u8DD1",
  showAppearanceSwitch: true,
  ribbonCommands: DEFAULT_RIBBON_COMMANDS,
  autoFormat: true,
  formatRules: DEFAULT_FORMAT_RULES,
  bookTagPrefix: BOOK_TAG_DEFAULTS.prefix,
  bookTagCount: BOOK_TAG_DEFAULTS.count,
  wereadCookie: "",
  showFolderCount: true,
  folderCountTarget: FOLDER_COUNT_DEFAULTS.target,
  folderCountRecursive: FOLDER_COUNT_DEFAULTS.recursive,
  showFilePath: true,
  recentFilesLimit: RECENT_FILES_DEFAULTS.limit,
  recentFilesSort: RECENT_FILES_DEFAULTS.sort,
  pasteLinkEnabled: true,
  rememberCursor: true,
  initializedAt: ""
};
function normalizeSettings(input) {
  const stored = isRecord(input) ? input : {};
  const stringValue = (key) => typeof stored[key] === "string" ? stored[key] : String(DEFAULT_SETTINGS[key]);
  const booleanValue = (key) => typeof stored[key] === "boolean" ? stored[key] : Boolean(DEFAULT_SETTINGS[key]);
  const insertPosition = isInspirationInsertPosition(stored.inspirationInsertPosition) ? stored.inspirationInsertPosition : DEFAULT_SETTINGS.inspirationInsertPosition;
  const bookTagCount = isBookTagCount(stored.bookTagCount) ? stored.bookTagCount : DEFAULT_SETTINGS.bookTagCount;
  const folderCountTarget = isFolderCountTarget(stored.folderCountTarget) ? stored.folderCountTarget : DEFAULT_SETTINGS.folderCountTarget;
  const recentFilesSort = isRecentFilesSort(stored.recentFilesSort) ? stored.recentFilesSort : DEFAULT_SETTINGS.recentFilesSort;
  const recentFilesLimit = isRecentFilesLimit(stored.recentFilesLimit) ? stored.recentFilesLimit : DEFAULT_SETTINGS.recentFilesLimit;
  return {
    autoCardInit: booleanValue("autoCardInit"),
    autoUpdated: booleanValue("autoUpdated"),
    projectFolder: stringValue("projectFolder"),
    areaFolder: stringValue("areaFolder"),
    archiveFolder: stringValue("archiveFolder"),
    dateTimeFormat: stringValue("dateTimeFormat"),
    inspirationFolder: stringValue("inspirationFolder"),
    inspirationFileName: stringValue("inspirationFileName"),
    inspirationHeading: stringValue("inspirationHeading"),
    inspirationInsertPosition: insertPosition,
    inspirationFormat: currentInspirationFormat(stringValue("inspirationFormat")),
    diaryFolder: stringValue("diaryFolder"),
    contactFolder: stringValue("contactFolder"),
    clientFolder: stringValue("clientFolder"),
    clientSources: stringValue("clientSources"),
    clientProducts: stringValue("clientProducts"),
    showAppearanceSwitch: booleanValue("showAppearanceSwitch"),
    ribbonCommands: normalizeRibbonCommands(stored.ribbonCommands),
    autoFormat: booleanValue("autoFormat"),
    formatRules: normalizeFormatRules(stored.formatRules),
    bookTagPrefix: stringValue("bookTagPrefix"),
    bookTagCount,
    wereadCookie: stringValue("wereadCookie"),
    showFolderCount: booleanValue("showFolderCount"),
    folderCountTarget,
    folderCountRecursive: booleanValue("folderCountRecursive"),
    showFilePath: booleanValue("showFilePath"),
    recentFilesLimit,
    recentFilesSort,
    pasteLinkEnabled: booleanValue("pasteLinkEnabled"),
    rememberCursor: booleanValue("rememberCursor"),
    initializedAt: stringValue("initializedAt")
  };
}
function currentInspirationFormat(stored) {
  return LEGACY_INSPIRATION_FORMATS.includes(stored) ? INSPIRATION_DEFAULTS.format : stored;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isInspirationInsertPosition(value) {
  return typeof value === "string" && INSPIRATION_INSERT_POSITIONS.some((position) => position === value);
}
function isBookTagCount(value) {
  return typeof value === "number" && BOOK_TAG_COUNTS.includes(value);
}
function isFolderCountTarget(value) {
  return typeof value === "string" && FOLDER_COUNT_TARGETS.some((target) => target === value);
}
function isRecentFilesSort(value) {
  return typeof value === "string" && RECENT_FILES_SORTS.some((sort) => sort === value);
}
function isRecentFilesLimit(value) {
  return typeof value === "number" && RECENT_FILES_LIMITS.includes(value);
}

// src/modules/about/avatar.ts
var AVATAR_DATA_URI = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAoKADAAQAAAABAAAAnwAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+IH2ElDQ19QUk9GSUxFAAEBAAAHyGFwcGwCIAAAbW50clJHQiBYWVogB9kAAgAZAAsAGgALYWNzcEFQUEwAAAAAYXBwbAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1hcHBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALZGVzYwAAAQgAAABvZHNjbQAAAXgAAAWKY3BydAAABwQAAAA4d3RwdAAABzwAAAAUclhZWgAAB1AAAAAUZ1hZWgAAB2QAAAAUYlhZWgAAB3gAAAAUclRSQwAAB4wAAAAOY2hhZAAAB5wAAAAsYlRSQwAAB4wAAAAOZ1RSQwAAB4wAAAAOZGVzYwAAAAAAAAAUR2VuZXJpYyBSR0IgUHJvZmlsZQAAAAAAAAAAAAAAFEdlbmVyaWMgUkdCIFByb2ZpbGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG1sdWMAAAAAAAAAHwAAAAxza1NLAAAAKAAAAYRkYURLAAAAJAAAAaxjYUVTAAAAJAAAAdB2aVZOAAAAJAAAAfRwdEJSAAAAJgAAAhh1a1VBAAAAKgAAAj5mckZVAAAAKAAAAmhodUhVAAAAKAAAApB6aFRXAAAAEgAAArhrb0tSAAAAFgAAAspuYk5PAAAAJgAAAuBjc0NaAAAAIgAAAwZoZUlMAAAAHgAAAyhyb1JPAAAAJAAAA0ZkZURFAAAALAAAA2ppdElUAAAAKAAAA5ZzdlNFAAAAJgAAAuB6aENOAAAAEgAAA75qYUpQAAAAGgAAA9BlbEdSAAAAIgAAA+pwdFBPAAAAJgAABAxubE5MAAAAKAAABDJlc0VTAAAAJgAABAx0aFRIAAAAJAAABFp0clRSAAAAIgAABH5maUZJAAAAKAAABKBockhSAAAAKAAABMhwbFBMAAAALAAABPBydVJVAAAAIgAABRxlblVTAAAAJgAABT5hckVHAAAAJgAABWQAVgFhAGUAbwBiAGUAYwBuAP0AIABSAEcAQgAgAHAAcgBvAGYAaQBsAEcAZQBuAGUAcgBlAGwAIABSAEcAQgAtAHAAcgBvAGYAaQBsAFAAZQByAGYAaQBsACAAUgBHAEIAIABnAGUAbgDoAHIAaQBjAEMepQB1ACAAaADsAG4AaAAgAFIARwBCACAAQwBoAHUAbgBnAFAAZQByAGYAaQBsACAAUgBHAEIAIABHAGUAbgDpAHIAaQBjAG8EFwQwBDMEMAQ7BEwEPQQ4BDkAIAQ/BEAEPgREBDAEOQQ7ACAAUgBHAEIAUAByAG8AZgBpAGwAIABnAOkAbgDpAHIAaQBxAHUAZQAgAFIAVgBCAMEAbAB0AGEAbADhAG4AbwBzACAAUgBHAEIAIABwAHIAbwBmAGkAbJAadSgAUgBHAEKCcl9pY8+P8Md8vBgAIABSAEcAQgAg1QS4XNMMx3wARwBlAG4AZQByAGkAcwBrACAAUgBHAEIALQBwAHIAbwBmAGkAbABPAGIAZQBjAG4A/QAgAFIARwBCACAAcAByAG8AZgBpAGwF5AXoBdUF5AXZBdwAIABSAEcAQgAgBdsF3AXcBdkAUAByAG8AZgBpAGwAIABSAEcAQgAgAGcAZQBuAGUAcgBpAGMAQQBsAGwAZwBlAG0AZQBpAG4AZQBzACAAUgBHAEIALQBQAHIAbwBmAGkAbABQAHIAbwBmAGkAbABvACAAUgBHAEIAIABnAGUAbgBlAHIAaQBjAG9mbpAaAFIARwBCY8+P8GWHTvZOAIIsACAAUgBHAEIAIDDXMO0w1TChMKQw6wOTA7UDvQO5A7oDzAAgA8ADwQO/A8YDrwO7ACAAUgBHAEIAUABlAHIAZgBpAGwAIABSAEcAQgAgAGcAZQBuAOkAcgBpAGMAbwBBAGwAZwBlAG0AZQBlAG4AIABSAEcAQgAtAHAAcgBvAGYAaQBlAGwOQg4bDiMORA4fDiUOTAAgAFIARwBCACAOFw4xDkgOJw5EDhsARwBlAG4AZQBsACAAUgBHAEIAIABQAHIAbwBmAGkAbABpAFkAbABlAGkAbgBlAG4AIABSAEcAQgAtAHAAcgBvAGYAaQBpAGwAaQBHAGUAbgBlAHIAaQENAGsAaQAgAFIARwBCACAAcAByAG8AZgBpAGwAVQBuAGkAdwBlAHIAcwBhAGwAbgB5ACAAcAByAG8AZgBpAGwAIABSAEcAQgQeBDEESQQ4BDkAIAQ/BEAEPgREBDgEOwRMACAAUgBHAEIARwBlAG4AZQByAGkAYwAgAFIARwBCACAAUAByAG8AZgBpAGwAZQZFBkQGQQAgBioGOQYxBkoGQQAgAFIARwBCACAGJwZEBjkGJwZFAAB0ZXh0AAAAAENvcHlyaWdodCAyMDA3IEFwcGxlIEluYy4sIGFsbCByaWdodHMgcmVzZXJ2ZWQuAFhZWiAAAAAAAADzUgABAAAAARbPWFlaIAAAAAAAAHRNAAA97gAAA9BYWVogAAAAAAAAWnUAAKxzAAAXNFhZWiAAAAAAAAAoGgAAFZ8AALg2Y3VydgAAAAAAAAABAc0AAHNmMzIAAAAAAAEMQgAABd7///MmAAAHkgAA/ZH///ui///9owAAA9wAAMBs/8AAEQgAnwCgAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwQDAwMEBQQEBAQFBwUFBQUFBwgHBwcHBwcICAgICAgICAoKCgoKCgsLCwsLDQ0NDQ0NDQ0NDf/bAEMBAgICAwMDBgMDBg0JBwkNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDf/dAAQACv/aAAwDAQACEQMRAD8A/NsLTttTheOaeEzX9NKKPydkAjp4TFWFiNTLFxVKPYVyqEJ4xU6wkiraxdKsrEelaqm+pPMZ4twOelPWI4rRMOOtSJBuGelX7HS5LkjOER7mp1j4rQ8kDqKesPcU/ZE85nmKmeUR2rW8v2pfs5NQ6dg5yjb2wlcg9ACTXQwapc2FrDbxN8qyGUKezYxWb5LRHHQ1CyljzzWNSknozSEtT0CA2+r6O7SqTNG2QuevHOBXT+G9RO6205A+yQGJseuOtU/h/p6z2dyUAaZ2VFJ52r1bivRtH0aOwu1G0GGJ9zsB/ER0B7V4uIspOJ6FJNpMyfEV1P4b025htJwjsMZ/veorz4Nqus6IkdsOfNY7gMY4zXX/ABEvra/u00+FSiR4diR1BHNcFb6uyXgs7dpBCT91P73TjFY04XjzLcucrSsexeH/AA9fTWMctzIAxQKVPQgjB/OoPEPgubWrCXTo4VadWG137DIzg/hWWniaXTZYVnYIOB+8PzEdxj+tP8T/ABQezsjFpqYnmUlZP7oycfyrk5Krl7przQS1P//Q/PARcVMsXarKx8cVMIia/qJU1Y/InNlVY/Wp1j9BVpICOtXEtz6VvGC6kOXcqwQoT+8zj2q4lsP4eT/SrEduc1p21tzVqFjGVboiKPTGuLVXVfmDFR79/wBKpNZSxNh1Ix7V29jEkTDaWIByoH973r0O7TR7nQhcaiybwwQBVG4sB1yK56lSUJJWvc0hHmT1seYaL4cXWYJnVlieBCTno3XB/wAa5025XKnnFdib6RH22g2R7skDjI9PxrPuI1kk3ZCqemcD8K6oRkruWxjKStZHOGHHatS1tFaAqOXJBPsKeIVJwGDD2Oa04pPJt2t9oO4gk98elKcLrQmMrPUzr6PTvJEaA+bnLMOnTp9K557frjOBXUzWsTqNg+fvVNkmjjMZBCt2x1xUeysjT2ruSeF727sNQU27lVOdy9iO/wDKvWvCvjATTTw3+DG7dR6mvGow1vJ5kRxirVjbXlzOsdsdrMTg9BkV5eLwkZ3udtDEuL0PSfGX9lyvJLG4TIyQOp9MV5Fptx9lvspL5YBPzVsavbarEiveo208K/UHHvXMNES3PFctHC2jy3ua1Kt3csXupTS3/wBqY+Yyngn2rOurm4vH3zckDAx6VYEBNV72wvrq1aHT45C8hRPMRCwRWdVLHA7bgPqRUYuvRwdF1anRaefkiqEKlWahHqf/0fkm58JvqIiuPDtvI6NEDJF9543Ucnjs3UVzcumXNs5juYnjYHGGUj+dfode/ADVtK1fTtY8Lq0drIRFMMfMfUt711nxL+CNz4h8LrHDaK1/b/OkkYC79oP3iB1r9+hxPhlOEW7xfXqvU/MZZTW5HLqvxPzIS2OelXUtTjpXVXvh++0q7ezv4HgmjYqVdcHIOKati4OCpFfYwipJST0PAlJp2ZhrbEcAYq5Hat1raWyPpV+OxbpjpXTGmkZSmkYawuOQSKytd13S/Dmnm91y8S2tx03nBYjso6k/StXxbrumeC9BuNe1ZsRxDCRj78sh+6ij1P6V8x+GfA3jX4+eKP7TvopFtN4EEPIiiiz0z0+p6mvjOMeMcPklGzs6j6dF5v8AyPo+HOH8RmtXlgvd/PyRheKfjnrWpSyWXg21MEPIFw67pSB3A6KPrzXAPB8R9ZBuLy8vSFdRlnYAE8g4GAK/Uz4f/sdeG7ORDrzCV4iCiRDA2nOQ575zX09b/A/whaWDWUGj2z2yqFIdclsds1/NWb+JWIxlRynOUvnZfJbH7vlXhm6UPe5Yvz1Z+Axs/HGjv9oiu7xCOSySPxnk9f1r0Dwv8XvGGkTJFrSnUrVeCHXbL16hu/41+2P/AAqnwUoZG0a1MbqFIaMHgjFeLeLv2bPhnqcDvbWC2krZIeA4A9ODXNlfiNVw1TmpuUfndfNHRmHhnKpBq8Zfh+J81+DPEGkeM4PP0WdfOTHmQyEJJGTxyD29xXZ6ppN1BHFBOyybV3Dbg7N3ODj868S8cfB7xD8KJovF/heZrm2gf98oHzqmf4h3Vh+Ve7+Bop/iDY2mo6IpdJ4jLIxORCI/9ZvP+wa/ovhDjfDZxh5TqyUZQV30Vu/l5o/C+JOF8RlWIVFxbUtjjntTyuPzqe1FxYus1sSrCvr2P9m3UNP0uLxLql7Dd2paORLe2zvnhcqQwJ6BgfqKydb+Hr3Mpg0rSw0GD5TglEkYuFK72AG/aGwPUGtMx42y6lJQp3n3a0X4nLhMgxU1zS931/4BxPhg6b4h8Oz6TraK0vWI7QMfl/8Arrxm48F6pc69Jo2iWc9/MxLRQQIZJtvPVFBIxg/lX2Npn7P0Xhi1j13xrJOyXl0jQWkJDRaeAX/4+NpBdlXJKr3NfZnwk+C/gb4feJprbTknu/EniGyh1i4vJIsQpHOSojXngLg5BPUnNfIvjb2VSToU7pvqz2/7Ac0lUlqux+ZGj/snfG3WbGz1CHwzIv2mQAJczpAYNpDB5FLZKuDg/wB3Bz2r7M+B/wCzXp3g29u9a8f6pDrN85EY0yz+axtiuDtJwN7DjgfKCBknFfX/AMVPFmoaR4K1FPBGmyXWoQARKFXGCRgsB3CnriviL4S+OfFmgeKriDxMpiEME001tcfu03yDIL7sHduXOR/Dk18njMzr4qbq1nds9ujg6dGKhTWh/9L9LbaG/nZY54o1YDcCnQgeo9aucXNpKQo+0Q8Ov8j+PQ1gaj4htLbyZ7ab58cjPGBXI33i2KG5NxC2BIMOucV712zyZOKPEPih4Q8F3+oR6zrCeVcwyjbt43jOdrDuM14X8S4PDt3CzaPaxWzKqqQqYOM9j05r2/x3GfFB8qAZaI7vMBxt7/jWtb/CiDxHpBZ5BBG8QXJHTHO7Pavt8pzKGGhSq15uy0tfZHzGOwcqznCnFa9T4TsNDvL+Qx2cLSsql2Cjoq8kn0AHU1d0zSbm+1BNOtIzNdNtKwopZm3DcBgeoGa+ob3QtJ8JeHtS8L6be2txc3ckqXckJ/feR8oWJn/hyfmIHbqe1cJ4R0y40X4g3eplYvtdpDZ30UrSrHbD7OZpGZzn7qIqsVHJB2nrXZmXiNUjVksHBOC0u76+ZhhOFFKmniJNSfY/Nf42WureK/jCfh5NG0UWgSLbzQ8j/Sn2mTcPVchcdsGv0m+HHhfS/Cfh+10zT4lQxRLkqMMx9zXxB8KLAeNPHvin4m+JZ/MDX11qFxcvwHeaR5N3PQBefbpWt4z/AGrdWtLmfTfAthEIEJRLufJlYD+IKOFB7e1fgfFeIxed46Wt3u+y7L5I/cuD1g8lwarVVo9Irq7bv7z9U/Dkck9sv7slz6Cuue2mQZmUjFfiRbftqftBaBEBYzwIgUqC0AY8nrk133gb9vn4jX2v2tn48aNrGZlimmgXY6Z4D46EA4z7V87U4TxEKbkpJ+h9HHjbD1Kqi4NJ9z9Vp9PkmeTym+UcgVxuqWDBXUqR0yQOK8o8c/HKPwto/wDacV3vYxI4wVIw3JP0A5zXwVrn7cvj+S5mh0e0gaASOInlXLsmTtJA6HFefg+H8Ribunsu+h7GO4nw+ESjV3fbU+3fFunW89vLp1yokSVSrhhnIavEv2ZPEkPwe+InifwFq9p9osvENtLNpzPwEZM71UnIG8bc/SvmCL9r7xvdagJde0+CaIjBjUFPxB9a3tI+Kdp45+Kfg24t7WWynFxJbqiMGMrzL8iqfVnAXB65r6/JMBi8BVcZ6xfmfn/EeZ4PMaPPDSS7o/SnxH8QdX8UeF4tF8IvFZT2sciXFiz7JxCQUCxbvv7duc5zk8Vw/i341z6r8MvBXw7mjnTV9B1VvOZf3ckkJdRG7cZZ0VmxnuPeuai+GXir/hGZ/iBrdtPHpmpTxWn21kKGC5bJJI4PlqP4hwenWvHr7X9Psp7jxcbxtRWGa8+zTsCWnMbGG3kQdtxQnB7DNfQVat5WZ8dSp6XP0c+Gmhab4t8aabonjO6uLm61MzyyW9s+1rkKpnPmgkqAhByVGTux0r6I1b4i6Bd+M/GMk0rLa+HtMaysxCxSRmRczGNhwxG44Hsa/Lz4K+MdS1DxnpXiq11mXRdT+xzpHelBMkUFouZVEZ6tMQqD/exX0nrvgDULe08N+ObHXGtLTVre8GpMV8yE3Z8ybbtJ5EsLgDHQA1a0KcVc+xvhh8VrDx3Yx3cmnuLiCJLO7VuDDOi5YMh+b5+zdM8VreKPh34S8dR37a3YRoZ0G6cDEgKspU568bcfQkd68l+D81v4Y0zU9WuJ7S/Qxys8ySKj+ZDKwWPJ4bcpzn+E5FeefGH9qfStF8MTTeFVN1cyMiosh2LtJIkYdyUwMeucitovQxe9kf/T+m7601r+zJnuIXikRgFIOQFxzXAyf2isipczhUY4DMa9L/4WrpKWT2V1FDHubaRI6r85UsBz/sjNeEePPH+oav4fa28E6XJqOouUeP7Mm+OKNjwZH+6pIzxngcmvroVoqVqqsfOyhzK9N3PSZb3wx4e06S51jUozJt83ZEd7CNSqlmAOQAWH+RWd4u+OelXngK30zwI5nbVUlhuJ1UiS3jj4YY/vHnH4V85fCn4G3PxYjkvde1MRRo73N5L9oMbCBCPMjY/wDBJBPB2nHStfxVaeG/Al5FpuiOLqzsZ/sckiDarqQVkMXrwDtPvXm4nE8/upnVRw9tWX/CEV3p2ofamtPtUzRlpYZwTGzTyRsBIOvJAOOufaqnxh0uGLR9c03w4s098mmzyKGGH8+ZCGTCnGDyQM8Diuw0bxHpr6ZqXjOLTpofKvfIWRzvRmKrGjZJwePmI6/NXN6LYapdaws6XEcdun2uW+E3Cujo+ELH7pB2kHtmvGxlf6vSlVtex7uU5esbioYZy5b3132TZ8m+DLHSr74CeJ9Q0yJ4VtreS3LFiGlkjZVd3HruZgB2Xivj7Wrn+x4pHii82Q9wfX0Hev0N+HPw3+1aLqngXSbSQ2urQ6otnqgmBikLbmiaaPuQ2OfTNfAPi/T9c8J+MW8P8AiaHyLmzb7O0cgxjd8oY5654ORxjpXx+DzynUx1XCJ3krStfVRe2na6PsM6yKpgqVJu1nHdapu7+5+T1PKpddu5bhUu5pIt2MAsNoB9R6VraNanXL2KztiJJJZUjQgYYsxA4Hc88U7xDYW/8AbsVvLtUNGgYqOnXGP0r3f9nD4aX2qeOo/Ed5Ef7M0J/ORnXAkuGXCADvt6/hXqZpnVLAYOpiam0V976L5vQ8/h7IK+a4+lgaN7zaT8l1fyWp9K/FfwL5vw08PzJC2n3k+nOLuIyFw7JEwGQeVYnHHbOK/OGfU/s8rW1o6RFOCzL1P1r9hfizbzX/AIZsojs+VZCRjpX5DfEHwhP4b8RPboW8u7laSEkYUByCBn2JxXyXA3Ec8fTlCukpXul/XY/SPE7w+/siNLF4Ztwfut22a2276/cQw3F7JL5V4qzDuRyVrs7Gwu7SSx1S1le2ubO6inhlX7ytGwZWXHOQa8vh1J7do9ikXMUmJWB4ZBxgj+te26NealqGsQeH0si7Eo25OTsBBzz2xmv0R1lufjqwdWXurW5+ofjX9oHxr4i+G9h8Ptfurme4nFybm6kRUkcbwYFCLhYzFGdpwOpriNV8B2svhvw3Ouu2K3tvbGK7sISNoT70Uvyjk7AVb3A9ah0/RdX1TV7ifUbNTL9oEaWzgiRWnZMADuVVQWHvXTDRn8Man5uv2DQXdxLHLD5aD5bRlbywF5GPlQ9ex9aiU05KyONRsrs7DRfBsvhPwvqjXQtjJJDpwhaGZWkimWWVmhdcZVJHjG7B+8AO1ejw/G61k8Fx/D3xBoyjTba5guoJA+ZrYvDuVY26EAHn/ZO01454a1G5g07VtEtXhu7fVooYrq5lUs9vIJs28iEnjdKDn2b3q9Fp2meItc0fwfEY7GS4hREnc/fnd/3IlB5UgM0J+i56VumS0mtT23xHceF0tdQ0fwzqUFi+rWEt7Os4LjzyylCrA7Y/3yk4xkq1fBvifx7qd5p0WhzKVSCUiV2Uea5yMqSRkBOAB6cV3UU4W8XUi5W2lluNMvIyxDrIn3cjt13A9yprxrVoJ7q6D36Kl2JpoZ9o/wBZJERljzyW6fUVSlrYzaP/1PKNCttc8Y+LrPSrdF1G91NpEjExwrlhhmJ/h68Htjivefjx8RNO8F/D3S/hf4dSIa3qaRxajd2REcUCtuAhGzrk53HOcY9a5Twx4s8PfDbwXq11E5vfGetBLW3jiUEaTA7AO0rkfK7IpIVecc968klht9YtNKmuYnnlfVWuZgF3sUBjWL6AEEfjXa5apHIo+60j3X4B6pr+hx6joVtq9lbJp2lkas843vdQIjeQnldST5mD+BNeZ+Oml1Czt47J1jmaRxhwT5jspUBQOSSxHArmYm0+18RTXkVxMt1A728scZBDqwEcrykf8s02gKehcjsKZq3i+71XWv7at1DRWl8sthGECAICMMwX+IhVP51bsncUHdWPZPAPhu0sDeeHPGsN5KtmY5YrVSyR3Eik7pWf7sQjKANnkr7iu90LxN4U1HwpcaNfTk3EV873BmjAMkPz+WysgyVCnD59FxwK6HUNZ8P/ABR8ISa14O8OXkniwARXNpayFoS0khDSsCcMFO3PbB5r6e+G/wAMvCPw98PaX4r+L95bXF/ptl5KRGNFij3KQYUCgNOQpCktnkcVx46lGpQlCo7Jrc9DKsZLCYyniIK7i727nyj4Q0aysfGmp2GkpHb2un2c01vBkD5ZxGRtHfgsfxr5O/aJ8C2XinxkmrrYw6tJJZxgqGCyxNCGxn2OBXq/xqv9O1bxncv8OpLvT/KdJ7ElwJ1jQnevB5XYRhTzgCvnO/8AF9tBLJca3HIXVsTXNsxIb/eU/dz/ADr+bs5y3GYXPZZlhp8zcUrK97fhu1c/qzhPLcNmmWRqYum1Sd7NrTdv8LlDRfg94ZaePUPE6xKwCsbS3w8px/ek6D6Cvb7fVvD+kWEWnaBphghhOQqDHPqT3P1rhdC+IXgO5jCWt5bQP0/f7g359K6hdQ0++y8eoW7xJl2MJBAUcknPtXkYupmGLn/tvM/J3sfr/DPC2V4FXwLhfq1a7KvxH8ZW8Wg2rvGyPIrL5TdSATz9DXyXr+oeGvEsX2bVotjrkKTjKn2rs/G+v6f4r1qVn1hLaKI7IYwAQEUYHOa53w/8L9Y8c6yuiaBe2dzcyRSyqZHEYKxIXOSeASBx6mvr8roYfAUPbVpcltW9VZeo81pyxEJxai6KTvzcrTXVtXPBrvwPpcRe4jUMgYgOhxkZ6kV0GnzTRQStZyGKVIXiilU4cEIQPm69a6LxJ4R1jwbq8+ja08Nrc27YkVpAwPuMZ3A+1cePEeiaArXEq/aRC2ct8sZI5wB1Nff4bMXiIJ03zJ2at1PyDHcIZVl0XXbjCLi02+zW6tfp5H6xfAzXbr4gLoj6hqv2XU3iSaWSbaN0rwpGbgAjO8JleOu9SK6L466PDZ+M9Q06R5La3hht0giDZmmAUbQPRSSSfQDFfEH7NvjaXxbqvhq9gUquiRPDdKpyS6oII0PsylXHutfcvjO11zxf49+0ai5EltDBAJVG55FQbQcc5I/nX0uFrtSlRnuj+VMTS2nHY8k1ZZdJ8I/2LYRLDNdmJ5JR/rpfKZnVGPTarDcMc8Vztvp066vb6iju0+UlLudpMqOWyD168k1+m2nfs3aX4q+HgiuilrrGUuLOd1IMeVZHVx3DqQfY1zUP7LulpFZf23qZknt5y0iQJhWjwPlBPI5zzXfRpyjHU5qs43sj4lufDN1dSNfaREJ57q4kuXhRdwMzKXyBg5+YnH1p918BPibZ3Wn63qOgSyQ3lq15I6pvZZSV3CQD7pJbp1xX63aJ4Q8N6THbLpum29t9liWFHEY37FGOvr79a6HUtYWCH7NajLnjgZrf2ae5gqya0P/V+TNH1e58W3+rz2ztBYC6MhmnPBY5CAkDJZYxnHtXS2PirUdTeLwn4Tspb1pnjt454lIYjI3v7N0xzhcnv04jxNqAtbOOx0lUhulIgWODI8wAEHag9vvOeSeK3PBnjfVfhjZQNpzI1zIFnkWWPlHbcgSNupXad2fXPpXpyim0ji52tjpvGlrdeFdXttDsT/pj29xb3gLr5sjSsMhsfdTYV255H1r3P4XeGfCOiQz2/im3GsXOo28Eemm0dmUXEw2sibR87oxUsBwACM5r53u/GWkXM41RtOWd7wwpeOwzO3l798cTdR52RubGfSvrb4V6f4t8MWEWo6tFGNfltWh0yFwNml2cihmKqOElcnGfvAe9cmOxFPD03UqP/gl4alOpJQieyXvxD0P9nbwkfCnw+0P+3PHt/Gr6nPJzbWk0g3+UCMglcqGA43Cvh34zftB/tCeGbnSdQ8aJpt9c6usy21pGrSPEsO3Kqg4A+btzxzX1Qxi0MXm2X7XqxtpbqVuoRiPlz/tMRx7Cvizx94gutV+LPh64tjvtPB2lyrqV3KAyfbdRiJZVzwWTcpPp+FfFTzGeJm/afCuh9FTwkafw79zyC0+J/jL4q3tzbJYx6ZfWJa8e+h3K0UqgIiEdg7AAg9hWYdR1A3TqsRt9aly1xaSt+7ud3UwlvlIzn5D0zxXEXfxJv4fHpbw3JHa2u2ZySo23YypYy9mL5yB2HSu/0nxJ4a+JmnyhIfLu7dgZbRjiaFiMiS3fuCBnb1rzs3yyrTarSguRrpuvX+vuP6P8Js/y7F5fHKfbuOJhzWjL4ZJtu0H0au7rfVuzW2KB4E1CcWPiXS59Fvc4ae1JiO4+qH5T+FdZbfCfWpIvtfgPxPFfx4JEFyDFIR3BI4IplleR2sg0zxbZxa9prqywXLjbMoHbd1Dj0Pet7wpf6T4E8T2viLw1qsV1ZRMxl0fUXMD7HBBCS4IyO2a8DEyrU6cpUfeaTsnqn5Xe1/wP1utl9CnSlW9lzSSekXyTv20fLJeevexzmpeEbqeI2fjbSYrK4jGBd2zptHuwBB/Su7+FugeFZfB+v2Gm67a2uq6dcRasqzyCJr6ytsG4thITlcgZAH3s4r6Zste+CXxIsJ7iNmtNaZo4jbSlLnLPkBt4H3FPVj0r5H+NHwWu9FtdQ8Xf2lpUP2bIjgglU+dH0ChRgluee2K+CocRxzSr/ZOOjLDVLxsnrdpp2S1uns3fbVa7fnuacZ0pr6tiMLyzVvek1zdNHZRTT21+80rbwp8MfiT4h13xT4r8bnSxG/mW9lDbGeY2wwqBSflyOmPevjz49eK/CWs+IodD8CaV/Zeh6PCtrB5vNzcOhYyTzt3kkcn2AAA6VkL47m8OabqFjp4jN7dFVE6jLIvOSp7Y6CvLLe3utUuCsYaWaQ8AZZmY/wA8mv13hvhmeDxMsTVqycIpRhFtJJWV3ZJX9ZNta2tc/EePOLnjZvB0NIdr3stNL+dj63/ZHnksPiLo6afOGOrQ3FtdW4blXhbzYpCvphCM1/QB8LLzSdK8bXFrqlvFLPf26m1uGAZkaMEsgJ6bwPzFfz//ALHOkPZ/HC2GqxNBNZ6ffSKkgK/PJGIlOD7ua/ba81B9F8QadeWpAnt0SVCefnj+Yfnjn2r6CvW9ljIz3Pz6MOfDuJ902t9ruqXfkWMAhtEI3yu3OD0wOprSl04Rvv3hDj5mk5Yn1C+laGialceINCs9V0yFYI72JZmmHJJYZKj02nj8KrtpNzNKR859Se5r6hNNXR4LvsyqPsER/eSPMcdB0/IVMuoafEOLcHHZV3H862YtJFuuBbh27luFH1zWXfSrHG5lkDKn/LO3XCjty3eixDhY/9bwLV/hFd/Cnw9p/jDxROLvWZb0Jbxqd0MMaxvI27P32ZsD0rl/BPhfxN8W/GJtNHt183YN7MP9HtFA2mRj0AHYdz0r7R+MXwd+Knxh8caV4U8Kafs0nT7ZbiTUJvltVmmYg5buyqowg5+ma9H8NaL4G+Afh2TwL4PuP7b8UBs6pqRTEMU2fnI/vuvIUDhOud1ehjMRRw6cpPRfiefQp1KtlHdmNonw48AfCbSoNIsrO21bxLsy95dIHEMmAN4ByFxn5R269anvleCzk1b7Ykf2VZHluJeVOVOWb1C5z1rl/F/iXw/YeGdRv9c1WKzSSGb7Q8rjfKCjblQnkuwPHfOK/LbwNp/irVYLq6v9c1KDwtK7pHafaHDXaKThTg8KMDcepPAr4THYqWNk6tT3UtkfU4TDqglCOre594Hxv4JtrO9m0fU7jV7iR3kmuGTZC8oXavPdV7Adq+NfiN4itbLSTpFmxiF5Od3OXbzGJeRz1ycd/wC9XYPf+Xb29nFGsECAERLgBFVcAfiRXgvj+6lOqwxSKdxtvMycZZ2beyqR6K2PfFRlVJVcTGPTf7jfGXpUHLrt955fBBBb201vqER8+zkdY26MwIIxz3K4x74rD8B3epyeIH0uwEs11MAIhEDvdoixUjHOdrGtSXXLO/E2n33CSSbobkdUPGAw67ePw/l0nwU082PxPjNwdlxDaXEkHffJFsfg+6BiPUV9bjnyUZSetkeRl/N7eHK7O61O5l8T6hHFJY6vG9vdcqzuhUkj++hGc+4rkrnWA8s8l7bx3iNGyD5iArEjDDHORzgH1r9Ltd8MaB4iht5tTsILmG+hDZdBgnGcg9Qfxr4c+OXwz0fwwgufDMrx+Y217WZt2Cf+ebdSPY5PvXxFCeGxE+SMeVs/a5cZZthMPyYuftYLq3Z28+/5nN+H/i34d8IadcJpmjfZbxlA8xJi/m4PG8tyAPavHPFnjnxh46nZ3MrxDPEYKwoD79DUVp4btbEC71eYF+pjJy3Povb6mo9U1gvCbS3/AHVuDwg9vU17GA4UwOFxEsXy3qPq9X+N7H5tm3FU8TJujHlv1vd/LscPZ+H9U1O/g02yjNxd3ThI405LMf8AP5V9l/DD4T2Pg+0i1HWlEmrzIfMQ4ZYSCT8h9QCAT61s/Bb4ZQaHp0XinWoVfU71MxJIAfs0LAkY/wBtx19Acete7WfhK+8aaha6HoS77klVJOcJyNzEjsvp3OKyzPMeeXsaO2zf9dDhwWDslWqbmF8Mfh/rvin4n6Xr+g2suLFkguroDahgV45GVj6MFIH419r+JtfM/jOO2h+ZY3WNiOgwpB/lXAeJ/Eng39mPwI+lxXPnanc5luHyDLLMygFUA4AO0ZxwBXMeEvE6at4eXxdeDyzfQJdjcc7WkgJC59jJiuSnCcoqb22QVZxcmono/wAeL34xaj8LXHwr8U6jpV1ojPqX2CykKC8jKgyIMc71ALIB1OR1NfCPw8/4KX/tOeAUS0k16LXrZONmq26zyAez8GvoLxl+0lpPhmeN7WRY4bcs90XIy0UY+4g7liMCvyKFlqfjLxDfXGiWRH2u6muBEn3IVlcuFz0AUHH0FfSZRVn7NxqbI8ytg3UrRhRjeUnZJatvyXdn9Fn7NP8AwUh8HfGvUk8JfFhF8Pa7cMiWBgk22N5I3Hllm5jkJ6A8HoK7/wDbS/advvgV4CtrnRo0g13WJGt9JgZNyRpGV8+cjoTGrALngswr8BvCvwyk0yW3u9QmZ7hGWQCHPysORg+oPevqz4h674k+MuhQ6F8S9WkeaCRWs9SvwZpbNPlDBeQdj7RvA5OAevXqnmFJOyP1TDeBPE88vlmFemoWV1Bv35fLo/Ju/kf/1/tP42fFrxFp/h+70H4QOkOowBcXmAI9wYfu4z0UEZBYc/1+NNPupPEkM1qZpdPvJbeSJ5o35YzLuMgJ6SBiQwP8XPSuL1bx3qXiTxRp3hfwtqEb6baSFrydX/4+pk5cZByqN90e1bGpW8a3T6pbRtGpf/TbZDzHKf8AlogHUN3x1PYk8fI4rF1qs+eq/wDgHs4ejTpq0D4s8eeEX1HTdR1PXfE8zx6bNJb2dm9u+Z5I22Eli23qOTj3rsoI4LXQbCwjfy47W2jQJyFaTAOOmeTzXuvxC8Bw/EHw3Y6FbCO0cN+6u0Hygs2478feBBY565714/4i0k6HfS6fdsFeyIiYZG0suRkEZ7YP41niJqSSOnDRcW7nFSM5cRbQNwGdv8K8Ko9Bjlh35rw74qxTwS2F7Eu05kVsE5GSXX8xnuTgfSvf74fu0aNtixry3G5xtPGewyR715z8QdOTU/D8kkRBkgkQoOvzLjd09i35Vpl1T2deMjTHQ56MrHyhMbD7TJDKJEdcfcIxyASOR1Ga6Dw94guvDWqWHiG3zJPp0oMBcgo2VKshHBK7WwR71yhmMl5KpAy800oH+7kD/Cp5FL2ZcBRCrptOPmVsknn3B5+g9K+2nFSTjLqfMwm4yvHc9y8T/tG/EPVPDI8NRXJt7P5Yt8CKrpjB2hwAwJ+vSvO77xZ4w8ZT22mQSyzzW6bHnkYv5YPLEsTgfhzWLp+nWEk3+kXEvDqZYgn3ipz97PHTtzXY77z7ObPRLGSK3I3HyI2ZmXrlmA6fpWFLCUaXwRS+RtWxVar/ABJt/M5KaztrIOGdrmfJBkc5LEentW78N/DT+K/G+naTIjSQLIbi4wMgRxfMd2eNpOFP1qTRvBnirxPcC30LS7m7d2CBljIQMegLHA/Wv0a/Z0/Zf1LwjKNU8cobX7esb3ZkYRl41YlbaEH5iHYAu5A4GB7cOY42FGm4p+89h4PCyqVE2tDrvC3ww8WeMrI3dhDFbacWCRXV1lY32ghvLQDc4z34HHXivT/GviHwV+zB4DutYcC7164tf3O84lnmlYBFGeVUnc3si56mvWvGXxR8M+CLSSGCWC9uoh5dtYW4G2IgYG8jgBe4HP8AT8lP2ofGd54qe0n1W9W4vZLt5pYw4LICuF+UHhecDivmMJh/a1EpbHu4mtywaR4j4w8deLvix4ik1zWWe6uryYxQQxZ8tM87UX0AIz+Zr6M8dfE3+yvDGl+A/DTp50EKx3EqHcsWAFUZ6FjgD2xXyPps91DptysMphkjdGAQkHa/ysD7H5c16r8L/Clz4l1kI6ObSCRZJ5OoI4OB7sTjnp+lfQYrkUU3sjyqN3J92SzeAJ9dtLa68Txywx+YGS8nJUESnlWPXb3HSvWvCXg/w1Z26WGhXVuZ1P73G0Fox1ZcHLe4xXb/ABVijvPAerRQyLG9uqy4xj5Y3U7R7kADP6Cvj/w1qd3oGt2WuKSVtJQzg9DGThh7/KSaxoe0xOHbTta+h99wjxu+Fq08RhsLTniJL3ak7tw6PlW3z0fnbQ+2rfw5pKJ5O6VGYbkfcPlkB6qcY5xirE3gWTUHWaO9MkoIc/aBkEj+E7cDHTtV6KSKaNLgMNjYZAvTDrk9PUc1oWUuyVyFVow2WQud5G7A7k/pXhe3qLVM+loeLfFan7SeLcr9JKLWvy0+Vj//0PmfwB8PfE/gXxTYX+tSTO5ybtpgFLABmzsHzKqgA/NyDntXt3hq+ml1E27klbsPIm7PKck/pX6yaz4Q8LeLSF1zR7O+8wbQ0ka7uT/exuxX54/tKaVo3wh+NGleDrOGQwal4dXV55d+6W3M13JbFIieOVX+LOK8TH5bUhF1JNNHdhMXGTULamTp3laXMsi/vdPnIZ4+6epQ+g+8OwGegUA/J/joQ6lr+qyzNJH5088nluMOCH4BHXIBAPTk19ZeG7vR/Enhu48T2ZY6HZiSyhG0iV5oDtYEHBwD34zivMvE+jGbToL7xZpZjt55RDb38MqG5j443AH5ugb3we7GvnpQlGXunrU5rqfMFrcRPB5EwyYlzhvutuAC7j3yent+FcP4v1OPT9HupJGzwRgtzyoJbGBjJ7nnkjtXtvizwdLY6XHrdlKtxp0qJHbSAeWYpRgKXU4Ysroy5HB2E8ZXPyD8SteNy66PGpVAc3DEkl3+4Ov0z+NehgYKpVjp1IxVVKk7M8EiLRalE+7cXy2PTcTwa29VlRdPe3A2ySsroB1J3DOAK5i4VrW9OPvRuD+INfaX7OXw/wBF8RazL478RRJcW2gSRfZIH5D3ZBZSwwfljX5gCMF9vYGvra1aNKm6ktkfPUoOc+WJe+FP7OGtatNb6/4/RtL0thHKtg523d0cA7XA/wBVGe5PzEcADqPt3UvHDeHrJraVFtbC1VfKFmiosUMYwE2jGEHYV5trXjGOK6ubp/MMaZzt4BLdeM9RXDG5u/GNybmYeVYRggR5+aTH97H8q+WxOJqV2pVNEe1SpRpL3dz2DQviZ4u8WauuieDyLK3/ANbcaldkRW9ug6sAoBZvQZGT39L/AMSfi54a8GeFbvQbLXdR1LU5pFa41R5N0mNpDx269Iw2ccEd+W4NfO9/4murKNtPskEEX3Ts4Jx0r5q8fa9skMbszNk4z69yaypYFVKik9Ev61FPEtRsTeO/jD4g1RzYaHLJp9qAdxD7riQdy8nXJ9Bj8a8fVJppGeVnkkdwzFjnIUZOSe9NjRpZMyH5nJbP0GSfyrQtkwsbEBQ0ake55Of/AB3n617sYRgvdRyuTe5p6BbNc38tuqHyWixNIRxGNy7WJ9N2B+NfoT4N8L2ehaDa6PZcbYSHl4BkJyS49sscdT+VeG6L8P7bQ/hnqd5cxq2oXlut3JIcN5ccZWRUU+nr6k17t4P1kX3hPTZ1y0htIQzE4/hPt0JBH4Z78+LmNf2kE4bJtHZhqfLLXqjpZNAsJ7KazuIPtME0TpMHGdyPwQce/p/+r4R8SaN/wj+s6joRGVsp5IkPJzEeU68nKEV9+wTNFc+XI2wq6HYPm3MpYMueMZYeuMH6ivkf4uafJD41lnaPY15bxSbSwOW+ZO3r5Z61rkdV+1cOjQswheCkuh6D8Mdaa+8KRK5zcWaLaMOpLR5Cn8YyBnNewaQjTSByqu8iouSDjcOg6dfpivlj4W6jLaa62lqSE1KMNHgDiSMEg+wKn9BX2h8KrWLVPGGkWEjkxyXKyknIyqAuwwOB0xXJmVJ0a0kttzfBVeaCuf/Z";

// src/modules/about/view.ts
var ABOUT_VIEW = "\u5173\u4E8E\u4F5C\u8005";
var GITEE_PATH = "M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z";
var GITHUB_PATH = "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
var X_PATH = "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";
var YOUTUBE_PATH = "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z";
var BILIBILI_PATH = "M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z";
var XIAOHONGSHU_PATH = "M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z";
var SITES = [
  {
    logo: "avatar",
    name: "\u5B98\u7F51",
    sub: "\u8D75\u5B50\u6C11\u7684\u4E2A\u4EBA\u4E3B\u9875",
    domains: [
      { domain: "zhaozimin.cn", url: "https://zhaozimin.cn", region: "\u5927\u9646" },
      { domain: "zhaozimin.com", url: "https://zhaozimin.com", region: "\u6D77\u5916" }
    ]
  },
  {
    logo: "edu",
    name: "\u63D2\u4EF6\u6559\u7A0B",
    sub: "\u7CFB\u7EDF\u8BFE\u4E0E\u5B66\u4E60\u5730\u56FE",
    domains: [
      { domain: "edu.zhaozimin.cn", url: "https://edu.zhaozimin.cn", region: "\u5927\u9646" },
      { domain: "edu.zhaozimin.com", url: "https://edu.zhaozimin.com", region: "\u6D77\u5916" }
    ]
  }
];
var CHANNEL_REGIONS = [
  {
    label: "\u6D77\u5916",
    channels: [
      { name: "GitHub", label: "zhaozimin", url: "https://github.com/zhaozimin", path: GITHUB_PATH },
      { name: "X", label: "@ZiminZhao", url: "https://x.com/ZiminZhao", path: X_PATH },
      { name: "YouTube", label: "@ZiminZhao", url: "https://www.youtube.com/@ZiminZhao", path: YOUTUBE_PATH, color: "#FF0000" }
    ]
  },
  {
    label: "\u4E2D\u56FD\u5927\u9646",
    channels: [
      { name: "Gitee", label: "ziminzhao", url: "https://gitee.com/ziminzhao", path: GITEE_PATH, color: "#C71D23" },
      { name: "\u5C0F\u7EA2\u4E66", label: "\u5149\u5934obsidian\u6559\u7A0B", url: "https://xhslink.cn/m/3NnLHIc6lQA", path: XIAOHONGSHU_PATH, color: "#FF2442", wordmark: true },
      { name: "\u54D4\u54E9\u54D4\u54E9", label: "\u5149\u5934obsidian\u6559\u7A0B", url: "https://b23.tv/E2UTPzQ", path: BILIBILI_PATH, color: "#00A1D6" }
    ]
  }
];
var CREDITS = [
  {
    name: "obsidian-weread-plugin",
    url: "https://github.com/zhaohongxuan/obsidian-weread-plugin",
    what: "\u5FAE\u4FE1\u8BFB\u4E66\u7684\u626B\u7801\u767B\u5F55\u4E0E\u4E09\u4E2A\u53D6\u6570\u63A5\u53E3\u3002\u300C\u5F00\u4E00\u4E2A\u771F\u6D4F\u89C8\u5668\u7A97\u53E3\u8BA9\u7528\u6237\u81EA\u5DF1\u626B\uFF0C\u6210\u529F\u540E\u53D6\u8D70 Cookie\u300D\u8FD9\u6761\u8DEF\u662F\u5B83\u8D70\u901A\u7684\u2014\u2014\u5426\u5219\u53EA\u80FD\u8BA9\u5B66\u5458\u53BB\u5F00\u53D1\u8005\u5DE5\u5177\u91CC\u624B\u6284\u4E00\u957F\u4E32 Cookie\u3002"
  },
  {
    name: "obsidian-kindle-plugin",
    url: "https://github.com/hadynz/obsidian-kindle-plugin",
    what: "Kindle \u7684 My Clippings.txt \u8BE5\u53BB\u54EA\u513F\u627E\u3001\u90A3\u4EFD\u7EAF\u6587\u672C\u7684\u5206\u9694\u4E0E\u5143\u4FE1\u606F\u8BE5\u600E\u4E48\u5207\u3002"
  },
  {
    name: "obsidian-apple-books-highlights-plugin",
    url: "https://github.com/bandantonio/obsidian-apple-books-highlights-plugin",
    what: "\u82F9\u679C\u56FE\u4E66\u7684\u5212\u7EBF\u539F\u6765\u5C31\u8EBA\u5728\u672C\u673A\u4E24\u4E2A SQLite \u91CC\uFF0C\u8FDE\u5E93\u8DEF\u5F84\u4E0E\u90A3\u4E24\u5F20\u8868\u7684\u5B57\u6BB5\u540D\u90FD\u662F\u4ECE\u5B83\u90A3\u513F\u8BA4\u5F97\u7684\u3002"
  },
  {
    name: "obsidian-douban",
    url: "https://github.com/Wanxp/obsidian-douban",
    what: "\u8C46\u74E3\u7684 JSON \u63A5\u53E3\u5BF9\u975E\u6D4F\u89C8\u5668\u4E00\u5F8B\u62D2\u7EDD\u3001\u800C HTML \u9875\u9762\u7167\u5E38\u8FD4\u56DE\uFF0C\u4EE5\u53CA\u88AB\u53CD\u722C\u62E6\u4E0B\u65F6\u9875\u9762\u957F\u4EC0\u4E48\u6837\u2014\u2014\u7701\u4E86\u6211\u4EEC\u4E00\u6574\u8F6E\u8BD5\u9519\u3002"
  },
  {
    name: "Dust Calendar",
    url: "https://github.com/a-nano-dust/dust-obsidian-calendar",
    what: "\u4ECE\u65E5\u671F\u3001\u5468\u6570\u3001\u6708\u3001\u5B63\u5EA6\u5230\u5E74\u7684\u53EF\u70B9\u65F6\u95F4\u7EF4\u5EA6\uFF0C\u8BA9\u65E5\u5386\u4E0D\u53EA\u662F\u5C55\u793A\uFF0C\u800C\u662F\u5468\u671F\u7B14\u8BB0\u7684\u5BFC\u822A\u5750\u6807\u3002ziminOS \u91CD\u5199\u4E86\u5B9E\u73B0\uFF0C\u6CA1\u6709\u590D\u5236\u5176\u4EE3\u7801\u3002"
  },
  {
    name: "QuickAdd",
    url: "https://github.com/chhoumann/quickadd",
    what: "ziminOS \u7684\u5EFA\u9879\u76EE\u3001\u5361\u7247\u767B\u8BB0\u4E0E\u56DB\u6001\u6D41\u8F6C\uFF0C\u672C\u6765\u662F\u8DD1\u5728\u5B83\u4E0A\u9762\u7684\u4E09\u4EFD\u811A\u672C\u3002\u8FD9\u5957\u7CFB\u7EDF\u662F\u4ECE\u90A3\u4E09\u4EFD\u811A\u672C\u957F\u51FA\u6765\u7684\u3002"
  },
  {
    name: "Obsidian Linter",
    url: "https://github.com/platers/obsidian-linter",
    what: "\u300C\u6539\u5B8C\u8D70\u5F00\u5C31\u66FF\u4F60\u6574\u7406\u300D\u8FD9\u4EF6\u4E8B\u672C\u6765\u8BE5\u88C5\u5B83\u3002\u6392\u7248\u6A21\u5757\u90A3\u4E5D\u6761\u89C4\u5219\u662F\u7167\u7740\u5B83\u7684\u884C\u4E3A\u91CD\u5199\u7684\uFF0C\u4E3A\u7684\u662F\u8BA9\u5B66\u5458\u5C11\u88C5\u4E00\u4E2A\u63D2\u4EF6\u3002"
  },
  {
    name: "File Explorer Note Count",
    url: "https://github.com/ozntel/file-explorer-note-count",
    what: "\u300C\u8BA1\u6570\u8BE5\u957F\u5728\u6587\u4EF6\u5939\u540D\u53F3\u4FA7\u300D\u8FD9\u4E2A\u4EA4\u4E92\u7ED3\u8BBA\u662F\u5B83\u7ED9\u7684\u3002\u5B83\u8BFB\u7684\u662F\u6587\u4EF6\u6D4F\u89C8\u5668\u89C6\u56FE\u7684 view.fileItems\u2014\u2014\u6B63\u662F\u770B\u6E05\u90A3\u4E2A\u5B57\u6BB5\u4E0D\u5728 obsidian.d.ts \u91CC\uFF0C\u6211\u4EEC\u624D\u6539\u8D70\u516C\u5F00\u7684 getLeavesOfType\u3002"
  },
  {
    name: "Recent Files",
    url: "https://github.com/tgrosinger/recent-files-obsidian",
    what: "\u300C\u6700\u8FD1\u300D\u7684\u6210\u5458\u662F\u4F60**\u6253\u5F00\u8FC7**\u7684\u3001\u800C\u4E0D\u662F\u5E93\u91CC\u6539\u52A8\u8FC7\u7684\u3002\u8FD9\u6761\u8BED\u4E49\u5206\u5F97\u6E05\u6E05\u695A\u695A\uFF0C\u4E8E\u662F\u4E00\u4E2A\u4ECE\u6CA1\u6253\u5F00\u8FC7\u7684\u6587\u4EF6\u4E0D\u4F1A\u7A81\u7136\u51FA\u73B0\u5728\u6E05\u5355\u91CC\u8BA9\u4EBA\u6123\u4E00\u4E0B\u3002"
  },
  {
    name: "Remember cursor position",
    url: "https://github.com/dy-sh/obsidian-remember-cursor-position",
    what: "\u5149\u6807\u4F4D\u7F6E\u8BE5\u5728**\u79BB\u5F00\u4E00\u7BC7\u65F6**\u8BB0\u4E0B\uFF0C\u800C\u4E0D\u662F\u8FB9\u6253\u5B57\u8FB9\u8BB0\u2014\u2014\u5C31\u8FD9\u4E00\u6761\u628A\u5B9A\u65F6\u5668\u4ECE\u65B9\u6848\u91CC\u5F7B\u5E95\u53BB\u6389\u4E86\u3002"
  },
  {
    name: "Paste URL into selection",
    url: "https://github.com/denolehov/obsidian-url-into-selection",
    what: "\u300C\u9009\u4E2D\u6587\u5B57 + \u7C98\u8D34\u7F51\u5740 = \u5916\u94FE\u300D\u8FD9\u4E2A\u52A8\u4F5C\u672C\u8EAB\u3002\u5B83\u6CA1\u6709\u8BB8\u53EF\u8BC1\uFF0C\u4E00\u4E2A\u5B57\u8282\u90FD\u4E0D\u80FD\u8F6C\u53D1\uFF0C\u4F46\u8FD9\u4E2A\u52A8\u4F5C\u503C\u5F97\u7559\u4E0B\u6765\u3002"
  },
  {
    name: "Show Current File Path",
    url: "https://github.com/ravimashru/obsidian-show-file-path",
    what: "\u5F53\u524D\u8DEF\u5F84\u8BE5\u4F4F\u5728\u53F3\u4E0B\u89D2\u72B6\u6001\u680F\u3001\u70B9\u4E00\u4E0B\u5C31\u590D\u5236\u2014\u2014\u4F4D\u7F6E\u4E0E\u4EA4\u4E92\u90FD\u7167\u5B83\u3002"
  },
  {
    name: "Legacy Vault Switcher",
    url: "https://github.com/Quorafind/Obsidian-Legacy-Vault-Switcher",
    what: "Obsidian 1.6 \u632A\u8D70\u7684\u90A3\u4E09\u4E2A\u6309\u94AE\u8BF7\u5F97\u56DE\u6765\u3002\u5B83\u540C\u6837\u6CA1\u6709\u8BB8\u53EF\u8BC1\u4E0D\u80FD\u8F6C\u53D1\uFF0C\u4F46\u5B83\u5148\u8BC1\u660E\u4E86\u8FD9\u4EF6\u4E8B\u505A\u5F97\u6210\u3002"
  }
];
var BUNDLED = [
  { name: "Dataview", url: "https://github.com/blacksmithgu/obsidian-dataview", what: "MIT" },
  { name: "Outliner", url: "https://github.com/vslinko/obsidian-outliner", what: "MIT" },
  {
    name: "Quiet Outline",
    url: "https://github.com/guopenghui/obsidian-quiet-outline",
    what: "MIT"
  },
  { name: "Minimal", url: "https://github.com/kepano/obsidian-minimal", what: "MIT" },
  {
    name: "Style Settings",
    url: "https://github.com/community-archive/obsidian-style-settings",
    what: "GPL-3.0"
  },
  { name: "Pikaicons", url: "https://pikaicons.com", what: "MIT" },
  { name: "Simple Icons", url: "https://simpleicons.org", what: "CC0" },
  { name: "lunar-typescript", url: "https://github.com/6tail/lunar-typescript", what: "MIT" },
  { name: "holiday-cn", url: "https://github.com/NateScarlet/holiday-cn", what: "MIT" },
  { name: "\u971E\u9E5C\u6587\u6977 GB \u5C4F\u5E55\u7248", url: "https://github.com/lxgw/LxgwWenKai-Screen", what: "OFL" },
  { name: "\u601D\u6E90\u5B8B\u4F53 CN", url: "https://github.com/adobe-fonts/source-han-serif", what: "OFL" },
  { name: "\u6731\u96C0\u4EFF\u5B8B", url: "https://github.com/TrionesType/zhuque", what: "OFL" },
  { name: "\u971E\u9E5C\u65B0\u6670\u9ED1\uFF0B", url: "https://github.com/lxgw/LxgwNeoXiHei", what: "IPA" }
];
function renderEduLogo(el) {
  const svg = el.createSvg("svg", {
    cls: "ziminos-about-logo-square",
    attr: { viewBox: "0 0 24 24", "aria-hidden": "true" }
  });
  svg.createSvg("rect", { attr: { width: "24", height: "24", rx: "5", fill: "#161616" } });
  svg.createSvg("path", {
    attr: {
      d: "M4 16 L10 7 L15 12 L20 5",
      stroke: "#F5F3EE",
      "stroke-width": "1.5",
      fill: "none",
      "stroke-linecap": "round"
    }
  });
  svg.createSvg("circle", { attr: { cx: "4", cy: "16", r: "2", fill: "#F5F3EE" } });
  svg.createSvg("circle", { attr: { cx: "10", cy: "7", r: "2", fill: "#F5F3EE" } });
  svg.createSvg("circle", { attr: { cx: "15", cy: "12", r: "2.4", fill: "#E8503A" } });
  svg.createSvg("circle", { attr: { cx: "20", cy: "5", r: "2", fill: "#F5F3EE" } });
}
function renderSite(row, site) {
  const tile = row.createDiv({ cls: "ziminos-about-tile" });
  const head = tile.createDiv({ cls: "ziminos-about-tile-head" });
  if (site.logo === "avatar") {
    const avatar = head.createDiv({ cls: "ziminos-about-logo-round" });
    avatar.style.backgroundImage = `url("${AVATAR_DATA_URI}")`;
  } else {
    renderEduLogo(head);
  }
  const text3 = head.createDiv({ cls: "ziminos-about-tile-text" });
  text3.createDiv({ cls: "ziminos-about-tile-name", text: site.name });
  text3.createDiv({ cls: "ziminos-about-tile-sub", text: site.sub });
  const list = tile.createDiv({ cls: "ziminos-about-domains" });
  for (const entry of site.domains) {
    const link = list.createEl("a", {
      cls: "ziminos-about-domain",
      href: entry.url,
      attr: { rel: "noopener" }
    });
    link.createSpan({ text: entry.domain });
    link.createSpan({ cls: "ziminos-about-domain-region", text: entry.region });
  }
}
function renderChannel(row, channel) {
  const pill = row.createEl("a", {
    cls: "ziminos-about-pill",
    href: channel.url,
    attr: { "aria-label": channel.name, title: channel.name, rel: "noopener" }
  });
  const icon = pill.createSvg("svg", {
    cls: "ziminos-about-pill-icon",
    attr: { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }
  });
  if (channel.wordmark) icon.addClass("is-wordmark");
  icon.createSvg("path", { attr: { d: channel.path } });
  if (channel.color) icon.style.color = channel.color;
  pill.appendText(channel.label);
}
function renderAboutPanel(el) {
  const panel = el.createDiv({ cls: "ziminos-about" });
  const tiles = panel.createDiv({ cls: "ziminos-about-tiles" });
  for (const site of SITES) renderSite(tiles, site);
  for (const region of CHANNEL_REGIONS) {
    const section = panel.createDiv({ cls: "ziminos-about-region" });
    section.createDiv({ cls: "ziminos-about-region-title", text: region.label });
    const pills = section.createDiv({ cls: "ziminos-about-pills" });
    for (const channel of region.channels) renderChannel(pills, channel);
  }
  renderCredits(panel);
}
function renderCredits(panel) {
  const block = panel.createDiv({ cls: "ziminos-about-credits" });
  block.createDiv({ cls: "ziminos-about-credits-title", text: "\u81F4\u8C22" });
  block.createDiv({
    cls: "ziminos-about-credits-intro",
    text: "\u8FD9\u4E9B\u9879\u76EE\u5728\u524D\u9762\uFF0CziminOS \u624D\u8D70\u5F97\u5230\u8FD9\u91CC\u3002\u4E00\u884C\u4EE3\u7801\u90FD\u6CA1\u6709\u6284\uFF0C\u4F46\u6BCF\u4E00\u6761\u90FD\u6539\u53D8\u4E86\u5B83\u7684\u67D0\u4E2A\u51B3\u5B9A\u3002"
  });
  for (const credit of CREDITS) {
    const item = block.createDiv({ cls: "ziminos-about-credit" });
    item.createEl("a", {
      cls: "ziminos-about-credit-name",
      text: credit.name,
      href: credit.url,
      attr: { rel: "noopener" }
    });
    item.createDiv({ cls: "ziminos-about-credit-what", text: credit.what });
  }
  const bundled = block.createDiv({ cls: "ziminos-about-bundled" });
  bundled.createSpan({ text: "\u968F\u5E93\u4EA4\u4ED8\uFF1A" });
  BUNDLED.forEach((entry, index) => {
    if (index) bundled.appendText("\u3001");
    bundled.createEl("a", {
      cls: "ziminos-about-bundled-link",
      text: entry.name,
      href: entry.url,
      attr: { rel: "noopener", title: `${entry.name}\uFF08${entry.what}\uFF09` }
    });
  });
  bundled.appendText(
    "\u3002Dataview\u3001Minimal\u3001Style Settings \u4E0E\u56DB\u6B3E\u5B57\u4F53\u7684\u8BB8\u53EF\u8BC1\u5168\u6587\u968F\u6587\u4EF6\u4EA4\u4ED8\uFF1BPikaicons\u3001lunar-typescript \u4E0E holiday-cn \u7684\u8BB8\u53EF\u58F0\u660E\u5199\u5728 main.js \u5F00\u5934\uFF1BSimple Icons \u662F CC0\u3002"
  );
}
var aboutViews = [
  {
    name: ABOUT_VIEW,
    render: (view) => {
      renderAboutPanel(view.el);
      return Promise.resolve();
    }
  }
];

// src/modules/appearance/statusBar.ts
var import_obsidian4 = require("obsidian");

// src/modules/appearance/snippets.ts
var GROUP_PATTERN = /^【([^】]+)】\s*/;
var UNGROUPED_LABEL = "\u5176\u4ED6";
async function readSnippets(app) {
  const folder = `${app.vault.configDir}/${SNIPPET_FOLDER_NAME}`;
  if (!await app.vault.adapter.exists(folder)) return [];
  const listed = await app.vault.adapter.list(folder);
  const enabled = await readEnabledNames(app);
  const states = [];
  for (const path of listed.files) {
    if (!path.endsWith(SNIPPET_EXTENSION)) continue;
    const base = path.slice(path.lastIndexOf("/") + 1, -SNIPPET_EXTENSION.length);
    if (!base) continue;
    states.push({ ...splitGroup(base), name: base, enabled: enabled.has(base) });
  }
  return states.sort(compareSnippets);
}
function splitGroup(base) {
  const matched = GROUP_PATTERN.exec(base);
  if (!matched) return { group: UNGROUPED_LABEL, label: base };
  const label = base.slice(matched[0].length);
  return label ? { group: matched[1], label } : { group: UNGROUPED_LABEL, label: base };
}
function compareSnippets(a, b) {
  if (a.group !== b.group) {
    if (a.group === UNGROUPED_LABEL) return 1;
    if (b.group === UNGROUPED_LABEL) return -1;
    return a.group.localeCompare(b.group, "zh");
  }
  return a.label.localeCompare(b.label, "zh");
}
async function setSnippetEnabled(app, name, enabled) {
  const customCss = app.customCss;
  if (typeof (customCss == null ? void 0 : customCss.setCssEnabledStatus) === "function") {
    customCss.setCssEnabledStatus(name, enabled);
    return true;
  }
  await writeEnabledNames(app, name, enabled);
  return false;
}
function appearancePath(app) {
  return `${app.vault.configDir}/${APPEARANCE_FILE_NAME}`;
}
async function readEnabledNames(app) {
  return extractEnabledNames(await readAppearanceConfig(app));
}
function extractEnabledNames(config) {
  const listed = config[ENABLED_SNIPPETS_KEY];
  if (!Array.isArray(listed)) return /* @__PURE__ */ new Set();
  return new Set(listed.filter((item) => typeof item === "string"));
}
async function writeEnabledNames(app, name, enabled) {
  const config = await readAppearanceConfig(app);
  const names = extractEnabledNames(config);
  if (enabled) names.add(name);
  else names.delete(name);
  config[ENABLED_SNIPPETS_KEY] = [...names];
  await app.vault.adapter.write(appearancePath(app), `${JSON.stringify(config, null, 2)}
`);
}
async function readAppearanceConfig(app) {
  const config = {};
  const path = appearancePath(app);
  if (!await app.vault.adapter.exists(path)) return config;
  let parsed;
  try {
    parsed = JSON.parse(await app.vault.adapter.read(path));
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    throw new Error(`\u65E0\u6CD5\u8BFB\u53D6\u5916\u89C2\u914D\u7F6E ${path}\uFF1A${message2 || "\u6587\u4EF6\u4E0D\u662F\u5408\u6CD5 JSON"}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`\u5916\u89C2\u914D\u7F6E ${path} \u7684\u9876\u5C42\u5FC5\u987B\u662F JSON \u5BF9\u8C61\uFF0C\u5DF2\u62D2\u7EDD\u8986\u76D6\u539F\u6587\u4EF6`);
  }
  for (const [key, value] of Object.entries(parsed)) config[key] = value;
  return config;
}

// src/modules/appearance/statusBar.ts
var TEXTS = {
  tooltip: "\u5916\u89C2\u5F00\u5173\uFF1A\u5F00\u5173 CSS \u7247\u6BB5",
  /** setIcon 认不出图标名时的替身。MySnippets 就是因为图标名随 Obsidian 换图标库失效而「看不见」 */
  iconFallback: "\u{1F3A8}",
  iconName: "palette",
  title: "\u5916\u89C2\u5F00\u5173",
  countSuffix: " \u4E2A\u7247\u6BB5",
  empty: "\u7247\u6BB5\u76EE\u5F55\u91CC\u8FD8\u6CA1\u6709 CSS \u6587\u4EF6\u3002\u628A .css \u6587\u4EF6\u653E\u8FDB .obsidian/snippets/\uFF0C\u518D\u70B9\u4E00\u6B21\u8FD9\u4E2A\u6309\u94AE\u3002",
  pendingReload: "\u5DF2\u8BB0\u4E0B\u8FD9\u6B21\u6539\u52A8\uFF0C\u91CD\u65B0\u8F7D\u5165 Obsidian \u540E\u751F\u6548\u3002",
  failedReadPrefix: "\u8BFB\u4E0D\u5230\u7247\u6BB5\u76EE\u5F55\uFF1A",
  failedPrefix: "\u5199\u5165\u5931\u8D25\uFF1A"
};
var SAME_GESTURE_MS = 300;
function registerAppearanceSwitch(ctx) {
  const swi = new AppearanceSwitch(ctx);
  return () => swi.syncVisibility();
}
var AppearanceSwitch = class {
  constructor(ctx) {
    /** 浮层只在打开期间存在；null 即「当前没开」，不留隐藏的空壳 */
    this.panelEl = null;
    /** 关闭浮层用的解绑动作。开一次装一次、关一次拆干净，不给插件生命周期留监听残渣 */
    this.detachers = [];
    /**
     * 上一次「点了别处所以关掉」发生在什么时刻（performance.now）。
     *
     * 它解决的是第三个入口带来的一个具体麻烦：左侧边栏那个调色盘按钮不在放行名单里
     * （状态栏按钮是构造时就拿到的引用，边栏按钮由 ribbon 模块发出，本文件够不着），
     * 于是点它一下会被同一次手势处理两遍——mousedown 判定「点了别处」先关，
     * 随后 click 触发命令又开回来，浮层闪一下还在，用户以为按钮坏了。
     * 记一个时刻而不是维护一份放行名单，是因为「谁能打开我」这件事会随入口增加而增长，
     * 名单迟早漏掉一个；而「这次打开是不是刚才那次关闭的同一个手势」是个恒定的问题。
     * 判据与 SelfWriteGuard 同形：都是「这动作是不是我自己刚才引起的」。
     */
    this.dismissedAt = Number.NEGATIVE_INFINITY;
    this.ctx = ctx;
    this.statusEl = ctx.plugin.addStatusBarItem();
    this.statusEl.addClass("ziminos-appearance-switch");
    this.statusEl.addClass("mod-clickable");
    (0, import_obsidian4.setTooltip)(this.statusEl, TEXTS.tooltip, { placement: "top" });
    this.paintIcon();
    this.syncVisibility();
    this.statusEl.addEventListener("click", () => this.toggle());
    ctx.commands.register(APPEARANCE_COMMAND, () => this.toggle());
    ctx.plugin.register(() => this.close());
  }
  /** 按设置决定按钮显隐。关掉只是收起按钮，命令与浮层照常可用 */
  syncVisibility() {
    this.statusEl.toggle(this.ctx.settings.showAppearanceSwitch);
  }
  /**
   * 画图标。
   * 图标名属于 Obsidian 的图标库，换库就会失效——那正是 MySnippets 在新版里
   * 只剩一个看不见的按钮的原因。这里画完检查一眼有没有真的画出 svg，没有就退回一个字符。
   */
  paintIcon() {
    (0, import_obsidian4.setIcon)(this.statusEl, TEXTS.iconName);
    if (!this.statusEl.querySelector("svg")) this.statusEl.setText(TEXTS.iconFallback);
  }
  // ============================================================
  // 开合
  // ============================================================
  toggle() {
    if (this.panelEl) {
      this.close();
      return;
    }
    const sameGesture = performance.now() - this.dismissedAt < SAME_GESTURE_MS;
    this.dismissedAt = Number.NEGATIVE_INFINITY;
    if (sameGesture) return;
    void this.open();
  }
  /** 打开浮层。事实现读，因此「设置 → 外观」里的改动与新丢进目录的文件都会出现在这一次 */
  async open() {
    this.close();
    const panel = document.body.createDiv({ cls: "ziminos-appearance-panel" });
    this.panelEl = panel;
    this.place(panel);
    this.bindDismiss(panel);
    try {
      const snippets = await readSnippets(this.ctx.app);
      if (this.panelEl !== panel) return;
      this.render(panel, snippets);
    } catch (error) {
      if (this.panelEl !== panel) return;
      panel.createDiv({
        cls: "ziminos-appearance-empty",
        text: TEXTS.failedReadPrefix + describe(error)
      });
    }
  }
  close() {
    var _a;
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    (_a = this.panelEl) == null ? void 0 : _a.remove();
    this.panelEl = null;
  }
  /**
   * 把浮层贴到状态栏按钮上方。
   *
   * 位置一律由按钮的实际矩形算出，不写死像素——MySnippets 用的是
   * 「窗口右下角减 15 和 37」，换一套窗口边框就飘出屏幕。
   * 按钮被用户收起来时（此时用命令打开）矩形是全零，退回贴着窗口右下角。
   */
  place(panel) {
    const rect = this.statusEl.getBoundingClientRect();
    const anchored = rect.width > 0;
    panel.style.bottom = `${anchored ? window.innerHeight - rect.top + 6 : 34}px`;
    panel.style.right = `${anchored ? Math.max(8, window.innerWidth - rect.right) : 12}px`;
  }
  /** 点别处、按 Esc、改窗口大小都算「不看了」。三个监听都记进 detachers，关闭时一起拆掉 */
  bindDismiss(panel) {
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.contains(target) || this.statusEl.contains(target)) return;
      this.dismissedAt = performance.now();
      this.close();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") this.close();
    };
    const onResize = () => this.close();
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onResize);
    this.detachers.push(
      () => document.removeEventListener("mousedown", onPointerDown, true),
      () => document.removeEventListener("keydown", onKeyDown, true),
      () => window.removeEventListener("resize", onResize)
    );
  }
  // ============================================================
  // 渲染
  // ============================================================
  /** 画标题、分组与每一行。分组名来自用户自己的【】命名习惯，不是我们发明的分类 */
  render(panel, snippets) {
    const header = panel.createDiv({ cls: "ziminos-appearance-header" });
    header.createSpan({ text: TEXTS.title });
    header.createSpan({
      cls: "ziminos-appearance-count",
      text: `${snippets.length}${TEXTS.countSuffix}`
    });
    if (snippets.length === 0) {
      panel.createDiv({ cls: "ziminos-appearance-empty", text: TEXTS.empty });
      return;
    }
    const list = panel.createDiv({ cls: "ziminos-appearance-list" });
    let currentGroup = "";
    for (const snippet of snippets) {
      if (snippet.group !== currentGroup) {
        currentGroup = snippet.group;
        list.createDiv({ cls: "ziminos-appearance-group", text: currentGroup });
      }
      this.renderRow(list, snippet);
    }
  }
  /**
   * 一行：名字 + 开关。
   *
   * 失败要把开关拨回去——否则界面说「开着」而磁盘上是关着的，
   * 用户下次打开面板会看到它自己变了回去，那比一开始就报错更让人不信任系统。
   * 回拨用一个重入标志兜住：ToggleComponent.setValue 是否回调 onChange 属于它的实现细节，
   * 不该由我们来赌。
   */
  renderRow(list, snippet) {
    const row = list.createDiv({ cls: "ziminos-appearance-row" });
    row.createSpan({ cls: "ziminos-appearance-name", text: snippet.label });
    const toggle = new import_obsidian4.ToggleComponent(row);
    let rollingBack = false;
    toggle.setValue(snippet.enabled).onChange((value) => {
      if (rollingBack) return;
      void this.applyToggle(snippet, value, () => {
        rollingBack = true;
        toggle.setValue(!value);
        rollingBack = false;
      });
    });
  }
  /** 落一次开关：即刻生效就闭嘴，只落了盘就提醒重载，失败就回拨并说明原因 */
  async applyToggle(snippet, value, rollback) {
    try {
      const applied = await setSnippetEnabled(this.ctx.app, snippet.name, value);
      if (!applied) new import_obsidian4.Notice(TEXTS.pendingReload);
    } catch (error) {
      rollback();
      new import_obsidian4.Notice(TEXTS.failedPrefix + describe(error));
    }
  }
};
function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/modules/books/createBook.ts
var import_obsidian6 = require("obsidian");

// src/core/modals.ts
var import_obsidian5 = require("obsidian");
var TextInputModal = class extends import_obsidian5.Modal {
  constructor(app, options) {
    super(app);
    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    this.resolver = null;
    /** 是否已经结算过。关闭动作与提交动作都会走到结算，用它保证只生效一次 */
    this.settled = false;
    this.options = options;
  }
  /** 打开弹窗并等待用户作答：有输入返回文本，取消返回 null */
  openAndGetValue() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.open();
    });
  }
  onOpen() {
    var _a, _b;
    this.titleEl.setText(this.options.title);
    this.contentEl.empty();
    const inputEl = this.contentEl.createEl("input", {
      type: "text",
      value: (_a = this.options.initial) != null ? _a : "",
      placeholder: (_b = this.options.placeholder) != null ? _b : ""
    });
    inputEl.style.width = "100%";
    inputEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      event.preventDefault();
      this.submit(inputEl.value);
    });
    const buttonBar = this.contentEl.createDiv();
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "8px";
    buttonBar.style.marginTop = "16px";
    new import_obsidian5.ButtonComponent(buttonBar).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian5.ButtonComponent(buttonBar).setButtonText("\u786E\u8BA4").setCta().onClick(() => this.submit(inputEl.value));
    inputEl.focus();
    inputEl.select();
  }
  onClose() {
    this.settle(null);
    this.contentEl.empty();
  }
  /** 提交输入并关闭：先结算再关闭，onClose 里的兜底结算自然失效 */
  submit(value) {
    this.settle(value);
    this.close();
  }
  /** 唯一结算点，保证 Promise 只被兑现一次 */
  settle(value) {
    if (this.settled) return;
    this.settled = true;
    const resolve = this.resolver;
    this.resolver = null;
    if (resolve) resolve(value);
  }
};
var TextAreaModal = class extends import_obsidian5.Modal {
  constructor(app, options) {
    super(app);
    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    this.resolver = null;
    /** 是否已经结算过。关闭动作与提交动作都会走到结算，用它保证只生效一次 */
    this.settled = false;
    this.options = options;
  }
  /** 打开弹窗并等待用户作答：有输入返回文本，取消返回 null */
  openAndGetValue() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.open();
    });
  }
  onOpen() {
    var _a;
    this.titleEl.setText(this.options.title);
    this.contentEl.empty();
    if (this.options.hint) {
      const hintEl = this.contentEl.createEl("p", { text: this.options.hint });
      hintEl.style.margin = "0 0 10px";
      hintEl.style.color = "var(--text-muted)";
      hintEl.style.lineHeight = "1.6";
    }
    const textareaEl = this.contentEl.createEl("textarea", {
      placeholder: (_a = this.options.placeholder) != null ? _a : ""
    });
    textareaEl.rows = 12;
    textareaEl.style.width = "100%";
    textareaEl.style.resize = "vertical";
    textareaEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      this.submit(textareaEl.value);
    });
    const buttonBar = this.contentEl.createDiv();
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "8px";
    buttonBar.style.marginTop = "16px";
    new import_obsidian5.ButtonComponent(buttonBar).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian5.ButtonComponent(buttonBar).setButtonText("\u786E\u8BA4").setCta().onClick(() => this.submit(textareaEl.value));
    textareaEl.focus();
  }
  onClose() {
    this.settle(null);
    this.contentEl.empty();
  }
  /** 提交输入并关闭：先结算再关闭，onClose 里的兜底结算自然失效 */
  submit(value) {
    this.settle(value);
    this.close();
  }
  /** 唯一结算点，保证 Promise 只被兑现一次 */
  settle(value) {
    if (this.settled) return;
    this.settled = true;
    const resolve = this.resolver;
    this.resolver = null;
    if (resolve) resolve(value);
  }
};
var ChoiceModal = class extends import_obsidian5.FuzzySuggestModal {
  constructor(app, options) {
    super(app);
    this.resolver = null;
    this.settled = false;
    this.options = options;
    this.setPlaceholder(options.title);
  }
  /** 打开弹窗并等待用户作答：选中返回该项，取消返回 null */
  openAndGetChoice() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.open();
    });
  }
  getItems() {
    return [...this.options.items];
  }
  getItemText(item) {
    return this.options.labelOf(item);
  }
  onChooseItem(item) {
    this.settle(item);
  }
  /**
   * 关闭即取消——但不能立刻断定。
   *
   * Obsidian 的 SuggestModal 在用户选中一项时，是**先关闭弹窗、再回调 onChooseItem**。
   * 若在这里同步结算成 null，每一次正常选择都会先被判成取消，随后的 onChooseItem
   * 因为 settle 幂等而失效——表现就是四条走选择的命令永远只说「已取消」。
   * 推迟一拍再结算，选中回调便有机会先落定；真正的取消（Esc / 遮罩）没有后续回调，
   * 一拍之后照样结算成 null。顺序在两种路径下都成立，不依赖基类的实现细节。
   */
  onClose() {
    super.onClose();
    window.setTimeout(() => this.settle(null), 0);
  }
  /** 唯一结算点，保证 Promise 只被兑现一次 */
  settle(value) {
    if (this.settled) return;
    this.settled = true;
    const resolve = this.resolver;
    this.resolver = null;
    if (resolve) resolve(value);
  }
};

// src/modules/books/createBook.ts
var MESSAGES = {
  namePrompt: "\u8FD9\u672C\u4E66\u53EB\u4EC0\u4E48\u540D\u5B57\uFF1F",
  namePlaceholder: "\u4F8B\u5982\uFF1A\u5361\u7247\u7B14\u8BB0\u5199\u4F5C\u6CD5",
  nameMissing: "\u672A\u8F93\u5165\u4E66\u540D\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002",
  authorPrompt: "\u4F5C\u8005\u662F\u8C01\uFF1F\uFF08\u9009\u586B\uFF0CEsc \u8DF3\u8FC7\uFF09",
  descriptionPrompt: "\u4E00\u53E5\u8BDD\uFF1A\u4E3A\u4EC0\u4E48\u60F3\u8BFB\u8FD9\u672C\u4E66\uFF1F\uFF08\u9009\u586B\uFF0CEsc \u8DF3\u8FC7\uFF09"
};
async function createBook(ctx, create) {
  const nameInput = await new TextInputModal(ctx.app, {
    title: MESSAGES.namePrompt,
    placeholder: MESSAGES.namePlaceholder
  }).openAndGetValue();
  if (nameInput === null || !nameInput.trim()) {
    new import_obsidian6.Notice(MESSAGES.nameMissing);
    return null;
  }
  const name = wrapBookTitle(nameInput.trim());
  const authorInput = await new TextInputModal(ctx.app, {
    title: MESSAGES.authorPrompt
  }).openAndGetValue();
  const author = (authorInput != null ? authorInput : "").trim();
  const descriptionInput = await new TextInputModal(ctx.app, {
    title: MESSAGES.descriptionPrompt
  }).openAndGetValue();
  const description = (descriptionInput != null ? descriptionInput : "").trim();
  return create({ name, description, ...author ? { author } : {} });
}
function registerCreateBookCommand(ctx, create) {
  ctx.commands.register(BOOK_COMMANDS.create, () => {
    void createBook(ctx, create);
  });
}
function wrapBookTitle(input) {
  const inner = /^《(.+)》$/.exec(input);
  return `\u300A${(inner ? inner[1] : input).trim()}\u300B`;
}

// src/modules/books/extractCard.ts
var import_obsidian8 = require("obsidian");

// src/core/time.ts
var import_obsidian7 = require("obsidian");
var momentFactory = import_obsidian7.moment;
function normalizeDateTimeFormat(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return candidate || DEFAULT_DATETIME_FORMAT;
}
function nowStamp(format) {
  return momentFactory().format(normalizeDateTimeFormat(format));
}
function nowStampAndUid(format) {
  const now = momentFactory();
  return {
    stamp: now.format(normalizeDateTimeFormat(format)),
    uid: Number(now.format(UID_FORMAT))
  };
}
function nowLocalDateTimeParts(format) {
  const now = momentFactory();
  return {
    date: now.format(DAY_FORMAT),
    time: now.format("HH:mm"),
    datetime: now.format(normalizeDateTimeFormat(format))
  };
}
function today() {
  return momentFactory().format(DAY_FORMAT);
}
function dayText(value) {
  var _a;
  if (value === null || value === void 0) return null;
  if (value instanceof Date) {
    const time = value.getTime();
    const parsed = momentFactory(time);
    return Number.isNaN(time) || !parsed.isValid() ? null : parsed.format(DAY_FORMAT);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const parsed = momentFactory(value);
    return parsed.isValid() ? parsed.format(DAY_FORMAT) : null;
  }
  const text3 = String(value).trim();
  const day = (_a = /^\d{4}-\d{2}-\d{2}/.exec(text3)) == null ? void 0 : _a[0];
  if (!day) return null;
  return momentFactory(day, DAY_FORMAT, true).isValid() ? day : null;
}
function dayOfMillis(millis) {
  return momentFactory(millis).format(DAY_FORMAT);
}
function dayOfTitle(title) {
  return momentFactory(title, DAY_FORMAT, true).isValid() ? title : null;
}
function shiftDay(day, amount, unit) {
  const parsed = momentFactory(day, DAY_FORMAT, true);
  if (!parsed.isValid()) return day;
  return parsed.add(amount, unit).format(DAY_FORMAT);
}
function daysBetween(from, to) {
  if (!from || !to) return null;
  const start = momentFactory(from, DAY_FORMAT, true);
  const end = momentFactory(to, DAY_FORMAT, true);
  if (!start.isValid() || !end.isValid()) return null;
  return Math.round(end.diff(start, "days"));
}
function currentPeriodTitle(period) {
  return momentFactory().format(period.titleFormat);
}
function periodStartOf(period, title) {
  const parsed = momentFactory(title, period.titleFormat, true);
  if (!parsed.isValid()) return null;
  return parsed.startOf(period.startOfUnit).format(DAY_FORMAT);
}
function periodNeighbours(period, title, parentPeriod) {
  const parsed = momentFactory(title, period.titleFormat, true);
  if (!parsed.isValid()) return null;
  const prev = parsed.clone().subtract(1, period.stepUnit).format(period.titleFormat);
  const next = parsed.clone().add(1, period.stepUnit).format(period.titleFormat);
  if (!parentPeriod) return { prev, next, parent: null };
  const anchor = parsed.clone().startOf(period.startOfUnit);
  const parent = (period.key === "weekly" ? anchor.add(3, "days") : anchor).format(
    parentPeriod.titleFormat
  );
  return { prev, next, parent };
}
function titleOfDay(day, period) {
  const parsed = momentFactory(day, DAY_FORMAT, true);
  return parsed.isValid() ? parsed.format(period.titleFormat) : null;
}

// src/modules/books/identity.ts
function isBookMoc(ctx, file) {
  var _a, _b;
  const declared = (_b = (_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.type];
  const values = Array.isArray(declared) ? declared : [declared];
  return values.some((value) => String(value != null ? value : "").trim() === NOTE_TYPES.book);
}
function bookNameOf(file) {
  var _a, _b;
  const folderName2 = (_b = (_a = file.parent) == null ? void 0 : _a.name) != null ? _b : "";
  if (folderName2) return folderName2;
  return file.basename.startsWith(MOC_PREFIX) ? file.basename.slice(MOC_PREFIX.length) : file.basename;
}
function allBookMocs(ctx) {
  const matched = [];
  for (const file of ctx.app.vault.getMarkdownFiles()) {
    if (isSystemPath(file.path)) continue;
    if (isBookMoc(ctx, file)) matched.push(file);
  }
  return matched.sort((left, right) => bookNameOf(left).localeCompare(bookNameOf(right), "zh"));
}
function isArchivedBook(ctx, file) {
  return isInFolder(file.path, normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives));
}

// src/modules/books/templates.ts
function highlightLines(highlight) {
  const lines = [];
  if (highlight.text) {
    lines.push(BOOK_CALLOUTS.highlight, `> ${highlight.text}`);
    for (const thought of highlight.thoughts) {
      lines.push(`> ${BOOK_CALLOUTS.thought}`, `> > ${thought}`);
    }
  } else {
    for (const thought of highlight.thoughts) {
      lines.push(BOOK_CALLOUTS.thought, `> ${thought}`);
    }
  }
  lines.push("");
  return lines;
}
function thoughtLines(thought) {
  return [`> ${BOOK_CALLOUTS.thought}`, `> > ${thought}`];
}
function legacyThoughtLine(thought) {
  return `	- ${BOOK_THOUGHT_PREFIX}${thought}`;
}
function chapterHeadingLine(chapter) {
  return `${BOOK_CHAPTER_PREFIX}${chapter}`;
}
function toYamlString(value) {
  return JSON.stringify(String(value));
}
function excerptCardContent(options) {
  const values = {
    aliases: "aliases:",
    description: options.description ? `description: ${toYamlString(options.description)}` : "description:",
    created: `created: ${options.created}`,
    updated: "updated:",
    tags: "tags:",
    UID: `UID: ${options.uid}`,
    rating: "rating:",
    author: "author:",
    source: "source:",
    // up 是列表类型（一张卡片可以同时属于多个 MOC），与 cardInit 首次登记同形
    up: `up:
  - ${toYamlString(options.upLink)}`
  };
  const quoteLines = options.quote.split("\n").map((line) => line.trim() ? `> ${line.trim()}` : ">");
  return [
    "---",
    ...CARD_FIELDS.map((field2) => values[field2]),
    "---",
    "",
    ...quoteLines,
    "",
    ""
  ].join("\n");
}

// src/modules/books/extractCard.ts
var MESSAGES2 = {
  notBookMoc: "\u300C\u6458\u6210\u5361\u7247\u300D\u53EA\u80FD\u5728\u4E00\u672C\u4E66\u7684\u603B\u89C8\u9875\u4E0A\u7528\u3002\u5148\u6253\u5F00\u90A3\u672C\u4E66\u6587\u4EF6\u5939\u91CC MOC- \u5F00\u5934\u7684\u90A3\u4E00\u7BC7\u3002",
  readingMode: "\u73B0\u5728\u662F\u9605\u8BFB\u6A21\u5F0F\uFF0C\u9009\u4E2D\u7684\u5B57\u63D2\u4EF6\u8BFB\u4E0D\u5230\u3002\u6309 Cmd/Ctrl + E \u5207\u56DE\u7F16\u8F91\u6A21\u5F0F\uFF0C\u91CD\u65B0\u9009\u4E2D\u518D\u8BD5\u3002",
  noSelection: "\u5148\u9009\u4E2D\u4E00\u6BB5\u5212\u7EBF\uFF0C\u518D\u8FD0\u884C\u300C\u6458\u6210\u5361\u7247\u300D\u3002",
  namePrompt: "\u8FD9\u5F20\u5361\u7247\u53EB\u4EC0\u4E48\u540D\u5B57\uFF1F",
  nameMissing: "\u672A\u8F93\u5165\u5361\u7247\u540D\u79F0\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002",
  nameIllegal: "\u5361\u7247\u540D\u79F0\u4E0D\u80FD\u5305\u542B\u659C\u6760\u6216\u53CD\u659C\u6760\u3002",
  /**
   * 概述这一问的标题必须写明「选填，Esc 跳过」。
   *
   * 建书那三问里 Esc 就是跳过，两条流程隔着几十秒、同属读书模块；
   * 这里若让 Esc 变成「整张卡片作废」，学员会照着刚学会的手势把自己的卡片按没——
   * 而他还得回去重新选中那段划线、重新起名。名称那一问才是取消点，这一问不是。
   */
  descriptionPrompt: "\u8FD9\u5F20\u5361\u7247\u8BB2\u4EC0\u4E48\uFF1F\uFF08\u9009\u586B\uFF0CEsc \u8DF3\u8FC7\uFF09",
  existsPrefix: "\u540C\u540D\u5361\u7247\u5DF2\u7ECF\u5B58\u5728\uFF0C\u672A\u6267\u884C\u8986\u76D6\uFF1A",
  createdPrefix: "\u5361\u7247\u5DF2\u521B\u5EFA\uFF1A",
  failedPrefix: "\u6458\u6210\u5361\u7247\u5931\u8D25\uFF1A"
};
function registerExcerptCardCommand(ctx) {
  ctx.commands.register(BOOK_COMMANDS.excerpt, () => {
    void excerptCard(ctx);
  });
}
async function excerptCard(ctx) {
  var _a, _b, _c;
  const { app } = ctx;
  try {
    const view = app.workspace.getActiveViewOfType(import_obsidian8.MarkdownView);
    const mocFile = (_a = view == null ? void 0 : view.file) != null ? _a : null;
    if (!view || !mocFile || !isBookMoc(ctx, mocFile)) {
      new import_obsidian8.Notice(MESSAGES2.notBookMoc);
      return;
    }
    const selection = view.editor.getSelection().trim();
    if (!selection) {
      new import_obsidian8.Notice(view.getMode() === "preview" ? MESSAGES2.readingMode : MESSAGES2.noSelection);
      return;
    }
    const nameInput = await new TextInputModal(app, {
      title: MESSAGES2.namePrompt
    }).openAndGetValue();
    if (nameInput === null || !nameInput.trim()) {
      new import_obsidian8.Notice(MESSAGES2.nameMissing);
      return;
    }
    const cardName = nameInput.trim();
    if (/[\\/]/.test(cardName)) {
      new import_obsidian8.Notice(MESSAGES2.nameIllegal);
      return;
    }
    const descriptionInput = await new TextInputModal(app, {
      title: MESSAGES2.descriptionPrompt
    }).openAndGetValue();
    const folderPath = (_c = (_b = mocFile.parent) == null ? void 0 : _b.path) != null ? _c : "";
    const cardPath = (0, import_obsidian8.normalizePath)(
      folderPath ? `${folderPath}/${cardName}.md` : `${cardName}.md`
    );
    if (app.vault.getAbstractFileByPath(cardPath)) {
      new import_obsidian8.Notice(MESSAGES2.existsPrefix + cardPath);
      return;
    }
    const { stamp: created, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
    const content = excerptCardContent({
      description: (descriptionInput != null ? descriptionInput : "").trim(),
      created,
      uid,
      upLink: `[[${mocFile.path.slice(0, -3)}|${bookNameOf(mocFile)}]]`,
      quote: selection
    });
    ctx.guard.mark(cardPath);
    const card = await app.vault.create(cardPath, content);
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(card, { active: true, state: { mode: "source" } });
    if (leaf.view instanceof import_obsidian8.MarkdownView) {
      const editor = leaf.view.editor;
      const lastLine = editor.lineCount() - 1;
      editor.setCursor({ line: lastLine, ch: 0 });
      editor.focus();
    }
    new import_obsidian8.Notice(MESSAGES2.createdPrefix + cardName);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian8.Notice(MESSAGES2.failedPrefix + message2);
  }
}

// src/modules/books/importHighlights.ts
var import_obsidian9 = require("obsidian");

// src/modules/books/highlightIdentity.ts
function flattenHighlight(highlight) {
  return {
    chapter: highlight.chapter.replace(/\s+/g, " ").trim(),
    text: highlight.text.replace(/\s+/g, " ").trim(),
    thoughts: highlight.thoughts.map((thought) => thought.replace(/\s+/g, " ").trim()).filter(Boolean)
  };
}
function normalizedHighlightKey(text3) {
  let normalized = text3;
  let previous = "";
  while (normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/~~(.+?)~~/g, "$1").replace(/==(.+?)==/g, "$1").replace(/`([^`\n]+)`/g, "$1");
  }
  return normalized.replace(/\s/g, "");
}
function highlightKey(highlight) {
  var _a;
  if (highlight.text) return normalizedHighlightKey(highlight.text);
  const thoughtKey = normalizedHighlightKey((_a = highlight.thoughts[0]) != null ? _a : "");
  return thoughtKey ? BOOK_THOUGHT_PREFIX.trim() + thoughtKey : "";
}
function coalesceHighlights(incoming) {
  const collected = /* @__PURE__ */ new Map();
  for (const raw of incoming) {
    const highlight = flattenHighlight(raw);
    const key = highlightKey(highlight);
    if (!key) continue;
    const existing = collected.get(key);
    if (!existing) {
      collected.set(key, {
        highlight,
        thoughtKeys: new Set(highlight.thoughts.map(normalizedHighlightKey))
      });
      continue;
    }
    const thoughts = [...existing.highlight.thoughts];
    for (const thought of highlight.thoughts) {
      const thoughtKey = normalizedHighlightKey(thought);
      if (!thoughtKey || existing.thoughtKeys.has(thoughtKey)) continue;
      existing.thoughtKeys.add(thoughtKey);
      thoughts.push(thought);
    }
    existing.highlight = {
      ...existing.highlight,
      chapter: existing.highlight.chapter || highlight.chapter,
      thoughts
    };
  }
  return [...collected.values()].map(({ highlight }) => highlight);
}

// src/modules/books/parsers.ts
var KINDLE_SEPARATOR = /^={6,}\s*$/;
var APPLE_MARKER = /^(?:摘录来自|Excerpt From)[:：]?\s*(.*)$/;
function parseHighlightExport(raw) {
  const text3 = raw.replace(/[﻿￼]/g, "").replace(/\r\n?/g, "\n");
  const lines = text3.split("\n");
  if (lines.some((line) => KINDLE_SEPARATOR.test(line.trim()))) {
    return {
      source: "kindle",
      sourceLabel: "Kindle\uFF08My Clippings\uFF09",
      books: parseKindle(lines)
    };
  }
  if (lines.some((line) => APPLE_MARKER.test(line.trim()))) {
    return { source: "apple", sourceLabel: "\u82F9\u679C\u56FE\u4E66", books: parseApple(lines) };
  }
  const books = parseWeread(lines).filter((book) => book.highlights.length);
  return books.length ? { source: "weread", sourceLabel: "\u5FAE\u4FE1\u8BFB\u4E66", books } : null;
}
var WEREAD_COUNT = /^\d+个笔记$/;
var WEREAD_THOUGHT_NEW = /^◆\s*\d{4}\/\d{1,2}\/\d{1,2}发表想法[:：]?$/;
var WEREAD_THOUGHT_OLD = /^\d{4}\/\d{1,2}\/\d{1,2}\s+发表想法[:：]?$/;
var WEREAD_RATING = /^◆\s*\d{4}\/\d{1,2}\/\d{1,2}\s+认为/;
var WEREAD_QUOTE = /^原文[:：]\s*(.*)$/;
var WEREAD_SIGNATURE = /^--\s*来自微信读书$/;
function parseWeread(lines) {
  var _a;
  const trimmed = lines.map((line) => line.trim());
  const headerIndexes = [];
  for (let cursor = 0; cursor < trimmed.length; cursor += 1) {
    if (!/^《.+》$/.test(trimmed[cursor])) continue;
    const lookahead = trimmed.slice(cursor + 1, cursor + 5);
    if (lookahead.some((line) => WEREAD_COUNT.test(line))) headerIndexes.push(cursor);
  }
  if (!headerIndexes.length) {
    const hasMarkers = trimmed.some((line) => line.startsWith("\u25C6") || line.startsWith(">>"));
    return hasMarkers ? [parseWereadBook(trimmed, 0, trimmed.length, "", "")] : [];
  }
  const books = [];
  for (let index = 0; index < headerIndexes.length; index += 1) {
    const start = headerIndexes[index];
    const end = (_a = headerIndexes[index + 1]) != null ? _a : trimmed.length;
    const title = trimmed[start].replace(/^《|》$/g, "").trim();
    let author = "";
    let bodyStart = start + 1;
    for (let cursor = start + 1; cursor < end; cursor += 1) {
      const line = trimmed[cursor];
      if (!line) continue;
      if (WEREAD_COUNT.test(line)) {
        bodyStart = cursor + 1;
        break;
      }
      if (!author) author = line;
    }
    books.push(parseWereadBook(trimmed, bodyStart, end, title, author));
  }
  return books;
}
function parseWereadBook(trimmed, start, end, title, author) {
  const oldStyle = hasOldStyleMarkers(trimmed, start, end);
  const highlights = oldStyle ? parseWereadOld(trimmed, start, end) : parseWereadNew(trimmed, start, end);
  return { title, author, highlights: dedupeWereadHighlights(highlights) };
}
function hasOldStyleMarkers(trimmed, start, end) {
  for (let cursor = start; cursor < end; cursor += 1) {
    if (trimmed[cursor].startsWith(">>")) return true;
  }
  return false;
}
function parseWereadOld(trimmed, start, end) {
  const highlights = [];
  let chapter = "";
  let inRatingSection = false;
  let pendingThought = [];
  let current = null;
  const flush = () => {
    if (!current) return;
    const thought = pendingThought.join(" ").trim();
    highlights.push({
      chapter,
      text: current.join(" ").trim(),
      thoughts: thought ? [thought] : []
    });
    pendingThought = [];
    current = null;
  };
  for (let cursor = start; cursor < end; cursor += 1) {
    const line = trimmed[cursor];
    if (!line || WEREAD_SIGNATURE.test(line)) {
      flush();
      continue;
    }
    if (line.startsWith("\u25C6")) {
      flush();
      const body = line.replace(/^◆\s*/, "");
      inRatingSection = body === "\u70B9\u8BC4";
      if (!inRatingSection) chapter = body;
      continue;
    }
    if (inRatingSection) continue;
    if (WEREAD_THOUGHT_OLD.test(line)) {
      flush();
      continue;
    }
    if (line.startsWith(">>")) {
      flush();
      current = [line.replace(/^>>\s*/, "")];
      continue;
    }
    if (current) current.push(line);
    else pendingThought.push(line);
  }
  flush();
  return highlights;
}
function parseWereadNew(trimmed, start, end) {
  const highlights = [];
  let chapter = "";
  let beforeFirstChapter = true;
  let current = null;
  let thought = null;
  let blanks = 0;
  const flushHighlight = () => {
    if (!current) return;
    highlights.push({ chapter, text: current.join(" ").trim(), thoughts: [] });
    current = null;
  };
  const flushThought = () => {
    if (!thought) return;
    const written = thought.paragraphs.join(" ").trim();
    highlights.push({
      chapter,
      text: thought.quote.join(" ").trim(),
      thoughts: written ? [written] : []
    });
    thought = null;
  };
  for (let cursor = start; cursor < end; cursor += 1) {
    const line = trimmed[cursor];
    if (!line) {
      blanks += 1;
      continue;
    }
    const leadingBlanks = blanks;
    blanks = 0;
    if (WEREAD_SIGNATURE.test(line)) {
      flushHighlight();
      flushThought();
      continue;
    }
    if (line === "\u70B9\u8BC4" || WEREAD_RATING.test(line)) {
      flushHighlight();
      flushThought();
      continue;
    }
    if (WEREAD_THOUGHT_NEW.test(line)) {
      flushHighlight();
      flushThought();
      thought = { paragraphs: [], quote: [] };
      continue;
    }
    if (line.startsWith("\u25C6")) {
      flushHighlight();
      flushThought();
      current = [line.replace(/^◆\s*/, "")];
      continue;
    }
    const quoteMatch = WEREAD_QUOTE.exec(line);
    if (thought) {
      const continues = quoteMatch ? true : thought.quote.length ? leadingBlanks === 0 : leadingBlanks <= 1;
      if (continues) {
        if (quoteMatch) thought.quote.push(quoteMatch[1]);
        else if (thought.quote.length) thought.quote.push(line);
        else thought.paragraphs.push(line);
        continue;
      }
      flushThought();
    }
    if (current && leadingBlanks <= 1) {
      current.push(line);
      continue;
    }
    if (leadingBlanks >= 2 || beforeFirstChapter) {
      flushHighlight();
      chapter = line;
      beforeFirstChapter = false;
      continue;
    }
    flushHighlight();
  }
  flushHighlight();
  flushThought();
  return highlights;
}
function dedupeWereadHighlights(highlights) {
  const seen = /* @__PURE__ */ new Map();
  const merged = [];
  for (const highlight of highlights) {
    const key = highlight.text.replace(/\s+/g, "");
    if (!key && !highlight.thoughts.length) continue;
    const existingIndex = key ? seen.get(key) : void 0;
    if (existingIndex === void 0) {
      if (key) seen.set(key, merged.length);
      merged.push(highlight);
      continue;
    }
    const existing = merged[existingIndex];
    const fresh = highlight.thoughts.filter(
      (candidate) => !existing.thoughts.some((had) => had === candidate)
    );
    if (fresh.length) {
      merged[existingIndex] = { ...existing, thoughts: [...existing.thoughts, ...fresh] };
    }
  }
  return merged;
}
var KINDLE_KINDS = [
  { pattern: /的标注|我的标注|Highlight|剪贴文章/i, kind: "highlight" },
  { pattern: /的笔记|我的笔记|Note/i, kind: "note" },
  { pattern: /的书签|我的书签|Bookmark/i, kind: "bookmark" }
];
var KINDLE_CLIP_LIMIT = /^[<＜].+[>＞]$/;
function parseKindle(lines) {
  const entries = [];
  let block = [];
  for (const line of lines) {
    if (KINDLE_SEPARATOR.test(line.trim())) {
      const entry = parseKindleBlock(block);
      if (entry) entries.push(entry);
      block = [];
      continue;
    }
    block.push(line);
  }
  const tail = parseKindleBlock(block);
  if (tail) entries.push(tail);
  return groupKindleEntries(entries);
}
function parseKindleBlock(block) {
  var _a;
  const meaningful = block.map((line) => line.trim()).filter((line) => line.length > 0);
  if (meaningful.length < 2) return null;
  const [titleLine, metaLine, ...content] = meaningful;
  if (!metaLine.startsWith("- ")) return null;
  const kind = (_a = KINDLE_KINDS.find((candidate) => candidate.pattern.test(metaLine))) == null ? void 0 : _a.kind;
  if (!kind) return null;
  const authorMatch = /^(.*?)[（(]([^（()）]*)[)）]\s*$/.exec(titleLine);
  const title = (authorMatch ? authorMatch[1] : titleLine).trim();
  const author = (authorMatch ? authorMatch[2] : "").trim();
  const text3 = content.join(" ").trim();
  if (KINDLE_CLIP_LIMIT.test(text3)) return null;
  return {
    title,
    author,
    kind,
    // 「位置 #100-102」「位置100-102」「Location 100-102」「at location 98-99」都认
    location: spanOf(/(?:位置\s*#?\s*|location\s+)(\d+)(?:\s*-\s*(\d+))?/i, metaLine),
    // 「第 25 页」「on page ix」「page 14-14」；罗马数字页码取不到数值，按「没有页码」处理
    page: spanOf(/(?:第\s*(\d+)(?:\s*-\s*(\d+))?\s*页|page\s+(\d+)(?:\s*-\s*(\d+))?)/i, metaLine),
    text: text3
  };
}
function spanOf(pattern, metaLine) {
  var _a, _b;
  const matched = pattern.exec(metaLine);
  if (!matched) return null;
  const rawStart = (_a = matched[1]) != null ? _a : matched[3];
  const rawEnd = (_b = matched[2]) != null ? _b : matched[4];
  if (rawStart === void 0) return null;
  const start = Number(rawStart);
  return { start, end: rawEnd === void 0 ? start : Number(rawEnd) };
}
function groupKindleEntries(entries) {
  var _a;
  const books = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    if (entry.kind === "bookmark" || !entry.text) continue;
    const bucket = (_a = books.get(entry.title)) != null ? _a : { author: entry.author, entries: [] };
    if (!books.has(entry.title)) books.set(entry.title, bucket);
    if (!bucket.author && entry.author) bucket.author = entry.author;
    bucket.entries.push(entry);
  }
  return [...books.entries()].map(([title, bucket]) => ({
    title,
    author: bucket.author,
    highlights: attachKindleNotes(bucket.entries)
  }));
}
function attachKindleNotes(entries) {
  const highlights = [];
  const slots = [];
  const notes = [];
  for (const entry of entries) {
    if (entry.kind === "note") {
      notes.push(entry);
      continue;
    }
    highlights.push({ chapter: "", text: entry.text, thoughts: [] });
    slots.push({ entry, slot: highlights.length - 1 });
  }
  for (const note of notes) {
    const host = slots.find((candidate) => covers(candidate.entry, note));
    if (host) highlights[host.slot].thoughts.push(note.text);
    else highlights.push({ chapter: "", text: "", thoughts: [note.text] });
  }
  return highlights;
}
function covers(highlight, note) {
  if (highlight.location && note.location) return within(highlight.location, note.location.start);
  if (!highlight.location && !note.location && highlight.page && note.page) {
    return within(highlight.page, note.page.start);
  }
  return false;
}
function within(span, point) {
  return point >= span.start && point <= Math.max(span.end, span.start);
}
var APPLE_COPYRIGHT = /此材料(?:可能)?受版权保护|This material may be protected by copyright/;
function parseApple(lines) {
  var _a;
  const trimmed = lines.map((line) => line.trim());
  const books = /* @__PURE__ */ new Map();
  let pending2 = [];
  for (let cursor = 0; cursor < trimmed.length; cursor += 1) {
    const line = trimmed[cursor];
    const marker = APPLE_MARKER.exec(line);
    if (!marker) {
      if (line) pending2.push(line);
      continue;
    }
    let title = marker[1].trim();
    let author = "";
    while (cursor + 1 < trimmed.length) {
      const candidate = trimmed[cursor + 1];
      if (!candidate) {
        cursor += 1;
        continue;
      }
      if (APPLE_COPYRIGHT.test(candidate)) {
        cursor += 1;
        break;
      }
      if (/^https?:\/\//.test(candidate)) {
        cursor += 1;
        continue;
      }
      if (!title) {
        title = candidate;
        cursor += 1;
        continue;
      }
      if (!author) {
        author = candidate;
        cursor += 1;
        continue;
      }
      break;
    }
    const text3 = stripQuotes(pending2.join(" ").trim());
    pending2 = [];
    if (!text3) continue;
    const key = stripBookBraces(title);
    const bucket = (_a = books.get(key)) != null ? _a : { author, highlights: [] };
    if (!books.has(key)) books.set(key, bucket);
    if (!bucket.author && author) bucket.author = author;
    bucket.highlights.push({ chapter: "", text: text3, thoughts: [] });
  }
  return [...books.entries()].map(([title, bucket]) => ({
    title,
    author: bucket.author,
    highlights: bucket.highlights
  }));
}
function stripQuotes(text3) {
  return text3.replace(/^[“”"'「『]+/, "").replace(/[“”"'」』]+$/, "").trim();
}
function stripBookBraces(title) {
  const inner = /^《(.+)》$/.exec(title.trim());
  return inner ? inner[1].trim() : title.trim();
}

// src/modules/books/importHighlights.ts
var MESSAGES3 = {
  noBooks: "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u8BFB\u4E66\u7B14\u8BB0\u3002\u5148\u8FD0\u884C\u300C\u65B0\u5EFA\u8BFB\u4E66\u7B14\u8BB0\u300D\u5EFA\u4E00\u672C\uFF0C\u518D\u6765\u5BFC\u5165\u3002",
  pickBook: "\u5BFC\u5165\u5230\u54EA\u672C\u4E66\uFF1F",
  pasteTitle: "\u7C98\u8D34\u5212\u7EBF",
  pasteHint: "\u628A\u4ECE\u5FAE\u4FE1\u8BFB\u4E66\uFF08\u7B14\u8BB0\u9875 \u2192 \u5206\u4EAB \u2192 \u590D\u5236\u5230\u526A\u8D34\u677F\uFF09\u3001Kindle\uFF08My Clippings.txt \u5168\u6587\uFF09\u6216\u82F9\u679C\u56FE\u4E66\uFF08\u9009\u4E2D\u5212\u7EBF\u540E\u590D\u5236\uFF09\u5F97\u5230\u7684\u6587\u672C\u539F\u6837\u7C98\u8D34\u8FDB\u6765\uFF0CCmd/Ctrl+Enter \u6216\u70B9\u786E\u8BA4\u63D0\u4EA4\u3002",
  pastePlaceholder: "\u5728\u6B64\u7C98\u8D34\u2026\u2026",
  pasteEmpty: "\u6CA1\u6709\u7C98\u8D34\u4EFB\u4F55\u5185\u5BB9\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002",
  unrecognized: "\u8BA4\u4E0D\u51FA\u8FD9\u6BB5\u6587\u672C\u7684\u6765\u6E90\u3002\u76EE\u524D\u652F\u6301\u4E09\u79CD\u5B98\u65B9\u5BFC\u51FA\uFF1A\u5FAE\u4FE1\u8BFB\u4E66\uFF08\u5206\u4EAB \u2192 \u590D\u5236\u5230\u526A\u8D34\u677F\uFF09\u3001Kindle \u7684 My Clippings.txt\u3001\u82F9\u679C\u56FE\u4E66\u7684\u9009\u4E2D\u590D\u5236\u3002\u5177\u4F53\u5BFC\u51FA\u65B9\u6CD5\u89C1\u5E93\u6839\u7684 README\u3002",
  pickParsedBook: "\u7C98\u8D34\u91CC\u6709\u597D\u51E0\u672C\u4E66\u7684\u5212\u7EBF\uFF0C\u5BFC\u5165\u54EA\u4E00\u672C\uFF1F",
  /**
   * 取消一律出声，一句话管三个取消点（选书、粘贴、选粘贴里的哪本书）。
   *
   * 这是仓库的既有惯例——建项目连「没输名字」都要说一句「操作已取消」——
   * 而它在这条流程上格外要紧：学员可能刚粘完几百 KB 的 My Clippings，
   * 屏幕上什么都不发生的话，他分不出「取消了」和「插件卡死了」。
   * 补一句剪贴板还在，是因为那正是他此刻最想知道的下一步。
   */
  cancelled: "\u5DF2\u53D6\u6D88\uFF0C\u6CA1\u6709\u5199\u5165\u4EFB\u4F55\u5185\u5BB9\u3002\u521A\u624D\u590D\u5236\u7684\u4E1C\u897F\u8FD8\u5728\u526A\u8D34\u677F\u91CC\uFF0C\u53EF\u4EE5\u76F4\u63A5\u518D\u6765\u4E00\u6B21\u3002",
  emptyBook: "\u89E3\u6790\u6210\u529F\uFF0C\u4F46\u8FD9\u672C\u4E66\u91CC\u6CA1\u6709\u4E00\u6761\u5212\u7EBF\u3002",
  /**
   * 认得出来源、却一条划线都没解析到。
   *
   * 与「认不出来源」必须是两句话：一份只含书签的 My Clippings 认得出是 Kindle，
   * 只是里面没有可导入的东西；告诉他「认不出」，他会去怀疑自己复制错了，
   * 而真正的原因是那份导出里本来就没有划线。
   */
  recognizedButEmptyPrefix: "\u8BA4\u51FA\u8FD9\u662F",
  recognizedButEmptySuffix: "\u7684\u5BFC\u51FA\uFF0C\u4F46\u91CC\u9762\u6CA1\u6709\u53EF\u4EE5\u5BFC\u5165\u7684\u5212\u7EBF\uFF08\u4E66\u7B7E\u3001\u7A7A\u6761\u76EE\u4E0E\u53D7\u7248\u6743\u4FDD\u62A4\u7684\u5360\u4F4D\u53E5\u4E0D\u7B97\uFF09\u3002",
  /** 归档过的书仍可导入（给读完的书补录划线是正当动作），但清单上要认得出来 */
  archivedSuffix: "\uFF08\u5DF2\u5F52\u6863\uFF09",
  unknownTitle: "\uFF08\u8FD9\u6BB5\u6587\u672C\u91CC\u6CA1\u6709\u4E66\u540D\uFF09",
  titleMismatch: "\u8FD9\u6BB5\u5212\u7EBF\u770B\u8D77\u6765\u4E0D\u662F\u8FD9\u672C\u4E66\u7684\u3002\u5199\u5165\u4E0D\u53EF\u64A4\u9500\uFF0C\u8BF7\u5148\u786E\u8BA4\u3002",
  failedPrefix: "\u5BFC\u5165\u5212\u7EBF\u5931\u8D25\uFF1A"
};
function registerImportHighlightsCommand(ctx) {
  ctx.commands.register(BOOK_COMMANDS.importNotes, () => {
    void runImport(ctx);
  });
}
async function runImport(ctx) {
  var _a;
  try {
    const target = await resolveTargetBook(ctx);
    if (!target) {
      if (allBookMocs(ctx).length) new import_obsidian9.Notice(MESSAGES3.cancelled);
      return;
    }
    const raw = await new TextAreaModal(ctx.app, {
      title: `${MESSAGES3.pasteTitle} \u2192 \u300A${stripBraces(bookNameOf(target))}\u300B`,
      hint: MESSAGES3.pasteHint,
      placeholder: MESSAGES3.pastePlaceholder
    }).openAndGetValue();
    if (raw === null) {
      new import_obsidian9.Notice(MESSAGES3.cancelled);
      return;
    }
    if (!raw.trim()) {
      new import_obsidian9.Notice(MESSAGES3.pasteEmpty);
      return;
    }
    const parsed = parseHighlightExport(raw);
    if (!parsed) {
      new import_obsidian9.Notice(MESSAGES3.unrecognized, 1e4);
      return;
    }
    if (!parsed.books.length) {
      new import_obsidian9.Notice(
        MESSAGES3.recognizedButEmptyPrefix + parsed.sourceLabel + MESSAGES3.recognizedButEmptySuffix,
        1e4
      );
      return;
    }
    const book = await resolveParsedBook(ctx, parsed.books);
    if (!book) {
      new import_obsidian9.Notice(MESSAGES3.cancelled);
      return;
    }
    if (!book.highlights.length) {
      new import_obsidian9.Notice(MESSAGES3.emptyBook);
      return;
    }
    const targetName = bookNameOf(target);
    const preview = mergeHighlights(await ctx.app.vault.read(target), book.highlights);
    if (!preview.added && !preview.attachedThoughts) {
      new import_obsidian9.Notice(
        `\u6CA1\u6709\u65B0\u589E\u5185\u5BB9\uFF1A${book.highlights.length} \u6761\u5212\u7EBF\u5168\u90FD\u5DF2\u7ECF\u5728${targetName}\u91CC\u3002`
      );
      return;
    }
    const confirmed = await new ImportConfirmModal(ctx.app, {
      sourceLabel: parsed.sourceLabel,
      parsedTitle: book.title,
      targetName,
      preview
    }).openAndGetChoice();
    if (!confirmed) return;
    if (((_a = ctx.app.workspace.getActiveFile()) == null ? void 0 : _a.path) !== target.path) {
      await ctx.app.workspace.getLeaf(false).openFile(target, { active: true });
    }
    let outcome = null;
    await ctx.app.vault.process(target, (content) => {
      const merged = mergeHighlights(content, book.highlights);
      outcome = merged;
      if (merged.content === content) return content;
      ctx.guard.mark(target.path);
      return merged.content;
    });
    if (!outcome) throw new Error("\u5212\u7EBF\u5408\u5E76\u6CA1\u6709\u8FD4\u56DE\u7ED3\u679C");
    new import_obsidian9.Notice(describeImported(outcome, targetName));
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian9.Notice(MESSAGES3.failedPrefix + message2);
  }
}
function describeImported(outcome, targetName) {
  if (!outcome.added && !outcome.attachedThoughts) {
    return `\u786E\u8BA4\u671F\u95F4${targetName}\u5DF2\u88AB\u5176\u4ED6\u540C\u6B65\u8865\u9F50\uFF0C\u6CA1\u6709\u91CD\u590D\u5199\u5165\u3002`;
  }
  const parts = [];
  if (outcome.added) parts.push(`${outcome.added} \u6761\u5212\u7EBF`);
  if (outcome.attachedThoughts) parts.push(`${outcome.attachedThoughts} \u6761\u60F3\u6CD5`);
  return `\u5DF2\u5BFC\u5165 ${parts.join(" \u4E0E ")}\u5230${targetName}\u3002`;
}
async function resolveTargetBook(ctx) {
  const active = ctx.app.workspace.getActiveFile();
  if (active && isBookMoc(ctx, active)) return active;
  const books = allBookMocs(ctx);
  if (!books.length) {
    new import_obsidian9.Notice(MESSAGES3.noBooks);
    return null;
  }
  return new ChoiceModal(ctx.app, {
    title: MESSAGES3.pickBook,
    items: books,
    // 归档的书照样能选（给读完的书补录划线是正当动作），但要一眼认得出来
    labelOf: (file) => isArchivedBook(ctx, file) ? `${bookNameOf(file)}${MESSAGES3.archivedSuffix}` : bookNameOf(file)
  }).openAndGetChoice();
}
async function resolveParsedBook(ctx, books) {
  if (books.length === 1) return books[0];
  return new ChoiceModal(ctx.app, {
    title: MESSAGES3.pickParsedBook,
    items: books,
    labelOf: (book) => `${book.title || "\uFF08\u6CA1\u6709\u4E66\u540D\uFF09"}\u3000\u2014\u3000${book.highlights.length} \u6761`
  }).openAndGetChoice();
}
function stripBraces(name) {
  const inner = /^《(.+)》$/.exec(name);
  return inner ? inner[1] : name;
}
function normalizedTitle(name) {
  return stripBraces(name.trim()).replace(/\s+/g, "");
}
var SECTION_BOUNDARY = /^#{1,2}\s/;
function isCalloutHead(line, callout, depth = 0) {
  return line.trim().startsWith("> ".repeat(depth) + callout);
}
function stripQuote(line, depth) {
  let body = line.trim();
  for (let level = 0; level < depth; level += 1) {
    body = body.replace(/^>\s?/, "");
  }
  return body.trim();
}
var THOUGHT_MARKER = BOOK_THOUGHT_PREFIX.trim();
var TOP_BULLET = /^- /;
var NESTED_BULLET = /^[ \t]+- /;
function mergeHighlights(content, incoming) {
  var _a, _b, _c, _d;
  const highlights = coalesceHighlights(incoming);
  const split = splitTextLines(content);
  const lineEnding = split.lineEnding;
  let lines = split.lines;
  let headingIndex = lines.findIndex((line) => line.trim() === BOOK_HEADINGS.highlights);
  if (headingIndex < 0) {
    const rebuilt = joinTextLines(
      [content.replace(/\s*$/, ""), "", BOOK_HEADINGS.highlights, ""],
      lineEnding
    );
    lines = splitTextLines(rebuilt).lines;
    headingIndex = lines.findIndex((line) => line.trim() === BOOK_HEADINGS.highlights);
  }
  let sectionEnd = lines.length;
  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    if (SECTION_BOUNDARY.test(lines[cursor]) || isFenceLine(lines[cursor])) {
      sectionEnd = cursor;
      break;
    }
  }
  const existingHighlights = /* @__PURE__ */ new Map();
  const chapterHeadingAt = /* @__PURE__ */ new Map();
  let owner = null;
  for (let cursor = headingIndex + 1; cursor < sectionEnd; cursor += 1) {
    const raw = lines[cursor];
    if (raw.startsWith(BOOK_CHAPTER_PREFIX)) {
      chapterHeadingAt.set(
        normalizedHighlightKey(raw.slice(BOOK_CHAPTER_PREFIX.length)),
        cursor
      );
      owner = null;
      continue;
    }
    if (isCalloutHead(raw, BOOK_CALLOUTS.highlight)) {
      const body = (_a = lines[cursor + 1]) != null ? _a : "";
      owner = { line: cursor + 1, thoughts: /* @__PURE__ */ new Set(), legacy: false };
      existingHighlights.set(keyOfLineBody(stripQuote(body, 1)), owner);
      cursor += 1;
      continue;
    }
    if (isCalloutHead(raw, BOOK_CALLOUTS.thought, 1)) {
      owner == null ? void 0 : owner.thoughts.add(
        normalizedHighlightKey(stripQuote((_b = lines[cursor + 1]) != null ? _b : "", 2))
      );
      cursor += 1;
      continue;
    }
    if (isCalloutHead(raw, BOOK_CALLOUTS.thought)) {
      const body = normalizedHighlightKey(stripQuote((_c = lines[cursor + 1]) != null ? _c : "", 1));
      owner = { line: cursor + 1, thoughts: /* @__PURE__ */ new Set([body]), legacy: false };
      existingHighlights.set(body ? THOUGHT_MARKER + body : "", owner);
      cursor += 1;
      continue;
    }
    if (TOP_BULLET.test(raw)) {
      owner = { line: cursor, thoughts: /* @__PURE__ */ new Set(), legacy: true };
      existingHighlights.set(keyOfLineBody(raw.slice(2).trim()), owner);
      continue;
    }
    if (NESTED_BULLET.test(raw)) {
      owner == null ? void 0 : owner.thoughts.add(
        normalizedHighlightKey(stripThoughtPrefix(raw.replace(NESTED_BULLET, "").trim()))
      );
    }
  }
  let sectionTail = sectionEnd;
  while (sectionTail > headingIndex + 1 && lines[sectionTail - 1].trim() === "") sectionTail -= 1;
  let chapterlessTail = sectionTail;
  for (let cursor = headingIndex + 1; cursor < sectionEnd; cursor += 1) {
    if (!lines[cursor].startsWith(BOOK_CHAPTER_PREFIX)) continue;
    chapterlessTail = cursor;
    while (chapterlessTail > headingIndex + 1 && lines[chapterlessTail - 1].trim() === "") {
      chapterlessTail -= 1;
    }
    break;
  }
  const chapterTail = (headingLine) => {
    let end = sectionEnd;
    for (let cursor = headingLine + 1; cursor < sectionEnd; cursor += 1) {
      if (lines[cursor].startsWith(BOOK_CHAPTER_PREFIX) || isFenceLine(lines[cursor])) {
        end = cursor;
        break;
      }
    }
    while (end > headingLine + 1 && lines[end - 1].trim() === "") end -= 1;
    return end;
  };
  const inserts = /* @__PURE__ */ new Map();
  const bucketAt = (at) => {
    var _a2;
    const bucket = (_a2 = inserts.get(at)) != null ? _a2 : { thoughts: [], lines: [] };
    inserts.set(at, bucket);
    return bucket;
  };
  const pushThought = (at, extra) => {
    bucketAt(at).thoughts.push(...extra);
  };
  const pushInsert = (at, extra) => {
    bucketAt(at).lines.push(...extra);
  };
  const freshChapters = /* @__PURE__ */ new Map();
  let added = 0;
  let skipped = 0;
  let attachedThoughts = 0;
  for (const highlight of highlights) {
    const key = highlightKey(highlight);
    if (!key) continue;
    const existing = existingHighlights.get(key);
    if (existing) {
      skipped += 1;
      if (highlight.text && existing.line >= 0) {
        const fresh = highlight.thoughts.filter(
          (thought) => !existing.thoughts.has(normalizedHighlightKey(thought))
        );
        if (fresh.length) {
          let at = existing.line + 1;
          const rendered2 = [];
          if (existing.legacy) {
            while (at < sectionEnd && NESTED_BULLET.test(lines[at])) at += 1;
            for (const thought of fresh) rendered2.push(legacyThoughtLine(thought));
          } else {
            while (at < sectionEnd && lines[at].startsWith(">")) at += 1;
            for (const thought of fresh) rendered2.push(...thoughtLines(thought));
          }
          pushThought(at, rendered2);
          for (const thought of fresh) {
            existing.thoughts.add(normalizedHighlightKey(thought));
          }
          attachedThoughts += fresh.length;
        }
      }
      continue;
    }
    existingHighlights.set(key, {
      line: -1,
      thoughts: new Set(highlight.thoughts.map(normalizedHighlightKey)),
      legacy: false
    });
    const rendered = highlightLines(highlight);
    const chapter = highlight.chapter.trim();
    added += 1;
    if (!chapter) {
      pushInsert(chapterlessTail, rendered);
      continue;
    }
    const chapterKey = normalizedHighlightKey(chapter);
    const headingLine = chapterHeadingAt.get(chapterKey);
    if (headingLine !== void 0) {
      pushInsert(chapterTail(headingLine), rendered);
      continue;
    }
    const block = (_d = freshChapters.get(chapterKey)) != null ? _d : ["", chapterHeadingLine(chapter)];
    block.push(...rendered);
    freshChapters.set(chapterKey, block);
  }
  for (const block of freshChapters.values()) pushInsert(sectionTail, block);
  const positions = [...inserts.keys()].sort((left, right) => right - left);
  for (const at of positions) {
    const bucket = inserts.get(at);
    if (bucket) lines.splice(at, 0, ...bucket.thoughts, ...bucket.lines);
  }
  return { content: joinTextLines(lines, lineEnding), added, skipped, attachedThoughts };
}
function isFenceLine(line) {
  return line.replace(/^\s+/, "").startsWith("```");
}
function keyOfLineBody(body) {
  const marker = BOOK_THOUGHT_PREFIX.trim();
  if (body.startsWith(marker)) {
    return marker + normalizedHighlightKey(body.slice(marker.length));
  }
  return normalizedHighlightKey(body);
}
function stripThoughtPrefix(body) {
  const marker = BOOK_THOUGHT_PREFIX.trim();
  return body.startsWith(marker) ? body.slice(marker.length).trim() : body;
}
var ImportConfirmModal = class extends import_obsidian9.Modal {
  constructor(app, summary) {
    super(app);
    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    this.resolver = null;
    /** 按钮结算与关闭结算都会走到 settle，用它保证只生效一次 */
    this.settled = false;
    this.summary = summary;
  }
  /** 打开弹窗并等待授权：确认返回 true，其余一切关闭路径返回 false */
  openAndGetChoice() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.open();
    });
  }
  onOpen() {
    const { sourceLabel, parsedTitle, targetName, preview } = this.summary;
    const mismatched = !!parsedTitle && normalizedTitle(parsedTitle) !== normalizedTitle(targetName);
    this.titleEl.setText("\u786E\u8BA4\u5BFC\u5165\u5212\u7EBF");
    this.contentEl.empty();
    const summary = this.contentEl.createDiv();
    summary.style.padding = "12px 14px";
    summary.style.borderRadius = "10px";
    summary.style.background = "var(--background-secondary)";
    summary.style.border = "1px solid var(--background-modifier-border)";
    this.renderRow(summary, "\u6765\u6E90", sourceLabel);
    this.renderRow(summary, "\u8BC6\u522B\u51FA", parsedTitle ? `\u300A${parsedTitle}\u300B` : MESSAGES3.unknownTitle);
    this.renderRow(summary, "\u5199\u5165", targetName, true);
    if (mismatched) {
      const warning = this.contentEl.createDiv({ text: `\u26A0\uFE0F ${MESSAGES3.titleMismatch}` });
      warning.style.marginTop = "12px";
      warning.style.padding = "10px 12px";
      warning.style.borderRadius = "8px";
      warning.style.lineHeight = "1.6";
      warning.style.color = "var(--text-warning)";
      warning.style.background = "var(--background-modifier-error-hover)";
    }
    const counts = [`\u65B0\u589E ${preview.added} \u6761`];
    if (preview.skipped) counts.push(`\u8DF3\u8FC7 ${preview.skipped} \u6761\u5DF2\u6709`);
    if (preview.attachedThoughts) counts.push(`\u8865\u6302 ${preview.attachedThoughts} \u6761\u60F3\u6CD5`);
    this.renderRow(summary, "\u6570\u91CF", counts.join(" \xB7 "));
    const buttonBar = this.contentEl.createDiv();
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "8px";
    buttonBar.style.marginTop = "18px";
    new import_obsidian9.ButtonComponent(buttonBar).setButtonText("\u53D6\u6D88").onClick(() => this.settle(false));
    new import_obsidian9.ButtonComponent(buttonBar).setButtonText("\u786E\u8BA4\u5BFC\u5165").setCta().onClick(() => this.settle(true));
  }
  onClose() {
    this.settle(false);
    this.contentEl.empty();
  }
  /** 一行「标签 + 值」 */
  renderRow(parent, label, value, emphasize = false) {
    const row = parent.createDiv();
    row.style.display = "grid";
    row.style.gridTemplateColumns = "4em minmax(0, 1fr)";
    row.style.gap = "10px";
    row.style.padding = "5px 0";
    const labelEl = row.createDiv({ text: label });
    labelEl.style.color = "var(--text-muted)";
    const valueEl = row.createDiv({ text: value });
    valueEl.style.overflowWrap = "anywhere";
    valueEl.style.lineHeight = "1.5";
    if (emphasize) {
      valueEl.style.fontWeight = "600";
      valueEl.style.color = "var(--text-normal)";
    }
  }
  /** 唯一结算点，保证 Promise 只被兑现一次 */
  settle(value) {
    if (this.settled) return;
    this.settled = true;
    const resolve = this.resolver;
    this.resolver = null;
    if (resolve) resolve(value);
    this.close();
  }
};

// src/modules/books/readBook.ts
var import_obsidian14 = require("obsidian");

// src/modules/books/douban.ts
var import_obsidian10 = require("obsidian");
var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "zh-CN,zh;q=0.9"
};
var doubanFetcher = async (url) => {
  const response = await (0, import_obsidian10.requestUrl)({ url, method: "GET", headers: BROWSER_HEADERS });
  return response.text;
};
async function searchBooks(fetch, keyword) {
  const url = `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(keyword)}`;
  return parseSearchResults(await fetch(url));
}
async function fetchBookDetail(fetch, id, candidateTitle = "", candidateAbstract = "") {
  const url = detailUrlOf(id);
  const detail = parseBookDetail(await fetch(url), id, candidateTitle);
  return enrichFromAbstract(detail, candidateAbstract);
}
function enrichFromAbstract(book, abstract) {
  var _a;
  if (!abstract.trim()) return book;
  if (book.publisher && book.authors.length) return book;
  const parts = abstract.split("/").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return book;
  const priceAt = parts.findIndex((part) => /元|\$|USD|CNY/.test(part));
  const dateAt = parts.findIndex((part) => /^\d{4}(-\d{1,2})?(-\d{1,2})?$/.test(part));
  const publisherAt = dateAt > 0 ? dateAt - 1 : priceAt > 1 ? priceAt - 1 : parts.length - 1;
  const people = parts.slice(0, Math.max(publisherAt, 0));
  return {
    ...book,
    authors: book.authors.length ? book.authors : people.slice(0, 1),
    translators: book.translators.length ? book.translators : people.slice(1),
    publisher: book.publisher || (publisherAt >= 0 ? (_a = parts[publisherAt]) != null ? _a : "" : ""),
    publishDate: book.publishDate || (dateAt >= 0 ? parts[dateAt] : "")
  };
}
function detailUrlOf(id) {
  return `https://book.douban.com/subject/${id}/`;
}
function parseSearchResults(html) {
  var _a;
  if (isBlocked(html)) throw new Error(BLOCKED_MESSAGE);
  const start = html.indexOf("window.__DATA__");
  if (start < 0) return [];
  const braceStart = html.indexOf("{", start);
  if (braceStart < 0) return [];
  const json = html.slice(braceStart, matchingBraceEnd(html, braceStart));
  let payload;
  try {
    payload = JSON.parse(json);
  } catch (e) {
    return [];
  }
  const candidates = [];
  for (const raw of (_a = payload.items) != null ? _a : []) {
    const item = raw;
    const title = text(item.title);
    const id = text(item.id);
    if (!title || !id) continue;
    if (NOT_A_SINGLE_BOOK.test(title)) continue;
    candidates.push({
      id,
      title,
      abstract: text(item.abstract),
      cover: text(item.cover_url)
    });
  }
  return candidates;
}
var BLOCKED_PATTERNS = [/sec\.douban\.com/, /禁止访问/, /有异常请求/, /验证码/];
var BLOCKED_MESSAGE = "\u8C46\u74E3\u6682\u65F6\u62E6\u4E0B\u4E86\u8FD9\u6B21\u8BF7\u6C42\uFF08\u6362\u4E2A\u7F51\u7EDC\u6216\u8FC7\u51E0\u5206\u949F\u518D\u8BD5\uFF09\u3002\u4E5F\u53EF\u4EE5\u7528\u300C\u65B0\u5EFA\u8BFB\u4E66\u7B14\u8BB0\u300D\u624B\u52A8\u5EFA\u4E00\u672C\u3002";
function isBlocked(html) {
  if (html.includes("window.__DATA__")) return false;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(html));
}
var NOT_A_SINGLE_BOOK = /^\s*[[［【]\s*(丛书|套装|系列)/;
function matchingBraceEnd(source, from) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let cursor = from; cursor < source.length; cursor += 1) {
    const char = source[cursor];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  return source.length;
}
function parseBookDetail(html, id, candidateTitle = "") {
  const info = infoBlockOf(html);
  const title = attr(html, /<meta property="og:title" content="([^"]*)"/);
  return {
    id,
    title: stripSubtitle(title || candidateTitle),
    // 三处依次兜底：信息区的副标题字段、详情页标题里冒号之后的部分、候选那一行的标题
    subtitle: field(info, "\u526F\u6807\u9898") || subtitleOf(title) || subtitleOf(candidateTitle),
    authors: splitNames(field(info, "\u4F5C\u8005")),
    translators: splitNames(field(info, "\u8BD1\u8005")),
    publisher: field(info, "\u51FA\u7248\u793E"),
    publishDate: field(info, "\u51FA\u7248\u5E74"),
    isbn: field(info, "ISBN"),
    pages: field(info, "\u9875\u6570"),
    rating: attr(html, /property="v:average">\s*([0-9.]+)/),
    cover: attr(html, /<meta property="og:image" content="([^"]*)"/),
    url: detailUrlOf(id),
    summary: attr(html, /<meta property="og:description" content="([^"]*)"/),
    tags: parseCategories(html)
  };
}
function parseCategories(html) {
  var _a, _b, _c, _d;
  const raw = (_b = (_a = /criteria\s*=\s*'([^']*)'/.exec(html)) == null ? void 0 : _a[1]) != null ? _b : "";
  if (!raw) return [];
  const categories = [];
  for (const entry of raw.split("|")) {
    const word = (_d = (_c = /^7:(.+)$/.exec(entry.trim())) == null ? void 0 : _c[1]) == null ? void 0 : _d.trim();
    if (word) categories.push(word);
  }
  return categories;
}
function infoBlockOf(html) {
  const start = html.indexOf('id="info"');
  if (start < 0) return html;
  const end = html.indexOf("</div>", start);
  return html.slice(start, end < 0 ? html.length : end);
}
function field(info, key) {
  var _a, _b;
  const pattern = new RegExp(
    `<span class="pl">\\s*${key}\\s*:?\\s*</span>\\s*:?([\\s\\S]*?)<br`,
    "i"
  );
  return clean((_b = (_a = pattern.exec(info)) == null ? void 0 : _a[1]) != null ? _b : "");
}
function splitNames(value) {
  return value.split(/\s{2,}|\s*[/、]\s*/).map((name) => name.trim()).filter(Boolean);
}
function stripSubtitle(title) {
  return title.split(/\s*:\s*/)[0].trim() || title.trim();
}
function subtitleOf(title) {
  const parts = title.split(/\s*:\s*/);
  return parts.length > 1 ? parts.slice(1).join("\uFF1A").trim() : "";
}
function attr(html, pattern) {
  var _a, _b;
  return clean((_b = (_a = pattern.exec(html)) == null ? void 0 : _a[1]) != null ? _b : "");
}
function clean(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function text(value) {
  if (value === null || value === void 0) return "";
  return String(value).trim();
}

// src/modules/books/isbn.ts
function isbnUid(raw) {
  const compact = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (/^\d{13}$/.test(compact) && validIsbn13(compact)) return Number(compact);
  if (/^\d{9}[\dX]$/.test(compact) && validIsbn10(compact)) return Number(toIsbn13(compact));
  return null;
}
function validIsbn13(isbn) {
  if (!/^97[89]/.test(isbn)) return false;
  let sum2 = 0;
  for (let index = 0; index < 12; index += 1) {
    sum2 += Number(isbn[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return (10 - sum2 % 10) % 10 === Number(isbn[12]);
}
function validIsbn10(isbn) {
  let sum2 = 0;
  for (let index = 0; index < isbn.length; index += 1) {
    const digit = isbn[index] === "X" ? 10 : Number(isbn[index]);
    sum2 += digit * (10 - index);
  }
  return sum2 % 11 === 0;
}
function toIsbn13(isbn10) {
  const body = `978${isbn10.slice(0, 9)}`;
  let sum2 = 0;
  for (let index = 0; index < body.length; index += 1) {
    sum2 += Number(body[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return `${body}${(10 - sum2 % 10) % 10}`;
}

// src/modules/books/tags.ts
var TAG_SAFE = /[^\p{L}\p{N}_-]+/gu;
function bookTags(categories, prefix, count) {
  const limit = normalizeCount(count);
  if (limit <= 0) return [];
  const root = normalizePrefix(prefix);
  const tags = [];
  const seen = /* @__PURE__ */ new Set();
  for (const category of categories) {
    const leaf = sanitize(category);
    if (!leaf || seen.has(leaf)) continue;
    seen.add(leaf);
    tags.push(`${root}/${leaf}`);
    if (tags.length >= limit) break;
  }
  return tags;
}
function normalizeCount(count) {
  return BOOK_TAG_COUNTS.includes(count) ? count : BOOK_TAG_DEFAULTS.count;
}
function normalizePrefix(prefix) {
  const segments = prefix.split("/").map((segment) => sanitize(segment)).filter(Boolean);
  return segments.length ? segments.join("/") : BOOK_TAG_DEFAULTS.prefix;
}
function sanitize(value) {
  return value.trim().replace(TAG_SAFE, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

// src/modules/books/sourceWeread.ts
var import_obsidian11 = require("obsidian");
var BASE = "https://weread.qq.com";
var GATEWAY = "https://i.weread.qq.com/api/agent/gateway";
var API_KEY_PATH = "/api/skills/apikeyGet";
var SKILL_VERSION = "1.0.3";
var REQUIRED_COOKIES = ["wr_vid", "wr_skey"];
var LOGIN_TIMEOUT_MS = 12e4;
var activeLoginCancel = null;
function wereadAvailable(ctx) {
  return import_obsidian11.Platform.isDesktopApp && !!ctx.settings.wereadCookie.trim();
}
async function loginWeread(ctx) {
  const BrowserWindow = resolveBrowserWindow();
  if (!BrowserWindow) return false;
  activeLoginCancel == null ? void 0 : activeLoginCancel();
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 480,
      height: 660,
      title: "\u767B\u5F55\u5FAE\u4FE1\u8BFB\u4E66\uFF08\u7528\u5FAE\u4FE1\u626B\u7801\uFF09",
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    let settled = false;
    let timer = null;
    let timeout = null;
    const cancel = () => finish(false);
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (timer !== null) window.clearInterval(timer);
      if (timeout !== null) window.clearTimeout(timeout);
      if (activeLoginCancel === cancel) activeLoginCancel = null;
      try {
        if (!win.isDestroyed()) win.close();
      } catch (e) {
      }
      resolve(ok);
    };
    activeLoginCancel = cancel;
    timer = window.setInterval(() => {
      void (async () => {
        try {
          if (win.isDestroyed()) {
            finish(false);
            return;
          }
          const cookies = await win.webContents.session.cookies.get({
            domain: ".weread.qq.com"
          });
          if (settled || activeLoginCancel !== cancel) return;
          const names = cookies.map((cookie2) => cookie2.name);
          if (!REQUIRED_COOKIES.every((name) => names.includes(name))) return;
          const cookie = cookies.map((cookie2) => `${cookie2.name}=${cookie2.value}`).join("; ");
          clearCachedKey();
          ctx.settings.wereadCookie = cookie;
          await ctx.saveSettings();
          finish(true);
        } catch (e) {
          finish(false);
        }
      })();
    }, 1e3);
    timeout = window.setTimeout(() => finish(false), LOGIN_TIMEOUT_MS);
    win.on("closed", () => finish(false));
    void win.loadURL(`${BASE}/#login`).catch(() => finish(false));
  });
}
async function disconnectWeread(ctx) {
  activeLoginCancel == null ? void 0 : activeLoginCancel();
  clearCachedKey();
  ctx.settings.wereadCookie = "";
  await ctx.saveSettings();
}
function disposeWereadSession() {
  activeLoginCancel == null ? void 0 : activeLoginCancel();
  clearCachedKey();
}
function resolveBrowserWindow() {
  if (!import_obsidian11.Platform.isDesktopApp) return null;
  try {
    const remote = require("@electron/remote");
    return typeof (remote == null ? void 0 : remote.BrowserWindow) === "function" ? remote.BrowserWindow : null;
  } catch (e) {
    return null;
  }
}
async function api(ctx, path) {
  var _a, _b;
  const response = await (0, import_obsidian11.requestUrl)({
    url: `${BASE}${path}`,
    method: "GET",
    headers: {
      Cookie: ctx.settings.wereadCookie,
      Referer: `${BASE}/`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    throw: false
  });
  if (response.status === 401) throw new Error(EXPIRED);
  if (response.status >= 400) throw new Error(`\u5FAE\u4FE1\u8BFB\u4E66\u63A5\u53E3\u8FD4\u56DE ${response.status}`);
  const payload = (_a = response.json) != null ? _a : {};
  const errCode = Number((_b = payload.errCode) != null ? _b : 0);
  if (errCode) {
    throw new Error(
      errCode === -2012 || errCode === -2010 ? EXPIRED : `\u5FAE\u4FE1\u8BFB\u4E66\u62D2\u7EDD\u4E86\u8FD9\u6B21\u8BF7\u6C42\uFF1A${text2(payload.errMsg) || errCode}`
    );
  }
  return payload;
}
var EXPIRED = "\u5FAE\u4FE1\u8BFB\u4E66\u7684\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u91CD\u65B0\u8FD0\u884C\u300C\u8FDE\u63A5\u5FAE\u4FE1\u8BFB\u4E66\u300D\u3002";
var cachedKey = "";
var cachedCookie = "";
function clearCachedKey() {
  cachedKey = "";
  cachedCookie = "";
}
async function apiKey(ctx) {
  const cookie = ctx.settings.wereadCookie.trim();
  if (cachedCookie !== cookie) {
    cachedKey = "";
    cachedCookie = cookie;
  }
  if (cachedKey) return cachedKey;
  try {
    const payload = await api(ctx, API_KEY_PATH);
    cachedKey = text2(payload.apikey);
  } catch (e) {
    cachedKey = "";
  }
  return cachedKey;
}
async function gateway(ctx, apiName, key, params) {
  var _a, _b;
  const response = await (0, import_obsidian11.requestUrl)({
    url: GATEWAY,
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ api_name: apiName, skill_version: SKILL_VERSION, ...params }),
    throw: false
  });
  if (response.status === 401) {
    clearCachedKey();
    throw new Error(EXPIRED);
  }
  if (response.status >= 400) throw new Error(`\u5FAE\u4FE1\u8BFB\u4E66\u7F51\u5173\u8FD4\u56DE ${response.status}`);
  const payload = (_a = response.json) != null ? _a : {};
  if (Number((_b = payload.errcode) != null ? _b : 0)) {
    throw new Error(`\u5FAE\u4FE1\u8BFB\u4E66\u62D2\u7EDD\u4E86\u8FD9\u6B21\u8BF7\u6C42\uFF1A${text2(payload.errmsg) || payload.errcode}`);
  }
  return payload;
}
async function listWereadBooks(ctx) {
  const payload = await api(ctx, "/api/user/notebook");
  const books = [];
  for (const raw of asArray(payload.books)) {
    const entry = raw;
    const book = entry.book;
    if (!book) continue;
    const id = text2(book.bookId);
    const title = text2(book.title);
    if (id && title) {
      books.push({
        id,
        title,
        author: text2(book.author)
      });
    }
  }
  return books;
}
async function readWereadBookHighlights(ctx, book) {
  var _a;
  const key = await apiKey(ctx);
  if (!key) return await cookieOnly(ctx, book.id);
  const marks = await gateway(ctx, "/book/bookmarklist", key, { bookId: book.id });
  const chapterNames = chapterMapOf(marks);
  const highlights = [];
  for (const raw of asArray(marks.updated)) {
    const mark = raw;
    const content = text2(mark.markText);
    if (!content) continue;
    highlights.push({
      chapter: (_a = chapterNames.get(text2(mark.chapterUid))) != null ? _a : "",
      text: content,
      thoughts: []
    });
  }
  let note = "";
  try {
    const reviews = await gateway(ctx, "/review/list/mine", key, {
      bookid: book.id,
      synckey: 0
    });
    mergeReviews(highlights, reviews, chapterNames);
  } catch (error) {
    if (!highlights.length) throw error;
    const message2 = error instanceof Error ? error.message : String(error);
    note = `\u5FAE\u4FE1\u8BFB\u4E66\u60F3\u6CD5\u53D6\u6570\u5931\u8D25\uFF1A${message2 || "\u672A\u77E5\u9519\u8BEF"}\uFF1B\u672C\u6B21\u53EA\u540C\u6B65\u4E86\u5212\u7EBF\u3002`;
  }
  return { highlights, note };
}
async function cookieOnly(ctx, bookId) {
  const highlights = [];
  const reviews = await api(
    ctx,
    `/api/review/list?bookId=${encodeURIComponent(bookId)}&listType=11&mine=1&syncKey=0`
  );
  mergeReviews(highlights, reviews, /* @__PURE__ */ new Map());
  return {
    highlights,
    note: "\u6CA1\u80FD\u62FF\u5230\u5FAE\u4FE1\u8BFB\u4E66\u7684\u53D6\u6570\u6388\u6743\uFF0C\u8FD9\u6B21\u53EA\u53D6\u56DE\u4E86\u5199\u8FC7\u60F3\u6CD5\u7684\u90A3\u4E9B\uFF1B\u7EAF\u5212\u7EBF\u53D6\u4E0D\u5230\u3002\u91CD\u65B0\u8FD0\u884C\u4E00\u6B21\u300C\u8FDE\u63A5\u5FAE\u4FE1\u8BFB\u4E66\u300D\u901A\u5E38\u5C31\u80FD\u6062\u590D\u3002"
  };
}
function mergeReviews(highlights, payload, chapterNames) {
  var _a;
  for (const raw of asArray(payload.reviews)) {
    const wrapper = raw;
    const review = (_a = wrapper.review) != null ? _a : wrapper;
    const written = text2(review.content);
    if (!written) continue;
    const quoted = text2(review.abstract);
    const hostIndex = quoted ? highlights.findIndex(
      (item) => item.text.replace(/\s+/g, "") === quoted.replace(/\s+/g, "")
    ) : -1;
    if (hostIndex >= 0) {
      const host = highlights[hostIndex];
      highlights[hostIndex] = { ...host, thoughts: [...host.thoughts, written] };
    } else {
      highlights.push({
        // 想法自带 chapterName，优先用它：一本书可能一条纯划线都没有
        // （只有「划一段再写句话」的想法），那时章节表是空的，
        // 靠 chapterUid 去查只会查到空字符串，整章信息白白丢掉
        chapter: text2(review.chapterName) || chapterNames.get(text2(review.chapterUid)) || "",
        text: quoted,
        thoughts: [written]
      });
    }
  }
}
function chapterMapOf(payload) {
  const names = /* @__PURE__ */ new Map();
  for (const raw of asArray(payload.chapters)) {
    const chapter = raw;
    const uid = text2(chapter.chapterUid);
    const title = text2(chapter.title);
    if (uid && title) names.set(uid, title);
  }
  return names;
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
function text2(value) {
  if (value === null || value === void 0) return "";
  return String(value).trim();
}

// src/modules/books/sourceAppleBooks.ts
var import_obsidian12 = require("obsidian");
var LIBRARY_DIR = "Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary";
var ANNOTATION_DIR = "Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation";
var cachedNodeTools;
function nodeTools() {
  if (!import_obsidian12.Platform.isDesktopApp) return null;
  if (cachedNodeTools !== void 0) return cachedNodeTools;
  try {
    const childProcess = require("child_process");
    const os = require("os");
    const fs = require("fs");
    const path = require("path");
    cachedNodeTools = {
      spawn: childProcess.spawn,
      homedir: os.homedir,
      existsSync: fs.existsSync,
      readdirSync: fs.readdirSync,
      statSync: fs.statSync,
      join: path.join
    };
  } catch (e) {
    cachedNodeTools = null;
  }
  return cachedNodeTools;
}
function sqliteCandidatesIn(relative) {
  const tools = nodeTools();
  if (!tools) return [];
  const dir = tools.join(tools.homedir(), relative);
  if (!tools.existsSync(dir)) return [];
  const found = tools.readdirSync(dir).filter((name) => name.endsWith(".sqlite")).map((name) => {
    const path = tools.join(dir, name);
    return { path, modified: tools.statSync(path).mtimeMs };
  }).sort((left, right) => right.modified - left.modified);
  return found.map(({ path }) => path);
}
function appleBooksAvailable() {
  if (!import_obsidian12.Platform.isDesktopApp || process.platform !== "darwin") return false;
  return sqliteCandidatesIn(LIBRARY_DIR).length > 0 && sqliteCandidatesIn(ANNOTATION_DIR).length > 0;
}
async function query(dbPath, sql) {
  try {
    return await runSqlite(dbPath, sql, "mode=ro");
  } catch (e) {
    return await runSqlite(dbPath, sql, "immutable=1");
  }
}
async function runSqlite(dbPath, sql, openMode) {
  const tools = nodeTools();
  if (!tools) throw new Error("\u5F53\u524D\u5E73\u53F0\u4E0D\u80FD\u8BFB\u53D6\u82F9\u679C\u56FE\u4E66\u6570\u636E\u5E93");
  return new Promise((resolve, reject) => {
    const child = tools.spawn("sqlite3", [`file:${dbPath}?${openMode}`, sql, "-json"], {
      timeout: 2e4
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      err += String(chunk);
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(err.trim() || `sqlite3 \u9000\u51FA\u7801 ${code}`));
        return;
      }
      if (!out.trim()) {
        resolve([]);
        return;
      }
      try {
        resolve(JSON.parse(out));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
}
function quote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
async function compatibleSqliteIn(relative, requiredTable) {
  let lastError = null;
  for (const candidate of sqliteCandidatesIn(relative)) {
    try {
      const table = await query(
        candidate,
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quote(requiredTable)} LIMIT 1`
      );
      if (table.length) return candidate;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}
async function listAppleBooks() {
  const [libraryDb, annotationDb] = await Promise.all([
    compatibleSqliteIn(LIBRARY_DIR, "ZBKLIBRARYASSET"),
    compatibleSqliteIn(ANNOTATION_DIR, "ZAEANNOTATION")
  ]);
  if (!libraryDb || !annotationDb) return [];
  const withHighlights = await query(
    annotationDb,
    `SELECT DISTINCT ZANNOTATIONASSETID AS id FROM ZAEANNOTATION
         WHERE ZANNOTATIONSELECTEDTEXT IS NOT NULL AND ZANNOTATIONDELETED = 0`
  );
  const ids = withHighlights.map((row) => {
    var _a;
    return String((_a = row.id) != null ? _a : "").trim();
  }).filter(Boolean);
  if (!ids.length) return [];
  const books = await query(
    libraryDb,
    `SELECT ZASSETID AS id, ZTITLE AS title, ZAUTHOR AS author FROM ZBKLIBRARYASSET
         WHERE ZASSETID IN (${ids.map(quote).join(",")})`
  );
  return books.map((row) => {
    var _a, _b, _c;
    return {
      id: String((_a = row.id) != null ? _a : "").trim(),
      title: String((_b = row.title) != null ? _b : "").trim(),
      author: String((_c = row.author) != null ? _c : "").trim()
    };
  }).filter((book) => book.id && book.title);
}
async function readAppleBookHighlights(assetId) {
  const annotationDb = await compatibleSqliteIn(ANNOTATION_DIR, "ZAEANNOTATION");
  if (!annotationDb) return [];
  const rows = await query(
    annotationDb,
    `SELECT ZANNOTATIONSELECTEDTEXT AS text, ZANNOTATIONNOTE AS note,
                ZFUTUREPROOFING5 AS chapter, ZANNOTATIONLOCATION AS location
         FROM ZAEANNOTATION
         WHERE ZANNOTATIONASSETID = ${quote(assetId)}
           AND ZANNOTATIONSELECTEDTEXT IS NOT NULL
           AND ZANNOTATIONDELETED = 0
         ORDER BY ZANNOTATIONCREATIONDATE`
  );
  return rows.map((row) => {
    var _a, _b, _c;
    const note = String((_a = row.note) != null ? _a : "").trim();
    return {
      chapter: String((_b = row.chapter) != null ? _b : "").trim(),
      text: String((_c = row.text) != null ? _c : "").trim(),
      thoughts: note ? [note] : []
    };
  }).filter((highlight) => highlight.text);
}

// src/modules/books/sourceKindle.ts
var import_obsidian13 = require("obsidian");
var cachedNodeTools2;
function nodeTools2() {
  if (!import_obsidian13.Platform.isDesktopApp) return null;
  if (cachedNodeTools2 !== void 0) return cachedNodeTools2;
  try {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    cachedNodeTools2 = {
      existsSync: fs.existsSync,
      readFileSync: fs.readFileSync,
      readdirSync: fs.readdirSync,
      statSync: fs.statSync,
      homedir: os.homedir,
      join: path.join
    };
  } catch (e) {
    cachedNodeTools2 = null;
  }
  return cachedNodeTools2;
}
function kindleClippingsPath() {
  const tools = nodeTools2();
  if (!tools) return null;
  for (const candidate of candidatePaths(tools)) {
    try {
      if (tools.existsSync(candidate) && tools.statSync(candidate).isFile()) return candidate;
    } catch (e) {
    }
  }
  return null;
}
function candidatePaths(tools) {
  var _a, _b;
  const paths = [];
  const home = tools.homedir();
  const deviceRelative = tools.join("documents", "My Clippings.txt");
  for (const mountRoot of ["/Volumes", `/media/${(_a = process.env.USER) != null ? _a : ""}`, `/run/media/${(_b = process.env.USER) != null ? _b : ""}`]) {
    try {
      if (!tools.existsSync(mountRoot)) continue;
      for (const volume of tools.readdirSync(mountRoot)) {
        paths.push(tools.join(mountRoot, volume, deviceRelative));
      }
    } catch (e) {
    }
  }
  if (process.platform === "win32") {
    for (const letter of "DEFGHIJKLMNOPQRSTUVWXYZ") {
      paths.push(`${letter}:\\${deviceRelative}`);
    }
  }
  paths.push(tools.join(home, "Downloads", "My Clippings.txt"));
  paths.push(tools.join(home, "Desktop", "My Clippings.txt"));
  return paths;
}
function kindleAvailable() {
  return kindleClippingsPath() !== null;
}
function listKindleBooks() {
  var _a, _b;
  const path = kindleClippingsPath();
  const tools = nodeTools2();
  if (!path || !tools) return [];
  return (_b = (_a = parseHighlightExport(tools.readFileSync(path, "utf8"))) == null ? void 0 : _a.books) != null ? _b : [];
}
function readKindleBookHighlights(title) {
  var _a, _b;
  return (_b = (_a = listKindleBooks().find((book) => book.title === title)) == null ? void 0 : _a.highlights) != null ? _b : [];
}

// src/modules/books/sources.ts
function availableSourceLabels(ctx) {
  const labels = [];
  if (probeAvailable(() => wereadAvailable(ctx))) labels.push("\u5FAE\u4FE1\u8BFB\u4E66");
  if (probeAvailable(appleBooksAvailable)) labels.push("\u82F9\u679C\u56FE\u4E66");
  if (probeAvailable(kindleAvailable)) labels.push("Kindle");
  return labels;
}
function probeAvailable(probe) {
  try {
    return probe();
  } catch (e) {
    return true;
  }
}
async function collectHighlightsFor(ctx, names, author = "") {
  const hits = [];
  try {
    if (wereadAvailable(ctx)) {
      const books = (await listWereadBooks(ctx)).map((book) => ({ ...book, label: "\u5FAE\u4FE1\u8BFB\u4E66" }));
      const matched = matchBook(books, names, author);
      if (matched) {
        const { highlights, note } = await readWereadBookHighlights(ctx, matched);
        if (highlights.length || note) {
          hits.push({ label: "\u5FAE\u4FE1\u8BFB\u4E66", title: matched.title, highlights, note });
        }
      } else {
        hits.push(unmatchedHit("\u5FAE\u4FE1\u8BFB\u4E66", names));
      }
    }
  } catch (error) {
    hits.push(failedHit("\u5FAE\u4FE1\u8BFB\u4E66", names, error));
  }
  try {
    if (appleBooksAvailable()) {
      const books = (await listAppleBooks()).map((book) => ({ ...book, label: "\u82F9\u679C\u56FE\u4E66" }));
      const matched = matchBook(books, names, author);
      if (matched) {
        const highlights = await readAppleBookHighlights(matched.id);
        if (highlights.length) {
          hits.push({ label: "\u82F9\u679C\u56FE\u4E66", title: matched.title, highlights });
        }
      } else {
        hits.push(unmatchedHit("\u82F9\u679C\u56FE\u4E66", names));
      }
    }
  } catch (error) {
    hits.push(failedHit("\u82F9\u679C\u56FE\u4E66", names, error));
  }
  try {
    if (kindleAvailable()) {
      const books = listKindleBooks().map((book) => ({
        label: "Kindle",
        id: book.title,
        title: book.title,
        author: book.author
      }));
      const matched = matchBook(books, names, author);
      if (matched) {
        const highlights = readKindleBookHighlights(matched.title);
        if (highlights.length) {
          hits.push({ label: "Kindle", title: matched.title, highlights });
        }
      } else {
        hits.push(unmatchedHit("Kindle", names));
      }
    }
  } catch (error) {
    hits.push(failedHit("Kindle", names, error));
  }
  return hits;
}
function failedHit(label, names, error) {
  var _a;
  const message2 = error instanceof Error ? error.message : String(error);
  return {
    label,
    title: (_a = names.find((name) => name.trim())) != null ? _a : "",
    highlights: [],
    note: `${label}\u53D6\u6570\u5931\u8D25\uFF1A${message2 || "\u672A\u77E5\u9519\u8BEF"}`
  };
}
function unmatchedHit(label, names) {
  var _a;
  return {
    label,
    title: (_a = names.find((name) => name.trim())) != null ? _a : "",
    highlights: [],
    note: `${label}\u6CA1\u6709\u5339\u914D\u5230\u8FD9\u672C\u4E66\uFF08\u53EF\u80FD\u662F\u4E66\u540D\u6216\u526F\u6807\u9898\u4E0D\u540C\uFF09\uFF0C\u6CA1\u6709\u628A\u5176\u4ED6\u4E66\u7684\u5212\u7EBF\u6DF7\u8FDB\u6765\u3002`
  };
}
function matchBook(books, names, author) {
  const candidates = names.map((name) => name.trim()).filter(Boolean);
  for (const name of candidates) {
    const exact = books.find((book) => book.title === name);
    if (exact) return exact;
  }
  for (const name of candidates) {
    const key = normalize(name);
    if (!key) continue;
    const normalized = books.find((book) => normalize(book.title) === key);
    if (normalized) return normalized;
  }
  const authorKey = normalize(author);
  for (const name of candidates) {
    const key = normalize(name);
    if (key.length < 4) continue;
    const loose = books.find((book) => {
      const candidate = normalize(book.title);
      const overlaps = candidate.length >= 4 && (candidate.includes(key) || key.includes(candidate));
      if (!overlaps) return false;
      if (!authorKey) return true;
      const bookAuthor = normalize(book.author);
      return !bookAuthor || bookAuthor.includes(authorKey) || authorKey.includes(bookAuthor);
    });
    if (loose) return loose;
  }
  return null;
}
function normalize(value) {
  return value.replace(/^《|》$/g, "").replace(/[\s：:，,。.、·・\-—_()（）[\]【】"'"'?？!！]/g, "").toLowerCase();
}

// src/modules/books/readBook.ts
var MESSAGES4 = {
  namePrompt: "\u60F3\u8BFB\u54EA\u672C\u4E66\uFF1F",
  namePlaceholder: "\u4E66\u540D\uFF0C\u4F8B\u5982\uFF1A\u5361\u7247\u7B14\u8BB0\u5199\u4F5C\u6CD5",
  nameMissing: "\u6CA1\u6709\u8F93\u5165\u4E66\u540D\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002",
  searching: "\u6B63\u5728\u8C46\u74E3\u4E0A\u627E\u8FD9\u672C\u4E66\u2026\u2026",
  searchFailed: "\u6CA1\u80FD\u8FDE\u4E0A\u8C46\u74E3\u3002\u68C0\u67E5\u4E00\u4E0B\u7F51\u7EDC\uFF0C\u6216\u8005\u7528\u300C\u65B0\u5EFA\u8BFB\u4E66\u7B14\u8BB0\u300D\u624B\u52A8\u5EFA\u4E00\u672C\u3002",
  noResult: "\u8C46\u74E3\u4E0A\u6CA1\u627E\u5230\u8FD9\u672C\u4E66\u3002\u6362\u4E2A\u4E66\u540D\u518D\u8BD5\uFF0C\u6216\u8005\u7528\u300C\u65B0\u5EFA\u8BFB\u4E66\u7B14\u8BB0\u300D\u624B\u52A8\u5EFA\u4E00\u672C\u3002",
  pickBook: "\u662F\u8FD9\u4E00\u672C\u5417\uFF1F",
  detailFailed: "\u53D6\u4E66\u7C4D\u8BE6\u60C5\u5931\u8D25\uFF1A",
  pulling: "\u4E66\u5EFA\u597D\u4E86\uFF0C\u6B63\u5728\u627E\u8FD9\u672C\u4E66\u7684\u5212\u7EBF\u2026\u2026",
  noSource: "\u8FD9\u53F0\u673A\u5668\u4E0A\u6CA1\u627E\u5230\u5212\u7EBF\u6765\u6E90\uFF08\u82F9\u679C\u56FE\u4E66\u8981\u5728\u672C\u673A\u8BFB\u8FC7\uFF0CKindle \u8981\u63D2\u4E0A\u6216\u6709 My Clippings.txt\uFF09\u3002\u7528\u300C\u5BFC\u5165\u8BFB\u4E66\u5212\u7EBF\u300D\u7C98\u8D34\u4E5F\u884C\u3002",
  noHighlights: "\u6CA1\u5728\u8BBE\u5907\u91CC\u627E\u5230\u8FD9\u672C\u4E66\u7684\u5212\u7EBF\u3002\u8BFB\u4E00\u9635\u5B50\u518D\u56DE\u6765\u8DD1\u300C\u540C\u6B65\u8FD9\u672C\u4E66\u7684\u5212\u7EBF\u300D\u3002"
};
function registerReadBookCommand(ctx, create) {
  ctx.commands.register(BOOK_COMMANDS.read, () => {
    runBookCommand(() => readBook(ctx, create), "\u8BFB\u4E00\u672C\u4E66\u5931\u8D25\uFF1A");
  });
}
function runBookCommand(task, failurePrefix) {
  void task().catch((error) => {
    new import_obsidian14.Notice(failurePrefix + (describe2(error) || "\u672A\u77E5\u9519\u8BEF"), 1e4);
  });
}
async function readBook(ctx, create) {
  var _a;
  const input = await new TextInputModal(ctx.app, {
    title: MESSAGES4.namePrompt,
    placeholder: MESSAGES4.namePlaceholder
  }).openAndGetValue();
  if (input === null || !input.trim()) {
    new import_obsidian14.Notice(MESSAGES4.nameMissing);
    return;
  }
  const searching = new import_obsidian14.Notice(MESSAGES4.searching, 0);
  let candidates;
  try {
    candidates = await searchBooks(doubanFetcher, input.trim());
  } catch (error) {
    searching.hide();
    new import_obsidian14.Notice(describe2(error) || MESSAGES4.searchFailed, 1e4);
    return;
  }
  searching.hide();
  if (!candidates.length) {
    new import_obsidian14.Notice(MESSAGES4.noResult, 8e3);
    return;
  }
  const chosen = await new ChoiceModal(ctx.app, {
    title: MESSAGES4.pickBook,
    items: candidates,
    // 摘要那一行是豆瓣给的「作者 / 译者 / 出版社 / 年份 / 定价」，同名书全靠它分辨
    labelOf: (item) => item.abstract ? `${item.title}\u3000\u2014\u3000${item.abstract}` : item.title
  }).openAndGetChoice();
  if (!chosen) return;
  let detail;
  try {
    detail = await fetchBookDetail(doubanFetcher, chosen.id, chosen.title, chosen.abstract);
  } catch (error) {
    new import_obsidian14.Notice(MESSAGES4.detailFailed + describe2(error), 8e3);
    return;
  }
  const uid = isbnUid(detail.isbn);
  const tags = bookTags(detail.tags, ctx.settings.bookTagPrefix, ctx.settings.bookTagCount);
  const moc = await create({
    name: `\u300A${detail.title}\u300B`,
    description: detail.summary.slice(0, 120),
    ...detail.authors.length ? { author: detail.authors[0] } : {},
    ...fullTitleOf(detail) ? { aliases: [fullTitleOf(detail)] } : {},
    ...uid === null ? {} : { uid },
    ...tags.length ? { tags } : {},
    source: detail.url,
    // 书目全部进 YAML，正文只留「全部划线」一个落点。
    // ISBN 已经是 UID、豆瓣链接已经是 source，因此这里不再重复它们；
    // 豆瓣评分也不写——`rating` 是学员自己打的分，两个评分挤一个字段是在制造误读
    bibliography: {
      translators: detail.translators,
      publisher: detail.publisher,
      publishDate: detail.publishDate,
      pages: detail.pages,
      cover: detail.cover
    }
  });
  if (!moc) return;
  await pullHighlights(ctx, moc, [detail.title, fullTitleOf(detail)], (_a = detail.authors[0]) != null ? _a : "");
}
async function pullHighlights(ctx, moc, names, author) {
  var _a;
  const labels = availableSourceLabels(ctx);
  if (!labels.length) {
    new import_obsidian14.Notice(MESSAGES4.noSource, 1e4);
    return;
  }
  const title = (_a = names[0]) != null ? _a : "";
  const pulling = new import_obsidian14.Notice(MESSAGES4.pulling, 0);
  let hits;
  try {
    hits = await collectHighlightsFor(ctx, names, author);
  } finally {
    pulling.hide();
  }
  const notes = hits.map((hit) => {
    var _a2;
    return (_a2 = hit.note) != null ? _a2 : "";
  }).filter(Boolean);
  const all = hits.flatMap((hit) => [...hit.highlights]);
  if (!all.length) {
    new import_obsidian14.Notice(
      notes.length ? notes.join("\n") : `${MESSAGES4.noHighlights}\uFF08\u5DF2\u67E5\u8FC7\uFF1A${labels.join("\u3001")}\uFF09`,
      12e3
    );
    return;
  }
  const mergeRun = {};
  await ctx.app.vault.process(moc, (content) => {
    mergeRun.outcome = mergeHighlights(content, all);
    if (mergeRun.outcome.content === content) return content;
    ctx.guard.mark(moc.path);
    return mergeRun.outcome.content;
  });
  const outcome = mergeRun.outcome;
  if (!outcome) throw new Error("\u5212\u7EBF\u5408\u5E76\u6CA1\u6709\u8FD4\u56DE\u7ED3\u679C");
  const from = hits.filter((hit) => hit.highlights.length).map((hit) => `${hit.label} ${hit.highlights.length} \u6761`).join("\u3001");
  const tail = notes.length ? `
${notes.join("\n")}` : "";
  const result = !outcome.added && !outcome.attachedThoughts ? `\u5212\u7EBF\u5DF2\u662F\u6700\u65B0\uFF08${from}\uFF09\u3002` : !outcome.added ? `\u5DF2\u4ECE ${from} \u8865\u8FDB ${outcome.attachedThoughts} \u6761\u60F3\u6CD5\u3002` : `\u5DF2\u4ECE ${from} \u53D6\u56DE\u5212\u7EBF\uFF0C\u5199\u8FDB\u300A${title}\u300B\u3002` + (outcome.attachedThoughts ? `\u53E6\u8865\u8FDB ${outcome.attachedThoughts} \u6761\u60F3\u6CD5\u3002` : "");
  new import_obsidian14.Notice(
    result + tail,
    notes.length ? 12e3 : 6e3
  );
}
function fullTitleOf(book) {
  return book.subtitle ? `${book.title}\uFF1A${book.subtitle}` : "";
}
function describe2(error) {
  return error instanceof Error ? error.message : String(error);
}
function registerSyncHighlightsCommand(ctx) {
  ctx.commands.register(BOOK_COMMANDS.sync, () => {
    runBookCommand(() => syncCurrentBook(ctx), "\u540C\u6B65\u8BFB\u4E66\u5212\u7EBF\u5931\u8D25\uFF1A");
  });
}
async function syncCurrentBook(ctx) {
  const active = ctx.app.workspace.getActiveFile();
  const target = active && isBookMoc(ctx, active) ? active : await pickBook(ctx);
  if (!target) return;
  const names = [stripBraces2(bookNameOf(target)), ...aliasesOf(ctx, target)];
  const author = firstAuthorOf(ctx, target);
  await pullHighlights(ctx, target, names, author);
}
function aliasesOf(ctx, moc) {
  var _a, _b;
  const raw = (_b = (_a = ctx.app.metadataCache.getFileCache(moc)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.aliases;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((value) => String(value != null ? value : "").trim()).filter(Boolean);
}
async function pickBook(ctx) {
  const books = allBookMocs(ctx);
  if (!books.length) {
    new import_obsidian14.Notice("\u8FD8\u6CA1\u6709\u4EFB\u4F55\u8BFB\u4E66\u7B14\u8BB0\u3002\u5148\u8FD0\u884C\u300C\u8BFB\u4E00\u672C\u4E66\u300D\u3002");
    return null;
  }
  return new ChoiceModal(ctx.app, {
    title: "\u540C\u6B65\u54EA\u672C\u4E66\u7684\u5212\u7EBF\uFF1F",
    items: books,
    labelOf: (file) => bookNameOf(file)
  }).openAndGetChoice();
}
function firstAuthorOf(ctx, moc) {
  var _a, _b, _c;
  const raw = (_b = (_a = ctx.app.metadataCache.getFileCache(moc)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.author;
  const list = Array.isArray(raw) ? raw : [raw];
  return String((_c = list[0]) != null ? _c : "").trim();
}
function stripBraces2(name) {
  const inner = /^《(.+)》$/.exec(name);
  return inner ? inner[1] : name;
}
function registerConnectWereadCommand(ctx) {
  ctx.commands.register(BOOK_COMMANDS.connectWeread, () => {
    runBookCommand(async () => {
      const ok = await loginWeread(ctx);
      new import_obsidian14.Notice(
        ok ? "\u5FAE\u4FE1\u8BFB\u4E66\u5DF2\u8FDE\u4E0A\u3002\u4EE5\u540E\u300C\u8BFB\u4E00\u672C\u4E66\u300D\u4F1A\u81EA\u52A8\u628A\u4F60\u5728\u5FAE\u8BFB\u4E0A\u7684\u5212\u7EBF\u4E00\u5E76\u53D6\u56DE\u6765\u3002" : "\u6CA1\u6709\u8FDE\u4E0A\u5FAE\u4FE1\u8BFB\u4E66\u3002\u7A97\u53E3\u5173\u6389\u4E86\u3001\u6216\u8005\u8FD8\u6CA1\u626B\u7801\uFF1B\u968F\u65F6\u53EF\u4EE5\u518D\u6309\u4E00\u6B21\u3002",
        8e3
      );
    }, "\u8FDE\u63A5\u5FAE\u4FE1\u8BFB\u4E66\u5931\u8D25\uFF1A");
  });
}

// src/modules/editing/cursorMemory.ts
var import_obsidian15 = require("obsidian");
var PERSIST_DEBOUNCE_MS = 1e3;
function registerCursorMemory(ctx) {
  new CursorMemory(ctx);
}
var CursorMemory = class {
  constructor(ctx) {
    /**
     * 路径 → 上次的位置。Map 的插入序被当作最近使用序用：
     * 每次记一篇都先删再插，于是最旧的那一条永远在最前面，超额时从前面丢。
     */
    this.marks = /* @__PURE__ */ new Map();
    /**
     * 当前正盯着的那一篇。
     *
     * 必须自己记一份而不是临时去问「现在活动的是谁」——要记的位置属于**刚离开**的那一篇，
     * 而 file-open 触发时活动视图已经换成新的了。
     */
    this.tracked = null;
    this.timer = null;
    this.ctx = ctx;
    this.statePath = `${ctx.app.vault.configDir}/plugins/${ctx.plugin.manifest.id}/${CURSOR_STATE_FILE}`;
    const { app, plugin } = ctx;
    app.workspace.onLayoutReady(() => {
      void this.load().then(() => this.adopt(true));
    });
    plugin.registerEvent(
      app.workspace.on("file-open", () => {
        this.remember();
        this.adopt(true);
      })
    );
    plugin.registerEvent(
      app.vault.on("rename", (file, oldPath) => {
        var _a;
        const mark = this.marks.get(oldPath);
        this.marks.delete(oldPath);
        if (mark && file instanceof import_obsidian15.TFile) this.marks.set(file.path, mark);
        if (((_a = this.tracked) == null ? void 0 : _a.path) === oldPath && file instanceof import_obsidian15.TFile) {
          this.tracked = { path: file.path, view: this.tracked.view };
        }
        this.schedulePersist();
      })
    );
    plugin.registerEvent(
      app.vault.on("delete", (file) => {
        if (!this.marks.delete(file.path)) return;
        this.schedulePersist();
      })
    );
    plugin.registerEvent(
      app.workspace.on("quit", () => {
        this.remember();
        void this.persist();
      })
    );
    plugin.register(() => {
      this.remember();
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = null;
      void this.persist();
    });
  }
  // ============================================================
  // 认领与恢复
  // ============================================================
  /** 把当前活动的 Markdown 视图认成「正盯着的那一篇」，需要时顺手恢复它的位置 */
  adopt(restore) {
    var _a;
    const view = this.ctx.app.workspace.getActiveViewOfType(import_obsidian15.MarkdownView);
    const file = (_a = view == null ? void 0 : view.file) != null ? _a : null;
    if (!view || !file) {
      this.tracked = null;
      return;
    }
    this.tracked = { path: file.path, view };
    if (restore) this.restore(view, file.path);
  }
  /**
   * 把光标与滚动条放回上次的位置。
   *
   * 只在光标还停在文首（0 行 0 列）时才动手，这是本文件第二要紧的一条判断：
   * 从一条带锚点的双链跳进来时，Obsidian 已经把光标放在那个标题或块上了——
   * 那是用户刚刚点的那一下，比「上次离开时在哪」优先。
   * 行列都要按当前文档夹一次：笔记可能在别处被改短过，越界的行号会让 setCursor 失准。
   */
  restore(view, path) {
    if (!this.ctx.settings.rememberCursor) return;
    const mark = this.marks.get(path);
    if (!mark) return;
    const { editor } = view;
    const current = editor.getCursor();
    if (current.line !== 0 || current.ch !== 0) return;
    const line = Math.min(mark.line, editor.lastLine());
    const ch = Math.min(mark.ch, editor.getLine(line).length);
    editor.setCursor({ line, ch });
    window.requestAnimationFrame(() => {
      var _a;
      if (((_a = this.tracked) == null ? void 0 : _a.view) === view) editor.scrollTo(null, mark.top);
    });
  }
  /** 记下「正盯着那一篇」此刻的位置。视图已经换过文件或已关闭时什么都不做 */
  remember() {
    var _a;
    const tracked = this.tracked;
    if (!tracked || !this.ctx.settings.rememberCursor) return;
    if (((_a = tracked.view.file) == null ? void 0 : _a.path) !== tracked.path) return;
    const { editor } = tracked.view;
    const { line, ch } = editor.getCursor();
    const { top } = editor.getScrollInfo();
    this.put(tracked.path, { line, ch, top });
  }
  /** 写进记忆并维持上限。先删再插是为了把这一条挪到最近端，于是淘汰的总是最久没碰过的 */
  put(path, mark) {
    this.marks.delete(path);
    this.marks.set(path, mark);
    while (this.marks.size > CURSOR_MEMORY_LIMIT) {
      const oldest = this.marks.keys().next();
      if (oldest.done) break;
      this.marks.delete(oldest.value);
    }
    this.schedulePersist();
  }
  // ============================================================
  // 落盘与读盘
  // ============================================================
  schedulePersist() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.persist();
    }, PERSIST_DEBOUNCE_MS);
  }
  /**
   * 写状态文件。写不进去就安静收场——它只是「下次能不能回到原处」这件小事，
   * 为它弹一个红字提示，代价比它本身还大。
   */
  async persist() {
    const marks = {};
    for (const [path, mark] of this.marks) marks[path] = mark;
    const payload = { version: 1, marks };
    try {
      await this.ctx.app.vault.adapter.write(
        this.statePath,
        `${JSON.stringify(payload, null, 2)}
`
      );
    } catch (e) {
    }
  }
  /** 读状态文件。文件不存在是全新库的常态；读到坏数据一律当没有，不猜也不修 */
  async load() {
    const { adapter } = this.ctx.app.vault;
    try {
      if (!await adapter.exists(this.statePath)) return;
      const raw = JSON.parse(await adapter.read(this.statePath));
      for (const [path, mark] of readMarks(raw)) this.marks.set(path, mark);
    } catch (e) {
    }
  }
};
function readMarks(raw) {
  if (typeof raw !== "object" || raw === null) return [];
  const marks = raw.marks;
  if (typeof marks !== "object" || marks === null) return [];
  const out = [];
  for (const [path, value] of Object.entries(marks)) {
    if (typeof value !== "object" || value === null) continue;
    const { line, ch, top } = value;
    if (!isCount(line) || !isCount(ch) || !isCount(top)) continue;
    out.push([path, { line, ch, top }]);
  }
  return out.slice(-CURSOR_MEMORY_LIMIT);
}
function isCount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// src/modules/editing/pasteLink.ts
var URL_PATTERN = /^(?:https?|obsidian|file|ftp|ftps|mailto|tel):\S+$/i;
var NEEDS_ANGLE = /[\s()]/;
function registerPasteLink(ctx) {
  ctx.plugin.registerEvent(
    ctx.app.workspace.on("editor-paste", (evt, editor) => {
      if (!ctx.settings.pasteLinkEnabled) return;
      if (evt.defaultPrevented) return;
      const link = buildLink(editor.getSelection(), readUrl(evt.clipboardData));
      if (!link) return;
      evt.preventDefault();
      editor.replaceSelection(link);
    })
  );
}
function readUrl(data) {
  var _a, _b;
  const text3 = (_b = (_a = data == null ? void 0 : data.getData("text/plain")) == null ? void 0 : _a.trim()) != null ? _b : "";
  return URL_PATTERN.test(text3) ? text3 : null;
}
function buildLink(selection, url) {
  if (!url) return null;
  if (!selection.trim()) return null;
  if (/[\r\n]/.test(selection)) return null;
  return `[${escapeLabel(selection)}](${NEEDS_ANGLE.test(url) ? `<${url}>` : url})`;
}
function escapeLabel(selection) {
  return selection.replace(/([[\]])/g, "\\$1");
}

// src/modules/explorer/badge.ts
var import_obsidian17 = require("obsidian");

// src/modules/explorer/count.ts
var import_obsidian16 = require("obsidian");
function tallyFolders(root, recursive) {
  const tallies = /* @__PURE__ */ new Map();
  walk(root, recursive, tallies);
  return tallies;
}
function walk(folder, recursive, tallies) {
  let notes = 0;
  let folders = 0;
  let others = 0;
  for (const child of folder.children) {
    if (child instanceof import_obsidian16.TFolder) {
      folders += 1;
      const inner = walk(child, recursive, tallies);
      if (!recursive) continue;
      notes += inner.notes;
      folders += inner.folders;
      others += inner.others;
      continue;
    }
    if (child instanceof import_obsidian16.TFile && child.extension === "md") notes += 1;
    else others += 1;
  }
  const tally = { notes, folders, others };
  tallies.set(folder.path, tally);
  return tally;
}
var PICKERS = {
  notes: (tally) => tally.notes,
  folders: (tally) => tally.folders,
  all: (tally) => tally.notes + tally.folders + tally.others
};
function pickCount(tally, target) {
  return PICKERS[target](tally);
}

// src/modules/explorer/badge.ts
var FILE_EXPLORER_VIEW_TYPE = "file-explorer";
var FOLDER_TITLE_SELECTOR = ".nav-folder-title";
var PATH_ATTR = "data-path";
var ROOT_PATH = "/";
var BADGE_CLASS = "ziminos-folder-count";
var TEXTS2 = {
  notes: " \u7BC7\u7B14\u8BB0",
  folders: " \u4E2A\u6587\u4EF6\u5939",
  others: " \u4E2A\u9644\u4EF6",
  separator: " \xB7 ",
  deepSuffix: "\uFF08\u542B\u5B50\u6587\u4EF6\u5939\uFF09"
};
var REPAINT_DEBOUNCE_MS = 80;
function registerFolderCount(ctx) {
  const badges = new FolderCountBadges(ctx);
  return () => badges.sync();
}
var FolderCountBadges = class {
  constructor(ctx) {
    /**
     * 观察文件浏览器 DOM 的那一个观察者。
     *
     * 只用一个而不是「一个叶子一个」：MutationObserver 允许对多个目标 observe，
     * 全部回调进同一个入口，而 disconnect 一次全部撤掉。
     * 于是「现在有几块文件浏览器」这件事不需要任何记账——每次重挂都是先全撤再全挂。
     * null 即当前没有在观察（开关关着，或者文件浏览器不在场）。
     */
    this.observer = null;
    /** 防抖句柄。null 即当前没有排着的重画 */
    this.timer = null;
    this.ctx = ctx;
    const { app, plugin } = ctx;
    app.workspace.onLayoutReady(() => this.sync());
    plugin.registerEvent(app.workspace.on("layout-change", () => this.sync()));
    plugin.registerEvent(app.vault.on("create", () => this.schedule()));
    plugin.registerEvent(app.vault.on("delete", () => this.schedule()));
    plugin.registerEvent(app.vault.on("rename", () => this.schedule()));
    plugin.register(() => this.dispose());
  }
  /**
   * 按当前设置重画一次，必要时重挂观察者。设置页与两个工作区事件走的都是这一个入口。
   *
   * 开关关掉时连观察者一起撤掉，而不是留着它空转：一个关掉之后还在监听 DOM 的功能，
   * 与没关掉的区别只有用户看不见的那部分。
   */
  sync() {
    var _a;
    if (!this.ctx.settings.showFolderCount) {
      (_a = this.observer) == null ? void 0 : _a.disconnect();
      this.observer = null;
      this.clear();
      return;
    }
    this.attach();
    this.repaint();
  }
  /** 把观察者挂到当前在场的每一块文件浏览器上。先全撤再全挂，因此重复调用无害 */
  attach() {
    var _a, _b;
    const containers = this.containers();
    (_a = this.observer) == null ? void 0 : _a.disconnect();
    if (containers.length === 0) return;
    const observer = (_b = this.observer) != null ? _b : new MutationObserver((records) => this.onMutations(records));
    this.observer = observer;
    for (const container of containers) {
      observer.observe(container, { childList: true, subtree: true });
    }
  }
  /**
   * DOM 变了。
   *
   * 先问一句「这变化是不是我自己刚才引起的」——判据与 SelfWriteGuard 同形，
   * 只是这里连时间窗口都不需要：我们的痕迹全都带着 BADGE_CLASS，认得出来。
   * 不问的话，写一个数字就是一次子节点变更，一次变更排一次重画，重画又写数字，
   * 这个环靠「值没变就不写」也能收敛，但收敛不等于不该成环。
   */
  onMutations(records) {
    if (records.every(isOurs)) return;
    this.schedule();
  }
  /** 排一次重画。同一串事件里排多少次都只画一次 */
  schedule() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.repaint();
    }, REPAINT_DEBOUNCE_MS);
  }
  /**
   * 重画全部在场的文件夹。
   *
   * 一次重画只数一遍全库，屏幕上展开了多少行都共用这一张表；
   * 已经对的那些数字一个字都不重写，见 paint——那是这个功能不自激的第二道保证。
   */
  repaint() {
    if (!this.ctx.settings.showFolderCount) return;
    const containers = this.containers();
    if (containers.length === 0) return;
    const recursive = this.ctx.settings.folderCountRecursive;
    const target = this.target();
    const tallies = tallyFolders(this.ctx.app.vault.getRoot(), recursive);
    for (const container of containers) {
      for (const titleEl of Array.from(container.querySelectorAll(FOLDER_TITLE_SELECTOR))) {
        if (titleEl instanceof HTMLElement) this.paint(titleEl, tallies, target, recursive);
      }
    }
  }
  /**
   * 给一行文件夹标题挂上（或摘掉）它的数字。
   *
   * 三种情况都摘掉而不是显示 0：根那一行、路径认不出来的那一行、以及数出来是 0 的那一行。
   * 一个 0 不解释任何事——空文件夹自己就写着「空」，而那个 0 只是让每一行都长出一个灰点。
   */
  paint(titleEl, tallies, target, recursive) {
    var _a, _b;
    const path = titleEl.getAttribute(PATH_ATTR);
    const tally = path === null || path === ROOT_PATH ? void 0 : tallies.get(path);
    const count = tally ? pickCount(tally, target) : 0;
    if (!tally || count === 0) {
      (_a = badgeOf(titleEl)) == null ? void 0 : _a.remove();
      return;
    }
    const badge = (_b = badgeOf(titleEl)) != null ? _b : titleEl.createSpan({ cls: BADGE_CLASS });
    const text3 = String(count);
    if (badge.textContent !== text3) badge.setText(text3);
    (0, import_obsidian17.setTooltip)(badge, describe3(tally, recursive));
  }
  /** 撤掉全部痕迹。开关关掉与插件卸载共用它，因此「关掉」与「卸载」的结果一字不差 */
  clear() {
    for (const container of this.containers()) {
      for (const badge of Array.from(container.querySelectorAll(`.${BADGE_CLASS}`))) {
        badge.remove();
      }
    }
  }
  dispose() {
    var _a;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    (_a = this.observer) == null ? void 0 : _a.disconnect();
    this.observer = null;
    this.clear();
  }
  /**
   * 当前在场的文件浏览器容器。
   *
   * 走的是公开的 getLeavesOfType 与 View.containerEl，不碰文件浏览器视图的内部字段——
   * 社区里那些「文件数」插件读的是 view.fileItems，那不在 obsidian.d.ts 里。
   * 一块都找不到时返回空数组，调用方一律据此静默收工。
   */
  containers() {
    return this.ctx.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE).map((leaf) => leaf.view.containerEl);
  }
  /** 防御手改 data.json 写进来的未知口径：不在候选里就回落默认，与灵感插入位置同一姿态 */
  target() {
    const candidate = this.ctx.settings.folderCountTarget;
    return FOLDER_COUNT_TARGETS.includes(candidate) ? candidate : FOLDER_COUNT_DEFAULTS.target;
  }
};
function isOurs(record) {
  const { target } = record;
  if (target instanceof HTMLElement && target.classList.contains(BADGE_CLASS)) return true;
  return allBadges(record.addedNodes) && allBadges(record.removedNodes);
}
function allBadges(nodes) {
  return Array.from(nodes).every(
    (node) => node instanceof HTMLElement && node.classList.contains(BADGE_CLASS)
  );
}
function badgeOf(titleEl) {
  const badge = titleEl.querySelector(`:scope > .${BADGE_CLASS}`);
  return badge instanceof HTMLElement ? badge : null;
}
function describe3(tally, recursive) {
  const parts = [`${tally.notes}${TEXTS2.notes}`, `${tally.folders}${TEXTS2.folders}`];
  if (tally.others > 0) parts.push(`${tally.others}${TEXTS2.others}`);
  return parts.join(TEXTS2.separator) + (recursive ? TEXTS2.deepSuffix : "");
}

// src/modules/explorer/filePath.ts
var import_obsidian18 = require("obsidian");
var TEXTS3 = {
  tooltip: "\u5F53\u524D\u7B14\u8BB0\u8DEF\u5F84\uFF1A\u70B9\u4E00\u4E0B\u590D\u5236",
  /** 没有打开任何笔记时状态栏留空而不是写「无」——一句「无」比空白更占注意力 */
  empty: "",
  copied: "\u5DF2\u590D\u5236\u8DEF\u5F84\uFF1A",
  noFile: "\u5F53\u524D\u6CA1\u6709\u6253\u5F00\u4EFB\u4F55\u7B14\u8BB0\uFF0C\u6CA1\u6709\u8DEF\u5F84\u53EF\u590D\u5236\u3002",
  failed: "\u590D\u5236\u5931\u8D25\uFF1A"
};
function registerFilePath(ctx) {
  const bar = new FilePathBar(ctx);
  return () => bar.sync();
}
var FilePathBar = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.statusEl = ctx.plugin.addStatusBarItem();
    this.statusEl.addClass("ziminos-file-path");
    this.statusEl.addClass("mod-clickable");
    (0, import_obsidian18.setTooltip)(this.statusEl, TEXTS3.tooltip, { placement: "top" });
    this.statusEl.addEventListener("click", () => void this.copy());
    const { app, plugin } = ctx;
    plugin.registerEvent(app.workspace.on("file-open", () => this.sync()));
    plugin.registerEvent(app.workspace.on("active-leaf-change", () => this.sync()));
    ctx.commands.register(COPY_PATH_COMMAND, () => void this.copy());
    this.sync();
  }
  /** 按当前设置决定显隐，并把文字换成此刻这一篇的路径。设置页与两个事件走同一个入口 */
  sync() {
    var _a;
    this.statusEl.toggle(this.ctx.settings.showFilePath);
    this.statusEl.setText((_a = this.path()) != null ? _a : TEXTS3.empty);
  }
  /**
   * 此刻这一篇的路径。
   *
   * 取的是 workspace.getActiveFile() 而不是活动视图里的文件：焦点落在侧栏（比如刚点了
   * 最近文件那张清单）时活动视图不是 Markdown 视图，但用户心里「当前这一篇」并没有变。
   */
  path() {
    var _a, _b;
    return (_b = (_a = this.ctx.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : null;
  }
  /** 复制路径。状态栏那一块与命令走的是这同一段，因此两条路的结果与提示语一字不差 */
  async copy() {
    const path = this.path();
    if (!path) {
      new import_obsidian18.Notice(TEXTS3.noFile);
      return;
    }
    try {
      await navigator.clipboard.writeText(path);
      new import_obsidian18.Notice(TEXTS3.copied + path);
    } catch (error) {
      new import_obsidian18.Notice(TEXTS3.failed + (error instanceof Error ? error.message : String(error)));
    }
  }
};

// src/modules/explorer/recentFiles.ts
var import_obsidian19 = require("obsidian");
var RECENT_FILES_VIEW_TYPE = "ziminos-recent-files";
var TEXTS4 = {
  title: "\u6700\u8FD1\u6587\u4EF6",
  /** 视图可能在热重载时早于自有图标注册，标签页用 Obsidian 内建图标最稳（与日历同因） */
  icon: "history",
  empty: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002\u6253\u5F00\u4EFB\u610F\u4E00\u7BC7\u7B14\u8BB0\uFF0C\u5B83\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
};
var PERSIST_DEBOUNCE_MS2 = 1e3;
function registerRecentFiles(ctx) {
  const store = new RecentFilesStore(ctx);
  ctx.plugin.registerView(
    RECENT_FILES_VIEW_TYPE,
    (leaf) => new RecentFilesView(leaf, ctx, store)
  );
  ctx.commands.register(RECENT_FILES_COMMAND, () => {
    void revealRecentFiles(ctx.app).catch(() => void 0);
  });
  return () => store.notify();
}
async function revealRecentFiles(app) {
  await app.workspace.ensureSideLeaf(RECENT_FILES_VIEW_TYPE, "right", {
    active: true,
    reveal: true,
    split: false
  });
}
var RecentFilesStore = class {
  constructor(ctx) {
    /** 最近的排在最前。只存路径与时刻，文件本体每次渲染时现查——名字与修改时间都会变 */
    this.entries = [];
    this.listeners = /* @__PURE__ */ new Set();
    this.timer = null;
    this.ctx = ctx;
    this.statePath = `${ctx.app.vault.configDir}/plugins/${ctx.plugin.manifest.id}/${RECENT_FILES_FILE}`;
    const { app, plugin } = ctx;
    app.workspace.onLayoutReady(() => {
      void this.load().then(() => this.notify());
    });
    plugin.registerEvent(
      app.workspace.on("file-open", (file) => {
        if (file) this.push(file.path);
      })
    );
    plugin.registerEvent(
      app.vault.on("rename", (file, oldPath) => {
        let touched = false;
        this.entries = this.entries.map((entry) => {
          if (entry.path !== oldPath) return entry;
          touched = true;
          return { path: file.path, at: entry.at };
        });
        if (touched) this.commit();
      })
    );
    plugin.registerEvent(
      app.vault.on("delete", (file) => {
        const before = this.entries.length;
        this.entries = this.entries.filter((entry) => entry.path !== file.path);
        if (this.entries.length !== before) this.commit();
      })
    );
    plugin.register(() => {
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = null;
      this.listeners.clear();
      void this.persist();
    });
  }
  /** 视图开着时订阅一次，关掉时退订。返回退订函数，与日历的 HolidayService 同形 */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners) listener();
  }
  /**
   * 按当前设置取出该显示的那几条。
   *
   * 「最近修改」不是另一份清单，是同一份清单的另一种排法——清单的成员永远是
   * 「你打开过的」，因为一个你从没打开过的文件出现在「最近」里只会让人愣一下。
   * 路径查不到文件的一律跳过（在别处被删或被移走了），不显示一条点不开的记录。
   */
  list(sort, limit) {
    const files = [];
    for (const entry of this.entries) {
      const file = this.ctx.app.vault.getAbstractFileByPath(entry.path);
      if (file instanceof import_obsidian19.TFile) files.push(file);
    }
    if (sort === "modified") files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    return files.slice(0, limit);
  }
  /** 记一次打开。已经在清单里的挪到最前，不留两条 */
  push(path) {
    this.entries = [
      { path, at: Date.now() },
      ...this.entries.filter((entry) => entry.path !== path)
    ].slice(0, RECENT_FILES_KEEP);
    this.commit();
  }
  commit() {
    this.notify();
    this.schedulePersist();
  }
  schedulePersist() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.persist();
    }, PERSIST_DEBOUNCE_MS2);
  }
  async persist() {
    const payload = { version: 1, entries: this.entries };
    try {
      await this.ctx.app.vault.adapter.write(
        this.statePath,
        `${JSON.stringify(payload, null, 2)}
`
      );
    } catch (e) {
    }
  }
  async load() {
    const { adapter } = this.ctx.app.vault;
    try {
      if (!await adapter.exists(this.statePath)) return;
      this.entries = readEntries(JSON.parse(await adapter.read(this.statePath)));
    } catch (e) {
    }
  }
};
var RecentFilesView = class extends import_obsidian19.ItemView {
  constructor(leaf, ctx, store) {
    super(leaf);
    this.unsubscribe = null;
    this.ctx = ctx;
    this.store = store;
  }
  getViewType() {
    return RECENT_FILES_VIEW_TYPE;
  }
  getDisplayText() {
    return TEXTS4.title;
  }
  getIcon() {
    return TEXTS4.icon;
  }
  async onOpen() {
    this.contentEl.addClass("ziminos-recent");
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.render();
  }
  async onClose() {
    var _a;
    (_a = this.unsubscribe) == null ? void 0 : _a.call(this);
    this.unsubscribe = null;
    this.contentEl.empty();
  }
  /** 每次重画都整片重建：清单最长五十行，重建比逐行比对便宜，也不可能留下错位的行 */
  render() {
    this.contentEl.empty();
    const { recentFilesSort, recentFilesLimit } = this.ctx.settings;
    const files = this.store.list(recentFilesSort, recentFilesLimit);
    if (files.length === 0) {
      this.contentEl.createDiv({ cls: "ziminos-recent-empty", text: TEXTS4.empty });
      return;
    }
    const list = this.contentEl.createDiv({ cls: "ziminos-recent-list" });
    for (const file of files) this.renderRow(list, file);
  }
  /**
   * 一行一篇，只有笔记名。
   *
   * 曾经在名字下面另起一行写它在哪个文件夹，v0.17.0 由用户明令去掉——
   * 判据是这张清单该长得**与文件树一致**：文件树里一行就是一个名字，
   * 这里多出一行灰字，它就从「同一棵树的另一种排法」变成了另一种控件，
   * 而学员每认一行都要多读一行不需要的字。侧栏本来就窄，省下来的是行数也是注意力。
   * 完整路径没有丢，只是搬进了悬停提示——两篇同名笔记要分辨时问一句就有，
   * 平时不占屏幕。这也是「尽可能不显示路径」与「必须能分辨」唯一同时成立的位置。
   * 点一下用 openLinkText 打开——它认路径也认别名，与库里所有双链走同一条解析。
   */
  renderRow(list, file) {
    const row = list.createDiv({ cls: "ziminos-recent-row", text: file.basename });
    (0, import_obsidian19.setTooltip)(row, file.path, { placement: "top" });
    row.addEventListener("click", () => {
      void this.ctx.app.workspace.openLinkText(file.path, "", false);
    });
  }
};
function readEntries(raw) {
  if (typeof raw !== "object" || raw === null) return [];
  const entries = raw.entries;
  if (!Array.isArray(entries)) return [];
  const out = [];
  for (const item of entries) {
    if (typeof item !== "object" || item === null) continue;
    const { path, at } = item;
    if (typeof path !== "string" || !path) continue;
    if (typeof at !== "number" || !Number.isFinite(at)) continue;
    out.push({ path, at });
  }
  return out.slice(0, RECENT_FILES_KEEP);
}

// src/modules/format/formatter.ts
var import_obsidian20 = require("obsidian");
var FORMAT_DEBOUNCE_MS = 2e3;
var RE_ENTRY_MS = 1e3;
var TEXTS5 = {
  formatted: "\u5DF2\u6309\u6807\u51C6\u5199\u6CD5\u6574\u7406\u8FD9\u4E00\u7BC7 \u2713",
  unchanged: "\u8FD9\u4E00\u7BC7\u5DF2\u7ECF\u662F\u6807\u51C6\u5199\u6CD5\uFF0C\u6CA1\u6709\u53EF\u6539\u7684",
  noFile: "\u5148\u6253\u5F00\u4E00\u7BC7\u7B14\u8BB0\uFF0C\u518D\u8FD0\u884C\u6574\u7406",
  noRules: "\u6392\u7248\u89C4\u5219\u4E00\u6761\u90FD\u6CA1\u5F00\uFF0C\u5148\u53BB\u8BBE\u7F6E \u2192 ziminOS \u2192 \u6392\u7248\u6253\u5F00\u51E0\u6761",
  failed: "\u6574\u7406\u6CA1\u80FD\u5199\u8FDB\u53BB\uFF0C\u8FD9\u4E00\u7BC7\u6CA1\u6709\u53D8\u3002\u7A0D\u540E\u518D\u8BD5\u4E00\u6B21"
};
function registerFormatter(ctx) {
  const pendingTimeouts = /* @__PURE__ */ new Map();
  const dirtyWhileOpen = /* @__PURE__ */ new Set();
  const lastRun = /* @__PURE__ */ new Map();
  let openPath = null;
  const formatFile = async (file, mayWrite = () => true) => {
    const rules = ctx.settings.formatRules;
    const current = await ctx.app.vault.cachedRead(file);
    if (formatMarkdown(current, rules) === current) return false;
    if (!mayWrite()) return false;
    let changed = false;
    await ctx.app.vault.process(file, (content) => {
      if (!mayWrite()) return content;
      const next = formatMarkdown(content, rules);
      if (next === content) return content;
      changed = true;
      lastRun.set(file.path, Date.now());
      ctx.guard.mark(file.path);
      return next;
    });
    return changed;
  };
  const formatPath = async (path) => {
    if (!ctx.settings.autoFormat) return;
    const file = ctx.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian20.TFile) || file.extension !== "md") return;
    const mayWrite = () => {
      var _a;
      return ((_a = ctx.app.workspace.getActiveFile()) == null ? void 0 : _a.path) !== path;
    };
    if (!mayWrite()) {
      dirtyWhileOpen.add(path);
      return;
    }
    const changed = await formatFile(file, mayWrite);
    if (!changed && !mayWrite()) dirtyWhileOpen.add(path);
  };
  const cancel = (path) => {
    const pending2 = pendingTimeouts.get(path);
    if (pending2 === void 0) return;
    window.clearTimeout(pending2);
    pendingTimeouts.delete(path);
  };
  const schedule = (path) => {
    cancel(path);
    const timeoutId = window.setTimeout(() => {
      pendingTimeouts.delete(path);
      void formatPath(path).catch(() => {
      });
    }, FORMAT_DEBOUNCE_MS);
    pendingTimeouts.set(path, timeoutId);
  };
  ctx.plugin.register(() => {
    for (const timeoutId of pendingTimeouts.values()) window.clearTimeout(timeoutId);
    pendingTimeouts.clear();
  });
  const shouldSkip = (path) => {
    const last = lastRun.get(path);
    return last !== void 0 && Date.now() - last < RE_ENTRY_MS;
  };
  ctx.app.workspace.onLayoutReady(() => {
    var _a, _b;
    openPath = (_b = (_a = ctx.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : null;
    ctx.plugin.registerEvent(
      ctx.app.vault.on("modify", (file) => {
        if (!ctx.settings.autoFormat) {
          cancel(file.path);
          dirtyWhileOpen.delete(file.path);
          return;
        }
        if (!(file instanceof import_obsidian20.TFile) || file.extension !== "md") return;
        if (shouldSkip(file.path)) return;
        if (file.path === openPath) {
          dirtyWhileOpen.add(file.path);
          return;
        }
        schedule(file.path);
      })
    );
    const leaveCurrent = () => {
      var _a2, _b2;
      const nextPath = (_b2 = (_a2 = ctx.app.workspace.getActiveFile()) == null ? void 0 : _a2.path) != null ? _b2 : null;
      if (nextPath === openPath) return;
      const leaving = openPath;
      openPath = nextPath;
      if (leaving === null || !dirtyWhileOpen.delete(leaving)) return;
      void formatPath(leaving).catch(() => {
      });
    };
    ctx.plugin.registerEvent(ctx.app.workspace.on("active-leaf-change", leaveCurrent));
    ctx.plugin.registerEvent(ctx.app.workspace.on("file-open", leaveCurrent));
  });
  ctx.commands.register(FORMAT_COMMAND, () => {
    const file = ctx.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new import_obsidian20.Notice(TEXTS5.noFile);
      return;
    }
    if (ctx.settings.formatRules.length === 0) {
      new import_obsidian20.Notice(TEXTS5.noRules);
      return;
    }
    void formatFile(file).then((changed) => {
      dirtyWhileOpen.delete(file.path);
      new import_obsidian20.Notice(changed ? TEXTS5.formatted : TEXTS5.unchanged);
    }).catch(() => {
      new import_obsidian20.Notice(TEXTS5.failed);
    });
  });
}

// src/modules/legacy/vaultDock.ts
var import_obsidian21 = require("obsidian");
var UNAVAILABLE_SUFFIX = "\uFF1A\u8FD9\u4E2A Obsidian \u7248\u672C\u6CA1\u6709\u7ED9\u51FA\u8FD9\u4E2A\u5165\u53E3\u3002\u5B83\u4E0D\u5C5E\u4E8E\u5B98\u65B9\u516C\u5F00 API\uFF0CziminOS \u63A2\u4E0D\u5230\u5C31\u4E0D\u786C\u6765\u3002\u4F60\u4ECD\u7136\u53EF\u4EE5\u7528 Obsidian \u81EA\u5DF1\u7684\u6309\u94AE\u505A\u540C\u4E00\u4EF6\u4E8B\u3002";
function registerLegacyDock(ctx) {
  const { app } = ctx;
  ctx.commands.register(LEGACY_COMMANDS.vault, () => {
    run(LEGACY_COMMANDS.vault.name, bind(app, app.openVaultChooser));
  });
  ctx.commands.register(LEGACY_COMMANDS.help, () => {
    run(LEGACY_COMMANDS.help.name, bind(app, app.openHelp));
  });
  ctx.commands.register(LEGACY_COMMANDS.settings, () => {
    var _a;
    run(LEGACY_COMMANDS.settings.name, bind(app.setting, (_a = app.setting) == null ? void 0 : _a.open));
  });
}
function bind(host, fn) {
  if (!host || typeof fn !== "function") return void 0;
  return () => fn.call(host);
}
function run(label, opener) {
  if (!opener) {
    new import_obsidian21.Notice(label + UNAVAILABLE_SUFFIX);
    return;
  }
  opener();
}

// src/modules/calendar/view.ts
var import_obsidian23 = require("obsidian");

// src/modules/calendar/holidays.ts
var import_obsidian22 = require("obsidian");

// src/modules/calendar/holidaySnapshot.ts
var NOTICE_2026 = "https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm";
var BUILT_IN_HOLIDAY_DATASETS = [
  {
    year: 2026,
    papers: [NOTICE_2026],
    days: [
      { name: "\u5143\u65E6", date: "2026-01-01", isOffDay: true },
      { name: "\u5143\u65E6", date: "2026-01-02", isOffDay: true },
      { name: "\u5143\u65E6", date: "2026-01-03", isOffDay: true },
      { name: "\u5143\u65E6", date: "2026-01-04", isOffDay: false },
      { name: "\u6625\u8282", date: "2026-02-14", isOffDay: false },
      { name: "\u6625\u8282", date: "2026-02-15", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-16", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-17", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-18", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-19", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-20", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-21", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-22", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-23", isOffDay: true },
      { name: "\u6625\u8282", date: "2026-02-28", isOffDay: false },
      { name: "\u6E05\u660E\u8282", date: "2026-04-04", isOffDay: true },
      { name: "\u6E05\u660E\u8282", date: "2026-04-05", isOffDay: true },
      { name: "\u6E05\u660E\u8282", date: "2026-04-06", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-01", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-02", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-03", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-04", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-05", isOffDay: true },
      { name: "\u52B3\u52A8\u8282", date: "2026-05-09", isOffDay: false },
      { name: "\u7AEF\u5348\u8282", date: "2026-06-19", isOffDay: true },
      { name: "\u7AEF\u5348\u8282", date: "2026-06-20", isOffDay: true },
      { name: "\u7AEF\u5348\u8282", date: "2026-06-21", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-09-20", isOffDay: false },
      { name: "\u4E2D\u79CB\u8282", date: "2026-09-25", isOffDay: true },
      { name: "\u4E2D\u79CB\u8282", date: "2026-09-26", isOffDay: true },
      { name: "\u4E2D\u79CB\u8282", date: "2026-09-27", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-01", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-02", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-03", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-04", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-05", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-06", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-07", isOffDay: true },
      { name: "\u56FD\u5E86\u8282", date: "2026-10-10", isOffDay: false }
    ]
  }
];

// src/modules/calendar/holidays.ts
var CACHE_SCHEMA_VERSION = 1;
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var FAILED_RETRY_MS = 5 * 60 * 1e3;
var CACHE_FILE = "holiday-cache.json";
var SOURCES = [
  (year) => `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
  (year) => `https://fastly.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
  (year) => `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`
];
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}
function isGovernmentPaper(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "gov.cn" || url.hostname.endsWith(".gov.cn"));
  } catch (e) {
    return false;
  }
}
function parseHolidayDataset(input, expectedYear) {
  if (!isRecord2(input) || input.year !== expectedYear) return null;
  if (!Array.isArray(input.papers) || !Array.isArray(input.days)) return null;
  const papers = [];
  for (const paper of input.papers) {
    if (typeof paper !== "string" || !isGovernmentPaper(paper)) return null;
    papers.push(paper);
  }
  const days = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of input.days) {
    if (!isRecord2(item)) return null;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const date = typeof item.date === "string" ? item.date : "";
    const dateYear = Number(date.slice(0, 4));
    if (!name || !isIsoDate(date) || typeof item.isOffDay !== "boolean") return null;
    if (dateYear !== expectedYear && dateYear !== expectedYear - 1) return null;
    if (seen.has(date)) return null;
    seen.add(date);
    days.push({ name, date, isOffDay: item.isOffDay });
  }
  if (days.length > 0 && papers.length === 0) return null;
  days.sort((left, right) => left.date.localeCompare(right.date));
  return { year: expectedYear, papers, days };
}
var HolidayService = class {
  constructor(ctx) {
    this.records = /* @__PURE__ */ new Map();
    this.days = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this.inflight = /* @__PURE__ */ new Map();
    this.lastAttempt = /* @__PURE__ */ new Map();
    this.ctx = ctx;
    this.cachePath = `${ctx.app.vault.configDir}/plugins/${ctx.plugin.manifest.id}/${CACHE_FILE}`;
    for (const dataset of BUILT_IN_HOLIDAY_DATASETS) {
      this.records.set(dataset.year, { checkedAt: 0, dataset });
    }
    this.rebuildDays();
    this.ready = this.loadCache();
  }
  /** 取某一天的官方覆盖；没有即按普通工作日/周末解释 */
  day(date) {
    var _a;
    return (_a = this.days.get(date)) != null ? _a : null;
  }
  /** 当前显示年是否已经有正式安排，以及最近一次无感检查时间 */
  status(year) {
    const relevant = [this.records.get(year), this.records.get(year + 1)].filter(
      (record) => record !== void 0
    );
    const papers = /* @__PURE__ */ new Set();
    let lastCheckedAt = null;
    for (const record of relevant) {
      for (const paper of record.dataset.papers) papers.add(paper);
      if (record.checkedAt > 0) lastCheckedAt = Math.max(lastCheckedAt != null ? lastCheckedAt : 0, record.checkedAt);
    }
    const hasSchedule = [...this.days.keys()].some((date) => date.startsWith(`${year}-`));
    return { hasSchedule, lastCheckedAt, papers: [...papers] };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /**
   * 显示某公历年时同时检查“本年通知”和“下一年通知”。后者可能写入本年 12 月的补班，
   * 少查它会让跨年元旦附近静默出错。
   */
  async refreshCalendarYear(year) {
    await this.ready;
    await Promise.all([this.refreshNotice(year), this.refreshNotice(year + 1)]);
  }
  async refreshNotice(year) {
    var _a;
    const now = Date.now();
    const cached = this.records.get(year);
    if (cached && cached.checkedAt > 0 && now - cached.checkedAt < CACHE_TTL_MS) return;
    if (now - ((_a = this.lastAttempt.get(year)) != null ? _a : 0) < FAILED_RETRY_MS) return;
    const running = this.inflight.get(year);
    if (running) return running;
    const task = this.fetchAndStore(year, now).finally(() => this.inflight.delete(year));
    this.inflight.set(year, task);
    return task;
  }
  async fetchAndStore(year, checkedAt) {
    var _a;
    this.lastAttempt.set(year, checkedAt);
    const incoming = await this.fetchDataset(year);
    if (!incoming) return;
    const current = (_a = this.records.get(year)) == null ? void 0 : _a.dataset;
    const dataset = incoming.days.length === 0 && current && current.days.length > 0 ? current : incoming;
    this.records.set(year, { checkedAt, dataset });
    this.rebuildDays();
    try {
      await this.saveCache();
    } catch (e) {
    }
    this.emit();
  }
  async fetchDataset(year) {
    for (const source of SOURCES) {
      try {
        const response = await (0, import_obsidian22.requestUrl)({ url: source(year), throw: false });
        if (response.status !== 200) continue;
        const parsed = parseHolidayDataset(response.json, year);
        if (parsed) return parsed;
      } catch (e) {
      }
    }
    return null;
  }
  rebuildDays() {
    this.days.clear();
    const records = [...this.records.values()].sort(
      (left, right) => left.dataset.year - right.dataset.year
    );
    for (const record of records) {
      for (const day of record.dataset.days) this.days.set(day.date, day);
    }
  }
  async loadCache() {
    var _a;
    const adapter = this.ctx.app.vault.adapter;
    try {
      if (!await adapter.exists(this.cachePath)) return;
      const raw = JSON.parse(await adapter.read(this.cachePath));
      if (!isRecord2(raw) || raw.schemaVersion !== CACHE_SCHEMA_VERSION || !Array.isArray(raw.notices)) {
        return;
      }
      for (const item of raw.notices) {
        if (!isRecord2(item) || typeof item.checkedAt !== "number" || !Number.isFinite(item.checkedAt)) {
          continue;
        }
        if (!isRecord2(item.dataset)) continue;
        const year = item.dataset.year;
        if (typeof year !== "number" || !Number.isInteger(year)) continue;
        const dataset = parseHolidayDataset(item.dataset, year);
        if (!dataset) continue;
        const builtIn = (_a = this.records.get(year)) == null ? void 0 : _a.dataset;
        const chosen = dataset.days.length === 0 && builtIn && builtIn.days.length > 0 ? builtIn : dataset;
        this.records.set(year, { checkedAt: item.checkedAt, dataset: chosen });
      }
      this.rebuildDays();
      this.emit();
    } catch (e) {
    }
  }
  async saveCache() {
    const notices = [...this.records.values()].filter((record) => record.checkedAt > 0).sort((left, right) => left.dataset.year - right.dataset.year);
    const envelope = { schemaVersion: CACHE_SCHEMA_VERSION, notices };
    await this.ctx.app.vault.adapter.write(this.cachePath, `${JSON.stringify(envelope, null, 2)}
`);
  }
  emit() {
    for (const listener of this.listeners) listener();
  }
};

// ../../../node_modules/lunar-typescript/dist/index.mjs
var _SolarUtil = class {
  static isLeapYear(year) {
    if (year < 1600) {
      return year % 4 === 0;
    }
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  static getDaysOfMonth(year, month) {
    if (1582 === year && 10 === month) {
      return 21;
    }
    const m = month - 1;
    let d = _SolarUtil.DAYS_OF_MONTH[m];
    if (m === 1 && _SolarUtil.isLeapYear(year)) {
      d++;
    }
    return d;
  }
  static getDaysOfYear(year) {
    if (1582 === year) {
      return 355;
    }
    return _SolarUtil.isLeapYear(year) ? 366 : 365;
  }
  static getDaysInYear(year, month, day) {
    let days = 0;
    for (let i = 1; i < month; i++) {
      days += _SolarUtil.getDaysOfMonth(year, i);
    }
    let d = day;
    if (1582 === year && 10 === month && day >= 15) {
      if (day >= 15) {
        d -= 10;
      } else if (day > 4) {
        throw new Error(`wrong solar year ${year} month ${month} day ${day}`);
      }
    }
    days += d;
    return days;
  }
  static getWeeksOfMonth(year, month, start) {
    return Math.ceil((_SolarUtil.getDaysOfMonth(year, month) + Solar.fromYmd(year, month, 1).getWeek() - start) / 7);
  }
  static getDaysBetween(ay, am, ad, by, bm, bd) {
    if (ay == by) {
      return _SolarUtil.getDaysInYear(by, bm, bd) - _SolarUtil.getDaysInYear(ay, am, ad);
    } else if (ay > by) {
      let days = _SolarUtil.getDaysOfYear(by) - _SolarUtil.getDaysInYear(by, bm, bd);
      for (let i = by + 1; i < ay; i++) {
        days += _SolarUtil.getDaysOfYear(i);
      }
      days += _SolarUtil.getDaysInYear(ay, am, ad);
      return -days;
    } else {
      let days = _SolarUtil.getDaysOfYear(ay) - _SolarUtil.getDaysInYear(ay, am, ad);
      for (let i = ay + 1; i < by; i++) {
        days += _SolarUtil.getDaysOfYear(i);
      }
      days += _SolarUtil.getDaysInYear(by, bm, bd);
      return days;
    }
  }
};
var SolarUtil = _SolarUtil;
SolarUtil.WEEK = ["{w.sun}", "{w.mon}", "{w.tues}", "{w.wed}", "{w.thur}", "{w.fri}", "{w.sat}"];
SolarUtil.DAYS_OF_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
SolarUtil.XINGZUO = ["{xz.aries}", "{xz.taurus}", "{xz.gemini}", "{xz.cancer}", "{xz.leo}", "{xz.virgo}", "{xz.libra}", "{xz.scorpio}", "{xz.sagittarius}", "{xz.capricornus}", "{xz.aquarius}", "{xz.pisces}"];
SolarUtil.FESTIVAL = {
  "1-1": "{jr.yuanDan}",
  "2-14": "{jr.qingRen}",
  "3-8": "{jr.fuNv}",
  "3-12": "{jr.zhiShu}",
  "3-15": "{jr.xiaoFei}",
  "4-1": "{jr.yuRen}",
  "5-1": "{jr.wuYi}",
  "5-4": "{jr.qingNian}",
  "6-1": "{jr.erTong}",
  "7-1": "{jr.jianDang}",
  "8-1": "{jr.jianJun}",
  "9-10": "{jr.jiaoShi}",
  "10-1": "{jr.guoQing}",
  "10-31": "{jr.wanShengYe}",
  "11-1": "{jr.wanSheng}",
  "12-24": "{jr.pingAn}",
  "12-25": "{jr.shengDan}"
};
SolarUtil.OTHER_FESTIVAL = {
  "1-8": ["\u5468\u6069\u6765\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "1-10": ["\u4E2D\u56FD\u4EBA\u6C11\u8B66\u5BDF\u8282"],
  "1-14": ["\u65E5\u8BB0\u60C5\u4EBA\u8282"],
  "1-21": ["\u5217\u5B81\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "1-26": ["\u56FD\u9645\u6D77\u5173\u65E5"],
  "1-27": ["\u56FD\u9645\u5927\u5C60\u6740\u7EAA\u5FF5\u65E5"],
  "2-2": ["\u4E16\u754C\u6E7F\u5730\u65E5"],
  "2-4": ["\u4E16\u754C\u6297\u764C\u65E5"],
  "2-7": ["\u4EAC\u6C49\u94C1\u8DEF\u7F62\u5DE5\u7EAA\u5FF5\u65E5"],
  "2-10": ["\u56FD\u9645\u6C14\u8C61\u8282"],
  "2-19": ["\u9093\u5C0F\u5E73\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "2-20": ["\u4E16\u754C\u793E\u4F1A\u516C\u6B63\u65E5"],
  "2-21": ["\u56FD\u9645\u6BCD\u8BED\u65E5"],
  "2-24": ["\u7B2C\u4E09\u4E16\u754C\u9752\u5E74\u65E5"],
  "3-1": ["\u56FD\u9645\u6D77\u8C79\u65E5"],
  "3-3": ["\u4E16\u754C\u91CE\u751F\u52A8\u690D\u7269\u65E5", "\u5168\u56FD\u7231\u8033\u65E5"],
  "3-5": ["\u5468\u6069\u6765\u8BDE\u8FB0\u7EAA\u5FF5\u65E5", "\u4E2D\u56FD\u9752\u5E74\u5FD7\u613F\u8005\u670D\u52A1\u65E5"],
  "3-6": ["\u4E16\u754C\u9752\u5149\u773C\u65E5"],
  "3-7": ["\u5973\u751F\u8282"],
  "3-12": ["\u5B59\u4E2D\u5C71\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "3-14": ["\u9A6C\u514B\u601D\u901D\u4E16\u7EAA\u5FF5\u65E5", "\u767D\u8272\u60C5\u4EBA\u8282"],
  "3-17": ["\u56FD\u9645\u822A\u6D77\u65E5"],
  "3-18": ["\u5168\u56FD\u79D1\u6280\u4EBA\u624D\u6D3B\u52A8\u65E5", "\u5168\u56FD\u7231\u809D\u65E5"],
  "3-20": ["\u56FD\u9645\u5E78\u798F\u65E5"],
  "3-21": ["\u4E16\u754C\u68EE\u6797\u65E5", "\u4E16\u754C\u7761\u7720\u65E5", "\u56FD\u9645\u6D88\u9664\u79CD\u65CF\u6B67\u89C6\u65E5"],
  "3-22": ["\u4E16\u754C\u6C34\u65E5"],
  "3-23": ["\u4E16\u754C\u6C14\u8C61\u65E5"],
  "3-24": ["\u4E16\u754C\u9632\u6CBB\u7ED3\u6838\u75C5\u65E5"],
  "3-29": ["\u4E2D\u56FD\u9EC4\u82B1\u5C97\u4E03\u5341\u4E8C\u70C8\u58EB\u6B89\u96BE\u7EAA\u5FF5\u65E5"],
  "4-2": ["\u56FD\u9645\u513F\u7AE5\u56FE\u4E66\u65E5", "\u4E16\u754C\u81EA\u95ED\u75C7\u65E5"],
  "4-4": ["\u56FD\u9645\u5730\u96F7\u884C\u52A8\u65E5"],
  "4-7": ["\u4E16\u754C\u536B\u751F\u65E5"],
  "4-8": ["\u56FD\u9645\u73CD\u7A00\u52A8\u7269\u4FDD\u62A4\u65E5"],
  "4-12": ["\u4E16\u754C\u822A\u5929\u65E5"],
  "4-14": ["\u9ED1\u8272\u60C5\u4EBA\u8282"],
  "4-15": ["\u5168\u6C11\u56FD\u5BB6\u5B89\u5168\u6559\u80B2\u65E5"],
  "4-22": ["\u4E16\u754C\u5730\u7403\u65E5", "\u5217\u5B81\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"],
  "4-23": ["\u4E16\u754C\u8BFB\u4E66\u65E5"],
  "4-24": ["\u4E2D\u56FD\u822A\u5929\u65E5"],
  "4-25": ["\u513F\u7AE5\u9884\u9632\u63A5\u79CD\u5BA3\u4F20\u65E5"],
  "4-26": ["\u4E16\u754C\u77E5\u8BC6\u4EA7\u6743\u65E5", "\u5168\u56FD\u759F\u75BE\u65E5"],
  "4-28": ["\u4E16\u754C\u5B89\u5168\u751F\u4EA7\u4E0E\u5065\u5EB7\u65E5"],
  "4-30": ["\u5168\u56FD\u4EA4\u901A\u5B89\u5168\u53CD\u601D\u65E5"],
  "5-2": ["\u4E16\u754C\u91D1\u67AA\u9C7C\u65E5"],
  "5-3": ["\u4E16\u754C\u65B0\u95FB\u81EA\u7531\u65E5"],
  "5-5": ["\u9A6C\u514B\u601D\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"],
  "5-8": ["\u4E16\u754C\u7EA2\u5341\u5B57\u65E5"],
  "5-11": ["\u4E16\u754C\u80A5\u80D6\u65E5"],
  "5-12": ["\u5168\u56FD\u9632\u707E\u51CF\u707E\u65E5", "\u62A4\u58EB\u8282"],
  "5-14": ["\u73AB\u7470\u60C5\u4EBA\u8282"],
  "5-15": ["\u56FD\u9645\u5BB6\u5EAD\u65E5"],
  "5-19": ["\u4E2D\u56FD\u65C5\u6E38\u65E5"],
  "5-20": ["\u7F51\u7EDC\u60C5\u4EBA\u8282"],
  "5-22": ["\u56FD\u9645\u751F\u7269\u591A\u6837\u6027\u65E5"],
  "5-25": ["525\u5FC3\u7406\u5065\u5EB7\u8282"],
  "5-27": ["\u4E0A\u6D77\u89E3\u653E\u65E5"],
  "5-29": ["\u56FD\u9645\u7EF4\u548C\u4EBA\u5458\u65E5"],
  "5-30": ["\u4E2D\u56FD\u4E94\u5345\u8FD0\u52A8\u7EAA\u5FF5\u65E5"],
  "5-31": ["\u4E16\u754C\u65E0\u70DF\u65E5"],
  "6-3": ["\u4E16\u754C\u81EA\u884C\u8F66\u65E5"],
  "6-5": ["\u4E16\u754C\u73AF\u5883\u65E5"],
  "6-6": ["\u5168\u56FD\u7231\u773C\u65E5"],
  "6-8": ["\u4E16\u754C\u6D77\u6D0B\u65E5"],
  "6-11": ["\u4E2D\u56FD\u4EBA\u53E3\u65E5"],
  "6-14": ["\u4E16\u754C\u732E\u8840\u65E5", "\u4EB2\u4EB2\u60C5\u4EBA\u8282"],
  "6-17": ["\u4E16\u754C\u9632\u6CBB\u8352\u6F20\u5316\u4E0E\u5E72\u65F1\u65E5"],
  "6-20": ["\u4E16\u754C\u96BE\u6C11\u65E5"],
  "6-21": ["\u56FD\u9645\u745C\u4F3D\u65E5"],
  "6-25": ["\u5168\u56FD\u571F\u5730\u65E5"],
  "6-26": ["\u56FD\u9645\u7981\u6BD2\u65E5", "\u8054\u5408\u56FD\u5BAA\u7AE0\u65E5"],
  "7-1": ["\u9999\u6E2F\u56DE\u5F52\u7EAA\u5FF5\u65E5"],
  "7-6": ["\u56FD\u9645\u63A5\u543B\u65E5", "\u6731\u5FB7\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "7-7": ["\u4E03\u4E03\u4E8B\u53D8\u7EAA\u5FF5\u65E5"],
  "7-11": ["\u4E16\u754C\u4EBA\u53E3\u65E5", "\u4E2D\u56FD\u822A\u6D77\u65E5"],
  "7-14": ["\u94F6\u8272\u60C5\u4EBA\u8282"],
  "7-18": ["\u66FC\u5FB7\u62C9\u56FD\u9645\u65E5"],
  "7-30": ["\u56FD\u9645\u53CB\u8C0A\u65E5"],
  "8-3": ["\u7537\u4EBA\u8282"],
  "8-5": ["\u6069\u683C\u65AF\u901D\u4E16\u7EAA\u5FF5\u65E5"],
  "8-6": ["\u56FD\u9645\u7535\u5F71\u8282"],
  "8-8": ["\u5168\u6C11\u5065\u8EAB\u65E5"],
  "8-9": ["\u56FD\u9645\u571F\u8457\u4EBA\u65E5"],
  "8-12": ["\u56FD\u9645\u9752\u5E74\u8282"],
  "8-14": ["\u7EFF\u8272\u60C5\u4EBA\u8282"],
  "8-19": ["\u4E16\u754C\u4EBA\u9053\u4E3B\u4E49\u65E5", "\u4E2D\u56FD\u533B\u5E08\u8282"],
  "8-22": ["\u9093\u5C0F\u5E73\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"],
  "8-29": ["\u5168\u56FD\u6D4B\u7ED8\u6CD5\u5BA3\u4F20\u65E5"],
  "9-3": ["\u4E2D\u56FD\u6297\u65E5\u6218\u4E89\u80DC\u5229\u7EAA\u5FF5\u65E5"],
  "9-5": ["\u4E2D\u534E\u6148\u5584\u65E5"],
  "9-8": ["\u4E16\u754C\u626B\u76F2\u65E5"],
  "9-9": ["\u6BDB\u6CFD\u4E1C\u901D\u4E16\u7EAA\u5FF5\u65E5", "\u5168\u56FD\u62D2\u7EDD\u9152\u9A7E\u65E5"],
  "9-14": ["\u4E16\u754C\u6E05\u6D01\u5730\u7403\u65E5", "\u76F8\u7247\u60C5\u4EBA\u8282"],
  "9-15": ["\u56FD\u9645\u6C11\u4E3B\u65E5"],
  "9-16": ["\u56FD\u9645\u81ED\u6C27\u5C42\u4FDD\u62A4\u65E5"],
  "9-17": ["\u4E16\u754C\u9A91\u884C\u65E5"],
  "9-18": ["\u4E5D\u4E00\u516B\u4E8B\u53D8\u7EAA\u5FF5\u65E5"],
  "9-20": ["\u5168\u56FD\u7231\u7259\u65E5"],
  "9-21": ["\u56FD\u9645\u548C\u5E73\u65E5"],
  "9-27": ["\u4E16\u754C\u65C5\u6E38\u65E5"],
  "9-30": ["\u4E2D\u56FD\u70C8\u58EB\u7EAA\u5FF5\u65E5"],
  "10-1": ["\u56FD\u9645\u8001\u5E74\u4EBA\u65E5"],
  "10-2": ["\u56FD\u9645\u975E\u66B4\u529B\u65E5"],
  "10-4": ["\u4E16\u754C\u52A8\u7269\u65E5"],
  "10-11": ["\u56FD\u9645\u5973\u7AE5\u65E5"],
  "10-10": ["\u8F9B\u4EA5\u9769\u547D\u7EAA\u5FF5\u65E5"],
  "10-13": ["\u56FD\u9645\u51CF\u8F7B\u81EA\u7136\u707E\u5BB3\u65E5", "\u4E2D\u56FD\u5C11\u5E74\u5148\u950B\u961F\u8BDE\u8FB0\u65E5"],
  "10-14": ["\u8461\u8404\u9152\u60C5\u4EBA\u8282"],
  "10-16": ["\u4E16\u754C\u7CAE\u98DF\u65E5"],
  "10-17": ["\u5168\u56FD\u6276\u8D2B\u65E5"],
  "10-20": ["\u4E16\u754C\u7EDF\u8BA1\u65E5"],
  "10-24": ["\u4E16\u754C\u53D1\u5C55\u4FE1\u606F\u65E5", "\u7A0B\u5E8F\u5458\u8282"],
  "10-25": ["\u6297\u7F8E\u63F4\u671D\u7EAA\u5FF5\u65E5"],
  "11-5": ["\u4E16\u754C\u6D77\u5578\u65E5"],
  "11-8": ["\u8BB0\u8005\u8282"],
  "11-9": ["\u5168\u56FD\u6D88\u9632\u65E5"],
  "11-11": ["\u5149\u68CD\u8282"],
  "11-12": ["\u5B59\u4E2D\u5C71\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"],
  "11-14": ["\u7535\u5F71\u60C5\u4EBA\u8282"],
  "11-16": ["\u56FD\u9645\u5BBD\u5BB9\u65E5"],
  "11-17": ["\u56FD\u9645\u5927\u5B66\u751F\u8282"],
  "11-19": ["\u4E16\u754C\u5395\u6240\u65E5"],
  "11-28": ["\u6069\u683C\u65AF\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"],
  "11-29": ["\u56FD\u9645\u58F0\u63F4\u5DF4\u52D2\u65AF\u5766\u4EBA\u6C11\u65E5"],
  "12-1": ["\u4E16\u754C\u827E\u6ECB\u75C5\u65E5"],
  "12-2": ["\u5168\u56FD\u4EA4\u901A\u5B89\u5168\u65E5"],
  "12-3": ["\u4E16\u754C\u6B8B\u75BE\u4EBA\u65E5"],
  "12-4": ["\u5168\u56FD\u6CD5\u5236\u5BA3\u4F20\u65E5"],
  "12-5": ["\u4E16\u754C\u5F31\u80FD\u4EBA\u58EB\u65E5", "\u56FD\u9645\u5FD7\u613F\u4EBA\u5458\u65E5"],
  "12-7": ["\u56FD\u9645\u6C11\u822A\u65E5"],
  "12-9": ["\u4E16\u754C\u8DB3\u7403\u65E5", "\u56FD\u9645\u53CD\u8150\u8D25\u65E5"],
  "12-10": ["\u4E16\u754C\u4EBA\u6743\u65E5"],
  "12-11": ["\u56FD\u9645\u5C71\u5CB3\u65E5"],
  "12-12": ["\u897F\u5B89\u4E8B\u53D8\u7EAA\u5FF5\u65E5"],
  "12-13": ["\u56FD\u5BB6\u516C\u796D\u65E5"],
  "12-14": ["\u62E5\u62B1\u60C5\u4EBA\u8282"],
  "12-18": ["\u56FD\u9645\u79FB\u5F99\u8005\u65E5"],
  "12-26": ["\u6BDB\u6CFD\u4E1C\u8BDE\u8FB0\u7EAA\u5FF5\u65E5"]
};
SolarUtil.WEEK_FESTIVAL = {
  "3-0-1": "\u5168\u56FD\u4E2D\u5C0F\u5B66\u751F\u5B89\u5168\u6559\u80B2\u65E5",
  "5-2-0": "\u6BCD\u4EB2\u8282",
  "5-3-0": "\u5168\u56FD\u52A9\u6B8B\u65E5",
  "6-3-0": "\u7236\u4EB2\u8282",
  "9-3-6": "\u5168\u6C11\u56FD\u9632\u6559\u80B2\u65E5",
  "10-1-1": "\u4E16\u754C\u4F4F\u623F\u65E5",
  "11-4-4": "\u611F\u6069\u8282"
};
var SolarWeek = class _SolarWeek {
  static fromYmd(year, month, day, start) {
    return new _SolarWeek(year, month, day, start);
  }
  static fromDate(date, start) {
    return _SolarWeek.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate(), start);
  }
  constructor(year, month, day, start) {
    this._year = year;
    this._month = month;
    this._day = day;
    this._start = start;
  }
  getYear() {
    return this._year;
  }
  getMonth() {
    return this._month;
  }
  getDay() {
    return this._day;
  }
  getStart() {
    return this._start;
  }
  getIndex() {
    let offset = Solar.fromYmd(this._year, this._month, 1).getWeek() - this._start;
    if (offset < 0) {
      offset += 7;
    }
    return Math.ceil((this._day + offset) / 7);
  }
  getIndexInYear() {
    let offset = Solar.fromYmd(this._year, 1, 1).getWeek() - this._start;
    if (offset < 0) {
      offset += 7;
    }
    return Math.ceil((SolarUtil.getDaysInYear(this._year, this._month, this._day) + offset) / 7);
  }
  next(weeks, separateMonth) {
    const start = this._start;
    if (0 === weeks) {
      return _SolarWeek.fromYmd(this._year, this._month, this._day, start);
    }
    let solar = Solar.fromYmd(this._year, this._month, this._day);
    if (separateMonth) {
      let n = weeks;
      let week = _SolarWeek.fromYmd(this._year, this._month, this._day, start);
      let month = this._month;
      const plus = n > 0;
      while (0 !== n) {
        solar = solar.next(plus ? 7 : -7);
        week = _SolarWeek.fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
        let weekMonth = week.getMonth();
        if (month !== weekMonth) {
          const index = week.getIndex();
          if (plus) {
            if (1 === index) {
              const firstDay = week.getFirstDay();
              week = _SolarWeek.fromYmd(firstDay.getYear(), firstDay.getMonth(), firstDay.getDay(), start);
              weekMonth = week.getMonth();
            } else {
              solar = Solar.fromYmd(week.getYear(), week.getMonth(), 1);
              week = _SolarWeek.fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
            }
          } else {
            if (SolarUtil.getWeeksOfMonth(week.getYear(), week.getMonth(), start) === index) {
              const lastDay = week.getFirstDay().next(6);
              week = _SolarWeek.fromYmd(lastDay.getYear(), lastDay.getMonth(), lastDay.getDay(), start);
              weekMonth = week.getMonth();
            } else {
              solar = Solar.fromYmd(week.getYear(), week.getMonth(), SolarUtil.getDaysOfMonth(week.getYear(), week.getMonth()));
              week = _SolarWeek.fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
            }
          }
          month = weekMonth;
        }
        n -= plus ? 1 : -1;
      }
      return week;
    } else {
      solar = solar.next(weeks * 7);
      return _SolarWeek.fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
    }
  }
  getFirstDay() {
    const solar = Solar.fromYmd(this._year, this._month, this._day);
    let prev = solar.getWeek() - this._start;
    if (prev < 0) {
      prev += 7;
    }
    return solar.next(-prev);
  }
  getFirstDayInMonth() {
    let index = 0;
    const days = this.getDays();
    for (let i = 0; i < days.length; i++) {
      if (this._month === days[i].getMonth()) {
        index = i;
        break;
      }
    }
    return days[index];
  }
  getDays() {
    const firstDay = this.getFirstDay();
    const l = [];
    l.push(firstDay);
    for (let i = 1; i < 7; i++) {
      l.push(firstDay.next(i));
    }
    return l;
  }
  getDaysInMonth() {
    const days = this.getDays();
    const l = [];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (this._month !== day.getMonth()) {
        continue;
      }
      l.push(day);
    }
    return l;
  }
  toString() {
    return `${this.getYear()}.${this.getMonth()}.${this.getIndex()}`;
  }
  toFullString() {
    return `${this.getYear()}\u5E74${this.getMonth()}\u6708\u7B2C${this.getIndex()}\u5468`;
  }
};
var _LunarUtil = class {
  static getTimeZhiIndex(hm) {
    if (!hm) {
      return 0;
    }
    if (hm.length > 5) {
      hm = hm.substring(0, 5);
    }
    let x = 1;
    for (let i = 1; i < 22; i += 2) {
      if (hm >= (i < 10 ? "0" : "") + i + ":00" && hm <= (i + 1 < 10 ? "0" : "") + (i + 1) + ":59") {
        return x;
      }
      x++;
    }
    return 0;
  }
  static convertTime(hm) {
    return _LunarUtil.ZHI[_LunarUtil.getTimeZhiIndex(hm) + 1];
  }
  static getJiaZiIndex(ganZhi) {
    return _LunarUtil.index(ganZhi, _LunarUtil.JIA_ZI, 0);
  }
  static hex(n) {
    let hex = n.toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex.toUpperCase();
  }
  static getDayYi(monthGanZhi, dayGanZhi) {
    const l = [];
    const day = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(dayGanZhi));
    const month = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(monthGanZhi));
    let right = _LunarUtil.DAY_YI_JI;
    let index = right.indexOf(day + "=");
    while (index > -1) {
      right = right.substring(index + 3);
      let left = right;
      if (left.indexOf("=") > -1) {
        left = left.substring(0, left.indexOf("=") - 2);
      }
      let matched = false;
      const months = left.substring(0, left.indexOf(":"));
      for (let i = 0, j = months.length; i < j; i += 2) {
        if (months.substring(i, i + 2) == month) {
          matched = true;
          break;
        }
      }
      if (matched) {
        let ys = left.substring(left.indexOf(":") + 1);
        ys = ys.substring(0, ys.indexOf(","));
        for (let i = 0, j = ys.length; i < j; i += 2) {
          l.push(_LunarUtil.YI_JI[parseInt(ys.substring(i, i + 2), 16)]);
        }
        break;
      }
      index = right.indexOf(day + "=");
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getDayJi(monthGanZhi, dayGanZhi) {
    const l = [];
    const day = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(dayGanZhi));
    const month = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(monthGanZhi));
    let right = _LunarUtil.DAY_YI_JI;
    let index = right.indexOf(day + "=");
    while (index > -1) {
      right = right.substring(index + 3);
      let left = right;
      if (left.indexOf("=") > -1) {
        left = left.substring(0, left.indexOf("=") - 2);
      }
      let matched = false;
      const months = left.substring(0, left.indexOf(":"));
      for (let i = 0, j = months.length; i < j; i += 2) {
        if (months.substring(i, i + 2) == month) {
          matched = true;
          break;
        }
      }
      if (matched) {
        const js = left.substring(left.indexOf(",") + 1);
        for (let i = 0, j = js.length; i < j; i += 2) {
          l.push(_LunarUtil.YI_JI[parseInt(js.substring(i, i + 2), 16)]);
        }
        break;
      }
      index = right.indexOf(day + "=");
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getDayJiShen(monthZhiIndex, dayGanZhi) {
    const l = [];
    let m = monthZhiIndex - 2;
    if (m < 0) {
      m += 12;
    }
    let index = _LunarUtil.getJiaZiIndex(dayGanZhi).toString(16).toUpperCase();
    if (index.length < 2) {
      index = "0" + index;
    }
    const matcher = new RegExp(`;${index}(.[^;]*)`, "g").exec(_LunarUtil.DAY_SHEN_SHA[m]);
    if (matcher) {
      const data = matcher[1];
      for (let i = 0, j = data.length; i < j; i += 2) {
        const n = parseInt(data.substring(i, i + 2), 16);
        if (n < 60) {
          l.push(_LunarUtil.SHEN_SHA[n + 1]);
        }
      }
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getDayXiongSha(monthZhiIndex, dayGanZhi) {
    const l = [];
    let m = monthZhiIndex - 2;
    if (m < 0) {
      m += 12;
    }
    let index = _LunarUtil.getJiaZiIndex(dayGanZhi).toString(16).toUpperCase();
    if (index.length < 2) {
      index = "0" + index;
    }
    const matcher = new RegExp(`;${index}(.[^;]*)`, "g").exec(_LunarUtil.DAY_SHEN_SHA[m]);
    if (matcher) {
      const data = matcher[1];
      for (let i = 0, j = data.length; i < j; i += 2) {
        const n = parseInt(data.substring(i, i + 2), 16);
        if (n >= 60) {
          l.push(_LunarUtil.SHEN_SHA[n + 1]);
        }
      }
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getTimeYi(dayGanZhi, timeGanZhi) {
    const l = [];
    const day = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(dayGanZhi));
    const time = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(timeGanZhi));
    const index = _LunarUtil.TIME_YI_JI.indexOf(day + time + "=");
    if (index > -1) {
      let left = _LunarUtil.TIME_YI_JI.substring(index + 5);
      if (left.indexOf("=") > -1) {
        left = left.substring(0, left.indexOf("=") - 4);
      }
      const ys = left.substring(0, left.indexOf(","));
      for (let i = 0, j = ys.length; i < j; i += 2) {
        l.push(_LunarUtil.YI_JI[parseInt(ys.substring(i, i + 2), 16)]);
      }
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getTimeJi(dayGanZhi, timeGanZhi) {
    const l = [];
    const day = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(dayGanZhi));
    const time = _LunarUtil.hex(_LunarUtil.getJiaZiIndex(timeGanZhi));
    const index = _LunarUtil.TIME_YI_JI.indexOf(day + time + "=");
    if (index > -1) {
      let left = _LunarUtil.TIME_YI_JI.substring(index + 5);
      if (left.indexOf("=") > -1) {
        left = left.substring(0, left.indexOf("=") - 4);
      }
      const js = left.substring(left.indexOf(",") + 1);
      for (let i = 0, j = js.length; i < j; i += 2) {
        l.push(_LunarUtil.YI_JI[parseInt(js.substring(i, i + 2), 16)]);
      }
    }
    if (l.length < 1) {
      l.push(_LunarUtil.SHEN_SHA[0]);
    }
    return l;
  }
  static getXunIndex(ganZhi) {
    const gan = _LunarUtil.find(ganZhi, _LunarUtil.GAN);
    const zhi = _LunarUtil.find(ganZhi, _LunarUtil.ZHI);
    let diff = gan.index - zhi.index;
    if (diff < 0) {
      diff += 12;
    }
    return Math.floor(diff / 2);
  }
  static getXun(ganZhi) {
    return _LunarUtil.XUN[_LunarUtil.getXunIndex(ganZhi)];
  }
  static getXunKong(ganZhi) {
    return _LunarUtil.XUN_KONG[_LunarUtil.getXunIndex(ganZhi)];
  }
  static find(s, arr) {
    for (let i = 0, j = arr.length; i < j; i++) {
      const v = arr[i];
      if (v.length < 1) {
        continue;
      }
      if (s.indexOf(v) > -1) {
        return {
          index: i,
          value: v
        };
      }
    }
    return null;
  }
  static index(name, names, offset) {
    for (let i = 0, j = names.length; i < j; i++) {
      if (names[i] === name) {
        return i + offset;
      }
    }
    return -1;
  }
};
var LunarUtil = _LunarUtil;
LunarUtil.BASE_MONTH_ZHI_INDEX = 2;
LunarUtil.XUN = [
  "{jz.jiaZi}",
  "{jz.jiaXu}",
  "{jz.jiaShen}",
  "{jz.jiaWu}",
  "{jz.jiaChen}",
  "{jz.jiaYin}"
];
LunarUtil.XUN_KONG = [
  "{dz.xu}{dz.hai}",
  "{dz.shen}{dz.you}",
  "{dz.wu}{dz.wei}",
  "{dz.chen}{dz.si}",
  "{dz.yin}{dz.mao}",
  "{dz.zi}{dz.chou}"
];
LunarUtil.CHANG_SHENG = [
  "{ds.changSheng}",
  "{ds.muYu}",
  "{ds.guanDai}",
  "{ds.linGuan}",
  "{ds.diWang}",
  "{ds.shuai}",
  "{ds.bing}",
  "{ds.si}",
  "{ds.mu}",
  "{ds.jue}",
  "{ds.tai}",
  "{ds.yang}"
];
LunarUtil.MONTH_ZHI = [
  "",
  "{dz.yin}",
  "{dz.mao}",
  "{dz.chen}",
  "{dz.si}",
  "{dz.wu}",
  "{dz.wei}",
  "{dz.shen}",
  "{dz.you}",
  "{dz.xu}",
  "{dz.hai}",
  "{dz.zi}",
  "{dz.chou}"
];
LunarUtil.JIE_QI = [
  "{jq.dongZhi}",
  "{jq.xiaoHan}",
  "{jq.daHan}",
  "{jq.liChun}",
  "{jq.yuShui}",
  "{jq.jingZhe}",
  "{jq.chunFen}",
  "{jq.qingMing}",
  "{jq.guYu}",
  "{jq.liXia}",
  "{jq.xiaoMan}",
  "{jq.mangZhong}",
  "{jq.xiaZhi}",
  "{jq.xiaoShu}",
  "{jq.daShu}",
  "{jq.liQiu}",
  "{jq.chuShu}",
  "{jq.baiLu}",
  "{jq.qiuFen}",
  "{jq.hanLu}",
  "{jq.shuangJiang}",
  "{jq.liDong}",
  "{jq.xiaoXue}",
  "{jq.daXue}"
];
LunarUtil.JIE_QI_IN_USE = [
  "DA_XUE",
  "{jq.dongZhi}",
  "{jq.xiaoHan}",
  "{jq.daHan}",
  "{jq.liChun}",
  "{jq.yuShui}",
  "{jq.jingZhe}",
  "{jq.chunFen}",
  "{jq.qingMing}",
  "{jq.guYu}",
  "{jq.liXia}",
  "{jq.xiaoMan}",
  "{jq.mangZhong}",
  "{jq.xiaZhi}",
  "{jq.xiaoShu}",
  "{jq.daShu}",
  "{jq.liQiu}",
  "{jq.chuShu}",
  "{jq.baiLu}",
  "{jq.qiuFen}",
  "{jq.hanLu}",
  "{jq.shuangJiang}",
  "{jq.liDong}",
  "{jq.xiaoXue}",
  "{jq.daXue}",
  "DONG_ZHI",
  "XIAO_HAN",
  "DA_HAN",
  "LI_CHUN",
  "YU_SHUI",
  "JING_ZHE"
];
LunarUtil.LIU_YAO = [
  "{ly.xianSheng}",
  "{ly.youYin}",
  "{ly.xianFu}",
  "{ly.foMie}",
  "{ly.daAn}",
  "{ly.chiKou}"
];
LunarUtil.HOU = [
  "{h.first}",
  "{h.second}",
  "{h.third}"
];
LunarUtil.WU_HOU = [
  "{h.qiuYinJie}",
  "{h.miJiao}",
  "{h.shuiQuan}",
  "{h.yanBei}",
  "{h.queShi}",
  "{h.zhiShi}",
  "{h.jiShi}",
  "{h.zhengNiao}",
  "{h.shuiZe}",
  "{h.dongFeng}",
  "{h.zheChongShiZhen}",
  "{h.yuZhi}",
  "{h.taJi}",
  "{h.houYan}",
  "{h.caoMuMengDong}",
  "{h.taoShi}",
  "{h.cangGeng}",
  "{h.yingHua}",
  "{h.xuanNiaoZhi}",
  "{h.leiNai}",
  "{h.shiDian}",
  "{h.tongShi}",
  "{h.tianShu}",
  "{h.hongShi}",
  "{h.pingShi}",
  "{h.mingJiu}",
  "{h.daiSheng}",
  "{h.louGuo}",
  "{h.qiuYinChu}",
  "{h.wangGua}",
  "{h.kuCai}",
  "{h.miCao}",
  "{h.maiQiu}",
  "{h.tangLang}",
  "{h.juShi}",
  "{h.fanShe}",
  "{h.luJia}",
  "{h.tiaoShi}",
  "{h.banXia}",
  "{h.wenFeng}",
  "{h.xiShuai}",
  "{h.yingShi}",
  "{h.fuCao}",
  "{h.tuRun}",
  "{h.daYu}",
  "{h.liangFeng}",
  "{h.baiLu}",
  "{h.hanChan}",
  "{h.yingNai}",
  "{h.tianDi}",
  "{h.heNai}",
  "{h.hongYanLai}",
  "{h.xuanNiaoGui}",
  "{h.qunNiao}",
  "{h.leiShi}",
  "{h.zheChongPiHu}",
  "{h.shuiShiHe}",
  "{h.hongYanLaiBin}",
  "{h.queRu}",
  "{h.juYou}",
  "{h.caiNai}",
  "{h.caoMuHuangLuo}",
  "{h.zheChongXianFu}",
  "{h.shuiShiBing}",
  "{h.diShi}",
  "{h.zhiRu}",
  "{h.hongCang}",
  "{h.tianQi}",
  "{h.biSe}",
  "{h.heDan}",
  "{h.huShi}",
  "{h.liTing}"
];
LunarUtil.GAN = ["", "{tg.jia}", "{tg.yi}", "{tg.bing}", "{tg.ding}", "{tg.wu}", "{tg.ji}", "{tg.geng}", "{tg.xin}", "{tg.ren}", "{tg.gui}"];
LunarUtil.POSITION_XI = ["", "{bg.gen}", "{bg.qian}", "{bg.kun}", "{bg.li}", "{bg.xun}", "{bg.gen}", "{bg.qian}", "{bg.kun}", "{bg.li}", "{bg.xun}"];
LunarUtil.POSITION_YANG_GUI = ["", "{bg.kun}", "{bg.kun}", "{bg.dui}", "{bg.qian}", "{bg.gen}", "{bg.kan}", "{bg.li}", "{bg.gen}", "{bg.zhen}", "{bg.xun}"];
LunarUtil.POSITION_YIN_GUI = ["", "{bg.gen}", "{bg.kan}", "{bg.qian}", "{bg.dui}", "{bg.kun}", "{bg.kun}", "{bg.gen}", "{bg.li}", "{bg.xun}", "{bg.zhen}"];
LunarUtil.POSITION_FU = ["", "{bg.xun}", "{bg.xun}", "{bg.zhen}", "{bg.zhen}", "{bg.kan}", "{bg.li}", "{bg.kun}", "{bg.kun}", "{bg.qian}", "{bg.dui}"];
LunarUtil.POSITION_FU_2 = ["", "{bg.kan}", "{bg.kun}", "{bg.qian}", "{bg.xun}", "{bg.gen}", "{bg.kan}", "{bg.kun}", "{bg.qian}", "{bg.xun}", "{bg.gen}"];
LunarUtil.POSITION_CAI = ["", "{bg.gen}", "{bg.gen}", "{bg.kun}", "{bg.kun}", "{bg.kan}", "{bg.kan}", "{bg.zhen}", "{bg.zhen}", "{bg.li}", "{bg.li}"];
LunarUtil.POSITION_TAI_SUI_YEAR = ["{bg.kan}", "{bg.gen}", "{bg.gen}", "{bg.zhen}", "{bg.xun}", "{bg.xun}", "{bg.li}", "{bg.kun}", "{bg.kun}", "{bg.dui}", "{bg.kan}", "{bg.kan}"];
LunarUtil.POSITION_GAN = ["{bg.zhen}", "{bg.zhen}", "{bg.li}", "{bg.li}", "{ps.center}", "{ps.center}", "{bg.dui}", "{bg.dui}", "{bg.kan}", "{bg.kan}"];
LunarUtil.POSITION_ZHI = ["{bg.kan}", "{ps.center}", "{bg.zhen}", "{bg.zhen}", "{ps.center}", "{bg.li}", "{bg.li}", "{ps.center}", "{bg.dui}", "{bg.dui}", "{ps.center}", "{bg.kan}"];
LunarUtil.POSITION_TAI_DAY = [
  "{ts.zhan}{ts.men}{ts.dui} {ps.wai}{ps.dongNan}",
  "{ts.dui}{ts.mo}{ts.ce} {ps.wai}{ps.dongNan}",
  "{ts.chu}{ts.zao}{ts.lu} {ps.wai}{ps.zhengNan}",
  "{ts.cangKu}{ts.men} {ps.wai}{ps.zhengNan}",
  "{ts.fang}{ts.chuang}{ts.xi} {ps.wai}{ps.zhengNan}",
  "{ts.zhan}{ts.men}{ts.chuang} {ps.wai}{ps.zhengNan}",
  "{ts.zhan}{ts.dui}{ts.mo} {ps.wai}{ps.zhengNan}",
  "{ts.chu}{ts.zao}{ts.ce} {ps.wai}{ps.xiNan}",
  "{ts.cangKu}{ts.lu} {ps.wai}{ps.xiNan}",
  "{ts.fang}{ts.chuang}{ts.men} {ps.wai}{ps.xiNan}",
  "{ts.zhan}{ts.men}{ts.xi} {ps.wai}{ps.xiNan}",
  "{ts.dui}{ts.mo}{ts.chuang} {ps.wai}{ps.xiNan}",
  "{ts.chu}{ts.zao}{ts.dui} {ps.wai}{ps.xiNan}",
  "{ts.cangKu}{ts.ce} {ps.wai}{ps.zhengXi}",
  "{ts.fang}{ts.chuang}{ts.lu} {ps.wai}{ps.zhengXi}",
  "{ts.zhan}{ts.daMen} {ps.wai}{ps.zhengXi}",
  "{ts.dui}{ts.mo}{ts.xi} {ps.wai}{ps.zhengXi}",
  "{ts.chu}{ts.zao}{ts.chuang} {ps.wai}{ps.zhengXi}",
  "{ts.cangKu}{ts.dui} {ps.wai}{ps.xiBei}",
  "{ts.fang}{ts.chuang}{ts.ce} {ps.wai}{ps.xiBei}",
  "{ts.zhan}{ts.men}{ts.lu} {ps.wai}{ps.xiBei}",
  "{ts.dui}{ts.mo}{ts.men} {ps.wai}{ps.xiBei}",
  "{ts.chu}{ts.zao}{ts.xi} {ps.wai}{ps.xiBei}",
  "{ts.cangKu}{ts.chuang} {ps.wai}{ps.xiBei}",
  "{ts.fang}{ts.chuang}{ts.dui} {ps.wai}{ps.zhengBei}",
  "{ts.zhan}{ts.men}{ts.ce} {ps.wai}{ps.zhengBei}",
  "{ts.dui}{ts.mo}{ts.lu} {ps.wai}{ps.zhengBei}",
  "{ts.chu}{ts.zao}{ts.men} {ps.wai}{ps.zhengBei}",
  "{ts.cangKu}{ts.xi} {ps.wai}{ps.zhengBei}",
  "{ts.zhan}{ts.fang}{ts.chuang} {ps.fangNei}{ps.bei}",
  "{ts.zhan}{ts.men}{ts.dui} {ps.fangNei}{ps.bei}",
  "{ts.dui}{ts.mo}{ts.ce} {ps.fangNei}{ps.bei}",
  "{ts.chu}{ts.zao}{ts.lu} {ps.fangNei}{ps.bei}",
  "{ts.cangKu}{ts.men} {ps.fangNei}{ps.bei}",
  "{ts.fang}{ts.chuang}{ts.xi} {ps.fangNei}{ps.center}",
  "{ts.zhan}{ts.men}{ts.chuang} {ps.fangNei}{ps.center}",
  "{ts.zhan}{ts.dui}{ts.mo} {ps.fangNei}{ps.nan}",
  "{ts.chu}{ts.zao}{ts.ce} {ps.fangNei}{ps.nan}",
  "{ts.cangKu}{ts.lu} {ps.fangNei}{ps.nan}",
  "{ts.fang}{ts.chuang}{ts.men} {ps.fangNei}{ps.xi}",
  "{ts.zhan}{ts.men}{ts.xi} {ps.fangNei}{ps.dong}",
  "{ts.dui}{ts.mo}{ts.chuang} {ps.fangNei}{ps.dong}",
  "{ts.chu}{ts.zao}{ts.dui} {ps.fangNei}{ps.dong}",
  "{ts.cangKu}{ts.ce} {ps.fangNei}{ps.dong}",
  "{ts.fang}{ts.chuang}{ts.lu} {ps.fangNei}{ps.center}",
  "{ts.zhan}{ts.daMen} {ps.wai}{ps.dongBei}",
  "{ts.dui}{ts.mo}{ts.xi} {ps.wai}{ps.dongBei}",
  "{ts.chu}{ts.zao}{ts.chuang} {ps.wai}{ps.dongBei}",
  "{ts.cangKu}{ts.dui} {ps.wai}{ps.dongBei}",
  "{ts.fang}{ts.chuang}{ts.ce} {ps.wai}{ps.dongBei}",
  "{ts.zhan}{ts.men}{ts.lu} {ps.wai}{ps.dongBei}",
  "{ts.dui}{ts.mo}{ts.men} {ps.wai}{ps.zhengDong}",
  "{ts.chu}{ts.zao}{ts.xi} {ps.wai}{ps.zhengDong}",
  "{ts.cangKu}{ts.chuang} {ps.wai}{ps.zhengDong}",
  "{ts.fang}{ts.chuang}{ts.dui} {ps.wai}{ps.zhengDong}",
  "{ts.zhan}{ts.men}{ts.ce} {ps.wai}{ps.zhengDong}",
  "{ts.dui}{ts.mo}{ts.lu} {ps.wai}{ps.dongNan}",
  "{ts.chu}{ts.zao}{ts.men} {ps.wai}{ps.dongNan}",
  "{ts.cangKu}{ts.xi} {ps.wai}{ps.dongNan}",
  "{ts.zhan}{ts.fang}{ts.chuang} {ps.wai}{ps.dongNan}"
];
LunarUtil.POSITION_TAI_MONTH = [
  "{ts.zhan}{ts.fang}{ts.chuang}",
  "{ts.zhan}{ts.hu}{ts.win}",
  "{ts.zhan}{ts.men}{ts.tang}",
  "{ts.zhan}{ts.chu}{ts.zao}",
  "{ts.zhan}{ts.fang}{ts.chuang}",
  "{ts.zhan}{ts.chuang}{ts.cang}",
  "{ts.zhan}{ts.dui}{ts.mo}",
  "{ts.zhan}{ts.ce}{ts.hu}",
  "{ts.zhan}{ts.men}{ts.fang}",
  "{ts.zhan}{ts.fang}{ts.chuang}",
  "{ts.zhan}{ts.zao}{ts.lu}",
  "{ts.zhan}{ts.fang}{ts.chuang}"
];
LunarUtil.ZHI = ["", "{dz.zi}", "{dz.chou}", "{dz.yin}", "{dz.mao}", "{dz.chen}", "{dz.si}", "{dz.wu}", "{dz.wei}", "{dz.shen}", "{dz.you}", "{dz.xu}", "{dz.hai}"];
LunarUtil.ZHI_XING = [
  "",
  "{zx.jian}",
  "{zx.chu}",
  "{zx.man}",
  "{zx.ping}",
  "{zx.ding}",
  "{zx.zhi}",
  "{zx.po}",
  "{zx.wei}",
  "{zx.cheng}",
  "{zx.shou}",
  "{zx.kai}",
  "{zx.bi}"
];
LunarUtil.JIA_ZI = [
  "{jz.jiaZi}",
  "{jz.yiChou}",
  "{jz.bingYin}",
  "{jz.dingMao}",
  "{jz.wuChen}",
  "{jz.jiSi}",
  "{jz.gengWu}",
  "{jz.xinWei}",
  "{jz.renShen}",
  "{jz.guiYou}",
  "{jz.jiaXu}",
  "{jz.yiHai}",
  "{jz.bingZi}",
  "{jz.dingChou}",
  "{jz.wuYin}",
  "{jz.jiMao}",
  "{jz.gengChen}",
  "{jz.xinSi}",
  "{jz.renWu}",
  "{jz.guiWei}",
  "{jz.jiaShen}",
  "{jz.yiYou}",
  "{jz.bingXu}",
  "{jz.dingHai}",
  "{jz.wuZi}",
  "{jz.jiChou}",
  "{jz.gengYin}",
  "{jz.xinMao}",
  "{jz.renChen}",
  "{jz.guiSi}",
  "{jz.jiaWu}",
  "{jz.yiWei}",
  "{jz.bingShen}",
  "{jz.dingYou}",
  "{jz.wuXu}",
  "{jz.jiHai}",
  "{jz.gengZi}",
  "{jz.xinChou}",
  "{jz.renYin}",
  "{jz.guiMao}",
  "{jz.jiaChen}",
  "{jz.yiSi}",
  "{jz.bingWu}",
  "{jz.dingWei}",
  "{jz.wuShen}",
  "{jz.jiYou}",
  "{jz.gengXu}",
  "{jz.xinHai}",
  "{jz.renZi}",
  "{jz.guiChou}",
  "{jz.jiaYin}",
  "{jz.yiMao}",
  "{jz.bingChen}",
  "{jz.dingSi}",
  "{jz.wuWu}",
  "{jz.jiWei}",
  "{jz.gengShen}",
  "{jz.xinYou}",
  "{jz.renXu}",
  "{jz.guiHai}"
];
LunarUtil.CHANG_SHENG_OFFSET = {
  "{tg.jia}": 1,
  "{tg.bing}": 10,
  "{tg.wu}": 10,
  "{tg.geng}": 7,
  "{tg.ren}": 4,
  "{tg.yi}": 6,
  "{tg.ding}": 9,
  "{tg.ji}": 9,
  "{tg.xin}": 0,
  "{tg.gui}": 3
};
LunarUtil.TIAN_SHEN = ["", "{sn.qingLong}", "{sn.mingTang}", "{sn.tianXing}", "{sn.zhuQue}", "{sn.jinKui}", "{sn.tianDe}", "{sn.baiHu}", "{sn.yuTang}", "{sn.tianLao}", "{sn.xuanWu}", "{sn.siMing}", "{sn.gouChen}"];
LunarUtil.ZHI_TIAN_SHEN_OFFSET = {
  "{dz.zi}": 4,
  "{dz.chou}": 2,
  "{dz.yin}": 0,
  "{dz.mao}": 10,
  "{dz.chen}": 8,
  "{dz.si}": 6,
  "{dz.wu}": 4,
  "{dz.wei}": 2,
  "{dz.shen}": 0,
  "{dz.you}": 10,
  "{dz.xu}": 8,
  "{dz.hai}": 6
};
LunarUtil.TIAN_SHEN_TYPE = {
  "{sn.qingLong}": "{s.huangDao}",
  "{sn.mingTang}": "{s.huangDao}",
  "{sn.jinKui}": "{s.huangDao}",
  "{sn.tianDe}": "{s.huangDao}",
  "{sn.yuTang}": "{s.huangDao}",
  "{sn.siMing}": "{s.huangDao}",
  "{sn.tianXing}": "{s.heiDao}",
  "{sn.zhuQue}": "{s.heiDao}",
  "{sn.baiHu}": "{s.heiDao}",
  "{sn.tianLao}": "{s.heiDao}",
  "{sn.xuanWu}": "{s.heiDao}",
  "{sn.gouChen}": "{s.heiDao}"
};
LunarUtil.TIAN_SHEN_TYPE_LUCK = {
  "{s.huangDao}": "{s.goodLuck}",
  "{s.heiDao}": "{s.badLuck}"
};
LunarUtil.LU = {
  "{tg.jia}": "{dz.yin}",
  "{tg.yi}": "{dz.mao}",
  "{tg.bing}": "{dz.si}",
  "{tg.ding}": "{dz.wu}",
  "{tg.wu}": "{dz.si}",
  "{tg.ji}": "{dz.wu}",
  "{tg.geng}": "{dz.shen}",
  "{tg.xin}": "{dz.you}",
  "{tg.ren}": "{dz.hai}",
  "{tg.gui}": "{dz.zi}",
  "{dz.yin}": "{tg.jia}",
  "{dz.mao}": "{tg.yi}",
  "{dz.si}": "{tg.bing},{tg.wu}",
  "{dz.wu}": "{tg.ding},{tg.ji}",
  "{dz.shen}": "{tg.geng}",
  "{dz.you}": "{tg.xin}",
  "{dz.hai}": "{tg.ren}",
  "{dz.zi}": "{tg.gui}"
};
LunarUtil.PENGZU_GAN = ["", "{tg.jia}\u4E0D\u5F00\u4ED3\u8D22\u7269\u8017\u6563", "{tg.yi}\u4E0D\u683D\u690D\u5343\u682A\u4E0D\u957F", "{tg.bing}\u4E0D\u4FEE\u7076\u5FC5\u89C1\u707E\u6B83", "{tg.ding}\u4E0D\u5243\u5934\u5934\u5FC5\u751F\u75AE", "{tg.wu}\u4E0D\u53D7\u7530\u7530\u4E3B\u4E0D\u7965", "{tg.ji}\u4E0D\u7834\u5238\u4E8C\u6BD4\u5E76\u4EA1", "{tg.geng}\u4E0D\u7ECF\u7EDC\u7EC7\u673A\u865A\u5F20", "{tg.xin}\u4E0D\u5408\u9171\u4E3B\u4EBA\u4E0D\u5C1D", "{tg.ren}\u4E0D\u6CF1\u6C34\u66F4\u96BE\u63D0\u9632", "{tg.gui}\u4E0D\u8BCD\u8BBC\u7406\u5F31\u654C\u5F3A"];
LunarUtil.PENGZU_ZHI = ["", "{dz.zi}\u4E0D\u95EE\u535C\u81EA\u60F9\u7978\u6B83", "{dz.chou}\u4E0D\u51A0\u5E26\u4E3B\u4E0D\u8FD8\u4E61", "{dz.yin}\u4E0D\u796D\u7940\u795E\u9B3C\u4E0D\u5C1D", "{dz.mao}\u4E0D\u7A7F\u4E95\u6C34\u6CC9\u4E0D\u9999", "{dz.chen}\u4E0D\u54ED\u6CE3\u5FC5\u4E3B\u91CD\u4E27", "{dz.si}\u4E0D\u8FDC\u884C\u8D22\u7269\u4F0F\u85CF", "{dz.wu}\u4E0D\u82EB\u76D6\u5C4B\u4E3B\u66F4\u5F20", "{dz.wei}\u4E0D\u670D\u836F\u6BD2\u6C14\u5165\u80A0", "{dz.shen}\u4E0D\u5B89\u5E8A\u9B3C\u795F\u5165\u623F", "{dz.you}\u4E0D\u4F1A\u5BA2\u9189\u5750\u98A0\u72C2", "{dz.xu}\u4E0D\u5403\u72AC\u4F5C\u602A\u4E0A\u5E8A", "{dz.hai}\u4E0D\u5AC1\u5A36\u4E0D\u5229\u65B0\u90CE"];
LunarUtil.NUMBER = ["{n.zero}", "{n.one}", "{n.two}", "{n.three}", "{n.four}", "{n.five}", "{n.six}", "{n.seven}", "{n.eight}", "{n.nine}", "{n.ten}", "{n.eleven}", "{n.twelve}"];
LunarUtil.MONTH = [
  "",
  "{m.one}",
  "{m.two}",
  "{m.three}",
  "{m.four}",
  "{m.five}",
  "{m.six}",
  "{m.seven}",
  "{m.eight}",
  "{m.nine}",
  "{m.ten}",
  "{m.eleven}",
  "{m.twelve}"
];
LunarUtil.SEASON = [
  "",
  "{od.first}{sz.chun}",
  "{od.second}{sz.chun}",
  "{od.third}{sz.chun}",
  "{od.first}{sz.xia}",
  "{od.second}{sz.xia}",
  "{od.third}{sz.xia}",
  "{od.first}{sz.qiu}",
  "{od.second}{sz.qiu}",
  "{od.third}{sz.qiu}",
  "{od.first}{sz.dong}",
  "{od.second}{sz.dong}",
  "{od.third}{sz.dong}"
];
LunarUtil.SHENGXIAO = ["", "{sx.rat}", "{sx.ox}", "{sx.tiger}", "{sx.rabbit}", "{sx.dragon}", "{sx.snake}", "{sx.horse}", "{sx.goat}", "{sx.monkey}", "{sx.rooster}", "{sx.dog}", "{sx.pig}"];
LunarUtil.DAY = [
  "",
  "{d.one}",
  "{d.two}",
  "{d.three}",
  "{d.four}",
  "{d.five}",
  "{d.six}",
  "{d.seven}",
  "{d.eight}",
  "{d.nine}",
  "{d.ten}",
  "{d.eleven}",
  "{d.twelve}",
  "{d.thirteen}",
  "{d.fourteen}",
  "{d.fifteen}",
  "{d.sixteen}",
  "{d.seventeen}",
  "{d.eighteen}",
  "{d.nighteen}",
  "{d.twenty}",
  "{d.twentyOne}",
  "{d.twentyTwo}",
  "{d.twentyThree}",
  "{d.twentyFour}",
  "{d.twentyFive}",
  "{d.twentySix}",
  "{d.twentySeven}",
  "{d.twentyEight}",
  "{d.twentyNine}",
  "{d.thirty}"
];
LunarUtil.YUE_XIANG = [
  "",
  "{yx.shuo}",
  "{yx.jiShuo}",
  "{yx.eMeiXin}",
  "{yx.eMeiXin}",
  "{yx.eMei}",
  "{yx.xi}",
  "{yx.shangXian}",
  "{yx.shangXian}",
  "{yx.jiuYe}",
  "{yx.night}",
  "{yx.night}",
  "{yx.night}",
  "{yx.jianYingTu}",
  "{yx.xiaoWang}",
  "{yx.wang}",
  "{yx.jiWang}",
  "{yx.liDai}",
  "{yx.juDai}",
  "{yx.qinDai}",
  "{yx.gengDai}",
  "{yx.jianKuiTu}",
  "{yx.xiaXian}",
  "{yx.xiaXian}",
  "{yx.youMing}",
  "{yx.youMing}",
  "{yx.eMeiCan}",
  "{yx.eMeiCan}",
  "{yx.can}",
  "{yx.xiao}",
  "{yx.hui}"
];
LunarUtil.XIU = {
  "{dz.shen}1": "{xx.bi}",
  "{dz.shen}2": "{xx.yi}",
  "{dz.shen}3": "{xx.ji}",
  "{dz.shen}4": "{xx.kui}",
  "{dz.shen}5": "{xx.gui}",
  "{dz.shen}6": "{xx.di}",
  "{dz.shen}0": "{xx.xu}",
  "{dz.zi}1": "{xx.bi}",
  "{dz.zi}2": "{xx.yi}",
  "{dz.zi}3": "{xx.ji}",
  "{dz.zi}4": "{xx.kui}",
  "{dz.zi}5": "{xx.gui}",
  "{dz.zi}6": "{xx.di}",
  "{dz.zi}0": "{xx.xu}",
  "{dz.chen}1": "{xx.bi}",
  "{dz.chen}2": "{xx.yi}",
  "{dz.chen}3": "{xx.ji}",
  "{dz.chen}4": "{xx.kui}",
  "{dz.chen}5": "{xx.gui}",
  "{dz.chen}6": "{xx.di}",
  "{dz.chen}0": "{xx.xu}",
  "{dz.si}1": "{xx.wei}",
  "{dz.si}2": "{xx.zi}",
  "{dz.si}3": "{xx.zhen}",
  "{dz.si}4": "{xx.dou}",
  "{dz.si}5": "{xx.lou}",
  "{dz.si}6": "{xx.liu}",
  "{dz.si}0": "{xx.fang}",
  "{dz.you}1": "{xx.wei}",
  "{dz.you}2": "{xx.zi}",
  "{dz.you}3": "{xx.zhen}",
  "{dz.you}4": "{xx.dou}",
  "{dz.you}5": "{xx.lou}",
  "{dz.you}6": "{xx.liu}",
  "{dz.you}0": "{xx.fang}",
  "{dz.chou}1": "{xx.wei}",
  "{dz.chou}2": "{xx.zi}",
  "{dz.chou}3": "{xx.zhen}",
  "{dz.chou}4": "{xx.dou}",
  "{dz.chou}5": "{xx.lou}",
  "{dz.chou}6": "{xx.liu}",
  "{dz.chou}0": "{xx.fang}",
  "{dz.yin}1": "{xx.xin}",
  "{dz.yin}2": "{xx.shi}",
  "{dz.yin}3": "{xx.can}",
  "{dz.yin}4": "{xx.jiao}",
  "{dz.yin}5": "{xx.niu}",
  "{dz.yin}6": "{xx.vei}",
  "{dz.yin}0": "{xx.xing}",
  "{dz.wu}1": "{xx.xin}",
  "{dz.wu}2": "{xx.shi}",
  "{dz.wu}3": "{xx.can}",
  "{dz.wu}4": "{xx.jiao}",
  "{dz.wu}5": "{xx.niu}",
  "{dz.wu}6": "{xx.vei}",
  "{dz.wu}0": "{xx.xing}",
  "{dz.xu}1": "{xx.xin}",
  "{dz.xu}2": "{xx.shi}",
  "{dz.xu}3": "{xx.can}",
  "{dz.xu}4": "{xx.jiao}",
  "{dz.xu}5": "{xx.niu}",
  "{dz.xu}6": "{xx.vei}",
  "{dz.xu}0": "{xx.xing}",
  "{dz.hai}1": "{xx.zhang}",
  "{dz.hai}2": "{xx.tail}",
  "{dz.hai}3": "{xx.qiang}",
  "{dz.hai}4": "{xx.jing}",
  "{dz.hai}5": "{xx.kang}",
  "{dz.hai}6": "{xx.nv}",
  "{dz.hai}0": "{xx.mao}",
  "{dz.mao}1": "{xx.zhang}",
  "{dz.mao}2": "{xx.tail}",
  "{dz.mao}3": "{xx.qiang}",
  "{dz.mao}4": "{xx.jing}",
  "{dz.mao}5": "{xx.kang}",
  "{dz.mao}6": "{xx.nv}",
  "{dz.mao}0": "{xx.mao}",
  "{dz.wei}1": "{xx.zhang}",
  "{dz.wei}2": "{xx.tail}",
  "{dz.wei}3": "{xx.qiang}",
  "{dz.wei}4": "{xx.jing}",
  "{dz.wei}5": "{xx.kang}",
  "{dz.wei}6": "{xx.nv}",
  "{dz.wei}0": "{xx.mao}"
};
LunarUtil.XIU_LUCK = {
  "{xx.jiao}": "{s.goodLuck}",
  "{xx.kang}": "{s.badLuck}",
  "{xx.di}": "{s.badLuck}",
  "{xx.fang}": "{s.goodLuck}",
  "{xx.xin}": "{s.badLuck}",
  "{xx.tail}": "{s.goodLuck}",
  "{xx.ji}": "{s.goodLuck}",
  "{xx.dou}": "{s.goodLuck}",
  "{xx.niu}": "{s.badLuck}",
  "{xx.nv}": "{s.badLuck}",
  "{xx.xu}": "{s.badLuck}",
  "{xx.wei}": "{s.badLuck}",
  "{xx.shi}": "{s.goodLuck}",
  "{xx.qiang}": "{s.goodLuck}",
  "{xx.kui}": "{s.badLuck}",
  "{xx.lou}": "{s.goodLuck}",
  "{xx.vei}": "{s.goodLuck}",
  "{xx.mao}": "{s.badLuck}",
  "{xx.bi}": "{s.goodLuck}",
  "{xx.zi}": "{s.badLuck}",
  "{xx.can}": "{s.goodLuck}",
  "{xx.jing}": "{s.goodLuck}",
  "{xx.gui}": "{s.badLuck}",
  "{xx.liu}": "{s.badLuck}",
  "{xx.xing}": "{s.badLuck}",
  "{xx.zhang}": "{s.goodLuck}",
  "{xx.yi}": "{s.badLuck}",
  "{xx.zhen}": "{s.goodLuck}"
};
LunarUtil.XIU_SONG = {
  "{xx.jiao}": "\u89D2\u661F\u9020\u4F5C\u4E3B\u8363\u660C\uFF0C\u5916\u8FDB\u7530\u8D22\u53CA\u5973\u90CE\uFF0C\u5AC1\u5A36\u5A5A\u59FB\u51FA\u8D35\u5B50\uFF0C\u6587\u4EBA\u53CA\u7B2C\u89C1\u541B\u738B\uFF0C\u60DF\u6709\u57CB\u846C\u4E0D\u53EF\u7528\uFF0C\u4E09\u5E74\u4E4B\u540E\u4E3B\u761F\u75AB\uFF0C\u8D77\u5DE5\u4FEE\u7B51\u575F\u57FA\u5730\uFF0C\u5802\u524D\u7ACB\u89C1\u4E3B\u4EBA\u51F6\u3002",
  "{xx.kang}": "\u4EA2\u661F\u9020\u4F5C\u957F\u623F\u5F53\uFF0C\u5341\u65E5\u4E4B\u4E2D\u4E3B\u6709\u6B83\uFF0C\u7530\u5730\u6D88\u78E8\u5B98\u5931\u804C\uFF0C\u63A5\u8FD0\u5B9A\u662F\u864E\u72FC\u4F24\uFF0C\u5AC1\u5A36\u5A5A\u59FB\u7528\u6B64\u65E5\uFF0C\u513F\u5B59\u65B0\u5987\u5B88\u7A7A\u623F\uFF0C\u57CB\u846C\u82E5\u8FD8\u7528\u6B64\u65E5\uFF0C\u5F53\u65F6\u5BB3\u7978\u4E3B\u91CD\u4F24\u3002",
  "{xx.di}": "\u6C10\u661F\u9020\u4F5C\u4E3B\u707E\u51F6\uFF0C\u8D39\u5C3D\u7530\u56ED\u4ED3\u5E93\u7A7A\uFF0C\u57CB\u846C\u4E0D\u53EF\u7528\u6B64\u65E5\uFF0C\u60AC\u7EF3\u540A\u9888\u7978\u91CD\u91CD\uFF0C\u82E5\u662F\u5A5A\u59FB\u79BB\u522B\u6563\uFF0C\u591C\u62DB\u6D6A\u5B50\u5165\u623F\u4E2D\uFF0C\u884C\u8239\u5FC5\u5B9A\u906D\u6C89\u6CA1\uFF0C\u66F4\u751F\u804B\u54D1\u5B50\u5B59\u7A77\u3002",
  "{xx.fang}": "\u623F\u661F\u9020\u4F5C\u7530\u56ED\u8FDB\uFF0C\u94B1\u8D22\u725B\u9A6C\u904D\u5C71\u5C97\uFF0C\u66F4\u62DB\u5916\u5904\u7530\u5E84\u5B85\uFF0C\u8363\u534E\u5BCC\u8D35\u798F\u7984\u5EB7\uFF0C\u57CB\u846C\u82E5\u7136\u7528\u6B64\u65E5\uFF0C\u9AD8\u5B98\u8FDB\u804C\u62DC\u541B\u738B\uFF0C\u5AC1\u5A36\u5AE6\u5A25\u81F3\u6708\u6BBF\uFF0C\u4E09\u5E74\u62B1\u5B50\u81F3\u671D\u5802\u3002",
  "{xx.xin}": "\u5FC3\u661F\u9020\u4F5C\u5927\u4E3A\u51F6\uFF0C\u66F4\u906D\u5211\u8BBC\u72F1\u56DA\u4E2D\uFF0C\u5FE4\u9006\u5B98\u975E\u5B85\u4EA7\u9000\uFF0C\u57CB\u846C\u5352\u66B4\u6B7B\u76F8\u4ECE\uFF0C\u5A5A\u59FB\u82E5\u662F\u7528\u6B64\u65E5\uFF0C\u5B50\u6B7B\u513F\u4EA1\u6CEA\u6EE1\u80F8\uFF0C\u4E09\u5E74\u4E4B\u5185\u8FDE\u906D\u7978\uFF0C\u4E8B\u4E8B\u6559\u541B\u6CA1\u59CB\u7EC8\u3002",
  "{xx.tail}": "\u5C3E\u661F\u9020\u4F5C\u4E3B\u5929\u6069\uFF0C\u5BCC\u8D35\u8363\u534E\u798F\u7984\u589E\uFF0C\u62DB\u8D22\u8FDB\u5B9D\u5174\u5BB6\u5B85\uFF0C\u548C\u5408\u5A5A\u59FB\u8D35\u5B50\u5B59\uFF0C\u57CB\u846C\u82E5\u80FD\u4F9D\u6B64\u65E5\uFF0C\u7537\u6E05\u5973\u6B63\u5B50\u5B59\u5174\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u7530\u5B85\uFF0C\u4EE3\u4EE3\u516C\u4FAF\u8FDC\u64AD\u540D\u3002",
  "{xx.ji}": "\u7B95\u661F\u9020\u4F5C\u4E3B\u9AD8\u5F3A\uFF0C\u5C81\u5C81\u5E74\u5E74\u5927\u5409\u660C\uFF0C\u57CB\u846C\u4FEE\u575F\u5927\u5409\u5229\uFF0C\u7530\u8695\u725B\u9A6C\u904D\u5C71\u5C97\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u7530\u5B85\uFF0C\u7BA7\u6EE1\u91D1\u94F6\u8C37\u6EE1\u4ED3\uFF0C\u798F\u836B\u9AD8\u5B98\u52A0\u7984\u4F4D\uFF0C\u516D\u4EB2\u4E30\u7984\u4E50\u5B89\u5EB7\u3002",
  "{xx.dou}": "\u6597\u661F\u9020\u4F5C\u4E3B\u62DB\u8D22\uFF0C\u6587\u6B66\u5B98\u5458\u4F4D\u9F0E\u53F0\uFF0C\u7530\u5B85\u5BB6\u8D22\u5343\u4E07\u8FDB\uFF0C\u575F\u5802\u4FEE\u7B51\u8D35\u5BCC\u6765\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u725B\u9A6C\uFF0C\u65FA\u8695\u7537\u5973\u4E3B\u548C\u8C10\uFF0C\u9047\u6B64\u5409\u5BBF\u6765\u7167\u62A4\uFF0C\u65F6\u652F\u798F\u5E86\u6C38\u65E0\u707E\u3002",
  "{xx.niu}": "\u725B\u661F\u9020\u4F5C\u4E3B\u707E\u5371\uFF0C\u4E5D\u6A2A\u4E09\u707E\u4E0D\u53EF\u63A8\uFF0C\u5BB6\u5B85\u4E0D\u5B89\u4EBA\u53E3\u9000\uFF0C\u7530\u8695\u4E0D\u5229\u4E3B\u4EBA\u8870\uFF0C\u5AC1\u5A36\u5A5A\u59FB\u7686\u81EA\u635F\uFF0C\u91D1\u94F6\u8D22\u8C37\u6E10\u65E0\u4E4B\uFF0C\u82E5\u662F\u5F00\u95E8\u5E76\u653E\u6C34\uFF0C\u725B\u732A\u7F8A\u9A6C\u4EA6\u4F24\u60B2\u3002",
  "{xx.nv}": "\u5973\u661F\u9020\u4F5C\u635F\u5A46\u5A18\uFF0C\u5144\u5F1F\u76F8\u5ACC\u4F3C\u864E\u72FC\uFF0C\u57CB\u846C\u751F\u707E\u9022\u9B3C\u602A\uFF0C\u98A0\u90AA\u75BE\u75C5\u4E3B\u761F\u60F6\uFF0C\u4E3A\u4E8B\u906D\u5B98\u8D22\u5931\u6563\uFF0C\u6CFB\u5229\u7559\u8FDE\u4E0D\u53EF\u5F53\uFF0C\u5F00\u95E8\u653E\u6C34\u7528\u6B64\u65E5\uFF0C\u5168\u5BB6\u8D22\u6563\u4E3B\u79BB\u4E61\u3002",
  "{xx.xu}": "\u865A\u661F\u9020\u4F5C\u4E3B\u707E\u6B83\uFF0C\u7537\u5973\u5B64\u7720\u4E0D\u4E00\u53CC\uFF0C\u5185\u4E71\u98CE\u58F0\u65E0\u793C\u8282\uFF0C\u513F\u5B59\u5AB3\u5987\u4F34\u4EBA\u5E8A\uFF0C\u5F00\u95E8\u653E\u6C34\u906D\u707E\u7978\uFF0C\u864E\u54AC\u86C7\u4F24\u53C8\u5352\u4EA1\uFF0C\u4E09\u4E09\u4E94\u4E94\u8FDE\u5E74\u75C5\uFF0C\u5BB6\u7834\u4EBA\u4EA1\u4E0D\u53EF\u5F53\u3002",
  "{xx.wei}": "\u5371\u661F\u4E0D\u53EF\u9020\u9AD8\u697C\uFF0C\u81EA\u906D\u5211\u540A\u89C1\u8840\u5149\uFF0C\u4E09\u5E74\u5B69\u5B50\u906D\u6C34\u5384\uFF0C\u540E\u751F\u51FA\u5916\u6C38\u4E0D\u8FD8\uFF0C\u57CB\u846C\u82E5\u8FD8\u9022\u6B64\u65E5\uFF0C\u5468\u5E74\u767E\u65E5\u53D6\u9AD8\u5802\uFF0C\u4E09\u5E74\u4E24\u8F7D\u4E00\u60B2\u4F24\uFF0C\u5F00\u95E8\u653E\u6C34\u5230\u5B98\u5802\u3002",
  "{xx.shi}": "\u5BA4\u661F\u4FEE\u9020\u8FDB\u7530\u725B\uFF0C\u513F\u5B59\u4EE3\u4EE3\u8FD1\u738B\u4FAF\uFF0C\u5BB6\u8D35\u8363\u534E\u5929\u4E0A\u81F3\uFF0C\u5BFF\u5982\u5F6D\u7956\u516B\u5343\u79CB\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u8D22\u5E1B\uFF0C\u548C\u5408\u5A5A\u59FB\u751F\u8D35\u513F\uFF0C\u57CB\u846C\u82E5\u80FD\u4F9D\u6B64\u65E5\uFF0C\u95E8\u5EAD\u5174\u65FA\u798F\u65E0\u4F11\u3002",
  "{xx.qiang}": "\u58C1\u661F\u9020\u4F5C\u4E3B\u589E\u8D22\uFF0C\u4E1D\u8695\u5927\u719F\u798F\u6ED4\u5929\uFF0C\u5974\u5A62\u81EA\u6765\u4EBA\u53E3\u8FDB\uFF0C\u5F00\u95E8\u653E\u6C34\u51FA\u82F1\u8D24\uFF0C\u57CB\u846C\u62DB\u8D22\u5B98\u54C1\u8FDB\uFF0C\u5BB6\u4E2D\u8BF8\u4E8B\u4E50\u9676\u7136\uFF0C\u5A5A\u59FB\u5409\u5229\u4E3B\u8D35\u5B50\uFF0C\u65E9\u64AD\u540D\u8A89\u8457\u7956\u97AD\u3002",
  "{xx.kui}": "\u594E\u661F\u9020\u4F5C\u5F97\u796F\u7965\uFF0C\u5BB6\u5185\u8363\u548C\u5927\u5409\u660C\uFF0C\u82E5\u662F\u57CB\u846C\u9634\u5352\u6B7B\uFF0C\u5F53\u5E74\u5B9A\u4E3B\u4E24\u4E09\u4F24\uFF0C\u770B\u770B\u519B\u4EE4\u5211\u4F24\u5230\uFF0C\u91CD\u91CD\u5B98\u4E8B\u4E3B\u761F\u60F6\uFF0C\u5F00\u95E8\u653E\u6C34\u906D\u707E\u7978\uFF0C\u4E09\u5E74\u4E24\u6B21\u635F\u513F\u90CE\u3002",
  "{xx.lou}": "\u5A04\u661F\u4FEE\u9020\u8D77\u95E8\u5EAD\uFF0C\u8D22\u65FA\u5BB6\u548C\u4E8B\u4E8B\u5174\uFF0C\u5916\u8FDB\u94B1\u8D22\u767E\u65E5\u8FDB\uFF0C\u4E00\u5BB6\u5144\u5F1F\u64AD\u9AD8\u540D\uFF0C\u5A5A\u59FB\u8FDB\u76CA\u751F\u8D35\u5B50\uFF0C\u7389\u5E1B\u91D1\u94F6\u7BB1\u6EE1\u76C8\uFF0C\u653E\u6C34\u5F00\u95E8\u7686\u5409\u5229\uFF0C\u7537\u8363\u5973\u8D35\u5BFF\u5EB7\u5B81\u3002",
  "{xx.vei}": "\u80C3\u661F\u9020\u4F5C\u4E8B\u5982\u4F55\uFF0C\u5BB6\u8D35\u8363\u534E\u559C\u6C14\u591A\uFF0C\u57CB\u846C\u8D35\u4E34\u5B98\u7984\u4F4D\uFF0C\u592B\u5987\u9F50\u7709\u6C38\u4FDD\u5EB7\uFF0C\u5A5A\u59FB\u9047\u6B64\u5BB6\u5BCC\u8D35\uFF0C\u4E09\u707E\u4E5D\u7978\u4E0D\u9022\u4ED6\uFF0C\u4ECE\u6B64\u95E8\u524D\u591A\u5409\u5E86\uFF0C\u513F\u5B59\u4EE3\u4EE3\u62DC\u91D1\u9636\u3002",
  "{xx.mao}": "\u6634\u661F\u9020\u4F5C\u8FDB\u7530\u725B\uFF0C\u57CB\u846C\u5B98\u707E\u4E0D\u5F97\u4F11\uFF0C\u91CD\u4E27\u4E8C\u65E5\u4E09\u4EBA\u6B7B\uFF0C\u5C3D\u5356\u7530\u56ED\u4E0D\u8BB0\u589E\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u707E\u7978\uFF0C\u4E09\u5C81\u5B69\u513F\u767D\u4E86\u5934\uFF0C\u5A5A\u59FB\u4E0D\u53EF\u9022\u6B64\u65E5\uFF0C\u6B7B\u522B\u751F\u79BB\u662F\u53EF\u6101\u3002",
  "{xx.bi}": "\u6BD5\u661F\u9020\u4F5C\u4E3B\u5149\u524D\uFF0C\u4E70\u5F97\u7530\u56ED\u6709\u4F59\u94B1\uFF0C\u57CB\u846C\u6B64\u65E5\u6DFB\u5B98\u804C\uFF0C\u7530\u8695\u5927\u719F\u6C38\u4E30\u5E74\uFF0C\u5F00\u95E8\u653E\u6C34\u591A\u5409\u5E86\uFF0C\u5408\u5BB6\u4EBA\u53E3\u5F97\u5B89\u7136\uFF0C\u5A5A\u59FB\u82E5\u5F97\u9022\u6B64\u65E5\uFF0C\u751F\u5F97\u5B69\u513F\u798F\u5BFF\u5168\u3002",
  "{xx.zi}": "\u89DC\u661F\u9020\u4F5C\u6709\u5F92\u5211\uFF0C\u4E09\u5E74\u5FC5\u5B9A\u4E3B\u4F36\u4E01\uFF0C\u57CB\u846C\u5352\u6B7B\u591A\u56E0\u6B64\uFF0C\u53D6\u5B9A\u5BC5\u5E74\u4F7F\u6740\u4EBA\uFF0C\u4E09\u4E27\u4E0D\u6B62\u7686\u7531\u6B64\uFF0C\u4E00\u4EBA\u836F\u6BD2\u4E8C\u4EBA\u8EAB\uFF0C\u5BB6\u95E8\u7530\u5730\u7686\u9000\u8D25\uFF0C\u4ED3\u5E93\u91D1\u94F6\u5316\u4F5C\u5C18\u3002",
  "{xx.can}": "\u53C2\u661F\u9020\u4F5C\u65FA\u4EBA\u5BB6\uFF0C\u6587\u661F\u7167\u8000\u5927\u5149\u534E\uFF0C\u53EA\u56E0\u9020\u4F5C\u7530\u8D22\u65FA\uFF0C\u57CB\u846C\u62DB\u75BE\u54ED\u9EC4\u6C99\uFF0C\u5F00\u95E8\u653E\u6C34\u52A0\u5B98\u804C\uFF0C\u623F\u623F\u5B50\u5B59\u89C1\u7530\u52A0\uFF0C\u5A5A\u59FB\u8BB8\u9041\u906D\u5211\u514B\uFF0C\u7537\u5973\u671D\u5F00\u5E55\u843D\u82B1\u3002",
  "{xx.jing}": "\u4E95\u661F\u9020\u4F5C\u65FA\u8695\u7530\uFF0C\u91D1\u699C\u9898\u540D\u7B2C\u4E00\u5149\uFF0C\u57CB\u846C\u987B\u9632\u60CA\u5352\u6B7B\uFF0C\u72C2\u98A0\u98CE\u75BE\u5165\u9EC4\u6CC9\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u8D22\u5E1B\uFF0C\u725B\u9A6C\u732A\u7F8A\u65FA\u83AB\u8A00\uFF0C\u8D35\u4EBA\u7530\u5858\u6765\u5165\u5B85\uFF0C\u513F\u5B59\u5174\u65FA\u6709\u4F59\u94B1\u3002",
  "{xx.gui}": "\u9B3C\u661F\u8D77\u9020\u5352\u4EBA\u4EA1\uFF0C\u5802\u524D\u4E0D\u89C1\u4E3B\u4EBA\u90CE\uFF0C\u57CB\u846C\u6B64\u65E5\u5B98\u7984\u81F3\uFF0C\u513F\u5B59\u4EE3\u4EE3\u8FD1\u541B\u738B\uFF0C\u5F00\u95E8\u653E\u6C34\u987B\u4F24\u6B7B\uFF0C\u5AC1\u5A36\u592B\u59BB\u4E0D\u4E45\u957F\uFF0C\u4FEE\u571F\u7B51\u5899\u4F24\u4EA7\u5973\uFF0C\u624B\u6276\u53CC\u5973\u6CEA\u6C6A\u6C6A\u3002",
  "{xx.liu}": "\u67F3\u661F\u9020\u4F5C\u4E3B\u906D\u5B98\uFF0C\u663C\u591C\u5077\u95ED\u4E0D\u6682\u5B89\uFF0C\u57CB\u846C\u761F\u60F6\u591A\u75BE\u75C5\uFF0C\u7530\u56ED\u9000\u5C3D\u5B88\u51AC\u5BD2\uFF0C\u5F00\u95E8\u653E\u6C34\u906D\u804B\u778E\uFF0C\u8170\u9A7C\u80CC\u66F2\u4F3C\u5F13\u5F2F\uFF0C\u66F4\u6709\u68D2\u5211\u5B9C\u8C28\u614E\uFF0C\u5987\u4EBA\u968F\u5BA2\u8D70\u76D8\u6853\u3002",
  "{xx.xing}": "\u661F\u5BBF\u65E5\u597D\u9020\u65B0\u623F\uFF0C\u8FDB\u804C\u52A0\u5B98\u8FD1\u5E1D\u738B\uFF0C\u4E0D\u53EF\u57CB\u846C\u5E76\u653E\u6C34\uFF0C\u51F6\u661F\u4E34\u4F4D\u5973\u4EBA\u4EA1\uFF0C\u751F\u79BB\u6B7B\u522B\u65E0\u5FC3\u604B\uFF0C\u8981\u81EA\u5F52\u4F11\u522B\u5AC1\u90CE\uFF0C\u5B54\u5B50\u4E5D\u66F2\u6B8A\u96BE\u5EA6\uFF0C\u653E\u6C34\u5F00\u95E8\u5929\u547D\u4F24\u3002",
  "{xx.zhang}": "\u5F20\u661F\u65E5\u597D\u9020\u9F99\u8F69\uFF0C\u5E74\u5E74\u5E76\u89C1\u8FDB\u5E84\u7530\uFF0C\u57CB\u846C\u4E0D\u4E45\u5347\u5B98\u804C\uFF0C\u4EE3\u4EE3\u4E3A\u5B98\u8FD1\u5E1D\u524D\uFF0C\u5F00\u95E8\u653E\u6C34\u62DB\u8D22\u5E1B\uFF0C\u5A5A\u59FB\u548C\u5408\u798F\u7EF5\u7EF5\uFF0C\u7530\u8695\u4EBA\u6EE1\u4ED3\u5E93\u6EE1\uFF0C\u767E\u822C\u987A\u610F\u81EA\u5B89\u7136\u3002",
  "{xx.yi}": "\u7FFC\u661F\u4E0D\u5229\u67B6\u9AD8\u5802\uFF0C\u4E09\u5E74\u4E8C\u8F7D\u89C1\u761F\u60F6\uFF0C\u57CB\u846C\u82E5\u8FD8\u9022\u6B64\u65E5\uFF0C\u5B50\u5B59\u5FC5\u5B9A\u8D70\u4ED6\u4E61\uFF0C\u5A5A\u59FB\u6B64\u65E5\u4E0D\u5B9C\u5229\uFF0C\u5F52\u5BB6\u5B9A\u662F\u4E0D\u76F8\u5F53\uFF0C\u5F00\u95E8\u653E\u6C34\u5BB6\u987B\u7834\uFF0C\u5C11\u5973\u604B\u82B1\u8D2A\u5916\u90CE\u3002",
  "{xx.zhen}": "\u8F78\u661F\u4E34\u6C34\u9020\u9F99\u5BAB\uFF0C\u4EE3\u4EE3\u4E3A\u5B98\u53D7\u7687\u5C01\uFF0C\u5BCC\u8D35\u8363\u534E\u589E\u5BFF\u7984\uFF0C\u5E93\u6EE1\u4ED3\u76C8\u81EA\u660C\u9686\uFF0C\u57CB\u846C\u6587\u660C\u6765\u7167\u52A9\uFF0C\u5B85\u820D\u5B89\u5B81\u4E0D\u89C1\u51F6\uFF0C\u66F4\u6709\u4E3A\u5B98\u6CBE\u5E1D\u5BA0\uFF0C\u5A5A\u59FB\u9F99\u5B50\u5165\u9F99\u5BAB\u3002"
};
LunarUtil.ZHENG = {
  "{xx.jiao}": "{wx.mu}",
  "{xx.jing}": "{wx.mu}",
  "{xx.kui}": "{wx.mu}",
  "{xx.dou}": "{wx.mu}",
  "{xx.kang}": "{wx.jin}",
  "{xx.gui}": "{wx.jin}",
  "{xx.lou}": "{wx.jin}",
  "{xx.niu}": "{wx.jin}",
  "{xx.di}": "{wx.tu}",
  "{xx.liu}": "{wx.tu}",
  "{xx.vei}": "{wx.tu}",
  "{xx.nv}": "{wx.tu}",
  "{xx.fang}": "{wx.ri}",
  "{xx.xing}": "{wx.ri}",
  "{xx.mao}": "{wx.ri}",
  "{xx.xu}": "{wx.ri}",
  "{xx.xin}": "{wx.yue}",
  "{xx.zhang}": "{wx.yue}",
  "{xx.bi}": "{wx.yue}",
  "{xx.wei}": "{wx.yue}",
  "{xx.tail}": "{wx.huo}",
  "{xx.yi}": "{wx.huo}",
  "{xx.zi}": "{wx.huo}",
  "{xx.shi}": "{wx.huo}",
  "{xx.ji}": "{wx.shui}",
  "{xx.zhen}": "{wx.shui}",
  "{xx.can}": "{wx.shui}",
  "{xx.qiang}": "{wx.shui}"
};
LunarUtil.ANIMAL = {
  "{xx.jiao}": "{dw.jiao}",
  "{xx.dou}": "{dw.xie}",
  "{xx.kui}": "{dw.lang}",
  "{xx.jing}": "{dw.han}",
  "{xx.kang}": "{dw.long}",
  "{xx.niu}": "{dw.niu}",
  "{xx.lou}": "{dw.gou}",
  "{xx.gui}": "{dw.yang}",
  "{xx.nv}": "{dw.fu}",
  "{xx.di}": "{dw.he}",
  "{xx.vei}": "{dw.zhi}",
  "{xx.liu}": "{dw.zhang}",
  "{xx.fang}": "{dw.tu}",
  "{xx.xu}": "{dw.shu}",
  "{xx.mao}": "{dw.ji}",
  "{xx.xing}": "{dw.ma}",
  "{xx.xin}": "{dw.huLi}",
  "{xx.wei}": "{dw.yan}",
  "{xx.bi}": "{dw.wu}",
  "{xx.zhang}": "{dw.lu}",
  "{xx.tail}": "{dw.hu}",
  "{xx.shi}": "{dw.zhu}",
  "{xx.zi}": "{dw.hou}",
  "{xx.yi}": "{dw.she}",
  "{xx.ji}": "{dw.bao}",
  "{xx.qiang}": "{dw.xu}",
  "{xx.can}": "{dw.yuan}",
  "{xx.zhen}": "{dw.yin}"
};
LunarUtil.GONG = {
  "{xx.jiao}": "{ps.dong}",
  "{xx.jing}": "{ps.nan}",
  "{xx.kui}": "{ps.xi}",
  "{xx.dou}": "{ps.bei}",
  "{xx.kang}": "{ps.dong}",
  "{xx.gui}": "{ps.nan}",
  "{xx.lou}": "{ps.xi}",
  "{xx.niu}": "{ps.bei}",
  "{xx.di}": "{ps.dong}",
  "{xx.liu}": "{ps.nan}",
  "{xx.vei}": "{ps.xi}",
  "{xx.nv}": "{ps.bei}",
  "{xx.fang}": "{ps.dong}",
  "{xx.xing}": "{ps.nan}",
  "{xx.mao}": "{ps.xi}",
  "{xx.xu}": "{ps.bei}",
  "{xx.xin}": "{ps.dong}",
  "{xx.zhang}": "{ps.nan}",
  "{xx.bi}": "{ps.xi}",
  "{xx.wei}": "{ps.bei}",
  "{xx.tail}": "{ps.dong}",
  "{xx.yi}": "{ps.nan}",
  "{xx.zi}": "{ps.xi}",
  "{xx.shi}": "{ps.bei}",
  "{xx.ji}": "{ps.dong}",
  "{xx.zhen}": "{ps.nan}",
  "{xx.can}": "{ps.xi}",
  "{xx.qiang}": "{ps.bei}"
};
LunarUtil.SHOU = {
  "{ps.dong}": "{sn.qingLong}",
  "{ps.nan}": "{sn.zhuQue}",
  "{ps.xi}": "{sn.baiHu}",
  "{ps.bei}": "{sn.xuanWu}"
};
LunarUtil.FESTIVAL = {
  "1-1": "{jr.chunJie}",
  "1-15": "{jr.yuanXiao}",
  "2-2": "{jr.longTou}",
  "5-5": "{jr.duanWu}",
  "7-7": "{jr.qiXi}",
  "8-15": "{jr.zhongQiu}",
  "9-9": "{jr.chongYang}",
  "12-8": "{jr.laBa}"
};
LunarUtil.OTHER_FESTIVAL = {
  "1-4": ["\u63A5\u795E\u65E5"],
  "1-5": ["\u9694\u5F00\u65E5"],
  "1-7": ["\u4EBA\u65E5"],
  "1-8": ["\u8C37\u65E5", "\u987A\u661F\u8282"],
  "1-9": ["\u5929\u65E5"],
  "1-10": ["\u5730\u65E5"],
  "1-20": ["\u5929\u7A7F\u8282"],
  "1-25": ["\u586B\u4ED3\u8282"],
  "1-30": ["\u6B63\u6708\u6666"],
  "2-1": ["\u4E2D\u548C\u8282"],
  "2-2": ["\u793E\u65E5\u8282"],
  "3-3": ["\u4E0A\u5DF3\u8282"],
  "5-20": ["\u5206\u9F99\u8282"],
  "5-25": ["\u4F1A\u9F99\u8282"],
  "6-6": ["\u5929\u8D36\u8282"],
  "6-24": ["\u89C2\u83B2\u8282"],
  "6-25": ["\u4E94\u8C37\u6BCD\u8282"],
  "7-15": ["\u4E2D\u5143\u8282"],
  "7-22": ["\u8D22\u795E\u8282"],
  "7-29": ["\u5730\u85CF\u8282"],
  "8-1": ["\u5929\u7078\u65E5"],
  "10-1": ["\u5BD2\u8863\u8282"],
  "10-10": ["\u5341\u6210\u8282"],
  "10-15": ["\u4E0B\u5143\u8282"],
  "12-7": ["\u9A71\u50A9\u65E5"],
  "12-16": ["\u5C3E\u7259"],
  "12-24": ["\u796D\u7076\u65E5"]
};
LunarUtil.CHONG = ["{dz.wu}", "{dz.wei}", "{dz.shen}", "{dz.you}", "{dz.xu}", "{dz.hai}", "{dz.zi}", "{dz.chou}", "{dz.yin}", "{dz.mao}", "{dz.chen}", "{dz.si}"];
LunarUtil.CHONG_GAN = ["{tg.wu}", "{tg.ji}", "{tg.geng}", "{tg.xin}", "{tg.ren}", "{tg.gui}", "{tg.jia}", "{tg.yi}", "{tg.bing}", "{tg.ding}"];
LunarUtil.CHONG_GAN_TIE = ["{tg.ji}", "{tg.wu}", "{tg.xin}", "{tg.geng}", "{tg.gui}", "{tg.ren}", "{tg.yi}", "{tg.jia}", "{tg.ding}", "{tg.bing}"];
LunarUtil.CHONG_GAN_4 = ["{tg.geng}", "{tg.xin}", "{tg.ren}", "{tg.gui}", "", "", "{tg.jia}", "{tg.yi}", "{tg.bing}", "{tg.ding}"];
LunarUtil.HE_GAN_5 = ["{tg.ji}", "{tg.geng}", "{tg.xin}", "{tg.ren}", "{tg.gui}", "{tg.jia}", "{tg.yi}", "{tg.bing}", "{tg.ding}", "{tg.wu}"];
LunarUtil.HE_ZHI_6 = ["{dz.chou}", "{dz.zi}", "{dz.hai}", "{dz.xu}", "{dz.you}", "{dz.shen}", "{dz.wei}", "{dz.wu}", "{dz.si}", "{dz.chen}", "{dz.mao}", "{dz.yin}"];
LunarUtil.SHA = {
  "{dz.zi}": "{ps.nan}",
  "{dz.chou}": "{ps.dong}",
  "{dz.yin}": "{ps.bei}",
  "{dz.mao}": "{ps.xi}",
  "{dz.chen}": "{ps.nan}",
  "{dz.si}": "{ps.dong}",
  "{dz.wu}": "{ps.bei}",
  "{dz.wei}": "{ps.xi}",
  "{dz.shen}": "{ps.nan}",
  "{dz.you}": "{ps.dong}",
  "{dz.xu}": "{ps.bei}",
  "{dz.hai}": "{ps.xi}"
};
LunarUtil.POSITION_DESC = {
  "{bg.kan}": "{ps.zhengBei}",
  "{bg.gen}": "{ps.dongBei}",
  "{bg.zhen}": "{ps.zhengDong}",
  "{bg.xun}": "{ps.dongNan}",
  "{bg.li}": "{ps.zhengNan}",
  "{bg.kun}": "{ps.xiNan}",
  "{bg.dui}": "{ps.zhengXi}",
  "{bg.qian}": "{ps.xiBei}",
  "{ps.center}": "{ps.zhong}"
};
LunarUtil.NAYIN = {
  "{jz.jiaZi}": "{ny.haiZhong}{wx.jin}",
  "{jz.jiaWu}": "{ny.shaZhong}{wx.jin}",
  "{jz.bingYin}": "{ny.luZhong}{wx.huo}",
  "{jz.bingShen}": "{ny.shanXia}{wx.huo}",
  "{jz.wuChen}": "{ny.daLin}{wx.mu}",
  "{jz.wuXu}": "{ny.pingDi}{wx.mu}",
  "{jz.gengWu}": "{ny.luPang}{wx.tu}",
  "{jz.gengZi}": "{ny.biShang}{wx.tu}",
  "{jz.renShen}": "{ny.jianFeng}{wx.jin}",
  "{jz.renYin}": "{ny.jinBo}{wx.jin}",
  "{jz.jiaXu}": "{ny.shanTou}{wx.huo}",
  "{jz.jiaChen}": "{ny.fuDeng}{wx.huo}",
  "{jz.bingZi}": "{ny.jianXia}{wx.shui}",
  "{jz.bingWu}": "{ny.tianHe}{wx.shui}",
  "{jz.wuYin}": "{ny.chengTou}{wx.tu}",
  "{jz.wuShen}": "{ny.daYi}{wx.tu}",
  "{jz.gengChen}": "{ny.baiLa}{wx.jin}",
  "{jz.gengXu}": "{ny.chaiChuan}{wx.jin}",
  "{jz.renWu}": "{ny.yangLiu}{wx.mu}",
  "{jz.renZi}": "{ny.sangZhe}{wx.mu}",
  "{jz.jiaShen}": "{ny.quanZhong}{wx.shui}",
  "{jz.jiaYin}": "{ny.daXi}{wx.shui}",
  "{jz.bingXu}": "{ny.wuShang}{wx.tu}",
  "{jz.bingChen}": "{ny.shaZhong}{wx.tu}",
  "{jz.wuZi}": "{ny.piLi}{wx.huo}",
  "{jz.wuWu}": "{ny.tianShang}{wx.huo}",
  "{jz.gengYin}": "{ny.songBo}{wx.mu}",
  "{jz.gengShen}": "{ny.shiLiu}{wx.mu}",
  "{jz.renChen}": "{ny.changLiu}{wx.shui}",
  "{jz.renXu}": "{ny.daHai}{wx.shui}",
  "{jz.yiChou}": "{ny.haiZhong}{wx.jin}",
  "{jz.yiWei}": "{ny.shaZhong}{wx.jin}",
  "{jz.dingMao}": "{ny.luZhong}{wx.huo}",
  "{jz.dingYou}": "{ny.shanXia}{wx.huo}",
  "{jz.jiSi}": "{ny.daLin}{wx.mu}",
  "{jz.jiHai}": "{ny.pingDi}{wx.mu}",
  "{jz.xinWei}": "{ny.luPang}{wx.tu}",
  "{jz.xinChou}": "{ny.biShang}{wx.tu}",
  "{jz.guiYou}": "{ny.jianFeng}{wx.jin}",
  "{jz.guiMao}": "{ny.jinBo}{wx.jin}",
  "{jz.yiHai}": "{ny.shanTou}{wx.huo}",
  "{jz.yiSi}": "{ny.fuDeng}{wx.huo}",
  "{jz.dingChou}": "{ny.jianXia}{wx.shui}",
  "{jz.dingWei}": "{ny.tianHe}{wx.shui}",
  "{jz.jiMao}": "{ny.chengTou}{wx.tu}",
  "{jz.jiYou}": "{ny.daYi}{wx.tu}",
  "{jz.xinSi}": "{ny.baiLa}{wx.jin}",
  "{jz.xinHai}": "{ny.chaiChuan}{wx.jin}",
  "{jz.guiWei}": "{ny.yangLiu}{wx.mu}",
  "{jz.guiChou}": "{ny.sangZhe}{wx.mu}",
  "{jz.yiYou}": "{ny.quanZhong}{wx.shui}",
  "{jz.yiMao}": "{ny.daXi}{wx.shui}",
  "{jz.dingHai}": "{ny.wuShang}{wx.tu}",
  "{jz.dingSi}": "{ny.shaZhong}{wx.tu}",
  "{jz.jiChou}": "{ny.piLi}{wx.huo}",
  "{jz.jiWei}": "{ny.tianShang}{wx.huo}",
  "{jz.xinMao}": "{ny.songBo}{wx.mu}",
  "{jz.xinYou}": "{ny.shiLiu}{wx.mu}",
  "{jz.guiSi}": "{ny.changLiu}{wx.shui}",
  "{jz.guiHai}": "{ny.daHai}{wx.shui}"
};
LunarUtil.WU_XING_GAN = {
  "{tg.jia}": "{wx.mu}",
  "{tg.yi}": "{wx.mu}",
  "{tg.bing}": "{wx.huo}",
  "{tg.ding}": "{wx.huo}",
  "{tg.wu}": "{wx.tu}",
  "{tg.ji}": "{wx.tu}",
  "{tg.geng}": "{wx.jin}",
  "{tg.xin}": "{wx.jin}",
  "{tg.ren}": "{wx.shui}",
  "{tg.gui}": "{wx.shui}"
};
LunarUtil.WU_XING_ZHI = {
  "{dz.yin}": "{wx.mu}",
  "{dz.mao}": "{wx.mu}",
  "{dz.si}": "{wx.huo}",
  "{dz.wu}": "{wx.huo}",
  "{dz.chen}": "{wx.tu}",
  "{dz.chou}": "{wx.tu}",
  "{dz.xu}": "{wx.tu}",
  "{dz.wei}": "{wx.tu}",
  "{dz.shen}": "{wx.jin}",
  "{dz.you}": "{wx.jin}",
  "{dz.hai}": "{wx.shui}",
  "{dz.zi}": "{wx.shui}"
};
LunarUtil.SHI_SHEN = {
  "{tg.jia}{tg.jia}": "{ss.biJian}",
  "{tg.jia}{tg.yi}": "{ss.jieCai}",
  "{tg.jia}{tg.bing}": "{ss.shiShen}",
  "{tg.jia}{tg.ding}": "{ss.shangGuan}",
  "{tg.jia}{tg.wu}": "{ss.pianCai}",
  "{tg.jia}{tg.ji}": "{ss.zhengCai}",
  "{tg.jia}{tg.geng}": "{ss.qiSha}",
  "{tg.jia}{tg.xin}": "{ss.zhengGuan}",
  "{tg.jia}{tg.ren}": "{ss.pianYin}",
  "{tg.jia}{tg.gui}": "{ss.zhengYin}",
  "{tg.yi}{tg.yi}": "{ss.biJian}",
  "{tg.yi}{tg.jia}": "{ss.jieCai}",
  "{tg.yi}{tg.ding}": "{ss.shiShen}",
  "{tg.yi}{tg.bing}": "{ss.shangGuan}",
  "{tg.yi}{tg.ji}": "{ss.pianCai}",
  "{tg.yi}{tg.wu}": "{ss.zhengCai}",
  "{tg.yi}{tg.xin}": "{ss.qiSha}",
  "{tg.yi}{tg.geng}": "{ss.zhengGuan}",
  "{tg.yi}{tg.gui}": "{ss.pianYin}",
  "{tg.yi}{tg.ren}": "{ss.zhengYin}",
  "{tg.bing}{tg.bing}": "{ss.biJian}",
  "{tg.bing}{tg.ding}": "{ss.jieCai}",
  "{tg.bing}{tg.wu}": "{ss.shiShen}",
  "{tg.bing}{tg.ji}": "{ss.shangGuan}",
  "{tg.bing}{tg.geng}": "{ss.pianCai}",
  "{tg.bing}{tg.xin}": "{ss.zhengCai}",
  "{tg.bing}{tg.ren}": "{ss.qiSha}",
  "{tg.bing}{tg.gui}": "{ss.zhengGuan}",
  "{tg.bing}{tg.jia}": "{ss.pianYin}",
  "{tg.bing}{tg.yi}": "{ss.zhengYin}",
  "{tg.ding}{tg.ding}": "{ss.biJian}",
  "{tg.ding}{tg.bing}": "{ss.jieCai}",
  "{tg.ding}{tg.ji}": "{ss.shiShen}",
  "{tg.ding}{tg.wu}": "{ss.shangGuan}",
  "{tg.ding}{tg.xin}": "{ss.pianCai}",
  "{tg.ding}{tg.geng}": "{ss.zhengCai}",
  "{tg.ding}{tg.gui}": "{ss.qiSha}",
  "{tg.ding}{tg.ren}": "{ss.zhengGuan}",
  "{tg.ding}{tg.yi}": "{ss.pianYin}",
  "{tg.ding}{tg.jia}": "{ss.zhengYin}",
  "{tg.wu}{tg.wu}": "{ss.biJian}",
  "{tg.wu}{tg.ji}": "{ss.jieCai}",
  "{tg.wu}{tg.geng}": "{ss.shiShen}",
  "{tg.wu}{tg.xin}": "{ss.shangGuan}",
  "{tg.wu}{tg.ren}": "{ss.pianCai}",
  "{tg.wu}{tg.gui}": "{ss.zhengCai}",
  "{tg.wu}{tg.jia}": "{ss.qiSha}",
  "{tg.wu}{tg.yi}": "{ss.zhengGuan}",
  "{tg.wu}{tg.bing}": "{ss.pianYin}",
  "{tg.wu}{tg.ding}": "{ss.zhengYin}",
  "{tg.ji}{tg.ji}": "{ss.biJian}",
  "{tg.ji}{tg.wu}": "{ss.jieCai}",
  "{tg.ji}{tg.xin}": "{ss.shiShen}",
  "{tg.ji}{tg.geng}": "{ss.shangGuan}",
  "{tg.ji}{tg.gui}": "{ss.pianCai}",
  "{tg.ji}{tg.ren}": "{ss.zhengCai}",
  "{tg.ji}{tg.yi}": "{ss.qiSha}",
  "{tg.ji}{tg.jia}": "{ss.zhengGuan}",
  "{tg.ji}{tg.ding}": "{ss.pianYin}",
  "{tg.ji}{tg.bing}": "{ss.zhengYin}",
  "{tg.geng}{tg.geng}": "{ss.biJian}",
  "{tg.geng}{tg.xin}": "{ss.jieCai}",
  "{tg.geng}{tg.ren}": "{ss.shiShen}",
  "{tg.geng}{tg.gui}": "{ss.shangGuan}",
  "{tg.geng}{tg.jia}": "{ss.pianCai}",
  "{tg.geng}{tg.yi}": "{ss.zhengCai}",
  "{tg.geng}{tg.bing}": "{ss.qiSha}",
  "{tg.geng}{tg.ding}": "{ss.zhengGuan}",
  "{tg.geng}{tg.wu}": "{ss.pianYin}",
  "{tg.geng}{tg.ji}": "{ss.zhengYin}",
  "{tg.xin}{tg.xin}": "{ss.biJian}",
  "{tg.xin}{tg.geng}": "{ss.jieCai}",
  "{tg.xin}{tg.gui}": "{ss.shiShen}",
  "{tg.xin}{tg.ren}": "{ss.shangGuan}",
  "{tg.xin}{tg.yi}": "{ss.pianCai}",
  "{tg.xin}{tg.jia}": "{ss.zhengCai}",
  "{tg.xin}{tg.ding}": "{ss.qiSha}",
  "{tg.xin}{tg.bing}": "{ss.zhengGuan}",
  "{tg.xin}{tg.ji}": "{ss.pianYin}",
  "{tg.xin}{tg.wu}": "{ss.zhengYin}",
  "{tg.ren}{tg.ren}": "{ss.biJian}",
  "{tg.ren}{tg.gui}": "{ss.jieCai}",
  "{tg.ren}{tg.jia}": "{ss.shiShen}",
  "{tg.ren}{tg.yi}": "{ss.shangGuan}",
  "{tg.ren}{tg.bing}": "{ss.pianCai}",
  "{tg.ren}{tg.ding}": "{ss.zhengCai}",
  "{tg.ren}{tg.wu}": "{ss.qiSha}",
  "{tg.ren}{tg.ji}": "{ss.zhengGuan}",
  "{tg.ren}{tg.geng}": "{ss.pianYin}",
  "{tg.ren}{tg.xin}": "{ss.zhengYin}",
  "{tg.gui}{tg.gui}": "{ss.biJian}",
  "{tg.gui}{tg.ren}": "{ss.jieCai}",
  "{tg.gui}{tg.yi}": "{ss.shiShen}",
  "{tg.gui}{tg.jia}": "{ss.shangGuan}",
  "{tg.gui}{tg.ding}": "{ss.pianCai}",
  "{tg.gui}{tg.bing}": "{ss.zhengCai}",
  "{tg.gui}{tg.ji}": "{ss.qiSha}",
  "{tg.gui}{tg.wu}": "{ss.zhengGuan}",
  "{tg.gui}{tg.xin}": "{ss.pianYin}",
  "{tg.gui}{tg.geng}": "{ss.zhengYin}"
};
LunarUtil.ZHI_HIDE_GAN = {
  "{dz.zi}": ["{tg.gui}"],
  "{dz.chou}": ["{tg.ji}", "{tg.gui}", "{tg.xin}"],
  "{dz.yin}": ["{tg.jia}", "{tg.bing}", "{tg.wu}"],
  "{dz.mao}": ["{tg.yi}"],
  "{dz.chen}": ["{tg.wu}", "{tg.yi}", "{tg.gui}"],
  "{dz.si}": ["{tg.bing}", "{tg.geng}", "{tg.wu}"],
  "{dz.wu}": ["{tg.ding}", "{tg.ji}"],
  "{dz.wei}": ["{tg.ji}", "{tg.ding}", "{tg.yi}"],
  "{dz.shen}": ["{tg.geng}", "{tg.ren}", "{tg.wu}"],
  "{dz.you}": ["{tg.xin}"],
  "{dz.xu}": ["{tg.wu}", "{tg.xin}", "{tg.ding}"],
  "{dz.hai}": ["{tg.ren}", "{tg.jia}"]
};
LunarUtil.YI_JI = [
  "{yj.jiSi}",
  "{yj.qiFu}",
  "{yj.qiuSi}",
  "{yj.kaiGuang}",
  "{yj.suHui}",
  "{yj.qiJiao}",
  "{yj.zhaiJiao}",
  "{yj.muYu}",
  "{yj.chouShen}",
  "{yj.zaoMiao}",
  "{yj.siZhao}",
  "{yj.fenXiang}",
  "{yj.xieTu}",
  "{yj.chuHuo}",
  "{yj.diaoKe}",
  "{yj.jiaQu}",
  "{yj.DingHun}",
  "{yj.naCai}",
  "{yj.wenMing}",
  "{yj.naXu}",
  "{yj.guiNing}",
  "{yj.anChuang}",
  "{yj.heZhang}",
  "{yj.guanJi}",
  "{yj.dingMeng}",
  "{yj.jinRenKou}",
  "{yj.caiYi}",
  "{yj.wanMian}",
  "{yj.kaiRong}",
  "{yj.xiuFen}",
  "{yj.qiZuan}",
  "{yj.poTu}",
  "{yj.anZang}",
  "{yj.liBei}",
  "{yj.chengFu}",
  "{yj.chuFu}",
  "{yj.kaiShengFen}",
  "{yj.heShouMu}",
  "{yj.ruLian}",
  "{yj.yiJiu}",
  "{yj.puDu}",
  "{yj.ruZhai}",
  "{yj.anXiang}",
  "{yj.anMen}",
  "{yj.xiuZao}",
  "{yj.qiJi}",
  "{yj.dongTu}",
  "{yj.shangLiang}",
  "{yj.shuZhu}",
  "{yj.kaiJing}",
  "{yj.zuoBei}",
  "{yj.chaiXie}",
  "{yj.poWu}",
  "{yj.huaiYuan}",
  "{yj.buYuan}",
  "{yj.faMuZuoLiang}",
  "{yj.zuoZhao}",
  "{yj.jieChu}",
  "{yj.kaiZhuYan}",
  "{yj.chuanPing}",
  "{yj.gaiWuHeJi}",
  "{yj.kaiCe}",
  "{yj.zaoCang}",
  "{yj.saiXue}",
  "{yj.pingZhi}",
  "{yj.zaoQiao}",
  "{yj.zuoCe}",
  "{yj.zhuDi}",
  "{yj.kaiChi}",
  "{yj.faMu}",
  "{yj.kaiQu}",
  "{yj.jueJing}",
  "{yj.saoShe}",
  "{yj.fangShui}",
  "{yj.zaoWu}",
  "{yj.heJi}",
  "{yj.zaoChuChou}",
  "{yj.xiuMen}",
  "{yj.dingSang}",
  "{yj.zuoLiang}",
  "{yj.xiuShi}",
  "{yj.jiaMa}",
  "{yj.kaiShi}",
  "{yj.guaBian}",
  "{yj.naChai}",
  "{yj.qiuCai}",
  "{yj.kaiCang}",
  "{yj.maiChe}",
  "{yj.zhiChan}",
  "{yj.guYong}",
  "{yj.chuHuoCai}",
  "{yj.anJiXie}",
  "{yj.zaoCheQi}",
  "{yj.jingLuo}",
  "{yj.yunNiang}",
  "{yj.zuoRan}",
  "{yj.guZhu}",
  "{yj.zaoChuan}",
  "{yj.geMi}",
  "{yj.zaiZhong}",
  "{yj.quYu}",
  "{yj.jieWang}",
  "{yj.muYang}",
  "{yj.anDuiWei}",
  "{yj.xiYi}",
  "{yj.ruXue}",
  "{yj.liFa}",
  "{yj.tanBing}",
  "{yj.jianGui}",
  "{yj.chengChuan}",
  "{yj.duShui}",
  "{yj.zhenJiu}",
  "{yj.chuXing}",
  "{yj.yiXi}",
  "{yj.fenJu}",
  "{yj.TiTou}",
  "{yj.zhengShou}",
  "{yj.naChu}",
  "{yj.buZhuo}",
  "{yj.tianLie}",
  "{yj.jiaoNiuMa}",
  "{yj.huiQinYou}",
  "{yj.fuRen}",
  "{yj.qiuYi}",
  "{yj.zhiBing}",
  "{yj.ciSong}",
  "{yj.qiJiDongTu}",
  "{yj.poWuHuaiYuan}",
  "{yj.gaiWu}",
  "{yj.zaoCangKu}",
  "{yj.liQuanJiaoYi}",
  "{yj.jiaoYi}",
  "{yj.liQuan}",
  "{yj.anJi}",
  "{yj.huiYou}",
  "{yj.qiuYiLiaoBing}",
  "{yj.zhuShi}",
  "{yj.yuShi}",
  "{yj.xingSang}",
  "{yj.duanYi}",
  "{yj.guiXiu}",
  "{s.none}"
];
LunarUtil.DAY_YI_JI = "30=192531010D:838454151A4C200C1E23221D212726,030F522E1F00=2430000C18:8319000776262322200C1E1D,06292C2E1F04=32020E1A26:7917155B0001025D,0F522E38201D=162E3A0A22:790F181113332C2E2D302F1554,7001203810=0E1A263202:79026A17657603,522E201F05=0D19250131:7911192C2E302F00030401060F1571292A75,707C20522F=0C18243000:4F2C2E2B383F443D433663,0F01478A20151D=0E1A320226:3840,0001202B892F=14202C3808:3807504089,8829=0E1A263202:383940,6370018A75202B454F6605=32020E1A26:38394089,0001202B22=16223A0A2E:384C,8A2020=2B3707131F:2C2E5B000739337C38802D44484C2425201F1E272621,5229701535=121E2A3606:2C2E2D2B156343364C,0F4729710D708A20036A1904=0D19250131:5040262789,0F7129033B=202C380814:5040000738,0F7D7C584F012063452B35=1A2632020E:50400089,8813=1A2632020E:69687011180F791966762627201E,0352292E8034=182430000C:291503000D332E53261F2075,0F5238584F450B=000C182430:297170192C2E2D2F2B3E363F4C,0F521563200103470B=131F2B3707:297115030102195283840D332C2E,0F1F5863201D8A02=222E3A0A16:261F1E20232289,52290058363F32=16222E3A0A:261F201E232289,8D39=0D19310125:262322271E201D21,52450F4F09=0D19253101:262322271E202189,1F4526=16222E3A0A:262322271F1E20,712906=0F1B273303:17262322274050,80387C6B2C=0915212D39:1707702C2E71291F20,0F52000106111D15=16222E3A0A:170007386A7448363F261F1E,030F79636F2026=030F1B2733:1784832C2E5B26201F,0F010D2913=182430000C:175447440D15838477656A49,2B2E1F8A202228=101C283404:70504C7889,8803=0D19250131:700F181126151E20001A7919,8D2F=0915212D39:705283845B0D2F71,0F202E4106=3606121E2A:70786289,06802E1F23=1824000C30:70076A363F,292017=202C380814:700718111A302F717566,0F2B2E2026=3B0B17232F:70545283842E71291A7933192A5D5A5040,090C384F45208A1D6B38=212D390915:7039170F45513A2C2E7129242526271F201D,00010352153A=15212D3909:703911170E2C2E2D2F4B15712952633D,092B8A2027=010D192531:702D155483840F63262720,53292F017D4F38442B2E1F4717=16222E3A0A:705C4C39171A4F0E7971295B5248,0F2E1F1D37=1A2632020E:2E260F27201F,523815292F1A22=0E1A260232:64262322271F2021,0F2F293822=2F3B0B1723:161A0F1526271F4C,586103473818=2430000C18:161A7889,292E1F0F386131=17232F3B0B:04795B3F651A5D,0F5201062016=14202C3808:04170F79195D1A637566363F76,01522E8A2039=132B37071F:0470170F191A134C8384662426232227201E,8D08=0D19253101:040370181123220F1326271E2021,29153B=0D19310125:040307177938494C,0F26207017=0E2632021A:0403010218111A17332C2E2D2B15713E6575,45382064291D=142C380820:04033918110F0D2C2E7129332D2B72528384547566,8D1C=1830000C24:040318111A17332C15290D200C7A,4745063835=0F2733031B:040318111A16175B795452848315302F6563395D,387029202E=14202C3808:04031975363F6366,0F5401202C5283842E2F1E=0E1A320226:0403080618111A16332E2F152A09537919702C5445490D75072B,8063203820=182430000C:04067033392C7161262322271E1D210C,8D2F=101C283404:3F4889,881C=2733030F1B:3F74397677658988,0F3847201D=293505111D:3F8B657789,0F2029702E7D35=111D293505:3F8B6589,1F200A=020E1A2632:3F656477,0F2B71292005=111D290535:3F6589,8810=0F1B273303:3F88,2B38200F1C=293505111D:0F83843D363F776424,15462F2C520329712A=0F1B273303:0F17795B54838458,52807C3811=121E2A3606:0F172C2E387129363F7566512D4E4461,01034752203A=172F3B0B23:0F171511793F76584C,0347200C1D20=2D39091521:0F175B3975660745514F2B4825201E211D,010352292E2E=0F1B273303:0F170070792C2E261F,040341232228=05111D2935:0F1700707129385C363F3D1F1E232226,80412B202F14=14202C3808:0F17000728705448757A,522E1F15562F05=30000C1824:0F17000102061979454F3A15477677,241F8A2021=2F3B0B1723:0F17000102060370392E52838453331F,452F2C266A79292B203810=0C18243000:0F170001020E032A70692C2E302F802D2B0D7129474C201F2322,5211183809615D34=1A2632020E:0F171170792F5B1566770001032C2B802D,29387C207134=14202C3808:0F0D33000103452E528384297115752620,63386F7014=15212D3909:0F7045332C2E71201F1D21,4701155229530327=101C283404:0F70161715232238838426271F20,7D035219=121E2A3606:0F705B0004037C5D15653F1F26,522B473809=131F2B0737:0F705215261E20,012E1F25=182430000C:0F707B7C00012F75,52201B=2531010D19:0F706A151E201D528384544466,47010C2E292F2C3820=14202C3808:0F707500261E20,382E1F05=3606121E2A:0F161A17452F0D33712C2E2B5443633F,150170208A0327=0E1A263202:0F150370002E0D3979528384532971331F1E20,477D0D=06121E2A36:0F5B8370000102060403161A494447,386A418A201A=17232F3B0B:0F03700D332C2E2971152F52838463,01004547380C26=101C283404:0F03700D33195284835329711563,01260038206B0E=131F2B3707:0F03706A4F0D332C528384532E29711563,4500750F=131F2B3707:0F0370010239332E2C19528384532971156375262720,8D18=17232F3B0B:0F0370390D332C192E2971637547202322,581528=0E1A263202:0F0302791566046F,29710D722A38528384202E4530=0E1A263202:0F030102392E15634447001F1E,293845200D707538=1E2A360612:0F0300017039712952542D2C302F80380D2A363F3349483E616320,1118150C1F2E20=33030F1B27:0F03000102700D29713963451F0C20,528338542F15806128=121E2A3606:0F030001027039452971150D332C2F6327,2052838403=2C38081420:0F030001022A0D3945297115528384637020,476A382E1F4426=010D192531:0F03390D332C1929711563261D2E2322,382000521118750C706B15=131F2B3707:0F033915666A52261E272048,382E2F6329712C0114=0D19253101:0F52838403700D332C29712E1F27201E2322,1545017505=131F2B3707:0F528400012E7129,092026=3707131F2B:0F528471295B795D2B155333565A446375661F201E272621,00016B0C4113=14202C3808:0F280001363F8B4326232220,2E1F47032F7D35=16222E3A0A:0F0211195465756679,2F384570202B6A10=15212D3909:0F0102700D332C2E2F0319528384531529716345261F2322,8D32=101C283404:0F0102037039330D5284832971152E1F0C,0026206B37=16222E3A0A:0F003854,20521D2106=020E1A2632:0F00175058,5D6B80382E16=1B2733030F:0F00701784831952712C2E1526271F,033806201F=2B3707131F:0F00701A17830E544C5C78,7129632E1F38208A452F16=15212D3909:0F00040370396A742E15444948,458A384F2021=16222E3A0A:0F005B261F20,2E2F1D=2531010D19:0F0003450D3329712C2E2F1575,528A63705A20587D7C12=17232F3B0B:0F00030D70332C2E3952838453542971156375,6B2019=1B2733030F:0F000301020D297115332E1F0C,165220262E=121E2A3606:0F00030102700D332E2C192971155383846375261F1E20,8D1F=33030F1B27:0F00030102700D19297115332C2B535448,2E45208A00=2632020E1A:0F00030102705283842E544779,2920454F754C3836=16222E3A0A:0F0052037029710D332C15,7545584F8A201D2121=121E2A3606:0F00074850,8A2036=0D25310119:0F00071A706A717677492923221E202726,80522E1F39=1E2A360612:0F006A385040740717,1F70631E=212D390915:0F006A1938271779,565A4575522F801F1E632B=121E2A3606:0F00010D0302703352838453297115632E,208A454F2B=0E1A263202:0F000170390D332E2971152F63751F1E20,52846A381F=14202C3808:0F000106387129,2E1F24=14202C3808:0F0001062E7129,522010=0814202C38:0F0001062871292E7C528384032C5C2A15767765,11185D8A206B08=131F2B0737:0F0001067C1F20,522900=202C380814:0F0001020D700339332C192A83842971152E1F0C20262322,065256386110=111D293505:0F000102700D332C2E297115383F631F20,0347562B=14202C3808:0F000102700D332C712E15261F201E,80036A61473831=0C18243000:0F000102700D335283845329711563,38048A7D45202A=14202C3808:0F000102702E15471F1E,294F2B452C2F268011=0D19253101:0F0001022E792D3E75663D19,472063703852292B39=222E3A0A16:0F0001022E154826271F1E203874362322,036312=0D19253101:0F000102032971152C2E19,4720637038522B15=111D293505:0F000102030D70332E3919528384532971152B2F201F0C,8D1B=232F3B0B17:0F000102030D7033528384534529711520,63475814=131F2B3707:0F000102030D332C2E195283845329716375261E2322,8D19=15212D3909:0F00010203700D332C2E1929711552838453637526202322,8D09=111D293505:0F00010203700D332E2F192971152B52838453631F20,8D33=1A2632020E:0F00010203700D332E2F1929711552838453261F201E2322,8D03=2E3A0A1622:0F0001020370332C2E2F1575261F,2971476A458352380C=111D293505:0F0001020370332E2F0D19297115637566302B2C3979,8D08=000C182430:0F000102037039297175261F1D21,454F2E1563410F=17232F3B0B:0F0001020370390D3319297115632E2C752620212322,8D07=3606121E2A:0F0001020370390D332C1929712E157563548384534C,20248A38=16222E3A0A:0F0001020370390D1952838453542971631F0C,152036=14202C3808:0F00010203703915632719792322,80262045297158750F=111D293505:0F00010203528384157033,752971206B452F2B262E05=3404101C28:0F00010206030D7129302F79802D7C2B5C4744,11701D2052843833=111D293505:0F00010206181139702E1F686F6A792D2C304E153375664923221D21,52296B0D800D=15212D3909:0F000102070D70332C2E19528384297115637526201E2322,8D05=2C38081420:0F0001021A175D2C19152E302F7183846379,8A20704F7545410A=131F2B3707:0F001A651707,565A58202E1F476320=121E36062A:0F11707B7C5271291E20,2E1F39=111D293505:0F11700001522E71291F20,2B07=131F2B0737:0F11700001397129,2E2002=111D293505:0F11707129,2E1F2002=131F37072B:0F1152702E2F71291F20,000103=131F37072B:0F1152702E2F71291F20,7A3A=111D293505:0F117B7C2C2E71291F20,520300=111D350529:0F110001702E2F71291F20,0621=101C280434:0F11000170717B,522E1F0A=06121E2A36:0F110001708471292E1F20,03388051561C=121E2A3606:0F1100017B7C702E7129,522B22=2D39091521:0F110039702C2E522F1574487B7C2D4E804B,098A204538612B=05111D2935:0F1118795B65170002195D,52382E8A201E=2531010D19:0F111829711500010370390D332E750C201F,4552832F382B8004=2A3606121E:0F1118175C000301027039450D29332C2E2F15631F,8A582020=31010D1925:0F1118032A0D545283841A802D2C2E2B71296366774744201F26232221,010900150C06=2C38081420:0F11180300706A2E1549466319,292F26806B382B20754506=2E3A0A1622:0F1118528384530001035C702971152B332C2E63201F1E23222621,6B75452D4F802E=111D293505:0F1118060300017B7C792E39767566261F20,7129805136=232F3B0B17:0F111800171A454F514E3A3871157765443D23221E262720,80612E1F1C=212D390915:0F11180003706A4F0D332C2E192971155363751F20262322,524746416128=3B0B17232F:0F111800037039450D2971332C632026,1F2E2B38528327=3B0B17232F:0F11180006032A0D70332E011954838471152C202322,58477D630C=0814202C38:0F1118000106287129705B032C2E302F802D4E2B201F,528458384108=380814202C:0F11180001027039302971542F7526201E,63472E151F583A=1E2A360612:0F1118000102030D70332C2E192971158384535426201E2322,471F1B=1F2B370713:0F1118000102030D70332C2E195283845329711563261F0C20,4745752522=3505111D29:0F1118000102030D70332E2C192971153953631F0C262720,5284612528=390915212D:0F111800010203700D332C2E192971152F4B49471F270C2322,52562B2029=390915212D:0F111800010203391929710D1552838453,2075708A456309410F=0A16222E3A:0F111800010206032A0D097170292D302F1575761320,521F47251D=1F2B370713:0F18000102111A1703154F2C2E382D2F807566,7163708A1F207D2A=05111D2935:0F111800017C5C2C2E7129,527015382021=2B3707131F:0F11185C0370332D152322528384636626271E,2F292C2E1F00010601=2430000C18:0F11185C0001092A0D7014692983847B7C2C2E302F802D2B,06454F208A2E=0D19253101:0F11181200171A7919547638,5215201D09=3A0A16222E:0F1A1716007015713F261F2720,5263587D2B470304=111D293505:0F1A0070153871291F20,7A7629=010D192531:0F181179005B712980152D4E2A0D533358,5270208A11=0814202C38:0F181138171A7975665B52845415,47701F8A2013=121E2A3606:0F181117795B5C007054292A0D690403332D2C2E66632B3D,8A454F3822=121E2A3606:0F1811705200012E71291F20,382A=16222E0A3A:0F1811705200012E71291F20,062B27=14202C0838:0F18117052000171291E20,2E1F27=16222E0A3A:0F18117000012E71291F20,527A06=111D290535:0F1811700001062E2F1F20,712912=14202C3808:0F181100062839707952542C2E302F03565A7566441F1E,0D29802B2029=1824300C00:0F181100012C2E7129,522025=121E2A0636:0F18110001261F20,03522E=0915212D39:0F18110001702C2E7129,6F454F098A2025=030F1B2733:0F18110001702C2E71291F0D2B152F2127,5283162014=16222E3A0A:0F18110001707B7C0D7129,52565A152B2034=17232F3B0B:0F1811000104037115454F7677657B7C392023222726210C,52092E1F27=3707131F2B:0F181100010603797B7C802D302F2B6743441F202322,2952477D2528=14202C0838:0F181100017B7C2E71291F20,036F33=0D19253101:0F18110001027939706954528384685D15565A75201E1D26,29032E11=182430000C:0F1811000102062A0D2C2D804B2B672E2F7129,70471F8A2030=17232F3B0B:0F5C707971292C2E0E032A0D6A804B2D8C2B3348634C,52110915462031=15212D3909:0F5C5B0001032A0D7052842C2E71291F20,1118517D462B=0F1B273303:0F5C111800015B712952841F20,756A251A=2733030F1B:1545332C2E2F84836375662620,0F0003700D71292B1C=0E1A320226:1516291211020056,06382007=000C182430:1551000403706A454F3A3D771F262322271E1D21,382B41522016=17232F3B0B:1500443626271F1E,29710F47380D19520337=182430000C:150001021745512E443D65262322,2B63387C18=192531010D:151A83842627202322,580F7003632E1F297C26=0E1A263202:15391A302F83845475662627201E,0F702E4629004708=3606121E2A:5B000102073911522C302F3A678C363F33490D482425200C1E2322,0F15382E1F6116=1E2A360612:5B71297000010611182A0D39792C2E332D4E80151F202621,52454F3804=2C38081420:5B11180001020328700D332C2E195283847115632F751F2720,290F476630=0C18243000:201E27262322,8902=3404101C28:2A0D11180F52848353037039156358332C2E,3820002628=010D192531:4089,030F565A61206B27=1824300C00:4089,8836=1C28340410:0370833F0F6A5215,010D582E1F202C2F2938=112935051D:03700F,79192C2E2D715275262322271F201D2136=112935051D:0370110F45510D3371290941614C522623222720,8D3B=152D390921:03047039171A533852443D363F,8D11=0F1B273303:030402111A16175B4F3A2B153E0079015D54528483696A51,7006200F05=0F1B270333:03041A174533302F56795B3E808339528454,700F292026=121E2A3606:037B7C2E2F261F20,0F14=1E2A360612:030270170F45513A2C71295283842A0D532D24252623222720,155A382E1F2F=1B2733030F:03027011170D332D2C2E2F716152838454,010F201F2C=121E2A3606:03027039450D332C2F2D2971528384636626202322,581535=212D390915:03020E0F18110D332C2E2D2F4971293E615244756653,8A202531=1B2733030F:030102703945802D2C512B7129092322270C7566,112E528325=2D39091521:030102062C2E543E3D636679,380D19462971001F=293505111D:03111A171538193E3F,0F632C2E70454F200C19=17232F3B0B:031A2B7915656A,0F177001204529710D632E2F02=32020E1A26:033945302F838475262720,297071000F2E1F3810=17232F3B0B:0339332C2E1575201E26,0F520D631F29712A72473826=390915212D:0339332C2E302B66201D1F27,0D2971010015520F6B0E=15212D3909:03392D2E332F211D201F1E27,0F7015380029710D195824=16223A0A2E:036F791E20,522E1F31=1D29350511:5283845B79037B7C802D2C2E4E302F2B38493D4463664C1F2021,0F0D712917=15212D3909:5283845303702971150D2F,388A6A6D0F2012=111D293505:528384530370331929272E2B2F631F1D20,0F156B380E=0D19253101:528384530339454F0D297115332E2F637520,0F00705802=2A3606121E:528384530339332E152C2F58631F20,380D000F2900=283404101C:528384530003010215392C20,1112180F29560D2E1F754511=15212D3909:5283845300031929150D332C2E63,0F217045208A717521=3505111D29:5283845300010670802D2C2E4E155B201F1E232221,380F71296A0E=17232F3B0B:5283845354037029711575262720,631F58000F2E38010D=111D293505:528384000103451915332C2E631F2720,29716A0D0F7019=1D29350511:5283840001032E1570637566302F391F,0F4729712030=16222E3A0A:5283845479036A2627201E,0F380D70297115012F1A=1F2B370713:528384542E03700F111869565A7566631F1E2021,297138000C31=121E2A3606:52838454443D65002C2E15495D1F,0F417D712B38630F=0D19253101:5283845444360F11756415,2C2F29016B472E2B20381D=212D390915:528384545363000103332E15,0F1F197029710D757D2032=121E2A3606:528384546315332C2E2F26201F2322,0F0D45002971756B17=192531010D:52838454754C2971150301022E,0F63206A0938268A4117=1B2733030F:52848353000103297115332E2F19,0F8A514F6A6620754526=1824300C00:528403395B2F1E20,0F012D=0B17232F3B:5254700001020612692D4E584647336375662E1F1E,71290D262037=131F2B3707:525400045B17791A565D754C7866,2E1F207C34=0F2733031B:483F89,8838=232F3B0B17:767779392623222789,152B1F1D200E=0A16222E3A:767789,528300292025=14202C3808:7665261F20,0F291A=222E3A0A16:7665262322271F201E21,0F0029807124=1824000C30:7889,292E1F24=101C283404:8D,8832=1D29350511:63767789,522E0006206B31=131F2B3707:7B7C343589,0F7038=2632020E1A:7B7C343589,520F20=0E1A260232:7B34,8812=1C28340410:02703918110F7919155283756626232227201E,012C2E1F0C29=121E2A3606:020F11161A17454F2C2E2D302F2B38434C,2070016328=1824300C00:02060418110D332C2E415B637566262322271F20,520F23=142038082C:07504089,0F010C=15212D3909:07262723221F40,0F7129523B=2430000C18:0717363F1A2C4F3A67433D8B,71290F0103471A=2531010D19:0704031118528384542D2E4E49201F1E1D2127,292B000C3B=283404101C:073F7765644889,012014=111D293505:074048261F202322,0F71454F1500018008=111D293505:07404826271F1E2089,882C=0D19253101:07565A5283845463756677261F20,010F15296120=2F3B0B1723:07487677393F89,0F2952151F1D30=111D293505:074889,06520F3808=17232F3B0B:074889,883B=131F2B3707:074889,8832=15212D3909:07762623221F1E20,000F1552296B2F2A=0D19253101:0776776A742623221F200C211D1E,11180F2F5206802B0B=04101C2834:0776776564,000F29382011=101C283404:0706397B7C794C636A48,520F7129472026=14202C3808:077C343589,880A=380814202C:076A79040363660F5D363F,52292E1F20382F15560123=16223A0A2E:076A696819,0F2918=222E3A0A16:076A171552847983546578,712970010F2D=182430000C:076A48,45752F29384C0F204F612B30=131F2B3707:076A7626271F1E20,0D0F29382F2E0E=0814202C38:07343589,065238=1C28340410:070039201F0C2789,06030F292F23=101C280434:076564,0F292002=0D19253101:073918111A17332C2E71292322271F1E20481D45548384,38002F702A=1824300C00:7C343589,8801=172F3B0B23:6A79363F65,0F292B7118=1B2733030F:6A170F19,5845754C201F4F382430=1B2733030F:6A170F1963766F,5452201F32=0C18243000:6A0339332C20528384531563,29713801000F0C47806B3B=2A3606121E:77766564000789,0F52201E8A01=202C380814:1F2027260076232289,0F29528339=0F1B330327:3435,8809=0F1B273303:34357B7C,8818=121E2A3606:34357B7C7789,0F291D=232F3B0B17:34357B7C89,0F2021=33030F1B27:34357B7C89,030F27=390915212D:34357B7C89,712917=1D29350511:3435073989,8802=2C38081420:34357C89,0111180F292006=30000C1824:34357C89,71291A=14202C3808:34357C89,8A2036=182430000C:3435000789,8835=232F3B0B17:34350089,0F2025=3707131F2B:34353989,0F2037=0D25310119:343589,0F52202D=0F1B273303:343589,0F7152290D=131F2B3707:343589,8830=121E2A3606:343589,881C=16222E3A0A:343589,8819=131F2B3707:343589,880F=15212D3909:343589,8832=14202C3808:343589,8813=0D19253101:343589,8811=17232F3B0B:343589,881E=142C380820:017018110F1A2E15495247838463462322271F,8D03=0F1B270333:0103040818111A155284262322271E20217A79708330,38472E631B=14202C3808:010670170F0E3A294152838454262322271F201E,2E1815442C=0F1B273303:01067071292C2E1F20,1103150F520A=17232F0B3B:010670181126271F202165,293816=182430000C:0106111839513A2C2E2D2F8C804B4723221F63,7152292037=0F2733031B:010203040618110F3315292A271D200C6339171A712C2E30491E21,7A21=0E1A260232:010206040318110F2E292A27200C70072C302F541F392B49,381512=1A2632020E:010206110F452C2E7129095B5226232227201F0C,58804B036B2B381C=142C380820:01023918112E2D493E52756624262322271F20,8D12=121E2A3606:008354,06462F2E1F27=030F1B2733:00797084831754,0F2E472D4E1F06=0D19250131:0079701811072C2E01060F33152627200C7A1A302F4576631F2B,8052382900=172F3B0B23:00790F072C2E0103047018111A262322271E7A302F5448637545,293815561E=101C340428:007952151E20,0F2E1F33=0F1B273303:007984831A160F1719,632E20471D6B01=152D390921:0079110F0304062A528423222627207A19701A2C2E2F5D83,294513=0F1B273303:0079181A165B332F2B262322271E2021030469702D4E49712930845D,454F05=152139092D:0079192E2F030417332D1552847A5D,4E201F=162E3A0A22:003826232277,632E20523A=0D19310125:0038262389,521513=1C28340410:00384089,0F202E157C07=04101C2834:00384089,152967631F=101C283404:00384740,0F2037=1C28340410:00387765504089,0F157C04=131F37072B:00385476,521F13=16222E3A0A:003854767789,2E1F522010=131F2B3707:003854637519,205D1D1F52151E210F=121E2A3606:003889,52201F1D4733=121E2A3606:003889,881F=212D390915:001D23221E2789,52290F2E1F202B=07131F2B37:002C7080305C784C62,2E1F472001=283404101C:004D64547589,0F292E=131F2B3707:005040,522E1F0F2C2004=3404101C28:005089,032C2E1F33=182430000C:005089,8815=192531010D:00261F23221E201D2189,8D12=131F2B3707:00261F2322271E200C89,8D1E=121E2A3606:0026271E20,2F2E1F33=16222E3A0A:002627241F1E20232289,8D33=14202C3808:002627651E20232289,881B=182430000C:00262789,292C2E1F2B2F2A=07131F2B37:00262322271F1E203F8B65,52290F038002=15212D3909:001779332D2322271E2007760304,38290F1C=1F2B370713:00173883546365756619,466115201F701D47522434=0D25310119:00170F79191A6540,712909387C2015=0E1A263202:00170F332C2E2D2F802952443F26232227201F,15637C383A=132B37071F:00170F7665776489,8D2A=390915212D:00177689,0F52804F2507=2E3A0A1622:00177179546A76,0F52443D1F2D=0915212D39:0070,0F292C2E791F13=131F2B3707:007083624C,0F38202E7D4F45471F7107=380814202C:00704F0D332C2E2D15363F261F20274C,0F2906036F4703=3404101C28:00702C2E164C157126271F1E202425363F,29386A032B0F=0F1B273303:00700F1715262720,472E386309=15212D0939:007022230726,2E17712952302F15=15212D3909:00704889,8834=1C28340410:0070784889,0345201F21=2D39091521:007007482089,2E1F58470B=0D19253101:0070071A010618110F5B52846775,6326202E=16222E3A0A:00701A17794C0F302F715475,2E454F8A20243A=0F1B330327:007018111A1617192E15382627201F656477,4F090A=0F1B273303:002E2F18110F5B3315292A26271F20210C7A70710102393E19,035A37=14202C3808:002E4344793F26271F20,03702C2F292B381A31=0E1A263202:00161A5D454F153826201E27,7D0D2904=152139092D:0004037039180F332D152952262322271F0C533A83,4117804735=1F2B370713:0004037B7C0F79494766754667,80293869208A1E=162E3A0A22:00040301067018111A0F332C15292A261E200C7A7919712F5D52838454,5617454F06=3404101C28:000403110F527079156523221E2027,0129802E1F6B1D=1830000C24:0004031A170F11332C2E302F1571292A657677451949,70201D5218=102834041C:0004031811171A5B332C2E155D52,0D29204504=17233B0B2F:00040318110F1519262322271E2021,52831F3825=3B0B17232F:00046A7966444C7765,010C202F38520F70292E31=14202C3808:003F261F202789,8836=131F2B3707:003F657789,7152290F032B3A=2632020E1A:003F651F0C2027232289,0F292B=16222E3A0A:003F89,8836=212D390915:000F76,032E1F522C292B22=2B3707131F:000F7765,2E1F7C4607=0F1B273303:000F01111A1615292A2627200C2C670279538384543E49,634512=0F1B273303:000F1320,6380382936=0F2733031B:000F1323222627,2E3829031535=0D25310119:00676589,0F200F=0C18243000:00401D232289,71290F47202B=101C283404:0040395089,8803=30000C1824:004023222089,0F291118470D=0A16222E3A:004089,0F5211=1A2632020E:004089,0F0147200B=3A0A16222E:00037039454F0D332971152C4C48,090F476341382E0A=111D293505:00037039041A26271F1E202322,0F2F2C335129452E0D3A3B=222E3A0A16:000370396A450D332F4B154C,0F208A7D41381F2E14=0F1B273303:00030401061A16170F332E71292627200C02696A45514F0D2C2D4E497A,2B0B=0F1B273303:000304111A33152D2E302F71292A5284530770022B,0F6345203B=0F1B330327:00030418111617332E2D2F292A52845407020D302B,090F452001=0F1B273303:000304080618110F1A2E2D0D3371292A2C302F7566010239454E802B,632039=2430000C18:00036A7415384878,45751F20240F522E834F2E=182430000C:000301394F2E154763751F27,0F707A802629710D192035=14202C3808:0003391983845475,2E1F0F6A702971722A0D04=0F1B270333:00483F,6338200F2A=3B0B17232F:00481F2023221E27262189,0F292C2E1B=122A36061E:0076645089,8819=202C380814:0076777566262322271F201E,0F111852290D=101C283404:00763989,0F2036=1E2A360612:00788B89,0671292E25=010D192531:00784C793989,0F29702E1F208A21=31010D1925:0006261F1E201D212322,0F2938111801=2A3606121E:00060403702C2E4C154947443D651F,0D2920=101C283404:0006522E261F20,0F712939=2632020E1A:00060724232227261F2025,520F157929382F22=31010D1925:0006547677,0F5229151F201B=0E1A320226:00061A161718110F292A0C26271F21797001022F49,470D=0814202C38:002876396577261F20,5283290F37=212D390915:0028397976771E232227,0F522E47442027=121E2A3606:006389,8822=101C280434:007B7C3989,881E=1830000C24:007B343589,8805=2E3A0A1622:00021719792B155D5466774962,010611180F292030=14202C3808:00020370454F0D3933192C2E2D156375261F202322,0F7123=0E1A260232:0002070818111A16175B153E445D5452848365647576,2038454F15=182430000C:0007385476771548,52061F2024=2D39091521:0007504089,0F29157030=15212D3909:0007504089,060F71702F2918=15212D3909:0007504089,880B=17232F0B3B:000770171989,0F2E20382F=0B17232F3B:00077089,522E1F8A202C=07131F2B37:000704036939487C4466,0F7011293821=1824000C30:000715547776,521F18=0E2632021A:0007030401021811171A0F2E2322271F1E706749528483,202F293800=0F1B330327:00077663,0F297138202C=0B17232F3B:000776776548,0F1118152E1F2017=121E2A3606:00077665776489,52830F208A14=1A2632020E:00077B7C4834353989,2952203B=2632020E1A:00076A386563,0F7D8A2066454F52754C15=1E2A360612:00076A0F3874485040,06707C2509=3606121E2A:00076A74504089,5229702C7D15=14202C3808:00076A74173926271F1E20,0F7029522B09=000C182430:00076A54196348767765,7920297115528A0D382B16=101C283404:000734357B7C3989,0F528329200C=06121E2A36:0007343589,290F7104=2E3A0A1622:0007343589,0F292F702012=182430000C:0007343589,0F71296B708003=15212D3909:0007343589,7129706300=0D19310125:0007010618111A332D302F15262322271E530270164C,560F712924=0E1A263202:000701020618111A1752848354230C7027,262038292C=111D293505:0007711F204840,010F29153814=17232F3B0B:00076527262322,1552835A201D0F382D=0D19253101:0007363F8B3989,09292C208A0F28=030F1B2733:000739483F66,0F208A2B0A=04101C2834:0007397B7C343589,0106522008=020E1A2632:0007396A48343589,0F203A=283404101C:00073934357B7C89,0F5223=3505111D29:000739343589,032010=0A16222E3A:000739343589,520F2F=111D293505:000739343589,8A200A=15212D0939:00077A7089,8817=17232F3B0B:000789,8D3B=172F3B0B23:000789,8815=1B2733030F:007C343589,881B=212D390915:007C343589,8812=15212D3909:006A79190F6F2627,6B46204538290B=380814202C:006A38075040,0F630141202B454F2D=121E2A3606:006A5040077448,702B2C0F2F292E=0B17232F3B:006A583F232227261F20,0F291547031C=232F3B0B17:006A6F391974,0F2E614447702C292F71201F38521F=31010D1925:0034353989,522E1F2B=0D19253101:00343589,060F5200=2A3606121E:00343589,7129565A01=131F2B3707:00343589,883B=111D350529:00343589,8800=152D390921:000150402627,0F292F2B1E=2733030F1B:00010F17505840,565A80385283846315=101C283404:000103020611187B7C2D4E616439201E0C26,522E474429=101C283404:0001030239450D297115332C2E4C,0F542070528438632C=101C283404:000103392E54837548,19700F58157A20381F=1830000C24:00010670175B71292A152322271E,03637C2B380F=0E1A263202:0001067052842E71291F20,030F38477533=131F2B3707:0001067011185B0D332C2E2D712909262322271F200C,0F5263250C=17232F0B3B:000106040318111A170F33292A26276A201D0C7A71077C1F1E74694F,520A=0D19253101:0001060403232226380F767754,568020152D=111D293505:000106025B75712904032D302F382B2A0D801E20,2E1F0F0C=0D19253101:00010607155B5C26271E2021165D83,38470F2920=16222E3A0A:000106073018110F3329271E0C7A0D75,3826201508=0F1B273303:00010618111A16332C2E2F2D27200C07483A450D,1552843825=0E1A263202:000102261E2027,03476F700F2971382E39=15212D3909:0001027007834878,2E388A201D17=131F2B3707:00010203450D3329152C2E2F5375,0F638A6A1D382D=0E1A263202:000102030D70332C2E29712F534426201F1E,0F38152F=121E2A3606:0001020370450D332C2E2D152971,0F52838A201D1B=1D29350511:0001020370528384631575712D2E4E3E581F1E1D,292C2B452620803A=222E3A0A16:0001020370392F2971152B54754C,458A1F0F20462C=14202C3808:0001020370392F80712B546675201E26,1F58472E152F=16222E3A0A:000102037039714515750D33,201D381F092E0F1103=32020E1A26:000102030F7039453319152E2D2F63751F0C1E20,71290D38472C=16222E3A0A:000102035270392E2D5863,0F381D2B2921201511=131F2B3707:0001020352666A,0F7020262938172F3A=2430000C18:00010203332C2E2F1558631F,0F1920707A2971264627=05111D2935:0001020311180F702E1F7952838468332D6749443E46630C1E1D21,292B2035=1C28340410:000102031118396375664819,1D4138702080291F=232F3B0B17:000102033945332C6375201D21,0F1929710D702D=101C283404:00010203390D3329152C2B751E20,2E1F54475352458316=111D293505:0001020339161745514F2C190F1A152E2D2F304979,8D13=17232F3B0B:00010203396A79637566201D211E,29387D71707A30=101C283404:000102033911170D3319152E2F0947442627201F,8D25=3505111D29:000102031811392E2D19528384543E4463751F20,152F1A290F0D=0E1A263202:0001020626232227201E,0F2E03801F0F=101C283404:0001020617385483,030F47202B6B1B=2733030F1B:000102060F17705283797823221E2027,2E712910=121E2A3606:000102062A397129797B7C2E1F2425,162F5D20262B=182430000C:0001020603691817452C2E2D498344,412B6A09633808=3A0A16222E:0001020603700F7B7C2E1F692D48302F565A586366240C21,2B151A292039=17232F3B0B:000102060717706A33392D2E4E674447482322271E210C,71292B4F2023=33030F1B27:0001020607036A5D397C2163664744,0F4E25208A08=04101C2834:000102060775261F20,71290F70150C=101C283404:00010206111803302F565A802D4E2B881F261E0C,0D0F521B=16222E3A0A:00010206090D5B7952838454685D7B7C443D77656366201F1E,030F47454F24=010D192531:000102071283542627201D210C4C78,29580F2E6352031F01=32020E1A26:00010275261E0C2322,6303706F0F292E1F19=0E2632021A:000102081A158483262322270C1E,700F292E1B=101C283404:00011A1615262322271F1E200C214C,472B0F1124=3707131F2B:00013974150726271F1E200C,0F06520D297170382B4507=17233B0B2F:000118111A16175B154C26271E200C232279302F5D528384547543,0F297C7A03=17232F3B0B:000118111A332C2E2D1571292A2627200C7A1979,387C02=172F3B0B23:000118111A332C2E2D1571292A23222627200C7A791970302F5D5283845456,387C454F1F=0E1A263202:0001081811171A160F1571292A26271E20396476452B0D,632E523813=15212D3909:00211D1E232289,8D16=0E2632021A:006526232227201F,8926=05111D2935:00657689,6B0F5225=16223A0A2E:00654C89,8D03=2A3606121E:006589,2970472008=15212D3909:001A170F5B332E2D7129261E203E5D,1503528306=152139092D:001A170F1379232227761926,71293833=1C28340410:001A1715838444363F261F1E200C2322,0F476B52036338=14202C3808:001A2B5448701938754C,152E20242510=0D19253101:0039504089,8D39=283404101C:003926271E20747677642322480C06,2E1F38=0F1B273303:0039262322271E201D210C0748766465776A,150F382939=202C380814:0039332C2E2D2F152B4644261F1E,0F7019382971637A31=192531010D:0039787989,1F2E2010=101C283404:0039787089,2E1F8A034F206B29=05111D2935:00398B7989,0F200C=131F2B3707:0039077426271F1E20,0F29713852832B632D=14202C3808:0039076A7426271F2048,0F79197029717A382C=0E1A263202:00397C343548,8929=3B0B17232F:003934357B7C89,0F2028=16222E0A3A:0039343589,8D34=16222E3A0A:0039343589,880B=111D293505:0039343589,8805=17233B0B2F:0039343589,882E=101C283404:0039343589,8806=17233B0B2F:00390103040618111A17332C2E262322271E157A7071302F45631F2075,807C2B=0915212D39:00396577647969271E2322,52012E1F2620612D=16222E3A0A:00391A6A15384C4943363F7448,0F0379472B6319=192531010D:00394C786F89,0F2E442035=182430000C:003989,882A=121E2A3606:003989,8816=13191F252B313701070D:003989,8801=0D19310125:003989,880D=0F1B273303:0018112C2E01040607332D292A09270C2322696870302F47023945,382052801C=101C340428:00190F153917701A48,472E1F200334=1F2B370713:00195475667689,5229152E2019=222E3A0A16:004C504089,0F5215470A=3A0A16222E:005C702C2F802B154C78,5A562E1F208A45466319=102834041C:0089,090F1538=131F2B3707:71297C790001062A0F802D,5215705D2F=0E1A263202:7100030170391959152E2D2F2B,0F201F4F75668A3824=030F1B2733:5483846376656419786A,298030201A=2430000C18:5452838479195D00012A0D7B7C2C2E3348156366242526201E,0F71292D=07131F2B37:54528384700001020339482D301571565A363F637566,06292B201F8A29=030F1B2733:54528384036F796A153E65,7129631D=2733030F1B:5452848303152F802C2D,2E1F208A7A700F29710C7D22=33030F1B27:118384155B20272E1F21,0F03380E=0E1A263202:1179302F842627201E,0071292E1F0E=06121E2A36:11177B7C52842C2E5B1F20,060071292F0F0E=101C283404:110F70528475660D7129,012E1F20262A=101C283404:110F03706A795215636626271E,0C012F38062C292B07=020E1A2632:110F0001702C2E7129201F,52060C=0E1A263202:110F00017052792E1F1E,71290D2B2020=293505111D:110F1A6A702C2E1952838453712F6375,45201500011D=101C340428:11037B7C2E2F7129,0F52200B=0E1A263202:11000170792C2E7129,0F52201F01=111D350529:110001527B7C2E75,0F2009=04101C2834:1100010206702D804E2B2620,0F52540D00=131F2B3707:110001392E1F20,0F712932=17232F3B0B:117154528384292C2E302D4E092A0D50407970443D,5680410023=2B3707131F:111879690001020370396A2E2D528384543E637566,0F380D58292000=222E3A0A16:111879076A1A171523221E272024,5229700F1D012E2B0C2F0B=06121E2A36:111817000106702C2E71292A0D33802D302F4E2B44,0F52252029=07131F2B37:11180F000704030D7C684580302F153867534775,70204119=2430000C18:11180F00012A0D70795D7B7C39332D2C2E4E4863664C,064F478A2037=1E2A360612:11180F000152548471702C2E2D4E303348492A156144474C63,8A201F38450618=202C380814:11180F000128032A0D7129302C2E2F2D802B09411F1E20,5284543824=2F3B0B1723:11180F0001020370391952845329712B632E7B7C792D2C8020,385D151E=293505111D:11180F0001020339700D29716375662E1F2620,3815568016=16222E3A0A:11180F000102587B7C5283847971302F804B2B497675,09612E1F201E=232F3B0B17:11180F00010E715229702E79692C2D2B15093954444C66,2F565A806132=131F2B3707:11180F71297052838454792A0D33802D153853201F1E212627,012F56476628=3707131F2B:11180F71297000010604032A0D793969302F33802D636675,201F52565A1E18=1D29350511:11180F5C000102030D332C2E195329711563261F202322,52843A=202C380814:11180370392A0D3329712C2F156375795B5D,450C8A00382E1F20010C=3A0A16222E:11185283847975661271393D692D15565A201E262322,292F060D0C02=30000C1824:111852838470795B302F404533802D152B39201E23221D212726,0F2E1F010D2923=2D39091521:111852838453546319297115030D332B2C,060F8A2E38201F38=0D19253101:111800020D041A796933483E5347446563751F1D212026,010F09150C17=2430000C18:1118000717161A2C2E3371292B56433D6375363F,0F010347208A09=020E1A2632:111800012A0D2C705271292E201F,1538617904=30000C1824:11180001032A0D70795B2C2E302F802D4E152B33714161201F26,520958470A=000C182430:11180001020439332C2E302F2B5844477515634C1F2721,0F520D19267A2971702037=232F3B0B17:111800010206037939695483845D2D2E4E446375661F262120,0F52290D7123=31010D1925:111800010206071979697C67474475664C,0F16298A2014=182430000C:11187129705B79000106032A0D397B6F7C802D2C2B61756627261E0C1D21,0F2E15414732=192531010D:111871545283842979397B7C69152B2A0D33485324251F1D1E26,6B00702F800C201E=1F2B370713:5D0007363F232227261E21,037C0F471F202E=0E1A263202:6526232227201F,880E=111D293505:653989,8806=131F2B3707:363F6526232227201E89,8832=1A2632020E:1A454F548384,881D=121E2A3606:1A38712975,0F201A=0E1A263202:1A162623227954,0001710F290C=0F1B273303:1A16170F13152654,3852204F32=0F1B273303:1A5D453A332C2E2F4B25262322271F201E1D21,000F704723=2F3B0B1723:3950177089,522E1F0F201A=1D29350511:39701117302F713819297566,004551152C2E201D1F34=121E2A3606:393589,881A=15212D3909:393589,882C=182430000C:393589,8825=101C283404:393589,881C=2531010D19:394089,71294709636F7C440D=0D19253101:3948007889,8D38=2430000C18:394889,8811=111D293505:394889,882A=0E1A263202:3907,8807=0D19253101:39343589,8831=101C283404:393489,8801=222E3A0A16:390050404C89,0F528329692018=131F2B3707:39006A26201F,0F520D38580629712B09=380814202C:390001022C2E302F1575804B2D261F20,0D0F0319707D5229717A15=17232F3B0B:3989,8D11=0A16222E3A:181179838454637566,0F5229012007=111D293505:18117915384C,52200E=0C18243000:1811795B032C2E302F802D4163754C27261E1D2120,010D0F29521F29=16222E0A3A:1811795B5466,01202F=192531010D:181179000607040D03302F5283844F3A45512B1533664C47,090F702E208A2B=0B17232F3B:18117900012C2E5B1F20,0F710D52291A=122A36061E:181179190E332C2E2D52637566262322271F20,8D02=0F1B273303:181117332C2E1526232227201F1E3E,38030F522922=142038082C:181170792C2F7129,52201F=121E36062A:18117001061579,71292023=121E2A3606:18117000012C2E7129,522024=3505111D29:18110F3900010203700D3329711563752E1F0C201D,38525D1A=101C283404:18110F197983842E230C271F1E7A70525463,2620291503=111D293505:1811002E1F8384,0F2022=1824000C30:181100012C2E2F1F,0F3821=142038082C:181100012C2E2F1F20,0F5229=14202C3808:181100015B3875,2E2034=15212D3909:181100012A0D2C2E2F2B2D304E447129841F,0F09416138200F=0814202C38:181100012A0D52842953411E20,2E1F0F47152F=131F2B3707:18110001032A0D845B7129302F791533536678,0F208A1F1D33=17232F3B0B:18115452840001712970802D2C2E302F2B2A0D78791F,0F204758610E=0F1B273303:18111A16175B3315262322271F1E201D215D838454433E363F754551,00030F290D=0C18243000:18115C0001702A2C2E2F5283847129795B6375802D154C,1F208A2407=15212D3909:88,262052830D=17232F3B0B:88,8D17=102834041C:88,8D0B=15212D0939:88,8D24=121E2A0636:88,8D09=17232F0B3B:88,8D13=111D293505:1979,3F2F2E45207D37=112935051D:1966583F6589,8831=16222E3A0A:4C4089,880C=0C18243000:4C78,297172380D2A2E0F47484112=16222E3A0A:5C0F1811790070528471291F20,2F0380512514=1C28340410:5C0001020652835B0E03804B2D4E2B752024210C,292E565A36=1A2632020E:5C11180001027170520D2984832B15200C,03802E386333=15212D3909:89,6B34=111D293505:89,8D";
LunarUtil.TIME_YI_JI = "0D28=,2C2E2128=,2C2E0110=,2C2E0C1F=,2C2E7A701B1C=,01022308=,01026D003026=,000106037A702D02=,000106037A702802=,000106037A703131=,000106037A70341B=,000106087A701F0E=,000106087A702E15=,000106087A702C2E0E39=,000106087A702C2E0D2B=,881727=,88032D=,88352F=,882B2F=,882125=,882A22=,880C1E=,880220=,88161A=,882018=,883422=,880113=,880B11=,883315=,882915=,881F17=,88150D=,88122E=,88302A=,88262A=,883A28=,880826=,881C2C=,881905=,882303=,880F09=,88050B=,883701=,882D01=,88060C=,882410=,881A12=,882E0E=,88380E=,881010=,883630=,881834=,880E38=,882232=,882C30=,88043A=,881E0A=,880006=,883208=,880A04=,881400=,882808=,883137=,883B35=,882737=,881D39=,88133B=,880933=,88251D=,882F1B=,881B1F=,88111D=,880719=,88391B=,88212D=,7A702C0B15=,7A70551515=,7A70552D00=,7A7D2C2E1334=382C,000106083528=382C,7A70000106080504=382C7A6C55700F197120,00010608223A=380006082C,01026D0D2C=380006082C,01027A70551D30=380006082C0F71295283,01027A703636=380006082C0F71295283,0102416D1226=380006082C7A706C550F297120,0102251C=380006082C7A6C55700F197120,01026D2300=3800010608,2C2E0324=3800010608,7A702C2E082E=3800010608,7A70552C2E3B34=38000106082C,2F8026330C=38000106082C,2F80267A701622=38000106082C7A70556C0F197120,1904=38000106082C7A6C55700F197120,1514=38000106087A70556C0F197120,2C2E3138=38000106087A70556C0F197120,2C2E0B10=38000106087A6C55700F197120,2C2E2B28=387A6C55700F197120,000106082C2E2E16=38082C,000106037A700E3A=38082C,000106037A703708=38082C6C550F197120,000106037A701B20=38082C6C550F197120,000106037A70111C=38082C6C550F197120,000106037A703A2D=2C38,000106082733=2C38,000106081015=2C38020F71295283,000106083817=2C2920,7A700F03=2C2920,616D1839=2C292070556C100F,00010608161B=2C2920020F7100010608,302B=2C2920556C0F1971,7A701E07=2C2920010F,1B1B=2C2920010670100F00,352B=2C292000010206100F70,082B=2C292000010206100F707A,0C21=2C292000010870556C100F7A,0617=2C29206C0F1971,7A70552807=2C29207A70556C0F197100010206,122F=2C29207A706C55100F1971,1017=2C29207A706C55100F1971,2731=2C20,616D0436=2C2070550F,7A7D01022E12=2C200F71295283,01021831=2C20556C0F1971,7A702912=2C20100F52,01026D1D33=2C807138152952,000106080E31=2C80713815295270556C100F,000106083201=2C80713815295270556C100F7A,000106080327=2C80713815295202100F,000106037A702B2B=2C80713815295202100F,000106037A702801=2C80713815295202100F,000106083639=2C80713815295202100F7A7055,00010608341D=2C807138152952556C100F,000106037A701B23=2C807138152952010F6C55,7A70302D=2C8071381529520102100F7A7055,2231=2C8071381529520102100F7A6C55,1F13=2C80713815295200010206100F20,7A70313B=2C8071381529526C550F,000106037A701A15=2C8071381529527A70550F,000106080219=2C8071381529527A70556C0F19,000106082E0D=2C80713815295208556C100F,000106037A70161F=2C80711529525670556C100F,000106083813=2C80711529525670556C100F,000106082D05=2C807115295256020F7A706C55,2237=2C80711529525602100F,000106081F0D=2C80711529525602100F55,000106037A702627=2C8071152952560102100F7A706C,2C33=2C8071152952560102100F7A706C,0939=2C80711529525601100F7A7055,416D021F=2C80711529525600010206100F70,0E37=2C80711529525600010870556C10,2129=2C8071152952566C550F,7A702519=2C8071152952566C550F19,7A702417=2C8071152952566C55100F19,000106037A70043B=2C8071152952566C55100F19,000106037A700C1B=2C8071152952566C55100F19,7A703B31=2C8071152952566C100F19,7A705500010603172D=2C8071152952567A70550F,416D3A2F=2C8071152952567A70556C100F,1901=2C8071152952567A706C55100F19,1119=2C8071152952567A6C55700F19,1C2B=2C80711529525608556C100F,000106037A701403=2C80711529525608556C100F,000106037A70071D=2C80711529525608100F55,000106037A701908=292C20,7A7D01026D2E0F=292C200102100F7A7055,032C=292C20000608,0102071C=292C206C550F1971,000106037A700E33=292C207A70556C000108,0503=2920550F,7A702C2E0721=2920556C100F,7A702C1225=2920000108556C100F,7A702C2E1F11=2900010870556C100F7A,032C201A11=297A70556C100F,032C200E35=297A70556C100F,032C20000A=70556C0F197120,7A7D3A29=70556C100F2C20,000106081C25=70556C100F2C20,000106082805=70556C100F2C20,000106082F20=70556C100F2C20,00010608150C=70556C100F29522002,7A7D000106033314=70556C100F,00010608032C20122A=70556C08,7A7D000106032415=70100F2C715220,000106081A0D=4B0F2C20,000106037A701902=4B0F2C20,000106080E3B=4B0F20,7A702C000106032E17=0F2C09382920,7A7000010603363B=0F2C093829206C55,000106037A70082C=0F29528320,7A2C71707D01026D0718=0F712952832C20,7A7D01021C26=0F712952832C20,7A7D01026D3918=0F712952832C2038000608,01027A70552126=0F712952832C2010,01021330=0F712952832C207A7055,01021118=0F712952832C207A7055,01023524=0F715220,7A70552C2E3419=20556C0F1971,7A702C2E1D31=2000010206100F,7A702C1E05=0270290F2C207A,00010608212C=0270550F,00010608032C200C23=0270550F,00010608032C203706=0270550F20,000106082C2E2520=0270550F20,7A7D000106032E13=0270550F202C807115295256,000106081620=020F29528320,000106087A2C71707D0112=020F2952832055,7A2C71707D000106030F08=020F20,7A7055000106032A23=020F712952832C20,2521=020F712952832C20,000106082F21=020F712952832C20,000106080003=020F712952832C20,7A700432=020F712952832C2038000106086C,7A701E03=020F712952832C2070556C10,000106081623=020F712952832C2001,2236=020F712952832C2001,000B=020F712952832C2001,7A70552C36=020F712952832C20013800,416D341E=020F712952832C20017055,7A7D0E32=020F712952832C200110,7A7D0329=020F712952832C2001107A706C55,262D=020F712952832C20017A7055,1229=020F712952832C2000010608,122D=020F712952832C2000010608,1011=020F712952832C2000010608,0A0B=020F712952832C2000010608,1F0F=020F712952832C2000010870556C,1A0E=020F712952832C206C55,7A703312=020F712952832C2010,000106037A70172A=020F712952832C2010,7A7055000106033B3B=020F712952832C2010,416D000106037A700B12=020F712952832C20106C55,000106037A700615=020F712952832C207A7055,3203=020F712952832C207A7055,201B=020F712952832C207A706C5510,2023=020F712952832C207A6C7055,2A1B=020F7129528320,000106087A702C2629=020F7129528320,7A702C2E3709=020F7129528320,7A702C000106083A24=020F7129528320,7A70552C2E341A=020F712952832038000106087A70,2C2E1C2D=020F712952832001,7A702C2E0611=020F712952832001,7A702C2E021A=020F712952832001,7A7D2C2E3815=020F71295283200100,7A702C2E3024=020F71295283200110,616D2C2E093B=020F71295283206C55,7A702C2E000106030505=020F71295283206C55,7A702C030C1A=020F71295283207A706C55,000106082C2E3705=020F712952837A706C55,032C201F0C=02550F20,000106037A700508=02550F20,000106037A703029=02550F20,000106087A702C2E3027=02550F202C807115295256,000106037A703526=02100F2C29528320,000106037A70150E=02100F2C29528320,00010608380F=02100F2C29528320,000106083527=02100F2C29528320,7A70000106031C27=02100F2C2955528320,000106081227=02100F2C29555283207A706C,00010608060F=02100F2C29555283207A706C,000106081D34=02100F7020,7A7D000106030F02=02100F7055528315,2F8026000106083920=02100F7055528315,2F802600010608212A=02100F7055528315,000106082A20=02100F7055528315,000106083A26=02100F7055528315,000106080439=02100F7055528315,000106080008=02100F7055528315,000106081B21=02100F7055528315,00010608071B=02100F7055528315,000106080D24=02100F7055528315,000106082C2E2C32=02100F7055528315,000106082C2E2B2C=02100F7055528315,00010608032C201402=02100F7055528315,00010608032C20391C=02100F7055528315,7A7D000106031F10=02100F705552831538,2F8026000106082D06=02100F70555283157A,2F802600010608290D=02100F20,7A702C000106032416=02100F20,616D000106037A702C34=02100F20292C,7A70000106031C2A=02100F528315,7A7055000106032234=02100F528315,7A7055000106032A21=02100F55528315,000106037A703313=02100F55528315,000106037A700509=02100F55528315,000106037A702D03=02100F55528315,000106037A700613=02100F55528315,000106037A702235=02100F55528315,000106037A70391D=02100F55528315,000106037A70100F=02100F55528315,000106087A702C111B=02100F55528315,000106087A702C2E2916=02100F55528315,7A2C71707D000106030430=02100F55528315,7A2C71707D000106033B32=02100F55528315,7A2C71707D000106081903=02100F55528315,7A702C2E000106033A27=02100F55528315,7A702C000106030931=02100F55528315,7A702C000106030C1C=02100F55528315,7A70000106032735=02100F555283152C8071,000106037A700B13=02100F555283152C807138,000106037A701517=02100F555283152C807138,000106037A702917=02100F555283156C,000106037A703136=550F522010,7A2C71707D01022A1E=550F715220,7A702C2E1333=550F715220,7A702C2E000106081405=556C,000106087A702C2E0433=556C,7A70000106083B38=556C0F197120,7A702C2E1E01=556C0F19712001,7A702C2E190B=556C000108,7A70230B=556C000108,7A702C2E1A0F=556C0001082C807115295256,7A701830=556C0008,7A2C71707D01023814=556C100F295220,7A2C71707D03082F=556C100F295220,7A702C0C1D=556C100F295220,7A702C2E00010603021D=556C100F295220,7A70000106031121=556C100F2952202C,7A701835=556C100F2952202C80713815,000106037A703B30=556C100F29522002,000106037A70290C=556C100F29522002,7A70000106030930=556C100F2952200238,000106037A702B27=556C100F2952200102,7A702C2E3812=556C08,000106037A701012=556C08,000106037A701621=556C08,7A702C2E000106033209=556C08,7A702C2E000106032021=556C082C807138152952,000106037A700009=556C082C807138152952,000106037A702A1D=807138152952000170100F,032C200A05=807138152952000170100F,032C20273B=8071381529527A706C550F,032C203423=80711529525600010870556C100F,032C201511=80711529525600010870556C100F,032C20183B=80711529525600010870556C100F,032C203311=010F2C80093829206C55,7A702B29=010F2C80093829206C55,7A70616D3A25=010F2C09382920,7A70550825=010F2C093829207A6C5570,201E=010F09382920,7A702C2E352E=010670100F2C71522000,1C28=010670100F7152207A6C55,2C2E2E11=0106100F7152,7A70032C203205=0106100F71526C,7A70032C202A19=0102290F20,7A702C2E2A1F=010270290F2C207A6C55,2413=010270290F2C207A6C55,0437=010270290F2C207A6C55,0935=010270550F,032C201B18=010270550F20,2B24=010270550F20,2F80261906=010270550F20,2C2E2732=010270550F20,2C2E071A=010270550F20,2C2E3700=010270550F20,7A7D1724=010270550F203800,2F80263921=010270550F202C29,416D290F=010270550F202C807138152952,1619=010270550F202C8071381529527A,3207=010270550F202C80711529525600,0829=010270550F2000,060D=010270550F2000,0001=010270550F2000,2736=010270550F207A,1B1E=010270550F207A,2C2E140B=010270550F207A6C,0114=010270550F7A6C,032C202C3B=010270550F7A6C,032C20201F=0102550F20,7A702C1A13=0102550F20,7A702C3637=0102550F20,7A702C280B=0102550F20,7A702C223B=0102550F20,7A702C032D04=0102100F2C29528320,7A701409=0102100F2C29528320,7A70552307=0102100F2C2952832000,0005=0102100F295283,032C207A700A00=0102100F2955528320,7A2C71707D082D=0102100F2955528320,7A702C2E2809=0102100F295552832000,7A702C2E2B2D=0102100F7055528315,021E=0102100F7055528315,0C20=0102100F7055528315,2F80263420=0102100F7055528315,2F80261510=0102100F7055528315,2F80262E10=0102100F7055528315,2F80262806=0102100F7055528315,2F80263134=0102100F7055528315,2F80261D38=0102100F7055528315,2F8026251A=0102100F7055528315,2F80263A2A=0102100F7055528315,2F80267A7D1120=0102100F7055528315,2F80267A7D0824=0102100F7055528315,2C2E1E00=0102100F7055528315,2C2E7A2F1D=0102100F7055528315,032C200A06=0102100F7055528315,7A7D2C2E1C2E=0102100F70555283153800,2F80261832=0102100F70555283153800,2C2E280A=0102100F70555283153800,2C2E320A=0102100F705552831538007A,2738=0102100F705552831538007A6C,2F80260720=0102100F705552831538007A6C,2F8026032B=0102100F70555283152C292000,1907=0102100F70555283152C292000,3703=0102100F70555283152C292000,2739=0102100F70555283152C29207A,251B=0102100F70555283152C29207A,2B25=0102100F70555283152C29207A6C,1331=0102100F70555283152C207A,0D29=0102100F70555283152C80717A,1B1D=0102100F70555283158071,032C200D2D=0102100F705552831500,1725=0102100F705552831500,352D=0102100F705552831500,0C19=0102100F705552831500,150F=0102100F705552831500,3025=0102100F705552831500,0F07=0102100F705552831500,1E09=0102100F705552831500,251F=0102100F705552831500,010C=0102100F705552831500,2F80261A10=0102100F705552831500,2F80261016=0102100F705552831500,2F80260934=0102100F705552831500,2F80262910=0102100F705552831500,2F80267A7D1A14=0102100F705552831500,2C2E2304=0102100F705552831500,7A7D3421=0102100F7055528315002C2920,212F=0102100F7055528315002C807138,111F=0102100F7055528315002C807138,3135=0102100F7055528315008071,032C200828=0102100F7055528315007A6C,2022=0102100F70555283156C,7A7D140A=0102100F70555283156C,7A7D2C2E2127=0102100F70555283157A,1618=0102100F70555283157A,0B0F=0102100F70555283157A,1836=0102100F70555283157A,172E=0102100F70555283157A,2F8026352A=0102100F70555283157A,2F80262B2E=0102100F70555283157A,2F8026082A=0102100F70555283157A,2F80262306=0102100F70555283157A,2F80263702=0102100F70555283157A,2F80262C38=0102100F70555283157A,2F80261E06=0102100F70555283157A,2F80261B1A=0102100F70555283157A,2F8026032A=0102100F70555283157A,2C2E1F14=0102100F70555283157A,2C2E3810=0102100F70555283157A,2C2E262C=0102100F70555283157A29,032C20201A=0102100F70555283157A00,2F80260A02=0102100F70555283157A00,2F80261838=0102100F70555283157A6C,2F80260E34=0102100F70555283157A6C,2F80260438=0102100F70555283157A6C,2C2E2F1A=0102100F70555283157A6C,2C2E2305=0102100F528315,7A70553525=0102100F5283152C8071,7A70550723=0102100F528315807138,7A7055032C200D2A=0102100F55528315,2F80267A2C71707D3316=0102100F55528315,2F80267A2C71707D1224=0102100F55528315,2F80267A2C71707D212E=0102100F55528315,2F80267A700616=0102100F55528315,2F80267A70380C=0102100F55528315,2F80267A700434=0102100F55528315,2F80267A702A18=0102100F55528315,7A2C71707D2628=0102100F55528315,7A2C71707D100C=0102100F55528315,7A2C71707D2F80261729=0102100F55528315,7A701F15=0102100F55528315,7A70240E=0102100F55528315,7A703632=0102100F55528315,7A701339=0102100F55528315,7A700115=0102100F55528315,7A702C2C37=0102100F55528315,7A702C320B=0102100F55528315,7A702C3206=0102100F55528315,7A702C2E2238=0102100F55528315,616D2F80267A2C71707D3816=0102100F555283153800,2F80267A701406=0102100F555283153800,2F80267A700111=0102100F555283152C8071,7A700501=0102100F555283152C8071,7A70370B=0102100F555283152C807138,7A703B37=0102100F555283152C80713800,7A701C2F=0102100F555283152920,7A702C240F=0102100F555283152920,7A702C0A03=0102100F555283152920,7A702C0221=0102100F55528315292000,7A702C2E3317=0102100F55528315292000,7A702C2E3634=0102100F5552831500,2F80267A2C71707D3028=0102100F5552831500,7A2C71707D111A=0102100F5552831500,7A2C71707D071E=0102100F5552831500,7A2C71707D2913=0102100F5552831500,7A702F19=0102100F5552831500,7A702301=0102100F5552831500,7A702C3919=0102100F5552831500,7A702C3B33=0102100F5552831500,7A702C2E0223=0102100F5552831500,7A702C03032F=0102100F55528315006C,7A702C2E262E=0102100F555283156C,2F80267A70032E=0102100F555283156C,7A2C71707D0F0B=0102100F555283156C,7A701D3B=0102100F555283156C,7A702C2E030116=01100F1571292C20,2F80267A703200=01100F1571292C20,7A7055370A=01100F1571292C2000,7A701B22=01100F1571292C2000,7A701E04=01100F1571292C2000,416D1336=01100F1571292C20007A70556C,391A=01100F1571292C20007A6C7055,1C24=01100F1571292C207A7055,2F80260D2E=01100F15712920,7A702C2E2D0A=01100F15712920,7A702C2E2800=01100F15712920027A7055,2C2E251E=01100F157129207A70556C,2C2E1228=01100F157129207A70556C,416D2C2E050A=01100F5220,7A70550000=01100F5220,616D2624=01100F5220,616D2F80267A702804=01100F5220006C,7A70550F06=01100F52207A70556C,2C2E2F1E=01100F52207A70556C,2C2E1014=01100F527A70556C,032C20161E=01100F712920,7A702C2E0A0A=01100F71522C2920,616D161C=0070100F292C20,01020F04=0006100F7020,7A7D01026D183A=0006100F7020,616D0102201C=0006100F20,7A2C71707D01026D1D37=000170100F292C20,2F18=000170100F292C802038,161D=00014B0F,032C201338=00014B0F2C2002,2F80261728=00014B0F20,2C2E0F0A=00014B0F20,7A2C71707D1833=00014B0F20,7A702C1407=00014B0F20,7A702C1401=0001060838,2C2E1123=0001060838,416D032C202019=000106082C38,2C31=000106082C38,391F=000106082C38,2523=000106082C38,7A70416D1C29=000106082C38020F71295283,3811=000106082C38020F71295283,7A700937=000106082C386C550F197120,7A700117=00010252100F29202C7A706C55,1337=00010206700F202C807138152952,3A2E=00010206100F7020,616D0610=00010206100F20,7A2C71707D0328=00010206100F20,7A700F01=00010206100F20,7A702C3310=00010206100F20,7A702C2E3139=0001100F298020,7A702C2625=00010870556C100F2C20,1909=00010870556C100F2C20,391E=00010870556C100F2C20,2124=00010870556C100F2C20,2F80267A7D0F00=00010870556C100F2C2038,2D09=00010870556C100F2C2002,0500=00010870556C100F2C207A,2C39=00010870556C100F2C207A,2518=00010870556C100F2C207A,0B0C=00010870556C100F2C207A,2F80262911=00010870556C100F7A,032C200007=000108556C100F2C2029,7A700A07=000108556C100F2C2029,7A701332=000108556C100F20,2C2E7A70100D=000108556C100F20,7A702C2E2239=000108556C100F20,7A702C2E0A01=000108556C100F20,7A702C2E380D=0001086C100F2C20,7A70551D36=0001086C100F2C20,7A70552F1F=000108100F70552920,010D=000108100F70552920,616D0507=000108100F705529202C80713815,0B0D=000108100F705529202C8071157A,3133=000108100F7055292002,2309=000108100F7055292002,416D0002=000108100F705529207A,2F80263202=000108100F705529207A,2F80263638=000108100F705529207A,2C2E2A1A=000108100F705529207A38,2F80262414=000108100F705529207A6C,2C2E2E14=000108100F552920,7A2C71707D1404=000108100F552920,7A2C71707D0B17=000108100F552920,7A70330D=000108100F552920,7A702C172F=000108100F552920,7A702C2E3707=000108100F5529206C,616D7A702C2E302E=6C55700F197120,2C2E7A7D0C22=6C55700F197120,7A7D01026D1E02=6C550F297120,000106037A703923=6C550F297120,7A702C2E03230A=6C550F1920,7A2C71707D240C=6C550F19200210,7A2C71707D000106031A16=6C550F197120,000106037A701513=6C550F197120,7A703A2B=6C550F197120,7A701837=6C550F197120,7A702F23=6C550F197120,7A702F22=6C550F197120,7A702D07=6C550F197120,7A702C2E3922=6C550F197120,7A700102093A=6C550F197120,7A70000106031B19=6C550F197120,616D7A70071F=6C550F197120,616D7A702C2E212B=6C550F197120,616D7A702C2E000106032734=6C550F197120292C,000106037A700325=6C550F1971200001020610,7A702C122B=6C550F19712008,000106037A702411=6C100F2952,7A7055032C20010E=100F2C29528320,01023704=100F2C29528320,0102363A=100F292C206C55,000106037A702B26=100F2920,7A2C71707D01026D302C=100F7055528315,01021E08=100F7055528315,01022730=100F7055528315,01021512=100F7055528315,010200352C=100F7055528315,7A7D01026D2F1C=100F7055528315,7A7D01026D0222=100F70555283153800,01026D2412=100F70555283157A,01022230=100F70555283157A,0102060E=100F70555283157A6C,01022C3A=100F70555283157A6C,01026D1F12=100F1571292C20,01026D3B36=100F1571292C20,01026D1516=100F1571292C20,000106037A702302=100F1571292C20,000106037A701D32=100F1571292C20,000106082F8026330E=100F1571292C20,000106086D2A1C=100F1571292C20,7A7001026D313A=100F1571292C20,7A7000010603341C=100F1571292C20,416D7A70000106032B2A=100F1571292C2002,000106037A700326=100F1571292C20556C,000106037A70273A=100F1571292C2000,01026D0722=100F1571292C2000,01026D2E0C=100F1571292C206C55,000106037A701408=100F1571292C207A706C55,01022020=100F1571292C207A706C55,000106081726=100F1571292C207A6C7055,0102290E=100F1571292C207A6C7055,000106080932=100F1571292C207A6C7055,000106080D26=100F52,00010608032C20100E=100F5283153800,01027A70550B16=100F5220,2F8026000106081122=100F5220,6D010200133A=100F5220,01026D1F16=100F5220,000106037A703132=100F5220,000106083B3A=100F5220,000106082522=100F5220,00010608190A=100F5220,000106082C2E021C=100F5220,7A70000106030936=100F52202C,01026D3A2C=100F52206C55,01027A701A0C=100F52206C55,000106037A700E30=100F52206C55,000106037A700A08=100F52207A706C55,000106083204=100F52207A6C5570,01026D0B0E=100F55528315,01027A2C71707D0004=100F55528315,7A2C71707D01026D1D3A=100F55528315,7A2C71707D01026D3418=100F5552831500,7A2C71707D0102201D=100F712920,7A702C2E00010608030E36=100F71522C2920,01023635=100F715229,00010608032C20021B=7A70550F2C715220,1900=7A70550F715220,2C2E0A09=7A70556C,00010608172C=7A70556C,00010608032C200B14=7A70556C,00010608032C202914=7A70556C0F197120,2C2E0938=7A70556C0F197120,000106082C2E111E=7A70556C000108,0502=7A70556C000108,2F80260D2F=7A70556C0001082C807138152952,2D0B=7A70556C0001082C807138152952,3633=7A70556C0001082C807115295256,0C18=7A70556C0008,01020218=7A70556C0008,0102302F=7A70556C100F295220,000106082C35=7A70556C100F295220,000106081E0B=7A70556C100F2952202C807115,3130=7A70556C100F29522002,000106080506=7A70556C100F29522001,2C2E330F=7A70556C100F29522001022C8071,010F=7A70556C100F295220010200,0435=7A70556C100F295280713815,032C200614=7A70556C100F295201,032C20122C=7A70556C100F29520102,032C203B39=7A706C550F297120,0F05=7A706C550F297102,032C200D25=7A706C550F19712001,616D2233=7A706C550F19712000010608,2626=7A6C70550F197120,01021A17=7A6C70550F197120,00010608262F=7A6C70550F1971202C29,000106083529=7A6C70550F19712002,616D000106082D08=7A6C70550F197120103800,0102341F=7A6C55700F197120,2C2E172B=082C38,7A7055000106030D27=082C38,7A70000106030827=08556C100F2C20,000106037A702803=08556C100F2C20,000106037A701013=08556C100F2C20,7A7000010603262B=08556C100F2C20,7A7000010603240D=08556C100F2C20,7A70000106033631=08556C100F2C20,7A70000106030431=08556C100F20,7A702C2E000106031D35=08100F552920,000106037A701335=08100F552920,000106037A700612=08100F55292038,000106037A70";
LunarUtil.SHEN_SHA = [
  "{s.none}",
  "{sn.tianEn}",
  "{sn.mingFei}",
  "{sn.muCang}",
  "{sn.buJiang}",
  "{sn.siXiang}",
  "{sn.mingFeiDui}",
  "{sn.wuHe}",
  "{sn.sanHe}",
  "{sn.chuShen}",
  "{sn.yueDe}",
  "{sn.yueKong}",
  "{sn.yueDeHe}",
  "{sn.yueEn}",
  "{sn.shiYin}",
  "{sn.wuFu}",
  "{sn.shengQi}",
  "{sn.jinKui}",
  "{sn.xiangRi}",
  "{sn.yinDe}",
  "{sn.liuHe}",
  "{sn.yiHou}",
  "{sn.qingLong}",
  "{sn.xuShi}",
  "{sn.mingTang}",
  "{sn.wangRi}",
  "{sn.yaoAn}",
  "{sn.guanRi}",
  "{sn.jiQi}",
  "{sn.fuDe}",
  "{sn.liuYi}",
  "{sn.jinTang}",
  "{sn.baoGuang}",
  "{sn.minRi}",
  "{sn.linRi}",
  "{sn.tianMa}",
  "{sn.jingAn}",
  "{sn.puHu}",
  "{sn.yiMa}",
  "{sn.tianHou}",
  "{sn.yangDe}",
  "{sn.tianXi}",
  "{sn.tianYi}",
  "{sn.siMing}",
  "{sn.shengXin}",
  "{sn.yuYu}",
  "{sn.shouRi}",
  "{sn.shiDe}",
  "{sn.jieShen}",
  "{sn.shiYang}",
  "{sn.tianCang}",
  "{sn.tianWu}",
  "{sn.yuTang}",
  "{sn.fuSheng}",
  "{sn.tianDe}",
  "{sn.tianDeHe}",
  "{sn.tianYuan}",
  "{sn.tianShe}",
  "{sn.tianFu}",
  "{sn.yinShen}",
  "{sn.jieChu}",
  "{sn.wuXu}",
  "{sn.wuLi}",
  "{sn.chongRi}",
  "{sn.fuRi}",
  "{sn.xueZhi}",
  "{sn.tianZei}",
  "{sn.tuFu}",
  "{sn.youHuo}",
  "{sn.baiHu}",
  "{sn.xiaoHao}",
  "{sn.zhiSi}",
  "{sn.heKui}",
  "{sn.jieSha}",
  "{sn.yueSha}",
  "{sn.yueJian}",
  "{sn.wangWang}",
  "{sn.daShi}",
  "{sn.daBai}",
  "{sn.xianChi}",
  "{sn.yanDui}",
  "{sn.zhaoYao}",
  "{sn.jiuKan}",
  "{sn.jiuJiao}",
  "{sn.tianGang}",
  "{sn.siShen}",
  "{sn.yueHai}",
  "{sn.siQi}",
  "{sn.yuePo}",
  "{sn.daHao}",
  "{sn.tianLao}",
  "{sn.yuanWu}",
  "{sn.yueYan}",
  "{sn.yueXu}",
  "{sn.guiJi}",
  "{sn.xiaoShi}",
  "{sn.tianXing}",
  "{sn.zhuQue}",
  "{sn.jiuKong}",
  "{sn.tianLi}",
  "{sn.diHuo}",
  "{sn.fourHit}",
  "{sn.daSha}",
  "{sn.gouChen}",
  "{sn.baZhuan}",
  "{sn.zaiSha}",
  "{sn.tianHuo}",
  "{sn.xueJi}",
  "{sn.tuHu}",
  "{sn.yueXing}",
  "{sn.chuShuiLong}",
  "{sn.diNang}",
  "{sn.baFeng}",
  "{sn.siFei}",
  "{sn.siJi}",
  "{sn.siQiong}",
  "{sn.wuMu}",
  "{sn.yinCuo}",
  "{sn.siHao}",
  "{sn.yangCuo}",
  "{sn.guChen}",
  "{sn.xiaoHui}",
  "{sn.daHui}",
  "{sn.baLong}",
  "{sn.qiNiao}",
  "{sn.jiuHu}",
  "{sn.liuShe}",
  "{sn.tianGou}",
  "{sn.xingHen}",
  "{sn.liaoLi}",
  "{sn.suiBo}",
  "{sn.zhuZhen}",
  "{sn.sanSang}",
  "{sn.sanYin}",
  "{sn.yinDaoChongYang}",
  "{sn.yinWei}",
  "{sn.yinYangJiaoPo}",
  "{sn.yinYangJuCuo}",
  "{sn.yinYangJiChong}",
  "{sn.guiKu}",
  "{sn.danYin}",
  "{sn.jueYin}",
  "{sn.chunYang}",
  "{sn.yangCuoYinChong}",
  "{sn.qiFu}",
  "{sn.chengRi}",
  "{sn.guYang}",
  "{sn.jueYang}",
  "{sn.chunYin}",
  "{sn.daTui}",
  "{sn.siLi}",
  "{sn.yangPoYinChong}"
];
LunarUtil.DAY_SHEN_SHA = [
  ";000002300F14156869717A3F;01001617495C40413C425D6A;0209000C041831031906054A5E6B4B5F;033500041A1B032C06054C4D4E60;04002D321C1D1E104F50615152;05111F53546C55433C3E;062E200721220D01566E44;070B2333242F45;08360A2526242F080157583D59;091234080162463C3D5A;0A270728292A5B6364653F79;0B0237130E2B4748727A3E66;0C09020C04300F0314150568696D;0D3504031617495C40413C6F425D6A;0E38183119064A5E6B4B5F;0F001A1B032C064C4D4E60;10002D321C1D1E104F50615152;110B00111F53546C55433C3E;12360A002E200721220D015644;13002333456D;142526242F080157583F3D59;15001234080162463C3D5A;16090004270728292A5B636465;17350204130E032B47483E66;1802300F14156869;19031617495C40413C425D6A;1A1831031906054A5E6B4B5F;1B0B1A1B032C06054C4D4E;1C360A2D321C1D1E104F50615152;1D111F53546C55433C3E;1E2E200721220D01563F44;1F23334573;20090C042526242F080157583D;2135041234080162463C3D5A;22270728292A5B636465;2302130E032B47483E66;2402300F0314150568696E;250B031617495C40413C425D6A;26360A18311906054A5E6B4B5F;271A1B2C06054C4D4E60;282D321C1D1E104F506151523F;29111F53546C55433C3E;2A090C042E200721220D015644;2B350423334567;2C2526242F0857583D59;2D001234080162463C3D5A;2E00270728292A5B63646574;2F0B0002130E032B47483E66;30360A0002300F141505686975;31001617495C40413C425D6A676D;3218311906054A5E6B4B3F675F76;331A1B2C06054C4D4E60;34090C042D321C1D1E104F50615152;353504111F53546C55433C6F3E;362E200721220D5644;3723334567;382526242F08015758703D6759;390B123408016246703C3D5A84;3A360A270728292A5B636465;3B02130E2B47483E66;",
  ";00090002272A536C4C4D4E41717A;0100300F3103233C6151523F66;020004180E032406150543405D;03000C041A1D340617054A5E6B4F50;04002D1B555F;050B112526321C2B3C42654B3E60;060A2E2014100547546246;0712070D161F566A;0822192F0148453D44;092C083301575868695B633C3D;0A0937131E495C6459;0B020721282903727A3F3E5A;0C020427032A05536C4C4D4E416D;0D0C04300F03233C6F61515266;0E38180E24061543405D;0F0B001A1D3406174A5E6B4F5078;100A002D1B555F;1100112526321C2B3C42654B3E60;12002E2014100147546246;130012070D161F566A6D;140922192F080148453D44;152C083301575868695B633C3F3D44;160413031E495C6459;17020C0407212829033E5A;1802272A536C4C4D4E41;190B300F3103233C61515266;1A0A180E032406150543405D;1B1A1D340617014A5E6B4F50;1C2D1B555F;1D112526321C2B3C42654B3E60;1E092E2014100147546246;1F12070D161F56736E6A3F;200422192F080148453D44;210C042C083301575868695B633C3D;22131E495C6459;230B0207212829033E5A;240A0227032A05536C4C4D4E41;25300F31233C61515266;26180E2406150543405D;271A1D340617054A5E6B4F50;28092D1B555F;29112526321C2B3C42654B3F3E60;2A042E2014100147546246;2B0C0412070D161F566A67;2C22192F0848453D44;2D0B002C083301575868695B633C3D85;2E0A0013031E495C6459;2F0002072128293E5A;300002272A05536C4C4D4E4175;3100300F31233C6151526E676D66;3209180E2406150543405D;331A1D340617054A5E6B4F503F76;34042D1B555F;350C04112526321C2B3C6F42654B3E60;362E20141047546246;370B12070D161F566A67;380A22192F08014845703D6744;392C083301575868695B63703C3D74;3A131E495C6459;3B02072128293E5A;",
  ";00000207282931032B717A6E5D59;01000314473C5A;020A000427182526300F1D16062A054F506A;03360B00041A1906055562464066;04002D2C154A5E6B6C733F788B;0512111B0E1E17483C3E;060C2E20321C016869655F;0753544960;08350907210D230810015B63564B3D77;091324081F014C4D4E453C423D;0A2203342F57586461515244;0B02032C4341727A3E;0C0A020407282931032B055D6D59;0D360B040314473C6F5A;0E3827182526300F1D16062A4F506A3F;0F001A19065562464066;10000C2D2C154A5E6B6C86;110012111B0E1E17483C3E;123509002E20321C0168696E655F;13005354495C6D60;1407210D230810015B63564B3D7F;1537130324081F014C4D4E453C423D;160A042203342F57586461515244;17360B0204033343413E;1802072829312B5D3F59;190314473C5A;1A0C27182526300F1D16062A054F506A;1B1A1906055562464066;1C35092D2C154A5E6B6C;1D12111B0E1E17483C3E;1E2E20321C016869655F;1F5354495C60;200A0407210D230810015B63564B3D80;21360B04130324081F014C4D4E453C423D;2222342F5758646151523F44;2302033343413E;24020C072829312B055D59;2514473C5A;26120927182526300F1D16062A054F506A;271A1906055562464066;282D2C154A5E6B6C76;2912111B0E1E17483C3E;2A0A042E20321C016869655F;2B360B045354495C6760;2C07210D2308105B63564B3F3D77;2D00130324081F014C4D4E453C423D;2E000C22342F57586461515244;2F00023343413E;3035090002072829312B05755D59;310014473C676D5A;3227182526300F1D16062A054F506A67;331A1906055562464066;340A042D2C154A5E6B6C;35360B0412111B0E1E17483C6F3E;362E20321C6869653F5F;375354495C6760;380C07210D230810015B6356704B3D677774;391324081F014C4D4E45703C423D;3A350922342F57586461515244;3B023343413E;",
  ";000A00220362463C44;010B00072128291D334F50645D;02360002230605534855423F59;03000212300F24060568695A;0400042E27342A495C403C8C;050C04184A5E6B3E66788D76;06091A1B2B15014C4D4E;07352D321C14175B636151526577;0811130E16080147546C433C6A3D5F;0920070D190801563D60;0A0A032C2F104541;0B0B252631031E1F57584B3E;0C362203056246717B3C3F6D44;0D072128291D334F50645D;0E020423065348554259;0F00020C0412300F240668696E5A;1009002E12342A495C403C;113500184A5E6B3E66;12001A1B2B15014C4D4E;13002D321C14175B63615152656D77;140A11130E0316080147546C433C6F6A3D5F;150B20070D03190801563D60;1636032C2F104541733F;17252631031E1F5758727B4B3E;1804220362463C44;190C04072128291D334F50645D;1A09022306055348554259;1B3502120D0F24060568695A;1C2E27342A495C403C;1D184A5E6B3E66;1E0A381A1B2B15014C4D4E;1F0B2D321C14175B63615152657F;20363711130E0316080147546C433C6A3F3D5F;2120070D03190801563D60;2204032C2F104541;230C042526311E1F57584B3E;2409220562463C44;2535072128291D334F50645D;26022306055348554259;270212300F24060568695A;280A2E27342A495C403C6F;290B184A5E6B3E66;2A361A1B2B15014C4D4E3F81;2B2D321C14175B6361515265678074;2C0411130E03160847546C433C6A3D5F;2D000C0420070D190801566E3D60;2E09002C2F104541;2F35002526311E1F57584B3E;300022056246703C44;3100072128291D334F50645D676D;320A02230605534855426759;330B02120D0F2406056869755A;34362E27342A495C403C3F;35184A5E6B3E6676;36041A1B2B154C4D4E81;370C042D321C14175B6361515265677774;380911130E16080147546C433C6A3D675F;393520070D190801563D60;3A2C2F104541;3B2526311E1F5758704B3E87;",
  ";00001D2F10575868694F503C;0100122B1F495C5564;0209000207222829140605655D44;03000216063305474C4D4E51526A4B3F;04000C042E300F193C6159;0504182C43403E5A;06271A1E2A014A5E6B6C5B6342;070B2D1B1366;080A112526321C0815013C3D;0920032308170153546246413D;0A07210D310324565F;0B0E033448453E60;0C091D2F1005575868694F50717B3C6D;0D122B1F495C553F;0E020C04072228291406655D44;0F000204160633474C4D4E51526A4B;10002E300F193C6159;110B00182C43403E5A;120A00271A1E2A014A5E6B6C5B6342;13002D1B13036D66;14112526321C030815013C6F3D;1520032308170153546246413D;160907210D31032456735F;170E344845727B3F3E60;180C041D2F10575868694F503C;1904122B1F495C5564;1A0207222829140605655D44;1B0B0216063305474C4D4E51526A4B;1C0A2E300F193C6159;1D182C43403E5A;1E38271A1E2A014A5E6B6C5B6342;1F2D1B130366;2009112526321C030815013C3D;21202308170153546246413F3D;220C0407210D3103565F;23040E3448453E60;241D2F1005575868694F503C;250B122B1F495C5564;260A0207222829140605655D44;270216063305474C4D4E51526A4B;282E300F193C6F616E59;29182C43403E5A;2A09271A1E2A014A5E6B6C5B63427988;2B372D1B133F6766;2C0C04112526321C0308153C3D;2D0004202308170153546246413D;2E0007210D3124565F;2F0B000E3448453E60;300A001D2F1005575868694F50703C89;3100122B1F495C5564676D;320207222829140605655D6744;330216063305474C4D4E7551526A4B;34092E300F193C6159;35182C43403F3E5A;360904271A1E2A4A5E6B6C5B634278;37042D1B136766;38112526321C0815013C3D67;390B202308170153546246413D;3A0A07210D3124566E5F;3B0E03344845703E60;",
  ";003509001E2F554C4D4E453C51525D5F;010057586C646160;0200020E06100543;0300020721282923061F0565;0400042E2224533C7344;05360B04182526300F34335B633F3E74;060A1A13016246404B59;070C2D2B4A5E6B5A;0827111B0314082A0148413C3D;0920321C310316080148413C3D;0A35090319154754495C42;0B12070D1D2C174F50563E;0C1E2F05554C4D4E45717B3C51525D6D5F;0D57586C646160;0E02040E061043;0F360B0002040721282923061F653F;100A002E2224533C44;11000C182526300F34335B633E;12001A1303016246404B59;13002D032B4A5E6B6D5A;14350927111B0314082A0148413C6F3D;1520321C310316080168696A3D66;1619154754495C426E;1712070D1D2C174F5056727B3E;18041E2F554C4D4E453C51525D5F;19360B0457586C64613F60;1A0A020E06100543;1B020C0721282923061F0565;1C2E2224533C44;1D182526300F34335B633E;1E3509381A1303016246404B59;1F2D032B4A5E6B5A;2027111B14082A0148413C3D;2120321C3116080168696A3D66;22040319154754495C42;23360B0412070D1D2C174F50563F3E;240A1E2F05554C4D4E453C51525D5F;250C57586C646160;26020E06100543;27020721282923061F0565;2835092E2224533C6F44;29182526300F34335B633E;2A1A13016246404B5982;2B2D2B4A5E6B675A76;2C0427111B0314082A48413C3D;2D360B000420321C3116080168696A3F3D66;2E0A0019154754495C42;2F000C12070D1D2C174F50563E;30001E2F05554C4D4E45703C51525D5F;310057586C6461676D608E;323509020E0610054367;33020721282923061F057565;342E2224533C6E44;35182526300F34335B633E7974;3637041A13036246404B5982;37360B042D2B4A5E6B3F675A76;380A27111B14082A0148413C3D67;390C20321C3116080168696A3D66;3A0319154754495C42;3B12070D1D2C174F5056703E;",
  ";0000302007210D341556;01000217455D;020A0025262B2F060557586C5F;030B001406056246603C8F;0436000207282916105B6364656A;0537130E191F47483E;0622300F2C0168693F44;07021E33495C40413C;08090C04184A5E423D59;093504121A1B0308014C4D4E51524B3D5A;0A02272D321C1D232A4F507E61;0B1124535455433E66;0C0A2E2007210D341505566D;0D0B0217455D;0E3625262B2F0657586C;0F00140662463C4260;10000207282916105B6364656A3F79;1100130E191F47483E;1209350C0422300F032C01686944;1335000204031E33495C40413C6D;1418310308014A5E6B3D59;15121A1B0308014C4D4E51524B3D5A;160A02272D321C1D232A4F507E61;170B1124535455433C6F6E3E66;18362E2007210D341556;190217455D;1A25262B060557586C3F5F;1B14060562463C4260;1C09020C0407282916105B6364656A;1D3504130E03191F47483E;1E22300F032C01686944;1F02031E495C40413C;200A183108014A5E6B3D59;210B121A1B08014C4D4E51524B3D5A;223602272D321C1D232A4F507E61;231124535455433C3E66;242E2007210D34150556717C3F;25021745735D;26090C0425262B2F060557586C5F;27350414060562463C4260;280207282916105B6364656A74;29130E03191F47483E;2A0A22300F2C01686944;2B0B021E33495C40413C6F67;2C36381831034A5E6B3D59;2D00121A1B08014C4D4E51524B3D5A;2E0002272D321C1D232A4F507E613F;2F00112453545543727C3C3E66;3009000C042E2007210D34150556;313500020417455D676D;3225262B2F060557586C70675F;331406056246703C426084;340A0207282916105B6364656A;350B130E191F47486E3E;363622300F032C7544;37021E33495C40413C67;38183108014A5E6B3F3D675976;39121A1B08014C4D4E51524B3D5A;3A09020C04272D321C1D232A4F507E61;3B35041124535455433C3E66;",
  ";000A002E27202C2A475462464B;010B0002070D1E5666;02002F06150548456E5D;0300061705575868695B633C;040002130323495C645F;0507212829249060;0609341001534C4D4E415152;070212300F31031F3C61423F;080418220E032B080143403D44;090C041A1D14080833014A5E6B6C4F503D;0A0A022D1B16556A59;0B0B112526321C193C653E5A;0C2E27202C2A05475462464B6D;0D02070D1E5666;0E2F061548455D;0F000617575868695B633C85;10090002371323495C645F;11000721282903243F3E60;12000403341001534C4D4E415152;1300020C0412300F31031F3C61426D;140A18220E032B080143403D44;150B1A1D140833014A5E6B6C4F503D;16022D1B16556A59;17112526321C193C6F653E5A;182E27202C2A475462464B;1902070D1E5666;1A092F06150548455D;1B061705575868695B633C3F79;1C0204130323495C645F;1D0C040721282903243E60;1E0A03341001534C4D4E415152;1F0B0227300F311F3C6142;2018220E2B080143406E3D44;211A1D140833014A5E6B6C4F503D;22022D1B16556A59;23112526321C193C653E5A;24092E27202C2A0547546246717C4B;2502070D1E56733F66;26042F06150548455D;270C04061705575868695B633C;280A02130323495C645F;290B07212829243E60;2A341001534C4D4E415152;2B0212300F311F3C6F614267;2C3818220E032B0843403D44;2D001A1D140833014A5E6B5B4F503D78;2E0900022D1B16556A59;2F00112526321C19727C3C653F3E5A;3000042E27202C2A05475462464B;3100020C04070D1E56676D66;320A2F0615054845705D67;330B061705575868695B63703C74;34021323495C645F;3507212829243E60;36033410534C4D4E41755152;370212300F311F3C614267;380918220E2B080143403D6744;391A1D140833014A5E6B6C4F503F3D76;3A02042D1B16556A59;3B0C04112526321C193C653E5A;",
  ";00002E20391C246869655D59;010002345354495C5A;023509002707210D062A055B6356515277;0300132B06054C4D4E453C66;04000203142F1557586473614B3F;0512161743416A3E;060C072829310319015F;07360B02032C476C3C6E60;080A04182526300F1D1E0810014F503D;09041A081F01556246403D;0A022D224A5E6B4486;0B111B0E2333483C423E;0C35092E20321C24056869655D6D59;0D02345354495C5A;0E2707210D062A5B635651523F77;0F00132B064C4D4E453C66;1000020C03142F15575864614B;11360B001203161743416A3E;120A0004072829310319015F;13000204032C476C3C6D60;14182526300F1D1E0810014F503D;151A081F01556246403D;163509022D224A5E6B44;17111B0E2333483C6F423E;182E20321C246869655D3F59;1902345354495C5A;1A0C2707210D062A055B635651527F;1B360B3713032B06054C4D4E453C66;1C0A020403142F15575864614B;1D041203161743416A3E;1E0728293119015F;1F022C476C3C60;203509182526300F1D1E08104F503D;211A081F01556246403D;22022D224A5E6B3F447891;23111B0E2333483C423E;240C2E20321C24056869717C655D59;25360B021C5354495C6E5A;260A042707210D062A055B6356515280;270413032B06054C4D4E453C66;2802142F15575864614B;2912161743416A3E;2A35090728293119015F;2B022C476C3C6F6760;2C38182526300F1D1E08104F503F3D;2D001A081F01556246403D;2E0002092D224A5E6B4476;2F360B00111B0E233348727C3C423E;300A00042E20321C24056869655D59;31000204345354495C676D5A;322707210D062A055B6356705152677774;33132B06054C4D4E45703C66;34350902142F15575864614B;3512161743416A3E;36072829310319753F5F;37022C476C3C6760;380C182526300F1D1E0810014F503D67;39360B1A081F01556246403D;3A0A02042D224A5E6B44;3B04111B0E2333483C423E;",
  ";00090038041A221B194C4D4E44;0135000C042D321C2C335B6361655D77;02002E11130E1E06054754433C59;03001220070D0605565A;0400272F2A454142;050B252631032357583E66;06360A0324150162463C;07072128291D34174F50644B;080208015348553F3D5F;0902300F2B080168693D60;0A09041410495C403C6F;0B35090418161F4A5E6B6C5152403E;0C1A221B19054C4D4E6D44;0D2D321C2C335B6361655D77;0E2E11130E1E064754433C6E59;0F0B351220070D0306565A;10360A0027032F2A454142;1100252631032357583E66;12000324150162463C3F;1300072128291D34174F50644B6D;1409020408015348553D5F;1535020C04300F2B080168693D60;161410495C403C;1718161F4A5E6B6C51526A3E;181A221B194C4D4E4481;190B0A2E11130E031E06054754433C59;1A360A2E11130E031E06054754433C59;1B1220070D030605565A;1C27032F2A454173423F;1D252631032357583E66;1E090424150162463C;1F350C04072128291D34174F50644B;200208015348553D5F;2102300F2B080168693D60;221410495C403C92;230B18161F4A5E6B6C51526A3E7893;24360A1A221B19054C4D4E44;252D321C2C335B6361655D7F;26372E11130E031E06054754433C3F59;271220070D030605565A;280904272F2A454142;29350C042526312357583E66;2A2415016246703C;2B072128291D34174F50644B67;2C02085348556E3D5F;2D090002300F2B080168693D60;2E360A001410495C403C;2F0018161F4A5E6B6C51526A3E;30001A221B19054C4D4E717D3F4481;31002D321C2C335B6361655D676D8074;3209042E11130E1E06054754433C6F6759;33350C042720070D0605565A;34272F2A454142;35252631235758703E6687;36241562463C;370B072128291D34174F50644B67;38360A023A015348553D675F;3902300F2B08016869753D60;3A1410495C403C3F;3B18161F4A5E6B6C727D51526A3E76;",
  ";0000380C041A23104A5E6B5B63;010004122D1B13241F838A;020A002E11252622321C3406053C5D44;030B00200306330553544641;040007210D312B5659;050E031448453E5A;060E1D162F2A01575868694F503C6A;0719495C556466;0809020728292C081501515242653D;09021E081701474C4D4E3F3D;0A0C04300F3C6F614B5F;0B041843403E60;0C0A1A2310054A5E6B5B636D;0D0B122D1B1303241F838A94;0E2E11252622321C34063C5D44;0F002003063353546C624641;100007210D31032B5659;11000E031448453E5A;120900271D162F2A01575868694F503C6A;130019495C55643F6D66;14020C040728292C081501515242653D;1502041E081701474C4D4E3D;160A300F3C614B5F;170B1843403E60;181A23104A456B5B6378;19122D1B1303241F9583;1A2E11252622321C033406053C5D44;1B200306330553546C6246416E;1C0907210D31032B567359;1D0E1448453F3E5A;1E0C04271D163B2A01575868694F503C6A;1F0419495C556466;200A020728292C081501515242653D;210B021E081701474C4D4E3D;22300F3C614B5F;231843403E60;241A2310054A5E425B63;25122D1B1303241F;26092E11252622321C033406053C5D44;272006330553546C6246413F;280C0407210D312B5659;29040E1448453E5A;2A0A271D162F2A01575868694F50703C6A89;2B0B19495C55646766;2C020728292C0815515242653D;2D00021E081701474C4D4E3D;2E00300F3C614B5F;2F001843403E60;3009001A2310054A5E6B5B63717D7988;310037122D1B13241F3F676D;320C042E11252622321C3406053C6F5D6744;33042006330553546C624641;340A07210D312B5659;350B0E03144845703E5A;36271D162F2A575868694F503C6A;3719495C55646766;38020728292C081501515242653D67;39021E081701474C4D4E756E3D;3A09300F3C614B5F;3B184340727D3F3E60;",
  ";000A003837041A1316624640425D6A5F;01360B00042D194A5E6B4B60;020009111B032C06100548413C;030020321C310310061F056869;0400224754495C7344;05070D1D334F505651523F3E;063509232F01554C4D4E453C59;070C24575864615A;0802270E34082A01433D;09020721282908016E653D66;0A0A042B15536C3C6F;0B360B0412182526300F14175B633E;0C1A13031605624640425D6A6D5F;0D2D03194A5E6B4B60;0E2E111B33061048413C;0F0020321C31031E061F68693F;1035090022034754495C44;11000C070D1D334F505651523E;1200232F01554C4D4E453C59;130024575864616D5A;140A0204270E0F082A01433D;15360B0204072128290801653D66;162B15536C3C;17121825260D0F14175B633E;181A1316624640425D6A5F82;192D03194A5E6B4B3F60;1A35092E111B032C061048413C;1B0C20321C31031E061F056869;1C224754495C44;1D07121D334F505651523E;1E0A04232F01554C4D4E453C59;1F360B0424575864615A;2002270E34082A01433D;2102072128290801653D66;222B15536C3C;2312182526300F14175B633F3E;2435091A13031605624640425D6A5F;250C2D03194A5E6B4B60;262E111B2C06100548413C;2720321C311E061F056869;280A04224746495C44;29360B04070D1D334F505651523E;2A232F01554C4D4E45703C59;2B2457586461675A96;2C02270E34082A433D;2D0002072128290801653F3D66;2E3509002B15536C3C;2F000C12182526300F14175B633E;30001A1316624640717D425D6A5F82;31002D194A5E6B4B676D6076;320A042E111B2C06100548413C6F67;33360B0420321C311E061F0568696E;3422034754495C44;35070D1D334F50567051523E;36232F554C4D4E453C59;3724575864613F675A;38350902270E34082A01433D67;39020C07212829080175653D66;3A2B15536C3C;3B12182526300F14175B63727D3E7974;"
];
var Holiday = class _Holiday {
  constructor(day, name, work, target) {
    this._day = _Holiday._ymd(day);
    this._name = name;
    this._work = work;
    this._target = _Holiday._ymd(target);
  }
  static _ymd(s) {
    return s.indexOf("-") < 0 ? s.substring(0, 4) + "-" + s.substring(4, 6) + "-" + s.substring(6) : s;
  }
  getDay() {
    return this._day;
  }
  setDay(value) {
    this._day = _Holiday._ymd(value);
  }
  getName() {
    return this._name;
  }
  setName(value) {
    this._name = value;
  }
  isWork() {
    return this._work;
  }
  setWork(value) {
    this._work = value;
  }
  getTarget() {
    return this._target;
  }
  setTarget(value) {
    this._target = _Holiday._ymd(value);
  }
  toString() {
    return this._day + " " + this._name + (this._work ? "\u8C03\u4F11" : "") + " " + this._target;
  }
};
var _HolidayUtil = class {
  static _padding(n) {
    return (n < 10 ? "0" : "") + n;
  }
  static _findForward(key) {
    const start = _HolidayUtil._DATA_IN_USE.indexOf(key);
    if (start < 0) {
      return null;
    }
    let right = _HolidayUtil._DATA_IN_USE.substring(start);
    const n = right.length % _HolidayUtil._SIZE;
    if (n > 0) {
      right = right.substring(n);
    }
    while (0 !== right.indexOf(key) && right.length >= _HolidayUtil._SIZE) {
      right = right.substring(_HolidayUtil._SIZE);
    }
    return right;
  }
  static _findBackward(key) {
    const start = _HolidayUtil._DATA_IN_USE.lastIndexOf(key);
    if (start < 0) {
      return null;
    }
    const keySize = key.length;
    let left = _HolidayUtil._DATA_IN_USE.substring(0, start + keySize);
    let size = left.length;
    const n = size % _HolidayUtil._SIZE;
    if (n > 0) {
      left = left.substring(0, size - n);
    }
    size = left.length;
    while (size - keySize !== left.lastIndexOf(key) && size >= _HolidayUtil._SIZE) {
      left = left.substring(0, size - _HolidayUtil._SIZE);
      size = left.length;
    }
    return left;
  }
  static _buildHolidayForward(s) {
    const day = s.substring(0, 8);
    const name = _HolidayUtil._NAMES_IN_USE[s.charCodeAt(8) - _HolidayUtil._ZERO];
    const work = s.charCodeAt(9) === _HolidayUtil._ZERO;
    const target = s.substring(10, 18);
    return new Holiday(day, name, work, target);
  }
  static _buildHolidayBackward(s) {
    const size = s.length;
    const day = s.substring(size - 18, size - 10);
    const name = _HolidayUtil._NAMES_IN_USE[s.charCodeAt(size - 10) - _HolidayUtil._ZERO];
    const work = s.charCodeAt(size - 9) === _HolidayUtil._ZERO;
    const target = s.substring(size - 8);
    return new Holiday(day, name, work, target);
  }
  static _findHolidaysForward(key) {
    const l = [];
    let s = _HolidayUtil._findForward(key);
    if (null == s) {
      return l;
    }
    while (0 === s.indexOf(key)) {
      l.push(_HolidayUtil._buildHolidayForward(s));
      s = s.substring(_HolidayUtil._SIZE);
    }
    return l;
  }
  static _findHolidaysBackward(key) {
    const l = [];
    let s = _HolidayUtil._findBackward(key);
    if (null == s) {
      return l;
    }
    let size = s.length;
    const keySize = key.length;
    while (size - keySize === s.lastIndexOf(key)) {
      l.push(_HolidayUtil._buildHolidayBackward(s));
      s = s.substring(0, size - _HolidayUtil._SIZE);
      size = s.length;
    }
    l.reverse();
    return l;
  }
  static getHoliday(yearOrYmd, month = 0, day = 0) {
    const l = month == 0 || day == 0 ? _HolidayUtil._findHolidaysForward((yearOrYmd + "").replace(/-/g, "")) : _HolidayUtil._findHolidaysForward(yearOrYmd + _HolidayUtil._padding(month) + _HolidayUtil._padding(day));
    return l.length < 1 ? null : l[0];
  }
  static getHolidays(yearOrYmd, month = 0) {
    if (month == 0) {
      return _HolidayUtil._findHolidaysForward((yearOrYmd + "").replace(/-/g, ""));
    }
    return _HolidayUtil._findHolidaysForward(yearOrYmd + _HolidayUtil._padding(month));
  }
  static getHolidaysByTarget(yearOrYmd, month = 0) {
    if (month == 0) {
      return _HolidayUtil._findHolidaysBackward((yearOrYmd + "").replace(/-/g, ""));
    }
    return _HolidayUtil._findHolidaysBackward(yearOrYmd + _HolidayUtil._padding(month));
  }
  static _fixNames(names) {
    if (names) {
      _HolidayUtil._NAMES_IN_USE = names;
    }
  }
  static _fixData(data) {
    if (!data) {
      return;
    }
    const append = [];
    while (data.length >= _HolidayUtil._SIZE) {
      const segment = data.substring(0, _HolidayUtil._SIZE);
      const day = segment.substring(0, 8);
      const remove = _HolidayUtil._TAG_REMOVE == segment.substring(8, 9);
      const holiday = _HolidayUtil.getHoliday(day);
      if (!holiday) {
        if (!remove) {
          append.push(segment);
        }
      } else {
        let nameIndex = -1;
        for (let i = 0, j = _HolidayUtil._NAMES_IN_USE.length; i < j; i++) {
          if (_HolidayUtil._NAMES_IN_USE[i] === holiday.getName()) {
            nameIndex = i;
            break;
          }
        }
        if (nameIndex > -1) {
          const old = day + String.fromCharCode(nameIndex + _HolidayUtil._ZERO) + (holiday.isWork() ? "0" : "1") + holiday.getTarget().replace(/-/g, "");
          _HolidayUtil._DATA_IN_USE = _HolidayUtil._DATA_IN_USE.replace(new RegExp(old, "g"), remove ? "" : segment);
        }
      }
      data = data.substring(_HolidayUtil._SIZE);
    }
    if (append.length > 0) {
      _HolidayUtil._DATA_IN_USE += append.join("");
    }
  }
  static fix(a, b) {
    if (!b) {
      if (Array.isArray(a)) {
        _HolidayUtil._fixNames(a);
      } else {
        _HolidayUtil._fixData(a);
      }
    } else {
      if (Array.isArray(a)) {
        _HolidayUtil._fixNames(a);
      }
      _HolidayUtil._fixData(b);
    }
  }
};
var HolidayUtil = _HolidayUtil;
HolidayUtil.NAMES = ["\u5143\u65E6\u8282", "\u6625\u8282", "\u6E05\u660E\u8282", "\u52B3\u52A8\u8282", "\u7AEF\u5348\u8282", "\u4E2D\u79CB\u8282", "\u56FD\u5E86\u8282", "\u56FD\u5E86\u4E2D\u79CB", "\u6297\u6218\u80DC\u5229\u65E5"];
HolidayUtil.DATA = "200112290020020101200112300020020101200201010120020101200201020120020101200201030120020101200202091020020212200202101020020212200202121120020212200202131120020212200202141120020212200202151120020212200202161120020212200202171120020212200202181120020212200204273020020501200204283020020501200205013120020501200205023120020501200205033120020501200205043120020501200205053120020501200205063120020501200205073120020501200209286020021001200209296020021001200210016120021001200210026120021001200210036120021001200210046120021001200210056120021001200210066120021001200210076120021001200301010120030101200302011120030201200302021120030201200302031120030201200302041120030201200302051120030201200302061120030201200302071120030201200302081020030201200302091020030201200304263020030501200304273020030501200305013120030501200305023120030501200305033120030501200305043120030501200305053120030501200305063120030501200305073120030501200309276020031001200309286020031001200310016120031001200310026120031001200310036120031001200310046120031001200310056120031001200310066120031001200310076120031001200401010120040101200401171020040122200401181020040122200401221120040122200401231120040122200401241120040122200401251120040122200401261120040122200401271120040122200401281120040122200405013120040501200405023120040501200405033120040501200405043120040501200405053120040501200405063120040501200405073120040501200405083020040501200405093020040501200410016120041001200410026120041001200410036120041001200410046120041001200410056120041001200410066120041001200410076120041001200410096020041001200410106020041001200501010120050101200501020120050101200501030120050101200502051020050209200502061020050209200502091120050209200502101120050209200502111120050209200502121120050209200502131120050209200502141120050209200502151120050209200504303020050501200505013120050501200505023120050501200505033120050501200505043120050501200505053120050501200505063120050501200505073120050501200505083020050501200510016120051001200510026120051001200510036120051001200510046120051001200510056120051001200510066120051001200510076120051001200510086020051001200510096020051001200512310020060101200601010120060101200601020120060101200601030120060101200601281020060129200601291120060129200601301120060129200601311120060129200602011120060129200602021120060129200602031120060129200602041120060129200602051020060129200604293020060501200604303020060501200605013120060501200605023120060501200605033120060501200605043120060501200605053120060501200605063120060501200605073120060501200609306020061001200610016120061001200610026120061001200610036120061001200610046120061001200610056120061001200610066120061001200610076120061001200610086020061001200612300020070101200612310020070101200701010120070101200701020120070101200701030120070101200702171020070218200702181120070218200702191120070218200702201120070218200702211120070218200702221120070218200702231120070218200702241120070218200702251020070218200704283020070501200704293020070501200705013120070501200705023120070501200705033120070501200705043120070501200705053120070501200705063120070501200705073120070501200709296020071001200709306020071001200710016120071001200710026120071001200710036120071001200710046120071001200710056120071001200710066120071001200710076120071001200712290020080101200712300120080101200712310120080101200801010120080101200802021020080206200802031020080206200802061120080206200802071120080206200802081120080206200802091120080206200802101120080206200802111120080206200802121120080206200804042120080404200804052120080404200804062120080404200805013120080501200805023120080501200805033120080501200805043020080501200806074120080608200806084120080608200806094120080608200809135120080914200809145120080914200809155120080914200809276020081001200809286020081001200809296120081001200809306120081001200810016120081001200810026120081001200810036120081001200810046120081001200810056120081001200901010120090101200901020120090101200901030120090101200901040020090101200901241020090125200901251120090125200901261120090125200901271120090125200901281120090125200901291120090125200901301120090125200901311120090125200902011020090125200904042120090404200904052120090404200904062120090404200905013120090501200905023120090501200905033120090501200905284120090528200905294120090528200905304120090528200905314020090528200909276020091001200910016120091001200910026120091001200910036120091001200910046120091001200910055120091003200910065120091003200910075120091003200910085120091003200910105020091003201001010120100101201001020120100101201001030120100101201002131120100213201002141120100213201002151120100213201002161120100213201002171120100213201002181120100213201002191120100213201002201020100213201002211020100213201004032120100405201004042120100405201004052120100405201005013120100501201005023120100501201005033120100501201006124020100616201006134020100616201006144120100616201006154120100616201006164120100616201009195020100922201009225120100922201009235120100922201009245120100922201009255020100922201009266020101001201010016120101001201010026120101001201010036120101001201010046120101001201010056120101001201010066120101001201010076120101001201010096020101001201101010120110101201101020120110101201101030120110101201101301020110203201102021120110203201102031120110203201102041120110203201102051120110203201102061120110203201102071120110203201102081120110203201102121020110203201104022020110405201104032120110405201104042120110405201104052120110405201104303120110501201105013120110501201105023120110501201106044120110606201106054120110606201106064120110606201109105120110912201109115120110912201109125120110912201110016120111001201110026120111001201110036120111001201110046120111001201110056120111001201110066120111001201110076120111001201110086020111001201110096020111001201112310020120101201201010120120101201201020120120101201201030120120101201201211020120123201201221120120123201201231120120123201201241120120123201201251120120123201201261120120123201201271120120123201201281120120123201201291020120123201203312020120404201204012020120404201204022120120404201204032120120404201204042120120404201204283020120501201204293120120501201204303120120501201205013120120501201205023020120501201206224120120623201206234120120623201206244120120623201209295020120930201209305120120930201210016120121001201210026120121001201210036120121001201210046120121001201210056120121001201210066120121001201210076120121001201210086020121001201301010120130101201301020120130101201301030120130101201301050020130101201301060020130101201302091120130210201302101120130210201302111120130210201302121120130210201302131120130210201302141120130210201302151120130210201302161020130210201302171020130210201304042120130404201304052120130404201304062120130404201304273020130501201304283020130501201304293120130501201304303120130501201305013120130501201306084020130612201306094020130612201306104120130612201306114120130612201306124120130612201309195120130919201309205120130919201309215120130919201309225020130919201309296020131001201310016120131001201310026120131001201310036120131001201310046120131001201310056120131001201310066120131001201310076120131001201401010120140101201401261020140131201401311120140131201402011120140131201402021120140131201402031120140131201402041120140131201402051120140131201402061120140131201402081020140131201404052120140405201404062120140405201404072120140405201405013120140501201405023120140501201405033120140501201405043020140501201405314120140602201406014120140602201406024120140602201409065120140908201409075120140908201409085120140908201409286020141001201410016120141001201410026120141001201410036120141001201410046120141004201410056120141001201410066120141001201410076120141001201410116020141001201501010120150101201501020120150101201501030120150101201501040020150101201502151020150219201502181120150219201502191120150219201502201120150219201502211120150219201502221120150219201502231120150219201502241120150219201502281020150219201504042120150405201504052120150405201504062120150405201505013120150501201505023120150501201505033120150501201506204120150620201506214120150620201506224120150620201509038120150903201509048120150903201509058120150903201509068020150903201509265120150927201509275120150927201510016120151001201510026120151001201510036120151001201510046120151004201510056120151001201510066120151001201510076120151001201510106020151001201601010120160101201601020120160101201601030120160101201602061020160208201602071120160208201602081120160208201602091120160208201602101120160208201602111120160208201602121120160208201602131120160208201602141020160208201604022120160404201604032120160404201604042120160404201604303120160501201605013120160501201605023120160501201606094120160609201606104120160609201606114120160609201606124020160609201609155120160915201609165120160915201609175120160915201609185020160915201610016120161001201610026120161001201610036120161001201610046120161001201610056120161001201610066120161001201610076120161001201610086020161001201610096020161001201612310120170101201701010120170101201701020120170101201701221020170128201701271120170128201701281120170128201701291120170128201701301120170128201701311120170128201702011120170128201702021120170128201702041020170128201704012020170404201704022120170404201704032120170404201704042120170404201704293120170501201704303120170501201705013120170501201705274020170530201705284120170530201705294120170530201705304120170530201709306020171001201710016120171001201710026120171001201710036120171001201710045120171004201710056120171001201710066120171001201710076120171001201710086120171001201712300120180101201712310120180101201801010120180101201802111020180216201802151120180216201802161120180216201802171120180216201802181120180216201802191120180216201802201120180216201802211120180216201802241020180216201804052120180405201804062120180405201804072120180405201804082020180405201804283020180501201804293120180501201804303120180501201805013120180501201806164120180618201806174120180618201806184120180618201809225120180924201809235120180924201809245120180924201809296020181001201809306020181001201810016120181001201810026120181001201810036120181001201810046120181001201810056120181001201810066120181001201810076120181001201812290020190101201812300120190101201812310120190101201901010120190101201902021020190205201902031020190205201902041120190205201902051120190205201902061120190205201902071120190205201902081120190205201902091120190205201902101120190205201904052120190405201904062120190405201904072120190405201904283020190501201905013120190501201905023120190501201905033120190501201905043120190501201905053020190501201906074120190607201906084120190607201906094120190607201909135120190913201909145120190913201909155120190913201909296020191001201910016120191001201910026120191001201910036120191001201910046120191001201910056120191001201910066120191001201910076120191001201910126020191001202001010120200101202001191020200125202001241120200125202001251120200125202001261120200125202001271120200125202001281120200125202001291120200125202001301120200125202001311120200125202002011120200125202002021120200125202004042120200404202004052120200404202004062120200404202004263020200501202005013120200501202005023120200501202005033120200501202005043120200501202005053120200501202005093020200501202006254120200625202006264120200625202006274120200625202006284020200625202009277020201001202010017120201001202010026120201001202010036120201001202010046120201001202010056120201001202010066120201001202010076120201001202010086120201001202010106020201001202101010120210101202101020120210101202101030120210101202102071020210212202102111120210212202102121120210212202102131120210212202102141120210212202102151120210212202102161120210212202102171120210212202102201020210212202104032120210404202104042120210404202104052120210404202104253020210501202105013120210501202105023120210501202105033120210501202105043120210501202105053120210501202105083020210501202106124120210614202106134120210614202106144120210614202109185020210921202109195120210921202109205120210921202109215120210921202109266020211001202110016120211001202110026120211001202110036120211001202110046120211001202110056120211001202110066120211001202110076120211001202110096020211001202201010120220101202201020120220101202201030120220101202201291020220201202201301020220201202201311120220201202202011120220201202202021120220201202202031120220201202202041120220201202202051120220201202202061120220201202204022020220405202204032120220405202204042120220405202204052120220405202204243020220501202204303120220501202205013120220501202205023120220501202205033120220501202205043120220501202205073020220501202206034120220603202206044120220603202206054120220603202209105120220910202209115120220910202209125120220910202210016120221001202210026120221001202210036120221001202210046120221001202210056120221001202210066120221001202210076120221001202210086020221001202210096020221001202212310120230101202301010120230101202301020120230101202301211120230122202301221120230122202301231120230122202301241120230122202301251120230122202301261120230122202301271120230122202301281020230122202301291020230122202304052120230405202304233020230501202304293120230501202304303120230501202305013120230501202305023120230501202305033120230501202305063020230501202306224120230622202306234120230622202306244120230622202306254020230622202309295120230929202309306120231001202310016120231001202310026120231001202310036120231001202310046120231001202310056120231001202310066120231001202310076020231001202310086020231001202312300120240101202312310120240101202401010120240101202402041020240210202402101120240210202402111120240210202402121120240210202402131120240210202402141120240210202402151120240210202402161120240210202402171120240210202402181020240210202404042120240404202404052120240404202404062120240404202404072020240404202404283020240501202405013120240501202405023120240501202405033120240501202405043120240501202405053120240501202405113020240501202406084120240610202406094120240610202406104120240610202409145020240917202409155120240917202409165120240917202409175120240917202409296020241001202410016120241001202410026120241001202410036120241001202410046120241001202410056120241001202410066120241001202410076120241001202410126020241001202501010120250101202501261020250129202501281120250129202501291120250129202501301120250129202501311120250129202502011120250129202502021120250129202502031120250129202502041120250129202502081020250129202504042120250404202504052120250404202504062120250404202504273020250501202505013120250501202505023120250501202505033120250501202505043120250501202505053120250501202505314120250531202506014120250531202506024120250531202509287020251001202510017120251001202510027120251001202510037120251001202510047120251001202510057120251001202510067120251001202510077120251001202510087120251001202510117020251001202601010120260101202601020120260101202601030120260101202601040020260101202602141020260217202602151120260217202602161120260217202602171120260217202602181120260217202602191120260217202602201120260217202602211120260217202602221120260217202602231120260217202602281020260217202604042120260405202604052120260405202604062120260405202605013120260501202605023120260501202605033120260501202605043120260501202605053120260501202605093020260501202606194120260619202606204120260619202606214120260619202609206020261001202609255120260925202609265120260925202609275120260925202610016120261001202610026120261001202610036120261001202610046120261001202610056120261001202610066120261001202610076120261001202610106020261001";
HolidayUtil._SIZE = 18;
HolidayUtil._ZERO = "0".charCodeAt(0);
HolidayUtil._TAG_REMOVE = "~";
HolidayUtil._NAMES_IN_USE = _HolidayUtil.NAMES;
HolidayUtil._DATA_IN_USE = _HolidayUtil.DATA;
var JieQi = class {
  constructor(name, solar) {
    let jie = false, qi = false;
    for (let i = 0, j = LunarUtil.JIE_QI.length; i < j; i++) {
      if (LunarUtil.JIE_QI[i] === name) {
        if (i % 2 == 0) {
          qi = true;
        } else {
          jie = true;
        }
        break;
      }
    }
    this._name = name;
    this._solar = solar;
    this._jie = jie;
    this._qi = qi;
  }
  getName() {
    return this._name;
  }
  getSolar() {
    return this._solar;
  }
  setName(name) {
    this._name = name;
  }
  setSolar(solar) {
    this._solar = solar;
  }
  isJie() {
    return this._jie;
  }
  isQi() {
    return this._qi;
  }
  toString() {
    return this.getName();
  }
};
var LiuYue = class {
  constructor(liuNian, index) {
    this._liuNian = liuNian;
    this._index = index;
  }
  getIndex() {
    return this._index;
  }
  getMonthInChinese() {
    return LunarUtil.MONTH[this._index + 1];
  }
  getGanZhi() {
    const yearGanIndex = LunarUtil.find(this._liuNian.getGanZhi(), LunarUtil.GAN).index - 1;
    const offset = [2, 4, 6, 8, 0][yearGanIndex % 5];
    const gan = LunarUtil.GAN[(this._index + offset) % 10 + 1];
    const zhi = LunarUtil.ZHI[(this._index + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12 + 1];
    return gan + zhi;
  }
  getXun() {
    return LunarUtil.getXun(this.getGanZhi());
  }
  getXunKong() {
    return LunarUtil.getXunKong(this.getGanZhi());
  }
};
var TaoFestival = class {
  constructor(name, remark = "") {
    this._name = name;
    this._remark = remark;
  }
  getName() {
    return this._name;
  }
  getRemark() {
    return this._remark;
  }
  toString() {
    return this._name;
  }
  toFullString() {
    const l = [this._name];
    if (this._remark) {
      l.push("[" + this._remark + "]");
    }
    return l.join("");
  }
};
var TaoUtil = class {
};
TaoUtil.SAN_HUI = ["1-7", "7-7", "10-15"];
TaoUtil.SAN_YUAN = ["1-15", "7-15", "10-15"];
TaoUtil.WU_LA = ["1-1", "5-5", "7-7", "10-1", "12-8"];
TaoUtil.AN_WU = ["{dz.wei}", "{dz.xu}", "{dz.chen}", "{dz.yin}", "{dz.wu}", "{dz.zi}", "{dz.you}", "{dz.shen}", "{dz.si}", "{dz.hai}", "{dz.mao}", "{dz.chou}"];
TaoUtil.BA_HUI = {
  "{jz.bingWu}": "\u5929\u4F1A",
  "{jz.renWu}": "\u5730\u4F1A",
  "{jz.renZi}": "\u4EBA\u4F1A",
  "{jz.gengWu}": "\u65E5\u4F1A",
  "{jz.gengShen}": "\u6708\u4F1A",
  "{jz.xinYou}": "\u661F\u8FB0\u4F1A",
  "{jz.jiaChen}": "\u4E94\u884C\u4F1A",
  "{jz.jiaXu}": "\u56DB\u65F6\u4F1A"
};
TaoUtil.BA_JIE = {
  "{jq.liChun}": "\u4E1C\u5317\u65B9\u5EA6\u4ED9\u4E0A\u5723\u5929\u5C0A\u540C\u68B5\u7081\u59CB\u9752\u5929\u541B\u4E0B\u964D",
  "{jq.chunFen}": "\u4E1C\u65B9\u7389\u5B9D\u661F\u4E0A\u5929\u5C0A\u540C\u9752\u5E1D\u4E5D\u7081\u5929\u541B\u4E0B\u964D",
  "{jq.liXia}": "\u4E1C\u5357\u65B9\u597D\u751F\u5EA6\u547D\u5929\u5C0A\u540C\u68B5\u7081\u59CB\u4E39\u5929\u541B\u4E0B\u964D",
  "{jq.xiaZhi}": "\u5357\u65B9\u7384\u771F\u4E07\u798F\u5929\u5C0A\u540C\u8D64\u5E1D\u4E09\u7081\u5929\u541B\u4E0B\u964D",
  "{jq.liQiu}": "\u897F\u5357\u65B9\u592A\u7075\u865A\u7687\u5929\u5C0A\u540C\u68B5\u7081\u59CB\u7D20\u5929\u541B\u4E0B\u964D",
  "{jq.qiuFen}": "\u897F\u65B9\u592A\u5999\u81F3\u6781\u5929\u5C0A\u540C\u767D\u5E1D\u4E03\u7081\u5929\u541B\u4E0B\u964D",
  "{jq.liDong}": "\u897F\u5317\u65B9\u65E0\u91CF\u592A\u534E\u5929\u5C0A\u540C\u68B5\u7081\u59CB\u7384\u5929\u541B\u4E0B\u964D",
  "{jq.dongZhi}": "\u5317\u65B9\u7384\u4E0A\u7389\u5BB8\u5929\u5C0A\u540C\u9ED1\u5E1D\u4E94\u7081\u5929\u541B\u4E0B\u964D"
};
TaoUtil.FESTIVAL = {
  "1-1": [new TaoFestival("\u5929\u814A\u4E4B\u8FB0", "\u5929\u814A\uFF0C\u6B64\u65E5\u4E94\u5E1D\u4F1A\u4E8E\u4E1C\u65B9\u4E5D\u7081\u9752\u5929")],
  "1-3": [new TaoFestival("\u90DD\u771F\u4EBA\u5723\u8BDE"), new TaoFestival("\u5B59\u771F\u4EBA\u5723\u8BDE")],
  "1-5": [new TaoFestival("\u5B59\u7956\u6E05\u9759\u5143\u541B\u8BDE")],
  "1-7": [new TaoFestival("\u4E3E\u8FC1\u8D4F\u4F1A", "\u6B64\u65E5\u4E0A\u5143\u8D50\u798F\uFF0C\u5929\u5B98\u540C\u5730\u6C34\u4E8C\u5B98\u8003\u6821\u7F6A\u798F")],
  "1-9": [new TaoFestival("\u7389\u7687\u4E0A\u5E1D\u5723\u8BDE")],
  "1-13": [new TaoFestival("\u5173\u5723\u5E1D\u541B\u98DE\u5347")],
  "1-15": [new TaoFestival("\u4E0A\u5143\u5929\u5B98\u5723\u8BDE"), new TaoFestival("\u8001\u7956\u5929\u5E08\u5723\u8BDE")],
  "1-19": [new TaoFestival("\u957F\u6625\u90B1\u771F\u4EBA(\u90B1\u5904\u673A)\u5723\u8BDE")],
  "1-28": [new TaoFestival("\u8BB8\u771F\u541B(\u8BB8\u900A\u5929\u5E08)\u5723\u8BDE")],
  "2-1": [new TaoFestival("\u52FE\u9648\u5929\u7687\u5927\u5E1D\u5723\u8BDE"), new TaoFestival("\u957F\u6625\u5218\u771F\u4EBA(\u5218\u6E0A\u7136)\u5723\u8BDE")],
  "2-2": [new TaoFestival("\u571F\u5730\u6B63\u795E\u8BDE"), new TaoFestival("\u59DC\u592A\u516C\u5723\u8BDE")],
  "2-3": [new TaoFestival("\u6587\u660C\u6893\u6F7C\u5E1D\u541B\u5723\u8BDE")],
  "2-6": [new TaoFestival("\u4E1C\u534E\u5E1D\u541B\u5723\u8BDE")],
  "2-13": [new TaoFestival("\u5EA6\u4EBA\u65E0\u91CF\u845B\u771F\u541B\u5723\u8BDE")],
  "2-15": [new TaoFestival("\u592A\u6E05\u9053\u5FB7\u5929\u5C0A(\u592A\u4E0A\u8001\u541B)\u5723\u8BDE")],
  "2-19": [new TaoFestival("\u6148\u822A\u771F\u4EBA\u5723\u8BDE")],
  "3-1": [new TaoFestival("\u8C2D\u7956(\u8C2D\u5904\u7AEF)\u957F\u771F\u771F\u4EBA\u5723\u8BDE")],
  "3-3": [new TaoFestival("\u7384\u5929\u4E0A\u5E1D\u5723\u8BDE")],
  "3-6": [new TaoFestival("\u773C\u5149\u5A18\u5A18\u5723\u8BDE")],
  "3-15": [new TaoFestival("\u5929\u5E08\u5F20\u5927\u771F\u4EBA\u5723\u8BDE"), new TaoFestival("\u8D22\u795E\u8D75\u516C\u5143\u5E05\u5723\u8BDE")],
  "3-16": [new TaoFestival("\u4E09\u8305\u771F\u541B\u5F97\u9053\u4E4B\u8FB0"), new TaoFestival("\u4E2D\u5CB3\u5927\u5E1D\u5723\u8BDE")],
  "3-18": [new TaoFestival("\u738B\u7956(\u738B\u5904\u4E00)\u7389\u9633\u771F\u4EBA\u5723\u8BDE"), new TaoFestival("\u540E\u571F\u5A18\u5A18\u5723\u8BDE")],
  "3-19": [new TaoFestival("\u592A\u9633\u661F\u541B\u5723\u8BDE")],
  "3-20": [new TaoFestival("\u5B50\u5B59\u5A18\u5A18\u5723\u8BDE")],
  "3-23": [new TaoFestival("\u5929\u540E\u5988\u7956\u5723\u8BDE")],
  "3-26": [new TaoFestival("\u9B3C\u8C37\u5148\u5E08\u8BDE")],
  "3-28": [new TaoFestival("\u4E1C\u5CB3\u5927\u5E1D\u5723\u8BDE")],
  "4-1": [new TaoFestival("\u957F\u751F\u8C2D\u771F\u541B\u6210\u9053\u4E4B\u8FB0")],
  "4-10": [new TaoFestival("\u4F55\u4ED9\u59D1\u5723\u8BDE")],
  "4-14": [new TaoFestival("\u5415\u7956\u7EAF\u9633\u7956\u5E08\u5723\u8BDE")],
  "4-15": [new TaoFestival("\u949F\u79BB\u7956\u5E08\u5723\u8BDE")],
  "4-18": [new TaoFestival("\u5317\u6781\u7D2B\u5FAE\u5927\u5E1D\u5723\u8BDE"), new TaoFestival("\u6CF0\u5C71\u5723\u6BCD\u78A7\u971E\u5143\u541B\u8BDE"), new TaoFestival("\u534E\u4F57\u795E\u533B\u5148\u5E08\u8BDE")],
  "4-20": [new TaoFestival("\u773C\u5149\u5723\u6BCD\u5A18\u5A18\u8BDE")],
  "4-28": [new TaoFestival("\u795E\u519C\u5148\u5E1D\u8BDE")],
  "5-1": [new TaoFestival("\u5357\u6781\u957F\u751F\u5927\u5E1D\u5723\u8BDE")],
  "5-5": [new TaoFestival("\u5730\u814A\u4E4B\u8FB0", "\u5730\u814A\uFF0C\u6B64\u65E5\u4E94\u5E1D\u4F1A\u4E8E\u5357\u65B9\u4E09\u7081\u4E39\u5929"), new TaoFestival("\u5357\u65B9\u96F7\u7956\u5723\u8BDE"), new TaoFestival("\u5730\u7957\u6E29\u5143\u5E05\u5723\u8BDE"), new TaoFestival("\u96F7\u9706\u9093\u5929\u541B\u5723\u8BDE")],
  "5-11": [new TaoFestival("\u57CE\u968D\u7237\u5723\u8BDE")],
  "5-13": [new TaoFestival("\u5173\u5723\u5E1D\u541B\u964D\u795E"), new TaoFestival("\u5173\u5E73\u592A\u5B50\u5723\u8BDE")],
  "5-18": [new TaoFestival("\u5F20\u5929\u5E08\u5723\u8BDE")],
  "5-20": [new TaoFestival("\u9A6C\u7956\u4E39\u9633\u771F\u4EBA\u5723\u8BDE")],
  "5-29": [new TaoFestival("\u7D2B\u9752\u767D\u7956\u5E08\u5723\u8BDE")],
  "6-1": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-2": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-3": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-4": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-5": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-6": [new TaoFestival("\u5357\u6597\u661F\u541B\u4E0B\u964D")],
  "6-10": [new TaoFestival("\u5218\u6D77\u87FE\u7956\u5E08\u5723\u8BDE")],
  "6-15": [new TaoFestival("\u7075\u5B98\u738B\u5929\u541B\u5723\u8BDE")],
  "6-19": [new TaoFestival("\u6148\u822A(\u89C2\u97F3)\u6210\u9053\u65E5")],
  "6-23": [new TaoFestival("\u706B\u795E\u5723\u8BDE")],
  "6-24": [new TaoFestival("\u5357\u6781\u5927\u5E1D\u4E2D\u65B9\u96F7\u7956\u5723\u8BDE"), new TaoFestival("\u5173\u5723\u5E1D\u541B\u5723\u8BDE")],
  "6-26": [new TaoFestival("\u4E8C\u90CE\u771F\u541B\u5723\u8BDE")],
  "7-7": [new TaoFestival("\u9053\u5FB7\u814A\u4E4B\u8FB0", "\u9053\u5FB7\u814A\uFF0C\u6B64\u65E5\u4E94\u5E1D\u4F1A\u4E8E\u897F\u65B9\u4E03\u7081\u7D20\u5929"), new TaoFestival("\u5E86\u751F\u4E2D\u4F1A", "\u6B64\u65E5\u4E2D\u5143\u8D66\u7F6A\uFF0C\u5730\u5B98\u540C\u5929\u6C34\u4E8C\u5B98\u8003\u6821\u7F6A\u798F")],
  "7-12": [new TaoFestival("\u897F\u65B9\u96F7\u7956\u5723\u8BDE")],
  "7-15": [new TaoFestival("\u4E2D\u5143\u5730\u5B98\u5927\u5E1D\u5723\u8BDE")],
  "7-18": [new TaoFestival("\u738B\u6BCD\u5A18\u5A18\u5723\u8BDE")],
  "7-20": [new TaoFestival("\u5218\u7956(\u5218\u5904\u7384)\u957F\u751F\u771F\u4EBA\u5723\u8BDE")],
  "7-22": [new TaoFestival("\u8D22\u5E1B\u661F\u541B\u6587\u8D22\u795E\u589E\u798F\u76F8\u516C\u674E\u8BE1\u7956\u5723\u8BDE")],
  "7-26": [new TaoFestival("\u5F20\u4E09\u4E30\u7956\u5E08\u5723\u8BDE")],
  "8-1": [new TaoFestival("\u8BB8\u771F\u541B\u98DE\u5347\u65E5")],
  "8-3": [new TaoFestival("\u4E5D\u5929\u53F8\u547D\u7076\u541B\u8BDE")],
  "8-5": [new TaoFestival("\u5317\u65B9\u96F7\u7956\u5723\u8BDE")],
  "8-10": [new TaoFestival("\u5317\u5CB3\u5927\u5E1D\u8BDE\u8FB0")],
  "8-15": [new TaoFestival("\u592A\u9634\u661F\u541B\u8BDE")],
  "9-1": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-2": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-3": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-4": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-5": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-6": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-7": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-8": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0")],
  "9-9": [new TaoFestival("\u5317\u6597\u4E5D\u7687\u964D\u4E16\u4E4B\u8FB0"), new TaoFestival("\u6597\u59E5\u5143\u541B\u5723\u8BDE"), new TaoFestival("\u91CD\u9633\u5E1D\u541B\u5723\u8BDE"), new TaoFestival("\u7384\u5929\u4E0A\u5E1D\u98DE\u5347"), new TaoFestival("\u9146\u90FD\u5927\u5E1D\u5723\u8BDE")],
  "9-22": [new TaoFestival("\u589E\u798F\u8D22\u795E\u8BDE")],
  "9-23": [new TaoFestival("\u8428\u7FC1\u771F\u541B\u5723\u8BDE")],
  "9-28": [new TaoFestival("\u4E94\u663E\u7075\u5B98\u9A6C\u5143\u5E05\u5723\u8BDE")],
  "10-1": [new TaoFestival("\u6C11\u5C81\u814A\u4E4B\u8FB0", "\u6C11\u5C81\u814A\uFF0C\u6B64\u65E5\u4E94\u5E1D\u4F1A\u4E8E\u5317\u65B9\u4E94\u7081\u9ED1\u5929"), new TaoFestival("\u4E1C\u7687\u5927\u5E1D\u5723\u8BDE")],
  "10-3": [new TaoFestival("\u4E09\u8305\u5E94\u5316\u771F\u541B\u5723\u8BDE")],
  "10-6": [new TaoFestival("\u5929\u66F9\u8BF8\u53F8\u4E94\u5CB3\u4E94\u5E1D\u5723\u8BDE")],
  "10-15": [new TaoFestival("\u4E0B\u5143\u6C34\u5B98\u5927\u5E1D\u5723\u8BDE"), new TaoFestival("\u5EFA\u751F\u5927\u4F1A", "\u6B64\u65E5\u4E0B\u5143\u89E3\u5384\uFF0C\u6C34\u5B98\u540C\u5929\u5730\u4E8C\u5B98\u8003\u6821\u7F6A\u798F")],
  "10-18": [new TaoFestival("\u5730\u6BCD\u5A18\u5A18\u5723\u8BDE")],
  "10-19": [new TaoFestival("\u957F\u6625\u90B1\u771F\u541B\u98DE\u5347")],
  "10-20": [new TaoFestival("\u865A\u9756\u5929\u5E08(\u5373\u4E09\u5341\u4EE3\u5929\u5E08\u5F18\u609F\u5F20\u771F\u4EBA)\u8BDE")],
  "11-6": [new TaoFestival("\u897F\u5CB3\u5927\u5E1D\u5723\u8BDE")],
  "11-9": [new TaoFestival("\u6E58\u5B50\u97E9\u7956\u5723\u8BDE")],
  "11-11": [new TaoFestival("\u592A\u4E59\u6551\u82E6\u5929\u5C0A\u5723\u8BDE")],
  "11-26": [new TaoFestival("\u5317\u65B9\u4E94\u9053\u5723\u8BDE")],
  "12-8": [new TaoFestival("\u738B\u4FAF\u814A\u4E4B\u8FB0", "\u738B\u4FAF\u814A\uFF0C\u6B64\u65E5\u4E94\u5E1D\u4F1A\u4E8E\u4E0A\u65B9\u7384\u90FD\u7389\u4EAC")],
  "12-16": [new TaoFestival("\u5357\u5CB3\u5927\u5E1D\u5723\u8BDE"), new TaoFestival("\u798F\u5FB7\u6B63\u795E\u8BDE")],
  "12-20": [new TaoFestival("\u9C81\u73ED\u5148\u5E08\u5723\u8BDE")],
  "12-21": [new TaoFestival("\u5929\u7337\u4E0A\u5E1D\u5723\u8BDE")],
  "12-22": [new TaoFestival("\u91CD\u9633\u7956\u5E08\u5723\u8BDE")],
  "12-23": [new TaoFestival("\u796D\u7076\u738B", "\u6700\u9002\u5B9C\u8C22\u65E7\u5E74\u592A\u5C81\uFF0C\u5F00\u542F\u62DC\u65B0\u5E74\u592A\u5C81")],
  "12-25": [new TaoFestival("\u7389\u5E1D\u5DE1\u5929"), new TaoFestival("\u5929\u795E\u4E0B\u964D")],
  "12-29": [new TaoFestival("\u6E05\u9759\u5B59\u771F\u541B(\u5B59\u4E0D\u4E8C)\u6210\u9053")]
};
var FotoFestival = class {
  constructor(name, result = "", everyMonth = false, remark = "") {
    this._name = name;
    this._result = result ? result : "";
    this._everyMonth = everyMonth;
    this._remark = remark;
  }
  getName() {
    return this._name;
  }
  getResult() {
    return this._result;
  }
  isEveryMonth() {
    return this._everyMonth;
  }
  getRemark() {
    return this._remark;
  }
  toString() {
    return this._name;
  }
  toFullString() {
    const l = [this._name];
    if (this._result) {
      l.push(this._result);
    }
    if (this._remark) {
      l.push(this._remark);
    }
    return l.join(" ");
  }
};
var _FotoUtil = class {
  static getXiu(month, day) {
    return _FotoUtil.XIU_27[(_FotoUtil.XIU_OFFSET[Math.abs(month) - 1] + day - 1) % _FotoUtil.XIU_27.length];
  }
};
var FotoUtil = _FotoUtil;
FotoUtil.DAY_ZHAI_GUAN_YIN = ["1-8", "2-7", "2-9", "2-19", "3-3", "3-6", "3-13", "4-22", "5-3", "5-17", "6-16", "6-18", "6-19", "6-23", "7-13", "8-16", "9-19", "9-23", "10-2", "11-19", "11-24", "12-25"];
FotoUtil.XIU_27 = [
  "{xx.jiao}",
  "{xx.kang}",
  "{xx.di}",
  "{xx.fang}",
  "{xx.xin}",
  "{xx.tail}",
  "{xx.ji}",
  "{xx.dou}",
  "{xx.nv}",
  "{xx.xu}",
  "{xx.wei}",
  "{xx.shi}",
  "{xx.qiang}",
  "{xx.kui}",
  "{xx.lou}",
  "{xx.vei}",
  "{xx.mao}",
  "{xx.bi}",
  "{xx.zi}",
  "{xx.can}",
  "{xx.jing}",
  "{xx.gui}",
  "{xx.liu}",
  "{xx.xing}",
  "{xx.zhang}",
  "{xx.yi}",
  "{xx.zhen}"
];
FotoUtil.XIU_OFFSET = [11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9];
FotoUtil._DJ = "\u72AF\u8005\u593A\u7EAA";
FotoUtil._JS = "\u72AF\u8005\u51CF\u5BFF";
FotoUtil._SS = "\u72AF\u8005\u635F\u5BFF";
FotoUtil._XL = "\u72AF\u8005\u524A\u7984\u593A\u7EAA";
FotoUtil._JW = "\u72AF\u8005\u4E09\u5E74\u5185\u592B\u5987\u4FF1\u4EA1";
FotoUtil._Y = new FotoFestival("\u6768\u516C\u5FCC");
FotoUtil._T = new FotoFestival("\u56DB\u5929\u738B\u5DE1\u884C", "", true);
FotoUtil._D = new FotoFestival("\u6597\u964D", _FotoUtil._DJ, true);
FotoUtil._S = new FotoFestival("\u6708\u6714", _FotoUtil._DJ, true);
FotoUtil._W = new FotoFestival("\u6708\u671B", _FotoUtil._DJ, true);
FotoUtil._H = new FotoFestival("\u6708\u6666", _FotoUtil._JS, true);
FotoUtil._L = new FotoFestival("\u96F7\u658B\u65E5", _FotoUtil._JS, true);
FotoUtil._J = new FotoFestival("\u4E5D\u6BD2\u65E5", "\u72AF\u8005\u592D\u4EA1\uFF0C\u5947\u7978\u4E0D\u6D4B");
FotoUtil._R = new FotoFestival("\u4EBA\u795E\u5728\u9634", "\u72AF\u8005\u5F97\u75C5", true, "\u5B9C\u5148\u4E00\u65E5\u5373\u6212");
FotoUtil._M = new FotoFestival("\u53F8\u547D\u594F\u4E8B", _FotoUtil._JS, true, "\u5982\u6708\u5C0F\uFF0C\u5373\u6212\u5EFF\u4E5D");
FotoUtil._HH = new FotoFestival("\u6708\u6666", _FotoUtil._JS, true, "\u5982\u6708\u5C0F\uFF0C\u5373\u6212\u5EFF\u4E5D");
FotoUtil.FESTIVAL = {
  "1-1": [new FotoFestival("\u5929\u814A\uFF0C\u7389\u5E1D\u6821\u4E16\u4EBA\u795E\u6C14\u7984\u547D", _FotoUtil._XL), _FotoUtil._S],
  "1-3": [new FotoFestival("\u4E07\u795E\u90FD\u4F1A", _FotoUtil._DJ), _FotoUtil._D],
  "1-5": [new FotoFestival("\u4E94\u865A\u5FCC")],
  "1-6": [new FotoFestival("\u516D\u8017\u5FCC"), _FotoUtil._L],
  "1-7": [new FotoFestival("\u4E0A\u4F1A\u65E5", _FotoUtil._SS)],
  "1-8": [new FotoFestival("\u4E94\u6BBF\u960E\u7F57\u5929\u5B50\u8BDE", _FotoUtil._DJ), _FotoUtil._T],
  "1-9": [new FotoFestival("\u7389\u7687\u4E0A\u5E1D\u8BDE", _FotoUtil._DJ)],
  "1-13": [_FotoUtil._Y],
  "1-14": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS), _FotoUtil._T],
  "1-15": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS), new FotoFestival("\u4E0A\u5143\u795E\u4F1A", _FotoUtil._DJ), _FotoUtil._W, _FotoUtil._T],
  "1-16": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS)],
  "1-19": [new FotoFestival("\u957F\u6625\u771F\u4EBA\u8BDE")],
  "1-23": [new FotoFestival("\u4E09\u5C38\u795E\u594F\u4E8B"), _FotoUtil._T],
  "1-25": [_FotoUtil._H, new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", "\u72AF\u8005\u635F\u5BFF\uFF0C\u5B50\u5E26\u75BE")],
  "1-27": [_FotoUtil._D],
  "1-28": [_FotoUtil._R],
  "1-29": [_FotoUtil._T],
  "1-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "2-1": [new FotoFestival("\u4E00\u6BBF\u79E6\u5E7F\u738B\u8BDE", _FotoUtil._DJ), _FotoUtil._S],
  "2-2": [new FotoFestival("\u4E07\u795E\u90FD\u4F1A", _FotoUtil._DJ), new FotoFestival("\u798F\u5FB7\u571F\u5730\u6B63\u795E\u8BDE", "\u72AF\u8005\u5F97\u7978")],
  "2-3": [new FotoFestival("\u6587\u660C\u5E1D\u541B\u8BDE", _FotoUtil._XL), _FotoUtil._D],
  "2-6": [new FotoFestival("\u4E1C\u534E\u5E1D\u541B\u8BDE"), _FotoUtil._L],
  "2-8": [new FotoFestival("\u91CA\u8FE6\u725F\u5C3C\u4F5B\u51FA\u5BB6", _FotoUtil._DJ), new FotoFestival("\u4E09\u6BBF\u5B8B\u5E1D\u738B\u8BDE", _FotoUtil._DJ), new FotoFestival("\u5F20\u5927\u5E1D\u8BDE", _FotoUtil._DJ), _FotoUtil._T],
  "2-11": [_FotoUtil._Y],
  "2-14": [_FotoUtil._T],
  "2-15": [new FotoFestival("\u91CA\u8FE6\u725F\u5C3C\u4F5B\u6D85\u69C3", _FotoUtil._XL), new FotoFestival("\u592A\u4E0A\u8001\u541B\u8BDE", _FotoUtil._XL), new FotoFestival("\u6708\u671B", _FotoUtil._XL, true), _FotoUtil._T],
  "2-17": [new FotoFestival("\u4E1C\u65B9\u675C\u5C06\u519B\u8BDE")],
  "2-18": [new FotoFestival("\u56DB\u6BBF\u4E94\u5B98\u738B\u8BDE", _FotoUtil._XL), new FotoFestival("\u81F3\u5723\u5148\u5E08\u5B54\u5B50\u8BB3\u8FB0", _FotoUtil._XL)],
  "2-19": [new FotoFestival("\u89C2\u97F3\u5927\u58EB\u8BDE", _FotoUtil._DJ)],
  "2-21": [new FotoFestival("\u666E\u8D24\u83E9\u8428\u8BDE")],
  "2-23": [_FotoUtil._T],
  "2-25": [_FotoUtil._H],
  "2-27": [_FotoUtil._D],
  "2-28": [_FotoUtil._R],
  "2-29": [_FotoUtil._T],
  "2-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "3-1": [new FotoFestival("\u4E8C\u6BBF\u695A\u6C5F\u738B\u8BDE", _FotoUtil._DJ), _FotoUtil._S],
  "3-3": [new FotoFestival("\u7384\u5929\u4E0A\u5E1D\u8BDE", _FotoUtil._DJ), _FotoUtil._D],
  "3-6": [_FotoUtil._L],
  "3-8": [new FotoFestival("\u516D\u6BBF\u535E\u57CE\u738B\u8BDE", _FotoUtil._DJ), _FotoUtil._T],
  "3-9": [new FotoFestival("\u725B\u9B3C\u795E\u51FA", "\u72AF\u8005\u4EA7\u6076\u80CE"), _FotoUtil._Y],
  "3-12": [new FotoFestival("\u4E2D\u592E\u4E94\u9053\u8BDE")],
  "3-14": [_FotoUtil._T],
  "3-15": [new FotoFestival("\u660A\u5929\u4E0A\u5E1D\u8BDE", _FotoUtil._DJ), new FotoFestival("\u7384\u575B\u8BDE", _FotoUtil._DJ), _FotoUtil._W, _FotoUtil._T],
  "3-16": [new FotoFestival("\u51C6\u63D0\u83E9\u8428\u8BDE", _FotoUtil._DJ)],
  "3-19": [new FotoFestival("\u4E2D\u5CB3\u5927\u5E1D\u8BDE"), new FotoFestival("\u540E\u571F\u5A18\u5A18\u8BDE"), new FotoFestival("\u4E09\u8305\u964D")],
  "3-20": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._SS), new FotoFestival("\u5B50\u5B59\u5A18\u5A18\u8BDE")],
  "3-23": [_FotoUtil._T],
  "3-25": [_FotoUtil._H],
  "3-27": [new FotoFestival("\u4E03\u6BBF\u6CF0\u5C71\u738B\u8BDE"), _FotoUtil._D],
  "3-28": [_FotoUtil._R, new FotoFestival("\u82CD\u9889\u81F3\u5723\u5148\u5E08\u8BDE", _FotoUtil._XL), new FotoFestival("\u4E1C\u5CB3\u5927\u5E1D\u8BDE")],
  "3-29": [_FotoUtil._T],
  "3-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "4-1": [new FotoFestival("\u516B\u6BBF\u90FD\u5E02\u738B\u8BDE", _FotoUtil._DJ), _FotoUtil._S],
  "4-3": [_FotoUtil._D],
  "4-4": [new FotoFestival("\u4E07\u795E\u5584\u4F1A", "\u72AF\u8005\u5931\u763C\u592D\u80CE"), new FotoFestival("\u6587\u6B8A\u83E9\u8428\u8BDE")],
  "4-6": [_FotoUtil._L],
  "4-7": [new FotoFestival("\u5357\u6597\u3001\u5317\u6597\u3001\u897F\u6597\u540C\u964D", _FotoUtil._JS), _FotoUtil._Y],
  "4-8": [new FotoFestival("\u91CA\u8FE6\u725F\u5C3C\u4F5B\u8BDE", _FotoUtil._DJ), new FotoFestival("\u4E07\u795E\u5584\u4F1A", "\u72AF\u8005\u5931\u763C\u592D\u80CE"), new FotoFestival("\u5584\u6076\u7AE5\u5B50\u964D", "\u72AF\u8005\u8840\u6B7B"), new FotoFestival("\u4E5D\u6BBF\u5E73\u7B49\u738B\u8BDE"), _FotoUtil._T],
  "4-14": [new FotoFestival("\u7EAF\u9633\u7956\u5E08\u8BDE", _FotoUtil._JS), _FotoUtil._T],
  "4-15": [_FotoUtil._W, new FotoFestival("\u949F\u79BB\u7956\u5E08\u8BDE"), _FotoUtil._T],
  "4-16": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._SS)],
  "4-17": [new FotoFestival("\u5341\u6BBF\u8F6C\u8F6E\u738B\u8BDE", _FotoUtil._DJ)],
  "4-18": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._SS), new FotoFestival("\u7D2B\u5FBD\u5927\u5E1D\u8BDE", _FotoUtil._SS)],
  "4-20": [new FotoFestival("\u773C\u5149\u5723\u6BCD\u8BDE")],
  "4-23": [_FotoUtil._T],
  "4-25": [_FotoUtil._H],
  "4-27": [_FotoUtil._D],
  "4-28": [_FotoUtil._R],
  "4-29": [_FotoUtil._T],
  "4-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "5-1": [new FotoFestival("\u5357\u6781\u957F\u751F\u5927\u5E1D\u8BDE", _FotoUtil._DJ), _FotoUtil._S],
  "5-3": [_FotoUtil._D],
  "5-5": [new FotoFestival("\u5730\u814A", _FotoUtil._XL), new FotoFestival("\u4E94\u5E1D\u6821\u5B9A\u751F\u4EBA\u5B98\u7235", _FotoUtil._XL), _FotoUtil._J, _FotoUtil._Y],
  "5-6": [_FotoUtil._J, _FotoUtil._L],
  "5-7": [_FotoUtil._J],
  "5-8": [new FotoFestival("\u5357\u65B9\u4E94\u9053\u8BDE"), _FotoUtil._T],
  "5-11": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._SS), new FotoFestival("\u5929\u4E0B\u90FD\u57CE\u968D\u8BDE")],
  "5-12": [new FotoFestival("\u70B3\u7075\u516C\u8BDE")],
  "5-13": [new FotoFestival("\u5173\u5723\u964D", _FotoUtil._XL)],
  "5-14": [new FotoFestival("\u591C\u5B50\u65F6\u4E3A\u5929\u5730\u4EA4\u6CF0", _FotoUtil._JW), _FotoUtil._T],
  "5-15": [_FotoUtil._W, _FotoUtil._J, _FotoUtil._T],
  "5-16": [new FotoFestival("\u4E5D\u6BD2\u65E5", _FotoUtil._JW), new FotoFestival("\u5929\u5730\u5143\u6C14\u9020\u5316\u4E07\u7269\u4E4B\u8FB0", _FotoUtil._JW)],
  "5-17": [_FotoUtil._J],
  "5-18": [new FotoFestival("\u5F20\u5929\u5E08\u8BDE")],
  "5-22": [new FotoFestival("\u5B5D\u5A25\u795E\u8BDE", _FotoUtil._DJ)],
  "5-23": [_FotoUtil._T],
  "5-25": [_FotoUtil._J, _FotoUtil._H],
  "5-26": [_FotoUtil._J],
  "5-27": [_FotoUtil._J, _FotoUtil._D],
  "5-28": [_FotoUtil._R],
  "5-29": [_FotoUtil._T],
  "5-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "6-1": [_FotoUtil._S],
  "6-3": [new FotoFestival("\u97E6\u9A6E\u83E9\u8428\u5723\u8BDE"), _FotoUtil._D, _FotoUtil._Y],
  "6-5": [new FotoFestival("\u5357\u8D61\u90E8\u6D32\u8F6C\u5927\u8F6E", _FotoUtil._SS)],
  "6-6": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._SS), _FotoUtil._L],
  "6-8": [_FotoUtil._T],
  "6-10": [new FotoFestival("\u91D1\u7C9F\u5982\u6765\u8BDE")],
  "6-14": [_FotoUtil._T],
  "6-15": [_FotoUtil._W, _FotoUtil._T],
  "6-19": [new FotoFestival("\u89C2\u4E16\u97F3\u83E9\u8428\u6210\u9053", _FotoUtil._DJ)],
  "6-23": [new FotoFestival("\u5357\u65B9\u706B\u795E\u8BDE", "\u72AF\u8005\u906D\u56DE\u7984"), _FotoUtil._T],
  "6-24": [new FotoFestival("\u96F7\u7956\u8BDE", _FotoUtil._XL), new FotoFestival("\u5173\u5E1D\u8BDE", _FotoUtil._XL)],
  "6-25": [_FotoUtil._H],
  "6-27": [_FotoUtil._D],
  "6-28": [_FotoUtil._R],
  "6-29": [_FotoUtil._T],
  "6-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "7-1": [_FotoUtil._S, _FotoUtil._Y],
  "7-3": [_FotoUtil._D],
  "7-5": [new FotoFestival("\u4E2D\u4F1A\u65E5", _FotoUtil._SS, false, "\u4E00\u4F5C\u521D\u4E03")],
  "7-6": [_FotoUtil._L],
  "7-7": [new FotoFestival("\u9053\u5FB7\u814A", _FotoUtil._XL), new FotoFestival("\u4E94\u5E1D\u6821\u751F\u4EBA\u5584\u6076", _FotoUtil._XL), new FotoFestival("\u9B41\u661F\u8BDE", _FotoUtil._XL)],
  "7-8": [_FotoUtil._T],
  "7-10": [new FotoFestival("\u9634\u6BD2\u65E5", "", false, "\u5927\u5FCC")],
  "7-12": [new FotoFestival("\u957F\u771F\u8C2D\u771F\u4EBA\u8BDE")],
  "7-13": [new FotoFestival("\u5927\u52BF\u81F3\u83E9\u8428\u8BDE", _FotoUtil._JS)],
  "7-14": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS), _FotoUtil._T],
  "7-15": [_FotoUtil._W, new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._DJ), new FotoFestival("\u5730\u5B98\u6821\u7C4D", _FotoUtil._DJ), _FotoUtil._T],
  "7-16": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS)],
  "7-18": [new FotoFestival("\u897F\u738B\u6BCD\u8BDE", _FotoUtil._DJ)],
  "7-19": [new FotoFestival("\u592A\u5C81\u8BDE", _FotoUtil._DJ)],
  "7-22": [new FotoFestival("\u589E\u798F\u8D22\u795E\u8BDE", _FotoUtil._XL)],
  "7-23": [_FotoUtil._T],
  "7-25": [_FotoUtil._H],
  "7-27": [_FotoUtil._D],
  "7-28": [_FotoUtil._R],
  "7-29": [_FotoUtil._Y, _FotoUtil._T],
  "7-30": [new FotoFestival("\u5730\u85CF\u83E9\u8428\u8BDE", _FotoUtil._DJ), _FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "8-1": [_FotoUtil._S, new FotoFestival("\u8BB8\u771F\u541B\u8BDE")],
  "8-3": [_FotoUtil._D, new FotoFestival("\u5317\u6597\u8BDE", _FotoUtil._XL), new FotoFestival("\u53F8\u547D\u7076\u541B\u8BDE", "\u72AF\u8005\u906D\u56DE\u7984")],
  "8-5": [new FotoFestival("\u96F7\u58F0\u5927\u5E1D\u8BDE", _FotoUtil._DJ)],
  "8-6": [_FotoUtil._L],
  "8-8": [_FotoUtil._T],
  "8-10": [new FotoFestival("\u5317\u6597\u5927\u5E1D\u8BDE")],
  "8-12": [new FotoFestival("\u897F\u65B9\u4E94\u9053\u8BDE")],
  "8-14": [_FotoUtil._T],
  "8-15": [_FotoUtil._W, new FotoFestival("\u592A\u660E\u671D\u5143", "\u72AF\u8005\u66B4\u4EA1", false, "\u5B9C\u711A\u9999\u5B88\u591C"), _FotoUtil._T],
  "8-16": [new FotoFestival("\u5929\u66F9\u63A0\u5237\u771F\u541B\u964D", "\u72AF\u8005\u8D2B\u592D")],
  "8-18": [new FotoFestival("\u5929\u4EBA\u5174\u798F\u4E4B\u8FB0", "", false, "\u5B9C\u658B\u6212\uFF0C\u5B58\u60F3\u5409\u4E8B")],
  "8-23": [new FotoFestival("\u6C49\u6052\u5019\u5F20\u663E\u738B\u8BDE"), _FotoUtil._T],
  "8-24": [new FotoFestival("\u7076\u541B\u592B\u4EBA\u8BDE")],
  "8-25": [_FotoUtil._H],
  "8-27": [_FotoUtil._D, new FotoFestival("\u81F3\u5723\u5148\u5E08\u5B54\u5B50\u8BDE", _FotoUtil._XL), _FotoUtil._Y],
  "8-28": [_FotoUtil._R, new FotoFestival("\u56DB\u5929\u4F1A\u4E8B")],
  "8-29": [_FotoUtil._T],
  "8-30": [new FotoFestival("\u8BF8\u795E\u8003\u6821", "\u72AF\u8005\u593A\u7B97"), _FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "9-1": [_FotoUtil._S, new FotoFestival("\u5357\u6597\u8BDE", _FotoUtil._XL), new FotoFestival("\u5317\u6597\u4E5D\u661F\u964D\u4E16", _FotoUtil._DJ, false, "\u6B64\u4E5D\u65E5\u4FF1\u5B9C\u658B\u6212")],
  "9-3": [_FotoUtil._D, new FotoFestival("\u4E94\u761F\u795E\u8BDE")],
  "9-6": [_FotoUtil._L],
  "9-8": [_FotoUtil._T],
  "9-9": [new FotoFestival("\u6597\u6BCD\u8BDE", _FotoUtil._XL), new FotoFestival("\u9146\u90FD\u5927\u5E1D\u8BDE"), new FotoFestival("\u7384\u5929\u4E0A\u5E1D\u98DE\u5347")],
  "9-10": [new FotoFestival("\u6597\u6BCD\u964D", _FotoUtil._DJ)],
  "9-11": [new FotoFestival("\u5B9C\u6212")],
  "9-13": [new FotoFestival("\u5B5F\u5A46\u5C0A\u795E\u8BDE")],
  "9-14": [_FotoUtil._T],
  "9-15": [_FotoUtil._W, _FotoUtil._T],
  "9-17": [new FotoFestival("\u91D1\u9F99\u56DB\u5927\u738B\u8BDE", "\u72AF\u8005\u906D\u6C34\u5384")],
  "9-19": [new FotoFestival("\u65E5\u5BAB\u6708\u5BAB\u4F1A\u5408", _FotoUtil._JS), new FotoFestival("\u89C2\u4E16\u97F3\u83E9\u8428\u8BDE", _FotoUtil._JS)],
  "9-23": [_FotoUtil._T],
  "9-25": [_FotoUtil._H, _FotoUtil._Y],
  "9-27": [_FotoUtil._D],
  "9-28": [_FotoUtil._R],
  "9-29": [_FotoUtil._T],
  "9-30": [new FotoFestival("\u836F\u5E08\u7409\u7483\u5149\u4F5B\u8BDE", "\u72AF\u8005\u5371\u75BE"), _FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "10-1": [_FotoUtil._S, new FotoFestival("\u6C11\u5C81\u814A", _FotoUtil._DJ), new FotoFestival("\u56DB\u5929\u738B\u964D", "\u72AF\u8005\u4E00\u5E74\u5185\u6B7B")],
  "10-3": [_FotoUtil._D, new FotoFestival("\u4E09\u8305\u8BDE")],
  "10-5": [new FotoFestival("\u4E0B\u4F1A\u65E5", _FotoUtil._JS), new FotoFestival("\u8FBE\u6469\u7956\u5E08\u8BDE", _FotoUtil._JS)],
  "10-6": [_FotoUtil._L, new FotoFestival("\u5929\u66F9\u8003\u5BDF", _FotoUtil._DJ)],
  "10-8": [new FotoFestival("\u4F5B\u6D85\u69C3\u65E5", "", false, "\u5927\u5FCC\u8272\u6B32"), _FotoUtil._T],
  "10-10": [new FotoFestival("\u56DB\u5929\u738B\u964D", "\u72AF\u8005\u4E00\u5E74\u5185\u6B7B")],
  "10-11": [new FotoFestival("\u5B9C\u6212")],
  "10-14": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS), _FotoUtil._T],
  "10-15": [_FotoUtil._W, new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._DJ), new FotoFestival("\u4E0B\u5143\u6C34\u5E9C\u6821\u7C4D", _FotoUtil._DJ), _FotoUtil._T],
  "10-16": [new FotoFestival("\u4E09\u5143\u964D", _FotoUtil._JS), _FotoUtil._T],
  "10-23": [_FotoUtil._Y, _FotoUtil._T],
  "10-25": [_FotoUtil._H],
  "10-27": [_FotoUtil._D, new FotoFestival("\u5317\u6781\u7D2B\u5FBD\u5927\u5E1D\u964D")],
  "10-28": [_FotoUtil._R],
  "10-29": [_FotoUtil._T],
  "10-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "11-1": [_FotoUtil._S],
  "11-3": [_FotoUtil._D],
  "11-4": [new FotoFestival("\u81F3\u5723\u5148\u5E08\u5B54\u5B50\u8BDE", _FotoUtil._XL)],
  "11-6": [new FotoFestival("\u897F\u5CB3\u5927\u5E1D\u8BDE")],
  "11-8": [_FotoUtil._T],
  "11-11": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._DJ), new FotoFestival("\u592A\u4E59\u6551\u82E6\u5929\u5C0A\u8BDE", _FotoUtil._DJ)],
  "11-14": [_FotoUtil._T],
  "11-15": [new FotoFestival("\u6708\u671B", "\u4E0A\u534A\u591C\u72AF\u7537\u6B7B \u4E0B\u534A\u591C\u72AF\u5973\u6B7B"), new FotoFestival("\u56DB\u5929\u738B\u5DE1\u884C", "\u4E0A\u534A\u591C\u72AF\u7537\u6B7B \u4E0B\u534A\u591C\u72AF\u5973\u6B7B")],
  "11-17": [new FotoFestival("\u963F\u5F25\u9640\u4F5B\u8BDE")],
  "11-19": [new FotoFestival("\u592A\u9633\u65E5\u5BAB\u8BDE", "\u72AF\u8005\u5F97\u5947\u7978")],
  "11-21": [_FotoUtil._Y],
  "11-23": [new FotoFestival("\u5F20\u4ED9\u8BDE", "\u72AF\u8005\u7EDD\u55E3"), _FotoUtil._T],
  "11-25": [new FotoFestival("\u63A0\u5237\u5927\u592B\u964D", "\u72AF\u8005\u906D\u5927\u51F6"), _FotoUtil._H],
  "11-26": [new FotoFestival("\u5317\u65B9\u4E94\u9053\u8BDE")],
  "11-27": [_FotoUtil._D],
  "11-28": [_FotoUtil._R],
  "11-29": [_FotoUtil._T],
  "11-30": [_FotoUtil._HH, _FotoUtil._M, _FotoUtil._T],
  "12-1": [_FotoUtil._S],
  "12-3": [_FotoUtil._D],
  "12-6": [new FotoFestival("\u5929\u5730\u4ED3\u5F00\u65E5", _FotoUtil._JS), _FotoUtil._L],
  "12-7": [new FotoFestival("\u63A0\u5237\u5927\u592B\u964D", "\u72AF\u8005\u5F97\u6076\u75BE")],
  "12-8": [new FotoFestival("\u738B\u4FAF\u814A", _FotoUtil._DJ), new FotoFestival("\u91CA\u8FE6\u5982\u6765\u6210\u4F5B\u4E4B\u8FB0"), _FotoUtil._T, new FotoFestival("\u521D\u65EC\u5185\u620A\u65E5\uFF0C\u4EA6\u540D\u738B\u4FAF\u814A", _FotoUtil._DJ)],
  "12-12": [new FotoFestival("\u592A\u7D20\u4E09\u5143\u541B\u671D\u771F")],
  "12-14": [_FotoUtil._T],
  "12-15": [_FotoUtil._W, _FotoUtil._T],
  "12-16": [new FotoFestival("\u5357\u5CB3\u5927\u5E1D\u8BDE")],
  "12-19": [_FotoUtil._Y],
  "12-20": [new FotoFestival("\u5929\u5730\u4EA4\u9053", "\u72AF\u8005\u4FC3\u5BFF")],
  "12-21": [new FotoFestival("\u5929\u7337\u4E0A\u5E1D\u8BDE")],
  "12-23": [new FotoFestival("\u4E94\u5CB3\u8BDE\u964D"), _FotoUtil._T],
  "12-24": [new FotoFestival("\u53F8\u4ECA\u671D\u5929\u594F\u4EBA\u5584\u6076", "\u72AF\u8005\u5F97\u5927\u7978")],
  "12-25": [new FotoFestival("\u4E09\u6E05\u7389\u5E1D\u540C\u964D\uFF0C\u8003\u5BDF\u5584\u6076", "\u72AF\u8005\u5F97\u5947\u7978"), _FotoUtil._H],
  "12-27": [_FotoUtil._D],
  "12-28": [_FotoUtil._R],
  "12-29": [new FotoFestival("\u534E\u4E25\u83E9\u8428\u8BDE"), _FotoUtil._T],
  "12-30": [new FotoFestival("\u8BF8\u795E\u4E0B\u964D\uFF0C\u5BDF\u8BBF\u5584\u6076", "\u72AF\u8005\u7537\u5973\u4FF1\u4EA1")]
};
FotoUtil.OTHER_FESTIVAL = {
  "1-1": ["\u5F25\u52D2\u83E9\u8428\u5723\u8BDE"],
  "1-6": ["\u5B9A\u5149\u4F5B\u5723\u8BDE"],
  "2-8": ["\u91CA\u8FE6\u725F\u5C3C\u4F5B\u51FA\u5BB6"],
  "2-15": ["\u91CA\u8FE6\u725F\u5C3C\u4F5B\u6D85\u69C3"],
  "2-19": ["\u89C2\u4E16\u97F3\u83E9\u8428\u5723\u8BDE"],
  "2-21": ["\u666E\u8D24\u83E9\u8428\u5723\u8BDE"],
  "3-16": ["\u51C6\u63D0\u83E9\u8428\u5723\u8BDE"],
  "4-4": ["\u6587\u6B8A\u83E9\u8428\u5723\u8BDE"],
  "4-8": ["\u91CA\u8FE6\u725F\u5C3C\u4F5B\u5723\u8BDE"],
  "4-15": ["\u4F5B\u5409\u7965\u65E5"],
  "4-28": ["\u836F\u738B\u83E9\u8428\u5723\u8BDE"],
  "5-13": ["\u4F3D\u84DD\u83E9\u8428\u5723\u8BDE"],
  "6-3": ["\u97E6\u9A6E\u83E9\u8428\u5723\u8BDE"],
  "6-19": ["\u89C2\u97F3\u83E9\u8428\u6210\u9053"],
  "7-13": ["\u5927\u52BF\u81F3\u83E9\u8428\u5723\u8BDE"],
  "7-15": ["\u4F5B\u6B22\u559C\u65E5"],
  "7-24": ["\u9F99\u6811\u83E9\u8428\u5723\u8BDE"],
  "7-30": ["\u5730\u85CF\u83E9\u8428\u5723\u8BDE"],
  "8-15": ["\u6708\u5149\u83E9\u8428\u5723\u8BDE"],
  "8-22": ["\u71C3\u706F\u4F5B\u5723\u8BDE"],
  "9-9": ["\u6469\u5229\u652F\u5929\u83E9\u8428\u5723\u8BDE"],
  "9-19": ["\u89C2\u4E16\u97F3\u83E9\u8428\u51FA\u5BB6"],
  "9-30": ["\u836F\u5E08\u7409\u7483\u5149\u4F5B\u5723\u8BDE"],
  "10-5": ["\u8FBE\u6469\u7956\u5E08\u5723\u8BDE"],
  "10-20": ["\u6587\u6B8A\u83E9\u8428\u51FA\u5BB6"],
  "11-17": ["\u963F\u5F25\u9640\u4F5B\u5723\u8BDE"],
  "11-19": ["\u65E5\u5149\u83E9\u8428\u5723\u8BDE"],
  "12-8": ["\u91CA\u8FE6\u725F\u5C3C\u4F5B\u6210\u9053"],
  "12-23": ["\u76D1\u658B\u83E9\u8428\u5723\u8BDE"],
  "12-29": ["\u534E\u4E25\u83E9\u8428\u5723\u8BDE"]
};
var NineStarUtil = class {
};
NineStarUtil.NUMBER = [
  "{n.one}",
  "{n.two}",
  "{n.three}",
  "{n.four}",
  "{n.five}",
  "{n.six}",
  "{n.seven}",
  "{n.eight}",
  "{n.nine}"
];
NineStarUtil.WU_XING = [
  "{wx.shui}",
  "{wx.tu}",
  "{wx.mu}",
  "{wx.mu}",
  "{wx.tu}",
  "{wx.jin}",
  "{wx.jin}",
  "{wx.tu}",
  "{wx.huo}"
];
NineStarUtil.POSITION = [
  "{bg.kan}",
  "{bg.kun}",
  "{bg.zhen}",
  "{bg.xun}",
  "{ps.center}",
  "{bg.qian}",
  "{bg.dui}",
  "{bg.gen}",
  "{bg.li}"
];
NineStarUtil.LUCK_XUAN_KONG = [
  "{s.goodLuck}",
  "{s.badLuck}",
  "{s.badLuck}",
  "{s.goodLuck}",
  "{s.badLuck}",
  "{s.goodLuck}",
  "{s.badLuck}",
  "{s.goodLuck}",
  "{s.goodLuck}"
];
NineStarUtil.YIN_YANG_QI_MEN = [
  "{s.yang}",
  "{s.yin}",
  "{s.yang}",
  "{s.yang}",
  "{s.yang}",
  "{s.yin}",
  "{s.yin}",
  "{s.yang}",
  "{s.yin}"
];
NineStarUtil.COLOR = [
  "{s.white}",
  "{s.black}",
  "{s.blue}",
  "{s.green}",
  "{s.yellow}",
  "{s.white}",
  "{s.red}",
  "{s.white}",
  "{s.purple}"
];
var _I18n = class {
  static updateArray(c) {
    const v = _I18n._ARRAYS[c];
    const o = _I18n._OBJ_ARRAYS[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const arr = v[k];
      for (let i = 0, j = arr.length; i < j; i++) {
        o[k][i] = arr[i].replace(/{(.[^}]*)}/g, (_$0, $1) => {
          return _I18n.getMessage($1);
        });
      }
    }
  }
  static updateStringDictionary(c) {
    const v = _I18n._DICT_STRING[c];
    const o = _I18n._OBJ_STRING[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = v[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        const i = key.replace(/{(.[^}]*)}/g, (_$0, $1) => {
          return _I18n.getMessage($1);
        });
        o[k][i] = dict[key].replace(/{(.[^}]*)}/g, (_$0, $1) => {
          return _I18n.getMessage($1);
        });
      }
    }
  }
  static updateNumberDictionary(c) {
    const v = _I18n._DICT_NUMBER[c];
    const o = _I18n._OBJ_NUMBER[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = v[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        const i = key.replace(/{(.[^}]*)}/g, (_$0, $1) => {
          return _I18n.getMessage($1);
        });
        o[k][i] = dict[key];
      }
    }
  }
  static updateArrayDictionary(c) {
    const v = _I18n._DICT_ARRAY[c];
    const o = _I18n._OBJ_ARRAY[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = v[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        const x2 = key.replace(/{(.[^}]*)}/g, (_$0, $1) => {
          return _I18n.getMessage($1);
        });
        const arr = dict[key];
        for (let i = 0, j = arr.length; i < j; i++) {
          arr[i] = arr[i].replace(/{(.[^}]*)}/g, (_$0, $1) => {
            return _I18n.getMessage($1);
          });
        }
        o[k][x2] = arr;
      }
    }
  }
  static update() {
    let keys = Object.keys(_I18n._ARRAYS);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.updateArray(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_STRING);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.updateStringDictionary(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_NUMBER);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.updateNumberDictionary(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_ARRAY);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.updateArrayDictionary(keys[x]);
    }
  }
  static setMessages(lang, messages) {
    if (!messages) {
      return;
    }
    if (!_I18n._MESSAGES[lang]) {
      _I18n._MESSAGES[lang] = {};
    }
    const keys = Object.keys(messages);
    for (let x = 0, y = keys.length; x < y; x++) {
      const key = keys[x];
      _I18n._MESSAGES[lang][key] = messages[key];
    }
    _I18n.update();
  }
  static getMessage(key) {
    let s = _I18n._MESSAGES[_I18n._LANG][key];
    if (void 0 == s) {
      s = _I18n._MESSAGES[_I18n._DEFAULT_LANG][key];
    }
    if (void 0 == s) {
      s = key;
    }
    return s;
  }
  static setLanguage(lang) {
    if (_I18n._MESSAGES[lang]) {
      _I18n._LANG = lang;
      _I18n.update();
    }
  }
  static getLanguage() {
    return _I18n._LANG;
  }
  static initArray(c) {
    const v = _I18n._ARRAYS[c];
    const o = _I18n._OBJ_ARRAYS[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      v[k].length = 0;
      const arr = o[k];
      for (let i = 0, j = arr.length; i < j; i++) {
        v[k].push(arr[i]);
      }
    }
  }
  static initArrayDictionary(c) {
    const v = _I18n._DICT_ARRAY[c];
    const o = _I18n._OBJ_ARRAY[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = o[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        v[k][key] = dict[key];
      }
    }
  }
  static initStringDictionary(c) {
    const v = _I18n._DICT_STRING[c];
    const o = _I18n._OBJ_STRING[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = o[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        v[k][key] = dict[key];
      }
    }
  }
  static initNumberDictionary(c) {
    const v = _I18n._DICT_NUMBER[c];
    const o = _I18n._OBJ_NUMBER[c];
    const keys = Object.keys(v);
    for (let x = 0, y = keys.length; x < y; x++) {
      const k = keys[x];
      const dict = o[k];
      const subKeys = Object.keys(dict);
      for (let m = 0, n = subKeys.length; m < n; m++) {
        const key = subKeys[m];
        v[k][key] = dict[key];
      }
    }
  }
  static init() {
    if (_I18n._INIT) {
      return;
    }
    _I18n._INIT = true;
    let keys = Object.keys(_I18n._ARRAYS);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.initArray(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_STRING);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.initStringDictionary(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_NUMBER);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.initNumberDictionary(keys[x]);
    }
    keys = Object.keys(_I18n._DICT_ARRAY);
    for (let x = 0, y = keys.length; x < y; x++) {
      _I18n.initArrayDictionary(keys[x]);
    }
    _I18n.setLanguage(_I18n._DEFAULT_LANG);
  }
};
var I18n = _I18n;
I18n._DEFAULT_LANG = "chs";
I18n._INIT = false;
I18n._MESSAGES = {
  "chs": {
    "tg.jia": "\u7532",
    "tg.yi": "\u4E59",
    "tg.bing": "\u4E19",
    "tg.ding": "\u4E01",
    "tg.wu": "\u620A",
    "tg.ji": "\u5DF1",
    "tg.geng": "\u5E9A",
    "tg.xin": "\u8F9B",
    "tg.ren": "\u58EC",
    "tg.gui": "\u7678",
    "dz.zi": "\u5B50",
    "dz.chou": "\u4E11",
    "dz.yin": "\u5BC5",
    "dz.mao": "\u536F",
    "dz.chen": "\u8FB0",
    "dz.si": "\u5DF3",
    "dz.wu": "\u5348",
    "dz.wei": "\u672A",
    "dz.shen": "\u7533",
    "dz.you": "\u9149",
    "dz.xu": "\u620C",
    "dz.hai": "\u4EA5",
    "zx.jian": "\u5EFA",
    "zx.chu": "\u9664",
    "zx.man": "\u6EE1",
    "zx.ping": "\u5E73",
    "zx.ding": "\u5B9A",
    "zx.zhi": "\u6267",
    "zx.po": "\u7834",
    "zx.wei": "\u5371",
    "zx.cheng": "\u6210",
    "zx.shou": "\u6536",
    "zx.kai": "\u5F00",
    "zx.bi": "\u95ED",
    "jz.jiaZi": "\u7532\u5B50",
    "jz.yiChou": "\u4E59\u4E11",
    "jz.bingYin": "\u4E19\u5BC5",
    "jz.dingMao": "\u4E01\u536F",
    "jz.wuChen": "\u620A\u8FB0",
    "jz.jiSi": "\u5DF1\u5DF3",
    "jz.gengWu": "\u5E9A\u5348",
    "jz.xinWei": "\u8F9B\u672A",
    "jz.renShen": "\u58EC\u7533",
    "jz.guiYou": "\u7678\u9149",
    "jz.jiaXu": "\u7532\u620C",
    "jz.yiHai": "\u4E59\u4EA5",
    "jz.bingZi": "\u4E19\u5B50",
    "jz.dingChou": "\u4E01\u4E11",
    "jz.wuYin": "\u620A\u5BC5",
    "jz.jiMao": "\u5DF1\u536F",
    "jz.gengChen": "\u5E9A\u8FB0",
    "jz.xinSi": "\u8F9B\u5DF3",
    "jz.renWu": "\u58EC\u5348",
    "jz.guiWei": "\u7678\u672A",
    "jz.jiaShen": "\u7532\u7533",
    "jz.yiYou": "\u4E59\u9149",
    "jz.bingXu": "\u4E19\u620C",
    "jz.dingHai": "\u4E01\u4EA5",
    "jz.wuZi": "\u620A\u5B50",
    "jz.jiChou": "\u5DF1\u4E11",
    "jz.gengYin": "\u5E9A\u5BC5",
    "jz.xinMao": "\u8F9B\u536F",
    "jz.renChen": "\u58EC\u8FB0",
    "jz.guiSi": "\u7678\u5DF3",
    "jz.jiaWu": "\u7532\u5348",
    "jz.yiWei": "\u4E59\u672A",
    "jz.bingShen": "\u4E19\u7533",
    "jz.dingYou": "\u4E01\u9149",
    "jz.wuXu": "\u620A\u620C",
    "jz.jiHai": "\u5DF1\u4EA5",
    "jz.gengZi": "\u5E9A\u5B50",
    "jz.xinChou": "\u8F9B\u4E11",
    "jz.renYin": "\u58EC\u5BC5",
    "jz.guiMao": "\u7678\u536F",
    "jz.jiaChen": "\u7532\u8FB0",
    "jz.yiSi": "\u4E59\u5DF3",
    "jz.bingWu": "\u4E19\u5348",
    "jz.dingWei": "\u4E01\u672A",
    "jz.wuShen": "\u620A\u7533",
    "jz.jiYou": "\u5DF1\u9149",
    "jz.gengXu": "\u5E9A\u620C",
    "jz.xinHai": "\u8F9B\u4EA5",
    "jz.renZi": "\u58EC\u5B50",
    "jz.guiChou": "\u7678\u4E11",
    "jz.jiaYin": "\u7532\u5BC5",
    "jz.yiMao": "\u4E59\u536F",
    "jz.bingChen": "\u4E19\u8FB0",
    "jz.dingSi": "\u4E01\u5DF3",
    "jz.wuWu": "\u620A\u5348",
    "jz.jiWei": "\u5DF1\u672A",
    "jz.gengShen": "\u5E9A\u7533",
    "jz.xinYou": "\u8F9B\u9149",
    "jz.renXu": "\u58EC\u620C",
    "jz.guiHai": "\u7678\u4EA5",
    "sx.rat": "\u9F20",
    "sx.ox": "\u725B",
    "sx.tiger": "\u864E",
    "sx.rabbit": "\u5154",
    "sx.dragon": "\u9F99",
    "sx.snake": "\u86C7",
    "sx.horse": "\u9A6C",
    "sx.goat": "\u7F8A",
    "sx.monkey": "\u7334",
    "sx.rooster": "\u9E21",
    "sx.dog": "\u72D7",
    "sx.pig": "\u732A",
    "dw.long": "\u9F99",
    "dw.niu": "\u725B",
    "dw.gou": "\u72D7",
    "dw.yang": "\u7F8A",
    "dw.tu": "\u5154",
    "dw.shu": "\u9F20",
    "dw.ji": "\u9E21",
    "dw.ma": "\u9A6C",
    "dw.hu": "\u864E",
    "dw.zhu": "\u732A",
    "dw.hou": "\u7334",
    "dw.she": "\u86C7",
    "dw.huLi": "\u72D0",
    "dw.yan": "\u71D5",
    "dw.bao": "\u8C79",
    "dw.yuan": "\u733F",
    "dw.yin": "\u8693",
    "dw.lu": "\u9E7F",
    "dw.wu": "\u4E4C",
    "dw.jiao": "\u86DF",
    "dw.lang": "\u72FC",
    "dw.fu": "\u8760",
    "dw.zhang": "\u7350",
    "dw.xu": "\u735D",
    "dw.xie": "\u736C",
    "dw.han": "\u72B4",
    "dw.he": "\u8C89",
    "dw.zhi": "\u5F58",
    "wx.jin": "\u91D1",
    "wx.mu": "\u6728",
    "wx.shui": "\u6C34",
    "wx.huo": "\u706B",
    "wx.tu": "\u571F",
    "wx.ri": "\u65E5",
    "wx.yue": "\u6708",
    "n.zero": "\u3007",
    "n.one": "\u4E00",
    "n.two": "\u4E8C",
    "n.three": "\u4E09",
    "n.four": "\u56DB",
    "n.five": "\u4E94",
    "n.six": "\u516D",
    "n.seven": "\u4E03",
    "n.eight": "\u516B",
    "n.nine": "\u4E5D",
    "n.ten": "\u5341",
    "n.eleven": "\u5341\u4E00",
    "n.twelve": "\u5341\u4E8C",
    "d.one": "\u521D\u4E00",
    "d.two": "\u521D\u4E8C",
    "d.three": "\u521D\u4E09",
    "d.four": "\u521D\u56DB",
    "d.five": "\u521D\u4E94",
    "d.six": "\u521D\u516D",
    "d.seven": "\u521D\u4E03",
    "d.eight": "\u521D\u516B",
    "d.nine": "\u521D\u4E5D",
    "d.ten": "\u521D\u5341",
    "d.eleven": "\u5341\u4E00",
    "d.twelve": "\u5341\u4E8C",
    "d.thirteen": "\u5341\u4E09",
    "d.fourteen": "\u5341\u56DB",
    "d.fifteen": "\u5341\u4E94",
    "d.sixteen": "\u5341\u516D",
    "d.seventeen": "\u5341\u4E03",
    "d.eighteen": "\u5341\u516B",
    "d.nighteen": "\u5341\u4E5D",
    "d.twenty": "\u4E8C\u5341",
    "d.twentyOne": "\u5EFF\u4E00",
    "d.twentyTwo": "\u5EFF\u4E8C",
    "d.twentyThree": "\u5EFF\u4E09",
    "d.twentyFour": "\u5EFF\u56DB",
    "d.twentyFive": "\u5EFF\u4E94",
    "d.twentySix": "\u5EFF\u516D",
    "d.twentySeven": "\u5EFF\u4E03",
    "d.twentyEight": "\u5EFF\u516B",
    "d.twentyNine": "\u5EFF\u4E5D",
    "d.thirty": "\u4E09\u5341",
    "m.one": "\u6B63",
    "m.two": "\u4E8C",
    "m.three": "\u4E09",
    "m.four": "\u56DB",
    "m.five": "\u4E94",
    "m.six": "\u516D",
    "m.seven": "\u4E03",
    "m.eight": "\u516B",
    "m.nine": "\u4E5D",
    "m.ten": "\u5341",
    "m.eleven": "\u51AC",
    "m.twelve": "\u814A",
    "w.sun": "\u65E5",
    "w.mon": "\u4E00",
    "w.tues": "\u4E8C",
    "w.wed": "\u4E09",
    "w.thur": "\u56DB",
    "w.fri": "\u4E94",
    "w.sat": "\u516D",
    "xz.aries": "\u767D\u7F8A",
    "xz.taurus": "\u91D1\u725B",
    "xz.gemini": "\u53CC\u5B50",
    "xz.cancer": "\u5DE8\u87F9",
    "xz.leo": "\u72EE\u5B50",
    "xz.virgo": "\u5904\u5973",
    "xz.libra": "\u5929\u79E4",
    "xz.scorpio": "\u5929\u874E",
    "xz.sagittarius": "\u5C04\u624B",
    "xz.capricornus": "\u6469\u7FAF",
    "xz.aquarius": "\u6C34\u74F6",
    "xz.pisces": "\u53CC\u9C7C",
    "bg.qian": "\u4E7E",
    "bg.kun": "\u5764",
    "bg.zhen": "\u9707",
    "bg.xun": "\u5DFD",
    "bg.kan": "\u574E",
    "bg.li": "\u79BB",
    "bg.gen": "\u826E",
    "bg.dui": "\u5151",
    "ps.center": "\u4E2D",
    "ps.dong": "\u4E1C",
    "ps.nan": "\u5357",
    "ps.xi": "\u897F",
    "ps.bei": "\u5317",
    "ps.zhong": "\u4E2D\u5BAB",
    "ps.zhengDong": "\u6B63\u4E1C",
    "ps.zhengNan": "\u6B63\u5357",
    "ps.zhengXi": "\u6B63\u897F",
    "ps.zhengBei": "\u6B63\u5317",
    "ps.dongBei": "\u4E1C\u5317",
    "ps.dongNan": "\u4E1C\u5357",
    "ps.xiBei": "\u897F\u5317",
    "ps.xiNan": "\u897F\u5357",
    "ps.wai": "\u5916",
    "ps.fangNei": "\u623F\u5185",
    "jq.dongZhi": "\u51AC\u81F3",
    "jq.xiaoHan": "\u5C0F\u5BD2",
    "jq.daHan": "\u5927\u5BD2",
    "jq.liChun": "\u7ACB\u6625",
    "jq.yuShui": "\u96E8\u6C34",
    "jq.jingZhe": "\u60CA\u86F0",
    "jq.chunFen": "\u6625\u5206",
    "jq.qingMing": "\u6E05\u660E",
    "jq.guYu": "\u8C37\u96E8",
    "jq.liXia": "\u7ACB\u590F",
    "jq.xiaoMan": "\u5C0F\u6EE1",
    "jq.mangZhong": "\u8292\u79CD",
    "jq.xiaZhi": "\u590F\u81F3",
    "jq.xiaoShu": "\u5C0F\u6691",
    "jq.daShu": "\u5927\u6691",
    "jq.liQiu": "\u7ACB\u79CB",
    "jq.chuShu": "\u5904\u6691",
    "jq.baiLu": "\u767D\u9732",
    "jq.qiuFen": "\u79CB\u5206",
    "jq.hanLu": "\u5BD2\u9732",
    "jq.shuangJiang": "\u971C\u964D",
    "jq.liDong": "\u7ACB\u51AC",
    "jq.xiaoXue": "\u5C0F\u96EA",
    "jq.daXue": "\u5927\u96EA",
    "sn.qingLong": "\u9752\u9F99",
    "sn.baiHu": "\u767D\u864E",
    "sn.zhuQue": "\u6731\u96C0",
    "sn.xuanWu": "\u7384\u6B66",
    "sn.mingTang": "\u660E\u5802",
    "sn.tianXing": "\u5929\u5211",
    "sn.tianDe": "\u5929\u5FB7",
    "sn.jinKui": "\u91D1\u532E",
    "sn.yuTang": "\u7389\u5802",
    "sn.siMing": "\u53F8\u547D",
    "sn.tianLao": "\u5929\u7262",
    "sn.gouChen": "\u52FE\u9648",
    "sn.tianEn": "\u5929\u6069",
    "sn.muCang": "\u6BCD\u4ED3",
    "sn.shiYang": "\u65F6\u9633",
    "sn.shengQi": "\u751F\u6C14",
    "sn.yiHou": "\u76CA\u540E",
    "sn.zaiSha": "\u707E\u715E",
    "sn.tianHuo": "\u5929\u706B",
    "sn.siJi": "\u56DB\u5FCC",
    "sn.baLong": "\u516B\u9F99",
    "sn.fuRi": "\u590D\u65E5",
    "sn.xuShi": "\u7EED\u4E16",
    "sn.yueSha": "\u6708\u715E",
    "sn.yueXu": "\u6708\u865A",
    "sn.xueZhi": "\u8840\u652F",
    "sn.tianZei": "\u5929\u8D3C",
    "sn.wuXu": "\u4E94\u865A",
    "sn.tuFu": "\u571F\u7B26",
    "sn.guiJi": "\u5F52\u5FCC",
    "sn.xueJi": "\u8840\u5FCC",
    "sn.yueDe": "\u6708\u5FB7",
    "sn.yueEn": "\u6708\u6069",
    "sn.siXiang": "\u56DB\u76F8",
    "sn.wangRi": "\u738B\u65E5",
    "sn.tianCang": "\u5929\u4ED3",
    "sn.buJiang": "\u4E0D\u5C06",
    "sn.wuHe": "\u4E94\u5408",
    "sn.mingFeiDui": "\u9E23\u5420\u5BF9",
    "sn.yueJian": "\u6708\u5EFA",
    "sn.xiaoShi": "\u5C0F\u65F6",
    "sn.tuHu": "\u571F\u5E9C",
    "sn.wangWang": "\u5F80\u4EA1",
    "sn.yaoAn": "\u8981\u5B89",
    "sn.siShen": "\u6B7B\u795E",
    "sn.tianMa": "\u5929\u9A6C",
    "sn.jiuHu": "\u4E5D\u864E",
    "sn.qiNiao": "\u4E03\u9E1F",
    "sn.liuShe": "\u516D\u86C7",
    "sn.guanRi": "\u5B98\u65E5",
    "sn.jiQi": "\u5409\u671F",
    "sn.yuYu": "\u7389\u5B87",
    "sn.daShi": "\u5927\u65F6",
    "sn.daBai": "\u5927\u8D25",
    "sn.xianChi": "\u54B8\u6C60",
    "sn.shouRi": "\u5B88\u65E5",
    "sn.tianWu": "\u5929\u5DEB",
    "sn.fuDe": "\u798F\u5FB7",
    "sn.liuYi": "\u516D\u4EEA",
    "sn.jinTang": "\u91D1\u5802",
    "sn.yanDui": "\u538C\u5BF9",
    "sn.zhaoYao": "\u62DB\u6447",
    "sn.jiuKong": "\u4E5D\u7A7A",
    "sn.jiuKan": "\u4E5D\u574E",
    "sn.jiuJiao": "\u4E5D\u7126",
    "sn.xiangRi": "\u76F8\u65E5",
    "sn.baoGuang": "\u5B9D\u5149",
    "sn.tianGang": "\u5929\u7F61",
    "sn.yueXing": "\u6708\u5211",
    "sn.yueHai": "\u6708\u5BB3",
    "sn.youHuo": "\u6E38\u7978",
    "sn.chongRi": "\u91CD\u65E5",
    "sn.shiDe": "\u65F6\u5FB7",
    "sn.minRi": "\u6C11\u65E5",
    "sn.sanHe": "\u4E09\u5408",
    "sn.linRi": "\u4E34\u65E5",
    "sn.shiYin": "\u65F6\u9634",
    "sn.mingFei": "\u9E23\u5420",
    "sn.siQi": "\u6B7B\u6C14",
    "sn.diNang": "\u5730\u56CA",
    "sn.yueDeHe": "\u6708\u5FB7\u5408",
    "sn.jingAn": "\u656C\u5B89",
    "sn.puHu": "\u666E\u62A4",
    "sn.jieShen": "\u89E3\u795E",
    "sn.xiaoHao": "\u5C0F\u8017",
    "sn.tianDeHe": "\u5929\u5FB7\u5408",
    "sn.yueKong": "\u6708\u7A7A",
    "sn.yiMa": "\u9A7F\u9A6C",
    "sn.tianHou": "\u5929\u540E",
    "sn.chuShen": "\u9664\u795E",
    "sn.yuePo": "\u6708\u7834",
    "sn.daHao": "\u5927\u8017",
    "sn.wuLi": "\u4E94\u79BB",
    "sn.yinDe": "\u9634\u5FB7",
    "sn.fuSheng": "\u798F\u751F",
    "sn.tianLi": "\u5929\u540F",
    "sn.zhiSi": "\u81F4\u6B7B",
    "sn.yuanWu": "\u5143\u6B66",
    "sn.yangDe": "\u9633\u5FB7",
    "sn.tianXi": "\u5929\u559C",
    "sn.tianYi": "\u5929\u533B",
    "sn.yueYan": "\u6708\u538C",
    "sn.diHuo": "\u5730\u706B",
    "sn.fourHit": "\u56DB\u51FB",
    "sn.daSha": "\u5927\u715E",
    "sn.daHui": "\u5927\u4F1A",
    "sn.tianYuan": "\u5929\u613F",
    "sn.liuHe": "\u516D\u5408",
    "sn.wuFu": "\u4E94\u5BCC",
    "sn.shengXin": "\u5723\u5FC3",
    "sn.heKui": "\u6CB3\u9B41",
    "sn.jieSha": "\u52AB\u715E",
    "sn.siQiong": "\u56DB\u7A77",
    "sn.chuShuiLong": "\u89E6\u6C34\u9F99",
    "sn.baFeng": "\u516B\u98CE",
    "sn.tianShe": "\u5929\u8D66",
    "sn.wuMu": "\u4E94\u5893",
    "sn.baZhuan": "\u516B\u4E13",
    "sn.yinCuo": "\u9634\u9519",
    "sn.siHao": "\u56DB\u8017",
    "sn.yangCuo": "\u9633\u9519",
    "sn.siFei": "\u56DB\u5E9F",
    "sn.sanYin": "\u4E09\u9634",
    "sn.xiaoHui": "\u5C0F\u4F1A",
    "sn.yinDaoChongYang": "\u9634\u9053\u51B2\u9633",
    "sn.danYin": "\u5355\u9634",
    "sn.guChen": "\u5B64\u8FB0",
    "sn.yinWei": "\u9634\u4F4D",
    "sn.xingHen": "\u884C\u72E0",
    "sn.liaoLi": "\u4E86\u623E",
    "sn.jueYin": "\u7EDD\u9634",
    "sn.chunYang": "\u7EAF\u9633",
    "sn.suiBo": "\u5C81\u8584",
    "sn.yinYangJiaoPo": "\u9634\u9633\u4EA4\u7834",
    "sn.yinYangJuCuo": "\u9634\u9633\u4FF1\u9519",
    "sn.yinYangJiChong": "\u9634\u9633\u51FB\u51B2",
    "sn.zhuZhen": "\u9010\u9635",
    "sn.yangCuoYinChong": "\u9633\u9519\u9634\u51B2",
    "sn.qiFu": "\u4E03\u7B26",
    "sn.tianGou": "\u5929\u72D7",
    "sn.chengRi": "\u6210\u65E5",
    "sn.tianFu": "\u5929\u7B26",
    "sn.guYang": "\u5B64\u9633",
    "sn.jueYang": "\u7EDD\u9633",
    "sn.chunYin": "\u7EAF\u9634",
    "sn.yinShen": "\u9634\u795E",
    "sn.jieChu": "\u89E3\u9664",
    "sn.yangPoYinChong": "\u9633\u7834\u9634\u51B2",
    "ss.biJian": "\u6BD4\u80A9",
    "ss.jieCai": "\u52AB\u8D22",
    "ss.shiShen": "\u98DF\u795E",
    "ss.shangGuan": "\u4F24\u5B98",
    "ss.pianCai": "\u504F\u8D22",
    "ss.zhengCai": "\u6B63\u8D22",
    "ss.qiSha": "\u4E03\u6740",
    "ss.zhengGuan": "\u6B63\u5B98",
    "ss.pianYin": "\u504F\u5370",
    "ss.zhengYin": "\u6B63\u5370",
    "s.none": "\u65E0",
    "s.huangDao": "\u9EC4\u9053",
    "s.heiDao": "\u9ED1\u9053",
    "s.goodLuck": "\u5409",
    "s.badLuck": "\u51F6",
    "s.yin": "\u9634",
    "s.yang": "\u9633",
    "s.white": "\u767D",
    "s.black": "\u9ED1",
    "s.blue": "\u78A7",
    "s.green": "\u7EFF",
    "s.yellow": "\u9EC4",
    "s.red": "\u8D64",
    "s.purple": "\u7D2B",
    "jr.chuXi": "\u9664\u5915",
    "jr.chunJie": "\u6625\u8282",
    "jr.yuanXiao": "\u5143\u5BB5\u8282",
    "jr.longTou": "\u9F99\u5934\u8282",
    "jr.duanWu": "\u7AEF\u5348\u8282",
    "jr.qiXi": "\u4E03\u5915\u8282",
    "jr.zhongQiu": "\u4E2D\u79CB\u8282",
    "jr.chongYang": "\u91CD\u9633\u8282",
    "jr.laBa": "\u814A\u516B\u8282",
    "jr.yuanDan": "\u5143\u65E6\u8282",
    "jr.qingRen": "\u60C5\u4EBA\u8282",
    "jr.fuNv": "\u5987\u5973\u8282",
    "jr.zhiShu": "\u690D\u6811\u8282",
    "jr.xiaoFei": "\u6D88\u8D39\u8005\u6743\u76CA\u65E5",
    "jr.wuYi": "\u52B3\u52A8\u8282",
    "jr.qingNian": "\u9752\u5E74\u8282",
    "jr.erTong": "\u513F\u7AE5\u8282",
    "jr.yuRen": "\u611A\u4EBA\u8282",
    "jr.jianDang": "\u5EFA\u515A\u8282",
    "jr.jianJun": "\u5EFA\u519B\u8282",
    "jr.jiaoShi": "\u6559\u5E08\u8282",
    "jr.guoQing": "\u56FD\u5E86\u8282",
    "jr.wanShengYe": "\u4E07\u5723\u8282\u524D\u591C",
    "jr.wanSheng": "\u4E07\u5723\u8282",
    "jr.pingAn": "\u5E73\u5B89\u591C",
    "jr.shengDan": "\u5723\u8BDE\u8282",
    "ds.changSheng": "\u957F\u751F",
    "ds.muYu": "\u6C90\u6D74",
    "ds.guanDai": "\u51A0\u5E26",
    "ds.linGuan": "\u4E34\u5B98",
    "ds.diWang": "\u5E1D\u65FA",
    "ds.shuai": "\u8870",
    "ds.bing": "\u75C5",
    "ds.si": "\u6B7B",
    "ds.mu": "\u5893",
    "ds.jue": "\u7EDD",
    "ds.tai": "\u80CE",
    "ds.yang": "\u517B",
    "h.first": "\u521D\u5019",
    "h.second": "\u4E8C\u5019",
    "h.third": "\u4E09\u5019",
    "h.qiuYinJie": "\u86AF\u8693\u7ED3",
    "h.miJiao": "\u9E8B\u89D2\u89E3",
    "h.shuiQuan": "\u6C34\u6CC9\u52A8",
    "h.yanBei": "\u96C1\u5317\u4E61",
    "h.queShi": "\u9E4A\u59CB\u5DE2",
    "h.zhiShi": "\u96C9\u59CB\u96CA",
    "h.jiShi": "\u9E21\u59CB\u4E73",
    "h.zhengNiao": "\u5F81\u9E1F\u5389\u75BE",
    "h.shuiZe": "\u6C34\u6CFD\u8179\u575A",
    "h.dongFeng": "\u4E1C\u98CE\u89E3\u51BB",
    "h.zheChongShiZhen": "\u86F0\u866B\u59CB\u632F",
    "h.yuZhi": "\u9C7C\u965F\u8D1F\u51B0",
    "h.taJi": "\u736D\u796D\u9C7C",
    "h.houYan": "\u5019\u96C1\u5317",
    "h.caoMuMengDong": "\u8349\u6728\u840C\u52A8",
    "h.taoShi": "\u6843\u59CB\u534E",
    "h.cangGeng": "\u4ED3\u5E9A\u9E23",
    "h.yingHua": "\u9E70\u5316\u4E3A\u9E20",
    "h.xuanNiaoZhi": "\u7384\u9E1F\u81F3",
    "h.leiNai": "\u96F7\u4E43\u53D1\u58F0",
    "h.shiDian": "\u59CB\u7535",
    "h.tongShi": "\u6850\u59CB\u534E",
    "h.tianShu": "\u7530\u9F20\u5316\u4E3A\u9D3D",
    "h.hongShi": "\u8679\u59CB\u89C1",
    "h.pingShi": "\u840D\u59CB\u751F",
    "h.mingJiu": "\u9E23\u9E20\u62C2\u5176\u7FBD",
    "h.daiSheng": "\u6234\u80DC\u964D\u4E8E\u6851",
    "h.louGuo": "\u877C\u8748\u9E23",
    "h.qiuYinChu": "\u86AF\u8693\u51FA",
    "h.wangGua": "\u738B\u74DC\u751F",
    "h.kuCai": "\u82E6\u83DC\u79C0",
    "h.miCao": "\u9761\u8349\u6B7B",
    "h.maiQiu": "\u9EA6\u79CB\u81F3",
    "h.tangLang": "\u87B3\u8782\u751F",
    "h.juShi": "\u9D59\u59CB\u9E23",
    "h.fanShe": "\u53CD\u820C\u65E0\u58F0",
    "h.luJia": "\u9E7F\u89D2\u89E3",
    "h.tiaoShi": "\u8729\u59CB\u9E23",
    "h.banXia": "\u534A\u590F\u751F",
    "h.wenFeng": "\u6E29\u98CE\u81F3",
    "h.xiShuai": "\u87CB\u87C0\u5C45\u58C1",
    "h.yingShi": "\u9E70\u59CB\u631A",
    "h.fuCao": "\u8150\u8349\u4E3A\u8424",
    "h.tuRun": "\u571F\u6DA6\u6EBD\u6691",
    "h.daYu": "\u5927\u96E8\u884C\u65F6",
    "h.liangFeng": "\u51C9\u98CE\u81F3",
    "h.baiLu": "\u767D\u9732\u964D",
    "h.hanChan": "\u5BD2\u8749\u9E23",
    "h.yingNai": "\u9E70\u4E43\u796D\u9E1F",
    "h.tianDi": "\u5929\u5730\u59CB\u8083",
    "h.heNai": "\u79BE\u4E43\u767B",
    "h.hongYanLai": "\u9E3F\u96C1\u6765",
    "h.xuanNiaoGui": "\u7384\u9E1F\u5F52",
    "h.qunNiao": "\u7FA4\u9E1F\u517B\u7F9E",
    "h.leiShi": "\u96F7\u59CB\u6536\u58F0",
    "h.zheChongPiHu": "\u86F0\u866B\u576F\u6237",
    "h.shuiShiHe": "\u6C34\u59CB\u6DB8",
    "h.hongYanLaiBin": "\u9E3F\u96C1\u6765\u5BBE",
    "h.queRu": "\u96C0\u5165\u5927\u6C34\u4E3A\u86E4",
    "h.juYou": "\u83CA\u6709\u9EC4\u82B1",
    "h.caiNai": "\u8C7A\u4E43\u796D\u517D",
    "h.caoMuHuangLuo": "\u8349\u6728\u9EC4\u843D",
    "h.zheChongXianFu": "\u86F0\u866B\u54B8\u4FEF",
    "h.shuiShiBing": "\u6C34\u59CB\u51B0",
    "h.diShi": "\u5730\u59CB\u51BB",
    "h.zhiRu": "\u96C9\u5165\u5927\u6C34\u4E3A\u8703",
    "h.hongCang": "\u8679\u85CF\u4E0D\u89C1",
    "h.tianQi": "\u5929\u6C14\u4E0A\u5347\u5730\u6C14\u4E0B\u964D",
    "h.biSe": "\u95ED\u585E\u800C\u6210\u51AC",
    "h.heDan": "\u9E56\u9D20\u4E0D\u9E23",
    "h.huShi": "\u864E\u59CB\u4EA4",
    "h.liTing": "\u8354\u633A\u51FA",
    "ts.zhan": "\u5360",
    "ts.hu": "\u6237",
    "ts.win": "\u7A97",
    "ts.fang": "\u623F",
    "ts.chuang": "\u5E8A",
    "ts.lu": "\u7089",
    "ts.zao": "\u7076",
    "ts.dui": "\u7893",
    "ts.mo": "\u78E8",
    "ts.xi": "\u6816",
    "ts.chu": "\u53A8",
    "ts.ce": "\u5395",
    "ts.cang": "\u4ED3",
    "ts.cangKu": "\u4ED3\u5E93",
    "ts.daMen": "\u5927\u95E8",
    "ts.men": "\u95E8",
    "ts.tang": "\u5802",
    "ly.xianSheng": "\u5148\u80DC",
    "ly.xianFu": "\u5148\u8D1F",
    "ly.youYin": "\u53CB\u5F15",
    "ly.foMie": "\u4F5B\u706D",
    "ly.daAn": "\u5927\u5B89",
    "ly.chiKou": "\u8D64\u53E3",
    "yj.jiSi": "\u796D\u7940",
    "yj.qiFu": "\u7948\u798F",
    "yj.qiuSi": "\u6C42\u55E3",
    "yj.kaiGuang": "\u5F00\u5149",
    "yj.suHui": "\u5851\u7ED8",
    "yj.qiJiao": "\u9F50\u91AE",
    "yj.zhaiJiao": "\u658B\u91AE",
    "yj.muYu": "\u6C90\u6D74",
    "yj.chouShen": "\u916C\u795E",
    "yj.zaoMiao": "\u9020\u5E99",
    "yj.siZhao": "\u7940\u7076",
    "yj.fenXiang": "\u711A\u9999",
    "yj.xieTu": "\u8C22\u571F",
    "yj.chuHuo": "\u51FA\u706B",
    "yj.diaoKe": "\u96D5\u523B",
    "yj.jiaQu": "\u5AC1\u5A36",
    "yj.DingHun": "\u8BA2\u5A5A",
    "yj.naCai": "\u7EB3\u91C7",
    "yj.wenMing": "\u95EE\u540D",
    "yj.naXu": "\u7EB3\u5A7F",
    "yj.guiNing": "\u5F52\u5B81",
    "yj.anChuang": "\u5B89\u5E8A",
    "yj.heZhang": "\u5408\u5E10",
    "yj.guanJi": "\u51A0\u7B04",
    "yj.dingMeng": "\u8BA2\u76DF",
    "yj.jinRenKou": "\u8FDB\u4EBA\u53E3",
    "yj.caiYi": "\u88C1\u8863",
    "yj.wanMian": "\u633D\u9762",
    "yj.kaiRong": "\u5F00\u5BB9",
    "yj.xiuFen": "\u4FEE\u575F",
    "yj.qiZuan": "\u542F\u94BB",
    "yj.poTu": "\u7834\u571F",
    "yj.anZang": "\u5B89\u846C",
    "yj.liBei": "\u7ACB\u7891",
    "yj.chengFu": "\u6210\u670D",
    "yj.chuFu": "\u9664\u670D",
    "yj.kaiShengFen": "\u5F00\u751F\u575F",
    "yj.heShouMu": "\u5408\u5BFF\u6728",
    "yj.ruLian": "\u5165\u6B93",
    "yj.yiJiu": "\u79FB\u67E9",
    "yj.puDu": "\u666E\u6E21",
    "yj.ruZhai": "\u5165\u5B85",
    "yj.anXiang": "\u5B89\u9999",
    "yj.anMen": "\u5B89\u95E8",
    "yj.xiuZao": "\u4FEE\u9020",
    "yj.qiJi": "\u8D77\u57FA",
    "yj.dongTu": "\u52A8\u571F",
    "yj.shangLiang": "\u4E0A\u6881",
    "yj.shuZhu": "\u7AD6\u67F1",
    "yj.kaiJing": "\u5F00\u4E95\u5F00\u6C60",
    "yj.zuoBei": "\u4F5C\u9642\u653E\u6C34",
    "yj.chaiXie": "\u62C6\u5378",
    "yj.poWu": "\u7834\u5C4B",
    "yj.huaiYuan": "\u574F\u57A3",
    "yj.buYuan": "\u8865\u57A3",
    "yj.faMuZuoLiang": "\u4F10\u6728\u505A\u6881",
    "yj.zuoZhao": "\u4F5C\u7076",
    "yj.jieChu": "\u89E3\u9664",
    "yj.kaiZhuYan": "\u5F00\u67F1\u773C",
    "yj.chuanPing": "\u7A7F\u5C4F\u6247\u67B6",
    "yj.gaiWuHeJi": "\u76D6\u5C4B\u5408\u810A",
    "yj.kaiCe": "\u5F00\u5395",
    "yj.zaoCang": "\u9020\u4ED3",
    "yj.saiXue": "\u585E\u7A74",
    "yj.pingZhi": "\u5E73\u6CBB\u9053\u6D82",
    "yj.zaoQiao": "\u9020\u6865",
    "yj.zuoCe": "\u4F5C\u5395",
    "yj.zhuDi": "\u7B51\u5824",
    "yj.kaiChi": "\u5F00\u6C60",
    "yj.faMu": "\u4F10\u6728",
    "yj.kaiQu": "\u5F00\u6E20",
    "yj.jueJing": "\u6398\u4E95",
    "yj.saoShe": "\u626B\u820D",
    "yj.fangShui": "\u653E\u6C34",
    "yj.zaoWu": "\u9020\u5C4B",
    "yj.heJi": "\u5408\u810A",
    "yj.zaoChuChou": "\u9020\u755C\u7A20",
    "yj.xiuMen": "\u4FEE\u95E8",
    "yj.dingSang": "\u5B9A\u78C9",
    "yj.zuoLiang": "\u4F5C\u6881",
    "yj.xiuShi": "\u4FEE\u9970\u57A3\u5899",
    "yj.jiaMa": "\u67B6\u9A6C",
    "yj.kaiShi": "\u5F00\u5E02",
    "yj.guaBian": "\u6302\u533E",
    "yj.naChai": "\u7EB3\u8D22",
    "yj.qiuCai": "\u6C42\u8D22",
    "yj.kaiCang": "\u5F00\u4ED3",
    "yj.maiChe": "\u4E70\u8F66",
    "yj.zhiChan": "\u7F6E\u4EA7",
    "yj.guYong": "\u96C7\u4F63",
    "yj.chuHuoCai": "\u51FA\u8D27\u8D22",
    "yj.anJiXie": "\u5B89\u673A\u68B0",
    "yj.zaoCheQi": "\u9020\u8F66\u5668",
    "yj.jingLuo": "\u7ECF\u7EDC",
    "yj.yunNiang": "\u915D\u917F",
    "yj.zuoRan": "\u4F5C\u67D3",
    "yj.guZhu": "\u9F13\u94F8",
    "yj.zaoChuan": "\u9020\u8239",
    "yj.geMi": "\u5272\u871C",
    "yj.zaiZhong": "\u683D\u79CD",
    "yj.quYu": "\u53D6\u6E14",
    "yj.jieWang": "\u7ED3\u7F51",
    "yj.muYang": "\u7267\u517B",
    "yj.anDuiWei": "\u5B89\u7893\u78D1",
    "yj.xiYi": "\u4E60\u827A",
    "yj.ruXue": "\u5165\u5B66",
    "yj.liFa": "\u7406\u53D1",
    "yj.tanBing": "\u63A2\u75C5",
    "yj.jianGui": "\u89C1\u8D35",
    "yj.chengChuan": "\u4E58\u8239",
    "yj.duShui": "\u6E21\u6C34",
    "yj.zhenJiu": "\u9488\u7078",
    "yj.chuXing": "\u51FA\u884C",
    "yj.yiXi": "\u79FB\u5F99",
    "yj.fenJu": "\u5206\u5C45",
    "yj.TiTou": "\u5243\u5934",
    "yj.zhengShou": "\u6574\u624B\u8DB3\u7532",
    "yj.naChu": "\u7EB3\u755C",
    "yj.buZhuo": "\u6355\u6349",
    "yj.tianLie": "\u754B\u730E",
    "yj.jiaoNiuMa": "\u6559\u725B\u9A6C",
    "yj.huiQinYou": "\u4F1A\u4EB2\u53CB",
    "yj.fuRen": "\u8D74\u4EFB",
    "yj.qiuYi": "\u6C42\u533B",
    "yj.zhiBing": "\u6CBB\u75C5",
    "yj.ciSong": "\u8BCD\u8BBC",
    "yj.qiJiDongTu": "\u8D77\u57FA\u52A8\u571F",
    "yj.poWuHuaiYuan": "\u7834\u5C4B\u574F\u57A3",
    "yj.gaiWu": "\u76D6\u5C4B",
    "yj.zaoCangKu": "\u9020\u4ED3\u5E93",
    "yj.liQuanJiaoYi": "\u7ACB\u5238\u4EA4\u6613",
    "yj.jiaoYi": "\u4EA4\u6613",
    "yj.liQuan": "\u7ACB\u5238",
    "yj.anJi": "\u5B89\u673A",
    "yj.huiYou": "\u4F1A\u53CB",
    "yj.qiuYiLiaoBing": "\u6C42\u533B\u7597\u75C5",
    "yj.zhuShi": "\u8BF8\u4E8B\u4E0D\u5B9C",
    "yj.yuShi": "\u9980\u4E8B\u52FF\u53D6",
    "yj.xingSang": "\u884C\u4E27",
    "yj.duanYi": "\u65AD\u8681",
    "yj.guiXiu": "\u5F52\u5CAB",
    "xx.bi": "\u6BD5",
    "xx.yi": "\u7FFC",
    "xx.ji": "\u7B95",
    "xx.kui": "\u594E",
    "xx.gui": "\u9B3C",
    "xx.di": "\u6C10",
    "xx.xu": "\u865A",
    "xx.wei": "\u5371",
    "xx.zi": "\u89DC",
    "xx.zhen": "\u8F78",
    "xx.dou": "\u6597",
    "xx.lou": "\u5A04",
    "xx.liu": "\u67F3",
    "xx.fang": "\u623F",
    "xx.xin": "\u5FC3",
    "xx.shi": "\u5BA4",
    "xx.can": "\u53C2",
    "xx.jiao": "\u89D2",
    "xx.niu": "\u725B",
    "xx.vei": "\u80C3",
    "xx.xing": "\u661F",
    "xx.zhang": "\u5F20",
    "xx.tail": "\u5C3E",
    "xx.qiang": "\u58C1",
    "xx.jing": "\u4E95",
    "xx.kang": "\u4EA2",
    "xx.nv": "\u5973",
    "xx.mao": "\u6634",
    "sz.chun": "\u6625",
    "sz.xia": "\u590F",
    "sz.qiu": "\u79CB",
    "sz.dong": "\u51AC",
    "od.first": "\u5B5F",
    "od.second": "\u4EF2",
    "od.third": "\u5B63",
    "yx.shuo": "\u6714",
    "yx.jiShuo": "\u65E2\u6714",
    "yx.eMeiXin": "\u86FE\u7709\u65B0",
    "yx.eMei": "\u86FE\u7709",
    "yx.xi": "\u5915",
    "yx.shangXian": "\u4E0A\u5F26",
    "yx.jiuYe": "\u4E5D\u591C",
    "yx.night": "\u5BB5",
    "yx.jianYingTu": "\u6E10\u76C8\u51F8",
    "yx.xiaoWang": "\u5C0F\u671B",
    "yx.wang": "\u671B",
    "yx.jiWang": "\u65E2\u671B",
    "yx.liDai": "\u7ACB\u5F85",
    "yx.juDai": "\u5C45\u5F85",
    "yx.qinDai": "\u5BDD\u5F85",
    "yx.gengDai": "\u66F4\u5F85",
    "yx.jianKuiTu": "\u6E10\u4E8F\u51F8",
    "yx.xiaXian": "\u4E0B\u5F26",
    "yx.youMing": "\u6709\u660E",
    "yx.eMeiCan": "\u86FE\u7709\u6B8B",
    "yx.can": "\u6B8B",
    "yx.xiao": "\u6653",
    "yx.hui": "\u6666",
    "ny.sangZhe": "\u6851\u67D8",
    "ny.baiLa": "\u767D\u8721",
    "ny.yangLiu": "\u6768\u67F3",
    "ny.jinBo": "\u91D1\u7B94",
    "ny.haiZhong": "\u6D77\u4E2D",
    "ny.daHai": "\u5927\u6D77",
    "ny.shaZhong": "\u6C99\u4E2D",
    "ny.luZhong": "\u7089\u4E2D",
    "ny.shanXia": "\u5C71\u4E0B",
    "ny.daLin": "\u5927\u6797",
    "ny.pingDi": "\u5E73\u5730",
    "ny.luPang": "\u8DEF\u65C1",
    "ny.biShang": "\u58C1\u4E0A",
    "ny.jianFeng": "\u5251\u950B",
    "ny.shanTou": "\u5C71\u5934",
    "ny.fuDeng": "\u8986\u706F",
    "ny.jianXia": "\u6DA7\u4E0B",
    "ny.tianHe": "\u5929\u6CB3",
    "ny.chengTou": "\u57CE\u5934",
    "ny.daYi": "\u5927\u9A7F",
    "ny.chaiChuan": "\u9497\u948F",
    "ny.quanZhong": "\u6CC9\u4E2D",
    "ny.daXi": "\u5927\u6EAA",
    "ny.wuShang": "\u5C4B\u4E0A",
    "ny.piLi": "\u9739\u96F3",
    "ny.tianShang": "\u5929\u4E0A",
    "ny.songBo": "\u677E\u67CF",
    "ny.shiLiu": "\u77F3\u69B4",
    "ny.changLiu": "\u957F\u6D41"
  },
  "en": {
    "tg.jia": "Jia",
    "tg.yi": "Yi",
    "tg.bing": "Bing",
    "tg.ding": "Ding",
    "tg.wu": "Wu",
    "tg.ji": "Ji",
    "tg.geng": "Geng",
    "tg.xin": "Xin",
    "tg.ren": "Ren",
    "tg.gui": "Gui",
    "dz.zi": "Zi",
    "dz.chou": "Chou",
    "dz.yin": "Yin",
    "dz.mao": "Mao",
    "dz.chen": "Chen",
    "dz.si": "Si",
    "dz.wu": "Wu",
    "dz.wei": "Wei",
    "dz.shen": "Shen",
    "dz.you": "You",
    "dz.xu": "Xu",
    "dz.hai": "Hai",
    "zx.jian": "Build",
    "zx.chu": "Remove",
    "zx.man": "Full",
    "zx.ping": "Flat",
    "zx.ding": "Stable",
    "zx.zhi": "Hold",
    "zx.po": "Break",
    "zx.wei": "Danger",
    "zx.cheng": "Complete",
    "zx.shou": "Collect",
    "zx.kai": "Open",
    "zx.bi": "Close",
    "jz.jiaZi": "JiaZi",
    "jz.yiChou": "YiChou",
    "jz.bingYin": "BingYin",
    "jz.dingMao": "DingMao",
    "jz.wuChen": "WuChen",
    "jz.jiSi": "JiSi",
    "jz.gengWu": "GengWu",
    "jz.xinWei": "XinWei",
    "jz.renShen": "RenShen",
    "jz.guiYou": "GuiYou",
    "jz.jiaXu": "JiaXu",
    "jz.yiHai": "YiHai",
    "jz.bingZi": "BingZi",
    "jz.dingChou": "DingChou",
    "jz.wuYin": "WuYin",
    "jz.jiMao": "JiMao",
    "jz.gengChen": "GengChen",
    "jz.xinSi": "XinSi",
    "jz.renWu": "RenWu",
    "jz.guiWei": "GuiWei",
    "jz.jiaShen": "JiaShen",
    "jz.yiYou": "YiYou",
    "jz.bingXu": "BingXu",
    "jz.dingHai": "DingHai",
    "jz.wuZi": "WuZi",
    "jz.jiChou": "JiChou",
    "jz.gengYin": "GengYin",
    "jz.xinMao": "XinMao",
    "jz.renChen": "RenChen",
    "jz.guiSi": "GuiSi",
    "jz.jiaWu": "JiaWu",
    "jz.yiWei": "YiWei",
    "jz.bingShen": "BingShen",
    "jz.dingYou": "DingYou",
    "jz.wuXu": "WuXu",
    "jz.jiHai": "JiHai",
    "jz.gengZi": "GengZi",
    "jz.xinChou": "XinChou",
    "jz.renYin": "RenYin",
    "jz.guiMao": "GuiMao",
    "jz.jiaChen": "JiaChen",
    "jz.yiSi": "YiSi",
    "jz.bingWu": "BingWu",
    "jz.dingWei": "DingWei",
    "jz.wuShen": "WuShen",
    "jz.jiYou": "JiYou",
    "jz.gengXu": "GengXu",
    "jz.xinHai": "XinHai",
    "jz.renZi": "RenZi",
    "jz.guiChou": "GuiChou",
    "jz.jiaYin": "JiaYin",
    "jz.yiMao": "YiMao",
    "jz.bingChen": "BingChen",
    "jz.dingSi": "DingSi",
    "jz.wuWu": "WuWu",
    "jz.jiWei": "JiWei",
    "jz.gengShen": "GengShen",
    "jz.xinYou": "XinYou",
    "jz.renXu": "RenXu",
    "jz.guiHai": "GuiHai",
    "sx.rat": "Rat",
    "sx.ox": "Ox",
    "sx.tiger": "Tiger",
    "sx.rabbit": "Rabbit",
    "sx.dragon": "Dragon",
    "sx.snake": "Snake",
    "sx.horse": "Horse",
    "sx.goat": "Goat",
    "sx.monkey": "Monkey",
    "sx.rooster": "Rooster",
    "sx.dog": "Dog",
    "sx.pig": "Pig",
    "dw.long": "Dragon",
    "dw.niu": "Ox",
    "dw.gou": "Dog",
    "dw.yang": "Goat",
    "dw.tu": "Rabbit",
    "dw.shu": "Rat",
    "dw.ji": "Rooster",
    "dw.ma": "Horse",
    "dw.hu": "Tiger",
    "dw.zhu": "Pig",
    "dw.hou": "Monkey",
    "dw.she": "Snake",
    "dw.huLi": "Fox",
    "dw.yan": "Swallow",
    "dw.bao": "Leopard",
    "dw.yuan": "Ape",
    "dw.yin": "Earthworm",
    "dw.lu": "Deer",
    "dw.wu": "Crow",
    "dw.lang": "Wolf",
    "dw.fu": "Bat",
    "wx.jin": "Metal",
    "wx.mu": "Wood",
    "wx.shui": "Water",
    "wx.huo": "Fire",
    "wx.tu": "Earth",
    "wx.ri": "Sun",
    "wx.yue": "Moon",
    "n.zero": "0",
    "n.one": "1",
    "n.two": "2",
    "n.three": "3",
    "n.four": "4",
    "n.five": "5",
    "n.six": "6",
    "n.seven": "7",
    "n.eight": "8",
    "n.nine": "9",
    "n.ten": "10",
    "n.eleven": "11",
    "n.twelve": "12",
    "w.sun": "Sunday",
    "w.mon": "Monday",
    "w.tues": "Tuesday",
    "w.wed": "Wednesday",
    "w.thur": "Thursday",
    "w.fri": "Friday",
    "w.sat": "Saturday",
    "xz.aries": "Aries",
    "xz.taurus": "Taurus",
    "xz.gemini": "Gemini",
    "xz.cancer": "Cancer",
    "xz.leo": "Leo",
    "xz.virgo": "Virgo",
    "xz.libra": "Libra",
    "xz.scorpio": "Scorpio",
    "xz.sagittarius": "Sagittarius",
    "xz.capricornus": "Capricornus",
    "xz.aquarius": "Aquarius",
    "xz.pisces": "Pisces",
    "bg.qian": "Qian",
    "bg.kun": "Kun",
    "bg.zhen": "Zhen",
    "bg.xun": "Xun",
    "bg.kan": "Kan",
    "bg.li": "Li",
    "bg.gen": "Gen",
    "bg.dui": "Dui",
    "ps.center": "Center",
    "ps.dong": "East",
    "ps.nan": "South",
    "ps.xi": "West",
    "ps.bei": "North",
    "ps.zhong": "Center",
    "ps.zhengDong": "East",
    "ps.zhengNan": "South",
    "ps.zhengXi": "West",
    "ps.zhengBei": "North",
    "ps.dongBei": "Northeast",
    "ps.dongNan": "Southeast",
    "ps.xiBei": "Northwest",
    "ps.xiNan": "Southwest",
    "jq.dongZhi": "Winter Solstice",
    "jq.xiaoHan": "Lesser Cold",
    "jq.daHan": "Great Cold",
    "jq.liChun": "Spring Beginning",
    "jq.yuShui": "Rain Water",
    "jq.jingZhe": "Awakening from Hibernation",
    "jq.chunFen": "Spring Equinox",
    "jq.qingMing": "Fresh Green",
    "jq.guYu": "Grain Rain",
    "jq.liXia": "Beginning of Summer",
    "jq.xiaoMan": "Lesser Fullness",
    "jq.mangZhong": "Grain in Ear",
    "jq.xiaZhi": "Summer Solstice",
    "jq.xiaoShu": "Lesser Heat",
    "jq.daShu": "Greater Heat",
    "jq.liQiu": "Beginning of Autumn",
    "jq.chuShu": "End of Heat",
    "jq.baiLu": "White Dew",
    "jq.qiuFen": "Autumnal Equinox",
    "jq.hanLu": "Cold Dew",
    "jq.shuangJiang": "First Frost",
    "jq.liDong": "Beginning of Winter",
    "jq.xiaoXue": "Light Snow",
    "jq.daXue": "Heavy Snow",
    "sn.qingLong": "Azure Dragon",
    "sn.baiHu": "White Tiger",
    "sn.zhuQue": "Rosefinch",
    "sn.xuanWu": "Black Tortoise",
    "sn.tianEn": "Serene Grace",
    "sn.siShen": "Death",
    "sn.tianMa": "Pegasus",
    "sn.baLong": "Eight Dragon",
    "sn.jiuHu": "Nine Tiger",
    "sn.qiNiao": "Seven Bird",
    "sn.liuShe": "Six Snake",
    "s.none": "None",
    "s.goodLuck": "Good luck",
    "s.badLuck": "Bad luck",
    "s.yin": "Yin",
    "s.yang": "Yang",
    "s.white": "White",
    "s.black": "Black",
    "s.blue": "Blue",
    "s.green": "Green",
    "s.yellow": "Yellow",
    "s.red": "Red",
    "s.purple": "Purple",
    "jr.chuXi": "Chinese New Year's Eve",
    "jr.chunJie": "Luna New Year",
    "jr.yuanXiao": "Lantern Festival",
    "jr.duanWu": "Dragon Boat Festival",
    "jr.qiXi": "Begging Festival",
    "jr.zhongQiu": "Mid-Autumn Festival",
    "jr.laBa": "Laba Festival",
    "jr.yuanDan": "New Year's Day",
    "jr.qingRen": "Valentine's Day",
    "jr.fuNv": "Women's Day",
    "jr.xiaoFei": "Consumer Rights Day",
    "jr.zhiShu": "Arbor Day",
    "jr.wuYi": "International Worker's Day",
    "jr.erTong": "Children's Day",
    "jr.qingNian": "Youth Day",
    "jr.yuRen": "April Fools' Day",
    "jr.jianDang": "Party's Day",
    "jr.jianJun": "Army Day",
    "jr.jiaoShi": "Teachers' Day",
    "jr.guoQing": "National Day",
    "jr.wanShengYe": "All Saints' Eve",
    "jr.wanSheng": "All Saints' Day",
    "jr.pingAn": "Christmas Eve",
    "jr.shengDan": "Christmas Day",
    "ts.zhan": "At",
    "ts.hu": "Household",
    "ts.zao": "Cooker",
    "ts.dui": "Pestle",
    "ts.xi": "Habitat",
    "ts.win": "Window",
    "ts.fang": "Room",
    "ts.chuang": "Bed",
    "ts.lu": "Stove",
    "ts.mo": "Mill",
    "ts.chu": "Kitchen",
    "ts.ce": "Toilet",
    "ts.cang": "Depot",
    "ts.cangKu": "Depot",
    "ts.daMen": "Gate",
    "ts.men": "Door",
    "ts.tang": "Hall",
    "ly.xianSheng": "Win first",
    "ly.xianFu": "Lose first",
    "ly.youYin": "Friend's referral",
    "ly.foMie": "Buddhism's demise",
    "ly.daAn": "Great safety",
    "ly.chiKou": "Chikagoro",
    "yj.jiSi": "Sacrifice",
    "yj.qiFu": "Pray",
    "yj.qiuSi": "Seek heirs",
    "yj.kaiGuang": "Consecretion",
    "yj.suHui": "Paint sculptural",
    "yj.qiJiao": "Build altar",
    "yj.zhaiJiao": "Taoist rites",
    "yj.muYu": "Bathing",
    "yj.chouShen": "Reward gods",
    "yj.zaoMiao": "Build temple",
    "yj.siZhao": "Offer kitchen god",
    "yj.fenXiang": "Burn incense",
    "yj.xieTu": "Earth gratitude",
    "yj.chuHuo": "Expel the flame",
    "yj.diaoKe": "Carving",
    "yj.jiaQu": "Marriage",
    "yj.DingHun": "Engagement",
    "yj.naCai": "Proposing",
    "yj.wenMing": "Ask name",
    "yj.naXu": "Uxorilocal marriage",
    "yj.guiNing": "Visit parents",
    "yj.anChuang": "Bed placing",
    "yj.heZhang": "Make up accounts",
    "yj.guanJi": "Crowning adulthood",
    "yj.dingMeng": "Make alliance",
    "yj.jinRenKou": "Adopt",
    "yj.caiYi": "Dressmaking",
    "yj.wanMian": "Cosmeticsurgery",
    "yj.kaiRong": "Open face",
    "yj.xiuFen": "Grave repair",
    "yj.qiZuan": "Open coffin",
    "yj.poTu": "Break earth",
    "yj.anZang": "Burial",
    "yj.liBei": "Tombstone erecting",
    "yj.chengFu": "Formation of clothes",
    "yj.chuFu": "Mourning clothes removal",
    "yj.kaiShengFen": "Open grave",
    "yj.heShouMu": "Make coffin",
    "yj.ruLian": "Body placing",
    "yj.yiJiu": "Move coffin",
    "yj.puDu": "Save soul",
    "yj.ruZhai": "Enter house",
    "yj.anXiang": "Incenst placement",
    "yj.anMen": "Door placing",
    "yj.xiuZao": "Repair",
    "yj.qiJi": "Digging",
    "yj.dongTu": "Break ground",
    "yj.shangLiang": "Beam placing",
    "yj.shuZhu": "Erecting pillars",
    "yj.kaiJing": "Open pond and well",
    "yj.zuoBei": "Make pond and fill water",
    "yj.chaiXie": "Smash house",
    "yj.poWu": "Break house",
    "yj.huaiYuan": "Demolish",
    "yj.buYuan": "Mending",
    "yj.faMuZuoLiang": "Make beams",
    "yj.zuoZhao": "Make stove",
    "yj.jieChu": "Removal",
    "yj.kaiZhuYan": "Build beam",
    "yj.chuanPing": "Build door",
    "yj.gaiWuHeJi": "Cover house",
    "yj.kaiCe": "Open toilet",
    "yj.zaoCang": "Build depot",
    "yj.saiXue": "Block nest",
    "yj.pingZhi": "Repair roads",
    "yj.zaoQiao": "Build bridge",
    "yj.zuoCe": "Build toilet",
    "yj.zhuDi": "Fill",
    "yj.kaiChi": "Open pond",
    "yj.faMu": "Lumbering",
    "yj.kaiQu": "Canalization",
    "yj.jueJing": "Dig well",
    "yj.saoShe": "Sweep house",
    "yj.fangShui": "Drainage",
    "yj.zaoWu": "Build house",
    "yj.heJi": "Close ridge",
    "yj.zaoChuChou": "Livestock thickening",
    "yj.xiuMen": "Repair door",
    "yj.dingSang": "Fix stone",
    "yj.zuoLiang": "Beam construction",
    "yj.xiuShi": "Decorate wall",
    "yj.jiaMa": "Erect horse",
    "yj.kaiShi": "Opening",
    "yj.guaBian": "Hang plaque",
    "yj.naChai": "Accept wealth",
    "yj.qiuCai": "Seek wealth",
    "yj.kaiCang": "Open depot",
    "yj.maiChe": "Buy car",
    "yj.zhiChan": "Buy property",
    "yj.guYong": "Hire",
    "yj.chuHuoCai": "Delivery",
    "yj.anJiXie": "Build machine",
    "yj.zaoCheQi": "Build car",
    "yj.jingLuo": "Build loom",
    "yj.yunNiang": "Brew",
    "yj.zuoRan": "Dye",
    "yj.guZhu": "Cast",
    "yj.zaoChuan": "Build boat",
    "yj.geMi": "Harvest honey",
    "yj.zaiZhong": "Farming",
    "yj.quYu": "Fishing",
    "yj.jieWang": "Netting",
    "yj.muYang": "Graze",
    "yj.anDuiWei": "Build rub",
    "yj.xiYi": "Learn",
    "yj.ruXue": "Enter school",
    "yj.liFa": "Haircut",
    "yj.tanBing": "Visiting",
    "yj.jianGui": "Meet noble",
    "yj.chengChuan": "Ride boat",
    "yj.duShui": "Cross water",
    "yj.zhenJiu": "Acupuncture",
    "yj.chuXing": "Travel",
    "yj.yiXi": "Move",
    "yj.fenJu": "Live apart",
    "yj.TiTou": "Shave",
    "yj.zhengShou": "Manicure",
    "yj.naChu": "Feed livestock",
    "yj.buZhuo": "Catch",
    "yj.tianLie": "Hunt",
    "yj.jiaoNiuMa": "Train horse",
    "yj.huiQinYou": "Meet friends",
    "yj.fuRen": "Go post",
    "yj.qiuYi": "See doctor",
    "yj.zhiBing": "Treat",
    "yj.ciSong": "Litigation",
    "yj.qiJiDongTu": "Lay foundation",
    "yj.poWuHuaiYuan": "Demolish",
    "yj.gaiWu": "Build house",
    "yj.zaoCangKu": "Build depot",
    "yj.liQuanJiaoYi": "Covenant trade",
    "yj.jiaoYi": "Trade",
    "yj.liQuan": "Covenant",
    "yj.anJi": "Install machine",
    "yj.huiYou": "Meet friends",
    "yj.qiuYiLiaoBing": "Seek treatment",
    "yj.zhuShi": "Everything Sucks",
    "yj.yuShi": "Do nothing else",
    "yj.xingSang": "Funeral",
    "yj.duanYi": "Block ant hole",
    "yj.guiXiu": "Place beam",
    "xx.bi": "Finish",
    "xx.yi": "Wing",
    "xx.ji": "Sieve",
    "xx.kui": "Qui",
    "xx.gui": "Ghost",
    "xx.di": "Foundation",
    "xx.xu": "Virtual",
    "xx.wei": "Danger",
    "xx.zi": "Mouth",
    "xx.zhen": "Cross-bar",
    "xx.dou": "Fight",
    "xx.lou": "Weak",
    "xx.liu": "Willow",
    "xx.fang": "House",
    "xx.xin": "Heart",
    "xx.shi": "Room",
    "xx.can": "Join",
    "xx.jiao": "Horn",
    "xx.niu": "Ox",
    "xx.vei": "Stomach",
    "xx.xing": "Star",
    "xx.zhang": "Chang",
    "xx.tail": "Tail",
    "xx.qiang": "Wall",
    "xx.jing": "Well",
    "xx.kang": "Kang",
    "xx.nv": "Female",
    "xx.mao": "Mao",
    "sz.chun": "Spring",
    "sz.xia": "Summer",
    "sz.qiu": "Autumn",
    "sz.dong": "Winter",
    "yx.shuo": "New",
    "yx.eMeiXin": "New waxing",
    "yx.eMei": "Waxing",
    "yx.xi": "Evening",
    "yx.shangXian": "First quarter",
    "yx.jiuYe": "Nine night",
    "yx.night": "Night",
    "yx.jianYingTu": "Gibbous",
    "yx.xiaoWang": "Little full",
    "yx.wang": "Full",
    "yx.jianKuiTu": "Disseminating",
    "yx.xiaXian": "Third quarter",
    "yx.eMeiCan": "Waning waxing",
    "yx.can": "Waning",
    "yx.xiao": "Daybreak",
    "yx.hui": "Obscure",
    "ny.sangZhe": "Cudrania",
    "ny.baiLa": "Wax",
    "ny.yangLiu": "Willow",
    "ny.jinBo": "Foil",
    "ny.haiZhong": "Sea",
    "ny.daHai": "Ocean",
    "ny.shaZhong": "Sand",
    "ny.luZhong": "Stove",
    "ny.shanXia": "Piedmont",
    "ny.daLin": "Forest",
    "ny.pingDi": "Land",
    "ny.luPang": "Roadside",
    "ny.biShang": "Wall",
    "ny.jianFeng": "Blade",
    "ny.shanTou": "Hilltop",
    "ny.fuDeng": "Light",
    "ny.jianXia": "Valleyn",
    "ny.tianHe": "River",
    "ny.chengTou": "City",
    "ny.daYi": "Post",
    "ny.chaiChuan": "Ornaments",
    "ny.quanZhong": "Spring",
    "ny.daXi": "Stream",
    "ny.wuShang": "Roof",
    "ny.piLi": "Thunderbolt",
    "ny.tianShang": "Sky",
    "ny.songBo": "Coniferin",
    "ny.shiLiu": "Pomegranate",
    "ny.changLiu": "Flows"
  }
};
I18n._OBJ_STRING = {
  "LunarUtil": {
    "TIAN_SHEN_TYPE": LunarUtil.TIAN_SHEN_TYPE,
    "TIAN_SHEN_TYPE_LUCK": LunarUtil.TIAN_SHEN_TYPE_LUCK,
    "XIU_LUCK": LunarUtil.XIU_LUCK,
    "LU": LunarUtil.LU,
    "XIU": LunarUtil.XIU,
    "SHA": LunarUtil.SHA,
    "POSITION_DESC": LunarUtil.POSITION_DESC,
    "NAYIN": LunarUtil.NAYIN,
    "WU_XING_GAN": LunarUtil.WU_XING_GAN,
    "WU_XING_ZHI": LunarUtil.WU_XING_ZHI,
    "SHOU": LunarUtil.SHOU,
    "GONG": LunarUtil.GONG,
    "FESTIVAL": LunarUtil.FESTIVAL,
    "ZHENG": LunarUtil.ZHENG,
    "ANIMAL": LunarUtil.ANIMAL,
    "SHI_SHEN": LunarUtil.SHI_SHEN,
    "XIU_SONG": LunarUtil.XIU_SONG
  },
  "SolarUtil": {
    "FESTIVAL": SolarUtil.FESTIVAL
  },
  "TaoUtil": {
    "BA_HUI": TaoUtil.BA_HUI,
    "BA_JIE": TaoUtil.BA_JIE
  }
};
I18n._DICT_STRING = {
  "LunarUtil": {
    "TIAN_SHEN_TYPE": {},
    "TIAN_SHEN_TYPE_LUCK": {},
    "XIU_LUCK": {},
    "LU": {},
    "XIU": {},
    "SHA": {},
    "POSITION_DESC": {},
    "NAYIN": {},
    "WU_XING_GAN": {},
    "WU_XING_ZHI": {},
    "SHOU": {},
    "GONG": {},
    "FESTIVAL": {},
    "ZHENG": {},
    "ANIMAL": {},
    "SHI_SHEN": {},
    "XIU_SONG": {}
  },
  "SolarUtil": {
    "FESTIVAL": {}
  },
  "TaoUtil": {
    "BA_HUI": {},
    "BA_JIE": {}
  }
};
I18n._DICT_NUMBER = {
  "LunarUtil": {
    "ZHI_TIAN_SHEN_OFFSET": {},
    "CHANG_SHENG_OFFSET": {}
  }
};
I18n._OBJ_NUMBER = {
  "LunarUtil": {
    "ZHI_TIAN_SHEN_OFFSET": LunarUtil.ZHI_TIAN_SHEN_OFFSET,
    "CHANG_SHENG_OFFSET": LunarUtil.CHANG_SHENG_OFFSET
  }
};
I18n._DICT_ARRAY = {
  "LunarUtil": {
    "ZHI_HIDE_GAN": {}
  }
};
I18n._OBJ_ARRAY = {
  "LunarUtil": {
    "ZHI_HIDE_GAN": LunarUtil.ZHI_HIDE_GAN
  }
};
I18n._ARRAYS = {
  "LunarUtil": {
    "GAN": [],
    "ZHI": [],
    "JIA_ZI": [],
    "ZHI_XING": [],
    "XUN": [],
    "XUN_KONG": [],
    "CHONG": [],
    "CHONG_GAN": [],
    "CHONG_GAN_TIE": [],
    "HE_GAN_5": [],
    "HE_ZHI_6": [],
    "SHENGXIAO": [],
    "NUMBER": [],
    "POSITION_XI": [],
    "POSITION_YANG_GUI": [],
    "POSITION_YIN_GUI": [],
    "POSITION_FU": [],
    "POSITION_FU_2": [],
    "POSITION_CAI": [],
    "POSITION_TAI_SUI_YEAR": [],
    "POSITION_GAN": [],
    "POSITION_ZHI": [],
    "JIE_QI": [],
    "JIE_QI_IN_USE": [],
    "TIAN_SHEN": [],
    "SHEN_SHA": [],
    "PENGZU_GAN": [],
    "PENGZU_ZHI": [],
    "MONTH_ZHI": [],
    "CHANG_SHENG": [],
    "HOU": [],
    "WU_HOU": [],
    "POSITION_TAI_DAY": [],
    "POSITION_TAI_MONTH": [],
    "YI_JI": [],
    "LIU_YAO": [],
    "MONTH": [],
    "SEASON": [],
    "DAY": [],
    "YUE_XIANG": []
  },
  "SolarUtil": {
    "WEEK": [],
    "XINGZUO": []
  },
  "TaoUtil": {
    "AN_WU": []
  },
  "FotoUtil": {
    "XIU_27": []
  },
  "NineStarUtil": {
    "NUMBER": [],
    "WU_XING": [],
    "POSITION": [],
    "LUCK_XUAN_KONG": [],
    "YIN_YANG_QI_MEN": [],
    "COLOR": []
  }
};
I18n._OBJ_ARRAYS = {
  "LunarUtil": {
    "GAN": LunarUtil.GAN,
    "ZHI": LunarUtil.ZHI,
    "JIA_ZI": LunarUtil.JIA_ZI,
    "ZHI_XING": LunarUtil.ZHI_XING,
    "XUN": LunarUtil.XUN,
    "XUN_KONG": LunarUtil.XUN_KONG,
    "CHONG": LunarUtil.CHONG,
    "CHONG_GAN": LunarUtil.CHONG_GAN,
    "CHONG_GAN_TIE": LunarUtil.CHONG_GAN_TIE,
    "HE_GAN_5": LunarUtil.HE_GAN_5,
    "HE_ZHI_6": LunarUtil.HE_ZHI_6,
    "SHENGXIAO": LunarUtil.SHENGXIAO,
    "NUMBER": LunarUtil.NUMBER,
    "POSITION_XI": LunarUtil.POSITION_XI,
    "POSITION_YANG_GUI": LunarUtil.POSITION_YANG_GUI,
    "POSITION_YIN_GUI": LunarUtil.POSITION_YIN_GUI,
    "POSITION_FU": LunarUtil.POSITION_FU,
    "POSITION_FU_2": LunarUtil.POSITION_FU_2,
    "POSITION_CAI": LunarUtil.POSITION_CAI,
    "POSITION_TAI_SUI_YEAR": LunarUtil.POSITION_TAI_SUI_YEAR,
    "POSITION_GAN": LunarUtil.POSITION_GAN,
    "POSITION_ZHI": LunarUtil.POSITION_ZHI,
    "JIE_QI": LunarUtil.JIE_QI,
    "JIE_QI_IN_USE": LunarUtil.JIE_QI_IN_USE,
    "TIAN_SHEN": LunarUtil.TIAN_SHEN,
    "SHEN_SHA": LunarUtil.SHEN_SHA,
    "PENGZU_GAN": LunarUtil.PENGZU_GAN,
    "PENGZU_ZHI": LunarUtil.PENGZU_ZHI,
    "MONTH_ZHI": LunarUtil.MONTH_ZHI,
    "CHANG_SHENG": LunarUtil.CHANG_SHENG,
    "HOU": LunarUtil.HOU,
    "WU_HOU": LunarUtil.WU_HOU,
    "POSITION_TAI_DAY": LunarUtil.POSITION_TAI_DAY,
    "POSITION_TAI_MONTH": LunarUtil.POSITION_TAI_MONTH,
    "YI_JI": LunarUtil.YI_JI,
    "LIU_YAO": LunarUtil.LIU_YAO,
    "MONTH": LunarUtil.MONTH,
    "SEASON": LunarUtil.SEASON,
    "DAY": LunarUtil.DAY,
    "YUE_XIANG": LunarUtil.YUE_XIANG
  },
  "SolarUtil": {
    "WEEK": SolarUtil.WEEK,
    "XINGZUO": SolarUtil.XINGZUO
  },
  "TaoUtil": {
    "AN_WU": TaoUtil.AN_WU
  },
  "FotoUtil": {
    "XIU_27": FotoUtil.XIU_27
  },
  "NineStarUtil": {
    "NUMBER": NineStarUtil.NUMBER,
    "WU_XING": NineStarUtil.WU_XING,
    "POSITION": NineStarUtil.POSITION,
    "LUCK_XUAN_KONG": NineStarUtil.LUCK_XUAN_KONG,
    "YIN_YANG_QI_MEN": NineStarUtil.YIN_YANG_QI_MEN,
    "COLOR": NineStarUtil.COLOR
  }
};
var LiuNian = class {
  constructor(daYun, index) {
    this._year = daYun.getStartYear() + index;
    this._age = daYun.getStartAge() + index;
    this._index = index;
    this._daYun = daYun;
    this._lunar = daYun.getLunar();
  }
  getYear() {
    return this._year;
  }
  getAge() {
    return this._age;
  }
  getIndex() {
    return this._index;
  }
  getLunar() {
    return this._lunar;
  }
  getGanZhi() {
    let offset = LunarUtil.getJiaZiIndex(this._lunar.getJieQiTable()[I18n.getMessage("jq.liChun")].getLunar().getYearInGanZhiExact()) + this._index;
    if (this._daYun.getIndex() > 0) {
      offset += this._daYun.getStartAge() - 1;
    }
    offset %= LunarUtil.JIA_ZI.length;
    return LunarUtil.JIA_ZI[offset];
  }
  getXun() {
    return LunarUtil.getXun(this.getGanZhi());
  }
  getXunKong() {
    return LunarUtil.getXunKong(this.getGanZhi());
  }
  getLiuYue() {
    const l = [];
    for (let i = 0; i < 12; i++) {
      l.push(new LiuYue(this, i));
    }
    return l;
  }
};
var XiaoYun = class {
  constructor(daYun, index, forward) {
    this._year = daYun.getStartYear() + index;
    this._age = daYun.getStartAge() + index;
    this._index = index;
    this._daYun = daYun;
    this._lunar = daYun.getLunar();
    this._forward = forward;
  }
  getYear() {
    return this._year;
  }
  getAge() {
    return this._age;
  }
  getIndex() {
    return this._index;
  }
  getGanZhi() {
    let offset = LunarUtil.getJiaZiIndex(this._lunar.getTimeInGanZhi());
    let add = this._index + 1;
    if (this._daYun.getIndex() > 0) {
      add += this._daYun.getStartAge() - 1;
    }
    offset += this._forward ? add : -add;
    const size = LunarUtil.JIA_ZI.length;
    while (offset < 0) {
      offset += size;
    }
    offset %= size;
    return LunarUtil.JIA_ZI[offset];
  }
  getXun() {
    return LunarUtil.getXun(this.getGanZhi());
  }
  getXunKong() {
    return LunarUtil.getXunKong(this.getGanZhi());
  }
};
var DaYun = class {
  constructor(yun, index) {
    const lunar = yun.getLunar();
    const birthYear = lunar.getSolar().getYear();
    const year = yun.getStartSolar().getYear();
    let startYear = birthYear;
    let startAge = 1;
    let endYear = year - 1;
    let endAge = year - birthYear;
    if (index >= 1) {
      startYear = year + (index - 1) * 10;
      startAge = startYear - birthYear + 1;
      endYear = startYear + 9;
      endAge = startAge + 9;
    }
    this._startYear = startYear;
    this._endYear = endYear;
    this._startAge = startAge;
    this._endAge = endAge;
    this._index = index;
    this._yun = yun;
    this._lunar = lunar;
  }
  getStartYear() {
    return this._startYear;
  }
  getEndYear() {
    return this._endYear;
  }
  getStartAge() {
    return this._startAge;
  }
  getEndAge() {
    return this._endAge;
  }
  getIndex() {
    return this._index;
  }
  getLunar() {
    return this._lunar;
  }
  getGanZhi() {
    if (this._index < 1) {
      return "";
    }
    let offset = LunarUtil.getJiaZiIndex(this._lunar.getMonthInGanZhiExact());
    offset += this._yun.isForward() ? this._index : -this._index;
    const size = LunarUtil.JIA_ZI.length;
    if (offset >= size) {
      offset -= size;
    }
    if (offset < 0) {
      offset += size;
    }
    return LunarUtil.JIA_ZI[offset];
  }
  getXun() {
    return LunarUtil.getXun(this.getGanZhi());
  }
  getXunKong() {
    return LunarUtil.getXunKong(this.getGanZhi());
  }
  getLiuNian(n = 10) {
    if (this._index < 1) {
      n = this._endYear - this._startYear + 1;
    }
    const l = [];
    for (let i = 0; i < n; i++) {
      l.push(new LiuNian(this, i));
    }
    return l;
  }
  getXiaoYun(n = 10) {
    if (this._index < 1) {
      n = this._endYear - this._startYear + 1;
    }
    const l = [];
    for (let i = 0; i < n; i++) {
      l.push(new XiaoYun(this, i, this._yun.isForward()));
    }
    return l;
  }
};
var Yun = class {
  constructor(lunar, gender, sect = 1) {
    this._gender = gender;
    this._lunar = lunar;
    const yang = 0 === lunar.getYearGanIndexExact() % 2;
    const man = 1 === gender;
    const forward = yang && man || !yang && !man;
    this._forward = forward;
    const prev = lunar.getPrevJie();
    const next = lunar.getNextJie();
    const current = lunar.getSolar();
    const start = forward ? current : prev.getSolar();
    const end = forward ? next.getSolar() : current;
    let hour = 0;
    if (2 === sect) {
      let minutes = end.subtractMinute(start);
      const year = Math.floor(minutes / 4320);
      minutes -= year * 4320;
      const month = Math.floor(minutes / 360);
      minutes -= month * 360;
      const day = Math.floor(minutes / 12);
      minutes -= day * 12;
      hour = minutes * 2;
      this._startYear = year;
      this._startMonth = month;
      this._startDay = day;
    } else {
      const endTimeZhiIndex = end.getHour() == 23 ? 11 : LunarUtil.getTimeZhiIndex(end.toYmdHms().substring(11, 16));
      const startTimeZhiIndex = start.getHour() == 23 ? 11 : LunarUtil.getTimeZhiIndex(start.toYmdHms().substring(11, 16));
      let hourDiff = endTimeZhiIndex - startTimeZhiIndex;
      let dayDiff = end.subtract(start);
      if (hourDiff < 0) {
        hourDiff += 12;
        dayDiff--;
      }
      const monthDiff = Math.floor(hourDiff * 10 / 30);
      const month = dayDiff * 4 + monthDiff;
      this._startDay = hourDiff * 10 - monthDiff * 30;
      const year = Math.floor(month / 12);
      this._startMonth = month - year * 12;
      this._startYear = year;
    }
    this._startHour = hour;
  }
  getGender() {
    return this._gender;
  }
  getStartYear() {
    return this._startYear;
  }
  getStartMonth() {
    return this._startMonth;
  }
  getStartDay() {
    return this._startDay;
  }
  getStartHour() {
    return this._startHour;
  }
  isForward() {
    return this._forward;
  }
  getLunar() {
    return this._lunar;
  }
  getStartSolar() {
    let solar = this._lunar.getSolar();
    solar = solar.nextYear(this._startYear);
    solar = solar.nextMonth(this._startMonth);
    solar = solar.next(this._startDay);
    return solar.nextHour(this._startHour);
  }
  getDaYun(n = 10) {
    const l = [];
    for (let i = 0; i < n; i++) {
      l.push(new DaYun(this, i));
    }
    return l;
  }
};
var EightChar = class _EightChar {
  constructor(lunar) {
    this._sect = 2;
    this._lunar = lunar;
  }
  static fromLunar(lunar) {
    return new _EightChar(lunar);
  }
  getSect() {
    return this._sect;
  }
  setSect(sect) {
    this._sect = 1 == sect ? 1 : 2;
  }
  getDayGanIndex() {
    return 2 === this._sect ? this._lunar.getDayGanIndexExact2() : this._lunar.getDayGanIndexExact();
  }
  getDayZhiIndex() {
    return 2 === this._sect ? this._lunar.getDayZhiIndexExact2() : this._lunar.getDayZhiIndexExact();
  }
  getYear() {
    return this._lunar.getYearInGanZhiExact();
  }
  getYearGan() {
    return this._lunar.getYearGanExact();
  }
  getYearZhi() {
    return this._lunar.getYearZhiExact();
  }
  getYearHideGan() {
    const v = LunarUtil.ZHI_HIDE_GAN[this.getYearZhi()];
    return v ? v : [];
  }
  getYearWuXing() {
    const gan = LunarUtil.WU_XING_GAN[this.getYearGan()];
    const zhi = LunarUtil.WU_XING_ZHI[this.getYearZhi()];
    return gan && zhi ? gan + zhi : "";
  }
  getYearNaYin() {
    const v = LunarUtil.NAYIN[this.getYear()];
    return v ? v : "";
  }
  getYearShiShenGan() {
    const v = LunarUtil.SHI_SHEN[this.getDayGan() + this.getYearGan()];
    return v ? v : "";
  }
  getYearShiShenZhi() {
    const dayGan = this.getDayGan();
    const hideGan = LunarUtil.ZHI_HIDE_GAN[this.getYearZhi()];
    const l = [];
    if (hideGan) {
      for (let i = 0, j = hideGan.length; i < j; i++) {
        const v = LunarUtil.SHI_SHEN[dayGan + hideGan[i]];
        if (v) {
          l.push(v);
        }
      }
    }
    return l;
  }
  getDiShi(zhiIndex) {
    const offset = LunarUtil.CHANG_SHENG_OFFSET[this.getDayGan()];
    if (offset == void 0) {
      return "";
    }
    let index = offset + (this.getDayGanIndex() % 2 == 0 ? zhiIndex : -zhiIndex);
    if (index >= 12) {
      index -= 12;
    }
    if (index < 0) {
      index += 12;
    }
    return LunarUtil.CHANG_SHENG[index];
  }
  getYearDiShi() {
    return this.getDiShi(this._lunar.getYearZhiIndexExact());
  }
  getYearXun() {
    return this._lunar.getYearXunExact();
  }
  getYearXunKong() {
    return this._lunar.getYearXunKongExact();
  }
  getMonth() {
    return this._lunar.getMonthInGanZhiExact();
  }
  getMonthGan() {
    return this._lunar.getMonthGanExact();
  }
  getMonthZhi() {
    return this._lunar.getMonthZhiExact();
  }
  getMonthHideGan() {
    const v = LunarUtil.ZHI_HIDE_GAN[this.getMonthZhi()];
    return v ? v : [];
  }
  getMonthWuXing() {
    const gan = LunarUtil.WU_XING_GAN[this.getMonthGan()];
    const zhi = LunarUtil.WU_XING_ZHI[this.getMonthZhi()];
    return gan && zhi ? gan + zhi : "";
  }
  getMonthNaYin() {
    const v = LunarUtil.NAYIN[this.getMonth()];
    return v ? v : "";
  }
  getMonthShiShenGan() {
    const v = LunarUtil.SHI_SHEN[this.getDayGan() + this.getMonthGan()];
    return v ? v : "";
  }
  getMonthShiShenZhi() {
    const dayGan = this.getDayGan();
    const hideGan = LunarUtil.ZHI_HIDE_GAN[this.getMonthZhi()];
    const l = [];
    if (hideGan) {
      for (let i = 0, j = hideGan.length; i < j; i++) {
        const v = LunarUtil.SHI_SHEN[dayGan + hideGan[i]];
        if (v) {
          l.push(v);
        }
      }
    }
    return l;
  }
  getMonthDiShi() {
    return this.getDiShi(this._lunar.getMonthZhiIndexExact());
  }
  getMonthXun() {
    return this._lunar.getMonthXunExact();
  }
  getMonthXunKong() {
    return this._lunar.getMonthXunKongExact();
  }
  getDay() {
    return 2 === this._sect ? this._lunar.getDayInGanZhiExact2() : this._lunar.getDayInGanZhiExact();
  }
  getDayGan() {
    return 2 === this._sect ? this._lunar.getDayGanExact2() : this._lunar.getDayGanExact();
  }
  getDayZhi() {
    return 2 === this._sect ? this._lunar.getDayZhiExact2() : this._lunar.getDayZhiExact();
  }
  getDayHideGan() {
    const v = LunarUtil.ZHI_HIDE_GAN[this.getDayZhi()];
    return v ? v : [];
  }
  getDayWuXing() {
    const gan = LunarUtil.WU_XING_GAN[this.getDayGan()];
    const zhi = LunarUtil.WU_XING_ZHI[this.getDayZhi()];
    return gan && zhi ? gan + zhi : "";
  }
  getDayNaYin() {
    const v = LunarUtil.NAYIN[this.getDay()];
    return v ? v : "";
  }
  getDayShiShenGan() {
    return "\u65E5\u4E3B";
  }
  getDayShiShenZhi() {
    const dayGan = this.getDayGan();
    const hideGan = LunarUtil.ZHI_HIDE_GAN[this.getDayZhi()];
    const l = [];
    if (hideGan) {
      for (let i = 0, j = hideGan.length; i < j; i++) {
        const v = LunarUtil.SHI_SHEN[dayGan + hideGan[i]];
        if (v) {
          l.push(v);
        }
      }
    }
    return l;
  }
  getDayDiShi() {
    return this.getDiShi(this.getDayZhiIndex());
  }
  getDayXun() {
    return 2 === this._sect ? this._lunar.getDayXunExact2() : this._lunar.getDayXunExact();
  }
  getDayXunKong() {
    return 2 === this._sect ? this._lunar.getDayXunKongExact2() : this._lunar.getDayXunKongExact();
  }
  getTime() {
    return this._lunar.getTimeInGanZhi();
  }
  getTimeGan() {
    return this._lunar.getTimeGan();
  }
  getTimeZhi() {
    return this._lunar.getTimeZhi();
  }
  getTimeHideGan() {
    const v = LunarUtil.ZHI_HIDE_GAN[this.getTimeZhi()];
    return v ? v : [];
  }
  getTimeWuXing() {
    const gan = LunarUtil.WU_XING_GAN[this._lunar.getTimeGan()];
    const zhi = LunarUtil.WU_XING_ZHI[this._lunar.getTimeZhi()];
    return gan && zhi ? gan + zhi : "";
  }
  getTimeNaYin() {
    const v = LunarUtil.NAYIN[this.getTime()];
    return v ? v : "";
  }
  getTimeShiShenGan() {
    const v = LunarUtil.SHI_SHEN[this.getDayGan() + this.getTimeGan()];
    return v ? v : "";
  }
  getTimeShiShenZhi() {
    const dayGan = this.getDayGan();
    const hideGan = LunarUtil.ZHI_HIDE_GAN[this.getTimeZhi()];
    const l = [];
    if (hideGan) {
      for (let i = 0, j = hideGan.length; i < j; i++) {
        const v = LunarUtil.SHI_SHEN[dayGan + hideGan[i]];
        if (v) {
          l.push(v);
        }
      }
    }
    return l;
  }
  getTimeDiShi() {
    return this.getDiShi(this._lunar.getTimeZhiIndex());
  }
  getTimeXun() {
    return this._lunar.getTimeXun();
  }
  getTimeXunKong() {
    return this._lunar.getTimeXunKong();
  }
  getTaiYuan() {
    let ganIndex = this._lunar.getMonthGanIndexExact() + 1;
    if (ganIndex >= 10) {
      ganIndex -= 10;
    }
    let zhiIndex = this._lunar.getMonthZhiIndexExact() + 3;
    if (zhiIndex >= 12) {
      zhiIndex -= 12;
    }
    return LunarUtil.GAN[ganIndex + 1] + LunarUtil.ZHI[zhiIndex + 1];
  }
  getTaiYuanNaYin() {
    const v = LunarUtil.NAYIN[this.getTaiYuan()];
    return v ? v : "";
  }
  getTaiXi() {
    const ganIndex = 2 == this._sect ? this._lunar.getDayGanIndexExact2() : this._lunar.getDayGanIndexExact();
    const zhiIndex = 2 == this._sect ? this._lunar.getDayZhiIndexExact2() : this._lunar.getDayZhiIndexExact();
    return LunarUtil.HE_GAN_5[ganIndex] + LunarUtil.HE_ZHI_6[zhiIndex];
  }
  getTaiXiNaYin() {
    const v = LunarUtil.NAYIN[this.getTaiXi()];
    return v ? v : "";
  }
  getMingGong() {
    const monthZhiIndex = LunarUtil.find(this.getMonthZhi(), LunarUtil.MONTH_ZHI).index;
    const timeZhiIndex = LunarUtil.find(this.getTimeZhi(), LunarUtil.MONTH_ZHI).index;
    let offset = monthZhiIndex + timeZhiIndex;
    offset = (offset >= 14 ? 26 : 14) - offset;
    let ganIndex = (this._lunar.getYearGanIndexExact() + 1) * 2 + offset;
    while (ganIndex > 10) {
      ganIndex -= 10;
    }
    return LunarUtil.GAN[ganIndex] + LunarUtil.MONTH_ZHI[offset];
  }
  getMingGongNaYin() {
    const v = LunarUtil.NAYIN[this.getMingGong()];
    return v ? v : "";
  }
  getShenGong() {
    const monthZhiIndex = LunarUtil.find(this.getMonthZhi(), LunarUtil.MONTH_ZHI).index;
    const timeZhiIndex = LunarUtil.find(this.getTimeZhi(), LunarUtil.ZHI).index;
    let offset = monthZhiIndex + timeZhiIndex;
    if (offset > 12) {
      offset -= 12;
    }
    let ganIndex = (this._lunar.getYearGanIndexExact() + 1) * 2 + offset;
    while (ganIndex > 10) {
      ganIndex -= 10;
    }
    return LunarUtil.GAN[ganIndex] + LunarUtil.MONTH_ZHI[offset];
  }
  getShenGongNaYin() {
    const v = LunarUtil.NAYIN[this.getShenGong()];
    return v ? v : "";
  }
  getLunar() {
    return this._lunar;
  }
  getYun(gender, sect = 1) {
    return new Yun(this._lunar, gender, sect);
  }
  toString() {
    return this.getYear() + " " + this.getMonth() + " " + this.getDay() + " " + this.getTime();
  }
};
var _NineStar = class {
  static fromIndex(index) {
    return new _NineStar(index);
  }
  constructor(index) {
    this._index = index;
  }
  getNumber() {
    return NineStarUtil.NUMBER[this._index];
  }
  getColor() {
    return NineStarUtil.COLOR[this._index];
  }
  getWuXing() {
    return NineStarUtil.WU_XING[this._index];
  }
  getPosition() {
    return NineStarUtil.POSITION[this._index];
  }
  getPositionDesc() {
    const v = LunarUtil.POSITION_DESC[this.getPosition()];
    return v ? v : "";
  }
  getNameInXuanKong() {
    return _NineStar.NAME_XUAN_KONG[this._index];
  }
  getNameInBeiDou() {
    return _NineStar.NAME_BEI_DOU[this._index];
  }
  getNameInQiMen() {
    return _NineStar.NAME_QI_MEN[this._index];
  }
  getNameInTaiYi() {
    return _NineStar.NAME_TAI_YI[this._index];
  }
  getLuckInQiMen() {
    return _NineStar.LUCK_QI_MEN[this._index];
  }
  getLuckInXuanKong() {
    return NineStarUtil.LUCK_XUAN_KONG[this._index];
  }
  getYinYangInQiMen() {
    return NineStarUtil.YIN_YANG_QI_MEN[this._index];
  }
  getTypeInTaiYi() {
    return _NineStar.TYPE_TAI_YI[this._index];
  }
  getBaMenInQiMen() {
    return _NineStar.BA_MEN_QI_MEN[this._index];
  }
  getSongInTaiYi() {
    return _NineStar.SONG_TAI_YI[this._index];
  }
  getIndex() {
    return this._index;
  }
  toString() {
    return this.getNumber() + this.getColor() + this.getWuXing() + this.getNameInBeiDou();
  }
  toFullString() {
    let s = this.getNumber();
    s += this.getColor();
    s += this.getWuXing();
    s += " ";
    s += this.getPosition();
    s += "(";
    s += this.getPositionDesc();
    s += ") ";
    s += this.getNameInBeiDou();
    s += " \u7384\u7A7A[";
    s += this.getNameInXuanKong();
    s += " ";
    s += this.getLuckInXuanKong();
    s += "] \u5947\u95E8[";
    s += this.getNameInQiMen();
    s += " ";
    s += this.getLuckInQiMen();
    if (this.getBaMenInQiMen().length > 0) {
      s += " ";
      s += this.getBaMenInQiMen();
      s += "\u95E8";
    }
    s += " ";
    s += this.getYinYangInQiMen();
    s += "] \u592A\u4E59[";
    s += this.getNameInTaiYi();
    s += " ";
    s += this.getTypeInTaiYi();
    s += "]";
    return s;
  }
};
var NineStar = _NineStar;
NineStar.NAME_BEI_DOU = ["\u5929\u67A2", "\u5929\u7487", "\u5929\u7391", "\u5929\u6743", "\u7389\u8861", "\u5F00\u9633", "\u6447\u5149", "\u6D1E\u660E", "\u9690\u5143"];
NineStar.NAME_XUAN_KONG = ["\u8D2A\u72FC", "\u5DE8\u95E8", "\u7984\u5B58", "\u6587\u66F2", "\u5EC9\u8D1E", "\u6B66\u66F2", "\u7834\u519B", "\u5DE6\u8F85", "\u53F3\u5F3C"];
NineStar.NAME_QI_MEN = ["\u5929\u84EC", "\u5929\u82AE", "\u5929\u51B2", "\u5929\u8F85", "\u5929\u79BD", "\u5929\u5FC3", "\u5929\u67F1", "\u5929\u4EFB", "\u5929\u82F1"];
NineStar.BA_MEN_QI_MEN = ["\u4F11", "\u6B7B", "\u4F24", "\u675C", "", "\u5F00", "\u60CA", "\u751F", "\u666F"];
NineStar.NAME_TAI_YI = ["\u592A\u4E59", "\u6444\u63D0", "\u8F69\u8F95", "\u62DB\u6447", "\u5929\u7B26", "\u9752\u9F99", "\u54B8\u6C60", "\u592A\u9634", "\u5929\u4E59"];
NineStar.TYPE_TAI_YI = ["\u5409\u795E", "\u51F6\u795E", "\u5B89\u795E", "\u5B89\u795E", "\u51F6\u795E", "\u5409\u795E", "\u51F6\u795E", "\u5409\u795E", "\u5409\u795E"];
NineStar.SONG_TAI_YI = ["\u95E8\u4E2D\u592A\u4E59\u660E\uFF0C\u661F\u5B98\u53F7\u8D2A\u72FC\uFF0C\u8D4C\u5F69\u8D22\u559C\u65FA\uFF0C\u5A5A\u59FB\u5927\u5409\u660C\uFF0C\u51FA\u5165\u65E0\u963B\u6321\uFF0C\u53C2\u8C12\u89C1\u8D24\u826F\uFF0C\u6B64\u884C\u4E09\u4E94\u91CC\uFF0C\u9ED1\u8863\u522B\u9634\u9633\u3002", "\u95E8\u524D\u89C1\u6444\u63D0\uFF0C\u767E\u4E8B\u5FC5\u5FE7\u7591\uFF0C\u76F8\u751F\u72B9\u81EA\u53EF\uFF0C\u76F8\u514B\u7978\u5FC5\u4E34\uFF0C\u6B7B\u95E8\u5E76\u76F8\u4F1A\uFF0C\u8001\u5987\u54ED\u60B2\u557C\uFF0C\u6C42\u8C0B\u5E76\u5409\u4E8B\uFF0C\u5C3D\u7686\u4E0D\u76F8\u5B9C\uFF0C\u53EA\u53EF\u85CF\u9690\u9041\uFF0C\u82E5\u52A8\u4F24\u8EAB\u75BE\u3002", "\u51FA\u5165\u4F1A\u8F69\u8F95\uFF0C\u51E1\u4E8B\u5FC5\u7F20\u7275\uFF0C\u76F8\u751F\u5168\u4E0D\u7F8E\uFF0C\u76F8\u514B\u66F4\u5FE7\u714E\uFF0C\u8FDC\u884C\u591A\u4E0D\u5229\uFF0C\u535A\u5F69\u5C3D\u8F93\u94B1\uFF0C\u4E5D\u5929\u7384\u5973\u6CD5\uFF0C\u53E5\u53E5\u4E0D\u865A\u8A00\u3002", "\u62DB\u6447\u53F7\u6728\u661F\uFF0C\u5F53\u4E4B\u4E8B\u83AB\u884C\uFF0C\u76F8\u514B\u884C\u4EBA\u963B\uFF0C\u9634\u4EBA\u53E3\u820C\u8FCE\uFF0C\u68A6\u5BD0\u591A\u60CA\u60E7\uFF0C\u5C4B\u54CD\u65A7\u81EA\u9E23\uFF0C\u9634\u9633\u6D88\u606F\u7406\uFF0C\u4E07\u6CD5\u5F17\u8FDD\u60C5\u3002", "\u4E94\u9B3C\u4E3A\u5929\u7B26\uFF0C\u5F53\u95E8\u9634\u5973\u8C0B\uFF0C\u76F8\u514B\u65E0\u597D\u4E8B\uFF0C\u884C\u8DEF\u963B\u4E2D\u9014\uFF0C\u8D70\u5931\u96BE\u5BFB\u89C5\uFF0C\u9053\u9022\u6709\u5C3C\u59D1\uFF0C\u6B64\u661F\u5F53\u95E8\u503C\uFF0C\u4E07\u4E8B\u6709\u707E\u9664\u3002", "\u795E\u5149\u8DC3\u9752\u9F99\uFF0C\u8D22\u6C14\u559C\u91CD\u91CD\uFF0C\u6295\u5165\u6709\u9152\u98DF\uFF0C\u8D4C\u5F69\u6700\u5174\u9686\uFF0C\u66F4\u9022\u76F8\u751F\u65FA\uFF0C\u4F11\u8A00\u514B\u7834\u51F6\uFF0C\u89C1\u8D35\u5B89\u8425\u5BE8\uFF0C\u4E07\u4E8B\u603B\u5409\u540C\u3002", "\u543E\u5C06\u4E3A\u54B8\u6C60\uFF0C\u5F53\u4E4B\u5C3D\u4E0D\u5B9C\uFF0C\u51FA\u5165\u591A\u4E0D\u5229\uFF0C\u76F8\u514B\u6709\u707E\u60C5\uFF0C\u8D4C\u5F69\u5168\u8F93\u5C3D\uFF0C\u6C42\u8D22\u7A7A\u624B\u56DE\uFF0C\u4ED9\u4EBA\u771F\u5999\u8BED\uFF0C\u611A\u4EBA\u83AB\u4E0E\u77E5\uFF0C\u52A8\u7528\u865A\u60CA\u9000\uFF0C\u53CD\u590D\u9006\u98CE\u5439\u3002", "\u5750\u4E34\u592A\u9634\u661F\uFF0C\u767E\u7978\u4E0D\u76F8\u4FB5\uFF0C\u6C42\u8C0B\u6089\u6210\u5C31\uFF0C\u77E5\u4EA4\u6709\u89C5\u5BFB\uFF0C\u56DE\u98CE\u5F52\u6765\u8DEF\uFF0C\u6050\u6709\u6B83\u4F0F\u8D77\uFF0C\u5BC6\u8BED\u4E2D\u8BB0\u53D6\uFF0C\u614E\u4E4E\u83AB\u8F7B\u884C\u3002", "\u8FCE\u6765\u5929\u4E59\u661F\uFF0C\u76F8\u9022\u767E\u4E8B\u5174\uFF0C\u8FD0\u7528\u548C\u5408\u5E86\uFF0C\u8336\u9152\u559C\u76F8\u8FCE\uFF0C\u6C42\u8C0B\u5E76\u5AC1\u5A36\uFF0C\u597D\u5408\u6709\u5929\u6210\uFF0C\u7978\u798F\u5982\u795E\u9A8C\uFF0C\u5409\u51F6\u751A\u5206\u660E\u3002"];
NineStar.LUCK_QI_MEN = ["\u5927\u51F6", "\u5927\u51F6", "\u5C0F\u5409", "\u5927\u5409", "\u5927\u5409", "\u5927\u5409", "\u5C0F\u51F6", "\u5C0F\u5409", "\u5C0F\u51F6"];
var ShuJiu = class {
  constructor(name, index) {
    this._name = name;
    this._index = index;
  }
  getName() {
    return this._name;
  }
  setName(name) {
    this._name = name;
  }
  getIndex() {
    return this._index;
  }
  setIndex(index) {
    this._index = index;
  }
  toString() {
    return this.getName();
  }
  toFullString() {
    return this.getName() + "\u7B2C" + this.getIndex() + "\u5929";
  }
};
var Fu = class {
  constructor(name, index) {
    this._name = name;
    this._index = index;
  }
  getName() {
    return this._name;
  }
  setName(name) {
    this._name = name;
  }
  getIndex() {
    return this._index;
  }
  setIndex(index) {
    this._index = index;
  }
  toString() {
    return this.getName();
  }
  toFullString() {
    return this.getName() + "\u7B2C" + this.getIndex() + "\u5929";
  }
};
var LunarMonth = class _LunarMonth {
  static fromYm(lunarYear, lunarMonth) {
    return LunarYear.fromYear(lunarYear).getMonth(lunarMonth);
  }
  constructor(lunarYear, lunarMonth, dayCount, firstJulianDay, index) {
    this._year = lunarYear;
    this._month = lunarMonth;
    this._dayCount = dayCount;
    this._firstJulianDay = firstJulianDay;
    this._index = index;
    this._zhiIndex = (Math.abs(lunarMonth) - 1 + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12;
  }
  getYear() {
    return this._year;
  }
  getMonth() {
    return this._month;
  }
  getIndex() {
    return this._index;
  }
  getGanIndex() {
    const offset = (LunarYear.fromYear(this._year).getGanIndex() + 1) % 5 * 2;
    return (Math.abs(this._month) - 1 + offset) % 10;
  }
  getZhiIndex() {
    return this._zhiIndex;
  }
  getGan() {
    return LunarUtil.GAN[this.getGanIndex() + 1];
  }
  getZhi() {
    return LunarUtil.ZHI[this._zhiIndex + 1];
  }
  getGanZhi() {
    return this.getGan() + this.getZhi();
  }
  isLeap() {
    return this._month < 0;
  }
  getDayCount() {
    return this._dayCount;
  }
  getFirstJulianDay() {
    return this._firstJulianDay;
  }
  getPositionXi() {
    return LunarUtil.POSITION_XI[this.getGanIndex() + 1];
  }
  getPositionXiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionXi()];
  }
  getPositionYangGui() {
    return LunarUtil.POSITION_YANG_GUI[this.getGanIndex() + 1];
  }
  getPositionYangGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYangGui()];
  }
  getPositionYinGui() {
    return LunarUtil.POSITION_YIN_GUI[this.getGanIndex() + 1];
  }
  getPositionYinGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYinGui()];
  }
  getPositionFu(sect = 2) {
    return (1 == sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this.getGanIndex() + 1];
  }
  getPositionFuDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getPositionFu(sect)];
  }
  getPositionCai() {
    return LunarUtil.POSITION_CAI[this.getGanIndex() + 1];
  }
  getPositionCaiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionCai()];
  }
  getPositionTaiSui() {
    const m = Math.abs(this._month);
    switch (m) {
      case 1:
      case 5:
      case 9:
        return "\u826E";
      case 3:
      case 7:
      case 11:
        return "\u5764";
      case 4:
      case 8:
      case 12:
        return "\u5DFD";
    }
    return LunarUtil.POSITION_GAN[Solar.fromJulianDay(this.getFirstJulianDay()).getLunar().getMonthGanIndex()];
  }
  getPositionTaiSuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionTaiSui()];
  }
  getNineStar() {
    const index = LunarYear.fromYear(this._year).getZhiIndex() % 3;
    const m = Math.abs(this._month);
    const monthZhiIndex = (13 + m) % 12;
    let n = 27 - index * 3;
    if (monthZhiIndex < LunarUtil.BASE_MONTH_ZHI_INDEX) {
      n -= 3;
    }
    const offset = (n - monthZhiIndex) % 9;
    return NineStar.fromIndex(offset);
  }
  toString() {
    return `${this.getYear()}\u5E74${this.isLeap() ? "\u95F0" : ""}${LunarUtil.MONTH[Math.abs(this.getMonth())]}\u6708(${this.getDayCount()})\u5929`;
  }
  next(n) {
    if (0 == n) {
      return _LunarMonth.fromYm(this._year, this._month);
    } else {
      let rest = Math.abs(n);
      let ny = this._year;
      let iy = ny;
      let im = this._month;
      let index = 0;
      let months = LunarYear.fromYear(ny).getMonths();
      if (n > 0) {
        while (true) {
          const size = months.length;
          for (let i = 0; i < size; i++) {
            const m = months[i];
            if (m.getYear() === iy && m.getMonth() === im) {
              index = i;
              break;
            }
          }
          const more = size - index - 1;
          if (rest < more) {
            break;
          }
          rest -= more;
          const lastMonth = months[size - 1];
          iy = lastMonth.getYear();
          im = lastMonth.getMonth();
          ny++;
          months = LunarYear.fromYear(ny).getMonths();
        }
        return months[index + rest];
      } else {
        while (true) {
          const size = months.length;
          for (let i = 0; i < size; i++) {
            const m = months[i];
            if (m.getYear() === iy && m.getMonth() === im) {
              index = i;
              break;
            }
          }
          if (rest <= index) {
            break;
          }
          rest -= index;
          const firstMonth = months[0];
          iy = firstMonth.getYear();
          im = firstMonth.getMonth();
          ny--;
          months = LunarYear.fromYear(ny).getMonths();
        }
        return months[index - rest];
      }
    }
  }
};
var _ShouXingUtil = class {
  static decode(s) {
    const o = "0000000000";
    const o2 = o + o;
    s = s.replace(/J/g, "00");
    s = s.replace(/I/g, "000");
    s = s.replace(/H/g, "0000");
    s = s.replace(/G/g, "00000");
    s = s.replace(/t/g, "02");
    s = s.replace(/s/g, "002");
    s = s.replace(/r/g, "0002");
    s = s.replace(/q/g, "00002");
    s = s.replace(/p/g, "000002");
    s = s.replace(/o/g, "0000002");
    s = s.replace(/n/g, "00000002");
    s = s.replace(/m/g, "000000002");
    s = s.replace(/l/g, "0000000002");
    s = s.replace(/k/g, "01");
    s = s.replace(/j/g, "0101");
    s = s.replace(/i/g, "001");
    s = s.replace(/h/g, "001001");
    s = s.replace(/g/g, "0001");
    s = s.replace(/f/g, "00001");
    s = s.replace(/e/g, "000001");
    s = s.replace(/d/g, "0000001");
    s = s.replace(/c/g, "00000001");
    s = s.replace(/b/g, "000000001");
    s = s.replace(/a/g, "0000000001");
    s = s.replace(/A/g, o2 + o2 + o2);
    s = s.replace(/B/g, o2 + o2 + o);
    s = s.replace(/C/g, o2 + o2);
    s = s.replace(/D/g, o2 + o);
    s = s.replace(/E/g, o2);
    s = s.replace(/F/g, o);
    return s;
  }
  static nutationLon2(t) {
    let a = -1.742 * t;
    const t2 = t * t;
    let dl = 0;
    for (let i = 0, j = _ShouXingUtil.NUT_B.length; i < j; i += 5) {
      dl += (_ShouXingUtil.NUT_B[i + 3] + a) * Math.sin(_ShouXingUtil.NUT_B[i] + _ShouXingUtil.NUT_B[i + 1] * t + _ShouXingUtil.NUT_B[i + 2] * t2);
      a = 0;
    }
    return dl / 100 / _ShouXingUtil.SECOND_PER_RAD;
  }
  static eLon(t, n) {
    t /= 10;
    let v = 0, tn = 1;
    const pn = 1;
    const m0 = _ShouXingUtil.XL0[pn + 1] - _ShouXingUtil.XL0[pn];
    for (let i = 0; i < 6; i++, tn *= t) {
      const n1 = Math.floor(_ShouXingUtil.XL0[pn + i]);
      const n2 = Math.floor(_ShouXingUtil.XL0[pn + 1 + i]);
      const n0 = n2 - n1;
      if (n0 == 0) {
        continue;
      }
      let m = 0;
      if (n < 0) {
        m = n2;
      } else {
        m = Math.floor(3 * n * n0 / m0 + 0.5 + n1);
        if (i != 0) {
          m += 3;
        }
        if (m > n2) {
          m = n2;
        }
      }
      let c = 0;
      for (let j = n1; j < m; j += 3) {
        c += _ShouXingUtil.XL0[j] * Math.cos(_ShouXingUtil.XL0[j + 1] + t * _ShouXingUtil.XL0[j + 2]);
      }
      v += c * tn;
    }
    v /= _ShouXingUtil.XL0[0];
    const t2 = t * t;
    v += (-0.0728 - 2.7702 * t - 1.1019 * t2 - 0.0996 * t2 * t) / _ShouXingUtil.SECOND_PER_RAD;
    return v;
  }
  static mLon(t, n) {
    const ob = _ShouXingUtil.XL1;
    const obl = ob[0].length;
    let tn = 1;
    let v = 0;
    let t2 = t * t, t3 = t2 * t, t4 = t3 * t;
    const t5 = t4 * t;
    const tx = t - 10;
    v += (3.81034409 + 8399.684730072 * t - 3319e-8 * t2 + 311e-10 * t3 - 2033e-13 * t4) * _ShouXingUtil.SECOND_PER_RAD;
    v += 5028.792262 * t + 1.1124406 * t2 + 7699e-8 * t3 - 23479e-9 * t4 - 178e-10 * t5;
    if (tx > 0) {
      v += -0.866 + 1.43 * tx + 0.054 * tx * tx;
    }
    t2 /= 1e4;
    t3 /= 1e8;
    t4 /= 1e8;
    n *= 6;
    if (n < 0) {
      n = obl;
    }
    for (let i = 0, x = ob.length; i < x; i++, tn *= t) {
      const f = ob[i];
      const l = f.length;
      let m = Math.floor(n * l / obl + 0.5);
      if (i > 0) {
        m += 6;
      }
      if (m >= l) {
        m = l;
      }
      let c = 0;
      for (let j = 0; j < m; j += 6) {
        c += f[j] * Math.cos(f[j + 1] + t * f[j + 2] + t2 * f[j + 3] + t3 * f[j + 4] + t4 * f[j + 5]);
      }
      v += c * tn;
    }
    v /= _ShouXingUtil.SECOND_PER_RAD;
    return v;
  }
  static gxcSunLon(t) {
    const t2 = t * t;
    const v = -0.043126 + 628.301955 * t - 2732e-9 * t2;
    const e = 0.016708634 - 42037e-9 * t - 1267e-10 * t2;
    return -20.49552 * (1 + e * Math.cos(v)) / _ShouXingUtil.SECOND_PER_RAD;
  }
  static ev(t) {
    const f = 628.307585 * t;
    return 628.332 + 21 * Math.sin(1.527 + f) + 0.44 * Math.sin(1.48 + f * 2) + 0.129 * Math.sin(5.82 + f) * t + 55e-5 * Math.sin(4.21 + f) * t * t;
  }
  static saLon(t, n) {
    return _ShouXingUtil.eLon(t, n) + _ShouXingUtil.nutationLon2(t) + _ShouXingUtil.gxcSunLon(t) + Math.PI;
  }
  static dtExt(y, jsd) {
    const dy = (y - 1820) / 100;
    return -20 + jsd * dy * dy;
  }
  static dtCalc(y) {
    const size = _ShouXingUtil.DT_AT.length;
    const y0 = _ShouXingUtil.DT_AT[size - 2];
    const t0 = _ShouXingUtil.DT_AT[size - 1];
    if (y >= y0) {
      const jsd = 31;
      if (y > y0 + 100) {
        return _ShouXingUtil.dtExt(y, jsd);
      }
      return _ShouXingUtil.dtExt(y, jsd) - (_ShouXingUtil.dtExt(y0, jsd) - t0) * (y0 + 100 - y) / 100;
    }
    let i = 0;
    for (; i < size; i += 5) {
      if (y < _ShouXingUtil.DT_AT[i + 5]) {
        break;
      }
    }
    const t1 = (y - _ShouXingUtil.DT_AT[i]) / (_ShouXingUtil.DT_AT[i + 5] - _ShouXingUtil.DT_AT[i]) * 10;
    const t2 = t1 * t1;
    const t3 = t2 * t1;
    return _ShouXingUtil.DT_AT[i + 1] + _ShouXingUtil.DT_AT[i + 2] * t1 + _ShouXingUtil.DT_AT[i + 3] * t2 + _ShouXingUtil.DT_AT[i + 4] * t3;
  }
  static dtT(t) {
    return _ShouXingUtil.dtCalc(t / 365.2425 + 2e3) / _ShouXingUtil.SECOND_PER_DAY;
  }
  static mv(t) {
    let v = 8399.71 - 914 * Math.sin(0.7848 + 8328.691425 * t + 1523e-7 * t * t);
    v -= 179 * Math.sin(2.543 + 15542.7543 * t) + 160 * Math.sin(0.1874 + 7214.0629 * t) + 62 * Math.sin(3.14 + 16657.3828 * t) + 34 * Math.sin(4.827 + 16866.9323 * t) + 22 * Math.sin(4.9 + 23871.4457 * t) + 12 * Math.sin(2.59 + 14914.4523 * t) + 7 * Math.sin(0.23 + 6585.7609 * t) + 5 * Math.sin(0.9 + 25195.624 * t) + 5 * Math.sin(2.32 - 7700.3895 * t) + 5 * Math.sin(3.88 + 8956.9934 * t) + 5 * Math.sin(0.49 + 7771.3771 * t);
    return v;
  }
  static saLonT(w) {
    let v = 628.3319653318;
    let t = (w - 1.75347 - Math.PI) / v;
    v = _ShouXingUtil.ev(t);
    t += (w - _ShouXingUtil.saLon(t, 10)) / v;
    v = _ShouXingUtil.ev(t);
    t += (w - _ShouXingUtil.saLon(t, -1)) / v;
    return t;
  }
  static msaLon(t, mn, sn) {
    return _ShouXingUtil.mLon(t, mn) + -34e-7 - (_ShouXingUtil.eLon(t, sn) + _ShouXingUtil.gxcSunLon(t) + Math.PI);
  }
  static msaLonT(w) {
    let v = 7771.37714500204;
    let t = (w + 1.08472) / v;
    t += (w - _ShouXingUtil.msaLon(t, 3, 3)) / v;
    v = _ShouXingUtil.mv(t) - _ShouXingUtil.ev(t);
    t += (w - _ShouXingUtil.msaLon(t, 20, 10)) / v;
    t += (w - _ShouXingUtil.msaLon(t, -1, 60)) / v;
    return t;
  }
  static saLonT2(w) {
    const v = 628.3319653318;
    let t = (w - 1.75347 - Math.PI) / v;
    t -= (5297e-9 * t * t + 0.0334166 * Math.cos(4.669257 + 628.307585 * t) + 2061e-7 * Math.cos(2.67823 + 628.307585 * t) * t) / v;
    t += (w - _ShouXingUtil.eLon(t, 8) - Math.PI + (20.5 + 17.2 * Math.sin(2.1824 - 33.75705 * t)) / _ShouXingUtil.SECOND_PER_RAD) / v;
    return t;
  }
  static msaLonT2(w) {
    let v = 7771.37714500204;
    let t = (w + 1.08472) / v;
    let t2 = t * t;
    t -= (-3309e-8 * t2 + 0.10976 * Math.cos(0.784758 + 8328.6914246 * t + 152292e-9 * t2) + 0.02224 * Math.cos(0.1874 + 7214.0628654 * t - 21848e-8 * t2) - 0.03342 * Math.cos(4.669257 + 628.307585 * t)) / v;
    t2 = t * t;
    const l = _ShouXingUtil.mLon(t, 20) - (4.8950632 + 628.3319653318 * t + 5297e-9 * t2 + 0.0334166 * Math.cos(4.669257 + 628.307585 * t) + 2061e-7 * Math.cos(2.67823 + 628.307585 * t) * t + 349e-6 * Math.cos(4.6261 + 1256.61517 * t) - 20.5 / _ShouXingUtil.SECOND_PER_RAD);
    v = 7771.38 - 914 * Math.sin(0.7848 + 8328.691425 * t + 1523e-7 * t2) - 179 * Math.sin(2.543 + 15542.7543 * t) - 160 * Math.sin(0.1874 + 7214.0629 * t);
    t += (w - l) / v;
    return t;
  }
  static qiHigh(w) {
    let t = _ShouXingUtil.saLonT2(w) * 36525;
    t = t - _ShouXingUtil.dtT(t) + _ShouXingUtil.ONE_THIRD;
    const v = (t + 0.5) % 1 * _ShouXingUtil.SECOND_PER_DAY;
    if (v < 1200 || v > _ShouXingUtil.SECOND_PER_DAY - 1200) {
      t = _ShouXingUtil.saLonT(w) * 36525 - _ShouXingUtil.dtT(t) + _ShouXingUtil.ONE_THIRD;
    }
    return t;
  }
  static shuoHigh(w) {
    let t = _ShouXingUtil.msaLonT2(w) * 36525;
    t = t - _ShouXingUtil.dtT(t) + _ShouXingUtil.ONE_THIRD;
    const v = (t + 0.5) % 1 * _ShouXingUtil.SECOND_PER_DAY;
    if (v < 1800 || v > _ShouXingUtil.SECOND_PER_DAY - 1800) {
      t = _ShouXingUtil.msaLonT(w) * 36525 - _ShouXingUtil.dtT(t) + _ShouXingUtil.ONE_THIRD;
    }
    return t;
  }
  static qiLow(w) {
    const v = 628.3319653318;
    let t = (w - 4.895062166) / v;
    t -= (53 * t * t + 334116 * Math.cos(4.67 + 628.307585 * t) + 2061 * Math.cos(2.678 + 628.3076 * t) * t) / v / 1e7;
    const n = 4895062166e-2 + 6283319653318e-3 * t + 53 * t * t + 334166 * Math.cos(4.669257 + 628.307585 * t) + 3489 * Math.cos(4.6261 + 1256.61517 * t) + 2060.6 * Math.cos(2.67823 + 628.307585 * t) * t - 994 - 834 * Math.sin(2.1824 - 33.75705 * t);
    t -= (n / 1e7 - w) / 628.332 + (32 * (t + 1.8) * (t + 1.8) - 20) / _ShouXingUtil.SECOND_PER_DAY / 36525;
    return t * 36525 + _ShouXingUtil.ONE_THIRD;
  }
  static shuoLow(w) {
    const v = 7771.37714500204;
    let t = (w + 1.08472) / v;
    t -= (-331e-7 * t * t + 0.10976 * Math.cos(0.785 + 8328.6914 * t) + 0.02224 * Math.cos(0.187 + 7214.0629 * t) - 0.03342 * Math.cos(4.669 + 628.3076 * t)) / v + (32 * (t + 1.8) * (t + 1.8) - 20) / _ShouXingUtil.SECOND_PER_DAY / 36525;
    return t * 36525 + _ShouXingUtil.ONE_THIRD;
  }
  static calcShuo(jd) {
    const size = _ShouXingUtil.SHUO_KB.length;
    let d = 0;
    const pc = 14;
    jd += Solar.J2000;
    const f1 = _ShouXingUtil.SHUO_KB[0] - pc;
    const f2 = _ShouXingUtil.SHUO_KB[size - 1] - pc;
    const f3 = 2436935;
    if (jd < f1 || jd >= f3) {
      d = Math.floor(_ShouXingUtil.shuoHigh(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
    } else if (jd >= f1 && jd < f2) {
      let i = 0;
      for (; i < size; i += 2) {
        if (jd + pc < _ShouXingUtil.SHUO_KB[i + 2]) {
          break;
        }
      }
      d = _ShouXingUtil.SHUO_KB[i] + _ShouXingUtil.SHUO_KB[i + 1] * Math.floor((jd + pc - _ShouXingUtil.SHUO_KB[i]) / _ShouXingUtil.SHUO_KB[i + 1]);
      d = Math.floor(d + 0.5);
      if (d == 1683460) {
        d++;
      }
      d -= Solar.J2000;
    } else if (jd >= f2 && jd < f3) {
      d = Math.floor(_ShouXingUtil.shuoLow(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
      const from = Math.floor((jd - f2) / 29.5306);
      const n = _ShouXingUtil.SB.substring(from, from + 1);
      if ("1" == n) {
        d += 1;
      } else if ("2" == n) {
        d -= 1;
      }
    }
    return d;
  }
  static calcQi(jd) {
    const size = _ShouXingUtil.QI_KB.length;
    let d = 0;
    const pc = 7;
    jd += Solar.J2000;
    const f1 = _ShouXingUtil.QI_KB[0] - pc;
    const f2 = _ShouXingUtil.QI_KB[size - 1] - pc;
    const f3 = 2436935;
    if (jd < f1 || jd >= f3) {
      d = Math.floor(_ShouXingUtil.qiHigh(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
    } else if (jd >= f1 && jd < f2) {
      let i = 0;
      for (; i < size; i += 2) {
        if (jd + pc < _ShouXingUtil.QI_KB[i + 2]) {
          break;
        }
      }
      d = _ShouXingUtil.QI_KB[i] + _ShouXingUtil.QI_KB[i + 1] * Math.floor((jd + pc - _ShouXingUtil.QI_KB[i]) / _ShouXingUtil.QI_KB[i + 1]);
      d = Math.floor(d + 0.5);
      if (d == 1683460) {
        d++;
      }
      d -= Solar.J2000;
    } else if (jd >= f2 && jd < f3) {
      d = Math.floor(_ShouXingUtil.qiLow(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
      const from = Math.floor((jd - f2) / 365.2422 * 24);
      const n = _ShouXingUtil.QB.substring(from, from + 1);
      if ("1" == n) {
        d += 1;
      } else if ("2" == n) {
        d -= 1;
      }
    }
    return d;
  }
  static qiAccurate(w) {
    const t = _ShouXingUtil.saLonT(w) * 36525;
    return t - _ShouXingUtil.dtT(t) + _ShouXingUtil.ONE_THIRD;
  }
  static qiAccurate2(jd) {
    const d = Math.PI / 12;
    const w = Math.floor((jd + 293) / 365.2422 * 24) * d;
    const a = _ShouXingUtil.qiAccurate(w);
    if (a - jd > 5) {
      return _ShouXingUtil.qiAccurate(w - d);
    }
    if (a - jd < -5) {
      return _ShouXingUtil.qiAccurate(w + d);
    }
    return a;
  }
};
var ShouXingUtil = _ShouXingUtil;
ShouXingUtil.ONE_THIRD = 1 / 3;
ShouXingUtil.SECOND_PER_DAY = 86400;
ShouXingUtil.SECOND_PER_RAD = 648e3 / Math.PI;
ShouXingUtil.NUT_B = [
  2.1824,
  -33.75705,
  36e-6,
  -1720,
  920,
  3.5069,
  1256.66393,
  11e-6,
  -132,
  57,
  1.3375,
  16799.4182,
  -51e-6,
  -23,
  10,
  4.3649,
  -67.5141,
  72e-6,
  21,
  -9,
  0.04,
  -628.302,
  0,
  -14,
  0,
  2.36,
  8328.691,
  0,
  7,
  0,
  3.46,
  1884.966,
  0,
  -5,
  2,
  5.44,
  16833.175,
  0,
  -4,
  2,
  3.69,
  25128.11,
  0,
  -3,
  0,
  3.55,
  628.362,
  0,
  2,
  0
];
ShouXingUtil.DT_AT = [
  -4e3,
  108371.7,
  -13036.8,
  392,
  0,
  -500,
  17201,
  -627.82,
  16.17,
  -0.3413,
  -150,
  12200.6,
  -346.41,
  5.403,
  -0.1593,
  150,
  9113.8,
  -328.13,
  -1.647,
  0.0377,
  500,
  5707.5,
  -391.41,
  0.915,
  0.3145,
  900,
  2203.4,
  -283.45,
  13.034,
  -0.1778,
  1300,
  490.1,
  -57.35,
  2.085,
  -72e-4,
  1600,
  120,
  -9.81,
  -1.532,
  0.1403,
  1700,
  10.2,
  -0.91,
  0.51,
  -0.037,
  1800,
  13.4,
  -0.72,
  0.202,
  -0.0193,
  1830,
  7.8,
  -1.81,
  0.416,
  -0.0247,
  1860,
  8.3,
  -0.13,
  -0.406,
  0.0292,
  1880,
  -5.4,
  0.32,
  -0.183,
  0.0173,
  1900,
  -2.3,
  2.06,
  0.169,
  -0.0135,
  1920,
  21.2,
  1.69,
  -0.304,
  0.0167,
  1940,
  24.2,
  1.22,
  -0.064,
  31e-4,
  1960,
  33.2,
  0.51,
  0.231,
  -0.0109,
  1980,
  51,
  1.29,
  -0.026,
  32e-4,
  2e3,
  63.87,
  0.1,
  0,
  0,
  2005,
  64.7,
  0.21,
  0,
  0,
  2012,
  66.8,
  0.22,
  0,
  0,
  // 2018, 69.0, 0.36, 0, 0,
  // 使用skyfeild的DE440s△T预测数据拟合
  2016,
  68.1024,
  0.5456,
  -0.0542,
  -1172e-6,
  2020,
  69.3612,
  0.0422,
  -0.0502,
  6216e-6,
  2024,
  69.1752,
  -0.0335,
  -48e-4,
  811e-6,
  2028,
  69.0206,
  -0.0275,
  55e-4,
  -14e-6,
  2032,
  68.9981,
  0.0163,
  54e-4,
  6e-6,
  2036,
  69.1498,
  0.0599,
  53e-4,
  26e-6,
  2040,
  69.4751,
  0.1035,
  51e-4,
  46e-6,
  2044,
  69.9737,
  0.1469,
  5e-3,
  66e-6,
  2048,
  70.6451,
  0.1903,
  49e-4,
  85e-6,
  2050,
  71.0457
];
ShouXingUtil.XL0 = [
  1e10,
  20,
  578,
  920,
  1100,
  1124,
  1136,
  1148,
  1217,
  1226,
  1229,
  1229,
  1229,
  1229,
  1937,
  2363,
  2618,
  2633,
  2660,
  2666,
  17534704567,
  0,
  0,
  334165646,
  4.669256804,
  6283.075849991,
  3489428,
  4.6261024,
  12566.1517,
  349706,
  2.744118,
  5753.384885,
  341757,
  2.828866,
  3.523118,
  313590,
  3.62767,
  77713.771468,
  267622,
  4.418084,
  7860.419392,
  234269,
  6.135162,
  3930.209696,
  132429,
  0.742464,
  11506.76977,
  127317,
  2.037097,
  529.690965,
  119917,
  1.109629,
  1577.343542,
  99025,
  5.23268,
  5884.92685,
  90186,
  2.04505,
  26.29832,
  85722,
  3.50849,
  398.149,
  77979,
  1.17883,
  5223.69392,
  75314,
  2.53339,
  5507.55324,
  50526,
  4.58293,
  18849.22755,
  49238,
  4.20507,
  775.52261,
  35666,
  2.91954,
  0.06731,
  31709,
  5.84902,
  11790.62909,
  28413,
  1.89869,
  796.29801,
  27104,
  0.31489,
  10977.0788,
  24281,
  0.34481,
  5486.77784,
  20616,
  4.80647,
  2544.31442,
  20539,
  1.86948,
  5573.1428,
  20226,
  2.45768,
  6069.77675,
  15552,
  0.83306,
  213.2991,
  13221,
  3.41118,
  2942.46342,
  12618,
  1.08303,
  20.7754,
  11513,
  0.64545,
  0.98032,
  10285,
  0.636,
  4694.00295,
  10190,
  0.97569,
  15720.83878,
  10172,
  4.2668,
  7.11355,
  9921,
  6.2099,
  2146.1654,
  9761,
  0.681,
  155.4204,
  8580,
  5.9832,
  161000.6857,
  8513,
  1.2987,
  6275.9623,
  8471,
  3.6708,
  71430.6956,
  7964,
  1.8079,
  17260.1547,
  7876,
  3.037,
  12036.4607,
  7465,
  1.7551,
  5088.6288,
  7387,
  3.5032,
  3154.6871,
  7355,
  4.6793,
  801.8209,
  6963,
  0.833,
  9437.7629,
  6245,
  3.9776,
  8827.3903,
  6115,
  1.8184,
  7084.8968,
  5696,
  2.7843,
  6286.599,
  5612,
  4.3869,
  14143.4952,
  5558,
  3.4701,
  6279.5527,
  5199,
  0.1891,
  12139.5535,
  5161,
  1.3328,
  1748.0164,
  5115,
  0.2831,
  5856.4777,
  4900,
  0.4874,
  1194.447,
  4104,
  5.3682,
  8429.2413,
  4094,
  2.3985,
  19651.0485,
  3920,
  6.1683,
  10447.3878,
  3677,
  6.0413,
  10213.2855,
  3660,
  2.5696,
  1059.3819,
  3595,
  1.7088,
  2352.8662,
  3557,
  1.776,
  6812.7668,
  3329,
  0.5931,
  17789.8456,
  3041,
  0.4429,
  83996.8473,
  3005,
  2.7398,
  1349.8674,
  2535,
  3.1647,
  4690.4798,
  2474,
  0.2148,
  3.5904,
  2366,
  0.4847,
  8031.0923,
  2357,
  2.0653,
  3340.6124,
  2282,
  5.222,
  4705.7323,
  2189,
  5.5559,
  553.5694,
  2142,
  1.4256,
  16730.4637,
  2109,
  4.1483,
  951.7184,
  2030,
  0.3713,
  283.8593,
  1992,
  5.2221,
  12168.0027,
  1986,
  5.7747,
  6309.3742,
  1912,
  3.8222,
  23581.2582,
  1889,
  5.3863,
  149854.4001,
  1790,
  2.2149,
  13367.9726,
  1748,
  4.5605,
  135.0651,
  1622,
  5.9884,
  11769.8537,
  1508,
  4.1957,
  6256.7775,
  1442,
  4.1932,
  242.7286,
  1435,
  3.7236,
  38.0277,
  1397,
  4.4014,
  6681.2249,
  1362,
  1.8893,
  7632.9433,
  1250,
  1.1305,
  5.5229,
  1205,
  2.6223,
  955.5997,
  1200,
  1.0035,
  632.7837,
  1129,
  0.1774,
  4164.312,
  1083,
  0.3273,
  103.0928,
  1052,
  0.9387,
  11926.2544,
  1050,
  5.3591,
  1592.596,
  1033,
  6.1998,
  6438.4962,
  1001,
  6.0291,
  5746.2713,
  980,
  0.999,
  11371.705,
  980,
  5.244,
  27511.468,
  938,
  2.624,
  5760.498,
  923,
  0.483,
  522.577,
  922,
  4.571,
  4292.331,
  905,
  5.337,
  6386.169,
  862,
  4.165,
  7058.598,
  841,
  3.299,
  7234.794,
  836,
  4.539,
  25132.303,
  813,
  6.112,
  4732.031,
  812,
  6.271,
  426.598,
  801,
  5.821,
  28.449,
  787,
  0.996,
  5643.179,
  776,
  2.957,
  23013.54,
  769,
  3.121,
  7238.676,
  758,
  3.974,
  11499.656,
  735,
  4.386,
  316.392,
  731,
  0.607,
  11513.883,
  719,
  3.998,
  74.782,
  706,
  0.323,
  263.084,
  676,
  5.911,
  90955.552,
  663,
  3.665,
  17298.182,
  653,
  5.791,
  18073.705,
  630,
  4.717,
  6836.645,
  615,
  1.458,
  233141.314,
  612,
  1.075,
  19804.827,
  596,
  3.321,
  6283.009,
  596,
  2.876,
  6283.143,
  555,
  2.452,
  12352.853,
  541,
  5.392,
  419.485,
  531,
  0.382,
  31441.678,
  519,
  4.065,
  6208.294,
  513,
  2.361,
  10973.556,
  494,
  5.737,
  9917.697,
  450,
  3.272,
  11015.106,
  449,
  3.653,
  206.186,
  447,
  2.064,
  7079.374,
  435,
  4.423,
  5216.58,
  421,
  1.906,
  245.832,
  413,
  0.921,
  3738.761,
  402,
  0.84,
  20.355,
  387,
  1.826,
  11856.219,
  379,
  2.344,
  3.881,
  374,
  2.954,
  3128.389,
  370,
  5.031,
  536.805,
  365,
  1.018,
  16200.773,
  365,
  1.083,
  88860.057,
  352,
  5.978,
  3894.182,
  352,
  2.056,
  244287.6,
  351,
  3.713,
  6290.189,
  340,
  1.106,
  14712.317,
  339,
  0.978,
  8635.942,
  339,
  3.202,
  5120.601,
  333,
  0.837,
  6496.375,
  325,
  3.479,
  6133.513,
  316,
  5.089,
  21228.392,
  316,
  1.328,
  10873.986,
  309,
  3.646,
  10.637,
  303,
  1.802,
  35371.887,
  296,
  3.397,
  9225.539,
  288,
  6.026,
  154717.61,
  281,
  2.585,
  14314.168,
  262,
  3.856,
  266.607,
  262,
  2.579,
  22483.849,
  257,
  1.561,
  23543.231,
  255,
  3.949,
  1990.745,
  251,
  3.744,
  10575.407,
  240,
  1.161,
  10984.192,
  238,
  0.106,
  7.046,
  236,
  4.272,
  6040.347,
  234,
  3.577,
  10969.965,
  211,
  3.714,
  65147.62,
  210,
  0.754,
  13521.751,
  207,
  4.228,
  5650.292,
  202,
  0.814,
  170.673,
  201,
  4.629,
  6037.244,
  200,
  0.381,
  6172.87,
  199,
  3.933,
  6206.81,
  199,
  5.197,
  6262.3,
  197,
  1.046,
  18209.33,
  195,
  1.07,
  5230.807,
  195,
  4.869,
  36.028,
  194,
  4.313,
  6244.943,
  192,
  1.229,
  709.933,
  192,
  5.595,
  6282.096,
  192,
  0.602,
  6284.056,
  189,
  3.744,
  23.878,
  188,
  1.904,
  15.252,
  188,
  0.867,
  22003.915,
  182,
  3.681,
  15110.466,
  181,
  0.491,
  1.484,
  179,
  3.222,
  39302.097,
  179,
  1.259,
  12559.038,
  62833196674749,
  0,
  0,
  20605886,
  2.67823456,
  6283.07584999,
  430343,
  2.635127,
  12566.1517,
  42526,
  1.59047,
  3.52312,
  11926,
  5.79557,
  26.29832,
  10898,
  2.96618,
  1577.34354,
  9348,
  2.5921,
  18849.2275,
  7212,
  1.1385,
  529.691,
  6777,
  1.8747,
  398.149,
  6733,
  4.4092,
  5507.5532,
  5903,
  2.888,
  5223.6939,
  5598,
  2.1747,
  155.4204,
  4541,
  0.398,
  796.298,
  3637,
  0.4662,
  775.5226,
  2896,
  2.6471,
  7.1135,
  2084,
  5.3414,
  0.9803,
  1910,
  1.8463,
  5486.7778,
  1851,
  4.9686,
  213.2991,
  1729,
  2.9912,
  6275.9623,
  1623,
  0.0322,
  2544.3144,
  1583,
  1.4305,
  2146.1654,
  1462,
  1.2053,
  10977.0788,
  1246,
  2.8343,
  1748.0164,
  1188,
  3.258,
  5088.6288,
  1181,
  5.2738,
  1194.447,
  1151,
  2.075,
  4694.003,
  1064,
  0.7661,
  553.5694,
  997,
  1.303,
  6286.599,
  972,
  4.239,
  1349.867,
  945,
  2.7,
  242.729,
  858,
  5.645,
  951.718,
  758,
  5.301,
  2352.866,
  639,
  2.65,
  9437.763,
  610,
  4.666,
  4690.48,
  583,
  1.766,
  1059.382,
  531,
  0.909,
  3154.687,
  522,
  5.661,
  71430.696,
  520,
  1.854,
  801.821,
  504,
  1.425,
  6438.496,
  433,
  0.241,
  6812.767,
  426,
  0.774,
  10447.388,
  413,
  5.24,
  7084.897,
  374,
  2.001,
  8031.092,
  356,
  2.429,
  14143.495,
  350,
  4.8,
  6279.553,
  337,
  0.888,
  12036.461,
  337,
  3.862,
  1592.596,
  325,
  3.4,
  7632.943,
  322,
  0.616,
  8429.241,
  318,
  3.188,
  4705.732,
  297,
  6.07,
  4292.331,
  295,
  1.431,
  5746.271,
  290,
  2.325,
  20.355,
  275,
  0.935,
  5760.498,
  270,
  4.804,
  7234.794,
  253,
  6.223,
  6836.645,
  228,
  5.003,
  17789.846,
  225,
  5.672,
  11499.656,
  215,
  5.202,
  11513.883,
  208,
  3.955,
  10213.286,
  208,
  2.268,
  522.577,
  206,
  2.224,
  5856.478,
  206,
  2.55,
  25132.303,
  203,
  0.91,
  6256.778,
  189,
  0.532,
  3340.612,
  188,
  4.735,
  83996.847,
  179,
  1.474,
  4164.312,
  178,
  3.025,
  5.523,
  177,
  3.026,
  5753.385,
  159,
  4.637,
  3.286,
  157,
  6.124,
  5216.58,
  155,
  3.077,
  6681.225,
  154,
  4.2,
  13367.973,
  143,
  1.191,
  3894.182,
  138,
  3.093,
  135.065,
  136,
  4.245,
  426.598,
  134,
  5.765,
  6040.347,
  128,
  3.085,
  5643.179,
  127,
  2.092,
  6290.189,
  125,
  3.077,
  11926.254,
  125,
  3.445,
  536.805,
  114,
  3.244,
  12168.003,
  112,
  2.318,
  16730.464,
  111,
  3.901,
  11506.77,
  111,
  5.32,
  23.878,
  105,
  3.75,
  7860.419,
  103,
  2.447,
  1990.745,
  96,
  0.82,
  3.88,
  96,
  4.08,
  6127.66,
  91,
  5.42,
  206.19,
  91,
  0.42,
  7079.37,
  88,
  5.17,
  11790.63,
  81,
  0.34,
  9917.7,
  80,
  3.89,
  10973.56,
  78,
  2.4,
  1589.07,
  78,
  2.58,
  11371.7,
  77,
  3.98,
  955.6,
  77,
  3.36,
  36.03,
  76,
  1.3,
  103.09,
  75,
  5.18,
  10969.97,
  75,
  4.96,
  6496.37,
  73,
  5.21,
  38.03,
  72,
  2.65,
  6309.37,
  70,
  5.61,
  3738.76,
  69,
  2.6,
  3496.03,
  69,
  0.39,
  15.25,
  69,
  2.78,
  20.78,
  65,
  1.13,
  7058.6,
  64,
  4.28,
  28.45,
  61,
  5.63,
  10984.19,
  60,
  0.73,
  419.48,
  60,
  5.28,
  10575.41,
  58,
  5.55,
  17298.18,
  58,
  3.19,
  4732.03,
  5291887,
  0,
  0,
  871984,
  1.072097,
  6283.07585,
  30913,
  0.86729,
  12566.1517,
  2734,
  0.053,
  3.5231,
  1633,
  5.1883,
  26.2983,
  1575,
  3.6846,
  155.4204,
  954,
  0.757,
  18849.228,
  894,
  2.057,
  77713.771,
  695,
  0.827,
  775.523,
  506,
  4.663,
  1577.344,
  406,
  1.031,
  7.114,
  381,
  3.441,
  5573.143,
  346,
  5.141,
  796.298,
  317,
  6.053,
  5507.553,
  302,
  1.192,
  242.729,
  289,
  6.117,
  529.691,
  271,
  0.306,
  398.149,
  254,
  2.28,
  553.569,
  237,
  4.381,
  5223.694,
  208,
  3.754,
  0.98,
  168,
  0.902,
  951.718,
  153,
  5.759,
  1349.867,
  145,
  4.364,
  1748.016,
  134,
  3.721,
  1194.447,
  125,
  2.948,
  6438.496,
  122,
  2.973,
  2146.165,
  110,
  1.271,
  161000.686,
  104,
  0.604,
  3154.687,
  100,
  5.986,
  6286.599,
  92,
  4.8,
  5088.63,
  89,
  5.23,
  7084.9,
  83,
  3.31,
  213.3,
  76,
  3.42,
  5486.78,
  71,
  6.19,
  4690.48,
  68,
  3.43,
  4694,
  65,
  1.6,
  2544.31,
  64,
  1.98,
  801.82,
  61,
  2.48,
  10977.08,
  50,
  1.44,
  6836.65,
  49,
  2.34,
  1592.6,
  46,
  1.31,
  4292.33,
  46,
  3.81,
  149854.4,
  43,
  0.04,
  7234.79,
  40,
  4.94,
  7632.94,
  39,
  1.57,
  71430.7,
  38,
  3.17,
  6309.37,
  35,
  0.99,
  6040.35,
  35,
  0.67,
  1059.38,
  31,
  3.18,
  2352.87,
  31,
  3.55,
  8031.09,
  30,
  1.92,
  10447.39,
  30,
  2.52,
  6127.66,
  28,
  4.42,
  9437.76,
  28,
  2.71,
  3894.18,
  27,
  0.67,
  25132.3,
  26,
  5.27,
  6812.77,
  25,
  0.55,
  6279.55,
  23,
  1.38,
  4705.73,
  22,
  0.64,
  6256.78,
  20,
  6.07,
  640.88,
  28923,
  5.84384,
  6283.07585,
  3496,
  0,
  0,
  1682,
  5.4877,
  12566.1517,
  296,
  5.196,
  155.42,
  129,
  4.722,
  3.523,
  71,
  5.3,
  18849.23,
  64,
  5.97,
  242.73,
  40,
  3.79,
  553.57,
  11408,
  3.14159,
  0,
  772,
  4.134,
  6283.076,
  77,
  3.84,
  12566.15,
  42,
  0.42,
  155.42,
  88,
  3.14,
  0,
  17,
  2.77,
  6283.08,
  5,
  2.01,
  155.42,
  3,
  2.21,
  12566.15,
  27962,
  3.1987,
  84334.66158,
  10164,
  5.42249,
  5507.55324,
  8045,
  3.8801,
  5223.6939,
  4381,
  3.7044,
  2352.8662,
  3193,
  4.0003,
  1577.3435,
  2272,
  3.9847,
  1047.7473,
  1814,
  4.9837,
  6283.0758,
  1639,
  3.5646,
  5856.4777,
  1444,
  3.7028,
  9437.7629,
  1430,
  3.4112,
  10213.2855,
  1125,
  4.8282,
  14143.4952,
  1090,
  2.0857,
  6812.7668,
  1037,
  4.0566,
  71092.8814,
  971,
  3.473,
  4694.003,
  915,
  1.142,
  6620.89,
  878,
  4.44,
  5753.385,
  837,
  4.993,
  7084.897,
  770,
  5.554,
  167621.576,
  719,
  3.602,
  529.691,
  692,
  4.326,
  6275.962,
  558,
  4.41,
  7860.419,
  529,
  2.484,
  4705.732,
  521,
  6.25,
  18073.705,
  903,
  3.897,
  5507.553,
  618,
  1.73,
  5223.694,
  380,
  5.244,
  2352.866,
  166,
  1.627,
  84334.662,
  10001398880,
  0,
  0,
  167069963,
  3.098463508,
  6283.075849991,
  1395602,
  3.0552461,
  12566.1517,
  308372,
  5.198467,
  77713.771468,
  162846,
  1.173877,
  5753.384885,
  157557,
  2.846852,
  7860.419392,
  92480,
  5.45292,
  11506.76977,
  54244,
  4.56409,
  3930.2097,
  47211,
  3.661,
  5884.92685,
  34598,
  0.96369,
  5507.55324,
  32878,
  5.89984,
  5223.69392,
  30678,
  0.29867,
  5573.1428,
  24319,
  4.2735,
  11790.62909,
  21183,
  5.84715,
  1577.34354,
  18575,
  5.02194,
  10977.0788,
  17484,
  3.01194,
  18849.22755,
  10984,
  5.05511,
  5486.77784,
  9832,
  0.8868,
  6069.7768,
  8650,
  5.6896,
  15720.8388,
  8583,
  1.2708,
  161000.6857,
  6490,
  0.2725,
  17260.1547,
  6292,
  0.9218,
  529.691,
  5706,
  2.0137,
  83996.8473,
  5574,
  5.2416,
  71430.6956,
  4938,
  3.245,
  2544.3144,
  4696,
  2.5781,
  775.5226,
  4466,
  5.5372,
  9437.7629,
  4252,
  6.0111,
  6275.9623,
  3897,
  5.3607,
  4694.003,
  3825,
  2.3926,
  8827.3903,
  3749,
  0.8295,
  19651.0485,
  3696,
  4.9011,
  12139.5535,
  3566,
  1.6747,
  12036.4607,
  3454,
  1.8427,
  2942.4634,
  3319,
  0.2437,
  7084.8968,
  3192,
  0.1837,
  5088.6288,
  3185,
  1.7778,
  398.149,
  2846,
  1.2134,
  6286.599,
  2779,
  1.8993,
  6279.5527,
  2628,
  4.589,
  10447.3878,
  2460,
  3.7866,
  8429.2413,
  2393,
  4.996,
  5856.4777,
  2359,
  0.2687,
  796.298,
  2329,
  2.8078,
  14143.4952,
  2210,
  1.95,
  3154.6871,
  2035,
  4.6527,
  2146.1654,
  1951,
  5.3823,
  2352.8662,
  1883,
  0.6731,
  149854.4001,
  1833,
  2.2535,
  23581.2582,
  1796,
  0.1987,
  6812.7668,
  1731,
  6.152,
  16730.4637,
  1717,
  4.4332,
  10213.2855,
  1619,
  5.2316,
  17789.8456,
  1381,
  5.1896,
  8031.0923,
  1364,
  3.6852,
  4705.7323,
  1314,
  0.6529,
  13367.9726,
  1041,
  4.3329,
  11769.8537,
  1017,
  1.5939,
  4690.4798,
  998,
  4.201,
  6309.374,
  966,
  3.676,
  27511.468,
  874,
  6.064,
  1748.016,
  779,
  3.674,
  12168.003,
  771,
  0.312,
  7632.943,
  756,
  2.626,
  6256.778,
  746,
  5.648,
  11926.254,
  693,
  2.924,
  6681.225,
  680,
  1.423,
  23013.54,
  674,
  0.563,
  3340.612,
  663,
  5.661,
  11371.705,
  659,
  3.136,
  801.821,
  648,
  2.65,
  19804.827,
  615,
  3.029,
  233141.314,
  612,
  5.134,
  1194.447,
  563,
  4.341,
  90955.552,
  552,
  2.091,
  17298.182,
  534,
  5.1,
  31441.678,
  531,
  2.407,
  11499.656,
  523,
  4.624,
  6438.496,
  513,
  5.324,
  11513.883,
  477,
  0.256,
  11856.219,
  461,
  1.722,
  7234.794,
  458,
  3.766,
  6386.169,
  458,
  4.466,
  5746.271,
  423,
  1.055,
  5760.498,
  422,
  1.557,
  7238.676,
  415,
  2.599,
  7058.598,
  401,
  3.03,
  1059.382,
  397,
  1.201,
  1349.867,
  379,
  4.907,
  4164.312,
  360,
  5.707,
  5643.179,
  352,
  3.626,
  244287.6,
  348,
  0.761,
  10973.556,
  342,
  3.001,
  4292.331,
  336,
  4.546,
  4732.031,
  334,
  3.138,
  6836.645,
  324,
  4.164,
  9917.697,
  316,
  1.691,
  11015.106,
  307,
  0.238,
  35371.887,
  298,
  1.306,
  6283.143,
  298,
  1.75,
  6283.009,
  293,
  5.738,
  16200.773,
  286,
  5.928,
  14712.317,
  281,
  3.515,
  21228.392,
  280,
  5.663,
  8635.942,
  277,
  0.513,
  26.298,
  268,
  4.207,
  18073.705,
  266,
  0.9,
  12352.853,
  260,
  2.962,
  25132.303,
  255,
  2.477,
  6208.294,
  242,
  2.8,
  709.933,
  231,
  1.054,
  22483.849,
  229,
  1.07,
  14314.168,
  216,
  1.314,
  154717.61,
  215,
  6.038,
  10873.986,
  200,
  0.561,
  7079.374,
  198,
  2.614,
  951.718,
  197,
  4.369,
  167283.762,
  186,
  2.861,
  5216.58,
  183,
  1.66,
  39302.097,
  183,
  5.912,
  3738.761,
  175,
  2.145,
  6290.189,
  173,
  2.168,
  10575.407,
  171,
  3.702,
  1592.596,
  171,
  1.343,
  3128.389,
  164,
  5.55,
  6496.375,
  164,
  5.856,
  10984.192,
  161,
  1.998,
  10969.965,
  161,
  1.909,
  6133.513,
  157,
  4.955,
  25158.602,
  154,
  6.216,
  23543.231,
  153,
  5.357,
  13521.751,
  150,
  5.77,
  18209.33,
  150,
  5.439,
  155.42,
  139,
  1.778,
  9225.539,
  139,
  1.626,
  5120.601,
  128,
  2.46,
  13916.019,
  123,
  0.717,
  143571.324,
  122,
  2.654,
  88860.057,
  121,
  4.414,
  3894.182,
  121,
  1.192,
  3.523,
  120,
  4.03,
  553.569,
  119,
  1.513,
  17654.781,
  117,
  3.117,
  14945.316,
  113,
  2.698,
  6040.347,
  110,
  3.085,
  43232.307,
  109,
  0.998,
  955.6,
  108,
  2.939,
  17256.632,
  107,
  5.285,
  65147.62,
  103,
  0.139,
  11712.955,
  103,
  5.85,
  213.299,
  102,
  3.046,
  6037.244,
  101,
  2.842,
  8662.24,
  100,
  3.626,
  6262.3,
  98,
  2.36,
  6206.81,
  98,
  5.11,
  6172.87,
  98,
  2,
  15110.47,
  97,
  2.67,
  5650.29,
  97,
  2.75,
  6244.94,
  96,
  4.02,
  6282.1,
  96,
  5.31,
  6284.06,
  92,
  0.1,
  29088.81,
  85,
  3.26,
  20426.57,
  84,
  2.6,
  28766.92,
  81,
  3.58,
  10177.26,
  80,
  5.81,
  5230.81,
  78,
  2.53,
  16496.36,
  77,
  4.06,
  6127.66,
  73,
  0.04,
  5481.25,
  72,
  5.96,
  12559.04,
  72,
  5.92,
  4136.91,
  71,
  5.49,
  22003.91,
  70,
  3.41,
  7.11,
  69,
  0.62,
  11403.68,
  69,
  3.9,
  1589.07,
  69,
  1.96,
  12416.59,
  69,
  4.51,
  426.6,
  67,
  1.61,
  11087.29,
  66,
  4.5,
  47162.52,
  66,
  5.08,
  283.86,
  66,
  4.32,
  16858.48,
  65,
  1.04,
  6062.66,
  64,
  1.59,
  18319.54,
  63,
  5.7,
  45892.73,
  63,
  4.6,
  66567.49,
  63,
  3.82,
  13517.87,
  62,
  2.62,
  11190.38,
  61,
  1.54,
  33019.02,
  60,
  5.58,
  10344.3,
  60,
  5.38,
  316428.23,
  60,
  5.78,
  632.78,
  59,
  6.12,
  9623.69,
  57,
  0.16,
  17267.27,
  57,
  3.86,
  6076.89,
  57,
  1.98,
  7668.64,
  56,
  4.78,
  20199.09,
  55,
  4.56,
  18875.53,
  55,
  3.51,
  17253.04,
  54,
  3.07,
  226858.24,
  54,
  4.83,
  18422.63,
  53,
  5.02,
  12132.44,
  52,
  3.63,
  5333.9,
  52,
  0.97,
  155427.54,
  51,
  3.36,
  20597.24,
  50,
  0.99,
  11609.86,
  50,
  2.21,
  1990.75,
  48,
  1.62,
  12146.67,
  48,
  1.17,
  12569.67,
  47,
  4.62,
  5436.99,
  47,
  1.81,
  12562.63,
  47,
  0.59,
  21954.16,
  47,
  0.76,
  7342.46,
  46,
  0.27,
  4590.91,
  46,
  3.77,
  156137.48,
  45,
  5.66,
  10454.5,
  44,
  5.84,
  3496.03,
  43,
  0.24,
  17996.03,
  41,
  5.93,
  51092.73,
  41,
  4.21,
  12592.45,
  40,
  5.14,
  1551.05,
  40,
  5.28,
  15671.08,
  39,
  3.69,
  18052.93,
  39,
  4.94,
  24356.78,
  38,
  2.72,
  11933.37,
  38,
  5.23,
  7477.52,
  38,
  4.99,
  9779.11,
  37,
  3.7,
  9388.01,
  37,
  4.44,
  4535.06,
  36,
  2.16,
  28237.23,
  36,
  2.54,
  242.73,
  36,
  0.22,
  5429.88,
  35,
  6.15,
  19800.95,
  35,
  2.92,
  36949.23,
  34,
  5.63,
  2379.16,
  34,
  5.73,
  16460.33,
  34,
  5.11,
  5849.36,
  33,
  6.19,
  6268.85,
  10301861,
  1.1074897,
  6283.07584999,
  172124,
  1.064423,
  12566.1517,
  70222,
  3.14159,
  0,
  3235,
  1.0217,
  18849.2275,
  3080,
  2.8435,
  5507.5532,
  2497,
  1.3191,
  5223.6939,
  1849,
  1.4243,
  1577.3435,
  1008,
  5.9138,
  10977.0788,
  865,
  1.42,
  6275.962,
  863,
  0.271,
  5486.778,
  507,
  1.686,
  5088.629,
  499,
  6.014,
  6286.599,
  467,
  5.987,
  529.691,
  440,
  0.518,
  4694.003,
  410,
  1.084,
  9437.763,
  387,
  4.75,
  2544.314,
  375,
  5.071,
  796.298,
  352,
  0.023,
  83996.847,
  344,
  0.949,
  71430.696,
  341,
  5.412,
  775.523,
  322,
  6.156,
  2146.165,
  286,
  5.484,
  10447.388,
  284,
  3.42,
  2352.866,
  255,
  6.132,
  6438.496,
  252,
  0.243,
  398.149,
  243,
  3.092,
  4690.48,
  225,
  3.689,
  7084.897,
  220,
  4.952,
  6812.767,
  219,
  0.42,
  8031.092,
  209,
  1.282,
  1748.016,
  193,
  5.314,
  8429.241,
  185,
  1.82,
  7632.943,
  175,
  3.229,
  6279.553,
  173,
  1.537,
  4705.732,
  158,
  4.097,
  11499.656,
  158,
  5.539,
  3154.687,
  150,
  3.633,
  11513.883,
  148,
  3.222,
  7234.794,
  147,
  3.653,
  1194.447,
  144,
  0.817,
  14143.495,
  135,
  6.151,
  5746.271,
  134,
  4.644,
  6836.645,
  128,
  2.693,
  1349.867,
  123,
  5.65,
  5760.498,
  118,
  2.577,
  13367.973,
  113,
  3.357,
  17789.846,
  110,
  4.497,
  4292.331,
  108,
  5.828,
  12036.461,
  102,
  5.621,
  6256.778,
  99,
  1.14,
  1059.38,
  98,
  0.66,
  5856.48,
  93,
  2.32,
  10213.29,
  92,
  0.77,
  16730.46,
  88,
  1.5,
  11926.25,
  86,
  1.42,
  5753.38,
  85,
  0.66,
  155.42,
  81,
  1.64,
  6681.22,
  80,
  4.11,
  951.72,
  66,
  4.55,
  5216.58,
  65,
  0.98,
  25132.3,
  64,
  4.19,
  6040.35,
  64,
  0.52,
  6290.19,
  63,
  1.51,
  5643.18,
  59,
  6.18,
  4164.31,
  57,
  2.3,
  10973.56,
  55,
  2.32,
  11506.77,
  55,
  2.2,
  1592.6,
  55,
  5.27,
  3340.61,
  54,
  5.54,
  553.57,
  53,
  5.04,
  9917.7,
  53,
  0.92,
  11371.7,
  52,
  3.98,
  17298.18,
  52,
  3.6,
  10969.97,
  49,
  5.91,
  3894.18,
  49,
  2.51,
  6127.66,
  48,
  1.67,
  12168,
  46,
  0.31,
  801.82,
  42,
  3.7,
  10575.41,
  42,
  4.05,
  10984.19,
  40,
  2.17,
  7860.42,
  40,
  4.17,
  26.3,
  38,
  5.82,
  7058.6,
  37,
  3.39,
  6496.37,
  36,
  1.08,
  6309.37,
  36,
  5.34,
  7079.37,
  34,
  3.62,
  11790.63,
  32,
  0.32,
  16200.77,
  31,
  4.24,
  3738.76,
  29,
  4.55,
  11856.22,
  29,
  1.26,
  8635.94,
  27,
  3.45,
  5884.93,
  26,
  5.08,
  10177.26,
  26,
  5.38,
  21228.39,
  24,
  2.26,
  11712.96,
  24,
  1.05,
  242.73,
  24,
  5.59,
  6069.78,
  23,
  3.63,
  6284.06,
  23,
  1.64,
  4732.03,
  22,
  3.46,
  213.3,
  21,
  1.05,
  3496.03,
  21,
  3.92,
  13916.02,
  21,
  4.01,
  5230.81,
  20,
  5.16,
  12352.85,
  20,
  0.69,
  1990.75,
  19,
  2.73,
  6062.66,
  19,
  5.01,
  11015.11,
  18,
  6.04,
  6283.01,
  18,
  2.85,
  7238.68,
  18,
  5.6,
  6283.14,
  18,
  5.16,
  17253.04,
  18,
  2.54,
  14314.17,
  17,
  1.58,
  7.11,
  17,
  0.98,
  3930.21,
  17,
  4.75,
  17267.27,
  16,
  2.19,
  6076.89,
  16,
  2.19,
  18073.7,
  16,
  6.12,
  3.52,
  16,
  4.61,
  9623.69,
  16,
  3.4,
  16496.36,
  15,
  0.19,
  9779.11,
  15,
  5.3,
  13517.87,
  15,
  4.26,
  3128.39,
  15,
  0.81,
  709.93,
  14,
  0.5,
  25158.6,
  14,
  4.38,
  4136.91,
  13,
  0.98,
  65147.62,
  13,
  3.31,
  154717.61,
  13,
  2.11,
  1589.07,
  13,
  1.92,
  22483.85,
  12,
  6.03,
  9225.54,
  12,
  1.53,
  12559.04,
  12,
  5.82,
  6282.1,
  12,
  5.61,
  5642.2,
  12,
  2.38,
  167283.76,
  12,
  0.39,
  12132.44,
  12,
  3.98,
  4686.89,
  12,
  5.81,
  12569.67,
  12,
  0.56,
  5849.36,
  11,
  0.45,
  6172.87,
  11,
  5.8,
  16858.48,
  11,
  6.22,
  12146.67,
  11,
  2.27,
  5429.88,
  435939,
  5.784551,
  6283.07585,
  12363,
  5.57935,
  12566.1517,
  1234,
  3.1416,
  0,
  879,
  3.628,
  77713.771,
  569,
  1.87,
  5573.143,
  330,
  5.47,
  18849.228,
  147,
  4.48,
  5507.553,
  110,
  2.842,
  161000.686,
  101,
  2.815,
  5223.694,
  85,
  3.11,
  1577.34,
  65,
  5.47,
  775.52,
  61,
  1.38,
  6438.5,
  50,
  4.42,
  6286.6,
  47,
  3.66,
  7084.9,
  46,
  5.39,
  149854.4,
  42,
  0.9,
  10977.08,
  40,
  3.2,
  5088.63,
  35,
  1.81,
  5486.78,
  32,
  5.35,
  3154.69,
  30,
  3.52,
  796.3,
  29,
  4.62,
  4690.48,
  28,
  1.84,
  4694,
  27,
  3.14,
  71430.7,
  27,
  6.17,
  6836.65,
  26,
  1.42,
  2146.17,
  25,
  2.81,
  1748.02,
  24,
  2.18,
  155.42,
  23,
  4.76,
  7234.79,
  21,
  3.38,
  7632.94,
  21,
  0.22,
  4705.73,
  20,
  4.22,
  1349.87,
  20,
  2.01,
  1194.45,
  20,
  4.58,
  529.69,
  19,
  1.59,
  6309.37,
  18,
  5.7,
  6040.35,
  18,
  6.03,
  4292.33,
  17,
  2.9,
  9437.76,
  17,
  2,
  8031.09,
  17,
  5.78,
  83996.85,
  16,
  0.05,
  2544.31,
  15,
  0.95,
  6127.66,
  14,
  0.36,
  10447.39,
  14,
  1.48,
  2352.87,
  13,
  0.77,
  553.57,
  13,
  5.48,
  951.72,
  13,
  5.27,
  6279.55,
  13,
  3.76,
  6812.77,
  11,
  5.41,
  6256.78,
  10,
  0.68,
  1592.6,
  10,
  4.95,
  398.15,
  10,
  1.15,
  3894.18,
  10,
  5.2,
  244287.6,
  10,
  1.94,
  11856.22,
  9,
  5.39,
  25132.3,
  8,
  6.18,
  1059.38,
  8,
  0.69,
  8429.24,
  8,
  5.85,
  242.73,
  7,
  5.26,
  14143.5,
  7,
  0.52,
  801.82,
  6,
  2.24,
  8635.94,
  6,
  4,
  13367.97,
  6,
  2.77,
  90955.55,
  6,
  5.17,
  7058.6,
  5,
  1.46,
  233141.31,
  5,
  4.13,
  7860.42,
  5,
  3.91,
  26.3,
  5,
  3.89,
  12036.46,
  5,
  5.58,
  6290.19,
  5,
  5.54,
  1990.75,
  5,
  0.83,
  11506.77,
  5,
  6.22,
  6681.22,
  4,
  5.26,
  10575.41,
  4,
  1.91,
  7477.52,
  4,
  0.43,
  10213.29,
  4,
  1.09,
  709.93,
  4,
  5.09,
  11015.11,
  4,
  4.22,
  88860.06,
  4,
  3.57,
  7079.37,
  4,
  1.98,
  6284.06,
  4,
  3.93,
  10973.56,
  4,
  6.18,
  9917.7,
  4,
  0.36,
  10177.26,
  4,
  2.75,
  3738.76,
  4,
  3.33,
  5643.18,
  4,
  5.36,
  25158.6,
  14459,
  4.27319,
  6283.07585,
  673,
  3.917,
  12566.152,
  77,
  0,
  0,
  25,
  3.73,
  18849.23,
  4,
  2.8,
  6286.6,
  386,
  2.564,
  6283.076,
  31,
  2.27,
  12566.15,
  5,
  3.44,
  5573.14,
  2,
  2.05,
  18849.23,
  1,
  2.06,
  77713.77,
  1,
  4.41,
  161000.69,
  1,
  3.82,
  149854.4,
  1,
  4.08,
  6127.66,
  1,
  5.26,
  6438.5,
  9,
  1.22,
  6283.08,
  1,
  0.66,
  12566.15
];
ShouXingUtil.XL1 = [
  [22639.586, 0.78475822, 8328.691424623, 1.5229241, 25.0719, -0.123598, 4586.438, 0.1873974, 7214.06286536, -2.184756, -18.86, 0.0828, 2369.914, 2.542952, 15542.75428998, -0.661832, 6.212, -0.0408, 769.026, 3.140313, 16657.38284925, 3.04585, 50.144, -0.2472, 666.418, 1.527671, 628.30195521, -0.02664, 0.062, -54e-4, 411.596, 4.826607, 16866.932315, -1.28012, -1.07, -59e-4, 211.656, 4.115028, -1114.6285593, -3.70768, -43.93, 0.2064, 205.436, 0.230523, 6585.7609101, -2.15812, -18.92, 0.0882, 191.956, 4.898507, 23871.4457146, 0.86109, 31.28, -0.164, 164.729, 2.586078, 14914.4523348, -0.6352, 6.15, -0.035, 147.321, 5.4553, -7700.3894694, -1.5496, -25.01, 0.118, 124.988, 0.48608, 7771.377145, -0.3309, 3.11, -0.02, 109.38, 3.88323, 8956.9933798, 1.4963, 25.13, -0.129, 55.177, 5.57033, -1324.178025, 0.6183, 7.3, -0.035, 45.1, 0.89898, 25195.62374, 0.2428, 24, -0.129, 39.533, 3.81213, -8538.24089, 2.803, 26.1, -0.118, 38.43, 4.30115, 22756.817155, -2.8466, -12.6, 0.042, 36.124, 5.49587, 24986.074274, 4.5688, 75.2, -0.371, 30.773, 1.94559, 14428.125731, -4.3695, -37.7, 0.166, 28.397, 3.28586, 7842.364821, -2.2114, -18.8, 0.077, 24.358, 5.64142, 16171.056245, -0.6885, 6.3, -0.046, 18.585, 4.41371, -557.31428, -1.8538, -22, 0.1, 17.954, 3.58454, 8399.6791, -0.3576, 3.2, -0.03, 14.53, 4.9416, 23243.143759, 0.888, 31.2, -0.16, 14.38, 0.9709, 32200.137139, 2.384, 56.4, -0.29, 14.251, 5.7641, -2.3012, 1.523, 25.1, -0.12, 13.899, 0.3735, 31085.50858, -1.324, 12.4, -0.08, 13.194, 1.7595, -9443.319984, -5.231, -69, 0.33, 9.679, 3.0997, -16029.080894, -3.072, -50.1, 0.24, 9.366, 0.3016, 24080.99518, -3.465, -19.9, 0.08, 8.606, 4.1582, -1742.930514, -3.681, -44, 0.21, 8.453, 2.8416, 16100.06857, 1.192, 28.2, -0.14, 8.05, 2.6292, 14286.15038, -0.609, 6.1, -0.03, 7.63, 6.2388, 17285.684804, 3.019, 50.2, -0.25, 7.447, 1.4845, 1256.60391, -0.053, 0.1, -0.01, 7.371, 0.2736, 5957.458955, -2.131, -19, 0.09, 7.063, 5.6715, 33.757047, -0.308, -3.6, 0.02, 6.383, 4.7843, 7004.5134, 2.141, 32.4, -0.16, 5.742, 2.6572, 32409.686605, -1.942, 5, -0.05, 4.374, 4.3443, 22128.5152, -2.82, -13, 0.05, 3.998, 3.2545, 33524.31516, 1.766, 49, -0.25, 3.21, 2.2443, 14985.44001, -2.516, -16, 0.06, 2.915, 1.7138, 24499.74767, 0.834, 31, -0.17, 2.732, 1.9887, 13799.82378, -4.343, -38, 0.17, 2.568, 5.4122, -7072.08751, -1.576, -25, 0.11, 2.521, 3.2427, 8470.66678, -2.238, -19, 0.07, 2.489, 4.0719, -486.3266, -3.734, -44, 0.2, 2.146, 5.6135, -1952.47998, 0.645, 7, -0.03, 1.978, 2.7291, 39414.2, 0.199, 37, -0.21, 1.934, 1.5682, 33314.7657, 6.092, 100, -0.5, 1.871, 0.4166, 30457.20662, -1.297, 12, -0.1, 1.753, 2.0582, -8886.0057, -3.38, -47, 0.2, 1.437, 2.386, -695.87607, 0.59, 7, 0, 1.373, 3.026, -209.54947, 4.33, 51, -0.2, 1.262, 5.94, 16728.37052, 1.17, 28, -0.1, 1.224, 6.172, 6656.74859, -4.04, -41, 0.2, 1.187, 5.873, 6099.43431, -5.89, -63, 0.3, 1.177, 1.014, 31571.83518, 2.41, 56, -0.3, 1.162, 3.84, 9585.29534, 1.47, 25, -0.1, 1.143, 5.639, 8364.73984, -2.18, -19, 0.1, 1.078, 1.229, 70.98768, -1.88, -22, 0.1, 1.059, 3.326, 40528.82856, 3.91, 81, -0.4, 0.99, 5.013, 40738.37803, -0.42, 30, -0.2, 0.948, 5.687, -17772.01141, -6.75, -94, 0.5, 0.876, 0.298, -0.35232, 0, 0, 0, 0.822, 2.994, 393.02097, 0, 0, 0, 0.788, 1.836, 8326.39022, 3.05, 50, -0.2, 0.752, 4.985, 22614.8418, 0.91, 31, -0.2, 0.74, 2.875, 8330.99262, 0, 0, 0, 0.669, 0.744, -24357.77232, -4.6, -75, 0.4, 0.644, 1.314, 8393.12577, -2.18, -19, 0.1, 0.639, 5.888, 575.33849, 0, 0, 0, 0.635, 1.116, 23385.11911, -2.87, -13, 0, 0.584, 5.197, 24428.75999, 2.71, 53, -0.3, 0.583, 3.513, -9095.55517, 0.95, 4, 0, 0.572, 6.059, 29970.88002, -5.03, -32, 0.1, 0.565, 2.96, 0.32863, 1.52, 25, -0.1, 0.561, 4.001, -17981.56087, -2.43, -43, 0.2, 0.557, 0.529, 7143.07519, -0.3, 3, 0, 0.546, 2.311, 25614.37623, 4.54, 75, -0.4, 0.536, 4.229, 15752.30376, -4.99, -45, 0.2, 0.493, 3.316, -8294.9344, -1.83, -29, 0.1, 0.491, 1.744, 8362.4485, 1.21, 21, -0.1, 0.478, 1.803, -10071.6219, -5.2, -69, 0.3, 0.454, 0.857, 15333.2048, 3.66, 57, -0.3, 0.445, 2.071, 8311.7707, -2.18, -19, 0.1, 0.426, 0.345, 23452.6932, -3.44, -20, 0.1, 0.42, 4.941, 33733.8646, -2.56, -2, 0, 0.413, 1.642, 17495.2343, -1.31, -1, 0, 0.404, 1.458, 23314.1314, -0.99, 9, -0.1, 0.395, 2.132, 38299.5714, -3.51, -6, 0, 0.382, 2.7, 31781.3846, -1.92, 5, 0, 0.375, 4.827, 6376.2114, 2.17, 32, -0.2, 0.361, 3.867, 16833.1753, -0.97, 3, 0, 0.358, 5.044, 15056.4277, -4.4, -38, 0.2, 0.35, 5.157, -8257.7037, -3.4, -47, 0.2, 0.344, 4.233, 157.7344, 0, 0, 0, 0.34, 2.672, 13657.8484, -0.58, 6, 0, 0.329, 5.61, 41853.0066, 3.29, 74, -0.4, 0.325, 5.895, -39.8149, 0, 0, 0, 0.309, 4.387, 21500.2132, -2.79, -13, 0.1, 0.302, 1.278, 786.0419, 0, 0, 0, 0.302, 5.341, -24567.3218, -0.27, -24, 0.1, 0.301, 1.045, 5889.8848, -1.57, -12, 0, 0.294, 4.201, -2371.2325, -3.65, -44, 0.2, 0.293, 3.704, 21642.1886, -6.55, -57, 0.2, 0.29, 4.069, 32828.4391, 2.36, 56, -0.3, 0.289, 3.472, 31713.8105, -1.35, 12, -0.1, 0.285, 5.407, -33.7814, 0.31, 4, 0, 0.283, 5.998, -16.9207, -3.71, -44, 0.2, 0.283, 2.772, 38785.898, 0.23, 37, -0.2, 0.274, 5.343, 15613.742, -2.54, -16, 0.1, 0.263, 3.997, 25823.9257, 0.22, 24, -0.1, 0.254, 0.6, 24638.3095, -1.61, 2, 0, 0.253, 1.344, 6447.1991, 0.29, 10, -0.1, 0.25, 0.887, 141.9754, -3.76, -44, 0.2, 0.247, 0.317, 5329.157, -2.1, -19, 0.1, 0.245, 0.141, 36.0484, -3.71, -44, 0.2, 0.231, 2.287, 14357.1381, -2.49, -16, 0.1, 0.227, 5.158, 2.6298, 0, 0, 0, 0.219, 5.085, 47742.8914, 1.72, 63, -0.3, 0.211, 2.145, 6638.7244, -2.18, -19, 0.1, 0.201, 4.415, 39623.7495, -4.13, -14, 0, 0.194, 2.091, 588.4927, 0, 0, 0, 0.193, 3.057, -15400.7789, -3.1, -50, 0, 0.186, 5.598, 16799.3582, -0.72, 6, 0, 0.185, 3.886, 1150.677, 0, 0, 0, 0.183, 1.619, 7178.0144, 1.52, 25, 0, 0.181, 2.635, 8328.3391, 1.52, 25, 0, 0.181, 2.077, 8329.0437, 1.52, 25, 0, 0.179, 3.215, -9652.8694, -0.9, -18, 0, 0.176, 1.716, -8815.018, -5.26, -69, 0, 0.175, 5.673, 550.7553, 0, 0, 0, 0.17, 2.06, 31295.058, -5.6, -39, 0, 0.167, 1.239, 7211.7617, -0.7, 6, 0, 0.165, 4.499, 14967.4158, -0.7, 6, 0, 0.164, 3.595, 15540.4531, 0.9, 31, 0, 0.164, 4.237, 522.3694, 0, 0, 0, 0.163, 4.633, 15545.0555, -2.2, -19, 0, 0.161, 0.478, 6428.0209, -2.2, -19, 0, 0.158, 2.03, 13171.5218, -4.3, -38, 0, 0.157, 2.28, 7216.3641, -3.7, -44, 0, 0.154, 5.65, 7935.6705, 1.5, 25, 0, 0.152, 0.46, 29828.9047, -1.3, 12, 0, 0.151, 1.19, -0.7113, 0, 0, 0, 0.15, 1.42, 23942.4334, -1, 9, 0, 0.144, 2.75, 7753.3529, 1.5, 25, 0, 0.137, 2.08, 7213.7105, -2.2, -19, 0, 0.137, 1.44, 7214.4152, -2.2, -19, 0, 0.136, 4.46, -1185.6162, -1.8, -22, 0, 0.136, 3.03, 8000.1048, -2.2, -19, 0, 0.134, 2.83, 14756.7124, -0.7, 6, 0, 0.131, 5.05, 6821.0419, -2.2, -19, 0, 0.128, 5.99, -17214.6971, -4.9, -72, 0, 0.127, 5.35, 8721.7124, 1.5, 25, 0, 0.126, 4.49, 46628.2629, -2, 19, 0, 0.125, 5.94, 7149.6285, 1.5, 25, 0, 0.124, 1.09, 49067.0695, 1.1, 55, 0, 0.121, 2.88, 15471.7666, 1.2, 28, 0, 0.111, 3.92, 41643.4571, 7.6, 125, -1, 0.11, 1.96, 8904.0299, 1.5, 25, 0, 0.106, 3.3, -18.0489, -2.2, -19, 0, 0.105, 2.3, -4.931, 1.5, 25, 0, 0.104, 2.22, -6.559, -1.9, -22, 0, 0.101, 1.44, 1884.9059, -0.1, 0, 0, 0.1, 5.92, 5471.1324, -5.9, -63, 0, 0.099, 1.12, 15149.7333, -0.7, 6, 0, 0.096, 4.73, 15508.9972, -0.4, 10, 0, 0.095, 5.18, 7230.9835, 1.5, 25, 0, 0.093, 3.37, 39900.5266, 3.9, 81, 0, 0.092, 2.01, 25057.0619, 2.7, 53, 0, 0.092, 1.21, -79.6298, 0, 0, 0, 0.092, 1.65, -26310.2523, -4, -68, 0, 0.091, 1.01, 42062.5561, -1, 23, 0, 0.09, 6.1, 29342.5781, -5, -32, 0, 0.09, 4.43, 15542.402, -0.7, 6, 0, 0.09, 3.8, 15543.1066, -0.7, 6, 0, 0.089, 4.15, 6063.3859, -2.2, -19, 0, 0.086, 4.03, 52.9691, 0, 0, 0, 0.085, 0.49, 47952.4409, -2.6, 11, 0, 0.085, 1.6, 7632.8154, 2.1, 32, 0, 0.084, 0.22, 14392.0773, -0.7, 6, 0, 0.083, 6.22, 6028.4466, -4, -41, 0, 0.083, 0.63, -7909.9389, 2.8, 26, 0, 0.083, 5.2, -77.5523, 0, 0, 0, 0.082, 2.74, 8786.1467, -2.2, -19, 0, 0.08, 2.43, 9166.5428, -2.8, -26, 0, 0.08, 3.7, -25405.1732, 4.1, 27, 0, 0.078, 5.68, 48857.52, 5.4, 106, -1, 0.077, 1.85, 8315.5735, -2.2, -19, 0, 0.075, 5.46, -18191.1103, 1.9, 8, 0, 0.075, 1.41, -16238.6304, 1.3, 1, 0, 0.074, 5.06, 40110.0761, -0.4, 30, 0, 0.072, 2.1, 64.4343, -3.7, -44, 0, 0.071, 2.17, 37671.2695, -3.5, -6, 0, 0.069, 1.71, 16693.4313, -0.7, 6, 0, 0.069, 3.33, -26100.7028, -8.3, -119, 1, 0.068, 1.09, 8329.4028, 1.5, 25, 0, 0.068, 3.62, 8327.9801, 1.5, 25, 0, 0.068, 2.41, 16833.1509, -1, 3, 0, 0.067, 3.4, 24709.2971, -3.5, -20, 0, 0.067, 1.65, 8346.7156, -0.3, 3, 0, 0.066, 2.61, 22547.2677, 1.5, 39, 0, 0.066, 3.5, 15576.5113, -1, 3, 0, 0.065, 5.76, 33037.9886, -2, 5, 0, 0.065, 4.58, 8322.1325, -0.3, 3, 0, 0.065, 6.2, 17913.9868, 3, 50, 0, 0.065, 1.5, 22685.8295, -1, 9, 0, 0.065, 2.37, 7180.3058, -1.9, -15, 0, 0.064, 1.06, 30943.5332, 2.4, 56, 0, 0.064, 1.89, 8288.8765, 1.5, 25, 0, 0.064, 4.7, 6.0335, 0.3, 4, 0, 0.063, 2.83, 8368.5063, 1.5, 25, 0, 0.063, 5.66, -2580.7819, 0.7, 7, 0, 0.062, 3.78, 7056.3285, -2.2, -19, 0, 0.061, 1.49, 8294.91, 1.8, 29, 0, 0.061, 0.12, -10281.1714, -0.9, -18, 0, 0.061, 3.06, -8362.4729, -1.2, -21, 0, 0.061, 4.43, 8170.9571, 1.5, 25, 0, 0.059, 5.78, -13.1179, -3.7, -44, 0, 0.059, 5.97, 6625.5702, -2.2, -19, 0, 0.058, 5.01, -0.508, -0.3, 0, 0, 0.058, 2.73, 7161.0938, -2.2, -19, 0, 0.057, 0.19, 7214.0629, -2.2, -19, 0, 0.057, 4, 22199.5029, -4.7, -35, 0, 0.057, 5.38, 8119.142, 5.8, 76, 0, 0.056, 1.07, 7542.6495, 1.5, 25, 0, 0.056, 0.28, 8486.4258, 1.5, 25, 0, 0.054, 4.19, 16655.0816, 4.6, 75, 0, 0.053, 0.72, 7267.032, -2.2, -19, 0, 0.053, 3.12, 12.6192, 0.6, 7, 0, 0.052, 2.99, -32896.013, -1.8, -49, 0, 0.052, 3.46, 1097.708, 0, 0, 0, 0.051, 5.37, -6443.786, -1.6, -25, 0, 0.051, 1.35, 7789.401, -2.2, -19, 0, 0.051, 5.83, 40042.502, 0.2, 38, 0, 0.051, 3.63, 9114.733, 1.5, 25, 0, 0.05, 1.51, 8504.484, -2.5, -22, 0, 0.05, 5.23, 16659.684, 1.5, 25, 0, 0.05, 1.15, 7247.82, -2.5, -23, 0, 0.047, 0.25, -1290.421, 0.3, 0, 0, 0.047, 4.67, -32686.464, -6.1, -100, 0, 0.047, 3.49, 548.678, 0, 0, 0, 0.047, 2.37, 6663.308, -2.2, -19, 0, 0.046, 0.98, 1572.084, 0, 0, 0, 0.046, 2.04, 14954.262, -0.7, 6, 0, 0.046, 3.72, 6691.693, -2.2, -19, 0, 0.045, 6.19, -235.287, 0, 0, 0, 0.044, 2.96, 32967.001, -0.1, 27, 0, 0.044, 3.82, -1671.943, -5.6, -66, 0, 0.043, 5.82, 1179.063, 0, 0, 0, 0.043, 0.07, 34152.617, 1.7, 49, 0, 0.043, 3.71, 6514.773, -0.3, 0, 0, 0.043, 5.62, 15.732, -2.5, -23, 0, 0.043, 5.8, 8351.233, -2.2, -19, 0, 0.042, 0.27, 7740.199, 1.5, 25, 0, 0.042, 6.14, 15385.02, -0.7, 6, 0, 0.042, 6.13, 7285.051, -4.1, -41, 0, 0.041, 1.27, 32757.451, 4.2, 78, 0, 0.041, 4.46, 8275.722, 1.5, 25, 0, 0.04, 0.23, 8381.661, 1.5, 25, 0, 0.04, 5.87, -766.864, 2.5, 29, 0, 0.04, 1.66, 254.431, 0, 0, 0, 0.04, 0.4, 9027.981, -0.4, 0, 0, 0.04, 2.96, 7777.936, 1.5, 25, 0, 0.039, 4.67, 33943.068, 6.1, 100, 0, 0.039, 3.52, 8326.062, 1.5, 25, 0, 0.039, 3.75, 21013.887, -6.5, -57, 0, 0.039, 5.6, 606.978, 0, 0, 0, 0.039, 1.19, 8331.321, 1.5, 25, 0, 0.039, 2.84, 7211.433, -2.2, -19, 0, 0.038, 0.67, 7216.693, -2.2, -19, 0, 0.038, 6.22, 25161.867, 0.6, 28, 0, 0.038, 4.4, 7806.322, 1.5, 25, 0, 0.038, 4.16, 9179.168, -2.2, -19, 0, 0.037, 4.73, 14991.999, -0.7, 6, 0, 0.036, 0.35, 67.514, -0.6, -7, 0, 0.036, 3.7, 25266.611, -1.6, 0, 0, 0.036, 5.39, 16328.796, -0.7, 6, 0, 0.035, 1.44, 7174.248, -2.2, -19, 0, 0.035, 5, 15684.73, -4.4, -38, 0, 0.035, 0.39, -15.419, -2.2, -19, 0, 0.035, 6.07, 15020.385, -0.7, 6, 0, 0.034, 6.01, 7371.797, -2.2, -19, 0, 0.034, 0.96, -16623.626, -3.4, -54, 0, 0.033, 6.24, 9479.368, 1.5, 25, 0, 0.033, 3.21, 23661.896, 5.2, 82, 0, 0.033, 4.06, 8311.418, -2.2, -19, 0, 0.033, 2.4, 1965.105, 0, 0, 0, 0.033, 5.17, 15489.785, -0.7, 6, 0, 0.033, 5.03, 21986.54, 0.9, 31, 0, 0.033, 4.1, 16691.14, 2.7, 46, 0, 0.033, 5.13, 47114.589, 1.7, 63, 0, 0.033, 4.45, 8917.184, 1.5, 25, 0, 0.033, 4.23, 2.078, 0, 0, 0, 0.032, 2.33, 75.251, 1.5, 25, 0, 0.032, 2.1, 7253.878, -2.2, -19, 0, 0.032, 3.11, -0.224, 1.5, 25, 0, 0.032, 4.43, 16640.462, -0.7, 6, 0, 0.032, 5.68, 8328.363, 0, 0, 0, 0.031, 5.32, 8329.02, 3, 50, 0, 0.031, 3.7, 16118.093, -0.7, 6, 0, 0.03, 3.67, 16721.817, -0.7, 6, 0, 0.03, 5.27, -1881.492, -1.2, -15, 0, 0.03, 5.72, 8157.839, -2.2, -19, 0, 0.029, 5.73, -18400.313, -6.7, -94, 0, 0.029, 2.76, 16, -2.2, -19, 0, 0.029, 1.75, 8879.447, 1.5, 25, 0, 0.029, 0.32, 8851.061, 1.5, 25, 0, 0.029, 0.9, 14704.903, 3.7, 57, 0, 0.028, 2.9, 15595.723, -0.7, 6, 0, 0.028, 5.88, 16864.631, 0.2, 24, 0, 0.028, 0.63, 16869.234, -2.8, -26, 0, 0.028, 4.04, -18609.863, -2.4, -43, 0, 0.027, 5.83, 6727.736, -5.9, -63, 0, 0.027, 6.12, 418.752, 4.3, 51, 0, 0.027, 0.14, 41157.131, 3.9, 81, 0, 0.026, 3.8, 15.542, 0, 0, 0, 0.026, 1.68, 50181.698, 4.8, 99, -1, 0.026, 0.32, 315.469, 0, 0, 0, 0.025, 5.67, 19.188, 0.3, 0, 0, 0.025, 3.16, 62.133, -2.2, -19, 0, 0.025, 3.76, 15502.939, -0.7, 6, 0, 0.025, 4.53, 45999.961, -2, 19, 0, 0.024, 3.21, 837.851, -4.4, -51, 0, 0.024, 2.82, 38157.596, 0.3, 37, 0, 0.024, 5.21, 15540.124, -0.7, 6, 0, 0.024, 0.26, 14218.576, 0, 13, 0, 0.024, 3.01, 15545.384, -0.7, 6, 0, 0.024, 1.16, -17424.247, -0.6, -21, 0, 0.023, 2.34, -67.574, 0.6, 7, 0, 0.023, 2.44, 18.024, -1.9, -22, 0, 0.023, 3.7, 469.4, 0, 0, 0, 0.023, 0.72, 7136.511, -2.2, -19, 0, 0.023, 4.5, 15582.569, -0.7, 6, 0, 0.023, 2.8, -16586.395, -4.9, -72, 0, 0.023, 1.51, 80.182, 0, 0, 0, 0.023, 1.09, 5261.583, -1.5, -12, 0, 0.023, 0.56, 54956.954, -0.5, 44, 0, 0.023, 4.01, 8550.86, -2.2, -19, 0, 0.023, 4.46, 38995.448, -4.1, -14, 0, 0.023, 3.82, 2358.126, 0, 0, 0, 0.022, 3.77, 32271.125, 0.5, 34, 0, 0.022, 0.82, 15935.775, -0.7, 6, 0, 0.022, 1.07, 24013.421, -2.9, -13, 0, 0.022, 0.4, 8940.078, -2.2, -19, 0, 0.022, 2.06, 15700.489, -0.7, 6, 0, 0.022, 4.27, 15124.002, -5, -45, 0, 0.021, 1.16, 56071.583, 3.2, 88, 0, 0.021, 5.58, 9572.189, -2.2, -19, 0, 0.02, 1.7, -17.273, -3.7, -44, 0, 0.02, 3.05, 214.617, 0, 0, 0, 0.02, 4.41, 8391.048, -2.2, -19, 0, 0.02, 5.95, 23869.145, 2.4, 56, 0, 0.02, 0.42, 40947.927, -4.7, -21, 0, 0.019, 1.39, 5818.897, 0.3, 10, 0, 0.019, 0.71, 23873.747, -0.7, 6, 0, 0.019, 2.81, 7291.615, -2.2, -19, 0, 0.019, 5.09, 8428.018, -2.2, -19, 0, 0.019, 4.14, 6518.187, -1.6, -12, 0, 0.019, 3.85, 21.33, 0, 0, 0, 0.018, 0.66, 14445.046, -0.7, 6, 0, 0.018, 1.65, 0.966, -4, -48, 0, 0.018, 5.64, -17143.709, -6.8, -94, 0, 0.018, 6.01, 7736.432, -2.2, -19, 0, 0.018, 2.74, 31153.083, -1.9, 5, 0, 0.018, 4.58, 6116.355, -2.2, -19, 0, 0.018, 2.28, 46.401, 0.3, 0, 0, 0.018, 3.8, 10213.597, 1.4, 25, 0, 0.018, 2.84, 56281.132, -1.1, 36, 0, 0.018, 3.53, 8249.062, 1.5, 25, 0, 0.017, 4.43, 20871.911, -3, -13, 0, 0.017, 4.44, 627.596, 0, 0, 0, 0.017, 1.85, 628.308, 0, 0, 0, 0.017, 1.19, 8408.321, 2, 25, 0, 0.017, 1.95, 7214.056, -2, -19, 0, 0.017, 1.57, 7214.07, -2, -19, 0, 0.017, 1.65, 13870.811, -6, -60, 0, 0.017, 0.3, 22.542, -4, -44, 0, 0.017, 2.62, -119.445, 0, 0, 0, 0.016, 4.87, 5747.909, 2, 32, 0, 0.016, 4.45, 14339.108, -1, 6, 0, 0.016, 1.83, 41366.68, 0, 30, 0, 0.016, 4.53, 16309.618, -3, -23, 0, 0.016, 2.54, 15542.754, -1, 6, 0, 0.016, 6.05, 1203.646, 0, 0, 0, 0.015, 5.2, 2751.147, 0, 0, 0, 0.015, 1.8, -10699.924, -5, -69, 0, 0.015, 0.4, 22824.391, -3, -20, 0, 0.015, 2.1, 30666.756, -6, -39, 0, 0.015, 2.1, 6010.417, -2, -19, 0, 0.015, 0.7, -23729.47, -5, -75, 0, 0.015, 1.4, 14363.691, -1, 6, 0, 0.015, 5.8, 16900.689, -2, 0, 0, 0.015, 5.2, 23800.458, 3, 53, 0, 0.015, 5.3, 6035, -2, -19, 0, 0.015, 1.2, 8251.139, 2, 25, 0, 0.015, 3.6, -8.86, 0, 0, 0, 0.015, 0.8, 882.739, 0, 0, 0, 0.015, 3, 1021.329, 0, 0, 0, 0.015, 0.6, 23296.107, 1, 31, 0, 0.014, 5.4, 7227.181, 2, 25, 0, 0.014, 0.1, 7213.352, -2, -19, 0, 0.014, 4, 15506.706, 3, 50, 0, 0.014, 3.4, 7214.774, -2, -19, 0, 0.014, 4.6, 6665.385, -2, -19, 0, 0.014, 0.1, -8.636, -2, -22, 0, 0.014, 3.1, 15465.202, -1, 6, 0, 0.014, 4.9, 508.863, 0, 0, 0, 0.014, 3.5, 8406.244, 2, 25, 0, 0.014, 1.3, 13313.497, -8, -82, 0, 0.014, 2.8, 49276.619, -3, 0, 0, 0.014, 0.1, 30528.194, -3, -10, 0, 0.013, 1.7, 25128.05, 1, 31, 0, 0.013, 2.9, 14128.405, -1, 6, 0, 0.013, 3.4, 57395.761, 3, 80, 0, 0.013, 2.7, 13029.546, -1, 6, 0, 0.013, 3.9, 7802.556, -2, -19, 0, 0.013, 1.6, 8258.802, -2, -19, 0, 0.013, 2.2, 8417.709, -2, -19, 0, 0.013, 0.7, 9965.21, -2, -19, 0, 0.013, 3.4, 50391.247, 0, 48, 0, 0.013, 3, 7134.433, -2, -19, 0, 0.013, 2.9, 30599.182, -5, -31, 0, 0.013, 3.6, -9723.857, 1, 0, 0, 0.013, 4.8, 7607.084, -2, -19, 0, 0.012, 0.8, 23837.689, 1, 35, 0, 0.012, 3.6, 4.409, -4, -44, 0, 0.012, 5, 16657.031, 3, 50, 0, 0.012, 4.4, 16657.735, 3, 50, 0, 0.012, 1.1, 15578.803, -4, -38, 0, 0.012, 6, -11.49, 0, 0, 0, 0.012, 1.9, 8164.398, 0, 0, 0, 0.012, 2.4, 31852.372, -4, -17, 0, 0.012, 2.4, 6607.085, -2, -19, 0, 0.012, 4.2, 8359.87, 0, 0, 0, 0.012, 0.5, 5799.713, -2, -19, 0, 0.012, 2.7, 7220.622, 0, 0, 0, 0.012, 4.3, -139.72, 0, 0, 0, 0.012, 2.3, 13728.836, -2, -16, 0, 0.011, 3.6, 14912.146, 1, 31, 0, 0.011, 4.7, 14916.748, -2, -19, 0],
  [1.6768, 4.66926, 628.301955, -0.0266, 0.1, -5e-3, 0.51642, 3.3721, 6585.76091, -2.158, -18.9, 0.09, 0.41383, 5.7277, 14914.452335, -0.635, 6.2, -0.04, 0.37115, 3.9695, 7700.389469, 1.55, 25, -0.12, 0.2756, 0.7416, 8956.99338, 1.496, 25.1, -0.13, 0.24599, 4.2253, -2.3012, 1.523, 25.1, -0.12, 0.07118, 0.1443, 7842.36482, -2.211, -19, 0.08, 0.06128, 2.4998, 16171.05625, -0.688, 6, 0, 0.04516, 0.443, 8399.6791, -0.36, 3, 0, 0.04048, 5.771, 14286.15038, -0.61, 6, 0, 0.03747, 4.626, 1256.60391, -0.05, 0, 0, 0.03707, 3.415, 5957.45895, -2.13, -19, 0.1, 0.03649, 1.8, 23243.14376, 0.89, 31, -0.2, 0.02438, 0.042, 16029.08089, 3.07, 50, -0.2, 0.02165, 1.017, -1742.93051, -3.68, -44, 0.2, 0.01923, 3.097, 17285.6848, 3.02, 50, -0.3, 0.01692, 1.28, 0.3286, 1.52, 25, -0.1, 0.01361, 0.298, 8326.3902, 3.05, 50, -0.2, 0.01293, 4.013, 7072.0875, 1.58, 25, -0.1, 0.01276, 4.413, 8330.9926, 0, 0, 0, 0.0127, 0.101, 8470.6668, -2.24, -19, 0.1, 0.01097, 1.203, 22128.5152, -2.82, -13, 0, 0.01088, 2.545, 15542.7543, -0.66, 6, 0, 835e-5, 0.19, 7214.0629, -2.18, -19, 0.1, 734e-5, 4.855, 24499.7477, 0.83, 31, -0.2, 686e-5, 5.13, 13799.8238, -4.34, -38, 0.2, 631e-5, 0.93, -486.3266, -3.73, -44, 0, 585e-5, 0.699, 9585.2953, 1.5, 25, 0, 566e-5, 4.073, 8328.3391, 1.5, 25, 0, 566e-5, 0.638, 8329.0437, 1.5, 25, 0, 539e-5, 2.472, -1952.48, 0.6, 7, 0, 509e-5, 2.88, -0.7113, 0, 0, 0, 469e-5, 3.56, 30457.2066, -1.3, 12, 0, 387e-5, 0.78, -0.3523, 0, 0, 0, 378e-5, 1.84, 22614.8418, 0.9, 31, 0, 362e-5, 5.53, -695.8761, 0.6, 7, 0, 317e-5, 2.8, 16728.3705, 1.2, 28, 0, 303e-5, 6.07, 157.7344, 0, 0, 0, 3e-3, 2.53, 33.757, -0.3, -4, 0, 295e-5, 4.16, 31571.8352, 2.4, 56, 0, 289e-5, 5.98, 7211.7617, -0.7, 6, 0, 285e-5, 2.06, 15540.4531, 0.9, 31, 0, 283e-5, 2.65, 2.6298, 0, 0, 0, 282e-5, 6.17, 15545.0555, -2.2, -19, 0, 278e-5, 1.23, -39.8149, 0, 0, 0, 272e-5, 3.82, 7216.3641, -3.7, -44, 0, 27e-4, 4.37, 70.9877, -1.9, -22, 0, 256e-5, 5.81, 13657.8484, -0.6, 6, 0, 244e-5, 5.64, -0.2237, 1.5, 25, 0, 24e-4, 2.96, 8311.7707, -2.2, -19, 0, 239e-5, 0.87, -33.7814, 0.3, 4, 0, 216e-5, 2.31, 15.9995, -2.2, -19, 0, 186e-5, 3.46, 5329.157, -2.1, -19, 0, 169e-5, 2.4, 24357.772, 4.6, 75, 0, 161e-5, 5.8, 8329.403, 1.5, 25, 0, 161e-5, 5.2, 8327.98, 1.5, 25, 0, 16e-4, 4.26, 23385.119, -2.9, -13, 0, 156e-5, 1.26, 550.755, 0, 0, 0, 155e-5, 1.25, 21500.213, -2.8, -13, 0, 152e-5, 0.6, -16.921, -3.7, -44, 0, 15e-4, 2.71, -79.63, 0, 0, 0, 15e-4, 5.29, 15.542, 0, 0, 0, 148e-5, 1.06, -2371.232, -3.7, -44, 0, 141e-5, 0.77, 8328.691, 1.5, 25, 0, 141e-5, 3.67, 7143.075, -0.3, 0, 0, 138e-5, 5.45, 25614.376, 4.5, 75, 0, 129e-5, 4.9, 23871.446, 0.9, 31, 0, 126e-5, 4.03, 141.975, -3.8, -44, 0, 124e-5, 6.01, 522.369, 0, 0, 0, 12e-4, 4.94, -10071.622, -5.2, -69, 0, 118e-5, 5.07, -15.419, -2.2, -19, 0, 107e-5, 3.49, 23452.693, -3.4, -20, 0, 104e-5, 4.78, 17495.234, -1.3, 0, 0, 103e-5, 1.44, -18.049, -2.2, -19, 0, 102e-5, 5.63, 15542.402, -0.7, 6, 0, 102e-5, 2.59, 15543.107, -0.7, 6, 0, 1e-3, 4.11, -6.559, -1.9, -22, 0, 97e-5, 0.08, 15400.779, 3.1, 50, 0, 96e-5, 5.84, 31781.385, -1.9, 5, 0, 94e-5, 1.08, 8328.363, 0, 0, 0, 94e-5, 2.46, 16799.358, -0.7, 6, 0, 94e-5, 1.69, 6376.211, 2.2, 32, 0, 93e-5, 3.64, 8329.02, 3, 50, 0, 93e-5, 2.65, 16655.082, 4.6, 75, 0, 9e-4, 1.9, 15056.428, -4.4, -38, 0, 89e-5, 1.59, 52.969, 0, 0, 0, 88e-5, 2.02, -8257.704, -3.4, -47, 0, 88e-5, 3.02, 7213.711, -2.2, -19, 0, 87e-5, 0.5, 7214.415, -2.2, -19, 0, 87e-5, 0.49, 16659.684, 1.5, 25, 0, 82e-5, 5.64, -4.931, 1.5, 25, 0, 79e-5, 5.17, 13171.522, -4.3, -38, 0, 76e-5, 3.6, 29828.905, -1.3, 12, 0, 76e-5, 4.08, 24567.322, 0.3, 24, 0, 76e-5, 4.58, 1884.906, -0.1, 0, 0, 73e-5, 0.33, 31713.811, -1.4, 12, 0, 73e-5, 0.93, 32828.439, 2.4, 56, 0, 71e-5, 5.91, 38785.898, 0.2, 37, 0, 69e-5, 2.2, 15613.742, -2.5, -16, 0, 66e-5, 3.87, 15.732, -2.5, -23, 0, 66e-5, 0.86, 25823.926, 0.2, 24, 0, 65e-5, 2.52, 8170.957, 1.5, 25, 0, 63e-5, 0.18, 8322.132, -0.3, 0, 0, 6e-4, 5.84, 8326.062, 1.5, 25, 0, 6e-4, 5.15, 8331.321, 1.5, 25, 0, 6e-4, 2.18, 8486.426, 1.5, 25, 0, 58e-5, 2.3, -1.731, -4, -44, 0, 58e-5, 5.43, 14357.138, -2, -16, 0, 57e-5, 3.09, 8294.91, 2, 29, 0, 57e-5, 4.67, -8362.473, -1, -21, 0, 56e-5, 4.15, 16833.151, -1, 0, 0, 54e-5, 1.93, 7056.329, -2, -19, 0, 54e-5, 5.27, 8315.574, -2, -19, 0, 52e-5, 5.6, 8311.418, -2, -19, 0, 52e-5, 2.7, -77.552, 0, 0, 0, 51e-5, 4.3, 7230.984, 2, 25, 0, 5e-4, 0.4, -0.508, 0, 0, 0, 49e-5, 5.4, 7211.433, -2, -19, 0, 49e-5, 4.4, 7216.693, -2, -19, 0, 49e-5, 4.3, 16864.631, 0, 24, 0, 49e-5, 2.2, 16869.234, -3, -26, 0, 47e-5, 6.1, 627.596, 0, 0, 0, 47e-5, 5, 12.619, 1, 7, 0, 45e-5, 4.9, -8815.018, -5, -69, 0, 44e-5, 1.6, 62.133, -2, -19, 0, 42e-5, 2.9, -13.118, -4, -44, 0, 42e-5, 4.1, -119.445, 0, 0, 0, 41e-5, 4.3, 22756.817, -3, -13, 0, 41e-5, 3.6, 8288.877, 2, 25, 0, 4e-4, 0.5, 6663.308, -2, -19, 0, 4e-4, 1.1, 8368.506, 2, 25, 0, 39e-5, 4.1, 6443.786, 2, 25, 0, 39e-5, 3.1, 16657.383, 3, 50, 0, 38e-5, 0.1, 16657.031, 3, 50, 0, 38e-5, 3, 16657.735, 3, 50, 0, 38e-5, 4.6, 23942.433, -1, 9, 0, 37e-5, 4.3, 15385.02, -1, 6, 0, 37e-5, 5, 548.678, 0, 0, 0, 36e-5, 1.8, 7213.352, -2, -19, 0, 36e-5, 1.7, 7214.774, -2, -19, 0, 35e-5, 1.1, 7777.936, 2, 25, 0, 35e-5, 1.6, -8.86, 0, 0, 0, 35e-5, 4.4, 23869.145, 2, 56, 0, 35e-5, 2, 6691.693, -2, -19, 0, 34e-5, 1.3, -1185.616, -2, -22, 0, 34e-5, 2.2, 23873.747, -1, 6, 0, 33e-5, 2, -235.287, 0, 0, 0, 33e-5, 3.1, 17913.987, 3, 50, 0, 33e-5, 1, 8351.233, -2, -19, 0],
  [487e-5, 4.6693, 628.30196, -0.027, 0, -0.01, 228e-5, 2.6746, -2.3012, 1.523, 25, -0.12, 15e-4, 3.372, 6585.76091, -2.16, -19, 0.1, 12e-4, 5.728, 14914.45233, -0.64, 6, 0, 108e-5, 3.969, 7700.38947, 1.55, 25, -0.1, 8e-4, 0.742, 8956.99338, 1.5, 25, -0.1, 254e-6, 6.002, 0.3286, 1.52, 25, -0.1, 21e-5, 0.144, 7842.3648, -2.21, -19, 0, 18e-5, 2.5, 16171.0562, -0.7, 6, 0, 13e-5, 0.44, 8399.6791, -0.4, 3, 0, 126e-6, 5.03, 8326.3902, 3, 50, 0, 12e-5, 5.77, 14286.1504, -0.6, 6, 0, 118e-6, 5.96, 8330.9926, 0, 0, 0, 11e-5, 1.8, 23243.1438, 0.9, 31, 0, 11e-5, 3.42, 5957.459, -2.1, -19, 0, 11e-5, 4.63, 1256.6039, -0.1, 0, 0, 99e-6, 4.7, -0.7113, 0, 0, 0, 7e-5, 0.04, 16029.0809, 3.1, 50, 0, 7e-5, 5.14, 8328.3391, 1.5, 25, 0, 7e-5, 5.85, 8329.0437, 1.5, 25, 0, 6e-5, 1.02, -1742.9305, -3.7, -44, 0, 6e-5, 3.1, 17285.6848, 3, 50, 0, 54e-6, 5.69, -0.352, 0, 0, 0, 43e-6, 0.52, 15.542, 0, 0, 0, 41e-6, 2.03, 2.63, 0, 0, 0, 4e-5, 0.1, 8470.667, -2.2, -19, 0, 4e-5, 4.01, 7072.088, 1.6, 25, 0, 36e-6, 2.93, -8.86, -0.3, 0, 0, 3e-5, 1.2, 22128.515, -2.8, -13, 0, 3e-5, 2.54, 15542.754, -0.7, 6, 0, 27e-6, 4.43, 7211.762, -0.7, 6, 0, 26e-6, 0.51, 15540.453, 0.9, 31, 0, 26e-6, 1.44, 15545.055, -2.2, -19, 0, 25e-6, 5.37, 7216.364, -3.7, -44, 0],
  [12e-6, 1.041, -2.3012, 1.52, 25, -0.1, 17e-7, 0.31, -0.711, 0, 0, 0]
];
ShouXingUtil.QI_KB = [
  1640650479938e-6,
  15.218425,
  1642476703182e-6,
  15.21874996,
  1683430515601e-6,
  15.218750011,
  1752157640664e-6,
  15.218749978,
  1807675003759e-6,
  15.218620279,
  1883627765182e-6,
  15.218612292,
  19073691281e-4,
  15.218449176,
  1936603140413e-6,
  15.218425,
  193914552418e-5,
  15.218466998,
  19471807983e-4,
  15.218524844,
  1964362041824e-6,
  15.218533526,
  1987372340971e-6,
  15.218513908,
  1999653819126e-6,
  15.218530782,
  2007445469786e-6,
  15.218535181,
  2021324917146e-6,
  15.218526248,
  2047257232342e-6,
  15.218519654,
  2070282898213e-6,
  15.218425,
  207320487285e-5,
  15.218515221,
  2080144500926e-6,
  15.218530782,
  2086703688963e-6,
  15.218523776,
  2110033182763e-6,
  15.218425,
  2111190300888e-6,
  15.218425,
  2113731271005e-6,
  15.218515671,
  2120670840263e-6,
  15.218425,
  2123973309063e-6,
  15.218425,
  2125068997336e-6,
  15.218477932,
  2136026312633e-6,
  15.218472436,
  2156099495538e-6,
  15.218425,
  2159021324663e-6,
  15.218425,
  2162308575254e-6,
  15.218461742,
  2178485706538e-6,
  15.218425,
  2178759662849e-6,
  15.218445786,
  21853340208e-4,
  15.218425,
  2187525481425e-6,
  15.218425,
  2188621191481e-6,
  15.218437494,
  232214776e-2
];
ShouXingUtil.QB = _ShouXingUtil.decode("FrcFs22AFsckF2tsDtFqEtF1posFdFgiFseFtmelpsEfhkF2anmelpFlF1ikrotcnEqEq2FfqmcDsrFor22FgFrcgDscFs22FgEeFtE2sfFs22sCoEsaF2tsD1FpeE2eFsssEciFsFnmelpFcFhkF2tcnEqEpFgkrotcnEqrEtFermcDsrE222FgBmcmr22DaEfnaF222sD1FpeForeF2tssEfiFpEoeFssD1iFstEqFppDgFstcnEqEpFg11FscnEqrAoAF2ClAEsDmDtCtBaDlAFbAEpAAAAAD2FgBiBqoBbnBaBoAAAAAAAEgDqAdBqAFrBaBoACdAAf1AACgAAAeBbCamDgEifAE2AABa1C1BgFdiAAACoCeE1ADiEifDaAEqAAFe1AcFbcAAAAAF1iFaAAACpACmFmAAAAAAAACrDaAAADG0");
ShouXingUtil.SHUO_KB = [1457698231017e-6, 29.53067166, 1546082512234e-6, 29.53085106, 16406407353e-4, 29.5306, 1642472151543e-6, 29.53085439, 16834305093e-4, 29.53086148, 1752148041079e-6, 29.53085097, 1807665420323e-6, 29.53059851, 18836181141e-4, 29.5306, 19073607047e-4, 29.5306, 19365962249e-4, 29.5306, 19391356753e-4, 29.5306, 1947168];
ShouXingUtil.SB = _ShouXingUtil.decode("EqoFscDcrFpmEsF2DfFideFelFpFfFfFiaipqti1ksttikptikqckstekqttgkqttgkqteksttikptikq2fjstgjqttjkqttgkqtekstfkptikq2tijstgjiFkirFsAeACoFsiDaDiADc1AFbBfgdfikijFifegF1FhaikgFag1E2btaieeibggiffdeigFfqDfaiBkF1kEaikhkigeidhhdiegcFfakF1ggkidbiaedksaFffckekidhhdhdikcikiakicjF1deedFhFccgicdekgiFbiaikcfi1kbFibefgEgFdcFkFeFkdcfkF1kfkcickEiFkDacFiEfbiaejcFfffkhkdgkaiei1ehigikhdFikfckF1dhhdikcfgjikhfjicjicgiehdikcikggcifgiejF1jkieFhegikggcikFegiegkfjebhigikggcikdgkaFkijcfkcikfkcifikiggkaeeigefkcdfcfkhkdgkegieidhijcFfakhfgeidieidiegikhfkfckfcjbdehdikggikgkfkicjicjF1dbidikFiggcifgiejkiegkigcdiegfggcikdbgfgefjF1kfegikggcikdgFkeeijcfkcikfkekcikdgkabhkFikaffcfkhkdgkegbiaekfkiakicjhfgqdq2fkiakgkfkhfkfcjiekgFebicggbedF1jikejbbbiakgbgkacgiejkijjgigfiakggfggcibFifjefjF1kfekdgjcibFeFkijcfkfhkfkeaieigekgbhkfikidfcjeaibgekgdkiffiffkiakF1jhbakgdki1dj1ikfkicjicjieeFkgdkicggkighdF1jfgkgfgbdkicggfggkidFkiekgijkeigfiskiggfaidheigF1jekijcikickiggkidhhdbgcfkFikikhkigeidieFikggikhkffaffijhidhhakgdkhkijF1kiakF1kfheakgdkifiggkigicjiejkieedikgdfcggkigieeiejfgkgkigbgikicggkiaideeijkefjeijikhkiggkiaidheigcikaikffikijgkiahi1hhdikgjfifaakekighie1hiaikggikhkffakicjhiahaikggikhkijF1kfejfeFhidikggiffiggkigicjiekgieeigikggiffiggkidheigkgfjkeigiegikifiggkidhedeijcfkFikikhkiggkidhh1ehigcikaffkhkiggkidhh1hhigikekfiFkFikcidhh1hitcikggikhkfkicjicghiediaikggikhkijbjfejfeFhaikggifikiggkigiejkikgkgieeigikggiffiggkigieeigekijcijikggifikiggkideedeijkefkfckikhkiggkidhh1ehijcikaffkhkiggkidhh1hhigikhkikFikfckcidhh1hiaikgjikhfjicjicgiehdikcikggifikigiejfejkieFhegikggifikiggfghigkfjeijkhigikggifikiggkigieeijcijcikfksikifikiggkidehdeijcfdckikhkiggkhghh1ehijikifffffkhsFngErD1pAfBoDd1BlEtFqA2AqoEpDqElAEsEeB2BmADlDkqBtC1FnEpDqnEmFsFsAFnllBbFmDsDiCtDmAB2BmtCgpEplCpAEiBiEoFqFtEqsDcCnFtADnFlEgdkEgmEtEsCtDmADqFtAFrAtEcCqAE1BoFqC1F1DrFtBmFtAC2ACnFaoCgADcADcCcFfoFtDlAFgmFqBq2bpEoAEmkqnEeCtAE1bAEqgDfFfCrgEcBrACfAAABqAAB1AAClEnFeCtCgAADqDoBmtAAACbFiAAADsEtBqAB2FsDqpFqEmFsCeDtFlCeDtoEpClEqAAFrAFoCgFmFsFqEnAEcCqFeCtFtEnAEeFtAAEkFnErAABbFkADnAAeCtFeAfBoAEpFtAABtFqAApDcCGJ");
var _LunarYear = class {
  static fromYear(lunarYear) {
    let y;
    if (!_LunarYear._CACHE_YEAR || _LunarYear._CACHE_YEAR.getYear() != lunarYear) {
      y = new _LunarYear(lunarYear);
      _LunarYear._CACHE_YEAR = y;
    } else {
      y = _LunarYear._CACHE_YEAR;
    }
    return y;
  }
  constructor(lunarYear) {
    this._year = lunarYear;
    this._months = [];
    this._jieQiJulianDays = [];
    const offset = lunarYear - 4;
    let yearGanIndex = offset % 10;
    let yearZhiIndex = offset % 12;
    if (yearGanIndex < 0) {
      yearGanIndex += 10;
    }
    if (yearZhiIndex < 0) {
      yearZhiIndex += 12;
    }
    this._ganIndex = yearGanIndex;
    this._zhiIndex = yearZhiIndex;
    this.compute();
  }
  compute() {
    const jq = [];
    const hs = [];
    const dayCounts = [];
    const months = [];
    let i, j;
    const currentYear = this._year;
    let jd = Math.floor((currentYear - 2e3) * 365.2422 + 180);
    let w = Math.floor((jd - 355 + 183) / 365.2422) * 365.2422 + 355;
    if (ShouXingUtil.calcQi(w) > jd) {
      w -= 365.2422;
    }
    for (i = 0; i < 26; i++) {
      jq.push(ShouXingUtil.calcQi(w + 15.2184 * i));
    }
    for (i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
      if (i === 0) {
        jd = ShouXingUtil.qiAccurate2(jq[0] - 15.2184);
      } else if (i <= 26) {
        jd = ShouXingUtil.qiAccurate2(jq[i - 1]);
      } else {
        jd = ShouXingUtil.qiAccurate2(jq[25] + 15.2184 * (i - 26));
      }
      this._jieQiJulianDays.push(jd + Solar.J2000);
    }
    w = ShouXingUtil.calcShuo(jq[0]);
    if (w > jq[0]) {
      w -= 29.53;
    }
    for (i = 0; i < 16; i++) {
      hs.push(ShouXingUtil.calcShuo(w + 29.5306 * i));
    }
    for (i = 0; i < 15; i++) {
      dayCounts.push(Math.floor(hs[i + 1] - hs[i]));
      months.push(i);
    }
    const prevYear = currentYear - 1;
    let leapIndex = 16;
    if (_LunarYear._LEAP_11.indexOf(currentYear) > -1) {
      leapIndex = 13;
    } else if (_LunarYear._LEAP_12.indexOf(currentYear) > -1) {
      leapIndex = 14;
    } else if (hs[13] <= jq[24]) {
      i = 1;
      while (hs[i + 1] > jq[2 * i] && i < 13) {
        i++;
      }
      leapIndex = i;
    }
    for (j = leapIndex; j < 15; j++) {
      months[j] -= 1;
    }
    const ymc = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let fm = -1;
    let index = -1;
    let y = prevYear;
    for (i = 0; i < 15; i++) {
      const dm = hs[i] + Solar.J2000;
      const v2 = months[i];
      let mc = ymc[v2 % 12];
      if (1724360 <= dm && dm < 1729794) {
        mc = ymc[(v2 + 1) % 12];
      } else if (1807724 <= dm && dm < 1808699) {
        mc = ymc[(v2 + 1) % 12];
      } else if (dm == 1729794 || dm == 1808699) {
        mc = 12;
      }
      if (fm == -1) {
        fm = mc;
        index = mc;
      }
      if (mc < fm) {
        y += 1;
        index = 1;
      }
      fm = mc;
      if (i == leapIndex) {
        mc = -mc;
      } else if (dm == 1729794 || dm == 1808699) {
        mc = -11;
      }
      this._months.push(new LunarMonth(y, mc, dayCounts[i], hs[i] + Solar.J2000, index));
      index++;
    }
  }
  getYear() {
    return this._year;
  }
  getGanIndex() {
    return this._ganIndex;
  }
  getZhiIndex() {
    return this._zhiIndex;
  }
  getGan() {
    return LunarUtil.GAN[this._ganIndex + 1];
  }
  getZhi() {
    return LunarUtil.ZHI[this._zhiIndex + 1];
  }
  getGanZhi() {
    return this.getGan() + this.getZhi();
  }
  getJieQiJulianDays() {
    return this._jieQiJulianDays;
  }
  getDayCount() {
    let n = 0;
    for (let i = 0, j = this._months.length; i < j; i++) {
      const m = this._months[i];
      if (m.getYear() == this._year) {
        n += m.getDayCount();
      }
    }
    return n;
  }
  getMonths() {
    return this._months;
  }
  getMonthsInYear() {
    const l = [];
    for (let i = 0, j = this._months.length; i < j; i++) {
      const m = this._months[i];
      if (m.getYear() == this._year) {
        l.push(m);
      }
    }
    return l;
  }
  getMonth(lunarMonth) {
    for (let i = 0, j = this._months.length; i < j; i++) {
      const m = this._months[i];
      if (m.getYear() == this._year && m.getMonth() == lunarMonth) {
        return m;
      }
    }
    return null;
  }
  getLeapMonth() {
    for (let i = 0, j = this._months.length; i < j; i++) {
      const m = this._months[i];
      if (m.getYear() == this._year && m.isLeap()) {
        return Math.abs(m.getMonth());
      }
    }
    return 0;
  }
  toString() {
    return `${this.getYear()}`;
  }
  toFullString() {
    return `${this.getYear()}\u5E74`;
  }
  _getZaoByGan(index, name) {
    const month = this.getMonth(1);
    if (null == month) {
      return "";
    }
    let offset = index - Solar.fromJulianDay(month.getFirstJulianDay()).getLunar().getDayGanIndex();
    if (offset < 0) {
      offset += 10;
    }
    return name.replace("\u51E0", LunarUtil.NUMBER[offset + 1]);
  }
  _getZaoByZhi(index, name) {
    const month = this.getMonth(1);
    if (null == month) {
      return "";
    }
    let offset = index - Solar.fromJulianDay(month.getFirstJulianDay()).getLunar().getDayZhiIndex();
    if (offset < 0) {
      offset += 12;
    }
    return name.replace("\u51E0", LunarUtil.NUMBER[offset + 1]);
  }
  getTouLiang() {
    return this._getZaoByZhi(0, "\u51E0\u9F20\u5077\u7CAE");
  }
  getCaoZi() {
    return this._getZaoByZhi(0, "\u8349\u5B50\u51E0\u5206");
  }
  getGengTian() {
    return this._getZaoByZhi(1, "\u51E0\u725B\u8015\u7530");
  }
  getHuaShou() {
    return this._getZaoByZhi(3, "\u82B1\u6536\u51E0\u5206");
  }
  getZhiShui() {
    return this._getZaoByZhi(4, "\u51E0\u9F99\u6CBB\u6C34");
  }
  getTuoGu() {
    return this._getZaoByZhi(6, "\u51E0\u9A6C\u9A6E\u8C37");
  }
  getQiangMi() {
    return this._getZaoByZhi(9, "\u51E0\u9E21\u62A2\u7C73");
  }
  getKanCan() {
    return this._getZaoByZhi(9, "\u51E0\u59D1\u770B\u8695");
  }
  getGongZhu() {
    return this._getZaoByZhi(11, "\u51E0\u5C60\u5171\u732A");
  }
  getJiaTian() {
    return this._getZaoByGan(0, "\u7532\u7530\u51E0\u5206");
  }
  getFenBing() {
    return this._getZaoByGan(2, "\u51E0\u4EBA\u5206\u997C");
  }
  getDeJin() {
    return this._getZaoByGan(7, "\u51E0\u65E5\u5F97\u91D1");
  }
  getRenBing() {
    return this._getZaoByGan(2, this._getZaoByZhi(2, "\u51E0\u4EBA\u51E0\u4E19"));
  }
  getRenChu() {
    return this._getZaoByGan(3, this._getZaoByZhi(2, "\u51E0\u4EBA\u51E0\u9504"));
  }
  getYuan() {
    return _LunarYear.YUAN[Math.floor((this._year + 2696) / 60) % 3] + "\u5143";
  }
  getYun() {
    return _LunarYear.YUN[Math.floor((this._year + 2696) / 20) % 9] + "\u8FD0";
  }
  getNineStar() {
    const index = LunarUtil.getJiaZiIndex(this.getGanZhi()) + 1;
    const yuan = Math.floor(this._year + 2696) / 60 % 3;
    let offset = (62 + yuan * 3 - index) % 9;
    if (0 == offset) {
      offset = 9;
    }
    return NineStar.fromIndex(offset - 1);
  }
  getPositionXi() {
    return LunarUtil.POSITION_XI[this._ganIndex + 1];
  }
  getPositionXiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionXi()];
  }
  getPositionYangGui() {
    return LunarUtil.POSITION_YANG_GUI[this._ganIndex + 1];
  }
  getPositionYangGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYangGui()];
  }
  getPositionYinGui() {
    return LunarUtil.POSITION_YIN_GUI[this._ganIndex + 1];
  }
  getPositionYinGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYinGui()];
  }
  getPositionFu(sect = 2) {
    return (1 == sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this._ganIndex + 1];
  }
  getPositionFuDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getPositionFu(sect)];
  }
  getPositionCai() {
    return LunarUtil.POSITION_CAI[this._ganIndex + 1];
  }
  getPositionCaiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionCai()];
  }
  getPositionTaiSui() {
    return LunarUtil.POSITION_TAI_SUI_YEAR[this._zhiIndex];
  }
  getPositionTaiSuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionTaiSui()];
  }
  next(n) {
    return _LunarYear.fromYear(this._year + n);
  }
};
var LunarYear = _LunarYear;
LunarYear.YUAN = ["\u4E0B", "\u4E0A", "\u4E2D"];
LunarYear.YUN = ["\u4E03", "\u516B", "\u4E5D", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
LunarYear._LEAP_11 = [75, 94, 170, 265, 322, 398, 469, 553, 583, 610, 678, 735, 754, 773, 849, 887, 936, 1050, 1069, 1126, 1145, 1164, 1183, 1259, 1278, 1308, 1373, 1403, 1441, 1460, 1498, 1555, 1593, 1612, 1631, 1642, 2033, 2128, 2147, 2242, 2614, 2728, 2910, 3062, 3244, 3339, 3616, 3711, 3730, 3825, 4007, 4159, 4197, 4322, 4341, 4379, 4417, 4531, 4599, 4694, 4713, 4789, 4808, 4971, 5085, 5104, 5161, 5180, 5199, 5294, 5305, 5476, 5677, 5696, 5772, 5791, 5848, 5886, 6049, 6068, 6144, 6163, 6258, 6402, 6440, 6497, 6516, 6630, 6641, 6660, 6679, 6736, 6774, 6850, 6869, 6899, 6918, 6994, 7013, 7032, 7051, 7070, 7089, 7108, 7127, 7146, 7222, 7271, 7290, 7309, 7366, 7385, 7404, 7442, 7461, 7480, 7491, 7499, 7594, 7624, 7643, 7662, 7681, 7719, 7738, 7814, 7863, 7882, 7901, 7939, 7958, 7977, 7996, 8034, 8053, 8072, 8091, 8121, 8159, 8186, 8216, 8235, 8254, 8273, 8311, 8330, 8341, 8349, 8368, 8444, 8463, 8474, 8493, 8531, 8569, 8588, 8626, 8664, 8683, 8694, 8702, 8713, 8721, 8751, 8789, 8808, 8816, 8827, 8846, 8884, 8903, 8922, 8941, 8971, 9036, 9066, 9085, 9104, 9123, 9142, 9161, 9180, 9199, 9218, 9256, 9294, 9313, 9324, 9343, 9362, 9381, 9419, 9438, 9476, 9514, 9533, 9544, 9552, 9563, 9571, 9582, 9601, 9639, 9658, 9666, 9677, 9696, 9734, 9753, 9772, 9791, 9802, 9821, 9886, 9897, 9916, 9935, 9954, 9973, 9992];
LunarYear._LEAP_12 = [37, 56, 113, 132, 151, 189, 208, 227, 246, 284, 303, 341, 360, 379, 417, 436, 458, 477, 496, 515, 534, 572, 591, 629, 648, 667, 697, 716, 792, 811, 830, 868, 906, 925, 944, 963, 982, 1001, 1020, 1039, 1058, 1088, 1153, 1202, 1221, 1240, 1297, 1335, 1392, 1411, 1422, 1430, 1517, 1525, 1536, 1574, 3358, 3472, 3806, 3988, 4751, 4941, 5066, 5123, 5275, 5343, 5438, 5457, 5495, 5533, 5552, 5715, 5810, 5829, 5905, 5924, 6421, 6535, 6793, 6812, 6888, 6907, 7002, 7184, 7260, 7279, 7374, 7556, 7746, 7757, 7776, 7833, 7852, 7871, 7966, 8015, 8110, 8129, 8148, 8224, 8243, 8338, 8406, 8425, 8482, 8501, 8520, 8558, 8596, 8607, 8615, 8645, 8740, 8778, 8835, 8865, 8930, 8960, 8979, 8998, 9017, 9055, 9074, 9093, 9112, 9150, 9188, 9237, 9275, 9332, 9351, 9370, 9408, 9427, 9446, 9457, 9465, 9495, 9560, 9590, 9628, 9647, 9685, 9715, 9742, 9780, 9810, 9818, 9829, 9848, 9867, 9905, 9924, 9943, 9962, 1e4];
LunarYear._CACHE_YEAR = null;
var LunarTime = class _LunarTime {
  static fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second) {
    return new _LunarTime(lunarYear, lunarMonth, lunarDay, hour, minute, second);
  }
  constructor(lunarYear, lunarMonth, lunarDay, hour, minute, second) {
    this._lunar = Lunar.fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second);
    this._zhiIndex = LunarUtil.getTimeZhiIndex([(hour < 10 ? "0" : "") + hour, (minute < 10 ? "0" : "") + minute].join(":"));
    this._ganIndex = (this._lunar.getDayGanIndexExact() % 5 * 2 + this._zhiIndex) % 10;
  }
  getGanIndex() {
    return this._ganIndex;
  }
  getZhiIndex() {
    return this._zhiIndex;
  }
  getGan() {
    return LunarUtil.GAN[this._ganIndex + 1];
  }
  getZhi() {
    return LunarUtil.ZHI[this._zhiIndex + 1];
  }
  getGanZhi() {
    return this.getGan() + this.getZhi();
  }
  getShengXiao() {
    return LunarUtil.SHENGXIAO[this._zhiIndex + 1];
  }
  getPositionXi() {
    return LunarUtil.POSITION_XI[this._ganIndex + 1];
  }
  getPositionXiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionXi()];
  }
  getPositionYangGui() {
    return LunarUtil.POSITION_YANG_GUI[this._ganIndex + 1];
  }
  getPositionYangGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYangGui()];
  }
  getPositionYinGui() {
    return LunarUtil.POSITION_YIN_GUI[this._ganIndex + 1];
  }
  getPositionYinGuiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionYinGui()];
  }
  getPositionFu(sect = 2) {
    return (1 === sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this._ganIndex + 1];
  }
  getPositionFuDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getPositionFu(sect)];
  }
  getPositionCai() {
    return LunarUtil.POSITION_CAI[this._ganIndex + 1];
  }
  getPositionCaiDesc() {
    return LunarUtil.POSITION_DESC[this.getPositionCai()];
  }
  getNaYin() {
    return LunarUtil.NAYIN[this.getGanZhi()];
  }
  getTianShen() {
    return LunarUtil.TIAN_SHEN[(this._zhiIndex + LunarUtil.ZHI_TIAN_SHEN_OFFSET[this._lunar.getDayZhiExact()]) % 12 + 1];
  }
  getTianShenType() {
    return LunarUtil.TIAN_SHEN_TYPE[this.getTianShen()];
  }
  getTianShenLuck() {
    return LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getTianShenType()];
  }
  getChong() {
    return LunarUtil.CHONG[this._zhiIndex];
  }
  getSha() {
    return LunarUtil.SHA[this.getZhi()];
  }
  getChongShengXiao() {
    const chong = this.getChong();
    for (let i = 0, j = LunarUtil.ZHI.length; i < j; i++) {
      if (LunarUtil.ZHI[i] === chong) {
        return LunarUtil.SHENGXIAO[i];
      }
    }
    return "";
  }
  getChongDesc() {
    return "(" + this.getChongGan() + this.getChong() + ")" + this.getChongShengXiao();
  }
  getChongGan() {
    return LunarUtil.CHONG_GAN[this._ganIndex];
  }
  getChongGanTie() {
    return LunarUtil.CHONG_GAN_TIE[this._ganIndex];
  }
  getYi() {
    return LunarUtil.getTimeYi(this._lunar.getDayInGanZhiExact(), this.getGanZhi());
  }
  getJi() {
    return LunarUtil.getTimeJi(this._lunar.getDayInGanZhiExact(), this.getGanZhi());
  }
  getNineStar() {
    const solarYmd = this._lunar.getSolar().toYmd();
    const jieQi = this._lunar.getJieQiTable();
    let asc = false;
    if (solarYmd >= jieQi[I18n.getMessage("jq.dongZhi")].toYmd() && solarYmd < jieQi[I18n.getMessage("jq.xiaZhi")].toYmd()) {
      asc = true;
    }
    const offset = asc ? [0, 3, 6] : [8, 5, 2];
    const start = offset[this._lunar.getDayZhiIndex() % 3];
    const index = asc ? start + this._zhiIndex : start + 9 - this._zhiIndex;
    return NineStar.fromIndex(index % 9);
  }
  getXun() {
    return LunarUtil.getXun(this.getGanZhi());
  }
  getXunKong() {
    return LunarUtil.getXunKong(this.getGanZhi());
  }
  getMinHm() {
    let hour = this._lunar.getHour();
    if (hour < 1) {
      return "00:00";
    } else if (hour > 22) {
      return "23:00";
    }
    if (hour % 2 === 0) {
      hour -= 1;
    }
    return (hour < 10 ? "0" : "") + hour + ":00";
  }
  getMaxHm() {
    let hour = this._lunar.getHour();
    if (hour < 1) {
      return "00:59";
    } else if (hour > 22) {
      return "23:59";
    }
    if (hour % 2 !== 0) {
      hour += 1;
    }
    return (hour < 10 ? "0" : "") + hour + ":59";
  }
  toString() {
    return this.getGanZhi();
  }
};
var _Foto = class {
  constructor(lunar) {
    this._lunar = lunar;
  }
  static fromLunar(lunar) {
    return new _Foto(lunar);
  }
  static fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second) {
    return _Foto.fromLunar(Lunar.fromYmdHms(lunarYear + _Foto.DEAD_YEAR - 1, lunarMonth, lunarDay, hour, minute, second));
  }
  static fromYmd(lunarYear, lunarMonth, lunarDay) {
    return _Foto.fromYmdHms(lunarYear, lunarMonth, lunarDay, 0, 0, 0);
  }
  getLunar() {
    return this._lunar;
  }
  getYear() {
    const sy = this._lunar.getSolar().getYear();
    let y = sy - _Foto.DEAD_YEAR;
    if (sy === this._lunar.getYear()) {
      y++;
    }
    return y;
  }
  getMonth() {
    return this._lunar.getMonth();
  }
  getDay() {
    return this._lunar.getDay();
  }
  getYearInChinese() {
    const y = this.getYear() + "";
    let s = "";
    const zero = "0".charCodeAt(0);
    for (let i = 0, j = y.length; i < j; i++) {
      s += LunarUtil.NUMBER[y.charCodeAt(i) - zero];
    }
    return s;
  }
  getMonthInChinese() {
    return this._lunar.getMonthInChinese();
  }
  getDayInChinese() {
    return this._lunar.getDayInChinese();
  }
  getFestivals() {
    const l = FotoUtil.FESTIVAL[this.getMonth() + "-" + this.getDay()];
    return l ? l : [];
  }
  getOtherFestivals() {
    const l = [];
    const fs = FotoUtil.OTHER_FESTIVAL[this.getMonth() + "-" + this.getDay()];
    if (fs) {
      fs.forEach((f) => {
        l.push(f);
      });
    }
    return l;
  }
  isMonthZhai() {
    const m = this.getMonth();
    return 1 === m || 5 === m || 9 === m;
  }
  isDayYangGong() {
    const l = this.getFestivals();
    for (let i = 0, j = l.length; i < j; i++) {
      if ("\u6768\u516C\u5FCC" === l[i].getName()) {
        return true;
      }
    }
    return false;
  }
  isDayZhaiShuoWang() {
    const d = this.getDay();
    return 1 === d || 15 === d;
  }
  isDayZhaiSix() {
    const d = this.getDay();
    if (8 === d || 14 === d || 15 === d || 23 === d || 29 === d || 30 === d) {
      return true;
    } else if (28 === d) {
      const m = LunarMonth.fromYm(this._lunar.getYear(), this.getMonth());
      if (null != m && 30 !== m.getDayCount()) {
        return true;
      }
    }
    return false;
  }
  isDayZhaiTen() {
    const d = this.getDay();
    return 1 === d || 8 === d || 14 === d || 15 === d || 18 === d || 23 === d || 24 === d || 28 === d || 29 === d || 30 === d;
  }
  isDayZhaiGuanYin() {
    const k = this.getMonth() + "-" + this.getDay();
    for (let i = 0, j = FotoUtil.DAY_ZHAI_GUAN_YIN.length; i < j; i++) {
      if (k === FotoUtil.DAY_ZHAI_GUAN_YIN[i]) {
        return true;
      }
    }
    return false;
  }
  getXiu() {
    return FotoUtil.getXiu(this.getMonth(), this.getDay());
  }
  getXiuLuck() {
    return LunarUtil.XIU_LUCK[this.getXiu()];
  }
  getXiuSong() {
    return LunarUtil.XIU_SONG[this.getXiu()];
  }
  getZheng() {
    return LunarUtil.ZHENG[this.getXiu()];
  }
  getAnimal() {
    return LunarUtil.ANIMAL[this.getXiu()];
  }
  getGong() {
    return LunarUtil.GONG[this.getXiu()];
  }
  getShou() {
    return LunarUtil.SHOU[this.getGong()];
  }
  toString() {
    return this.getYearInChinese() + "\u5E74" + this.getMonthInChinese() + "\u6708" + this.getDayInChinese();
  }
  toFullString() {
    let s = this.toString();
    const festivals = this.getFestivals();
    for (let i = 0, j = festivals.length; i < j; i++) {
      s += " (" + festivals[i] + ")";
    }
    return s;
  }
};
var Foto = _Foto;
Foto.DEAD_YEAR = -543;
var _Tao = class {
  constructor(lunar) {
    this._lunar = lunar;
  }
  static fromLunar(lunar) {
    return new _Tao(lunar);
  }
  static fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second) {
    return _Tao.fromLunar(Lunar.fromYmdHms(lunarYear + _Tao.BIRTH_YEAR, lunarMonth, lunarDay, hour, minute, second));
  }
  static fromYmd(lunarYear, lunarMonth, lunarDay) {
    return _Tao.fromYmdHms(lunarYear, lunarMonth, lunarDay, 0, 0, 0);
  }
  getLunar() {
    return this._lunar;
  }
  getYear() {
    return this._lunar.getYear() - _Tao.BIRTH_YEAR;
  }
  getMonth() {
    return this._lunar.getMonth();
  }
  getDay() {
    return this._lunar.getDay();
  }
  getYearInChinese() {
    const y = this.getYear() + "";
    let s = "";
    const zero = "0".charCodeAt(0);
    for (let i = 0, j = y.length; i < j; i++) {
      s += LunarUtil.NUMBER[y.charCodeAt(i) - zero];
    }
    return s;
  }
  getMonthInChinese() {
    return this._lunar.getMonthInChinese();
  }
  getDayInChinese() {
    return this._lunar.getDayInChinese();
  }
  getFestivals() {
    const l = [];
    const fs = TaoUtil.FESTIVAL[this.getMonth() + "-" + this.getDay()];
    if (fs) {
      fs.forEach((f2) => {
        l.push(f2);
      });
    }
    const jq = this._lunar.getJieQi();
    if (I18n.getMessage("jq.dongZhi") === jq) {
      l.push(new TaoFestival("\u5143\u59CB\u5929\u5C0A\u5723\u8BDE"));
    } else if (I18n.getMessage("jq.xiaZhi") === jq) {
      l.push(new TaoFestival("\u7075\u5B9D\u5929\u5C0A\u5723\u8BDE"));
    }
    let f = TaoUtil.BA_JIE[jq];
    if (f) {
      l.push(new TaoFestival(f));
    }
    f = TaoUtil.BA_HUI[this._lunar.getDayInGanZhi()];
    if (f) {
      l.push(new TaoFestival(f));
    }
    return l;
  }
  _isDayIn(days) {
    const md = this.getMonth() + "-" + this.getDay();
    for (let i = 0, j = days.length; i < j; i++) {
      if (md === days[i]) {
        return true;
      }
    }
    return false;
  }
  isDaySanHui() {
    return this._isDayIn(TaoUtil.SAN_HUI);
  }
  isDaySanYuan() {
    return this._isDayIn(TaoUtil.SAN_YUAN);
  }
  isDayBaJie() {
    return !!TaoUtil.BA_JIE[this._lunar.getJieQi()];
  }
  isDayWuLa() {
    return this._isDayIn(TaoUtil.WU_LA);
  }
  isDayBaHui() {
    return !!TaoUtil.BA_HUI[this._lunar.getDayInGanZhi()];
  }
  isDayMingWu() {
    return I18n.getMessage("tg.wu") === this._lunar.getDayGan();
  }
  isDayAnWu() {
    return this._lunar.getDayZhi() === TaoUtil.AN_WU[Math.abs(this.getMonth()) - 1];
  }
  isDayWu() {
    return this.isDayMingWu() || this.isDayAnWu();
  }
  isDayTianShe() {
    let ret = false;
    const mz = this._lunar.getMonthZhi();
    const dgz = this._lunar.getDayInGanZhi();
    if ([I18n.getMessage("dz.yin"), I18n.getMessage("dz.mao"), I18n.getMessage("dz.chen")].join(",").indexOf(mz) > -1) {
      if (I18n.getMessage("jz.wuYin") === dgz) {
        ret = true;
      }
    } else if ([I18n.getMessage("dz.si"), I18n.getMessage("dz.wu"), I18n.getMessage("dz.wei")].join(",").indexOf(mz) > -1) {
      if (I18n.getMessage("jz.jiaWu") === dgz) {
        ret = true;
      }
    } else if ([I18n.getMessage("dz.shen"), I18n.getMessage("dz.you"), I18n.getMessage("dz.xu")].join(",").indexOf(mz) > -1) {
      if (I18n.getMessage("jz.wuShen") === dgz) {
        ret = true;
      }
    } else if ([I18n.getMessage("dz.hai"), I18n.getMessage("dz.zi"), I18n.getMessage("dz.chou")].join(",").indexOf(mz) > -1) {
      if (I18n.getMessage("jz.jiaZi") === dgz) {
        ret = true;
      }
    }
    return ret;
  }
  toString() {
    return this.getYearInChinese() + "\u5E74" + this.getMonthInChinese() + "\u6708" + this.getDayInChinese();
  }
  toFullString() {
    return "\u9053\u6B77" + this.getYearInChinese() + "\u5E74\uFF0C\u5929\u904B" + this._lunar.getYearInGanZhi() + "\u5E74\uFF0C" + this._lunar.getMonthInGanZhi() + "\u6708\uFF0C" + this._lunar.getDayInGanZhi() + "\u65E5\u3002" + this.getMonthInChinese() + "\u6708" + this.getDayInChinese() + "\u65E5\uFF0C" + this._lunar.getTimeZhi() + "\u6642\u3002";
  }
};
var Tao = _Tao;
Tao.BIRTH_YEAR = -2697;
var Lunar = class _Lunar {
  static fromYmd(lunarYear, lunarMonth, lunarDay) {
    return _Lunar.fromYmdHms(lunarYear, lunarMonth, lunarDay, 0, 0, 0);
  }
  static fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second) {
    let y = LunarYear.fromYear(lunarYear);
    const m = y.getMonth(lunarMonth);
    if (null == m) {
      throw new Error(`wrong lunar year ${lunarYear} month ${lunarMonth}`);
    }
    if (lunarDay < 1) {
      throw new Error("lunar day must bigger than 0");
    }
    const days = m.getDayCount();
    if (lunarDay > days) {
      throw new Error(`only ${days} days in lunar year ${lunarYear} month ${lunarMonth}`);
    }
    const noon = Solar.fromJulianDay(m.getFirstJulianDay() + lunarDay - 1);
    const solar = Solar.fromYmdHms(noon.getYear(), noon.getMonth(), noon.getDay(), hour, minute, second);
    if (noon.getYear() !== lunarYear) {
      y = LunarYear.fromYear(noon.getYear());
    }
    return new _Lunar(lunarYear, lunarMonth, lunarDay, hour, minute, second, solar, y);
  }
  static fromSolar(solar) {
    let lunarYear = 0;
    let lunarMonth = 0;
    let lunarDay = 0;
    const ly = LunarYear.fromYear(solar.getYear());
    const lms = ly.getMonths();
    for (let i = 0, j = lms.length; i < j; i++) {
      const m = lms[i];
      const days = solar.subtract(Solar.fromJulianDay(m.getFirstJulianDay()));
      if (days < m.getDayCount()) {
        lunarYear = m.getYear();
        lunarMonth = m.getMonth();
        lunarDay = days + 1;
        break;
      }
    }
    return new _Lunar(lunarYear, lunarMonth, lunarDay, solar.getHour(), solar.getMinute(), solar.getSecond(), solar, ly);
  }
  static fromDate(date) {
    return _Lunar.fromSolar(Solar.fromDate(date));
  }
  static _computeJieQi(o, ly) {
    const julianDays = ly.getJieQiJulianDays();
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
      const key = LunarUtil.JIE_QI_IN_USE[i];
      o.jieQiList.push(key);
      o.jieQi[key] = Solar.fromJulianDay(julianDays[i]);
    }
  }
  static _computeYear(o, solar, year) {
    const offset = year - 4;
    let yearGanIndex = offset % 10;
    let yearZhiIndex = offset % 12;
    if (yearGanIndex < 0) {
      yearGanIndex += 10;
    }
    if (yearZhiIndex < 0) {
      yearZhiIndex += 12;
    }
    let g = yearGanIndex;
    let z = yearZhiIndex;
    let gExact = yearGanIndex;
    let zExact = yearZhiIndex;
    const solarYear = solar.getYear();
    const solarYmd = solar.toYmd();
    const solarYmdHms = solar.toYmdHms();
    let liChun = o.jieQi[I18n.getMessage("jq.liChun")];
    if (liChun.getYear() != solarYear) {
      liChun = o.jieQi["LI_CHUN"];
    }
    const liChunYmd = liChun.toYmd();
    const liChunYmdHms = liChun.toYmdHms();
    if (year === solarYear) {
      if (solarYmd < liChunYmd) {
        g--;
        z--;
      }
      if (solarYmdHms < liChunYmdHms) {
        gExact--;
        zExact--;
      }
    } else if (year < solarYear) {
      if (solarYmd >= liChunYmd) {
        g++;
        z++;
      }
      if (solarYmdHms >= liChunYmdHms) {
        gExact++;
        zExact++;
      }
    }
    o.yearGanIndex = yearGanIndex;
    o.yearZhiIndex = yearZhiIndex;
    o.yearGanIndexByLiChun = (g < 0 ? g + 10 : g) % 10;
    o.yearZhiIndexByLiChun = (z < 0 ? z + 12 : z) % 12;
    o.yearGanIndexExact = (gExact < 0 ? gExact + 10 : gExact) % 10;
    o.yearZhiIndexExact = (zExact < 0 ? zExact + 12 : zExact) % 12;
  }
  static _computeMonth(o, solar) {
    let start = null;
    let end = null;
    const ymd = solar.toYmd();
    const time = solar.toYmdHms();
    const size = LunarUtil.JIE_QI_IN_USE.length;
    let index = -3;
    for (let i = 0; i < size; i += 2) {
      end = o.jieQi[LunarUtil.JIE_QI_IN_USE[i]];
      const symd = null == start ? ymd : start.toYmd();
      if (ymd >= symd && ymd < end.toYmd()) {
        break;
      }
      start = end;
      index++;
    }
    let offset = ((o.yearGanIndexByLiChun + (index < 0 ? 1 : 0)) % 5 + 1) * 2 % 10;
    o.monthGanIndex = ((index < 0 ? index + 10 : index) + offset) % 10;
    o.monthZhiIndex = ((index < 0 ? index + 12 : index) + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12;
    start = null;
    index = -3;
    for (let i = 0; i < size; i += 2) {
      end = o.jieQi[LunarUtil.JIE_QI_IN_USE[i]];
      const stime = null == start ? time : start.toYmdHms();
      if (time >= stime && time < end.toYmdHms()) {
        break;
      }
      start = end;
      index++;
    }
    offset = ((o.yearGanIndexExact + (index < 0 ? 1 : 0)) % 5 + 1) * 2 % 10;
    o.monthGanIndexExact = ((index < 0 ? index + 10 : index) + offset) % 10;
    o.monthZhiIndexExact = ((index < 0 ? index + 12 : index) + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12;
  }
  static _computeDay(o, solar, hour, minute) {
    const noon = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 12, 0, 0);
    const offset = Math.floor(noon.getJulianDay()) - 11;
    const dayGanIndex = offset % 10;
    const dayZhiIndex = offset % 12;
    o.dayGanIndex = dayGanIndex;
    o.dayZhiIndex = dayZhiIndex;
    let dayGanExact = dayGanIndex;
    let dayZhiExact = dayZhiIndex;
    o.dayGanIndexExact2 = dayGanExact;
    o.dayZhiIndexExact2 = dayZhiExact;
    const hm = (hour < 10 ? "0" : "") + hour + ":" + (minute < 10 ? "0" : "") + minute;
    if (hm >= "23:00" && hm <= "23:59") {
      dayGanExact++;
      if (dayGanExact >= 10) {
        dayGanExact -= 10;
      }
      dayZhiExact++;
      if (dayZhiExact >= 12) {
        dayZhiExact -= 12;
      }
    }
    o.dayGanIndexExact = dayGanExact;
    o.dayZhiIndexExact = dayZhiExact;
  }
  static _computeTime(o, hour, minute) {
    const timeZhiIndex = LunarUtil.getTimeZhiIndex((hour < 10 ? "0" : "") + hour + ":" + (minute < 10 ? "0" : "") + minute);
    o.timeZhiIndex = timeZhiIndex;
    o.timeGanIndex = (o.dayGanIndexExact % 5 * 2 + timeZhiIndex) % 10;
  }
  static _computeWeek(o, solar) {
    o.weekIndex = solar.getWeek();
  }
  static _compute(year, hour, minute, solar, ly) {
    const o = {
      timeGanIndex: 0,
      timeZhiIndex: 0,
      dayGanIndex: 0,
      dayZhiIndex: 0,
      dayGanIndexExact: 0,
      dayZhiIndexExact: 0,
      dayGanIndexExact2: 0,
      dayZhiIndexExact2: 0,
      monthGanIndex: 0,
      monthZhiIndex: 0,
      monthGanIndexExact: 0,
      monthZhiIndexExact: 0,
      yearGanIndex: 0,
      yearZhiIndex: 0,
      yearGanIndexByLiChun: 0,
      yearZhiIndexByLiChun: 0,
      yearGanIndexExact: 0,
      yearZhiIndexExact: 0,
      weekIndex: 0,
      jieQi: {},
      jieQiList: []
    };
    _Lunar._computeJieQi(o, ly);
    _Lunar._computeYear(o, solar, year);
    _Lunar._computeMonth(o, solar);
    _Lunar._computeDay(o, solar, hour, minute);
    _Lunar._computeTime(o, hour, minute);
    _Lunar._computeWeek(o, solar);
    return o;
  }
  constructor(year, month, day, hour, minute, second, solar, ly) {
    const info = _Lunar._compute(year, hour, minute, solar, ly);
    this._year = year;
    this._month = month;
    this._day = day;
    this._hour = hour;
    this._minute = minute;
    this._second = second;
    this._timeGanIndex = info.timeGanIndex;
    this._timeZhiIndex = info.timeZhiIndex;
    this._dayGanIndex = info.dayGanIndex;
    this._dayZhiIndex = info.dayZhiIndex;
    this._dayGanIndexExact = info.dayGanIndexExact;
    this._dayZhiIndexExact = info.dayZhiIndexExact;
    this._dayGanIndexExact2 = info.dayGanIndexExact2;
    this._dayZhiIndexExact2 = info.dayZhiIndexExact2;
    this._monthGanIndex = info.monthGanIndex;
    this._monthZhiIndex = info.monthZhiIndex;
    this._monthGanIndexExact = info.monthGanIndexExact;
    this._monthZhiIndexExact = info.monthZhiIndexExact;
    this._yearGanIndex = info.yearGanIndex;
    this._yearZhiIndex = info.yearZhiIndex;
    this._yearGanIndexByLiChun = info.yearGanIndexByLiChun;
    this._yearZhiIndexByLiChun = info.yearZhiIndexByLiChun;
    this._yearGanIndexExact = info.yearGanIndexExact;
    this._yearZhiIndexExact = info.yearZhiIndexExact;
    this._weekIndex = info.weekIndex;
    this._jieQi = info.jieQi;
    this._jieQiList = info.jieQiList;
    this._solar = solar;
    this._eightChar = new EightChar(this);
    this._lang = I18n.getLanguage();
  }
  getYear() {
    return this._year;
  }
  getMonth() {
    return this._month;
  }
  getDay() {
    return this._day;
  }
  getHour() {
    return this._hour;
  }
  getMinute() {
    return this._minute;
  }
  getSecond() {
    return this._second;
  }
  getTimeGanIndex() {
    return this._timeGanIndex;
  }
  getTimeZhiIndex() {
    return this._timeZhiIndex;
  }
  getDayGanIndex() {
    return this._dayGanIndex;
  }
  getDayZhiIndex() {
    return this._dayZhiIndex;
  }
  getMonthGanIndex() {
    return this._monthGanIndex;
  }
  getMonthZhiIndex() {
    return this._monthZhiIndex;
  }
  getYearGanIndex() {
    return this._yearGanIndex;
  }
  getYearZhiIndex() {
    return this._yearZhiIndex;
  }
  getYearGanIndexByLiChun() {
    return this._yearGanIndexByLiChun;
  }
  getYearZhiIndexByLiChun() {
    return this._yearZhiIndexByLiChun;
  }
  getDayGanIndexExact() {
    return this._dayGanIndexExact;
  }
  getDayZhiIndexExact() {
    return this._dayZhiIndexExact;
  }
  getDayGanIndexExact2() {
    return this._dayGanIndexExact2;
  }
  getDayZhiIndexExact2() {
    return this._dayZhiIndexExact2;
  }
  getMonthGanIndexExact() {
    return this._monthGanIndexExact;
  }
  getMonthZhiIndexExact() {
    return this._monthZhiIndexExact;
  }
  getYearGanIndexExact() {
    return this._yearGanIndexExact;
  }
  getYearZhiIndexExact() {
    return this._yearZhiIndexExact;
  }
  getGan() {
    return this.getYearGan();
  }
  getZhi() {
    return this.getYearZhi();
  }
  getYearGan() {
    return LunarUtil.GAN[this._yearGanIndex + 1];
  }
  getYearGanByLiChun() {
    return LunarUtil.GAN[this._yearGanIndexByLiChun + 1];
  }
  getYearGanExact() {
    return LunarUtil.GAN[this._yearGanIndexExact + 1];
  }
  getYearZhi() {
    return LunarUtil.ZHI[this._yearZhiIndex + 1];
  }
  getYearZhiByLiChun() {
    return LunarUtil.ZHI[this._yearZhiIndexByLiChun + 1];
  }
  getYearZhiExact() {
    return LunarUtil.ZHI[this._yearZhiIndexExact + 1];
  }
  getYearInGanZhi() {
    return this.getYearGan() + this.getYearZhi();
  }
  getYearInGanZhiByLiChun() {
    return this.getYearGanByLiChun() + this.getYearZhiByLiChun();
  }
  getYearInGanZhiExact() {
    return this.getYearGanExact() + this.getYearZhiExact();
  }
  getMonthGan() {
    return LunarUtil.GAN[this._monthGanIndex + 1];
  }
  getMonthGanExact() {
    return LunarUtil.GAN[this._monthGanIndexExact + 1];
  }
  getMonthZhi() {
    return LunarUtil.ZHI[this._monthZhiIndex + 1];
  }
  getMonthZhiExact() {
    return LunarUtil.ZHI[this._monthZhiIndexExact + 1];
  }
  getMonthInGanZhi() {
    return this.getMonthGan() + this.getMonthZhi();
  }
  getMonthInGanZhiExact() {
    return this.getMonthGanExact() + this.getMonthZhiExact();
  }
  getDayGan() {
    return LunarUtil.GAN[this._dayGanIndex + 1];
  }
  getDayGanExact() {
    return LunarUtil.GAN[this._dayGanIndexExact + 1];
  }
  getDayGanExact2() {
    return LunarUtil.GAN[this._dayGanIndexExact2 + 1];
  }
  getDayZhi() {
    return LunarUtil.ZHI[this._dayZhiIndex + 1];
  }
  getDayZhiExact() {
    return LunarUtil.ZHI[this._dayZhiIndexExact + 1];
  }
  getDayZhiExact2() {
    return LunarUtil.ZHI[this._dayZhiIndexExact2 + 1];
  }
  getDayInGanZhi() {
    return this.getDayGan() + this.getDayZhi();
  }
  getDayInGanZhiExact() {
    return this.getDayGanExact() + this.getDayZhiExact();
  }
  getDayInGanZhiExact2() {
    return this.getDayGanExact2() + this.getDayZhiExact2();
  }
  getTimeGan() {
    return LunarUtil.GAN[this._timeGanIndex + 1];
  }
  getTimeZhi() {
    return LunarUtil.ZHI[this._timeZhiIndex + 1];
  }
  getTimeInGanZhi() {
    return this.getTimeGan() + this.getTimeZhi();
  }
  getShengxiao() {
    return this.getYearShengXiao();
  }
  getYearShengXiao() {
    return LunarUtil.SHENGXIAO[this._yearZhiIndex + 1];
  }
  getYearShengXiaoByLiChun() {
    return LunarUtil.SHENGXIAO[this._yearZhiIndexByLiChun + 1];
  }
  getYearShengXiaoExact() {
    return LunarUtil.SHENGXIAO[this._yearZhiIndexExact + 1];
  }
  getMonthShengXiao() {
    return LunarUtil.SHENGXIAO[this._monthZhiIndex + 1];
  }
  getMonthShengXiaoExact() {
    return LunarUtil.SHENGXIAO[this._monthZhiIndexExact + 1];
  }
  getDayShengXiao() {
    return LunarUtil.SHENGXIAO[this._dayZhiIndex + 1];
  }
  getTimeShengXiao() {
    return LunarUtil.SHENGXIAO[this._timeZhiIndex + 1];
  }
  getYearInChinese() {
    const y = this._year + "";
    let s = "";
    const zero = "0".charCodeAt(0);
    for (let i = 0, j = y.length; i < j; i++) {
      const n = y.charCodeAt(i);
      s += LunarUtil.NUMBER[n - zero];
    }
    return s;
  }
  getMonthInChinese() {
    return (this._month < 0 ? "\u95F0" : "") + LunarUtil.MONTH[Math.abs(this._month)];
  }
  getDayInChinese() {
    return LunarUtil.DAY[this._day];
  }
  getPengZuGan() {
    return LunarUtil.PENGZU_GAN[this._dayGanIndex + 1];
  }
  getPengZuZhi() {
    return LunarUtil.PENGZU_ZHI[this._dayZhiIndex + 1];
  }
  getPositionXi() {
    return this.getDayPositionXi();
  }
  getPositionXiDesc() {
    return this.getDayPositionXiDesc();
  }
  getPositionYangGui() {
    return this.getDayPositionYangGui();
  }
  getPositionYangGuiDesc() {
    return this.getDayPositionYangGuiDesc();
  }
  getPositionYinGui() {
    return this.getDayPositionYinGui();
  }
  getPositionYinGuiDesc() {
    return this.getDayPositionYinGuiDesc();
  }
  getPositionFu() {
    return this.getDayPositionFu();
  }
  getPositionFuDesc() {
    return this.getDayPositionFuDesc();
  }
  getPositionCai() {
    return this.getDayPositionCai();
  }
  getPositionCaiDesc() {
    return this.getDayPositionCaiDesc();
  }
  getDayPositionXi() {
    return LunarUtil.POSITION_XI[this._dayGanIndex + 1];
  }
  getDayPositionXiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getDayPositionXi()];
    return v ? v : "";
  }
  getDayPositionYangGui() {
    return LunarUtil.POSITION_YANG_GUI[this._dayGanIndex + 1];
  }
  getDayPositionYangGuiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getDayPositionYangGui()];
    return v ? v : "";
  }
  getDayPositionYinGui() {
    return LunarUtil.POSITION_YIN_GUI[this._dayGanIndex + 1];
  }
  getDayPositionYinGuiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getDayPositionYinGui()];
    return v ? v : "";
  }
  getDayPositionFu(sect = 2) {
    return (1 === sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this._dayGanIndex + 1];
  }
  getDayPositionFuDesc(sect = 2) {
    const v = LunarUtil.POSITION_DESC[this.getDayPositionFu(sect)];
    return v ? v : "";
  }
  getDayPositionCai() {
    return LunarUtil.POSITION_CAI[this._dayGanIndex + 1];
  }
  getDayPositionCaiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getDayPositionCai()];
    return v ? v : "";
  }
  getTimePositionXi() {
    return LunarUtil.POSITION_XI[this._timeGanIndex + 1];
  }
  getTimePositionXiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getTimePositionXi()];
    return v ? v : "";
  }
  getTimePositionYangGui() {
    return LunarUtil.POSITION_YANG_GUI[this._timeGanIndex + 1];
  }
  getTimePositionYangGuiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getTimePositionYangGui()];
    return v ? v : "";
  }
  getTimePositionYinGui() {
    return LunarUtil.POSITION_YIN_GUI[this._timeGanIndex + 1];
  }
  getTimePositionYinGuiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getTimePositionYinGui()];
    return v ? v : "";
  }
  getTimePositionFu(sect = 2) {
    return (1 === sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this._timeGanIndex + 1];
  }
  getTimePositionFuDesc(sect = 2) {
    const v = LunarUtil.POSITION_DESC[this.getTimePositionFu(sect)];
    return v ? v : "";
  }
  getTimePositionCai() {
    return LunarUtil.POSITION_CAI[this._timeGanIndex + 1];
  }
  getTimePositionCaiDesc() {
    const v = LunarUtil.POSITION_DESC[this.getTimePositionCai()];
    return v ? v : "";
  }
  getYearPositionTaiSui(sect = 2) {
    let yearZhiIndex = this._yearZhiIndexByLiChun;
    switch (sect) {
      case 1:
        yearZhiIndex = this._yearZhiIndex;
        break;
      case 3:
        yearZhiIndex = this._yearZhiIndexExact;
        break;
    }
    return LunarUtil.POSITION_TAI_SUI_YEAR[yearZhiIndex];
  }
  getYearPositionTaiSuiDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getYearPositionTaiSui(sect)];
  }
  getMonthPositionTaiSui(sect = 2) {
    let monthZhiIndex = this._monthZhiIndex;
    let monthGanIndex = this._monthGanIndex;
    if (3 === sect) {
      monthZhiIndex = this._monthZhiIndexExact;
      monthGanIndex = this._monthGanIndexExact;
    }
    let m = monthZhiIndex - LunarUtil.BASE_MONTH_ZHI_INDEX;
    if (m < 0) {
      m += 12;
    }
    return [I18n.getMessage("bg.gen"), LunarUtil.POSITION_GAN[monthGanIndex], I18n.getMessage("bg.kun"), I18n.getMessage("bg.xun")][m % 4];
  }
  getMonthPositionTaiSuiDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getMonthPositionTaiSui(sect)];
  }
  getDayPositionTaiSui(sect = 2) {
    let dayInGanZhi = this.getDayInGanZhiExact2();
    let yearZhiIndex = this._yearZhiIndexByLiChun;
    switch (sect) {
      case 1:
        dayInGanZhi = this.getDayInGanZhi();
        yearZhiIndex = this._yearZhiIndex;
        break;
      case 3:
        dayInGanZhi = this.getDayInGanZhi();
        yearZhiIndex = this._yearZhiIndexExact;
        break;
    }
    if ([I18n.getMessage("jz.jiaZi"), I18n.getMessage("jz.yiChou"), I18n.getMessage("jz.bingYin"), I18n.getMessage("jz.dingMao"), I18n.getMessage("jz.wuChen"), I18n.getMessage("jz.jiSi")].join(",").indexOf(dayInGanZhi) > -1) {
      return I18n.getMessage("bg.zhen");
    } else if ([I18n.getMessage("jz.bingZi"), I18n.getMessage("jz.dingChou"), I18n.getMessage("jz.wuYin"), I18n.getMessage("jz.jiMao"), I18n.getMessage("jz.gengChen"), I18n.getMessage("jz.xinSi")].join(",").indexOf(dayInGanZhi) > -1) {
      return I18n.getMessage("bg.li");
    } else if ([I18n.getMessage("jz.wuZi"), I18n.getMessage("jz.jiChou"), I18n.getMessage("jz.gengYin"), I18n.getMessage("jz.xinMao"), I18n.getMessage("jz.renChen"), I18n.getMessage("jz.guiSi")].join(",").indexOf(dayInGanZhi) > -1) {
      return I18n.getMessage("ps.center");
    } else if ([I18n.getMessage("jz.gengZi"), I18n.getMessage("jz.xinChou"), I18n.getMessage("jz.renYin"), I18n.getMessage("jz.guiMao"), I18n.getMessage("jz.jiaChen"), I18n.getMessage("jz.yiSi")].join(",").indexOf(dayInGanZhi) > -1) {
      return I18n.getMessage("bg.dui");
    } else if ([I18n.getMessage("jz.renZi"), I18n.getMessage("jz.guiChou"), I18n.getMessage("jz.jiaYin"), I18n.getMessage("jz.yiMao"), I18n.getMessage("jz.bingChen"), I18n.getMessage("jz.dingSi")].join(",").indexOf(dayInGanZhi) > -1) {
      return I18n.getMessage("bg.kan");
    }
    return LunarUtil.POSITION_TAI_SUI_YEAR[yearZhiIndex];
  }
  getDayPositionTaiSuiDesc(sect = 2) {
    return LunarUtil.POSITION_DESC[this.getDayPositionTaiSui(sect)];
  }
  getChong() {
    return this.getDayChong();
  }
  getChongGan() {
    return this.getDayChongGan();
  }
  getChongGanTie() {
    return this.getDayChongGanTie();
  }
  getChongShengXiao() {
    return this.getDayChongShengXiao();
  }
  getChongDesc() {
    return this.getDayChongDesc();
  }
  getSha() {
    return this.getDaySha();
  }
  getDayChong() {
    return LunarUtil.CHONG[this._dayZhiIndex];
  }
  getDayChongGan() {
    return LunarUtil.CHONG_GAN[this._dayGanIndex];
  }
  getDayChongGanTie() {
    return LunarUtil.CHONG_GAN_TIE[this._dayGanIndex];
  }
  getDayChongShengXiao() {
    const chong = this.getChong();
    for (let i = 0, j = LunarUtil.ZHI.length; i < j; i++) {
      if (LunarUtil.ZHI[i] === chong) {
        return LunarUtil.SHENGXIAO[i];
      }
    }
    return "";
  }
  getDayChongDesc() {
    return "(" + this.getDayChongGan() + this.getDayChong() + ")" + this.getDayChongShengXiao();
  }
  getDaySha() {
    const v = LunarUtil.SHA[this.getDayZhi()];
    return v ? v : "";
  }
  getTimeChong() {
    return LunarUtil.CHONG[this._timeZhiIndex];
  }
  getTimeChongGan() {
    return LunarUtil.CHONG_GAN[this._timeGanIndex];
  }
  getTimeChongGanTie() {
    return LunarUtil.CHONG_GAN_TIE[this._timeGanIndex];
  }
  getTimeChongShengXiao() {
    const chong = this.getTimeChong();
    for (let i = 0, j = LunarUtil.ZHI.length; i < j; i++) {
      if (LunarUtil.ZHI[i] === chong) {
        return LunarUtil.SHENGXIAO[i];
      }
    }
    return "";
  }
  getTimeChongDesc() {
    return "(" + this.getTimeChongGan() + this.getTimeChong() + ")" + this.getTimeChongShengXiao();
  }
  getTimeSha() {
    const v = LunarUtil.SHA[this.getTimeZhi()];
    return v ? v : "";
  }
  getYearNaYin() {
    const v = LunarUtil.NAYIN[this.getYearInGanZhi()];
    return v ? v : "";
  }
  getMonthNaYin() {
    const v = LunarUtil.NAYIN[this.getMonthInGanZhi()];
    return v ? v : "";
  }
  getDayNaYin() {
    const v = LunarUtil.NAYIN[this.getDayInGanZhi()];
    return v ? v : "";
  }
  getTimeNaYin() {
    const v = LunarUtil.NAYIN[this.getTimeInGanZhi()];
    return v ? v : "";
  }
  getSeason() {
    return LunarUtil.SEASON[Math.abs(this._month)];
  }
  static _convertJieQi(name) {
    let jq = name;
    if ("DONG_ZHI" === jq) {
      jq = I18n.getMessage("jq.dongZhi");
    } else if ("DA_HAN" === jq) {
      jq = I18n.getMessage("jq.daHan");
    } else if ("XIAO_HAN" === jq) {
      jq = I18n.getMessage("jq.xiaoHan");
    } else if ("LI_CHUN" === jq) {
      jq = I18n.getMessage("jq.liChun");
    } else if ("DA_XUE" === jq) {
      jq = I18n.getMessage("jq.daXue");
    } else if ("YU_SHUI" === jq) {
      jq = I18n.getMessage("jq.yuShui");
    } else if ("JING_ZHE" === jq) {
      jq = I18n.getMessage("jq.jingZhe");
    }
    return jq;
  }
  checkLang() {
    const lang = I18n.getLanguage();
    if (this._lang != lang) {
      for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
        const newKey = LunarUtil.JIE_QI_IN_USE[i];
        const oldKey = this._jieQiList[i];
        const value = this._jieQi[oldKey];
        this._jieQiList[i] = newKey;
        this._jieQi[newKey] = value;
      }
      this._lang = lang;
    }
  }
  getJie() {
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i += 2) {
      const key = LunarUtil.JIE_QI_IN_USE[i];
      const d = this.getJieQiSolar(key);
      if (d && d.getYear() === this._solar.getYear() && d.getMonth() === this._solar.getMonth() && d.getDay() === this._solar.getDay()) {
        return _Lunar._convertJieQi(key);
      }
    }
    return "";
  }
  getQi() {
    for (let i = 1, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i += 2) {
      const key = LunarUtil.JIE_QI_IN_USE[i];
      const d = this.getJieQiSolar(key);
      if (d && d.getYear() === this._solar.getYear() && d.getMonth() === this._solar.getMonth() && d.getDay() === this._solar.getDay()) {
        return _Lunar._convertJieQi(key);
      }
    }
    return "";
  }
  getJieQi() {
    let name = "";
    const keys = Object.keys(this._jieQi);
    for (let i = 0, j = keys.length; i < j; i++) {
      const k = keys[i];
      const d = this._jieQi[k];
      if (d.getYear() == this._solar.getYear() && d.getMonth() == this._solar.getMonth() && d.getDay() == this._solar.getDay()) {
        name = k;
        break;
      }
    }
    return _Lunar._convertJieQi(name);
  }
  getWeek() {
    return this._weekIndex;
  }
  getWeekInChinese() {
    return SolarUtil.WEEK[this.getWeek()];
  }
  getXiu() {
    const v = LunarUtil.XIU[this.getDayZhi() + this.getWeek()];
    return v ? v : "";
  }
  getXiuLuck() {
    const v = LunarUtil.XIU_LUCK[this.getXiu()];
    return v ? v : "";
  }
  getXiuSong() {
    const v = LunarUtil.XIU_SONG[this.getXiu()];
    return v ? v : "";
  }
  getZheng() {
    const v = LunarUtil.ZHENG[this.getXiu()];
    return v ? v : "";
  }
  getAnimal() {
    const v = LunarUtil.ANIMAL[this.getXiu()];
    return v ? v : "";
  }
  getGong() {
    const v = LunarUtil.GONG[this.getXiu()];
    return v ? v : "";
  }
  getShou() {
    const v = LunarUtil.SHOU[this.getGong()];
    return v ? v : "";
  }
  getFestivals() {
    const l = [];
    const f = LunarUtil.FESTIVAL[this._month + "-" + this._day];
    if (f) {
      l.push(f);
    }
    if (Math.abs(this._month) == 12 && this._day >= 29 && this._year != this.next(1).getYear()) {
      l.push(I18n.getMessage("jr.chuXi"));
    }
    return l;
  }
  getOtherFestivals() {
    const l = [];
    const fs = LunarUtil.OTHER_FESTIVAL[this._month + "-" + this._day];
    if (fs) {
      fs.forEach((f) => {
        l.push(f);
      });
    }
    let jq = this.getJieQiSolar(I18n.getMessage("jq.qingMing"));
    const solarYmd = this._solar.toYmd();
    if (solarYmd === jq.next(-1).toYmd()) {
      l.push("\u5BD2\u98DF\u8282");
    }
    jq = this.getJieQiSolar(I18n.getMessage("jq.liChun"));
    let offset = 4 - jq.getLunar().getDayGanIndex();
    if (offset < 0) {
      offset += 10;
    }
    if (solarYmd === jq.next(offset + 40).toYmd()) {
      l.push("\u6625\u793E");
    }
    jq = this.getJieQiSolar(I18n.getMessage("jq.liQiu"));
    offset = 4 - jq.getLunar().getDayGanIndex();
    if (offset < 0) {
      offset += 10;
    }
    if (solarYmd === jq.next(offset + 40).toYmd()) {
      l.push("\u79CB\u793E");
    }
    return l;
  }
  getBaZi() {
    const bz = this.getEightChar();
    const l = [];
    l.push(bz.getYear());
    l.push(bz.getMonth());
    l.push(bz.getDay());
    l.push(bz.getTime());
    return l;
  }
  getBaZiWuXing() {
    const bz = this.getEightChar();
    const l = [];
    l.push(bz.getYearWuXing());
    l.push(bz.getMonthWuXing());
    l.push(bz.getDayWuXing());
    l.push(bz.getTimeWuXing());
    return l;
  }
  getBaZiNaYin() {
    const bz = this.getEightChar();
    const l = [];
    l.push(bz.getYearNaYin());
    l.push(bz.getMonthNaYin());
    l.push(bz.getDayNaYin());
    l.push(bz.getTimeNaYin());
    return l;
  }
  getBaZiShiShenGan() {
    const bz = this.getEightChar();
    const l = [];
    l.push(bz.getYearShiShenGan());
    l.push(bz.getMonthShiShenGan());
    l.push(bz.getDayShiShenGan());
    l.push(bz.getTimeShiShenGan());
    return l;
  }
  getBaZiShiShenZhi() {
    const bz = this.getEightChar();
    const l = [];
    l.push(bz.getYearShiShenZhi()[0]);
    l.push(bz.getMonthShiShenZhi()[0]);
    l.push(bz.getDayShiShenZhi()[0]);
    l.push(bz.getTimeShiShenZhi()[0]);
    return l;
  }
  getBaZiShiShenYearZhi() {
    return this.getEightChar().getYearShiShenZhi();
  }
  getBaZiShiShenMonthZhi() {
    return this.getEightChar().getMonthShiShenZhi();
  }
  getBaZiShiShenDayZhi() {
    return this.getEightChar().getDayShiShenZhi();
  }
  getBaZiShiShenTimeZhi() {
    return this.getEightChar().getTimeShiShenZhi();
  }
  getZhiXing() {
    let offset = this._dayZhiIndex - this._monthZhiIndex;
    if (offset < 0) {
      offset += 12;
    }
    return LunarUtil.ZHI_XING[offset + 1];
  }
  getDayTianShen() {
    const monthZhi = this.getMonthZhi();
    const offset = LunarUtil.ZHI_TIAN_SHEN_OFFSET[monthZhi];
    if (offset == void 0) {
      return "";
    }
    return LunarUtil.TIAN_SHEN[(this._dayZhiIndex + offset) % 12 + 1];
  }
  getTimeTianShen() {
    const dayZhi = this.getDayZhiExact();
    const offset = LunarUtil.ZHI_TIAN_SHEN_OFFSET[dayZhi];
    if (offset == void 0) {
      return "";
    }
    return LunarUtil.TIAN_SHEN[(this._timeZhiIndex + offset) % 12 + 1];
  }
  getDayTianShenType() {
    const v = LunarUtil.TIAN_SHEN_TYPE[this.getDayTianShen()];
    return v ? v : "";
  }
  getTimeTianShenType() {
    const v = LunarUtil.TIAN_SHEN_TYPE[this.getTimeTianShen()];
    return v ? v : "";
  }
  getDayTianShenLuck() {
    const v = LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getDayTianShenType()];
    return v ? v : "";
  }
  getTimeTianShenLuck() {
    const v = LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getTimeTianShenType()];
    return v ? v : "";
  }
  getDayPositionTai() {
    return LunarUtil.POSITION_TAI_DAY[LunarUtil.getJiaZiIndex(this.getDayInGanZhi())];
  }
  getMonthPositionTai() {
    const m = this._month;
    if (m < 0) {
      return "";
    }
    return LunarUtil.POSITION_TAI_MONTH[m - 1];
  }
  getDayYi(sect = 1) {
    return LunarUtil.getDayYi(2 == sect ? this.getMonthInGanZhiExact() : this.getMonthInGanZhi(), this.getDayInGanZhi());
  }
  getDayJi(sect = 1) {
    return LunarUtil.getDayJi(2 == sect ? this.getMonthInGanZhiExact() : this.getMonthInGanZhi(), this.getDayInGanZhi());
  }
  getDayJiShen() {
    return LunarUtil.getDayJiShen(this.getMonthZhiIndex(), this.getDayInGanZhi());
  }
  getDayXiongSha() {
    return LunarUtil.getDayXiongSha(this.getMonthZhiIndex(), this.getDayInGanZhi());
  }
  getTimeYi() {
    return LunarUtil.getTimeYi(this.getDayInGanZhiExact(), this.getTimeInGanZhi());
  }
  getTimeJi() {
    return LunarUtil.getTimeJi(this.getDayInGanZhiExact(), this.getTimeInGanZhi());
  }
  getYueXiang() {
    return LunarUtil.YUE_XIANG[this._day];
  }
  _getYearNineStar(yearInGanZhi) {
    const indexExact = LunarUtil.getJiaZiIndex(yearInGanZhi) + 1;
    const index = LunarUtil.getJiaZiIndex(this.getYearInGanZhi()) + 1;
    let yearOffset = indexExact - index;
    if (yearOffset > 1) {
      yearOffset -= 60;
    } else if (yearOffset < -1) {
      yearOffset += 60;
    }
    const yuan = Math.floor((this._year + yearOffset + 2696) / 60) % 3;
    let offset = (62 + yuan * 3 - indexExact) % 9;
    if (0 === offset) {
      offset = 9;
    }
    return NineStar.fromIndex(offset - 1);
  }
  getYearNineStar(sect = 2) {
    switch (sect) {
      case 1:
        return this._getYearNineStar(this.getYearInGanZhi());
      case 3:
        return this._getYearNineStar(this.getYearInGanZhiExact());
    }
    return this._getYearNineStar(this.getYearInGanZhiByLiChun());
  }
  getMonthNineStar(sect = 2) {
    let yearZhiIndex = this._yearZhiIndexByLiChun;
    let monthZhiIndex = this._monthZhiIndex;
    switch (sect) {
      case 1:
        yearZhiIndex = this._yearZhiIndex;
        monthZhiIndex = this._monthZhiIndex;
        break;
      case 3:
        yearZhiIndex = this._yearZhiIndexExact;
        monthZhiIndex = this._monthZhiIndexExact;
        break;
    }
    let n = 27 - yearZhiIndex % 3 * 3;
    if (monthZhiIndex < LunarUtil.BASE_MONTH_ZHI_INDEX) {
      n -= 3;
    }
    return NineStar.fromIndex((n - monthZhiIndex) % 9);
  }
  getJieQiSolar(name) {
    this.checkLang();
    return this._jieQi[name];
  }
  getDayNineStar() {
    const solarYmd = this._solar.toYmd();
    const dongZhi = this.getJieQiSolar(I18n.getMessage("jq.dongZhi"));
    const dongZhi2 = this.getJieQiSolar("DONG_ZHI");
    const xiaZhi = this.getJieQiSolar(I18n.getMessage("jq.xiaZhi"));
    const dongZhiIndex = LunarUtil.getJiaZiIndex(dongZhi.getLunar().getDayInGanZhi());
    const dongZhiIndex2 = LunarUtil.getJiaZiIndex(dongZhi2.getLunar().getDayInGanZhi());
    const xiaZhiIndex = LunarUtil.getJiaZiIndex(xiaZhi.getLunar().getDayInGanZhi());
    const solarShunBai = dongZhi.next(dongZhiIndex > 29 ? 60 - dongZhiIndex : -dongZhiIndex);
    const solarShunBai2 = dongZhi2.next(dongZhiIndex2 > 29 ? 60 - dongZhiIndex2 : -dongZhiIndex2);
    const solarNiZi = xiaZhi.next(xiaZhiIndex > 29 ? 60 - xiaZhiIndex : -xiaZhiIndex);
    const solarShunBaiYmd = solarShunBai.toYmd();
    const solarShunBaiYmd2 = solarShunBai2.toYmd();
    const solarNiZiYmd = solarNiZi.toYmd();
    let offset = 0;
    if (solarYmd >= solarShunBaiYmd && solarYmd < solarNiZiYmd) {
      offset = this._solar.subtract(solarShunBai) % 9;
    } else if (solarYmd >= solarNiZiYmd && solarYmd < solarShunBaiYmd2) {
      offset = 8 - this._solar.subtract(solarNiZi) % 9;
    } else if (solarYmd >= solarShunBaiYmd2) {
      offset = this._solar.subtract(solarShunBai2) % 9;
    } else if (solarYmd < solarShunBaiYmd) {
      offset = (8 + solarShunBai.subtract(this._solar)) % 9;
    }
    return NineStar.fromIndex(offset);
  }
  getTimeNineStar() {
    const solarYmd = this._solar.toYmd();
    let asc = false;
    if (solarYmd >= this.getJieQiSolar(I18n.getMessage("jq.dongZhi")).toYmd() && solarYmd < this.getJieQiSolar(I18n.getMessage("jq.xiaZhi")).toYmd()) {
      asc = true;
    } else if (solarYmd >= this.getJieQiSolar("DONG_ZHI").toYmd()) {
      asc = true;
    }
    const offset = asc ? [0, 3, 6] : [8, 5, 2];
    const start = offset[this.getDayZhiIndex() % 3];
    const index = asc ? start + this._timeZhiIndex : start + 9 - this._timeZhiIndex;
    return NineStar.fromIndex(index % 9);
  }
  getSolar() {
    return this._solar;
  }
  getJieQiTable() {
    this.checkLang();
    return this._jieQi;
  }
  getJieQiList() {
    return this._jieQiList;
  }
  getNextJie(wholeDay = false) {
    const conditions = [];
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
      conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2]);
    }
    return this.getNearJieQi(true, conditions, wholeDay);
  }
  getPrevJie(wholeDay = false) {
    const conditions = [];
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
      conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2]);
    }
    return this.getNearJieQi(false, conditions, wholeDay);
  }
  getNextQi(wholeDay = false) {
    const conditions = [];
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
      conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2 + 1]);
    }
    return this.getNearJieQi(true, conditions, wholeDay);
  }
  getPrevQi(wholeDay = false) {
    const conditions = [];
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
      conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2 + 1]);
    }
    return this.getNearJieQi(false, conditions, wholeDay);
  }
  getNextJieQi(wholeDay = false) {
    return this.getNearJieQi(true, [], wholeDay);
  }
  getPrevJieQi(wholeDay = false) {
    return this.getNearJieQi(false, [], wholeDay);
  }
  getNearJieQi(forward, conditions, wholeDay) {
    let name = "";
    let near = null;
    const filters = {};
    let filter = false;
    if (conditions) {
      for (let i = 0, j = conditions.length; i < j; i++) {
        filters[conditions[i]] = true;
        filter = true;
      }
    }
    const today2 = wholeDay ? this._solar.toYmd() : this._solar.toYmdHms();
    const keys = Object.keys(this._jieQi);
    for (let i = 0, j = keys.length; i < j; i++) {
      const key = keys[i];
      const solar = this._jieQi[key];
      const jq = _Lunar._convertJieQi(key);
      if (filter) {
        if (!filters[jq]) {
          continue;
        }
      }
      const day = wholeDay ? solar.toYmd() : solar.toYmdHms();
      if (forward) {
        if (day <= today2) {
          continue;
        }
        if (null == near) {
          name = jq;
          near = solar;
        } else {
          const nearDay = wholeDay ? near.toYmd() : near.toYmdHms();
          if (day < nearDay) {
            name = jq;
            near = solar;
          }
        }
      } else {
        if (day > today2) {
          continue;
        }
        if (null == near) {
          name = jq;
          near = solar;
        } else {
          const nearDay = wholeDay ? near.toYmd() : near.toYmdHms();
          if (day > nearDay) {
            name = jq;
            near = solar;
          }
        }
      }
    }
    return new JieQi(name, near);
  }
  getCurrentJieQi() {
    const keys = Object.keys(this._jieQi);
    for (let i = 0, j = keys.length; i < j; i++) {
      const k = keys[i];
      const d = this._jieQi[k];
      if (d.getYear() == this._solar.getYear() && d.getMonth() == this._solar.getMonth() && d.getDay() == this._solar.getDay()) {
        return new JieQi(_Lunar._convertJieQi(k), d);
      }
    }
    return null;
  }
  getCurrentJie() {
    for (let i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i += 2) {
      const key = LunarUtil.JIE_QI_IN_USE[i];
      const d = this.getJieQiSolar(key);
      if (d && d.getYear() === this._solar.getYear() && d.getMonth() === this._solar.getMonth() && d.getDay() === this._solar.getDay()) {
        return new JieQi(_Lunar._convertJieQi(key), d);
      }
    }
    return null;
  }
  getCurrentQi() {
    for (let i = 1, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i += 2) {
      const key = LunarUtil.JIE_QI_IN_USE[i];
      const d = this.getJieQiSolar(key);
      if (d && d.getYear() === this._solar.getYear() && d.getMonth() === this._solar.getMonth() && d.getDay() === this._solar.getDay()) {
        return new JieQi(_Lunar._convertJieQi(key), d);
      }
    }
    return null;
  }
  getEightChar() {
    return this._eightChar;
  }
  next(days) {
    return this._solar.next(days).getLunar();
  }
  getYearXun() {
    return LunarUtil.getXun(this.getYearInGanZhi());
  }
  getMonthXun() {
    return LunarUtil.getXun(this.getMonthInGanZhi());
  }
  getDayXun() {
    return LunarUtil.getXun(this.getDayInGanZhi());
  }
  getTimeXun() {
    return LunarUtil.getXun(this.getTimeInGanZhi());
  }
  getYearXunByLiChun() {
    return LunarUtil.getXun(this.getYearInGanZhiByLiChun());
  }
  getYearXunExact() {
    return LunarUtil.getXun(this.getYearInGanZhiExact());
  }
  getMonthXunExact() {
    return LunarUtil.getXun(this.getMonthInGanZhiExact());
  }
  getDayXunExact() {
    return LunarUtil.getXun(this.getDayInGanZhiExact());
  }
  getDayXunExact2() {
    return LunarUtil.getXun(this.getDayInGanZhiExact2());
  }
  getYearXunKong() {
    return LunarUtil.getXunKong(this.getYearInGanZhi());
  }
  getMonthXunKong() {
    return LunarUtil.getXunKong(this.getMonthInGanZhi());
  }
  getDayXunKong() {
    return LunarUtil.getXunKong(this.getDayInGanZhi());
  }
  getTimeXunKong() {
    return LunarUtil.getXunKong(this.getTimeInGanZhi());
  }
  getYearXunKongByLiChun() {
    return LunarUtil.getXunKong(this.getYearInGanZhiByLiChun());
  }
  getYearXunKongExact() {
    return LunarUtil.getXunKong(this.getYearInGanZhiExact());
  }
  getMonthXunKongExact() {
    return LunarUtil.getXunKong(this.getMonthInGanZhiExact());
  }
  getDayXunKongExact() {
    return LunarUtil.getXunKong(this.getDayInGanZhiExact());
  }
  getDayXunKongExact2() {
    return LunarUtil.getXunKong(this.getDayInGanZhiExact2());
  }
  toString() {
    return this.getYearInChinese() + "\u5E74" + this.getMonthInChinese() + "\u6708" + this.getDayInChinese();
  }
  toFullString() {
    let s = this.toString();
    s += " " + this.getYearInGanZhi() + "(" + this.getYearShengXiao() + ")\u5E74";
    s += " " + this.getMonthInGanZhi() + "(" + this.getMonthShengXiao() + ")\u6708";
    s += " " + this.getDayInGanZhi() + "(" + this.getDayShengXiao() + ")\u65E5";
    s += " " + this.getTimeZhi() + "(" + this.getTimeShengXiao() + ")\u65F6";
    s += " \u7EB3\u97F3[" + this.getYearNaYin() + " " + this.getMonthNaYin() + " " + this.getDayNaYin() + " " + this.getTimeNaYin() + "]";
    s += " \u661F\u671F" + this.getWeekInChinese();
    this.getFestivals().forEach((f) => {
      s += " (" + f + ")";
    });
    this.getOtherFestivals().forEach((f) => {
      s += " (" + f + ")";
    });
    const jq = this.getJieQi();
    if (jq.length > 0) {
      s += " [" + jq + "]";
    }
    s += " " + this.getGong() + "\u65B9" + this.getShou();
    s += " \u661F\u5BBF[" + this.getXiu() + this.getZheng() + this.getAnimal() + "](" + this.getXiuLuck() + ")";
    s += " \u5F6D\u7956\u767E\u5FCC[" + this.getPengZuGan() + " " + this.getPengZuZhi() + "]";
    s += " \u559C\u795E\u65B9\u4F4D[" + this.getDayPositionXi() + "](" + this.getDayPositionXiDesc() + ")";
    s += " \u9633\u8D35\u795E\u65B9\u4F4D[" + this.getDayPositionYangGui() + "](" + this.getDayPositionYangGuiDesc() + ")";
    s += " \u9634\u8D35\u795E\u65B9\u4F4D[" + this.getDayPositionYinGui() + "](" + this.getDayPositionYinGuiDesc() + ")";
    s += " \u798F\u795E\u65B9\u4F4D[" + this.getDayPositionFu() + "](" + this.getDayPositionFuDesc() + ")";
    s += " \u8D22\u795E\u65B9\u4F4D[" + this.getDayPositionCai() + "](" + this.getDayPositionCaiDesc() + ")";
    s += " \u51B2[" + this.getDayChongDesc() + "]";
    s += " \u715E[" + this.getDaySha() + "]";
    return s;
  }
  getShuJiu() {
    const currentDay = Solar.fromYmd(this._solar.getYear(), this._solar.getMonth(), this._solar.getDay());
    let start = this.getJieQiSolar("DONG_ZHI");
    let startDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay());
    if (currentDay.isBefore(startDay)) {
      start = this.getJieQiSolar(I18n.getMessage("jq.dongZhi"));
      startDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay());
    }
    const endDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay()).next(81);
    if (currentDay.isBefore(startDay) || !currentDay.isBefore(endDay)) {
      return null;
    }
    const days = currentDay.subtract(startDay);
    return new ShuJiu(LunarUtil.NUMBER[Math.floor(days / 9) + 1] + "\u4E5D", days % 9 + 1);
  }
  getFu() {
    const currentDay = Solar.fromYmd(this._solar.getYear(), this._solar.getMonth(), this._solar.getDay());
    const xiaZhi = this.getJieQiSolar(I18n.getMessage("jq.xiaZhi"));
    const liQiu = this.getJieQiSolar(I18n.getMessage("jq.liQiu"));
    let startDay = Solar.fromYmd(xiaZhi.getYear(), xiaZhi.getMonth(), xiaZhi.getDay());
    let add = 6 - xiaZhi.getLunar().getDayGanIndex();
    if (add < 0) {
      add += 10;
    }
    add += 20;
    startDay = startDay.next(add);
    if (currentDay.isBefore(startDay)) {
      return null;
    }
    let days = currentDay.subtract(startDay);
    if (days < 10) {
      return new Fu("\u521D\u4F0F", days + 1);
    }
    startDay = startDay.next(10);
    days = currentDay.subtract(startDay);
    if (days < 10) {
      return new Fu("\u4E2D\u4F0F", days + 1);
    }
    startDay = startDay.next(10);
    const liQiuDay = Solar.fromYmd(liQiu.getYear(), liQiu.getMonth(), liQiu.getDay());
    days = currentDay.subtract(startDay);
    if (liQiuDay.isAfter(startDay)) {
      if (days < 10) {
        return new Fu("\u4E2D\u4F0F", days + 11);
      }
      startDay = startDay.next(10);
      days = currentDay.subtract(startDay);
    }
    if (days < 10) {
      return new Fu("\u672B\u4F0F", days + 1);
    }
    return null;
  }
  getLiuYao() {
    return LunarUtil.LIU_YAO[(Math.abs(this._month) + this._day - 2) % 6];
  }
  getWuHou() {
    const jieQi = this.getPrevJieQi(true);
    const jq = LunarUtil.find(jieQi.getName(), LunarUtil.JIE_QI);
    let index = Math.floor(this._solar.subtract(jieQi.getSolar()) / 5);
    if (index > 2) {
      index = 2;
    }
    return LunarUtil.WU_HOU[(jq.index * 3 + index) % LunarUtil.WU_HOU.length];
  }
  getHou() {
    const jieQi = this.getPrevJieQi(true);
    const days = this._solar.subtract(jieQi.getSolar());
    const max = LunarUtil.HOU.length - 1;
    let offset = Math.floor(days / 5);
    if (offset > max) {
      offset = max;
    }
    return jieQi.getName() + " " + LunarUtil.HOU[offset];
  }
  getDayLu() {
    const gan = LunarUtil.LU[this.getDayGan()];
    const zhi = LunarUtil.LU[this.getDayZhi()];
    let lu = gan + "\u547D\u4E92\u7984";
    if (zhi) {
      lu += " " + zhi + "\u547D\u8FDB\u7984";
    }
    return lu;
  }
  getTime() {
    return LunarTime.fromYmdHms(this._year, this._month, this._day, this._hour, this._minute, this._second);
  }
  getTimes() {
    const l = [];
    l.push(LunarTime.fromYmdHms(this._year, this._month, this._day, 0, 0, 0));
    for (let i = 0; i < 12; i++) {
      l.push(LunarTime.fromYmdHms(this._year, this._month, this._day, (i + 1) * 2 - 1, 0, 0));
    }
    return l;
  }
  getFoto() {
    return Foto.fromLunar(this);
  }
  getTao() {
    return Tao.fromLunar(this);
  }
};
var SolarMonth = class _SolarMonth {
  static fromYm(year, month) {
    return new _SolarMonth(year, month);
  }
  static fromDate(date) {
    return _SolarMonth.fromYm(date.getFullYear(), date.getMonth() + 1);
  }
  constructor(year, month) {
    this._year = year;
    this._month = month;
  }
  getYear() {
    return this._year;
  }
  getMonth() {
    return this._month;
  }
  next(months) {
    const n = months < 0 ? -1 : 1;
    let m = Math.abs(months);
    let y = this._year + Math.floor(m / 12) * n;
    m = this._month + m % 12 * n;
    if (m > 12) {
      m -= 12;
      y++;
    } else if (m < 1) {
      m += 12;
      y--;
    }
    return _SolarMonth.fromYm(y, m);
  }
  getDays() {
    const l = [];
    const d = Solar.fromYmd(this._year, this._month, 1);
    l.push(d);
    const days = SolarUtil.getDaysOfMonth(this._year, this._month);
    for (let i = 1; i < days; i++) {
      l.push(d.next(i));
    }
    return l;
  }
  getWeeks(start) {
    const l = [];
    let week = SolarWeek.fromYmd(this._year, this._month, 1, start);
    while (true) {
      l.push(week);
      week = week.next(1, false);
      const firstDay = week.getFirstDay();
      if (firstDay.getYear() > this._year || firstDay.getMonth() > this._month) {
        break;
      }
    }
    return l;
  }
  toString() {
    return `${this.getYear()}-${this.getMonth()}`;
  }
  toFullString() {
    return `${this.getYear()}\u5E74${this.getMonth()}\u6708`;
  }
};
var _Solar = class {
  static fromYmd(year, month, day) {
    return _Solar.fromYmdHms(year, month, day, 0, 0, 0);
  }
  static fromYmdHms(year, month, day, hour, minute, second) {
    return new _Solar(year, month, day, hour, minute, second);
  }
  static fromDate(date) {
    return _Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
  }
  static fromJulianDay(julianDay) {
    let d = Math.floor(julianDay + 0.5);
    let f = julianDay + 0.5 - d;
    if (d >= 2299161) {
      const c = Math.floor((d - 186721625e-2) / 36524.25);
      d += 1 + c - Math.floor(c / 4);
    }
    d += 1524;
    let year = Math.floor((d - 122.1) / 365.25);
    d -= Math.floor(365.25 * year);
    let month = Math.floor(d / 30.601);
    d -= Math.floor(30.601 * month);
    let day = d;
    if (month > 13) {
      month -= 13;
      year -= 4715;
    } else {
      month -= 1;
      year -= 4716;
    }
    f *= 24;
    let hour = Math.floor(f);
    f -= hour;
    f *= 60;
    let minute = Math.floor(f);
    f -= minute;
    f *= 60;
    let second = Math.round(f);
    if (second > 59) {
      second -= 60;
      minute++;
    }
    if (minute > 59) {
      minute -= 60;
      hour++;
    }
    if (hour > 23) {
      hour -= 24;
      day += 1;
    }
    return _Solar.fromYmdHms(year, month, day, hour, minute, second);
  }
  static fromBaZi(yearGanZhi, monthGanZhi, dayGanZhi, timeGanZhi, sect = 2, baseYear = 1900) {
    sect = 1 == sect ? 1 : 2;
    const l = [];
    let m = LunarUtil.index(monthGanZhi.substring(1), LunarUtil.ZHI, -1) - 2;
    if (m < 0) {
      m += 12;
    }
    if (((LunarUtil.index(yearGanZhi.substring(0, 1), LunarUtil.GAN, -1) + 1) * 2 + m) % 10 !== LunarUtil.index(monthGanZhi.substring(0, 1), LunarUtil.GAN, -1)) {
      return l;
    }
    let y = LunarUtil.getJiaZiIndex(yearGanZhi) - 57;
    if (y < 0) {
      y += 60;
    }
    y++;
    m *= 2;
    const h = LunarUtil.index(timeGanZhi.substring(1), LunarUtil.ZHI, -1) * 2;
    let hours = [h];
    if (0 == h && 2 == sect) {
      hours = [0, 23];
    }
    const startYear = baseYear - 1;
    const endYear = (/* @__PURE__ */ new Date()).getFullYear();
    while (y <= endYear) {
      if (y >= startYear) {
        const jieQiLunar = Lunar.fromYmd(y, 1, 1);
        const jieQiList = jieQiLunar.getJieQiList();
        const jieQiTable = jieQiLunar.getJieQiTable();
        let solarTime = jieQiTable[jieQiList[4 + m]];
        if (solarTime.getYear() >= baseYear) {
          let d = LunarUtil.getJiaZiIndex(dayGanZhi) - LunarUtil.getJiaZiIndex(solarTime.getLunar().getDayInGanZhiExact2());
          if (d < 0) {
            d += 60;
          }
          if (d > 0) {
            solarTime = solarTime.next(d);
          }
          hours.forEach((hour) => {
            let mi = 0;
            let s = 0;
            if (d == 0 && hour === solarTime.getHour()) {
              mi = solarTime.getMinute();
              s = solarTime.getSecond();
            }
            let solar = _Solar.fromYmdHms(solarTime.getYear(), solarTime.getMonth(), solarTime.getDay(), hour, mi, s);
            if (d === 30) {
              solar = solar.nextHour(-1);
            }
            const lunar = solar.getLunar();
            const dgz = 2 === sect ? lunar.getDayInGanZhiExact2() : lunar.getDayInGanZhiExact();
            if (lunar.getYearInGanZhiExact() === yearGanZhi && lunar.getMonthInGanZhiExact() === monthGanZhi && dgz === dayGanZhi && lunar.getTimeInGanZhi() === timeGanZhi) {
              l.push(solar);
            }
          });
        }
      }
      y += 60;
    }
    return l;
  }
  constructor(year, month, day, hour, minute, second) {
    if (1582 === year && 10 === month) {
      if (day > 4 && day < 15) {
        throw new Error(`wrong solar year ${year} month ${month} day ${day}`);
      }
    }
    if (month < 1 || month > 12) {
      throw new Error(`wrong month ${month}`);
    }
    if (day < 1 || day > 31) {
      throw new Error(`wrong day ${day}`);
    }
    if (hour < 0 || hour > 23) {
      throw new Error(`wrong hour ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new Error(`wrong minute ${minute}`);
    }
    if (second < 0 || second > 59) {
      throw new Error(`wrong second ${second}`);
    }
    this._year = year;
    this._month = month;
    this._day = day;
    this._hour = hour;
    this._minute = minute;
    this._second = second;
  }
  getYear() {
    return this._year;
  }
  getMonth() {
    return this._month;
  }
  getDay() {
    return this._day;
  }
  getHour() {
    return this._hour;
  }
  getMinute() {
    return this._minute;
  }
  getSecond() {
    return this._second;
  }
  getWeek() {
    return (Math.floor(this.getJulianDay() + 0.5) + 7000001) % 7;
  }
  getWeekInChinese() {
    return SolarUtil.WEEK[this.getWeek()];
  }
  getSolarWeek(start) {
    return SolarWeek.fromYmd(this._year, this._month, this._day, start);
  }
  isLeapYear() {
    return SolarUtil.isLeapYear(this._year);
  }
  getFestivals() {
    const l = [];
    let f = SolarUtil.FESTIVAL[this._month + "-" + this._day];
    if (f) {
      l.push(f);
    }
    const weeks = Math.ceil(this._day / 7);
    const week = this.getWeek();
    f = SolarUtil.WEEK_FESTIVAL[this._month + "-" + weeks + "-" + week];
    if (f) {
      l.push(f);
    }
    if (this._day + 7 > SolarUtil.getDaysOfMonth(this._year, this._month)) {
      f = SolarUtil.WEEK_FESTIVAL[this._month + "-0-" + week];
      if (f) {
        l.push(f);
      }
    }
    return l;
  }
  getOtherFestivals() {
    const l = [];
    const fs = SolarUtil.OTHER_FESTIVAL[this._month + "-" + this._day];
    if (fs) {
      fs.forEach((f) => {
        l.push(f);
      });
    }
    return l;
  }
  getXingzuo() {
    return this.getXingZuo();
  }
  getXingZuo() {
    let index = 11;
    const y = this._month * 100 + this._day;
    if (y >= 321 && y <= 419) {
      index = 0;
    } else if (y >= 420 && y <= 520) {
      index = 1;
    } else if (y >= 521 && y <= 621) {
      index = 2;
    } else if (y >= 622 && y <= 722) {
      index = 3;
    } else if (y >= 723 && y <= 822) {
      index = 4;
    } else if (y >= 823 && y <= 922) {
      index = 5;
    } else if (y >= 923 && y <= 1023) {
      index = 6;
    } else if (y >= 1024 && y <= 1122) {
      index = 7;
    } else if (y >= 1123 && y <= 1221) {
      index = 8;
    } else if (y >= 1222 || y <= 119) {
      index = 9;
    } else if (y <= 218) {
      index = 10;
    }
    return SolarUtil.XINGZUO[index];
  }
  /**
   * 获取薪资比例(感谢 https://gitee.com/smr1987)
   * @returns 1 | 2 | 3 薪资比例
   */
  getSalaryRate() {
    if (this._month === 1 && this._day === 1) {
      return 3;
    }
    if (this._month === 5 && this._day === 1) {
      return 3;
    }
    if (this._month === 10 && this._day >= 1 && this._day <= 3) {
      return 3;
    }
    const lunar = this.getLunar();
    if (lunar.getMonth() === 1 && lunar.getDay() >= 1 && lunar.getDay() <= 3) {
      return 3;
    }
    if (lunar.getMonth() === 5 && lunar.getDay() === 5) {
      return 3;
    }
    if (lunar.getMonth() === 8 && lunar.getDay() === 15) {
      return 3;
    }
    if ("\u6E05\u660E" === lunar.getJieQi()) {
      return 3;
    }
    const holiday = HolidayUtil.getHoliday(this._year, this._month, this._day);
    if (holiday) {
      if (!holiday.isWork()) {
        return 2;
      }
    } else {
      const week = this.getWeek();
      if (week === 6 || week === 0) {
        return 2;
      }
    }
    return 1;
  }
  toYmd() {
    let y = this._year + "";
    while (y.length < 4) {
      y = "0" + y;
    }
    return [y, (this._month < 10 ? "0" : "") + this._month, (this._day < 10 ? "0" : "") + this._day].join("-");
  }
  toYmdHms() {
    return this.toYmd() + " " + [(this._hour < 10 ? "0" : "") + this._hour, (this._minute < 10 ? "0" : "") + this._minute, (this._second < 10 ? "0" : "") + this._second].join(":");
  }
  toString() {
    return this.toYmd();
  }
  toFullString() {
    let s = this.toYmdHms();
    if (this.isLeapYear()) {
      s += " \u95F0\u5E74";
    }
    s += " \u661F\u671F" + this.getWeekInChinese();
    const festivals = this.getFestivals();
    festivals.forEach((f) => {
      s += " (" + f + ")";
    });
    s += " " + this.getXingZuo() + "\u5EA7";
    return s;
  }
  nextYear(years) {
    const y = this._year + years;
    const m = this._month;
    let d = this._day;
    if (1582 === y && 10 === m) {
      if (d > 4 && d < 15) {
        d += 10;
      }
    } else if (2 === m) {
      if (d > 28) {
        if (!SolarUtil.isLeapYear(y)) {
          d = 28;
        }
      }
    }
    return _Solar.fromYmdHms(y, m, d, this._hour, this._minute, this._second);
  }
  nextMonth(months) {
    const month = SolarMonth.fromYm(this._year, this._month).next(months);
    const y = month.getYear();
    const m = month.getMonth();
    let d = this._day;
    if (1582 === y && 10 === m) {
      if (d > 4 && d < 15) {
        d += 10;
      }
    } else {
      const maxDay = SolarUtil.getDaysOfMonth(y, m);
      if (d > maxDay) {
        d = maxDay;
      }
    }
    return _Solar.fromYmdHms(y, m, d, this._hour, this._minute, this._second);
  }
  nextDay(days) {
    let y = this._year;
    let m = this._month;
    let d = this._day;
    if (1582 === y && 10 === m) {
      if (d > 4) {
        d -= 10;
      }
    }
    if (days > 0) {
      d += days;
      let daysInMonth = SolarUtil.getDaysOfMonth(y, m);
      while (d > daysInMonth) {
        d -= daysInMonth;
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
        daysInMonth = SolarUtil.getDaysOfMonth(y, m);
      }
    } else if (days < 0) {
      while (d + days <= 0) {
        m--;
        if (m < 1) {
          m = 12;
          y--;
        }
        d += SolarUtil.getDaysOfMonth(y, m);
      }
      d += days;
    }
    if (1582 === y && 10 === m) {
      if (d > 4) {
        d += 10;
      }
    }
    return _Solar.fromYmdHms(y, m, d, this._hour, this._minute, this._second);
  }
  next(days, onlyWorkday = false) {
    if (onlyWorkday) {
      let solar = _Solar.fromYmdHms(this._year, this._month, this._day, this._hour, this._minute, this._second);
      if (days !== 0) {
        let rest = Math.abs(days);
        const add = days < 1 ? -1 : 1;
        while (rest > 0) {
          solar = solar.next(add);
          let work = true;
          const holiday = HolidayUtil.getHoliday(solar.getYear(), solar.getMonth(), solar.getDay());
          if (!holiday) {
            const week = solar.getWeek();
            if (0 === week || 6 === week) {
              work = false;
            }
          } else {
            work = holiday.isWork();
          }
          if (work) {
            rest -= 1;
          }
        }
      }
      return solar;
    } else {
      return this.nextDay(days);
    }
  }
  nextHour(hours) {
    const h = this._hour + hours;
    const n = h < 0 ? -1 : 1;
    let hour = Math.abs(h);
    let days = Math.floor(hour / 24) * n;
    hour = hour % 24 * n;
    if (hour < 0) {
      hour += 24;
      days--;
    }
    const solar = this.next(days);
    return _Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hour, solar.getMinute(), solar.getSecond());
  }
  getLunar() {
    return Lunar.fromSolar(this);
  }
  getJulianDay() {
    let y = this._year;
    let m = this._month;
    const d = this._day + ((this._second / 60 + this._minute) / 60 + this._hour) / 24;
    let n = 0;
    let g = false;
    if (y * 372 + m * 31 + Math.floor(d) >= 588829) {
      g = true;
    }
    if (m <= 2) {
      m += 12;
      y--;
    }
    if (g) {
      n = Math.floor(y / 100);
      n = 2 - n + Math.floor(n / 4);
    }
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + n - 1524.5;
  }
  isBefore(solar) {
    if (this._year > solar.getYear()) {
      return false;
    }
    if (this._year < solar.getYear()) {
      return true;
    }
    if (this._month > solar.getMonth()) {
      return false;
    }
    if (this._month < solar.getMonth()) {
      return true;
    }
    if (this._day > solar.getDay()) {
      return false;
    }
    if (this._day < solar.getDay()) {
      return true;
    }
    if (this._hour > solar.getHour()) {
      return false;
    }
    if (this._hour < solar.getHour()) {
      return true;
    }
    if (this._minute > solar.getMinute()) {
      return false;
    }
    if (this._minute < solar.getMinute()) {
      return true;
    }
    return this._second < solar.getSecond();
  }
  isAfter(solar) {
    if (this._year > solar.getYear()) {
      return true;
    }
    if (this._year < solar.getYear()) {
      return false;
    }
    if (this._month > solar.getMonth()) {
      return true;
    }
    if (this._month < solar.getMonth()) {
      return false;
    }
    if (this._day > solar.getDay()) {
      return true;
    }
    if (this._day < solar.getDay()) {
      return false;
    }
    if (this._hour > solar.getHour()) {
      return true;
    }
    if (this._hour < solar.getHour()) {
      return false;
    }
    if (this._minute > solar.getMinute()) {
      return true;
    }
    if (this._minute < solar.getMinute()) {
      return false;
    }
    return this._second > solar.getSecond();
  }
  subtract(solar) {
    return SolarUtil.getDaysBetween(solar.getYear(), solar.getMonth(), solar.getDay(), this._year, this._month, this._day);
  }
  subtractMinute(solar) {
    let days = this.subtract(solar);
    const cm = this._hour * 60 + this._minute;
    const sm = solar.getHour() * 60 + solar.getMinute();
    let m = cm - sm;
    if (m < 0) {
      m += 1440;
      days--;
    }
    m += days * 1440;
    return m;
  }
};
var Solar = _Solar;
Solar.J2000 = 2451545;
I18n.init();

// src/modules/calendar/model.ts
var DAY_MILLIS = 24 * 60 * 60 * 1e3;
function localDate(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}
function pad(value) {
  return String(value).padStart(2, "0");
}
function isoDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function shiftMonth(year, month, amount) {
  const shifted = localDate(year, month + amount, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}
function lunarLabel(year, month, day) {
  var _a;
  try {
    const lunar = Solar.fromYmd(year, month, day).getLunar();
    const festival = (_a = lunar.getFestivals()[0]) != null ? _a : "";
    const solarTerm = lunar.getJieQi();
    const monthText = `${lunar.getMonthInChinese()}\u6708`;
    const dayText2 = lunar.getDayInChinese();
    const isMonthStart = lunar.getDay() === 1;
    const short = festival || solarTerm || (isMonthStart ? monthText : dayText2);
    const kind = festival ? "festival" : solarTerm ? "solar-term" : isMonthStart ? "month" : "day";
    return { short, full: `${monthText}${dayText2}`, kind };
  } catch (e) {
    return { short: "", full: "", kind: "none" };
  }
}
function isoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - weekday);
  const weekYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MILLIS + 1) / 7);
  return { year: weekYear, week };
}
function monthGrid(year, month) {
  const first = localDate(year, month, 1);
  const last = localDate(year, month + 1, 0);
  const firstIsoWeekday = first.getDay() || 7;
  const lastIsoWeekday = last.getDay() || 7;
  const start = localDate(year, month, 1 - (firstIsoWeekday - 1));
  const end = localDate(year, month, last.getDate() + (7 - lastIsoWeekday));
  const today2 = isoDay(/* @__PURE__ */ new Date());
  const weeks = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); ) {
    const anchor = new Date(cursor.getTime());
    const coordinate = isoWeek(anchor);
    const days = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(anchor.getTime());
      date.setDate(anchor.getDate() + offset);
      const dateText = isoDay(date);
      const dateMonth = date.getMonth() + 1;
      days.push({
        date: dateText,
        year: date.getFullYear(),
        month: dateMonth,
        day: date.getDate(),
        weekday: offset + 1,
        inMonth: date.getFullYear() === year && dateMonth === month,
        isToday: dateText === today2,
        lunar: lunarLabel(date.getFullYear(), dateMonth, date.getDate())
      });
    }
    weeks.push({
      weekYear: coordinate.year,
      weekNumber: coordinate.week,
      anchor: isoDay(anchor),
      days
    });
    cursor = new Date(anchor.getTime());
    cursor.setDate(anchor.getDate() + 7);
  }
  return weeks;
}

// src/modules/calendar/view.ts
var CALENDAR_VIEW_TYPE = "ziminos-calendar";
function registerCalendar(ctx, openPeriod) {
  const holidays = new HolidayService(ctx);
  ctx.plugin.registerView(
    CALENDAR_VIEW_TYPE,
    (leaf) => new ZiminosCalendarView(leaf, holidays, openPeriod)
  );
  ctx.commands.register(OPEN_CALENDAR_COMMAND, () => {
    void revealCalendar(ctx.app, true).catch(() => void 0);
  });
  ctx.app.workspace.onLayoutReady(() => {
    void revealCalendar(ctx.app, false).catch(() => void 0);
  });
}
async function revealCalendar(app, active) {
  await app.workspace.ensureSideLeaf(CALENDAR_VIEW_TYPE, "right", {
    active,
    reveal: true,
    split: false
  });
}
var ZiminosCalendarView = class extends import_obsidian23.ItemView {
  constructor(leaf, holidays, openPeriod) {
    super(leaf);
    this.mode = "month";
    this.unsubscribe = null;
    this.holidays = holidays;
    this.openPeriod = openPeriod;
    const today2 = /* @__PURE__ */ new Date();
    this.year = today2.getFullYear();
    this.month = today2.getMonth() + 1;
  }
  getViewType() {
    return CALENDAR_VIEW_TYPE;
  }
  getDisplayText() {
    return "\u4E2D\u56FD\u65E5\u5386";
  }
  getIcon() {
    return "calendar-days";
  }
  async onOpen() {
    this.contentEl.addClass("ziminos-calendar");
    this.unsubscribe = this.holidays.subscribe(() => this.renderCalendar());
    this.renderCalendar();
    void this.holidays.refreshCalendarYear(this.year);
  }
  async onClose() {
    var _a;
    (_a = this.unsubscribe) == null ? void 0 : _a.call(this);
    this.unsubscribe = null;
    this.contentEl.empty();
  }
  renderCalendar() {
    this.contentEl.empty();
    const shell = this.contentEl.createDiv({ cls: "ziminos-calendar-shell" });
    this.renderHeader(shell);
    if (this.mode === "month") {
      this.renderMonth(shell);
    } else {
      this.renderYear(shell);
    }
    this.renderStatus(shell, this.holidays.status(this.year));
    void this.holidays.refreshCalendarYear(this.year);
  }
  /**
   * 年、季、月是三个独立坐标，不再让一组“上一个/下一个”随视图改变含义。
   * 标题点击创建对应复盘，左右箭头只导航，两种意图因此不会相互猜测。
   */
  renderHeader(parent) {
    const header = parent.createDiv({ cls: "ziminos-calendar-header" });
    const firstRow = header.createDiv({ cls: "ziminos-calendar-header-row" });
    const quarter = Math.ceil(this.month / 3);
    const quarterMonth = (quarter - 1) * 3 + 1;
    this.renderCoordinate(
      firstRow,
      "year",
      `${this.year}\u5E74`,
      "yearly",
      `${this.year}-01-01`,
      "\u521B\u5EFA\u6216\u6253\u5F00\u5E74\u590D\u76D8",
      "\u4E0A\u4E00\u5E74",
      "\u4E0B\u4E00\u5E74",
      (direction) => {
        this.year += direction;
      }
    );
    this.renderCoordinate(
      firstRow,
      "quarter",
      `${quarter}\u5B63\u5EA6`,
      "quarterly",
      `${this.year}-${String(quarterMonth).padStart(2, "0")}-01`,
      "\u521B\u5EFA\u6216\u6253\u5F00\u5B63\u5EA6\u590D\u76D8",
      "\u4E0A\u4E00\u5B63\u5EA6",
      "\u4E0B\u4E00\u5B63\u5EA6",
      (direction) => this.shiftVisibleMonth(direction * 3)
    );
    const secondRow = header.createDiv({ cls: "ziminos-calendar-header-row" });
    const monthAnchor = `${this.year}-${String(this.month).padStart(2, "0")}-01`;
    this.renderCoordinate(
      secondRow,
      "month",
      `${this.month}\u6708`,
      "monthly",
      monthAnchor,
      "\u521B\u5EFA\u6216\u6253\u5F00\u6708\u590D\u76D8",
      "\u4E0A\u4E2A\u6708",
      "\u4E0B\u4E2A\u6708",
      (direction) => this.shiftVisibleMonth(direction)
    );
    const controls = secondRow.createDiv({ cls: "ziminos-calendar-header-controls" });
    const today2 = /* @__PURE__ */ new Date();
    const todayButton = this.makeButton(
      controls,
      "\u4ECA",
      "\u56DE\u5230\u4ECA\u5929",
      "ziminos-calendar-today",
      () => {
        this.year = today2.getFullYear();
        this.month = today2.getMonth() + 1;
        this.mode = "month";
        this.renderCalendar();
      }
    );
    todayButton.toggleClass(
      "is-current",
      this.year === today2.getFullYear() && this.month === today2.getMonth() + 1
    );
    this.makeButton(
      controls,
      this.mode === "month" ? "\u6708" : "\u5E74",
      this.mode === "month" ? "\u5207\u6362\u5230\u5E74\u89C6\u56FE" : "\u5207\u6362\u5230\u6708\u89C6\u56FE",
      "ziminos-calendar-view-toggle",
      () => {
        this.mode = this.mode === "month" ? "year" : "month";
        this.renderCalendar();
      }
    );
  }
  renderCoordinate(parent, kind, label, period, anchor, title, previousTitle, nextTitle, shift) {
    const coordinate = parent.createDiv({ cls: `ziminos-calendar-coordinate is-${kind}` });
    this.makeButton(coordinate, "\u2039", previousTitle, "ziminos-calendar-stepper", () => {
      shift(-1);
      this.renderCalendar();
    });
    const labelButton = this.makePeriodButton(coordinate, label, period, anchor, title);
    labelButton.addClass("ziminos-calendar-coordinate-label");
    this.makeButton(coordinate, "\u203A", nextTitle, "ziminos-calendar-stepper", () => {
      shift(1);
      this.renderCalendar();
    });
  }
  shiftVisibleMonth(amount) {
    const shifted = shiftMonth(this.year, this.month, amount);
    this.year = shifted.year;
    this.month = shifted.month;
  }
  renderMonth(parent) {
    const grid = parent.createDiv({ cls: "ziminos-calendar-grid" });
    for (const label of ["\u5468", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"]) {
      grid.createDiv({ cls: "ziminos-calendar-weekday", text: label });
    }
    for (const week of monthGrid(this.year, this.month)) {
      const weekButton = this.makeButton(
        grid,
        String(week.weekNumber),
        `\u521B\u5EFA\u6216\u6253\u5F00 ${week.weekYear} \u5E74\u7B2C ${week.weekNumber} \u5468\u590D\u76D8`,
        "ziminos-calendar-week",
        () => void this.openPeriod("weekly", week.anchor)
      );
      weekButton.setAttribute("aria-label", `${week.weekYear} \u5E74\u7B2C ${week.weekNumber} \u5468`);
      for (const day of week.days) this.renderDay(grid, day);
    }
  }
  renderDay(parent, day) {
    var _a, _b;
    const holiday = this.holidays.day(day.date);
    const button = this.makeButton(
      parent,
      "",
      this.dayTitle(day, (_a = holiday == null ? void 0 : holiday.name) != null ? _a : "", (_b = holiday == null ? void 0 : holiday.isOffDay) != null ? _b : null),
      "ziminos-calendar-day",
      () => void this.openPeriod("daily", day.date)
    );
    button.toggleClass("is-other-month", !day.inMonth);
    button.toggleClass("is-today", day.isToday);
    button.toggleClass("is-weekend", day.weekday >= 6 && !holiday);
    button.toggleClass("is-rest-day", (holiday == null ? void 0 : holiday.isOffDay) === true);
    button.toggleClass("is-work-day", (holiday == null ? void 0 : holiday.isOffDay) === false);
    button.toggleClass(
      "is-special-day",
      day.lunar.kind === "festival" || day.lunar.kind === "solar-term"
    );
    const top = button.createSpan({ cls: "ziminos-calendar-day-top" });
    top.createSpan({ cls: "ziminos-calendar-solar", text: String(day.day) });
    if (holiday) {
      top.createSpan({
        cls: `ziminos-calendar-badge ${holiday.isOffDay ? "is-rest" : "is-work"}`,
        text: holiday.isOffDay ? "\u4F11" : "\u73ED"
      });
    }
    button.createSpan({ cls: "ziminos-calendar-lunar", text: day.lunar.short || " " });
  }
  renderYear(parent) {
    const quarters = parent.createDiv({ cls: "ziminos-calendar-year-grid" });
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      const section = quarters.createDiv({ cls: "ziminos-calendar-quarter" });
      const firstMonth = (quarter - 1) * 3 + 1;
      const anchor = `${this.year}-${String(firstMonth).padStart(2, "0")}-01`;
      const quarterButton = this.makePeriodButton(
        section,
        `${quarter}\u5B63\u5EA6`,
        "quarterly",
        anchor,
        "\u521B\u5EFA\u6216\u6253\u5F00\u5B63\u5EA6\u590D\u76D8"
      );
      quarterButton.toggleClass("is-selected", quarter === Math.ceil(this.month / 3));
      const months = section.createDiv({ cls: "ziminos-calendar-quarter-months" });
      for (let offset = 0; offset < 3; offset += 1) {
        const month = firstMonth + offset;
        const monthAnchor = `${this.year}-${String(month).padStart(2, "0")}-01`;
        const monthButton = this.makePeriodButton(
          months,
          `${month}\u6708`,
          "monthly",
          monthAnchor,
          "\u521B\u5EFA\u6216\u6253\u5F00\u6708\u590D\u76D8"
        );
        monthButton.toggleClass("is-selected", month === this.month);
      }
    }
  }
  renderStatus(parent, status) {
    const row = parent.createDiv({ cls: "ziminos-calendar-status" });
    if (!status.hasSchedule) {
      row.setText(`${this.year} \u5E74\u8C03\u4F11\u5B89\u6392\u5F85\u516C\u5E03\uFF0C\u8054\u7F51\u65F6\u81EA\u52A8\u8865\u9F50`);
      return;
    }
    if (status.lastCheckedAt) {
      const checked = new Date(status.lastCheckedAt).toLocaleDateString("zh-CN");
      row.setText(`\u56FD\u52A1\u9662\u653E\u5047\u5B89\u6392\u5DF2\u4E8E ${checked} \u81EA\u52A8\u6838\u9A8C`);
    } else {
      row.setText("\u6B63\u5728\u540E\u53F0\u6838\u9A8C\u56FD\u52A1\u9662\u653E\u5047\u5B89\u6392");
    }
  }
  makePeriodButton(parent, label, period, anchor, title) {
    return this.makeButton(
      parent,
      label,
      title,
      "ziminos-calendar-period",
      () => void this.openPeriod(period, anchor)
    );
  }
  makeButton(parent, label, title, className, onClick) {
    const button = parent.createEl("button", {
      cls: className,
      text: label,
      attr: { title, "aria-label": title }
    });
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
  }
  dayTitle(day, holidayName, isOffDay) {
    const parts = [day.date];
    if (day.lunar.full) parts.push(`\u519C\u5386${day.lunar.full}`);
    if (holidayName) parts.push(`${holidayName}\uFF08${isOffDay ? "\u653E\u5047" : "\u8865\u73ED"}\uFF09`);
    return parts.join(" \xB7 ");
  }
};

// src/modules/contacts/identity.ts
var import_obsidian24 = require("obsidian");
function archiveFolderOf(ctx) {
  return normalizeFolderPath(ctx.settings.archiveFolder, FOLDERS.archives);
}
function isLivePath(archiveFolder, path) {
  return !isInFolder(path, archiveFolder);
}
function liveNotesOfType(ctx, type) {
  var _a, _b;
  const archive = archiveFolderOf(ctx);
  const matched = [];
  for (const file of ctx.app.vault.getMarkdownFiles()) {
    if (isSystemPath(file.path)) continue;
    if (!isLivePath(archive, file.path)) continue;
    const declared = (_b = (_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.type];
    const values = Array.isArray(declared) ? declared : [declared];
    if (values.some((value) => String(value != null ? value : "").trim() === type)) matched.push(file);
  }
  return matched.sort((left, right) => left.basename.localeCompare(right.basename, "zh"));
}
function descriptionOf(ctx, file) {
  var _a, _b;
  const value = (_b = (_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.description];
  return String(value != null ? value : "").trim();
}
async function pickPerson(ctx, title) {
  const candidates = [
    ...liveNotesOfType(ctx, NOTE_TYPES.person),
    ...liveNotesOfType(ctx, NOTE_TYPES.client)
  ];
  if (!candidates.length) {
    new import_obsidian24.Notice("\u8FD8\u6CA1\u6709\u4EFB\u4F55\u4EBA\u8109\u6216\u5BA2\u6237\u6863\u6848\u3002\u5148\u8FD0\u884C\u300C\u65B0\u5EFA\u4EBA\u8109\u300D\u5EFA\u4E00\u4E2A\uFF0C\u518D\u6765\u5173\u8054\u3002");
    return null;
  }
  return new ChoiceModal(ctx.app, {
    title,
    items: candidates,
    labelOf: (file) => {
      const hint = descriptionOf(ctx, file);
      return hint ? `${file.basename}\u3000\u2014\u3000${hint}` : file.basename;
    }
  }).openAndGetChoice();
}
function lastContactDayOf(view, person) {
  let latest = null;
  for (const source of view.index.backlinksOf(person)) {
    const day = dayOfTitle(source.basename);
    if (day && (!latest || day > latest)) latest = day;
  }
  return latest;
}

// src/modules/contacts/ledger.ts
function diaryNotes(view) {
  const found = [];
  for (const file of view.index.allNotes()) {
    const day = dayOfTitle(file.basename);
    if (day) found.push({ file, day });
  }
  return found;
}
function mentions(view, line, diaryPath, target) {
  return line.links.some((link) => {
    var _a;
    return ((_a = view.index.resolve(link, diaryPath)) == null ? void 0 : _a.path) === target.path;
  });
}
function isLedgerLine(line) {
  if (line.isTask) return false;
  const segments = line.text.split(LEDGER.separator);
  return segments.length >= 3 && LEDGER.kinds.includes(segments[1].trim());
}
async function collectLedger(view, resolvePerson) {
  const entries = [];
  for (const { file, day } of diaryNotes(view)) {
    for (const line of await view.index.listLinesOf(file)) {
      if (!isLedgerLine(line)) continue;
      const segments = line.text.split(LEDGER.separator).map((part) => part.trim());
      const owner = firstResolved(view, segments[0], file.path);
      if (!owner || !resolvePerson(owner)) continue;
      const status = segments[3] || LEDGER.defaultStatus;
      entries.push({
        diary: file,
        day,
        person: owner,
        kind: segments[1],
        item: segments[2],
        status,
        legal: LEDGER.statuses.includes(status)
      });
    }
  }
  return entries.sort((left, right) => right.day.localeCompare(left.day));
}
function firstResolved(view, segment, sourcePath) {
  for (const link of extractLinks(segment)) {
    const resolved = view.index.resolve(link, sourcePath);
    if (resolved) return resolved;
  }
  return null;
}

// src/modules/contacts/circleViews.ts
var UNGROUPED = "\u672A\u5F52\u5708";
var roster = {
  name: "\u4EBA\u8109\u540D\u5F55",
  render: async (view) => {
    const people = livePeople(view);
    if (!people.length) {
      renderEmpty(view.el, "\u8FD8\u6CA1\u6709\u6863\u6848\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u65B0\u5EFA\u4EBA\u8109\u300D\u5EFA\u7B2C\u4E00\u4E2A\u3002");
      return;
    }
    const circles = /* @__PURE__ */ new Map();
    let stale = 0;
    for (const person of people) {
      const row = rosterRowOf(view, person);
      if (row.overdue) stale += 1;
      const circle = circleOf(view, person);
      const bucket = circles.get(circle);
      if (bucket) bucket.push(row);
      else circles.set(circle, [row]);
    }
    renderSummary(
      view.el,
      stale ? `\u5171 ${people.length} \u4EBA\uFF0C\u5176\u4E2D **${stale} \u4EBA**\u5DF2\u8D85\u51FA\u8BE5\u5C42\u7684\u8054\u7CFB\u8282\u594F\u3002` : `\u5171 ${people.length} \u4EBA\uFF0C\u90FD\u5728\u8054\u7CFB\u534A\u5F84\u5185\u3002`
    );
    const ordered = [...circles.entries()].sort((left, right) => {
      if (left[0] === UNGROUPED) return 1;
      if (right[0] === UNGROUPED) return -1;
      return right[1].length - left[1].length;
    });
    for (const [circle, rows] of ordered) {
      renderHeading(view.el, 3, `${circle}\uFF08${rows.length}\uFF09`);
      if (circle === UNGROUPED) {
        renderNote(view.el, `\u8FD9\u4E9B\u6863\u6848\u7684 \`${FIELDS.up}\` \u6CA1\u6307\u5411\u4EFB\u4F55\u5708\u5B50 MOC\uFF0C\u8865\u4E0A\u5C31\u4F1A\u5F52\u5165\u5BF9\u5E94\u7684\u7EC4\u3002`);
      }
      rows.sort((left, right) => left.tierRank - right.tierRank || staleness(right) - staleness(left));
      renderTable(
        view.ctx.app,
        view.el,
        view.sourcePath,
        ["\u8C01", "\u4E00\u53E5\u8BDD", "\u5C42", "\u65B9\u5411", "\u4ED6\u80FD\u7ED9\u6211\u7684", "\u6700\u8FD1\u8054\u7CFB"],
        rows.map((row) => [
          noteLink(row.file),
          toText(view.index.fieldOf(row.file, FIELDS.description)),
          row.tier || "\u2014",
          toText(view.index.fieldOf(row.file, FIELDS.direction)) || "\u2014",
          toStringList(view.index.fieldOf(row.file, FIELDS.get)).join("\u3001") || "\u2014",
          lastContactText(row)
        ]),
        1
      );
    }
  }
};
function rosterRowOf(view, person) {
  var _a;
  const tier = toText(view.index.fieldOf(person, FIELDS.tier));
  const last = lastContactDayOf(view, person);
  const days = last ? daysBetween(last, today()) : null;
  const limit = (_a = TIER_LIMITS[tier]) != null ? _a : TIER_FALLBACK_LIMIT;
  return {
    file: person,
    tier,
    // 层没写或写了未知值的排在所有已知层之后，但不算错——只是还没定节奏
    tierRank: CONTACT_TIERS.indexOf(tier) < 0 ? CONTACT_TIERS.length : CONTACT_TIERS.indexOf(tier),
    days,
    overdue: days === null || days > limit
  };
}
function staleness(row) {
  var _a;
  return (_a = row.days) != null ? _a : Number.MAX_SAFE_INTEGER;
}
function lastContactText(row) {
  if (row.days === null) return "\u26A0\uFE0F \u4ECE\u672A";
  const text3 = row.days === 0 ? "\u4ECA\u5929" : `${row.days} \u5929\u524D`;
  return row.overdue ? `\u26A0\uFE0F ${text3}` : text3;
}
function circleOf(view, person) {
  var _a, _b, _c, _d;
  for (const link of extractLinks(String((_a = view.index.fieldOf(person, FIELDS.up)) != null ? _a : ""))) {
    return (_d = (_c = (_b = view.index.resolve(link, person.path)) == null ? void 0 : _b.basename) != null ? _c : link.split("/").pop()) != null ? _d : UNGROUPED;
  }
  return UNGROUPED;
}
var giftList = {
  name: "\u6295\u5582\u540D\u5355",
  render: async (view) => {
    const rows = [];
    for (const person of livePeople(view)) {
      if (!toBoolean(view.index.fieldOf(person, FIELDS.gift))) continue;
      const address = toText(view.index.fieldOf(person, FIELDS.address));
      rows.push([
        noteLink(person),
        toText(view.index.fieldOf(person, FIELDS.description)),
        address || "\u26A0\uFE0F \u8FD8\u6CA1\u586B\u5BC4\u4EF6\u4FE1\u606F"
      ]);
    }
    if (!rows.length) {
      renderEmpty(
        view.el,
        `\u540D\u5355\u662F\u7A7A\u7684\u3002\u6253\u5F00\u67D0\u4EBA\u7684\u6863\u6848\uFF0C\u5C5E\u6027\u91CC\u628A \`${FIELDS.gift}\` \u5199\u6210 true\u3001\`${FIELDS.address}\` \u586B\u4E0A\u6574\u4E32\u5BC4\u4EF6\u4FE1\u606F\uFF0C\u4ED6\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002`
      );
      return;
    }
    renderTable(view.ctx.app, view.el, view.sourcePath, ["\u8C01", "\u4E00\u53E5\u8BDD", "\u5BC4\u4EF6\u4FE1\u606F"], rows, 2);
  }
};
var birthdays = {
  name: "\u672C\u6708\u751F\u65E5",
  render: async (view) => {
    const now = today();
    const month = now.slice(5, 7);
    const upcoming = [];
    for (const person of livePeople(view)) {
      const birthday = dayText(view.index.fieldOf(person, FIELDS.birthday));
      if (!birthday || birthday.slice(5, 7) !== month) continue;
      const thisYear = `${now.slice(0, 4)}-${birthday.slice(5)}`;
      upcoming.push({ file: person, date: birthday.slice(5), days: daysBetween(now, thisYear) });
    }
    if (!upcoming.length) {
      renderEmpty(view.el, `\u8FD9\u4E2A\u6708\u6CA1\u6709\u4EBA\u8FC7\u751F\u65E5\u3002\u5728\u6863\u6848\u5C5E\u6027\u91CC\u586B \`${FIELDS.birthday}\`\uFF0C\u5230\u6708\u4EFD\u4E86\u4F1A\u81EA\u52A8\u51FA\u73B0\u3002`);
      return;
    }
    upcoming.sort((left, right) => left.date.localeCompare(right.date));
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u8C01", "\u751F\u65E5", "\u8FD8\u6709\u51E0\u5929"],
      upcoming.map((entry) => [noteLink(entry.file), entry.date, countdownOf(entry.days)])
    );
  }
};
function countdownOf(days) {
  if (days === null) return "\u2014";
  if (days === 0) return "\u{1F382} \u5C31\u662F\u4ECA\u5929";
  return days > 0 ? `\u8FD8\u6709 ${days} \u5929` : `\u5DF2\u8FC7 ${-days} \u5929`;
}
var balance = {
  name: "\u4EBA\u60C5\u4F59\u989D",
  render: async (view) => {
    var _a;
    const archive = archiveFolderOf(view.ctx);
    const entries = await collectLedger(view, (owner) => isLivePath(archive, owner.path));
    const balances = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (entry.status === LEDGER.defaultStatus) continue;
      const current = (_a = balances.get(entry.person.path)) != null ? _a : {
        person: entry.person,
        owed: 0,
        owing: 0,
        last: entry.day
      };
      if (entry.status === "\u6211\u6B20") current.owing += 1;
      else if (entry.status === "\u4ED6\u6B20") current.owed += 1;
      if (entry.day > current.last) current.last = entry.day;
      balances.set(entry.person.path, current);
    }
    if (!balances.size) {
      renderEmpty(view.el, "\u6CA1\u6709\u672A\u4E24\u6E05\u7684\u4EBA\u60C5\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u8BB0\u4EBA\u60C5\u300D\u8BB0\u4E0B\u4E00\u7B14\u3002");
      return;
    }
    const rows = [...balances.values()].sort(
      (left, right) => right.owing + right.owed - (left.owing + left.owed)
    );
    renderSummary(view.el, `**${rows.length}** \u4E2A\u4EBA\u8FD8\u6709\u6CA1\u4E24\u6E05\u7684\u8D26\u3002`);
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u8C01", "\u6211\u6B20\u4ED6", "\u4ED6\u6B20\u6211", "\u6700\u8FD1\u4E00\u7B14"],
      rows.map((row) => [
        noteLink(row.person),
        row.owing || "\u2014",
        row.owed || "\u2014",
        row.last
      ])
    );
  }
};
function livePeople(view) {
  const archive = archiveFolderOf(view.ctx);
  return view.index.notesOfType(NOTE_TYPES.person).filter((file) => isLivePath(archive, file.path));
}
var circleViews = [roster, giftList, birthdays, balance];

// src/modules/contacts/clientViews.ts
var INLINE_FIELD = /\[([^\]:]+)::([^\]]*)\]/g;
var pending = {
  name: "\u5F85\u4EA4\u4ED8",
  render: async (view) => {
    const payments = (await allPayments(view)).filter((payment) => !payment.delivered);
    if (!payments.length) {
      renderEmpty(view.el, "\u6CA1\u6709\u5F85\u4EA4\u4ED8\u7684\u5355\u5B50\u3002\u6536\u4E86\u94B1\u5C31\u7528\u300C\u589E\u52A0\u4ED8\u8D39\u300D\u8BB0\u4E00\u7B14\uFF0C\u4EA4\u4ED8\u5B8C\u70B9\u6389\u90A3\u4E2A\u52FE\u3002");
      return;
    }
    const now = today();
    payments.sort((left, right) => left.date.localeCompare(right.date));
    renderSummary(view.el, `**${payments.length}** \u7B14\u8FD8\u6CA1\u4EA4\u4ED8\uFF0C\u5171 **${sum(payments)}**\u3002`);
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u8C01", "\u4EA7\u54C1", "\u91D1\u989D", "\u4ED8\u6B3E\u65E5", "\u7B49\u4E86"],
      payments.map((payment) => [
        noteLink(payment.note),
        payment.product || "\u2014",
        payment.amount,
        payment.date || "\u2014",
        formatDays(daysBetween(payment.date, now))
      ])
    );
  }
};
var sales = {
  name: "\u9500\u552E\u5206\u6790",
  render: async (view) => {
    var _a, _b;
    const payments = await allPayments(view);
    if (!payments.length) {
      renderEmpty(view.el, "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6D41\u6C34\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u589E\u52A0\u4ED8\u8D39\u300D\u8BB0\u7B2C\u4E00\u7B14\u3002");
      return;
    }
    renderSummary(view.el, `\u7D2F\u8BA1 **${payments.length}** \u7B14\uFF0C\u5171 **${sum(payments)}**\u3002`);
    const byChannel = /* @__PURE__ */ new Map();
    for (const payment of payments) {
      const channel = toText(view.index.fieldOf(payment.note, FIELDS.source)) || "\u672A\u6807\u6E20\u9053";
      const bucket = (_a = byChannel.get(channel)) != null ? _a : { people: /* @__PURE__ */ new Set(), count: 0, total: 0 };
      bucket.people.add(payment.note.path);
      bucket.count += 1;
      bucket.total += payment.amount;
      byChannel.set(channel, bucket);
    }
    renderHeading(view.el, 4, "\u6309\u6E20\u9053");
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u6E20\u9053", "\u4EBA\u6570", "\u7B14\u6570", "\u91D1\u989D", "\u5BA2\u5355\u4EF7"],
      [...byChannel.entries()].sort((left, right) => right[1].total - left[1].total).map(([channel, bucket]) => [
        channel,
        bucket.people.size,
        bucket.count,
        bucket.total,
        Math.round(bucket.total / bucket.people.size)
      ])
    );
    const byProduct = /* @__PURE__ */ new Map();
    for (const payment of payments) {
      const product = payment.product || "\u672A\u6807\u4EA7\u54C1";
      const bucket = (_b = byProduct.get(product)) != null ? _b : { count: 0, total: 0 };
      bucket.count += 1;
      bucket.total += payment.amount;
      byProduct.set(product, bucket);
    }
    renderHeading(view.el, 4, "\u6309\u4EA7\u54C1");
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u4EA7\u54C1", "\u7B14\u6570", "\u91D1\u989D"],
      [...byProduct.entries()].sort((left, right) => right[1].total - left[1].total).map(([product, bucket]) => [product, bucket.count, bucket.total])
    );
  }
};
var paidUsers = {
  name: "\u4ED8\u8D39\u7528\u6237",
  render: async (view) => {
    var _a;
    const payments = await allPayments(view);
    if (!payments.length) {
      renderEmpty(view.el, "\u8FD8\u6CA1\u6709\u4ED8\u8D39\u7528\u6237\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u65B0\u5EFA\u5BA2\u6237\u300D\uFF0C\u518D\u7528\u300C\u589E\u52A0\u4ED8\u8D39\u300D\u8BB0\u4E00\u7B14\u3002");
      return;
    }
    const byClient = /* @__PURE__ */ new Map();
    for (const payment of payments) {
      const bucket = (_a = byClient.get(payment.note.path)) != null ? _a : {
        note: payment.note,
        count: 0,
        total: 0,
        last: ""
      };
      bucket.count += 1;
      bucket.total += payment.amount;
      if (payment.date > bucket.last) bucket.last = payment.date;
      byClient.set(payment.note.path, bucket);
    }
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u8C01", "\u6E20\u9053", "\u7B14\u6570", "\u7D2F\u8BA1", "\u6700\u8FD1\u4E00\u7B14"],
      [...byClient.values()].sort((left, right) => right.total - left.total).map((bucket) => [
        noteLink(bucket.note),
        toText(view.index.fieldOf(bucket.note, FIELDS.source)) || "\u2014",
        // 复购是最值得一眼看见的事实，用 ★ 标出来
        bucket.count > 1 ? `${bucket.count} \u2605` : bucket.count,
        bucket.total,
        bucket.last || "\u2014"
      ])
    );
  }
};
var openCases = {
  name: "\u672A\u7ED3\u6848",
  render: async (view) => {
    var _a;
    const now = today();
    const rows = [];
    for (const { project, client } of clientProjects(view)) {
      if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() !== "active") continue;
      const born = (_a = dayText(view.index.fieldOf(project, FIELDS.created))) != null ? _a : dayOfMillis(project.stat.ctime);
      rows.push([
        noteLink(project),
        client ? noteLink(client) : "\u2014",
        born,
        formatDays(daysBetween(born, now))
      ]);
    }
    if (!rows.length) {
      renderEmpty(view.el, "\u6CA1\u6709\u672A\u7ED3\u7684\u6848\u5B50\u3002\u624B\u4E0A\u7684\u6D3B\u513F\u90FD\u4EA4\u4ED8\u5B8C\u4E86\u3002");
      return;
    }
    renderSummary(view.el, `\u8FD8\u6B20 **${rows.length}** \u4E2A\u4EA4\u4ED8\u3002`);
    renderTable(view.ctx.app, view.el, view.sourcePath, ["\u9879\u76EE", "\u5BA2\u6237", "\u5F00\u59CB", "\u5DF2\u8FDB\u884C"], rows);
  }
};
var caseLibrary = {
  name: "\u6848\u4F8B\u5E93",
  render: async (view) => {
    var _a, _b;
    const rows = [];
    const topics = /* @__PURE__ */ new Map();
    for (const { project, client } of clientProjects(view)) {
      if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() !== "done") continue;
      const born = (_a = dayText(view.index.fieldOf(project, FIELDS.created))) != null ? _a : dayOfMillis(project.stat.ctime);
      const closed = dayText(view.index.fieldOf(project, FIELDS.archived));
      for (const tag of toStringList(view.index.fieldOf(project, FIELDS.tags))) {
        topics.set(tag, ((_b = topics.get(tag)) != null ? _b : 0) + 1);
      }
      rows.push([
        noteLink(project),
        client ? noteLink(client) : "\u2014",
        closed != null ? closed : "\u2014",
        formatDays(daysBetween(born, closed))
      ]);
    }
    if (!rows.length) {
      renderEmpty(view.el, "\u6848\u4F8B\u5E93\u8FD8\u662F\u7A7A\u7684\u3002\u7ED3\u6848\u7684\u5BA2\u6237\u9879\u76EE\u4F1A\u81EA\u52A8\u6536\u8FDB\u6765\u3002");
      return;
    }
    renderTable(view.ctx.app, view.el, view.sourcePath, ["\u9879\u76EE", "\u5BA2\u6237", "\u7ED3\u6848", "\u5386\u65F6"], rows);
    const ranked = [...topics.entries()].sort((left, right) => right[1] - left[1]);
    if (ranked.length) {
      renderNote(
        view.el,
        `\u4E3B\u9898\u5206\u5E03\uFF1A${ranked.map(([tag, count]) => `${tag} ${count}`).join(" \xB7 ")}\u3000\uFF08\u5806\u5230\u4E09\u4E94\u4E2A\u5C31\u8BE5\u505A\u6210\u8BFE\uFF09`
      );
    }
  }
};
var serviceClients = {
  name: "\u670D\u52A1\u5BA2\u6237",
  render: async (view) => {
    var _a;
    const archive = archiveFolderOf(view.ctx);
    const stats = /* @__PURE__ */ new Map();
    for (const { project, client } of clientProjects(view)) {
      if (!client || !isLivePath(archive, client.path)) continue;
      const bucket = (_a = stats.get(client.path)) != null ? _a : { note: client, open: 0, total: 0 };
      bucket.total += 1;
      if (toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase() === "active") {
        bucket.open += 1;
      }
      stats.set(client.path, bucket);
    }
    if (!stats.size) {
      renderEmpty(
        view.el,
        `\u8FD8\u6CA1\u6709\u670D\u52A1\u5BA2\u6237\u3002\u5728\u9879\u76EE MOC \u7684\u5C5E\u6027\u91CC\u5199 \`${FIELDS.client}: "[[\u67D0\u4EBA]]"\`\uFF0C\u4ED6\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002`
      );
      return;
    }
    const now = today();
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u8C01", "\u672A\u7ED3\u6848", "\u5408\u4F5C\u8FC7", "\u6700\u8FD1\u8054\u7CFB"],
      [...stats.values()].sort((left, right) => right.open - left.open || right.total - left.total).map((bucket) => {
        const last = lastContactDayOf(view, bucket.note);
        const days = last ? daysBetween(last, now) : null;
        return [
          noteLink(bucket.note),
          bucket.open || "\u2014",
          bucket.total,
          days === null ? "\u26A0\uFE0F \u4ECE\u672A" : days === 0 ? "\u4ECA\u5929" : `${days} \u5929\u524D`
        ];
      })
    );
  }
};
var clientPayments = {
  name: "\u4ED8\u8D39\u4E0E\u4EA4\u4ED8",
  render: async (view) => {
    if (!view.host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u5BA2\u6237\u6863\u6848\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const payments = await paymentsOf(view, view.host);
    if (!payments.length) {
      renderEmpty(view.el, "\u8FD8\u6CA1\u6709\u4ED8\u8D39\u8BB0\u5F55\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u589E\u52A0\u4ED8\u8D39\u300D\u8BB0\u4E00\u7B14\u3002");
      return;
    }
    renderSummary(
      view.el,
      `**${payments.length}** \u7B14\uFF0C\u7D2F\u8BA1 **${sum(payments)}**\uFF1B\u672A\u4EA4\u4ED8 **${payments.filter((payment) => !payment.delivered).length}** \u7B14\u3002`
    );
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u4EA7\u54C1", "\u91D1\u989D", "\u65E5\u671F", "\u4EA4\u4ED8"],
      payments.sort((left, right) => right.date.localeCompare(left.date)).map((payment) => [
        payment.product || "\u2014",
        payment.amount,
        payment.date || "\u2014",
        payment.delivered ? "\u2705 \u5DF2\u4EA4\u4ED8" : "\u23F3 \u5F85\u4EA4\u4ED8"
      ])
    );
  }
};
var projectPayments = {
  name: "\u9879\u76EE\u6536\u6B3E",
  render: async (view) => {
    if (!view.host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u9879\u76EE MOC \u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const payments = await paymentsOf(view, view.host);
    if (!payments.length) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u6536\u6B3E\u8BB0\u5F55\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u8BB0\u6536\u6B3E\u300D\u8BB0\u4E00\u7B14\u3002");
      return;
    }
    const received = payments.filter((payment) => payment.delivered);
    renderSummary(
      view.el,
      `\u5408\u8BA1 **${sum(payments)}**\uFF0C\u5DF2\u5230\u8D26 **${sum(received)}**\uFF0C\u672A\u5230\u8D26 **${sum(payments) - sum(received)}**\u3002`
    );
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u91D1\u989D", "\u65E5\u671F", "\u5230\u8D26"],
      payments.sort((left, right) => right.date.localeCompare(left.date)).map((payment) => [
        payment.amount,
        payment.date || "\u2014",
        payment.delivered ? "\u2705 \u5DF2\u5230\u8D26" : "\u23F3 \u672A\u5230\u8D26"
      ])
    );
  }
};
async function allPayments(view) {
  const archive = archiveFolderOf(view.ctx);
  const collected = [];
  for (const client of view.index.notesOfType(NOTE_TYPES.client)) {
    if (!isLivePath(archive, client.path)) continue;
    collected.push(...await paymentsOf(view, client));
  }
  return collected;
}
async function paymentsOf(view, note) {
  var _a, _b;
  const payments = [];
  for (const line of await view.index.listLinesOf(note)) {
    if (!line.isTask) continue;
    const fields = inlineFieldsOf(line.text);
    const amount = Number(fields[PAYMENT_FIELDS.amount]);
    if (!Number.isFinite(amount)) continue;
    payments.push({
      note,
      product: (_a = fields[PAYMENT_FIELDS.product]) != null ? _a : "",
      amount,
      date: (_b = fields[PAYMENT_FIELDS.date]) != null ? _b : "",
      delivered: line.checked
    });
  }
  return payments;
}
function inlineFieldsOf(text3) {
  const fields = {};
  INLINE_FIELD.lastIndex = 0;
  let match = INLINE_FIELD.exec(text3);
  while (match) {
    fields[match[1].trim()] = match[2].trim();
    match = INLINE_FIELD.exec(text3);
  }
  return fields;
}
function clientProjects(view) {
  var _a;
  const found = [];
  for (const project of view.index.notesOfType(NOTE_TYPES.project)) {
    const links = extractLinks(String((_a = view.index.fieldOf(project, FIELDS.client)) != null ? _a : ""));
    if (!links.length) continue;
    found.push({ project, client: view.index.resolve(links[0], project.path) });
  }
  return found;
}
function sum(payments) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}
function formatDays(days) {
  return days === null ? "\u2014" : `${days} \u5929`;
}
var clientViews = [
  pending,
  sales,
  paidUsers,
  openCases,
  caseLibrary,
  serviceClients,
  clientPayments,
  projectPayments
];

// src/modules/contacts/client.ts
var import_obsidian25 = require("obsidian");

// src/core/markdown.ts
var VIEW_FENCE = "```" + VIEW_BLOCK_LANG;
var ANY_HEADING = /^#{1,6}\s/;
var PLACEHOLDER = "-";
var TASK_BOX = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([^\]])(\]\s)/;
function toggleTaskLine(content, line, expectedChecked) {
  const { lines, lineEnding } = splitTextLines(content);
  const current = lines[line];
  if (typeof current !== "string") return null;
  const match = TASK_BOX.exec(current);
  if (!match) return null;
  const checked = match[2].trim().toLowerCase() === "x";
  if (checked !== expectedChecked) return null;
  lines[line] = current.replace(TASK_BOX, `$1${checked ? " " : "x"}$3`);
  return joinTextLines(lines, lineEnding);
}
function insertIntoSection(content, heading, line) {
  const { lines, lineEnding } = splitTextLines(content);
  const headingIndex = lines.findIndex((text3) => text3.trim() === heading);
  if (headingIndex < 0) {
    return [content.replace(/\s*$/, ""), "", heading, "", line, ""].join(lineEnding);
  }
  let sectionEnd = lines.length;
  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    if (ANY_HEADING.test(lines[cursor])) {
      sectionEnd = cursor;
      break;
    }
  }
  let insertAt = sectionEnd;
  for (let cursor = headingIndex + 1; cursor < sectionEnd; cursor += 1) {
    if (lines[cursor].replace(/^\s+/, "").indexOf(VIEW_FENCE) === 0) {
      insertAt = cursor;
      break;
    }
  }
  while (insertAt > headingIndex + 1 && lines[insertAt - 1].trim() === "") insertAt -= 1;
  if (insertAt > headingIndex + 1 && lines[insertAt - 1].trim() === PLACEHOLDER) {
    lines[insertAt - 1] = line;
    return joinTextLines(lines, lineEnding);
  }
  lines.splice(insertAt, 0, line);
  return joinTextLines(lines, lineEnding);
}

// src/modules/review/templates.ts
var FENCE2 = "```";
function viewBlock(name, params) {
  const lines = [name];
  for (const [key, value] of Object.entries(params != null ? params : {})) {
    lines.push(`${key}: ${value}`);
  }
  return `${FENCE2}${VIEW_BLOCK_LANG}
${lines.join("\n")}
${FENCE2}`;
}
function periodNoteContent(period, title, dateTimeFormat) {
  var _a;
  const { stamp, uid } = nowStampAndUid(dateTimeFormat);
  const parent = period.parent ? PERIODS[period.parent] : null;
  const neighbours = periodNeighbours(period, title, parent);
  const frontmatter = [
    "---",
    `${FIELDS.created}: ${stamp}`,
    `${FIELDS.updated}:`,
    `${FIELDS.uid}: ${uid}`,
    `${FIELDS.type}: ${period.type}`,
    // 日记刻意没有 period_start：文件名就是日期，多一个字段等于给同一件事两个事实源
    ...period.key === "daily" ? [] : [`${FIELDS.periodStart}: ${(_a = periodStartOf(period, title)) != null ? _a : ""}`],
    `${FIELDS.theme}:`,
    "---"
  ].join("\n");
  const navigation = neighbours ? `<< [[${neighbours.prev}]] | [[${neighbours.next}]] >>${neighbours.parent ? `\u3000\u2191 [[${neighbours.parent}|${period.parentAlias}]]` : ""}` : "";
  return [frontmatter, "", `# ${title}`, "", navigation, "", bodyOf(period.key), ""].join("\n");
}
function bodyOf(key) {
  if (key === "daily") {
    return [
      DIARY_LOG_HEADING,
      "",
      "- ",
      "",
      "## \u4ECA\u65E5\u4EA7\u51FA\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u4ECA\u65E5\u4EA7\u51FA")
    ].join("\n");
  }
  if (key === "weekly") {
    return [
      "## \u672C\u5468\u590D\u76D8",
      "",
      "",
      "## \u672C\u5468\u6BCF\u65E5\u4E3B\u9898\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u4E3B\u9898\u94FE", { \u8303\u56F4: "\u5468" }),
      "",
      "## \u672C\u5468\u9879\u76EE\u52A8\u6001\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u9879\u76EE\u52A8\u6001", { \u8303\u56F4: "\u5468" })
    ].join("\n");
  }
  if (key === "monthly") {
    return [
      "## \u672C\u6708\u590D\u76D8",
      "",
      "",
      "## \u672C\u6708\u5B8C\u6210\u7684\u9879\u76EE\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u5B8C\u6210\u7684\u9879\u76EE", { \u8303\u56F4: "\u6708" }),
      "",
      "## \u672C\u6708\u6BCF\u5468\u4E3B\u9898\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u4E3B\u9898\u94FE", { \u8303\u56F4: "\u6708" })
    ].join("\n");
  }
  if (key === "quarterly") {
    return [
      "## \u5B63\u5EA6\u590D\u76D8",
      "",
      "",
      "## \u672C\u5B63\u6BCF\u6708\u4E3B\u9898\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u4E3B\u9898\u94FE", { \u8303\u56F4: "\u5B63" }),
      "",
      "## \u672C\u5B63\u5B8C\u6210\u7684\u9879\u76EE\uFF08\u81EA\u52A8\uFF09",
      "",
      viewBlock("\u5B8C\u6210\u7684\u9879\u76EE", { \u8303\u56F4: "\u5B63" })
    ].join("\n");
  }
  return [
    "## \u5E74\u5EA6\u590D\u76D8",
    "",
    "",
    "## \u5E74\u5EA6\u9879\u76EE\u5168\u666F\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u5E74\u5EA6\u5168\u666F"),
    "",
    "## \u5341\u4E8C\u4E2A\u6708\u7684\u4E3B\u9898\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u4E3B\u9898\u94FE", { \u8303\u56F4: "\u5E74" })
  ].join("\n");
}

// src/modules/contacts/templates.ts
var CONTACT_MOC_LINK = `[[${basenameOf(CONTACT_MOC)}]]`;
var CLIENT_MOC_LINK = `[[${basenameOf(CLIENT_MOC)}]]`;
function basenameOf(path) {
  var _a;
  return (_a = path.replace(/\.md$/, "").split("/").pop()) != null ? _a : path;
}
function personNoteContent(values) {
  const frontmatter = [
    "---",
    `${FIELDS.aliases}:`,
    `${FIELDS.description}:`,
    `${FIELDS.created}: ${values.created}`,
    `${FIELDS.updated}:`,
    `${FIELDS.tags}:`,
    // UID 不加引号：属性面板把它登记为数字类型，加引号就变成一个长得像数字的字符串
    `${FIELDS.uid}:${values.uid === null ? "" : ` ${values.uid}`}`,
    `${FIELDS.type}:${values.type ? ` ${values.type}` : ""}`,
    // up 写成 YAML 列表：它在属性面板里是列表类型，一个人可以同时属于多个圈子
    values.up ? `${FIELDS.up}:
  - "${values.up}"` : `${FIELDS.up}:`,
    `${FIELDS.tier}:${values.tier ? ` ${values.tier}` : ""}`,
    `${FIELDS.direction}:${values.direction ? ` ${values.direction}` : ""}`,
    `${FIELDS.gift}:`,
    `${FIELDS.address}:`,
    `${FIELDS.get}:`,
    `${FIELDS.birthday}:`,
    "---"
  ].join("\n");
  return [
    frontmatter,
    "",
    "## \u8054\u7CFB\u65B9\u5F0F",
    "",
    "## \u559C\u597D\u4E0E\u79C1\u4E8B",
    "",
    "## \u76F8\u5173\u9879\u76EE\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u76F8\u5173\u9879\u76EE"),
    "",
    "## \u4EBA\u60C5\u8D26\u672C\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u4EBA\u60C5\u8D26\u672C"),
    "",
    "## \u5173\u952E\u4E8B\u4EF6\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u5173\u952E\u4E8B\u4EF6"),
    "",
    "## \u5F85\u529E\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u5F85\u529E"),
    ""
  ].join("\n");
}
function personTemplateFile() {
  return personNoteContent({ created: "", uid: null, type: "", up: "", tier: "", direction: "" });
}
function clientNoteContent(values) {
  const frontmatter = [
    "---",
    `${FIELDS.aliases}:`,
    `${FIELDS.description}:`,
    `${FIELDS.created}: ${values.created}`,
    `${FIELDS.updated}:`,
    `${FIELDS.tags}:`,
    `${FIELDS.uid}:${values.uid === null ? "" : ` ${values.uid}`}`,
    `${FIELDS.type}:${values.type ? ` ${values.type}` : ""}`,
    `${FIELDS.source}:${values.source ? ` ${values.source}` : ""}`,
    `${FIELDS.contact}:${values.contact ? ` ${values.contact}` : ""}`,
    `${FIELDS.homepage}:`,
    "---"
  ].join("\n");
  return [
    frontmatter,
    "",
    "## \u4ED8\u8D39\u4E0E\u4EA4\u4ED8",
    "",
    viewBlock("\u4ED8\u8D39\u4E0E\u4EA4\u4ED8"),
    "",
    "## \u5173\u952E\u4E8B\u4EF6\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u5173\u952E\u4E8B\u4EF6"),
    "",
    "## \u5F85\u529E\uFF08\u81EA\u52A8\uFF09",
    "",
    viewBlock("\u5F85\u529E"),
    ""
  ].join("\n");
}
function clientTemplateFile() {
  return clientNoteContent({ created: "", uid: null, type: "", source: "", contact: "" });
}
function areaFrontmatter(description, created, uid) {
  return [
    "---",
    `${FIELDS.aliases}:`,
    `${FIELDS.description}: ${description}`,
    `${FIELDS.created}: ${created}`,
    `${FIELDS.updated}:`,
    `${FIELDS.tags}:`,
    `${FIELDS.uid}: ${uid}`,
    `${FIELDS.type}: ${NOTE_TYPES.area}`,
    `${FIELDS.status}:`,
    "---"
  ].join("\n");
}
function contactMocContent(created, uid) {
  return [
    areaFrontmatter("\u4EBA\u8109\u9886\u57DF\u603B\u63A7\u53F0\uFF1A\u6309\u5708\u5B50\u5206\u7EC4\u7684\u540D\u5F55\u3001\u6295\u5582\u540D\u5355\u3001\u672C\u6708\u751F\u65E5\u3001\u4EBA\u60C5\u4F59\u989D", created, uid),
    "",
    `> \u8FD9\u91CC\u662F\u5168\u90E8\u4EBA\u7684\u7ECF\u8425\u89C6\u89D2\u3002\u5BA2\u6237\u89C6\u89D2\u53E6\u89C1 ${CLIENT_MOC_LINK}\uFF08\u8FD8\u6CA1\u6709\u7684\u8BDD\uFF0C\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u521D\u59CB\u5316\u5BA2\u6237\u6A21\u5757\u300D\uFF09\u3002`,
    "> \u4E00\u4E2A\u4EBA\u53EF\u4EE5\u540C\u65F6\u51FA\u73B0\u5728\u4E24\u5F20\u5730\u56FE\u4E0A\uFF1A\u4ED6\u786E\u5B9E\u53EF\u4EE5\u65E2\u662F\u6211\u7684\u5BA2\u6237\uFF0C\u53C8\u662F\u6211\u7684\u670B\u53CB\u3002",
    "",
    "## \u{1F4C7} \u540D\u5F55",
    "",
    viewBlock("\u4EBA\u8109\u540D\u5F55"),
    "",
    "## \u{1F381} \u6295\u5582\u540D\u5355",
    "",
    viewBlock("\u6295\u5582\u540D\u5355"),
    "",
    "## \u{1F382} \u672C\u6708\u751F\u65E5",
    "",
    viewBlock("\u672C\u6708\u751F\u65E5"),
    "",
    "## \u2696\uFE0F \u4EBA\u60C5\u4F59\u989D\uFF08\u672A\u4E24\u6E05\uFF09",
    "",
    viewBlock("\u4EBA\u60C5\u4F59\u989D"),
    "",
    "## \u{1F4D6} \u4F7F\u7528\u8BF4\u660E",
    "",
    "### \u5361\u7247\u4E0A\u6CA1\u6709\u5206\u7C7B\uFF0C\u53EA\u6709\u5F52\u5C5E",
    "",
    "\u4EBA\u7269\u6863\u6848\u662F\u5361\u7247\u7B14\u8BB0\uFF0C**\u5361\u7247\u4E0D\u5E26\u5206\u7C7B**\u3002\u6240\u4EE5\u8FD9\u91CC\u6CA1\u6709\u300C\u5BA2\u6237/\u751F\u6D3B/\u5DE5\u4F5C\u300D\u8FD9\u79CD\u8EAB\u4EFD\u5B57\u6BB5\uFF0C\u53D6\u800C\u4EE3\u4E4B\u7684\u662F\u4E24\u6761\u673A\u5236\uFF1A",
    "",
    "| \u8981\u56DE\u7B54\u7684 | \u9760\u4EC0\u4E48 |",
    "|---|---|",
    `| **\u4ED6\u5C5E\u4E8E\u54EA\u4E2A\u5708\u5B50** | \`${FIELDS.up}\` \u8FD9\u6761**\u5F52\u5C5E\u94FE\u63A5**\u3002\u6307\u5411\u54EA\u4E2A\u5708\u5B50 MOC\uFF0C\u540D\u5F55\u91CC\u5C31\u5F52\u5230\u54EA\u4E00\u7EC4\u3002\u60F3\u65B0\u5206\u4E00\u4E2A\u5708\u5B50\uFF08\u6BD4\u5982\u67D0\u516C\u53F8\u7684\u540C\u4E8B\uFF09\uFF0C\u5EFA\u4E00\u4E2A\u5708\u5B50 MOC\uFF0C\u628A\u90A3\u6279\u4EBA\u7684 \`${FIELDS.up}\` \u6307\u8FC7\u53BB\uFF0C\u540D\u5F55\u81EA\u52A8\u591A\u4E00\u7EC4 |`,
    `| **\u4ED6\u662F\u4E0D\u662F\u5BA2\u6237** | **\u4E0D\u6807\u6CE8\uFF0C\u4ECE\u4E8B\u5B9E\u63A8\u65AD**\uFF1A\u540D\u4E0B\u6709 \`${FIELDS.client}\` \u6307\u5411\u4ED6\u7684\u9879\u76EE\uFF0C\u4ED6\u5C31\u662F\u5BA2\u6237\u3002\u7ED9\u8C01\u5E72\u8FC7\u6D3B\u8C01\u624D\u662F\u5BA2\u6237\uFF0C\u8FD9\u6BD4\u8D34\u6807\u7B7E\u8BDA\u5B9E |`,
    "",
    "\u597D\u5904\u662F\u8EAB\u4EFD\u4E0D\u518D\u4E92\u65A5\uFF1A\u540C\u4E00\u4E2A\u4EBA\u53EF\u4EE5\u65E2\u5728\u540D\u5F55\u91CC\uFF08\u7ECF\u8425\u5173\u7CFB\uFF09\uFF0C\u53C8\u5728\u5BA2\u6237\u540D\u5F55\u91CC\uFF08\u4EA4\u4ED8\u5173\u7CFB\uFF09\uFF0C\u56E0\u4E3A\u4ED6\u672C\u6765\u5C31\u662F\u4E24\u8005\u3002",
    "",
    "### \u6863\u6848\u653E\u54EA\u90FD\u884C",
    "",
    `\u89C6\u56FE**\u9760 \`${FIELDS.type}: ${NOTE_TYPES.person}\` \u8BA4\u4EBA\uFF0C\u4E0D\u9760\u6587\u4EF6\u5939**\u3002\u4F60\u628A\u6863\u6848\u632A\u53BB\u522B\u7684\u76EE\u5F55\u3001\u6539\u6389\u76EE\u5F55\u540D\u3001\u751A\u81F3\u7528\u82F1\u6587\u76EE\u5F55\u540D\uFF0C\u5341\u51E0\u4E2A\u89C6\u56FE\u4E00\u4E2A\u90FD\u4E0D\u7528\u6539\u3002`,
    "",
    "\u552F\u4E00\u8FD8\u8BA4\u4F4D\u7F6E\u7684\u662F**\u5F52\u6863**\uFF1A\u6863\u6848\u79FB\u8FDB\u5F52\u6863\u76EE\u5F55\u5373\u9000\u51FA\u5168\u90E8\u540D\u5F55\uFF08\u8EAB\u4EFD\u6CA1\u53D8\uFF0C\u662F\u4F60\u4E0D\u518D\u7ECF\u8425\u8FD9\u6BB5\u5173\u7CFB\u4E86\uFF09\u3002\u5F52\u6863\u76EE\u5F55\u5728\u300C\u8BBE\u7F6E \u203A ziminOS \u203A \u9AD8\u7EA7\u300D\u91CC\u6539\u4E00\u6B21\uFF0C\u5168\u90E8\u89C6\u56FE\u8DDF\u7740\u8D70\u3002",
    "",
    "### \u53E6\u5916\u4E09\u6761\u8F74",
    "",
    "| \u5C5E\u6027 | \u7BA1\u4EC0\u4E48 | \u53D6\u503C |",
    "|---|---|---|",
    `| \`${FIELDS.tier}\` | **\u8054\u7CFB\u8282\u594F**\uFF1A\u591A\u4E45\u8BE5\u8BF4\u53E5\u8BDD | \u5BC6=\u6BCF\u5468 / \u8FD1=\u6BCF\u6708 / \u719F=\u6BCF\u5B63 / \u8FDC=\u6BCF\u5E74 |`,
    `| \`${FIELDS.direction}\` | **\u4F4D\u52BF**\uFF1A\u8FD9\u6BB5\u5173\u7CFB\u5F80\u54EA\u4E2A\u65B9\u5411\u4F7F\u52B2 | \u5411\u4E0A\uFF08\u8981\u7528\u5FC3\u7EF4\u62A4\uFF09/ \u5E73\u884C / \u5411\u4E0B\uFF08\u7ED9\u673A\u4F1A\uFF0C\u7ED3\u5584\u7F18\uFF09 |`,
    `| \`${FIELDS.gift}\` | **\u4E3B\u52A8\u6295\u8D44**\uFF1A\u613F\u4E0D\u613F\u610F\u6301\u7EED\u5728\u4ED6\u8EAB\u4E0A\u82B1\u94B1\u82B1\u5FC3\u601D | \u52FE\u4E0A\u5373\u8FDB\u300C\u6295\u5582\u540D\u5355\u300D |`,
    "",
    "\u4E09\u8005\u4E92\u4E0D\u8574\u542B\uFF1A\u53D1\u5C0F\u662F\u300C\u5BC6 + \u5E73\u884C\u300D\u5374\u4E0D\u5728\u6295\u5582\u540D\u5355\u4E0A\uFF08\u4ED6\u4F1A\u7B11\u4F60\u89C1\u5916\uFF09\uFF1B\u5927\u5BA2\u6237\u662F\u300C\u719F + \u5411\u4E0A\u300D\u5374\u94C1\u5B9A\u5728\u540D\u5355\u4E0A\u3002\u6240\u4EE5\u662F\u4E09\u4E2A\u5B57\u6BB5\uFF0C\u4E0D\u662F\u4E00\u4E2A\u3002",
    "",
    `\`${FIELDS.address}\` \u5B58\u6574\u4E32\u5BC4\u4EF6\u4FE1\u606F\uFF08\u6536\u4EF6\u4EBA + \u7535\u8BDD + \u5730\u5740\uFF09\uFF0C\u7167\u7740\u590D\u5236\u5C31\u80FD\u586B\u5FEB\u9012\u5355\u3002\u5B83\u4E0D\u53C2\u4E0E\u7B5B\u9009\uFF0C\u8FDB\u5C5E\u6027\u7684\u552F\u4E00\u7406\u7531\u662F\u6295\u5582\u540D\u5355\u8981\u628A\u5B83\u805A\u5408\u6210\u4E00\u5F20\u8868\u3002`,
    "",
    "### \u65E5\u5E38\u4E09\u4E2A\u52A8\u4F5C",
    "",
    "- **\u5EFA\u6863**\uFF1A\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u65B0\u5EFA\u4EBA\u8109\u300D\uFF0C\u4E09\u8FDE\u95EE\uFF08\u59D3\u540D \u2192 \u5206\u5C42 \u2192 \u65B9\u5411\uFF09\uFF0C\u5F52\u5C5E\u81EA\u52A8\u6307\u5411\u672C MOC\u3002\u6863\u6848\u5E73\u94FA\u5B58\u653E\uFF0C\u4E0D\u5EFA\u5B50\u76EE\u5F55\u3002",
    `- **\u8FDB\u6295\u5582\u540D\u5355**\uFF1A\u6253\u5F00\u6863\u6848\uFF0C\u5C5E\u6027\u91CC\u628A \`${FIELDS.gift}\` \u5199\u6210 true\u3001\u586B\u597D \`${FIELDS.address}\`\u3002\u5E26\u7279\u4EA7\u56DE\u6765\u65F6\uFF0C\u540D\u5355\u548C\u5730\u5740\u5DF2\u7ECF\u5C31\u4F4D\u3002`,
    "- **\u8BB0\u4E8B\u8BB0\u8D26**\uFF1A\u5168\u90E8\u5199\u8FDB**\u5F53\u5929\u65E5\u8BB0**\uFF0C\u9760\u4E00\u884C\u7684\u5F62\u6001\u81EA\u52A8\u5206\u6D41\u5230\u4ED6\u7684\u6863\u6848\uFF1A",
    "",
    "| \u4F60\u5199\u7684 | \u843D\u5230\u4ED6\u6863\u6848\u7684 |",
    "|---|---|",
    "| `\u548C [[\u5F20\u4E09]] \u53BB\u4E86\u65B0\u7586\uFF0C\u8C08\u5B9A\u4E00\u8D77\u6295\u4E00\u5BB6\u7F51\u5496` | \u5173\u952E\u4E8B\u4EF6 |",
    "| `- [ ] \u51FA\u7F51\u5496\u6295\u8D44\u65B9\u6848\u7ED9 [[\u5F20\u4E09]]` | \u5F85\u529E |",
    `| \`- [[\u5F20\u4E09]]${LEDGER.separator}\u53BB${LEDGER.separator}\u9001\u4E86\u534A\u65A4\u751F\u666E${LEDGER.separator}\u4E24\u6E05\` | \u4EBA\u60C5\u8D26\u672C |`,
    "",
    `\u8D26\u672C\u884C\u4E5F\u53EF\u4EE5\u7528\u547D\u4EE4\u300C\u8BB0\u4EBA\u60C5\u300D\u56DB\u6B65\u70B9\u9009\u5199\u5165\u3002\u624B\u5199\u65F6\u6CE8\u610F\uFF1A\u4EBA\u540D\u5FC5\u987B\u5E26 \`[[ ]]\`\uFF08\u5B83\u662F\u7D22\u5F15\uFF09\uFF0C\u5206\u9694\u7B26\u7528\u5168\u89D2 \`${LEDGER.separator}\`\uFF0C\u72B6\u6001\u53D6 ${LEDGER.statuses.join(" / ")}\uFF0C${LEDGER.defaultStatus}\u53EF\u6574\u6BB5\u7701\u7565\u3002`,
    "",
    "### \u540D\u5F55\u600E\u4E48\u8BFB",
    "",
    "\u5148\u770B\u5708\u5B50\uFF0C\u518D\u770B\u4EBA\u3002\u6BCF\u7EC4\u4E00\u5F20\u8868\u56DE\u7B54\u56DB\u4EF6\u4E8B\uFF1A\u8BA4\u8BC6\u8C01\u3001\u8C01\u80FD\u7ED9\u6211\u4EC0\u4E48\u3001\u8C01\u5728\u53D8\u51B7\u3001\u8C01\u8981\u91CD\u70B9\u7EF4\u62A4\u3002",
    "",
    "\u300C\u6700\u8FD1\u8054\u7CFB\u300D\u662F\u4ECE\u65E5\u8BB0\u53CD\u94FE**\u7B97\u51FA\u6765\u7684**\uFF0C\u4E0D\u7528\u624B\u586B\u2014\u2014\u4F60\u6BCF\u8BB0\u4E00\u7B14\u4EBA\u60C5\u6216\u5199\u4E00\u53E5\u65E5\u8BB0\uFF0C\u5B83\u81EA\u52A8\u5237\u65B0\u3002\u8D85\u51FA\u8BE5\u5C42\u8282\u594F\u7684\u4F1A\u6807 \u26A0\uFE0F\uFF0C\u90A3\u5C31\u662F\u8BE5\u4E3B\u52A8\u627E\u4ED6\u7684\u4FE1\u53F7\u3002\u5BF9\u5BA2\u6237\u800C\u8A00\u8FD9\u4E2A \u26A0\uFE0F \u6700\u503C\u94B1\uFF1A\u5B83\u662F\u6D41\u5931\u9884\u8B66\u3002",
    "",
    "### \u5E74\u68C0",
    "",
    `\u6BCF\u5E74\u8FC7\u4E00\u904D\u540D\u5F55\uFF1A\`${FIELDS.up}\` \u6362\u5708\uFF08\u540C\u4E8B\u53D8\u8DEF\u4EBA\u5C31\u79FB\u51FA\u90A3\u4E2A\u5708\u5B50\uFF09\u3001\`${FIELDS.tier}\` \u5347\u964D\u7EA7\u3001\`${FIELDS.direction}\` \u4FEE\u8BA2\u3001\`${FIELDS.gift}\` \u8FDB\u51FA\u3001\u4F59\u989D\u6E05\u8D26\u3002`,
    "",
    "\u6362\u5DE5\u4F5C\u65F6\u989D\u5916\u505A\u4E00\u4EF6\u4E8B\uFF1A\u6253\u5F00\u90A3\u4EFD\u5DE5\u4F5C\u7684\u5708\u5B50 MOC\uFF0C\u540D\u5F55\u91CC\u90A3\u4E00\u7EC4\u6574\u7EC4\u8FC7\u4E00\u904D\u2014\u2014\u7559\u4E0B\u7684\u628A\u5F52\u5C5E\u6539\u6307\u4EBA\u8109 MOC\uFF0C\u6563\u4E86\u7684\u79FB\u8FDB\u5F52\u6863\u76EE\u5F55\u3002\u4E0D\u5F52\u6863\u7684\u8BDD\u5B83\u4F1A\u4E00\u76F4\u5360\u7740\u540D\u5F55\u3002",
    ""
  ].join("\n");
}
function clientMocContent(created, uid) {
  return [
    areaFrontmatter(
      "\u5BA2\u6237\u9886\u57DF\u603B\u63A7\u53F0\uFF1A\u4EA7\u54C1\u533A\uFF08\u5F85\u4EA4\u4ED8/\u9500\u552E\u5206\u6790/\u4ED8\u8D39\u7528\u6237\uFF09\uFF0B \u670D\u52A1\u533A\uFF08\u672A\u7ED3\u6848/\u6848\u4F8B\u5E93/\u670D\u52A1\u5BA2\u6237\uFF09",
      created,
      uid
    ),
    "",
    "> \u4F60\u6709\u4E24\u6761\u4EA4\u6613\u7EBF\uFF0C\u5B83\u4EEC\u56DE\u7B54\u7684\u95EE\u9898\u4E0D\u540C\uFF0C\u6240\u4EE5\u5206\u4E24\u533A\u770B\u3002",
    "> **\u4EA7\u54C1**\uFF1A\u964C\u751F\u4EBA\u4E70\u4F60\u7684\u4E1C\u897F\uFF0C\u4F60\u53EA\u77E5\u9053\u6E20\u9053\u548C\u8054\u7CFB\u65B9\u5F0F\u3002\u8981\u770B\u7684\u662F\u94B1\u4ECE\u54EA\u6765\u3001\u8D27\u7ED9\u4E86\u6CA1\u3002",
    "> **\u670D\u52A1**\uFF1A\u8BA4\u8BC6\u7684\u4EBA\u627E\u4F60\u529E\u4E8B\uFF0C\u6709\u9879\u76EE\u6709\u8FC7\u7A0B\u3002\u8981\u770B\u7684\u662F\u6B20\u8C01\u7684\u6D3B\u3001\u54EA\u7C7B\u95EE\u9898\u8BE5\u505A\u6210\u8BFE\u3002",
    "",
    "# \u{1F6D2} \u4EA7\u54C1",
    "",
    "## \u{1F4E6} \u5F85\u4EA4\u4ED8",
    "",
    viewBlock("\u5F85\u4EA4\u4ED8"),
    "",
    "## \u{1F4CA} \u9500\u552E\u5206\u6790",
    "",
    viewBlock("\u9500\u552E\u5206\u6790"),
    "",
    "## \u{1F465} \u4ED8\u8D39\u7528\u6237",
    "",
    viewBlock("\u4ED8\u8D39\u7528\u6237"),
    "",
    "# \u{1F527} \u670D\u52A1",
    "",
    "## \u{1F4CB} \u672A\u7ED3\u6848",
    "",
    viewBlock("\u672A\u7ED3\u6848"),
    "",
    "## \u{1F4DA} \u6848\u4F8B\u5E93",
    "",
    viewBlock("\u6848\u4F8B\u5E93"),
    "",
    "## \u{1F464} \u670D\u52A1\u5BA2\u6237",
    "",
    viewBlock("\u670D\u52A1\u5BA2\u6237"),
    "",
    "# \u{1F4D6} \u4F7F\u7528\u8BF4\u660E",
    "",
    "## \u4E24\u6761\u4EA4\u6613\u7EBF\uFF0C\u4E24\u4E2A\u7269\u79CD",
    "",
    "| | \u4EA7\u54C1\u578B | \u670D\u52A1\u578B |",
    "|---|---|---|",
    "| **\u8C01** | \u5E73\u53F0\u4E0A\u6765\u7684\u964C\u751F\u4EBA | \u4F60\u8BA4\u8BC6\u7684\u4EBA |",
    "| **\u4F60\u77E5\u9053\u4EC0\u4E48** | \u6E20\u9053\u3001\u8054\u7CFB\u65B9\u5F0F\u3001\u5355\u53F7\uFF0C**\u4EC5\u6B64\u800C\u5DF2** | \u5168\u5957\uFF1A\u751F\u65E5\u3001\u4F4F\u5740\u3001\u813E\u6C14\u3001\u4EBA\u60C5\u5F80\u6765 |",
    `| **\u6863\u6848\u5728\u54EA** | \`${FIELDS.type}: ${NOTE_TYPES.client}\` | \`${FIELDS.type}: ${NOTE_TYPES.person}\`\uFF0C\u89C1 ${CONTACT_MOC_LINK} |`,
    `| **\u6D3B\u513F\u5728\u54EA** | \u6CA1\u6709\u9879\u76EE\uFF0C\u5C31\u662F\u4E00\u7B14\u4E70\u5356\uFF0B\u4E00\u6B21\u4EA4\u4ED8 | \u4E00\u4E2A\u9879\u76EE\uFF0C\`${FIELDS.client}\` \u94FE\u63A5\u6302\u5230\u4ED6 |`,
    "",
    "## \u4ED8\u8D39\u600E\u4E48\u8BB0\uFF1A\u4E00\u7B14\u4E00\u6761\u4EFB\u52A1",
    "",
    "**\u4E00\u7B14\u4ED8\u8D39\u7684\u672C\u8D28\uFF0C\u5C31\u662F\u300C\u6211\u6B20\u4ED6\u4E00\u6B21\u4EA4\u4ED8\u300D\uFF0C\u90A3\u672C\u6765\u5C31\u662F\u4E2A\u5F85\u529E\u3002** \u6240\u4EE5\u547D\u4EE4\u5199\u5165\u7684\u662F**\u672A\u52FE\u9009**\u7684\u4EFB\u52A1\u884C\uFF0C\u4EA4\u4ED8\u5B8C\u70B9\u4E00\u4E0B\u52FE\uFF1A",
    "",
    "```markdown",
    `- [x] [${PAYMENT_FIELDS.product}::\u8BFE\u7A0B] [${PAYMENT_FIELDS.amount}::365] [${PAYMENT_FIELDS.date}::2026-08-12]`,
    `- [ ] [${PAYMENT_FIELDS.product}::\u54A8\u8BE2] [${PAYMENT_FIELDS.amount}::199] [${PAYMENT_FIELDS.date}::2026-09-01]`,
    "```",
    "",
    "**\u4E09\u6761\u683C\u5F0F\u7EAA\u5F8B**\uFF0C\u6BCF\u6761\u90FD\u5728\u8EB2\u4E00\u4E2A\u771F\u5751\uFF1A",
    "",
    "| \u7EAA\u5F8B | \u4E3A\u4EC0\u4E48 |",
    "|---|---|",
    `| **\u952E\u540D\u7528\u4E2D\u6587**\uFF08${PAYMENT_FIELDS.amount}\uFF0C\u4E0D\u5199 Amount\uFF09 | \u542B\u5927\u5199\u7684\u952E\u4F1A\u88AB\u989D\u5916\u8865\u4E00\u4EFD\u5C0F\u5199\u89C4\u8303\u540D\uFF0C\u540C\u4E00\u7B14\u94B1\u5728\u904D\u5386\u6C42\u548C\u65F6\u88AB\u7B97\u4E24\u904D |`,
    "| **\u4E00\u7B14\u5199\u4E00\u884C\uFF0C\u4E0D\u8981\u5D4C\u5957** | \u7236\u9879\u548C\u5B50\u9879\u7684\u5B57\u6BB5\u5404\u81EA\u6241\u5E73\u4E0A\u6D6E\uFF0C\u9875\u9762\u7EA7\u770B\u4E0D\u5230\u8C01\u914D\u8C01\uFF0C\u914D\u5BF9\u4E22\u5931 |",
    "| **\u4EA7\u54C1\u540D\u5199\u5728\u503C\u91CC\uFF0C\u4E0D\u5F53\u952E\u540D** | \u5199\u6210 `[\u8BFE\u7A0B::365]` \u7684\u8BDD\uFF0C\u7B97\u603B\u6536\u5165\u5C31\u5F97\u679A\u4E3E\u6240\u6709\u4EA7\u54C1\u540D\uFF0C\u52A0\u4E00\u4E2A\u4EA7\u54C1\u8981\u6539\u6240\u6709\u67E5\u8BE2 |",
    "",
    `\u6E20\u9053\u4E0D\u5199\u8FDB\u6D41\u6C34\u884C\u2014\u2014\u5B83\u5C5E\u4E8E\u8FD9\u4E2A\u4EBA\u4E0D\u5C5E\u4E8E\u6BCF\u4E00\u7B14\uFF0C\u5199\u5728 frontmatter \u7684 \`${FIELDS.source}\` \u91CC\u5C31\u591F\u4E86\u3002\u4E5F**\u4E0D\u8BBE\u300C\u4ED8\u8D39\u6B21\u6570\u300D\u300C\u7D2F\u8BA1\u91D1\u989D\u300D\u5B57\u6BB5**\uFF1A\u6570\u884C\u6570\u5C31\u662F\u6B21\u6570\uFF0C\u6C42\u548C\u5C31\u662F\u7D2F\u8BA1\uFF0C\u624B\u5DE5\u7EF4\u62A4\u7684\u8BA1\u6570\u8FDF\u65E9\u548C\u6D41\u6C34\u5BF9\u4E0D\u4E0A\uFF0C\u800C\u5BF9\u4E0D\u4E0A\u7684\u90A3\u5929\u4F60\u4E0D\u4F1A\u53D1\u73B0\u3002`,
    "",
    "## \u4E00\u6761\u6CD5\uFF0C\u4E24\u7C7B\u6863\u6848\u90FD\u5B88",
    "",
    "**\u65E5\u5E38\u53D1\u751F\u7684\u4E8B\u53EA\u5199\u4E00\u5904\uFF1A\u5F53\u5929\u65E5\u8BB0\uFF0C\u53E5\u5B50\u91CC\u5E26 `[[\u5BA2\u6237\u540D]]`\u3002** \u5BA2\u6237\u6863\u6848\u7684\u300C\u5173\u952E\u4E8B\u4EF6\u300D\u548C\u300C\u5F85\u529E\u300D\u4F1A\u81EA\u5DF1\u628A\u5B83\u4EEC\u68C0\u7D22\u8FC7\u6765\uFF0C\u548C\u4EBA\u8109\u6863\u6848\u5B8C\u5168\u540C\u4E00\u5957\u673A\u5236\u3002\u6240\u4EE5\u5BA2\u6237\u6863\u6848\u91CC\u6CA1\u6709\u624B\u5199\u7684\u300C\u4ED6\u7684\u95EE\u9898\u300D\u300C\u4EA4\u4ED8\u8BB0\u5F55\u300D\u5C0F\u8282\u2014\u2014**\u4F60\u4E0D\u7528\u7EF4\u62A4\u4EFB\u4F55\u4E00\u4EFD\u6863\u6848\u7684\u6B63\u6587**\u3002",
    "",
    `## \`${FIELDS.client}\` \u4E0E \`${FIELDS.with}\` \u4E0D\u80FD\u4E92\u6362`,
    "",
    `\`${FIELDS.client}\` \u662F**\u5546\u4E1A\u5951\u7EA6\u6807\u8BB0**\uFF0C\u5199\u4E0B\u5B83\u7B49\u4E8E\u5BA3\u544A\u300C\u6211\u6B20\u8FD9\u4E2A\u4EBA\u4E00\u4E2A\u4EA4\u4ED8\u300D\u3002\u4E09\u5F20\u670D\u52A1\u533A\u7684\u8868\u5168\u9760\u5B83\u8FC7\u6EE4\uFF0C\u300C\u670D\u52A1\u5BA2\u6237\u300D\u66F4\u662F\u76F4\u63A5\u7528\u5B83\u53CD\u63A8\u8EAB\u4EFD\u2014\u2014**\u7ED9\u8C01\u5E72\u8FC7\u6D3B\u8C01\u5C31\u662F\u5BA2\u6237**\u3002\u6240\u4EE5\u670B\u53CB\u4E00\u8D77\u505A\u7684\u4E8B\u5FC5\u987B\u8D70 \`${FIELDS.with}\`\uFF0C\u5426\u5219\u670B\u53CB\u4F1A\u88AB\u65E0\u58F0\u6CE8\u518C\u6210\u5BA2\u6237\u3001\u9879\u76EE\u4F1A\u6302\u8FDB\u300C\u6211\u8FD8\u6B20\u8C01\u7684\u4EA4\u4ED8\u300D\u3001\u7ED3\u6848\u540E\u8FD8\u4F1A\u6C61\u67D3\u6848\u4F8B\u5E93\u7684\u9009\u9898\u7EDF\u8BA1\u3002`,
    ""
  ].join("\n");
}

// src/modules/contacts/client.ts
var ILLEGAL_NAME = /[\\/:*?"<>|#^[\]]/;
var MESSAGES5 = {
  setupDone: "\u5BA2\u6237\u6A21\u5757\u5DF2\u5C31\u7EEA \u2705",
  namePrompt: "\u600E\u4E48\u79F0\u547C\u4ED6\uFF1F\uFF08\u6863\u6848\u5C31\u7528\u5B83\u547D\u540D\uFF09",
  namePlaceholder: "\u4F8B\u5982\uFF1A\u738B\u4E94",
  illegalName: '\u79F0\u547C\u91CC\u4E0D\u80FD\u6709 \\ / : * ? " < > | # ^ [ ] \u8FD9\u4E9B\u5B57\u7B26\u3002',
  sourcePrompt: "\u4ED6\u4ECE\u54EA\u4E2A\u6E20\u9053\u6765\uFF1F",
  contactPrompt: "\u8054\u7CFB\u65B9\u5F0F\uFF08\u5FAE\u4FE1\u53F7\u3001\u624B\u673A\u53F7\u3001\u5E73\u53F0\u8D26\u53F7\u90FD\u884C\uFF09",
  productPrompt: "\u4ED6\u4E70\u7684\u662F\u4EC0\u4E48\uFF1F",
  amountPrompt: "\u591A\u5C11\u94B1\uFF1F\uFF08\u53EA\u586B\u6570\u5B57\uFF09",
  amountInvalid: "\u91D1\u989D\u8981\u662F\u4E2A\u6570\u5B57\uFF0C\u8FD9\u7B14\u6CA1\u8BB0\u3002",
  clientPrompt: "\u8FD9\u7B14\u4ED8\u8D39\u662F\u8C01\u7684\uFF1F",
  projectPrompt: "\u8FD9\u7B14\u6536\u6B3E\u7B97\u54EA\u4E2A\u9879\u76EE\u7684\uFF1F",
  noClients: "\u8FD8\u6CA1\u6709\u5BA2\u6237\u6863\u6848\u3002\u5148\u8FD0\u884C\u300C\u65B0\u5EFA\u5BA2\u6237\u300D\u5EFA\u4E00\u4E2A\u3002",
  noProjects: `\u8FD8\u6CA1\u6709\u5BA2\u6237\u9879\u76EE\u3002\u5728\u9879\u76EE MOC \u7684\u5C5E\u6027\u91CC\u5199 \`${FIELDS.client}: "[[\u67D0\u4EBA]]"\` \u5C31\u7B97\u4E00\u4E2A\u3002`,
  cancelled: "\u5DF2\u53D6\u6D88\u3002",
  existsPrefix: "\u5DF2\u7ECF\u6709\u8FD9\u4EFD\u6863\u6848\u4E86\uFF0C\u76F4\u63A5\u6253\u5F00\uFF1A",
  createdPrefix: "\u5BA2\u6237\u6863\u6848\u5DF2\u5EFA\u597D\uFF1A",
  paidPrefix: "\u5DF2\u8BB0\u4E00\u7B14\u4ED8\u8D39\uFF1A",
  receiptPrefix: "\u5DF2\u8BB0\u4E00\u7B14\u6536\u6B3E\uFF1A",
  failedPrefix: "\u64CD\u4F5C\u5931\u8D25\uFF1A"
};
function clientSeed(ctx) {
  const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
  const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
  return {
    folders: [folder],
    notes: [
      { path: TEMPLATE_FILES.client, content: clientTemplateFile() },
      { path: `${folder}/${basenameOf(CLIENT_MOC)}.md`, content: clientMocContent(stamp, uid) }
    ]
  };
}
function registerClientCommands(ctx, applySeed2) {
  ctx.commands.register(CLIENT_COMMANDS.setup, () => {
    void setupClients(ctx, applySeed2);
  });
  ctx.commands.register(CLIENT_COMMANDS.create, () => {
    void createClient(ctx);
  });
  ctx.commands.register(CLIENT_COMMANDS.payment, () => {
    void addPayment(ctx);
  });
  ctx.commands.register(CLIENT_COMMANDS.receipt, () => {
    void recordReceipt(ctx);
  });
}
async function setupClients(ctx, applySeed2) {
  try {
    const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
    await applySeed2(clientSeed(ctx));
    new import_obsidian25.Notice(MESSAGES5.setupDone);
    await ctx.app.workspace.openLinkText(`${folder}/${basenameOf(CLIENT_MOC)}.md`, "", false);
  } catch (error) {
    notifyFailure(error);
  }
}
async function createClient(ctx) {
  try {
    const answer = await new TextInputModal(ctx.app, {
      title: MESSAGES5.namePrompt,
      placeholder: MESSAGES5.namePlaceholder
    }).openAndGetValue();
    const name = (answer != null ? answer : "").trim();
    if (!name) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    if (ILLEGAL_NAME.test(name)) {
      new import_obsidian25.Notice(MESSAGES5.illegalName);
      return;
    }
    const source = await new ChoiceModal(ctx.app, {
      title: MESSAGES5.sourcePrompt,
      items: optionsOf(ctx.settings.clientSources),
      labelOf: (item) => item
    }).openAndGetChoice();
    if (!source) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    const contact = await new TextInputModal(ctx.app, {
      title: MESSAGES5.contactPrompt
    }).openAndGetValue();
    if (contact === null) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    const folder = normalizeFolderPath(ctx.settings.clientFolder, CLIENT_FOLDER);
    const path = `${folder}/${name}.md`;
    const existing = ctx.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian25.TFile) {
      new import_obsidian25.Notice(MESSAGES5.existsPrefix + name);
      await ctx.app.workspace.getLeaf(false).openFile(existing);
      return;
    }
    const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
    const content = clientNoteContent({
      created: stamp,
      uid,
      type: NOTE_TYPES.client,
      source,
      contact: contact.trim()
    });
    await ensureFolderPath(ctx.app, folder);
    ctx.guard.mark(path);
    const file = await ctx.app.vault.create(path, content);
    new import_obsidian25.Notice(MESSAGES5.createdPrefix + name);
    await ctx.app.workspace.getLeaf(false).openFile(file);
  } catch (error) {
    notifyFailure(error);
  }
}
async function addPayment(ctx) {
  try {
    const clients = liveNotesOfType(ctx, NOTE_TYPES.client);
    if (!clients.length) {
      new import_obsidian25.Notice(MESSAGES5.noClients);
      return;
    }
    const client = await new ChoiceModal(ctx.app, {
      title: MESSAGES5.clientPrompt,
      items: clients,
      labelOf: (file) => {
        const hint = descriptionOf(ctx, file);
        return hint ? `${file.basename}\u3000\u2014\u3000${hint}` : file.basename;
      }
    }).openAndGetChoice();
    if (!client) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    const product = await new ChoiceModal(ctx.app, {
      title: MESSAGES5.productPrompt,
      items: optionsOf(ctx.settings.clientProducts),
      labelOf: (item) => item
    }).openAndGetChoice();
    if (!product) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    const amount = await askAmount(ctx);
    if (amount === null) return;
    const line = `- [ ] [${PAYMENT_FIELDS.product}::${product}] [${PAYMENT_FIELDS.amount}::${amount}] [${PAYMENT_FIELDS.date}::${today()}]`;
    ctx.guard.mark(client.path);
    await ctx.app.vault.process(
      client,
      (content) => insertIntoSection(content, CLIENT_PAYMENT_HEADING, line)
    );
    new import_obsidian25.Notice(`${MESSAGES5.paidPrefix}${client.basename} \xB7 ${product} \xB7 ${amount}`);
  } catch (error) {
    notifyFailure(error);
  }
}
async function recordReceipt(ctx) {
  try {
    const projects = clientProjects2(ctx);
    if (!projects.length) {
      new import_obsidian25.Notice(MESSAGES5.noProjects);
      return;
    }
    const project = await new ChoiceModal(ctx.app, {
      title: MESSAGES5.projectPrompt,
      items: projects,
      labelOf: (file) => file.basename
    }).openAndGetChoice();
    if (!project) {
      new import_obsidian25.Notice(MESSAGES5.cancelled);
      return;
    }
    const amount = await askAmount(ctx);
    if (amount === null) return;
    const line = `- [ ] [${PAYMENT_FIELDS.amount}::${amount}] [${PAYMENT_FIELDS.date}::${today()}]`;
    ctx.guard.mark(project.path);
    await ctx.app.vault.process(
      project,
      (content) => insertIntoSection(content, PROJECT_PAYMENT_HEADING, line)
    );
    new import_obsidian25.Notice(`${MESSAGES5.receiptPrefix}${project.basename} \xB7 ${amount}`);
  } catch (error) {
    notifyFailure(error);
  }
}
function clientProjects2(ctx) {
  var _a, _b, _c;
  const found = [];
  for (const file of ctx.app.vault.getMarkdownFiles()) {
    if (isSystemPath(file.path)) continue;
    const frontmatter = (_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (String((_b = frontmatter == null ? void 0 : frontmatter[FIELDS.type]) != null ? _b : "").trim() !== NOTE_TYPES.project) continue;
    if (!extractLinks(String((_c = frontmatter == null ? void 0 : frontmatter[FIELDS.client]) != null ? _c : "")).length) continue;
    found.push(file);
  }
  return found.sort((left, right) => left.basename.localeCompare(right.basename, "zh"));
}
async function askAmount(ctx) {
  const answer = await new TextInputModal(ctx.app, {
    title: MESSAGES5.amountPrompt,
    placeholder: "\u4F8B\u5982\uFF1A365"
  }).openAndGetValue();
  if (answer === null) {
    new import_obsidian25.Notice(MESSAGES5.cancelled);
    return null;
  }
  const amount = Number(answer.trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    new import_obsidian25.Notice(MESSAGES5.amountInvalid);
    return null;
  }
  return amount;
}
function optionsOf(raw) {
  return raw.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}
function notifyFailure(error) {
  const message2 = error instanceof Error ? error.message : String(error);
  new import_obsidian25.Notice(MESSAGES5.failedPrefix + message2);
}

// src/modules/contacts/createContact.ts
var import_obsidian26 = require("obsidian");
var ILLEGAL_NAME2 = /[\\/:*?"<>|#^[\]]/;
var MESSAGES6 = {
  namePrompt: "\u8FD9\u4E2A\u4EBA\u53EB\u4EC0\u4E48\uFF1F\uFF08\u771F\u540D\uFF0C\u6863\u6848\u5C31\u7528\u5B83\u547D\u540D\uFF09",
  namePlaceholder: "\u4F8B\u5982\uFF1A\u5F20\u4E09",
  cancelled: "\u5DF2\u53D6\u6D88\uFF0C\u6CA1\u6709\u5EFA\u6863\u3002",
  illegalName: '\u59D3\u540D\u91CC\u4E0D\u80FD\u6709 \\ / : * ? " < > | # ^ [ ] \u8FD9\u4E9B\u5B57\u7B26\u3002',
  tierPrompt: "\u591A\u4E45\u8BE5\u8DDF\u4ED6\u8BF4\u53E5\u8BDD\uFF1F",
  directionPrompt: "\u8FD9\u6BB5\u5173\u7CFB\u5F80\u54EA\u4E2A\u65B9\u5411\u4F7F\u52B2\uFF1F",
  existsPrefix: "\u5DF2\u7ECF\u6709\u8FD9\u4EFD\u6863\u6848\u4E86\uFF0C\u76F4\u63A5\u6253\u5F00\uFF1A",
  donePrefix: "\u6863\u6848\u5DF2\u5EFA\u597D\uFF1A",
  failedPrefix: "\u5EFA\u6863\u5931\u8D25\uFF1A"
};
var TIER_HINTS = {
  \u5BC6: "\u6BCF\u5468\u8BF4\u53E5\u8BDD",
  \u8FD1: "\u6BCF\u6708\u8BF4\u53E5\u8BDD",
  \u719F: "\u6BCF\u5B63\u8BF4\u53E5\u8BDD",
  \u8FDC: "\u6BCF\u5E74\u8BF4\u53E5\u8BDD"
};
var DIRECTION_HINTS = {
  \u5411\u4E0A: "\u8981\u7528\u5FC3\u7EF4\u62A4",
  \u5E73\u884C: "\u4E92\u76F8\u642D\u628A\u624B",
  \u5411\u4E0B: "\u7ED9\u673A\u4F1A\uFF0C\u7ED3\u5584\u7F18"
};
function registerCreateContactCommand(ctx) {
  ctx.commands.register(CONTACT_COMMANDS.create, () => {
    void createContact(ctx);
  });
}
async function createContact(ctx) {
  try {
    const answer = await new TextInputModal(ctx.app, {
      title: MESSAGES6.namePrompt,
      placeholder: MESSAGES6.namePlaceholder
    }).openAndGetValue();
    const name = (answer != null ? answer : "").trim();
    if (!name) {
      new import_obsidian26.Notice(MESSAGES6.cancelled);
      return;
    }
    if (ILLEGAL_NAME2.test(name)) {
      new import_obsidian26.Notice(MESSAGES6.illegalName);
      return;
    }
    const tier = await new ChoiceModal(ctx.app, {
      title: MESSAGES6.tierPrompt,
      items: CONTACT_TIERS,
      labelOf: (item) => {
        var _a;
        return `${item}\u3000\u2014\u3000${(_a = TIER_HINTS[item]) != null ? _a : ""}`;
      }
    }).openAndGetChoice();
    if (!tier) {
      new import_obsidian26.Notice(MESSAGES6.cancelled);
      return;
    }
    const direction = await new ChoiceModal(ctx.app, {
      title: MESSAGES6.directionPrompt,
      items: CONTACT_DIRECTIONS,
      labelOf: (item) => {
        var _a;
        return `${item}\u3000\u2014\u3000${(_a = DIRECTION_HINTS[item]) != null ? _a : ""}`;
      }
    }).openAndGetChoice();
    if (!direction) {
      new import_obsidian26.Notice(MESSAGES6.cancelled);
      return;
    }
    const folder = normalizeFolderPath(ctx.settings.contactFolder, CONTACT_FOLDER);
    const path = `${folder}/${name}.md`;
    const existing = ctx.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian26.TFile) {
      new import_obsidian26.Notice(MESSAGES6.existsPrefix + name);
      await ctx.app.workspace.getLeaf(false).openFile(existing);
      return;
    }
    const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
    const content = personNoteContent({
      created: stamp,
      uid,
      type: NOTE_TYPES.person,
      up: `[[${basenameOf(CONTACT_MOC)}]]`,
      tier,
      direction
    });
    await ensureFolderPath(ctx.app, folder);
    ctx.guard.mark(path);
    const file = await ctx.app.vault.create(path, content);
    new import_obsidian26.Notice(MESSAGES6.donePrefix + name);
    await ctx.app.workspace.getLeaf(false).openFile(file);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian26.Notice(MESSAGES6.failedPrefix + message2);
  }
}

// src/modules/contacts/personViews.ts
var MAX_ROWS = 20;
var TERMINAL_STATUS = {
  done: "\u5B8C\u6210",
  dropped: "\u653E\u5F03"
};
var relatedProjects = {
  name: "\u76F8\u5173\u9879\u76EE",
  render: async (view) => {
    if (!view.host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u4EBA\u7269\u6863\u6848\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const living = relationsOf(view, view.host).filter(
      (item) => !TERMINAL_STATUS[item.status]
    );
    if (!living.length) {
      renderEmpty(
        view.el,
        `\u624B\u4E0A\u6CA1\u6709\u548C\u4ED6\u76F8\u5173\u7684\u9879\u76EE\u3002\u5728\u9879\u76EE MOC \u7684\u5C5E\u6027\u91CC\u5199 \`${FIELDS.client}: "[[${view.host.basename}]]"\`\uFF08\u4ED6\u59D4\u6258\u7684\uFF09\u6216 \`${FIELDS.with}\`\uFF08\u4E00\u8D77\u505A\u7684\uFF09\u3002\u5DF2\u7ECF\u7ED3\u675F\u7684\u9879\u76EE\u4F1A\u51FA\u73B0\u5728\u4E0B\u9762\u7684\u300C\u5173\u952E\u4E8B\u4EF6\u300D\u91CC\u3002`
      );
      return;
    }
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u9879\u76EE", "\u5173\u7CFB", "\u6982\u8FF0"],
      living.map((item) => [
        noteLink(item.project),
        item.relation,
        toText(view.index.fieldOf(item.project, FIELDS.description)) || "\u2014"
      ]),
      2
    );
  }
};
function relationsOf(view, person) {
  const found = [];
  for (const project of view.index.notesOfType(NOTE_TYPES.project)) {
    const relation = fieldPointsTo(view, project, FIELDS.client, person) ? "\u59D4\u6258" : fieldPointsTo(view, project, FIELDS.with, person) ? "\u540C\u884C" : null;
    if (!relation) continue;
    found.push({
      project,
      relation,
      status: toText(view.index.fieldOf(project, FIELDS.status)).toLowerCase()
    });
  }
  return found;
}
function fieldPointsTo(view, note, field2, target) {
  var _a;
  const raw = view.index.fieldOf(note, field2);
  const values = Array.isArray(raw) ? raw : [raw];
  for (const value of values) {
    for (const link of extractLinks(String(value != null ? value : ""))) {
      if (((_a = view.index.resolve(link, note.path)) == null ? void 0 : _a.path) === target.path) return true;
    }
  }
  return false;
}
var personLedger = {
  name: "\u4EBA\u60C5\u8D26\u672C",
  render: async (view) => {
    const host = view.host;
    if (!host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u4EBA\u7269\u6863\u6848\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const entries = await collectLedger(view, (owner) => owner.path === host.path);
    if (!entries.length) {
      renderEmpty(
        view.el,
        `\u8FD8\u6CA1\u6709\u8D26\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u8BB0\u4EBA\u60C5\u300D\uFF0C\u6216\u5728\u5F53\u5929\u65E5\u8BB0\u91CC\u5199\u4E00\u884C\uFF1A\`- [[${host.basename}]]\uFF5C\u53BB\uFF5C\u4E8B\u9879\uFF5C\u4E24\u6E05\``
      );
      return;
    }
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u65E5\u671F", "\u53BB/\u6765", "\u4E8B\u9879", "\u72B6\u6001"],
      entries.map((entry) => [
        noteLink(entry.diary, entry.day),
        entry.kind,
        richText(entry.item, entry.diary.path),
        entry.legal ? entry.status : `\u26A0\uFE0F ${entry.status}`
      ]),
      2
    );
  }
};
var keyEvents = {
  name: "\u5173\u952E\u4E8B\u4EF6",
  render: async (view) => {
    var _a;
    const host = view.host;
    if (!host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u4EBA\u7269\u6863\u6848\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const events = [];
    for (const source of mentionSources(view, host)) {
      for (const line of await view.index.listLinesOf(source.file)) {
        if (line.isTask || isLedgerLine(line)) continue;
        if (!mentions(view, line, source.file.path, host)) continue;
        events.push({ day: source.day, source: source.file, text: line.text, link: null });
      }
    }
    for (const item of relationsOf(view, host)) {
      const label = TERMINAL_STATUS[item.status];
      if (!label) continue;
      const day = (_a = dayText(view.index.fieldOf(item.project, FIELDS.archived))) != null ? _a : dayOfMillis(item.project.stat.mtime);
      events.push({
        day,
        source: item.project,
        text: `${label}\u4E86${item.relation === "\u59D4\u6258" ? "\u4ED6\u59D4\u6258\u7684" : "\u4E00\u8D77\u505A\u7684"}\u9879\u76EE`,
        link: item.project
      });
    }
    if (!events.length) {
      renderEmpty(
        view.el,
        `\u8FD8\u6CA1\u6709\u548C\u4ED6\u6709\u5173\u7684\u4E8B\u3002\u5728\u5F53\u5929\u65E5\u8BB0\u91CC\u5199\u4E00\u884C\u63D0\u5230 \`[[${host.basename}]]\`\uFF0C\u8FD9\u91CC\u5C31\u4F1A\u957F\u51FA\u6765\u3002`
      );
      return;
    }
    events.sort((left, right) => right.day.localeCompare(left.day));
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u65E5\u671F", "\u53D1\u751F\u4E86\u4EC0\u4E48"],
      events.slice(0, MAX_ROWS).map((event) => [
        noteLink(event.source, event.day),
        event.link ? richText(`${event.text}\u300A[[${event.link.basename}]]\u300B`, view.sourcePath) : richText(event.text, event.source.path)
      ]),
      1
    );
    if (events.length > MAX_ROWS) {
      renderNote(view.el, `\u2026\u53E6\u6709 ${events.length - MAX_ROWS} \u6761\u66F4\u65E9\u7684\u8BB0\u5F55`);
    }
  }
};
var openTasks = {
  name: "\u5F85\u529E",
  render: async (view) => {
    const host = view.host;
    if (!host) {
      renderEmpty(view.el, "\u8FD9\u4E2A\u89C6\u56FE\u8981\u957F\u5728\u4EBA\u7269\u6863\u6848\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const open = [];
    let done = 0;
    for (const source of mentionSources(view, host)) {
      for (const line of await view.index.listLinesOf(source.file)) {
        if (!line.isTask) continue;
        if (!mentions(view, line, source.file.path, host)) continue;
        if (line.checked) done += 1;
        else {
          open.push({
            file: source.file,
            day: source.day,
            text: line.text,
            line: line.line,
            checked: false
          });
        }
      }
    }
    if (!open.length) {
      renderEmpty(
        view.el,
        done ? `\u8DDF\u4ED6\u6709\u5173\u7684\u4E8B\u90FD\u529E\u5B8C\u4E86\uFF08\u5DF2\u5B8C\u6210 ${done} \u4EF6\uFF09\u3002` : `\u6CA1\u6709\u5F85\u529E\u3002\u9700\u8981\u8DDF\u8FDB\u7684\u5171\u8BC6\u5199\u6210\u4EFB\u52A1\u884C\uFF1A\`- [ ] \u51FA\u65B9\u6848\u7ED9 [[${host.basename}]]\``
      );
      return;
    }
    renderSummary(view.el, `\u8FD8\u6B20 **${open.length}** \u4EF6\u4E8B${done ? `\uFF08\u5DF2\u5B8C\u6210 ${done} \u4EF6\uFF09` : ""}`);
    renderTaskList(view.ctx.app, view.el, view.sourcePath, open, (task) => {
      void toggleTask(view, task);
    });
  }
};
async function toggleTask(view, task) {
  await view.ctx.app.vault.process(task.file, (content) => {
    const changed = toggleTaskLine(content, task.line, task.checked);
    if (changed === null || changed === content) return content;
    view.ctx.guard.mark(task.file.path);
    return changed;
  });
}
function mentionSources(view, host) {
  const sources = [];
  for (const file of view.index.backlinksOf(host)) {
    const day = dayOfTitle(file.basename);
    if (!day) continue;
    const type = toText(view.index.fieldOf(file, FIELDS.type));
    if (type === NOTE_TYPES.person || type === NOTE_TYPES.client) continue;
    sources.push({ file, day });
  }
  return sources.sort((left, right) => right.day.localeCompare(left.day));
}
var personViews = [
  relatedProjects,
  personLedger,
  keyEvents,
  openTasks
];

// src/modules/contacts/recordFavor.ts
var import_obsidian27 = require("obsidian");
var MESSAGES7 = {
  noContacts: "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6863\u6848\u3002\u5148\u8FD0\u884C\u300C\u65B0\u5EFA\u4EBA\u8109\u300D\u5EFA\u4E00\u4E2A\uFF0C\u518D\u6765\u8BB0\u8D26\u3002",
  personPrompt: "\u8FD9\u7B14\u4EBA\u60C5\uFF0C\u662F\u8DDF\u8C01\uFF1F",
  kindPrompt: "\u4EBA\u60C5\u5F80\u54EA\u4E2A\u65B9\u5411\u8D70\uFF1F",
  itemPrompt: "\u4EC0\u4E48\u4E8B\uFF1F\uFF08\u4E00\u53E5\u8BDD\uFF09",
  itemPlaceholder: "\u4F8B\u5982\uFF1A\u9001\u4E86\u534A\u65A4\u751F\u666E",
  statusPrompt: "\u73B0\u5728\u7B97\u6E05\u4E86\u5417\uFF1F",
  cancelled: "\u5DF2\u53D6\u6D88\uFF0C\u6CA1\u6709\u8BB0\u8D26\u3002",
  noDiary: "\u62FF\u4E0D\u5230\u4ECA\u5929\u7684\u65E5\u8BB0\uFF0C\u6CA1\u6709\u8BB0\u8D26\u3002",
  donePrefix: "\u5DF2\u8BB0\u8FDB\u4ECA\u5929\u7684\u65E5\u8BB0\uFF1A",
  failedPrefix: "\u8BB0\u4EBA\u60C5\u5931\u8D25\uFF1A"
};
var KIND_HINTS = {
  \u53BB: "\u6211\u7ED9\u51FA\u53BB\u7684\uFF08\u9001\u793C\u3001\u5E2E\u5FD9\u3001\u8BF7\u5BA2\uFF09",
  \u6765: "\u6211\u6536\u5230\u7684\uFF08\u6536\u793C\u3001\u88AB\u5E2E\u3001\u88AB\u8BF7\uFF09"
};
var STATUS_HINTS = {
  \u4E24\u6E05: "\u8FD9\u7B14\u4E0D\u7528\u8BB0\u6302\u4E86",
  \u6211\u6B20: "\u6211\u8FD8\u6B20\u4ED6\u4E00\u4EFD",
  \u4ED6\u6B20: "\u4ED6\u8FD8\u6B20\u6211\u4E00\u4EFD"
};
function registerRecordFavorCommand(ctx, openDaily) {
  ctx.commands.register(CONTACT_COMMANDS.favor, () => {
    void recordFavor(ctx, openDaily);
  });
}
async function recordFavor(ctx, openDaily) {
  try {
    const candidates = [
      ...liveNotesOfType(ctx, NOTE_TYPES.person),
      ...liveNotesOfType(ctx, NOTE_TYPES.client)
    ];
    if (!candidates.length) {
      new import_obsidian27.Notice(MESSAGES7.noContacts);
      return;
    }
    const person = await new ChoiceModal(ctx.app, {
      title: MESSAGES7.personPrompt,
      items: candidates,
      labelOf: (file) => {
        const hint = descriptionOf(ctx, file);
        return hint ? `${file.basename}\u3000\u2014\u3000${hint}` : file.basename;
      }
    }).openAndGetChoice();
    if (!person) {
      new import_obsidian27.Notice(MESSAGES7.cancelled);
      return;
    }
    const kind = await new ChoiceModal(ctx.app, {
      title: MESSAGES7.kindPrompt,
      items: LEDGER.kinds,
      labelOf: (item2) => {
        var _a;
        return `${item2}\u3000\u2014\u3000${(_a = KIND_HINTS[item2]) != null ? _a : ""}`;
      }
    }).openAndGetChoice();
    if (!kind) {
      new import_obsidian27.Notice(MESSAGES7.cancelled);
      return;
    }
    const answer = await new TextInputModal(ctx.app, {
      title: MESSAGES7.itemPrompt,
      placeholder: MESSAGES7.itemPlaceholder
    }).openAndGetValue();
    const item = cleanItem(answer != null ? answer : "");
    if (!item) {
      new import_obsidian27.Notice(MESSAGES7.cancelled);
      return;
    }
    const status = await new ChoiceModal(ctx.app, {
      title: MESSAGES7.statusPrompt,
      items: LEDGER.statuses,
      labelOf: (value) => {
        var _a;
        return `${value}\u3000\u2014\u3000${(_a = STATUS_HINTS[value]) != null ? _a : ""}`;
      }
    }).openAndGetChoice();
    if (!status) {
      new import_obsidian27.Notice(MESSAGES7.cancelled);
      return;
    }
    const diary = await openDaily();
    if (!diary) {
      new import_obsidian27.Notice(MESSAGES7.noDiary);
      return;
    }
    const line = ledgerLine(personLink(person), kind, item, status);
    ctx.guard.mark(diary.path);
    await ctx.app.vault.process(
      diary,
      (content) => insertIntoSection(content, DIARY_LOG_HEADING, line)
    );
    new import_obsidian27.Notice(MESSAGES7.donePrefix + line);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian27.Notice(MESSAGES7.failedPrefix + message2);
  }
}
function cleanItem(raw) {
  return raw.replace(/\s+/g, " ").split(LEDGER.separator).join("|").trim();
}
function personLink(person) {
  return `[[${person.path.replace(/\.md$/i, "")}|${person.basename}]]`;
}
function ledgerLine(person, kind, item, status) {
  const segments = [person, kind, item];
  if (status !== LEDGER.defaultStatus) segments.push(status);
  return `- ${segments.join(LEDGER.separator)}`;
}

// src/modules/contacts/seed.ts
function contactsSeed(ctx) {
  const folder = normalizeFolderPath(ctx.settings.contactFolder, CONTACT_FOLDER);
  const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
  return {
    folders: [folder],
    notes: [
      { path: TEMPLATE_FILES.person, content: personTemplateFile() },
      { path: `${folder}/${basenameOf(CONTACT_MOC)}.md`, content: contactMocContent(stamp, uid) }
    ]
  };
}

// src/modules/inspiration/capture.ts
var import_obsidian28 = require("obsidian");

// src/modules/inspiration/templates.ts
var TEMPLATE_TOKENS = {
  content: "{{content}}",
  date: "{{date}}",
  time: "{{time}}",
  datetime: "{{datetime}}"
};
function normalizeInspiration(input) {
  if (input === null) return "";
  return input.replace(/\s+/g, " ").trim();
}
function normalizeInspirationHeading(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return INSPIRATION_DEFAULTS.heading;
  const headingMatch = candidate.match(/^(#{1,6})\s*(.+)$/);
  if (headingMatch) return `${headingMatch[1]} ${headingMatch[2].trim()}`;
  return `# ${candidate}`;
}
function normalizeInspirationFormat(value) {
  const candidate = typeof value === "string" ? value : "";
  const format = candidate.trim() ? candidate : INSPIRATION_DEFAULTS.format;
  if (!format.includes(TEMPLATE_TOKENS.content)) {
    throw new Error("\u7075\u611F\u683C\u5F0F\u5FC5\u987B\u5305\u542B {{content}}\uFF0C\u5426\u5219\u8F93\u5165\u5185\u5BB9\u65E0\u5904\u5199\u5165\u3002");
  }
  return format;
}
function renderInspirationEntry(format, inspiration, timeParts) {
  const replacements = {
    [TEMPLATE_TOKENS.content]: inspiration,
    [TEMPLATE_TOKENS.date]: timeParts.date,
    [TEMPLATE_TOKENS.time]: timeParts.time,
    [TEMPLATE_TOKENS.datetime]: timeParts.datetime
  };
  return normalizeInspirationFormat(format).replace(
    /\{\{(?:content|date|time|datetime)\}\}/g,
    (token) => {
      var _a;
      return (_a = replacements[token]) != null ? _a : token;
    }
  );
}
function buildInitialInspirationContent(entry, heading, targetPath) {
  const filter = buildDataviewTaskQuery(targetPath);
  return `${filter}

${heading}

${entry}
`;
}
function buildDataviewTaskQuery(targetPath) {
  return buildDataviewTaskQueryVersion(targetPath, true);
}
function buildDataviewTaskQueryVersion(targetPath, includeMtimeGroup) {
  const escapedPath = targetPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines = [
    "```dataview",
    "task",
    "from",
    `    "${escapedPath}"`,
    "where",
    "    !completed"
  ];
  if (includeMtimeGroup) {
    lines.push(
      "group by",
      '    "\u6700\u540E\u66F4\u65B0 \xB7 " + dateformat(file.mtime, "yyyy-MM-dd HH:mm")'
    );
  }
  lines.push("```");
  return lines.join("\n");
}
function insertInspiration(content, entry, position, heading, targetPath) {
  var _a, _b, _c, _d;
  const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const entryLines = entry.split(/\r?\n/);
  normalizeSystemHeader(lines, heading, targetPath);
  switch (position) {
    case "heading-top": {
      const headingIndex = findHeadingIndex(lines, heading);
      const insertionIndex = findHeadingContentStart(lines, headingIndex);
      lines.splice(insertionIndex, 0, ...entryLines);
      break;
    }
    case "heading-bottom": {
      const headingIndex = findHeadingIndex(lines, heading);
      const headingLevel = (_b = (_a = heading.match(/^#+/)) == null ? void 0 : _a[0].length) != null ? _b : 1;
      let insertionIndex = findHeadingSectionEnd(lines, headingIndex, headingLevel);
      while (insertionIndex > headingIndex + 1 && !((_c = lines[insertionIndex - 1]) == null ? void 0 : _c.trim())) {
        insertionIndex -= 1;
      }
      lines.splice(insertionIndex, 0, ...entryLines);
      break;
    }
    case "file-top": {
      const insertionIndex = findBodyStart(lines, heading);
      lines.splice(insertionIndex, 0, ...entryLines);
      break;
    }
    case "file-bottom": {
      let insertionIndex = lines.length;
      while (insertionIndex > 0 && !((_d = lines[insertionIndex - 1]) == null ? void 0 : _d.trim())) {
        insertionIndex -= 1;
      }
      lines.splice(insertionIndex, 0, ...entryLines);
      break;
    }
  }
  return lines.join(lineEnding);
}
function findHeadingIndex(lines, heading) {
  const index = lines.findIndex((line) => line.trim() === heading);
  if (index === -1) {
    throw new Error(`\u6CA1\u6709\u627E\u5230\u5B9A\u4F4D\u6807\u9898\u201C${heading}\u201D\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u5185\u5BB9\u3002`);
  }
  return index;
}
function findHeadingSectionEnd(lines, headingIndex, headingLevel) {
  var _a;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const nextHeading = (_a = lines[index]) == null ? void 0 : _a.match(/^(#{1,6})\s+/);
    if (nextHeading && nextHeading[1].length <= headingLevel) return index;
  }
  return lines.length;
}
function findHeadingContentStart(lines, headingIndex) {
  const queryStart = firstContentLine(lines, headingIndex + 1);
  if (!isDataviewFence(lines[queryStart])) return queryStart;
  return firstContentLine(lines, findDataviewFenceEnd(lines, queryStart) + 1);
}
function firstContentLine(lines, start) {
  const index = skipBlankLines(lines, start);
  return index < lines.length ? index : Math.max(start, lines.length - 1);
}
function normalizeSystemHeader(lines, heading, targetPath) {
  var _a, _b;
  const bodyStart = findMarkdownBodyStart(lines);
  let headingIndex = bodyStart;
  let queryStart = bodyStart;
  if (((_a = lines[bodyStart]) == null ? void 0 : _a.trim()) === heading) {
    queryStart = skipBlankLines(lines, bodyStart + 1);
  } else if (isDataviewFence(lines[bodyStart])) {
    const legacyQueryEnd = findDataviewFenceEnd(lines, bodyStart);
    headingIndex = skipBlankLines(lines, legacyQueryEnd + 1);
  } else {
    return;
  }
  if (((_b = lines[headingIndex]) == null ? void 0 : _b.trim()) !== heading || !isDataviewFence(lines[queryStart])) return;
  const queryEnd = findDataviewFenceEnd(lines, queryStart);
  const actualQuery = lines.slice(queryStart, queryEnd + 1).join("\n");
  const currentQuery = buildDataviewTaskQuery(targetPath);
  const legacyQuery = buildDataviewTaskQueryVersion(targetPath, false);
  if (actualQuery !== currentQuery && actualQuery !== legacyQuery) return;
  const systemEnd = Math.max(headingIndex, queryEnd);
  const contentStart = skipBlankLines(lines, systemEnd + 1);
  lines.splice(
    bodyStart,
    contentStart - bodyStart,
    ...currentQuery.split("\n"),
    "",
    heading,
    ""
  );
}
function findBodyStart(lines, heading) {
  var _a, _b, _c;
  const bodyStart = findMarkdownBodyStart(lines);
  let queryStart = bodyStart;
  if (/^#{1,6}\s+/.test((_b = (_a = lines[bodyStart]) == null ? void 0 : _a.trim()) != null ? _b : "")) {
    const candidate = skipBlankLines(lines, bodyStart + 1);
    if (isDataviewFence(lines[candidate])) queryStart = candidate;
  }
  if (!isDataviewFence(lines[queryStart])) return bodyStart;
  const afterQuery = skipBlankLines(lines, findDataviewFenceEnd(lines, queryStart) + 1);
  return ((_c = lines[afterQuery]) == null ? void 0 : _c.trim()) === heading ? skipBlankLines(lines, afterQuery + 1) : afterQuery;
}
function findMarkdownBodyStart(lines) {
  var _a;
  let bodyStart = 0;
  if (((_a = lines[0]) == null ? void 0 : _a.trim()) === "---") {
    const closingIndex = lines.findIndex(
      (line, index) => index > 0 && (line.trim() === "---" || line.trim() === "...")
    );
    if (closingIndex === -1) {
      throw new Error("\u76EE\u6807\u7B14\u8BB0\u7684 YAML \u5934\u90E8\u6CA1\u6709\u95ED\u5408\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u5185\u5BB9\u3002");
    }
    bodyStart = closingIndex + 1;
  }
  return skipBlankLines(lines, bodyStart);
}
function isDataviewFence(line) {
  return (line == null ? void 0 : line.trim().toLowerCase()) === "```dataview";
}
function findDataviewFenceEnd(lines, start) {
  const closingIndex = lines.findIndex(
    (line, index) => index > start && line.trim() === "```"
  );
  if (closingIndex === -1) {
    throw new Error("\u76EE\u6807\u7B14\u8BB0\u9876\u90E8\u7684 Dataview \u67E5\u8BE2\u6CA1\u6709\u95ED\u5408\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u5185\u5BB9\u3002");
  }
  return closingIndex;
}
function skipBlankLines(lines, start) {
  var _a;
  let index = start;
  while (index < lines.length && !((_a = lines[index]) == null ? void 0 : _a.trim())) index += 1;
  return index;
}

// src/modules/inspiration/capture.ts
function registerInspirationCaptureCommand(ctx) {
  ctx.commands.register(INSPIRATION_COMMAND, () => {
    void captureInspiration(ctx);
  });
}
async function captureInspiration(ctx) {
  try {
    const input = await new TextInputModal(ctx.app, {
      title: "\u8BF7\u8F93\u5165\u8981\u8BB0\u5F55\u7684\u7075\u611F",
      placeholder: "\u4E00\u53E5\u8BDD\u8BB0\u4E0B\u6765\uFF0C\u7A0D\u540E\u518D\u6574\u7406"
    }).openAndGetValue();
    const inspiration = normalizeInspiration(input);
    if (!inspiration) {
      new import_obsidian28.Notice("\u672A\u8F93\u5165\u5185\u5BB9\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
      return;
    }
    const target = resolveInspirationTarget(ctx);
    const timeParts = nowLocalDateTimeParts(ctx.settings.dateTimeFormat);
    const entry = renderInspirationEntry(target.format, inspiration, timeParts);
    let targetEntry = ctx.app.vault.getAbstractFileByPath(target.path);
    if (targetEntry instanceof import_obsidian28.TFolder) {
      throw new Error(`\u76EE\u6807\u8DEF\u5F84\u662F\u6587\u4EF6\u5939\uFF0C\u65E0\u6CD5\u5199\u5165\uFF1A${target.path}`);
    }
    if (!targetEntry) {
      if (target.folder) await ensureFolderPath(ctx.app, target.folder);
      ctx.guard.mark(target.path);
      targetEntry = await ctx.app.vault.create(
        target.path,
        buildInitialInspirationContent(entry, target.heading, target.path)
      );
    } else {
      if (!(targetEntry instanceof import_obsidian28.TFile) || targetEntry.extension.toLowerCase() !== "md") {
        throw new Error(`\u76EE\u6807\u8DEF\u5F84\u4E0D\u662F Markdown \u6587\u4EF6\uFF1A${target.path}`);
      }
      await ctx.app.vault.process(targetEntry, (content) => {
        const updatedContent = insertInspiration(
          content,
          entry,
          target.position,
          target.heading,
          target.path
        );
        ctx.guard.mark(target.path);
        return updatedContent;
      });
    }
    new import_obsidian28.Notice(`\u5DF2\u8BB0\u5F55\u7075\u611F\uFF1A${inspiration}`);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian28.Notice(`\u8BB0\u5F55\u7075\u611F\u5931\u8D25\uFF1A${message2}`);
  }
}
function resolveInspirationTarget(ctx) {
  const folder = normalizeFolderPath(ctx.settings.inspirationFolder, INSPIRATION_DEFAULTS.folder);
  const fileName = normalizeInspirationFileName(ctx.settings.inspirationFileName);
  const path = (0, import_obsidian28.normalizePath)(folder ? `${folder}/${fileName}` : fileName);
  if (folder.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("\u7075\u611F\u6587\u4EF6\u5939\u4E0D\u80FD\u5305\u542B . \u6216 .. \u8DEF\u5F84\u6BB5\u3002");
  }
  return {
    folder,
    path,
    heading: normalizeInspirationHeading(ctx.settings.inspirationHeading),
    position: normalizeInsertPosition(ctx.settings.inspirationInsertPosition),
    format: normalizeInspirationFormat(ctx.settings.inspirationFormat)
  };
}
function normalizeInspirationFileName(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  const fileName = candidate || INSPIRATION_DEFAULTS.fileName;
  if (fileName === "." || fileName === ".." || /[\\/:*?"<>|]/.test(fileName)) {
    throw new Error("\u7075\u611F\u7B14\u8BB0\u540D\u79F0\u4E0D\u80FD\u5305\u542B\u8DEF\u5F84\u6216\u7CFB\u7EDF\u4FDD\u7559\u5B57\u7B26\u3002");
  }
  return fileName.toLowerCase().endsWith(".md") ? fileName : `${fileName}.md`;
}
function normalizeInsertPosition(value) {
  const candidate = value;
  return INSPIRATION_INSERT_POSITIONS.includes(candidate) ? candidate : INSPIRATION_DEFAULTS.insertPosition;
}

// src/modules/projects/cardInit.ts
var import_obsidian30 = require("obsidian");

// src/core/frontmatter.ts
function hasValue(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
function asFrontmatter(frontmatter) {
  if (!frontmatter || typeof frontmatter !== "object") return null;
  return frontmatter;
}
function isCardInitialized(frontmatter) {
  const fm = asFrontmatter(frontmatter);
  if (!fm) return false;
  const hasEveryField = CARD_FIELDS.every(
    (key) => Object.prototype.hasOwnProperty.call(fm, key)
  );
  return hasEveryField && hasValue(fm.created) && hasValue(fm.UID) && hasValue(fm.up);
}
function isMocFrontmatter(frontmatter) {
  const fm = asFrontmatter(frontmatter);
  if (!fm) return false;
  return hasValue(fm.type);
}
function reorderFrontmatter(frontmatter, cardValues) {
  const knownFields = CARD_FIELDS;
  const extraEntries = Object.entries(frontmatter).filter(
    ([key]) => !knownFields.includes(key)
  );
  for (const key of Object.keys(frontmatter)) {
    delete frontmatter[key];
  }
  for (const key of CARD_FIELDS) {
    frontmatter[key] = cardValues[key];
  }
  for (const [key, value] of extraEntries) {
    frontmatter[key] = value;
  }
}

// src/modules/projects/moc.ts
var import_obsidian29 = require("obsidian");
function mocBasenameOf(containerName) {
  return `${MOC_PREFIX}${containerName}`;
}
function mocPathOf(folderPath, containerName) {
  return (0, import_obsidian29.normalizePath)(`${folderPath}/${mocBasenameOf(containerName)}.md`);
}
function legacyMocPathOf(folderPath, containerName) {
  return (0, import_obsidian29.normalizePath)(`${folderPath}/${containerName}.md`);
}
function resolveMocPath(app, folderPath, containerName) {
  const current = mocPathOf(folderPath, containerName);
  if (app.vault.getAbstractFileByPath(current)) return current;
  const legacy = legacyMocPathOf(folderPath, containerName);
  if (app.vault.getAbstractFileByPath(legacy)) return legacy;
  return current;
}

// src/modules/projects/cardInit.ts
function resolveRoots(settings) {
  const projectFolder = normalizeFolderPath(
    settings.projectFolder,
    DEFAULT_SETTINGS.projectFolder
  );
  const areaFolder = normalizeFolderPath(settings.areaFolder, DEFAULT_SETTINGS.areaFolder);
  return Array.from(
    (/* @__PURE__ */ new Map([
      [projectFolder, { kind: "project", path: projectFolder }],
      [areaFolder, { kind: "area", path: areaFolder }]
    ])).values()
  );
}
function getCardContext(app, filePath, roots) {
  const normalizedFilePath = (0, import_obsidian30.normalizePath)(filePath);
  for (const root of roots) {
    const prefix = `${root.path}/`;
    if (!normalizedFilePath.startsWith(prefix)) continue;
    const relativePath = normalizedFilePath.slice(prefix.length);
    const pathParts = relativePath.split("/").filter(Boolean);
    if (pathParts.length < 2) return null;
    const containerName = pathParts[0];
    const mocPath = resolveMocPath(app, `${root.path}/${containerName}`, containerName);
    if (normalizedFilePath === mocPath) return null;
    return {
      kind: root.kind,
      containerName,
      mocPath,
      upLink: `[[${mocPath.slice(0, -3)}|${containerName}]]`
    };
  }
  return null;
}
async function initCard(ctx, file, opts) {
  var _a;
  const { app, settings, guard } = ctx;
  try {
    if (file.extension !== "md") return;
    const context = getCardContext(app, file.path, resolveRoots(settings));
    if (!context) return;
    const cachedFrontmatter = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (isMocFrontmatter(cachedFrontmatter) || isCardInitialized(cachedFrontmatter)) {
      return;
    }
    let descriptionInput = null;
    if (opts.interactive && !hasValue(cachedFrontmatter == null ? void 0 : cachedFrontmatter.description)) {
      descriptionInput = await new TextInputModal(app, {
        title: "\u8BF7\u8F93\u5165\u8FD9\u7BC7\u5361\u7247\u7B14\u8BB0\u7684\u5185\u5BB9\u6982\u8FF0"
      }).openAndGetValue();
      if (descriptionInput === null) return;
    }
    const promptedDescription = descriptionInput === null ? null : descriptionInput.trim();
    guard.mark(file.path);
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (isMocFrontmatter(frontmatter) || isCardInitialized(frontmatter)) {
        return;
      }
      const hasOwn = (key) => Object.prototype.hasOwnProperty.call(frontmatter, key);
      const { stamp: createdTime, uid } = nowStampAndUid(settings.dateTimeFormat);
      const cardValues = {
        aliases: hasOwn("aliases") ? frontmatter.aliases : null,
        description: hasValue(frontmatter.description) ? frontmatter.description : hasValue(promptedDescription) ? promptedDescription : null,
        created: hasValue(frontmatter.created) ? frontmatter.created : createdTime,
        // updated 完全交给 updatedMaintainer；此处只保留其当前值或建立空字段。
        updated: hasOwn("updated") ? frontmatter.updated : null,
        tags: hasOwn("tags") ? frontmatter.tags : null,
        UID: hasValue(frontmatter.UID) ? frontmatter.UID : uid,
        rating: hasOwn("rating") ? frontmatter.rating : null,
        author: hasOwn("author") ? frontmatter.author : null,
        source: hasOwn("source") ? frontmatter.source : null,
        // up 是列表类型（一张卡片可以同时属于多个 MOC），首次登记也写成单元素列表
        up: hasValue(frontmatter.up) ? frontmatter.up : [context.upLink]
      };
      reorderFrontmatter(frontmatter, cardValues);
    });
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian30.Notice(`\u5361\u7247\u7B14\u8BB0\u521D\u59CB\u5316\u5931\u8D25\uFF1A${message2}`);
    throw error;
  }
}
function registerCardInitCommand(ctx) {
  ctx.commands.register(PROJECT_COMMANDS.card, () => {
    const activeFile = ctx.app.workspace.getActiveFile();
    if (!activeFile) return;
    void initCard(ctx, activeFile, { interactive: true }).catch(() => {
    });
  });
}
function registerCardAutoInit(ctx) {
  ctx.app.workspace.onLayoutReady(() => {
    ctx.plugin.registerEvent(
      ctx.app.vault.on("create", (file) => {
        if (!ctx.settings.autoCardInit) return;
        if (!(file instanceof import_obsidian30.TFile) || file.extension !== "md") return;
        if (ctx.guard.isRecent(file.path)) return;
        if (!getCardContext(ctx.app, file.path, resolveRoots(ctx.settings))) return;
        if (file.stat.size !== 0) return;
        void initCard(ctx, file, { interactive: true }).catch(() => {
        });
      })
    );
  });
}

// src/modules/projects/createContainer.ts
var import_obsidian31 = require("obsidian");

// src/modules/projects/templates.ts
var MOC_FIELDS = [
  "aliases",
  "description",
  "created",
  "updated",
  "tags",
  "UID",
  "type",
  "status"
];
var NAV_INTRO = "\u8FD9\u91CC\u662F\u4F60\u7684\u5BB6\u3002\u4E0B\u9762\u56DB\u5F20\u8868\u4F1A\u81EA\u52A8\u5217\u51FA\u5E93\u91CC\u6240\u6709\u9879\u76EE\u3001\u9886\u57DF\u548C\u4E66\u7C4D\uFF0C\u65B0\u5EFA\u4E4B\u540E\u81EA\u52A8\u51FA\u73B0\uFF0C\u4E0D\u7528\u624B\u52A8\u7EF4\u62A4\u3002";
var NAV_VIEWS = [
  { name: "\u6B63\u5728\u8FDB\u884C\u4E2D", filter: 'status == "active"' },
  { name: "\u9879\u76EE", filter: 'type == "project"' },
  { name: "\u9886\u57DF", filter: 'type == "area"' },
  { name: "\u4E66\u7C4D", filter: 'type == "book"' }
];
function toYamlString2(value) {
  return JSON.stringify(String(value));
}
function mocFrontmatter(options) {
  const {
    description,
    created,
    uid,
    type,
    status,
    author,
    aliases,
    tags,
    source,
    bibliography,
    relation
  } = options;
  return [
    "---",
    // 别名是列表类型（types.json 登记为 aliases），有值就逐条写成列表项
    ...(aliases == null ? void 0 : aliases.length) ? ["aliases:", ...aliases.map((alias) => `  - ${toYamlString2(alias)}`)] : ["aliases:"],
    `description: ${toYamlString2(description)}`,
    `created: ${created}`,
    "updated:",
    // 书籍带着豆瓣的分类词进来，其余容器仍留一个空键等主人自己填
    ...(tags == null ? void 0 : tags.length) ? ["tags:", ...tags.map((tag) => `  - ${toYamlString2(tag)}`)] : ["tags:"],
    `UID: ${uid}`,
    `type: ${type}`,
    // 领域没有状态，那一行整行不写；空的 status 键会让它出现在「正在进行中」那张表里
    ...status ? [`status: ${status}`] : [],
    // 只有书籍容器带作者，且学员跳过作者一问时整行不写——空键是登记表不是索引。
    // 写成单元素列表是因为 author 在 types.json 里是 multitext，理由见 MocFrontmatterOptions
    ...author ? ["author:", `  - ${toYamlString2(author)}`] : [],
    // 出处：书籍写豆瓣条目地址。它是 text 类型，直接写裸链接，Obsidian 会渲染成可点的
    ...source ? [`source: ${source}`] : [],
    ...bibliographyLines(bibliography),
    // 只在有值时才写这一行：空的 client 键会让这个项目被当成一笔没有客户的委托
    ...relation ? [`${relation.field}: "[[${relation.target}]]"`] : [],
    "---"
  ].join("\n");
}
function bibliographyLines(bibliography) {
  if (!bibliography) return [];
  const { translators, publisher, publishDate, pages, cover } = bibliography;
  return [
    ...(translators == null ? void 0 : translators.length) ? ["translator:", ...translators.map((name) => `  - ${toYamlString2(name)}`)] : [],
    ...publisher ? [`publisher: ${toYamlString2(publisher)}`] : [],
    ...publishDate ? [`published: ${toYamlString2(publishDate)}`] : [],
    ...pages ? [`pages: ${pages}`] : [],
    ...cover ? [`cover: ${cover}`] : []
  ];
}
function mocBaseBlock(mocBasename, projectFolderPath, viewName = "\u9879\u76EE\u6587\u4EF6") {
  return [
    "```base",
    "filters:",
    "  and:",
    "    - file.path != this.file.path",
    "properties:",
    "  note.description:",
    "    displayName: \u6982\u8FF0",
    "  note.rating:",
    "    displayName: \u8BC4\u5206",
    "views:",
    "  - type: table",
    `    name: ${viewName}`,
    "    filters:",
    "      or:",
    // 这一行必须是 MOC 自己的文件名，不是文件夹名：卡片的 up 指向的是这篇笔记。
    // 两者一旦分叉，这张表会静默少收一半文件——它不报错，只是变短
    `        - up == link(${JSON.stringify(mocBasename)})`,
    `        - file.folder == ${JSON.stringify(projectFolderPath)}`,
    "    order:",
    "      - file.name",
    "      - description",
    "      - rating",
    "    sort:",
    "      - property: rating",
    "        direction: DESC",
    "    columnSize:",
    "      file.name: 170",
    "      note.description: 421",
    "",
    "```"
  ].join("\n");
}
function mocContent(options) {
  var _a;
  const frontmatter = mocFrontmatter(options);
  const baseBlock = mocBaseBlock(
    options.mocBasename,
    options.projectFolderPath,
    options.baseViewName
  );
  const sectionBlock = ((_a = options.sections) != null ? _a : []).map((section) => section.body ? `${section.heading}

${section.body}

` : `${section.heading}

`).join("");
  return `${frontmatter}



${sectionBlock}${baseBlock}
`;
}
function emptyFrontmatter(fields) {
  return ["---", ...fields.map((field2) => `${field2}:`), "---", ""].join("\n");
}
function cardTemplateFile() {
  return emptyFrontmatter(CARD_FIELDS);
}
function mocTemplateFile() {
  return emptyFrontmatter(MOC_FIELDS);
}
function navContent() {
  const lines = [
    NAV_INTRO,
    "",
    "```base",
    "properties:",
    "  note.description:",
    "    displayName: \u6982\u8FF0",
    "  note.status:",
    "    displayName: \u72B6\u6001",
    "views:"
  ];
  for (const view of NAV_VIEWS) {
    lines.push(
      "  - type: table",
      `    name: ${view.name}`,
      "    filters:",
      "      and:",
      `        - ${view.filter}`,
      "    order:",
      "      - file.name",
      "      - description",
      "      - status"
    );
  }
  lines.push("", "```", "");
  return lines.join("\n");
}

// src/modules/projects/createContainer.ts
var OWNERSHIP = [
  { label: "\u81EA\u5DF1\u505A\uFF08\u53EA\u6709\u6211\uFF0C\u4E0D\u6302\u4EFB\u4F55\u4EBA\uFF09" },
  {
    label: "\u548C\u522B\u4EBA\u4E00\u8D77\u505A\uFF08\u5199 with\uFF0C\u4E0D\u7B97\u5BA2\u6237\uFF09",
    link: { field: FIELDS.with, ask: "\u548C\u8C01\u4E00\u8D77\u505A\uFF1F", required: false }
  },
  {
    label: "\u5BA2\u6237\u59D4\u6258\u7684\uFF08\u5199 client\uFF0C\u6211\u6B20\u4ED6\u4E00\u4E2A\u4EA4\u4ED8\uFF09",
    link: { field: FIELDS.client, ask: "\u8FD9\u662F\u8C01\u59D4\u6258\u7684\uFF1F", required: true }
  }
];
var PROJECT_KIND = {
  label: "\u9879\u76EE",
  type: NOTE_TYPES.project,
  status: "active",
  folderKey: "projectFolder",
  folderFallback: FOLDERS.projects,
  asksOwnership: true
};
var AREA_KIND = {
  label: "\u9886\u57DF",
  type: NOTE_TYPES.area,
  folderKey: "areaFolder",
  folderFallback: FOLDERS.areas,
  asksOwnership: false
};
var BOOK_KIND = {
  label: "\u8BFB\u4E66\u7B14\u8BB0",
  type: NOTE_TYPES.book,
  status: "active",
  folderKey: "projectFolder",
  folderFallback: FOLDERS.projects,
  asksOwnership: false,
  sections: [{ heading: BOOK_HEADINGS.highlights }],
  baseViewName: "\u8BFB\u4E66\u5361\u7247"
};
async function createContainer(ctx, kind, preset, pickPerson2) {
  var _a, _b;
  const { app } = ctx;
  try {
    const settings = ctx.settings;
    const baseFolder = normalizeFolderPath(settings[kind.folderKey], kind.folderFallback);
    const nameInput = preset ? preset.name : await new TextInputModal(app, {
      title: `\u8BF7\u8F93\u5165\u65B0\u5EFA${kind.label}\u7684\u540D\u79F0`
    }).openAndGetValue();
    if (nameInput === null || !nameInput.trim()) {
      new import_obsidian31.Notice(`\u672A\u8F93\u5165${kind.label}\u540D\u79F0\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002`);
      return null;
    }
    const containerName = nameInput.trim();
    if (/[\\/]/.test(containerName)) {
      new import_obsidian31.Notice(`${kind.label}\u540D\u79F0\u4E0D\u80FD\u5305\u542B\u659C\u6760\u6216\u53CD\u659C\u6760\u3002`);
      return null;
    }
    let relation;
    if (kind.asksOwnership && !preset) {
      const ownership = await new ChoiceModal(app, {
        title: `\u8FD9\u4E2A${kind.label}\u662F\u8C01\u7684\uFF1F`,
        items: OWNERSHIP,
        labelOf: (item) => item.label
      }).openAndGetChoice();
      if (!ownership) {
        new import_obsidian31.Notice(`\u672A\u9009\u62E9${kind.label}\u5F52\u5C5E\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002`);
        return null;
      }
      if (ownership.link && pickPerson2) {
        const { field: field2, ask, required } = ownership.link;
        const person = await pickPerson2(ask);
        if (required && !person) {
          new import_obsidian31.Notice("\u672A\u9009\u62E9\u5BA2\u6237\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
          return null;
        }
        if (person) {
          relation = {
            field: field2,
            // 全路径消除人脉与客户目录里的同名歧义，别名仍让属性面板只显示姓名
            target: `${person.path.replace(/\.md$/i, "")}|${person.basename}`
          };
        }
      }
    }
    const descriptionInput = preset ? preset.description : await new TextInputModal(app, {
      title: `\u8BF7\u8F93\u5165${kind.label}\u6982\u8FF0`
    }).openAndGetValue();
    if (descriptionInput === null) {
      new import_obsidian31.Notice(`\u5DF2\u53D6\u6D88\u8F93\u5165${kind.label}\u6982\u8FF0\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002`);
      return null;
    }
    const description = descriptionInput.trim();
    const containerFolderPath = (0, import_obsidian31.normalizePath)(`${baseFolder}/${containerName}`);
    const mocBasename = mocBasenameOf(containerName);
    const mocFilePath = mocPathOf(containerFolderPath, containerName);
    await ensureFolderPath(app, baseFolder);
    await ensureFolderPath(app, containerFolderPath);
    const existingMocFile = app.vault.getAbstractFileByPath(mocFilePath);
    if (existingMocFile) {
      new import_obsidian31.Notice(`${kind.label} MOC \u7B14\u8BB0\u5DF2\u7ECF\u5B58\u5728\uFF0C\u672A\u6267\u884C\u8986\u76D6\uFF1A${mocFilePath}`);
      return null;
    }
    const { stamp: created, uid } = nowStampAndUid(settings.dateTimeFormat);
    const identity = {
      description,
      created,
      // 书籍预设带着 ISBN 进来时用它当 UID；其余一切情况仍是这一刻的 14 位时间戳
      uid: (_a = preset == null ? void 0 : preset.uid) != null ? _a : uid,
      type: kind.type,
      status: kind.status,
      // 作者只可能来自书籍预设；交互路径从不问它，undefined 时那一行整行不写
      author: preset == null ? void 0 : preset.author,
      aliases: preset == null ? void 0 : preset.aliases,
      tags: preset == null ? void 0 : preset.tags,
      source: preset == null ? void 0 : preset.source,
      bibliography: preset == null ? void 0 : preset.bibliography,
      relation
    };
    const mocMarkdown = mocContent({
      ...identity,
      mocBasename,
      projectFolderPath: containerFolderPath,
      // 预设带了小节就用预设的（书目信息已填好），否则用这一类容器的空骨架
      sections: (_b = preset == null ? void 0 : preset.sections) != null ? _b : kind.sections,
      baseViewName: kind.baseViewName
    });
    const frontmatter = mocFrontmatter(identity);
    ctx.guard.mark(mocFilePath);
    const mocFile = await app.vault.create(mocFilePath, mocMarkdown);
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(mocFile, {
      active: true,
      state: {
        mode: "source"
      }
    });
    if (leaf.view instanceof import_obsidian31.MarkdownView) {
      const editor = leaf.view.editor;
      const secondBlankLine = frontmatter.split("\n").length + 1;
      const cursorPosition = {
        line: secondBlankLine,
        ch: 0
      };
      editor.setCursor(cursorPosition);
      editor.focus();
      if (typeof editor.scrollIntoView === "function") {
        editor.scrollIntoView(
          {
            from: cursorPosition,
            to: cursorPosition
          },
          true
        );
      }
    }
    new import_obsidian31.Notice(`${kind.label}\u5DF2\u521B\u5EFA\uFF1A${containerName}`);
    return mocFile;
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian31.Notice(`\u521B\u5EFA${kind.label}\u5931\u8D25\uFF1A${message2}`);
    return null;
  }
}

// src/modules/projects/createArea.ts
async function createArea(ctx) {
  return createContainer(ctx, AREA_KIND);
}
function registerCreateAreaCommand(ctx) {
  ctx.commands.register(PROJECT_COMMANDS.area, () => {
    void createArea(ctx);
  });
}

// src/modules/eternal/export.ts
var import_obsidian32 = require("obsidian");

// src/modules/eternal/manifest.ts
var FENCE3 = "```";
var KIND_LABELS = {
  [NOTE_TYPES.project]: "\u9879\u76EE",
  [NOTE_TYPES.book]: "\u4E66"
};
var UID_PREFIX = "UID ";
function manifestLine(entry) {
  const box = entry.done ? "- [x] " : "- [ ] ";
  const fields = [
    entry.stamp,
    entry.kindLabel,
    `[[${entry.name}]]`,
    `\`${entry.folderPath}\``,
    `${UID_PREFIX}${entry.uid}`
  ];
  return box + fields.join(EXPORT_MANIFEST_SEPARATOR);
}
function manifestSkeleton(eternalVaultName) {
  return [
    "---",
    "type: ziminos-export-manifest",
    "---",
    "",
    "# \u8D5B\u535A\u6C38\u751F\u51FA\u5E93\u5355",
    "",
    `\u4E0B\u9762\u6BCF\u4E00\u884C\u662F\u4E00\u4E2A**\u5DF2\u7ECF\u5B8C\u6210\u5E76\u5F52\u6863**\u3001\u4F46\u8FD8\u6CA1\u642C\u8FDB\u300A${eternalVaultName}\u300B\u7684\u9879\u76EE\u6216\u4E66\u3002`,
    "",
    "\u4F60\u4E0D\u7528\u7BA1\u5B83\u3002\u4E0B\u6B21\u548C\u684C\u9762\u667A\u80FD\u4F53\u8BF4\u8BDD\u65F6\uFF0C\u5B83\u4F1A\u628A\u8FD9\u4E9B\u9879\u76EE\u642C\u8FC7\u53BB\u3001\u63D0\u70BC\u6210\u77E5\u8BC6\uFF0C",
    "\u7136\u540E\u628A\u8FD9\u91CC\u5BF9\u5E94\u7684\u90A3\u4E00\u884C\u52FE\u4E0A\u3002\u60F3\u624B\u52A8\u8DF3\u8FC7\u67D0\u4E00\u884C\uFF0C\u81EA\u5DF1\u52FE\u6389\u5C31\u884C\u3002",
    "",
    "\u5220\u6389\u8FD9\u7BC7\u7B14\u8BB0\u662F\u5B89\u5168\u7684\uFF1A\u4E22\u6389\u7684\u53EA\u662F\u8FD9\u5F20\u5F85\u529E\u6E05\u5355\uFF0C\u9879\u76EE\u672C\u8EAB\u597D\u597D\u5F85\u5728\u5F52\u6863\u76EE\u5F55\u91CC\u3002",
    "",
    // 汇总在上、流水在下，与灵感集同一套画法：一进来先知道欠了几笔，再往下看是哪几笔
    `${FENCE3}${VIEW_BLOCK_LANG}`,
    "\u5F85\u642C\u8FD0",
    FENCE3,
    "",
    EXPORT_MANIFEST_HEADING,
    "",
    ""
  ].join("\n");
}
var TASK_LINE = /^\s*-\s*\[([ xX])\]\s*(.*)$/;
function parseManifestLine(line) {
  var _a, _b;
  const matched = TASK_LINE.exec(line);
  if (!matched) return null;
  const done = ((_a = matched[1]) == null ? void 0 : _a.toLowerCase()) === "x";
  const body = (_b = matched[2]) != null ? _b : "";
  const uidMarker = `${EXPORT_MANIFEST_SEPARATOR}${UID_PREFIX}`;
  const uidAt = body.lastIndexOf(uidMarker);
  if (uidAt < 0) return null;
  const uid = body.slice(uidAt + uidMarker.length).trim();
  if (!uid) return null;
  const beforeUid = body.slice(0, uidAt);
  const folderMarker = `${EXPORT_MANIFEST_SEPARATOR}\``;
  const folderAt = beforeUid.lastIndexOf(folderMarker);
  if (folderAt < 0) return null;
  const prefix = beforeUid.slice(0, folderAt);
  const firstSeparatorAt = prefix.indexOf(EXPORT_MANIFEST_SEPARATOR);
  const secondSeparatorAt = prefix.indexOf(
    EXPORT_MANIFEST_SEPARATOR,
    firstSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length
  );
  if (firstSeparatorAt < 0 || secondSeparatorAt < 0) return null;
  const stamp = prefix.slice(0, firstSeparatorAt).trim();
  const kindLabel = prefix.slice(firstSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length, secondSeparatorAt).trim();
  const name = prefix.slice(secondSeparatorAt + EXPORT_MANIFEST_SEPARATOR.length).trim();
  const folderPath = beforeUid.slice(folderAt + EXPORT_MANIFEST_SEPARATOR.length).trim();
  return {
    done,
    stamp,
    kindLabel,
    name: stripLink(name),
    folderPath: stripCode(folderPath),
    uid
  };
}
function stripLink(field2) {
  var _a, _b, _c;
  const matched = /^\[\[(.+)\]\]$/.exec(field2);
  return (_c = (_b = (_a = matched == null ? void 0 : matched[1]) == null ? void 0 : _a.split("|")[0]) == null ? void 0 : _b.trim()) != null ? _c : field2;
}
function stripCode(field2) {
  var _a, _b;
  const matched = /^`(.+)`$/.exec(field2);
  return (_b = (_a = matched == null ? void 0 : matched[1]) == null ? void 0 : _a.trim()) != null ? _b : field2;
}

// src/modules/eternal/export.ts
var STAMP_FORMAT = "YYYY-MM-DD HH:mm";
function createExportHook(ctx) {
  return (container) => {
    void recordExport(ctx, container);
  };
}
async function recordExport(ctx, container) {
  var _a;
  try {
    const layout = ctx.edition.layout;
    if (ctx.edition.role !== "human" || !layout) return;
    if (!container.uid) {
      new import_obsidian32.Notice(
        `\u300A${container.name}\u300B\u6CA1\u6709 UID\uFF0C\u6682\u65F6\u6CA1\u6CD5\u9001\u8FDB\u300A${layout.eternal}\u300B\u3002\u5728\u5B83\u7684 MOC \u91CC\u8865\u4E00\u4E2A UID \u518D\u5F52\u6863\u4E00\u6B21\u5373\u53EF\u3002`
      );
      return;
    }
    const content = await readOrCreateManifest(ctx, layout.eternal);
    if (alreadyListed(content, container.uid)) return;
    const line = manifestLine({
      done: false,
      stamp: nowStamp(STAMP_FORMAT),
      kindLabel: (_a = KIND_LABELS[container.kind]) != null ? _a : container.kind,
      name: container.name,
      folderPath: container.folderPath,
      uid: container.uid
    });
    const next = insertIntoSection(content, EXPORT_MANIFEST_HEADING, line);
    await writeManifest(ctx, next);
    new import_obsidian32.Notice(`\u5DF2\u8BB0\u8FDB\u51FA\u5E93\u5355\uFF1A\u4E0B\u6B21\u548C\u667A\u80FD\u4F53\u8BF4\u8BDD\u65F6\uFF0C\u300A${container.name}\u300B\u4F1A\u642C\u8FDB\u300A${layout.eternal}\u300B\u3002`);
  } catch (error) {
    new import_obsidian32.Notice(`\u51FA\u5E93\u5355\u6CA1\u8BB0\u6210\uFF08\u9879\u76EE\u5DF2\u7ECF\u6B63\u5E38\u5F52\u6863\uFF09\uFF1A${message(error)}`);
  }
}
async function readOrCreateManifest(ctx, eternalVaultName) {
  const file = ctx.app.vault.getAbstractFileByPath(EXPORT_MANIFEST_FILE);
  if (file instanceof import_obsidian32.TFile) return ctx.app.vault.read(file);
  await ensureFolderPath(ctx.app, FOLDERS.system);
  return manifestSkeleton(eternalVaultName);
}
async function writeManifest(ctx, content) {
  const file = ctx.app.vault.getAbstractFileByPath(EXPORT_MANIFEST_FILE);
  ctx.guard.mark(EXPORT_MANIFEST_FILE);
  if (file instanceof import_obsidian32.TFile) {
    await ctx.app.vault.modify(file, content);
    return;
  }
  await ctx.app.vault.create(EXPORT_MANIFEST_FILE, content);
}
function alreadyListed(content, uid) {
  return content.split("\n").some((line) => {
    var _a;
    return ((_a = parseManifestLine(line)) == null ? void 0 : _a.uid) === uid;
  });
}
function message(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/modules/eternal/views.ts
var import_obsidian33 = require("obsidian");
var MAX_ROWS2 = 20;
var FALLBACK_ETERNAL_NAME = "\u8D5B\u535A\u6C38\u751F";
var pendingHandover = {
  name: "\u5F85\u642C\u8FD0",
  render: async (view) => {
    var _a, _b;
    const eternalName = (_b = (_a = view.ctx.edition.layout) == null ? void 0 : _a.eternal) != null ? _b : FALLBACK_ETERNAL_NAME;
    const content = await readNote(view, EXPORT_MANIFEST_FILE);
    if (content === null) {
      renderEmpty(
        view.el,
        `\u8FD8\u6CA1\u6709\u9879\u76EE\u5B8C\u6210\u8FC7\u3002\u5B8C\u6210\u7B2C\u4E00\u4E2A\u9879\u76EE\u5E76\u5F52\u6863\u4E4B\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5217\u51FA\u7B49\u7740\u642C\u8FDB\u300A${eternalName}\u300B\u7684\u4E1C\u897F\u3002`
      );
      return;
    }
    const pending2 = parseEntries(content).filter((entry) => !entry.done);
    if (pending2.length === 0) {
      renderSummary(view.el, "\u90FD\u642C\u5B8C\u4E86\u3002");
      renderEmpty(view.el, "\u65B0\u5B8C\u6210\u7684\u9879\u76EE\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\uFF0C\u4E0D\u9700\u8981\u4F60\u505A\u4EFB\u4F55\u767B\u8BB0\u3002");
      return;
    }
    renderSummary(view.el, `${pending2.length} \u4E2A\u5DF2\u5B8C\u6210\u7684\u9879\u76EE\u7B49\u7740\u642C\u8FDB\u300A${eternalName}\u300B\u3002`);
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u9879\u76EE", "\u7C7B\u578B", "\u5F52\u6863\u4E8E"],
      pending2.slice(0, MAX_ROWS2).map((entry) => [
        linkTo(view, entry.name),
        entry.kindLabel || "\u2014",
        entry.stamp || "\u2014"
      ]),
      0
    );
    if (pending2.length > MAX_ROWS2) {
      renderNote(view.el, `\u2026\u53E6\u6709 ${pending2.length - MAX_ROWS2} \u4E2A\u4E5F\u5728\u7B49\u7740`);
    }
  }
};
var humanEternalViews = [pendingHandover];
var pendingIngest = {
  name: "\u5F85\u63D0\u70BC",
  render: async (view) => {
    const raws = rawContainers(view);
    if (raws.length === 0) {
      renderEmpty(
        view.el,
        "\u539F\u6599\u5C42\u8FD8\u662F\u7A7A\u7684\u3002\u5728\u300A\u4EE5\u4EBA\u4E3A\u672C\u300B\u91CC\u5B8C\u6210\u4E00\u4E2A\u9879\u76EE\u5E76\u5F52\u6863\uFF0C\u4E0B\u6B21\u548C\u667A\u80FD\u4F53\u8BF4\u8BDD\u65F6\u5B83\u4F1A\u628A\u9879\u76EE\u642C\u8FDB\u6765\u3002"
      );
      return;
    }
    const ingested = await ingestedUids(view);
    const pending2 = raws.filter((file) => {
      const uid = fieldOf(view, file, FIELDS.uid);
      return uid === "" || !ingested.has(uid);
    });
    if (pending2.length === 0) {
      renderSummary(view.el, `${raws.length} \u4EFD\u539F\u6599\u5168\u90E8\u63D0\u70BC\u8FC7\u4E86\u3002`);
      renderEmpty(view.el, "\u65B0\u642C\u8FDB\u6765\u7684\u9879\u76EE\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\u3002");
      return;
    }
    renderSummary(view.el, `${pending2.length} / ${raws.length} \u4EFD\u539F\u6599\u8FD8\u6CA1\u63D0\u70BC\u3002`);
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u539F\u6599", "\u7C7B\u578B", "\u5F52\u6863\u4E8E"],
      pending2.slice(0, MAX_ROWS2).map((file) => [
        noteLink(file),
        kindLabelOf(view, file),
        fieldOf(view, file, FIELDS.archived) || "\u2014"
      ]),
      0
    );
    if (pending2.length > MAX_ROWS2) {
      renderNote(view.el, `\u2026\u53E6\u6709 ${pending2.length - MAX_ROWS2} \u4EFD\u539F\u6599\u4E5F\u5728\u7B49\u7740`);
    }
  }
};
var eternalRawViews = [pendingIngest];
function parseEntries(content) {
  const entries = [];
  for (const line of proseLines(content)) {
    const entry = parseManifestLine(line);
    if (entry) entries.push(entry);
  }
  return entries;
}
function* proseLines(content) {
  let fenced = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) yield line;
  }
}
function rawContainers(view) {
  return view.index.allNotes().filter((file) => isInFolder(file.path, ETERNAL_FOLDERS.raw)).filter(
    (file) => fieldOf(view, file, FIELDS.uid) !== "" && fieldOf(view, file, FIELDS.type) !== ""
  );
}
async function ingestedUids(view) {
  const content = await readNote(view, ETERNAL_LOG_FILE);
  const uids = /* @__PURE__ */ new Set();
  if (content === null) return uids;
  for (const line of proseLines(content)) {
    if (!ETERNAL_LOG_INGEST_MARKS.some((mark) => line.includes(mark))) continue;
    for (const matched of line.matchAll(/\d{8,}/g)) {
      uids.add(matched[0]);
    }
  }
  return uids;
}
async function readNote(view, path) {
  const file = view.ctx.app.vault.getAbstractFileByPath(path);
  return file instanceof import_obsidian33.TFile ? view.ctx.app.vault.read(file) : null;
}
function linkTo(view, name) {
  const file = view.index.resolve(name, view.sourcePath);
  return file ? noteLink(file, name) : name;
}
function kindLabelOf(view, file) {
  var _a;
  const type = fieldOf(view, file, FIELDS.type);
  return (_a = KIND_LABELS[type]) != null ? _a : type || "\u2014";
}
function fieldOf(view, file, field2) {
  return toText(view.index.fieldOf(file, field2)).trim();
}

// src/modules/projects/createProject.ts
async function createProject(ctx, preset, pickPerson2) {
  return createContainer(ctx, PROJECT_KIND, preset, pickPerson2);
}
function registerCreateProjectCommand(ctx, pickPerson2) {
  ctx.commands.register(PROJECT_COMMANDS.create, () => {
    void createProject(ctx, void 0, pickPerson2);
  });
}

// src/modules/projects/seed.ts
function projectsSeed() {
  return {
    folders: [],
    notes: [
      { path: TEMPLATE_FILES.card, content: cardTemplateFile() },
      { path: TEMPLATE_FILES.moc, content: mocTemplateFile() },
      { path: NAV_FILE, content: navContent() }
    ]
  };
}

// src/modules/projects/transitions.ts
var import_obsidian34 = require("obsidian");
var MOVABLE_TYPES = CONTAINER_TYPES;
var CONFIRM_MODAL_CLASS = "qa-project-transition-confirm";
var ARCHIVE_HANDOVER_STATUS = TRANSITIONS.done.status;
function registerTransitionCommands(ctx, onArchived) {
  for (const command of TRANSITION_COMMANDS) {
    ctx.commands.register(command, () => {
      void runProjectTransition(ctx, command.action, onArchived);
    });
  }
}
async function runProjectTransition(ctx, action, onArchived) {
  try {
    const transition = TRANSITIONS[action];
    if (!transition) {
      new import_obsidian34.Notice(`\u672A\u77E5\u7684\u9879\u76EE\u6D41\u8F6C\u52A8\u4F5C\uFF1A${action}`);
      return;
    }
    const plan = resolveTransitionPlan(ctx, transition);
    if (!plan) return;
    const confirmed = await showProjectTransitionConfirm(ctx.app, plan);
    if (!confirmed) return;
    const basePathChanged = await applyTransition(ctx, plan);
    await reopenMovedMoc(ctx, plan.targetMocPath);
    if (!basePathChanged) {
      new import_obsidian34.Notice(
        "\u9879\u76EE\u6D41\u8F6C\u6210\u529F\uFF0C\u4F46 MOC\uFF08\u9879\u76EE\u5BFC\u822A\u7B14\u8BB0\uFF09\u4E2D\u6CA1\u6709\u627E\u5230\u9700\u8981\u66F4\u65B0\u7684 file.folder\uFF08\u6587\u4EF6\u5939\uFF09\u7B5B\u9009\u6761\u4EF6\u3002"
      );
    }
    new import_obsidian34.Notice(
      `\u9879\u76EE\u5DF2${transition.label}\uFF1A${plan.projectName} \u2192 ${formatStatusForDisplay(transition.status)}`
    );
    if (onArchived && transition.status === ARCHIVE_HANDOVER_STATUS) {
      onArchived({
        name: plan.projectName,
        kind: plan.containerType,
        mocPath: plan.targetMocPath,
        folderPath: plan.targetProjectPath,
        uid: plan.uid
      });
    }
  } catch (error) {
    new import_obsidian34.Notice(`\u9879\u76EE\u72B6\u6001\u6D41\u8F6C\u5931\u8D25\uFF1A${getErrorMessage(error)}`);
  }
}
function resolveTransitionPlan(ctx, transition) {
  var _a;
  const { app, settings } = ctx;
  const activeFolder = normalizeFolderPath(settings.projectFolder, DEFAULT_SETTINGS.projectFolder);
  const archiveFolder = normalizeFolderPath(settings.archiveFolder, DEFAULT_SETTINGS.archiveFolder);
  if (activeFolder === archiveFolder) {
    new import_obsidian34.Notice("\u9879\u76EE\u76EE\u5F55\u548C\u5F52\u6863\u76EE\u5F55\u4E0D\u80FD\u8BBE\u7F6E\u4E3A\u540C\u4E00\u8DEF\u5F84\u3002");
    return null;
  }
  const sourceRoot = transition.source === "active" ? activeFolder : archiveFolder;
  const targetRoot = transition.target === "active" ? activeFolder : archiveFolder;
  const mocFile = app.workspace.getActiveFile();
  if (!(mocFile instanceof import_obsidian34.TFile) || mocFile.extension !== "md") {
    new import_obsidian34.Notice("\u8BF7\u5148\u6253\u5F00\u9700\u8981\u8FDB\u884C\u72B6\u6001\u6D41\u8F6C\u7684\u9879\u76EE MOC\u3002");
    return null;
  }
  const projectFolder = mocFile.parent;
  if (!(projectFolder instanceof import_obsidian34.TFolder)) {
    new import_obsidian34.Notice("\u65E0\u6CD5\u8BC6\u522B\u5F53\u524D\u9879\u76EE\u6587\u4EF6\u5939\u3002");
    return null;
  }
  const projectName = projectFolder.name;
  const sourceProjectPath = (0, import_obsidian34.normalizePath)(`${sourceRoot}/${projectName}`);
  const expectedMocPath = resolveMocPath(app, sourceProjectPath, projectName);
  if ((0, import_obsidian34.normalizePath)(mocFile.path) !== expectedMocPath) {
    new import_obsidian34.Notice(`\u5F53\u524D\u547D\u4EE4\u53EA\u80FD\u5728\u4EE5\u4E0B\u9879\u76EE MOC \u4E2D\u6267\u884C\uFF1A${expectedMocPath}`);
    return null;
  }
  const frontmatter = (_a = app.metadataCache.getFileCache(mocFile)) == null ? void 0 : _a.frontmatter;
  const type = normalizeText(frontmatter == null ? void 0 : frontmatter.type);
  const currentStatus = normalizeText(frontmatter == null ? void 0 : frontmatter.status);
  if (!MOVABLE_TYPES.includes(type)) {
    new import_obsidian34.Notice("\u5F53\u524D\u7B14\u8BB0\u4E0D\u662F\u9879\u76EE\u6216\u8BFB\u4E66\u7B14\u8BB0 MOC\uFF1A\u7F3A\u5C11 type: project\uFF08\u9879\u76EE\uFF09\u6216 type: book\uFF08\u4E66\uFF09\u3002");
    return null;
  }
  if (!transition.allowedStatuses.includes(currentStatus)) {
    new import_obsidian34.Notice(
      `\u9879\u76EE\u5F53\u524D\u72B6\u6001\u4E3A\u201C${formatStatusForDisplay(currentStatus)}\u201D\uFF0C\u4E0D\u80FD\u6267\u884C\u201C${transition.label}\u201D\u64CD\u4F5C\u3002`
    );
    return null;
  }
  const targetProjectPath = (0, import_obsidian34.normalizePath)(`${targetRoot}/${projectName}`);
  const targetMocPath = (0, import_obsidian34.normalizePath)(`${targetProjectPath}/${mocFile.name}`);
  const existingTarget = app.vault.getAbstractFileByPath(targetProjectPath);
  if (existingTarget) {
    new import_obsidian34.Notice(`\u76EE\u6807\u4F4D\u7F6E\u5DF2\u7ECF\u5B58\u5728\u540C\u540D\u9879\u76EE\uFF0C\u64CD\u4F5C\u5DF2\u505C\u6B62\uFF1A${targetProjectPath}`);
    return null;
  }
  return {
    transition,
    projectFolder,
    projectName,
    currentStatus,
    previousArchived: frontmatter == null ? void 0 : frontmatter[FIELDS.archived],
    sourceProjectPath,
    targetRoot,
    targetProjectPath,
    targetMocPath,
    expectedMocPath,
    containerType: type,
    uid: normalizeText(frontmatter == null ? void 0 : frontmatter[FIELDS.uid])
  };
}
async function applyTransition(ctx, plan) {
  const { app, guard } = ctx;
  const original = {
    status: plan.currentStatus,
    archived: plan.previousArchived
  };
  const trace = {
    frontmatterVisited: false,
    basePathChanged: false
  };
  await ensureFolderPath(app, plan.targetRoot);
  try {
    markFolderTree(ctx, plan.projectFolder, plan.targetProjectPath);
    await app.fileManager.renameFile(plan.projectFolder, plan.targetProjectPath);
    const movedMoc = app.vault.getAbstractFileByPath(plan.targetMocPath);
    if (!(movedMoc instanceof import_obsidian34.TFile)) {
      throw new Error(`\u79FB\u52A8\u540E\u6CA1\u6709\u627E\u5230\u9879\u76EE MOC\uFF1A${plan.targetMocPath}`);
    }
    guard.mark(movedMoc.path);
    await app.fileManager.processFrontMatter(movedMoc, (movedFrontmatter) => {
      original.status = normalizeText(movedFrontmatter.status);
      original.archived = movedFrontmatter[FIELDS.archived];
      trace.frontmatterVisited = true;
      if (!MOVABLE_TYPES.includes(normalizeText(movedFrontmatter.type))) {
        throw new Error("\u79FB\u52A8\u540E\u7684 MOC \u7F3A\u5C11 type: project\uFF08\u9879\u76EE\uFF09\u6216 type: book\uFF08\u4E66\uFF09\u3002");
      }
      if (!plan.transition.allowedStatuses.includes(original.status)) {
        throw new Error(
          `\u786E\u8BA4\u671F\u95F4\u9879\u76EE\u72B6\u6001\u5DF2\u53D8\u4E3A\u201C${formatStatusForDisplay(original.status)}\u201D\uFF0C\u672C\u6B21\u6D41\u8F6C\u5DF2\u505C\u6B62\u3002`
        );
      }
      movedFrontmatter.status = plan.transition.status;
      if (plan.transition.target === "archive") {
        movedFrontmatter[FIELDS.archived] = today();
      } else {
        delete movedFrontmatter[FIELDS.archived];
      }
    });
    return await updateMocBaseFolderPath(
      ctx,
      movedMoc,
      plan.sourceProjectPath,
      plan.targetProjectPath,
      () => {
        trace.basePathChanged = true;
      }
    );
  } catch (operationError) {
    const rollbackError = await rollbackTransition(ctx, plan, original, trace);
    if (rollbackError) {
      throw new Error(
        `${getErrorMessage(operationError)}\uFF1B\u81EA\u52A8\u56DE\u6EDA\u4E5F\u5931\u8D25\uFF1A${getErrorMessage(rollbackError)}`
      );
    }
    throw operationError;
  }
}
function markFolderTree(ctx, folder, targetPath) {
  const { guard } = ctx;
  const sourcePath = folder.path;
  guard.mark(sourcePath);
  guard.mark(targetPath);
  import_obsidian34.Vault.recurseChildren(folder, (child) => {
    if (!(child instanceof import_obsidian34.TFile)) return;
    const relativePath = child.path.slice(sourcePath.length + 1);
    guard.mark(child.path);
    guard.mark((0, import_obsidian34.normalizePath)(`${targetPath}/${relativePath}`));
  });
}
async function reopenMovedMoc(ctx, targetMocPath) {
  const movedMoc = ctx.app.vault.getAbstractFileByPath(targetMocPath);
  if (!(movedMoc instanceof import_obsidian34.TFile)) return;
  try {
    await ctx.app.workspace.getLeaf(false).openFile(movedMoc, { active: true });
  } catch (e) {
  }
}
async function updateMocBaseFolderPath(ctx, mocFile, oldProjectPath, newProjectPath, onChange) {
  const oldFilter = `file.folder == ${JSON.stringify(oldProjectPath)}`;
  const newFilter = `file.folder == ${JSON.stringify(newProjectPath)}`;
  let changed = false;
  await ctx.app.vault.process(mocFile, (content) => {
    if (!content.includes(oldFilter)) return content;
    changed = true;
    onChange == null ? void 0 : onChange();
    ctx.guard.mark(mocFile.path);
    return content.split(oldFilter).join(newFilter);
  });
  return changed;
}
async function rollbackTransition(ctx, plan, original, trace) {
  const { app, guard } = ctx;
  try {
    const sourceEntry = app.vault.getAbstractFileByPath(plan.sourceProjectPath);
    const targetEntry = app.vault.getAbstractFileByPath(plan.targetProjectPath);
    if (sourceEntry && targetEntry) {
      throw new Error("\u56DE\u6EDA\u65F6\u539F\u4F4D\u7F6E\u4E0E\u76EE\u6807\u4F4D\u7F6E\u540C\u65F6\u5B58\u5728\uFF0C\u5DF2\u505C\u6B62\u4EE5\u514D\u8986\u76D6\u4EFB\u4F55\u4E00\u8FB9");
    }
    if (!sourceEntry && !targetEntry) {
      throw new Error("\u56DE\u6EDA\u65F6\u539F\u4F4D\u7F6E\u4E0E\u76EE\u6807\u4F4D\u7F6E\u90FD\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5B9A\u4F4D\u9879\u76EE\u76EE\u5F55");
    }
    if (sourceEntry && !(sourceEntry instanceof import_obsidian34.TFolder)) {
      throw new Error(`\u56DE\u6EDA\u65F6\u539F\u4F4D\u7F6E\u4E0D\u662F\u9879\u76EE\u76EE\u5F55\uFF1A${plan.sourceProjectPath}`);
    }
    if (targetEntry) {
      if (!(targetEntry instanceof import_obsidian34.TFolder)) {
        throw new Error(`\u56DE\u6EDA\u65F6\u76EE\u6807\u4F4D\u7F6E\u4E0D\u662F\u9879\u76EE\u76EE\u5F55\uFF1A${plan.targetProjectPath}`);
      }
      markFolderTree(ctx, targetEntry, plan.sourceProjectPath);
      try {
        await app.fileManager.renameFile(targetEntry, plan.sourceProjectPath);
      } catch (renameError) {
        const restored = app.vault.getAbstractFileByPath(plan.sourceProjectPath);
        const remains = app.vault.getAbstractFileByPath(plan.targetProjectPath);
        if (!(restored instanceof import_obsidian34.TFolder) || remains) throw renameError;
      }
    }
    if (!trace.frontmatterVisited && !trace.basePathChanged) return null;
    const restoredMoc = app.vault.getAbstractFileByPath(plan.expectedMocPath);
    if (!(restoredMoc instanceof import_obsidian34.TFile)) {
      throw new Error(`\u56DE\u6EDA\u540E\u6CA1\u6709\u627E\u5230\u9879\u76EE MOC\uFF1A${plan.expectedMocPath}`);
    }
    if (trace.frontmatterVisited) {
      guard.mark(restoredMoc.path);
      await app.fileManager.processFrontMatter(restoredMoc, (frontmatter) => {
        frontmatter.status = original.status;
        if (original.archived === void 0) delete frontmatter[FIELDS.archived];
        else frontmatter[FIELDS.archived] = original.archived;
      });
    }
    if (trace.basePathChanged) {
      await updateMocBaseFolderPath(
        ctx,
        restoredMoc,
        plan.targetProjectPath,
        plan.sourceProjectPath
      );
    }
    return null;
  } catch (error) {
    return error;
  }
}
async function showProjectTransitionConfirm(app, plan) {
  return new Promise((resolve) => {
    new ProjectTransitionConfirmModal(app, plan, resolve).open();
  });
}
var ProjectTransitionConfirmModal = class extends import_obsidian34.Modal {
  constructor(app, plan, resolver) {
    super(app);
    /** 按钮结算与关闭结算都会走到 settle，用它保证只生效一次 */
    this.settled = false;
    this.plan = plan;
    this.resolver = resolver;
  }
  onOpen() {
    const { transition } = this.plan;
    this.containerEl.addClass(CONFIRM_MODAL_CLASS);
    this.modalEl.style.width = "520px";
    this.modalEl.style.maxWidth = "calc(100vw - 32px)";
    this.titleEl.setText(`\u786E\u8BA4${transition.label}\u9879\u76EE`);
    this.contentEl.empty();
    const description = this.contentEl.createEl("p", {
      text: "\u9879\u76EE\u6587\u4EF6\u5939\u5C06\u6574\u4F53\u79FB\u52A8\uFF0C\u5E76\u540C\u6B65\u66F4\u65B0 MOC\uFF08\u9879\u76EE\u5BFC\u822A\u7B14\u8BB0\uFF09\u72B6\u6001\u3002"
    });
    description.style.margin = "0 0 14px";
    description.style.color = "var(--text-muted)";
    description.style.lineHeight = "1.6";
    const summary = this.contentEl.createDiv();
    summary.style.padding = "12px 14px";
    summary.style.borderRadius = "10px";
    summary.style.background = "var(--background-secondary)";
    summary.style.border = "1px solid var(--background-modifier-border)";
    createModalInfoRow(summary, "\u9879\u76EE", this.plan.projectName, true);
    createModalInfoRow(
      summary,
      "\u72B6\u6001",
      `${formatStatusForDisplay(this.plan.currentStatus)}  \u2192  ${formatStatusForDisplay(transition.status)}`
    );
    const pathSection = summary.createDiv();
    pathSection.style.marginTop = "8px";
    pathSection.style.paddingTop = "8px";
    pathSection.style.borderTop = "1px solid var(--background-modifier-border)";
    createModalInfoRow(
      pathSection,
      "\u4ECE",
      `${this.plan.sourceProjectPath}\uFF08${getFolderTypeLabel(transition.source)}\uFF09`
    );
    createModalInfoRow(
      pathSection,
      "\u5230",
      `${this.plan.targetProjectPath}\uFF08${getFolderTypeLabel(transition.target)}\uFF09`
    );
    const buttonBar = this.contentEl.createDiv();
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "8px";
    buttonBar.style.marginTop = "18px";
    new import_obsidian34.ButtonComponent(buttonBar).setButtonText("\u53D6\u6D88").onClick(() => this.settle(false));
    const confirmButton = new import_obsidian34.ButtonComponent(buttonBar).setButtonText(`\u786E\u8BA4${transition.label}`).setCta().onClick(() => this.settle(true));
    confirmButton.buttonEl.focus();
  }
  onClose() {
    this.settle(false);
    this.contentEl.empty();
  }
  /** 唯一结算点，保证 Promise 只被兑现一次 */
  settle(value) {
    if (this.settled) return;
    this.settled = true;
    const resolve = this.resolver;
    this.resolver = null;
    if (resolve) resolve(value);
    this.close();
  }
};
function createModalInfoRow(parent, label, value, emphasize = false) {
  const row = parent.createDiv();
  row.style.display = "grid";
  row.style.gridTemplateColumns = "4em minmax(0, 1fr)";
  row.style.gap = "10px";
  row.style.alignItems = "start";
  row.style.padding = "5px 0";
  const labelElement = row.createDiv({ text: label });
  labelElement.style.color = "var(--text-muted)";
  const valueElement = row.createDiv({ text: value });
  valueElement.style.minWidth = "0";
  valueElement.style.overflowWrap = "anywhere";
  valueElement.style.lineHeight = "1.5";
  if (emphasize) {
    valueElement.style.fontWeight = "600";
    valueElement.style.color = "var(--text-normal)";
  }
}
function formatStatusForDisplay(status) {
  const normalizedStatus = normalizeText(status);
  if (!normalizedStatus) return "\u672A\u8BBE\u7F6E\uFF08\u7A7A\uFF09";
  return `${STATUS_LABELS[normalizedStatus] || "\u672A\u77E5\u72B6\u6001"}\uFF08${normalizedStatus}\uFF09`;
}
function getFolderTypeLabel(folderType) {
  return folderType === "active" ? "\u9879\u76EE\u76EE\u5F55" : "\u5F52\u6863\u76EE\u5F55";
}
function normalizeText(value) {
  return String(value != null ? value : "").trim().toLowerCase();
}
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/modules/projects/updatedMaintainer.ts
var import_obsidian35 = require("obsidian");
var UPDATED_DEBOUNCE_MS = 2e3;
var SYSTEM_PREFIX = `${FOLDERS.system}/`;
function registerUpdatedMaintainer(ctx) {
  const pendingTimeouts = /* @__PURE__ */ new Map();
  const applyUpdated = async (path) => {
    var _a;
    if (!ctx.settings.autoUpdated) return;
    if (path.startsWith(SYSTEM_PREFIX)) return;
    const file = ctx.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian35.TFile)) return;
    if (!((_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter)) return;
    ctx.guard.mark(path);
    await ctx.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.updated = nowStamp(ctx.settings.dateTimeFormat);
    });
  };
  const scheduleUpdate = (path) => {
    const pending2 = pendingTimeouts.get(path);
    if (pending2 !== void 0) window.clearTimeout(pending2);
    const timeoutId = window.setTimeout(() => {
      pendingTimeouts.delete(path);
      void applyUpdated(path).catch(() => {
      });
    }, UPDATED_DEBOUNCE_MS);
    pendingTimeouts.set(path, timeoutId);
  };
  const cancelUpdate = (path) => {
    const pending2 = pendingTimeouts.get(path);
    if (pending2 === void 0) return;
    window.clearTimeout(pending2);
    pendingTimeouts.delete(path);
  };
  ctx.plugin.register(() => {
    for (const timeoutId of pendingTimeouts.values()) {
      window.clearTimeout(timeoutId);
    }
    pendingTimeouts.clear();
  });
  ctx.app.workspace.onLayoutReady(() => {
    ctx.plugin.registerEvent(
      ctx.app.vault.on("modify", (file) => {
        var _a;
        if (!ctx.settings.autoUpdated) {
          cancelUpdate(file.path);
          return;
        }
        if (!(file instanceof import_obsidian35.TFile) || file.extension !== "md") return;
        if (file.path.startsWith(SYSTEM_PREFIX)) {
          cancelUpdate(file.path);
          return;
        }
        if (ctx.guard.isRecent(file.path)) return;
        if (!((_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter)) {
          cancelUpdate(file.path);
          return;
        }
        scheduleUpdate(file.path);
      })
    );
  });
}

// src/modules/review/periodic.ts
var import_obsidian36 = require("obsidian");
function periodFolderOf(ctx, period) {
  const root = normalizeFolderPath(ctx.settings.diaryFolder, FOLDERS.diary);
  const leaf = period.folder.slice(FOLDERS.diary.length + 1);
  return `${root}/${leaf}`;
}
function diaryFolders(ctx) {
  const root = normalizeFolderPath(ctx.settings.diaryFolder, FOLDERS.diary);
  return [root, ...Object.values(PERIODS).map((period) => periodFolderOf(ctx, period))];
}
function periodOfFile(app, file) {
  var _a, _b, _c;
  const declaredType = String(
    (_c = (_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.type]) != null ? _c : ""
  ).trim();
  for (const period of Object.values(PERIODS)) {
    if (period.type === declaredType) return period;
  }
  for (const period of Object.values(PERIODS)) {
    if (periodStartOf(period, file.basename) !== null) return period;
  }
  return null;
}
function periodStartOfNote(app, file, period) {
  var _a, _b;
  const declared = dayText((_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.periodStart]);
  return declared != null ? declared : periodStartOf(period, file.basename);
}
var SCOPE_ALIASES = {
  \u5468: "weekly",
  \u6708: "monthly",
  \u5B63: "quarterly",
  \u5E74: "yearly"
};
function resolveScope(app, host, params) {
  var _a, _b;
  const aliasKey = SCOPE_ALIASES[(_a = params["\u8303\u56F4"]) != null ? _a : ""];
  const period = (_b = host ? periodOfFile(app, host) : null) != null ? _b : aliasKey ? PERIODS[aliasKey] : null;
  if (!period || !host) return null;
  const start = periodStartOfNote(app, host, period);
  if (!start) return null;
  return { period, start, end: shiftDay(start, 1, period.stepUnit) };
}
async function openPeriodNote(ctx, period, options) {
  var _a;
  try {
    const title = (options == null ? void 0 : options.day) ? titleOfDay(options.day, period) : currentPeriodTitle(period);
    if (!title) {
      new import_obsidian36.Notice(`\u65E0\u6CD5\u4ECE\u65E5\u671F ${(_a = options == null ? void 0 : options.day) != null ? _a : ""} \u5B9A\u4F4D${period.label}`);
      return null;
    }
    const folder = periodFolderOf(ctx, period);
    const path = `${folder}/${title}.md`;
    const existing = ctx.app.vault.getAbstractFileByPath(path);
    if (existing && !(existing instanceof import_obsidian36.TFile)) {
      new import_obsidian36.Notice(`\u540C\u540D\u7684\u4E0D\u662F\u7B14\u8BB0\u800C\u662F\u6587\u4EF6\u5939\uFF1A${path}`);
      return null;
    }
    const content = periodNoteContent(period, title, ctx.settings.dateTimeFormat);
    let file = existing;
    if (!file) {
      await ensureFolderPath(ctx.app, folder);
      ctx.guard.mark(path);
      file = await ctx.app.vault.create(path, content);
    } else if (file.stat.size === 0) {
      ctx.guard.mark(path);
      await ctx.app.vault.process(file, () => content);
    }
    if ((options == null ? void 0 : options.reveal) !== false) await ctx.app.workspace.getLeaf(false).openFile(file);
    return file;
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian36.Notice(`\u6253\u5F00${period.label}\u5931\u8D25\uFF1A${message2}`);
    return null;
  }
}
function registerPeriodicCommands(ctx, onDailyOpened) {
  for (const period of Object.values(PERIODS)) {
    ctx.commands.register(PERIOD_COMMANDS[period.key], () => {
      void (async () => {
        const file = await openPeriodNote(ctx, period);
        if (file && period.key === "daily") await (onDailyOpened == null ? void 0 : onDailyOpened(file));
      })();
    });
  }
}

// src/modules/review/projectViews.ts
var MAX_ROWS3 = 10;
var PERIOD_NAMES = {
  daily: "\u4ECA\u5929",
  weekly: "\u672C\u5468",
  monthly: "\u672C\u6708",
  quarterly: "\u672C\u5B63",
  yearly: "\u672C\u5E74"
};
var CLOSED_TITLES = [
  { status: "done", title: "\u2705 \u672C\u5E74\u5B8C\u6210" },
  { status: "dropped", title: "\u274C \u672C\u5E74\u653E\u5F03" },
  { status: "paused", title: "\u23F8 \u672C\u5E74\u6682\u505C" }
];
var projectActivity = {
  name: "\u9879\u76EE\u52A8\u6001",
  render: async (view) => {
    var _a, _b, _c, _d, _e, _f;
    const scope = resolveScope(view.ctx.app, view.host, view.params);
    if (!scope) {
      renderEmpty(view.el, "\u8FD9\u7BC7\u7B14\u8BB0\u7B97\u4E0D\u51FA\u5468\u671F\u5750\u6807\u3002\u7528\u300C\u6253\u5F00\u672C\u5468\u590D\u76D8\u300D\u5EFA\u7684\u7B14\u8BB0\uFF0C\u672C\u533A\u5757\u81EA\u52A8\u751F\u6548\u3002");
      return;
    }
    const periodName = (_a = PERIOD_NAMES[scope.period.key]) != null ? _a : "\u672C\u5468\u671F";
    const root = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
    const entries = /* @__PURE__ */ new Map();
    const within2 = (day) => !!day && day >= scope.start && day < scope.end;
    for (const file of view.index.allNotes()) {
      const folder = (_c = (_b = file.parent) == null ? void 0 : _b.path) != null ? _c : "";
      if (!isInFolder(folder, root) || folder === root) continue;
      const name = folder.slice(root.length + 1).split("/")[0];
      const entry = (_d = entries.get(name)) != null ? _d : {
        name,
        moc: null,
        status: "",
        born: 0,
        touched: 0,
        last: ""
      };
      if (CONTAINER_TYPES.includes(toText(view.index.fieldOf(file, FIELDS.type)))) {
        entry.moc = file;
        entry.status = toText(view.index.fieldOf(file, FIELDS.status));
      }
      const created = (_e = dayText(view.index.fieldOf(file, FIELDS.created))) != null ? _e : dayOfMillis(file.stat.ctime);
      const updated = (_f = dayText(view.index.fieldOf(file, FIELDS.updated))) != null ? _f : dayOfMillis(file.stat.mtime);
      if (within2(created)) {
        entry.born += 1;
        if (created > entry.last) entry.last = created;
      } else if (within2(updated)) {
        entry.touched += 1;
        if (updated > entry.last) entry.last = updated;
      }
      entries.set(name, entry);
    }
    const moving = [...entries.values()].filter((entry) => entry.born + entry.touched > 0);
    const orphans = moving.filter((entry) => !entry.moc);
    const counted = moving.filter((entry) => entry.moc).sort((left, right) => right.born + right.touched - (left.born + left.touched));
    if (!counted.length) {
      renderEmpty(view.el, `${periodName}\u6CA1\u6709\u9879\u76EE\u4EA7\u751F\u65B0\u589E\u6216\u6539\u52A8\u3002`);
      warnOrphans(view, orphans);
      return;
    }
    const totalBorn = counted.reduce((sum2, entry) => sum2 + entry.born, 0);
    const totalTouched = counted.reduce((sum2, entry) => sum2 + entry.touched, 0);
    renderSummary(
      view.el,
      `${periodName} **${counted.length}** \u4E2A\u9879\u76EE\u5728\u52A8\uFF0C\u5171\u65B0\u589E **${totalBorn}** \u7BC7\u3001\u6539\u52A8 **${totalTouched}** \u7BC7\u3002`
    );
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u9879\u76EE", "\u72B6\u6001", "\u65B0\u589E", "\u6539\u52A8", "\u6700\u8FD1"],
      counted.slice(0, MAX_ROWS3).map((entry) => [
        entry.moc ? noteLink(entry.moc, entry.name) : entry.name,
        entry.status || "\u2014",
        entry.born,
        entry.touched,
        entry.last || "\u2014"
      ])
    );
    if (counted.length > MAX_ROWS3) {
      renderNote(view.el, `\u2026\u53E6\u6709 ${counted.length - MAX_ROWS3} \u4E2A\u9879\u76EE${periodName}\u4E5F\u6709\u52A8\u9759`);
    }
    warnOrphans(view, orphans);
  }
};
function warnOrphans(view, orphans) {
  if (!orphans.length) return;
  renderNote(
    view.el,
    `\u26A0\uFE0F \u53E6\u6709 ${orphans.length} \u4E2A\u6587\u4EF6\u5939\u6709\u6539\u52A8\u4F46\u7F3A\u5C11\u540C\u540D\u7684 MOC\uFF08type \u4E3A project \u6216 book\uFF09\uFF0C\u672A\u8BA1\u5165\uFF1A${orphans.map((entry) => entry.name).join("\u3001")}`
  );
}
var finishedProjects = {
  name: "\u5B8C\u6210\u7684\u9879\u76EE",
  render: async (view) => {
    var _a;
    const scope = resolveScope(view.ctx.app, view.host, view.params);
    if (!scope) {
      renderEmpty(view.el, "\u8FD9\u7BC7\u7B14\u8BB0\u7B97\u4E0D\u51FA\u5468\u671F\u5750\u6807\u3002\u7528\u300C\u6253\u5F00\u672C\u6708\u590D\u76D8\u300D\u5EFA\u7684\u7B14\u8BB0\uFF0C\u672C\u533A\u5757\u81EA\u52A8\u751F\u6548\u3002");
      return;
    }
    const periodName = (_a = PERIOD_NAMES[scope.period.key]) != null ? _a : "\u672C\u5468\u671F";
    const finished = collectProjects(view).filter((project) => project.status === "done").filter((project) => !!project.closed && project.closed >= scope.start && project.closed < scope.end).sort((left, right) => String(left.closed).localeCompare(String(right.closed)));
    if (!finished.length) {
      renderEmpty(
        view.el,
        `${periodName}\u6CA1\u6709\u9879\u76EE\u5B8C\u6210\u5F52\u6863\u3002\uFF08\u53E3\u5F84\uFF1Astatus \u4E3A done\uFF0C\u4E14\u5F52\u6863\u65E5\u843D\u5728${periodName}\uFF09`
      );
      return;
    }
    const spans = finished.map((project) => daysBetween(project.born, project.closed)).filter((days) => days !== null);
    const average = spans.length ? `\uFF0C\u5E73\u5747\u5386\u65F6 **${Math.round(spans.reduce((sum2, days) => sum2 + days, 0) / spans.length)}** \u5929` : "";
    renderSummary(view.el, `${periodName}\u5B8C\u6210 **${finished.length}** \u4E2A\u9879\u76EE${average}\uFF1A`);
    renderTable(
      view.ctx.app,
      view.el,
      view.sourcePath,
      ["\u9879\u76EE", "\u5F00\u59CB", "\u5B8C\u6210", "\u5386\u65F6"],
      finished.map((project) => durationRow(project, project.closed))
    );
  }
};
var yearlyOverview = {
  name: "\u5E74\u5EA6\u5168\u666F",
  render: async (view) => {
    var _a, _b;
    const scope = resolveScope(view.ctx.app, view.host, view.params);
    if (!scope) {
      renderEmpty(view.el, "\u8FD9\u7BC7\u7B14\u8BB0\u7B97\u4E0D\u51FA\u5468\u671F\u5750\u6807\u3002\u7528\u300C\u6253\u5F00\u672C\u5E74\u590D\u76D8\u300D\u5EFA\u7684\u7B14\u8BB0\uFF0C\u672C\u533A\u5757\u81EA\u52A8\u751F\u6548\u3002");
      return;
    }
    const within2 = (day) => !!day && day >= scope.start && day < scope.end;
    const monthIndex = (day) => Number(day.slice(5, 7)) - 1;
    const year = scope.start.slice(0, 4);
    const born = [];
    const buckets = /* @__PURE__ */ new Map();
    const monthlyBorn = new Array(12).fill(0);
    const monthlyDone = new Array(12).fill(0);
    for (const project of collectProjects(view)) {
      if (within2(project.born)) {
        born.push(project);
        monthlyBorn[monthIndex(project.born)] += 1;
      }
      if (project.status !== "active" && within2(project.closed)) {
        const bucket = buckets.get(project.status);
        if (bucket) bucket.push(project);
        else buckets.set(project.status, [project]);
        if (project.status === "done") monthlyDone[monthIndex(project.closed)] += 1;
      }
      if (project.status === "active" && (!project.born || project.born < scope.end)) {
        const bucket = buckets.get("active");
        if (bucket) bucket.push(project);
        else buckets.set("active", [project]);
      }
    }
    const countOf = (status) => {
      var _a2, _b2;
      return (_b2 = (_a2 = buckets.get(status)) == null ? void 0 : _a2.length) != null ? _b2 : 0;
    };
    renderSummary(
      view.el,
      `**${year} \u5E74**\uFF1A\u65B0\u5F00 **${born.length}** \u4E2A \xB7 \u5B8C\u6210 **${countOf("done")}** \u4E2A \xB7 \u653E\u5F03 **${countOf("dropped")}** \u4E2A \xB7 \u6682\u505C **${countOf("paused")}** \u4E2A \xB7 \u4ECD\u5728\u8FDB\u884C **${countOf("active")}** \u4E2A`
    );
    renderMonthlyBars(view, monthlyBorn, monthlyDone);
    for (const { status, title } of CLOSED_TITLES) {
      renderClosedGroup(view, title, (_a = buckets.get(status)) != null ? _a : []);
    }
    renderActiveGroup(view, (_b = buckets.get("active")) != null ? _b : [], scope.end, year);
    if (!born.length && !buckets.size) {
      renderEmpty(view.el, "\u672C\u5E74\u6CA1\u6709\u4EFB\u4F55\u9879\u76EE\u8BB0\u5F55\u3002");
    }
  }
};
function renderMonthlyBars(view, monthlyBorn, monthlyDone) {
  const peak = Math.max(...monthlyBorn, ...monthlyDone, 1);
  const chart = view.el.createDiv();
  chart.style.cssText = "display:flex;align-items:flex-end;gap:4px;height:150px;margin:14px 0 6px;padding-bottom:24px;border-bottom:1px solid var(--background-modifier-border)";
  for (let month = 0; month < 12; month += 1) {
    const column = chart.createDiv();
    column.style.cssText = "flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative";
    const pair = column.createDiv();
    pair.style.cssText = "display:flex;align-items:flex-end;gap:2px;height:100%;width:100%;justify-content:center";
    addBar(pair, monthlyBorn[month], peak, "var(--text-accent)", `${month + 1} \u6708\u65B0\u5F00`);
    addBar(pair, monthlyDone[month], peak, "var(--color-green, #16a34a)", `${month + 1} \u6708\u5B8C\u6210`);
    const label = column.createDiv();
    label.style.cssText = "position:absolute;bottom:-21px;font-size:11px;color:var(--text-muted)";
    label.setText(String(month + 1));
  }
  renderNote(view.el, `\u5DE6\u67F1\uFF1D\u65B0\u5F00\u3000\u53F3\u67F1\uFF1D\u5B8C\u6210\u3000\u7EB5\u8F74\u5CF0\u503C ${peak}\u3000\u6A2A\u8F74\u4E3A\u6708\u4EFD`);
}
function addBar(parent, count, peak, color, label) {
  const bar = parent.createDiv();
  bar.style.cssText = `width:42%;height:${Math.round(count / peak * 100)}%;min-height:${count > 0 ? 3 : 0}px;background:${color};border-radius:2px 2px 0 0`;
  if (count > 0) bar.setAttribute("aria-label", `${label}\uFF1A${count}`);
}
function renderClosedGroup(view, title, list) {
  if (!list.length) return;
  const sorted = [...list].sort(
    (left, right) => String(left.closed).localeCompare(String(right.closed))
  );
  renderHeading(view.el, 4, `${title}\uFF08${list.length}\uFF09`);
  renderTable(
    view.ctx.app,
    view.el,
    view.sourcePath,
    ["\u9879\u76EE", "\u5F00\u59CB", "\u5F52\u6863", "\u5386\u65F6"],
    sorted.map((project) => durationRow(project, project.closed))
  );
}
function renderActiveGroup(view, list, end, year) {
  if (!list.length) return;
  const cutoff = today();
  const isPastYear = end <= cutoff;
  const sorted = [...list].sort(
    (left, right) => String(left.born).localeCompare(String(right.born))
  );
  renderHeading(view.el, 4, `\u{1F525} \u622A\u81F3\u4ECA\u65E5\u4ECD\u5728\u8FDB\u884C\uFF08${list.length}\uFF09`);
  if (isPastYear) {
    renderNote(
      view.el,
      `\u9879\u76EE\u72B6\u6001\u53EA\u6709\u5F53\u524D\u503C\uFF0C\u65E0\u6CD5\u56DE\u6EAF\u5230 ${year} \u5E74\u672B\uFF0C\u6B64\u5904\u663E\u793A\u7684\u662F\u6B64\u523B\u4ECD\u5728\u8FDB\u884C\u7684\u9879\u76EE\u3002`
    );
  }
  renderTable(
    view.ctx.app,
    view.el,
    view.sourcePath,
    ["\u9879\u76EE", "\u5F00\u59CB", "\u6700\u8FD1\u6539\u52A8", "\u5DF2\u8FDB\u884C"],
    sorted.map((project) => {
      var _a, _b;
      return [
        noteLink(project.file),
        (_a = project.born) != null ? _a : "\u2014",
        (_b = project.closed) != null ? _b : "\u2014",
        formatDays2(daysBetween(project.born, cutoff))
      ];
    })
  );
}
function collectProjects(view) {
  var _a, _b, _c;
  const projectRoot = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
  const archiveRoot = normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives);
  const collected = [];
  const containers = [];
  for (const type of CONTAINER_TYPES) {
    for (const file of view.index.notesOfType(type)) containers.push(file);
  }
  for (const file of containers) {
    if (!isInFolder(file.path, projectRoot) && !isInFolder(file.path, archiveRoot)) continue;
    collected.push({
      file,
      born: (_a = dayText(view.index.fieldOf(file, FIELDS.created))) != null ? _a : dayOfMillis(file.stat.ctime),
      // 归档日优先取状态流转命令写入的 archived；回落 updated 只为兼容 V2 之前建的项目
      closed: (_c = (_b = dayText(view.index.fieldOf(file, FIELDS.archived))) != null ? _b : dayText(view.index.fieldOf(file, FIELDS.updated))) != null ? _c : dayOfMillis(file.stat.mtime),
      status: toText(view.index.fieldOf(file, FIELDS.status)).toLowerCase()
    });
  }
  return collected;
}
function durationRow(project, endDay) {
  var _a;
  return [
    noteLink(project.file),
    (_a = project.born) != null ? _a : "\u2014",
    endDay != null ? endDay : "\u2014",
    formatDays2(daysBetween(project.born, endDay))
  ];
}
function formatDays2(days) {
  return days === null ? "\u2014" : `${days} \u5929`;
}
var reviewProjectViews = [
  projectActivity,
  finishedProjects,
  yearlyOverview
];

// src/modules/review/seed.ts
function reviewSeed(ctx) {
  return {
    folders: diaryFolders(ctx),
    notes: []
  };
}

// src/modules/review/theme.ts
var import_obsidian37 = require("obsidian");
var MESSAGES8 = {
  unchanged: "\u4E3B\u9898\u6CA1\u6709\u53D8\u5316\uFF08\u7559\u7A7A\u4E0D\u4F1A\u6E05\u6389\u5DF2\u7ECF\u5199\u597D\u7684\u4E3B\u9898\uFF09",
  donePrefix: "\u5DF2\u5199\u5165",
  failedPrefix: "\u5199\u4E3B\u9898\u5931\u8D25\uFF1A"
};
function registerThemeCommand(ctx) {
  ctx.commands.register(THEME_COMMAND, () => {
    void writeTheme(ctx);
  });
}
async function promptThemeIfMissing(ctx, file) {
  try {
    const current = themeOf(ctx, file);
    if (current) return;
    await promptAndWriteTheme(ctx, file, PERIODS.daily, current);
  } catch (error) {
    reportFailure(error);
  }
}
async function writeTheme(ctx) {
  try {
    const target = await resolveTarget(ctx);
    if (!target) return;
    const { file, period } = target;
    await promptAndWriteTheme(ctx, file, period, themeOf(ctx, file));
  } catch (error) {
    reportFailure(error);
  }
}
async function promptAndWriteTheme(ctx, file, period, current) {
  const answer = await new TextInputModal(ctx.app, {
    title: promptOf(period, file),
    placeholder: "\u4E00\u53E5\u8BDD\uFF0C\u5199\u7ED3\u8BBA\u4E0D\u5199\u8FC7\u7A0B",
    initial: current
  }).openAndGetValue();
  if (answer === null) return;
  const theme = answer.trim();
  if (!theme) {
    new import_obsidian37.Notice(MESSAGES8.unchanged);
    return;
  }
  ctx.guard.mark(file.path);
  await ctx.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter[FIELDS.theme] = theme;
  });
  new import_obsidian37.Notice(`${MESSAGES8.donePrefix}${period.label}\u4E3B\u9898\uFF1A${theme}`);
}
function themeOf(ctx, file) {
  var _a, _b, _c;
  return String(
    (_c = (_b = (_a = ctx.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[FIELDS.theme]) != null ? _c : ""
  ).trim();
}
function reportFailure(error) {
  const message2 = error instanceof Error ? error.message : String(error);
  new import_obsidian37.Notice(MESSAGES8.failedPrefix + message2);
}
async function resolveTarget(ctx) {
  const active = ctx.app.workspace.getActiveFile();
  if (active) {
    const period = periodOfFile(ctx.app, active);
    if (period) return { file: active, period };
  }
  const diary = await openPeriodNote(ctx, PERIODS.daily);
  return diary ? { file: diary, period: PERIODS.daily } : null;
}
function promptOf(period, file) {
  switch (period.key) {
    case "daily":
      return file.basename === today() ? "\u4ECA\u5929\u4E3B\u8981\u505A\u4E86\u4EC0\u4E48\uFF1F\uFF08\u5468\u590D\u76D8\u770B\u7684\u5C31\u662F\u5B83\uFF09" : `${file.basename} \u4E3B\u8981\u505A\u4E86\u4EC0\u4E48\uFF1F\uFF08\u5468\u590D\u76D8\u770B\u7684\u5C31\u662F\u5B83\uFF09`;
    case "weekly":
      return "\u672C\u5468\u4E3B\u9898\uFF1A\u8FD9\u5468\u4E3B\u8981\u63A8\u8FDB\u4E86\u54EA\u9879\u4EBA\u751F\u7BA1\u7406\u76EE\u6807\uFF1F";
    case "monthly":
      return "\u672C\u6708\u4E3B\u9898\uFF1A\u8FD9\u4E2A\u6708\u4E3B\u7EBF\u63A8\u8FDB\u5230\u54EA\u4E00\u6B65\u4E86\uFF1F";
    case "quarterly":
      return "\u5B63\u5EA6\u4E3B\u9898\uFF1A\u8FD9\u4E09\u4E2A\u6708\uFF0C\u4E3B\u7EBF\u4EFB\u52A1\u63A8\u8FDB\u4E86\u591A\u5C11\uFF1F";
    default:
      return "\u5E74\u5EA6\u4E3B\u9898\uFF1A\u7528\u4E00\u53E5\u8BDD\u6982\u62EC\u8FD9\u4E00\u5E74\u7684\u4E3B\u7EBF";
  }
}

// src/modules/review/views.ts
var MAX_ROWS4 = 12;
var CHILD_OF = {
  daily: null,
  weekly: "daily",
  monthly: "weekly",
  quarterly: "monthly",
  yearly: "monthly"
};
var MONTH_SPAN = { quarterly: 3, yearly: 12 };
var WEEKDAY_NAMES = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
var dailyOutput = {
  name: "\u4ECA\u65E5\u4EA7\u51FA",
  render: async (view) => {
    const day = view.host ? dayOfTitle(view.host.basename) : null;
    if (!day) {
      renderEmpty(view.el, "\u8FD9\u7BC7\u7B14\u8BB0\u7684\u6587\u4EF6\u540D\u4E0D\u662F YYYY-MM-DD\uFF0C\u62FF\u4E0D\u5230\u65E5\u671F\u3002\u7528\u300C\u6253\u5F00\u4ECA\u5929\u7684\u65E5\u8BB0\u300D\u5EFA\u7684\u7B14\u8BB0\uFF0C\u672C\u533A\u5757\u81EA\u52A8\u751F\u6548\u3002");
      return;
    }
    const folders = contentFolders(view);
    const created = [];
    const changed = [];
    for (const file of view.index.allNotes()) {
      if (!folders.some((folder) => isInFolder(file.path, folder))) continue;
      if (dayOf(view, file, FIELDS.created, file.stat.ctime) === day) {
        created.push(file);
        continue;
      }
      if (dayOf(view, file, FIELDS.updated, file.stat.mtime) === day) changed.push(file);
    }
    if (!created.length && !changed.length) {
      renderEmpty(view.el, "\u4ECA\u5929\u8FD8\u6CA1\u6709\u7B14\u8BB0\u4EA7\u51FA\u3002\u5728\u9879\u76EE\u76EE\u5F55\u91CC\u5199\u70B9\u4EC0\u4E48\uFF0C\u8FD9\u91CC\u4F1A\u81EA\u52A8\u957F\u51FA\u6765\u3002");
      return;
    }
    renderSummary(view.el, `\u65B0\u5EFA **${created.length}** \u7BC7 \xB7 \u6539\u52A8 **${changed.length}** \u7BC7`);
    const rows = [];
    collectRows(rows, "\u{1F195}", created, view);
    collectRows(rows, "\u270F\uFE0F", changed, view);
    renderTable(view.ctx.app, view.el, view.sourcePath, ["", "\u7B14\u8BB0", "\u6240\u5C5E"], rows, 1);
  }
};
function collectRows(rows, mark, files, view) {
  for (const file of files.slice(0, MAX_ROWS4)) {
    rows.push([mark, noteLink(file), originOf(view, file)]);
  }
  if (files.length > MAX_ROWS4) rows.push([mark, `\u2026\u53E6\u6709 ${files.length - MAX_ROWS4} \u7BC7`, ""]);
}
function originOf(view, file) {
  var _a, _b;
  const projects = normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects);
  const archives = normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives);
  const folder = (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "";
  if (isInFolder(folder, projects) && folder !== projects) {
    return folder.slice(projects.length + 1).split("/")[0];
  }
  if (isInFolder(folder, archives) && folder !== archives) {
    return `\u{1F4E6} ${folder.slice(archives.length + 1).split("/")[0]}`;
  }
  return folder.split("/")[0] || "\u6839\u76EE\u5F55";
}
function contentFolders(view) {
  return [
    FOLDERS.inbox,
    normalizeFolderPath(view.ctx.settings.projectFolder, FOLDERS.projects),
    normalizeFolderPath(view.ctx.settings.areaFolder, FOLDERS.areas),
    normalizeFolderPath(view.ctx.settings.archiveFolder, FOLDERS.archives)
  ];
}
function dayOf(view, file, field2, fallbackMillis) {
  var _a;
  return (_a = dayText(view.index.fieldOf(file, field2))) != null ? _a : dayOfMillis(fallbackMillis);
}
var themeChain = {
  name: "\u4E3B\u9898\u94FE",
  render: async (view) => {
    const scope = resolveScope(view.ctx.app, view.host, view.params);
    if (!scope) {
      renderEmpty(view.el, "\u8FD9\u7BC7\u7B14\u8BB0\u7B97\u4E0D\u51FA\u5468\u671F\u5750\u6807\uFF1A\u5B83\u4E0D\u662F\u590D\u76D8\u7B14\u8BB0\uFF0C\u6587\u4EF6\u540D\u4E5F\u4E0D\u662F\u672C\u7EA7\u683C\u5F0F\u3002\u7528\u300C\u6253\u5F00\u672C\u5468\u590D\u76D8\u300D\u5EFA\u7684\u7B14\u8BB0\uFF0C\u672C\u533A\u5757\u81EA\u52A8\u751F\u6548\u3002");
      return;
    }
    const childKey = CHILD_OF[scope.period.key];
    if (!childKey) {
      renderEmpty(view.el, "\u65E5\u8BB0\u4E0B\u9762\u6CA1\u6709\u66F4\u5C0F\u7684\u5468\u671F\u4E86\uFF0C\u4E3B\u9898\u94FE\u653E\u5728\u5468\u8BB0\u53CA\u4EE5\u4E0A\u624D\u6709\u5185\u5BB9\u3002");
      return;
    }
    const child = PERIODS[childKey];
    if (childKey === "daily") renderDays(view, child, scope.start);
    else if (childKey === "weekly") renderWeeks(view, child, scope);
    else renderMonths(view, child, scope);
  }
};
function renderDays(view, child, start) {
  const byTitle = notesByTitle(view, child);
  const rows = [];
  let filled = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const day = shiftDay(start, offset, "day");
    const note = byTitle.get(day);
    if (note) filled += 1;
    rows.push([
      note ? noteLink(note) : day.slice(5),
      `\u5468${WEEKDAY_NAMES[offset]}`,
      themeCell(view, note, "\uFF08\u65E0\u65E5\u8BB0\uFF09")
    ]);
  }
  renderTable(view.ctx.app, view.el, view.sourcePath, ["\u65E5\u671F", "\u661F\u671F", "\u5F53\u65E5\u4E3B\u9898"], rows, 2);
  renderNote(view.el, `\u672C\u5468 **${filled}/7** \u5929\u6709\u65E5\u8BB0\u3002`);
}
function renderWeeks(view, child, scope) {
  const weeks = [];
  for (const note of view.index.notesOfType(child.type)) {
    const weekStart = periodStartOfNote(view.ctx.app, note, child);
    if (!weekStart) continue;
    const thursday = shiftDay(weekStart, 3, "day");
    if (thursday < scope.start || thursday >= scope.end) continue;
    weeks.push({ start: weekStart, note });
  }
  if (!weeks.length) {
    renderEmpty(view.el, "\u672C\u6708\u8FD8\u6CA1\u6709\u5468\u8BB0\u3002\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u6253\u5F00\u672C\u5468\u590D\u76D8\u300D\u5199\u7B2C\u4E00\u7BC7\u3002");
    return;
  }
  weeks.sort((left, right) => left.start.localeCompare(right.start));
  renderTable(
    view.ctx.app,
    view.el,
    view.sourcePath,
    ["\u5468", "\u672C\u5468\u4E3B\u9898"],
    weeks.map((week) => [noteLink(week.note), themeCell(view, week.note, "")]),
    1
  );
}
function renderMonths(view, child, scope) {
  var _a, _b;
  const span = (_a = MONTH_SPAN[scope.period.key]) != null ? _a : 12;
  const byTitle = notesByTitle(view, child);
  const rows = [];
  let filled = 0;
  for (let offset = 0; offset < span; offset += 1) {
    const monthStart = shiftDay(scope.start, offset, "month");
    const title = (_b = titleOfDay(monthStart, child)) != null ? _b : monthStart;
    const note = byTitle.get(title);
    if (note) filled += 1;
    rows.push([note ? noteLink(note) : title, themeCell(view, note, "\uFF08\u65E0\u6708\u8BB0\uFF09")]);
  }
  renderTable(view.ctx.app, view.el, view.sourcePath, ["\u6708\u4EFD", "\u672C\u6708\u4E3B\u9898"], rows, 1);
  renderNote(
    view.el,
    `\u672C${scope.period.key === "quarterly" ? "\u5B63" : "\u5E74"} **${filled}/${span}** \u4E2A\u6708\u6709\u6708\u8BB0\u3002`
  );
}
function notesByTitle(view, period) {
  const map = /* @__PURE__ */ new Map();
  for (const note of view.index.notesOfType(period.type)) {
    map.set(note.basename, note);
  }
  return map;
}
function themeCell(view, note, missing) {
  if (!note) return missing;
  return toText(view.index.fieldOf(note, FIELDS.theme)) || "\uFF08\u672A\u5199\u4E3B\u9898\uFF09";
}
var reviewThemeViews = [dailyOutput, themeChain];

// src/modules/ribbon/dock.ts
var import_obsidian39 = require("obsidian");

// src/modules/ribbon/icons.ts
var import_obsidian38 = require("obsidian");
var GRID = 24;
var BOX = 100;
var STROKE = "var(--icon-stroke, 2)";
var CIRCLE = "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z";
var PANEL = "M7 3H17C19.2091 3 21 4.79086 21 7V17C21 19.2091 19.2091 21 17 21H7C4.79086 21 3 19.2091 3 17V7C3 4.79086 4.79086 3 7 3Z";
var CALENDAR = "M8 2V4.12777M8 6V4.12777M16 2V4.12777M16 6V4.12777M20.9597 10C21 10.7878 21 11.7554 21 13C21 15.7956 21 17.1935 20.5433 18.2961C19.9343 19.7663 18.7663 20.9343 17.2961 21.5433C16.1935 22 14.7956 22 12 22C9.20435 22 7.80653 22 6.7039 21.5433C5.23373 20.9343 4.06569 19.7663 3.45672 18.2961C3 17.1935 3 15.7956 3 13C3 11.7554 3 10.7878 3.0403 10M20.9597 10C20.9095 9.01824 20.7967 8.31564 20.5433 7.7039C19.9343 6.23373 18.7663 5.06569 17.2961 4.45672C16.9146 4.29871 16.4978 4.19536 16 4.12777M20.9597 10L3.0403 10M3.0403 10C3.09052 9.01824 3.20333 8.31564 3.45672 7.7039C4.06569 6.23373 5.23373 5.06569 6.7039 4.45672C7.08538 4.29871 7.50219 4.19536 8 4.12777M8 4.12777C8.94106 4 10.1716 4 12 4C13.8284 4 15.0589 4 16 4.12777";
var ARTWORK = {
  // ---------- 开荒 ----------
  /** 初始化笔记库：三层叠起来的骨架。开荒做的就是一次把层次铺好（Pikaicons 原图） */
  [COMMAND_ICONS.vault]: [
    "M21 12C20.8809 12.2538 20.5097 12.4413 19.7673 12.8164L13.4417 16.012C12.9131 16.279 12.6488 16.4125 12.3715 16.4651C12.126 16.5116 11.874 16.5116 11.6285 16.4651C11.3513 16.4125 11.0869 16.279 10.5583 16.012L4.23275 12.8164C3.49033 12.4413 3.11912 12.2538 3 12M21 16.5C20.8809 16.7538 20.5097 16.9413 19.7673 17.3164L13.4417 20.512C12.9131 20.779 12.6488 20.9125 12.3715 20.9651C12.126 21.0116 11.874 21.0116 11.6285 20.9651C11.3512 20.9125 11.0869 20.779 10.5583 20.512L4.23275 17.3164C3.49033 16.9413 3.11912 16.7538 3 16.5M13.4293 11.5471L19.7007 8.58144C20.4368 8.23337 20.8048 8.05933 20.9229 7.82383C21.0257 7.61888 21.0257 7.38112 20.9229 7.17617C20.8048 6.94067 20.4368 6.76663 19.7007 6.41856L13.4293 3.45291C12.9052 3.20508 12.6432 3.08117 12.3683 3.0324C12.1249 2.9892 11.8751 2.9892 11.6317 3.0324C11.3568 3.08117 11.0948 3.20508 10.5707 3.45291L4.29927 6.41856C3.56321 6.76663 3.19518 6.94067 3.07708 7.17617C2.97431 7.38112 2.97431 7.61888 3.07708 7.82383C3.19518 8.05933 3.56321 8.23337 4.29927 8.58144L10.5707 11.5471C11.0948 11.7949 11.3568 11.9188 11.6317 11.9676C11.8751 12.0108 12.1249 12.0108 12.3683 11.9676C12.6432 11.9188 12.9052 11.7949 13.4293 11.5471Z"
  ],
  // ---------- 项目 ----------
  /** 新建项目：插一面旗。项目与领域的区别就是它有终点，而旗子是插在终点上的（Pikaicons 原图） */
  [COMMAND_ICONS.project]: [
    "M5 3L5 21M6.4719 13.5167C8.2565 12.9141 10.2137 13.104 11.8491 14.0385C13.4338 14.9441 15.3231 15.1518 17.0666 14.6121L18.376 14.2068C18.747 14.092 19 13.7488 19 13.3604V4.48517C19 3.59568 17.3336 4.41833 16.9549 4.53557C15.2894 5.05107 13.4824 4.8202 12 3.90255C10.5176 2.98491 8.71058 2.75404 7.04513 3.26954L5.59885 3.71719C5.24278 3.82741 5 4.15669 5 4.52944V13.4561C5 14.2118 6.13797 13.6294 6.4719 13.5167Z"
  ],
  /**
   * 新建领域：一个闭合的环。
   *
   * 免费集里没有，照同一套画法补画，且刻意与旗子（新建项目）成一对反义词：
   * 旗子插在终点上，而领域没有终点——健康、手艺、人脉都是走完一圈又一圈的事。
   * 环用的正是那个半径 9 的公共圆，缺口开在右上，让它读成「循环」而不是「句号」。
   */
  [COMMAND_ICONS.area]: [
    "M20.49 15A9 9 0 1 1 21 12M21 4V9H16"
  ],
  /** 初始化当前卡片：一页笔记。它做的事就是把眼前这一页登记成卡片（Pikaicons 原图） */
  [COMMAND_ICONS.card]: [
    "M14 2.05752V3.2C14 4.88016 14 5.72024 14.327 6.36197C14.6146 6.92646 15.0735 7.3854 15.638 7.67302C16.2798 8 17.1198 8 18.8 8L19.9425 8M14 2.05752C13.6065 2 13.136 2 12.349 2H10.4C8.15979 2 7.03968 2 6.18404 2.43597C5.43139 2.81947 4.81947 3.43139 4.43597 4.18404C4 5.03969 4 6.15979 4 8.4V15.6C4 17.8402 4 18.9603 4.43597 19.816C4.81947 20.5686 5.43139 21.1805 6.18404 21.564C7.03968 22 8.15979 22 10.4 22H13.6C15.8402 22 16.9603 22 17.816 21.564C18.5686 21.1805 19.1805 20.5686 19.564 19.816C20 18.9603 20 17.8402 20 15.6V9.65097C20 8.864 20 8.39354 19.9425 8M14 2.05752C14.0957 2.07151 14.1869 2.0889 14.2769 2.11052C14.6851 2.20851 15.0753 2.37013 15.4331 2.58944C15.8368 2.83681 16.1827 3.18271 16.8745 3.87452L18.1255 5.12548C18.8173 5.81729 19.1632 6.16319 19.4106 6.56686C19.6299 6.92475 19.7915 7.31493 19.8895 7.72307C19.9111 7.81313 19.9285 7.90429 19.9425 8"
  ],
  /** 完成项目：圈里一个勾（Pikaicons 原图） */
  [COMMAND_ICONS.done]: [
    "M8.5 12.5124L10.8412 14.851C11.9672 12.8821 13.5256 11.1944 15.3987 9.91536L15.5 9.84619M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
  ],
  /** 暂停项目：圈里两竖。免费集里没有暂停，照圆底补画，圆与完成/放弃/重新开始共用同一个 */
  [COMMAND_ICONS.paused]: ["M10 9.5V14.5M14 9.5V14.5", CIRCLE],
  /** 放弃项目：圈里一个叉（Pikaicons 原图） */
  [COMMAND_ICONS.dropped]: [
    "M9.00006 15.0001L12.0001 12.0001M12.0001 12.0001L15.0001 9.00012M12.0001 12.0001L9.00006 9.00012M12.0001 12.0001L15.0001 15.0001M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
  ],
  /** 重新开始项目：圈里一个播放三角。三角的三个角都拿曲线收圆，才与圆头描边是同一套语言 */
  [COMMAND_ICONS.active]: [
    "M10.6 9.35C10.6 8.87 11.13 8.58 11.53 8.83L16.06 11.48C16.45 11.71 16.45 12.29 16.06 12.52L11.53 15.17C11.13 15.42 10.6 15.13 10.6 14.65V9.35Z",
    CIRCLE
  ],
  // ---------- 读书 ----------
  /**
   * 读一本书：摊开的书上方一道下行箭头。补画。
   *
   * 它是读书组的主干命令，图形因此必须与「新建读书笔记」有亲缘又分得清——
   * 书页复用同一条中缝与双页弧线，箭头表达的是「东西自己会进来」，
   * 那正是这条命令与手动建书的全部差别。
   */
  [COMMAND_ICONS.readBook]: [
    "M12 12.5V21",
    "M12 12.5C10.7 11.4 9 10.8 7.2 10.8H4.5C4 10.8 3.6 11.2 3.6 11.7V19.2C3.6 19.7 4 20.1 4.5 20.1H7.2C9 20.1 10.7 20.7 12 21",
    "M12 12.5C13.3 11.4 15 10.8 16.8 10.8H19.5C20 10.8 20.4 11.2 20.4 11.7V19.2C20.4 19.7 20 20.1 19.5 20.1H16.8C15 20.1 13.3 20.7 12 21",
    "M12 3V8.2M12 8.2L9.6 5.9M12 8.2L14.4 5.9"
  ],
  /**
   * 同步这本书的划线：一圈循环箭头围着一条被压住的行。补画。
   *
   * 循环取自「重新开始项目」那个圆，表达「再来一次」；
   * 中间那道短横是划线本身——这条命令重复按不出错，图形也该说出这一点。
   */
  [COMMAND_ICONS.syncHighlights]: [
    "M20.5 12A8.5 8.5 0 1 1 18 6M20.5 3.5V6.5H17.5",
    "M8.5 12H15.5"
  ],
  /**
   * 新建读书笔记：一本摊开的书。免费集里没有，照同一套画法补画。
   *
   * 摊开而不是合上，是因为这条命令建的是「正在读的这本」——
   * 合上的书在 18px 下与卡片（一页纸）几乎同形，而摊开的双页有一条中缝，一眼分得出。
   */
  [COMMAND_ICONS.book]: [
    "M12 6.5V20",
    "M12 6.5C10.5 5.2 8.6 4.5 6.5 4.5H4C3.44772 4.5 3 4.94772 3 5.5V17C3 17.5523 3.44772 18 4 18H6.5C8.6 18 10.5 18.7 12 20",
    "M12 6.5C13.5 5.2 15.4 4.5 17.5 4.5H20C20.5523 4.5 21 4.94772 21 5.5V17C21 17.5523 20.5523 18 20 18H17.5C15.4 18 13.5 18.7 12 20"
  ],
  /**
   * 导入读书划线：三行字里有一行被荧光笔压住。免费集里没有，补画。
   *
   * 画的是「划线」这件事本身而不是常见的下载箭头：箭头在 18px 下与任何一个
   * 「导入/保存/下载」都同形，而学员要认的是「这条命令处理的是我划过的那些句子」。
   * 被压住的那一行不再画字，只留高亮框——框里再塞一根线，两条线会在缩小后糊成一团。
   */
  [COMMAND_ICONS.highlights]: [
    "M4 5.5H20",
    "M4.5 9.5H19.5C20.0523 9.5 20.5 9.94772 20.5 10.5V13.5C20.5 14.0523 20.0523 14.5 19.5 14.5H4.5C3.94772 14.5 3.5 14.0523 3.5 13.5V10.5C3.5 9.94772 3.94772 9.5 4.5 9.5Z",
    "M4 18.5H16"
  ],
  /**
   * 摘成卡片：一张卡片，里面是一段引用（左边一条竖线，右边两行短横）。
   *
   * 外框复用 PANEL（与设置页边栏标签同一个方框），里面画的正是这条命令的产物——
   * 摘出来的卡片开头就是一个引用块，图标画的就是那张卡片本人。
   */
  [COMMAND_ICONS.excerpt]: [PANEL, "M8 8V16", "M11.5 10H16.5", "M11.5 14H16.5"],
  /**
   * 连接微信读书：一本书上挂一个链环。补画。
   *
   * 链环是「连上了」这件事最不会被误读的画法（比二维码、比微信图形都稳），
   * 而书页复用读书组同一条中缝——它属于这一组，只是做的是接线不是读书。
   */
  [COMMAND_ICONS.weread]: [
    "M12 4V13.5",
    "M12 4C10.8 3.1 9.2 2.6 7.5 2.6H5C4.4 2.6 4 3 4 3.6V11.6C4 12.2 4.4 12.6 5 12.6H7.5C9.2 12.6 10.8 13.1 12 14",
    "M12 4C13.2 3.1 14.8 2.6 16.5 2.6H19C19.6 2.6 20 3 20 3.6V11.6C20 12.2 19.6 12.6 19 12.6H16.5",
    "M14.5 19.5H16.5A3 3 0 0 0 16.5 13.5H14.5M9.5 13.5H7.5A3 3 0 0 0 7.5 19.5H9.5M9 16.5H15"
  ],
  // ---------- 灵感 ----------
  /**
   * 记录灵感：灯泡。免费集里没有，照同一套画法补画——
   * 玻璃泡是半径 6 的大圆弧，下面两道短线是灯头的螺纹。
   * 螺纹保留两道而不是一道：只留一道时它在 18px 下会读成气球或定位针。
   */
  [COMMAND_ICONS.inspiration]: [
    "M8.55 13.1a6 6 0 1 1 6.9 0c-.44.31-.7.82-.7 1.36V15.6h-5.5v-1.14c0-.54-.26-1.05-.7-1.36Z",
    "M9.4 18.4H14.6",
    "M10.6 21.2H13.4"
  ],
  // ---------- 复盘 ----------
  /** 中国日历：日历框内一横一竖分出月格；与“打开本月复盘”的六个点明确区分 */
  [COMMAND_ICONS.calendar]: [CALENDAR, "M8 13.5H16M8 17.5H16M12 11.5V19.5"],
  /** 今天的日记：日历框里一个点，一天就是一个点 */
  [COMMAND_ICONS.daily]: [CALENDAR, "M12 15.6H12.01"],
  /** 本周复盘：日历框里一整行，一周就是一行 */
  [COMMAND_ICONS.weekly]: [CALENDAR, "M8 15.6H16"],
  /** 本月复盘：日历框里一片格子，一个月就是一片 */
  [COMMAND_ICONS.monthly]: [
    CALENDAR,
    "M8 13.8H8.01M12 13.8H12.01M16 13.8H16.01M8 17.4H8.01M12 17.4H12.01M16 17.4H16.01"
  ],
  /**
   * 本季复盘：一块四分之一饼。
   * 季与年不再用日历框，是因为再密的格子在 18px 下都和月记长得一样；
   * 而「四分之一」这件事，饼图是它唯一不会被误读的画法。
   */
  [COMMAND_ICONS.quarterly]: ["M12 12V3M12 12H21", CIRCLE],
  /** 本年复盘：一枚勋章。年度复盘是一年的结算，不是更大的一格日历（Pikaicons 原图） */
  [COMMAND_ICONS.yearly]: [
    "M16.735 14.1556C18.1274 12.8762 19 11.04 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 11.1635 5.98154 13.0978 7.52363 14.3819M16.735 14.1556C15.4887 15.3008 13.826 16 12 16C10.2976 16 8.73705 15.3922 7.52363 14.3819M16.735 14.1556L18.5 22L18.1414 21.7793C14.3983 19.4759 9.65688 19.5621 6 22L7.52363 14.3819"
  ],
  /** 写复盘主题：一支笔。主题是五级复盘里唯一要动笔写的字段（Pikaicons 原图） */
  [COMMAND_ICONS.theme]: [
    "M3.06616 18.3151C3.07546 17.9381 3.08011 17.7497 3.12568 17.5726C3.16608 17.4156 3.23007 17.2658 3.31544 17.1282C3.41171 16.973 3.54444 16.8396 3.8099 16.573L16.8626 3.46297C17.3862 2.93708 18.204 2.84896 18.8267 3.25131C19.565 3.7283 20.1957 4.3551 20.6785 5.09146L20.7123 5.14307C20.7368 5.18037 20.749 5.19902 20.7594 5.21582C21.1427 5.83327 21.0616 6.63294 20.5622 7.16005C20.5486 7.17439 20.5329 7.19018 20.5014 7.22177L7.52811 20.2521C7.25274 20.5287 7.11505 20.6669 6.95435 20.7658C6.81188 20.8534 6.65654 20.9178 6.49406 20.9568C6.31079 21.0008 6.11608 21.0005 5.72665 20.9999L3 20.9955L3.06616 18.3151Z"
  ],
  // ---------- 人脉 ----------
  /** 新建人脉：人加一颗心。人脉与客户的分别就在这颗心上（Pikaicons 原图） */
  [COMMAND_ICONS.contact]: [
    "M9 15H7C4.79086 15 3 16.7909 3 19C3 20.1046 3.89543 21 5 21H11M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7ZM17 21C16.6 21 13 19.0556 13 16.3335C13 14.9724 14.2 14.0003 15.4 14.0003C15.9896 14.0003 16.6 14.1947 17 14.778C17.4 14.1947 18 13.9918 18.6 14.0003C19.8 14.0171 21 14.9724 21 16.3335C21 19.0556 17.4 21 17 21Z"
  ],
  /** 记人情：一份礼。人情账本记的就是「谁送出去、谁欠着」（Pikaicons 原图） */
  [COMMAND_ICONS.favor]: [
    "M4.22222 12H19.7778M4.22222 12V17.5556C4.22222 19.1113 4.22222 19.8891 4.52498 20.4833C4.7913 21.006 5.21624 21.4309 5.73892 21.6972C6.33311 22 7.11097 22 8.66667 22H15.3333C16.889 22 17.6669 22 18.2611 21.6972C18.7838 21.4309 19.2087 21.006 19.475 20.4833C19.7778 19.8891 19.7778 19.1113 19.7778 17.5556V12M4.22222 12C3.91259 12 3.75778 12 3.62793 11.9819C2.7919 11.8653 2.13473 11.2081 2.01811 10.3721C2 10.2422 2 10.0874 2 9.77778C2 9.46815 2 9.31334 2.01811 9.18348C2.13473 8.34746 2.7919 7.69029 3.62793 7.57367C3.75778 7.55556 3.91259 7.55556 4.22222 7.55556H19.7778C20.0874 7.55556 20.2422 7.55556 20.3721 7.57367C21.2081 7.69029 21.8653 8.34746 21.9819 9.18348C22 9.31334 22 9.46815 22 9.77778C22 10.0874 22 10.2422 21.9819 10.3721C21.8653 11.2081 21.2081 11.8653 20.3721 11.9819C20.2422 12 20.0874 12 19.7778 12M12 7.55556H14.7778C16.3119 7.55556 17.5556 6.3119 17.5556 4.77778C17.5556 3.24365 16.3119 2 14.7778 2C13.2437 2 12 3.24365 12 4.77778M12 7.55556V4.77778M12 7.55556L12 22M12 7.55556H9.22222C7.6881 7.55556 6.44444 6.3119 6.44444 4.77778C6.44444 3.24365 7.6881 2 9.22222 2C10.7563 2 12 3.24365 12 4.77778"
  ],
  // ---------- 客户 ----------
  /** 初始化客户模块：一只公文包。这条命令做的是「开张」，不是新增某一个客户（Pikaicons 原图） */
  [COMMAND_ICONS.clients]: [
    "M8 7.02163C8 6.09166 8 5.60504 8.10222 5.22354C8.37962 4.18827 9.18827 3.37962 10.2235 3.10222C10.605 3 11.07 3 12 3C12.93 3 13.395 3 13.7765 3.10222C14.8117 3.37962 15.6204 4.18827 15.8978 5.22354C16 5.60504 16 6.09166 16 7.02163M12 15V17M3.0233 11.9607C3.25404 14.2296 5.17027 16 7.5 16H16.5C18.8297 16 20.746 14.2296 20.9767 11.9607M3.0233 11.9607C3 12.4943 3 13.1501 3 14C3 15.8613 3 16.7919 3.24472 17.5451C3.73931 19.0673 4.93273 20.2607 6.45492 20.7553C7.20808 21 8.13872 21 10 21H14C15.8613 21 16.7919 21 17.5451 20.7553C19.0673 20.2607 20.2607 19.0673 20.7553 17.5451C21 16.7919 21 15.8613 21 14C21 13.1501 21 12.4943 20.9767 11.9607M3.0233 11.9607C3.05102 11.3258 3.11174 10.8642 3.24472 10.4549C3.73931 8.93273 4.93273 7.73931 6.45492 7.24472C7.20808 7 8.13872 7 10 7H14C15.8613 7 16.7919 7 17.5451 7.24472C19.0673 7.73931 20.2607 8.93273 20.7553 10.4549C20.8883 10.8642 20.949 11.3258 20.9767 11.9607"
  ],
  /** 新建客户：一个人。客户是陌生人，所以不给他人脉那颗心（Pikaicons 原图） */
  [COMMAND_ICONS.client]: [
    "M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
    "M16 15H8C5.79086 15 4 16.7909 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.7909 18.2091 15 16 15Z"
  ],
  /** 增加付费：一个钱字。它记的是客户答应给多少（Pikaicons 原图） */
  [COMMAND_ICONS.payment]: [
    "M12 3V21M17 7.5C16.63 5.9473 15.3249 4.8 13.7717 4.8H12H10.3333C8.49238 4.8 7 6.41177 7 8.4C7 10.3882 8.49238 12 10.3333 12H12L13.6667 12C15.5076 12 17 13.6118 17 15.6C17 17.5882 15.5076 19.2 13.6667 19.2H12H10.2283C8.67512 19.2 7.37004 18.0527 7 16.5"
  ],
  /** 记收款：一只钱包。付费是承诺，收款是钱真的进了口袋，两件事两个图（Pikaicons 原图） */
  [COMMAND_ICONS.receipt]: [
    "M2 14.5V11C2 8.19974 2 6.79961 2.54497 5.73005C3.02433 4.78924 3.78924 4.02433 4.73005 3.54497C5.79961 3 7.19974 3 10 3H13.5C14.8978 3 15.5967 3 16.1481 3.22836C16.8831 3.53284 17.4672 4.11687 17.7716 4.85195C17.979 5.35251 17.9981 5.97475 17.9998 7.1313M2 14.5C2 15.8297 2 16.9946 2.3806 17.9134C2.88807 19.1386 3.86144 20.1119 5.08658 20.6194C6.00544 21 7.17029 21 9.5 21H14.5C16.8297 21 17.9946 21 18.9134 20.6194C20.1386 20.1119 21.1119 19.1386 21.6194 17.9134C22 16.9946 22 15.8297 22 14.5C22 12.1703 22 11.0054 21.6194 10.0866C21.1119 8.86144 20.1386 7.88807 18.9134 7.3806C18.639 7.26693 18.3426 7.18721 17.9998 7.1313M2 14.5C2 12.1703 2 11.0054 2.3806 10.0866C2.88807 8.86144 3.86144 7.88807 5.08658 7.3806C6.00544 7 7.17029 7 9.5 7H14.5C16.1339 7 17.1949 7 17.9998 7.1313M14 12H17"
  ],
  // ---------- 外观 ----------
  /**
   * 外观开关：一块调色盘。免费集里没有，照同一套画法补画。
   * 盘身是一个被右下角的拇指口咬掉一块的圆，四个点是颜料——
   * 点用「起点终点差 0.01」的零长线段画，靠圆头描边收成圆点，与免费集里的点画法一致。
   */
  [COMMAND_ICONS.appearance]: [
    "M12 21.5C6.75 21.5 2.5 17.25 2.5 12S6.75 2.5 12 2.5C17.25 2.5 21.5 6.35 21.5 11.1C21.5 13.5 19.55 15.45 17.15 15.45H15.9C14.7 15.45 13.72 16.42 13.72 17.63C13.72 18.14 13.9 18.62 14.19 19C14.44 19.32 14.6 19.72 14.6 20.16C14.6 20.9 14 21.5 13.26 21.5H12Z",
    "M7.5 12.6H7.51M9.5 8.7H9.51M13.7 7.5H13.71M17.2 10.4H17.21"
  ],
  // ---------- 排版 ----------
  /**
   * 整理当前笔记格式：一条竖基准线，右边三行长短不一但左端全部对齐。
   *
   * 免费集里没有，照同一套画法补画。画的是「对齐」而不是常见的扫帚或魔杖：
   * 这条命令做的事就是把长短不齐的行归到同一条线上，
   * 而扫帚在 18px 下与「清空/删除」是同一个手势，那正好是它绝不会做的事。
   */
  [COMMAND_ICONS.format]: ["M4 3V21", "M8 7H20", "M8 12H16", "M8 17H19"],
  // ---------- 文件 ----------
  /**
   * 打开最近文件：一只钟。免费集里没有，补画。
   *
   * 画钟而不是画一叠纸或一条清单：这条命令回答的不是「有哪些文件」，
   * 是「刚才那一篇」——问的是时间，不是数量。钟面复用半径 9 的公共圆，
   * 于是它与完成/暂停/放弃/重新开始那一组叠在一起时轮廓严丝合缝。
   */
  [COMMAND_ICONS.recent]: [CIRCLE, "M12 7.5V12L15.5 14"],
  /**
   * 复制当前笔记路径：两枚接续的尖角。补画。
   *
   * 它画的是路径分隔符本身（`»`），而不是一页纸或一个复制图标：
   * 纸在这一套里已经是「卡片」，复制图标在 18px 下与「两个错开的方框」同形，
   * 而两枚朝右的尖角只有一个意思——一层套一层的那条路。
   */
  [COMMAND_ICONS.filePath]: ["M6 7L11 12L6 17", "M13 7L18 12L13 17"],
  // ---------- 旧版 ----------
  /**
   * 切换笔记库：一扇门，外面一根向右的箭头。补画。
   *
   * 切库这件事的实质是**离开当前这一个**，门加箭头是它唯一不会被误读的画法。
   * 刻意不画「两个错开的方框」：那在 18px 下与复制、与多选完全同形。
   * 也刻意不复用 ziminos-vault 那三层骨架——那一枚已经是「开荒」的脸。
   */
  [COMMAND_ICONS.vaultSwitch]: [
    "M11 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H11",
    "M13 12H21M21 12L18 9M21 12L18 15"
  ],
  /** 打开帮助：圈里一个问号。圆仍是那个公共圆（Pikaicons 原图的画法） */
  [COMMAND_ICONS.help]: [
    "M9.6 9.3C9.6 8.03 10.67 7 12 7C13.33 7 14.4 8.03 14.4 9.3C14.4 10.4 13.6 10.9 12.9 11.4C12.4 11.75 12 12.2 12 13V13.5",
    "M12 17H12.01",
    CIRCLE
  ],
  /**
   * 打开设置：两根竖滑杆，各带一个旋钮。补画。
   *
   * 不用齿轮，是因为齿轮在 2 宽描边、24 格里必须画十来个齿才认得出，缩到 18px 就糊成一个圆；
   * 也不用三根横线加旋钮——那与「整理格式」那枚（竖基准线 + 三行）在一列图标里太像。
   * 竖着放、两根、旋钮一高一低，是「这里有东西可调」最省笔画的说法。
   */
  [COMMAND_ICONS.appSettings]: [
    "M8 3V21",
    "M16 3V21",
    "M10.2 8.5C10.2 9.71 9.21 10.7 8 10.7C6.79 10.7 5.8 9.71 5.8 8.5C5.8 7.29 6.79 6.3 8 6.3C9.21 6.3 10.2 7.29 10.2 8.5Z",
    "M18.2 15.5C18.2 16.71 17.21 17.7 16 17.7C14.79 17.7 13.8 16.71 13.8 15.5C13.8 14.29 14.79 13.3 16 13.3C17.21 13.3 18.2 14.29 18.2 15.5Z"
  ],
  // ---------- 设置页 ----------
  /** 边栏标签页：一块带左栏的面板，左栏里两粒图标位。它就是屏幕最左边那一列（补画） */
  [COMMAND_ICONS.dock]: [PANEL, "M9 3V21", "M6 7H6.01M6 10.5H6.01"],
  /**
   * 文件标签页：一个文件夹。它就是文件浏览器里那一行行的东西本身（补画）。
   *
   * 与边栏那块面板同理，画的是**那块地方**而不是这一版给它加的功能：
   * 文件夹上不挂数字、不挂角标——计数只是这个模块眼下唯一那件事，
   * 把当期功能画进图标，下一件功能进来时这枚图标就开始撒谎。
   * 圆角一律取 2（而非 PANEL 的 4）：文件夹在 24 格里比方框窄，
   * 沿用 4 会把那道斜边的转折吃掉，读起来就不是文件夹了。
   */
  [COMMAND_ICONS.explorer]: [
    "M5 4.9H8.2C8.9 4.9 9.5 5.2 9.9 5.7L10.9 7.1C11.3 7.7 11.9 8 12.6 8H19C20.1 8 21 8.9 21 10V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V6.9C3 5.8 3.9 4.9 5 4.9Z"
  ],
  /**
   * 编辑标签页：一个文字光标（I 形）。补画。
   *
   * 与另两张设置页标签同一条判据——画那块地方本身，不画这一版给它的功能：
   * 边栏是一块带左栏的面板，文件浏览器是一个文件夹，而「编辑」这一页管的是
   * 你打字时的那些顺手事，它那块地方就是光标待的地方。
   */
  [COMMAND_ICONS.editing]: ["M9 4H15", "M12 4V20", "M9 20H15"]
};
function registerZiminosIcons(plugin) {
  for (const [name, paths] of Object.entries(ARTWORK)) {
    (0, import_obsidian38.addIcon)(name, wrap(paths));
    plugin.register(() => (0, import_obsidian38.removeIcon)(name));
  }
}
function wrap(paths) {
  const body = paths.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}" width="${BOX}" height="${BOX}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="stroke-width:${STROKE}">${body}</svg>`;
}

// src/modules/ribbon/dock.ts
var ITEM_CLASS = "ziminos-ribbon-item";
var HIDDEN_CLASS = "ziminos-ribbon-hidden";
var MOBILE_PENDING = "\u5DF2\u53D6\u6D88\u3002\u624B\u673A\u7AEF\u8981\u91CD\u542F Obsidian \u540E\uFF0C\u5B83\u624D\u4F1A\u4ECE\u8FB9\u680F\u83DC\u5355\u91CC\u6D88\u5931\u3002";
function registerRibbon(ctx) {
  const dock = new RibbonDock(ctx);
  return () => dock.syncVisibility();
}
var RibbonDock = class {
  constructor(ctx) {
    /** 已经发出去的按钮，键是命令 id。发出去的收不回来，所以这张表只增不减 */
    this.buttons = /* @__PURE__ */ new Map();
    this.ctx = ctx;
    registerZiminosIcons(ctx.plugin);
    this.syncVisibility();
  }
  /**
   * 让边栏与设置对齐：勾上的建出来（或取消隐藏），取消勾选的藏起来。
   *
   * 这里有两条纪律，都来自 Obsidian 边栏的真实模型，不是口味问题：
   *
   * 其一，**只为勾上的命令建按钮**，而不是一次建齐二十六个再切显隐。
   * Obsidian 的 leftRibbon 自己存着一份 items，手机端底栏的边栏菜单与
   * 桌面「设置 → 外观 → 功能区」的管理弹窗都是遍历这份 items 画出来的，
   * 两处的过滤条件都只有 item.hidden，与 DOM 无关（边栏右键菜单会多看一眼 buttonEl 在不在，
   * 但那对我们没用——被藏起来的按钮 buttonEl 还在）。一次建齐的话，那两处永远列着全部三十条，
   * 包括「初始化笔记库」这种一辈子只该按一次的——那正是这个功能想消灭的杂乱。
   *
   * 其二，**藏起来走 class 不走 inline display**，理由见 HIDDEN_CLASS。
   *
   * 代价说清楚：Obsidian 没有公开的「撤下某一个边栏按钮」，所以本次会话内取消勾选的
   * 只能先藏着，它在 items 里的那条记录要等下次重载才消失（重载时它压根不会被建出来）。
   * 在那之前，另外三处入口仍然列着它、也点得动：手机端底栏的边栏菜单、
   * 桌面「设置 → 外观 → 功能区」的管理弹窗、以及边栏空白处的右键菜单。
   * 边栏那一列是主入口，用户看到的就是消失了，所以这个残留在桌面上无伤；
   * 手机上则完全看不出变化，那一句 Notice 就是为它准备的。
   */
  syncVisibility() {
    const enabled = new Set(this.ctx.settings.ribbonCommands);
    for (const command of this.ctx.commands.list()) {
      const id = command.spec.id;
      const existing = this.buttons.get(id);
      if (!enabled.has(id)) {
        if (existing && !existing.hasClass(HIDDEN_CLASS)) {
          existing.addClass(HIDDEN_CLASS);
          if (import_obsidian39.Platform.isPhone) new import_obsidian39.Notice(MOBILE_PENDING);
        }
        continue;
      }
      if (existing) {
        existing.removeClass(HIDDEN_CLASS);
        continue;
      }
      const el = this.ctx.plugin.addRibbonIcon(command.spec.icon, command.spec.name, () => {
        command.run();
      });
      el.addClass(ITEM_CLASS);
      el.style.color = GROUP_COLORS[command.spec.group];
      this.buttons.set(id, el);
    }
  }
};

// src/modules/setup/init.ts
var import_obsidian40 = require("obsidian");

// src/modules/setup/celebrate.ts
var PIECES_PER_SIDE = 36;
var DURATION_MS = { min: 1500, max: 2600 };
var DELAY_MS = { min: 0, max: 260 };
var COLORS = [
  "var(--color-red)",
  "var(--color-orange)",
  "var(--color-yellow)",
  "var(--color-green)",
  "var(--color-cyan)",
  "var(--color-blue)",
  "var(--color-purple)",
  "var(--color-pink)"
];
function celebrate(ctx) {
  var _a;
  try {
    const host = ctx.app.workspace.containerEl;
    const doc = host.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;
    if ((_a = win.matchMedia) == null ? void 0 : _a.call(win, "(prefers-reduced-motion: reduce)").matches) return;
    const layer = doc.createElement("div");
    layer.addClass("ziminos-confetti");
    host.appendChild(layer);
    const width = win.innerWidth;
    const height = win.innerHeight;
    const animations = [];
    for (const side of ["left", "right"]) {
      for (let index = 0; index < PIECES_PER_SIDE; index += 1) {
        animations.push(launch(doc, layer, side, width, height));
      }
    }
    const remove = () => layer.remove();
    Promise.allSettled(animations.map((animation) => animation.finished)).then(remove, remove);
    ctx.plugin.register(remove);
  } catch (e) {
  }
}
function launch(doc, layer, side, width, height) {
  var _a;
  const piece = doc.createElement("i");
  piece.addClass("ziminos-confetti-piece");
  piece.style.background = (_a = COLORS[Math.floor(Math.random() * COLORS.length)]) != null ? _a : COLORS[0];
  const fromLeft = side === "left";
  piece.style.left = fromLeft ? "0px" : `${width}px`;
  piece.style.top = `${height * (0.55 + Math.random() * 0.25)}px`;
  layer.appendChild(piece);
  const toward = (fromLeft ? 1 : -1) * width * (0.35 + Math.random() * 0.5);
  const rise = height * (0.35 + Math.random() * 0.35);
  const fall = height * (0.6 + Math.random() * 0.5);
  const spin = 360 * (2 + Math.random() * 3) * (fromLeft ? 1 : -1);
  return piece.animate(
    [
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1, offset: 0 },
      {
        transform: `translate(${toward * 0.55}px, ${-rise}px) rotate(${spin * 0.5}deg)`,
        opacity: 1,
        offset: 0.45
      },
      {
        transform: `translate(${toward}px, ${fall}px) rotate(${spin}deg)`,
        opacity: 0,
        offset: 1
      }
    ],
    {
      duration: between(DURATION_MS.min, DURATION_MS.max),
      delay: between(DELAY_MS.min, DELAY_MS.max),
      // 出膛快、滞空慢、落下再快，一条标准的抛物线手感
      easing: "cubic-bezier(0.2, 0.7, 0.35, 1)",
      fill: "forwards"
    }
  );
}
function between(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// src/modules/setup/schemaNote.ts
var SAMPLE_TYPE = "\u793A\u4F8B";
function schemaNoteContent(created, uid) {
  const frontmatter = [
    "---",
    `${FIELDS.aliases}:`,
    "  - \u5C5E\u6027\u8BF4\u660E",
    `${FIELDS.description}: \u5168\u90E8\u7B14\u8BB0\u5C5E\u6027\u5404\u51FA\u73B0\u4E00\u6B21\uFF0C\u7167\u7740\u5B83\u586B\u5C31\u4E0D\u4F1A\u9519`,
    `${FIELDS.created}: ${created}`,
    `${FIELDS.updated}: ${created}`,
    `${FIELDS.tags}:`,
    "  - \u7CFB\u7EDF",
    `${FIELDS.uid}: ${uid}`,
    `${FIELDS.type}: ${SAMPLE_TYPE}`,
    `${FIELDS.status}: active`,
    `${FIELDS.up}:`,
    '  - "[[\u5BFC\u822A]]"',
    `${FIELDS.rating}: 5`,
    `${FIELDS.author}:`,
    "  - \u8D75\u5B50\u6C11",
    `${FIELDS.source}: https://edu.zhaozimin.com`,
    `${FIELDS.archived}: 2026-12-31`,
    `${FIELDS.client}: "[[\u67D0\u4F4D\u5BA2\u6237]]"`,
    `${FIELDS.with}: "[[\u67D0\u4F4D\u540C\u884C\u8005]]"`,
    `${FIELDS.theme}: \u4ECA\u5929\u4E3B\u8981\u505A\u4E86\u4EC0\u4E48\uFF0C\u4E00\u53E5\u8BDD`,
    `${FIELDS.periodStart}: 2026-01-01`,
    `${FIELDS.tier}: ${CONTACT_TIERS[1]}`,
    `${FIELDS.direction}: ${CONTACT_DIRECTIONS[0]}`,
    `${FIELDS.gift}: true`,
    `${FIELDS.address}: \u5F20\u4E09 138-0000-0000 \u5317\u4EAC\u5E02\u671D\u9633\u533A\u793A\u4F8B\u8DEF 1 \u53F7 2 \u5355\u5143 301`,
    `${FIELDS.get}:`,
    "  - \u88C5\u4FEE",
    "  - \u672C\u5730\u4EBA\u8109",
    `${FIELDS.birthday}: 1985-08-15`,
    `${FIELDS.contact}: \u5FAE\u4FE1 demo_wangwu`,
    `${FIELDS.homepage}: https://example.com`,
    "---"
  ].join("\n");
  return [
    frontmatter,
    "",
    "# \u5C5E\u6027\u7C7B\u578B\u793A\u4F8B",
    "",
    "> \u8FD9\u7BC7\u7B14\u8BB0\u4E0D\u662F\u7ED9\u4F60\u5199\u4E1C\u897F\u7528\u7684\uFF0C\u662F**\u4E00\u5F20\u5BF9\u7167\u8868**\u3002",
    "> \u4E0A\u9762\u7684\u5C5E\u6027\u6846\u91CC\uFF0C\u6BCF\u4E00\u4E2A\u5C5E\u6027\u90FD\u586B\u4E86\u4E00\u4E2A\u683C\u5F0F\u6B63\u786E\u7684\u6837\u4F8B\u2014\u2014\u60F3\u77E5\u9053\u67D0\u4E2A\u5C5E\u6027\u8BE5\u600E\u4E48\u586B\uFF0C\u56DE\u6765\u7167\u6284\u3002",
    "> \u7C7B\u578B\u672C\u8EAB\u7531\u7B14\u8BB0\u5E93\u81EA\u5E26\u7684\u914D\u7F6E\u51B3\u5B9A\uFF0C\u4F60\u4E0D\u9700\u8981\u624B\u52A8\u53BB\u6539\u4EFB\u4F55\u4E00\u4E2A\u5C5E\u6027\u7684\u7C7B\u578B\u3002",
    "",
    "## \u{1F4DD} \u6587\u672C\uFF1A\u4E00\u53E5\u8BDD\u3001\u4E00\u4E2A\u8BCD\u3001\u4E00\u4E2A\u94FE\u63A5",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 | \u6837\u4F8B |",
    "|---|---|---|",
    `| \`${FIELDS.description}\` | \u4E00\u53E5\u8BDD\u62AB\u9732\uFF1A\u8FD9\u7BC7\u91CC\u6709\u4EC0\u4E48 | \u88C5\u4FEE\u516C\u53F8\u8001\u677F\uFF0C\u672C\u5730\u8D44\u6E90\u591A |`,
    `| \`${FIELDS.source}\` | \u8FD9\u4E1C\u897F\u4ECE\u54EA\u6765 | \u7F51\u5740\u3001\u4E66\u540D\u3001\u8BA4\u8BC6\u7684\u573A\u5408 |`,
    `| \`${FIELDS.type}\` | \u8EAB\u4EFD\u767B\u8BB0\uFF0C\u5C01\u95ED\u53D6\u503C | ${Object.values(NOTE_TYPES).join(" / ")} |`,
    `| \`${FIELDS.status}\` | \u6709\u7EC8\u70B9\u4E4B\u7269\u7684\u8FC7\u7A0B\u72B6\u6001 | active / paused / done / dropped |`,
    `| \`${FIELDS.tier}\` | \u8054\u7CFB\u8282\u594F | ${CONTACT_TIERS.join(" / ")} |`,
    `| \`${FIELDS.direction}\` | \u5173\u7CFB\u4F4D\u52BF | ${CONTACT_DIRECTIONS.join(" / ")} |`,
    `| \`${FIELDS.address}\` | \u6574\u4E32\u5BC4\u4EF6\u4FE1\u606F\uFF0C\u7167\u6284\u5C31\u80FD\u586B\u5FEB\u9012\u5355 | \u6536\u4EF6\u4EBA + \u7535\u8BDD + \u5730\u5740 |`,
    `| \`${FIELDS.contact}\` | \u5BA2\u6237\u7684\u8054\u7CFB\u65B9\u5F0F | \u5FAE\u4FE1\u53F7 / \u624B\u673A\u53F7 / \u5E73\u53F0\u8D26\u53F7 |`,
    `| \`${FIELDS.homepage}\` | \u5BA2\u6237\u7684\u4E3B\u9875 | \u4E00\u4E2A\u7F51\u5740 |`,
    `| \`${FIELDS.theme}\` | \u590D\u76D8\u4E3B\u9898\uFF1A\u5BF9\u4E00\u5929/\u4E00\u5468\u7684**\u7ED3\u8BBA** | \u4ECA\u5929\u4E3B\u8981\u505A\u4E86\u4EC0\u4E48 |`,
    `| \`${FIELDS.client}\` | \u4ED6\u59D4\u6258\u7684\uFF08\u6211\u6B20\u4E00\u4E2A\u4EA4\u4ED8\uFF09 | \`"[[\u5F20\u4E09]]"\` |`,
    `| \`${FIELDS.with}\` | \u548C\u4ED6\u4E00\u8D77\u505A\u7684\uFF08\u65E0\u4EA4\u4ED8\u503A\u52A1\uFF09 | \`"[[\u5F20\u4E09]]"\` |`,
    "",
    `> [!warning] \`${FIELDS.client}\` \u4E0E \`${FIELDS.with}\` \u4E0D\u80FD\u4E92\u6362`,
    `> \u5199\u4E0B \`${FIELDS.client}\` \u7B49\u4E8E\u5BA3\u544A\u300C\u6211\u6B20\u8FD9\u4E2A\u4EBA\u4E00\u4E2A\u4EA4\u4ED8\u300D\uFF0C\u5BA2\u6237\u540D\u5F55\u76F4\u63A5\u7528\u5B83\u53CD\u63A8\u8EAB\u4EFD\u3002`,
    `> \u670B\u53CB\u4E00\u8D77\u505A\u7684\u4E8B\u5FC5\u987B\u8D70 \`${FIELDS.with}\`\uFF0C\u5426\u5219\u670B\u53CB\u4F1A\u88AB\u65E0\u58F0\u6CE8\u518C\u6210\u5BA2\u6237\u3002`,
    "",
    "## \u{1F550} \u65E5\u671F\u548C\u65F6\u95F4\uFF1A\u673A\u5668\u7684\u8BB0\u8D26",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 | \u6837\u4F8B |",
    "|---|---|---|",
    `| \`${FIELDS.created}\` | \u8BDE\u751F\u65F6\u523B\uFF0C\u5EFA\u7B14\u8BB0\u65F6\u81EA\u52A8\u586B | 2026-08-12 09:30:00 |`,
    `| \`${FIELDS.updated}\` | \u6700\u540E\u4E00\u6B21\u6539\u52A8\uFF0C\u81EA\u52A8\u7EF4\u62A4 | 2026-08-12 21:15:00 |`,
    "",
    "\u8FD9\u4E24\u4E2A\u4E0D\u7528\u4F60\u7BA1\uFF1A`created` \u5EFA\u7B14\u8BB0\u65F6\u5199\u4E00\u6B21\u5C31\u4E0D\u518D\u53D8\uFF0C`updated` \u7531\u63D2\u4EF6\u5728\u4F60\u505C\u624B\u4E24\u79D2\u540E\u81EA\u52A8\u8BB0\u3002",
    "",
    "## \u{1F4C5} \u65E5\u671F\uFF1A\u53EA\u5230\u5929\uFF0C\u4E0D\u5E26\u65F6\u95F4",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 | \u6837\u4F8B |",
    "|---|---|---|",
    `| \`${FIELDS.birthday}\` | \u751F\u65E5\uFF0C\u672C\u6708\u751F\u65E5\u8868\u9760\u5B83 | 1985-08-15 |`,
    `| \`${FIELDS.archived}\` | \u5F52\u6863\u65F6\u523B\uFF0C\u7531\u300C\u5B8C\u6210\u9879\u76EE\u300D\u547D\u4EE4\u5199 | 2026-12-31 |`,
    `| \`${FIELDS.periodStart}\` | \u590D\u76D8\u5468\u671F\u7684\u7B2C\u4E00\u5929\uFF0C\u5EFA\u590D\u76D8\u7B14\u8BB0\u65F6\u81EA\u52A8\u7B97 | 2026-01-01 |`,
    "",
    "## \u{1F522} \u6570\u5B57\uFF1A\u80FD\u6392\u5E8F\u3001\u80FD\u6C42\u548C\u7684\u91CF",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 | \u6837\u4F8B |",
    "|---|---|---|",
    `| \`${FIELDS.uid}\` | \u673A\u5668\u4E3B\u952E\uFF0C14 \u4F4D\u65F6\u95F4\u6233\uFF0C\u6539\u540D\u4E5F\u4E0D\u53D8\uFF1B\u8BFB\u4E66\u7B14\u8BB0\u662F\u90A3\u672C\u4E66\u7684 ISBN | ${uid} |`,
    `| \`${FIELDS.rating}\` | \u6211\u7ED9\u5B83\u6253\u51E0\u5206 | 1 \u5230 5 |`,
    "",
    `> [!note] \`${FIELDS.uid}\` \u4E3A\u4EC0\u4E48\u662F 14 \u4F4D\u800C\u4E0D\u662F 17 \u4F4D`,
    "> \u6570\u5B57\u7C7B\u578B\u6709\u4E2A\u786C\u4E0A\u9650\uFF1A\u8D85\u8FC7 16 \u4F4D\u5C31\u4F1A\u88AB\u6084\u6084\u56DB\u820D\u4E94\u5165\uFF0C\u503C\u53D8\u4E86\u8FD8\u4E0D\u62A5\u9519\u3002",
    "> 14 \u4F4D\uFF08\u5E74\u6708\u65E5\u65F6\u5206\u79D2\uFF09\u521A\u597D\u7A33\u7A33\u5728\u5B89\u5168\u7EBF\u5185\uFF0C\u6240\u4EE5\u4E3B\u952E\u53D6 14 \u4F4D\u3002",
    "> \u8BFB\u4E66\u7B14\u8BB0\u662F\u552F\u4E00\u7684\u4F8B\u5916\uFF1A\u4E66\u81EA\u5E26 ISBN \u8FD9\u4E2A\u5168\u4E16\u754C\u901A\u7528\u7684\u53F7\uFF0813 \u4F4D\uFF0C\u540C\u6837\u5728\u5B89\u5168\u7EBF\u5185\uFF09\uFF0C",
    "> \u518D\u53D1\u4E00\u4E2A\u53EA\u6709\u8FD9\u4E2A\u5E93\u8BA4\u5F97\u7684\u65F6\u95F4\u6233\uFF0C\u7B49\u4E8E\u7ED9\u540C\u4E00\u672C\u4E66\u9020\u4E24\u4E2A\u4E3B\u952E\u3002\u8C46\u74E3\u6CA1\u767B\u8BB0\u4E66\u53F7\u65F6\u624D\u9000\u56DE\u65F6\u95F4\u6233\u3002",
    "",
    "## \u{1F4CB} \u5217\u8868\uFF1A\u53EF\u4EE5\u6709\u597D\u51E0\u4E2A",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 | \u6837\u4F8B |",
    "|---|---|---|",
    `| \`${FIELDS.aliases}\` | \u522B\u7684\u53EB\u6CD5\uFF0C\u8F93\u5165 \`[[\` \u65F6\u4E5F\u80FD\u641C\u5230 | \u6635\u79F0\u3001\u62FC\u97F3\u3001\u82F1\u6587\u540D |`,
    `| \`${FIELDS.tags}\` | \u6A2A\u5207\u4E3B\u9898\u8BCD | \u4E0D\u88C5\u7C7B\u578B\u3001\u4E0D\u88C5\u5F52\u5C5E\u3001\u4E0D\u88C5\u72B6\u6001 |`,
    `| \`${FIELDS.up}\` | \u6211\u5C5E\u4E8E\u8C01\uFF1A\u5361\u7247\u2192\u9879\u76EE\uFF0C\u4EBA\u2192\u5708\u5B50 | \`[[\u67D0\u4E2A MOC]]\` |`,
    `| \`${FIELDS.author}\` | \u5916\u90E8\u5185\u5BB9\u7684\u539F\u4F5C\u8005 | \u53EF\u4EE5\u6709\u597D\u51E0\u4F4D |`,
    `| \`${FIELDS.get}\` | \u4ED6\u80FD\u7ED9\u6211\u4EC0\u4E48 | \u88C5\u4FEE\u3001\u672C\u5730\u4EBA\u8109 |`,
    "",
    "## \u2611\uFE0F \u52FE\u9009\u6846\uFF1A\u662F\u6216\u5426",
    "",
    "| \u5C5E\u6027 | \u88C5\u4EC0\u4E48 |",
    "|---|---|",
    `| \`${FIELDS.gift}\` | \u613F\u4E0D\u613F\u610F\u6301\u7EED\u5728\u4ED6\u8EAB\u4E0A\u82B1\u94B1\u82B1\u5FC3\u601D\u3002\u52FE\u4E0A\u5373\u8FDB\u300C\u6295\u5582\u540D\u5355\u300D |`,
    "",
    "---",
    "",
    "## \u8FD9\u7BC7\u7B14\u8BB0\u4E3A\u4EC0\u4E48\u4E0D\u4F1A\u6C61\u67D3\u4EFB\u4F55\u7EDF\u8BA1",
    "",
    `\u5168\u90E8\u89C6\u56FE\u90FD\u9760 \`${FIELDS.type}\` \u8BA4\u8EAB\u4EFD\u3002\u8FD9\u7BC7\u7684 \`${FIELDS.type}\` \u662F \`${SAMPLE_TYPE}\`\uFF0C`,
    `\u4E0D\u5728\u7CFB\u7EDF\u8BA4\u5F97\u7684\u53D6\u503C\u91CC\uFF08${Object.values(NOTE_TYPES).join(" / ")}\uFF09\uFF0C\u6240\u4EE5\u5B83\u8C01\u4E5F\u4E0D\u50CF\u2014\u2014`,
    "\u5B83\u4E0D\u4F1A\u51FA\u73B0\u5728\u4EBA\u8109\u540D\u5F55\u3001\u6295\u5582\u540D\u5355\u3001\u9879\u76EE\u770B\u677F\u6216\u4EFB\u4F55\u4E00\u5F20\u8868\u91CC\u3002",
    "",
    "\u4F60\u53EF\u4EE5\u653E\u5FC3\u628A\u5B83\u7559\u7740\u5F53\u5BF9\u7167\u8868\uFF1B\u771F\u4E0D\u60F3\u8981\u4E86\uFF0C\u5220\u6389\u4E5F\u4E0D\u5F71\u54CD\u4EFB\u4F55\u529F\u80FD\u3002",
    ""
  ].join("\n");
}

// src/modules/setup/init.ts
var MESSAGES9 = {
  notEmpty: "\u68C0\u6D4B\u5230\u5DF2\u6709\u7B14\u8BB0\uFF0CziminOS \u53EA\u5728\u7A7A\u5E93\u5F00\u8352\u3002\u8BF7\u65B0\u5EFA\u4E00\u4E2A\u7A7A\u5E93\u518D\u8BD5\u3002",
  done: "\u5F00\u8352\u5B8C\u6210 \u2705",
  failedPrefix: "\u521D\u59CB\u5316\u5931\u8D25\uFF1A"
};
async function initializeVault(ctx, seeds) {
  try {
    const isFirstRun = ctx.settings.initializedAt === "";
    if (isFirstRun && hasUserNotes(ctx, seeds)) {
      new import_obsidian40.Notice(MESSAGES9.notEmpty);
      return;
    }
    for (const folder of INIT_FOLDERS) {
      await ensureFolderPath(ctx.app, folder);
    }
    const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);
    await createFileIfMissing(ctx, SCHEMA_NOTE, schemaNoteContent(stamp, uid));
    for (const seed of seeds) {
      await applySeed(ctx, seed);
    }
    if (isFirstRun) {
      ctx.settings.initializedAt = nowStamp(ctx.settings.dateTimeFormat);
      await ctx.saveSettings();
    }
    new import_obsidian40.Notice(MESSAGES9.done);
    celebrate(ctx);
    const landing = ctx.app.vault.getAbstractFileByPath(README_FILE) ? README_FILE : NAV_FILE;
    await ctx.app.workspace.openLinkText(landing, "", false);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    new import_obsidian40.Notice(MESSAGES9.failedPrefix + message2);
  }
}
async function applySeed(ctx, seed) {
  for (const folder of seed.folders) {
    await ensureFolderPath(ctx.app, folder);
  }
  for (const note of seed.notes) {
    await createFileIfMissing(ctx, note.path, note.content);
  }
}
function hasUserNotes(ctx, seeds) {
  const systemPrefix = `${FOLDERS.system}/`;
  const generated = /* @__PURE__ */ new Set([
    README_FILE,
    SCHEMA_NOTE,
    ...seeds.flatMap((seed) => seed.notes.map((note) => note.path))
  ]);
  return ctx.app.vault.getMarkdownFiles().some((file) => !generated.has(file.path) && !file.path.startsWith(systemPrefix));
}
async function createFileIfMissing(ctx, path, content) {
  if (ctx.app.vault.getAbstractFileByPath(path)) return;
  ctx.guard.mark(path);
  await ctx.app.vault.create(path, content);
}

// src/settings.ts
var import_obsidian42 = require("obsidian");

// src/settingsModel.ts
var TABS = [
  {
    id: "setup",
    label: "\u5F00\u8352",
    icon: COMMAND_ICONS.vault,
    module: "\u5F00\u8352 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u4E03\u4E2A\u6587\u4EF6\u5939\u3001\u6A21\u677F\u4E0E\u5BFC\u822A\uFF0C\u518D\u70B9\u4E00\u6B21\u53EA\u8865\u9F50\u7F3A\u5931"
  },
  {
    id: "projects",
    label: "\u9879\u76EE",
    icon: COMMAND_ICONS.project,
    module: "\u9879\u76EE\u7BA1\u7406 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u5EFA\u9879\u76EE\u3001\u5361\u7247\u767B\u8BB0\u3001\u56DB\u6001\u6D41\u8F6C\uFF1B\u8BFB\u4E66\u7B14\u8BB0\u4E5F\u4F4F\u5728\u8FD9\u91CC\uFF08\u4E00\u672C\u4E66\u5C31\u662F\u4E00\u4E2A\u9879\u76EE\uFF09"
  },
  {
    id: "inspiration",
    label: "\u7075\u611F",
    icon: COMMAND_ICONS.inspiration,
    module: "\u7075\u611F\u6536\u96C6 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 Dataview \u672A\u5B8C\u6210\u4EFB\u52A1\u89C6\u56FE\u5DF2\u5C31\u7EEA"
  },
  {
    id: "review",
    label: "\u590D\u76D8",
    icon: COMMAND_ICONS.daily,
    module: "\u590D\u76D8 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u4E94\u7EA7\u5468\u671F\u7B14\u8BB0\u3001\u4E3B\u9898\u94FE\u4E0E\u9879\u76EE\u6570\u636E\u5171\u4E94\u4E2A\u89C6\u56FE"
  },
  {
    id: "contacts",
    label: "\u4EBA\u8109",
    icon: COMMAND_ICONS.contact,
    module: "\u4EBA\u8109\u4E0E\u5BA2\u6237 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u65B0\u5EFA\u4EBA\u8109\u3001\u8BB0\u4EBA\u60C5\uFF0C\u6863\u6848\u4E0E MOC \u5171\u516B\u4E2A\u89C6\u56FE\uFF1B\u5BA2\u6237\u6309\u9700\u542F\u7528\uFF0C\u8FD0\u884C\u300C\u521D\u59CB\u5316\u5BA2\u6237\u6A21\u5757\u300D\u540E\u957F\u51FA MOC \u4E0E\u53E6\u5916\u516B\u4E2A\u89C6\u56FE"
  },
  {
    id: "editing",
    label: "\u7F16\u8F91",
    icon: COMMAND_ICONS.editing,
    module: "\u7F16\u8F91\u4E0E\u6392\u7248 v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u9009\u4E2D\u6587\u5B57\u7C98\u4E00\u6761\u7F51\u5740\u5C31\u6210\u5916\u94FE\u3001\u6BCF\u7BC7\u7B14\u8BB0\u8BB0\u4F4F\u4E0A\u6B21\u7684\u5149\u6807\u4F4D\u7F6E\uFF0C\u52A0\u4E5D\u6761\u6807\u51C6 Markdown \u5199\u6CD5\uFF08\u6539\u5B8C\u8D70\u5F00\u5C31\u66FF\u4F60\u6574\u7406\uFF09"
  },
  {
    id: "explorer",
    label: "\u6587\u4EF6",
    icon: COMMAND_ICONS.explorer,
    module: "\u6587\u4EF6\u6D4F\u89C8\u5668 v2",
    status: "\u8FD0\u884C\u4E2D \xB7 \u6587\u4EF6\u5939\u8BA1\u6570\u3001\u6700\u8FD1\u6587\u4EF6\u6E05\u5355\u4E0E\u72B6\u6001\u680F\u5F53\u524D\u8DEF\u5F84"
  },
  {
    id: "ribbon",
    label: "\u8FB9\u680F",
    icon: COMMAND_ICONS.dock,
    module: "\u5DE6\u4FA7\u8FB9\u680F v1",
    status: "\u8FD0\u884C\u4E2D \xB7 \u4E09\u5341\u4E94\u6761\u547D\u4EE4\u914D Pikaicons \u56FE\u6807\uFF0C\u9ED8\u8BA4\u6446\u51FA\u5341\u6761"
  }
];
var TEXTS6 = {
  initName: "\u521D\u59CB\u5316\u7B14\u8BB0\u5E93",
  initButton: "\u521D\u59CB\u5316",
  initPending: "\u5C1A\u672A\u521D\u59CB\u5316\u3002\u70B9\u53F3\u8FB9\u7684\u6309\u94AE\uFF0C\u4E3A\u8FD9\u4E2A\u5E93\u94FA\u597D\u4E03\u4E2A\u6587\u4EF6\u5939\u3001\u6A21\u677F\u4E0E\u5BFC\u822A\uFF0C\u5E76\u957F\u51FA\u4EBA\u8109\u4E0E\u590D\u76D8\u4E24\u5957\u7CFB\u7EDF\u3002",
  initReadyPrefix: "\u5DF2\u5C31\u7EEA \u2713 \u9996\u6B21\u5F00\u8352\u4E8E ",
  initReadySuffix: "\u3002\u518D\u70B9\u4E00\u6B21\u53EA\u8865\u9F50\u7F3A\u5931\u7684\u6587\u4EF6\uFF0C\u4E0D\u4F1A\u8986\u76D6\u4F60\u5199\u8FC7\u7684\u4EFB\u4F55\u7B14\u8BB0\u3002",
  autoCardName: "\u65B0\u5EFA\u7B14\u8BB0\u81EA\u52A8\u767B\u8BB0\u4E3A\u5361\u7247",
  autoCardDesc: "\u5728\u9879\u76EE\u6216\u9886\u57DF\u76EE\u5F55\u91CC\u65B0\u5EFA\u7A7A\u7B14\u8BB0\u65F6\uFF0C\u81EA\u52A8\u8865\u9F50\u6807\u51C6\u5B57\u6BB5\uFF0C\u5E76\u94FE\u56DE\u5B83\u6240\u5C5E\u7684 MOC\u3002\u5173\u6389\u540E\u53EF\u7528\u547D\u4EE4\u300C\u521D\u59CB\u5316\u5F53\u524D\u5361\u7247\u300D\u624B\u52A8\u767B\u8BB0\u3002",
  autoUpdatedName: "\u81EA\u52A8\u7EF4\u62A4 updated \u65F6\u95F4",
  autoUpdatedDesc: "\u6539\u5B8C\u5E26 YAML \u7684\u7B14\u8BB0\u3001\u505C\u624B\u4E24\u79D2\u540E\uFF0C\u81EA\u52A8\u8BB0\u4E0B\u8FD9\u6B21\u4FEE\u6539\u65F6\u95F4\u3002\u6CA1\u6709 YAML \u7684\u7B14\u8BB0\u4E00\u4E2A\u5B57\u90FD\u4E0D\u52A8\u3002",
  booksHeading: "\u8BFB\u4E66\u7B14\u8BB0",
  booksIntro: "\u4E00\u672C\u4E66\u5C31\u662F\u4E00\u4E2A\u9879\u76EE\uFF1A\u5B83\u843D\u5728\u9879\u76EE\u76EE\u5F55\u91CC\uFF0C\u8BFB\u5B8C\u7528\u300C\u5B8C\u6210\u9879\u76EE\u300D\u5F52\u6863\uFF0C\u6240\u4EE5\u5B83\u7684\u8BBE\u7F6E\u4E5F\u4F4F\u5728\u8FD9\u4E00\u9875\u3002\u4E66\u76EE\u5B57\u6BB5\uFF08\u4F5C\u8005\u3001\u51FA\u7248\u793E\u3001ISBN\u3001\u8BC4\u5206\uFF09\u6CA1\u6709\u5F00\u5173\u2014\u2014\u8C46\u74E3\u600E\u4E48\u5199\u5C31\u600E\u4E48\u843D\uFF0C\u90A3\u662F\u4E8B\u5B9E\u4E0D\u662F\u53E3\u5473\u3002UID \u76F4\u63A5\u5199\u8FD9\u672C\u4E66\u7684 ISBN\uFF1B\u8C46\u74E3\u6CA1\u767B\u8BB0\u4E66\u53F7\u65F6\u624D\u9000\u56DE\u65F6\u95F4\u6233\u3002",
  bookTagCountName: "\u6807\u7B7E\u6761\u6570",
  bookTagCountDesc: "\u8C46\u74E3\u7684\u5206\u7C7B\u6309\u6295\u7968\u6570\u4ECE\u9AD8\u5230\u4F4E\u6392\uFF0C\u53D6\u524D\u51E0\u4E2A\u3002\u5F80\u540E\u5F88\u5FEB\u6ED1\u5411\u4E2A\u4EBA\u5316\u7684\u788E\u8BED\uFF0C\u6240\u4EE5\u8FD9\u4E2A\u6570\u95EE\u7684\u4E0D\u662F\u300C\u591F\u4E0D\u591F\u300D\uFF0C\u662F\u300C\u4ECE\u54EA\u513F\u5F00\u59CB\u53D8\u6210\u566A\u97F3\u300D\u3002",
  wereadName: "\u5FAE\u4FE1\u8BFB\u4E66",
  wereadConnected: "\u5DF2\u8FDE\u63A5\u3002\u300C\u8BFB\u4E00\u672C\u4E66\u300D\u4E0E\u300C\u540C\u6B65\u8FD9\u672C\u4E66\u7684\u5212\u7EBF\u300D\u4F1A\u81EA\u52A8\u628A\u4F60\u5728\u5FAE\u8BFB\u4E0A\u7684\u5212\u7EBF\u4E0E\u60F3\u6CD5\u53D6\u56DE\u6765\u3002\u65AD\u5F00\u53EA\u6E05\u6389\u672C\u673A\u5B58\u7684\u8FD9\u4EFD\u767B\u5F55\u51ED\u636E\uFF0C\u4E0D\u52A8\u4F60\u5728\u5FAE\u4FE1\u8BFB\u4E66\u90A3\u8FB9\u7684\u4EFB\u4F55\u4E1C\u897F\u3002",
  wereadDisconnected: "\u672A\u8FDE\u63A5\u3002\u8FDE\u4E0A\u4E4B\u540E\uFF0C\u8BFB\u4E66\u547D\u4EE4\u4F1A\u591A\u4E00\u5904\u5212\u7EBF\u6765\u6E90\uFF08\u53E6\u4E24\u5904\u662F\u672C\u673A\u7684\u82F9\u679C\u56FE\u4E66\u4E0E Kindle\uFF0C\u4E0D\u9700\u8981\u8FDE\u63A5\uFF09\u3002\u8FDE\u63A5\u8D70\u626B\u7801\uFF0C\u63D2\u4EF6\u5168\u7A0B\u4E0D\u78B0\u4F60\u7684\u8D26\u53F7\u548C\u5BC6\u7801\u3002",
  wereadMobile: "\u626B\u7801\u767B\u5F55\u53EA\u5728\u7535\u8111\u7248\u53EF\u7528\u3002\u624B\u673A\u4E0A\u4ECD\u53EF\u7528\u300C\u5BFC\u5165\u8BFB\u4E66\u5212\u7EBF\u300D\u628A\u5212\u7EBF\u7C98\u8D34\u8FDB\u6765\u3002",
  inspirationPositionName: "\u63D2\u5165\u4F4D\u7F6E",
  inspirationPositionDesc: "\u51B3\u5B9A\u65B0\u7075\u611F\u5199\u5728\u6807\u9898\u533A\u6216\u6574\u7BC7\u6B63\u6587\u7684\u5934\u5C3E\u3002\u7F6E\u9876\u4F1A\u81EA\u52A8\u907F\u5F00 YAML\u3001\u9875\u9762\u6807\u9898\u548C Dataview \u7B5B\u9009\u533A\u3002",
  inspirationFormatName: "\u5355\u6761\u683C\u5F0F",
  inspirationFormatDesc: "\u5FC5\u987B\u4FDD\u7559 {{content}}\uFF1B\u8FD8\u53EF\u4F7F\u7528 {{date}}\u3001{{time}}\u3001{{datetime}}\u3002",
  ribbonIntro: "\u52FE\u4E0A\u7684\u547D\u4EE4\u4F1A\u53D8\u6210\u6700\u5DE6\u8FB9\u90A3\u4E00\u5217\u56FE\u6807\uFF0C\u70B9\u4E00\u4E0B\u5C31\u6267\u884C\uFF0C\u4E0D\u7528\u518D\u6253\u5F00\u547D\u4EE4\u9762\u677F\u3002\u56FE\u6807\u662F Pikaicons\uFF0C\u8DDF\u7740\u4E3B\u9898\u7684\u989C\u8272\u4E0E\u63CF\u8FB9\u7C97\u7EC6\u8D70\u3002\u6700\u540E\u90A3\u4E00\u7EC4\u300C\u65E7\u7248\u300D\u662F\u7070\u7684\uFF0C\u56E0\u4E3A\u5B83\u4EEC\u505A\u7684\u662F Obsidian \u81EA\u5DF1\u7684\u4E8B\u2014\u2014\u5207\u6362\u7B14\u8BB0\u5E93\u3001\u5E2E\u52A9\u3001\u8BBE\u7F6E\u8FD9\u4E09\u4E2A\u6309\u94AE\u5728 Obsidian 1.6 \u4E4B\u540E\u88AB\u632A\u8FDB\u4E86\u6587\u4EF6\u6D4F\u89C8\u5668\u5E95\u4E0B\uFF0C\u8FD9\u4E09\u6761\u628A\u5B83\u4EEC\u8BF7\u56DE\u6700\u5DE6\u8FB9\u90A3\u4E00\u5217\uFF1B\u4F4D\u7F6E\u5F52\u4F60\uFF0C\u6446\u51FA\u6765\u4E4B\u540E\u76F4\u63A5\u62D6\u3002\u53D6\u6D88\u52FE\u9009\u540E\uFF0C\u5B83\u5728\u300C\u8BBE\u7F6E \u2192 \u5916\u89C2 \u2192 \u529F\u80FD\u533A\u300D\u548C\u624B\u673A\u7AEF\u7684\u8FB9\u680F\u83DC\u5355\u91CC\u8981\u91CD\u542F Obsidian \u624D\u6D88\u5931\uFF1B\u53CD\u8FC7\u6765\uFF0C\u4F60\u5728\u90A3\u4E24\u5904\u85CF\u6389\u7684\u56FE\u6807\uFF0C\u8FD9\u91CC\u52FE\u4E0A\u4E5F\u4E0D\u4F1A\u51FA\u73B0\u2014\u2014\u90A3\u662F Obsidian \u81EA\u5DF1\u7684\u5F00\u5173\uFF0C\u5F97\u56DE\u90A3\u513F\u6253\u5F00\u3002",
  ribbonCountPrefix: "\u5DF2\u6446\u51FA ",
  ribbonCountSeparator: " / ",
  ribbonCountSuffix: " \u6761",
  autoFormatName: "\u6539\u5B8C\u8D70\u5F00\u81EA\u52A8\u6574\u7406",
  autoFormatDesc: "\u79BB\u5F00\u4E00\u7BC7\u521A\u6539\u8FC7\u7684\u7B14\u8BB0\u65F6\uFF0C\u6309\u4E0B\u9762\u52FE\u9009\u7684\u89C4\u5219\u6574\u7406\u5B83\u4E00\u6B21\uFF1B\u63D2\u4EF6\u81EA\u5DF1\u5F80\u7B14\u8BB0\u91CC\u5199\u8FC7\u4E1C\u897F\u4E4B\u540E\u540C\u6837\u4F1A\u6574\u7406\u3002\u5B83\u523B\u610F\u4E0D\u52A8\u4F60\u6B63\u5F00\u7740\u7684\u90A3\u4E00\u7BC7\u2014\u2014\u4E2D\u6587\u8F93\u5165\u6CD5\u5728\u5408\u6210\u4E2D\u9014\u88AB\u5916\u90E8\u6539\u5199\u4F1A\u541E\u5B57\uFF0C\u800C\u4E24\u79D2\u7684\u505C\u987F\u5728\u659F\u914C\u4E00\u53E5\u8BDD\u65F6\u592A\u5E38\u89C1\u3002\u60F3\u5F53\u573A\u6574\u7406\uFF0C\u7528\u547D\u4EE4\u300C\u6574\u7406\u5F53\u524D\u7B14\u8BB0\u683C\u5F0F\u300D\u3002",
  formatHeading: "\u6392\u7248",
  formatIntro: "\u6392\u7248\u4E0E\u4E0A\u9762\u4E24\u9879\u540C\u4F4F\u4E00\u9875\uFF0C\u56E0\u4E3A\u5B83\u4EEC\u53D1\u751F\u5728\u540C\u4E00\u4E2A\u65F6\u523B\uFF1A\u4F60\u5728\u7F16\u8F91\u5668\u91CC\u6572\u5B57\uFF0C\u7C98\u8D34\u53D8\u6210\u94FE\u63A5\u3001\u5149\u6807\u8BB0\u4F4F\u4F4D\u7F6E\u3001\u8D70\u5F00\u4E4B\u540E\u8FD9\u4E00\u7BC7\u88AB\u6574\u7406\u6210\u6807\u51C6\u5199\u6CD5\u3002\u4E0B\u9762\u5148\u51B3\u5B9A\u300C\u8981\u4E0D\u8981\u66FF\u6211\u6309\u300D\uFF0C\u518D\u51B3\u5B9A\u300C\u6309\u4E0B\u53BB\u505A\u54EA\u51E0\u4EF6\u4E8B\u300D\u2014\u2014\u4E24\u8005\u4E0D\u5408\u6210\u4E00\u4E2A\u5F00\u5173\uFF1A\u81EA\u52A8\u6574\u7406\u5173\u6389\u4E4B\u540E\uFF0C\u547D\u4EE4\u300C\u6574\u7406\u5F53\u524D\u7B14\u8BB0\u683C\u5F0F\u300D\u4ECD\u7167\u8FD9\u4E5D\u6761\u52FE\u9009\u6267\u884C\u3002",
  formatRulesHeading: "\u4E5D\u6761\u89C4\u5219",
  formatRulesIntro: "\u5173\u6389\u54EA\u4E00\u6761\uFF0C\u6574\u7406\u65F6\u5C31\u4E0D\u518D\u6267\u884C\u5B83\u3002\u547D\u4EE4\u4E0E\u81EA\u52A8\u6574\u7406\u8D70\u7684\u662F\u540C\u4E00\u4EFD\u52FE\u9009\u3002",
  appearanceSwitchName: "\u72B6\u6001\u680F\u5916\u89C2\u5F00\u5173",
  appearanceSwitchDesc: "\u5728\u53F3\u4E0B\u89D2\u72B6\u6001\u680F\u653E\u4E00\u4E2A \u{1F3A8} \u6309\u94AE\uFF0C\u70B9\u5F00\u5C31\u80FD\u9010\u4E2A\u5F00\u5173 CSS \u7247\u6BB5\uFF0C\u4E0D\u5FC5\u518D\u8FDB\u8BBE\u7F6E\u7FFB\u5916\u89C2\u9875\u3002\u5173\u6389\u53EA\u662F\u6536\u8D77\u6309\u94AE\uFF0C\u547D\u4EE4\u9762\u677F\u91CC\u7684\u300C\u6253\u5F00\u5916\u89C2\u5F00\u5173\u300D\u7167\u5E38\u53EF\u7528\u3002",
  folderCountName: "\u6587\u4EF6\u5939\u53F3\u4FA7\u663E\u793A\u8BA1\u6570",
  folderCountDesc: "\u5728\u5DE6\u8FB9\u90A3\u68F5\u76EE\u5F55\u6811\u4E0A\uFF0C\u7ED9\u6BCF\u4E2A\u6587\u4EF6\u5939\u53F3\u4FA7\u6807\u4E00\u4E2A\u6570\u5B57\uFF1A\u8FD9\u91CC\u9762\u6512\u4E86\u591A\u5C11\u3002\u628A\u9F20\u6807\u505C\u5728\u6570\u5B57\u4E0A\uFF0C\u7B14\u8BB0\u6570\u4E0E\u5B50\u6587\u4EF6\u5939\u6570\u4F1A\u4E00\u8D77\u62A5\u51FA\u6765\u3002\u7A7A\u6587\u4EF6\u5939\u4E0D\u6807\u6570\u5B57\u2014\u2014\u4E00\u4E2A 0 \u4E0D\u89E3\u91CA\u4EFB\u4F55\u4E8B\u3002\u5173\u6389\u65F6\u6570\u5B57\u5F53\u573A\u6D88\u5931\uFF0C\u4E0D\u7559\u6B8B\u8FF9\u3001\u4E0D\u7528\u91CD\u542F\u3002",
  folderCountTargetName: "\u6570\u4EC0\u4E48",
  folderCountTargetDesc: "\u5E38\u9A7B\u5728\u5C4F\u5E55\u4E0A\u7684\u53EA\u6709\u4E00\u4E2A\u6570\uFF0C\u6240\u4EE5\u8981\u5148\u8BF4\u6E05\u5B83\u6570\u7684\u662F\u4EC0\u4E48\u3002ziminOS \u91CC\u7684\u6587\u4EF6\u5939\u662F\u5BB9\u5668\uFF1A01-projects \u91CC\u88C5\u7684\u662F\u9879\u76EE\uFF0C\u4E00\u4E2A\u9879\u76EE\u91CC\u88C5\u7684\u662F\u5361\u7247\u2014\u2014\u6240\u4EE5\u300C\u6709\u591A\u5C11\u7BC7\u7B14\u8BB0\u300D\u548C\u300C\u6211\u6709\u51E0\u4E2A\u9879\u76EE\u300D\u662F\u540C\u4E00\u68F5\u6811\u7684\u4E24\u4E2A\u95EE\u9898\uFF0C\u9009\u4F60\u66F4\u5E38\u95EE\u7684\u90A3\u4E2A\u3002",
  folderCountRecursiveName: "\u542B\u5B50\u6587\u4EF6\u5939",
  folderCountRecursiveDesc: "\u5F00\u7740\u65F6\uFF0C\u6570\u5B57\u662F\u8FD9\u4E2A\u6587\u4EF6\u5939\u8FDE\u540C\u5B83\u6240\u6709\u540E\u4EE3\u52A0\u8D77\u6765\u7684\u603B\u6570\uFF1B\u5173\u6389\u53EA\u6570\u76F4\u63A5\u653E\u5728\u8FD9\u4E00\u5C42\u7684\u3002\u9ED8\u8BA4\u5F00\u7740\uFF0C\u56E0\u4E3A 01-projects \u8FD9\u79CD\u53EA\u88C5\u6587\u4EF6\u5939\u7684\u5C42\u5728\u5173\u6389\u65F6\u4F1A\u663E\u793A 0\u2014\u2014\u90A3\u8BA9\u5B83\u4E0E\u4E00\u4E2A\u771F\u6B63\u7684\u7A7A\u6587\u4EF6\u5939\u957F\u5F97\u4E00\u6A21\u4E00\u6837\u3002\u53CD\u8FC7\u6765\uFF0C\u60F3\u8BA9\u6570\u5B57\u56DE\u7B54\u300C\u6211\u6709\u51E0\u4E2A\u9879\u76EE\u300D\u800C\u4E0D\u662F\u300C\u9879\u76EE\u91CC\u4E00\u5171\u591A\u5C11\u5F20\u5361\u7247\u300D\uFF0C\u5173\u6389\u5B83\u624D\u662F\u5BF9\u7684\u3002",
  filePathName: "\u72B6\u6001\u680F\u663E\u793A\u5F53\u524D\u7B14\u8BB0\u8DEF\u5F84",
  filePathDesc: "\u5728\u53F3\u4E0B\u89D2\u72B6\u6001\u680F\u663E\u793A\u4F60\u6B64\u523B\u8FD9\u4E00\u7BC7\u5728\u54EA\u4E2A\u6587\u4EF6\u5939\u91CC\uFF0C\u70B9\u4E00\u4E0B\u628A\u5B8C\u6574\u8DEF\u5F84\u590D\u5236\u8D70\u3002\u5173\u6389\u53EA\u662F\u6536\u8D77\u90A3\u4E00\u5757\uFF0C\u547D\u4EE4\u300C\u590D\u5236\u5F53\u524D\u7B14\u8BB0\u8DEF\u5F84\u300D\u7167\u5E38\u53EF\u7528\uFF08\u53EF\u4EE5\u53BB\u8BBE\u7F6E \u2192 \u5FEB\u6377\u952E\u7ED9\u5B83\u7ED1\u4E2A\u952E\uFF09\u3002",
  recentHeading: "\u6700\u8FD1\u6587\u4EF6",
  recentIntro: "\u4E00\u5F20\u300C\u6211\u521A\u624D\u5728\u54EA\u51E0\u7BC7\u91CC\u300D\u7684\u6E05\u5355\uFF0C\u4F4F\u5728\u53F3\u4FA7\u680F\u3002\u7528\u547D\u4EE4\u300C\u6253\u5F00\u6700\u8FD1\u6587\u4EF6\u300D\u6216\u5DE6\u4FA7\u8FB9\u680F\u90A3\u53EA\u949F\u628A\u5B83\u8BF7\u51FA\u6765\uFF1B\u5B83\u4E0D\u4F1A\u81EA\u5DF1\u5360\u4F4F\u4FA7\u680F\u2014\u2014\u90A3\u662F\u627E\u4E0D\u56DE\u67D0\u4E00\u7BC7\u65F6\u624D\u60F3\u8D77\u6765\u7684\u5DE5\u5177\uFF0C\u4E0D\u662F\u6BCF\u5929\u90FD\u8981\u770B\u7684\u4E1C\u897F\u3002\u6E05\u5355\u7684\u6210\u5458\u6C38\u8FDC\u662F\u4F60\u6253\u5F00\u8FC7\u7684\u6587\u4EF6\uFF08\u542B\u6A21\u677F\u4E0E\u7CFB\u7EDF\u7B14\u8BB0\uFF0C\u5BFC\u822A\u4E0D\u8BE5\u85CF\u4E1C\u897F\uFF09\u3002",
  recentLimitName: "\u663E\u793A\u51E0\u6761",
  recentLimitDesc: "\u6E05\u5355\u6700\u591A\u5217\u51E0\u884C\u3002\u8BB0\u5F55\u672C\u8EAB\u4E00\u76F4\u7559\u7740\u4E94\u5341\u6761\uFF0C\u6240\u4EE5\u4F60\u628A 10 \u6539\u6210 50\uFF0C\u7ACB\u523B\u5C31\u6709 50 \u6761\uFF0C\u4E0D\u5FC5\u4ECE\u6B64\u523B\u91CD\u65B0\u6512\u3002",
  recentSortName: "\u600E\u4E48\u6392",
  recentSortDesc: "\u300C\u521A\u624D\u6211\u5728\u54EA\u300D\u548C\u300C\u6211\u6700\u8FD1\u6539\u4E86\u4EC0\u4E48\u300D\u662F\u4E24\u4E2A\u4E0D\u540C\u7684\u95EE\u9898\u2014\u2014\u8BFB\u4E86\u4E00\u5929\u8D44\u6599\u6CA1\u52A8\u7B14\u7684\u4EBA\u95EE\u524D\u8005\uFF0C\u5199\u4E86\u4E00\u5929\u7684\u4EBA\u95EE\u540E\u8005\u3002",
  pasteLinkName: "\u7C98\u8D34\u5230\u9009\u4E2D\u6587\u5B57\u4E0A\uFF1D\u52A0\u5916\u94FE",
  pasteLinkDesc: "\u9009\u4E2D\u4E00\u6BB5\u6587\u5B57\uFF0C\u76F4\u63A5 Cmd + V \u7C98\u4E00\u6761\u7F51\u5740\uFF0C\u90A3\u6BB5\u6587\u5B57\u5C31\u53D8\u6210\u6307\u5411\u5B83\u7684\u5916\u94FE\u3002\u56DB\u6761\u90FD\u6EE1\u8DB3\u624D\u4F1A\u52A8\u624B\uFF1A\u9009\u4E86\u5B57\u3001\u526A\u8D34\u677F\u91CC\u53EA\u6709\u4E00\u6761**\u5E26\u534F\u8BAE**\u7684\u7F51\u5740\uFF08www \u5F00\u5934\u7684\u88F8\u57DF\u540D\u4E0D\u7B97\uFF09\u3001\u9009\u4E2D\u7684\u6587\u5B57\u91CC\u6CA1\u6709\u6362\u884C\u3001\u8FD9\u6B21\u7C98\u8D34\u8FD8\u6CA1\u88AB\u522B\u7684\u63D2\u4EF6\u5904\u7406\u8FC7\u3002\u4EFB\u4F55\u4E00\u6761\u4E0D\u6EE1\u8DB3\u5C31\u539F\u6837\u7C98\u8D34\u3002",
  rememberCursorName: "\u8BB0\u4F4F\u6BCF\u7BC7\u7B14\u8BB0\u7684\u5149\u6807\u4F4D\u7F6E",
  rememberCursorDesc: "\u79BB\u5F00\u4E00\u7BC7\u7B14\u8BB0\u65F6\u8BB0\u4E0B\u5149\u6807\u5728\u7B2C\u51E0\u884C\u3001\u6EDA\u52A8\u6761\u5728\u54EA\u513F\uFF0C\u4E0B\u6B21\u6253\u5F00\u5C31\u56DE\u5230\u90A3\u91CC\uFF0C\u91CD\u542F Obsidian \u4E5F\u8FD8\u5728\u3002\u5B83\u4E0D\u4E0E\u4F60\u7684\u70B9\u51FB\u62A2\uFF1A\u4ECE\u4E00\u6761\u5E26\u951A\u70B9\u7684\u53CC\u94FE\u8DF3\u8FDB\u6765\u65F6\uFF0CObsidian \u5DF2\u7ECF\u628A\u5149\u6807\u653E\u597D\u4E86\uFF0C\u8FD9\u65F6\u5B83\u4E0D\u63D2\u624B\u3002\u4F4D\u7F6E\u8BB0\u5728\u63D2\u4EF6\u76EE\u5F55\u7684 cursor-positions.json \u91CC\uFF0C\u4E0D\u8FDB\u4F60\u7684\u8BBE\u7F6E\u6587\u4EF6\uFF0C\u4E5F\u4E0D\u5199\u8FDB\u4EFB\u4F55\u4E00\u7BC7\u7B14\u8BB0\u3002",
  advancedHeading: "\u9AD8\u7EA7\u8BBE\u7F6E\uFF08\u4E00\u822C\u4E0D\u7528\u6539\uFF09",
  advancedSuffixPrefix: "\u8BFE\u7A0B\u9ED8\u8BA4\u503C ",
  advancedSuffixTail: "\uFF0C\u6539\u524D\u4E09\u601D\u3002"
};
var RECENT_SORT_LABELS = {
  opened: "\u6309\u6253\u5F00\u65F6\u95F4\uFF08\u6700\u8FD1\u6253\u5F00\u7684\u5728\u6700\u4E0A\u9762\uFF09",
  modified: "\u6309\u4FEE\u6539\u65F6\u95F4\uFF08\u6700\u8FD1\u6539\u8FC7\u7684\u5728\u6700\u4E0A\u9762\uFF09"
};
var FOLDER_COUNT_LABELS = {
  notes: "\u7B14\u8BB0",
  folders: "\u6587\u4EF6\u5939",
  all: "\u5168\u90E8\u6761\u76EE\uFF08\u542B\u9644\u4EF6\uFF09"
};
var TEXT_FIELDS = [
  { key: "projectFolder", tab: "projects", name: "\u9879\u76EE\u76EE\u5F55", hint: "\u6B63\u5728\u63A8\u8FDB\u7684\u9879\u76EE\u653E\u5728\u8FD9\u91CC\uFF1B\u8BFB\u4E66\u7B14\u8BB0\u4E5F\u843D\u5728\u8FD9\u91CC\u3002", advanced: true },
  { key: "areaFolder", tab: "projects", name: "\u9886\u57DF\u76EE\u5F55", hint: "\u957F\u671F\u5173\u6CE8\u3001\u6CA1\u6709\u7EC8\u70B9\u7684\u9886\u57DF\u653E\u5728\u8FD9\u91CC\u3002", advanced: true },
  { key: "archiveFolder", tab: "projects", name: "\u5F52\u6863\u76EE\u5F55", hint: "\u5B8C\u6210\u3001\u6682\u505C\u3001\u653E\u5F03\u7684\u9879\u76EE\u4F1A\u642C\u5230\u8FD9\u91CC\uFF1B\u4EBA\u8109\u6863\u6848\u642C\u8FDB\u6765\u5373\u9000\u51FA\u5168\u90E8\u540D\u5F55\u3002", advanced: true },
  { key: "inspirationFolder", tab: "inspiration", name: "\u6587\u4EF6\u5939", hint: "\u7075\u611F\u7B14\u8BB0\u653E\u5728\u54EA\u4E2A\u6587\u4EF6\u5939\u3002\u76F8\u5BF9\u4E8E\u7B14\u8BB0\u5E93\u6839\u76EE\u5F55\u3002", advanced: false },
  { key: "inspirationFileName", tab: "inspiration", name: "\u7B14\u8BB0\u540D\u79F0", hint: "\u7075\u611F\u5199\u5165\u54EA\u4E00\u7BC7\u7B14\u8BB0\uFF1B\u6CA1\u5199 .md \u65F6\u4F1A\u81EA\u52A8\u8865\u9F50\u3002", advanced: false },
  { key: "inspirationHeading", tab: "inspiration", name: "\u5B9A\u4F4D\u6807\u9898", hint: "\u9009\u62E9\u6807\u9898\u63D2\u5165\u65F6\uFF0C\u7528\u5B83\u5B9A\u4F4D\u5177\u4F53\u533A\u57DF\u3002\u53EF\u5199\u201C\u7075\u611F\u96C6\u201D\u6216\u5B8C\u6574 Markdown \u6807\u9898\u3002", advanced: false },
  { key: "diaryFolder", tab: "review", name: "\u590D\u76D8\u76EE\u5F55", hint: "\u65E5/\u5468/\u6708/\u5B63/\u5E74\u4E94\u7EA7\u590D\u76D8\u7684\u65F6\u95F4\u8F74\u6839\u76EE\u5F55\uFF0C\u4E94\u4E2A\u5B50\u76EE\u5F55\u7531\u5B83\u6D3E\u751F\u3002", advanced: true },
  { key: "clientSources", tab: "contacts", section: "\u5BA2\u6237", name: "\u5BA2\u6237\u6E20\u9053", hint: "\u300C\u65B0\u5EFA\u5BA2\u6237\u300D\u7684\u6E20\u9053\u5019\u9009\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002\u8D70\u9009\u62E9\u800C\u975E\u624B\u6253\uFF0C\u7EDF\u8BA1\u624D\u4E0D\u4F1A\u88AB\u540C\u4E49\u5199\u6CD5\u6253\u6563\u3002", advanced: false },
  { key: "clientProducts", tab: "contacts", section: "\u5BA2\u6237", name: "\u4EA7\u54C1\u6E05\u5355", hint: "\u300C\u589E\u52A0\u4ED8\u8D39\u300D\u7684\u4EA7\u54C1\u5019\u9009\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002\u5199\u4F60\u81EA\u5DF1\u5728\u5356\u7684\u4E1C\u897F\u3002", advanced: false },
  { key: "contactFolder", tab: "contacts", section: "\u4EBA\u8109", name: "\u4EBA\u8109\u76EE\u5F55", hint: "\u4EBA\u7269\u6863\u6848\u5E73\u94FA\u5B58\u653E\u5728\u8FD9\u91CC\uFF1B\u89C6\u56FE\u9760 type \u8BA4\u4EBA\uFF0C\u632A\u8D70\u4E5F\u4E0D\u5F71\u54CD\u3002", advanced: true },
  { key: "clientFolder", tab: "contacts", section: "\u5BA2\u6237", name: "\u5BA2\u6237\u76EE\u5F55", hint: "\u4ED8\u8D39\u7528\u6237\u6863\u6848\u653E\u5728\u8FD9\u91CC\uFF0C\u8FD0\u884C\u300C\u521D\u59CB\u5316\u5BA2\u6237\u6A21\u5757\u300D\u540E\u624D\u4F1A\u7528\u5230\u3002", advanced: true },
  { key: "dateTimeFormat", tab: "setup", name: "\u65F6\u95F4\u683C\u5F0F", hint: "created \u4E0E updated \u5B57\u6BB5\u7684\u5199\u6CD5\uFF0Cmoment \u8BED\u6CD5\u3002", advanced: true }
];
var BOOK_TAG_PREFIX_FIELD = {
  key: "bookTagPrefix",
  name: "\u6807\u7B7E\u524D\u7F00",
  hint: "\u8C46\u74E3\u7684\u300C\u65B9\u6CD5\u8BBA\u300D\u4F1A\u5199\u6210 #\u4E66\u7C4D/\u65B9\u6CD5\u8BBA\u3002\u524D\u7F00\u8BA9\u6574\u4E2A\u4E66\u67B6\u7684\u5206\u7C7B\u6210\u7247\uFF0C\u4E0D\u4E0E\u7075\u611F\u3001\u5361\u7247\u91CC\u7684\u540C\u540D\u6807\u7B7E\u6DF7\u5728\u4E00\u8D77\u3002",
  advanced: false
};

// src/settingsPanels.ts
var import_obsidian41 = require("obsidian");
var FIELDS_ONLY = () => {
};
var SettingsPanels = class {
  constructor(host) {
    /**
     * 「已摆出 N / 35 条」那行字。
     *
     * 这是全文件唯一一处持有 DOM 引用的地方，理由很具体：勾选要即时更新这个数，
     * 而重建整页会把滚动条弹回顶部——三十五行排下来，用户勾第二十行时页面一跳，
     * 他就得重新找回刚才那一行。持有的是一个渲染出来的节点，不是第二份状态：
     * 数字仍然现算自设置对象，每次重画也会把它换成新节点。
     */
    this.ribbonCountEl = null;
    this.host = host;
    this.ctx = host.ctx;
    this.actions = host.actions;
    this.render = {
      // 开荒页自有控件两件：初始化按钮，加外观开关的显隐——外观包是开荒交付物的一部分，
      // 它唯一的开关跟着交付物走，不另占一页
      setup: (el) => {
        this.renderInitButton(el);
        this.renderAppearancePanel(el);
      },
      projects: (el) => this.renderProjectsPanel(el),
      inspiration: (el) => this.renderInspirationPanel(el),
      review: FIELDS_ONLY,
      contacts: FIELDS_ONLY,
      editing: (el) => this.renderEditingPanel(el),
      explorer: (el) => this.renderExplorerPanel(el),
      ribbon: (el) => this.renderRibbonPanel(el)
    };
  }
  // ============================================================
  // 一、开荒页：一个按钮
  // ============================================================
  /**
   * 开荒按钮：一句状态说明 + 一个按钮。
   * 按钮点下后先禁用再执行，防止连点开出两次流程；完成后重建整个面板，
   * 状态说明随之从「尚未初始化」翻面成「已就绪」——停留的页不变，重建的是内容。
   */
  renderInitButton(containerEl) {
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.initName).setDesc(this.describeInitState()).addButton((button) => {
      button.setButtonText(TEXTS6.initButton).setCta().onClick(async () => {
        button.setDisabled(true);
        try {
          await this.actions.initialize();
        } finally {
          this.host.rebuild();
        }
      });
    });
  }
  /** 用 initializedAt 是否为空来决定说什么：这是「首次开荒」与「幂等补齐」的唯一判据 */
  describeInitState() {
    const { initializedAt } = this.ctx.settings;
    if (!initializedAt) return TEXTS6.initPending;
    return TEXTS6.initReadyPrefix + initializedAt + TEXTS6.initReadySuffix;
  }
  // ============================================================
  // 二、项目页：两个自动行为，加读书笔记那一段
  // ============================================================
  /** 插件仅有的两个常驻监听都住在 modules/projects，所以它们的开关也该在这一页 */
  renderProjectsPanel(containerEl) {
    this.host.renderToggle(containerEl, "autoCardInit", TEXTS6.autoCardName, TEXTS6.autoCardDesc);
    this.host.renderToggle(containerEl, "autoUpdated", TEXTS6.autoUpdatedName, TEXTS6.autoUpdatedDesc);
    this.renderBooksSection(containerEl);
  }
  /**
   * 读书笔记的三项设置，同住项目页——一本书就是一个项目，不另开一页。
   *
   * 三项按「书建出来长什么样 → 划线从哪儿来」排：前两项决定标签怎么写，
   * 第三项是全插件唯一一处凭据的开关。书目字段（作者、ISBN、出版社）一项都不在这里，
   * 因为它们没有口味可言——豆瓣怎么写就怎么落，让人去配等于让人去改事实。
   */
  renderBooksSection(containerEl) {
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.booksHeading).setDesc(TEXTS6.booksIntro).setHeading();
    this.host.renderTextField(containerEl, BOOK_TAG_PREFIX_FIELD);
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.bookTagCountName).setDesc(TEXTS6.bookTagCountDesc).addDropdown((dropdown) => {
      for (const count of BOOK_TAG_COUNTS) {
        dropdown.addOption(String(count), count === 0 ? "\u4E0D\u5199\u6807\u7B7E" : `\u524D ${count} \u4E2A`);
      }
      dropdown.setValue(String(this.normalizeBookTagCount(this.ctx.settings.bookTagCount))).onChange(async (value) => {
        this.ctx.settings.bookTagCount = this.normalizeBookTagCount(Number(value));
        await this.ctx.saveSettings();
      });
    });
    this.renderWereadRow(containerEl);
  }
  /** 防御手改 data.json 写进来的怪数：不在候选里就回落默认，与灵感插入位置同一姿态 */
  normalizeBookTagCount(value) {
    return BOOK_TAG_COUNTS.includes(value) ? value : DEFAULT_SETTINGS.bookTagCount;
  }
  /**
   * 微信读书的连接状态，加一个按钮。
   *
   * 它是设置而不只是命令，理由是「人主导」：这是全插件唯一一份存在 data.json 里的凭据，
   * 那就必须有一处能看见它在不在、并且能当场撤掉。命令面板里那条「连接微信读书」
   * 只能连不能断——一条只往一个方向走的命令，不构成开关。
   * 断开只清掉本机存的那串 Cookie，不去动微信读书那边的任何东西：
   * 插件从来不代替用户管理他在别人家的账号。
   */
  renderWereadRow(containerEl) {
    const connected = !!this.ctx.settings.wereadCookie.trim();
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.wereadName).setDesc(
      import_obsidian41.Platform.isDesktopApp ? connected ? TEXTS6.wereadConnected : TEXTS6.wereadDisconnected : TEXTS6.wereadMobile
    ).addButton((button) => {
      button.setButtonText(connected ? "\u65AD\u5F00" : "\u626B\u7801\u8FDE\u63A5").setDisabled(!import_obsidian41.Platform.isDesktopApp);
      if (!connected) button.setCta();
      button.onClick(async () => {
        button.setDisabled(true);
        try {
          if (connected) {
            await this.actions.disconnectWeread();
          } else {
            await this.actions.connectWeread();
          }
        } finally {
          this.host.rebuild();
        }
      });
    });
  }
  // ============================================================
  // 三、灵感页：落点、位置与格式
  // ============================================================
  /**
   * 灵感页上的每一项都是「记录灵感」命令的下一次运行参数。
   * 落点那三个文本框已由骨架照字段表画在上方，这里只补两个非文本控件。
   */
  renderInspirationPanel(containerEl) {
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.inspirationPositionName).setDesc(TEXTS6.inspirationPositionDesc).addDropdown((dropdown) => {
      dropdown.addOption("heading-top", "\u6807\u9898\u4E0B\u65B9\uFF08\u65B0\u5185\u5BB9\u5728\u524D\uFF09").addOption("heading-bottom", "\u6807\u9898\u533A\u672B\u5C3E\uFF08\u65B0\u5185\u5BB9\u5728\u540E\uFF09").addOption("file-top", "\u6B63\u6587\u9876\u90E8").addOption("file-bottom", "\u6B63\u6587\u5E95\u90E8").setValue(this.normalizeInspirationPosition(this.ctx.settings.inspirationInsertPosition)).onChange(async (value) => {
        const position = this.normalizeInspirationPosition(value);
        this.ctx.settings.inspirationInsertPosition = position;
        await this.ctx.saveSettings();
      });
    });
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.inspirationFormatName).setDesc(TEXTS6.inspirationFormatDesc).addTextArea((textArea) => {
      textArea.setPlaceholder(INSPIRATION_DEFAULTS.format).setValue(this.ctx.settings.inspirationFormat).onChange(async (value) => {
        this.ctx.settings.inspirationFormat = value;
        await this.ctx.saveSettings();
      });
      textArea.inputEl.rows = 3;
      textArea.inputEl.style.width = "100%";
    });
  }
  /** 防御手改 data.json 产生的未知枚举值，设置面板与写入模块保持同一回落策略 */
  normalizeInspirationPosition(value) {
    const candidate = value;
    return INSPIRATION_INSERT_POSITIONS.includes(candidate) ? candidate : INSPIRATION_DEFAULTS.insertPosition;
  }
  // ============================================================
  // 四、排版段：编辑页的后半截，一个自动开关加九条规则
  // ============================================================
  /**
   * 排版：先决定「要不要替我按」，再决定「按下去做哪几件事」。
   *
   * 两者刻意不合成一个开关：自动整理关掉之后，命令仍然照这九条勾选执行——
   * 规则回答的是「标准写法是什么」，自动回答的是「谁来按」，把它们绑在一起，
   * 就没法表达「我自己按，但按下去要全套」这个再正常不过的用法。
   *
   * v0.17.0 起它不再是一整页，而是「编辑」页的后半截：排版与粘贴、光标发生在
   * 同一个时刻（都在你敲字的那会儿），单列成页会逼学员先分清「整理格式算不算编辑」
   * 才知道该翻哪一页。前面那道小标题由 renderEditingPanel 落下。
   */
  renderFormatSection(containerEl) {
    this.host.renderToggle(
      containerEl,
      "autoFormat",
      TEXTS6.autoFormatName,
      TEXTS6.autoFormatDesc
    );
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.formatRulesHeading).setDesc(TEXTS6.formatRulesIntro).setHeading();
    for (const rule of FORMAT_RULES) {
      this.renderRuleRow(containerEl, rule.key, rule.name, rule.desc);
    }
  }
  /**
   * 一条规则一行。
   *
   * 它与边栏那三十行是同一种控件——勾选决定一个 id 在不在清单里，而不是翻一个布尔字段。
   * 存清单而不是九个布尔字段，是为了让「加一条规则」不必动设置契约：
   * 老库升级时那条新规则不在清单里，于是默认不开，这与「不替用户改他没选过的东西」同源。
   */
  renderRuleRow(containerEl, key, name, desc) {
    new import_obsidian41.Setting(containerEl).setName(name).setDesc(desc).addToggle((toggle) => {
      toggle.setValue(this.ctx.settings.formatRules.includes(key)).onChange(async (value) => {
        this.ctx.settings.formatRules = this.nextFormatRules(key, value);
        await this.ctx.saveSettings();
      });
    });
  }
  /**
   * 算出勾选之后的新清单。
   *
   * 与 nextRibbonCommands 同法同因：照 FORMAT_RULES 重排一遍而不是往旧数组里增删，
   * 于是顺序永远等于规则表的顺序，data.json 里混进的不认识的 id 也在第一次勾选时被扫掉。
   * 返回新数组，绝不原地改——它在用户没调过时与 DEFAULT_SETTINGS 共用引用。
   */
  nextFormatRules(key, enabled) {
    const chosen = new Set(this.ctx.settings.formatRules);
    if (enabled) chosen.add(key);
    else chosen.delete(key);
    return FORMAT_RULES.map((rule) => rule.key).filter((candidate) => chosen.has(candidate));
  }
  // ============================================================
  // 五、外观开关：一个开关，随开荒页交付
  // ============================================================
  /** 这一页管的是「右下角要不要常驻这个按钮」，不管片段本身开着还是关着 */
  renderAppearancePanel(containerEl) {
    this.host.renderToggle(
      containerEl,
      "showAppearanceSwitch",
      TEXTS6.appearanceSwitchName,
      TEXTS6.appearanceSwitchDesc,
      this.actions.syncAppearanceSwitch
    );
  }
  // ============================================================
  // 六、边栏页：三十五行
  // ============================================================
  /**
   * 边栏页：一句说明 + 按分组排下来的三十行。
   *
   * 清单现读花名册而不是自己维护一份，因此它与命令面板里能搜到的命令永远是同一批；
   * 分组标题按「相邻两行的 group 不同」切出来，与外观开关面板用的是同一套画法——
   * 分组顺序不需要另一张表，它就是命令的注册顺序。
   */
  renderRibbonPanel(containerEl) {
    const summary = new import_obsidian41.Setting(containerEl).setName(this.describeRibbonCount()).setDesc(TEXTS6.ribbonIntro);
    this.ribbonCountEl = summary.nameEl;
    let currentGroup = "";
    for (const command of this.ctx.commands.list()) {
      if (command.spec.group !== currentGroup) {
        currentGroup = command.spec.group;
        containerEl.createDiv({ cls: "ziminos-ribbon-group", text: currentGroup });
      }
      this.renderRibbonRow(containerEl, command.spec);
    }
  }
  /** 只改那一个数字，不重建页面——重建会把滚动条弹回顶部 */
  refreshRibbonCount() {
    if (this.ribbonCountEl) this.ribbonCountEl.setText(this.describeRibbonCount());
  }
  /**
   * 「已摆出 7 / 30 条」。给的是一个量级感：勾多了那条边栏会变成谁也不看的图标柱。
   * 总数现算自花名册，不写死——这一页不认识任何一条具体命令，也就不该认识它们有几条。
   */
  describeRibbonCount() {
    const total = this.ctx.commands.list().length;
    return TEXTS6.ribbonCountPrefix + this.ctx.settings.ribbonCommands.length + TEXTS6.ribbonCountSeparator + total + TEXTS6.ribbonCountSuffix;
  }
  /** 一行：图标 + 命令名 + 开关。图标带着它的分组功能色，就是它在边栏上的样子，勾之前先看见 */
  renderRibbonRow(containerEl, spec) {
    const { id, icon, name } = spec;
    const label = createFragment((frag) => {
      const iconEl = frag.createSpan({ cls: "ziminos-ribbon-icon" });
      (0, import_obsidian41.setIcon)(iconEl, icon);
      iconEl.style.color = GROUP_COLORS[spec.group];
      frag.createSpan({ text: name });
    });
    new import_obsidian41.Setting(containerEl).setName(label).setClass("ziminos-ribbon-row").addToggle((toggle) => {
      toggle.setValue(this.ctx.settings.ribbonCommands.includes(id)).onChange(async (value) => {
        this.ctx.settings.ribbonCommands = this.nextRibbonCommands(id, value);
        await this.ctx.saveSettings();
        this.actions.syncRibbon();
        this.refreshRibbonCount();
      });
    });
  }
  /**
   * 算出勾选之后的新清单。
   *
   * 一律照花名册重排一遍而不是往旧数组里增删：其一，边栏顺序因此永远等于命令的注册顺序，
   * 与用户先勾哪个无关；其二，data.json 里若混进了不认识的 id（换过版本、手改过文件），
   * 第一次勾选就顺手扫掉，不会留一条永远没人认领的记录。
   * 返回的是新数组，绝不原地改——ribbonCommands 在用户没调过时与 DEFAULT_SETTINGS 共用引用。
   */
  nextRibbonCommands(id, enabled) {
    const chosen = new Set(this.ctx.settings.ribbonCommands);
    if (enabled) chosen.add(id);
    else chosen.delete(id);
    return this.ctx.commands.list().map((command) => command.spec.id).filter((candidate) => chosen.has(candidate));
  }
  // ============================================================
  // 七、文件页：文件夹计数、最近文件与状态栏路径
  // ============================================================
  /**
   * 文件页：三样东西回答同一个问题——我在哪、有哪些、刚才去过哪儿。
   *
   * 顺序是从「一眼扫过去」到「专门去找」：文件夹计数是不请自来的（那棵树上就有），
   * 最近文件要自己请出来，状态栏那一块又回到不请自来但住在屏幕另一端。
   * 每一项都得叫一声 syncExplorer：它们改的不是「下一次触发时怎么办」，
   * 而是**此刻**屏幕上那些东西本身——目录树与侧栏清单都不会自己再读一次设置。
   * 口径与条数在开关关着时照样可改，理由与排版页那九条规则一样：
   * 口径回答的是「该显示什么」，开关回答的是「要不要摆出来」，
   * 绑在一起就没法表达「先把口径调好，回头再打开看」。
   */
  renderExplorerPanel(containerEl) {
    this.host.renderToggle(
      containerEl,
      "showFolderCount",
      TEXTS6.folderCountName,
      TEXTS6.folderCountDesc,
      this.actions.syncExplorer
    );
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.folderCountTargetName).setDesc(TEXTS6.folderCountTargetDesc).addDropdown((dropdown) => {
      for (const target of FOLDER_COUNT_TARGETS) {
        dropdown.addOption(target, FOLDER_COUNT_LABELS[target]);
      }
      dropdown.setValue(this.normalizeFolderCountTarget(this.ctx.settings.folderCountTarget)).onChange(async (value) => {
        this.ctx.settings.folderCountTarget = this.normalizeFolderCountTarget(value);
        await this.ctx.saveSettings();
        this.actions.syncExplorer();
      });
    });
    this.host.renderToggle(
      containerEl,
      "folderCountRecursive",
      TEXTS6.folderCountRecursiveName,
      TEXTS6.folderCountRecursiveDesc,
      this.actions.syncExplorer
    );
    this.renderRecentSection(containerEl);
    this.host.renderToggle(
      containerEl,
      "showFilePath",
      TEXTS6.filePathName,
      TEXTS6.filePathDesc,
      this.actions.syncExplorer
    );
  }
  /** 最近文件那一段：一句说明，加「显示几条」与「怎么排」两个下拉框 */
  renderRecentSection(containerEl) {
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.recentHeading).setDesc(TEXTS6.recentIntro).setHeading();
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.recentLimitName).setDesc(TEXTS6.recentLimitDesc).addDropdown((dropdown) => {
      for (const limit of RECENT_FILES_LIMITS) {
        dropdown.addOption(String(limit), `${limit} \u6761`);
      }
      dropdown.setValue(String(this.normalizeRecentLimit(this.ctx.settings.recentFilesLimit))).onChange(async (value) => {
        this.ctx.settings.recentFilesLimit = this.normalizeRecentLimit(Number(value));
        await this.ctx.saveSettings();
        this.actions.syncExplorer();
      });
    });
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.recentSortName).setDesc(TEXTS6.recentSortDesc).addDropdown((dropdown) => {
      for (const sort of RECENT_FILES_SORTS) {
        dropdown.addOption(sort, RECENT_SORT_LABELS[sort]);
      }
      dropdown.setValue(this.normalizeRecentSort(this.ctx.settings.recentFilesSort)).onChange(async (value) => {
        this.ctx.settings.recentFilesSort = this.normalizeRecentSort(value);
        await this.ctx.saveSettings();
        this.actions.syncExplorer();
      });
    });
  }
  // ============================================================
  // 八、编辑页：打字时发生的三件事（粘贴、光标，加后半截的排版）
  // ============================================================
  /**
   * 编辑页：你在编辑器里敲字时发生的全部事情。
   *
   * 三件事同住一页是用户在 v0.17.0 明令的，判据比前几处并页都直白——
   * **它们发生在同一个时刻**：粘贴变成链接、光标记住位置、走开之后这一篇
   * 被整理成标准写法。排版单列成页时，学员得先分清「整理格式算不算编辑」
   * 才知道该翻哪一页，而那个问题本身就不该存在。
   *
   * 页内的先后是「立刻发生的」在前、「走开之后发生的」在后：
   * 粘贴与光标是你按下键的那一瞬间，排版是你离开这一篇之后。
   * 三项都不需要叫任何人重画——监听与记忆每次触发都现读设置对象，天然看得见新值；
   * 这一页因此是八张页里唯一「改完什么都不用同步」的一张，
   * 那正好说明它管的不是屏幕上的东西，而是行为。
   */
  renderEditingPanel(containerEl) {
    this.host.renderToggle(
      containerEl,
      "pasteLinkEnabled",
      TEXTS6.pasteLinkName,
      TEXTS6.pasteLinkDesc
    );
    this.host.renderToggle(
      containerEl,
      "rememberCursor",
      TEXTS6.rememberCursorName,
      TEXTS6.rememberCursorDesc
    );
    new import_obsidian41.Setting(containerEl).setName(TEXTS6.formatHeading).setDesc(TEXTS6.formatIntro).setHeading();
    this.renderFormatSection(containerEl);
  }
  /** 防御手改 data.json 产生的未知口径，与灵感插入位置同一姿态、同一回落策略 */
  normalizeFolderCountTarget(value) {
    const candidate = value;
    return FOLDER_COUNT_TARGETS.includes(candidate) ? candidate : FOLDER_COUNT_DEFAULTS.target;
  }
  /** 同上。不在候选里的条数一律回落默认，而不是照单全收一个写死在别处的怪数 */
  normalizeRecentLimit(value) {
    return RECENT_FILES_LIMITS.includes(value) ? value : RECENT_FILES_DEFAULTS.limit;
  }
  normalizeRecentSort(value) {
    const candidate = value;
    return RECENT_FILES_SORTS.includes(candidate) ? candidate : RECENT_FILES_DEFAULTS.sort;
  }
};

// src/settings.ts
var ZiminosSettingTab = class extends import_obsidian42.PluginSettingTab {
  constructor(ctx, actions) {
    super(ctx.app, ctx.plugin);
    /**
     * 当前停在哪一页。
     *
     * 这是页面状态而非领域状态，因此刻意不进 data.json——设置对象里存的都是
     * 「这个库是什么样」，而不是「上次那个人翻到了第几页」。
     * 它随本条插件实例存活，也就是关掉设置弹窗再打开仍停在原页、重启 Obsidian 归位，
     * 与 Obsidian 自己记住你上次停在哪个插件设置页是同一档待遇。
     */
    this.activeTab = TABS[0];
    this.ctx = ctx;
    this.actions = actions;
    this.panels = new SettingsPanels(this);
  }
  /** 面板改完状态要让整页翻面时叫它。语义与 display 完全一致，名字换成面板那边看得懂的 */
  rebuild() {
    this.display();
  }
  /** 每次打开设置页都整体重建，保证显示的永远是设置对象的当前值 */
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("ziminos-settings");
    this.renderTabBar(containerEl);
    this.renderPanel(containerEl.createDiv({ cls: "ziminos-settings-body" }));
  }
  // ============================================================
  // 一、标签栏与分页骨架
  // ============================================================
  /**
   * 标签栏：十枚按钮收进一条分段式控件里，当前页从容器底色上凸起。
   * 分段式而不是十颗散摆的按钮，是因为它们其实只是十个位置——
   * 一条共享的槽把这层语义画了出来，按钮自己反而要卸干净立体外观。
   * 用真的 button 而非 div，键盘与读屏器才认得它。
   */
  renderTabBar(containerEl) {
    const bar = containerEl.createDiv({ cls: "ziminos-settings-tabs" });
    const rail = bar.createDiv({ cls: "ziminos-settings-tabrail" });
    for (const tab of TABS) {
      const active = tab.id === this.activeTab.id;
      const button = rail.createEl("button", {
        cls: "ziminos-settings-tab",
        // aria-pressed 而不是 role=tab：没实现方向键遍历就自称 tablist 是撒谎，
        // 而「一枚按下去的按钮」既属实，读屏器也照样播报得清楚
        attr: { type: "button", "aria-pressed": String(active) }
      });
      if (active) button.addClass("is-active");
      (0, import_obsidian42.setIcon)(button.createSpan({ cls: "ziminos-settings-tab-icon" }), tab.icon);
      button.createSpan({ text: tab.label });
      button.addEventListener("click", () => this.switchTo(tab));
    }
  }
  /** 换页。同一页再点一次不重建，否则正在编辑的输入框会被换掉 */
  switchTo(tab) {
    if (tab.id === this.activeTab.id) return;
    this.activeTab = tab;
    this.display();
    this.containerEl.scrollTop = 0;
  }
  /**
   * 一页的固定骨架：页头 → 明面上的文本字段 → 本页自有控件 → 高级折叠区。
   *
   * 四段的先后是一条跨七页的承诺，两头各占一句：页头永远先说清这一页是谁、跑没跑起来；
   * 折叠区永远在最后，于是任何一页往下翻到底，危险的东西都在同一个位置、同一个标题下，
   * 不需要每页重新找一遍。中间两段的顺序是「先说东西放哪儿，再说怎么用它」——
   * 灵感页把落点三问排在插入位置与格式之前，正是这条顺序，不必自己再画一次字段。
   *
   * 唯一排在折叠区之后的是开荒页尾的作者名片：它不是设置，是这套交付物的落款，
   * 落款排在正文与附录之后，正是它在纸上的位置。
   */
  renderPanel(body) {
    const tab = this.activeTab;
    const header = new import_obsidian42.Setting(body).setDesc(tab.status).setHeading();
    const title = header.nameEl.createSpan({ cls: "ziminos-settings-page-title" });
    (0, import_obsidian42.setIcon)(title.createSpan({ cls: "ziminos-settings-page-icon" }), tab.icon);
    title.createSpan({ text: tab.module });
    this.renderTextFields(body, tab.id, false);
    this.panels.render[tab.id](body);
    this.renderAdvancedFold(body, tab.id);
    if (tab.id === "setup") this.renderAboutFooter(body);
  }
  /**
   * 开荒页尾的作者名片。
   * 名片画什么由 about 模块决定，这里只递一个容器过去；
   * 首页导航尾部那个「关于作者」视图块画的是同一张，两处不可能对不齐。
   */
  renderAboutFooter(body) {
    const footer = body.createDiv({ cls: "ziminos-settings-footer" });
    footer.createDiv({ cls: "ziminos-settings-footer-title", text: "\u5173\u4E8E\u4F5C\u8005" });
    this.actions.renderAbout(footer);
  }
  // ============================================================
  // 二、通用控件：开关、文本框、折叠区
  // ============================================================
  /**
   * 渲染一个布尔开关。
   *
   * 改动立即落盘。两个自动化开关不需要 onApplied——监听方每次触发都现读设置，
   * 天然看得见新值；只有已经画在屏幕上的东西（状态栏按钮）才需要有人去推它一把。
   */
  renderToggle(containerEl, key, name, desc, onApplied) {
    new import_obsidian42.Setting(containerEl).setName(name).setDesc(desc).addToggle((toggle) => {
      toggle.setValue(this.ctx.settings[key]).onChange(async (value) => {
        this.ctx.settings[key] = value;
        await this.ctx.saveSettings();
        onApplied == null ? void 0 : onApplied();
      });
    });
  }
  /**
   * 画出本页某一档（明面/高级）的全部文本字段。没有就一个都不画，也不留空标题。
   * 带段名的字段在段名一变时先落一道小标题——人脉页靠它把「人脉」与「客户」分开，
   * 而绝大多数页一个段名都没有，于是一道标题也不会多出来。
   */
  renderTextFields(containerEl, tab, advanced) {
    var _a;
    const fields = TEXT_FIELDS.filter(
      (field2) => field2.tab === tab && field2.advanced === advanced
    );
    let currentSection = "";
    for (const field2 of fields) {
      const section = (_a = field2.section) != null ? _a : "";
      if (section && section !== currentSection) {
        new import_obsidian42.Setting(containerEl).setName(section).setHeading();
      }
      currentSection = section;
      this.renderTextField(containerEl, field2);
    }
  }
  /**
   * 本页的高级折叠区。默认折叠，本页没有高级字段就整块不出现——
   * 一个点开来是空的折叠区，比没有这个折叠区更让人怀疑自己漏了什么。
   */
  renderAdvancedFold(containerEl, tab) {
    const hasAdvanced = TEXT_FIELDS.some((field2) => field2.tab === tab && field2.advanced);
    if (!hasAdvanced) return;
    const details = containerEl.createEl("details", { cls: "ziminos-advanced" });
    details.createEl("summary", { text: TEXTS6.advancedHeading });
    this.renderTextFields(details, tab, true);
  }
  /**
   * 渲染一个文本框。
   * 这里刻意不做清洗与校验：留空或写错的值由各功能模块在使用时回落到默认值，
   * 校验集中在读取侧，设置页只负责如实记录用户敲进去的字。
   */
  renderTextField(containerEl, field2) {
    const fallback = DEFAULT_SETTINGS[field2.key];
    const desc = field2.advanced ? `${field2.hint}${TEXTS6.advancedSuffixPrefix}${fallback}${TEXTS6.advancedSuffixTail}` : field2.hint;
    new import_obsidian42.Setting(containerEl).setName(field2.name).setDesc(desc).addText((text3) => {
      text3.setPlaceholder(fallback).setValue(this.ctx.settings[field2.key]).onChange(async (value) => {
        this.ctx.settings[field2.key] = value;
        await this.ctx.saveSettings();
      });
    });
  }
};

// src/main.ts
var ZiminosPlugin = class extends import_obsidian43.Plugin {
  constructor() {
    super(...arguments);
    /**
     * 全局唯一的设置对象。
     * 它会被原样放进 ZiminosContext，各模块与设置页读写的都是这同一份引用——
     * 设置页改完一个开关，正在监听的模块下次触发时立刻看见新值，中间没有任何同步环节。
     */
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    const edition = await readEdition(this.app);
    const ctx = {
      app: this.app,
      plugin: this,
      settings: this.settings,
      saveSettings: () => this.saveData(this.settings),
      // 守卫必须全库唯一：写方标记与监听方查询共用同一份记录，自写抑制才成立
      guard: new SelfWriteGuard(),
      // 注册台同样全库唯一：它手里那份花名册就是左侧边栏与设置页看到的命令清单
      commands: new CommandRegistry(this),
      edition
    };
    this.register(disposeWereadSession);
    const collectSeeds = () => [
      projectsSeed(),
      reviewSeed(ctx),
      contactsSeed(ctx)
    ];
    ctx.commands.register(INIT_VAULT_COMMAND, () => {
      void initializeVault(ctx, collectSeeds());
    });
    registerCreateProjectCommand(ctx, (title) => pickPerson(ctx, title));
    registerCreateAreaCommand(ctx);
    registerCardInitCommand(ctx);
    registerCardAutoInit(ctx);
    registerTransitionCommands(
      ctx,
      ctx.edition.role === "human" ? createExportHook(ctx) : void 0
    );
    registerUpdatedMaintainer(ctx);
    registerReadBookCommand(ctx, (preset) => createContainer(ctx, BOOK_KIND, preset));
    registerSyncHighlightsCommand(ctx);
    registerConnectWereadCommand(ctx);
    registerCreateBookCommand(ctx, (preset) => createContainer(ctx, BOOK_KIND, preset));
    registerImportHighlightsCommand(ctx);
    registerExcerptCardCommand(ctx);
    registerInspirationCaptureCommand(ctx);
    registerCalendar(ctx, async (periodKey, day) => {
      const file = await openPeriodNote(ctx, PERIODS[periodKey], { day });
      if (file && periodKey === "daily") await promptThemeIfMissing(ctx, file);
    });
    registerPeriodicCommands(ctx, (file) => promptThemeIfMissing(ctx, file));
    registerThemeCommand(ctx);
    registerCreateContactCommand(ctx);
    registerRecordFavorCommand(ctx, () => openPeriodNote(ctx, PERIODS.daily, { reveal: false }));
    registerClientCommands(ctx, (seed) => applySeed(ctx, seed));
    registerFormatter(ctx);
    const syncAppearanceSwitch = registerAppearanceSwitch(ctx);
    registerPasteLink(ctx);
    registerCursorMemory(ctx);
    const syncFolderCount = registerFolderCount(ctx);
    const syncRecentFiles = registerRecentFiles(ctx);
    const syncFilePath = registerFilePath(ctx);
    const syncExplorer = () => {
      syncFolderCount();
      syncRecentFiles();
      syncFilePath();
    };
    registerLegacyDock(ctx);
    const syncRibbon = registerRibbon(ctx);
    registerViewCodeBlock(ctx, [
      ...reviewThemeViews,
      ...reviewProjectViews,
      ...personViews,
      ...circleViews,
      // 客户视图始终注册：视图是只读的，注册它零成本，
      // 而用开关控制注册会让「块能不能渲染」变成需要重启才生效的事
      ...clientViews,
      // 作者名片：开荒写进导航页尾的那个块由它渲染
      ...aboutViews,
      // 第二版的两张清单按角色分发：出库单那张只在「以人为本」画得出，
      // 待提炼那张只在《赛博永生》画得出。免费版两个 role 都不是，两张都不注册，
      // 于是学员的笔记里即便凑巧写了同名代码块，也只会看到「未知视图」而不是一张空表——
      // 空表会让他以为系统坏了，而未知视图如实说明这里没有这个东西
      ...ctx.edition.role === "human" ? humanEternalViews : [],
      ...ctx.edition.role === "eternal" ? eternalRawViews : []
    ]);
    this.addSettingTab(
      new ZiminosSettingTab(ctx, {
        initialize: () => initializeVault(ctx, collectSeeds()),
        // 设置页里那颗「扫码连接」按钮，与命令面板那条「连接微信读书」是同一段登录流程；
        // 设置页不 import books 模块，因此这项能力也走注入
        connectWeread: () => loginWeread(ctx),
        disconnectWeread: () => disconnectWeread(ctx),
        syncAppearanceSwitch,
        syncRibbon,
        syncExplorer,
        // 设置页的「关于作者」区与导航页尾的视图块画同一张名片，实现只有 about 一份
        renderAbout: renderAboutPanel
      })
    );
  }
  /**
   * 读取持久化设置并在唯一入口逐字段验形。
   * 合法旧值原样保留，缺失或类型错误的字段各自回落默认；数组与枚举再走自己的白名单，
   * 因此损坏或手改过的 data.json 不会把错误形态带进模块。首次安装仍得到纯默认值。
   */
  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }
};
