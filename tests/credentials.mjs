/**
 * [INPUT]: 依赖 node:test/assert、esbuild 与 fs；直接编译 modules/books/sourceWeread 事实源，
 *          静态读 settingsPanels、main 与 vault 的 .obsidian/.gitignore
 * [OUTPUT]: 为 npm test 提供持久凭据的边界回归：微信读书的登录态只住 SecretStorage、
 *           老库那份搬得过去也丢不了、搬不动时不清空旧处、设置页只经注入问状态
 * [POS]: tests 的凭据专项。分成一个文件而不是并进 regression，判据与本目录其他专项同源——
 *        **变更理由不同**：这一组只随「凭据存在哪」变，而那条纪律的特点是**被推翻时没有任何东西会报错**。
 *        往 ZiminosSettings 里加一个字段存令牌、或者在设置页顺手读一眼 data.json，
 *        两者都能通过编译、通过全部既有测试、在本机跑得好好的，代价要等到学员把库同步或打包
 *        发给同学之后才显现，而那时谁都不会联想到是哪一次提交干的
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');

/** sourceWeread 顶层只认 Platform 与 requestUrl；BrowserWindow 是运行时按需 require 的，走不到 */
const obsidianStub = `
    export const Platform = { isDesktopApp: true };
    export const requestUrl = async () => ({ status: 200, json: {} });
`;

async function loadWeread() {
    const result = await build({
        entryPoints: [path.join(ROOT, 'src/modules/books/sourceWeread.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'obsidian-test-stub',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
                    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
                        contents: obsidianStub,
                        loader: 'js',
                        resolveDir: ROOT,
                    }));
                },
            },
        ],
    });

    const source = result.outputFiles[0].text;

    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { migrateWereadCookie, wereadCookie, wereadAvailable } = await loadWeread();

/** 一台机器的替身：一份 SecretStorage、一份 data.json，以及落盘的次数 */
function machine({ legacy = '', stored = null, secretsBroken = false } = {}) {
    const secrets = new Map();

    if (stored !== null) secrets.set('ziminos-weread-cookie', stored);

    const ctx = {
        app: {
            secretStorage: {
                getSecret: (id) => secrets.get(id) ?? null,
                setSecret: (id, value) => {
                    if (secretsBroken) throw new Error('secret storage unavailable');
                    secrets.set(id, value);
                },
            },
        },
        settings: { wereadCookie: legacy },
        saveSettings: async () => {
            ctx.saves += 1;
        },
        saves: 0,
    };

    ctx.secret = () => secrets.get('ziminos-weread-cookie') ?? null;

    return ctx;
}

test('登录态住 SecretStorage，不住 data.json', async () => {
    const ctx = machine({ stored: 'wr_vid=1; wr_skey=abc' });

    assert.equal(wereadCookie(ctx), 'wr_vid=1; wr_skey=abc');
    assert.equal(wereadAvailable(ctx), true);
    assert.equal(ctx.settings.wereadCookie, '', '凭据不该出现在随库同步的设置对象里');

    // 没连过的那台机器
    assert.equal(wereadCookie(machine()), '');
    assert.equal(wereadAvailable(machine()), false);
});

test('老库那串 Cookie 搬进 SecretStorage，原处抹干净', async () => {
    const ctx = machine({ legacy: 'wr_vid=7; wr_skey=old' });

    await migrateWereadCookie(ctx);

    assert.equal(ctx.secret(), 'wr_vid=7; wr_skey=old', '没搬过去，学员得重新扫一次码');
    assert.equal(ctx.settings.wereadCookie, '', 'data.json 里那份没抹掉，等于没搬');
    assert.equal(ctx.saves, 1, '抹掉之后必须落盘，否则下次启动它又回来了');
});

test('新处已经有值时，老库那份作废而不是盖回去', async () => {
    const ctx = machine({ legacy: 'wr_vid=7; wr_skey=old', stored: 'wr_vid=7; wr_skey=new' });

    await migrateWereadCookie(ctx);

    assert.equal(ctx.secret(), 'wr_vid=7; wr_skey=new', '把后来重新连的那次覆盖掉了');
    assert.equal(ctx.settings.wereadCookie, '');
});

test('没有旧账时一个字节都不写', async () => {
    const ctx = machine();

    await migrateWereadCookie(ctx);

    assert.equal(ctx.secret(), null);
    assert.equal(ctx.saves, 0, '每次启动都白落一次盘');
});

/**
 * 这一条是整组里最要紧的：**搬家途中出事，宁可它留在原地**。
 *
 * 先抹后写、或者不管写没写成都抹，都会把学员的登录态直接弄丢——而那是我们替他做的决定造成的，
 * 他只会看到「读书笔记怎么又要扫码了」。
 */
test('SecretStorage 写不进去时，旧处原样留着', async () => {
    const ctx = machine({ legacy: 'wr_vid=7; wr_skey=old', secretsBroken: true });

    await migrateWereadCookie(ctx);

    assert.equal(ctx.settings.wereadCookie, 'wr_vid=7; wr_skey=old', '搬家失败却把原件销毁了');
    assert.equal(ctx.saves, 0);
});

/**
 * 凭据只能有一个读法。
 *
 * 设置页若自己去翻那个 key，或者哪天有人图省事把它读回设置对象，
 * 下一次搬家就只会搬一处——这个仓库已经在 editDebts 与 formatter 上付过一次这个代价。
 */
test('全库只有 books 模块认识凭据存在哪', () => {
    const weread = read('src/modules/books/sourceWeread.ts');
    const panels = read('src/settingsPanels.ts');
    const main = read('src/main.ts');

    // 旧字段只许被**取值**一次，就是迁移函数里拿出来准备搬走的那一次。
    // 其余几处是 `if (…)` 守卫与 `= ''` 赋值，都属于「清掉老库残留」，不是把它当凭据用。
    // 多出第二处取值，就说明又有一条路径回去认旧地方了
    assert.equal(
        (weread.match(/ctx\.settings\.wereadCookie\.trim\(\)/g) ?? []).length,
        1,
        'data.json 里那个字段只该被 migrateWereadCookie 取值一次',
    );
    assert.match(
        weread,
        /const legacy = ctx\.settings\.wereadCookie\.trim\(\);/,
        '唯一那次取值不在迁移函数里，字段的语义已经漂了',
    );
    // 最直白的那条：它绝不能再被交给网络
    assert.doesNotMatch(weread, /Cookie: ctx\.settings\.wereadCookie/, '又拿 data.json 里那份当请求头了');
    assert.match(weread, /secretStorage\.getSecret\(WEREAD_COOKIE_SECRET_ID\)/);
    assert.match(weread, /secretStorage\.setSecret\(WEREAD_COOKIE_SECRET_ID/);

    assert.doesNotMatch(panels, /wereadCookie/, '设置页直接读凭据，绕过了 books 模块这个唯一出入口');
    assert.match(panels, /this\.actions\.isWereadConnected\(\)/, '连接状态不再经注入问出来');

    assert.match(main, /void migrateWereadCookie\(ctx\)/, '装配时不再搬迁老库的凭据');
    assert.match(main, /isWereadConnected: \(\) => wereadCookie\(ctx\)/, 'main 没把连接状态接给设置页');
});

/**
 * 隐私护栏仍要挡住 data.json。
 *
 * 凭据搬走之后它不再装着账号钥匙，但仍然是每位用户自己的本地状态（含一份会过期的旧残留），
 * 这条忽略规则不该因为「已经不敏感了」被顺手删掉。
 */
test('随库分发的 .gitignore 仍然挡着插件的 data.json', () => {
    assert.match(read('vault/.obsidian/.gitignore'), /^plugins\/ziminos\/data\.json$/m);
});
