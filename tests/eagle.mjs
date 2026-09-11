/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 Eagle 协议事实源并审计两端边界
 * [OUTPUT]: 覆盖稳定 URI 往返、Markdown/YAML 编辑命中、图片排除分流、内容容器/日记路由注入、Eagle 两级项目目录与单层日记目录归档、当前文件夹打开与附件选中、原生唤起深链、端口回落、版本/平台镜像、回环绑定、令牌、fail-closed、可复现安装包、学员 HTML 指南与服务路由
 * [POS]: tests 的 Eagle 专项回归入口；纯函数跑真实源码，平台边界读产物结构，服务在伪造 Eagle 官方运行时中走真实 HTTP，不复制第二份实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTypeScript(relativePath) {
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const {
    buildEagleMarkdown,
    buildEagleNativeItemUri,
    buildEagleUri,
    eagleReferenceAtText,
    isImageAttachment,
    normalizeEaglePort,
    parseEagleUri,
    singleEagleReferenceInText,
} = await loadTypeScript('src/modules/eagle/protocol.ts');

test('Eagle 身份链接只由逻辑库与 itemId 构成，可无损往返', () => {
    const reference = { libraryKey: 'primary', itemId: 'LZ9_A-b21' };
    const uri = buildEagleUri(reference);

    assert.equal(uri, 'ziminos-eagle://v1/primary/LZ9_A-b21');
    assert.deepEqual(parseEagleUri(uri), reference);
    assert.equal(uri.includes('23119'), false);
    assert.equal(uri.includes('Users'), false);
});

test('Eagle 原生深链只用于唤起并精确定位 itemId', () => {
    const reference = { libraryKey: 'primary', itemId: 'MTS3IYYC6MW13' };

    assert.equal(buildEagleNativeItemUri(reference), 'eagle://item/MTS3IYYC6MW13');
    assert.throws(() => buildEagleNativeItemUri({ ...reference, itemId: '../bad' }));
});

test('Eagle 链接拒绝未知版本、路径与查询串', () => {
    assert.equal(parseEagleUri('ziminos-eagle://v2/primary/ABC'), null);
    assert.equal(parseEagleUri('ziminos-eagle://v1/primary/folder/ABC'), null);
    assert.equal(parseEagleUri('ziminos-eagle://v1/primary/ABC?port=1'), null);
});

test('实时预览在 Markdown 标签与 YAML 裸链接上都能命中稳定身份', () => {
    const reference = { libraryKey: 'primary', itemId: 'MTS3IYYC6MW13' };
    const uri = buildEagleUri(reference);
    const markdown = `[邀请函](${uri})`;
    const yaml = `  - ${uri}`;

    assert.deepEqual(eagleReferenceAtText(markdown, markdown.indexOf('请')), reference);
    assert.deepEqual(eagleReferenceAtText(markdown, markdown.indexOf(uri) + 5), reference);
    assert.deepEqual(eagleReferenceAtText(yaml, yaml.indexOf(uri) + 10), reference);
    assert.equal(eagleReferenceAtText(markdown, markdown.length), null);
    assert.deepEqual(singleEagleReferenceInText(yaml), reference);
});

test('文本命中不从损坏 URI 截前缀，也不在多附件控件里猜测', () => {
    const uri = 'ziminos-eagle://v1/primary/ABC123';

    assert.equal(singleEagleReferenceInText(`${uri}?port=1`), null);
    assert.equal(singleEagleReferenceInText(`${uri}/child`), null);
    assert.equal(singleEagleReferenceInText(`https://example.com/${uri}`), null);
    assert.equal(singleEagleReferenceInText(`${uri} ${uri.replace('ABC123', 'OTHER')}`), null);
});

test('图片生成嵌入，其他附件生成普通链接', () => {
    const reference = { libraryKey: 'primary', itemId: 'ABC123' };

    assert.equal(
        buildEagleMarkdown(reference, '截图[1].png', 'image/png'),
        '![截图\\[1\\].png](ziminos-eagle://v1/primary/ABC123)',
    );
    assert.equal(
        buildEagleMarkdown(reference, '合同.pdf', 'application/pdf'),
        '[合同.pdf](ziminos-eagle://v1/primary/ABC123)',
    );
});

test('图片排除同时识别 MIME 与扩展名，不误伤普通附件', () => {
    assert.equal(isImageAttachment('clipboard', 'image/png'), true);
    assert.equal(isImageAttachment('海报.JPEG', ''), true);
    assert.equal(isImageAttachment('原图.svg', 'application/octet-stream'), true);
    assert.equal(isImageAttachment('附件.pdf', 'application/pdf'), false);
    assert.equal(isImageAttachment('图片说明.txt', 'text/plain'), false);
});

test('Eagle 端口只接受无需提权的整数范围', () => {
    assert.equal(normalizeEaglePort(24000), 24000);
    assert.equal(normalizeEaglePort(80), 23119);
    assert.equal(normalizeEaglePort('24000'), 23119);
    assert.equal(normalizeEaglePort(70000), 23119);
});

test('Obsidian 与 Eagle 伴侣的版本镜像一致，伴侣覆盖 macOS/Windows', () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const obsidian = JSON.parse(readFileSync(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/manifest.json'), 'utf8'));
    const eagle = JSON.parse(readFileSync(path.join(ROOT, 'eagle-companion/manifest.json'), 'utf8'));

    assert.equal(obsidian.version, pkg.version);
    assert.equal(eagle.version, pkg.version);
    assert.equal(eagle.platform, 'all');
    assert.equal(eagle.arch, 'all');
    assert.equal(eagle.main.serviceMode, true);
});

test('Eagle 窗口兼容官方 Chromium 107，并以 CSP 拒绝外部脚本', () => {
    const html = readFileSync(path.join(ROOT, 'eagle-companion/index.html'), 'utf8');
    const styles = readFileSync(path.join(ROOT, 'eagle-companion/styles.css'), 'utf8');

    assert.ok(html.includes('Content-Security-Policy'));
    assert.ok(html.includes("script-src 'self'"));
    assert.equal(styles.includes('color-mix('), false);
});

test('Obsidian 半边只在 macOS/Windows 桌面端注册', () => {
    const platform = readFileSync(path.join(ROOT, 'src/modules/eagle/platform.ts'), 'utf8');
    const transfer = readFileSync(path.join(ROOT, 'src/modules/eagle/transfer.ts'), 'utf8');
    const render = readFileSync(path.join(ROOT, 'src/modules/eagle/render.ts'), 'utf8');
    const editor = readFileSync(path.join(ROOT, 'src/modules/eagle/editor.ts'), 'utf8');

    assert.ok(platform.includes('Platform.isDesktopApp'));
    assert.ok(platform.includes('Platform.isMacOS || Platform.isWin'));
    assert.ok(transfer.includes('isSupportedEagleDesktop()'));
    assert.ok(render.includes('isSupportedEagleDesktop()'));
    assert.ok(render.includes('registerEditorExtension'));
    assert.ok(editor.includes('event.metaKey && !event.ctrlKey'));
});

test('容器与日记归属只由上游模块判定，再由 main 注入 Eagle', () => {
    const location = readFileSync(path.join(ROOT, 'src/modules/projects/location.ts'), 'utf8');
    const main = readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    const transfer = readFileSync(path.join(ROOT, 'src/modules/eagle/transfer.ts'), 'utf8');

    assert.ok(location.includes('settings.projectFolder'));
    assert.ok(location.includes('settings.areaFolder'));
    assert.ok(location.includes('settings.archiveFolder'));
    assert.ok(location.includes('settings.diaryFolder'));
    assert.ok(location.includes('FOLDERS.resources'));
    assert.ok(location.includes("{ kind: 'diary' }"));
    assert.ok(location.includes("{ kind: 'project', name: parts[0] }"));
    assert.ok(main.includes('attachmentRouteOfNotePath(ctx.settings, notePath)'));
    assert.ok(transfer.includes('resolveRoute(info.file.path)'));
    assert.equal(transfer.includes('settings.projectFolder'), false);
});

test('Eagle 安装包可解压，根层交付物齐全', () => {
    const artifact = path.join(ROOT, 'vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin');
    const listing = execFileSync('unzip', ['-Z1', artifact], { encoding: 'utf8' }).trim().split('\n').sort();
    const expected = ['manifest.json', 'index.html', 'styles.css', 'logo.png', 'README.md', 'LICENSE', 'js/service.js'].sort();

    assert.deepEqual(listing, expected);

    const manifest = JSON.parse(execFileSync('unzip', ['-p', artifact, 'manifest.json'], { encoding: 'utf8' }));
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    assert.equal(manifest.version, pkg.version);

    const packager = readFileSync(path.join(ROOT, 'package-eagle.sh'), 'utf8');

    assert.ok(packager.includes('touch -t 198001010000.00'));
    assert.ok(packager.includes('chmod 0644'));
});

// 学员指南住在 docs/，而 publish-v1.sh 的共享清单里没有 docs/——
// 两个仓库各自把话说给各自的读者听。因此这条在第一版仓库里没有对象。
const guidePath = path.join(ROOT, 'docs/Eagle附件桥接安装与使用指南.html');

test('学员 HTML 指南覆盖升级、安装、配对、验收与排障，不诱导读取凭据', { skip: !existsSync(guidePath) }, () => {
    const guide = readFileSync(guidePath, 'utf8');
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    for (const anchor of ['id="upgrade"', 'id="install"', 'id="pair"', 'id="organize"', 'id="verify"', 'id="troubleshoot"']) {
        assert.ok(guide.includes(anchor));
    }
    assert.ok(guide.includes('三、C 三库系统的日常升级'));
    assert.ok(guide.includes(pkg.version));
    assert.ok(guide.includes('⌘ + 单击'));
    assert.ok(guide.includes('Ctrl + 单击'));
    assert.ok(guide.includes('Eagle 4.0 Build 18'));
    assert.ok(guide.includes('系统应先启动 Eagle'));
    assert.ok(guide.includes('项目/以人为本系列课程'));
    assert.ok(guide.includes('02-areas/容器名'));
    assert.ok(guide.includes('03-resources/容器名'));
    assert.ok(guide.includes('04-archives/容器名'));
    assert.ok(guide.includes('<code>日记</code>'));
    assert.ok(guide.includes('图片不交给 Eagle（交给图床）'));
    assert.ok(guide.includes('图片与其他附件请分两次操作'));
    assert.ok(guide.includes('ziminOS 不保存图床密钥'));
    assert.ok(guide.includes('同一级出现多个同名目录'));
    assert.ok(guide.includes('伴侣版本过旧'));
    assert.ok(guide.includes('覆盖安装同版 Eagle 伴侣'));
    assert.ok(guide.includes('同一 Eagle 库里换文件夹'));
    assert.ok(guide.includes('打开附件当前所在的文件夹并选中该附件'));
    assert.ok(guide.includes('只有未归类附件才会留在“全部”'));
    assert.ok(guide.includes('不要手动编辑或分享配对令牌'));
    assert.equal(/<script\b/i.test(guide), false);
});

test('Eagle 伴侣只开回环、变更端点验令牌，资源操作只调官方 API', () => {
    const source = readFileSync(path.join(ROOT, 'eagle-companion/js/service.js'), 'utf8');
    const client = readFileSync(path.join(ROOT, 'src/modules/eagle/client.ts'), 'utf8');

    assert.ok(source.includes("server.listen(port, '127.0.0.1')"));
    assert.ok(source.includes("request.headers['x-ziminos-token']"));
    assert.ok(source.includes('isJsonRequest(request)'));
    assert.ok(source.includes("/^[a-f0-9]{64}$/.test(value.token)"));
    assert.ok(source.includes("url.pathname === '/v1/disconnect'"));
    assert.ok(source.includes("url.pathname === '/v1/projects/import'"));
    assert.ok(source.includes("url.pathname === '/v1/diary/import'"));
    assert.ok(source.includes('eagle.item.addFromPath'));
    assert.ok(source.includes('eagle.folder.getAll'));
    assert.ok(source.includes('eagle.folder.create'));
    assert.ok(source.includes('eagle.folder.createSubfolder'));
    assert.ok(source.includes('eagle.folder.open'));
    assert.ok(source.includes('eagle.item.getById'));
    assert.ok(source.includes('eagle.item.open'));
    assert.ok(source.includes('eagle.item.select'));
    assert.ok(source.includes('eagle.app.show'));
    assert.ok(client.includes("require('electron')"));
    assert.ok(client.includes("? '/v1/projects/import'"));
    assert.ok(client.includes("? '/v1/diary/import'"));
    assert.ok(client.includes('Eagle 伴侣版本过旧'));
    assert.ok(client.includes('shell.openExternal(buildEagleNativeItemUri(reference))'));
    assert.ok(client.includes('EAGLE_WAKE_RETRY_DELAYS_MS'));
    assert.ok(client.includes('await this.retryOpenAfterNative(reference, error)'));
    assert.ok(client.includes('暂时只能在“全部”中显示附件'));
    assert.equal(client.includes('setInterval('), false);
    assert.equal(source.includes('Access-Control-Allow-Origin'), false);
    assert.equal(/writeFile[^\n]*metadata\.json/.test(source), false);
});

test('附件事件在第一个 await 之前接管，失败路径不回退本地附件', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/eagle/transfer.ts'), 'utf8');
    const handler = source.slice(source.indexOf('async function takeTransfer'), source.indexOf('/** 尽量直接交原路径'));

    assert.ok(handler.includes('ctx.settings.eagleExcludeImages'));
    assert.ok(handler.includes('isImageAttachment(file.name, file.type)'));
    assert.ok(handler.indexOf('if (files.length === 0) return;') < handler.indexOf('event.preventDefault()'));
    assert.ok(handler.indexOf('event.preventDefault()') < handler.indexOf('await materialize'));
    assert.ok(handler.includes('请将图片单独粘贴或拖入'));
    assert.ok(handler.includes('未在 Obsidian 本地保留副本'));
    assert.equal(handler.includes('createBinary'), false);
    assert.equal(handler.includes('adapter.write'), false);
});

test('编辑设置页对用户暴露图片分流开关与边界说明', () => {
    const model = readFileSync(path.join(ROOT, 'src/settingsModel.ts'), 'utf8');
    const panels = readFileSync(path.join(ROOT, 'src/settingsPanels.ts'), 'utf8');

    assert.ok(model.includes("eagleExcludeImagesName: '图片不交给 Eagle（交给图床）'"));
    assert.ok(model.includes('ziminOS 不保存图床密钥'));
    assert.ok(model.includes('图片与其他附件请分两次'));
    assert.ok(panels.includes("'eagleExcludeImages'"));
});

test('Eagle 图片离开 DOM 即释放 blob，浏览多篇笔记不累积内存', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/eagle/render.ts'), 'utf8');

    assert.ok(source.includes('record.removedNodes'));
    assert.ok(source.includes('URL.revokeObjectURL(url)'));
    assert.ok(source.includes('release(doc)'));
    assert.equal(source.includes('contentCache'), false);
});

test('内存附件临时文件名兼容 Windows 保留设备名', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/eagle/transfer.ts'), 'utf8');

    assert.ok(source.includes('con|prn|aux|nul|com[1-9]|lpt[1-9]'));
    assert.ok(source.includes('`_${safe}`'));
});

test('认证令牌不进可同步的设置契约', () => {
    const settings = readFileSync(path.join(ROOT, 'src/core/types.ts'), 'utf8');
    const client = readFileSync(path.join(ROOT, 'src/modules/eagle/client.ts'), 'utf8');

    assert.equal(/eagleToken\s*:/.test(settings), false);
    assert.ok(client.includes('app.secretStorage.getSecret'));
    assert.ok(client.includes('app.secretStorage.setSecret'));
    assert.ok(client.includes("'ziminos-eagle-auth-primary'"));
    assert.equal(client.includes('window.localStorage'), false);
    assert.ok(client.includes('X-Ziminos-Token'));
    assert.ok(client.includes('return revokedRemotely'));
});

test('Eagle 回环服务在伪造官方运行时中完成鉴权、导入、读取与打开', async () => {
    const source = readFileSync(path.join(ROOT, 'eagle-companion/js/service.js'), 'utf8');
    const storage = new Map();
    const module = { exports: {} };
    const context = createContext({
        Buffer,
        URL,
        module,
        exports: module.exports,
        process,
        require: createRequire(import.meta.url),
        localStorage: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
        },
    });

    runInContext(source, context, { filename: 'eagle-companion/js/service.js' });

    const folder = mkdtempSync(path.join(tmpdir(), 'ziminos-eagle-test-'));
    const attachment = path.join(folder, 'sample.txt');
    const opened = [];
    const openedFolders = [];
    const imported = [];
    const selected = [];
    const shown = [];
    const nativeLinks = [];
    const eagleFolders = [];
    const createdFolders = [];
    let itemFolders = ['PROJECT_COURSE'];

    writeFileSync(attachment, 'hello-eagle');
    context.document = { getElementById: () => ({ textContent: '' }) };
    context.eagle = {
        app: {
            show: async () => {
                shown.push(true);
                return true;
            },
        },
        library: { path: folder, name: '测试资源库' },
        folder: {
            getAll: async () => eagleFolders,
            open: async (folderId) => openedFolders.push(folderId),
            create: async (options) => {
                const id = options.name === '日记' ? 'DIARY_ROOT' : 'PROJECT_ROOT';
                const created = { id, parent: '', children: [], ...options };

                eagleFolders.push(created);
                createdFolders.push({ kind: 'root', options });
                return created;
            },
            createSubfolder: async (parent, options) => {
                const id = options.name === '以人为本系列课程'
                    ? 'PROJECT_COURSE'
                    : `PROJECT_${createdFolders.length}`;
                const created = { id, parent, children: [], ...options };

                eagleFolders.push(created);
                createdFolders.push({ kind: 'child', parent, options });
                return created;
            },
        },
        item: {
            addFromPath: async (filePath, options) => {
                imported.push({ filePath, options });
                return 'ITEM123';
            },
            getById: async () => ({ filePath: attachment, isDeleted: false, folders: itemFolders }),
            open: async (itemId) => {
                opened.push(itemId);
                return true;
            },
            select: async (itemIds) => {
                selected.push(...itemIds);
                return true;
            },
        },
    };

    const service = new module.exports.BridgeService();
    let blockedPort = null;

    service.version = '0.22.0';
    service.render = () => undefined;

    try {
        await service.listen(0);
        const port = service.server.address().port;
        const unauthorized = await callBridge(port, 'GET', '/v1/status?library=primary');

        assert.equal(unauthorized.status, 401);

        const simpleCrossSite = await callBridge(port, 'POST', '/v1/pair', '{}', {
            'Content-Type': 'text/plain',
        }, true);

        assert.equal(simpleCrossSite.status, 415);

        const paired = await callBridge(port, 'POST', '/v1/pair', {
            code: service.pairCode,
            vaultName: '测试笔记库',
            libraryKey: 'primary',
        });
        const pairResult = JSON.parse(paired.body);

        assert.equal(paired.status, 200);
        assert.match(pairResult.token, /^[a-f0-9]{64}$/);

        const token = pairResult.token;
        const headers = { 'X-Ziminos-Token': token };
        const status = await callBridge(port, 'GET', '/v1/status?library=primary', null, headers);

        assert.equal(status.status, 200);
        assert.equal(JSON.parse(status.body).libraryMatched, true);

        const originalServer = service.server;
        blockedPort = await occupyPort();

        await assert.rejects(service.listen(blockedPort.port));
        assert.equal(service.server, originalServer);
        assert.equal((await callBridge(port, 'GET', '/v1/status?library=primary', null, headers)).status, 200);
        await blockedPort.close();
        blockedPort = null;

        const importedResponse = await callBridge(port, 'POST', '/v1/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '样例.txt',
            folderId: 'FOLDER123',
        }, headers);

        assert.equal(importedResponse.status, 200);
        assert.equal(JSON.parse(importedResponse.body).itemId, 'ITEM123');
        assert.equal(imported.length, 1);
        assert.deepEqual(Array.from(imported[0].options.folders), ['FOLDER123']);

        const missingProject = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '缺项目名.txt',
        }, headers);

        assert.equal(missingProject.status, 400);
        assert.equal(imported.length, 1);

        const projectImport = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '课程附件.txt',
            folderId: 'IGNORED_FOR_PROJECT',
            projectName: '以人为本系列课程',
        }, headers);

        assert.equal(projectImport.status, 200);
        assert.equal(JSON.parse(projectImport.body).folderPath, '项目/以人为本系列课程');
        assert.deepEqual(createdFolders.map((entry) => entry.kind), ['root', 'child']);
        assert.equal(createdFolders[0].options.name, '项目');
        assert.equal(createdFolders[1].parent, 'PROJECT_ROOT');
        assert.equal(createdFolders[1].options.name, '以人为本系列课程');
        assert.deepEqual(Array.from(imported[1].options.folders), ['PROJECT_COURSE']);

        const repeatedProjectImport = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '第二份附件.txt',
            projectName: '以人为本系列课程',
        }, headers);

        assert.equal(repeatedProjectImport.status, 200);
        assert.equal(createdFolders.length, 2);
        assert.deepEqual(Array.from(imported[2].options.folders), ['PROJECT_COURSE']);

        const invalidProject = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '非法.txt',
            projectName: '../错误项目',
        }, headers);

        assert.equal(invalidProject.status, 400);
        assert.equal(imported.length, 3);

        eagleFolders.push({ id: 'PROJECT_ROOT_DUP', name: '项目', parent: '', children: [] });
        const ambiguousProject = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '不能误放.txt',
            projectName: '另一个项目',
        }, headers);

        assert.equal(ambiguousProject.status, 409);
        assert.match(JSON.parse(ambiguousProject.body).error, /多个同名“项目”/);
        assert.equal(imported.length, 3);

        eagleFolders.pop();
        const recoveredProject = await callBridge(port, 'POST', '/v1/projects/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '恢复后.txt',
            projectName: '另一个项目',
        }, headers);

        assert.equal(recoveredProject.status, 200);
        assert.equal(imported.length, 4);

        const diaryImport = await callBridge(port, 'POST', '/v1/diary/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '日记附件.txt',
            folderId: 'IGNORED_FOR_DIARY',
        }, headers);

        assert.equal(diaryImport.status, 200);
        assert.equal(JSON.parse(diaryImport.body).folderPath, '日记');
        assert.equal(createdFolders[3].kind, 'root');
        assert.equal(createdFolders[3].options.name, '日记');
        assert.deepEqual(Array.from(imported[4].options.folders), ['DIARY_ROOT']);

        const repeatedDiaryImport = await callBridge(port, 'POST', '/v1/diary/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '第二份日记附件.txt',
        }, headers);

        assert.equal(repeatedDiaryImport.status, 200);
        assert.equal(createdFolders.length, 4);
        assert.deepEqual(Array.from(imported[5].options.folders), ['DIARY_ROOT']);

        eagleFolders.push({ id: 'DIARY_ROOT_DUP', name: '日记', parent: '', children: [] });
        const ambiguousDiary = await callBridge(port, 'POST', '/v1/diary/import', {
            libraryKey: 'primary',
            filePath: attachment,
            name: '不能误放的日记附件.txt',
        }, headers);

        assert.equal(ambiguousDiary.status, 409);
        assert.match(JSON.parse(ambiguousDiary.body).error, /多个同名“日记”/);
        assert.equal(imported.length, 6);
        eagleFolders.pop();

        const content = await callBridge(port, 'GET', '/v1/items/ITEM123/content?library=primary', null, headers);

        assert.equal(content.status, 200);
        assert.equal(content.body, 'hello-eagle');

        const openedResponse = await callBridge(port, 'POST', '/v1/items/ITEM123/open', {
            libraryKey: 'primary',
        }, headers);

        assert.equal(openedResponse.status, 200);
        assert.equal(JSON.parse(openedResponse.body).openedIn, 'folder');
        assert.deepEqual(opened, []);
        assert.deepEqual(openedFolders, ['PROJECT_COURSE']);
        assert.deepEqual(selected, ['ITEM123']);
        assert.deepEqual(shown, [true]);

        itemFolders = ['MOVED_FOLDER'];
        context.eagle.app.show = async () => false;
        context.eagle.shell = { openExternal: async (url) => nativeLinks.push(url) };

        const fallbackOpen = await callBridge(port, 'POST', '/v1/items/ITEM123/open', {
            libraryKey: 'primary',
        }, headers);

        assert.equal(fallbackOpen.status, 200);
        assert.deepEqual(nativeLinks, ['eagle://item/ITEM123']);
        assert.deepEqual(openedFolders, ['PROJECT_COURSE', 'MOVED_FOLDER']);

        context.eagle.app.show = async () => { throw new Error('show failed'); };

        const rejectedShowFallback = await callBridge(port, 'POST', '/v1/items/ITEM123/open', {
            libraryKey: 'primary',
        }, headers);

        assert.equal(rejectedShowFallback.status, 200);
        assert.deepEqual(nativeLinks, ['eagle://item/ITEM123', 'eagle://item/ITEM123']);
        assert.deepEqual(openedFolders, ['PROJECT_COURSE', 'MOVED_FOLDER', 'MOVED_FOLDER']);

        itemFolders = [];
        context.eagle.app.show = async () => {
            shown.push(true);
            return true;
        };
        const unfiledOpen = await callBridge(port, 'POST', '/v1/items/ITEM123/open', {
            libraryKey: 'primary',
        }, headers);

        assert.equal(unfiledOpen.status, 200);
        assert.equal(JSON.parse(unfiledOpen.body).openedIn, 'all');
        assert.deepEqual(opened, ['ITEM123']);
        assert.deepEqual(shown, [true, true]);

        const disconnected = await callBridge(port, 'POST', '/v1/disconnect', {}, headers);

        assert.equal(disconnected.status, 200);
        assert.equal((await callBridge(port, 'GET', '/v1/status?library=primary', null, headers)).status, 401);
    } finally {
        if (blockedPort) await blockedPort.close();
        await service.stop();
        rmSync(folder, { recursive: true, force: true });
    }
});

function callBridge(port, method, requestPath, body = null, headers = {}, raw = false) {
    const payload = body === null ? null : Buffer.from(raw ? String(body) : JSON.stringify(body));

    return new Promise((resolve, reject) => {
        const request = httpRequest({
            host: '127.0.0.1',
            port,
            path: requestPath,
            method,
            headers: {
                ...headers,
                ...(payload ? {
                    ...(!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
                        ? { 'Content-Type': 'application/json' }
                        : {}),
                    'Content-Length': payload.length,
                } : {}),
            },
        }, (response) => {
            const chunks = [];

            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve({
                status: response.statusCode,
                body: Buffer.concat(chunks).toString('utf8'),
            }));
        });

        request.on('error', reject);
        if (payload) request.write(payload);
        request.end();
    });
}

async function occupyPort() {
    const { createServer } = await import('node:net');
    const server = createServer();

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    return {
        port: server.address().port,
        close: () => new Promise((resolve) => server.close(resolve)),
    };
}
