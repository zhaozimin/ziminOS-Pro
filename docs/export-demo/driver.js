/*
 * [INPUT]: 依赖 window.ZExport（由 entry.ts 打包而来的插件真源：契约表、几何与 applyDecorations）
 *          与 shell.html 铺好的那几个挂载点
 * [OUTPUT]: 让演示页里的弹窗真的能用——控件、实时预览、明暗切换与两套示例风格
 * [POS]: 演示页的"驱动"一半。它刻意**不复制**插件的任何判断：控件清单来自 EXPORT_SLIDERS，
 *        标签来自那几张 LABELS 表，装饰由 applyDecorations 施加，
 *        因此改了插件的表、演示页下次生成就跟着变，不存在两处各说各话的可能。
 *        它与 modules/export/modal.ts 是同一套交互的两个宿主：那边住在 Obsidian 里，
 *        这边住在浏览器里；两边都只会做一件事——改 style，然后重放装饰
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

(function () {
    'use strict';

    var Z = window.ZExport;

    // ── Obsidian 给 HTMLElement 挂的那几个便捷方法。decorate.ts 用到哪几个就补哪几个 ──
    HTMLElement.prototype.createDiv = function (o) {
        return this.appendChild(apply(document.createElement('div'), o));
    };
    HTMLElement.prototype.createSpan = function (o) {
        return this.appendChild(apply(document.createElement('span'), o));
    };
    HTMLElement.prototype.createEl = function (tag, o) {
        return this.appendChild(apply(document.createElement(tag), o));
    };
    HTMLElement.prototype.toggleClass = function (cls, on) {
        this.classList.toggle(cls, !!on);
        return this;
    };

    function apply(el, o) {
        if (!o) return el;
        if (o.cls) el.className = o.cls;
        if (o.text) el.textContent = o.text;
        if (o.attr) Object.keys(o.attr).forEach(function (k) { el.setAttribute(k, o.attr[k]); });
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

    /** 演示开场不是空白的默认值：空着的页眉页脚水印说明不了任何事 */
    var OPENING = Object.assign({}, Z.DEFAULT_EXPORT_STYLE, {
        header: '{title}　·　{date}',
        headerAlign: 'right',
        headerGap: 22,
        footer: '赵子民　·　ziminOS 个人知识管理',
        footerAlign: 'left',
        footerGap: 34,
        watermark: '赵子民 · ziminOS',
        watermarkOpacity: 13,
        headerLogoSize: 26,
        watermarkLogoSize: 34,
        headerLink: 'edu.zhaozimin.cn',
    });

    var PRESETS = {
        'preset-brand': {
            label: '品牌落款',
            patch: {
                watermarkMode: 'single',
                watermarkAnchor: 'bottom-right',
                watermarkGapX: 44,
                watermarkGapY: 36,
                watermarkSize: 20,
                watermarkLogoSize: 40,
                watermarkAngle: 0,
                watermarkOpacity: 40,
                watermark: '赵子民',
            },
        },
        'preset-guard': {
            label: '防转发平铺',
            patch: {
                watermarkMode: 'tile',
                watermarkGapX: 96,
                watermarkGapY: 72,
                watermarkSize: 15,
                watermarkLogoSize: 26,
                watermarkAngle: -32,
                watermarkOpacity: 11,
                watermark: '赵子民 · 仅供本人阅读',
            },
        },
    };

    var style = Object.assign({}, OPENING);
    var logo = null;
    var refreshers = [];
    var frame = null;

    var viewport = document.getElementById('viewport');
    var canvas = document.getElementById('canvas');
    var meta = document.getElementById('meta');
    var controls = document.getElementById('controls');
    var picker = document.getElementById('picker');
    var toastEl = document.getElementById('toast');

    var stage = document.createElement('div');
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
            '<p>贴一层半透明的字上去，谁都会。难的是让它<strong>既裁不掉、又不挡字</strong>——这两件事互相拉扯，只有你亲眼看着调，才知道停在哪儿。所以这个功能的第一性不是"能加水印"，是"边看边调"。</p>',
            '<blockquote><p>左边那张纸，就是等会儿被拍下来的那一个元素。不是示意图。</p></blockquote>',
            '<p>平铺适合防转发：整篇铺满，截哪一段都带着你的名字。单个落款适合署名：安静地待在一角，像信纸下方那一行。两者不是浓淡之别，是两个目的。</p>',
            '<ul><li>页眉页脚<ul><li>对齐与离正文多远</li><li>文字颜色，或跟随主题</li><li>可以只放标志不写字</li></ul></li>'
             + '<li>水印<ul><li>排布：平铺 / 单个落款</li><li>九宫格落点、字号、横纵间距</li><li>角度与不透明度<ul><li>太淡等于没有</li><li>太浓等于毁了正文</li></ul></li></ul></li>'
             + '<li>标志：一条路径，三处各自决定放多大，0 就是不放</li></ul>',
            '<pre><code>applyDecorations(article, style, context, logo)</code></pre>',
            '<p>整套风格会被记住。水印是你的品牌，而品牌的意思就是每次都一样。</p>',
        ].join('');

        return el;
    }

    // ══════════════════════════════════════════════════════════
    // 预览
    // ══════════════════════════════════════════════════════════

    function redraw() {
        Z.applyDecorations(article, style, CONTEXT, logo);
        fit();
    }

    function schedule() {
        if (frame !== null) return;
        frame = requestAnimationFrame(function () { frame = null; redraw(); });
    }

    function fit() {
        var width = Math.ceil(Math.max(1, article.scrollWidth));
        var height = Math.ceil(Math.max(1, article.scrollHeight));
        var available = Math.max(1, viewport.clientWidth - 24);
        var scale = Math.min(1, available / width);

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

    // ══════════════════════════════════════════════════════════
    // 控件：清单全部来自插件真源，演示页自己不列一份
    // ══════════════════════════════════════════════════════════

    function row(cls, name, desc) {
        var item = controls.createDiv({ cls: 'setting-item' + (cls ? ' ' + cls : '') });
        var info = item.createDiv({ cls: 'setting-item-info' });
        var nameEl = info.createDiv({ cls: 'setting-item-name' });

        nameEl.textContent = name;

        var descEl = info.createDiv({ cls: 'setting-item-description' });

        if (desc) descEl.textContent = desc;

        return { item: item, name: nameEl, desc: descEl, control: item.createDiv({ cls: 'setting-item-control' }) };
    }

    function heading(text) { row('setting-item-heading', text, ''); }

    function update(patch) {
        style = Object.assign({}, style, patch);
        sync();
        schedule();
    }

    function sync() { refreshers.forEach(function (fn) { fn(); }); }

    function picker3(host, values, labels, read, write, grid) {
        var group = host.createDiv({ cls: 'ziminos-export-picker' + (grid ? ' ziminos-export-grid' : '') });
        var buttons = values.map(function (value) {
            var button = group.createEl('button', { attr: { type: 'button' } });

            button.textContent = labels[value];
            button.addEventListener('click', function () { write(value); });

            return { value: value, button: button };
        });

        refreshers.push(function () {
            var current = read();

            buttons.forEach(function (entry) {
                entry.button.classList.toggle('is-active', entry.value === current);
            });
        });
    }

    function textbox(host, key, placeholder) {
        var input = host.createEl('input', { attr: { type: 'text', placeholder: placeholder } });

        input.addEventListener('input', function () {
            var patch = {};

            patch[key] = input.value;
            update(patch);
        });
        refreshers.push(function () {
            if (input.value !== style[key]) input.value = style[key];
        });
    }

    /**
     * 一个颜色栏。空串＝跟随正文色，所以它比一个普通取色器多一个「退回去」的按钮——
     * 取色器本身没有空态，少了那枚按钮，点过一次就再也回不到跟随主题。
     */
    function colorRow(key, name) {
        var cell = row('ziminos-export-field', name, '');
        var input = cell.control.createEl('input', { attr: { type: 'color' } });
        var reset = cell.control.createEl('button', { attr: { type: 'button' } });

        reset.textContent = '↺';
        reset.className = 'clickable-icon';
        reset.title = '跟随正文色';

        input.addEventListener('input', function () {
            var patch = {};

            patch[key] = input.value;
            update(patch);
        });
        reset.addEventListener('click', function () {
            var patch = {};

            patch[key] = '';
            update(patch);
        });
        refreshers.push(function () {
            input.value = style[key] || inheritedColor();
            cell.desc.textContent = style[key]
                ? '用这个色：' + style[key]
                : '跟随正文色（明暗两套主题下都读得出）。';
        });
    }

    function inheritedColor() {
        var match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(article).color || '');

        if (!match) return '#6b7280';

        return '#' + [match[1], match[2], match[3]].map(function (part) {
            return Number(part).toString(16).padStart(2, '0');
        }).join('');
    }

    /** 一段（页眉/页脚/水印）此刻有没有东西，与 modal.ts 的 stateOf 同一套判据 */
    function stateOf(textKey, logoSizeKey) {
        var hasText = String(style[textKey]).trim() !== '';
        var hasLogo = logo !== null;

        return { text: hasText, logo: hasLogo, mark: hasText || (hasLogo && style[logoSizeKey] > 0) };
    }

    function sliders(section) {
        return Z.EXPORT_SLIDERS.filter(function (spec) { return spec.section === section; })
            .map(function (spec) {
                var cell = row('ziminos-export-field', spec.name, spec.desc);
                var readout = cell.name.createSpan({ cls: 'ziminos-export-value' });
                var input = cell.control.createEl('input', { attr: { type: 'range' } });

                input.min = spec.min;
                input.max = spec.max;
                input.step = spec.step;
                input.addEventListener('input', function () {
                    var patch = {};

                    patch[spec.key] = Number(input.value);
                    update(patch);
                });
                refreshers.push(function () {
                    if (Number(input.value) !== style[spec.key]) input.value = style[spec.key];
                    readout.textContent = style[spec.key] + spec.unit;
                });

                return { spec: spec, cell: cell };
            });
    }

    function disable(rows, state) {
        rows.forEach(function (entry) {
            entry.cell.item.classList.toggle('is-disabled', !state[entry.spec.requires]);
        });
    }

    // 格式
    (function () {
        var cell = row('ziminos-export-field', '格式', 'PNG 是一整张长图；PDF 是只含一页的完整长页。两者拍的是同一张图。');
        var select = cell.control.createEl('select');

        Object.keys(Z.EXPORT_FORMAT_LABELS).forEach(function (value) {
            var option = select.createEl('option');

            option.value = value;
            option.textContent = Z.EXPORT_FORMAT_LABELS[value];
        });
        select.addEventListener('change', function () { update({ format: select.value }); });
        refreshers.push(function () { select.value = style.format; });
    })();

    // 正文
    (function () {
        heading('正文');

        var cell = row('ziminos-export-field', '列表参考线', '给列表画上缩进参考线，一眼看得出哪几条是同一层。');
        var box = cell.control.createEl('input', { attr: { type: 'checkbox' } });

        box.addEventListener('change', function () { update({ listGuides: box.checked }); });
        refreshers.push(function () { box.checked = !!style.listGuides; });
    })();

    // 品牌标志
    (function () {
        heading('品牌标志');

        var cell = row('ziminos-export-field ziminos-export-logo', '图片', '');
        var choose = cell.control.createEl('button', { attr: { type: 'button' } });
        var clear = cell.control.createEl('button', { attr: { type: 'button' } });

        choose.textContent = '选择图片…';
        clear.textContent = '✕';
        clear.className = 'clickable-icon';
        clear.title = '不用标志';

        choose.addEventListener('click', function () { picker.click(); });
        clear.addEventListener('click', function () { setLogo(null, ''); });
        picker.addEventListener('change', function () {
            var file = picker.files && picker.files[0];

            if (!file) return;

            var reader = new FileReader();

            reader.onload = function () { loadLogo(String(reader.result), file.name); };
            reader.readAsDataURL(file);
            picker.value = '';
        });

        refreshers.push(function () {
            cell.desc.textContent = !style.logo
                ? '选一张图片。页眉、页脚与水印各自决定放多大，尺寸 0 就是那一处不放。'
                : (logo ? style.logo + '　·　' + logo.width + ' × ' + logo.height
                    : '这张图读不出来了：' + style.logo);
        });
    })();

    ['header', 'footer'].forEach(function (section) {
        var label = section === 'header' ? '页眉' : '页脚';
        var alignKey = section === 'header' ? 'headerAlign' : 'footerAlign';
        var logoSizeKey = section === 'header' ? 'headerLogoSize' : 'footerLogoSize';
        var where = section === 'header' ? '显示在文章标题上方。' : '显示在文章正文下方。';

        heading(label);
        textbox(row('ziminos-export-field', '文字', where + '留空即不添加；可用 {title}、{date}、{time}。').control,
            section, '留空即不添加');

        var linkKey = section === 'header' ? 'headerLink' : 'footerLink';
        var colorKey = section === 'header' ? 'headerColor' : 'footerColor';
        var linkCell = row('ziminos-export-field', '链接', '');

        textbox(linkCell.control, linkKey, 'edu.example.com');
        refreshers.push(function () {
            var png = style.format === 'png';

            linkCell.desc.textContent = png
                ? 'PNG 是图片，点不了。要可点的链接，把格式换成 PDF。'
                : '填一个网址，这一行在 PDF 里整段可点（不带 https:// 也认）。';
            linkCell.desc.classList.toggle('ziminos-export-warn', png);
        });

        colorRow(colorKey, '文字颜色');

        var alignCell = row('ziminos-export-field', '位置', '');

        picker3(alignCell.control, ['left', 'center', 'right'], Z.EXPORT_ALIGN_LABELS,
            function () { return style[alignKey]; },
            function (value) { var p = {}; p[alignKey] = value; update(p); });

        var rows = sliders(section);

        refreshers.push(function () {
            var state = stateOf(section, logoSizeKey);

            alignCell.item.classList.toggle('is-disabled', !state.mark);
            disable(rows, state);
        });
    });

    // 水印
    (function () {
        heading('水印');
        textbox(row('ziminos-export-field', '文字', '留空即不添加；可用 {title}、{date}、{time}。只放标志也成立。').control,
            'watermark', '留空即不添加');

        colorRow('watermarkColor', '文字颜色');

        var modeCell = row('ziminos-export-field', '排布', '平铺裁不掉，适合防转发；单个安静，适合当落款。');

        picker3(modeCell.control, ['tile', 'single'], Z.WATERMARK_MODE_LABELS,
            function () { return style.watermarkMode; },
            function (value) { update({ watermarkMode: value }); });

        var anchorCell = row('ziminos-export-field', '位置', '单个落款落在纸的哪一格。');
        var anchors = Z.WATERMARK_ANCHOR_GRID.reduce(function (all, line) { return all.concat(line); }, []);

        picker3(anchorCell.control, anchors, Z.WATERMARK_ANCHOR_LABELS,
            function () { return style.watermarkAnchor; },
            function (value) { update({ watermarkAnchor: value }); }, true);

        var rows = sliders('watermark');

        refreshers.push(function () {
            var state = stateOf('watermark', 'watermarkLogoSize');

            modeCell.item.classList.toggle('is-disabled', !state.mark);
            anchorCell.item.classList.toggle('ziminos-export-hidden',
                !state.mark || style.watermarkMode !== 'single');
            disable(rows, state);
        });
    })();

    // ══════════════════════════════════════════════════════════
    // 底部按钮与外壳
    // ══════════════════════════════════════════════════════════

    (function () {
        var host = document.getElementById('actions');
        var reset = host.createEl('button', { attr: { type: 'button' } });
        var cancel = host.createEl('button', { attr: { type: 'button' } });
        var confirm = host.createEl('button', { attr: { type: 'button' } });

        reset.textContent = '↺';
        reset.className = 'clickable-icon';
        reset.title = '恢复默认风格';
        cancel.textContent = '取消';
        confirm.textContent = '导出';
        confirm.className = 'mod-cta';

        reset.addEventListener('click', function () { update(Z.DEFAULT_EXPORT_STYLE); });
        cancel.addEventListener('click', function () {
            toast('取消了。真插件里这一步零写入：设置不动，磁盘上什么都不留。');
        });
        confirm.addEventListener('click', function () {
            var size = Z.pdfPageSize(article.scrollWidth, article.scrollHeight);

            toast(style.format === 'png'
                ? '真插件会把左边这张纸一次性拍成 PNG，弹出系统保存框，并记住这套风格。'
                : '真插件会把同一张图装进一页 ' + Math.round(size.width) + '×' + Math.round(size.height) +
                  ' pt 的 PDF，弹出系统保存框，并记住这套风格。');
        });
    })();

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

    // ══════════════════════════════════════════════════════════
    // 标志
    // ══════════════════════════════════════════════════════════

    function setLogo(resolved, path) {
        logo = resolved;
        update({ logo: path });
    }

    /** 与插件 logo.ts 同一个姿态：解出来的是自包含 data URI 加它的像素尺寸 */
    function loadLogo(dataUrl, path) {
        var image = new Image();

        image.onload = function () {
            setLogo({
                path: path,
                dataUrl: dataUrl,
                width: image.naturalWidth || 1,
                height: image.naturalHeight || 1,
            }, path);
        };
        image.onerror = function () { setLogo(null, path); };
        image.src = dataUrl;
    }

    /** 开场先给一枚示例标志，否则三根「标志大小」滑块一上来就是灰的，看不出它们干什么 */
    function sampleLogo() {
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
    }

    sync();
    redraw();
    sampleLogo();
})();
