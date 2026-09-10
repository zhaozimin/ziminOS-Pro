/**
 * [INPUT]: 依赖 core/constants 的 CONTACT_FOLDER/CONTACT_MOC/TEMPLATE_FILES，
 *          core/folders 的 normalizeFolderPath，core/time 的 nowStampAndUid，
 *          core/types 的 ZiminosContext 与 VaultSeed；依赖 ./templates 的两个生成器
 * [OUTPUT]: 对外提供 contactsSeed（人脉模块对开荒的全部诉求）
 * [POS]: 人脉模块面向开荒的窗口：一个平铺存放档案的目录、一份 type 留空的模板、一张总控台 MOC。
 *        客户保持独立模板与独立 seed，main 在同一次默认开荒中同时收齐两份贡献；
 *        两个物种因此不揉进一份实现，又能保证两张地图同时出现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { CONTACT_FOLDER, CONTACT_MOC, TEMPLATE_FILES } from '../../core/constants';
import { normalizeFolderPath } from '../../core/folders';
import { nowStampAndUid } from '../../core/time';
import type { VaultSeed, ZiminosContext } from '../../core/types';
import { basenameOf, contactMocContent, personTemplateFile } from './templates';

/** 人脉模块的开荒贡献 */
export function contactsSeed(ctx: ZiminosContext): VaultSeed {
    const folder = normalizeFolderPath(ctx.settings.contactFolder, CONTACT_FOLDER);
    const { stamp, uid } = nowStampAndUid(ctx.settings.dateTimeFormat);

    return {
        folders: [folder],
        notes: [
            { path: TEMPLATE_FILES.person, content: personTemplateFile() },
            { path: `${folder}/${basenameOf(CONTACT_MOC)}.md`, content: contactMocContent(stamp, uid) },
        ],
    };
}
