/**
 * [INPUT]: 依赖 obsidian 的 TFile 类型、core 的命令台与运行时上下文；
 *          依赖同目录 createContainer 的创建流程与 RESOURCE_KIND
 * [OUTPUT]: 对外提供 createResource 与 registerCreateResourceCommand
 * [POS]: 资源容器入口，与项目、领域并列。复用创建流程，
 *        仅由规格声明资源身份与固定 PARA 目录。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TFile } from 'obsidian';
import { PROJECT_COMMANDS } from '../../core/commands';
import type { ZiminosContext } from '../../core/types';
import { createContainer, RESOURCE_KIND } from './createContainer';

/** 询问名称与概述，创建资源文件夹及 MOC；取消或失败时返回 null。 */
export async function createResource(ctx: ZiminosContext): Promise<TFile | null> {
    return createContainer(ctx, RESOURCE_KIND);
}

/** 注册「新建资源」命令，失败提示由共用创建流程给出。 */
export function registerCreateResourceCommand(ctx: ZiminosContext): void {
    ctx.commands.register(PROJECT_COMMANDS.resource, () => {
        void createResource(ctx);
    });
}
