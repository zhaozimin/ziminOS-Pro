/**
 * [INPUT]: 依赖 core/constants 的 NAV_FILE/TEMPLATE_FILES、core/types 的 VaultSeed；
 *          依赖 ./templates 的三个生成器
 * [OUTPUT]: 对外提供 projectsSeed（本模块对开荒的全部诉求）
 * [POS]: 项目管理模块面向开荒的唯一窗口。开荒模块不认识「项目」这个概念，
 *        它只认 VaultSeed 契约；本文件把「两份手动插入用的模板 + 导航页」翻译成那份契约。
 *        分出这个薄文件的理由是依赖方向：
 *        开荒一旦反过来 import 本模块，「模块之间彼此不认识」就破了，
 *        而那条不变式正是「加一个模块只需在 main 多一行」的前提
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NAV_FILE, TEMPLATE_FILES } from '../../core/constants';
import type { VaultSeed } from '../../core/types';
import { cardTemplateFile, mocTemplateFile, navContent } from './templates';

/**
 * 项目管理模块的开荒贡献。
 * 不申报任何目录：01-projects 与 90-system/Template 是 PARA 骨架的一部分，
 * 由笔记库本身保证存在，不因某个模块存在而存在。
 *
 * v0.19.0 起它**不再开第一个项目**。那一步原本要弹一个输入框问用户的名字，
 * 而那恰恰是他刚点完「初始化」、正等着看结果的一瞬间——一个凭空出现、
 * 还问他要东西的弹窗，把「装好了」变成了「怎么又要我填」。
 * 开荒的职责到骨架为止；建项目本来就有一条命令，他想建随时能建。
 * 收尾改为一次礼花（见 modules/setup/celebrate）：同样是告诉他成了，
 * 但不索取、不阻塞、不需要他做任何决定。
 */
export function projectsSeed(): VaultSeed {
    return {
        folders: [],
        notes: [
            { path: TEMPLATE_FILES.card, content: cardTemplateFile() },
            { path: TEMPLATE_FILES.moc, content: mocTemplateFile() },
            { path: NAV_FILE, content: navContent() },
        ],
    };
}
