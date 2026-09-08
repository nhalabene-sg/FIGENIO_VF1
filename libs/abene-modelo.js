/* Genius Raros — modelos de relatório (capa, folha de rosto, cabeçalho, logótipo) */
(function () {
    var NAVY = '#0b1223';
    var GOLD = '#c9a84c';
    var META = '#5b7aa8';
    var KEY = 'abeneReportModel';
    var BLOCKS = '[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="body-logo"], [data-abene-block="toc"], [data-abene-block="signs"], [data-abene-block="confidential"], [data-abene-block="annex"], [data-abene-break="model"]';
    var UI_MAP = {
        cover: 'mdlCover',
        titlepage: 'mdlTitlepage',
        toc: 'mdlToc',
        signs: 'mdlSigns',
        confidential: 'mdlConfidential',
        annex: 'mdlAnnex',
        header: 'mdlHeader',
        logo: 'mdlLogo',
        footer: 'mdlFooter',
        differentFirst: 'mdlDiffFirst'
    };

    function tt(key) { return typeof window.t === 'function' ? window.t(key) : key; }
    function A() { return window.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function company() { return A().companyData || {}; }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function defaultOpts() {
        return {
            style: 'gr',
            cover: true,
            titlepage: true,
            toc: false,
            signs: false,
            confidential: false,
            annex: false,
            header: true,
            logo: true,
            footer: true,
            differentFirst: true,
            skeleton: '',
            kind: ''
        };
    }

    function loadOpts() {
        var o = defaultOpts();
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (saved && typeof saved === 'object') Object.assign(o, saved);
        } catch (e) {}
        return o;
    }

    function saveOpts(o) {
        try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
        if (A().reportModel !== undefined) A().reportModel = o;
    }

    function readUi() {
        var o = loadOpts();
        var styleBtn = document.querySelector('.modelo-style-card.on');
        o.style = (styleBtn && styleBtn.getAttribute('data-style')) || o.style || 'gr';
        Object.keys(UI_MAP).forEach(function (k) {
            var el = document.getElementById(UI_MAP[k]);
            if (el) o[k] = !!el.checked;
        });
        return o;
    }

    function writeUi(o) {
        o = o || loadOpts();
        document.querySelectorAll('.modelo-style-card').forEach(function (btn) {
            var selected = btn.getAttribute('data-style') === o.style;
            btn.classList.toggle('on', selected);
            btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        Object.keys(UI_MAP).forEach(function (k) {
            var el = document.getElementById(UI_MAP[k]);
            if (el) el.checked = !!o[k];
        });
    }

    function fieldsFromDoc() {
        var editor = ed();
        var out = {};
        function grab(sel) {
            var el = editor && editor.querySelector(sel);
            if (!el) return '';
            return String(el.innerText || '').replace(/\u200b/g, '').trim();
        }
        out.work = grab('[data-abene-field="work"]');
        out.ref = grab('[data-abene-field="ref"]');
        out.date = grab('[data-abene-field="date"]');
        out.client = grab('[data-abene-field="client"]');
        out.site = grab('[data-abene-field="site"]');
        out.tech = grab('[data-abene-field="tech"]');
        out.version = grab('[data-abene-field="version"]');
        var hf = A().pageHeaderFields || {};
        if (!out.ref && hf.ref) out.ref = hf.ref;
        if (!out.date && hf.date) out.date = hf.date;
        return out;
    }

    function defaultMeta() {
        var y = new Date().getFullYear();
        var iso = new Date().toISOString().slice(0, 10);
        var stored = window._abeneModeloMeta || {};
        var prev = fieldsFromDoc();
        return {
            work: stored.work || prev.work || tt('mdlWorkDef') || 'Título do relatório',
            ref: stored.ref || prev.ref || 'GR-RAP-' + y + '-001',
            date: stored.date || prev.date || iso,
            client: stored.client || prev.client || tt('mdlClientDef') || 'Cliente',
            site: stored.site || prev.site || tt('mdlSiteDef') || 'Obra / local',
            tech: stored.tech || prev.tech || tt('mdlTechDef') || 'Técnico responsável',
            version: stored.version || prev.version || '1.0'
        };
    }

    function kindTitle(opts) {
        if (opts && opts.kind === 'minutes') return tt('mdlKindMinutes') || tt('tplMinutesTitle') || 'ATA';
        if (opts && opts.style === 'carta') return tt('hfTplLetterTitle') || 'CARTA';
        if (opts && opts.style === 'simples') return tt('mdlStyleSimple') || 'TEXTO';
        if (opts && opts.style === 'inspecao') return tt('mdlStyleInsp') || 'INSPEÇÃO';
        return tt('hfTplReportTitle') || 'RELATÓRIO';
    }

    function logoHtml(cls, size) {
        var co = company();
        var src = co.iconUrl || 'branding/icon_96.svg';
        var name = esc(co.name || 'Genius Raros');
        return '<img class="' + cls + '" src="' + esc(src) + '" alt="' + name + '" width="' + size + '" height="' + size + '" draggable="false" />';
    }

    function modelBreak() {
        return '<div class="page-break-marker" contenteditable="false" data-abene-break="model"></div>';
    }

    function buildCover(opts, meta) {
        var co = company();
        var name = esc(co.name || 'Genius Raros');
        var slogan = esc(co.slogan || 'Canalização. Construção. Pesquisa.');
        var st = 'abene-cover estilo-' + (opts.style || 'gr');
        var logo = opts.logo ? logoHtml('abene-cover-logo', 72) : '';
        return '<div class="' + st + '" data-abene-block="cover">' +
            '<div class="abene-cover-top">' +
            '<div class="abene-cover-brand">' + logo +
            '<div class="abene-cover-brand-copy"><div class="abene-cover-name">' + name + '</div>' +
            (co.legalForm ? '<div class="abene-cover-legal">' + esc(co.legalForm) + '</div>' : '') + '</div></div>' +
            '<div class="abene-cover-kicker">' + esc(tt('mdlCoverKicker')) + '</div>' +
            '</div>' +
            '<div class="abene-cover-mid">' +
            '<div class="abene-cover-accent"></div>' +
            '<div class="abene-cover-kind" data-abene-field="doctype">' + esc(kindTitle(opts)) + '</div>' +
            '<div class="abene-cover-work" data-abene-field="work">' + esc(meta.work) + '</div>' +
            '<div class="abene-cover-meta">' +
            '<div><span>' + esc(tt('mdlFieldRef')) + '</span><strong data-abene-field="ref">' + esc(meta.ref) + '</strong></div>' +
            '<div><span>' + esc(tt('mdlFieldDate')) + '</span><strong data-abene-field="date">' + esc(meta.date) + '</strong></div>' +
            '<div><span>' + esc(tt('mdlFieldVersion')) + '</span><strong data-abene-field="version">' + esc(meta.version) + '</strong></div>' +
            '</div>' +
            '</div>' +
            '<div class="abene-cover-bottom">' +
            '<div class="abene-cover-gold"></div>' +
            '<div class="abene-cover-footline"><div>' +
            (slogan ? '<div class="abene-cover-slogan">' + slogan + '</div>' : '') +
            (co.address ? '<div class="abene-cover-addr">' + esc(co.address) + '</div>' : '') +
            '</div><div class="abene-cover-docmark">' + esc(kindTitle(opts)) + '</div></div>' +
            '</div></div>';
    }

    function idRow(label, field, value) {
        return '<tr><th>' + esc(label) + '</th><td data-abene-field="' + field + '">' + esc(value) + '</td></tr>';
    }

    function buildTitlePage(opts, meta) {
        var co = company();
        var name = esc(co.name || 'Genius Raros');
        var st = 'abene-titlepage estilo-' + (opts.style || 'gr');
        var logo = opts.logo
            ? '<div class="abene-tp-brand">' + logoHtml('abene-tp-logo', 48) + '<div><div class="abene-tp-name">' + name + '</div>' +
              (co.slogan ? '<div class="abene-tp-slogan">' + esc(co.slogan) + '</div>' : '') + '</div></div>'
            : '<div class="abene-tp-name">' + name + '</div>';
        return '<div class="' + st + '" data-abene-block="titlepage">' +
            logo +
            '<div class="abene-tp-heading-row"><div class="abene-tp-heading">' + esc(tt('mdlTitlepage')) + '</div>' +
            '<div class="abene-tp-doc-type" data-abene-field="doctype">' + esc(kindTitle(opts)) + '</div></div>' +
            '<div class="abene-cover-gold"></div>' +
            '<div class="abene-tp-work" data-abene-field="work">' + esc(meta.work) + '</div>' +
            '<div class="abene-tp-table-wrap"><table class="abene-tp-table">' +
            idRow(tt('mdlFieldRef'), 'ref', meta.ref) +
            idRow(tt('mdlFieldDate'), 'date', meta.date) +
            idRow(tt('mdlFieldClient'), 'client', meta.client) +
            idRow(tt('mdlFieldSite'), 'site', meta.site) +
            idRow(tt('mdlFieldVersion'), 'version', meta.version) +
            idRow(tt('mdlFieldTech'), 'tech', meta.tech) +
            (co.nif ? idRow(tt('taxId') || 'NIF', 'nif', co.nif) : '') +
            '</table></div>' +
            '<p class="abene-tp-note">' + esc(tt('mdlTitleHint')) + '</p>' +
            '</div>';
    }

    function buildBodyLogo(opts) {
        var co = company();
        var name = esc(co.name || 'Genius Raros');
        return '<div class="abene-body-logo" data-abene-block="body-logo">' +
            (opts.logo ? logoHtml('abene-body-logo-img', 40) : '') +
            '<div class="abene-body-logo-text"><strong>' + name + '</strong>' +
            (co.slogan ? '<span>' + esc(co.slogan) + '</span>' : '') +
            '</div></div>';
    }

    function buildTocPage() {
        return '<div class="abene-toc" data-abene-block="toc">' +
            '<h1>' + esc(tt('tocTitle') || 'Índice') + '</h1>' +
            '<p>' + esc(tt('mdlTocHint')) + '</p>' +
            '</div>';
    }

    function buildConfidential() {
        return '<div class="abene-conf-banner" data-abene-block="confidential">' + esc(tt('mdlConfText')) + '</div>';
    }

    function buildSigns(meta) {
        return '<div class="abene-signs" data-abene-block="signs">' +
            '<div><div class="abene-sign-line">' + esc(meta.tech || tt('mdlSignTech')) + '</div></div>' +
            '<div><div class="abene-sign-line">' + esc(meta.client || tt('mdlSignClient')) + '</div></div>' +
            '</div>';
    }

    function buildAnnex() {
        return '<div class="abene-annex" data-abene-block="annex">' +
            '<h1>' + esc(tt('mdlAnnexTitle')) + '</h1>' +
            '<p>' + esc(tt('mdlAnnexHint')) + '</p>' +
            '</div>';
    }

    function reportSkeleton() {
        return '<h1>' + esc(tt('tplReportBody')) + '</h1>' +
            '<h2>' + esc(tt('tplIntro')) + '</h2><p></p>' +
            '<h2>' + esc(tt('tplAnalysis')) + '</h2><p></p>' +
            '<h2>' + esc(tt('tplConclusion')) + '</h2><p></p>';
    }

    function letterSkeleton() {
        var co = company();
        return '<p><strong>' + esc(co.name || tt('tplSender')) + '</strong></p>' +
            '<p>' + esc(co.address || tt('tplAddr')) + '</p>' +
            '<p>&nbsp;</p>' +
            '<p>' + esc(tt('tplRecipient')) + '</p>' +
            '<p>&nbsp;</p>' +
            '<p><strong>' + esc(tt('tplSubject')) + '</strong> …</p>' +
            '<p>' + esc(tt('tplDear')) + '</p>' +
            '<p>' + esc(tt('tplBody')) + '</p>' +
            '<p>' + esc(tt('tplYours')) + '</p>' +
            '<p>' + esc(tt('tplSign')) + '</p>';
    }

    function minutesSkeleton() {
        return '<h1>' + esc(tt('tplMinutesTitle')) + '</h1>' +
            '<p><strong>' + esc(tt('tplPlace')) + '</strong> …</p>' +
            '<h2>' + esc(tt('tplAttendees')) + '</h2><p></p>' +
            '<h2>' + esc(tt('tplAgenda')) + '</h2><p></p>' +
            '<h2>' + esc(tt('tplDecisions')) + '</h2><p></p>';
    }

    function bodySkeleton(opts) {
        if (opts && (opts.skeleton === 'letter' || opts.style === 'carta')) return letterSkeleton();
        if (opts && (opts.skeleton === 'minutes' || opts.kind === 'minutes')) return minutesSkeleton();
        return reportSkeleton();
    }

    function isAlmostEmpty(editor) {
        var tmp = editor.cloneNode(true);
        tmp.querySelectorAll('[data-abene-block], .page-break-marker, .abene-page-flow').forEach(function (n) { n.remove(); });
        var text = String(tmp.innerText || '').replace(/\s+/g, ' ').trim();
        return text.length < 40 || /Comece a escrever|Commencez à|Start typing|Empiece a escribir/.test(text);
    }

    function stripModelBlocks(editor) {
        editor.querySelectorAll(BLOCKS).forEach(function (n) { n.remove(); });
    }

    function applyHeaderFooter(opts) {
        if (typeof A().pageHeaderDifferentFirst !== 'undefined') {
            A().pageHeaderDifferentFirst = !!(opts.cover && opts.differentFirst);
        }
        try { localStorage.setItem('abeneHeaderDifferentFirst', A().pageHeaderDifferentFirst ? '1' : '0'); } catch (e) {}
        if (opts.header) {
            var tpl = 'text';
            if (opts.style === 'carta' || opts.skeleton === 'letter') tpl = 'gr-letter';
            else if (opts.logo) tpl = 'gr-report';
            if (window.applyHeaderTemplate) window.applyHeaderTemplate(tpl, { silent: true });
        } else if (window.applyHeaderTemplate) {
            window.applyHeaderTemplate('blank', { silent: true });
        }
        if (opts.footer) {
            var co = company();
            A().pageFooterText = (co.name || 'Genius Raros') + '  ·  {PAGE} / {NUMPAGES}';
            try { localStorage.setItem('abeneFooter', A().pageFooterText); } catch (e) {}
        }
        window._abeneChromeSig = '';
    }

    function applyMetaToDoc(meta) {
        var editor = ed();
        if (!editor || !meta) return;
        Object.keys(meta).forEach(function (k) {
            editor.querySelectorAll('[data-abene-field="' + k + '"]').forEach(function (el) {
                el.textContent = meta[k];
            });
        });
    }

    window.selectModeloStyle = function (style, ev) {
        document.querySelectorAll('.modelo-style-card').forEach(function (btn) {
            var selected = btn.getAttribute('data-style') === style;
            btn.classList.toggle('on', selected);
            btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        if (ev) ev.stopPropagation();
        var o = readUi();
        o.style = style;
        if (style === 'carta') o.skeleton = 'letter';
        else if (o.skeleton === 'letter' || o.skeleton === 'minutes') o.skeleton = '';
        if (style !== 'tecnico') o.kind = '';
        saveOpts(o);
        window.applyReportModel(o, true);
    };

    window.onModeloCheck = function (which) {
        var o = readUi();
        if (which === 'cover' && o.cover) {
            var df = document.getElementById('mdlDiffFirst');
            if (df) { df.checked = true; o.differentFirst = true; }
        }
        saveOpts(o);
        if (which === 'header' || which === 'logo' || which === 'footer' || which === 'diff') {
            applyHeaderFooter(o);
            window._abeneChromeSig = '';
            if (typeof renderPageDecorations === 'function') renderPageDecorations();
            if (typeof refreshPagination === 'function') refreshPagination();
            return;
        }
        window.applyReportModel(o, true);
    };

    window.applyReportModel = function (forced, silent) {
        var editor = ed();
        if (!editor) return;
        var opts = forced || readUi();
        saveOpts(opts);
        var meta = defaultMeta();
        window._abeneModeloMeta = meta;
        window._abeneModeloApplied = true;
        var keep = isAlmostEmpty(editor) ? '' : (function () {
            var wrap = document.createElement('div');
            wrap.innerHTML = editor.innerHTML;
            wrap.querySelectorAll(BLOCKS).forEach(function (n) { n.remove(); });
            wrap.querySelectorAll('.abene-page-flow').forEach(function (n) { n.remove(); });
            return wrap.innerHTML;
        })();
        stripModelBlocks(editor);
        var html = '';
        if (opts.cover) html += buildCover(opts, meta) + modelBreak();
        if (opts.titlepage) html += buildTitlePage(opts, meta) + modelBreak();
        if (opts.confidential) html += buildConfidential();
        if (opts.toc) html += buildTocPage() + modelBreak();
        if (opts.logo && !opts.header && !opts.cover) html += buildBodyLogo(opts);
        if (keep && keep.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '').trim()) html += keep;
        else html += bodySkeleton(opts);
        if (opts.signs) html += buildSigns(meta);
        if (opts.annex) html += modelBreak() + buildAnnex();
        editor.innerHTML = html;
        applyHeaderFooter(opts);
        if (opts.toc && window.abeneFillModeloToc) {
            window.abeneFillModeloToc(editor.querySelector('[data-abene-block="toc"]'));
        }
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (!silent && typeof showToast === 'function') showToast(tt('mdlApplied'));
        if (A().documentState) A().documentState.dirty = true;
        if (typeof updateSaveStatus === 'function') updateSaveStatus();
    };

    window.applyModeloPreset = function (kind) {
        var o = readUi();
        if (kind === 'letter') {
            o.style = 'carta';
            o.cover = false;
            o.titlepage = false;
            o.toc = false;
            o.annex = false;
            o.confidential = false;
            o.signs = true;
            o.header = true;
            o.logo = true;
            o.footer = true;
            o.differentFirst = false;
            o.skeleton = 'letter';
            o.kind = '';
        } else if (kind === 'minutes') {
            o.style = 'tecnico';
            o.cover = true;
            o.titlepage = true;
            o.toc = false;
            o.annex = false;
            o.confidential = false;
            o.signs = true;
            o.header = true;
            o.logo = true;
            o.footer = true;
            o.differentFirst = true;
            o.skeleton = 'minutes';
            o.kind = 'minutes';
        } else {
            o.style = 'gr';
            o.cover = true;
            o.titlepage = true;
            o.header = true;
            o.logo = true;
            o.footer = true;
            o.differentFirst = true;
        }
        writeUi(o);
        saveOpts(o);
        window.applyReportModel(o);
    };

    window.editModeloMeta = function () {
        var m = defaultMeta();
        if (typeof openGenericModal !== 'function') return;
        function field(id, label, val) {
            return '<div class="form-group"><label for="mdlMeta_' + id + '">' + esc(label) + '</label>' +
                '<input id="mdlMeta_' + id + '" type="text" value="' + esc(val) + '"></div>';
        }
        openGenericModal(tt('mdlMeta'),
            '<div class="modelo-meta-grid">' +
            field('work', tt('mdlFieldWork'), m.work) +
            field('ref', tt('mdlFieldRef'), m.ref) +
            field('date', tt('mdlFieldDate'), m.date) +
            field('client', tt('mdlFieldClient'), m.client) +
            field('site', tt('mdlFieldSite'), m.site) +
            field('tech', tt('mdlFieldTech'), m.tech) +
            field('version', tt('mdlFieldVersion'), m.version) + '</div>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="saveModeloMeta()">' + esc(tt('ok')) + '</button>'
        );
    };

    window.saveModeloMeta = function () {
        function val(id) {
            var el = document.getElementById('mdlMeta_' + id);
            return el ? el.value : '';
        }
        var meta = {
            work: val('work'),
            ref: val('ref'),
            date: val('date'),
            client: val('client'),
            site: val('site'),
            tech: val('tech'),
            version: val('version')
        };
        window._abeneModeloMeta = meta;
        applyMetaToDoc(meta);
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof showToast === 'function') showToast(tt('mdlMetaSaved'));
        if (A().documentState) A().documentState.dirty = true;
        if (typeof updateSaveStatus === 'function') updateSaveStatus();
    };

    window.removeReportModelPages = function () {
        var editor = ed();
        if (!editor) return;
        stripModelBlocks(editor);
        window._abeneModeloApplied = false;
        if (!editor.innerHTML.trim()) editor.innerHTML = '<p></p>';
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (typeof showToast === 'function') showToast(tt('mdlRemoved'));
    };

    window.abeneSyncModeloUi = function () { writeUi(loadOpts()); };

    document.addEventListener('DOMContentLoaded', function () {
        writeUi(loadOpts());
    });
})();
