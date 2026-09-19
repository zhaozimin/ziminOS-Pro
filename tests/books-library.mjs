/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译并载入 src/modules/books 的纯函数
 * [OUTPUT]: 整架导入与补齐书籍信息两条新路径的回归：书名比对那把唯一的尺子、
 *           批量路径对豆瓣的零接触、筛子落在实际取回上、正开着的那一篇不写、
 *           补书目一次只查一本与认错之后的纠正待遇
 * [POS]: 这一份钉的全是**不会报错的坏结果**：认错了书把划线倒进别人名下、
 *        批量查豆瓣把账号拦下来、给只有书签的书建一堆空壳、
 *        在用户正编辑的那一篇上写盘引出三方合并。
 *        它们没有一个会在运行时抛异常，因此只能在这里拦
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadTypeScript(relativePath) {
    const result = await build({
        entryPoints: [path.join(ROOT, relativePath)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(
        `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
    );
}

const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), 'utf8');

const { matchByTitle, normalizeTitle } = await loadTypeScript('src/modules/books/titleMatch.ts');

// ============================================================
// 书名比对：全模块唯一的那把尺子
// ============================================================

const book = (title, author = '') => ({ titles: [title], author });

test('逐字命中优先于任何一种宽匹配', () => {
    const shelf = [book('人类简史：从动物到上帝'), book('人类简史')];

    // 宽匹配会先撞上第一条（它包含「人类简史」），而逐字那一轮必须整轮跑完再让位
    assert.equal(matchByTitle(shelf, book('人类简史')).titles[0], '人类简史');
});

test('归一之后相同就算同一本：书名号、空格与标点都不算差别', () => {
    const shelf = [book('卡片笔记写作法 : 如何实现从阅读到写作')];

    assert.ok(matchByTitle(shelf, book('《卡片笔记写作法：如何实现从阅读到写作》')));
    assert.equal(normalizeTitle('《人类简史》'), normalizeTitle('人类简史'));
});

test('主书名极短的书靠全名认出来，四字门槛一寸不动', () => {
    // 真机实测那一本：文件名只能用主书名「思维」，设备那头写的是带副标题的全名
    const shelf = [book('思维 : 关于决策、问题解决与预测的新科学', '约翰·D·布兰思福特')];
    const target = {
        titles: ['思维', '思维：关于决策、问题解决与预测的新科学'],
        author: '约翰·D·布兰思福特',
    };

    assert.ok(matchByTitle(shelf, target));
    // 只递主书名时必须落空：两个字包含进太多别的书，宁可漏配也不能误配
    assert.equal(matchByTitle(shelf, book('思维')), null);
});

test('两个字的书名不参与互相包含，《活着》不会撞上一堆书', () => {
    const shelf = [book('活着为了讲述'), book('活着本来单纯')];

    assert.equal(matchByTitle(shelf, book('活着')), null);
});

test('作者对不上就不收这一条，《人类简史》不会认成《未来简史》', () => {
    const shelf = [book('未来简史：从智人到智神', '尤瓦尔·赫拉利')];

    assert.equal(matchByTitle(shelf, book('人类简史', '尤瓦尔·赫拉利')), null);
});

test('任一边没有作者就不拿作者卡人', () => {
    // Kindle 的个人文档没有作者，缺席不是矛盾
    const shelf = [book('卡片笔记写作法：如何实现从阅读到写作', '')];

    assert.ok(matchByTitle(shelf, book('卡片笔记写作法', '申克·阿伦斯')));
});

test('空名字一条都不匹配：空串被任何字符串包含，那会命中清单第一本', () => {
    const shelf = [book('人类简史'), book('未来简史')];

    assert.equal(matchByTitle(shelf, { titles: ['', '   '], author: '' }), null);
    assert.equal(matchByTitle(shelf, { titles: [], author: '' }), null);
});

test('库里那本书的每一个别名都参与比对', () => {
    // 文件夹名是主书名，aliases 里躺着带副标题的全名——两边对称，尺子才量得准
    const shelf = [
        { titles: ['思维', '思维：关于决策、问题解决与预测的新科学'], author: '' },
    ];

    assert.ok(matchByTitle(shelf, book('思维 : 关于决策、问题解决与预测的新科学')));
});

// ============================================================
// 批量路径：一次都不碰豆瓣
// ============================================================

/*
 * 用户的原话是「一定要避开被豆瓣拉黑。如果没有办法批量，就不要批量」。
 * 八十本书就是一百六十次豆瓣请求，几十次之后必被拦；而被拦的后果不是慢，
 * 是一半的书有封面一半没有，且谁也说不清断在哪一本。
 * 这条红线只能在这里守：源码里一旦出现那个 import，运行时不会有任何提示。
 */
test('整架导入的两个文件一次都不碰豆瓣', () => {
    for (const file of [
        'src/modules/books/importLibrary.ts',
        'src/modules/books/librarySources.ts',
        'src/modules/books/libraryModal.ts',
    ]) {
        const source = read(file);

        assert.doesNotMatch(source, /from '\.\/douban'/, `${file} 不该 import douban`);
        assert.doesNotMatch(source, /searchBooks|fetchBookDetail|doubanFetcher/, file);
    }
});

test('豆瓣只有两个调用点：主干建书，与一次只查一本的补齐命令', () => {
    const callers = [];

    for (const file of [
        'readBook.ts',
        'enrichBook.ts',
        'importLibrary.ts',
        'librarySources.ts',
        'createBook.ts',
        'importHighlights.ts',
        'sources.ts',
    ]) {
        if (/from '\.\/douban'/.test(read(`src/modules/books/${file}`))) callers.push(file);
    }

    assert.deepEqual(callers.sort(), ['enrichBook.ts', 'readBook.ts']);
});

test('补齐书籍信息一次只发两次请求，且不在循环里', () => {
    const source = read('src/modules/books/enrichBook.ts');

    assert.equal((source.match(/await searchBooks\(/g) ?? []).length, 1);
    assert.equal((source.match(/await fetchBookDetail\(/g) ?? []).length, 1);
    // 循环里查豆瓣就是批量查豆瓣，换个写法而已
    assert.doesNotMatch(source, /for\s*\([^)]*\)\s*\{[^}]*(searchBooks|fetchBookDetail)/s);
});

// ============================================================
// 批量导入的四条纪律
// ============================================================

test('筛子落在实际取回了什么上，不落在任何一个计数字段上', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /if \(!highlights\.length\) \{/);
    // 微读的 notebook 会返回这些计数，但它们是「那边记得的账」而不是「这次拿到了什么」
    assert.doesNotMatch(source, /noteCount|reviewCount|bookmarkCount/);
});

test('正开着的那一篇一个字都不写', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /import \{ isNoteInFront \} from '\.\.\/\.\.\/core\/editDebts'/);
    assert.match(source, /if \(!created && isNoteInFront\(ctx\.app, moc\.path\)\)/);
});

test('已经在库里的书只补划线，绝不重建', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /matchByTitle\(shelf, \{ titles: \[book\.title\], author: book\.author \}\)/);
    assert.match(source, /let moc = findOnShelf\(shelf, book\);/);
    assert.match(source, /if \(!moc\) \{/);
});

/*
 * 同一批里可能有两个写法指向同一本书（Kindle 上同一本带不带副标题就是两条）。
 * 拿一份循环开始前冻住的快照去比，第二个写法会撞上刚刚建出来的那个目录、整本失败，
 * 而它本该是「这本已经有了，补划线」。
 */
test('书架随导入生长，刚建出来的书立刻认得出', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /shelf\.push\(\{ titles: \[folderName, \.\.\.aliases\]/);
    // 建档成功之后才上架：失败的那本不该留在书架上冒充已有
    assert.ok(source.indexOf('if (!moc) throw new Error') < source.indexOf('shelf.push('));
    assert.match(source, /function shelfOf\(ctx: ZiminosContext\): ShelfBook\[\]/);
});

test('建档走同一条容器流程，只是没有人在场', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /quiet: true,/);
    // 批量不该自己拼 YAML 或自己建文件夹——那就是第二条建档流程
    assert.doesNotMatch(source, /createFolder|mocFrontmatter|mocContent/);
});

test('三个来源共用一个内核，差别只有枚举哪一批书', () => {
    const source = read('src/modules/books/importLibrary.ts');
    const commands = source.match(/BOOK_COMMANDS\.import\w+/g) ?? [];

    assert.deepEqual(commands.sort(), [
        'BOOK_COMMANDS.importApple',
        'BOOK_COMMANDS.importKindle',
        'BOOK_COMMANDS.importWeread',
    ]);
    assert.equal((source.match(/async function runLibraryImport\(/g) ?? []).length, 1);
});

test('书名里放不得的字符换成空格，真实书名原样留在别名里', () => {
    const source = read('src/modules/books/importLibrary.ts');

    assert.match(source, /const UNSAFE_NAME = \/\[\\\\\/:\*\?"<>\|#\^\[\\\]\]\/g;/);
    assert.match(source, /function aliasesOf\(title: string, folderName: string\)/);
    assert.match(source, /return real === folderName \? \[real\] : \[real, folderName\];/);
});

/*
 * 用户在跑到一半时按 Esc，窗会关掉而导入照常跑完（已经写进去的书一本都不回滚）。
 * 那份账目与那条报告链接是这次运行唯一的产物——丢了它，他就不知道哪几本没导进来。
 */
test('中途关窗之后，结果仍然送得到他手上', () => {
    const source = read('src/modules/books/libraryModal.ts');

    assert.match(source, /if \(this\.showing\) this\.renderResult\(\);\s*else this\.open\(\);/);
    // 重新打开会再走一次 onOpen，没有 phase 它会回到确认态问「要开始导入吗」
    assert.match(source, /if \(this\.phase === 'confirm'\) this\.renderConfirm\(\);/);
    assert.match(source, /else this\.renderResult\(\);/);
});

// ============================================================
// 补齐书籍信息：两种在场，两套待遇
// ============================================================

test('查过一次的书再来一定弹候选，不再替他自作主张', () => {
    const source = read('src/modules/books/enrichBook.ts');

    assert.match(source, /const confident = checkedBefore \? null : confidentPick\(/);
    assert.match(source, /BOOK_FIELDS\.source/);
});

test('机器只在归一书名唯一命中时代劳，同名两条一律交还给人', () => {
    const source = read('src/modules/books/enrichBook.ts');

    assert.match(source, /return sameName\.length === 1 \? matched\.item : null;/);
});

test('已归档的书不改 UID：归档记录已经引用了那个号', () => {
    const source = read('src/modules/books/enrichBook.ts');

    assert.match(source, /if \(uid !== null && !archived\) frontmatter\[FIELDS\.uid\] = uid;/);
});

test('书目 YAML 键名只有一份，且住在 core 而不是某个模块里', () => {
    const templates = read('src/modules/projects/templates.ts');

    // 键名的家是 core/constants，与 FIELDS 同源：字段名是全库共享的语言
    assert.match(read('src/core/constants.ts'), /export const BOOK_FIELDS = \{/);
    // 模板里那几行必须改用这张表，否则两边各写各的，按出版社筛的表会少掉一半的书
    assert.doesNotMatch(templates, /'publisher: '|`publisher: \$\{/);
    assert.match(templates, /\$\{key\.publisher\}: /);
    assert.match(read('src/modules/books/enrichBook.ts'), /BOOK_FIELDS, FIELDS \} from '\.\.\/\.\.\/core\/constants'/);
});

/*
 * books 的 L2 立过一条：本模块不 import projects，建书那套流程是一个由 main 填上的洞。
 * 补书目要写的那批 YAML 键一度被放进 projects/templates，于是 enrichBook 破了这条——
 * 而它不会报错，只是依赖图从一棵树变成了一张网。
 */
test('books 不向 projects 取值，只取类型', () => {
    const offenders = [];

    for (const file of readdirSync(path.join(ROOT, 'src/modules/books'))) {
        if (!file.endsWith('.ts')) continue;

        const source = read(`src/modules/books/${file}`);

        for (const line of source.split('\n')) {
            if (!/from '\.\.\/projects/.test(line)) continue;
            if (!/^import type /.test(line.trim())) offenders.push(`${file}: ${line.trim()}`);
        }
    }

    assert.deepEqual(offenders, []);
});

test('补书目只动 frontmatter，正文一个字不碰', () => {
    const source = read('src/modules/books/enrichBook.ts');

    assert.match(source, /processFrontMatter\(moc, \(frontmatter/);
    assert.doesNotMatch(source, /vault\.(modify|process)\(/);
});

// ============================================================
// 尺子只有一把
// ============================================================

test('书名归一的那段正则只存在一份', () => {
    const owners = [];

    for (const file of [
        'titleMatch.ts',
        'sources.ts',
        'importLibrary.ts',
        'enrichBook.ts',
        'identity.ts',
        'readBook.ts',
    ]) {
        // 归一的标志是那串标点白名单；谁抄了一份，谁就有了第二把尺子
        if (/、·・/.test(read(`src/modules/books/${file}`))) owners.push(file);
    }

    assert.deepEqual(owners, ['titleMatch.ts']);
});

test('匹配那把尺子零依赖，因此喂真实书名就能离线验证', () => {
    const source = read('src/modules/books/titleMatch.ts');

    assert.doesNotMatch(source, /^import /m);
});
