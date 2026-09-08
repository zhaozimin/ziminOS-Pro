/**
 * [INPUT]: 依赖 Eagle 官方 plugin API 的 library/item/shell 与生命周期事件，依赖 Node 16 内建 http/fs/path/crypto
 * [OUTPUT]: 在 127.0.0.1 提供配对、状态、导入、内容读取与项目打开 API，并提供 Eagle → Obsidian 反向搜索界面
 * [POS]: 两端架构的 Eagle 执行边界。它只调官方 item API，不修改 metadata.json；服务只绑定回环，
 *        变更/读取端点全部验令牌与已配对资源库，令牌不写入响应以外的 DOM、URL 或日志
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_PORT = 23119;
const PORT_MIN = 1024;
const PORT_MAX = 65535;
const CODE_TTL_MS = 5 * 60 * 1000;
const BODY_LIMIT = 64 * 1024;
const CLIENTS_KEY = 'ziminos:eagle-bridge:clients:v1';
const PORT_KEY = 'ziminos:eagle-bridge:port:v1';
const IDENTITY = /^[A-Za-z0-9_-]{1,128}$/;

class BridgeService {
    constructor() {
        this.server = null;
        this.version = '未知';
        this.pairCode = '';
        this.pairCodeExpiresAt = 0;
        this.pairFailures = [];
        this.selectedItem = null;
        this.refreshPairCode();
    }

    async start(manifestVersion) {
        this.version = typeof manifestVersion === 'string' && manifestVersion.trim()
            ? manifestVersion.trim()
            : '未知';
        this.bindUi();
        try {
            await this.listen(this.port());
        } catch {
            // 默认端口被占用时仍要画出端口输入和配对码，让用户能当场切到可用端口。
            this.render();
            return;
        }
        await this.refreshSelection();
        this.render();
    }

    async listen(port) {
        const currentAddress = this.server?.address();
        if (currentAddress && typeof currentAddress === 'object' && currentAddress.port === port) {
            this.setRuntimeStatus(`运行中 · ${libraryName()} · 127.0.0.1:${port}`);
            return;
        }

        const previous = this.server;
        const server = http.createServer((request, response) => {
            void this.route(request, response).catch((error) => {
                if (!response.headersSent) this.json(response, 500, { ok: false, error: safeMessage(error) });
                else response.destroy();
            });
        });

        await new Promise((resolve, reject) => {
            const fail = (error) => {
                server.off('listening', ready);
                reject(error);
            };
            const ready = () => {
                server.off('error', fail);
                resolve();
            };

            server.once('error', fail);
            server.once('listening', ready);
            server.listen(port, '127.0.0.1');
        }).catch((error) => {
            this.setRuntimeStatus(`${previous ? '端口切换' : '启动'}失败：${safeMessage(error)}${previous ? '；原端口仍在运行' : ''}`);
            throw error;
        });

        this.server = server;
        if (previous) await closeHttpServer(previous);
        this.setRuntimeStatus(`运行中 · ${libraryName()} · 127.0.0.1:${port}`);
    }

    async route(request, response) {
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Cache-Control', 'no-store');

        const url = new URL(request.url || '/', 'http://127.0.0.1');

        if (request.method === 'POST' && !isJsonRequest(request)) {
            this.json(response, 415, { ok: false, error: '只接受 application/json 请求' });
            return;
        }

        if (request.method === 'POST' && url.pathname === '/v1/pair') {
            await this.pair(request, response);
            return;
        }

        const client = this.authorize(request);

        if (!client) {
            this.json(response, 401, { ok: false, error: '配对令牌无效，请重新配对' });
            return;
        }

        if (request.method === 'POST' && url.pathname === '/v1/disconnect') {
            this.saveClients(this.clients().filter((item) => item.token !== client.token));
            this.render();
            this.json(response, 200, { ok: true });
            return;
        }

        if (request.method === 'GET' && url.pathname === '/v1/status') {
            const libraryKey = url.searchParams.get('library') || '';
            this.json(response, 200, this.status(client, libraryKey));
            return;
        }

        if (request.method === 'POST' && url.pathname === '/v1/import') {
            await this.importItem(request, response, client);
            return;
        }

        const contentMatch = url.pathname.match(/^\/v1\/items\/([A-Za-z0-9_-]{1,128})\/content$/);
        if (request.method === 'GET' && contentMatch) {
            await this.sendContent(request, response, client, contentMatch[1], url.searchParams.get('library') || '');
            return;
        }

        const openMatch = url.pathname.match(/^\/v1\/items\/([A-Za-z0-9_-]{1,128})\/open$/);
        if (request.method === 'POST' && openMatch) {
            await this.openItem(request, response, client, openMatch[1]);
            return;
        }

        this.json(response, 404, { ok: false, error: '不存在的伴侣端点' });
    }

    async pair(request, response) {
        const now = Date.now();
        this.pairFailures = this.pairFailures.filter((stamp) => now - stamp < 60 * 1000);
        if (this.pairFailures.length >= 5) {
            this.json(response, 429, { ok: false, error: '配对尝试过多，请等待 1 分钟后再试' });
            return;
        }

        const body = await readJson(request);
        const code = stringField(body, 'code');
        const vaultName = stringField(body, 'vaultName').slice(0, 128);
        const libraryKey = stringField(body, 'libraryKey');

        if (!/^\d{6}$/.test(code) || code !== this.pairCode || Date.now() > this.pairCodeExpiresAt) {
            this.pairFailures.push(now);
            this.json(response, 403, { ok: false, error: '配对码无效或已过期' });
            return;
        }
        if (!vaultName || !IDENTITY.test(libraryKey)) {
            this.json(response, 400, { ok: false, error: '配对参数无效' });
            return;
        }

        const currentLibraryPath = libraryPath();
        if (!currentLibraryPath) {
            this.json(response, 409, { ok: false, error: 'Eagle 当前没有打开可配对的资源库' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const clients = this.clients().filter((item) => !(item.vaultName === vaultName && item.libraryKey === libraryKey));

        clients.push({
            token,
            vaultName,
            libraryKey,
            libraryPath: currentLibraryPath,
            libraryName: libraryName(),
            pairedAt: Date.now(),
        });
        this.saveClients(clients);
        this.pairFailures = [];
        this.refreshPairCode();
        this.render();
        this.json(response, 200, {
            ok: true,
            token,
            version: this.version,
            libraryName: libraryName(),
            libraryMatched: true,
        });
    }

    status(client, requestedLibraryKey) {
        const libraryMatched = requestedLibraryKey === client.libraryKey && samePath(client.libraryPath, libraryPath());

        return {
            ok: true,
            version: this.version,
            libraryName: libraryName(),
            libraryMatched,
        };
    }

    async importItem(request, response, client) {
        const body = await readJson(request);
        const libraryKey = stringField(body, 'libraryKey');
        const filePath = stringField(body, 'filePath');
        const name = stringField(body, 'name').slice(0, 255) || path.basename(filePath);
        const folderId = stringField(body, 'folderId');

        if (!this.ensureLibrary(response, client, libraryKey)) return;
        if (!filePath || filePath.length > 4096 || !isRegularFile(filePath)) {
            this.json(response, 400, { ok: false, error: '待导入的本机文件不存在' });
            return;
        }
        if (folderId && !IDENTITY.test(folderId)) {
            this.json(response, 400, { ok: false, error: 'Eagle 文件夹 ID 格式无效' });
            return;
        }

        const options = { name };
        if (folderId) options.folders = [folderId];

        const itemId = await eagle.item.addFromPath(filePath, options);
        if (typeof itemId !== 'string' || !IDENTITY.test(itemId)) throw new Error('Eagle 没有返回有效项目 ID');

        this.json(response, 200, { ok: true, itemId, name });
    }

    async sendContent(request, response, client, itemId, libraryKey) {
        if (!this.ensureLibrary(response, client, libraryKey)) return;

        const item = await eagle.item.getById(itemId);
        if (!item || item.isDeleted || !item.filePath || !isRegularFile(item.filePath)) {
            this.json(response, 404, { ok: false, error: 'Eagle 中找不到这个附件' });
            return;
        }

        const stat = fs.statSync(item.filePath);
        const range = parseRange(request.headers.range, stat.size);
        const start = range ? range.start : 0;
        const end = range ? range.end : stat.size - 1;

        response.statusCode = range ? 206 : 200;
        response.setHeader('Content-Type', contentType(item.filePath));
        response.setHeader('Accept-Ranges', 'bytes');
        response.setHeader('Content-Length', Math.max(0, end - start + 1));
        if (range) response.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);

        if (stat.size === 0) {
            response.end();
            return;
        }

        fs.createReadStream(item.filePath, { start, end })
            .on('error', () => response.destroy())
            .pipe(response);
    }

    async openItem(request, response, client, itemId) {
        const body = await readJson(request);
        const libraryKey = stringField(body, 'libraryKey');

        if (!this.ensureLibrary(response, client, libraryKey)) return;

        const result = await eagle.item.open(itemId);
        if (result === false) throw new Error('Eagle 无法打开这个项目');

        this.json(response, 200, { ok: true });
    }

    ensureLibrary(response, client, libraryKey) {
        if (libraryKey === client.libraryKey && samePath(client.libraryPath, libraryPath())) return true;

        this.json(response, 409, { ok: false, error: 'Eagle 当前资源库与配对时不同，请重新配对' });
        return false;
    }

    authorize(request) {
        const token = typeof request.headers['x-ziminos-token'] === 'string'
            ? request.headers['x-ziminos-token']
            : '';

        if (!token) return null;

        return this.clients().find((client) => safeEqual(client.token, token)) || null;
    }

    json(response, status, body) {
        const payload = Buffer.from(JSON.stringify(body));
        response.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': payload.length,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        });
        response.end(payload);
    }

    clients() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.filter(validClient) : [];
        } catch {
            return [];
        }
    }

    saveClients(clients) {
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }

    port() {
        const value = Number(localStorage.getItem(PORT_KEY));
        return validPort(value) ? value : DEFAULT_PORT;
    }

    refreshPairCode() {
        this.pairCode = String(crypto.randomInt(100000, 1000000));
        this.pairCodeExpiresAt = Date.now() + CODE_TTL_MS;
        this.pairFailures = [];
    }

    bindUi() {
        document.getElementById('refresh-code').addEventListener('click', () => {
            this.refreshPairCode();
            this.render();
        });
        document.getElementById('save-port').addEventListener('click', async () => {
            const port = Number(document.getElementById('port').value);
            if (!validPort(port)) {
                this.setRuntimeStatus('端口必须是 1024–65535 之间的整数');
                return;
            }
            try {
                await this.listen(port);
                localStorage.setItem(PORT_KEY, String(port));
            } catch {
                // listen 已经把原因画到状态行
            }
            this.render();
        });
    }

    async refreshSelection() {
        try {
            const selected = await eagle.item.getSelected();
            this.selectedItem = selected[0] || null;
        } catch {
            this.selectedItem = null;
        }
    }

    render() {
        document.getElementById('pair-code').textContent = this.pairCode;
        document.getElementById('port').value = String(this.port());

        const clientsEl = document.getElementById('clients');
        const clients = this.clients();
        clientsEl.replaceChildren();
        if (!clients.length) clientsEl.append(empty('还没有已配对的笔记库。'));

        for (const client of clients) {
            const row = document.createElement('div');
            row.className = 'client';
            const label = document.createElement('div');
            const strong = document.createElement('strong');
            strong.textContent = client.vaultName;
            const small = document.createElement('small');
            small.textContent = `${client.libraryName}${samePath(client.libraryPath, libraryPath()) ? '' : ' · 需重新配对'}`;
            label.append(strong, small);
            const remove = document.createElement('button');
            remove.textContent = '移除';
            remove.addEventListener('click', () => {
                this.saveClients(this.clients().filter((item) => item.token !== client.token));
                this.render();
            });
            row.append(label, remove);
            clientsEl.append(row);
        }

        const selection = document.getElementById('selection');
        const buttons = document.getElementById('open-vaults');
        buttons.replaceChildren();
        selection.textContent = this.selectedItem
            ? `已选中：${this.selectedItem.name || this.selectedItem.id}`
            : '在 Eagle 里选中一个附件，再打开本伴侣。';

        if (this.selectedItem) {
            for (const client of clients.filter((item) => samePath(item.libraryPath, libraryPath()))) {
                const button = document.createElement('button');
                button.textContent = `在 Obsidian「${client.vaultName}」中查找引用`;
                button.addEventListener('click', () => {
                    const uri = `obsidian://search?vault=${encodeURIComponent(client.vaultName)}&query=${encodeURIComponent(this.selectedItem.id)}`;
                    void eagle.shell.openExternal(uri);
                });
                buttons.append(button);
            }
        }
    }

    setRuntimeStatus(message) {
        document.getElementById('runtime-status').textContent = message;
    }

    async stop() {
        await this.closeServer();
    }

    closeServer() {
        if (!this.server) return Promise.resolve();

        const server = this.server;
        this.server = null;

        return closeHttpServer(server);
    }
}

function closeHttpServer(server) {
    return new Promise((resolve) => server.close(() => resolve()));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        request.on('data', (chunk) => {
            size += chunk.length;
            if (size > BODY_LIMIT) {
                reject(new Error('请求体过大'));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => {
            try {
                const value = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                resolve(isRecord(value) ? value : {});
            } catch {
                reject(new Error('JSON 请求格式无效'));
            }
        });
        request.on('error', reject);
    });
}

function parseRange(value, size) {
    if (!value) return null;
    const match = /^bytes=(\d+)-(\d*)$/.exec(value);
    if (!match) return null;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= size) return null;
    return { start, end };
}

function contentType(filePath) {
    const types = {
        avif: 'image/avif', bmp: 'image/bmp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
        ico: 'image/x-icon', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml',
        tif: 'image/tiff', tiff: 'image/tiff', webp: 'image/webp', pdf: 'application/pdf',
        mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm',
        txt: 'text/plain; charset=utf-8', md: 'text/markdown; charset=utf-8', json: 'application/json',
    };
    return types[path.extname(filePath).slice(1).toLowerCase()] || 'application/octet-stream';
}

function validClient(value) {
    return isRecord(value) && typeof value.token === 'string' && /^[a-f0-9]{64}$/.test(value.token) &&
        typeof value.vaultName === 'string' && value.vaultName.length > 0 && value.vaultName.length <= 128 &&
        typeof value.libraryKey === 'string' && IDENTITY.test(value.libraryKey) &&
        typeof value.libraryPath === 'string' && value.libraryPath.length > 0 &&
        typeof value.libraryName === 'string';
}

function safeEqual(left, right) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function samePath(left, right) {
    const normalize = (value) => path.resolve(value || '').replace(/[\\/]+$/, '');
    const a = normalize(left);
    const b = normalize(right);
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function validPort(value) {
    return Number.isInteger(value) && value >= PORT_MIN && value <= PORT_MAX;
}

/** application/json 会触发浏览器 CORS 预检；不接受 text/plain，避免网页发出简单跨站写请求 */
function isJsonRequest(request) {
    const value = typeof request.headers['content-type'] === 'string'
        ? request.headers['content-type'].toLowerCase()
        : '';

    return value.startsWith('application/json');
}

function isRegularFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch {
        return false;
    }
}

function libraryPath() { return String(eagle.library.path || ''); }
function libraryName() { return String(eagle.library.name || '未命名资源库'); }
function stringField(value, key) { return typeof value[key] === 'string' ? value[key].trim() : ''; }
function isRecord(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function safeMessage(error) { return error instanceof Error ? error.message : String(error); }
function empty(text) {
    const element = document.createElement('p');
    element.className = 'empty';
    element.textContent = text;
    return element;
}

if (typeof module !== 'undefined') module.exports = { BridgeService };

if (typeof eagle !== 'undefined') {
    const bridge = new BridgeService();

    eagle.onPluginCreate((plugin) => void bridge.start(plugin?.manifest?.version));
    eagle.onPluginRun(() => void bridge.refreshSelection().then(() => bridge.render()));
    eagle.onPluginShow(() => void bridge.refreshSelection().then(() => bridge.render()));
    eagle.onLibraryChanged(() => void bridge.refreshSelection().then(() => bridge.render()));
    eagle.onPluginBeforeExit(() => void bridge.stop());
}
