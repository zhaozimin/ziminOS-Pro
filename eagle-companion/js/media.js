/**
 * [INPUT]: 依赖 Eagle 官方 item API、Node 16 内建 fs/path/crypto，并由 service.js 注入配对客户与资源库校验能力
 * [OUTPUT]: 对外提供 EagleMediaSessions，以单附件高熵票据流式输出图片与视频，并支持 HTTP Range、HEAD 与主动撤销
 * [POS]: Eagle 伴侣的媒体边界；service.js 掌管路由和身份，本文件掌管短寿命会话与字节流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

(function exposeMediaSessions(root, factory) {
    'use strict';

    const api = factory();
    root.ZiminosEagleMedia = api;
    if (typeof module !== 'undefined') module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
    'use strict';

    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
    const SESSION_LIMIT = 256;

    class EagleMediaSessions {
        constructor(dependencies) {
            this.dependencies = dependencies;
            this.sessions = new Map();
        }

        async sendContent(request, response, client, itemId, libraryKey) {
            if (!this.dependencies.ensureLibrary(response, client, libraryKey)) return;

            const item = await eagle.item.getById(itemId);
            this.dependencies.assertLibrary(client, libraryKey);
            if (!this.validItem(item)) {
                this.dependencies.json(response, 404, { ok: false, error: 'Eagle 中找不到这个附件' });
                return;
            }

            this.streamFile(request, response, item.filePath);
        }

        async create(request, response, client, itemId) {
            const body = await this.dependencies.readJson(request);
            const libraryKey = stringField(body, 'libraryKey');

            if (!this.dependencies.ensureLibrary(response, client, libraryKey)) return;

            const item = await eagle.item.getById(itemId);
            this.dependencies.assertLibrary(client, libraryKey);
            if (!this.validItem(item)) {
                this.dependencies.json(response, 404, { ok: false, error: 'Eagle 中找不到这个附件' });
                return;
            }

            const type = contentType(item.filePath);
            const kind = mediaKind(type);
            const stat = fs.statSync(item.filePath);
            let sessionId = '';

            if (kind !== 'file') {
                this.prune();
                while (this.sessions.size >= SESSION_LIMIT) {
                    this.sessions.delete(this.sessions.keys().next().value);
                }
                sessionId = crypto.randomBytes(32).toString('hex');
                this.sessions.set(sessionId, {
                    clientToken: client.token,
                    libraryKey,
                    libraryPath: client.libraryPath,
                    itemId,
                    expiresAt: Date.now() + SESSION_TTL_MS,
                });
            }

            this.dependencies.json(response, 200, {
                ok: true,
                kind,
                name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : path.basename(item.filePath),
                contentType: type,
                size: stat.size,
                sessionId,
            });
        }

        async send(request, response, sessionId) {
            this.prune();
            const session = this.sessions.get(sessionId);

            if (!session) {
                this.dependencies.json(response, 404, { ok: false, error: '媒体会话已失效，请重新打开笔记' });
                return;
            }

            const client = this.dependencies.clients().find((entry) => entry.token === session.clientToken);
            const currentLibraryPath = this.dependencies.libraryPath();
            if (!client || client.libraryKey !== session.libraryKey ||
                !this.dependencies.samePath(client.libraryPath, session.libraryPath) ||
                !this.dependencies.samePath(session.libraryPath, currentLibraryPath)) {
                this.sessions.delete(sessionId);
                this.dependencies.json(response, 409, { ok: false, error: 'Eagle 当前资源库与媒体会话不同，请重新配对' });
                return;
            }

            const item = await eagle.item.getById(session.itemId);
            this.dependencies.assertLibrary(client, session.libraryKey);
            if (!this.validItem(item)) {
                this.sessions.delete(sessionId);
                this.dependencies.json(response, 404, { ok: false, error: 'Eagle 中找不到这个附件' });
                return;
            }

            session.expiresAt = Date.now() + SESSION_TTL_MS;
            this.streamFile(request, response, item.filePath);
        }

        revoke(response, client, sessionId) {
            const session = this.sessions.get(sessionId);

            if (session && session.clientToken !== client.token) {
                this.dependencies.json(response, 403, { ok: false, error: '媒体会话不属于当前笔记库' });
                return;
            }

            this.sessions.delete(sessionId);
            this.dependencies.json(response, 200, { ok: true });
        }

        revokeClient(clientToken) {
            for (const [sessionId, session] of this.sessions) {
                if (session.clientToken === clientToken) this.sessions.delete(sessionId);
            }
        }

        clear() {
            this.sessions.clear();
        }

        prune() {
            const now = Date.now();

            for (const [sessionId, session] of this.sessions) {
                if (session.expiresAt <= now) this.sessions.delete(sessionId);
            }
        }

        validItem(item) {
            return item && !item.isDeleted && item.filePath && this.dependencies.isRegularFile(item.filePath);
        }

        streamFile(request, response, filePath) {
            const stat = fs.statSync(filePath);
            const requestedRange = typeof request.headers.range === 'string' ? request.headers.range : '';
            const range = parseRange(requestedRange, stat.size);

            if (requestedRange && !range) {
                response.writeHead(416, {
                    'Content-Range': `bytes */${stat.size}`,
                    'Cache-Control': 'no-store',
                    'X-Content-Type-Options': 'nosniff',
                });
                response.end();
                return;
            }

            const start = range ? range.start : 0;
            const end = range ? range.end : stat.size - 1;

            response.statusCode = range ? 206 : 200;
            response.setHeader('Content-Type', contentType(filePath));
            response.setHeader('Accept-Ranges', 'bytes');
            response.setHeader('Cache-Control', 'no-store');
            response.setHeader('X-Content-Type-Options', 'nosniff');
            response.setHeader('Content-Length', Math.max(0, end - start + 1));
            if (range) response.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);

            if (request.method === 'HEAD' || stat.size === 0) {
                response.end();
                return;
            }

            fs.createReadStream(filePath, { start, end })
                .on('error', () => response.destroy())
                .pipe(response);
        }
    }

    function parseRange(value, size) {
        if (!value) return null;
        const match = /^bytes=(\d*)-(\d*)$/.exec(value);
        if (!match || (!match[1] && !match[2])) return null;

        if (!match[1]) {
            const suffixLength = Number(match[2]);
            if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0 || size <= 0) return null;
            return { start: Math.max(0, size - suffixLength), end: size - 1 };
        }

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
            mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', m4v: 'video/x-m4v', mov: 'video/quicktime',
            mp4: 'video/mp4', ogv: 'video/ogg', webm: 'video/webm',
            txt: 'text/plain; charset=utf-8', md: 'text/markdown; charset=utf-8', json: 'application/json',
        };
        return types[path.extname(filePath).slice(1).toLowerCase()] || 'application/octet-stream';
    }

    function mediaKind(type) {
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        return 'file';
    }

    function stringField(value, key) {
        return typeof value[key] === 'string' ? value[key].trim() : '';
    }

    return { EagleMediaSessions };
}));
