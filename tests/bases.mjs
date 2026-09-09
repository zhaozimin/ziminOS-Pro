/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 projects/templates 事实源
 * [OUTPUT]: 验证导航 Emoji 状态、MOC 三视图、系统目录递归排除、手动模板同源与流转零 Base 改写
 * [POS]: tests 的 Obsidian Bases 专项契约；高层钉用户可见的 YAML，不复制生成器实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTemplates() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/projects/templates.ts')],
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

const { mocBaseBlock, mocContent, mocTemplateFile, navContent } = await loadTemplates();

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

test('导航用 Emoji 翻译状态，并排除整棵系统目录树', () => {
    const navigation = navContent();

    assert.match(navigation, /- '!file\.inFolder\("90-system"\)'/);
    assert.match(navigation, /status_icon: if\(status == "active", "🟢 进行中"/);
    assert.match(navigation, /status == "paused", "🟡 搁置"/);
    assert.match(navigation, /status == "done", "✅ 完成"/);
    assert.match(navigation, /status == "dropped", "⚫️ 弃"/);
    assert.equal((navigation.match(/formula\.status_icon/g) ?? []).length, 4);

    const areaView = navigation.slice(navigation.indexOf('    name: 领域'), navigation.indexOf('    name: 书籍'));
    assert.doesNotMatch(areaView, /formula\.status_icon/);
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
