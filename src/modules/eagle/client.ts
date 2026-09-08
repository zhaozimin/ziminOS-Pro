/**
 * [INPUT]: 依赖 obsidian/requestUrl 访问仅回环监听的 Eagle 伴侣，依赖 core/types 的 ZiminosContext 与本模块 protocol
 * [OUTPUT]: 对外提供 EagleBridgeClient，封装配对、状态、导入、内容读取、Eagle 打开与本机令牌生命周期
 * [POS]: Obsidian 半边唯一的 HTTP 出境口。认证令牌只进 Obsidian SecretStorage，不进 data.json、笔记或日志；
 *        上层只看业务结果，不自行拼端口、请求头或错误语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requestUrl } from 'obsidian';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';
import type { ZiminosContext } from '../../core/types';
import { EAGLE_LIBRARY_KEY, normalizeEaglePort } from './protocol';
import type { EagleReference } from './protocol';

export interface EagleBridgeStatus {
    readonly version: string;
    readonly libraryName: string;
    readonly libraryMatched: boolean;
}

export interface ImportedEagleItem {
    readonly itemId: string;
    readonly name: string;
}

export interface EagleItemContent {
    readonly bytes: ArrayBuffer;
    readonly contentType: string;
}

type JsonRecord = Record<string, unknown>;

/** SecretStorage 要求小写字母、数字与连字符；它自身已按当前 vault 隔离，不把库名再拼进键。 */
const EAGLE_TOKEN_SECRET_ID = 'ziminos-eagle-auth-primary';

export class EagleBridgeClient {
    private readonly ctx: ZiminosContext;

    constructor(ctx: ZiminosContext) {
        this.ctx = ctx;
    }

    hasToken(): boolean {
        return this.readToken().length > 0;
    }

    async pair(code: string): Promise<EagleBridgeStatus> {
        const result = await this.requestJson({
            url: `${this.baseUrl()}/v1/pair`,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({
                code,
                vaultName: this.ctx.app.vault.getName(),
                libraryKey: this.libraryKey(),
            }),
        }, false);
        const token = stringField(result, 'token');

        if (!token) throw new Error('伴侣没有返回配对令牌');

        this.writeToken(token);

        return statusFrom(result);
    }

    async status(): Promise<EagleBridgeStatus> {
        return statusFrom(await this.requestJson({
            url: `${this.baseUrl()}/v1/status?library=${encodeURIComponent(this.libraryKey())}`,
            method: 'GET',
        }));
    }

    async importFile(filePath: string, name: string): Promise<ImportedEagleItem> {
        const result = await this.requestJson({
            url: `${this.baseUrl()}/v1/import`,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({
                libraryKey: this.libraryKey(),
                filePath,
                name,
                folderId: this.ctx.settings.eagleFolderId.trim(),
            }),
        });
        const itemId = stringField(result, 'itemId');

        if (!itemId) throw new Error('Eagle 没有返回项目 ID');

        return { itemId, name: stringField(result, 'name') || name };
    }

    async content(reference: EagleReference): Promise<EagleItemContent> {
        const response = await this.request({
            url: `${this.baseUrl()}/v1/items/${encodeURIComponent(reference.itemId)}/content?library=${encodeURIComponent(reference.libraryKey)}`,
            method: 'GET',
        });

        if (response.status < 200 || response.status >= 300) throw responseError(response);

        return {
            bytes: response.arrayBuffer,
            contentType: header(response.headers, 'content-type') || 'application/octet-stream',
        };
    }

    async open(reference: EagleReference): Promise<void> {
        await this.requestJson({
            url: `${this.baseUrl()}/v1/items/${encodeURIComponent(reference.itemId)}/open`,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ libraryKey: reference.libraryKey }),
        });
    }

    /** 返回 Eagle 端是否也已撤销；离线时仍清本机凭据，但不能伪称远端授权已删除。 */
    async disconnect(): Promise<boolean> {
        let revokedRemotely = !this.hasToken();

        try {
            if (!revokedRemotely) {
                await this.requestJson({
                    url: `${this.baseUrl()}/v1/disconnect`,
                    method: 'POST',
                    contentType: 'application/json',
                    body: '{}',
                });
                revokedRemotely = true;
            }
        } catch {
            // 伴侣不在线时仍要把 Obsidian 这头的凭据撤掉；Eagle 中可再手动移除旧客户
        }

        // SecretStorage 没有 delete；空串就是本插件的「未配对」。
        this.ctx.app.secretStorage.setSecret(EAGLE_TOKEN_SECRET_ID, '');

        return revokedRemotely;
    }

    private async requestJson(param: RequestUrlParam, authenticated = true): Promise<JsonRecord> {
        const response = await this.request(param, authenticated);
        const data = isRecord(response.json) ? response.json : {};

        if (response.status < 200 || response.status >= 300 || data.ok !== true) {
            throw responseError(response, data);
        }

        return data;
    }

    private async request(param: RequestUrlParam, authenticated = true): Promise<RequestUrlResponse> {
        const headers = { ...(param.headers ?? {}) };

        if (authenticated) {
            const token = this.readToken();

            if (!token) throw new Error('尚未与 Eagle 伴侣配对');
            headers['X-Ziminos-Token'] = token;
        }

        try {
            return await requestUrl({ ...param, headers, throw: false });
        } catch {
            throw new Error(`连不上 Eagle 伴侣（本机端口 ${normalizeEaglePort(this.ctx.settings.eaglePort)}）`);
        }
    }

    private baseUrl(): string {
        return `http://127.0.0.1:${normalizeEaglePort(this.ctx.settings.eaglePort)}`;
    }

    private libraryKey(): string {
        return EAGLE_LIBRARY_KEY;
    }

    private readToken(): string {
        return this.ctx.app.secretStorage.getSecret(EAGLE_TOKEN_SECRET_ID)?.trim() ?? '';
    }

    private writeToken(token: string): void {
        this.ctx.app.secretStorage.setSecret(EAGLE_TOKEN_SECRET_ID, token);
    }
}

function statusFrom(data: JsonRecord): EagleBridgeStatus {
    return {
        version: stringField(data, 'version') || '未知',
        libraryName: stringField(data, 'libraryName') || '未命名资源库',
        libraryMatched: data.libraryMatched === true,
    };
}

function responseError(response: RequestUrlResponse, data?: JsonRecord): Error {
    const parsed = data ?? (isRecord(response.json) ? response.json : {});
    const message = stringField(parsed, 'error') || stringField(parsed, 'message');

    return new Error(message || `Eagle 伴侣返回 ${response.status}`);
}

function header(headers: Record<string, string>, name: string): string {
    const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());

    return found?.[1] ?? '';
}

function stringField(record: JsonRecord, key: string): string {
    return typeof record[key] === 'string' ? record[key].trim() : '';
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
