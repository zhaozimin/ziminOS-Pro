/**
 * [INPUT]: 无。本文件不 import 任何模块，是本机设备配置的事实叶子
 * [OUTPUT]: 对外提供 FILE_PATH_SCOPES/FILE_PATH_DEFAULTS 与 FilePathScope，
 *           以及 Eagle 回环伴侣的 EAGLE_DEFAULTS/EAGLE_PORT_RANGE
 * [POS]: core 的设备契约层；从全局业务字典中分出只随本机交互变化的参数，
 *        让设置验形、设置界面与 Eagle 协议共用一份且不引入模块反向依赖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 状态栏路径的本机去处
// ============================================================

/**
 * 点一下状态栏路径，复制走的是库内路径还是本机绝对路径。
 *
 * 默认 `vault` 与 v0.20.0 之前的唯一行为相同，升级不会替用户改他没选过的东西。
 */
export const FILE_PATH_SCOPES = ['vault', 'system'] as const;

export type FilePathScope = (typeof FILE_PATH_SCOPES)[number];

export const FILE_PATH_DEFAULTS = {
    scope: 'vault',
} as const;

// ============================================================
// Eagle 回环伴侣
// ============================================================

/** 端口只是设备上的寻址手段，绝不写进 Markdown 身份链接 */
export const EAGLE_DEFAULTS = {
    port: 23119,
    folderId: '',
} as const;

/** 避开需要管理员权限的系统端口，上限遵守 TCP 端口契约 */
export const EAGLE_PORT_RANGE = {
    min: 1024,
    max: 65535,
} as const;
