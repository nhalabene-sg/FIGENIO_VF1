/* Revision-checked sync of the shared editable draft. Never merges concurrent edits. */
(function () {
    'use strict';
    var busy = false, ready = false, conflict = null, timer, scope = '', base = null;
    function state() { return (window.abene || {}).documentState || {}; }
    function snapshot() {
        var settings = JSON.parse(projectSettings());
        // Connection credentials and company preferences are not document content.
        delete settings.company;
        return { id: 'current', name: state().name || 'Documento1',
            html: persistableEditorHtml(), settings: JSON.stringify(settings) };
    }
    function key() {
        var c = (window.abene || {}).companyData || {};
        return 'abeneDocumentSync:' + String(c.appsScriptUrl || window.API_URL || '');
    }
    function fingerprint(doc) {
        if (!doc) return '';
        var settings = JSON.parse(doc.settings || '{}');
        delete settings.company;
        return JSON.stringify([doc.name || '', doc.html || '', settings]);
    }
    function status(text) {
        var el = document.getElementById('documentSyncStatus');
        if (!el) {
            el = document.createElement('button');
            el.id = 'documentSyncStatus'; el.type = 'button';
            el.style.cssText = 'max-width:100%;white-space:normal;cursor:pointer;font:inherit';
            el.onclick = resolveConflict;
            var host = document.getElementById('saveStatus');
            if (host && host.parentNode) host.parentNode.appendChild(el);
        }
        el.textContent = text;
        el.title = conflict ? 'Clique para escolher a versão a conservar' : text;
    }
    function remember(revision, doc) {
        var next = { revision: revision || '', fingerprint: fingerprint(doc) };
        localStorage.setItem(scope, JSON.stringify(next));
        base = next;
    }
    function backup(doc) {
        // If storage is full, throw BEFORE replacing anything.
        localStorage.setItem('abeneBeforeCloudReplace', JSON.stringify(doc));
    }
    function applyRemote(remote) {
        backup(snapshot());
        var clean = Object.assign({}, remote);
        var settings = JSON.parse(clean.settings || '{}');
        delete settings.company;
        clean.settings = JSON.stringify(settings);
        window.abeneSheetsApplyDocument(clean);
        localStorage.setItem('abeneProjectSettings', projectSettings());
        state().dirty = false;
    }
    function showConflict(remote) {
        conflict = remote;
        status('Conflito entre dispositivos — clique para escolher');
    }
    function resolveConflict() {
        if (!conflict || busy) { sync(true); return; }
        var remote = conflict;
        if (window.confirm('Carregar a versão do Drive? A versão deste dispositivo fica guardada como cópia de segurança. Cancelar mantém ambas sem substituir.')) {
            try {
                applyRemote(remote.document);
                remember(remote.revision, snapshot());
                conflict = null;
                status('Documento atualizado a partir do Drive');
            } catch (e) { status('Não foi possível guardar a cópia local: ' + e.message); }
        } else if (window.confirm('Enviar a versão deste dispositivo para o Drive? A versão anterior do Drive será conservada no histórico.')) {
            // The server rechecks this revision under its lock.
            base = { revision: remote.revision, fingerprint: '' };
            conflict = null;
            sync(true);
        }
    }
    async function sync(explicit) {
        if (busy) return;
        if (scope !== key()) { conflict = null; ready = false; }
        if (conflict) return;
        if (!window.abeneSheetsEnabled || !window.abeneSheetsEnabled()) {
            if (explicit) status('Guardado neste dispositivo — configure a ligação Drive');
            return;
        }
        if (navigator.onLine === false) { status('Guardado neste dispositivo — sem ligação'); return; }
        busy = true;
        try {
            if (scope !== key()) {
                scope = key(); ready = false;
                base = JSON.parse(localStorage.getItem(scope) || 'null');
            }
            if (!ready) {
                var ping = await window.abeneSheetsCall('PING');
                if (!ping.safeDocumentSync) {
                    status('Guardado neste dispositivo — atualizar Apps Script para sincronizar');
                    return;
                }
                ready = true;
            }
            var remote = await window.abeneSheetsCall('SYNC_DOCUMENT');
            var local = snapshot();
            var localPrint = fingerprint(local);
            var remotePrint = fingerprint(remote.document);
            if (localPrint === remotePrint) {
                remember(remote.revision, local);
            } else if (base && localPrint === base.fingerprint && remote.document) {
                // No local edits: adopt the newer shared version.
                applyRemote(remote.document);
                remember(remote.revision, snapshot());
            } else if ((base && base.revision === remote.revision) || !remote.document) {
                var result = await window.abeneSheetsCall('SYNC_DOCUMENT', {
                    baseRevision: remote.revision, document: local
                });
                if (result.conflict) { showConflict(result); return; }
                remember(result.revision, local);
                // Edits made during the request remain dirty and will be sent later.
                if (fingerprint(snapshot()) !== localPrint) schedule();
            } else {
                showConflict(remote); return;
            }
            status('Documento sincronizado com o Drive');
        } catch (e) {
            status('Cópia local conservada — sincronização pendente: ' + String(e.message || e));
        } finally { busy = false; }
    }
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(function () { sync(false); }, 2500);
    }
    window.abeneDocumentSyncSave = function () { return sync(true); };
    document.addEventListener('input', function (event) {
        var editor = document.getElementById('editor');
        if (editor && editor.contains(event.target)) schedule();
    });
    window.addEventListener('online', schedule);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
    setInterval(function () { if (!document.hidden) sync(false); }, 20000);
    setTimeout(function () { sync(false); }, 1500);
})();
