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
})(window);
