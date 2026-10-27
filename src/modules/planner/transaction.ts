/**
 * [INPUT]: 依赖注入的原文读取、比较写入、创建与撤销端口。
 * [OUTPUT]: 提供 WriteTransaction，失败时逆序回滚自己仍拥有的原文。
 * [POS]: 大日历多文件写入边界；并发改动保留并明确报告。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export interface WritePort {
    read(path: string): Promise<string>;
    change(path: string, before: string, after: string): Promise<void>;
    create(path: string, text: string): Promise<void>;
    remove(path: string, expected: string): Promise<void>;
}
export class WriteTransaction {
    private undo: (() => Promise<void>)[] = [];
    constructor(private port: WritePort) {}
    async change(path: string, before: string, after: string): Promise<void> {
        if (before === after) return;
        await this.port.change(path, before, after);
        this.undo.push(() => this.port.change(path, after, before));
    }
    async create(path: string, text: string): Promise<void> {
        await this.port.create(path, text);
        this.undo.push(() => this.port.remove(path, text));
    }
    async run(action: () => Promise<void>): Promise<void> {
        try { await action(); this.undo = []; }
        catch (error) {
            const failures: string[] = [];
            for (const undo of this.undo.reverse()) {
                try { await undo(); } catch (failure) { failures.push(String(failure)); }
            }
            this.undo = [];
            throw new Error(`${error instanceof Error ? error.message : error}${failures.length ? `\n有文件已被再次修改，保留其原文，请检查：${failures.join('；')}` : '\n本次已写入内容已撤销。'}`);
        }
    }
}
