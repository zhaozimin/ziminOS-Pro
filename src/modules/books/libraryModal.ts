/**
 * [INPUT]: 依赖 obsidian 的 ButtonComponent/Modal 与 App 类型
 * [OUTPUT]: 对外提供 LibraryImportPlan 契约与 LibraryImportModal（确认 → 进度 → 结果三态）
 * [POS]: 批量导入这条命令的全部界面。三态住在**同一个弹窗**里，不是三个弹窗：
 *        用户点「开始导入」之后视线就该停在原地，而不是一个窗关掉、另一个窗弹出来。
 *
 *        它与 export 那个进度弹窗刻意不共用一份实现，因为两者要说的话不同：
 *        导出是固定四步、不能中途叫停，每一步自报家门；导入是八十本、每本长得一样、
 *        随时可以停。硬凑成一个组件，得到的是一个两头都要加 if 的东西。
 *        样式全部内联，一个 CSS 类都不新增——styles.css 是随库交付的资产，
 *        为一个只在命令运行时出现几分钟的弹窗去改它，代价比收益大
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, Modal } from 'obsidian';
import type { App } from 'obsidian';

// ============================================================
// 契约
// ============================================================

/** 开跑之前先说清这一批是什么 */
export interface LibraryImportPlan {
    readonly sourceLabel: string;
    /** 来源里一共有多少本有划线或笔记的书 */
    readonly total: number;
    /** 其中多少本库里还没有 */
    readonly fresh: number;
    /** 其中多少本库里已经有了，这次只补新划线 */
    readonly existing: number;
}

/** 跑完之后的账目，逐行显示在结果态 */
export interface LibraryImportSummaryLine {
    readonly label: string;
    readonly value: string;
    readonly warn?: boolean;
}

// ============================================================
// 弹窗
// ============================================================

export class LibraryImportModal extends Modal {
    private readonly plan: LibraryImportPlan;

    /** 用户按过「停止」，或在跑的过程中把窗关掉了 */
    private cancelled = false;

    /** 已经跑完了：此后关窗不再是「停止」，只是关窗 */
    private finished = false;

    private resolver: ((value: boolean) => void) | null = null;

    private started = false;

    /**
     * 这个弹窗此刻该画哪一态。
     *
     * 它不是多余的状态：用户在跑到一半时按 Esc，弹窗会关掉而导入照常跑完
     * （已经写进去的书一本都不回滚，这是对的）。跑完要把账目和报告链接交给他，
     * 那就得把窗重新打开——而 Obsidian 重新 open 会再走一次 onOpen，
     * 没有这个字段它会回到确认态，问一句「要开始导入吗」。
     */
    private phase: 'confirm' | 'progress' | 'result' = 'confirm';

    /** 窗此刻开着没有。Modal 不公开这件事，只能自己记 */
    private showing = false;

    /** 结果态要画的内容，暂存着——窗可能得等重新打开才画得出来 */
    private result: {
        lines: readonly LibraryImportSummaryLine[];
        openReport: (() => void) | null;
    } | null = null;

    private titleLine: HTMLElement | null = null;
    private bar: HTMLElement | null = null;
    private noteLine: HTMLElement | null = null;

    constructor(app: App, plan: LibraryImportPlan) {
        super(app);
        this.plan = plan;
    }

    /** 用户按了「停止」或关了窗 */
    get stopped(): boolean {
        return this.cancelled;
    }

    /** 开窗问一句「开始吗」。确认返回 true，其余一切关闭路径返回 false */
    openAndConfirm(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        this.showing = true;

        if (this.phase === 'confirm') this.renderConfirm();
        else if (this.phase === 'progress') this.renderProgress();
        else this.renderResult();
    }

    onClose(): void {
        this.showing = false;

        // 确认态关窗 = 不导入；进行中关窗 = 停止。两者都不是错误，
        // 已经写进去的书一本都不回滚——批量导入本就是可中断、可再跑的
        if (!this.started) this.settle(false);
        else if (!this.finished) this.cancelled = true;
    }

    // ============================================================
    // 态一：确认
    // ============================================================

    private renderConfirm(): void {
        const { sourceLabel, total, fresh, existing } = this.plan;

        this.titleEl.setText(`从 ${sourceLabel} 导入读书笔记`);
        this.contentEl.empty();

        const card = this.card();

        this.row(card, '来源', sourceLabel);
        this.row(card, '找到', `${total} 本有划线或笔记的书`);
        this.row(card, '新建', `${fresh} 本`, true);
        this.row(card, '已在库里', existing ? `${existing} 本（只补新的划线）` : '无');

        this.hint(
            `导入的书都落在项目目录、状态是「进行中」——每一本都还等着你读完、重排、想过之后再归档。`,
        );
        this.hint(
            `这一步不联网查豆瓣：封面与书目信息稍后用「补齐书籍信息」一本一本补，` +
                `那条命令一次只查一本，不会把豆瓣惹毛。`,
        );

        const bar = this.buttonBar();

        new ButtonComponent(bar).setButtonText('取消').onClick(() => this.settle(false));
        new ButtonComponent(bar)
            .setButtonText(total ? '开始导入' : '没有可导入的书')
            .setCta()
            .setDisabled(!total)
            .onClick(() => {
                this.started = true;
                this.phase = 'progress';
                this.renderProgress();
                this.settle(true);
            });
    }

    // ============================================================
    // 态二：进行中
    // ============================================================

    private renderProgress(): void {
        this.titleEl.setText('正在导入');
        this.contentEl.empty();

        this.titleLine = this.contentEl.createDiv({ text: '准备中…' });
        this.titleLine.style.fontWeight = '600';
        this.titleLine.style.marginBottom = '10px';
        this.titleLine.style.wordBreak = 'break-all';

        const track = this.contentEl.createDiv();

        track.style.height = '6px';
        track.style.borderRadius = '3px';
        track.style.background = 'var(--background-modifier-border)';
        track.style.overflow = 'hidden';

        this.bar = track.createDiv();
        this.bar.style.height = '100%';
        this.bar.style.width = '0%';
        this.bar.style.background = 'var(--interactive-accent)';
        this.bar.style.transition = 'width 120ms linear';

        this.noteLine = this.contentEl.createDiv({ text: '' });
        this.noteLine.style.marginTop = '10px';
        this.noteLine.style.fontSize = '0.85em';
        this.noteLine.style.color = 'var(--text-muted)';
        this.noteLine.style.lineHeight = '1.6';

        const bar = this.buttonBar();

        new ButtonComponent(bar).setButtonText('停止').onClick(() => {
            this.cancelled = true;
            if (this.noteLine) this.noteLine.setText('正在停下……已经写进去的书都保留着。');
        });
    }

    /**
     * 推进到第 done 本并写上书名，等界面真的画出来再放行。
     *
     * 等一帧是必须的：紧接着的取数虽然是 await，但本机来源（Kindle、苹果图书）
     * 可能在一个微任务里就返回了，那样浏览器从头到尾没有机会重绘，
     * 进度条会一直停在 0% 直到整批跑完。
     */
    async advance(done: number, title: string): Promise<void> {
        if (this.titleLine) {
            this.titleLine.setText(`${done} / ${this.plan.total}　《${title}》`);
        }

        if (this.bar) {
            const ratio = this.plan.total ? done / this.plan.total : 1;

            this.bar.style.width = `${Math.round(ratio * 100)}%`;
        }

        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }

    /** 最近一条交代（某本失败了、某本正开着没写），只留最后一条 */
    note(text: string): void {
        if (this.noteLine) this.noteLine.setText(text);
    }

    // ============================================================
    // 态三：结果
    // ============================================================

    /**
     * 跑完了：把账目摆出来，并给一个直接打开报告的按钮。
     *
     * 他中途按 Esc 关了窗时，导入仍然跑完了——那份账目和那条报告链接是这次运行
     * 唯一的产物，不能因为窗关着就丢掉，所以这里会把窗重新打开。
     */
    showResult(lines: readonly LibraryImportSummaryLine[], openReport: (() => void) | null): void {
        this.finished = true;
        this.phase = 'result';
        this.result = { lines, openReport };

        if (this.showing) this.renderResult();
        else this.open();
    }

    private renderResult(): void {
        const { lines, openReport } = this.result ?? { lines: [], openReport: null };

        this.titleEl.setText(this.cancelled ? '已停止' : '导入完成');
        this.contentEl.empty();

        const card = this.card();

        for (const line of lines) this.row(card, line.label, line.value, line.warn);

        const bar = this.buttonBar();

        if (openReport) {
            new ButtonComponent(bar).setButtonText('打开报告').onClick(() => {
                this.close();
                openReport();
            });
        }

        new ButtonComponent(bar)
            .setButtonText('知道了')
            .setCta()
            .onClick(() => this.close());
    }

    // ============================================================
    // 画法
    // ============================================================

    private card(): HTMLElement {
        const card = this.contentEl.createDiv();

        card.style.padding = '12px 14px';
        card.style.borderRadius = '10px';
        card.style.background = 'var(--background-secondary)';
        card.style.border = '1px solid var(--background-modifier-border)';

        return card;
    }

    private row(host: HTMLElement, label: string, value: string, strong = false): void {
        const row = host.createDiv();

        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.padding = '4px 0';
        row.style.lineHeight = '1.7';

        const name = row.createDiv({ text: label });

        name.style.flex = '0 0 72px';
        name.style.color = 'var(--text-muted)';

        const body = row.createDiv({ text: value });

        body.style.flex = '1';
        body.style.wordBreak = 'break-all';

        if (strong) body.style.fontWeight = '600';
    }

    private hint(text: string): void {
        const line = this.contentEl.createDiv({ text });

        line.style.marginTop = '12px';
        line.style.fontSize = '0.85em';
        line.style.lineHeight = '1.7';
        line.style.color = 'var(--text-muted)';
    }

    private buttonBar(): HTMLElement {
        const bar = this.contentEl.createDiv();

        bar.style.display = 'flex';
        bar.style.justifyContent = 'flex-end';
        bar.style.gap = '8px';
        bar.style.marginTop = '18px';

        return bar;
    }

    /** 确认态只结算一次；之后的关闭不再触碰那个 Promise */
    private settle(value: boolean): void {
        const resolve = this.resolver;

        this.resolver = null;
        resolve?.(value);
    }
}
