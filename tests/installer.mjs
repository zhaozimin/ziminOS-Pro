/**
 * [INPUT]: 依赖 node:test/assert/child_process/fs/os/path/url 与本机 python3（≥ 3.9）；实跑 installer/ziminos_install.py 与 install.sh，
 *          静态读 installer/install.ps1、两份安装契约与两个打包脚本
 * [OUTPUT]: 为 npm test 提供安装程序的行为回归：三种包形态都装得出、自检与字节比对、失败回滚、拒绝与升级判定、
 *           第二版三库布局；以及两个启动脚本的平台纪律（PowerShell 纯 ASCII、不往输出流写字、不调限流接口、校验值钉死）
 *           与契约里的一键命令指向真实存在的脚本
 * [POS]: tests 的安装程序专项。安装逻辑从契约里的散文搬进代码之后，这里第一次能在没有智能体、没有 Windows 的机器上验证它；
 *        字体一律装进临时目录，结果文件一律写进临时目录，测试不碰这台电脑的用户字体与主目录。
 *        installer/ 随 publish-v1.sh 同步到第一版仓库，所以第一版的用例两边都跑，读 vault-pro / skill-pro 的用例挂第二版闸
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_PRO_REPO = existsSync(path.join(ROOT, 'skill-pro/SKILL.md'));
const CORE = path.join(ROOT, 'installer/ziminos_install.py');
const RESULT_NAME = '.ziminos-install-result.json';

const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');

function scratch() {
    return mkdtempSync(path.join(tmpdir(), 'ziminos-installer-test-'));
}

/** 跑一次核心：字体进临时目录，返回退出码与结果文件 */
function install(args, { target, result, fontDir }) {
    const resultPath = result ?? path.join(target, RESULT_NAME);
    const run = spawnSync('python3', [CORE, ...args, '--target', target, '--result', resultPath, '--font-dir', fontDir], { encoding: 'utf8' });

    return { code: run.status, stdout: run.stdout, stderr: run.stderr, result: JSON.parse(readFileSync(resultPath, 'utf8')) };
}

/** 第一版给人看的包形态：ziminOS/ 指向仓库的 vault/，字体用一个小假文件，免得每条用例都拷 65 MB */
function humanLayout(work, { withFont = true } = {}) {
    const pkg = path.join(work, 'ziminOS-v0.0.0-setup');

    mkdirSync(path.join(pkg, '字体'), { recursive: true });
    symlinkSync(path.join(ROOT, 'vault'), path.join(pkg, 'ziminOS'), 'dir');
    if (withFont) writeFileSync(path.join(pkg, '字体', 'Fake-Regular.ttf'), 'not a real font');

    return pkg;
}

test('安装程序：第一版从仓库形态装出一本库，顶层只有 .obsidian 与 README.md，字体装进指定目录', () => {
    const work = scratch();

    try {
        const target = path.join(work, '我的笔记库');
        const fonts = path.join(work, 'fonts');

        mkdirSync(target);
        const run = install(['--edition', 'free', '--source', ROOT], { target, fontDir: fonts });

        assert.equal(run.code, 0, run.stdout + run.stderr);
        assert.equal(run.result.status, 'ok', JSON.stringify(run.result));
        assert.equal(run.result.mode, 'fresh');
        assert.deepEqual(readdirSync(target).filter((name) => name !== RESULT_NAME).sort(), ['.obsidian', 'README.md']);
        assert.equal(run.result.fonts.files.length, 5);
        assert.equal(readdirSync(fonts).length, 5);
        // 屏幕上只有一行 ASCII：有的终端与沙箱会吞掉或读错中文
        assert.match(run.stdout.trim(), /^ZIMINOS_RESULT status=ok exit=0$/);
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('安装程序：第一版给人看的包形态与 zip 都认，装出来的与 vault/ 逐字节相同', () => {
    const work = scratch();

    try {
        const pkg = humanLayout(work);
        const fromDir = path.join(work, 'from-dir');
        const fromZip = path.join(work, 'from-zip');
        const zip = path.join(work, 'ziminOS-v0.0.0-setup.zip');

        mkdirSync(fromDir);
        mkdirSync(fromZip);
        execFileSync('python3', ['-c', [
            'import os, sys, zipfile',
            'root = sys.argv[1]',
            'with zipfile.ZipFile(sys.argv[2], "w") as z:',
            '    for folder, _dirs, files in os.walk(root, followlinks=True):',
            '        for name in files:',
            '            full = os.path.join(folder, name)',
            '            z.write(full, os.path.join(os.path.basename(root), os.path.relpath(full, root)))',
        ].join('\n'), pkg, zip]);

        for (const [source, target] of [[pkg, fromDir], [zip, fromZip]]) {
            const run = install(['--edition', 'free', '--source', source], { target, fontDir: path.join(work, 'fonts') });

            assert.equal(run.result.status, 'ok', JSON.stringify(run.result));
            assert.equal(run.result.version, JSON.parse(read('vault/.obsidian/plugins/ziminos/manifest.json')).version);
        }
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('安装程序：中途出错时把写进工作区的东西原样撤掉，好让契约里的逐条做法接着装', () => {
    const work = scratch();

    try {
        const target = path.join(work, 'target');

        mkdirSync(path.join(target, '.agent-config'), { recursive: true });
        // 字体文件夹是空的：笔记库已经铺下去之后才发现，正好走到回滚那条路
        const run = install(['--edition', 'free', '--source', humanLayout(work, { withFont: false })], { target, fontDir: path.join(work, 'fonts') });

        assert.equal(run.code, 30);
        assert.equal(run.result.status, 'failed');
        assert.equal(run.result.rolled_back, true);
        assert.match(run.result.error, /字体/);
        assert.deepEqual(readdirSync(target).filter((name) => name !== RESULT_NAME), ['.agent-config'], '回滚没撤干净，或者撤掉了原本就在的东西');
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('安装程序：不是空的、宽泛目录、源码仓库一律拒绝；已经装过的交给升级分支', () => {
    const work = scratch();

    try {
        const fonts = path.join(work, 'fonts');
        const result = path.join(work, 'result.json');
        const cases = [];

        const notEmpty = path.join(work, 'not-empty');
        mkdirSync(notEmpty);
        writeFileSync(path.join(notEmpty, '我的笔记.md'), '# 别动我');
        cases.push(['free', notEmpty, 'refused', 'not_empty']);
        cases.push(['free', homedir(), 'refused', 'broad_directory']);
        cases.push(['free', ROOT, 'refused', 'source_repository']);

        const installedFree = path.join(work, 'installed-free');
        mkdirSync(path.join(installedFree, '.obsidian/plugins/ziminos'), { recursive: true });
        cases.push(['free', installedFree, 'upgrade', 'upgrade']);

        const proRoot = path.join(work, 'pro-root');
        mkdirSync(path.join(proRoot, '.ziminos'), { recursive: true });
        cases.push(['pro', proRoot, 'upgrade', 'upgrade-C']);

        const v1Vault = path.join(work, 'v1-vault');
        mkdirSync(path.join(v1Vault, '.obsidian'), { recursive: true });
        cases.push(['pro', v1Vault, 'upgrade', 'upgrade-B']);

        for (const [edition, target, status, detail] of cases) {
            const run = install(['--edition', edition, '--source', ROOT], { target, result, fontDir: fonts });

            assert.equal(run.result.status, status, `${target}: ${JSON.stringify(run.result)}`);
            assert.equal(status === 'refused' ? run.result.reason : run.result.mode, detail);
        }
        // 拒绝时一个字节都不写：那本「别动我」还是原样
        assert.deepEqual(readdirSync(notEmpty), ['我的笔记.md']);
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('安装程序：第二版装出三本库、两份一致的版次标记与系统根的认路文件', { skip: !IS_PRO_REPO }, () => {
    const work = scratch();

    try {
        const target = path.join(work, 'system-root');

        mkdirSync(target);
        const run = install(['--edition', 'pro', '--source', ROOT], { target, fontDir: path.join(work, 'fonts') });

        assert.equal(run.result.status, 'ok', JSON.stringify(run.result));
        assert.equal(run.result.vaults.length, 3);

        const markers = readdirSync(target).filter((name) => existsSync(path.join(target, name, '.obsidian/plugins/ziminos/edition.json')));

        assert.equal(markers.length, 2, '版次标记应当只随装了 ziminOS 插件的两本库分发');
        assert.ok(existsSync(path.join(target, '.ziminos/skills/scripts/notectl.py')));
        assert.ok(existsSync(path.join(target, 'CLAUDE.md')) && existsSync(path.join(target, 'AGENTS.md')));
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('启动脚本 install.sh 走完整条链：找 Python → 用本地包 → 结果文件', { skip: process.platform === 'win32' }, () => {
    const work = scratch();

    try {
        const target = path.join(work, 'vault');

        mkdirSync(target);
        const run = spawnSync('bash', [path.join(ROOT, 'installer/install.sh'), 'free', target, humanLayout(work)], {
            encoding: 'utf8',
            env: { ...process.env, ZIMINOS_INSTALLER_CORE: CORE, ZIMINOS_FONT_DIR: path.join(work, 'fonts') },
        });

        assert.equal(run.status, 0, run.stdout + run.stderr);
        assert.equal(JSON.parse(readFileSync(path.join(target, RESULT_NAME), 'utf8')).status, 'ok');
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});

test('启动脚本守住平台纪律：PowerShell 纯 ASCII、不往输出流写字、不调限流接口、校验值钉死', () => {
    const ps1 = read('installer/install.ps1');
    const sh = read('installer/install.sh');

    // Windows PowerShell 5.1 按 ANSI 代码页读无 BOM 的脚本，一个中文字就是一段乱码
    assert.equal(/[^\x00-\x7f]/.test(ps1), false, 'install.ps1 里出现了非 ASCII 字符');
    // 函数里 Write-Output 会混进返回值，把返回的 Python 路径变成数组
    assert.doesNotMatch(ps1, /Write-Output/);
    assert.match(ps1, /\$ProgressPreference = 'SilentlyContinue'/);
    assert.match(ps1, /SecurityProtocolType\]::Tls12/);
    assert.match(ps1, /-UseBasicParsing/);
    assert.match(ps1, /\$PythonSha256 = '[0-9a-f]{64}'/);

    // 没装开发者工具的 Mac 上，运行 /usr/bin/python3 会弹窗；必须先问 xcode-select
    assert.ok(sh.indexOf('xcode-select -p') !== -1 && sh.indexOf('xcode-select -p') < sh.indexOf('python_ok /usr/bin/python3'));
    assert.equal((sh.match(/sha="[0-9a-f]{64}"/g) || []).length, 2, 'install.sh 应为两种 Mac 处理器各钉一个校验值');

    // Gitee 偶尔对单次请求回 451 或掐断连接：真正发出下载的调用各只许有一处，就是带重试的那个函数
    const code = (text) => text.split('\n').filter((line) => !line.trim().startsWith('#')).join('\n');
    assert.equal((code(ps1).match(/Invoke-WebRequest/g) || []).length, 1, 'install.ps1 有绕过 Invoke-Download 重试的下载');
    assert.equal((code(sh).match(/\bcurl\b/g) || []).length, 1, 'install.sh 有绕过 fetch 重试的下载');
    assert.equal(code(sh).includes('--retry-all-errors'), false, 'macOS 11 自带的 curl 不认识 --retry-all-errors');

    for (const [name, script] of [['install.ps1', ps1], ['install.sh', sh]]) {
        assert.equal(script.includes('api/v5'), false, `${name} 调了对未登录请求限流的开放接口`);
        assert.ok(script.includes('raw/main/installer/ziminos_install.py'), `${name} 取安装程序的路径变了`);
        assert.ok(script.includes('raw/main/vault/.obsidian/plugins/ziminos/manifest.json'), `${name} 取版本号的路径变了`);
    }
    assert.ok(existsSync(CORE));
    assert.ok(existsSync(path.join(ROOT, 'vault/.obsidian/plugins/ziminos/manifest.json')));

    // Windows 的一键命令要在 PowerShell、cmd 与 Git Bash 里原样可用：不许出现会被 bash 改写的 $
    const usage = /^#\s+(powershell -NoProfile .*)$/m.exec(ps1);

    assert.ok(usage, 'install.ps1 头部缺少一键命令');
    assert.equal(usage[1].includes('$'), false);
});

test('启动脚本拼的包名就是打包脚本产出的包名', { skip: !IS_PRO_REPO }, () => {
    const ps1 = read('installer/install.ps1');
    const sh = read('installer/install.sh');

    assert.match(read('make-v1-package.sh'), /^name="ziminOS-v\$\{version\}-setup"$/m);
    assert.match(read('make-pro-package.sh'), /^name="ziminOS-pro-v\$\{version\}"$/m);
    assert.ok(ps1.includes('"ziminOS-v$version-setup"') && ps1.includes('"ziminOS-pro-v$version"'));
    assert.ok(sh.includes('NAME="ziminOS-v${VERSION}-setup"') && sh.includes('NAME="ziminOS-pro-v${VERSION}"'));
});

test('两份契约的全新安装先交给安装脚本，命令指向各自仓库，结果按四种状态处理', () => {
    const contracts = [['skill/SKILL.md', 'zimin-os-v1', 'free']];

    if (IS_PRO_REPO) contracts.push(['skill-pro/SKILL.md', 'ziminos-pro', 'pro']);

    for (const [file, repo, edition] of contracts) {
        const contract = read(file);

        assert.ok(contract.includes(`https://gitee.com/ziminzhao/${repo}/raw/main/installer/install.ps1`), `${file} 的 Windows 命令没指向本仓库`);
        assert.ok(contract.includes(`-Edition ${edition}"`), `${file} 的 Windows 命令版次不对`);
        assert.ok(contract.includes(`https://gitee.com/ziminzhao/${repo}/raw/main/installer/install.sh -o /tmp/ziminos-install.sh && bash /tmp/ziminos-install.sh ${edition}`), `${file} 的 macOS 命令不对`);
        assert.ok(contract.includes(RESULT_NAME));
        for (const status of ['`ok`', '`upgrade`', '`refused`', '`failed`']) {
            assert.ok(contract.includes(status), `${file} 没说清 ${status} 怎么办`);
        }
    }
});
