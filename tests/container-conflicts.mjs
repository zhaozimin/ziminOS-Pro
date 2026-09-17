/**
 * [INPUT]: 依赖 node:test/assert、esbuild、fs 与 projects/nameConflict/createContainer 事实源
 * [OUTPUT]: 提供四 PARA 根目录同名检索、自定义目录去重与新建流程接线回归
 * [POS]: tests 的容器命名专项；行为断言直接编译检索事实源，结构断言确保提醒
 *        发生在询问归属和概述之前，且最终容器目录不复用旧对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const obsidianStub = `
    export class Modal { constructor(app) { this.app = app; } open() {} close() {} }
    export class ButtonComponent {}
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

const { findContainerNameConflicts } = await loadNameConflicts();

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

test('新建流程在询问归属前报冲突，提交前复核且不复用旧容器', () => {
    const source = readFileSync(`${ROOT}src/modules/projects/createContainer.ts`, 'utf8');
    const firstProbe = source.indexOf('const initialConflicts = findContainerNameConflicts');
    const ownershipPrompt = source.indexOf('if (kind.asksOwnership && !preset)');

    assert.ok(firstProbe >= 0 && firstProbe < ownershipPrompt);
    assert.match(source, /confirmContainerNameConflict\(/);
    assert.match(source, /const liveConflicts = findContainerNameConflicts/);
    assert.match(source, /await app\.vault\.createFolder\(containerFolderPath\)/);
    assert.doesNotMatch(source, /ensureFolderPath\(app, containerFolderPath\)/);
    assert.match(source, /currentContainer === createdContainerFolder/);
    assert.match(source, /createdContainerFolder\.children\.length === 0/);
    assert.match(source, /await app\.vault\.delete\(createdContainerFolder, true\)/);
});
