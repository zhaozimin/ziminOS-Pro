/**
 * [INPUT]: 依赖 node:test/assert、esbuild、fs 与 projects/nameConflict/createContainer 事实源
 * [OUTPUT]: 提供四 PARA 根目录同名检索、原弹窗连续改名与新建流程接线回归
 * [POS]: tests 的容器命名专项；行为断言直接编译检索与纠错事实源，结构断言确保提醒
 *        发生在询问归属和概述之前、改名不中断命令，且最终容器目录不复用旧对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const obsidianStub = `
    class FakeElement {
        constructor(tag = 'div', options = {}) {
            this.tag = tag;
            this.style = {};
            this.children = [];
            this.listeners = {};
            this.text = options.text ?? '';
            this.value = options.value ?? '';
            this.placeholder = options.placeholder ?? '';
            this.id = '';
        }
        createEl(tag, options = {}) {
            const child = new FakeElement(tag, options);
            this.children.push(child);
            return child;
        }
        createDiv() { return this.createEl('div'); }
        empty() { this.children = []; this.text = ''; }
        setText(text) { this.text = String(text); }
        addEventListener(type, listener) { this.listeners[type] = listener; }
        focus() { this.focused = true; }
        select() { this.selected = true; }
    }
    export class Modal {
        constructor(app) {
            this.app = app;
            this.modalEl = new FakeElement('modal');
            this.titleEl = new FakeElement('title');
            this.contentEl = new FakeElement('content');
            app.__lastModal = this;
        }
        open() { this.onOpen?.(); }
        close() { this.onClose?.(); }
    }
    export class ButtonComponent {
        constructor(container) { this.buttonEl = container.createEl('button'); }
        setButtonText(text) { this.buttonEl.setText(text); return this; }
        setCta() { this.buttonEl.cta = true; return this; }
        onClick(listener) { this.buttonEl.onclick = listener; return this; }
    }
    export class TFolder { static [Symbol.hasInstance](value) { return value?.kind === 'folder'; } }
    export const normalizePath = value => value.replace(/\\\\/g, '/').replace(/^\\/+|\\/+$/g, '');
`;

async function loadNameConflicts() {
    const result = await build({
        entryPoints: [`${ROOT}src/modules/projects/nameConflict.ts`],
        bundle: true,
        format: 'esm',
        platform: 'node',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
                        contents: obsidianStub,
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    return import(
        `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
    );
}

const { findContainerNameConflicts, requestAvailableContainerName } = await loadNameConflicts();

function fixture(existingPaths, overrides = {}) {
    const files = new Set(existingPaths);

    return {
        app: {
            vault: {
                getAbstractFileByPath: (path) => (files.has(path) ? { path } : null),
            },
        },
        settings: {
            projectFolder: '01-projects',
            areaFolder: '02-areas',
            archiveFolder: '04-archives',
            ...overrides,
        },
    };
}

test('新建容器会检出项目、领域、资源与存档第一层的所有同名位置', () => {
    const { app, settings } = fixture([
        '01-projects/知识管理',
        '02-areas/知识管理',
        '03-resources/知识管理',
        '04-archives/知识管理',
    ]);

    assert.deepEqual(findContainerNameConflicts(app, settings, '知识管理'), [
        { roles: ['项目'], path: '01-projects/知识管理' },
        { roles: ['领域'], path: '02-areas/知识管理' },
        { roles: ['资源'], path: '03-resources/知识管理' },
        { roles: ['存档'], path: '04-archives/知识管理' },
    ]);
});

test('同名检索尊重自定义根目录，同一路径只报一次并合并角色', () => {
    const { app, settings } = fixture(['我的工作/知识管理'], {
        projectFolder: '我的工作',
        areaFolder: '我的工作',
    });

    assert.deepEqual(findContainerNameConflicts(app, settings, '知识管理'), [
        { roles: ['项目', '领域'], path: '我的工作/知识管理' },
    ]);
});

test('普通子目录与文件名不伪装成 PARA 容器冲突', () => {
    const { app, settings } = fixture([
        '01-projects/写书/知识管理',
        '02-areas/MOC-知识管理.md',
    ]);

    assert.deepEqual(findContainerNameConflicts(app, settings, '知识管理'), []);
});

function findElement(root, predicate) {
    if (predicate(root)) return root;

    for (const child of root.children ?? []) {
        const found = findElement(child, predicate);
        if (found) return found;
    }

    return null;
}

function elementText(root) {
    return [root.text, ...(root.children ?? []).map(elementText)].join(' ');
}

test('重名弹窗列出位置，并允许在原命令中连续改名直到名称可用', async () => {
    const { app, settings } = fixture([
        '01-projects/知识管理',
        '02-areas/第二大脑',
    ]);
    const result = requestAvailableContainerName(app, settings, '项目', '知识管理');
    const modal = app.__lastModal;
    const input = findElement(modal.contentEl, (element) => element.tag === 'input');
    const continueButton = findElement(
        modal.contentEl,
        (element) => element.tag === 'button' && element.text === '使用新名称继续',
    );

    assert.match(elementText(modal.contentEl), /01-projects\/知识管理/);
    assert.equal(input.value, '知识管理');

    input.value = '第二大脑';
    continueButton.onclick();

    assert.match(elementText(modal.contentEl), /02-areas\/第二大脑/);
    assert.match(elementText(modal.contentEl), /这个名称仍然重复/);

    input.value = '个人知识系统';
    continueButton.onclick();

    assert.equal(await result, '个人知识系统');
});

test('新建流程在询问归属前报冲突，提交前复核且不复用旧容器', () => {
    const source = readFileSync(`${ROOT}src/modules/projects/createContainer.ts`, 'utf8');
    const firstProbe = source.indexOf('const availableName = await resolveContainerName');
    const ownershipPrompt = source.indexOf('if (kind.asksOwnership && !preset)');

    assert.ok(firstProbe >= 0 && firstProbe < ownershipPrompt);
    assert.match(source, /const finalName = await resolveContainerName/);
    // 两处复核仍然经同一个入口，而那个入口在有人在场时走的还是同流程更名
    assert.match(source, /requestAvailableContainerName\(app, settings, kindLabel, requestedName\)/);
    assert.doesNotMatch(source, /confirmContainerNameConflict\(/);
    assert.match(source, /await app\.vault\.createFolder\(containerFolderPath\)/);
    assert.doesNotMatch(source, /ensureFolderPath\(app, containerFolderPath\)/);
    assert.match(source, /currentContainer === createdContainerFolder/);
    assert.match(source, /createdContainerFolder\.children\.length === 0/);
    assert.match(source, /await app\.vault\.delete\(createdContainerFolder, true\)/);
});

/*
 * 没有人在场时，这条流程的每一次「说话」都必须改成「抛出」。
 * 漏掉任何一处，批量导入就会在第几十本上弹出一个没有人看的弹窗并把整批卡在那儿——
 * 而它不报错，界面只是停住。
 */
test('没有人在场时撞名不改名、不弹窗、不打开文件，失败一律抛出', () => {
    const source = readFileSync(`${ROOT}src/modules/projects/createContainer.ts`, 'utf8');

    // 只截 resolveContainerName 这一个函数体来看：静默那条路必须落到纯检索上，
    // 而且它只有两种结局——原样交出这个名字，或者抛。**绝不自动改名**：
    // 留一本《人类简史 2》比少导一本更难收拾，而学员根本不会知道那是谁改的
    const head = source.indexOf('async function resolveContainerName');
    const resolver = source.slice(head, source.indexOf('\n}', head));

    assert.ok(head > 0);
    assert.match(resolver, /if \(!quiet\) \{\s*return await requestAvailableContainerName/);
    assert.match(resolver, /findContainerNameConflicts\(app, settings, requestedName\)/);
    assert.match(resolver, /throw new Error\(`已存在同名目录/);
    assert.deepEqual(resolver.match(/return [^;]+;/g), [
        'return await requestAvailableContainerName(app, settings, kindLabel, requestedName);',
        'return requestedName;',
    ]);

    // 四条失败路径都要抛，而不是弹一条没有人看得见的 Notice 然后把整批卡在那儿
    for (const pattern of [
        /if \(quiet\) throw new Error\(`未提供\$\{kind\.label\}名称`\)/,
        /if \(quiet\) throw new Error\(`名称含斜杠或反斜杠/,
        /if \(quiet\) throw new Error\(`MOC 已存在，未覆盖/,
        /if \(quiet\) throw error;/,
    ]) {
        assert.match(source, pattern);
    }

    // 落盘之后就返回：打开文件、聚焦编辑器、报一句「建好了」都是说给在场的人听的
    const quietReturn = source.indexOf('if (quiet) return mocFile;');

    assert.ok(quietReturn > 0);
    assert.ok(quietReturn < source.indexOf('leaf.openFile(mocFile'));
    assert.ok(quietReturn < source.indexOf('editor.focus()'));
    assert.ok(quietReturn < source.lastIndexOf('已创建：'));
});
