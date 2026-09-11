/**
 * [INPUT]: 依赖 obsidian 的 App/Modal/Setting 公开界面原语，依赖 ./layout 的导出选项契约
 * [OUTPUT]: 对外提供 ExportOptionsModal，调用方通过 openAndGetValue 一次取得格式与三类装饰文本
 * [POS]: 导出模块唯一的人机交互面。它只收选择、不碰文件、不开始渲染；Esc、遮罩与取消
 *        全部收敛为 null，使“没导出”在调用侧只有一种语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Modal, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type { ExportFormat, ExportOptions } from './layout';

export class ExportOptionsModal extends Modal {
    private readonly initial: ExportOptions;
    private value: ExportOptions;
    private resolver: ((value: ExportOptions | null) => void) | null = null;

    constructor(app: App, initial: ExportOptions) {
        super(app);

        this.initial = initial;
        this.value = { ...initial };
    }

    openAndGetValue(): Promise<ExportOptions | null> {
        this.open();

        return new Promise((resolve) => {
            this.resolver = resolve;
        });
    }

    onOpen(): void {
        this.value = { ...this.initial };
        this.titleEl.setText('导出当前笔记');
        this.contentEl.empty();

        this.contentEl.createEl('p', {
            text: '自动按当前文章的完整宽度与高度输出。页眉、页脚、水印留空即关闭；可用 {title}、{date}、{time}。',
        });

        new Setting(this.contentEl)
            .setName('格式')
            .setDesc('PNG 是一整张长图；PDF 是只含一页的完整长页。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('png', 'PNG 长图')
                    .addOption('pdf', 'PDF 单页')
                    .setValue(this.value.format)
                    .onChange((format) => {
                        this.value = { ...this.value, format: format as ExportFormat };
                    });
            });

        this.addTextSetting('页眉', '显示在文章标题上方。', 'header');
        this.addTextSetting('页脚', '显示在文章正文下方。', 'footer');
        this.addTextSetting('水印', '以低透明度在整篇上重复铺开。', 'watermark');

        new Setting(this.contentEl)
            .addButton((button) => {
                button.setButtonText('取消').onClick(() => this.close());
            })
            .addButton((button) => {
                button
                    .setButtonText('导出')
                    .setCta()
                    .onClick(() => {
                        this.settle({ ...this.value });
                        this.close();
                    });
            });
    }

    onClose(): void {
        this.contentEl.empty();
        this.settle(null);
    }

    private addTextSetting(
        name: string,
        description: string,
        key: 'header' | 'footer' | 'watermark',
    ): void {
        new Setting(this.contentEl)
            .setName(name)
            .setDesc(description)
            .addText((text) => {
                text.setPlaceholder('留空即不添加')
                    .setValue(this.value[key])
                    .onChange((value) => {
                        this.value = { ...this.value, [key]: value };
                    });
            });
    }

    private settle(value: ExportOptions | null): void {
        const resolve = this.resolver;

        this.resolver = null;
        resolve?.(value);
    }
}
