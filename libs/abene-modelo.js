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
        out.clientNif = grab('[data-abene-field="clientNif"]');
        out.site = grab('[data-abene-field="site"]');
        out.tech = grab('[data-abene-field="tech"]');
        out.version = grab('[data-abene-field="version"]');
        out.inspType = grab('[data-abene-field="inspType"]');
        out.norm = grab('[data-abene-field="norm"]');
        out.fraction = grab('[data-abene-field="fraction"]');
        var hf = A().pageHeaderFields || {};
        if (!out.ref && hf.ref) out.ref = hf.ref;
        if (!out.date && hf.date) out.date = hf.date;
        return out;
    }

    function isInspection(opts) {
        return !!(opts && (opts.kind === 'inspection' || opts.skeleton === 'inspection' || opts.style === 'inspecao'));
    }
    function isGuidedReport(opts) {
        return !!(opts && (opts.skeleton === 'tech' || opts.kind === 'tech' || isInspection(opts)));
    }

    function defaultMeta(opts) {
        var y = new Date().getFullYear();
        var iso = new Date().toISOString().slice(0, 10);
        var stored = window._abeneModeloMeta || {};
        var prev = fieldsFromDoc();
        var insp = isInspection(opts);
        return {
            work: stored.work || prev.work || (insp ? (tt('mdlWorkDefInsp') || 'Inspeção de canalização') : (tt('mdlWorkDef') || 'Título do relatório')),
            ref: stored.ref || prev.ref || (insp ? 'GR-INSP-' + y + '-001' : 'GR-RAP-' + y + '-001'),
            date: stored.date || prev.date || iso,
            client: stored.client || prev.client || tt('mdlClientDef') || 'Cliente',
            clientNif: stored.clientNif || prev.clientNif || '',
            site: stored.site || prev.site || tt('mdlSiteDef') || 'Obra / local',
            tech: stored.tech || prev.tech || tt('mdlTechDef') || 'Técnico responsável',
            version: stored.version || prev.version || '1.0',
            inspType: stored.inspType || prev.inspType || (insp ? (tt('mdlInspTypeDef') || 'Inspeção de canalização') : ''),
            norm: stored.norm || prev.norm || (insp ? (tt('mdlInspNormDef') || 'Regulamento / caderno de encargos') : ''),
            fraction: stored.fraction || prev.fraction || (insp ? (tt('mdlInspFracDef') || 'Fração / piso') : '')
        };
    }

    function kindTitle(opts) {
        if (opts && opts.kind === 'minutes') return tt('mdlKindMinutes') || tt('tplMinutesTitle') || 'ATA';
        if (opts && (opts.kind === 'tech' || opts.skeleton === 'tech')) return tt('mdlKindTech') || 'RELATÓRIO TÉCNICO';
        if (isInspection(opts)) return tt('mdlKindInsp') || 'RELATÓRIO DE INSPEÇÃO';
        if (opts && opts.style === 'carta') return tt('hfTplLetterTitle') || 'CARTA';
        if (opts && opts.style === 'simples') return tt('mdlStyleSimple') || 'TEXTO';
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
            '<div class="abene-cover-kicker">' + esc(isInspection(opts) ? (tt('mdlCoverKickerInsp') || tt('mdlCoverKicker')) : tt('mdlCoverKicker')) + '</div>' +
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
            idRow(tt('mdlFieldClientNif') || tt('taxId') || 'NIF', 'clientNif', meta.clientNif || '') +
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

    function buildSigns(meta, opts) {
        var extra = isGuidedReport(opts);
        function col(name, role) {
            return '<div>' +
                (extra ? '<div class="abene-sign-space"></div>' : '') +
                '<div class="abene-sign-line">' + esc(name) + '</div>' +
                (extra ? '<div class="abene-sign-role">' + esc(role) + '</div>' +
                    '<div class="abene-sign-date">' + esc(tt('mdlFieldDate')) + ': ____________</div>' : '') +
                '</div>';
        }
        return '<div class="abene-signs' + (extra ? ' abene-signs-tech' : '') + '" data-abene-block="signs">' +
            col(meta.tech || tt('mdlSignTech'), tt('mdlSignTech')) +
            col(meta.client || tt('mdlSignClient'), tt('mdlSignClient')) +
            '</div>';
    }

    function buildAnnex(opts) {
        var guided = isGuidedReport(opts);
        var insp = isInspection(opts);
        return '<div class="abene-annex" data-abene-block="annex">' +
            '<h1 data-abene-style="h1">' + esc(tt('mdlAnnexTitle')) + '</h1>' +
            '<p>' + esc(tt('mdlAnnexHint')) + '</p>' +
            (guided ? heading(2, tt('mdlAnnexA')) + fill('annex-a', tt('mdlFillAnnex')) : '') +
            (insp ? heading(2, tt('mdlAnnexPhotos')) + fill('annex-photos', tt('mdlFillAnnexPhotos')) : '') +
            '</div>';
    }

    function heading(level, text) {
        var tag = level === 1 ? 'h1' : 'h2';
        var st = level === 1 ? 'h1' : 'h2';
        return '<' + tag + ' data-abene-style="' + st + '" data-abene-lock="1" contenteditable="false">' + esc(text) + '</' + tag + '>';
    }
    function fill(id, hint) {
        return '<p class="abene-fill" data-abene-fill="' + id + '">' + esc(hint) + '</p>';
    }
    function techSkeleton(meta) {
        meta = meta || defaultMeta();
        return heading(1, tt('tplReportBody')) +
            '<h3 data-abene-style="h3" data-abene-lock="1" contenteditable="false">' + esc(tt('mdlRevTitle')) + '</h3>' +
            '<table class="abene-rev-table"><thead><tr>' +
            '<th>' + esc(tt('mdlRevRev')) + '</th><th>' + esc(tt('mdlRevDate')) + '</th>' +
            '<th>' + esc(tt('mdlRevDesc')) + '</th><th>' + esc(tt('mdlRevAuthor')) + '</th>' +
            '</tr></thead><tbody><tr>' +
            '<td>' + esc(meta.version || '1.0') + '</td><td>' + esc(meta.date || '') + '</td>' +
            '<td>' + esc(tt('mdlRevFirst')) + '</td><td>' + esc(meta.tech || '') + '</td>' +
            '</tr></tbody></table>' +
            heading(2, tt('mdlSecId')) +
            '<div class="abene-tp-table-wrap"><table class="abene-tp-table">' +
            idRow(tt('mdlFieldRef'), 'ref', meta.ref) +
            idRow(tt('mdlFieldDate'), 'date', meta.date) +
            idRow(tt('mdlFieldClient'), 'client', meta.client) +
            idRow(tt('mdlFieldClientNif') || tt('taxId') || 'NIF', 'clientNif', meta.clientNif || '') +
            idRow(tt('mdlFieldSite'), 'site', meta.site) +
            idRow(tt('mdlFieldTech'), 'tech', meta.tech) +
            idRow(tt('mdlFieldVersion'), 'version', meta.version) +
            '</table></div>' +
            heading(2, tt('mdlSecObject')) + fill('object', tt('mdlFillObject')) +
            heading(2, tt('mdlSecMethod')) + fill('method', tt('mdlFillMethod')) +
            heading(2, tt('mdlSecObs')) + fill('obs', tt('mdlFillObs')) +
            '<p class="abene-fill-hint">' + esc(tt('mdlPhotoHint')) + '</p>' +
            '<h3 data-abene-style="h3" data-abene-lock="1" contenteditable="false">' + esc(tt('mdlCheckTitle')) + '</h3>' +
            checkRows([
                [tt('mdlCheck1'), 'ok'],
                [tt('mdlCheck2'), 'na'],
                [tt('mdlCheck3'), 'nok']
            ]) +
            heading(2, tt('mdlSecConclusions')) + fill('conclusions', tt('mdlFillConclusions')) +
            heading(2, tt('mdlSecReco')) + fill('reco', tt('mdlFillReco'));
    }

    function resultKey(text) {
        var s = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (/não conforme|nao conforme|non conforme|non-compliant|no conforme/.test(s)) return 'nok';
        if (/^n\.?a\.?$|^n\/a$/.test(s)) return 'na';
        if (s === 'ok' || s === 'nok' || s === 'na') return s;
        if (/conforme|compliant/.test(s)) return 'ok';
        return 'ok';
    }
    function checkBtns(key) {
        key = key === 'nok' || key === 'na' ? key : 'ok';
        function btn(val, label) {
            return '<button type="button" class="abene-check-btn' + (val === key ? ' on' : '') +
                '" data-check-val="' + val + '" contenteditable="false">' + esc(label) + '</button>';
        }
        return '<div class="abene-check-btns" contenteditable="false">' +
            btn('ok', tt('mdlCheckOk')) +
            btn('nok', tt('mdlCheckNok')) +
            btn('na', tt('mdlCheckNa')) +
            '<button type="button" class="abene-check-del" title="' + esc(tt('mdlCheckDel') || 'Remover linha') +
            '" contenteditable="false">−</button></div>';
    }
    function checkRowHtml(item, result, notes) {
        var key = resultKey(result);
        return '<tr data-check-result="' + key + '">' +
            '<td class="abene-check-item">' + esc(item || tt('mdlCheckNew') || 'Novo item') + '</td>' +
            '<td class="abene-check-result" contenteditable="false">' + checkBtns(key) + '</td>' +
            '<td class="abene-check-notes">' + esc(notes || '') + '</td></tr>';
    }
    function checkRows(rows) {
        return '<div class="abene-check-wrap" data-abene-check="1">' +
            '<table class="abene-check-table" data-abene-live="1"><thead><tr>' +
            '<th>' + esc(tt('mdlCheckItem')) + '</th><th>' + esc(tt('mdlCheckResult')) + '</th><th>' + esc(tt('mdlCheckNotes')) + '</th>' +
            '</tr></thead><tbody>' + rows.map(function (r) {
                return checkRowHtml(r[0], r[1], r[2]);
            }).join('') + '</tbody></table>' +
            '<p class="abene-check-toolbar" contenteditable="false">' +
            '<button type="button" class="abene-check-add">' + esc(tt('mdlCheckAdd') || 'Adicionar linha') + '</button></p></div>';
    }

    function inspSkeleton(meta) {
        meta = meta || defaultMeta({ kind: 'inspection', skeleton: 'inspection', style: 'inspecao' });
        return heading(1, tt('mdlInspBody')) +
            '<h3 data-abene-style="h3" data-abene-lock="1" contenteditable="false">' + esc(tt('mdlRevTitle')) + '</h3>' +
            '<table class="abene-rev-table"><thead><tr>' +
            '<th>' + esc(tt('mdlRevRev')) + '</th><th>' + esc(tt('mdlRevDate')) + '</th>' +
            '<th>' + esc(tt('mdlRevDesc')) + '</th><th>' + esc(tt('mdlRevAuthor')) + '</th>' +
            '</tr></thead><tbody><tr>' +
            '<td>' + esc(meta.version || '1.0') + '</td><td>' + esc(meta.date || '') + '</td>' +
            '<td>' + esc(tt('mdlRevFirst')) + '</td><td>' + esc(meta.tech || '') + '</td>' +
            '</tr></tbody></table>' +
            heading(2, tt('mdlInspSecId')) +
            '<div class="abene-tp-table-wrap"><table class="abene-tp-table">' +
            idRow(tt('mdlFieldRef'), 'ref', meta.ref) +
            idRow(tt('mdlFieldDate'), 'date', meta.date) +
            idRow(tt('mdlFieldClient'), 'client', meta.client) +
            idRow(tt('mdlFieldClientNif') || tt('taxId') || 'NIF', 'clientNif', meta.clientNif || '') +
            idRow(tt('mdlFieldSite'), 'site', meta.site) +
            idRow(tt('mdlFieldFraction'), 'fraction', meta.fraction) +
            idRow(tt('mdlFieldInspType'), 'inspType', meta.inspType) +
            idRow(tt('mdlFieldNorm'), 'norm', meta.norm) +
            idRow(tt('mdlFieldTech'), 'tech', meta.tech) +
            idRow(tt('mdlFieldVersion'), 'version', meta.version) +
            '</table></div>' +
            heading(2, tt('mdlInspSecObject')) + fill('insp-object', tt('mdlFillInspObject')) +
            heading(2, tt('mdlInspSecInstall')) + fill('insp-install', tt('mdlFillInspInstall')) +
            heading(2, tt('mdlInspSecMethod')) + fill('insp-method', tt('mdlFillInspMethod')) +
            heading(2, tt('mdlInspSecObs')) + fill('insp-obs', tt('mdlFillInspObs')) +
            '<p class="abene-fill-hint">' + esc(tt('mdlPhotoInspHint')) + '</p>' +
            '<h3 data-abene-style="h3" data-abene-lock="1" contenteditable="false">' + esc(tt('mdlCheckTitle')) + '</h3>' +
            checkRows([
                [tt('mdlInspCheck1'), 'ok'],
                [tt('mdlInspCheck2'), 'ok'],
                [tt('mdlInspCheck3'), 'na'],
                [tt('mdlInspCheck4'), 'ok'],
                [tt('mdlInspCheck5'), 'na'],
                [tt('mdlInspCheck6'), 'ok'],
                [tt('mdlInspCheck7'), 'nok'],
                [tt('mdlInspCheck8'), 'na']
            ]) +
            heading(2, tt('mdlInspSecNonconf')) + fill('insp-nonconf', tt('mdlFillInspNonconf')) +
            heading(2, tt('mdlInspSecConclusions')) + fill('insp-conclusions', tt('mdlFillInspConclusions')) +
            heading(2, tt('mdlInspSecReco')) + fill('insp-reco', tt('mdlFillInspReco'));
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

    function bodySkeleton(opts, meta) {
        if (opts && (opts.skeleton === 'letter' || opts.style === 'carta')) return letterSkeleton();
        if (opts && (opts.skeleton === 'minutes' || opts.kind === 'minutes')) return minutesSkeleton();
        if (opts && (opts.skeleton === 'tech' || opts.kind === 'tech')) return techSkeleton(meta);
        if (opts && (opts.skeleton === 'inspection' || opts.kind === 'inspection' || opts.style === 'inspecao')) {
            return inspSkeleton(meta);
        }
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

    function syncHeaderFields(opts, meta) {
        if (!opts || !opts.header || !meta) return;
        var refPrefix = tt('hfRefPrefix') || 'Nº ';
        var datePrefix = tt('hfDatePrefix') || '';
        A().pageHeaderFields = {
            title: kindTitle(opts),
            ref: String(meta.ref || '').indexOf(refPrefix.trim()) === 0 ? meta.ref : (refPrefix + (meta.ref || '')),
            date: [meta.client, meta.site, (datePrefix + (meta.date || '')).trim()].filter(Boolean).join(' · ')
        };
        try { localStorage.setItem('abeneHeaderFields', JSON.stringify(A().pageHeaderFields)); } catch (e) {}
    }

    function applyHeaderFooter(opts, meta) {
        if (typeof A().pageHeaderDifferentFirst !== 'undefined') {
            A().pageHeaderDifferentFirst = !!(opts.cover && opts.differentFirst);
        }
        try { localStorage.setItem('abeneHeaderDifferentFirst', A().pageHeaderDifferentFirst ? '1' : '0'); } catch (e) {}
        syncHeaderFields(opts, meta);
        if (opts.header) {
            var tpl = 'text';
            if (opts.style === 'carta' || opts.skeleton === 'letter') tpl = 'gr-letter';
            else if (opts.logo) tpl = 'gr-report';
            if (window.applyHeaderTemplate) window.applyHeaderTemplate(tpl, { silent: true });
            syncHeaderFields(opts, meta);
        } else if (window.applyHeaderTemplate) {
            window.applyHeaderTemplate('blank', { silent: true });
        }
        if (opts.footer) {
            var co = company();
            var foot = (co.name || 'Genius Raros') + '  ·  {PAGE} / {NUMPAGES}';
            if (meta && isGuidedReport(opts) && meta.version) {
                foot = (co.name || 'Genius Raros') + '  ·  Rev. ' + meta.version + '  ·  {PAGE} / {NUMPAGES}';
            }
            A().pageFooterText = foot;
            try { localStorage.setItem('abeneFooter', A().pageFooterText); } catch (e) {}
        }
        window._abeneChromeSig = '';
    }

    function ensureClientNifRow(editor, meta) {
        if (!editor) return;
        var nif = meta && meta.clientNif ? String(meta.clientNif) : '';
        editor.querySelectorAll('table.abene-tp-table').forEach(function (table) {
            if (table.querySelector('[data-abene-field="clientNif"]')) return;
            var clientTd = table.querySelector('[data-abene-field="client"]');
            if (!clientTd) return;
            var tr = clientTd.closest('tr');
            if (!tr || !tr.parentNode) return;
            var row = document.createElement('tr');
            row.innerHTML = '<th>' + esc(tt('mdlFieldClientNif') || tt('taxId') || 'NIF') + '</th><td data-abene-field="clientNif">' + esc(nif) + '</td>';
            tr.parentNode.insertBefore(row, tr.nextSibling);
        });
    }

    function applyMetaToDoc(meta) {
        var editor = ed();
        if (!editor || !meta) return;
        ensureClientNifRow(editor, meta);
        Object.keys(meta).forEach(function (k) {
            editor.querySelectorAll('[data-abene-field="' + k + '"]').forEach(function (el) {
                el.textContent = meta[k] == null ? '' : String(meta[k]);
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
        /* La carte Técnico / Inspeção doit produire le rapport guidé complet,
           pas seulement recolorer la capa. */
        if (style === 'tecnico') {
            window.applyModeloPreset('tech');
            return;
        }
        if (style === 'inspecao') {
            window.applyModeloPreset('inspection');
            return;
        }
        var o = readUi();
        o.style = style;
        if (style === 'carta') o.skeleton = 'letter';
        else if (o.skeleton === 'letter' || o.skeleton === 'minutes') o.skeleton = '';
        if (style !== 'tecnico' && style !== 'inspecao') {
            o.kind = '';
            if (o.skeleton === 'tech' || o.skeleton === 'inspection') o.skeleton = '';
        }
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
            applyHeaderFooter(o, defaultMeta(o));
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
        var replaceBody = !!opts.replaceBody;
        opts.replaceBody = false;
        saveOpts(opts);
        var meta = defaultMeta(opts);
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
        if (opts.cover) html += buildCover(opts, meta) + ((opts.titlepage || opts.toc) ? modelBreak() : '');
        if (opts.titlepage) html += buildTitlePage(opts, meta) + (opts.toc ? modelBreak() : '');
        if (opts.confidential) html += buildConfidential();
        if (opts.toc) html += buildTocPage();
        var hasFront = !!(opts.cover || opts.titlepage || opts.toc);
        if (hasFront && window.abeneSectionBreakHtml) html += window.abeneSectionBreakHtml('body');
        else if (opts.cover || opts.titlepage) html += modelBreak();
        if (opts.logo && !opts.header && !opts.cover) html += buildBodyLogo(opts);
        if (!replaceBody && keep && keep.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '').trim()) html += keep;
        else html += bodySkeleton(opts, meta);
        if (opts.signs) html += buildSigns(meta, opts);
        if (opts.annex) html += (window.abeneSectionBreakHtml ? window.abeneSectionBreakHtml('annex') : modelBreak()) + buildAnnex(opts);
        editor.innerHTML = html;
        enhanceCheckTables(editor);
        applyHeaderFooter(opts, meta);
        if (typeof window.applyReportSections === 'function') window.applyReportSections({ silent: true });
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
        if (kind === 'tech') {
            o.style = 'tecnico';
            o.cover = true;
            o.titlepage = true;
            o.toc = true;
            o.annex = true;
            o.confidential = false;
            o.signs = true;
            o.header = true;
            o.logo = true;
            o.footer = true;
            o.differentFirst = true;
            o.skeleton = 'tech';
            o.kind = 'tech';
            o.replaceBody = true;
        } else if (kind === 'inspection') {
            o.style = 'inspecao';
            o.cover = true;
            o.titlepage = true;
            o.toc = true;
            o.annex = true;
            o.confidential = false;
            o.signs = true;
            o.header = true;
            o.logo = true;
            o.footer = true;
            o.differentFirst = true;
            o.skeleton = 'inspection';
            o.kind = 'inspection';
            o.replaceBody = true;
        } else if (kind === 'letter') {
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

    function applyClientToMetaForm(c) {
        if (!c) return;
        function set(id, v) {
            var el = document.getElementById('mdlMeta_' + id);
            if (!el || v == null || v === '') return;
            el.value = String(v);
        }
        set('client', c.nom);
        set('clientNif', c.nif);
        var siteEl = document.getElementById('mdlMeta_site');
        var siteDef = tt('mdlSiteDef') || 'Obra / local';
        var siteNow = siteEl ? String(siteEl.value || '').trim() : '';
        if (siteEl && (!siteNow || siteNow === siteDef)) {
            var loc = [c.morada, [c.postal, c.localidade].filter(Boolean).join(' ')].filter(Boolean).join(', ');
            if (loc) siteEl.value = loc;
        }
    }

    window.editModeloMeta = function () {
        var m = defaultMeta(loadOpts());
        if (typeof openGenericModal !== 'function') return;
        var clients = typeof window.abeneCollectClients === 'function' ? window.abeneCollectClients() : [];
        function field(id, label, val) {
            return '<div class="form-group"><label for="mdlMeta_' + id + '">' + esc(label) + '</label>' +
                '<input id="mdlMeta_' + id + '" type="text" value="' + esc(val) + '"></div>';
        }
        var pick = clients.length
            ? '<div class="form-group modelo-meta-pick"><label for="mdlMeta_pick">' +
                esc(tt('mdlMetaPick') || tt('pickClient') || 'Escolher cliente') + '</label>' +
                '<p class="abene-proof-hint">' + esc(tt('mdlMetaPickHint') || tt('pickClientHint') ||
                    'Sheets, Excel ou Arquivo — o nome e o NIF passam para a capa.') + '</p>' +
                '<select id="mdlMeta_pick">' +
                '<option value="">' + esc(tt('mdlMetaPickNone') || '— Escolher cliente —') + '</option>' +
                clients.map(function (c, i) {
                    return '<option value="' + i + '">' + esc(c.nom) + (c.nif ? ' · ' + esc(c.nif) : '') + '</option>';
                }).join('') + '</select></div>'
            : '<p class="abene-proof-hint modelo-meta-pick">' + esc(tt('pickClientEmpty')) + '</p>';
        openGenericModal(tt('mdlMeta'),
            '<div class="modelo-meta-grid">' +
            field('work', tt('mdlFieldWork'), m.work) +
            pick +
            field('client', tt('mdlFieldClient'), m.client) +
            field('clientNif', tt('mdlFieldClientNif') || tt('taxId') || 'NIF', m.clientNif || '') +
            field('ref', tt('mdlFieldRef'), m.ref) +
            field('date', tt('mdlFieldDate'), m.date) +
            field('site', tt('mdlFieldSite'), m.site) +
            field('tech', tt('mdlFieldTech'), m.tech) +
            field('version', tt('mdlFieldVersion'), m.version) + '</div>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="saveModeloMeta()">' + esc(tt('ok')) + '</button>'
        );
        setTimeout(function () {
            var sel = document.getElementById('mdlMeta_pick');
            if (!sel) return;
            sel.onchange = function () {
                var c = clients[Number(sel.value)];
                if (c) applyClientToMetaForm(c);
            };
        }, 30);
    };

    window.saveModeloMeta = function () {
        function val(id) {
            var el = document.getElementById('mdlMeta_' + id);
            return el ? el.value : '';
        }
        var prev = window._abeneModeloMeta || {};
        var meta = {
            work: val('work'),
            ref: val('ref'),
            date: val('date'),
            client: val('client'),
            clientNif: val('clientNif'),
            site: val('site'),
            tech: val('tech'),
            version: val('version'),
            inspType: prev.inspType || '',
            norm: prev.norm || '',
            fraction: prev.fraction || ''
        };
        window._abeneModeloMeta = meta;
        applyMetaToDoc(meta);
        syncHeaderFields(loadOpts(), meta);
        window._abeneChromeSig = '';
        if (typeof renderPageDecorations === 'function') renderPageDecorations();
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

    function wrapLoadTemplate() {
        var orig = window.loadTemplate;
        if (typeof orig !== 'function' || orig._abeneTech) return;
        var wrapped = function (type) {
            if (type === 'rapport') {
                try { if (typeof saveDocument === 'function') saveDocument({ silent: true }); } catch (eSave) {}
                if (typeof closeModal === 'function') closeModal('templatesModal');
                window.applyModeloPreset('tech');
                if (typeof renameDocument === 'function') renameDocument(tt('tplReport') || 'Relatório');
                return;
            }
            return orig.apply(this, arguments);
        };
        wrapped._abeneTech = true;
        window.loadTemplate = wrapped;
    }
    wrapLoadTemplate();

    function enhanceCheckTables(root) {
        root = root || ed();
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('table.abene-check-table').forEach(function (table) {
            if (!table.closest('.abene-check-wrap')) {
                var wrap = document.createElement('div');
                wrap.className = 'abene-check-wrap';
                wrap.setAttribute('data-abene-check', '1');
                table.parentNode.insertBefore(wrap, table);
                wrap.appendChild(table);
                var bar = document.createElement('p');
                bar.className = 'abene-check-toolbar';
                bar.contentEditable = 'false';
                bar.innerHTML = '<button type="button" class="abene-check-add">' + esc(tt('mdlCheckAdd') || 'Adicionar linha') + '</button>';
                wrap.appendChild(bar);
            }
            table.setAttribute('data-abene-live', '1');
            Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function (tr) {
                var td = tr.cells[1];
                if (!td) return;
                if (td.querySelector('.abene-check-btn')) {
                    var on = td.querySelector('.abene-check-btn.on');
                    if (on) tr.setAttribute('data-check-result', on.getAttribute('data-check-val') || 'ok');
                    if (!td.querySelector('.abene-check-del')) {
                        var box = td.querySelector('.abene-check-btns');
                        if (box) box.insertAdjacentHTML('beforeend',
                            '<button type="button" class="abene-check-del" title="' + esc(tt('mdlCheckDel') || 'Remover linha') +
                            '" contenteditable="false">−</button>');
                    }
                    return;
                }
                var key = resultKey(td.textContent);
                tr.setAttribute('data-check-result', key);
                td.classList.add('abene-check-result');
                td.contentEditable = 'false';
                td.innerHTML = checkBtns(key);
                if (tr.cells[0]) tr.cells[0].classList.add('abene-check-item');
                if (tr.cells[2]) tr.cells[2].classList.add('abene-check-notes');
            });
        });
    }
    function bindChecklists() {
        if (bindChecklists._on) return;
        bindChecklists._on = true;
        document.addEventListener('focusin', function (ev) {
            var editor = ed();
            if (editor && ev.target && editor.contains(ev.target)) enhanceCheckTables(editor);
        });
        document.addEventListener('mousedown', function (ev) {
            var t = ev.target && ev.target.closest && ev.target.closest('.abene-check-btn, .abene-check-add, .abene-check-del');
            if (t) ev.preventDefault();
        }, true);
        document.addEventListener('click', function (ev) {
            var t = ev.target;
            if (!t || !t.closest) return;
            var add = t.closest('.abene-check-add');
            var del = t.closest('.abene-check-del');
            var btn = t.closest('.abene-check-btn');
            if (!add && !del && !btn) return;
            var editor = ed();
            if (!editor || !editor.contains(t)) return;
            ev.preventDefault();
            ev.stopPropagation();
            if (typeof saveUndoState === 'function') saveUndoState();
            if (add) {
                var wrap = add.closest('.abene-check-wrap');
                var table = wrap && wrap.querySelector('.abene-check-table');
                if (!table) return;
                var tb = table.tBodies[0] || table.createTBody();
                tb.insertAdjacentHTML('beforeend', checkRowHtml(tt('mdlCheckNew') || 'Novo item', 'na', ''));
            } else if (del) {
                var tr = del.closest('tr');
                var body = tr && tr.parentNode;
                if (!tr || !body) return;
                if (body.querySelectorAll('tr').length < 2) return;
                body.removeChild(tr);
            } else if (btn) {
                var row = btn.closest('tr');
                var val = btn.getAttribute('data-check-val') || 'ok';
                if (!row) return;
                row.setAttribute('data-check-result', val);
                row.querySelectorAll('.abene-check-btn').forEach(function (b) {
                    b.classList.toggle('on', b.getAttribute('data-check-val') === val);
                });
            }
            if (A().documentState) A().documentState.dirty = true;
            if (typeof updateSaveStatus === 'function') updateSaveStatus();
            if (typeof refreshPagination === 'function') refreshPagination();
        });
    }
    window.abeneEnhanceCheckTables = enhanceCheckTables;

    document.addEventListener('DOMContentLoaded', function () {
        writeUi(loadOpts());
        wrapLoadTemplate();
        bindChecklists();
        enhanceCheckTables();
        setTimeout(enhanceCheckTables, 600);
    });
    bindChecklists();
})();
