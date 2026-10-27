/**
 * [INPUT]: 依赖 obsidian 的 normalizePath 与 App 类型；依赖 core/constants 的 MOC_PREFIX
 * [OUTPUT]: 对外提供 mocBasenameOf / mocPathOf / legacyMocPathOf / resolveMocPath
 * [POS]: 项目、领域与资源的 MOC 命名规则唯一出处。
 *        建容器、卡片归属、状态流转与文件树置顶共用本文件。
 *        main 将解析能力注入 explorer，不让两个模块直接互相依赖。
 *        MOC 内嵌 Base 自 v0.22.7 起用 this.file.asLink() 识别宿主，不再消费文件名约定。
 *        V3 起命名是 `MOC-文件夹名`，为的是让学员在文件树里一眼认出哪篇是总览；
 *        但 V3 之前建的项目叫 `文件夹名.md`，那些笔记不会被改名，
 *        所以读取侧一律走 resolveMocPath：先认新名，认不到再认老名
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { normalizePath } from 'obsidian';
import type { App } from 'obsidian';
import { MOC_PREFIX } from '../../core/constants';

/**
 * MOC 笔记的文件名（不含扩展名）。
 * 卡片的 up 会指向这个名字；MOC 内嵌 Base 则通过 this.file.asLink() 读取宿主链接，
 * 因而项目改名或搬家不再要求同步改写 Base 代码。
 */
export function mocBasenameOf(containerName: string): string {
    return `${MOC_PREFIX}${containerName}`;
}

/** 新建时该落在哪个路径 */
export function mocPathOf(folderPath: string, containerName: string): string {
    return normalizePath(`${folderPath}/${mocBasenameOf(containerName)}.md`);
}

/** V3 之前的老命名：与文件夹同名。只在读取侧使用，绝不用它建新文件 */
export function legacyMocPathOf(folderPath: string, containerName: string): string {
    return normalizePath(`${folderPath}/${containerName}.md`);
}

/**
 * 认出一个既有文件夹里的 MOC 该是哪个路径。
 *
 * 新名优先，老名兜底，两个都不存在时返回新名——这个回落顺序对读取侧的四个消费方都成立：
 * 卡片登记要拿它排除「MOC 自己不是卡片」并拼 up 链接（文件还没建出来时也得有个确定答案），
 * 流转要拿它判断「当前打开的是不是这个项目的 MOC」。
 * 先查新名而不是先查老名，是因为一个文件夹里两种名字同时存在时，新的那篇才是当前约定。
 */
export function resolveMocPath(app: App, folderPath: string, containerName: string): string {
    const current = mocPathOf(folderPath, containerName);

    if (app.vault.getAbstractFileByPath(current)) return current;

    const legacy = legacyMocPathOf(folderPath, containerName);

    if (app.vault.getAbstractFileByPath(legacy)) return legacy;

    return current;
}
