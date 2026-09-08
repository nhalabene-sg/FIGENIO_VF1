/* Genius Raros — EditorCommands (P9).
   Hub unique pour le friso / atalhos. document.execCommand reste le repli.
   Aucun bouton n’est remplacé par un stub. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneCommandsEngine') === '0') useEngine = false;
    } catch (e0) {}

    var INLINE_FALLBACK = {
        bold: function (span) { span.style.fontWeight = 'bold'; },
        italic: function (span) { span.style.fontStyle = 'italic'; },
        underline: function (span) { span.style.textDecorationLine = 'underline'; },
        strikeThrough: function (span) { span.style.textDecorationLine = 'line-through'; },
        subscript: function (span) { span.style.verticalAlign = 'sub'; span.style.fontSize = '0.75em'; },
        superscript: function (span) { span.style.verticalAlign = 'super'; span.style.fontSize = '0.75em'; }
    };
    var ALIGN = {
        justifyLeft: 'left',
        justifyCenter: 'center',
        justifyRight: 'right',
        justifyFull: 'justify'
    };
    var LAYOUT_HINT = /page-break-marker|abene-section-break|<table|abene-footnotes|abene-endnotes/i;

    function A() { return root.abene || {}; }
    function editorEl() { return (A().editor) || document.getElementById('editor'); }

    function focusEditor() {
        var active = document.activeElement;
        if (active && active.isContentEditable) return active;
        var editor = editorEl();
        if (editor) editor.focus();
        return editor;
    }

    function nativeExec(cmd, value) {
        try {
            return document.execCommand(cmd, false, value == null ? null : value);
        } catch (e) {
            return false;
        }
    }

    function wrapInline(mutator) {
        if (typeof root.abeneWrapInline === 'function') return root.abeneWrapInline(mutator);
        var editor = editorEl();
        if (!editor) return false;
        editor.focus();
        var sel = root.getSelection();
        if (!sel || !sel.rangeCount) return false;
        var range = sel.getRangeAt(0);
        var span = document.createElement('span');
        mutator(span);
        if (range.collapsed) span.appendChild(document.createTextNode('\u200b'));
        else span.appendChild(range.extractContents());
        range.insertNode(span);
        return true;
    }

    function caretEl() {
        var sel = root.getSelection();
        if (!sel || !sel.rangeCount) return null;
        var n = sel.anchorNode;
        if (n && n.nodeType !== 1) n = n.parentElement;
        return n;
    }

    function caretBlock() {
        var n = caretEl();
        var editor = editorEl();
        if (!n || !editor) return null;
        return n.closest('p, div, h1, h2, h3, h4, h5, h6, blockquote, pre, li, td, th');
    }

    function insertHtmlAtRange(html) {
        var sel = root.getSelection();
        if (!sel || !sel.rangeCount) return false;
        var range = sel.getRangeAt(0);
        range.deleteContents();
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var frag = document.createDocumentFragment();
        var last = null;
        while (tmp.firstChild) last = frag.appendChild(tmp.firstChild);
        range.insertNode(frag);
        if (last) {
            range = range.cloneRange();
            range.setStartAfter(last);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        return true;
    }

    function after(cmd, value) {
        try {
            var ds = A().documentState;
            if (ds) ds.dirty = true;
        } catch (e1) {}
        if (typeof root.updateSaveStatus === 'function') {
            try { root.updateSaveStatus(); } catch (e2) {}
        }
        if (typeof root.updateStats === 'function') {
            try { root.updateStats(true); } catch (e3) {}
        }
        if (root.ABENE && root.ABENE.History && typeof root.ABENE.History.markCommand === 'function') {
            try { root.ABENE.History.markCommand(); } catch (e0) {}
        }
        if (typeof root.saveUndoState === 'function') {
            try { root.saveUndoState(); } catch (e4) {}
        }
        if (cmd === 'insertHTML' && LAYOUT_HINT.test(String(value || '')) && typeof root.abeneSchedulePageFlow === 'function') {
            root.abeneSchedulePageFlow(true);
        }
    }

    function fallback(cmd, value) {
        if (INLINE_FALLBACK[cmd]) return wrapInline(INLINE_FALLBACK[cmd]);
        if (cmd === 'fontName') return wrapInline(function (span) { span.style.fontFamily = value; });
        if (cmd === 'foreColor') return wrapInline(function (span) { span.style.color = value; });
        if (cmd === 'hiliteColor' || cmd === 'backColor') {
            return wrapInline(function (span) { span.style.backgroundColor = value || 'transparent'; });
        }
        if (ALIGN[cmd]) {
            var block = caretBlock();
            if (block) { block.style.textAlign = ALIGN[cmd]; return true; }
        }
        if (cmd === 'indent' || cmd === 'outdent') {
            var b = caretBlock();
            if (b) {
                var cur = parseFloat(b.style.marginLeft) || 0;
                b.style.marginLeft = Math.max(0, cur + (cmd === 'indent' ? 36 : -36)) + 'px';
                return true;
            }
        }
        if (cmd === 'insertHTML') return insertHtmlAtRange(value || '');
        if (cmd === 'insertText') {
            var sel = root.getSelection();
            if (sel && sel.rangeCount) {
                var r = sel.getRangeAt(0);
                r.deleteContents();
                r.insertNode(document.createTextNode(value || ''));
                r.collapse(false);
                return true;
            }
        }
        return false;
    }

    function exec(cmd, value) {
        if (!cmd) return false;
        if (cmd === 'insertHTML') return insertHTML(value);
        if (cmd === 'insertText') return insertText(value);
        focusEditor();
        var ok = false;
        var threw = false;
        try {
            ok = nativeExec(cmd, value);
        } catch (e) {
            threw = true;
            ok = false;
        }
        if (threw) ok = fallback(cmd, value);
        after(cmd, value);
        return !!ok;
    }

    function insertHTML(html) {
        html = String(html == null ? '' : html);
        focusEditor();
        try {
            document.execCommand('insertHTML', false, html);
        } catch (e) {
            insertHtmlAtRange(html);
        }
        after('insertHTML', html);
        return true;
    }

    function insertText(text) {
        focusEditor();
        try {
            document.execCommand('insertText', false, text == null ? '' : text);
        } catch (e) {
            fallback('insertText', text);
        }
        after('insertText', text);
        return true;
    }

    function queryState(cmd) {
        try {
            if (document.queryCommandState(cmd)) return true;
        } catch (e) {}
        var el = caretEl();
        if (!el) return false;
        var cs;
        try { cs = root.getComputedStyle(el); } catch (e2) { return false; }
        if (!cs) return false;
        var deco = String(cs.textDecorationLine || cs.textDecoration || '');
        if (cmd === 'bold') {
            var w = cs.fontWeight;
            return w === 'bold' || w === 'bolder' || (parseInt(w, 10) >= 700);
        }
        if (cmd === 'italic') return cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
        if (cmd === 'underline') return deco.indexOf('underline') >= 0;
        if (cmd === 'strikeThrough') return deco.indexOf('line-through') >= 0;
        if (cmd === 'subscript') return cs.verticalAlign === 'sub';
        if (cmd === 'superscript') return cs.verticalAlign === 'super';
        if (cmd === 'justifyLeft') return (cs.textAlign === 'left' || cs.textAlign === 'start');
        if (cmd === 'justifyCenter') return cs.textAlign === 'center';
        if (cmd === 'justifyRight') return cs.textAlign === 'right' || cs.textAlign === 'end';
        if (cmd === 'justifyFull') return cs.textAlign === 'justify';
        return false;
    }

    function callExisting(name) {
        var fn = root[name];
        if (typeof fn === 'function') {
            return fn.apply(root, Array.prototype.slice.call(arguments, 1));
        }
        return undefined;
    }

    var Commands = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        exec: exec,
        insertHTML: insertHTML,
        insertText: insertText,
        wrapInline: wrapInline,
        queryState: queryState,
        focus: focusEditor,
        bold: function () { return exec('bold'); },
        italic: function () { return exec('italic'); },
        underline: function () { return exec('underline'); },
        strikeThrough: function () { return exec('strikeThrough'); },
        subscript: function () { return exec('subscript'); },
        superscript: function () { return exec('superscript'); },
        justifyLeft: function () { return exec('justifyLeft'); },
        justifyCenter: function () { return exec('justifyCenter'); },
        justifyRight: function () { return exec('justifyRight'); },
        justifyFull: function () { return exec('justifyFull'); },
        indent: function () { return exec('indent'); },
        outdent: function () { return exec('outdent'); },
        insertOrderedList: function () { return exec('insertOrderedList'); },
        insertUnorderedList: function () { return exec('insertUnorderedList'); },
        unlink: function () { return exec('unlink'); },
        removeFormat: function () {
            if (typeof root.clearFormatting === 'function') return root.clearFormatting();
            return exec('removeFormat');
        },
        formatBlock: function (tag) { return exec('formatBlock', tag); },
        fontName: function (name) {
            if (typeof root.changeFontFamily === 'function') return root.changeFontFamily(name);
            return exec('fontName', name);
        },
        fontSize: function (pt) {
            if (typeof root.changeFontSize === 'function') return root.changeFontSize(pt);
            return exec('fontSize', pt);
        },
        foreColor: function (c) {
            if (typeof root.changeFontColor === 'function') return root.changeFontColor(c);
            return exec('foreColor', c);
        },
        hiliteColor: function (c) {
            if (typeof root.changeHiliteColor === 'function') return root.changeHiliteColor(c);
            return exec('hiliteColor', c);
        },
        cut: function () { return typeof root.cutContent === 'function' ? root.cutContent() : exec('cut'); },
        copy: function () { return typeof root.copyContent === 'function' ? root.copyContent() : exec('copy'); },
        paste: function (mode) { return typeof root.pasteContent === 'function' ? root.pasteContent(mode) : exec('paste'); },
        selectAll: function () { return exec('selectAll'); },
        undo: function () { return callExisting('undo'); },
        redo: function () { return callExisting('redo'); },
        insertPageBreak: function () { return callExisting('insertPageBreak'); },
        insertTable: function () {
            if (typeof root.openInsertTableModal === 'function') return root.openInsertTableModal();
            return callExisting('insertTable');
        },
        insertLink: function () { return callExisting('insertLink'); },
        applyStyle: function (key) { return callExisting('applyStyle', key); }
    };

    root.ABENE.Commands = Commands;
    root.EditorCommands = Commands;
    root.abeneExec = exec;
    root.abeneInsertHTML = insertHTML;
    root.abeneInsertText = insertText;

    if (typeof root.execCmd === 'function' && !root._abeneLegacyExecCmd) {
        root._abeneLegacyExecCmd = root.execCmd;
        root.execCmd = function (cmd, value) {
            if (!useEngine) return root._abeneLegacyExecCmd(cmd, value);
            return exec(cmd, value);
        };
    }
    if (typeof root.selectAll === 'function' && !root._abeneLegacySelectAll) {
        root._abeneLegacySelectAll = root.selectAll;
        root.selectAll = function () {
            if (!useEngine) return root._abeneLegacySelectAll();
            return exec('selectAll');
        };
    }
})(window);
