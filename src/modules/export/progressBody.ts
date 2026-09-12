/**
 * [INPUT]: 零依赖——**只用标准 DOM**，连 Obsidian 挂在 HTMLElement 上的 createDiv / setText / addClass
 *          都不碰。那几个便捷方法只在 Obsidian 里存在，用了它们，这个文件就不再是「可搬走的」，
 *          而演示页正是把它搬到浏览器里跑（第一版就栽在这儿：label.setText is not a function）
 * [OUTPUT]: 对外提供 ProgressBody 契约与 createProgressBody
 * [POS]: 导出进度那一块的**纯 DOM 半边**，刻意不 import obsidian。
 *        分出来只为一件事：`docs/export-demo` 那份交互演示要给人看这个进度条长什么样，
 *        而它跑在浏览器里、没有 Modal。共用这一个文件，演示页里那根条就与插件里跑的
 *        是同一份代码；各写一份的话，演示页迟早在讲一个已经不成立的故事——
 *        那正是整个演示页存在的理由所反对的事。
 *
 *        进度按**阶段**走而不是按字节：dom-to-image 不给任何回调，装不出字节级的百分比。
 *        所以标签比那根条更重要——条说「还有多远」，标签说「此刻在干什么」，
 *        后者才是消除「盲盒感」的那一半
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export interface ProgressBody {
    /** 推进一步、写上这一步在做什么，并**等界面真的画出来**再放行 */
    step(label: string): Promise<void>;
    succeed(message: string): void;
    /** 失败停在原地并标红；onDismiss 是那枚「知道了」按钮要做的事 */
    fail(message: string, onDismiss: () => void): void;
}

export interface ProgressBodyOptions {
    readonly total: number;
    /** 把标题交回宿主去改：Modal 有自己的 titleEl，演示页有自己那一行 */
    readonly onTitle: (text: string) => void;
}

export function createProgressBody(host: HTMLElement, options: ProgressBodyOptions): ProgressBody {
    const total = Math.max(1, options.total);
    const box = div(host, 'ziminos-export-progress');
    const head = div(box, 'ziminos-export-progress-head');
    const label = div(head, 'ziminos-export-progress-label', '准备中…');
    const count = div(head, 'ziminos-export-progress-count', `0 / ${total}`);
    const fill = div(div(box, 'ziminos-export-progress-track'), 'ziminos-export-progress-fill');

    let done = 0;
    /** 结算之后不再接受推进：迟到的一步不该把「已成功」改回「正在…」 */
    let settled = false;

    fill.style.width = '0%';

    return {
        step: async (text) => {
            if (settled) return;

            done = Math.min(total, done + 1);
            label.textContent = text;
            count.textContent = `${done} / ${total}`;
            fill.style.width = `${Math.round((done / total) * 100)}%`;

            await paint();
        },
        succeed: (message) => {
            if (settled) return;

            settled = true;
            options.onTitle('导出成功');
            label.textContent = message;
            count.textContent = `${total} / ${total}`;
            fill.style.width = '100%';
            box.classList.add('is-done');
        },
        fail: (message, onDismiss) => {
            if (settled) return;

            settled = true;
            options.onTitle('导出失败');
            label.textContent = message;
            box.classList.add('is-failed');

            // 失败不自动关：这句话是用户唯一能拿去问「为什么」的东西，一闪而过等于没说
            const actions = div(host, 'ziminos-export-progress-actions');
            const button = document.createElement('button');

            button.type = 'button';
            button.textContent = '知道了';
            button.addEventListener('click', onDismiss);
            actions.appendChild(button);
        },
    };
}

function div(host: HTMLElement, cls: string, text?: string): HTMLElement {
    const element = document.createElement('div');

    element.className = cls;

    if (text !== undefined) element.textContent = text;

    host.appendChild(element);

    return element;
}

/**
 * 等两帧。
 *
 * 一帧只够浏览器把刚改的样式算进去，第二帧才轮到把它画上屏幕；
 * 只等一帧的话，调用方紧接着的那段同步重活照样会把这次更新压在后面，
 * 进度条从头到尾只画一次——那比没有进度条更糟。
 */
function paint(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
}
