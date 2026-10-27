/**
 * [INPUT]: 接收人物身份、六色键与安排的人物顺序。
 * [OUTPUT]: 提供六色配置、稳定默认色与人物优先的颜色归属。
 * [POS]: 大日历颜色模型；人物是绑定颜色的唯一来源。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const COLORS = [
    { key: 'red', name: '红', hex: '#df6464' },
    { key: 'orange', name: '橙', hex: '#dc914e' },
    { key: 'yellow', name: '黄', hex: '#c7ad4c' },
    { key: 'green', name: '绿', hex: '#58a586' },
    { key: 'blue', name: '蓝', hex: '#669bd9' },
    { key: 'purple', name: '紫', hex: '#9b80d6' },
] as const;
export type ColorKey = typeof COLORS[number]['key'];
export interface ColoredPerson { path: string; color: ColorKey }
export function colorKey(value: unknown): ColorKey | undefined { return COLORS.find(c => c.key === value)?.key; }
export function colorHex(value: ColorKey): string { return COLORS.find(c => c.key === value)!.hex; }
export function defaultPersonColor(identity: string): ColorKey {
    let hash = 0;
    for (const char of identity) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
    return COLORS[hash % COLORS.length].key;
}
export function colorAppearance(fallback: unknown, owner: string, paths: string[], people: ColoredPerson[], kind: 'project' | 'area'): { color: ColorKey; colorPerson: string } {
    const colorPerson = paths.includes(owner) ? owner : paths[0] ?? '';
    const person = people.find(p => p.path === colorPerson);
    return { color: person?.color ?? colorKey(fallback) ?? (kind === 'area' ? 'green' : 'purple'), colorPerson };
}
