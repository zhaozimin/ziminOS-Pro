/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 Eagle 协议事实源并审计两端边界
 * [OUTPUT]: 覆盖稳定 URI 往返、Markdown 形态、端口回落、版本/平台镜像、回环绑定、令牌、fail-closed、安装包、学员 HTML 指南与服务路由
 * [POS]: tests 的 Eagle 专项回归入口；纯函数跑真实源码，平台边界读产物结构，服务在伪造 Eagle 官方运行时中走真实 HTTP，不复制第二份实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    buildEagleUri,
    normalizeEaglePort,
    parseEagleUri,
} = await loadTypeScript('src/modules/eagle/protocol.ts');

test('Eagle 身份链接只由逻辑库与 itemId 构成，可无损往返', () => {
    const reference = { libraryKey: 'primary', itemId: 'LZ9_A-b21' };
    const uri = buildEagleUri(reference);

    assert.equal(uri, 'ziminos-eagle://v1/primary/LZ9_A-b21');
    assert.deepEqual(parseEagleUri(uri), reference);
    assert.equal(uri.includes('23119'), false);
    assert.equal(uri.includes('Users'), false);
});

test('Eagle 链接拒绝未知版本、路径与查询串', () => {
    assert.equal(parseEagleUri('ziminos-eagle://v2/primary/ABC'), null);
    assert.equal(parseEagleUri('ziminos-eagle://v1/primary/folder/ABC'), null);
    assert.equal(parseEagleUri('ziminos-eagle://v1/primary/ABC?port=1'), null);
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

    assert.ok(platform.includes('Platform.isDesktopApp'));
    assert.ok(platform.includes('Platform.isMacOS || Platform.isWin'));
    assert.ok(transfer.includes('isSupportedEagleDesktop()'));
    assert.ok(render.includes('isSupportedEagleDesktop()'));
});

test('Eagle 安装包可解压，根层交付物齐全', () => {
    const artifact = path.join(ROOT, 'vault/.obsidian/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin');
    const listing = execFileSync('unzip', ['-Z1', artifact], { encoding: 'utf8' }).trim().split('\n').sort();
    const expected = ['manifest.json', 'index.html', 'styles.css', 'logo.png', 'README.md', 'LICENSE', 'js/service.js'].sort();

    assert.deepEqual(listing, expected);

    const manifest = JSON.parse(execFileSync('unzip', ['-p', artifact, 'manifest.json'], { encoding: 'utf8' }));
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    assert.equal(manifest.version, pkg.version);
});

test('学员 HTML 指南覆盖升级、安装、配对、验收与排障，不诱导读取凭据', () => {
    const guide = readFileSync(path.join(ROOT, 'docs/Eagle附件桥接安装与使用指南.html'), 'utf8');

    for (const anchor of ['id="upgrade"', 'id="install"', 'id="pair"', 'id="verify"', 'id="troubleshoot"']) {
        assert.ok(guide.includes(anchor));
    }
    assert.ok(guide.includes('三、C 三库系统的日常升级'));
    assert.ok(guide.includes('0.22.0'));
    assert.ok(guide.includes('同一 Eagle 库里换文件夹'));
    assert.ok(guide.includes('不要手动编辑或分享配对令牌'));
    assert.equal(/<script\b/i.test(guide), false);
});

test('Eagle 伴侣只开回环、变更端点验令牌，资源操作只调官方 API', () => {
    const source = readFileSync(path.join(ROOT, 'eagle-companion/js/service.js'), 'utf8');

    assert.ok(source.includes("server.listen(port, '127.0.0.1')"));
    assert.ok(source.includes("request.headers['x-ziminos-token']"));
    assert.ok(source.includes('isJsonRequest(request)'));
    assert.ok(source.includes("/^[a-f0-9]{64}$/.test(value.token)"));
    assert.ok(source.includes("url.pathname === '/v1/disconnect'"));
    assert.ok(source.includes('eagle.item.addFromPath'));
    assert.ok(source.includes('eagle.item.getById'));
    assert.ok(source.includes('eagle.item.open'));
    assert.equal(source.includes('Access-Control-Allow-Origin'), false);
    assert.equal(/writeFile[^\n]*metadata\.json/.test(source), false);
});

test('附件事件在第一个 await 之前接管，失败路径不回退本地附件', () => {
    const source = readFileSync(path.join(ROOT, 'src/modules/eagle/transfer.ts'), 'utf8');
    const handler = source.slice(source.indexOf('async function takeTransfer'), source.indexOf('/** 尽量直接交原路径'));

    assert.ok(handler.indexOf('event.preventDefault()') < handler.indexOf('await materialize'));
    assert.ok(handler.includes('未在 Obsidian 本地保留副本'));
    assert.equal(handler.includes('createBinary'), false);
    assert.equal(handler.includes('adapter.write'), false);
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
    const imported = [];

    writeFileSync(attachment, 'hello-eagle');
    context.document = { getElementById: () => ({ textContent: '' }) };
    context.eagle = {
        library: { path: folder, name: '测试资源库' },
        item: {
            addFromPath: async (filePath, options) => {
                imported.push({ filePath, options });
                return 'ITEM123';
            },
            getById: async () => ({ filePath: attachment, isDeleted: false }),
            open: async (itemId) => {
                opened.push(itemId);
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

        const content = await callBridge(port, 'GET', '/v1/items/ITEM123/content?library=primary', null, headers);

        assert.equal(content.status, 200);
        assert.equal(content.body, 'hello-eagle');

        const openedResponse = await callBridge(port, 'POST', '/v1/items/ITEM123/open', {
            libraryKey: 'primary',
        }, headers);

        assert.equal(openedResponse.status, 200);
        assert.deepEqual(opened, ['ITEM123']);

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
