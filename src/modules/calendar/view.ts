/**
 * [INPUT]: 依赖 obsidian 的 ItemView/WorkspaceLeaf/App 公开视图 API；依赖 core/commands 的日历命令与图标，
 *          core/constants 的 PeriodKey；依赖 ./model 的月历计算与 ./holidays 的最后可用数据服务
 * [OUTPUT]: 对外提供 registerCalendar（注册常驻日历视图、Dust 式年/季/月独立导航、
 *           「今」全局回归当日月视图、打开命令与默认右侧栏入口）及 CalendarPeriodOpener /
 *           CalendarNoteProbe 两个注入契约
 * [POS]: calendar 模块的唯一呈现层。头部只管“看哪个时间”，标题与网格只发出“写这个周期”意图；
 *        真正的模板、目录与写盘仍由 main 注入的 opener 统一实现，不分叉第二套周期笔记系统
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ItemView, TFile } from 'obsidian';
import type { App, WorkspaceLeaf } from 'obsidian';
import { OPEN_CALENDAR_COMMAND } from '../../core/commands';
import type { PeriodKey } from '../../core/constants';
import type { ZiminosContext } from '../../core/types';
import { HolidayService } from './holidays';
import type { HolidayYearStatus } from './holidayTypes';
import { isoDay, monthGrid, shiftMonth } from './model';
import type { CalendarDay } from './model';

export const CALENDAR_VIEW_TYPE = 'ziminos-calendar';

/** calendar 不认识 review；main 用 review.openPeriodNote 填这个洞 */
export type CalendarPeriodOpener = (period: PeriodKey, anchorDay: string) => Promise<void>;

/**
 * 这一天（或这一周）的复盘写没写过。
 *
 * 它与 opener 是同一条路数的第二个洞：目录规则、文件名格式、设置里那个根目录，
 * 全归 review 管；日历只想知道「这一格要不要涂绿」，不该为此学会一套路径规则——
 * 学了就会有第二处对「日记住哪儿」的理解，而两处迟早不一致。
 */
export type CalendarNoteProbe = (period: PeriodKey, anchorDay: string) => boolean;

type CalendarMode = 'month' | 'year';

/** 注册视图、命令，并在布局就绪后把日历安静放进右侧栏 */
export function registerCalendar(
    ctx: ZiminosContext,
    openPeriod: CalendarPeriodOpener,
    hasNote: CalendarNoteProbe,
): void {
    const holidays = new HolidayService(ctx);

    ctx.plugin.registerView(
        CALENDAR_VIEW_TYPE,
        (leaf) => new ZiminosCalendarView(leaf, holidays, openPeriod, hasNote),
    );

    ctx.commands.register(OPEN_CALENDAR_COMMAND, () => {
        void revealCalendar(ctx.app, true).catch(() => undefined);
    });

    ctx.app.workspace.onLayoutReady(() => {
        // active=false：默认展开右侧栏但不抢走编辑器焦点；功能始终注册，不提供关闭开关
        void revealCalendar(ctx.app, false).catch(() => undefined);
    });
}

async function revealCalendar(app: App, active: boolean): Promise<void> {
    await app.workspace.ensureSideLeaf(CALENDAR_VIEW_TYPE, 'right', {
        active,
        reveal: true,
        split: false,
    });
}

class ZiminosCalendarView extends ItemView {
    private readonly holidays: HolidayService;
    private readonly openPeriod: CalendarPeriodOpener;
    private mode: CalendarMode = 'month';
    private year: number;
    private month: number;
    private unsubscribe: (() => void) | null = null;
    private readonly hasNote: CalendarNoteProbe;
    /** 笔记增删改名后重画的防抖句柄；无定时器、无轮询，只在真有事发生时排一次 */
    private repaint: number | null = null;

    constructor(
        leaf: WorkspaceLeaf,
        holidays: HolidayService,
        openPeriod: CalendarPeriodOpener,
        hasNote: CalendarNoteProbe,
    ) {
        super(leaf);
        this.holidays = holidays;
        this.openPeriod = openPeriod;
        this.hasNote = hasNote;

        const today = new Date();

        this.year = today.getFullYear();
        this.month = today.getMonth() + 1;
    }

    getViewType(): string {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText(): string {
        return '中国日历';
    }

    getIcon(): string {
        // 视图可能在热重载时早于 ribbon 的自有图标注册，标签页用 Obsidian 内建图标最稳
        return 'calendar-days';
    }

    async onOpen(): Promise<void> {
        this.contentEl.addClass('ziminos-calendar');
        this.unsubscribe = this.holidays.subscribe(() => this.renderCalendar());

        // 「这一天写过没有」是磁盘上的事实，它会在日历之外被改变——
        // 命令建的、右键新建的、手动删掉的。因此听 vault 的三个事件重画一次，
        // 防抖 80ms（与文件夹计数同一个数），无定时器无轮询。
        // 只认 Markdown：附件与文件夹的增删与这件事无关。
        // 三个事件各注册一次而不是用一个循环：vault.on 的重载按事件名给出不同的回调签名，
        // rename 多带一个旧路径，合成一个联合类型就谁的签名都对不上。
        const onChange = (file: unknown): void => {
            if (file instanceof TFile && file.extension === 'md') this.scheduleRepaint();
        };

        this.registerEvent(this.app.vault.on('create', onChange));
        this.registerEvent(this.app.vault.on('delete', onChange));
        this.registerEvent(this.app.vault.on('rename', onChange));

        this.renderCalendar();
        void this.holidays.refreshCalendarYear(this.year);
    }

    async onClose(): Promise<void> {
        this.unsubscribe?.();
        this.unsubscribe = null;

        if (this.repaint !== null) window.clearTimeout(this.repaint);
        this.repaint = null;
        this.contentEl.empty();
    }

    /**
     * 点一格＝写这一段复盘。写完立刻重画：那一格该当场变绿。
     *
     * 不靠上面那三个 vault 事件兜住这条路，是因为它们只在**新建**时触发；
     * 点一格更常见的结果是「那篇已经在了，只是打开它」——那时没有任何事件，
     * 而用户仍然期待看见自己刚点过的那一格是绿的（它本来就该是）。
     *
     * 名字里那三个多余的字是一次事故的赔款。它上一版就叫 `open`，而 `View.prototype`
     * **自己有一个 `open`**——Obsidian 打开视图时调的正是它。我们的同名方法把它盖掉，
     * 于是宿主调进来、拿到 undefined 的周期、在 `period.label` 上抛异常，
     * 日历整个开不出来：右侧栏一片空白，编译期一个字都不报。
     * 它不报是因为 `obsidian.d.ts`（8482 行）里根本没写这个成员——
     * **声明文件是宿主答应支持的那一部分，不是它运行时真有的那一部分**。
     * 继承宿主的类时，方法名只能取那些不可能是框架词汇的：
     * `openAndRepaint` 同时说出了做什么与做完之后怎样，`open` 只是个通用动词。
     */
    private async openAndRepaint(period: PeriodKey, anchorDay: string): Promise<void> {
        await this.openPeriod(period, anchorDay);
        this.renderCalendar();
    }

    private scheduleRepaint(): void {
        if (this.repaint !== null) window.clearTimeout(this.repaint);

        this.repaint = window.setTimeout(() => {
            this.repaint = null;
            this.renderCalendar();
        }, 80);
    }

    private renderCalendar(): void {
        this.contentEl.empty();

        const shell = this.contentEl.createDiv({ cls: 'ziminos-calendar-shell' });

        this.renderHeader(shell);

        if (this.mode === 'month') {
            this.renderMonth(shell);
        } else {
            this.renderYear(shell);
        }

        this.renderStatus(shell, this.holidays.status(this.year));
        void this.holidays.refreshCalendarYear(this.year);
    }

    /**
     * 年、季、月是三个独立坐标，不再让一组“上一个/下一个”随视图改变含义。
     * 标题点击创建对应复盘，左右箭头只导航，两种意图因此不会相互猜测。
     */
    private renderHeader(parent: HTMLElement): void {
        const header = parent.createDiv({ cls: 'ziminos-calendar-header' });
        const firstRow = header.createDiv({ cls: 'ziminos-calendar-header-row' });
        const quarter = Math.ceil(this.month / 3);
        const quarterMonth = (quarter - 1) * 3 + 1;

        this.renderCoordinate(
            firstRow,
            'year',
            `${this.year}年`,
            'yearly',
            `${this.year}-01-01`,
            '创建或打开年复盘',
            '上一年',
            '下一年',
            (direction) => {
                this.year += direction;
            },
        );

        this.renderCoordinate(
            firstRow,
            'quarter',
            `${quarter}季度`,
            'quarterly',
            `${this.year}-${String(quarterMonth).padStart(2, '0')}-01`,
            '创建或打开季度复盘',
            '上一季度',
            '下一季度',
            (direction) => this.shiftVisibleMonth(direction * 3),
        );

        const secondRow = header.createDiv({ cls: 'ziminos-calendar-header-row' });
        const monthAnchor = `${this.year}-${String(this.month).padStart(2, '0')}-01`;

        this.renderCoordinate(
            secondRow,
            'month',
            `${this.month}月`,
            'monthly',
            monthAnchor,
            '创建或打开月复盘',
            '上个月',
            '下个月',
            (direction) => this.shiftVisibleMonth(direction),
        );

        const controls = secondRow.createDiv({ cls: 'ziminos-calendar-header-controls' });
        const today = new Date();
        const todayButton = this.makeButton(
            controls,
            '今',
            '回到今天',
            'ziminos-calendar-today',
            () => {
                this.year = today.getFullYear();
                this.month = today.getMonth() + 1;
                // 「今」是全局逃生口：不管从哪一年、哪个视图出发，都回到可直接点日记的今天
                this.mode = 'month';
                this.renderCalendar();
            },
        );

        todayButton.toggleClass(
            'is-current',
            this.year === today.getFullYear() && this.month === today.getMonth() + 1,
        );

        this.makeButton(
            controls,
            this.mode === 'month' ? '月' : '年',
            this.mode === 'month' ? '切换到年视图' : '切换到月视图',
            'ziminos-calendar-view-toggle',
            () => {
                this.mode = this.mode === 'month' ? 'year' : 'month';
                this.renderCalendar();
            },
        );
    }

    private renderCoordinate(
        parent: HTMLElement,
        kind: 'year' | 'quarter' | 'month',
        label: string,
        period: PeriodKey,
        anchor: string,
        title: string,
        previousTitle: string,
        nextTitle: string,
        shift: (direction: -1 | 1) => void,
    ): void {
        const coordinate = parent.createDiv({ cls: `ziminos-calendar-coordinate is-${kind}` });

        this.makeButton(coordinate, '‹', previousTitle, 'ziminos-calendar-stepper', () => {
            shift(-1);
            this.renderCalendar();
        });

        const labelButton = this.makePeriodButton(coordinate, label, period, anchor, title);

        labelButton.addClass('ziminos-calendar-coordinate-label');

        this.makeButton(coordinate, '›', nextTitle, 'ziminos-calendar-stepper', () => {
            shift(1);
            this.renderCalendar();
        });
    }

    private shiftVisibleMonth(amount: number): void {
        const shifted = shiftMonth(this.year, this.month, amount);

        this.year = shifted.year;
        this.month = shifted.month;
    }

    private renderMonth(parent: HTMLElement): void {
        const grid = parent.createDiv({ cls: 'ziminos-calendar-grid' });

        for (const label of ['周', '一', '二', '三', '四', '五', '六', '日']) {
            grid.createDiv({ cls: 'ziminos-calendar-weekday', text: label });
        }

        for (const week of monthGrid(this.year, this.month)) {
            const weekButton = this.makeButton(
                grid,
                String(week.weekNumber),
                `创建或打开 ${week.weekYear} 年第 ${week.weekNumber} 周复盘`,
                'ziminos-calendar-week',
                () => void this.openAndRepaint('weekly', week.anchor),
            );

            weekButton.setAttribute('aria-label', `${week.weekYear} 年第 ${week.weekNumber} 周`);
            weekButton.toggleClass('has-note', this.hasNote('weekly', week.anchor));

            for (const day of week.days) this.renderDay(grid, day);
        }
    }

    private renderDay(parent: HTMLElement, day: CalendarDay): void {
        const holiday = this.holidays.day(day.date);
        const button = this.makeButton(
            parent,
            '',
            this.dayTitle(day, holiday?.name ?? '', holiday?.isOffDay ?? null),
            'ziminos-calendar-day',
            () => void this.openAndRepaint('daily', day.date),
        );

        button.toggleClass('is-other-month', !day.inMonth);
        button.toggleClass('is-today', day.isToday);
        // 「今天」与「写过了」是两个互不排斥的事实，所以是两个类而不是三选一的状态：
        // 今天也可能已经写完，而那恰恰是最该一眼看见的一格。
        button.toggleClass('has-note', this.hasNote('daily', day.date));
        button.toggleClass('is-weekend', day.weekday >= 6 && !holiday);
        button.toggleClass('is-rest-day', holiday?.isOffDay === true);
        button.toggleClass('is-work-day', holiday?.isOffDay === false);
        button.toggleClass(
            'is-special-day',
            day.lunar.kind === 'festival' || day.lunar.kind === 'solar-term',
        );

        const top = button.createSpan({ cls: 'ziminos-calendar-day-top' });

        top.createSpan({ cls: 'ziminos-calendar-solar', text: String(day.day) });

        if (holiday) {
            top.createSpan({
                cls: `ziminos-calendar-badge ${holiday.isOffDay ? 'is-rest' : 'is-work'}`,
                text: holiday.isOffDay ? '休' : '班',
            });
        }

        button.createSpan({ cls: 'ziminos-calendar-lunar', text: day.lunar.short || ' ' });
    }

    private renderYear(parent: HTMLElement): void {
        const quarters = parent.createDiv({ cls: 'ziminos-calendar-year-grid' });

        for (let quarter = 1; quarter <= 4; quarter += 1) {
            const section = quarters.createDiv({ cls: 'ziminos-calendar-quarter' });
            const firstMonth = (quarter - 1) * 3 + 1;
            const anchor = `${this.year}-${String(firstMonth).padStart(2, '0')}-01`;

            const quarterButton = this.makePeriodButton(
                section,
                `${quarter}季度`,
                'quarterly',
                anchor,
                '创建或打开季度复盘',
            );

            quarterButton.toggleClass('is-selected', quarter === Math.ceil(this.month / 3));

            const months = section.createDiv({ cls: 'ziminos-calendar-quarter-months' });

            for (let offset = 0; offset < 3; offset += 1) {
                const month = firstMonth + offset;
                const monthAnchor = `${this.year}-${String(month).padStart(2, '0')}-01`;

                const monthButton = this.makePeriodButton(
                    months,
                    `${month}月`,
                    'monthly',
                    monthAnchor,
                    '创建或打开月复盘',
                );

                monthButton.toggleClass('is-selected', month === this.month);
            }
        }
    }

    private renderStatus(parent: HTMLElement, status: HolidayYearStatus): void {
        const row = parent.createDiv({ cls: 'ziminos-calendar-status' });

        if (!status.hasSchedule) {
            row.setText(`${this.year} 年调休安排待公布，联网时自动补齐`);

            return;
        }

        if (status.lastCheckedAt) {
            const checked = new Date(status.lastCheckedAt).toLocaleDateString('zh-CN');

            row.setText(`国务院放假安排已于 ${checked} 自动核验`);
        } else {
            row.setText('正在后台核验国务院放假安排');
        }
    }

    private makePeriodButton(
        parent: HTMLElement,
        label: string,
        period: PeriodKey,
        anchor: string,
        title: string,
    ): HTMLButtonElement {
        return this.makeButton(
            parent,
            label,
            title,
            'ziminos-calendar-period',
            () => void this.openPeriod(period, anchor),
        );
    }

    private makeButton(
        parent: HTMLElement,
        label: string,
        title: string,
        className: string,
        onClick: () => void,
    ): HTMLButtonElement {
        const button = parent.createEl('button', {
            cls: className,
            text: label,
            attr: { title, 'aria-label': title },
        });

        button.type = 'button';
        button.addEventListener('click', onClick);

        return button;
    }

    private dayTitle(day: CalendarDay, holidayName: string, isOffDay: boolean | null): string {
        const parts = [day.date];

        if (day.lunar.full) parts.push(`农历${day.lunar.full}`);
        if (holidayName) parts.push(`${holidayName}（${isOffDay ? '放假' : '补班'}）`);

        return parts.join(' · ');
    }
}
