/**
 * [INPUT]: 只接收 Markdown 原文、旧/新容器事实与一个由上层注入的链接解析器，零 Obsidian 依赖
 * [OUTPUT]: 对外提供 ContainerReferenceRewrite 与 rewriteContainerReferences，定向改写
 *           wikilink/嵌入/行内 Markdown 链接、卡片 YAML up 及出库单的容器路径
 * [POS]: projects 的改名语义文本层。它只改「能证明指向被改名文件」的链接，
 *        或出库单中与旧文件夹路径同行的项目身份；普通正文里恰好出现的旧项目名一字不动，
 *        避免把「英语」这类同时也是普通词的领域名全库盲换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

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
): ContainerReferenceRewrite {
    let replacements = 0;
    let rewritten = content.replace(
        /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g,
        (whole, open: string, rawTarget: string, rawAlias: string | undefined, close: string) => {
            const { path, suffix } = splitSubpath(rawTarget.trim());
            if (!path) return whole;

            const resolved = resolve(path, sourcePath);
            const mapped = resolved ? facts.paths.get(resolved) : undefined;
            if (!mapped) return whole;

            let alias = rawAlias;
            if (alias) {
                const value = alias.slice(1);
                if (value === facts.oldName || value === basenameWithoutExtension(facts.oldMocPath)) {
                    alias = `|${facts.newName}`;
                }
            }

            replacements += 1;
            return `${open}${withoutMarkdownExtension(mapped)}${suffix}${alias ?? ''}${close}`;
        },
    );

    rewritten = rewritten.replace(
        /(!?\[[^\]]*\]\()([^\s)]+|<[^>]+>)(\s+(?:"[^"]*"|'[^']*'))?(\))/g,
        (whole, open: string, rawDestination: string, title: string | undefined, close: string) => {
            const bracketed = rawDestination.startsWith('<') && rawDestination.endsWith('>');
            const destination = bracketed ? rawDestination.slice(1, -1) : rawDestination;
            if (/^(?:[a-z]+:|#)/i.test(destination)) return whole;

            const { path, suffix } = splitSubpath(safeDecode(destination));
            const resolved = path ? resolve(path, sourcePath) : null;
            const mapped = resolved ? facts.paths.get(resolved) : undefined;
            if (!mapped) return whole;

            const next = `${mapped}${suffix}`;
            const wrapped = bracketed || next.includes(' ') ? `<${next}>` : next;
            replacements += 1;
            return `${open}${wrapped}${title ?? ''}${close}`;
        },
    );

    // 《赛博永生》出库单可能在另一本库，其 [[项目名]] 不能由当前库解析。
    // 只在同行同时出现精确旧文件夹路径时改，路径就是这一行的身份证明。
    const oldPathToken = `\`${facts.oldFolderPath}\``;
    const newPathToken = `\`${facts.newFolderPath}\``;
    const oldLink = `[[${facts.oldName}]]`;
    const newLink = `[[${withoutMarkdownExtension(facts.newMocPath)}|${facts.newName}]]`;
    const lines = rewritten.split(/(\r\n|\n|\r)/);

    for (let index = 0; index < lines.length; index += 2) {
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
