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

    /* Estilos → Novo a partir da seleção : janela em vez de prompt. O painel Estilos permanece. */
    (function wrapNewStyleFromSel() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function esc(s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }
        var orig = root.abeneStyleFromSelection;
        if (typeof orig !== 'function' || orig._abeneNewStyleModal) return;
        root.abeneStyleFromSelection = function () {
            if (typeof openGenericModal !== 'function') return orig.apply(this, arguments);
            var range = null;
            try {
                var sel = root.getSelection();
                if (sel && sel.rangeCount) range = sel.getRangeAt(0).cloneRange();
            } catch (eR) {}
            root._abeneNewStyleRange = range;
            var def = tt('styleCustom', 'Estilo personalizado');
            openGenericModal(tt('styleNewFromSel', 'Novo a partir da seleção'),
                '<div class="form-group"><label for="abeneStyleNewName">' + esc(tt('styleNewName', 'Nome do novo estilo:')) + '</label>' +
                    '<input id="abeneStyleNewName" type="text" value="' + esc(def) + '"></div>' +
                '<p id="abeneStyleNewErr" style="color:#c00;min-height:1.2em;margin:0;"></p>',
                '<button type="button" class="btn-secondary" onclick="abeneCancelNewStyle()">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneApplyNewStyle()">' + esc(tt('ok', 'OK')) + '</button>'
            );
            setTimeout(function () {
                var inp = document.getElementById('abeneStyleNewName');
                if (!inp) return;
                inp.focus();
                inp.select();
                inp.addEventListener('keydown', function (ev) {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        root.abeneApplyNewStyle();
                    }
                });
            }, 30);
        };
        root.abeneStyleFromSelection._abeneNewStyleModal = true;
        root.abeneCancelNewStyle = function () {
            if (typeof closeModal === 'function') closeModal('genericModal');
            if (typeof root.manageStyles === 'function') root.manageStyles();
        };
        root.abeneApplyNewStyle = function () {
            var inp = document.getElementById('abeneStyleNewName');
            var err = document.getElementById('abeneStyleNewErr');
            var name = inp ? String(inp.value || '').trim() : '';
            if (!name) {
                if (err) err.textContent = tt('styleNewName', 'Nome do novo estilo:');
                return;
            }
            if (typeof closeModal === 'function') closeModal('genericModal');
            var editor = document.getElementById('editor');
            if (editor) editor.focus();
            var range = root._abeneNewStyleRange;
            if (range) {
                try {
                    var sel = root.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (eS) {}
            }
            var prompt0 = root.prompt;
            root.prompt = function () { return name; };
            try { orig.apply(root, []); }
            finally {
                root.prompt = prompt0;
                root._abeneNewStyleRange = null;
            }
        };
    })();

    /* Ver → Paginação: toast + botão ativo (index ligava/desligava em silêncio). */
    (function wrapPaginationToggle() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function ds() {
            return (root.abene && root.abene.documentState) || root.documentState || null;
        }
        function isOn() {
            var st = ds();
            if (st && typeof st.pagination === 'boolean') return st.pagination;
            var ed = document.getElementById('editor');
            return !!(ed && ed.classList.contains('pagination-active'));
        }
        function refreshBtn() {
            var btn = document.querySelector('button[onclick="togglePagination()"]');
            if (btn) btn.classList.toggle('active', isOn());
        }
        var orig = root.togglePagination;
        if (typeof orig !== 'function' || orig._abenePagWrap) return;
        root.togglePagination = function () {
            orig.apply(this, arguments);
            refreshBtn();
            var on = isOn();
            if (typeof root.showToast === 'function') {
                root.showToast(on
                    ? tt('paginationOn', 'Paginação ativada.')
                    : tt('paginationOff', 'Paginação desativada. Vista contínua.'));
            }
        };
        root.togglePagination._abenePagWrap = true;
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshBtn);
        else refreshBtn();
        root.addEventListener('load', refreshBtn);
    })();

    /* Ver → Grelha: toast + botão ativo (index só mudava o fundo, sem feedback). */
    (function wrapGridlines() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        var GRID_LT = 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)';
        var GRID_DK = 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)';
        function ed() { return document.getElementById('editor'); }
        function wanted() {
            try { return localStorage.getItem('abeneGrid') === '1'; } catch (eW) { return false; }
        }
        function isOn() {
            var el = ed();
            return !!(el && el.style.backgroundImage);
        }
        function paint(on) {
            var el = ed();
            if (!el) return;
            if (on) {
                el.style.backgroundImage = document.body.classList.contains('dark-mode') ? GRID_DK : GRID_LT;
                el.style.backgroundSize = '20px 20px';
            } else {
                el.style.backgroundImage = '';
                el.style.backgroundSize = '';
            }
        }
        function refreshBtn() {
            var btn = document.querySelector('#tab-view button[onclick="toggleGridlines()"]') ||
                document.querySelector('button[onclick="toggleGridlines()"]');
            if (btn) btn.classList.toggle('active', isOn());
        }
        var orig = root.toggleGridlines;
        if (typeof orig !== 'function' || orig._abeneGridWrap) return;
        root.toggleGridlines = function () {
            var next = !isOn();
            paint(next);
            try { localStorage.setItem('abeneGrid', next ? '1' : '0'); } catch (eS) {}
            refreshBtn();
            if (typeof root.showToast === 'function') {
                root.showToast(next ? tt('gridOn', 'Grelha visível.') : tt('gridOff', 'Grelha oculta.'));
            }
        };
        root.toggleGridlines._abeneGridWrap = true;
        root.toggleGridlines._legacy = orig;
        var origPag = root.refreshPagination;
        if (typeof origPag === 'function' && !origPag._abeneGridHook) {
            root.refreshPagination = function () {
                var r = origPag.apply(this, arguments);
                if (wanted()) paint(true);
                refreshBtn();
                return r;
            };
            root.refreshPagination._abeneGridHook = true;
        }
        var origAppear = root.setAppearance;
        if (typeof origAppear === 'function') {
            root.setAppearance = function () {
                origAppear.apply(this, arguments);
                if (wanted()) paint(true);
                refreshBtn();
            };
        }
        function boot() {
            paint(wanted());
            refreshBtn();
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
        root.addEventListener('load', boot);
    })();

    /* Ver → Janela: ecrã inteiro com toast; se o browser recusar, maximiza a janela da app. */
    (function wrapFullscreen() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function fsEl() {
            return document.fullscreenElement || document.webkitFullscreenElement || null;
        }
        function isOn() {
            return !!(fsEl() || document.body.classList.contains('app-maximized'));
        }
        function refreshBtn() {
            var btn = document.querySelector('#tab-view button[onclick="toggleFullscreen()"]') ||
                document.querySelector('button[onclick="toggleFullscreen()"]');
            if (btn) btn.classList.toggle('active', isOn());
        }
        function toast(on, kind) {
            if (typeof root.showToast !== 'function') return;
            if (kind === 'app') {
                root.showToast(on ? tt('fullAppOn', 'Janela maximizada.') : tt('fullAppOff', 'Janela restaurada.'));
            } else {
                root.showToast(on ? tt('fullOn', 'Ecrã inteiro. Esc para sair.') : tt('fullOff', 'Ecrã inteiro desativado.'));
            }
        }
        var orig = root.toggleFullscreen;
        if (typeof orig !== 'function' || orig._abeneFullWrap) return;
        root.toggleFullscreen = function () {
            var onFs = !!fsEl();
            var exit = document.exitFullscreen || document.webkitExitFullscreen;
            var req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
            if (onFs && exit) {
                Promise.resolve(exit.call(document)).then(function () { refreshBtn(); toast(false, 'fs'); }).catch(function () { refreshBtn(); });
                return;
            }
            if (document.body.classList.contains('app-maximized') && !onFs) {
                document.body.classList.remove('app-maximized');
                refreshBtn();
                toast(false, 'app');
                return;
            }
            if (req) {
                Promise.resolve(req.call(document.documentElement)).then(function () {
                    refreshBtn();
                    toast(true, 'fs');
                }).catch(function () {
                    document.body.classList.add('app-maximized');
                    refreshBtn();
                    toast(true, 'app');
                });
                return;
            }
            if (typeof orig === 'function') orig.apply(this, arguments);
            else document.body.classList.toggle('app-maximized');
            refreshBtn();
            toast(isOn(), document.body.classList.contains('app-maximized') ? 'app' : 'fs');
        };
        root.toggleFullscreen._abeneFullWrap = true;
        root.toggleFullscreen._legacy = orig;
        document.addEventListener('fullscreenchange', refreshBtn);
        document.addEventListener('webkitfullscreenchange', refreshBtn);
        function boot() { refreshBtn(); }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
        root.addEventListener('load', boot);
    })();

    /* Base → Efeitos de texto: exige texto selecionado; restaura a seleção após o menu. */
    (function wrapTextFx() {
        var savedRange = null;
        function ttLocal(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }
        function editor() {
            return (root.abene && root.abene.editor) || document.getElementById('editor');
        }
        function nodeInEditor(n) {
            var ed = editor();
            if (!ed || !n) return false;
            if (n.nodeType !== 1) n = n.parentElement;
            return !!(n && (n === ed || ed.contains(n)));
        }
        function captureSel() {
            var sel = root.getSelection();
            if (!sel || !sel.rangeCount) return null;
            var r = sel.getRangeAt(0);
            if (!nodeInEditor(r.commonAncestorContainer)) return null;
            try { return r.cloneRange(); } catch (e) { return null; }
        }
        function restoreSel(r) {
            if (!r) return;
            var sel = root.getSelection();
            if (!sel) return;
            try {
                sel.removeAllRanges();
                sel.addRange(r);
            } catch (e2) {}
        }
        function hasVisibleSel() {
            var r = savedRange;
            if (!r && root.getSelection && root.getSelection().rangeCount) {
                r = root.getSelection().getRangeAt(0);
            }
            if (!r || r.collapsed) return false;
            return !!String(r.toString() || '').replace(/\u200b/g, '').replace(/\s+/g, '');
        }
        function boot() {
            var origFx = root.applyTextFx;
            if (typeof origFx === 'function' && !origFx._abeneFxWrap) {
                root.applyTextFx = function (kind) {
                    restoreSel(savedRange);
                    if (!hasVisibleSel()) {
                        toast(ttLocal('aSelectText', 'Selecione o texto a converter.'));
                        return;
                    }
                    var out = origFx.apply(this, arguments);
                    if (typeof root.saveUndoState === 'function') root.saveUndoState();
                    savedRange = null;
                    return out;
                };
                root.applyTextFx._abeneFxWrap = true;
                root.applyTextFx._legacy = origFx;
            }
            var orig = root.applyTextEffect;
            if (typeof orig !== 'function' || orig._abeneFxWrap) return;
            root.applyTextEffect = function (ev) {
                savedRange = captureSel();
                if (!hasVisibleSel()) {
                    toast(ttLocal('aSelectText', 'Selecione o texto a converter.'));
                }
                return orig.apply(this, arguments);
            };
            root.applyTextEffect._abeneFxWrap = true;
            root.applyTextEffect._legacy = orig;
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else setTimeout(boot, 0);
        root.addEventListener('load', boot);
    })();
})(window);
