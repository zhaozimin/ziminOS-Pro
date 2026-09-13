/**
 * [INPUT]: 依赖 esbuild 的打包能力、builtin-modules 的 Node 内建模块清单、
 *          node:fs/promises 的版本镜像同步、process 的命令行参数
 * [OUTPUT]: 以 package.json 版本为唯一事实源，同步 Obsidian/Eagle 两份 manifest 后把 src/main.ts
 *           打包为 CommonJS 单文件，直接落位到 vault 内的插件目录
 * [POS]: 构建链的唯一出口。产物路径即 vault 模板区的插件目录，构建完成即就位，
 *        因此不需要任何同步脚本；dev 模式常驻 watch，production 模式一次性构建并退出。
 *        产物与「在哪个目录构建」无关：依赖路径一律归一成 node_modules/ 开头，
 *        否则在 git worktree 里（依赖从上三层解析）与在主仓库里各打出一份不同的 main.js
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import esbuild from 'esbuild';
import builtins from 'builtin-modules';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'process';

/*
 * 产物顶部说明：提醒读者这是构建产物，源码在 src/。
 *
 * 第二段是编译进产物的 MIT 组件许可声明，不能省：图标路径、农历算法与内置节假日快照都进了这个文件，
 * 而 MIT 要求「副本或实质性部分」都带上版权与许可声明。写在 banner 而不是只留在
 * icons.ts 的注释里，是因为注释能不能活到产物里取决于打包器的心情（改一次 minify 就没了），
 * 而 banner 是我们自己保证的。
 */
const banner = `/*
本文件由 esbuild 自 src/ 目录打包生成，请勿直接编辑。
需要修改行为请改 src/ 下的 TypeScript 源码，然后运行 npm run build。

图标来自 Pikaicons（https://pikaicons.com），MIT License，Copyright (c) 2022 Mau Joost。
其中若干图形由 ziminOS 照同一套画法补画，同样以 MIT 授权分发。
农历换算来自 lunar-typescript（https://github.com/6tail/lunar-typescript），MIT License，Copyright (c) 2020 6tail。
内置节假日快照沿用 holiday-cn（https://github.com/NateScarlet/holiday-cn）数据格式，MIT License，Copyright (c) 2019 NateScarlet。
长图渲染来自 dom-to-image-more（https://github.com/1904labs/dom-to-image-more），MIT License，Copyright 2018 Marc Brooks、2015 Anatolii Saienko、2012 Paul Bakaus。
单页 PDF 生成来自 jsPDF（https://github.com/parallax/jsPDF），MIT License，Copyright (c) 2010-2025 James Hall、2015-2025 yWorks GmbH。
详见 docs/第三方组件.md。
*/
`;

// 命令行第三个参数为 production 时进入生产构建
const isProduction = process.argv[2] === 'production';

// 构建产物直接写入 vault 模板区的插件目录，学员拿到仓库即可用
const OUT_FILE = 'vault/.obsidian/plugins/ziminos/main.js';
const MANIFEST_FILE = 'vault/.obsidian/plugins/ziminos/manifest.json';
const EAGLE_MANIFEST_FILE = 'eagle-companion/manifest.json';

/**
 * package.json 是版本唯一事实源；两份 manifest 只是 Obsidian 与 Eagle 需要的发布镜像。
 * 构建时自动同步，避免「源码已升级、插件仍报旧版本」这种无声分叉。
 */
async function syncManifestVersion() {
    const [packageSource, manifestSource, eagleManifestSource] = await Promise.all([
        readFile('package.json', 'utf8'),
        readFile(MANIFEST_FILE, 'utf8'),
        readFile(EAGLE_MANIFEST_FILE, 'utf8'),
    ]);
    const packageJson = JSON.parse(packageSource);
    const manifest = JSON.parse(manifestSource);
    const eagleManifest = JSON.parse(eagleManifestSource);

    if (typeof packageJson.version !== 'string' || !packageJson.version.trim()) {
        throw new Error('package.json 缺少有效 version，构建已中止');
    }

    const writes = [];

    if (manifest.version !== packageJson.version) {
        manifest.version = packageJson.version;
        writes.push(writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'));
    }
    if (eagleManifest.version !== packageJson.version) {
        eagleManifest.version = packageJson.version;
        writes.push(writeFile(EAGLE_MANIFEST_FILE, `${JSON.stringify(eagleManifest, null, 2)}\n`, 'utf8'));
    }

    await Promise.all(writes);
}

await syncManifestVersion();

/*
 * 依赖路径归一。
 *
 * esbuild 在非压缩产物里给每个依赖留一行来源注释（外加 __commonJS 的模块键），
 * 写的是它相对工作目录的路径。依赖在本地 node_modules 时是 `node_modules/…`；
 * 在 git worktree 里依赖从上三层的主仓库解析，就成了 `../../../node_modules/…`。
 * 代码一字不差，产物却差出几百行——publish-v1.sh 的「构建后 main.js 不许再变」
 * 于是随构建地点时红时绿，而那道闸存在的意义正是「红了就说明产物与源码对不上」。
 * 归一成前者：它就是依赖在任何一次正常安装里的样子，也不带任何本机信息。
 */
const LOCATION_INDEPENDENT = {
    name: 'location-independent-output',
    setup(build) {
        build.onEnd(async (result) => {
            if (result.errors.length > 0) return;

            const output = await readFile(OUT_FILE, 'utf8');
            const normalized = output.replace(/(?:\.\.\/)+node_modules\//g, 'node_modules/');

            if (normalized !== output) await writeFile(OUT_FILE, normalized, 'utf8');
        });
    },
};

const context = await esbuild.context({
    plugins: [LOCATION_INDEPENDENT],
    banner: { js: banner },
    entryPoints: ['src/main.ts'],
    bundle: true,
    // Obsidian 运行时已提供的模块与 Node 内建模块一律不打包
    external: [
        'obsidian',
        'electron',
        '@codemirror/*',
        '@lezer/*',
        ...builtins,
    ],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    // 刻意不压缩：脚本驱动的产品要让使用者能读懂、能改
    minify: false,
    sourcemap: isProduction ? false : 'inline',
    treeShaking: true,
    outfile: OUT_FILE,
});

if (isProduction) {
    await context.rebuild();
    await context.dispose();
    process.exit(0);
} else {
    await context.watch();
}
