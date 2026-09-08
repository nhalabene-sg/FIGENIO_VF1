/* Genius Raros — History (P11).
   Undo/Redo transactionnel : HTML propre + réglages (marges, cabeçalho).
   La pile innerHTML existante reste en secours (kill switch). Excel a son propre undo. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneHistoryEngine') === '0') useEngine = false;
    } catch (e0) {}

    var MAX = 50;
    var COALESCE_MS = 1000;
    var stack = [];
    var redo = [];
    var restoring = false;
    var typing = false;
    var forceNew = false;
    var bound = false;

    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function excelMode() {
        return !!(document.body && document.body.classList.contains('abene-excel-mode'));
    }

    function cleanHtml() {
        var editor = ed();
        if (!editor) return '<p></p>';
        var Doc = root.ABENE && root.ABENE.Document;
        if (Doc && Doc.useEngine && typeof Doc.capture === 'function') {
            try { return Doc.capture().html || '<p></p>'; } catch (e) {}
        }
        if (typeof root.abeneGetCleanHtml === 'function') {
            try { return root.abeneGetCleanHtml(editor) || '<p></p>'; } catch (e2) {}
        }
        return editor.innerHTML;
    }

    function settingsObj() {
        if (typeof root.projectSettings === 'function') {
            try { return JSON.parse(root.projectSettings()) || {}; } catch (e) { return {}; }
        }
        return {};
    }

    function settingsKey(s) {
        if (!s) return '';
        return [
            s.orientation,
            s.pageSizeId,
            JSON.stringify(s.margins || {}),
            JSON.stringify(s.pageSize || {}),
            s.header || '',
            s.footer || '',
            s.headerTemplate || '',
            JSON.stringify(s.headerFields || {}),
            s.headerDifferentFirst ? '1' : '0',
            s.columns || '',
            s.gutter || 0,
            s.colRule ? '1' : '0'
        ].join('|');
    }

    function childIndex(parent, node) {
        var i = 0, n = parent.firstChild;
        while (n) {
            if (n === node) return i;
            i++;
            n = n.nextSibling;
        }
        return 0;
    }

    function saveSel() {
        var editor = ed();
        var sel = root.getSelection();
        if (!editor || !sel || !sel.rangeCount) return null;
        try {
            var r = sel.getRangeAt(0);
            if (!editor.contains(r.startContainer)) return null;
            return {
                start: nodePath(editor, r.startContainer, r.startOffset),
                end: nodePath(editor, r.endContainer, r.endOffset)
            };
        } catch (e) { return null; }
    }

    function nodePath(editor, node, offset) {
        var path = [];
        var cur = node;
        while (cur && cur !== editor) {
            var p = cur.parentNode;
            if (!p) break;
            path.unshift(childIndex(p, cur));
            cur = p;
        }
        return { path: path, offset: offset };
    }

    function nodeFromPath(editor, loc) {
        if (!editor || !loc || !loc.path) return { node: editor, offset: 0 };
        var node = editor;
        var i;
        for (i = 0; i < loc.path.length; i++) {
            var idx = loc.path[i];
            if (!node.childNodes || idx >= node.childNodes.length) {
                return { node: node, offset: node.childNodes ? node.childNodes.length : 0 };
            }
            node = node.childNodes[idx];
        }
        var max = node.nodeType === 3 ? (node.nodeValue || '').length : (node.childNodes ? node.childNodes.length : 0);
        return { node: node, offset: Math.min(loc.offset || 0, max) };
    }

    function restoreSel(saved) {
        if (!saved || !saved.start) return;
        var editor = ed();
        if (!editor) return;
        try {
            var a = nodeFromPath(editor, saved.start);
            var b = nodeFromPath(editor, saved.end || saved.start);
            var r = document.createRange();
            r.setStart(a.node, a.offset);
            r.setEnd(b.node, b.offset);
            var sel = root.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
        } catch (e) {
            try { editor.focus(); } catch (e2) {}
        }
    }

    function takeSnapshot(label) {
        return {
            html: cleanHtml(),
            settings: settingsObj(),
            sel: saveSel(),
            t: Date.now(),
            label: label || 'edit'
        };
    }

    function sameSnap(a, b) {
        if (!a || !b) return false;
        return a.html === b.html && settingsKey(a.settings) === settingsKey(b.settings);
    }

    function record(label) {
        if (!useEngine || restoring || excelMode()) return;
        if (root._abeneLayingOut) return;
        var editor = ed();
        if (!editor) return;
        var snap = takeSnapshot(label);
        var last = stack[stack.length - 1];
        if (sameSnap(last, snap)) {
            typing = false;
            forceNew = false;
            return;
        }
        var now = snap.t;
        if (!forceNew && typing && last && last.label === 'type' && (now - last.t) < COALESCE_MS) {
            last.html = snap.html;
            last.settings = snap.settings;
            last.sel = snap.sel;
            last.t = now;
            redo = [];
            typing = false;
            return;
        }
        snap.label = forceNew ? (label || 'command') : (typing ? 'type' : (label || 'edit'));
        forceNew = false;
        typing = false;
        stack.push(snap);
        if (stack.length > MAX) stack.shift();
        redo = [];
    }

    function afterRestore() {
        var ds = A().documentState;
        if (ds) ds.dirty = true;
        if (typeof root.updateSaveStatus === 'function') root.updateSaveStatus();
        if (typeof root.updateStats === 'function') root.updateStats();
        if (typeof root.updateNavigation === 'function') root.updateNavigation();
        if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
        else if (typeof root.refreshPagination === 'function') root.refreshPagination();
        if (root.ABENE && root.ABENE.Document && typeof root.ABENE.Document.markStale === 'function') {
            root.ABENE.Document.markStale();
        }
    }

    function restore(snap) {
        if (!snap) return;
        restoring = true;
        try {
            var editor = ed();
            var Doc = root.ABENE && root.ABENE.Document;
            if (Doc && Doc.useEngine && typeof Doc.apply === 'function') {
                Doc.apply({
                    html: snap.html,
                    settings: snap.settings,
                    name: (snap.settings && snap.settings.name) || undefined
                });
            } else {
                if (snap.settings && typeof root.restoreProjectSettings === 'function') {
                    root.restoreProjectSettings(JSON.stringify(snap.settings));
                }
                if (editor) {
                    editor.innerHTML = snap.html || '<p></p>';
                    editor.querySelectorAll('.page-decoration, .page-header-zone, .page-footer-zone, .abene-page-flow').forEach(function (el) { el.remove(); });
                }
            }
            if (editor) editor.focus();
            restoreSel(snap.sel);
            afterRestore();
        } finally {
            restoring = false;
        }
    }

    function doUndo() {
        if (!useEngine) return false;
        if (excelMode()) return false;
        if (stack.length < 2) return true;
        redo.push(stack.pop());
        restore(stack[stack.length - 1]);
        return true;
    }

    function doRedo() {
        if (!useEngine) return false;
        if (excelMode()) return false;
        if (!redo.length) return true;
        var snap = redo.pop();
        stack.push(snap);
        restore(snap);
        return true;
    }

    function clear() {
        stack = [];
        redo = [];
        typing = false;
        forceNew = false;
    }

    function bind() {
        if (bound) return;
        var editor = ed();
        if (!editor) return;
        bound = true;
        editor.addEventListener('input', function (e) {
            if (restoring || excelMode()) return;
            var t = e && e.inputType;
            if (t && /historyUndo|historyRedo/.test(t)) return;
            typing = true;
        });
        document.addEventListener('pointerdown', function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            if (t.closest('#editor, .page-header-zone, .page-footer-zone, .page-fn-zone')) return;
            if (t.closest('.ribbon, .quick-access, .menu-bar, .context-menu, .dropdown-menu, #ribbonFlyout, .table-toolbar, .image-toolbar')) {
                forceNew = true;
                typing = false;
            }
        }, true);
    }

    var History = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        record: record,
        undo: doUndo,
        redo: doRedo,
        clear: clear,
        markCommand: function () { forceNew = true; typing = false; },
        markTyping: function () { typing = true; },
        canUndo: function () { return stack.length > 1; },
        canRedo: function () { return redo.length > 0; }
    };

    root.ABENE.History = History;
    root.AbeneHistory = History;

    if (typeof root.saveUndoState === 'function' && !root.saveUndoState._abeneHistory) {
        var origSave = root.saveUndoState;
        root.saveUndoState = function () {
            if (!useEngine) return origSave.apply(this, arguments);
            record();
        };
        root.saveUndoState._abeneHistory = true;
    }
    if (typeof root.undo === 'function' && !root.undo._abeneHistory) {
        var origUndo = root.undo;
        root.undo = function () {
            if (!useEngine) return origUndo.apply(this, arguments);
            return doUndo();
        };
        root.undo._abeneHistory = true;
    }
    if (typeof root.redo === 'function' && !root.redo._abeneHistory) {
        var origRedo = root.redo;
        root.redo = function () {
            if (!useEngine) return origRedo.apply(this, arguments);
            return doRedo();
        };
        root.redo._abeneHistory = true;
    }
    if (typeof root.resetEditorToOriginal === 'function' && !root.resetEditorToOriginal._abeneHistory) {
        var origReset = root.resetEditorToOriginal;
        root.resetEditorToOriginal = function () {
            if (useEngine) clear();
            return origReset.apply(this, arguments);
        };
        root.resetEditorToOriginal._abeneHistory = true;
    }

    ['changeMargins', 'applyCustomMargins', 'applyPageSetup', 'applyMarginPreset', 'applyPageColumns'].forEach(function (name) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneHistoryCmd) return;
        var wrapped = function () {
            if (useEngine) { forceNew = true; typing = false; }
            return orig.apply(this, arguments);
        };
        wrapped._abeneHistoryCmd = true;
        root[name] = wrapped;
    });

    bind();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    root.addEventListener('load', function () {
        bind();
        if (useEngine && stack.length === 0) record('open');
    });
})(window);
