/**
 * [INPUT]: 依赖 core/types 的 ZiminosContext（编辑器实例由 editor-paste 事件直接递进来）
 * [OUTPUT]: 对外提供 registerPasteLink（装配「粘贴到选中文字上＝加外链」这一个编辑器监听）
 * [POS]: 编辑模块的粘贴支线，一个监听、零命令、零界面。
 *        它只回答一个很窄的问题：剪贴板里是一条网址、而光标下选着一段文字时，
 *        这次粘贴该不该被理解成「给这段文字加外链」。
 *        窄是刻意的——粘贴是全库最频繁的动作之一，一个判断不清的拦截会让人不敢再按 Cmd+V。
 *        因此四条门槛全部满足才动手：开关开着、这次粘贴还没被别人处理、真的选了字、
 *        剪贴板里真的只有一条带协议的网址。任何一条不满足就原样放行，让 Obsidian 自己粘。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ZiminosContext } from '../../core/types';

/**
 * 认得的协议。
 *
 * 必须带协议，`www.example.com` 这种裸域名一概不认——这是本文件最要紧的一条边界。
 * 认它只有两种做法：原样写进括号里，得到一个指向库内相对路径的死链；
 * 或者替用户补上 `https://`，那是在他没开口的情况下改写他的剪贴板内容。
 * 两种都不如「不动」：不动的话他自己看得见发生了什么，而前两种都是静默的。
 */
const URL_PATTERN = /^(?:https?|obsidian|file|ftp|ftps|mailto|tel):\S+$/i;

/** 目标里出现这些字符时，链接地址必须用尖括号包住，否则 Markdown 在第一个空格或右括号处截断 */
const NEEDS_ANGLE = /[\s()]/;

// ============================================================
// 装配
// ============================================================

export function registerPasteLink(ctx: ZiminosContext): void {
    ctx.plugin.registerEvent(
        ctx.app.workspace.on('editor-paste', (evt, editor) => {
            if (!ctx.settings.pasteLinkEnabled) return;
            // 官方文档明写的礼节：别人已经处理过的粘贴不再插手
            if (evt.defaultPrevented) return;

            const link = buildLink(editor.getSelection(), readUrl(evt.clipboardData));

            if (!link) return;

            evt.preventDefault();
            editor.replaceSelection(link);
        }),
    );
}

// ============================================================
// 纯函数：这次粘贴到底该变成什么
// ============================================================

/** 取剪贴板里的纯文本。取不到、或者不是一条干净的网址就返回 null */
function readUrl(data: DataTransfer | null): string | null {
    const text = data?.getData('text/plain')?.trim() ?? '';

    return URL_PATTERN.test(text) ? text : null;
}

/**
 * 拼出那条 Markdown 链接；条件不成立时返回 null，由调用方原样放行。
 *
 * 选中的文字里带换行时刻意不做：Markdown 的链接文字不能跨行，硬拼出来的是一段坏语法，
 * 而用户框选一整段再粘一条网址，想要的多半是「用网址替换这一段」——那正是原样粘贴的行为。
 */
function buildLink(selection: string, url: string | null): string | null {
    if (!url) return null;
    if (!selection.trim()) return null;
    if (/[\r\n]/.test(selection)) return null;

    return `[${escapeLabel(selection)}](${NEEDS_ANGLE.test(url) ? `<${url}>` : url})`;
}

/**
 * 选中的文字要当链接文字用，里面的方括号必须转义。
 * 不转义的话，选中「参考[1]」会拼出 `[参考[1]](url)`，Markdown 在第一个 `]` 处就把标签截断了。
 */
function escapeLabel(selection: string): string {
    return selection.replace(/([[\]])/g, '\\$1');
}
