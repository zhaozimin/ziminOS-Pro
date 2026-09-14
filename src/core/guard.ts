/**
 * [INPUT]: 依赖 ./constants 的 SELF_WRITE_WINDOW_MS
 * [OUTPUT]: 对外提供 SelfWriteGuard 类（mark 登记自写、isRecent 查询自写）
 * [POS]: core 的自激循环断路器。插件的自动化行为监听 vault 的 create/modify/rename 事件，
 *        而插件自己的写盘同样会触发这些事件——没有它，updated 维护会写盘、写盘再触发维护，
 *        形成无限循环。事件监听在动手前问 isRecent；写路径在动手前是否 mark，是一个语义决定：
 *        **mark 登记的是机器的反应，不是替人落下的笔**。updated 自己落笔、排版、出生模板、存量迁移、
 *        整棵子树搬家引出的双链改写、插件自己的账，都是反应，登记；记人情、记付费、记收款、记灵感、
 *        勾掉一条待办、导入划线、写主题，改的是用户自己的笔记，不登记——一登记，updated 记账就会跳过它们。
 *        每一处登记的归类钉在 tests/writes.mjs，新增一处而不归类即红
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { SELF_WRITE_WINDOW_MS } from './constants';

/**
 * 自写抑制器。
 * 只记录「路径 → 最近一次插件自写的时刻」，不持有任何 Obsidian 对象，
 * 因此可以被所有模块共享而不产生依赖纠缠。
 */
export class SelfWriteGuard {
    /** 路径 → 插件最近一次写入该路径的时间戳（毫秒） */
    private readonly marks = new Map<string, number>();

    /**
     * 机器对变化作出反应、写入某个文件之前调用，声明「接下来这个路径的变化不是人改的」。
     * 替用户落笔的写入不调用它：那一笔是人的编辑，只是经由插件落盘。
     * 登记按时间窗生效（SELF_WRITE_WINDOW_MS），窗口内同一路径的任何变化都会被当成机器的——
     * 所以只登记确实要写的那一刻，失败或无变化的流程不制造虚假的窗口。
     */
    mark(path: string): void {
        this.marks.set(path, Date.now());
    }

    /**
     * 判断某路径是否仍处于自写窗口内。
     * 遍历时顺手清掉所有过期登记：读多写少的场景下，这比另起定时器清理更简单，
     * 也符合「无定时器、无后台轮询」的红线。
     */
    isRecent(path: string, windowMs: number = SELF_WRITE_WINDOW_MS): boolean {
        const now = Date.now();
        let recent = false;

        for (const [markedPath, markedAt] of this.marks) {
            if (now - markedAt > windowMs) {
                this.marks.delete(markedPath);
                continue;
            }

            if (markedPath === path) recent = true;
        }

        return recent;
    }
}
