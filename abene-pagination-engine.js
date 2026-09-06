/* Genius Raros — PaginationEngine (P3).
   Coordinateur : PageGeometry + chemin rapide à la saisie.
   Le rendu des feuilles reste abeneLayoutPageFlow / .abene-page-flow (repli obligatoire). */
(function (root) {
    root.ABENE = root.ABENE || {};
    var legacy = typeof root.abeneLayoutPageFlow === 'function' ? root.abeneLayoutPageFlow : null;
    if (!legacy) return;

    root.abeneLegacyLayoutPageFlow = legacy;

    var lastGeo = '';
    var lastHeights = '';
    var lastMode = 'legacy';
    var useEngine = true;
    try { if (root.localStorage && root.localStorage.getItem('abenePaginationEngine') === '0') useEngine = false; } catch (e0) {}

    function A() { return root.abene || {}; }
    function editorEl() { return (A().editor) || document.getElementById('editor'); }

    function geoKey() {
        var G = root.PageGeometry;
        if (G && G.height) {
            return [G.width, G.height, G.marginTop, G.marginBottom, G.marginLeft, G.marginRight, G.orientation, G.paperSize].join('|');
        }
        var a = A();
        var m = a.pageMargins || {};
        var ps = a.pageSize || {};
        return [ps.w, ps.h, m.top, m.bottom, m.left, m.right, a.pageOrientation, a.pageSizeId].join('|');
    }

    function heightsKey(editor) {
        var parts = [];
        var kids = editor.children;
        var i, el;
        for (i = 0; i < kids.length; i++) {
            el = kids[i];
            if (!el || !el.classList) continue;
            if (el.classList.contains('abene-page-flow')) continue;
            if (el.classList.contains('abene-obj-free') || el.classList.contains('abene-obj-behind') || el.classList.contains('abene-obj-front')) continue;
            if (el.classList.contains('abene-footnotes')) continue;
            parts.push(el.tagName + ':' + (el.offsetHeight || 0) + 'x' + (el.offsetWidth || 0));
        }
        return parts.join('|');
    }

    function snapshot(editor) {
        lastGeo = geoKey();
        lastHeights = heightsKey(editor);
    }

    function tryFastPath(editor) {
        if (!useEngine) return false;
        if (!lastHeights) return false;
        if (root._abeneLayingOut) return false;
        if (root._abeneBreakLock) return false;
        if (root._abenePointerDown || root._abeneRulerDrag) return false;
        if (editor.classList.contains('editing-header-footer')) return false;
        if (A().documentState && A().documentState.pagination === false) return false;
        if (editor.querySelector('.page-break-marker') && !editor.querySelector('.abene-page-flow')) return false;
        if (geoKey() !== lastGeo) return false;
        return heightsKey(editor) === lastHeights;
    }

    function render() {
        var editor = editorEl();
        if (!editor) return;
        try {
            if (tryFastPath(editor)) {
                lastMode = 'fast';
                if (root.ABENE && root.ABENE.Images && typeof root.ABENE.Images.syncAnchors === 'function') {
                    try { root.ABENE.Images.syncAnchors(editor); } catch (eFastImg) {}
                }
                return;
            }
        } catch (errFast) {}
        lastMode = 'legacy';
        var out = legacy.apply(this, arguments);
        try { snapshot(editor); } catch (errSnap) {}
        return out;
    }

    function pageHeight() {
        if (root.PageGeometry && root.PageGeometry.height) return root.PageGeometry.height;
        if (typeof root.getPageHeight === 'function') return root.getPageHeight();
        return 1123;
    }

    var Pagination = {
        available: true,
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        get lastMode() { return lastMode; },
        render: render,
        snapshot: snapshot,
        pageHeight: pageHeight,
        refresh: function (fromScroll) {
            if (!fromScroll) render();
            var editor = editorEl();
            var ph = pageHeight();
            var pages = root.abeneFitEditorSheets ? root.abeneFitEditorSheets(editor) : Math.max(1, Math.ceil((editor && editor.scrollHeight) / ph));
            if (typeof root.renderPageDecorations === 'function') root.renderPageDecorations();
            var totalElement = document.getElementById('totalPages');
            if (totalElement) totalElement.textContent = pages;
            var area = document.getElementById('editorArea');
            var currentElement = document.getElementById('pageNum');
            if (currentElement) currentElement.textContent = area ? Math.min(pages, Math.max(1, Math.floor(area.scrollTop / ph) + 1)) : '1';
            return pages;
        }
    };

    root.ABENE.Pagination = Pagination;
    root.PaginationEngine = Pagination;
    root.abeneLayoutPageFlow = function () {
        if (Pagination.available && useEngine) return Pagination.render();
        return legacy.apply(this, arguments);
    };
})(window);
