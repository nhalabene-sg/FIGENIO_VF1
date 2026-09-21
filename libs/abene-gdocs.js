/* Genius Raros — Google Docs ligado (mesmo ficheiro Drive, sem duplicar).
   Requer emaildrive ≥ 2.7 (OPEN_GDOCS update même fichier + PULL_GDOCS).
   Fix #1: réutilise le même Google Doc lié (Arquivo + projectSettings + entry key).\n   Audit 2026-09-21: clearLink n'efface plus l'Arquivo par défaut; wipe sur not-owned/unavailable. */
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
    function documentStamp() {
        var st = docState() || {};
        var ed = (root.abene && root.abene.editor) || document.getElementById('editor');
        return JSON.stringify([st.archiveEntryId || '', st.name || '', st.gdocsFileId || '',
            typeof root.persistableEditorHtml === 'function' ? root.persistableEditorHtml() : (ed ? ed.innerHTML : '')]);
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
    function archiveEntryId() {
        var st = docState();
        return st && st.archiveEntryId ? String(st.archiveEntryId) : '';
    }
    function linkFromParts(id, url) {
        id = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!id) return null;
        return {
            id: id,
            url: url || ('https://docs.google.com/document/d/' + id + '/edit')
        };
    }
    function readArquivoEntryLink(entryId) {
        entryId = String(entryId || '');
        if (!entryId) return null;
        try {
            var api = root.abeneArquivoApi;
            if (api && typeof api.getEntryGdocsLink === 'function') {
                var fromApi = api.getEntryGdocsLink(entryId);
                if (fromApi && fromApi.id) return linkFromParts(fromApi.id, fromApi.url);
            }
            var list = JSON.parse(localStorage.getItem('abeneArquivoV1') || '[]');
            if (!Array.isArray(list)) return null;
            var hit = list.filter(function (item) { return item && String(item.id || '') === entryId; })[0];
            if (hit && hit.gdocsFileId) return linkFromParts(hit.gdocsFileId, hit.gdocsUrl);
        } catch (eArq) {}
        return null;
    }
    function persistLinkToArquivo(id, url) {
        var entryId = archiveEntryId();
        if (!entryId) return;
        try {
            var api = root.abeneArquivoApi;
            if (api && typeof api.persistGdocsLink === 'function') {
                api.persistGdocsLink(entryId, id || '', url || '');
                return;
            }
        } catch (eP) {}
    }
    function getLink() {
        var st = docState();
        if (st && st.gdocsFileId) {
            return linkFromParts(st.gdocsFileId, st.gdocsUrl);
        }
        var entryId = archiveEntryId();
        if (entryId) {
            var fromEntry = readArquivoEntryLink(entryId);
            if (fromEntry) return fromEntry;
            try {
                var map = readLinkStore();
                var keyed = map['entry:' + entryId];
                if (keyed && keyed.id) return linkFromParts(keyed.id, keyed.url);
            } catch (eMap) {}
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
        var entryId = archiveEntryId();
        if (entryId) map['entry:' + entryId] = { id: id, url: url, at: new Date().toISOString() };
        // Keep name key only as non-authoritative cache (identity = archiveEntryId).
        map[docName()] = { id: id, url: url, at: new Date().toISOString(), entryId: entryId || '' };
        writeLinkStore(map);
        try {
            localStorage.setItem('abeneGdocsFileId', id);
            localStorage.setItem('abeneGdocsUrl', url);
            var settings = JSON.parse(localStorage.getItem('abeneProjectSettings') || '{}');
            settings.gdocsFileId = id;
            settings.gdocsUrl = url;
            if (entryId) settings.archiveEntryId = entryId;
            if (!settings.gdocsByEntry || typeof settings.gdocsByEntry !== 'object') settings.gdocsByEntry = {};
            if (entryId) settings.gdocsByEntry[entryId] = { id: id, url: url };
            localStorage.setItem('abeneProjectSettings', JSON.stringify(settings));
        } catch (e2) {}
        persistLinkToArquivo(id, url);
        updateStatusUi();
    }
    function clearLink(opts) {
        // opts.wipeArquivo: only when the link is known dead (not-owned / unavailable).
        // Default false — avoids wiping the previous Arquivo entry on import / Novo / detach.
        opts = opts || {};
        var wipeArquivo = !!opts.wipeArquivo;
        var st = docState();
        var oldId = st && st.gdocsFileId ? String(st.gdocsFileId) : '';
        var entryId = archiveEntryId();
        if (st) {
            st.gdocsFileId = '';
            st.gdocsUrl = '';
        }
        var map = readLinkStore();
        Object.keys(map).forEach(function (key) {
            var hit = map[key] || {};
            if (key === docName() || (entryId && key === ('entry:' + entryId)) ||
                (oldId && String(hit.id || '') === oldId)) delete map[key];
        });
        writeLinkStore(map);
        try {
            localStorage.removeItem('abeneGdocsFileId');
            localStorage.removeItem('abeneGdocsUrl');
            var settings = JSON.parse(localStorage.getItem('abeneProjectSettings') || '{}');
            settings.gdocsFileId = '';
            settings.gdocsUrl = '';
            if (wipeArquivo && entryId && settings.gdocsByEntry && typeof settings.gdocsByEntry === 'object') {
                delete settings.gdocsByEntry[entryId];
            }
            localStorage.setItem('abeneProjectSettings', JSON.stringify(settings));
        } catch (e3) {}
        if (wipeArquivo) persistLinkToArquivo('', '');
        updateStatusUi();
    }
    function forkLinkOnCopy() {
        // Copy must never share the previous report's Google Doc.
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
        // Refuse replacement if a recovery copy cannot be stored.
        localStorage.setItem('abeneBeforeGoogleDocsPull', JSON.stringify({
            html: typeof root.persistableEditorHtml === 'function' ? root.persistableEditorHtml() : ed.innerHTML,
            settings: typeof root.projectSettings === 'function' ? root.projectSettings() : '',
            at: new Date().toISOString()
        }));
        ed.innerHTML = sanitizeImportedHtml(html);
        localStorage.setItem('docContent', ed.innerHTML);
        localStorage.setItem('abeneAutosave', ed.innerHTML);
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
    function openInGoogleDocs(options) {
        if (busy) return;
        if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        var existing = getLink();
        if (existing && !(options && options.send)) {
            root.open('https://docs.google.com/document/d/' + existing.id + '/edit', '_blank', 'noopener,noreferrer');
            updateStatusUi();
            return;
        }
        if (existing && !root.confirm('Enviar o conteúdo atual de ABENE para o mesmo Google Docs? Isto substitui o conteúdo no Google Docs. Se trabalhou lá, use primeiro «Atualizar Docs».')) return;
        if (!cloudReady()) {
            openSettingsHint();
            return;
        }
        if (typeof root.buildDocxBlob !== 'function') {
            toast(tt('aNoDocx', 'A biblioteca DOCX não está carregada.'));
            return;
        }
        busy = true;
        var startedStamp = documentStamp();
        var startedName = docName();
        var pendingTab = root.open('about:blank', '_blank');
        if (pendingTab) pendingTab.opener = null;
        toast(existing
            ? tt('gdocsUpdating', 'A atualizar o Google Docs ligado…')
            : tt('gdocsSending', 'A enviar para o Google Docs…'));
        root.abeneSheetsCall('PING').then(function () {
            if (documentStamp() !== startedStamp) throw new Error('document-changed');
            return root.buildDocxBlob();
        }).then(function (blob) {
            if (documentStamp() !== startedStamp) throw new Error('document-changed');
            if (!blob) throw new Error('no-blob');
            if (blob.size > MAX_BYTES) throw new Error('too-large');
            return blobToBase64(blob).then(function (b64) {
                if (documentStamp() !== startedStamp) throw new Error('document-changed');
                var payload = { name: startedName, base64: b64 };
                if (existing && existing.id) {
                    payload.fileId = existing.id;
                    payload.gdocsFileId = existing.id;
                    payload.id = existing.id;
                }
                return root.abeneSheetsCall('OPEN_GDOCS', payload);
            });
        }).then(function (json) {
            var id = json && json.id;
            var url = (json && (json.url || json.webViewLink)) || '';
            if (!url && id) url = 'https://docs.google.com/document/d/' + String(id).replace(/[^a-zA-Z0-9_-]/g, '') + '/edit';
            if (!id || !url) throw new Error('no-url');
            // Guard: if we asked to update an existing link, never silently adopt a different new Doc.
            if (existing && existing.id && String(id) !== String(existing.id) && !json.updated) {
                throw new Error('linked-file-fork-blocked');
            }
            if (documentStamp() !== startedStamp) {
                // Keep the returned link recoverable without attaching it to another report.
                localStorage.setItem('abenePendingGdocsLink', JSON.stringify({name: startedName, id: id, url: url, at: new Date().toISOString()}));
                if (pendingTab && !pendingTab.closed) pendingTab.location.href = 'https://docs.google.com/document/d/' + id + '/edit';
                toast('Documento enviado, mas o relatório aberto mudou. A ligação foi conservada para recuperação; o documento atual não foi substituído.');
                return;
            }
            setLink(id, url);
            toast(json.updated
                ? tt('gdocsUpdatedOpen', 'Mesmo documento atualizado — a abrir o Google Docs.')
                : tt('gdocsOpened', 'Documento aberto no Google Docs.'));
            if (pendingTab && !pendingTab.closed) pendingTab.location.href = 'https://docs.google.com/document/d/' + id + '/edit';
            else toast('Documento ligado. Clique em «Google Docs ligado» para abrir.');
        }).catch(function (err) {
            if (pendingTab && !pendingTab.closed) pendingTab.close();
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
        if ((docState() || {}).protected) {
            toast('Documento protegido: crie uma cópia editável antes de importar do Google Docs.');
            return;
        }
        if (!root.confirm('Carregar as alterações do Google Docs neste documento ABENE? A versão local atual será conservada como cópia de segurança.')) return;
        var startedStamp = documentStamp();
        busy = true;
        toast(tt('gdocsPulling', 'A atualizar a partir do Google Docs…'));
        root.abeneSheetsCall('PULL_GDOCS', { fileId: link.id }).then(function (json) {
            if (!json || !json.html) throw new Error('empty');
            if (documentStamp() !== startedStamp) throw new Error('document-changed');
            if (!applyHtmlToEditor(json.html)) throw new Error('no-editor');
            if (json.url) setLink(link.id, json.url);
            toast(tt('gdocsPulled', 'Documento atualizado a partir do Google Docs.'));
        }).catch(function (err) {
            handleErr(err);
        }).then(function () { busy = false; }, function () { busy = false; });
    }
    function handleErr(err) {
        var msg = String((err && err.message) || err || '');
        if (msg === 'document-changed') toast('O documento mudou durante a operação. As alterações locais foram conservadas; tente novamente no relatório pretendido.');
        else if (msg === 'token') toast('Ligação Google recusada: a chave de acesso nas Definições não corresponde à chave do Apps Script. O documento local foi conservado.');
        else if (/google-html-response|api-http-(401|403|404|405)|<!doctype|<html/i.test(msg)) toast('O Google devolveu uma página de acesso ou de erro, não a resposta da API. Verifique o URL /exec, o deployment e a autorização do Apps Script. O documento local foi conservado.');
        else if (/no-url|no-cloud/i.test(msg) || msg === 'no-url') openSettingsHint();
        else if (/too-large/i.test(msg)) toast(tt('gdocsTooLarge', 'Documento demasiado grande (máx. ~4,5 MB). Reduza imagens e tente de novo.'));
        else if (/Unknown action/i.test(msg)) toast(tt('gdocsNeedUpdate', 'Atualize o script emaildrive no Google (versão 2.7+) e implante uma nova aplicação web.'));
        else if (/no-blob|aNoDocx/i.test(msg)) toast(tt('aNoDocx', 'A biblioteca DOCX não está carregada.'));
        else if (/^(id|NeedLink)$/.test(msg)) toast(tt('gdocsNeedLink', 'Ainda não há Google Docs ligado a este documento.'));
        else if (/linked-file-invalid|not-owned/i.test(msg)) {
            try { clearLink({ wipeArquivo: true }); } catch (eOwn) {}
            toast(tt('gdocsNotOwned',
                'O Google Docs ligado não está na pasta Google_Docs desta conta (ou não é seu). A ligação foi limpa. Volte a abrir para criar um Doc novo nesta conta.'));
        } else if (/linked-file-unavailable/i.test(msg)) {
            try { clearLink({ wipeArquivo: true }); } catch (eUn) {}
            toast(tt('gdocsUnavailable',
                'O Google Docs ligado está indisponível (apagado ou inacessível). A ligação foi limpa. Volte a abrir se precisar de um Doc novo.'));
        } else if (/linked-file-fork-blocked/i.test(msg)) {
            toast(tt('gdocsForkBlocked',
                'A atualização teria criado outro Google Docs. Operação cancelada para conservar o mesmo ficheiro ligado.'));
        } else toast(tt('gdocsFail', 'Não foi possível sincronizar com o Google Docs.') + (msg ? ' (' + msg.slice(0, 80) + ')' : ''));
    }
    function restoreFromStorage() {
        var st = docState();
        if (st && st.gdocsFileId) {
            updateStatusUi();
            return;
        }
        // Restore only via archiveEntryId (never a global last-used ID alone).
        var entryId = archiveEntryId();
        var restored = null;
        if (entryId) {
            restored = readArquivoEntryLink(entryId);
            if (!restored) {
                try {
                    var map = readLinkStore();
                    var keyed = map['entry:' + entryId];
                    if (keyed && keyed.id) restored = linkFromParts(keyed.id, keyed.url);
                } catch (eM) {}
            }
            if (!restored) {
                try {
                    var settings = JSON.parse(localStorage.getItem('abeneProjectSettings') || '{}');
                    if (settings && settings.gdocsByEntry && settings.gdocsByEntry[entryId]) {
                        restored = linkFromParts(settings.gdocsByEntry[entryId].id, settings.gdocsByEntry[entryId].url);
                    } else if (settings && String(settings.archiveEntryId || '') === entryId && settings.gdocsFileId) {
                        restored = linkFromParts(settings.gdocsFileId, settings.gdocsUrl);
                    }
                } catch (eS) {}
            }
        }
        if (restored && st) {
            st.gdocsFileId = restored.id;
            st.gdocsUrl = restored.url;
        }
        updateStatusUi();
    }

    /* Rever → Atualizar Docs: o botão do friso permanece visível mesmo sem ligação. */
    (function wrapPullRibbonVisible() {
        var orig = updateStatusUi;
        if (orig._abenePullWrap) return;
        updateStatusUi = function () {
            orig.apply(this, arguments);
            var ribbon = document.getElementById('btnGdocsPull');
            if (!ribbon) return;
            ribbon.style.display = '';
            var linked = !!(getLink() && getLink().id);
            ribbon.classList.toggle('active', linked);
        };
        updateStatusUi._abenePullWrap = true;
        updateStatusUi._legacy = orig;
    })();

    root.abeneOpenInGoogleDocs = openInGoogleDocs;
    root.openInGoogleDocs = openInGoogleDocs;
    root.abeneSendToGoogleDocs = function () { return openInGoogleDocs({ send: true }); };
    root.abenePullFromGoogleDocs = pullFromGoogleDocs;
    root.abeneGdocsGetLink = getLink;
    root.abeneGdocsSetLink = setLink;
    root.abeneGdocsClearLink = clearLink;
    root.abeneGdocsForkOnCopy = forkLinkOnCopy;
    root.abeneGdocsUpdateStatus = updateStatusUi;

    /* Rever → Google Docs: botão ativo se ligado; segundo clique não fica mudo; popup bloqueado com toast. */
    (function wrapOpenGdocsUx() {
        function openRibbonBtn() {
            var nodes = document.querySelectorAll('button.ribbon-btn');
            var i, oc;
            for (i = 0; i < nodes.length; i++) {
                oc = nodes[i].getAttribute('onclick') || '';
                if (oc.indexOf('abeneOpenInGoogleDocs') >= 0) return nodes[i];
            }
            return null;
        }
        var origStatus = updateStatusUi;
        if (!origStatus._abeneGdocsOpenWrap) {
            updateStatusUi = function () {
                origStatus.apply(this, arguments);
                var btn = openRibbonBtn();
                var linked = !!(getLink() && getLink().id);
                if (btn) {
                    btn.classList.toggle('active', linked);
                    btn.setAttribute('aria-pressed', linked ? 'true' : 'false');
                }
            };
            updateStatusUi._abeneGdocsOpenWrap = true;
            updateStatusUi._abenePullWrap = !!origStatus._abenePullWrap;
            updateStatusUi._legacy = origStatus;
            root.abeneGdocsUpdateStatus = updateStatusUi;
        }
        var origOpen = openInGoogleDocs;
        if (typeof origOpen === 'function' && !origOpen._abeneGdocsOpenWrap) {
            openInGoogleDocs = function () {
                if (busy) {
                    toast(tt('gdocsBusy', 'Aguarde: a enviar para o Google Docs…'));
                    return;
                }
                return origOpen.apply(this, arguments);
            };
            openInGoogleDocs._abeneGdocsOpenWrap = true;
            openInGoogleDocs._legacy = origOpen;
            root.abeneOpenInGoogleDocs = openInGoogleDocs;
            root.openInGoogleDocs = openInGoogleDocs;
        }
    })();

    /* Rever → Google Docs: reabrir o mesmo documento (mapa por nome); Atualizar Docs nunca mudo se ocupado. */
    (function wrapGdocsLinkRestore() {
        var origGet = getLink;
        if (typeof origGet !== 'function' || origGet._abeneLinkWrap) return;
        getLink = function () {
            var hit = origGet.apply(this, arguments);
            if (hit && hit.id) return hit;
            // Titles are not identities: two reports may share the same name.
            return null;
        };
        getLink._abeneLinkWrap = true;
        getLink._legacy = origGet;
        root.abeneGdocsGetLink = getLink;

        var origPull = pullFromGoogleDocs;
        if (typeof origPull === 'function' && !origPull._abenePullBusy) {
            pullFromGoogleDocs = function () {
                if (busy) {
                    toast(tt('gdocsBusy', 'Aguarde: a enviar para o Google Docs…'));
                    return;
                }
                return origPull.apply(this, arguments);
            };
            pullFromGoogleDocs._abenePullBusy = true;
            pullFromGoogleDocs._legacy = origPull;
            root.abenePullFromGoogleDocs = pullFromGoogleDocs;
        }

        var origRestore = restoreFromStorage;
        if (typeof origRestore === 'function' && !origRestore._abeneLinkWrap) {
            restoreFromStorage = function () {
                return origRestore.apply(this, arguments);
            };
            restoreFromStorage._abeneLinkWrap = true;
            restoreFromStorage._legacy = origRestore;
        }
    })();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restoreFromStorage);
    } else {
        setTimeout(restoreFromStorage, 0);
    }
})(typeof window !== 'undefined' ? window : this);
