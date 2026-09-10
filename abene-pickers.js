/* Genius Raros — Escolher clientes / artigos já guardados (Sheets, Excel, Arquivo). */
(function (root) {
    function tt(key, fb) {
        if (typeof root.t === 'function') {
            var v = root.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
    }
    function toast(msg) {
        if (typeof root.showToast === 'function') root.showToast(msg);
    }
    function field(rec, keys) {
        var i, k, v;
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            v = rec[k];
            if (v == null) v = rec[String(k).toLowerCase()];
            if (v == null) v = rec[String(k).toUpperCase()];
            if (v != null && String(v).trim()) return String(v).trim();
        }
        return '';
    }
    function normClient(rec) {
        if (!rec || typeof rec !== 'object') return null;
        var nom = field(rec, ['nom', 'nome', 'nombre', 'name', 'Nome', 'cliente', 'Client', 'client']);
        if (!nom) return null;
        return {
            nom: nom,
            nif: field(rec, ['nif', 'NIF', 'siret', 'vat']),
            morada: field(rec, ['morada', 'adresse', 'address', 'dirección', 'Adresse', 'addr']),
            telefone: field(rec, ['telefone', 'téléphone', 'phone', 'teléfono', 'tel', 'Telephone']),
            email: field(rec, ['email', 'Email', 'mail']),
            localidade: field(rec, ['localidade', 'city', 'ville', 'cidade']),
            postal: field(rec, ['postal', 'cp', 'zip', 'codigo_postal', 'código postal'])
        };
    }
    function collectClients() {
        var out = [];
        var seen = {};
        function add(rec) {
            var c = normClient(rec);
            if (!c) return;
            var key = (c.nif || c.nom).toLowerCase();
            if (seen[key]) return;
            seen[key] = 1;
            out.push(c);
        }
        try {
            if (typeof root.abeneSheetsMetierSnapshot === 'function') {
                var m = root.abeneSheetsMetierSnapshot() || {};
                (m.clients || []).forEach(add);
            }
        } catch (e0) {}
        try {
            if (root.AbeneExcel && typeof root.AbeneExcel.getMetierRows === 'function') {
                (root.AbeneExcel.getMetierRows('CLIENTS') || []).forEach(add);
            }
        } catch (e1) {}
        try {
            var api = root.abeneArquivoApi;
            if (api && typeof api.allEntries === 'function') {
                (api.allEntries() || []).forEach(function (e) {
                    if (e && e.client) add({ nom: e.client, nif: e.nif || '' });
                });
            }
            if (api && typeof api.lastJob === 'function') {
                var job = api.lastJob() || {};
                if (job.client) add({
                    nom: job.client,
                    nif: job.nif,
                    email: job.email,
                    morada: job.address,
                    telefone: job.phone
                });
            }
        } catch (e2) {}
        try {
            var raw = JSON.parse(localStorage.getItem('abeneLastJobV1') || '{}');
            if (raw.client) add(raw);
            if (raw.nom) add(raw);
        } catch (e3) {}
        var locSort = (typeof localStorage !== 'undefined' && localStorage.getItem('abeneLanguage')) || 'pt-PT';
        out.sort(function (a, b) { return a.nom.localeCompare(b.nom, locSort); });
        return out;
    }
    function collectArticles() {
        var out = [];
        var seen = {};
        function add(rec) {
            if (!rec) return;
            var d = field(rec, ['designation', 'designação', 'designación', 'description', 'descrição', 'descripción', 'desc', 'nome', 'name', 'Designation']);
            if (!d) return;
            var key = d.toLowerCase();
            if (seen[key]) return;
            seen[key] = 1;
            out.push({
                designation: d,
                code: field(rec, ['code', 'código', 'codigo', 'sku']),
                unite: field(rec, ['unite', 'unidade', 'unidad', 'unit', 'un']) || 'un',
                prix: field(rec, ['prix_unitaire', 'preço_unitário', 'precio_unitario', 'unit_price', 'price', 'preco', 'prix']),
                tva: field(rec, ['tva', 'vat', 'iva']) || '23'
            });
        }
        try {
            if (typeof root.abeneSheetsMetierSnapshot === 'function') {
                var m = root.abeneSheetsMetierSnapshot() || {};
                (m.articles || []).forEach(add);
            }
        } catch (e0) {}
        try {
            if (root.AbeneExcel && typeof root.AbeneExcel.getMetierRows === 'function') {
                (root.AbeneExcel.getMetierRows('ARTICLES') || []).forEach(add);
            }
        } catch (e1) {}
        try {
            var opts = JSON.parse(localStorage.getItem('abeneRecentDescs') || '[]');
            if (Array.isArray(opts)) opts.forEach(function (d) { add({ designation: d }); });
        } catch (e2) {}
        return out;
    }
    function rememberDesc(text) {
        text = String(text || '').trim();
        if (!text || text.length < 2) return;
        var list = [];
        try { list = JSON.parse(localStorage.getItem('abeneRecentDescs') || '[]'); } catch (e) { list = []; }
        if (!Array.isArray(list)) list = [];
        list = list.filter(function (x) { return String(x).toLowerCase() !== text.toLowerCase(); });
        list.unshift(text);
        list = list.slice(0, 40);
        try { localStorage.setItem('abeneRecentDescs', JSON.stringify(list)); } catch (e2) {}
        refreshDatalists();
    }
    function setVal(id, v) {
        var el = document.getElementById(id);
        if (el) el.value = v == null ? '' : String(v);
    }
    function applyClient(target, c) {
        if (!c) return;
        if (target === 'receipt') {
            setVal('receiptPayerName', c.nom);
            setVal('receiptPayerNif', c.nif);
            setVal('receiptPayerAddress', c.morada);
            setVal('receiptPayerEmail', c.email);
            setVal('receiptPayerPostal', c.postal);
            setVal('receiptPayerLocalidade', c.localidade);
        } else {
            setVal('devisClient', c.nom);
            setVal('devisClientNif', c.nif);
            setVal('devisClientAddress', c.morada);
            setVal('devisClientEmail', c.email);
            setVal('devisClientPhone', c.telefone);
            setVal('devisClientPostal', c.postal);
            setVal('devisClientLocalidade', c.localidade);
        }
        toast(tt('pickClientOk', 'Cliente preenchido.'));
    }
    function ensureDatalists() {
        if (!document.getElementById('abeneClientNameList')) {
            var dl = document.createElement('datalist');
            dl.id = 'abeneClientNameList';
            document.body.appendChild(dl);
        }
        if (!document.getElementById('abeneArticleList')) {
            var dl2 = document.createElement('datalist');
            dl2.id = 'abeneArticleList';
            document.body.appendChild(dl2);
        }
    }
    function refreshDatalists() {
        ensureDatalists();
        var cli = document.getElementById('abeneClientNameList');
        var art = document.getElementById('abeneArticleList');
        if (cli) {
            cli.innerHTML = collectClients().map(function (c) {
                return '<option value="' + String(c.nom).replace(/"/g, '&quot;') + '"></option>';
            }).join('');
        }
        if (art) {
            art.innerHTML = collectArticles().map(function (a) {
                return '<option value="' + String(a.designation).replace(/"/g, '&quot;') + '"></option>';
            }).join('');
        }
    }
    function pickClient(target) {
        target = target === 'receipt' ? 'receipt' : 'devis';
        var list = collectClients();
        if (!list.length) {
            toast(tt('pickClientEmpty', 'Ainda não há clientes guardados (Sheets, Excel ou Arquivo).'));
            return;
        }
        var q = '';
        var body = '<p style="font-size:12px;color:#555;margin:0 0 8px;">' +
            tt('pickClientHint', 'Selecione um cliente para preencher o formulário.') + '</p>' +
            '<input type="search" id="abenePickClientQ" placeholder="' + tt('pickClientSearch', 'Pesquisar…') +
            '" style="width:100%;padding:8px;margin-bottom:8px;box-sizing:border-box;">' +
            '<div id="abenePickClientList" style="max-height:320px;overflow:auto;border:1px solid #ddd;"></div>';
        function render() {
            var box = document.getElementById('abenePickClientList');
            if (!box) return;
            var qq = (document.getElementById('abenePickClientQ') || {}).value || '';
            qq = String(qq).toLowerCase().trim();
            var rows = list.filter(function (c) {
                if (!qq) return true;
                return (c.nom + ' ' + c.nif + ' ' + c.email).toLowerCase().indexOf(qq) >= 0;
            });
            box.innerHTML = rows.map(function (c, i) {
                return '<button type="button" class="btn-secondary" data-i="' + i + '" style="display:block;width:100%;text-align:left;margin:0;border-radius:0;border:0;border-bottom:1px solid #eee;">' +
                    '<strong>' + c.nom.replace(/</g, '&lt;') + '</strong>' +
                    (c.nif ? ' · NIF ' + c.nif.replace(/</g, '&lt;') : '') +
                    (c.email ? '<br><small>' + c.email.replace(/</g, '&lt;') + '</small>' : '') +
                    '</button>';
            }).join('') || ('<p style="padding:12px;">' + tt('pickClientEmpty', 'Nenhum resultado.') + '</p>');
            var filtered = rows;
            box.querySelectorAll('button[data-i]').forEach(function (btn) {
                btn.onclick = function () {
                    var idx = Number(btn.getAttribute('data-i'));
                    applyClient(target, filtered[idx]);
                    if (typeof root.closeModal === 'function') root.closeModal('genericModal');
                };
            });
        }
        if (typeof root.openGenericModal === 'function') {
            root.openGenericModal(
                tt('pickClient', 'Escolher cliente guardado…'),
                body,
                '<button class="btn-primary" onclick="closeModal(\'genericModal\')">' + tt('close', 'Fechar') + '</button>'
            );
            setTimeout(function () {
                render();
                var inp = document.getElementById('abenePickClientQ');
                if (inp) {
                    inp.oninput = render;
                    inp.focus();
                }
            }, 30);
        } else {
            var names = list.map(function (c, i) { return (i + 1) + '. ' + c.nom; }).join('\n');
            var n = parseInt(root.prompt(tt('pickClient', 'Cliente') + '\n' + names, '1'), 10);
            if (n >= 1 && n <= list.length) applyClient(target, list[n - 1]);
        }
    }

    document.addEventListener('change', function (e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains('item-desc') && t.value) rememberDesc(t.value);
    });
    document.addEventListener('focusin', function (e) {
        var t = e.target;
        if (!t) return;
        if (t.id === 'devisClient' || t.id === 'receiptPayerName' || (t.classList && t.classList.contains('item-desc'))) {
            refreshDatalists();
        }
    });

    root.abenePickClient = pickClient;
    root.abeneRefreshPickLists = refreshDatalists;
    root.abeneCollectClients = collectClients;
    root.abeneCollectArticles = collectArticles;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', refreshDatalists);
    } else {
        setTimeout(refreshDatalists, 0);
    }
})(typeof window !== 'undefined' ? window : this);
