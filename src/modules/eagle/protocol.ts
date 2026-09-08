/**
 * [INPUT]: 依赖 core/device 的 Eagle 端口默认值/范围，不依赖 Obsidian 或 Eagle 运行时
 * [OUTPUT]: 对外提供 EagleReference 契约、稳定 URI 的构建/解析、Markdown 附件链接生成与图片判定
 * [POS]: Eagle 模块的协议事实层。笔记只记 libraryKey + itemId，端口、路径与文件夹一概不进 Markdown；
 *        因此在 Eagle 库内移动附件时链接天然不变，这个文件就是两个运行时共同遵守的身份语法
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { EAGLE_DEFAULTS, EAGLE_PORT_RANGE } from '../../core/device';

export const EAGLE_LIBRARY_KEY = 'primary';
export const EAGLE_DEFAULT_PORT = EAGLE_DEFAULTS.port;
export const EAGLE_SCHEME_PREFIX = 'ziminos-eagle://v1/';

export interface EagleReference {
    readonly libraryKey: string;
    readonly itemId: string;
}

const IDENTITY_PART = /^[A-Za-z0-9_-]{1,128}$/;
const IMAGE_EXTENSIONS = new Set([
    'avif', 'bmp', 'gif', 'heic', 'heif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp',
]);

/** 端口是设备层配置；损坏或手改值只回落，不让它进入请求 URL */
export function normalizeEaglePort(value: unknown): number {
    return typeof value === 'number' && Number.isInteger(value) &&
        value >= EAGLE_PORT_RANGE.min && value <= EAGLE_PORT_RANGE.max
        ? value
        : EAGLE_DEFAULT_PORT;
}

/** 链接恒为身份链接，不携带可变的 Eagle 文件系统路径 */
export function buildEagleUri(reference: EagleReference): string {
    assertIdentity(reference.libraryKey, '资源库标识');
    assertIdentity(reference.itemId, 'Eagle 项目 ID');

    return `${EAGLE_SCHEME_PREFIX}${reference.libraryKey}/${reference.itemId}`;
}

/** 只认当前 v1 语法；未来升协议时不会静默把新格式当旧格式读 */
export function parseEagleUri(value: string | null | undefined): EagleReference | null {
    if (!value?.startsWith(EAGLE_SCHEME_PREFIX)) return null;

    const rest = value.slice(EAGLE_SCHEME_PREFIX.length);
    const parts = rest.split('/');

    if (parts.length !== 2) return null;
    if (!IDENTITY_PART.test(parts[0]) || !IDENTITY_PART.test(parts[1])) return null;

    return { libraryKey: parts[0], itemId: parts[1] };
}

/** 图片保留 Markdown 嵌入语义，其余附件生成可点击的普通链接 */
export function buildEagleMarkdown(
    reference: EagleReference,
    fileName: string,
    mimeType: string,
): string {
    const label = escapeMarkdownLabel(fileName.trim() || '附件');
    const prefix = isImageAttachment(fileName, mimeType) ? '!' : '';

    return `${prefix}[${label}](${buildEagleUri(reference)})`;
}

export function isImageAttachment(fileName: string, mimeType: string): boolean {
    if (mimeType.toLowerCase().startsWith('image/')) return true;

    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

    return IMAGE_EXTENSIONS.has(extension);
}

function escapeMarkdownLabel(value: string): string {
    return value.replace(/([\\[\]])/g, '\\$1').replace(/[\r\n]+/g, ' ');
}

function assertIdentity(value: string, name: string): void {
    if (!IDENTITY_PART.test(value)) throw new Error(`${name}格式无效`);
}
