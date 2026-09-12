/*
 * [INPUT]: 依赖 window.ZExport（由 entry.ts 打包而来的插件真源：契约、几何、装饰、控件列与进度条）
 *          与 shell.html 铺好的那几个挂载点
 * [OUTPUT]: 让演示页里的弹窗真的能用——控件、实时预览、明暗切换、示例风格与导出进度
 * [POS]: 演示页的"驱动"一半。v0.30.0 起它**不再自己画控件**：右边那一列由插件真源的
 *        buildExportPanel 画出来，与 Obsidian 里的是同一份代码。驱动只负责它管不着的那几件事——
 *        建一张样张纸、按比例缩放、把「选图」接到本机文件框（真插件那里是系统框或库内清单）、
 *        以及走一遍导出进度。
 *        它与 modules/export/modal.ts 因此成了同一套交互的两个**骨架**：
 *        那边住在 Obsidian 里，这边住在浏览器里，中间那一列是共用的
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

(function () {
    'use strict';

    var Z = window.ZExport;

    // ── Obsidian 给 HTMLElement 挂的那几个便捷方法。panel.ts 用到哪几个就补哪几个 ──
    HTMLElement.prototype.createDiv = function (o) { return this.appendChild(mk('div', o)); };
    HTMLElement.prototype.createSpan = function (o) { return this.appendChild(mk('span', o)); };
    HTMLElement.prototype.createEl = function (t, o) { return this.appendChild(mk(t, o)); };
    HTMLElement.prototype.addClass = function (c) { this.classList.add(c); return this; };
    HTMLElement.prototype.removeClass = function (c) { this.classList.remove(c); return this; };
    HTMLElement.prototype.toggleClass = function (c, on) { this.classList.toggle(c, !!on); return this; };
    HTMLElement.prototype.setText = function (t) { this.textContent = t; return this; };

    function mk(tag, o) {
        var el = document.createElement(tag);
        if (o && o.cls) el.className = o.cls;
        if (o && o.text) el.textContent = o.text;
        if (o && o.attr) Object.keys(o.attr).forEach(function (k) { el.setAttribute(k, o.attr[k]); });
        return el;
    }

    // ── 这一次"导出"的三个事实，与插件里 templateContextOf 取的是同样三样 ──
    var now = new Date();
    var CONTEXT = {
        title: '为什么你的方法论没人愿意抄',
        date: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
        time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
    };

    function pad(n) { return String(n).padStart(2, '0'); }

    /** 演示开场不是空白的默认值：三段全关的面板说明不了任何事 */
    var OPENING = Object.assign({}, Z.DEFAULT_EXPORT_STYLE, {
        headerEnabled: true, footerEnabled: true, watermarkEnabled: true,
        header: '{title}　·　{date}', headerAlign: 'right', headerGap: 22,
        headerLink: 'edu.zhaozimin.cn', headerLogoSize: 26,
        footer: '赵子民　·　ziminOS 个人知识管理', footerAlign: 'left', footerGap: 34,
        watermark: '赵子民 · ziminOS', watermarkOpacity: 13, watermarkLogoSize: 34,
    });

    var PRESETS = {
        'preset-brand': {
            label: '品牌落款',
            patch: {
                watermarkEnabled: true, watermarkMode: 'single', watermarkAnchor: 'bottom-right',
                watermarkGapX: 44, watermarkGapY: 36, watermarkSize: 20, watermarkLogoSize: 40,
                watermarkAngle: 0, watermarkOpacity: 40, watermark: '赵子民',
            },
        },
        'preset-guard': {
            label: '防转发平铺',
            patch: {
                watermarkEnabled: true, watermarkMode: 'tile', watermarkGapX: 96, watermarkGapY: 72,
                watermarkSize: 15, watermarkLogoSize: 26, watermarkAngle: -32,
                watermarkOpacity: 11, watermark: '赵子民 · 仅供本人阅读',
            },
        },
    };

    var style = Object.assign({}, OPENING);
    var logo = null;
    var frame = null;
    var refreshPanel = null;

    var viewport = document.getElementById('viewport');
    var canvas = document.getElementById('canvas');
    var meta = document.getElementById('meta');
    var picker = document.getElementById('picker');
    var toastEl = document.getElementById('toast');

    var stage = document.createElement('div');
    var column = null;
    var article = buildPaper(stage);

    // ══════════════════════════════════════════════════════════
    // 那张纸
    // ══════════════════════════════════════════════════════════

    function buildPaper(host) {
        var el = host.createDiv({ cls: 'ziminos-export-article' });

        Object.assign(el.style, {
            boxSizing: 'border-box', position: 'relative', width: '760px', minHeight: '1px',
            overflow: 'visible', color: 'var(--text-normal)', background: 'var(--background-primary)',
        });

        var content = el.createDiv({ cls: 'markdown-preview-sizer' });

        column = content;
        Object.assign(content.style, {
            boxSizing: 'border-box', position: 'relative', width: '760px',
            maxWidth: 'none', padding: '48px 56px',
        });

        var title = content.createDiv({ cls: 'demo-title' });

        title.textContent = CONTEXT.title;

        // 正文容器必须与 paper.ts 用同一个类名：插件的参考线等样式是按它选中的，
        // 演示页换个类名就会「这里好看、装上去不是那样」——而那正是这份演示页要杜绝的事。
        var body = content.createDiv({ cls: 'ziminos-export-markdown demo-body' });

        body.innerHTML = [
            '<p>你问我：把答案整理好发给客户，对方转手就发给了别人，我还剩下什么。</p>',
            '<h2>水印不是补丁，是这张纸本来的样子</h2>',
            '<p>贴一层半透明的字上去，谁都会。难的是让它<strong>既裁不掉、又不挡字</strong>——这两件事互相拉扯，只有你亲眼看着调，才知道停在哪儿。</p>',
            '<blockquote><p>左边那张纸，就是等会儿被拍下来的那一个元素。不是示意图。</p></blockquote>',
            '<ul><li>页眉页脚<ul><li>对齐与离正文多远</li><li>文字颜色，或跟随主题</li><li>可以只放标志不写字</li></ul></li>'
             + '<li>水印<ul><li>排布：平铺 / 单个落款</li><li>九宫格落点、字号、横纵间距</li><li>角度与不透明度<ul><li>太淡等于没有</li><li>太浓等于毁了正文</li></ul></li></ul></li>'
             + '<li>标志：一条路径，三处各自决定放多大，0 就是不放</li></ul>',
            '<pre><code>applyDecorations(article, style, context, logo)</code></pre>',
            '<p>整套风格会被记住。水印是你的品牌，而品牌的意思就是每次都一样。</p>',
        ].join('');

        return el;
    }

    // ══════════════════════════════════════════════════════════
    // 预览：与 modal.ts 的 redraw 同样的四步、同样的先后
    // ══════════════════════════════════════════════════════════

    function redraw() {
        stage.classList.remove('theme-light', 'theme-dark');
        if (style.theme !== 'auto') stage.classList.add('theme-' + style.theme);

        var width = Z.pageWidthOf(style) || 760;
        var minHeight = Z.pageMinHeightOf(style) || 1;

        article.style.width = width + 'px';
        if (column) column.style.width = width + 'px';
        article.style.minHeight = minHeight + 'px';

        Z.applyDecorations(article, style, CONTEXT, logo);
        fit();
    }

    function schedule() {
        if (frame === null) frame = requestAnimationFrame(function () { frame = null; redraw(); });
    }

    function fit() {
        var width = Math.ceil(Math.max(1, article.scrollWidth));
        var height = Math.ceil(Math.max(1, article.scrollHeight));
        var scale = Math.min(1, Math.max(1, viewport.clientWidth - 24) / width);

        canvas.appendChild(stage);
        Object.assign(stage.style, {
            position: 'absolute', left: '0', top: '0',
            transform: 'scale(' + scale + ')', transformOrigin: 'top left',
        });
        canvas.style.width = Math.ceil(width * scale) + 'px';
        canvas.style.height = Math.ceil(height * scale) + 'px';

        meta.textContent =
            '纸面 ' + width.toLocaleString('zh-CN') + ' × ' + height.toLocaleString('zh-CN') + ' px' +
            '　·　导出清晰度 ' + Z.captureScale(width, height).toFixed(1) + '×' +
            '　·　预览 ' + Math.round(scale * 100) + '%';
    }

    new ResizeObserver(fit).observe(viewport);

    function update(patch) {
        style = Object.assign({}, style, patch);
        if (refreshPanel) refreshPanel();
        schedule();
    }

    // ══════════════════════════════════════════════════════════
    // 控件列：来自插件真源，演示页一行都不重写
    // ══════════════════════════════════════════════════════════

    refreshPanel = Z.buildExportPanel(document.getElementById('controls'), {
        value: function () { return style; },
        update: update,
        logoUrl: function () { return logo ? logo.dataUrl : ''; },
        logoName: function () { return style.logo ? (logo ? style.logo : '读不出：' + style.logo) : '未选'; },
        inheritedColor: inheritedColor,
        // 真插件这里开的是系统文件框（桌面）或库内图片清单（手机）；
        // 演示页跑在浏览器里，换成本机文件选择框，好让读者直接拿自己的 logo 试
        pickLogo: function () { picker.click(); },
        clearLogo: function () { logo = null; update({ logo: '' }); },
    });

    function inheritedColor() {
        var m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(article).color || '');

        if (!m) return '#6b7280';

        return '#' + [m[1], m[2], m[3]].map(function (n) {
            return Number(n).toString(16).padStart(2, '0');
        }).join('');
    }

    picker.addEventListener('change', function () {
        var file = picker.files && picker.files[0];

        if (!file) return;

        var reader = new FileReader();

        reader.onload = function () { loadLogo(String(reader.result), file.name); };
        reader.readAsDataURL(file);
        picker.value = '';
    });

    /** 与插件 logo.ts 同一个姿态：解出来的是自包含 data URI 加它的像素尺寸 */
    function loadLogo(dataUrl, path) {
        var image = new Image();

        image.onload = function () {
            logo = { path: path, dataUrl: dataUrl, width: image.naturalWidth || 1, height: image.naturalHeight || 1 };
            update({ logo: path });
        };
        image.onerror = function () { logo = null; update({ logo: path }); };
        image.src = dataUrl;
    }

    // ══════════════════════════════════════════════════════════
    // 底部按钮与外壳
    // ══════════════════════════════════════════════════════════

    (function () {
        var host = document.getElementById('actions');
        var reset = host.createEl('button', { cls: 'ziminos-export-reset', text: '↺', attr: { type: 'button', title: '恢复默认风格' } });
        var cancel = host.createEl('button', { text: '取消', attr: { type: 'button' } });
        var confirm = host.createEl('button', { cls: 'mod-cta', text: '导出', attr: { type: 'button' } });

        reset.addEventListener('click', function () { update(Z.DEFAULT_EXPORT_STYLE); });
        cancel.addEventListener('click', function () {
            toast('取消了。真插件里这一步零写入：设置不动，磁盘上什么都不留。');
        });
        confirm.addEventListener('click', function () { runProgress(); });
    })();

    /**
     * 走一遍导出进度。
     *
     * 条与推进逻辑来自插件真源（createProgressBody），**每一步之间的等待是演示页伪造的**——
     * 这里没有真的在栅格化。伪造的只有时长，长什么样、怎么走、说什么话都是真的。
     * 真插件里点「导出」会先弹系统保存框，选完路径才轮到这一块。
     */
    function runProgress() {
        var veil = document.getElementById('veil');
        var host = document.getElementById('progress-host');
        var title = document.getElementById('progress-title');
        var pdf = style.format === 'pdf';
        var size = Z.pdfPageSize(article.scrollWidth, article.scrollHeight);

        host.textContent = '';
        title.textContent = '正在导出';
        veil.hidden = false;

        var body = Z.createProgressBody(host, {
            total: pdf ? 4 : 3,
            onTitle: function (text) { title.textContent = text; },
        });
        var steps = ['排版定稿…',
            '正在栅格化 ' + article.scrollWidth.toLocaleString('zh-CN') + ' × '
                + article.scrollHeight.toLocaleString('zh-CN') + ' px…'];

        if (pdf) steps.push('装进单页 PDF…');
        steps.push('写入文件…');

        var delays = pdf ? [260, 1400, 700, 320] : [260, 1600, 320];

        (function next(i) {
            if (i >= steps.length) {
                body.succeed(pdf
                    ? '已导出：一页 ' + Math.round(size.width) + '×' + Math.round(size.height) + ' pt 的 PDF'
                    : '已导出：一整张 PNG 长图');
                window.setTimeout(function () { veil.hidden = true; }, 1600);

                return;
            }

            body.step(steps[i]).then(function () {
                window.setTimeout(function () { next(i + 1); }, delays[i]);
            });
        })(0);
    }

    document.querySelectorAll('[data-demo]').forEach(function (button) {
        button.addEventListener('click', function () {
            var action = button.getAttribute('data-demo');

            if (action === 'theme') {
                var root = document.documentElement;

                root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
                schedule();

                return;
            }

            if (action === 'reset') { update(Z.DEFAULT_EXPORT_STYLE); return; }

            var preset = PRESETS[action];

            if (preset) {
                update(preset.patch);
                toast('已套用「' + preset.label + '」。每一项都还能继续拖。');
            }
        });
    });

    var toastTimer = null;

    function toast(text) {
        toastEl.textContent = text;
        toastEl.classList.add('is-on');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200);
    }

    /** 开场先给一枚示例标志，否则三根「标志」滑块一上来就看不出在干什么 */
    (function () {
        var svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80">',
            '<rect x="2" y="2" width="76" height="76" rx="18" fill="#6c5ce7"/>',
            '<text x="40" y="41" text-anchor="middle" dominant-baseline="central" fill="#fff"',
            ' font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="40" font-weight="700">子</text>',
            '<text x="94" y="33" fill="#2b3138" font-family="PingFang SC, sans-serif"',
            ' font-size="26" font-weight="700">赵子民</text>',
            '<text x="95" y="58" fill="#8b939e" font-family="Helvetica, sans-serif"',
            ' font-size="15" letter-spacing="2">ziminOS</text></svg>',
        ].join('');

        loadLogo('data:image/svg+xml,' + encodeURIComponent(svg), '90-system/示例标志.svg');
    })();

    refreshPanel();
    redraw();
})();
