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
        if (root.PageGeometry && root.PageGeometry.SIZES && root.PageGeometry.SIZES.a4) return root.PageGeometry.SIZES.a4.h;
        return 1123;
    }
    function pageW() {
        if (root.PageGeometry && root.PageGeometry.width) return root.PageGeometry.width;
        if (typeof root.getPageWidth === 'function') return root.getPageWidth();
        if (root.PageGeometry && root.PageGeometry.SIZES && root.PageGeometry.SIZES.a4) return root.PageGeometry.SIZES.a4.w;
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
            box.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;display:block;font-size:9pt;line-height:1.25;font-family:Calibri,sans-serif;';
            document.body.appendChild(box);
        }
        box.style.display = 'block';
        box.style.width = Math.max(120, width) + 'px';
        box.innerHTML = '<div class="page-fn-rule"></div>' + html;
        return Math.max(32, Math.ceil(box.offsetHeight || 0) + 8);
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
        if (pageSpace.length) return Number(pageSpace[page]) || 0;
        var data = computeSpaces();
        return Number(data.spaces[page]) || 0;
    }

    function paintChrome() {
        var chrome = document.getElementById('pageChrome');
        if (!chrome) return;
        chrome.querySelectorAll('.page-fn-zone').forEach(function (z) { z.remove(); });
        if (!useEngine) return;
        var editor = ed();
        if (!editor) return;
        markSource();
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var data = computeSpaces();
        var pages = 1;
        try {
            pages = (typeof root.abeneFitEditorSheets === 'function')
                ? root.abeneFitEditorSheets(editor)
                : Math.max(1, Math.ceil((editor.offsetHeight || h) / h));
        } catch (ePages) {
            pages = Math.max(1, data.by.length);
        }
        var i, slot, top, zone, seam;
        for (i = 0; i < data.by.length; i++) {
            slot = data.by[i];
            if (!slot || !slot.h) continue;
            seam = (i < pages - 1) ? 40 : 0;
            top = i * h + h - seam - (m.bottom || 0) - slot.h;
            zone = document.createElement('div');
            zone.className = 'page-fn-zone';
            zone.setAttribute('data-page', String(i + 1));
            zone.style.cssText = 'top:' + top + 'px;height:' + slot.h + 'px;padding-left:' + (m.left || 0) + 'px;padding-right:' + (m.right || 0) + 'px;z-index:14;';
            zone.innerHTML = '<div class="page-fn-rule"></div><div class="page-fn-list">' + slot.html + '</div>';
            chrome.appendChild(zone);
        }
        bindFnEdit(chrome);
        bindFnJump(editor);
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

    function bindFnJump(editor) {
        if (!editor || editor._abeneFnJump) return;
        editor._abeneFnJump = true;
        editor.addEventListener('click', function (e) {
            var ref = e.target && e.target.closest && e.target.closest('.abene-fn-ref');
            if (!ref) return;
            e.preventDefault();
            var n = ref.getAttribute('data-fn');
            var item = document.querySelector('#pageChrome .page-fn-item[data-fn="' + n + '"]');
            if (item && item.scrollIntoView) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }

    function pinEndnotes() {
        var editor = ed();
        if (!editor) return;
        var box = editor.querySelector('.abene-endnotes');
        if (!box) return;
        editor.querySelectorAll('.abene-en-ref').forEach(function (ref) {
            var n = ref.getAttribute('data-en');
            if (n && !ref.id) ref.id = 'enref-' + n;
        });
        Array.prototype.forEach.call(box.querySelectorAll('p[id^="en-"]'), function (p) {
            p.style.cursor = 'pointer';
        });
        var fn = editor.querySelector('.abene-footnotes');
        if (fn && fn.parentNode === editor) {
            if (box.nextElementSibling !== fn) editor.insertBefore(box, fn);
            return;
        }
        if (box === editor.lastElementChild) return;
        var last = editor.lastElementChild;
        while (last && last !== box && last.classList && last.classList.contains('abene-page-flow')) {
            last = last.previousElementSibling;
        }
        if (last === box) return;
        editor.appendChild(box);
    }

    function jumpEndnote(id) {
        if (!id) return;
        if (typeof root.abeneJumpToAnchor === 'function') {
            root.abeneJumpToAnchor(id);
            return;
        }
        var el = document.getElementById(id);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function bindEnJump(editor) {
        editor = editor || ed();
        if (!editor || editor._abeneEnJump) return;
        editor._abeneEnJump = true;
        editor.addEventListener('click', function (e) {
            var ref = e.target && e.target.closest && e.target.closest('.abene-en-ref');
            if (ref) {
                var nRef = ref.getAttribute('data-en');
                if (!nRef) return;
                e.preventDefault();
                jumpEndnote('en-' + nRef);
                return;
            }
            var note = e.target && e.target.closest && e.target.closest('.abene-endnotes [id^="en-"]');
            if (!note) return;
            var nNote = String(note.id || '').replace(/^en-/, '');
            if (!nNote) return;
            e.preventDefault();
            var call = editor.querySelector('.abene-en-ref[data-en="' + nNote + '"]');
            if (call && !call.id) call.id = 'enref-' + nNote;
            jumpEndnote(call && call.id ? call.id : ('enref-' + nNote));
        });
    }

    function bindPin() {
        var editor = ed();
        if (!editor || editor._abeneEnPin) return;
        editor._abeneEnPin = true;
        editor.addEventListener('input', function () {
            if (editor.querySelector('.abene-endnotes')) pinEndnotes();
        });
    }

    function afterLayout() {
        pinEndnotes();
        bindEnJump();
        bindPin();
        if (!useEngine) return;
        markSource();
        var editor = ed();
        if (!editor || !editor.querySelector('.abene-fn-ref')) {
            pageSpace = [];
            root._abeneFlowForce = false;
            paintChrome();
            return;
        }
        var data = computeSpaces();
        var same = JSON.stringify(data.spaces) === JSON.stringify(pageSpace);
        pageSpace = data.spaces;
        paintChrome();
        if (same || relayouting || pass > 4) {
            pass = 0;
            root._abeneFlowForce = false;
            return;
        }
        pass++;
        relayouting = true;
        root._abeneFlowForce = true;
        setTimeout(function () {
            relayouting = false;
            if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
            else if (typeof refreshPagination === 'function') refreshPagination();
        }, 20);
    }

    function wrapRender() {
        var orig = root.renderPageDecorations;
        if (typeof orig !== 'function' || orig._abeneNotes) {
            if (root.renderPageDecorations) root.abeneRenderPageDecorations = root.renderPageDecorations;
            return;
        }
        var wrapped = function () {
            orig.apply(this, arguments);
            try { paintChrome(); } catch (e) {}
        };
        wrapped._abeneNotes = true;
        root.renderPageDecorations = wrapped;
        root.abeneRenderPageDecorations = wrapped;
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
                    pinEndnotes();
                    bindEnJump();
                    if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
                }
            } catch (e) {}
        };
        wrapped._abeneNotes = true;
        root.abeneSubmitFormDialog = wrapped;
    }

    wrapRender();
    wrapSubmit();

    var origInsertEndnote = root.insertEndnote;
    if (typeof origInsertEndnote === 'function' && !origInsertEndnote._abeneNotesEnd) {
        var wrappedEn = function () {
            origInsertEndnote.apply(this, arguments);
            setTimeout(function () {
                pinEndnotes();
                bindEnJump();
                bindPin();
            }, 400);
        };
        wrappedEn._abeneNotesEnd = true;
        wrappedEn._legacy = origInsertEndnote;
        root.insertEndnote = wrappedEn;
    }

    root.ABENE.Notes = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; if (!v) pageSpace = []; },
        spaceForPage: spaceForPage,
        afterLayout: afterLayout,
        paintChrome: paintChrome,
        markSource: markSource,
        pinEndnotes: pinEndnotes
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            markSource();
            wrapRender();
            wrapSubmit();
            pinEndnotes();
            bindEnJump();
            bindPin();
        });
    } else {
        markSource();
        wrapRender();
        wrapSubmit();
        pinEndnotes();
        bindEnJump();
        bindPin();
    }

    /* Ver → Modo escuro / Claro: toast (index já persiste e marca os botões). */
    (function wrapAppearanceToast() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        var orig = root.setAppearance;
        if (typeof orig !== 'function' || orig._abeneDarkWrap) return;
        var booted = false;
        root.setAppearance = function (mode) {
            orig.apply(this, arguments);
            var dark = document.body.classList.contains('dark-mode');
            if (!booted) { booted = true; return; }
            if (typeof root.showToast === 'function') {
                root.showToast(dark
                    ? tt('darkOn', 'Modo escuro ativo. A folha A4 permanece branca.')
                    : tt('lightOn', 'Modo claro ativo.'));
            }
        };
        root.setAppearance._abeneDarkWrap = true;
        root.setAppearance._legacy = orig;
    })();
})(window);
