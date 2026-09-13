/**
 * [INPUT]: 依赖 node:test/assert/child_process/fs/os/path/url 与本机 python3；读取两份安装契约、两个打包脚本、
 *          pack-zip.py、docs/第一版手动安装指南.html、README.md、vault-pro 的版次标记、插件开荒页文案与 manifest
 * [OUTPUT]: 为 npm test 提供分发包的跨产物回归：zip 的 UTF-8 标志位与确定性，手动安装包的包内名字与安装说明同名，
 *           说明让人替换的程序文件与契约升级分支一致，说明引用的插件文案与版本要求真实存在，首页指得到这条路；
 *           以及两份契约「取法一」按打包脚本产出的 ASCII 包名去各自仓库的发行版取包、写明 Windows 真机上撞过的墙，
 *           第二版验收清单与交付物一致（两份版次标记、随库分发的配色），第二版分发包只从 HEAD 取料
 * [POS]: tests 的分发专项。它不测插件行为，测的是「人拿到的那个包、那份说明，和契约、代码说的是不是同一件事」——
 *        这类错都不在写错的那一行报错，只在某个学员照着说明找不到那个按钮时报错。
 *        打包工具与学员指南只住在第二版仓库，publish-v1.sh 却会把 tests/ 同步过去，
 *        因此每一条都挂「这是不是第二版仓库」那道闸，且顶层不读任何第二版专属文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_PRO_REPO = existsSync(path.join(ROOT, 'skill-pro/SKILL.md'));
const GUIDE = 'docs/第一版手动安装指南.html';
const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');

/** 契约升级分支逐个 cp 的程序文件——手动升级与智能体升级换的必须是同一批 */
function contractUpgradeFiles() {
    return [...read('skill/SKILL.md').matchAll(/cp "\$install_staging_dir\/repo\/(vault\/\.obsidian\/[^"]+)"/g)].map((m) => m[1]);
}

/** 打包脚本里那几个包内名字：它们是学员在资源管理器里真正看到的字 */
function packageNames() {
    const script = read('make-v1-package.sh');
    const constant = (name) => {
        const matched = new RegExp(`^${name} = "([^"]+)"$`, 'm').exec(script);

        assert.ok(matched, `make-v1-package.sh 里找不到常量 ${name}`);

        return matched[1];
    };
    const homes = /^UPGRADE_HOMES = \{(.+)\}$/m.exec(script);

    assert.ok(homes, 'make-v1-package.sh 里找不到 UPGRADE_HOMES');

    return {
        vault: constant('VAULT'),
        fonts: constant('FONTS'),
        licenses: constant('LICENSES'),
        upgrade: constant('UPGRADE'),
        guide: constant('GUIDE'),
        homes: Object.fromEntries([...homes[1].matchAll(/"(\w+)": "([^"]+)"/g)].map((m) => [m[1], m[2]])),
    };
}

test('pack-zip.py：中文名一律带 UTF-8 标志位，给定时刻后同一份输入永远得到同一个 zip', { skip: !IS_PRO_REPO }, () => {
    const work = mkdtempSync(path.join(tmpdir(), 'ziminos-pack-zip-'));

    try {
        const source = path.join(work, 'ziminOS-v0.0.0-安装包');

        mkdirSync(path.join(source, '升级文件/样式代码片段文件夹'), { recursive: true });
        writeFileSync(path.join(source, '升级文件/样式代码片段文件夹/【编辑】当前行高亮（阴影）.css'), 'body {}\n');
        writeFileSync(path.join(source, 'README.md'), '# ok\n');

        const pack = (zip) =>
            execFileSync('python3', [path.join(ROOT, 'pack-zip.py'), source, zip, '--date', '2026-09-12T06:52:47-04:00']);

        pack(path.join(work, 'a.zip'));
        pack(path.join(work, 'b.zip'));

        assert.deepEqual(readFileSync(path.join(work, 'a.zip')), readFileSync(path.join(work, 'b.zip')), '同一份输入打出了两个不同的 zip');

        const entries = JSON.parse(
            execFileSync(
                'python3',
                [
                    '-c',
                    'import json, sys, zipfile; print(json.dumps([[i.filename, i.flag_bits & 0x800, list(i.date_time)] for i in zipfile.ZipFile(sys.argv[1]).infolist()]))',
                    path.join(work, 'a.zip'),
                ],
                { encoding: 'utf8' },
            ),
        );

        assert.deepEqual(
            entries.map(([name]) => name),
            ['ziminOS-v0.0.0-安装包/README.md', 'ziminOS-v0.0.0-安装包/升级文件/样式代码片段文件夹/【编辑】当前行高亮（阴影）.css'],
        );

        for (const [name, utf8Flag, dateTime] of entries) {
            // 条目名以包名打头：Windows「全部解压缩」后得到的是一个文件夹，而不是一地散落的文件
            assert.ok(utf8Flag, `${name} 没带 UTF-8 标志位，Windows 自带解压会把它解成乱码`);
            // 取的是那个时刻在它自己时区里的钟面读数；zip 沿用 DOS 时间，秒只精确到偶数，47 秒记成 46 秒
            assert.deepEqual(dateTime, [2026, 9, 12, 6, 52, 46]);
        }
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('手动安装包：包内名字在打包脚本与安装说明里是同一批，升级文件按 Obsidian 的三枚按钮分组', { skip: !IS_PRO_REPO }, () => {
    const guide = read(GUIDE);
    const names = packageNames();

    for (const name of [names.vault, names.fonts, names.licenses, names.upgrade, names.guide]) {
        assert.ok(guide.includes(name), `安装说明里没提到包里的「${name}」`);
    }

    // 升级文件夹的名字就是 Obsidian 按钮上那几个字去掉「打开」：学员照着按钮名就找得到落点
    assert.deepEqual(Object.keys(names.homes).sort(), ['plugins', 'snippets', 'themes']);

    for (const home of Object.values(names.homes)) {
        assert.ok(guide.includes(`「打开${home}」`), `安装说明没告诉学员用「打开${home}」找落点`);
        assert.ok(guide.includes(`${names.upgrade} → ${home}`), `安装说明没指向「${names.upgrade} → ${home}」`);
    }
});

test('手动安装包：说明让人替换的 ziminOS 程序文件，恰好是契约升级分支替换的那几个', { skip: !IS_PRO_REPO }, () => {
    const guide = read(GUIDE);
    const ziminos = contractUpgradeFiles()
        .filter((file) => file.startsWith('vault/.obsidian/plugins/ziminos/'))
        .map((file) => path.basename(file));

    assert.ok(ziminos.includes('main.js'), '没从契约里读出 ziminOS 的 main.js，解析坏了');
    assert.ok(guide.includes(`选中里面的${CN_DIGITS[ziminos.length]}个文件`), `契约替换 ${ziminos.length} 个 ziminOS 程序文件，说明里的个数没跟上`);

    for (const file of ziminos) {
        assert.ok(guide.includes(`<code>${file}</code>`), `安装说明漏了要替换的 ${file}`);
    }

    // 升级文件里一份设置都不许有：契约若开始整份替换 data.json，手动升级的人会照着盖掉自己的设置
    assert.equal(contractUpgradeFiles().some((file) => path.basename(file) === 'data.json'), false);
    assert.ok(guide.includes('只拖文件，不拖文件夹'));
});

test('手动安装说明引用的插件文案、版本要求与字体数目都与事实一致', { skip: !IS_PRO_REPO }, () => {
    const guide = read(GUIDE);
    const settings = read('src/settingsModel.ts');
    const init = read('src/modules/setup/init.ts');
    const manifest = JSON.parse(read('vault/.obsidian/plugins/ziminos/manifest.json'));
    const contract = read('skill/SKILL.md');

    // 学员照着找的按钮与提示，必须是插件里真有的那几个字
    for (const [label, source, where] of [
        ["label: '开荒'", settings, '设置页标签'],
        ["initButton: '初始化'", settings, '开荒按钮'],
        ["done: '开荒完成 ✅'", init, '开荒完成提示'],
        ["notEmpty: '检测到已有笔记，ziminOS 只在空库开荒", init, '空库检查提示'],
    ]) {
        assert.ok(source.includes(label), `${where}的文案改了（找不到 ${label}），安装说明要跟着改`);
        assert.ok(guide.includes(label.split("'")[1].replace(/。.*$/, '')), `安装说明没引用${where}「${label.split("'")[1]}」`);
    }

    assert.ok(guide.includes(`Obsidian ${manifest.minAppVersion} 或更高`), '最低 Obsidian 版本与 manifest 对不上');

    const fonts = [...contract.matchAll(/^施工源\/fonts\/[^/]+\/[^/\n]+\.(?:ttf|otf)$/gm)];

    assert.ok(guide.includes(`共${CN_DIGITS[fonts.length]}个文件`), `契约交付 ${fonts.length} 个字体文件，说明里的个数没跟上`);
    // 双击就在浏览器里打开，不许依赖脚本：带着「网络标记」解压出来的文件，脚本不一定跑得起来
    assert.equal(/<script\b/i.test(guide), false);
});

test('手动安装包只从 HEAD 取交付物，并先与第一版仓库对账', { skip: !IS_PRO_REPO }, () => {
    const script = read('make-v1-package.sh');

    // 被 .gitignore 挡住的开发库状态（可能含微信读书 Cookie 的 data.json）在 git status 里看不见，cp -R 会带它出门
    assert.match(script, /git archive --format=tar HEAD vault fonts/);
    assert.doesNotMatch(script, /cp -R "\$repo_root\/vault"/);
    assert.match(script, /\/git\/trees\//);
    assert.ok(script.includes('pack-zip.py'));
});

test('首页给第一版指出不用智能体的那条路', { skip: !IS_PRO_REPO }, () => {
    const readme = read('README.md');

    assert.ok(readme.includes('https://gitee.com/ziminzhao/zimin-os-v1/releases/latest'));
    assert.ok(readme.includes('安装说明.html'));
});

/**
 * 契约的取法一按名字去发行版找包，打包脚本按名字把包打出来——两边必须是同一个名字。
 *
 * 这条链上任何一处改名都不报错：契约照样读得通，打包照样打得出，只是一台没有 Git 的
 * Windows 电脑在「没找到附件」那一步退回 git clone，而那正是这条取法要消灭的二十分钟。
 * 名字只许 ASCII：Python 的 urllib 遇到下载路径里的中文直接抛 UnicodeEncodeError。
 */
test('两份契约按各自打包脚本产出的名字、去各自仓库的发行版取包', { skip: !IS_PRO_REPO }, () => {
    const v1Contract = read('skill/SKILL.md');
    const proContract = read('skill-pro/SKILL.md');
    const v1Name = /^name="(ziminOS-v\$\{version\}-[A-Za-z]+)"$/m.exec(read('make-v1-package.sh'));
    const proName = /^name="(ziminOS-pro-v\$\{version\})"$/m.exec(read('make-pro-package.sh'));

    assert.ok(v1Name, 'make-v1-package.sh 的包名不再是 ASCII 的 ziminOS-v${version}-后缀');
    assert.ok(proName, 'make-pro-package.sh 的包名不再是 ASCII 的 ziminOS-pro-v${version}');

    const v1Suffix = v1Name[1].replace('ziminOS-v${version}', '');

    assert.ok(v1Contract.includes('api/v5/repos/ziminzhao/zimin-os-v1/releases/latest'));
    assert.ok(v1Contract.includes(`${v1Suffix}.zip`), `第一版契约没按 ${v1Suffix}.zip 找安装包`);
    assert.ok(proContract.includes('api/v5/repos/ziminzhao/ziminos-pro/releases/latest'));
    assert.ok(proContract.includes('ziminOS-pro-v'), '第二版契约没按 ziminOS-pro-v 找分发包');

    // 取错仓库的代价不对称：第一版指向 pro 的发行版，等于把付费交付物发给每一个免费用户
    assert.equal(v1Contract.includes('repos/ziminzhao/ziminos-pro'), false, '第一版契约不该去第二版的发行版取包');
    assert.equal(proContract.includes('repos/ziminzhao/zimin-os-v1'), false, '第二版契约不该去第一版的发行版取包');

    // 第一版的包是给人看的形态，契约靠两次改名把它归一成仓库形态：改名的对象必须是包里真有的那两个文件夹
    const names = packageNames();

    assert.ok(v1Contract.includes(`-setup/${names.vault}\` → \`$install_staging_dir/repo/vault\``));
    assert.ok(v1Contract.includes(`-setup/${names.fonts}\` → \`$install_staging_dir/repo/fonts\``));
});

test('两份契约都写明报告里撞过的墙：不下 archive、不拼 raw、Windows 先读、只读文件先去属性再删', { skip: !IS_PRO_REPO }, () => {
    for (const file of ['skill/SKILL.md', 'skill-pro/SKILL.md']) {
        const contract = read(file);

        assert.ok(contract.includes('/repository/archive/'), `${file} 没拦住「下载 ZIP」那条死路`);
        assert.ok(contract.includes('大字体文件返回 403'), `${file} 没拦住逐文件拼 raw 那条死路`);
        assert.ok(contract.includes('### 在 Windows 上，动手前先读这四条'), `${file} 缺 Windows 前置说明`);
        assert.ok(contract.includes('WinError 5'), `${file} 没说清只读文件怎么删`);
        // PowerShell 5.1 的进度条会把下载拖慢十倍以上，旧系统默认 TLS 连不上 Gitee
        assert.ok(contract.includes("$ProgressPreference = 'SilentlyContinue'"), `${file} 的 PowerShell 写法没关进度条`);
        assert.ok(contract.includes('[Net.SecurityProtocolType]::Tls12'), `${file} 的 PowerShell 写法没指定 TLS 1.2`);
        assert.ok(contract.includes('「信任仓库作者并启用插件」'), `${file} 引用的信任按钮不是 Obsidian 中文界面上那几个字`);
    }
});

/**
 * 验收清单必须与交付物说同一件事，否则智能体会为了让清单通过而改装库。
 *
 * 真机上发生过：清单要「三份 edition.json」，而只有装了 ziminOS 插件的两本库才有版次标记，
 * 智能体于是给《兼收并蓄》凭空补了一份；清单要「三本库里都没有 data.json」，
 * 而 Style Settings 的默认配色本来就是随库分发的 data.json。两处都是契约自相矛盾，不是安装出错。
 */
test('第二版的验收清单与交付物一致：两份版次标记、随库分发的 Style Settings 配色', { skip: !IS_PRO_REPO }, () => {
    const contract = read('skill-pro/SKILL.md');
    const markers = readdirSync(path.join(ROOT, 'vault-pro'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => existsSync(path.join(ROOT, 'vault-pro', entry.name, '.obsidian/plugins/ziminos/edition.json')));

    assert.equal(markers.length, 2, 'vault-pro 里的版次标记不再是两份，契约里的「两份」要跟着改');
    assert.ok(contract.includes('两份 `edition.json`'));
    assert.equal(contract.includes('三份 `edition.json`'), false);

    assert.ok(existsSync(path.join(ROOT, 'vault/.obsidian/plugins/obsidian-style-settings/data.json')));
    assert.equal(contract.includes('三本库里都不存在 `data.json`'), false, '清单又要求删掉随库分发的 Style Settings 配色');
    assert.ok(contract.includes('三本库里都不存在 `.obsidian/plugins/ziminos/data.json`'));
});

test('第二版分发包只从 HEAD 取料并断言私有状态不出门', { skip: !IS_PRO_REPO }, () => {
    const script = read('make-pro-package.sh');

    assert.match(script, /git archive --format=tar HEAD vault vault-pro skill-pro fonts/);
    assert.doesNotMatch(script, /cp -R "\$repo_root\/\$item"/);
    assert.ok(script.includes('包里混进了私有状态'));
    assert.ok(script.includes('pack-zip.py'));
});
