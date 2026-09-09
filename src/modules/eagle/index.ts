/**
 * [INPUT]: 依赖 obsidian Notice、core/modals 的单行输入、core/localPath 的本机路径解算、
 *          core/types 的 ZiminosContext，依赖 main 注入的容器/日记路由解析器，依赖本模块 platform/client/transfer/render
 * [OUTPUT]: 对外提供 EagleSettingActions 与 registerEagleBridge，将附件分类路由、运行时行为及设置页所需操作收成一个边界
 * [POS]: Eagle 模块的唯一入口与局部装配点。main 只知道“注册一个 Eagle 能力”并拿回设置动作，
 *        不认证令牌、协议 URI、临时文件或 DOM 水合的任何细节
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Notice } from 'obsidian';
import { TextInputModal } from '../../core/modals';
import { localPath } from '../../core/localPath';
import type { ZiminosContext } from '../../core/types';
import { EagleBridgeClient } from './client';
import { isSupportedEagleDesktop } from './platform';
import { registerEagleRenderer } from './render';
import { registerEagleTransfers } from './transfer';
import type { EagleRouteResolver } from './transfer';

export interface EagleSettingActions {
    readonly pairEagle: () => Promise<boolean>;
    readonly testEagle: () => Promise<boolean>;
    readonly disconnectEagle: () => Promise<void>;
    readonly describeEagleStatus: () => Promise<string>;
    readonly revealEaglePackage: () => Promise<void>;
}

export function registerEagleBridge(
    ctx: ZiminosContext,
    resolveRoute: EagleRouteResolver,
): EagleSettingActions {
    const client = new EagleBridgeClient(ctx);
    const refreshRenderer = registerEagleRenderer(ctx, client);

    registerEagleTransfers(ctx, client, resolveRoute);

    const desktopOnly = (): boolean => {
        if (isSupportedEagleDesktop()) return true;

        new Notice('Eagle 附件桥接只在 macOS 与 Windows 桌面端工作。');

        return false;
    };

    return {
        pairEagle: async () => {
            if (!desktopOnly()) return false;

            const answer = await new TextInputModal(ctx.app, {
                title: '输入 Eagle 伴侣显示的 6 位配对码',
                placeholder: '例如 482731',
            }).openAndGetValue();
            const code = answer?.trim() ?? '';

            if (!code) return false;
            if (!/^\d{6}$/.test(code)) {
                new Notice('配对码应为 6 位数字。');

                return false;
            }

            try {
                const status = await client.pair(code);

                ctx.settings.eagleEnabled = true;
                await ctx.saveSettings();
                refreshRenderer();
                new Notice(`已连接 Eagle 资源库「${status.libraryName}」`);

                return true;
            } catch (error) {
                new Notice(`Eagle 配对失败：${errorMessage(error)}`, 8000);

                return false;
            }
        },
        testEagle: async () => {
            if (!desktopOnly()) return false;

            try {
                const status = await client.status();

                if (!status.libraryMatched) throw new Error('当前 Eagle 资源库与配对时不同，请重新配对');

                new Notice(`Eagle 连接正常 · ${status.libraryName} · 伴侣 v${status.version}`);

                return true;
            } catch (error) {
                new Notice(`Eagle 连接不可用：${errorMessage(error)}`, 8000);

                return false;
            }
        },
        disconnectEagle: async () => {
            const revokedRemotely = await client.disconnect();

            ctx.settings.eagleEnabled = false;
            await ctx.saveSettings();
            new Notice(revokedRemotely
                ? '已断开 Eagle 伴侣；笔记里已有的身份链接没有被改动。'
                : '已清除 Obsidian 本机凭据；Eagle 伴侣暂时不可达，请在伴侣窗口手动移除这本库的旧授权。', 10000);
        },
        describeEagleStatus: async () => {
            if (!isSupportedEagleDesktop()) return '未启用 · 只支持 macOS / Windows 桌面端';
            if (!client.hasToken()) return '未配对 · 先在 Eagle 中打开伴侣取得 6 位码';

            try {
                const status = await client.status();

                return status.libraryMatched
                    ? `已连接 · ${status.libraryName} · 伴侣 v${status.version}`
                    : '需重新配对 · Eagle 当前打开的资源库已变更';
            } catch (error) {
                return `不可用 · ${errorMessage(error)}`;
            }
        },
        revealEaglePackage: async () => {
            if (!desktopOnly()) return;

            const relative = `${ctx.app.vault.configDir}/plugins/ziminos/ziminOS-Eagle-Bridge.eagleplugin`;

            if (!(await ctx.app.vault.adapter.exists(relative))) {
                new Notice('Eagle 伴侣安装包不在插件目录，请重新升级 ziminOS。');
                return;
            }

            const full = localPath(ctx.app, relative);

            try {
                const shell = (require('electron') as { shell?: { showItemInFolder?: (path: string) => void } }).shell;

                if (!full || typeof shell?.showItemInFolder !== 'function') throw new Error('当前运行时无法打开文件管理器');
                shell.showItemInFolder(full);
            } catch (error) {
                new Notice(`无法显示 Eagle 伴侣安装包：${errorMessage(error)}`, 8000);
            }
        },
    };
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
