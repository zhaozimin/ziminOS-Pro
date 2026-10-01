/**
 * [INPUT]: 依赖 core/constants 的出库单路径；接收 Markdown 原文、旧/新容器事实、
 *          上层用公开 MetadataCache 证明的链接范围与解析器，零 Obsidian 依赖
 * [OUTPUT]: 对外提供 ContainerLinkSpan/ContainerRenameFacts/ContainerReferenceRewrite 契约与 rewriteContainerReferences，定向改写
 *           wikilink/嵌入/行内 Markdown 链接、卡片 YAML up 及出库单的容器路径
 * [POS]: projects 的改名语义文本层。它只改「能证明指向被改名文件」的链接，
 *        或出库单中与旧文件夹路径同行的项目身份；普通正文里恰好出现的旧项目名一字不动，
 *        避免把「英语」这类同时也是普通词的领域名全库盲换。范围外的代码示例不改；
 *        Markdown 路径按移动后的源目录生成并编码，只有 MOC 的默认别名随容器身份改写
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { EXPORT_MANIFEST_FILE } from '../../core/constants';

export interface ContainerLinkSpan {
    readonly start: number;
    readonly end: number;
    /** 正文引用须核对缓存原文；YAML 属性区按整段范围处理 */
    readonly original?: string;
}

export interface ContainerReferenceRewrite {
    readonly content: string;
    readonly replacements: number;
}

export interface ContainerRenameFacts {
    readonly oldName: string;
    readonly newName: string;
    readonly oldFolderPath: string;
    readonly newFolderPath: string;
    readonly oldMocPath: string;
    readonly newMocPath: string;
    /** 被改名子树中每一个文件的旧路径 → 新路径 */
    readonly paths: ReadonlyMap<string, string>;
}

export type LinkResolver = (linkpath: string, sourcePath: string) => string | null;

/** 改写一篇 Markdown 中所有能确定属于本次容器改名的身份引用 */
export function rewriteContainerReferences(
    content: string,
    sourcePath: string,
    facts: ContainerRenameFacts,
    resolve: LinkResolver,
    spans: readonly ContainerLinkSpan[],
): ContainerReferenceRewrite {
    let replacements = 0;
    const rewriteLinks = (text: string): string => text.replace(
        /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g,
        (whole, open: string, rawTarget: string, rawAlias: string | undefined, close: string) => {
            const { path, suffix } = splitSubpath(rawTarget.trim());
            if (!path) return whole;

            const resolved = resolve(path, sourcePath);
            const mapped = resolved ? facts.paths.get(resolved) : undefined;
            if (!mapped) return whole;

            let alias = rawAlias;
            if (alias && mapped === facts.newMocPath) {
                const value = alias.slice(1);
                if (value === facts.oldName || value === basenameWithoutExtension(facts.oldMocPath)) {
                    alias = `|${facts.newName}`;
                }
            }

            replacements += 1;
            return `${open}${withoutMarkdownExtension(mapped)}${suffix}${alias ?? ''}${close}`;
        },
    ).replace(
        /(!?\[[^\]]*\]\()(<[^>]+>|[^\s)]+)(\s+(?:"[^"]*"|'[^']*'))?(\))/g,
        (whole, open: string, rawDestination: string, title: string | undefined, close: string) => {
            const bracketed = rawDestination.startsWith('<') && rawDestination.endsWith('>');
            const destination = bracketed ? rawDestination.slice(1, -1) : rawDestination;
            if (/^(?:[a-z]+:|#)/i.test(destination)) return whole;

            const { path, suffix } = splitSubpath(destination);
            const resolved = path ? resolve(safeDecode(path), sourcePath) : null;
            const mapped = resolved ? facts.paths.get(resolved) : undefined;
            if (!mapped) return whole;

            const newSourcePath = facts.paths.get(sourcePath) ?? (sourcePath.startsWith(`${facts.oldFolderPath}/`)
                ? facts.newFolderPath + sourcePath.slice(facts.oldFolderPath.length) : sourcePath);
            const nextPath = destination.startsWith('/') ? `/${mapped}` : relativePath(newSourcePath, mapped);
            const next = `${encodePath(nextPath)}${suffix}`;
            const wrapped = bracketed ? `<${next}>` : next;
            replacements += 1;
            return `${open}${wrapped}${title ?? ''}${close}`;
        },
    );

    // 从原文范围倒序替换，前一条改长之后也不会让后一条的缓存偏移漂移。
    let rewritten = content;
    let boundary = content.length;
    for (const span of [...spans].sort((left, right) => right.start - left.start)) {
        if (span.start < 0 || span.end > boundary || span.start >= span.end) continue;
        const original = content.slice(span.start, span.end);
        if (span.original !== undefined && original !== span.original) continue;
        rewritten = rewritten.slice(0, span.start) + rewriteLinks(original) + rewritten.slice(span.end);
        boundary = span.start;
    }

    if (sourcePath !== EXPORT_MANIFEST_FILE) return { content: rewritten, replacements };

    // 《赛博永生》出库单可能在另一本库，其 [[项目名]] 不能由当前库解析。
    // 只在同行同时出现精确旧文件夹路径时改，路径就是这一行的身份证明。
    const oldPathToken = `\`${facts.oldFolderPath}\``;
    const newPathToken = `\`${facts.newFolderPath}\``;
    const oldLink = `[[${facts.oldName}]]`;
    const newLink = `[[${withoutMarkdownExtension(facts.newMocPath)}|${facts.newName}]]`;
    const lines = rewritten.split(/(\r\n|\n|\r)/);

    for (let index = 0; index < lines.length; index += 2) {
        if (!/^\s*- \[[ xX]\] .+ · UID \S+\s*$/.test(lines[index])) continue;
        if (!lines[index].includes(oldPathToken)) continue;
        lines[index] = lines[index].replace(oldPathToken, newPathToken);
        replacements += 1;
        if (lines[index].includes(oldLink)) {
            lines[index] = lines[index].replace(oldLink, newLink);
            replacements += 1;
        }
    }

    return { content: lines.join(''), replacements };
}

function relativePath(source: string, target: string): string {
    const from = source.split('/').slice(0, -1);
    const to = target.split('/');
    while (from.length && to.length && from[0] === to[0]) {
        from.shift();
        to.shift();
    }
    return [...from.map(() => '..'), ...to].join('/');
}

function encodePath(path: string): string {
    return path.split('/').map((part) => encodeURIComponent(part)
        .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

function splitSubpath(target: string): { path: string; suffix: string } {
    const hash = target.indexOf('#');
    if (hash < 0) return { path: target, suffix: '' };
    return { path: target.slice(0, hash), suffix: target.slice(hash) };
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function withoutMarkdownExtension(path: string): string {
    return path.endsWith('.md') ? path.slice(0, -3) : path;
}

function basenameWithoutExtension(path: string): string {
    return withoutMarkdownExtension(path).split('/').pop() ?? '';
}
