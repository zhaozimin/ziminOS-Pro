/**
 * [INPUT]: 依赖 core/types 的 ZiminosContext（只取 app.workspace.containerEl 与 plugin.register）
 * [OUTPUT]: 对外提供 celebrate（开荒成功后从左右两侧向中间喷一次礼花）
 * [POS]: setup 模块的收尾表情，唯一的消费者是 initializeVault。它不写任何文件、
 *        不读任何设置、不认识笔记库——把它单独成文件而不是塞进 init.ts，
 *        是因为 init.ts 回答的是「开荒要落哪些东西」，而这里回答的是「落完了怎么告诉人」，
 *        两件事的变更理由不同：调粒子数量、颜色与轨迹不该让人去翻开荒流程。
 *
 *        三条纪律写在这里，因为它们都是「动画」这件事特有的：
 *        其一，**它必须能自己收场**。一次性动画留下的节点不会有人报错，
 *        只会在 DOM 里越积越多，直到某天用户觉得 Obsidian 变卡了却查不出原因；
 *        因此清理同时挂在动画结束与 plugin.register 上——前者管正常路径，
 *        后者管「动画还没跑完用户就禁用了插件」。
 *        其二，**尊重系统的减少动效设置**。那是无障碍偏好，不是审美偏好；
 *        开着它的人多半是前庭功能敏感，满屏飞行的粒子对他不是庆祝是不适。
 *        其三，**它绝不吃鼠标**。覆盖层铺满整个视口，若不设 pointer-events: none，
 *        礼花飞的那一秒钟用户点什么都没反应，而他不会把这归咎于一个动画。
 *
 *        定位取 fixed 而不是 absolute：absolute 的 inset: 0 要靠「宿主恰好是个定位祖先」
 *        才成立，而那是别人家 DOM 的实现细节，今天成立不代表下个版本还成立——
 *        赌错的表现是整层贴到别的元素上，礼花在屏幕角落里飞。fixed 不问祖先。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ZiminosContext } from '../../core/types';

// ============================================================
// 参数
// ============================================================

/** 左右各喷多少片。两边合计 72 片：再多就从「庆祝」变成「刷屏」，在小窗口里尤其明显 */
const PIECES_PER_SIDE = 36;

/** 一片纸屑从出膛到落地的毫秒数区间；随机取值，避免整批同起同落像一堵墙 */
const DURATION_MS = { min: 1500, max: 2600 } as const;

/** 出膛后的滞空延迟区间。错开起飞时间，喷口才像在连发而不是一次齐射 */
const DELAY_MS = { min: 0, max: 260 } as const;

/**
 * 纸屑颜色。取 Obsidian 的语义变量而不是写死色值，
 * 与 styles.css 全文同一条纪律：换主题、切明暗、改 Style Settings 配色都不必动这里。
 */
const COLORS = [
    'var(--color-red)',
    'var(--color-orange)',
    'var(--color-yellow)',
    'var(--color-green)',
    'var(--color-cyan)',
    'var(--color-blue)',
    'var(--color-purple)',
    'var(--color-pink)',
] as const;

// ============================================================
// 对外
// ============================================================

/**
 * 从左右两侧向中间喷一次礼花。
 *
 * 不抛异常、不返回结果：它是一次表情，失败了最多是没看见动画，
 * 绝不能让开荒本身显得出了错——那时用户的笔记库其实已经建好了。
 */
export function celebrate(ctx: ZiminosContext): void {
    try {
        const host = ctx.app.workspace.containerEl;
        const doc = host.ownerDocument;
        const win = doc.defaultView;

        if (!win) return;

        // 无障碍优先：系统开了「减少动效」就直接不放。这是偏好不是降级，
        // 因此不给任何替代动画，也不提示——他要的就是安静
        if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

        const layer = doc.createElement('div');

        layer.addClass('ziminos-confetti');
        host.appendChild(layer);

        // 尺寸取窗口而不是宿主元素的 rect：那一层是 position: fixed，
        // 铺的是整个视口；拿宿主的尺寸算轨迹会让粒子在窗口没铺满工作区时飞错地方
        const width = win.innerWidth;
        const height = win.innerHeight;
        const animations: Animation[] = [];

        for (const side of ['left', 'right'] as const) {
            for (let index = 0; index < PIECES_PER_SIDE; index += 1) {
                animations.push(launch(doc, layer, side, width, height));
            }
        }

        // 正常路径：最后一片落地就撤掉整层。用动画自己的完成事件而不是估一个总时长——
        // 估短了会把还在飞的粒子连根拔掉，估长了那层空 div 就多赖在 DOM 上一会儿
        const remove = (): void => layer.remove();

        Promise.allSettled(animations.map((animation) => animation.finished)).then(remove, remove);

        // 异常路径：动画还没跑完用户就禁用了插件。托管给 plugin，
        // 卸载时连同这层一起收走，不留孤儿节点
        ctx.plugin.register(remove);
    } catch {
        // 一次动画不值得惊动任何人。这里连 Notice 都不发——
        // 用户刚看到「开荒完成 ✅」，紧跟一句失败提示只会让他以为开荒出了问题
    }
}

// ============================================================
// 实现
// ============================================================

/**
 * 造一片纸屑并让它飞。
 *
 * 轨迹是「向中间 + 向上 + 落下」三段合成的一条弧：横向位移始终指向屏幕中线，
 * 因此左右两股在中间交汇——这正是喷口对喷该有的样子，
 * 而不是两边各自向外散开（那看着像爆炸，不像庆祝）。
 */
function launch(
    doc: Document,
    layer: HTMLElement,
    side: 'left' | 'right',
    width: number,
    height: number,
): Animation {
    const piece = doc.createElement('i');

    piece.addClass('ziminos-confetti-piece');
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0];

    // 出膛点：贴着左右边缘，纵向落在视口的中下段——喷口在腰的高度比在头顶自然
    const fromLeft = side === 'left';

    piece.style.left = fromLeft ? '0px' : `${width}px`;
    piece.style.top = `${height * (0.55 + Math.random() * 0.25)}px`;

    layer.appendChild(piece);

    // 横向：一律朝中线去，力度随机；纵向：先被抛高，再落到视口下方之外
    const toward = (fromLeft ? 1 : -1) * width * (0.35 + Math.random() * 0.5);
    const rise = height * (0.35 + Math.random() * 0.35);
    const fall = height * (0.6 + Math.random() * 0.5);
    const spin = 360 * (2 + Math.random() * 3) * (fromLeft ? 1 : -1);

    return piece.animate(
        [
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0 },
            {
                transform: `translate(${toward * 0.55}px, ${-rise}px) rotate(${spin * 0.5}deg)`,
                opacity: 1,
                offset: 0.45,
            },
            {
                transform: `translate(${toward}px, ${fall}px) rotate(${spin}deg)`,
                opacity: 0,
                offset: 1,
            },
        ],
        {
            duration: between(DURATION_MS.min, DURATION_MS.max),
            delay: between(DELAY_MS.min, DELAY_MS.max),
            // 出膛快、滞空慢、落下再快，一条标准的抛物线手感
            easing: 'cubic-bezier(0.2, 0.7, 0.35, 1)',
            fill: 'forwards',
        },
    );
}

/** 区间内取一个整数。轨迹的每一项都要随机，否则整批粒子会走成一条线 */
function between(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}
