/**
 * [INPUT]: 依赖 core/device 的 Eagle 端口默认值/范围，不依赖 Obsidian 或 Eagle 运行时
 * [OUTPUT]: 对外提供 EagleReference 契约、稳定 URI 的构建/严格解析/文本命中、Eagle 原生项目深链、Markdown 附件链接生成与图片判定
 * [POS]: Eagle 模块的协议事实层。笔记只记 libraryKey + itemId，端口、路径与文件夹一概不进 Markdown；
 *        因此在 Eagle 库内移动附件时链接天然不变，这个文件就是两个运行时共同遵守的身份语法
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { EAGLE_DEFAULTS, EAGLE_PORT_RANGE } from '../../core/device';

export const EAGLE_LIBRARY_KEY = 'primary';
export const EAGLE_DEFAULT_PORT = EAGLE_DEFAULTS.port;
export const EAGLE_SCHEME_PREFIX = 'ziminos-eagle://v1/';
export const EAGLE_NATIVE_ITEM_PREFIX = 'eagle://item/';

export interface EagleReference {
    readonly libraryKey: string;
    readonly itemId: string;
}

const IDENTITY_PART = /^[A-Za-z0-9_-]{1,128}$/;
const URI_HEAD_CHAR = /[A-Za-z0-9_+./:-]/;
const URI_TAIL_CHAR = /[A-Za-z0-9_\-/?#]/;
const EAGLE_URI_SOURCE = 'ziminos-eagle:\\/\\/v1\\/[A-Za-z0-9_-]{1,128}\\/[A-Za-z0-9_-]{1,128}';
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

/**
 * 仅作为伴侣不在线时的启动出口：交给操作系统唤起 Eagle 并定位这个 itemId。
 * 笔记仍只保存 ziminOS 身份 URI，不把这个设备级启动链接写回 Markdown。
 */
export function buildEagleNativeItemUri(reference: EagleReference): string {
    assertIdentity(reference.itemId, 'Eagle 项目 ID');

    return `${EAGLE_NATIVE_ITEM_PREFIX}${reference.itemId}`;
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

/**
 * 在一行 Markdown / YAML 里找到鼠标指向的 Eagle 身份。
 *
 * CodeMirror 的实时预览会把 `[label](uri)` 折成只看得见 label 的编辑控件，
 * 因此命中区域必须扩到整段 Markdown 链接，不能只检查 URI 字符本身。
 */
export function eagleReferenceAtText(value: string, offset: number): EagleReference | null {
    if (!Number.isInteger(offset) || offset < 0 || offset > value.length) return null;

    for (const match of eagleUriMatches(value)) {
        const range = interactiveRange(value, match.from, match.to);

        if (offset >= range.from && offset < range.to) return match.reference;
    }

    return null;
}

/** 属性控件不暴露 Markdown 锚点；只有文本中唯一一条身份时才允许从值反解。 */
export function singleEagleReferenceInText(value: string): EagleReference | null {
    const matches = eagleUriMatches(value);

    return matches.length === 1 ? matches[0].reference : null;
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

interface EagleUriMatch {
    readonly reference: EagleReference;
    readonly from: number;
    readonly to: number;
}

function eagleUriMatches(value: string): EagleUriMatch[] {
    const matches: EagleUriMatch[] = [];
    const pattern = new RegExp(EAGLE_URI_SOURCE, 'g');
    let result: RegExpExecArray | null;

    while ((result = pattern.exec(value)) !== null) {
        const uri = result[0];
        const from = result.index;
        const to = from + uri.length;
        const before = value[from - 1] ?? '';
        const after = value[to] ?? '';

        // 拒绝从更长的身份或带路径/查询的伪 URI 中截出一段“看似合法”的前缀。
        if ((before && URI_HEAD_CHAR.test(before)) || (after && URI_TAIL_CHAR.test(after))) continue;

        const reference = parseEagleUri(uri);

        if (reference) matches.push({ reference, from, to });
    }

    return matches;
}

function interactiveRange(value: string, uriFrom: number, uriTo: number): { from: number; to: number } {
    if (value[uriFrom - 1] === '<' && value[uriTo] === '>') {
        return { from: uriFrom - 1, to: uriTo + 1 };
    }

    if (value[uriFrom - 1] !== '(' || value[uriTo] !== ')' || value[uriFrom - 2] !== ']') {
        return { from: uriFrom, to: uriTo };
    }

    const labelStart = previousUnescaped(value, '[', uriFrom - 2);

    if (labelStart < 0) return { from: uriFrom, to: uriTo };

    return {
        from: value[labelStart - 1] === '!' ? labelStart - 1 : labelStart,
        to: uriTo + 1,
    };
}

function previousUnescaped(value: string, needle: string, before: number): number {
    for (let index = before - 1; index >= 0; index -= 1) {
        if (value[index] !== needle) continue;

        let slashes = 0;
        for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) slashes += 1;
        if (slashes % 2 === 0) return index;
    }

    return -1;
}

function assertIdentity(value: string, name: string): void {
    if (!IDENTITY_PART.test(value)) throw new Error(`${name}格式无效`);
}
