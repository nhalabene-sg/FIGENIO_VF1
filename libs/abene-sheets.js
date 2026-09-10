/* Genius Raros — synchronisation Google Sheets via Apps Script Web App (/exec). */
(function () {
    var timer = null;
    var lastStatus = '';
    var lastKind = 'idle';
    var lastFailMsg = '';

    function tt(key, fb) {
        if (typeof window.t === 'function') {
            var v = window.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
    }
    var BUSINESS_SHEETS = {
        clients: ['CLIENTES', 'CLIENTS', 'CLIENTS', 'CLIENTES'],
        articles: ['ARTIGOS', 'ARTICLES', 'ITEMS', 'ARTÍCULOS'],
        quotes: ['ORÇAMENTOS', 'DEVIS', 'QUOTES', 'PRESUPUESTOS'],
        quoteLines: ['LINHAS_ORÇAMENTO', 'LIGNES_DEVIS', 'QUOTE_LINES', 'LÍNEAS_PRESUPUESTO']
    };
    var BUSINESS_LEGACY = {
        clients: ['CLIENTS'], articles: ['ARTICLES'], quotes: ['DEVIS'], quoteLines: ['DEVIS_LIGNES']
    };
    function languageIndex_() {
        var lang = localStorage.getItem('abeneLanguage') || 'pt-PT';
        return /^fr/i.test(lang) ? 1 : /^en/i.test(lang) ? 2 : /^es/i.test(lang) ? 3 : 0;
    }
    function businessSheetName_(key) {
        var names = BUSINESS_SHEETS[key] || [key];
        return names[languageIndex_()] || names[0] || key;
    }
    function businessSheetAliases_(key) {
        var seen = {}, out = [];
        (BUSINESS_SHEETS[key] || []).concat(BUSINESS_LEGACY[key] || []).forEach(function (name) {
            var low = String(name || '').toLocaleLowerCase();
            if (name && !seen[low]) { seen[low] = true; out.push(name); }
        });
        return out;
    }
    function toast(msg) { if (typeof showToast === 'function') showToast(msg); }
    function company() {
        return (window.abene && window.abene.companyData) || {};
    }
    function saveCompany(next) {
        if (window.abene) window.abene.companyData = next;
        try { localStorage.setItem('abeneCompanyData', JSON.stringify(next)); } catch (e) {}
    }
    function extractSheetId(urlOrId) {
        var s = String(urlOrId || '').trim();
        var m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (m) return m[1];
        if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s;
        return '';
    }
    function codedUrl() {
        var u = '';
        try {
            if (typeof window.API_URL === 'string') u = window.API_URL.trim();
        } catch (e) {}
        if (/\/exec\/?$/.test(u) || /script.google.com\/macros\/s\//.test(u)) return u.replace(/\/$/, '');
        return '';
    }
    function execUrl() {
        var c = company();
        var u = String(c.appsScriptUrl || c.googleSheetsUrl || '').trim();
        if (/\/exec\/?$/.test(u) || /script.google.com\/macros\/s\//.test(u)) return u.replace(/\/$/, '');
        return codedUrl();
    }
    var PENDING = 'abeneSheetsPending';
    function isOnline() {
        return navigator.onLine !== false;
    }
    function markPending() {
        try { localStorage.setItem(PENDING, '1'); } catch (e) {}
    }
    function clearPending() {
        try { localStorage.removeItem(PENDING); } catch (e) {}
    }
    function setLocalStatus() {
        lastKind = 'offline';
        setStatus(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'), true);
        var el = document.getElementById('sheetsSyncStatus');
        if (el) el.style.color = '#C9A84C';
    }
    function refreshStatusI18n() {
        if (lastKind === 'syncing') setStatus(tt('sheetsSyncing', 'A sincronizar…'));
        else if (lastKind === 'offline') setLocalStatus();
        else if (lastKind === 'ok') {
            var when = (company().sheetsLastSync) || '';
            try {
                var d = when ? new Date(when) : null;
                setStatus(tt('sheetsOk', 'Sheets') + (d && !isNaN(d.getTime()) ? ' · ' + d.toLocaleTimeString() : ''), true);
            } catch (eR) { setStatus(tt('sheetsOk', 'Sheets'), true); }
            lastKind = 'ok';
        } else if (lastKind === 'fail') {
            setStatus(tt('sheetsFail', 'Sheets: falha') + (lastFailMsg ? ' (' + lastFailMsg + ')' : ''), false);
        }
    }
    function enabled() {
        var c = company();
        if (!execUrl()) return false;
        if (!String(c.syncToken || '').trim()) return false;
        if (c.databaseEnabled === false || c.databaseEnabled === 'false') return false;
        return true;
    }
    function token() {
        var c = company();
        return String(c.syncToken || '').trim();
    }
    function setStatus(text, ok) {
        lastStatus = text;
        var el = document.getElementById('sheetsSyncStatus');
        if (!el) return;
        el.textContent = text;
        el.style.color = ok === false ? '#c0392b' : (ok ? '#7dcea0' : '');
        el.title = text;
    }
    function parseApiJson(txt) {
        try { return JSON.parse(txt); }
        catch (e) { throw new Error(String(txt || '').slice(0, 180) || 'bad-json'); }
    }
    function acceptApiJson(json) {
        if (!json || json.ok === false) throw new Error((json && json.error) || 'fail');
        return json;
    }
    function callApi(action, extra) {
        var url = execUrl();
        if (!url) return Promise.reject(new Error('no-url'));
        var body = Object.assign({
            action: action,
            token: token(),
            language: localStorage.getItem('abeneLanguage') || 'pt-PT'
        }, extra || {});
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.text().then(parseApiJson);
        }).then(acceptApiJson);
    }
    function jsonpCall(action, extra) {
        var url = execUrl();
        if (!url) return Promise.reject(new Error('no-url'));
        extra = extra || {};
        var qs = 'action=' + encodeURIComponent(action) + '&token=' + encodeURIComponent(token());
        Object.keys(extra).forEach(function (k) {
            var v = extra[k];
            if (v == null || typeof v === 'object') return;
            qs += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(String(v));
        });
        return new Promise(function (resolve, reject) {
            var cb = 'abeneJsonp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            var s = document.createElement('script');
            var done = false;
            var timer = setTimeout(function () { finish(new Error('jsonp-timeout')); }, 20000);
            function finish(err, json) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (eDel) { window[cb] = undefined; }
                if (s.parentNode) s.parentNode.removeChild(s);
                if (err) reject(err);
                else resolve(json);
            }
            window[cb] = function (json) { finish(null, json); };
            s.onerror = function () { finish(new Error('jsonp-fail')); };
            s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + qs + '&callback=' + encodeURIComponent(cb);
            document.head.appendChild(s);
        }).then(acceptApiJson);
    }
    function ping() {
        var url = execUrl();
        if (!url) return Promise.reject(new Error('no-url'));
        var getUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'action=PING&token=' + encodeURIComponent(token());
        return fetch(getUrl, { method: 'GET', mode: 'cors', redirect: 'follow' }).then(function (res) {
            return res.text().then(parseApiJson);
        }).then(acceptApiJson).catch(function () {
            return callApi('PING').catch(function () { return jsonpCall('PING'); });
        });
    }
    function collectMetier(wb) {
        if (!wb || !wb.sheets) return null;
        function rowsOf(key) {
            var i, sh, r, c, headers = [], rows = [], rec, k, ce;
            var aliases = businessSheetAliases_(key).map(function (name) { return String(name).toLocaleLowerCase(); });
            for (i = 0; i < wb.sheets.length; i++) {
                if (aliases.indexOf(String(wb.sheets[i].name || '').toLocaleLowerCase()) >= 0) { sh = wb.sheets[i]; break; }
            }
            if (!sh) return [];
            for (c = 0; c < Math.min(sh.cols, 16); c++) {
                ce = sh.cells[(window.AbeneExcelEngine && window.AbeneExcelEngine.a1(c, 0)) || ('')];
                if (ce && ce.raw) headers.push(String(ce.raw));
            }
            if (!headers.length) return [];
            for (r = 1; r < Math.min(sh.rows, 400); r++) {
                rec = {}; k = 0;
                for (c = 0; c < headers.length; c++) {
                    ce = sh.cells[window.AbeneExcelEngine.a1(c, r)];
                    rec[headers[c]] = ce ? (ce.raw || '') : '';
                    if (ce && ce.raw) k++;
                }
                if (k) rows.push(rec);
            }
            return rows;
        }
        return {
            clients: rowsOf('clients'),
            articles: rowsOf('articles'),
            devis: rowsOf('quotes'),
            lignes: rowsOf('quoteLines')
        };
    }
    function deriveFolders(arquivo, catalog) {
        var out = [];
        var seen = {};
        function add(kind, label, client) {
            label = String(label || '').trim();
            if (!label) return;
            client = String(client || '').trim();
            var key = kind + '|' + label + '|' + client;
            if (seen[key]) return;
            seen[key] = 1;
            out.push({ kind: kind, label: label, client: client, path: kind === 'pasta' ? (client ? client + '/' + label : label) : label });
        }
        (catalog || []).forEach(function (f) {
            if (!f) return;
            add(f.kind || 'pasta', f.label || f.path || '', f.client || '');
        });
        (arquivo || []).forEach(function (e) {
            if (!e) return;
            if (e.client) add('client', e.client, '');
            if (e.pasta) add('pasta', e.pasta, e.client || '');
        });
        return out;
    }
    function snapshot(reason) {
        var html = '';
        var settings = '';
        try {
            if (typeof persistableEditorHtml === 'function') html = persistableEditorHtml();
            else {
                var ed = document.getElementById('editor');
                html = ed ? ed.innerHTML : '';
            }
        } catch (e) {}
        try {
            if (typeof projectSettings === 'function') settings = projectSettings();
        } catch (e2) {}
        var excel = null;
        try { excel = JSON.parse(localStorage.getItem('abeneExcelWorkbook') || 'null'); } catch (e3) {}
        var arquivo = [];
        try { arquivo = JSON.parse(localStorage.getItem('abeneArquivoV1') || '[]'); } catch (e4) {}
        var folders = [];
        try {
            if (window.abeneArquivoApi && typeof window.abeneArquivoApi.catalogFolders === 'function') {
                folders = window.abeneArquivoApi.catalogFolders() || [];
            } else {
                folders = JSON.parse(localStorage.getItem('abeneArquivoFoldersV1') || '[]');
            }
        } catch (eF) {}
        var journal = [];
        try { journal = JSON.parse(localStorage.getItem('abeneAccountingJournal') || '[]'); } catch (e5) {}
        var name = (window.abene && window.abene.documentState && window.abene.documentState.name) || localStorage.getItem('abeneDocName') || 'Documento1';
        var co = Object.assign({}, company());
        delete co.apiKey;
        return {
            reason: reason || 'manual',
            company: co,
            document: { id: 'current', name: name, html: html, settings: settings },
            excel: excel,
            arquivo: arquivo,
            folders: deriveFolders(arquivo, folders),
            journal: journal,
            metier: collectMetier(excel)
        };
    }
    function rememberDrive(json) {
        if (!json) return;
        var c = company();
        var changed = false;
        if (json.driveFolderUrl && json.driveFolderUrl !== c.driveFolderUrl) {
            c.driveFolderUrl = json.driveFolderUrl;
            changed = true;
        }
        if (json.driveFolderId && json.driveFolderId !== c.driveFolderId) {
            c.driveFolderId = json.driveFolderId;
            changed = true;
        }
        if (json.spreadsheetId && json.spreadsheetId !== c.spreadsheetId) {
            c.spreadsheetId = json.spreadsheetId;
            changed = true;
        }
        if (json.ownerEmail && json.ownerEmail !== c.googleOwnerEmail) {
            c.googleOwnerEmail = json.ownerEmail;
            changed = true;
        }
        if (json.spreadsheetUrl && json.spreadsheetUrl !== c.googleSheetsUrl) {
            c.googleSheetsUrl = json.spreadsheetUrl;
            changed = true;
        }
        if (changed) saveCompany(c);
    }
    function markSynced(at, spreadsheetId, json) {
        var c = company();
        c.sheetsLastSync = at || new Date().toISOString();
        if (spreadsheetId) c.spreadsheetId = spreadsheetId;
        saveCompany(c);
        if (json) rememberDrive(json);
        var when = c.sheetsLastSync;
        try {
            var d = new Date(when);
            lastKind = 'ok';
            setStatus(tt('sheetsOk', 'Sheets') + ' · ' + d.toLocaleTimeString(), true);
        } catch (e) { lastKind = 'ok'; setStatus(tt('sheetsOk', 'Sheets'), true); }
    }
    function push(reason) {
        if (!enabled()) return Promise.resolve(null);
        if (!isOnline()) {
            markPending();
            setLocalStatus();
            return Promise.resolve(null);
        }
        lastKind = 'syncing';
        setStatus(tt('sheetsSyncing', 'A sincronizar…'));
        return callApi('PUSH', snapshot(reason)).then(function (json) {
            clearPending();
            markSynced(json.at, json.spreadsheetId, json);
            return json;
        }).catch(function (err) {
            markPending();
            if (!isOnline()) {
                setLocalStatus();
                return null;
            }
            lastKind = 'fail';
            lastFailMsg = String(err.message || err || '');
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + lastFailMsg + ')', false);
            throw err;
        });
    }
    function schedule(reason) {
        if (!enabled()) return;
        if (!isOnline()) {
            markPending();
            setLocalStatus();
            return;
        }
        clearTimeout(timer);
        timer = setTimeout(function () { push(reason || 'auto').catch(function () {}); }, 2500);
    }
    function applyPull(json, opts) {
        opts = opts || {};
        if (json.company && typeof json.company === 'object') {
            var cur = company();
            var merged = Object.assign({}, cur, json.company);
            merged.appsScriptUrl = cur.appsScriptUrl;
            merged.syncToken = cur.syncToken;
            merged.databaseEnabled = cur.databaseEnabled;
            merged.installerEmail = cur.installerEmail || merged.installerEmail;
            merged.googleOwnerEmail = json.ownerEmail || cur.googleOwnerEmail || merged.googleOwnerEmail;
            merged.googleSheetsUrl = cur.googleSheetsUrl || merged.googleSheetsUrl;
            merged.spreadsheetId = json.spreadsheetId || merged.spreadsheetId;
            if (json.driveFolderUrl) merged.driveFolderUrl = json.driveFolderUrl;
            if (json.driveFolderId) merged.driveFolderId = json.driveFolderId;
            if (merged.vatRate) merged.vatRate = Number(merged.vatRate) || merged.vatRate;
            if (merged.databaseEnabled === 'true') merged.databaseEnabled = true;
            if (merged.excelEnabled === 'false') merged.excelEnabled = false;
            if (merged.excelEnabled === 'true') merged.excelEnabled = true;
            saveCompany(merged);
            if (typeof applyCompanyDefaults === 'function') applyCompanyDefaults();
        }
        if (json.document && json.document.html && !opts.skipDocument) {
            var editor = document.getElementById('editor');
            if (editor) {
                var safeDocumentHtml = typeof window.abeneSanitizeHtml === 'function'
                    ? window.abeneSanitizeHtml(json.document.html)
                    : json.document.html;
                editor.innerHTML = safeDocumentHtml;
                try {
                    localStorage.setItem('docContent', safeDocumentHtml);
                    localStorage.setItem('abeneAutosave', safeDocumentHtml);
                    if (json.document.name) {
                        localStorage.setItem('abeneDocName', json.document.name);
                        var title = document.getElementById('docTitle');
                        if (title) title.value = json.document.name;
                        if (window.abene && window.abene.documentState) window.abene.documentState.name = json.document.name;
                    }
                    if (json.document.settings && typeof restoreProjectSettings === 'function') {
                        restoreProjectSettings(json.document.settings);
                    }
                } catch (e) {}
                if (typeof refreshPagination === 'function') refreshPagination();
                if (typeof updateSaveStatus === 'function') updateSaveStatus();
            }
        }
        if (json.excel && json.excel.sheets) {
            try { localStorage.setItem('abeneExcelWorkbook', JSON.stringify(json.excel)); } catch (e) {}
        }
        if (json.arquivo && json.arquivo.length) {
            try { localStorage.setItem('abeneArquivoV1', JSON.stringify(json.arquivo)); } catch (e) {}
        }
        if (Array.isArray(json.folders)) {
            try { localStorage.setItem('abeneArquivoFoldersV1', JSON.stringify(json.folders)); } catch (eF) {}
        }
        if (json.metier) mergeMetierLocal_(json.metier);
        markSynced(json.at, json.spreadsheetId, json);
        if (typeof window.abeneExcelReloadFromStorage === 'function') {
            try { window.abeneExcelReloadFromStorage(); } catch (eXl) {}
        }
    }
    function colA1_(c) {
        if (window.AbeneExcelEngine && typeof window.AbeneExcelEngine.a1 === 'function') {
            return window.AbeneExcelEngine.a1(c, 0).replace(/[0-9]+$/, '');
        }
        var s = '', n = c + 1;
        while (n > 0) {
            var m = (n - 1) % 26;
            s = String.fromCharCode(65 + m) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    }
    function rowsToExcelSheet_(name, rows) {
        var headers = (rows && rows[0]) ? Object.keys(rows[0]) : [];
        var cells = {};
        var r, c, rec;
        for (c = 0; c < headers.length; c++) cells[colA1_(c) + '1'] = { raw: headers[c] };
        for (r = 0; r < (rows || []).length; r++) {
            rec = rows[r] || {};
            for (c = 0; c < headers.length; c++) {
                cells[colA1_(c) + String(r + 2)] = { raw: rec[headers[c]] == null ? '' : String(rec[headers[c]]) };
            }
        }
        return {
            name: name,
            rows: Math.max(30, (rows || []).length + 5),
            cols: Math.max(16, headers.length),
            cells: cells
        };
    }
    function mergeMetierLocal_(metier) {
        if (!metier) return;
        var wb = null;
        try { wb = JSON.parse(localStorage.getItem('abeneExcelWorkbook') || 'null'); } catch (eW) { wb = null; }
        if (!wb || typeof wb !== 'object') wb = { name: 'Livro1', sheets: [], active: 0 };
        if (!wb.sheets) wb.sheets = [];
        function replaceSheet(key, rows) {
            var sh, i, name = businessSheetName_(key);
            var aliases = businessSheetAliases_(key).map(function (item) { return String(item).toLocaleLowerCase(); });
            if (!rows || !rows.length) return;
            sh = rowsToExcelSheet_(name, rows);
            for (i = 0; i < wb.sheets.length; i++) {
                if (wb.sheets[i] && aliases.indexOf(String(wb.sheets[i].name || '').toLocaleLowerCase()) >= 0) {
                    wb.sheets[i] = sh;
                    return;
                }
            }
            wb.sheets.push(sh);
        }
        replaceSheet('clients', metier.clients);
        replaceSheet('articles', metier.articles);
        replaceSheet('quotes', metier.devis);
        replaceSheet('quoteLines', metier.lignes);
        try { localStorage.setItem('abeneExcelWorkbook', JSON.stringify(wb)); } catch (eS) {}
    }
    function pull(opts) {
        if (!enabled()) return Promise.reject(new Error('off'));
        if (!isOnline()) {
            setLocalStatus();
            toast(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'));
            return Promise.resolve(null);
        }
        lastKind = 'syncing';
        setStatus(tt('sheetsSyncing', 'A sincronizar…'));
        return callApi('PULL').then(function (json) {
            applyPull(json, opts);
            if (!opts.silent) toast(tt('sheetsRestored', 'Dados restaurados a partir do Google Sheets.'));
            return json;
        }).catch(function (err) {
            if (!isOnline()) {
                setLocalStatus();
                return null;
            }
            lastKind = 'fail';
            lastFailMsg = String(err.message || err || '');
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + lastFailMsg + ')', false);
            throw err;
        });
    }
    function testConnection() {
        if (!isOnline()) {
            setLocalStatus();
            toast(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'));
            return Promise.resolve(null);
        }
        var c = company();
        var sid = extractSheetId(c.googleSheetsUrl || c.spreadsheetId);
        if (sid && !c.spreadsheetId) {
            c.spreadsheetId = sid;
            saveCompany(c);
        }
        return callApi('INIT').catch(function () { return ping(); }).then(function (json) {
            if (json.spreadsheetId) {
                c = company();
                c.spreadsheetId = json.spreadsheetId;
                if (json.spreadsheetUrl) c.googleSheetsUrl = json.spreadsheetUrl;
                if (json.driveFolderUrl) c.driveFolderUrl = json.driveFolderUrl;
                if (json.driveFolderId) c.driveFolderId = json.driveFolderId;
                if (json.ownerEmail) c.googleOwnerEmail = json.ownerEmail;
                saveCompany(c);
            }
            markSynced(json.at, json.spreadsheetId, json);
            toast(tt('sheetsPingOk', 'Ligação Google Sheets OK.'));
            return json;
        }).catch(function (err) {
            if (!isOnline()) {
                setLocalStatus();
                return null;
            }
            lastKind = 'fail';
            lastFailMsg = String(err.message || err || '');
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + lastFailMsg + ')', false);
            toast(tt('sheetsPingFail', 'Falha na ligação. Verifique o URL /exec e o jeton.'));
            throw err;
        });
    }
    function refreshFromSheet() {
        if (!enabled()) return Promise.reject(new Error('off'));
        if (!isOnline()) {
            setLocalStatus();
            toast(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'));
            return Promise.resolve(null);
        }
        setStatus(tt('sheetsRefreshing', 'A atualizar a partir da folha…'));
        return callApi('ATUALIZAR').catch(function () { return callApi('REFRESH'); }).then(function (json) {
            applyPull(json, { skipDocument: true });
            toast(tt('sheetsRefreshed', 'Dados da folha atualizados (clientes, artigos, Drive).'));
            return json;
        }).catch(function () {
            return pull({ skipDocument: true, silent: true }).then(function (json) {
                if (json) toast(tt('sheetsRefreshed', 'Dados da folha atualizados (clientes, artigos, Drive).'));
                return json;
            });
        }).catch(function (err) {
            if (!isOnline()) {
                setLocalStatus();
                return null;
            }
            lastKind = 'fail';
            lastFailMsg = String(err.message || err || '');
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + lastFailMsg + ')', false);
            throw err;
        });
    }
    function onSave() { if (enabled()) push('save').catch(function () {}); }
    function boot() {
        if (!enabled()) {
            setStatus('');
            return;
        }
        if (!isOnline()) {
            markPending();
            setLocalStatus();
            return;
        }
        ping().then(function (json) {
            markSynced(json.at, json.spreadsheetId, json);
            var localHtml = localStorage.getItem('abeneAutosave') || localStorage.getItem('docContent') || '';
            var empty = !localHtml || localHtml.length < 80;
            if (empty) {
                return callApi('PULL').then(function (p) {
                    if (p && p.document && p.document.html) applyPull(p);
                });
            }
            if (localStorage.getItem(PENDING) === '1') return push('reconnect');
        }).catch(function () {
            markPending();
            setLocalStatus();
        });
    }

    window.addEventListener('offline', function () {
        if (!enabled()) return;
        markPending();
        setLocalStatus();
    });
    window.addEventListener('online', function () {
        if (!enabled()) return;
        push('reconnect').catch(function () {});
    });

    function sendEmail(payload) {
        if (!enabled()) return Promise.reject(new Error('off'));
        if (!isOnline()) {
            setLocalStatus();
            return Promise.reject(new Error('offline'));
        }
        payload = payload || {};
        return callApi('SEND_CLIENT_PDF', {
            to: payload.to || '',
            cc: payload.cc || '',
            bcc: payload.bcc || '',
            replyTo: payload.replyTo || '',
            subject: payload.subject || '',
            body: payload.body || payload.plainBody || '',
            html: payload.html || payload.htmlBody || '',
            name: payload.name || (company().name || ''),
            attachments: payload.attachments || [],
            pdfOnly: true
        });
    }

    window.abeneSheetsPush = push;
    window.abeneSheetsPull = pull;
    window.abeneSheetsRefresh = refreshFromSheet;
    window.abeneSheetsCall = callApi;
    window.abeneSheetsTest = testConnection;
    window.abeneSheetsSchedule = schedule;
    window.abeneSheetsOnExcelChange = function () { schedule('excel'); };
    window.abeneSheetsOnArquivoChange = function () { schedule('arquivo'); };
    window.abeneSheetsEnabled = enabled;
    window.abeneSendEmail = sendEmail;
    window.abeneExtractSheetId = extractSheetId;
    window.abeneSheetsRefreshI18n = refreshStatusI18n;
    window.abeneSheetsMetierSnapshot = function () {
        try {
            var excel = JSON.parse(localStorage.getItem('abeneExcelWorkbook') || 'null');
            return collectMetier(excel) || { clients: [], articles: [] };
        } catch (e) {
            return { clients: [], articles: [] };
        }
    };
    (function hookI18n() {
        var prev = window.abeneAfterI18n;
        window.abeneAfterI18n = function (lang) {
            if (typeof prev === 'function') prev(lang);
            refreshStatusI18n();
        };
    })();

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else setTimeout(boot, 400);
})();
