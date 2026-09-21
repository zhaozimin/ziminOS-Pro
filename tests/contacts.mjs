/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 contacts/templates 事实源，
 *          并读取 main、clientViews、VaultIndex 与客户命令的装配代码；
 *          建档问答另把 createContact/client 两条命令真源连同 core/modals 编进一台替身宿主
 * [OUTPUT]: 验证两张内建 MOC 的新名初始化与旧名兼容寻址、客户名录排序，
 *           客户答疑的模板、旧档案补齐与“QA 标签 + 属性双链”两道检索闸门，
 *           以及两条建档命令的问答次序：问完名字即查重、一句话简介必问且必填（空白留在原窗）、
 *           取消不建档、用户原话以合法 YAML 字符串落盘；
 *           以及「客户答疑」真画出来的那张表只有「答疑 / 概述」两栏
 * [POS]: tests 的客户模块专项契约；把「新库长出什么」「插件更新后链接指向谁」、
 *        「旧档案怎么升级」「答疑为什么归到这个客户」与「建一份档案要答哪几问」钉在同一条用户路径上。
 *        建档那几条由剧本扮演用户：回车走弹窗自己的键盘监听、选择走与真机同序的「先关窗再回调」，
 *        因此钉住的是用户按下去会发生什么，而不是某个内部函数被调用了几次
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
        entryPoints: [path.join(ROOT, 'src/modules/contacts/templates.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-test-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: "import moment from 'moment'; export { moment }; export const normalizePath = (value) => value;",
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    const source = result.outputFiles[0].text;
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

async function loadVaultIndex() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/core/vaultIndex.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-vault-index-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: 'export class TFile {}; export class TFolder {}; export const normalizePath = (value) => value;',
                        loader: 'js',
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const {
    clientMocContent,
    clientNoteContent,
    clientTemplateFile,
    contactMocContent,
    ensureClientViews,
    personTemplateFile,
} = await loadTemplates();

async function loadConstants() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/core/constants.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { CLIENT_MOC, CONTACT_MOC } = await loadConstants();

async function loadMocPaths() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/contacts/moc.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-moc-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: 'export const normalizePath = (value) => value;',
                        loader: 'js',
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { basenameOf, resolveBuiltInMocPath } = await loadMocPaths();

test('两张内建 MOC 初始化时统一使用 MOC 前缀', () => {
    const contactSeedSource = readFileSync(path.join(ROOT, 'src/modules/contacts/seed.ts'), 'utf8');
    const clientSeedSource = readFileSync(path.join(ROOT, 'src/modules/contacts/client.ts'), 'utf8');
    const contactContent = contactMocContent('2026-09-11 10:00:00', 20260911100000);
    const legacyFiles = new Set(['02-areas/人脉/人脉MOC.md']);
    const appWithLegacy = {
        vault: { getAbstractFileByPath: (candidate) => legacyFiles.has(candidate) ? {} : null },
    };
    const appWithoutMoc = { vault: { getAbstractFileByPath: () => null } };
    const appWithBoth = { vault: { getAbstractFileByPath: () => ({}) } };

    assert.equal(CONTACT_MOC, '02-areas/人脉/MOC-人脉.md');
    assert.equal(CLIENT_MOC, '02-areas/客户/MOC-客户.md');
    assert.equal(basenameOf(CONTACT_MOC), 'MOC-人脉');
    assert.equal(basenameOf(CLIENT_MOC), 'MOC-客户');
    assert.match(contactSeedSource, /resolveBuiltInMocPath\(/);
    assert.match(clientSeedSource, /resolveBuiltInMocPath\(/);
    assert.match(contactContent, /\[\[MOC-客户\]\]/);
    assert.equal(
        resolveBuiltInMocPath(appWithoutMoc, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        CONTACT_MOC,
    );
    assert.equal(
        resolveBuiltInMocPath(appWithLegacy, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        '02-areas/人脉/人脉MOC.md',
    );
    assert.equal(
        resolveBuiltInMocPath(appWithBoth, '02-areas/人脉', CONTACT_MOC, '02-areas/人脉/人脉MOC.md'),
        CONTACT_MOC,
    );
});

test('客户 MOC 随默认开荒生成，并只用一张四列名录回答核心问题', () => {
    const content = clientMocContent('2026-09-10 12:00', 20260910120000);
    const mainSource = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const viewSource = readFileSync(
        path.join(ROOT, 'src/modules/contacts/clientViews.ts'),
        'utf8',
    );
    const collectStart = mainSource.indexOf('const collectSeeds');
    const collectEnd = mainSource.indexOf('];', collectStart);
    const collectSeeds = mainSource.slice(collectStart, collectEnd);

    assert.notEqual(collectStart, -1);
    assert.notEqual(collectEnd, -1);
    assert.match(collectSeeds, /clientSeed\(ctx\)/);
    assert.match(content, /```ziminos\n客户名录\n```/);
    assert.equal([...content.matchAll(/```ziminos/g)].length, 1);
    assert.match(viewSource, /name: '客户名录'/);
    assert.match(viewSource, /\['人物', '金额', '交付', '创建日期'\]/);
    assert.match(viewSource, /Number\(right\.pendingCount > 0\)/);
});

test('新客户自带答疑视图，旧档案只补一次且保留原换行', () => {
    const fresh = clientNoteContent({
        created: '2026-09-11 10:00:00',
        uid: 20260911100000,
        type: 'client',
        description: '小红书私信来问 Obsidian',
        source: '小红书',
        contact: 'alex',
    });
    const legacy = '---\r\ntype: client\r\n---\r\n\r\n## 关键事件（自动）\r\n';
    const upgraded = ensureClientViews(legacy);

    assert.equal([...fresh.matchAll(/```ziminos\n客户答疑\n```/g)].length, 1);
    assert.match(upgraded, /## 客户答疑（自动）\r\n\r\n```ziminos\r\n客户答疑\r\n```/);
    assert.equal(ensureClientViews(upgraded), upgraded);
    assert.ok(!upgraded.replaceAll('\r\n', '').includes('\n'));
});

test('客户答疑同时要求 QA 标签与 frontmatter 双链，并提供显式旧档案补齐命令', () => {
    const viewSource = readFileSync(path.join(ROOT, 'src/modules/contacts/clientViews.ts'), 'utf8');
    const indexSource = readFileSync(path.join(ROOT, 'src/core/vaultIndex.ts'), 'utf8');
    const commandSource = readFileSync(path.join(ROOT, 'src/core/commands.ts'), 'utf8');
    const clientSource = readFileSync(path.join(ROOT, 'src/modules/contacts/client.ts'), 'utf8');

    assert.match(viewSource, /name: '客户答疑'/);
    assert.match(viewSource, /CLIENT_ANSWER_TAG = 'obsidian\/qa'/);
    assert.match(viewSource, /frontmatterLinksTo\(file, client\)/);
    assert.match(indexSource, /frontmatterLinks/);
    assert.match(commandSource, /id: 'backfill-client-answer-views'/);
    assert.match(commandSource, /name: '补齐客户档案检索'/);
    assert.match(clientSource, /ensureClientViews\(current\)/);
});

test('客户归属只认 frontmatterLinks 中真实解析到档案的链接', async () => {
    const { VaultIndex } = await loadVaultIndex();
    const client = { path: '02-areas/客户/Alex.md' };
    const linkedAnswer = { path: '02-areas/obsidian/答疑-Alex.md' };
    const bodyOnlyAnswer = { path: '02-areas/obsidian/正文提到-Alex.md' };
    const caches = new Map([
        [linkedAnswer.path, { frontmatterLinks: [{ link: 'Alex' }, { link: 'MOC-obsidian' }] }],
        [bodyOnlyAnswer.path, { frontmatterLinks: [{ link: 'MOC-obsidian' }] }],
    ]);
    const app = {
        metadataCache: {
            getFileCache: (file) => caches.get(file.path),
            getFirstLinkpathDest: (link) => (
                link === 'Alex' ? client : { path: '02-areas/obsidian/MOC-obsidian.md' }
            ),
        },
    };
    const index = new VaultIndex(app);

    assert.equal(index.frontmatterLinksTo(linkedAnswer, client), true);
    assert.equal(index.frontmatterLinksTo(bodyOnlyAnswer, client), false);
});

// ============================================================
// 建档问答：像真人一样点完两条建档命令
// ============================================================

/**
 * 人脉与客户两条建档命令的真源，连同它们用到的弹窗，一起编进一个替身宿主。
 * 弹窗每次打开都向 app.__drive 报到，由测试脚本扮演用户作答——
 * 回答走的是弹窗自己的回车监听与选中回调，与真机同一条路，不直接调内部函数。
 */
async function loadCreationCommands() {
    const stub = `
        import moment from 'moment';
        export { moment };
        export const notices = [];
        export class Notice { constructor(message) { notices.push(String(message)); } }
        export class TFile { static [Symbol.hasInstance](value) { return value?.kind === 'file'; } }
        export class TFolder { static [Symbol.hasInstance](value) { return value?.kind === 'folder'; } }
        export const normalizePath = (value) => value.replace(/^\\/+|\\/+$/g, '');
        class FakeElement {
            constructor(tag = 'div', options = {}) {
                this.tag = tag;
                this.style = {};
                this.children = [];
                this.listeners = {};
                this.text = options.text ?? '';
                this.value = options.value ?? '';
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
            focus() {}
            select() {}
        }
        export class Modal {
            constructor(app) {
                this.app = app;
                this.titleEl = new FakeElement('title');
                this.contentEl = new FakeElement('content');
                this.closed = false;
            }
            open() { this.onOpen?.(); this.app.__drive(this); }
            close() {
                if (this.closed) return;
                this.closed = true;
                this.onClose?.();
            }
        }
        export class FuzzySuggestModal {
            constructor(app) { this.app = app; }
            setPlaceholder(text) { this.placeholder = text; }
            open() { this.app.__drive(this); }
            close() { this.onClose(); }
            onClose() {}
        }
        export class ButtonComponent {
            constructor(container) { this.buttonEl = container.createEl('button'); }
            setButtonText(text) { this.buttonEl.setText(text); return this; }
            setCta() { return this; }
            onClick(listener) { this.buttonEl.onclick = listener; return this; }
        }
    `;
    const result = await build({
        stdin: {
            contents: [
                "export { registerCreateContactCommand } from './src/modules/contacts/createContact.ts';",
                "export { registerClientCommands } from './src/modules/contacts/client.ts';",
                "export { notices } from 'obsidian';",
            ].join('\n'),
            resolveDir: ROOT,
            loader: 'ts',
        },
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-intake-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: stub,
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { registerCreateContactCommand, registerClientCommands, notices } = await loadCreationCommands();

// ChoiceModal 推迟一拍结算用的是 window.setTimeout；Node 里没有 window，借全局对象顶上
globalThis.window ??= globalThis;

/** 找出弹窗里第一个某种标签的元素 */
function findEl(root, tag) {
    if (root.tag === tag) return root;

    for (const child of root.children) {
        const found = findEl(child, tag);

        if (found) return found;
    }

    return null;
}

/**
 * 一台只够两条建档命令用的 Obsidian 替身，外加一个照剧本作答的用户。
 * 剧本每一步对应一个弹窗：{ choose: '前缀' } 点选一项；{ type: ['第一次', '第二次'] } 依次敲字回车；
 * { cancel: true } 按 Esc。asked 按先后记下每个弹窗问了什么，attempts 记下每次回车之后弹窗关没关、提示说了什么。
 */
function intakeFixture(existingPaths = []) {
    const files = new Map(existingPaths.map((path) => [path, { kind: 'file', path }]));
    const created = [];
    const opened = [];
    const asked = [];
    const attempts = [];
    const script = [];
    const commands = new Map();

    notices.length = 0;

    const app = {
        vault: {
            getAbstractFileByPath: (path) => files.get(path) ?? null,
            createFolder: async (path) => {
                files.set(path, { kind: 'folder', path });
            },
            create: async (path, content) => {
                if (files.has(path)) throw new Error('File already exists.');

                const file = { kind: 'file', path };

                files.set(path, file);
                created.push({ path, content });

                return file;
            },
        },
        workspace: {
            getLeaf: () => ({
                openFile: async (file) => {
                    opened.push(file.path);
                },
            }),
        },
        __drive(modal) {
            const step = script.shift();

            if (!step) throw new Error('剧本之外多弹了一个窗');

            setTimeout(() => {
                if (typeof modal.getItems === 'function') {
                    asked.push(modal.placeholder);

                    if (step.cancel) return modal.close();

                    const item = modal.getItems().find((candidate) =>
                        modal.getItemText(candidate).startsWith(step.choose));

                    // 与真机同序：SuggestModal 先关窗、再回调选中
                    modal.close();
                    modal.onChooseItem(item);

                    return;
                }

                asked.push(modal.titleEl.text);

                if (step.cancel) return modal.close();

                const input = findEl(modal.contentEl, 'input');
                const error = modal.contentEl.children.find((child) => child.style.color === 'var(--text-error)');

                for (const text of step.type) {
                    input.value = text;
                    input.listeners.input?.();
                    input.listeners.keydown({ key: 'Enter', isComposing: false, preventDefault() {} });
                    attempts.push({
                        text,
                        closed: modal.closed,
                        error: error && error.style.display !== 'none' ? error.text : '',
                    });
                }
            }, 0);
        },
    };

    const ctx = {
        app,
        settings: {
            contactFolder: '02-areas/人脉',
            clientFolder: '02-areas/客户',
            dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
            clientSources: 'B站,小红书,朋友介绍',
            clientProducts: '课程',
        },
        guard: { mark() {} },
        commands: {
            register: (spec, run) => commands.set(spec.id, run),
        },
    };

    registerCreateContactCommand(ctx);
    registerClientCommands(ctx, async () => {});

    return {
        created,
        opened,
        asked,
        attempts,
        /** 照剧本跑一条命令，直到它打开了一份档案或说了一句话为止 */
        async run(commandId, steps) {
            script.push(...steps);
            commands.get(commandId)();

            for (let tick = 0; tick < 200; tick += 1) {
                await new Promise((resolve) => setTimeout(resolve, 0));

                if (opened.length || notices.length) {
                    assert.equal(script.length, 0, '剧本没走完命令就结束了');

                    return;
                }
            }

            throw new Error('命令没有结束');
        },
    };
}

/** 从 frontmatter 里取一个字段的值：双引号写法按 JSON 还原，与 YAML 双引号字符串同一套转义 */
function frontmatterValue(content, key) {
    const line = content.split('\n').find((candidate) => candidate.startsWith(`${key}:`));
    const raw = line.slice(key.length + 1).trim();

    return raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const BRIEF_TITLE = '用一句话介绍这个人';

test('新建人脉最后必问一句简介，空白提交留在原窗补，填好才建档', async () => {
    const fx = intakeFixture();
    const brief = '2024 年读书会上认识: 做独立出版，常一起聊选题';

    await fx.run('create-contact', [
        { type: ['张三'] },
        { choose: '近' },
        { choose: '平行' },
        { type: ['   ', brief] },
    ]);

    assert.deepEqual(fx.asked.slice(1), ['多久该跟他说句话？', '这段关系往哪个方向使劲？', BRIEF_TITLE]);
    // 第一次交了一串空格：窗不关、当场说明；第二次交了正文才放行
    assert.deepEqual(fx.attempts.slice(1), [
        { text: '   ', closed: false, error: '这一句必须填，填好才能建档。' },
        { text: brief, closed: true, error: '' },
    ]);
    assert.equal(fx.created.length, 1);
    assert.equal(fx.created[0].path, '02-areas/人脉/张三.md');
    // 带半角冒号的原话照样是一个合法的 YAML 字符串，读回来一字不差
    assert.equal(frontmatterValue(fx.created[0].content, 'description'), brief);
    assert.equal(frontmatterValue(fx.created[0].content, 'tier'), '近');
    assert.deepEqual(fx.opened, ['02-areas/人脉/张三.md']);
});

test('新建客户同样必问一句简介，联系方式照旧可空且安全落进 YAML', async () => {
    const fx = intakeFixture();

    await fx.run('create-client', [
        { type: ['Alex'] },
        { choose: '小红书' },
        { type: ['@alex: 私信'] },
        { type: ['', '朋友介绍来的，想系统学 Obsidian'] },
    ]);

    assert.equal(fx.asked.at(-1), BRIEF_TITLE);
    // 空串与全空格同样被拦下；联系方式那一问没设必填，交空串照旧放行
    assert.deepEqual(fx.attempts.slice(-3).map(({ closed, error }) => ({ closed, error: Boolean(error) })), [
        { closed: true, error: false },
        { closed: false, error: true },
        { closed: true, error: false },
    ]);
    assert.equal(fx.created.length, 1);

    const content = fx.created[0].content;

    assert.equal(frontmatterValue(content, 'description'), '朋友介绍来的，想系统学 Obsidian');
    assert.equal(frontmatterValue(content, 'contact'), '@alex: 私信');
    assert.equal(frontmatterValue(content, 'type'), 'client');
});

test('在简介那一步取消，两条命令都不建档', async () => {
    for (const [commandId, steps] of [
        ['create-contact', [{ type: ['李四'] }, { choose: '熟' }, { choose: '向上' }, { cancel: true }]],
        ['create-client', [{ type: ['王五'] }, { choose: 'B站' }, { type: [''] }, { cancel: true }]],
    ]) {
        const fx = intakeFixture();

        await fx.run(commandId, steps);

        assert.equal(fx.asked.at(-1), BRIEF_TITLE, commandId);
        assert.equal(fx.created.length, 0, commandId);
        assert.equal(fx.opened.length, 0, commandId);
    }
});

test('重名在问完名字时就打开旧档案，不再让人答后面几问', async () => {
    for (const [commandId, path] of [
        ['create-contact', '02-areas/人脉/张三.md'],
        ['create-client', '02-areas/客户/张三.md'],
    ]) {
        const fx = intakeFixture([path]);

        await fx.run(commandId, [{ type: ['张三'] }]);

        assert.equal(fx.asked.length, 1, commandId);
        assert.deepEqual(fx.opened, [path], commandId);
        assert.equal(fx.created.length, 0, commandId);
    }
});

test('供手工复制的两份模板仍把简介留空', () => {
    assert.match(personTemplateFile(), /^description:$/m);
    assert.match(clientTemplateFile(), /^description:$/m);
    assert.match(clientTemplateFile(), /^contact:$/m);
});

// ============================================================
// 客户答疑：表上只剩「哪一篇」与「那次解决了什么」
// ============================================================

/** 把某个视图文件的真源连同 core/table 编进一个只够画表的 DOM 替身 */
async function loadViews(relativePath) {
    // 视图经 identity 间接够到弹窗、目录与时间；画表用不着它们，只要导出名对得上
    const stub = `
        import moment from 'moment';
        export { moment };
        export class TFile {}
        export class TFolder {}
        export class Notice {}
        export class Modal {}
        export class FuzzySuggestModal {}
        export class ButtonComponent {}
        export const normalizePath = (value) => value;
    `;
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-views-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({
                        path: 'obsidian',
                        namespace: 'test-stub',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, () => ({
                        contents: stub,
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

class DomStub {
    constructor(tag = 'div', options = {}) {
        this.tag = tag;
        this.cls = options.cls;
        this.children = [];
        this.parts = options.text === undefined ? [] : [String(options.text)];
    }
    createEl(tag, options = {}) {
        const child = new DomStub(tag, options);
        this.children.push(child);
        this.parts.push(child);
        return child;
    }
    createDiv(options = {}) { return this.createEl('div', options); }
    createSpan(options = {}) { return this.createEl('span', options); }
    appendText(text) { this.parts.push(String(text)); }
    setText(text) { this.parts = [String(text)]; }
    setAttribute() {}
    addEventListener() {}
    appendChild(child) { this.children.push(child); this.parts.push(child); }
    get textContent() {
        return this.parts.map((part) => (typeof part === 'string' ? part : part.textContent)).join('');
    }
    all(tag) {
        return [
            ...(this.tag === tag ? [this] : []),
            ...this.children.flatMap((child) => child.all(tag)),
        ];
    }
}

const { clientViews } = await loadViews('src/modules/contacts/clientViews.ts');
const { personViews } = await loadViews('src/modules/contacts/personViews.ts');

// renderCell 先问一格是不是调用方搭好的元素；Node 里没有这个类，给它一个谁都不是的空类
globalThis.HTMLElement ??= class {};

test('客户答疑只列答疑与概述两栏：不再显示领域与更新日期，新的仍在上面', async () => {
    const client = { path: '02-areas/客户/Alex.md', basename: 'Alex', stat: { mtime: 0 } };
    const note = (name, fields) => ({
        file: { path: `02-areas/obsidian/${name}.md`, basename: name, stat: { mtime: 0 } },
        fields: { tags: ['obsidian/QA'], ...fields },
    });
    const answers = [
        note('答疑-同步冲突', {
            description: '两台电脑同时改一篇，教他看 [[同步冲突]] 的合并提示',
            updated: '2026-09-02 10:00:00',
            up: ['[[MOC-obsidian]]'],
        }),
        note('答疑-插件装不上', { updated: '2026-09-20 09:00:00' }),
        note('答疑-只是提到', { description: '标签对了，属性里却没链到他', updated: '2026-09-21 09:00:00' }),
    ];
    const byFile = new Map(answers.map((answer) => [answer.file, answer]));
    const el = new DomStub();
    const view = {
        host: client,
        el,
        sourcePath: client.path,
        ctx: { app: {} },
        index: {
            backlinksOf: () => answers.map((answer) => answer.file),
            fieldOf: (file, key) => byFile.get(file)?.fields[key],
            frontmatterLinksTo: (file) => byFile.get(file).file.basename !== '答疑-只是提到',
        },
    };

    await clientViews.find((definition) => definition.name === '客户答疑').render(view);

    assert.deepEqual(el.all('th').map((th) => th.textContent), ['答疑 (2)', '概述']);
    assert.deepEqual(
        el.all('tr').slice(1).map((tr) => tr.all('td').map((td) => td.textContent)),
        [
            ['答疑-插件装不上', '—'],
            ['答疑-同步冲突', '两台电脑同时改一篇，教他看 同步冲突 的合并提示'],
        ],
    );
    // 概述是用户原话：里面的双链照样画成可点的链接，而不是一串带方括号的死字
    assert.equal(el.all('a').some((anchor) => anchor.textContent === '同步冲突'), true);
});

// ============================================================
// 客户档案的相关项目：与人脉档案同一套检索
// ============================================================

const CLIENT_HEADINGS = /^## (?:付费与交付|相关项目（自动）|客户答疑（自动）|关键事件（自动）|待办（自动）)$/gm;

test('新客户档案自带相关项目，排在付费与交付之后——两条交易线挨着', () => {
    const fresh = clientNoteContent({
        created: '2026-09-21 10:00:00',
        uid: 20260921100000,
        type: 'client',
        description: '朋友介绍来的，想系统学 Obsidian',
        source: '朋友介绍',
        contact: '',
    });

    assert.deepEqual(fresh.match(CLIENT_HEADINGS), [
        '## 付费与交付',
        '## 相关项目（自动）',
        '## 客户答疑（自动）',
        '## 关键事件（自动）',
        '## 待办（自动）',
    ]);
    assert.equal([...fresh.matchAll(/```ziminos\n相关项目\n```/g)].length, 1);
    // 手工复制用的模板与命令建档同一副骨架
    assert.deepEqual(clientTemplateFile().match(CLIENT_HEADINGS), fresh.match(CLIENT_HEADINGS));
});

test('补齐客户档案检索：旧档案按模板顺序补上相关项目，原有小节被删的不替他加回来', () => {
    const body = (...headings) => ['---', 'type: client', '---', '', ...headings.flatMap((heading) => [heading, '', '手写的字', ''])].join('\n');

    // v0.23.0 之前建的档案：两块都缺
    const before023 = ensureClientViews(body('## 付费与交付', '## 关键事件（自动）', '## 待办（自动）'));

    assert.deepEqual(before023.match(CLIENT_HEADINGS), [
        '## 付费与交付',
        '## 相关项目（自动）',
        '## 客户答疑（自动）',
        '## 关键事件（自动）',
        '## 待办（自动）',
    ]);
    assert.equal([...before023.matchAll(/手写的字/g)].length, 3, '原有正文一个字都不能丢');

    // v0.23.0 之后建的档案：只缺相关项目，补在客户答疑之前
    const after023 = ensureClientViews(body('## 付费与交付', '## 客户答疑（自动）', '## 关键事件（自动）'));

    assert.deepEqual(after023.match(CLIENT_HEADINGS), [
        '## 付费与交付',
        '## 相关项目（自动）',
        '## 客户答疑（自动）',
        '## 关键事件（自动）',
    ]);

    // 用户自己删掉了付费与交付：补齐命令只补后来才进模板的块，不替他加回来
    const trimmed = ensureClientViews(body('## 关键事件（自动）'));

    assert.equal(trimmed.includes('## 付费与交付'), false);
    assert.equal(ensureClientViews(trimmed), trimmed);

    // 只剩标题、代码块被删：把代码块放回标题下，不另起一个同名标题
    const headingOnly = ensureClientViews(body('## 相关项目（自动）', '## 客户答疑（自动）'));

    assert.equal([...headingOnly.matchAll(/## 相关项目（自动）/g)].length, 1);
    assert.match(headingOnly, /## 相关项目（自动）\n\n```ziminos\n相关项目\n```/);

    // 新建的档案原样不动
    const fresh = clientTemplateFile();

    assert.equal(ensureClientViews(fresh), fresh);
});

test('客户档案上的相关项目认得新建项目写下的全路径双链，做完的项目不在这张表里', async () => {
    const client = { path: '02-areas/客户/Alex.md', basename: 'Alex', stat: { mtime: 0 } };
    const project = (name, fields) => ({
        file: { path: `01-projects/${name}/MOC-${name}.md`, basename: `MOC-${name}`, stat: { mtime: 0 } },
        fields: { type: 'project', ...fields },
    });
    // 新建项目选客户时，createContainer 写的就是这个形状：全路径消歧，别名只管显示
    const projects = [
        project('Alex 的知识库搭建', {
            client: '[[02-areas/客户/Alex|Alex]]',
            status: 'active',
            description: '替他把 Obsidian 库从零搭起来',
        }),
        project('一起录课', { with: ['[[Alex]]'], status: 'active' }),
        project('上一期陪跑', { client: '[[02-areas/客户/Alex|Alex]]', status: 'done' }),
        project('别人的项目', { client: '[[02-areas/客户/Bob|Bob]]', status: 'active' }),
    ];
    const byFile = new Map(projects.map((item) => [item.file, item]));
    const el = new DomStub();
    const view = {
        host: client,
        el,
        sourcePath: client.path,
        ctx: { app: {} },
        index: {
            notesOfType: (type) => (type === 'project' ? projects.map((item) => item.file) : []),
            fieldOf: (file, key) => byFile.get(file)?.fields[key],
            // 与 metadataCache 同一个口径：全路径与裸文件名都解析到同一份档案
            resolve: (link) => (['02-areas/客户/Alex', 'Alex'].includes(link) ? client : null),
        },
    };

    await personViews.find((definition) => definition.name === '相关项目').render(view);

    assert.deepEqual(el.all('th').map((th) => th.textContent), ['项目 (2)', '关系', '概述']);
    assert.deepEqual(
        el.all('tr').slice(1).map((tr) => tr.all('td').map((td) => td.textContent)),
        [
            ['MOC-Alex 的知识库搭建', '委托', '替他把 Obsidian 库从零搭起来'],
            ['MOC-一起录课', '同行', '—'],
        ],
    );
});
