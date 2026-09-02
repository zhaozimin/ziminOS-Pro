/**
 * [INPUT]: 只接收原始文本与字符串行数组，零业务、零 Obsidian 依赖
 * [OUTPUT]: 对外提供 lineEndingOf、splitTextLines 与 joinTextLines，统一保留 LF / CRLF / CR
 * [POS]: core 的文本行边界；所有“拆行、改行、接回去”的写入路径共用此处，
 *        防止每个模块各自猜一次换行符并在 Windows 笔记中制造混合行尾
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type LineEnding = '\n' | '\r\n' | '\r';

export interface TextLines {
    readonly lines: string[];
    readonly lineEnding: LineEnding;
}

/** 以文档里第一个真实行尾为准；单行文档默认 LF */
export function lineEndingOf(content: string): LineEnding {
    const matched = content.match(/\r\n|\n|\r/)?.[0];

    return matched === '\r\n' || matched === '\r' ? matched : '\n';
}

/** 把三种行尾收敛为行数组，同时保留写回时要用的原始约定 */
export function splitTextLines(content: string): TextLines {
    return {
        lines: content.split(/\r\n|\n|\r/),
        lineEnding: lineEndingOf(content),
    };
}

/** 唯一的接回入口；调用方不再就地写 join('\n') */
export function joinTextLines(lines: readonly string[], lineEnding: LineEnding): string {
    return lines.join(lineEnding);
}
