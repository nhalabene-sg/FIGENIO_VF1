/* Genius Raros — PageGeometry (P2). Source unique dimensions / marges / orientation / zoom.
   Ne remplace pas applyPageGeometry ni window.abene : les lit et synchronise le CSS. */
(function (root) {
    var DPI = 96;
    var SIZES = {
        a4: { w: 794, h: 1123, mmW: 210, mmH: 297 },
        a5: { w: 559, h: 794, mmW: 148, mmH: 210 },
        letter: { w: 816, h: 1056, mmW: 216, mmH: 279 },
        legal: { w: 816, h: 1344, mmW: 216, mmH: 356 },
        executive: { w: 696, h: 1008, mmW: 184, mmH: 267 },
        a3: { w: 1123, h: 1587, mmW: 297, mmH: 420 }
    };

    function A() { return root.abene || {}; }
    function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }

    function sizePx(id) {
        var s = SIZES[id] || SIZES.a4;
        return { w: s.w, h: s.h };
    }
    function defaultMargins() {
        return { left: DPI, right: DPI, top: DPI, bottom: DPI };
    }
    function margins() {
        var m = A().pageMargins;
        if (m && m.top != null) {
            return {
                top: num(m.top, DPI),
                right: num(m.right, DPI),
                bottom: num(m.bottom, DPI),
                left: num(m.left, DPI)
            };
        }
        return defaultMargins();
    }
    function portraitSize() {
        var ps = A().pageSize;
        if (ps && ps.w && ps.h) return { w: num(ps.w, SIZES.a4.w), h: num(ps.h, SIZES.a4.h) };
        return sizePx(A().pageSizeId || 'a4');
    }
    function orientedWidth() {
        if (typeof root.getPageWidth === 'function') return root.getPageWidth();
        var ps = portraitSize();
        return orientation() === 'landscape' ? ps.h : ps.w;
    }
    function orientedHeight() {
        if (typeof root.getPageHeight === 'function') return root.getPageHeight();
        var ps = portraitSize();
        return orientation() === 'landscape' ? ps.w : ps.h;
    }
    function orientation() {
        return A().pageOrientation === 'landscape' ? 'landscape' : 'portrait';
    }
    function pxToMm(px) { return num(px, 0) * 25.4 / DPI; }
    function mmToPx(mm) { return num(mm, 0) * DPI / 25.4; }

    function syncCss() {
        var w = orientedWidth();
        var h = orientedHeight();
        var m = margins();
        var gutter = num(A().pageGutter, 0);
        var zoom = num(A().currentZoom, 100) / 100;
        var html = document.documentElement;
        if (!html || !html.style) return { w: w, h: h };
        html.style.setProperty('--page-w', w + 'px');
        html.style.setProperty('--page-h', h + 'px');
        html.style.setProperty('--page-zoom', String(zoom));
        html.style.setProperty('--pad-top', m.top + 'px');
        html.style.setProperty('--pad-right', m.right + 'px');
        html.style.setProperty('--pad-bottom', m.bottom + 'px');
        html.style.setProperty('--pad-left', (m.left + gutter) + 'px');
        html.style.setProperty('--write-h', Math.max(80, h - m.top - m.bottom) + 'px');
        return { w: w, h: h, zoom: zoom };
    }

    var PG = {
        dpi: DPI,
        SIZES: SIZES,
        sizePx: sizePx,
        defaultMargins: defaultMargins,
        pxToMm: pxToMm,
        mmToPx: mmToPx,
        syncCss: syncCss,
        get width() { return orientedWidth(); },
        get height() { return orientedHeight(); },
        get marginTop() { return margins().top; },
        get marginBottom() { return margins().bottom; },
        get marginLeft() { return margins().left; },
        get marginRight() { return margins().right; },
        get orientation() { return orientation(); },
        get paperSize() { return String(A().pageSizeId || 'a4'); },
        get zoom() { return num(A().currentZoom, 100); },
        apply: function () {
            if (typeof root.applyPageGeometry === 'function') root.applyPageGeometry();
            else syncCss();
        }
    };

    root.ABENE = root.ABENE || {};
    root.ABENE.PageGeometry = PG;
    root.PageGeometry = PG;
    if (!root.abenePageSizes) root.abenePageSizes = SIZES;
})(window);
