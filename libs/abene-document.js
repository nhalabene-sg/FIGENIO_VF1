/* Genius Raros — DocumentModel (P10).
   Source de vérité in-memory : HTML propre + réglages + inventaire.
   contenteditable reste l’éditeur. Les anciens fichiers HTML / localStorage restent lisibles. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneDocumentEngine') === '0') useEngine = false;
    } catch (e0) {}

    var current = null;
    var stale = true;

    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }

    function emptyInventory() {
        return {
            paragraphs: 0,
            headings: 0,
            lists: 0,
            tables: 0,
            images: 0,
            comments: 0,
            footnotes: 0,
            endnotes: 0,
            pageBreaks: 0,
            sectionBreaks: 0,
            textBoxes: 0
        };
    }

    function stripDisplay(node) {
        if (!node || !node.querySelectorAll) return node;
        if (typeof root.abeneStripPageFlow === 'function') {
            try { root.abeneStripPageFlow(node); } catch (e) {}
        } else {
            node.querySelectorAll('.abene-page-flow').forEach(function (el) { el.remove(); });
        }
        node.querySelectorAll('.page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band, .page-fn-zone, .document-header, .document-footer').forEach(function (n) { n.remove(); });
        return node;
    }

    function readCleanHtml() {
        var editor = ed();
        if (!editor) return '<p></p>';
        if (typeof root.abeneGetCleanHtml === 'function') {
            return root.abeneGetCleanHtml(editor) || '<p></p>';
        }
        var clone = editor.cloneNode(true);
        stripDisplay(clone);
        return clone.innerHTML.trim() || '<p></p>';
    }

    function settingsObj() {
        if (typeof root.projectSettings === 'function') {
            try { return JSON.parse(root.projectSettings()) || {}; } catch (e) { return {}; }
        }
        return {};
    }

    function inventory(rootEl) {
        var inv = emptyInventory();
        if (!rootEl || !rootEl.querySelectorAll) return inv;
        inv.paragraphs = rootEl.querySelectorAll('p').length;
        inv.headings = rootEl.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        inv.lists = rootEl.querySelectorAll('ul, ol').length;
        var tables = 0;
        Array.prototype.forEach.call(rootEl.querySelectorAll('table'), function (t) {
            if (t.getAttribute('data-abene-cont')) return;
            tables++;
        });
        inv.tables = tables;
        inv.images = rootEl.querySelectorAll('img').length;
        inv.comments = rootEl.querySelectorAll('[data-comment]').length;
        inv.footnotes = rootEl.querySelectorAll('.abene-fn-ref').length;
        inv.endnotes = rootEl.querySelectorAll('.abene-en-ref').length;
        inv.sectionBreaks = rootEl.querySelectorAll('.abene-section-break').length;
        inv.pageBreaks = rootEl.querySelectorAll('.page-break-marker:not(.abene-section-break)').length;
        inv.textBoxes = rootEl.querySelectorAll('[data-abene-obj="tbox"], .abene-tbox').length;
        return inv;
    }

    function migrate(raw) {
        if (!raw || typeof raw !== 'object') return null;
        var html = raw.html != null ? String(raw.html) : '';
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        stripDisplay(wrap);
        html = wrap.innerHTML.trim() || '<p></p>';
        var settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
        return {
            version: Number(raw.version) || 1,
            kind: 'abene-document',
            name: raw.name || settings.name || (A().documentState && A().documentState.name) || 'Documento1',
            html: html,
            settings: settings,
            inventory: raw.inventory && typeof raw.inventory === 'object' ? raw.inventory : inventory(wrap),
            capturedAt: raw.capturedAt || Date.now()
        };
    }

    function fromHtml(html, settings) {
        return migrate({
            version: 1,
            kind: 'abene-document',
            html: html || '<p></p>',
            settings: settings && typeof settings === 'object' ? settings : {}
        });
    }

    function parse(raw) {
        if (raw == null) return null;
        if (typeof raw === 'object') return migrate(raw);
        var s = String(raw).replace(/^\uFEFF/, '').trim();
        if (!s) return fromHtml('<p></p>', settingsObj());
        if (s.charAt(0) === '{') {
            try {
                var o = JSON.parse(s);
                if (o && (o.kind === 'abene-document' || o.html != null)) return migrate(o);
            } catch (e) {}
        }
        if (/<html[\s>]/i.test(s) || /<body[\s>]/i.test(s)) {
            var doc = new DOMParser().parseFromString(s, 'text/html');
            var meta = doc.querySelector('meta[name="abene-settings"]');
            var settings = settingsObj();
            if (meta && meta.content) {
                try { settings = JSON.parse(meta.content); } catch (e2) {}
            }
            var imported = doc.querySelector('[data-abene-editor]');
            var html = imported ? imported.innerHTML : (doc.body ? doc.body.innerHTML : s);
            return fromHtml(html, settings);
        }
        return fromHtml(s, settingsObj());
    }

    function capture() {
        var html = readCleanHtml();
        var settings = settingsObj();
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        current = {
            version: 1,
            kind: 'abene-document',
            name: (A().documentState && A().documentState.name) || settings.name || 'Documento1',
            html: html,
            settings: settings,
            inventory: inventory(wrap),
            capturedAt: Date.now()
        };
        stale = false;
        return current;
    }

    function snapshot() {
        if (!current || stale) return capture();
        return current;
    }

    function apply(model) {
        model = migrate(model);
        if (!model) return false;
        var editor = ed();
        if (model.settings && typeof root.restoreProjectSettings === 'function') {
            try { root.restoreProjectSettings(JSON.stringify(model.settings)); } catch (e) {}
        }
        if (editor && model.html != null) {
            editor.innerHTML = model.html;
            editor.querySelectorAll('.page-decoration, .page-header-zone, .page-footer-zone, .abene-page-flow').forEach(function (el) { el.remove(); });
        }
        current = model;
        stale = false;
        return true;
    }

    function persistLite() {
        if (!useEngine) return;
        try {
            var model = snapshot();
            var lite = {
                version: model.version,
                kind: model.kind,
                name: model.name,
                settings: model.settings,
                inventory: model.inventory,
                capturedAt: model.capturedAt
            };
            root.localStorage.setItem('abeneDocument', JSON.stringify(lite));
        } catch (e) {}
    }

    function toHtmlFile(model) {
        model = model || snapshot();
        var name = model.name || 'Documento1';
        var settings = JSON.stringify(model.settings || {}).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        var title = String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">' +
            '<meta name="abene-settings" content="' + settings + '">' +
            '<title>' + title + '</title></head><body>' +
            '<div data-abene-editor="1">' + (model.html || '<p></p>') + '</div>' +
            '</body></html>';
    }

    function markStale() { stale = true; }

    function bindEditor() {
        var editor = ed();
        if (!editor || editor._abeneDocBound) return;
        editor._abeneDocBound = true;
        editor.addEventListener('input', markStale);
    }

    var DocumentModel = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        get current() { return current; },
        capture: capture,
        snapshot: snapshot,
        apply: apply,
        fromHtml: fromHtml,
        parse: parse,
        migrate: migrate,
        inventory: function (node) { return inventory(node || (function () {
            var d = document.createElement('div');
            d.innerHTML = readCleanHtml();
            return d;
        })()); },
        bodyHtml: function () { return snapshot().html; },
        settings: function () { return snapshot().settings; },
        toJSON: function () { return snapshot(); },
        toHtmlFile: toHtmlFile,
        persist: persistLite,
        markStale: markStale
    };

    root.ABENE.Document = DocumentModel;
    root.AbeneDocument = DocumentModel;

    function wrapFn(name, after) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneDocument) return orig;
        var wrapped = function () {
            var r = orig.apply(this, arguments);
            if (useEngine) {
                try { after.apply(this, arguments); } catch (e) {}
            }
            return r;
        };
        wrapped._abeneDocument = true;
        root[name] = wrapped;
        return orig;
    }

    if (typeof root.persistableEditorHtml === 'function' && !root.persistableEditorHtml._abeneDocument) {
        var origPersist = root.persistableEditorHtml;
        root.persistableEditorHtml = function () {
            if (!useEngine) return origPersist.apply(this, arguments);
            capture();
            persistLite();
            return current.html;
        };
        root.persistableEditorHtml._abeneDocument = true;
    }

    wrapFn('saveDocument', persistLite);
    wrapFn('newDocument', function () { stale = true; capture(); persistLite(); });
    wrapFn('finishOpenedDocument', function () { stale = true; capture(); persistLite(); });
    wrapFn('restoreLocalProject', function () {
        stale = true;
        capture();
        persistLite();
    });

    if (typeof root.exportHtml === 'function' && !root.exportHtml._abeneDocument) {
        var origExportHtml = root.exportHtml;
        root.exportHtml = function () {
            if (!useEngine) return origExportHtml.apply(this, arguments);
            capture();
            var name = (current && current.name) || 'document';
            var doc = toHtmlFile(current);
            if (typeof root.downloadFile === 'function') root.downloadFile(doc, name + '.html', 'text/html');
            if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        };
        root.exportHtml._abeneDocument = true;
    }

    if (typeof root.loadFile === 'function' && !root.loadFile._abeneDocument) {
        var origLoad = root.loadFile;
        root.loadFile = function (event) {
            var file = event && event.target && event.target.files && event.target.files[0];
            if (useEngine && file && /\.json$/i.test(file.name)) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var parsed = null;
                    try { parsed = JSON.parse(String(e.target.result || '')); } catch (err) { parsed = null; }
                    if (!parsed || parsed.html == null) return;
                    var model = parse(parsed);
                    if (!model) return;
                    if (typeof root.resetEditorToOriginal === 'function') root.resetEditorToOriginal();
                    apply(model);
                    if (typeof root.finishOpenedDocument === 'function') {
                        root.finishOpenedDocument(file.name, typeof root.t === 'function' ? root.t('toastOpen') : '');
                    }
                };
                reader.readAsText(file);
                if (event.target) event.target.value = '';
                return;
            }
            return origLoad.apply(this, arguments);
        };
        root.loadFile._abeneDocument = true;
    }

    bindEditor();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEditor);
    }
    root.addEventListener('load', function () {
        bindEditor();
        if (!useEngine) return;
        try { if (!current) capture(); } catch (e) {}
    });

    /* Citação: o menu APA/MLA/Chicago existe ; envelopper pour marquer le style actif
       et permettre de modifier une citação (duplo-clique). Ne pas toucher au picker. */
    (function wrapCitations() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return v;
            }
            return fb || key;
        }
        function esc(s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }
        var origStyle = root.setCitationStyle;
        root.setCitationStyle = function (ev) {
            if (typeof origStyle === 'function') origStyle.apply(this, arguments);
            var fly = document.getElementById('ribbonFlyout');
            if (!fly || !fly.classList.contains('visible')) return;
            var cur = 'APA';
            try { cur = localStorage.getItem('abeneCitationStyle') || 'APA'; } catch (eC) {}
            Array.prototype.forEach.call(fly.querySelectorAll('button'), function (b) {
                if (String(b.textContent || '').trim() === cur) b.classList.add('active');
                else b.classList.remove('active');
            });
        };

        root.abeneEditCitation = function (span) {
            if (!span || typeof openGenericModal !== 'function') return;
            window._abeneCiteEl = span;
            openGenericModal(tt('citation', 'Citação'),
                '<div class="form-group"><label>' + esc(tt('pAuthor', 'Autor')) + '</label>' +
                    '<input id="abeneCiteAuthor" value="' + esc(span.getAttribute('data-cite-author') || '') + '"></div>' +
                '<div class="form-group"><label>' + esc(tt('pSourceTitle', 'Título')) + '</label>' +
                    '<input id="abeneCiteTitle" value="' + esc(span.getAttribute('data-cite-title') || '') + '"></div>' +
                '<div class="form-group"><label>' + esc(tt('pYear', 'Ano')) + '</label>' +
                    '<input id="abeneCiteYear" value="' + esc(span.getAttribute('data-cite-year') || String(new Date().getFullYear())) + '"></div>',
                '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneApplyCiteEdit()">' + esc(tt('ok', 'OK')) + '</button>'
            );
        };
        root.abeneApplyCiteEdit = function () {
            var span = window._abeneCiteEl;
            var aEl = document.getElementById('abeneCiteAuthor');
            var tEl = document.getElementById('abeneCiteTitle');
            var yEl = document.getElementById('abeneCiteYear');
            var a = aEl ? String(aEl.value || '').trim() : '';
            var ti = tEl ? String(tEl.value || '').trim() : '';
            var y = yEl ? String(yEl.value || '').trim() : '';
            if (typeof closeModal === 'function') closeModal('genericModal');
            if (!span || !span.setAttribute || !a || !ti) return;
            span.setAttribute('data-cite-author', a);
            span.setAttribute('data-cite-title', ti);
            span.setAttribute('data-cite-year', y);
            var cur = 'APA';
            try { cur = localStorage.getItem('abeneCitationStyle') || 'APA'; } catch (eS) {}
            if (typeof root.abeneApplyCiteStyle === 'function') root.abeneApplyCiteStyle(cur);
            else {
                span.textContent = '(' + a + ', ' + y + ')';
                if (typeof root.saveUndoState === 'function') root.saveUndoState();
            }
        };

        function bindCite() {
            var editor = ed();
            if (!editor || editor._abeneCiteEdit) return;
            editor._abeneCiteEdit = true;
            editor.addEventListener('dblclick', function (ev) {
                var span = ev.target && ev.target.closest && ev.target.closest('[data-citation]');
                if (!span || !editor.contains(span)) return;
                ev.preventDefault();
                root.abeneEditCitation(span);
            });
        }
        bindCite();
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindCite);
        root.addEventListener('load', bindCite);
    })();

    /* Ver → Proteger : janela em vez de prompt/alert. Sessão + contenteditable inalterados. */
    (function wrapProtect() {
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
        function ds() {
            return (root.abene && root.abene.documentState) || root.documentState || null;
        }
        function editorEl() {
            return document.getElementById('editor');
        }
        function refreshBtn() {
            var btn = document.querySelector('button[onclick="toggleProtection()"]');
            if (!btn) return;
            var lab = btn.querySelector('[data-i18n="protect"]') || btn.querySelector('span:not(.icon)');
            var st = ds();
            if (lab && st) {
                lab.textContent = st.protected ? tt('unprotect', 'Desproteger') : tt('protect', 'Proteger');
            }
            btn.classList.toggle('active', !!(st && st.protected));
        }
        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }
        root.abeneProtectConfirm = function () {
            var inp = document.getElementById('abeneProtPwd');
            var err = document.getElementById('abeneProtErr');
            var pwd = inp ? String(inp.value || '') : '';
            var st = ds();
            var ed = editorEl();
            if (!st || !ed) return;
            if (st.protected) {
                var expected = '';
                try { expected = sessionStorage.getItem('abenePassword') || ''; } catch (eG) {}
                if (pwd !== expected) {
                    if (err) err.textContent = tt('aPwdBad', 'Palavra-passe incorreta.');
                    return;
                }
                if (typeof closeModal === 'function') closeModal('genericModal');
                st.protected = false;
                ed.contentEditable = 'true';
                refreshBtn();
                toast(tt('aUnlocked', 'Documento desbloqueado.'));
                return;
            }
            if (!pwd) {
                if (err) err.textContent = tt('aSetPwd', 'Definir uma palavra-passe de proteção:');
                return;
            }
            if (typeof closeModal === 'function') closeModal('genericModal');
            try { sessionStorage.setItem('abenePassword', pwd); } catch (eS) {}
            st.protected = true;
            ed.contentEditable = 'false';
            refreshBtn();
            toast(tt('aProtected', 'Documento protegido só de leitura nesta sessão.'));
        };
        var orig = root.toggleProtection;
        root.toggleProtection = function () {
            if (typeof openGenericModal !== 'function') {
                if (typeof orig === 'function') return orig.apply(this, arguments);
                return;
            }
            var st = ds();
            var locked = !!(st && st.protected);
            var title = locked ? tt('unprotect', 'Desproteger') : tt('protect', 'Proteger');
            var label = locked ? tt('aPwd', 'Palavra-passe:') : tt('aSetPwd', 'Definir uma palavra-passe de proteção:');
            var okLab = locked ? tt('unprotect', 'Desproteger') : tt('protect', 'Proteger');
            var hint = locked ? '' : '<p style="margin:8px 0 0;font-size:12px;color:#666;">' + esc(tt('aProtected', 'Documento protegido só de leitura nesta sessão.')) + '</p>';
            openGenericModal(title,
                '<div class="form-group"><label for="abeneProtPwd">' + esc(label) + '</label>' +
                    '<input id="abeneProtPwd" type="password" autocomplete="new-password"></div>' +
                '<p id="abeneProtErr" style="color:#c00;min-height:1.2em;margin:0;"></p>' + hint,
                '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneProtectConfirm()">' + esc(okLab) + '</button>'
            );
            if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
            setTimeout(function () {
                var first = document.getElementById('abeneProtPwd');
                if (!first) return;
                first.focus();
                first.addEventListener('keydown', function (ev) {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        root.abeneProtectConfirm();
                    }
                });
            }, 30);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshBtn);
        else refreshBtn();
        root.addEventListener('load', refreshBtn);
    })();

    /* Aceitar / Recusar: janela de confirmação + toast (index fazia tudo em silêncio). */
    (function wrapTrackAll() {
        function tt(key, fb, vars) {
            vars = vars || {};
            if (typeof root.t === 'function') {
                var v = root.t(key, vars);
                if (v && v !== key) return String(v);
            }
            var out = fb || key;
            Object.keys(vars).forEach(function (k) {
                out = String(out).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
            });
            return out;
        }
        function esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        function ed() { return document.getElementById('editor'); }
        function countChanges() {
            var node = ed();
            if (!node) return 0;
            return node.querySelectorAll('ins.abene-change, del.abene-change, span.abene-change').length;
        }
        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }
        function changeAtCaret() {
            var rootEd = ed();
            var sel = window.getSelection();
            var node = null;
            if (sel && sel.rangeCount) {
                node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentElement;
            }
            if (!node || !node.closest) return null;
            var mark = node.closest('ins.abene-change, del.abene-change, span.abene-change');
            if (mark && rootEd && rootEd.contains(mark)) return mark;
            return null;
        }
        function applyOne(kind, node) {
            if (!node || !node.parentNode) return false;
            var tag = String(node.tagName || '').toUpperCase();
            var kids = Array.prototype.slice.call(node.childNodes);
            if (kind === 'reject') {
                if (tag === 'DEL') node.replaceWith.apply(node, kids);
                else node.remove();
            } else if (tag === 'DEL') {
                node.remove();
            } else {
                node.replaceWith.apply(node, kids);
            }
            if (typeof root.saveUndoState === 'function') root.saveUndoState();
            if (typeof root.updateStats === 'function') root.updateStats();
            return true;
        }
        var origAccept = root.acceptAllChanges;
        var origReject = root.rejectAllChanges;
        function confirmAll(kind) {
            var n = countChanges();
            if (!n) {
                toast(tt('aNoChanges', 'Nenhuma alteração registada.'));
                return;
            }
            if (typeof openGenericModal !== 'function') {
                if (kind === 'reject' && typeof origReject === 'function') origReject.apply(root, []);
                else if (typeof origAccept === 'function') origAccept.apply(root, []);
                return;
            }
            var title = kind === 'reject'
                ? tt('reject', 'Rejeitar')
                : tt('accept', 'Aceitar');
            var msg = kind === 'reject'
                ? tt('rejectAllConfirm', 'Recusar todas as {n} alteração(ões)?', { n: n })
                : tt('acceptAllConfirm', 'Aceitar todas as {n} alteração(ões)?', { n: n });
            root._abeneTrackKind = kind;
            openGenericModal(title,
                '<p id="abeneTrackConfirmMsg">' + esc(msg) + '</p>',
                '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' +
                    esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" id="abeneTrackOk" onclick="abeneTrackApplyAll()">' +
                    esc(tt('ok', 'OK')) + '</button>'
            );
            if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        }
        root.abeneTrackApplyAll = function () {
            var kind = root._abeneTrackKind;
            if (typeof closeModal === 'function') closeModal('genericModal');
            if (kind === 'reject' && typeof origReject === 'function') origReject.apply(root, []);
            else if (typeof origAccept === 'function') origAccept.apply(root, []);
            toast(kind === 'reject'
                ? tt('rejectAllDone', 'Alterações recusadas.')
                : tt('acceptAllDone', 'Alterações aceites.'));
        };
        function onRibbon(kind) {
            var one = changeAtCaret();
            if (one) {
                applyOne(kind, one);
                toast(kind === 'reject'
                    ? tt('rejectOneDone', 'Alteração recusada.')
                    : tt('acceptOneDone', 'Alteração aceite.'));
                return;
            }
            confirmAll(kind);
        }
        root.acceptAllChanges = function () { onRibbon('accept'); };
        root.rejectAllChanges = function () { onRibbon('reject'); };
        root._abeneTrackAll = true;
        root._abeneTrackOne = true;
    })();

    /* Ver → Modo de foco: o friso desaparece; fica um botão visível para sair (além de Esc). */
    (function wrapFocusMode() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function isOn() { return document.body.classList.contains('focus-mode'); }
        function ribbonBtn() {
            return document.querySelector('#tab-view button[onclick="toggleFocusMode()"]') ||
                document.querySelector('button[onclick="toggleFocusMode()"]');
        }
        function refreshBtn() {
            var btn = ribbonBtn();
            if (btn) btn.classList.toggle('active', isOn());
        }
        function ensureBar() {
            var bar = document.getElementById('abeneFocusExit');
            if (!bar) {
                bar = document.createElement('button');
                bar.id = 'abeneFocusExit';
                bar.type = 'button';
                bar.setAttribute('aria-label', tt('focusExit', 'Sair do modo de foco (Esc)'));
                bar.style.cssText = 'position:fixed;top:10px;right:14px;z-index:12000;display:none;border:0;border-radius:4px;padding:8px 14px;font:13px "Segoe UI",sans-serif;cursor:pointer;background:#2b579a;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25);';
                bar.addEventListener('click', function (ev) {
                    if (ev && ev.preventDefault) ev.preventDefault();
                    if (isOn() && typeof root.toggleFocusMode === 'function') root.toggleFocusMode();
                });
                document.body.appendChild(bar);
            }
            bar.textContent = tt('focusExit', 'Sair do modo de foco (Esc)');
            bar.style.display = isOn() ? 'block' : 'none';
        }
        var orig = root.toggleFocusMode;
        if (typeof orig !== 'function' || orig._abeneFocusWrap) return;
        root.toggleFocusMode = function () {
            orig.apply(this, arguments);
            refreshBtn();
            ensureBar();
        };
        root.toggleFocusMode._abeneFocusWrap = true;
        root.toggleFocusMode._legacy = orig;
        function boot() {
            refreshBtn();
            ensureBar();
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
        root.addEventListener('load', boot);
    })();

    /* Ver → Versões: confirmar restaurar/copiar; botão para gravar uma versão agora. */
    (function wrapVersions() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        function addSnapButton() {
            var title = document.getElementById('genericModalTitle');
            var foot = document.getElementById('genericModalFooter');
            var overlay = document.getElementById('genericModal');
            if (!foot || !overlay || !overlay.classList.contains('visible')) return;
            if (foot.querySelector('#abeneVerSnap')) return;
            var label = (title && title.textContent) || '';
            if (label.indexOf('Histórico') < 0 && label.toLowerCase().indexOf('vers') < 0 &&
                label.toLowerCase().indexOf('version') < 0) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'abeneVerSnap';
            btn.className = 'btn-secondary';
            btn.textContent = tt('versionsSaveNow', 'Guardar versão agora');
            btn.addEventListener('click', function () {
                if (typeof root.saveDocument === 'function') root.saveDocument({ silent: true });
                if (typeof root.showToast === 'function') root.showToast(tt('toastSaved', 'Guardado'));
                if (typeof root.showVersions === 'function') root.showVersions();
            });
            if (foot.firstChild) foot.insertBefore(btn, foot.firstChild);
            else foot.appendChild(btn);
        }
        var origShow = root.showVersions;
        if (typeof origShow === 'function' && !origShow._abeneVerSnap) {
            root.showVersions = function () {
                var r = origShow.apply(this, arguments);
                setTimeout(addSnapButton, 0);
                return r;
            };
            root.showVersions._abeneVerSnap = true;
            root.showVersions._legacy = origShow;
        }
        function confirmThen(kind, index, orig) {
            if (typeof orig !== 'function') return;
            if (typeof root.openGenericModal !== 'function') {
                orig.call(root, index);
                return;
            }
            root._abeneVerIdx = index;
            root._abeneVerKind = kind;
            var ask = kind === 'copy'
                ? tt('versionsCopyAsk', 'Abrir uma cópia desta versão como documento novo?')
                : tt('versionsRestoreAsk', 'Substituir o documento atual por esta versão?');
            var okLab = kind === 'copy' ? tt('versionsCopy', 'Copiar como novo') : tt('versionsRestore', 'Restaurar');
            root.openGenericModal(okLab, '<p>' + esc(ask) + '</p>',
                '<button type="button" class="btn-secondary" onclick="showVersions()">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneVersionsConfirmGo()">' + esc(okLab) + '</button>'
            );
        }
        root.abeneVersionsConfirmGo = function () {
            var kind = root._abeneVerKind;
            var idx = root._abeneVerIdx;
            if (typeof root.closeModal === 'function') root.closeModal('genericModal');
            if (kind === 'copy' && typeof root.copyVersionAsNew === 'function' && root.copyVersionAsNew._abeneVerOrig) {
                root.copyVersionAsNew._abeneVerOrig.call(root, idx);
            } else if (kind !== 'copy' && typeof root.restoreVersion === 'function' && root.restoreVersion._abeneVerOrig) {
                root.restoreVersion._abeneVerOrig.call(root, idx);
            }
        };
        var origRestore = root.restoreVersion;
        if (typeof origRestore === 'function' && !origRestore._abeneVerWrap) {
            root.restoreVersion = function (index) { confirmThen('restore', index, origRestore); };
            root.restoreVersion._abeneVerWrap = true;
            root.restoreVersion._abeneVerOrig = origRestore;
        }
        var origCopy = root.copyVersionAsNew;
        if (typeof origCopy === 'function' && !origCopy._abeneVerWrap) {
            root.copyVersionAsNew = function (index) { confirmThen('copy', index, origCopy); };
            root.copyVersionAsNew._abeneVerWrap = true;
            root.copyVersionAsNew._abeneVerOrig = origCopy;
        }
    })();
})(window);
