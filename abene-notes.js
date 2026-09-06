/* Genius Raros — Notas de rodapé (P8).
   La note s’affiche sur la page de l’appel et réduit la zone de texto.
   insertFootnote / insertEndnote / .abene-footnotes restent. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneNotesEngine') === '0') useEngine = false;
    } catch (e0) {}

    var pageSpace = [];
    var relayouting = false;
    var pass = 0;

    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function pageH() {
        if (root.PageGeometry && root.PageGeometry.height) return root.PageGeometry.height;
        if (typeof root.getPageHeight === 'function') return root.getPageHeight();
        return 1123;
    }
    function pageW() {
        if (root.PageGeometry && root.PageGeometry.width) return root.PageGeometry.width;
        if (typeof root.getPageWidth === 'function') return root.getPageWidth();
        return 794;
    }
    function yInEditor(el, editor) {
        if (!el || !editor) return 0;
        try {
            var er = editor.getBoundingClientRect();
            var rr = el.getBoundingClientRect();
            if (er.height) return (rr.top - er.top) * (editor.offsetHeight / er.height);
        } catch (e) {}
        return el.offsetTop || 0;
    }

    function markSource() {
        var editor = ed();
        if (!editor) return;
        var box = editor.querySelector('.abene-footnotes');
        if (!box) return;
        box.classList.add('abene-notes-source');
        box.setAttribute('aria-hidden', 'true');
    }

    function sourceNotes() {
        var editor = ed();
        var box = editor && editor.querySelector('.abene-footnotes');
        if (!box) return [];
        return Array.prototype.filter.call(box.querySelectorAll('p[id^="fn-"]'), function (p) {
            return !!p.id;
        });
    }

    function measureHtml(html, width) {
        var box = document.getElementById('abeneFnMeasure');
        if (!box) {
            box = document.createElement('div');
            box.id = 'abeneFnMeasure';
            box.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;font-size:9pt;line-height:1.25;font-family:Calibri,sans-serif;';
            document.body.appendChild(box);
        }
        box.style.width = Math.max(120, width) + 'px';
        box.innerHTML = '<div class="page-fn-rule"></div>' + html;
        return Math.max(0, Math.ceil(box.offsetHeight) + 6);
    }

    function notesByPage() {
        var editor = ed();
        var out = [];
        if (!editor || !useEngine) return out;
        var h = pageH();
        var m = A().pageMargins || { left: 96, right: 96 };
        var writeW = Math.max(120, pageW() - (m.left || 0) - (m.right || 0));
        var writeH = Math.max(80, h - (A().pageMargins && A().pageMargins.top || 96) - (A().pageMargins && A().pageMargins.bottom || 96));
        var maxFn = Math.round(writeH * 0.42);
        editor.querySelectorAll('.abene-fn-ref').forEach(function (ref) {
            var n = ref.getAttribute('data-fn');
            if (!n) return;
            var page = Math.max(0, Math.floor(yInEditor(ref, editor) / h));
            if (!out[page]) out[page] = { ids: [], html: '', h: 0 };
            if (out[page].ids.indexOf(n) >= 0) return;
            var src = document.getElementById('fn-' + n);
            var inner = src ? src.innerHTML : ('<sup>' + n + '</sup>');
            out[page].ids.push(n);
            out[page].html += '<p class="page-fn-item" data-fn="' + n + '">' + inner + '</p>';
        });
        out.forEach(function (slot, i) {
            if (!slot) return;
            slot.h = Math.min(maxFn, measureHtml(slot.html, writeW));
            out[i] = slot;
        });
        return out;
    }

    function computeSpaces() {
        var by = notesByPage();
        var spaces = [];
        var i;
        for (i = 0; i < by.length; i++) spaces[i] = by[i] && by[i].h ? by[i].h : 0;
        return { by: by, spaces: spaces };
    }

    function spaceForPage(page) {
        if (!useEngine) return 0;
        return Number(pageSpace[page]) || 0;
    }

    function paintChrome() {
        var chrome = document.getElementById('pageChrome');
        if (!chrome) return;
        chrome.querySelectorAll('.page-fn-zone').forEach(function (z) { z.remove(); });
        if (!useEngine) return;
        var editor = ed();
        if (!editor) return;
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var data = computeSpaces();
        var i, slot, top, zone;
        for (i = 0; i < data.by.length; i++) {
            slot = data.by[i];
            if (!slot || !slot.h) continue;
            top = i * h + h - (m.bottom || 0) - slot.h;
            zone = document.createElement('div');
            zone.className = 'page-fn-zone';
            zone.setAttribute('data-page', String(i + 1));
            zone.style.cssText = 'top:' + top + 'px;height:' + slot.h + 'px;padding-left:' + (m.left || 0) + 'px;padding-right:' + (m.right || 0) + 'px;';
            zone.innerHTML = '<div class="page-fn-rule"></div><div class="page-fn-list">' + slot.html + '</div>';
            chrome.appendChild(zone);
        }
        bindFnEdit(chrome);
    }

    function bindFnEdit(chrome) {
        chrome.querySelectorAll('.page-fn-item').forEach(function (item) {
            item.contentEditable = 'true';
            item.addEventListener('blur', function () {
                var n = item.getAttribute('data-fn');
                var src = n && document.getElementById('fn-' + n);
                if (src) src.innerHTML = item.innerHTML;
                if (typeof saveUndoState === 'function') saveUndoState();
            });
        });
    }

    function afterLayout() {
        if (!useEngine) return;
        markSource();
        var editor = ed();
        if (!editor || !editor.querySelector('.abene-fn-ref')) {
            pageSpace = [];
            paintChrome();
            return;
        }
        var data = computeSpaces();
        var same = JSON.stringify(data.spaces) === JSON.stringify(pageSpace);
        pageSpace = data.spaces;
        paintChrome();
        if (same || relayouting || pass > 4) {
            pass = 0;
            return;
        }
        pass++;
        relayouting = true;
        setTimeout(function () {
            relayouting = false;
            if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
            else if (typeof refreshPagination === 'function') refreshPagination();
        }, 20);
    }

    function wrapRender() {
        var orig = root.renderPageDecorations;
        if (typeof orig !== 'function' || orig._abeneNotes) return;
        var wrapped = function () {
            orig.apply(this, arguments);
            try { paintChrome(); } catch (e) {}
        };
        wrapped._abeneNotes = true;
        root.renderPageDecorations = wrapped;
    }

    function wrapSubmit() {
        var orig = root.abeneSubmitFormDialog;
        if (typeof orig !== 'function' || orig._abeneNotes) return;
        var wrapped = function () {
            orig.apply(this, arguments);
            try {
                markSource();
                if (ed() && ed().querySelector('.abene-fn-ref, .abene-en-ref')) {
                    pass = 0;
                    if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
                }
            } catch (e) {}
        };
        wrapped._abeneNotes = true;
        root.abeneSubmitFormDialog = wrapped;
    }

    wrapRender();
    wrapSubmit();

    root.ABENE.Notes = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; if (!v) pageSpace = []; },
        spaceForPage: spaceForPage,
        afterLayout: afterLayout,
        paintChrome: paintChrome,
        markSource: markSource
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { markSource(); wrapRender(); wrapSubmit(); });
    } else {
        markSource();
    }
})(window);
