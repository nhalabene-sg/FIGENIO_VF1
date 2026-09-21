/* Revision-checked sync of editable drafts. Never merges concurrent edits.
 * Draft id = archiveEntryId (Arquivo) or "current" (untitled). Requires Apps Script
 * safeDocumentSync; multi-id needs multiDocumentSync (emaildrive 2.8+).
 *
 * Additive: offline SYNC_DOCUMENT queue + flush on online; scoped abeneBeforeCloudReplace
 * with restore-on-fail; never overwrite protected docs. No OT merge.
 * audit5: rebind sync on New/Import (index) + ignore stale base.documentId. */
(function () {
    'use strict';
    var busy = false, ready = false, conflict = null, timer, scope = '', base = null;
    var multiOk = false, lastKind = 'idle', flushTimer;

    function state() { return (window.abene || {}).documentState || {}; }
    function tt(key, fb) {
        if (typeof window.t === 'function') {
            var v = window.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
    }
    function sanitizeId(raw) {
        var id = String(raw || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
        return id || 'current';
    }
    function docId() {
        return sanitizeId(state().archiveEntryId || 'current');
    }
    function connRoot() {
        var c = (window.abene || {}).companyData || {};
        return String(c.appsScriptUrl || window.API_URL || '');
    }
    function snapshot() {
        var settings = JSON.parse(projectSettings());
        // Connection credentials and company preferences are not document content.
        delete settings.company;
        return {
            id: docId(),
            name: state().name || 'Documento1',
            html: persistableEditorHtml(),
            settings: JSON.stringify(settings)
        };
    }
    function key() {
        return 'abeneDocumentSync:' + connRoot() + ':' + docId();
    }
    function queueStoreKey() {
        return 'abeneDocumentSyncQueue:' + connRoot();
    }
    function fingerprint(doc) {
        if (!doc) return '';
        var settings = JSON.parse(doc.settings || '{}');
        delete settings.company;
        return JSON.stringify([doc.name || '', doc.html || '', settings]);
    }
    function status(text, kind) {
        lastKind = kind || lastKind || 'idle';
        var el = document.getElementById('documentSyncStatus');
        if (!el) {
            el = document.createElement('button');
            el.id = 'documentSyncStatus'; el.type = 'button';
            el.style.cssText = 'max-width:100%;white-space:normal;cursor:pointer;font:inherit;border:0;background:transparent;padding:0;text-align:left';
            el.onclick = resolveConflict;
            var host = document.getElementById('saveStatus');
            if (host && host.parentNode) host.parentNode.appendChild(el);
        }
        el.textContent = text;
        var tip = conflict
            ? tt('docSyncConflictHint', 'Sem fusão automática. Clique para escolher a versão a conservar (local ou Drive).')
            : (lastKind === 'queued'
                ? tt('docSyncQueuedHint', 'Alterações em fila — serão enviadas quando houver ligação.')
                : (text + ' — ' + tt('docSyncNoOt', 'Não há sincronização em tempo real tipo Google Docs.')));
        el.title = tip;
        if (lastKind === 'conflict') el.style.color = '#c0392b';
        else if (lastKind === 'syncing') el.style.color = '#C9A84C';
        else if (lastKind === 'queued') el.style.color = '#d68910';
        else if (lastKind === 'ok') el.style.color = '#7dcea0';
        else if (lastKind === 'warn') el.style.color = '#C9A84C';
        else el.style.color = '';
    }
    function remember(revision, doc) {
        var next = { revision: revision || '', fingerprint: fingerprint(doc), documentId: docId() };
        localStorage.setItem(scope, JSON.stringify(next));
        base = next;
    }
    function readQueue() {
        try {
            var raw = localStorage.getItem(queueStoreKey());
            var q = raw ? JSON.parse(raw) : {};
            return q && typeof q === 'object' ? q : {};
        } catch (e) {
            return {};
        }
    }
    function writeQueue(q) {
        localStorage.setItem(queueStoreKey(), JSON.stringify(q || {}));
    }
    function enqueue(reason) {
        if (state().protected) return false;
        if (!window.abeneSheetsEnabled || !window.abeneSheetsEnabled()) return false;
        var id = docId();
        var q = readQueue();
        q[id] = {
            documentId: id,
            fingerprint: fingerprint(snapshot()),
            queuedAt: Date.now(),
            reason: reason || 'offline'
        };
        writeQueue(q);
        status(tt('docSyncQueued', 'Fila de sincronização — aguarda ligação'), 'queued');
        return true;
    }
    function dequeue(id) {
        var q = readQueue();
        var target = id || docId();
        if (!q[target]) return;
        delete q[target];
        writeQueue(q);
    }
    function hasQueued(id) {
        var q = readQueue();
        return !!q[id || docId()];
    }
    function localNeedsPush() {
        try {
            if (state().dirty) return true;
            var localPrint = fingerprint(snapshot());
            if (!base) return !!localPrint && hasQueued();
            return localPrint !== base.fingerprint;
        } catch (e) {
            return hasQueued();
        }
    }
    function backupKey(id) {
        return 'abeneBeforeCloudReplace:' + (id || docId());
    }
    function backup(doc) {
        // If storage is full, throw BEFORE replacing anything.
        var payload = JSON.stringify({
            at: Date.now(),
            documentId: docId(),
            document: doc
        });
        localStorage.setItem(backupKey(), payload);
        // Legacy single key kept for older recovery paths / prior QA tools.
        try {
            localStorage.setItem('abeneBeforeCloudReplace', payload);
        } catch (e) { /* scoped key already saved */ }
    }
    function readBackup(id) {
        var raw = localStorage.getItem(backupKey(id)) || localStorage.getItem('abeneBeforeCloudReplace');
        if (!raw) return null;
        try {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.document) return parsed;
            // Legacy: raw was the document snapshot itself.
            if (parsed && (parsed.html != null || parsed.settings != null)) {
                return { at: 0, documentId: id || docId(), document: parsed };
            }
        } catch (e) { /* ignore */ }
        return null;
    }
    function restoreFromSnapshot(doc) {
        if (!doc) return false;
        var clean = Object.assign({}, doc);
        var settings = JSON.parse(clean.settings || '{}');
        delete settings.company;
        clean.settings = JSON.stringify(settings);
        window.abeneSheetsApplyDocument(clean);
        localStorage.setItem('abeneProjectSettings', projectSettings());
        return true;
    }
    function applyRemote(remote) {
        if (state().protected) {
            throw new Error(tt('docSyncReplaceBlocked', 'Documento protegido — substituição a partir do Drive bloqueada'));
        }
        if (!remote) {
            throw new Error(tt('docSyncBackupFail', 'Não foi possível guardar a cópia local'));
        }
        var localBefore = snapshot();
        backup(localBefore);
        // Re-read proves the backup is actually readable before we mutate the editor.
        if (!readBackup()) {
            throw new Error(tt('docSyncBackupFail', 'Não foi possível guardar a cópia local'));
        }
        try {
            var clean = Object.assign({}, remote);
            var settings = JSON.parse(clean.settings || '{}');
            delete settings.company;
            clean.settings = JSON.stringify(settings);
            window.abeneSheetsApplyDocument(clean);
            localStorage.setItem('abeneProjectSettings', projectSettings());
            state().dirty = false;
        } catch (e) {
            try {
                restoreFromSnapshot(localBefore);
                status(tt('docSyncRestored', 'Cópia local restaurada após falha ao aplicar o Drive'), 'warn');
            } catch (e2) { /* keep original error */ }
            throw e;
        }
    }
    function showConflict(remote) {
        conflict = remote;
        status(tt('docSyncConflict', 'Conflito entre dispositivos — clique para escolher'), 'conflict');
        if (typeof showToast === 'function') {
            showToast(tt('docSyncConflictToast', 'Conflito Drive: duas versões diferentes. Sem fusão automática — escolha qual conservar.'));
        }
    }
    function resolveConflict() {
        if (!conflict || busy) { sync(true); return; }
        if (state().protected) {
            status(tt('docSyncLocal', 'Guardado neste dispositivo') + ' — ' + tt('docSyncDraftEntry', 'documento do Arquivo') + ' (leitura)', 'warn');
            return;
        }
        var remote = conflict;
        var idLabel = docId() === 'current'
            ? tt('docSyncDraftCurrent', 'rascunho atual')
            : (tt('docSyncDraftEntry', 'documento do Arquivo') + ' (' + docId() + ')');
        window.alert(tt('docSyncConflictIntro', 'Há alterações neste dispositivo e no Drive para o mesmo documento.') +
            '\n\n' + idLabel + '\n\n' +
            tt('docSyncNoOt', 'Não há sincronização em tempo real tipo Google Docs.') + ' ' +
            tt('docSyncConflictHint', 'Sem fusão automática. Clique para escolher a versão a conservar (local ou Drive).'));
        if (window.confirm(tt('docSyncTakeRemote', 'Carregar a versão do Drive? A versão deste dispositivo fica guardada como cópia de segurança. Cancelar = manter local e decidir a seguir.'))) {
            try {
                applyRemote(remote.document);
                remember(remote.revision, snapshot());
                conflict = null;
                dequeue(docId());
                status(tt('docSyncUpdatedFromDrive', 'Documento atualizado a partir do Drive'), 'ok');
            } catch (e) {
                status(tt('docSyncBackupFail', 'Não foi possível guardar a cópia local') + ': ' + (e && e.message ? e.message : e), 'warn');
            }
        } else if (window.confirm(tt('docSyncPushLocal', 'Enviar a versão deste dispositivo para o Drive? A versão anterior do Drive fica no histórico. Cancelar = manter ambas sem substituir.'))) {
            // The server rechecks this revision under its lock.
            base = { revision: remote.revision, fingerprint: '', documentId: docId() };
            conflict = null;
            sync(true);
        } else {
            status(tt('docSyncConflict', 'Conflito entre dispositivos — clique para escolher'), 'conflict');
        }
    }
    function isLikelyNetworkError(e) {
        var msg = String((e && e.message) || e || '').toLowerCase();
        if (navigator.onLine === false) return true;
        return /network|offline|failed to fetch|load failed|timeout|timed out|net::|err_internet|err_connection|abort/i.test(msg);
    }
    async function sync(explicit) {
        if (busy) return;
        if (scope !== key()) { conflict = null; ready = false; multiOk = false; base = null; scope = ''; }
        if (conflict) {
            if (explicit) status(tt('docSyncConflict', 'Conflito entre dispositivos — clique para escolher'), 'conflict');
            return;
        }
        /* Fix #5: never push/pull read-only Arquivo views into Drive drafts (esp. "current"). */
        if (state().protected) {
            if (explicit) status(tt('docSyncLocal', 'Guardado neste dispositivo') + ' — ' + tt('docSyncDraftEntry', 'documento do Arquivo') + ' (leitura)', 'warn');
            return;
        }
        if (!window.abeneSheetsEnabled || !window.abeneSheetsEnabled()) {
            if (explicit) status(tt('docSyncNeedSetup', 'Guardado neste dispositivo — configure a ligação Drive'), 'warn');
            return;
        }
        if (navigator.onLine === false) {
            if (explicit || localNeedsPush() || hasQueued()) {
                enqueue(explicit ? 'save' : 'offline');
            } else {
                status(tt('docSyncOffline', 'Guardado neste dispositivo — sem ligação'), 'warn');
            }
            return;
        }
        busy = true;
        if (hasQueued()) {
            status(tt('docSyncFlushing', 'A enviar fila de sincronização…'), 'syncing');
        } else {
            status(tt('docSyncSyncing', 'A sincronizar com o Drive…'), 'syncing');
        }
        try {
            if (scope !== key()) {
                scope = key(); ready = false; multiOk = false;
                base = JSON.parse(localStorage.getItem(scope) || 'null');
                // Multi-device / multi-entry: never reuse a base remembered for another archiveEntryId.
                if (base && base.documentId && base.documentId !== docId()) base = null;
            }
            var id = docId();
            if (!ready) {
                var ping = await window.abeneSheetsCall('PING');
                if (!ping.safeDocumentSync) {
                    status(tt('docSyncNeedScript', 'Guardado neste dispositivo — atualizar Apps Script para sincronizar'), 'warn');
                    return;
                }
                multiOk = !!ping.multiDocumentSync;
                if (id !== 'current' && !multiOk) {
                    status(tt('docSyncNeedScriptArquivo', 'Documento do Arquivo: atualizar Apps Script (2.8+) para sincronizar entre dispositivos'), 'warn');
                    return;
                }
                ready = true;
            } else if (id !== 'current' && !multiOk) {
                status(tt('docSyncNeedScriptArquivo', 'Documento do Arquivo: atualizar Apps Script (2.8+) para sincronizar entre dispositivos'), 'warn');
                return;
            }
            var remote = await window.abeneSheetsCall('SYNC_DOCUMENT', { documentId: id });
            var local = snapshot();
            var localPrint = fingerprint(local);
            var remotePrint = fingerprint(remote.document);
            if (localPrint === remotePrint) {
                remember(remote.revision, local);
            } else if (base && localPrint === base.fingerprint && remote.document) {
                // No local edits: adopt the newer shared version (safe replace).
                applyRemote(remote.document);
                remember(remote.revision, snapshot());
            } else if ((base && base.revision === remote.revision) || !remote.document) {
                var result = await window.abeneSheetsCall('SYNC_DOCUMENT', {
                    documentId: id,
                    baseRevision: remote.revision,
                    document: local
                });
                if (result.conflict) { showConflict(result); return; }
                remember(result.revision, local);
                // Edits made during the request remain dirty and will be sent later.
                if (fingerprint(snapshot()) !== localPrint) schedule();
            } else {
                showConflict(remote); return;
            }
            dequeue(id);
            status(
                id === 'current'
                    ? tt('docSyncOk', 'Documento sincronizado com o Drive')
                    : tt('docSyncOkEntry', 'Documento do Arquivo sincronizado com o Drive'),
                'ok'
            );
        } catch (e) {
            if (isLikelyNetworkError(e)) {
                enqueue('error');
                status(tt('docSyncQueued', 'Fila de sincronização — aguarda ligação') + ': ' + String(e.message || e), 'queued');
            } else {
                if (localNeedsPush()) enqueue('error');
                status(tt('docSyncPending', 'Cópia local conservada — sincronização pendente') + ': ' + String(e.message || e), 'warn');
            }
        } finally { busy = false; }
    }
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(function () { sync(false); }, 2500);
    }
    function flushQueueSoon() {
        clearTimeout(flushTimer);
        flushTimer = setTimeout(function () {
            if (navigator.onLine === false) return;
            if (hasQueued() || localNeedsPush()) {
                status(tt('docSyncFlushing', 'A enviar fila de sincronização…'), 'syncing');
            }
            sync(false);
        }, 400);
    }
    function onDocChange() {
        conflict = null;
        ready = false;
        multiOk = false;
        scope = '';
        base = null;
        // Surface queued state for the newly active archiveEntryId / current draft.
        if (hasQueued() && navigator.onLine === false) {
            status(tt('docSyncQueued', 'Fila de sincronização — aguarda ligação'), 'queued');
        }
        schedule();
    }
    window.abeneDocumentSyncSave = function () { return sync(true); };
    window.abeneDocumentSyncOnDocChange = onDocChange;
    window.abeneDocumentSyncHasQueued = function () { return hasQueued(); };
    window.abeneBeforeCloudReplaceRead = function (id) { return readBackup(id); };
    document.addEventListener('input', function (event) {
        var editor = document.getElementById('editor');
        if (editor && editor.contains(event.target)) {
            if (navigator.onLine === false && !state().protected) {
                enqueue('offline');
            }
            schedule();
        }
    });
    window.addEventListener('online', flushQueueSoon);
    window.addEventListener('offline', function () {
        if (state().protected) {
            status(tt('docSyncOffline', 'Guardado neste dispositivo — sem ligação'), 'warn');
            return;
        }
        if (localNeedsPush() || hasQueued()) enqueue('offline');
        else status(tt('docSyncOffline', 'Guardado neste dispositivo — sem ligação'), 'warn');
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
    setInterval(function () { if (!document.hidden) sync(false); }, 20000);
    setTimeout(function () {
        if (hasQueued() && navigator.onLine !== false) flushQueueSoon();
        else if (hasQueued()) status(tt('docSyncQueued', 'Fila de sincronização — aguarda ligação'), 'queued');
        else sync(false);
    }, 1500);
})();
