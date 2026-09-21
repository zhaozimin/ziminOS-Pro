/**
 * [INPUT]: 依赖 obsidian 的 Modal/FuzzySuggestModal 基类、ButtonComponent 与 App 类型
 * [OUTPUT]: 对外提供 TextInputOptions 配置与 TextInputModal 弹窗类（openAndGetValue，可设必填：
 *           空白提交留在原窗补，不结算）、
 *           TextAreaOptions 配置与 TextAreaModal 多行粘贴弹窗（openAndGetValue），
 *           以及 ChoiceModal 选择弹窗（openAndGetChoice）
 * [POS]: core 的唯一人机问答通道，取代原脚本对 QuickAdd inputPrompt 的依赖。
 *        它把「弹窗生命周期」翻译成一个 Promise：有输入返回文本，取消返回 null，
 *        调用方因此可以用一条 if 判断中止流程，无需关心 DOM 与事件。
 *        两个弹窗的分工是一条纪律而非口味：凡取值来自封闭集合（分层、方向、去/来、状态、
 *        产品、渠道、选人）一律走 ChoiceModal。实测证据是硬的——用自由文本问「今天做了什么」，
 *        34 篇日记收到 34 个「123123」类垃圾，而垃圾能通过一切非空校验并作为事实进入汇总表。
 *        枚举让垃圾在语法上不可能产生，这比任何校验都可靠。
 *        必填是另一回事：它不防垃圾，只防「空着走过去」——建档时那句简介空着，
 *        档案在选人列表里就只剩一个名字。必填拦下的是空白而不是取消，走不走永远由人决定。
 *        样式只用 Obsidian 原生组件与极少量内联样式，不引入 styles.css
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ButtonComponent, FuzzySuggestModal, Modal } from 'obsidian';
import type { App } from 'obsidian';

/** 文本输入弹窗的配置 */
export interface TextInputOptions {
    /** 弹窗标题，同时充当提问语 */
    title: string;
    /** 标题下的一行说明，弱化显示；不传就不画。占位提示一打字就消失，要一直看得见的话写在这里 */
    hint?: string;
    /** 输入框占位提示 */
    placeholder?: string;
    /** 输入框初始值，打开时自动全选，便于直接覆写 */
    initial?: string;
    /**
     * 必填时的提示语。给了它，空白（含全是空格）提交不关窗、不结算，只在输入框下方说这一句，
     * 人留在原窗补上即可——这一问之前的几步回答都还在，逼他重跑整条命令才是真正的惩罚。
     * 取消（Esc / 遮罩 / 取消按钮）照旧返回 null：必填约束的是「交什么」，不是「能不能走」。
     */
    required?: string;
}

/**
 * 单行文本输入弹窗。
 * 回车或点击「确认」提交输入原文（不做 trim，是否修剪由调用方按各自语义决定）；
 * 设了 required 时空白提交被当场拦下，弹窗不关；
 * 点击「取消」、按 Esc、点击遮罩关闭，一律返回 null。
 */
export class TextInputModal extends Modal {
    private readonly options: TextInputOptions;

    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    private resolver: ((value: string | null) => void) | null = null;

    /** 是否已经结算过。关闭动作与提交动作都会走到结算，用它保证只生效一次 */
    private settled = false;

    constructor(app: App, options: TextInputOptions) {
        super(app);
        this.options = options;
    }

    /** 打开弹窗并等待用户作答：有输入返回文本，取消返回 null */
    openAndGetValue(): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        this.titleEl.setText(this.options.title);
        this.contentEl.empty();

        if (this.options.hint) renderHint(this.contentEl, this.options.hint);

        const inputEl = this.contentEl.createEl('input', {
            type: 'text',
            value: this.options.initial ?? '',
            placeholder: this.options.placeholder ?? '',
        });
        inputEl.style.width = '100%';

        const required = this.options.required;
        // 提示位预先占好、平时收起：拦下时才现身，位置紧贴输入框，而不是被追加到按钮栏之后
        const errorEl = required ? this.contentEl.createEl('p') : null;

        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.style.margin = '8px 0 0';
            errorEl.style.color = 'var(--text-error)';
        }

        // 必填挡在唯一的提交口上：回车与确认按钮走同一条路，不会一条拦了另一条漏了
        const attempt = (): void => {
            if (required && errorEl && !inputEl.value.trim()) {
                errorEl.setText(required);
                errorEl.style.display = '';
                inputEl.focus();

                return;
            }

            this.submit(inputEl.value);
        };

        // 一开始改就把提示收起：它说的是上一次提交，不是此刻正在写的这一句
        if (errorEl) {
            inputEl.addEventListener('input', () => {
                errorEl.style.display = 'none';
            });
        }

        // 回车即提交；输入法组合期间的回车属于选词，必须放行
        inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.isComposing) return;

            event.preventDefault();
            attempt();
        });

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '16px';

        // 取消不需要单独结算：关闭弹窗会走 onClose，在那里统一结算为 null
        new ButtonComponent(buttonBar)
            .setButtonText('取消')
            .onClick(() => this.close());

        new ButtonComponent(buttonBar)
            .setButtonText('确认')
            .setCta()
            .onClick(attempt);

        inputEl.focus();
        inputEl.select();
    }

    onClose(): void {
        // Esc、遮罩点击、取消按钮最终都汇到这里；已提交过则此次结算无效
        this.settle(null);
        this.contentEl.empty();
    }

    /** 提交输入并关闭：先结算再关闭，onClose 里的兜底结算自然失效 */
    private submit(value: string): void {
        this.settle(value);
        this.close();
    }

    /** 唯一结算点，保证 Promise 只被兑现一次 */
    private settle(value: string | null): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);
    }
}

/** 多行粘贴弹窗的配置 */
export interface TextAreaOptions {
    /** 弹窗标题，同时充当提问语 */
    title: string;
    /** 标题下的一行说明，弱化显示；不传就不画 */
    hint?: string;
    /** 文本域占位提示 */
    placeholder?: string;
}

/**
 * 多行文本粘贴弹窗，为「把一大段导出文本交给插件」这类动作而生。
 *
 * 与 TextInputModal 分成两个类而不是一个开关，是因为两者的回车语义相反：
 * 单行弹窗里回车即提交，多行弹窗里回车是换行——粘贴进来的文本自己就带换行，
 * 提交改由 Cmd/Ctrl+Enter 或「确认」按钮承担。取消语义与其余弹窗一致：
 * Esc、遮罩、取消按钮一律返回 null，调用方仍然一条 if 就能中止流程。
 */
export class TextAreaModal extends Modal {
    private readonly options: TextAreaOptions;

    /** Promise 的 resolve 句柄；结算后置空，避免重复结算与引用滞留 */
    private resolver: ((value: string | null) => void) | null = null;

    /** 是否已经结算过。关闭动作与提交动作都会走到结算，用它保证只生效一次 */
    private settled = false;

    constructor(app: App, options: TextAreaOptions) {
        super(app);
        this.options = options;
    }

    /** 打开弹窗并等待用户作答：有输入返回文本，取消返回 null */
    openAndGetValue(): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    onOpen(): void {
        this.titleEl.setText(this.options.title);
        this.contentEl.empty();

        if (this.options.hint) renderHint(this.contentEl, this.options.hint);

        const textareaEl = this.contentEl.createEl('textarea', {
            placeholder: this.options.placeholder ?? '',
        });
        textareaEl.rows = 12;
        textareaEl.style.width = '100%';
        textareaEl.style.resize = 'vertical';

        // Cmd/Ctrl+Enter 提交；裸回车留给换行，输入法组合期间的回车照旧属于选词
        textareaEl.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.isComposing) return;
            if (!event.metaKey && !event.ctrlKey) return;

            event.preventDefault();
            this.submit(textareaEl.value);
        });

        const buttonBar = this.contentEl.createDiv();
        buttonBar.style.display = 'flex';
        buttonBar.style.justifyContent = 'flex-end';
        buttonBar.style.gap = '8px';
        buttonBar.style.marginTop = '16px';

        // 取消不需要单独结算：关闭弹窗会走 onClose，在那里统一结算为 null
        new ButtonComponent(buttonBar)
            .setButtonText('取消')
            .onClick(() => this.close());

        new ButtonComponent(buttonBar)
            .setButtonText('确认')
            .setCta()
            .onClick(() => this.submit(textareaEl.value));

        textareaEl.focus();
    }

    onClose(): void {
        // Esc、遮罩点击、取消按钮最终都汇到这里；已提交过则此次结算无效
        this.settle(null);
        this.contentEl.empty();
    }

    /** 提交输入并关闭：先结算再关闭，onClose 里的兜底结算自然失效 */
    private submit(value: string): void {
        this.settle(value);
        this.close();
    }

    /** 唯一结算点，保证 Promise 只被兑现一次 */
    private settle(value: string | null): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);
    }
}

/** 标题下那行弱化说明：单行与多行两个弹窗同一种画法，只写一份 */
function renderHint(container: HTMLElement, hint: string): void {
    const hintEl = container.createEl('p', { text: hint });
    hintEl.style.margin = '0 0 10px';
    hintEl.style.color = 'var(--text-muted)';
    hintEl.style.lineHeight = '1.6';
}

/** 选择弹窗的配置 */
export interface ChoiceOptions<T> {
    /** 提问语，显示在搜索框的占位处 */
    title: string;
    /** 候选项 */
    items: readonly T[];
    /** 候选项怎么显示成一行文字 */
    labelOf: (item: T) => string;
}

/**
 * 从封闭集合里选一个。
 *
 * 与 TextInputModal 共守同一条取消语义：选中返回那一项，Esc / 遮罩 / 关闭一律返回 null，
 * 调用方仍然只需一条 if 就能中止整条流程，不必为「选择」再学一套写法。
 */
export class ChoiceModal<T> extends FuzzySuggestModal<T> {
    private readonly options: ChoiceOptions<T>;

    private resolver: ((value: T | null) => void) | null = null;

    private settled = false;

    constructor(app: App, options: ChoiceOptions<T>) {
        super(app);
        this.options = options;
        this.setPlaceholder(options.title);
    }

    /** 打开弹窗并等待用户作答：选中返回该项，取消返回 null */
    openAndGetChoice(): Promise<T | null> {
        return new Promise<T | null>((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    getItems(): T[] {
        return [...this.options.items];
    }

    getItemText(item: T): string {
        return this.options.labelOf(item);
    }

    onChooseItem(item: T): void {
        this.settle(item);
    }

    /**
     * 关闭即取消——但不能立刻断定。
     *
     * Obsidian 的 SuggestModal 在用户选中一项时，是**先关闭弹窗、再回调 onChooseItem**。
     * 若在这里同步结算成 null，每一次正常选择都会先被判成取消，随后的 onChooseItem
     * 因为 settle 幂等而失效——表现就是四条走选择的命令永远只说「已取消」。
     * 推迟一拍再结算，选中回调便有机会先落定；真正的取消（Esc / 遮罩）没有后续回调，
     * 一拍之后照样结算成 null。顺序在两种路径下都成立，不依赖基类的实现细节。
     */
    onClose(): void {
        super.onClose();
        window.setTimeout(() => this.settle(null), 0);
    }

    /** 唯一结算点，保证 Promise 只被兑现一次 */
    private settle(value: T | null): void {
        if (this.settled) return;

        this.settled = true;

        const resolve = this.resolver;
        this.resolver = null;

        if (resolve) resolve(value);
    }
}
