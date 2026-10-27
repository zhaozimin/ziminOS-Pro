/**
 * [INPUT]: 依赖六色配置与调用方提供的当前值、选择回调。
 * [OUTPUT]: 提供弹窗和详情共用的键盘可选六色盘。
 * [POS]: 颜色模型的 DOM 接口；选择本身不写入笔记。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { COLORS, ColorKey, colorHex } from './colors';
export function paintColor(element: HTMLElement, value: ColorKey): void { element.style.setProperty('--zwp-color', colorHex(value)); }
export function colorPalette(parent: HTMLElement, value: ColorKey, choose: (color: ColorKey) => void): { update(color: ColorKey): void; disable(disabled: boolean): void } {
    const root = parent.createDiv({ cls: 'zwp-palette', attr: { role: 'radiogroup', 'aria-label': '时间块颜色' } });
    const buttons = COLORS.map((color, index) => {
        const button = root.createEl('button', { cls: 'zwp-swatch', attr: { role: 'radio', 'aria-label': `${color.name}色`, title: `${color.name}色` } });
        paintColor(button, color.key);
        button.onclick = () => { update(color.key); choose(color.key); };
        button.onkeydown = e => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            const next = (index + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1) + COLORS.length) % COLORS.length;
            buttons[next].focus(); buttons[next].click();
        };
        return button;
    });
    function update(color: ColorKey): void {
        buttons.forEach((button, i) => {
            const selected = COLORS[i].key === color;
            button.setAttribute('aria-checked', String(selected)); button.tabIndex = selected ? 0 : -1;
            button.textContent = selected ? '✓' : '';
        });
    }
    update(value);
    return { update, disable: disabled => buttons.forEach(button => { button.disabled = disabled; }) };
}
