/* Genius Raros — Collaboration (P13).
   Google Drive / Sheets em cima do Word. O editor local não é substituído.
   Offline: autosave, versões e sugestões (controlar alterações) continuam no PC. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneCollabEngine') === '0') useEngine = false;
    } catch (e0) {}

    var on = false;
    var pingTimer = null;
    var lastUnknown = 0;

    function A() { return root.abene || {}; }
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
    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function cloudReady() {
        return typeof root.abeneSheetsEnabled === 'function' && root.abeneSheetsEnabled()
            && typeof root.abeneSheetsCall === 'function'
            && root.navigator.onLine !== false;
    }
    function authorName() {
        try {
            return localStorage.getItem('abeneAuthor') || tt('aAuthor', 'Editor');
        } catch (e) {
            return tt('aAuthor', 'Editor');
        }
    }
    function ensureAuthor() {
        var a = '';
        try { a = localStorage.getItem('abeneAuthor') || ''; } catch (e1) {}
        if (a) return a;
        a = (root.prompt && root.prompt(tt('collabAuthorPrompt', 'O seu nome (visível aos outros):'))) || '';
        a = String(a).trim().slice(0, 80) || tt('aAuthor', 'Editor');
        try { localStorage.setItem('abeneAuthor', a); } catch (e2) {}
        return a;
    }
    function presenceKey() {
        var k = '';
        try { k = localStorage.getItem('abenePresenceKey') || ''; } catch (e1) {}
        if (k) return k;
        k = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        try { localStorage.setItem('abenePresenceKey', k); } catch (e2) {}
        return k;
    }
    function colorFor(name) {
        var h = 0, i;
        var s = String(name || 'E');
        for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        var hues = ['#2b579a', '#0f7b6c', '#a84d65', '#d28b36', '#5b4b8a', '#3b82a0'];
        return hues[h % hues.length];
    }
    function initials(name) {
        var p = String(name || 'E').trim().split(/\s+/);
        var a = (p[0] && p[0].charAt(0)) || 'E';
        var b = p.length > 1 ? p[p.length - 1].charAt(0) : (p[0] && p[0].charAt(1)) || '';
        return (a + b).toUpperCase();
    }
    function docId() {
        var st = A().documentState;
        if (st && st.name) return String(st.name).slice(0, 80);
        try { return (localStorage.getItem('abeneDocName') || 'Documento').slice(0, 80); } catch (e) {
            return 'Documento';
        }
    }
    function bodyHtml() {
        if (typeof root.persistableEditorHtml === 'function') return root.persistableEditorHtml();
        var ed = (root.abene && root.abene.editor) || document.getElementById('editor');
        return ed ? ed.innerHTML : '<p></p>';
    }
    function call(action, extra) {
        if (!cloudReady()) return Promise.reject(new Error('no-cloud'));
        return root.abeneSheetsCall(action, extra || {}).catch(function (err) {
            var msg = String((err && err.message) || err || '');
            if (/Unknown action/i.test(msg) && Date.now() - lastUnknown > 20000) {
                lastUnknown = Date.now();
                toast(tt('collabNeedUpdate', 'Atualize o script emaildrive no Google (versão 2.2) e implante uma nova aplicação web.'));
            }
            throw err;
        });
    }
    function setUi() {
        document.body.classList.toggle('abene-collab-on', on && useEngine);
        var btn = document.getElementById('btnCollabMode');
        if (btn) btn.classList.toggle('active', on && useEngine);
        var box = document.getElementById('collabPresence');
        if (box && !(on && useEngine)) {
            box.innerHTML = '';
            box.title = '';
        }
    }
    function renderPeers(peers) {
        var box = document.getElementById('collabPresence');
        if (!box) return;
        var list = Array.isArray(peers) ? peers : [];
        if (!list.length) {
            box.innerHTML = '<span class="abene-peer self" title="' + esc(authorName()) + '">' + esc(initials(authorName())) + '</span>';
            box.title = tt('collabAlone', 'Só eu');
            return;
        }
        box.innerHTML = list.map(function (p) {
            var name = p.author || p.email || '?';
            var cls = p.self ? 'abene-peer self' : 'abene-peer';
            return '<span class="' + cls + '" style="background:' + esc(p.color || '#2b579a') + '" title="' + esc(name) + '">' + esc(initials(name)) + '</span>';
        }).join('');
        var names = list.map(function (p) { return p.author || p.email; }).filter(Boolean).join(', ');
        box.title = tt('collabPeers', 'A editar') + ': ' + names;
    }
    function ping() {
        if (!on || !useEngine) return;
        if (!cloudReady()) {
            renderPeers([{ author: authorName(), self: true, color: colorFor(authorName()) }]);
            return;
        }
        if (document.hidden) return;
        call('COLLAB_PING', {
            presenceKey: presenceKey(),
            author: authorName(),
            email: (A().companyData || {}).email || '',
            color: colorFor(authorName()),
            docId: docId(),
            caret: ''
        }).then(function (json) {
            renderPeers(json && json.peers);
        }).catch(function () {});
    }
    function startPing() {
        stopPing();
        ping();
        pingTimer = setInterval(ping, 20000);
    }
    function stopPing() {
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = null;
    }
    function enableSuggestionsOnce() {
        var st = A().documentState;
        if (st && !st.tracking && typeof root.toggleTrackChanges === 'function') {
            root.toggleTrackChanges();
        }
    }
    function setOn(next, opts) {
        opts = opts || {};
        if (!useEngine) {
            if (!opts.silent) toast(tt('collabDisabled', 'Colaboração desligada (abeneCollabEngine=0).'));
            return;
        }
        on = !!next;
        try { localStorage.setItem('abeneCollabOn', on ? '1' : '0'); } catch (e) {}
        setUi();
        if (on) {
            if (!opts.silent) {
                ensureAuthor();
                enableSuggestionsOnce();
            }
            startPing();
            if (cloudReady() && typeof root.abeneSheetsSchedule === 'function') {
                root.abeneSheetsSchedule('collab');
            }
            if (!opts.silent) {
                toast(cloudReady()
                    ? tt('collabOn', 'Modo Docs ligado. Presença e partilha na nuvem; o Word local não muda.')
                    : tt('collabNeedExec', 'Configure o URL /exec nas Definições para colaborar na nuvem. Offline: versões e sugestões locais.'));
            }
        } else {
            stopPing();
            setUi();
            if (!opts.silent) toast(tt('collabOff', 'Modo Docs desligado. Continua a editar neste computador.'));
        }
    }
    function toggleMode() {
        setOn(!on);
    }
    function shareDialog() {
        if (!useEngine) return;
        if (!cloudReady()) {
            toast(tt('collabNeedExec', 'Configure o URL /exec nas Definições para colaborar na nuvem. Offline: versões e sugestões locais.'));
            if (typeof root.openCompanySettings === 'function') root.openCompanySettings();
            return;
        }
        var body = '<p style="font-size:13px;line-height:1.45;color:#444;margin:0 0 12px;">' + esc(tt('collabShareHint', '')) + '</p>'
            + '<p style="font-size:12px;color:#666;margin:0 0 12px;">' + esc(tt('collabLww', '')) + '</p>'
            + '<div class="form-group"><label for="collabShareEmail">' + esc(tt('collabShareEmail', 'E-mail Google')) + '</label>'
            + '<input id="collabShareEmail" type="email" autocomplete="email"></div>'
            + '<div class="form-group"><label for="collabShareRole">' + esc(tt('collabShareRole', 'Permissão')) + '</label>'
            + '<select id="collabShareRole">'
            + '<option value="editor">' + esc(tt('collabRoleEditor', 'Editor')) + '</option>'
            + '<option value="commenter">' + esc(tt('collabRoleCommenter', 'Comentador')) + '</option>'
            + '<option value="viewer">' + esc(tt('collabRoleViewer', 'Leitor')) + '</option>'
            + '</select></div>';
        if (typeof root.openGenericModal === 'function') {
            root.openGenericModal(
                tt('collabShare', 'Partilhar'),
                body,
                '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('close', 'Fechar')) + '</button>'
                + '<button type="button" class="btn-primary" onclick="ABENE.Collab.shareSubmit()">' + esc(tt('collabShare', 'Partilhar')) + '</button>'
            );
        } else {
            var email = root.prompt && root.prompt(tt('collabShareEmail', 'E-mail Google'));
            if (email) shareSubmit(email, 'editor');
        }
        if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
    }
    function shareSubmit(emailArg, roleArg) {
        var email = emailArg || (document.getElementById('collabShareEmail') && document.getElementById('collabShareEmail').value);
        var role = roleArg || (document.getElementById('collabShareRole') && document.getElementById('collabShareRole').value) || 'editor';
        email = String(email || '').trim();
        if (!email || email.indexOf('@') < 0) {
            toast(tt('collabShareEmail', 'E-mail Google'));
            return;
        }
        call('COLLAB_SHARE', { email: email, role: role }).then(function () {
            toast(tt('collabShareOk', 'Convite enviado.'));
            if (typeof root.closeModal === 'function') root.closeModal('genericModal');
        }).catch(function () {});
    }
    function saveCloudVersion() {
        if (!on || !useEngine || !cloudReady()) return;
        var html = bodyHtml();
        if (!html) return;
        call('COLLAB_VERSION', {
            document: {
                name: docId(),
                html: html,
                author: authorName()
            }
        }).catch(function () {});
    }
    function enrichVersionsModal() {
        if (!on || !useEngine || !cloudReady()) return;
        call('COLLAB_VERSIONS').then(function (json) {
            var list = (json && json.versions) || [];
            if (!list.length) return;
            var body = document.getElementById('genericModalBody');
            if (!body) return;
            var loc = localStorage.getItem('abeneLanguage') || 'pt-PT';
            var extra = '<h4 style="margin:14px 0 8px;color:#2b579a;">' + esc(tt('collabCloudVersions', 'Versões na nuvem')) + '</h4>'
                + list.map(function (v) {
                    var when = v.updatedAt ? new Date(v.updatedAt).toLocaleString(loc) : '';
                    var id = String(v.driveFileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
                    return '<div class="version-row"><span>' + esc(when) + '<br><small>' + esc(v.name || '') + ' · ' + esc(v.author || '') + '</small></span>'
                        + '<button type="button" class="btn-secondary" onclick="ABENE.Collab.restoreCloud(\'' + id + '\')">' + esc(tt('versionsRestore', 'Restaurar')) + '</button></div>';
                }).join('');
            var empty = body.querySelector('p');
            if (empty && !body.querySelector('.version-row')) empty.remove();
            var wrap = document.createElement('div');
            wrap.innerHTML = extra;
            body.appendChild(wrap);
        }).catch(function () {});
    }
    function restoreCloud(driveFileId) {
        if (!driveFileId) return;
        try { if (typeof root.saveDocument === 'function') root.saveDocument({ silent: true }); } catch (e) {}
        call('COLLAB_GET_VERSION', { driveFileId: driveFileId }).then(function (json) {
            if (!json || !json.html) return;
            var ed = (root.abene && root.abene.editor) || document.getElementById('editor');
            if (!ed) return;
            ed.innerHTML = json.html;
            if (A().documentState) A().documentState.dirty = true;
            if (typeof root.saveUndoState === 'function') root.saveUndoState();
            if (typeof root.updateStats === 'function') root.updateStats();
            if (typeof root.updateAllFields === 'function') root.updateAllFields();
            if (typeof root.refreshPagination === 'function') root.refreshPagination();
            if (typeof root.closeModal === 'function') root.closeModal('genericModal');
            toast(tt('versionsRestore', 'Restaurar'));
        }).catch(function () {});
    }
    function wrapFns() {
        var origSave = root.saveDocument;
        if (typeof origSave === 'function' && !origSave._abeneCollab) {
            root.saveDocument = function () {
                var r = origSave.apply(this, arguments);
                saveCloudVersion();
                return r;
            };
            root.saveDocument._abeneCollab = true;
        }
        var origShow = root.showVersions;
        if (typeof origShow === 'function' && !origShow._abeneCollab) {
            root.showVersions = function () {
                var r = origShow.apply(this, arguments);
                enrichVersionsModal();
                return r;
            };
            root.showVersions._abeneCollab = true;
        }
    }
    function onEditorInput() {
        if (!on || !useEngine) return;
        if (cloudReady() && typeof root.abeneSheetsSchedule === 'function') {
            root.abeneSheetsSchedule('collab');
        }
    }
    function boot() {
        wrapFns();
        setUi();
        var ed = document.getElementById('editor');
        if (ed) ed.addEventListener('input', onEditorInput);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) ping();
        });
        var saved = '';
        try { saved = localStorage.getItem('abeneCollabOn') || ''; } catch (e) {}
        if (saved === '1' && useEngine) setOn(true, { silent: true });
        else renderPeers([{ author: authorName(), self: true, color: colorFor(authorName()) }]);
    }

    root.ABENE.Collab = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; if (!v) setOn(false, { silent: true }); },
        get on() { return on; },
        toggleMode: toggleMode,
        shareDialog: shareDialog,
        shareSubmit: shareSubmit,
        restoreCloud: restoreCloud,
        ping: ping
    };
    root.toggleCollabMode = toggleMode;
    root.abeneCollabShare = shareDialog;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else setTimeout(boot, 0);
})(window);
