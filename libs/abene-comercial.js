/* Genius Raros — orçamento / recibo comercial (estrutura Portugal, emitente Genius Raros).
   Os papéis gerados ficam sempre em português. FR / ES / EN traduzem só a interface. */
(function () {
    var NAVY = '#0B1223';
    var GOLD = '#C9A84C';
    var previewState = null;

    function ed() {
        return (window.abene && window.abene.editor) || document.getElementById('editor');
    }
    function company() {
        return (window.abene && window.abene.companyData) || {};
    }
    function lang() {
        return localStorage.getItem('abeneLanguage') || 'pt-PT';
    }
    function dt(key, vars) {
        var dict = (window.abeneI18n && window.abeneI18n['pt-PT']) || {};
        var s = dict[key] || (typeof t === 'function' ? t(key) : key);
        if (vars) Object.keys(vars).forEach(function (k) {
            s = String(s).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
        });
        return s;
    }
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function money(amount) {
        var cur = company().currency || 'EUR';
        try {
            return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: cur }).format(Number(amount) || 0);
        } catch (e) {
            return (Number(amount) || 0).toFixed(2).replace('.', ',') + ' €';
        }
    }
    function formatDate(iso) {
        var d = iso ? new Date(iso) : new Date();
        if (isNaN(d.getTime())) d = new Date();
        return d.toLocaleDateString('pt-PT');
    }
    function nextNumber(prefix, storageKey, consume) {
        var year = new Date().getFullYear();
        var data = { year: year, n: 0 };
        try { data = Object.assign(data, JSON.parse(localStorage.getItem(storageKey) || '{}')); } catch (e) {}
        if (data.year !== year) { data.year = year; data.n = 0; }
        var n = (Number(data.n) || 0) + 1;
        if (consume) {
            data.n = n;
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
        return prefix + '-' + year + '-' + String(n).padStart(4, '0');
    }
    function editorHasContent() {
        var editor = ed();
        if (!editor) return false;
        if (editor.querySelector('[data-abene-block], table, img, h1, h2')) return true;
        var text = (editor.innerText || '').replace(/\u00a0/g, ' ').trim();
        if (!text) return false;
        if (/Comece a escrever|Commencez à|Start typing|Empiece a escribir/.test(text) && text.length < 90) return false;
        return text.length > 30;
    }
    function finishInsert() {
        relabelWorkSite();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof updateStats === 'function') updateStats();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (typeof updateNavigation === 'function') updateNavigation();
        if (window.abene && window.abene.documentState) window.abene.documentState.dirty = true;
        if (typeof updateSaveStatus === 'function') updateSaveStatus();
    }
    function revealPaperInEditor(kind) {
        var editor = ed();
        var block = editor && editor.querySelector('[data-abene-block="' + kind + '"]');
        if (!block) return null;
        try {
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            if (block.scrollIntoView) block.scrollIntoView(true);
        }
        block.classList.add('abene-paper-flash');
        setTimeout(function () {
            var still = ed() && ed().querySelector('[data-abene-block="' + kind + '"]');
            if (still) still.classList.remove('abene-paper-flash');
        }, 1800);
        return block;
    }
    function composeDocument(kind, html, mode) {
        var editor = ed();
        if (!editor) return;
        var existing = editor.querySelector('[data-abene-block="' + kind + '"]');
        if (existing && mode !== 'replace-doc') {
            existing.outerHTML = html;
            finishInsert();
            return;
        }
        var replaceDoc = mode === 'replace-doc' || !editorHasContent();
        if (replaceDoc) {
            editor.innerHTML = html;
        } else {
            editor.insertAdjacentHTML('beforeend',
                '<div class="page-break-marker" contenteditable="false" aria-label="Quebra de página"></div>' + html);
        }
        finishInsert();
    }
    function chosenMode(radioName) {
        var picked = document.querySelector('input[name="' + radioName + '"]:checked');
        return (picked && picked.value) || 'append';
    }
    function paperStatusOf(el) {
        return (el && el.getAttribute('data-abene-status')) || 'final';
    }
    function assignNumber(data, prefix, storageKey, kind, radioName, consume) {
        if (consume == null) consume = true;
        var editor = ed();
        var existing = editor && editor.querySelector('[data-abene-block="' + kind + '"]');
        var mode = chosenMode(radioName);
        var current = String(data.number || '').trim();
        var existingStatus = paperStatusOf(existing);
        var keeping = existing && mode !== 'replace-doc' && current && existing.getAttribute('data-abene-number') === current;
        if (keeping && existingStatus === 'final') return current;
        if (!consume) return current || nextNumber(prefix, storageKey, false);
        if (!current) return nextNumber(prefix, storageKey, true);
        nextNumber(prefix, storageKey, true);
        return current;
    }
    function ui(key, fallback) {
        if (typeof t === 'function') {
            var v = t(key);
            if (v && v !== key) return v;
        }
        return fallback || key;
    }
    function toastMsg(key, fallback) {
        var msg = ui(key, fallback);
        if (typeof showToast === 'function') showToast(msg);
        else alert(msg);
    }
    function todayIso() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + m + '-' + day;
    }
    function paperKicker(status) {
        if (status === 'draft') return 'Rascunho comercial';
        if (status === 'preview') return 'Pré-visualização';
        return 'Documento comercial';
    }
    function statusChrome(status) {
        if (status === 'final') {
            return '<div class="abene-status-banner abene-status-final" contenteditable="false">VERSÃO DEFINITIVA — papel comercial (não constitui fatura AT)</div>';
        }
        var label = status === 'preview' ? 'PRÉ-VISUALIZAÇÃO' : 'RASCUNHO';
        var note = status === 'preview'
            ? 'Pré-visualização — ainda não gravado no documento.'
            : 'Rascunho — não constitui versão definitiva.';
        return '<div class="abene-status-banner abene-status-draft" contenteditable="false">' + label + ' — ' + note + '</div>' +
            '<div class="abene-wm" contenteditable="false" aria-hidden="true">' + label + '</div>';
    }
    function partyBox(label, innerHtml) {
        return '<div class="gr-party">' +
            '<div class="gr-party-label">' + esc(label) + '</div>' +
            '<div class="gr-party-body">' + innerHtml + '</div></div>';
    }
    function kvTable(rows) {
        if (!rows || !rows.length) return '';
        return '<table class="gr-kv">' + rows.map(function (row) {
            return '<tr><th>' + esc(row[0]) + '</th><td>' + row[1] + '</td></tr>';
        }).join('') + '</table>';
    }
    function emitenteHtml() {
        var co = company();
        var bits = ['<strong>' + esc(co.name || 'Genius Raros') + '</strong>'];
        if (co.legalForm) bits.push(esc(co.legalForm));
        if (co.nif) bits.push('NIF ' + esc(co.nif));
        if (co.cae) bits.push('CAE ' + esc(co.cae));
        if (co.address) bits.push(esc(co.address));
        var loc = [co.postal, co.localidade].filter(Boolean);
        if (loc.length) bits.push(esc(loc.join(' ')));
        if (co.phone) bits.push(esc(co.phone));
        if (co.email) bits.push(esc(co.email));
        return bits.join('<br/>');
    }
    function dualRule() {
        return '<div class="gr-goldbar gr-rules" contenteditable="false" aria-hidden="true">' +
            '<span class="gr-rule-navy"></span><span class="gr-rule-gold"></span></div>';
    }
    function decodePayload(el) {
        if (!el) return null;
        var b64 = el.getAttribute('data-abene-payload');
        if (!b64) return null;
        try {
            return JSON.parse(decodeURIComponent(escape(atob(b64))));
        } catch (e) {
            try { return JSON.parse(atob(b64)); } catch (e2) { return null; }
        }
    }
    function setField(id, value) {
        var el = document.getElementById(id);
        if (!el || value == null) return;
        if (el.type === 'checkbox') el.checked = !!value;
        else el.value = value;
    }
    function setIfEmpty(id, value) {
        var el = document.getElementById(id);
        if (!el || value == null || value === '') return;
        if (el.type === 'checkbox') return;
        if (String(el.value || '').trim()) return;
        el.value = value;
    }
    function loadLastJob() {
        if (window.abeneArquivoApi && typeof window.abeneArquivoApi.lastJob === 'function') {
            return window.abeneArquivoApi.lastJob() || {};
        }
        try {
            var raw = JSON.parse(localStorage.getItem('abeneLastJobV1') || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch (e) { return {}; }
    }
    function rememberLastJob(data, kind) {
        if (!data) return;
        var job = {};
        if (kind === 'devis') {
            job.client = data.client || '';
            job.nif = data.clientNif || '';
            job.address = data.clientAddress || '';
            job.postal = data.clientPostal || '';
            job.localidade = data.clientLocalidade || '';
            job.email = data.clientEmail || '';
            job.phone = data.clientPhone || '';
            job.contact = data.clientContact || '';
            if (data.site) { job.site = data.site; job.pasta = data.site; }
        } else {
            job.client = data.payerName || '';
            job.nif = data.payerNif || '';
            job.address = data.payerAddress || '';
            job.postal = data.payerPostal || '';
            job.localidade = data.payerLocalidade || '';
            job.email = data.payerEmail || '';
        }
        if (window.abeneArquivoApi && typeof window.abeneArquivoApi.saveLastJob === 'function') {
            window.abeneArquivoApi.saveLastJob(job);
            return;
        }
        try {
            var prev = loadLastJob();
            localStorage.setItem('abeneLastJobV1', JSON.stringify(Object.assign({}, prev, job)));
        } catch (e) {}
    }
    function persistLocal() {
        try {
            var html = typeof persistableEditorHtml === 'function'
                ? persistableEditorHtml()
                : (ed() && ed().innerHTML);
            if (html) {
                localStorage.setItem('docContent', html);
                localStorage.setItem('abeneAutosave', html);
            }
        } catch (e) {}
    }
    function letterhead(title, metaRows, kicker) {
        var co = company();
        var icon = co.iconUrl || 'branding/icon_48.svg';
        var name = co.name || 'Genius Raros';
        var slogan = co.slogan || 'Canalização. Construção. Pesquisa.';
        var lines = [];
        if (co.legalForm) lines.push(esc(co.legalForm));
        if (co.nif) lines.push('NIF ' + esc(co.nif));
        if (co.address) lines.push(esc(co.address));
        var contact = [co.phone, co.email, co.website].filter(Boolean).map(esc);
        if (contact.length) lines.push(contact.join(' · '));
        var meta = (metaRows || []).map(function (row) {
            return '<tr><th>' + esc(row[0]) + '</th><td>' + esc(row[1]) + '</td></tr>';
        }).join('');
        var kick = kicker || 'Genius Raros';
        return '<table class="gr-letterhead" data-abene-keep="1">' +
            '<tr>' +
            '<td class="gr-lh-brand">' +
            '<div class="gr-brand-row">' +
            '<img class="gr-brand-mark" src="' + esc(icon) + '" alt="' + esc(name) + '" width="54" height="54" />' +
            '<div class="gr-brand-text">' +
            '<p class="gr-co-name">' + esc(name) + '</p>' +
            (slogan ? '<p class="gr-slogan">' + esc(slogan) + '</p>' : '') +
            '</div></div>' +
            (lines.length ? '<p class="gr-co-meta">' + lines.join('<br/>') + '</p>' : '') +
            '</td>' +
            '<td class="gr-lh-doc">' +
            '<p class="gr-doc-kicker">' + esc(kick) + '</p>' +
            '<h2 class="gr-doc-title">' + esc(title) + '</h2>' +
            (meta ? '<table class="gr-meta">' + meta + '</table>' : '') +
            '</td></tr></table>' +
            dualRule();
    }
    function brandFooter(withLegal) {
        var co = company();
        var line = [co.name || 'Genius Raros', co.legalForm, co.address, co.nif ? 'NIF ' + co.nif : '', co.slogan]
            .filter(Boolean).join(' · ');
        var extra = withLegal
            ? '<br/>Este documento não constitui fatura nem substitui a faturação certificada (software certificado / Portal das Finanças).'
            : '';
        return '<p class="gr-doc-foot">' + esc(line) + extra + '</p>';
    }
    function legalFooter() {
        return brandFooter(true);
    }
    function ivaMention(rate, regime) {
        var co = company();
        regime = regime || co.vatRegime || 'normal';
        if (regime === 'autoliquidacao') {
            return 'IVA — autoliquidação (art.º 2.º n.º 1 al. j) do CIVA). O adquirente liquida o IVA. Motivo de isenção SAF-T: M21.';
        }
        if (regime === 'art53') return 'IVA — regime de isenção, art.º 53.º do CIVA (motivo M10).';
        if (regime === 'art9') return 'IVA — Isento art.º 9.º do CIVA (motivo M07).';
        if (Number(rate) === 0) return 'IVA — isento (indicar o motivo na fatura certificada).';
        return '';
    }

    function payloadAttr(data) {
        try {
            var json = JSON.stringify(data);
            var b64 = btoa(unescape(encodeURIComponent(json)));
            return ' data-abene-payload="' + b64 + '"';
        } catch (e) { return ''; }
    }
    function collectQuote() {
        var rows = document.querySelectorAll('#devisItems .devis-item-row');
        var items = [];
        var subtotal = 0;
        rows.forEach(function (row) {
            var desc = (row.querySelector('.item-desc') || {}).value || '';
            var unit = (row.querySelector('.item-unit') || {}).value || 'un';
            var qty = parseFloat((row.querySelector('.item-qty') || {}).value) || 0;
            var price = parseFloat((row.querySelector('.item-price') || {}).value) || 0;
            var lineVat = parseFloat((row.querySelector('.item-vat') || {}).value);
            var total = qty * price;
            subtotal += total;
            items.push({ desc: desc, unit: unit, qty: qty, price: price, vat: isNaN(lineVat) ? null : lineVat, total: total });
        });
        var ivaRegime = ((document.getElementById('devisIvaRegime') || {}).value) || 'normal';
        var tva = parseFloat(document.getElementById('devisTVA').value) || 0;
        if (ivaRegime === 'autoliquidacao' || ivaRegime === 'art9' || ivaRegime === 'art53') {
            tva = 0;
            items.forEach(function (it) { it.vat = 0; });
        }
        var discount = parseFloat(document.getElementById('devisDiscount').value) || 0;
        var discountAmount = subtotal * (discount / 100);
        var after = subtotal - discountAmount;
        var ratio = subtotal > 0 ? after / subtotal : 1;
        var tvaAmount = 0;
        var vatGroups = {};
        items.forEach(function (item) {
            var rate = item.vat != null ? item.vat : tva;
            var base = item.total * ratio;
            var iva = base * (rate / 100);
            tvaAmount += iva;
            if (!vatGroups[rate]) vatGroups[rate] = { base: 0, iva: 0 };
            vatGroups[rate].base += base;
            vatGroups[rate].iva += iva;
        });
        return {
            client: document.getElementById('devisClient').value,
            clientAddress: document.getElementById('devisClientAddress').value,
            clientEmail: document.getElementById('devisClientEmail').value,
            clientPhone: document.getElementById('devisClientPhone').value,
            clientNif: (document.getElementById('devisClientNif') || {}).value || '',
            clientPostal: (document.getElementById('devisClientPostal') || {}).value || '',
            clientLocalidade: (document.getElementById('devisClientLocalidade') || {}).value || '',
            clientContact: (document.getElementById('devisClientContact') || {}).value || '',
            site: (document.getElementById('devisSite') || {}).value || '',
            payTerms: (document.getElementById('devisPayTerms') || {}).value || '',
            number: (document.getElementById('devisNumber').value || '').trim(),
            date: document.getElementById('devisDate').value || todayIso(),
            validity: parseInt(document.getElementById('devisValidity').value, 10) || 30,
            object: (document.getElementById('devisObject') || {}).value || '',
            tva: tva,
            ivaRegime: ivaRegime,
            consumerFinal: !!(document.getElementById('devisConsumerFinal') && document.getElementById('devisConsumerFinal').checked),
            discount: discount,
            notes: document.getElementById('devisNotes').value,
            items: items,
            subtotal: subtotal,
            discountAmount: discountAmount,
            after: after,
            tvaAmount: tvaAmount,
            vatGroups: vatGroups,
            grand: after + tvaAmount
        };
    }

    function vatRowsHtml(data) {
        var groups = data.vatGroups || {};
        var keys = Object.keys(groups);
        if (!keys.length) {
            return '<tr><td>IVA (' + data.tva + '%)</td><td class="c-eur">' + money(data.tvaAmount) + '</td></tr>';
        }
        return keys.sort(function (a, b) { return Number(b) - Number(a); }).map(function (rate) {
            var g = groups[rate];
            return '<tr><td>IVA ' + rate + '% (base ' + money(g.base) + ')</td><td class="c-eur">' + money(g.iva) + '</td></tr>';
        }).join('');
    }

    function buildQuoteHTML(data, opts) {
        opts = opts || {};
        var status = opts.status || 'final';
        var expiry = new Date(data.date || new Date());
        if (isNaN(expiry.getTime())) expiry = new Date();
        expiry.setDate(expiry.getDate() + (Number(data.validity) || 30));
        var itemsHTML = (data.items || []).map(function (item, i) {
            var lineVat = item.vat != null ? item.vat : data.tva;
            return '<tr>' +
                '<td class="c-n">' + (i + 1) + '</td>' +
                '<td class="c-desc">' + esc(item.desc) + '</td>' +
                '<td class="c-un">' + esc(item.unit) + '</td>' +
                '<td class="c-qty">' + item.qty + '</td>' +
                '<td class="c-eur">' + money(item.price) + '</td>' +
                '<td class="c-iva">' + (lineVat == null ? '—' : lineVat) + '%</td>' +
                '<td class="c-eur">' + money(item.total) + '</td>' +
                '</tr>';
        }).join('');
        var clientBits = ['<strong>' + esc(data.client) + '</strong>'];
        if (data.clientNif) clientBits.push('NIF ' + esc(data.clientNif));
        if (data.consumerFinal) clientBits.push('Consumidor final');
        if (data.clientContact) clientBits.push(esc(data.clientContact));
        if (data.clientAddress) clientBits.push(esc(data.clientAddress));
        if (data.clientPostal || data.clientLocalidade) {
            clientBits.push([data.clientPostal, data.clientLocalidade].filter(Boolean).join(' '));
        }
        if (data.clientEmail) clientBits.push(esc(data.clientEmail));
        if (data.clientPhone) clientBits.push(esc(data.clientPhone));
        var co = company();
        var pay = [];
        if (co.iban) pay.push('IBAN: ' + esc(co.iban));
        if (co.bic) pay.push('BIC: ' + esc(co.bic));
        var ivaNote = ivaMention(data.tva, data.ivaRegime);
        var factRows = [];
        if (data.object) factRows.push(['Objeto', esc(data.object)]);
        if (data.site) factRows.push(['Local da obra/Serviço', esc(data.site)]);
        if (data.payTerms) factRows.push(['Prazo de pagamento', esc(data.payTerms)]);
        var linkReport = editorHasContent()
            ? '<p class="gr-iva-note">O relatório precedente faz parte integrante deste orçamento.</p>'
            : '';
        return '<div class="devis-container' + (status === 'final' ? ' abene-paper-locked' : ' abene-not-final') + '" data-abene-block="devis" data-abene-status="' + esc(status) + '" contenteditable="' + (status === 'final' ? 'false' : 'true') + '" data-abene-number="' + esc(data.number) + '" data-abene-total="' + data.grand + '" data-abene-client="' + esc(data.client) + '" data-abene-nif="' + esc(data.clientNif || '') + '" data-abene-date="' + esc(data.date || '') + '" data-abene-vat="' + esc(String(data.tva || 0)) + '"' + payloadAttr({
            kind: 'orcamento',
            status: status,
            number: data.number,
            date: data.date,
            validity: data.validity,
            client: data.client,
            clientNif: data.clientNif,
            clientAddress: data.clientAddress,
            clientPostal: data.clientPostal,
            clientLocalidade: data.clientLocalidade,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone,
            clientContact: data.clientContact,
            consumerFinal: data.consumerFinal,
            tva: data.tva,
            ivaRegime: data.ivaRegime,
            discount: data.discount,
            items: data.items,
            subtotal: data.subtotal,
            discountAmount: data.discountAmount,
            after: data.after,
            tvaAmount: data.tvaAmount,
            vatGroups: data.vatGroups,
            grand: data.grand,
            object: data.object,
            site: data.site,
            payTerms: data.payTerms,
            notes: data.notes
        }) + ' style="font-family:Calibri,Segoe UI,sans-serif;color:#0b1223;position:relative;">' +
            statusChrome(status) +
            letterhead('ORÇAMENTO', [
                ['N.º', data.number],
                ['Data', formatDate(data.date)],
                ['Válido até', expiry.toLocaleDateString('pt-PT')]
            ], paperKicker(status)) +
            '<table class="gr-parties"><tr>' +
            '<td class="gr-party-cell">' + partyBox('Emitente', emitenteHtml()) + '</td>' +
            '<td class="gr-party-gap"></td>' +
            '<td class="gr-party-cell">' + partyBox('Destinatário', clientBits.join('<br/>')) + '</td>' +
            '</tr></table>' +
            linkReport + kvTable(factRows) +
            '<p class="gr-section-label">Artigos / Prestações</p>' +
            '<table class="gr-items devis-items-table">' +
            '<colgroup>' +
            '<col class="gr-col-n"><col class="gr-col-desc"><col class="gr-col-un"><col class="gr-col-qty">' +
            '<col class="gr-col-price"><col class="gr-col-iva"><col class="gr-col-total">' +
            '</colgroup>' +
            '<thead><tr>' +
            '<th class="c-n">#</th>' +
            '<th>Descrição</th>' +
            '<th class="c-un">Un.</th>' +
            '<th class="c-qty">Qtd</th>' +
            '<th class="c-eur">Preço unit. s/ IVA</th>' +
            '<th class="c-iva">IVA %</th>' +
            '<th class="c-eur">Total s/ IVA</th>' +
            '</tr></thead><tbody>' + itemsHTML + '</tbody></table>' +
            '<div class="gr-totals-wrap"><table class="gr-totals">' +
            '<tr><td>Subtotal s/ IVA</td><td class="c-eur">' + money(data.subtotal) + '</td></tr>' +
            (data.discount > 0 ? '<tr class="gr-tot-disc"><td>Desconto (' + data.discount + '%)</td><td class="c-eur">− ' + money(data.discountAmount) + '</td></tr>' : '') +
            vatRowsHtml(data) +
            '<tr class="gr-tot-grand"><td>Total c/ IVA</td><td class="c-eur">' + money(data.grand) + '</td></tr>' +
            '</table></div>' +
            (ivaNote ? '<p class="gr-iva-note">' + ivaNote + '</p>' : '') +
            (pay.length ? '<div class="gr-pay"><strong>Pagamento</strong><br/>' + pay.join(' · ') + '</div>' : '') +
            (data.notes ? '<div class="gr-note"><strong>Condições</strong><br/>' + esc(data.notes).replace(/\n/g, '<br/>') + '</div>' : '') +
            '<div class="gr-sign-block abene-keep-together">' +
            '<table class="gr-signs"><tr>' +
            '<td><div class="gr-sign-line">Assinatura do emitente</div></td>' +
            '<td class="gr-sign-gap"></td>' +
            '<td><p class="gr-sign-hint">Bom para acordo (data e assinatura)</p><div class="gr-sign-line">Assinatura do cliente</div></td>' +
            '</tr></table>' +
            legalFooter() +
            '</div>' +
            '</div>';
    }

    function collectReceipt() {
        return {
            payerName: document.getElementById('receiptPayerName').value,
            payerAddress: document.getElementById('receiptPayerAddress').value,
            payerNif: (document.getElementById('receiptPayerNif') || {}).value || '',
            payerPostal: (document.getElementById('receiptPayerPostal') || {}).value || '',
            payerLocalidade: (document.getElementById('receiptPayerLocalidade') || {}).value || '',
            payerEmail: (document.getElementById('receiptPayerEmail') || {}).value || '',
            vatRate: parseFloat((document.getElementById('receiptVatRate') || {}).value) || 0,
            number: (document.getElementById('receiptNumber').value || '').trim(),
            date: document.getElementById('receiptDate').value || todayIso(),
            object: document.getElementById('receiptObject').value,
            amount: parseFloat(document.getElementById('receiptAmount').value) || 0,
            payMethod: document.getElementById('receiptPayMethod').value,
            payRef: document.getElementById('receiptPayRef').value,
            notes: document.getElementById('receiptNotes').value,
            quoteRef: (document.getElementById('receiptQuoteRef') || {}).value || '',
            partial: !!(document.getElementById('receiptPartial') && document.getElementById('receiptPartial').checked)
        };
    }

    function buildReceiptHTML(data, opts) {
        opts = opts || {};
        var status = opts.status || 'final';
        var words = (typeof numberToPortugueseWords === 'function')
            ? numberToPortugueseWords(data.amount)
            : money(data.amount);
        var payer = ['<strong>' + esc(data.payerName) + '</strong>'];
        if (data.payerNif) payer.push('NIF ' + esc(data.payerNif));
        if (data.payerAddress) payer.push(esc(data.payerAddress));
        if (data.payerPostal || data.payerLocalidade) {
            payer.push([data.payerPostal, data.payerLocalidade].filter(Boolean).join(' '));
        }
        if (data.payerEmail) payer.push(esc(data.payerEmail));
        return '<div class="receipt-container' + (status === 'final' ? ' abene-paper-locked' : ' abene-not-final') + '" data-abene-block="receipt" data-abene-status="' + esc(status) + '" contenteditable="' + (status === 'final' ? 'false' : 'true') + '" data-abene-number="' + esc(data.number) + '" data-abene-total="' + data.amount + '" data-abene-client="' + esc(data.payerName) + '" data-abene-nif="' + esc(data.payerNif || '') + '" data-abene-date="' + esc(data.date || '') + '"' + payloadAttr({
            kind: 'recibo',
            status: status,
            number: data.number,
            date: data.date,
            payerName: data.payerName,
            payerNif: data.payerNif,
            payerAddress: data.payerAddress,
            payerPostal: data.payerPostal,
            payerLocalidade: data.payerLocalidade,
            payerEmail: data.payerEmail,
            amount: data.amount,
            vatRate: data.vatRate,
            payMethod: data.payMethod,
            payRef: data.payRef,
            quoteRef: data.quoteRef,
            object: data.object,
            notes: data.notes,
            partial: data.partial
        }) + ' style="font-family:Calibri,Segoe UI,sans-serif;color:#0b1223;position:relative;">' +
            statusChrome(status) +
            letterhead('RECIBO COMERCIAL', [
                ['N.º', data.number],
                ['Data', formatDate(data.date)],
                ['Estado', data.partial ? 'Pagamento parcial' : 'PAGO']
            ], paperKicker(status)) +
            '<div class="gr-note">Este recibo comercial é um comprovativo de pagamento entre as partes. Não substitui fatura nem recibo emitido por software certificado ou pelo Portal das Finanças.</div>' +
            '<table class="gr-parties" style="margin-top:16px;"><tr>' +
            '<td class="gr-party-cell">' + partyBox('Emitente', emitenteHtml()) + '</td>' +
            '<td class="gr-party-gap"></td>' +
            '<td class="gr-party-cell">' + partyBox('Recebido de', payer.join('<br/>')) + '</td>' +
            '</tr></table>' +
            '<div class="gr-amount-box">' +
            '<p class="gr-amount-label">A importância de</p>' +
            '<p class="gr-amount">' + money(data.amount) + '</p>' +
            '<p class="gr-amount-words">(' + esc(words) + ')</p>' +
            '</div>' +
            kvTable([
                ['Objeto', esc(data.object)]
            ].concat(data.quoteRef ? [['Orçamento n.º', esc(data.quoteRef)]] : [])
                .concat([['Modo de pagamento', esc(data.payMethod)]])
                .concat(data.payRef ? [['Referência', esc(data.payRef)]] : [])
                .concat([['Data do pagamento', formatDate(data.date)]])) +
            (data.notes ? '<div class="gr-note"><strong>Notas</strong><br/>' + esc(data.notes).replace(/\n/g, '<br/>') + '</div>' : '') +
            '<div class="gr-sign-block abene-keep-together">' +
            '<table class="gr-signs"><tr>' +
            '<td><span class="gr-stamp">' + (data.partial ? 'PARCIAL' : 'LIQUIDADO') + '</span></td>' +
            '<td class="gr-sign-gap"></td>' +
            '<td><p class="gr-sign-hint">Carimbo e assinatura</p><div class="gr-sign-line">' + esc(company().name || 'Genius Raros') + '</div></td>' +
            '</tr></table>' +
            legalFooter() +
            '</div>' +
            '</div>';
    }

    function prefillFromDocument(kind) {
        var editor = ed();
        if (!editor) return;
        var h1 = editor.querySelector('h1');
        var title = (window.abene && window.abene.documentState && window.abene.documentState.name) || '';
        var object = (h1 && h1.textContent.trim()) || title;
        var job = loadLastJob();
        if (kind === 'devis') {
            var obj = document.getElementById('devisObject');
            if (obj && !obj.value && object && object !== 'Documento1') obj.value = object;
            setIfEmpty('devisClient', job.client);
            setIfEmpty('devisClientNif', job.nif);
            setIfEmpty('devisClientAddress', job.address);
            setIfEmpty('devisClientPostal', job.postal);
            setIfEmpty('devisClientLocalidade', job.localidade);
            setIfEmpty('devisClientEmail', job.email);
            setIfEmpty('devisClientPhone', job.phone);
            setIfEmpty('devisClientContact', job.contact);
            setIfEmpty('devisSite', job.site || job.pasta);
            return;
        }
        var devis = editor.querySelector('[data-abene-block="devis"]');
        if (devis) {
            var pay = decodePayload(devis) || {};
            var qn = document.getElementById('receiptQuoteRef');
            if (qn) qn.value = devis.getAttribute('data-abene-number') || pay.number || '';
            var amt = document.getElementById('receiptAmount');
            if (amt && (devis.getAttribute('data-abene-total') || pay.grand)) {
                amt.value = Number(devis.getAttribute('data-abene-total') || pay.grand || 0).toFixed(2);
            }
            setIfEmpty('receiptPayerName', devis.getAttribute('data-abene-client') || pay.client);
            setIfEmpty('receiptPayerNif', devis.getAttribute('data-abene-nif') || pay.clientNif);
            setIfEmpty('receiptPayerAddress', pay.clientAddress);
            setIfEmpty('receiptPayerPostal', pay.clientPostal);
            setIfEmpty('receiptPayerLocalidade', pay.clientLocalidade);
            setIfEmpty('receiptPayerEmail', pay.clientEmail);
            var recObj = document.getElementById('receiptObject');
            if (recObj && !recObj.value) recObj.value = 'Pagamento referente ao orçamento ' + (devis.getAttribute('data-abene-number') || pay.number || '');
        } else if (object) {
            var recObj2 = document.getElementById('receiptObject');
            if (recObj2 && !recObj2.value) recObj2.value = object;
            setIfEmpty('receiptPayerName', job.client);
            setIfEmpty('receiptPayerNif', job.nif);
            setIfEmpty('receiptPayerAddress', job.address);
            setIfEmpty('receiptPayerPostal', job.postal);
            setIfEmpty('receiptPayerLocalidade', job.localidade);
            setIfEmpty('receiptPayerEmail', job.email);
        }
    }

    function rebuildQuoteItems(items) {
        var container = document.getElementById('devisItems');
        if (!container || !items || !items.length) return;
        var vat = (company().vatRate != null ? company().vatRate : 23);
        var labelDesc = ui('description', 'Descrição');
        var labelQty = ui('qty', 'Qtd');
        var labelPrice = ui('unitPrice', 'Preço unit.');
        container.innerHTML = '';
        items.forEach(function (it) {
            var row = document.createElement('div');
            row.className = 'form-row devis-item-row';
            row.style.alignItems = 'end';
            var lineVat = it.vat != null ? it.vat : vat;
            row.innerHTML =
                '<div class="form-group" style="flex:3;"><label>' + labelDesc + '</label><input type="text" class="item-desc" list="abeneArticleList" value="' + esc(it.desc || '') + '"></div>' +
                '<div class="form-group" style="flex:0.7;"><label>Un.</label><input type="text" class="item-unit" value="' + esc(it.unit || 'un') + '"></div>' +
                '<div class="form-group" style="flex:0.7;"><label>' + labelQty + '</label><input type="number" class="item-qty" value="' + (it.qty || 0) + '"></div>' +
                '<div class="form-group" style="flex:1;"><label>' + labelPrice + '</label><input type="number" class="item-price" value="' + (it.price || 0) + '" step="0.01"></div>' +
                '<div class="form-group" style="flex:0.7;"><label>IVA %</label><input type="number" class="item-vat" value="' + lineVat + '" step="0.1"></div>' +
                '<div class="form-group" style="flex:0;min-width:40px;"><button class="btn-secondary" onclick="removeDevisItem(this)" style="padding:8px;color:red;">✕</button></div>';
            container.appendChild(row);
        });
    }

    function hydrateQuoteForm(pay) {
        if (!pay) return;
        setField('devisClient', pay.client);
        setField('devisClientNif', pay.clientNif);
        setField('devisClientAddress', pay.clientAddress);
        setField('devisClientPostal', pay.clientPostal);
        setField('devisClientLocalidade', pay.clientLocalidade);
        setField('devisClientEmail', pay.clientEmail);
        setField('devisClientPhone', pay.clientPhone);
        setField('devisClientContact', pay.clientContact);
        setField('devisSite', pay.site);
        setField('devisPayTerms', pay.payTerms);
        setField('devisNumber', pay.number);
        setField('devisDate', pay.date);
        setField('devisValidity', pay.validity);
        setField('devisObject', pay.object);
        setField('devisTVA', pay.tva);
        setField('devisIvaRegime', pay.ivaRegime);
        setField('devisDiscount', pay.discount);
        setField('devisNotes', pay.notes);
        var cons = document.getElementById('devisConsumerFinal');
        if (cons) cons.checked = !!pay.consumerFinal;
        if (pay.items && pay.items.length) rebuildQuoteItems(pay.items);
        if (window.abeneContabilidade && window.abeneContabilidade.refreshDevisTotals) {
            window.abeneContabilidade.refreshDevisTotals();
        }
    }

    function hydrateReceiptForm(pay) {
        if (!pay) return;
        setField('receiptPayerName', pay.payerName);
        setField('receiptPayerNif', pay.payerNif);
        setField('receiptPayerAddress', pay.payerAddress);
        setField('receiptPayerPostal', pay.payerPostal);
        setField('receiptPayerLocalidade', pay.payerLocalidade);
        setField('receiptPayerEmail', pay.payerEmail);
        setField('receiptVatRate', pay.vatRate);
        setField('receiptNumber', pay.number);
        setField('receiptDate', pay.date);
        setField('receiptObject', pay.object);
        setField('receiptAmount', pay.amount);
        setField('receiptPayMethod', pay.payMethod);
        setField('receiptPayRef', pay.payRef);
        setField('receiptNotes', pay.notes);
        setField('receiptQuoteRef', pay.quoteRef);
        var partial = document.getElementById('receiptPartial');
        if (partial) partial.checked = !!pay.partial;
    }

    function hydrateFromEditor(kind) {
        var editor = ed();
        if (!editor) return;
        var block = editor.querySelector('[data-abene-block="' + kind + '"]');
        if (!block) return;
        var pay = decodePayload(block);
        if (kind === 'devis') {
            if (pay) hydrateQuoteForm(pay);
            else setField('devisNumber', block.getAttribute('data-abene-number'));
            return;
        }
        if (pay) hydrateReceiptForm(pay);
        else setField('receiptNumber', block.getAttribute('data-abene-number'));
    }

    function ensurePaperLetterhead() {
        var editor = ed();
        if (!editor || editor.querySelector('.gr-letterhead')) return;
        if (!editorHasContent()) return;
        var h1 = editor.querySelector('h1');
        var title = (h1 && h1.textContent.trim()) || '';
        if (/Comece a escrever|Start typing|Commencez|Empiece/.test(title)) return;
        var d = formatDate();
        var html = letterhead('RELATÓRIO', [['Data', d]], 'Documento técnico');
        var report = editor.querySelector('[data-abene-block="report"]');
        if (report) {
            report.insertAdjacentHTML('afterbegin', html);
            finishInsert();
            return;
        }
        if (title && /relat|rapport|report|informe/i.test(title)) {
            editor.insertAdjacentHTML('afterbegin', html);
            finishInsert();
        }
    }

    function relabelWorkSite(root) {
        var box = root || ed();
        if (!box || !box.querySelectorAll) return;
        box.querySelectorAll('.gr-kv th').forEach(function (th) {
            if ((th.textContent || '').trim() === 'Local da obra') th.textContent = 'Local da obra/Serviço';
        });
    }

    function refreshLetterheads() {
        var editor = ed();
        if (!editor) return;
        relabelWorkSite(editor);
        editor.querySelectorAll('[data-abene-block]').forEach(function (block) {
            var titleEl = block.querySelector('.gr-doc-title');
            var kickEl = block.querySelector('.gr-doc-kicker');
            var metas = [];
            block.querySelectorAll('.gr-meta tr').forEach(function (tr) {
                var th = tr.querySelector('th');
                var td = tr.querySelector('td');
                if (th && td) metas.push([th.textContent.trim(), td.textContent.trim()]);
            });
            if (!metas.length) {
                block.querySelectorAll('.gr-doc-meta').forEach(function (p) {
                    var strong = p.querySelector('strong');
                    var label = strong ? strong.textContent.trim() : '';
                    var val = p.textContent.replace(label, '').trim();
                    if (label) metas.push([label, val]);
                });
            }
            var title = titleEl ? titleEl.textContent.trim() : '';
            if (!title) return;
            var kick = kickEl ? kickEl.textContent.trim() : 'Genius Raros';
            var html = letterhead(title, metas, kick);
            var oldTable = block.querySelector('.gr-letterhead');
            var bar = oldTable && oldTable.nextElementSibling && oldTable.nextElementSibling.classList && oldTable.nextElementSibling.classList.contains('gr-goldbar')
                ? oldTable.nextElementSibling
                : block.querySelector('.gr-goldbar');
            if (oldTable) {
                oldTable.insertAdjacentHTML('beforebegin', html);
                oldTable.remove();
                if (bar) bar.remove();
            }
            block.querySelectorAll('.gr-doc-foot').forEach(function (el) {
                var legal = /não constitui fatura/.test(el.innerHTML || '');
                el.outerHTML = brandFooter(legal);
            });
        });
        finishInsert();
    }

    window.openDevisModal = function () {
        if (typeof applyCompanyDefaults === 'function') applyCompanyDefaults();
        var finalDevis = ed() && ed().querySelector('[data-abene-block="devis"][data-abene-status="final"]');
        if (finalDevis) {
            toastMsg('previewEditFinalWarn', 'Este orçamento é definitivo. Use « Copiar como novo » no Arquivo ou nas Versões para o modificar.');
            return;
        }
        var num = document.getElementById('devisNumber');
        if (num) num.value = nextNumber('ORC', 'abeneOrcCounter', false);
        var notes = document.getElementById('devisNotes');
        if (notes && /Paiement à 30 jours|Ce devis est valable/.test(notes.value)) {
            notes.value = 'Pagamento por transferência bancária. Este orçamento é válido até à data indicada. Não constitui fatura.';
        }
        var has = editorHasContent();
        var append = document.getElementById('devisModeAppend');
        var replace = document.getElementById('devisModeReplace');
        if (append) append.checked = has;
        if (replace) replace.checked = !has;
        ensurePaperLetterhead();
        prefillFromDocument('devis');
        hydrateFromEditor('devis');
        var dateEl = document.getElementById('devisDate');
        if (dateEl && !dateEl.value) dateEl.value = todayIso();
        if (window.abeneContabilidade && window.abeneContabilidade.fillDevisFromTables) {
            window.abeneContabilidade.fillDevisFromTables(false);
            window.abeneContabilidade.refreshDevisTotals();
        }
        document.getElementById('devisModal').classList.add('visible');
    };

    window.openReceiptModal = function () {
        if (typeof applyCompanyDefaults === 'function') applyCompanyDefaults();
        var finalReceipt = ed() && ed().querySelector('[data-abene-block="receipt"][data-abene-status="final"]');
        if (finalReceipt) {
            toastMsg('previewEditFinalWarn', 'Este recibo é definitivo. Use « Copiar como novo » no Arquivo ou nas Versões para o modificar.');
            return;
        }
        var num = document.getElementById('receiptNumber');
        if (num) num.value = nextNumber('REC', 'abeneRecCounter', false);
        var notes = document.getElementById('receiptNotes');
        if (notes && /Ce reçu atteste/.test(notes.value)) {
            notes.value = 'Este recibo comercial atesta o pagamento da importância indicada. Não substitui fatura certificada.';
        }
        var has = editorHasContent();
        var append = document.getElementById('receiptModeAppend');
        var replace = document.getElementById('receiptModeReplace');
        if (append) append.checked = has;
        if (replace) replace.checked = !has;
        ensurePaperLetterhead();
        prefillFromDocument('receipt');
        hydrateFromEditor('receipt');
        var rDate = document.getElementById('receiptDate');
        if (rDate && !rDate.value) rDate.value = todayIso();
        document.getElementById('receiptModal').classList.add('visible');
    };

    window.addDevisItem = function () {
        var container = document.getElementById('devisItems');
        var row = document.createElement('div');
        row.className = 'form-row devis-item-row';
        row.style.alignItems = 'end';
        var vat = (company().vatRate != null ? company().vatRate : 23);
        row.innerHTML =
            '<div class="form-group" style="flex:3;"><label>' + (typeof t === 'function' ? t('description') : 'Descrição') + '</label><input type="text" class="item-desc" list="abeneArticleList" value=""></div>' +
            '<div class="form-group" style="flex:0.7;"><label>Un.</label><input type="text" class="item-unit" value="un"></div>' +
            '<div class="form-group" style="flex:0.7;"><label>' + (typeof t === 'function' ? t('qty') : 'Qtd') + '</label><input type="number" class="item-qty" value="1"></div>' +
            '<div class="form-group" style="flex:1;"><label>' + (typeof t === 'function' ? t('unitPrice') : 'Preço unit.') + '</label><input type="number" class="item-price" value="0" step="0.01"></div>' +
            '<div class="form-group" style="flex:0.7;"><label>IVA %</label><input type="number" class="item-vat" value="' + vat + '" step="0.1"></div>' +
            '<div class="form-group" style="flex:0;min-width:40px;"><button class="btn-secondary" onclick="removeDevisItem(this)" style="padding:8px;color:red;">✕</button></div>';
        container.appendChild(row);
    };

    function nifDigits(raw) {
        return String(raw || '').replace(/\D+/g, '');
    }
    function nifChecksumOk(d) {
        if (!d || d.length !== 9) return false;
        var w = [9, 8, 7, 6, 5, 4, 3, 2], sum = 0, i;
        for (i = 0; i < 8; i++) sum += parseInt(d.charAt(i), 10) * w[i];
        var chk = 11 - (sum % 11);
        if (chk >= 10) chk = 0;
        return chk === parseInt(d.charAt(8), 10);
    }
    function nifWarnKey(nif, consumerFinal) {
        var d = nifDigits(nif);
        if (consumerFinal) return '';
        if (!d) return 'previewNifEmpty';
        if (d.length !== 9) return 'previewNifLen';
        if (!nifChecksumOk(d)) return 'previewNifChk';
        return '';
    }

    function validateQuote(data) {
        if (!(data.client || '').trim() && !data.consumerFinal) {
            return ui('previewNeedClient', 'Indique o nome do cliente (ou consumidor final).');
        }
        var hasLine = (data.items || []).some(function (it) {
            return (it.desc || '').trim() && (Number(it.qty) || Number(it.price));
        });
        if (!hasLine) return ui('previewNeedItems', 'Adicione pelo menos um artigo com descrição e valor.');
        return '';
    }

    function validateReceipt(data) {
        if (!(data.payerName || '').trim()) {
            return ui('previewNeedPayer', 'Indique o nome do pagador.');
        }
        if (!(Number(data.amount) > 0)) {
            return ui('previewNeedAmount', 'Indique um montante superior a zero.');
        }
        return '';
    }

    function previewWarnings(kind, data) {
        var list = [];
        var co = company();
        if (!co.nif || !co.address) list.push(ui('previewCompanyIncomplete', 'NIF ou morada da Genius Raros ainda vazios nas Definições (⚙).'));
        if (!co.iban) list.push(ui('previewIbanEmpty', 'IBAN da empresa vazio nas Definições (⚙) — o papel sai sem dados de pagamento.'));
        var nif = kind === 'devis' ? (data && data.clientNif) : (data && data.payerNif);
        var cons = kind === 'devis' && data && data.consumerFinal;
        var key = nifWarnKey(nif, cons);
        if (key === 'previewNifEmpty') list.push(ui(key, 'NIF vazio: o CSV do TOC usará 999999990 (consumidor final).'));
        if (key === 'previewNifLen') list.push(ui(key, 'NIF deve ter 9 dígitos (aviso — a pré-visualização continua).'));
        if (key === 'previewNifChk') list.push(ui(key, 'NIF com dígito de controlo inválido (aviso — pode continuar).'));
        return list;
    }

    function companyIncompleteHint() {
        var co = company();
        if (co.nif && co.address) return '';
        return ' ' + ui('previewCompanyIncomplete', 'NIF ou morada da Genius Raros ainda vazios nas Definições (⚙).');
    }

    function syncPreviewChrome() {
        var st = previewState;
        if (!st) return;
        var isQuote = st.kind === 'devis';
        var titleEl = document.getElementById('paperPreviewTitle');
        var badge = document.getElementById('paperPreviewBadge');
        var hint = document.getElementById('paperPreviewHint');
        var draftBtn = document.getElementById('paperPreviewDraftBtn');
        var finalBtn = document.getElementById('paperPreviewFinalBtn');
        var backBtn = document.querySelector('#paperPreviewModal [data-i18n="previewBack"]');
        var viewDraft = document.getElementById('previewViewDraft');
        var viewFinal = document.getElementById('previewViewFinal');
        var view = st.view === 'final' ? 'final' : (st.view === 'compare' ? 'compare' : 'draft');
        if (titleEl) {
            if (st.kind === 'both') titleEl.textContent = ui('viewCreatedTitle', 'Papéis criados — ORÇAMENTO e RECIBO');
            else if (view === 'compare') titleEl.textContent = ui('previewCompareTitle', 'Antes e depois — rascunho vs versão definitiva');
            else if (view !== 'final') titleEl.textContent = isQuote
                ? ui('previewBeforeTitleQuote', 'Como ficará o orçamento — antes de confirmar')
                : ui('previewBeforeTitleReceipt', 'Como ficará o recibo — antes de confirmar');
            else titleEl.textContent = isQuote
                ? ui('previewTitleQuote', 'Pré-visualização — ORÇAMENTO')
                : ui('previewTitleReceipt', 'Pré-visualização — RECIBO');
        }
        if (badge) {
            badge.classList.toggle('is-final', view === 'final' && st.kind !== 'both');
            badge.classList.toggle('is-before', view !== 'final' && view !== 'compare');
            if (st.kind === 'both') badge.textContent = ui('viewCreated', 'Papéis criados');
            else if (view === 'compare') badge.textContent = ui('previewCompare', 'ANTES / DEPOIS');
            else if (view !== 'final') badge.textContent = ui('previewBeforeBadge', 'ANTES DA VERSÃO DEFINITIVA');
            else if (st.existingStatus === 'final' && st.source === 'editor') badge.textContent = ui('previewBadgeFinal', 'VERSÃO DEFINITIVA');
            else badge.textContent = ui('previewBadgeFinal', 'VERSÃO DEFINITIVA');
        }
        if (hint) {
            if (st.kind === 'both') hint.textContent = ui('previewHintFinal', 'Este papel já é versão definitiva. Pode imprimir ou fechar.');
            else if (view === 'compare') hint.textContent = ui('previewCompareHint', 'À esquerda: como fica antes de confirmar (rascunho). À direita: como ficará a versão definitiva.');
            else if (view !== 'final') hint.textContent = ui('previewBeforeHint', 'Esta janela mostra o papel como rascunho, antes de o guardar como versão definitiva. Ainda não está emitido.');
            else if (st.existingStatus === 'final' && st.source === 'editor') hint.textContent = ui('previewHintFinal', 'Este papel já é versão definitiva. Pode imprimir ou fechar.');
            else hint.textContent = ui('previewHint', 'Ainda não está gravado como versão definitiva. Veja o papel, volte a editar, insira um rascunho ou confirme.');
        }
        var warnBox = document.getElementById('paperPreviewWarn');
        if (warnBox) {
            var warns = previewWarnings(st.kind, st.data);
            if (st.existingStatus === 'final' && st.source === 'form') {
                warns.unshift(ui('previewEditFinalWarn', 'Este papel já é versão definitiva. Confirmar de novo grava uma nova revisão PDF no Arquivo.'));
            }
            warnBox.style.display = warns.length ? 'block' : 'none';
            if (warns.length) warnBox.removeAttribute('hidden');
            else warnBox.setAttribute('hidden', '');
            warnBox.innerHTML = warns.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('<br/>');
        }
        if (viewDraft) viewDraft.classList.toggle('on', view === 'draft');
        if (viewFinal) viewFinal.classList.toggle('on', view === 'final');
        var viewCompare = document.getElementById('previewViewCompare');
        if (viewCompare) viewCompare.classList.toggle('on', view === 'compare');
        var alreadyFinal = st.source === 'editor' && st.existingStatus === 'final';
        var alreadyDraft = st.source === 'editor' && st.existingStatus === 'draft';
        if (draftBtn) draftBtn.style.display = (alreadyFinal || alreadyDraft) ? 'none' : '';
        if (finalBtn) finalBtn.style.display = alreadyFinal ? 'none' : '';
        if (backBtn) {
            backBtn.textContent = st.source === 'form'
                ? ui('previewBack', 'Voltar a editar')
                : ui('previewClose', 'Fechar');
        }
        var sw = document.getElementById('paperPreviewSwitch');
        var editor = ed();
        var hasQ = !!(editor && editor.querySelector('[data-abene-block="devis"]'));
        var hasR = !!(editor && editor.querySelector('[data-abene-block="receipt"]'));
        if (sw) sw.style.display = (hasQ || hasR) ? 'inline-flex' : 'none';
        var bq = document.getElementById('switchToQuote');
        var br = document.getElementById('switchToReceipt');
        var bb = document.getElementById('switchToBoth');
        if (bq) {
            bq.disabled = !hasQ;
            bq.classList.toggle('on', st.kind === 'devis');
        }
        if (br) {
            br.disabled = !hasR;
            br.classList.toggle('on', st.kind === 'receipt');
        }
        if (bb) {
            bb.style.display = (hasQ && hasR) ? '' : 'none';
            bb.classList.toggle('on', st.kind === 'both');
        }
        var toggle = document.getElementById('paperPreviewToggle');
        if (toggle) toggle.style.display = st.kind === 'both' ? 'none' : '';
        if (st.kind === 'both') {
            if (draftBtn) draftBtn.style.display = 'none';
            if (finalBtn) finalBtn.style.display = 'none';
        }
    }

    function renderPaperPreview() {
        var st = previewState;
        if (!st) return;
        var overlay = document.getElementById('paperPreviewModal');
        var sheet = document.getElementById('paperPreviewSheet');
        if (!overlay || !sheet) return;
        var view = st.view === 'final' ? 'final' : (st.view === 'compare' ? 'compare' : 'draft');
        var data = st.data;
        var colFinal = document.getElementById('paperPreviewColFinal');
        var sheetFinal = document.getElementById('paperPreviewSheetFinal');
        var stage = document.getElementById('paperPreviewStage') || overlay.querySelector('.paper-preview-stage');
        if (stage) stage.classList.toggle('is-compare', view === 'compare' && st.kind !== 'both');
        if (colFinal) colFinal.hidden = !(view === 'compare' && st.kind !== 'both');
        if (st.kind === 'both') {
            sheet.innerHTML =
                '<div class="paper-preview-pair">' +
                (st.htmlQuote || '') +
                '<div class="paper-preview-sep" contenteditable="false">' + esc(ui('viewCreatedSep', 'Recibo')) + '</div>' +
                (st.htmlReceipt || '') +
                '</div>';
            syncPreviewChrome();
            overlay.classList.add('visible');
            return;
        }
        if (st.source === 'form') {
            data = st.kind === 'devis' ? collectQuote() : collectReceipt();
            var prefix = st.kind === 'devis' ? 'ORC' : 'REC';
            var storageKey = st.kind === 'devis' ? 'abeneOrcCounter' : 'abeneRecCounter';
            data.number = data.number || nextNumber(prefix, storageKey, false);
            if (st.kind === 'devis') setField('devisNumber', data.number);
            else setField('receiptNumber', data.number);
            st.data = data;
        }
        function paperHtml(status) {
            if (data) {
                return st.kind === 'devis'
                    ? buildQuoteHTML(data, { status: status })
                    : buildReceiptHTML(data, { status: status });
            }
            return st.html || '';
        }
        if (view === 'compare') {
            sheet.innerHTML = paperHtml('draft');
            if (sheetFinal) sheetFinal.innerHTML = paperHtml('final');
        } else if (data) {
            sheet.innerHTML = paperHtml(view === 'final' ? 'final' : 'draft');
        } else if (st.html) {
            sheet.innerHTML = st.html;
        }
        syncPreviewChrome();
        overlay.classList.add('visible');
    }

    function openPreview(kind, source, extra) {
        extra = extra || {};
        var data = extra.data;
        if (source === 'form') {
            data = kind === 'devis' ? collectQuote() : collectReceipt();
            var err = kind === 'devis' ? validateQuote(data) : validateReceipt(data);
            if (err) {
                if (typeof showToast === 'function') showToast(err);
                else alert(err);
                return;
            }
        }
        var editor = ed();
        var block = editor && editor.querySelector('[data-abene-block="' + kind + '"]');
        previewState = {
            kind: kind,
            source: source,
            view: extra.view || (source === 'form' ? 'draft' : (extra.existingStatus === 'final' ? 'final' : 'draft')),
            data: data,
            html: extra.html || '',
            existingStatus: extra.existingStatus || (block ? paperStatusOf(block) : '')
        };
        renderPaperPreview();
    }

    function insertCommercialPaper(kind, status) {
        var isQuote = kind === 'devis';
        var data = isQuote ? collectQuote() : collectReceipt();
        var err = isQuote ? validateQuote(data) : validateReceipt(data);
        if (err) {
            if (typeof showToast === 'function') showToast(err);
            else alert(err);
            return null;
        }
        var radio = isQuote ? 'devisInsertMode' : 'receiptInsertMode';
        var prefix = isQuote ? 'ORC' : 'REC';
        var storageKey = isQuote ? 'abeneOrcCounter' : 'abeneRecCounter';
        data.number = assignNumber(data, prefix, storageKey, kind, radio, status === 'final');
        if (isQuote) setField('devisNumber', data.number);
        else setField('receiptNumber', data.number);
        var mode = chosenMode(radio);
        if (mode === 'replace-doc' && editorHasContent() && !confirm(ui('cReplaceDoc', 'Substituir o documento atual?'))) return null;
        var editorBefore = ed();
        var previousHtml = editorBefore ? editorBefore.innerHTML : '<p></p>';
        var html = isQuote ? buildQuoteHTML(data, { status: status }) : buildReceiptHTML(data, { status: status });
        composeDocument(kind, html, mode);
        rememberLastJob(data, isQuote ? 'devis' : 'receipt');
        persistLocal();
        var pdfPromise = Promise.resolve(null);
        var recordFinal = function () {};
        if (status === 'final') {
            try {
                recordFinal = function () {
                    try {
                        if (isQuote) {
                            localStorage.setItem('abeneLastQuote', JSON.stringify({
                                number: data.number, client: data.client, total: data.grand,
                                nif: data.clientNif, items: data.items, date: data.date, object: data.object
                            }));
                        }
                        if (window.abeneContabilidade && window.abeneContabilidade.journalPush) {
                            if (isQuote) {
                                window.abeneContabilidade.journalPush({
                                    tipo: 'ORCAMENTO', codigoSAFT: 'OR', label: 'Orçamento',
                                    numero: data.number, data: data.date, cliente: data.client,
                                    nifCliente: data.clientNif, morada: data.clientAddress, objeto: data.object,
                                    total: data.grand, items: data.items,
                                    discount: data.discount, ivaRegime: data.ivaRegime,
                                    postal: data.clientPostal, localidade: data.clientLocalidade,
                                    site: data.site, email: data.clientEmail, telefone: data.clientPhone
                                });
                            } else {
                                window.abeneContabilidade.journalPush({
                                    tipo: 'RECIBO_COMERCIAL', codigoSAFT: 'RG', label: 'Recibo comercial',
                                    numero: data.number, data: data.date, cliente: data.payerName,
                                    nifCliente: data.payerNif, morada: data.payerAddress, objeto: data.object,
                                    pagamento: data.payMethod, referencia: data.payRef, origem: data.quoteRef,
                                    total: data.amount,
                                    email: data.payerEmail, postal: data.payerPostal, localidade: data.payerLocalidade,
                                    items: [{ desc: data.object || 'Pagamento', unit: 'un', qty: 1, price: data.amount, vat: data.vatRate || 0, total: data.amount }]
                                });
                            }
                        }
                    } catch (eRecord) {}
                };
                var editorNow = ed();
                if (window.abeneArquivoApi && typeof window.abeneArquivoApi.gravarEtape === 'function' && editorNow) {
                    pdfPromise = window.abeneArquivoApi.gravarEtape(isQuote ? 'orcamento' : 'recibo', {
                        html: editorNow.innerHTML,
                        number: data.number,
                        name: (window.abene && window.abene.documentState && window.abene.documentState.name) || '',
                        client: isQuote ? data.client : data.payerName,
                        pasta: (isQuote ? (data.site || data.object) : (data.object || '')) || '',
                        nif: isQuote ? data.clientNif : data.payerNif,
                        type: isQuote ? 'orcamento' : 'recibo',
                        silent: true
                    }).then(function (rec) {
                        if (rec && rec.rev) toastMsg('previewPdfFrozen', 'Versão definitiva gravada no Arquivo (PDF v' + rec.rev + ').');
                        if (!rec) throw new Error('pdf-not-saved');
                        return rec;
                    });
                } else {
                    pdfPromise = Promise.reject(new Error('pdf-unavailable'));
                }
            } catch (e) { pdfPromise = Promise.reject(e); }
        }
        return {
            ok: true,
            data: data,
            pdfPromise: pdfPromise,
            recordFinal: recordFinal,
            rollback: function () {
                var editorNow = ed();
                if (editorNow) editorNow.innerHTML = previousHtml || '<p></p>';
                persistLocal();
                if (typeof updateStats === 'function') updateStats();
                if (typeof refreshPagination === 'function') refreshPagination();
            }
        };
    }

    window.previewDevis = function () {
        openPreview('devis', 'form');
    };
    window.previewReceipt = function () {
        openPreview('receipt', 'form');
    };
    window.generateDevis = function () {
        window.previewDevis();
    };
    window.generateReceipt = function () {
        window.previewReceipt();
    };
    window.setPaperPreviewView = function (view) {
        if (!previewState) return;
        if (view === 'compare' || view === 'final') previewState.view = view;
        else previewState.view = 'draft';
        renderPaperPreview();
    };
    window.previewBeforeFinal = function (kind) {
        kind = kind === 'receipt' ? 'receipt' : 'devis';
        var data = kind === 'devis' ? collectQuote() : collectReceipt();
        var err = kind === 'devis' ? validateQuote(data) : validateReceipt(data);
        if (!err) {
            openPreview(kind, 'form', { view: 'draft' });
            return;
        }
        var editor = ed();
        var block = editor && editor.querySelector('[data-abene-block="' + kind + '"]');
        if (block) {
            var pay = decodePayload(block);
            openPreview(kind, 'editor', {
                data: pay,
                html: pay ? '' : block.outerHTML,
                view: 'draft',
                existingStatus: paperStatusOf(block)
            });
            return;
        }
        if (typeof showToast === 'function') showToast(err);
        else alert(err);
        if (kind === 'devis') window.openDevisModal();
        else window.openReceiptModal();
    };
    window.closePaperPreview = function () {
        var overlay = document.getElementById('paperPreviewModal');
        if (overlay) overlay.classList.remove('visible');
        previewState = null;
        document.body.classList.remove('paper-preview-print');
    };
    window.printPaperPreview = function () {
        document.body.classList.add('paper-preview-print');
        window.print();
    };
    window.downloadPaperPreviewPdf = function () {
        var sheet = document.getElementById('paperPreviewSheet');
        if (!sheet || !sheet.innerHTML.trim()) return;
        var data = previewState && previewState.data;
        var name = ((data && data.number) || 'papel') + '.pdf';
        if (!window.html2pdf) {
            window.printPaperPreview();
            return;
        }
        window.html2pdf().set({
            margin: 0,
            filename: name,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(sheet).save();
        toastMsg('toastPdfPreview', 'PDF da pré-visualização descarregado. Ainda não é a versão definitiva no documento.');
    };
    window.emailPaperPreview = function () {
        if (!previewState) return;
        var data = previewState.data || {};
        var isQuote = previewState.kind !== 'receipt';
        if (previewState.kind === 'both') {
            var qBlock = ed() && ed().querySelector('[data-abene-block="devis"]');
            data = decodePayload(qBlock) || data;
            isQuote = true;
        }
        var to = (isQuote ? data.clientEmail : data.payerEmail) || '';
        if (!to) {
            to = window.prompt(ui('previewEmailEmpty', 'Indique o e-mail do destinatário:'), '') || '';
        }
        to = String(to).trim();
        if (!to) return;
        var num = data.number || '';
        var total = isQuote ? data.grand : data.amount;
        var co = (window.abene && window.abene.companyData) || {};
        var subj = (isQuote ? 'Orçamento ' : 'Recibo comercial ') + num + ' — ' + (co.name || 'Genius Raros');
        var body = 'Exmo(a). Senhor(a),\n\n' +
            'Segue o ' + (isQuote ? 'orçamento' : 'recibo comercial') + ' ' + num +
            (total != null ? (' no valor de ' + money(total)) : '') + '.\n\n' +
            'Este documento não constitui fatura certificada (AT).\n\n' +
            'Com os melhores cumprimentos,\n' + (co.name || 'Genius Raros');
        var sheet = document.getElementById('paperPreviewSheet');
        var gmailOn = typeof window.abeneSendEmail === 'function' &&
            typeof window.abeneSheetsEnabled === 'function' &&
            window.abeneSheetsEnabled() &&
            navigator.onLine !== false;

        function sendWith(atts) {
            var list = Array.isArray(atts) ? atts : [];
            if (list.length !== 1 || list[0].mimeType !== 'application/pdf' || !list[0].data) {
                toastMsg('mailFail', 'O PDF não pôde ser criado. Nada foi enviado.');
                return;
            }
            toastMsg('mailSending', 'A enviar PDF pelo Gmail da conta Google ligada…');
            window.abeneSendEmail({
                to: to,
                subject: subj,
                body: body,
                html: '',
                name: co.name || 'Genius Raros',
                attachments: list
            }).then(function (json) {
                var from = (json && json.from) || co.googleOwnerEmail || '';
                toastMsg('mailSentPdf', from
                    ? ('PDF enviado por ' + from + ' (não definitivo).')
                    : 'PDF enviado ao cliente (não definitivo).');
                markSentToClient();
            }).catch(function () {
                toastMsg('mailFail', 'Falha no Gmail ligado. Nada foi enviado; verifique a ligação e tente novamente.');
            });
        }

        function markSentToClient() {
            try {
                if (window.abene && window.abene.documentState) {
                    window.abene.documentState.sentToClient = true;
                }
            } catch (e0) {}
            try {
                if (window.abeneArquivoApi && typeof window.abeneArquivoApi.markSentToClient === 'function') {
                    var meta = previewState && previewState.data;
                    window.abeneArquivoApi.markSentToClient({
                        client: isQuote ? (meta && meta.client) : (meta && meta.payerName),
                        number: meta && meta.number,
                        kind: previewState && previewState.kind
                    });
                }
            } catch (e1) {}
        }

        if (!gmailOn) {
            toastMsg('mailFail', 'Ligue o Gmail/Apps Script nas Definições para enviar o PDF. Nada foi enviado.');
            return;
        }

        if (!window.html2pdf || !sheet) {
            toastMsg('mailFail', 'O PDF não pôde ser criado. Nada foi enviado.');
            return;
        }
        try {
            var worker = window.html2pdf().set({
                margin: 0,
                filename: (num || 'papel') + '.pdf',
                image: { type: 'jpeg', quality: 0.92 },
                html2canvas: { scale: 1.6, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(sheet);
            var out = worker.outputPdf('datauristring');
            if (out && typeof out.then === 'function') {
                out.then(function (uri) {
                    var s = String(uri || '');
                    var i = s.indexOf(',');
                    var b64 = i >= 0 ? s.slice(i + 1) : '';
                    sendWith(b64 ? [{ name: (num || 'papel') + '.pdf', mimeType: 'application/pdf', data: b64 }] : []);
                }).catch(function () { toastMsg('mailFail', 'O PDF não pôde ser criado. Nada foi enviado.'); });
                return;
            }
        } catch (ePdf) {}
        toastMsg('mailFail', 'O PDF não pôde ser criado. Nada foi enviado.');
    };
    window.commitPaperPreview = function (status) {
        if (!previewState || previewState.kind === 'both') return;
        status = status === 'final' ? 'final' : 'draft';
        if (status === 'final' && !confirm(ui('previewConfirmFinal', 'Confirmar este papel como versão definitiva? O número será reservado e deixa de ser rascunho.'))) return;
        var kind = previewState.kind;
        if (previewState.source !== 'form' && previewState.data) {
            if (kind === 'devis') hydrateQuoteForm(previewState.data);
            else hydrateReceiptForm(previewState.data);
        }
        var result = insertCommercialPaper(kind, status);
        if (!result || !result.ok) return;
        if (status === 'draft') {
            if (typeof closeModal === 'function') closeModal(kind === 'devis' ? 'devisModal' : 'receiptModal');
            window.closePaperPreview();
            toastMsg(kind === 'devis' ? 'toastQuoteDraft' : 'toastReceiptDraft',
                kind === 'devis'
                    ? 'Rascunho do orçamento inserido. Confirme a versão definitiva quando estiver pronto.'
                    : 'Rascunho do recibo inserido. Confirme a versão definitiva quando estiver pronto.');
        } else {
            var data = result.data;
            Promise.resolve(result.pdfPromise).then(function () {
                if (!window.abeneArquivoApi || typeof window.abeneArquivoApi.archiveCurrent !== 'function') throw new Error('archive-unavailable');
                var archiveId = window.abeneArquivoApi.archiveCurrent({
                    silent: true,
                    concluded: true,
                    client: kind === 'devis' ? data.client : data.payerName,
                    pasta: (kind === 'devis' ? (data.site || data.object) : (data.object || '')) || undefined,
                    nif: kind === 'devis' ? data.clientNif : data.payerNif
                });
                if (!archiveId) throw new Error('archive-failed');
                if (typeof window.abeneArquivoApi.waitForArchivePdfs === 'function') {
                    return Promise.resolve(window.abeneArquivoApi.waitForArchivePdfs()).then(function () {
                        return { archiveId: archiveId, data: data };
                    });
                }
                return { archiveId: archiveId, data: data };
            }).then(function () {
                if (typeof result.recordFinal === 'function') result.recordFinal();
                if (typeof closeModal === 'function') closeModal(kind === 'devis' ? 'devisModal' : 'receiptModal');
                window.closePaperPreview();
                persistLocal();
                if (typeof window.abeneSheetsPush === 'function') window.abeneSheetsPush('final').catch(function () {});
                toastMsg(kind === 'devis' ? 'toastQuoteFinal' : 'toastReceiptFinal',
                    kind === 'devis' ? 'Orçamento confirmado, PDF final preservado no Arquivo.' : 'Recibo confirmado, PDF final preservado no Arquivo.');
                setTimeout(function () { revealPaperInEditor(kind); }, 40);
            }).catch(function () {
                if (typeof result.rollback === 'function') result.rollback();
                toastMsg('pdfFail', 'A finalização não foi concluída porque o PDF final não pôde ser preservado.');
            });
            return;
        }
        setTimeout(function () {
            revealPaperInEditor(kind);
        }, 40);
    };
    window.commitPaperFromForm = function (kind, status) {
        kind = kind === 'receipt' ? 'receipt' : 'devis';
        previewState = { kind: kind, source: 'form', data: null, view: status === 'final' ? 'final' : 'draft' };
        window.commitPaperPreview(status);
    };
    window.previewInsertedPaper = function (kind) {
        var blockId = kind === 'receipt' ? 'receipt' : 'devis';
        var editor = ed();
        var block = editor && editor.querySelector('[data-abene-block="' + blockId + '"]');
        if (!block) {
            toastMsg(blockId === 'devis' ? 'previewNoneQuote' : 'previewNoneReceipt',
                blockId === 'devis'
                    ? 'Ainda não há orçamento no documento. Preencha o formulário e pré-visualize.'
                    : 'Ainda não há recibo no documento. Preencha o formulário e pré-visualize.');
            if (blockId === 'devis') window.openDevisModal();
            else window.openReceiptModal();
            return;
        }
        var pay = decodePayload(block);
        var existingStatus = paperStatusOf(block);
        if (pay) {
            if (blockId === 'devis') hydrateQuoteForm(pay);
            else hydrateReceiptForm(pay);
        }
        openPreview(blockId, 'editor', {
            data: pay,
            html: pay ? '' : block.outerHTML,
            existingStatus: existingStatus,
            view: existingStatus === 'final' ? 'final' : 'draft'
        });
        revealPaperInEditor(blockId);
    };
    window.previewCreatedPapers = function () {
        var editor = ed();
        var quote = editor && editor.querySelector('[data-abene-block="devis"]');
        var rec = editor && editor.querySelector('[data-abene-block="receipt"]');
        if (!quote && !rec) {
            toastMsg('previewNoneCreated', 'Ainda não há orçamento nem recibo neste documento. Crie-os primeiro.');
            return;
        }
        if (quote && rec) {
            previewState = {
                kind: 'both',
                source: 'editor',
                view: 'final',
                data: null,
                htmlQuote: quote.outerHTML,
                htmlReceipt: rec.outerHTML,
                existingStatus: 'final'
            };
            renderPaperPreview();
            revealPaperInEditor('devis');
            return;
        }
        window.previewInsertedPaper(quote ? 'devis' : 'receipt');
    };

    window.addEventListener('afterprint', function () {
        document.body.classList.remove('paper-preview-print');
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var pv = document.getElementById('paperPreviewModal');
        if (pv && pv.classList.contains('visible')) {
            e.preventDefault();
            e.stopPropagation();
            window.closePaperPreview();
        }
    }, true);
    document.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter') return;
        var pv = document.getElementById('paperPreviewModal');
        if (pv && pv.classList.contains('visible')) {
            e.preventDefault();
            window.commitPaperPreview(e.shiftKey ? 'final' : 'draft');
            return;
        }
        var devis = document.getElementById('devisModal');
        var rec = document.getElementById('receiptModal');
        if (devis && devis.classList.contains('visible')) {
            e.preventDefault();
            window.commitPaperFromForm('devis', e.shiftKey ? 'final' : 'draft');
            return;
        }
        if (rec && rec.classList.contains('visible')) {
            e.preventDefault();
            window.commitPaperFromForm('receipt', e.shiftKey ? 'final' : 'draft');
        }
    });

    function parseLooseNumber(raw) {
        var s = String(raw == null ? '' : raw).trim().replace(/\s/g, '').replace(/€/g, '').replace(/EUR/gi, '');
        if (!s) return NaN;
        if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else s = s.replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? NaN : n;
    }

    function harvestGenericLines() {
        var editor = ed();
        if (!editor) return [];
        var items = [];
        var seen = {};
        function push(desc, unit, qty, price) {
            desc = String(desc || '').replace(/\s+/g, ' ').trim();
            if (!desc || desc.length < 2) return;
            if (/^(descrição|descricao|constatação|qtd|qty|un\.?|iva|total|#)$/i.test(desc)) return;
            var key = desc.toLowerCase();
            if (seen[key]) return;
            seen[key] = true;
            qty = qty > 0 ? qty : 1;
            price = price > 0 ? price : 0;
            items.push({ desc: desc, unit: unit || 'un', qty: qty, price: price, vat: null, total: qty * price });
        }
        editor.querySelectorAll('table').forEach(function (table) {
            if (table.closest('[data-abene-block="devis"], [data-abene-block="receipt"], [data-abene-block="cover"], [data-abene-block="titlepage"]')) return;
            if (table.getAttribute('data-abene-quote-table')) return;
            if (/gr-letterhead|gr-parties|gr-totals|gr-meta|gr-signs/.test(table.className || '')) return;
            table.querySelectorAll('tr').forEach(function (tr, idx) {
                if (tr.closest('thead') || tr.getAttribute('data-abene-totals')) return;
                var cells = tr.querySelectorAll('td, th');
                if (!cells.length) return;
                var texts = [];
                var i;
                for (i = 0; i < cells.length; i++) {
                    texts.push((cells[i].innerText || '').replace(/\u00a0/g, ' ').trim());
                }
                if (!texts.join('').trim()) return;
                if (idx === 0 && /desc|qtd|qty|preço|preco|iva|total/i.test(texts.join(' '))) return;
                var desc = texts[0];
                if (/^\d+$/.test(texts[0]) && texts[1]) desc = texts[1];
                var nums = [];
                for (i = 1; i < texts.length; i++) {
                    var n = parseLooseNumber(texts[i]);
                    if (!isNaN(n) && /[\d]/.test(texts[i])) nums.push(n);
                }
                var qty = 1;
                var price = 0;
                if (nums.length >= 2) {
                    qty = nums[0] || 1;
                    price = nums[1];
                } else if (nums.length === 1) {
                    price = nums[0];
                }
                push(desc, 'un', qty, price);
            });
        });
        editor.querySelectorAll('li').forEach(function (li) {
            if (li.closest('[data-abene-block="devis"], [data-abene-block="receipt"], [data-abene-block="cover"], [data-abene-block="titlepage"]')) return;
            var t = (li.innerText || '').replace(/\s+/g, ' ').trim();
            if (t.length < 4 || t.length > 200) return;
            push(t, 'un', 1, 0);
        });
        return items;
    }

    function applyHarvestedQuoteItems(items) {
        if (!items || !items.length) return 0;
        rebuildQuoteItems(items);
        if (window.abeneContabilidade && window.abeneContabilidade.refreshDevisTotals) {
            window.abeneContabilidade.refreshDevisTotals();
        }
        return items.length;
    }

    window.convertToDevis = function () {
        window.openDevisModal();
        var n = 0;
        if (window.abeneContabilidade && window.abeneContabilidade.fillDevisFromTables) {
            n = window.abeneContabilidade.fillDevisFromTables(true) || 0;
        }
        if (!n) n = applyHarvestedQuoteItems(harvestGenericLines());
        if (n && typeof t === 'function') {
            var filled = t('convertFilled', { n: n });
            if (typeof showToast === 'function') showToast(filled);
            else alert(filled);
        } else {
            toastMsg('convertEmpty', 'Não encontrei artigos no relatório. Preencha o orçamento à mão.');
        }
    };

    window.convertToReceipt = function () {
        window.openReceiptModal();
        var editor = ed();
        var devis = editor && editor.querySelector('[data-abene-block="devis"]');
        var filled = false;
        if (devis) {
            var pay = decodePayload(devis) || {};
            var amt = document.getElementById('receiptAmount');
            var total = Number(devis.getAttribute('data-abene-total') || pay.grand || 0);
            if (amt && total) amt.value = total.toFixed(2);
            setField('receiptPayerName', devis.getAttribute('data-abene-client') || pay.client);
            setField('receiptPayerNif', devis.getAttribute('data-abene-nif') || pay.clientNif);
            setField('receiptPayerAddress', pay.clientAddress);
            setField('receiptPayerPostal', pay.clientPostal);
            setField('receiptPayerLocalidade', pay.clientLocalidade);
            setField('receiptPayerEmail', pay.clientEmail);
            var qn = document.getElementById('receiptQuoteRef');
            if (qn) qn.value = devis.getAttribute('data-abene-number') || pay.number || '';
            var recObj = document.getElementById('receiptObject');
            if (recObj) recObj.value = 'Pagamento referente ao orçamento ' + (devis.getAttribute('data-abene-number') || pay.number || '');
            filled = total > 0 || !!(devis.getAttribute('data-abene-client') || pay.client);
        } else {
            var items = (window.abeneContabilidade && window.abeneContabilidade.harvestTables)
                ? window.abeneContabilidade.harvestTables()
                : [];
            if (!items.length) items = harvestGenericLines();
            var sum = 0;
            items.forEach(function (it) { sum += (Number(it.qty) || 1) * (Number(it.price) || 0); });
            if (sum > 0) {
                var amountEl = document.getElementById('receiptAmount');
                if (amountEl) amountEl.value = sum.toFixed(2);
                filled = true;
            }
            var h1 = editor && editor.querySelector('h1');
            var obj = document.getElementById('receiptObject');
            if (obj && !obj.value && h1) obj.value = h1.textContent.trim();
        }
        toastMsg(filled ? 'convertReceiptFilled' : 'convertReceiptEmpty',
            filled
                ? 'Recibo preenchido a partir do orçamento / relatório. Confirme e pré-visualize.'
                : 'Não há orçamento nem valores no documento. Preencha o recibo à mão.');
    };

    window.abeneComercial = {
        nextNumber: nextNumber,
        composeDocument: composeDocument,
        buildQuoteHTML: buildQuoteHTML,
        buildReceiptHTML: buildReceiptHTML,
        collectQuote: collectQuote,
        collectReceipt: collectReceipt,
        decodePayload: decodePayload,
        insertCommercialPaper: insertCommercialPaper,
        buildLetterhead: letterhead,
        brandFooter: brandFooter,
        refreshLetterheads: refreshLetterheads,
        ensurePaperLetterhead: ensurePaperLetterhead
    };
})();
