/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 projects/templates/baseMigration 事实源
 * [OUTPUT]: 验证导航 Emoji 状态、书籍 aliases 封面卡片、MOC 三视图、系统目录递归排除、
 *           手动模板同源、两条建书路径与初始化种子、流转零 Base 改写，以及存量 Base 的
 *           旧版识别、CRLF 保真、冲突拒写与批次失败回滚
 * [POS]: tests 的 Obsidian Bases 专项契约；高层钉用户可见的 YAML 与迁移事务，不复制生成器实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadModule(relativePath) {
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    const source = result.outputFiles[0].text;
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { mocBaseBlock, mocContent, mocTemplateFile, navContent } = await loadModule(
    'src/modules/projects/templates.ts',
);
const { projectsSeed } = await loadModule('src/modules/projects/seed.ts');
const {
    applyMigrationBatch,
    isContainerMocIdentity,
    MigrationBatchError,
    planMocBaseUpgrade,
    planNavigationBaseUpgrade,
} = await loadModule('src/modules/projects/baseMigration.ts');

const MOC_BASE = `\`\`\`base
filters:
  and:
    - file.path != this.file.path
    - '!file.inFolder("90-system")'
properties:
  note.description:
    displayName: 概述
  note.rating:
    displayName: 评分
views:
  - type: table
    name: 项目文件
    filters:
      or:
        - up.contains(this.file.asLink())
        - file.folder == this.file.folder
    order:
      - file.name
      - description
      - rating
    sort:
      - property: rating
        direction: DESC
    columnSize:
      file.name: 170
      note.description: 421
  - type: table
    name: 附件
    filters:
      and:
        - file.inFolder(this.file.folder)
        - file.ext != "md"
    order:
      - file.name
      - file.ext
      - file.mtime
    sort:
      - property: file.mtime
        direction: DESC
  - type: table
    name: 全部
    filters:
      or:
        - up.contains(this.file.asLink())
        - file.inFolder(this.file.folder)
    order:
      - file.name
      - file.ext
      - description
      - file.mtime
    sort:
      - property: file.mtime
        direction: DESC

\`\`\``;

test('MOC 用一份相对上下文查询展示笔记、附件与全部内容', () => {
    assert.equal(mocBaseBlock(), MOC_BASE);
    assert.doesNotMatch(MOC_BASE, /01-projects|04-archives|link\("MOC-/);
});

test('自动建容器与手动 MOC 模板共用同一个 Base 事实源', () => {
    const generated = mocContent({
        description: '测试项目',
        created: '2026-09-08 12:00',
        uid: 20260908120000,
        type: 'project',
        status: 'active',
    });

    assert.ok(generated.endsWith(`${MOC_BASE}\n`));
    assert.ok(mocTemplateFile().endsWith(`${MOC_BASE}\n`));
    assert.equal((mocTemplateFile().match(/\`\`\`base/g) ?? []).length, 1);
});

test('导航用 Emoji 翻译状态，书籍以 aliases 封面卡片展示', () => {
    const navigation = navContent();

    assert.match(navigation, /- '!file\.inFolder\("90-system"\)'/);
    assert.match(navigation, /status_icon: if\(status == "active", "🟢 进行中"/);
    assert.match(navigation, /status == "paused", "🟡 搁置"/);
    assert.match(navigation, /status == "done", "✅ 完成"/);
    assert.match(navigation, /status == "dropped", "⚫️ 弃"/);
    assert.equal((navigation.match(/formula\.status_icon/g) ?? []).length, 5);
    assert.match(
        navigation,
        /book_title: file\.asLink\(if\(aliases\.isEmpty\(\), file\.name, list\(aliases\)\[0\]\)\)/,
    );
    assert.match(navigation, /formula\.book_title:\n    displayName: 书名/);

    const bookView = navigation.slice(navigation.indexOf('  - type: cards\n    name: 书籍'));

    assert.match(bookView, /^    name: 书籍/m);
    assert.match(bookView, /  - type: cards/);
    assert.match(bookView, /      - formula\.book_title/);
    assert.doesNotMatch(bookView, /      - file\.name/);
    assert.match(bookView, /    image: note\.cover/);
    assert.match(bookView, /    imageAspectRatio: 1\.35/);
    assert.match(bookView, /    imageFit: contain/);
    assert.match(bookView, /    cardSize: 200/);

    const projectView = navigation.slice(
        navigation.indexOf('    name: 项目'),
        navigation.indexOf('    name: 领域'),
    );

    assert.match(projectView, /    sort:\n      - property: formula\.status_icon\n        direction: DESC/);

    const areaView = navigation.slice(navigation.indexOf('    name: 领域'), navigation.indexOf('    name: 书籍'));
    assert.doesNotMatch(areaView, /formula\.status_icon/);
});

test('两条建书路径都写入真实书名，初始化导航与运行时同源', () => {
    const manual = readFileSync(path.join(ROOT, 'src/modules/books/createBook.ts'), 'utf8');
    const automatic = readFileSync(path.join(ROOT, 'src/modules/books/readBook.ts'), 'utf8');
    const seededNavigation = projectsSeed().notes.find((note) => note.path.endsWith('/导航.md'));
    const bookMoc = mocContent({
        description: '测试书籍',
        created: '2026-09-15 12:00',
        uid: 9787115564672,
        type: 'book',
        status: 'active',
        aliases: ['卡片笔记写作法'],
    });

    assert.match(manual, /const trueName = unwrapBookTitle\(nameInput\.trim\(\)\)/);
    assert.match(manual, /if \(!trueName\)/);
    assert.match(manual, /create\(\{ name, aliases: \[trueName\], description/);
    assert.match(automatic, /const trueTitle = fullTitle \|\| detail\.title/);
    assert.match(automatic, /aliases: \[trueTitle\]/);
    assert.match(bookMoc, /aliases:\n  - "卡片笔记写作法"/);
    assert.equal(seededNavigation?.content, navContent());
});

test('项目流转只移动容器与更新状态，不改写 MOC Base 代码', () => {
    const source = readFileSync(
        path.join(ROOT, 'src/modules/projects/transitions.ts'),
        'utf8',
    );

    assert.match(source, /renameFile\(plan\.projectFolder, plan\.targetProjectPath\)/);
    assert.match(source, /processFrontMatter\(movedMoc/);
    assert.doesNotMatch(source, /updateMocBaseFolderPath|basePathChanged/);
    assert.doesNotMatch(source, /file\.folder == \$\{JSON\.stringify/);
    assert.doesNotMatch(source, /没有找到需要更新的 file\.folder/);
});

test('存量硬编码 MOC Base 只在逐字吻合旧模板时升级', () => {
    const legacy = `\`\`\`base
filters:
  and:
    - file.path != this.file.path
properties:
  note.description:
    displayName: 概述
  note.rating:
    displayName: 评分
views:
  - type: table
    name: 项目文件
    filters:
      or:
        - up == link("MOC-写本书")
        - file.folder == "01-projects/写本书"
    order:
      - file.name
      - description
      - rating
    sort:
      - property: rating
        direction: DESC
    columnSize:
      file.name: 170
      note.description: 421

\`\`\``;
    const result = planMocBaseUpgrade(`---\ntype: project\n---\n\n正文\n\n${legacy}\n`);

    assert.equal(result.status, 'change');
    assert.equal(result.action, '替换旧 Base');
    assert.ok(result.content.includes(MOC_BASE));
    assert.doesNotMatch(result.content, /01-projects\/写本书|up == link/);

    const custom = planMocBaseUpgrade(legacy.replace('direction: DESC', 'direction: ASC'));
    assert.deepEqual(custom, { status: 'conflict', reason: 'Base 含有自定义内容，不会自动覆盖' });
});

test('单视图相对 Base 可升级，无 Base 的 CRLF MOC 只追加代码块并保留行尾', () => {
    const oneView = MOC_BASE.replace(/\n  - type: table\n    name: 附件[\s\S]*\n\n\`\`\`$/, '\n\n```');
    const replaceResult = planMocBaseUpgrade(oneView);

    assert.equal(replaceResult.status, 'change');
    assert.equal(replaceResult.action, '替换旧 Base');
    assert.equal(replaceResult.content, MOC_BASE);

    const appendResult = planMocBaseUpgrade('---\r\ntype: area\r\n---\r\n\r\n正文\r\n');

    assert.equal(appendResult.status, 'change');
    assert.equal(appendResult.action, '补上缺失 Base');
    assert.match(appendResult.content, /\r\n```base\r\n/);
    assert.doesNotMatch(appendResult.content, /(?<!\r)\n/);
});

test('导航只认旧系统模板，当前版本幂等，自定义与多 Base 进入冲突', () => {
    const legacyNavBase = `\`\`\`base
properties:
  note.description:
    displayName: 概述
  note.status:
    displayName: 状态
views:
  - type: table
    name: 正在进行中
    filters:
      and:
        - status == "active"
    order:
      - file.name
      - description
      - status
  - type: table
    name: 项目
    filters:
      and:
        - type == "project"
    order:
      - file.name
      - description
      - status
  - type: table
    name: 领域
    filters:
      and:
        - type == "area"
    order:
      - file.name
      - description
      - status
  - type: table
    name: 书籍
    filters:
      and:
        - type == "book"
    order:
      - file.name
      - description
      - status

\`\`\``;
    const migrated = planNavigationBaseUpgrade(`自定义导语\n\n${legacyNavBase}\n`);
    const fileNameTableNavigation = navContent()
        .replace('  book_title: file.asLink(if(aliases.isEmpty(), file.name, list(aliases)[0]))\n', '')
        .replace('  formula.book_title:\n    displayName: 书名\n', '')
        .replace('  - type: cards\n    name: 书籍', '  - type: table\n    name: 书籍')
        .replace('      - formula.book_title\n', '      - file.name\n')
        .replace('    sort:\n      - property: formula.status_icon\n        direction: DESC\n', '')
        .replace('    image: note.cover\n    imageAspectRatio: 1.35\n    imageFit: contain\n    cardSize: 200\n', '');
    const userCardNavigation = `\`\`\`base
filters:
  and:
    - file.folder != "90-system"
formulas:
  status_icon: if(status == "active", "🟢 进行中", if(status == "paused", "🟡 搁置", if(status == "done", "✅ 完成", if(status == "dropped", "⚫️ 弃", if(status.isEmpty(), "", "⚠️ " + status)))))
properties:
  note.description:
    displayName: 概述
  note.status:
    displayName: 状态
  formula.status_icon:
    displayName: 状态
views:
  - type: table
    name: 正在进行中
    filters:
      and:
        - status == "active"
    order:
      - file.name
      - description
      - formula.status_icon
  - type: table
    name: 项目
    filters:
      and:
        - type == "project"
    order:
      - file.name
      - description
      - formula.status_icon
    sort:
      - property: formula.status_icon
        direction: DESC
  - type: table
    name: 领域
    filters:
      and:
        - type == "area"
    order:
      - file.name
      - description
  - type: cards
    name: 书籍
    filters:
      and:
        - type == "book"
    order:
      - file.name
      - description
      - formula.status_icon
    image: note.cover
    imageAspectRatio: 1.35
    imageFit: contain
    cardSize: 200

\`\`\``;
    const tableMigration = planNavigationBaseUpgrade(fileNameTableNavigation);
    const cardMigration = planNavigationBaseUpgrade(userCardNavigation);

    assert.equal(migrated.status, 'change');
    assert.equal(migrated.action, '升级导航 Base');
    assert.ok(migrated.content.startsWith('自定义导语\n\n'));
    assert.ok(migrated.content.includes('formula.status_icon'));
    assert.equal(tableMigration.status, 'change');
    assert.equal(cardMigration.status, 'change');
    assert.ok(cardMigration.content.includes('formula.book_title'));
    assert.ok(cardMigration.content.includes('  - type: cards\n    name: 书籍'));
    assert.ok(cardMigration.content.includes('    imageAspectRatio: 1.35'));
    assert.deepEqual(planNavigationBaseUpgrade(navContent()), { status: 'unchanged' });

    const custom = planNavigationBaseUpgrade(legacyNavBase.replace('      - status', '      - file.mtime'));
    assert.equal(custom.status, 'conflict');
    assert.equal(planMocBaseUpgrade(`${MOC_BASE}\n\n${MOC_BASE}`).status, 'conflict');
});

test('批次第二项失败时逆序恢复已触达文件，并保留完整回滚失败清单', async () => {
    const items = [
        { path: 'A.md', before: '旧 A', after: '新 A' },
        { path: 'B.md', before: '旧 B', after: '新 B' },
    ];
    const state = new Map(items.map((item) => [item.path, item.before]));

    await assert.rejects(
        applyMigrationBatch(
            items,
            async (item) => {
                state.set(item.path, item.after);

                // 模拟底层已经写入磁盘、Promise 随后才拒绝的歧义失败；当前项也必须进回滚栈。
                if (item.path === 'B.md') throw new Error('模拟写入失败');
            },
            async (item) => {
                const current = state.get(item.path);

                if (current === item.before) return;
                if (current !== item.after) throw new Error('内容冲突');

                state.set(item.path, item.before);
            },
            (item) => item.path,
        ),
        (error) => {
            assert.ok(error instanceof MigrationBatchError);
            assert.match(error.message, /本轮已修改文件已全部回滚/);
            assert.deepEqual(error.rollbackFailures, []);

            return true;
        },
    );

    assert.deepEqual([...state.entries()], [['A.md', '旧 A'], ['B.md', '旧 B']]);
});

test('迁移命令只由主装配显式注册，状态流转不会偷偷调用它', () => {
    const commands = readFileSync(path.join(ROOT, 'src/core/commands.ts'), 'utf8');
    const main = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const migration = readFileSync(path.join(ROOT, 'src/modules/projects/migrateBases.ts'), 'utf8');
    const transitions = readFileSync(path.join(ROOT, 'src/modules/projects/transitions.ts'), 'utf8');

    assert.match(commands, /id: 'migrate-moc-bases'/);
    assert.match(commands, /name: '升级存量 MOC 数据库'/);
    assert.match(main, /registerBaseMigrationCommand\(ctx\)/);
    assert.match(migration, /--- 当前/);
    assert.match(migration, /\+\+\+ 升级后/);
    assert.match(migration, /current !== change\.before/);
    assert.match(migration, /applyMigrationBatch\(/);
    assert.doesNotMatch(transitions, /migrateBases|BaseMigration|planMocBaseUpgrade/);
});

test('批次回滚不会因第一项恢复失败而吞掉其余失败清单', async () => {
    const items = [{ path: 'A.md' }, { path: 'B.md' }];

    await assert.rejects(
        applyMigrationBatch(
            items,
            async (item) => {
                if (item.path === 'B.md') throw new Error('停止写入');
            },
            async (item) => {
                throw new Error(`无法恢复 ${item.path}`);
            },
            (item) => item.path,
        ),
        (error) => {
            assert.ok(error instanceof MigrationBatchError);
            assert.deepEqual(error.rollbackFailures, [
                'B.md（无法恢复 B.md）',
                'A.md（无法恢复 A.md）',
            ]);

            return true;
        },
    );
});

test('存量扫描只认项目领域书籍容器，不把人脉 MOC 当成缺 Base 的项目 MOC', () => {
    assert.equal(isContainerMocIdentity('MOC-写本书', '写本书', 'project'), true);
    assert.equal(isContainerMocIdentity('老项目', '老项目', 'project'), true);
    assert.equal(isContainerMocIdentity('MOC-原则', '原则', 'area'), true);
    assert.equal(isContainerMocIdentity('MOC-穷查理宝典', '穷查理宝典', 'book'), true);
    assert.equal(isContainerMocIdentity('MOC-人脉', '人脉', 'area'), false);
    assert.equal(isContainerMocIdentity('MOC-客户', '客户', 'area'), false);
    assert.equal(isContainerMocIdentity('人脉MOC', '人脉', 'area'), false);
    assert.equal(isContainerMocIdentity('客户MOC', '客户', 'area'), false);
    assert.equal(isContainerMocIdentity('MOC-普通卡片', '普通卡片', 'note'), false);
});
