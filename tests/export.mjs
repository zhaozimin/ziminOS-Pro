/**
 * [INPUT]: 依赖 node:test/assert/fs/path/url 与 esbuild，直接编译 export/layout 与 core/exportStyle 两层纯函数，
 *          并读取纸面层、装饰层、预览弹窗、导出器与命令表的装配事实
 * [OUTPUT]: 验证长页画布自适应、PDF 单页边界、装饰占位符、水印几何与落点、风格验形，
 *           以及「内容渲一次、装饰重放无数次」这条预览赖以成立的架构边界
 * [POS]: tests 的导出模块专项契约；浏览器真机负责验视觉，本文件先钉住不会静默截断的尺寸算法、
 *        界面范围与持久化区间同源，以及预览绝不重新渲染正文这三件看不见却最容易被改坏的事
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 这是不是第二版仓库。
 *
 * 判别式与 regression.mjs 用的是同一条，理由也是同一条：**问的是仓库身份，不是某个文件在不在**。
 * 后者会在被问的那个文件改名时静默跳过，把一条本该变红的测试变成一条永远绿的测试。
 *
 * 演示页与 `publish-v1.sh` 都只住在第二版：`publish-v1.sh` 同步 `tests/` 却把 `docs/` 与它自己留下。
 * 于是这个文件里凡是要读那两样东西的断言，都得先过这道闸——
 * 而且 import 更要紧：**一条顶层静态 import 指向不存在的文件，整个测试文件连加载都加载不起来**，
 * 三十多条与演示页毫无关系的断言一起陪葬，连 skip 的机会都没有，第一版仓库的回归就此全红。
 * 这正是下面那条「演示页的接缝」断言在讲的坑，只不过它当初只想到了 tsconfig，
 * 没想到自己所在的这个文件也踩着同一条。
 *
 * 判据：**第二版专属的东西，在会被同步的文件里只能以「可缺席」的形式出现**——
 * 闸按仓库身份判一次，模块按需 `import()`。按需那一步不吞错：演示页真被改名时它照样炸。
 */
const IS_PRO_REPO = existsSync(path.join(ROOT, 'skill-pro/SKILL.md'));

function loadDemo() {
    return import(`file://${path.join(ROOT, 'docs/export-demo/build.mjs')}`);
}

async function loadModule(relative) {
    const result = await build({
        entryPoints: [path.join(ROOT, relative)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        write: false,
        logLevel: 'silent',
    });

    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

function source(relative) {
    return readFileSync(path.join(ROOT, relative), 'utf8');
}

/**
 * 去掉注释之后的源码。
 *
 * 「这个文件里不许出现 X」这类断言必须只看代码：本仓库的注释恰恰在**解释**为什么不许有 X，
 * 于是照全文匹配的断言会被自己的说明文字判为失败——第一版就栽在这儿。
 */
function code(relative) {
    return source(relative)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const layout = await loadModule('src/modules/export/layout.ts');
const style = await loadModule('src/core/exportStyle.ts');

test('短文保留 2x，超长文自动降采样但不越过画布边界', () => {
    assert.equal(layout.captureScale(800, 3_000), 2);

    const scale = layout.captureScale(1_200, 60_000);

    assert.ok(scale < 1);
    assert.ok(scale * 60_000 <= 32_000);
    assert.ok(1_200 * 60_000 * scale * scale <= 192_000_000);

    const extreme = layout.captureScale(1_200, 400_000);

    assert.ok(extreme < 0.1);
    assert.ok(extreme * 400_000 <= 32_000);
    assert.ok(1_200 * 400_000 * extreme * extreme <= 192_000_000);
});

test('PDF 纸张保持文章比例并收进单页安全边界', () => {
    const page = layout.pdfPageSize(1_000, 40_000);

    assert.ok(Math.max(page.width, page.height) <= 14_400);
    assert.ok(Math.abs(page.width / page.height - 1 / 40) < 0.000001);
});

test('页眉页脚与水印只替换公开占位符，文件名跨平台安全', () => {
    assert.equal(
        layout.resolveExportText('{title} · {date} {time} · {other}', {
            title: '答疑/Alex',
            date: '2026-09-11',
            time: '10:30',
        }),
        '答疑/Alex · 2026-09-11 10:30 · {other}',
    );
    assert.equal(layout.safeExportName('答疑/Alex: 第1篇'), '答疑－Alex－ 第1篇');
});

test('一枚标记可以只有字、只有图，也可以图在左字在右', () => {
    const textOnly = layout.watermarkMark({ textWidth: 100, fontSize: 20, logoWidth: 0, logoHeight: 0 });

    assert.equal(textOnly.width, 100);
    assert.equal(textOnly.height, 27);
    assert.equal(textOnly.logoWidth, 0);

    const logoOnly = layout.watermarkMark({ textWidth: 0, fontSize: 20, logoWidth: 60, logoHeight: 40 });

    // 只有图时没有图字间距可言，宽度就是图的宽度
    assert.equal(logoOnly.width, 60);
    assert.equal(logoOnly.height, 40);
    assert.equal(logoOnly.logoY, 0);

    const both = layout.watermarkMark({ textWidth: 100, fontSize: 20, logoWidth: 60, logoHeight: 40 });

    // 图在左、字在右，中间按字号留一份空（round(20 × 0.45) = 9）
    assert.equal(both.width, 169);
    // 高度取两者之高：图比一行字高，于是字在图的正中对齐
    assert.equal(both.height, 40);
    assert.equal(both.textX, 119);
    assert.equal(both.textY, 20);
});

test('水印砖按旋转后的外接矩形加间距，角度变大不会让两行挤在一起', () => {
    const mark = layout.watermarkMark({ textWidth: 100, fontSize: 20, logoWidth: 0, logoHeight: 0 });
    const flat = layout.watermarkTile(mark, 0, 40, 30);

    // 水平时宽就是文字宽加一份横向间距，高是行高加一份纵向间距
    assert.equal(flat.width, 140);
    assert.equal(flat.height, 57);

    const upright = layout.watermarkTile(mark, 90, 40, 30);

    // 竖过来之后文字的长度改为占据高度：这正是「外接矩形」而不是「文字宽高」的意义
    assert.ok(upright.height > flat.height);
    assert.ok(upright.width < flat.width);
    assert.ok(upright.height >= 100 + 30);

    const tilted = layout.watermarkTile(mark, 45, 0, 0);

    assert.ok(tilted.width > 100 * Math.SQRT1_2);
    assert.ok(tilted.height > 100 * Math.SQRT1_2);

    // 间距是唯一能把砖变大的旋钮方向：调大间距绝不会让砖反而变小
    const loose = layout.watermarkTile(mark, 45, 80, 60);

    assert.equal(loose.width - tilted.width, 80);
    assert.equal(loose.height - tilted.height, 60);

    // 标志把标记撑大，砖必须跟着大——否则平铺时相邻两枚标志会互相压住
    const withLogo = layout.watermarkMark({ textWidth: 100, fontSize: 20, logoWidth: 60, logoHeight: 40 });
    const logoTile = layout.watermarkTile(withLogo, 0, 40, 30);

    assert.ok(logoTile.width > flat.width);
    assert.ok(logoTile.height > flat.height);
});

test('单个水印的九种落点各自成立，靠右靠下按「容器减图」留边', () => {
    assert.equal(layout.watermarkPosition('top-left', 40, 30), '40px 30px');
    assert.equal(layout.watermarkPosition('middle-center', 40, 30), '50% 50%');
    assert.equal(
        layout.watermarkPosition('bottom-right', 40, 30),
        'calc(100% - 40px) calc(100% - 30px)',
    );
    assert.equal(layout.watermarkPosition('bottom-left', 0, 0), '0px calc(100% - 0px)');

    // 负数只可能来自被手改过的 data.json；夹到 0 而不是把图顶出纸外
    assert.equal(layout.watermarkPosition('top-left', -20, -10), '0px 0px');
});

test('水印 SVG 让图与字一起转、一起淡，并对文本转义', () => {
    const mark = layout.watermarkMark({ textWidth: 120, fontSize: 18, logoWidth: 0, logoHeight: 0 });
    const tile = { width: 200, height: 100 };
    const svg = layout.watermarkSvg({
        text: '赵子民 <ziminOS> & Co.',
        logoDataUrl: '',
        mark,
        tile,
        fontSize: 18,
        angle: -28,
        color: '#333333',
        fontFamily: 'LXGW WenKai GB Screen',
        opacity: 14,
    });

    // 旋转与不透明度都挂在外层 <g> 上：图与字因此不可能各转各的、各淡各的
    assert.match(svg, /<g opacity="0\.14" transform="rotate\(-28 100 50\)/);
    assert.match(svg, /font-size="18"/);
    assert.match(svg, /&lt;ziminOS&gt; &amp; Co\./);
    assert.doesNotMatch(svg, /<ziminOS>/);
    assert.doesNotMatch(svg, /<image/);
});

test('水印带标志时嵌入的是自包含 data URI，不是对文件的引用', () => {
    const mark = layout.watermarkMark({ textWidth: 0, fontSize: 18, logoWidth: 80, logoHeight: 40 });
    const tile = layout.watermarkTile(mark, 0, 100, 80);
    const svg = layout.watermarkSvg({
        text: '',
        logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mark,
        tile,
        fontSize: 18,
        angle: 0,
        color: '#333333',
        fontFamily: 'sans-serif',
        opacity: 20,
    });

    assert.match(svg, /<image /);
    assert.match(svg, /href="data:image\/png;base64,iVBORw0KGgo="/);
    assert.match(svg, /width="80" height="40"/);
    // 没有文字就不画 <text>：一个空的文本节点会在某些渲染器里留下一个基线高的空隙
    assert.doesNotMatch(svg, /<text/);
});

test('滑块表就是验形区间：界面拖得到的值，重启之后一定还认', () => {
    const numericKeys = Object.entries(style.DEFAULT_EXPORT_STYLE)
        .filter(([, value]) => typeof value === 'number')
        .map(([key]) => key)
        .sort();

    // 一根滑块对应一个数字字段，不多不少——多出来的没人画，少掉的没人验形
    assert.deepEqual(style.EXPORT_SLIDERS.map((spec) => spec.key).sort(), numericKeys);

    for (const spec of style.EXPORT_SLIDERS) {
        const fallback = style.DEFAULT_EXPORT_STYLE[spec.key];

        assert.ok(spec.min <= fallback && fallback <= spec.max, `${spec.key} 的默认值不在自己的区间里`);
        assert.ok(spec.step > 0);
    }
});

test('导出风格的越界数字夹回区间，坏值回落默认，好值原样通过', () => {
    assert.deepEqual(style.normalizeExportStyle(undefined), style.DEFAULT_EXPORT_STYLE);
    assert.deepEqual(style.normalizeExportStyle('坏掉的 JSON'), style.DEFAULT_EXPORT_STYLE);

    const clamped = style.normalizeExportStyle({
        watermarkOpacity: 999,
        watermarkGapX: -50,
        watermarkAngle: 1_000,
    });

    assert.equal(clamped.watermarkOpacity, 100);
    assert.equal(clamped.watermarkGapX, 0);
    assert.equal(clamped.watermarkAngle, 90);

    const garbage = style.normalizeExportStyle({
        format: 'jpg',
        headerAlign: '居中',
        watermarkMode: 'scatter',
        watermarkAnchor: 'nowhere',
        watermarkSize: Number.NaN,
        header: 42,
    });

    assert.equal(garbage.format, style.DEFAULT_EXPORT_STYLE.format);
    assert.equal(garbage.headerAlign, style.DEFAULT_EXPORT_STYLE.headerAlign);
    assert.equal(garbage.watermarkMode, style.DEFAULT_EXPORT_STYLE.watermarkMode);
    assert.equal(garbage.watermarkAnchor, style.DEFAULT_EXPORT_STYLE.watermarkAnchor);
    assert.equal(garbage.watermarkSize, style.DEFAULT_EXPORT_STYLE.watermarkSize);
    assert.equal(garbage.header, style.DEFAULT_EXPORT_STYLE.header);

    const kept = style.normalizeExportStyle({
        format: 'pdf',
        header: '赵子民 · {date}',
        headerAlign: 'right',
        watermarkMode: 'single',
        watermarkAnchor: 'bottom-left',
        watermarkOpacity: 22,
        logo: '90-system/logo.png',
        watermarkLogoSize: 96,
    });

    assert.equal(kept.format, 'pdf');
    assert.equal(kept.header, '赵子民 · {date}');
    assert.equal(kept.headerAlign, 'right');
    assert.equal(kept.watermarkMode, 'single');
    assert.equal(kept.watermarkAnchor, 'bottom-left');
    assert.equal(kept.watermarkOpacity, 22);
    assert.equal(kept.logo, '90-system/logo.png');
    assert.equal(kept.watermarkLogoSize, 96);
});

test('三处标志尺寸默认为 0：老库升级之后导出的那张图与升级前一模一样', () => {
    assert.equal(style.DEFAULT_EXPORT_STYLE.logo, '');
    assert.equal(style.DEFAULT_EXPORT_STYLE.headerLogoSize, 0);
    assert.equal(style.DEFAULT_EXPORT_STYLE.footerLogoSize, 0);
    assert.equal(style.DEFAULT_EXPORT_STYLE.watermarkLogoSize, 0);

    // 升级前写下的那份设置里根本没有这四个键，读回来必须等于「没有标志」
    const legacy = style.normalizeExportStyle({ format: 'png', watermark: '赵子民', watermarkOpacity: 14 });

    assert.equal(legacy.logo, '');
    assert.equal(legacy.headerLogoSize, 0);
    assert.equal(legacy.watermarkLogoSize, 0);
});

test('每根滑块都说得出自己得先有什么，否则界面无从判断谁该变灰', () => {
    const allowed = new Set(['text', 'logo', 'mark', 'switch']);

    for (const spec of style.EXPORT_SLIDERS) {
        assert.ok(allowed.has(spec.requires), `${spec.key} 的 requires 不在闭合集合里`);
    }

    // 标志尺寸只认 logo：认成 text 或 mark，文字一空它就跟着变灰——
    // 而那时用户正想靠它把标志打开，于是被锁在外面。
    // 纸宽纸高归它们自己那个自适应开关管，通用判断（有没有字/有没有图）对它们不适用
    for (const key of ['pageWidth', 'pageHeight']) {
        const spec = style.EXPORT_SLIDERS.find((item) => item.key === key);

        assert.ok(spec, `${key} 没有对应的滑块`);
        assert.equal(spec.requires, 'switch');
        assert.equal(spec.section, 'page');
    }

    for (const key of ['headerLogoSize', 'footerLogoSize', 'watermarkLogoSize']) {
        const spec = style.EXPORT_SLIDERS.find((item) => item.key === key);

        assert.ok(spec, `${key} 没有对应的滑块`);
        assert.equal(spec.requires, 'logo');
        assert.equal(spec.min, 0, `${key} 必须能拖到 0——0 就是这一处不放标志`);
    }
});

test('内容渲一次、装饰重放无数次：预览不得重新解释 Markdown', () => {
    const paper = code('src/modules/export/paper.ts');
    const decorate = code('src/modules/export/decorate.ts');
    const modal = code('src/modules/export/modal.ts');

    // 纸面层独占昂贵的那一半，也独占「这张纸此刻多大」这个问题
    assert.match(paper, /MarkdownRenderer\.render/);
    assert.match(paper, /article\.offsetWidth/);
    assert.match(paper, /article\.scrollHeight/);

    // 装饰层先清后建，这是幂等的全部实现
    assert.match(decorate, /querySelectorAll\(DECORATION_SELECTOR\)/);
    assert.match(decorate, /export function applyDecorations/);
    assert.doesNotMatch(decorate, /MarkdownRenderer/);

    // 装饰层必须全同步：它一旦 await，帧与帧就会乱序，
    // 用户会看见上一帧的水印盖在这一帧的排版上。标志的字节由 logo.ts 预先解析好递进来。
    assert.doesNotMatch(decorate, /\bawait\b/);
    assert.doesNotMatch(decorate, /\basync\b/);
    assert.doesNotMatch(decorate, /readBinary/);

    // 预览只重放装饰。它一旦碰内容渲染，每拖一格滑块就要重解析一遍整篇笔记
    assert.match(modal, /applyDecorations\(this\.paper\.article/);
    assert.doesNotMatch(modal, /MarkdownRenderer/);
    assert.doesNotMatch(modal, /renderPaper/);
});

test('导出命令截图前照终值再施一次风格，并只在确认后记住这套风格', () => {
    const exporter = code('src/modules/export/exporter.ts');
    const commands = source('src/core/commands.ts');
    const pkg = JSON.parse(source('package.json'));

    assert.match(commands, /id: 'export-current-note'/);
    assert.match(commands, /name: '导出当前笔记'/);

    // 拖完滑块立刻点导出时，预览排队中的那一帧可能还没轮到——
    // 所以截图必须发生在再放一次装饰之后，看见的与拿到的才是同一张图
    const decorated = exporter.indexOf('applyDecorations(paper.article');
    const captured = exporter.indexOf('domToImage.toBlob');

    assert.ok(decorated > 0 && captured > decorated);

    // 标志在导出前重解一次：读盘是异步的，用户完全可能在弹窗读完之前就点了导出
    assert.match(exporter, /await resolveLogo\(ctx\.app, style\.logo\)/);

    assert.match(exporter, /pdf\.addImage/);
    assert.match(exporter, /ctx\.settings\.exportStyle = style/);
    assert.match(exporter, /openAndGetValue/);
    assert.equal(pkg.dependencies['dom-to-image-more'], '3.10.2');
    assert.equal(pkg.dependencies.jspdf, '4.2.1');
});

test('页眉页脚的链接补协议、只放 http(s) 过去', () => {
    // 用户想推广的是这种写法；逼他先学会「链接必须带 https://」是把实现细节当成了功课
    assert.equal(layout.exportLinkUrl('edu.zhaozimin.cn'), 'https://edu.zhaozimin.cn/');
    assert.equal(layout.exportLinkUrl('  zhaozimin.cn/课程  '), 'https://zhaozimin.cn/%E8%AF%BE%E7%A8%8B');
    assert.equal(layout.exportLinkUrl('http://example.com/a?b=1'), 'http://example.com/a?b=1');

    // 这串字会原样变成 PDF 里的一个动作，白名单之外一律判成「没填」，不是「填错了就凑合执行」
    assert.equal(layout.exportLinkUrl('javascript:alert(1)'), '');
    assert.equal(layout.exportLinkUrl('file:///etc/passwd'), '');
    assert.equal(layout.exportLinkUrl('   '), '');
    assert.equal(layout.exportLinkUrl(''), '');
});

test('颜色只认十六进制色号，其余一律回落「跟随正文色」', () => {
    const kept = style.normalizeExportStyle({
        headerColor: '#FF8800',
        footerColor: '#abc',
        watermarkColor: '#11223344',
    });

    assert.equal(kept.headerColor, '#ff8800');
    assert.equal(kept.footerColor, '#abc');
    assert.equal(kept.watermarkColor, '#11223344');

    // 空串是一个**有意义的状态**（跟随正文色），因此坏值回落到它而不是回落到某个具体色号
    const rejected = style.normalizeExportStyle({
        headerColor: 'red; content: url(x)',
        footerColor: 'rgb(1,2,3)',
        watermarkColor: 42,
    });

    assert.equal(rejected.headerColor, '');
    assert.equal(rejected.footerColor, '');
    assert.equal(rejected.watermarkColor, '');
    assert.equal(style.DEFAULT_EXPORT_STYLE.headerColor, '');
});

test('参考线恒开：它是默认就该有的观感，不是一个需要人来决定的问题', () => {
    // v0.30.0 由用户明令去掉那个开关，字段也一并退场——
    // 留一个永远为真的字段，只会让人以为它还能关
    assert.equal('listGuides' in style.DEFAULT_EXPORT_STYLE, false);
    assert.equal('listGuides' in style.normalizeExportStyle({ listGuides: false }), false);
    assert.match(code('src/modules/export/decorate.ts'), /article\.addClass\('ziminos-export-guides'\)/);
});

test('纸的宽度、留白与字号量自编辑区，不再有任何一个凭空定的数', () => {
    const paper = code('src/modules/export/paper.ts');

    assert.match(paper, /measureSource/);
    assert.match(paper, /getComputedStyle\(element\)/);

    // 编辑态必须量 .cm-content 而不是 .cm-sizer：后者是整个编辑器那一栏、左右内边距为 0，
    // 量它会得到「纸和编辑器一样宽、正文顶到纸边」——v0.25.0 的文字溢出就是这么来的。
    assert.match(paper, /COLUMN_SELECTORS/);
    assert.match(paper, /'\.markdown-preview-sizer', '\.cm-content'/);

    // 留白优先取真实值，但不能取到 0：量到的那个元素未必自己带边距，而纸总得有边
    assert.match(paper, /MIN_PAGE_MARGIN/);

    // 纸停在视口之内、靠透明度隐藏：停在十万像素之外时，Bases 这类按可见性懒渲染的视图
    // 永远不会把单元格画出来，导出的图里表格有行却是空的
    assert.doesNotMatch(paper, /-100000px/);
    assert.match(paper, /opacity: '0'/);

    // 三处旧的发明：夹取区间、写死的内边距、按 scrollWidth 把纸加宽
    assert.doesNotMatch(paper, /ARTICLE_WIDTH_MIN|ARTICLE_WIDTH_MAX/);
    assert.doesNotMatch(paper, /padding: '48px 56px'/);
    assert.doesNotMatch(paper, /naturalWidth/);

    // 兜底仍然存在，但它是「连编辑区都探不到」时的最后一手，不是默认版面
    assert.match(paper, /FALLBACK_METRICS/);
});

test('链接只写进 PDF，PNG 当场说自己点不了', () => {
    const exporter = code('src/modules/export/exporter.ts');

    // 链接注解与页面内容是两回事，所以「整页一张图」与「可点的页眉」并不冲突
    assert.match(exporter, /pdf\.link\(/);
    // 纸张被等比缩过时链接得跟着同一个比例，否则可点区域会停在图上别的地方
    assert.match(exporter, /const factor = page\.width/);
    // PNG 下必须当场告知，而不是只写在设置旁边
    assert.match(exporter, /style\.format === 'png' && links\.length/);

    const decorate = code('src/modules/export/decorate.ts');

    // 正文里本来就有的链接同样要能点：导出成 PDF 之后外链全变死字，
    // 是个不该由用户承担的退化——那些链接是他自己写进笔记里的
    assert.match(decorate, /querySelectorAll<HTMLAnchorElement>\('a\[href\]'\)/);
    // 逐行取矩形：一条横跨两行的链接，整包围盒会把中间那段无关的空白也圈成可点
    assert.match(decorate, /getClientRects\(\)/);
    // 客户端矩形会带上预览那层缩放，必须除回去，否则本函数在缩放与否时答案不同
    assert.match(decorate, /article\.offsetWidth/);
});

test('可点区域只有一套算法：页眉页脚与正文走同一条', () => {
    const decorate = code('src/modules/export/decorate.ts');

    // v0.31.0 之前是两套：页眉页脚 offsetTop 逐级累加，正文客户端矩形。
    // offsetTop 那套错在一个看不见的前提上——它量的是「离最近那个**定位祖先**多远」，
    // 而页眉页脚那一行只设了 display:flex、没有 position，于是子元素的 offsetTop
    // 量的是离正文栏顶端多远，再加上行自己的 y 就把同一段距离算了两遍。
    // 页眉在 y≈0，算两遍还是 0；页脚在 y≈1240，一加就落到纸外，真机 PDF 里 Rect 是负数。
    assert.doesNotMatch(decorate, /offsetParent|function inkWithin|function offsetWithin/);

    // 只剩一个换算函数，两处都调它
    assert.match(decorate, /function pushRects/);
    assert.equal(decorate.match(/pushRects\(regions, url/g)?.length, 2);

    // 量的仍是那一行里真正有墨的几段，不是整条 flex 行——
    // 那一行横跨整个正文栏，整条可点意味着点在页脚左边一片空白上也会跳走
    assert.match(decorate, /for \(const child of line\?\.children \?\? \[\]\)/);
});

test('库内双链不许被补成网址：href 里没协议的意思是「这不是外链」', () => {
    const decorate = code('src/modules/export/decorate.ts');

    // 「没写协议」在两种输入里意思相反：输入框里是「他省略了 https://」，
    // DOM 里是「这根本不是外链」。同一条规则套到 href 上，[[MOC数据库代码]] 会变成
    // https://moc数据库代码/ ——真机导出的 PDF 里确实多出了四个这样的链接，
    // 指向不存在的 punycode 域名，而且点下去之前没有任何迹象
    assert.match(decorate, /function bodyLinkUrl/);
    // 这一条读**原始**源码而不是去注释的那份：要找的那行里有个正则字面量 /^https?:\/\//，
    // 而 code() 的去注释规则会把其中的 // 当成行注释从那里切掉。
    // 「不许出现 X」必须看去注释的源码，「必须出现 X」有时反过来——两种断言看的不是同一份文本。
    assert.match(source('src/modules/export/decorate.ts'), /\^https\?:\\\/\\\/\/i\.test\(raw\)/);
    // 正文一路不许再直接调那个会补协议的函数
    assert.doesNotMatch(decorate, /exportLinkUrl\(anchor/);

    // 页眉页脚那两个输入框照旧补协议——用户想推广的就是 edu.example.com 那种写法
    assert.match(decorate, /const url = exportLinkUrl\(raw\)/);
});

test('先问去处再做图：保存框立刻弹出，选完路径弹窗才关', () => {
    const exporter = code('src/modules/export/exporter.ts');
    const modal = code('src/modules/export/modal.ts');

    // 旧顺序是先栅格化（长文好几秒、屏幕上什么都没有）再弹保存框，
    // 而且那几秒完全可能白花——用户在保存框里按了取消。
    const asked = exporter.indexOf('chooseTarget(ctx, file, candidate.format)');
    const drawn = exporter.indexOf('domToImage.toBlob');

    assert.ok(asked > 0 && drawn > asked, '必须先 chooseTarget 再栅格化');

    // 取消保存框＝这次没导出成，弹窗留着：他刚调了十分钟的那套风格不该因此消失
    assert.match(modal, /if \(!await this\.confirm\(candidate\) \|\| !this\.active\) return;/);
    assert.match(exporter, /return picked\.target !== null;/);

    // 真的要等的那一段有一块进度条，而不是一条不会动的角落提示
    assert.match(exporter, /openExportProgress\(ctx\.app/);
    assert.match(exporter, /progress\.succeed\(/);
    assert.match(exporter, /progress\.fail\(message\)/);
});

test('进度按阶段走并自报家门，PDF 比 PNG 多一步', () => {
    const exporter = code('src/modules/export/exporter.ts');
    const body = code('src/modules/export/progressBody.ts');

    // 步数随格式变：PDF 多一步「装进单页 PDF」，而那一步是真的要花时间
    assert.match(exporter, /style\.format === 'pdf' \? 4 : 3/);

    // 每一步都带一句「此刻在干什么」——按字节的百分比装不出来（dom-to-image 不给回调），
    // 所以标签才是消除「盲盒感」的那一半
    for (const label of ['排版定稿…', '正在栅格化', '装进单页 PDF…', '写入文件…']) {
        assert.ok(exporter.includes(label), `少了这一步的说明：${label}`);
    }

    // step 必须等界面真的画出来再放行：只等一帧的话，紧接着那段同步重活会把更新压住，
    // 进度条从头到尾只画一次——那比没有进度条更糟
    assert.match(body, /requestAnimationFrame\(\(\) => requestAnimationFrame\(/);

    // 失败不自动关：那句话是用户唯一能拿去问「为什么」的东西
    assert.match(body, /ziminos-export-progress-actions/);
    assert.match(body, /'知道了'/);

    // 纯 DOM 半边零 obsidian 依赖，演示页才拿得走同一份代码
    assert.doesNotMatch(body, /from 'obsidian'/);
});

test('正文左右等宽：屏幕上留给滚动条的那点不对称，不该跟到纸上', () => {
    const paper = code('src/modules/export/paper.ts');

    // 真机量到左 88px、右 62px——照抄得越忠实，偏心越明显
    assert.match(paper, /paddingX/);
    assert.doesNotMatch(paper, /paddingLeft:|paddingRight:/);

    // 取平均而不是取大的那个：正文栏宽度分毫不变，改的只是它摆在哪儿
    assert.match(paper, /pixels\(computed\.paddingLeft\) \+ pixels\(computed\.paddingRight\)\) \/ 2/);
    assert.match(paper, /\$\{metrics\.paddingY\}px \$\{metrics\.paddingX\}px/);
});

test('页边只有一个来源，纸宽只有一个答案：右边不再多出一条没底色的带子', () => {
    const paper = code('src/modules/export/paper.ts');

    // 一、纸自己的内边距清零。它挂着 .markdown-preview-view，主题会顺手再塞一份（真机 32px）；
    // 留着它，页边就有两个来源，而正文栏还会从这份内边距里溢出去整整那么多
    assert.match(paper, /padding: '0'/);

    // 二、正文栏跟着纸走，不自己记一个宽度。两处各记一份，resize 漏改一处就溢出，而且无声
    assert.match(paper, /width: '100%'/);
    assert.doesNotMatch(paper, /content\.style\.width/);

    // 三、量纸宽问的是纸自己的宽。scrollWidth 是「含溢出」的宽——纸不加宽、画布却加宽，
    // 多出来那块没有纸的底色，就是用户看见的右边那条空带子
    assert.match(paper, /width: Math\.ceil\(Math\.max\(1, article\.offsetWidth\)\)/);
    assert.doesNotMatch(paper, /article\.scrollWidth/);
    // 高度反过来必须含内容：纸本来就该跟着内容往下长，那正是「长图」的意思
    assert.match(paper, /height: Math\.ceil\(Math\.max\(1, article\.scrollHeight\)\)/);
});

test('量的是第一个量得到的那一栏，不是第一个存在的', () => {
    const paper = code('src/modules/export/paper.ts');

    // 一篇笔记被阅读视图渲过一次，那个 .markdown-preview-sizer 就一直留在 DOM 里；
    // 切回编辑态它不消失，只是宽度变 0。认「存在」就会在编辑态永远先撞上它，
    // 随即整套回落 FALLBACK——「量自编辑区」这条主线于是一次都没真正跑过，且什么都不报
    assert.match(paper, /found !== null && found\.getBoundingClientRect\(\)\.width >= 1/);

    // 顺序仍然是「阅读态 → 编辑态正文栏 → 编辑器整栏」，兜底仍然整套一起回落
    assert.match(paper, /COLUMN_SELECTORS = \['\.markdown-preview-sizer', '\.cm-content', '\.cm-sizer'\]/);
});

test('参考线只画给嵌套列表：顶层没有父级，那条线什么都不表示', () => {
    const css = source('vault/.obsidian/plugins/ziminos/styles.css');

    assert.match(css, /\.ziminos-export-guides \.ziminos-export-markdown li > ul::before/);
    // v0.25.0 画给了所有 ul，于是列表左边多出一条贴边的竖线
    assert.doesNotMatch(css, /\.ziminos-export-guides \.ziminos-export-markdown ul::before/);
});

test('只填链接不填文字也成立：链接自己就是那一行的内容', () => {
    const decorate = code('src/modules/export/decorate.ts');

    // 链接原本不参与「这一行有没有东西」的判断，于是「只填链接」得到的是
    // 整行不存在、没有可点区域、而且不报错——一个填了却什么都不发生的输入框
    assert.match(decorate, /const url = exportLinkUrl\(input\.link\)/);
    assert.match(decorate, /const text = input\.text \|\| \(url \? input\.link\.trim\(\) : ''\)/);
    // 开关排在最前：关着就是关着，哪怕那行字还写在设置里
    assert.match(decorate, /if \(!input\.enabled \|\| \(!text && !showLogo\)\) return null;/);

    // 印出来的是他填的原文，不是验形后补过协议的 href
    assert.doesNotMatch(decorate, /createSpan\(\{ text: url \}\)/);
});

test('下划线只在 PDF 下画：在 PNG 里「可以点」这句话是假的', () => {
    const decorate = code('src/modules/export/decorate.ts');

    assert.match(decorate, /if \(url && input\.format === 'pdf'\)/);
    assert.match(decorate, /textDecoration = 'underline'/);

    // 没有任何视觉提示的可点区域等于不存在——没人会去点它
    assert.match(decorate, /textUnderlineOffset/);
});

test('导出明暗与 Obsidian 当前主题分开，默认仍是跟随', () => {
    assert.equal(style.DEFAULT_EXPORT_STYLE.theme, 'auto');
    assert.equal(style.normalizeExportStyle({ theme: 'light' }).theme, 'light');
    assert.equal(style.normalizeExportStyle({ theme: 'dark' }).theme, 'dark');
    // 坏值回落跟随：换了默认，所有人下一次导出的底色都变了
    assert.equal(style.normalizeExportStyle({ theme: 'sepia' }).theme, 'auto');
    assert.equal(style.normalizeExportStyle({}).theme, 'auto');

    const paper = code('src/modules/export/paper.ts');

    // v0.29.0 只往舞台挂一个类，赌「主题把配色变量定义在不带 body 限定的选择器下」。
    // 这个赌注对变量基本成立，对规则不成立：`body.theme-dark .foo { … }` 这种写法
    // （Minimal 有、Style Settings 生成的有、这本库十三个片段也有）在子树里挂多少类都够不着，
    // 于是纸换了底色、Bases 表头与代码块却留着原来那身颜色。用户的判据是
    // 「把整个 Obsidian 想象成换了明暗主题再导出」——那就别想象，真的换。
    assert.match(paper, /function swapInterfaceTheme/);
    assert.match(paper, /body\.addClass\(wanted\)/);
    assert.match(paper, /const body = document\.body/);

    // 换了就必须还得回来，而且是无条件的：导出失败、取消、Esc 关窗都走 release 那条路
    assert.match(paper, /restoreTheme\?\.\(\)/);
    assert.match(paper, /function release\(\): void \{\s*restoreTheme\?\.\(\);/);

    // 记的是「原来有没有这个类」而不是「原来是哪一套」：
    // 两个类都不在（跟随系统配色）时，后者会凭空加出一个
    assert.match(paper, /present: body\.hasClass\(name\)/);

    // 明暗必须排在装饰之前：装饰层要读正文色去定水印颜色
    for (const file of ['src/modules/export/modal.ts', 'src/modules/export/exporter.ts']) {
        const source = code(file);
        const themed = source.indexOf('setTheme(');
        const decorated = source.indexOf('applyDecorations(');

        assert.ok(themed > 0 && decorated > themed, `${file}: setTheme 必须排在 applyDecorations 之前`);
    }
});

test('演示页是生成物：改了插件却忘了重新生成，这里当场变红', { skip: !IS_PRO_REPO }, async () => {
    const { buildExportDemo, DEMO_PATH } = await loadDemo();
    const generated = await buildExportDemo();
    const committed = readFileSync(DEMO_PATH, 'utf8');

    // 不用 assert.equal——两份九万字节的字符串不相等时，它会把整份差异打进终端
    assert.ok(
        generated === committed,
        'docs/导出预览交互演示.html 已过期：它的源改了但产物没跟着生成。运行 npm run demo。',
    );
});

test('演示页嵌的是插件真源，而不是一份照着抄的仿真', { skip: !IS_PRO_REPO }, async () => {
    const { DEMO_PATH } = await loadDemo();
    const demo = readFileSync(DEMO_PATH, 'utf8');
    const css = source('vault/.obsidian/plugins/ziminos/styles.css');
    const version = JSON.parse(source('package.json')).version;

    // 导出样式逐字嵌入：挑三条只可能来自插件 styles.css 的规则
    for (const rule of [
        '.ziminos-export-viewport {',
        '.ziminos-export-seg.ziminos-export-grid {',
        '.ziminos-export-duo-thumb {',
    ]) {
        assert.ok(css.includes(rule), `styles.css 里没有 ${rule}，这条断言该改了`);
        assert.ok(demo.includes(rule), `演示页没有逐字嵌入 ${rule}`);
    }

    // 几何、装饰与**控件列**都来自 esbuild 打包，而不是演示页自己又写了一遍
    assert.match(demo, /watermarkMark/);
    assert.match(demo, /applyDecorations/);
    assert.match(demo, /buildExportPanel/);
    assert.ok(demo.includes(`v${version}`), '演示页的版本号与 package.json 对不上');

    // 演示页永远不该自己解释 Markdown 或读盘：它只有一张写死的样张
    assert.doesNotMatch(demo, /MarkdownRenderer/);
});

test('演示页的接缝进了类型检查，但缺了它的第一版仓库同样要编得过', { skip: !IS_PRO_REPO }, () => {
    const tsconfig = JSON.parse(source('tsconfig.json'));
    const publish = source('publish-v1.sh');

    // publish-v1.sh 把 tsconfig.json 同步给第一版，却把 docs/ 留在第二版这边。
    // 于是第一版仓库会拿到一条指向不存在路径的 include——这正是备案里那次
    // 「发布通道静默卡死」的形状，所以这条断言必须存在。
    assert.ok(/^\s*tsconfig\.json\s*$/m.test(publish), 'publish-v1.sh 不再同步 tsconfig，这条断言该改了');
    assert.ok(/^\s*docs\s*$/m.test(publish), 'docs 不再是第二版专属，这条断言该改了');


    assert.ok(tsconfig.include.includes('docs/export-demo/entry.ts'));
    // src 那条必须留着：include 里的路径不匹配只是被忽略，但**全部都不匹配**时
    // tsc 会报「找不到输入文件」而整条构建断在第一版那边。
    assert.ok(
        tsconfig.include.includes('src/**/*.ts'),
        'include 里必须留着 src 那条，否则缺了 docs/ 的第一版仓库会报「找不到输入」',
    );
});

/**
 * 这一条**两个仓库都要跑**，因此刻意不挂那道闸。
 *
 * 它查的不是第二版的交付物，而是**会被同步过去的那两个文件自己**：tests/ 是同步范围内的，
 * 于是这里面任何一条指向 docs/ 的顶层静态 import，在第一版仓库都是「文件加载不起来」——
 * 整份断言连一条都跑不到，连 skip 都来不及。v0.30.0 就这么把发布通道堵死了整整两个版本，
 * 一声不响，直到有人真去跑它。
 */
test('会被同步的测试文件不许顶层 import 第二版专属的东西', () => {
    for (const file of ['tests/export.mjs', 'tests/regression.mjs']) {
        assert.doesNotMatch(
            code(file),
            /^import .* from '\.\.\/docs\//m,
            `${file} 顶层静态 import 了 docs/，而第一版仓库没有那个目录——改成按需 import`,
        );
    }
});

test('纸张一个开关管两边；高度只是下限，绝不裁内容', () => {
    assert.equal(style.DEFAULT_EXPORT_STYLE.pageMode, 'auto');
    // v0.27.0 那两个开关合成了一个：高度本来就是下限，拖到最小就等于没约束，
    // 于是「只想钉宽度」在一个开关下照样做得到，而面板少了一行
    assert.equal('pageWidthMode' in style.DEFAULT_EXPORT_STYLE, false);
    assert.equal('pageHeightMode' in style.DEFAULT_EXPORT_STYLE, false);

    assert.equal(layout.pageWidthOf(style.DEFAULT_EXPORT_STYLE), null);
    assert.equal(layout.pageMinHeightOf(style.DEFAULT_EXPORT_STYLE), null);

    const fixed = style.normalizeExportStyle({ pageMode: 'fixed', pageWidth: 800, pageHeight: 1_600 });

    assert.equal(layout.pageWidthOf(fixed), 800);
    assert.equal(layout.pageMinHeightOf(fixed), 1_600);

    assert.equal(style.normalizeExportStyle({ pageMode: 'A4' }).pageMode, 'auto');
    assert.equal(style.normalizeExportStyle({ pageWidth: 99_999 }).pageWidth, 2_400);
    assert.equal(style.normalizeExportStyle({ pageHeight: 1 }).pageHeight, 200);

    // 纸张预设只是两个数字的快捷填法，不是第四种尺寸模式
    assert.equal(style.PAPER_PRESET_SIZES.free, null);
    assert.deepEqual(style.PAPER_PRESET_SIZES.a4, { width: 794, height: 1_123 });
    assert.deepEqual(style.PAPER_PRESET_SIZES.a3, { width: 1_123, height: 1_587 });
    assert.equal(style.normalizeExportStyle({ paperPreset: 'B5' }).paperPreset, 'free');

    // 最小高度落在纸上、由 CSS 的 min-height 承担，因此内容更高时只会往下长，不会被裁
    const paper = code('src/modules/export/paper.ts');

    assert.match(paper, /article\.style\.minHeight/);
    assert.doesNotMatch(paper, /style\.height = /);
});

test('三个开关把「关闭」从推断变成声明，升级时从内容推导', () => {
    // 全新的库：三段都关着，面板只剩六行
    assert.equal(style.DEFAULT_EXPORT_STYLE.headerEnabled, false);
    assert.equal(style.DEFAULT_EXPORT_STYLE.footerEnabled, false);
    assert.equal(style.DEFAULT_EXPORT_STYLE.watermarkEnabled, false);

    // 老库的 data.json 里没有这三个键。取 false 会让所有人的页眉页脚水印一夜消失，
    // 取 true 会让空内容的段落平白展开——唯一对的默认是「有东西就是开着」
    const upgraded = style.normalizeExportStyle({
        header: '赵子民 · {date}',
        watermarkLogoSize: 40,
    });

    assert.equal(upgraded.headerEnabled, true, '有文字就该是开着的');
    assert.equal(upgraded.footerEnabled, false, '什么都没有就该是关着的');
    assert.equal(upgraded.watermarkEnabled, true, '只有标志也算开着');

    // 明写过的就照他写的来，不再推导
    assert.equal(style.normalizeExportStyle({ header: '有字', headerEnabled: false }).headerEnabled, false);
    assert.equal(style.normalizeExportStyle({ header: '', headerEnabled: true }).headerEnabled, true);

    // 关着的那一段在纸上一个字都不留
    const decorate = code('src/modules/export/decorate.ts');

    assert.match(decorate, /if \(!style\.watermarkEnabled \|\| \(!text && !showLogo\)\) return;/);
});

test('控件列分家且不 import obsidian，于是演示页能原样搬走它', () => {
    const panel = code('src/modules/export/panel.ts');
    const modal = code('src/modules/export/modal.ts');

    // 分家的判据与 settings/settingsPanels 同源：变更理由不同
    assert.match(modal, /buildExportPanel\(/);
    assert.doesNotMatch(modal, /EXPORT_SLIDERS/);

    // 不 import obsidian 才搬得走；它只用 HTMLElement 上那几个便捷方法
    assert.doesNotMatch(panel, /from 'obsidian'/);
    assert.match(panel, /EXPORT_SLIDERS/);

    // 演示页用的就是这一列，不再自己画一份。
    // 第一版仓库没有 docs/，那边这一句跳过——它验的是演示页，而演示页不属于那个版次
    if (IS_PRO_REPO) assert.match(code('docs/export-demo/driver.js'), /Z\.buildExportPanel\(/);

    // 两边都在 800 行以内——那条线是重构的触发点，不是上限
    assert.ok(panel.split('\n').length < 800);
    assert.ok(modal.split('\n').length < 800);
});

test('改纸宽只让浏览器重排，不重新解释一遍 Markdown', () => {
    const paper = code('src/modules/export/paper.ts');
    const modal = code('src/modules/export/modal.ts');
    const exporter = code('src/modules/export/exporter.ts');

    assert.match(paper, /resize: \(width, minHeight\)/);

    // 先定尺寸、再施装饰：水印层要盖满**此刻**这张纸，
    // 装饰跑在尺寸前面的话，它量到的是上一张纸的高度
    for (const source of [modal, exporter]) {
        const sized = source.indexOf('resize(pageWidthOf(');
        const decorated = source.indexOf('applyDecorations(');

        assert.ok(sized > 0 && decorated > sized, 'resize 必须排在 applyDecorations 之前');
    }
});
