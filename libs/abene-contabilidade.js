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
                data: isoDate(pay.date || el.getAttribute('data-abene-date') || (entry && entry.archivedAt)),
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
                data: isoDate(pay.date || el.getAttribute('data-abene-date') || (entry && entry.archivedAt)),
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
        return out;
    }
    function collectPackSources() {
        var api = window.abeneArquivoApi;
        var entries = [];
        var archiveOpen = !!document.querySelector('#arqOverlay.open');
        if (archiveOpen && api && typeof api.visibleEntries === 'function') {
            entries = api.visibleEntries() || [];
        }
        if (!archiveOpen && api && typeof api.allEntries === 'function') {
            entries = (api.allEntries() || []).slice();
            if (typeof api.currentSnapshot === 'function') entries.unshift(api.currentSnapshot());
        }
        if (!entries.length && !archiveOpen && api && typeof api.allEntries === 'function') {
            entries = (api.allEntries() || []).slice();
            if (typeof api.currentSnapshot === 'function') entries.unshift(api.currentSnapshot());
        }
        var papers = [];
        var seen = {};
        entries.forEach(function (e) {
            papersFromHtml(e.html || '', e, true).forEach(function (p) {
                var key = (p.codigoSAFT || '') + '|' + (p.numero || '') + '|' + (p.cliente || '');
                if (seen[key]) return;
                seen[key] = true;
                papers.push(p);
            });
        });
        if (!papers.length && !archiveOpen && api && typeof api.allEntries === 'function') {
            (api.allEntries() || []).forEach(function (e) {
                papersFromHtml(e.html || '', e, true).forEach(function (p) {
                    var key = (p.codigoSAFT || '') + '|' + (p.numero || '') + '|' + (p.cliente || '');
                    if (!seen[key]) { seen[key] = true; papers.push(p); }
                });
            });
        }
        if (!papers.length && !archiveOpen && api && typeof api.currentSnapshot === 'function') {
            var snap = api.currentSnapshot();
            papers = papersFromHtml(snap.html || '', snap, true);
            if (!entries.length) entries = [snap];
        }
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
        var m = r.match(/^([A-Za-z]+)-(\d{4})-(\d+)$/);
        if (m) return { serie: m[1] + '-' + m[2], numero: m[3] };
        return { serie: 'ORC', numero: r || '1' };
    }

    function buildCsvPack(papers, decimalPt) {
        var co = company();
        var emit = nifPack(co.nif, false);
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
            'MetodoPagamento', 'DocumentoOrigem', 'SugestaoDocumentoAT', 'NaoEFaturaAT', 'Aviso'
        ];
        var lineHdr = [
            'TipoDocumento', 'CodigoSAFT', 'Serie', 'Numero', 'Data', 'NIF_Emitente', 'NIF_Cliente',
            'Linha', 'Descricao', 'Quantidade', 'Unidade', 'PrecoUnitario_sIVA', 'DescontoPercent',
            'TaxaIVA', 'CodigoTaxa', 'MotivoIsencao',
            'BaseLinha', 'IVALinha', 'TotalLinha_cIVA', 'ContaSNC', 'ContaIVA', 'NaoEFaturaAT', 'Aviso'
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
            docs.push([
                p.label || p.tipo, p.codigoSAFT || 'OR', p.familiaSAFT || 'working',
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
                p.sugestaoAT || 'FT', p.naoEFatura || 'SIM', aviso
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
                    p.label || p.tipo, p.codigoSAFT || 'OR', sn.serie, sn.numero, ym.iso,
                    emit.nif, cli.nif,
                    String(idx + 1), it.desc || '', it.qty || 1, it.unit || 'un', fmt(it.price),
                    fmt(p.discount || 0),
                    rate, ptTaxCode(rate), lineMotivo,
                    fmt(base), fmt(iva), fmt(base + iva),
                    '72', sncIva(rate), p.naoEFatura || 'SIM', aviso
                ].map(csvEsc).join(';'));
            });
        });
        return { documentos: docs.join('\r\n') + '\r\n', linhas: lines.join('\r\n') + '\r\n' };
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
        var emit = nifPack(co.nif, false);
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
            if (p.tipo !== 'ORCAMENTO') return;
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
        var emit = nifPack(co.nif, false);
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
            'nem o Portal das Financas. Os documentos Genius Raros sao ORCAMENTO (codigo SAF-T OR) e',
            'RECIBO COMERCIAL (RG). A coluna CodigoSAFT nunca e FT.',
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
            '   Cabecalho por orcamento/recibo: bases de IVA por taxa, totais, NIF, serie/numero.',
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
            'PDF/',
            '   Versoes finais gravadas no Arquivo (relatorio / orcamento / recibo), se existirem.',
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

    function fillZipCore(zip, papers) {
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
    }

    function attachFinalPdfs(zip, entries) {
        var api = window.abeneArquivoApi;
        if (!api || !entries || !entries.length) return Promise.resolve();
        var san = api.sanitizeName || function (s) { return String(s || 'doc').replace(/[\\/:*?"<>|]/g, '-'); };
        var fileBase = api.archiveFileBase || function (e) { return san(e && e.name || 'documento'); };
        return Promise.all(entries.map(function (e) {
            var owner = api.ownerIdOf ? api.ownerIdOf(e) : e.id;
            if (!owner || typeof api.listFinals !== 'function') return Promise.resolve();
            return api.listFinals(owner).then(function (rows) {
                (rows || []).forEach(function (r) {
                    if (!r.blob) return;
                    var base = fileBase(e);
                    var folder = ['PDF', san(e.client || 'Cliente'), base].join('/');
                    zip.file(folder + '/' + base + '_' + r.etape + '_v' + r.rev + '.pdf', r.blob);
                });
            });
        }));
    }

    function exportAccounting() {
        var papers = currentPapers();
        if (!papers.length) {
            alert(tt('acctEmpty', 'Não há orçamento nem recibo no documento para exportar.'));
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
        var src = collectPackSources();
        if (!src.papers.length) {
            if (typeof showToast === 'function') showToast(tt('packEmpty', 'Não há orçamento nem recibo nesta vista para o contabilista.'));
            else alert(tt('packEmpty', 'Não há orçamento nem recibo nesta vista para o contabilista.'));
            return;
        }
        if (opts.skipChooser !== true && typeof window.openGenericModal === 'function') {
            openPackChooser(src);
            return;
        }
        runPackDownload(src, {
            skipChooser: true,
            includeCsv: opts.includeCsv !== false,
            includePdf: opts.includePdf !== false
        });
    }

    window.downloadPackContabilistaSelect = function () {
        downloadPackContabilista({ select: true });
    };

    function openPackChooser(src) {
        var finalsOnly = false;
        var body = '<p style="font-size:12px;color:#555;margin:0 0 10px;">' +
            tt('packChooserHint', 'Escolha o que incluir no pack contabilista PT.') + '</p>' +
            '<label style="display:flex;gap:8px;align-items:center;margin:6px 0;"><input type="checkbox" id="packAllDocs" checked> ' +
            tt('packAllDocs', 'Todos os documentos desta vista') + ' (' + src.papers.length + ')</label>' +
            '<label style="display:flex;gap:8px;align-items:center;margin:6px 0;"><input type="checkbox" id="packFinalsOnly"> ' +
            tt('packFinalsOnly', 'Só versões finais / concluídos') + '</label>' +
            '<label style="display:flex;gap:8px;align-items:center;margin:6px 0;"><input type="checkbox" id="packIncludeCsv" checked> ' +
            tt('packIncludeCsv', 'CSV / pack PT (Moloni, ERP, TOConline)') + '</label>' +
            '<label style="display:flex;gap:8px;align-items:center;margin:6px 0;"><input type="checkbox" id="packIncludePdf" checked> ' +
            tt('packIncludePdf', 'PDFs finais gravados no Arquivo') + '</label>' +
            '<div id="packDocList" style="max-height:220px;overflow:auto;border:1px solid #ddd;margin-top:8px;padding:6px;"></div>';

        function paperLabel(p, i) {
            return (p.numero || ('#' + (i + 1))) + ' — ' + (p.cliente || '') + ' — ' + (p.tipo || '');
        }
        function renderDocs() {
            var box = document.getElementById('packDocList');
            if (!box) return;
            finalsOnly = !!(document.getElementById('packFinalsOnly') || {}).checked;
            var entries = src.entries || [];
            var papers = src.papers || [];
            if (finalsOnly) {
                papers = papers.filter(function (p) {
                    return entries.some(function (e) {
                        return e.concluded && String(e.number || '') === String(p.numero || '');
                    }) || p.final === true || p.status === 'final';
                });
                if (!papers.length) {
                    papers = (src.papers || []).filter(function () { return false; });
                    entries.filter(function (e) { return e.concluded; }).forEach(function (e) {
                        papersFromHtml(e.html || '', e, true).forEach(function (p) { papers.push(p); });
                    });
                }
            }
            box._papers = papers;
            box.innerHTML = papers.map(function (p, i) {
                return '<label style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;font-size:12px;">' +
                    '<input type="checkbox" class="pack-doc-cb" data-i="' + i + '" checked> ' +
                    '<span>' + String(paperLabel(p, i)).replace(/</g, '&lt;') + '</span></label>';
            }).join('') || ('<p style="padding:8px;font-size:12px;">' + tt('packEmpty', 'Nada a incluir.') + '</p>');
        }

        if (typeof window.openGenericModal === 'function') {
            window.openGenericModal(
                tt('packChooserTitle', 'Pack contabilista — seleção'),
                body,
                '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + tt('cancel', 'Cancelar') + '</button>' +
                '<button class="btn-primary" id="packGoBtn">' + tt('packDownload', 'Descarregar pack') + '</button>'
            );
            setTimeout(function () {
                renderDocs();
                var all = document.getElementById('packAllDocs');
                var fin = document.getElementById('packFinalsOnly');
                if (fin) fin.onchange = function () {
                    if (fin.checked && all) all.checked = false;
                    renderDocs();
                };
                if (all) all.onchange = function () {
                    if (all.checked && fin) fin.checked = false;
                    renderDocs();
                };
                var go = document.getElementById('packGoBtn');
                if (go) go.onclick = function () {
                    var box = document.getElementById('packDocList');
                    var papers = (box && box._papers) || src.papers;
                    var selected = [];
                    document.querySelectorAll('.pack-doc-cb').forEach(function (cb) {
                        if (cb.checked) {
                            var i = Number(cb.getAttribute('data-i'));
                            if (papers[i]) selected.push(papers[i]);
                        }
                    });
                    if (!selected.length) {
                        if (typeof showToast === 'function') showToast(tt('packEmpty', 'Selecione pelo menos um documento.'));
                        return;
                    }
                    var includeCsv = !!(document.getElementById('packIncludeCsv') || { checked: true }).checked;
                    var includePdf = !!(document.getElementById('packIncludePdf') || { checked: true }).checked;
                    var api = window.abeneArquivoApi;
                    var selectedEntries = (src.entries || []).filter(function (entry) {
                        var owner = api && api.ownerIdOf ? api.ownerIdOf(entry) : entry.id;
                        return selected.some(function (paper) {
                            if (paper.ownerId && owner) return String(paper.ownerId) === String(owner);
                            return paper.numero && String(entry.number || '') === String(paper.numero);
                        });
                    });
                    if (typeof closeModal === 'function') closeModal('genericModal');
                    runPackDownload({ papers: selected, entries: selectedEntries }, {
                        skipChooser: true,
                        includeCsv: includeCsv,
                        includePdf: includePdf
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
        if (includeCsv) fillZipCore(zip, src.papers);
        else zip.file('LEIA-ME.txt', 'Pack parcial — só PDFs selecionados.\n');
        var pdfPromise = includePdf ? attachFinalPdfs(zip, src.entries) : Promise.resolve();
        pdfPromise.then(function () {
            return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) {
            downloadBlob('Pacote_Contabilista_PT_' + stamp + '.zip', blob, 'application/zip');
            var emit = nifPack(company().nif, false);
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
    window.downloadPackContabilistaSelect = function () {
        downloadPackContabilista({ select: true });
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
        downloadPackContabilistaSelect: function () { downloadPackContabilista({ select: true }); }
    };
})();
