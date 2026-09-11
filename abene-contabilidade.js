/* Genius Raros — tabela de orçamento no relatório + exportação para o contabilista PT.
   CSV/Excel de trabalho: NÃO é fatura certificada, NÃO gera SAF-T/ATCUD. */
(function () {
    var NAVY = '#0B1223';
    var GOLD = '#C9A84C';

    function ed() {
        return (window.abene && window.abene.editor) || document.getElementById('editor');
    }
    function company() {
        return (window.abene && window.abene.companyData) || {};
    }
    function tt(key, fallback) {
        if (typeof t === 'function') {
            var v = t(key);
            if (v && v !== key) return v;
        }
        return fallback || key;
    }
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function parsePtNumber(raw) {
        var s = String(raw == null ? '' : raw).trim().replace(/\s/g, '').replace(/€/g, '').replace(/EUR/gi, '');
        if (!s) return 0;
        if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else s = s.replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    }
    function onlyDigits(s) { return String(s || '').replace(/\D+/g, ''); }
    function ptNif(nif) {
        var d = onlyDigits(nif);
        return d.length === 9 ? d : '';
    }
    function nifIsValid(nif) {
        var d = onlyDigits(nif);
        if (d.length !== 9) return false;
        var w = [9, 8, 7, 6, 5, 4, 3, 2];
        var sum = 0, i;
        for (i = 0; i < 8; i++) sum += parseInt(d.charAt(i), 10) * w[i];
        var chk = 11 - (sum % 11);
        if (chk >= 10) chk = 0;
        return chk === parseInt(d.charAt(8), 10);
    }
    function nifPack(raw, consumerFinal) {
        var d = onlyDigits(raw);
        if (consumerFinal || !d) {
            return { nif: '999999990', valido: 'SIM', consumidor: 'SIM', bruto: d };
        }
        return { nif: d, valido: nifIsValid(d) ? 'SIM' : 'NAO', consumidor: 'NAO', bruto: d };
    }
    function issuerNifPack(raw) {
        var d = onlyDigits(raw);
        return { nif: d, valido: d && nifIsValid(d) ? 'SIM' : 'NAO', consumidor: 'NAO', bruto: d };
    }
    function saftCode(paper) {
        if (!paper || paper.tipo === 'RELATORIO') return '';
        if (paper.codigoSAFT) return paper.codigoSAFT;
        return paper.tipo === 'RECIBO_COMERCIAL' ? 'RG' : 'OR';
    }
    function isExemptRegime(regime) {
        return regime === 'autoliquidacao' || regime === 'art9' || regime === 'art53';
    }
    function motivoIsencao(regime, rate) {
        if (regime === 'autoliquidacao') return 'M21';
        if (regime === 'art9') return 'M07';
        if (regime === 'art53') return 'M10';
        if (Number(rate) === 0) return 'M19';
        return '';
    }
    function addDaysIso(iso, days) {
        var d = new Date(String(iso || '') + 'T12:00:00');
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + (Number(days) || 0));
        return d.toISOString().slice(0, 10);
    }
    function ymParts(iso) {
        var s = isoDate(iso);
        return { ano: s.slice(0, 4), mes: s.slice(5, 7), iso: s };
    }
    function ptTaxCode(rate) {
        var r = Number(rate) || 0;
        if (r === 23) return 'NOR';
        if (r === 13) return 'INT';
        if (r === 6) return 'RED';
        if (r === 0) return 'ISE';
        return 'NOR';
    }
    function sncIva(rate) {
        var r = Number(rate) || 0;
        if (r === 23) return '2433';
        if (r === 13) return '2432';
        if (r === 6) return '2431';
        return '2433';
    }
    function csvEsc(v) {
        var s = String(v == null ? '' : v);
        if (/^[\t\r ]*[=+\-@]/.test(s)) s = "'" + s;
        if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }
    function decPt(n) { return (Number(n) || 0).toFixed(2).replace('.', ','); }
    function decDot(n) { return (Number(n) || 0).toFixed(2); }
    function isoDate(v) {
        if (!v) return new Date().toISOString().slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
        var d = new Date(v);
        return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
    }
    function finish() {
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof updateStats === 'function') updateStats();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (window.abene && window.abene.documentState) window.abene.documentState.dirty = true;
    }
    function downloadBlob(filename, content, mime) {
        var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

    function quoteTableHtml(kind) {
        var vat = company().vatRate != null ? company().vatRate : 23;
        var isWorks = kind === 'works';
        var title = isWorks ? 'Mapa de trabalhos (constatações → orçamento)' : 'Mapa de orçamento';
        var hint = isWorks
            ? 'Cada linha entra no orçamento (descrição + recomendação). Preencha quantidades e preços.'
            : 'Este quadro conta no relatório e alimenta o orçamento. Preencha as células e use « Criar orçamento ».';
        var head = isWorks
            ? '<th class="c-n">#</th>' +
              '<th>Constatação / Trabalho</th>' +
              '<th>Recomendação</th>' +
              '<th class="c-un">Un.</th>' +
              '<th class="c-qty">Qtd</th>' +
              '<th class="c-eur">Preço unit. s/ IVA</th>' +
              '<th class="c-iva">IVA %</th>' +
              '<th class="c-eur">Total s/ IVA</th>'
            : '<th class="c-n">#</th>' +
              '<th>Descrição</th>' +
              '<th class="c-un">Un.</th>' +
              '<th class="c-qty">Qtd</th>' +
              '<th class="c-eur">Preço unit. s/ IVA</th>' +
              '<th class="c-iva">IVA %</th>' +
              '<th class="c-eur">Total s/ IVA</th>';
        var rows = '';
        var i;
        for (i = 1; i <= 4; i++) {
            if (isWorks) {
                rows += '<tr>' +
                    '<td class="c-n">' + i + '</td>' +
                    '<td>&nbsp;</td>' +
                    '<td>&nbsp;</td>' +
                    '<td class="c-un">un</td>' +
                    '<td class="c-qty">1</td>' +
                    '<td class="c-eur">0,00</td>' +
                    '<td class="c-iva">' + vat + '</td>' +
                    '<td class="c-eur">0,00</td></tr>';
            } else {
                rows += '<tr>' +
                    '<td class="c-n">' + i + '</td>' +
                    '<td>&nbsp;</td>' +
                    '<td class="c-un">un</td>' +
                    '<td class="c-qty">1</td>' +
                    '<td class="c-eur">0,00</td>' +
                    '<td class="c-iva">' + vat + '</td>' +
                    '<td class="c-eur">0,00</td></tr>';
            }
        }
        var span = isWorks ? 7 : 6;
        return '<div class="abene-quote-block" data-abene-quote-kind="' + (isWorks ? 'works' : 'quote') + '">' +
            '<p class="gr-section-label">GENIUS RAROS</p>' +
            '<h2 class="gr-doc-title" style="font-size:14pt;margin:0 0 6px;">' + title + '</h2>' +
            '<p class="gr-iva-note">' + hint + '</p>' +
            '<table class="abene-quote-table devis-items-table gr-items" data-abene-quote-table="' + (isWorks ? 'works' : 'quote') + '">' +
            '<thead><tr>' + head + '</tr></thead><tbody>' + rows +
            '<tr data-abene-totals="1">' +
            '<td colspan="' + span + '" style="text-align:right;">Subtotal s/ IVA</td>' +
            '<td class="c-eur">0,00 €</td></tr>' +
            '</tbody></table></div><p></p>';
    }

    function insertQuoteTable(kind) {
        var editor = ed();
        if (!editor) return;
        editor.focus();
        var html = quoteTableHtml(kind || 'quote');
        var report = editor.querySelector('[data-abene-block="report"]');
        if (report) {
            var foot = report.querySelector('.gr-doc-foot');
            if (foot) foot.insertAdjacentHTML('beforebegin', html);
            else report.insertAdjacentHTML('beforeend', html);
        } else document.execCommand('insertHTML', false, html);
        finish();
        document.querySelectorAll('table[data-abene-quote-table]').forEach(refreshQuoteTableTotals);
        if (typeof showToast === 'function') {
            showToast(kind === 'works' ? tt('toastWorksTable', 'Tabela de trabalhos inserida.') : tt('toastQuoteTable', 'Tabela de orçamento inserida.'));
        }
    }

    function cellText(td) {
        return (td && (td.innerText || td.textContent) || '').replace(/\u00a0/g, ' ').trim();
    }

    function harvestTables() {
        var editor = ed();
        if (!editor) return [];
        var items = [];
        editor.querySelectorAll('table[data-abene-quote-table]').forEach(function (table) {
            var kind = table.getAttribute('data-abene-quote-table') || 'quote';
            table.querySelectorAll('tbody tr').forEach(function (tr) {
                if (tr.getAttribute('data-abene-totals')) return;
                var tds = tr.querySelectorAll('td');
                if (!tds.length) return;
                var desc, unit, qty, price, vat, rec;
                if (kind === 'works') {
                    desc = cellText(tds[1]);
                    rec = cellText(tds[2]);
                    unit = cellText(tds[3]) || 'un';
                    qty = parsePtNumber(cellText(tds[4]));
                    price = parsePtNumber(cellText(tds[5]));
                    vat = parsePtNumber(cellText(tds[6]));
                    if (rec) desc = desc ? (desc + ' — ' + rec) : rec;
                } else {
                    desc = cellText(tds[1]);
                    unit = cellText(tds[2]) || 'un';
                    qty = parsePtNumber(cellText(tds[3]));
                    price = parsePtNumber(cellText(tds[4]));
                    vat = parsePtNumber(cellText(tds[5]));
                }
                if (!desc && !price && !qty) return;
                if (!desc) return;
                items.push({
                    desc: desc,
                    unit: unit || 'un',
                    qty: qty || 1,
                    price: price,
                    vat: isNaN(vat) ? (company().vatRate || 23) : vat,
                    total: (qty || 1) * price
                });
            });
        });
        return items;
    }

    function fillDevisFromTables(force) {
        var items = harvestTables();
        if (!items.length) return 0;
        var container = document.getElementById('devisItems');
        if (!container) return 0;
        var existing = container.querySelectorAll('.devis-item-row');
        var hasData = false;
        existing.forEach(function (row) {
            var d = (row.querySelector('.item-desc') || {}).value || '';
            var p = parseFloat((row.querySelector('.item-price') || {}).value) || 0;
            if (d.trim() || p) hasData = true;
        });
        if (hasData && !force) return 0;
        container.innerHTML = '';
        items.forEach(function (it) {
            window.addDevisItem();
            var row = container.lastElementChild;
            if (!row) return;
            var desc = row.querySelector('.item-desc');
            var unit = row.querySelector('.item-unit');
            var qty = row.querySelector('.item-qty');
            var price = row.querySelector('.item-price');
            var vat = row.querySelector('.item-vat');
            if (desc) desc.value = it.desc;
            if (unit) unit.value = it.unit;
            if (qty) qty.value = it.qty;
            if (price) price.value = it.price;
            if (vat) vat.value = it.vat;
        });
        refreshDevisTotals();
        return items.length;
    }

    function refreshDevisTotals() {
        var box = document.getElementById('devisLiveTotals');
        if (!box || typeof window.abeneComercial === 'undefined') {
            var rows = document.querySelectorAll('#devisItems .devis-item-row');
            var sub = 0, iva = 0;
            var discount = parseFloat((document.getElementById('devisDiscount') || {}).value) || 0;
            var docVat = parseFloat((document.getElementById('devisTVA') || {}).value);
            if (isNaN(docVat)) docVat = 23;
            rows.forEach(function (row) {
                var qty = parseFloat((row.querySelector('.item-qty') || {}).value) || 0;
                var price = parseFloat((row.querySelector('.item-price') || {}).value) || 0;
                var vat = parseFloat((row.querySelector('.item-vat') || {}).value);
                if (isNaN(vat)) vat = docVat;
                var base = qty * price * (1 - discount / 100);
                sub += qty * price;
                iva += base * (vat / 100);
            });
            var after = sub * (1 - discount / 100);
            if (box) {
                box.innerHTML = '<strong>Subtotal s/ IVA</strong> ' + after.toFixed(2).replace('.', ',') +
                    ' € &nbsp;·&nbsp; <strong>IVA</strong> ' + iva.toFixed(2).replace('.', ',') +
                    ' € &nbsp;·&nbsp; <strong>Total c/ IVA</strong> ' + (after + iva).toFixed(2).replace('.', ',') + ' €';
            }
            return;
        }
        try {
            var data = window.abeneComercial.collectQuote();
            box.innerHTML = '<strong>Subtotal s/ IVA</strong> ' + (data.after || 0).toFixed(2).replace('.', ',') +
                ' € &nbsp;·&nbsp; <strong>IVA</strong> ' + (data.tvaAmount || 0).toFixed(2).replace('.', ',') +
                ' € &nbsp;·&nbsp; <strong>Total c/ IVA</strong> ' + (data.grand || 0).toFixed(2).replace('.', ',') + ' €';
        } catch (e) {}
    }

    function journalGet() {
        try { return JSON.parse(localStorage.getItem('abeneAccountingJournal') || '[]'); } catch (e) { return []; }
    }
    function journalPush(entry) {
        var list = journalGet().filter(function (e) {
            return !(e.tipo === entry.tipo && e.numero === entry.numero);
        });
        list.unshift(entry);
        try { localStorage.setItem('abeneAccountingJournal', JSON.stringify(list.slice(0, 250))); } catch (e) {}
    }

    function currentPapers() {
        var editor = ed();
        var out = [];
        if (editor) out = papersFromHtml(editor.innerHTML, { name: (window.abene && window.abene.documentState && window.abene.documentState.name) || 'Documento', pasta: '' });
        if (!out.length) {
            var j = journalGet();
            if (j.length) return j.slice(0, 1);
        }
        return out;
    }

    function harvestFromDevisBlock(block) {
        var items = [];
        var vat = parseFloat(block.getAttribute('data-abene-vat') || '');
        if (isNaN(vat)) vat = 23;
        var table = block.querySelector('table.devis-items-table, table.abene-quote-table');
        if (!table) return [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {
            if (tr.getAttribute('data-abene-totals')) return;
            var tds = tr.querySelectorAll('td');
            if (tds.length < 6) return;
            var desc = cellText(tds[1]);
            if (!desc) return;
            var unit = cellText(tds[2]) || 'un';
            var qty = parsePtNumber(cellText(tds[3]));
            var price = parsePtNumber(cellText(tds[4]));
            var lineVat = vat;
            if (tds.length >= 7) {
                var parsedVat = parsePtNumber(cellText(tds[5]));
                if (!isNaN(parsedVat)) lineVat = parsedVat;
            }
            items.push({ desc: desc, unit: unit, qty: qty || 1, price: price, vat: lineVat, total: (qty || 1) * price });
        });
        return items;
    }

    function harvestReportTables(report) {
        var items = [];
        if (!report) return items;
        report.querySelectorAll('table[data-abene-quote-table]').forEach(function (table) {
            if (table.closest('[data-abene-block="devis"], [data-abene-block="receipt"]')) return;
            var kind = table.getAttribute('data-abene-quote-table') || 'quote';
            table.querySelectorAll('tbody tr').forEach(function (tr) {
                if (tr.getAttribute('data-abene-totals')) return;
                var tds = tr.querySelectorAll('td');
                if (!tds.length) return;
                var desc = '', recommendation = '', unit = 'un', qty = 1, price = 0, vat = Number(company().vatRate) || 23;
                if (kind === 'works') {
                    if (tds.length < 8) return;
                    desc = cellText(tds[1]);
                    recommendation = cellText(tds[2]);
                    unit = cellText(tds[3]) || 'un';
                    qty = parsePtNumber(cellText(tds[4])) || 1;
                    price = parsePtNumber(cellText(tds[5]));
                    vat = parsePtNumber(cellText(tds[6]));
                    if (recommendation) desc = desc ? (desc + ' — ' + recommendation) : recommendation;
                } else {
                    if (tds.length < 7) return;
                    desc = cellText(tds[1]);
                    unit = cellText(tds[2]) || 'un';
                    qty = parsePtNumber(cellText(tds[3])) || 1;
                    price = parsePtNumber(cellText(tds[4]));
                    vat = parsePtNumber(cellText(tds[5]));
                }
                if (!desc) return;
                if (isNaN(vat)) vat = Number(company().vatRate) || 23;
                items.push({ desc: desc, unit: unit, qty: qty, price: price, vat: vat, total: qty * price });
            });
        });
        return items;
    }

    function decodePayload(el) {
        var b64 = el.getAttribute('data-abene-payload');
        if (!b64) return null;
        try {
            return JSON.parse(decodeURIComponent(escape(atob(b64))));
        } catch (e) {
            try { return JSON.parse(atob(b64)); } catch (e2) { return null; }
        }
    }
    function splitPostal(addr) {
        var s = String(addr || '').trim();
        var m = s.match(/(\d{4}-\d{3})\s+(.+)$/);
        if (m) {
            var before = s.slice(0, m.index).replace(/[,\s]+$/, '');
            return { morada: before || s, cp: m[1], local: m[2].trim() };
        }
        return { morada: s, cp: '', local: '' };
    }
    function papersFromHtml(html, entry, includeDrafts) {
        var out = [];
        if (!html) return out;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        wrap.querySelectorAll('[data-abene-block="devis"]').forEach(function (el) {
            var st = el.getAttribute('data-abene-status') || 'final';
            if (!includeDrafts && (st === 'draft' || st === 'preview')) return;
            var pay = decodePayload(el) || {};
            var vat = pay.tva != null ? Number(pay.tva) : parseFloat(el.getAttribute('data-abene-vat') || '23');
            if (isNaN(vat)) vat = 23;
            var items = Array.isArray(pay.items) && pay.items.length ? pay.items.map(function (it) {
                var copy = {
                    desc: it.desc || '', unit: it.unit || 'un',
                    qty: Number(it.qty) || 1, price: Number(it.price) || 0,
                    vat: it.vat == null || isNaN(Number(it.vat)) ? vat : Number(it.vat),
                    total: Number(it.total) || 0
                };
                return copy;
            }) : harvestFromDevisBlock(el);
            var ivaRegime = pay.ivaRegime || 'normal';
            if (isExemptRegime(ivaRegime)) {
                items.forEach(function (it) { it.vat = 0; });
            }
            var parsed = splitPostal(pay.clientAddress || '');
            out.push({
                tipo: 'ORCAMENTO',
                codigoSAFT: 'OR',
                familiaSAFT: 'working',
                sugestaoAT: 'FT',
                naoEFatura: 'SIM',
                label: 'Orcamento',
                numero: pay.number || el.getAttribute('data-abene-number') || (entry && entry.number) || '',
                data: isoDate(pay.date || el.getAttribute('data-abene-date') || (entry && (entry.documentDate || entry.archivedAt))),
                validity: pay.validity || 30,
                cliente: pay.client || el.getAttribute('data-abene-client') || (entry && entry.client) || '',
                nifCliente: pay.clientNif || el.getAttribute('data-abene-nif') || '',
                consumerFinal: !!pay.consumerFinal,
                morada: pay.clientAddress || '',
                postal: pay.clientPostal || parsed.cp,
                localidade: pay.clientLocalidade || parsed.local,
                email: pay.clientEmail || '',
                telefone: pay.clientPhone || '',
                contacto: pay.clientContact || '',
                objeto: pay.object || '',
                site: pay.site || '',
                payTerms: pay.payTerms || '',
                notes: pay.notes || '',
                discount: Number(pay.discount) || 0,
                discountAmount: Number(pay.discountAmount) || 0,
                ivaRegime: ivaRegime,
                total: Number(pay.grand || el.getAttribute('data-abene-total') || (entry && entry.total) || 0),
                items: items,
                pasta: (entry && entry.pasta) || '',
                arquivoNome: (entry && entry.name) || '',
                ownerId: entry ? (window.abeneArquivoApi && window.abeneArquivoApi.ownerIdOf(entry)) : '',
                status: (st === 'final' || (entry && entry.concluded)) ? 'final' : st,
                final: st === 'final' || !!(entry && entry.concluded),
                hasPdf: false
            });
        });
        wrap.querySelectorAll('[data-abene-block="receipt"]').forEach(function (el) {
            var st = el.getAttribute('data-abene-status') || 'final';
            if (!includeDrafts && (st === 'draft' || st === 'preview')) return;
            var pay = decodePayload(el) || {};
            var amt = Number(pay.amount != null ? pay.amount : el.getAttribute('data-abene-total')) || 0;
            var recVat = pay.vatRate != null ? Number(pay.vatRate) : 0;
            if (isNaN(recVat)) recVat = 0;
            var recParsed = splitPostal(pay.payerAddress || '');
            out.push({
                tipo: 'RECIBO_COMERCIAL',
                codigoSAFT: 'RG',
                familiaSAFT: 'payment',
                sugestaoAT: 'FT',
                naoEFatura: 'SIM',
                label: 'Recibo comercial',
                numero: pay.number || el.getAttribute('data-abene-number') || '',
                data: isoDate(pay.date || el.getAttribute('data-abene-date') || (entry && (entry.documentDate || entry.archivedAt))),
                validity: 0,
                cliente: pay.payerName || el.getAttribute('data-abene-client') || '',
                nifCliente: pay.payerNif || el.getAttribute('data-abene-nif') || '',
                consumerFinal: false,
                morada: pay.payerAddress || '',
                postal: pay.payerPostal || recParsed.cp,
                localidade: pay.payerLocalidade || recParsed.local,
                email: pay.payerEmail || '',
                telefone: '',
                contacto: '',
                objeto: pay.object || '',
                site: '',
                payTerms: '',
                notes: pay.notes || '',
                discount: 0,
                ivaRegime: recVat === 0 ? 'recibo' : 'normal',
                pagamento: pay.payMethod || '',
                referencia: pay.payRef || '',
                origem: pay.quoteRef || '',
                partial: !!pay.partial,
                total: amt,
                items: [{ desc: pay.object || 'Pagamento', unit: 'un', qty: 1, price: amt, vat: recVat, total: amt }],
                pasta: (entry && entry.pasta) || '',
                arquivoNome: (entry && entry.name) || '',
                ownerId: entry ? (window.abeneArquivoApi && window.abeneArquivoApi.ownerIdOf(entry)) : '',
                status: (st === 'final' || (entry && entry.concluded)) ? 'final' : st,
                final: st === 'final' || !!(entry && entry.concluded),
                hasPdf: false
            });
        });
        wrap.querySelectorAll('[data-abene-block="report"]').forEach(function (el) {
            var items = harvestReportTables(el);
            var titleEl = el.querySelector('.gr-doc-title, h1, h2');
            var title = cellText(titleEl) || (entry && entry.name) || 'Relatório técnico';
            var owner = entry ? (window.abeneArquivoApi && window.abeneArquivoApi.ownerIdOf(entry)) : '';
            out.push({
                tipo: 'RELATORIO',
                codigoSAFT: '',
                familiaSAFT: 'support',
                sugestaoAT: '',
                naoEFatura: 'SIM',
                label: 'Relatório técnico',
                numero: (entry && entry.number) || '',
                data: isoDate(entry && (entry.documentDate || entry.archivedAt)),
                validity: 0,
                cliente: (entry && entry.client) || '',
                nifCliente: (entry && entry.nif) || '',
                consumerFinal: false,
                morada: '', postal: '', localidade: '', email: '', telefone: '', contacto: '',
                objeto: title,
                site: (entry && entry.pasta) || '',
                payTerms: '', notes: '', discount: 0, discountAmount: 0,
                ivaRegime: 'normal',
                total: 0,
                items: items,
                pasta: (entry && entry.pasta) || '',
                arquivoNome: (entry && entry.name) || title,
                ownerId: owner || '',
                status: entry && entry.concluded ? 'final' : 'draft',
                final: !!(entry && entry.concluded),
                hasPdf: false
            });
        });
        return out;
    }
    function collectPackSources(entriesOverride, forceAllArchive) {
        var api = window.abeneArquivoApi;
        var limited = Array.isArray(entriesOverride);
        var entries = limited ? entriesOverride.slice() : [];
        var archiveOpen = !!document.querySelector('#arqOverlay.open');
        if (!limited && forceAllArchive && api && typeof api.allEntries === 'function') {
            entries = (api.allEntries() || []).slice();
        } else if (!limited && archiveOpen && api && typeof api.visibleEntries === 'function') {
            entries = api.visibleEntries() || [];
        } else if (!limited && api && typeof api.currentSnapshot === 'function') {
            entries = [api.currentSnapshot()];
        }
        entries = entries.filter(function (e) { return e && !e.deletedAt; });
        var papers = [];
        var seen = {};
        entries.forEach(function (e) {
            papersFromHtml(e.html || '', e, true).forEach(function (p) {
                var key = (p.ownerId || '') + '|' + (p.tipo || p.codigoSAFT || '') + '|' + (p.numero || '') + '|' + (p.cliente || '');
                if (seen[key]) return;
                seen[key] = true;
                papers.push(p);
            });
        });
        return { papers: papers, entries: entries };
    }

    function lineBases(paper) {
        var items = paper.items || [];
        var discount = Number(paper.discount) || 0;
        var ratio = 1 - (discount / 100);
        if (ratio < 0) ratio = 0;
        var bases = { 23: 0, 13: 0, 6: 0, 0: 0 };
        var ivas = { 23: 0, 13: 0, 6: 0, 0: 0 };
        var exempt = isExemptRegime(paper.ivaRegime);
        if (!items.length && paper.total) {
            bases[0] = paper.total;
            return { bases: bases, ivas: ivas, items: [], ratio: ratio };
        }
        items.forEach(function (it) {
            var rate = Number(it.vat);
            if (isNaN(rate)) rate = paper.tipo === 'RECIBO_COMERCIAL' ? 0 : 23;
            if (exempt) rate = 0;
            if (!(rate in bases)) bases[rate] = 0;
            if (!(rate in ivas)) ivas[rate] = 0;
            var gross = (Number(it.qty) || 0) * (Number(it.price) || 0);
            if (!gross && it.total) gross = Number(it.total) || 0;
            var base = gross * ratio;
            bases[rate] += base;
            ivas[rate] += base * (rate / 100);
        });
        return { bases: bases, ivas: ivas, items: items, ratio: ratio };
    }

    function splitSerie(num) {
        var r = String(num || '').trim();
        if (!r) return { serie: '', numero: '' };
        var m = r.match(/^([A-Za-z]+)-(\d{4})-(\d+)$/);
        if (m) return { serie: m[1] + '-' + m[2], numero: m[3] };
        return { serie: '', numero: r };
    }

    function accountingUse(paper) {
        if (paper.tipo === 'ORCAMENTO') {
            return {
                uso: 'BASE_PARA_FATURA',
                acao: 'Criar a fatura certificada depois de confirmar aceitacao e execucao.',
                faturar: 'SIM'
            };
        }
        if (paper.tipo === 'RECIBO_COMERCIAL') {
            return {
                uso: 'COMPROVATIVO_DE_PAGAMENTO',
                acao: 'Associar a fatura existente ou regularizar a fatura se ainda nao existir.',
                faturar: 'A_VALIDAR'
            };
        }
        var priced = (paper.items || []).some(function (it) { return Number(it.price) || Number(it.total); });
        return {
            uso: 'SUPORTE_TECNICO',
            acao: priced
                ? 'Analisar os trabalhos valorizados e criar a fatura se estiverem aceites ou executados.'
                : 'Anexar ao processo do cliente como relatorio tecnico.',
            faturar: priced ? 'A_VALIDAR' : 'NAO'
        };
    }

    function buildCsvPack(papers, decimalPt) {
        var co = company();
        var emit = issuerNifPack(co.nif);
        var fmt = decimalPt ? decPt : decDot;
        var docHdr = [
            'TipoDocumento', 'CodigoSAFT', 'FamiliaSAFT', 'Serie', 'Numero', 'Data', 'Ano', 'Mes', 'DataVencimento',
            'NIF_Emitente', 'NIF_Emitente_Valido', 'Nome_Emitente',
            'NIF_Cliente', 'NIF_Cliente_Valido', 'ConsumidorFinal', 'Nome_Cliente', 'Morada_Cliente',
            'CodigoPostal', 'Localidade', 'Pais', 'Email_Cliente', 'Telefone_Cliente', 'Contacto',
            'Pasta', 'Objeto', 'LocalObra', 'PrazoPagamento', 'Notas',
            'DescontoPercent', 'DescontoValor', 'RegimeIVA', 'MotivoIsencao',
            'Base_IVA23', 'IVA_23', 'Base_IVA13', 'IVA_13', 'Base_IVA6', 'IVA_6', 'Base_Isento',
            'Total_IVA', 'Total_Documento', 'Moeda', 'ContaSNC', 'IBAN',
            'MetodoPagamento', 'DocumentoOrigem', 'SugestaoDocumentoAT', 'NaoEFaturaAT',
            'UsoContabilista', 'AcaoContabilista', 'FaturaACriar', 'DocumentoABENE_NaoFatura', 'Aviso'
        ];
        var lineHdr = [
            'TipoDocumento', 'CodigoSAFT', 'Serie', 'Numero', 'Data', 'NIF_Emitente', 'NIF_Cliente',
            'Linha', 'Descricao', 'Quantidade', 'Unidade', 'PrecoUnitario_sIVA', 'DescontoPercent',
            'TaxaIVA', 'CodigoTaxa', 'MotivoIsencao',
            'BaseLinha', 'IVALinha', 'TotalLinha_cIVA', 'ContaSNC', 'ContaIVA', 'NaoEFaturaAT',
            'UsoContabilista', 'FaturaACriar', 'Aviso'
        ];
        var docs = [docHdr.map(csvEsc).join(';')];
        var lines = [lineHdr.map(csvEsc).join(';')];
        var aviso = 'Nao constitui fatura certificada AT (sem ATCUD/QR). Papel de trabalho para o TOC.';
        papers.forEach(function (p) {
            var sn = splitSerie(p.numero);
            var tb = lineBases(p);
            var cli = nifPack(p.nifCliente, p.consumerFinal);
            var ym = ymParts(p.data);
            var venc = p.tipo === 'ORCAMENTO' ? addDaysIso(ym.iso, p.validity || 30) : '';
            var totIva = 0, totBase = 0;
            Object.keys(tb.ivas).forEach(function (k) { totIva += tb.ivas[k]; totBase += tb.bases[k] || 0; });
            var total = totBase + totIva || p.total || 0;
            var parsed = splitPostal(p.morada);
            var cp = p.postal || parsed.cp;
            var loc = p.localidade || parsed.local;
            var motivo = motivoIsencao(p.ivaRegime, totIva === 0 && totBase ? 0 : 23);
            var use = accountingUse(p);
            docs.push([
                p.label || p.tipo, saftCode(p), p.familiaSAFT || 'working',
                sn.serie, sn.numero, ym.iso, ym.ano, ym.mes, venc,
                emit.nif, emit.valido, co.name || 'Genius Raros',
                cli.nif, cli.valido, cli.consumidor, p.cliente || '', p.morada || '',
                cp, loc, 'PT', p.email || '', p.telefone || '', p.contacto || '',
                p.pasta || '', p.objeto || '', p.site || '', p.payTerms || '', (p.notes || '').slice(0, 400),
                fmt(p.discount || 0), fmt(Number(p.discountAmount) || 0),
                p.ivaRegime || 'normal', motivo,
                fmt(tb.bases[23]), fmt(tb.ivas[23]), fmt(tb.bases[13]), fmt(tb.ivas[13]),
                fmt(tb.bases[6]), fmt(tb.ivas[6]), fmt(tb.bases[0]),
                fmt(totIva), fmt(total), 'EUR', '72', co.iban || '',
                p.pagamento || '', p.origem || '',
                p.sugestaoAT || '', p.naoEFatura || 'SIM',
                use.uso, use.acao, use.faturar, 'SIM', aviso
            ].map(csvEsc).join(';'));
            (tb.items.length ? tb.items : [{ desc: p.objeto || p.label, qty: 1, unit: 'un', price: total, vat: 0 }]).forEach(function (it, idx) {
                var rate = Number(it.vat);
                if (isNaN(rate)) rate = p.tipo === 'RECIBO_COMERCIAL' ? 0 : 23;
                if (isExemptRegime(p.ivaRegime)) rate = 0;
                var gross = (Number(it.qty) || 0) * (Number(it.price) || 0);
                if (!gross) gross = Number(it.total) || 0;
                var base = gross * (tb.ratio != null ? tb.ratio : 1);
                var iva = base * (rate / 100);
                var lineMotivo = motivoIsencao(p.ivaRegime, rate);
                lines.push([
                    p.label || p.tipo, saftCode(p), sn.serie, sn.numero, ym.iso,
                    emit.nif, cli.nif,
                    String(idx + 1), it.desc || '', it.qty || 1, it.unit || 'un', fmt(it.price),
                    fmt(p.discount || 0),
                    rate, ptTaxCode(rate), lineMotivo,
                    fmt(base), fmt(iva), fmt(base + iva),
                    '72', sncIva(rate), p.naoEFatura || 'SIM', use.uso, use.faturar, aviso
                ].map(csvEsc).join(';'));
            });
        });
        return { documentos: docs.join('\r\n') + '\r\n', linhas: lines.join('\r\n') + '\r\n' };
    }

    function buildResumoCsv(papers, decimalPt) {
        var fmt = decimalPt ? decPt : decDot;
        var hdr = ['TipoDocumento', 'Quantidade', 'BaseSemIVA', 'IVA', 'TotalComIVA', 'Finalizados', 'A_Faturar', 'A_Validar', 'Observacao'];
        var rows = [hdr.map(csvEsc).join(';')];
        ['RELATORIO', 'ORCAMENTO', 'RECIBO_COMERCIAL', 'TOTAL'].forEach(function (tipo) {
            var list = tipo === 'TOTAL' ? papers : papers.filter(function (p) { return p.tipo === tipo; });
            if (tipo !== 'TOTAL' && !list.length) return;
            var base = 0, iva = 0, total = 0, finals = 0, faturar = 0, validar = 0;
            list.forEach(function (p) {
                var calc = lineBases(p);
                Object.keys(calc.bases).forEach(function (k) { base += Number(calc.bases[k]) || 0; });
                Object.keys(calc.ivas).forEach(function (k) { iva += Number(calc.ivas[k]) || 0; });
                var use = accountingUse(p);
                if (use.faturar === 'SIM') faturar += 1;
                if (use.faturar === 'A_VALIDAR') validar += 1;
                if (p.final || p.status === 'final') finals += 1;
            });
            total = base + iva;
            var note = tipo === 'ORCAMENTO'
                ? 'Potencial faturacao; confirmar aceitacao e execucao.'
                : (tipo === 'RECIBO_COMERCIAL'
                    ? 'Fluxo de pagamento; nao somar novamente como faturacao.'
                    : (tipo === 'RELATORIO'
                        ? 'Suporte tecnico; valores podem repetir um orcamento.'
                        : 'TOTAL INDICATIVO NAO FISCAL; pode conter valores repetidos entre relatorio, orcamento e recibo.'));
            rows.push([tipo, list.length, fmt(base), fmt(iva), fmt(total), finals, faturar, validar, note].map(csvEsc).join(';'));
        });
        return rows.join('\r\n') + '\r\n';
    }

    function buildClientsCsv(papers) {
        var hdr = ['Nome', 'Contribuinte', 'Morada', 'Codigo Postal', 'Localidade', 'Pais', 'E-mail', 'Telefone', 'Observacoes'];
        var rows = [hdr.map(csvEsc).join(';')];
        var seen = {};
        papers.forEach(function (p) {
            var cli = nifPack(p.nifCliente, p.consumerFinal);
            var key = cli.nif + '|' + String(p.cliente || '').toLowerCase();
            if (seen[key]) return;
            seen[key] = true;
            var parsed = splitPostal(p.morada);
            var note = [];
            if (cli.consumidor === 'SIM') note.push('Consumidor final AT 999999990');
            if (cli.valido === 'NAO') note.push('NIF invalido (digito de controlo) — confirmar no VIES/AT');
            else note.push('Importado do Genius Raros — confirmar NIF no VIES/AT');
            rows.push([
                p.cliente || 'Consumidor final',
                cli.nif,
                parsed.morada || p.morada || '',
                p.postal || parsed.cp,
                p.localidade || parsed.local,
                'Portugal',
                p.email || '',
                p.telefone || '',
                note.join(' | ')
            ].map(csvEsc).join(';'));
        });
        return rows.join('\r\n') + '\r\n';
    }

    function buildEmpresaCsv() {
        var co = company();
        var emit = issuerNifPack(co.nif);
        var hdr = ['Nome', 'FormaJuridica', 'NIF', 'NIF_Valido', 'CAE', 'Morada', 'Pais', 'Telefone', 'Email', 'Website', 'IBAN', 'BIC', 'RegimeIVA', 'TaxaIVAPredefinida', 'Moeda'];
        var row = [
            co.name || 'Genius Raros', co.legalForm || '', emit.nif, emit.valido, co.cae || '',
            co.address || '', co.country || 'Portugal', co.phone || '', co.email || '', co.website || '',
            co.iban || '', co.bic || '', co.vatRegime || 'normal', co.vatRate != null ? co.vatRate : 23,
            co.currency || 'EUR'
        ];
        return hdr.map(csvEsc).join(';') + '\r\n' + row.map(csvEsc).join(';') + '\r\n';
    }

    function buildArtigosCsv(papers, decimalPt) {
        var fmt = decimalPt ? decPt : decDot;
        var hdr = ['Numero', 'Nome', 'Unidade', 'Preco', 'IVA', 'Observacoes'];
        var rows = [hdr.map(csvEsc).join(';')];
        var seen = {};
        var n = 0;
        papers.forEach(function (p) {
            if (p.tipo !== 'ORCAMENTO' && p.tipo !== 'RELATORIO') return;
            (p.items || []).forEach(function (it) {
                var name = String(it.desc || '').trim();
                if (!name) return;
                var key = name.toLowerCase();
                if (seen[key]) return;
                seen[key] = true;
                n += 1;
                var ref = 'GR-' + ('0000' + n).slice(-4);
                var rate = Number(it.vat);
                if (isNaN(rate) || isExemptRegime(p.ivaRegime)) rate = isExemptRegime(p.ivaRegime) ? 0 : 23;
                rows.push([ref, name, it.unit || 'un', fmt(it.price), String(rate),
                    'Servico Genius Raros — mapear no Moloni (Tabelas > Importar artigos)'].map(csvEsc).join(';'));
            });
        });
        return rows.join('\r\n') + '\r\n';
    }

    function buildControloCsv(papers) {
        var co = company();
        var hdr = ['Gravidade', 'Tipo', 'Numero', 'Cliente', 'Campo', 'Detalhe'];
        var rows = [hdr.map(csvEsc).join(';')];
        function push(grav, p, campo, detalhe) {
            rows.push([grav, (p && p.label) || '', (p && p.numero) || '', (p && p.cliente) || '', campo, detalhe].map(csvEsc).join(';'));
        }
        var emit = issuerNifPack(co.nif);
        if (!onlyDigits(co.nif)) push('ERRO', null, 'NIF_Emitente', 'NIF da empresa vazio nas Definicoes — o TOC nao pode emitir FT.');
        else if (emit.valido === 'NAO') push('ERRO', null, 'NIF_Emitente', 'NIF da empresa invalido (digito de controlo).');
        if (!co.cae) push('AVISO', null, 'CAE', 'CAE da empresa nao preenchido nas Definicoes.');
        if (!co.iban) push('AVISO', null, 'IBAN', 'IBAN da empresa vazio.');
        papers.forEach(function (p) {
            var cli = nifPack(p.nifCliente, p.consumerFinal);
            if (cli.consumidor === 'SIM' && !p.consumerFinal && !onlyDigits(p.nifCliente)) {
                push('AVISO', p, 'NIF_Cliente', 'Sem NIF — exportado como consumidor final 999999990.');
            }
            if (cli.valido === 'NAO') push('ERRO', p, 'NIF_Cliente', 'NIF ' + cli.nif + ' falha o digito de controlo.');
            if (!(p.morada || '').trim()) push('AVISO', p, 'Morada', 'Morada do cliente vazia.');
            if (!(p.postal || splitPostal(p.morada).cp)) push('AVISO', p, 'CodigoPostal', 'Codigo postal ausente (formato 0000-000).');
            if (!(p.email || '').trim()) push('AVISO', p, 'Email', 'E-mail do cliente vazio.');
            if (p.tipo === 'ORCAMENTO' && (Number(p.discount) || 0) > 0) {
                push('INFO', p, 'Desconto', 'Desconto de ' + p.discount + '% aplicado nas bases de IVA do CSV.');
            }
            if (isExemptRegime(p.ivaRegime)) {
                push('AVISO', p, 'RegimeIVA', 'Regime ' + p.ivaRegime + ' — motivo ' + motivoIsencao(p.ivaRegime, 0) + '. Confirmar na FT certificada.');
            }
            if (p.tipo === 'RECIBO_COMERCIAL' && !(p.origem || '').trim()) {
                push('AVISO', p, 'DocumentoOrigem', 'Recibo sem n. de orcamento associado.');
            }
            if (p.tipo === 'RELATORIO' && !(p.items || []).length) {
                push('INFO', p, 'FaturaACriar', 'Relatorio sem linhas valorizadas — exportado apenas como suporte tecnico.');
            }
            if (p.tipo === 'ORCAMENTO' && p.total) {
                var tb = lineBases(p);
                var totIva = 0, totBase = 0;
                Object.keys(tb.ivas).forEach(function (k) { totIva += tb.ivas[k]; totBase += tb.bases[k] || 0; });
                var calc = totBase + totIva;
                if (Math.abs(calc - Number(p.total)) > 0.05) {
                    push('AVISO', p, 'Total', 'Total payload ' + decDot(p.total) + ' vs CSV ' + decDot(calc) + ' (apos desconto).');
                }
            }
        });
        if (rows.length === 1) push('INFO', null, 'Pack', 'Nenhuma anomalia detetada.');
        return rows.join('\r\n') + '\r\n';
    }

    function buildReceiptsCsv(papers, decimalPt) {
        var fmt = decimalPt ? decPt : decDot;
        var hdr = [
            'TipoDocumento', 'CodigoSAFT', 'Numero', 'Data', 'NIF_Cliente', 'Nome_Cliente',
            'ValorRecebido', 'MetodoPagamento', 'ReferenciaPagamento', 'DocumentoOrigem',
            'NaoEFaturaAT', 'Aviso'
        ];
        var rows = [hdr.map(csvEsc).join(';')];
        papers.filter(function (p) { return p.tipo === 'RECIBO_COMERCIAL'; }).forEach(function (p) {
            var cli = nifPack(p.nifCliente, p.consumerFinal);
            rows.push([
                p.label, p.codigoSAFT, p.numero, isoDate(p.data),
                cli.nif, p.cliente || '',
                fmt(p.total), p.pagamento || '', p.referencia || '', p.origem || '',
                'SIM', 'Recibo comercial entre partes. O recibo oficial AT emite-se apos a fatura certificada.'
            ].map(csvEsc).join(';'));
        });
        return rows.join('\r\n') + '\r\n';
    }

    function buildTocJournalCsv(papers) {
        var hdr = [
            'Numero de ordem do lancamento', 'Diario', 'Tipo de Documento',
            'Data de lancamento', 'Data de documento', 'Descricao', 'Vossa referencia',
            'Controlo de terceiros', 'NIF do terceiro', 'Nome do terceiro',
            'Codigo da conta a movimentar', 'Descricao do movimento', 'Debito', 'Credito',
            'Codigo de IVA', 'Aviso'
        ];
        var rows = [hdr.map(csvEsc).join(';')];
        var ordem = 0;
        var aviso = 'SUGESTAO — copiar para o modelo Excel do TOConline (Contabilidade > Configuracao > Importacao de lancamentos). Nao importar orcamentos. Diario e Tipo de Documento devem coincidir com o vosso cadastro.';
        papers.forEach(function (p) {
            if (p.tipo !== 'RECIBO_COMERCIAL') return;
            ordem += 1;
            var amt = decDot(p.total);
            var nif = nifPack(p.nifCliente, p.consumerFinal).nif;
            var nome = p.cliente || 'Consumidor final';
            var desc = 'Recebimento ' + (p.numero || '') + (p.objeto ? ' — ' + p.objeto : '');
            var c = (window.abene && window.abene.companyData) || {};
            var diario = String(c.tocDiario || 'VEN').toUpperCase();
            var tipoDoc = String(c.tocTipoDoc || 'RG').toUpperCase();
            var common = [String(ordem), diario, tipoDoc, isoDate(p.data), isoDate(p.data), desc, p.numero || '',
                'Cliente', nif, nome];
            rows.push(common.concat(['12', 'Recebimento em caixa/banco', amt, '', 'Nao usar codigo de IVA', aviso]).map(csvEsc).join(';'));
            rows.push(common.concat(['211', 'Cliente — adiantamento / conta corrente', '', amt, 'Nao usar codigo de IVA', aviso]).map(csvEsc).join(';'));
        });
        return rows.join('\r\n') + '\r\n';
    }

    function readmePt() {
        return [
            'Genius Raros — pack para o contabilista (Portugal)',
            '',
            '========== AVISO LEGAL ==========',
            'ESTE PACOTE NAO E FATURA CERTIFICADA PELA AT.',
            'Nao contem ATCUD, codigo QR, hash SAF-T nem ficheiro SAF-T (PT).',
            'Nao substitui software certificado (Moloni, TOConline, InvoiceXpress, PHC, Primavera, Sage)',
            'nem o Portal das Financas. O pack inclui RELATORIOS TECNICOS, ORCAMENTOS e',
            'RECIBOS COMERCIAIS. Relatorios nao recebem codigo SAF-T; a coluna CodigoSAFT nunca e FT.',
            'A fatura com ATCUD emite-se no programa certificado do TOC, com base nestes dados.',
            '',
            '========== CONVENCOES ==========',
            '- Separador CSV: ponto e virgula (;) — Excel portugues abre-o diretamente',
            '- Codificacao: UTF-8 com BOM',
            '- *excel-PT.csv : decimal com virgula (1.234,56 estilo Excel PT: 1234,56)',
            '- *import-ERP.csv : decimal com ponto (1234.56) — Sage / Primavera / PHC / Moloni mapeamento',
            '- Consumidor sem NIF = 999999990 (pratica AT)',
            '- CodigoTaxa SAF-T: NOR 23%  INT 13%  RED 6%  ISE 0%',
            '- MotivoIsencao: M21 autoliquidacao construcao, M07 art. 9. CIVA, M10 art. 53. CIVA, M19 outra isencao',
            '- Conta SNC 72 (prestacoes de servicos — canalizacao / construcao)',
            '- IVA liquidado: 2433 normal, 2432 intermedia, 2431 reduzida',
            '- SugestaoDocumentoAT = FT : quando o TOC emitir a fatura oficial, usar tipo Fatura',
            '- NaoEFaturaAT = SIM : estes CSV nao devem ser importados como faturacao certificada',
            '',
            '========== FICHEIROS ==========',
            '00_controlo.csv',
            '   Lista de ERRO / AVISO / INFO (NIF, morada, CAE, desconto, autoliquidacao). Abrir primeiro.',
            '',
            '00_empresa.csv',
            '   Ficha do emitente (Genius Raros): NIF, CAE, IBAN, regime IVA.',
            '',
            '01_clientes_moloni.csv',
            '   Colunas Moloni (Tabelas > Importar de XLS/CSV > Clientes):',
            '   Nome, Contribuinte, Morada, Codigo Postal, Localidade, Pais, E-mail, Telefone.',
            '   Mapear as colunas no assistente. Atualizar existentes = Sim (chave = Contribuinte).',
            '   TOConline: Empresa > Entidades > Clientes > Importar clientes.',
            '   O TOC so aceita o modelo Excel DESCARREGADO do TOConline — copiar estas colunas',
            '   para esse modelo (nao carregar este CSV diretamente se o TOC recusar ficheiros externos).',
            '',
            '02_documentos_excel-PT.csv  /  04_documentos_import-ERP.csv',
            '   Cabecalho por relatorio/orcamento/recibo: bases de IVA, totais, NIF, serie/numero.',
            '   UsoContabilista, AcaoContabilista e FaturaACriar explicam como tratar cada documento.',
            '   Moloni NAO importa documentos por CSV (so por SAF-T certificado). Usar estes dados',
            '   para criar a Fatura (FT) no software certificado, linha a linha ou por copia.',
            '   PHC CS: Copiar dados de um ficheiro .xls nas linhas do documento (cabecalhos da grelha).',
            '   Primavera / Sage: mapear colunas no importador de contas correntes / dossiers.',
            '',
            '03_linhas_excel-PT.csv  /  05_linhas_import-ERP.csv',
            '   Uma linha por artigo. Quantidade, preco s/ IVA, taxa, codigo NOR/INT/RED/ISE.',
            '',
            '06_recibos.csv',
            '   Comprovativos de pagamento entre partes. Nao sao recibos AT.',
            '   Depois de emitir a FT no software certificado, liquidar com o recibo oficial desse programa.',
            '',
            '07_sugestao_lancamentos_TOConline.csv',
            '   APENAS recibos comerciais (orcamentos nao se lancam).',
            '   Colunas alinhadas com TOConline > Contabilidade > Configuracao > Importacao de lancamentos:',
            '   Numero de ordem, Diario, Tipo de Documento, Datas, Descricao, Vossa referencia,',
            '   Controlo de terceiros, NIF, Nome, Conta, Debito, Credito.',
            '   OBRIGATORIO: descarregar o modelo Excel do proprio TOConline e copiar as linhas.',
            '   Diario e Tipo de Documento vêm das Definições da empresa (predefinição VEN / RG).',
            '   Lancamento sugerido: Debito 12 (caixa/banco) / Credito 211 (cliente), valor recebido.',
            '   A fatura posterior: Debito 211 / Credito 72 + 243x (o software certificado faz isto sozinho).',
            '',
            '08_mapa.xls',
            '   Abre no Excel para o TOC ver documentos e linhas numa folha so.',
            '',
            '09_artigos_moloni.csv',
            '   Tabelas > Importar artigos: Numero, Nome, Unidade, Preco, IVA.',
            '',
            '10_resumo_excel-PT.csv',
            '   Totais e quantidades por tipo de documento para controlar o periodo exportado.',
            '',
            '11_parametros_exportacao.json',
            '   Data da exportacao, filtros aplicados e quantidade de documentos selecionados.',
            '',
            'PDF/',
            '   Versoes finais gravadas no Arquivo e 00_indice_PDF.csv, se existirem.',
            '',
            '========== O QUE NAO FAZER ==========',
            '- Nao gerar nem importar um SAF-T caseiro com tipo FT: isso aparentaria faturas reais.',
            '- Nao comunicar estes documentos a AT.',
            '- Nao tratar o recibo comercial Genius Raros como recibo de software certificado.',
            '',
            '========== FLUXO RECOMENDADO PARA O TOC ==========',
            '0. Abrir 00_controlo.csv — corrigir ERRO (NIF) antes de importar clientes.',
            '1. Importar 01_clientes_moloni.csv (Moloni) ou copiar para o Excel modelo TOConline.',
            '2. (Opcional) Importar 09_artigos_moloni.csv.',
            '3. Abrir 02/03 (ou 08_mapa.xls) e emitir a FATURA certificada (FT) no vosso programa.',
            '4. Anexar os PDF da pasta PDF/ ao processo do cliente.',
            '5. Se houve recebimento: liquidar a FT com o recibo oficial do programa certificado.',
            '6. (Opcional) Copiar 07_ para o modelo de lancamentos TOConline, apos rever Diario/Tipo.',
            ''
        ].join('\r\n');
    }

    function htmlExcel(papers) {
        var pack = buildCsvPack(papers, true);
        function tableFromCsv(csv) {
            var rows = csv.trim().split(/\r?\n/);
            return '<table border="1">' + rows.map(function (line, i) {
                var cells = line.split(';');
                var tag = i === 0 ? 'th' : 'td';
                return '<tr>' + cells.map(function (c) {
                    return '<' + tag + '>' + esc(c.replace(/^"|"$/g, '').replace(/""/g, '"')) + '</' + tag + '>';
                }).join('') + '</tr>';
            }).join('') + '</table>';
        }
        return '\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>' +
            '<h2>Documentos</h2>' + tableFromCsv(pack.documentos) +
            '<h2>Linhas</h2>' + tableFromCsv(pack.linhas) +
            '<p>Nao constitui fatura certificada AT.</p></body></html>';
    }

    function fillZipCore(zip, papers, exportMeta) {
        var excelPt = buildCsvPack(papers, true);
        var erp = buildCsvPack(papers, false);
        zip.file('LEIA-ME.txt', readmePt());
        zip.file('00_controlo.csv', '\uFEFF' + buildControloCsv(papers));
        zip.file('00_empresa.csv', '\uFEFF' + buildEmpresaCsv());
        zip.file('01_clientes_moloni.csv', '\uFEFF' + buildClientsCsv(papers));
        zip.file('02_documentos_excel-PT.csv', '\uFEFF' + excelPt.documentos);
        zip.file('03_linhas_excel-PT.csv', '\uFEFF' + excelPt.linhas);
        zip.file('04_documentos_import-ERP.csv', '\uFEFF' + erp.documentos);
        zip.file('05_linhas_import-ERP.csv', '\uFEFF' + erp.linhas);
        zip.file('06_recibos.csv', '\uFEFF' + buildReceiptsCsv(papers, true));
        zip.file('07_sugestao_lancamentos_TOConline.csv', '\uFEFF' + buildTocJournalCsv(papers));
        zip.file('08_mapa.xls', htmlExcel(papers));
        zip.file('09_artigos_moloni.csv', '\uFEFF' + buildArtigosCsv(papers, true));
        zip.file('10_resumo_excel-PT.csv', '\uFEFF' + buildResumoCsv(papers, true));
        zip.file('11_parametros_exportacao.json', JSON.stringify(exportMeta || {
            generatedAt: new Date().toISOString(),
            documentCount: papers.length
        }, null, 2));
    }

    function attachFinalPdfs(zip, entries, papers) {
        var api = window.abeneArquivoApi;
        if (!api || !entries || !entries.length) return Promise.resolve();
        var san = api.sanitizeName || function (s) { return String(s || 'doc').replace(/[\\/:*?"<>|]/g, '-'); };
        var fileBase = api.archiveFileBase || function (e) { return san(e && e.name || 'documento'); };
        var allowed = {};
        (papers || []).forEach(function (p) {
            var owner = String(p.ownerId || '');
            if (!owner) return;
            if (!allowed[owner]) allowed[owner] = {};
            if (p.tipo === 'RELATORIO') allowed[owner].relatorio = true;
            if (p.tipo === 'ORCAMENTO') allowed[owner].orcamento = true;
            if (p.tipo === 'RECIBO_COMERCIAL') allowed[owner].recibo = true;
        });
        var index = [['Cliente', 'Pasta', 'TipoArquivo', 'Numero', 'DataDocumento', 'EtapaPDF', 'Revisao', 'Ficheiro']
            .map(csvEsc).join(';')];
        var attached = 0;
        return Promise.all(entries.map(function (e) {
            var owner = api.ownerIdOf ? api.ownerIdOf(e) : e.id;
            if (!owner || typeof api.listFinals !== 'function') return Promise.resolve();
            return api.listFinals(owner).then(function (rows) {
                (rows || []).forEach(function (r) {
                    if (!r.blob) return;
                    if (!allowed[String(owner)] || !allowed[String(owner)][r.etape]) return;
                    var matchedPaper = (papers || []).filter(function (p) {
                        if (String(p.ownerId || '') !== String(owner)) return false;
                        if (r.etape === 'relatorio') return p.tipo === 'RELATORIO';
                        if (r.etape === 'orcamento') return p.tipo === 'ORCAMENTO';
                        if (r.etape === 'recibo') return p.tipo === 'RECIBO_COMERCIAL';
                        return false;
                    })[0] || null;
                    var base = fileBase(e);
                    var folder = ['PDF', san(e.client || 'Cliente'), base].join('/');
                    var path = folder + '/' + base + '_' + r.etape + '_v' + r.rev + '.pdf';
                    zip.file(path, r.blob);
                    attached += 1;
                    index.push([
                        e.client || (matchedPaper && matchedPaper.cliente) || '',
                        e.pasta || (matchedPaper && matchedPaper.pasta) || '',
                        e.type || (matchedPaper && matchedPaper.tipo) || '',
                        e.number || (matchedPaper && matchedPaper.numero) || '',
                        isoDate(e.documentDate || (matchedPaper && matchedPaper.data) || e.archivedAt),
                        r.etape || '', r.rev || '', path
                    ]
                        .map(csvEsc).join(';'));
                });
            });
        })).then(function () {
            if (attached) zip.file('PDF/00_indice_PDF.csv', '\uFEFF' + index.join('\r\n') + '\r\n');
            else zip.file('PDF/LEIA-ME.txt', 'Nenhum PDF final corresponde aos documentos selecionados. Finalize os documentos no Arquivo para os incluir aqui.\r\n');
            return attached;
        });
    }

    function exportAccounting() {
        var papers = currentPapers();
        if (!papers.length) {
            alert(tt('acctEmpty', 'Não há relatório, orçamento nem recibo no documento para exportar.'));
            return;
        }
        var stamp = new Date().toISOString().slice(0, 10);
        var base = (papers[0].numero || 'GR').replace(/[^\w\-]+/g, '_') + '_' + stamp;
        if (window.JSZip) {
            var zip = new JSZip();
            fillZipCore(zip, papers);
            zip.generateAsync({ type: 'blob' }).then(function (blob) {
                downloadBlob(base + '_contabilidade-PT.zip', blob, 'application/zip');
                if (typeof showToast === 'function') showToast(tt('toastAcctOk', 'Pacote de contabilidade PT descarregado.'));
            });
            return;
        }
        var excelPt = buildCsvPack(papers, true);
        downloadBlob(base + '_linhas_excel-PT.csv', '\uFEFF' + excelPt.linhas, 'text/csv;charset=utf-8');
        if (typeof showToast === 'function') showToast(tt('toastAcctOk', 'CSV de contabilidade PT descarregado.'));
    }

    function downloadPackContabilista(opts) {
        opts = opts || {};
        var src = collectPackSources(opts.entries);
        if (!src.papers.length) {
            var fallback = !Array.isArray(opts.entries) ? collectPackSources(undefined, true) : { papers: [], entries: [] };
            if (fallback.papers.length) {
                src = fallback;
                opts.defaultScope = 'all';
            } else {
                if (typeof showToast === 'function') showToast(tt('packEmpty', 'Não há relatórios, orçamentos nem recibos disponíveis para o contabilista.'));
                else alert(tt('packEmpty', 'Não há relatórios, orçamentos nem recibos disponíveis para o contabilista.'));
                return;
            }
        }
        if (opts.skipChooser !== true && typeof window.openGenericModal === 'function') {
            openPackChooser(src, opts);
            return;
        }
        runPackDownload(src, {
            skipChooser: true,
            includeCsv: opts.includeCsv !== false,
            includePdf: opts.includePdf !== false,
            exportMeta: opts.exportMeta || null
        });
    }

    window.downloadPackContabilistaSelect = function (opts) {
        downloadPackContabilista(Object.assign({}, opts || {}, { select: true }));
    };

    function localIso(d) {
        return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
    function packPeriodBounds(preset) {
        var now = new Date();
        var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var end = new Date(start.getTime());
        if (preset === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (preset === 'previousMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (preset === 'year') start = new Date(now.getFullYear(), 0, 1);
        else if (preset !== 'today') return { from: '', to: '' };
        return { from: localIso(start), to: localIso(end) };
    }
    function paperKey(p) {
        return [p.ownerId || '', p.tipo || '', p.numero || '', p.data || '', p.cliente || '', p.arquivoNome || ''].join('|');
    }
    function openPackChooser(src, openOpts) {
        openOpts = openOpts || {};
        var fixedSelection = Array.isArray(openOpts.entries);
        var archiveOpen = !!document.querySelector('#arqOverlay.open');
        var allSrc = fixedSelection ? src : collectPackSources(undefined, true);
        var chosen = {};
        (allSrc.papers || []).concat(src.papers || []).forEach(function (p) { chosen[paperKey(p)] = true; });
        var scopeHtml = fixedSelection
            ? '<input type="hidden" id="packScope" value="selected"><p class="pack-note">' + esc(tt('packScopeSelected', 'Seleção atual do Arquivo')) + '</p>'
            : '<label class="pack-field"><span>' + esc(tt('packScope', 'Origem')) + '</span><select id="packScope">' +
              '<option value="visible">' + esc(archiveOpen ? tt('packScopeVisible', 'Documentos visíveis no Arquivo') : tt('packScopeCurrent', 'Documento atual')) + '</option>' +
              '<option value="all">' + esc(tt('packScopeAll', 'Todo o Arquivo')) + '</option></select></label>';
        var body = '<style>' +
            '.pack-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}.pack-field{display:grid;gap:4px;font-size:12px}.pack-field>span,.pack-group-title{font-weight:700;color:#243247}.pack-field input,.pack-field select{min-height:36px;border:1px solid #c8d0da;border-radius:4px;padding:6px 8px;background:#fff}.pack-types,.pack-outputs{display:flex;gap:10px 16px;flex-wrap:wrap}.pack-types label,.pack-outputs label,.pack-check{display:flex;gap:7px;align-items:center;font-size:12px}.pack-section{border-top:1px solid #d7dde5;margin-top:10px;padding-top:10px}.pack-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.pack-summary{font-size:12px;font-weight:700;color:#243247;background:#f2f5f8;padding:8px;border-radius:4px}.pack-note{font-size:12px;color:#596579;margin:0}.pack-doc{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;padding:7px 4px;border-bottom:1px solid #edf0f3;font-size:12px}.pack-doc small{display:block;color:#687386;margin-top:2px}.pack-total{font-weight:700;white-space:nowrap}@media(max-width:600px){.pack-grid{grid-template-columns:1fr}.pack-doc{grid-template-columns:auto 1fr}.pack-total{grid-column:2}.pack-actions button{min-height:40px}}' +
            '</style><p class="pack-note">' + esc(tt('packChooserHint', 'Escolha livremente a origem, o período, os tipos e os ficheiros do pack.')) + '</p>' +
            '<div class="pack-grid pack-section">' + scopeHtml +
            '<label class="pack-field"><span>' + esc(tt('packPeriod', 'Período')) + '</span><select id="packPeriod">' +
            '<option value="all">' + esc(tt('packPeriodAll', 'Todas as datas')) + '</option>' +
            '<option value="today">' + esc(tt('packPeriodToday', 'Hoje')) + '</option>' +
            '<option value="month">' + esc(tt('packPeriodMonth', 'Este mês')) + '</option>' +
            '<option value="previousMonth">' + esc(tt('packPeriodPreviousMonth', 'Mês anterior')) + '</option>' +
            '<option value="year">' + esc(tt('packPeriodYear', 'Este ano')) + '</option>' +
            '<option value="custom">' + esc(tt('packPeriodCustom', 'Datas personalizadas')) + '</option></select></label>' +
            '<label class="pack-field"><span>' + esc(tt('packDateFrom', 'Data inicial')) + '</span><input type="date" id="packDateFrom"></label>' +
            '<label class="pack-field"><span>' + esc(tt('packDateTo', 'Data final')) + '</span><input type="date" id="packDateTo"></label></div>' +
            '<label class="pack-check"><input type="checkbox" id="packIncludeUndated" checked> ' + esc(tt('packIncludeUndated', 'Incluir documentos sem data')) + '</label>' +
            '<div class="pack-section"><div class="pack-group-title">' + esc(tt('packTypes', 'Tipos de documento')) + '</div><div class="pack-types">' +
            '<label><input type="checkbox" class="pack-type-cb" value="RELATORIO" checked> ' + esc(tt('packTypeReport', 'Relatórios')) + '</label>' +
            '<label><input type="checkbox" class="pack-type-cb" value="ORCAMENTO" checked> ' + esc(tt('packTypeQuote', 'Orçamentos')) + '</label>' +
            '<label><input type="checkbox" class="pack-type-cb" value="RECIBO_COMERCIAL" checked> ' + esc(tt('packTypeReceipt', 'Recibos')) + '</label>' +
            '<label><input type="checkbox" id="packFinalsOnly"> ' + esc(tt('packFinalsOnly', 'Só versões finais / concluídos')) + '</label></div></div>' +
            '<div class="pack-section"><div class="pack-group-title">' + esc(tt('packContents', 'Conteúdo do ficheiro')) + '</div><div class="pack-outputs">' +
            '<label><input type="checkbox" id="packIncludeCsv" checked> ' + esc(tt('packIncludeCsv', 'CSV para Excel / importação ERP')) + '</label>' +
            '<label><input type="checkbox" id="packIncludePdf" checked> ' + esc(tt('packIncludePdf', 'PDFs finais gravados no Arquivo')) + '</label></div></div>' +
            '<div class="pack-section"><div class="pack-actions"><label class="pack-check"><input type="checkbox" id="packAllDocs" checked> ' + esc(tt('packAllDocs', 'Selecionar todos os resultados filtrados')) + '</label>' +
            '<button type="button" class="btn-secondary" id="packSelectAllBtn">' + esc(tt('packSelectAll', 'Selecionar tudo')) + '</button>' +
            '<button type="button" class="btn-secondary" id="packSelectNoneBtn">' + esc(tt('packSelectNone', 'Limpar seleção')) + '</button></div>' +
            '<div class="pack-summary" id="packSummary"></div><div id="packDocList" style="max-height:260px;overflow:auto;margin-top:6px;border:1px solid #d7dde5;border-radius:4px;padding:0 6px;"></div></div>';

        function syncChosen() {
            document.querySelectorAll('.pack-doc-cb').forEach(function (cb) {
                chosen[cb.getAttribute('data-key') || ''] = !!cb.checked;
            });
        }
        function sourceNow() {
            var scope = (document.getElementById('packScope') || {}).value || 'visible';
            return scope === 'all' ? allSrc : src;
        }
        function filterNow() {
            var base = sourceNow();
            var allowedTypes = {};
            document.querySelectorAll('.pack-type-cb:checked').forEach(function (cb) { allowedTypes[cb.value] = true; });
            var from = (document.getElementById('packDateFrom') || {}).value || '';
            var to = (document.getElementById('packDateTo') || {}).value || '';
            var includeUndated = !!(document.getElementById('packIncludeUndated') || {}).checked;
            var finalsOnly = !!(document.getElementById('packFinalsOnly') || {}).checked;
            return (base.papers || []).filter(function (p) {
                if (!allowedTypes[p.tipo]) return false;
                if (finalsOnly && !(p.final || p.status === 'final')) return false;
                var d = isoDate(p.data);
                if (!d) return includeUndated;
                if (from && d < from) return false;
                if (to && d > to) return false;
                return true;
            });
        }
        function paperLabel(p, i) {
            var name = p.tipo === 'RELATORIO' ? tt('packTypeReportOne', 'Relatório') : (p.tipo === 'ORCAMENTO' ? tt('packTypeQuoteOne', 'Orçamento') : tt('packTypeReceiptOne', 'Recibo'));
            return esc((p.numero || ('#' + (i + 1))) + ' — ' + (p.cliente || tt('packNoClient', 'Sem cliente')) + ' — ' + name);
        }
        function renderDocs() {
            syncChosen();
            var box = document.getElementById('packDocList');
            var summary = document.getElementById('packSummary');
            if (!box) return;
            var papers = filterNow();
            box._papers = papers;
            var total = 0;
            papers.forEach(function (p) {
                var tb = lineBases(p), one = 0;
                Object.keys(tb.bases).forEach(function (k) { one += Number(tb.bases[k]) || 0; });
                Object.keys(tb.ivas).forEach(function (k) { one += Number(tb.ivas[k]) || 0; });
                total += one || Number(p.total) || 0;
            });
            if (summary) summary.textContent = tt('packSummary', '{n} documento(s) · total indicativo {total} €')
                .replace('{n}', String(papers.length)).replace('{total}', decPt(total));
            box.innerHTML = papers.map(function (p, i) {
                var k = paperKey(p);
                var tb = lineBases(p), one = 0;
                Object.keys(tb.bases).forEach(function (rate) { one += Number(tb.bases[rate]) || 0; });
                Object.keys(tb.ivas).forEach(function (rate) { one += Number(tb.ivas[rate]) || 0; });
                return '<label class="pack-doc"><input type="checkbox" class="pack-doc-cb" data-key="' + esc(k) + '" data-i="' + i + '"' + (chosen[k] !== false ? ' checked' : '') + '>' +
                    '<span>' + paperLabel(p, i) + '<small>' + esc((isoDate(p.data) || tt('packNoDate', 'Sem data')) + (p.objeto ? ' · ' + p.objeto : '')) + '</small></span>' +
                    '<span class="pack-total">' + decPt(one || p.total || 0) + ' €</span></label>';
            }).join('') || ('<p style="padding:10px;font-size:12px;">' + esc(tt('packNoResults', 'Nenhum documento corresponde a estes filtros.')) + '</p>');
            var all = document.getElementById('packAllDocs');
            if (all) all.checked = papers.length > 0 && papers.every(function (p) { return chosen[paperKey(p)] !== false; });
        }
        function setPeriod() {
            var preset = (document.getElementById('packPeriod') || {}).value || 'all';
            if (preset !== 'custom') {
                var bounds = packPeriodBounds(preset);
                document.getElementById('packDateFrom').value = bounds.from;
                document.getElementById('packDateTo').value = bounds.to;
            }
            renderDocs();
        }
        function bindChange(id, fn) {
            var el = document.getElementById(id);
            if (el) el.onchange = fn || renderDocs;
        }

        if (typeof window.openGenericModal === 'function') {
            window.openGenericModal(
                tt('packChooserTitle', 'Pack contabilista — seleção profissional'),
                body,
                '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button class="btn-primary" id="packGoBtn">' + esc(tt('packDownload', 'Descarregar pack')) + '</button>'
            );
            setTimeout(function () {
                var scope = document.getElementById('packScope');
                if (scope && openOpts.defaultScope) scope.value = openOpts.defaultScope;
                renderDocs();
                bindChange('packScope');
                bindChange('packPeriod', setPeriod);
                bindChange('packIncludeUndated');
                bindChange('packFinalsOnly');
                document.querySelectorAll('.pack-type-cb').forEach(function (cb) { cb.onchange = renderDocs; });
                ['packDateFrom', 'packDateTo'].forEach(function (id) {
                    bindChange(id, function () {
                        var preset = document.getElementById('packPeriod');
                        if (preset) preset.value = 'custom';
                        renderDocs();
                    });
                });
                var all = document.getElementById('packAllDocs');
                if (all) all.onchange = function () {
                    var papers = filterNow();
                    papers.forEach(function (p) { chosen[paperKey(p)] = !!all.checked; });
                    renderDocs();
                };
                var selectAll = document.getElementById('packSelectAllBtn');
                if (selectAll) selectAll.onclick = function () {
                    filterNow().forEach(function (p) { chosen[paperKey(p)] = true; });
                    renderDocs();
                };
                var selectNone = document.getElementById('packSelectNoneBtn');
                if (selectNone) selectNone.onclick = function () {
                    filterNow().forEach(function (p) { chosen[paperKey(p)] = false; });
                    renderDocs();
                };
                var go = document.getElementById('packGoBtn');
                if (go) go.onclick = function () {
                    syncChosen();
                    var visible = filterNow();
                    var selected = visible.filter(function (p) { return chosen[paperKey(p)] !== false; });
                    if (!selected.length) {
                        if (typeof showToast === 'function') showToast(tt('packSelectOne', 'Selecione pelo menos um documento.'));
                        return;
                    }
                    var includeCsv = !!(document.getElementById('packIncludeCsv') || { checked: true }).checked;
                    var includePdf = !!(document.getElementById('packIncludePdf') || { checked: true }).checked;
                    if (!includeCsv && !includePdf) {
                        if (typeof showToast === 'function') showToast(tt('packNeedOutput', 'Escolha CSV, PDFs ou ambos.'));
                        return;
                    }
                    var source = sourceNow();
                    var api = window.abeneArquivoApi;
                    var selectedEntries = (source.entries || []).filter(function (entry) {
                        var owner = api && api.ownerIdOf ? api.ownerIdOf(entry) : entry.id;
                        return selected.some(function (paper) {
                            if (paper.ownerId && owner) return String(paper.ownerId) === String(owner);
                            return paper.numero && String(entry.number || '') === String(paper.numero);
                        });
                    });
                    var types = [];
                    document.querySelectorAll('.pack-type-cb:checked').forEach(function (cb) { types.push(cb.value); });
                    var meta = {
                        generatedAt: new Date().toISOString(),
                        scope: (document.getElementById('packScope') || {}).value || 'visible',
                        period: (document.getElementById('packPeriod') || {}).value || 'all',
                        dateFrom: (document.getElementById('packDateFrom') || {}).value || '',
                        dateTo: (document.getElementById('packDateTo') || {}).value || '',
                        includeUndated: !!(document.getElementById('packIncludeUndated') || {}).checked,
                        documentTypes: types,
                        finalsOnly: !!(document.getElementById('packFinalsOnly') || {}).checked,
                        documentCount: selected.length
                    };
                    if (typeof closeModal === 'function') closeModal('genericModal');
                    runPackDownload({ papers: selected, entries: selectedEntries }, {
                        skipChooser: true,
                        includeCsv: includeCsv,
                        includePdf: includePdf,
                        exportMeta: meta
                    });
                };
            }, 40);
        } else {
            runPackDownload(src, { skipChooser: true });
        }
    }

    function runPackDownload(src, opts) {
        opts = opts || {};
        var stamp = new Date().toISOString().slice(0, 10);
        var includeCsv = opts.includeCsv !== false;
        var includePdf = opts.includePdf !== false;
        if (!window.JSZip) {
            if (includeCsv) downloadBlob('01_clientes_moloni.csv', '\uFEFF' + buildClientsCsv(src.papers), 'text/csv;charset=utf-8');
            return;
        }
        var zip = new JSZip();
        if (includeCsv) fillZipCore(zip, src.papers, opts.exportMeta);
        else zip.file('LEIA-ME.txt', 'Pack parcial — só PDFs selecionados.\n');
        var pdfPromise = includePdf ? attachFinalPdfs(zip, src.entries, src.papers) : Promise.resolve(0);
        pdfPromise.then(function (pdfCount) {
            if (includeCsv && opts.exportMeta) {
                opts.exportMeta.pdfCount = Number(pdfCount) || 0;
                zip.file('11_parametros_exportacao.json', JSON.stringify(opts.exportMeta, null, 2));
            }
            return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) {
            var meta = opts.exportMeta || {};
            var period = meta.dateFrom || meta.dateTo
                ? [meta.dateFrom || 'inicio', meta.dateTo || 'fim'].join('_a_')
                : (meta.period && meta.period !== 'all' ? meta.period : 'todas-as-datas');
            downloadBlob('Pacote_Contabilista_PT_' + period.replace(/[^a-zA-Z0-9_-]+/g, '-') + '_' + stamp + '.zip', blob, 'application/zip');
            var emit = issuerNifPack(company().nif);
            var msg = tt('packOk', 'Pack contabilista PT descarregado (' + src.papers.length + ' documento(s)).');
            if (!onlyDigits(company().nif) || emit.valido === 'NAO') {
                msg = 'Pack descarregado. Ver 00_controlo.csv: NIF da empresa em falta ou inválido.';
            }
            if (typeof showToast === 'function') showToast(msg);
        }).catch(function () {
            if (typeof showToast === 'function') showToast(tt('packFail', 'Não foi possível criar o pack. Tente novamente.'));
        });
    }

    function refreshQuoteTableTotals(table) {
        if (!table) return;
        var kind = table.getAttribute('data-abene-quote-table');
        var isWorks = kind === 'works';
        var qtyI = isWorks ? 4 : 3;
        var priceI = isWorks ? 5 : 4;
        var totI = isWorks ? 7 : 6;
        var sum = 0;
        table.querySelectorAll('tbody tr').forEach(function (tr) {
            if (tr.getAttribute('data-abene-totals')) return;
            var tds = tr.querySelectorAll('td');
            if (tds.length <= totI) return;
            var qty = parsePtNumber(cellText(tds[qtyI]));
            var price = parsePtNumber(cellText(tds[priceI]));
            var tot = qty * price;
            tds[totI].textContent = tot.toFixed(2).replace('.', ',') + ' €';
            sum += tot;
        });
        var foot = table.querySelector('tr[data-abene-totals] td:last-child');
        if (foot) foot.textContent = sum.toFixed(2).replace('.', ',') + ' €';
    }

    document.addEventListener('input', function (e) {
        if (e.target && e.target.closest && e.target.closest('#devisItems, #devisDiscount, #devisTVA, #devisIvaRegime')) {
            refreshDevisTotals();
        }
        var qt = e.target && e.target.closest && e.target.closest('table[data-abene-quote-table]');
        if (qt) refreshQuoteTableTotals(qt);
    });
    document.addEventListener('change', function (e) {
        if (e.target && (e.target.id === 'devisIvaRegime' || e.target.id === 'devisTVA' || e.target.id === 'devisDiscount')) {
            refreshDevisTotals();
        }
    });

    window.insertQuoteTable = function () { insertQuoteTable('quote'); };
    window.insertWorksTable = function () { insertQuoteTable('works'); };
    window.exportAccountingPt = exportAccounting;
    window.downloadPackContabilista = downloadPackContabilista;
    window.downloadPackContabilistaSelect = function (opts) {
        downloadPackContabilista(Object.assign({}, opts || {}, { select: true }));
    };
    window.importQuoteTableToModal = function () {
        var n = fillDevisFromTables(true);
        if (typeof showToast === 'function') {
            showToast(n ? (n + ' ' + tt('toastImportedLines', 'linha(s) importada(s) do relatório.')) : tt('acctNoTable', 'Não há tabela de orçamento no relatório.'));
        }
        refreshDevisTotals();
    };

    window.abeneContabilidade = {
        insertQuoteTable: insertQuoteTable,
        harvestTables: harvestTables,
        fillDevisFromTables: fillDevisFromTables,
        refreshDevisTotals: refreshDevisTotals,
        refreshQuoteTableTotals: refreshQuoteTableTotals,
        journalPush: journalPush,
        exportAccounting: exportAccounting,
        downloadPackContabilista: downloadPackContabilista,
        downloadPackContabilistaSelect: function (opts) { downloadPackContabilista(Object.assign({}, opts || {}, { select: true })); }
    };
})();
