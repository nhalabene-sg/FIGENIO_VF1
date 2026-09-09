/* Genius Raros — Google Docs ligado (mesmo ficheiro Drive, sem duplicar).
   Requer emaildrive ≥ 2.5 (OPEN_GDOCS update + PULL_GDOCS). */
(function (root) {
    var MAX_BYTES = 4.5 * 1024 * 1024;
    var busy = false;
    var LINK_KEY = 'abeneGdocsLink';

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
    function docState() {
        return (root.abene && root.abene.documentState) || root.documentState || null;
    }
    function docName() {
        var st = docState();
        if (st && st.name) return String(st.name).slice(0, 80);
        try {
            return (localStorage.getItem('abeneDocName') || 'Documento').slice(0, 80);
        } catch (e1) {
            return 'Documento';
        }
    }
    function cloudReady() {
        return typeof root.abeneSheetsEnabled === 'function' && root.abeneSheetsEnabled()
            && typeof root.abeneSheetsCall === 'function'
            && root.navigator.onLine !== false;
    }
    function readLinkStore() {
        try {
            return JSON.parse(localStorage.getItem(LINK_KEY) || '{}') || {};
        } catch (e) {
            return {};
        }
    }
    function writeLinkStore(map) {
        try { localStorage.setItem(LINK_KEY, JSON.stringify(map || {})); } catch (e) {}
    }
    function getLink() {
        var st = docState();
        if (st && st.gdocsFileId) {
            return {
                id: String(st.gdocsFileId),
                url: st.gdocsUrl || ('https://docs.google.com/document/d/' + st.gdocsFileId + '/edit')
            };
        }
        return null;
    }
    function setLink(id, url) {
        id = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!id) return;
        url = url || ('https://docs.google.com/document/d/' + id + '/edit');
        var st = docState();
        if (st) {
            st.gdocsFileId = id;
            st.gdocsUrl = url;
        }
        var map = readLinkStore();
        map[docName()] = { id: id, url: url, at: new Date().toISOString() };
        writeLinkStore(map);
        try {
            localStorage.setItem('abeneGdocsFileId', id);
            localStorage.setItem('abeneGdocsUrl', url);
        } catch (e2) {}
        updateStatusUi();
    }
    function clearLink() {
        var st = docState();
        var oldId = st && st.gdocsFileId ? String(st.gdocsFileId) : '';
        if (st) {
            st.gdocsFileId = '';
            st.gdocsUrl = '';
        }
        var map = readLinkStore();
        Object.keys(map).forEach(function (key) {
            var hit = map[key] || {};
            if (key === docName() || (oldId && String(hit.id || '') === oldId)) delete map[key];
        });
        writeLinkStore(map);
        try {
            localStorage.removeItem('abeneGdocsFileId');
            localStorage.removeItem('abeneGdocsUrl');
        } catch (e3) {}
        updateStatusUi();
    }
    function forkLinkOnCopy() {
        clearLink();
    }
    function blobToBase64(blob) {
        return new Promise(function (resolve, reject) {
            var r = new FileReader();
            r.onload = function () {
                var s = String(r.result || '');
                var i = s.indexOf(',');
                resolve(i >= 0 ? s.slice(i + 1) : s);
            };
            r.onerror = function () { reject(new Error('read-fail')); };
            r.readAsDataURL(blob);
        });
    }
    function openSettingsHint() {
        toast(tt('gdocsNeedExec', 'Configure o URL /exec nas Definições (Apps Script emaildrive) para abrir no Google Docs.'));
        if (typeof root.openCompanySettings === 'function') {
            try { root.openCompanySettings(); } catch (eS) {}
        }
    }
    function sanitizeImportedHtml(html) {
        if (typeof root.abeneSanitizeHtml === 'function') {
            return root.abeneSanitizeHtml(String(html || ''));
        }
        var wrap = document.createElement('div');
        wrap.innerHTML = String(html || '');
        wrap.querySelectorAll('script, noscript, iframe, object, embed, link, meta, style').forEach(function (n) {
            n.remove();
        });
        var body = wrap.querySelector('body');
        var inner = body ? body.innerHTML : wrap.innerHTML;
        var out = document.createElement('div');
        out.innerHTML = inner;
        out.querySelectorAll('[contenteditable]').forEach(function (n) {
            n.removeAttribute('contenteditable');
        });
        out.querySelectorAll('*').forEach(function (n) {
            Array.from(n.attributes || []).forEach(function (attr) {
                var key = String(attr.name || '').toLowerCase();
                var val = String(attr.value || '');
                if (key.indexOf('on') === 0 || key === 'srcdoc' ||
                    (/^(href|src|xlink:href)$/i.test(key) && /^\s*(javascript|vbscript|data:text\/html)/i.test(val))) {
                    n.removeAttribute(attr.name);
                }
            });
        });
        return out.innerHTML || '<p></p>';
    }
    function applyHtmlToEditor(html) {
        var ed = (root.abene && root.abene.editor) || document.getElementById('editor');
        if (!ed) return false;
        try {
            if (typeof root.saveDocument === 'function') root.saveDocument({ silent: true });
        } catch (eSave) {}
        ed.innerHTML = sanitizeImportedHtml(html);
        var st = docState();
        if (st) st.dirty = true;
        if (typeof root.saveUndoState === 'function') root.saveUndoState();
        if (typeof root.updateStats === 'function') root.updateStats();
        if (typeof root.refreshPagination === 'function') root.refreshPagination();
        if (typeof root.updateSaveStatus === 'function') root.updateSaveStatus();
        return true;
    }
    function updateStatusUi() {
        var el = document.getElementById('gdocsLinkStatus');
        if (!el) return;
        var link = getLink();
        if (link && link.id) {
            el.style.display = '';
            el.textContent = tt('gdocsLinked', 'Google Docs ligado');
            el.title = link.url || tt('gdocsOpenHint', 'Abrir no Google Docs');
            el.setAttribute('data-url', link.url || '');
        } else {
            el.style.display = 'none';
            el.textContent = '';
            el.removeAttribute('data-url');
        }
        ['gdocsPullBtn', 'btnGdocsPull'].forEach(function (id) {
            var pullBtn = document.getElementById(id);
            if (pullBtn) pullBtn.style.display = (link && link.id) ? '' : 'none';
        });
    }
    function openInGoogleDocs() {
        if (busy) return;
        if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        if (!cloudReady()) {
            openSettingsHint();
            return;
        }
        if (typeof root.buildDocxBlob !== 'function') {
            toast(tt('aNoDocx', 'A biblioteca DOCX não está carregada.'));
            return;
        }
        busy = true;
        var existing = getLink();
        toast(existing
            ? tt('gdocsUpdating', 'A atualizar o Google Docs ligado…')
            : tt('gdocsSending', 'A enviar para o Google Docs…'));
        root.buildDocxBlob().then(function (blob) {
            if (!blob) throw new Error('no-blob');
            if (blob.size > MAX_BYTES) throw new Error('too-large');
            return blobToBase64(blob).then(function (b64) {
                var payload = { name: docName(), base64: b64 };
                if (existing && existing.id) payload.fileId = existing.id;
                return root.abeneSheetsCall('OPEN_GDOCS', payload);
            });
        }).then(function (json) {
            var id = json && json.id;
            var url = (json && (json.url || json.webViewLink)) || '';
            if (!url && id) url = 'https://docs.google.com/document/d/' + String(id).replace(/[^a-zA-Z0-9_-]/g, '') + '/edit';
            if (!id || !url) throw new Error('no-url');
            setLink(id, url);
            toast(json.updated
                ? tt('gdocsUpdatedOpen', 'Mesmo documento atualizado — a abrir o Google Docs.')
                : tt('gdocsOpened', 'Documento aberto no Google Docs.'));
            try {
                root.open(url, '_blank', 'noopener,noreferrer');
            } catch (eOpen) {
                root.location.href = url;
            }
        }).catch(function (err) {
            handleErr(err);
        }).then(function () { busy = false; }, function () { busy = false; });
    }
    function pullFromGoogleDocs() {
        if (busy) return;
        if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        var link = getLink();
        if (!link || !link.id) {
            toast(tt('gdocsNeedLink', 'Ainda não há Google Docs ligado a este documento. Abra primeiro em Google Docs.'));
            return;
        }
        if (!cloudReady()) {
            openSettingsHint();
            return;
        }
        busy = true;
        toast(tt('gdocsPulling', 'A atualizar a partir do Google Docs…'));
        root.abeneSheetsCall('PULL_GDOCS', { fileId: link.id }).then(function (json) {
            if (!json || !json.html) throw new Error('empty');
            if (!applyHtmlToEditor(json.html)) throw new Error('no-editor');
            if (json.url) setLink(link.id, json.url);
            toast(tt('gdocsPulled', 'Documento atualizado a partir do Google Docs.'));
        }).catch(function (err) {
            handleErr(err);
        }).then(function () { busy = false; }, function () { busy = false; });
    }
    function handleErr(err) {
        var msg = String((err && err.message) || err || '');
        if (/no-url|no-cloud/i.test(msg) || msg === 'no-url') openSettingsHint();
        else if (/too-large/i.test(msg)) toast(tt('gdocsTooLarge', 'Documento demasiado grande (máx. ~4,5 MB). Reduza imagens e tente de novo.'));
        else if (/Unknown action/i.test(msg)) toast(tt('gdocsNeedUpdate', 'Atualize o script emaildrive no Google (versão 2.5) e implante uma nova aplicação web.'));
        else if (/no-blob|aNoDocx/i.test(msg)) toast(tt('aNoDocx', 'A biblioteca DOCX não está carregada.'));
        else if (/id|NeedLink/i.test(msg)) toast(tt('gdocsNeedLink', 'Ainda não há Google Docs ligado a este documento.'));
        else toast(tt('gdocsFail', 'Não foi possível sincronizar com o Google Docs.') + (msg ? ' (' + msg.slice(0, 80) + ')' : ''));
    }
    function restoreFromStorage() {
        var st = docState();
        if (st && st.gdocsFileId) {
            updateStatusUi();
            return;
        }
        try {
            var id = localStorage.getItem('abeneGdocsFileId') || '';
            var url = localStorage.getItem('abeneGdocsUrl') || '';
            if (id) setLink(id, url);
            else updateStatusUi();
        } catch (e) {
            updateStatusUi();
        }
    }

    root.abeneOpenInGoogleDocs = openInGoogleDocs;
    root.openInGoogleDocs = openInGoogleDocs;
    root.abenePullFromGoogleDocs = pullFromGoogleDocs;
    root.abeneGdocsGetLink = getLink;
    root.abeneGdocsSetLink = setLink;
    root.abeneGdocsClearLink = clearLink;
    root.abeneGdocsForkOnCopy = forkLinkOnCopy;
    root.abeneGdocsUpdateStatus = updateStatusUi;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restoreFromStorage);
    } else {
        setTimeout(restoreFromStorage, 0);
    }
})(typeof window !== 'undefined' ? window : this);
