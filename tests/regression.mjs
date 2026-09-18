/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译并载入 src 中的纯 TypeScript 模块
 * [OUTPUT]: 提供 npm test 的审计回归集，覆盖版本镜像、ISBN 校验、日期严格性、
 *           划线身份与批次归并、设置验形、外观配置保护、换行符保真、桌面数据库选择、
 *           项目状态回滚、GitHub / Gitee 双镜像安装入口与作者名片同构、公开源码隐私边界、移动端 Node 边界、
 *           片段出境口的桌面端闸门、本机绝对路径的唯一算处、状态栏路径的看拿分离、
 *           废弃正文/双链在编辑阅读两态的分层示警与三本库外观同构、五级周期的文件名反解、
 *           后台写入的分栏滚动保护（什么时候写、写到哪一篇、写什么值归 writes.mjs）、
 *           光标焦点切换、四类内容容器与日记附件路由，以及
 *           智能体路由完整性、发布脚本的 Shell 变量边界，并在专业版源码存在时额外覆盖
 *           出库单往返、《赛博永生》路径同构与第二版安装入口
 * [POS]: tests 的唯一可执行入口；只验证公开行为与关键平台边界，不复制业务实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTypeScript(relativePath, options = {}) {
    const obsidianStub = options.obsidianStub
        ?? (options.stubObsidian ? "import moment from 'moment'; export { moment };" : null);
    const plugins = obsidianStub
        ? [
              {
                  name: 'obsidian-test-stub',
                  setup(builder) {
                      builder.onResolve({ filter: /^obsidian$/ }, () => ({
                          path: 'obsidian',
                          namespace: 'test-stub',
                      }));
                      builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                          contents: obsidianStub,
                          loader: 'js',
                          resolveDir: ROOT,
                      }));
                  },
              },
          ]
        : [];
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins,
    });
    const source = result.outputFiles[0].text;

    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { isbnUid } = await loadTypeScript('src/modules/books/isbn.ts');
const { formatMarkdown } = await loadTypeScript('src/core/markdownStyle.ts');
const { insertIntoSection, toggleTaskLine } = await loadTypeScript('src/core/markdown.ts');
const { coalesceHighlights, normalizedHighlightKey } = await loadTypeScript(
    'src/modules/books/highlightIdentity.ts',
);
const { dayText, periodOfTitle } = await loadTypeScript('src/core/time.ts', {
    stubObsidian: true,
});

/**
 * 这份源码此刻躺在哪个仓库里。
 *
 * 两个版次仓库的 src/ 逐字节相同（第二版那部分被装配期开关关着），
 * 所以拿代码当判据认不出来；真正区分两者的是**交付物**——只有第二版仓库有那份契约。
 * publish-v1.sh 会把 tests/ 整份同步过去并要求它在那边自己跑得过，
 * 因此每一条读 skill-pro/ 或 vault-pro/ 的断言都必须经这道闸，漏一条就卡死整条发布通道。
 */
const isProRepo = existsSync(path.join(ROOT, 'skill-pro/SKILL.md'));
const { DEFAULT_SETTINGS, normalizeSettings } = await loadTypeScript('src/core/types.ts');
const { attachmentRouteOfNotePath } = await loadTypeScript('src/modules/projects/location.ts', {
    obsidianStub: 'export class TFolder {} export const normalizePath = (value) => String(value);',
});
const { buildInitialInspirationContent, insertInspiration } = await loadTypeScript(
    'src/modules/inspiration/templates.ts',
);
const { setSnippetEnabled } = await loadTypeScript('src/modules/appearance/snippets.ts');
const { withPreservedMarkdownScroll } = await loadTypeScript(
    'src/core/markdownViewState.ts',
    {
        obsidianStub: `
            export class MarkdownView {
                static [Symbol.hasInstance](value) {
                    return value?.isMarkdownView === true;
                }
            }
        `,
    },
);

test('package 版本是唯一事实源，manifest 镜像已同步', () => {
    const packageJson = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const manifest = JSON.parse(
        readFileSync(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/manifest.json'), 'utf8'),
    );

    assert.equal(manifest.version, packageJson.version);
});

/**
 * 入库的 main.js 与「在哪个目录构建」无关。
 *
 * esbuild 把依赖相对工作目录的路径写进来源注释与模块键：在 git worktree 里构建
 * 得到 `../../../node_modules/…`，在主仓库里得到 `node_modules/…`，代码一字不差、
 * 产物差出几百行。publish-v1.sh 的「构建后 main.js 不许再变」于是随构建地点时红时绿，
 * 这条回归曾两次被这样绕过去（30bbfa9 修过一次，4bedbab 又带回来）。
 */
test('入库的 main.js 不带构建目录的相对位置', () => {
    const bundle = readFileSync(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/main.js'), 'utf8');

    assert.doesNotMatch(bundle, /\.\.\/node_modules\//, 'main.js 里出现了 ../node_modules/，它是在别的目录层级下构建出来的');
});

test('第一版安装契约提供 GitHub / Gitee 两个同版镜像', () => {
    const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const skill = readFileSync(path.join(ROOT, 'skill/SKILL.md'), 'utf8');
    const githubSkillUrl = 'https://github.com/zhaozimin/ziminOS/blob/main/skill/SKILL.md';
    const giteeSkillUrl = 'https://gitee.com/ziminzhao/zimin-os-v1/blob/main/skill/SKILL.md';
    const githubCloneUrl = 'https://github.com/zhaozimin/ziminOS.git';
    const giteeCloneUrl = 'https://gitee.com/ziminzhao/zimin-os-v1.git';

    assert.ok(readme.includes(githubSkillUrl) || readme.includes(giteeSkillUrl));
    assert.ok(skill.includes(`git clone --depth 1 "${githubCloneUrl}"`));
    assert.ok(skill.includes(`git clone --depth 1 "${giteeCloneUrl}"`));
});

test('作者名片把 Gitee 主页放在中国大陆分组', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/about/view.ts'), 'utf8');
    const mainlandStart = source.indexOf("label: '中国大陆'");
    const mainlandEnd = source.indexOf('],\n    },', mainlandStart);

    assert.notEqual(mainlandStart, -1);
    assert.notEqual(mainlandEnd, -1);

    const mainland = source.slice(mainlandStart, mainlandEnd);
    const giteeIndex = mainland.indexOf("name: 'Gitee'");
    const bilibiliIndex = mainland.indexOf("name: '哔哩哔哩'");

    assert.notEqual(giteeIndex, -1);
    assert.match(mainland, /url: 'https:\/\/gitee\.com\/ziminzhao'/);
    assert.match(mainland, /path: GITEE_PATH, color: '#C71D23'/);
    assert.ok(giteeIndex < bilibiliIndex);
});

test('公开源码隔离运行时凭据与本机路径', () => {
    const rootIgnore = readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    const vaultIgnore = readFileSync(path.join(ROOT, 'vault/.obsidian/.gitignore'), 'utf8');
    const specifications = [
        readFileSync(path.join(ROOT, 'docs/设计规格书.md'), 'utf8'),
        readFileSync(path.join(ROOT, 'docs/设计规格书-V2.md'), 'utf8'),
    ].join('\n');

    for (const rule of [
        '/vault/.obsidian/workspace*.json',
        '/vault/.obsidian/plugins/ziminos/data.json',
        '/vault/.obsidian/plugins/ziminos/holiday-cache.json',
        '/vault/.obsidian/plugins/ziminos/recent-files.json',
        '/vault/.obsidian/plugins/ziminos/cursor-positions.json',
        '/vault/.obsidian/plugins/dataview/data.json',
    ]) {
        assert.ok(rootIgnore.includes(rule), `源码忽略规则缺失：${rule}`);
    }
    for (const rule of [
        'workspace*.json',
        'plugins/ziminos/data.json',
        'plugins/ziminos/holiday-cache.json',
        'plugins/ziminos/recent-files.json',
        'plugins/ziminos/cursor-positions.json',
        'plugins/dataview/data.json',
    ]) {
        assert.ok(vaultIgnore.includes(rule), `部署库隐私规则缺失：${rule}`);
    }

    assert.doesNotMatch(specifications, /\/(?:Users|Volumes|private\/tmp)\//);
});

test('ISBN-13 只接受正确前缀与校验位', () => {
    assert.equal(isbnUid('978-7-115-56467-2'), 9787115564672);
    assert.equal(isbnUid('9787115564673'), null);
    assert.equal(isbnUid('1234567890128'), null);
});

test('ISBN-10 先验真再无损换成 ISBN-13', () => {
    assert.equal(isbnUid('0-306-40615-2'), 9780306406157);
    assert.equal(isbnUid('0-8044-2957-X'), 9780804429573);
    assert.equal(isbnUid('0-306-40615-3'), null);
});

test('CRLF 笔记整理后仍通篇使用 CRLF', () => {
    const input = '---\r\ntitle: test\r\n---\r\n正文English\r\n';
    const output = formatMarkdown(input, ['cjk-space']);

    assert.match(output, /正文 English/);
    assert.equal(output.replaceAll('\r\n', '').includes('\n'), false);
    assert.equal(output.includes('\r\n'), true);
});

test('传统 CR 笔记整理后不被混成 LF', () => {
    const output = formatMarkdown('中文English\r下一行', ['cjk-space']);

    assert.equal(output, '中文 English\r下一行');
});

test('小节写入与任务翻转都保留 CRLF', () => {
    const inserted = insertIntoSection('## 记录\r\n-\r\n', '## 记录', '- [ ] 跟进');
    const toggled = toggleTaskLine(inserted, 1, false, '- [ ] 跟进');

    assert.equal(inserted.replaceAll('\r\n', '').includes('\n'), false);
    assert.equal(toggled, '## 记录\r\n- [x] 跟进\r\n');
});

test('同批次重复划线合并想法，不被先到的空记录吞掉', () => {
    const highlights = coalesceHighlights([
        { chapter: '', text: '同 一条划线', thoughts: [] },
        { chapter: '第一章', text: '**同一条划线**', thoughts: ['后到的想法'] },
        { chapter: '第二章', text: '同一条划线', thoughts: ['后到的想法'] },
    ]);

    assert.deepEqual(highlights, [
        { chapter: '第一章', text: '同 一条划线', thoughts: ['后到的想法'] },
    ]);
});

test('划线身份只忽略成对强调与空白，不删除正文语义字符', () => {
    assert.equal(normalizedHighlightKey('**== x=1 ==**'), normalizedHighlightKey('x=1'));
    assert.notEqual(normalizedHighlightKey('x=1'), normalizedHighlightKey('x1'));
    assert.notEqual(normalizedHighlightKey('a_b'), normalizedHighlightKey('ab'));
    assert.notEqual(normalizedHighlightKey('约等于~10'), normalizedHighlightKey('约等于10'));

    assert.equal(
        coalesceHighlights([
            { chapter: '', text: 'x=1', thoughts: [] },
            { chapter: '', text: '**x=1**', thoughts: ['同一条的想法'] },
            { chapter: '', text: 'x1', thoughts: [] },
        ]).length,
        2,
    );
});

test('日期前缀只接受真实存在的日期', () => {
    assert.equal(dayText('2028-02-29T12:00:00'), '2028-02-29');
    assert.equal(dayText('2026-02-29'), null);
    assert.equal(dayText('2026-13-01'), null);
    assert.equal(dayText(new Date(Number.NaN)), null);
    assert.equal(dayText(Number.POSITIVE_INFINITY), null);
});

test('五级周期由文件名唯一反解，不是复盘笔记的名字一个都认不出来', () => {
    // 五种标题格式在严格解析下互不相容，因此反解结果与遍历次序无关
    assert.equal(periodOfTitle('2026-09-10')?.key, 'daily');
    assert.equal(periodOfTitle('2026-W37')?.key, 'weekly');
    assert.equal(periodOfTitle('2026-09')?.key, 'monthly');
    assert.equal(periodOfTitle('2026-Q3')?.key, 'quarterly');
    assert.equal(periodOfTitle('2026')?.key, 'yearly');

    // 认错一次，插件就会往一篇不是日记的笔记里写日记骨架
    assert.equal(periodOfTitle('未命名'), null);
    assert.equal(periodOfTitle('Untitled'), null);
    assert.equal(periodOfTitle('2026-13-45'), null);
    assert.equal(periodOfTitle('2026-02-29'), null);
    assert.equal(periodOfTitle('会议纪要 2026-09-10'), null);
    assert.equal(periodOfTitle('2026-09-10 复盘'), null);
    assert.equal(periodOfTitle(''), null);
});

test('全部规则关闭时逐字节原样返回', () => {
    const input = '\ufeff中文English\r\n\r\n';

    assert.equal(formatMarkdown(input, []), input);
});

test('后台写笔记后保住所有已显示分栏的滚动位置', async () => {
    const frames = [];
    const originalWindow = globalThis.window;
    const file = { path: 'A.md' };
    const makeView = (path, scroll, mode = 'source') => ({
        isMarkdownView: true,
        file: { path },
        getMode: () => mode,
        currentMode: {
            getScroll: () => scroll.value,
            applyScroll: (next) => {
                scroll.value = next;
            },
        },
    });
    const sourceScroll = { value: 420 };
    const previewScroll = { value: 860 };
    const otherScroll = { value: 210 };
    const sourceView = makeView(file.path, sourceScroll);
    const previewView = makeView(file.path, previewScroll, 'preview');
    const otherView = makeView('B.md', otherScroll);
    const app = {
        workspace: {
            iterateAllLeaves(callback) {
                for (const view of [sourceView, previewView, otherView]) callback({ view });
            },
        },
    };

    globalThis.window = {
        requestAnimationFrame(callback) {
            frames.push(callback);
            return frames.length;
        },
    };

    try {
        await withPreservedMarkdownScroll(app, file, async () => {
            sourceScroll.value = 0;
            previewScroll.value = 0;
            otherScroll.value = 0;
        });

        assert.equal(sourceScroll.value, 420);
        assert.equal(previewScroll.value, 860);
        assert.equal(otherScroll.value, 0);

        // 下一帧再压一次延后重排；已换走文件的分栏不受旧状态影响。
        sourceScroll.value = 0;
        previewScroll.value = 0;
        previewView.file = { path: 'B.md' };
        frames.shift()(0);

        assert.equal(sourceScroll.value, 420);
        assert.equal(previewScroll.value, 0);
    } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
    }
});

test('光标记忆同时覆盖换文件与分栏间换焦点', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/editing/cursorMemory.ts'), 'utf8');
    const formatter = readFileSync(path.join(ROOT, 'src/modules/format/formatter.ts'), 'utf8');
    const updated = readFileSync(
        path.join(ROOT, 'src/modules/projects/updatedMaintainer.ts'),
        'utf8',
    );

    assert.ok(source.includes("on('file-open', switchTrackedView)"));
    assert.ok(source.includes("on('active-leaf-change', switchTrackedView)"));
    assert.ok(formatter.includes('withPreservedMarkdownScroll(ctx.app, file'));
    assert.ok(updated.includes('withPreservedMarkdownScroll(ctx.app, file'));
});

test('持久化设置在进入运行时前逐字段验形', () => {
    const normalized = normalizeSettings({
        autoUpdated: 'yes',
        clientSources: null,
        wereadCookie: 42,
        inspirationInsertPosition: 'somewhere',
        bookTagCount: 99,
        ribbonCommands: null,
        formatRules: [],
        projectFolder: '',
        filePathScope: 'anywhere',
        eagleExcludeImages: 'yes',
    });

    assert.equal(normalized.autoUpdated, DEFAULT_SETTINGS.autoUpdated);
    assert.equal(normalized.clientSources, DEFAULT_SETTINGS.clientSources);
    assert.equal(normalized.wereadCookie, DEFAULT_SETTINGS.wereadCookie);
    assert.equal(normalized.inspirationInsertPosition, DEFAULT_SETTINGS.inspirationInsertPosition);
    assert.equal(normalized.bookTagCount, DEFAULT_SETTINGS.bookTagCount);
    assert.deepEqual(normalized.ribbonCommands, DEFAULT_SETTINGS.ribbonCommands);
    assert.deepEqual(normalized.formatRules, []);
    assert.equal(normalized.projectFolder, '');
    assert.equal(normalized.filePathScope, DEFAULT_SETTINGS.filePathScope);
    assert.equal(normalized.eagleExcludeImages, DEFAULT_SETTINGS.eagleExcludeImages);
});

/** 新开关默认不能改变老用户已有的“图片也进 Eagle”语义。 */
test('老库升级后仍由 Eagle 接管图片，只有用户明确打开才分流到图床', () => {
    assert.equal(DEFAULT_SETTINGS.eagleExcludeImages, false);
    assert.equal(normalizeSettings({}).eagleExcludeImages, false);
    assert.equal(normalizeSettings({ eagleExcludeImages: true }).eagleExcludeImages, true);
});

test('附件路由把四棵内容根归入项目容器，把全部日记折叠到单一文件夹', () => {
    const settings = {
        ...DEFAULT_SETTINGS,
        projectFolder: '我的项目',
        areaFolder: '我的领域',
        archiveFolder: '我的存档',
        diaryFolder: '我的日记',
    };

    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '我的项目/以人为本/卡片/课程.md'),
        { kind: 'project', name: '以人为本' },
    );
    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '我的领域/内容创作/文章.md'),
        { kind: 'project', name: '内容创作' },
    );
    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '03-resources/AI 工具/材料.md'),
        { kind: 'project', name: 'AI 工具' },
    );
    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '我的存档/旧课程/往期/复盘.md'),
        { kind: 'project', name: '旧课程' },
    );
    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '我的日记/01-daily/2026-09-08.md'),
        { kind: 'diary' },
    );
    assert.deepEqual(
        attachmentRouteOfNotePath(settings, '我的日记/05-yearly/2026.md'),
        { kind: 'diary' },
    );
    assert.equal(attachmentRouteOfNotePath(settings, '我的领域/散落笔记.md'), null);
    assert.equal(attachmentRouteOfNotePath(settings, '00-inbox/临时.md'), null);
});

/**
 * 复制口径的默认值必须是「库内路径」，也就是 v0.20.0 之前唯一的行为。
 *
 * 这一条钉的不是口味而是升级契约：老库的 data.json 里没有这个字段，
 * 于是每一位老用户在升级后都会拿到这里写的默认值。默认一旦改成本机完整路径，
 * 他们某天粘进笔记的双链就会突然带上 /Users/自己的名字——
 * 没有报错、没有提示，只有一条从此断掉的链接和一段泄漏的本机路径。
 */
test('状态栏复制口径默认是库内路径，升级不替用户改他没选过的东西', () => {
    assert.equal(DEFAULT_SETTINGS.filePathScope, 'vault');
});

/**
 * 灵感集的系统页眉是「查询在上、标题在下」，新的一条紧贴标题。
 *
 * v0.19.0 由用户拍板换的向，判据是这篇笔记被打开的姿势：它是收件箱，
 * 打开就为看还没勾掉的那几条，渲染出来的清单该占第一屏。
 * 两个写入方共用这一种版式——插件走这里，口述走 notectl，
 * 分叉的表现不是报错，是同一本库里两篇灵感集长得不一样。
 */
test('灵感集页眉是查询在上、标题在下，新的一条紧贴标题', () => {
    const path = '00-inbox/灵感集.md';
    const first = buildInitialInspirationContent('- [ ] 第一条', '# 灵感集', path);

    assert.match(first, /^```dataview\n/);
    assert.match(first, /```\n\n# 灵感集\n\n- \[ \] 第一条\n$/);

    const second = insertInspiration(first, '- [ ] 第二条', 'heading-top', '# 灵感集', path);

    assert.match(second, /# 灵感集\n\n- \[ \] 第二条\n- \[ \] 第一条\n$/);
});

/**
 * v0.4.0–v0.18.0 的老页眉（标题在上、查询在下）在下一次记录灵感时换位，且**只换一次**。
 *
 * 幂等这一半必须钉住：换位与「认得出换位后的样子」是同一段代码的两面，
 * 认不出的表现不是报错，是每记一条就把页眉重排一遍，用户的笔记天天在变。
 */
test('老页眉换位一次，此后逐字节稳定', () => {
    const path = '00-inbox/灵感集.md';
    const legacyHeader = insertInspiration(
        '# 灵感集\n\n```dataview\ntask\nfrom\n    "00-inbox/灵感集.md"\nwhere\n    !completed\n' +
            'group by\n    "最后更新 · " + dateformat(file.mtime, "yyyy-MM-dd HH:mm")\n```\n\n- [ ] 旧的\n',
        '- [ ] 新的',
        'heading-top',
        '# 灵感集',
        path,
    );

    assert.match(legacyHeader, /^```dataview\n/);
    assert.match(legacyHeader, /# 灵感集\n\n- \[ \] 新的\n- \[ \] 旧的\n$/);

    const again = insertInspiration(legacyHeader, '- [ ] 更新的', 'heading-top', '# 灵感集', path);

    assert.equal(again.replace('- [ ] 更新的\n', ''), legacyHeader);
});

/**
 * 单条格式是全表唯一一个会被**改值**的字段。
 *
 * `- [ ]` 后面那两个空格是默认值自带的笔误，老库的 data.json 里躺着它的副本，
 * 只改 INSPIRATION_DEFAULTS 救不了已经装过的人——他们的灵感会一直多带一个空格。
 * 换值的判据是字节相等：用户改过一个字，它就不再等于任何一条旧默认，于是原样留下。
 */
test('旧默认的单条格式被换成当前默认，用户改过的一个字不动', () => {
    const legacy = normalizeSettings({ inspirationFormat: '- [ ]  {{content}} [[{{date}}]] {{time}}' });
    const mine = normalizeSettings({ inspirationFormat: '{{time}} {{content}}' });

    assert.equal(legacy.inspirationFormat, DEFAULT_SETTINGS.inspirationFormat);
    assert.equal(mine.inspirationFormat, '{{time}} {{content}}');
});

test('损坏的 appearance.json 被拒绝，不覆盖用户外观配置', async () => {
    let writes = 0;
    const app = {
        vault: {
            configDir: '.obsidian',
            adapter: {
                exists: async () => true,
                read: async () => '{ invalid json',
                write: async () => {
                    writes += 1;
                },
            },
        },
    };

    await assert.rejects(setSnippetEnabled(app, '【测试】片段', true), /无法读取外观配置/);
    assert.equal(writes, 0);
});

test('废弃内容与其中双链在编辑阅读两态分层示警，随库外观默认开启', () => {
    const snippetName = '【编辑-删除线】突出废弃内容';
    const snippetDir = path.join(ROOT, 'vault/.obsidian/snippets');
    const source = readFileSync(
        path.join(snippetDir, `${snippetName}.css`),
        'utf8',
    );

    assert.match(source, /\.markdown-rendered :is\(del, s\)/);
    assert.match(source, /\.cm-strikethrough:not\(\.cm-formatting-strikethrough\)/);
    assert.match(source, /background-color:/);
    assert.match(source, /text-decoration-thickness:\s*2px/);
    assert.match(source, /text-decoration-skip-ink:\s*none/);
    assert.match(source, /:is\(del, s\) a\.internal-link/);
    assert.match(source, /\.cm-strikethrough\.cm-hmd-internal-link/);
    assert.match(source, /\.cm-strikethrough \.cm-hmd-internal-link/);
    assert.match(source, /a\.internal-link\.is-unresolved/);
    assert.match(source, /text-decoration-line:\s*line-through underline/);
    assert.match(source, /box-shadow:\s*inset 0 0 0 1px var\(--color-orange\)/);
    assert.match(source, /outline:\s*1px dashed var\(--text-error\)/);

    assert.equal(
        readdirSync(snippetDir).filter((name) => name.endsWith('.css')).length,
        13,
        '共享外观包应当恰好交付十三个 CSS 片段',
    );

    // 第二版那两本库与那份契约只住在第二版仓库里：publish-v1.sh 不搬 vault-pro/
    // 与 skill-pro/，所以它们在第一版仓库里没有对象。判据沿用本文件已经写下的那条——
    // 区分两个仓库的是**交付物**而不是 src/，因为 src/ 两边逐字节相同。
    // 闸是「这是不是第二版仓库」而不是「这个文件在不在」：后者会在 vault-pro 改名时
    // 静默跳过，把一条本该变红的测试变成一条永远绿的测试。
    for (const relativePath of [
        'vault/.obsidian/appearance.json',
        ...(isProRepo
            ? [
                  'vault-pro/兼收并蓄/.obsidian/appearance.json',
                  'vault-pro/赛博永生/.obsidian/appearance.json',
              ]
            : []),
    ]) {
        const appearance = JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf8'));

        assert.ok(
            appearance.enabledCssSnippets.includes(snippetName),
            `${relativePath} 没有默认开启废弃内容样式`,
        );
        assert.equal(appearance.enabledCssSnippets.length, 11);
    }

    for (const relativePath of ['skill/SKILL.md', ...(isProRepo ? ['skill-pro/SKILL.md'] : [])]) {
        const contract = readFileSync(path.join(ROOT, relativePath), 'utf8');

        assert.match(contract, new RegExp(snippetName));
        assert.match(contract, /十三个实名片段/);
    }
});

test('本机书源不在模块顶层静态引入 Node 内建模块', () => {
    for (const relativePath of [
        'src/modules/books/sourceAppleBooks.ts',
        'src/modules/books/sourceKindle.ts',
    ]) {
        const source = readFileSync(path.join(ROOT, relativePath), 'utf8');

        assert.doesNotMatch(source, /from ['"](?:fs|path|child_process|os)['"]/);
        assert.ok(source.indexOf('Platform.isDesktopApp') < source.indexOf("require('"));
    }
});

test('片段出境口不在顶层引入 Node 内建模块，且先挡住非桌面端再探 Electron', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/appearance/reveal.ts'), 'utf8');

    assert.doesNotMatch(source, /from ['"](?:fs|path|child_process|os)['"]/);

    // 只截探测函数那一段来比先后：文件头的 [INPUT] 里也写着 require('electron')，
    // 拿整份源码比会把一句注释当成调用
    const resolver = source.slice(source.indexOf('function resolveShell'));

    assert.ok(resolver.indexOf('Platform.isDesktopApp') < resolver.indexOf("require('electron')"));
});

test('探不到本机文件系统时，两个出门按钮一个都不画', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/appearance/statusBar.ts'), 'utf8');

    // 手机上没有文件管理器可去。画一个点了只会道歉的按钮，比不画更让人以为系统坏了
    assert.match(source, /if \(!canReveal\(this\.ctx\.app\)\) return;/);
    assert.match(source, /if \(revealable\) this\.renderOpenButton\(row, snippet\);/);
});

/**
 * 「库内路径 → 本机绝对路径」全仓库只有一处算得出来。
 *
 * 两个模块要用它：外观的出境口把路径交给操作系统，状态栏把路径交给剪贴板。
 * 各抄一份不会报错——两份代码在今天字节相同，分叉在明天某一次修 Windows 分隔符时发生，
 * 于是同一个库在两个按钮上给出两种路径。这条断言钉的就是那个「明天」。
 */
test('本机绝对路径全仓库只有一处算法', () => {
    const sources = readdirSync(path.join(ROOT, 'src'), { recursive: true })
        .map((entry) => String(entry))
        .filter((entry) => entry.endsWith('.ts'));
    const holders = sources.filter((entry) =>
        // 注释里提一句 FileSystemAdapter 不算「知道怎么算」——只认真正取出库根的那一次调用
        readFileSync(path.join(ROOT, 'src', entry), 'utf8').includes('adapter.getBasePath()'),
    );

    assert.deepEqual(holders, [path.join('core', 'localPath.ts')]);
});

/**
 * 状态栏那一块「看的」与「拿的」刻意不是同一串字，因此三件事必须同时成立。
 *
 * 屏幕上永远是库内路径（那一块只有 32ch 并带省略号，绝对路径进去被吃掉的
 * 恰恰是唯一有信息的笔记名一头）；复制走的是按口径解算出来的那一串；
 * 而拿不到本机路径时降级给库内路径——库不在本机文件系统上是事实不是错误，
 * 让「复制」什么都不做，用户只会以为按钮坏了。
 */
test('状态栏显示库内路径，复制走口径解算的那一串，拿不到本机路径就降级', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/explorer/filePath.ts'), 'utf8');

    assert.match(source, /setText\(this\.vaultPath\(\)/);
    assert.match(source, /clipboard\.writeText\(resolved\.text\)/);
    assert.match(source, /\{ text: relative, degraded: true \}/);
});

test('可用书源漏匹配时逐一交代，不伪装成没有划线', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/books/sources.ts'), 'utf8');
    const unmatchedBranches = source.match(/hits\.push\(unmatchedHit\(/g) ?? [];

    assert.equal(unmatchedBranches.length, 3);
    assert.match(source, /没有匹配到这本书/);
});

test('三条读书异步命令统一收口异常，取数提示失败也会关闭', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/books/readBook.ts'), 'utf8');

    assert.match(source, /runBookCommand\(\(\) => readBook/);
    assert.match(source, /runBookCommand\(\(\) => syncCurrentBook/);
    assert.match(source, /runBookCommand\(async \(\) =>/);
    assert.match(source, /finally\s*{[^}]*pulling\.hide\(\)/s);
});

test('苹果图书从新到旧验目标表，不再读取目录中的任意数据库', () => {
    const source = readFileSync(
        path.join(ROOT, 'src/modules/books/sourceAppleBooks.ts'),
        'utf8',
    );

    assert.match(source, /statSync\(path\)\.mtimeMs/);
    assert.match(source, /sqlite_master/);
    assert.doesNotMatch(source, /return\s+found\.length\s+\?[^;]*found\[0\]/);
});

test('项目流转异常后以源目标路径事实决定回滚', () => {
    const source = readFileSync(
        path.join(ROOT, 'src/modules/projects/transitions.ts'),
        'utf8',
    );

    assert.match(source, /const sourceEntry = .*sourceProjectPath/);
    assert.match(source, /const targetEntry = .*targetProjectPath/);
    assert.match(source, /frontmatterVisited = true/);
    assert.doesNotMatch(source, /basePathChanged|updateMocBaseFolderPath/);
    assert.doesNotMatch(source, /interface TransitionProgress/);
});

/**
 * 每一份存在的施工契约都必须出现在 AGENTS.md 的路由表里。
 *
 * AGENTS.md 是桌面智能体自动读到的第一份指令，优先级高于用户那句话。第二版落库时它被漏改，
 * 于是整整一个版本里它都在说无条件的「安装请求 → skill/SKILL.md」与「不得创建另一层目录」——
 * 后一句恰好把三库布局明令禁止了。拿着第二版指令来的智能体被它劫持成第一版，
 * 只装出一本库，而且**不报错**：用户看到的是一个装好了的笔记库，只是少了两本。
 *
 * 这条把「新增契约必须同步路由」变成硬约束。再加第三份契约时它会先红。
 */
test('每一份施工契约都在 AGENTS.md 的路由表里', () => {
    const agents = readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');

    for (const contract of ['skill/SKILL.md', 'skill-pro/SKILL.md']) {
        if (!existsSync(path.join(ROOT, contract))) continue;

        assert.ok(agents.includes(contract), `AGENTS.md 的路由表里没有 ${contract}`);
    }
});

/**
 * 专业版测试的闸门是**交付物**而不是源码。
 *
 * 从 v0.19.0 起 `src/` 整份同步到第一版的公开仓库（第二版那部分被装配期开关关着、
 * 一行都不执行），因此 `src/modules/eternal/` 在两个仓库里都存在，拿它当闸门会让
 * 下面这几条在第一版仓库里跑起来，然后找不到 `skill-pro/`、`vault-pro/` 而红。
 * 真正区分两个仓库的是交付物：只有第二版仓库才有那份契约。
 */
const proContractPath = path.join(ROOT, 'skill-pro/SKILL.md');

if (existsSync(proContractPath)) {
    const { manifestLine, parseManifestLine } = await loadTypeScript('src/modules/eternal/manifest.ts');

    const {
        ETERNAL_FOLDERS,
        ETERNAL_INDEX_FILE,
        ETERNAL_LOG_FILE,
        ETERNAL_LOG_INGEST_MARKS,
        INSPIRATION_DEFAULTS,
        LEGACY_INSPIRATION_FORMATS,
    } = await loadTypeScript('src/core/constants.ts');

    const PRO_REPOS = [
        'https://github.com/zhaozimin/ziminOS-Pro.git',
        'https://gitee.com/ziminzhao/ziminos-pro.git',
    ];
    const V1_REPOS = [
        'https://github.com/zhaozimin/ziminOS.git',
        'https://gitee.com/ziminzhao/zimin-os-v1.git',
    ];

    /**
     * 两个版次各有 GitHub / Gitee 两个同步镜像：第一版 ziminOS / zimin-os-v1，
     * 第二版 ziminOS-Pro / ziminos-pro。
     *
     * 分开不是洁癖：第一版的安装契约会把施工源整份克隆到用户机器的临时目录，
     * 指向 pro 仓库等于让每一个免费用户顺手把付费版的全部交付物拉到本地。
     * 反过来第二版指向 v1 仓库更糟——那里没有 vault-pro/ 与 skill-pro/，
     * clone 照样成功，缺目录要等到交付物清单才发作，报的是「仓库不完整」这种像网络抖动的话。
     */
    test('第二版的入口指向第二版仓库，第一版的入口不指向它', () => {
        const proContract = readFileSync(path.join(ROOT, 'skill-pro/SKILL.md'), 'utf8');
        const v1Contract = readFileSync(path.join(ROOT, 'skill/SKILL.md'), 'utf8');
        const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');

        for (const repo of PRO_REPOS) assert.ok(proContract.includes(`git clone --depth 1 "${repo}"`));
        for (const repo of V1_REPOS) assert.equal(proContract.includes(`git clone --depth 1 "${repo}"`), false, '第二版契约不该克隆第一版仓库');

        // 第一版契约整份克隆施工源，指向 pro 仓库就等于把付费交付物发给每一个免费用户
        for (const repo of V1_REPOS) assert.ok(v1Contract.includes(`git clone --depth 1 "${repo}"`));
        for (const repo of PRO_REPOS) assert.equal(v1Contract.includes(`git clone --depth 1 "${repo}"`), false, '第一版契约不该克隆第二版仓库');

        // GitHub 首页默认给 GitHub 快捷指令，同时保留 Gitee 国内镜像
        assert.ok(readme.includes('https://github.com/zhaozimin/ziminOS/blob/main/skill/SKILL.md'));
        assert.ok(readme.includes('https://github.com/zhaozimin/ziminOS-Pro/blob/main/skill-pro/SKILL.md'));
        assert.ok(readme.includes('https://gitee.com/ziminzhao/zimin-os-v1/blob/main/skill/SKILL.md'));
        assert.ok(readme.includes('https://gitee.com/ziminzhao/ziminos-pro/blob/main/skill-pro/SKILL.md'));
    });

    /**
     * 首页那两段升级口令，必须点得到各自契约里真实存在的小节。
     *
     * 它们是给用户复制粘贴的，里面写死了小节标题。契约那边改一次标题，口令就开始
     * 指向一个不存在的小节——而智能体不会因此报错，它会自己找一个看起来差不多的地方
     * 接着干，于是「百分之百走升级」这句承诺悄悄退回成「它自己判断」，
     * 也就是这两段口令存在的理由被抵消掉的那一刻。
     */
    test('首页的升级口令指向两份契约里真实存在的小节', () => {
        const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
        const cited = {
            'skill/SKILL.md': ['## 三、原地搭建当前工作区', '### 升级', '## 五、清理临时施工源'],
            'skill-pro/SKILL.md': ['## 三、C 三库系统的日常升级', '## 四、验证'],
        };

        for (const [contractPath, headings] of Object.entries(cited)) {
            const contract = readFileSync(path.join(ROOT, contractPath), 'utf8');

            for (const heading of headings) {
                const title = heading.replace(/^#+ /, '');

                assert.ok(readme.includes(title), `README 的升级口令没有点名「${title}」`);
                assert.ok(contract.includes(heading), `${contractPath} 里没有「${title}」这一节`);
            }

            // 取施工源那一步两份契约同名，且是最容易被跳过的一步：跳过了升级就静默地什么都不做
            assert.ok(contract.includes('## 二、在工作区外取得施工源'));
        }

        // 自证真的干了活，这一条是口令区别于「把安装那段再发一次」的全部价值
        assert.ok(readme.includes('升级前后的插件版本号'));
        assert.ok(readme.includes('升级前后的 ziminOS 版本号'));
    });

    /**
     * 首页那段手机口令，必须指得到安装契约真正铺下的那两个文件。
     *
     * 它与升级口令是同一类东西的两半：那一段钉小节标题，这一段钉**路径**。
     * 手机接进来的窗口读不到系统根的认路文件（工作目录常常不在那儿），
     * 于是这段口令是唯一入口，而它把 `.ziminos/skills/` 下的契约与脚本位置写死了。
     * 安装契约哪天换个地方铺，口令就指向一个不存在的文件——智能体不会因此停下，
     * 它会自己找一份看着差不多的说明接着干，或者干脆手写笔记，
     * 而「不许手写笔记」正是这段口令存在的全部理由。
     *
     * 顺带钉住取路径那几步点名的控件：设置项改个名字，首页第一步就落空，
     * 而用户在设置页里翻不到「复制哪一种路径」时，只会以为自己的版本不对。
     */
    test('首页的手机口令指向契约真实铺下的那两个文件', () => {
        const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
        const proContract = readFileSync(proContractPath, 'utf8');
        const notectl = readFileSync(path.join(ROOT, 'skill-pro/scripts/notectl.py'), 'utf8');
        const settingsModel = readFileSync(path.join(ROOT, 'src/settingsModel.ts'), 'utf8');
        const commands = readFileSync(path.join(ROOT, 'src/core/commands.ts'), 'utf8');

        // 只认手机那一节：同样两个路径在「换个窗口」那段里也出现，整篇搜等于没搜
        const start = readme.indexOf('## 从手机记一句话');
        assert.notEqual(start, -1, 'README 少了手机那一节');
        const section = readme.slice(start, readme.indexOf('\n## ', start + 1));

        for (const installed of ['.ziminos/skills/capture/SKILL.md', '.ziminos/skills/scripts/notectl.py']) {
            assert.ok(section.includes(installed), `手机口令没点名「${installed}」`);
            assert.ok(proContract.includes(installed), `skill-pro/SKILL.md 没铺下「${installed}」`);
        }

        // 口令要它先跑一次 status 自证真的连上了库，那必须是个真的子命令
        assert.ok(section.includes('跑一次 status'));
        assert.match(notectl, /add_parser\("status"/);

        // 取路径那几步点名的设置项、选项与命令，得是界面上真有的那几个
        for (const label of ['复制哪一种路径', '本机完整路径']) {
            assert.ok(section.includes(label), `取路径那几步没点名「${label}」`);
            assert.ok(settingsModel.includes(label), `设置页里没有「${label}」`);
        }

        assert.ok(section.includes('复制当前笔记路径'));
        assert.ok(commands.includes("name: '复制当前笔记路径'"));
    });

    /**
     * 发布通道的三张清单必须覆盖仓库根的每一个条目。
     *
     * publish-v1.sh 把共享部分单向推到第一版的公开仓库，靠 SHARED / PRO_ONLY / PER_REPO
     * 三张手写清单分流。新增一个第二版专属的顶层目录却忘了写进 PRO_ONLY，
     * 后果是把付费交付物推进公开仓库——而 git、rsync、脚本自己的防泄漏断言
     * **都不会报错**，因为那个断言只认清单里已经写着的名字。
     * 因此判据反过来：不是「清单里的东西都在」，而是「根目录里的东西都被分类过」。
     */
    test('publish-v1.sh 的三张清单覆盖仓库根的每一个条目', () => {
        const script = readFileSync(path.join(ROOT, 'publish-v1.sh'), 'utf8');
        const classified = new Set();

        for (const listName of ['SHARED', 'PRO_ONLY', 'PER_REPO']) {
            const matched = new RegExp(`^${listName}=\\(([\\s\\S]*?)^\\)`, 'm').exec(script);

            assert.ok(matched, `publish-v1.sh 缺少 ${listName} 清单`);

            for (const line of matched[1].split('\n')) {
                const name = line.trim();

                if (name && !name.startsWith('#')) classified.add(name);
            }
        }

        // 开发环境的产物与工具目录不进任何一个仓库，不需要分类
        const ignored = new Set(['.git', 'node_modules', '.claude', '.DS_Store', '.impeccable', '.publish-staging']);
        // 两个打包脚本默认把 zip、.sha256 与发行说明留在仓库根（.gitignore 挡着不进库）。
        // 不跳过它们，打过一次包之后下一次 npm run check 就红——而打包脚本自己第一步就跑 check
        const releaseArtifact = /^ziminOS-.+\.(zip|zip\.sha256|release\.md)$/;

        for (const entry of readdirSync(ROOT)) {
            if (ignored.has(entry) || releaseArtifact.test(entry)) continue;

            assert.ok(classified.has(entry), `仓库根的 ${entry} 没有出现在 publish-v1.sh 的任何一张清单里`);
        }
    });

    /**
     * Bash 在部分多字节 locale 下会把变量后的中文标点误吞进变量名。
     * `set -u` 最终报的是 `version�: unbound variable`，而且发生在两边回归全绿之后；
     * 变量与非 ASCII 字符相邻时必须用 `${name}` 明确划界。
     */
    test('publish-v1.sh 的 Shell 变量与中文相邻时显式划界', () => {
        const script = readFileSync(path.join(ROOT, 'publish-v1.sh'), 'utf8');

        assert.doesNotMatch(script, /\$[A-Za-z_][A-Za-z0-9_]*[^\x00-\x7F]/u);
    });

    test('publish-v1.sh 把同一提交非强制推到 GitHub 与 Gitee', () => {
        const script = readFileSync(path.join(ROOT, 'publish-v1.sh'), 'utf8');

        assert.ok(script.includes('V1_GITHUB_REMOTE="git@github.com:zhaozimin/ziminOS.git"'));
        assert.ok(script.includes('V1_GITEE_REMOTE="git@gitee.com:ziminzhao/zimin-os-v1.git"'));
        assert.match(script, /git push --dry-run "\$V1_GITHUB_REMOTE" HEAD:main/);
        assert.match(script, /git push --dry-run "\$V1_GITEE_REMOTE" HEAD:main/);
        assert.doesNotMatch(script, /git push[^\n]*(?:--force|-f\b)/);
    });

    /**
     * 插件认的路径与模板、安装契约里实际写着的路径必须是同一批字符串。
     *
     * 常量改了而模板没改（或反过来）不会有任何东西报错，表现只是「待提炼」永远显示空——
     * 它去一个不存在的目录里找原料。三处各自都说得通，合起来是错的。
     */
    test('《赛博永生》的目录名在常量、模板与安装契约三处一致', () => {
        const eternalRoot = path.join(ROOT, 'vault-pro/赛博永生');

        assert.ok(existsSync(path.join(eternalRoot, ETERNAL_INDEX_FILE)), ETERNAL_INDEX_FILE);
        assert.ok(existsSync(path.join(eternalRoot, ETERNAL_LOG_FILE)), ETERNAL_LOG_FILE);

        // 原料层是空目录，空目录不进 git，因此它的事实源是安装契约里那行 mkdir
        const contract = readFileSync(path.join(ROOT, 'skill-pro/SKILL.md'), 'utf8');

        assert.ok(contract.includes(`mkdir -p "$eternal/${ETERNAL_FOLDERS.raw}"`), ETERNAL_FOLDERS.raw);
    });

    /**
     * 三种安装模式都必须真实存在，且每一种都得给得出可执行的命令。
     *
     * 这条钉的是一次真实事故：模式判定写着「进入二、C 三库升级模式」，而文档里
     * 根本没有「二、C」——真实标题是「三、C」；那一节又通篇是散文，一行 cp 都没有。
     * 于是智能体照着升级，什么都没拷，而**没有任何东西报错**：用户重启 Obsidian
     * 才发现插件还是旧的，却找不到哪一步失败了。
     *
     * 两头都验：判定里引用的小节标题必须真的存在；每种模式的正文里必须有命令。
     * 只验前者，散文照样能骗过去；只验后者，指错门的判定照样能把人送到空处。
     */
    test('三种安装模式的入口都指得对，且都给得出可执行命令', () => {
        const contract = readFileSync(path.join(ROOT, 'skill-pro/SKILL.md'), 'utf8');
        const headings = contract.split('\n').filter((line) => line.startsWith('## '));

        for (const mode of ['A', 'B', 'C']) {
            const heading = headings.find((line) => line.startsWith(`## 三、${mode}`));

            assert.ok(heading, `缺少「三、${mode}」这一节`);
            assert.ok(
                contract.includes(`进入「${heading.slice(3)}`) || mode === 'A',
                `模式判定没有指向真实存在的「${heading.slice(3)}」`,
            );

            // 该节正文里必须有 bash 代码块，且块里有真的在动文件的命令
            const start = contract.indexOf(heading);
            const rest = contract.slice(start + heading.length);
            const end = rest.indexOf('\n## ');
            const body = end < 0 ? rest : rest.slice(0, end);

            assert.match(body, /```bash/, `「三、${mode}」没有任何 bash 代码块`);
            assert.match(
                body,
                /^(cp|mkdir|rm|rsync|for) /m,
                `「三、${mode}」没有一行真的在动文件的命令——它只是在用散文描述该发生什么`,
            );
        }

        // 升级模式必须自证程序真的前进了；只检查「没被改坏」的验收，
        // 会让一次什么都没干的升级顺利通过
        assert.match(contract, /先确认程序真的前进了/);
    });

    /**
     * 系统根必须有一份自己的认路文件，而且安装契约必须真的铺它。
     *
     * 这条钉的是「新会话冷启动」那个问题：契约躺在 .ziminos/skills/ 里没有用——
     * 没有任何东西告诉一个刚打开这个文件夹的智能体去读它，而智能体会自动读的
     * 恰恰是 CLAUDE.md 与 AGENTS.md。模板在仓库里却没被安装契约拷过去，
     * 表现不是报错，是用户每开一个窗口都要重新解释一遍这套系统是什么。
     *
     * 两头都要验：模板存在、契约里有那两行 cp。少哪一头都等于没有。
     */
    test('系统根的认路文件既有模板，也真的被安装契约铺开', () => {
        const contract = readFileSync(path.join(ROOT, 'skill-pro/SKILL.md'), 'utf8');

        for (const name of ['CLAUDE.md', 'AGENTS.md']) {
            const template = path.join(ROOT, 'skill-pro/system-root', name);

            assert.ok(existsSync(template), `缺模板 skill-pro/system-root/${name}`);
            assert.ok(
                contract.includes(`"$src/skill-pro/system-root/${name}" "$system_root/${name}"`),
                `安装契约没有把 system-root/${name} 铺到系统根`,
            );
        }

        // 认路文件不许写死三本库的目录名当事实源——升级上来的用户那本工作台是他自己取的名字
        const boot = readFileSync(path.join(ROOT, 'skill-pro/system-root/CLAUDE.md'), 'utf8');

        assert.ok(boot.includes('edition.json'), '认路文件必须指向 edition.json 这个布局事实源');
    });

    /** AGENTS.md 必须说得出三本库的名字，否则「工作区不是笔记库」这件事讲不清楚 */
    test('AGENTS.md 说得出三库的布局', () => {
        const agents = readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');

        for (const vault of ['兼收并蓄', '以人为本', '赛博永生']) {
            assert.ok(agents.includes(vault), `AGENTS.md 没有提到《${vault}》`);
        }
    });

    /**
     * 汉化之前写下的账本行用的是英文 `ingest`。少认这一个标记不会报错，
     * 只会让那几份原料整体退回「待提炼」，接着被重复消化一遍、知识层跟着重一遍。
     */
    test('账本仍认得汉化之前写下的 ingest 行', () => {
        assert.ok(ETERNAL_LOG_INGEST_MARKS.includes('消化'));
        assert.ok(ETERNAL_LOG_INGEST_MARKS.includes('ingest'));
    });

    /**
     * 灵感行的形态两侧同源。
     *
     * 同一条灵感有两个写入方：《以人为本》里的「记录灵感」命令与口述走的 notectl。
     * 两处各存一份格式串，分叉时不报错——只是同一种记录长出两种复选框，
     * 一种 `- [ ] `、一种 `- [ ]  `。肉眼几乎分不出，Markdown 却把多出来的那个空格
     * 算进内容，于是同一串灵感在缩进、折叠与勾选回写上表现不一。
     * v0.19.0 之前两边都是两个空格，正因为它们当时是一致的，谁都没发现那是个笔误。
     */
    test('灵感行的格式两侧同源', () => {
        const script = readFileSync(path.join(ROOT, 'skill-pro/scripts/notectl.py'), 'utf8');
        const matched = /^INSPIRATION_FORMAT = "([^"]*)"/m.exec(script);

        assert.ok(matched, 'notectl.py 里找不到 INSPIRATION_FORMAT');
        assert.equal(
            matched[1].replace(/\{(content|date|time)\}/g, '{{$1}}'),
            INSPIRATION_DEFAULTS.format,
        );

        // 老默认值必须留在场上：只改默认值救不了 data.json 里躺着旧副本的老库
        assert.ok(LEGACY_INSPIRATION_FORMATS.includes('- [ ]  {{content}} [[{{date}}]] {{time}}'));
        assert.equal(LEGACY_INSPIRATION_FORMATS.includes(INSPIRATION_DEFAULTS.format), false);
    });

    test('出库单项目名与路径含可见分隔符时仍能无损往返', () => {
        const entry = {
            done: false,
            stamp: '2026-08-18 09:30',
            kindLabel: '项目',
            name: '西风 · 庄园',
            folderPath: '70-archive/西风 · 庄园',
            uid: '20260818093000',
        };

        assert.deepEqual(parseManifestLine(manifestLine(entry)), entry);
        assert.equal(parseManifestLine('- [ ] 一条没有 UID 的手写备注'), null);
    });
}

test('日历把「今天」与「写过了」画成两个事实，而不是三选一', () => {
    const view = readFileSync(path.join(ROOT, 'src/modules/calendar/view.ts'), 'utf8');
    const main = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const css = readFileSync(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/styles.css'), 'utf8');

    // 日历不认识 review：它只想知道「这一格要不要涂绿」，
    // 目录规则与文件名格式归 review，由 main 填洞——与 opener 同一条路数
    assert.match(view, /export type CalendarNoteProbe/);
    assert.doesNotMatch(view, /periodFolderOf|titleOfDay/);
    assert.match(main, /periodFolderOf\(ctx, period\)/);

    // 日格与周格都要涂：他要的是「日记或者周记」
    assert.match(view, /button\.toggleClass\('has-note', this\.hasNote\('daily', day\.date\)\)/);
    assert.match(view, /weekButton\.toggleClass\('has-note', this\.hasNote\('weekly', week\.anchor\)\)/);

    // 两个类而不是一个三态：今天也可能已经写完，那恰恰是最该一眼看见的一格
    assert.match(css, /\.ziminos-calendar-day\.has-note/);
    assert.match(css, /\.ziminos-calendar-day\.is-today \{[^}]*--color-red/);
    assert.match(css, /\.ziminos-calendar-day\.is-today\.has-note::after/);

    // is-today 必须排在 has-note 之后：同特异性下后来者胜
    assert.ok(
        css.indexOf('.ziminos-calendar-day.has-note') < css.indexOf('.ziminos-calendar-day.is-today {'),
        'is-today 要排在 has-note 之后，否则今天会被写过那层底压住',
    );
});

test('日历只在真有事发生时重画：无定时器、无轮询', () => {
    const view = readFileSync(path.join(ROOT, 'src/modules/calendar/view.ts'), 'utf8');

    // 三个 vault 事件各注册一次——它们的回调签名不同，合成一个联合类型谁都对不上
    for (const name of ['create', 'delete', 'rename']) {
        assert.ok(view.includes(`this.app.vault.on('${name}', onChange)`), `少了 ${name} 的监听`);
    }

    // 只认 Markdown：附件与文件夹的增删与「这天写没写复盘」无关
    assert.match(view, /file instanceof TFile && file\.extension === 'md'/);

    // 点一格之后也要重画：更常见的结果是「那篇已经在了，只是打开它」，
    // 那时没有任何 vault 事件，而用户仍然期待看见自己刚点过的那一格是绿的
    assert.match(view, /await this\.openPeriod\(period, anchorDay\);\s*\n\s*this\.renderCalendar\(\);/);

    // 防抖而不是定时器
    assert.match(view, /scheduleRepaint/);
    assert.doesNotMatch(view, /setInterval/);
});

/**
 * Obsidian 运行时的 View / ItemView / Component 身上真有、但子类不该拿去当自己名字的成员。
 *
 * 名单分两半，危险程度不同：
 *   · open / close / load / unload —— `obsidian.d.ts`（1.13.1，8482 行）里**一个字都没有**，
 *     在真机控制台沿原型链枚举才看得见（View.prototype 有 open、close，
 *     Component.prototype 有 load、unload）。撞上它们编译器一声不吭，运行期宿主调进你的方法，
 *     参数全是 undefined——v0.30.0 的日历就是这么整个开不出来的：
 *     右侧栏一片空白，报错只出现在没人会打开的开发者控制台里。
 *   · app / leaf / containerEl / contentEl / scope / icon / navigation / addAction /
 *     register* / addChild / removeChild —— 这些声明文件里有，但同名字段会把宿主那份遮掉，
 *     同样不报错。
 *
 * 刻意不收 onOpen / onClose / onload / onunload / getViewType / getDisplayText / getIcon /
 * getState / setState / getEphemeralState / setEphemeralState / onResize / onPaneMenu：
 * 那些是宿主明写着留给子类去覆盖的钩子，覆盖它们正是用法。
 */
const HOST_VIEW_MEMBERS = new Set([
    'open', 'close', 'load', 'unload',
    'app', 'leaf', 'containerEl', 'contentEl', 'scope', 'icon', 'navigation', 'addAction',
    'register', 'registerEvent', 'registerDomEvent', 'registerInterval',
    'addChild', 'removeChild',
]);

test('ItemView 子类不占用宿主自己的成员名', () => {
    const files = ['src/modules/calendar/view.ts', 'src/modules/explorer/recentFiles.ts'];
    let classesChecked = 0;

    for (const relative of files) {
        const source = readFileSync(path.join(ROOT, relative), 'utf8');
        const start = source.search(/^class \w+ extends ItemView \{$/m);

        assert.ok(start >= 0, `${relative} 里找不到 ItemView 子类`);
        classesChecked += 1;

        // 类体：从类头到第一个顶格的 }，也就是这个类自己结束的地方
        const body = source.slice(start).split(/^\}$/m)[0];
        const members = [...body.matchAll(
            /^ {4}(?:private |protected |public )?(?:static )?(?:readonly |async )*([A-Za-z_$][\w$]*)\s*[(:=]/gm,
        )].map((match) => match[1]);

        assert.ok(members.length > 5, `${relative} 的成员没解析出来，正则该修了`);

        for (const name of members) {
            assert.ok(
                !HOST_VIEW_MEMBERS.has(name),
                `${relative} 的 ${name} 与 Obsidian 自己的成员同名：`
                + '编译期不会报错，运行期宿主会调进你这一份（或读到你这一份），视图直接开不出来。换个名字。',
            );
        }
    }

    assert.equal(classesChecked, files.length);
});
