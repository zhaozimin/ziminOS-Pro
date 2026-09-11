/**
 * [INPUT]: 依赖 obsidian 的 App/TFile 与公开的 vault.readBinary
 * [OUTPUT]: 对外提供 ResolvedLogo 契约、LOGO_EXTENSIONS 白名单、isLogoFile 与 resolveLogo
 * [POS]: 导出模块的标志层，回答的是一个很窄的问题：**库里那条路径，变成能直接嵌进纸里的那串字节**。
 *        它单独成文件的理由是时序：读文件是异步的，而装饰层必须是同步的——
 *        预览每帧重放一次装饰，一旦那条链上出现 await，帧与帧就会乱序，
 *        用户拖到一半会看见上一帧的水印盖在这一帧的排版上。
 *        于是解析被提前：路径变了才解一次，解出来的 ResolvedLogo 同步递给装饰层。
 *        它同时把图**降采样**到导出真正用得到的尺寸——一张 4000px 的原图编码成 data URI
 *        会让水印那一层的样式串膨胀到几 MB，而它最终只会被画成 80px 高
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile } from 'obsidian';
import type { App } from 'obsidian';

/** 一张已经可以直接嵌进纸里的标志 */
export interface ResolvedLogo {
    /** 解析自哪条库内路径。用于界面回显与缓存命中 */
    readonly path: string;
    /** 自包含的 data URI：既进得了 <img>，也进得了水印 SVG 里的 <image> */
    readonly dataUrl: string;
    /** 降采样之后的像素尺寸。调用方只用它求宽高比，不直接拿它当显示尺寸 */
    readonly width: number;
    readonly height: number;
}

/**
 * 认得的图片扩展名。
 *
 * 收成一张白名单而不是「凡是图片就行」，是因为它同时是选择弹窗的候选来源——
 * 一个 24MB 的 tiff 出现在候选里却渲染不出来，比它根本不出现更让人困惑。
 */
export const LOGO_EXTENSIONS: readonly string[] = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'];

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
};

/**
 * 降采样的长边上限。
 *
 * 288 是 320px（水印标志的上限）配上导出的 2× 清晰度之后还留一点余量的结果——
 * 更大只会让 data URI 变长，一个像素的清晰度都换不回来。
 */
const MAX_LOGO_SIDE = 768;

/** 按路径 + 修改时间缓存：用户在外面把同名文件换掉了，缓存当场失效而不是让他看见旧图 */
const cache = new Map<string, ResolvedLogo>();

export function isLogoFile(file: TFile): boolean {
    return LOGO_EXTENSIONS.includes(file.extension.toLowerCase());
}

/**
 * 把库内路径解析成可嵌入的标志。路径为空、文件没了、格式不认、解不开——一律返回 null。
 *
 * 全程不抛：标志是装饰，一张图读不出来不该让整次导出失败，
 * 调用方看见 null 就当他没选过标志，纸照出，只是少一枚图。
 */
export async function resolveLogo(app: App, path: string): Promise<ResolvedLogo | null> {
    const trimmed = path.trim();

    if (!trimmed) return null;

    const file = app.vault.getAbstractFileByPath(trimmed);

    if (!(file instanceof TFile) || !isLogoFile(file)) return null;

    const key = `${file.path}@${file.stat.mtime}`;
    const cached = cache.get(key);

    if (cached) return cached;

    try {
        const bytes = await app.vault.readBinary(file);
        const mime = MIME_BY_EXTENSION[file.extension.toLowerCase()] ?? 'image/png';
        const image = await decodeImage(`data:${mime};base64,${base64Of(bytes)}`);
        const resolved = shrink(image, file.path);

        cache.set(key, resolved);

        return resolved;
    } catch {
        return null;
    }
}

function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('图片无法解码'));
        image.src = dataUrl;
    });
}

/**
 * 统一重绘成 PNG，即使原图已经够小。
 *
 * 「够小就原样透传」看着更省事，代价是水印那条路上会出现两种字节形态——
 * 其中 SVG 那一种要嵌进另一张 SVG 里再当作 CSS 背景图，是整条链上最容易出意外的写法。
 * 统一栅格化换来的是：标志只有一种形态，而且那种形态处处都画得出来。
 */
function shrink(image: HTMLImageElement, path: string): ResolvedLogo {
    // SVG 不带固有尺寸时浏览器给 300×150，因此这里永远拿得到一个正数
    const naturalWidth = Math.max(1, image.naturalWidth || image.width);
    const naturalHeight = Math.max(1, image.naturalHeight || image.height);
    const scale = Math.min(1, MAX_LOGO_SIDE / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) throw new Error('浏览器没有给出画布上下文');

    context.drawImage(image, 0, 0, width, height);

    return { path, dataUrl: canvas.toDataURL('image/png'), width, height };
}

function base64Of(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let start = 0; start < bytes.length; start += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    }

    return btoa(binary);
}
