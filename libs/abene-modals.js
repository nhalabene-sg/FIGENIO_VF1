/* Genius Raros — modales de mise en page, tableau, image, lien, export, typographie */
(function () {
    function tt(key, vars) {
        return typeof window.t === 'function' ? window.t(key, vars) : key;
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function editorEl() { return document.getElementById('editor'); }
    function insertViaCommands(html) {
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertHTML === 'function') {
            return window.EditorCommands.insertHTML(html);
        }
        var editor = editorEl();
        if (editor) editor.focus();
        try { document.execCommand('insertHTML', false, html); } catch (e) {
            if (editor) editor.insertAdjacentHTML('beforeend', html);
        }
    }
    var savedRange = null;
    function saveCaret() {
        var sel = window.getSelection();
        if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    }
    function restoreCaret() {
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        if (!savedRange) return;
        try {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        } catch (e) {}
    }
    function currentBlock() {
        var editor = editorEl();
        var sel = window.getSelection();
        if (!editor || !sel || !sel.rangeCount) return null;
        var n = sel.anchorNode;
        if (n && n.nodeType === 3) n = n.parentNode;
        while (n && n !== editor) {
            if (n.tagName && /^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE|DIV)$/.test(n.tagName)) return n;
            n = n.parentNode;
        }
        return null;
    }
    function closeFly() {
        try {
            if (typeof hideRibbonFlyout === 'function') hideRibbonFlyout();
        } catch (e) {
            var f = document.getElementById('ribbonFlyout');
            if (f) f.classList.remove('visible');
        }
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
    }
    function field(id, label, inner) {
        return '<div class="form-group"><label for="' + id + '">' + esc(label) + '</label>' + inner + '</div>';
    }
    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }
    function checked(id) {
        var el = document.getElementById(id);
        return !!(el && el.checked);
    }
    function restoreBg() {
        var c = localStorage.getItem('abenePageBg');
        if (!c) return;
        var editor = editorEl();
        if (editor) editor.style.backgroundColor = c;
        var ribbon = document.getElementById('pageBgColor');
        if (ribbon) ribbon.value = c;
        var ps = document.getElementById('psPageBg');
        if (ps) ps.value = c;
    }

    if (typeof window.changePageBg === 'function') {
        var origBg = window.changePageBg;
        window.changePageBg = function (color) {
            origBg(color);
            try { localStorage.setItem('abenePageBg', color); } catch (e) {}
        };
    }

    window.openInsertTableModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        openGenericModal(tt('insertTable'),
            '<div class="form-row">' +
                field('abeneTblRows', tt('pRows'), '<input id="abeneTblRows" type="number" min="1" max="50" value="3">') +
                field('abeneTblCols', tt('pCols'), '<input id="abeneTblCols" type="number" min="1" max="20" value="3">') +
            '</div>' +
            field('abeneTblBorder', tt('tblBorder'),
                '<select id="abeneTblBorder">' +
                    '<option value="thin">' + esc(tt('tblBorderThin')) + '</option>' +
                    '<option value="medium">' + esc(tt('tblBorderMed')) + '</option>' +
                    '<option value="none">' + esc(tt('borderNone')) + '</option>' +
                '</select>') +
            field('abeneTblFill', tt('tblCellBg'), '<input id="abeneTblFill" type="color" value="#ffffff">') +
            '<label style="display:flex;align-items:center;gap:8px;font-size:12px;margin-top:8px;">' +
                '<input type="checkbox" id="abeneTblHeader" checked>' +
                '<span>' + esc(tt('tblHeaderRow')) + '</span>' +
            '</label>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertTable()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abeneApplyInsertTable = function () {
        var rows = Math.max(1, Math.min(50, parseInt(val('abeneTblRows'), 10) || 3));
        var cols = Math.max(1, Math.min(20, parseInt(val('abeneTblCols'), 10) || 3));
        var border = val('abeneTblBorder') || 'thin';
        var fill = val('abeneTblFill') || '#ffffff';
        var header = checked('abeneTblHeader');
        if (typeof closeModal === 'function') closeModal('genericModal');
        var bw = border === 'none' ? '0' : (border === 'medium' ? '2px' : '1px');
        var bc = border === 'none' ? 'transparent' : '#333';
        var cellCss = 'border:' + bw + ' solid ' + bc + ';padding:6px 10px;background:' + fill + ';';
        var html = '<table style="border-collapse:collapse;width:100%;">';
        var r, c, tag, text;
        for (r = 0; r < rows; r++) {
            html += '<tr>';
            for (c = 0; c < cols; c++) {
                tag = (header && r === 0) ? 'th' : 'td';
                text = (header && r === 0)
                    ? (tt('tblHeaderCell') + ' ' + (c + 1))
                    : (tt('tblCell') + ' ' + r + ',' + (c + 1));
                html += '<' + tag + ' style="' + cellCss + '">' + esc(text) + '</' + tag + '>';
            }
            html += '</tr>';
        }
        html += '</table><p></p>';
        restoreCaret();
        var editor = editorEl();
        if (editor) editor.focus();
        insertViaCommands(html);
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.insertCustomTable = function () {
        window.openInsertTableModal();
        var picker = document.getElementById('tableSizePicker');
        if (picker) picker.classList.remove('visible');
    };
    if (typeof window.drawTable === 'function') {
        window.drawTable = function () { window.openInsertTableModal(); };
    }

    window.openInsertImageModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        window._abeneImgFileData = '';
        window._abeneImgFileName = '';
        openGenericModal(tt('imgInsert'),
            '<div class="form-group"><button type="button" class="btn-secondary" onclick="document.getElementById(\'abeneImgFile\').click()">' +
                esc(tt('imgChooseFile')) + '</button>' +
                '<input id="abeneImgFile" type="file" accept="image/*" style="display:none" onchange="abenePreviewImageFile(this)">' +
                '<div id="abeneImgFileName" style="font-size:11px;color:#666;margin-top:6px;"></div>' +
                '<img id="abeneImgPreview" alt="" style="display:none;max-width:100%;max-height:140px;margin-top:8px;border:1px solid #d8dee9;border-radius:4px;">' +
                '</div>' +
            field('abeneImgUrl', tt('pImageUrl'), '<input id="abeneImgUrl" type="url" value="https://">') +
            '<div class="form-row">' +
                field('abeneImgW', tt('imgWidth'), '<input id="abeneImgW" type="number" min="0" max="2000" value="400">') +
                field('abeneImgUnit', tt('imgWidthUnit'),
                    '<select id="abeneImgUnit"><option value="px">px</option><option value="%">%</option></select>') +
            '</div>' +
            field('abeneImgWrap', tt('imgWrap'),
                '<select id="abeneImgWrap">' +
                    '<option value="none">' + esc(tt('objInline')) + '</option>' +
                    '<option value="left">' + esc(tt('objLeft')) + '</option>' +
                    '<option value="right">' + esc(tt('objRight')) + '</option>' +
                    '<option value="center">' + esc(tt('objCenter')) + '</option>' +
                    '<option value="above">' + esc(tt('objAbove')) + '</option>' +
                    '<option value="below">' + esc(tt('objBelow')) + '</option>' +
                    '<option value="free">' + esc(tt('objFree')) + '</option>' +
                    '<option value="behind">' + esc(tt('objBehind')) + '</option>' +
                    '<option value="front">' + esc(tt('objFront')) + '</option>' +
                '</select>'),
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertImage()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abenePreviewImageFile = function (inp) {
        var file = inp && inp.files && inp.files[0];
        if (!file) return;
        if (!/^image\//.test(file.type || '')) {
            if (typeof showToast === 'function') showToast(tt('imgBadFile') || 'Este ficheiro não é uma imagem suportada.');
            return;
        }
        window._abeneImgFileName = file.name || '';
        var nameEl = document.getElementById('abeneImgFileName');
        var prev = document.getElementById('abeneImgPreview');
        if (nameEl) nameEl.textContent = file.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            function show(src) {
                window._abeneImgFileData = src;
                if (prev) {
                    prev.src = src;
                    prev.style.display = 'block';
                }
            }
            if (typeof window.abeneShrinkImageSrc === 'function') {
                window.abeneShrinkImageSrc(e.target.result, file.type, show);
            } else show(e.target.result);
        };
        reader.readAsDataURL(file);
    };
    window.abeneApplyInsertImage = function () {
        var data = window._abeneImgFileData;
        var url = (val('abeneImgUrl') || '').trim();
        var width = Number(val('abeneImgW')) || 0;
        var unit = val('abeneImgUnit') || 'px';
        var wrap = val('abeneImgWrap') || 'none';
        var src = data;
        if (!src) {
            if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) src = url;
        }
        if (!src) {
            if (window._abeneImgFileName && typeof showToast === 'function') {
                showToast(tt('imgWaitPreview') || 'Aguarde a pré-visualização da imagem.');
            } else if (typeof showToast === 'function') showToast(tt('aBadUrl'));
            return;
        }
        if (typeof closeModal === 'function') closeModal('genericModal');
        restoreCaret();
        if (typeof window.abeneInsertPicture === 'function') {
            window.abeneInsertPicture(src, { width: width, unit: unit, wrap: wrap, alt: window._abeneImgFileName || '' });
        } else {
            insertViaCommands('<img data-illustration="true" src="' + esc(src) + '" style="max-width:400px;height:auto;" alt="">');
        }
        window._abeneImgFileData = '';
    };
    window.insertOnlineImage = function () {
        window.openInsertImageModal();
    };

    window.insertLink = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        var editor = editorEl();
        var sel = window.getSelection();
        var selected = sel && sel.toString() ? sel.toString() : '';
        var existing = null;
        var n = sel && sel.rangeCount ? sel.anchorNode : null;
        if (n && n.nodeType === 3) n = n.parentNode;
        while (n && n !== editor) {
            if (n.tagName === 'A') { existing = n; break; }
            n = n.parentNode;
        }
        window._abeneLinkEl = existing || null;
        saveCaret();
        var href = existing ? (existing.getAttribute('href') || '') : 'https://';
        var text = existing ? String(existing.textContent || '') : selected;
        var tgt = existing && existing.getAttribute('target') === '_self' ? '_self' : '_blank';
        var title = existing ? (tt('linkEdit') || 'Editar hiperligação') : tt('link');
        openGenericModal(title,
            field('abeneLinkUrl', tt('linkUrl'), '<input id="abeneLinkUrl" type="text" inputmode="url" autocomplete="off" value="' + esc(href) + '">') +
            '<p class="abene-proof-hint">' + esc(tt('linkHint') || 'Site, e-mail ou #secção. Ctrl+clique abre o destino.') + '</p>' +
            field('abeneLinkText', tt('linkText'), '<input id="abeneLinkText" type="text" value="' + esc(text) + '">') +
            field('abeneLinkTarget', tt('linkTarget'),
                '<select id="abeneLinkTarget">' +
                    '<option value="_blank"' + (tgt !== '_self' ? ' selected' : '') + '>' + esc(tt('linkNewTab')) + '</option>' +
                    '<option value="_self"' + (tgt === '_self' ? ' selected' : '') + '>' + esc(tt('linkSameTab')) + '</option>' +
                '</select>'),
            (existing
                ? '<button type="button" class="btn-secondary" onclick="abeneRemoveLink()">' + esc(tt('linkRemove') || 'Remover ligação') + '</button>'
                : '') +
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertLink()">' + esc(tt('ok')) + '</button>'
        );
    };
    function normalizeLinkUrl(url) {
        url = String(url || '').trim();
        if (!url) return '';
        if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url)) return url;
        if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(url)) return 'mailto:' + url;
        if (/^www\./i.test(url) || /^[\w.-]+\.[a-z]{2,}([\/:?#]|$)/i.test(url)) return 'https://' + url;
        return url;
    }
    function isOkLink(url) {
        return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url);
    }
    window.abeneApplyInsertLink = function () {
        var url = normalizeLinkUrl(val('abeneLinkUrl'));
        var text = (val('abeneLinkText') || '').trim();
        var target = val('abeneLinkTarget') === '_self' ? '_self' : '_blank';
        if (!isOkLink(url)) {
            if (typeof showToast === 'function') showToast(tt('aBadUrl'));
            return;
        }
        if (typeof closeModal === 'function') closeModal('genericModal');
        var existing = window._abeneLinkEl;
        window._abeneLinkEl = null;
        if (existing && existing.parentNode) {
            existing.setAttribute('href', url);
            if (target === '_blank') {
                existing.setAttribute('target', '_blank');
                existing.setAttribute('rel', 'noopener noreferrer');
            } else {
                existing.setAttribute('target', '_self');
                existing.removeAttribute('rel');
            }
            if (!existing.getAttribute('style') || existing.style.color === '') existing.style.color = '#2b579a';
            if (text) existing.textContent = text;
            if (typeof saveUndoState === 'function') saveUndoState();
            return;
        }
        restoreCaret();
        var display = text || url;
        var extra = target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : ' target="_self"';
        insertViaCommands(
            '<a href="' + esc(url) + '"' + extra + ' style="color:#2b579a;">' + esc(display) + '</a>');
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.abeneRemoveLink = function () {
        var existing = window._abeneLinkEl;
        window._abeneLinkEl = null;
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (!existing || !existing.parentNode) return;
        var parent = existing.parentNode;
        while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
        parent.removeChild(existing);
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    document.addEventListener('click', function (ev) {
        var a = ev.target && ev.target.closest && ev.target.closest('#editor a[href]');
        if (!a) return;
        if (a.closest && a.closest('.page-header-zone, .page-footer-zone')) return;
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) === '#') {
            ev.preventDefault();
            if (typeof window.abeneJumpToAnchor === 'function') window.abeneJumpToAnchor(href.slice(1));
            return;
        }
        ev.preventDefault();
        if (ev.ctrlKey || ev.metaKey) {
            if (href) {
                try { window.open(href, '_blank', 'noopener,noreferrer'); } catch (eO) {}
            }
        }
    }, true);

    function commentAuthor() {
        try { return localStorage.getItem('abeneAuthor') || tt('aAuthor') || 'Autor'; } catch (e) { return 'Autor'; }
    }
    function commentWhen() {
        var loc = 'pt-PT';
        try { loc = localStorage.getItem('abeneLanguage') || loc; } catch (eL) {}
        return new Date().toLocaleString(loc);
    }
    function closestComment() {
        var editor = editorEl();
        var sel = window.getSelection();
        var n = sel && sel.rangeCount ? sel.anchorNode : null;
        if (n && n.nodeType === 3) n = n.parentNode;
        while (n && n !== editor) {
            if (n.nodeType === 1 && ((n.getAttribute && n.getAttribute('data-comment') != null) || (n.classList && n.classList.contains('comment-anchor')))) {
                return n;
            }
            n = n.parentNode;
        }
        return null;
    }
    function markComment(el, text, author, date) {
        el.classList.add('comment-anchor');
        el.setAttribute('data-comment', text);
        el.setAttribute('data-comment-author', author || '');
        el.setAttribute('data-comment-date', date || '');
        el.style.background = '#fff3cd';
        el.style.borderBottom = '2px solid #ffc107';
        var tip = (tt('commentPrefix') || 'Comentário: ') + text;
        if (author) tip += ' — ' + author;
        if (date) tip += ' (' + date + ')';
        el.title = tip;
    }
    function unwrapComment(el) {
        if (!el || !el.parentNode) return;
        var parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
    }
    var origInsertComment = window.insertComment;
    window.insertComment = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') {
            if (typeof origInsertComment === 'function') return origInsertComment.apply(this, arguments);
            return;
        }
        var existing = closestComment();
        var sel = window.getSelection();
        if (!existing && (!sel || !sel.rangeCount || sel.isCollapsed)) {
            if (typeof showToast === 'function') showToast(tt('commentNeedSel'));
            return;
        }
        window._abeneCommentEl = existing || null;
        saveCaret();
        var meta = '';
        if (existing) {
            var who = existing.getAttribute('data-comment-author') || '';
            var when = existing.getAttribute('data-comment-date') || '';
            if (who || when) meta = '<p class="abene-proof-hint">' + esc(who) + (when ? ' · ' + esc(when) : '') + '</p>';
        }
        openGenericModal(existing ? (tt('commentEdit') || 'Editar comentário') : tt('comment'),
            field('abeneCommentText', tt('pComment'),
                '<textarea id="abeneCommentText" rows="4">' + esc(existing ? (existing.getAttribute('data-comment') || '') : '') + '</textarea>') + meta,
            (existing
                ? '<button type="button" class="btn-secondary" onclick="abeneRemoveComment()">' + esc(tt('commentRemove') || 'Remover comentário') + '</button>'
                : '') +
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyComment()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.insertComment._abeneModals = true;
    window.insertComment._legacy = origInsertComment;
    window.abeneApplyComment = function () {
        var text = (val('abeneCommentText') || '').trim();
        if (!text) {
            if (typeof showToast === 'function') showToast(tt('commentNeedText') || 'Escreva o comentário.');
            return;
        }
        var existing = window._abeneCommentEl;
        window._abeneCommentEl = null;
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (existing && existing.parentNode) {
            markComment(existing, text, existing.getAttribute('data-comment-author') || commentAuthor(),
                existing.getAttribute('data-comment-date') || commentWhen());
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof window.refreshCommentsPane === 'function') window.refreshCommentsPane();
            return;
        }
        restoreCaret();
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) {
            if (typeof showToast === 'function') showToast(tt('commentNeedSel'));
            return;
        }
        var range = sel.getRangeAt(0);
        var span = document.createElement('span');
        markComment(span, text, commentAuthor(), commentWhen());
        try { range.surroundContents(span); } catch (eW) {
            span.appendChild(range.extractContents());
            range.insertNode(span);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof window.toggleCommentsPane === 'function') window.toggleCommentsPane(true);
        else if (typeof window.refreshCommentsPane === 'function') window.refreshCommentsPane();
    };
    window.abeneRemoveComment = function () {
        var el = window._abeneCommentEl;
        window._abeneCommentEl = null;
        if (typeof closeModal === 'function') closeModal('genericModal');
        unwrapComment(el);
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof window.refreshCommentsPane === 'function') window.refreshCommentsPane();
    };
    window.abeneEditCommentAt = function (index) {
        var editor = editorEl();
        if (!editor) return;
        var comments = editor.querySelectorAll('[data-comment], .comment-anchor');
        var el = comments[index];
        if (!el) return;
        window._abeneCommentI = index;
        try {
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (eS) {}
        window.insertComment();
    };
    var origRefreshComments = window.refreshCommentsPane;
    var origNavigateComment = window.navigateComment;
    window.refreshCommentsPane = function () {
        var body = document.getElementById('commentsPaneBody');
        var editor = editorEl();
        if (!body || !editor) {
            if (typeof origRefreshComments === 'function') return origRefreshComments.apply(this, arguments);
            return;
        }
        var comments = editor.querySelectorAll('[data-comment], .comment-anchor');
        if (!comments.length) {
            body.innerHTML = '<p class="abene-proof-hint">' + esc(tt('commentEmpty') || 'Nenhum comentário.') + '</p>';
            return;
        }
        var i0 = window._abeneCommentI || 0;
        if (i0 >= comments.length) i0 = comments.length - 1;
        if (i0 < 0) i0 = 0;
        window._abeneCommentI = i0;
        body.innerHTML = '';
        var nav = document.createElement('div');
        nav.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;';
        function navBtn(step, label) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-secondary';
            b.textContent = label;
            b.addEventListener('click', function () { window.navigateComment(step); });
            nav.appendChild(b);
        }
        navBtn(-1, tt('commentPrev') || 'Anterior');
        navBtn(1, tt('commentNext') || 'Seguinte');
        body.appendChild(nav);
        Array.prototype.forEach.call(comments, function (node, i) {
            var text = node.getAttribute('data-comment') || node.title || String(node.textContent || '').slice(0, 80);
            var author = node.getAttribute('data-comment-author') || '';
            var date = node.getAttribute('data-comment-date') || '';
            var row = document.createElement('div');
            row.className = 'comment-row';
            if (i === i0) row.style.borderLeft = '3px solid #2563eb';
            var head = document.createElement('strong');
            head.textContent = '#' + (i + 1);
            row.appendChild(head);
            if (author || date) {
                var meta = document.createElement('div');
                meta.className = 'abene-proof-hint';
                meta.textContent = author + (date ? (author ? ' · ' : '') + date : '');
                row.appendChild(meta);
            }
            var p = document.createElement('p');
            p.textContent = text;
            row.appendChild(p);
            var edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'btn-secondary';
            edit.textContent = tt('commentEditBtn') || 'Editar';
            edit.addEventListener('click', function (ev) {
                ev.stopPropagation();
                window.abeneEditCommentAt(i);
            });
            var resolve = document.createElement('button');
            resolve.type = 'button';
            resolve.className = 'btn-secondary';
            resolve.textContent = tt('commentResolve') || 'Resolver';
            resolve.addEventListener('click', function (ev) {
                ev.stopPropagation();
                if (typeof window.resolveComment === 'function') window.resolveComment(i);
                else {
                    unwrapComment(node);
                    if (typeof saveUndoState === 'function') saveUndoState();
                    window.refreshCommentsPane();
                }
            });
            row.appendChild(edit);
            row.appendChild(resolve);
            row.addEventListener('click', function (ev) {
                if (ev.target && ev.target.closest && ev.target.closest('button')) return;
                window._abeneCommentI = i;
                try { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eV) {}
                window.refreshCommentsPane();
            });
            body.appendChild(row);
        });
    };
    window.refreshCommentsPane._legacy = origRefreshComments;
    window.navigateComment = function (step) {
        var editor = editorEl();
        if (!editor) {
            if (typeof origNavigateComment === 'function') return origNavigateComment.apply(this, arguments);
            return;
        }
        var comments = editor.querySelectorAll('[data-comment], .comment-anchor');
        if (!comments.length) return;
        var i = ((window._abeneCommentI || 0) + step + comments.length) % comments.length;
        window._abeneCommentI = i;
        try { comments[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eN) {}
        window.refreshCommentsPane();
    };
    window.navigateComment._legacy = origNavigateComment;

    document.addEventListener('dblclick', function (ev) {
        var el = ev.target && ev.target.closest && ev.target.closest('#editor [data-comment], #editor .comment-anchor');
        if (!el) return;
        ev.preventDefault();
        try {
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (eD) {}
        window.insertComment();
    });

    window.openTypographyModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        var fonts = ['Calibri', 'Arial', 'Times New Roman', 'Roboto', 'Georgia', 'Courier New', 'Verdana', 'Tahoma', 'Garamond', 'Trebuchet MS'];
        var ff = document.getElementById('fontFamily');
        var fs = document.getElementById('fontSize');
        var curFont = ff && ff.value ? ff.value : 'Calibri';
        var curSize = fs && fs.value ? fs.value : '11';
        openGenericModal(tt('typoTitle'),
            field('abeneTyFont', tt('dlgFont'),
                '<select id="abeneTyFont">' + fonts.map(function (f) {
                    return '<option value="' + esc(f) + '"' + (f === curFont ? ' selected' : '') + ' style="font-family:' + esc(f) + '">' + esc(f) + '</option>';
                }).join('') + '</select>') +
            '<div class="form-row">' +
                field('abeneTySize', tt('dlgSizePt'), '<input id="abeneTySize" type="number" min="1" max="1638" step="0.5" value="' + esc(curSize) + '">') +
                field('abeneTyAlign', tt('dlgAlign'),
                    '<select id="abeneTyAlign">' +
                        '<option value="left">' + esc(tt('alignLeft')) + '</option>' +
                        '<option value="center">' + esc(tt('alignCenter')) + '</option>' +
                        '<option value="right">' + esc(tt('alignRight')) + '</option>' +
                        '<option value="justify">' + esc(tt('dlgJustify')) + '</option>' +
                    '</select>') +
            '</div>' +
            '<div class="chk-row">' +
                '<label><input type="checkbox" id="abeneTyBold"> <b>' + esc(tt('boldLetter')) + '</b></label>' +
                '<label><input type="checkbox" id="abeneTyItalic"> <i>' + esc(tt('italicLetter')) + '</i></label>' +
                '<label><input type="checkbox" id="abeneTyUnder"> <u>' + esc(tt('dlgUnderline')) + '</u></label>' +
                '<label><input type="checkbox" id="abeneTyStrike"> <s>' + esc(tt('dlgStrike')) + '</s></label>' +
                '<label><input type="checkbox" id="abeneTySuper">' + esc(tt('dlgSuper')) + '</label>' +
                '<label><input type="checkbox" id="abeneTySub">' + esc(tt('dlgSub')) + '</label>' +
            '</div>' +
            '<div class="form-row">' +
                field('abeneTyLine', tt('dlgLineRule'),
                    '<select id="abeneTyLine">' +
                        '<option value="1">1.0</option>' +
                        '<option value="1.15" selected>1.15</option>' +
                        '<option value="1.5">1.5</option>' +
                        '<option value="2">2.0</option>' +
                    '</select>') +
                field('abeneTyBefore', tt('dlgBefore'), '<input id="abeneTyBefore" type="number" min="0" value="0">') +
                field('abeneTyAfter', tt('dlgAfter'), '<input id="abeneTyAfter" type="number" min="0" value="8">') +
            '</div>' +
            '<p style="font-size:11px;color:#666;margin-top:8px;">' +
                '<a href="#" onclick="closeModal(\'genericModal\');openFontDialog();return false;">' + esc(tt('dlgFont')) + '</a> · ' +
                '<a href="#" onclick="closeModal(\'genericModal\');openParagraphDialog();return false;">' + esc(tt('dlgPara')) + '</a>' +
            '</p>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyTypography()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abeneApplyTypography = function () {
        var font = val('abeneTyFont');
        var size = val('abeneTySize');
        var align = val('abeneTyAlign');
        var line = val('abeneTyLine');
        var before = val('abeneTyBefore');
        var after = val('abeneTyAfter');
        var bold = checked('abeneTyBold');
        var italic = checked('abeneTyItalic');
        var under = checked('abeneTyUnder');
        var strike = checked('abeneTyStrike');
        var sup = checked('abeneTySuper');
        var sub = checked('abeneTySub');
        if (typeof closeModal === 'function') closeModal('genericModal');
        restoreCaret();
        var editor = editorEl();
        if (editor) editor.focus();
        if (font && typeof window.changeFontFamily === 'function') window.changeFontFamily(font);
        if (size && typeof window.changeFontSize === 'function') window.changeFontSize(size);
        function tyExec(cmd) {
            if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.exec === 'function') {
                return window.EditorCommands.exec(cmd);
            }
            document.execCommand(cmd);
        }
        if (bold) tyExec('bold');
        if (italic) tyExec('italic');
        if (under) tyExec('underline');
        if (strike) tyExec('strikeThrough');
        if (sup) tyExec('superscript');
        if (sub) tyExec('subscript');
        var alignCmd = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' };
        if (align && alignCmd[align]) tyExec(alignCmd[align]);
        var block = currentBlock();
        if (block) {
            if (line) block.style.lineHeight = line;
            block.style.marginTop = (before || '0') + 'pt';
            block.style.marginBottom = (after || '8') + 'pt';
            if (align) block.style.textAlign = align;
        } else if (typeof window.changeLineSpacing === 'function') {
            window.changeLineSpacing(line);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.openExportModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        function btn(fn, icon, label) {
            return '<button type="button" class="btn-secondary" style="width:100%;text-align:left;margin-bottom:8px;" onclick="closeModal(\'genericModal\');' + fn + '()">' +
                icon + ' ' + esc(label) + '</button>';
        }
        // Export only — never confuse with Guardar/Save (which never downloads).
        var title = tt('exportAsTitle') || tt('exportDoc') || tt('saveAsTitle');
        var hint = tt('exportAsHint') || tt('saveAsHint') || '';
        openGenericModal(title,
            (hint ? ('<p class="save-as-hint">' + esc(hint) + '</p>') : '') +
            btn('exportDocx', '📘', tt('exportAsWordFaithful') || tt('exportAsWord') || tt('fileDocx')) +
            btn('exportDocxEditable', '✏️', tt('exportAsWordEditable') || tt('exportAsWord') || tt('fileDocx')) +
            btn('exportPDF', '📥', tt('exportAsPdf') || tt('saveAsPdf') || tt('filePdf')) +
            btn('saveForAccountant', '📊', tt('saveAsAcct') || tt('acctCsv')) +
            btn('exportWord', '📄', tt('fileDoc')) +
            btn('exportHtml', '🌐', tt('exportHtml')) +
            btn('saveAsText', '📝', tt('fileSaveTxt')) +
            btn('exportMarkdown', '📑', tt('fileMd')),
            '<button class="btn-primary" onclick="closeModal(\'genericModal\')">' + esc(tt('close') || tt('ok')) + '</button>'
        );
    };
    window.exportHtml = function () {
        var html = typeof persistableEditorHtml === 'function' ? persistableEditorHtml() : (editorEl() ? editorEl().innerHTML : '');
        var name = (window.documentState && documentState.name) || 'document';
        var doc = '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><title>' + esc(name) + '</title></head><body>' + html + '</body></html>';
        if (typeof downloadFile === 'function') downloadFile(doc, name + '.html', 'text/html');
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
    };

    document.addEventListener('DOMContentLoaded', restoreBg);
    if (document.readyState !== 'loading') restoreBg();

    function winHint() {
        return typeof window.t === 'function' ? window.t('winDrag') : 'Arraste a barra de título para o lado e veja o documento.';
    }
    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function pt(e) {
        if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }
    function resetBox(box, overlay) {
        if (overlay) overlay.classList.remove('abene-win-moved');
        box.style.left = '';
        box.style.top = '';
        box.style.right = '';
        box.style.position = '';
        box.style.margin = '';
        box.style.width = '';
        box.classList.remove('is-dragging');
        box.removeAttribute('data-abene-docked');
    }
    function hitUi(el) {
        var n = el && el.nodeType === 1 ? el : (el && el.parentElement);
        return n && n.closest && n.closest('button, a, input, select, textarea, .modal-close');
    }
    function place(box, x, y, w) {
        box.style.left = clamp(x, 8 - Math.max(0, w - 96), window.innerWidth - 96) + 'px';
        box.style.top = clamp(y, 8, window.innerHeight - 56) + 'px';
    }
    function snapAside(box) {
        var r = box.getBoundingClientRect();
        var edge = 56;
        if (r.left < edge) box.style.left = '12px';
        else if (r.right > window.innerWidth - edge) {
            box.style.left = Math.max(12, window.innerWidth - r.width - 12) + 'px';
        }
    }
    function clampDocked() {
        document.querySelectorAll('[data-abene-docked="1"]').forEach(function (box) {
            var r = box.getBoundingClientRect();
            place(box, r.left, r.top, r.width);
        });
    }
    function bindDrag(header, box, overlay) {
        if (!header || !box || header.getAttribute('data-abene-drag') === '1') return;
        header.setAttribute('data-abene-drag', '1');
        header.setAttribute('data-i18n-title', 'winDrag');
        header.title = winHint();
        function start(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            if (hitUi(e.target)) return;
            if (window.innerWidth <= 820 || document.body.classList.contains('abene-phone')) return;
            e.preventDefault();
            var r = box.getBoundingClientRect();
            var p = pt(e);
            if (overlay) overlay.classList.add('abene-win-moved');
            box.style.position = 'fixed';
            box.style.left = r.left + 'px';
            box.style.top = r.top + 'px';
            box.style.margin = '0';
            box.style.width = r.width + 'px';
            box.style.right = 'auto';
            box.setAttribute('data-abene-docked', '1');
            box.classList.add('is-dragging');
            var ox = p.x - r.left;
            var oy = p.y - r.top;
            var w = r.width;
            function move(ev) {
                ev.preventDefault();
                var q = pt(ev);
                place(box, q.x - ox, q.y - oy, w);
            }
            function stop() {
                box.classList.remove('is-dragging');
                snapAside(box);
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', stop);
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', stop);
        }
        header.addEventListener('mousedown', start);
        header.addEventListener('touchstart', start, { passive: false });
        header.addEventListener('dblclick', function (e) {
            if (hitUi(e.target)) return;
            resetBox(box, overlay);
        });
    }
    function watchOverlay(overlay) {
        var modal = overlay.querySelector('.modal');
        var header = modal && modal.querySelector('.modal-header');
        if (!header) return;
        bindDrag(header, modal, overlay);
        var prev = overlay.classList.contains('visible');
        var obs = new MutationObserver(function () {
            var now = overlay.classList.contains('visible');
            if (now && !prev) resetBox(modal, overlay);
            prev = now;
        });
        obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }
    function initWinDrag() {
        document.querySelectorAll('.modal-overlay:not(.paper-preview-overlay)').forEach(watchOverlay);
        var find = document.getElementById('findReplacePanel');
        if (find) bindDrag(find.querySelector('.find-replace-header'), find, null);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWinDrag);
    else initWinDrag();
    window.addEventListener('resize', clampDocked);
    var prevI18n = window.abeneAfterI18n;
    window.abeneAfterI18n = function (lang) {
        if (typeof prevI18n === 'function') prevI18n(lang);
        document.querySelectorAll('[data-abene-drag="1"]').forEach(function (h) { h.title = winHint(); });
    };

    var origAddWatermark = window.addWatermark;
    window.addWatermark = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') {
            if (typeof origAddWatermark === 'function') return origAddWatermark.apply(this, arguments);
            return;
        }
        var cur = typeof window.abeneReadWatermarkSpec === 'function' ? window.abeneReadWatermarkSpec() : null;
        var text = (cur && cur.text) || tt('pWatermarkDef') || 'CONFIDENCIAL';
        var hex = (cur && cur.hex) || '#c8c8c8';
        var size = (cur && cur.size) || 56;
        openGenericModal(tt('watermark'),
            '<p class="abene-proof-hint">' + esc(tt('wmHint') || '') + '</p>' +
            field('abeneWmText', tt('pWatermark'),
                '<input id="abeneWmText" type="text" value="' + esc(text) + '">') +
            field('abeneWmColor', tt('wmColor') || 'Cor',
                '<input id="abeneWmColor" type="color" value="' + esc(hex) + '">') +
            field('abeneWmSize', tt('wmSize') || 'Tamanho (pt)',
                '<input id="abeneWmSize" type="number" min="24" max="120" value="' + esc(String(size)) + '">'),
            (cur
                ? '<button type="button" class="btn-secondary" onclick="abeneClearWatermark()">' + esc(tt('wmRemove')) + '</button>'
                : '') +
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneSubmitWatermark()">' + esc(tt('ok')) + '</button>'
        );
        setTimeout(function () {
            var inp = document.getElementById('abeneWmText');
            if (inp) { inp.focus(); inp.select(); }
        }, 30);
    };
    window.addWatermark._abeneModals = true;
    window.addWatermark._legacy = origAddWatermark;
    window.abeneSubmitWatermark = function () {
        var text = (val('abeneWmText') || '').trim();
        var color = val('abeneWmColor') || '#c8c8c8';
        var size = parseFloat(val('abeneWmSize')) || 56;
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (typeof window.abeneApplyWatermarkSpec === 'function') {
            window.abeneApplyWatermarkSpec({ text: text, color: color, size: size }, { toast: true });
            return;
        }
        if (typeof origAddWatermark === 'function') origAddWatermark();
    };
    window.abeneClearWatermark = function () {
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (typeof window.abeneApplyWatermarkSpec === 'function') {
            window.abeneApplyWatermarkSpec({ text: '' }, { toast: true });
        } else if (typeof window.applyWatermarkPreset === 'function') {
            window.applyWatermarkPreset('');
        }
    };

    /* Inserir → Captura : recorte de zona após o ecrã (sem apagar o getDisplayMedia). */
    (function wrapCaptureCrop() {
        var crop = { x0: 0, y0: 0, x1: 0, y1: 0, drag: false, src: '' };
        function toast(msg) {
            if (typeof showToast === 'function') showToast(msg);
        }
        function insertSrc(src) {
            restoreCaret();
            if (typeof window.abeneInsertPicture === 'function') {
                window.abeneInsertPicture(src, { alt: tt('capture') || 'Captura' });
            } else {
                insertViaCommands('<img data-illustration="true" src="' + esc(src) + '" style="max-width:100%;height:auto;" alt="Captura">');
            }
            toast(tt('imgInsertedOk') || 'Imagem inserida.');
            if (typeof saveUndoState === 'function') saveUndoState();
        }
        function bindCrop() {
            var img = document.getElementById('abeneCropImg');
            var sel = document.getElementById('abeneCropSel');
            var box = document.getElementById('abeneCropBox');
            if (!img || !sel || !box || box._abeneCrop) return;
            box._abeneCrop = true;
            function pos(ev) {
                var r = img.getBoundingClientRect();
                return {
                    x: Math.max(0, Math.min(r.width, ev.clientX - r.left)),
                    y: Math.max(0, Math.min(r.height, ev.clientY - r.top))
                };
            }
            function paint() {
                var x = Math.min(crop.x0, crop.x1);
                var y = Math.min(crop.y0, crop.y1);
                var w = Math.abs(crop.x1 - crop.x0);
                var h = Math.abs(crop.y1 - crop.y0);
                if (w < 4 || h < 4) { sel.style.display = 'none'; return; }
                sel.style.display = 'block';
                sel.style.left = x + 'px';
                sel.style.top = y + 'px';
                sel.style.width = w + 'px';
                sel.style.height = h + 'px';
            }
            function onMove(ev) {
                if (!crop.drag) return;
                var p = pos(ev);
                crop.x1 = p.x;
                crop.y1 = p.y;
                paint();
            }
            function onUp() {
                crop.drag = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            box.addEventListener('mousedown', function (ev) {
                if (ev.button !== 0) return;
                ev.preventDefault();
                var p = pos(ev);
                crop.drag = true;
                crop.x0 = crop.x1 = p.x;
                crop.y0 = crop.y1 = p.y;
                paint();
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }
        window.abeneShowCaptureCrop = function (src) {
            crop.src = src;
            crop.x0 = crop.y0 = crop.x1 = crop.y1 = 0;
            crop.drag = false;
            if (typeof openGenericModal !== 'function') {
                insertSrc(src);
                return;
            }
            openGenericModal(tt('capture') || tt('imgCapture') || 'Captura',
                '<p style="font-size:12px;margin:0 0 8px;">' + esc(tt('captureCrop')) + '</p>' +
                '<div id="abeneCropBox" style="position:relative;display:inline-block;max-width:100%;cursor:crosshair;">' +
                    '<img id="abeneCropImg" alt="" src="' + esc(src) + '" style="max-width:100%;max-height:280px;display:block;">' +
                    '<div id="abeneCropSel" style="position:absolute;display:none;border:1px dashed #2b579a;background:rgba(43,87,154,.18);pointer-events:none;box-sizing:border-box;"></div>' +
                '</div>',
                '<button type="button" class="btn-secondary" onclick="abeneCancelCaptureCrop()">' + esc(tt('cancel')) + '</button>' +
                '<button type="button" class="btn-secondary" onclick="abeneApplyCaptureCrop(true)">' + esc(tt('captureFull')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneApplyCaptureCrop(false)">' + esc(tt('ok')) + '</button>'
            );
            setTimeout(bindCrop, 40);
        };
        window.abeneCancelCaptureCrop = function () {
            crop.src = '';
            if (typeof closeModal === 'function') closeModal('genericModal');
        };
        window.abeneApplyCaptureCrop = function (full) {
            var src = crop.src;
            var imgEl = document.getElementById('abeneCropImg');
            var wDisp = imgEl ? imgEl.clientWidth : 0;
            var hDisp = imgEl ? imgEl.clientHeight : 0;
            var nw = imgEl ? imgEl.naturalWidth : 0;
            var nh = imgEl ? imgEl.naturalHeight : 0;
            var x = Math.min(crop.x0, crop.x1);
            var y = Math.min(crop.y0, crop.y1);
            var w = Math.abs(crop.x1 - crop.x0);
            var h = Math.abs(crop.y1 - crop.y0);
            if (typeof closeModal === 'function') closeModal('genericModal');
            crop.src = '';
            if (!src) return;
            if (full || w < 8 || h < 8 || !nw || !wDisp) {
                insertSrc(src);
                return;
            }
            var sx = x * nw / wDisp;
            var sy = y * nh / hDisp;
            var sw = w * nw / wDisp;
            var sh = h * nh / hDisp;
            var c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(sw));
            c.height = Math.max(1, Math.round(sh));
            var im = new Image();
            im.onload = function () {
                var ctx = c.getContext('2d');
                if (ctx) ctx.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
                insertSrc(c.toDataURL('image/jpeg', 0.86));
            };
            im.src = src;
        };
        var orig = window.captureScreen;
        window.captureScreen = function () {
            saveCaret();
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                if (typeof orig === 'function') return orig.apply(this, arguments);
                toast(tt('aNoCapture'));
                return;
            }
            return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(function (stream) {
                var video = document.createElement('video');
                video.muted = true;
                video.setAttribute('playsinline', 'true');
                video.srcObject = stream;
                function grab() {
                    var vw = video.videoWidth || 1280;
                    var vh = video.videoHeight || 720;
                    var canvas = document.createElement('canvas');
                    canvas.width = vw;
                    canvas.height = vh;
                    var ctx = canvas.getContext('2d');
                    if (ctx) ctx.drawImage(video, 0, 0, vw, vh);
                    stream.getTracks().forEach(function (tr) { tr.stop(); });
                    try { video.srcObject = null; } catch (eS) {}
                    window.abeneShowCaptureCrop(canvas.toDataURL('image/jpeg', 0.82));
                }
                return video.play().then(function () {
                    return new Promise(function (resolve) {
                        if (video.videoWidth) { resolve(); return; }
                        video.onloadeddata = function () { resolve(); };
                        setTimeout(resolve, 250);
                    });
                }).then(grab);
            }).catch(function (err) {
                if (err && err.name === 'NotAllowedError') return;
                toast(tt('aCaptureFail'));
            });
        };
        window.captureScreen._abeneCaptureCrop = true;
        window.captureScreen._legacy = orig;
    })();
})();
