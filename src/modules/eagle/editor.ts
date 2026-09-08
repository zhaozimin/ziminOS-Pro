/**
 * [INPUT]: 依赖 @codemirror/view 的公开 DOM 事件扩展、obsidian Notice、EagleBridgeClient 的稳定身份打开能力，依赖 protocol 的文本命中规则
 * [OUTPUT]: 对外提供 createEagleEditorExtension 与 eagleReferenceFromTarget，让实时预览、源码模式与 YAML 属性值按 Obsidian 标准修饰键手势打开 Eagle
 * [POS]: Eagle 模块的 CodeMirror 适配层。它只把鼠标坐标还原成笔记里的稳定身份，不接触 Eagle 路径、端口或认证状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Prec } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Notice } from 'obsidian';
import type { EagleBridgeClient } from './client';
import { eagleReferenceAtText, singleEagleReferenceInText } from './protocol';
import type { EagleReference } from './protocol';

export function createEagleEditorExtension(client: EagleBridgeClient): Extension {
    // 自定义协议必须在 Obsidian 的通用外链处理之前识别，否则会先被交给操作系统。
    return Prec.highest(EditorView.domEventHandlers({
        click: (event, view) => {
            if (event.button !== 0 || (!event.metaKey && !event.ctrlKey)) return false;

            const reference = eagleReferenceFromTarget(event.target) ?? referenceFromPosition(event, view);

            if (!reference) return false;

            event.preventDefault();
            event.stopPropagation();
            void client.open(reference).catch((error) => {
                new Notice(`无法在 Eagle 中打开：${errorMessage(error)}`, 8000);
            });

            return true;
        },
    }));
}

function referenceFromPosition(event: MouseEvent, view: EditorView): EagleReference | null {
    const position = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);

    if (position === null) return null;

    const line = view.state.doc.lineAt(position);

    return eagleReferenceAtText(line.text, position - line.from);
}

/**
 * YAML 属性编辑器会把源文本折成 input / contenteditable / pill，点击坐标不一定落在 URI 的字符区间。
 * 这里只在最近的小型控件文本里提取“唯一一条” Eagle 身份，不向上扫整篇笔记，避免打开错附件。
 */
export function eagleReferenceFromTarget(target: EventTarget | null): EagleReference | null {
    // 弹出窗口有自己的 DOM realm，`instanceof Element` 会对另一个窗口的真实节点返回 false。
    let element = target && 'nodeType' in target && target.nodeType === 1 ? target as Element : null;

    for (let depth = 0; element && depth < 4; depth += 1, element = element.parentElement) {
        if (element.classList.contains('cm-editor')) break;

        const text = controlText(element);

        if (text.length <= 512) {
            const reference = singleEagleReferenceInText(text);

            if (reference) return reference;
        }
    }

    return null;
}

function controlText(element: Element): string {
    if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && 'value' in element) {
        return String(element.value);
    }

    return element.getAttribute('data-ziminos-eagle-uri')
        ?? element.getAttribute('data-href')
        ?? element.getAttribute('href')
        ?? (element.tagName === 'IMG' ? element.getAttribute('src') : null)
        ?? element.textContent
        ?? '';
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
