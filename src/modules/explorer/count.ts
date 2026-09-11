/**
 * [INPUT]: 依赖 obsidian 的 TFile/TFolder，依赖 core/constants 的 FolderCountTarget 类型
 * [OUTPUT]: 对外提供 FolderTally（一个文件夹里有些什么）、tallyFolders（一趟遍历数完全库）
 *           与 pickCount（按口径从三个数里取出该显示的那一个）
 * [POS]: 文件浏览器计数模块的事实层，零 DOM、零设置、零 Obsidian 界面依赖——
 *        它只回答一个客观问题：这个文件夹里有多少篇笔记、多少个子文件夹、多少个别的文件。
 *        「显示哪一个数」「显示在哪儿」「什么时候重算」全归隔壁 badge.ts，
 *        因此本文件是纯函数，可以单独推理也可以单独换掉。
 *        它刻意**不**排除 90-system：那条「功能目录不参与检索」的纪律服务的是
 *        二十四个知识视图（属性示例里的双链是教材不是事实），
 *        而这里数的是「这个文件夹里有几个文件」——文件浏览器把 90-system 明明白白摆在屏幕上，
 *        给它显示一个减掉了模板的数字，那个数字就与用户自己点开看到的对不上
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TFile, TFolder } from 'obsidian';
import type { FolderCountTarget } from '../../core/constants';

/**
 * 一个文件夹里装了些什么，三个数各自独立。
 *
 * 分成三个而不是直接给出「该显示的那个数」，是因为悬停提示要把三项一起说清，
 * 而常驻在屏幕上的只有一个。事实层给全部事实，取哪一个是呈现层的决定。
 */
export interface FolderTally {
    /** 笔记数，判据是扩展名 md——与全库其余八处「这是不是一篇笔记」用的是同一条 */
    readonly notes: number;
    /** 子文件夹数 */
    readonly folders: number;
    /** 既不是文件夹也不是笔记的文件：图片、PDF、canvas。它们是「一共」这个承诺的一部分 */
    readonly others: number;
}

/**
 * 数完整棵树，一次遍历得到每个文件夹的计数，键是文件夹路径。
 *
 * 建一张全库的表而不是「谁要显示就现数谁」，理由是复杂度：文件浏览器展开着一百个文件夹时，
 * 逐个递归数下去是 O(文件夹数 × 子树大小)，同一篇笔记会被它的每一层祖先重复数一遍；
 * 一趟自底向上的遍历则是 O(全库)，与屏幕上展开了几个文件夹无关。
 * 每次重画都重新数一遍、不留缓存：文件的增删改名由调用方的事件驱动，
 * 而一份需要自己判断何时过期的缓存，迟早会在某条没想到的路径上显示昨天的数字。
 *
 * recursive 为假时也照样走完整棵树——不是为了数，是为了把每个后代文件夹自己的那一格填进表里。
 */
export function tallyFolders(root: TFolder, recursive: boolean): Map<string, FolderTally> {
    const tallies = new Map<string, FolderTally>();

    walk(root, recursive, tallies);

    return tallies;
}

/** 数一个文件夹，顺手把它记进表里，并把自己的计数交给父亲累加 */
function walk(
    folder: TFolder,
    recursive: boolean,
    tallies: Map<string, FolderTally>,
): FolderTally {
    let notes = 0;
    let folders = 0;
    let others = 0;

    for (const child of folder.children) {
        if (child instanceof TFolder) {
            folders += 1;

            const inner = walk(child, recursive, tallies);

            // 只数本层时，子文件夹自己那一格已经记进表了，但它的内容不算进我这一格
            if (!recursive) continue;

            notes += inner.notes;
            folders += inner.folders;
            others += inner.others;
            continue;
        }

        if (child instanceof TFile && child.extension === 'md') notes += 1;
        else others += 1;
    }

    const tally: FolderTally = { notes, folders, others };

    tallies.set(folder.path, tally);

    return tally;
}

/**
 * 按口径取出该显示的那一个数。
 *
 * 写成一张 Record 而不是 if/switch 链，与设置页的 panels 表同因：
 * 往 FOLDER_COUNT_TARGETS 里加一个口径却忘了说它数什么，在这里是编译错，
 * 而不是一个静默回落成「笔记数」的新选项——那种错在界面上看起来完全正常。
 */
const PICKERS: Readonly<Record<FolderCountTarget, (tally: FolderTally) => number>> = {
    notes: (tally) => tally.notes,
    folders: (tally) => tally.folders,
    all: (tally) => tally.notes + tally.folders + tally.others,
};

/** 口径必须先由调用方收敛成合法值（手改过的 data.json 里什么都可能有），见 badge.ts */
export function pickCount(tally: FolderTally, target: FolderCountTarget): number {
    return PICKERS[target](tally);
}
