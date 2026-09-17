/**
 * [INPUT]: 依赖 Eagle 官方 plugin API 的 app/library/item/folder/shell 与生命周期事件，依赖 Node 16 内建 http/fs/path/crypto
 * [OUTPUT]: 在 127.0.0.1 提供配对、按 Obsidian 容器建“项目/容器名”或单层“日记”目录并导入、内容读取与附件当前文件夹打开/主窗口唤起 API，并提供 Eagle → Obsidian 反向搜索界面
 * [POS]: 两端架构的 Eagle 执行边界。它只调官方 item/folder API，不修改 metadata.json；服务只绑定回环，
 *        变更/读取端点验令牌与已配对资源库；队列及异步 API 返回后重验库身份，防止处理中切库让后续操作越界
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
const PROJECT_ROOT_NAME = '项目';
const DIARY_ROOT_NAME = '日记';
const IDENTITY = /^[A-Za-z0-9_-]{1,128}$/;

class BridgeConflictError extends Error {}

class BridgeService {
    constructor() {
        this.server = null;
        this.version = '未知';
        this.pairCode = '';
        this.pairCodeExpiresAt = 0;
        this.pairFailures = [];
        this.selectedItem = null;
        // 所有建目录操作串行化：并发上传时也只能有一个请求创建“项目”或“日记”根目录。
        this.folderOperation = Promise.resolve();
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
                const status = error instanceof BridgeConflictError ? 409 : 500;

                if (!response.headersSent) this.json(response, status, { ok: false, error: safeMessage(error) });
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
            await this.importItem(request, response, client, 'fixed');
            return;
        }

        if (request.method === 'POST' && url.pathname === '/v1/projects/import') {
            await this.importItem(request, response, client, 'project');
            return;
        }

        if (request.method === 'POST' && url.pathname === '/v1/diary/import') {
            await this.importItem(request, response, client, 'diary');
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

    async importItem(request, response, client, routing) {
        const body = await readJson(request);
        const libraryKey = stringField(body, 'libraryKey');
        // 文件路径是身份，尾部空格在 macOS 上合法；trim 会让两个不同文件变成同一个导入源。
        const filePath = typeof body.filePath === 'string' ? body.filePath : '';
        const name = stringField(body, 'name').slice(0, 255) || path.basename(filePath);
        const folderId = stringField(body, 'folderId');
        const projectRouting = routing === 'project';
        const diaryRouting = routing === 'diary';
        const projectName = projectRouting && typeof body.projectName === 'string' ? body.projectName : '';

        if (!this.ensureLibrary(response, client, libraryKey)) return;
        if (!filePath || filePath.length > 4096 || !isRegularFile(filePath)) {
            this.json(response, 400, { ok: false, error: '待导入的本机文件不存在' });
            return;
        }
        if (projectRouting && typeof body.projectName !== 'string') {
            this.json(response, 400, { ok: false, error: 'Obsidian 项目名称格式无效' });
            return;
        }
        if (projectRouting && !validFolderName(projectName)) {
            this.json(response, 400, { ok: false, error: 'Obsidian 项目名称不能作为 Eagle 文件夹名' });
            return;
        }
        if (routing === 'fixed' && folderId && !IDENTITY.test(folderId)) {
            this.json(response, 400, { ok: false, error: 'Eagle 文件夹 ID 格式无效' });
            return;
        }

        const assertLibrary = () => this.assertLibrary(client, libraryKey);
        const options = { name };
        const routedFolderId = projectRouting
            ? await this.ensureRoutedFolder(PROJECT_ROOT_NAME, projectName, assertLibrary)
            : diaryRouting
                ? await this.ensureRoutedFolder(DIARY_ROOT_NAME, '', assertLibrary)
                : '';
        const targetFolderId = routedFolderId || folderId;

        if (targetFolderId) options.folders = [targetFolderId];

        assertLibrary();
        const itemId = await eagle.item.addFromPath(filePath, options);
        assertLibrary();
        if (typeof itemId !== 'string' || !IDENTITY.test(itemId)) throw new Error('Eagle 没有返回有效项目 ID');

        this.json(response, 200, {
            ok: true,
            itemId,
            name,
            folderPath: projectRouting
                ? `${PROJECT_ROOT_NAME}/${projectName}`
                : diaryRouting ? DIARY_ROOT_NAME : '',
        });
    }

    /**
     * 分类文件夹是导入事务的一部分：只有准确取得“项目/容器名”或“日记”的 folderId 后才允许写附件。
     * 队列在成功与失败后都会恢复，单次 Eagle API 错误不能毒死后续导入。
     */
    ensureRoutedFolder(rootName, childName, assertLibrary) {
        const operation = this.folderOperation.then(() => createOrFindRoutedFolder(rootName, childName, assertLibrary));

        this.folderOperation = operation.then(() => undefined, () => undefined);

        return operation;
    }

    async sendContent(request, response, client, itemId, libraryKey) {
        if (!this.ensureLibrary(response, client, libraryKey)) return;

        const item = await eagle.item.getById(itemId);
        this.assertLibrary(client, libraryKey);
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

        const item = await eagle.item.getById(itemId);
        this.assertLibrary(client, libraryKey);
        if (!item || item.isDeleted) {
            this.json(response, 404, { ok: false, error: 'Eagle 中找不到这个附件' });
            return;
        }

        const folderId = firstItemFolderId(item);

        // 先恢复窗口，再切目录；原生 item 深链若作为旧版唤起兜底，也不会最后把界面改回“全部”。
        await showMainWindow(itemId, () => this.assertLibrary(client, libraryKey));
        this.assertLibrary(client, libraryKey);

        if (folderId) {
            if (typeof eagle.folder?.open !== 'function') {
                throw new Error('当前 Eagle 版本不支持打开附件文件夹，请升级到 4.0 Build 18 或更高');
            }

            await eagle.folder.open(folderId);
            this.assertLibrary(client, libraryKey);

            if (typeof eagle.item?.select !== 'function') {
                throw new Error('当前 Eagle 版本不支持选中附件，请升级到 4.0 Build 18 或更高');
            }

            const selected = await eagle.item.select([itemId]);
            this.assertLibrary(client, libraryKey);
            if (selected === false) throw new Error('Eagle 已打开附件文件夹，但无法选中这个附件');
        } else {
            // 未归类附件没有可打开的文件夹，只能沿用 Eagle 官方的“在全部中显示”。
            const result = await eagle.item.open(itemId);
            this.assertLibrary(client, libraryKey);
            if (result === false) throw new Error('Eagle 无法打开这个附件');
        }

        this.json(response, 200, { ok: true, openedIn: folderId ? 'folder' : 'all' });
    }

    ensureLibrary(response, client, libraryKey) {
        if (libraryKey === client.libraryKey && samePath(client.libraryPath, libraryPath())) return true;

        this.json(response, 409, { ok: false, error: 'Eagle 当前资源库与配对时不同，请重新配对' });
        return false;
    }

    assertLibrary(client, libraryKey) {
        if (libraryKey !== client.libraryKey || !samePath(client.libraryPath, libraryPath())) {
            throw new BridgeConflictError('Eagle 当前资源库与配对时不同，请重新配对');
        }
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

/**
 * 用官方 Folder API 创建或复用严格的一/两级目录。重名不是“随便挑一个”的理由：
 * 同级出现多个同名文件夹时中止导入，避免附件被无声分到错误容器。
 */
async function createOrFindRoutedFolder(rootName, childName, assertLibrary) {
    assertLibrary();
    if (typeof eagle.folder?.getAll !== 'function' ||
        typeof eagle.folder?.create !== 'function' ||
        typeof eagle.folder?.createSubfolder !== 'function') {
        throw new Error('当前 Eagle 版本不支持附件文件夹自动归档，请升级到 4.0 Build 18 或更高');
    }

    const all = flattenFolders(await eagle.folder.getAll());
    assertLibrary();
    const roots = all.filter((folder) => folder.name === rootName && !parentId(folder));

    if (roots.length > 1) {
        throw new BridgeConflictError(`Eagle 根目录存在多个同名“${rootName}”文件夹，请合并或改名后重试`);
    }

    const root = roots[0] || await eagle.folder.create({
        name: rootName,
        description: `由 ziminOS 自动归档 Obsidian ${rootName}附件`,
    });
    assertLibrary();

    assertFolder(root, `Eagle 没有返回有效的“${rootName}”根文件夹`);

    if (!childName) return root.id;

    const children = flattenFolders([root, ...all])
        .filter((folder) => parentId(folder) === root.id && folder.name === childName);

    if (children.length > 1) {
        throw new BridgeConflictError(`Eagle 的“${rootName}”下存在多个“${childName}”文件夹，请合并或改名后重试`);
    }

    const project = children[0] || await eagle.folder.createSubfolder(root.id, {
        name: childName,
        description: `Obsidian 容器：${childName}`,
    });
    assertLibrary();

    assertFolder(project, 'Eagle 没有返回有效的容器文件夹');

    return project.id;
}

/** getAll 在不同构建中可能给平铺表或带 children 的树；统一摊平并按 id 去重。 */
function flattenFolders(values) {
    const found = new Map();
    const visit = (folder) => {
        if (!folder || typeof folder !== 'object') return;
        if (typeof folder.id === 'string' && IDENTITY.test(folder.id)) found.set(folder.id, folder);
        if (Array.isArray(folder.children)) folder.children.forEach(visit);
    };

    if (Array.isArray(values)) values.forEach(visit);

    return Array.from(found.values());
}

function assertFolder(folder, message) {
    if (!folder || typeof folder !== 'object' || typeof folder.id !== 'string' || !IDENTITY.test(folder.id)) {
        throw new Error(message);
    }
}

function parentId(folder) {
    return typeof folder.parent === 'string' ? folder.parent : '';
}

/** Eagle 附件可属于多个文件夹；ziminOS 新导入时只有一个，手工多归属时按 Eagle 返回顺序取第一项。 */
function firstItemFolderId(item) {
    if (!Array.isArray(item.folders)) return '';

    return item.folders.find((folderId) => typeof folderId === 'string' && IDENTITY.test(folderId)) || '';
}

function validFolderName(value) {
    return value.length > 0 && value.length <= 255 && value.trim() === value && value !== '.' && value !== '..' &&
        !/[\/\\\u0000-\u001F\u007F]/.test(value);
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

async function showMainWindow(itemId, assertLibrary) {
    if (typeof eagle.app?.show === 'function') {
        try {
            const shown = await eagle.app.show();
            assertLibrary();

            if (shown !== false) return;
        } catch {
            // 新 API 存在但宿主拒绝唤起时，仍可用操作系统已注册的原生深链激活主窗口。
        }
    }

    assertLibrary();

    // Eagle 4.0 Build 12–17 还没有 app.show；原生项目深链同样会激活已运行的主窗口。
    if (typeof eagle.shell?.openExternal !== 'function') throw new Error('当前 Eagle 版本无法恢复主窗口，请升级到 4.0 Build 18 或更高');

    await eagle.shell.openExternal(`eagle://item/${encodeURIComponent(itemId)}`);
}
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
