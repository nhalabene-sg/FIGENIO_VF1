/* Genius Raros — synchronisation Google Sheets via Apps Script Web App (/exec). */
(function () {
    var DEFAULT_TOKEN = 'abene-genius-raros-2026';
    var timer = null;
    var lastStatus = '';

    function tt(key, fb) {
        if (typeof window.t === 'function') {
            var v = window.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
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
        setStatus(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'), true);
        var el = document.getElementById('sheetsSyncStatus');
        if (el) el.style.color = '#C9A84C';
    }
    function enabled() {
        var c = company();
        if (!execUrl()) return false;
        if (c.databaseEnabled === false || c.databaseEnabled === 'false') return false;
        return true;
    }
    function token() {
        var c = company();
        if (c.syncToken) return c.syncToken;
        return DEFAULT_TOKEN;
    }
    function setStatus(text, ok) {
        lastStatus = text;
        var el = document.getElementById('sheetsSyncStatus');
        if (!el) return;
        el.textContent = text;
        el.style.color = ok === false ? '#c0392b' : (ok ? '#7dcea0' : '');
        el.title = text;
    }
    function callApi(action, extra) {
        var url = execUrl();
        if (!url) return Promise.reject(new Error('no-url'));
        var body = Object.assign({ action: action, token: token() }, extra || {});
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.text().then(function (txt) {
                try { return JSON.parse(txt); }
                catch (e) { throw new Error(txt.slice(0, 180) || 'bad-json'); }
            });
        }).then(function (json) {
            if (!json || json.ok === false) throw new Error((json && json.error) || 'fail');
            return json;
        });
    }
    function ping() {
        var url = execUrl();
        if (!url) return Promise.reject(new Error('no-url'));
        var getUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'action=PING&token=' + encodeURIComponent(token());
        return fetch(getUrl).then(function (res) { return res.json(); }).then(function (json) {
            if (!json || json.ok === false) throw new Error((json && json.error) || 'fail');
            return json;
        }).catch(function () { return callApi('PING'); });
    }
    function collectMetier(wb) {
        if (!wb || !wb.sheets) return null;
        function rowsOf(name) {
            var i, sh, r, c, headers = [], rows = [], rec, k, ce;
            for (i = 0; i < wb.sheets.length; i++) if (wb.sheets[i].name === name) { sh = wb.sheets[i]; break; }
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
            clients: rowsOf('CLIENTS'),
            articles: rowsOf('ARTICLES'),
            devis: rowsOf('DEVIS'),
            lignes: rowsOf('DEVIS_LIGNES')
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
            setStatus(tt('sheetsOk', 'Sheets') + ' · ' + d.toLocaleTimeString(), true);
        } catch (e) { setStatus(tt('sheetsOk', 'Sheets'), true); }
    }
    function push(reason) {
        if (!enabled()) return Promise.resolve(null);
        if (!isOnline()) {
            markPending();
            setLocalStatus();
            return Promise.resolve(null);
        }
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
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + (err.message || err) + ')', false);
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
                editor.innerHTML = json.document.html;
                try {
                    localStorage.setItem('docContent', json.document.html);
                    localStorage.setItem('abeneAutosave', json.document.html);
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
        markSynced(json.at, json.spreadsheetId, json);
    }
    function pull(opts) {
        if (!enabled()) return Promise.reject(new Error('off'));
        if (!isOnline()) {
            setLocalStatus();
            toast(tt('sheetsOffline', 'Documento local — sincroniza quando houver internet'));
            return Promise.resolve(null);
        }
        setStatus(tt('sheetsSyncing', 'A sincronizar…'));
        return callApi('PULL').then(function (json) {
            applyPull(json, opts);
            toast(tt('sheetsRestored', 'Dados restaurados a partir do Google Sheets.'));
            return json;
        }).catch(function (err) {
            if (!isOnline()) {
                setLocalStatus();
                return null;
            }
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + (err.message || err) + ')', false);
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
                if (!c.syncToken) c.syncToken = DEFAULT_TOKEN;
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
            setStatus(tt('sheetsFail', 'Sheets: falha') + ' (' + (err.message || err) + ')', false);
            toast(tt('sheetsPingFail', 'Falha na ligação. Verifique o URL /exec e o jeton.'));
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
        return callApi('SEND_EMAIL', {
            to: payload.to || '',
            cc: payload.cc || '',
            bcc: payload.bcc || '',
            replyTo: payload.replyTo || '',
            subject: payload.subject || '',
            body: payload.body || payload.plainBody || '',
            html: payload.html || payload.htmlBody || '',
            name: payload.name || (company().name || ''),
            attachments: payload.attachments || []
        });
    }

    window.abeneSheetsPush = push;
    window.abeneSheetsPull = pull;
    window.abeneSheetsCall = callApi;
    window.abeneSheetsTest = testConnection;
    window.abeneSheetsSchedule = schedule;
    window.abeneSheetsOnExcelChange = function () { schedule('excel'); };
    window.abeneSheetsOnArquivoChange = function () { schedule('arquivo'); };
    window.abeneSheetsEnabled = enabled;
    window.abeneSendEmail = sendEmail;
    window.abeneExtractSheetId = extractSheetId;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else setTimeout(boot, 400);
})();
